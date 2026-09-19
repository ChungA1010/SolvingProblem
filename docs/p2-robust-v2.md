# P2 구간 정제·입력 보호 실험 v2 — 학습 전 고정 계획

2026-09-19에 시작한 제안 모델 개발 실험이다. 이전 개선 v1의 평가 결과와 실패 샘플을
이미 확인했으므로 같은 데이터에서의 후속 개발이며 새 독립 검증이 아니다.
이전 논문 baseline, reconstruction v2, improvement v1 및 API/Unity 모델은 보존한다.

## 원시 기록 확인과 해석의 한계

이전 실패 표본(wafer 3015014228, Stage B)은 원본 `CMP-training-097.csv`에 5,205행,
chamber 4만 있고 전체 시간 범위는 5,283이다. 최대 timestamp 간격은 63이다.
따라서 이전에 의심한 하나의 긴 로그 공백만으로 설명되지 않는다. 여러 양압·회전·슬러리
활성 구간과 대기가 같은 wafer ID에 반복 기록되어 있다. 이 ID가 실제 동일 웨이퍼의 재작업인지,
ID 기록 문제인지는 공개 자료만으로 확정할 수 없다. 어느 구간이 제거율 정답에 대응하는지도 미확인이다.
최장 연속 활성 구간을 대표값으로 삼는 것은 공개한 연구 가정이며 정답 구간 복원이 아니다.

## 데이터와 평가

- 이전과 동일한 공식 Train 1,977건(이전에 정한 Stage A 극단값 4건 제외).
- improvement v1의 바깥 5fold, wafer/file 연결 그룹, 시간순 분할을 그대로 복사하고 해시 확인한다.
- 내부 3fold GroupKFold, shuffle=True, seed=20260918. Cond1/2/3별 학습.
- 시간순 학습 1,551건, 평가 166건, 경계 그룹 260건 제외. 평가 샘플을 오류 크기로 제거하지 않는다.
- 보호값·임퓨팅·스케일링·이력 라이브러리·설정·가중치는 해당 학습 fold에서만 적합한다.
- 최종 전체 Train에서 선택을 봉인한 후 기존 Validation/Test 각 424건을 참고 평가한다.
  Test로 규칙·설정·최종 모델을 재선정하지 않는다. 불리한 결과도 모두 보존한다.
- MSE 주 지표, RMSE/MAE/R²/MAPE 보조. 전체·Stage·조건·fold·대체 예측 빈도를 기록한다.
- 기존 v1의 같은 outer/time predictions와 비교하며 기존 incumbent도 같은 표본의 이전 재학습 예측을 사용한다.

## 두 이력 조건

`retrospective`: 기존 P2 v2와 같은 raw usage 거리 및 이전 시작 11개/Train 이웃 10개.
미래 Train의 제거율을 참조할 수 있으므로 과거 데이터 복원 비교이다.

`completed`: 모든 이력은 종료 시각 < 조회 시작 시각, 자기 웨이퍼 제외, Train만 사용한다.
실측 제거율이 종료 즉시 확보된다는 가정은 그대로다. 실제 계측 지연 시각이 없으므로 운영 검증은 아니다.
구간 정제로도 원래 start/end를 바꾸지 않아 이력의 정답 이용 가능 시점을 앞당기지 않는다.
그룹 CV에서 모델 자체가 미래 Train을 볼 수 있는 한계는 별도의 시간순 진단으로 점검한다.

## 구간·특징 규칙: 정답을 사용하지 않음

기본 21개 이력+104개 공정 통계, 총 125개를 고정한다. 이번에는 입력 처리 효과를
비교하기 위해 전부 사용하며 supervised 특징 선택 및 이전 12개 physics/10개 history 확장은 사용하지 않는다.
따라서 이번 raw 모델은 이전 v1 선택 모델과 동일한 알고리즘이 아니다. 동일 코드 안의 raw/guarded 비교와
이전 전체 절차와의 비교를 구분한다.

- `raw`: 기존 104개 통계 그대로.
- `gap`: primary/secondary 별 timestamp 평균을 사용하되, 시간 간격이 60 이하인
  인접 관측만 duration/AUC에 더한다. usage 기울기는 연속 구간별 최소제곱 기울기의
  분모 가중 평균이다. 관측이 없는 공백을 연속 연마로 간주하지 않는다.
