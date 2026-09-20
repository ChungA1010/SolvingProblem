# 세 논문 모델별 발표 성능과 현재 구현 비교

2026-09-20 기준 저장된 결과를 비교했습니다. 새 학습이나 Test 기반 모델 재선택은 하지 않았습니다. 논문 1은 **Stage별 Test RMSE**, 논문 2·3은 **전체 Test MSE**입니다. 모두 낮을수록 좋습니다. 변화율 = `(우리 값 / 논문 값 - 1) × 100`이며 양수는 오차 증가, 음수는 감소입니다. 이는 정확도나 MAPE 자체가 아닙니다.

핵심: **논문 1은 Stage B에서 5개 중 4개 모델의 RMSE가 발표값보다 낮지만 Stage A는 모두 높습니다. 논문 2 통합 모델은 7.07 대 7.0743으로 수치가 매우 가깝습니다. 논문 3은 보정 RF와 GA 보완 후보 모두 발표 MSE 7.4에 도달하지 못했습니다.** 이는 수치 비교이며 완전 재현이나 우월성의 입증은 아닙니다.

## 논문 1: Li, Wu, Yu (2019), Tables 7/8

현재 재현 값은 completion v3에서 선택한 특징으로 학습한 저장 모델(seed 20260917)의 Test 결과입니다. 논문은 20회 반복 실험을 설명하지만, 여기의 우리 값은 20회 Test 평균이 아닙니다. v3의 20회 반복 표는 Validation 결과이므로 Test 표에 혼합하지 않았습니다. v2의 고정 Appendix35 결과도 표시해 재현 단계가 바뀐 것을 확인할 수 있게 했습니다.

| stage | model | paper_value | previous_v2 | current_reproduction | relative_error_change_pct |
| --- | --- | --- | --- | --- | --- |
| A | P1_GBT | 6.5520 | 7.5143 | 7.5481 | 15.2035 |
| A | P1_RF | 5.3950 | 7.8929 | 7.7881 | 44.3578 |
| A | P1_ERT | 7.0480 | 9.2345 | 8.2023 | 16.3781 |
| A | P1_CART_Stack | 5.0650 | 9.1721 | 7.5422 | 48.9083 |
| A | P1_ELM_Stack | 4.7950 | 8.9624 | 7.8971 | 64.6947 |
| B | P1_GBT | 4.7810 | 4.8653 | 4.2400 | -11.3150 |
| B | P1_RF | 4.5980 | 4.6548 | 4.3383 | -5.6473 |
| B | P1_ERT | 4.7920 | 4.6664 | 4.5505 | -5.0402 |
| B | P1_CART_Stack | 4.5000 | 5.0127 | 4.5792 | 1.7590 |
| B | P1_ELM_Stack | 4.4850 | 4.5035 | 4.2687 | -4.8217 |

GBT=Gradient Boosted Trees, RF=Random Forest, ERT=Extremely Randomized Trees입니다. CART/ELM은 세 기본 모델을 결합하는 stacking입니다. Stage B의 GBT 4.2400이 이 다섯 구현 중 가장 낮고, Stage A는 CART stacking 7.5422가 가장 낮습니다. 논문에서는 두 Stage 모두 ELM stacking이 가장 낮았습니다. 관측한 Test 순위이며 새로운 모델 선택 규칙으로 사용하지 않았습니다.

P1의 R²·RE와 S-score 원값도 [전체 비교 CSV](paper_model_comparison.csv)에 보존했습니다. S-score는 원문의 식과 표 수치 해석에 불일치가 있어 상대 변화율이나 우월 순위를 계산하지 않았습니다. RMSE에서 낮다고 모든 지표에서도 우수하다는 뜻은 아닙니다.

## 논문 2: Di, Jia, Lee (2017), Table 5

