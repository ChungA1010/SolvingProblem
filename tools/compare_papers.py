"""Compare transcribed primary-paper tables to immutable v2 reproduction predictions."""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from cmp_ml.baselines import check_hash
from cmp_ml.common import read_json, sha256, utcnow, write_json
from cmp_ml.improvement import ROOT
from cmp_ml.reconstruction import read_frame
from verify_robust import score, table

RUN = ROOT/'runs/phm_cmp_final_comparison'
REPRO = ROOT/'runs/phm_cmp_reconstruction_v2'

# User-provided PDFs, visually checked against the printed tables on 2026-09-19.
# Order of the P1 values is R2, RMSE, RE, published S-score.
P1 = {
    ('test','A'): {
        'GBT':(.970,6.552,.051,1.674), 'RF':(.981,5.395,.046,.512), 'ERT':(.966,7.048,.050,3.723),
        'CART_Stack':(.983,5.065,.047,.479), 'ELM_Stack':(.984,4.795,.043,.446)},
    ('test','B'): {
        'GBT':(.687,4.781,.047,.440), 'RF':(.722,4.598,.045,.419), 'ERT':(.701,4.792,.048,.444),
        'CART_Stack':(.725,4.500,.044,.404), 'ELM_Stack':(.727,4.485,.044,.404)},
    ('validation','A'): {
        'GBT':(.977,5.415,.043,.500), 'RF':(.976,5.514,.045,.511), 'ERT':(.973,5.920,.046,.564),
        'CART_Stack':(.987,3.987,.035,.335), 'ELM_Stack':(.986,4.208,.037,.370)},
    ('validation','B'): {
        'GBT':(.721,5.032,.052,.493), 'RF':(.734,5.059,.051,.490), 'ERT':(.763,4.947,.051,.487),
        'CART_Stack':(.826,4.082,.041,.370), 'ELM_Stack':(.788,4.405,.047,.410)},
}
P2 = {'Integrated':7.07,'Persistent':8.23,'KNN':9.60,'SVR':7.44,'LR':7.32,'Bagging':7.22,'DBN':7.29}
P3 = {'RF':7.6,'RF_CPP':7.4,'Ensemble_NN':8.2}
SOURCES = [
    {'paper':'P1','title':'Prediction of Material Removal Rate for Chemical Mechanical Planarization Using Decision Tree-Based Ensemble Learning',
     'year':2019,'url':'https://doi.org/10.1115/1.4042051','pdf_page':11,'tables':['7 (Stage A)','8 (Stage B)']},
    {'paper':'P2','title':'Enhanced Virtual Metrology on Chemical Mechanical Planarization Process using an Integrated Model and Data-Driven Approach',
     'year':2017,'url':'https://papers.phmsociety.org/index.php/ijphm/article/view/2641','pdf_page':7,'tables':['5 (testing data)']},
    {'paper':'P3','title':'Assessment of Physics-Based and Data-Driven Models for Material Removal Rate Prediction in Chemical Mechanical Polishing',
     'year':2018,'url':'https://www.atlantis-press.com/proceedings/iceea-18/25894228','pdf_page':5,'tables':['II (Real test MSE)']},
]


def recalculate(frame):
    result = []
    for (split, model, repeat), f in frame.groupby(['split','model','repeat']):
        assert f.sample_id.is_unique and len(f)==424
        for stage in ['all','A','B']:
            b=f if stage=='all' else f[f.STAGE.eq(stage)]
            s=score(b)
            error=b.prediction.to_numpy()-b.truth.to_numpy()
            relative=np.mean(np.abs(error)/np.abs(b.truth.to_numpy()))
            exponent=np.where(error<0,-error/13,error/10)
            assert exponent.max()<700
            result.append({'split':split,'model':model,'repeat':repeat,'stage':stage,**s,
                'relative_error':relative,'mape_percent':100*relative,'s_score_literal_mean':np.exp(exponent).mean(),
                's_score_minus_one_mean':np.expm1(exponent).mean()})
    return pd.DataFrame(result)


def check_metrics(actual, stored):
    keys=['split','model','repeat','stage']
    cols=['n','mse','rmse','mae','r2','relative_error','mape_percent','s_score_literal_mean','s_score_minus_one_mean']
    a=actual.set_index(keys).sort_index(); b=stored.set_index(keys).sort_index()
    assert a.index.equals(b.index)
    np.testing.assert_allclose(a[cols],b[cols],rtol=1e-10,atol=1e-10)


