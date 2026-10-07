# CMP MRR 사전 예측과 시간순 개발 프로토콜

## 예측 시점과 데이터 출처

**현재 웨이퍼를 투입하고 연마를 시작하기 전에 이용 가능한 정보만으로 MRR을 예측한다.**
현재 `wafer_table.csv`는 1,977행·47열이지만, `columns.csv`의 과거
`input_allowed=Y`는 이 예측 시점의 가용성을 보증하지 않는다.

PHM CMP1 원본 185개 센서 CSV는 모두 같은 25개 열을 가지며 별도 압력·유량
recipe setpoint 열이 없다. `MACHINE_DATA`의 숫자 코드 1~6을 setpoint로
해석할 근거도 없다. 따라서 현재 웨이퍼 본 연마 구간의 압력·유량 평균을
시뮬레이터 슬라이더 설정값으로 대체하지 않는다.

## 입력 데이터 준비와 실행 위치

이 저장소의 모델 코드는 `wafer_table.csv`를 읽으며 원시 PHM 데이터를
자동으로 내려받거나 전처리하지 않는다. 현재 사용한 파일은 저장소 루트
`PHM/PHM`의 형제 폴더
`../preprocessed_audit_source/preprocessed/wafer_table.csv`에 있다.
PHM 2016 CMP1의 센서 training CSV 185개와
`CMP-training-removalrate.csv`를 별도 전처리 스크립트
`../preprocessed_audit_source/preprocessed/preprocess.py`로 처리한
웨이퍼별 표다. 전처리 절차와 파일 설명은 같은 폴더의 `README.md`,
`처리기록.md`, `결정기록.md`에 있다.

새 checkout에서는 **저장소 밖** 형제 경로에
`preprocessed_audit_source/preprocessed/preprocess.py`를 포함한
전처리 자료를 별도로 준비해야 한다. 표를 다시 만들려면 그
`preprocessed` 폴더의 상위에 원본을
`PHM2016_CMP_dataset/PHM2016_CMP_dataset/training/*.csv` 및
`PHM2016_CMP_dataset/PHM2016_CMP_dataset/CMP-training-removalrate.csv`
로 배치하고, PowerShell에서 전처리 폴더로 이동해
`python .\preprocess.py`를 실행한다. 결과 `wafer_table.csv`가
그 폴더에 생성된다. 기존 생성본을 제공받은 경우에는 같은 형제 경로에
놓으면 된다. 원본 PHM 데이터와 이 형제 전처리 자료는 Git 저장소에
포함되지 않는다. 저장소 안의 원본·생성 데이터 경로도
`.gitignore`에서 제외된다.

아래 모델 명령은 모두 **현재 저장소 루트 `PHM/PHM`에서** 실행한다.
`python`은 `requirements.txt`의 의존성이 설치된 환경을 가리켜야
한다. PowerShell용 한 줄 명령은 문서 하단에 있다.

## 기존 24개 특징의 가용성 분류

| 분류 | 정확한 특징 | 정책 |
|---|---|---|
| A: 투입 전 확실 | `recipe` | 계획된 레시피로 사용 |
| B: 과거 측정 완료 조건 | `prev_mrr`, `state_ewm` | 해당 MRR이 현재 투입 전에 측정 완료됐을 때만 사용 |
| B: 과거 측정·카운터 조건 | `prev_wafers_back` | 실제로 사용한 측정 완료 MRR과 투입 전 패드 카운터에 맞춰 재계산 |
| B: 투입 전 카운터 필요 | `u_dresser`, `u_pad`, `u_dresser_table`, `u_membrane`, `hidden_wafers_est`, `dresser_excess`, `extra_dressing`, `after_gap_confirmed`, `pad_replaced`, `dresser_replaced` | 독립적으로 시각이 기록된 투입 전 스냅샷이 없으면 결측 |
| B: 투입 전 일정 필요 | `gap_s`, `after_gap` | 사전에 확정된 예정 투입 시각이 없으면 결측 |
| C: 현재 공정 관측 | `p_main`, `p_center`, `p_edge`, `p_ripple`, `p_retainer`, `p_chamber`, `slurry_a`, `slurry_c` | 사전 예측 X에서 제외 |

