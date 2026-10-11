import json

import pytest

from src.simulator import BaseMRRPredictor, PRESSURE_SCENARIOS
from src.simulator.inference import predict_from_state


class RecordingPredictor(BaseMRRPredictor):
    model_version = "TEST_STUB_ONLY_v1"

    def __init__(self):
        self.calls = []

    def _predict(self, recipe, prev_mrr, state_ewm):
        self.calls.append((recipe, prev_mrr, state_ewm))
        return 0.25 * prev_mrr + 0.75 * state_ewm


@pytest.mark.parametrize("pair", list(PRESSURE_SCENARIOS))
def test_success_is_structured_and_json_serializable_with_required_warnings(pair):
    result = predict_from_state(RecordingPredictor(), *pair, 60, 80)
    assert result.status == "OK" and result.error is None
    assert result.base_mrr == result.final_mrr == 75.0
    assert result.applied_correction == 0.0 and result.correction_enabled is False
    assert result.model_version == "TEST_STUB_ONLY_v1"
    assert {warning.code for warning in result.warnings} >= {
        "PRESSURE_OBSERVATION_NOT_SETPOINT", "CORRECTION_DISABLED",
        "N0_MEASUREMENT_COMPLETE_ASSUMPTION", "NO_INDEPENDENT_FINAL_TEST", "MRR_UNIT_UNVERIFIED",
    }
    output = json.loads(json.dumps(result.to_dict(), allow_nan=False))
    assert output["warnings"][0]["code"] == "PRESSURE_OBSERVATION_NOT_SETPOINT"
    assert output["recommended_polishing_time"] is None


@pytest.mark.parametrize("pair", [("A456", "High"), ("B456", 270), ([], "Normal")])
def test_invalid_scenario_produces_error_without_calling_predictor(pair):
    predictor = RecordingPredictor()
    result = predict_from_state(predictor, *pair, 60, 80)
    assert result.status == "ERROR"
    assert result.error.code == "UNSUPPORTED_PRESSURE_SCENARIO"
    assert result.final_mrr is None and predictor.calls == []
    json.dumps(result.to_dict(), allow_nan=False)


@pytest.mark.parametrize("value", [None, True, "60", float("nan"), float("inf")])
def test_invalid_state_has_an_explicit_error_and_no_model_call(value):
    predictor = RecordingPredictor()
    result = predict_from_state(predictor, "B456", "Normal", value, 80)
    assert result.error.code == "INVALID_HISTORY_STATE" and predictor.calls == []


@pytest.mark.parametrize("output", [None, True, "75", float("nan"), float("inf")])
def test_invalid_model_output_is_not_serialized_as_a_prediction(output):
    class Broken(RecordingPredictor):
        def _predict(self, *args):
            return output
    result = predict_from_state(Broken(), "B456", "High", 60, 80)
    assert result.error.code == "PREDICTOR_ERROR" and result.final_mrr is None
    json.dumps(result.to_dict(), allow_nan=False)


def test_missing_or_exploding_predictor_is_structured():
    assert predict_from_state(None, "A456", "Normal", 60, 80).error.code == "INVALID_PREDICTOR"
    class Broken(RecordingPredictor):
        def _predict(self, *args):
            raise RuntimeError("implementation detail")
    result = predict_from_state(Broken(), "A456", "Normal", 60, 80)
    assert result.error.code == "PREDICTOR_ERROR"
    assert "implementation detail" not in result.error.message
