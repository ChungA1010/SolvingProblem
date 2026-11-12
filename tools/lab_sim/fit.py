"""Maximum-likelihood fitting of the state model on training rows only."""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

from .features import contexts
from .state_model import ModelParams, RecipeParams, RecipeTracker, RECIPES

LAMBDAS = np.logspace(-3, 1, 41)       # q / r
ALPHAS = (0.0, 0.5, 1.0, 1.5)          # pressure exponent candidates when identifiable
PRESTON_ALPHA = 1.0                    # physics prior when training data cannot identify alpha
SHIFT = 0.015                          # |p / p_ref - 1| above this counts as a pressure shift
MIN_SHIFT_ROWS = 10
MIN_EVENT_ROWS = 5
BURN_IN = 5


def _prepare(rows: pd.DataFrame):
    return list(zip(contexts(rows), rows.mrr.to_numpy(float), rows.p_main.to_numpy(float)))


def _run(seq, params: RecipeParams, step_mode: str, use_pressure: bool):
    """One pass over a fully measured training sequence. Returns innovations and their scale."""
    t = RecipeTracker(params, step_mode)
    innov, scale, events = [], [], []
    for ctx, y, p in seq:
        pressure = p if use_pressure else None
        pred = t.predict(ctx, pressure)
        if pred is not None:
            innov.append(y - pred.mrr)
            scale.append(pred.sd ** 2)
            events.append((ctx.after_rest, ctx.after_pad_change))
        t.update(ctx, y, pressure)
    return np.array(innov), np.array(scale), np.array(events, dtype=bool).reshape(-1, 2)


def _concentrated(seq, base: RecipeParams, step_mode, use_pressure):
    """Best q/r ratio for fixed alpha and offsets; returns (loglik, q, r)."""
    best = None
    for lam in LAMBDAS:
        trial = RecipeParams(q=float(lam), r=1.0, alpha=base.alpha, p_ref=base.p_ref,
                             rest_offset=base.rest_offset, pad_offset=base.pad_offset)
        v, s, _ = _run(seq, trial, step_mode, use_pressure)
        v, s = v[BURN_IN:], s[BURN_IN:]
        # With r=1 every variance is in units of r and the Kalman gain depends only on q/r,
        # so innovations are exact and r can be concentrated out.
        r_hat = float(np.mean(v ** 2 / s))
        ll = -0.5 * float(np.sum(np.log(r_hat * s) + 1))
        if best is None or ll > best[0]:
            best = (ll, float(lam) * r_hat, r_hat)
    return best


def fit_recipe(rows: pd.DataFrame, step_mode: str, use_pressure: bool, use_events: bool) -> tuple[RecipeParams, dict]:
    rows = rows.sort_values(["t_start", "wafer_id", "stage"])
    p_ref = float(rows.p_main.median())
    seq = _prepare(rows)
    shift_rows = int((abs(rows.p_main / p_ref - 1) > SHIFT).sum())
    alphas = ALPHAS if (use_pressure and shift_rows >= MIN_SHIFT_ROWS) else (PRESTON_ALPHA if use_pressure else 0.0,)
    best = None
    for alpha in alphas:
        params = RecipeParams(q=0.1, r=1.0, alpha=float(alpha), p_ref=p_ref, rest_offset=0.0, pad_offset=0.0)
        for _ in range(3):  # fixed point: variances <-> event offsets
            ll, q, r = _concentrated(seq, params, step_mode, use_pressure)
            params = RecipeParams(q=q, r=r, alpha=params.alpha, p_ref=p_ref,
                                  rest_offset=params.rest_offset, pad_offset=params.pad_offset)
            if not use_events:
                break
            v, _, ev = _run(seq, params, step_mode, use_pressure)
            rest = params.rest_offset + (float(v[ev[:, 0]].mean()) if ev[:, 0].sum() >= MIN_EVENT_ROWS else 0.0)
            pad = params.pad_offset + (float(v[ev[:, 1]].mean()) if ev[:, 1].sum() >= MIN_EVENT_ROWS else 0.0)
            params = RecipeParams(q=q, r=r, alpha=params.alpha, p_ref=p_ref, rest_offset=rest, pad_offset=pad)
        ll, q, r = _concentrated(seq, params, step_mode, use_pressure)
        params = RecipeParams(q=q, r=r, alpha=params.alpha, p_ref=p_ref,
                              rest_offset=params.rest_offset, pad_offset=params.pad_offset)
        if best is None or ll > best[0]:
            best = (ll, params)
    info = {"loglik": best[0], "shift_rows": shift_rows,
            "alpha_source": "likelihood" if len(alphas) > 1 else ("preston_prior" if use_pressure else "off")}
    return best[1], info


def fit(train: pd.DataFrame, pad_step: float, step_mode: str, use_pressure: bool, use_events: bool,
        fitted_on: str = "") -> tuple[ModelParams, dict]:
    recipes, info = {}, {}
    for recipe in RECIPES:
        params, meta = fit_recipe(train[train.recipe == recipe], step_mode, use_pressure, use_events)
        if not all(math.isfinite(x) for x in (params.q, params.r, params.rest_offset, params.pad_offset)):
            raise ValueError(f"non-finite fit for {recipe}")
        recipes[recipe], info[recipe] = params, meta
    return ModelParams(step_mode=step_mode, recipes=recipes, pad_step=pad_step, fitted_on=fitted_on), info
