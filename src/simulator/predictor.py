"""A pure-Python boundary for an externally supplied, already fitted predictor.

History construction and model loading belong to separate checkpoints. This
module does not import training code, read model files, or fit an estimator.
"""
from abc import ABC, abstractmethod
import math
from numbers import Real


def _finite_number(name: str, value: Real) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise TypeError(f"{name} must be a real number, not a boolean or string")
    try:
        number = float(value)
    except (OverflowError, ValueError) as error:
        raise ValueError(f"{name} must be finite") from error
    if not math.isfinite(number):
        raise ValueError(f"{name} must be finite")
    return number


class BaseMRRPredictor(ABC):
    """Common inference interface for the A456/B456 Ridge path.

    The caller passes state built from same-recipe measurements completed before
    the current wafer starts. This interface validates numerical values; it
    cannot establish measurement availability without history/timestamp data.

    Implementations supply a version and `_predict`. A later adapter will own
    the fitted Issue #2 preprocessing/estimator and implement that hook.
    """

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Explicit identifier for the predictor supplied by the caller."""
        raise NotImplementedError

    def predict(self, recipe: str, prev_mrr: Real, state_ewm: Real) -> float:
        """Return a finite base MRR on the unchanged PHM target scale.

        This is an internal model boundary. Users will provide history rather
        than typing these state values in the future simulator request API.
        Scenario validation and physical interpretation are separate policies.
        """
        if not isinstance(recipe, str):
            raise TypeError("recipe must be a string")
        if recipe not in ("A456", "B456"):
            raise ValueError("the Ridge predictor path supports A456 and B456 only")
        if not isinstance(self.model_version, str) or not self.model_version.strip():
            raise ValueError("model_version must be an explicit nonempty string")
        previous = _finite_number("prev_mrr", prev_mrr)
        state = _finite_number("state_ewm", state_ewm)
        result = self._predict(recipe, previous, state)
        return _finite_number("base_mrr", result)

    @abstractmethod
    def _predict(self, recipe: str, prev_mrr: float, state_ewm: float) -> Real:
        """Use the supplied predictor to infer base MRR; implementations must not fit."""
        raise NotImplementedError
