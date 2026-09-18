import inspect
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, USAGE, read_json, sha256
from cmp_ml.paper_features import P1_COLUMNS
from cmp_ml.paper_models import fit_p1
from cmp_ml.reconstruction import meta_specs, metrics, train
from cmp_ml.reconstruction_features import phase_features, assign_recipe_cpp
from cmp_ml.reconstruction_models import fit_p1_bank, fit_meta, ReconstructionHistory, TruncatedOLS


def test_p1_control_really_matches_v1_oof_refit():
    rng = np.random.default_rng(5)
    frame = pd.DataFrame(rng.normal(size=(30, 35)), columns=P1_COLUMNS)
    frame[TARGET] = 70 + frame.iloc[:, 0] * 3
    seed = 20260917
    old = fit_p1(frame, seed, grouped=False)
    bank = fit_p1_bank(frame, seed)
    choices = [s for s in meta_specs() if s["id"] in ("oof_refit_cart_5_None", "oof_refit_elm_50_1e-08")]
    assert len(choices) == 2
    for spec in choices:
        bank.chosen[spec["family"]] = (spec, fit_meta(bank, frame[TARGET], spec, seed))
    query = frame.iloc[:7].drop(columns=[TARGET])
    for name, values in old.predict_all(query).items():
        np.testing.assert_allclose(bank.predict_all(query)[name], values, rtol=1e-10, atol=1e-9)


def test_figure3_phase_uses_center_pressure_and_stage_rotation():
    trace = pd.DataFrame({"TIMESTAMP": np.arange(7.), "CHAMBER": 4,
        "CENTER_AIR_BAG_PRESSURE": [0, 1, 10, 10, 10, 5, 0], "PRESSURIZED_CHAMBER_PRESSURE": 1000,
        "SLURRY_FLOW_LINE_A": [1, 1, 2, 2, 2, 8, 1], "WAFER_ROTATION": 0, "STAGE_ROTATION": 5})
    result = phase_features(trace)
    assert result["native_duration"] == 2
    assert result["native_pressure_integral"] == 20
    assert not result["native_phase_fallback"]
    trace["CENTER_AIR_BAG_PRESSURE"] = 0
    assert phase_features(trace)["native_phase_fallback"]


def test_recipe_cpp_respects_stage_and_does_not_use_targets():
    frame = pd.DataFrame({"sample_id": list("abcd"), "machine": 1, "route": "456", "STAGE": ["A", "B", "A", "A"],
        "native_primary_start": [0., 100., 510., 1031.], "native_primary_end": [10., 110., 530., 1040.], TARGET: [10, 20, 30, 40]})
    ids, first = assign_recipe_cpp(frame, "primary_end")
    assert ids.iloc[0] == ids.iloc[2] and ids.iloc[1] != ids.iloc[0] and ids.iloc[3] != ids.iloc[2]
    assert first.tolist() == [1., 1., 0., 1.]
    frame[TARGET] = -9999
    np.testing.assert_equal(ids.to_numpy(), assign_recipe_cpp(frame, "primary_end")[0].to_numpy())


def test_lag_hypotheses_change_only_availability_not_holdout_labels():
    ref = pd.DataFrame({"WAFER_ID": [1, 2], "condition": ["Cond1"] * 2, "machine": 1,
        "start": [0., 10.], "end": [5., 25.], TARGET: [40., 60.]})
    for c in USAGE:
        ref[f"p2_primary_{c}_mean"] = [1., 2.]
    query = ref.iloc[[1]].copy()
    query["WAFER_ID"], query["start"], query[TARGET] = 3, 20., -9999
    completed = ReconstructionHistory("raw", "completed").fit(ref).transform(query)
    started = ReconstructionHistory("raw", "prior_start").fit(ref).transform(query)
    assert completed[0, 0] == 40 and started[0, 0] == 60
    assert -9999 not in started


def test_truncated_ols_handles_rank_deficiency_without_extreme_coefficients():
    x = np.linspace(-1, 1, 30)
    X = np.column_stack([x, x + np.sin(x) * 1e-12])
    model = TruncatedOLS().fit(X, 5 + 2 * x)
    np.testing.assert_allclose(model.predict(X), 5 + 2 * x, atol=1e-8)
    assert np.max(np.abs(model.coef_)) < 10 and model.rank_ == 2


def test_frozen_search_budget_and_metric_overflow_are_explicit():
    assert len(meta_specs()) == 36
    assert len({s["id"] for s in meta_specs()}) == 36
    result = metrics([1., 2.], [10000., 2.])
    assert result["s_score_overflow"] and result["s_score_literal_mean"] is None
    assert result["mse"] == pytest.approx(9999 ** 2 / 2)
    # Test-label I/O belongs to evaluate, not training/selection.
    assert "test_truth.csv" not in inspect.getsource(train)


def test_reconstruction_published_choices_metrics_and_preservation():
    run = Path(__file__).resolve().parents[1] / "runs/phm_cmp_reconstruction_v2"
    assert (run / "completion.json").is_file(), "Published reconstruction evidence is required"
    protocol = read_json(run / "protocol.json")
    completion = read_json(run / "completion.json")
    assert sha256(run / "metrics.csv") == completion["metrics_sha256"]
    assert sha256(run / "selection.json") == completion["selection_sha256"]
    for name, digest in protocol["code_sha256"].items():
        assert sha256(run / "code_snapshot" / name) == digest
    trials = pd.read_csv(run / "validation_trials.csv")
    chosen = read_json(run / "selection.json")["choices"]
    for paper, family in (("p2", "P2_Integrated"), ("p3", "P3_RF_CPP")):
        block = trials[trials.paper.eq(paper) & trials.model.eq(family)]
        assert block.sort_values(["mse", "mae", "candidate"]).iloc[0].candidate == chosen[paper]["spec"]["id"]
    for stage, families in chosen["p1"].items():
        for family, value in families.items():
            block = trials[trials.paper.eq("p1") & trials.stage.eq(stage) & trials.model.eq(family)]
            assert block.sort_values(["mse", "mae", "candidate"]).iloc[0].candidate == value["spec"]["id"]
    pred, scores = pd.read_csv(run / "scored_predictions.csv.gz"), pd.read_csv(run / "metrics.csv")
    assert len(scores) == 78
    for row in scores.itertuples(index=False):
        block = pred[pred.model.eq(row.model) & pred.split.eq(row.split)]
        if row.stage != "all":
            block = block[block.STAGE.eq(row.stage)]
        assert len(block) == row.n
        assert np.mean(np.square(block.truth - block.prediction)) == pytest.approx(row.mse)
    assert read_json(run / "verification.json")["original_models_unchanged"]
