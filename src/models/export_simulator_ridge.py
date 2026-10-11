"""Explicit offline education export + chronological replay; never production selection.

Frozen before execution: F1-F4 fit, F5 development demonstration, Ridge alpha=1,
EWMA alpha=.4, fixed N0 fit. No tuning and no claim of a new independent test.
"""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import platform

import numpy as np
import pandas as pd
import sklearn

from .train_mrr_chronological import (
    load_wafer_table, load_prestart_snapshots, build_fold_features, _fixed_regression,
)
from src.simulator.artifact import FrozenRidgePredictor, load_artifact
from src.simulator.core import SimulationRequest, SimulatorCore
from src.simulator.history import MRRMeasurement, build_history_state
from src.simulator.ridge_adapter import Issue2RidgeAdapter

FEATURES = ["recipe", "prev_mrr", "state_ewm"]
VERSION = "EDU_RIDGE_ALPHA1_TRAIN_F1_F4_v1"
MEASUREMENT_ASSUMPTION = "N0_ORDINAL_NOT_OBSERVED_TIMESTAMPS"


def portable_payload(pipeline, source_sha256, train, *, version=VERSION, evaluation_fold=5):
    # Strictly validate the original fitted pipeline before translating parameters.
    Issue2RidgeAdapter(pipeline, model_version=version, provenance="explicit offline development export")
    numeric = pipeline.named_steps["preprocessing"].named_transformers_["numeric"]
    scaler, imputer = numeric.named_steps["scaler"], numeric.named_steps["imputer"]
    model = pipeline.named_steps["model"]
    return {
        "schema": "cmp-frozen-ridge-v1", "model_version": version,
        "usage": "EDUCATIONAL_DEVELOPMENT_ONLY", "features": FEATURES,
        "ridge_alpha": 1.0, "ewma_alpha": 0.4, "recipes": ["A456", "B456"],
        "numeric_mean": scaler.mean_.tolist(), "numeric_scale": scaler.scale_.tolist(),
        "imputer_median": imputer.statistics_.tolist(), "coefficients": model.coef_.tolist(),
        "intercept": float(model.intercept_),
        "provenance": {
            "source_sha256": source_sha256, "training_folds": list(range(1, evaluation_fold)), "evaluation_fold": evaluation_fold,
            "training_rows": len(train), "training_rows_by_recipe": train.recipe.value_counts().to_dict(),
            "measurement_assumption": MEASUREMENT_ASSUMPTION,
            "independent_final_test": False, "production_model": False,
            "python": platform.python_version(), "sklearn": sklearn.__version__,
            "training_start_source_t": float(train.t_start.min()) if "t_start" in train else None,
            "training_end_source_t": float(train.t_start.max()) if "t_start" in train else None,
        },
    }


def ordinal_requests(rows, interval, delay):
    """Synthetic ordering clock, explicitly NOT original PHM measurement timestamps.

    Measure every kth same-recipe observed wafer. An additional delay of N
    releases before the (j+N+1)th request after measurement j. Cadence never
    resets at fold boundaries. Request history contains only already released
    records, not labels staged for future availability.
    """
    epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    recipe_positions = {r: list(rows.index[rows.recipe.eq(r)]) for r in ("A456", "B456")}
    releases, pending, history, position_by_index = {}, {}, [], {}
    for recipe, positions in recipe_positions.items():
        for j, global_index in enumerate(positions):
            position_by_index[global_index] = j
            if (j + 1) % interval == 0 and j + delay + 1 < len(positions):
                releases[global_index] = positions[j + delay + 1]
    for i, row in enumerate(rows.itertuples(index=False)):
        now = epoch + timedelta(seconds=i * 10)
        history.extend(pending.pop(i, []))
        request = SimulationRequest(
            f"{row.wafer_id}:{row.stage}", row.recipe, "Normal", now, tuple(history))
        yield row, request, (position_by_index[i] + 1) % interval == 0
        if i in releases:
            release = releases[i]
            record = MRRMeasurement(request.wafer_id, row.recipe, now,
                                    epoch + timedelta(seconds=release * 10 - 1), float(row.mrr))
            pending.setdefault(release, []).append(record)


