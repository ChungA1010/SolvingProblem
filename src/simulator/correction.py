"""Explicit gate for empirical correction; no estimator has been approved."""
from .scenario_validation import validate_pressure_scenario


class CorrectionActivationError(RuntimeError):
    code = "CORRECTION_NOT_APPROVED"


def pressure_correction(recipe: object, pressure_scenario: object) -> float:
    """Return zero for registered disabled scenarios, or fail closed.

    A support/status label cannot authorize a numerical correction. A future
    registry edit enabling a candidate must not silently activate it here.
    No experiment CSV, external delta, or physics fallback is consulted.
    """
    record = validate_pressure_scenario(recipe, pressure_scenario)
    if record.correction_enabled or record.default_applied_correction != 0.0:
        raise CorrectionActivationError("no numerical correction estimator is approved")
    return 0.0
