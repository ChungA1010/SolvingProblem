import inspect
from pathlib import Path
from types import SimpleNamespace

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.model_selection import GroupKFold

from cmp_ml.common import TARGET, USAGE, read_json, sha256
from cmp_ml.robust_features import SIGNALS
from cmp_ml.boosted_features import active_summary, extract_multi
from cmp_ml.boosted_models import (FeatureBuilder, crossfit_features, history_anchor,
    bounded_prediction, fit_condition, grid, SEED)
from cmp_ml.boosted_experiment import train


def frame():
    n = 36
    f = pd.DataFrame({'sample_id': [f's{i}' for i in range(n)], 'WAFER_ID': np.arange(n),
        'condition': 'Cond1', 'machine': 1, 'start': np.arange(n) * 100., 'end': np.arange(n) * 100. + 10,
        'group_id': [f'g{i // 2}' for i in range(n)], TARGET: 70 + np.arange(n) * .2})
    for zone in ('primary', 'secondary'):
        f[f'p2_{zone}_duration'] = 10.
        for c in USAGE + ['PRESSURIZED_CHAMBER_PRESSURE', 'CENTER_AIR_BAG_PRESSURE', 'WAFER_ROTATION', 'STAGE_ROTATION']:
            f[f'p2_{zone}_{c}_mean'] = np.arange(n) + 1.
    f['multi_primary_active_fraction'] = .5
    f['qc_primary_missing'] = False
    return f


def trace(times):
    return pd.DataFrame({s: np.ones(len(times)) for s in SIGNALS}, index=pd.Index(times, name='TIMESTAMP'))


def test_all_active_segments_count_without_bridging_idle_or_long_gaps():
    v = trace(np.r_[np.arange(21.), np.arange(100., 121.)])
    a = active_summary(v)
    assert a['episode_count'] == 2 and a['active_time'] == 40
    assert a['pressure_integral'] == 40 and a['pressure_rotation_proxy_integral'] == 80
    assert a['active_fraction'] == 1
    v.loc[10., 'CENTER_AIR_BAG_PRESSURE'] = 0
    a = active_summary(v)
    assert a['active_time'] == 38 and a['inactive_time'] == 2


def test_missing_slurry_is_not_an_active_episode_and_missing_zone_is_explicit():
    v = trace(np.arange(20.))
    v['SLURRY_FLOW_LINE_B'] = np.nan
    assert active_summary(v)['active_time'] == 0
    raw = v.reset_index(); raw['CHAMBER'] = 4
    a = extract_multi(raw)
    assert len(a) == 44 and np.isnan(a['multi_secondary_pressure_mean'])
    raw[TARGET] = -9999
    b = extract_multi(raw)
    for key in a:
        np.testing.assert_equal(a[key], b[key])


def test_anchor_has_explicit_one_sided_and_empty_history_fallbacks():
    X = np.full((4, 21), np.nan)
    X[0, :5], X[0, 11:] = 70, 80
    X[1, :5] = 60
    X[2, 11:] = 90
    np.testing.assert_equal(history_anchor(X, 100), [75, 60, 90, 100])


@pytest.mark.parametrize('policy', ['completed', 'retrospective'])
def test_crossfitted_training_features_exclude_all_labels_of_own_group(policy):
    f = frame()
    before, anchor, _, audit = crossfit_features(f, policy)
    changed = f.copy(); group = f.group_id.eq('g5')
    changed.loc[group, TARGET] = -10000
    after, anchor2, _, _ = crossfit_features(changed, policy)
    for view in before:
        np.testing.assert_allclose(before[view][group], after[view][group], equal_nan=True)
    np.testing.assert_allclose(anchor[group], anchor2[group])
    for block in audit:
        assert not set(block['reference_ids']) & set(block['query_ids'])


def test_completed_anchor_excludes_unfinished_and_future_labels():
    f = frame()
    q = f.iloc[[10]].copy(); q['start'] = 150
    b = FeatureBuilder().fit(f, 'completed')
    _, p = b.transform(q)
    changed = f.copy(); changed.loc[changed.end.ge(150), TARGET] = 1e8
    _, p2 = FeatureBuilder().fit(changed, 'completed').transform(q)
    np.testing.assert_equal(p, p2)


