"""Features explicitly mapped to the three supplied PHM papers.

Unspecified conventions are documented in docs/paper-reproduction.md.
No target values are used by this module's feature extraction.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .common import PRESSURE, ROTATION, SLURRY, STATUS, USAGE

SIGNALS = USAGE[:4] + ["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE[:4] + USAGE[4:] + SLURRY + ROTATION + [STATUS, PRESSURE[-1]]
# Appendix, p.13: F1..F35 in the paper's exact order.
APPENDIX = [("moment3", n) for n in [7, 9, 10, 15, 17, 18, 23, 25]] + [
    ("skew", n) for n in [7, 8, 10, 12, 14, 15, 16, 19, 20, 25]] + [
    ("std", n) for n in [7, 8, 9, 10, 11, 12, 14, 16, 19, 21, 25]] + [
    ("kurtosis", n) for n in [7, 12, 22, 23, 24, 25]]
P1_COLUMNS = [f"p1_F{i:02d}_{stat}_x{n}" for i, (stat, n) in enumerate(APPENDIX, 1)]
P3_ROUGH = ["p3_wafer", "p3_stage", "p3_dresser", "p3_dresser_table", "p3_table", "p3_membrane",
            "p3_duration", "p3_pressure_integral", "p3_first", "p3_start", "p3_cpp"]
P3_FINE = ["p3_wafer", "p3_dresser", "p3_dresser_table", "p3_table", "p3_membrane", "p3_cpp"]


def moment_features(x):
    x = np.asarray(x, dtype=float)
    centered = x - x.mean(axis=0)
    variance = np.mean(centered ** 2, axis=0)
    std = np.sqrt(variance)
    m3 = np.mean(centered ** 3, axis=0)
    m4 = np.mean(centered ** 4, axis=0)
    return {"std": std, "moment3": m3,
            "skew": np.divide(m3, std ** 3, out=np.zeros_like(std), where=std > 1e-12),
            "kurtosis": np.divide(m4, variance ** 2, out=np.zeros_like(std), where=variance > 1e-24)}


def extract(trace):
    trace = trace.sort_values(["TIMESTAMP", "CHAMBER"], kind="stable")
    chambers = set(trace.CHAMBER.astype(int))
    if chambers <= {4, 5, 6}:
        route, primary = "456", 4
    elif chambers <= {1, 2, 3}:
        route, primary = "123", 1
    else:
        raise ValueError(f"Unknown chamber route {chambers}")
    stage = str(trace.STAGE.iloc[0])
    if stage == "B" and route == "123":
        raise ValueError("Paper 2 has no Cond for B/123")
    result = {"machine": int(trace.MACHINE_ID.iloc[0]), "route": route,
              "condition": "Cond1" if stage == "A" and route == "456" else "Cond2" if stage == "B" else "Cond3",
              "start": float(trace.TIMESTAMP.min()), "end": float(trace.TIMESTAMP.max())}
    stats = moment_features(trace[SIGNALS].to_numpy(float))
    result.update({col: float(stats[stat][n - 7]) for col, (stat, n) in zip(P1_COLUMNS, APPENDIX)})
    for chamber_group, mask in [("primary", trace.CHAMBER.eq(primary)), ("secondary", trace.CHAMBER.ne(primary))]:
        segment = trace.loc[mask]
        columns = USAGE + ["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE + SLURRY + [STATUS] + ROTATION
        values = segment.groupby("TIMESTAMP", sort=True)[columns].mean()
        t = values.index.to_numpy(float)
        duration = float(t[-1] - t[0]) if len(t) else 0.0
        result[f"p2_{chamber_group}_duration"] = duration
        for c in USAGE:
            x = values[c].to_numpy(float)
            denominator = np.square(t - t.mean()).sum() if len(t) else 0.0
            result[f"p2_{chamber_group}_{c}_mean"] = float(x.mean()) if len(x) else np.nan
            result[f"p2_{chamber_group}_{c}_std"] = float(x.std()) if len(x) else np.nan
            result[f"p2_{chamber_group}_{c}_decreasing"] = -float(np.dot(t - t.mean(), x - x.mean()) / denominator) if denominator > 0 else 0.0
        for c in ["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE + SLURRY + [STATUS]:
            x = values[c].to_numpy(float)
            result[f"p2_{chamber_group}_{c}_mean"] = float(x.mean()) if len(x) else np.nan
            result[f"p2_{chamber_group}_{c}_std"] = float(x.std()) if len(x) else np.nan
            result[f"p2_{chamber_group}_{c}_auc"] = float(np.trapezoid(x, t)) if len(x) else np.nan
        for c in ROTATION:
            result[f"p2_{chamber_group}_{c}_mean"] = float(values[c].mean()) if len(values) else np.nan
    primary_trace = trace[trace.CHAMBER.eq(primary)]
    if primary_trace.empty:
        raise ValueError("Missing primary chamber")
    active = primary_trace[(primary_trace.PRESSURIZED_CHAMBER_PRESSURE > 0) &
                           (primary_trace.WAFER_ROTATION > 0) & (primary_trace[SLURRY].sum(axis=1) > 0)]
    result["phase_fallback"] = bool(active.empty)
    if active.empty:
        active = primary_trace
    pressure = active.groupby("TIMESTAMP").PRESSURIZED_CHAMBER_PRESSURE.mean()
    result.update(p3_wafer=float(trace.WAFER_ID.iloc[0]), p3_stage=float(stage == "B"),
                  p3_dresser=float(primary_trace.USAGE_OF_DRESSER.iloc[0]),
                  p3_dresser_table=float(primary_trace.USAGE_OF_DRESSER_TABLE.iloc[0]),
                  p3_table=float(primary_trace.USAGE_OF_POLISHING_TABLE.iloc[0]),
                  p3_membrane=float(primary_trace.USAGE_OF_MEMBRANE.iloc[0]),
                  p3_duration=float(active.TIMESTAMP.max() - active.TIMESTAMP.min()),
                  p3_pressure_integral=float(np.trapezoid(pressure.to_numpy(float), pressure.index.to_numpy(float))),
                  p3_start=float(primary_trace.TIMESTAMP.min()))
    assert len([c for c in result if c.startswith("p2_")]) == 104
    return result


def assign_cpp(frame):
    """Label-free transductive run context; no targets are read here."""
    out = frame.copy()
    out["p3_cpp"] = -1
    out["p3_first"] = 0.0
    cpp = 0
    for _, group in out.groupby(["machine", "route"], sort=True):
        previous_end = None
        for idx in group.sort_values(["start", "sample_id"], kind="stable").index:
            new = previous_end is None or out.at[idx, "start"] - previous_end > 500
            if new:
                cpp += 1
            out.at[idx, "p3_cpp"] = cpp
            out.at[idx, "p3_first"] = float(new)
            previous_end = out.at[idx, "end"]
    return out
