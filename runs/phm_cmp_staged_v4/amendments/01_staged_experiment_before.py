"""Run the frozen four-step follow-up without changing historical baselines."""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import asdict
from importlib.metadata import version
from pathlib import Path
import platform
import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import TARGET, KEYS, sample_id, sha256, read_json, write_json, utcnow
from .improvement import ROOT, audit_partition
from .paper_benchmark import log
from .reconstruction import read_frame, GZIP
from .staged_features import extract_staged, COMPACT_SIGNALS, PHASES
from .staged_models import SEEDS, Spec, fit_bundle, select_stages

RUN = ROOT/'runs/phm_cmp_staged_v4'
SOURCE = ROOT/'.cache/reconstruction/phm_cmp_reconstruction_v2'
CACHE = ROOT/'.cache/staged/phm_cmp_staged_v4'
META = ['sample_id','WAFER_ID','STAGE','condition','group_id','start','end']


def code_hashes():
    return {p.name:sha256(p) for p in Path(__file__).parent.glob('*.py')}


def prepare():
    if RUN.exists():
        raise FileExistsError('Use a new immutable run')
    RUN.mkdir(parents=True); CACHE.mkdir(parents=True,exist_ok=False)
    old = read_json(ROOT/'runs/phm_cmp_reconstruction_v2/protocol.json')
    for n,h in old['cache_hashes'].items():
        check_hash(SOURCE/n,h)
    dev = read_frame(SOURCE/'development.csv.gz')
    frames = {'training':dev[dev.cohort.eq('training')].copy(),
              'validation':dev[dev.cohort.eq('validation')].drop(columns=[TARGET]),
              'test':read_frame(SOURCE/'test_inputs.csv.gz')}
    expected = {(r['cohort'],r['file']):r['sha256'] for r in read_json(ROOT/'runs/phm_cmp_papers_v1/sources.json')}
    sources,quality = [],[]
    for cohort,frame in frames.items():
        folder = ROOT.parent/'.tmp_phm_review/PHM/Dataset/CMP1/CMP-data/training' if cohort=='training' else ROOT.parent/'cmp-virtual-lab-ml/data/phm2016_external'/cohort
        files = sorted(folder.glob(f'CMP-{cohort}-[0-9]*.csv'))
        assert len(files)==185
        raw=[]
        for file in files:
            check_hash(file,expected[cohort,file.name])
            raw.append(pd.read_csv(file))
            sources.append({'cohort':cohort,'file':file.name,'sha256':expected[cohort,file.name]})
        raw=pd.concat(raw,ignore_index=True)
        records=[{'sample_id':sample_id(w,s),**extract_staged(trace)} for (w,s),trace in raw.groupby(KEYS,sort=True)]
        extra=pd.DataFrame(records)
        augmented=frame.merge(extra,on='sample_id',validate='one_to_one')
        assert len(augmented)==len(frame)
        if cohort!='training': assert TARGET not in augmented
        augmented.to_csv(CACHE/f'{cohort}.csv.gz',index=False,compression=GZIP)
        quality.append(augmented[META+[c for c in augmented if c.startswith('qc_')]].assign(cohort=cohort))
        log(f'Extracted {cohort}: {len(frame)} samples; raw/gap/active/longest/trimmed views')
    pd.concat(quality).to_csv(RUN/'quality.csv',index=False)
    write_json(RUN/'sources.json',sources)
    full=read_frame(CACHE/'training.csv.gz')
    train=full[~full.excluded_extreme]
    assert len(full)==1981 and len(train)==1977
    parts=pd.read_csv(ROOT/'runs/phm_cmp_secondary_ablation_v1/partitions.csv')
    manifest=train[META].copy()
    parts.to_csv(RUN/'partitions.csv',index=False)
    manifest.to_csv(RUN/'manifest.csv',index=False)
    full[META+['excluded_extreme']].to_csv(RUN/'full_manifest.csv',index=False)
    audits={}
    for part,b in parts.groupby('partition'):
        fit=train[train.sample_id.isin(b.loc[b.role.eq('train'),'sample_id'])]
        q=train[train.sample_id.isin(b.loc[b.role.eq('evaluation'),'sample_id'])]
        audits[part]=audit_partition(fit,q,part=='temporal')
    write_json(RUN/'partition_audit.json',audits)
    (RUN/'PROTOCOL.md').write_bytes((ROOT/'docs/staged-improvement-v4.md').read_bytes())
    hashes=code_hashes()
    for n in hashes:
        dest=RUN/'code_snapshot'/n;dest.parent.mkdir(exist_ok=True)
        dest.write_bytes((Path(__file__).parent/n).read_bytes())
    preserved={p.relative_to(ROOT).as_posix():sha256(p) for folder in (ROOT/'runs').iterdir()
               if folder.is_dir() and folder!=RUN for p in folder.rglob('*')
               if p.is_file() and p.name not in ('training.log','features.csv.gz','train_started.json')}
    frozen=['PROTOCOL.md','manifest.csv','full_manifest.csv','partitions.csv','partition_audit.json','quality.csv','sources.json']
    write_json(RUN/'protocol.json',{'frozen_at':utcnow(),'seeds':SEEDS,'workers':3,
        'source_cache':SOURCE.relative_to(ROOT).as_posix(),'source_hashes':old['cache_hashes'],
        'input_hashes':{p.name:sha256(p) for p in CACHE.glob('*.csv.gz')},'code_sha256':hashes,
        'frozen_files':{n:sha256(RUN/n) for n in frozen},'preserved_files':preserved,
        'feature_definition':{'compact_means':COMPACT_SIGNALS,'additional':['duration','unique timestamp count'],
                              'ambiguity_sensitivity':'replace count with STAGE_ROTATION mean; diagnostic only'},
        'selection':'Per-condition sequential nested selection: 3 group folds + 1 purged time holdout, equal MSE weight',
        'availability':'Only training labels with original full trace end < query start; zero assumed metrology delay',
        'test_exposure':'All official reference data and historical development outcomes were previously inspected. This is follow-up development, not fresh validation.',
        'adoption':'No API/Unity replacement. Research candidate passes only if group and temporal RMSE beat both fixed 125-feature controls; report group bootstrap CI and condition regressions.'})
    write_json(RUN/'environment.json',{'python':platform.python_version(),
               'packages':{n:version(n) for n in ('numpy','pandas','scipy','scikit-learn','joblib')}})
    log(f'Frozen all stages and {len(preserved)} historical artifacts')


