from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

SEED = 20260903
SPLITS = {"train": 0.60, "validation": 0.15, "calibration": 0.10, "test": 0.15}
KEYS = ["WAFER_ID", "STAGE"]
TARGET = "AVG_REMOVAL_RATE"
META = ["MACHINE_ID", "MACHINE_DATA", "TIMESTAMP", "WAFER_ID", "STAGE", "CHAMBER"]
PRESSURE = ["MAIN_OUTER_AIR_BAG_PRESSURE", "CENTER_AIR_BAG_PRESSURE", "RETAINER_RING_PRESSURE", "RIPPLE_AIR_BAG_PRESSURE", "EDGE_AIR_BAG_PRESSURE"]
ROTATION = ["WAFER_ROTATION", "STAGE_ROTATION", "HEAD_ROTATION"]
SLURRY = ["SLURRY_FLOW_LINE_A", "SLURRY_FLOW_LINE_B", "SLURRY_FLOW_LINE_C"]
USAGE = ["USAGE_OF_BACKING_FILM", "USAGE_OF_DRESSER", "USAGE_OF_POLISHING_TABLE", "USAGE_OF_DRESSER_TABLE", "USAGE_OF_MEMBRANE", "USAGE_OF_PRESSURIZED_SHEET"]
STATUS = "DRESSING_WATER_STATUS"
CHANNELS = USAGE + ["PRESSURIZED_CHAMBER_PRESSURE"] + PRESSURE + SLURRY + ROTATION
RAW_COLUMNS = set(META + CHANNELS + [STATUS])
MAX_GAP = 60.0  # source timestamp units; prevents integration over unobserved gaps


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda: f.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def sample_id(wafer: int, stage: str) -> str:
    return hashlib.sha256(f"{int(wafer)}|{stage}".encode()).hexdigest()[:20]
