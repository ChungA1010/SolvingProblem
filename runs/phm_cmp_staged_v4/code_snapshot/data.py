from __future__ import annotations

import itertools
from pathlib import Path

import numpy as np
import pandas as pd

from .common import (CHANNELS, KEYS, MAX_GAP, META, RAW_COLUMNS, SEED,
                     SPLITS, STATUS, TARGET, sample_id, sha256, utcnow, write_json)


class UnionFind:
    def __init__(self, items):
        self.parents = {v: v for v in items}

    def find(self, item):
        while self.parents[item] != item:
            self.parents[item] = self.parents[self.parents[item]]
            item = self.parents[item]
        return item

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        self.parents[max(a, b)] = min(a, b)


def connected_file_groups(raw: pd.DataFrame) -> dict[str, str]:
    """Keep every file and every wafer (across both stages) inside one split."""
    uf = UnionFind(sorted(raw.source_file.unique()))
    for files in raw.groupby("WAFER_ID").source_file.unique():
        for file in files[1:]:
            uf.union(files[0], file)
    return {file: uf.find(file) for file in uf.parents}


def allocate_splits(samples: pd.DataFrame, seed: int = SEED) -> tuple[pd.Series, dict]:
    """500 target-value-blind greedy candidates. Stage counts only, never MRR."""
    counts = pd.crosstab(samples.group_id, samples.STAGE).reindex(columns=["A", "B"], fill_value=0)
    groups, values = counts.index.to_numpy(), counts.to_numpy(dtype=float)
    totals = values.sum(axis=0)
    ratios = np.array(list(SPLITS.values()))
    desired = ratios[:, None] * totals[None, :]
    names = np.array(list(SPLITS))
    rng = np.random.default_rng(seed)
    best = None
    for candidate in range(500):
        order = np.argsort(-(values.sum(axis=1) * rng.uniform(0.55, 1.45, len(groups))))
        actual = np.zeros_like(desired)
        assignments = {}
        for pos in order:
            scores = []
            for k in range(4):
                trial = actual.copy()
                trial[k] += values[pos]
                scores.append(float(np.square((trial - desired) / np.maximum(desired, 1)).sum()))
            k = int(np.argmin(np.array(scores) + rng.uniform(0, 1e-10, 4)))
            actual[k] += values[pos]
            assignments[groups[pos]] = names[k]
        if np.any(actual.sum(axis=1) == 0):
            continue
        stage_balance = actual / actual.sum(axis=1, keepdims=True)
        if np.max(np.abs(stage_balance - totals / totals.sum())) > 0.05:
            continue
        # Explicitly meet the spec's per-stage interval minimum, when feasible.
        if np.any(actual[2] < 80):
            continue
        score = float(np.square((actual - desired) / np.maximum(desired, 1)).sum())
        if best is None or score < best[0]:
            best = (score, assignments, actual.copy(), candidate)
    if best is None:
        raise ValueError("No valid group split met stage balance and calibration n>=80. No row fallback.")
    assignment = samples.group_id.map(best[1])
    return assignment, {"seed": seed, "candidates": 500, "chosen_candidate": best[3],
                        "score": best[0], "target_ratios": SPLITS,
                        "counts": {str(n): {s: int(best[2][i, j]) for j, s in enumerate(["A", "B"])} for i, n in enumerate(names)}}


def assert_split_integrity(manifest: pd.DataFrame) -> None:
    for col in ["WAFER_ID", "group_id", "sample_id"]:
        if (manifest.groupby(col).split.nunique() > 1).any():
            raise ValueError(f"Leakage: {col} spans splits")
    files = manifest.assign(source_file=manifest.source_files.str.split(";")).explode("source_file")
    if (files.groupby("source_file").split.nunique() > 1).any():
        raise ValueError("Leakage: source file spans splits")
    if manifest.duplicated(KEYS).any() or manifest.sample_id.duplicated().any():
        raise ValueError("Duplicate sample in manifest")


def collapse_timestamps(trace: pd.DataFrame) -> pd.DataFrame:
    ordered = trace.sort_values(["TIMESTAMP", "source_file", "original_row"], kind="stable")
    return ordered.groupby("TIMESTAMP", sort=True).agg({**{c: "mean" for c in CHANNELS}, STATUS: "last"}).reset_index()


