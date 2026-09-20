"""Reproducible prepare/train/evaluate CLI for all three missing-method experiments."""
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

from .common import KEYS, TARGET, read_json, sample_id, sha256, utcnow, write_json
from .completion_features import (PHASES, VIEWS, PUBLISHED_ROUGH, PUBLISHED_FINE, catalog, extract_candidates, p1_columns)
from .completion_models import (P2_ARMS, SEED, fit_p1_selected, fit_p2_completion, fit_ga_final,
                                 genetic_search, p1_grid_task, p1_models, rank85)
from .paper_features import APPENDIX, P1_COLUMNS
from .reconstruction import metrics, read_frame
from .reconstruction_models import fit_p3_variant

ROOT = Path(__file__).resolve().parents[2]
RUN = ROOT / 'runs/phm_cmp_completion_v3'
CACHE = ROOT / '.cache/completion/phm_cmp_completion_v3'
OLD = ROOT / 'runs/phm_cmp_reconstruction_v2'
GZIP = {'method': 'gzip', 'mtime': 0}
MODULES = ['completion.py', 'completion_features.py', 'completion_models.py', 'common.py', 'paper_features.py',
           'paper_models.py', 'reconstruction.py', 'reconstruction_models.py', 'reconstruction_features.py']


def log(text):
    print(f'[{utcnow()}] {text}', flush=True)


def code_hashes():
    return {n: sha256(Path(__file__).parent / n) for n in MODULES}


def check(path, expected):
    if sha256(path) != expected:
        raise ValueError(f'Changed file: {path}')


def prepare():
    if RUN.exists():
        raise FileExistsError('New run already exists')
    prior = {p.relative_to(ROOT).as_posix(): sha256(p) for p in (ROOT / 'runs').rglob('*') if p.is_file()}
    cache_old = ROOT / '.cache/reconstruction/phm_cmp_reconstruction_v2'
    dev, test = read_frame(cache_old / 'development.csv.gz'), read_frame(cache_old / 'test_inputs.csv.gz')
    inputs = pd.concat([dev.drop(columns=TARGET), test], ignore_index=True)
    sources = read_json(ROOT / 'runs/phm_cmp_robust_v2/sources.json')
    records = []
    for cohort in ('training', 'validation', 'test'):
        folder = ROOT.parent / ('.tmp_phm_review/PHM/Dataset/CMP1/CMP-data/training' if cohort == 'training'
                                else f'cmp-virtual-lab-ml/data/phm2016_external/{cohort}')
        raws = []
        for item in (s for s in sources if s['cohort'] == cohort):
            path = folder / item['file']
            check(path, item['sha256'])
            raws.append(pd.read_csv(path))
        for i, ((wafer, stage), trace) in enumerate(pd.concat(raws, ignore_index=True).groupby(KEYS, sort=True), 1):
            records.append({'sample_id': sample_id(wafer, stage), **extract_candidates(trace)})
            if i % 250 == 0:
                log(f'{cohort}: extracted {i} wafer-stage samples')
        log(f'Target-free 85 / 45 / 12 candidate extraction: {cohort}')
    frame = inputs.merge(pd.DataFrame(records), on='sample_id', validate='one_to_one')
    if len(frame) != 2829 or frame.sample_id.duplicated().any():
        raise ValueError('Unexpected candidate sample inventory')
    maximum = 0.
    for col, (stat, n) in zip(P1_COLUMNS, APPENDIX):
        maximum = max(maximum, float(np.abs(frame[col] - frame[f'c1_{stat}_x{n}']).max()))
        np.testing.assert_allclose(frame[col], frame[f'c1_{stat}_x{n}'], rtol=1e-12, atol=1e-12)
    for phase in PHASES:
        frame[f'c3_{phase}_cpp'], frame[f'c3_{phase}_first'] = frame.p3_cpp, frame.p3_first
    RUN.mkdir(parents=True); CACHE.mkdir(parents=True, exist_ok=True)
    frame[frame.cohort.ne('test')].merge(dev[['sample_id', TARGET]], on='sample_id', validate='one_to_one').to_csv(
        CACHE / 'development.csv.gz', index=False, compression=GZIP)
    frame[frame.cohort.eq('test')].to_csv(CACHE / 'test_inputs.csv.gz', index=False, compression=GZIP)
    # Test labels are copied as bytes, never parsed during preparation or fitting.
    (CACHE / 'test_truth.csv').write_bytes((cache_old / 'test_truth.csv').read_bytes())
    frame[['sample_id', 'WAFER_ID', 'STAGE', 'cohort', 'condition', 'route', 'excluded_extreme', 'p3_cpp'] +
          [c for c in frame if c.startswith('qc_')]].to_csv(RUN / 'manifest.csv', index=False)
    write_json(RUN / 'feature_catalog.json', catalog())
    (RUN / 'PROTOCOL.md').write_bytes((ROOT / 'docs/paper-completion-v3.md').read_bytes())
    for n in MODULES:
        dest = RUN / 'code_snapshot' / n
        dest.parent.mkdir(exist_ok=True)
        dest.write_bytes((Path(__file__).parent / n).read_bytes())
    write_json(RUN / 'preserved_files.json', prior)
    write_json(RUN / 'sources.json', sources)
    write_json(RUN / 'environment.json', {'python': platform.python_version(), 'packages': {
        n: version(n) for n in ('numpy', 'pandas', 'scipy', 'scikit-learn', 'joblib', 'threadpoolctl')}})
    write_json(RUN / 'protocol.json', {'frozen_at': utcnow(), 'seed': SEED, 'code_hashes': code_hashes(),
        'cache_hashes': {p.name: sha256(p) for p in CACHE.glob('*.csv*')}, 'document_sha256': sha256(RUN / 'PROTOCOL.md'),
        'p2_arms': P2_ARMS, 'appendix35_maximum_difference': maximum,
        'test_exposure': 'Official Validation and Test have been examined in prior runs; not fresh holdouts.',
        'status': 'partial_reconstruction_with_explicit_assumptions', 'preserved_count': len(prior)})
    log(f'Frozen protocol; preserved {len(prior)} previous files; Appendix35 maximum delta={maximum}')


