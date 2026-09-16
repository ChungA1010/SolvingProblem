import numpy as np
import pandas as pd
import pytest
from sklearn.base import BaseEstimator

from cmp_ml.common import TARGET
from cmp_ml.stability import (check_partition, choose_candidates, development_data,
                              grouped_folds, run_stability, summarize_predictions)


def source_frame():
    return pd.DataFrame([{"sample_id": f"s{i}", "WAFER_ID": i, "STAGE": "B", "group_id": f"g{i // 2}",
                          "source_files": f"file{i // 2}", "split": "train", TARGET: float(i)} for i in range(24)])


def test_nested_folds_are_target_blind_and_keep_whole_groups():
    frame = source_frame()
    plan = grouped_folds(frame, 5)
    poisoned = frame.copy()
    poisoned[TARGET] = np.arange(len(frame))[::-1] * 1e9
    changed = grouped_folds(poisoned, 5)
    for (fi, hi), (ci, di) in zip(plan, changed):
        np.testing.assert_array_equal(fi, ci)
        np.testing.assert_array_equal(hi, di)
        check_partition(frame.iloc[fi], frame.iloc[hi], "outer")
        for ii, ji in grouped_folds(frame.iloc[fi], 3):
            assert not set(frame.iloc[fi].iloc[ii].group_id) & set(frame.iloc[hi].group_id)
            check_partition(frame.iloc[fi].iloc[ii], frame.iloc[fi].iloc[ji], "inner")
    assert sorted(np.concatenate([hi for _, hi in plan])) == list(range(len(frame)))


