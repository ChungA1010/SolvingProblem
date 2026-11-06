"""Errors reserved for simulator input and policy validation."""


class SimulatorError(Exception):
    """Base class for simulator-specific failures."""


class UnsupportedRecipeError(SimulatorError):
    """The requested recipe is outside the simulator's supported scope."""


class UnsupportedPressureScenarioError(SimulatorError):
    """The recipe/scenario combination is not supported."""


class InsufficientHistoryError(SimulatorError):
    """No sufficient completed same-recipe MRR history is available."""


class InvalidHistoryError(SimulatorError):
    """History violates ordering, completion, or value requirements."""
