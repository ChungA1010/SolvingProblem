"""Immutable experiment driver for train-only nested P2 improvements."""
from __future__ import annotations

import argparse
from importlib.metadata import version
from pathlib import Path
import platform

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import TARGET, read_json, sha256, utcnow, write_json
from .improvement_models import POLICIES, PROCEDURES, SEED, VIEWS, fit_condition, grid
from .paper_benchmark import ROOT, log
from .reconstruction import GZIP, metrics, read_frame
from .reconstruction_models import fit_p2_variant

SOURCE = ROOT / "runs/phm_cmp_reconstruction_v2"
CONDITIONS = ("Cond1", "Cond2", "Cond3")
SOURCE_NAMES = ("common.py", "baselines.py", "paper_models.py", "paper_features.py", "paper_benchmark.py",
                "reconstruction.py", "reconstruction_models.py", "reconstruction_features.py",
                "improvement_models.py", "improvement.py")


def hashes():
    return {n: sha256(Path(__file__).parent / n) for n in SOURCE_NAMES}


def partition_rows(frame):
    rows = []
    for fold, (a, b) in enumerate(GroupKFold(5, shuffle=True, random_state=SEED).split(frame, groups=frame.group_id)):
        for role, index in (("train", a), ("evaluation", b)):
            rows += [{"partition": f"outer_{fold}", "role": role, "sample_id": sid} for sid in frame.iloc[index].sample_id]
    cutoff = float(frame.start.quantile(.8))
    groups = frame.groupby("group_id").agg(start=("start", "min"), end=("end", "max"))
    past, future = set(groups.index[groups.end < cutoff]), set(groups.index[groups.start >= cutoff])
    for row in frame.itertuples():
        role = "train" if row.group_id in past else "evaluation" if row.group_id in future else "embargo"
        rows.append({"partition": "temporal", "role": role, "sample_id": row.sample_id})
    return pd.DataFrame(rows), cutoff


def audit_partition(fit, query, temporal=False):
    if set(fit.sample_id) & set(query.sample_id) or set(fit.WAFER_ID) & set(query.WAFER_ID) or set(fit.group_id) & set(query.group_id):
        raise ValueError("Overlapping group/wafer partition")
    if temporal and not fit.end.max() < query.start.min():
        raise ValueError("Non-causal temporal partition")
    return {"train_n": len(fit), "evaluation_n": len(query), "train_groups": int(fit.group_id.nunique()),
            "evaluation_groups": int(query.group_id.nunique()), "overlapping_wafers": 0,
            "overlapping_groups": 0, "max_training_end": float(fit.end.max()), "min_evaluation_start": float(query.start.min())}


def prepare(run):
    if run.exists():
        raise FileExistsError("Use a new experiment directory")
    previous = read_json(SOURCE / "protocol.json")
    source_cache = ROOT / previous["cache_relative"]
    for name, digest in previous["cache_hashes"].items():
        if name in ("development.csv.gz", "test_inputs.csv.gz", "test_truth.csv"):
            check_hash(source_cache / name, digest)
    frame = read_frame(source_cache / "development.csv.gz")
    train = frame[frame.cohort.eq("training") & ~frame.excluded_extreme].reset_index(drop=True)
    if len(train) != 1977 or not train.sample_id.is_unique:
        raise ValueError("Unexpected official training cohort")
    cache = ROOT / ".cache/improvement" / run.name
    cache.mkdir(parents=True, exist_ok=False)
    train.to_csv(cache / "train.csv.gz", index=False, compression=GZIP)
    run.mkdir(parents=True)
    train[["sample_id", "WAFER_ID", "STAGE", "condition", "group_id", "start", "end"]].to_csv(run / "manifest.csv", index=False)
    partitions, cutoff = partition_rows(train)
    partitions.to_csv(run / "partitions.csv", index=False)
    audits = {}
    for part, block in partitions.groupby("partition"):
        fit = train[train.sample_id.isin(block.loc[block.role.eq("train"), "sample_id"])]
        query = train[train.sample_id.isin(block.loc[block.role.eq("evaluation"), "sample_id"])]
        audits[part] = audit_partition(fit, query, part == "temporal")
        if min(fit.groupby("condition").group_id.nunique()) < 4 or set(query.condition) != set(CONDITIONS):
            raise ValueError("Insufficient condition groups")
    write_json(run / "partition_audit.json", audits)
    (run / "PROTOCOL.md").write_bytes((ROOT / "docs/p2-improvement-v1.md").read_bytes())
    old_runs = ("phm_cmp_papers_v1", "phm_cmp_reconstruction_v2", "phm_cmp_baselines_v1", "phm_cmp_v1")
    preserved = {p.relative_to(ROOT).as_posix(): sha256(p) for name in old_runs for p in (ROOT / "runs" / name).rglob("*")
                 if p.is_file() and p.suffix != ".log" and p.name != "features.csv.gz"}
    for name in hashes():
        path = run / "code_snapshot" / name
        path.parent.mkdir(exist_ok=True)
        path.write_bytes((Path(__file__).parent / name).read_bytes())
    write_json(run / "protocol.json", {"frozen_at": utcnow(), "seed": SEED, "policies": POLICIES,
        "views": VIEWS, "procedures": PROCEDURES, "grid": grid(), "outer_folds": 5, "inner_folds": 3,
        "group_column": "group_id", "temporal_cutoff": cutoff, "source_run": SOURCE.relative_to(ROOT).as_posix(),
        "source_cache": source_cache.relative_to(ROOT).as_posix(), "source_cache_hashes": previous["cache_hashes"],
        "cache": cache.relative_to(ROOT).as_posix(), "train_sha256": sha256(cache / "train.csv.gz"),
        "code_sha256": hashes(), "frozen_files": {n: sha256(run / n) for n in ("PROTOCOL.md", "manifest.csv", "partitions.csv", "partition_audit.json")},
        "preserved_files": preserved, "status": "proposed_model_development_not_exact_paper_reproduction",
        "test_exposure": "All official Validation/Test have been inspected in earlier experiments. Only official Train enters nested selection. No fresh independent data available."})
    write_json(run / "environment.json", {"python": platform.python_version(), "packages": {n: version(n) for n in ("numpy", "pandas", "scipy", "scikit-learn", "joblib")}})
    log(f"Frozen 1977 training samples, {len(grid())} settings x 4 views x 2 history policies")


