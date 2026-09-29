"""Independently check metrics, measurement references and stored predictions."""
from pathlib import Path
import argparse,json,hashlib
import numpy as np
import pandas as pd
import joblib
from cmp_ml.common import USAGE
from cmp_ml.team_preprocessing import read_archive,FoldPreprocessor,KEY,CONDITIONS
from cmp_ml.team_models import history_matrix,matrices

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_team_comparison_v1'
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main(archive):
    done=json.loads((RUN/'completion.json').read_text(encoding='utf-8'))
    for p,h in done['hashes'].items():assert digest(RUN/p)==h,p
    protocol=json.loads((RUN/'protocol.json').read_text(encoding='utf-8'))
    for p,h in protocol['code_hashes'].items():assert digest(ROOT/p)==h,p
    assert digest(archive)==protocol['input_sha256']['archive']
    pred=pd.read_csv(RUN/'predictions.csv.gz'); stored=pd.read_csv(RUN/'metrics.csv')
    manifest=pd.read_csv(RUN/'manifest.csv'); byid=manifest.set_index('sample_id')
    assert len(manifest)==1977 and not manifest.duplicated(KEY).any()
    assert not pred.duplicated(['fold','policy','model','sample_id']).any()
    np.testing.assert_allclose(pred.truth,pred.sample_id.map(byid.mrr),rtol=0,atol=1e-9)
    checked=0
    for r in stored.itertuples(index=False):
        q=pred[(pred.fold==r.fold)&(pred.policy==r.policy)&(pred.model==r.model)]
        if r.subgroup=='sensor_all':q=q[q.recipe.ne('A123')]
        elif r.subgroup=='pressure_shift':q=q[q.recipe.ne('A123')&q.flag_pressure_shift.eq(1)]
        elif r.subgroup=='without_pressure_shift':q=q[q.recipe.ne('A123')&q.flag_pressure_shift.eq(0)]
        elif r.subgroup!='all_routes':q=q[q.recipe.eq(r.subgroup)]
        assert len(q)==r.n
        e=q.prediction.to_numpy()-q.truth.to_numpy()
        np.testing.assert_allclose([np.mean(abs(e)),np.mean(e*e),np.sqrt(np.mean(e*e))],
                                  [r.mae,r.mse,r.rmse],rtol=1e-12,atol=1e-12)
        checked+=1
    for (fold,policy,model),q in pred.groupby(['fold','policy','model']):
        wanted=manifest[manifest.fold.eq(fold)]
        if model not in ['recipe_mean','persistent','ewma']:wanted=wanted[wanted.recipe.ne('A123')]
        assert set(q.sample_id)==set(wanted.sample_id)
    schedule=pd.read_csv(RUN/'measurement_schedule.csv').set_index('sample_id')
    refs=pd.read_csv(RUN/'history_references.csv.gz').fillna({'state_reference_ids':'','lag_ids':'','neighbor_ids':''})
    total=0; max_reload=0.; partition_maps={}
    for fold in range(2,6):
        p=pd.read_csv(RUN/f'partition_fold{fold}.csv')
        train=set(p.loc[p.role.eq('train'),'sample_id']); query=set(p.loc[p.role.eq('evaluation'),'sample_id'])
        assert not set(byid.loc[list(train)].wafer_id)&set(byid.loc[list(query)].wafer_id)
        cutoff=byid.loc[list(query)].start.min()
        assert schedule.loc[list(train)].delay5.lt(cutoff).all()
        partition_maps[fold]=(train,query)
    for r in refs.itertuples(index=False):
        train,query=partition_maps[r.partition]
        expected=train if r.policy.startswith('training') or r.policy=='frozen' else train|query
        allowed_query=train if r.policy.startswith('training') else query
        assert r.query_id in allowed_query
        ids=r.state_reference_ids.split(';') if r.state_reference_ids else []
        assert len(ids)==r.n_references and len(ids)==len(set(ids))
        assert set(ids)<=expected
        assert set(r.lag_ids.split(';') if r.lag_ids else [])<=set(ids)
        assert set(r.neighbor_ids.split(';') if r.neighbor_ids else [])<=set(ids)
        if ids:
            q=byid.loc[r.query_id]; source=byid.loc[ids]
            assert source.recipe.eq(q.recipe).all() and source.wafer_id.ne(q.wafer_id).all()
            name='delay5' if r.policy.endswith('5') else 'delay0'
            assert schedule.loc[ids,name].lt(q.start).all()
        total+=len(ids)
    supplied,_=read_archive(archive)
    old=pd.read_csv(ROOT/'.cache/staged/phm_cmp_staged_v4/training.csv.gz')
    old=old[~old.excluded_extreme]
    full=sorted(c for c in old if c.startswith('p2_')); primary=[c for c in full if c.startswith('p2_primary_')]
    frame=supplied.merge(old[['sample_id','WAFER_ID','STAGE','machine','start','end']+full],
        left_on=KEY,right_on=['WAFER_ID','STAGE'],validate='one_to_one').sort_values('t_start').reset_index(drop=True)
    releases={d:frame.sample_id.map(schedule['delay'+str(d)]) for d in [0,5]}
    usage=[f'p2_primary_{c}_mean' for c in USAGE]
    files_verified=set(); queried_predictions=0
    for fold in range(2,6):
        train_ids,query_ids=partition_maps[fold]
        prep=FoldPreprocessor(**json.loads((RUN/f'preprocessor_fold{fold}.json').read_text()))
        independently_fit=FoldPreprocessor.fit(frame[frame.sample_id.isin(train_ids)])
        assert prep.steps==independently_fit.steps and prep.medians==independently_fit.medians
        prefix=frame[frame.fold.le(fold)]
        clean=prep.transform(prefix.drop(columns='mrr'));clean['mrr']=prefix.mrr
        clean['_pad_step']=clean.table.map({t:v['pad_step'] for t,v in prep.steps.items()})
        # Actual data prefix invariance: late covariates cannot change earlier transforms.
        altered=prefix.drop(columns='mrr').copy();altered.loc[altered.index[-10:],['u_pad','u_dresser','p_main']]=999999.
        transformed=prep.transform(altered)
        np.testing.assert_allclose(clean.iloc[:-10][CONDITIONS],transformed.iloc[:-10][CONDITIONS],equal_nan=True)
        for recipe in ['A456','B456']:
            tr=clean[clean.sample_id.isin(train_ids)&clean.recipe.eq(recipe)]
            te=clean[clean.sample_id.isin(query_ids)&clean.recipe.eq(recipe)]
            # First, middle and final row cover startup and accumulated online history.
            sample=te.iloc[[0,len(te)//2,len(te)-1]]
            for policy,delay in [('frozen',0),('online',0),('delay5',5)]:
                lib=tr if policy=='frozen' else pd.concat([tr,te]).sort_values('t_start')
                h,_=history_matrix(sample.drop(columns='mrr'),lib,tr,releases[delay],usage,float(tr.mrr.mean()),fold,policy,False)
                X=matrices(sample,h,{'full':full,'primary':primary})
                for features in X:
                    for family in ['rf','bag']:
                        model=features+'_'+family
                        file=RUN/'models'/f'fold{fold}_{recipe}_delay{delay}_{model}.joblib'
                        bundle=joblib.load(file)
                        actual=np.column_stack([m.predict(X[features]) for m in bundle['models']]).mean(axis=1)
                        if bundle['residual']:actual+=h[:,21]
                        expected=pred[(pred.fold==fold)&(pred.policy==policy)&(pred.model==model)].set_index('sample_id').loc[sample.sample_id,'prediction']
                        np.testing.assert_allclose(actual,expected,rtol=1e-12,atol=1e-10)
                        max_reload=max(max_reload,float(abs(actual-expected).max()))
                        files_verified.add(file.name);queried_predictions+=len(sample)
        print(f'Verified fold {fold}',flush=True)
    preserved=json.loads((ROOT/'.cache/team_comparison_v1/preserved.json').read_text())
    assert all(digest(ROOT/p)==h for p,h in preserved.items())
    result={'status':'passed','metric_rows_recomputed':checked,'history_references_checked':total,
        'history_query_rows':len(refs),'noncausal_references':0,'excluded_or_same_wafer_references':0,
        'model_files_reloaded':len(files_verified),'prediction_spot_checks':queried_predictions,
        'max_reload_difference':max_reload,'fold_calibration_verified':4,
        'actual_future_covariate_invariance_checks':4,'old_artifacts_unchanged':len(preserved),
        'no_official_validation_or_test_read':True}
    (RUN/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);main(p.parse_args().archive)
