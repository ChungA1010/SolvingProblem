# P1: Decision Tree-Based Ensemble Learning baseline

Li, Wu, Yu (2019), [Prediction of Material Removal Rate for Chemical Mechanical Planarization Using Decision Tree-Based Ensemble Learning](https://doi.org/10.1115/1.4042051).

**추가 v3:** 기존 고정 35개 baseline과 별도로 [85개 후보에서 RF 중요도·특징 수를 선택하는 실험](../../runs/phm_cmp_completion_v3/README.md)을 제공합니다. 두 주파수 정의, 6개 특징 수, Stage별 세 기본 모델을 20회 비교하며 가정은 [프로토콜](../../docs/paper-completion-v3.md)에 명시합니다. 아래 v1 명령·저장 모델은 그대로 유지합니다.

**구축 완료: 5개 비교 모델의 특징 처리·학습·저장 모델·독립 재평가 명령.** 원문에 없는 설정을 가정한 부분 재현이다.

| 비교 모델 | 역할 |
|---|---|
| `P1_RF` | 100-tree Random Forest |
| `P1_GBT` | 100-tree Gradient Boosting, 최대 30 leaves |
| `P1_ERT` | 100-tree Extra Trees |
| `P1_CART_Stack` | RF/GBT/ERT의 OOF 예측을 결합하는 CART |
| `P1_ELM_Stack` | 같은 OOF 예측을 결합하는 ELM |

Stage A/B를 따로 학습한다. Appendix F1–F35를 사용하며 seed 20260917부터 20회 반복한다. 저장 모델은 미리 고정한 첫 번째 seed이고 반복 평균과 구분한다. 원문 비교 지표는 Stage별 RMSE·R²·RE·S-score이며 공통 비교용 MSE·MAE도 함께 저장한다.

```powershell
python -m cmp_ml.baselines evaluate --paper p1 --output-dir runs/my_p1_recheck
python -m cmp_ml.baselines train --paper p1 --source-run runs/my_paper_inputs --output-dir runs/my_p1_baseline
```

[환경·데이터 준비](../README.md), [구축 설정](baseline.json), [학습 모델 재평가 결과](../../runs/phm_cmp_baselines_v1/p1/REPORT.md), [모델 경로](../../runs/phm_cmp_baselines_v1/p1/models.json).

학습 함수는 `cmp_ml.paper_models.fit_p1`, 특징은 `cmp_ml.paper_features.P1_COLUMNS`, 독립 실행기는 `cmp_ml.baselines`이다. [전체 원문 대응](../../docs/paper-reproduction.md)에 5-fold CV, ELM 50 sigmoid nodes, CART leaf size, GBT learning rate 등의 가정을 기록했다. 85→35 특징 탐색과 50→800 tree 민감도 탐색은 구현하지 않았다. R²는 원문 표기 불일치 때문에 표준 정의를 사용하며 S-score 두 해석은 원문 집계와 동일하다고 주장하지 않는다.
