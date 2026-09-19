import inspect
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, read_json, sha256
from cmp_ml.robust_features import SIGNALS, extract_robust, feature_view, select_episode, statistics
from cmp_ml.robust_models import InputGuard, blend_weights, safe_components, quality_flag, grid, VARIANTS
from cmp_ml.robust_experiment import train


def trace():
    t = np.arange(100., dtype=float)
    f = pd.DataFrame({c: np.ones(len(t)) for c in SIGNALS})
    f['TIMESTAMP'], f['CHAMBER'] = t, 4
    f.loc[(t < 10) | (t > 50), 'CENTER_AIR_BAG_PRESSURE'] = 0.
    return f


def test_active_episode_excludes_long_idle_tail_and_ignores_labels():
    f = trace()
    a = extract_robust(f)
    assert a['phase__p2_primary_duration'] == 40
    assert a['gap__p2_primary_duration'] == 99
    assert a['qc_secondary_missing']
    f[TARGET] = -999
    b = extract_robust(f)
    for k in a:
        if pd.isna(a[k]):
            assert pd.isna(b[k])
        else:
            assert a[k] == b[k]


def test_integration_never_bridges_a_long_gap():
    f = trace().iloc[:4].set_index('TIMESTAMP')[SIGNALS]
    f.index = [0., 1., 1000., 1001.]
    result = statistics(f, np.arange(4))
    assert result['duration'] == 2
    assert result['PRESSURIZED_CHAMBER_PRESSURE_auc'] == 2
    assert result['USAGE_OF_DRESSER_decreasing'] == 0


def test_phase_tie_break_is_earliest_and_excluded_rows_break_segments():
    f = trace().set_index('TIMESTAMP')[SIGNALS]
    f['CENTER_AIR_BAG_PRESSURE'] = 0
    f.loc[5:20, 'CENTER_AIR_BAG_PRESSURE'] = 1
    f.loc[40:55, 'CENTER_AIR_BAG_PRESSURE'] = 1
    chosen, info = select_episode(f)
    assert chosen[0] == 5 and chosen[-1] == 20 and info['episodes'] == 2
    assert statistics(f, np.array([5, 6, 40, 41]))['duration'] == 2


def test_missing_and_ambiguous_episode_flags_are_explicit():
    f = trace()
    f['CENTER_AIR_BAG_PRESSURE'] = 0
    result = extract_robust(f)
    assert result['qc_primary_fallback'] and result['qc_primary_ambiguous']
    assert result['qc_secondary_missing'] and result['qc_secondary_fallback']
    assert pd.isna(result['phase__p2_secondary_CENTER_AIR_BAG_PRESSURE_mean'])
    assert len([n for n in result if n.startswith('phase__p2_')]) == 104


def test_transformed_features_do_not_advance_label_availability():
    f = pd.DataFrame({'start': [0.], 'end': [999.], 'p2_primary_duration': [999.],
                      'phase__p2_primary_duration': [40.]})
    p = feature_view(f, 'phase')
    assert p.end.iloc[0] == 999 and p.start.iloc[0] == 0 and p.p2_primary_duration.iloc[0] == 40


def test_guard_is_fit_only_on_training_and_encodes_unseen_missingness():
    X = np.tile(np.arange(30.)[:, None], (1, 25))
    guard = InputGuard().fit(X)
    low, high = guard.low.copy(), guard.high.copy()
    q = np.ones((2, 25)) * 10
    q[0, 22:] = 100000
    q[1, 24] = np.inf
    assert guard.flag(q).tolist() == [True, True]
    out = guard.transform(q)
    assert np.isfinite(out).all() and out.shape == (2, 50) and out[1, 49] == 1
    np.testing.assert_equal(guard.low, low)
    np.testing.assert_equal(guard.high, high)


def test_normal_missing_history_does_not_trigger_physical_ood():
    X = np.ones((10, 25))
    guard = InputGuard().fit(X)
    q = X[:1].copy(); q[:, :21] = np.nan
    assert not guard.flag(q)[0]
    assert np.isfinite(guard.transform(q)).all()


def test_out_of_support_predictions_fall_back_to_tree_not_evaluation_truth():
    fallback = np.array([72., 73., 74., 75.])
    raw = {'ridge': np.array([-197., np.inf, 150., 77.]), 'bag': fallback}
    out = safe_components(raw, 50., 100., fallback)
    np.testing.assert_equal(out['ridge'], [72., 73., 74., 77.])


def test_linear_blend_weight_is_capped_even_if_linear_oof_is_perfect():
    y = np.arange(30.) + 70
    Z = np.column_stack([y + 2, y + 3, y, y - 3, y + 1])
    w = blend_weights(Z, y, np.arange(30) % 3, True)
    assert w.sum() == pytest.approx(1) and (w >= 0).all() and w[2] <= .25 + 1e-8


def test_quality_flags_and_fixed_search_scope():
    f = pd.DataFrame({c: [False, False] for c in ['qc_primary_missing','qc_secondary_missing','qc_primary_ambiguous','qc_primary_fallback']})
    f.loc[1,'qc_secondary_missing'] = True
    assert quality_flag(f).tolist() == [False, True]
    assert len(grid()) == 9 and len(VARIANTS) == 4
    assert 'test_truth' not in inspect.getsource(train)


def test_published_robust_result_preserves_previous_evidence():
    root = Path(__file__).resolve().parents[1]
    run = root / 'runs/phm_cmp_robust_v2'
    if not run.exists():
        pytest.skip('Experiment not yet prepared')
    completion = read_json(run / 'completion.json')
    assert sha256(run / 'metrics.csv') == completion['metrics_sha256']
    selected, seal = read_json(run / 'selection.json'), read_json(run / 'evaluation_seal.json')
    assert selected['selected_at'] < seal['sealed_at']
    for key, detail in selected['decisions'].items():
        best = min((n for n, d in detail['variants'].items() if d['guarded']),
                   key=lambda n: (detail['variants'][n]['inner_mse'], n))
        assert detail['selected'] == best
        for d in detail['variants'].values():
            if d['guarded']:
                assert d['weights'][2] <= .25 + 1e-8
    assert read_json(run / 'verification.json')['preserved_files_unchanged']
    for n, h in read_json(run / 'protocol.json')['preserved_files'].items():
        assert sha256(root / n) == h