def test_feature_schema_excludes_target_identity_and_absolute_time():
    f = frame(); f['previous_error'] = 999
    b = FeatureBuilder().fit(f, 'completed')
    for names in b.names.values():
        assert not set(names) & {TARGET, 'WAFER_ID', 'sample_id', 'start', 'end', 'group_id', 'previous_error'}
    q = f.iloc[[1, 2]].copy()
    a, anchor = b.transform(q); q[TARGET] = -10000
    c, other = b.transform(q)
    for key in a:
        np.testing.assert_allclose(a[key], c[key], equal_nan=True)
    np.testing.assert_equal(anchor, other)


def test_residual_prediction_adds_anchor_then_applies_train_bounds():
    model = SimpleNamespace(predict=lambda _: np.array([-30., 2., 40.]))
    pred, clipped = bounded_prediction(model, None, np.array([70., 70., 70.]), True, 60, 90)
    np.testing.assert_equal(pred, [60, 72, 90])
    np.testing.assert_equal(clipped, [True, False, True])


class ConstantReference:
    def predict(self, q):
        return np.repeat(73.5, len(q)), np.zeros(len(q), bool)


def test_small_real_fit_reload_and_inner_selection_are_target_blind(tmp_path, monkeypatch):
    import cmp_ml.boosted_models as module
    f = frame()
    folds = np.empty(len(f), int)
    for k, (_, b) in enumerate(GroupKFold(3, shuffle=True, random_state=SEED).split(f, groups=f.group_id)):
        folds[b] = k
    old = pd.DataFrame({'sample_id': f.sample_id, 'variant': 'raw', 'prediction': 73.5, 'fold': folds})
    reference = SimpleNamespace(selected='raw', variants={'raw': ConstantReference()})
    small = [{**s, 'iterations': 3} for s in grid()[:1]]
    monkeypatch.setattr(module, 'grid', lambda: small)
    bundle, detail, inner = fit_condition(f, 'completed', reference, {'selected': 'raw'}, old)
    assert detail['selected'] == min(detail['scores'], key=lambda k: (detail['scores'][k], k))
    q = f.iloc[[15, 16]].copy()
    before = bundle.predict_all(q)[0]
    q[TARGET] = -1e12
    for key, values in bundle.predict_all(q)[0].items():
        np.testing.assert_allclose(values, before[key])
    joblib.dump(bundle, tmp_path / 'model.joblib')
    for key, values in joblib.load(tmp_path / 'model.joblib').predict_all(q)[0].items():
        np.testing.assert_allclose(values, before[key])
    assert inner['base_residual/rmse_d3'].between(inner.low, inner.high).all()


def test_fixed_search_and_no_heldout_labels_in_training_code():
    assert len(grid()) == 4
    assert {s['loss'] for s in grid()} == {'RMSE', 'Huber:delta=5'}
    assert 'test_truth' not in inspect.getsource(train)


def test_published_boosted_hashes_and_choices():
    root = Path(__file__).resolve().parents[1]
    run = root / 'runs/phm_cmp_boosted_v3'
    if not (run / 'completion.json').exists():
        pytest.skip('Experiment not yet completed')
    p = read_json(run / 'protocol.json')
    s = read_json(run / 'selection.json')
    seal = read_json(run / 'evaluation_seal.json')
    c = read_json(run / 'completion.json')
    assert p['frozen_at'] < s['selected_at'] < seal['sealed_at'] < c['completed_at']
    assert sha256(run / 'selection.json') == c['selection_sha256'] == seal['selection_sha256']
    assert sha256(run / 'metrics.csv') == c['metrics_sha256']
    for d in s['decisions'].values():
        assert d['selected'] == min(d['scores'], key=lambda k: (d['scores'][k], k))
    for name, h in p['preserved_files'].items():
        assert sha256(root / name) == h
    for name, h in p['code_sha256'].items():
        assert sha256(root / 'src/cmp_ml' / name) == h
