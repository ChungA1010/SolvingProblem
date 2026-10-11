# Issue #4: 시뮬레이터 코어 체크포인트

2026-10-11 기준 **CP01~CP10 코어 작업을 모두 완료**했습니다. 친구가 변경 내용을 따라갈 수 있도록 체크포인트별로 구현·검증·커밋했습니다. 현재 실행 방법은 [사용법](simulator-core-usage.md)을 보세요. 아래 표가 현재 상태이며 개별 절과 JSON hash는 해당 체크포인트 커밋 시점의 기록입니다. 실제 fitted PHM model artifact 배포 연결과 독립 final test는 완료 범위에 포함되지 않습니다.

작업 브랜치는 [`feat/4-simulator-core-codex`](https://github.com/ChungA1010/SolvingProblem/tree/feat/4-simulator-core-codex)입니다. 기존 `feat/4-simulator-core`에서 Issue #2·#3의 이력을 가져왔으며, 이후 체크포인트는 이 별도 브랜치에서 진행합니다. 체크포인트별 커밋 메시지에 해당 이슈 번호 `#4`를 포함합니다.

기준: [이슈 #4](https://github.com/ChungA1010/SolvingProblem/issues/4), [Issue #2 프로토콜](mrr_model_protocol.md), [pressure 정책](pressure_hybrid_policy.md). 시작 커밋은 `b3476dc9edcc25619cfa5c357d2e5ecf79258bd7`입니다. 기존 학습용 이력 코드와 별도로 실제 완료 timestamp를 검사하는 서비스용 state builder를 CP08에서 구현하고 전체 요청과의 연결을 검증했습니다. PHM 원자료의 실제 완료 시각은 제공되지 않아 기존 N=0 benchmark 가정은 그대로 남습니다.

| 순서 | 체크포인트 | 현재 상태 | 단계 시점 누적 테스트 통과 |
|---|---|---|---:|
| CP01 | Base MRR predictor interface | 구현·계약 테스트 완료 | 25 |
| CP02 | pressure scenario registry | 구현·정책 테스트 완료 | 41 |
| CP03 | recipe / pressure scenario validation | 구현·입력 검증 테스트 완료 | 89 |
| CP04 | correction activation gate | 구현·테스트 완료 | 99 |
| CP05 | final_mrr 계산 | 구현·테스트 완료 | 112 |
| CP06 | structured warning / error | 구현·테스트 완료 | 131 |
| CP07 | polishing time 비활성 정책 | 구현·테스트 완료 | 139 |
| CP08 | 전체 파이프라인 unit test | 구현·서비스용 history/state 연결 검증 완료 | 172 |
| CP09 | 기존 Issue #2 Ridge adapter 및 history 연결 검토 | adapter 구현·합성 fitted pipeline 연결 검증 완료 | 186 |
| CP10 | 전체 코어 실행 방법·제한사항 정리 | 문서·JSON 계약 데모·CLI 검증 완료 | 197 |

## CP01: Base MRR predictor interface

- 날짜: 2026-10-11.
- 구현: [`src/simulator/predictor.py`](../src/simulator/predictor.py).
- 호출: `predict(recipe, prev_mrr, state_ewm) -> float`.
- 모델 제공자가 `model_version`과 `_predict(...)`를 구현합니다. 호출부는 공통 인터페이스로 예측합니다.
- A456/B456 경로만 허용합니다. A123은 별도 state-only 경로에 남깁니다.
- 상태 입력 누락·문자열·boolean·NaN/Inf와 유효하지 않은 예측 결과를 예외로 처리합니다. 이 예외를 structured error로 바꾸는 것은 CP06에서 합니다.
- 입력은 상태 생성기가 계산한 값입니다. 일반 사용자가 `prev_mrr`/`state_ewm`을 직접 입력하는 공개 API를 구현한 단계가 아닙니다.
- 인터페이스에는 측정 timestamp가 없으므로 측정 완료 여부를 증명할 수 없습니다. 서비스용 history/state builder가 투입 이전 같은 recipe의 측정 완료 이력만 공급해야 합니다.
- 인터페이스 import는 ML 라이브러리나 학습 모듈을 읽지 않습니다. 호출도 주입된 `_predict`만 사용하며 estimator fitting 경로가 없습니다.

이 checkpoint는 예측기 계약입니다. 학습된 Ridge 저장 파일이 없으므로 실제 Ridge adapter·학습 모델 로딩은 CP09에 남깁니다. fold 5 모델을 production 모델로 지정하거나 development 전체를 자동 재학습하지 않았습니다. 모델 성능 개선이나 실제 MRR 추론 완료를 주장하지 않습니다.

### 테스트에서의 호출 예

아래 계산은 인터페이스를 확인하는 결정론적 stub이며 실제 Ridge가 아닙니다.

```python
from src.simulator import BaseMRRPredictor

class TestPredictor(BaseMRRPredictor):
    model_version = "TEST_STUB_ONLY_v1"

    def _predict(self, recipe, prev_mrr, state_ewm):
        return 0.25 * prev_mrr + 0.75 * state_ewm

predictor = TestPredictor()
assert predictor.predict("A456", 60, 80) == 75.0
```

### CP01 확인 방법

저장소 루트에서 실행합니다. Python 3.10 이상이며 runtime 인터페이스는 표준 라이브러리만 사용합니다.

```powershell
python -m pip install -r requirements-simulator-dev.txt
python -m pytest tests/test_simulator_predictor.py -q
```

계약 테스트는 정상 호출, 잘못된 입력·출력 차단, 모델 버전 식별, repeated prediction에서 `fit` 미호출을 확인합니다. 별도 Python 프로세스에서 ML·학습 모듈 import를 강제로 차단한 상태로 `src.simulator` import도 확인합니다. 모델 구현자가 `_predict` 안에서 금지된 학습을 실행하는 것까지 이 추상 클래스가 강제로 막지는 못하므로, 실제 adapter에서도 같은 기준을 검증해야 합니다.

이번 checkpoint의 결과는 [`verification/simulator-core/cp01.json`](../verification/simulator-core/cp01.json)에 보존합니다. CP01 기록의 소스 hash는 커밋 `807d93a` 시점의 값이며 이후 변경에 맞춰 덮어쓰지 않습니다.

## CP02: pressure scenario registry

- 날짜: 2026-10-11.
- 구현: [`src/simulator/pressure_scenarios.py`](../src/simulator/pressure_scenarios.py).
- 정책 버전: `issue3-pressure-scenarios-v1`.
- 근거: `b3476dc` 시점의 [Issue #3 정책 문서](pressure_hybrid_policy.md). 이번에는 해당 정책을 코드로 옮겼으며 원본 관측 데이터를 새로 분석하지 않았습니다.
- `PRESSURE_SCENARIOS`는 `(recipe, pressure_scenario)`를 키로 사용하는 읽기 전용 mapping입니다. 각 항목도 frozen dataclass이며 범위·경고는 tuple로 보존합니다.

| Recipe | Scenario | observed_p_main_range | observed_wafer_count | support_level | correction_status |
|---|---|---|---:|---|---|
| A456 | Low | 250.817–252.000 | 21 | OBSERVED_LIMITED | EXPLORATORY |
| A456 | Normal | 268.810–270.011 | 777 | OBSERVED_DENSE | NONE |
| B456 | Low | 248.400–252.000 | 31 | OBSERVED_LIMITED | OBSERVATIONAL_ONLY |
| B456 | Normal | 256.871–258.000 | 729 | OBSERVED_DENSE | NONE |
| B456 | High | 268.927–270.000 | 52 | OBSERVED_LIMITED | CHRONOLOGICALLY_SUPPORTED |

전체 표본 수와 fold 2~5 평가 표본 수는 다릅니다. B456 High의 전체 52장 중 평가 42장이라는 제한을 경고에 남깁니다. A456 Low의 21장은 모두 fold 5, B456 Low의 248.400 관측은 1장이라는 제한도 보존합니다. B456의 347.893 이상치는 High에서 제외하며 254.32·254.41 관측을 위한 새 scenario를 추가하지 않았습니다.

모든 항목은 `correction_enabled=false`, `default_applied_correction=0.0`, `mrr_unit_status=UNIT_UNVERIFIED`입니다. `default_applied_correction`은 정책의 비활성 기본값이며 선택된 보정 estimator나 실제 적용 결과가 아닙니다. 보정 비활성과 압력 효과가 0으로 입증됐다는 주장은 구분합니다. 관측 범위는 기존 `p_main` 척도의 설명용 메타데이터이며 숫자 압력 입력 허용 범위나 장비 setpoint가 아닙니다.

각 항목의 `warning_metadata`에는 센서 관측과 setpoint의 차이, 현재 보정 비활성, 독립 final test 부재와 해당 표본의 제한을 기록합니다. 이 문자열을 prediction 결과의 structured warning으로 변환하는 것은 CP06에서 진행합니다. `policy_version`과 `provenance`로 정책 근거를 추적합니다.

### CP02 확인 방법

```python
from src.simulator import PRESSURE_SCENARIOS

high = PRESSURE_SCENARIOS[("B456", "High")]
assert high.correction_status == "CHRONOLOGICALLY_SUPPORTED"
assert high.correction_enabled is False
assert high.default_applied_correction == 0.0
```

```powershell
python -m pip install -r requirements-simulator-dev.txt
python -m pytest tests/test_simulator_predictor.py tests/test_simulator_pressure_scenarios.py -q
```

테스트는 정책의 다섯 조합·범위·표본 수·검증 상태, 모든 보정의 비활성, 경고·출처 보존과 항목의 변경 차단을 확인합니다. 새 Python 프로세스에서 학습 모듈 import 및 파일 읽기를 차단한 상태로 registry import도 확인합니다. 기존 CP01 테스트를 함께 실행하여 공통 import와 예측기 계약을 검증합니다. 결과는 [`verification/simulator-core/cp02.json`](../verification/simulator-core/cp02.json)에 보존합니다.

검증 결과: CP02 16개와 CP01 25개, **총 41개 통과**, 실패·오류·skip 0개입니다.

CP02는 고정 메타데이터 단계입니다. CP02 기록의 소스 hash는 커밋 `da1c0ff` 시점의 값이며 이후 변경에 맞춰 덮어쓰지 않습니다.

## CP03: recipe / pressure scenario validation

- 날짜: 2026-10-11.
- 구현: [`src/simulator/scenario_validation.py`](../src/simulator/scenario_validation.py).
- 호출: `validate_pressure_scenario(recipe, pressure_scenario) -> PressureScenario`.
- 근거: [이슈 #4](https://github.com/ChungA1010/SolvingProblem/issues/4)의 scenario validation 및 [Issue #3 정책](pressure_hybrid_policy.md).
- 지원된 정확한 문자열 조합만 통과하며 registry에 있던 동일한 메타데이터 항목을 반환합니다. 해당 항목의 경고·출처·보정 비활성 상태를 그대로 유지합니다.

| 입력 예 | 결과 |
|---|---|
| A456 + Low / Normal | 등록된 항목 반환 |
| B456 + Low / Normal / High | 등록된 항목 반환 |
| A456 + High | UNSUPPORTED_PRESSURE_SCENARIO |
| A123 / unknown recipe | UNSUPPORTED_PRESSURE_SCENARIO |
| unknown / 빈 scenario | UNSUPPORTED_PRESSURE_SCENARIO |
| 숫자 압력 270 / 문자열 숫자 "270" | UNSUPPORTED_PRESSURE_SCENARIO |
| 누락값 None / boolean / list / dict | UNSUPPORTED_PRESSURE_SCENARIO |
| "a456" / "high" / 이름 앞뒤 공백 | UNSUPPORTED_PRESSURE_SCENARIO |

숫자 압력이 관측 범위의 끝점이나 내부 값이어도 허용하지 않습니다. 군집 사이 254.32·254.41·263이나 이상치 347.893도 이름으로 바꾸지 않습니다. 이름의 대소문자·공백을 자동 정리하거나 가까운 군집으로 변환하지 않습니다. 입력 타입을 먼저 확인하므로 list·dict 같은 잘못된 요청 값에서도 `TypeError: unhashable type` 대신 동일한 정책 오류를 받습니다.

실패 시 `UnsupportedPressureScenarioError`를 발생시키며 `error.code == "UNSUPPORTED_PRESSURE_SCENARIO"`로 식별합니다. 이 예외는 `ValueError`의 하위 클래스입니다. 이는 CP03의 입력 검증 오류 계약이며, 전체 prediction 결과의 structured warning/error 응답으로 변환하는 것은 CP06에 남깁니다.

### CP03 확인 방법

```python
from src.simulator import UnsupportedPressureScenarioError, validate_pressure_scenario

high = validate_pressure_scenario("B456", "High")
assert high.correction_status == "CHRONOLOGICALLY_SUPPORTED"
assert high.correction_enabled is False

try:
    validate_pressure_scenario("A456", "High")
except UnsupportedPressureScenarioError as error:
    assert error.code == "UNSUPPORTED_PRESSURE_SCENARIO"
else:
    raise AssertionError("A456 High must be rejected")
```

```powershell
python -m pip install -r requirements-simulator-dev.txt
python -m pytest tests/test_simulator_predictor.py tests/test_simulator_pressure_scenarios.py tests/test_simulator_scenario_validation.py -q
```

검증에는 다섯 정상 조합, 미지원 이름·조합, 잘못된 타입, 관측 범위 안팎의 숫자 압력, 자동 형변환 차단, 거부 이후 정책 불변을 포함합니다. 별도 Python 프로세스에서 파일 읽기와 학습 모듈 import를 차단한 상태로 정상·오류 요청도 실행합니다. 결과는 [`verification/simulator-core/cp03.json`](../verification/simulator-core/cp03.json)에 보존합니다.

검증 결과: CP03 48개와 기존 CP01·CP02 41개, **총 89개 통과**, 실패·오류·skip 0개입니다.

이번 단계는 recipe/scenario 값 두 개를 검증하는 함수입니다. history를 받는 전체 prediction 요청 API, correction gate(CP04), 최종 MRR 계산(CP05), 실제 Ridge 연결(CP09)은 아직 구현하지 않았습니다. 다음은 **CP04 correction activation gate**입니다. 이슈 본문의 체크박스와 댓글은 이번 코드 커밋에서 수정하지 않았습니다.

## CP04: correction activation gate

`pressure_correction(recipe, pressure_scenario)`는 CP03 검증 뒤 현재 모든 항목에서 `0.0`을 반환합니다. `EXPLORATORY`나 `CHRONOLOGICALLY_SUPPORTED` 상태만으로 보정을 켜지 않습니다. registry에서 enable 또는 기본 delta가 임의 변경되면 `CORRECTION_NOT_APPROVED`로 중단합니다. 외부 CSV나 사용자 delta를 읽는 경로는 없습니다. [검증 기록](../verification/simulator-core/cp04.json).

## CP05: final_mrr 계산

`calculate_mrr(recipe, pressure_scenario, base_mrr)`는 CP04 gate에서만 보정값을 받습니다. 반환값은 `base_mrr`, `applied_correction`, `final_mrr`이며 현재 다섯 scenario 모두 `final_mrr == base_mrr`입니다. 비유한 값·boolean·문자열은 계산에 들어가지 못합니다. 모델 척도의 0 또는 음수를 물리 단위나 연마 시간으로 바꾸지 않습니다. [검증 기록](../verification/simulator-core/cp05.json).

## CP06: structured result / warning / error

`PredictionResult.to_dict()`는 JSON으로 전달할 수 있는 결과를 반환합니다. 성공에는 policy/model 버전, base/final MRR, 보정 상태와 다섯 필수 경고 및 scenario별 제한이 포함됩니다. 오류에는 `status=ERROR`와 `error.code/message`를 반환하며 MRR을 만들지 않습니다. 입력 오류는 예측기 호출 전에 처리하고 모델 호출 실패도 명시적 오류로 반환합니다. `inference.predict_from_state`는 내부 단계이며 사용자용 history 요청 API는 CP08에서 연결합니다. [검증 기록](../verification/simulator-core/cp06.json).

## CP07: polishing time 비활성 정책

`polishing_time_policy`를 내부 inference에 연결했습니다. 목표 제거량과 단위 이름을 입력해도 `recommended_polishing_time=null`, `time_status=UNIT_UNVERIFIED`를 유지합니다. 목표 제거량은 모델 특징으로 사용하지 않으며, 제공된 경우 `TARGET_REMOVAL_NOT_USED` 경고를 남깁니다. 나눗셈·단위 추정·양수 MRR을 이용한 암묵적 시간 계산은 없습니다. [검증 기록](../verification/simulator-core/cp07.json).

## CP08: history부터 결과까지 연결 및 전체 테스트

`SimulatorCore.predict(SimulationRequest)`는 사용자가 제공한 timestamp 기반 측정 이력에서 상태를 내부 계산합니다. 현재 투입보다 **엄격히 이전**에 같은 recipe의 측정이 완료된 값만 사용하고 현재 실행 ID·다른 recipe·미래 완료 라벨은 제외합니다. 완료 시각 순으로 EWMA α=0.4, adjust=False를 계산하며 첫 측정값으로 초기화합니다. 완료 시각 동률은 과거 투입 시각으로 정렬하고 두 시각 모두 같으면 임의 순서를 정하지 않고 오류로 반환합니다.

최소 한 개의 유효 이력이 필요합니다. 빈 이력·잘못된 시각·중복 실행 ID·비유한 측정값은 예측기 호출 전에 구조화된 오류가 됩니다. ID는 stage까지 포함한 실행 고유값을 사용해야 합니다. timezone-aware 시각은 UTC로 정규화합니다. 실제 PHM에는 측정 완료 시각이 없으므로 예제·테스트의 시각이 원본 관측이라는 주장은 하지 않습니다. 기존 순번 기반 N=0 benchmark나 모델 결과를 변경하지 않았습니다.

요청 API에는 `prev_mrr`, `state_ewm`, raw pressure, 외부 delta 입력이 없습니다. 전체 경로의 다섯 scenario·오류·단위 경고·미래 라벨 변경 불변·학습/파일 읽기 차단을 검증합니다. [검증 기록](../verification/simulator-core/cp08.json).

## CP09: Issue #2 fitted Ridge adapter 및 이력 연결

`Issue2RidgeAdapter(fitted_pipeline, model_version=..., provenance=...)`는 이미 학습된 pipeline을 명시적으로 주입받습니다. 기존 `train_mrr_chronological._fixed_regression`의 recipe OneHotEncoder(handle_unknown=ignore), numeric median imputer + StandardScaler, Ridge α=1.0과 세 입력의 이름·순서를 검사합니다. 미학습·변경된 pipeline은 거부하며 caller의 이후 변경이 예측기를 바꾸지 않도록 이미 학습된 객체를 복사합니다. ML 라이브러리는 adapter 생성/사용 시에만 불러옵니다.

테스트에서는 **합성 데이터로 외부에서 미리 학습한 fixture**를 사용합니다. 원 pipeline과 adapter의 예측 일치, 전체 history 요청 연결, 모든 단계의 fit을 차단한 반복 요청을 확인합니다. PHM/development 전체 refit, fold 5 production 지정, 새 하이퍼파라미터 탐색은 수행하지 않았습니다. 실제 저장된 Issue #2 모델 파일은 없으므로 해당 파일의 배포 연결·실제 MRR 성능 검증은 이번 완료 범위에 포함되지 않습니다. 이슈 #4에서 요구한 adapter 구조와 연결 계약은 구현·검증했습니다. [검증 기록](../verification/simulator-core/cp09.json).

## CP10: 전체 사용법 및 제한사항

[사용법](simulator-core-usage.md)에 표준 라이브러리 계약 데모, 최소/전체 테스트 명령, JSON·Python 요청 계약, fitted Ridge 주입 방법, 오류 코드와 남은 데이터·단위 제한을 정리했습니다. `python -m src.simulator --stub --request examples/simulator_request.json`은 [입력](../examples/simulator_request.json)으로 [출력](../examples/simulator_output.json)을 재현합니다. JSON 경계에서 raw pressure·직접 state·외부 delta·잘못된 시각을 거부합니다. 테스트 stub는 명시적 flag와 버전·경고로 표시하며 실제 Ridge나 연구 성능으로 표시하지 않습니다. [최종 검증 기록](../verification/simulator-core/cp10.json).

### 이슈 #4 완료 조건 대응

최종 검증은 **197개 통과, 실패·오류·skip 0개**입니다. JSON 데모 입력·출력 재현과 fitted adapter 검사를 포함합니다. 처음 CLI 검증에서 기본 임시 폴더 권한 오류가 있어 workspace `.pytest_cache/cp10/tmp`로 임시 경로를 제한한 뒤 전체 검사를 다시 수행했습니다.

| 요구사항 | 구현 / 검증 |
|---|---|
| 입력·출력 계약 | SimulationRequest / PredictionResult / JSON CLI |
| 측정 완료된 same-recipe history | history.py, strict before-start, 현재·다른 recipe·미래 제외 |
| prev_mrr / EWMA α=0.4 | 첫 측정 seed, adjust=False, 시각 정렬·중복/모호성 오류 |
| Base predictor / 기존 Ridge adapter | 명시적 주입, fitted 전처리 유지, 외부 객체 변경 격리 |
| categorical scenario / validation | 다섯 조합만 허용, numeric 입력·보간·외삽·자동 fallback 없음 |
| correction activation gate | 기본 보정 0, enable/default 변경 시 미승인 오류 |
| final MRR / 경고 / 버전 | base+gate 결과, 구조화된 code/message, model/policy 추적 |
| polishing time 비활성 | target 입력과 무관하게 null / UNIT_UNVERIFIED |
| import/request에서 재학습 없음 | fresh subprocess의 ML import 차단, real fixture의 모든 fit 차단 |
| 기존 연구 코드·결과 보존 | 기존 모델·전처리·결과 파일을 변경하지 않음 |
| 실행 방법·한계 | usage 문서·명시적 stub 데모·개별 및 전체 테스트 기록 |

이슈 본문의 체크박스·댓글과 close 상태는 변경하지 않았습니다. 이 문서의 완료는 코어 및 adapter 구조에 대한 것이며 실제 모델 배포나 독립 성능 검증을 뜻하지 않습니다.
