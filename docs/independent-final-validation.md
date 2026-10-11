# 독립 최종 성능 검증 준비 (#2, #4)

**현재 상태: `WAITING_FOR_UNSEEN_DATA`. 독립 최종 MAE는 아직 없습니다.**
이번 작업은 사용 가능한 자료의 노출 이력을 확인하고, 후보 모델과 평가 절차를
고정했습니다. 기존 교육용 모델의 계수와 API·Unity 동작은 동일합니다.
[준비 상태](../verification/independent-final-v1/readiness.json),
[후보 고정 기록](../verification/independent-final-v1/candidate-freeze.json)을 확인하세요.

최종 Git 파일 검사에서 로컬 고정 model의 CRLF가 Git blob에서는 LF로
정규화되어 SHA256이 달라진 문제를 확인했습니다. `.gitattributes`를 `-text`로
고치고 모델 파일의 **원래 바이트**를 보존했습니다. 계수 변경·재학습은 없으며
공유 checkout도 아래 고정 SHA256과 일치하는지 확인합니다.

## 기존 데이터를 독립 최종 시험으로 사용할 수 없는 이유

| 자료 | 확인한 기록 | 이번 독립 최종 시험 사용 |
|---|---|---|
| 전처리 표 1,977행, fold 1~5 | fold 5까지 특징·모델 비교에 사용 | 불가 |
| PHM test | 2026-09-16에 기존 모델 26개 평가; 이전 채점 121행 | 불가 |
| PHM validation | 같은 날 기존 모델 26개 평가; 이전 채점 140행 | 불가 |

이전 외부 평가에서는 test·validation 각각 424개 라벨에 접근했습니다.
전체 원래 corpus 1,981행과 외부 manifest 848행의 웨이퍼·그룹을 모두
제외 목록에 넣었습니다. 이전 평가에서 제외된 행도 이번에 새 데이터로
간주하지 않습니다. 알려진 웨이퍼 ID는 2,268개이며, 그룹과 source file의
alias는 681개입니다. 공개 목록에는 원 ID 대신 SHA256만 기록했습니다.
학습/외부 자료의 PHM 센서 시간 범위도 겹칩니다.

이전에 다른 모델로 평가했다는 사실도 고려해야 합니다. 현재 Ridge에
처음 입력한다는 이유로 프로젝트 전체에서 이미 본 자료가 다시 미사용
최종 시험이 되지는 않습니다. 재다운로드, 폴더명 변경, fold 재분할도
이 문제를 해결하지 않습니다. 이 감사는 알려진 자료에 한정되며 모든
개인 파일·원격 저장소를 조사했다고 주장하지 않습니다.

## 고정 후보와 비교 조건

- Ridge α=1.0, 입력 `recipe + prev_mrr + state_ewm`, EWMA α=0.4.
- 교육용 artifact `EDU_RIDGE_ALPHA1_TRAIN_F1_F4_v1`의 정확한 파일 SHA256:
  `2cd0fb5dd200b93f775de59e68cfa7b65d9b3fdad1fb4c9ffb319242946154f1`.
- 신규 fit·refit·튜닝·후보 선택은 0회. Recipe Mean도 fold 1~4의 평균으로 고정.
- 주 지표 MAE. 보조 지표 RMSE, 평균 부호 오차. 전체와 A456/B456별로 보고.
- Persistence·EWMA·Recipe Mean은 Ridge와 동일한 이력 가용 행에서 비교.
- 예측 이력이 없는 행은 중앙값으로 채우지 않고 제외 수와 전체 계획 행 대비
  coverage를 보고. 한 recipe도 채점할 수 없으면 충분한 검증으로 표시하지 않음.
- 물리 단위·압력 보정·연마 시간 검증은 이 성능 평가의 대상이 아님.

기존 MAE 2.690006은 개발 fold마다 이전 fold에서 적합한 모델들의 합계입니다.
새 검증은 **저장된 fold 1~4 모델 한 개**를 사용합니다. 서로 다른 평가 집단의
MAE 차이를 그대로 개선율이라고 보고하지 않습니다. 새 집단에서는 같은 행의
baseline 대비 차이를 비교할 수 있습니다. 목표 허용 오차가 정해지지 않았으므로
채점 성공을 제품 성능 기준 통과로 해석하지 않습니다.

## 필요한 새 자료와 수집 계획

이 절차는 **평가 계획을 고정한 뒤 수집하는 미래 cohort**를 대상으로 합니다.
수집 담당자는 모델 학습·선택에 사용하지 않은 새 collection임을 확인하고,
수집 출처·실제 시각 기록의 근거·기존 target scale과의 대응 근거를 계획에
작성해야 합니다. 숫자/ID 검사만으로 출처 주장의 진위를 증명할 수는 없습니다.
MRR 단위가 다른 장비의 숫자를 PHM raw label과 그대로 비교하면 안 됩니다.

`examples/independent-plan.template.json`의 모든 placeholder를 실제 값으로
교체하세요. `evaluation_start < evaluation_end <= label_deadline`을 미리
정하고, protocol freeze는 evaluation_start보다 앞서야 합니다.
collection·기간·라벨 마감은 결과를 보고 변경하지 않습니다.

입력 CSV는 UTF-8이며 헤더와 다음 값이 필요합니다. 두 파일의 동일 웨이퍼
메타데이터는 정확히 일치해야 합니다. 시각은 timezone을 포함한 ISO8601입니다.
합성 ordinal 시각이나 센서 시각을 측정 완료 시각으로 대신 사용하지 않습니다.

