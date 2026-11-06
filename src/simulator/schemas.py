"""Data contracts for the pre-polish CMP simulator.

These types describe inputs and outputs only. Availability, recipe, scenario,
unit, and numerical validation belong to later state and policy modules.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


SupportLevel = Literal["OBSERVED_DENSE", "OBSERVED_LIMITED"]
CorrectionStatus = Literal[
    "NONE",
    "OBSERVATIONAL_ONLY",
    "EXPLORATORY",
    "CHRONOLOGICALLY_SUPPORTED",
    "INDEPENDENTLY_VALIDATED",
]
TimeStatus = Literal["UNIT_UNVERIFIED"]


@dataclass(frozen=True)
class HistoryObservation:
    """Past MRR record supplied under the N=0 measurement-complete contract.

    ``wafer_order`` is process order within the recipe, not a measurement
    completion timestamp. The caller must supply only records whose MRR was
    measured before the current prediction. PHM supplies no completion time.
    A later state module will reject records with ``measurement_complete=False``.
    """

    recipe: str
    measured_mrr: float
    wafer_order: int
    measurement_complete: bool


@dataclass(frozen=True)
class SimulationRequest:
    """Pre-polish request; previous MRR and EWMA are derived from history."""

    recipe: str
    pressure_scenario: str
    history: tuple[HistoryObservation, ...]
    target_removal: float | None = None


@dataclass(frozen=True)
class ScenarioPolicy:
    """Metadata for one named observed pressure scenario.

    ``observed_p_main_min`` and ``observed_p_main_max`` describe past sensor
    observations. They are not an allowed numeric pressure input interval,
    pre-polish setpoints, or bounds for interpolation or extrapolation.
    """

    recipe: str
    scenario: str
    observed_p_main_min: float
    observed_p_main_max: float
    observed_count: int
    support_level: SupportLevel
    correction_status: CorrectionStatus
    correction_enabled: bool
    warning: str


@dataclass(frozen=True)
class RecipeState:
    """Derived same-recipe state; its calculation is not implemented here."""

    recipe: str
    prev_mrr: float
    state_ewm: float
    history_count: int


@dataclass(frozen=True)
class SimulationResult:
    """Structured prediction and policy result; no calculation occurs here."""

    recipe: str
    base_mrr: float
    pressure_scenario: str
    support_level: SupportLevel
    correction_status: CorrectionStatus
    correction_enabled: bool
    applied_correction: float
    final_mrr: float
    recommended_polishing_time: float | None
    time_status: TimeStatus
    warnings: tuple[str, ...]
    model_version: str
    policy_version: str
