# Issue #4 simulator core 사용법

작업 브랜치: `feat/4-simulator-core-codex`. CP01~CP10의 코드·검증은 [진행표](simulator-core-checkpoints.md), 단계별 시험 기록은 `verification/simulator-core/cp01.json`~`cp10.json`에 있습니다. 기록의 hash는 각 커밋 시점 기준이며 이후 기록으로 덮어쓰지 않습니다.

## 바로 실행하는 계약 데모

저장소 루트에서 Python 3.10 이상을 사용합니다. 표준 라이브러리만으로 데모를 실행할 수 있습니다. 전체 검증 환경은 Python 3.12.14입니다.

```powershell
python -m src.simulator --stub --request examples/simulator_request.json
```

예제는 **합성 이력 + 명시적 테스트 stub**입니다. `prev_mrr=80`, `state_ewm=0.4*80+0.6*60=68`, stub MRR `0.25*80+0.75*68=71`을 반환합니다. 성공 코드 0, 오류 코드 2입니다. [예제 출력](../examples/simulator_output.json)의 모델 버전과 `TEST_STUB_ONLY` 경고를 유지합니다. `--stub`을 생략하면 예측기를 임의로 선택하지 않고 `PREDICTOR_REQUIRED`를 반환합니다. 71은 실제 PHM 성능 지표가 아닙니다.

## 테스트

표준 라이브러리 기반 core 검사:

```powershell
python -m pip install -r requirements-simulator-dev.txt
python -m pytest tests -q --ignore=tests/test_simulator_ridge_adapter.py --basetemp=.pytest_cache/simulator-tests
```

Ridge adapter까지 포함한 전체 검사(Python 3.12에서 검증한 고정 버전):

```powershell
python -m pip install -r requirements-simulator-dev.txt -r requirements-simulator-ridge.txt
python -m pytest tests -q --basetemp=.pytest_cache/simulator-tests
```

adapter 테스트만 외부에서 합성 fixture를 먼저 fit합니다. core import, adapter 생성, prediction 요청에서는 fit을 호출하지 않으며 PHM/development 데이터를 재학습하지 않습니다. 전체 테스트에서 dependency 누락을 skip으로 숨기지 않습니다.

최종 전체 검증 결과는 **197 passed, 0 failed / errors / skipped**입니다. [CP10 기록](../verification/simulator-core/cp10.json)에 Python 버전·테스트 파일과 소스 hash가 보존되어 있습니다.

## 사용자 요청과 처리 순서

```text
SimulationRequest
  -> 정확한 recipe/scenario 검증
  -> 현재 투입 전 측정 완료된 같은 recipe 이력 선택
  -> prev_mrr / EWMA(alpha=0.4, adjust=False)
  -> 주입된 BaseMRRPredictor
  -> correction activation gate / final_mrr
  -> 경고·오류·버전과 연마 시간 비활성 결과
```

요청 필드는 `wafer_id`, `recipe`, `pressure_scenario`, `wafer_start_at`, `history`이며 `target_removal`, `target_removal_unit`은 선택 사항입니다. 일반 사용자는 state를 직접 입력하지 않습니다. JSON 경계에서 raw pressure, 직접 입력한 state, 외부 delta와 기타 필드를 거부합니다. Python API는 `SimulationRequest`를 받습니다.

각 `MRRMeasurement`는 실행 고유 `wafer_id`, `recipe`, `wafer_started_at`, `measurement_completed_at`, `mrr`를 가집니다. 원 데이터처럼 wafer ID가 stage별로 반복되면 `123:A`처럼 stage를 포함한 고유 ID를 사용합니다. 시각은 ISO 8601 offset/Z 또는 timezone-aware datetime입니다. UTC로 비교하며 **현재 투입 시각과 같은 완료 시각도 사용하지 않습니다**.

