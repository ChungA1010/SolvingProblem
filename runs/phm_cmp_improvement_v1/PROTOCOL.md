# P2 제안 모델 개선 실험 v1: 사전 고정 계획

이 실험은 기존 P2 논문 baseline과 재현 v2를 보존한 **새 제안 모델 연구**다.
기존 Test MSE 7.0743은 이미 확인했다. 새 독립 데이터가 없으므로 개선의 근거를
학습 내부 중첩 그룹 교차검증, 시간순 진단, 기존 Validation/Test 참고 평가로 구분한다.
실험 결과로 API/Unity 모델을 자동 교체하지 않는다.

## 데이터와 평가

- 원래 대회 Train 1,981건 중 이전에 공개한 극단 제거율 4건을 제외한 1,977건을 개발에 사용한다.
  이 제외 정책을 새로 탐색하지 않으며 극단값 영역의 성능은 평가하지 못한다.
- 이전 v2 특징 캐시를 해시 검증한 뒤 Train만 별도 파일로 고정한다.
- 바깥 5분할 GroupKFold, 안쪽 3분할 GroupKFold. seed=20260918, shuffle=True.
  그룹은 동일 wafer 또는 원시 파일로 연결된 `group_id`이며 Stage 사이에도 웨이퍼가 겹치지 않는다.
- Cond1/2/3별로 독립 모델을 학습한다. 임퓨팅·스케일링·특징 선택·제거율 이력은
  해당 학습 fold만으로 적합한다. 바깥 fold의 모든 타깃은 모델·설정·가중치 선택에서 제외한다.
- 별도 시간순 진단: Train 시작 시각의 80% 분위수를 경계로, 그룹의 모든 공정 종료가
  경계 이전인 그룹만 학습하고 모든 공정 시작이 경계 이후인 그룹만 평가한다.
  경계를 가로지르는 그룹은 이 진단에서 제외한다. 원래 Train의 재사용 진단이며 새 Test가 아니다.
- 최종 모델은 원래 Train 전체에서 동일한 내부 선택 절차로 결정한다.
  모든 선택과 모델 해시를 봉인한 뒤 기존 Validation 및 Test를 참고용으로 평가한다.
  참고 점수를 본 후 재선정·튜닝·seed 선택하지 않는다.
- 주 지표 MSE, 보조 RMSE/MAE/R²/MAPE. 전체·Stage·조건·fold·이력 부족 여부를 보고한다.
  5분할 바깥 OOF가 선택 절차의 평가이며 내부 점수는 일반화 성능 주장이 아니다.

## 이력 정보 접근 조건: 두 실험을 분리

1. `retrospective`: 현재 v2와 동일한 raw usage 거리, 같은 장비의 이전 시작 11건,
   같은 조건의 학습 이웃 10건. 자기 웨이퍼 전체 제외. 이웃에는 미래 공정의 Train 제거율이
   포함될 수 있으므로 과거 데이터 복원용 비교이며 온라인 예측 성능으로 부르지 않는다.
2. `completed`: lag와 이웃 모두 **공정 종료 < 조회 공정 시작**인 Train 샘플로 제한한다.
   lag는 종료 역순, 같은 장비; 이웃은 같은 조건의 raw usage 거리. 자기 웨이퍼 제외.
   제거율 실측값이 공정 종료 즉시 확보된다는 가정이다. 실제 계측 지연 시각은 데이터에 없으며
   운용에 적용하려면 `label_available_at`을 확보해야 한다.

완료된 이력만 사용하는 그룹 CV도 모델 자체는 미래 시각의 학습 샘플을 포함할 수 있다.
완전한 시간 방향성을 검사하는 것은 별도의 시간순 진단이다. 평가 샘플의 정답은 이력에
순차 추가하지 않는다. 따라서 시간순 평가는 고정 학습 라이브러리의 배치 예측을 측정한다.

## 특징과 탐색 범위

- 기본 125개: 이전 P2의 21개 제거율 이력 + 104개 공정 통계.
- 기본 특징 선택은 내부 fold마다 기존 OOB/t 검정 규칙으로 적합한다.
  최종 재학습은 내부 3회 중 2회 이상 선택된 특징을 사용한다(없으면 1회 이상).
- 네 가지 view: 기본, 기본+물리 proxy 12개, 기본+이력 통계 10개, 기본+둘 다.
  추가 특징은 모두 유지하여 기본 선택 마스크와 교란되지 않게 한다.
