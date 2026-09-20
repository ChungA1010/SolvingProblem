"""Generate a report directly from the sealed staged experiment metrics."""
from pathlib import Path
from collections import Counter
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from cmp_ml.common import read_json,write_json,sha256

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'runs/phm_cmp_staged_v4'
metrics=pd.read_csv(RUN/'metrics.csv')
paired=pd.read_csv(RUN/'paired_comparisons.csv')
main=metrics.query("cohort_variant == 'clean' and condition == 'all'")
selected=['full125_rf','full125_bag','primary73_rf','primary73_bag','compact12_rf','compact12_bag',
          'compact33_rf','compact33_bag','S1_features','S2_phase','S3_history','S4_final','condition_mean','persistent']
evaluations=['group_oof','temporal','validation','test']


def table(frame):
    def fmt(v):
        return f'{v:.4f}' if isinstance(v,(float,np.floating)) else str(v)
    return '| '+' | '.join(frame.columns)+' |\n| '+' | '.join(['---']*len(frame.columns))+' |\n'+\
        '\n'.join('| '+' | '.join(fmt(v) for v in row)+' |' for row in frame.itertuples(index=False,name=None))


def pivot(metric='rmse', models=selected, cohort='clean'):
    f=metrics.query('cohort_variant == @cohort and condition == "all"')
    return f.pivot(index='model',columns='evaluation',values=metric).loc[models,evaluations].reset_index()


gate=paired[paired.evaluation.isin(['group_oof','temporal'])&paired.candidate.eq('S4_final')]
passed=bool((gate.rmse_improvement_pct>0).all())
confident=bool((gate.bootstrap_low_pct>0).all())
conclusion='고정한 두 125특징 대조군보다 그룹·시간순 RMSE가 모두 낮았습니다.' if passed else '그룹·시간순에서 두 125특징 대조군을 모두 이기는 채택 기준은 충족하지 못했습니다.'
confidence='대응 그룹 재표집 구간도 모두 양수입니다.' if confident else '일부 대응 그룹 재표집 구간이 0을 포함하거나 음수여서, 안정적인 우월성은 확인되지 않았습니다.'
details={p.stem:read_json(p) for p in (RUN/'fit_details').glob('*.json')}
spec_rows=[]
for condition in ('Cond1','Cond2','Cond3'):
    d=details[f'final_{condition}']
    for stage,s in d['selections'].items():
        spec_rows.append({'condition':condition,'stage':stage,**s,'inputs':len(d['input_names'][stage])})
spec_table=pd.DataFrame(spec_rows)
spec_table.to_csv(RUN/'selected_specifications.csv',index=False)

# Context comparison: same rows/splits and completed-only history, but multiple procedures differ.
old=pd.read_csv(ROOT/'runs/phm_cmp_robust_v2/metrics.csv')
old=old.query("policy == 'completed' and model == 'selected' and dimension == 'all'").copy()
old['evaluation']=old.evaluation.replace({'nested_oof':'group_oof'})
historic=[]
for e in evaluations:
    a=old.loc[old.evaluation.eq(e)].iloc[0]
    b=main.loc[main.evaluation.eq(e)&main.model.eq('S4_final')].iloc[0]
    historic.append({'evaluation':e,'robust_v2_rmse':a.rmse,'staged_v4_rmse':b.rmse,
                     'rmse_improvement_pct':100*(1-b.rmse/a.rmse),'robust_v2_mse':a.mse,'staged_v4_mse':b.mse})
historic=pd.DataFrame(historic)
historic.to_csv(RUN/'historical_comparison.csv',index=False)
incumbent_better=bool((historic[historic.evaluation.isin(['group_oof','temporal'])].rmse_improvement_pct>0).all())
incumbent_note=('기존 robust v2와 비교해도 그룹·시간순 RMSE가 모두 낮아졌습니다.' if incumbent_better else
                '기존 robust v2보다 그룹·시간순 RMSE가 모두 좋아진 것은 아니므로, 기존 모델을 대체할 근거는 충분하지 않습니다.')

