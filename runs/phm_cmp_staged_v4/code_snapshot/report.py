from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import LogLocator, NullFormatter, ScalarFormatter
import numpy as np
import pandas as pd

from .common import TARGET, read_json
from .experiment import EXTREME_IDS, load_run, metrics


def markdown_table(frame: pd.DataFrame, decimals=4) -> str:
    def fmt(v):
        if pd.isna(v):
            return "—"
        if isinstance(v, (float, np.floating)):
            return f"{v:.{decimals}f}"
        return str(v)
    headers = [str(c) for c in frame.columns]
    rows = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    rows += ["| " + " | ".join(fmt(v) for v in row) + " |" for row in frame.itertuples(index=False, name=None)]
    return "\n".join(rows)


def report(run_dir: Path) -> None:
    data, audit = load_run(run_dir)
    selection = read_json(run_dir / "selection.json")
    protocol = read_json(run_dir / "training_protocol.json")
    seal = read_json(run_dir / "evaluation_seal.json")
    if seal["status"] != "complete":
        raise ValueError("Cannot report an incomplete evaluation")
    test = pd.read_csv(run_dir / "test_metrics.csv")
    val = pd.read_csv(run_dir / "validation_predictions.csv")
    predictions = pd.read_csv(run_dir / "selected_test_predictions.csv")
    all_rows = test[test.slice.eq("all") & test.stage.isin(["A", "B"])].copy()
    val_rows = pd.DataFrame([{"stage": stage, "model": model, "validation_mae": metrics(g.y_true, g.y_pred)["mae"]}
                             for (stage, model), g in val.groupby(["stage", "model"])])
    comparison = all_rows.merge(val_rows, on=["stage", "model"])
    comparison.to_csv(run_dir / "model_comparison.csv", index=False)
    figs = run_dir / "figures"
    figs.mkdir(exist_ok=True)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
    fig, axes = plt.subplots(1, 2, figsize=(14, 7), layout="constrained")
    for stage, ax in zip(["A", "B"], axes):
        rows = comparison[comparison.stage.eq(stage)].sort_values("validation_mae", ascending=False)
        y = np.arange(len(rows))
        ax.barh(y - .18, rows.validation_mae, height=.34, label="Validation", color="#7c9fb9")
        ax.barh(y + .18, rows.mae, height=.34, label="Sealed test", color="#12615c")
        ax.set_yticks(y, [m + (" *" if m == selection["stages"][stage]["selected_by_validation"] else "") for m in rows.model])
        ax.set_xlabel("MAE (dataset scale; log axis)")
        ax.set_xscale("log")
        ax.xaxis.set_major_locator(LogLocator(base=10, subs=[1, 2, 5]))
        ax.xaxis.set_major_formatter(ScalarFormatter())
        ax.xaxis.set_minor_formatter(NullFormatter())
        ax.set_title(f"Stage {stage} | * selected on validation")
        ax.grid(axis="x", alpha=.2)
        ax.legend()
    fig.suptitle("PHM 2016 CMP | all labels retained", fontsize=16)
    fig.savefig(figs / "model_comparison.png", dpi=160)
    plt.close(fig)
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8), layout="constrained")
    for stage, ax in zip(["A", "B"], axes):
        rows = predictions[predictions.stage.eq(stage)]
        ax.scatter(rows.y_true, rows.y_pred, s=18, alpha=.6, color="#12615c")
        low = min(0., rows.y_true.min(), rows.y_pred.min())
        high = max(rows.y_true.max(), rows.y_pred.max()) * 1.05
        ax.plot([low, high], [low, high], "--", color="#a04c34", linewidth=1)
        ax.set(xlabel="Observed MRR (dataset scale)", ylabel="Predicted MRR (dataset scale)",
               title=f"Stage {stage}: {selection['stages'][stage]['selected_by_validation']}")
        ax.grid(alpha=.2)
    fig.suptitle("Selected models | every sealed-test sample shown", fontsize=14)
    fig.savefig(figs / "selected_predictions.png", dpi=160)
    plt.close(fig)
    split_table = data.groupby(["split", "STAGE"]).size().unstack(fill_value=0).reindex(["train", "validation", "calibration", "test"])
    split_table["total"] = split_table.sum(axis=1)
    split_table["fraction"] = split_table.total / len(data)
    split_table["groups"] = data.groupby("split").group_id.nunique()
    split_table = split_table.reset_index()
    selected = comparison[comparison.selected_by_validation.eq(True)].copy()
    improvements = []
    for stage in ["A", "B"]:
        winner = selected[selected.stage.eq(stage)].iloc[0]
        baseline = comparison[comparison.stage.eq(stage) & comparison.model.eq("StageMean")].iloc[0]
        improvements.append({"stage": stage, "selected_model": winner.model, "test_n": int(winner.n),
                             "test_mae": winner.mae, "stage_mean_mae": baseline.mae,
                             "mae_improvement_percent": 100 * (1 - winner.mae / baseline.mae) if baseline.mae else np.nan,
                             "test_rmse": winner.rmse, "test_r2": winner.r2,
                             "interval_coverage": winner.coverage, "mean_interval_width": winner.mean_interval_width})
    summary = pd.DataFrame(improvements)
    summary.to_csv(run_dir / "selected_summary.csv", index=False)
    extremes = data[data.WAFER_ID.isin(EXTREME_IDS)][["WAFER_ID", "STAGE", "split", TARGET]].sort_values("WAFER_ID")
    diagnostics = test[test.slice.eq("diagnostic_without_predeclared_extremes")].merge(
        selected[["stage", "model"]], on=["stage", "model"])[["stage", "model", "n", "mae", "rmse", "r2"]]
    contents = ["# PHM 2016 CMP experiment v1", "",
                "This is an offline regression benchmark, not a production release or a causal CMP simulator.", "",
                "## Validation-selected models", "", markdown_table(summary), "",
                "The selected model for each stage was frozen before opening Test. Test rankings must not be used to retune this run.", "",
                "Interpretation: the four extreme-label wafers all landed in Train. Test therefore does not evaluate extreme-MRR generalization, and the Stage A mean baseline is strongly influenced by those Train labels. Stage A's gain over this mean must not be interpreted as a gain over a robust route-aware baseline, which was not included in this experiment. Stage B's validation winner underperformed several standalone ML models on Test; retain the frozen choice as an honest selection outcome rather than claiming the hybrid is universally best.", "",
                "## Data integrity and split", "",
                f"- {audit['raw_file_count']} source CSVs; {audit['raw_rows']:,} raw rows; {audit['samples']:,} wafer-stage targets.",
                f"- Empty files: {', '.join(audit['empty_files'])}.",
                f"- Exact duplicate measurements removed in the derived dataset: {audit['exact_duplicate_rows_removed']:,}; source files are unchanged.",
                f"- {audit['cross_file_wafer_stage_samples']} wafer-stage traces span files. Machine identity and nonoverlapping time ranges were checked before merging.",
                f"- {audit['cross_file_gaps_over_threshold']} cross-file gap exceeds {audit['max_gap_source_timestamp_units']} source timestamp units; AUC and observed duration do not bridge long gaps.",
                f"- {audit['unique_wafers']} wafers in {audit['file_wafer_connected_components']} connected components. Wafer, file, and component overlap across splits is zero.",
                "- Split candidates use sample counts and Stage labels only, not target values. This is a grouped random holdout, not a chronological future-production test.", "",
                markdown_table(split_table), "", "## Full model comparison", "",
                markdown_table(comparison[["stage", "model", "validation_mae", "mae", "rmse", "r2", "negative_predictions", "coverage"]].sort_values(["stage", "validation_mae"])), "",
                "![Validation and test errors](figures/model_comparison.png)", "",
                "![All selected-model test predictions](figures/selected_predictions.png)", "",
                "## Outlier sensitivity (diagnostic only)", "",
                "All four previously identified extreme-label wafers remain in the primary data and training. Their split assignment is shown below. The following sensitivity table excludes them ONLY from a separate diagnostic evaluation; it is not the headline score or a retraining result.", "",
                markdown_table(extremes), "", markdown_table(diagnostics), "",
                "## Modeling and uncertainty", "",
                "- Each Stage has independent fitted preprocessing and model artifacts. GlobalMean is the pooled TRAIN mean; StageMean is each Stage's TRAIN mean.",
                "- Feature schema, medians, missing flags, constant filtering, scaling, and physics coefficients use TRAIN only. Absolute time, file identity, wafer ID, and target are not predictor columns.",
                "- Sensor statistics include mean, population standard deviation, min/max, first/last, range, slope, gap-aware AUC, and zero ratio; chamber features retain route information.",
                "- PrestonInspired is a regularized, robust log-target power-law proxy using normalized wafer-load pressure, motion, slurry, and usage indices. It is not a physical calibration, and its coefficients are not causal effects.",
                "- Hybrid residual targets use out-of-fold physics predictions from disjoint TRAIN components, with the final physics model fitted on full TRAIN. This differs from fitting residuals on the physics model's in-sample predictions.",
                "- Small, predeclared grids select each family on Validation MAE (RMSE tie-break). Search budgets differ by family; this is an initial benchmark, not an exhaustive optimization claim.",
                "- Models are not refitted on Train+Validation. Calibration remains separate. No Test labels enter model selection.",
                "- Prediction interval radius uses the per-stage calibration residual rank ceil((n+1)*0.9), only with at least 80 calibration samples. Correlated records within components invalidate iid sample exchangeability, so the intervals are empirical diagnostics without guaranteed 90% coverage.",
                f"- Calibration has only {selection['stages']['A']['calibration_groups']} independent file/wafer component(s) in Stage A and {selection['stages']['B']['calibration_groups']} in Stage B. Meeting the row-count minimum does not establish broad group coverage. Stage A selected-model empirical coverage is {float(selected[selected.stage.eq('A')].coverage.iloc[0]):.2%}, outside the specification's 85–95% interval QA band; it is not certified for release.",
                "- Negative predictions are counted, not silently clamped in primary point metrics. This benchmark does not certify UI response, OOD handling, causal setpoint effects, or all v0.4.0 release gates.", "",
                "## Reproduction", "",
                "See the repository README for commands. The raw dataset and derived feature matrix are not redistributed. File hashes, row lineage via source filenames, fixed split manifest, grids, versions, fitted artifacts, and held-out predictions are retained.",
                f"Training wall time: {selection['training_seconds']:.1f} seconds. CPU threads: {protocol['threads']}.", "",
                "## Sources", "",
                "- [PHM Society official challenge](https://phmsociety.org/conference/annual-conference-of-the-phm-society/annual-conference-of-the-prognostics-and-health-management-society-2016/phm-data-challenge-4/)",
                "- [scikit-learn grouped cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html#group-k-fold)",
                "- [scikit-learn regression metrics](https://scikit-learn.org/stable/modules/model_evaluation.html)", ""]
    verification = run_dir / "verification.json"
    if verification.exists():
        v = read_json(verification)
        contents += ["## Verification", "", f"Saved-model reproduction passed for {v['model_count']} artifacts. Split and OOF group integrity passed.", "",
                     markdown_table(pd.DataFrame(v["selected_model_reproducibility_and_latency"])), ""]
    (run_dir / "REPORT.md").write_text("\n".join(contents), encoding="utf-8")
    print(summary.to_string(index=False), flush=True)
