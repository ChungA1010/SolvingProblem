"""
Best-effort reproduction scaffold for Di, Jia, and Lee (2017).

Paper:
  Enhanced Virtual Metrology on Chemical Mechanical Planarization Process using
  an Integrated Model and Data-Driven Approach.

This script targets the paper's Table 4 setting: 20 Monte Carlo CV tests on the
training labels. Official PHM validation/test labels are not available in this
repository, so Table 5 cannot be reproduced from the mirrored data alone.
"""

from __future__ import annotations

import argparse
import json
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import BaggingRegressor, RandomForestRegressor
from sklearn.feature_selection import f_regression
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.neighbors import KNeighborsRegressor, NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor


WEAR_COLS = [
    "USAGE_OF_BACKING_FILM",
    "USAGE_OF_DRESSER",
    "USAGE_OF_POLISHING_TABLE",
    "USAGE_OF_DRESSER_TABLE",
    "USAGE_OF_MEMBRANE",
    "USAGE_OF_PRESSURIZED_SHEET",
]

PRESSURE_COLS = [
    "PRESSURIZED_CHAMBER_PRESSURE",
    "MAIN_OUTER_AIR_BAG_PRESSURE",
    "CENTER_AIR_BAG_PRESSURE",
    "RETAINER_RING_PRESSURE",
    "RIPPLE_AIR_BAG_PRESSURE",
    "EDGE_AIR_BAG_PRESSURE",
]

# Table 3 allocates 24 flow/status features: 4 variables x 3 stats x 2 chamber groups.
FLOW_COLS = ["SLURRY_FLOW_LINE_A", "SLURRY_FLOW_LINE_B", "SLURRY_FLOW_LINE_C", "DRESSING_WATER_STATUS"]
ROTATION_COLS = ["WAFER_ROTATION", "STAGE_ROTATION", "HEAD_ROTATION"]
TARGET = "AVG_REMOVAL_RATE"


@dataclass(frozen=True)
class ConditionSpec:
    name: str
    stage: str
    chambers: tuple[int, int, int]
    first_chamber_group: tuple[int, ...]
    second_chamber_group: tuple[int, ...]


CONDITIONS = [
    ConditionSpec("Cond1", "A", (4, 5, 6), (4,), (5, 6)),
    ConditionSpec("Cond2", "B", (4, 5, 6), (4,), (5, 6)),
    ConditionSpec("Cond3", "A", (1, 2, 3), (1,), (2, 3)),
]


PAPER_TABLE4_MEAN_MSE = {
    "persistent": {"Cond1": 7.55, "Cond2": 11.40, "Cond3": 5.62, "Overall": 8.78},
    "knn": {"Cond1": 8.78, "Cond2": 15.22, "Cond3": 7.55, "Overall": 11.21},
    "svr": {"Cond1": 5.54, "Cond2": 7.43, "Cond3": 5.05, "Overall": 6.23},
    "linear_regression": {"Cond1": 5.77, "Cond2": 10.95, "Cond3": 5.00, "Overall": 7.76},
    "tree_bagging": {"Cond1": 5.65, "Cond2": 8.32, "Cond3": 5.32, "Overall": 6.48},
    "integrated": {"Cond1": 5.43, "Cond2": 7.33, "Cond3": 4.91, "Overall": 6.18},
}

PREVIOUS_REPRODUCTION_OVERALL_MSE = {
    "persistent": 13.9838,
    "knn": 12.1622,
    "svr": 11.1381,
    "linear_regression": 11.9411,
    "tree_bagging": 9.7460,
    "integrated": 8.9243,
}

PAPER_FEATURE_COUNT = 125


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def cmp1_dir() -> Path:
    return repo_root() / "Dataset" / "CMP1"


def _safe_last(series: pd.Series) -> float:
    valid = series.dropna()
    return float(valid.iloc[-1]) if not valid.empty else np.nan


def _auc(group: pd.DataFrame, col: str) -> float:
    frame = group[["elapsed_sec", col]].copy()
    frame[col] = pd.to_numeric(frame[col], errors="coerce")
    frame = frame.dropna()
    if len(frame) < 2:
        return 0.0
    return float(np.trapezoid(frame[col], frame["elapsed_sec"]))


