"""Frozen input-quality experiments paired with the previous nested P2 evaluation."""
from __future__ import annotations

import argparse
from importlib.metadata import version
from pathlib import Path
import platform

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .baselines import check_hash
from .common import KEYS, TARGET, read_json, sample_id, sha256, utcnow, write_json
from .improvement import (ROOT, CONDITIONS, checkpoint, prediction_rows, history_audit, metric_rows, audit_partition)
from .improvement_models import POLICIES
from .paper_benchmark import log
from .reconstruction import GZIP, read_frame
from .robust_features import extract_robust
from .robust_models import fit_condition, grid, VARIANTS

PREVIOUS = ROOT / "runs/phm_cmp_improvement_v1"
NAMES = ("common.py", "baselines.py", "paper_models.py", "paper_features.py", "paper_benchmark.py", "reconstruction.py",
         "reconstruction_features.py", "reconstruction_models.py", "improvement.py", "improvement_models.py",
         "robust_features.py", "robust_models.py", "robust_experiment.py")


def hashes():
    return {n: sha256(Path(__file__).parent / n) for n in NAMES}


def prepare(run, original_root, external_root):
    if run.exists():
        raise FileExistsError("Use a new experiment directory")
    previous = read_json(PREVIOUS / "protocol.json")
    old_cache = ROOT / previous["cache"]
    check_hash(old_cache / "train.csv.gz", previous["train_sha256"])
    train = read_frame(old_cache / "train.csv.gz")
    source_cache = ROOT / previous["source_cache"]
    check_hash(source_cache / "development.csv.gz", previous["source_cache_hashes"]["development.csv.gz"])
    check_hash(source_cache / "test_inputs.csv.gz", previous["source_cache_hashes"]["test_inputs.csv.gz"])
    # Keep held-out labels out of all transformed feature caches.
    validation = read_frame(source_cache / "development.csv.gz").query("cohort == 'validation'").drop(columns=[TARGET])
    test = read_frame(source_cache / "test_inputs.csv.gz")
    frames = {"training": train, "validation": validation, "test": test}
    cache = ROOT / ".cache/robust" / run.name
    cache.mkdir(parents=True, exist_ok=False)
    run.mkdir(parents=True)
    (run / "PROTOCOL.md").write_bytes((ROOT / "docs/p2-robust-v2.md").read_bytes())
    for name in ("partitions.csv", "manifest.csv", "partition_audit.json"):
        check_hash(PREVIOUS / name, previous["frozen_files"][name])
        (run / name).write_bytes((PREVIOUS / name).read_bytes())
    expected = {(r["cohort"], r["file"]): r["sha256"] for r in read_json(ROOT / "runs/phm_cmp_papers_v1/sources.json")}
    sources, quality = [], []
    for cohort in ("training", "validation", "test"):
        folder = original_root / "CMP-data/training" if cohort == "training" else external_root / cohort
        files = sorted(folder.glob(f"CMP-{cohort}-[0-9]*.csv"))
        if len(files) != 185:
            raise ValueError(f"Expected 185 {cohort} logs")
        raw_parts = []
        for path in files:
            check_hash(path, expected[cohort, path.name])
            raw_parts.append(pd.read_csv(path))
            sources.append({"cohort": cohort, "file": path.name, "sha256": expected[cohort, path.name]})
        raw = pd.concat(raw_parts, ignore_index=True)
        if TARGET in raw:
            raise ValueError("Targets in raw process log")
        records = [{"sample_id": sample_id(w, s), **extract_robust(trace)} for (w, s), trace in raw.groupby(KEYS, sort=True)]
        values = pd.DataFrame(records)
        frame = frames[cohort].merge(values, on="sample_id", how="left", validate="one_to_one")
        if frame.qc_primary_missing.isna().any():
            raise ValueError("Missing feature extraction")
        frame.to_csv(cache / f"{cohort}.csv.gz", index=False, compression=GZIP)
        qc = frame[["sample_id", "WAFER_ID", "STAGE", "condition"] + [c for c in frame if c.startswith("qc_")]].copy()
        qc["cohort"] = cohort
        quality.append(qc)
        log(f"Extracted {cohort}: {len(frame)} samples, no target-guided episode choice")
    pd.concat(quality, ignore_index=True).to_csv(run / "quality.csv", index=False)
    write_json(run / "sources.json", sources)
    preserved = {}
    for folder in ("phm_cmp_papers_v1", "phm_cmp_reconstruction_v2", "phm_cmp_baselines_v1", "phm_cmp_v1", "phm_cmp_improvement_v1"):
        for p in (ROOT / "runs" / folder).rglob("*"):
            if p.is_file() and p.suffix != ".log" and p.name != "features.csv.gz":
                preserved[p.relative_to(ROOT).as_posix()] = sha256(p)
    for n in hashes():
        p = run / "code_snapshot" / n
        p.parent.mkdir(exist_ok=True)
        p.write_bytes((Path(__file__).parent / n).read_bytes())
    write_json(run / "protocol.json", {"frozen_at": utcnow(), "grid": grid(), "variants": VARIANTS,
        "policies": POLICIES, "seed": 20260918, "cache": cache.relative_to(ROOT).as_posix(),
        "cache_sha256": {p.name: sha256(p) for p in cache.glob("*.csv.gz")},
        "source_cache": previous["source_cache"], "source_cache_hashes": previous["source_cache_hashes"],
        "previous_cache": previous["cache"], "previous_run": PREVIOUS.relative_to(ROOT).as_posix(),
        "code_sha256": hashes(), "preserved_files": preserved,
        "frozen_files": {n: sha256(run / n) for n in ("PROTOCOL.md", "partitions.csv", "manifest.csv", "partition_audit.json", "quality.csv", "sources.json")},
        "test_exposure": "Previous official Test and outer-fold outcomes informed these hypotheses. Paired follow-up development, not fresh validation."})
    write_json(run / "environment.json", {"python": platform.python_version(), "packages": {n: version(n) for n in ("numpy", "pandas", "scipy", "scikit-learn", "joblib")}})
    log("Protocol, code, raw-log hashes, transformed inputs and paired partitions frozen")


