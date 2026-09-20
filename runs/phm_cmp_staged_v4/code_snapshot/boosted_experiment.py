"""Frozen paired CatBoost study; independent condition fits run in three CPU workers."""
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
from .common import TARGET, read_json, sha256, utcnow, write_json
from .improvement import ROOT, CONDITIONS, checkpoint, prediction_rows, history_audit, metric_rows, audit_partition
from .improvement_models import POLICIES
from .paper_benchmark import log
from .reconstruction import GZIP, read_frame
from .robust_experiment import NAMES as OLD_NAMES
from .boosted_models import fit_condition, grid, VARIANTS

PREVIOUS = ROOT / 'runs/phm_cmp_robust_v2'
NAMES = OLD_NAMES + ('boosted_features.py', 'boosted_models.py', 'boosted_experiment.py')


def hashes():
    return {n: sha256(Path(__file__).parent / n) for n in NAMES}


def prepare(run):
    if run.exists():
        raise FileExistsError('Use a new experiment directory')
    cache = ROOT / '.cache/boosted' / run.name
    inputs = read_json(cache / 'inputs.json')
    check_hash(Path(__file__).parent / 'boosted_features.py', inputs['code_sha256'])
    for name, digest in inputs['cache_sha256'].items():
        check_hash(cache / name, digest)
    old = read_json(PREVIOUS / 'protocol.json')
    reference_cache = ROOT / old['cache']
    references = {}
    for part in [f'outer_{i}' for i in range(5)] + ['temporal', 'final']:
        for policy in POLICIES:
            for cond in CONDITIONS:
                key = f'{part}_{policy}_{cond}'
                path = reference_cache / f'{key}.joblib'
                digest = read_json(path.with_suffix('.json'))['sha256']
                check_hash(path, digest)
                references[key] = digest
    run.mkdir(parents=True)
    (run / 'PROTOCOL.md').write_bytes((ROOT / 'docs/p2-boosted-v3.md').read_bytes())
    for name in ('partitions.csv', 'manifest.csv', 'partition_audit.json'):
        check_hash(PREVIOUS / name, old['frozen_files'][name])
        (run / name).write_bytes((PREVIOUS / name).read_bytes())
    for name in ('tail_audit.csv', 'inputs.json'):
        (run / name).write_bytes((cache / name).read_bytes())
    for name in hashes():
        path = run / 'code_snapshot' / name
        path.parent.mkdir(exist_ok=True)
        path.write_bytes((Path(__file__).parent / name).read_bytes())
    preserved = dict(old['preserved_files'])
    preserved.update({p.relative_to(ROOT).as_posix(): sha256(p) for p in PREVIOUS.rglob('*') if p.is_file()})
    write_json(run / 'protocol.json', {'frozen_at': utcnow(), 'grid': grid(), 'variants': VARIANTS, 'policies': POLICIES,
        'cache': cache.relative_to(ROOT).as_posix(), 'cache_sha256': inputs['cache_sha256'],
        'reference_cache': reference_cache.relative_to(ROOT).as_posix(), 'reference_cache_hashes': references,
        'source_cache': old['source_cache'], 'source_cache_hashes': old['source_cache_hashes'],
        'code_sha256': hashes(), 'preserved_files': preserved,
        'frozen_files': {n: sha256(run / n) for n in ('PROTOCOL.md', 'partitions.csv', 'manifest.csv', 'partition_audit.json', 'tail_audit.csv', 'inputs.json')},
        'workers': 3, 'test_exposure': 'Previous Test and outer outcomes informed development; not fresh independent validation.'})
    write_json(run / 'environment.json', {'python': platform.python_version(), 'packages': {n: version(n) for n in
        ('catboost', 'numpy', 'pandas', 'scipy', 'scikit-learn', 'joblib')}})
    log('Protocol, code, inputs, reference checkpoints and splits frozen')


def context(run):
    p = read_json(run / 'protocol.json')
    if hashes() != p['code_sha256']:
        raise ValueError('Frozen training code changed')
    for name, digest in p['frozen_files'].items():
        check_hash(run / name, digest)
    cache = ROOT / p['cache']
    for name, digest in p['cache_sha256'].items():
        check_hash(cache / name, digest)
    return p, cache


def worker(key, data, policy, cache, reference_path, reference_hash):
    with threadpool_limits(limits=4):
        check_hash(reference_path, reference_hash)
        old_bundle, old_detail, old_inner = joblib.load(reference_path)
        assert set(old_inner.sample_id) == set(data.sample_id)
        log(f'Fitting {key}: {len(data)} samples')
        checkpoint(cache, key, lambda: fit_condition(data, policy, old_bundle, old_detail, old_inner,
            lambda message: log(f'{key}: {message}')))
    return key


