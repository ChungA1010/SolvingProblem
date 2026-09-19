"""Independent numeric replay and reporting for the secondary-chamber ablation."""
from pathlib import Path
import argparse

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from threadpoolctl import threadpool_limits

from cmp_ml.baselines import check_hash
from cmp_ml.common import TARGET, read_json, write_json, sha256, utcnow
from cmp_ml.improvement import ROOT, audit_partition
from cmp_ml.lr_ablation import plan, load_reference
from cmp_ml.lr_ablation_models import COMPONENTS, SEED
from cmp_ml.reconstruction import read_frame
from cmp_ml.secondary_ablation import context, AUDIT
from cmp_ml.secondary_ablation_models import primary_inputs, ids_hash, pair_predictions
from verify_lr_ablation import check_metrics
from verify_robust import score, table


def verify(run,p,inputs,cache,pred):
    trained=read_json(run/'training_complete.json')
    for name,digest in trained['fit_details_sha256'].items():check_hash(run/name,digest)
    for record in trained['models']:check_hash(run/record['file'],record['sha256'])
    frame=read_frame(inputs/'training.csv.gz')
    plans=plan(frame,pd.read_csv(run/'partitions.csv'))
    count=queries=0;maxdiff=0.;weights=[];features=[]
    for key,(partition,condition,fit,q) in plans.items():
        ref,original_cv,_=load_reference(p['references'][key])
        path=cache/f'{key}.joblib';check_hash(path,read_json(path.with_suffix('.json'))['sha256'])
        candidate=joblib.load(run/'models'/f'{condition}.joblib') if partition=='final' else joblib.load(path)[0]
        parent=ref.history.library.reset_index(drop=True)
        pd.testing.assert_frame_equal(candidate.history.library,primary_inputs(parent))
        assert set(parent.sample_id)==set(fit.sample_id)
        assert candidate.history.distance=='raw' and candidate.history.lag=='prior_start'
        assert candidate.history.names==[n for n in ref.history.names if not n.startswith('p2_secondary_')]
        assert len(candidate.history.names)==73
        for name in ref.models:
            assert ref.models[name][-1].get_params()==candidate.models[name][-1].get_params()
        d=read_json(run/'fit_details'/f'{key}.json')
        inner=read_frame(run/'fit_details'/f'{key}.predictions.csv.gz')
        votes=read_frame(run/'fit_details'/f'{key}.votes.csv.gz')
        selected=votes.pivot(index='fold',columns='feature',values='selected').loc[range(20),candidate.history.names].to_numpy(bool)
        mask=selected.sum(axis=0)>=10
        if not mask.any():mask=selected.sum(axis=0)>0
        np.testing.assert_array_equal(mask,candidate.selected)
        assert np.asarray(candidate.history.names)[mask].tolist()==d['selected_features']
        errors=np.asarray(d['candidate_cv_errors'])
        upper=errors.mean(axis=0)+3*errors.std(axis=0,ddof=1)
        w=np.maximum(upper,1e-12)**-3;w/=w.sum()
        np.testing.assert_allclose(w,candidate.weights,rtol=1e-12,atol=1e-12)
        np.testing.assert_allclose(w,d['candidate_weights'],rtol=1e-12,atol=1e-12)
        original_errors=pd.DataFrame(original_cv).pivot(index='fold',columns='model',values='mse').loc[range(20),list(COMPONENTS)].to_numpy()
        np.testing.assert_allclose(errors[:,:2],original_errors[:,:2],rtol=1e-10,atol=1e-9)
        for fold,(a,b) in enumerate(GroupShuffleSplit(20,test_size=.2,random_state=SEED).split(parent,groups=parent.WAFER_ID)):
            train,v=parent.iloc[a],parent.iloc[b];r=d['folds'][fold]
            assert ids_hash(train.sample_id)==r['fit_ids_sha256'] and ids_hash(v.sample_id)==r['query_ids_sha256']
            assert not set(train.WAFER_ID)&set(v.WAFER_ID)
            assert len(set(train.group_id)&set(v.group_id))==r['overlapping_file_groups']
            block=inner[inner.fold.eq(fold)].set_index('sample_id')
            assert len(block)==len(v) and block.index.is_unique
            block=block.loc[v.sample_id]
            np.testing.assert_array_equal(block.truth,v[TARGET])
            actual=np.square(block[list(COMPONENTS)].to_numpy()-block.truth.to_numpy()[:,None]).mean(axis=0)
            np.testing.assert_allclose(actual,errors[fold],rtol=1e-10,atol=1e-8)
            count+=1
        blocks={name:read_frame(inputs/f'{name}.csv.gz') for name in ['validation','test']} if partition=='final' else {partition:q}
        for part,block in blocks.items():
            query=block[block.condition.eq(condition)].copy()
            clean=query.drop(columns=[TARGET],errors='ignore')
            if partition!='final':audit_partition(parent,query,partition=='temporal')
            np.testing.assert_array_equal(ref.history.transform(clean)[:,:21],candidate.history.transform(clean)[:,:21])
            values=pair_predictions(ref,candidate,clean)
            altered=clean.iloc[::-1].copy();altered[TARGET]=1e15
            for c in altered:
                if c.startswith('p2_secondary_'):altered[c]=np.nan
            changed=candidate.predict_all(altered)
            dropped=candidate.predict_all(primary_inputs(clean))
            expected=pred[pred.partition.eq(part)&pred.condition.eq(condition)]
            for name,value in values.items():
                saved=expected[expected.model.eq(name)].set_index('sample_id').loc[query.sample_id,'prediction'].to_numpy()
                maxdiff=max(maxdiff,float(np.max(np.abs(value-saved))))
                np.testing.assert_allclose(value,saved,rtol=0,atol=1e-8)
            for n,value in changed.items():
                name='primary_only' if n=='P2_Integrated' else 'primary_only_'+n
                np.testing.assert_allclose(value[::-1],values[name],rtol=0,atol=1e-8)
                np.testing.assert_allclose(dropped[n],values[name],rtol=0,atol=1e-8)
            for prefix,weight in [('original',ref.weights),('primary_only',candidate.weights)]:
                Z=np.column_stack([values[prefix+'_'+n] for n in COMPONENTS])
                np.testing.assert_allclose(Z@weight,values[prefix],rtol=0,atol=1e-8)
            queries+=1
        for arm,bundle in [('original',ref),('primary_only',candidate)]:
            weights.extend({'partition':partition,'condition':condition,'arm':arm,'component':n,'weight':float(w)} for n,w in zip(COMPONENTS,bundle.weights))
            features.append({'partition':partition,'condition':condition,'arm':arm,'input_count':len(bundle.history.names),
                'selected_count':int(bundle.selected.sum()),'primary_selected':sum(n.startswith('p2_primary_') for n in np.asarray(bundle.history.names)[bundle.selected]),
                'secondary_selected':sum(n.startswith('p2_secondary_') for n in np.asarray(bundle.history.names)[bundle.selected])})
    assert count==420 and queries==24
    pd.DataFrame(weights).to_csv(run/'component_weights.csv',index=False)
    pd.DataFrame(features).to_csv(run/'feature_counts.csv',index=False)
    for n,h in p['preserved_files'].items():check_hash(ROOT/n,h)
    return {'inner_folds_checked':count,'model_query_blocks_checked':queries,'max_prediction_replay_difference':maxdiff,
        'preserved_previous_files':len(p['preserved_files']),'secondary_values_and_query_target_and_order_invariant':True,
        'persistent_and_knn_unchanged':True,'hyperparameters_unchanged':True}


