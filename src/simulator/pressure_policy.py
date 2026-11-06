"""Named, observed pressure scenarios for the pre-polish simulator.

Observed p_main ranges are descriptive sensor metadata, not pre-polish
setpoints or numeric pressure input bounds. No correction is enabled.
"""

from __future__ import annotations

from .errors import UnsupportedPressureScenarioError, UnsupportedRecipeError
from .schemas import ScenarioPolicy


_SUPPORTED_RECIPES = ("A456", "B456")

_SCENARIO_POLICIES: tuple[ScenarioPolicy, ...] = (
    ScenarioPolicy(
        recipe="A456",
        scenario="Low",
        observed_p_main_min=250.817,
        observed_p_main_max=252.000,
        observed_count=21,
        support_level="OBSERVED_LIMITED",
        correction_status="EXPLORATORY",
        correction_enabled=False,
        warning="저압 동반 MRR 신호는 강하지만 독립 후속 검증이 없어 기본 수치 보정은 비활성입니다.",
    ),
    ScenarioPolicy(
        recipe="A456",
        scenario="Normal",
        observed_p_main_min=268.810,
        observed_p_main_max=270.011,
        observed_count=777,
        support_level="OBSERVED_DENSE",
        correction_status="NONE",
        correction_enabled=False,
        warning="기준 관측 수준이며 사전 pressure setpoint나 인과 효과로 해석하지 않습니다.",
    ),
    ScenarioPolicy(
        recipe="B456",
        scenario="Low",
        observed_p_main_min=248.400,
        observed_p_main_max=252.000,
        observed_count=31,
        support_level="OBSERVED_LIMITED",
        correction_status="OBSERVATIONAL_ONLY",
        correction_enabled=False,
        warning="관측된 수준이지만 수치 pressure 보정을 뒷받침할 근거가 부족합니다.",
    ),
    ScenarioPolicy(
        recipe="B456",
        scenario="Normal",
        observed_p_main_min=256.871,
        observed_p_main_max=258.000,
        observed_count=729,
        support_level="OBSERVED_DENSE",
        correction_status="NONE",
        correction_enabled=False,
        warning="기준 관측 수준이며 사전 pressure setpoint나 인과 효과로 해석하지 않습니다.",
    ),
    ScenarioPolicy(
        recipe="B456",
        scenario="High",
        observed_p_main_min=268.927,
        observed_p_main_max=270.000,
        observed_count=52,
        support_level="OBSERVED_LIMITED",
        correction_status="CHRONOLOGICALLY_SUPPORTED",
        correction_enabled=False,
        warning=(
            "후속 개발 fold에서 개선됐지만 독립 final test와 최종 estimator가 없어 "
            "기본 수치 보정은 비활성입니다."
        ),
    ),
)


def get_scenario_policy(recipe: str, scenario: str) -> ScenarioPolicy:
    """Look up an exact canonical name; never infer it from numeric pressure."""

    if recipe not in _SUPPORTED_RECIPES:
        raise UnsupportedRecipeError(f"Unsupported simulator recipe: {recipe!r}")
    if not isinstance(scenario, str):
        raise UnsupportedPressureScenarioError(
            "Pressure scenario must be a canonical name, not a numeric pressure"
        )
    for policy in _SCENARIO_POLICIES:
        if policy.recipe == recipe and policy.scenario == scenario:
            return policy
    raise UnsupportedPressureScenarioError(
        f"Unsupported pressure scenario {scenario!r} for recipe {recipe!r}"
    )
