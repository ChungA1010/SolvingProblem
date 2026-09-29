"""Describe completed paired results without changing models or selection."""
from pathlib import Path
import json,hashlib
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_team_comparison_v1'


def table(frame):
    def f(x):
        return f'{x:.4f}' if isinstance(x,(float,np.floating)) else str(x)
    return '| '+' | '.join(frame.columns)+' |\n| '+' | '.join(['---']*len(frame.columns))+' |\n'+\
        '\n'.join('| '+' | '.join(f(v) for v in r)+' |' for r in frame.itertuples(index=False,name=None))


def main():
    if (RUN/'README.md').exists():raise FileExistsError('Report already exists')
    verify=json.loads((RUN/'verification.json').read_text())
    assert verify['status']=='passed'
    p=pd.read_csv(RUN/'predictions.csv.gz');m=pd.read_csv(RUN/'metrics.csv')
    c=pd.read_csv(RUN/'calibration_changes.csv');a=pd.read_csv(RUN/'partition_audit.csv')
    s=m[m.subgroup.eq('sensor_all')].groupby(['model','policy']).mae.mean().unstack()[['frozen','online','delay5']]
    summaries=[]
    for (policy,model),d in p.groupby(['policy','model']):
        for group,rows in [('sensor_all',d[d.recipe.ne('A123')]),('A123',d[d.recipe.eq('A123')])]:
            if not len(rows):continue
            v=m[(m.policy==policy)&(m.model==model)&(m.subgroup==group)]
            err=rows.prediction-rows.truth
            summaries.append({'policy':policy,'model':model,'subgroup':group,'n':len(rows),
                'macro_fold_mae':float(v.mae.mean()),'fold_mae_min':float(v.mae.min()),'fold_mae_max':float(v.mae.max()),
                'pooled_mae':float(err.abs().mean()),'pooled_mse':float(np.square(err).mean()),
                'pooled_rmse':float(np.sqrt(np.square(err).mean()))})
    pd.DataFrame(summaries).to_csv(RUN/'summary.csv',index=False)
    main_models=['recipe_mean','persistent','ewma','legacy_full125_rf','legacy_full125_bag',
        'legacy_primary73_rf','legacy_primary73_bag','new_conditions_rf','new_conditions_bag',
        'new_state_residual_rf','new_state_residual_bag']
    view=s.loc[main_models].reset_index()
    online_gain=100*(1-s.loc['new_state_residual_rf','online']/s.loc['legacy_primary73_rf','online'])
    ewma_gain=100*(1-s.loc['new_state_residual_rf','online']/s.loc['ewma','online'])
    delay_loss=100*(s.loc['new_state_residual_rf','delay5']/s.loc['ewma','delay5']-1)
    a123=m[m.subgroup.eq('A123')].groupby(['model','policy']).mae.mean().unstack()[['frozen','online','delay5']].reset_index()
    chosen=m[m.subgroup.eq('sensor_all')&m.model.isin(['ewma','legacy_primary73_rf','new_state_residual_rf'])]
    chosen=chosen.pivot(index=['policy','fold'],columns='model',values='mae').reset_index()
    pressure=m[m.policy.eq('online')&m.model.isin(['ewma','legacy_primary73_rf','new_state_residual_rf'])&m.subgroup.isin(['pressure_shift','without_pressure_shift'])]
    pressure=pressure.groupby(['model','subgroup']).mae.mean().unstack().reset_index()
    text=f'''# 팀 전처리 자료: 동일 조건 모델 비교와 전처리 검증

2026-09-29. **즉시 측정 갱신 조건에서 새 상태 추적+RF 잔차 보정은 MAE {s.loc['new_state_residual_rf','online']:.4f}**입니다. 기존 73특징 RF {s.loc['legacy_primary73_rf','online']:.4f}보다 {online_gain:.2f}% 낮지만, 단순 EWMA {s.loc['ewma','online']:.4f}에 비하면 {ewma_gain:.2f}% 차이입니다. 측정이 지연될 때는 EWMA가 더 좋고, 측정 갱신이 없을 때는 기존 RF가 더 좋습니다. 하나의 모델이 모든 조건에서 개선됐다고 볼 수 없습니다.

## 무엇을 같은 조건으로 맞췄나

- 제공 자료와 기존 학습 데이터의 1,977개 (wafer_id, stage)·정답이 일치합니다. 센서 비교 대상은 A456 798개, B456 815개이며, fold 2~5 평가 합계 **1,286개**입니다. A123은 총 364개 중 평가 **295개**를 별도로 비교했습니다.
- 제공 fold 1~5를 시간순으로 유지했습니다. 평가 웨이퍼와 같은 ID, 경계 전에 끝나지 않은 기록, delay5에서 학습 시점까지 측정이 공개되지 않은 행을 모든 모델의 학습에서 함께 제외했습니다. 평가 행은 제거하지 않았습니다.
- 모든 모델에 같은 전체 공정 로그 start/end와 측정 공개 시점을 적용했습니다. frozen은 평가 정답을 갱신하지 않으며 online은 완료 즉시, delay5는 같은 테이블의 관측된 후속 5개 공정이 끝난 뒤 정답을 공개한다고 가정합니다. 실제 측정 시점 데이터가 없으므로 이 세 가지는 시나리오입니다.
- 같은 트리 구조·seed 3개를 사용하며 평가 점수로 설정을 바꾸지 않았습니다. frozen/online은 학습 모델을 공유합니다. delay5는 학습용 이력도 지연시켜 별도로 적합했습니다. 평가 중에는 모델 계수를 다시 학습하지 않습니다.
- 기존 모델은 staged v4의 125/73특징 RF·Bagging 구성을 새 분할에서 다시 학습한 것입니다. 이전 가중치를 그대로 평가하거나 세 논문의 모든 모델을 다시 구현한 것이 아닙니다.
- 새로운 모델은 입력 허용 숫자 조건 20개만 사용하는 대조군과, 그 조건 및 공개된 상태 특징 5개로 EWMA 잔차를 예측하는 후보입니다. 이력 표현·특징·알고리즘이 함께 달라졌으므로 차이를 전처리 한 가지의 효과로 단정하지 않습니다.

## 모델별 성능

아래는 **fold 2~5 MAE의 단순 평균**입니다. 낮을수록 좋습니다. MSE/RMSE나 예전 공식 Test 숫자와 직접 비교하지 않습니다. RF는 max_features=0.7, Bagging은 1.0이며 모두 100 trees, min_samples_leaf=5, bootstrap=True입니다.

{table(view)}

전체 평가 행을 합친 pooled MAE/RMSE와 fold별 범위는 [summary.csv](summary.csv), 모든 레시피·압력 변경 포함/제외 값은 [metrics.csv](metrics.csv)에 있습니다. 데이터에 맞춰 가장 낮은 Test 모델을 다시 선택하거나 배포하지 않았습니다.

### 구간별로 확인할 점

{table(chosen)}

온라인 잔차 보정의 약 {ewma_gain:.2f}% 차이는 작습니다. 네 시점 구간만으로 확실한 우월성을 입증하지 않았습니다. delay5에서는 잔차 RF의 MAE가 단순 EWMA보다 **{delay_loss:.2f}% 높았습니다**. 새 측정이 없으면 상태 보정이 장비 변화를 따라잡지 못해 기존 특징 RF보다 크게 나빠집니다.

### 압력 설정 변경 웨이퍼

다음은 online에서 fold별 MAE를 평균한 값입니다. 설정 변경 판단의 레시피 기준 압력도 학습 구간에서만 계산했습니다. 메인·센터·엣지 압력이 같이 변했으므로 독립적인 압력 인과 효과로 해석하지 않습니다.

{table(pressure)}

### A123 별도 비교

{table(a123)}

A123에는 이번 실험에서 센서 RF/Bagging을 적용하지 않았습니다. 전체 1,977개에서 센서 모델 하나의 성능인 것처럼 합산하지 않습니다.

## 문서의 2.74와 이번 2.96은 왜 다른가

제공 example.py의 수식을 CSV에 다시 적용하면 평균 기준 **7.18**, 상태 추적 **2.74**가 재현됩니다. [원래 예제 재계산](supplied_example_recomputed.csv).

이번 비교는 원래 예제와 달리 전체 로그 종료까지 기다려 측정이 공개된 것으로 처리하고, 학습/평가 경계의 동일 웨이퍼와 지연 측정을 제거합니다. 원래 예제는 같은 레시피의 앞선 학습표 행을 바로 사용합니다. 따라서 점수가 달라지는 것은 모델 향상·악화만을 뜻하지 않습니다. 개별 조건의 기여도를 따로 분리한 실험은 하지 않았습니다.

문서의 상태+데이터 보정 **2.63**은 `kp_model.py`, `fit_kp.py`가 제공되지 않아 검증하지 못했습니다. 이번 잔차 RF는 별도 후보이며 그 모델의 재현이라고 부르지 않습니다.

## 전처리 검증과 보완

원본 185개 CSV와 기존 파일 해시가 일치합니다. 원시 672,744행, 완전 중복 제거 후 670,925행, 타임스탬프 충돌 804행, 주 연마 챔버 361,497행을 확인했습니다. 서로 다른 챔버가 같은 시각에 기록된 충돌 1건은 챔버 2/3에만 있어 주 연마 요약에 영향을 주지 않습니다.

압력 평탄 ±2%·슬러리 50%·시간 간격 10초 상한을 유지하면서 물리 요약을 독립 재구성했습니다. 센서·소모품·시각·정답 등 **19개 열**이 제공 표와 허용 오차 안에서 일치했습니다. 시간 가중치는 웨이퍼별로 계산하여 다른 웨이퍼와 연결되지 않게 했습니다.

기존 전처리의 전체 기간 패드/드레서 증가량과 레시피 중앙값을 **각 학습 fold에서만 추정하는 FoldPreprocessor**로 교체했습니다. 제공 prev_mrr/prev_wafers_back은 그대로 사용하지 않고 실제 공개된 참조 측정으로 재계산합니다. 미래 자료에 의존하는 변경 내역은 다음과 같습니다.

{table(c[c.changed_rows.gt(0)])}

이는 해당 열의 값이 바뀐 행 수이며 MAE 개선량이 아닙니다. fold 3~5에서는 제공 전체 기간 계수와 학습 기간 계수가 같아 이번 표의 차이가 없었습니다. 결측 대체도 모델별 학습 입력에만 적합합니다. 전처리의 원래 47개 열이나 ZIP을 덮어쓰지 않았습니다.

시간·압력 적분·식별 플래그는 신규 모델의 입력에서 제외합니다. 기존 125/73모델은 역사적 특징 구성을 보존한 비교 대조군입니다. 제공 문서의 입력 제한은 교육용 제어·해석 목적에 맞춘 방침이며, 공정 종료 후 예측을 다룬 기존 논문 전체가 잘못됐다는 뜻은 아닙니다.

{table(a)}

## 검증과 보존

- 384개 seed 모델 적합, 128개 모델 파일, 45,093개 예측을 저장했습니다.
- 지표 {verify['metric_rows_recomputed']}행을 예측에서 다시 계산했습니다. 측정 이력 {verify['history_references_checked']:,}개 참조의 시점·분할·웨이퍼 키를 확인했고 위반은 0건입니다.
- 저장 모델 128개를 다시 로드하고 처음/중간/마지막 평가 예측 총 {verify['prediction_spot_checks']}개를 확인했습니다. 최대 차이는 {verify['max_reload_difference']:.3g}입니다.
- 실제 데이터 4개 fold의 미래 입력 변경 불변성과 학습 전처리 계수 재계산을 확인했습니다. 전체 자동 테스트 **162개 통과**, 기존 의존성/분류 확률 경고 4개가 있습니다.
- 기존 결과 파일 {verify['old_artifacts_unchanged']:,}개를 해시로 보존 확인했습니다. 이전 공식 Validation/Test 정답은 새 학습·선택·평가에 사용하지 않았습니다. 이미 노출된 개발 데이터의 후속 실험이며 새 독립 검증은 아닙니다.

[실험 전 계획](PROTOCOL.md), [검증 결과](verification.json), [원본 재구성 검사](preprocessing_audit.json), [행별 예측](predictions.csv.gz), [측정 공개 일정](measurement_schedule.csv), [측정 참조](history_references.csv.gz).

## 시뮬레이터 반영 방향

[Unity/API 설계서](../../docs/simulator-state-design.md)를 작성했습니다. 측정 주기·공개 지연·상태 나이를 보이는 재생 과업이 우선입니다. 압력은 레시피별 관측 설정 묶음 안에서 다루고 A123은 상태 추적으로 분리합니다. MRR 단위가 확인되기 전에는 실제 초 단위 권장 시간을 계산하지 않고 기준 대비 시간 비율을 표시합니다.

센서 요약은 공정이 끝나야 계산되는 값입니다. 이번 예측 성능만으로 공정 전 조작 슬라이더의 효과를 검증했다고 볼 수 없습니다. 기존 API/Unity 모델은 유지하며 이 설계의 UI 구현이나 배포는 수행하지 않았습니다.

## 다시 실행하기

원본과 제공 ZIP은 Git에 포함하지 않았습니다. 현재 연구 환경과 동일한 기존 학습 캐시·원본 경로가 필요합니다. 완료 run을 덮어쓰지 않으므로 새 실행에서는 도구의 RUN/CACHE를 새 이름으로 지정하고 계획을 다시 고정해야 합니다.

```powershell
$env:PYTHONPATH='src'
python tools/run_team_comparison.py --archive <preprocessed.zip 경로>
python tools/verify_team_comparison.py --archive <preprocessed.zip 경로>
python tools/report_team_comparison.py
python -m pytest -q
```
'''
    (RUN/'README.md').write_text(text,encoding='utf-8')
    paths=[RUN/'summary.csv',RUN/'README.md',ROOT/'docs/simulator-state-design.md',Path(__file__),ROOT/'tools/verify_team_comparison.py',RUN/'verification.json']
    (RUN/'report_hashes.json').write_text(json.dumps({p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in paths},indent=2)+'\n',encoding='utf-8')
    print(view.to_string(index=False));print('Online gain over legacy RF:',online_gain,'%; over EWMA:',ewma_gain,'%')


if __name__=='__main__':main()