def describe_trace(trace: pd.DataFrame) -> dict[str, float]:
    """Vectorized channel statistics; no extrapolation/integration through long gaps."""
    trace = collapse_timestamps(trace)
    t = trace.TIMESTAMP.to_numpy(float)
    t = t - t[0]
    x = trace[CHANNELS].to_numpy(float)
    dt = np.diff(t)
    observed = dt <= MAX_GAP
    denominator = np.square(t - t.mean()).sum()
    stats = {
        "mean": x.mean(axis=0), "std": x.std(axis=0, ddof=0),
        "min": x.min(axis=0), "max": x.max(axis=0),
        "first": x[0], "last": x[-1], "range": np.ptp(x, axis=0),
        "slope": ((t - t.mean())[:, None] * (x - x.mean(axis=0))).sum(axis=0) / denominator if denominator > 0 else np.zeros(x.shape[1]),
        "auc": (((x[1:] + x[:-1]) * 0.5) * (dt * observed)[:, None]).sum(axis=0),
        "zero_ratio": (x == 0).mean(axis=0),
    }
    result = {f"{channel}__{stat}": float(v[i]) for stat, v in stats.items() for i, channel in enumerate(CHANNELS)}
    state = trace[STATUS].to_numpy(float)
    result.update(n_timesteps=float(len(t)), elapsed_span=float(t[-1]),
                  observed_duration=float(dt[observed].sum()), gap_count=float((~observed).sum()),
                  water_active_ratio=float(state.mean()), water_change_count=float(np.count_nonzero(np.diff(state))))
    return result


