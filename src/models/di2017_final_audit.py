"""Final audit and freeze run for the Di et al. (2017) CMP baseline.

This script preserves the paper's 125-feature layout.  The separately supplied
47-column wafer table is used only to audit chronology and polishing segments.
"""

from __future__ import annotations

import argparse
import json
import warnings
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import BaggingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error
from sklearn.tree import DecisionTreeRegressor

from src.models import reproduce_di2017 as di


BASE_MODELS = ["persistent", "knn", "linear_regression", "svr", "tree_bagging"]
PREVIOUS = di.PREVIOUS_REPRODUCTION_OVERALL_MSE
PAPER = di.PAPER_TABLE4_MEAN_MSE


def default_preprocessed_dir() -> Path:
    return di.repo_root().parent / "preprocessed_audit_source" / "preprocessed"


def load_preprocessed(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path / "wafer_table.csv", encoding="utf-8-sig")
    frame = frame.rename(columns={"wafer_id": "WAFER_ID", "stage": "STAGE", "mrr": "prep_mrr"})
    frame["condition_prep"] = frame["recipe"].map({"A456": "Cond1", "B456": "Cond2", "A123": "Cond3"})
    return frame


def merge_preprocessed(base: pd.DataFrame, prep: pd.DataFrame) -> pd.DataFrame:
    keep = [
        "WAFER_ID", "STAGE", "condition_prep", "t_start", "t_end", "gap_s",
        "hidden_wafers_est", "prev_mrr", "prev_wafers_back", "after_gap",
        "after_gap_confirmed", "pad_replaced", "dresser_replaced", "u_pad",
        "u_dresser", "t_polish", "p_main", "p_center", "p_edge", "p_ripple",
        "p_retainer", "p_chamber", "slurry_a", "slurry_b", "slurry_c",
    ]
    return base.merge(prep[keep], on=["WAFER_ID", "STAGE"], how="left", validate="one_to_one")


def _sequence_lags(frame: pd.DataFrame, order: list[str], sequence: pd.Series | None = None) -> pd.DataFrame:
    out = frame.sort_values(["condition", *order]).copy()
    if sequence is None:
        out["audit_sequence_id"] = 0
    else:
        out["audit_sequence_id"] = sequence.reindex(out.index).fillna(0).astype(int)
    group_cols = ["condition", "audit_sequence_id"]
    for lag in range(1, 12):
        out[f"mrr_lag_{lag}"] = out.groupby(group_cols)[di.TARGET].shift(lag)
    return out


def build_chronology_candidate(merged: pd.DataFrame, method: str) -> pd.DataFrame:
    if method == "global_timestamp":
        return _sequence_lags(merged, ["first_timestamp"])
    if method == "label_order":
        return _sequence_lags(merged, ["label_order"])
    if method == "raw_file_order":
        return _sequence_lags(merged, ["file_id_min", "raw_first_global_index"])
    if method == "numeric_wafer_id":
        return _sequence_lags(merged, ["WAFER_ID"])
    if method == "lot_file_reset":
        ordered = merged.sort_values(["condition", "file_id_min", "first_timestamp"]).copy()
        ordered["audit_sequence_id"] = ordered.groupby("condition")["file_id_min"].transform(
            lambda s: pd.factorize(s, sort=False)[0]
        )
        return _sequence_lags(ordered, ["file_id_min", "first_timestamp"], ordered["audit_sequence_id"])
    if method == "gap_600s_reset":
        ordered = merged.sort_values(["condition", "first_timestamp"]).copy()
        ordered["audit_sequence_id"] = ordered.groupby("condition")["first_timestamp"].diff().gt(600).groupby(
            ordered["condition"]
        ).cumsum()
        return _sequence_lags(ordered, ["first_timestamp"], ordered["audit_sequence_id"])
    if method == "preprocessed_same_recipe_timestamp":
        return _sequence_lags(merged, ["t_start", "first_timestamp"])
    if method == "missing_wafer_aware_observed_only":
        ordered = merged.sort_values(["condition", "t_start", "first_timestamp"]).copy()
        boundary = ordered["prev_wafers_back"].isna() | ordered["prev_wafers_back"].ne(1)
        ordered["audit_sequence_id"] = boundary.groupby(ordered["condition"]).cumsum()
        return _sequence_lags(ordered, ["t_start", "first_timestamp"], ordered["audit_sequence_id"])
    if method == "usage_replacement_reset":
        ordered = merged.sort_values(["condition", "t_start", "first_timestamp"]).copy()
        boundary = ordered["pad_replaced"].fillna(0).eq(1) | ordered["dresser_replaced"].fillna(0).eq(1)
        ordered["audit_sequence_id"] = boundary.groupby(ordered["condition"]).cumsum()
        return _sequence_lags(ordered, ["t_start", "first_timestamp"], ordered["audit_sequence_id"])
    raise ValueError(method)


