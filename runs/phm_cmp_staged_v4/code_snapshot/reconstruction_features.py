"""Paper-3 Figure III phase/CPP alternatives; no target values are consulted."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .common import KEYS, sample_id, sha256


def phase_features(trace):
    primary = 4 if 4 in set(trace.CHAMBER) else 1
    cols = ["CENTER_AIR_BAG_PRESSURE", "SLURRY_FLOW_LINE_A", "WAFER_ROTATION", "STAGE_ROTATION"]
    values = trace[trace.CHAMBER.eq(primary)].groupby("TIMESTAMP", sort=True)[cols].mean()
    if values.empty:
        raise ValueError("Missing primary chamber")
    pressure = values.CENTER_AIR_BAG_PRESSURE.to_numpy(float)
    slurry = values.SLURRY_FLOW_LINE_A.to_numpy(float)
    # Figure III shows a pressure plateau before the end-phase slurry-A rise.
    # These numerical thresholds are declared assumptions, not author values.
    plateau = np.quantile(pressure[pressure > 0], .9) if (pressure > 0).any() else 0.
    mask = pressure >= .9 * plateau if plateau > 0 else np.zeros(len(values), bool)
    positive_slurry = slurry[mask & (slurry > 0)]
    if len(positive_slurry):
        mask &= slurry <= 1.2 * np.median(positive_slurry)
    rotating = (values.WAFER_ROTATION.to_numpy() > 0) | (values.STAGE_ROTATION.to_numpy() > 0)
    mask &= rotating
    t = values.index.to_numpy(float)
    # Select the longest continuous plateau, never integrate across excluded phases.
    ids = np.flatnonzero(mask)
    fallback = len(ids) < 2
    if fallback:
        chosen = np.arange(len(values))
    else:
        segments = np.split(ids, np.flatnonzero(np.diff(ids) > 1) + 1)
        chosen = max(segments, key=lambda x: (t[x[-1]] - t[x[0]], len(x), -int(x[0])))
    return {"native_primary_start": float(t[0]), "native_primary_end": float(t[-1]),
            "native_phase_start": float(t[chosen[0]]), "native_phase_end": float(t[chosen[-1]]),
            "native_duration": float(t[chosen[-1]] - t[chosen[0]]),
            "native_pressure_integral": float(np.trapezoid(pressure[chosen], t[chosen])),
            "native_phase_fallback": fallback}


def assign_recipe_cpp(frame, endpoint):
    if endpoint not in ("primary_end", "start"):
        raise ValueError(endpoint)
    cpp = 0
    ids = pd.Series(index=frame.index, dtype="int64")
    first = pd.Series(0., index=frame.index)
    for _, group in frame.groupby(["machine", "route", "STAGE"], sort=True):
        previous = None
        for idx in group.sort_values(["native_primary_start", "sample_id"], kind="stable").index:
            start = frame.at[idx, "native_primary_start"]
            new = previous is None or start - previous > 500
            if new:
                cpp += 1
            ids.at[idx], first.at[idx] = cpp, float(new)
            previous = frame.at[idx, "native_primary_end"] if endpoint == "primary_end" else start
    return ids.astype(int), first


def augment(frame, original_root, external_root, expected_sources, progress=print):
    records = []
    expected = {(r["cohort"], r["file"]): r["sha256"] for r in expected_sources}
    for cohort in ("training", "validation", "test"):
        folder = original_root / "CMP-data/training" if cohort == "training" else external_root / cohort
        files = sorted(folder.glob(f"CMP-{cohort}-[0-9]*.csv"))
        if len(files) != 185:
            raise ValueError(f"Expected 185 {cohort} files")
        rows = []
        for path in files:
            if sha256(path) != expected[(cohort, path.name)]:
                raise ValueError(f"Source changed: {path}")
            rows.append(pd.read_csv(path))
        raw = pd.concat(rows, ignore_index=True)
        for (wafer, stage), trace in raw.groupby(KEYS, sort=True):
            records.append({"sample_id": sample_id(wafer, stage), **phase_features(trace)})
        progress(f"Target-free revised phase extraction: {cohort}")
    augmented = frame.merge(pd.DataFrame(records), on="sample_id", validate="one_to_one")
    if len(augmented) != len(frame):
        raise ValueError("Phase extraction lost samples")
    for endpoint in ("primary_end", "start"):
        augmented[f"native_cpp_{endpoint}"], augmented[f"native_first_{endpoint}"] = assign_recipe_cpp(augmented, endpoint)
    return augmented


def p3_view(frame, variant):
    out = frame.copy()
    if variant["phase"] == "figure3":
        out["p3_duration"] = out.native_duration
        out["p3_pressure_integral"] = out.native_pressure_integral
        out["p3_start"] = out.native_primary_start
    if variant["cpp"] != "legacy":
        endpoint = variant["cpp"]
        out["p3_cpp"] = out[f"native_cpp_{endpoint}"]
        out["p3_first"] = out[f"native_first_{endpoint}"]
    return out
