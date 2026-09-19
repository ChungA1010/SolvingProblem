# P2 다중 구간·CatBoost 직접/잔차 실험 v3 — 학습 전 계획

2026-09-19. 이전 robust v2의 그룹 OOF에서 Cond2가 전체 제곱오차 약 51%,
큰 오차 상위 99건이 약 29.3%를 차지한 관찰에 따른 후속 개발 실험이다.
이전 공식 Test/Validation과 바깥 fold를 이미 보았으므로 독립 확인 실험이 아니다.
논문 baseline, 기존 결과, API/Unity 모델은 보존한다. 오류 크기로 표본을 제거하지 않는다.

## 자료·분할·목표

- 기존 Train 1,977건, 동일한 웨이퍼/파일 연결 그룹 바깥 5fold와 시간순 분할을 복사한다.
  기존 제외 4건 외에 추가 제외는 없다. 시간순은 1,551건 학습/166건 평가/260건 경계 제외이다.
- 각 Cond1/2/3와 두 이력 정책에 동일한 탐색 예산을 적용한다. Cond2는 해석의 우선 대상이다.
- `completed`는 종료 < 조회 시작 및 다른 웨이퍼의 Train 이력만 허용한다.
  종료 즉시 계측 가정이며 실제 계측 지연은 미확인이다.
  `retrospective`는 이전 P2의 미래 Train 이웃 허용 조건이며 온라인 성능으로 해석하지 않는다.
- 새 모델 학습용 이력은 추가 내부 3fold 그룹 교차 적합으로 만든다. 자기 웨이퍼뿐 아니라
  자기 파일 연결 그룹의 모든 타깃을 이력에서 배제한다. 이 처리는 매 내부 모델 선택 fold에서도 다시 수행한다.
  검증/실사용 조회 이력은 해당 학습 부분 전체로 만든다. 훈련·조회 이력의 표본 수 차이는 남는다.
- MSE를 주 지표로 사용하고 RMSE/MAE/R²/MAPE 및 조건별/시간순 결과를 함께 보고한다.
  최종 설정은 내부 검증에서만 선택하고 봉인한 뒤 기존 Validation/Test 각 424건을 참고 평가한다.

## 원시 데이터 점검 및 특징

555개 원시 로그를 이전 SHA-256과 대조한다. 이전 상위 오차 99건은 원본 제거율 파일의
wafer/stage 그룹 평균과 준비된 타깃의 일치를 확인하고, 원시 파일·행 수·chamber·중복 시각·구간 진단을 남긴다.
집계 라벨의 일치는 특정 활성 구간과 정답의 대응이 확인됐다는 뜻은 아니다. 수정/삭제 없이 모두 유지한다.

`base`: 기존 raw P2의 21개 이력+104개 공정 통계, 총 125개.

`joint`: base에 기존 10개 이력 요약, gap 104개, 대표 phase 104개, 품질 필드 14개,
이번 전체 활성 구간 특징 44개를 더한 401개. 결측은 NaN, 무한대는 NaN으로 바꾼다.
식별자, 절대 timestamp, stage/condition 번호, 이전 오차는 모델의 수치 입력으로 쓰지 않는다.
condition은 모델 라우팅, 시각/wafer/group은 이력·분할에만 사용한다.

전체 활성 구간 특징은 primary/secondary 별 22개이다. 활성 판정은 center pressure>0,
wafer 또는 stage rotation>0, slurry A+B+C>0이다. slurry 중 결측이 있으면 활성으로 인정하지 않는다.
간격 60 초과·비활성 행을 연결하지 않고 관측 시간, 활성 시간, 비활성 시간, 활성 시간/행 비율,
길이 10 이상 구간 개수 및 길이 min/median/max/std, 활성 pressure/rotation 절댓값 합/slurry 합/
pressure×rotation 합의 mean/std/적분을 만든다. 이 값들은 원자료 단위와 공학적 대용값이며
실제 접촉 상대속도 또는 Preston 계수를 복원했다고 주장하지 않는다. 원래 start/end는 유지한다.

## 후보와 고정 탐색 예산

네 후보: `base_direct`, `joint_direct`, `base_residual`, `joint_residual`.

기준 이력 예측은 최근 5개 lag의 평균과 이웃 10개의 평균을 동일 가중으로 결합한다.
한쪽이 없으면 있는 쪽, 둘 다 없으면 그 참조 학습 부분의 평균을 사용한다.
잔차 모델의 목표는 y−이 기준값이며, 예측 때 기준값+CatBoost 잔차를 계산한다.
잔차 학습에 쓰이는 기준값과 이력 특징은 위 그룹 교차 적합으로 만들며, 평가 타깃은 쓰지 않는다.

각 후보에 depth={3,5} × loss={RMSE,Huber(delta=5)}, 총 4개 설정을 적용한다.
iterations=300, learning_rate=.05, l2_leaf_reg=10, border_count=64,
bootstrap_type=No, random_strength=0, CPU thread_count=4, seed=20260918+내부 fold.
최종 재적합 seed=20260918. early stopping은 사용하지 않는다.
신규 후보 4×설정 4×내부 3fold×42개 조건 적합 = 2,016회와 최종 후보 재적합 168회이다.

모든 신규 예측(직접/잔차/이력 기준)은 해당 모델 학습 y의 min/max로 제한한다.
제한 발생 횟수를 공개하며, 학습 지지 범위 밖의 새 공정으로 외삽 가능한 모델로 해석하지 않는다.
결측/복잡 구간은 joint에서 입력으로 활용하며, 신규 후보에 이전의 전체 Bagging 대체 규칙을 강제하지 않는다.

네 후보 각각의 설정을 내부 OOF MSE 최소로 정하고, 네 후보 및 **이전 robust v2 선택 절차** 중
내부 MSE 최소를 `selected`로 정한다. 동점은 ID 사전순. 이전 후보의 동일 분할 OOF/모델을 해시 확인해 재사용한다.
이전 결합 모델의 내부 점수는 가중치도 같은 OOF로 맞춘 점수라 낙관적일 수 있다.
이 선택 전체를 바깥 fold/시간순에서 평가한다. 이전 모델과 비교하면 특징, 학습기, 이력 교차 적합이 함께 바뀌므로
변경 하나의 인과 효과로 해석하지 않는다. 신규 네 후보끼리는 동일 내부 분할과 이력 처리로 비교한다.

## 실행 및 검증

```powershell
python -m cmp_ml.boosted_features
python -m cmp_ml.boosted_experiment prepare
python -m cmp_ml.boosted_experiment train
python -m cmp_ml.boosted_experiment evaluate
python tools/verify_boosted.py
```

`boosted_features --cache-dir .cache/boosted/my_run`과 이후 단계의 `--run-dir runs/my_run`으로 새 실험을 만든다.
원시 경로는 features 단계의 `--original-root`, `--external-root`로 지정한다.
기존 robust v2 특징 캐시와 42개 모델 체크포인트가 필요하며 없으면 먼저 해당 실험을 재현한다.
완료된 실행은 덮어쓰지 않는다. 모델 저장/재로딩, 타깃 변경 불변성, 그룹/시간 이력 검사,
독립 지표 재계산, 이전 실행 해시 보존, 구간·잔차 경계 단위 테스트를 수행한다.
