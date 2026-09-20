from __future__ import annotations

import importlib.metadata
import math
import platform
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor
from sklearn.compose import TransformedTargetRegressor
from sklearn.cross_decomposition import PLSRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from threadpoolctl import threadpool_limits
from xgboost import XGBRegressor

from .common import SEED, TARGET, read_json, sha256, utcnow, write_json
from .data import assert_split_integrity
from .models import FeaturePreprocessor, ModelBundle, PrestonInspired

# Predeclared sensitivity subset from the earlier raw-data audit. NEVER removed
# from training or primary evaluation; no test-informed threshold or selection.
EXTREME_IDS = {1834206972, 1834206944, 1834206730, 2058207580}


def metrics(y, pred) -> dict:
    y, pred = np.asarray(y), np.asarray(pred)
    return {"n": len(y), "mae": float(mean_absolute_error(y, pred)),
            "rmse": float(np.sqrt(mean_squared_error(y, pred))),
            "r2": float(r2_score(y, pred)) if len(y) > 1 and np.var(y) > 0 else None,
            "negative_predictions": int((pred < -1e-8).sum())}


def conformal_radius(y, pred, alpha=0.10, minimum=80):
    errors = np.sort(np.abs(np.asarray(y) - np.asarray(pred)))
    n = len(errors)
    k = math.ceil((n + 1) * (1 - alpha))
    return float(errors[k - 1]) if n >= minimum and k <= n else None


def load_run(run_dir: Path):
    audit = read_json(run_dir / "data_audit.json")
    if sha256(run_dir / "features.csv.gz") != audit["features_sha256"]:
        raise ValueError("Feature data changed since preparation")
    if sha256(run_dir / "split_manifest.csv") != audit["split_sha256"]:
        raise ValueError("Frozen split manifest changed")
    data = pd.read_csv(run_dir / "features.csv.gz")
    assert_split_integrity(data)
    return data, audit


def model_candidates(threads=4):
    """Small predeclared search; each family selects on Validation MAE, then RMSE."""
    for alpha in [1.0, 100.0, 10000.0]:
        yield "Ridge", {"alpha": alpha}, Ridge(alpha=alpha, solver="svd"), True
    for n in [2, 5, 10]:
        yield "PLS", {"n_components": n}, PLSRegression(n_components=n, scale=False, max_iter=1000), True
    for n in [5, 15, 35]:
        yield "KNN", {"n_neighbors": n, "weights": "distance"}, KNeighborsRegressor(n_neighbors=n, weights="distance", n_jobs=threads), True
    for c in [1.0, 10.0, 100.0]:
        yield "SVR", {"C": c, "epsilon_scaled_y": 0.05}, TransformedTargetRegressor(regressor=SVR(C=c, epsilon=0.05), transformer=StandardScaler()), True
    for depth in [6, None]:
        for leaf in [3, 10]:
            cfg = {"n_estimators": 160, "max_depth": depth, "min_samples_leaf": leaf, "max_features": 0.7}
            yield "RandomForest", cfg, RandomForestRegressor(**cfg, random_state=SEED, n_jobs=threads), False
    for depth, objective in [(3, "reg:squarederror"), (6, "reg:squarederror"), (3, "reg:absoluteerror")]:
        cfg = {"n_estimators": 300, "max_depth": depth, "learning_rate": 0.05, "objective": objective,
               "subsample": 0.9, "colsample_bytree": 0.8, "reg_lambda": 5.0, "reg_alpha": 0.1}
        yield "XGBoost", cfg, XGBRegressor(**cfg, tree_method="hist", random_state=SEED, n_jobs=threads), False
    yield from boosting_candidates(threads)


def boosting_candidates(threads=4):
    for depth in [4, 6]:
        for loss in ["RMSE", "MAE"]:
            cfg = {"iterations": 300, "depth": depth, "loss_function": loss, "learning_rate": 0.05, "l2_leaf_reg": 5.0}
            yield "CatBoost", cfg, CatBoostRegressor(**cfg, random_seed=SEED, thread_count=threads, verbose=False, allow_writing_files=False), False
    for leaves in [7, 15]:
        for objective in ["regression", "regression_l1"]:
            cfg = {"n_estimators": 300, "num_leaves": leaves, "objective": objective, "learning_rate": 0.05,
                   "min_child_samples": 20, "reg_lambda": 5.0}
            yield "LightGBM", cfg, LGBMRegressor(**cfg, random_state=SEED, n_jobs=threads,
                                                 verbosity=-1, deterministic=True, force_col_wise=True), False