def context(run):
    protocol = read_json(run / "protocol.json")
    if hashes() != protocol["code_sha256"]:
        raise ValueError("Frozen training code changed")
    for name, digest in protocol["frozen_files"].items():
        check_hash(run / name, digest)
    cache = ROOT / protocol["cache"]
    check_hash(cache / "train.csv.gz", protocol["train_sha256"])
    return protocol, cache


def checkpoint(cache, key, factory):
    path, record = cache / f"{key}.joblib", cache / f"{key}.json"
    if record.exists():
        check_hash(path, read_json(record)["sha256"])
        return joblib.load(path)
    value = factory()
    joblib.dump(value, path, compress=3)
    write_json(record, {"sha256": sha256(path), "completed_at": utcnow()})
    return value


def prediction_rows(query, predictions, partition, policy):
    blocks = []
    for model, values in predictions.items():
        block = query[["sample_id", "WAFER_ID", "STAGE", "condition", "group_id", "start", "end"]].copy()
        if TARGET in query:
            block["truth"] = query[TARGET]
        block["partition"], block["policy"], block["model"], block["prediction"] = partition, policy, model, values
        blocks.append(block)
    return pd.concat(blocks, ignore_index=True)


def history_audit(history, query):
    indices, _ = history.referenced_indices(query)
    ref = history.library
    bad_wafer = bad_time = total = 0
    for i, row in enumerate(query.itertuples()):
        idx = indices[i][indices[i] >= 0]
        total += len(idx)
        bad_wafer += int(ref.iloc[idx].WAFER_ID.eq(row.WAFER_ID).sum())
        bad_time += int(ref.iloc[idx].end.ge(row.start).sum())
    if bad_wafer or (history.policy == "completed" and bad_time):
        raise ValueError("Invalid label history")
    return {"queries": len(query), "references": total, "same_wafer_references": bad_wafer,
            "not_completed_at_query_start": bad_time, "queries_without_lag": int((indices[:, 0] < 0).sum()),
            "queries_without_neighbors": int((indices[:, 11] < 0).sum())}


