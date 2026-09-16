from __future__ import annotations

import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .common import read_json, sha256, utcnow, write_json
from .experiment import load_run


def verify(run_dir: Path) -> None:
    data, audit = load_run(run_dir)
    selection = read_json(run_dir / "selection.json")
    seal = read_json(run_dir / "evaluation_seal.json")
    if seal["status"] != "complete" or seal["selection_sha256"] != sha256(run_dir / "selection.json"):
        raise ValueError("Evaluation is incomplete or frozen selection changed")
    for key, name in [("test_metrics_sha256", "test_metrics.csv"), ("test_predictions_sha256", "test_predictions.csv")]:
        if seal[key] != sha256(run_dir / name):
            raise ValueError(f"Evaluation output changed: {name}")
    predictions = pd.read_csv(run_dir / "test_predictions.csv")
    oof = pd.read_csv(run_dir / "physics_oof_residuals.csv")
    if (oof.groupby(["stage", "group_id"]).fold.nunique() > 1).any():
        raise ValueError("OOF groups crossed folds")
    if set(oof.sample_id) != set(data.loc[data.split.eq("train"), "sample_id"]):
        raise ValueError("OOF coverage does not equal Train")
    checks, speed = [], []
    with threadpool_limits(limits=4):
        for filename, expected in selection["model_hashes"].items():
            path = run_dir / "models" / filename
            if sha256(path) != expected:
                raise ValueError("Frozen model artifact changed")
            model = joblib.load(path)
            test = data[data.STAGE.eq(model.stage) & data.split.eq("test")]
            reference = predictions[predictions.stage.eq(model.stage) & predictions.model.eq(model.name)].set_index("sample_id")
            recomputed = model.predict(test)
            delta = float(np.max(np.abs(recomputed - reference.loc[test.sample_id, "y_pred"].to_numpy())))
            if delta > 1e-10:
                raise AssertionError(f"Saved model predictions changed: {model.name}: {delta}")
            checks.append({"stage": model.stage, "model": model.name, "max_saved_prediction_difference": delta})
            if selection["stages"][model.stage]["selected_by_validation"] == model.name:
                anchor = data[data.STAGE.eq(model.stage) & data.split.eq("validation")].iloc[:1]
                model.predict(anchor)
                times, outputs = [], []
                for _ in range(100):
                    t = time.perf_counter()
                    outputs.append(float(model.predict(anchor)[0]))
                    times.append(time.perf_counter() - t)
                difference = float(np.ptp(outputs))
                if difference > 1e-10:
                    raise AssertionError("Selected model is not reproducible at 1e-10")
                speed.append({"stage": model.stage, "model": model.name, "repetitions": 100,
                              "max_difference": difference, "warm_p95_seconds": float(np.quantile(times, .95))})
    result = {"verified_at": utcnow(), "status": "passed", "model_count": len(checks),
              "split_hash_matches": True, "wafer_file_group_disjoint": True,
              "oof_train_coverage_complete": True, "oof_groups_disjoint": True,
              "saved_predictions": checks, "selected_model_reproducibility_and_latency": speed}
    write_json(run_dir / "verification.json", result)
    print(f"Verified {len(checks)} saved models, disjoint splits, OOF coverage and 100-run selected-model reproducibility.", flush=True)