def train(run_dir: Path, threads=4) -> None:
    if (run_dir / "selection.json").exists() or (run_dir / "evaluation_seal.json").exists():
        raise FileExistsError("This run is already frozen. Do not retune a revealed holdout.")
    data, audit = load_run(run_dir)
    model_dir = run_dir / "models"
    model_dir.mkdir(exist_ok=True)
    started = time.perf_counter()
    protocol = {"started_at": utcnow(), "seed": SEED, "threads": threads,
                "selection_rule": "Minimum Validation MAE; tie-break RMSE. All families frozen before Test.",
                "refit_policy": "Train only; no Train+Validation refit, preserving calibration independence.",
                "hybrid_policy": "5-fold file/wafer-component OOF physics residuals inside Train; final physics fit on Train.",
                "calibration_policy": "Per-stage n>=80, finite-sample rank ceil((n+1)*0.9); sample-level diagnostic intervals.",
                "interval_limitation": "Within-group dependence violates iid sample exchangeability; no formal coverage guarantee.",
                "target_units": "dataset_scale", "source_split_sha256": audit["split_sha256"],
                "predeclared_extreme_ids": sorted(EXTREME_IDS),
                "python": platform.python_version(),
                "packages": {n: importlib.metadata.version(n) for n in ["numpy", "pandas", "scipy", "scikit-learn", "catboost", "xgboost", "lightgbm", "joblib", "matplotlib"]},
                "source_hashes": {p.name: sha256(p) for p in sorted(Path(__file__).parent.glob("*.py"))}}
    write_json(run_dir / "training_protocol.json", protocol)
    global_mean = float(data.loc[data.split.eq("train"), TARGET].mean())
    trials, validation_predictions, stage_selection, oof_records, selected_configs = [], [], {}, [], {}
    with threadpool_limits(limits=threads):
        for stage in ["A", "B"]:
            subset = data[data.STAGE.eq(stage)]
            tr = subset[subset.split.eq("train")]
            va = subset[subset.split.eq("validation")]
            ca = subset[subset.split.eq("calibration")]
            y = tr[TARGET].to_numpy(float)
            pre = FeaturePreprocessor().fit(tr)
            arrays = {s: (pre.transform(tr, s), pre.transform(va, s)) for s in [False, True]}
            chambers = tuple(sorted({c for r in tr.chamber_route for c in r.split("-")}))
            best, best_config = {}, {}
            def consider(bundle, cfg, elapsed, messages=()):
                score = metrics(va[TARGET], bundle.predict(va))
                trials.append({"stage": stage, "model": bundle.name, "config": cfg,
                               "fit_seconds": elapsed, **score, "warnings": list(messages)})
                current = best.get(bundle.name)
                if current is None or (score["mae"], score["rmse"]) < current[0]:
                    best[bundle.name] = ((score["mae"], score["rmse"]), bundle)
                    best_config[bundle.name] = cfg

            for name, constant in [("GlobalMean", global_mean), ("StageMean", float(y.mean()))]:
                consider(ModelBundle(name, stage, "constant", constant=constant, train_chambers=chambers), {}, 0.0)
            for regularization in [0.1, 1.0, 10.0]:
                t = time.perf_counter()
                physics = PrestonInspired(regularization).fit(tr, y)
                consider(ModelBundle("PrestonInspired", stage, "physics", physics=physics, train_chambers=chambers),
                         {"regularization": regularization, "loss": "soft_l1_on_log_target"}, time.perf_counter() - t)
            last_family = None
            for name, cfg, estimator, scaled in model_candidates(threads):
                if last_family and name != last_family:
                    print(f"Stage {stage} {last_family}: validation MAE={best[last_family][0][0]:.4f}", flush=True)
                t = time.perf_counter()
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter("always")
                    estimator.fit(arrays[scaled][0], y)
                    bundle = ModelBundle(name, stage, "tabular", estimator, pre, scaled, train_chambers=chambers)
                    consider(bundle, cfg, time.perf_counter() - t, {str(w.message) for w in caught})
                last_family = name
            if last_family:
                print(f"Stage {stage} {last_family}: validation MAE={best[last_family][0][0]:.4f}", flush=True)
            physics = best["PrestonInspired"][1].physics
            oof = np.full(len(tr), np.nan)
            fold_ids = np.zeros(len(tr), dtype=int)
            folds = GroupKFold(n_splits=min(5, tr.group_id.nunique()))
            for fold, (fit_idx, held_idx) in enumerate(folds.split(tr, groups=tr.group_id)):
                if set(tr.iloc[fit_idx].group_id) & set(tr.iloc[held_idx].group_id):
                    raise AssertionError("OOF group leakage")
                fold_physics = PrestonInspired(physics.regularization).fit(tr.iloc[fit_idx], y[fit_idx])
                oof[held_idx] = fold_physics.predict(tr.iloc[held_idx])
                fold_ids[held_idx] = fold
            if not np.isfinite(oof).all():
                raise ValueError("Incomplete OOF residual targets")
            oof_records.append(pd.DataFrame({"sample_id": tr.sample_id.to_numpy(), "stage": stage,
                                             "group_id": tr.group_id.to_numpy(), "fold": fold_ids,
                                             "y_true": y, "physics_oof": oof, "residual_target": y - oof}))
            for name, cfg, estimator, scaled in boosting_candidates(threads):
                t = time.perf_counter()
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter("always")
                    estimator.fit(arrays[False][0], y - oof)
                    bundle = ModelBundle("Physics+" + name, stage, "hybrid", estimator, pre, False, physics, train_chambers=chambers)
                    consider(bundle, cfg, time.perf_counter() - t, {str(w.message) for w in caught})
            selected = min(best, key=lambda name: best[name][0])
            stage_selection[stage] = {"selected_by_validation": selected,
                                      "validation_mae": best[selected][0][0], "validation_rmse": best[selected][0][1],
                                      "train_n": len(tr), "validation_n": len(va), "calibration_n": len(ca),
                                      "train_groups": int(tr.group_id.nunique()), "calibration_groups": int(ca.group_id.nunique()),
                                      "features_after_train_filter": len(pre.feature_names)}
            selected_configs[stage] = best_config
            for name, (_, bundle) in best.items():
                cp = bundle.predict(ca)
                bundle.calibration_n = len(ca)
                bundle.interval_radius = conformal_radius(ca[TARGET], cp)
                joblib.dump(bundle, model_dir / f"{stage}_{name.replace('+', '_')}.joblib", compress=3)
                vp = bundle.predict(va)
                validation_predictions.append(pd.DataFrame({"sample_id": va.sample_id.to_numpy(), "stage": stage,
                    "model": name, "y_true": va[TARGET].to_numpy(), "y_pred": vp, "group_id": va.group_id.to_numpy()}))
            write_json(run_dir / f"feature_schema_{stage}.json", {"input_columns": pre.columns, "retained_features": pre.feature_names,
                       "median_values": pre.medians.tolist(), "train_chambers": list(chambers), "fit_split": "train"})
            write_json(run_dir / "candidate_trials.json", trials)
            print(f"Stage {stage} frozen winner: {selected}; validation MAE={best[selected][0][0]:.4f}", flush=True)
    pd.concat(validation_predictions, ignore_index=True).to_csv(run_dir / "validation_predictions.csv", index=False)
    pd.concat(oof_records, ignore_index=True).to_csv(run_dir / "physics_oof_residuals.csv", index=False)
    write_json(run_dir / "selected_hyperparameters.json", selected_configs)
    hashes = {p.name: sha256(p) for p in sorted(model_dir.glob("*.joblib"))}
    write_json(run_dir / "selection.json", {"frozen_at": utcnow(), "training_seconds": time.perf_counter() - started,
               "stages": stage_selection, "model_hashes": hashes,
               "protocol_sha256": sha256(run_dir / "training_protocol.json"), "split_sha256": audit["split_sha256"]})
    print("All models frozen. Test targets have not been used for selection.", flush=True)


