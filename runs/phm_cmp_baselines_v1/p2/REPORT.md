# P2 baseline 결과

[Enhanced Virtual Metrology on Chemical Mechanical Planarization Process using an Integrated Model and Data-Driven Approach](https://papers.phmsociety.org/index.php/ijphm/article/view/2641) (2017)

**명시 조건 구현 + 미기재 조건을 공개한 부분 재현. 원문 수치의 완전 재현이 아니다.**

실행: `evaluate`. 모델 6종; 고정 seed 20260917. evaluate는 기존 학습 모델을 다시 로딩한 결과이며 재학습을 의미하지 않는다.

모든 baseline을 유지하며 Test 점수로 다시 선정하지 않는다. 기존 Test를 사용하므로 새 독립 평가가 아니다.

원문 방법의 대표 비교 대상: P2_Integrated. 이 목록은 성능 순위가 아니다.

## official

표본 수: {'train': 1977, 'validation': 424, 'test': 424}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P2_Persistent | 15.8617 | 15.9013 | 3.9876 | 3.0126 | 0.9818 |
| P2_KNN | 15.4244 | 16.4924 | 4.0611 | 3.0802 | 0.9811 |
| P2_LR | 367.8588 | 512.7747 | 22.6445 | 3.5215 | 0.4132 |
| P2_SVR | 10.2629 | 10.7701 | 3.2818 | 2.4062 | 0.9877 |
| P2_Bagging | 8.0021 | 8.0425 | 2.8359 | 2.0919 | 0.9908 |
| P2_Integrated | 7.9317 | 8.0058 | 2.8295 | 2.0957 | 0.9908 |

## grouped

표본 수: {'train': 1177, 'validation': 297, 'test': 296}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P2_Persistent | 62.0848 | 40.4538 | 6.3603 | 5.2723 | 0.9479 |
| P2_KNN | 71.1698 | 33.4123 | 5.7803 | 4.5532 | 0.9570 |
| P2_LR | 33.3632 | 21.7463 | 4.6633 | 3.6589 | 0.9720 |
| P2_SVR | 46.9725 | 20.5769 | 4.5362 | 3.6277 | 0.9735 |
| P2_Bagging | 36.1786 | 23.2324 | 4.8200 | 3.5316 | 0.9701 |
| P2_Integrated | 35.7392 | 17.4973 | 4.1830 | 3.1882 | 0.9775 |

## 실행 기록

- [고정 설정](baseline.json), [원문 조건과 가정](PROTOCOL.md), [실행 프로토콜](protocol.json)
- [저장 모델 경로·SHA-256](models.json), [전체·Stage별 지표](metrics.csv)
- [평가 전 예측 기록](evaluation_seal.json), [재로딩 검증](verification.json)
- 저장 모델 재로딩 최대 예측 차이: 8.52651282912e-14
- P2/P3에도 P1의 네 극단 Train 표본 제외를 적용했다. 원 논문의 모든 조건과 같은 것은 아니다.
- official 분할에는 서로 다른 Stage에서 Train과 같은 wafer가 있다. grouped는 wafer/file 연결 그룹을 분리한다.
- 이 baseline과 기존 Physics+ML 후보 전체를 공통 조건으로 재학습한 최종 비교는 별도 작업이다.