def context():
    protocol = read_json(RUN / 'protocol.json')
    if code_hashes() != protocol['code_hashes']:
        raise ValueError('Source changed after freeze')
    check(RUN / 'PROTOCOL.md', protocol['document_sha256'])
    for n, digest in protocol['cache_hashes'].items():
        check(CACHE / n, digest)
    dev = read_frame(CACHE / 'development.csv.gz')
    assert set(dev.cohort) == {'training', 'validation'}
    return dev[dev.cohort.eq('training')].reset_index(drop=True), dev[dev.cohort.eq('validation')].reset_index(drop=True)


def worker(kind, key, args):
    path = CACHE / f'{key}.joblib'
    seal = CACHE / f'{key}.json'
    if seal.exists():
        check(path, read_json(seal)['sha256'])
        return key
    with threadpool_limits(limits=1):
        if kind == 'p1':
            result = p1_grid_task(*args)
        elif kind == 'p2':
            result = fit_p2_completion(*args)
        elif kind == 'p3':
            result = genetic_search(*args)
        else:
            raise ValueError(kind)
    joblib.dump(result, path, compress=3)
    write_json(seal, {'sha256': sha256(path), 'completed_at': utcnow()})
    return key


def tasks(kind, records, workers):
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(worker, kind, key, args) for key, args in records]
        for i, f in enumerate(as_completed(futures), 1):
            log(f'{kind} {i}/{len(records)} complete: {f.result()}')


def cached(key):
    path = CACHE / f'{key}.joblib'
    check(path, read_json(CACHE / f'{key}.json')['sha256'])
    return joblib.load(path)


def save_model(name, model, registry, paper, arm, group_column, group):
    path = RUN / 'models' / f'{name}.joblib'
    path.parent.mkdir(exist_ok=True)
    joblib.dump(model, path, compress=3)
    registry.append(dict(path=path.relative_to(RUN).as_posix(), paper=paper, arm=arm, group_column=group_column,
                         group=group, sha256=sha256(path)))