def build_comparison(metrics, repeated):
    rows=[]
    for (split,stage),models in P1.items():
        for name,values in models.items():
            key='P1_'+name
            current=metrics[metrics.split.eq(split)&metrics.stage.eq(stage)&metrics.model.eq(key)].iloc[0]
            reps=repeated[repeated.split.eq(split)&repeated.stage.eq(stage)&repeated.model.eq(key)]
            assert len(reps)==20 and set(reps['repeat'])==set(range(20))
            for metric,published in zip(['r2','rmse','relative_error','s_score'],values):
                ambiguous=metric=='s_score'; ours_metric='s_score_literal_mean' if ambiguous else metric
                ours=current[ours_metric]
                rows.append({'paper':'P1','table':'7' if stage=='A' else '8','pdf_page':11,'split':split,'stage':stage,
                    'model':key,'metric':metric,'direction':'higher' if metric=='r2' else 'lower','paper_value':published,
                    'implemented':True,'stored_seed0':ours,'repeat20_mean':reps[ours_metric].mean(),'repeat20_sd':reps[ours_metric].std(ddof=1),
                    'difference':np.nan if ambiguous else ours-published,
                    'relative_change_percent':np.nan if metric in ('r2','s_score') else 100*(ours/published-1),
                    'repeat_mean_change_percent':np.nan if metric in ('r2','s_score') else 100*(reps[ours_metric].mean()/published-1),
                    's_score_minus_one':current.s_score_minus_one_mean if ambiguous else np.nan,
                    'comparability':'formula_table_ambiguity' if ambiguous else 'partial_reproduction',
                    'source_url':SOURCES[0]['url']})
    for paper,published_models,page,tab in [('P2',P2,7,'5'),('P3',P3,5,'II')]:
        for model,published in published_models.items():
            key=paper+'_'+model
            b=metrics[metrics.split.eq('test')&metrics.stage.eq('all')&metrics.model.eq(key)]
            implemented=not b.empty
            ours=float(b.iloc[0].mse) if implemented else np.nan
            rows.append({'paper':paper,'table':tab,'pdf_page':page,'split':'test','stage':'all','model':key,
                'metric':'mse','direction':'lower','paper_value':published,'implemented':implemented,'stored_seed0':ours,
                'repeat20_mean':np.nan,'repeat20_sd':np.nan,'difference':ours-published,
                'relative_change_percent':100*(ours/published-1),'repeat_mean_change_percent':np.nan,'s_score_minus_one':np.nan,
                'comparability':'partial_reproduction' if implemented else 'not_implemented',
                'source_url':SOURCES[int(paper[1])-1]['url']})
    return pd.DataFrame(rows)


def paper_plot(comparison):
    fig,axes=plt.subplots(2,2,figsize=(13,9),layout='constrained')
    for ax,stage in zip(axes[0],['A','B']):
        b=comparison[comparison.paper.eq('P1')&comparison.split.eq('test')&comparison.stage.eq(stage)&comparison.metric.eq('rmse')]
        x=np.arange(len(b)); width=.27
        ax.bar(x-width,b.paper_value,width,label='Paper table',color='#94a3b8')
        ax.bar(x,b.stored_seed0,width,label='Stored seed 0',color='#3b82f6')
        ax.bar(x+width,b.repeat20_mean,width,yerr=b.repeat20_sd,capsize=3,label='20 repeats mean +/- SD',color='#0f766e')
        ax.set_xticks(x,b.model.str.replace('P1_','').str.replace('_Stack',' stacking'),rotation=20,ha='right')
        ax.set_title(f'P1 Stage {stage} | Test RMSE'); ax.set_ylabel('RMSE (lower is better)'); ax.legend(fontsize=8)
    for ax,paper in zip(axes[1],['P2','P3']):
        b=comparison[comparison.paper.eq(paper)&comparison.implemented]
        x=np.arange(len(b)); width=.35
        bars1=ax.bar(x-width/2,b.paper_value,width,label='Paper table',color='#94a3b8')
        bars2=ax.bar(x+width/2,b.stored_seed0,width,label='Our reproduction',color='#3b82f6')
        ax.bar_label(bars1,fmt='%.2f',fontsize=8,padding=3); ax.bar_label(bars2,fmt='%.2f',fontsize=8,padding=3)
        ax.set_xticks(x,b.model.str.replace(paper+'_',''),rotation=20,ha='right')
        ax.set_title(f'{paper} | official Test MSE'); ax.legend(fontsize=8)
        if paper=='P2': ax.set_yscale('log'); ax.set_ylim(4,800); ax.set_ylabel('MSE (log scale; lower is better)')
        else: ax.set_ylabel('MSE (lower is better)'); ax.margins(y=.2)
    for ax in axes.flat: ax.grid(axis='y',alpha=.2); ax.set_axisbelow(True)
    fig.suptitle('Published performance vs partial reproduction | conditions are not identical')
    fig.savefig(RUN/'paper_comparison.png',dpi=180); plt.close(fig)


