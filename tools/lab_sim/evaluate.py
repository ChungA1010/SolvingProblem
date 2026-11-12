"""Development-fold evaluation of the state model v2 candidates (issue #6).

Declared before running:
  candidates  C1 position steps + event offsets
              C2 C1 + pressure-normalised state (alpha by likelihood, Preston alpha=1 if not identifiable)
              C3 C2 with pad-usage clock steps (estimated hidden wafers)
  references  EWMA(0.4) and Ridge v1 (recipe + prev_mrr + EWMA), both refit per scenario as in the
              Issue #2 protocol (favourable to Ridge)
  protocol    chronological expanding window, evaluation folds 2..5, parameters fit on earlier folds only,
              evaluation labels only update the online state; sealed official validation/test never used
  adoption    beats Ridge v1 on >= 3 of 4 folds at N=0, block-bootstrap 95% CI of the MAE gain > 0,
              and N=1 MAE not worse than Ridge v1
These folds were already used during development, so results are exploratory.

Usage: python -m tools.lab_sim.evaluate --wafer-table <wafer_table.csv> --out runs/lab_sim_state_model_v2
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .features import add_context, contexts, load_table, pad_step_from
from .fit import fit
from .state_model import StateModel

CANDIDATES = {
    "C1 position+events": dict(step_mode="position", use_pressure=False, use_events=True),
    "C2 +pressure-normalised": dict(step_mode="position", use_pressure=True, use_events=True),
    "C3 +pad-usage clock": dict(step_mode="clock", use_pressure=True, use_events=True),
}
SCENARIOS = [("N=0", 0, 1), ("N=1", 1, 1), ("N=2", 2, 1), ("every 5", 0, 5), ("every 10", 0, 10)]


def run_state_model(model: StateModel, w: pd.DataFrame, N: int, k: int):
    """Replays the table in time order under a measurement policy. Returns pre-start and in-process predictions."""
    pre = np.full((len(w), 3), np.nan)   # mean, low, high (planned pressure = last same-recipe wafer's pressure)
    inproc = np.full(len(w), np.nan)
    ctxs = contexts(w)
    pending = []  # (release position, same-recipe position, row index)
    last_pressure = {}  # the previous wafer of the recipe has finished polishing before this start
    for i, ctx in enumerate(ctxs):
        ready = [p for p in pending if p[0] <= ctx.position and w.recipe.iat[p[2]] == ctx.recipe]
        pending = [p for p in pending if p not in ready]
        for _, _, j in sorted(ready, key=lambda p: p[1]):
            model.update(ctxs[j], float(w.mrr.iat[j]), float(w.p_main.iat[j]))
        pred = model.predict(ctx, last_pressure.get(ctx.recipe))
        if pred is not None:
            pre[i] = (pred.mrr, pred.low, pred.high)
            inproc[i] = model.predict(ctx, float(w.p_main.iat[i])).mrr
        last_pressure[ctx.recipe] = float(w.p_main.iat[i])
        if ctx.position % k == 0:
            pending.append((ctx.position + N + 1, ctx.position, i))
    return pre, inproc


def ewma_features(w: pd.DataFrame, N: int, k: int, alpha=0.4):
    prev = np.full(len(w), np.nan); ewm = np.full(len(w), np.nan)
    for _, g in w.groupby("recipe"):
        s = None; last = np.nan; pending = []
        for i in g.index:
            pos = w.position.iat[i]
            ready = sorted([p for p in pending if p[0] <= pos])
            pending = [p for p in pending if p[0] > pos]
            for _, v in ready:
                s = v if s is None else alpha * v + (1 - alpha) * s; last = v
            prev[i] = last; ewm[i] = np.nan if s is None else s
            if pos % k == 0:
                pending.append((pos + N + 1, w.mrr.iat[i]))
    return prev, ewm


def ridge_v1():
    pre = ColumnTransformer([("recipe", OneHotEncoder(handle_unknown="ignore"), ["recipe"]),
                             ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")),
                                                   ("scaler", StandardScaler())]), ["prev_mrr", "state_ewm"])])
    return Pipeline([("preprocessing", pre), ("model", Ridge(alpha=1.0))])


def block_bootstrap(diff: np.ndarray, block=20, n=5000, seed=0):
    rng = np.random.default_rng(seed)
    blocks = [diff[i:i + block] for i in range(0, len(diff), block)]
    means = [np.concatenate([blocks[j] for j in rng.integers(0, len(blocks), len(blocks))]).mean() for _ in range(n)]
    return [float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))]


def evaluate(table: Path, out: Path):
    raw = load_table(table)
    records, per_wafer, fits = [], [], {}
    for fold in range(2, 6):
        train_raw = raw[raw.fold < fold]
        w = add_context(raw[raw.fold <= fold], pad_step_from(train_raw))
        train, ev = w[w.fold < fold], (w.fold == fold).to_numpy()
        for name, opts in CANDIDATES.items():
            params, info = fit(train, pad_step_from(train_raw), **opts)
            fits[f"{name} | fold {fold}"] = {r: {**vars(p), **info[r]} for r, p in params.recipes.items()}
            for scen, N, k in SCENARIOS:
                pre, inproc = run_state_model(StateModel(params), w, N, k)
                y = w.mrr.to_numpy()
                m = ev & ~np.isnan(pre[:, 0])
                records.append({"scenario": scen, "fold": fold, "model": name, "n": int(m.sum()),
                                "mae": float(np.mean(np.abs(y[m] - pre[m, 0]))),
                                "mae_inprocess": float(np.mean(np.abs(y[m] - inproc[m]))),
                                "coverage90": float(np.mean((y[m] >= pre[m, 1]) & (y[m] <= pre[m, 2]))),
                                "width90": float(np.mean(pre[m, 2] - pre[m, 1]))})
                if scen == "N=0":
                    per_wafer.append(pd.DataFrame({"fold": fold, "model": name, "row": np.where(m)[0],
                                                   "y": y[m], "pred": pre[m, 0], "inproc": inproc[m],
                                                   "shift": (abs(w.p_main.to_numpy()[m] / w.recipe.map(
                                                       {r: p.p_ref for r, p in params.recipes.items()}).to_numpy()[m] - 1) > 0.015)}))
        for scen, N, k in SCENARIOS:
            prev, ewm = ewma_features(w, N, k)
            f = w.assign(prev_mrr=prev, state_ewm=ewm)
            tr = f[f.fold < fold]
            pipe = ridge_v1().fit(tr[["recipe", "prev_mrr", "state_ewm"]], tr.mrr)
            m = ev & ~np.isnan(ewm)
            y = w.mrr.to_numpy()[m]
            for name, pred in (("EWMA(0.4)", ewm[m]), ("Ridge v1", pipe.predict(f.loc[m, ["recipe", "prev_mrr", "state_ewm"]]))):
                records.append({"scenario": scen, "fold": fold, "model": name, "n": int(m.sum()),
                                "mae": float(np.mean(np.abs(y - pred))), "mae_inprocess": np.nan,
                                "coverage90": np.nan, "width90": np.nan})
                if scen == "N=0":
                    per_wafer.append(pd.DataFrame({"fold": fold, "model": name, "row": np.where(m)[0], "y": y,
                                                   "pred": pred, "inproc": np.nan, "shift": False}))
    r = pd.DataFrame(records)
    pw = pd.concat(per_wafer, ignore_index=True)
    out.mkdir(parents=True, exist_ok=True)
    r.to_csv(out / "metrics_by_fold.csv", index=False)

    def weighted(col):
        return r.groupby(["scenario", "model"]).apply(lambda g: np.average(g[col], weights=g.n), include_groups=False).unstack("scenario")

    summary = {"mae": weighted("mae"), "mae_inprocess": weighted("mae_inprocess"),
               "coverage90": weighted("coverage90"), "width90": weighted("width90")}
    order = [s for s, _, _ in SCENARIOS]
    v1 = r[(r.model == "Ridge v1")].set_index(["scenario", "fold"]).mae
    v1_rows = pw[pw.model == "Ridge v1"].set_index(["fold", "row"])
    decisions = {}
    for name in CANDIDATES:
        c = r[r.model == name].set_index(["scenario", "fold"]).mae
        wins = int(sum(c[("N=0", f)] < v1[("N=0", f)] for f in range(2, 6)))
        cand = pw[pw.model == name].set_index(["fold", "row"])
        joined = cand.join(v1_rows[["pred"]], rsuffix="_v1", how="inner").sort_index()
        diff = (np.abs(joined.y - joined.pred_v1) - np.abs(joined.y - joined.pred)).to_numpy()
        ci = block_bootstrap(diff)
        n1_ok = bool(summary["mae"].loc[name, "N=1"] <= summary["mae"].loc["Ridge v1", "N=1"])
        shift = cand[cand["shift"]]
        decisions[name] = {"fold_wins_vs_v1_N0": wins, "mae_gain_vs_v1_N0": float(diff.mean()), "gain_ci95": ci,
                           "n1_not_worse": n1_ok, "passes_adoption_rule": bool(wins >= 3 and ci[0] > 0 and n1_ok),
                           "pressure_shift_wafers": int(len(shift)),
                           "shift_mae_prestart": float(np.mean(np.abs(shift.y - shift.pred))) if len(shift) else None,
                           "shift_mae_inprocess": float(np.mean(np.abs(shift.y - shift.inproc))) if len(shift) else None}
    payload = {"exploratory": True, "sealed_data_used": False,
               "summary": {k: v[order].round(4).to_dict(orient="index") for k, v in summary.items()},
               "decisions": decisions, "fits": fits}
    (out / "summary.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False, default=float), encoding="utf-8")
    print("MAE (pre-start), weighted over folds 2..5")
    print(summary["mae"][order].round(3).to_string())
    print("\nMAE in-process (own wafer pressure observed)")
    print(summary["mae_inprocess"][order].dropna(how="all").round(3).to_string())
    print("\n90% interval coverage / width")
    print(summary["coverage90"][order].dropna(how="all").round(3).to_string())
    print(summary["width90"][order].dropna(how="all").round(2).to_string())
    print("\nAdoption check")
    print(json.dumps(decisions, indent=1, default=float))
    return payload


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wafer-table", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=Path("runs/lab_sim_state_model_v2"))
    a = ap.parse_args()
    evaluate(a.wafer_table, a.out)