이 분류는 A 1개, B 15개, C 8개다. A123은 기존과 같이 A456/B456
학습 대상에서 제외하고 과거 측정 MRR 상태 추적으로만 평가한다. `flag_*`,
`use_sensor_model`, ID, 현재 `mrr`, 시간·적분 특징은 예측 X가 아니다.
레시피로 A123을 구분하므로 공정 후 계산되는 `use_sensor_model`로
학습 표본을 고르지 않는다.

현재 원본의 소모품 값은 현 웨이퍼 연마 챔버 기록의 첫 행에서 가져온다.
이는 독립적인 **투입 전** 조회값으로 확인되지 않았다. 따라서 기본 실행은
카운터와 예정 투입 시각 관련 특징을 결측으로 두고, `counter_available`,
`schedule_available`, `history_available` 메타데이터로 가용성을 기록한다.
이 플래그들은 아직 모델 X에 추가하지 않는다.

독립적인 투입 전 정보가 생기면 `--prestart-snapshots` CSV로 제공할 수 있다.
필요 열은 `(wafer_id, stage)`, `planned_at`, `planned_start`,
`counter_observed_at`, `u_dresser`, `u_pad`, `u_dresser_table`, `u_membrane`이다.
`planned_at < planned_start <= t_start`와
`counter_observed_at < planned_start`를 검사한다. 시간 조건을 증명하지
못하는 값은 이 프로토콜에 넣지 않는다. 기존 현재 웨이퍼 첫 센서 행을
이 파일의 대용으로 자동 사용하지 않는다.

## Fold 안에서 과거만 사용하는 특징 생성

`wafer_table.csv`의 기존 `prev_mrr`, `state_ewm`, `prev_wafers_back`,
`hidden_wafers_est`, `dresser_excess`, `after_gap_confirmed`,
`extra_dressing`을 그대로 X에 복사하지 않는다. 평가 fold마다 다시 만든다.

```text
for f in [2, 3, 4, 5]:
    train = fold < f
    evaluation = fold == f
    각 table(ch1/ch4)에 대해 과거 train 스냅샷만 순서대로 읽는다.
    train의 각 행은 그 행 이전에 축적된 증가량만으로 특징을 만든다.
    train 끝에서 pad_step, dres_step을 고정한다.
    같은 table의 인접 기록 중 gap <= 300초, 양의 pad 증가량,
    음이 아닌 dresser 증가량을 기준 증가량 추정에 사용한다.

    evaluation 행을 시간순으로 처리한다.
    투입 전 스냅샷과 고정된 train 기준 증가량으로만
      hidden_wafers_est, dresser_excess, after_gap_confirmed,
      extra_dressing, prev_wafers_back을 계산한다.
    evaluation 카운터는 해당 행과 다음 행의 관측 상태에는 쓸 수 있지만
      pad_step/dres_step 추정에는 절대 추가하지 않는다.
    evaluation MRR은 측정 완료 규칙에 따라 다음 행의 state만 갱신한다.
      계수, scaler, imputer, 기준 증가량, hyperparameter는 갱신하지 않는다.
```

과거 스냅샷이 없거나 증가량을 추정할 수 없으면 관련 특징을 결측으로 둔다.
`prev_wafers_back`은 단순히 직전 행이 아니라 **현재 시점에 가장 최근에
측정 완료된 MRR**의 웨이퍼와 현재 웨이퍼 사이 거리로 계산한다.
선택적 투입 전 스냅샷을 사용할 때도 이전 테이블 기록의 `t_end`가
현재 `planned_start` 이하일 때만 `gap_s`를 계산한다. 그보다 늦게
끝난 기록의 종료 시각은 현재 예측 시점에 알 수 없으므로 `gap_s`,
`after_gap`, `after_gap_confirmed`를 결측으로 둔다.
모델 학습 시 결측 대체와 스케일러는 해당 fold의 train에서만 적합한다.

