# 전문가용·교육용 MRR 모델과 웹 연결

2026-10-31 회의자료의 두 모드 구분을 반영한다. 전문가용도 학습·취업 준비를
위한 개발용 도구이며 실제 공장 배포 인증이나 독립 성능 검증을 뜻하지 않는다.
두 모드는 같은 Ridge 예측 코어를 사용한다. 교육용 압력·슬러리 규칙은 별개
엔진이고, 데이터로 검증된 예측값과 구별되는 차원 없는 수업용 지표를 반환한다.

## 구현된 입력과 출력

| 항목 | 직접 MRR 계산 | 처리 |
|---|---|---|
| recipe | 사용 | A456/B456만 지원 |
| 과거 실측 MRR | 사용 | 같은 recipe 전체 이력에서 prev_mrr/EWMA 자동 계산 |
| wafer ID | 미사용 | 현재/중복 wafer 검사 |
| 현재 투입 예정시각 | 미사용 | 측정 완료 여부 검사. 같은 유효 이력이면 시각만 바꿔도 MRR 동일 |
| 과거 투입시각 | 상태 순서에 사용 | 순서 변경은 EWMA를 바꿀 수 있음 |
| 측정 완료시각 | 미사용 | 현재 투입보다 엄격히 이전인지 검사 |
| 압력·슬러리·회전 | 미지원 | 사전 설정값/인과 반응이 검증되지 않아 Ridge 요청에서 거부 |
| 소모품 교체·대기 시간 | 미지원 | 검증된 pre-start snapshot과 효과 모델 없음 |
| 측정 주기 | 기본 N=0만 | N>0은 별도 sensitivity 분석이며 현재 웹 예측의 검증 범위를 확장하지 않음 |

웹 사용자에게 prev_mrr/EWMA를 따로 입력시키지 않는다. 실서비스라면 서버 DB의
이력을 사용하고, 교육용 가상 이력은 가상임을 별도로 표시한다. 현재 API는
stateless이며 DB 저장·사용자 인증·프런트 화면은 포함하지 않는다. 호출자가
전체 이력을 제공해야 하며 누락된 이력의 존재를 모델이 알아낼 수는 없다.

출력은 예상 MRR, 최근 상태, 이력 수, 상태 범위 경고, 모델 버전이다.
MRR의 물리 단위는 UNIT_UNVERIFIED이며 제거 두께/권장 연마 시간 숫자는 제공하지 않는다.
출력의 state_support는 단변량 범위 경고다. 신뢰구간이나 joint data coverage가 아니다.

## 로컬 API 실행

저장소 root `PHM/PHM`에서 실행한다. 추론/API에는 Python 3.10+ 표준 라이브러리만
필요하다. 로컬 venv 대신 일반 Python이 있으면 실행 경로만 바꾼다.

```powershell
.\.venv\Scripts\python.exe -m src.models.state_mrr_service --model artifacts/state-mrr-v1/model.json --port 8000 --allow-origin http://localhost:5173
```

- `GET /health`: 모델 로딩 확인.
- `GET /api/v1/capabilities`: 모드·변수별 지원 여부와 단위/검증 상태.
- `POST /api/v1/predictions`: `application/json` 요청. 기존
  [예시](../examples/state_mrr_request.json)에 선택적으로 `mode: "expert"` 또는
  `mode: "education"`을 추가한다. mode만 바꿔서는 MRR이 바뀌지 않는다.
- 성공: `{status, mode, result_kind: "DATA_DRIVEN_STATE_FORECAST", result}`.
- 입력 오류: HTTP 422와 `{status: "ERROR", error: {code, message}}`.
  JSON 파싱 오류는 400, 잘못된 content type은 415다. 지원하지 않는 변수를
  무시하지 않고 거부한다. 요청당 본문은 최대 1 MiB다.

