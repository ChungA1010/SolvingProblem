"""Checkpoint 01: inference contract and isolation from training code."""
import subprocess
import sys
from pathlib import Path

import pytest

from src.simulator import BaseMRRPredictor


class StubPredictor(BaseMRRPredictor):
    """Deterministic test double, not a fitted Ridge or an MRR baseline."""
    model_version = "TEST_STUB_ONLY_v1"

    def __init__(self):
        self.calls = []
        self.fit_calls = 0

    def fit(self, *args, **kwargs):
        self.fit_calls += 1
        raise AssertionError("the inference interface must not call fit")

    def _predict(self, recipe, prev_mrr, state_ewm):
        self.calls.append((recipe, prev_mrr, state_ewm))
        return 0.25 * prev_mrr + 0.75 * state_ewm


def test_interface_requires_predictor_implementation():
    with pytest.raises(TypeError):
        BaseMRRPredictor()


@pytest.mark.parametrize("recipe", ["A456", "B456"])
def test_supported_recipe_uses_supplied_predictor_without_fit(recipe):
    predictor = StubPredictor()
    assert predictor.predict(recipe, 60, 80) == 75.0
    assert predictor.predict(recipe, 60, 80) == 75.0
    assert predictor.calls == [(recipe, 60.0, 80.0), (recipe, 60.0, 80.0)]
    assert predictor.fit_calls == 0
    assert predictor.model_version == "TEST_STUB_ONLY_v1"


@pytest.mark.parametrize("recipe", ["A123", "unknown", "", 456])
def test_unsupported_recipe_never_calls_predictor(recipe):
    predictor = StubPredictor()
    with pytest.raises((TypeError, ValueError)):
        predictor.predict(recipe, 60, 80)
    assert predictor.calls == []


@pytest.mark.parametrize("previous,state", [
    (True, 80), (60, False), ("60", 80), (60, None),
    (float("nan"), 80), (60, float("nan")),
    (float("inf"), 80), (60, -float("inf")), (10 ** 1000, 80),
])
def test_invalid_or_missing_state_never_reaches_predictor(previous, state):
    predictor = StubPredictor()
    with pytest.raises((TypeError, ValueError)):
        predictor.predict("A456", previous, state)
    assert predictor.calls == []


@pytest.mark.parametrize("value", [float("nan"), float("inf"), "75", True, None])
def test_invalid_prediction_is_rejected(value):
    class BrokenPredictor(StubPredictor):
        def _predict(self, *args):
            return value
    with pytest.raises((TypeError, ValueError)):
        BrokenPredictor().predict("B456", 60, 80)


@pytest.mark.parametrize("version", ["", "  ", None])
def test_predictor_must_identify_its_version(version):
    predictor = StubPredictor()
    predictor.model_version = version
    with pytest.raises(ValueError):
        predictor.predict("A456", 60, 80)
    assert predictor.calls == []


def test_import_cannot_reach_training_or_ml_packages():
    # Fresh interpreter: a module cache cannot conceal an accidental import.
    code = """
import importlib.abc
import sys
class TrainingBlocker(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.startswith(('src.models', 'sklearn', 'numpy', 'pandas', 'torch')):
            raise AssertionError('unexpected training dependency: ' + fullname)
sys.meta_path.insert(0, TrainingBlocker())
from src.simulator import BaseMRRPredictor
assert 'src.models.train_mrr_chronological' not in sys.modules
print('PURE_PYTHON_IMPORT_OK')
"""
    root = Path(__file__).resolve().parents[1]
    process = subprocess.run([sys.executable, "-c", code], cwd=root,
                             capture_output=True, text=True, check=False)
    assert process.returncode == 0, process.stderr
    assert "PURE_PYTHON_IMPORT_OK" in process.stdout
