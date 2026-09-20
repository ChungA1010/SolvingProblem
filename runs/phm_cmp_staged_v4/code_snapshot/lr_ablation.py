"""Frozen P2 LR diagnostics/ablation with identical incumbent parent fits."""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import TARGET, read_json, write_json, sha256, utcnow
from .improvement import ROOT, CONDITIONS, checkpoint, prediction_rows, metric_rows, audit_partition
from .paper_benchmark import log
from .reconstruction import read_frame, GZIP, hashes as old_hashes
from .lr_ablation_models import ALPHA, PROCEDURES, fit_ablation

REPRO=ROOT/'runs/phm_cmp_reconstruction_v2'
IMPROVE=ROOT/'runs/phm_cmp_improvement_v1'
PREVIOUS=ROOT/'runs/phm_cmp_temporal_v4'


def hashes():
    names=list(old_hashes())+['improvement.py','improvement_models.py','lr_ablation_models.py','lr_ablation.py']
    return {n:sha256(Path(__file__).parent/n) for n in names}


def plan(frame,parts):
    result={}
    for partition in [f'outer_{i}' for i in range(5)]+['temporal','final']:
        if partition=='final': fit,q=frame,None
        else:
            block=parts[parts.partition.eq(partition)]
            fit=frame[frame.sample_id.isin(block.loc[block.role.eq('train'),'sample_id'])]
            q=frame[frame.sample_id.isin(block.loc[block.role.eq('evaluation'),'sample_id'])]
            audit_partition(fit,q,partition=='temporal')
        for condition in CONDITIONS:
            result[f'{partition}_{condition}']=(partition,condition,fit[fit.condition.eq(condition)],
                None if q is None else q[q.condition.eq(condition)])
    return result


def prepare(run):
    if run.exists(): raise FileExistsError('Use a new experiment directory')
    old=read_json(IMPROVE/'protocol.json'); rp=read_json(REPRO/'protocol.json')
    source=ROOT/rp['cache_relative']; original_cache=ROOT/old['cache']
    cache=ROOT/'.cache/lr_ablation'/run.name
    run.mkdir(parents=True); cache.mkdir(parents=True,exist_ok=False)
    check_hash(original_cache/'train.csv.gz',old['train_sha256'])
    (cache/'training.csv.gz').write_bytes((original_cache/'train.csv.gz').read_bytes())
    for n,h in rp['cache_hashes'].items(): check_hash(source/n,h)
    validation=read_frame(source/'development.csv.gz').query("cohort == 'validation'").drop(columns=[TARGET])
    validation.to_csv(cache/'validation.csv.gz',index=False,compression=GZIP)
    (cache/'test.csv.gz').write_bytes((source/'test_inputs.csv.gz').read_bytes())
    for n in ['partitions.csv','manifest.csv','partition_audit.json']:
        check_hash(IMPROVE/n,old['frozen_files'][n]); (run/n).write_bytes((IMPROVE/n).read_bytes())
    (run/'PROTOCOL.md').write_bytes((ROOT/'docs/p2-lr-diagnosis-v1.md').read_bytes())
    plans=plan(read_frame(cache/'training.csv.gz'),pd.read_csv(run/'partitions.csv'))
    references={}
    for key,(partition,condition,fit,_) in plans.items():
        if partition=='final':
            path=REPRO/'models'/f'P2_{condition}.joblib'
            refs={k:REPRO/f'p2_stable_ols_clean_{condition}_{k}.csv' for k in ('cv','votes')}
        else:
            path=original_cache/f'{partition}_incumbent_{condition}.joblib'
            check_hash(path,read_json(path.with_suffix('.json'))['sha256']); refs={}
        references[key]={'kind':'model' if partition=='final' else 'checkpoint','path':path.relative_to(ROOT).as_posix(),
            'sha256':sha256(path),'train_ids':fit.sample_id.tolist(),
            **{k:{'path':v.relative_to(ROOT).as_posix(),'sha256':sha256(v)} for k,v in refs.items()}}
    prior=read_json(PREVIOUS/'protocol.json')
    preserved=dict(prior['preserved_files'])
    for folder in [PREVIOUS,ROOT/'runs/phm_cmp_final_comparison']:
        preserved.update({p.relative_to(ROOT).as_posix():sha256(p) for p in folder.rglob('*') if p.is_file()})
    for n,h in preserved.items(): check_hash(ROOT/n,h)
    for n in hashes():
        dest=run/'code_snapshot'/n; dest.parent.mkdir(exist_ok=True); dest.write_bytes((Path(__file__).parent/n).read_bytes())
    write_json(run/'protocol.json',{'frozen_at':utcnow(),'alpha':ALPHA,'procedures':PROCEDURES,
        'policy':'retrospective','workers':3,'cache':cache.relative_to(ROOT).as_posix(),
        'cache_sha256':{p.name:sha256(p) for p in cache.glob('*.csv.gz')},
        'source_cache':source.relative_to(ROOT).as_posix(),'source_cache_sha256':rp['cache_hashes'],
        'code_sha256':hashes(),'references':references,'preserved_files':preserved,
        'frozen_files':{n:sha256(run/n) for n in ['PROTOCOL.md','partitions.csv','manifest.csv','partition_audit.json']},
        'test_exposure':'Previous Test inspected including initial LR diagnostic; paired development only.',
        'selection':'No hyperparameter search or Test-based model promotion; three predeclared procedures.'})
    (run/'environment.json').write_bytes((PREVIOUS/'environment.json').read_bytes())
    log('Frozen three single-component comparisons and all 21 incumbent references')


