# Issue #3: pressure scenario와 hybrid simulator 설계

> 상태: **설계안**. 이 문서는 압력 보정값, simulator 구현 또는 독립 검증 완료를 뜻하지 않는다.
> 관측 압력은 현재 wafer의 본 연마 구간 센서 평균이며, 투입 전 recipe setpoint가 아니다.

## 적용 범위와 고정된 기준

- 예측 시점: 현재 wafer 투입·연마 시작 전. A456/B456만 이 Ridge 경로를 사용하며, A123은 [Issue #2 protocol](mrr_model_protocol.md)의 state-only 경로에 남긴다.
- 기본 MRR: Ridge(`alpha=1.0`), 입력 `recipe`, `prev_mrr`, `state_ewm`; EWMA `alpha=0.4`. 현재 기본 데이터 시나리오는 이전 같은 recipe wafer의 MRR 측정이 완료된 **N=0 가정**이다.
- `prev_mrr`와 `state_ewm`은 측정 완료된 과거 MRR만으로 만든다. 평가 wafer의 MRR은 이후 상태 갱신에만 사용한다. 압력·slurry 센서 평균과 연마 시간은 Ridge 입력에 넣지 않는다.
- fold 2~5는 chronological **development benchmark**다. fold 5를 독립 final test로 부르지 않는다. 현재 B456 High의 시간순 개선도 독립 최종 검증은 아니다.
- 데이터 기반 mode에서 선택 가능한 것은 아래 **이름이 붙은 관측 scenario**뿐이다. 관측 p_main 범위는 각 scenario의 근거를 설명하는 메타데이터이며 사용자가 입력하는 연속 제어값이나 장비 명령이 아니다.

## Pressure scenario registry 초안

`support_level`은 압력 수준의 **관측 밀도**, `correction_status`는 수치 보정의 **검증 상태**다. 둘은 별개의 필드다. `correction_enabled_default=false`는 현재 기본 예측에서 경험적 수치 보정을 적용하지 않는다는 뜻이다. Normal과 B456 Low의 `applied_correction=0`은 효과가 0이라고 입증됐다는 뜻이 아니다.

| Recipe | Scenario | 관측 p_main 범위, 표본 | Support level | Default 수치 보정 | Correction status | 사용자 경고 |
|---|---|---|---|---|---|---|
| A456 | Low | 250.817–252.000, 21장; 모두 fold 5 | `OBSERVED_LIMITED` | 비활성, 0 | `EXPLORATORY` | 저압 동반 MRR 신호는 강하지만 독립된 후속 시기 검증이 없어 기본 예측에는 적용하지 않음 |
| A456 | Normal | 268.810–270.011, 777장 | `OBSERVED_DENSE` | 기준, 0 | `NONE` | 기준 관측 수준; 압력 setpoint 또는 인과 효과로 해석하지 않음 |
| B456 | Low | 248.400–252.000, 31장; 248.400은 1장 | `OBSERVED_LIMITED` | 비활성, 0 | `OBSERVATIONAL_ONLY` | 관측 수준은 있으나 수치 보정 근거가 부족함 |
| B456 | Normal | 256.871–258.000, 729장 | `OBSERVED_DENSE` | 기준, 0 | `NONE` | 기준 관측 수준; 압력 setpoint 또는 인과 효과로 해석하지 않음 |
| B456 | High | 268.927–270.000, 52장; fold 2~5 평가 42장 | `OBSERVED_LIMITED` | 비활성, 0 | `CHRONOLOGICALLY_SUPPORTED` | 앞선 fold 보정으로 후속 fold의 MAE가 개선됐으나 독립 final test와 최종 estimator 선택이 없음 |

표본 수는 기존 전처리 `wafer_table.csv`의 A456/B456 전체에 대한 값이다. B456의 `p_main=347.893` 1장은 High 군집 및 보정 calibration에서 제외한다. B456의 254.32·254.41 두 장은 어느 수준에도 포함하지 않는다. A456의 253–265와 B456의 253–255·260–265 등 관측 군집 사이를 새로운 scenario로 해석하지 않는다. 위 min/max 사이의 모든 숫자를 지원한다는 의미도 아니다. 실제 사전 pressure setpoint와 센서 관측값의 대응은 확인되지 않았다. 따라서 사용자가 scenario를 고르는 행위는 관측 조건에 대한 **교육용 가정**이며 장비가 그 압력을 실현한다는 명령이나 보증이 아니다.

Correction status의 의미:

| 상태 | 의미 |
|---|---|
| `NONE` | Normal 기준 scenario. 경험적 pressure correction이 정의되지 않음 |
| `OBSERVATIONAL_ONLY` | 관측된 수준이지만 수치 보정의 안정적인 근거가 없음. 현재 B456 Low |
| `EXPLORATORY` | 관측·순차 신호는 있지만 독립 시기 검증이 없음. 현재 A456 Low |
| `CHRONOLOGICALLY_SUPPORTED` | 앞선 calibration fold로 만든 보정이 후속 development fold에서 개선됨. 현재 B456 High; 배포 승인이나 최종 estimator 확정은 아님 |
| `INDEPENDENTLY_VALIDATED` | 사전에 고정한 정책을 독립 자료로 검증한 경우에만 부여. 현재 해당 scenario 없음 |

## 계산 경계와 기본 동작

```text
MRR_base  = frozen Issue #2 Ridge(recipe, prev_mrr, state_ewm)
MRR_final = MRR_base + delta(recipe, pressure_scenario)
```

기본 data-driven pre-polish mode의 현재 registry에는 **선택된 수치 delta가 없다**. 따라서 지원된 모든 scenario에서 `applied_correction=0`, `MRR_final=MRR_base`를 반환한다. Normal은 항상 기준 `delta=0`; B456 Low도 보정을 만들지 않는다. A456 Low는 exploratory라 기본 보정이 꺼져 있다. B456 High는 mean·median·0.5 shrinkage 중 최종 estimator를 선택하지 않았으므로 개발 benchmark의 최고 점수만으로 값을 채우지 않는다. `0` 반환은 해당 압력 효과가 물리적으로 없다는 주장도 아니다.

향후 correction registry의 항목에는 최소 `recipe`, `scenario`, `status`, `enabled`, `delta_native_mrr_scale`, `unit_status`, `estimator_id`, `calibration_period`, `validation_period`, `model_version`, `provenance`를 둔다. 현재 MRR의 물리 단위가 확정되지 않았으므로 delta도 동일한 **모델 출력 척도**로만 정의한다. `enabled=true`는 별도의 estimator 결정과 검증·승인 뒤 버전으로 기록할 때만 허용한다. 기본 prediction 경로가 실험 결과 CSV에서 자동으로 delta를 읽어 활성화해서는 안 된다. 교육용 비교 화면을 별도로 만들더라도 비활성 후보의 시험 수치를 기본 MRR에 조용히 합산하지 않는다.

지원되지 않는 recipe/scenario 조합 또는 사용자가 입력한 임의의 압력 숫자는 data-driven mode에서 `UNSUPPORTED_PRESSURE_SCENARIO`로 **거부**한다. 계산 가능한 가장 가까운 군집으로 반올림하거나, 군집 사이를 보간하거나, 관측 범위 밖을 외삽하지 않는다. physics mode로 자동 전환하지 않는다. Preston-inspired mode를 나중에 만든다면 별도 명시적 선택·별도 입력/출력·별도 근거 표기를 가진 **교육용 물리 가정**으로 분리한다. 현재 PHM 관측에서 검증된 data-driven 기능이라고 표시하지 않으며 이번 단계에서는 구현하지 않는다.

## Polishing time의 단위 검사와 보류

구조적 관계는 `recommended_polishing_time = target_removal / MRR_final`이다. 이는 **target removal이 길이**, **MRR이 같은 길이/시간**, **요청한 출력 시간이 그 시간 단위**일 때만 수치화할 수 있다. 예컨대 두 양이 각각 µm와 µm/min으로 *검증된다면* 결과는 분이고 초 출력에는 60을 곱해야 한다. 이는 단위 변환의 예시이지 현재 PHM 값의 단위 확정이 아니다.

원본 `CMP-training-removalrate.csv`의 `AVG_REMOVAL_RATE`는 `preprocess.py`에서 추가 scaling 없이 `wafer_table.csv`의 `mrr`로 전달되고 Proposed Ridge의 target으로 그대로 사용된다. 전처리된 1,977행에서 원본 라벨과 `mrr`가 전수 일치한다. **raw label scale: VERIFIED, factor 1**이며 target 자체에 normalization, standardization, log 변환이 없다. 다만 PHM 공식 설명에서 `AVG_REMOVAL_RATE`의 수치 단위를 µm/min, nm/min, Å/min 등으로 명시적으로 확인하지 못했다. 저장소 [CMP1 README](../Dataset/CMP1/README.md)의 기존 µm/min 표기는 검증되지 않은 로컬 설명이다. **physical MRR unit: UNIT_UNVERIFIED**이다.

`t_polish`는 timestamp 차이로 계산한 초 단위 값이다(**t_polish unit: seconds**). 이 사실만으로 MRR의 물리 단위를 역추정하지 않는다. PHM CMP1에는 wafer별 목표 제거량이나 전후 두께가 제공되지 않는다(**target removal: NOT_AVAILABLE_IN_PHM_CMP1**). 따라서 `recommended_polishing_time=null`, `time_status=UNIT_UNVERIFIED`를 유지하고 **polishing time numerical output: disabled**로 둔다. 실제 수치 계산은 MRR의 길이/시간 단위와 별도로 입력받는 `target_removal`의 길이 단위가 모두 검증된 경우에만 허용하며, 그때도 `MRR_final>0`을 검사한다.

## Simulator interface 계약 초안

이는 구현된 API가 아니라 향후 인터페이스 명세다. 기본 화면은 `pressure_scenario`를 선택하게 하며 raw `p_main` 숫자 슬라이더를 제공하지 않는다.

| 입력 | 계약 |
|---|---|
| `recipe` | `A456` 또는 `B456`. A123 요청은 별도 state-only 경로로 안내 |
| `pressure_scenario` | 해당 recipe registry의 이름만 허용. `Low`/`Normal`/`High` 중 recipe에 없는 선택은 오류 |
| `history` 또는 서버 상태 토큰 | 같은 recipe의 **현재 투입 전 측정 완료** MRR을 시각순으로 제공. 서버가 최신값으로 `prev_mrr`를, EWMA α=0.4로 `state_ewm`을 내부 계산. 이 둘을 일반 사용자가 독립적으로 입력하게 하지 않음 |
| `target_removal` 및 단위 | 향후 선택적 입력. 지금은 단위가 검증되지 않아 권장 시간 숫자 계산에 사용하지 않음 |

N=0은 **이전 wafer MRR이 현재 투입 전에 측정 완료**됐다는 가정이다. 실제 완료 timestamp를 가진 서비스라면 이를 검사한다. PHM 자료에는 완료 시각이 없어 기존 개발 점수는 가정에 의존한다. 측정 완료 이력이 없거나 필요한 history가 부족하면 임의 `prev_mrr`/`state_ewm`을 만들지 않고 입력 부족을 표시한다. 계산 후 현재 wafer의 실제 MRR이 나중에 측정 완료되면 그때 같은 recipe history를 갱신한다. 예측 시점의 MRR로 현재 예측이나 모델 계수를 다시 적합하지 않는다.

| 출력 | 현재 기본 동작 |
|---|---|
| `base_mrr` | 고정 Ridge의 사전 예측 |
| `pressure_scenario`, `support_level`, `correction_status` | 선택한 registry 항목의 설명 메타데이터 |
| `applied_correction`, `final_mrr` | `0`, `base_mrr`와 동일. 후보 보정 미활성 상태를 함께 표시 |
| `recommended_polishing_time`, `time_status` | `null`, `UNIT_UNVERIFIED` |
| `warnings` | 센서 관측 scenario와 setpoint의 차이, 선택 수준의 한계, N=0 측정 완료 가정, 독립 final test 부재 등을 해당 경우에 표시 |
| `model_version`, `policy_version` | 추후 모델·scenario registry 추적용 식별자. 현재 설계에는 특정 배포 버전 없음 |

## Issue #3 체크리스트와 남은 결정

| 항목 | 현재 판정 | 남은 작업 |
|---|---|---|
| 기존 pressure 분석·shift 정의·관측 분포·MRR 관계 감사 | 완료 | 새 독립 데이터가 생기면 재확인 |
| 관측 범위 내 pressure-response 모델 설계 | 부분완료 | 불연속 scenario와 additive interface는 설계됨. 경험적 delta/estimator는 미확정·비활성 |
| Preston-inspired 적용 가능성 | 부분완료 | data-driven과 분리해야 한다는 정책만 결정. 물리 mode의 근거·구현은 별도 과제 |
| 관측 군집 사이·범위 밖 정책 | 정책 설계 완료 | 거부 동작 구현·검증은 미완료 |
| Ridge와 pressure module 결합 방식 | 설계 완료, 구현 미완료 | registry와 명시적 activation gate 구현 |
| 최종 MRR 계산식 | 설계 완료, 수치 보정 미활성 | estimator 선택·독립 검증 후에만 경험적 delta 활성화 검토 |
| 목표 제거량 기반 polishing time | 부분완료 | MRR·목표 제거량 단위 확인 전 숫자 출력 불가 |
| Simulator 입력/출력 | 설계 완료, 구현 미완료 | history 상태 관리·오류·경고 UI 구현 및 확인 |
| 가정·한계·extrapolation 문서 | 이번 설계 문서로 완료 | 실제 구현과 달라지면 문서 갱신 |

이번 설계는 simulator 실행 코드, 새 ML 모델, Preston 계수, 연속 pressure slider를 추가하지 않는다.