현재 실행 ID, 다른 recipe, 미래 투입/완료 기록은 계산에 쓰지 않습니다. 사용 가능한 이력은 완료 시각, 과거 투입 시각 순으로 정렬합니다. 둘 다 같은 시각의 순서가 불명확한 기록은 오류로 반환합니다. 유효 이력 한 개이면 그 값이 prev/state의 초기값이고, 0개이면 `INSUFFICIENT_HISTORY`입니다. 중복 ID·잘못된 시각·비유한 가용 측정값을 임의 보정하거나 평균으로 채우지 않습니다.

## 이미 학습된 Ridge 연결

```python
from src.simulator import Issue2RidgeAdapter, SimulatorCore

# fitted_pipeline과 request는 호출자가 명시적으로 준비합니다.
adapter = Issue2RidgeAdapter(
    fitted_pipeline,
    model_version="externally-assigned-model-v1",
    provenance="학습 자료·기간·artifact 식별자와 검증 근거",
)
result = SimulatorCore(adapter).predict(request)
payload = result.to_dict()
```

Issue #2의 fitted pipeline 형태를 검사합니다: 입력 순서 `recipe, prev_mrr, state_ewm`, 두 recipe의 OneHotEncoder(handle_unknown=ignore), median imputer + StandardScaler, scalar Ridge α=1.0. 다른 전처리·설정·미학습 pipeline은 거부합니다. 객체의 복사본을 보유하여 호출자가 원 모델을 바꿔도 예측기가 바뀌지 않게 합니다. artifact 파일을 자동 로드하거나 전체 개발 자료를 fit하는 기능은 없습니다. 형식 검사만으로 모델 데이터 출처·target 단위·배포 승인을 증명할 수 없으므로 provenance와 별도 검증이 필요합니다.

현재 저장된 Issue #2 fitted artifact는 제공되지 않았습니다. 따라서 실제 PHM 모델의 배포 연결, 새로운 MAE 평가, 독립 final test 완료를 주장하지 않습니다. 합성 fitted Ridge fixture에서 원 pipeline 예측과 adapter·history 경로 예측의 일치만 검증했습니다.

## 고정 정책과 결과

- 지원: A456 Low/Normal, B456 Low/Normal/High. 대소문자·공백 자동 정리, numeric pressure 매핑, 보간·외삽·physics fallback은 없습니다.
- 모든 numerical correction은 비활성이며 `applied_correction=0`, `final_mrr=base_mrr`입니다. 보정 enable/default delta 변경은 `CORRECTION_NOT_APPROVED` 오류로 중단합니다.
- 관측 p_main 범위는 센서 메타데이터이며 장비 setpoint·수치 입력 허용 구간이 아닙니다.
- `recommended_polishing_time=null`, `time_status=UNIT_UNVERIFIED`입니다. 목표 제거량을 넣어도 모델 특징이나 시간 계산에 쓰지 않습니다.
- 성공에는 관측 조건의 한계, 보정 비활성, 모델 개발 시 N=0 가정, 독립 final test 부재, 물리 단위 미확정 및 scenario별 제한을 code/message 경고로 반환합니다.
- 오류에는 `status=ERROR`, `error.code/message`와 null MRR을 반환합니다. 주요 코드는 `UNSUPPORTED_PRESSURE_SCENARIO`, `INSUFFICIENT_HISTORY`, `INVALID_TIMESTAMP`, `DUPLICATE_HISTORY`, `AMBIGUOUS_HISTORY_ORDER`, `INVALID_HISTORY_VALUE`, `PREDICTOR_ERROR`입니다.

PHM 자료에는 실제 측정 완료 시각이 없어 기존 N=0 개발 benchmark는 가정에 의존합니다. 이 서비스가 timestamp를 검사한다고 기존 benchmark의 측정 가정이나 독립 검증 부재가 해소된 것은 아닙니다. 기존 Issue #2/Di2017 결과와 모델 코드는 변경하지 않았습니다. 이슈 #4 완료 범위는 코어와 adapter 연결 구조이며 Unity UI는 후속 작업입니다.
