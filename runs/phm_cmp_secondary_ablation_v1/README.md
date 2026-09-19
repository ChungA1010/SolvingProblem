# 후속 챔버 특징 제외 비교 결과

**제한된 비교를 완료했다. 그룹과 시간순 평가에서 일관된 개선이 없어 기존 모델을 유지한다.**
Train 신호 검사에서 동시 기록 일치를 발견했지만, 그 특징을 일괄 제거한다고 시간순 예측까지 좋아지지는 않았다.
이번 결과는 52개 입력 제거와 그에 따른 특징 선택·모델 재학습·가중치 재계산의 결합 효과다.
동시 기록 현상이 성능 차이의 원인임을 증명하는 실험은 아니다.

## 핵심 결과

- 기존 공식 Test MSE: **7.0743 → 7.0317** (-0.60%).
- Train 그룹 검증 MSE: **36.4062 → 35.6296** (-2.13%).
- 시간순 검증 MSE: **32.4365 → 36.2000** (+11.60%).
- 기존 공식 Validation MSE: **6.8277 → 6.9603** (+1.94%).

MSE는 낮을수록 좋다. 괄호는 MSE의 상대 변화율이며, 정확도나 오차율 %가 아니다.
Test 점수 하나로 새 후보를 선택하지 않았다. API/Unity 및 기존 연구 baseline은 유지한다.

| evaluation | model | n | mse | rmse | mae | r2 |
|---|---|---|---|---|---|---|
| nested_oof | original | 1977 | 36.4062 | 6.0338 | 4.6279 | 0.9597 |
| nested_oof | primary_only | 1977 | 35.6296 | 5.9691 | 4.5952 | 0.9605 |
| temporal | original | 166 | 32.4365 | 5.6953 | 4.4573 | 0.9517 |
| temporal | primary_only | 166 | 36.2000 | 6.0166 | 4.7927 | 0.9461 |
| test | original | 424 | 7.0743 | 2.6598 | 1.9502 | 0.9919 |
| test | primary_only | 424 | 7.0317 | 2.6517 | 1.9297 | 0.9920 |
| validation | original | 424 | 6.8277 | 2.6130 | 1.9719 | 0.9917 |
| validation | primary_only | 424 | 6.9603 | 2.6382 | 1.9587 | 0.9915 |

`nested_oof`는 같은 파일/웨이퍼 연결 그룹 바깥 5fold의 총 1,977건이다.
시간순은 학습 1,551건, 이후 평가 166건, 경계 제외 260건이다. 공식 Validation/Test는 각 424건이다.
동일한 raw usage 이웃·prior-start lag를 사용하는 **논문 비교용 이력 조건**이다.
미래 Train 이웃을 허용하며 완료된 과거 전용 robust v2와 점수를 직접 순위 비교하지 않는다.
이미 여러 번 확인한 공식 Test를 재사용한 후속 개발 결과이며 새 독립 검증이 아니다.

## 무엇을 바꿨는가

| 항목 | 기존 original | primary_only |
|---|---|---|
| 입력 후보 | 125개 | 73개 |
| 주 챔버 통계 | 52개 | 같은 52개 |
| 후속 챔버 통계 | 52개 | 제외 |
| lag/neighbor 제거율 | 21개 | 같은 21개 |
| 특징 선택 | 20회 내부 CV 투표 | 같은 절차로 다시 선택 |
| 모델 설정 | 기존 LR/SVR/Bagging | 동일 |
| 통합 가중치 | 기존 CV 오차 기반 | 같은 식으로 새 CV 오차를 반영 |

Persistent와 KNN의 예측은 두 모델에서 같다. 주 챔버 사용량으로 찾는 이웃과 과거 이력 구성이 유지됐음을 확인했다.
후속 특징을 빼면서 달라진 선택 특징과 구성 모델 가중치는 [feature_counts.csv](feature_counts.csv), [component_weights.csv](component_weights.csv)에 있다.

| condition | arm | input_count | selected_count | primary_selected | secondary_selected |
|---|---|---|---|---|---|
| Cond1 | original | 125 | 91 | 38 | 33 |
| Cond1 | primary_only | 73 | 58 | 37 | 0 |
| Cond2 | original | 125 | 86 | 45 | 20 |
| Cond2 | primary_only | 73 | 66 | 47 | 0 |
| Cond3 | original | 125 | 54 | 17 | 20 |
| Cond3 | primary_only | 73 | 35 | 19 | 0 |

## 조건별 결과

Cond1=A/456, Cond2=B/456, Cond3=A/123이다.

