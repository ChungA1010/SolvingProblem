"""Read-only model/CSV reproduction checks for a completed external evaluation."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .common import read_json, sha256, utcnow, write_json
from .external import assign_novelty, verify_models


def verify(source_run, run_dir):
    if (run_dir / "verification.json").exists():
        raise FileExistsError("Verification already recorded; preserve the published evidence")
    completion = read_json(run_dir / "completion.json")
    if completion["status"] != "complete":
        raise ValueError("Evaluation is incomplete")
    for name, expected in completion["artifact_hashes"].items():
        if sha256(run_dir / name) != expected:
            raise ValueError(f"External artifact changed: {name}")
    protocol = read_json(run_dir / "protocol.json")
    frozen = read_json(run_dir / "prediction_freeze.json")
    verify_models(source_run, protocol)
    for name, expected in frozen["source_hashes"].items():
        if sha256(Path(__file__).parent / name) != expected:
            raise ValueError(f"Prediction/evaluation source changed: {name}")
    manifest = pd.read_csv(run_dir / "external_manifest.csv")
    prior = pd.read_csv(source_run / "split_manifest.csv")
    recomputed = assign_novelty(manifest, prior)
    for column in ["group_id", "prior_wafer_overlap", "prior_component_overlap"]:
        if not recomputed[column].eq(manifest[column]).all():
            raise ValueError("External novelty boundaries changed")
    features = pd.read_csv(run_dir / "features.csv.gz", float_precision="round_trip")
    reference = pd.read_csv(run_dir / "predictions.csv", float_precision="round_trip")
    checks = []
    with threadpool_limits(limits=4):
        for filename in sorted(protocol["model_hashes"]):
            bundle = joblib.load(source_run / "models" / filename)
            samples = features[features.eligible & features.STAGE.eq(bundle.stage)]
            expected = reference[reference.STAGE.eq(bundle.stage) & reference.model.eq(bundle.name)].set_index("sample_id")
            point, lower, upper = bundle.predict_interval(samples)
            difference = float(np.max(np.abs(point - expected.loc[samples.sample_id, "y_pred"].to_numpy())))
            if difference > 1e-10:
                raise AssertionError(f"Prediction reproduction failed: {filename}: {difference}")
            for name, predicted in [("lower_90", lower), ("upper_90", upper)]:
                if predicted is not None and not np.allclose(predicted, expected.loc[samples.sample_id, name], rtol=0, atol=1e-10):
                    raise AssertionError("Stored interval endpoints changed")
            checks.append({"filename": filename, "samples": len(samples), "max_prediction_difference": difference})
    write_json(run_dir / "verification.json", {"status": "passed", "verified_at": utcnow(), "models": checks,
               "old_wafer_component_exclusion_reproduced": True, "frozen_source_hashes_match": True,
               "completion_sha256": sha256(run_dir / "completion.json")})
    print(f"Verified {len(checks)} frozen models on external inputs, interval endpoints and exclusion boundaries.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-run", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    args = parser.parse_args()
    verify(args.source_run, args.run_dir)
