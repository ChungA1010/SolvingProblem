"""Audit the pre-start protocol and run its fixed N=0 development comparison."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from pandas.testing import assert_frame_equal
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ALPHA = 0.4
RIDGE_ALPHA = 1.0
SENSOR_RECIPES = ["A456", "B456"]
FIXED_LINEAR_FEATURE_SETS = {
    "recipe+prev_mrr": ["recipe", "prev_mrr"],
    "recipe+state_ewm": ["recipe", "state_ewm"],
    "recipe+prev_mrr+state_ewm": ["recipe", "prev_mrr", "state_ewm"],
}
GAP_SECONDS = 500.0
COUNTER_COLUMNS = ["u_dresser", "u_pad", "u_dresser_table", "u_membrane"]
CURRENT_WAFER_SENSOR_AVERAGES = [
    "p_main", "p_center", "p_edge", "p_ripple", "p_retainer",
    "p_chamber", "slurry_a", "slurry_c",
]
HISTORY_COLUMNS = ["prev_mrr", "prev_wafers_back", "state_ewm"]
EQUIPMENT_COLUMNS = [
    *COUNTER_COLUMNS, "gap_s", "after_gap", "after_gap_confirmed",
    "extra_dressing", "dresser_excess", "hidden_wafers_est",
    "pad_replaced", "dresser_replaced",
]
OLD_FEATURES = ["recipe", *HISTORY_COLUMNS, *EQUIPMENT_COLUMNS, *CURRENT_WAFER_SENSOR_AVERAGES]
PRESTART_CANDIDATES = ["recipe", *HISTORY_COLUMNS, *EQUIPMENT_COLUMNS]
AVAILABILITY_FLAGS = ["counter_available", "schedule_available", "history_available"]
SNAPSHOT_COLUMNS = [
    "wafer_id", "stage", "planned_at", "planned_start", "counter_observed_at",
    *COUNTER_COLUMNS,
]


def load_wafer_table(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path).sort_values(["t_start", "wafer_id", "stage"]).reset_index(drop=True)
    required = {"wafer_id", "stage", "recipe", "t_start", "t_end", "mrr", "fold"}
    missing = required - set(frame)
    if missing:
        raise ValueError(f"Wafer table missing columns: {sorted(missing)}")
    if frame.duplicated(["wafer_id", "stage"]).any():
        raise ValueError("Duplicate (wafer_id, stage) keys")
    if set(frame.fold) != set(range(1, 6)) or not frame.fold.is_monotonic_increasing:
        raise ValueError("Expected chronological folds 1..5")
    return frame


def load_prestart_snapshots(path: Path | None, frame: pd.DataFrame) -> pd.DataFrame:
    """Accept only independently timestamped, pre-start counter/schedule data.

    The first raw sensor row is deliberately not used as a surrogate snapshot.
    """
    if path is None:
        snapshots = frame[["wafer_id", "stage"]].copy()
        for column in SNAPSHOT_COLUMNS[2:]:
            snapshots[column] = np.nan
        return snapshots
    snapshots = pd.read_csv(path)
    missing = set(SNAPSHOT_COLUMNS) - set(snapshots)
    if missing:
        raise ValueError(f"Pre-start snapshots missing columns: {sorted(missing)}")
    if snapshots.duplicated(["wafer_id", "stage"]).any():
        raise ValueError("Duplicate pre-start snapshot keys")
    snapshots = frame[["wafer_id", "stage", "t_start"]].merge(
        snapshots[SNAPSHOT_COLUMNS], on=["wafer_id", "stage"], how="left", validate="one_to_one"
    )
    for column in SNAPSHOT_COLUMNS[2:]:
        snapshots[column] = pd.to_numeric(snapshots[column], errors="coerce")
    schedule = snapshots.planned_start.notna()
    bad_schedule = schedule & ~(
        (snapshots.planned_at < snapshots.planned_start)
        & (snapshots.planned_start <= snapshots.t_start)
    )
    if bad_schedule.any():
        raise ValueError("A planned start is not proven available before wafer start")
    any_counter = snapshots[COUNTER_COLUMNS].notna().any(axis=1)
    bad_counter = any_counter & ~(
        schedule & snapshots[COUNTER_COLUMNS].notna().all(axis=1)
        & (snapshots.counter_observed_at < snapshots.planned_start)
    )
    if bad_counter.any():
        raise ValueError("Counter values lack a complete pre-start timestamped snapshot")
    return snapshots.drop(columns="t_start")


def _median_positive(values: list[float]) -> float:
    return float(np.median(values)) if values else np.nan


def build_fold_features(
    frame: pd.DataFrame,
    snapshots: pd.DataFrame,
    evaluation_fold: int,
    measurement_delay_wafers: int = 0,
) -> tuple[pd.DataFrame, dict]:
    """Build one fold with causal history and train-only calibration.

    N=0 releases a wafer's MRR before the next observed wafer of that recipe.
    N>0 releases it after N additional observed same-recipe wafers. Test-fold
    labels may enter only this measurement ledger, never fitted parameters.
    """
    if evaluation_fold not in range(2, 6) or measurement_delay_wafers < 0:
        raise ValueError("Use evaluation fold 2..5 and nonnegative measurement delay")
    rows = frame.loc[frame.fold.le(evaluation_fold),
                     ["wafer_id", "stage", "recipe", "fold", "t_start", "t_end", "mrr"]].copy()
    rows = rows.merge(snapshots[SNAPSHOT_COLUMNS], on=["wafer_id", "stage"], how="left", validate="one_to_one")
    rows = rows.sort_values(["t_start", "wafer_id", "stage"]).reset_index(drop=True)

    increments: dict[str, dict[str, list[float]]] = defaultdict(lambda: {"pad": [], "dresser": []})
    last_table: dict[str, dict] = {}
    seen_by_recipe: dict[str, int] = defaultdict(int)
    pending: dict[str, list[tuple[int, float, float]]] = defaultdict(list)
    state: dict[str, float] = {}
    latest_measured: dict[str, tuple[float, float]] = {}
    records: list[dict] = []
    frozen_steps: dict[str, dict] | None = None

    for row in rows.itertuples(index=False):
        is_training = row.fold < evaluation_fold
        if not is_training and frozen_steps is None:
            frozen_steps = {
                table: {"pad_step": _median_positive(v["pad"]),
                        "dres_step": _median_positive(v["dresser"]),
                        "pad_pairs": len(v["pad"]), "dresser_pairs": len(v["dresser"])}
                for table, v in increments.items()
            }

        recipe = row.recipe
        table = "ch1" if recipe == "A123" else "ch4"
        position = seen_by_recipe[recipe]
        for release_at, value, pad_at_measurement in pending[recipe]:
            if release_at <= position:
                old = state.get(recipe)
                state[recipe] = value if old is None else ALPHA * value + (1 - ALPHA) * old
                latest_measured[recipe] = (value, pad_at_measurement)
        pending[recipe] = [entry for entry in pending[recipe] if entry[0] > position]

        schedule_available = bool(
            pd.notna(row.planned_at) and pd.notna(row.planned_start)
            and row.planned_at < row.planned_start <= row.t_start
        )
        counter_available = bool(
            schedule_available and pd.notna(row.counter_observed_at)
            and row.counter_observed_at < row.planned_start
            and all(pd.notna(getattr(row, name)) for name in COUNTER_COLUMNS)
        )
        current_pad = float(row.u_pad) if counter_available else np.nan
        current_dresser = float(row.u_dresser) if counter_available else np.nan
        previous = last_table.get(table)
        gap = (float(row.planned_start - previous["t_end"])
               if schedule_available and previous is not None
               and np.isfinite(previous["t_end"])
               and previous["t_end"] <= row.planned_start else np.nan)
        dp = (current_pad - previous["pad"]
              if counter_available and previous is not None and np.isfinite(previous["pad"]) else np.nan)
        dd = (current_dresser - previous["dresser"]
              if counter_available and previous is not None and np.isfinite(previous["dresser"]) else np.nan)
        if is_training:
            pad_step = _median_positive(increments[table]["pad"])
            dres_step = _median_positive(increments[table]["dresser"])
        else:
            fixed = (frozen_steps or {}).get(table, {})
            pad_step = fixed.get("pad_step", np.nan)
            dres_step = fixed.get("dres_step", np.nan)

        counters_valid = np.isfinite(dp) and np.isfinite(dd)
        nonreplacement = counters_valid and dp >= 0 and dd >= 0
        hidden = (max(float(np.rint(dp / pad_step)) - 1, 0)
                  if nonreplacement and np.isfinite(pad_step) and pad_step > 0 else np.nan)
        excess = (float(dd - (hidden + 1) * dres_step)
                  if np.isfinite(hidden) and np.isfinite(dres_step) else np.nan)
        last_mrr, last_pad = latest_measured.get(recipe, (np.nan, np.nan))
        distance = (max(float(np.rint((current_pad - last_pad) / pad_step)), 1)
                    if counter_available and np.isfinite(last_pad)
                    and np.isfinite(pad_step) and pad_step > 0 and current_pad >= last_pad
                    else np.nan)
        after_gap = float(gap > GAP_SECONDS) if np.isfinite(gap) else np.nan
        output = {
            "wafer_id": row.wafer_id, "stage": row.stage, "recipe": recipe,
            "fold": row.fold, "mrr": row.mrr,
            "prev_mrr": last_mrr, "prev_wafers_back": distance,
            "state_ewm": state.get(recipe, np.nan),
            "gap_s": gap, "after_gap": after_gap,
            "after_gap_confirmed": (float(after_gap == 1 and hidden == 0)
                                    if np.isfinite(after_gap) and np.isfinite(hidden) else np.nan),
            "hidden_wafers_est": hidden, "dresser_excess": excess,
            "extra_dressing": float(excess > 0.5) if np.isfinite(excess) else np.nan,
            "pad_replaced": float(dp < -5) if np.isfinite(dp) else np.nan,
            "dresser_replaced": float(dd < -5) if np.isfinite(dd) else np.nan,
            "counter_available": int(counter_available),
            "schedule_available": int(schedule_available),
            "history_available": int(np.isfinite(last_mrr)),
        }
        for name in COUNTER_COLUMNS:
            output[name] = float(getattr(row, name)) if counter_available else np.nan
        records.append(output)

        # The current label is queued only after its feature row is complete.
        # For N=0 it becomes visible to the next observed same-recipe wafer.
        pending[recipe].append((position + measurement_delay_wafers + 1,
                                float(row.mrr), current_pad))
        seen_by_recipe[recipe] += 1
        last_table[table] = {"t_end": float(row.t_end), "pad": current_pad,
                             "dresser": current_dresser}
        # Only training rows change fold calibration. Evaluation counter deltas
        # can describe their own row but never change pad_step or dres_step.
        if is_training and np.isfinite(gap) and 0 <= gap <= 300:
            if np.isfinite(dp) and dp > 0:
                increments[table]["pad"].append(float(dp))
            if np.isfinite(dd) and dd >= 0:
                increments[table]["dresser"].append(float(dd))

    calibration = frozen_steps or {}
    features = pd.DataFrame.from_records(records)
    if any(name in features for name in CURRENT_WAFER_SENSOR_AVERAGES):
        raise AssertionError("Current-wafer sensor averages entered the pre-start frame")
    return features, calibration


def state_baseline_metrics(features: pd.DataFrame, evaluation_fold: int) -> list[dict]:
    train = features[features.fold.lt(evaluation_fold)]
    evaluation = features[features.fold.eq(evaluation_fold)]
    recipe_means = train.groupby("recipe").mrr.mean()
    fallback = float(train.mrr.mean())
    results = []
    groups = [("A456+B456", evaluation[evaluation.recipe.isin(["A456", "B456"])])]
    groups += [(r, evaluation[evaluation.recipe.eq(r)]) for r in ["A123", "A456", "B456"]]
    for recipe, group in groups:
        if group.empty:
            continue
        predicted = group.state_ewm.fillna(group.recipe.map(recipe_means)).fillna(fallback)
        results.append({"fold": evaluation_fold, "recipe": recipe,
                        "train_rows": int(len(train)), "evaluation_rows": int(len(group)),
                        "history_available_rows": int(group.history_available.sum()),
                        "mae": float((group.mrr - predicted).abs().mean())})
    return results


def _fixed_regression(features: list[str], kind: str) -> Pipeline:
    """All learned preprocessing stays inside the fold's training pipeline."""
    numeric = [name for name in features if name != "recipe"]
    transformers = []
    if "recipe" in features:
        transformers.append(("recipe", OneHotEncoder(handle_unknown="ignore"), ["recipe"]))
    if numeric:
        transformers.append(("numeric", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]), numeric))
    preprocessing = ColumnTransformer(transformers)
    estimator = LinearRegression() if kind == "linear" else Ridge(alpha=RIDGE_ALPHA)
    return Pipeline([("preprocessing", preprocessing), ("model", estimator)])