PowerShell에서 예측:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/v1/predictions -ContentType 'application/json' -Body (Get-Content -Raw examples/state_mrr_request.json)
```

브라우저에서는 동일 형식으로 fetch한다. `--allow-origin`에는 실제 프런트 개발
주소를 정확히 지정한다. 이 서버는 로컬 연결 확인용이며 공개 인터넷에 바로
배포하는 서비스가 아니다. 웹 프레임워크 서버에 `predict_payload`를 연결할 수도 있다.
다른 브랜치의 simulator API와 자동 통합하지 않았으며 이 문서의 JSON 계약을 따른다.

## 교육용 압력·슬러리 규칙 설계

사용자 확인에 따라 교육용 조작은 압력 수준과 슬러리 수준 두 개로 설계한다.
레시피는 미션에서 고정할 수 있다. 수준은 각각 Low/Normal/High의 불연속
수업용 선택지다. PHM p_main 군집이나 실제 장비 설정값과 대응시키지 않는다.

```text
educational_index = reference_index
                  + pressure_effect[pressure_level]
                  + slurry_effect[slurry_level]
```

이는 교실에서 두 변수의 독립적인 영향을 비교하기 위한 명시적 가산 규칙이다.
상호작용·포화·Preston 식·연속 보간·외삽을 모델링하지 않는다. 교육 목표에 따라
교사가 계수와 방향을 정하되, 실제 CMP 반응이라고 설명하려면 별도 근거가 필요하다.
Normal 기여는 0으로 고정한다. 기준 index 100은 임의의 수업 기준이고 물리 단위가 없다.
규칙의 크기나 압력/슬러리의 단조 방향을 PHM 데이터에서 추정·확정하지 않았다.

[규칙 템플릿](../examples/education_rules.template.json)의 null은 미결정 값이며
그대로 로딩하면 오류가 난다. 운영 기본 규칙을 임의로 채우지 않는다. 교사가
수업 규칙을 정한 별도 JSON을 `--education-rules <path>`로 명시해야 활성화된다.
설정의 source_status는 반드시 CLASSROOM_ASSUMPTION_NOT_PHM_CALIBRATED다.
규칙 로딩 실패 시 서버 시작을 중단하고 기본값으로 대체하지 않는다.

`POST /api/v1/education/evaluate`의 요청은 다음 두 필드뿐이다.

```json
{"pressure_level": "High", "slurry_level": "Normal"}
```

규칙이 없으면 HTTP 409 EDUCATION_RULESET_REQUIRED다. 활성화된 규칙이 있다면
result_kind=EDUCATIONAL_RULE_SCORE, educational_index, 변수별 기여, ruleset_version,
미검증 규칙 경고를 반환한다. 이 응답에는 base_mrr/final_mrr나 제거량/시간을
넣지 않는다. 규칙 index를 Ridge MRR에 곱하거나 더하지 않는다.

교육용 화면은 데이터 예측 결과와 규칙 지표를 별도 카드로 표시해야 한다.
미션의 목표 index 범위와 재도전 평가는 수업 기획에서 정할 수 있으나 실제
두께 달성/공정 최적화 성공으로 채점하지 않는다. 현재 구현은 규칙 평가 엔진까지이며
수업 계수 선택·미션/게임 화면 구현·규칙의 실제 공정 타당성 검증은 남아 있다.

## 모델 준비와 검증

```powershell
.\.venv\Scripts\python.exe -m src.models.prepare_state_mrr --wafer-table "..\preprocessed_audit_source\preprocessed\wafer_table.csv" --artifact-dir artifacts/state-mrr-v1
```

raw/wafer별 결과는 Git에서 제외되는 results/state_mrr에 남긴다. 공유 묶음
artifacts/state-mrr-v1에는 계수/학습 상태 min-max/집계 보고서만 담는다.
새 hyperparameter 탐색이나 모델 family 추가 없이 기존 고정 Ridge만 fit한다.

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p 'test_state_mrr*.py' -v
```

테스트는 과거 이력 검증, 저장 모델 일치, 추론 중 학습 금지, HTTP/모드 계약,
미지원 변수 거부, 교육 규칙과 Ridge의 분리까지 확인한다. localhost 연결 권한이
있는 환경에서 실행한다. 단위 provenance와 pressure 정책은 각각
[모델 protocol](mrr_model_protocol.md), [hybrid policy](pressure_hybrid_policy.md)를 따른다.
