"""Calculate final MRR using the policy gate, never an external delta."""
from dataclasses import dataclass
from numbers import Real

from .correction import pressure_correction
from .predictor import _finite_number


@dataclass(frozen=True, slots=True)
class MRRCalculation:
    base_mrr: float
    applied_correction: float
    final_mrr: float


def calculate_mrr(recipe: object, pressure_scenario: object, base_mrr: Real) -> MRRCalculation:
    correction = pressure_correction(recipe, pressure_scenario)
    base = _finite_number("base_mrr", base_mrr)
    final = _finite_number("final_mrr", base + correction)
    return MRRCalculation(base, correction, final)
