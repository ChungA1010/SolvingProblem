# 교육용 Ridge와 Unity 연결 체크포인트

브랜치 `feat/4-simulator-core-codex`, 기준 커밋 `64d3f23`. CP01~CP10의 Issue #4 코어 다음 작업입니다. 모델 저장, 실제 데이터 replay 검증, Unity 연결을 사용자가 요청하여 순서대로 진행합니다. 각 커밋에 관련 이슈 번호를 기록합니다.

| 단계 | 결과 | 상태 |
|---|---|---|
| CP11 (#2, #4) | 고정 Ridge 교육용 export, 원 pipeline/portable/core 일치, 측정 주기·지연 replay | 완료 |
| CP12 (#4) | artifact 체크섬을 확인하는 로컬 HTTP API, 입력·오류 계약과 실행 도구 | 검증 후 별도 커밋 |
| CP13 (#4) | CMP 전용 Unity 프로젝트·Windows 빌드·실제 HTTP 통합 시험 | 검증 후 별도 커밋 |

## CP11: 교육용 모델과 실제 PHM replay

[모델](../artifacts/education-ridge-v1/model.json), [재현 보고서](../artifacts/education-ridge-v1/report.json), [측정 민감도](../artifacts/education-ridge-v1/measurement_summary.csv)를 확인하세요. 원본 전처리 표는 Git에 올리지 않습니다. 파일의 SHA256과 집계 결과만 기록하며, 로컬 `predictions.csv`도 제외합니다.

학습 정책은 실행 전에 고정했습니다: Ridge α=1.0, 입력 `recipe + prev_mrr + state_ewm`, EWMA α=0.4. 각 개발 fold의 이전 fold에서만 적합하고, **교육용 저장 모델은 fold 1~4의 A456/B456 1,286행으로 학습한 한 모델**입니다. fold 5는 이미 확인한 개발 구간입니다. 전체 5개 fold refit, 하이퍼파라미터 탐색, production 선언을 하지 않습니다. 비교용 다른 fold의 모델은 저장·자동 선택하지 않습니다.

학습된 OneHotEncoder, median imputer, StandardScaler, Ridge의 수치를 JSON으로 내보냈습니다. 이는 실제 PHM 학습 파라미터이며 pickle 실행이나 runtime sklearn 설치 없이 사용합니다. 서비스 요청에서 결측 이력을 중앙값으로 채우는 기능은 없습니다. 이미 학습된 imputer 통계는 전처리 출처를 기록하기 위해 보존합니다.

전처리 1,977행에서 A456/B456 평가 1,286행을 사용합니다. 원 fitted pipeline과 portable 및 history 기반 core의 최대 예측 차이는 `1.4210854715202004e-14`, N=0 상태 차이는 `0`입니다. 기존 benchmark도 소수 셋째 자리까지 재현했습니다.

| 모델 | 기존 문서 MAE | 이번 replay MAE |
|---|---:|---:|
| Recipe Mean | 7.167 | 7.167237 |
| Persistence | 2.980 | 2.980179 |
| EWMA | 2.747 | 2.746926 |
| Ridge | 2.690 | 2.690006 |

### 측정 횟수와 추가 지연을 분리한 실험

같은 recipe의 관측 웨이퍼 k장마다 한 장을 측정합니다. 측정 cadence는 fold 경계에서 초기화하지 않습니다. 추가 지연 N은 측정한 웨이퍼 다음에 **추가 same-recipe N장**이 지난 뒤 값을 받는 조건입니다. N=0 학습 계수는 모든 조건에서 고정하며, sensitivity용 재학습은 없습니다. 각 조건은 같은 평가 1,286행을 사용합니다.

| 측정 주기 | 평가 구간 측정 선택 수 | 추가 지연 0 MAE | 추가 지연 1 MAE | 추가 지연 2 MAE |
|---|---:|---:|---:|---:|
| 매 1장 | 1,286 | 2.690006 | 3.152937 | 3.473936 |
| 매 5장 | 258 | 3.441299 | 3.714289 | 3.924268 |
| 매 10장 | 128 | 3.949417 | 4.155216 | 4.344295 |

추가 지연이 없을 때 매 5장은 측정 선택 수 약 79.9% 감소, MAE 약 27.9% 증가입니다. 매 10장은 약 90.0% 감소, MAE 약 46.8% 증가입니다. 측정 선택 수는 평가 구간의 계획 횟수이며, prediction 이전에 사용 가능한 이력 수 또는 실제 계측기 기록 수가 아닙니다. 모든 조건의 recipe별·fold별 집계도 파일에 있습니다.

**실제 측정 완료 시각은 PHM 자료에 없습니다.** 기존 ordinal N=0 조건을 서비스 timestamp 계약에 연결하기 위해 합성 UTC ordering clock을 사용했습니다. PHM 센서 시각을 측정 완료 시각으로 바꾸지 않았으며, 이 합성 시각을 실제 계측 이력으로 주장하지 않습니다. 현재/미래 라벨은 해당 request의 ledger에 미리 넣지 않습니다.

기존 지연 감사는 각 N에서 다시 적합한 모델이고, 이번 sensitivity는 N=0 계수를 고정한 입력 변화 실험입니다. N=1·2 수치가 기존 표와 다른 이유는 이 차이입니다. 오류 감소나 독립 최종 성능 달성을 주장하지 않습니다.

### 재현

Python 3.12와 `requirements-simulator-ridge.txt`의 고정 환경에서 저장소 루트 실행:

```powershell
python -m src.models.export_simulator_ridge --wafer-table C:/path/to/wafer_table.csv --output artifacts/education-ridge-reproduction
```

이 명령만 명시적으로 offline fit합니다. 기존 `education-ridge-v1`을 덮어쓰지 않고 새 출력 경로가 필요합니다. source table hash는 `cf22df23300d170133ce252b7d936c57fae6a18b55a43c4bf56ba0c83a4bd9d5`입니다. 기존 학습 코드, Di2017 동결 baseline과 기존 결과는 수정하지 않습니다.

## 완료 범위의 구분

교육용 모델 저장은 독립 최종 모델 선정과 다릅니다. Issue #2의 동일 조건 Di2017 비교, 독립 미래 데이터 검증, `kp_model.py`/`fit_kp.py`의 동일 조건 비교는 여전히 남습니다. 압력 correction은 전부 0이며, 물리 단위와 목표 제거량이 검증되지 않아 polishing time은 null입니다. GitHub 이슈 본문·체크박스·댓글·close 상태는 이 작업에서 수정하지 않습니다.