def evaluate(run_dir: Path) -> None:
    seal_path = run_dir / "evaluation_seal.json"
    if seal_path.exists():
        raise FileExistsError("Test already evaluated; read the existing results. Do not tune on this holdout.")
    selection = read_json(run_dir / "selection.json")
    data, audit = load_run(run_dir)
    if selection["split_sha256"] != audit["split_sha256"]:
        raise ValueError("Selection and evaluation splits differ")
    if sha256(run_dir / "training_protocol.json") != selection["protocol_sha256"]:
        raise ValueError("Training protocol changed after model selection")
    models = []
    for filename, expected in selection["model_hashes"].items():
        path = run_dir / "models" / filename
        if sha256(path) != expected:
            raise ValueError(f"Model changed after freeze: {filename}")
        models.append(joblib.load(path))
    # Marker precedes any Test outcome. An interrupted evaluation stays sealed.
    write_json(seal_path, {"started_at": utcnow(), "status": "started", "selection_sha256": sha256(run_dir / "selection.json"),
                          "rule": "No retuning or new model selection on these Test outcomes."})
    rows, metrics_rows = [], []
    for bundle in models:
        test = data[data.STAGE.eq(bundle.stage) & data.split.eq("test")]
        pred, lower, upper = bundle.predict_interval(test)
        record = {"stage": bundle.stage, "model": bundle.name, "slice": "all", **metrics(test[TARGET], pred),
                  "selected_by_validation": selection["stages"][bundle.stage]["selected_by_validation"] == bundle.name,
                  "calibration_n": bundle.calibration_n, "interval_radius": bundle.interval_radius}
        if lower is not None:
            record["coverage"] = float(((test[TARGET].to_numpy() >= lower) & (test[TARGET].to_numpy() <= upper)).mean())
            record["mean_interval_width"] = float((upper - lower).mean())
        metrics_rows.append(record)
        for route in sorted(test.chamber_route.unique()):
            mask = test.chamber_route.eq(route).to_numpy()
            metrics_rows.append({"stage": bundle.stage, "model": bundle.name, "slice": "chambers=" + route,
                                 **metrics(test.loc[mask, TARGET], pred[mask])})
        for group in sorted(test.group_id.unique()):
            mask = test.group_id.eq(group).to_numpy()
            metrics_rows.append({"stage": bundle.stage, "model": bundle.name, "slice": "group=" + group,
                                 **metrics(test.loc[mask, TARGET], pred[mask])})
        mask = ~test.WAFER_ID.isin(EXTREME_IDS).to_numpy()
        metrics_rows.append({"stage": bundle.stage, "model": bundle.name, "slice": "diagnostic_without_predeclared_extremes",
                             **metrics(test.loc[mask, TARGET], pred[mask])})
        rows.append(pd.DataFrame({"sample_id": test.sample_id.to_numpy(), "WAFER_ID": test.WAFER_ID.to_numpy(),
                                 "stage": bundle.stage, "model": bundle.name, "group_id": test.group_id.to_numpy(),
                                 "chamber_route": test.chamber_route.to_numpy(), "y_true": test[TARGET].to_numpy(),
                                 "y_pred": pred, "lower_90": lower if lower is not None else np.nan,
                                 "upper_90": upper if upper is not None else np.nan}))
    predictions = pd.concat(rows, ignore_index=True)
    for model, group in predictions.groupby("model"):
        metrics_rows.append({"stage": "ALL", "model": model, "slice": "all", **metrics(group.y_true, group.y_pred)})
    selected_predictions = pd.concat([predictions[predictions.stage.eq(s) & predictions.model.eq(v["selected_by_validation"])]
                                     for s, v in selection["stages"].items()], ignore_index=True)
    metrics_rows.append({"stage": "ALL", "model": "SelectedPerStage", "slice": "all",
                         **metrics(selected_predictions.y_true, selected_predictions.y_pred)})
    predictions.to_csv(run_dir / "test_predictions.csv", index=False)
    selected_predictions.to_csv(run_dir / "selected_test_predictions.csv", index=False)
    table = pd.DataFrame(metrics_rows)
    table.to_csv(run_dir / "test_metrics.csv", index=False)
    seal = read_json(seal_path)
    seal.update(status="complete", completed_at=utcnow(),
                test_metrics_sha256=sha256(run_dir / "test_metrics.csv"),
                test_predictions_sha256=sha256(run_dir / "test_predictions.csv"))
    write_json(seal_path, seal)
    print(table[table.slice.eq("all") & (table.selected_by_validation.eq(True) | table.model.eq("StageMean"))]
          [["stage", "model", "n", "mae", "rmse", "r2"]].to_string(index=False), flush=True)
