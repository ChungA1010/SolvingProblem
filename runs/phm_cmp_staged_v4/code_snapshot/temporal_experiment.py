"""Frozen rolling-origin model selection, paired with all previous evaluations."""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import TARGET, read_json, sha256, utcnow, write_json
from .improvement import ROOT, CONDITIONS, checkpoint, audit_partition, metric_rows, history_audit
from .paper_benchmark import log
from .reconstruction import GZIP, read_frame
from .boosted_experiment import NAMES as OLD_NAMES, predict_record
from .boosted_models import grid, VARIANTS
from .temporal_models import rolling_plan, fit_condition

PREVIOUS = ROOT / 'runs/phm_cmp_boosted_v3'
NAMES = OLD_NAMES + ('temporal_models.py', 'temporal_experiment.py')


def hashes():
    return {n: sha256(Path(__file__).parent / n) for n in NAMES}


def plans_for(frame, parts):
    plans = {}
    for partition in [f'outer_{i}' for i in range(5)] + ['temporal', 'final']:
        if partition == 'final':
            fit, query = frame, None
        else:
            b = parts[parts.partition.eq(partition)]
            fit = frame[frame.sample_id.isin(b.loc[b.role.eq('train'), 'sample_id'])]
            query = frame[frame.sample_id.isin(b.loc[b.role.eq('evaluation'), 'sample_id'])]
            audit_partition(fit, query, partition == 'temporal')
        for condition in CONDITIONS:
            plans[f'{partition}_completed_{condition}'] = (partition, condition, fit[fit.condition.eq(condition)].reset_index(drop=True), query)
    return plans


def prepare(run):
    if run.exists():
        raise FileExistsError('Use a new experiment directory')
    old = read_json(PREVIOUS / 'protocol.json')
    source = ROOT / old['cache']
    cache = ROOT / '.cache/temporal' / run.name
    cache.mkdir(parents=True, exist_ok=False); run.mkdir(parents=True)
    for cohort in ('training', 'validation', 'test'):
        name = f'{cohort}.csv.gz'
        check_hash(source / name, old['cache_sha256'][name])
        (cache / name).write_bytes((source / name).read_bytes())
    for name in ('partitions.csv', 'manifest.csv', 'partition_audit.json'):
        check_hash(PREVIOUS / name, old['frozen_files'][name])
        (run / name).write_bytes((PREVIOUS / name).read_bytes())
    (run / 'PROTOCOL.md').write_bytes((ROOT / 'docs/p2-temporal-v4.md').read_bytes())
    frame, parts = read_frame(cache / 'training.csv.gz'), pd.read_csv(run / 'partitions.csv')
    plans = {key: rolling_plan(data) for key, (_, _, data, _) in plans_for(frame, parts).items()}
    write_json(run / 'rolling_plan.json', plans)
    references = {key: old['reference_cache_hashes'][key] for key in plans}
    for key, h in references.items(): check_hash(ROOT / old['reference_cache'] / f'{key}.joblib', h)
    preserved = dict(old['preserved_files'])
    preserved.update({p.relative_to(ROOT).as_posix(): sha256(p) for p in PREVIOUS.rglob('*') if p.is_file()})
    for name in hashes():
        path = run / 'code_snapshot' / name; path.parent.mkdir(exist_ok=True)
        path.write_bytes((Path(__file__).parent / name).read_bytes())
    write_json(run / 'protocol.json', {'frozen_at': utcnow(), 'grid': grid(), 'variants': VARIANTS, 'policies': ['completed'],
        'cache': cache.relative_to(ROOT).as_posix(), 'cache_sha256': {p.name: sha256(p) for p in cache.glob('*.csv.gz')},
        'reference_cache': old['reference_cache'], 'reference_cache_hashes': references,
        'source_cache': old['source_cache'], 'source_cache_hashes': old['source_cache_hashes'],
        'code_sha256': hashes(), 'preserved_files': preserved, 'workers': 3,
        'frozen_files': {n: sha256(run / n) for n in ('PROTOCOL.md','partitions.csv','manifest.csv','partition_audit.json','rolling_plan.json')},
        'eligible_origins': sum(r['eligible'] for p in plans.values() for r in p),
        'test_exposure': 'Previously inspected data; paired development, not independent validation.'})
    (run / 'environment.json').write_bytes((PREVIOUS / 'environment.json').read_bytes())
    log('Time selection protocol and all eligible/purged origins frozen')