def context(run):
    p=read_json(run/'protocol.json'); assert hashes()==p['code_sha256'],'Frozen source changed'
    for n,h in p['frozen_files'].items(): check_hash(run/n,h)
    for n,h in p['cache_sha256'].items(): check_hash(ROOT/p['cache']/n,h)
    return p,ROOT/p['cache']


def load_reference(record):
    path=ROOT/record['path']; check_hash(path,record['sha256'])
    if record['kind']=='checkpoint': result=joblib.load(path)
    else:
        for k in ('cv','votes'): check_hash(ROOT/record[k]['path'],record[k]['sha256'])
        result=(joblib.load(path),read_frame(ROOT/record['cv']['path']),read_frame(ROOT/record['votes']['path']))
    assert set(result[0].history.library.sample_id)==set(record['train_ids'])
    return result


def worker(key,reference,cache):
    with threadpool_limits(limits=4):
        log(f'Fitting {key}')
        checkpoint(cache,key,lambda:fit_ablation(*load_reference(reference),
            progress=lambda message:log(f'{key}: {message}')))
    return key


def train(run):
    if (run/'training_complete.json').exists(): raise FileExistsError('Training immutable')
    p,cache=context(run); frame=read_frame(cache/'training.csv.gz')
    assert frame.cohort.eq('training').all()
    plans=plan(frame,pd.read_csv(run/'partitions.csv'))
    with ProcessPoolExecutor(max_workers=p['workers']) as pool:
        futures=[pool.submit(worker,k,p['references'][k],cache) for k in plans]
        for f in as_completed(futures): log(f'Completed {f.result()}')
    outputs,models,details=[],[],{}
    for key,(partition,condition,_,q) in plans.items():
        dest=cache/f'{key}.joblib'; check_hash(dest,read_json(dest.with_suffix('.json'))['sha256'])
        bundle,d,inner=joblib.load(dest)
        path=run/'fit_details'/f'{key}.json'; write_json(path,d)
        inner.to_csv(path.with_suffix('.csv.gz'),index=False,compression=GZIP)
        details[key]={'condition':condition,**{n:d[n] for n in ['train_n','original_weights','no_lr_weights','ridge10_weights']}}
        if q is not None:
            outputs.append(prediction_rows(q,bundle.predict_all(q.drop(columns=[TARGET])),partition,'retrospective'))
        else:
            path=run/'models'/f'{condition}.joblib'; path.parent.mkdir(exist_ok=True)
            joblib.dump(bundle,path,compress=3)
            models.append({'file':path.relative_to(run).as_posix(),'sha256':sha256(path),'condition':condition})
    write_json(run/'configuration.json',{'sealed_at':utcnow(),'alpha':ALPHA,'procedures':PROCEDURES,
        'model_selection_performed':False,'fits':details})
    pd.concat(outputs,ignore_index=True).to_csv(run/'development_predictions.csv.gz',index=False,compression=GZIP)
    write_json(run/'training_complete.json',{'completed_at':utcnow(),'models':models,
        'configuration_sha256':sha256(run/'configuration.json'),
        'development_predictions_sha256':sha256(run/'development_predictions.csv.gz'),
        'fit_details_sha256':{p.relative_to(run).as_posix():sha256(p) for p in (run/'fit_details').iterdir()}})
    log('All 21 fits sealed before current-run reference evaluation')