def _load_trace_groups(root: Path) -> pd.DataFrame:
    frames = []
    files = sorted((root / "CMP-data" / "training").glob("CMP-training-*.csv"))
    for file_id, path in enumerate(files):
        df = pd.read_csv(path)
        df["file_id"] = file_id
        frames.append(df)

    raw = pd.concat(frames, ignore_index=True)
    for col in raw.columns:
        if col != "STAGE":
            raw[col] = pd.to_numeric(raw[col], errors="coerce")

    labels = pd.read_csv(root / "CMP-training-removalrate.csv").reset_index().rename(columns={"index": "label_order"})
    # Four mirrored labels are >4000 and make Di-style MSE impossible. Treat as
    # obvious anomalies, matching the repository's existing preprocessing.
    labels = labels[labels[TARGET] <= 500].copy()

    records = []
    for (wafer_id, stage), group in raw.groupby(["WAFER_ID", "STAGE"]):
        group = group.sort_values("TIMESTAMP").copy()
        first_timestamp = float(group["TIMESTAMP"].iloc[0])
        group["elapsed_sec"] = group["TIMESTAMP"] - first_timestamp
        chambers = tuple(sorted(int(v) for v in group["CHAMBER"].dropna().unique()))

        rec: dict[str, Any] = {
            "WAFER_ID": int(wafer_id),
            "STAGE": stage,
            "file_id_min": int(group["file_id"].min()),
            "file_id_max": int(group["file_id"].max()),
            "raw_first_global_index": int(group.index.min()),
            "first_timestamp": first_timestamp,
            "last_timestamp": float(group["TIMESTAMP"].iloc[-1]),
            "duration_sec": float(group["TIMESTAMP"].iloc[-1] - first_timestamp),
            "chamber_set": ",".join(map(str, chambers)),
            "n_timepoints": int(len(group)),
        }

        for spec in CONDITIONS:
            if stage == spec.stage and chambers == spec.chambers:
                rec["condition"] = spec.name
                rec["_first_group"] = spec.first_chamber_group
                rec["_second_group"] = spec.second_chamber_group
                break
        else:
            rec["condition"] = np.nan
            rec["_first_group"] = tuple()
            rec["_second_group"] = tuple()

        _add_di_physical_features(rec, group, "g1", rec["_first_group"])
        _add_di_physical_features(rec, group, "g2", rec["_second_group"])
        records.append(rec)

    features = pd.DataFrame(records)
    features = features.drop(columns=["_first_group", "_second_group"])
    merged = features.merge(labels, on=["WAFER_ID", "STAGE"], how="inner", validate="one_to_one")
    merged = merged.dropna(subset=["condition"]).sort_values(["condition", "first_timestamp"]).reset_index(drop=True)
    return merged


def _add_di_physical_features(rec: dict[str, Any], group: pd.DataFrame, prefix: str, chambers: tuple[int, ...]) -> None:
    if not chambers:
        return
    part = group[group["CHAMBER"].isin(chambers)].copy()
    if part.empty:
        for col in WEAR_COLS + PRESSURE_COLS + FLOW_COLS + ROTATION_COLS:
            rec[f"{prefix}_{col.lower()}_mean"] = np.nan
        return

    rec[f"{prefix}_polishing_time"] = float(part["TIMESTAMP"].max() - part["TIMESTAMP"].min())

    for col in WEAR_COLS:
        values = pd.to_numeric(part[col], errors="coerce")
        rec[f"{prefix}_{col.lower()}_mean"] = float(values.mean())
        rec[f"{prefix}_{col.lower()}_std"] = float(values.std(ddof=0))
        rec[f"{prefix}_{col.lower()}_decreasing_rate"] = (_safe_last(values) - float(values.iloc[0])) / max(
            rec[f"{prefix}_polishing_time"], 1.0
        )

    for col in PRESSURE_COLS:
        values = pd.to_numeric(part[col], errors="coerce")
        rec[f"{prefix}_{col.lower()}_mean"] = float(values.mean())
        rec[f"{prefix}_{col.lower()}_std"] = float(values.std(ddof=0))
        rec[f"{prefix}_{col.lower()}_auc"] = _auc(part, col)

    for col in FLOW_COLS:
        values = pd.to_numeric(part[col], errors="coerce")
        rec[f"{prefix}_{col.lower()}_mean"] = float(values.mean())
        rec[f"{prefix}_{col.lower()}_std"] = float(values.std(ddof=0))
        rec[f"{prefix}_{col.lower()}_auc"] = _auc(part, col)

    for col in ROTATION_COLS:
        rec[f"{prefix}_{col.lower()}_mean"] = float(pd.to_numeric(part[col], errors="coerce").mean())