MSE 비교입니다. 현재 값은 동일한 1,977개 학습 표본의 `clean_ordinary` 대조군입니다. 추가 OLS 절단을 제거한 일반 LR이며, 통합 수치는 기존 `clean_stable`과 사실상 같습니다. 기존 이력 해석에는 query보다 늦은 Train 이웃도 허용되므로 온라인 완료 이력 모델과 동일한 조건이 아닙니다.

| model | paper_value | current_reproduction | relative_error_change_pct | status |
| --- | --- | --- | --- | --- |
| P2_Integrated | 7.0700 | 7.0743 | 0.0610 | evaluated |
| P2_Persistent | 8.2300 | 12.9890 | 57.8254 | evaluated |
| P2_KNN | 9.6000 | 11.4710 | 19.4898 | evaluated |
| P2_SVR | 7.4400 | 9.0810 | 22.0563 | evaluated |
| P2_LR | 7.3200 | 351.1079 | 4696.5559 | evaluated |
| P2_Bagging | 7.2200 | 7.1702 | -0.6896 | evaluated |
| P2_DBN | 7.2900 | — | — | DBN not implemented |

통합 MSE는 발표값보다 약 0.061% 높아 반올림하면 거의 같고, Bagging은 약 0.690% 낮습니다. 반면 LR은 약 47.97배의 MSE로 가장 큰 재현 격차를 보입니다. LR의 통합 가중치가 매우 작을 수 있어 통합 결과가 가깝다는 사실만으로 구성 모델 모두를 재현했다고 말할 수 없습니다. DBN은 독립 baseline으로 구현하지 않았습니다.

## 논문 3: Li et al. (2018), Table II의 Real test

논문 표는 RMSE가 아니라 **MSE**입니다. 같은 1,977행의 고정 특징 재현과 GA 보완 실험을 모두 표시합니다. GA clean 후보의 rough/fine 최종 선택은 모두 RF지만, 원문과 같은 특징·파라미터·탐색 결과라고 주장하지 않습니다.

| model | arm | paper_mse | our_mse | relative_change_pct |
| --- | --- | --- | --- | --- |
| P3_RF | legacy_clean_1977 | 7.6000 | 9.4774 | 24.7031 |
| P3_RF_CPP | legacy_clean_1977 | 7.4000 | 8.6851 | 17.3662 |
| P3_RF | ga_clean_1977 | 7.6000 | 9.5047 | 25.0621 |
| P3_RF_CPP | ga_clean_1977 | 7.4000 | 9.0837 | 22.7532 |

논문의 Ensemble Neural Network는 Test MSE **8.2**입니다. v3에 NN 탐색 후보 구현은 있으나 이 모델만을 원문 조건으로 별도 학습해 공식 Test를 평가한 값은 없습니다. GA 내부 CV 점수를 8.2와 비교하거나 다른 선택 모델의 점수로 대체하지 않았습니다.

## 아직 별도 재현 성능이 없는 논문 1 비교 모델

원문 Tables 12/13에는 아래 비교 모델도 실려 있습니다. 다른 논문의 LR/SVR이나 프로젝트의 Preston-inspired proxy가 존재한다는 이유로 이 표의 특정 모델을 재현했다고 간주하지 않습니다. Luo-Dornfeld Stage B는 원문에서 NA입니다.

| paper | table | model | paper_test_rmse_A | paper_test_rmse_B | our_paper_matched_test_result |
| --- | --- | --- | --- | --- | --- |
| P1 | 12 | Preston equation | 42.3000 | 16.6000 | not available |
| P1 | 12 | Luo-Dornfeld | 7.6000 | — | not available |
| P1 | 13 | LR-stacking | 5.8630 | 4.7940 | not available |
| P1 | 13 | BLR-stacking | 6.5210 | 4.6670 | not available |
| P1 | 13 | AdaBoost-stacking | 5.3670 | 4.5480 | not available |
| P1 | 13 | SVR-stacking | 5.2090 | 4.5790 | not available |

## 이번 staged v4 모델들은 논문 수치와 어느 정도 다른가

