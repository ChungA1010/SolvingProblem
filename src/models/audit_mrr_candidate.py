"""Fixed Ridge stability, feature ablation, and measurement-delay audit.

Uses only A456/B456 rows and the existing chronological feature builder.
No model family, alpha, or feature selection is tuned from evaluation folds.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from src.models.train_mrr_chronological import (
    ALPHA, RIDGE_ALPHA, SENSOR_RECIPES, _fixed_regression,
    build_fold_features, load_prestart_snapshots, load_wafer_table,
)


FULL_FEATURES = ["recipe", "prev_mrr", "state_ewm"]
ABLATIONS = {
    "recipe only": ["recipe"],
    "prev_mrr only": ["prev_mrr"],
    "state_ewm only": ["state_ewm"],
    "recipe + prev_mrr": ["recipe", "prev_mrr"],
    "recipe + state_ewm": ["recipe", "state_ewm"],
    "prev_mrr + state_ewm": ["prev_mrr", "state_ewm"],
    "recipe + prev_mrr + state_ewm": FULL_FEATURES,
}
GROUPS = ["A456+B456", *SENSOR_RECIPES]


def _split(features: pd.DataFrame, fold: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    train = features[features.fold.lt(fold) & features.recipe.isin(SENSOR_RECIPES)]
    evaluation = features[features.fold.eq(fold) & features.recipe.isin(SENSOR_RECIPES)]
    assert train.fold.max() < fold and evaluation.fold.eq(fold).all()
    return train, evaluation


def _errors(model: str, fold: int, evaluation: pd.DataFrame, predicted: np.ndarray) -> list[dict]:
    result = []
    for recipe in GROUPS:
        mask = np.ones(len(evaluation), dtype=bool) if recipe == "A456+B456" else evaluation.recipe.eq(recipe).to_numpy()
        error = np.abs(evaluation.mrr.to_numpy()[mask] - np.asarray(predicted)[mask])
        result.append({"model": model, "fold": fold, "recipe": recipe,
                       "rows": int(mask.sum()), "mae": float(error.mean())})
    return result


def _summarize(fold_rows: list[dict], key: str = "model") -> pd.DataFrame:
    frame = pd.DataFrame(fold_rows)
    summary = []
    for (model, recipe), group in frame.groupby([key, "recipe"], sort=False):
        assert group.fold.nunique() == 4
        summary.append({key: model, "recipe": recipe, "rows": int(group.rows.sum()),
                        "weighted_mae": float(np.average(group.mae, weights=group.rows)),
                        "unweighted_mae": float(group.mae.mean())})
    return pd.DataFrame(summary)


def _coefficients(model, fold: int, kind: str) -> dict:
    """Report both z-score slopes and slopes/intercepts in original MRR units.

    One-hot recipe effects have a redundant intercept for unregularized OLS.
    Per-recipe intercepts and B-minus-A contrast remain identifiable.
    """
    prep = model.named_steps["preprocessing"]
    encoder = prep.named_transformers_["recipe"]
    assert list(encoder.categories_[0]) == SENSOR_RECIPES
    scaler = prep.named_transformers_["numeric"].named_steps["scaler"]
    coefficients = np.asarray(model.named_steps["model"].coef_, dtype=float)
    assert len(coefficients) == 4
    recipe_a, recipe_b, prev_z, state_z = coefficients
    prev_raw, state_raw = np.array([prev_z, state_z]) / scaler.scale_
    offset = prev_raw * scaler.mean_[0] + state_raw * scaler.mean_[1]
    intercept = float(model.named_steps["model"].intercept_)
    return {
        "fold": fold, "model": kind, "train_rows": int(model._audit_train_rows),
        "prev_mrr_coef_standardized": float(prev_z),
        "state_ewm_coef_standardized": float(state_z),
        "prev_mrr_coef_raw": float(prev_raw),
        "state_ewm_coef_raw": float(state_raw),
        "recipe_B_minus_A": float(recipe_b - recipe_a),
        "intercept_standardized": intercept,
        "A456_intercept_at_train_means": float(intercept + recipe_a),
        "B456_intercept_at_train_means": float(intercept + recipe_b),
        "A456_intercept_raw_zero": float(intercept + recipe_a - offset),
        "B456_intercept_raw_zero": float(intercept + recipe_b - offset),
        "train_prev_mrr_mean": float(scaler.mean_[0]),
        "train_state_ewm_mean": float(scaler.mean_[1]),
        "train_prev_mrr_scale": float(scaler.scale_[0]),
        "train_state_ewm_scale": float(scaler.scale_[1]),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wafer-table", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("results/mrr_protocol_audit"))
    args = parser.parse_args()
    frame = load_wafer_table(args.wafer_table)
    snapshots = load_prestart_snapshots(None, frame)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    ablation_rows, coefficient_rows, correlation_rows = [], [], []
    delay_rows = []
    for delay in (0, 1, 2):
        for fold in range(2, 6):
            features, _ = build_fold_features(frame, snapshots, fold, delay)
            train, evaluation = _split(features, fold)
            assert evaluation[["prev_mrr", "state_ewm"]].notna().all().all()
            means = train.groupby("recipe").mrr.mean()
            ewma = evaluation.state_ewm.fillna(evaluation.recipe.map(means)).to_numpy()
            delay_rows += [{**row, "delay_wafers": delay}
                           for row in _errors("EWMA", fold, evaluation, ewma)]

            ridge = _fixed_regression(FULL_FEATURES, "ridge")
            ridge.fit(train[FULL_FEATURES], train.mrr)
            ridge._audit_train_rows = len(train)
            ridge_predictions = ridge.predict(evaluation[FULL_FEATURES])
            delay_rows += [{**row, "delay_wafers": delay}
                           for row in _errors("3-feature Ridge", fold, evaluation, ridge_predictions)]

            if delay != 0:
                continue
            coefficient_rows.append(_coefficients(ridge, fold, "Ridge"))
            linear = _fixed_regression(FULL_FEATURES, "linear")
            linear.fit(train[FULL_FEATURES], train.mrr)
            linear._audit_train_rows = len(train)
            coefficient_rows.append(_coefficients(linear, fold, "Linear"))

            for feature_set, columns in ABLATIONS.items():
                if columns == FULL_FEATURES:
                    prediction = ridge_predictions
                else:
                    model = _fixed_regression(columns, "ridge")
                    model.fit(train[columns], train.mrr)
                    prediction = model.predict(evaluation[columns])
                ablation_rows += _errors(feature_set, fold, evaluation, prediction)

            for recipe in GROUPS:
                for period, rows in [("train", train), ("evaluation", evaluation)]:
                    subset = rows if recipe == "A456+B456" else rows[rows.recipe.eq(recipe)]
                    correlation = float(subset.prev_mrr.corr(subset.state_ewm))
                    correlation_rows.append({"fold": fold, "period": period, "recipe": recipe,
                                             "rows": len(subset), "pearson": correlation,
                                             "two_feature_vif": float(1 / (1 - correlation**2))})

    ablation = pd.DataFrame(ablation_rows)
    ablation_summary = _summarize(ablation_rows)
    delay_frame = pd.DataFrame(delay_rows)
    delay_frame["scenario"] = delay_frame["delay_wafers"].map(lambda n: f"N={n} ") + delay_frame["model"]
    delay_summary = _summarize(delay_frame.to_dict("records"), key="scenario")
    pd.DataFrame(coefficient_rows).to_csv(args.output_dir / "stability_coefficients.csv", index=False)
    ablation.to_csv(args.output_dir / "stability_ablation_fold_mae.csv", index=False)
    ablation_summary.to_csv(args.output_dir / "stability_ablation_summary.csv", index=False)
    delay_frame.to_csv(args.output_dir / "stability_delay_fold_mae.csv", index=False)
    delay_summary.to_csv(args.output_dir / "stability_delay_summary.csv", index=False)
    pd.DataFrame(correlation_rows).to_csv(args.output_dir / "stability_history_correlation.csv", index=False)
    policy = {
        "benchmark": "folds 2-5 chronological development; A456/B456 model rows; A123 state-only",
        "ablation_family": "Ridge only", "ablation_sets": ABLATIONS,
        "coefficient_models": ["LinearRegression", "Ridge"],
        "delay_models": ["EWMA", "3-feature Ridge"], "delay_wafers": [0, 1, 2],
        "ridge_alpha": RIDGE_ALPHA, "ewma_alpha": ALPHA,
        "measurement_delay_unit": "additional same-recipe observed wafers",
        "fold_fit": "all learned preprocessing and coefficients fit on past folds only",
        "selection_or_tuning": "none",
    }
    (args.output_dir / "stability_policy.json").write_text(
        json.dumps(policy, indent=2), encoding="utf-8")
    print("3-feature coefficients, 7 Ridge ablations and N=0/1/2 delays written to", args.output_dir)


if __name__ == "__main__":
    main()
