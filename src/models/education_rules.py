"""Explicit classroom rules, separate from the PHM MRR predictor.

The dimensionless score has no calibrated relationship to MRR or thickness.
No default pressure/slurry weights are supplied or inferred from PHM data.
"""

from __future__ import annotations

import json
from pathlib import Path

from .state_mrr import _finite


LEVELS = ("Low", "Normal", "High")


class EducationRules:
    def __init__(self, config: dict):
        required = {"ruleset_version", "source_status", "reference_index",
                    "pressure_effect", "slurry_effect"}
        if not isinstance(config, dict) or set(config) != required:
            raise ValueError("Invalid classroom ruleset fields")
        if config["source_status"] != "CLASSROOM_ASSUMPTION_NOT_PHM_CALIBRATED":
            raise ValueError("Classroom rules must declare that they are not PHM calibrated")
        if not isinstance(config["ruleset_version"], str) or not config["ruleset_version"].strip():
            raise ValueError("ruleset_version is required")
        _finite(config["reference_index"])
        for name in ("pressure_effect", "slurry_effect"):
            terms = config[name]
            if not isinstance(terms, dict) or set(terms) != set(LEVELS):
                raise ValueError("Classroom effects require Low, Normal, High levels")
            for value in terms.values():
                _finite(value)
            if terms["Normal"] != 0:
                raise ValueError("Normal classroom level must have zero reference effect")
        self._config = json.loads(json.dumps(config, allow_nan=False))

    @classmethod
    def load(cls, path: Path | str) -> EducationRules:
        return cls(json.loads(Path(path).read_text(encoding="utf-8")))

    def evaluate(self, payload: dict) -> dict:
        if not isinstance(payload, dict) or set(payload) != {"pressure_level", "slurry_level"}:
            raise ValueError("Only pressure_level and slurry_level are accepted")
        if any(value not in LEVELS for value in payload.values()):
            raise ValueError("Use named classroom levels: Low, Normal, High")
        pressure = self._config["pressure_effect"][payload["pressure_level"]]
        slurry = self._config["slurry_effect"][payload["slurry_level"]]
        score = _finite(self._config["reference_index"] + pressure + slurry)
        return {
            "status": "OK", "mode": "education", "result_kind": "EDUCATIONAL_RULE_SCORE",
            "educational_index": score, "unit": "dimensionless_classroom_index",
            "pressure_contribution": pressure, "slurry_contribution": slurry,
            "ruleset_version": self._config["ruleset_version"],
            "source_status": self._config["source_status"],
            "warnings": ["Teacher-defined rules, not PHM-calibrated MRR predictions.",
                         "Named levels do not map to physical setpoints or observed pressure clusters.",
                         "No real removal amount or polishing time can be inferred from this index."],
        }
