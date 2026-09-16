"""Exploratory nested group evaluation restricted to the original Stage B TRAIN.

The v1 holdout is already public within this project. This is a development-data
stability diagnostic, not a new independent test or a replacement v1 selection.
"""
from __future__ import annotations

import importlib.metadata
import platform
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import GroupKFold
from threadpoolctl import threadpool_limits

from .common import SEED, TARGET, read_json, sha256, utcnow, write_json
from .data import assert_split_integrity
from .experiment import boosting_candidates, load_run, metrics, model_candidates
from .models import FeaturePreprocessor, ModelBundle, PrestonInspired

OUTER_FOLDS = 5
INNER_FOLDS = 3
RESIDUAL_FOLDS = 3
PHYSICS_REGULARIZATION = 1.0
FAMILIES = ("StageMean", "PrestonInspired", "RandomForest", "XGBoost", "CatBoost",
            "LightGBM", "Physics+CatBoost", "Physics+LightGBM")


def development_data(data):
    """Filter before any target statistics or fitted preprocessing."""
    assert_split_integrity(data[["sample_id", "WAFER_ID", "STAGE", "group_id", "source_files", "split"]])
    frame = data.loc[data.split.eq("train") & data.STAGE.eq("B")].copy()
    if frame.empty or frame.group_id.nunique() < OUTER_FOLDS:
        raise ValueError("Stage B TRAIN needs at least five independent components")
    return frame.sort_values("sample_id").reset_index(drop=True)


def grouped_folds(frame, count):
    """Sample-balanced, deterministic GroupKFold; no targets passed to splitter."""
    if frame.group_id.nunique() < count:
        raise ValueError("Too few independent groups")
    splitter = GroupKFold(n_splits=count)
    return list(splitter.split(np.zeros((len(frame), 1)), groups=frame.group_id))


def check_partition(fit, held, context):
    """Check actual wafer and file lineage, rather than trusting group names."""
    columns = ["sample_id", "WAFER_ID", "STAGE", "group_id", "source_files"]
    combined = pd.concat([fit[columns].assign(split="fit"), held[columns].assign(split="held")])
    assert_split_integrity(combined)
    if not fit.split.eq("train").all() or not held.split.eq("train").all():
        raise ValueError("Nested evaluation may only use the original TRAIN split")
    if not fit.STAGE.eq("B").all() or not held.STAGE.eq("B").all():
        raise ValueError("Nested evaluation may only use Stage B")
    return {"context": context, "fit_n": len(fit), "held_n": len(held),
            "fit_groups": sorted(fit.group_id.unique().tolist()),
            "held_groups": sorted(held.group_id.unique().tolist())}


def candidates(threads):
    specs = [{"model": "StageMean", "kind": "constant", "config": {}, "estimator": None},
             {"model": "PrestonInspired", "kind": "physics", "estimator": None,
              "config": {"regularization": PHYSICS_REGULARIZATION}}]
    for name, config, estimator, _ in model_candidates(threads):
        if name in {"RandomForest", "XGBoost", "CatBoost", "LightGBM"}:
            specs.append({"model": name, "kind": "tabular", "config": config, "estimator": estimator})
    for name, config, estimator, _ in boosting_candidates(threads):
        specs.append({"model": "Physics+" + name, "kind": "hybrid", "estimator": estimator,
                      "config": {**config, "physics_regularization": PHYSICS_REGULARIZATION}})
    for i, spec in enumerate(specs):
        spec["candidate_id"] = f"c{i:02d}"
    return specs


