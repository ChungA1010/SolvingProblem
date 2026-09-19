# P2: Enhanced Virtual Metrology baseline

Di, Jia, Lee (2017), [Enhanced Virtual Metrology on Chemical Mechanical Planarization Process using an Integrated Model and Data-Driven Approach](https://papers.phmsociety.org/index.php/ijphm/article/view/2641).

**추가 v3:** [일반 LR·안정화 LR·이력 정책·하이퍼파라미터 민감도](../../runs/phm_cmp_completion_v3/README.md)를 별도로 비교합니다. Train 안에서 설정을 선택하고, 20회 CV의 예측·특징 투표·결합 가중치를 보존합니다. 미기재 조건은 [프로토콜](../../docs/paper-completion-v3.md)에 명시합니다. 아래 v1 명령·저장 모델은 그대로 유지합니다.

**구축 완료: 6개 비교 모델의 이력 특징·조건별 학습·저장 모델·독립 재평가 명령.** 원문에 없는 설정을 가정한 부분 재현이다.

| 비교 모델 | 역할 |
|---|---|
| `P2_Persistent` | 사용 가능한 직전 학습 표본의 MRR |
| `P2_KNN` | 사용량이 가까운 학습 표본 10개의 MRR 평균 |
| `P2_LR` | 선택한 특징으로 학습한 OLS 선형회귀 |
| `P2_SVR` | RBF Support Vector Regression |
| `P2_Bagging` | Bagged regression trees |
| `P2_Integrated` | 다섯 모델의 CV 오차 기반 가중 결합 |

Cond1=A/456, Cond2=B/456, Cond3=A/123을 따로 학습한다. Table 3의 125개 후보는 과거 MRR 11개·이웃 MRR 10개·물리 통계 104개이다. 20회 Monte Carlo CV 안에서 이력 라이브러리·전처리·특징 선택을 다시 적합한다. 원문 Eq.5–6의 `e=mean(MSE)+3*std(MSE)`, `w=e^-3/sum(e^-3)`를 적용한다. 원문 주 지표는 MSE이며 RMSE·MAE·R²도 제공한다.

```powershell
python -m cmp_ml.baselines evaluate --paper p2 --output-dir runs/my_p2_recheck
python -m cmp_ml.baselines train --paper p2 --source-run runs/my_paper_inputs --output-dir runs/my_p2_baseline
```

[환경·데이터 준비](../README.md), [구축 설정](baseline.json), [학습 모델 재평가 결과](../../runs/phm_cmp_baselines_v1/p2/REPORT.md), [모델 경로](../../runs/phm_cmp_baselines_v1/p2/models.json).

학습 함수는 `cmp_ml.paper_models.fit_p2`, 이력 처리는 `HistoryFeatures`, 독립 실행기는 `cmp_ml.baselines`이다. 저장 모델은 과거/이웃 검색을 위한 학습 특징·MRR 라이브러리를 포함한다. Validation/Test 정답을 라이브러리에 추가하지 않는다. 과거 lag에는 query보다 먼저 종료된 동일 machine/condition의 학습 표본만 쓰며 이웃은 같은 wafer를 제외한다. 모든 이웃을 과거 시점으로 제한한 온라인 예측 실험은 아니다.

[원문 대응](../../docs/paper-reproduction.md)에 CV 20% 비율, 특징 선택 OR/투표 규칙, SVR·bagging 설정, 네 번째 flow 대응의 가정을 기록했다. DBN은 외부 비교값으로만 남겨 두었다. 공식 분할에서 LR의 큰 오차를 포함한 모든 결과를 보고하며 통합 모델만 골라 전체가 우수하다고 주장하지 않는다.
