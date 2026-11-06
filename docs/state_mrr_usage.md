# 최근 상태 기반 MRR 예측

전문가용·교육용 웹 연결, 지원 변수, 별도 교육 규칙은
[웹 API 계약](state_mrr_web_contract.md)에 정리한다. 공유 가능한 모델 묶음은
[artifacts/state-mrr-v1](../artifacts/state-mrr-v1/README.md)에 있다.

현재 웨이퍼 투입 전, 측정이 완료된 같은 recipe의 MRR 이력으로 다음
MRR을 예측한다. 새 모델 family나 tuning 없이 기존 Proposed Ridge를
실제로 저장하고 호출하는 경로다. [기존 평가 protocol](mrr_model_protocol.md)을 따른다.

- Ridge alpha=1.0; inputs: recipe, prev_mrr, state_ewm.
- EWMA alpha=0.4, adjust=False. 전체 같은 recipe 이력을 공정 시작 순서로 누적한다.
- A456/B456만 지원한다. A123은 이 Ridge 경로에서 거부한다.
- 웨이퍼 ID는 식별자이며 투입/측정 완료 시각은 정보 가용성 검사에만 사용한다.
- 압력, slurry, rotation, 연마 시간, 현재 wafer의 MRR을 입력받지 않는다.
- Pressure correction은 적용하지 않는다. final_mrr=base_mrr이다.

## 모델 준비

모든 명령은 저장소 root `PHM/PHM`에서 실행한다. 기존 requirements의
numpy/pandas/scikit-learn이 있는 Python이 필요하다. 아래는 현재 로컬
venv 기준 PowerShell 한 줄 명령이다. 다른 환경에서는 python 실행 경로만 바꾼다.
입력 전처리 표 준비 방법은 [protocol](mrr_model_protocol.md)을 따른다.

```powershell
.\.venv\Scripts\python.exe -m src.models.prepare_state_mrr --wafer-table "..\preprocessed_audit_source\preprocessed\wafer_table.csv"
```

`results/state_mrr/`에 model.json, report.json, predictions.csv가 생성된다.
이 디렉터리는 기존 Git ignore 정책에 따라 제외된다. 모델 파일에는
훈련 데이터 hash, 학습 fold/행 수, 계수, scaler, sklearn 버전이 기록된다.
JSON 모델을 이용한 추론에는 표준 라이브러리만 필요하며, pickle을 읽거나
학습 코드를 import/실행하지 않는다.

fold 2..5 각각 과거 fold로만 imputer/scaler/encoder/Ridge를 fit하고
기존 Ridge/EWMA development benchmark를 재현한다. 평가 label은 N=0
online history 갱신과 평가 지표 계산에 사용한다. 재사용할 단일 모델은
fold 1..4의 A456/B456으로 fit한 모델이다. fold 5도 이미 본 개발 구간이며
독립 test가 아니다. PHM에는 측정 완료 시각이 없어 benchmark의 N=0은
가정이다. 이 artifact는 EDUCATIONAL_DEVELOPMENT_ONLY다.

## 예측 요청

요청 JSON 형식은 다음과 같다. 아래 이력은 API 형식 설명용 가상 값이며
PHM 원자료나 실측 검증 사례가 아니다.

```json
{
  "wafer_id": "next-wafer",
  "recipe": "A456",
  "wafer_start_at": "2026-10-31T12:00:00+09:00",
  "history": [
    {"wafer_id": "prior-1", "recipe": "A456", "wafer_started_at": "2026-10-31T09:00:00+09:00", "measurement_completed_at": "2026-10-31T09:30:00+09:00", "mrr": 100.0},
    {"wafer_id": "prior-2", "recipe": "A456", "wafer_started_at": "2026-10-31T10:00:00+09:00", "measurement_completed_at": "2026-10-31T10:30:00+09:00", "mrr": 110.0}
  ]
}
```

위 내용을 request.json으로 저장하거나, 같은 형식의
[가상 입력 예시](../examples/state_mrr_request.json)를 사용한다.

```powershell
.\.venv\Scripts\python.exe -m src.models.state_mrr --model results/state_mrr/model.json --request examples/state_mrr_request.json
```

Python에서 호출할 때는 `StateMRRPredictor.load(path)` 후
`predict(PredictionRequest.from_dict(payload))`를 호출한다.

같은 recipe의 전체 가용 이력을 보내야 EWMA가 재현된다. 시작 이력이
한 건이면 그 값으로 초기화한다. 다른 recipe는 상태 계산에서 제외한다.
동일 ID/시작시각 중복, 현재/미래 wafer, 측정 미완료, NaN/비양수 MRR,
timezone 없는 시각, 이력 부족은 거부한다. 측정 완료는 현재 투입시각보다
엄격히 이전이어야 한다. 임의로 이력을 생략했는지는 감지할 수 없으므로
호출자가 완전한 이력을 보장해야 한다. 실제 지연이 있는 N>0 운영은 이
N=0 경로에서 조용히 처리하지 않고 별도 검증이 필요하다.

결과는 base_mrr/final_mrr, prev_mrr, state_ewm, history_count, model_version과
경고를 포함한다. raw label scale은 VERIFIED, factor 1이며 물리 단위는
UNIT_UNVERIFIED다. target removal은 NOT_AVAILABLE_IN_PHM_CMP1이고
t_polish unit은 seconds다. polishing time numerical output은 disabled로
recommended_polishing_time=null을 유지한다.

검사 명령:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_state_mrr.py -v
```
