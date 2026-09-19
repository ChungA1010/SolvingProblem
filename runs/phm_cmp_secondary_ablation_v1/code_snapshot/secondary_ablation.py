"""Immutable experiment for excluding P2 secondary-chamber physical inputs."""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from importlib.metadata import version
from pathlib import Path
import platform

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import TARGET, read_json, write_json, sha256, utcnow
from .improvement import ROOT, checkpoint, prediction_rows, metric_rows
from .lr_ablation import plan, load_reference, hashes as previous_hashes
from .paper_benchmark import log
from .reconstruction import read_frame, GZIP
from .secondary_ablation_models import fit_primary_only, pair_predictions

BASE=ROOT/'runs/phm_cmp_lr_diagnosis_v1'
AUDIT=ROOT/'runs/phm_cmp_chamber_audit_v1'


def hashes():
    return {**previous_hashes(),**{n:sha256(Path(__file__).parent/n) for n in ['secondary_ablation_models.py','secondary_ablation.py']}}


def prepare(run):
    if run.exists(): raise FileExistsError('Use a new experiment directory')
    old=read_json(BASE/'protocol.json')
    for n,h in old['code_sha256'].items(): check_hash(Path(__file__).parent/n,h)
    for n,h in old['cache_sha256'].items(): check_hash(ROOT/old['cache']/n,h)
    for n,h in old['frozen_files'].items(): check_hash(BASE/n,h)
    for r in old['references'].values():
        check_hash(ROOT/r['path'],r['sha256'])
    cache=ROOT/'.cache/secondary_ablation'/run.name
    cache.mkdir(parents=True,exist_ok=False);run.mkdir(parents=True)
    for n in ['manifest.csv','partitions.csv','partition_audit.json']:
        (run/n).write_bytes((BASE/n).read_bytes())
    (run/'PROTOCOL.md').write_bytes((ROOT/'docs/p2-secondary-ablation-v1.md').read_bytes())
    preserved=dict(old['preserved_files'])
    for folder in (BASE,AUDIT):
        preserved.update({p.relative_to(ROOT).as_posix():sha256(p) for p in folder.rglob('*') if p.is_file()})
    for n,h in preserved.items(): check_hash(ROOT/n,h)
    for n in hashes():
        dest=run/'code_snapshot'/n;dest.parent.mkdir(exist_ok=True);dest.write_bytes((Path(__file__).parent/n).read_bytes())
    write_json(run/'protocol.json',{'frozen_at':utcnow(),'policy':'retrospective','workers':3,
        'arms':['original','primary_only'],'removal_prefix':'p2_secondary_','feature_counts':[125,73],
        'input_cache':old['cache'],'cache_sha256':old['cache_sha256'],'cache':cache.relative_to(ROOT).as_posix(),
        'source_cache':old['source_cache'],'source_cache_sha256':old['source_cache_sha256'],
        'references':old['references'],'code_sha256':hashes(),'preserved_files':preserved,
        'frozen_files':{n:sha256(run/n) for n in ['PROTOCOL.md','manifest.csv','partitions.csv','partition_audit.json']},
        'selection':'Two predeclared arms; no tuning or Test-based promotion; report group and time results together',
        'test_exposure':'Repeatedly inspected historical Test; development comparison, not independent validation',
        'audit_samples_sha256':sha256(AUDIT/'samples.csv')})
    write_json(run/'environment.json',{'python':platform.python_version(),'packages':{n:version(n) for n in ['numpy','pandas','scipy','scikit-learn','joblib']}})
    log('Frozen secondary-feature exclusion, 21 parent fits, original reference models and all input hashes')


def context(run):
    p=read_json(run/'protocol.json')
    assert hashes()==p['code_sha256'],'Frozen code changed'
    for n,h in p['frozen_files'].items():check_hash(run/n,h)
    for n,h in p['cache_sha256'].items():check_hash(ROOT/p['input_cache']/n,h)
    return p,ROOT/p['input_cache'],ROOT/p['cache']


def worker(key,reference,cache):
    with threadpool_limits(limits=4):
        ref,cv,_=load_reference(reference)
        log(f'Fitting {key}')
        checkpoint(cache,key,lambda:fit_primary_only(ref,cv,progress=lambda text:log(f'{key}: {text}')))
    return key