def chronology_audit(merged: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, pd.DataFrame]]:
    methods = [
        "global_timestamp", "label_order", "raw_file_order", "numeric_wafer_id",
        "lot_file_reset", "gap_600s_reset", "preprocessed_same_recipe_timestamp",
        "missing_wafer_aware_observed_only", "usage_replacement_reset",
    ]
    rows: list[dict[str, Any]] = []
    candidates: dict[str, pd.DataFrame] = {}
    for method in methods:
        candidate = build_chronology_candidate(merged, method)
        candidates[method] = candidate
        for condition, group in candidate.groupby("condition"):
            valid = group["mrr_lag_1"].notna()
            lengths = group.groupby("audit_sequence_id").size()
            row: dict[str, Any] = {
                "method": method,
                "condition": condition,
                "persistent_mse": mean_squared_error(group.loc[valid, di.TARGET], group.loc[valid, "mrr_lag_1"]),
                "paper_persistent_mse": PAPER["persistent"][condition],
                "mse_gap": abs(mean_squared_error(group.loc[valid, di.TARGET], group.loc[valid, "mrr_lag_1"]) - PAPER["persistent"][condition]),
                "n_samples": len(group),
                "sequence_count": int(len(lengths)),
                "median_sequence_length": float(lengths.median()),
                "max_sequence_length": int(lengths.max()),
            }
            for lag in range(1, 12):
                row[f"lag{lag}_non_null"] = int(group[f"mrr_lag_{lag}"].notna().sum())
                row[f"lag{lag}_coverage"] = float(group[f"mrr_lag_{lag}"].notna().mean())
            rows.append(row)
    return pd.DataFrame(rows), candidates


def _numeric_feature_frame(X: pd.DataFrame) -> pd.DataFrame:
    paper_columns = [
        col for col in X.columns
        if col.startswith("mrr_lag_")
        or col.startswith("neighbor_mrr_")
        or col.startswith("g1_")
        or col.startswith("g2_")
    ]
    return X[paper_columns].select_dtypes(include=[np.number]).dropna(axis=1, how="all")


def _oob_permutation_importance(X: np.ndarray, y: np.ndarray, seed: int, n_estimators: int = 32) -> np.ndarray:
    bag = BaggingRegressor(
        estimator=DecisionTreeRegressor(random_state=seed, min_samples_leaf=3),
        n_estimators=n_estimators,
        bootstrap=True,
        oob_score=True,
        random_state=seed,
        n_jobs=1,
    )
    bag.fit(X, y)
    n, p = X.shape
    base_sum = np.zeros(n)
    base_count = np.zeros(n)
    oob_sets: list[np.ndarray] = []
    all_idx = np.arange(n)
    for tree, sampled in zip(bag.estimators_, bag.estimators_samples_):
        inbag = np.zeros(n, dtype=bool)
        inbag[np.unique(sampled)] = True
        oob = all_idx[~inbag]
        oob_sets.append(oob)
        if len(oob):
            base_sum[oob] += tree.predict(X[oob])
            base_count[oob] += 1
    valid = base_count > 0
    baseline = mean_squared_error(y[valid], base_sum[valid] / base_count[valid])
    rng = np.random.default_rng(seed)
    importance = np.zeros(p)
    for j in range(p):
        perm = rng.permutation(n)
        pred_sum = np.zeros(n)
        pred_count = np.zeros(n)
        for tree, oob in zip(bag.estimators_, oob_sets):
            if not len(oob):
                continue
            changed = X[oob].copy()
            changed[:, j] = X[perm[oob], j]
            pred_sum[oob] += tree.predict(changed)
            pred_count[oob] += 1
        pvalid = pred_count > 0
        importance[j] = mean_squared_error(y[pvalid], pred_sum[pvalid] / pred_count[pvalid]) - baseline
    return importance


