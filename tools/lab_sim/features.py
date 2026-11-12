"""Pre-start wafer context for the ch4 polishing table (A456 + B456 share one pad).

Every value here is known before the wafer starts: order, gap since the previous
table wafer ended, pad-usage counter at start. Calibration (the typical pad-usage
increment per wafer) is computed from the training rows only.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .state_model import RECIPES, WaferContext

PAD_DROP = -5.0        # pad counter drop that marks a replacement (team preprocessing rule)
REST_GAP_S = 500.0     # long-gap threshold (team preprocessing rule)


def load_table(path) -> pd.DataFrame:
    w = pd.read_csv(path).sort_values(["t_start", "wafer_id", "stage"]).reset_index(drop=True)
    w = w[w.recipe.isin(RECIPES)].reset_index(drop=True)
    need = {"wafer_id", "stage", "recipe", "fold", "t_start", "t_end", "mrr", "u_pad", "p_main"}
    missing = need - set(w.columns)
    if missing:
        raise ValueError(f"wafer table misses {sorted(missing)}")
    return w


def pad_step_from(train: pd.DataFrame) -> float:
    du = train.sort_values("t_start").u_pad.diff()
    gap = train.sort_values("t_start").t_start - train.sort_values("t_start").t_end.shift()
    ok = du[(du > 0) & (gap <= 300)]
    if len(ok) < 20:
        raise ValueError("not enough consecutive table wafers to calibrate the pad step")
    return float(ok.median())


def add_context(w: pd.DataFrame, pad_step: float) -> pd.DataFrame:
    """Adds gap/pad-change/rest flags, the pad-usage clock and same-recipe positions."""
    w = w.sort_values(["t_start", "wafer_id", "stage"]).reset_index(drop=True).copy()
    gap = w.t_start - w.t_end.shift()
    du = w.u_pad - w.u_pad.shift()
    pad_change = du < PAD_DROP
    hidden = np.where(du >= 0, np.maximum(np.rint(du / pad_step) - 1, 0), np.nan)
    rest = (gap > REST_GAP_S) & (pd.Series(hidden) == 0)
    clock = np.cumsum(1 + np.nan_to_num(hidden, nan=0.0))
    w["gap_s"] = gap
    w["pad_change"] = pad_change.fillna(False).astype(bool)
    w["hidden_est"] = hidden
    w["rest_confirmed"] = rest.fillna(False).astype(bool)
    w["clock"] = clock.astype(float)
    w["position"] = w.groupby("recipe").cumcount()
    # Flag the first wafer of each recipe since a table event (an event can happen on either recipe).
    for col, src in (("after_pad_change", "pad_change"), ("after_rest", "rest_confirmed")):
        flags = np.zeros(len(w), bool)
        pending = {r: False for r in RECIPES}
        for i, row in enumerate(w.itertuples()):
            if getattr(row, src):
                pending = {r: True for r in RECIPES}
            if pending[row.recipe]:
                flags[i] = True
                pending[row.recipe] = False
        w[col] = flags
    return w


def contexts(w: pd.DataFrame) -> list[WaferContext]:
    return [WaferContext(r.recipe, int(r.position), float(r.clock), bool(r.after_rest), bool(r.after_pad_change))
            for r in w.itertuples()]
