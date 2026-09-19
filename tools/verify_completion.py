"""Replay v3 artifacts and independently check selection/CV arithmetic."""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from cmp_ml.common import TARGET, read_json, write_json, sha256, utcnow
from cmp_ml.completion import RUN, ROOT, CACHE, check, context, predict_models, score_predictions
from cmp_ml.completion_features import p1_columns, p3_columns
from cmp_ml.reconstruction import read_frame


def close(a, b):
    np.testing.assert_allclose(a, b, rtol=1e-10, atol=1e-8, equal_nan=True)


def check_folds(folds, train, grouped=True):
    known = train.set_index('sample_id')
    for fold in folds:
        a, b = fold['train_ids'], fold['validation_ids']
        assert len(a) == len(set(a)) and len(b) == len(set(b))
        assert not set(a) & set(b)
        assert set(a) | set(b) == set(known.index)
        if grouped:
            assert not set(known.loc[a].WAFER_ID) & set(known.loc[b].WAFER_ID)


def main():
    train, valid = context()
    protocol = read_json(RUN / 'protocol.json')
    for relative in protocol.get('amendments', []):
        amendment = read_json(RUN / relative)
        folder = (RUN / relative).parent
        check(folder / 'completion_models_before.py', amendment['before'])
        check(RUN / 'code_snapshot/completion_models.py', amendment['after'])
        before = read_json(folder / 'protocol_before.json')
        assert before['document_sha256'] == protocol['document_sha256']
        for name, digest in amendment['retained_checkpoints'].items():
            check(CACHE / name.replace('.json', '.joblib'), digest)
    preserved = read_json(RUN / 'preserved_files.json')
    for name, digest in preserved.items():
        check(ROOT / name, digest)
    seal = read_json(RUN / 'evaluation_seal.json')
    check(RUN / 'selection.json', seal['selection_sha256'])
    check(RUN / 'model_registry.json', seal['registry_sha256'])
    complete = read_json(RUN / 'evaluation_complete.json')
    check(RUN / 'metrics.csv', complete['metrics_sha256'])
    check(RUN / 'predictions.csv.gz', complete['predictions_sha256'])
    ps = read_json(RUN / 'prediction_seal.json')
    check(RUN / 'predictions_without_truth.csv.gz', ps['sha256'])
    assert seal['sealed_at'] < ps['predicted_at'] < complete['completed_at']
    test = read_frame(CACHE / 'test_inputs.csv.gz')
    assert TARGET not in test
    query = pd.concat([valid.drop(columns=TARGET), test], ignore_index=True)
    # Poisoned query labels must have no influence, also after reversing row order.
    altered = query.iloc[::-1].copy(); altered[TARGET] = 1e15
    with threadpool_limits(limits=1):
        replay = predict_models(altered)
    keys = ['paper', 'arm', 'model', 'cohort', 'sample_id']
    replay = replay.sort_values(keys).reset_index(drop=True)
    saved = read_frame(RUN / 'predictions_without_truth.csv.gz').sort_values(keys).reset_index(drop=True)
    pd.testing.assert_frame_equal(replay[keys], saved[keys])
    close(replay.prediction, saved.prediction)
    maxdiff = float(np.max(np.abs(replay.prediction - saved.prediction)))
    pred = read_frame(RUN / 'predictions.csv.gz')
    truth = pd.concat([valid[['sample_id', TARGET]], read_frame(CACHE / 'test_truth.csv')]).set_index('sample_id')[TARGET]
    close(pred[TARGET], pred.sample_id.map(truth))
    expected = score_predictions(pred)
    actual = read_frame(RUN / 'metrics.csv')
    for c in expected:
        if pd.api.types.is_numeric_dtype(expected[c]):
            close(expected[c].to_numpy(float), actual[c].to_numpy(float))
        else:
            assert expected[c].tolist() == actual[c].tolist()
    choices = read_json(RUN / 'selection.json')['choices']
    grid = read_frame(RUN / 'p1_validation_grid.csv')
    assert len(grid) == 1440
    rank = read_frame(RUN / 'p1_rankings.csv')
    assert len(rank) == 80 * 85
    gp = read_frame(RUN / 'p1_validation_predictions.csv.gz')
    vtruth = valid.set_index('sample_id')[TARGET]
    gp['truth'] = gp.sample_id.map(vtruth)
    key = ['stage', 'view', 'k', 'repeat', 'model']
    computed = gp.assign(sq=lambda d: (d.prediction - d.truth) ** 2).groupby(key).sq.mean().sort_index()
    close(computed.to_numpy(), grid.set_index(key).mse.sort_index().to_numpy())
    selection_scores = grid.groupby(['stage', 'view', 'k']).mse.mean().reset_index()
    for stage in ('A', 'B'):
        best = selection_scores[selection_scores.stage.eq(stage)].sort_values(['mse', 'k', 'view']).iloc[0]
        chosen = choices['p1'][stage]
        assert chosen['view'] == best['view'] and chosen['k'] == int(best.k)
        m = joblib.load(RUN / f'models/P1_{stage}.joblib')
        ranking = rank[rank.stage.eq(stage) & rank['view'].eq(chosen['view']) & rank['repeat'].eq(0)].sort_values('rank')
        assert m.columns == ranking.feature.iloc[:chosen['k']].tolist()
        fit = train[train.STAGE.eq(stage) & ~train.excluded_extreme]
        folds = read_json(RUN / f'p1_{stage}_fold_selection.json')
        check_folds(folds, fit, grouped=False)
        assert all(len(f['selected']) == chosen['k'] for f in folds)
    fold_count = 0
    names = ['P2_Persistent', 'P2_KNN', 'P2_LR', 'P2_SVR', 'P2_Bagging']
    for path in sorted(RUN.glob('p2_*_cv.csv')):
        key = path.name.removesuffix('_cv.csv')
        m = joblib.load(RUN / 'models' / f'{key}.joblib')
        fit = m.history.library
        assert len(m.history.names) == 125
        assert set(fit.sample_id) <= set(train.sample_id)
        folds = read_json(RUN / f'{key}_folds.json'); check_folds(folds, fit)
        assert len(folds) == 20
        cv, votes = read_frame(path), read_frame(RUN / f'{key}_importance.csv')
        cp = read_frame(RUN / f'{key}_predictions.csv.gz')
        close(cp.truth, cp.sample_id.map(train.set_index('sample_id')[TARGET]))
        for fold in folds:
            block = cp[cp.fold.eq(fold['fold'])]
            assert set(block.sample_id) == set(fold['validation_ids'])
        result = cp.assign(sq=lambda d: (d.prediction - d.truth) ** 2).groupby(['fold', 'model']).sq.mean()
        close(cv.set_index(['fold', 'model']).mse.sort_index(), result.loc[cv.set_index(['fold', 'model']).index].sort_index())
        vote = votes.pivot(index='fold', columns='feature', values='selected')[m.history.names].sum(axis=0).to_numpy()
        selected = vote >= 10 if (vote >= 10).any() else vote > 0
        np.testing.assert_array_equal(selected, m.selected)
        errors = cv.pivot(index='fold', columns='model', values='mse')[names].to_numpy(copy=True)
        w = np.maximum(errors.mean(axis=0) + 3 * errors.std(axis=0, ddof=1), 1e-12) ** -3
        close(w / w.sum(), m.weights)
        fold_count += 20
        if 'full_ordinary' in key:
            condition = key.split('_')[-1]
            trials = read_frame(RUN / f'p2_tuning_{condition}_trials.csv')
            scores = trials.groupby(['candidate', 'model']).mse.agg(['mean', 'std']).reset_index()
            scores['upper'] = scores['mean'] + 3 * scores['std']
            for name in ('P2_SVR', 'P2_Bagging'):
                best = scores[scores.model.eq(name)].sort_values(['upper', 'candidate']).iloc[0].candidate
                assert choices['p2'][f'tuned_{condition}']['choices'][name] == best
                errors[:, names.index(name)] = trials[trials.candidate.eq(best)].sort_values('fold').mse
            tuned = joblib.load(RUN / f'models/p2_tuned_{condition}.joblib')
            w = np.maximum(errors.mean(axis=0) + 3 * errors.std(axis=0, ddof=1), 1e-12) ** -3
            close(w / w.sum(), tuned.weights)
    assert fold_count == 360
    ga_count = 0
    for route in ('456', '123'):
        candidates = []
        for path in sorted(RUN.glob(f'p3_{route}_*_evaluations.json')):
            phase = path.name.split('_')[2]
            logs = read_json(path)
            history = read_json(RUN / f'p3_{route}_{phase}_generations.json')
            assert len(history) == 8
            keys_seen = set()
            for entry in logs:
                assert entry['selected'] and set(entry['selected']) <= set(p3_columns(route, phase))
                key = (entry['family'], tuple(entry['selected']))
                assert key not in keys_seen; keys_seen.add(key)
            best = min((x for x in logs if x['mse'] is not None), key=lambda x: (x['mse'], x['feature_count'], x['family'], x['selected']))
            candidates.append((best['mse'], phase, best))
            check_folds(read_json(RUN / f'p3_{route}_{phase}_folds.json'), train[train.route.eq(route)])
            assert all(history[i]['best_mse'] <= history[i - 1]['best_mse'] for i in range(1, 8))
            ga_count += len(logs)
        _, phase, best = min(candidates, key=lambda x: x[:2])
        assert choices['p3'][route]['phase'] == phase
        assert choices['p3'][route]['columns'] == best['selected']
        close(choices['p3'][route]['cv_mse'], best['mse'])
    clean_protocol = read_json(RUN / 'p3_clean_sensitivity_protocol.json')
    check(ROOT / 'tools/complete_p3_clean_sensitivity.py', clean_protocol['script_sha256'])
    check(RUN / 'p3_clean_sensitivity_protocol.json', seal['matched_row_protocol_sha256'])
    assert clean_protocol['frozen_at'] < seal['sealed_at'] < ps['predicted_at']
    clean_logs = read_json(RUN / 'p3clean_123_nominal_evaluations.json')
    clean_history = read_json(RUN / 'p3clean_123_nominal_generations.json')
    assert len(clean_history) == 8
    check_folds(read_json(RUN / 'p3clean_123_nominal_folds.json'), train[train.route.eq('123') & ~train.excluded_extreme])
    best = min(clean_logs, key=lambda x: (float('inf') if x['mse'] is None else x['mse'], x['feature_count'], x['family'], x['selected']))
    assert choices['p3_clean']['columns'] == best['selected']
    close(choices['p3_clean']['cv_mse'], best['mse'])
    registry = read_json(RUN / 'model_registry.json')
    for original, clean in [('ga_selected', 'ga_clean_1977'), ('phase_1981', 'phase_clean_1977'), ('legacy_1981', 'legacy_clean_1977')]:
        a = next(r for r in registry if r['paper'] == 'p3' and r['arm'] == original and r['group'] == '456')
        b = next(r for r in registry if r['paper'] == 'p3' and r['arm'] == clean and r['group'] == '456')
        assert a['path'] == b['path'] and a['sha256'] == b['sha256']
    ga_count += len(clean_logs)
    result = dict(verified_at=utcnow(), preserved_files=len(preserved), model_files=len({r['path'] for r in registry}),
        registered_model_routes=len(registry),
        prediction_rows=len(pred), replay_maximum_absolute_difference=maxdiff, metric_rows=len(actual),
        p1_grid_fits=1440, p1_rankings=80, p2_inner_folds=fold_count, ga_unique_evaluations=ga_count,
        poisoned_query_labels_and_reversed_order='passed', selection_and_weights='passed',
        implementation_amendments=len(protocol.get('amendments', [])),
        limitation='Verifies this implementation and arithmetic, not undisclosed author settings or fresh generalization.')
    write_json(RUN / 'independent_verification.json', result)
    print(result)


if __name__ == '__main__':
    main()
