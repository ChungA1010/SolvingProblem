"""
Persistent-model chronology diagnostics for Di et al. 2017 reproduction.

This script intentionally does not train SVR/tree/linear models. It only tests
plausible definitions of r(t-1) and reports whether any publicly reconstructible
sequence approaches the paper's persistent-model MSE.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error


TARGET = "AVG_REMOVAL_RATE"

WEAR_COLS = [
    "USAGE_OF_BACKING_FILM",
    "USAGE_OF_DRESSER",
    "USAGE_OF_POLISHING_TABLE",
    "USAGE_OF_DRESSER_TABLE",
    "USAGE_OF_MEMBRANE",
    "USAGE_OF_PRESSURIZED_SHEET",
]

PAPER_PERSISTENT_MSE = {"Cond1": 7.55, "Cond2": 11.40, "Cond3": 5.62}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def default_cmp1_dir() -> Path:
    return repo_root() / "Dataset" / "CMP1"


def condition_from_stage_chambers(stage: str, chambers: str) -> str | None:
    if stage == "A" and chambers == "4,5,6":
        return "Cond1"
    if stage == "B" and chambers == "4,5,6":
        return "Cond2"
    if stage == "A" and chambers == "1,2,3":
        return "Cond3"
    return None


def load_samples(cmp1_dir: Path) -> pd.DataFrame:
    labels = pd.read_csv(cmp1_dir / "CMP-training-removalrate.csv")
    labels = labels.reset_index().rename(columns={"index": "label_order"})
    labels = labels[labels[TARGET] <= 500].copy()

    rows = []
    global_offset = 0
    for file_id, path in enumerate(sorted((cmp1_dir / "CMP-data" / "training").glob("CMP-training-*.csv"))):
        df = pd.read_csv(path)
        df["global_raw_index"] = np.arange(global_offset, global_offset + len(df))
        global_offset += len(df)

        for (wafer_id, stage), group in df.groupby(["WAFER_ID", "STAGE"], sort=False):
            group = group.sort_values("TIMESTAMP")
            chambers = ",".join(map(str, sorted(int(x) for x in group["CHAMBER"].dropna().unique())))
            rec = {
                "WAFER_ID": int(wafer_id),
                "STAGE": stage,
                "file_id": int(file_id),
                "raw_first_global_index": int(group["global_raw_index"].min()),
                "raw_first_pos_in_file": int(group["global_raw_index"].min() - df["global_raw_index"].min()),
                "first_timestamp": float(group["TIMESTAMP"].min()),
                "last_timestamp": float(group["TIMESTAMP"].max()),
                "duration_sec": float(group["TIMESTAMP"].max() - group["TIMESTAMP"].min()),
                "MACHINE_ID": int(group["MACHINE_ID"].mode().iloc[0]),
                "MACHINE_DATA_first": int(group.sort_values("TIMESTAMP")["MACHINE_DATA"].iloc[0]),
                "MACHINE_DATA_last": int(group.sort_values("TIMESTAMP")["MACHINE_DATA"].iloc[-1]),
                "chambers": chambers,
            }
            for col in WEAR_COLS:
                values = pd.to_numeric(group[col], errors="coerce")
                rec[f"{col}_first"] = float(values.iloc[0])
                rec[f"{col}_last"] = float(values.iloc[-1])
                rec[f"{col}_mean"] = float(values.mean())
            rows.append(rec)

    per_file = pd.DataFrame(rows)

    def merge_chambers(values: Iterable[str]) -> str:
        pieces = set(",".join(values).split(","))
        return ",".join(sorted(pieces, key=int))

    agg_spec = {
        "file_id_min": ("file_id", "min"),
        "file_id_max": ("file_id", "max"),
        "raw_first_global_index": ("raw_first_global_index", "min"),
        "raw_first_pos_in_file": ("raw_first_pos_in_file", "min"),
        "first_timestamp": ("first_timestamp", "min"),
        "last_timestamp": ("last_timestamp", "max"),
        "duration_sec": ("duration_sec", "sum"),
        "MACHINE_ID": ("MACHINE_ID", "first"),
        "MACHINE_DATA_first": ("MACHINE_DATA_first", "first"),
        "MACHINE_DATA_last": ("MACHINE_DATA_last", "last"),
        "chambers": ("chambers", merge_chambers),
    }
    for col in WEAR_COLS:
        agg_spec[f"{col}_first"] = (f"{col}_first", "first")
        agg_spec[f"{col}_last"] = (f"{col}_last", "last")
        agg_spec[f"{col}_mean"] = (f"{col}_mean", "mean")

    samples = per_file.groupby(["WAFER_ID", "STAGE"], sort=False).agg(**agg_spec).reset_index()
    samples = samples.merge(labels, on=["WAFER_ID", "STAGE"], how="inner", validate="one_to_one")
    samples["condition"] = samples.apply(lambda r: condition_from_stage_chambers(r["STAGE"], r["chambers"]), axis=1)
    samples = samples.dropna(subset=["condition"]).copy()
    samples["abs_WAFER_ID"] = samples["WAFER_ID"].abs()
    for div in [10, 100, 1000, 10000, 100000, 1000000]:
        samples[f"wafer_prefix_{div}"] = np.floor_divide(samples["WAFER_ID"], div)
        samples[f"abs_wafer_prefix_{div}"] = np.floor_divide(samples["abs_WAFER_ID"], div)
    return samples


def eval_sequence(
    df: pd.DataFrame,
    name: str,
    order_cols: list[str],
    group_cols: list[str] | None = None,
    reset_on_usage_drop: bool = False,
    reset_gap_sec: float | None = None,
) -> tuple[list[dict], pd.DataFrame]:
    rows = []
    pair_frames = []
    group_cols = group_cols or ["condition"]

    for condition, cond_df in df.groupby("condition"):
        sq_errors = []
        n_pairs = 0
        previews = []

        for _, group in cond_df.groupby(group_cols, dropna=False):
            ordered = group.sort_values(order_cols).copy()
            if ordered.empty:
                continue

            reset = pd.Series(False, index=ordered.index)
            if reset_gap_sec is not None:
                reset |= ordered["first_timestamp"].diff().fillna(0) > reset_gap_sec
            if reset_on_usage_drop:
                for col in WEAR_COLS:
                    reset |= ordered[f"{col}_first"].diff().fillna(0) < -1e-6
            segment = reset.cumsum()

            for _, seg in ordered.groupby(segment):
                seg = seg.copy()
                seg["prev_WAFER_ID"] = seg["WAFER_ID"].shift(1)
                seg["prev_mrr"] = seg[TARGET].shift(1)
                valid = seg["prev_mrr"].notna()
                if valid.any():
                    sq_errors.extend((seg.loc[valid, TARGET] - seg.loc[valid, "prev_mrr"]).pow(2).tolist())
                    n_pairs += int(valid.sum())
                previews.append(seg)

        rows.append(
            {
                "candidate": name,
                "condition": condition,
                "n_pairs": n_pairs,
                "persistent_mse": float(np.mean(sq_errors)) if sq_errors else np.nan,
                "paper_mse": PAPER_PERSISTENT_MSE[condition],
                "abs_delta": abs(float(np.mean(sq_errors)) - PAPER_PERSISTENT_MSE[condition]) if sq_errors else np.nan,
            }
        )
        if previews:
            preview = pd.concat(previews).sort_values(order_cols).head(30)
            preview = preview[
                [
                    "condition",
                    "WAFER_ID",
                    "prev_WAFER_ID",
                    "file_id_min",
                    "label_order",
                    "first_timestamp",
                    TARGET,
                    "prev_mrr",
                ]
            ].copy()
            preview["candidate"] = name
            pair_frames.append(preview)

    return rows, pd.concat(pair_frames, ignore_index=True) if pair_frames else pd.DataFrame()


def candidate_specs(df: pd.DataFrame) -> list[dict]:
    specs = [
        {"name": "condition_global_timestamp", "order_cols": ["first_timestamp"]},
        {"name": "condition_label_order", "order_cols": ["label_order"]},
        {"name": "condition_file_raw_order", "order_cols": ["file_id_min", "raw_first_global_index"]},
        {"name": "condition_file_timestamp", "order_cols": ["file_id_min", "first_timestamp"]},
        {"name": "condition_usage_backing_first", "order_cols": ["USAGE_OF_BACKING_FILM_first", "first_timestamp"]},
        {"name": "condition_usage_backing_mean", "order_cols": ["USAGE_OF_BACKING_FILM_mean", "first_timestamp"]},
        {"name": "condition_usage_dresser_first", "order_cols": ["USAGE_OF_DRESSER_first", "first_timestamp"]},
        {"name": "condition_wafer_id_numeric", "order_cols": ["WAFER_ID"]},
        {"name": "condition_abs_wafer_id", "order_cols": ["abs_WAFER_ID"]},
        {"name": "reset_at_lot_file", "order_cols": ["first_timestamp"], "group_cols": ["condition", "file_id_min"]},
        {
            "name": "reset_at_lot_file_usage_drop",
            "order_cols": ["first_timestamp"],
            "group_cols": ["condition", "file_id_min"],
            "reset_on_usage_drop": True,
        },
        {
            "name": "global_timestamp_reset_usage_drop",
            "order_cols": ["first_timestamp"],
            "reset_on_usage_drop": True,
        },
    ]

    for gap in [300, 600, 1200, 1800, 3600, 7200, 14400, 28800, 86400]:
        specs.append(
            {
                "name": f"global_timestamp_reset_gap_{gap}s",
                "order_cols": ["first_timestamp"],
                "reset_gap_sec": float(gap),
            }
        )
        specs.append(
            {
                "name": f"global_timestamp_reset_gap_{gap}s_usage_drop",
                "order_cols": ["first_timestamp"],
                "reset_gap_sec": float(gap),
                "reset_on_usage_drop": True,
            }
        )

    for div in [10, 100, 1000, 10000, 100000, 1000000]:
        specs.append(
            {
                "name": f"group_wafer_prefix_{div}",
                "order_cols": ["first_timestamp"],
                "group_cols": ["condition", f"wafer_prefix_{div}"],
            }
        )
        specs.append(
            {
                "name": f"group_abs_wafer_prefix_{div}",
                "order_cols": ["first_timestamp"],
                "group_cols": ["condition", f"abs_wafer_prefix_{div}"],
            }
        )

    return specs


def main() -> None:
    parser = argparse.ArgumentParser(description="Diagnose Di 2017 r(t-1) chronology candidates.")
    parser.add_argument("--cmp1-dir", default=None)
    parser.add_argument("--output-dir", default=None)
    args = parser.parse_args()

    cmp1_dir = Path(args.cmp1_dir) if args.cmp1_dir else default_cmp1_dir()
    out_dir = Path(args.output_dir) if args.output_dir else repo_root() / "results" / "di2017_chronology_candidates"
    out_dir.mkdir(parents=True, exist_ok=True)

    samples = load_samples(cmp1_dir)
    samples.to_csv(out_dir / "chronology_sample_table.csv", index=False)

    all_rows = []
    preview_frames = []
    for spec in candidate_specs(samples):
        rows, preview = eval_sequence(samples, **spec)
        all_rows.extend(rows)
        if not preview.empty and spec["name"] in {
            "condition_global_timestamp",
            "reset_at_lot_file",
            "global_timestamp_reset_usage_drop",
        }:
            preview_frames.append(preview)

    results = pd.DataFrame(all_rows)
    pivot = results.pivot_table(index="candidate", columns="condition", values="persistent_mse", aggfunc="first")
    for cond, paper in PAPER_PERSISTENT_MSE.items():
        pivot[f"{cond}_paper"] = paper
        pivot[f"{cond}_abs_delta"] = (pivot[cond] - paper).abs()
    pivot["mean_abs_delta"] = pivot[[f"{c}_abs_delta" for c in PAPER_PERSISTENT_MSE]].mean(axis=1)
    pivot["min_pairs"] = results.groupby("candidate")["n_pairs"].min()
    pivot = pivot.sort_values(["mean_abs_delta", "min_pairs"], ascending=[True, False]).reset_index()

    results.to_csv(out_dir / "persistent_chronology_candidates_long.csv", index=False)
    pivot.to_csv(out_dir / "persistent_chronology_candidates_summary.csv", index=False)
    if preview_frames:
        pd.concat(preview_frames, ignore_index=True).to_csv(out_dir / "candidate_first30_previews.csv", index=False)

    (out_dir / "run_info.json").write_text(
        json.dumps(
            {
                "purpose": "Test plausible public-data reconstructions of Di 2017 r(t-1).",
                "paper_persistent_mse": PAPER_PERSISTENT_MSE,
                "n_samples": int(len(samples)),
                "condition_counts": samples["condition"].value_counts().to_dict(),
                "warning": "Candidates with very low pair counts can look artificially good and should not be treated as valid chronology matches.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(pivot.head(30).to_string(index=False))
    print(f"\nSaved chronology diagnostics to: {out_dir}")


if __name__ == "__main__":
    main()
