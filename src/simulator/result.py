"""JSON-compatible structured results and warnings for the simulator core."""
from dataclasses import asdict, dataclass

from .pressure_scenarios import PRESSURE_POLICY_VERSION, PressureScenario


@dataclass(frozen=True, slots=True)
class SimulatorWarning:
    code: str
    message: str


@dataclass(frozen=True, slots=True)
class SimulatorError:
    code: str
    message: str


@dataclass(frozen=True, slots=True)
class PredictionResult:
    status: str
    recipe: str | None
    pressure_scenario: str | None
    base_mrr: float | None = None
    support_level: str | None = None
    correction_status: str | None = None
    correction_enabled: bool = False
    applied_correction: float | None = None
    final_mrr: float | None = None
    recommended_polishing_time: None = None
    time_status: str = "UNIT_UNVERIFIED"
    warnings: tuple[SimulatorWarning, ...] = ()
    error: SimulatorError | None = None
    model_version: str | None = None
    policy_version: str = PRESSURE_POLICY_VERSION
    history_used: int | None = None
    latest_measurement_completed_at: str | None = None

    def to_dict(self) -> dict:
        output = asdict(self)
        output["warnings"] = [asdict(warning) for warning in self.warnings]
        return output


def failure(code: str, message: str, recipe: object, scenario: object) -> PredictionResult:
    return PredictionResult(
        status="ERROR", recipe=recipe if isinstance(recipe, str) else None,
        pressure_scenario=scenario if isinstance(scenario, str) else None,
        error=SimulatorError(code, message),
    )


def policy_warnings(record: PressureScenario) -> tuple[SimulatorWarning, ...]:
    return (
        SimulatorWarning("PRESSURE_OBSERVATION_NOT_SETPOINT", record.warning_metadata[0]),
        SimulatorWarning("CORRECTION_DISABLED", record.warning_metadata[1]),
        SimulatorWarning("N0_MEASUREMENT_COMPLETE_ASSUMPTION",
                         "모델 개발 기준은 이전 같은 recipe의 측정 완료를 가정한 N=0입니다. 실제 요청에서는 완료 시각을 검사합니다."),
        SimulatorWarning("NO_INDEPENDENT_FINAL_TEST", record.warning_metadata[2]),
        SimulatorWarning("MRR_UNIT_UNVERIFIED", "물리 MRR 단위가 미확정이므로 연마 시간 숫자를 출력하지 않습니다."),
        *(SimulatorWarning("SCENARIO_EVIDENCE_LIMIT", note) for note in record.warning_metadata[3:]),
    )
