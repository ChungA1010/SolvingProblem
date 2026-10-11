"""Synthetic software checks only; no new CMP performance experiment."""
from copy import deepcopy
import csv
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import sys

import pytest

from src.validation import independent as iv

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = datetime(2029, 1, 1, tzinfo=timezone.utc)
MODEL = ROOT / "artifacts/education-ridge-v1/model.json"


def at(seconds):
    return (ORIGIN + timedelta(seconds=seconds)).isoformat()


def csv_write(path, rows, fields):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def row(identity, recipe, started, completed=None, mrr=None):
    result = dict(wafer_id=identity, source_wafer_id="source-" + identity,
                  source_group_id="NEW_SYNTHETIC_GROUP", recipe=recipe, wafer_started_at=at(started))
    if completed is not None:
        result.update(measurement_completed_at=at(completed), mrr=mrr)
    return result


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN)
    payload = json.loads(MODEL.read_text())
    registry = {"schema": "cmp-exposure-registry-v1", "development_table_sha256": payload["provenance"]["source_sha256"],
                "wafer_sha256": [iv.identity_hash("known-old")], "group_sha256": [iv.identity_hash("known-group")],
                "reference_recipe_means": {"A456": 60., "B456": 80.}}
    plan = {"collection_id": "SYNTHETIC_SOFTWARE_TEST_ONLY", "acquisition_evidence": "synthetic unit-test fixture",
            "independence_attestation": "UNUSED_FOR_TRAINING_OR_SELECTION", "timestamp_basis": "OBSERVED",
            "target_scale": "PHM_AVG_REMOVAL_RATE_FACTOR_1", "target_scale_evidence": "synthetic test, not real measurement evidence",
            "evaluation_start": at(20), "evaluation_end": at(60), "label_deadline": at(100)}
    registry_path, plan_path = tmp_path / "registry.json", tmp_path / "plan.json"
    iv.write_json(registry_path, registry); iv.write_json(plan_path, plan)
    run = tmp_path / "run"
    iv.freeze(MODEL, iv.sha256(MODEL), registry_path, plan_path, run)
    planned = [row("a1", "A456", 20), row("a2", "A456", 40), row("b1", "B456", 25), row("b2", "B456", 45)]
    measured = [row("warm-a", "A456", 5, 15, 60), row("warm-b", "B456", 6, 16, 80),
                row("a1", "A456", 20, 40, 70), row("a2", "A456", 40, 50, 72),
                row("b1", "B456", 25, 30, 82), row("b2", "B456", 45, 55, 84)]
    schedule, measurements = tmp_path / "schedule.csv", tmp_path / "measurements.csv"
    csv_write(schedule, planned, iv.SCHEDULE_FIELDS); csv_write(measurements, measured, iv.MEASUREMENT_FIELDS)
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN + timedelta(seconds=101))
    return dict(run=run, schedule=schedule, measurements=measurements, planned=planned, measured=measured,
                registry_path=registry_path, plan_path=plan_path, plan=plan, tmp=tmp_path)


def test_causal_replay_score_once_and_manual_baseline_metrics(setup):
    f = setup
    predictions = iv.predict(f["run"], f["schedule"], f["measurements"])
    by_id = {r["wafer_id"]: r for r in predictions}
    assert by_id["a1"]["Persistence"] == by_id["a2"]["Persistence"] == 60  # equality is not availability
    assert by_id["b2"]["Persistence"] == 82 and by_id["b2"]["EWMA"] == pytest.approx(80.8)
    assert by_id["a1"]["history_used"] == 1 and by_id["b2"]["history_used"] == 2
    assert not (f["run"] / "metrics.json").exists()
    report = iv.score(f["run"], f["schedule"], f["measurements"])
    metrics = {r["model"]: r for r in report["metrics"] if r["recipe"] == "A456+B456"}
    assert metrics["Persistence"]["mae"] == 6.5 and metrics["EWMA"]["mae"] == pytest.approx(6.8)
    assert metrics["Persistence"]["rmse"] == pytest.approx((63.) ** .5)
    assert report["status"] == "SCORED_DECLARED_PROSPECTIVE_COHORT"
    assert report["fit_count"] == 0 and report["production_model"] is False
    assert iv.sha256(f["run"] / "model.json") == iv.sha256(MODEL)
    with pytest.raises(FileExistsError):
        iv.score(f["run"], f["schedule"], f["measurements"])
    with pytest.raises(FileExistsError):
        iv.predict(f["run"], f["schedule"], f["measurements"])


def test_current_and_not_yet_completed_targets_cannot_change_predictions(setup, monkeypatch):
    f = setup
    first = iv.predict(f["run"], f["schedule"], f["measurements"])
    changed = deepcopy(f["measured"])
    for r in changed:
        if r["wafer_id"] in {"a1", "a2", "b2"}:
            r["mrr"] = 999999
    csv_write(f["measurements"], changed, iv.MEASUREMENT_FIELDS)
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN)
    other = f["tmp"] / "other"
    iv.freeze(MODEL, iv.sha256(MODEL), f["registry_path"], f["plan_path"], other)
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN + timedelta(seconds=101))
    second = iv.predict(other, f["schedule"], f["measurements"])
    assert first == second


def test_release_after_actual_completion_changes_only_later_wafer(setup, monkeypatch):
    f = setup
    f["measured"][2]["measurement_completed_at"] = at(29)
    csv_write(f["measurements"], f["measured"], iv.MEASUREMENT_FIELDS)
    predictions = {r["wafer_id"]: r for r in iv.predict(f["run"], f["schedule"], f["measurements"])}
    assert predictions["a1"]["Persistence"] == 60
    assert predictions["a2"]["Persistence"] == 70 and predictions["a2"]["EWMA"] == pytest.approx(64)


