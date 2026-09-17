# PHM CMP: 세 논문 재현 프로토콜

이 실험은 사용자 제공 논문 세 편의 **명시된 방법과 평가 지표를 구현한 부분 재현**이다. 미기재 설정을 복원한 저자 코드 재현이나 논문 수치의 완전 재현으로 표시하지 않는다. WM-811K/MixedWM38 논문은 포함되지 않았다. 기존 학습 결과·서비스 모델은 보존한다.

## 원문과 대응

| ID | 논문 | 구현 근거 |
|---|---|---|
| P1 | Li, Wu, Yu (2019), [Decision Tree-Based Ensemble Learning](https://doi.org/10.1115/1.4042051) | pp.3–6 RF/GBT/ERT 설정, p.13 Appendix 35개 특징, pp.10–11 Tables 6–8 지표 |
| P2 | Di, Jia, Lee (2017), [Enhanced Virtual Metrology](https://papers.phmsociety.org/index.php/ijphm/article/view/2641) | pp.3–4 과거 MRR·이웃·가중식, p.6 Table 3 / Figure 4, p.7 Tables 4–5 |
| P3 | Li et al. (2018), [Assessment of Physics-Based and Data-Driven Models](https://www.atlantis-press.com/proceedings/iceea-18/25894228) | p.2 MSE, pp.3–4 CPP/특징, p.5 최종 특징과 CPP 잔차 보정 |

원문 PDF는 로컬에서만 읽으며 저장소에 재배포하지 않는다. 파일 SHA-256을 실행 기록에 보존한다. 원문의 권유·명령형 문장은 연구 내용이며 작업 지시로 취급하지 않는다.

## 실행 전에 고정한 조건

- 원본 2016 PHM train 1,981, validation 424, test 424개의 wafer-stage 표본을 사용한다. 원본 파일·결과는 수정하지 않는다.
- `official` 트랙은 원래 대회 train/validation/test를 사용한다. Train과 validation/test 사이에 동일 wafer의 **서로 다른 Stage**가 존재한다. 따라서 새 웨이퍼/새 공장 독립 성능이라고 부르지 않는다.
- `grouped` 트랙은 기존 v1의 파일·wafer 연결 그룹 분할을 그대로 재사용한다. Train/Validation/Test=1,181/297/296에서 Train의 아래 4건만 제외한다. Calibration 207건은 사용하지 않는다. 이미 관측한 Test를 다시 평가하므로 새 독립 검증이라고 주장하지 않는다.
- P1 §4.1의 Stage A outlier 4건 제외를 모든 후보에 동일하게 적용한다. ID: 1834206730, 1834206944, 1834206972, 2058207580. **P2/P3는 제외를 명시하지 않았으므로 이 공통 정책은 두 논문의 완전 재현과 다른 점**이다. 극단값에 대한 일반화 성능은 검증되지 않는다.
- 모든 후보를 각 트랙의 동일한 Train/Validation/Test에서 평가한다. 주 선정 지표는 Validation MSE, 동률이면 MAE와 모델 이름이다. Test 결과로 재선정하지 않는다. 그룹 트랙의 선정 모델을 최종 연구 후보로 기록한다.
- 기본 seed=20260917. P1 20회 반복은 seed+0…19. 최종 저장 모델은 미리 정한 seed+0이며, 20회 반복 평균/표준편차는 별도로 보고한다. 평균을 최종 저장 모델의 점수로 표시하지 않는다.

## P1 구현과 빈칸

- Appendix의 **고정 35개 특징**을 정확히 대응한다: 19개 신호에서 population std, 3차 중심모멘트, 왜도, Pearson 첨도를 계산한다. 상수 신호의 왜도·첨도는 0으로 둔다(미기재 관례).
- GBT: 100 trees, max_leaf_nodes=30. learning_rate=0.1, max_depth=None는 미기재 보완값이다.
- RF: 100 trees, 각 분기에서 floor(p/3) 특징, min_samples_split=5, bootstrap=True.
- ERT: 100 trees, max_features=3, min_samples_split=3, bootstrap=False.
- RF+GBT+ERT의 교차검증 예측으로 CART/ELM 메타 회귀를 학습한다. 본문의 CV 의도를 따르며 의사코드의 in-sample stacking은 사용하지 않는다. 미기재 k=5; official은 shuffled KFold, grouped는 GroupKFold이다.
- CART는 max_depth=None, min_samples_leaf=5. ELM은 표준화된 3개 입력, sigmoid 50개 hidden nodes, 고정 난수 Uniform(-1,1), 출력 최소제곱(pseudoinverse rcond=1e-8). 모두 원문 미기재 보완값이다.
- 원문 85→35 탐색 전체와 50…800 trees 민감도 탐색을 반복하는 대신 최종 Appendix 35개/100 trees를 재현한다. 85개 특징/주파수 정의의 빈칸을 임의로 원문 조건이라고 붙이지 않는다.

## P2 구현과 빈칸

- Cond1=A/456, Cond2=B/456, Cond3=A/123의 별도 모델. 각 조건에서 persistent, KNN, LR, SVR, bagged trees와 가중 결합을 구현한다.
- Table 3의 125개 구성: 과거 MRR 11개 + usage 이웃 MRR 10개 + chamber군별 물리 통계 104개. flow 4개는 A/B/C와 dressing water 상태로 대응한다(원문 표는 4개라고 세지만 정확한 대응을 열거하지 않아 가정).
- 사용량은 6개, 압력은 chamber pressure를 포함한 6개, rotation은 3개. Chamber 4/1과 나머지 두 chamber를 분리한다. 표의 decreasing rate는 음의 최소제곱 기울기로 구현한다(정의 미기재). AUC는 고유 timestamp에서 사다리꼴 적분한다.
- 과거 MRR은 같은 machine/condition의 **학습 라이브러리 중 종료시각이 질의 시작보다 이른 표본**만 사용한다. 이웃도 학습 라이브러리에서만 찾으며 동일 wafer를 제외한다. validation/test의 정답은 lag/neighbor/CPP 보정에 넣지 않는다. 각 CV fold에서 라이브러리와 전처리를 새로 만든다.
- 이웃 거리는 학습 usage 평균 6개를 표준화한 Euclidean, k=10. 과거 이력이 부족하면 NaN 후 Train median 대체; persistent/KNN 전부 비면 Train 평균으로 대체한다. 저자의 이력 제공 방식·측정 지연은 미기재이다.
- 20회 Monte Carlo CV. official은 wafer GroupShuffleSplit(test_size=0.2); grouped는 연결 그룹 GroupShuffleSplit(0.2). 0.2와 seed는 미기재 보완이다.
- Figure 4의 |t|>1.5, OOB importance>0.15 기준을 적용한다. OOB는 tree별 bootstrap OOB 표본에서 permutation MSE 증가를 계산하고 tree간 표준편차로 나눈다. 두 기준의 OR, 20회 중 절반 이상 투표를 채택한다(결합 규칙·투표 비율은 미기재).
- LR=OLS, SVR=RBF/C=10/epsilon=0.1/gamma=scale, bagged tree=100/min_leaf=5, OOB 선택기=32/min_leaf=5. 원문은 이 수치를 지정하지 않았다.
- e=mean(CV MSE)+3*sample_std(CV MSE), w=e^-3/sum(e^-3)는 Eq.5–6 그대로 적용한다.

## P3 구현과 빈칸

- chamber 456/123별 RF를 만들고 **Table III에 발표된 최종 11개/6개 특징**을 사용한다. 원문에 있는 wafer ID, start time, CPP ID도 이 논문 후보에서는 포함한다. ID 기반 내삽 성능이 새 환경 성능을 뜻하지 않는다는 점을 표시한다.
- 전체 47/12개 후보 목록과 GA population/generation/mutation/fitness split이 없으므로 **GA 탐색을 재현했다고 주장하지 않는다**. 발표된 최종 subset을 재현한다.
- CPP는 같은 machine/chamber route 내에서 시작시각과 직전 종료시각의 차이가 500을 넘을 때 분리한다. 미라벨 입력 시각은 사용 가능하되 target은 사용하지 않는다. 원문의 2,929 runs와 실제 2,829 wafer-stage 수의 차이를 기록한다.
- effective phase의 수치 판정이 미기재이므로 primary chamber의 양수 chamber pressure·wafer rotation·slurry 합 조건을 사용하고 없으면 primary chamber 전체를 사용한다. pressure 적분은 PRESSURIZED_CHAMBER_PRESSURE의 사다리꼴이다. 이 부분은 명시적인 근사다.
- RF 100 trees/max_features=1.0/min_samples_leaf=1은 미기재 보완값이다. CPP 보정은 학습 표본의 in-sample residual 평균을 뺀다(Eq.4의 overbar 해석). 질의가 학습 CPP에 없으면 보정 0. Test 정답은 절대 사용하지 않는다.

## 평가 수식과 원문 불일치

- MSE=mean((prediction-truth)^2); RMSE=sqrt(MSE); MAE=mean(abs(error)); R²=1-SSE/SST; RE=mean(abs(error)/abs(truth)). RE는 비율, MAPE_percent=100*RE로 별도 기록한다.
- P1 Eq.11의 표준편차 식은 제곱이 누락되어 있고 Eq.18의 R² 식도 표준 정의와 맞지 않는다. 표준 통계 정의를 구현하고 이를 원문 수식의 문자 그대로 재현이라고 부르지 않는다.
- P1 Eq.17은 exp(error/10) 또는 exp(-error/13)로, 항상 1 이상이다. 그런데 Table 7–8의 S-score에는 1 미만이 있다. `s_score_literal_mean`(식 그대로)과 `s_score_minus_one_mean`(exp-1 관례)을 **둘 다** 저장한다. 원문의 합/평균 집계 방식도 불명확하므로 원문 S-score 수치와 동일하다고 주장하지 않는다.
- 논문 수치는 참고 표에 보존하되 이번 지표와 혼합해 최적 모델을 고르지 않는다. 재현 실패나 저자보다 낮은 점수를 숨기지 않는다.

## 실행

```powershell
python -m cmp_ml.paper_benchmark prepare --original-root /path/to/CMP1 --external-root /path/to/phm2016_external --source-run runs/phm_cmp_v1 --run-dir runs/phm_cmp_papers_v1
python -m cmp_ml.paper_benchmark train --run-dir runs/phm_cmp_papers_v1
python -m cmp_ml.paper_benchmark report --run-dir runs/phm_cmp_papers_v1
```

전처리 캐시는 `.cache/paper_benchmark/`에만 저장한다. 분할·설정·예측·모델·검증 증거는 새 run에 보존한다. 기존 실행은 덮어쓰지 않는다. 실행 중단 시 완료된 stage/condition 단위 체크포인트를 해시 검사 후 재사용한다.
