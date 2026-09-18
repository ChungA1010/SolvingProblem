"""Independent audits and a scientific comparison figure for the frozen v2 run."""
from pathlib import Path
import json

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from cmp_ml.baselines import DEFAULT_SOURCE, check_hash
from cmp_ml.common import TARGET, read_json, sha256, write_json, utcnow
from cmp_ml.paper_benchmark import ROOT
from cmp_ml.reconstruction_features import p3_view

RUN = ROOT / "runs/phm_cmp_reconstruction_v2"


def main():
    protocol = read_json(RUN / "protocol.json")
    completion = read_json(RUN / "completion.json")
    training = read_json(RUN / "training_complete.json")
    selection = read_json(RUN / "selection.json")
    seal = read_json(RUN / "evaluation_seal.json")
    check_hash(RUN / "metrics.csv", completion["metrics_sha256"])
    check_hash(RUN / "selection.json", completion["selection_sha256"])
    assert selection["selected_at"] < seal["sealed_at"]
    assert sha256(RUN / "selection.json") == training["selection_sha256"] == seal["selection_sha256"]
    check_hash(RUN / "predictions.csv.gz", seal["predictions_sha256"])
    for name, digest in protocol["code_sha256"].items():
        check_hash(RUN / "code_snapshot" / name, digest)
    pred = pd.read_csv(RUN / "scored_predictions.csv.gz", float_precision="round_trip")
    scores = pd.read_csv(RUN / "metrics.csv", float_precision="round_trip")
    assert not pred.duplicated(["sample_id", "split", "model"]).any()
    for row in scores.itertuples(index=False):
        block = pred[pred.split.eq(row.split) & pred.model.eq(row.model)]
        if row.stage != "all":
            block = block[block.STAGE.eq(row.stage)]
        assert len(block) == row.n
        np.testing.assert_allclose([row.mse, row.mae, row.r2],
            [mean_squared_error(block.truth, block.prediction), mean_absolute_error(block.truth, block.prediction), r2_score(block.truth, block.prediction)], rtol=1e-10, atol=1e-10)
    old = pd.read_csv(DEFAULT_SOURCE / "metrics.csv", float_precision="round_trip")
    trials = pd.read_csv(RUN / "validation_trials.csv", float_precision="round_trip")
    control = trials[trials.candidate.eq("control")]
    control_diff = 0.
    for row in control.itertuples(index=False):
        expected = old[old.track.eq("official") & old.split.eq("validation") & old.stage.eq("all") & old.model.eq(row.model)].iloc[0]
        np.testing.assert_allclose(row.mse, expected.mse, rtol=1e-9, atol=1e-9)
        control_diff = max(control_diff, abs(row.mse - expected.mse))
    cache = ROOT / protocol["cache_relative"]
    dev = pd.read_csv(cache / "development.csv.gz", dtype={"route": str}, float_precision="round_trip")
    train = dev[dev.cohort.eq("training")]
    allowed = set(train.sample_id)
    choices = selection["choices"]
    libraries, parameters = {}, {}
    for record in training["models"]:
        path = RUN / "models" / record["file"]
        check_hash(path, record["sha256"])
        model = joblib.load(path)
        if path.stem.startswith("P2_"):
            ref = model.history.library
            assert set(ref.sample_id) <= allowed and ref.sample_id.is_unique
            if choices["p2"]["spec"]["exclude_four"]:
                assert not ref.excluded_extreme.any()
            assert len(model.history.names) == 125
            cv = pd.read_csv(RUN / f"p2_{choices['p2']['spec']['id']}_{path.stem.split('_', 1)[1]}_cv.csv")
            names = ["P2_Persistent", "P2_KNN", "P2_LR", "P2_SVR", "P2_Bagging"]
            errors = cv.pivot(index="fold", columns="model", values="mse")[names].to_numpy()
            e = errors.mean(axis=0) + 3 * errors.std(axis=0, ddof=1)
            inv = np.maximum(e, 1e-12) ** -3
            np.testing.assert_allclose(model.weights, inv / inv.sum())
            libraries[path.name] = {"rows": len(ref), "training_only": True, "weights": dict(zip(names, model.weights.tolist()))}
            parameters[path.name] = {n: {k: repr(v) for k, v in m.get_params(deep=True).items()} for n, m in model.models.items()}
        elif path.stem.startswith("P3_"):
            view = p3_view(train, choices["p3"]["spec"])
            view = view[view.route.eq(path.stem.split('_', 1)[1])]
            if choices["p3"]["spec"]["exclude_four"]:
                view = view[~view.excluded_extreme]
            assert set(model.cpp_residuals) <= set(view.p3_cpp)
            parameters[path.name] = {k: repr(v) for k, v in model.model.get_params(deep=True).items()}
        else:
            parameters[path.name] = {n: {"candidate": s, "parameters": {k: repr(v) for k, v in m.get_params().items()}} for n, (s, m) in model.chosen.items()}
    repeated = pd.read_csv(RUN / "p1_repeat_metrics.csv")
    assert repeated.groupby(["split", "model", "stage"]).repeat.nunique().eq(20).all()
    original = read_json(ROOT / "runs/phm_cmp_v1/selection.json")["model_hashes"]
    for name, digest in original.items():
        check_hash(ROOT / "runs/phm_cmp_v1/models" / name, digest)
    write_json(RUN / "implementation_parameters.json", parameters)
    write_json(RUN / "independent_verification.json", {"verified_at": utcnow(), "metric_rows_recomputed_with_sklearn": len(scores),
        "v1_control_validation_mse_max_difference": control_diff, "p2_libraries_and_weights": libraries,
        "original_deployment_model_hashes_checked": len(original), "p1_repeats_checked": 20, "all_checks_passed": True})
    panels = [(["P1_CART_Stack"] * 2, ["A", "B"], [5.065, 4.5], "rmse", "P1: CART stacking"),
              (["P1_ELM_Stack"] * 2, ["A", "B"], [4.795, 4.485], "rmse", "P1: ELM stacking"),
              (["P2_Integrated"], ["all"], [7.07], "mse", "P2: Integrated model"),
              (["P3_RF_CPP"], ["all"], [7.4], "mse", "P3: CPP-corrected RF")]
    fig, axes = plt.subplots(2, 2, figsize=(12, 8), constrained_layout=True)
    colors = ["#b7bdc6", "#126caa", "#d78a31"]
    for ax, (models, stages, paper_values, metric, title) in zip(axes.flat, panels):
        older, newer = [], []
        for model, stage in zip(models, stages):
            older.append(float(old[old.track.eq("official") & old.split.eq("test") & old.model.eq(model) & old.stage.eq(stage)].iloc[0][metric]))
            newer.append(float(scores[scores.split.eq("test") & scores.model.eq(model) & scores.stage.eq(stage)].iloc[0][metric]))
        x = np.arange(len(stages))
        for shift, (values, label, color) in enumerate(zip([older, newer, paper_values], ["Previous v1", "Validation-selected v2", "Published paper"], colors)):
            bars = ax.bar(x + (shift - 1) * .25, values, width=.23, color=color, label=label)
            ax.bar_label(bars, fmt="%.3f", fontsize=8, padding=3)
        ax.set_xticks(x, ["Stage " + s if s != "all" else "All test samples" for s in stages])
        ax.set_ylabel(metric.upper() + " (lower is better)")
        ax.set_title(title)
        ax.set_ylim(0, max(older + newer + paper_values) * 1.24)
        ax.spines[["top", "right"]].set_visible(False)
    handles, labels = axes[0, 0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="outside lower center", ncol=3, frameon=False)
    fig.suptitle("CMP paper reconstruction: observed Test results\nPartial reconstruction; same previously observed Test; no Test-based reselection", fontsize=13)
    fig.savefig(RUN / "reconstruction_comparison.png", dpi=200)
    plt.close(fig)
    print(json.dumps({"metrics_verified": len(scores), "model_files": len(training["models"]), "all_checks_passed": True}))


if __name__ == "__main__":
    main()