def add_causal_lag_features(
    df: pd.DataFrame,
    n_lags: int = 11,
    chronology: str = "condition_global_timestamp",
    gap_seconds: float = 600.0,
) -> pd.DataFrame:
    out = df.sort_values(["condition", "first_timestamp"]).copy()
    out["chronology_sequence_id"] = 0

    if chronology == "condition_global_timestamp":
        group_cols = ["condition"]
    elif chronology == "global_timestamp_reset_gap":
        seq_parts = []
        for condition, group in out.groupby("condition", sort=False):
            group = group.sort_values("first_timestamp").copy()
            gap_reset = group["first_timestamp"].diff().fillna(0) > gap_seconds
            group["chronology_sequence_id"] = gap_reset.cumsum().astype(int)
            seq_parts.append(group)
        out = pd.concat(seq_parts, ignore_index=True).sort_values(["condition", "first_timestamp"]).copy()
        group_cols = ["condition", "chronology_sequence_id"]
    else:
        raise ValueError(f"Unknown chronology: {chronology}")

    for lag in range(1, n_lags + 1):
        out[f"mrr_lag_{lag}"] = out.groupby(group_cols)[TARGET].shift(lag)
    return out


def lag_boundary_audit(df: pd.DataFrame, n_lags: int = 11) -> pd.DataFrame:
    rows = []
    for lag in range(1, n_lags + 1):
        valid = df[f"mrr_lag_{lag}"].notna()
        expected = df.groupby(["condition", "chronology_sequence_id"])[TARGET].shift(lag)
        mismatch = valid & ~np.isclose(df[f"mrr_lag_{lag}"], expected, equal_nan=True)
        rows.append(
            {
                "lag": lag,
                "non_null_lag_rows": int(valid.sum()),
                "boundary_crossing_violations": int(mismatch.sum()),
            }
        )
    return pd.DataFrame(rows)


def assert_di2017_feature_count() -> None:
    base_feature_count = (
        11
        + 2
        + len(WEAR_COLS) * 3 * 2
        + len(PRESSURE_COLS) * 3 * 2
        + len(FLOW_COLS) * 3 * 2
        + len(ROTATION_COLS) * 1 * 2
    )
    fold_only_neighbor_count = 10
    expected = base_feature_count + fold_only_neighbor_count
    if expected != PAPER_FEATURE_COUNT:
        raise AssertionError(f"Di 2017 feature count mismatch: expected {PAPER_FEATURE_COUNT}, got {expected}")


def _usage_neighbor_base_cols(df: pd.DataFrame) -> list[str]:
    cols = []
    for col in df.columns:
        lower = col.lower()
        if "usage_of_" in lower and (lower.endswith("_mean") or lower.endswith("_std") or lower.endswith("_decreasing_rate")):
            cols.append(col)
    return cols