def evaluate(run):
    if (run/'completion.json').exists(): raise FileExistsError('Evaluation immutable')
    p,cache=context(run); trained=read_json(run/'training_complete.json')
    check_hash(run/'configuration.json',trained['configuration_sha256'])
    outputs=[]
    for m in trained['models']:
        check_hash(run/m['file'],m['sha256']); bundle=joblib.load(run/m['file'])
        for split in ('validation','test'):
            frame=read_frame(cache/f'{split}.csv.gz'); assert TARGET not in frame
            q=frame[frame.condition.eq(m['condition'])]
            outputs.append(prediction_rows(q,bundle.predict_all(q),split,'retrospective'))
    pred=pd.concat(outputs,ignore_index=True)
    pred.to_csv(run/'reference_predictions.csv.gz',index=False,compression=GZIP)
    write_json(run/'evaluation_seal.json',{'sealed_at':utcnow(),'models':trained['models'],
        'configuration_sha256':sha256(run/'configuration.json'),'predictions_sha256':sha256(run/'reference_predictions.csv.gz')})
    source=ROOT/p['source_cache']
    for n,h in p['source_cache_sha256'].items(): check_hash(source/n,h)
    dev=read_frame(source/'development.csv.gz')
    truth=pd.concat([dev.loc[dev.cohort.eq('validation'),['sample_id',TARGET]],read_frame(source/'test_truth.csv')])
    scored=pred.merge(truth.rename(columns={TARGET:'truth'}),on='sample_id',validate='many_to_one')
    assert len(scored)==len(pred) and np.isfinite(scored.truth).all()
    scored.to_csv(run/'reference_scored_predictions.csv.gz',index=False,compression=GZIP)
    allpred=pd.concat([read_frame(run/'development_predictions.csv.gz'),scored],ignore_index=True)
    metric_rows(allpred).to_csv(run/'metrics.csv',index=False)
    previous=pd.concat([read_frame(IMPROVE/n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz')])
    previous=previous[previous.model.eq('incumbent_refit')&previous.policy.eq('retrospective')].set_index(['partition','sample_id'])
    replay=allpred[allpred.model.eq('original')].set_index(['partition','sample_id'])
    np.testing.assert_allclose(replay.prediction,previous.loc[replay.index,'prediction'],rtol=0,atol=1e-8)
    for n,h in p['preserved_files'].items(): check_hash(ROOT/n,h)
    write_json(run/'completion.json',{'completed_at':utcnow(),'status':'development_comparison_complete_no_model_promotion',
        'configuration_sha256':sha256(run/'configuration.json'),'metrics_sha256':sha256(run/'metrics.csv'),
        'training_complete_sha256':sha256(run/'training_complete.json'),'evaluation_seal_sha256':sha256(run/'evaluation_seal.json'),
        'reference_scored_predictions_sha256':sha256(run/'reference_scored_predictions.csv.gz'),
        'original_predictions_replayed':True,'preserved_files_checked':len(p['preserved_files'])})
    log('Evaluation complete; original model and previous results unchanged')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=('prepare','train','evaluate'))
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_lr_diagnosis_v1')
    a=parser.parse_args()
    with threadpool_limits(limits=4): globals()[a.action](a.run_dir.resolve())


if __name__=='__main__': main()
