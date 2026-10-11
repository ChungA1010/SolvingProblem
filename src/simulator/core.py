"""Public history-based prediction API, with an explicit injected predictor."""
from dataclasses import dataclass, replace
from datetime import datetime

from .history import HistoryError, MRRMeasurement, build_history_state
from .inference import predict_from_state
from .predictor import BaseMRRPredictor
from .result import PredictionResult, failure
from .scenario_validation import UnsupportedPressureScenarioError, validate_pressure_scenario


@dataclass(frozen=True, slots=True)
class SimulationRequest:
    wafer_id: str
    recipe: str
    pressure_scenario: str
    wafer_start_at: datetime
    history: tuple[MRRMeasurement, ...]
    target_removal: float | None = None
    target_removal_unit: str | None = None


class SimulatorCore:
    def __init__(self, predictor: BaseMRRPredictor):
        if not isinstance(predictor, BaseMRRPredictor):
            raise TypeError("inject an explicit BaseMRRPredictor; the core does not train or load one")
        self._predictor = predictor

    def predict(self, request: SimulationRequest) -> PredictionResult:
        if not isinstance(request, SimulationRequest):
            return failure("INVALID_REQUEST", "a SimulationRequest is required", None, None)
        try:
            validate_pressure_scenario(request.recipe, request.pressure_scenario)
            state = build_history_state(request.recipe, request.wafer_id, request.wafer_start_at, request.history)
        except (UnsupportedPressureScenarioError, HistoryError) as error:
            return failure(error.code, str(error), request.recipe, request.pressure_scenario)
        result = predict_from_state(
            self._predictor, request.recipe, request.pressure_scenario, state.prev_mrr, state.state_ewm,
            target_removal=request.target_removal, target_removal_unit=request.target_removal_unit,
        )
        if result.status == "OK":
            return replace(result, history_used=state.history_used,
                           latest_measurement_completed_at=state.latest_measurement_completed_at.isoformat())
        return result
