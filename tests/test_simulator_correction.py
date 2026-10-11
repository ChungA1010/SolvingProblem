from dataclasses import replace

import pytest

from src.simulator.correction import CorrectionActivationError, pressure_correction
from src.simulator import PRESSURE_SCENARIOS, UnsupportedPressureScenarioError


@pytest.mark.parametrize("pair", list(PRESSURE_SCENARIOS))
def test_every_scenario_including_exploratory_and_high_has_zero_correction(pair):
    assert pressure_correction(*pair) == 0.0


@pytest.mark.parametrize("pair", [("A456", "High"), ("unknown", "Normal"), ("B456", 270)])
def test_invalid_scenario_is_not_a_zero_correction_fallback(pair):
    with pytest.raises(UnsupportedPressureScenarioError):
        pressure_correction(*pair)


@pytest.mark.parametrize("changes", [
    {"correction_enabled": True}, {"default_applied_correction": 12.0},
])
def test_unapproved_registry_changes_fail_closed(monkeypatch, changes):
    record = replace(PRESSURE_SCENARIOS[("B456", "High")], **changes)
    monkeypatch.setattr("src.simulator.correction.validate_pressure_scenario", lambda *args: record)
    with pytest.raises(CorrectionActivationError) as error:
        pressure_correction("B456", "High")
    assert error.value.code == "CORRECTION_NOT_APPROVED"