@pytest.mark.parametrize("change,match", [
    ("old-wafer", "known-data overlap"), ("old-group", "known-data overlap"),
    ("duplicate", "duplicate execution"), ("alias", "duplicate source wafer/recipe"),
    ("nan", "finite MRR"), ("missing", "matching measured target"),
    ("naive", "timezone"), ("before-start", "completed before"),
    ("outside-window", "outside the fixed"), ("extra", "warmup only"),
    ("late", "label deadline"), ("unsupported", "A456/B456"),
])
def test_data_qualification_rejects_leakage_and_invalid_cohorts(setup, change, match):
    f = setup
    if change == "old-wafer": f["planned"][0]["source_wafer_id"] = "known-old"
    elif change == "old-group": f["measured"][0]["source_group_id"] = "known-group"
    elif change == "duplicate": f["measured"].append(deepcopy(f["measured"][0]))
    elif change == "alias":
        extra = deepcopy(f["measured"][0]); extra["wafer_id"] = "alias"; f["measured"].append(extra)
    elif change == "nan": f["measured"][0]["mrr"] = "NaN"
    elif change == "missing": f["measured"].pop()
    elif change == "naive": f["measured"][0]["wafer_started_at"] = "2029-01-01T00:00:05"
    elif change == "before-start": f["measured"][0]["measurement_completed_at"] = at(1)
    elif change == "outside-window": f["planned"][0]["wafer_started_at"] = at(19)
    elif change == "extra": f["measured"].append(row("unscheduled", "A456", 27, 28, 70))
    elif change == "late": f["measured"][-1]["measurement_completed_at"] = at(101)
    elif change == "unsupported": f["planned"][0]["recipe"] = "A123"
    csv_write(f["schedule"], f["planned"], iv.SCHEDULE_FIELDS)
    csv_write(f["measurements"], f["measured"], iv.MEASUREMENT_FIELDS)
    with pytest.raises(iv.ValidationError, match=match):
        iv.predict(f["run"], f["schedule"], f["measurements"])
    assert not (f["run"] / "prediction_seal.json").exists()
    with pytest.raises(FileExistsError):
        iv.predict(f["run"], f["schedule"], f["measurements"])


def test_no_early_peeking_or_scoring_before_seal(setup, monkeypatch):
    f = setup
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN + timedelta(seconds=90))
    with pytest.raises(iv.ValidationError, match="not closed"):
        iv.predict(f["run"], f["schedule"], f["measurements"])
    assert not (f["run"] / "prediction_started.json").exists()
    with pytest.raises(FileNotFoundError):
        iv.score(f["run"], f["schedule"], f["measurements"])


@pytest.mark.parametrize("changed", ["model.json", "registry.json", "protocol.json", "predictions.json", "measurements.csv", "schedule.csv"])
def test_sealed_input_mutations_prevent_score(setup, changed):
    f = setup
    iv.predict(f["run"], f["schedule"], f["measurements"])
    path = f["tmp"] / changed if changed.endswith("csv") else f["run"] / changed
    with path.open("a") as handle: handle.write("\n")
    with pytest.raises(iv.ValidationError, match="changed"):
        iv.score(f["run"], f["schedule"], f["measurements"])
    assert not (f["run"] / "metrics.json").exists()


@pytest.mark.parametrize("field,value", [("timestamp_basis", "SYNTHETIC"), ("target_scale", "UNKNOWN"),
                                         ("independence_attestation", "PREVIOUSLY_USED"), ("evaluation_start", at(-1))])
def test_freeze_requires_prospective_observed_unused_plan(setup, monkeypatch, field, value):
    f = setup
    monkeypatch.setattr(iv, "now_utc", lambda: ORIGIN)
    plan = dict(f["plan"]); plan[field] = value
    plan_path = f["tmp"] / "bad-plan.json"; iv.write_json(plan_path, plan)
    with pytest.raises(iv.ValidationError):
        iv.freeze(MODEL, iv.sha256(MODEL), f["registry_path"], plan_path, f["tmp"] / "bad-run")
    assert not (f["tmp"] / "bad-run").exists()


def test_no_history_is_reported_as_coverage_loss_without_imputation(setup):
    f = setup
    csv_write(f["measurements"], f["measured"][2:], iv.MEASUREMENT_FIELDS)
    predictions = iv.predict(f["run"], f["schedule"], f["measurements"])
    assert sum(r["status"] == "OK" for r in predictions) == 1
    report = iv.score(f["run"], f["schedule"], f["measurements"])
    assert report["status"] == "INSUFFICIENT_HISTORY_COVERAGE" and report["excluded_no_history"] == 3
    assert all(r["mae"] is None for r in report["metrics"] if r["recipe"] == "A456")


def test_validation_runs_without_site_packages_or_training_imports():
    script = '''
import builtins
original = builtins.__import__
def guarded(name, *args, **kwargs):
    if name.startswith(("src.models", "sklearn", "pandas", "numpy")):
        raise AssertionError(name)
    return original(name, *args, **kwargs)
builtins.__import__ = guarded
from src.validation.independent import bundle
'''
    result = subprocess.run([sys.executable, "-S", "-c", script], cwd=ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


def test_published_readiness_does_not_claim_a_final_score():
    report = json.loads((ROOT / "verification/independent-final-v1/readiness.json").read_text())
    assert report["status"] == "WAITING_FOR_UNSEEN_DATA"
    assert report["new_final_score_count"] == 0 and report["independent_final_performance"] is None
    assert all(r["eligible_as_fresh_final"] is False for r in report["candidates"])
    assert report["artifact_sha256"] == iv.sha256(MODEL)