stage_rows=[]
for e in evaluations:
    previous=main.loc[main.evaluation.eq(e)&main.model.eq('full125_bag')].iloc[0]
    for model in ('S1_features','S2_phase','S3_history','S4_final'):
        row=main.loc[main.evaluation.eq(e)&main.model.eq(model)].iloc[0]
        stage_rows.append({'evaluation':e,'stage':model,'rmse':row.rmse,'mse':row.mse,
                           'rmse_improvement_vs_previous_pct':100*(1-row.rmse/previous.rmse)})
        previous=row
stage_rows=pd.DataFrame(stage_rows)
stage_rows.to_csv(RUN/'stage_changes.csv',index=False)

fig,axes=plt.subplots(1,2,figsize=(12,4.7))
chart_models=['full125_rf','full125_bag','S1_features','S2_phase','S3_history','S4_final']
for ax,e,title in zip(axes,['group_oof','temporal'],['Grouped out-of-fold (n=1977)','Purged future holdout (n=166)']):
    values=main[main.evaluation.eq(e)].set_index('model').loc[chart_models,'rmse']
    bars=ax.bar(np.arange(len(values)),values,color=['#8b99a9','#5a6b7c','#4e8ed4','#32a6a0','#7aa943','#d69335'])
    ax.set_xticks(np.arange(len(values)),['125 RF','125 Bag','Features','Phase','History','Final'],rotation=25,ha='right')
    ax.set_title(title);ax.set_ylabel('RMSE (lower is better)');ax.set_ylim(0,max(values)*1.18)
    ax.bar_label(bars,fmt='%.3f',padding=3,fontsize=9)
    ax.spines[['right','top']].set_visible(False)
fig.suptitle('Sequential CMP improvement: outer evaluation only',fontweight='bold')
fig.tight_layout();fig.savefig(RUN/'comparison.png',dpi=170);plt.close(fig)

condition=metrics.query("cohort_variant == 'clean' and evaluation in ['group_oof','temporal'] and model in ['full125_rf','full125_bag','S4_final'] and condition != 'all'")
diag=main[main.model.str.startswith('ablation_')].pivot(index='model',columns='evaluation',values='rmse').reindex(columns=evaluations).reset_index()
sens=metrics.query("cohort_variant != 'clean' and condition == 'all' and model in ['full125_bag','S4_final']")
uncertainty=gate[['evaluation','baseline','baseline_rmse','candidate_rmse','rmse_improvement_pct','bootstrap_low_pct','bootstrap_high_pct','groups']]
protocol=read_json(RUN/'protocol.json');completion=read_json(RUN/'completion.json')
score_count=sum(len(d['fold_scores']) for d in details.values())
fit_count=sum(sum(row['spec'].split('|')[-1] not in ('mean','persistent') for row in d['fold_scores']) for d in details.values())
quality=pd.read_csv(RUN/'quality.csv')
empty=quality[(quality.cohort=='training')&quality.sample_id.isin(pd.read_csv(RUN/'manifest.csv').sample_id)].groupby('condition').qc_active_count.apply(lambda x:int((x==0).sum()))

