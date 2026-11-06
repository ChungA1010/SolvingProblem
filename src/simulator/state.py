"""Derive pre-polish MRR state from completed same-recipe history."""

from __future__ import annotations

import math
from numbers import Integral, Real
from typing import Sequence

from .errors import InsufficientHistoryError, InvalidHistoryError
from .schemas import HistoryObservation, RecipeState


EWMA_ALPHA = 0.4


def validate_completed_history(
    recipe: str,
    history: Sequence[HistoryObservation],
) -> tuple[HistoryObservation, ...]:
    """Return valid same-recipe observations in ascending wafer order.

    The caller is responsible for supplying only history available before the
    current prediction. PHM does not provide measurement-completion timestamps,
    so this function cannot independently verify that temporal assertion.
    Unfinished observations of other recipes do not affect this recipe.
    """

    selected: list[HistoryObservation] = []
    seen_orders: set[int] = set()

    for observation in history:
        if not isinstance(observation, HistoryObservation):
            raise InvalidHistoryError("History items must be HistoryObservation instances")
        if observation.recipe != recipe:
            continue
        if observation.measurement_complete is not True:
            raise InvalidHistoryError("Same-recipe history includes an incomplete MRR measurement")
        if (isinstance(observation.wafer_order, bool)
                or not isinstance(observation.wafer_order, Integral)
                or observation.wafer_order < 0):
            raise InvalidHistoryError("wafer_order must be a nonnegative integer")
        if (isinstance(observation.measured_mrr, bool)
                or not isinstance(observation.measured_mrr, Real)
                or not math.isfinite(observation.measured_mrr)):
            raise InvalidHistoryError("measured_mrr must be a finite real number")
        if observation.wafer_order in seen_orders:
            raise InvalidHistoryError("Same-recipe history contains a duplicate wafer_order")
        seen_orders.add(observation.wafer_order)
        selected.append(observation)

    return tuple(sorted(selected, key=lambda observation: observation.wafer_order))


def build_recipe_state(
    recipe: str,
    history: Sequence[HistoryObservation],
) -> RecipeState:
    """Calculate previous MRR and adjust=False EWMA from past observations."""

    completed = validate_completed_history(recipe, history)
    if not completed:
        raise InsufficientHistoryError(f"No completed MRR history for recipe {recipe!r}")

    state_ewm = float(completed[0].measured_mrr)
    for observation in completed[1:]:
        state_ewm = (EWMA_ALPHA * float(observation.measured_mrr)
                     + (1.0 - EWMA_ALPHA) * state_ewm)

    return RecipeState(
        recipe=recipe,
        prev_mrr=float(completed[-1].measured_mrr),
        state_ewm=state_ewm,
        history_count=len(completed),
    )