def context(run):
    p = read_json(run / "protocol.json")
    if hashes() != p["code_sha256"]:
        raise ValueError("Frozen code changed")
    for n, h in p["frozen_files"].items():
        check_hash(run / n, h)
    cache = ROOT / p["cache"]
    for n, h in p["cache_sha256"].items():
        check_hash(cache / n, h)
    return p, cache


def predict_record(bundle, q, partition, policy):
    pred = prediction_rows(q, bundle.predict_all(q.drop(columns=[TARGET], errors="ignore")), partition, policy)
    diagnostics = []
    for name, model in bundle.variants.items():
        _, flag = model.predict(q.drop(columns=[TARGET], errors="ignore"))
        diagnostics += [{"sample_id": sid, "partition": partition, "policy": policy, "variant": name, "fallback": bool(f)}
                        for sid, f in zip(q.sample_id, flag)]
    chosen = [dict(r, variant="selected") for r in diagnostics if r["variant"] == bundle.selected]
    return pred, diagnostics + chosen


def train(run):
    if (run / "training_complete.json").exists():
        raise FileExistsError("Completed training is immutable")
    p, cache = context(run)
    frame = read_frame(cache / "training.csv.gz")
    if not frame.cohort.eq("training").all():
        raise ValueError("Held-out labels in selection")
    partitions = pd.read_csv(run / "partitions.csv")
    outputs, decisions, diagnostics, models = [], {}, [], []
    for partition in [f"outer_{i}" for i in range(5)] + ["temporal", "final"]:
        if partition == "final":
            fit, query = frame, None
        else:
            block = partitions[partitions.partition.eq(partition)]
            fit = frame[frame.sample_id.isin(block.loc[block.role.eq("train"), "sample_id"])]
            query = frame[frame.sample_id.isin(block.loc[block.role.eq("evaluation"), "sample_id"])]
            audit_partition(fit, query, partition == "temporal")
        for policy in POLICIES:
            for condition in CONDITIONS:
                key = f"{partition}_{policy}_{condition}"
                data = fit[fit.condition.eq(condition)].reset_index(drop=True)
                log(f"Fitting {key}: {len(data)} training samples")
                bundle, detail, inner = checkpoint(cache, key,
                    lambda: fit_condition(data, policy, lambda msg: log(f"{key}: {msg}")))
                path = run / "selection_details" / f"{key}.json"
                write_json(path, detail)
                inner.to_csv(path.with_suffix(".csv.gz"), index=False, compression=GZIP)
                decisions[key] = detail
                if query is not None:
                    q = query[query.condition.eq(condition)]
                    pred, diagnostic = predict_record(bundle, q, partition, policy)
                    outputs.append(pred); diagnostics.extend(diagnostic)
                else:
                    path = run / "models" / f"{policy}_{condition}.joblib"
                    path.parent.mkdir(exist_ok=True)
                    joblib.dump(bundle, path, compress=3)
                    models.append({"file": path.relative_to(run).as_posix(), "sha256": sha256(path), "policy": policy, "condition": condition})
    write_json(run / "selection.json", {"selected_at": utcnow(), "decisions": decisions,
        "rule": "Minimum inner OOF MSE among raw/gap/phase guarded; tie ID. Previous Test/outer outcomes are not used within this run."})
    pd.concat(outputs, ignore_index=True).to_csv(run / "development_predictions.csv.gz", index=False, compression=GZIP)
    pd.DataFrame(diagnostics).to_csv(run / "development_fallbacks.csv", index=False)
    write_json(run / "training_complete.json", {"completed_at": utcnow(), "models": models,
        "selection_sha256": sha256(run / "selection.json"), "development_predictions_sha256": sha256(run / "development_predictions.csv.gz"),
        "details_sha256": {f.relative_to(run).as_posix(): sha256(f) for f in (run / "selection_details").iterdir()},
        "development_fallbacks_sha256": sha256(run / "development_fallbacks.csv")})
    log("All paired fits complete; final choices sealed before reference evaluation")


