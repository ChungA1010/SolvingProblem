"""Validate published nested-CV evidence without needing the private feature CSV."""
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import read_json, sha256
from cmp_ml.data import assert_split_integrity
from cmp_ml.stability import choose_candidates, summarize_predictions


RUN = Path(__file__).resolve().parents[1] / "runs" / "phm_cmp_stage_b_stability_v1"


def test_published_nested_artifact_chain_and_group_boundaries():
    completion = read_json(RUN / "completion.json")
    protocol = read_json(RUN / "protocol.json")
    assert completion["status"] == "complete"
    assert sha256(RUN / "protocol.json") == completion["protocol_sha256"]
    for name, expected in completion["artifact_hashes"].items():
        assert sha256(RUN / name) == expected, name
    report = read_json(RUN / "report_provenance.json")
    assert report["completion_sha256"] == sha256(RUN / "completion.json")
    for name, expected in report["artifacts"].items():
        assert sha256(RUN / name) == expected, name
    original = RUN.parent / protocol["source_run_name"]
    for name, expected in protocol["source_artifact_hashes"].items():
        if name == "features.csv.gz" and not (original / name).exists():
            continue  # Explicitly excluded from Git; all other v1 artifacts are required.
        assert sha256(original / name) == expected, name
    source = pd.read_csv(original / "split_manifest.csv")
    source_train = source[source.split.eq("train") & source.STAGE.eq("B")]
    outer = pd.read_csv(RUN / "outer_manifest.csv")
    inner = pd.read_csv(RUN / "inner_manifest.csv")
    assert set(outer.sample_id) == set(source_train.sample_id)
    assert len(outer) == len(source_train) == protocol["samples"]
    assert outer.group_id.nunique() == protocol["groups"]
    assert outer.split.eq("train").all() and outer.STAGE.eq("B").all()
    assert_split_integrity(outer.assign(split=outer.outer_fold.astype(str)))
    audits = read_json(RUN / "partition_audit.json")
    by_context = {a["context"]: a for a in audits}
    assert len(by_context) == len(audits) == 5 * (1 + 3 + 4 * 3)
    for item in audits:
        fit_groups, held_groups = set(item["fit_groups"]), set(item["held_groups"])
        assert not fit_groups & held_groups
        context = item["context"]
        if "/" in context:
            parent = context.rsplit("/", 1)[0]
            assert fit_groups | held_groups == set(by_context[parent]["fit_groups"])
        else:
            assert fit_groups | held_groups == set(outer.group_id)
        fit, held = outer[outer.group_id.isin(fit_groups)], outer[outer.group_id.isin(held_groups)]
        assert len(fit) == item["fit_n"] and len(held) == item["held_n"]
        assert_split_integrity(pd.concat([fit.assign(split="fit"), held.assign(split="held")]))
    for fold in range(protocol["outer_folds"]):
        local = inner[inner.outer_fold.eq(fold)]
        expected = outer[outer.outer_fold.ne(fold)]
        assert set(local.sample_id) == set(expected.sample_id)
        assert not local.sample_id.duplicated().any()
        joined = local.merge(expected.drop(columns="outer_fold"), on=["sample_id", "group_id"], validate="one_to_one")
        assert_split_integrity(joined.assign(split=joined.inner_fold.astype(str)))


def test_outer_scores_follow_frozen_inner_selections_and_have_exact_coverage():
    protocol = read_json(RUN / "protocol.json")
    outer = pd.read_csv(RUN / "outer_manifest.csv")
    trials = pd.DataFrame(read_json(RUN / "inner_trials.json"))
    predictions = pd.read_csv(RUN / "outer_predictions.csv")
    assert set(predictions.model) == set(protocol["families"])
    for _, rows in predictions.groupby("model"):
        assert len(rows) == len(outer) and set(rows.sample_id) == set(outer.sample_id)
        assert not rows.sample_id.duplicated().any()
        joined = rows.merge(outer, on="sample_id", suffixes=("", "_manifest"), validate="one_to_one")
        assert joined.group_id.eq(joined.group_id_manifest).all()
        assert joined.outer_fold.eq(joined.outer_fold_manifest).all()
    assert predictions.groupby("sample_id").y_true.nunique().eq(1).all()
    for fold in range(protocol["outer_folds"]):
        selection = read_json(RUN / f"selection_outer{fold}.json")
        local_trials = trials[trials.outer_fold.eq(fold)]
        counts = local_trials.groupby("candidate_id").agg(folds=("inner_fold", "nunique"), n=("n", "sum"))
        assert len(counts) == len(protocol["candidates"])
        assert counts.folds.eq(protocol["inner_folds"]).all()
        assert counts.n.eq(outer.outer_fold.ne(fold).sum()).all()
        best, selected_id = choose_candidates(local_trials)
        assert selected_id == selection["selected_candidate_id"]
        rows = predictions[predictions.outer_fold.eq(fold)]
        assert rows.selected_by_inner.eq(rows.candidate_id.eq(selected_id)).all()
        for item in best.itertuples():
            assert rows[rows.model.eq(item.model)].candidate_id.eq(item.candidate_id).all()
    selected = predictions[predictions.selected_by_inner]
    assert len(selected) == len(outer) and not selected.sample_id.duplicated().any()
    expected, _, _ = summarize_predictions(predictions)
    actual = pd.read_csv(RUN / "summary.csv")
    pd.testing.assert_frame_equal(actual, expected, check_exact=False, rtol=1e-12, atol=1e-12)
    completion = read_json(RUN / "completion.json")
    assert completion["inner_candidate_fits"] == 375
    assert completion["outer_family_fits"] == 40
    assert all(row["max_prediction_difference"] <= 1e-10 for row in completion["saved_selected_models"])
