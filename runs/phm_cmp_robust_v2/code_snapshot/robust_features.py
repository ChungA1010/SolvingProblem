"""Target-free, gap-aware CMP episode features for a new research experiment."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .common import PRESSURE, ROTATION, SLURRY, STATUS, USAGE

GAP = 60.
SIGNALS = USAGE + ["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE + SLURRY + [STATUS] + ROTATION


def segments(t, mask):
    ids = np.flatnonzero(mask)
    if not len(ids):
        return []
    breaks = (np.diff(ids) > 1) | (np.diff(t[ids]) > GAP)
    return list(np.split(ids, np.flatnonzero(breaks) + 1))


def select_episode(values):
    """Longest positive pressure/rotation/slurry episode; no label-guided thresholds."""
    t = values.index.to_numpy(float)
    if not len(t):
        return np.array([], int), {"fallback": True, "episodes": 0, "ambiguous": True}
    mask = ((values.CENTER_AIR_BAG_PRESSURE.to_numpy() > 0) &
            ((values.WAFER_ROTATION.to_numpy() > 0) | (values.STAGE_ROTATION.to_numpy() > 0)) &
            (values[SLURRY].sum(axis=1).to_numpy() > 0))
    pieces = segments(t, mask)
    eligible = [s for s in pieces if len(s) >= 2 and t[s[-1]] - t[s[0]] >= 10.]
    fallback = not eligible
    if fallback:
        eligible = segments(t, np.ones(len(t), bool))
    chosen = max(eligible, key=lambda s: (t[s[-1]] - t[s[0]], len(s), -int(s[0])))
    span = float(t[chosen[-1]] - t[chosen[0]])
    count = sum(len(s) >= 2 and t[s[-1]] - t[s[0]] >= 10. for s in pieces)
    return chosen, {"fallback": fallback, "episodes": int(count),
                    "ambiguous": bool(fallback or count >= 4 or (t[-1] - t[0]) > 4 * max(span, 1.))}


def statistics(values, ids):
    sub = values.iloc[ids]
    t = sub.index.to_numpy(float)
    x = sub.to_numpy(float)
    dt = np.diff(t)
    valid_interval = (dt > 0) & (dt <= GAP) & (np.diff(ids) == 1)
    duration = float(dt[valid_interval].sum())
    result = {"duration": duration}
    # AUC and usage trend never connect across a gap or an excluded phase.
    for j, name in enumerate(SIGNALS):
        values_j = x[:, j]
        finite = np.isfinite(values_j)
        result[f"{name}_mean"] = float(values_j[finite].mean()) if finite.any() else np.nan
        if name in ROTATION:
            continue
        result[f"{name}_std"] = float(values_j[finite].std()) if finite.any() else np.nan
        interval = valid_interval & finite[:-1] & finite[1:]
        if name in USAGE:
            # Weighted within-segment least-squares slopes, preserving the original statistic on a single continuous episode.
            numerator = denominator = 0.
            for block in segments(t, finite):
                cuts = np.split(block, np.flatnonzero(np.diff(ids[block]) > 1) + 1)
                for piece in cuts:
                    a, b = t[piece], values_j[piece]
                    numerator += float(np.dot(a - a.mean(), b - b.mean()))
                    denominator += float(np.square(a - a.mean()).sum())
            result[f"{name}_decreasing"] = -numerator / denominator if denominator > 0 else 0.
        else:
            result[f"{name}_auc"] = float(np.sum(.5 * (values_j[:-1][interval] + values_j[1:][interval]) * dt[interval])) if len(t) else np.nan
    return result


def extract_robust(trace):
    primary = 4 if 4 in set(trace.CHAMBER) else 1
    records, quality = {}, {}
    for zone, mask in (("primary", trace.CHAMBER.eq(primary)), ("secondary", trace.CHAMBER.ne(primary))):
        values = trace.loc[mask].groupby("TIMESTAMP", sort=True)[SIGNALS].mean()
        t = values.index.to_numpy(float)
        chosen, info = select_episode(values)
        for view, ids in (("gap", np.arange(len(values))), ("phase", chosen)):
            records.update({f"{view}__p2_{zone}_{k}": v for k, v in statistics(values, ids).items()})
        quality.update({f"qc_{zone}_missing": bool(len(values) < 2), f"qc_{zone}_episodes": info["episodes"],
            f"qc_{zone}_fallback": info["fallback"], f"qc_{zone}_ambiguous": info["ambiguous"],
            f"qc_{zone}_span": float(t[-1] - t[0]) if len(t) else 0.,
            f"qc_{zone}_max_gap": float(np.diff(t).max()) if len(t) > 1 else 0.,
            f"qc_{zone}_phase_duration": records[f"phase__p2_{zone}_duration"]})
    return {**records, **quality}


def feature_view(frame, view):
    if view == "raw":
        return frame.copy()
    if view not in ("gap", "phase"):
        raise ValueError(view)
    columns = sorted(c for c in frame.columns if c.startswith("p2_"))
    out = frame.copy()
    out[columns] = frame[[f"{view}__{c}" for c in columns]].to_numpy(float)
    # Preserve original start/end so a segmented episode never makes its label available earlier.
    return out