def paired_effects(pred):
    selected=pred[pred.model.isin(['original','primary_only'])]
    wide=selected.pivot(index=['evaluation','partition','sample_id','group_id','truth'],columns='model',values='prediction').reset_index()
    wide['original_se']=(wide.original-wide.truth)**2
    wide['candidate_se']=(wide.primary_only-wide.truth)**2
    rows=[];rng=np.random.default_rng(SEED)
    for evaluation,b in wide.groupby('evaluation'):
        g=b.groupby('group_id').agg(original_se=('original_se','sum'),candidate_se=('candidate_se','sum'),n=('sample_id','size'))
        complete=bool(b.group_id.notna().all() and len(g)>0)
        low=high=None
        if complete:
            a=g[['original_se','candidate_se','n']].to_numpy(float)
            assert (a[:,2]>0).all() and int(a[:,2].sum())==len(b)
            draws=rng.integers(0,len(a),size=(2000,len(a)))
            sampled=a[draws].sum(axis=1)
            delta=(sampled[:,1]-sampled[:,0])/sampled[:,2]
            low,high=map(float,np.quantile(delta,[.025,.975]))
        old,new=float(b.original_se.mean()),float(b.candidate_se.mean())
        rows.append({'evaluation':evaluation,'n':len(b),'groups':len(g) if complete else None,'original_mse':old,'primary_only_mse':new,
            'mse_change':new-old,'relative_mse_change_percent':100*(new/old-1),
            'descriptive_group_bootstrap_2_5':low,'descriptive_group_bootstrap_97_5':high,
            'bootstrap_status':'computed_on_observed_file_groups' if complete else 'not_computed_missing_group_metadata'})
    return pd.DataFrame(rows),wide


