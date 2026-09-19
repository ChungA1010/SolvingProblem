# P3: RF와 CPP 보정 baseline

Li et al. (2018), [Assessment of Physics-Based and Data-Driven Models for Material Removal Rate Prediction in Chemical Mechanical Polishing](https://www.atlantis-press.com/proceedings/iceea-18/25894228).

**추가 v3:** [실제 GA 탐색·연마 구간 민감도 실험](../../runs/phm_cmp_completion_v3/README.md)을 별도로 제공합니다. RF·신경망 앙상블 등을 포함해 모델 종류와 특징 mask를 탐색합니다. 원문에 전체 목록이 없는 rough 47개는 **명시한 45개 재구성 후보**로, fine은 12개로 구현합니다. [가정·탐색 설정](../../docs/paper-completion-v3.md)을 확인하세요. 아래 v1 최종 특징 baseline은 그대로 유지합니다.

**구축 완료: 2개 비교 모델의 최종 특징·경로별 학습·저장 모델·독립 재평가 명령.** 원문에 없는 설정과 물리 구간 근사를 포함한 부분 재현이다.

| 비교 모델 | 역할 |
|---|---|
| `P3_RF` | 원문 최종 특징 목록을 사용하는 Random Forest |
| `P3_RF_CPP` | RF 예측에서 해당 CPP의 학습 잔차 평균을 뺀 모델 |

chamber 456/123을 나누고 Table III의 최종 11개/6개 특징을 사용한다. CPP 보정은 학습 표본에서만 계산하며 처음 보는 CPP에는 보정 0을 사용한다. 원문 주 지표는 MSE이며 RMSE·MAE·R²도 제공한다.

```powershell
python -m cmp_ml.baselines evaluate --paper p3 --output-dir runs/my_p3_recheck
python -m cmp_ml.baselines train --paper p3 --source-run runs/my_paper_inputs --output-dir runs/my_p3_baseline
```

[환경·데이터 준비](../README.md), [구축 설정](baseline.json), [학습 모델 재평가 결과](../../runs/phm_cmp_baselines_v1/p3/REPORT.md), [모델 경로](../../runs/phm_cmp_baselines_v1/p3/models.json).

학습 함수는 `cmp_ml.paper_models.fit_p3`, 특징은 `P3_ROUGH`/`P3_FINE`, CPP 구성은 `assign_cpp`이다. 미라벨 전체 입력의 시간 문맥으로 CPP를 구성하므로 일반적인 신규 온라인 추론과 다르다. grouped holdout에는 해당 학습 CPP가 없어 RF와 RF_CPP의 점수가 같다.

[원문 대응](../../docs/paper-reproduction.md)에 RF 100 trees, ID 수치 인코딩, 유효 polishing 구간·압력 적분 근사와 CPP 개수 불일치를 기록했다. 전체 47/12개 후보·GA 탐색, 비교용 앙상블 NN, 별도로 보정한 물리식 예측 모델은 이 baseline 묶음에 포함하지 않는다.
