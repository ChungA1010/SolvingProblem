"""Published external outcomes must trace back to pre-answer frozen predictions."""
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import read_json, sha256
from cmp_ml.experiment import metrics
from cmp_ml.external import assign_novelty


RUN = Path(__file__).resolve().parents[1] / "runs" / "phm_cmp_external_v1"


def test_external_artifacts_and_answer_timing():
    completion, frozen, protocol, seal, downloads = [read_json(RUN / name) for name in [
        "completion.json", "prediction_freeze.json", "protocol.json", "evaluation_seal.json", "downloaded_labels.json"]]
    assert completion["status"] == seal["status"] == "complete"
    assert frozen["status"] == "predictions_frozen" and not frozen["answer_values_read"]
    for name, expected in completion["artifact_hashes"].items():
        if name == "features.csv.gz" and not (RUN / name).exists():
            continue
        assert sha256(RUN / name) == expected, name
    provenance = read_json(RUN / "report_provenance.json")
    assert sha256(RUN / "completion.json") == provenance["completion_sha256"]
    for name, expected in provenance["artifact_hashes"].items():
        assert sha256(RUN / name) == expected, name
    verified = read_json(RUN / "verification.json")
    assert verified["status"] == "passed" and len(verified["models"]) == 26
    assert all(m["max_prediction_difference"] <= 1e-10 for m in verified["models"])
    assert sha256(RUN / "prediction_freeze.json") == seal["prediction_freeze_sha256"]
    assert sha256(RUN / "protocol.json") == frozen["protocol_sha256"]
    assert sha256(RUN / "predictions.csv") == frozen["predictions_sha256"]
    assert datetime.fromisoformat(protocol["frozen_at"]) < datetime.fromisoformat(frozen["frozen_at"])
    assert datetime.fromisoformat(frozen["frozen_at"]) < datetime.fromisoformat(downloads["completed_at"])
    assert datetime.fromisoformat(downloads["completed_at"]) <= datetime.fromisoformat(seal["started_at"])
    source = RUN.parent / protocol["source_run_name"]
    for name, expected in protocol["source_artifact_hashes"].items():
        if name == "features.csv.gz" and not (source / name).exists():
            continue
        assert sha256(source / name) == expected, name
    index = read_json(RUN / "acquisition_index.json")
    assert index["all_training_match"] and len(index["training_identity_checks"]) == 186
    assert all(item["exact_match"] for item in index["training_identity_checks"])
    expected_downloads = {f["local_path"]: f for f in index["files"]}
    for log in [read_json(RUN / "downloaded_traces.json"), downloads]:
        assert log["commit"] == index["commit"]
        for item in log["files"]:
            expected = expected_downloads[item["local_path"]]
            assert item["git_blob_sha1"] == expected["git_blob_sha1"] and item["bytes"] == expected["bytes"]


def test_external_predictions_only_cover_frozen_novel_components():
    manifest = pd.read_csv(RUN / "external_manifest.csv")
    prior = pd.read_csv(RUN.parent / "phm_cmp_v1" / "split_manifest.csv")
    expected = assign_novelty(manifest, prior)
    for column in ["group_id", "prior_wafer_overlap", "prior_component_overlap"]:
        assert manifest[column].eq(expected[column]).all()
    assert manifest.eligible.eq(~manifest.prior_component_overlap & ~manifest.unseen_chamber).all()
    assert set(manifest.loc[manifest.eligible, "WAFER_ID"]).isdisjoint(set(prior.WAFER_ID))
    predictions = pd.read_csv(RUN / "predictions.csv")
    assert set(predictions.sample_id) == set(manifest.loc[manifest.eligible, "sample_id"])
    assert predictions.groupby("sample_id").size().eq(13).all()
    assert not predictions.duplicated(["sample_id", "model"]).any()
    protocol = read_json(RUN / "protocol.json")
    assert predictions.primary.eq([model == protocol["primary_models"][stage]
                                   for model, stage in zip(predictions.model, predictions.STAGE)]).all()
    joined = predictions.merge(manifest[["sample_id", "group_id", "cohort", "STAGE"]], on="sample_id", suffixes=("", "_manifest"))
    for column in ["group_id", "cohort", "STAGE"]:
        assert joined[column].eq(joined[column + "_manifest"]).all()


def test_external_reported_scores_reproduce_frozen_predictions():
    original = pd.read_csv(RUN / "predictions.csv")
    scored = pd.read_csv(RUN / "scored_predictions.csv")
    pd.testing.assert_frame_equal(scored[original.columns], original)
    assert scored.groupby("sample_id").y_true.nunique().eq(1).all()
    reported = pd.read_csv(RUN / "metrics.csv")
    for row in reported.itertuples():
        part = scored[scored.cohort.eq(row.cohort) & scored.STAGE.eq(row.stage) & scored.model.eq(row.model)]
        if row.slice != "all":
            column, value = row.slice.split("=", 1)
            part = part[part[column].eq(value)]
        expected = metrics(part.y_true, part.y_pred)
        assert row.n == expected["n"] and row.negative_predictions == expected["negative_predictions"]
        for key in ["mae", "rmse", "r2"]:
            if expected[key] is None:
                assert pd.isna(getattr(row, key))
            else:
                assert getattr(row, key) == pytest.approx(expected[key], rel=1e-12, abs=1e-12)
        coverage = ((part.y_true >= part.lower_90) & (part.y_true <= part.upper_90)).mean()
        assert row.coverage_90 == pytest.approx(coverage)
    primary = pd.read_csv(RUN / "primary_summary.csv")
    pd.testing.assert_frame_equal(primary, reported[reported.primary & reported.slice.eq("all")].reset_index(drop=True))
