"""Numerical polishing time stays disabled until physical units are verified."""
from dataclasses import dataclass

from .result import SimulatorWarning


@dataclass(frozen=True, slots=True)
class PolishingTimePolicy:
    recommended_polishing_time: None = None
    time_status: str = "UNIT_UNVERIFIED"
    warnings: tuple[SimulatorWarning, ...] = ()


def polishing_time_policy(target_removal=None, target_removal_unit=None) -> PolishingTimePolicy:
    """User-supplied quantities or unit labels cannot verify the MRR unit."""
    if target_removal is not None or target_removal_unit is not None:
        return PolishingTimePolicy(warnings=(SimulatorWarning(
            "TARGET_REMOVAL_NOT_USED",
            "목표 제거량 입력은 현재 MRR 특징이나 연마 시간 계산에 사용하지 않습니다. 물리 MRR 단위 검증이 필요합니다.",
        ),))
    return PolishingTimePolicy()