def context():
    p=read_json(RUN/'protocol.json')
    assert code_hashes()==p['code_sha256'],'Frozen code changed'
    for n,h in p['input_hashes'].items():check_hash(CACHE/n,h)
    for n,h in p['frozen_files'].items():check_hash(RUN/n,h)
    return p


def plan(full):
    clean=full[~full.excluded_extreme]
    parts=pd.read_csv(RUN/'partitions.csv')
    result={}
    for partition in [f'outer_{i}' for i in range(5)]+['temporal','final']:
        if partition=='final':fit,q=clean,None; fullfit,fullq=full,None
        else:
            b=parts[parts.partition.eq(partition)]
            fit=clean[clean.sample_id.isin(b.loc[b.role.eq('train'),'sample_id'])]
            q=clean[clean.sample_id.isin(b.loc[b.role.eq('evaluation'),'sample_id'])]
            # Four extra rows inherit the WHOLE connected group's role.
            fullfit=full[full.group_id.isin(fit.group_id)]
            fullq=full[full.group_id.isin(q.group_id)]
            audit_partition(fullfit,fullq,partition=='temporal')
            assert set(fit.sample_id)<=set(fullfit.sample_id) and set(q.sample_id)<=set(fullq.sample_id)
        for condition in ('Cond1','Cond2','Cond3'):
            result[f'{partition}_{condition}']=(partition,condition,fit[fit.condition.eq(condition)],
                None if q is None else q[q.condition.eq(condition)],fullfit[fullfit.condition.eq(condition)],
                None if fullq is None else fullq[fullq.condition.eq(condition)])
    return result