def fit_candidates(frame, specs, threads, context, audit):
    """All preprocessing and residual cross-fitting are local to this partition."""
    pre = FeaturePreprocessor().fit(frame)
    x = pre.transform(frame)
    y = frame[TARGET].to_numpy(float)
    physics = PrestonInspired(PHYSICS_REGULARIZATION).fit(frame, y)
    residual = None
    if any(s["kind"] == "hybrid" for s in specs):
        oof = np.full(len(frame), np.nan)
        for fold, (fi, hi) in enumerate(grouped_folds(frame, RESIDUAL_FOLDS)):
            fit, held = frame.iloc[fi], frame.iloc[hi]
            audit.append(check_partition(fit, held, f"{context}/residual{fold}"))
            local = PrestonInspired(PHYSICS_REGULARIZATION).fit(fit, fit[TARGET])
            oof[hi] = local.predict(held)
        if not np.isfinite(oof).all():
            raise ValueError("Incomplete cross-fitted physics predictions")
        residual = y - oof
    chambers = tuple(sorted({c for route in frame.chamber_route for c in route.split("-")}))
    for spec in specs:
        started = time.perf_counter()
        kind = spec["kind"]
        bundle = ModelBundle(spec["model"], "B", kind, train_chambers=chambers)
        caught_messages = []
        if kind == "constant":
            bundle.constant = float(y.mean())
        elif kind == "physics":
            bundle.physics = physics
        else:
            estimator = clone(spec["estimator"])
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                estimator.fit(x, residual if kind == "hybrid" else y)
            caught_messages = sorted({str(w.message) for w in caught})
            bundle.estimator, bundle.preprocessor = estimator, pre
            if kind == "hybrid":
                bundle.physics = physics
        yield spec, bundle, time.perf_counter() - started, caught_messages


def choose_candidates(trials):
    """Pool held-out inner samples; never consult the outer predictions."""
    rows = []
    for (model, cid), group in trials.groupby(["model", "candidate_id"], sort=True):
        n = int(group.n.sum())
        rows.append({"model": model, "candidate_id": cid, "inner_n": n,
                     "inner_mae": float(np.average(group.mae, weights=group.n)),
                     "inner_rmse": float(np.sqrt(np.average(group.rmse ** 2, weights=group.n)))})
    table = pd.DataFrame(rows).sort_values(["inner_mae", "inner_rmse", "candidate_id"], kind="stable")
    best = table.drop_duplicates("model", keep="first")
    return best, str(best.iloc[0].candidate_id)


def summarize_predictions(predictions):
    """Per-family outer OOF scores plus the honest inner-selected procedure."""
    frames = [(name, group) for name, group in predictions.groupby("model")]
    frames.append(("InnerSelected", predictions[predictions.selected_by_inner]))
    summary, groups, folds = [], [], []
    for name, rows in frames:
        if rows.sample_id.duplicated().any():
            raise ValueError(f"Duplicate OOF predictions for {name}")
        gm = []
        for gid, part in rows.groupby("group_id"):
            score = metrics(part.y_true, part.y_pred)
            groups.append({"model": name, "group_id": gid, **score})
            gm.append(score["mae"])
        fm = []
        for fold, part in rows.groupby("outer_fold"):
            score = metrics(part.y_true, part.y_pred)
            folds.append({"model": name, "outer_fold": int(fold), **score})
            fm.append(score["mae"])
        summary.append({"model": name, **metrics(rows.y_true, rows.y_pred),
                        "groups": len(gm), "macro_group_mae": float(np.mean(gm)),
                        "worst_group_mae": float(np.max(gm)),
                        "fold_mae_min": float(np.min(fm)), "fold_mae_max": float(np.max(fm)),
                        "fold_mae_std": float(np.std(fm, ddof=1))})
    return pd.DataFrame(summary), pd.DataFrame(groups), pd.DataFrame(folds)