- `phase`: center pressure > 0, wafer 또는 stage rotation > 0, slurry A/B/C 합 > 0인
  연속 구간을 분리한다. 간격 >60 또는 비활성 행에서 끊는다. 2행 이상·길이 10 이상 중
  가장 긴 구간을 사용한다. 동점은 관측 수, 이후 가장 이른 구간. 없으면 가장 긴 관측 연속 구간으로
  fallback하고 품질 경고를 남긴다. chosen 구간에서도 gap 규칙을 적용한다.
- 품질 검사: primary/secondary 관측 <2행, primary 후보 구간 ≥4개,
  primary 전체 범위 >4×대표 활성 길이, primary 활성 구간 없음.
  이는 공정 정답의 확정 판정이 아닌 모호성 표시다. secondary의 별도 episode 진단도 기록한다.

## 보호 및 네 가지 동일 조건 비교

`raw_unprotected`, `raw_guarded`, `gap_guarded`, `phase_guarded`를 고정한다.
각 후보는 같은 회귀 설정 목록과 같은 내부 fold를 사용한다.

보호 처리(`guarded`)는 다음을 묶어 적용한다. 이 실험만으로 각 보호 부품의 단독 효과를 주장하지 않는다.

1. 학습 fold의 중앙값 임퓨팅 후 열별 0.5/99.5% 분위수로 입력을 제한하고, 모든 열의 결측 표시를 추가한다.
2. 물리 특징의 범위는 `min(학습최솟값,Q1−5 IQR)`부터 `max(학습최댓값,Q3+5 IQR)`.
   3열 이상 범위 밖이거나 물리 특징 결측이 있으면 대체 예측을 사용한다. 정상적인 초반 이력 결측은 이 검사에서 제외한다.
3. 위 품질 검사에 해당하는 경우도 해당 fold의 최적 Bagging으로 대체한다.
4. 개별 모델 예측이 학습 y 최솟값/최댓값을 벗어나거나 비유한 값이면 같은 Bagging으로 대체한다.
   이는 이번 제한된 연구 영역의 보수적 가정이며 새로운 제거율 영역으로의 외삽을 지원하지 않는다.
5. OOF 비음수 합1 가중 결합, Ridge 가중치 ≤0.25. 목적함수는 MSE + ||w−w_paper||².
   `w_paper`는 기존 (평균 fold MSE+3×표준편차)^(-3) 정규화값.

`raw_unprotected`는 기존 평균 임퓨팅·표준화, 입력 제한/대체/선형 가중치 상한 없이 같은 모델 목록을 사용한다.

설정 목록(각 variant 9개): Ridge alpha={10,100,1000}; SVR C={10,100,1000},
gamma=scale, epsilon=.1; bootstrap RF 100개 (leaf,max_features)={(2,.7),(5,1),(10,1)}.
RF max_features=.7은 논문 bagging의 random-subspace 확장이다.
각 계열은 내부 OOF MSE 최소로 정하고, Persistent/KNN 및 선택한 Ridge/SVR/Bagging 5개를 결합한다.
가중치를 적합한 내부 OOF 점수의 낙관성을 바깥 검증으로 평가한다.

최종 `selected`는 **보호된 세 후보**의 내부 MSE 최소, 동점 ID 사전순이다.
보호 없는 후보는 대조군으로만 사용한다. 각 바깥 fold와 최종 Train에서 같은 선택 절차를 수행한다.

## 검증·보존

원시 555개 로그와 기존 준비 캐시의 해시를 검증한다. 구간 선택·집계에는 타깃을 전달하지 않는다.
인위적 비활성/큰 간격 입력, 결측·범위 초과 입력, 미래/자기 웨이퍼 이력 배제,
OOF 분리, 선형 가중치 상한, 저장 모델 재로딩, 독립 지표 재계산, 이전 실행 보존을 검사한다.
기존 실패 표본은 삭제하지 않고 새 OOF 예측과 대체 여부를 기록한다.

```powershell
python -m cmp_ml.robust_experiment prepare
python -m cmp_ml.robust_experiment train
python -m cmp_ml.robust_experiment evaluate
python tools/verify_robust.py
```

새 실행에는 `--run-dir runs/my_robust_run`을 사용한다. 원시 위치는 prepare의 `--original-root`,
`--external-root`로 지정할 수 있다. 기존 개선 v1의 준비 캐시·분할이 필요하다.
