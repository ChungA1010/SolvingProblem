"""Fit synthetic fixtures outside the adapter; never fit PHM/development data."""
from copy import deepcopy
from pathlib import Path
import subprocess
import sys

import pandas as pd
import pytest
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.simulator import Issue2RidgeAdapter, RidgeAdapterError, SimulatorCore
from test_simulator_core import request


def pipeline():
    return Pipeline([
        ("preprocessing", ColumnTransformer([
            ("recipe", OneHotEncoder(handle_unknown="ignore"), ["recipe"]),
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")),
                                   ("scaler", StandardScaler())]), ["prev_mrr", "state_ewm"]),
        ])),
        ("model", Ridge(alpha=1.0)),
    ])


@pytest.fixture
def fitted():
    frame = pd.DataFrame({"recipe": ["A456", "B456"] * 3,
                          "prev_mrr": [60, 80, 62, 85, 63, 83], "state_ewm": [61, 70, 64, 73, 66, 72]})
    return pipeline().fit(frame, [62, 75, 63, 80, 64, 79])


@pytest.mark.parametrize("recipe", ["A456", "B456"])
def test_adapter_preserves_original_fitted_preprocessing_and_predictions(fitted, recipe):
    expected = float(fitted.predict(pd.DataFrame([[recipe, 80, 68]], columns=["recipe", "prev_mrr", "state_ewm"]))[0])
    adapter = Issue2RidgeAdapter(fitted, model_version="TEST_SYNTHETIC_FITTED_RIDGE_v1", provenance="synthetic unit-test fixture only")
    assert adapter.predict(recipe, 80, 68) == pytest.approx(expected, abs=1e-12)
    result = SimulatorCore(adapter).predict(request(recipe=recipe))
    assert result.status == "OK" and result.final_mrr == pytest.approx(expected, abs=1e-12)
    assert result.model_version == "TEST_SYNTHETIC_FITTED_RIDGE_v1"


def test_constructor_and_repeated_requests_do_not_fit_any_step(fitted, monkeypatch):
    def no_fit(*args, **kwargs):
        raise AssertionError("adapter construction and inference must not fit")
    for kind in [Pipeline, ColumnTransformer, Ridge, OneHotEncoder, SimpleImputer, StandardScaler]:
        monkeypatch.setattr(kind, "fit", no_fit)
    adapter = Issue2RidgeAdapter(fitted, model_version="TEST_SYNTHETIC_FITTED_RIDGE_v1", provenance="synthetic test")
    core = SimulatorCore(adapter)
    assert all(core.predict(request()).status == "OK" for _ in range(3))


def test_caller_mutating_estimator_does_not_change_adapter(fitted):
    adapter = Issue2RidgeAdapter(fitted, model_version="TEST_SYNTHETIC_FITTED_RIDGE_v1", provenance="synthetic test")
    before = adapter.predict("A456", 80, 68)
    fitted.named_steps["model"].coef_[:] = 10000
    assert adapter.predict("A456", 80, 68) == before


def test_unfitted_pipeline_is_rejected_instead_of_automatically_fitted():
    with pytest.raises(RidgeAdapterError):
        Issue2RidgeAdapter(pipeline(), model_version="unfitted", provenance="test")


@pytest.mark.parametrize("change", ["alpha", "imputer", "scaler", "feature_order", "recipe_categories"])
def test_changed_issue2_contract_is_rejected(fitted, change):
    candidate = deepcopy(fitted)
    pre = candidate.named_steps["preprocessing"]
    if change == "alpha":
        candidate.named_steps["model"].alpha = 2.0
    elif change == "imputer":
        pre.named_transformers_["numeric"].named_steps["imputer"].strategy = "mean"
    elif change == "scaler":
        pre.named_transformers_["numeric"].named_steps["scaler"].with_std = False
    elif change == "feature_order":
        pre.feature_names_in_ = pre.feature_names_in_[::-1]
    else:
        pre.named_transformers_["recipe"].categories_[0][0] = "A123"
    with pytest.raises(RidgeAdapterError):
        Issue2RidgeAdapter(candidate, model_version="invalid-contract", provenance="test")


@pytest.mark.parametrize("version,source", [("", "test"), ("test", ""), (None, "test")])
def test_model_version_and_provenance_are_mandatory(fitted, version, source):
    with pytest.raises(RidgeAdapterError):
        Issue2RidgeAdapter(fitted, model_version=version, provenance=source)


def test_optional_dependencies_are_only_needed_when_adapter_is_constructed():
    code = """
import importlib.abc
import sys
class Blocker(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.startswith(('sklearn', 'pandas', 'numpy')):
            raise ImportError('optional dependencies deliberately unavailable')
sys.meta_path.insert(0, Blocker())
from src.simulator import Issue2RidgeAdapter, RidgeDependenciesUnavailable, SimulatorCore
try:
    Issue2RidgeAdapter(object(), model_version='test', provenance='test')
except RidgeDependenciesUnavailable as error:
    assert error.code == 'RIDGE_DEPENDENCIES_UNAVAILABLE'
else:
    raise AssertionError('missing dependencies must be explicit')
print('OPTIONAL_ADAPTER_IMPORT_OK')
"""
    process = subprocess.run([sys.executable, "-c", code], cwd=Path(__file__).resolve().parents[1], capture_output=True, text=True)
    assert process.returncode == 0, process.stderr
    assert "OPTIONAL_ADAPTER_IMPORT_OK" in process.stdout