def add_fold_neighbor_features(
    X_train_base: pd.DataFrame,
    y_train: pd.Series,
    X_eval_base: pd.DataFrame,
    base_cols: list[str],
    n_neighbors: int = 10,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    train = X_train_base.copy()
    eval_ = X_eval_base.copy()
    if len(train) <= n_neighbors:
        for k in range(1, n_neighbors + 1):
            train[f"neighbor_mrr_{k}"] = y_train.mean()
            eval_[f"neighbor_mrr_{k}"] = y_train.mean()
        return train, eval_

    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    train_usage = scaler.fit_transform(imputer.fit_transform(train[base_cols]))
    eval_usage = scaler.transform(imputer.transform(eval_[base_cols]))

    nn_train = NearestNeighbors(n_neighbors=n_neighbors + 1)
    nn_train.fit(train_usage)
    train_idx = nn_train.kneighbors(train_usage, return_distance=False)[:, 1 : n_neighbors + 1]

    nn_eval = NearestNeighbors(n_neighbors=n_neighbors)
    nn_eval.fit(train_usage)
    eval_idx = nn_eval.kneighbors(eval_usage, return_distance=False)

    y_array = y_train.to_numpy()
    for k in range(n_neighbors):
        train[f"neighbor_mrr_{k + 1}"] = y_array[train_idx[:, k]]
        eval_[f"neighbor_mrr_{k + 1}"] = y_array[eval_idx[:, k]]
    return train, eval_


def selected_feature_columns(
    X: pd.DataFrame,
    y: pd.Series,
    max_features: int = 55,
    seed: int = 0,
    mode: str = "f_regression",
) -> list[str]:
    X_num = X.select_dtypes(include=[np.number]).drop(
        columns=["WAFER_ID", "first_timestamp", "last_timestamp", TARGET],
        errors="ignore",
    )
    X_num = X_num.dropna(axis=1, how="all")
    X_imp = SimpleImputer(strategy="median").fit_transform(X_num)

    f_scores, _ = f_regression(X_imp, y)
    f_scores = np.nan_to_num(f_scores, nan=0.0, posinf=0.0, neginf=0.0)
    f_rank = pd.Series(f_scores, index=X_num.columns).rank(ascending=False, method="first")

    if mode == "f_regression":
        return f_rank.sort_values().head(min(max_features, len(f_rank))).index.tolist()

    rf = RandomForestRegressor(n_estimators=80, random_state=seed, min_samples_leaf=3, n_jobs=1)
    rf.fit(X_imp, y)
    rf_rank = pd.Series(rf.feature_importances_, index=X_num.columns).rank(ascending=False, method="first")

    combined = (f_rank + rf_rank).sort_values()
    return combined.head(min(max_features, len(combined))).index.tolist()


def make_models(seed: int) -> dict[str, Any]:
    try:
        bagging = BaggingRegressor(
            estimator=DecisionTreeRegressor(random_state=seed),
            n_estimators=80,
            random_state=seed,
            n_jobs=1,
        )
    except TypeError:
        bagging = BaggingRegressor(
            base_estimator=DecisionTreeRegressor(random_state=seed),
            n_estimators=80,
            random_state=seed,
            n_jobs=1,
        )

    return {
        "knn": Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler()), ("model", KNeighborsRegressor(n_neighbors=9, weights="distance"))]),
        "svr": Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler()), ("model", SVR(C=30.0, epsilon=1.0, gamma="scale"))]),
        "linear_regression": Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler()), ("model", LinearRegression())]),
        "tree_bagging": Pipeline([("imputer", SimpleImputer(strategy="median")), ("model", bagging)]),
    }


