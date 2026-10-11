import pytest

from src.simulator.inference import predict_from_state
from src.simulator.time_policy import polishing_time_policy
from test_simulator_result import RecordingPredictor


@pytest.mark.parametrize("target,unit", [(None, None), (100, "nm"), (1, "um"), (0, "nm"), (-1, "nm"), (float("nan"), "unknown")])
def test_target_values_and_unit_labels_never_enable_a_numerical_time(target, unit):
    decision = polishing_time_policy(target, unit)
    assert decision.recommended_polishing_time is None
    assert decision.time_status == "UNIT_UNVERIFIED"


def test_target_is_neither_divided_nor_converted():
    class Probe:
        def __truediv__(self, other):
            raise AssertionError("time calculation must be disabled")

        def __float__(self):
            raise AssertionError("target must not become an MRR feature")
    decision = polishing_time_policy(Probe(), "nm")
    assert decision.recommended_polishing_time is None


def test_target_does_not_change_the_model_input_or_prediction():
    predictor = RecordingPredictor()
    results = [predict_from_state(predictor, "B456", "High", 60, 80, target_removal=value, target_removal_unit="nm")
               for value in [None, 100, 1000]]
    assert predictor.calls == [("B456", 60.0, 80.0)] * 3
    assert all(result.final_mrr == 75.0 and result.recommended_polishing_time is None for result in results)
    assert "TARGET_REMOVAL_NOT_USED" in {warning.code for warning in results[1].warnings}