def predict_record(bundle, frame, partition, policy):
    values, flags = bundle.predict_all(frame.drop(columns=[TARGET], errors='ignore'))
    pred = prediction_rows(frame, values, partition, policy)
    counts = [{'sample_id': sid, 'partition': partition, 'policy': policy, 'model': name, 'clipped': bool(c)}
              for name, f in flags.items() for sid, c in zip(frame.sample_id, f)]
    return pred, counts


def train(run):
    if (run / 'training_complete.json').exists():
        raise FileExistsError('Completed training is immutable')
    p, cache = context(run)
    frame = read_frame(cache / 'training.csv.gz')
    if not frame.cohort.eq('training').all():
        raise ValueError('Nontraining input to model selection')
    parts = pd.read_csv(run / 'partitions.csv')
    plans = {}
    for partition in [f'outer_{i}' for i in range(5)] + ['temporal', 'final']:
        if partition == 'final':
            fit, query = frame, None
        else:
            block = parts[parts.partition.eq(partition)]
            fit = frame[frame.sample_id.isin(block.loc[block.role.eq('train'), 'sample_id'])]
            query = frame[frame.sample_id.isin(block.loc[block.role.eq('evaluation'), 'sample_id'])]
            audit_partition(fit, query, partition == 'temporal')
        for policy in POLICIES:
            for condition in CONDITIONS:
                key = f'{partition}_{policy}_{condition}'
                plans[key] = (partition, policy, condition, fit[fit.condition.eq(condition)].reset_index(drop=True), query)
    with ProcessPoolExecutor(max_workers=p['workers']) as pool:
        futures = [pool.submit(worker, key, data, policy, cache, ROOT / p['reference_cache'] / f'{key}.joblib',
            p['reference_cache_hashes'][key]) for key, (_, policy, _, data, _) in plans.items()]
        for future in as_completed(futures):
            log(f'Completed {future.result()}')
    outputs, decisions, counts, models, audits = [], {}, [], [], {}
    for key, (partition, policy, condition, _, query) in plans.items():
        path = cache / f'{key}.joblib'
        check_hash(path, read_json(path.with_suffix('.json'))['sha256'])
        bundle, detail, inner = joblib.load(path)
        detail_path = run / 'selection_details' / f'{key}.json'
        write_json(detail_path, detail)
        inner.to_csv(detail_path.with_suffix('.csv.gz'), index=False, compression=GZIP)
        decisions[key] = {'selected': detail['selected'], 'scores': detail['scores'], 'chosen_specs': detail['chosen_specs'],
            'policy': policy, 'condition': condition, 'reference_variant': detail['reference_variant']}
        if query is not None:
            q = query[query.condition.eq(condition)]
            pred, flags = predict_record(bundle, q, partition, policy)
            outputs.append(pred); counts.extend(flags)
            audits[key] = history_audit(bundle.builder.history, q)
        else:
            dest = run / 'models' / f'{policy}_{condition}.joblib'
            dest.parent.mkdir(exist_ok=True)
            joblib.dump(bundle, dest, compress=3)
            models.append({'file': dest.relative_to(run).as_posix(), 'sha256': sha256(dest), 'policy': policy, 'condition': condition})
    write_json(run / 'selection.json', {'selected_at': utcnow(), 'decisions': decisions,
        'rule': 'Minimum inner MSE among four tuned CatBoost variants and robust v2 reference; tie ID. No reference split selection.'})
    pd.concat(outputs, ignore_index=True).to_csv(run / 'development_predictions.csv.gz', index=False, compression=GZIP)
    pd.DataFrame(counts).to_csv(run / 'development_clipping.csv', index=False)
    write_json(run / 'development_history_audit.json', audits)
    write_json(run / 'training_complete.json', {'completed_at': utcnow(), 'models': models,
        'selection_sha256': sha256(run / 'selection.json'), 'development_predictions_sha256': sha256(run / 'development_predictions.csv.gz'),
        'details_sha256': {f.relative_to(run).as_posix(): sha256(f) for f in (run / 'selection_details').iterdir()},
        'development_clipping_sha256': sha256(run / 'development_clipping.csv')})
    log('All 42 fits and final choices sealed')