def train(workers=4):
    if (RUN / 'evaluation_seal.json').exists():
        raise FileExistsError('Completed fit cannot be modified')
    train_frame, valid = context()
    models, selection = [], {'p1': {}, 'p2': {}, 'p3': {}}
    grid_tasks = [(f'p1_{s}_{v}_{r}', (train_frame[train_frame.STAGE.eq(s) & ~train_frame.excluded_extreme],
        valid[valid.STAGE.eq(s)], v, r)) for s in ('A', 'B') for v in VIEWS for r in range(20)]
    tasks('p1', grid_tasks, workers)
    rows, rankings, predictions = [], [], []
    for key, args in grid_tasks:
        stage = args[0].STAGE.iloc[0]
        scores, preds, ranks = cached(key)
        rows.extend(dict(stage=stage, **r) for r in scores)
        rankings.extend(dict(stage=stage, view=args[2], repeat=args[3], **r) for r in ranks)
        for p in preds:
            predictions.append(pd.DataFrame(dict(sample_id=args[1].sample_id, stage=stage, **p)))
    grid = pd.DataFrame(rows)
    grid.to_csv(RUN / 'p1_validation_grid.csv', index=False)
    pd.DataFrame(rankings).to_csv(RUN / 'p1_rankings.csv', index=False)
    pd.concat(predictions, ignore_index=True).to_csv(RUN / 'p1_validation_predictions.csv.gz', index=False, compression=GZIP)
    summaries = grid.groupby(['stage', 'view', 'k']).mse.mean().reset_index().sort_values(['mse', 'k', 'view'])
    summaries.to_csv(RUN / 'p1_selection_scores.csv', index=False)
    frozen_meta = read_json(OLD / 'selection.json')['choices']['p1']
    for stage in ('A', 'B'):
        row = summaries[summaries.stage.eq(stage)].iloc[0]
        spec = dict(view=row['view'], k=int(row.k), validation_mse=float(row.mse))
        selection['p1'][stage] = spec
        fit = train_frame[train_frame.STAGE.eq(stage) & ~train_frame.excluded_extreme]
        with threadpool_limits(limits=1):
            model = fit_p1_selected(fit, spec['view'], spec['k'], frozen_meta[stage])
        save_model(f'P1_{stage}', model, models, 'p1', 'selected', 'STAGE', stage)
        write_json(RUN / f'p1_{stage}_fold_selection.json', model.fold_selection)
        log(f'P1 Stage {stage} selected {spec}')
    p2_tasks = [(f'p2_{s["id"]}_{c}', (train_frame[train_frame.condition.eq(c) & (~train_frame.excluded_extreme if s['clean'] else True)], s))
                for s in P2_ARMS for c in ('Cond1', 'Cond2', 'Cond3')]
    tasks('p2', p2_tasks, workers)
    for key, args in p2_tasks:
        result, condition, arm = cached(key), args[0].condition.iloc[0], args[1]['id']
        save_model(key, result['bundle'], models, 'p2', arm, 'condition', condition)
        pd.DataFrame(result['cv']).to_csv(RUN / f'{key}_cv.csv', index=False)
        pd.DataFrame(result['importance']).to_csv(RUN / f'{key}_importance.csv', index=False)
        result['predictions'].to_csv(RUN / f'{key}_predictions.csv.gz', index=False, compression=GZIP)
        write_json(RUN / f'{key}_folds.json', result['membership'])
        selection['p2'][f'{arm}_{condition}'] = dict(weights=result['bundle'].weights.tolist(),
            selected=np.array(result['bundle'].history.names)[result['bundle'].selected].tolist())
        if 'tuned_bundle' in result:
            save_model(f'p2_tuned_{condition}', result['tuned_bundle'], models, 'p2', 'tuned', 'condition', condition)
            pd.DataFrame(result['tuning_trials']).to_csv(RUN / f'p2_tuning_{condition}_trials.csv', index=False)
            pd.DataFrame(result['tuning_summary']).to_csv(RUN / f'p2_tuning_{condition}_summary.csv', index=False)
            selection['p2'][f'tuned_{condition}'] = dict(choices=result['tuning_choices'], weights=result['tuned_bundle'].weights.tolist())
    ga_tasks = [(f'p3_{route}_{phase}', (train_frame[train_frame.route.eq(route)], route, phase))
                for route in ('456', '123') for phase in (PHASES if route == '456' else ('nominal',))]
    tasks('p3', ga_tasks, min(workers, 4))
    for key, args in ga_tasks:
        result = cached(key)
        write_json(RUN / f'{key}_evaluations.json', result['logs'])
        write_json(RUN / f'{key}_generations.json', result['history'])
        write_json(RUN / f'{key}_folds.json', result['membership'])
    for route in ('456', '123'):
        results = [cached(key) for key, args in ga_tasks if args[1] == route]
        best = min(results, key=lambda r: (r['selection']['cv_mse'], r['selection']['phase']))
        selection['p3'][route] = best['selection']
        save_model(f'P3_{route}', best['bundle'], models, 'p3', 'ga_selected', 'route', route)
        fit = train_frame[train_frame.route.eq(route)]
        with threadpool_limits(limits=1):
            legacy = fit_p3_variant(fit, SEED, {'forest': 'standard'})
            columns = [f'c3_nominal_{c}' for c in (PUBLISHED_ROUGH if route == '456' else PUBLISHED_FINE)]
            phase_control = fit_ga_final(fit, columns, 'rf')
        save_model(f'P3_legacy_{route}', legacy, models, 'p3', 'legacy_1981', 'route', route)
        save_model(f'P3_phase_{route}', phase_control, models, 'p3', 'phase_1981', 'route', route)
        log(f'P3 route {route} selected: {best["selection"]}')
    write_json(RUN / 'selection.json', dict(selected_at=utcnow(), choices=selection))
    write_json(RUN / 'model_registry.json', models)
    write_json(RUN / 'evaluation_seal.json', dict(sealed_at=utcnow(), selection_sha256=sha256(RUN / 'selection.json'),
        registry_sha256=sha256(RUN / 'model_registry.json'), models={m['path']: m['sha256'] for m in models},
        test_inputs_sha256=sha256(CACHE / 'test_inputs.csv.gz'), sources=code_hashes()))
    log('All choices and 29 fitted model files sealed before parsing Test targets')


