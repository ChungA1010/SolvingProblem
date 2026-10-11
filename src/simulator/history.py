"""Timestamp-based measurement ledger with same-recipe EWMA(alpha=0.4)."""
from dataclasses import dataclass
from datetime import datetime, timezone

from .predictor import _finite_number


class HistoryError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True, slots=True)
class MRRMeasurement:
    # Use an execution-unique ID (including stage when source wafer IDs repeat).
    wafer_id: str
    recipe: str
    wafer_started_at: datetime
    measurement_completed_at: datetime
    mrr: float


@dataclass(frozen=True, slots=True)
class HistoryState:
    prev_mrr: float
    state_ewm: float
    history_used: int
    latest_measurement_completed_at: datetime


def _timestamp(value, field: str) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise HistoryError("INVALID_TIMESTAMP", field + " must be a timezone-aware datetime")
    return value.astimezone(timezone.utc)


def build_history_state(recipe, wafer_id, wafer_start_at, history) -> HistoryState:
    if not isinstance(recipe, str) or recipe not in ("A456", "B456"):
        raise HistoryError("UNSUPPORTED_RECIPE", "the Ridge history path supports A456 and B456 only")
    if not isinstance(wafer_id, str) or not wafer_id.strip():
        raise HistoryError("INVALID_WAFER_ID", "a nonempty execution-unique wafer_id is required")
    current_start = _timestamp(wafer_start_at, "wafer_start_at")
    if not isinstance(history, (tuple, list)):
        raise HistoryError("INVALID_HISTORY", "history must be a list or tuple of MRRMeasurement records")
    eligible = []
    seen_ids = set()
    for row in history:
        if not isinstance(row, MRRMeasurement) or not isinstance(row.recipe, str) or not row.recipe:
            raise HistoryError("INVALID_HISTORY", "history contains an invalid measurement record")
        if row.recipe != recipe:
            continue
        if not isinstance(row.wafer_id, str) or not row.wafer_id.strip():
            raise HistoryError("INVALID_WAFER_ID", "measurement wafer_id must be a nonempty string")
        if row.wafer_id == wafer_id:
            continue  # Never consume the current wafer label, even with bad availability metadata.
        started = _timestamp(row.wafer_started_at, "wafer_started_at")
        completed = _timestamp(row.measurement_completed_at, "measurement_completed_at")
        if completed < started:
            raise HistoryError("INVALID_MEASUREMENT_TIMESTAMP", "measurement completion precedes wafer start")
        if started >= current_start or completed >= current_start:
            continue  # Labels not available strictly before this request cannot affect state.
        try:
            mrr = _finite_number("measured_mrr", row.mrr)
        except (TypeError, ValueError) as error:
            raise HistoryError("INVALID_HISTORY_VALUE", str(error)) from error
        if row.wafer_id in seen_ids:
            raise HistoryError("DUPLICATE_HISTORY", "duplicate same-recipe measurement ID")
        seen_ids.add(row.wafer_id)
        eligible.append((completed, started, mrr))
    if not eligible:
        raise HistoryError("INSUFFICIENT_HISTORY", "no same-recipe measurement completed before the current wafer")
    eligible.sort(key=lambda row: (row[0], row[1]))
    if any(left[:2] == right[:2] for left, right in zip(eligible, eligible[1:])):
        raise HistoryError("AMBIGUOUS_HISTORY_ORDER", "measurement completion and wafer start times do not establish an order")
    state = eligible[0][2]
    for _, _, mrr in eligible[1:]:
        state = 0.4 * mrr + 0.6 * state
    return HistoryState(
        prev_mrr=eligible[-1][2], state_ewm=state,
        history_used=len(eligible), latest_measurement_completed_at=eligible[-1][0],
    )