- 물리 proxy: primary/secondary 각각 압력×회전속도 합, center 압력×회전속도 합,
  각각×시간, 회전속도 차이, center/chamber 압력 비. 통계 평균들의 곱으로,
  실제 접촉 속도·동시 시계열 적분을 복원한 정밀 Preston 식은 아니다.
- 이력 통계: lag 평균/표준편차/개수/최근값 대비 평균/최근3개 대비 오래된3개,
  이웃 평균/표준편차/개수, log(1+최근 공정 종료 후 간격), log(1+최근접 usage 거리).
- Bagging: bootstrap RF 100개, (leaf, max_features, depth) =
  (5,1,None), (2,.7,None), (10,1,None), (5,.7,10).
  max_features<1 후보는 random-subspace 확장이므로 논문 그대로의 bagging이 아니다.
- SVR: C∈{10,100,1000} × gamma∈{scale,.01}, epsilon=.1;
  추가로 C=100,gamma=scale에서 epsilon∈{.5,1}. 총 8개.
- Ridge alpha∈{1,10,100}, 총 3개. Ridge는 논문의 LR을 대체하는 제안 모델이다.
- 대조군 OLS: v2의 rcond=1e-6 truncated OLS. 각 view 총 16개 회귀 설정.
  선택 seed는 고정하며 탐색 결과에 따라 후보를 추가하지 않는다.

## 네 단계와 대조군

`control`: 기본 특징 + Persistent/KNN/OLS/기본 SVR/기본 Bagging,
기존 논문의 (평균 내부 MSE+3×표준편차)^(-3) 가중식.
단, 이 실험의 공정한 단계 비교를 위해 내부 **3회 그룹 CV**를 공유한다.
이 대조군은 이전 **20회 wafer MC CV**로 적합한 정확한 저장 모델과 다르다.

`tuned`: 기본 특징에서 Bagging/SVR/Ridge 각각 최소 내부 OOF MSE 설정을 선택,
Persistent/KNN과 함께 같은 논문 가중식 사용.

`features`: 위 튜닝 결과의 네 특징 view 중 논문 가중식의 내부 MSE 최소를 선택.

`proposed`: control, 네 view의 논문 가중식, 각 view의 Bagging/SVR/Ridge 단독,
각 view의 비음수 합1 가중 결합 중 내부 MSE 최소를 선택한다.
가중 결합은 내부 OOF 예측을 입력으로 MSE + 1.0×||w-w_paper||²를 최소화한다.
절편 없음, 가중치≥0, 합=1. 가중치를 적합한 OOF에서 선택하므로 이 내부 점수는
낙관적일 수 있다. 이 전체 선택 절차의 과적합 여부는 외부 5분할에서 측정한다.
동점은 고정 후보 ID의 사전순으로 처리한다.

기존 incumbent에 대한 직접 비교도 별도 제공한다. retrospective 외부 각 fold와
시간순 진단에서 **기존 v2 P2 구현을 20회 MC CV 그대로 재학습**한다.
기존 Validation/Test에는 기존 v2 저장 모델을 그대로 적용한다.
모든 모델은 각 평가 안에서 동일한 표본·정답으로 비교한다.

## 기록과 재현

코드·입력·후보·분할·문서를 학습 전에 해시로 고정한다. 각 partition/조건의 체크포인트는
로컬 캐시에 저장하고, 공개 결과에는 OOF 예측, 내부 후보 점수/가중치/분할,
최종 모델, 최종 선정, 환경, 보존 검사, 검증 결과를 남긴다. 원시 데이터는 게시하지 않는다.
제거율 이력의 자기 웨이퍼·미래 완료 공정 제외, fold 경계, 타깃 불변성, 결합식,
저장 모델 재현 및 독립 지표 재계산을 검사한다.

```powershell
python -m cmp_ml.improvement prepare --run-dir runs/my_p2_improvement
python -m cmp_ml.improvement train --run-dir runs/my_p2_improvement
python -m cmp_ml.improvement evaluate --run-dir runs/my_p2_improvement
python tools/verify_improvement.py --run-dir runs/my_p2_improvement
```

기본 특징 재구축은 먼저 기존 논문 baseline과 reconstruction v2의 prepare를 실행해야 한다.
원시 데이터 접근·준비법은 기존 [baseline 문서](../baselines/README.md)를 따른다.
