"""Internal inference step; public requests obtain state from history (CP08)."""
from .calculation import calculate_mrr
from .correction import CorrectionActivationError, pressure_correction
from .predictor import BaseMRRPredictor, _finite_number
from .result import PredictionResult, failure, policy_warnings
from .scenario_validation import UnsupportedPressureScenarioError, validate_pressure_scenario
from .time_policy import polishing_time_policy


def predict_from_state(predictor, recipe, pressure_scenario, prev_mrr, state_ewm,
                       *, target_removal=None, target_removal_unit=None) -> PredictionResult:
    """Internal boundary, not a request API where users type their own state."""
    try:
        record = validate_pressure_scenario(recipe, pressure_scenario)
        pressure_correction(recipe, pressure_scenario)
    except (UnsupportedPressureScenarioError, CorrectionActivationError) as error:
        return failure(error.code, str(error), recipe, pressure_scenario)
    if not isinstance(predictor, BaseMRRPredictor):
        return failure("INVALID_PREDICTOR", "an explicit BaseMRRPredictor is required", recipe, pressure_scenario)
    try:
        previous = _finite_number("prev_mrr", prev_mrr)
        state = _finite_number("state_ewm", state_ewm)
    except (TypeError, ValueError) as error:
        return failure("INVALID_HISTORY_STATE", str(error), recipe, pressure_scenario)
    try:
        base = predictor.predict(recipe, previous, state)
        version = predictor.model_version
        if not isinstance(version, str) or not version.strip():
            raise ValueError("missing predictor version")
        calculation = calculate_mrr(recipe, pressure_scenario, base)
    except CorrectionActivationError as error:
        return failure(error.code, str(error), recipe, pressure_scenario)
    except Exception:
        return failure("PREDICTOR_ERROR", "predictor failed or returned an invalid finite scalar", recipe, pressure_scenario)
    time = polishing_time_policy(target_removal, target_removal_unit)
    return PredictionResult(
        status="OK", recipe=record.recipe, pressure_scenario=record.pressure_scenario,
        base_mrr=calculation.base_mrr, support_level=record.support_level,
        correction_status=record.correction_status, correction_enabled=False,
        applied_correction=calculation.applied_correction, final_mrr=calculation.final_mrr,
        recommended_polishing_time=time.recommended_polishing_time, time_status=time.time_status,
        warnings=policy_warnings(record) + time.warnings, model_version=version,
    )
