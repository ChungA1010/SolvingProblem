"""Checkpoint 03: exact supported combinations and explicit refusal of fallback."""
from pathlib import Path
import subprocess
import sys

import pytest

from src.simulator import (
    PRESSURE_SCENARIOS,
    UnsupportedPressureScenarioError,
    validate_pressure_scenario,
)


@pytest.mark.parametrize("recipe,scenario,status", [
    ("A456", "Low", "EXPLORATORY"),
    ("A456", "Normal", "NONE"),
    ("B456", "Low", "OBSERVATIONAL_ONLY"),
    ("B456", "Normal", "NONE"),
    ("B456", "High", "CHRONOLOGICALLY_SUPPORTED"),
])
def test_supported_pair_returns_the_original_policy_record(recipe, scenario, status):
    record = validate_pressure_scenario(recipe, scenario)
    assert record is PRESSURE_SCENARIOS[(recipe, scenario)]
    assert record.correction_status == status
    assert record.correction_enabled is False
    assert record.default_applied_correction == 0.0


@pytest.mark.parametrize("recipe,scenario", [
    pytest.param("A456", "High", id="A456-High-not-supported"),
    pytest.param("A123", "Normal", id="A123-outside-Ridge-path"),
    pytest.param("unknown", "Normal", id="unknown-recipe"),
    pytest.param("B456", "unknown", id="unknown-scenario"),
    pytest.param("", "Normal", id="empty-recipe"),
    pytest.param("A456", "", id="empty-scenario"),
    pytest.param("a456", "Normal", id="recipe-case-mismatch"),
    pytest.param("B456", "high", id="scenario-case-mismatch"),
    pytest.param(" A456", "Normal", id="recipe-leading-space"),
    pytest.param("A456 ", "Normal", id="recipe-trailing-space"),
    pytest.param("B456", " High", id="scenario-leading-space"),
    pytest.param("B456", "High ", id="scenario-trailing-space"),
])
def test_unsupported_names_and_combinations_are_not_normalized(recipe, scenario):
    with pytest.raises(UnsupportedPressureScenarioError) as error:
        validate_pressure_scenario(recipe, scenario)
    assert error.value.code == "UNSUPPORTED_PRESSURE_SCENARIO"
    assert isinstance(error.value, ValueError)
    assert str(error.value)


@pytest.mark.parametrize("invalid", [
    pytest.param(None, id="missing"),
    pytest.param(True, id="boolean"),
    pytest.param(456, id="integer"),
    pytest.param([], id="list"),
    pytest.param({}, id="dictionary"),
    pytest.param(("Low",), id="tuple"),
])
@pytest.mark.parametrize("field", ["recipe", "pressure_scenario"])
def test_malformed_payload_values_receive_the_policy_error(field, invalid):
    inputs = {"recipe": "B456", "pressure_scenario": "Normal"}
    inputs[field] = invalid
    with pytest.raises(UnsupportedPressureScenarioError) as error:
        validate_pressure_scenario(**inputs)
    assert error.value.code == "UNSUPPORTED_PRESSURE_SCENARIO"


@pytest.mark.parametrize("pressure", [
    pytest.param(250.817, id="A456-Low-observed-endpoint"),
    pytest.param(270.011, id="A456-Normal-observed-endpoint"),
    pytest.param(248.400, id="B456-Low-observed-endpoint"),
    pytest.param(258.000, id="B456-Normal-observed-endpoint"),
    pytest.param(268.927, id="B456-High-observed-endpoint"),
    pytest.param(251.0, id="within-observed-range"),
    pytest.param(254.32, id="unassigned-observation-one"),
    pytest.param(254.41, id="unassigned-observation-two"),
    pytest.param(263.0, id="between-clusters"),
    pytest.param(347.893, id="excluded-outlier"),
    pytest.param(0.0, id="below-observed-range"),
    pytest.param(10000.0, id="above-observed-range"),
    pytest.param(float("nan"), id="NaN"),
    pytest.param(float("inf"), id="infinity"),
    pytest.param("270", id="numeric-string"),
])
def test_numeric_pressure_never_becomes_a_named_scenario(pressure):
    with pytest.raises(UnsupportedPressureScenarioError) as error:
        validate_pressure_scenario("B456", pressure)
    assert error.value.code == "UNSUPPORTED_PRESSURE_SCENARIO"


@pytest.mark.parametrize("field", ["recipe", "pressure_scenario"])
def test_validation_does_not_coerce_or_hash_non_string_values(field):
    class CoercionProbe:
        def __str__(self):
            raise AssertionError("must not silently coerce a name")

        def __float__(self):
            raise AssertionError("must not interpret raw pressure")

        def __hash__(self):
            raise AssertionError("must check the input type before registry lookup")

    inputs = {"recipe": "B456", "pressure_scenario": "Normal"}
    inputs[field] = CoercionProbe()
    with pytest.raises(UnsupportedPressureScenarioError):
        validate_pressure_scenario(**inputs)


def test_rejected_request_does_not_change_subsequent_validation_or_policy():
    before = dict(PRESSURE_SCENARIOS)
    with pytest.raises(UnsupportedPressureScenarioError):
        validate_pressure_scenario("A456", "High")
    assert dict(PRESSURE_SCENARIOS) == before
    assert validate_pressure_scenario("B456", "High") is before[("B456", "High")]
    assert all(not row.correction_enabled for row in PRESSURE_SCENARIOS.values())


def test_validation_requests_need_no_files_training_or_physics_fallback():
    # Exercise requests in a fresh process while blocking external reads/imports.
    code = """
import builtins
import importlib.abc
from pathlib import Path
import sys
def forbidden_read(*args, **kwargs):
    raise AssertionError('validation must not read results, data, or model files')
class TrainingBlocker(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.startswith(('src.models', 'sklearn', 'numpy', 'pandas', 'torch')):
            raise AssertionError('unexpected model or training dependency: ' + fullname)
sys.meta_path.insert(0, TrainingBlocker())
builtins.open = forbidden_read
Path.open = forbidden_read
Path.read_text = forbidden_read
Path.read_bytes = forbidden_read
from src.simulator import UnsupportedPressureScenarioError, validate_pressure_scenario
assert validate_pressure_scenario('A456', 'Normal').correction_enabled is False
assert validate_pressure_scenario('B456', 'High').correction_enabled is False
for pair in [('A456', 'High'), ('B456', 270), ('B456', 263), ('unknown', 'Normal')]:
    try:
        validate_pressure_scenario(*pair)
    except UnsupportedPressureScenarioError as error:
        assert error.code == 'UNSUPPORTED_PRESSURE_SCENARIO'
    else:
        raise AssertionError('unsupported pair must fail without a fallback')
print('VALIDATION_WITHOUT_IO_OR_TRAINING_OK')
"""
    root = Path(__file__).resolve().parents[1]
    process = subprocess.run([sys.executable, "-c", code], cwd=root,
                             capture_output=True, text=True, check=False)
    assert process.returncode == 0, process.stderr
    assert "VALIDATION_WITHOUT_IO_OR_TRAINING_OK" in process.stdout
