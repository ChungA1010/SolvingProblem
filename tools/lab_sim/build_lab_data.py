"""Build the lab simulator's model file, replay data and JS parity fixture (issue #6).

* model   ui-redesign/dist/lab-sim/state-model-v2.json   C2 parameters fitted on folds 1..4 only (committed)
* replay  ui-redesign/dist/lab-sim/data/replay.json      fold 5 (A456+B456, 327 wafers) with real sensor traces,
                                                          plus the tracker state at the end of fold 4 (NOT committed
                                                          until the data publication decision in issue #6)
* parity  ui-redesign/tests/fixtures/lab-sim-parity.json synthetic sequence + Python predictions (no PHM values)

Fold 5 is never used for fitting, so every prediction a student sees is out-of-sample for the parameters.
Sealed official validation/test data is not read.

Usage:
  python -m tools.lab_sim.build_lab_data --wafer-table <wafer_table.csv> --traces <CMP-data/training>
"""

from __future__ import annotations

import argparse
import glob
import json
import math
import os
from pathlib import Path

import numpy as np
import pandas as pd

from .features import add_context, contexts, load_table, pad_step_from
from .fit import fit
from .state_model import ModelParams, RecipeParams, StateModel, WaferContext

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "ui-redesign"
TRACE_COLS = {"MAIN_OUTER_AIR_BAG_PRESSURE": "p_main", "CENTER_AIR_BAG_PRESSURE": "p_center",
              "RETAINER_RING_PRESSURE": "p_retainer", "WAFER_ROTATION": "wafer_rot",
              "STAGE_ROTATION": "stage_rot", "HEAD_ROTATION": "head_rot", "SLURRY_FLOW_LINE_C": "slurry_c"}
SPEC_PCT = 5.0
HISTORY_POINTS = 40


def r(x, nd=3):
    return None if x is None or (isinstance(x, float) and not math.isfinite(x)) else round(float(x), nd)


def extract_traces(trace_dir: Path, wanted: set[tuple[int, str]]) -> dict:
    """Polishing-chamber (4) rows per wafer, relative seconds, with recipe step boundaries."""
    frames = []
    for path in sorted(glob.glob(os.path.join(trace_dir, "*.csv"))):
        d = pd.read_csv(path, usecols=["TIMESTAMP", "WAFER_ID", "STAGE", "CHAMBER", *TRACE_COLS])
        d = d[d.CHAMBER == 4]
        d = d[[k in wanted for k in zip(d.WAFER_ID, d.STAGE)]]
        if len(d):
            frames.append(d)
    raw = pd.concat(frames, ignore_index=True).drop_duplicates()
    raw = raw.drop_duplicates(["WAFER_ID", "STAGE", "TIMESTAMP"], keep="first")  # team rule: first value wins
    out = {}
    for (wid, stage), g in raw.groupby(["WAFER_ID", "STAGE"]):
        g = g.sort_values("TIMESTAMP")
        t = (g.TIMESTAMP - g.TIMESTAMP.iloc[0]).to_numpy()
        p = g.MAIN_OUTER_AIR_BAG_PRESSURE.to_numpy()
        q = g.SLURRY_FLOW_LINE_C.to_numpy()
        hi = p[p > 0.5 * p.max()] if p.max() > 0 else np.array([])
        plateau = float(np.median(hi)) if len(hi) else float("nan")
        on = np.abs(p - plateau) <= 0.02 * plateau
        q_on = float(np.median(q[on])) if on.any() else float("nan")
        main = on & (q > 0.5 * q_on)
        idx = np.flatnonzero(main)
        if len(idx) < 10:
            continue
        rinse = (p > 0.7 * plateau) & (p < 0.9 * plateau)
        r_idx = np.flatnonzero(rinse & (np.arange(len(p)) > idx[-1]))
        out[(int(wid), stage)] = {
            "t": [r(x, 1) for x in t],
            **{name: [r(x, 1) for x in g[col].to_numpy()] for col, name in TRACE_COLS.items()},
            "main_start": int(idx[0]), "main_end": int(idx[-1]),
            "rinse_start": int(r_idx[0]) if len(r_idx) else None, "rinse_end": int(r_idx[-1]) if len(r_idx) else None,
            "plateau": r(plateau, 2),
        }
    return out


def parity_fixture(params: ModelParams) -> dict:
    """Synthetic replay with every model operation, for checking the browser port."""
    rng = np.random.default_rng(6)
    steps, level = [], {"A456": 74.0, "B456": 80.0}
    pos = {"A456": 0, "B456": 0}
    clock = 0.0
    model = StateModel(params)
    pending = []
    for i in range(120):
        recipe = "A456" if rng.random() < 0.5 else "B456"
        clock += 1 + int(rng.integers(0, 3))
        ctx = WaferContext(recipe, pos[recipe], clock, bool(rng.random() < 0.08), bool(rng.random() < 0.06))
        pos[recipe] += 1
        level[recipe] += rng.normal(0, 1.2)
        p_ref = params.recipes[recipe].p_ref
        planned = p_ref * (1 + (rng.normal(0, 0.03) if rng.random() < 0.2 else 0))
        observed = planned * (1 + rng.normal(0, 0.002))
        mrr = level[recipe] * (observed / p_ref) + rng.normal(0, 2.5)
        pre = model.predict(ctx, planned)
        inproc = model.predict(ctx, observed)
        steps.append({"ctx": vars(ctx), "planned": planned, "observed": observed, "mrr": mrr,
                      "pre": None if pre is None else vars(pre), "inproc": None if inproc is None else vars(inproc),
                      "measure": bool(rng.random() < 0.7), "delay": int(rng.integers(0, 3))})
        if steps[-1]["measure"]:
            pending.append((i + steps[-1]["delay"], i))
        for due, j in sorted([p for p in pending if p[0] <= i]):
            s = steps[j]
            model.update(WaferContext(**s["ctx"]), s["mrr"], s["observed"])
            s.setdefault("applied_at", i)
        pending = [p for p in pending if p[0] > i]
    return {"params": params.to_json(), "steps": steps,
            "note": "Synthetic values only. Measurements are applied at the end of step index `applied_at`, in due order."}


