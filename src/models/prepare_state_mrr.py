"""Reproduce the frozen Ridge development benchmark and export an education model.

No tuning or new model family. Fit the reusable artifact on folds 1..4;
fold 5 remains an already-seen development fold, never a final test.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn

from .state_mrr import FEATURES, RECIPES, StateMRRPredictor
from .train_mrr_chronological import (
    _fixed_regression, build_fold_features, load_prestart_snapshots,
    load_wafer_table, self_check,
)


def export_pipeline(pipeline, *, training_folds: list[int] | None = None) -> dict:
    preprocessing = pipeline.named_steps["preprocessing"]
    categories = preprocessing.named_transformers_["recipe"].categories_[0].tolist()
    if categories != list(RECIPES):
        raise ValueError("Expected both A456 and B456 in training data")
    scaler = preprocessing.named_transformers_["numeric"].named_steps["scaler"]
    model = pipeline.named_steps["model"]
    return {
        "schema_version": 1, "model_version": "state-ridge-alpha1-f1-f4-v1",
        "usage": "EDUCATIONAL_DEVELOPMENT_ONLY", "features": list(FEATURES),
        "recipes": categories, "ridge_alpha": 1.0, "ewma_alpha": 0.4,
        "numeric_mean": scaler.mean_.tolist(), "numeric_scale": scaler.scale_.tolist(),
        "coefficients": model.coef_.tolist(), "intercept": float(model.intercept_),
        "training_folds": training_folds, "measurement_delay": 0,
        "physical_mrr_unit": "UNIT_UNVERIFIED", "raw_label_scale_factor": 1,
        "independent_final_test": False,
    }


def prepare(wafer_table: Path, output_dir: Path, artifact_dir: Path | None = None) -> dict:
    checks = self_check()
    frame = load_wafer_table(wafer_table)
    snapshots = load_prestart_snapshots(None, frame)
    predictions, counts = [], []
    selected = list(FEATURES)
    for fold in range(2, 6):
        features, _ = build_fold_features(frame, snapshots, fold)
        train = features[features.fold.lt(fold) & features.recipe.isin(RECIPES)]
        evaluation = features[features.fold.eq(fold) & features.recipe.isin(RECIPES)]
        pipeline = _fixed_regression(selected, "ridge")
        pipeline.fit(train[selected], train.mrr)
        predicted = pipeline.predict(evaluation[selected])
        portable = StateMRRPredictor(export_pipeline(pipeline, training_folds=list(range(1, fold))))
        exported = np.array([portable.predict_state(row.recipe, row.prev_mrr, row.state_ewm)
                             for row in evaluation.itertuples()])
        np.testing.assert_allclose(exported, predicted, rtol=0, atol=1e-10)
        counts.append({"fold": fold, "train_A456_B456": len(train),
                       "evaluation_A456_B456": len(evaluation)})
        for row, value in zip(evaluation.itertuples(), predicted, strict=True):
            for model, prediction in (("Ridge", value), ("EWMA", row.state_ewm)):
                predictions.append({"fold": fold, "wafer_id": row.wafer_id,
                                    "stage": row.stage, "recipe": row.recipe,
                                    "model": model, "actual_mrr": row.mrr,
                                    "predicted_mrr": prediction,
                                    "absolute_error": abs(row.mrr - prediction)})
        if fold == 5:
            # This fit saw folds 1..4 only, not the evaluation-fold labels.
            artifact = export_pipeline(pipeline, training_folds=[1, 2, 3, 4])
            artifact["training_rows"] = len(train)
            artifact["training_support"] = {
                recipe: {feature: [float(group[feature].min()), float(group[feature].max())]
                         for feature in FEATURES[1:]}
                for recipe, group in train.groupby("recipe")
            }
    predictions = pd.DataFrame(predictions)
    metrics = []
    for model, group in predictions.groupby("model"):
        for recipe in ["A456+B456", *RECIPES]:
            subset = group if recipe == "A456+B456" else group[group.recipe.eq(recipe)]
            means = subset.groupby("fold").absolute_error.mean()
            metrics.append({"model": model, "recipe": recipe, "n": len(subset),
                            "weighted_mae": subset.absolute_error.mean(),
                            "unweighted_mae": means.mean(),
                            "fold_mae": {str(k): v for k, v in means.items()}})
    artifact["source_sha256"] = hashlib.sha256(wafer_table.read_bytes()).hexdigest()
    artifact["sklearn_version"] = sklearn.__version__
    report = {"benchmark": "folds 2..5 chronological development; no final test",
              "n0_is_assumed": True, "measurement_completion_times_in_phm": False,
              "hyperparameter_search": False, "protocol_checks": checks,
              "portable_predictions_match_sklearn": True,
              "fold_counts": counts, "metrics": metrics,
              "artifact_training_folds": artifact["training_folds"],
              "artifact_training_rows": artifact["training_rows"]}
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "model.json").write_text(json.dumps(artifact, indent=2, allow_nan=False), encoding="utf-8")
    (output_dir / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")
    predictions.to_csv(output_dir / "predictions.csv", index=False)
    if artifact_dir is not None:
        artifact_dir.mkdir(parents=True, exist_ok=True)
        # Distribution bundle contains coefficients/aggregate metrics, no wafer rows.
        (artifact_dir / "model.json").write_text(json.dumps(artifact, indent=2, allow_nan=False), encoding="utf-8")
        (artifact_dir / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wafer-table", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("results/state_mrr"))
    parser.add_argument("--artifact-dir", type=Path, help="Optional shareable model/report bundle; no wafer-level rows")
    args = parser.parse_args()
    print(json.dumps(prepare(args.wafer_table, args.output_dir, args.artifact_dir), indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