def improvements():
    rows=[]
    for run_name,model,label in [('phm_cmp_improvement_v1','control','Stable v1'),('phm_cmp_robust_v2','selected','Robust v2'),
        ('phm_cmp_boosted_v3','selected','Group selection v3'),('phm_cmp_temporal_v4','selected','Time selection v4')]:
        f=read_frame(ROOT/'runs'/run_name/'metrics.csv')
        f=f[f.policy.eq('completed')&f.dimension.eq('all')&f.model.eq(model)]
        assert set(f.evaluation)=={'nested_oof','temporal','validation','test'},(run_name,list(f.model.unique()))
        rows.append({'procedure':label,**dict(zip(f.evaluation,f.mse))})
    return pd.DataFrame(rows)


def fmt(v): return '미구현' if pd.isna(v) else f'{v:.4f}'


def report(comparison, metrics, improved, verification):
    p1=comparison[comparison.paper.eq('P1')&comparison.split.eq('test')&comparison.metric.eq('rmse')].copy()
    p1['우리_20회_평균_SD']=[f'{a:.4f} ± {b:.4f}' for a,b in zip(p1.repeat20_mean,p1.repeat20_sd)]
    p1=p1.rename(columns={'stage':'Stage','model':'모델','paper_value':'논문_RMSE','stored_seed0':'우리_저장모델_RMSE',
        'relative_change_percent':'저장모델_증감_pct','repeat_mean_change_percent':'20회평균_증감_pct'})
    tables=[]
    for paper in ['P2','P3']:
        b=comparison[comparison.paper.eq(paper)].copy()
        b['우리_MSE']=b.stored_seed0.map(fmt)
        b['증감_pct']=b.relative_change_percent.map(lambda v:'—' if pd.isna(v) else f'{v:+.2f}%')
        tables.append(table(b.rename(columns={'model':'모델','paper_value':'논문_MSE'}),['모델','논문_MSE','우리_MSE','증감_pct']))
    alltest=metrics[metrics.split.eq('test')&metrics.stage.eq('all')].copy().sort_values('mse')
    alltest.to_csv(RUN/'our_common_test_ranking.csv',index=False)
    best=alltest.iloc[0]; worst=alltest.iloc[-1]
    latest=improved.set_index('procedure').loc['Time selection v4']
    text=f'''# 세 CMP 논문의 발표 성능과 구현 성능 — 최종 비교

요청한 후속 시간순 선택 실험까지 완료하고 **원문 표 ↔ 저장된 재현 모델 ↔ 20회 반복 결과**를 대조했다.
**세 논문 모두 원문과 완전히 동일한 성능으로 재현된 것은 아니다.** P2 통합 모델은 원문 7.07에 가까운
MSE **7.0743**을 얻었지만, P2 LR과 P1 Stage A 등은 큰 격차가 남아 있다.
가정·미구현 항목이 있는 부분 재현이며, 반올림한 점수의 일치가 알고리즘 전체의 일치를 증명하지 않는다.

## 기준과 출처

| 구분 | 논문 | 이번 비교 위치·지표 |
|---|---|---|
| P1 | [{SOURCES[0]['title']}]({SOURCES[0]['url']}) (2019) | PDF 11쪽 Table 7/8, Stage A/B의 Test RMSE·R²·RE·S-score |
| P2 | [{SOURCES[1]['title']}]({SOURCES[1]['url']}) (2017) | PDF 7쪽 Table 5, 공식 Test MSE |
| P3 | [{SOURCES[2]['title']}]({SOURCES[2]['url']}) (2018) | PDF 5쪽 Table II의 Real test MSE |

사용자가 제공한 PDF의 해당 표를 시각적으로 확인했다. [파일 이름·SHA256·원문 값](paper_sources.json).
P2 파일명의 2020은 논문 연도가 아니다. 아래 우리 수치는 보존된
[원문 조건 재구성 v2](../phm_cmp_reconstruction_v2/REPORT.md)의 저장 예측에서 다시 계산했다.
첫 구현 v1과 후속 제안 모델을 이 표의 우리 값으로 바꿔 넣지 않았다.

**MSE·RMSE·RE는 낮을수록, R²는 높을수록 좋다.** RMSE는 MSE의 제곱근이며 같은 수치 단위가 아니다.
증감률은 `(우리 지표 / 논문 지표 - 1) × 100`으로, 양수면 오차 증가다. 정확도의 증감률이 아니다.
MSE에 %를 붙여 '오차율 7.07%'로 표현하지 않는다. 원문은 반올림값이므로 격차도 그 값 기준이다.

## P1: Stage별 모델, Test RMSE

{table(p1,['Stage','모델','논문_RMSE','우리_저장모델_RMSE','저장모델_증감_pct','우리_20회_평균_SD','20회평균_증감_pct'])}

우리 저장 모델은 seed 0 실행이다. 20회 열은 seed 0–19의 평균과 표본 표준편차이며 저장 모델의 점수와 다르다.
논문은 계산 실험을 20회 반복한다고 설명하지만 표의 집계·seed까지 같다고 확인할 수는 없다.
SD는 반복 간 변동이며 신뢰구간이 아니다.

- 논문 Stage A/B의 최저 RMSE는 모두 ELM stacking **4.795 / 4.485**다.
- 우리 Stage A의 최저 RMSE는 GBT(저장 **7.5143**, 반복 평균 **7.3867**)이고,
  Stage B는 ELM stacking(저장 **4.5035**, 반복 평균 **4.6180**)이다.
- Stage B ELM 저장 결과는 원문 대비 약 **0.41%** 높지만, Stage A ELM은 약 **86.91%** 높다.
  특정 Stage의 가까운 결과를 전체 논문의 재현 성공으로 확대하지 않는다.
- 원문 Table 6은 전체 공정용 모델이다. 우리 Stage별 모델을 합친 점수와 Table 6을 같은 실험으로 비교하지 않았다.
- R²·RE·Validation 결과도 [전체 지표 대조표](paper_metric_comparison.csv)에 포함했다.
  S-score는 원문 식의 exp 값이 1 이상인 반면 표에는 1 미만 값이 있어 정의에 모호성이 있다.
  식 그대로의 exp 평균과 exp−1 평균을 모두 보존하고, 원문 S-score와의 개선률·순위는 계산하지 않았다.

## P2: 공식 Test MSE

{tables[0]}

**통합 모델 7.07 → 7.0743(+0.0610%)**은 두 자리까지 같고, Bagging은 7.22 → 7.1702다.
그러나 **LR 7.32 → 351.1079**는 큰 불일치다. 통합 결과만으로 개별 모델들이 원문대로 재현됐다고 판단할 수 없다.
DBN은 논문 비교표에 등장하지만 이번 baseline에는 구현하지 않았다.
Table 4의 내부 CV MSE와 Table 5의 Test MSE는 서로 다른 평가이므로 섞지 않았다.

## P3: 공식 Real test MSE

{tables[1]}

RF의 CPP 보정으로 우리 MSE는 **9.4774 → 8.6851**로 낮아졌지만,
원문 보정 RF **7.4**보다 약 **17.37%** 높다. 원문의 Self test 7.2와 Real test 7.4는 구분했다.
Ensemble Neural Network와 전체 GA 특징 탐색은 구현하지 않았다.

## 우리 구현끼리 같은 Test에서 비교하면

13개 구현의 공식 Test ID 424개와 정답이 동일함을 확인했다. 이 저장 예측 범위에서는
가장 낮은 전체 MSE가 **{best.model}: {best.mse:.4f}**, 가장 높은 값이 **{worst.model}: {worst.mse:.4f}**다.
[전체 13개 순위·MSE·RMSE·R²](our_common_test_ranking.csv).
P1 다섯 모델 안에서는 전체 Test의 GBT MSE **42.0792**가 가장 낮다.

이는 현재 구현의 수치 비교다. P2는 다른 Train 표본의 계측 제거율 이력을 사용하고,
P3는 ID·CPP 특징을 사용하며 P1은 공정 통계 중심이어서 입력 정보가 동일하지 않다.
따라서 이 순위를 세 논문의 일반적인 알고리즘 우열이나 새로운 웨이퍼의 독립 예측 성능으로 해석하지 않는다.

## 추가 오차 감소 실험: 논문 재현과 별도

이 표는 **완료된 과거 공정의 Train 계측값만 참조**하는 정책으로 비교한 제안 모델 절차다.
논문 비교 P2의 7.0743은 이웃/이력 허용 조건이 달라 이 표에 합치지 않았다.
모든 행은 동일한 바깥 그룹 분할·시간순 표본·공식 Validation/Test를 사용한다.

{table(improved,['procedure','nested_oof','temporal','validation','test'])}

최신 v4는 그룹 내부 선택 대신 여러 시점의 시간순 내부 검증으로 선택했다.
그룹 MSE **{latest.nested_oof:.4f}**, 시간순 **{latest.temporal:.4f}**, 기존 Test **{latest.test:.4f}**다.
세 평가 모두 기존 robust v2보다 악화되어 추가 오차 감소에 성공하지 못했다. 이 후보로 기존 모델을 교체하지 않는다.
[v4 전체 결과·모델·검증](../phm_cmp_temporal_v4/README.md).
후속 연구 점수는 논문의 발표 수치를 재현한 것으로 표시하지 않는다. API/Unity에 자동 반영하지 않았다.

## 격차가 남는 구체적 이유와 범위

1. **공통:** 저자 코드·정확한 난수 상태·전처리 분기 전체가 제공되지 않았다.
   공식 Train 1,981건 중 선택된 4개 Stage A 극단값을 제외해 1,977건으로 학습했고,
   원문 해석과 후보 선택에 이미 보았던 Validation을 사용했다. 공식 Test도 이전에 확인한 자료다.
   Train/Test 사이 동일 웨이퍼의 다른 Stage가 있을 수 있어 완전히 새 웨이퍼 평가가 아니다.
2. **P1:** 발표된 최종 35개 특징은 구현했지만 모든 85개 후보의 탐색을 재연하지 않았다.
   스태킹·ELM 세부 설정과 R² 식 해석에 가정이 있다. v2는 Validation으로 선택한 해석을 고정했다.
3. **P2:** 사용량 기반 이웃·prior-start lag·특징 투표·CV·수치적으로 안정화한 OLS에 해석과 보완이 들어갔다.
   미세 설정을 정확히 복원한 저자 코드가 아니며, LR의 큰 차이 원인을 한 가지로 확정하지 않는다.
4. **P3:** 발표된 최종 특징과 RF/CPP 보정은 구현했지만 GA와 NN은 빠져 있다.
   polishing phase 경계와 CPP 구성의 해석 차이가 남고 원문의 run/CPP 개수도 정확히 일치하지 않는다.

완료한 것은 **정해 둔 부분 재현·후속 실험·검증·비교**다. 미구현 NN/DBN/전체 GA나
저자 구현과의 완전한 동등성까지 완료했다는 의미는 아니다.
[원문 대응 설명](../../docs/paper-reproduction.md), [v2 가정·변경](../../docs/paper-reconstruction-v2.md).

## 재계산과 공유

- 저장된 재현 예측 지표 {verification['saved_metric_rows_recomputed']}행과
  20회 반복 지표 {verification['repeat_metric_rows_recomputed']}행을 직접 재계산했다.
- 원문 대조 {len(comparison)}행에는 미구현 표시 및 S-score 정의 불일치 표시도 포함한다.
- [입력·보고서 생성 코드 해시](verification.json), [전체 지표 CSV](paper_metric_comparison.csv),
  [후속 연구 비교 CSV](improvement_comparison.csv), [산출물 해시](artifact_manifest.json).
- `python tools/compare_papers.py`로 보존된 산출물에서 보고서를 다시 생성할 수 있다.
  원본 PDF와 원시 데이터는 저장소에 재배포하지 않는다.

![세 논문과 부분 재현 비교](paper_comparison.png)

P2 그림의 세로축은 LR의 큰 격차를 포함하기 위해 로그 눈금이다. 패널 사이 막대 높이로 논문의 우열을 비교하지 않는다.
'''
    (RUN/'README.md').write_text(text,encoding='utf-8')


