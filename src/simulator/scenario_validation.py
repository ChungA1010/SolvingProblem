"""Validate exact named recipe/scenario pairs against the Issue #3 registry."""
from .pressure_scenarios import PRESSURE_SCENARIOS, PressureScenario


class UnsupportedPressureScenarioError(ValueError):
    """Stable validation error; prediction result serialization comes in CP06."""

    code = "UNSUPPORTED_PRESSURE_SCENARIO"


def validate_pressure_scenario(
    recipe: object, pressure_scenario: object
) -> PressureScenario:
    """Return the registered metadata for an exact supported pair.

    Inputs are checked before lookup so malformed, unhashable payload values
    also receive the policy error. Do not coerce numbers, strip whitespace,
    change case, map numeric sensor ranges, or choose a fallback scenario.
    This function performs no prediction, correction, file read, or training.
    """
    if not isinstance(recipe, str):
        raise UnsupportedPressureScenarioError(
            "recipe must be an exact registered name: A456 or B456"
        )
    if not isinstance(pressure_scenario, str):
        raise UnsupportedPressureScenarioError(
            "pressure_scenario must be an exact registered name; numeric pressure is unsupported"
        )
    try:
        return PRESSURE_SCENARIOS[(recipe, pressure_scenario)]
    except KeyError:
        raise UnsupportedPressureScenarioError(
            "unsupported recipe/pressure_scenario pair; use A456 Low/Normal or B456 Low/Normal/High"
        ) from None