| evaluation | value | model | n | mse | mae |
|---|---|---|---|---|---|
| nested_oof | Cond1 | original | 798 | 42.2981 | 4.9438 |
| nested_oof | Cond2 | original | 815 | 41.2592 | 5.1604 |
| nested_oof | Cond3 | original | 364 | 12.6232 | 2.7428 |
| nested_oof | Cond1 | primary_only | 798 | 41.6506 | 4.9116 |
| nested_oof | Cond2 | primary_only | 815 | 39.8785 | 5.0844 |
| nested_oof | Cond3 | primary_only | 364 | 12.9163 | 2.8063 |
| temporal | Cond1 | original | 74 | 10.5356 | 2.5284 |
| temporal | Cond2 | original | 67 | 52.1853 | 6.0984 |
| temporal | Cond3 | original | 25 | 44.3361 | 5.7683 |
| temporal | Cond1 | primary_only | 74 | 12.0116 | 2.7166 |
| temporal | Cond2 | primary_only | 67 | 57.3036 | 6.5037 |
| temporal | Cond3 | primary_only | 25 | 51.2403 | 6.3525 |
| test | Cond1 | original | 165 | 6.2085 | 1.8005 |
| test | Cond2 | original | 186 | 6.7884 | 1.9010 |
| test | Cond3 | original | 73 | 9.7598 | 2.4140 |
| test | Cond1 | primary_only | 165 | 6.0582 | 1.7834 |
| test | Cond2 | primary_only | 186 | 6.8231 | 1.8825 |
| test | Cond3 | primary_only | 73 | 9.7633 | 2.3805 |
| validation | Cond1 | original | 185 | 6.3880 | 1.8790 |
| validation | Cond2 | original | 172 | 7.3465 | 2.0509 |
| validation | Cond3 | original | 67 | 6.7099 | 2.0254 |
| validation | Cond1 | primary_only | 185 | 6.7971 | 1.8712 |
| validation | Cond2 | primary_only | 172 | 7.1100 | 2.0136 |
| validation | Cond3 | primary_only | 67 | 7.0262 | 2.0594 |

## 신호 일치 여부별 보조 분석

[Train 신호 검사](../phm_cmp_chamber_audit_v1/README.md)의 강한 일치 관찰 여부를 그대로 연결했다.
학습에 포함한 1,977건에서만 비교하고, 공식 Validation/Test에는 그 검사를 새로 수행하지 않았다.
미확인은 대응 상대 부재·짧은 구간·변화 부족 등을 포함하며 독립 신호라는 뜻이 아니다.
이 표는 기술적 부분집합 분석이며 조건 구성이나 공정 상태 차이를 통제한 인과 효과가 아니다.

| evaluation | model | strong_match_observed | n | mse | mae |
|---|---|---|---|---|---|
| nested_oof | original | False | 1240 | 33.8238 | 4.4264 |
| nested_oof | original | True | 737 | 40.7510 | 4.9667 |
| nested_oof | primary_only | False | 1240 | 33.2652 | 4.4008 |
| nested_oof | primary_only | True | 737 | 39.6076 | 4.9223 |
| temporal | original | False | 117 | 33.0903 | 4.4388 |
| temporal | original | True | 49 | 30.8752 | 4.5014 |
| temporal | primary_only | False | 117 | 38.4049 | 4.8990 |
| temporal | primary_only | True | 49 | 30.9354 | 4.5388 |

## 재검증과 한계

- 부모 학습 21개, 내부 CV 420개에서 학습/검증 ID 해시, wafer 분리, 특징 투표, 구성 모델 오차와 가중식을 확인했다.
- 내부 분할은 원형과 같은 **wafer 기준**이며 파일 그룹 중첩이 있다. 중첩 수를 각 fit_details JSON에 기록했다. 바깥 파일 그룹 검증 및 시간순 결과와 구분해야 한다.
- 저장 모델을 재로딩해 24개 평가 블록의 모든 구성 예측과 통합 예측을 대조했다. 최대 재현 차이는 8.53e-14이다.
- 정답 열·query 순서·secondary 값 변경 및 secondary 열 전체 제거에도 후보 예측이 불변임을 확인했다. 원래 통합 예측은 이전 결과와 같다.
- 전체 지표는 저장 예측으로 독립 재계산했다. 이전 산출물 950개의 해시를 보존했다.
- [paired_effects.csv](paired_effects.csv)의 2,000회 파일/웨이퍼 그룹 재표집 구간은 Train의 그룹·시간순 고정 예측에 대한 기술적 요약이다. 모델을 매번 재학습한 구간이나 독립 확인 검정이 아니다. 공식 Validation/Test 캐시에는 group_id가 없으므로 해당 재표집 구간은 계산하지 않고 사유를 명시했다. 개별 행을 독립 그룹으로 대신하지 않았다.

## 다음 판단

일괄 제거 후보로 모델을 교체하지 않는다. 다음 연구에서는 후속 신호를 현재 웨이퍼 연마와 **별도의 동시 장비 상태**로 표현하거나,
논문 2·3의 재시작/소모품 상태에 맞춘 이력 선택을 한 번에 하나씩 검증할 수 있다.
이번에 본 Test 점수를 기준으로 새 규칙을 계속 맞추지 않도록 별도 미래 기간의 검증이 필요하다.
이 추가 연구는 이번 고정 비교에 포함하지 않았다.

## 실행과 파일

```powershell
python -m cmp_ml.secondary_ablation prepare --run-dir runs/my_secondary_ablation
python -m cmp_ml.secondary_ablation train --run-dir runs/my_secondary_ablation
python -m cmp_ml.secondary_ablation evaluate --run-dir runs/my_secondary_ablation
python tools/verify_secondary_ablation.py --run-dir runs/my_secondary_ablation
```

원래 reconstruction v2 및 LR 진단의 입력/대조 모델 캐시가 필요하다. 기존 run은 덮어쓰지 않는다.

- [사전 계획](PROTOCOL.md), [봉인한 코드·입력·대조군 해시](protocol.json), [환경](environment.json)
- [전체 지표](metrics.csv), [대응 표본별 두 예측](paired_predictions.csv.gz), [그룹·시간순 예측](development_predictions.csv.gz)
- [공식 참고 평가 예측](reference_scored_predictions.csv.gz), [설정](configuration.json), [후보 모델·해시](training_complete.json)
- [독립 재검증](independent_verification.json), [채택 판단](decision.json), [파일 무결성](artifact_manifest.json)