## Online state update와 측정 지연

기본 시나리오 `N=0`은 이전에 관측된 같은 레시피 웨이퍼의 MRR 측정이
다음 웨이퍼 투입 전에 완료됐다는 **명시적 가정**이다. `prev_mrr`와
`state_ewm`은 이 측정 완료 원장에 올라온 값만 사용한다. EWMA 계수는
기존 기준과 같이 α=0.4 (`adjust=False`)로 고정한다.

평가 fold 내부에서 한 웨이퍼의 MRR이 다음 평가 웨이퍼의 state에 들어가는
것은 이 `N=0` 조건에서만 허용한다. `N>0`은 같은 레시피에서 추가로
관측된 N장의 웨이퍼가 지난 후 측정이 완료되는 별도 민감도 시나리오다.
현재 코드는 이 지연을 모의할 구조를 제공하며 N=1·2 민감도도 점검했다.
실제 측정 완료 시각이 확보되면 웨이퍼 수 가정보다 그 시각을 우선한다.

평가 fold의 MRR은 online state 갱신에만 사용할 수 있다. 이 값으로 모델
계수·결측 대체값·스케일러·pad_step/dres_step·하이퍼파라미터를 다시
적합하지 않는다. 아래 감사 명령은 모델을 적합하지 않으며, 고정 비교
명령은 각 fold의 과거 구간에서만 지정된 선형 모델을 적합한다.

## Chronological development benchmark

fold 1은 초기 이력과 학습 구간이며, fold 2~5는 각각 앞선 fold만 사용해
평가한다. **fold 5는 이미 모델 선택 과정에서 확인했으므로 final test나
untouched test가 아니다.** 네 평가 fold 전부 개발용 시간순 benchmark로
보고한다. 독립 최종 평가는 앞으로 새로 확보할 미래 데이터에서만 주장한다.

모든 후보를 같은 expanding-window protocol과 같은 A456/B456 행에서
비교한다. 아래의 첫 고정 비교는 사용자 승인에 따라 모델군, 특징, 상수를
고정한 뒤 실행한다. 이 비교 결과로 특징이나 상수를 다시 선택하지 않는다.

## 고정 N=0 비교: 사전 선언 정책

기본 data-driven 시나리오는 **N=0 measurement-complete assumption**이다.
PHM에는 실제 MRR 측정 완료 시각이 없으므로 이 가정을 입증된 사실로
표현하지 않는다. `recipe`만 사용하는 Recipe Mean은 별도의 STRICT 참조다.
나머지 입력은 `recipe`, `prev_mrr`, `state_ewm`으로 제한한다.

평가 대상은 A456/B456이며 A123은 계속 state-only다. fold 2~5의 각
평가 fold마다 이전 fold의 A456/B456 행만으로 recipe 평균, 결측 대체,
스케일러, 선형 회귀 또는 Ridge 계수를 적합한다. 평가 fold에서는 적합을
반복하지 않는다. 평가 MRR은 N=0에 따라 다음 평가 웨이퍼의 이력 상태에만
반영한다. 모든 후보에 같은 평가 행을 사용한다.

비교 모델은 Recipe Mean, Persistence(`prev_mrr`), EWMA(`state_ewm`,
α=0.4), 다음 세 특징 조합 각각의 LinearRegression과 Ridge다:
`recipe+prev_mrr`, `recipe+state_ewm`,
`recipe+prev_mrr+state_ewm`. Ridge의 α는 **1.0 고정**이며 탐색하지
않는다. 선형 모델의 수치 결측은 train-fold 중앙값, 스케일은 train-fold
평균과 표준편차, recipe 인코딩도 train-fold에서만 적합한다. 결측 이력이
없는 평가 행에서는 baseline fallback이 작동하지 않는다.