def json_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def run(wafer_table, output):
    if output.exists():
        raise ValueError("output already exists; choose a new version directory to preserve evidence")
    frame = load_wafer_table(wafer_table)
    if not np.isfinite(frame[["t_start", "t_end", "mrr"]].to_numpy()).all():
        raise ValueError("non-finite source values")
    sha = hashlib.sha256(wafer_table.read_bytes()).hexdigest()
    models, features, fit_counts = {}, {}, {}
    snapshots = load_prestart_snapshots(None, frame)
    parity_max = 0.0
    for fold in range(2, 6):
        feature, _ = build_fold_features(frame, snapshots, fold, 0)
        train = feature[feature.fold.lt(fold) & feature.recipe.isin(["A456", "B456"])].copy()
        model = _fixed_regression(FEATURES, "ridge")
        model.fit(train[FEATURES], train.mrr)
        # Portable fold objects carry explicit development metadata. Only F1-F4
        # is exported for the demo; F2-F4 comparison models stay local.
        payload = portable_payload(model, sha, train, evaluation_fold=fold,
                                   version=f"EDU_RIDGE_ALPHA1_TRAIN_F1_F{fold-1}_v1")
        payload["provenance"]["training_start_source_t"] = float(frame[frame.fold.lt(fold) & frame.recipe.isin(["A456","B456"])].t_start.min())
        payload["provenance"]["training_end_source_t"] = float(frame[frame.fold.lt(fold) & frame.recipe.isin(["A456","B456"])].t_start.max())
        frozen = FrozenRidgePredictor(payload)
        evaluation = feature[feature.fold.eq(fold) & feature.recipe.isin(["A456", "B456"])]
        original = model.predict(evaluation[FEATURES])
        portable = [frozen.predict(r.recipe, r.prev_mrr, r.state_ewm) for r in evaluation.itertuples()]
        gap = float(np.max(np.abs(original - portable)))
        parity_max = max(parity_max, gap)
        if gap > 1e-10:
            raise AssertionError("portable coefficients differ from fitted pipeline")
        models[fold] = (model, frozen)
        features[fold] = feature
        fit_counts[fold] = len(train)
        if fold == 5:
            selected_payload = payload

    records, state_gap, core_gap = [], 0.0, 0.0
    # Nine scenarios with the SAME frozen N0 coefficients in each fold:
    # cadence 1/5/10 crossed with additional delay 0/1/2.
    for interval in (1, 5, 10):
        for delay in (0, 1, 2):
            for fold in range(2, 6):
                rows = frame[frame.fold.le(fold) & frame.recipe.isin(["A456", "B456"])].reset_index(drop=True)
                model, frozen = models[fold]
                core = SimulatorCore(frozen)
                expected_features = features[fold].set_index(["wafer_id", "stage"])
                train = features[fold].query("fold < @fold and recipe in ['A456','B456']")
                recipe_means = train.groupby("recipe").mrr.mean()
                for row, request, measured in ordinal_requests(rows, interval, delay):
                    if row.fold != fold:
                        continue
                    result = core.predict(request)
                    if result.status != "OK":
                        raise AssertionError("evaluation history unavailable: " + str(result.error))
                    state = build_history_state(request.recipe, request.wafer_id, request.wafer_start_at, request.history)
                    if interval == 1 and delay == 0:
                        expected = expected_features.loc[(row.wafer_id, row.stage)]
                        state_gap = max(state_gap, abs(state.prev_mrr - expected.prev_mrr), abs(state.state_ewm - expected.state_ewm))
                    original = float(model.predict(pd.DataFrame([[row.recipe, state.prev_mrr, state.state_ewm]], columns=FEATURES))[0])
                    core_gap = max(core_gap, abs(original - result.final_mrr))
                    predictions = {"Ridge": result.final_mrr, "EWMA": state.state_ewm,
                                   "Persistence": state.prev_mrr, "Recipe Mean": recipe_means[row.recipe]}
                    for name, predicted in predictions.items():
                        records.append({"measurement_interval": interval, "additional_delay": delay,
                                        "fold": fold, "recipe": row.recipe, "wafer_id": row.wafer_id,
                                        "stage": row.stage, "model": name, "actual_mrr": float(row.mrr),
                                        "predicted_mrr": predicted, "absolute_error": abs(row.mrr - predicted),
                                        "history_used": state.history_used, "measurement_selected": measured})
    if state_gap > 1e-10 or core_gap > 1e-10:
        raise AssertionError("history/core parity failed")
    predictions = pd.DataFrame(records)
    summary = []
    for (interval, delay, name), group in predictions.groupby(["measurement_interval", "additional_delay", "model"]):
        for recipe, subset in [("A456+B456", group), ("A456", group.query("recipe == 'A456'")), ("B456", group.query("recipe == 'B456'"))]:
            summary.append({"measurement_interval": interval, "additional_delay": delay, "model": name,
                            "recipe": recipe, "rows": len(subset), "mae": float(subset.absolute_error.mean()),
                            "folds": 4, "measurements_scheduled": int(subset.measurement_selected.sum())})
    summary = pd.DataFrame(summary)
    canonical = summary.query("measurement_interval == 1 and additional_delay == 0 and recipe == 'A456+B456'")
    references = {"Ridge": 2.690, "EWMA": 2.747, "Persistence": 2.980, "Recipe Mean": 7.167}
    for row in canonical.itertuples():
        if round(row.mae, 3) != references[row.model]:
            raise AssertionError("existing Issue2 reference did not reproduce: " + str(row))
    output.mkdir(parents=True)
    json_write(output / "model.json", selected_payload)
    loaded = load_artifact(output / "model.json")
    if loaded.model_version != VERSION:
        raise AssertionError("round-trip version mismatch")
    predictions.to_csv(output / "predictions.csv", index=False)
    summary.to_csv(output / "measurement_summary.csv", index=False)
    fold_summary = predictions.groupby(["measurement_interval", "additional_delay", "model", "fold", "recipe"]).absolute_error.agg(["size", "mean"]).reset_index()
    fold_summary.to_csv(output / "fold_summary.csv", index=False)
    report = {
        "status": "PASS", "usage": "EDUCATIONAL_DEVELOPMENT_ONLY", "model_version": VERSION,
        "model_sha256": hashlib.sha256((output / "model.json").read_bytes()).hexdigest(),
        "source_sha256": sha, "source_rows": len(frame), "fit_count": 4,
        "training_rows_by_evaluation_fold": fit_counts, "training_folds_for_export": [1,2,3,4],
        "export_evaluation_fold": 5, "independent_final_test": False, "production_model": False,
        "hyperparameter_search": False, "source_measurement_timestamps_available": False,
        "replay_clock": "synthetic ordinal UTC; not PHM real timestamps",
        "cadence": "every kth observed same-recipe wafer, across fold boundaries",
        "delay": "additional observed same-recipe wafers before release; distinct from cadence",
        "sensitivity_refits": 0, "sensitivity_model": "each fold's frozen N0 Ridge",
        "max_pipeline_portable_gap": parity_max, "max_pipeline_core_gap": core_gap,
        "max_N0_history_reference_gap": state_gap,
        "reference_mae": canonical[["model","mae","rows"]].to_dict(orient="records"),
        "evaluated_prediction_rows": len(predictions),
    }
    json_write(output / "report.json", report)
    print(json.dumps(report, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wafer-table", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    run(args.wafer_table, args.output)


if __name__ == "__main__":
    main()
