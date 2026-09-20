"""Frozen-model evaluation on previously unused PHM test/validation partitions."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .common import KEYS, MAX_GAP, RAW_COLUMNS, STATUS, TARGET, read_json, sample_id, sha256, utcnow, write_json
from .data import connected_file_groups, describe_trace
from .experiment import metrics


def freeze(source_run: Path, run_dir: Path):
    if run_dir.exists() and any(run_dir.iterdir()):
        raise FileExistsError("External evaluation needs an empty output directory")
    selection = read_json(source_run / "selection.json")
    for name, digest in selection["model_hashes"].items():
        if sha256(source_run / "models" / name) != digest:
            raise ValueError("Original model changed")
    protocol = {"frozen_at": utcnow(), "source_run_name": source_run.name,
                "primary_models": {s: row["selected_by_validation"] for s, row in selection["stages"].items()},
                "model_hashes": selection["model_hashes"], "source_selection_sha256": sha256(source_run / "selection.json"),
                "source_artifact_hashes": {p.relative_to(source_run).as_posix(): sha256(p)
                                           for p in sorted(source_run.rglob("*")) if p.is_file()},
                "cohorts": ["test", "validation"],
                "fit_policy": "No refitting, recalibration, or hyperparameter/model selection on external data.",
                "comparison_policy": "Primary: original v1 validation-selected model per Stage. All 26 frozen models are secondary comparisons.",
                "novelty_policy": "Exclude whole external file/wafer connected components linked to ANY wafer in the entire original 1981-sample corpus, including all old splits and both stages.",
                "schema_policy": "Exclude unseen chambers from scoring, report all exclusions; pad absent trained feature columns with NaN (presence flags zero). No new fitted schema.",
                "join_policy": "Strict one-to-one cohort/WAFER_ID/STAGE join. No target-based filtering or clipping.",
                "scoring_policy": "Report each official cohort and Stage separately, plus group/route slices; no selection or retuning after outcomes.",
                "interval_policy": "Use existing v1 calibration radii unchanged; empirical coverage only, no formal guarantee.",
                "answer_policy": "Freeze predictions and eligibility manifest before fetching/reading answer values. Score once.",
                "scope": "Previously unused partitions of the same 2016 PHM dataset, obtained from a pinned community mirror. Not new-factory or future-production validation.",
                "target_units": "dataset_scale"}
    write_json(run_dir / "protocol.json", protocol)
    print("Frozen 26 existing models, primary selections, exclusion rules and one-time scoring policy.", flush=True)


def verify_models(source_run, protocol):
    if sha256(source_run / "selection.json") != protocol["source_selection_sha256"]:
        raise ValueError("Original model selection changed")
    for name, digest in protocol["model_hashes"].items():
        if sha256(source_run / "models" / name) != digest:
            raise ValueError(f"Frozen model changed: {name}")


def assign_novelty(manifest, prior):
    """Propagate old-wafer links through whole files, including other new wafers."""
    old = prior[["WAFER_ID", "source_files"]].copy()
    old["source_file"] = old.source_files.str.split(";")
    old = old.explode("source_file")
    old["source_file"] = "prior/" + old.source_file
    new = manifest[["WAFER_ID", "source_files"]].copy()
    new["source_file"] = new.source_files.str.split(";")
    new = new.explode("source_file")
    links = pd.concat([old[["WAFER_ID", "source_file"]], new[["WAFER_ID", "source_file"]]], ignore_index=True)
    groups = connected_file_groups(links)
    old_groups = {groups[p] for p in old.source_file}
    result = manifest.copy()
    result["group_id"] = result.source_files.map(lambda p: groups[p.split(";")[0]])
    result["prior_wafer_overlap"] = result.WAFER_ID.isin(prior.WAFER_ID)
    result["prior_component_overlap"] = result.group_id.isin(old_groups)
    return result


def align_features(frame, expected_columns):
    missing = sorted(set(expected_columns) - set(frame))
    additions = {c: 0.0 if c.endswith("__present") else np.nan for c in missing}
    if additions:
        frame = pd.concat([frame, pd.DataFrame(additions, index=frame.index)], axis=1)
    presence = [c for c in frame if c.startswith("f__") and c.endswith("__present")]
    frame[presence] = frame[presence].fillna(0.0)
    return frame, missing


def prepare_predictions(source_run: Path, data_dir: Path, run_dir: Path):
    if (run_dir / "prediction_freeze.json").exists() or (run_dir / "evaluation_seal.json").exists():
        raise FileExistsError("External predictions are already frozen")
    protocol = read_json(run_dir / "protocol.json")
    verify_models(source_run, protocol)
    downloads = read_json(run_dir / "downloaded_traces.json")
    expected_cohorts = set(protocol["cohorts"])
    frames, files = [], []
    for item in downloads["files"]:
        path = data_dir / item["local_path"]
        if sha256(path) != item["sha256"]:
            raise ValueError(f"Raw data changed: {path.name}")
        cohort = item["kind"]
        if cohort not in expected_cohorts:
            raise ValueError("Unexpected external cohort")
        frame = pd.read_csv(path)
        if set(frame) != RAW_COLUMNS:
            raise ValueError(f"Raw schema mismatch: {path.name}")
        files.append({"file": item["local_path"], "cohort": cohort, "rows": len(frame), "sha256": item["sha256"]})
        if frame.empty:
            continue
        if frame.isna().any().any() or not np.isfinite(frame.drop(columns="STAGE").to_numpy(float)).all():
            raise ValueError("Non-finite or missing raw values")
        if not frame.STAGE.isin(["A", "B"]).all() or not frame[STATUS].isin([0, 1]).all():
            raise ValueError("Invalid stage/water status")
        frame["cohort"], frame["source_file"] = cohort, item["local_path"]
        frame["original_row"] = np.arange(2, len(frame) + 2)
        frames.append(frame)
    raw = pd.concat(frames, ignore_index=True)
    join_keys = ["cohort", *KEYS]
    if (raw.groupby(join_keys).MACHINE_ID.nunique() > 1).any():
        raise ValueError("Wafer-stage has inconsistent machine IDs")
    segments = raw.groupby(join_keys + ["source_file"]).agg(start=("TIMESTAMP", "min"), end=("TIMESTAMP", "max"), rows=("TIMESTAMP", "size")).reset_index()
    cross = segments.groupby(join_keys).filter(lambda g: len(g) > 1).copy()
    cross["gap_from_previous_file"] = np.nan
    for _, group in cross.groupby(join_keys):
        ordered = group.sort_values("start")
        gaps = ordered.start - ordered.end.shift()
        if (gaps.dropna() < 0).any():
            raise ValueError("Cross-file time overlap needs review before merging")
        cross.loc[ordered.index, "gap_from_previous_file"] = gaps.to_numpy()
    provenance = raw.groupby(join_keys).agg(
        source_files=("source_file", lambda s: ";".join(sorted(s.unique()))),
        start_timestamp=("TIMESTAMP", "min"), end_timestamp=("TIMESTAMP", "max")).reset_index()
    prior = pd.read_csv(source_run / "split_manifest.csv")
    provenance = assign_novelty(provenance, prior)
    raw_count = len(raw)
    duplicates = raw.duplicated(subset=["cohort", *sorted(RAW_COLUMNS)])
    raw = raw.loc[~duplicates].copy()
    records = []
    for (cohort, wafer, stage), group in raw.groupby(join_keys, sort=True):
        chambers = sorted(group.CHAMBER.unique())
        row = {"cohort": cohort, "WAFER_ID": int(wafer), "STAGE": stage,
               "sample_id": cohort + ":" + sample_id(wafer, stage),
               "chamber_route": "-".join(str(int(c)) for c in chambers), "f__chamber_count": len(chambers)}
        row.update({f"f__all__{k}": v for k, v in describe_trace(group).items()})
        for chamber, trace in group.groupby("CHAMBER"):
            prefix = f"f__ch{int(chamber)}__"
            row[prefix + "present"] = 1.0
            row.update({prefix + k: v for k, v in describe_trace(trace).items()})
        records.append(row)
    frame = pd.DataFrame(records).merge(provenance, on=join_keys, validate="one_to_one")
    schemas = {s: read_json(source_run / f"feature_schema_{s}.json") for s in ["A", "B"]}
    expected = {c for schema in schemas.values() for c in schema["input_columns"]}
    frame, missing_columns = align_features(frame, expected)
    frame["unseen_chamber"] = [bool(set(route.split("-")) - set(schemas[stage]["train_chambers"]))
                                for route, stage in zip(frame.chamber_route, frame.STAGE)]
    frame["eligible"] = ~frame.prior_component_overlap & ~frame.unseen_chamber
    frame["exclusion_reason"] = [";".join(reason for reason, flag in [
        ("prior_wafer_file_component", prior_link), ("unseen_chamber", unseen)] if flag)
        for prior_link, unseen in zip(frame.prior_component_overlap, frame.unseen_chamber)]
    frame.to_csv(run_dir / "features.csv.gz", index=False, compression="gzip")
    metadata = [c for c in frame if not c.startswith("f__")]
    frame[metadata].to_csv(run_dir / "external_manifest.csv", index=False)
    cross.to_csv(run_dir / "cross_file_segments.csv", index=False)
    audit = {"prepared_at": utcnow(), "raw_rows": raw_count, "raw_files": len(files),
             "raw_rows_by_cohort": {c: sum(f["rows"] for f in files if f["cohort"] == c) for c in protocol["cohorts"]},
             "empty_files": [f["file"] for f in files if not f["rows"]],
             "exact_duplicate_rows_removed": int(duplicates.sum()), "raw_files_manifest": files,
             "cross_file_samples": int(cross.groupby(join_keys).ngroups),
             "cross_file_gaps_over_threshold": int((cross.gap_from_previous_file > MAX_GAP).sum()),
             "padded_feature_columns": missing_columns, "all_features_use_original_per_sample_transform": True,
             "prior_corpus_samples": len(prior), "prior_corpus_wafers": int(prior.WAFER_ID.nunique()),
             "prior_timestamp_range": [float(prior.start_timestamp.min()), float(prior.end_timestamp.max())],
             "external_timestamp_range": [float(frame.start_timestamp.min()), float(frame.end_timestamp.max())],
             "cohorts": {c: {"samples": len(g), "wafers": int(g.WAFER_ID.nunique()), "groups": int(g.group_id.nunique()),
                 "eligible": int(g.eligible.sum()), "direct_old_wafer_overlap": int(g.prior_wafer_overlap.sum()),
                 "old_component_overlap": int(g.prior_component_overlap.sum()), "unseen_chamber": int(g.unseen_chamber.sum()),
                 "stage_samples": {s: int(g.STAGE.eq(s).sum()) for s in ["A", "B"]},
                 "eligible_stage_samples": {s: int((g.eligible & g.STAGE.eq(s)).sum()) for s in ["A", "B"]}}
                 for c, g in frame.groupby("cohort")}}
    write_json(run_dir / "data_audit.json", audit)
    if not frame.eligible.any():
        raise ValueError("No independent, schema-compatible external samples; inspect data_audit.json")
    predictions = []
    with threadpool_limits(limits=4):
        for filename in sorted(protocol["model_hashes"]):
            bundle = joblib.load(source_run / "models" / filename)
            samples = frame[frame.eligible & frame.STAGE.eq(bundle.stage)]
            if samples.empty:
                continue
            pred, lower, upper = bundle.predict_interval(samples)
            part = samples[["cohort", "sample_id", *KEYS, "group_id", "chamber_route"]].copy()
            part["model"], part["y_pred"] = bundle.name, pred
            part["primary"] = bundle.name == protocol["primary_models"][bundle.stage]
            part["lower_90"], part["upper_90"] = lower, upper
            predictions.append(part)
    pd.concat(predictions, ignore_index=True).to_csv(run_dir / "predictions.csv", index=False)
    frozen = {"status": "predictions_frozen", "frozen_at": utcnow(),
              "protocol_sha256": sha256(run_dir / "protocol.json"),
              "predictions_sha256": sha256(run_dir / "predictions.csv"),
              "features_sha256": sha256(run_dir / "features.csv.gz"),
              "manifest_sha256": sha256(run_dir / "external_manifest.csv"),
              "audit_sha256": sha256(run_dir / "data_audit.json"),
              "acquisition_index_sha256": sha256(run_dir / "acquisition_index.json"),
              "trace_downloads_sha256": sha256(run_dir / "downloaded_traces.json"),
              "source_hashes": {name: sha256(Path(__file__).parent / name) for name in
                                ["common.py", "data.py", "models.py", "experiment.py", "external.py"]},
              "answer_values_read": False}
    write_json(run_dir / "prediction_freeze.json", frozen)
    print(pd.DataFrame(audit["cohorts"]).T[["samples", "eligible", "direct_old_wafer_overlap", "old_component_overlap", "unseen_chamber"]].to_string(), flush=True)
    print("Predictions frozen; external answer values have not been read.", flush=True)


def join_answers(manifest, labels):
    keys = ["cohort", *KEYS]
    if labels.duplicated(keys).any() or labels.isna().any().any():
        raise ValueError("Duplicate or missing answer keys/values")
    if not np.isfinite(labels[TARGET]).all() or (labels[TARGET] < 0).any():
        raise ValueError("Invalid answer values")
    joined = manifest.merge(labels, on=keys, how="outer", validate="one_to_one", indicator=True)
    if not joined._merge.eq("both").all():
        raise ValueError("External traces and answer keys must match exactly")
    return joined.drop(columns="_merge")


def score(source_run: Path, data_dir: Path, run_dir: Path):
    seal_path = run_dir / "evaluation_seal.json"
    if seal_path.exists():
        raise FileExistsError("External outcomes already opened; this evaluation cannot be repeated")
    frozen = read_json(run_dir / "prediction_freeze.json")
    for field, filename in [("protocol_sha256", "protocol.json"), ("predictions_sha256", "predictions.csv"),
                            ("manifest_sha256", "external_manifest.csv"), ("audit_sha256", "data_audit.json"),
                            ("acquisition_index_sha256", "acquisition_index.json"), ("trace_downloads_sha256", "downloaded_traces.json")]:
        if sha256(run_dir / filename) != frozen[field]:
            raise ValueError(f"Frozen input changed: {filename}")
    protocol = read_json(run_dir / "protocol.json")
    verify_models(source_run, protocol)
    downloads = read_json(run_dir / "downloaded_labels.json")
    for item in downloads["files"]:
        if sha256(data_dir / item["local_path"]) != item["sha256"]:
            raise ValueError("Answer file changed after download")
    seal = {"status": "started", "started_at": utcnow(), "prediction_freeze_sha256": sha256(run_dir / "prediction_freeze.json"),
            "answer_manifest_sha256": sha256(run_dir / "downloaded_labels.json"),
            "rule": "No refitting, recalibration, or model selection on these outcomes."}
    write_json(seal_path, seal)
    # No external answer values are parsed before this point.
    answers = []
    for cohort in protocol["cohorts"]:
        frame = pd.read_csv(data_dir / "labels" / f"CMP-{cohort}-removalrate.csv")
        if set(frame) != set(KEYS + [TARGET]):
            raise ValueError("Answer schema mismatch")
        frame["cohort"] = cohort
        answers.append(frame)
    manifest = pd.read_csv(run_dir / "external_manifest.csv")
    targets = join_answers(manifest, pd.concat(answers, ignore_index=True))
    predictions = pd.read_csv(run_dir / "predictions.csv")
    scored = predictions.merge(targets[["sample_id", TARGET]], on="sample_id", how="left", validate="many_to_one").rename(columns={TARGET: "y_true"})
    if scored.y_true.isna().any():
        raise ValueError("Missing labels for frozen predictions")
    rows = []
    for (cohort, stage, model), group in scored.groupby(["cohort", "STAGE", "model"]):
        expected = set(targets.loc[targets.cohort.eq(cohort) & targets.STAGE.eq(stage) & targets.eligible, "sample_id"])
        if set(group.sample_id) != expected or group.sample_id.duplicated().any():
            raise ValueError("External prediction coverage differs from frozen eligibility")
        base = {"cohort": cohort, "stage": stage, "model": model, "primary": bool(group.primary.iloc[0])}
        for column in [None, "group_id", "chamber_route"]:
            slices = [("all", group)] if column is None else [(column + "=" + str(key), g) for key, g in group.groupby(column)]
            for label, part in slices:
                row = {**base, "slice": label, **metrics(part.y_true, part.y_pred)}
                valid_interval = part.lower_90.notna().all() and part.upper_90.notna().all()
                if valid_interval:
                    row["coverage_90"] = float(((part.y_true >= part.lower_90) & (part.y_true <= part.upper_90)).mean())
                    row["mean_interval_width"] = float((part.upper_90 - part.lower_90).mean())
                rows.append(row)
    scored.to_csv(run_dir / "scored_predictions.csv", index=False)
    table = pd.DataFrame(rows)
    table.to_csv(run_dir / "metrics.csv", index=False)
    table[table.primary & table.slice.eq("all")].to_csv(run_dir / "primary_summary.csv", index=False)
    targets.loc[~targets.eligible, ["sample_id", "cohort", *KEYS, "group_id", "exclusion_reason"]].to_csv(run_dir / "excluded_samples.csv", index=False)
    for filename, expected in protocol["source_artifact_hashes"].items():
        if sha256(source_run / filename) != expected:
            raise ValueError(f"Original v1 artifact changed: {filename}")
    seal.update(status="complete", completed_at=utcnow(), original_artifacts_unchanged=True,
                label_counts={c: len(g) for c, g in targets.groupby("cohort")},
                metric_sha256=sha256(run_dir / "metrics.csv"), scored_predictions_sha256=sha256(run_dir / "scored_predictions.csv"))
    write_json(seal_path, seal)
    write_json(run_dir / "completion.json", {"status": "complete", "completed_at": utcnow(),
               "all_external_values_scored_once": True, "original_v1_artifacts_unchanged": True,
               "artifact_hashes": {p.relative_to(run_dir).as_posix(): sha256(p) for p in sorted(run_dir.rglob("*"))
                                   if p.is_file() and p.name != "completion.json"}})
    print(table[table.primary & table.slice.eq("all")][["cohort", "stage", "model", "n", "mae", "rmse", "r2", "coverage_90"]].to_string(index=False), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["freeze", "predict", "score"])
    parser.add_argument("--source-run", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path)
    args = parser.parse_args()
    if args.action == "freeze":
        freeze(args.source_run, args.run_dir)
    elif args.data_dir is None:
        parser.error("predict and score require --data-dir")
    elif args.action == "predict":
        prepare_predictions(args.source_run, args.data_dir, args.run_dir)
    else:
        score(args.source_run, args.data_dir, args.run_dir)
