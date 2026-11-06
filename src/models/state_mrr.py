"""Pre-polish MRR inference from measured history; never trains a model.

Run with --model <model.json> --request <request.json>. MRR stays on the PHM
label scale: physical units and numerical polishing time are unverified.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
from datetime import datetime
import json
import math
from pathlib import Path


RECIPES = ("A456", "B456")
FEATURES = ("recipe", "prev_mrr", "state_ewm")
EWMA_ALPHA = 0.4


def _timestamp(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError("Timestamps must be ISO 8601 strings with a timezone")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.utcoffset() is None:
        raise ValueError("Timestamps must include a timezone")
    return parsed


def _finite(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Expected a finite number")
    try:
        finite = math.isfinite(value)
    except OverflowError as exc:
        raise ValueError("Number exceeds the supported range") from exc
    if not finite:
        raise ValueError("Expected a finite number")
    return float(value)


@dataclass(frozen=True)
class Measurement:
    wafer_id: str
    recipe: str
    wafer_started_at: str
    measurement_completed_at: str
    mrr: float


@dataclass(frozen=True)
class PredictionRequest:
    wafer_id: str
    recipe: str
    wafer_start_at: str
    history: tuple[Measurement, ...]

    @classmethod
    def from_dict(cls, data: dict) -> PredictionRequest:
        if not isinstance(data, dict) or not isinstance(data.get("history"), list):
            raise ValueError("Request must be an object with a history array")
        if not all(isinstance(item, dict) for item in data["history"]):
            raise ValueError("History records must be objects")
        payload = dict(data)
        payload["history"] = tuple(Measurement(**item) for item in payload["history"])
        return cls(**payload)


@dataclass(frozen=True)
class MRRState:
    prev_mrr: float
    state_ewm: float
    history_count: int


def build_state(request: PredictionRequest) -> MRRState:
    """Use complete same-recipe process history, ordered by wafer start.

    N=0 requires every supplied prior same-recipe measurement to be complete
    before this start. Omitted historical records cannot be detected: callers
    must send the complete available sequence, not only a selected recent tail.
    """
    if request.recipe not in RECIPES:
        raise ValueError("Supported recipes: A456, B456; A123 is state-only")
    if not isinstance(request.wafer_id, str) or not request.wafer_id.strip():
        raise ValueError("wafer_id is required")
    start = _timestamp(request.wafer_start_at)
    selected = []
    seen_ids, seen_starts = set(), set()
    for item in request.history:
        if not isinstance(item, Measurement):
            raise ValueError("History records must be Measurement objects")
        if item.recipe != request.recipe:
            continue
        if not isinstance(item.wafer_id, str) or not item.wafer_id.strip():
            raise ValueError("History wafer_id is required")
        if item.wafer_id == request.wafer_id or item.wafer_id in seen_ids:
            raise ValueError("Duplicate or current wafer in history")
        began = _timestamp(item.wafer_started_at)
        completed = _timestamp(item.measurement_completed_at)
        if began >= start or completed < began or completed >= start:
            raise ValueError("N=0 requires a prior wafer measured before the current start")
        if began in seen_starts:
            raise ValueError("Ambiguous same-recipe process order")
        value = _finite(item.mrr)
        if value <= 0:
            raise ValueError("Measured MRR must be positive")
        seen_ids.add(item.wafer_id)
        seen_starts.add(began)
        selected.append((began, value))
    selected.sort(key=lambda pair: pair[0])
    if not selected:
        raise ValueError("At least one completed same-recipe MRR measurement is required")
    state = selected[0][1]
    for _, value in selected[1:]:
        state = EWMA_ALPHA * value + (1 - EWMA_ALPHA) * state
    return MRRState(selected[-1][1], state, len(selected))


class StateMRRPredictor:
    """Portable JSON Ridge inference with standard-library dependencies only."""

    def __init__(self, artifact: dict):
        # Snapshot the caller's data; validate before using any coefficients.
        artifact = json.loads(json.dumps(artifact, allow_nan=False))
        if (artifact.get("schema_version") != 1
                or artifact.get("features") != list(FEATURES)
                or artifact.get("recipes") != list(RECIPES)
                or artifact.get("ridge_alpha") != 1.0
                or artifact.get("ewma_alpha") != EWMA_ALPHA
                or artifact.get("usage") != "EDUCATIONAL_DEVELOPMENT_ONLY"):
            raise ValueError("Unsupported model artifact protocol")
        for name, size in (("coefficients", 4), ("numeric_mean", 2), ("numeric_scale", 2)):
            if len(artifact[name]) != size:
                raise ValueError(f"Invalid artifact {name}")
            for value in artifact[name]:
                _finite(value)
        if any(value <= 0 for value in artifact["numeric_scale"]):
            raise ValueError("Model scales must be positive")
        _finite(artifact["intercept"])
        if not isinstance(artifact.get("model_version"), str):
            raise ValueError("Model version is required")
        if "training_support" in artifact:
            support = artifact["training_support"]
            if not isinstance(support, dict) or set(support) != set(RECIPES):
                raise ValueError("Invalid training support recipes")
            for recipe in RECIPES:
                for feature in FEATURES[1:]:
                    limits = support[recipe][feature]
                    if len(limits) != 2 or _finite(limits[0]) > _finite(limits[1]):
                        raise ValueError("Invalid training support limits")
        self._artifact = artifact

    @classmethod
    def load(cls, path: Path | str) -> StateMRRPredictor:
        return cls(json.loads(Path(path).read_text(encoding="utf-8")))

    def predict_state(self, recipe: str, prev_mrr: float, state_ewm: float) -> float:
        """Low-level adapter/export verification; normal callers use predict()."""
        if recipe not in RECIPES:
            raise ValueError("Unsupported recipe")
        values = [_finite(prev_mrr), _finite(state_ewm)]
        if any(value <= 0 for value in values):
            raise ValueError("MRR state must be positive")
        a = self._artifact
        encoded = [float(recipe == category) for category in RECIPES]
        encoded.extend((value - mean) / scale for value, mean, scale in
                       zip(values, a["numeric_mean"], a["numeric_scale"], strict=True))
        predicted = a["intercept"] + sum(c * x for c, x in
                                             zip(a["coefficients"], encoded, strict=True))
        if not math.isfinite(predicted) or predicted <= 0:
            raise ValueError("Nonpositive or nonfinite MRR prediction; cannot use this state")
        return predicted

    def predict(self, request: PredictionRequest) -> dict:
        state = build_state(request)
        predicted = self.predict_state(request.recipe, state.prev_mrr, state.state_ewm)
        warnings = ["N=0 measurement-complete history is required.",
                    "Development benchmark only; no independent final validation.",
                    "Complete same-recipe history is required to reproduce EWMA."]
        outside = []
        support = self._artifact.get("training_support", {}).get(request.recipe)
        if support is not None:
            for feature in FEATURES[1:]:
                low, high = support[feature]
                if not low <= getattr(state, feature) <= high:
                    outside.append(feature)
            if outside:
                warnings.append("State outside marginal training ranges: " + ", ".join(outside))
        else:
            warnings.append("Training range metadata unavailable; data support is unknown.")
        return {
            "wafer_id": request.wafer_id, "recipe": request.recipe,
            "base_mrr": predicted, "final_mrr": predicted, **asdict(state),
            "applied_correction": 0.0, "correction_enabled": False,
            "raw_label_scale": "VERIFIED_FACTOR_1", "mrr_unit": "UNIT_UNVERIFIED",
            "recommended_polishing_time": None, "time_status": "UNIT_UNVERIFIED",
            "model_version": self._artifact["model_version"],
            "state_support": ("OUTSIDE_TRAINING_RANGE" if outside else
                              "WITHIN_MARGINAL_TRAINING_RANGES" if support else "UNKNOWN"),
            "outside_training_features": outside,
            "warnings": warnings,
        }

    @property
    def model_version(self) -> str:
        return self._artifact["model_version"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--request", type=Path, required=True)
    args = parser.parse_args()
    request = PredictionRequest.from_dict(json.loads(args.request.read_text(encoding="utf-8")))
    result = StateMRRPredictor.load(args.model).predict(request)
    print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