def context(run):
    p = read_json(run / 'protocol.json')
    assert hashes() == p['code_sha256'], 'Frozen code changed'
    for n, h in p['frozen_files'].items(): check_hash(run / n, h)
    cache = ROOT / p['cache']
    for n, h in p['cache_sha256'].items(): check_hash(cache / n, h)
    return p, cache


def worker(key, data, plan, cache, reference_path, reference_hash):
    with threadpool_limits(limits=4):
        check_hash(reference_path, reference_hash)
        old_bundle, _, old_inner = joblib.load(reference_path)
        assert set(old_inner.sample_id) == set(data.sample_id)
        log(f'Fitting {key}')
        checkpoint(cache, key, lambda: fit_condition(data, old_bundle, plan, cache, key,
            lambda message: log(f'{key}: {message}')))
    return key


def train(run):
    if (run / 'training_complete.json').exists(): raise FileExistsError('Training is immutable')
    p, cache = context(run)
    f = read_frame(cache / 'training.csv.gz')
    assert f.cohort.eq('training').all()
    plans = plans_for(f, pd.read_csv(run / 'partitions.csv'))
    rolling = read_json(run / 'rolling_plan.json')
    with ProcessPoolExecutor(max_workers=p['workers']) as pool:
        futures = [pool.submit(worker, key, data, rolling[key], cache, ROOT / p['reference_cache'] / f'{key}.joblib',
            p['reference_cache_hashes'][key]) for key, (_, _, data, _) in plans.items()]
        for future in as_completed(futures): log(f'Completed {future.result()}')
    outputs, decisions, counts, models, audits = [], {}, [], [], {}
    for key, (partition, condition, _, query) in plans.items():
        path = cache / f'{key}.joblib'; check_hash(path, read_json(path.with_suffix('.json'))['sha256'])
        bundle, detail, inner = joblib.load(path)
        path = run / 'selection_details' / f'{key}.json'
        write_json(path, detail); inner.to_csv(path.with_suffix('.csv.gz'), index=False, compression=GZIP)
        decisions[key] = {k: detail[k] for k in ('selected','scores','chosen_specs','policy','condition','selection_n')}
        if query is not None:
            q = query[query.condition.eq(condition)]
            pred, flags = predict_record(bundle, q, partition, 'completed')
            outputs.append(pred); counts.extend(flags); audits[key] = history_audit(bundle.builder.history, q)
        else:
            dest = run / 'models' / f'completed_{condition}.joblib'; dest.parent.mkdir(exist_ok=True)
            joblib.dump(bundle, dest, compress=3)
            models.append({'file': dest.relative_to(run).as_posix(), 'sha256': sha256(dest), 'policy': 'completed', 'condition': condition})
    write_json(run / 'selection.json', {'selected_at': utcnow(), 'decisions': decisions,
        'rule': 'Minimum pooled rolling-origin MSE among four tuned candidates and refitted robust reference; tie ID.'})
    pd.concat(outputs, ignore_index=True).to_csv(run / 'development_predictions.csv.gz', index=False, compression=GZIP)
    pd.DataFrame(counts).to_csv(run / 'development_clipping.csv', index=False)
    write_json(run / 'development_history_audit.json', audits)
    write_json(run / 'training_complete.json', {'completed_at': utcnow(), 'models': models,
        'selection_sha256': sha256(run / 'selection.json'), 'development_predictions_sha256': sha256(run / 'development_predictions.csv.gz'),
        'details_sha256': {f.relative_to(run).as_posix(): sha256(f) for f in (run / 'selection_details').iterdir()},
        'development_clipping_sha256': sha256(run / 'development_clipping.csv')})
    log('All 21 fits sealed before reference evaluation')


