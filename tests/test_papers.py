import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, USAGE
from cmp_ml.paper_features import APPENDIX, P1_COLUMNS, SIGNALS, moment_features, assign_cpp
from cmp_ml.paper_models import HistoryFeatures, integration_weights, regression_metrics


def test_paper_appendix_mapping_and_population_moments():
    assert len(SIGNALS) == 19 and len(APPENDIX) == len(P1_COLUMNS) == 35
    assert SIGNALS[0] == "USAGE_OF_BACKING_FILM"
    assert SIGNALS[18] == "EDGE_AIR_BAG_PRESSURE"
    assert APPENDIX[0] == ("moment3", 7) and APPENDIX[-1] == ("kurtosis", 25)
    result = moment_features(np.array([[0., 3.], [2., 3.]]))
    assert result["std"].tolist() == [1., 0.]
    assert result["kurtosis"].tolist() == [1., 0.]


def test_metrics_match_hand_calculation_and_literal_s_score():
    result = regression_metrics([10., 20.], [8., 24.])
    assert result["mse"] == 10
    assert result["rmse"] == pytest.approx(np.sqrt(10))
    assert result["relative_error"] == pytest.approx(.2)
    assert result["r2"] == pytest.approx(.6)
    assert result["s_score_literal_mean"] == pytest.approx((np.exp(2 / 13) + np.exp(.4)) / 2)
    assert result["s_score_literal_mean"] - result["s_score_minus_one_mean"] == pytest.approx(1)
    with pytest.raises(ValueError):
        regression_metrics([1], [np.nan])


def history_fixture():
    data = pd.DataFrame({"WAFER_ID": [1, 2, 3, 4], "condition": ["Cond1"] * 4,
                         "machine": [1] * 4, "start": [10., 20., 30., 40.], "end": [11., 21., 31., 41.], TARGET: [100., 200., 300., 400.]})
    for c in USAGE:
        data[f"p2_primary_{c}_mean"] = [0., 1., 2., 3.]
    return data


def test_target_history_excludes_self_and_unavailable_future_lags():
    frame = history_fixture()
    history = HistoryFeatures().fit(frame)
    values = history.transform(frame)
    assert np.isnan(values[0, :11]).all()
    assert values[2, :2].tolist() == [200., 100.]
    assert 300. not in values[2, 11:21]
    assert 400. not in values[2, :11]


def test_holdout_targets_cannot_change_history_features():
    frame = history_fixture()
    fit, query = frame.iloc[:3].copy(), frame.iloc[3:].copy()
    history = HistoryFeatures().fit(fit)
    expected = history.transform(query)
    query[TARGET] = -999999
    np.testing.assert_equal(expected, history.transform(query))
    assert -999999 not in history.transform(query)
    assert 400 not in history.library[TARGET].values


def test_weight_equation_and_cpp_boundary():
    errors = np.array([[1., 2.], [1., 2.], [1., 2.]])
    assert integration_weights(errors).tolist() == pytest.approx([8 / 9, 1 / 9])
    frame = pd.DataFrame({"machine": [1] * 3, "route": ["456"] * 3,
                          "start": [0., 510., 1031.], "end": [10., 530., 1040.], "sample_id": ["a", "b", "c"]})
    actual = assign_cpp(frame)
    assert actual.p3_cpp.tolist() == [1, 1, 2]
    assert actual.p3_first.tolist() == [1, 0, 1]
