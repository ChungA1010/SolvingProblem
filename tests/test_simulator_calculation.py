import pytest

from src.simulator import PRESSURE_SCENARIOS, UnsupportedPressureScenarioError
from src.simulator.calculation import calculate_mrr


@pytest.mark.parametrize("pair", list(PRESSURE_SCENARIOS))
def test_final_equals_base_for_every_supported_scenario(pair):
    value = calculate_mrr(*pair, 75)
    assert (value.base_mrr, value.applied_correction, value.final_mrr) == (75.0, 0.0, 75.0)


@pytest.mark.parametrize("invalid", [True, "75", None, float("nan"), float("inf")])
def test_invalid_base_cannot_enter_final_mrr(invalid):
    with pytest.raises((TypeError, ValueError)):
        calculate_mrr("B456", "High", invalid)


@pytest.mark.parametrize("value", [0.0, -1.0])
def test_finite_model_scale_values_are_not_reinterpreted_as_physical_time(value):
    assert calculate_mrr("A456", "Normal", value).final_mrr == value


def test_unknown_scenario_does_not_return_a_final_mrr():
    with pytest.raises(UnsupportedPressureScenarioError):
        calculate_mrr("A456", "High", 75)
