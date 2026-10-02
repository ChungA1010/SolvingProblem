"""
Audit Di et al. 2017 Table 3 feature construction.

The paper describes a 125-feature input space:
  - 11 previous MRR values
  - 10 usage-neighbor MRR values
  - 2 polishing-time features
  - 36 usage features
  - 36 pressure features
  - 24 flow/status features
  - 6 rotation features

This script builds an explicit manifest and checks whether the current
reproduction code can produce every expected feature.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from src.models import reproduce_di2017 as di


GROUPS = [
    ("g1", "single_chamber_group", "Cond1/2 chamber 4; Cond3 chamber 1"),
    ("g2", "paired_chamber_group", "Cond1/2 chambers 5,6; Cond3 chambers 2,3"),
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def default_cmp1_dir() -> Path:
    return repo_root() / "Dataset" / "CMP1"


def expected_manifest() -> pd.DataFrame:
    rows = []
    feature_id = 1

    for lag in range(1, 12):
        rows.append(
            {
                "feature_id": feature_id,
                "paper_group": "MRR history",
                "paper_definition": f"previous MRR lag {lag}",
                "our_column": f"mrr_lag_{lag}",
                "source_variable": "AVG_REMOVAL_RATE",
                "chamber_group": "condition_sequence",
                "statistic": f"lag_{lag}",
                "generation_stage": "base_feature_table",
            }
        )
        feature_id += 1

    for k in range(1, 11):
        rows.append(
            {
                "feature_id": feature_id,
                "paper_group": "Usage-neighbor MRR",
                "paper_definition": f"MRR of usage-nearest wafer {k}",
                "our_column": f"neighbor_mrr_{k}",
                "source_variable": "AVG_REMOVAL_RATE",
                "chamber_group": "training_fold_usage_space",
                "statistic": f"nearest_neighbor_{k}",
                "generation_stage": "fold_only",
            }
        )
        feature_id += 1

    for prefix, chamber_group, chamber_desc in GROUPS:
        rows.append(
            {
                "feature_id": feature_id,
                "paper_group": "Polishing time",
                "paper_definition": f"processing time for {chamber_desc}",
                "our_column": f"{prefix}_polishing_time",
                "source_variable": "TIMESTAMP",
                "chamber_group": chamber_group,
                "statistic": "duration",
                "generation_stage": "base_feature_table",
            }
        )
        feature_id += 1

    for prefix, chamber_group, _ in GROUPS:
        for col in di.WEAR_COLS:
            for stat in ["mean", "std", "decreasing_rate"]:
                rows.append(
                    {
                        "feature_id": feature_id,
                        "paper_group": "Usage",
                        "paper_definition": f"{col} {stat}",
                        "our_column": f"{prefix}_{col.lower()}_{stat}",
                        "source_variable": col,
                        "chamber_group": chamber_group,
                        "statistic": stat,
                        "generation_stage": "base_feature_table",
                    }
                )
                feature_id += 1

    for prefix, chamber_group, _ in GROUPS:
        for col in di.PRESSURE_COLS:
            for stat in ["mean", "std", "auc"]:
                rows.append(
                    {
                        "feature_id": feature_id,
                        "paper_group": "Pressure",
                        "paper_definition": f"{col} {stat}",
                        "our_column": f"{prefix}_{col.lower()}_{stat}",
                        "source_variable": col,
                        "chamber_group": chamber_group,
                        "statistic": stat,
                        "generation_stage": "base_feature_table",
                    }
                )
                feature_id += 1

    for prefix, chamber_group, _ in GROUPS:
        for col in di.FLOW_COLS:
            for stat in ["mean", "std", "auc"]:
                rows.append(
                    {
                        "feature_id": feature_id,
                        "paper_group": "Flow/status",
                        "paper_definition": f"{col} {stat}",
                        "our_column": f"{prefix}_{col.lower()}_{stat}",
                        "source_variable": col,
                        "chamber_group": chamber_group,
                        "statistic": stat,
                        "generation_stage": "base_feature_table",
                    }
                )
                feature_id += 1

    for prefix, chamber_group, _ in GROUPS:
        for col in di.ROTATION_COLS:
            rows.append(
                {
                    "feature_id": feature_id,
                    "paper_group": "Rotation",
                    "paper_definition": f"{col} mean",
                    "our_column": f"{prefix}_{col.lower()}_mean",
                    "source_variable": col,
                    "chamber_group": chamber_group,
                    "statistic": "mean",
                    "generation_stage": "base_feature_table",
                }
            )
            feature_id += 1

    manifest = pd.DataFrame(rows)
    if len(manifest) != 125:
        raise AssertionError(f"Expected 125 manifest rows, got {len(manifest)}")
    if manifest["feature_id"].iloc[-1] != 125:
        raise AssertionError("Feature IDs do not end at 125")
    return manifest


def audit_features(cmp1_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    base = di.add_causal_lag_features(di._load_trace_groups(cmp1_dir))
    manifest = expected_manifest()

    base_cols = set(base.columns)
    fold_cols = {f"neighbor_mrr_{i}" for i in range(1, 11)}
    manifest["present_in_base_table"] = manifest["our_column"].isin(base_cols)
    manifest["present_after_fold_neighbor_generation"] = manifest["present_in_base_table"] | manifest["our_column"].isin(fold_cols)
    manifest["status"] = manifest.apply(
        lambda r: "OK"
        if r["present_after_fold_neighbor_generation"]
        else "MISSING",
        axis=1,
    )

    summary = (
        manifest.groupby(["paper_group", "generation_stage", "status"])
        .size()
        .rename("n_features")
        .reset_index()
        .sort_values(["paper_group", "generation_stage", "status"])
    )
    return manifest, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit Di 2017 Table 3 feature manifest.")
    parser.add_argument("--cmp1-dir", default=None)
    parser.add_argument("--output-dir", default=None)
    args = parser.parse_args()

    cmp1_dir = Path(args.cmp1_dir) if args.cmp1_dir else default_cmp1_dir()
    out_dir = Path(args.output_dir) if args.output_dir else repo_root() / "results" / "di2017_feature_audit"
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest, summary = audit_features(cmp1_dir)
    manifest.to_csv(out_dir / "di2017_table3_feature_manifest.csv", index=False)
    summary.to_csv(out_dir / "di2017_table3_feature_audit_summary.csv", index=False)

    info = {
        "expected_feature_count": 125,
        "manifest_rows": int(len(manifest)),
        "missing_features": manifest.loc[manifest["status"].eq("MISSING"), "our_column"].tolist(),
        "notes": [
            "neighbor_mrr_1..10 are generated fold-wise to avoid leakage, so they are not present in the base feature table.",
            "DRESSING_WATER_STATUS is treated as the fourth flow/status variable to match the paper's 24 flow/status feature count.",
            "Usage decreasing_rate is currently implemented as (last - first) / polishing_time; sign convention should be verified against the paper if source code becomes available.",
        ],
    }
    (out_dir / "run_info.json").write_text(json.dumps(info, indent=2), encoding="utf-8")

    print(summary.to_string(index=False))
    print(f"\nMissing features: {len(info['missing_features'])}")
    print(f"Saved feature audit to: {out_dir}")


if __name__ == "__main__":
    main()