def evaluate(run):
    if (run / "completion.json").exists():
        raise FileExistsError("Completed evaluation is immutable")
    p, cache = context(run)
    trained = read_json(run / "training_complete.json")
    check_hash(run / "selection.json", trained["selection_sha256"])
    frames = {n: read_frame(cache / f"{n}.csv.gz") for n in ("validation", "test")}
    outputs, diagnostics, reload_differences, audits = [], [], {}, {}
    for record in trained["models"]:
        check_hash(run / record["file"], record["sha256"])
        bundle = joblib.load(run / record["file"])
        original = joblib.load(cache / f"final_{record['policy']}_{record['condition']}.joblib")[0]
        for split, frame in frames.items():
            if TARGET in frame:
                raise ValueError("Reference label in model input cache")
            q = frame[frame.condition.eq(record["condition"])]
            predicted, diagnostic = predict_record(bundle, q, split, record["policy"])
            a, b = bundle.predict_all(q), original.predict_all(q)
            difference = max(float(np.max(np.abs(a[k] - b[k]))) for k in a)
            if difference > 1e-9:
                raise ValueError("Reload changed predictions")
            key = f"{split}_{record['policy']}_{record['condition']}"
            reload_differences[key] = difference
            audits[key] = history_audit(bundle.variants[bundle.selected].history, q)
            outputs.append(predicted); diagnostics.extend(diagnostic)
    pred = pd.concat(outputs, ignore_index=True)
    pred.to_csv(run / "reference_predictions.csv.gz", index=False, compression=GZIP)
    pd.DataFrame(diagnostics).to_csv(run / "reference_fallbacks.csv", index=False)
    write_json(run / "evaluation_seal.json", {"sealed_at": utcnow(), "selection_sha256": sha256(run / "selection.json"),
        "models": trained["models"], "predictions_sha256": sha256(run / "reference_predictions.csv.gz")})
    source = ROOT / p["source_cache"]
    for n in ("development.csv.gz", "test_truth.csv"):
        check_hash(source / n, p["source_cache_hashes"][n])
    dev = read_frame(source / "development.csv.gz")
    truth = pd.concat([dev.loc[dev.cohort.eq("validation"), ["sample_id", TARGET]], pd.read_csv(source / "test_truth.csv", float_precision="round_trip")])
    scored = pred.merge(truth.rename(columns={TARGET: "truth"}), on="sample_id", validate="many_to_one", how="left")
    if not np.isfinite(scored.truth).all():
        raise ValueError("Missing reference labels")
    scored.to_csv(run / "reference_scored_predictions.csv.gz", index=False, compression=GZIP)
    old = pd.concat([read_frame(PREVIOUS / n) for n in ("development_predictions.csv.gz", "reference_scored_predictions.csv.gz")], ignore_index=True)
    old = old[old.model.isin(["control", "proposed", "incumbent_refit"])].copy()
    old["model"] = old.model.map({"control": "previous_control", "proposed": "previous_proposed", "incumbent_refit": "paper_v2"})
    old.to_csv(run / "paired_previous_predictions.csv.gz", index=False, compression=GZIP)
    combined = pd.concat([read_frame(run / "development_predictions.csv.gz"), scored, old], ignore_index=True)
    scores = metric_rows(combined)
    scores.to_csv(run / "metrics.csv", index=False)
    for n, h in p["preserved_files"].items():
        check_hash(ROOT / n, h)
    write_json(run / "verification.json", {"verified_at": utcnow(), "reload_max_differences": reload_differences,
        "reference_history_audit": audits, "preserved_files_checked": len(p["preserved_files"]), "preserved_files_unchanged": True})
    write_json(run / "completion.json", {"completed_at": utcnow(), "selection_sha256": sha256(run / "selection.json"),
        "metrics_sha256": sha256(run / "metrics.csv"), "reference_scored_predictions_sha256": sha256(run / "reference_scored_predictions.csv.gz"),
        "training_complete_sha256": sha256(run / "training_complete.json"), "evaluation_seal_sha256": sha256(run / "evaluation_seal.json"),
        "status": "development_complete_no_new_independent_test_no_deployment"})
    log("Evaluation complete; prior baselines and all previous results preserved")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("prepare", "train", "evaluate"))
    parser.add_argument("--run-dir", type=Path, default=ROOT / "runs/phm_cmp_robust_v2")
    parser.add_argument("--original-root", type=Path, default=ROOT.parent / ".tmp_phm_review/PHM/Dataset/CMP1")
    parser.add_argument("--external-root", type=Path, default=ROOT.parent / "cmp-virtual-lab-ml/data/phm2016_external")
    args = parser.parse_args()
    with threadpool_limits(limits=4):
        if args.action == "prepare":
            prepare(args.run_dir.resolve(), args.original_root, args.external_root)
        else:
            globals()[args.action](args.run_dir.resolve())


if __name__ == "__main__":
    main()