def records(q,bundle,partition,name,cohort='clean'):
    pred=bundle.predict_seeds(q.drop(columns=[TARGET],errors='ignore'))
    out=q[META].copy()
    if TARGET in q:out['truth']=q[TARGET].to_numpy(float)
    out['partition'],out['model'],out['cohort_variant']=partition,name,cohort
    for i,seed in enumerate(SEEDS):out[f'seed_{seed}']=pred[:,i]
    out['prediction']=pred.mean(axis=1)
    return out


def worker(key):
    with threadpool_limits(limits=1):
        checkpoint=CACHE/f'{key}.joblib'
        seal=checkpoint.with_suffix('.json')
        if seal.exists():
            check_hash(checkpoint,read_json(seal)['sha256']);return key
        full=read_frame(CACHE/'training.csv.gz')
        partition,condition,fit,q,fullfit,fullq=plan(full)[key]
        log(f'{key}: selecting on {len(fit)} training rows')
        requested,detail=select_stages(fit,lambda message:log(f'{key}: {message}'))
        queries={partition:q} if q is not None else {c:read_frame(CACHE/f'{c}.csv.gz').query('condition == @condition') for c in ('validation','test')}
        outputs, fitted, audits, models=[],{}, {},{}
        for name,spec in requested.items():
            if spec.key() not in fitted:
                fitted[spec.key()]=fit_bundle(fit,spec)
            bundle=fitted[spec.key()]
            if partition=='final' and name in ('full125_rf','full125_bag','S1_features','S2_phase','S3_history','S4_final'):
                models[name]=bundle
            for part,query in queries.items():
                outputs.append(records(query,bundle,part,name))
                _,audit=bundle.inputs.transform(query.drop(columns=[TARGET],errors='ignore'),True)
                audits[f'{part}/{name}']=audit
        # Sensitivity is a REFIT of frozen clean-selected specifications, not another search.
        for name in ('full125_rf','full125_bag','S4_final'):
            spec=requested[name]
            bundle=fit_bundle(fullfit,spec)
            fqueries={partition:fullq} if fullq is not None else queries
            for part,query in fqueries.items():
                outputs.append(records(query,bundle,part,name,'full1981'))
                _,audit=bundle.inputs.transform(query.drop(columns=[TARGET],errors='ignore'),True)
                audits[f'full1981/{part}/{name}']=audit
        detail.update({'train_n':len(fit),'full_train_n':len(fullfit),'condition':condition,'partition':partition,
                       'requested_specs':{n:asdict(s) for n,s in requested.items()},'prediction_audits':audits,
                       'input_names':{n:fitted[s.key()].inputs.names for n,s in requested.items()}})
        joblib.dump((pd.concat(outputs,ignore_index=True),detail,models),checkpoint,compress=3)
        write_json(seal,{'completed_at':utcnow(),'sha256':sha256(checkpoint)})
        log(f'{key}: completed {len(fitted)} unique clean specifications plus 3 sensitivity refits')
        return key


