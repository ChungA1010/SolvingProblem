import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, USAGE
from cmp_ml.completion_features import (FINE, ROUGH, choose_phase, extract_candidates, p1_columns,
                                        segments, spectrum, time_spectrum)
from cmp_ml.completion_models import CompletionHistory, genetic_search
from cmp_ml.paper_features import APPENDIX, P1_COLUMNS, SIGNALS, extract


def trace():
    rng = np.random.default_rng(91)
    frame = pd.DataFrame(rng.uniform(.1, 2, (30, 19)), columns=SIGNALS)
    frame['TIMESTAMP'] = np.arange(30)
    frame['CHAMBER'], frame['WAFER_ID'], frame['STAGE'], frame['MACHINE_ID'] = 4, 11, 'A', 1
    return frame


def test_full_candidates_preserve_published_time_features():
    frame = trace()
    new, old = extract_candidates(frame), extract(frame)
    for col, (stat, n) in zip(P1_COLUMNS, APPENDIX):
        assert new[f'c1_{stat}_x{n}'] == old[col]
    assert len(p1_columns('rows_dc')) == len(p1_columns('time_ac')) == 85
    assert len(set(ROUGH)) == 45 and len(set(FINE)) == 12
    assert np.isfinite(list(new.values())).all()


def test_fft_frequency_and_dc_are_explicit():
    x = np.sin(2 * np.pi * .125 * np.arange(128))
    assert spectrum(x)[0] == pytest.approx(.5)
    assert spectrum(x)[1] == pytest.approx(.125)
    np.testing.assert_allclose(spectrum(np.ones(128), demean=True), 0)
    np.testing.assert_allclose(spectrum(np.ones(128)), [1, 0, 0])


def test_no_spectral_interpolation_or_phase_integration_across_gap():
    t = np.r_[np.arange(20), 1000 + np.arange(20)]
    x = np.r_[np.ones(20), np.ones(20) * 100]
    np.testing.assert_allclose(time_spectrum(t, x), 0)
    assert len(segments(t)) == 2
    frame = pd.DataFrame({'CENTER_AIR_BAG_PRESSURE': np.ones(40), 'SLURRY_FLOW_LINE_A': np.ones(40),
                          'WAFER_ROTATION': np.ones(40), 'STAGE_ROTATION': np.ones(40)}, index=t)
    ids, fallback = choose_phase(frame, '456', 'nominal')
    assert not fallback and t[ids[-1]] - t[ids[0]] == 19
    assert len(choose_phase(frame, '123', 'nominal')[0]) == 40


def test_prior_start_and_completed_histories_differ_without_query_labels():
    frame = pd.DataFrame({'WAFER_ID': [1, 2, 3], 'sample_id': ['a', 'b', 'c'], 'condition': ['Cond1'] * 3,
                          'machine': [1] * 3, 'start': [0, 10, 100], 'end': [5, 50, 110], TARGET: [20., 30., 999.]})
    for c in USAGE:
        frame[f'p2_primary_{c}_mean'] = [0., 1., 2.]
    query = frame.iloc[[1]].drop(columns=TARGET).copy()
    query['WAFER_ID'], query['start'] = 9, 20
    prior = CompletionHistory('raw', 'prior_start', False).fit(frame).transform(query)
    past = CompletionHistory('raw', 'completed', True).fit(frame).transform(query)
    assert prior[0, 0] == 30 and past[0, 0] == 20
    assert 999 in prior[0, 11:21]
    assert past[0, 11] == 20 and np.isnan(past[0, 12:21]).all()


def test_genetic_search_logs_nonempty_masks_and_grouped_fitness(monkeypatch):
    import cmp_ml.completion_models as mod
    from sklearn.tree import DecisionTreeRegressor
    # Tiny deterministic estimators test search/leak boundaries without expensive neural fits.
    monkeypatch.setattr(mod, 'ga_estimator', lambda family, seed: DecisionTreeRegressor(max_depth=2, random_state=seed))
    rng = np.random.default_rng(5)
    frame = pd.DataFrame(rng.normal(size=(24, 12)), columns=mod.p3_columns('123', 'nominal'))
    frame['WAFER_ID'] = np.repeat(np.arange(12), 2)
    frame['sample_id'] = [str(i) for i in range(24)]
    frame['p3_cpp'] = 1
    frame[TARGET] = 2 * frame.iloc[:, 0] + 1
    a = genetic_search(frame, '123', 'nominal', population=6, generations=3)
    b = genetic_search(frame, '123', 'nominal', population=6, generations=3)
    assert a['selection'] == b['selection']
    assert len(a['history']) == 3
    assert all(x['feature_count'] > 0 for x in a['logs'])
    for fold in a['membership']:
        fit = frame[frame.sample_id.isin(fold['train_ids'])]
        val = frame[frame.sample_id.isin(fold['validation_ids'])]
        assert not set(fit.WAFER_ID) & set(val.WAFER_ID)
    assert a['selection']['cv_mse'] == min(r['mse'] for r in a['logs'])


def test_tuning_combines_fold_losses_on_pandas_copy_on_write(monkeypatch):
    import cmp_ml.completion_models as mod
    from sklearn.dummy import DummyRegressor
    frame = pd.DataFrame({'WAFER_ID': np.arange(25), 'sample_id': [str(i) for i in range(25)],
        'condition': 'Cond1', 'machine': 1, 'start': np.arange(25) * 10, 'end': np.arange(25) * 10 + 1,
        TARGET: np.arange(25, dtype=float) + 40})
    for c in USAGE:
        frame[f'p2_primary_{c}_mean'] = np.arange(25, dtype=float)
    monkeypatch.setattr(mod, 'select_features', lambda X, y, s: (np.ones(X.shape[1], bool),
                                                               np.ones(X.shape[1]), np.ones(X.shape[1])))
    monkeypatch.setattr(mod, 'p2_regressors', lambda *args: {n: DummyRegressor() for n in ('P2_LR', 'P2_SVR', 'P2_Bagging')})
    monkeypatch.setattr(mod, 'tuning_models', lambda s: {'svr_test': ('P2_SVR', DummyRegressor()),
                                                       'bag_test': ('P2_Bagging', DummyRegressor())})
    spec = next(s for s in mod.P2_ARMS if s['id'] == 'full_ordinary')
    result = mod.fit_p2_completion(frame, spec)
    assert len(result['tuning_trials']) == 40
    assert result['tuning_choices'] == {'P2_SVR': 'svr_test', 'P2_Bagging': 'bag_test'}
    np.testing.assert_allclose(result['bundle'].weights, result['tuned_bundle'].weights)