def predict_models(frame):
    blocks = []
    for item in read_json(RUN / 'model_registry.json'):
        path = RUN / item['path']; check(path, item['sha256'])
        model = joblib.load(path)
        part = frame[frame[item['group_column']].astype(str).eq(item['group'])]
        pred = model.predict_all(part.drop(columns=[TARGET], errors='ignore'))
        for name, p in pred.items():
            blocks.append(pd.DataFrame(dict(sample_id=part.sample_id, cohort=part.cohort, STAGE=part.STAGE,
                condition=part.condition, route=part.route, paper=item['paper'], arm=item['arm'], model=name, prediction=p)))
    return pd.concat(blocks, ignore_index=True)


def score_predictions(predictions):
    rows = []
    for key, group in predictions.groupby(['paper', 'arm', 'model', 'cohort'], sort=True):
        meta = dict(zip(['paper', 'arm', 'model', 'cohort'], key))
        rows.append(dict(**meta, subgroup='all', **metrics(group[TARGET], group.prediction)))
        for field in ('STAGE', 'condition', 'route'):
            for value, subset in group.groupby(field):
                rows.append(dict(**meta, subgroup=f'{field}={value}', **metrics(subset[TARGET], subset.prediction)))
    return pd.DataFrame(rows)


def evaluate():
    if (RUN / 'metrics.csv').exists():
        raise FileExistsError('Scored result is immutable')
    _, valid = context()
    seal = read_json(RUN / 'evaluation_seal.json')
    check(RUN / 'selection.json', seal['selection_sha256'])
    check(RUN / 'model_registry.json', seal['registry_sha256'])
    test = read_frame(CACHE / 'test_inputs.csv.gz')
    assert TARGET not in test
    queries = pd.concat([valid.drop(columns=TARGET), test], ignore_index=True)
    with threadpool_limits(limits=1):
        predictions = predict_models(queries)
    predictions.to_csv(RUN / 'predictions_without_truth.csv.gz', index=False, compression=GZIP)
    write_json(RUN / 'prediction_seal.json', dict(predicted_at=utcnow(), sha256=sha256(RUN / 'predictions_without_truth.csv.gz')))
    # First parse of Test targets in this experiment, after all choices and predictions are sealed.
    truth = pd.concat([valid[['sample_id', TARGET]], read_frame(CACHE / 'test_truth.csv')], ignore_index=True)
    result = predictions.merge(truth, on='sample_id', validate='many_to_one')
    if len(result) != len(predictions):
        raise ValueError('Missing evaluation labels')
    result.to_csv(RUN / 'predictions.csv.gz', index=False, compression=GZIP)
    score_predictions(result).to_csv(RUN / 'metrics.csv', index=False)
    write_json(RUN / 'evaluation_complete.json', dict(completed_at=utcnow(), predictions_sha256=sha256(RUN / 'predictions.csv.gz'),
        metrics_sha256=sha256(RUN / 'metrics.csv'), selection_sha256=seal['selection_sha256']))
    log('Scored all declared arms; no model automatically promoted')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['prepare', 'train', 'evaluate'])
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if args.action == 'prepare':
        with threadpool_limits(limits=1):
            prepare()
    elif args.action == 'train':
        train(args.workers)
    else:
        evaluate()


if __name__ == '__main__':
    main()