def build(table: Path, trace_dir: Path, out_dir: Path, fixture: Path):
    raw = load_table(table)
    train_raw = raw[raw.fold < 5]
    pad_step = pad_step_from(train_raw)
    w = add_context(raw, pad_step)
    train = w[w.fold < 5]
    params, info = fit(train, pad_step, step_mode="position", use_pressure=True, use_events=True,
                       fitted_on="PHM 2016 CMP training partition, chronological folds 1-4 (A456, B456)")
    params.notes = [
        "Educational development model; no independent final validation.",
        "MRR stays on the raw PHM label scale; physical unit unverified.",
        "Pre-start accuracy equals Ridge v1 within noise (runs/lab_sim_state_model_v2/REPORT.md).",
        "Pressure correction alpha: " + ", ".join(f"{k}={v.alpha} ({info[k]['alpha_source']})" for k, v in params.recipes.items()),
    ]
    model_json = params.to_json()
    recipe_meta = {}
    for rec in params.recipes:
        t = train[train.recipe == rec]
        mrr_ref, t_ref = float(t.mrr.median()), float(t.t_polish.median())
        recipe_meta[rec] = {"mrr_ref": r(mrr_ref), "t_ref": r(t_ref, 1), "target_removal": r(mrr_ref * t_ref, 1),
                            "spec_pct": SPEC_PCT, "p_ref": r(params.recipes[rec].p_ref, 2)}
    model_json["recipe_meta"] = recipe_meta

    # Warm the state up on folds 1..4 (fully measured), exactly as the online replay would.
    model = StateModel(params)
    history = {rec: [] for rec in params.recipes}
    last_p = {}
    for ctx, row in zip(contexts(train), train.itertuples()):
        pred = model.predict(ctx, last_p.get(ctx.recipe))
        model.update(ctx, float(row.mrr), float(row.p_main))
        last_p[ctx.recipe] = float(row.p_main)
        history[ctx.recipe].append({"mrr": r(row.mrr), "pred": None if pred is None else r(pred.mrr),
                                    "low": None if pred is None else r(pred.low), "high": None if pred is None else r(pred.high)})
    session = w[w.fold == 5]
    t0 = float(session.t_start.min())
    traces = extract_traces(trace_dir, set(zip(session.wafer_id.astype(int), session.stage)))
    wafers = []
    for n, row in enumerate(session.itertuples(), 1):
        tr = traces.get((int(row.wafer_id), row.stage))
        wafers.append({
            "n": n, "label": f"W{n:03d}", "recipe": row.recipe, "position": int(row.position), "clock": r(row.clock, 1),
            "t_start_h": r((row.t_start - t0) / 3600, 4), "t_end_h": r((row.t_end - t0) / 3600, 4),
            "gap_s": r(row.gap_s, 1), "after_rest": bool(row.after_rest), "after_pad_change": bool(row.after_pad_change),
            "pad_change": bool(row.pad_change), "rest": bool(row.rest_confirmed),
            "u_pad": r(row.u_pad, 2), "u_dresser": r(row.u_dresser, 2), "p_main": r(row.p_main, 3),
            "t_polish_factory": r(row.t_polish, 1), "mrr": r(row.mrr, 4), "trace": tr,
        })
    replay = {
        "schema_version": 1, "source": "PHM 2016 Data Challenge CMP training partition, chronological fold 5 (A456/B456)",
        "citation": "PHM Society, PHM 2016 Data Challenge - CMP Dataset (2016)",
        "model_version": params.version, "units": "raw PHM values; MRR physical unit unverified",
        "warm_state": {rec: model.trackers[rec].snapshot() for rec in params.recipes},
        "last_pressure": {k: r(v, 3) for k, v in last_p.items()},
        "history": {rec: h[-HISTORY_POINTS:] for rec, h in history.items()},
        "wafers": wafers,
    }
    (out_dir / "data").mkdir(parents=True, exist_ok=True)
    (out_dir / "state-model-v2.json").write_text(json.dumps(model_json, indent=2, ensure_ascii=False), encoding="utf-8")
    (out_dir / "data" / "replay.json").write_text(json.dumps(replay, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    fixture.parent.mkdir(parents=True, exist_ok=True)
    fixture.write_text(json.dumps(parity_fixture(params), indent=1), encoding="utf-8")
    missing = sum(1 for x in wafers if x["trace"] is None)
    size = (out_dir / "data" / "replay.json").stat().st_size
    print(json.dumps({"pad_step": pad_step, "params": {k: vars(v) for k, v in params.recipes.items()},
                      "fit_info": info, "recipe_meta": recipe_meta, "session_wafers": len(wafers),
                      "missing_traces": missing, "replay_bytes": size,
                      "session_events": {"rest": int(session.rest_confirmed.sum()), "pad_change": int(session.pad_change.sum())}},
                     indent=1, default=float))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wafer-table", type=Path, required=True)
    ap.add_argument("--traces", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=WEB / "dist" / "lab-sim")
    ap.add_argument("--fixture", type=Path, default=WEB / "tests" / "fixtures" / "lab-sim-parity.json")
    a = ap.parse_args()
    build(a.wafer_table, a.traces, a.out, a.fixture)
