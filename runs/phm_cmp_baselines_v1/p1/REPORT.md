# P1 baseline 결과

[Prediction of Material Removal Rate for Chemical Mechanical Planarization Using Decision Tree-Based Ensemble Learning](https://doi.org/10.1115/1.4042051) (2019)

**명시 조건 구현 + 미기재 조건을 공개한 부분 재현. 원문 수치의 완전 재현이 아니다.**

실행: `evaluate`. 모델 5종; 고정 seed 20260917. evaluate는 기존 학습 모델을 다시 로딩한 결과이며 재학습을 의미하지 않는다.

모든 baseline을 유지하며 Test 점수로 다시 선정하지 않는다. 기존 Test를 사용하므로 새 독립 평가가 아니다.

원문 방법의 대표 비교 대상: P1_CART_Stack, P1_ELM_Stack. 이 목록은 성능 순위가 아니다.

## official

표본 수: {'train': 1977, 'validation': 424, 'test': 424}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P1_RF | 81.6753 | 44.4745 | 6.6689 | 4.2084 | 0.9491 |
| P1_GBT | 73.4376 | 42.0792 | 6.4868 | 3.9751 | 0.9518 |
| P1_ERT | 78.7069 | 57.4199 | 7.5776 | 4.6148 | 0.9343 |
| P1_CART_Stack | 108.2612 | 67.3350 | 8.2058 | 4.9124 | 0.9229 |
| P1_ELM_Stack | 103.4607 | 46.7379 | 6.8365 | 4.0298 | 0.9465 |

## grouped

표본 수: {'train': 1177, 'validation': 297, 'test': 296}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P1_RF | 87.3731 | 49.1464 | 7.0105 | 4.7605 | 0.9367 |
| P1_GBT | 106.1493 | 129.5842 | 11.3835 | 5.4029 | 0.8332 |
| P1_ERT | 84.2605 | 41.0660 | 6.4083 | 4.3985 | 0.9471 |
| P1_CART_Stack | 73.2262 | 40.8162 | 6.3888 | 4.9417 | 0.9475 |
| P1_ELM_Stack | 172.3333 | 477.8832 | 21.8605 | 6.1401 | 0.3850 |

## 실행 기록

- [고정 설정](baseline.json), [원문 조건과 가정](PROTOCOL.md), [실행 프로토콜](protocol.json)
- [저장 모델 경로·SHA-256](models.json), [전체·Stage별 지표](metrics.csv)
- [평가 전 예측 기록](evaluation_seal.json), [재로딩 검증](verification.json)
- 저장 모델 재로딩 최대 예측 차이: 1.7462298274e-10
- P2/P3에도 P1의 네 극단 Train 표본 제외를 적용했다. 원 논문의 모든 조건과 같은 것은 아니다.
- official 분할에는 서로 다른 Stage에서 Train과 같은 wafer가 있다. grouped는 wafer/file 연결 그룹을 분리한다.
- 이 baseline과 기존 Physics+ML 후보 전체를 공통 조건으로 재학습한 최종 비교는 별도 작업이다.

P1 표는 seed 0 모델의 점수다. [20회 반복 통계](repeat_summary.csv)는 별도 결과이며 저장 모델의 성능으로 대체하지 않는다.
