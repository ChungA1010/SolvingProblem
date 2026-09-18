"""Independent-paper routing, training isolation, and immutable evidence."""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest

from cmp_ml import baselines as b
from cmp_ml.common import TARGET, read_json, sha256, write_json
from cmp_ml.paper_features import P3_ROUGH


class TargetGuardModel:
    def __init__(self, names, offset):
        self.names, self.offset = names, offset

    def predict_all(self, query):
        assert TARGET not in query and "truth" not in query
        return {name: query["signal"].to_numpy(float) + self.offset + i for i, name in enumerate(self.names)}


def routing_fixture(tmp_path, paper="p1"):
    spec = b.spec_for(paper)
    records = []
    for i, route in enumerate(spec["routing_values"]):
        path = tmp_path / f"{route}.joblib"
        joblib.dump(TargetGuardModel(spec["models"], 10 * i), path)
        records.append(b.model_record(path, tmp_path, "grouped", route))
    query = pd.DataFrame({"sample_id": ["b", "a"], "STAGE": ["B", "A"],
                          "signal": [1., 2.], TARGET: [1000., 2000.], "truth": [-1., -2.]}, index=[23, 7])
    return spec, records, query


def test_saved_baseline_routing_ignores_targets_and_preserves_query_order(tmp_path):
    spec, records, query = routing_fixture(tmp_path)
    result = b.predict_records(spec, records, tmp_path, "grouped", query)
    assert result["P1_RF"].tolist() == [11., 2.]
    query[TARGET], query["truth"] = -999999, 999999
    again = b.predict_records(spec, records, tmp_path, "grouped", query)
    for name in result:
        np.testing.assert_equal(result[name], again[name])


def test_model_hash_checked_before_loading_and_bad_routes_rejected(tmp_path, monkeypatch):
    spec, records, query = routing_fixture(tmp_path)
    query.loc[23, "STAGE"] = "C"
    with pytest.raises(ValueError, match="Unsupported"):
        b.predict_records(spec, records, tmp_path, "grouped", query)
    query.loc[23, "STAGE"] = "B"
    (tmp_path / records[0]["path"]).write_bytes(b"tampered")
    monkeypatch.setattr(joblib, "load", lambda p: pytest.fail("Unverified model was deserialized"))
    with pytest.raises(ValueError, match="changed artifact"):
        b.predict_records(spec, records, tmp_path, "grouped", query)


def test_prediction_check_matches_ids_not_row_order():
    actual = pd.DataFrame({"track": ["grouped"] * 2, "split": ["test"] * 2,
                           "model": ["P3_RF"] * 2, "sample_id": ["a", "b"], "prediction": [4., 2.]})
    assert b.compare_predictions(actual, actual.iloc[::-1]) == 0
    with pytest.raises(ValueError, match="different sample/model keys"):
        b.compare_predictions(actual, actual.iloc[:1])
    changed = actual.copy()
    changed.loc[0, "prediction"] += 1
    with pytest.raises(ValueError, match="predictions differ"):
        b.compare_predictions(actual, changed)


@pytest.mark.parametrize("paper", ["p1", "p2"])
def test_single_paper_train_dispatches_only_train_rows_and_declared_repeats(tmp_path, monkeypatch, paper):
    spec = b.spec_for(paper)
    column, routes = spec["routing_column"], spec["routing_values"]
    train = pd.DataFrame({"sample_id": [f"train{i}" for i in range(len(routes))],
                          "STAGE": ["A"] * len(routes), column: routes,
                          TARGET: np.arange(len(routes)) + 10., "signal": np.arange(len(routes), dtype=float)})
    valid = train.copy()
    valid["sample_id"] = [f"val{i}" for i in range(len(routes))]
    test = train.copy()
    test["sample_id"] = [f"test{i}" for i in range(len(routes))]
    calls = []

    def fit(frame, seed, grouped, **kwargs):
        assert frame.sample_id.str.startswith("train").all()
        assert frame[column].nunique() == 1 and grouped
        calls.append((seed, str(frame[column].iloc[0])))
        model = TargetGuardModel(spec["models"], 0)
        return (model, [{"fold": 0, "model": "P2_LR", "mse": 1}], [{"fold": 0, "selected": True}]) if paper == "p2" else model

    monkeypatch.setattr(b, f"fit_{paper}", fit)
    other = "fit_p2" if paper == "p1" else "fit_p1"
    monkeypatch.setattr(b, other, lambda *a, **k: pytest.fail("Other paper trained"))
    monkeypatch.setattr(b, "fit_p3", lambda *a, **k: pytest.fail("Other paper trained"))
    records, predictions = b.train_one_paper(spec, {"grouped": {"train": train, "validation": valid, "test": test}}, tmp_path)
    assert len(calls) == len(routes) * spec["training_repeats"]
    assert set(calls) == {(spec["seed"] + r, str(route)) for r in range(spec["training_repeats"]) for route in routes}
    assert len(records) == len(routes)
    assert set(predictions.model) == set(spec["models"])
    assert predictions.repeat.nunique() == spec["training_repeats"]
    assert not predictions.sample_id.str.startswith("train").any()