def report(run,p,pred,metrics,verification):
    effects,wide=paired_effects(pred)
    effects.to_csv(run/'paired_effects.csv',index=False)
    wide.to_csv(run/'paired_predictions.csv.gz',index=False,compression={'method':'gzip','mtime':0})
    selected=metrics[metrics.model.isin(['original','primary_only'])]
    overall=selected[selected.dimension.eq('all')][['evaluation','model','n','mse','rmse','mae','r2']]
    conditions=selected[selected.dimension.eq('condition')][['evaluation','value','model','n','mse','mae']]
    conditions.to_csv(run/'condition_summary.csv',index=False)
    check_hash(AUDIT/'samples.csv',p['audit_samples_sha256'])
    flags=read_frame(AUDIT/'samples.csv').set_index('sample_id').strong_any_blocks.gt(0)
    train=pred[pred.model.isin(['original','primary_only'])&pred.evaluation.isin(['nested_oof','temporal'])].copy()
    train['strong_match_observed']=train.sample_id.map(flags)
    assert train.strong_match_observed.notna().all()
    rows=[]
    for (evaluation,model,flag),b in train.groupby(['evaluation','model','strong_match_observed']):
        rows.append({'evaluation':evaluation,'model':model,'strong_match_observed':bool(flag),**score(b)})
    audit_summary=pd.DataFrame(rows)
    audit_summary.to_csv(run/'signal_match_subgroups.csv',index=False)
    weights=pd.read_csv(run/'component_weights.csv');feature_counts=pd.read_csv(run/'feature_counts.csv')
    final_features=feature_counts[feature_counts.partition.eq('final')]
    scores=effects.set_index('evaluation')
    consistent=bool((scores.loc[['nested_oof','temporal'],'mse_change']<0).all())
    decision='두 개발 평가의 점추정치는 개선됐지만 독립 데이터로 확인하기 전 모델을 교체하지 않는다.' if consistent else '그룹과 시간순 평가에서 일관된 개선이 없어 기존 모델을 유지한다.'
    write_json(run/'decision.json',{'created_at':utcnow(),'group_and_time_both_lower':consistent,
        'model_promoted':False,'reason':decision,'test_not_used_for_selection':True})
    headline='제한된 비교를 완료했다. '+decision
    e=scores.loc['test'];t=scores.loc['temporal'];v=scores.loc['validation'];g=scores.loc['nested_oof']
    text=f'''# 후속 챔버 특징 제외 비교 결과

**{headline}**
Train 신호 검사에서 동시 기록 일치를 발견했지만, 그 특징을 일괄 제거한다고 시간순 예측까지 좋아지지는 않았다.
이번 결과는 52개 입력 제거와 그에 따른 특징 선택·모델 재학습·가중치 재계산의 결합 효과다.
동시 기록 현상이 성능 차이의 원인임을 증명하는 실험은 아니다.

## 핵심 결과

- 기존 공식 Test MSE: **{e.original_mse:.4f} → {e.primary_only_mse:.4f}** ({e.relative_mse_change_percent:+.2f}%).
- Train 그룹 검증 MSE: **{g.original_mse:.4f} → {g.primary_only_mse:.4f}** ({g.relative_mse_change_percent:+.2f}%).
- 시간순 검증 MSE: **{t.original_mse:.4f} → {t.primary_only_mse:.4f}** ({t.relative_mse_change_percent:+.2f}%).
- 기존 공식 Validation MSE: **{v.original_mse:.4f} → {v.primary_only_mse:.4f}** ({v.relative_mse_change_percent:+.2f}%).

MSE는 낮을수록 좋다. 괄호는 MSE의 상대 변화율이며, 정확도나 오차율 %가 아니다.
Test 점수 하나로 새 후보를 선택하지 않았다. API/Unity 및 기존 연구 baseline은 유지한다.

{table(overall,list(overall.columns))}

`nested_oof`는 같은 파일/웨이퍼 연결 그룹 바깥 5fold의 총 1,977건이다.
시간순은 학습 1,551건, 이후 평가 166건, 경계 제외 260건이다. 공식 Validation/Test는 각 424건이다.
동일한 raw usage 이웃·prior-start lag를 사용하는 **논문 비교용 이력 조건**이다.
미래 Train 이웃을 허용하며 완료된 과거 전용 robust v2와 점수를 직접 순위 비교하지 않는다.
이미 여러 번 확인한 공식 Test를 재사용한 후속 개발 결과이며 새 독립 검증이 아니다.

## 무엇을 바꿨는가

| 항목 | 기존 original | primary_only |
|---|---|---|
| 입력 후보 | 125개 | 73개 |
| 주 챔버 통계 | 52개 | 같은 52개 |
| 후속 챔버 통계 | 52개 | 제외 |
| lag/neighbor 제거율 | 21개 | 같은 21개 |
| 특징 선택 | 20회 내부 CV 투표 | 같은 절차로 다시 선택 |
| 모델 설정 | 기존 LR/SVR/Bagging | 동일 |
| 통합 가중치 | 기존 CV 오차 기반 | 같은 식으로 새 CV 오차를 반영 |

Persistent와 KNN의 예측은 두 모델에서 같다. 주 챔버 사용량으로 찾는 이웃과 과거 이력 구성이 유지됐음을 확인했다.
후속 특징을 빼면서 달라진 선택 특징과 구성 모델 가중치는 [feature_counts.csv](feature_counts.csv), [component_weights.csv](component_weights.csv)에 있다.

{table(final_features[['condition','arm','input_count','selected_count','primary_selected','secondary_selected']],['condition','arm','input_count','selected_count','primary_selected','secondary_selected'])}

## 조건별 결과

Cond1=A/456, Cond2=B/456, Cond3=A/123이다.

{table(conditions,list(conditions.columns))}

## 신호 일치 여부별 보조 분석

[Train 신호 검사](../phm_cmp_chamber_audit_v1/README.md)의 강한 일치 관찰 여부를 그대로 연결했다.
학습에 포함한 1,977건에서만 비교하고, 공식 Validation/Test에는 그 검사를 새로 수행하지 않았다.
미확인은 대응 상대 부재·짧은 구간·변화 부족 등을 포함하며 독립 신호라는 뜻이 아니다.
이 표는 기술적 부분집합 분석이며 조건 구성이나 공정 상태 차이를 통제한 인과 효과가 아니다.

{table(audit_summary[['evaluation','model','strong_match_observed','n','mse','mae']],['evaluation','model','strong_match_observed','n','mse','mae'])}

## 재검증과 한계

- 부모 학습 {len(p['references'])}개, 내부 CV {verification['inner_folds_checked']}개에서 학습/검증 ID 해시, wafer 분리, 특징 투표, 구성 모델 오차와 가중식을 확인했다.
- 내부 분할은 원형과 같은 **wafer 기준**이며 파일 그룹 중첩이 있다. 중첩 수를 각 fit_details JSON에 기록했다. 바깥 파일 그룹 검증 및 시간순 결과와 구분해야 한다.
- 저장 모델을 재로딩해 {verification['model_query_blocks_checked']}개 평가 블록의 모든 구성 예측과 통합 예측을 대조했다. 최대 재현 차이는 {verification['max_prediction_replay_difference']:.3g}이다.
- 정답 열·query 순서·secondary 값 변경 및 secondary 열 전체 제거에도 후보 예측이 불변임을 확인했다. 원래 통합 예측은 이전 결과와 같다.
- 전체 지표는 저장 예측으로 독립 재계산했다. 이전 산출물 {verification['preserved_previous_files']}개의 해시를 보존했다.
- [paired_effects.csv](paired_effects.csv)의 2,000회 파일/웨이퍼 그룹 재표집 구간은 Train의 그룹·시간순 고정 예측에 대한 기술적 요약이다. 모델을 매번 재학습한 구간이나 독립 확인 검정이 아니다. 공식 Validation/Test 캐시에는 group_id가 없으므로 해당 재표집 구간은 계산하지 않고 사유를 명시했다. 개별 행을 독립 그룹으로 대신하지 않았다.

## 다음 판단

일괄 제거 후보로 모델을 교체하지 않는다. 다음 연구에서는 후속 신호를 현재 웨이퍼 연마와 **별도의 동시 장비 상태**로 표현하거나,
논문 2·3의 재시작/소모품 상태에 맞춘 이력 선택을 한 번에 하나씩 검증할 수 있다.
이번에 본 Test 점수를 기준으로 새 규칙을 계속 맞추지 않도록 별도 미래 기간의 검증이 필요하다.
이 추가 연구는 이번 고정 비교에 포함하지 않았다.

## 실행과 파일

```powershell
python -m cmp_ml.secondary_ablation prepare --run-dir runs/my_secondary_ablation
python -m cmp_ml.secondary_ablation train --run-dir runs/my_secondary_ablation
python -m cmp_ml.secondary_ablation evaluate --run-dir runs/my_secondary_ablation
python tools/verify_secondary_ablation.py --run-dir runs/my_secondary_ablation
```

원래 reconstruction v2 및 LR 진단의 입력/대조 모델 캐시가 필요하다. 기존 run은 덮어쓰지 않는다.

- [사전 계획](PROTOCOL.md), [봉인한 코드·입력·대조군 해시](protocol.json), [환경](environment.json)
- [전체 지표](metrics.csv), [대응 표본별 두 예측](paired_predictions.csv.gz), [그룹·시간순 예측](development_predictions.csv.gz)
- [공식 참고 평가 예측](reference_scored_predictions.csv.gz), [설정](configuration.json), [후보 모델·해시](training_complete.json)
- [독립 재검증](independent_verification.json), [채택 판단](decision.json), [파일 무결성](artifact_manifest.json)
'''
    (run/'README.md').write_text(text,encoding='utf-8')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_secondary_ablation_v1')
    a=parser.parse_args();run=a.run_dir.resolve()
    if (run/'independent_verification.json').exists():raise FileExistsError('Verification complete')
    p,inputs,cache=context(run)
    completion=read_json(run/'completion.json')
    for name,key in [('metrics.csv','metrics_sha256'),('configuration.json','configuration_sha256'),
        ('training_complete.json','training_complete_sha256'),('evaluation_seal.json','evaluation_seal_sha256'),
        ('reference_scored_predictions.csv.gz','reference_scored_predictions_sha256')]:check_hash(run/name,completion[key])
    pred=pd.concat([read_frame(run/n) for n in ['development_predictions.csv.gz','reference_scored_predictions.csv.gz']],ignore_index=True)
    pred['evaluation']=pred.partition.where(~pred.partition.str.startswith('outer_'),'nested_oof')
    metrics=read_frame(run/'metrics.csv');check_metrics(pred,metrics)
    result=verify(run,p,inputs,cache,pred)
    result.update({'verified_at':utcnow(),'metric_rows_recomputed':len(metrics),'metrics_sha256':sha256(run/'metrics.csv')})
    report(run,p,pred,metrics,result)
    (run/'verify_source.py').write_bytes(Path(__file__).read_bytes())
    write_json(run/'independent_verification.json',result)
    write_json(run/'artifact_manifest.json',{f.relative_to(run).as_posix():sha256(f) for f in sorted(run.rglob('*')) if f.is_file() and f.name!='artifact_manifest.json'})
    print(result)


if __name__=='__main__':
    with threadpool_limits(limits=4):main()