def main():
    RUN.mkdir(exist_ok=True)
    trained=read_json(REPRO/'training_complete.json'); completed=read_json(REPRO/'completion.json')
    for n,h in [('predictions.csv.gz',trained['predictions_sha256']),('p1_repeated_predictions.csv.gz',trained['repeated_predictions_sha256']),
        ('metrics.csv',completed['metrics_sha256'])]: check_hash(REPRO/n,h)
    # Check the already frozen upstream files before trusting even their stored truth.
    protocol=read_json(ROOT/'runs/phm_cmp_temporal_v4/protocol.json')
    for n,h in protocol['preserved_files'].items(): check_hash(ROOT/n,h)
    pred=read_frame(REPRO/'scored_predictions.csv.gz')
    raw=read_frame(REPRO/'predictions.csv.gz')
    keys=['sample_id','STAGE','model','split','repeat']
    np.testing.assert_allclose(pred.set_index(keys).sort_index().prediction,raw.set_index(keys).sort_index().prediction,rtol=0,atol=0)
    truths=pred[['sample_id','STAGE','split','truth']].drop_duplicates()
    assert not truths.duplicated(['sample_id','split']).any()
    for split,block in pred.groupby('split'):
        reference=set(block.sample_id)
        assert len(reference)==424 and len(block.model.unique())==13
        for _,f in block.groupby('model'): assert set(f.sample_id)==reference
    metrics=recalculate(pred); check_metrics(metrics,read_frame(REPRO/'metrics.csv'))
    repeated=read_frame(REPRO/'p1_repeated_predictions.csv.gz').merge(truths,on=['sample_id','STAGE','split'],validate='many_to_one')
    rm=recalculate(repeated); check_metrics(rm,read_frame(REPRO/'p1_repeat_metrics.csv'))
    summary=read_frame(REPRO/'p1_repeat_summary.csv')
    for r in summary.itertuples():
        b=rm[rm.split.eq(r.split)&rm.model.eq(r.model)&rm.stage.eq(r.stage)]
        np.testing.assert_allclose([b.rmse.mean(),b.rmse.std(ddof=1),b.mse.mean(),b.mse.std(ddof=1)],
            [r.rmse_mean,r.rmse_std,r.mse_mean,r.mse_std],rtol=1e-10,atol=1e-10)
    source_files=read_json(REPRO/'paper_sources.json')
    source_rows=[{**s,'pdf_name':f['name'],'pdf_sha256':f['sha256']} for s,f in zip(SOURCES,source_files)]
    comparison=build_comparison(metrics,rm)
    assert len(comparison)==90 and int((~comparison.implemented).sum())==2
    comparison.to_csv(RUN/'paper_metric_comparison.csv',index=False)
    # JSON has no NaN placeholders: original catalog contains only primary-source numbers.
    originals=comparison[['paper','table','pdf_page','split','stage','model','metric','paper_value']].to_dict(orient='records')
    write_json(RUN/'paper_sources.json',{'verified_on':'2026-09-19','sources':source_rows,'original_table_values':originals,
        'scope':'P1 stage-specific Tables 7/8; P2 official testing Table 5; P3 Real test column in Table II.',
        'visual_checks':['P1 PDF p11','P2 PDF p7','P3 PDF p5'],'pdf_files_redistributed':False})
    improved=improvements(); improved.to_csv(RUN/'improvement_comparison.csv',index=False)
    inputs=[REPRO/n for n in ['training_complete.json','completion.json','predictions.csv.gz','scored_predictions.csv.gz',
        'metrics.csv','p1_repeated_predictions.csv.gz','p1_repeat_metrics.csv','p1_repeat_summary.csv','paper_sources.json']]
    inputs += [ROOT/'runs'/n/'metrics.csv' for n in ['phm_cmp_improvement_v1','phm_cmp_robust_v2','phm_cmp_boosted_v3','phm_cmp_temporal_v4']]
    verification={'verified_at':utcnow(),'saved_metric_rows_recomputed':len(metrics),'repeat_metric_rows_recomputed':len(rm),
        'source_code_sha256':sha256(Path(__file__)),'original_PDFs_visually_checked':True,
        'input_files':{f.relative_to(ROOT).as_posix():sha256(f) for f in inputs},
        'same_424_Test_IDs_and_truth_for_13_implementations':True,'unimplemented_models':['P2_DBN','P3_Ensemble_NN'],
        'new_independent_test':False}
    write_json(RUN/'verification.json',verification)
    paper_plot(comparison); report(comparison,metrics,improved,verification)
    print(comparison[(comparison.split=='test')&comparison.metric.isin(['mse','rmse'])][['paper','stage','model','paper_value','stored_seed0','repeat20_mean','relative_change_percent']].to_string(index=False))


if __name__=='__main__': main()
