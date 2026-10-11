# Issue #4: 시뮬레이터 코어 체크포인트

친구와 코드·테스트를 하나씩 확인할 수 있도록 미완료 항목별로 진행합니다. 각 체크포인트를 구현하고 검증한 뒤 결과를 공유하고 멈춥니다. 현재 완료 범위는 **CP01 예측기 인터페이스**입니다.

기준: [이슈 #4](https://github.com/ChungA1010/SolvingProblem/issues/4), [Issue #2 프로토콜](mrr_model_protocol.md), [pressure 정책](pressure_hybrid_policy.md). 시작 커밋은 `b3476dc9edcc25619cfa5c357d2e5ecf79258bd7`입니다. 이슈에 체크된 history/state 항목은 기존 학습용 코드에서 확인했습니다. 실제 측정 완료 timestamp를 받는 서비스용 state builder와의 연결은 아직 검증하지 않았습니다.

| 순서 | 체크포인트 | 현재 상태 |
|---|---|---|
| CP01 | Base MRR predictor interface | 구현·계약 테스트 완료 |
| CP02 | pressure scenario registry | 다음 작업 |
| CP03 | recipe / pressure scenario validation | 대기 |
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

이번 checkpoint의 결과는 [`verification/simulator-core/cp01.json`](../verification/simulator-core/cp01.json)에 보존합니다. 다음은 **CP02 pressure scenario registry**입니다. 이슈 본문의 체크박스와 댓글은 이번 코드 커밋에서 수정하지 않았습니다.