def test_real_p3_training_serialization_and_route_predictions(tmp_path):
    rng = np.random.default_rng(8)
    frame = pd.DataFrame(rng.uniform(0, 1, (40, len(P3_ROUGH))), columns=P3_ROUGH)
    frame["sample_id"] = [f"s{i}" for i in range(len(frame))]
    frame["STAGE"] = "A"
    frame["route"] = ["456", "123"] * 20
    frame["p3_cpp"] = np.arange(len(frame)) // 2
    frame[TARGET] = 60 + 8 * frame.p3_dresser + frame.p3_table
    parts = {"train": frame.iloc[:28], "validation": frame.iloc[28:34], "test": frame.iloc[34:]}
    parts = {key: part.reset_index(drop=True) for key, part in parts.items()}
    spec = b.spec_for("p3")
    records, before = b.train_one_paper(spec, {"official": parts}, tmp_path)
    assert len(records) == 2
    after = []
    for split in ("validation", "test"):
        pred = b.predict_records(spec, records, tmp_path, "official", parts[split])
        # No held-out CPP was in training, so the correction is exactly zero.
        np.testing.assert_allclose(pred["P3_RF"], pred["P3_RF_CPP"])
        after.append(b.prediction_rows(parts[split], pred, "official", split))
    assert b.compare_predictions(pd.concat(after), before) < 1e-8


def test_completed_output_and_source_descendants_are_never_overwritten(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    marker = source / "evidence.txt"
    marker.write_text("keep", encoding="utf-8")
    for output in (source, source / "new"):
        with pytest.raises(FileExistsError):
            b.execute("p1", "train", source, output)
    assert marker.read_text(encoding="utf-8") == "keep"
    assert not (source / "new").exists()


def test_artifact_verification_needs_no_raw_data_and_detects_edits(tmp_path):
    write_json(tmp_path / "baseline.json", {"paper": "p1"})
    write_json(tmp_path / "models.json", {"records": []})
    artifacts = {p.name: sha256(p) for p in tmp_path.iterdir()}
    write_json(tmp_path / "completion.json", {"artifact_sha256": artifacts})
    assert b.verify(tmp_path)["verified"]
    write_json(tmp_path / "baseline.json", {"paper": "p2"})
    with pytest.raises(ValueError, match="changed artifact"):
        b.verify(tmp_path)


def test_published_per_paper_scores_and_model_references_match_source():
    run = Path(__file__).resolve().parents[1] / "runs/phm_cmp_baselines_v1"
    source = pd.read_csv(b.DEFAULT_SOURCE / "metrics.csv", float_precision="round_trip")
    assert run.is_dir(), "Published baseline evidence must be present"
    for paper, expected_n in (("p1", 5), ("p2", 6), ("p3", 2)):
        directory = run / paper
        b.verify(directory)
        spec = read_json(directory / "baseline.json")
        assert len(spec["models"]) == expected_n
        scores = pd.read_csv(directory / "metrics.csv", float_precision="round_trip")
        keys = ["track", "split", "model", "stage"]
        expected = source[source.model.isin(spec["models"])]
        assert len(scores) == len(expected)
        joined = scores.merge(expected, on=keys, validate="one_to_one", suffixes=("", "_source"))
        assert len(joined) == len(expected)
        for metric in ("mse", "rmse", "mae", "r2", "relative_error"):
            np.testing.assert_allclose(joined[metric], joined[f"{metric}_source"], rtol=1e-9, atol=1e-9)