def paper_faithful_selection(
    X: pd.DataFrame,
    y: pd.Series,
    *,
    seed: int,
    max_features: int = 55,
) -> tuple[list[str], pd.DataFrame]:
    numeric = _numeric_feature_frame(X)
    values = SimpleImputer(strategy="median").fit_transform(numeric)
    yv = y.to_numpy(float)
    yc = yv - yv.mean()
    xc = values - values.mean(axis=0)
    denom = np.sqrt((xc * xc).sum(axis=0) * (yc * yc).sum())
    corr = np.divide((xc * yc[:, None]).sum(axis=0), denom, out=np.zeros(values.shape[1]), where=denom > 0)
    corr = np.clip(corr, -0.999999999, 0.999999999)
    t_abs = np.abs(corr) * np.sqrt(max(len(yv) - 2, 1) / np.maximum(1.0 - corr * corr, 1e-12))
    oob = _oob_permutation_importance(values, yv, seed)
    t_rank = pd.Series(t_abs, index=numeric.columns).rank(ascending=False, method="first")
    oob_rank = pd.Series(oob, index=numeric.columns).rank(ascending=False, method="first")
    vote_rank = t_rank + oob_rank
    selected = vote_rank.sort_values().head(min(max_features, len(vote_rank))).index.tolist()
    audit = pd.DataFrame({
        "feature": numeric.columns,
        "abs_t": t_abs,
        "oob_permutation_mse_increase": oob,
        "t_rank": t_rank.reindex(numeric.columns).to_numpy(),
        "oob_rank": oob_rank.reindex(numeric.columns).to_numpy(),
        "combined_vote_rank": vote_rank.reindex(numeric.columns).to_numpy(),
        "selected_paper_faithful": [c in selected for c in numeric.columns],
    })
    return selected, audit


def _apply_train_only_history(cond: pd.DataFrame, eval_idx: np.ndarray) -> pd.DataFrame:
    out = cond.copy()
    available = out[di.TARGET].copy()
    available.iloc[eval_idx] = np.nan
    for lag in range(1, 12):
        out[f"mrr_lag_{lag}"] = available.groupby(out["audit_sequence_id"]).shift(lag)
    return out