아래는 이번 순차 개선 실험의 **다른 모델들**입니다. 논문 재현 모델의 업데이트 값으로 덮어쓰지 않습니다. 전체 Test 424건, Stage A 238건, B 186건에서 저장된 예측을 다시 집계했습니다. 125/73/33에는 이력이 포함되고 12에는 이력이 없으며, 모두 평가 시 이용하는 이력은 완료된 과거 Train 표본으로 제한됩니다. S4는 공정 조건별로 선택된 설정이며 3개 seed 예측의 평균입니다.

| model | all_mse | all_rmse | A_rmse | B_rmse |
| --- | --- | --- | --- | --- |
| full125_rf | 9.2156 | 3.0357 | 2.9957 | 3.0862 |
| full125_bag | 9.2844 | 3.0470 | 3.0093 | 3.0946 |
| primary73_rf | 9.0863 | 3.0143 | 2.9857 | 3.0506 |
| primary73_bag | 9.1836 | 3.0304 | 2.9955 | 3.0745 |
| compact12_rf | 14.6100 | 3.8223 | 3.6519 | 4.0298 |
| compact12_bag | 14.8635 | 3.8553 | 3.6692 | 4.0811 |
| compact33_rf | 9.6594 | 3.1080 | 3.0189 | 3.2184 |
| compact33_bag | 9.7432 | 3.1214 | 3.0285 | 3.2365 |
| S4_final | 12.3114 | 3.5088 | 3.6104 | 3.3742 |

S4 최종의 전체 Test MSE는 **12.3114**로 논문 2 통합 7.07 및 논문 3 보정 RF 7.4보다 수치상 큽니다. Stage별 RMSE는 **A 3.6104, B 3.3742**로 논문 1 ELM의 4.795/4.485보다 수치상 작습니다. 그러나 특징, 학습 표본 정제, 조건별 라우팅, 이력, 모델 구조, seed 집계가 달라 **어느 논문을 완전히 재현하거나 이겼다는 결론은 내리지 않습니다**. 모든 새 후보와 각 발표 benchmark의 참고용 수치 차이는 [별도 CSV](v4_vs_paper_reference_only.csv)에 있습니다.

기존 완료 이력 robust v2 대비 S4는 그룹 RMSE 6.57% 감소, 시간순 21.34% 증가, 기존 Test 17.29% 증가였습니다. 따라서 staged v4를 채택하지 않았으며 기존 모델을 유지합니다. [순차 실험 원 보고서](../phm_cmp_staged_v4/README.md).

## 비교의 한계와 확인 범위

- 원문의 미기재 설정, P1 FFT/중요도 관례, P2 이력 처리, P3 전체 후보·GA·phase/CPP 정의에 가정이 남아 있습니다.
- P3 원문의 총 2,929 runs와 현재 공식 데이터 2,829개 wafer-stage 표본 집계도 일치하지 않습니다. 발표 수치와 소수점까지 같은 결과를 보장하는 재현은 아닙니다.
- 공식 Test는 이전 실험에서도 확인했습니다. 비교를 위해 새로 학습하거나 최저 Test 모델을 다시 선정하지 않았습니다.
- 제공 PDF 세 파일의 SHA-256을 기존 원문 기록과 대조하고, P1 Tables 7/8/12/13, P2 Table 5, P3 Table II의 해당 페이지 전체를 시각적으로 확인했습니다.
- 논문 재현 비교의 42개 MSE/RMSE/R²/RE 값을 원시 예측에서 재계산했습니다. v4 표도 행별 예측으로 계산했고, 원래 metrics와 일치하는지 확인했습니다.

원문: [P1](https://doi.org/10.1115/1.4042051), [P2](https://papers.phmsociety.org/index.php/ijphm/article/view/2641), [P3](https://www.atlantis-press.com/proceedings/iceea-18/25894228). 제공 PDF 원본은 재배포하지 않습니다.