def train(run):
    if (run / "training_complete.json").exists():
        raise FileExistsError("Completed run is immutable")
    protocol, cache = context(run)
    frame = read_frame(cache / "train.csv.gz")
    if not frame.cohort.eq("training").all():
        raise ValueError("Nontraining labels entered selection")
    parts = pd.read_csv(run / "partitions.csv")
    all_predictions, selections, histories, final_models = [], {}, {}, []
    incumbent_spec = read_json(SOURCE / "selection.json")["choices"]["p2"]["spec"]
    for partition in [f"outer_{f}" for f in range(5)] + ["temporal", "final"]:
        if partition == "final":
            fit, query = frame, None
        else:
            block = parts[parts.partition.eq(partition)]
            fit = frame[frame.sample_id.isin(block.loc[block.role.eq("train"), "sample_id"])]
            query = frame[frame.sample_id.isin(block.loc[block.role.eq("evaluation"), "sample_id"])]
        for policy in POLICIES:
            for condition in CONDITIONS:
                key = f"{partition}_{policy}_{condition}"
                subset = fit[fit.condition.eq(condition)].reset_index(drop=True)
                log(f"Fitting {key}: {len(subset)} training samples")
                bundle, detail, inner = checkpoint(cache, key, lambda: fit_condition(subset, policy, SEED, lambda msg: log(f"{key}: {msg}")))
                path = run / "selection_details" / f"{key}.json"
                write_json(path, detail)
                inner.to_csv(path.with_suffix(".csv.gz"), index=False, compression=GZIP)
                selections[key] = detail["recipes"]
                if query is not None:
                    q = query[query.condition.eq(condition)]
                    values = bundle.predict_all(q.drop(columns=[TARGET]))
                    all_predictions.append(prediction_rows(q, values, partition, policy))
                    histories[key] = history_audit(bundle.history, q.drop(columns=[TARGET]))
                else:
                    path = run / "models" / f"{policy}_{condition}.joblib"
                    path.parent.mkdir(exist_ok=True)
                    joblib.dump(bundle, path, compress=3)
                    final_models.append({"file": path.relative_to(run).as_posix(), "sha256": sha256(path), "policy": policy, "condition": condition})
        if query is not None:
            # Refit the actual incumbent's published 20-MC-CV recipe on the same outer training data.
            for condition in CONDITIONS:
                key = f"{partition}_incumbent_{condition}"
                subset = fit[fit.condition.eq(condition)].reset_index(drop=True)
                log(f"Fitting exact v2 recipe {key}")
                original, cv, votes = checkpoint(cache, key,
                    lambda: fit_p2_variant(subset, 20260917, incumbent_spec,
                        lambda n: log(f"{key}: CV {n}/20") if n % 10 == 0 else None))
                q = query[query.condition.eq(condition)]
                values = original.predict_all(q.drop(columns=[TARGET]))["P2_Integrated"]
                all_predictions.append(prediction_rows(q, {"incumbent_refit": values}, partition, "retrospective"))
                pd.DataFrame(cv).to_csv(run / "selection_details" / f"{key}_cv.csv", index=False)
    # Choices and trained models are frozen before any current-run official Validation/Test read.
    write_json(run / "selection.json", {"selected_at": utcnow(), "selections": selections,
        "rule": "Within each training partition/condition only: minimize inner OOF MSE; tie candidate id. Both history policies retained; no test-based choice."})
    predictions = pd.concat(all_predictions, ignore_index=True)
    predictions.to_csv(run / "development_predictions.csv.gz", index=False, compression=GZIP)
    write_json(run / "history_audit.json", histories)
    write_json(run / "training_complete.json", {"completed_at": utcnow(), "models": final_models,
        "selection_sha256": sha256(run / "selection.json"), "development_predictions_sha256": sha256(run / "development_predictions.csv.gz"),
        "history_audit_sha256": sha256(run / "history_audit.json"),
        "details_sha256": {p.relative_to(run).as_posix(): sha256(p) for p in (run / "selection_details").iterdir()}})
    log("All nested, temporal and final fits completed; final choices sealed")


def metric_rows(pred):
    rows = []
    pred = pred.copy()
    pred["evaluation"] = pred.partition.where(~pred.partition.str.startswith("outer_"), "nested_oof")
    for (evaluation, policy, model), block in pred.groupby(["evaluation", "policy", "model"]):
        for dimension, values in (("all", ["all"]), ("STAGE", ["A", "B"]), ("condition", CONDITIONS)):
            for value in values:
                part = block if dimension == "all" else block[block[dimension].eq(value)]
                if len(part):
                    rows.append({"evaluation": evaluation, "policy": policy, "model": model,
                        "dimension": dimension, "value": value, **metrics(part.truth, part.prediction)})
    return pd.DataFrame(rows)