각 fold와 A456+B456 전체·A456·B456 각각의 MAE를 보고한다. fold 2~5
가중 평균은 네 fold 평가 행을 합친 MAE, 비가중 평균은 네 fold MAE의
산술평균이다. `prev_mrr`와 `state_ewm`의 Pearson 상관도 각 fold와
네 평가 fold 합계로 계산한다. fold 5를 final test라 부르지 않는다.
RF, ExtraTrees, LightGBM, XGBoost 및 하이퍼파라미터 탐색은 이 비교에
포함하지 않는다.

## 현재 주 후보 안정성 감사

주 후보는 `recipe + prev_mrr + state_ewm` Ridge(α=1.0)다. 같은 fold
2~5 개발 benchmark에서 전체 3특징 Linear와 Ridge의 fold별 계수를
원래 입력 단위와 train-fold 표준화 단위로 출력한다. 레시피 효과는
`B456 − A456` 예측 차이로 보고하고, 두 레시피의 절편은 각각 수치
특징이 train 평균일 때와 원래 단위의 0일 때로 분리한다. One-hot 두 열과
절편을 함께 사용한 Linear의 개별 one-hot 계수는 중복 표현이므로
그 차이와 레시피별 절편으로 해석한다.

특징 ablation은 Ridge만 사용하고 α=1.0을 고정한다. 일곱 입력 조합은
`recipe`, `prev_mrr`, `state_ewm`, `recipe+prev_mrr`,
`recipe+state_ewm`, `prev_mrr+state_ewm`, 전체 3특징이다. 각 fold의
과거 A456/B456 행에만 적합하고 동일 평가 행에서 전체·레시피별 MAE를
비교한다. N=1과 N=2 지연 민감도는 같은 EWMA α와 Ridge 구조·α를
유지하면서, 각 지연 시나리오의 과거 fold 특징으로 Ridge를 다시 적합한다.
평가 fold MRR은 해당 지연 원장의 online state 갱신에만 쓰인다.
지연 N은 같은 레시피의 추가 웨이퍼 N장으로 정의하며 실제 측정 시각은
자료에 없다. 이 단계에서 feature family, 모델 family, α를 변경하거나
탐색하지 않는다.

```powershell
python -m src.models.audit_mrr_candidate --wafer-table "..\preprocessed_audit_source\preprocessed\wafer_table.csv"
```

이 고정 감사에서 3특징 Ridge의 A456+B456 가중/비가중 MAE는
N=0에서 2.690/2.688, N=1에서 3.162/3.160, N=2에서
3.524/3.525였다. N=0의 `prev_mrr+state_ewm` Ridge는
2.693/2.691로, recipe를 더한 차이는 가중 MAE 약 0.003에 그쳤다.
Linear와 Ridge의 두 이력 계수는 네 fold에서 모두 양수였고 α=1.0
Ridge의 계수 안정화 효과는 작았다. 이는 이미 본 개발 fold의 관찰이며
독립 최종 시험 결과가 아니다.

## 잠정 최종 후보와 deployment-compatible 비교

**잠정 data-driven 후보:** Ridge(α=1.0), 입력
`recipe + prev_mrr + state_ewm`, EWMA α=0.4, N=0 measurement-complete
assumption. 아래 네 모델만 deployment-compatible 비교표에 남긴다.
`Recipe Mean`은 recipe-only STRICT 참조다. Persistence, EWMA, Ridge는
과거 MRR이 투입 전에 측정 완료됐다는 N=0 가정에 의존한다. A123은
state-only이고 아래 모델 평가는 A456/B456 1,286행에서만 한다.

표의 MAE는 fold 2~5 chronological development benchmark 결과다.
`가중`은 평가 행을 합친 MAE, `비가중`은 네 fold MAE의 산술평균이다.
전체/레시피별 평가 행은 각각 1,286/625/661개다.