def evaluate(run):
    if (run / 'completion.json').exists(): raise FileExistsError('Evaluation is immutable')
    p, cache = context(run)
    trained = read_json(run / 'training_complete.json')
    check_hash(run / 'selection.json', trained['selection_sha256'])
    outputs, flags, audits, reloads = [], [], {}, {}
    for record in trained['models']:
        check_hash(run / record['file'], record['sha256'])
        bundle = joblib.load(run / record['file'])
        original = joblib.load(cache / f"final_completed_{record['condition']}.joblib")[0]
        for split in ('validation', 'test'):
            frame = read_frame(cache / f'{split}.csv.gz'); assert TARGET not in frame
            q = frame[frame.condition.eq(record['condition'])]
            pred, count = predict_record(bundle, q, split, 'completed')
            a, b = bundle.predict_all(q)[0], original.predict_all(q)[0]
            diff = max(float(np.max(np.abs(a[k] - b[k]))) for k in a); assert diff < 1e-9
            key = f"{split}_{record['condition']}"; reloads[key] = diff; audits[key] = history_audit(bundle.builder.history, q)
            outputs.append(pred); flags.extend(count)
    pred = pd.concat(outputs, ignore_index=True)
    pred.to_csv(run / 'reference_predictions.csv.gz', index=False, compression=GZIP)
    pd.DataFrame(flags).to_csv(run / 'reference_clipping.csv', index=False)
    write_json(run / 'evaluation_seal.json', {'sealed_at': utcnow(), 'selection_sha256': sha256(run / 'selection.json'),
        'models': trained['models'], 'predictions_sha256': sha256(run / 'reference_predictions.csv.gz')})
    source = ROOT / p['source_cache']
    for n in ('development.csv.gz', 'test_truth.csv'): check_hash(source / n, p['source_cache_hashes'][n])
    dev = read_frame(source / 'development.csv.gz')
    truth = pd.concat([dev.loc[dev.cohort.eq('validation'), ['sample_id', TARGET]], read_frame(source / 'test_truth.csv')])
    scored = pred.merge(truth.rename(columns={TARGET:'truth'}), on='sample_id', validate='many_to_one', how='left')
    assert np.isfinite(scored.truth).all()
    scored.to_csv(run / 'reference_scored_predictions.csv.gz', index=False, compression=GZIP)
    old = pd.concat([read_frame(PREVIOUS / n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz')], ignore_index=True)
    old = old[old.policy.eq('completed') & old.model.eq('selected')].copy(); old['model'] = 'group_selected_v3'
    prior = read_frame(PREVIOUS / 'paired_previous_predictions.csv.gz')
    prior = prior[prior.policy.eq('completed') & prior.model.eq('previous_control')]
    paired = pd.concat([old, prior], ignore_index=True)
    paired.to_csv(run / 'paired_previous_predictions.csv.gz', index=False, compression=GZIP)
    new = pd.concat([read_frame(run / 'development_predictions.csv.gz'), scored], ignore_index=True)
    robust = ROOT / 'runs/phm_cmp_robust_v2'
    reference = pd.concat([read_frame(robust / n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz')])
    reference = reference[reference.policy.eq('completed') & reference.model.eq('selected')].set_index(['partition','sample_id'])
    replay = new[new.model.eq('robust_reference')].set_index(['partition','sample_id'])
    np.testing.assert_allclose(replay.prediction, reference.loc[replay.index,'prediction'], atol=1e-9, rtol=0)
    metric_rows(pd.concat([new, paired], ignore_index=True)).to_csv(run / 'metrics.csv', index=False)
    for n, h in p['preserved_files'].items(): check_hash(ROOT / n, h)
    write_json(run / 'verification.json', {'verified_at': utcnow(), 'reload_max_differences': reloads,
        'history_audits': audits, 'reference_replayed_identically': True, 'preserved_files_unchanged': True,
        'preserved_files_checked': len(p['preserved_files'])})
    write_json(run / 'completion.json', {'completed_at': utcnow(), 'selection_sha256': sha256(run / 'selection.json'),
        'metrics_sha256': sha256(run / 'metrics.csv'), 'training_complete_sha256': sha256(run / 'training_complete.json'),
        'evaluation_seal_sha256': sha256(run / 'evaluation_seal.json'),
        'reference_scored_predictions_sha256': sha256(run / 'reference_scored_predictions.csv.gz'),
        'status': 'development_complete_no_deployment'})
    log('Reference evaluation complete')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('prepare','train','evaluate'))
    parser.add_argument('--run-dir', type=Path, default=ROOT / 'runs/phm_cmp_temporal_v4')
    a = parser.parse_args()
    with threadpool_limits(limits=4): globals()[a.action](a.run_dir.resolve())


if __name__ == '__main__': main()