| 파일 | 필수 열 |
|---|---|
| schedule.csv | `wafer_id,source_wafer_id,source_group_id,recipe,wafer_started_at` |
| measurements.csv | schedule의 5열 + `measurement_completed_at,mrr` |

`wafer_id`는 stage를 포함하는 실행 고유 ID이고, `source_wafer_id`는 A/B 실행을
묶는 원 웨이퍼의 안정된 ID입니다. 파일·split에 따라 원 ID를 다시 붙이지
않습니다. `source_group_id`에는 원 수집 그룹/lot의 동일한 ID를 기록합니다.
PHM 그룹 ID의 `prior/`, `test/`, `validation/` prefix도 보존합니다.
알려진 웨이퍼 또는 그룹 하나라도 발견되면 cohort 전체를 거부합니다.
새 이름을 붙여 겹침을 숨기면 registry가 이를 자동 발견할 수 없습니다.

계획 기간에는 A456·B456 전체 투입을 schedule에 기록하고 모든 예정 행에
대응하는 측정 target을 라벨 마감까지 제공해야 합니다. 선택적으로 좋은
측정 행만 남기면 안 됩니다. 예측용 초기 이력이 필요하면 protocol 고정 이후,
evaluation_start 이전에 수집한 별도 warmup 측정을 measurements에 포함합니다.
warmup은 평가 점수에서 제외합니다. 실제 측정 로그를 빠뜨리지 않아야 합니다.

이 구현은 기본 관측 운영 조건 한 개를 평가합니다. 1/5/10장 cadence를 새 최종
자료에서 탐색해 모델을 고르는 절차가 아닙니다. 완전한 target이 없는 계획,
기간 중 미계획 웨이퍼, 다른 target scale, A123은 별도 계획이 필요합니다.

## 실행 순서

표준 라이브러리만 사용하며 저장소 루트에서 Python 3.10 이상으로 실행합니다.
아래 `C:/new-cmp/...`는 실제 수집 계획·데이터 위치로 바꿔야 하는 예시입니다.
기존 model JSON의 provenance를 독립 시험 완료 상태로 바꾸지 않습니다.

1. 측정 자료를 읽기 **전에** 새 수집 계획을 고정합니다. 기존 output은 덮어쓰지 않습니다.

```powershell
python -m src.validation.independent freeze --artifact artifacts/education-ridge-v1/model.json --sha256 2cd0fb5dd200b93f775de59e68cfa7b65d9b3fdad1fb4c9ffb319242946154f1 --registry verification/independent-final-v1/known-data-registry.json --plan C:/new-cmp/plan.json --output results/independent-final-collection-01
```

2. 수집과 label_deadline 이후, 실제 측정 완료 시각으로 replay하고 예측을 seal합니다.

```powershell
python -m src.validation.independent predict --run results/independent-final-collection-01 --schedule C:/new-cmp/schedule.csv --measurements C:/new-cmp/measurements.csv
```

batch ledger 파일에는 평가 target도 들어 있습니다. **파일의 정답을 읽지 않았다는
blind 평가 주장은 하지 않습니다.** 각 현재 웨이퍼의 예측 입력에는 같은 recipe에서
현재 투입 시각 **직전까지 측정이 완료된** 과거 웨이퍼만 들어갑니다. 완료 시각이
투입 시각과 같거나 더 늦으면 사용하지 않습니다. 현재 target은 직접 입력하지 않고,
계수·scaler를 갱신하지도 않습니다. 예측은 실제 simulator core를 거칩니다.
관측 target을 후속 예측 이력에 쓰는 것은 사전 고정된 online state 갱신입니다.

3. 예측 seal과 입력 파일 SHA256을 확인한 다음, 별도 명령으로 한 번 채점합니다.

```powershell
python -m src.validation.independent score --run results/independent-final-collection-01 --schedule C:/new-cmp/schedule.csv --measurements C:/new-cmp/measurements.csv
```

`metrics.json`에 지표·coverage·제외 수·수집 근거·제한을 기록합니다.
output에 시작 표식을 독점 생성하므로 중복 실행/채점을 거부하고, 중단/실패 기록도
자동 삭제하지 않습니다. 파일 오류를 고치려고 기존 평가를 지우고 다시 시작하면
독립성·노출 이력을 별도로 검토해야 합니다. SHA256은 변경 감지 기록이며 악의적인
증거 전체 재작성까지 막는 보안 장치는 아닙니다.

원 target·schedule·measurement·개별 예측은 Git에 올리지 않습니다. 위 results 경로는
기존 `.gitignore`로 제외됩니다. 검증 후 수집 담당자의 공유 허용 범위에서
프로토콜·seal·집계만 별도 verification 경로에 기록하세요.

## 이번에 실행한 검증

신규 검증 테스트 **33 passed**: 노출 감사 출처·변경 감지, 현재/미래 target 변경에 대한 앞선 예측 불변,
실제 완료 후 후속 이력 갱신, 동일 시각 제외, source ID alias 중복, 기존
웨이퍼/그룹 겹침, NaN·잘못된 시각·누락 target·기간/마감 오류 거부,
seal 변조·재채점 거부, 이력 부재 coverage, ML/학습 import 부재를 확인했습니다.
**합성 fixture로 소프트웨어만 검사한 것이며 CMP 독립 성능 수치가 아닙니다.**
기존 HTTP·core·artifact 테스트를 포함한 전체 검증은 **267 passed**입니다.

노출 감사는 기존 완료 기록과 manifest의 SHA256을 대조하고 외부 라벨 값을
새로 읽거나 기존 외부 평가를 다시 채점하지 않았습니다. 실제 새 수집 자료와
출처 근거가 확보되기 전까지 independent_final_performance는 null입니다.