| 모델 | 평가 집합 | F2 | F3 | F4 | F5 | 가중 MAE | 비가중 MAE |
|---|---|---:|---:|---:|---:|---:|---:|
| Recipe Mean | A456+B456 | 4.631 | 10.711 | 7.725 | 5.644 | 7.167 | 7.178 |
| Recipe Mean | A456 | 3.503 | 8.300 | 6.725 | 3.752 | 5.497 | 5.570 |
| Recipe Mean | B456 | 5.758 | 13.016 | 8.510 | 7.668 | 8.746 | 8.738 |
| Persistence | A456+B456 | 2.810 | 2.945 | 3.009 | 3.148 | 2.980 | 2.978 |
| Persistence | A456 | 2.512 | 2.663 | 2.474 | 3.011 | 2.675 | 2.665 |
| Persistence | B456 | 3.109 | 3.215 | 3.429 | 3.295 | 3.269 | 3.262 |
| EWMA | A456+B456 | 2.634 | 2.634 | 2.812 | 2.898 | 2.747 | 2.744 |
| EWMA | A456 | 2.286 | 2.417 | 2.213 | 2.619 | 2.391 | 2.384 |
| EWMA | B456 | 2.982 | 2.841 | 3.281 | 3.197 | 3.083 | 3.075 |
| Proposed Ridge | A456+B456 | 2.570 | 2.628 | 2.747 | 2.807 | 2.690 | 2.688 |
| Proposed Ridge | A456 | 2.245 | 2.350 | 2.201 | 2.638 | 2.367 | 2.358 |
| Proposed Ridge | B456 | 2.896 | 2.893 | 3.175 | 2.989 | 2.996 | 2.988 |

Proposed Ridge는 EWMA 대비 전체 가중 MAE 0.057, 비가중 MAE
0.056 낮고 네 평가 fold 모두에서 낮다. 이는 주 후보를 **잠정** 고정할
근거이며 독립 final test의 성능 주장은 아니다. 원자료와 상세 수치는
`results/mrr_protocol_audit/fixed_n0_fold_mae.csv` 및
`fixed_n0_summary.csv`에 있다.

### 측정 지연 sensitivity analysis

N=1·2에서 모델 구조와 α는 고정하고 각 지연 시나리오의 **과거 fold**
자료로 Ridge를 다시 적합했다. N은 같은 레시피의 추가 웨이퍼 수이며
실제 측정 완료 시각을 관측한 결과가 아니다.

| 시나리오 | 전체 가중 MAE | 전체 비가중 MAE | A456 가중 MAE | B456 가중 MAE |
|---|---:|---:|---:|---:|
| N=0 EWMA | 2.747 | 2.744 | 2.391 | 3.083 |
| N=1 EWMA | 3.186 | 3.183 | 2.747 | 3.601 |
| N=2 EWMA | 3.476 | 3.473 | 2.978 | 3.946 |
| N=0 Proposed Ridge | 2.690 | 2.688 | 2.367 | 2.996 |
| N=1 Proposed Ridge | 3.162 | 3.160 | 2.724 | 3.576 |
| N=2 Proposed Ridge | 3.524 | 3.525 | 2.993 | 4.026 |

Ridge의 전체 가중 MAE는 N=1에서 0.472(17.5%), N=2에서
0.834(31.0%) 악화한다. N=2에서는 EWMA보다 높다. fold별 값은
`results/mrr_protocol_audit/stability_delay_fold_mae.csv`에 있다.

### Proposed Ridge의 한계

- PHM 자료에는 MRR 측정 완료 시각이 없어 **N=0은 가정**이다.
- `prev_mrr`와 `state_ewm`은 평가 fold 전체에서 Pearson 상관 약
  0.963으로 높다. 계수 부호는 안정적이었지만 독립적인 효과로 해석하기 어렵다.
- `recipe`의 추가 이득은 `prev_mrr+state_ewm` Ridge 대비 전체 가중
  MAE 약 0.003에 그친다.
- 원본에 투입 전 pressure/slurry recipe setpoint가 별도로 없어 현재
  공정조건을 조절했을 때의 MRR 변화를 직접 학습하거나 추론할 수 없다.