def monte_carlo_cv(
    df: pd.DataFrame,
    n_splits: int,
    test_size: float,
    seed: int,
    selection_mode: str,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    usage_cols = _usage_neighbor_base_cols(df)
    all_rows = []
    prediction_rows = []

    for split_idx in range(n_splits):
        split_seed = int(rng.integers(0, 1_000_000_000))
        split_rng = np.random.default_rng(split_seed)
        model_errors_for_weights = []

        for condition, cond_df in df.groupby("condition"):
            cond_df = cond_df.sort_values("first_timestamp").reset_index(drop=True)
            n_test = max(1, int(round(len(cond_df) * test_size)))
            eval_idx = np.sort(split_rng.choice(cond_df.index.to_numpy(), size=n_test, replace=False))
            train_idx = np.array([i for i in cond_df.index if i not in set(eval_idx)])

            train_base = cond_df.loc[train_idx].copy()
            eval_base = cond_df.loc[eval_idx].copy()
            y_train = train_base[TARGET]
            y_eval = eval_base[TARGET]

            train_x, eval_x = add_fold_neighbor_features(train_base, y_train, eval_base, usage_cols)
            chosen = selected_feature_columns(train_x, y_train, seed=split_seed, mode=selection_mode)

            persistent_pred = eval_base["mrr_lag_1"].fillna(y_train.mean()).to_numpy()
            persistent_mse = mean_squared_error(y_eval, persistent_pred)
            all_rows.append({"split": split_idx, "condition": condition, "model": "persistent", "mse": persistent_mse, "n_eval": len(eval_base)})

            fold_preds: dict[str, np.ndarray] = {"persistent": persistent_pred}
            fold_mses: dict[str, float] = {"persistent": persistent_mse}

            for name, model in make_models(split_seed).items():
                fitted = clone(model)
                fitted.fit(train_x[chosen], y_train)
                pred = np.asarray(fitted.predict(eval_x[chosen])).reshape(-1)
                mse = mean_squared_error(y_eval, pred)
                fold_preds[name] = pred
                fold_mses[name] = mse
                all_rows.append({"split": split_idx, "condition": condition, "model": name, "mse": mse, "n_eval": len(eval_base)})

            base_model_names = ["knn", "svr", "linear_regression", "tree_bagging"]
            errors = np.array([max(fold_mses[m], 1e-9) for m in base_model_names], dtype=float)
            weights = (1.0 / errors**3)
            weights = weights / weights.sum()
            integrated_pred = sum(weights[i] * fold_preds[m] for i, m in enumerate(base_model_names))
            integrated_mse = mean_squared_error(y_eval, integrated_pred)
            all_rows.append({"split": split_idx, "condition": condition, "model": "integrated", "mse": integrated_mse, "n_eval": len(eval_base)})

            pred_frame = eval_base[["WAFER_ID", "STAGE", "condition", TARGET]].copy()
            pred_frame["split"] = split_idx
            for name, pred in {**fold_preds, "integrated": integrated_pred}.items():
                pred_frame[f"pred_{name}"] = pred
            prediction_rows.append(pred_frame)

            for model_name, mse in fold_mses.items():
                if model_name != "persistent":
                    model_errors_for_weights.append((condition, model_name, mse))

    return pd.DataFrame(all_rows), pd.concat(prediction_rows, ignore_index=True)


def summarize(results: pd.DataFrame) -> pd.DataFrame:
    by_cond = results.groupby(["model", "condition"])["mse"].agg(["mean", "std"]).reset_index()
    overall = (
        results.groupby(["split", "model"])
        .apply(lambda g: np.average(g["mse"], weights=g["n_eval"]))
        .rename("mse")
        .reset_index()
        .groupby("model")["mse"]
        .agg(["mean", "std"])
        .reset_index()
    )
    overall["condition"] = "Overall"
    summary = pd.concat([by_cond, overall], ignore_index=True)
    summary["paper_mean_mse"] = summary.apply(
        lambda r: PAPER_TABLE4_MEAN_MSE.get(r["model"], {}).get(r["condition"], np.nan), axis=1
    )
    summary["delta_vs_paper"] = summary["mean"] - summary["paper_mean_mse"]
    return summary.sort_values(["condition", "model"]).reset_index(drop=True)


def chronology_diagnostics(features: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    rows = []
    preview = []

    order_specs = [
        ("condition_global_timestamp", ["first_timestamp"]),
        ("condition_label_order", ["label_order"]),
        ("condition_file_raw_order", ["file_id_min", "raw_first_global_index"]),
        ("condition_wafer_id_numeric", ["WAFER_ID"]),
    ]

    for condition, group in features.groupby("condition"):
        for sequence_name, order_cols in order_specs:
            ordered = group.sort_values(order_cols).copy()
            ordered["prev_WAFER_ID"] = ordered["WAFER_ID"].shift(1)
            ordered["prev_mrr"] = ordered[TARGET].shift(1)
            valid = ordered["prev_mrr"].notna()
            rows.append(
                {
                    "condition": condition,
                    "sequence_definition": sequence_name,
                    "n_pairs": int(valid.sum()),
                    "persistent_mse": float(mean_squared_error(ordered.loc[valid, TARGET], ordered.loc[valid, "prev_mrr"])),
                }
            )

            if sequence_name == "condition_global_timestamp":
                preview.append(
                    ordered[
                        [
                            "condition",
                            "WAFER_ID",
                            "prev_WAFER_ID",
                            "STAGE",
                            "file_id_min",
                            "label_order",
                            "first_timestamp",
                            "last_timestamp",
                            TARGET,
                            "prev_mrr",
                        ]
                    ].head(30)
                )

        if "file_id_min" in group.columns:
            sq_errors = []
            for _, lot_group in group.groupby("file_id_min"):
                lot_group = lot_group.sort_values("first_timestamp")
                prev = lot_group[TARGET].shift(1)
                lot_valid = prev.notna()
                sq_errors.extend((lot_group.loc[lot_valid, TARGET] - prev.loc[lot_valid]).pow(2).tolist())
            rows.append(
                {
                    "condition": condition,
                    "sequence_definition": "reset_at_lot_file",
                    "n_pairs": len(sq_errors),
                    "persistent_mse": float(np.mean(sq_errors)) if sq_errors else np.nan,
                }
            )

    return pd.DataFrame(rows), pd.concat(preview, ignore_index=True)


def chronology_persistent_comparison(base_features: pd.DataFrame, gap_seconds: float = 600.0) -> pd.DataFrame:
    methods = [
        ("condition_global_timestamp", "condition_global_timestamp", None),
        ("condition_label_order", "condition_label_order", None),
        ("condition_file_raw_order", "condition_file_raw_order", None),
        ("condition_wafer_id_numeric", "condition_wafer_id_numeric", None),
        ("reset_at_lot_file", "reset_at_lot_file", None),
        (f"global_timestamp_reset_gap_{int(gap_seconds)}s", "global_timestamp_reset_gap", gap_seconds),
    ]
    rows = []

    for method_name, method, gap in methods:
        if method == "condition_global_timestamp":
            features = add_causal_lag_features(base_features, chronology="condition_global_timestamp")
        elif method == "global_timestamp_reset_gap":
            features = add_causal_lag_features(base_features, chronology="global_timestamp_reset_gap", gap_seconds=float(gap))
        elif method == "condition_label_order":
            parts = []
            for condition, group in base_features.groupby("condition"):
                group = group.sort_values("label_order").copy()
                group["mrr_lag_1"] = group[TARGET].shift(1)
                parts.append(group)
            features = pd.concat(parts, ignore_index=True)
        elif method == "condition_file_raw_order":
            parts = []
            for condition, group in base_features.groupby("condition"):
                group = group.sort_values(["file_id_min", "raw_first_global_index"]).copy()
                group["mrr_lag_1"] = group[TARGET].shift(1)
                parts.append(group)
            features = pd.concat(parts, ignore_index=True)
        elif method == "condition_wafer_id_numeric":
            parts = []
            for condition, group in base_features.groupby("condition"):
                group = group.sort_values("WAFER_ID").copy()
                group["mrr_lag_1"] = group[TARGET].shift(1)
                parts.append(group)
            features = pd.concat(parts, ignore_index=True)
        elif method == "reset_at_lot_file":
            parts = []
            for _, group in base_features.groupby(["condition", "file_id_min"]):
                group = group.sort_values("first_timestamp").copy()
                group["mrr_lag_1"] = group[TARGET].shift(1)
                parts.append(group)
            features = pd.concat(parts, ignore_index=True)
        else:
            raise ValueError(method)

        for condition, group in features.groupby("condition"):
            valid = group["mrr_lag_1"].notna()
            mse = mean_squared_error(group.loc[valid, TARGET], group.loc[valid, "mrr_lag_1"]) if valid.any() else np.nan
            paper_mse = PAPER_TABLE4_MEAN_MSE["persistent"][condition]
            rows.append(
                {
                    "chronology_method": method_name,
                    "condition": condition,
                    "mse": float(mse),
                    "paper_mse": paper_mse,
                    "absolute_gap": abs(float(mse) - paper_mse),
                    "n_pairs": int(valid.sum()),
                }
            )
    return pd.DataFrame(rows)


def compare_against_previous_and_paper(summary: pd.DataFrame) -> pd.DataFrame:
    new_overall = summary[summary["condition"].eq("Overall")].set_index("model")["mean"].to_dict()
    rows = []
    for model, prev_mse in PREVIOUS_REPRODUCTION_OVERALL_MSE.items():
        new_mse = float(new_overall.get(model, np.nan))
        paper_mse = PAPER_TABLE4_MEAN_MSE[model]["Overall"]
        previous_gap = abs(prev_mse - paper_mse)
        new_gap = abs(new_mse - paper_mse)
        rows.append(
            {
                "model": model,
                "Previous_Reproduction_MSE": prev_mse,
                "New_600s_125Feature_MSE": new_mse,
                "Paper_MSE": paper_mse,
                "Previous_Gap": previous_gap,
                "New_Gap": new_gap,
                "Improvement": prev_mse - new_mse,
                "Gap_Reduction": previous_gap - new_gap,
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Best-effort Di et al. 2017 CMP MRR reproduction.")
    parser.add_argument("--cmp1-dir", default=None)
    parser.add_argument("--output-dir", default=None)
    parser.add_argument("--n-splits", type=int, default=20)
    parser.add_argument("--test-size", type=float, default=0.20)
    parser.add_argument("--seed", type=int, default=2017)
    parser.add_argument(
        "--chronology",
        choices=["condition_global_timestamp", "global_timestamp_reset_gap"],
        default="condition_global_timestamp",
        help="MRR lag chronology. Use global_timestamp_reset_gap with --gap-seconds 600 for the current Di 2017 hypothesis.",
    )
    parser.add_argument("--gap-seconds", type=float, default=600.0)
    parser.add_argument(
        "--selection-mode",
        choices=["f_regression", "f_regression_oob"],
        default="f_regression",
        help="Fast t-test-like selection or slower t-test + RF OOB-style importance approximation.",
    )
    args = parser.parse_args()

    warnings.filterwarnings("ignore", category=FutureWarning)
    warnings.filterwarnings("ignore", category=DeprecationWarning)

    root = Path(args.cmp1_dir) if args.cmp1_dir else cmp1_dir()
    if args.output_dir:
        out_dir = Path(args.output_dir)
    elif args.chronology == "global_timestamp_reset_gap":
        out_dir = repo_root() / "results" / f"di2017_reproduction_{int(args.gap_seconds)}s_125feature"
    else:
        out_dir = repo_root() / "results" / "di2017_reproduction"
    out_dir.mkdir(parents=True, exist_ok=True)

    assert_di2017_feature_count()
    base_features = _load_trace_groups(root)
    features = add_causal_lag_features(
        base_features,
        chronology=args.chronology,
        gap_seconds=args.gap_seconds,
    )
    features.to_csv(out_dir / "di2017_feature_table.csv", index=False)
    lag_audit = lag_boundary_audit(features)
    lag_audit.to_csv(out_dir / "lag_boundary_audit.csv", index=False)
    diag, preview = chronology_diagnostics(features)
    diag.to_csv(out_dir / "chronology_persistent_diagnostics.csv", index=False)
    preview.to_csv(out_dir / "chronology_first30_by_condition.csv", index=False)
    chronology_comparison = chronology_persistent_comparison(base_features, gap_seconds=args.gap_seconds)
    chronology_comparison.to_csv(out_dir / "chronology_persistent_comparison.csv", index=False)

    results, predictions = monte_carlo_cv(features, args.n_splits, args.test_size, args.seed, args.selection_mode)
    summary = summarize(results)
    comparison = compare_against_previous_and_paper(summary)

    results.to_csv(out_dir / "cv_fold_metrics.csv", index=False)
    predictions.to_csv(out_dir / "cv_predictions.csv", index=False)
    summary.to_csv(out_dir / "summary_vs_paper_table4.csv", index=False)
    comparison.to_csv(out_dir / "summary_600s_vs_previous_vs_paper.csv", index=False)

    run_info = {
        "paper": "Di, Jia, Lee 2017",
        "target_table": "Table 4, 20 Monte Carlo CV MSE",
        "rows": int(len(features)),
        "condition_counts": features["condition"].value_counts().to_dict(),
        "n_splits": args.n_splits,
        "test_size": args.test_size,
        "seed": args.seed,
        "selection_mode": args.selection_mode,
        "chronology": args.chronology,
        "gap_seconds": args.gap_seconds,
        "expected_feature_count": PAPER_FEATURE_COUNT,
        "lag_boundary_violations": int(lag_audit["boundary_crossing_violations"].sum()),
        "limitations": [
            "Official PHM validation/test labels are not present, so Table 5 is not reproduced.",
            "Four mirrored labels above 500 are treated as anomalies and excluded.",
            "DRESSING_WATER_STATUS is interpreted as the fourth flow/status variable to match the paper's 24 flow/status features.",
            "Usage decreasing_rate is implemented as (last - first) / polishing_time; the paper does not fully specify the sign convention.",
            "Feature selection approximates the paper's repeated t-test and OOB voting with f-regression plus random-forest importance per fold.",
            "The exact paper hyperparameters are not fully specified; sklearn defaults/tuned conservative values are used.",
        ],
    }
    (out_dir / "run_info.json").write_text(json.dumps(run_info, indent=2), encoding="utf-8")

    print(summary.to_string(index=False))
    print("\nOverall comparison:")
    print(comparison.to_string(index=False))
    print(f"\nSaved Di 2017 reproduction outputs to: {out_dir}")


if __name__ == "__main__":
    main()