def train():
    p=context()
    if (RUN/'training_complete.json').exists():raise FileExistsError('Training sealed')
    keys=plan(read_frame(CACHE/'training.csv.gz'))
    with ProcessPoolExecutor(max_workers=p['workers']) as pool:
        futures=[pool.submit(worker,k) for k in keys]
        for f in as_completed(futures):log(f'Finished {f.result()}')
    outputs,models=[],[]
    for key in keys:
        check_hash(CACHE/f'{key}.joblib',read_json(CACHE/f'{key}.json')['sha256'])
        pred,details,bundles=joblib.load(CACHE/f'{key}.joblib')
        outputs.append(pred)
        write_json(RUN/'fit_details'/f'{key}.json',details)
        stored={}
        for name,bundle in bundles.items():
            spec=bundle.spec.key()
            if spec not in stored:
                dest=RUN/'models'/f'{key}_{name}.joblib';dest.parent.mkdir(exist_ok=True)
                joblib.dump(bundle,dest,compress=3);stored[spec]=dest
            path=stored[spec]
            models.append({'condition':details['condition'],'name':name,'file':path.relative_to(RUN).as_posix(),
                           'sha256':sha256(path),'spec':asdict(bundle.spec)})
    outputs=pd.concat(outputs,ignore_index=True)
    development=outputs[~outputs.partition.isin(['validation','test'])]
    reference=outputs[outputs.partition.isin(['validation','test'])].drop(columns=['truth'])
    development.to_csv(RUN/'development_predictions.csv.gz',index=False,compression=GZIP)
    reference.to_csv(RUN/'reference_predictions.csv.gz',index=False,compression=GZIP)
    write_json(RUN/'training_complete.json',{'sealed_at':utcnow(),'models':models,
        'development_sha256':sha256(RUN/'development_predictions.csv.gz'),
        'reference_sha256':sha256(RUN/'reference_predictions.csv.gz'),
        'fit_detail_hashes':{p.name:sha256(p) for p in (RUN/'fit_details').glob('*.json')},
        'protocol_sha256':sha256(RUN/'protocol.json')})
    log('All choices, models and reference predictions sealed BEFORE this run opens Test truth')


def metric_table(pred):
    rows=[]
    pred=pred.copy()
    pred['evaluation']=pred.partition.where(~pred.partition.str.startswith('outer_'),'group_oof')
    for (cohort,evaluation,model),block in pred.groupby(['cohort_variant','evaluation','model']):
        for condition,q in [('all',block)]+list(block.groupby('condition')):
            error=q.prediction.to_numpy()-q.truth.to_numpy()
            rows.append({'cohort_variant':cohort,'evaluation':evaluation,'model':model,'condition':condition,'n':len(q),
                'mse':float(np.square(error).mean()),'rmse':float(np.sqrt(np.square(error).mean())),
                'mae':float(np.abs(error).mean()),'p95_abs_error':float(np.quantile(np.abs(error),.95)),
                'seed_rmse_min':min(float(np.sqrt(np.square(q[f'seed_{s}']-q.truth).mean())) for s in SEEDS),
                'seed_rmse_max':max(float(np.sqrt(np.square(q[f'seed_{s}']-q.truth).mean())) for s in SEEDS)})
    return pd.DataFrame(rows)


def bootstrap_comparisons(pred):
    """Paired connected-group bootstrap; no row-wise independence assumption."""
    rows=[]
    p=pred[pred.cohort_variant.eq('clean')].copy()
    p['evaluation']=p.partition.where(~p.partition.str.startswith('outer_'),'group_oof')
    rng=np.random.default_rng(SEEDS[0])
    for evaluation,b in p.groupby('evaluation'):
        for base in ('full125_rf','full125_bag'):
            ref=b[b.model.eq(base)].set_index('sample_id')
            for candidate in ('S1_features','S2_phase','S3_history','S4_final'):
                q=b[b.model.eq(candidate)].set_index('sample_id').loc[ref.index]
                assert np.array_equal(q.truth,ref.truth)
                losses=pd.DataFrame({'group':q.group_id,'old':np.square(ref.prediction-ref.truth),
                                     'new':np.square(q.prediction-q.truth),'n':1}).groupby('group').sum()
                vals=losses[['old','new','n']].to_numpy(float)
                picks=rng.integers(0,len(vals),(2000,len(vals)))
                totals=vals[picks].sum(axis=1)
                gain=100*(1-np.sqrt(totals[:,1]/totals[:,0]))
                old=float(np.sqrt(losses.old.sum()/losses.n.sum()));new=float(np.sqrt(losses.new.sum()/losses.n.sum()))
                rows.append({'evaluation':evaluation,'baseline':base,'candidate':candidate,'groups':len(vals),
                             'baseline_rmse':old,'candidate_rmse':new,'rmse_improvement_pct':100*(1-new/old),
                             'bootstrap_low_pct':float(np.quantile(gain,.025)),'bootstrap_high_pct':float(np.quantile(gain,.975)),
                             'interval_scope':'paired connected-group bootstrap; descriptive, no multiplicity correction or model-refit uncertainty'})
    return pd.DataFrame(rows)