def run_stability(source_run: Path, output_dir: Path, threads=4):
    if output_dir.exists() and any(output_dir.iterdir()):
        raise FileExistsError("Stability output must be new; existing diagnostics cannot be overwritten")
    output_dir.mkdir(parents=True, exist_ok=True)
    models_dir = output_dir / "models"
    models_dir.mkdir()
    data, source_audit = load_run(source_run)
    frame = development_data(data)
    del data
    specs = candidates(threads)
    by_id = {s["candidate_id"]: s for s in specs}
    outer_folds = grouped_folds(frame, OUTER_FOLDS)
    manifest = frame[["sample_id", "WAFER_ID", "STAGE", "split", "group_id", "source_files", "chamber_route"]].copy()
    manifest["outer_fold"] = -1
    for fold, (_, hi) in enumerate(outer_folds):
        manifest.loc[hi, "outer_fold"] = fold
    manifest.to_csv(output_dir / "outer_manifest.csv", index=False)
    # Record every existing v1 artifact (not just the models) before starting.
    source_hashes = {p.relative_to(source_run).as_posix(): sha256(p)
                     for p in sorted(source_run.rglob("*")) if p.is_file()}
    protocol = {"started_at": utcnow(), "seed": SEED, "threads": threads,
                "stage": "B", "allowed_source_split": "train", "samples": len(frame),
                "groups": int(frame.group_id.nunique()), "source_features_sha256": source_audit["features_sha256"],
                "source_split_sha256": source_audit["split_sha256"], "source_run_name": source_run.name,
                "source_artifact_hashes": source_hashes,
                "outer_folds": OUTER_FOLDS, "inner_folds": INNER_FOLDS, "residual_folds": RESIDUAL_FOLDS,
                "fold_method": "Deterministic sample-balanced GroupKFold, shuffle=False; no targets supplied.",
                "selection_rule": "Pooled inner OOF MAE, then RMSE, then fixed candidate ID. No outer-result selection.",
                "families": list(FAMILIES), "candidates": [{k: v for k, v in s.items() if k != "estimator"} for s in specs],
                "physics_policy": "Fixed regularization=1.0. Three-fold group OOF residuals local to each fitting partition.",
                "scope": "Exploratory stability assessment after v1 results were known. Not a fresh independent test.",
                "excluded": "All v1 Validation, Calibration, Test samples and all Stage A samples are excluded from fitting and scoring.",
                "promotion_policy": "Retain v1 selections. Outer fold checkpoints are diagnostics, not deployment models.",
                "interval_policy": "No interval calibration or claimed coverage; original Calibration is unused.",
                "python": platform.python_version(),
                "packages": {n: importlib.metadata.version(n) for n in ["numpy", "pandas", "scipy", "scikit-learn", "catboost", "xgboost", "lightgbm", "joblib"]},
                "source_hashes": {p.name: sha256(p) for p in sorted(Path(__file__).parent.glob("*.py"))},
                "outer_manifest_sha256": sha256(output_dir / "outer_manifest.csv")}
    write_json(output_dir / "protocol.json", protocol)
    started = time.perf_counter()
    all_trials, all_predictions, partition_audit, selection_rows = [], [], [], []
    inner_manifests = []
    with threadpool_limits(limits=threads):
        for fold, (fi, hi) in enumerate(outer_folds):
            outer_fit, outer_held = frame.iloc[fi], frame.iloc[hi]
            partition_audit.append(check_partition(outer_fit, outer_held, f"outer{fold}"))
            print(f"Outer {fold + 1}/{OUTER_FOLDS}: fit={len(outer_fit)}, held={len(outer_held)}", flush=True)
            local_trials = []
            for inner, (ii, ji) in enumerate(grouped_folds(outer_fit, INNER_FOLDS)):
                fit, held = outer_fit.iloc[ii], outer_fit.iloc[ji]
                context = f"outer{fold}/inner{inner}"
                partition_audit.append(check_partition(fit, held, context))
                inner_manifests.append(held[["sample_id", "group_id"]].assign(outer_fold=fold, inner_fold=inner))
                for spec, bundle, elapsed, messages in fit_candidates(fit, specs, threads, context, partition_audit):
                    row = {"outer_fold": fold, "inner_fold": inner, "model": spec["model"],
                           "candidate_id": spec["candidate_id"], **metrics(held[TARGET], bundle.predict(held)),
                           "estimator_fit_seconds": elapsed, "warnings": messages}
                    local_trials.append(row)
                print(f"  inner {inner + 1}/{INNER_FOLDS}: {len(specs)} candidates complete", flush=True)
            best, selected_id = choose_candidates(pd.DataFrame(local_trials))
            # Freeze every family configuration and overall selection before outer outcomes.
            frozen = {"outer_fold": fold, "frozen_at": utcnow(), "selected_candidate_id": selected_id,
                      "selected_model": by_id[selected_id]["model"], "families": best.to_dict(orient="records")}
            write_json(output_dir / f"selection_outer{fold}.json", frozen)
            selection_rows.append(frozen)
            all_trials.extend(local_trials)
            chosen_specs = [by_id[cid] for cid in best.candidate_id]
            for spec, bundle, elapsed, messages in fit_candidates(outer_fit, chosen_specs, threads, f"outer{fold}", partition_audit):
                pred = bundle.predict(outer_held)
                selected = spec["candidate_id"] == selected_id
                all_predictions.append(pd.DataFrame({"sample_id": outer_held.sample_id.to_numpy(),
                    "group_id": outer_held.group_id.to_numpy(), "chamber_route": outer_held.chamber_route.to_numpy(),
                    "outer_fold": fold, "model": spec["model"], "candidate_id": spec["candidate_id"],
                    "selected_by_inner": selected, "y_true": outer_held[TARGET].to_numpy(), "y_pred": pred}))
                if selected:
                    joblib.dump(bundle, models_dir / f"outer{fold}_selected.joblib", compress=3)
            pd.concat(all_predictions, ignore_index=True).to_csv(output_dir / "outer_predictions.csv", index=False)
            write_json(output_dir / "inner_trials.json", all_trials)
            write_json(output_dir / "partition_audit.json", partition_audit)
            print(f"Outer {fold + 1} complete; inner-selected family: {frozen['selected_model']}", flush=True)
    predictions = pd.concat(all_predictions, ignore_index=True)
    summary, group_scores, fold_scores = summarize_predictions(predictions)
    summary.to_csv(output_dir / "summary.csv", index=False)
    group_scores.to_csv(output_dir / "group_metrics.csv", index=False)
    fold_scores.to_csv(output_dir / "fold_metrics.csv", index=False)
    pd.concat(inner_manifests, ignore_index=True).to_csv(output_dir / "inner_manifest.csv", index=False)
    checks = []
    with threadpool_limits(limits=threads):
        for fold, (_, hi) in enumerate(outer_folds):
            bundle = joblib.load(models_dir / f"outer{fold}_selected.joblib")
            held = frame.iloc[hi]
            expected = predictions[predictions.outer_fold.eq(fold) & predictions.selected_by_inner].set_index("sample_id")
            difference = float(np.max(np.abs(bundle.predict(held) - expected.loc[held.sample_id, "y_pred"].to_numpy())))
            if difference > 1e-10:
                raise AssertionError("Saved nested model failed prediction reproduction")
            checks.append({"outer_fold": fold, "model": bundle.name, "max_prediction_difference": difference})
    for name, digest in source_hashes.items():
        if sha256(source_run / name) != digest:
            raise ValueError(f"Original v1 artifact changed during nested evaluation: {name}")
    for name, rows in predictions.groupby("model"):
        if set(rows.sample_id) != set(frame.sample_id) or rows.sample_id.duplicated().any():
            raise ValueError(f"Incomplete OOF coverage: {name}")
    result = {"status": "complete", "completed_at": utcnow(), "elapsed_seconds": time.perf_counter() - started,
              "inner_candidate_fits": len(all_trials), "outer_family_fits": len(FAMILIES) * OUTER_FOLDS,
              "source_artifacts_unchanged": True, "all_partitions_wafer_file_group_disjoint": True,
              "all_families_oof_coverage_complete": True, "saved_selected_models": checks,
              "protocol_sha256": sha256(output_dir / "protocol.json"),
              "artifact_hashes": {p.relative_to(output_dir).as_posix(): sha256(p)
                                  for p in sorted(output_dir.rglob("*")) if p.is_file()}}
    write_json(output_dir / "completion.json", result)
    print(summary[["model", "mae", "rmse", "r2", "macro_group_mae", "fold_mae_min", "fold_mae_max"]].to_string(index=False), flush=True)
    print(f"Nested stability assessment complete in {result['elapsed_seconds']:.1f}s; v1 unchanged.", flush=True)
