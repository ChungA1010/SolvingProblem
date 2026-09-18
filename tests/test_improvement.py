import inspect
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, USAGE, read_json, sha256
from cmp_ml.improvement import audit_partition, metric_rows, partition_rows, train
from cmp_ml.improvement_models import (ImprovementBundle, ResearchHistory, extend_mask, grid,
    physics_features, regressor, simplex_weights)
from cmp_ml.reconstruction_models import ReconstructionHistory


def frame(n=30):
    f = pd.DataFrame({"sample_id": [f"s{i}" for i in range(n)], "WAFER_ID": np.arange(n),
        "STAGE": "A", "condition": "Cond1", "machine": 1, "start": np.arange(n) * 100.,
        "end": np.arange(n) * 100. + 10, "group_id": [f"g{i // 2}" for i in range(n)],
        TARGET: np.arange(n) * .1 + 70})
    for zone in ("primary", "secondary"):
        f[f"p2_{zone}_duration"] = 10.
        for c in USAGE + ["PRESSURIZED_CHAMBER_PRESSURE", "CENTER_AIR_BAG_PRESSURE", "WAFER_ROTATION", "STAGE_ROTATION"]:
            f[f"p2_{zone}_{c}_mean"] = np.arange(n) + 1.
    return f


def test_completed_history_rejects_future_same_wafer_and_unfinished_labels():
    f = frame(5)
    f.loc[1, "end"] = 9999.
    q = f.iloc[[3]].copy()
    q["start"] = 250.
    h = ResearchHistory("completed").fit(f)
    slots, _ = h.referenced_indices(q)
    used = slots[0][slots[0] >= 0]
    assert set(used) == {0, 2}
    assert np.all(f.iloc[used].end < 250) and 3 not in used
    assert slots[0, 0] == 2


def test_retrospective_history_matches_frozen_v2_features_exactly():
    f = frame()
    q = f.iloc[[7, 15, 25]].drop(columns=[TARGET])
    expected = ReconstructionHistory("raw", "prior_start").fit(f).transform(q)
    actual = ResearchHistory("retrospective").fit(f).transform(q)
    np.testing.assert_allclose(actual, expected, equal_nan=True)


@pytest.mark.parametrize("policy", ["completed", "retrospective"])
def test_query_labels_cannot_change_features_or_history(policy):
    f = frame()
    q = f.iloc[[12, 17]].copy()
    h = ResearchHistory(policy).fit(f)
    before = h.views(q)
    q[TARGET] = -1e12
    after = h.views(q)
    for key in before:
        np.testing.assert_allclose(before[key], after[key], equal_nan=True)


def test_empty_history_stays_missing_and_counts_zero():
    h = ResearchHistory("completed").fit(frame())
    views = h.views(frame().iloc[[0]])
    assert np.isnan(views["base"][0, :21]).all()
    assert views["history"][0, -8] == 0 and views["history"][0, -3] == 0
    assert np.isnan(views["history"][0, -2:]).all()


def test_physics_proxy_has_documented_formula_and_safe_zero_pressure():
    f = frame(3)
    values = physics_features(f)
    assert values.shape == (3, 12)
    assert values.iloc[1].primary_pressure_speed == 8.
    assert values.iloc[1].primary_pressure_speed_time == 80.
    f["p2_primary_PRESSURIZED_CHAMBER_PRESSURE_mean"] = 0.
    assert physics_features(f).primary_center_pressure_ratio.isna().all()


def test_convex_blend_stays_on_simplex_and_improves_penalized_objective():
    y = np.arange(20., dtype=float)
    Z = np.column_stack([y + .2, y + 10., y - .3])
    prior = np.ones(3) / 3
    w = simplex_weights(Z, y, prior)
    assert (w >= 0).all() and w.sum() == pytest.approx(1)
    objective = lambda a: np.mean((Z @ a - y) ** 2) + np.sum((a - prior) ** 2)
    assert objective(w) < objective(prior)


def test_partitions_block_wafer_file_groups_and_enforce_time_order():
    f = frame(60)
    partitions, cutoff = partition_rows(f)
    assert np.isfinite(cutoff)
    for part, block in partitions.groupby("partition"):
        a = f[f.sample_id.isin(block.loc[block.role.eq("train"), "sample_id"])]
        b = f[f.sample_id.isin(block.loc[block.role.eq("evaluation"), "sample_id"])]
        audit_partition(a, b, part == "temporal")
    outer = partitions[partitions.partition.str.startswith("outer_") & partitions.role.eq("evaluation")]
    assert outer.sample_id.is_unique and set(outer.sample_id) == set(f.sample_id)
    with pytest.raises(ValueError, match="Overlapping"):
        audit_partition(f, f)


def test_saved_bundle_reloads_and_ignores_query_truth(tmp_path):
    f = frame()
    h = ResearchHistory("completed").fit(f)
    X = h.views(f)["base"]
    mask = np.ones(X.shape[1], dtype=bool)
    spec = next(s for s in grid() if s["id"] == "ridge_10")
    model = regressor(spec, 1).fit(X, f[TARGET])
    recipe = {"proposed": {"keys": ["base/ridge_10", "knn"], "weights": [.8, .2]}}
    bundle = ImprovementBundle(h, mask, {"base/ridge_10": model}, recipe, float(f[TARGET].mean()))
    p = bundle.predict_all(f)["proposed"]
    joblib.dump(bundle, tmp_path / "model.joblib")
    f[TARGET] = -1e12
    np.testing.assert_allclose(joblib.load(tmp_path / "model.joblib").predict_all(f)["proposed"], p)
    assert extend_mask(np.array([True, False]), 4).tolist() == [True, False, True, True]


def test_training_budget_and_no_reference_label_io():
    assert len(grid()) == 16 and len({x["id"] for x in grid()}) == 16
    source = inspect.getsource(train)
    assert "test_truth" not in source and "development.csv" not in source


def test_published_improvement_metrics_and_sealed_choices():
    run = Path(__file__).resolve().parents[1] / "runs/phm_cmp_improvement_v1"
    if not run.exists():
        pytest.skip("Experiment not yet prepared")
    completion = read_json(run / "completion.json")
    assert sha256(run / "metrics.csv") == completion["metrics_sha256"]
    selection, seal = read_json(run / "selection.json"), read_json(run / "evaluation_seal.json")
    assert selection["selected_at"] < seal["sealed_at"]
    assert sha256(run / "selection.json") == seal["selection_sha256"]
    pred = pd.concat([pd.read_csv(run / n, float_precision="round_trip") for n in
        ("development_predictions.csv.gz", "reference_scored_predictions.csv.gz")], ignore_index=True)
    actual = metric_rows(pred)
    saved = pd.read_csv(run / "metrics.csv", float_precision="round_trip")
    np.testing.assert_allclose(actual.mse, saved.mse, rtol=1e-10)
    for detail_path in (run / "selection_details").glob("*.json"):
        detail = read_json(detail_path)
        proposed = detail["recipes"]["proposed"]
        best = min(detail["inner_blends"], key=lambda x: (x["inner_mse"], x["id"]))
        assert proposed == best
    assert read_json(run / "verification.json")["preserved_files_unchanged"]