def prepare(data_root: Path, run_dir: Path) -> None:
    if (run_dir / "split_manifest.csv").exists():
        raise FileExistsError("Prepared run already exists; preserve the frozen split and use train.")
    files = sorted((data_root / "CMP-data" / "training").glob("CMP-training-[0-9]*.csv"))
    if not files:
        raise FileNotFoundError("Expected CMP-data/training/CMP-training-ddd.csv under --data-root")
    label_path = data_root / "CMP-training-removalrate.csv"
    labels = pd.read_csv(label_path)
    if set(labels.columns) != set(KEYS + [TARGET]) or labels.duplicated(KEYS).any():
        raise ValueError("Invalid/duplicate target schema")
    if labels.isna().any().any() or not np.isfinite(labels[TARGET]).all() or (labels[TARGET] < 0).any():
        raise ValueError("Missing, negative, or non-finite target")
    frames, sources, empty = [], [], []
    for file in files:
        frame = pd.read_csv(file)
        if set(frame.columns) != RAW_COLUMNS:
            raise ValueError(f"Unexpected schema: {file.name}")
        sources.append({"file": file.name, "sha256": sha256(file), "rows": len(frame)})
        if frame.empty:
            empty.append(file.name)
            continue
        if frame.isna().any().any() or not np.isfinite(frame.drop(columns="STAGE").to_numpy(float)).all():
            raise ValueError(f"Missing or non-finite raw input: {file.name}")
        if not frame.STAGE.isin(["A", "B"]).all() or not frame[STATUS].isin([0, 1]).all():
            raise ValueError(f"Unexpected stage/status: {file.name}")
        frame["source_file"] = file.name
        frame["original_row"] = np.arange(2, len(frame) + 2)
        frames.append(frame)
    raw = pd.concat(frames, ignore_index=True)
    if (raw.groupby(KEYS).MACHINE_ID.nunique() > 1).any():
        raise ValueError("Wafer-stage maps to multiple machines; identity needs review")
    raw_count = len(raw)
    file_groups = connected_file_groups(raw)
    file_segments = raw.groupby(KEYS + ["source_file"]).agg(start=("TIMESTAMP", "min"), end=("TIMESTAMP", "max"), rows=("TIMESTAMP", "size")).reset_index()
    cross = file_segments.groupby(KEYS).filter(lambda g: len(g) > 1).copy()
    cross["gap_from_previous_file"] = np.nan
    for _, group in cross.groupby(KEYS):
        order = group.sort_values("start")
        gap = order.start - order.end.shift()
        if (gap.dropna() < 0).any():
            raise ValueError("Cross-file time ranges overlap; refusing an ambiguous merge")
        cross.loc[order.index, "gap_from_previous_file"] = gap.to_numpy()
    # Record lineage BEFORE deduplication, so no source file can escape grouping.
    provenance = raw.groupby(KEYS).agg(source_files=("source_file", lambda x: ";".join(sorted(x.unique()))), start_timestamp=("TIMESTAMP", "min"), end_timestamp=("TIMESTAMP", "max")).reset_index()
    provenance["group_id"] = provenance.source_files.map(lambda x: file_groups[x.split(";")[0]])
    duplicates = raw.duplicated(subset=sorted(RAW_COLUMNS))
    raw = raw.loc[~duplicates].copy()
    timestamp_collapses = int(len(raw) - raw.groupby(KEYS + ["CHAMBER", "TIMESTAMP"]).ngroups)
    records = []
    for (wafer, stage), group in raw.groupby(KEYS, sort=True):
        record = {"WAFER_ID": int(wafer), "STAGE": stage, "sample_id": sample_id(wafer, stage)}
        chambers = sorted(group.CHAMBER.unique())
        record["chamber_route"] = "-".join(str(int(c)) for c in chambers)
        record["f__chamber_count"] = len(chambers)
        # All-channel summaries collapse each chamber separately, then summarize
        # the full trace; per-chamber features retain route and phase differences.
        record.update({f"f__all__{k}": v for k, v in describe_trace(group).items()})
        for chamber, trace in group.groupby("CHAMBER"):
            prefix = f"f__ch{int(chamber)}__"
            record[prefix + "present"] = 1.0
            record.update({prefix + k: v for k, v in describe_trace(trace).items()})
        records.append(record)
    samples = pd.DataFrame(records).merge(provenance, on=KEYS, validate="one_to_one")
    samples = samples.merge(labels, on=KEYS, how="outer", validate="one_to_one", indicator=True)
    if not samples._merge.eq("both").all():
        raise ValueError("Trace and label keys do not match exactly")
    samples = samples.drop(columns="_merge")
    for col in samples.columns:
        if col.endswith("__present"):
            samples[col] = samples[col].fillna(0.0)
    samples["split"], split_info = allocate_splits(samples)
    assert_split_integrity(samples)
    for stage in ["A", "B"]:
        stage_samples = samples[samples.STAGE.eq(stage)]
        def observed_chambers(frame):
            return set(itertools.chain.from_iterable(frame.chamber_route.str.split("-")))
        if observed_chambers(stage_samples) - observed_chambers(stage_samples[stage_samples.split.eq("train")]):
            raise ValueError("Unseen chamber outside Train; no automatic schema extension")
    run_dir.mkdir(parents=True, exist_ok=True)
    samples.to_csv(run_dir / "features.csv.gz", index=False, compression="gzip")
    manifest_cols = ["sample_id", *KEYS, "group_id", "source_files", "chamber_route", "start_timestamp", "end_timestamp", "split"]
    manifest = samples[manifest_cols]
    manifest.to_csv(run_dir / "split_manifest.csv", index=False)
    cross.to_csv(run_dir / "cross_file_segments.csv", index=False)
    audit = {"created_at": utcnow(), "raw_file_count": len(files), "empty_files": empty,
             "raw_rows": raw_count, "exact_duplicate_rows_removed": int(duplicates.sum()),
             "deduplicated_rows": len(raw), "duplicate_timestamps_collapsed_within_chamber": timestamp_collapses,
             "raw_columns": len(RAW_COLUMNS), "targets": len(labels), "samples": len(samples),
             "stage_samples": {str(k): int(v) for k, v in samples.STAGE.value_counts().items()},
             "cross_file_wafer_stage_samples": int(cross.groupby(KEYS).ngroups),
             "cross_file_gaps_over_threshold": int((cross.gap_from_previous_file > MAX_GAP).sum()),
             "max_gap_source_timestamp_units": MAX_GAP,
             "file_wafer_connected_components": int(samples.group_id.nunique()),
             "unique_wafers": int(samples.WAFER_ID.nunique()),
             "features_before_train_selection": sum(c.startswith("f__") for c in samples),
             "zero_values_policy": "Preserved; zero ratio features do not interpret zeros as physical zero.",
             "outlier_policy": "No label-based exclusions or clipping in primary training/evaluation.",
             "split": split_info, "split_sha256": sha256(run_dir / "split_manifest.csv"),
             "features_sha256": sha256(run_dir / "features.csv.gz"),
             "leakage_checks": {"wafer_disjoint": True, "file_disjoint": True, "component_disjoint": True,
                                "target_blind_split": True, "join_coverage": "1981/1981" if len(samples)==1981 else f"{len(samples)}/{len(labels)}"},
             "dataset_files": sources + [{"file": label_path.name, "sha256": sha256(label_path), "rows": len(labels)}]}
    write_json(run_dir / "data_audit.json", audit)
    print(f"Prepared {len(samples)} samples, {audit['file_wafer_connected_components']} disjoint groups.", flush=True)
    print(split_info["counts"], flush=True)