def evaluate(run):
    if (run / "completion.json").exists():
        raise FileExistsError("Completed evaluation is immutable")
    protocol, cache = context(run)
    trained = read_json(run / "training_complete.json")
    check_hash(run / "selection.json", trained["selection_sha256"])
    check_hash(run / "development_predictions.csv.gz", trained["development_predictions_sha256"])
    source_cache = ROOT / protocol["source_cache"]
    check_hash(source_cache / "development.csv.gz", protocol["source_cache_hashes"]["development.csv.gz"])
    dev = read_frame(source_cache / "development.csv.gz")
    validation = dev[dev.cohort.eq("validation")].drop(columns=[TARGET])
    check_hash(source_cache / "test_inputs.csv.gz", protocol["source_cache_hashes"]["test_inputs.csv.gz"])
    test = read_frame(source_cache / "test_inputs.csv.gz")
    outputs, audit, reload_diffs = [], {}, {}
    for record in trained["models"]:
        path = run / record["file"]
        check_hash(path, record["sha256"])
        bundle = joblib.load(path)
        original = joblib.load(cache / f"final_{record['policy']}_{record['condition']}.joblib")[0]
        for split, frame in (("validation", validation), ("test", test)):
            q = frame[frame.condition.eq(record["condition"])]
            p = bundle.predict_all(q)
            expected = original.predict_all(q)
            diff = max(float(np.max(np.abs(p[k] - expected[k]))) for k in p)
            if diff > 1e-9:
                raise ValueError("Reloaded model changed predictions")
            key = f"{split}_{record['policy']}_{record['condition']}"
            reload_diffs[key] = diff
            audit[key] = history_audit(bundle.history, q)
            outputs.append(prediction_rows(q, p, split, record["policy"]))
    prior = read_json(SOURCE / "training_complete.json")
    for record in prior["models"]:
        if not record["file"].startswith("P2_"):
            continue
        path = SOURCE / "models" / record["file"]
        check_hash(path, record["sha256"])
        bundle = joblib.load(path)
        condition = bundle.history.library.condition.iloc[0]
        for split, frame in (("validation", validation), ("test", test)):
            q = frame[frame.condition.eq(condition)]
            values = bundle.predict_all(q)["P2_Integrated"]
            outputs.append(prediction_rows(q, {"incumbent_refit": values}, split, "retrospective"))
    predictions = pd.concat(outputs, ignore_index=True)
    predictions.to_csv(run / "reference_predictions.csv.gz", index=False, compression=GZIP)
    write_json(run / "evaluation_seal.json", {"sealed_at": utcnow(), "selection_sha256": sha256(run / "selection.json"),
        "models": trained["models"], "predictions_sha256": sha256(run / "reference_predictions.csv.gz")})
    # Prediction seal precedes test truth access.
    check_hash(source_cache / "test_truth.csv", protocol["source_cache_hashes"]["test_truth.csv"])
    truth = pd.concat([dev.loc[dev.cohort.eq("validation"), ["sample_id", TARGET]], pd.read_csv(source_cache / "test_truth.csv", float_precision="round_trip")])
    if not truth.sample_id.is_unique:
        raise ValueError("Ambiguous reference truth")
    scored = predictions.merge(truth.rename(columns={TARGET: "truth"}), on="sample_id", how="left", validate="many_to_one")
    if not np.isfinite(scored.truth).all():
        raise ValueError("Missing evaluation truth")
    scored.to_csv(run / "reference_scored_predictions.csv.gz", index=False, compression=GZIP)
    development = read_frame(run / "development_predictions.csv.gz")
    scores = metric_rows(pd.concat([development, scored], ignore_index=True))
    scores.to_csv(run / "metrics.csv", index=False)
    for path, digest in protocol["preserved_files"].items():
        check_hash(ROOT / path, digest)
    write_json(run / "verification.json", {"verified_at": utcnow(), "reload_max_differences": reload_diffs,
        "reference_history_audit": audit, "preserved_files_checked": len(protocol["preserved_files"]), "preserved_files_unchanged": True})
    write_json(run / "completion.json", {"completed_at": utcnow(), "selection_sha256": sha256(run / "selection.json"),
        "metrics_sha256": sha256(run / "metrics.csv"), "reference_scored_predictions_sha256": sha256(run / "reference_scored_predictions.csv.gz"),
        "training_complete_sha256": sha256(run / "training_complete.json"), "evaluation_seal_sha256": sha256(run / "evaluation_seal.json"),
        "verification_sha256": sha256(run / "verification.json"), "status": "complete_development_experiment_no_fresh_test_no_deployment"})
    log("Evaluation complete; original runs preserved")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("prepare", "train", "evaluate"))
    parser.add_argument("--run-dir", type=Path, default=ROOT / "runs/phm_cmp_improvement_v1")
    args = parser.parse_args()
    with threadpool_limits(limits=4):
        globals()[args.action](args.run_dir.resolve())


if __name__ == "__main__":
    main()
