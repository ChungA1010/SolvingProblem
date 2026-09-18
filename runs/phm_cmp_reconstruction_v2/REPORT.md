# 논문별 원래 조건 차이 검증 — v2

**원문 조건의 완전 재현이 아닌, 근거가 있는 조건 수정과 미기재 설정의 제한된 검증 실험이다.**

공식 Train 1,981 / Validation 424 / Test 424를 사용했다. P1은 명시된 네 극단 Train 표본을 제외했다. P2/P3는 포함·제외 대조군을 비교했다.

설정은 Validation MSE로 고르고 모든 선택을 저장한 뒤 Test 예측·평가를 했다. 이전에 본 Test를 다시 쓰는 개발 실험이며 새로운 독립 검증이 아니다. API/Unity 모델을 교체하지 않았다.

## Validation으로 선택한 조건

- P1 A/P1_CART_Stack: `oof_fold_average_cart_10_3`
- P1 A/P1_ELM_Stack: `table2_in_sample_elm_10_1e-08`
- P1 B/P1_CART_Stack: `oof_refit_cart_10_3`
- P1 B/P1_ELM_Stack: `oof_fold_average_elm_50_1e-05`
- P2: `stable_ols_clean`; Train 네 극단 표본 제외=True
- P3: `control`; Train 네 극단 표본 제외=True

## 같은 Test에서 이전 구현과 비교

MSE·RMSE는 낮을수록 좋다. 아래는 사전에 고정한 seed 0의 결과이며 반복 평균으로 대체하지 않는다.

| 모델 | v1 MSE | v2 MSE | v1 RMSE | v2 RMSE | MSE 감소율 |
|---|---:|---:|---:|---:|---:|
| P1_CART_Stack | 67.3350 | 58.2447 | 8.2058 | 7.6318 | 13.50% |
| P1_ELM_Stack | 46.7379 | 53.9847 | 6.8365 | 7.3474 | -15.51% |
| P1_ERT | 57.4199 | 57.4199 | 7.5776 | 7.5776 | 0.00% |
| P1_GBT | 42.0792 | 42.0792 | 6.4868 | 6.4868 | 0.00% |
| P1_RF | 44.4745 | 44.4745 | 6.6689 | 6.6689 | 0.00% |
| P2_Bagging | 8.0425 | 7.1702 | 2.8359 | 2.6777 | 10.85% |
| P2_Integrated | 8.0058 | 7.0743 | 2.8295 | 2.6598 | 11.64% |
| P2_KNN | 16.4924 | 11.4710 | 4.0611 | 3.3869 | 30.45% |
| P2_LR | 512.7747 | 351.1079 | 22.6445 | 18.7379 | 31.53% |
| P2_Persistent | 15.9013 | 12.9890 | 3.9876 | 3.6040 | 18.31% |
| P2_SVR | 10.7701 | 9.0810 | 3.2818 | 3.0135 | 15.68% |
| P3_RF | 9.4774 | 9.4774 | 3.0785 | 3.0785 | -0.00% |
| P3_RF_CPP | 8.6851 | 8.6851 | 2.9470 | 2.9470 | -0.00% |

## 원문 대표 지표와 대조

| 원문 비교 모델 | 지표 | 발표값 | v2 |
|---|---|---:|---:|
| P1_CART_Stack / A | RMSE | 5.065 | 9.1721 |
| P1_CART_Stack / B | RMSE | 4.500 | 5.0127 |
| P1_ELM_Stack / A | RMSE | 4.795 | 8.9624 |
| P1_ELM_Stack / B | RMSE | 4.485 | 4.5035 |
| P2_Integrated / all | MSE | 7.070 | 7.0743 |
| P3_RF_CPP / all | MSE | 7.400 | 8.6851 |

## 해석 범위와 근거

- [원문 근거·사전에 정한 가정과 후보](PROTOCOL.md), [모든 Validation 후보 점수](validation_trials.csv), [최종 선택](selection.json)
- [전체·Stage별 지표](metrics.csv), [v1과 전체 비교](comparison.csv), [P1 20회 반복](p1_repeat_summary.csv)
- [저장 모델과 학습 완료 기록](training_complete.json), [재로딩·기존 모델 보존](verification.json)
- Test가 나빠져도 설정을 다시 고르지 않는다. MSE 감소율은 오차 감소량이며 예측 정확도 %가 아니다.
- P1 Table 2의 in-sample 해석과 본문의 OOF 해석을 구분했다. ELM/CART 설정 후보는 저자의 원래 설정을 확인한 값이 아니다.
- P2의 start 기반 lag는 이전에 시작했지만 아직 완료하지 않은 학습 run의 실측값을 사용할 수 있는 사후 분석 가정이다. 실시간 서비스의 측정 가능성을 검증하지 않았다.
- P2 SVD 절단 OLS는 수치 안정성 보완이며 원문 알고리즘과 완전히 같은 OLS 해를 보장하지 않는다.
- P3 CPP 수는 {'p3_cpp': 1014, 'native_cpp_primary_end': 1240, 'native_cpp_start': 1291}, phase fallback=385건이다. 원문의 2,929 runs/1,267 CPP와 일치를 강제로 맞추지 않았다.
- 전체 GA/85-feature 검색·DBN/신경망·저자 코드 복원은 이번 범위에 포함하지 않았다. 같은 연구의 다음 실험으로 독립성이 회복되지는 않는다.