def evaluate(run):
    if (run / 'completion.json').exists():
        raise FileExistsError('Completed evaluation is immutable')
    p, cache = context(run)
    trained = read_json(run / 'training_complete.json')
    check_hash(run / 'selection.json', trained['selection_sha256'])
    frames = {n: read_frame(cache / f'{n}.csv.gz') for n in ('validation', 'test')}
    outputs, counts, reloads, audits = [], [], {}, {}
    for record in trained['models']:
        check_hash(run / record['file'], record['sha256'])
        bundle = joblib.load(run / record['file'])
        original = joblib.load(cache / f"final_{record['policy']}_{record['condition']}.joblib")[0]
        for split, frame in frames.items():
            if TARGET in frame:
                raise ValueError('Held-out labels in prediction cache')
            q = frame[frame.condition.eq(record['condition'])]
            pred, flags = predict_record(bundle, q, split, record['policy'])
            a, b = bundle.predict_all(q)[0], original.predict_all(q)[0]
            difference = max(float(np.max(np.abs(a[k] - b[k]))) for k in a)
            assert difference < 1e-9
            key = f"{split}_{record['policy']}_{record['condition']}"
            reloads[key] = difference
            audits[key] = history_audit(bundle.builder.history, q)
            outputs.append(pred); counts.extend(flags)
    pred = pd.concat(outputs, ignore_index=True)
    pred.to_csv(run / 'reference_predictions.csv.gz', index=False, compression=GZIP)
    pd.DataFrame(counts).to_csv(run / 'reference_clipping.csv', index=False)
    write_json(run / 'evaluation_seal.json', {'sealed_at': utcnow(), 'selection_sha256': sha256(run / 'selection.json'),
        'models': trained['models'], 'predictions_sha256': sha256(run / 'reference_predictions.csv.gz')})
    source = ROOT / p['source_cache']
    for n in ('development.csv.gz', 'test_truth.csv'):
        check_hash(source / n, p['source_cache_hashes'][n])
    dev = read_frame(source / 'development.csv.gz')
    truth = pd.concat([dev.loc[dev.cohort.eq('validation'), ['sample_id', TARGET]], pd.read_csv(source / 'test_truth.csv', float_precision='round_trip')])
    scored = pred.merge(truth.rename(columns={TARGET: 'truth'}), on='sample_id', validate='many_to_one', how='left')
    assert np.isfinite(scored.truth).all()
    scored.to_csv(run / 'reference_scored_predictions.csv.gz', index=False, compression=GZIP)
    previous = read_frame(PREVIOUS / 'paired_previous_predictions.csv.gz')
    previous = previous[previous.model.isin(['paper_v2', 'previous_control'])]
    previous.to_csv(run / 'paired_previous_predictions.csv.gz', index=False, compression=GZIP)
    new = pd.concat([read_frame(run / 'development_predictions.csv.gz'), scored], ignore_index=True)
    old = pd.concat([read_frame(PREVIOUS / n) for n in ('development_predictions.csv.gz', 'reference_scored_predictions.csv.gz')], ignore_index=True)
    old = old[old.model.eq('selected')].set_index(['partition', 'policy', 'sample_id'])
    replay = new[new.model.eq('robust_reference')].set_index(['partition', 'policy', 'sample_id'])
    np.testing.assert_allclose(replay.prediction, old.loc[replay.index, 'prediction'], atol=1e-9, rtol=0)
    metric_rows(pd.concat([new, previous], ignore_index=True)).to_csv(run / 'metrics.csv', index=False)
    for name, digest in p['preserved_files'].items():
        check_hash(ROOT / name, digest)
    write_json(run / 'verification.json', {'verified_at': utcnow(), 'reload_max_differences': reloads,
        'history_audits': audits, 'reference_replayed_identically': True,
        'preserved_files_checked': len(p['preserved_files']), 'preserved_files_unchanged': True})
    write_json(run / 'completion.json', {'completed_at': utcnow(), 'selection_sha256': sha256(run / 'selection.json'),
        'metrics_sha256': sha256(run / 'metrics.csv'), 'training_complete_sha256': sha256(run / 'training_complete.json'),
        'evaluation_seal_sha256': sha256(run / 'evaluation_seal.json'),
        'reference_scored_predictions_sha256': sha256(run / 'reference_scored_predictions.csv.gz'),
        'status': 'development_complete_no_new_independent_test_no_deployment'})
    log('Reference evaluation complete; previous models and results preserved')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('prepare', 'train', 'evaluate'))
    parser.add_argument('--run-dir', type=Path, default=ROOT / 'runs/phm_cmp_boosted_v3')
    args = parser.parse_args()
    with threadpool_limits(limits=4):
        globals()[args.action](args.run_dir.resolve())


if __name__ == '__main__':
    main()