def test_non_training_and_other_stage_targets_are_excluded():
    frame = source_frame()
    extras = frame.copy()
    extras["sample_id"] += "_extra"
    extras["WAFER_ID"] += 100
    extras["group_id"] += "_extra"
    extras["source_files"] += "_extra"
    extras["split"] = np.array(["test", "validation", "calibration"])[(np.arange(len(extras)) // 2) % 3]
    extras[TARGET] = np.inf
    a = extras.copy()
    a["sample_id"] += "A"
    a["STAGE"], a["split"] = "A", "train"
    a["WAFER_ID"] += 100
    a["group_id"] += "A"
    a["source_files"] += "A"
    got = development_data(pd.concat([frame, extras, a], ignore_index=True))
    assert set(got.sample_id) == set(frame.sample_id)
    assert np.isfinite(got[TARGET]).all()


def test_nested_partition_rejects_file_leak_despite_different_group_ids():
    frame = source_frame()
    fit, held = frame.iloc[:10].copy(), frame.iloc[10:].copy()
    held.loc[held.index[0], "source_files"] = fit.source_files.iloc[0]
    with pytest.raises(ValueError, match="source file"):
        check_partition(fit, held, "bad")


def test_selection_pools_samples_instead_of_unweighted_fold_means():
    trials = pd.DataFrame([
        {"model": "one", "candidate_id": "c1", "n": 100, "mae": 1., "rmse": 2.},
        {"model": "one", "candidate_id": "c1", "n": 1, "mae": 20., "rmse": 20.},
        {"model": "one", "candidate_id": "c2", "n": 100, "mae": 2., "rmse": 2.},
        {"model": "one", "candidate_id": "c2", "n": 1, "mae": 2., "rmse": 2.},
    ])
    best, cid = choose_candidates(trials)
    assert cid == "c1"
    assert best.iloc[0].inner_mae == pytest.approx(120 / 101)
    assert best.iloc[0].inner_rmse == pytest.approx(np.sqrt(800 / 101))


def test_inner_selected_score_uses_selection_not_outer_winner():
    rows = pd.DataFrame([{"sample_id": str(i), "model": m, "group_id": f"g{i}", "outer_fold": i,
                          "y_true": 10., "y_pred": pred, "selected_by_inner": selected}
                         for i in range(2) for m, pred, selected in [("selected", 15., True), ("better_outer", 10., False)]])
    summary, _, _ = summarize_predictions(rows)
    scores = summary.set_index("model").mae
    assert scores["InnerSelected"] == 5.
    assert scores["better_outer"] == 0.


def test_stability_refuses_existing_output_before_loading_source(tmp_path):
    (tmp_path / "protocol.json").write_text("{}")
    with pytest.raises(FileExistsError, match="cannot be overwritten"):
        run_stability(tmp_path / "missing_source", tmp_path)


class RecordingRegressor(BaseEstimator):
    def fit(self, x, y):
        self.fit_target = np.asarray(y).copy()
        return self


def test_hybrid_residual_targets_exclude_own_groups(monkeypatch):
    from cmp_ml import stability
    calls = []

    class MeanPhysics:
        def __init__(self, regularization):
            pass

        def fit(self, frame, y):
            self.groups = set(frame.group_id)
            self.mean = float(np.mean(y))
            return self

        def predict(self, frame):
            assert not self.groups & set(frame.group_id)
            calls.append((self.groups, set(frame.group_id)))
            return np.full(len(frame), self.mean)

    monkeypatch.setattr(stability, "PrestonInspired", MeanPhysics)
    frame = source_frame()
    frame["chamber_route"] = "4-5-6"
    frame["f__sensor"] = np.arange(len(frame), dtype=float)
    spec = {"model": "Physics+Fake", "kind": "hybrid", "config": {}, "estimator": RecordingRegressor(), "candidate_id": "fake"}
    audit = []
    [(spec, bundle, _, _)] = list(stability.fit_candidates(frame, [spec], 1, "test", audit))
    assert len(calls) == 3
    # A group's own targets must never affect its physics reference prediction.
    expected = np.empty(len(frame))
    for fit_groups, held_groups in calls:
        held = frame.group_id.isin(held_groups)
        expected[held] = frame.loc[held, TARGET] - frame.loc[frame.group_id.isin(fit_groups), TARGET].mean()
    np.testing.assert_allclose(bundle.estimator.fit_target, expected)


def test_nested_run_baseline_predictions_use_only_outer_training_groups(tmp_path, monkeypatch):
    from cmp_ml import stability
    from cmp_ml.common import read_json, sha256

    frame = source_frame()
    frame["chamber_route"] = "4-5-6"
    frame["f__sensor"] = np.arange(len(frame), dtype=float)
    source, output = tmp_path / "source", tmp_path / "nested"
    source.mkdir()
    sentinel = source / "untouched.txt"
    sentinel.write_text("Original sealed experiment")
    expected_hash = sha256(sentinel)
    monkeypatch.setattr(stability, "load_run", lambda _: (frame, {"features_sha256": "unused", "split_sha256": "unused"}))
    monkeypatch.setattr(stability, "FAMILIES", ("StageMean",))
    monkeypatch.setattr(stability, "candidates", lambda _: [
        {"model": "StageMean", "kind": "constant", "config": {}, "estimator": None, "candidate_id": "c00"}])

    class UnusedPhysics:
        def __init__(self, regularization):
            pass

        def fit(self, frame, y):
            return self

    monkeypatch.setattr(stability, "PrestonInspired", UnusedPhysics)
    stability.run_stability(source, output, threads=1)
    predictions = pd.read_csv(output / "outer_predictions.csv")
    for group_id, rows in predictions.groupby("group_id"):
        fold = int(rows.outer_fold.iloc[0])
        held_groups = set(predictions.loc[predictions.outer_fold.eq(fold), "group_id"])
        expected = frame.loc[~frame.group_id.isin(held_groups), TARGET].mean()
        np.testing.assert_allclose(rows.y_pred, expected)
    done = read_json(output / "completion.json")
    assert done["status"] == "complete"
    assert done["inner_candidate_fits"] == 15 and done["outer_family_fits"] == 5
    assert sha256(sentinel) == expected_hash
    for name, digest in done["artifact_hashes"].items():
        assert sha256(output / name) == digest
