"""Inference contracts for the Issue #4 simulator core."""

from .predictor import BaseMRRPredictor
from .pressure_scenarios import (
    PRESSURE_POLICY_VERSION,
    PRESSURE_SCENARIOS,
    PressureScenario,
)
from .scenario_validation import (
    UnsupportedPressureScenarioError,
    validate_pressure_scenario,
)
from .core import SimulationRequest, SimulatorCore
from .history import HistoryError, HistoryState, MRRMeasurement, build_history_state
from .result import PredictionResult, SimulatorError, SimulatorWarning
from .ridge_adapter import Issue2RidgeAdapter, RidgeAdapterError, RidgeDependenciesUnavailable

__all__ = [
    "BaseMRRPredictor",
    "PRESSURE_POLICY_VERSION",
    "PRESSURE_SCENARIOS",
    "PressureScenario",
    "UnsupportedPressureScenarioError",
    "validate_pressure_scenario",
    "SimulationRequest", "SimulatorCore", "MRRMeasurement", "HistoryState",
    "HistoryError", "build_history_state", "PredictionResult", "SimulatorError", "SimulatorWarning",
    "Issue2RidgeAdapter", "RidgeAdapterError", "RidgeDependenciesUnavailable",
]
