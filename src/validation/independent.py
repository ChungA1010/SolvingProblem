"""Prospective, frozen-model causal replay followed by a separate one-time score.

The batch measurement file contains targets. Replay uses only measurements
completed strictly before each start; this is NOT a claim of blind file access.
Collector evidence is required: timestamps and hashes alone cannot prove novelty.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path

from src.simulator.artifact import load_artifact
from src.simulator.core import SimulationRequest, SimulatorCore
from src.simulator.history import MRRMeasurement, build_history_state

SCHEDULE_FIELDS = ("wafer_id", "source_wafer_id", "source_group_id", "recipe", "wafer_started_at")
MEASUREMENT_FIELDS = SCHEDULE_FIELDS + ("measurement_completed_at", "mrr")
PLAN_FIELDS = {"collection_id", "acquisition_evidence", "independence_attestation",
               "timestamp_basis", "target_scale", "target_scale_evidence",
               "evaluation_start", "evaluation_end", "label_deadline"}
MODELS = ("Ridge", "Persistence", "EWMA", "Recipe Mean")


class ValidationError(ValueError):
    pass


def now_utc():
    return datetime.now(timezone.utc)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def identity_hash(value):
    # Source IDs must be canonical, stable identities, not split-specific aliases.
    if not isinstance(value, str) or not value or value != value.strip():
        raise ValidationError("a canonical nonempty source identity is required")
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def timestamp(value):
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise ValueError()
        return parsed.astimezone(timezone.utc)
    except (ValueError, TypeError, AttributeError) as error:
        raise ValidationError("timestamps must be observed ISO8601 with a timezone") from error


def number(value):
    if isinstance(value, bool):
        raise ValidationError("boolean is not a numerical MRR")
    try:
        result = float(value)
        if not math.isfinite(result):
            raise ValueError()
        return result
    except (ValueError, TypeError, OverflowError) as error:
        raise ValidationError("a finite MRR is required") from error


def write_json(path, payload):
    with Path(path).open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n")


def read_json(path):
    def reject(value):
        raise ValidationError("non-finite JSON is forbidden")
    return json.loads(Path(path).read_text(encoding="utf-8-sig"), parse_constant=reject)


def freeze(artifact, expected_sha256, registry_path, plan_path, output):
    """Freeze before collection starts. No new measurements or outcomes are read."""
    output = Path(output)
    if output.exists():
        raise ValidationError("output exists; an evidence directory cannot be overwritten")
    predictor = load_artifact(artifact, expected_sha256=expected_sha256)
    registry = read_json(registry_path)
    if registry["schema"] != "cmp-exposure-registry-v1":
        raise ValidationError("invalid exposure registry")
    if registry["development_table_sha256"] != predictor.provenance["source_sha256"]:
        raise ValidationError("registry does not match model development source")
    for kind in ("wafer_sha256", "group_sha256"):
        values = registry[kind]
        if not values or len(values) != len(set(values)) or any(
            not isinstance(x, str) or len(x) != 64 or any(c not in "0123456789abcdef" for c in x)
            for x in values
        ):
            raise ValidationError("invalid known-data identity registry")
    means = registry["reference_recipe_means"]
    if set(means) != {"A456", "B456"}:
        raise ValidationError("past-training recipe means required")
    means = {recipe: number(value) for recipe, value in means.items()}
    plan = read_json(plan_path)
    if set(plan) != PLAN_FIELDS or any(not isinstance(x, str) or not x.strip() for x in plan.values()):
        raise ValidationError("all explicit plan fields are required")
    if (plan["independence_attestation"] != "UNUSED_FOR_TRAINING_OR_SELECTION"
            or plan["timestamp_basis"] != "OBSERVED"
            or plan["target_scale"] != "PHM_AVG_REMOVAL_RATE_FACTOR_1"):
        raise ValidationError("independence, observed timestamps and target-scale evidence required")
    frozen_at = now_utc()
    start, end, deadline = [timestamp(plan[k]) for k in ("evaluation_start", "evaluation_end", "label_deadline")]
    if not frozen_at < start < end <= deadline:
        raise ValidationError("declare a future evaluation window and a fixed label deadline")
    protocol = {
        "schema": "cmp-prospective-evaluation-v1", "frozen_at": frozen_at.isoformat(),
        "plan": plan, "primary_model": "Ridge", "primary_metric": "MAE",
        "secondary_metrics": ["RMSE", "mean_signed_error"], "models": list(MODELS),
        "model_version": predictor.model_version, "artifact_sha256": predictor.artifact_sha256,
        "registry_sha256": sha256(registry_path), "plan_sha256": sha256(plan_path),
        "reference_recipe_means": means, "ewma_alpha": 0.4, "ridge_alpha": 1.0,
        "fit_count": 0, "history_rule": "same recipe; completion strictly before start",
        "cohort_rule": "complete planned A456/B456 cohort, shared history-eligible rows for all models",
        "novelty_rule": "reject any known source wafer or group; collector attests unseen collection",
        "scoring_rule": "seal predictions, then score once after label deadline; no tuning",
        "unit": "PHM_raw_label_scale; physical_unit_unverified", "production_model": False,
    }
    output.mkdir(parents=True)
    for name, source in (("model.json", artifact), ("registry.json", registry_path)):
        with (output / name).open("xb") as handle:
            handle.write(Path(source).read_bytes())
    write_json(output / "protocol.json", protocol)
    write_json(output / "freeze_seal.json", {
        name: sha256(output / name) for name in ("model.json", "registry.json", "protocol.json")
    })
    return protocol


def bundle(run):
    run = Path(run)
    seal = read_json(run / "freeze_seal.json")
    if set(seal) != {"model.json", "registry.json", "protocol.json"}:
        raise ValidationError("invalid freeze seal")
    for name, digest in seal.items():
        if sha256(run / name) != digest:
            raise ValidationError("frozen input changed: " + name)
    protocol, registry = read_json(run / "protocol.json"), read_json(run / "registry.json")
    if sha256(run / "registry.json") != protocol["registry_sha256"]:
        raise ValidationError("registry changed")
    return protocol, registry, load_artifact(run / "model.json", expected_sha256=protocol["artifact_sha256"])


def read_rows(path, fields, registry, frozen_at):
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or len(reader.fieldnames) != len(fields) or set(reader.fieldnames) != set(fields):
            raise ValidationError("unexpected CSV fields")
        rows = list(reader)
    seen = set()
    known_wafers, known_groups = set(registry["wafer_sha256"]), set(registry["group_sha256"])
    for row in rows:
        if set(row) != set(fields) or any(v is None for v in row.values()):
            raise ValidationError("malformed CSV row")
        identity_hash(row["wafer_id"])
        if row["wafer_id"] in seen:
            raise ValidationError("duplicate execution ID")
        seen.add(row["wafer_id"])
        if (identity_hash(row["source_wafer_id"]) in known_wafers
                or identity_hash(row["source_group_id"]) in known_groups):
            raise ValidationError("known-data overlap; cannot qualify as a new final cohort")
        if row["recipe"] not in ("A456", "B456"):
            raise ValidationError("evaluation supports A456/B456 only")
        started = timestamp(row["wafer_started_at"])
        if started < frozen_at:
            raise ValidationError("collection predates protocol freeze")
        if "mrr" in fields:
            completed = timestamp(row["measurement_completed_at"])
            if completed < started:
                raise ValidationError("measurement completed before wafer start")
            number(row["mrr"])
    return rows


def predict(run, schedule_path, measurements_path):
    """Replay an observed ledger causally. Aggregate errors are not computed here."""
    run = Path(run)
    protocol, registry, predictor = bundle(run)
    plan = protocol["plan"]
    start, end, deadline = [timestamp(plan[k]) for k in ("evaluation_start", "evaluation_end", "label_deadline")]
    if now_utc() < deadline:
        raise ValidationError("evaluation is not closed; wait until the frozen label deadline")
    # A failed or interrupted attempt is preserved and cannot be silently retried.
    write_json(run / "prediction_started.json", {"started_at": now_utc().isoformat()})
    input_hashes = {"schedule_sha256": sha256(schedule_path), "measurements_sha256": sha256(measurements_path)}
    frozen_at = timestamp(protocol["frozen_at"])
    planned = read_rows(schedule_path, SCHEDULE_FIELDS, registry, frozen_at)
    measured = read_rows(measurements_path, MEASUREMENT_FIELDS, registry, frozen_at)
    if not planned or set(r["recipe"] for r in planned) != {"A456", "B456"}:
        raise ValidationError("a nonempty planned cohort with both recipes is required")
    if any(not start <= timestamp(r["wafer_started_at"]) < end for r in planned):
        raise ValidationError("planned wafer is outside the fixed evaluation window")
    sources = [(r["source_wafer_id"], r["recipe"]) for r in measured]
    if len(sources) != len(set(sources)):
        raise ValidationError("duplicate source wafer/recipe, including execution-ID aliases")
    labels = {r["wafer_id"]: r for r in measured}
    for row in planned:
        label = labels.get(row["wafer_id"])
        if label is None or any(label[k] != row[k] for k in SCHEDULE_FIELDS):
            raise ValidationError("each planned wafer needs exactly one matching measured target")
    planned_ids = {r["wafer_id"] for r in planned}
    if any(timestamp(r["measurement_completed_at"]) > deadline for r in measured):
        raise ValidationError("measurement exceeds frozen label deadline")
    if any(r["wafer_id"] not in planned_ids and timestamp(r["wafer_started_at"]) >= start for r in measured):
        raise ValidationError("extra ledger wafers must be pre-window warmup only")
    records = tuple(MRRMeasurement(r["wafer_id"], r["recipe"], timestamp(r["wafer_started_at"]),
                                  timestamp(r["measurement_completed_at"]), number(r["mrr"])) for r in measured)
    core, predictions = SimulatorCore(predictor), []
    for row in sorted(planned, key=lambda r: (timestamp(r["wafer_started_at"]), r["wafer_id"])):
        current_start = timestamp(row["wafer_started_at"])
        history = tuple(r for r in records if r.wafer_id != row["wafer_id"]
                        and r.wafer_started_at < current_start and r.measurement_completed_at < current_start)
        request = SimulationRequest(row["wafer_id"], row["recipe"], "Normal", current_start, history)
        result = core.predict(request)
        prediction = {"wafer_id": row["wafer_id"], "recipe": row["recipe"],
                      "status": result.status, "history_used": result.history_used,
                      "error_code": result.error.code if result.error else None}
        if result.status == "OK":
            state = build_history_state(request.recipe, request.wafer_id, current_start, history)
            prediction.update({"Ridge": result.final_mrr, "Persistence": state.prev_mrr,
                               "EWMA": state.state_ewm, "Recipe Mean": protocol["reference_recipe_means"][row["recipe"]]})
        elif prediction["error_code"] != "INSUFFICIENT_HISTORY":
            raise ValidationError("replay failed: " + str(prediction["error_code"]))
        predictions.append(prediction)
    if input_hashes != {"schedule_sha256": sha256(schedule_path), "measurements_sha256": sha256(measurements_path)}:
        raise ValidationError("input changed during replay")
    write_json(run / "predictions.json", predictions)
    write_json(run / "prediction_seal.json", {
        "frozen_at": now_utc().isoformat(), "protocol_sha256": sha256(run / "protocol.json"),
        **input_hashes,
        "predictions_sha256": sha256(run / "predictions.json"), "planned_rows": len(planned),
        "fit_count": 0, "target_access": "batch ledger read; only completed past targets enter state",
    })
    return predictions


def score(run, schedule_path, measurements_path):
    """Score sealed predictions once; never recommend or fit another model."""
    run = Path(run)
    protocol, registry, _ = bundle(run)
    seal = read_json(run / "prediction_seal.json")
    for key, path in (("protocol_sha256", run / "protocol.json"), ("schedule_sha256", schedule_path),
                      ("measurements_sha256", measurements_path), ("predictions_sha256", run / "predictions.json")):
        if sha256(path) != seal[key]:
            raise ValidationError("sealed evidence changed: " + key)
    write_json(run / "scoring_started.json", {"started_at": now_utc().isoformat()})
    measured = read_rows(measurements_path, MEASUREMENT_FIELDS, registry, timestamp(protocol["frozen_at"]))
    labels = {r["wafer_id"]: number(r["mrr"]) for r in measured}
    predictions = read_json(run / "predictions.json")
    if sha256(measurements_path) != seal["measurements_sha256"] or sha256(run / "predictions.json") != seal["predictions_sha256"]:
        raise ValidationError("input changed during scoring")
    eligible = [r for r in predictions if r["status"] == "OK"]
    metrics = []
    for recipe in ("A456+B456", "A456", "B456"):
        subset = [r for r in eligible if recipe == "A456+B456" or r["recipe"] == recipe]
        for model in MODELS:
            errors = [number(r[model]) - labels[r["wafer_id"]] for r in subset]
            metrics.append({"recipe": recipe, "model": model, "rows": len(errors),
                            "mae": math.fsum(abs(e) for e in errors) / len(errors) if errors else None,
                            "rmse": math.sqrt(math.fsum(e * e for e in errors) / len(errors)) if errors else None,
                            "mean_signed_error": math.fsum(errors) / len(errors) if errors else None})
    coverage = {recipe: {"planned": sum(r["recipe"] == recipe for r in predictions),
                         "scored": sum(r["recipe"] == recipe for r in eligible)} for recipe in ("A456", "B456")}
    report = {"status": "SCORED_DECLARED_PROSPECTIVE_COHORT" if all(v["scored"] for v in coverage.values()) else "INSUFFICIENT_HISTORY_COVERAGE",
              "completed_at": now_utc().isoformat(), "primary_model": "Ridge", "primary_metric": "MAE",
              "coverage": coverage, "excluded_no_history": len(predictions) - len(eligible), "metrics": metrics,
              "independence_basis": "collector attestation plus future timestamp and known-ID/group checks",
              "collection_id": protocol["plan"]["collection_id"], "acquisition_evidence": protocol["plan"]["acquisition_evidence"],
              "target_scale_evidence": protocol["plan"]["target_scale_evidence"], "artifact_sha256": protocol["artifact_sha256"],
              "prediction_seal_sha256": sha256(run / "prediction_seal.json"), "fit_count": 0,
              "production_model": False, "physical_unit": "UNIT_UNVERIFIED",
              "limitations": ["identity/timestamp checks do not prove collector claims", "no pressure correction or polishing-time validation",
                              "no iid confidence interval; sequential wafer observations may be correlated"]}
    write_json(run / "metrics.json", report)
    write_json(run / "completion.json", {"status": report["status"], "metrics_sha256": sha256(run / "metrics.json"), "score_count": 1})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    frozen = sub.add_parser("freeze")
    for flag in ("artifact", "sha256", "registry", "plan", "output"):
        frozen.add_argument("--" + flag, required=True)
    for command in ("predict", "score"):
        command_parser = sub.add_parser(command)
        for flag in ("run", "schedule", "measurements"):
            command_parser.add_argument("--" + flag, required=True)
    args = parser.parse_args()
    try:
        if args.command == "freeze":
            result = freeze(args.artifact, args.sha256, args.registry, args.plan, args.output)
            print(json.dumps({"status": "PROTOCOL_FROZEN_AWAITING_COLLECTION", "model_version": result["model_version"]}))
        elif args.command == "predict":
            result = predict(args.run, args.schedule, args.measurements)
            print(json.dumps({"status": "PREDICTIONS_SEALED", "planned_rows": len(result)}))
        else:
            result = score(args.run, args.schedule, args.measurements)
            print(json.dumps({"status": result["status"], "metrics_file": str(Path(args.run) / "metrics.json")}))
    except (ValidationError, ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(2, "validation refused: " + str(error) + "\n")


if __name__ == "__main__":
    main()
