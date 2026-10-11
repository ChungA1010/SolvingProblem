"""Fixed observational metadata from Issue #3, not pressure control inputs.

Ranges describe the existing p_main sensor scale. They are not accepted numeric
intervals, setpoints, or a pressure-to-scenario conversion. Request validation,
the correction gate, and final MRR calculation belong to later checkpoints.
"""
from dataclasses import dataclass
from types import MappingProxyType
from typing import Literal, Mapping


PRESSURE_POLICY_VERSION = "issue3-pressure-scenarios-v1"
_PROVENANCE = (
    "docs/pressure_hybrid_policy.md"
    "@b3476dc9edcc25619cfa5c357d2e5ecf79258bd7"
)
_COMMON_WARNINGS = (
    "pressure scenario는 연마 중 센서 관측 조건이며 투입 전 장비 setpoint가 아닙니다.",
    "경험적 수치 보정은 현재 비활성이며 압력 효과가 0으로 입증된 뜻이 아닙니다.",
    "현재 근거는 development 자료이며 독립 final test가 없습니다.",
)


@dataclass(frozen=True, slots=True)
class PressureScenario:
    """Read-only policy metadata; this record neither predicts nor applies delta."""

    recipe: str
    pressure_scenario: str
    observed_p_main_range: tuple[float, float]
    observed_wafer_count: int
    support_level: Literal["OBSERVED_LIMITED", "OBSERVED_DENSE"]
    correction_status: Literal[
        "NONE", "EXPLORATORY", "OBSERVATIONAL_ONLY", "CHRONOLOGICALLY_SUPPORTED"
    ]
    warning_metadata: tuple[str, ...]
    correction_enabled: bool = False
    default_applied_correction: float = 0.0
    mrr_unit_status: str = "UNIT_UNVERIFIED"
    policy_version: str = PRESSURE_POLICY_VERSION
    provenance: str = _PROVENANCE


# Exact named combinations only. No numeric lookup, fallback, or result loading.
# The wrapper and each record are immutable to prevent accidental policy changes.
PRESSURE_SCENARIOS: Mapping[tuple[str, str], PressureScenario] = MappingProxyType({
    ("A456", "Low"): PressureScenario(
        recipe="A456",
        pressure_scenario="Low",
        observed_p_main_range=(250.817, 252.000),
        observed_wafer_count=21,
        support_level="OBSERVED_LIMITED",
        correction_status="EXPLORATORY",
        warning_metadata=_COMMON_WARNINGS + (
            "관측 21장이 모두 fold 5에 있어 독립된 후속 시기 검증이 없습니다.",
        ),
    ),
    ("A456", "Normal"): PressureScenario(
        recipe="A456",
        pressure_scenario="Normal",
        observed_p_main_range=(268.810, 270.011),
        observed_wafer_count=777,
        support_level="OBSERVED_DENSE",
        correction_status="NONE",
        warning_metadata=_COMMON_WARNINGS + (
            "기준 관측 수준이며 압력의 인과 효과를 의미하지 않습니다.",
        ),
    ),
    ("B456", "Low"): PressureScenario(
        recipe="B456",
        pressure_scenario="Low",
        observed_p_main_range=(248.400, 252.000),
        observed_wafer_count=31,
        support_level="OBSERVED_LIMITED",
        correction_status="OBSERVATIONAL_ONLY",
        warning_metadata=_COMMON_WARNINGS + (
            "248.400 관측은 1장이며 안정적인 수치 보정 근거가 부족합니다.",
        ),
    ),
    ("B456", "Normal"): PressureScenario(
        recipe="B456",
        pressure_scenario="Normal",
        observed_p_main_range=(256.871, 258.000),
        observed_wafer_count=729,
        support_level="OBSERVED_DENSE",
        correction_status="NONE",
        warning_metadata=_COMMON_WARNINGS + (
            "기준 관측 수준이며 압력의 인과 효과를 의미하지 않습니다.",
        ),
    ),
    ("B456", "High"): PressureScenario(
        recipe="B456",
        pressure_scenario="High",
        observed_p_main_range=(268.927, 270.000),
        observed_wafer_count=52,
        support_level="OBSERVED_LIMITED",
        correction_status="CHRONOLOGICALLY_SUPPORTED",
        warning_metadata=_COMMON_WARNINGS + (
            "fold 2~5 평가 표본은 42장이며 최종 보정 estimator는 미선정입니다.",
            "p_main=347.893 이상치 1장은 High 군집과 보정 calibration에서 제외합니다.",
        ),
    ),
})