def compare_fixed_n0(features_by_fold: dict[int, pd.DataFrame]) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Compare only predeclared baselines and linear families on A456/B456."""
    predictions = []
    correlations = []
    for fold, features in features_by_fold.items():
        train = features[features.fold.lt(fold) & features.recipe.isin(SENSOR_RECIPES)].copy()
        evaluation = features[features.fold.eq(fold) & features.recipe.isin(SENSOR_RECIPES)].copy()
        assert len(train) and len(evaluation)
        assert train.fold.max() < fold and evaluation.fold.eq(fold).all()
        assert train[["prev_mrr", "state_ewm"]].notna().any().all()
        assert evaluation[["prev_mrr", "state_ewm"]].notna().all().all()
        means = train.groupby("recipe").mrr.mean()
        fallback = float(train.mrr.mean())
        fixed_predictions = {
            "Recipe Mean": evaluation.recipe.map(means).fillna(fallback).to_numpy(),
            "Persistence": evaluation.prev_mrr.to_numpy(),
            "EWMA (alpha=0.4)": evaluation.state_ewm.to_numpy(),
        }
        for feature_set, columns in FIXED_LINEAR_FEATURE_SETS.items():
            for kind in ("linear", "ridge"):
                model = _fixed_regression(columns, kind)
                model.fit(train[columns], train.mrr)
                fixed_predictions[f"{kind.title()} {feature_set}"] = model.predict(evaluation[columns])

        for model_name, predicted in fixed_predictions.items():
            for row, prediction in zip(evaluation.itertuples(index=False), predicted, strict=True):
                predictions.append({"fold": fold, "recipe": row.recipe,
                                    "wafer_id": row.wafer_id, "stage": row.stage,
                                    "model": model_name, "actual_mrr": float(row.mrr),
                                    "predicted_mrr": float(prediction),
                                    "absolute_error": abs(float(row.mrr) - float(prediction))})
        for recipe, group in [("A456+B456", evaluation),
                              *( (name, evaluation[evaluation.recipe.eq(name)]) for name in SENSOR_RECIPES)]:
            correlations.append({"fold": fold, "recipe": recipe, "rows": len(group),
                                 "pearson_prev_mrr_state_ewm": float(group.prev_mrr.corr(group.state_ewm))})

    prediction_frame = pd.DataFrame(predictions)
    correlation_frame = pd.DataFrame(correlations)
    fold_rows = []
    for (model, fold), group in prediction_frame.groupby(["model", "fold"], sort=False):
        for recipe, subset in [("A456+B456", group),
                               *( (name, group[group.recipe.eq(name)]) for name in SENSOR_RECIPES)]:
            fold_rows.append({"model": model, "fold": fold, "recipe": recipe,
                              "rows": len(subset), "mae": float(subset.absolute_error.mean())})
    fold_frame = pd.DataFrame(fold_rows)
    summary_rows = []
    for (model, recipe), group in fold_frame.groupby(["model", "recipe"], sort=False):
        assert group.fold.nunique() == 4
        summary_rows.append({"model": model, "recipe": recipe, "folds": 4,
                             "rows": int(group.rows.sum()),
                             "weighted_mae": float(np.average(group.mae, weights=group.rows)),
                             "unweighted_mae": float(group.mae.mean())})
    summary_frame = pd.DataFrame(summary_rows)
    for recipe, group in [("A456+B456", prediction_frame),
                          *( (name, prediction_frame[prediction_frame.recipe.eq(name)]) for name in SENSOR_RECIPES)]:
        # Correlation is computed once per wafer, not once per model prediction.
        wafer_keys = group[group.model.eq("Persistence")][["fold", "recipe", "wafer_id", "stage"]]
        history = pd.concat([features_by_fold[fold].loc[
            features_by_fold[fold].fold.eq(fold) & features_by_fold[fold].recipe.isin(SENSOR_RECIPES),
            ["fold", "recipe", "wafer_id", "stage", "prev_mrr", "state_ewm"]]
            for fold in range(2, 6)], ignore_index=True)
        observed = wafer_keys.merge(history, on=["fold", "recipe", "wafer_id", "stage"], validate="one_to_one")
        correlation_frame.loc[len(correlation_frame)] = {
            "fold": "pooled", "recipe": recipe, "rows": len(observed),
            "pearson_prev_mrr_state_ewm": float(observed.prev_mrr.corr(observed.state_ewm))}
    return prediction_frame, fold_frame, summary_frame, correlation_frame


def self_check() -> dict:
    """A future-fold mutation must not affect earlier features/calibration.

    Also verify that an evaluation label updates the next state only for N=0.
    """
    sample = pd.DataFrame([
        {"wafer_id": i, "stage": "A", "recipe": "A456", "fold": i // 2 + 1,
         "t_start": 100.0 * i, "t_end": 100.0 * i + 10,
         "mrr": 70.0 + i} for i in range(10)
    ])
    snapshots = pd.DataFrame([
        {"wafer_id": i, "stage": "A", "planned_at": 100.0 * i - 5,
         "planned_start": 100.0 * i - 1, "counter_observed_at": 100.0 * i - 3,
         "u_dresser": 2.0 * i, "u_pad": 5.0 * i,
         "u_dresser_table": 100.0 + i, "u_membrane": 10.0 + i}
        for i in range(10)
    ])
    original, calibration = build_fold_features(sample, snapshots, 2, 0)
    future = sample.copy()
    future.loc[future.fold.ge(3), "mrr"] += 10000
    future_snapshots = snapshots.copy()
    future_snapshots.loc[future_snapshots.wafer_id.ge(4), "u_pad"] += 10000
    unchanged, same_calibration = build_fold_features(future, future_snapshots, 2, 0)
    assert_frame_equal(original, unchanged)
    assert calibration == same_calibration
    assert calibration["ch4"]["pad_step"] == 5.0
    assert calibration["ch4"]["dres_step"] == 2.0

    changed_eval_counters = snapshots.copy()
    changed_eval_counters.loc[changed_eval_counters.wafer_id.eq(2), "u_pad"] += 50
    changed_eval_counters.loc[changed_eval_counters.wafer_id.eq(2), "u_dresser"] += 20
    counter_features, counter_calibration = build_fold_features(sample, changed_eval_counters, 2, 0)
    assert counter_calibration == calibration
    assert_frame_equal(original.iloc[:2], counter_features.iloc[:2])
    assert original.loc[2, "hidden_wafers_est"] != counter_features.loc[2, "hidden_wafers_est"]

    # A previous process that ends after the current planned start is not
    # known at prediction time; equality is a valid zero-second gap.
    overlapping = sample.copy()
    overlapping.loc[overlapping.wafer_id.eq(1), "t_end"] = 200.0
    overlap_features, _ = build_fold_features(overlapping, snapshots, 2, 0)
    assert pd.isna(overlap_features.loc[2, "gap_s"])
    assert pd.isna(overlap_features.loc[2, "after_gap"])
    assert pd.isna(overlap_features.loc[2, "after_gap_confirmed"])
    boundary = sample.copy()
    boundary.loc[boundary.wafer_id.eq(1), "t_end"] = 199.0
    boundary_features, _ = build_fold_features(boundary, snapshots, 2, 0)
    assert boundary_features.loc[2, "gap_s"] == 0.0

    changed_label = sample.copy()
    changed_label.loc[changed_label.wafer_id.eq(2), "mrr"] += 100
    immediate, immediate_calibration = build_fold_features(changed_label, snapshots, 2, 0)
    delayed, delayed_calibration = build_fold_features(changed_label, snapshots, 2, 1)
    original_delayed, _ = build_fold_features(sample, snapshots, 2, 1)
    assert immediate_calibration == calibration == delayed_calibration
    assert original.loc[2, "state_ewm"] == immediate.loc[2, "state_ewm"]
    assert original.loc[3, "state_ewm"] != immediate.loc[3, "state_ewm"]
    assert original_delayed.loc[3, "state_ewm"] == delayed.loc[3, "state_ewm"]
    return {"future_fold_invariance": "pass", "train_only_calibration": "pass",
            "evaluation_counter_does_not_refit_calibration": "pass",
            "prestart_gap_timestamp_guard": "pass",
            "N0_online_state_update": "pass", "N1_delayed_state_update": "pass"}


def _json_ready(value):
    if isinstance(value, dict):
        return {key: _json_ready(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_ready(item) for item in value]
    if isinstance(value, (float, np.floating)) and not np.isfinite(value):
        return None
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wafer-table", type=Path, required=True)
    parser.add_argument("--prestart-snapshots", type=Path, default=None,
                        help="Independent CSV with planned_at, planned_start, counter_observed_at, and counters")
    parser.add_argument("--measurement-delay", type=int, default=0,
                        help="Observed same-recipe wafers of extra measurement delay; default N=0")
    parser.add_argument("--output-dir", type=Path, default=Path("results/mrr_protocol_audit"))
    parser.add_argument("--compare-fixed-n0", action="store_true",
                        help="Run only the predeclared Recipe Mean, Persistence, EWMA, Linear and Ridge comparison")
    args = parser.parse_args()
    if args.compare_fixed_n0 and (args.measurement_delay != 0 or args.prestart_snapshots is not None):
        parser.error("The fixed comparison is N=0 and uses no counter/schedule snapshot")
    frame = load_wafer_table(args.wafer_table)
    snapshots = load_prestart_snapshots(args.prestart_snapshots, frame)
    checks = self_check()

    availability_rows, count_rows, baseline_rows, calibrations = [], [], [], {}
    features_by_fold = {}
    for fold in range(2, 6):
        features, calibration = build_fold_features(frame, snapshots, fold, args.measurement_delay)
        features_by_fold[fold] = features
        train = features[features.fold.lt(fold)]
        evaluation = features[features.fold.eq(fold)]
        calibrations[str(fold)] = calibration
        count_rows.append({"fold": fold, "train_all": len(train), "evaluation_all": len(evaluation),
                           "train_A456_B456": int(train.recipe.isin(["A456", "B456"]).sum()),
                           "evaluation_A456_B456": int(evaluation.recipe.isin(["A456", "B456"]).sum()),
                           "evaluation_A123": int(evaluation.recipe.eq("A123").sum())})
        baseline_rows.extend(state_baseline_metrics(features, fold))
        for name in PRESTART_CANDIDATES + AVAILABILITY_FLAGS:
            availability_rows.append({"fold": fold, "feature": name,
                "class": "A" if name == "recipe" else "B_or_availability_metadata",
                "train_nonmissing": int(train[name].notna().sum()),
                "evaluation_nonmissing": int(evaluation[name].notna().sum()),
                "evaluation_available_or_true": int(evaluation[name].sum()) if name in AVAILABILITY_FLAGS else None})

    args.output_dir.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(availability_rows).to_csv(args.output_dir / "feature_availability_audit.csv", index=False)
    pd.DataFrame(count_rows).to_csv(args.output_dir / "fold_row_counts.csv", index=False)
    pd.DataFrame(baseline_rows).to_csv(args.output_dir / "state_baseline_metrics.csv", index=False)
    (args.output_dir / "fold_calibration.json").write_text(
        json.dumps(_json_ready(calibrations), indent=2, allow_nan=False), encoding="utf-8")
    (args.output_dir / "protocol_checks.json").write_text(json.dumps(checks, indent=2), encoding="utf-8")
    policy = {"prediction_time": "before current wafer loading/polishing",
              "old_features": OLD_FEATURES, "prestart_candidates": PRESTART_CANDIDATES,
              "removed_current_wafer_sensor_averages": CURRENT_WAFER_SENSOR_AVERAGES,
              "availability_flags_are_metadata": AVAILABILITY_FLAGS,
              "counter_source": str(args.prestart_snapshots) if args.prestart_snapshots else "unavailable",
              "measurement_delay_wafers": args.measurement_delay,
              "benchmark_status": "chronological development; no untouched final test",
              "model_fitting": "fixed N=0 comparison" if args.compare_fixed_n0 else "not run",
              "historical_kp_mae_2_63": "reference only"}
    (args.output_dir / "feature_policy.json").write_text(json.dumps(policy, indent=2), encoding="utf-8")
    print(pd.DataFrame(count_rows).to_string(index=False))
    print(pd.DataFrame(baseline_rows).query("recipe == 'A456+B456'").to_string(index=False))
    if args.compare_fixed_n0:
        predictions, fold_mae, summary, correlations = compare_fixed_n0(features_by_fold)
        predictions.to_csv(args.output_dir / "fixed_n0_predictions.csv", index=False)
        fold_mae.to_csv(args.output_dir / "fixed_n0_fold_mae.csv", index=False)
        summary.to_csv(args.output_dir / "fixed_n0_summary.csv", index=False)
        correlations.to_csv(args.output_dir / "fixed_n0_history_correlation.csv", index=False)
        comparison_policy = {
            "scenario": "N=0 measurement-complete assumption",
            "benchmark": "folds 2-5 chronological development, no final test",
            "model_rows": "A456+B456 only; A123 remains state-only",
            "strict_reference_features": ["recipe"],
            "data_driven_features": ["recipe", "prev_mrr", "state_ewm"],
            "regression_feature_sets": FIXED_LINEAR_FEATURE_SETS,
            "linear_models": ["LinearRegression", "Ridge"],
            "ridge_alpha": RIDGE_ALPHA,
            "ewma_alpha": ALPHA,
            "hyperparameter_search": False,
            "learned_preprocessing": "fit on past folds only",
            "evaluation_mrr_use": "N=0 online state update only",
        }
        (args.output_dir / "fixed_n0_policy.json").write_text(
            json.dumps(comparison_policy, indent=2), encoding="utf-8")
        print(f"Fixed N=0 comparison complete; 9 prespecified models. Output: {args.output_dir}")
    else:
        print(f"Protocol checks: {checks}; no model fitted. Output: {args.output_dir}")


if __name__ == "__main__":
    main()
