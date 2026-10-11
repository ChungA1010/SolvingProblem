"""Build a known-exposure registry without reading external target values.

Explicit local inputs only. The completed earlier evaluation disqualifies those
partitions as a fresh final test, regardless of their test/validation names.
"""
import argparse
import csv
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.simulator.artifact import load_artifact
from src.validation.independent import identity_hash, sha256, write_json


def read_csv(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def audit(table, prior_run, external_run, artifact, expected_sha256, output):
    output = Path(output)
    if output.exists():
        raise ValueError("audit output already exists")
    model = load_artifact(artifact, expected_sha256=expected_sha256)
    table_sha = sha256(table)
    if table_sha != model.provenance["source_sha256"]:
        raise ValueError("development table differs from the frozen model source")
    prior_run, external_run = Path(prior_run), Path(external_run)
    read_json = lambda path: json.loads(path.read_text(encoding="utf-8-sig"))
    completion = read_json(external_run / "completion.json")
    protocol = read_json(external_run / "protocol.json")
    external_audit = read_json(external_run / "data_audit.json")
    seal = read_json(external_run / "evaluation_seal.json")
    if completion["status"] != "complete" or seal["status"] != "complete" or completion["all_external_values_scored_once"] is not True:
        raise ValueError("expected a completed earlier external evaluation")
    for name in ("protocol.json", "data_audit.json", "external_manifest.csv", "evaluation_seal.json"):
        if sha256(external_run / name) != completion["artifact_hashes"][name]:
            raise ValueError("earlier external evidence changed: " + name)
    if sha256(prior_run / "split_manifest.csv") != protocol["source_artifact_hashes"]["split_manifest.csv"]:
        raise ValueError("earlier development identity manifest changed")
    rows = read_csv(table)
    prior = read_csv(prior_run / "split_manifest.csv")
    external = read_csv(external_run / "external_manifest.csv")
    wafer_ids = {r["wafer_id"] for r in rows} | {r["WAFER_ID"] for r in prior + external}
    groups = set()
    for row in prior + external:
        groups.add(row["group_id"])
        for filename in row["source_files"].split(";"):
            if filename:
                groups.add(filename)
                if not filename.startswith(("prior/", "test/", "validation/")):
                    groups.add("prior/" + filename)
    train = [r for r in rows if int(r["fold"]) < 5 and r["recipe"] in ("A456", "B456")]
    if len(train) != model.provenance["training_rows"]:
        raise ValueError("training reference row count differs from model provenance")
    means = {}
    for recipe in ("A456", "B456"):
        values = [float(r["mrr"]) for r in train if r["recipe"] == recipe]
        if len(values) != model.provenance["training_rows_by_recipe"][recipe]:
            raise ValueError("training recipe counts differ")
        means[recipe] = sum(values) / len(values)
    inputs = {"wafer_table.csv": table_sha,
              "prior/split_manifest.csv": sha256(prior_run / "split_manifest.csv"),
              **{"external/" + name: sha256(external_run / name) for name in
                 ("completion.json", "protocol.json", "data_audit.json", "evaluation_seal.json", "external_manifest.csv")}}
    registry = {"schema": "cmp-exposure-registry-v1", "development_table_sha256": table_sha,
                "source_hashes": inputs, "wafer_sha256": sorted(identity_hash(x) for x in wafer_ids),
                "group_sha256": sorted(identity_hash(x) for x in groups),
                "reference_recipe_means": means, "reference_folds": [1, 2, 3, 4],
                "scope": "all known development and earlier scored external wafers/groups; no target files read"}
    timestamp_overlap = max(external_audit["prior_timestamp_range"][0], external_audit["external_timestamp_range"][0]) <= min(
        external_audit["prior_timestamp_range"][1], external_audit["external_timestamp_range"][1])
    report = {"status": "WAITING_FOR_UNSEEN_DATA", "audited_at": datetime.now(timezone.utc).isoformat(),
              "artifact_sha256": model.artifact_sha256, "model_version": model.model_version,
              "new_fit_count": 0, "new_final_score_count": 0, "independent_final_performance": None,
              "candidates": [
                  {"name": "preprocessed wafer_table / folds 1-5", "rows": len(rows), "eligible_as_fresh_final": False,
                   "reason": "all folds, including fold 5, already used in model development"},
                  {"name": "PHM test", "label_rows_previously_accessed": seal["label_counts"]["test"], "eligible_as_fresh_final": False,
                   "reason": "already evaluated on 26 models during this project", "previously_scored_rows": external_audit["cohorts"]["test"]["eligible"]},
                  {"name": "PHM validation", "label_rows_previously_accessed": seal["label_counts"]["validation"], "eligible_as_fresh_final": False,
                   "reason": "already evaluated on 26 models during this project", "previously_scored_rows": external_audit["cohorts"]["validation"]["eligible"]}],
              "earlier_external_completed_at": completion["completed_at"], "old_and_external_source_times_overlap": timestamp_overlap,
              "known_unique_wafer_ids": len(wafer_ids), "known_group_aliases": len(groups), "source_hashes": inputs,
              "next_required": "new unused collection with observed start/completion timestamps and verified target-scale mapping",
              "limits": ["no exhaustive inventory of all possible private files or unseen remote data",
                         "hash registry cannot detect changed identity aliases; stable source IDs and collector evidence required",
                         "PHM source clock has no verified UTC mapping or measured completion timestamps"]}
    output.mkdir(parents=True)
    write_json(output / "known-data-registry.json", registry)
    write_json(output / "readiness.json", report)
    write_json(output / "candidate-freeze.json", {
        "frozen_at": report["audited_at"], "status": "CANDIDATE_FIXED_COHORT_NOT_YET_DECLARED",
        "artifact_sha256": model.artifact_sha256, "model_version": model.model_version,
        "registry_sha256": sha256(output / "known-data-registry.json"), "primary_model": "Ridge", "primary_metric": "MAE",
        "models": ["Ridge", "Persistence", "EWMA", "Recipe Mean"], "ridge_alpha": 1.0, "ewma_alpha": 0.4,
        "features": ["recipe", "prev_mrr", "state_ewm"], "fit_count": 0,
        "measurement_policy": "observed completion strictly before observed start",
        "target_scale": "PHM raw label scale, factor 1; new-data mapping evidence required",
        "actual_final_test_completed": False, "production_model": False})
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for flag in ("wafer-table", "prior-run", "external-run", "artifact", "sha256", "output"):
        parser.add_argument("--" + flag, required=True)
    args = parser.parse_args()
    result = audit(args.wafer_table, args.prior_run, args.external_run, args.artifact, args.sha256, args.output)
    print(json.dumps({"status": result["status"], "known_unique_wafer_ids": result["known_unique_wafer_ids"],
                      "known_group_aliases": result["known_group_aliases"], "new_final_score_count": 0}))