text=f'''# CMP 특징·연마 구간·이력 순차 개선 v4

요청한 순서대로 125/73/12(+이력 연결 대조군 33) 특징 비교, 연마 구간 비교, 과거 이력 개선, 조건별 평균/직전값 대체까지 학습·평가했습니다. **{conclusion}** {confidence} {incumbent_note} 기존 논문 baseline과 API/Unity 모델은 보존했습니다.

이 보고서의 감소율은 **RMSE의 상대 감소율**입니다. MSE와 백분율 오차를 혼용하지 않습니다. 공식 Test는 이미 여러 차례 확인한 참고 자료이며, 이번 결과는 새 독립 검증이 아닙니다.

![단계별 그룹·시간순 RMSE](comparison.png)

## 동일 조건의 결과

모든 새 대조군은 완료된 과거 Train 이력만 사용합니다. RF/Bagging 설정과 각 외부 평가의 표본은 동일합니다. 125/73은 원래 논문 모델의 모든 절차를 재현한 결과가 아니라 새로 고정한 단순 트리 대조군입니다. compact12에는 이력이 없고 compact33에는 동일한 21개 이력이 있습니다.

{table(pivot())}

S1~S4는 평가 데이터를 보고 고른 최솟값이 아닙니다. 각 바깥 학습 부분에서 내부 그룹/시간 평가로 순차 선택한 **절차**의 바깥 예측 결과입니다. 각 단계는 이전 설정을 후보에 유지하지만, 내부 점수가 좋아져도 바깥 점수는 나빠질 수 있습니다.

## 단계별 추가 효과

첫 행의 이전 기준은 full125_bag이며, 그다음은 바로 앞 단계입니다. 음수는 악화입니다. 그룹 평가에서 가장 큰 추가 감소는 이력 선택 단계에서 나타났지만, 시간순에서 특징 선택 단계의 악화를 만회하지 못했습니다. 시간순 표준 B에서 내부 검증으로 선택된 12변수 RF의 RMSE는 5.2060으로, 고정 125특징 RF의 4.0190보다 높았습니다.

{table(stage_rows[stage_rows.evaluation.isin(['group_oof','temporal'])])}

## 최종 모델 개선 폭과 불확실성

{table(uncertainty)}

구간은 2,000회 대응 연결 그룹 재표집의 2.5~97.5 백분위입니다. 시간순 평가는 같은 11개 연결 그룹만 포함하므로 시간 의존성과 작은 그룹 수에 대한 한계가 있습니다. 모델 재학습/선택의 불확실성이나 다중 비교 보정까지 반영한 확증 구간이 아닙니다.

## 기존 완료 이력 모델과 비교

같은 표본·바깥 분할의 robust v2 `completed/selected`와 비교했습니다. 모델 종류, 입력, 내부 선택 방식 등이 함께 달라 단일 수정의 효과로 해석할 수 없습니다. 기존 논문 비교용 retrospective 통합 모델 Test MSE 7.0743과 이 수치를 섞어 순위를 매기지 않습니다.

{table(historic)}

## 조건별 그룹·시간순 결과

{table(condition[['evaluation','model','condition','n','rmse','mae','p95_abs_error']])}

최종 전체 Train 적합에서 고른 설정은 다음과 같습니다. 각 외부 fold는 자신의 Train만으로 따로 선택했으며 전체 Train 설정으로 외부 fold를 재평가하지 않았습니다.

{table(spec_table)}

## 12변수 정의와 묶음 제거 검사

12개 입력 = 소모품 3종 평균 + 압력 4종 평균 + wafer/head 회전 평균 + slurry C 평균 + 연마 시간 + 고유 timestamp 수입니다. Claude 자료에는 core 7의 정확한 공식과 실행 코드가 없으므로, 이를 **명시적으로 정의한 검증용 후보**로 구현했습니다. count를 stage rotation 평균으로 바꾼 대안도 평가했습니다. 아래 진단은 primary 활성 구간을 쓰며 최종 선택 후보에는 포함하지 않았습니다.

{table(diag)}

진단 값은 삭제하면 항상 좋아진다는 주장이나 센서의 물리적 인과 효과를 입증하지 않습니다. 모든 비교에서 같은 조건의 평균 모델을 함께 평가했습니다. 고속 Cond3의 ML 사용을 사전에 금지하지 않았습니다.

## 극단값 포함 민감도

full1981은 네 극단값을 포함해 재학습하고 해당 fold에 배정된 모든 표본을 평가합니다. full_fit_clean_eval은 같은 재학습 모델을 원래 clean 평가 표본에서만 평가합니다. 선택 설정은 clean Train 내부에서 미리 정한 그대로입니다.

{table(sens[['cohort_variant','evaluation','model','n','mse','rmse']])}

네 극단값을 계측 오류로 확정하지 않았습니다. 제외 정책을 바꾸면 대상 문제 자체가 달라질 수 있으므로 두 집단의 최저 점수를 섞어 선택하지 않습니다.

## 검증·산출물

- 21개 바깥/전체 적합 작업, 각 작업에서 3개 내부 그룹 fold와 1개 purged 시간 holdout. 내부 후보 평가 {score_count}건, 트리 모델 내부 적합 {fit_count}건.
- 최종/바깥 트리는 3개 고정 seed 예측을 평균. 전체 지표에 seed별 RMSE 범위와 MAE·상위 5% 오차 경계를 기록했습니다.
- 보고서 수정 후 전체 테스트 156개 통과(기존 경고 4개). 신규 검사는 미래/동일 웨이퍼 이력 차단, 정확한 12/33개 입력 수, reset 시 이력 차단, 구간 공백·빈 구간 처리, 센서 특징의 정답 독립성, 참고 자료의 그룹 정보 누락 처리를 확인합니다. [테스트 기록](test_results.json).
- 참고용 Validation/Test에는 연결 그룹 식별자가 없어 대응 그룹 신뢰구간을 산출하지 않습니다. 최초 평가의 빈 그룹 집계에서 발생한 NaN 표시를 [보고서 전용 수정 기록](amendments/01_reference_intervals.json)으로 보완했습니다. 기존 코드·비교표·완료 기록을 보존했고 모델, 선택, 예측, MSE/RMSE/MAE 값은 변경하지 않았습니다. 이 경우의 회귀 검사를 추가한 신규 테스트 8개도 통과했습니다.
- 원본 555개 센서 파일 SHA-256 확인. 센서 통계에는 정답을 사용하지 않았습니다. 깨끗한 Train 중 활성 구간 없는 표본 수: {empty.to_dict()}. 이 표본들은 삭제하지 않고 결측을 학습 fold 안에서 처리했습니다.
- 각 후보의 모든 이력 참조는 다른 웨이퍼·동일 조건·동일 장비이며 원래 trace 종료 시점이 query 시작보다 이른 Train 표본만 사용합니다. 라벨 계측 지연은 없어 즉시 이용 가능하다고 가정했습니다.
- 모든 선택·모델·참고용 예측을 봉인한 뒤 이번 실행의 Test 정답을 읽었습니다. 총 예측 {completion['prediction_rows']:,}행, 재로딩 최대 차이 {completion['max_model_reload_difference']:.3g}, 이전 산출물 {completion['historical_files_preserved']:,}개 해시 유지.
- 연마 후 전체 trace를 사용하는 가상 계측 모델입니다. 실제 공정 전에 슬라이더를 바꿔 결과를 예측하는 인과 시뮬레이터로 검증된 것은 아닙니다.

[고정 계획](PROTOCOL.md) · [전체 지표](metrics.csv) · [fold별 지표](fold_metrics.csv) · [대응 비교](paired_comparisons.csv) · [모델 파일·해시](training_complete.json) · [분할 검사](partition_audit.json) · [재검증](verification.json)

실행: `python -m cmp_ml.staged_experiment prepare`, `train`, `evaluate` 순서. 완료된 디렉터리는 덮어쓰지 않습니다. 최종 재검증은 `python tools/verify_staged.py`, 보고서 생성은 `python tools/report_staged.py`입니다. 원본 데이터는 저장소에 포함하지 않습니다.
'''
(RUN/'README.md').write_text(text,encoding='utf-8')
write_json(RUN/'report_summary.json',{'main_gate_passed':passed,'all_bootstrap_intervals_positive':confident,
    'incumbent_group_and_time_improved':incumbent_better,
    'inner_candidate_evaluations':score_count,'inner_tree_fits':fit_count,'historical_comparison':historic.to_dict('records'),
    'main_comparisons':uncertainty.to_dict('records'),'report_sha256':sha256(RUN/'README.md')})
print(json.dumps(read_json(RUN/'report_summary.json'),ensure_ascii=False,indent=2))
