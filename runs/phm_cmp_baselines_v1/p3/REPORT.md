# P3 baseline 결과

[Assessment of Physics-Based and Data-Driven Models for Material Removal Rate Prediction in Chemical Mechanical Polishing](https://www.atlantis-press.com/proceedings/iceea-18/25894228) (2018)

**명시 조건 구현 + 미기재 조건을 공개한 부분 재현. 원문 수치의 완전 재현이 아니다.**

실행: `evaluate`. 모델 2종; 고정 seed 20260917. evaluate는 기존 학습 모델을 다시 로딩한 결과이며 재학습을 의미하지 않는다.

모든 baseline을 유지하며 Test 점수로 다시 선정하지 않는다. 기존 Test를 사용하므로 새 독립 평가가 아니다.

원문 방법의 대표 비교 대상: P3_RF_CPP. 이 목록은 성능 순위가 아니다.

## official

표본 수: {'train': 1977, 'validation': 424, 'test': 424}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P3_RF | 8.5132 | 9.4774 | 3.0785 | 2.3208 | 0.9892 |
| P3_RF_CPP | 7.8327 | 8.6851 | 2.9470 | 2.1932 | 0.9901 |

## grouped

표본 수: {'train': 1177, 'validation': 297, 'test': 296}

| 모델 | Validation MSE | Test MSE | Test RMSE | Test MAE | Test R² |
|---|---:|---:|---:|---:|---:|
| P3_RF | 50.0065 | 28.5758 | 5.3456 | 4.0824 | 0.9632 |
| P3_RF_CPP | 50.0065 | 28.5758 | 5.3456 | 4.0824 | 0.9632 |

## 실행 기록

- [고정 설정](baseline.json), [원문 조건과 가정](PROTOCOL.md), [실행 프로토콜](protocol.json)
- [저장 모델 경로·SHA-256](models.json), [전체·Stage별 지표](metrics.csv)
- [평가 전 예측 기록](evaluation_seal.json), [재로딩 검증](verification.json)
- 저장 모델 재로딩 최대 예측 차이: 8.52651282912e-14
- P2/P3에도 P1의 네 극단 Train 표본 제외를 적용했다. 원 논문의 모든 조건과 같은 것은 아니다.
- official 분할에는 서로 다른 Stage에서 Train과 같은 wafer가 있다. grouped는 wafer/file 연결 그룹을 분리한다.
- 이 baseline과 기존 Physics+ML 후보 전체를 공통 조건으로 재학습한 최종 비교는 별도 작업이다.
