"""Independent replay, numeric diagnosis and reporting for the P2 LR ablation."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from threadpoolctl import threadpool_limits

from cmp_ml.baselines import check_hash
from cmp_ml.common import TARGET, read_json, write_json, sha256, utcnow
from cmp_ml.improvement import ROOT, audit_partition
from cmp_ml.improvement_models import ResearchHistory
from cmp_ml.lr_ablation import context, plan, load_reference, REPRO, IMPROVE
from cmp_ml.lr_ablation_models import COMPONENTS, PROCEDURES, SEED
from cmp_ml.reconstruction import read_frame
from verify_robust import score, table


def check_metrics(pred,metrics):
    for r in metrics.itertuples():
        b=pred[pred.evaluation.eq(r.evaluation)&pred.model.eq(r.model)]
        if r.dimension!='all': b=b[b[r.dimension].eq(r.value)]
        s=score(b); assert len(b)==r.n
        e=b.prediction.to_numpy()-b.truth.to_numpy()
        relative=np.mean(np.abs(e)/np.abs(b.truth.to_numpy()))
        exponent=np.where(e<0,-e/13,e/10)
        np.testing.assert_allclose([r.mse,r.rmse,r.mae,r.r2,r.relative_error,r.mape_percent],
            [s['mse'],s['rmse'],s['mae'],s['r2'],relative,100*relative],rtol=1e-10,atol=1e-10)
        if exponent.max()>700: assert r.s_score_overflow
        else:
            assert not r.s_score_overflow
            np.testing.assert_allclose([r.s_score_literal_mean,r.s_score_minus_one_mean],
                [np.exp(exponent).mean(),np.expm1(exponent).mean()],rtol=1e-10,atol=1e-10)


def verify_models(run,p,pred):
    cache=ROOT/p['cache'];frame=read_frame(cache/'training.csv.gz')
    plans=plan(frame,pd.read_csv(run/'partitions.csv'))
    queries=folds=0;maxdiff=0.;maxcvdiff=0.
    for key,(partition,condition,fit,q) in plans.items():
        d=read_json(run/'fit_details'/f'{key}.json')
        inner=read_frame(run/'fit_details'/f'{key}.csv.gz')
        original,cv,votes=load_reference(p['references'][key])
        local=cache/f'{key}.joblib';check_hash(local,read_json(local.with_suffix('.json'))['sha256'])
        bundle=joblib.load(run/'models'/f'{condition}.joblib') if partition=='final' else joblib.load(local)[0]
        parent=original.history.library.reset_index(drop=True)
        assert set(parent.sample_id)==set(fit.sample_id)
        np.testing.assert_array_equal(bundle.reference.selected,original.selected)
        np.testing.assert_array_equal(bundle.reference.weights,original.weights)
        # Independent algebra for the original and replacement error-weight rule.
        for field,errorfield in [('original_weights','original_cv_errors'),('ridge10_weights','ridge10_cv_errors')]:
            errors=np.array(d[errorfield]);upper=errors.mean(axis=0)+3*errors.std(axis=0,ddof=1)
            w=np.maximum(upper,1e-12)**-3;w/=w.sum()
            np.testing.assert_allclose(w,d[field],rtol=1e-12,atol=1e-12)
        np.testing.assert_array_equal(np.delete(np.array(d['original_cv_errors']),2,axis=1),
            np.delete(np.array(d['ridge10_cv_errors']),2,axis=1))
        np.testing.assert_allclose(bundle.ridge_weights,d['ridge10_weights'],rtol=0,atol=0)
        removed=np.array(d['original_weights']);removed[2]=0;removed/=removed.sum()
        np.testing.assert_allclose(removed,d['no_lr_weights'],rtol=0,atol=0)
        X=original.history.transform(parent)[:,original.selected]
        scaled=bundle.ridge[0].transform(X)
        np.testing.assert_allclose(bundle.ridge[1].mean_,scaled.mean(axis=0),atol=1e-10,rtol=1e-10)
        assert bundle.ridge[-1].alpha==10
        for fold,(a,b) in enumerate(GroupShuffleSplit(20,test_size=.2,random_state=SEED).split(parent,groups=parent.WAFER_ID)):
            detail=d['folds'][fold];t,qf=parent.iloc[a],parent.iloc[b]
            assert detail['fit_ids']==t.sample_id.tolist() and detail['query_ids']==qf.sample_id.tolist()
            assert not set(t.WAFER_ID)&set(qf.WAFER_ID)
            rows=inner[inner.fold.eq(fold)].set_index('sample_id').loc[qf.sample_id]
            assert rows.index.is_unique
            np.testing.assert_allclose(rows.truth,qf[TARGET])
            for name,col in [('original_lr','original_cv_errors'),('ridge10_lr','ridge10_cv_errors')]:
                actual=float(np.square(rows[name]-rows.truth).mean());expected=d[col][fold][2]
                np.testing.assert_allclose(actual,expected,rtol=1e-7,atol=1e-7)
                if name=='original_lr': maxcvdiff=max(maxcvdiff,abs(actual-expected))
            folds+=1
        blocks={n:read_frame(cache/f'{n}.csv.gz') for n in ('validation','test')} if partition=='final' else {partition:q}
        for name,block in blocks.items():
            query=block[block.condition.eq(condition)].copy()
            old=original.predict_all(query.drop(columns=[TARGET],errors='ignore'))
            values=bundle.predict_all(query.drop(columns=[TARGET],errors='ignore'))
            changed=query.iloc[::-1].copy();changed[TARGET]=-1e12
            altered=bundle.predict_all(changed)
            expected=pred[pred.partition.eq(name)&pred.condition.eq(condition)]
            for n,v in values.items():
                reference=expected[expected.model.eq(n)].set_index('sample_id').loc[query.sample_id,'prediction']
                diff=float(np.max(np.abs(v-reference)));maxdiff=max(maxdiff,diff)
                np.testing.assert_allclose(v,reference,rtol=0,atol=1e-8)
                np.testing.assert_allclose(v,altered[n][::-1],rtol=0,atol=1e-8)
            for n in COMPONENTS: np.testing.assert_allclose(old[n],values[n],rtol=0,atol=1e-8)
            np.testing.assert_allclose(old['P2_Integrated'],values['original'],rtol=0,atol=1e-8)
            Z=np.column_stack([values[n] for n in COMPONENTS])
            np.testing.assert_allclose(Z@removed,values['no_lr'],rtol=0,atol=1e-8)
            Z[:,2]=values['P2_Ridge']
            np.testing.assert_allclose(Z@bundle.ridge_weights,values['ridge10'],rtol=0,atol=1e-8)
            queries+=1
    assert folds==420 and queries==24
    return {'inner_folds_checked':folds,'model_query_blocks_checked':queries,'max_prediction_replay_difference':maxdiff,
        'max_original_cv_lr_mse_replay_difference':maxcvdiff}


def diagnose(run,p,pred):
    cache=ROOT/p['cache']
    scored=pred[pred.partition.isin(['validation','test'])]
    original=scored[scored.model.eq('original')].copy()
    test=original[original.partition.eq('test')].copy();test['se']=(test.prediction-test.truth)**2
    top_ids=set(test.nlargest(10,'se').sample_id)
    lr=scored[scored.partition.eq('test')&scored.model.eq('P2_LR')].copy();lr['se']=(lr.prediction-lr.truth)**2
    trace_ids=top_ids|set(lr.nlargest(10,'se').sample_id)
    qp=read_json(ROOT/'runs/phm_cmp_robust_v2/protocol.json')
    quality={};inputs={}
    for split in ('validation','test'):
        f=ROOT/qp['cache']/f'{split}.csv.gz'
        check_hash(f,qp['cache_sha256'][f.name]);inputs[f.relative_to(ROOT).as_posix()]=sha256(f)
        quality[split]=read_frame(f)
    sample_rows=[];weight_rows=[];coef_rows=[];pair_rows=[];linear_rows=[];trace_rows=[];history_rows=[]
    for condition in ('Cond1','Cond2','Cond3'):
        bundle=joblib.load(run/'models'/f'{condition}.joblib');ref=bundle.reference
        t=ref.history.library;names=np.array(ref.history.names)[ref.selected]
        X=ref.history.transform(t)[:,ref.selected];pipe=ref.models['P2_LR']
        Z=pipe[:-1].transform(X);beta=pipe[-1].coef_[1:];intercept=float(pipe[-1].coef_[0])
        ridge_beta=bundle.ridge[-1].coef_;sv=pipe[-1].singular_;rank=int(pipe[-1].rank_)
        correlations=np.corrcoef(Z,rowvar=False)
        close=np.argwhere(np.triu(np.abs(correlations)>.9999,k=1))
        for i,j in close:
            pair_rows.append({'condition':condition,'feature_1':names[i],'feature_2':names[j],
                'correlation':correlations[i,j],'coefficient_1':beta[i],'coefficient_2':beta[j]})
        linear_rows.append({'condition':condition,'train_n':len(t),'selected_features':len(names),'design_columns':len(names)+1,
            'retained_rank':rank,'largest_singular_value':sv[0],'smallest_singular_value':sv[-1],
            'effective_condition_number':sv[0]/sv[rank-1],'rcond':pipe[-1].rcond,
            'high_correlation_pairs':len(close),'max_abs_ols_coefficient':np.max(np.abs(beta)),
            'max_abs_ridge_coefficient':np.max(np.abs(ridge_beta))})
        low=np.nanmin(X,axis=0);high=np.nanmax(X,axis=0)
        for j,n in enumerate(names):
            coef_rows.append({'condition':condition,'feature':n,'ols_standardized_coefficient':beta[j],
                'ridge_standardized_coefficient':ridge_beta[j],'train_min':low[j],'train_max':high[j],
                'imputation_value':pipe[0].statistics_[j],'scaler_mean':pipe[1].mean_[j],'scaler_scale':pipe[1].scale_[j]})
        d=read_json(run/'fit_details'/f'final_{condition}.json')
        for procedure,field in [('original','original_weights'),('no_lr','no_lr_weights'),('ridge10','ridge10_weights')]:
            weight_rows.extend({'condition':condition,'procedure':procedure,'component':n if procedure!='ridge10' or n!='P2_LR' else 'P2_Ridge',
                'weight':w} for n,w in zip(COMPONENTS,d[field]))
        history=ResearchHistory('retrospective').fit(t)
        for split in ('validation','test'):
            q=read_frame(cache/f'{split}.csv.gz');q=q[q.condition.eq(condition)].reset_index(drop=True)
            vals=bundle.predict_all(q);V=ref.history.transform(q)[:,ref.selected];Q=pipe[:-1].transform(V)
            parts=Q*beta;prediction=intercept+parts.sum(axis=1)
            np.testing.assert_allclose(prediction,vals['P2_LR'],rtol=1e-8,atol=1e-7)
            np.testing.assert_allclose(history.transform(q),ref.history.transform(q),equal_nan=True,rtol=0,atol=0)
            slots,dist=history.referenced_indices(q)
            truth=original[original.partition.eq(split)].set_index('sample_id').loc[q.sample_id,'truth'].to_numpy()
            qc=quality[split].set_index('sample_id').loc[q.sample_id]
            nonlr=np.column_stack([vals[n] for n in COMPONENTS if n!='P2_LR'])
            for i,row in enumerate(q.itertuples()):
                used=slots[i][slots[i]>=0];refs=t.iloc[used]
                assert not refs.WAFER_ID.eq(row.WAFER_ID).any()
                residual=vals['original'][i]-truth[i]
                item={'partition':split,'sample_id':row.sample_id,'WAFER_ID':row.WAFER_ID,'STAGE':row.STAGE,'condition':condition,
                    'truth':truth[i],**{n:float(v[i]) for n,v in vals.items()},'error':residual,'squared_error':residual**2,
                    'lr_removal_delta':vals['no_lr'][i]-vals['original'][i],
                    'original_lr_weighted_contribution':ref.weights[2]*vals['P2_LR'][i],
                    'history_lag_count':int((slots[i,:11]>=0).sum()),'history_neighbor_count':int((slots[i,11:]>=0).sum()),
                    'references_not_completed':int(refs.end.ge(row.start).sum()),'nearest_usage_distance':dist[i],
                    'input_outside_train_range_count':int(((V[i]<low)|(V[i]>high)).sum()),'max_abs_standardized_input':float(np.max(np.abs(Q[i]))),
                    'sum_absolute_linear_contributions':float(np.abs(parts[i]).sum()),
                    'truth_outside_non_lr_prediction_range':bool(truth[i]<nonlr[i].min() or truth[i]>nonlr[i].max()),
                    'min_non_lr_prediction':nonlr[i].min(),'max_non_lr_prediction':nonlr[i].max(),
                    **{c:qc.iloc[i][c] for c in qc.columns if c.startswith('qc_')}}
                sample_rows.append(item)
                if split=='test' and row.sample_id in trace_ids:
                    trace_rows.extend({'sample_id':row.sample_id,'condition':condition,'feature':n,'raw_input':V[i,j],
                        'standardized_input':Q[i,j],'coefficient':beta[j],'contribution':parts[i,j],
                        'intercept':intercept,'ols_prediction':prediction[i],'truth':truth[i],
                        'train_min':low[j],'train_max':high[j]} for j,n in enumerate(names))
                    for slot,index in enumerate(slots[i]):
                        if index<0:continue
                        r=t.iloc[index]
                        history_rows.append({'sample_id':row.sample_id,'condition':condition,'kind':'lag' if slot<11 else 'neighbor',
                            'slot':slot+1 if slot<11 else slot-10,'reference_id':r.sample_id,'reference_WAFER_ID':r.WAFER_ID,
                            'reference_mrr':r[TARGET],'reference_start':r.start,'reference_end':r.end,'query_start':row.start,
                            'completed_before_query':bool(r.end<row.start)})
    frames={'sample_diagnostics':sample_rows,'component_weights':weight_rows,'coefficients':coef_rows,
        'high_correlation_pairs':pair_rows,'linear_conditioning':linear_rows,'tail_linear_contributions':trace_rows,
        'tail_history_references':history_rows}
    for name,rows in frames.items(): pd.DataFrame(rows).to_csv(run/f'{name}.csv',index=False)
    samples=pd.DataFrame(sample_rows);top=samples[samples.partition.eq('test')].nlargest(10,'squared_error')
    top.to_csv(run/'top10_integrated_errors.csv',index=False)
    quality_summary=[]
    for label,b in [('test_top10',top),('test_remaining',samples[samples.partition.eq('test')&~samples.sample_id.isin(top.sample_id)]),
                    ('test_all',samples[samples.partition.eq('test')]),('validation_all',samples[samples.partition.eq('validation')])]:
        quality_summary.append({'subset':label,'n':len(b),'mse':b.squared_error.mean(),
            'primary_ambiguous_n':int(b.qc_primary_ambiguous.sum()),'primary_ambiguous_fraction':b.qc_primary_ambiguous.mean(),
            'truth_outside_non_lr_range_n':int(b.truth_outside_non_lr_prediction_range.sum())})
    pd.DataFrame(quality_summary).to_csv(run/'quality_summary.csv',index=False)
    write_json(run/'diagnostic_inputs.json',{'quality_cache_hashes':inputs,'tail_selection':'Largest existing original Test squared errors; descriptive only.',
        'top10_integrated_test_sse_share':float(top.squared_error.sum()/samples[samples.partition.eq('test')].squared_error.sum()),
        'top10_truth_outside_non_lr_prediction_range':int(top.truth_outside_non_lr_prediction_range.sum()),
        'top10_secondary_missing':int(top.qc_secondary_missing.sum()),'top10_primary_ambiguous':int(top.qc_primary_ambiguous.sum()),
        'no_rows_removed_or_targets_changed':True})
    return samples,top,pd.DataFrame(weight_rows),pd.DataFrame(linear_rows)


def paired_effects(pred):
    rng=np.random.default_rng(20260919);records=[]
    for evaluation,block in pred.groupby('evaluation'):
        original=block[block.model.eq('original')].set_index('sample_id')
        before=(original.prediction-original.truth)**2
        for procedure in ('no_lr','ridge10'):
            candidate=block[block.model.eq(procedure)].set_index('sample_id').loc[original.index]
            np.testing.assert_allclose(original.truth,candidate.truth)
            after=(candidate.prediction-candidate.truth)**2
            low=high=np.nan
            if original.group_id.notna().all():
                groups=pd.DataFrame({'group':original.group_id,'before':before,'after':after,'n':1}).groupby('group').sum()
                ids=rng.integers(0,len(groups),(2000,len(groups)))
                delta=(groups.after.to_numpy()[ids].sum(axis=1)-groups.before.to_numpy()[ids].sum(axis=1))/groups.n.to_numpy()[ids].sum(axis=1)
                low,high=np.quantile(delta,[.025,.975])
            records.append({'evaluation':evaluation,'procedure':procedure,'original_mse':before.mean(),'candidate_mse':after.mean(),
                'relative_mse_change_percent':100*(after.mean()/before.mean()-1),'descriptive_delta_low':low,'descriptive_delta_high':high})
    return pd.DataFrame(records)


def make_report(run,metrics,effects,samples,top,weights,conditioning,verification):
    summary=metrics[metrics.dimension.eq('all')].pivot(index='model',columns='evaluation',values='mse').reset_index()
    summary.to_csv(run/'summary.csv',index=False)
    main=summary[summary.model.isin(PROCEDURES)]
    s=summary.set_index('model')
    test=samples[samples.partition.eq('test')]
    worst=test.loc[np.square(test.P2_LR-test.truth).idxmax()]
    worst_ridge=test.loc[np.square(test.P2_Ridge-test.truth).idxmax()]
    worst_share=float((worst.P2_LR-worst.truth)**2/np.square(test.P2_LR-test.truth).sum())
    details=[]
    for condition,b in test.groupby('condition'):
        w=weights[weights.condition.eq(condition)]
        details.append({'condition':condition,'test_n':len(b),
            'original_LR_weight':w[w.procedure.eq('original')&w.component.eq('P2_LR')].weight.iloc[0],
            'Ridge_weight':w[w.procedure.eq('ridge10')&w.component.eq('P2_Ridge')].weight.iloc[0],
            'LR_MSE':np.square(b.P2_LR-b.truth).mean(),'Ridge_MSE':np.square(b.P2_Ridge-b.truth).mean(),
            'original_MSE':b.squared_error.mean(),'no_lr_MSE':np.square(b.no_lr-b.truth).mean(),
            'ridge10_MSE':np.square(b.ridge10-b.truth).mean(),'max_abs_no_lr_change':np.max(np.abs(b.lr_removal_delta))})
    condition=pd.DataFrame(details);condition.to_csv(run/'condition_summary.csv',index=False)
    c=condition.set_index('condition');info=read_json(run/'diagnostic_inputs.json')
    quality=read_frame(run/'quality_summary.csv')
    fig,axes=plt.subplots(1,2,figsize=(12.5,5.4),layout='constrained')
    axes[0].scatter(test.truth,test.P2_LR,s=18,alpha=.55,label='Original truncated OLS',color='#dc2626')
    axes[0].scatter(test.truth,test.P2_Ridge,s=18,alpha=.55,label='Ridge alpha=10',color='#2563eb')
    lim=[float(test.truth.min()),float(test.truth.max())]
    axes[0].plot(lim,lim,'k--',linewidth=1);axes[0].set_xlabel('Observed MRR');axes[0].set_ylabel('Linear component prediction')
    axes[0].set_title('Same 424 Test samples | no clipping');axes[0].legend(fontsize=8);axes[0].grid(alpha=.15)
    x=np.arange(2);width=.25
    for j,(name,color) in enumerate(zip(PROCEDURES,['#64748b','#f59e0b','#0f766e'])):
        bars=axes[1].bar(x+(j-1)*width,[s.loc[name,'validation'],s.loc[name,'test']],width,label=name,color=color)
        axes[1].bar_label(bars,fmt='%.4f',fontsize=8,padding=3)
    axes[1].set_xticks(x,['Existing Validation','Existing Test']);axes[1].set_ylabel('Integrated MSE (lower is better)')
    axes[1].set_title('A better component did not improve the ensemble');axes[1].margins(y=.25);axes[1].legend(fontsize=8)
    axes[1].grid(axis='y',alpha=.15);axes[1].set_axisbelow(True)
    fig.savefig(run/'comparison.png',dpi=180);plt.close(fig)
    topcols=['sample_id','condition','truth','original','error','P2_LR','no_lr','ridge10','truth_outside_non_lr_prediction_range']
    text=f'''# P2 큰 오차와 선형회귀 영향 진단

**진단과 사전에 고정한 세 가지 비교를 완료했다. LR 자체의 극단 오차를 줄여도 통합 모델의 기존 Test 성능은 개선되지 않았다.**
기존 논문 재현 baseline과 API/Unity 모델을 유지한다. 이전 데이터를 이미 확인한 후속 개발 실험이며 새 독립 검증이 아니다.

## 핵심 결과

- 통합 모델의 기존 Test MSE: 기존 **{s.loc['original','test']:.4f}**, LR 제거 **{s.loc['no_lr','test']:.4f}**,
  Ridge 교체 **{s.loc['ridge10','test']:.4f}**. 값이 낮을수록 좋다.
- 선형 모델 단독 Test MSE는 **{s.loc['P2_LR','test']:.4f} → {s.loc['P2_Ridge','test']:.4f}**로 낮아졌다.
  하지만 통합 가중치까지 달라져 전체 예측은 개선되지 않았다.
- Cond1에서는 새 선형 모델의 CV 오차가 낮아져 통합 가중치가 약 **{100*c.loc['Cond1','Ridge_weight']:.2f}%**로 커졌다.
  이 조건의 통합 Test MSE는 **{c.loc['Cond1','original_MSE']:.4f} → {c.loc['Cond1','ridge10_MSE']:.4f}**로 악화됐다.
  Cond3의 작은 개선보다 Cond1의 악화가 컸다. 계수 안정화와 전체 성능 개선은 같은 결과가 아니다.
- 기존 Cond1 LR 가중치는 **{c.loc['Cond1','original_LR_weight']:.9g}**, Cond2는 **{c.loc['Cond2','original_LR_weight']:.9g}**다.
  이 두 조건에서 LR은 이미 거의 배제되어 있었다. Cond3 가중치는 **{c.loc['Cond3','original_LR_weight']:.6f}**다.
- 원래 통합 모델에서 오류 상위 10건이 전체 Test 제곱오차의 **{100*info['top10_integrated_test_sse_share']:.2f}%**를 차지한다.
  그중 **{info['top10_truth_outside_non_lr_prediction_range']}/10건**은 정답이 LR을 제외한 네 구성 모델 예측의 최솟값–최댓값 밖에 있다.
  이 표본들에서는 네 모델의 비음수 가중치만 바꿔 정답에 도달할 수 없다. 실제 오차 감소 정도는 별도 검증이 필요하다.

## 동일한 평가에서의 비교

{table(main,['model','nested_oof','temporal','validation','test'])}

`nested_oof`: 같은 파일/웨이퍼 연결 그룹 바깥 5fold 1,977건.
`temporal`: 학습 1,551건, 이후 평가 166건, 경계 제외 260건.
Validation/Test는 기존 공식 분할 각각 424건이다. 같은 데이터·행·조건으로 계산했다.
미래 Train 이웃도 허용하는 기존 논문 비교 정책을 유지했으므로 completed 이력 정책의 robust v2 Test 8.9491과 직접 순위를 매기지 않는다.

{table(effects,['evaluation','procedure','original_mse','candidate_mse','relative_mse_change_percent'])}

변화율은 `(후보 MSE / 기존 MSE - 1) × 100`이며 양수는 악화다. MSE를 정확도 또는 오차율 %로 부르지 않는다.
[그룹 재표집 구간](paired_effects.csv)은 이미 고정된 예측을 2,000회 재표집한 기술적 요약이며 독립 확인 검정이 아니다.
바깥 그룹·시간순에서 작은 감소가 있어도 기존 Test의 개선을 보장하지 않았다. Test에서 후보를 재선정하지 않았다.

## 어떤 변경만 했는가

| 절차 | 변경 |
|---|---|
| original | 원래 재현 v2 모델, 특징과 가중치 그대로 |
| no_lr | LR 가중치만 0, 다른 네 가중치를 비례 재정규화 |
| ridge10 | LR만 Ridge(alpha=10)로 교체하고 같은 CV 오차 가중식을 다시 계산 |

기존 SVR·Bagging·Persistent·KNN, 모든 부모 학습 집합, 특징 선택표를 유지했다.
Ridge alpha는 결과를 보기 전에 10으로 고정했으며 탐색하지 않았다. 범위 제한이나 표본 삭제도 추가하지 않았다.
21개 부모 적합 × 20개 기존 CV 분할에서 LR을 다시 적합해 기존 CV 오차와 같음을 확인하고 Ridge만 새로 적합했다.
내부 CV는 원래 wafer 그룹 무작위 분할이며 파일 그룹 분리나 시간순 조건을 새로 추가하지 않았다.
내부 검증 표본은 반복 간 겹칠 수 있어 독립 20개 검증으로 해석하지 않는다.
가중치는 CV 오차로 정하며 공식 Validation/Test로 정하지 않았다. Ridge의 가중치 변화까지 포함한 결합 효과다.

## 선형회귀는 왜 크게 틀렸는가

{table(conditioning,['condition','selected_features','retained_rank','effective_condition_number','high_correlation_pairs','max_abs_ols_coefficient','max_abs_ridge_coefficient'])}

선택 특징 사이에 절댓값 상관이 0.9999를 넘는 쌍들이 있고, 사용량 표준편차·감소 기울기 등에서 큰 양·음 계수가 상쇄되는 구조를 확인했다.
이미 표준화와 SVD 절단(rcond=1e-6)을 적용한 모델이다. 유효 조건수는 절단 후 남은 최대/최소 특이값의 비이며,
이 값 하나로 모든 예측 오류의 원인을 확정하지 않는다. Ridge의 계수 크기는 크게 작아졌지만 일부 평가에서 단독 성능은 악화됐다.

가장 큰 LR Test 오류 표본은 `{worst.sample_id}` (wafer `{int(worst.WAFER_ID)}`, {worst.condition})다.
실측 **{worst.truth:.4f}**, LR **{worst.P2_LR:.4f}**, 통합 **{worst.original:.4f}**, LR 제거 통합 **{worst.no_lr:.4f}**다.
이 한 표본이 LR 전체 Test 제곱오차의 **{100*worst_share:.2f}%**다.
즉 LR 단독의 큰 오차가 그대로 통합 예측에 전달된 것은 아니다.

Ridge에서도 남는 큰 오류 표본 `{worst_ridge.sample_id}`는 실측 **{worst_ridge.truth:.4f}**,
Ridge **{worst_ridge.P2_Ridge:.4f}**, 기존 통합 **{worst_ridge.original:.4f}**다.
선택 특징 중 {int(worst_ridge.input_outside_train_range_count)}개가 학습 최솟값–최댓값 밖이고,
표준화된 입력의 최대 절댓값은 **{worst_ridge.max_abs_standardized_input:.2f}**다.
계수 크기를 줄이는 것만으로 학습 범위 밖 입력의 잘못된 외삽까지 해결되지는 않았다.

[특징별 계수·스케일](coefficients.csv), [높은 상관 쌍](high_correlation_pairs.csv),
[큰 오류 표본의 전체 선형 기여](tail_linear_contributions.csv).
기여는 표준화 입력 × 계수이며 절편과 합치면 저장 LR 예측이 복원됨을 확인했다. 물리적 인과 영향으로 해석하지 않는다.

{table(condition,['condition','test_n','LR_MSE','Ridge_MSE','original_MSE','no_lr_MSE','ridge10_MSE','max_abs_no_lr_change'])}

작은 LR 가중치를 4자리 반올림하면 0으로 보이므로 실제 정밀값은 [가중치 CSV](component_weights.csv)에 보존했다.

## 통합 모델의 상위 오류 10건

{table(top,topcols)}

상위 표본은 기존 Test 오차로 고른 **진단용 부분집합**이다. 이 표본에 맞춰 모델을 선택하거나 삭제하지 않았다.
그중 primary 구간 모호성은 {info['top10_primary_ambiguous']}건, secondary 누락은 {info['top10_secondary_missing']}건이다.
이 표시만으로 원인이 밝혀진 것은 아니다. 공정 로그 구간과 실측 제거율이 물리적으로 정확히 대응하는지는 여전히 확인이 필요하다.

{table(quality,['subset','n','primary_ambiguous_n','primary_ambiguous_fraction','truth_outside_non_lr_range_n'])}

모호한 primary 구간의 비율은 상위 10건에서 60%, 전체 Test에서 약 20.3%다.
점검 우선순위를 정하는 관찰이며, 오류로 고른 부분집합이므로 인과 효과나 독립적인 통계 검정으로 해석하지 않는다.

[전체 848개 평가 표본 진단](sample_diagnostics.csv)에 구성 예측·LR 제거 변화·입력 범위 이탈·이력 가용량·품질 표시를 기록했다.
[상위 통합 오류와 상위 LR 오류의 이력 참조 ID/시각](tail_history_references.csv)은 원래 선택된 참조를 추적한다.
`references_not_completed`는 원래 사후 분석 정책에서 허용한 참조이며 이번에 새로 유입된 평가 정답이 아니다.
이 정책을 공정 종료 직후 실시간 운영 조건과 동일하다고 주장하지 않는다.

## 판단과 다음에 필요한 근거

이번 결과는 **LR 개선만으로 통합 오차를 줄일 수 있다는 가설을 지지하지 않는다**.
현재 논문 비교 모델을 유지하고, 남은 오류에서 구성 모델들이 함께 과소/과대 예측하는 공정·이력 구간을 확인하는 것이 다음 과제다.
공정 구간/계측 대응이나 새 시점 자료 없이 Test 최저점을 쫓는 추가 튜닝은 수행하지 않았다.
P1/P3 baseline과 이전 실험은 수정하지 않았다.

## 검증과 재현

- 이전 파일 {verification['previous_files_preserved']}개 해시 보존, 원래 모든 바깥/최종 통합 예측 동일 재현.
- 지표 {verification['metric_rows_recomputed']}행 독립 재계산, 내부 CV {verification['inner_folds_checked']}개 대조.
- 저장 모델 재로딩·조회 정답/순서 변경 불변성 {verification['model_query_blocks_checked']}개 블록 확인.
- [사전 계획](PROTOCOL.md), [고정 설정](configuration.json), [모델 파일](training_complete.json),
  [검증 결과](independent_verification.json), [테스트](tests.json), [산출물 해시](artifact_manifest.json).
- [실행 방법](../../docs/p2-lr-diagnosis-v1.md). 원시 로그와 중간 모델 캐시는 Git에 포함하지 않는다.
- 저장된 `LRBundle.predict_all(frame)`은 원래 5개 구성 예측, Ridge 예측 및 세 통합 절차의 예측을 반환한다.

![선형 모델 개선과 통합 성능의 차이](comparison.png)
'''
    (run/'README.md').write_text(text,encoding='utf-8')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_lr_diagnosis_v1')
    run=parser.parse_args().run_dir.resolve()
    p,cache=context(run)
    trained,seal,completed,configuration=[read_json(run/n) for n in
        ['training_complete.json','evaluation_seal.json','completion.json','configuration.json']]
    assert p['frozen_at']<configuration['sealed_at']<=trained['completed_at']<seal['sealed_at']<completed['completed_at']
    assert not configuration['model_selection_performed']
    assert sha256(run/'configuration.json')==trained['configuration_sha256']==seal['configuration_sha256']==completed['configuration_sha256']
    for n,k in [('metrics.csv','metrics_sha256'),('training_complete.json','training_complete_sha256'),
        ('evaluation_seal.json','evaluation_seal_sha256'),('reference_scored_predictions.csv.gz','reference_scored_predictions_sha256')]:
        check_hash(run/n,completed[k])
    check_hash(run/'reference_predictions.csv.gz',seal['predictions_sha256'])
    check_hash(run/'development_predictions.csv.gz',trained['development_predictions_sha256'])
    for n,h in trained['fit_details_sha256'].items():check_hash(run/n,h)
    for m in trained['models']:check_hash(run/m['file'],m['sha256'])
    for n,h in p['preserved_files'].items():check_hash(ROOT/n,h)
    for n,h in p['code_sha256'].items():check_hash(run/'code_snapshot'/n,h)
    pred=pd.concat([read_frame(run/n) for n in ['development_predictions.csv.gz','reference_scored_predictions.csv.gz']],ignore_index=True)
    assert not pred.duplicated(['partition','model','sample_id']).any()
    pred['evaluation']=pred.partition.where(~pred.partition.str.startswith('outer_'),'nested_oof')
    for (evaluation,model),b in pred.groupby(['evaluation','model']):
        assert b.sample_id.is_unique and len(b)=={'nested_oof':1977,'temporal':166,'validation':424,'test':424}[evaluation]
    metrics=read_frame(run/'metrics.csv');check_metrics(pred,metrics)
    verified=verify_models(run,p,pred)
    samples,top,weights,conditioning=diagnose(run,p,pred)
    effects=paired_effects(pred);effects.to_csv(run/'paired_effects.csv',index=False)
    verification={'verified_at':utcnow(),'metric_rows_recomputed':len(metrics),'previous_files_preserved':len(p['preserved_files']),
        **verified,'original_predictions_identical':True,'no_test_model_selection':True,
        'linear_contributions_reconstruct_predictions':True,'new_independent_test':False,
        'report_generator_sha256':sha256(Path(__file__))}
    write_json(run/'independent_verification.json',verification)
    make_report(run,metrics,effects,samples,top,weights,conditioning,verification)
    print(pd.read_csv(run/'summary.csv').to_string(index=False))
    print(read_json(run/'diagnostic_inputs.json'))


if __name__=='__main__':
    with threadpool_limits(limits=4): main()