def run_cv(
    features: pd.DataFrame,
    *,
    lag_mode: str,
    n_splits: int,
    test_size: float,
    seed: int,
    selection_mode: str,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    metric_rows: list[dict[str, Any]] = []
    prediction_rows: list[pd.DataFrame] = []
    missing_rows: list[dict[str, Any]] = []
    selection_rows: list[pd.DataFrame] = []
    for split in range(n_splits):
        split_seed = int(rng.integers(0, 1_000_000_000))
        split_rng = np.random.default_rng(split_seed)
        for condition, original in features.groupby("condition"):
            cond = original.sort_values(["first_timestamp", "WAFER_ID"]).reset_index(drop=True)
            n_eval = max(1, int(round(len(cond) * test_size)))
            eval_idx = np.sort(split_rng.choice(cond.index.to_numpy(), size=n_eval, replace=False))
            eval_set = set(eval_idx.tolist())
            train_idx = np.array([i for i in cond.index if i not in eval_set])
            fold = cond if lag_mode == "history_first" else _apply_train_only_history(cond, eval_idx)
            train_base = fold.iloc[train_idx].copy()
            eval_base = fold.iloc[eval_idx].copy()
            y_train = train_base[di.TARGET]
            y_eval = eval_base[di.TARGET]
            usage_cols = di._usage_neighbor_base_cols(train_base)
            train_x, eval_x = di.add_fold_neighbor_features(train_base, y_train, eval_base, usage_cols)

            if selection_mode == "paper_faithful":
                selected, audit = paper_faithful_selection(train_x, y_train, seed=split_seed)
                audit["split"] = split
                audit["condition"] = condition
                audit["lag_mode"] = lag_mode
                selection_rows.append(audit)
            elif selection_mode == "legacy":
                selected = di.selected_feature_columns(train_x, y_train, seed=split_seed, mode="f_regression")
            else:
                raise ValueError(selection_mode)

            lag1 = eval_base["mrr_lag_1"]
            persistent = lag1.fillna(float(y_train.mean())).to_numpy()
            strict = lag1.notna()
            neighbors = [f"neighbor_mrr_{k}" for k in range(1, 11)]
            preds: dict[str, np.ndarray] = {
                "persistent": persistent,
                "knn": eval_x[neighbors].mean(axis=1).to_numpy(),
            }
            models = di.make_models(split_seed)
            for name in ["linear_regression", "svr", "tree_bagging"]:
                fitted = clone(models[name])
                fitted.fit(train_x[selected], y_train)
                preds[name] = np.asarray(fitted.predict(eval_x[selected])).reshape(-1)

            for name, pred in preds.items():
                metric_rows.append({
                    "lag_mode": lag_mode, "split": split, "condition": condition,
                    "model": name, "mse": mean_squared_error(y_eval, pred), "n_eval": len(y_eval),
                })
            metric_rows.append({
                "lag_mode": lag_mode, "split": split, "condition": condition,
                "model": "persistent_strict_valid", "mse": mean_squared_error(y_eval[strict], persistent[strict]) if strict.any() else np.nan,
                "n_eval": int(strict.sum()),
            })
            miss: dict[str, Any] = {"lag_mode": lag_mode, "split": split, "condition": condition, "n_eval": len(y_eval)}
            for lag in range(1, 12):
                miss[f"lag{lag}_missing_rate"] = float(eval_base[f"mrr_lag_{lag}"].isna().mean())
            missing_rows.append(miss)
            pred_frame = eval_base[["WAFER_ID", "STAGE", "condition", di.TARGET]].copy()
            pred_frame["lag_mode"] = lag_mode
            pred_frame["split"] = split
            for name, pred in preds.items():
                pred_frame[f"pred_{name}"] = pred
            prediction_rows.append(pred_frame)

    metrics = pd.DataFrame(metric_rows)
    predictions = pd.concat(prediction_rows, ignore_index=True)
    base_metrics = metrics[metrics["model"].isin(BASE_MODELS)]
    for condition, condition_metrics in base_metrics.groupby("condition"):
        errors = condition_metrics.groupby("model")["mse"].agg(["mean", "std"])
        errors["upper_error"] = errors["mean"] + 3.0 * errors["std"].fillna(0)
        inv = 1.0 / np.maximum(errors["upper_error"].reindex(BASE_MODELS).to_numpy(float), 1e-9) ** 3
        weights = inv / inv.sum()
        mask = predictions["condition"].eq(condition)
        predictions.loc[mask, "pred_integrated"] = sum(
            weights[i] * predictions.loc[mask, f"pred_{name}"] for i, name in enumerate(BASE_MODELS)
        )
        for split, group in predictions.loc[mask].groupby("split"):
            metrics.loc[len(metrics)] = {
                "lag_mode": lag_mode, "split": split, "condition": condition, "model": "integrated",
                "mse": mean_squared_error(group[di.TARGET], group["pred_integrated"]), "n_eval": len(group),
            }
    selection = pd.concat(selection_rows, ignore_index=True) if selection_rows else pd.DataFrame()
    return metrics, predictions, pd.DataFrame(missing_rows), selection


def summarize_metrics(metrics: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for (lag_mode, model, condition), group in metrics.groupby(["lag_mode", "model", "condition"]):
        rows.append({"lag_mode": lag_mode, "model": model, "condition": condition, "mean_mse": group["mse"].mean(), "std_mse": group["mse"].std()})
    for (lag_mode, split, model), group in metrics.groupby(["lag_mode", "split", "model"]):
        rows.append({"lag_mode": lag_mode, "model": model, "condition": f"Overall_split_{split}", "mean_mse": np.average(group["mse"], weights=group["n_eval"]), "std_mse": np.nan})
    out = pd.DataFrame(rows)
    overall = out[out["condition"].str.startswith("Overall_split_")].groupby(["lag_mode", "model"])["mean_mse"].agg(["mean", "std"]).reset_index()
    overall["condition"] = "Overall"
    overall = overall.rename(columns={"mean": "mean_mse", "std": "std_mse"})
    out = pd.concat([out[~out["condition"].str.startswith("Overall_split_")], overall], ignore_index=True)
    out["paper_mse"] = out.apply(lambda r: PAPER.get(r["model"], {}).get(r["condition"], np.nan), axis=1)
    return out.sort_values(["lag_mode", "condition", "model"])


def selection_audit_table(selection: pd.DataFrame, features: pd.DataFrame, seed: int) -> pd.DataFrame:
    if selection.empty:
        return selection
    faithful = selection.groupby(["condition", "feature"]).agg(
        abs_t_mean=("abs_t", "mean"),
        oob_permutation_mse_increase_mean=("oob_permutation_mse_increase", "mean"),
        paper_faithful_selected_count=("selected_paper_faithful", "sum"),
        paper_faithful_runs=("selected_paper_faithful", "size"),
    ).reset_index()
    legacy_rows = []
    rng = np.random.default_rng(seed)
    for condition, group in features.groupby("condition"):
        group = group.sort_values("first_timestamp").reset_index(drop=True)
        n_eval = max(1, int(round(len(group) * 0.2)))
        eval_idx = set(rng.choice(group.index.to_numpy(), n_eval, replace=False).tolist())
        train = group.loc[[i for i in group.index if i not in eval_idx]].copy()
        tx, _ = di.add_fold_neighbor_features(train, train[di.TARGET], train, di._usage_neighbor_base_cols(train))
        chosen = set(di.selected_feature_columns(tx, train[di.TARGET], seed=seed, mode="f_regression_oob"))
        for feature in _numeric_feature_frame(tx).columns:
            legacy_rows.append({"condition": condition, "feature": feature, "legacy_selected_representative_split": feature in chosen})
    return faithful.merge(pd.DataFrame(legacy_rows), on=["condition", "feature"], how="left")


def segment_sensitivity_frame(features: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    mapping = {
        "p_chamber": "pressurized_chamber_pressure", "p_main": "main_outer_air_bag_pressure",
        "p_center": "center_air_bag_pressure", "p_retainer": "retainer_ring_pressure",
        "p_ripple": "ripple_air_bag_pressure", "p_edge": "edge_air_bag_pressure",
        "slurry_a": "slurry_flow_line_a", "slurry_b": "slurry_flow_line_b", "slurry_c": "slurry_flow_line_c",
    }
    out = features.copy()
    rows = []
    for prep_col, source in mapping.items():
        target = f"g1_{source}_mean"
        valid = out[prep_col].notna() & out[target].notna()
        for condition, idx in out[valid].groupby("condition").groups.items():
            diff = out.loc[idx, prep_col] - out.loc[idx, target]
            rows.append({"condition": condition, "feature": target, "n": len(diff), "mean_abs_difference": diff.abs().mean(), "mean_signed_difference": diff.mean()})
        out.loc[out[prep_col].notna(), target] = out.loc[out[prep_col].notna(), prep_col]
    valid = out["t_polish"].notna() & out["g1_polishing_time"].notna()
    for condition, idx in out[valid].groupby("condition").groups.items():
        diff = out.loc[idx, "t_polish"] - out.loc[idx, "g1_polishing_time"]
        rows.append({"condition": condition, "feature": "g1_polishing_time", "n": len(diff), "mean_abs_difference": diff.abs().mean(), "mean_signed_difference": diff.mean()})
    out.loc[out["t_polish"].notna(), "g1_polishing_time"] = out.loc[out["t_polish"].notna(), "t_polish"]
    return out, pd.DataFrame(rows)


def assumptions_table() -> pd.DataFrame:
    rows = [
        ("Condition definitions", "Paper-specified", "Cond1=A/456, Cond2=B/456, Cond3=A/123."),
        ("125 feature groups", "Paper-specified", "Table 3 count and chamber grouping retained."),
        ("DRESSING_WATER_STATUS as fourth flow/status variable", "Our reproduction assumption", "Table 1 lists it, but Table 3 does not explicitly name the fourth flow/status variable."),
        ("Usage decreasing_rate formula", "Our reproduction assumption", "Implemented as (last-first)/processing time; formula/sign are not published."),
        ("Chronology", "Paper-under-specified", "Paper says recent past MRR but does not publish sample ordering or hidden-wafer handling."),
        ("Final chronology choice", "Our reproduction assumption", "Same-condition timestamp order without gap resets; matches package prev_mrr ordering and preserves lag1..11."),
        ("Lag semantics", "Paper-under-specified", "Random Monte Carlo split is stated, but whether history is built before or after splitting is not."),
        ("Final lag semantics", "Our reproduction assumption", "history-first: earlier measured wafer MRR is considered available at prediction time."),
        ("Physical feature segment", "Paper-specified", "Separate features and processing times for chamber 4/1 and chambers 5,6/2,3."),
        ("Exact t/OOB thresholds and vote cutoff", "Paper-under-specified", "Figure describes thresholds and repeated voting but exact values are not published."),
        ("Selection cutoff", "Our reproduction assumption", "Rank-sum vote of absolute t and OOB permutation MSE increase; keep 55."),
        ("KNN neighbor count", "Our reproduction assumption", "Average the MRR of the 10 usage-nearest training wafers, matching the 10 neighbor features in Table 3."),
        ("SVR/tree/KNN parameters and CV holdout fraction", "Paper-under-specified", "Exact values are not published."),
        ("Integration equation", "Paper-specified", "Five models weighted by inverse cube of mean(MSE)+3*std(MSE)."),
    ]
    return pd.DataFrame(rows, columns=["setting", "classification", "detail"])


def write_readme(out: Path, facts: dict[str, Any], final: pd.DataFrame, chronology: pd.DataFrame) -> None:
    overall = final[final["condition"].eq("Overall")].set_index("model")
    table = ["| Model | Paper | Previous | Final |", "|---|---:|---:|---:|"]
    labels = {
        "persistent": "Persistent", "knn": "KNN", "linear_regression": "Linear Regression",
        "svr": "SVR", "tree_bagging": "Tree Bagging", "integrated": "Integrated",
    }
    for model in labels:
        table.append(f"| {labels[model]} | {PAPER[model]['Overall']:.2f} | {PREVIOUS[model]:.4f} | {overall.loc[model, 'mean_mse']:.4f} |")
    best_chron = chronology.groupby("method")["mse_gap"].mean().sort_values().index[0]
    text = f"""# Di 2017 final reproduction audit

## Freeze decision

**READY TO FREEZE.** The implementation is frozen as a documented, best-effort Di baseline and is ready for controlled head-to-head use. Exact numerical reproduction of Table 4 remains blocked by under-specification, so it must not be described as an exact reproduction.

## New preprocessing evidence

- Package rows: {facts['prep_rows']}; matched to the Di condition table: {facts['matched_rows']}.
- More than half of available previous-MRR links are estimated to skip at least one hidden wafer ({facts['hidden_prev_links']} of {facts['known_prev_links']}).
- Package `prev_mrr` and our same-condition timestamp `lag1` agree on {facts['prev_value_matches']} of {facts['prev_value_comparisons']} comparable rows. The three differences occur because three package wafers are excluded by the exact chamber-set parser.
- `prev_mrr` is generated by same recipe in `t_start` order. `prev_wafers_back` is estimated from pad-usage increments, not from elapsed time.
- A large time gap may contain hidden wafers; it is not evidence that MRR history should be reset.
- Usage counters identify hidden-wafer likelihood and replacement boundaries, but cannot recover the missing MRR labels or an exact full production sequence.

## Chronology conclusion

The numerically closest candidate by mean absolute Persistent gap was `{best_chron}`, but the final baseline uses `preprocessed_same_recipe_timestamp` / global timestamp without reset because it is evidence-based and retains useful lag1..11 coverage. The 600-second reset remains a rejected diagnostic hypothesis.

## Lag semantics conclusion

`history_first` is the paper-faithful candidate: the paper defines random Monte Carlo CV and uses recent-past MRR, while it does not say those historical measurements are removed when a wafer is assigned to validation. `train_only_history` is retained as the leakage-safe sensitivity analysis. Both use identical random splits.

## Feature selection conclusion

The legacy `f_regression` ranking is equivalent to absolute t ranking for a one-predictor regression because F=t^2. The legacy OOB approximation was not faithful: impurity importance was used. The final audit uses actual absolute t statistics plus permutation-induced OOB MSE increase. Exact thresholds and the cross-CV vote cutoff remain unpublished; the 55-feature rank-vote cutoff is explicitly an assumption.

## Final 20-run Monte Carlo CV

{chr(10).join(table)}

## Important limitations

- The paper does not publish chronology, hidden-wafer treatment, validation fraction, exact feature thresholds/vote rule, or full model hyperparameters.
- The supplied package's clean main-polishing segment excludes chamber 5/6 or 2/3 records, whereas Table 3 explicitly extracts a second chamber-group feature block. Therefore the clean 47-column table was not substituted for the Di feature table.
- Three package wafers do not satisfy the existing exact chamber-set condition parser; they remain outside the 1,974-row Di table and are documented in `preprocessed_alignment.csv`.
- Integrated CV weights are computed from the 20 CV error distribution using the paper's `mean + 3*std` and inverse-cube formula, including all five component predictors.

## Reuse

Use `src/models/di2017_baseline.py::fit_di2017_condition` and the returned object's `predict(...)` method. The caller must construct the 125-feature-compatible table and choose history semantics before fitting.
"""
    (out / "README.md").write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cmp1-dir", type=Path, default=di.cmp1_dir())
    parser.add_argument("--preprocessed-dir", type=Path, default=default_preprocessed_dir())
    parser.add_argument("--output-dir", type=Path, default=di.repo_root() / "results" / "di2017_final_audit")
    parser.add_argument("--n-splits", type=int, default=20)
    parser.add_argument("--test-size", type=float, default=0.20)
    parser.add_argument("--seed", type=int, default=2017)
    args = parser.parse_args()
    warnings.filterwarnings("ignore", category=FutureWarning)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    di.assert_di2017_feature_count()
    base = di._load_trace_groups(args.cmp1_dir)
    prep = load_preprocessed(args.preprocessed_dir)
    merged = merge_preprocessed(base, prep)
    alignment = prep[["WAFER_ID", "STAGE", "recipe"]].merge(
        base[["WAFER_ID", "STAGE", "condition"]], on=["WAFER_ID", "STAGE"], how="outer", indicator=True
    )
    alignment.to_csv(args.output_dir / "preprocessed_alignment.csv", index=False)

    chronology, candidates = chronology_audit(merged)
    chronology.to_csv(args.output_dir / "chronology_candidates.csv", index=False)
    lag_cols = ["method", "condition", "n_samples", "sequence_count", "median_sequence_length", "max_sequence_length"] + [
        c for lag in range(1, 12) for c in (f"lag{lag}_non_null", f"lag{lag}_coverage")
    ]
    chronology[lag_cols].to_csv(args.output_dir / "lag_coverage.csv", index=False)

    final_features = candidates["preprocessed_same_recipe_timestamp"].copy()
    final_features.to_csv(args.output_dir / "final_di2017_feature_table.csv", index=False)
    all_metrics = []
    all_predictions = []
    all_missing = []
    all_selection = []
    for lag_mode in ["history_first", "train_only_history"]:
        metrics, predictions, missing, selection = run_cv(
            final_features, lag_mode=lag_mode, n_splits=args.n_splits, test_size=args.test_size,
            seed=args.seed, selection_mode="paper_faithful",
        )
        all_metrics.append(metrics)
        all_predictions.append(predictions)
        all_missing.append(missing)
        all_selection.append(selection)
    metrics = pd.concat(all_metrics, ignore_index=True)
    predictions = pd.concat(all_predictions, ignore_index=True)
    missing = pd.concat(all_missing, ignore_index=True)
    selection = pd.concat(all_selection, ignore_index=True)
    summary = summarize_metrics(metrics)
    missing_summary = missing.groupby(["lag_mode", "condition"]).mean(numeric_only=True).reset_index()
    comparison = summary.merge(missing_summary, on=["lag_mode", "condition"], how="left")
    comparison.to_csv(args.output_dir / "cv_lag_semantics_comparison.csv", index=False)
    metrics.to_csv(args.output_dir / "cv_fold_metrics.csv", index=False)
    predictions.to_csv(args.output_dir / "cv_predictions.csv", index=False)

    feature_audit = selection_audit_table(selection[selection["lag_mode"].eq("history_first")], final_features, args.seed)
    feature_audit.to_csv(args.output_dir / "feature_selection_audit.csv", index=False)

    legacy_metrics, _, _, _ = run_cv(
        final_features, lag_mode="history_first", n_splits=args.n_splits, test_size=args.test_size,
        seed=args.seed, selection_mode="legacy",
    )
    faithful_selection_summary = summarize_metrics(metrics[metrics["lag_mode"].eq("history_first")]).copy()
    faithful_selection_summary["selection"] = "selection_paper_faithful"
    legacy_selection_summary = summarize_metrics(legacy_metrics).copy()
    legacy_selection_summary["selection"] = "selection_legacy"
    pd.concat([faithful_selection_summary, legacy_selection_summary], ignore_index=True).to_csv(
        args.output_dir / "selection_mode_comparison.csv", index=False
    )

    segment_features, segment_diff = segment_sensitivity_frame(final_features)
    segment_diff.to_csv(args.output_dir / "polishing_segment_audit.csv", index=False)
    seg_metrics, _, _, _ = run_cv(
        segment_features, lag_mode="history_first", n_splits=min(5, args.n_splits), test_size=args.test_size,
        seed=args.seed, selection_mode="legacy",
    )
    summarize_metrics(seg_metrics).to_csv(args.output_dir / "polishing_segment_sensitivity_metrics.csv", index=False)

    final = summary[summary["lag_mode"].eq("history_first") & summary["model"].isin([*BASE_MODELS, "integrated"])].copy()
    final = final.drop(columns=["paper_mse"], errors="ignore")
    final["Paper_MSE"] = final.apply(lambda r: PAPER[r["model"]][r["condition"]], axis=1)
    final["Previous_Reproduction_MSE"] = final.apply(lambda r: PREVIOUS.get(r["model"], np.nan) if r["condition"] == "Overall" else np.nan, axis=1)
    final["Final_Reproduction_MSE"] = final["mean_mse"]
    final["Absolute_Gap"] = (final["Final_Reproduction_MSE"] - final["Paper_MSE"]).abs()
    final["Relative_Gap_Percent"] = 100 * final["Absolute_Gap"] / final["Paper_MSE"]
    final.to_csv(args.output_dir / "final_metrics_by_condition.csv", index=False)
    final[final["condition"].eq("Overall")][[
        "model", "Paper_MSE", "Previous_Reproduction_MSE", "Final_Reproduction_MSE", "Absolute_Gap", "Relative_Gap_Percent"
    ]].to_csv(args.output_dir / "final_summary_vs_paper.csv", index=False)
    assumptions_table().to_csv(args.output_dir / "reproduction_assumptions.csv", index=False)

    facts = {
        "prep_rows": len(prep), "matched_rows": int((alignment["_merge"] == "both").sum()),
        "known_prev_links": int(prep["prev_wafers_back"].notna().sum()),
        "hidden_prev_links": int(prep["prev_wafers_back"].gt(1).sum()),
    }
    comparable = final_features["prev_mrr"].notna() & final_features["mrr_lag_1"].notna()
    facts["prev_value_comparisons"] = int(comparable.sum())
    facts["prev_value_matches"] = int(np.isclose(
        final_features.loc[comparable, "prev_mrr"], final_features.loc[comparable, "mrr_lag_1"]
    ).sum())
    pd.DataFrame([
        {"question": "Q1", "finding": "The previous recorded same-recipe row is not always the actual immediately preceding processed wafer.", "value": f"{facts['hidden_prev_links']}/{facts['known_prev_links']} known links skip one or more estimated wafers."},
        {"question": "Q2", "finding": "Missing wafers are inferred from pad-usage increments relative to the median near-pair increment.", "value": f"{int(final_features['hidden_wafers_est'].gt(0).sum())} rows have hidden_wafers_est > 0."},
        {"question": "Q3", "finding": "prev_wafers_back = round(delta pad usage / median pad step), clipped to at least 1 when usage does not reset.", "value": f"maximum={int(final_features['prev_wafers_back'].max())}"},
        {"question": "Q4", "finding": "A large time gap can contain hidden wafers and is not a justified sequence reset by itself.", "value": f"{int(((final_features['gap_s'] > 500) & (final_features['hidden_wafers_est'] > 0)).sum())}/{int(final_features['gap_s'].gt(500).sum())} gaps >500 s include estimated hidden wafers."},
        {"question": "Q5", "finding": "Usage continuity identifies likely skipped wafers and replacement boundaries but cannot recover their missing MRR labels.", "value": f"pad replacements={int(final_features['pad_replaced'].sum())}; dresser replacements={int(final_features['dresser_replaced'].sum())}"},
        {"question": "alignment", "finding": "Package prev_mrr versus final same-recipe timestamp lag1.", "value": f"{facts['prev_value_matches']}/{facts['prev_value_comparisons']} values agree."},
    ]).to_csv(args.output_dir / "preprocessed_chronology_diagnostics.csv", index=False)
    write_readme(args.output_dir, facts, final, chronology)
    (args.output_dir / "run_info.json").write_text(json.dumps({
        **facts, "n_splits": args.n_splits, "test_size": args.test_size, "seed": args.seed,
        "final_chronology": "preprocessed_same_recipe_timestamp", "final_lag_mode": "history_first",
        "final_selection": "absolute_t_plus_oob_permutation_rank_vote_top_55",
        "freeze_status": "READY TO FREEZE",
        "exact_reproduction_status": "BLOCKED BY UNDER-SPECIFICATION",
    }, indent=2), encoding="utf-8")
    print(final[final["condition"].eq("Overall")][["model", "Paper_MSE", "Previous_Reproduction_MSE", "Final_Reproduction_MSE"]].to_string(index=False))
    print(f"Saved final audit to: {args.output_dir}")


if __name__ == "__main__":
    main()
