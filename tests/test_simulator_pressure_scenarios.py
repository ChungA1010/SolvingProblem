"""Checkpoint 02: verify the published Issue #3 metadata contract."""
from dataclasses import FrozenInstanceError
from pathlib import Path
import subprocess
import sys

import pytest

from src.simulator import PRESSURE_POLICY_VERSION, PRESSURE_SCENARIOS


# Independent expectations transcribed from the Issue #3 policy table.
POLICY_ROWS = [
    ("A456", "Low", (250.817, 252.000), 21, "OBSERVED_LIMITED", "EXPLORATORY"),
    ("A456", "Normal", (268.810, 270.011), 777, "OBSERVED_DENSE", "NONE"),
    ("B456", "Low", (248.400, 252.000), 31, "OBSERVED_LIMITED", "OBSERVATIONAL_ONLY"),
    ("B456", "Normal", (256.871, 258.000), 729, "OBSERVED_DENSE", "NONE"),
    ("B456", "High", (268.927, 270.000), 52, "OBSERVED_LIMITED", "CHRONOLOGICALLY_SUPPORTED"),
]


def test_registry_contains_exactly_the_five_supported_combinations():
    assert set(PRESSURE_SCENARIOS) == {
        ("A456", "Low"), ("A456", "Normal"),
        ("B456", "Low"), ("B456", "Normal"), ("B456", "High"),
    }


@pytest.mark.parametrize("recipe,scenario,bounds,count,support,status", POLICY_ROWS)
def test_metadata_matches_issue3_policy(recipe, scenario, bounds, count, support, status):
    record = PRESSURE_SCENARIOS[(recipe, scenario)]
    assert (record.recipe, record.pressure_scenario) == (recipe, scenario)
    assert record.observed_p_main_range == bounds
    assert record.observed_wafer_count == count
    assert record.support_level == support
    assert record.correction_status == status


def test_all_scenarios_keep_numerical_correction_disabled():
    for record in PRESSURE_SCENARIOS.values():
        assert record.correction_enabled is False
        assert record.default_applied_correction == 0.0
        assert record.mrr_unit_status == "UNIT_UNVERIFIED"
        warnings = " ".join(record.warning_metadata)
        assert "setpoint" in warnings
        assert "비활성" in warnings
        assert "0으로 입증된 뜻이 아닙니다" in warnings
        assert "독립 final test가 없습니다" in warnings


def test_registry_preserves_limited_sample_and_outlier_warnings():
    assert "fold 5" in " ".join(PRESSURE_SCENARIOS[("A456", "Low")].warning_metadata)
    assert "248.400" in " ".join(PRESSURE_SCENARIOS[("B456", "Low")].warning_metadata)
    high_warnings = " ".join(PRESSURE_SCENARIOS[("B456", "High")].warning_metadata)
    assert "42장" in high_warnings
    assert "미선정" in high_warnings
    assert "347.893" in high_warnings and "제외" in high_warnings


def test_registry_cannot_be_changed_through_the_exported_mapping():
    with pytest.raises(TypeError):
        PRESSURE_SCENARIOS[("A456", "High")] = PRESSURE_SCENARIOS[("B456", "High")]
    with pytest.raises(TypeError):
        del PRESSURE_SCENARIOS[("B456", "High")]


@pytest.mark.parametrize("field,new_value", [
    ("correction_enabled", True),
    ("default_applied_correction", 25.0),
    ("observed_p_main_range", (0.0, 999.0)),
    ("observed_wafer_count", 10000),
    ("warning_metadata", ()),
])
def test_exported_record_cannot_be_mutated(field, new_value):
    record = PRESSURE_SCENARIOS[("B456", "High")]
    with pytest.raises(FrozenInstanceError):
        setattr(record, field, new_value)
    assert isinstance(record.observed_p_main_range, tuple)
    assert isinstance(record.warning_metadata, tuple)


def test_every_record_identifies_the_policy_source_and_version():
    assert PRESSURE_POLICY_VERSION == "issue3-pressure-scenarios-v1"
    for record in PRESSURE_SCENARIOS.values():
        assert record.policy_version == PRESSURE_POLICY_VERSION
        assert record.provenance == (
            "docs/pressure_hybrid_policy.md"
            "@b3476dc9edcc25619cfa5c357d2e5ecf79258bd7"
        )


def test_import_needs_no_dataset_results_or_training_modules():
    # A fresh interpreter verifies that cached modules cannot hide an import/read.
    code = """
import builtins
import importlib.abc
from pathlib import Path
import sys
def forbidden_read(*args, **kwargs):
    raise AssertionError('registry must not read datasets, results, or models')
class TrainingBlocker(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.startswith(('src.models', 'sklearn', 'numpy', 'pandas', 'torch')):
            raise AssertionError('unexpected training dependency: ' + fullname)
sys.meta_path.insert(0, TrainingBlocker())
builtins.open = forbidden_read
Path.open = forbidden_read
Path.read_text = forbidden_read
Path.read_bytes = forbidden_read
from src.simulator import PRESSURE_SCENARIOS
assert len(PRESSURE_SCENARIOS) == 5
assert all(not row.correction_enabled for row in PRESSURE_SCENARIOS.values())
print('STATIC_REGISTRY_IMPORT_OK')
"""
    root = Path(__file__).resolve().parents[1]
    process = subprocess.run([sys.executable, "-c", code], cwd=root,
                             capture_output=True, text=True, check=False)
    assert process.returncode == 0, process.stderr
    assert "STATIC_REGISTRY_IMPORT_OK" in process.stdout
