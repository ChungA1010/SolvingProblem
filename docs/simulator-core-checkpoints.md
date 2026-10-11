# Issue #4: 시뮬레이터 코어 체크포인트

친구와 코드·테스트를 하나씩 확인할 수 있도록 미완료 항목별로 진행합니다. 각 체크포인트를 구현하고 검증한 뒤 결과를 공유하고 멈춥니다. 현재 완료 범위는 **CP01 예측기 인터페이스, CP02 압력 시나리오 registry**입니다.

작업 브랜치는 [`feat/4-simulator-core-codex`](https://github.com/ChungA1010/SolvingProblem/tree/feat/4-simulator-core-codex)입니다. 기존 `feat/4-simulator-core`에서 Issue #2·#3의 이력을 가져왔으며, 이후 체크포인트는 이 별도 브랜치에서 진행합니다. 체크포인트별 커밋 메시지에 해당 이슈 번호 `#4`를 포함합니다.

기준: [이슈 #4](https://github.com/ChungA1010/SolvingProblem/issues/4), [Issue #2 프로토콜](mrr_model_protocol.md), [pressure 정책](pressure_hybrid_policy.md). 시작 커밋은 `b3476dc9edcc25619cfa5c357d2e5ecf79258bd7`입니다. 이슈에 체크된 history/state 항목은 기존 학습용 코드에서 확인했습니다. 실제 측정 완료 timestamp를 받는 서비스용 state builder와의 연결은 아직 검증하지 않았습니다.

| 순서 | 체크포인트 | 현재 상태 |
|---|---|---|
| CP01 | Base MRR predictor interface | 구현·계약 테스트 완료 |
| CP02 | pressure scenario registry | 구현·정책 테스트 완료 |
| CP03 | recipe / pressure scenario validation | 다음 작업 |
| CP04 | correction activation gate | 대기 |
| CP05 | final_mrr 계산 | 대기 |
| CP06 | structured warning / error | 대기 |
| CP07 | polishing time 비활성 정책 | 대기 |
| CP08 | 전체 파이프라인 unit test | 대기; 개별 checkpoint 테스트는 매 단계 수행 |
| CP09 | 기존 Issue #2 Ridge adapter 및 history 연결 검토 | 대기 |
| CP10 | 전체 코어 실행 방법·제한사항 정리 | 대기 |

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

이번 단계는 고정 메타데이터입니다. 요청 입력 검증(CP03), correction gate(CP04), 최종 MRR 계산(CP05), 실제 Ridge 연결(CP09)은 아직 구현하지 않았습니다. 다음은 **CP03 recipe / pressure scenario validation**입니다. 이슈 본문의 체크박스와 댓글은 이번 코드 커밋에서 수정하지 않았습니다.
