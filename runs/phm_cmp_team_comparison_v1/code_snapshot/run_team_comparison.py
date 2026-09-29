"""Frozen paired time evaluation of team preprocessing; no official Test access."""
from pathlib import Path
from dataclasses import asdict
from importlib.metadata import version
import argparse
import json
import shutil
import hashlib
import subprocess
import numpy as np
import pandas as pd
import joblib
from cmp_ml.common import USAGE
from cmp_ml.staged_models import estimator
from cmp_ml.team_preprocessing import (read_archive,reconstruct_physical,FoldPreprocessor,
    CONDITIONS,KEY,SIGNALS,USAGES)
from cmp_ml.team_models import (SEEDS,availability,purge,history_matrix,matrices,state_predictions)

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_team_comparison_v1'
CACHE=ROOT/'.cache/team_comparison_v1'


def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def write(path,value): Path(path).write_text(json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def metric_rows(predictions):
    rows=[]
    for (fold,policy,model),d in predictions.groupby(['fold','policy','model']):
        subgroups=[('sensor_all',d[d.recipe.ne('A123')]),('all_routes',d)]
        subgroups += [(r,x) for r,x in d.groupby('recipe')]
        sensor=d[d.recipe.ne('A123')]
        subgroups += [('pressure_shift',sensor[sensor.flag_pressure_shift.eq(1)]),
                      ('without_pressure_shift',sensor[sensor.flag_pressure_shift.eq(0)])]
        for label,x in subgroups:
            if not len(x): continue
            e=x.prediction-x.truth
            rows.append({'fold':fold,'policy':policy,'model':model,'subgroup':label,'n':len(x),
                'mae':float(e.abs().mean()),'mse':float(np.square(e).mean()),
                'rmse':float(np.sqrt(np.square(e).mean()))})
    return pd.DataFrame(rows)


def main(archive):
    if RUN.exists(): raise FileExistsError('Use a new run; existing results are immutable')
    RUN.mkdir(); CACHE.mkdir(parents=True,exist_ok=True); (RUN/'models').mkdir()
    supplied,catalog=read_archive(archive)
    tracked=subprocess.check_output(['git','-c',f'safe.directory={ROOT.as_posix()}',
        'ls-files','-z','runs'],cwd=ROOT).decode().split('\0')
    preserved={p:digest(ROOT/p) for p in tracked if p and (ROOT/p).is_file()}
    write(CACHE/'preserved.json',preserved)
    source=ROOT.parent/'.tmp_phm_review/PHM/Dataset/CMP1'
    expected={(r['cohort'],r['file']):r['sha256'] for r in json.loads((ROOT/'runs/phm_cmp_papers_v1/sources.json').read_text())}
    files=sorted((source/'CMP-data/training').glob('CMP-training-[0-9]*.csv'))
    assert len(files)==185
    raw_hashes={p.name:digest(p) for p in files}
    assert all(h==expected['training',n] for n,h in raw_hashes.items())
    raw=pd.concat([pd.read_csv(p) for p in files],ignore_index=True)
    labels=pd.read_csv(source/'CMP-training-removalrate.csv')
    rebuilt,audit=reconstruct_physical(raw,labels)
    merged=supplied.merge(rebuilt,on=KEY,suffixes=('_supplied','_rebuilt'),validate='one_to_one')
    assert len(merged)==1977
    comparisons=[]
    physical=list(SIGNALS.values())+list(USAGES.values())+['t_start','t_end','t_polish','mrr']
    for name in physical:
        a,b=merged[name+'_supplied'],merged[name+'_rebuilt']
        np.testing.assert_allclose(a,b,rtol=1e-10,atol=1e-7,equal_nan=True)
        comparisons.append({'column':name,'max_abs_difference':float((a-b).abs().max()),'matched':True})
    audit.update({'physical_columns_verified':comparisons,'archive_sha256':digest(archive),
        'raw_files':raw_hashes,'label_sha256':digest(source/'CMP-training-removalrate.csv'),
        'source_notes':['README says 45 columns but actual schema is 47.',
            'kp_model.py and fit_kp.py are absent; MAE 2.63 is unverified.',
            'Calibration medians in supplied preprocessing use all dates; revised version fits on each training fold.',
            'Pressure is a correlated recipe bundle, not independently validated causal control.',
            'MRR units are unconfirmed; physical polishing-time output requires unit calibration.']})
    write(RUN/'preprocessing_audit.json',audit)
    # Only verified row-local features come from the supplied table; learned equipment
    # history and flags are replaced by fold-local transforms below.
    cached=ROOT/'.cache/staged/phm_cmp_staged_v4/training.csv.gz'
    old=pd.read_csv(cached)
    old=old[~old.excluded_extreme]
    np.testing.assert_equal(len(old),1977)
    full=sorted(c for c in old if c.startswith('p2_'))
    primary=[c for c in full if c.startswith('p2_primary_')]
    assert len(full)==104 and len(primary)==52
    needed=['sample_id','WAFER_ID','STAGE','machine','start','end','AVG_REMOVAL_RATE']+full
    frame=supplied.merge(old[needed],left_on=KEY,right_on=['WAFER_ID','STAGE'],validate='one_to_one')
    np.testing.assert_allclose(frame.mrr,frame.AVG_REMOVAL_RATE,rtol=0,atol=1e-9)
    frame=frame.sort_values('t_start').reset_index(drop=True)
    frame[['sample_id']+KEY+['recipe','table','fold','start','end','t_start','t_end','mrr']].to_csv(RUN/'manifest.csv',index=False)
    releases={d:availability(frame,d) for d in [0,5]}
    pd.DataFrame({'sample_id':frame.sample_id,'delay0':releases[0],'delay5':releases[5]}).to_csv(RUN/'measurement_schedule.csv',index=False)
    sensor=frame[frame.use_sensor_model.eq(1)].copy()
    state=sensor.groupby('recipe').mrr.transform(lambda s:s.shift().ewm(alpha=.4).mean())
    reference=[]
    for f in range(2,6):
        a,b=sensor[sensor.fold<f],sensor[sensor.fold==f]
        reference.append({'fold':f,'n':len(b),
            'mean_mae':float((b.mrr-b.recipe.map(a.groupby('recipe').mrr.mean())).abs().mean()),
            'ewma_mae':float((b.mrr-state.loc[b.index]).abs().mean())})
    pd.DataFrame(reference).to_csv(RUN/'supplied_example_recomputed.csv',index=False)
    assert round(np.mean([r['mean_mae'] for r in reference]),2)==7.18
    assert round(np.mean([r['ewma_mae'] for r in reference]),2)==2.74
    source_files=[ROOT/'src/cmp_ml/team_preprocessing.py',ROOT/'src/cmp_ml/team_models.py',Path(__file__),
                  ROOT/'src/cmp_ml/staged_models.py',ROOT/'docs/team-comparison-protocol.md']
    (RUN/'code_snapshot').mkdir()
    for p in source_files: shutil.copyfile(p,RUN/'code_snapshot'/p.name)
    shutil.copyfile(ROOT/'docs/team-comparison-protocol.md',RUN/'PROTOCOL.md')
    write(RUN/'protocol.json',{'seeds':SEEDS,'alpha':.4,'policies':['frozen','online','delay5'],
        'input_sha256':{'archive':digest(archive),'legacy_training_cache':digest(cached)},
        'code_hashes':{p.relative_to(ROOT).as_posix():digest(p) for p in source_files},
        'environment':{p:version(p) for p in ['numpy','pandas','scikit-learn','joblib']},
        'scope':'development data only; historical RF/Bagging configurations refitted, not every paper model',
        'missing_original_models':['kp_model.py','fit_kp.py']})
    records=[]; histories=[]; partitions=[]; calibration=[]; reload_checks=[]; model_count=0
    usage=[f'p2_primary_{c}_mean' for c in USAGE]
    for fold in range(2,6):
        fit,q,part=purge(frame,fold); partitions.append(part)
        # Keep one common training set across policies; even delay5 must know every
        # training target by the fold's fit time.
        delayed_unavailable=~releases[5].loc[fit.index].lt(q.start.min())
        part['delayed_labels_purged']=int(delayed_unavailable.sum())
        fit=fit.loc[~delayed_unavailable]
        part['final_train_n']=len(fit)
        prep=FoldPreprocessor.fit(fit)
        write(RUN/f'preprocessor_fold{fold}.json',asdict(prep))
        prefix=frame[frame.fold.le(fold)]
        clean=prep.transform(prefix.drop(columns=['mrr','AVG_REMOVAL_RATE']))
        clean['mrr']=prefix.mrr
        clean['_pad_step']=clean.table.map({t:v['pad_step'] for t,v in prep.steps.items()})
        for c in CONDITIONS+['flag_pressure_shift']:
            a,b=clean[c],prefix.loc[clean.index,c]
            changed=~np.isclose(a.to_numpy(float),b.to_numpy(float),equal_nan=True)
            calibration.append({'fold':fold,'column':c,'changed_rows':int(changed.sum()),
                                'query_changed_rows':int(changed[clean.fold.eq(fold)].sum())})
        train=clean.loc[fit.index]; query=clean.loc[q.index]
        # Actual train/query membership is recorded, not just their counts.
        pd.concat([train[['sample_id']].assign(role='train'),query[['sample_id']].assign(role='evaluation')]).to_csv(RUN/f'partition_fold{fold}.csv',index=False)
        for recipe in ['A456','B456','A123']:
            tr=train[train.recipe.eq(recipe)]; te=query[query.recipe.eq(recipe)]
            fallback=float(tr.mrr.mean()); trained={}
            for policy,delay in [('frozen',0),('online',0),('delay5',5)]:
                if delay not in trained:
                    ht,ha=history_matrix(tr.drop(columns='mrr'),tr,tr,releases[delay],usage,fallback,
                                         fold,'training_delay'+str(delay))
                    histories.extend(ha)
                    tm=matrices(tr,ht,{'full':full,'primary':primary})
                    bundles={}
                    if recipe!='A123':
                        for family in ['rf','bag']:
                            for features,X in tm.items():
                                residual=features=='new_state_residual'
                                eligible=ht[:,25]>=5 if residual else np.ones(len(tr),bool)
                                target=tr.mrr.to_numpy()-ht[:,21] if residual else tr.mrr.to_numpy()
                                name=features+'_'+family
                                models=[estimator(family,s).fit(X[eligible],target[eligible]) for s in SEEDS]
                                file=RUN/'models'/f'fold{fold}_{recipe}_delay{delay}_{name}.joblib'
                                joblib.dump({'models':models,'features':CONDITIONS if features=='new_conditions' else features,
                                    'residual':residual,'train_ids':tr.sample_id[eligible].tolist()},file,compress=3)
                                model_count+=len(models)
                                loaded=joblib.load(file)['models']
                                a=np.column_stack([m.predict(X[:3]) for m in models])
                                b=np.column_stack([m.predict(X[:3]) for m in loaded])
                                np.testing.assert_allclose(a,b,atol=0,rtol=0)
                                reload_checks.append({'file':file.name,'max_difference':float(abs(a-b).max()),'n_features':X.shape[1],'train_n':int(eligible.sum())})
                                bundles[name]=(features,models,residual)
                    trained[delay]=bundles
                lib=tr if policy=='frozen' else pd.concat([tr,te]).sort_values('t_start')
                h,ha=history_matrix(te.drop(columns='mrr'),lib,tr,releases[delay],usage,fallback,fold,policy)
                histories.extend(ha)
                qm=matrices(te,h,{'full':full,'primary':primary})
                predictions=state_predictions(h,fallback)
                for name,(features,models,residual) in trained[delay].items():
                    predictions[name]=np.column_stack([m.predict(qm[features]) for m in models]).mean(axis=1)
                    if residual: predictions[name]+=h[:,21]
                for name,prediction in predictions.items():
                    assert np.isfinite(prediction).all()
                    out=te[['sample_id','wafer_id','recipe','mrr','flag_pressure_shift']].copy()
                    out=out.rename(columns={'mrr':'truth'}).assign(fold=fold,policy=policy,model=name,prediction=prediction)
                    records.extend(out.to_dict('records'))
            print(f'Completed fold {fold} {recipe}: train={len(tr)}, evaluation={len(te)}',flush=True)
    pred=pd.DataFrame(records)
    pred.to_csv(RUN/'predictions.csv.gz',index=False,compression={'method':'gzip','mtime':0})
    metric_rows(pred).to_csv(RUN/'metrics.csv',index=False)
    pd.DataFrame(histories).to_csv(RUN/'history_references.csv.gz',index=False,compression={'method':'gzip','mtime':0})
    pd.DataFrame(partitions).to_csv(RUN/'partition_audit.csv',index=False)
    pd.DataFrame(calibration).to_csv(RUN/'calibration_changes.csv',index=False)
    write(RUN/'model_reload_checks.json',reload_checks)
    assert all(digest(ROOT/p)==h for p,h in preserved.items())
    protocol=json.loads((RUN/'protocol.json').read_text(encoding='utf-8'))
    assert all(digest(ROOT/p)==h for p,h in protocol['code_hashes'].items())
    write(RUN/'completion.json',{'status':'completed','model_fits':model_count,
        'saved_model_files':len(reload_checks),'prediction_rows':len(pred),
        'history_query_rows':len(histories),'prior_artifacts_unchanged':len(preserved),
        'hashes':{p.relative_to(RUN).as_posix():digest(p) for p in RUN.rglob('*') if p.is_file()}})
    print('Completed',len(pred),'predictions;',model_count,'model fits',flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--archive',type=Path,required=True)
    main(parser.parse_args().archive)
