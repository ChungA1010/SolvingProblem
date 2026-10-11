from copy import deepcopy
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import pandas as pd
import pytest

from src.models.export_simulator_ridge import portable_payload, ordinal_requests
from src.models.train_mrr_chronological import _fixed_regression
from src.simulator.artifact import ArtifactError, FrozenRidgePredictor, load_artifact
from src.simulator.history import build_history_state

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def fitted():
    rows = pd.DataFrame({"recipe": ["A456", "B456"] * 5,
                         "prev_mrr": [None, None, 60, 70, 65, 75, 67, 79, 68, 83],
                         "state_ewm": [None, None, 60, 70, 62, 72, 64, 75, 66, 78],
                         "mrr": [60, 70, 65, 75, 67, 79, 68, 83, 70, 84]})
    pipe = _fixed_regression(["recipe", "prev_mrr", "state_ewm"], "ridge")
    pipe.fit(rows[["recipe", "prev_mrr", "state_ewm"]], rows.mrr)
    return pipe, portable_payload(pipe, "0" * 64, rows)


def test_portable_matches_fitted_pipeline_without_fit(fitted, monkeypatch):
    pipe, payload = fitted
    from sklearn.pipeline import Pipeline
    from sklearn.linear_model import Ridge
    def forbidden(*args, **kwargs):
        raise AssertionError("fit during inference")
    monkeypatch.setattr(Pipeline, "fit", forbidden)
    monkeypatch.setattr(Ridge, "fit", forbidden)
    frozen = FrozenRidgePredictor(payload)
    for recipe in ("A456", "B456"):
        for prev, state in ((60., 65.), (99.5, 78.3), (0., 0.), (-2., -1.)):
            frame = pd.DataFrame([[recipe, prev, state]], columns=payload["features"])
            assert frozen.predict(recipe, prev, state) == pytest.approx(pipe.predict(frame)[0], abs=1e-10)


@pytest.mark.parametrize("key,value", [
    ("schema", "other"), ("usage", "PRODUCTION"), ("recipes", ["B456", "A456"]),
    ("features", ["recipe", "state_ewm", "prev_mrr"]), ("ridge_alpha", 2.),
    ("ewma_alpha", True), ("numeric_scale", [0, 1]), ("numeric_scale", [-1, 1]),
    ("numeric_mean", [float("nan"), 2]), ("coefficients", [1, 2, 3]),
    ("coefficients", [1, 2, 3, True]), ("intercept", float("inf")), ("model_version", ""),
])
def test_artifact_rejects_changed_contract(fitted, key, value):
    payload = deepcopy(fitted[1]); payload[key] = value
    with pytest.raises(ArtifactError):
        FrozenRidgePredictor(payload)


@pytest.mark.parametrize("key,value", [("independent_final_test", True), ("production_model", True),
    ("training_folds", [1,2,3,4,5]), ("evaluation_fold", True), ("source_sha256", "bad"),
    ("measurement_assumption", "OBSERVED")])
def test_artifact_rejects_false_provenance(fitted, key, value):
    payload = deepcopy(fitted[1]); payload["provenance"][key] = value
    with pytest.raises(ArtifactError):
        FrozenRidgePredictor(payload)


def test_digest_and_copy(fitted, tmp_path):
    payload = deepcopy(fitted[1]); path = tmp_path / "model.json"
    path.write_text(json.dumps(payload), encoding="utf-8")
    predictor = load_artifact(path, expected_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    value = predictor.predict("A456", 60., 65.)
    payload["coefficients"][0] += 999
    meta = predictor.provenance; meta["production_model"] = True
    assert predictor.predict("A456", 60., 65.) == value
    assert predictor.provenance["production_model"] is False
    with pytest.raises(ArtifactError, match="SHA256"):
        load_artifact(path, expected_sha256="0"*64)


@pytest.mark.parametrize("content", [b"{bad", b'{"x": NaN}', b"a"*65537, b"\xff"], ids=["json", "nan", "size", "encoding"])
def test_invalid_file(tmp_path, content):
    path = tmp_path / "model.json"; path.write_bytes(content)
    with pytest.raises(ArtifactError):
        load_artifact(path)


def test_runtime_has_no_ml_or_training_import():
    script = '''
import builtins, sys
original = builtins.__import__
def guarded(name, *args, **kwargs):
    if name.startswith(("sklearn", "pandas", "numpy", "src.models")):
        raise AssertionError(name)
    return original(name, *args, **kwargs)
builtins.__import__ = guarded
from src.simulator.artifact import load_artifact
p = load_artifact("artifacts/education-ridge-v1/model.json")
assert p.predict("B456", 80., 68.) > 0
print("NO_ML_IMPORT_NO_FIT")
'''
    result = subprocess.run([sys.executable, "-c", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr
    assert "NO_ML_IMPORT_NO_FIT" in result.stdout


def test_cadence_and_delay_are_distinct_and_causal():
    rows = pd.DataFrame([{"wafer_id": i, "stage": "A", "recipe": "A456", "mrr": float(60+i), "fold": 1} for i in range(12)])
    def states(frame, interval, delay):
        output = []
        for _, req, measured in ordinal_requests(frame, interval, delay):
            if req.history:
                state = build_history_state(req.recipe, req.wafer_id, req.wafer_start_at, req.history)
                output.append((req.wafer_id, state.prev_mrr, state.history_used, measured))
        return output
    k5 = states(rows, 5, 0)
    delayed = states(rows, 1, 2)
    assert k5[0][:3] == ("5:A", 64., 1)
    assert delayed[0][:3] == ("3:A", 60., 1)
    future = rows.copy(); future.loc[future.wafer_id.ge(8), "mrr"] += 10000
    assert states(rows, 1, 0)[:8] == states(future, 1, 0)[:8]


def test_published_evidence_matches_artifact():
    folder = ROOT / "artifacts/education-ridge-v1"
    report = json.loads((folder / "report.json").read_text())
    predictor = load_artifact(folder / "model.json", expected_sha256=report["model_sha256"])
    assert report["status"] == "PASS"
    assert report["training_folds_for_export"] == [1,2,3,4]
    assert report["independent_final_test"] is False
    assert report["source_rows"] == 1977
    assert report["max_pipeline_core_gap"] < 1e-10
    assert predictor.model_version == report["model_version"]