def train(run):
    if (run/'training_complete.json').exists():raise FileExistsError('Training complete; use a new run')
    p,inputs,cache=context(run)
    frame=read_frame(inputs/'training.csv.gz')
    assert len(frame)==1977 and frame.cohort.eq('training').all()
    plans=plan(frame,pd.read_csv(run/'partitions.csv'))
    with ProcessPoolExecutor(max_workers=p['workers']) as pool:
        tasks=[pool.submit(worker,k,p['references'][k],cache) for k in plans]
        for task in as_completed(tasks):log(f'Completed {task.result()}')
    outputs,models,details=[],[],{}
    for key,(partition,condition,_,q) in plans.items():
        path=cache/f'{key}.joblib';check_hash(path,read_json(path.with_suffix('.json'))['sha256'])
        candidate,d,inner,votes=joblib.load(path)
        ref,_,_=load_reference(p['references'][key])
        dest=run/'fit_details'/f'{key}.json';write_json(dest,d)
        inner.to_csv(dest.with_suffix('.predictions.csv.gz'),index=False,compression=GZIP)
        votes.to_csv(dest.with_suffix('.votes.csv.gz'),index=False,compression=GZIP)
        details[key]={'original_weights':d['original_weights'],'candidate_weights':d['candidate_weights'],
            'selected_features':d['selected_features'],'original_selected_features':d['original_selected_features']}
        if q is not None:
            outputs.append(prediction_rows(q,pair_predictions(ref,candidate,q.drop(columns=[TARGET])),partition,'retrospective'))
        else:
            path=run/'models'/f'{condition}.joblib';path.parent.mkdir(exist_ok=True)
            joblib.dump(candidate,path,compress=3)
            models.append({'file':path.relative_to(run).as_posix(),'sha256':sha256(path),'condition':condition})
    write_json(run/'configuration.json',{'sealed_at':utcnow(),'search_performed':False,'fits':details})
    pd.concat(outputs,ignore_index=True).to_csv(run/'development_predictions.csv.gz',index=False,compression=GZIP)
    write_json(run/'training_complete.json',{'completed_at':utcnow(),'models':models,
        'configuration_sha256':sha256(run/'configuration.json'),
        'development_predictions_sha256':sha256(run/'development_predictions.csv.gz'),
        'fit_details_sha256':{p.relative_to(run).as_posix():sha256(p) for p in (run/'fit_details').iterdir()}})
    log('All 21 candidate fits sealed before official reference evaluation')


def evaluate(run):
    if (run/'completion.json').exists():raise FileExistsError('Evaluation immutable')
    p,inputs,_=context(run);trained=read_json(run/'training_complete.json')
    check_hash(run/'configuration.json',trained['configuration_sha256'])
    check_hash(run/'development_predictions.csv.gz',trained['development_predictions_sha256'])
    outputs=[]
    for m in trained['models']:
        check_hash(run/m['file'],m['sha256']);candidate=joblib.load(run/m['file'])
        ref,_,_=load_reference(p['references'][f"final_{m['condition']}"])
        for split in ['validation','test']:
            q=read_frame(inputs/f'{split}.csv.gz');assert TARGET not in q
            q=q[q.condition.eq(m['condition'])]
            outputs.append(prediction_rows(q,pair_predictions(ref,candidate,q),split,'retrospective'))
    pred=pd.concat(outputs,ignore_index=True)
    pred.to_csv(run/'reference_predictions.csv.gz',index=False,compression=GZIP)
    write_json(run/'evaluation_seal.json',{'sealed_at':utcnow(),'models':trained['models'],
        'configuration_sha256':sha256(run/'configuration.json'),'predictions_sha256':sha256(run/'reference_predictions.csv.gz')})
    source=ROOT/p['source_cache']
    for n,h in p['source_cache_sha256'].items():check_hash(source/n,h)
    dev=read_frame(source/'development.csv.gz')
    truth=pd.concat([dev.loc[dev.cohort.eq('validation'),['sample_id',TARGET]],read_frame(source/'test_truth.csv')])
    scored=pred.merge(truth.rename(columns={TARGET:'truth'}),on='sample_id',validate='many_to_one')
    assert len(scored)==len(pred) and np.isfinite(scored.truth).all()
    scored.to_csv(run/'reference_scored_predictions.csv.gz',index=False,compression=GZIP)
    allpred=pd.concat([read_frame(run/'development_predictions.csv.gz'),scored],ignore_index=True)
    metric_rows(allpred).to_csv(run/'metrics.csv',index=False)
    old=pd.concat([read_frame(BASE/n) for n in ['development_predictions.csv.gz','reference_scored_predictions.csv.gz']])
    old=old[old.model.eq('original')].set_index(['partition','sample_id'])
    replay=allpred[allpred.model.eq('original')].set_index(['partition','sample_id'])
    np.testing.assert_allclose(replay.prediction,old.loc[replay.index,'prediction'],rtol=0,atol=1e-8)
    for n,h in p['preserved_files'].items():check_hash(ROOT/n,h)
    write_json(run/'completion.json',{'completed_at':utcnow(),'status':'paired_development_complete_no_model_promotion',
        'original_predictions_replayed':True,'preserved_files_checked':len(p['preserved_files']),
        'metrics_sha256':sha256(run/'metrics.csv'),'configuration_sha256':sha256(run/'configuration.json'),
        'training_complete_sha256':sha256(run/'training_complete.json'),'evaluation_seal_sha256':sha256(run/'evaluation_seal.json'),
        'reference_scored_predictions_sha256':sha256(run/'reference_scored_predictions.csv.gz')})
    log('Paired comparison complete; original model and old runs unchanged')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['prepare','train','evaluate'])
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_secondary_ablation_v1')
    a=parser.parse_args()
    with threadpool_limits(limits=4):globals()[a.action](a.run_dir.resolve())