def evaluate():
    p=context();seal=read_json(RUN/'training_complete.json')
    if (RUN/'completion.json').exists():raise FileExistsError('Evaluation immutable')
    check_hash(RUN/'protocol.json',seal['protocol_sha256'])
    check_hash(RUN/'development_predictions.csv.gz',seal['development_sha256'])
    check_hash(RUN/'reference_predictions.csv.gz',seal['reference_sha256'])
    for n,h in seal['fit_detail_hashes'].items():check_hash(RUN/'fit_details'/n,h)
    predictions=read_frame(RUN/'reference_predictions.csv.gz')
    replay_max=0.
    for m in seal['models']:
        check_hash(RUN/m['file'],m['sha256']);bundle=joblib.load(RUN/m['file'])
        for cohort in ('validation','test'):
            frame=read_frame(CACHE/f'{cohort}.csv.gz')
            q=frame[frame.condition.eq(m['condition'])]
            stored=predictions[(predictions.partition==cohort)&(predictions.condition==m['condition'])&
                               (predictions.model==m['name'])&predictions.cohort_variant.eq('clean')].set_index('sample_id')
            diff=float(np.abs(bundle.predict(q)-stored.loc[q.sample_id,'prediction'].to_numpy()).max())
            assert diff<1e-9;replay_max=max(diff,replay_max)
    for n in ('development.csv.gz','test_truth.csv'):check_hash(SOURCE/n,p['source_hashes'][n])
    dev=read_frame(SOURCE/'development.csv.gz')
    truth=pd.concat([dev.loc[dev.cohort.eq('validation'),['sample_id',TARGET]],read_frame(SOURCE/'test_truth.csv')])
    scored=predictions.merge(truth.rename(columns={TARGET:'truth'}),on='sample_id',validate='many_to_one')
    assert len(scored)==len(predictions) and np.isfinite(scored.truth).all()
    scored.to_csv(RUN/'reference_scored_predictions.csv.gz',index=False,compression=GZIP)
    pred=pd.concat([read_frame(RUN/'development_predictions.csv.gz'),scored],ignore_index=True)
    assert not pred.duplicated(['cohort_variant','partition','model','sample_id']).any()
    assert np.isfinite(pred.prediction).all()
    # Show sensitivity both on all assigned rows and on exactly the clean evaluation rows.
    clean_ids=set(read_frame(RUN/'manifest.csv').sample_id)
    sensitive=pred[pred.cohort_variant.eq('full1981') &
                   (pred.sample_id.isin(clean_ids)|pred.partition.isin(['validation','test']))].copy()
    sensitive['cohort_variant']='full_fit_clean_eval'
    metric_table(pd.concat([pred,sensitive],ignore_index=True)).to_csv(RUN/'metrics.csv',index=False)
    bootstrap_comparisons(pred).to_csv(RUN/'paired_comparisons.csv',index=False)
    # Preserve per-fold metrics as well as pooled metrics.
    folds=[]
    for part,b in pred[pred.partition.str.startswith('outer_')].groupby('partition'):
        table=metric_table(b);table['evaluation']=part;folds.append(table)
    pd.concat(folds).to_csv(RUN/'fold_metrics.csv',index=False)
    for n,h in p['preserved_files'].items():check_hash(ROOT/n,h)
    write_json(RUN/'completion.json',{'completed_at':utcnow(),'status':'completed_research_only_no_service_promotion',
        'prediction_rows':len(pred),'historical_files_preserved':len(p['preserved_files']),
        'max_model_reload_difference':replay_max,'training_seal_sha256':sha256(RUN/'training_complete.json'),
        'artifact_hashes':{n:sha256(RUN/n) for n in ('metrics.csv','paired_comparisons.csv','fold_metrics.csv','reference_scored_predictions.csv.gz')}})
    log('All four stages, group/time metrics and extreme-label sensitivity evaluated')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['prepare','train','evaluate'])
    with threadpool_limits(limits=1):globals()[parser.parse_args().action]()