- fold 2~5는 이미 사용한 development benchmark이며 독립 final test가 없다.

## Di2017 baseline-v1: 별도 연구 기준

Di et al. (2017) 재현용 `baseline-v1`은 별도의 동결된 연구 기준이다.
`results/di2017_final_audit/run_info.json`에 따르면 20회 Monte Carlo
무작위 분할(test fraction 0.2)을 사용했고,
`final_summary_vs_paper.csv`는 MSE를 보고한다. 현재 후보는 투입 전
특징만 사용해 시간순 fold 2~5에서 MAE를 평가한다. Di 기준의
공정 구간 센서 요약에는 현 웨이퍼 공정 관측값이 포함되므로 예측 시점도
다르다. **분할·지표·입력 가용성이 달라 수치를 직접 우열 비교할 수 없다.**
Issue #2가 요구한 동일 조건 head-to-head는 아직 수행되지 않았다.

## 기존 1-stage 모델: historical reference

과거 1-stage 모델의 MAE≈2.63은 역사적 참고값이다. 원본
`kp_model.py`와 `fit_kp.py`가 현재 자료에 없어 동일 행·특징·분할·
평가 절차를 재현할 수 없다. Proposed Ridge와의 exact apples-to-apples
비교 또는 성능 개선 근거로 사용하지 않는다.

## Issue #2 진행 상태

[Issue #2](https://github.com/ChungA1010/SolvingProblem/issues/2)는
현재 open이다. 이 문서는 이슈 본문을 수정하거나 이슈를 닫지 않는다.

| 이슈 항목 | 현재 상태 |
|---|---|
| 데이터 전처리·구조 분석, 주요 특징 검토, chronology/누락 웨이퍼 검증, Di baseline-v1 동결 | 이슈 본문에 기존 완료로 표시됨 |
| 학습/검증 프로토콜 고정 | 완료: 투입 전 정책, N=0, expanding-window fold 2~5 |
| 후보 모델 학습·시간순 평가 | 완료: 지정된 단순 후보의 A456/B456 개발 benchmark |
| feature ablation | 완료: Ridge의 7개 지정 조합 |
| 결과 및 실행 방법 문서화 | 개발 benchmark와 실행 명령 문서화 완료 |
| 신규 모델 입력 특징의 최종 확정·최종 모델 선정 | 잠정 3특징 Ridge 후보 선정; 독립 검증 전 최종 확정 아님 |
| baseline-v1과 동일 조건 성능 비교 | 미완료: 현재 사전 예측 benchmark와 조건 불일치 |
| Stage/조건별 완전한 평가 및 교육용 시뮬레이터 연결 | A456/B456 레시피별 결과는 기록; 더 넓은 조건 검증과 연결은 남음 |

## 감사와 고정 비교 실행

```powershell
python -m src.models.train_mrr_chronological --wafer-table "..\preprocessed_audit_source\preprocessed\wafer_table.csv"
```

이 명령은 모델 학습 없이 다음만 확인해 로컬의 `results/mrr_protocol_audit/`에
기록한다: 특징 가용성, 미래 fold를 바꿔도 앞선 fold 특징·기준 증가량이
바뀌지 않는지, fold별 행 수, N=0 상태 추적 MAE, 기존 24개와 사전 후보
16개의 차이. 원본과 달리 8개 현재 공정 센서 평균은 입력 후보에서 빠진다.
기존 `results/mrr_chronological/` 수치는 이전 정책의 **탐색 기록**이며
새 정책의 모델 성능으로 재사용하지 않는다.

위 감사 후 고정 비교는 다음처럼 실행하고 결과를 같은 출력 폴더의
`fixed_n0_*.csv`와 `fixed_n0_policy.json`에 기록한다.

```powershell
python -m src.models.train_mrr_chronological --wafer-table "..\preprocessed_audit_source\preprocessed\wafer_table.csv" --compare-fixed-n0
```
