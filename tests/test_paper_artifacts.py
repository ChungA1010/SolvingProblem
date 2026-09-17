"""Verify published evidence without loading raw datasets or retraining."""
from pathlib import Path

import numpy as np
import pandas as pd

from cmp_ml.common import read_json, sha256

RUN = Path(__file__).resolve().parents[1] / "runs/phm_cmp_papers_v1"


def test_paper_artifact_hash_chain_and_original_code():
    protocol = read_json(RUN / "protocol.json")
    seal = read_json(RUN / "evaluation_seal.json")
    complete = read_json(RUN / "completion.json")
    assert sha256(RUN / "manifest.csv") == protocol["manifest_sha256"]
    assert sha256(RUN / "PROTOCOL.md") == protocol["protocol_document_sha256"]
    assert sha256(RUN / "selection.json") == seal["selection_sha256"] == complete["selection_sha256"]
    assert sha256(RUN / "predictions.csv.gz") == seal["predictions_sha256"]
    assert sha256(RUN / "p1_repeated_predictions.csv.gz") == seal["repeated_predictions_sha256"]
    assert sha256(RUN / "metrics.csv") == complete["metrics_sha256"]
    for name, digest in protocol["code_sha256"].items():
        assert sha256(RUN / "code_snapshot" / name) == digest
    for model in read_json(RUN / "verification.json")["models"]:
        assert sha256(RUN / "models" / model["file"]) == model["sha256"]


def test_paper_mse_and_selection_reproduce_from_published_predictions():
    frame = pd.read_csv(RUN / "scored_predictions.csv.gz", float_precision="round_trip")
    scores = pd.read_csv(RUN / "metrics.csv", float_precision="round_trip")
    choices = read_json(RUN / "selection.json")["tracks"]
    for track, choice in choices.items():
        validation = scores[(scores.track == track) & (scores.split == "validation") & (scores.stage == "all")]
        assert validation.sort_values(["mse", "mae", "model"]).iloc[0].model == choice["model"]
    for row in scores.itertuples(index=False):
        subset = frame[(frame.track == row.track) & (frame.split == row.split) & (frame.model == row.model)]
        if row.stage != "all":
            subset = subset[subset.STAGE == row.stage]
        assert len(subset) == row.n and subset.sample_id.is_unique
        assert np.isclose(np.square(subset.prediction - subset.truth).mean(), row.mse, rtol=1e-12)


def test_paper_group_partition_is_wafer_and_file_component_disjoint():
    manifest = pd.read_csv(RUN / "manifest.csv")
    group = manifest[manifest.cohort.eq("training") & manifest.split.isin(["train", "validation", "test"])]
    assert group.groupby("WAFER_ID").split.nunique().max() == 1
    assert group.groupby("group_id").split.nunique().max() == 1
    assert manifest.excluded_extreme.sum() == 4
    assert read_json(RUN / "independent_verification.json")["all_checks_passed"]
