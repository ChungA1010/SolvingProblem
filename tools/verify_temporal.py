"""Audit frozen rolling-origin decisions, reload models, and report paired results."""
from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from cmp_ml.baselines import check_hash
from cmp_ml.common import read_json, sha256, utcnow, write_json
from cmp_ml.improvement import ROOT, audit_partition
from cmp_ml.reconstruction import read_frame
from cmp_ml.boosted_models import VARIANTS, grid
from cmp_ml.temporal_experiment import plans_for
from cmp_ml.temporal_models import rolling_plan
from verify_boosted import verify_models
from verify_robust import score, table


def verify_inner(run, protocol):
    frame = read_frame(ROOT / protocol['cache'] / 'training.csv.gz')
    plans = plans_for(frame, pd.read_csv(run / 'partitions.csv'))
    frozen = read_json(run / 'rolling_plan.json')
    count = origins = crossfits = 0
    for key, (_, _, parent, _) in plans.items():
        d = read_json(run / 'selection_details' / f'{key}.json')
        f = read_frame(run / 'selection_details' / f'{key}.csv.gz')
        assert d['rolling_plan'] == frozen[key] == rolling_plan(parent)
        assert len(parent) == d['train_n'] and len(f) == d['selection_n'] and f.sample_id.is_unique
        expected_ids = []
        for origin in frozen[key]:
            if not origin['eligible']:
                assert not f.fold.eq(origin['fold']).any()
                continue
            a = parent[parent.sample_id.isin(origin['fit_ids'])]
            b = parent[parent.sample_id.isin(origin['query_ids'])]
            audit_partition(a, b, True)
            assert a.end.max() < b.start.min()
            rows = f[f.fold.eq(origin['fold'])]
            assert set(rows.sample_id) == set(b.sample_id)
            assert np.all(rows.low == a['AVG_REMOVAL_RATE'].min())
            assert np.all(rows.high == a['AVG_REMOVAL_RATE'].max())
            np.testing.assert_allclose(rows.truth, b.set_index('sample_id').loc[rows.sample_id, 'AVG_REMOVAL_RATE'])
            expected_ids.extend(b.sample_id); origins += 1
        assert len(expected_ids) == len(set(expected_ids)) and set(expected_ids) == set(f.sample_id)
        for name, expected in d['candidate_scores'].items():
            assert np.isclose(np.square(f.truth - f[name]).mean(), expected, rtol=1e-10)
            assert f[name].between(f.low - 1e-9, f.high + 1e-9).all()
        for variant in VARIANTS:
            best = min(grid(), key=lambda s: (d['candidate_scores'][f'{variant}/{s["id"]}'], s['id']))
            assert best == d['chosen_specs'][variant]
            assert np.isclose(d['scores'][variant], d['candidate_scores'][f'{variant}/{best["id"]}'])
        assert np.isclose(d['scores']['robust_reference'], np.square(f.truth - f.robust_reference).mean())
        assert d['selected'] == min(d['scores'], key=lambda k: (d['scores'][k], k))
        for block, audits in d['feature_crossfits'].items():
            subset = parent if block == 'final_fit' else parent[parent.sample_id.isin(frozen[key][int(block.split('_')[1])]['fit_ids'])]
            seen = []
            for a in audits:
                refs, queries = set(a['reference_ids']), set(a['query_ids'])
                assert not refs & queries and refs | queries == set(subset.sample_id)
                t, q = subset[subset.sample_id.isin(refs)], subset[subset.sample_id.isin(queries)]
                audit_partition(t, q)
                assert len(t) == a['reference_n'] and len(q) == a['query_n']
                seen.extend(a['query_ids']); crossfits += 1
            assert sorted(seen) == sorted(subset.sample_id.tolist())
        count += 1
    assert count == 21 and origins == protocol['eligible_origins'] and crossfits == 3 * (origins + count)
    return count, origins, crossfits


def paired_effects(pred):
    rng = np.random.default_rng(20260919)
    rows = []
    for evaluation, block in pred.groupby('evaluation'):
        new = block[block.model.eq('selected')].set_index('sample_id')
        for name in ('robust_reference', 'group_selected_v3', 'previous_control'):
            old = block[block.model.eq(name)].set_index('sample_id').loc[new.index]
            np.testing.assert_allclose(old.truth, new.truth)
            before, after = (old.prediction-old.truth)**2, (new.prediction-new.truth)**2
            low = high = np.nan
            if new.group_id.notna().all():
                g = pd.DataFrame({'group':new.group_id,'before':before,'after':after,'n':1}).groupby('group').sum()
                ids = rng.integers(0, len(g), (2000, len(g)))
                delta = (g.after.to_numpy()[ids].sum(axis=1)-g.before.to_numpy()[ids].sum(axis=1))/g.n.to_numpy()[ids].sum(axis=1)
                low, high = np.quantile(delta, [.025,.975])
            rows.append({'evaluation':evaluation,'reference':name,'reference_mse':before.mean(),'selected_mse':after.mean(),
                'mse_reduction_percent':100*(1-after.mean()/before.mean()),'delta_low':low,'delta_high':high})
    return pd.DataFrame(rows)


def report(run, metrics, effects, clips, verification):
    summary = metrics[metrics.dimension.eq('all')].pivot(index='model',columns='evaluation',values='mse').reset_index()
    summary.to_csv(run/'summary.csv',index=False)
    selected = summary.set_index('model').loc['selected']
    ref = summary.set_index('model').loc['robust_reference']
    decisions = read_json(run/'selection.json')['decisions']
    final = pd.DataFrame([{'condition':d['condition'],'selected':d['selected'],'inner_mse':d['scores'][d['selected']],
        'selection_n':d['selection_n']} for k,d in decisions.items() if k.startswith('final_')])
    plan = read_json(run/'rolling_plan.json')
    coverage = pd.DataFrame([{'partition_condition':k,'fold':r['fold'],'eligible':r['eligible'],
        'fit_n':r['fit_n'],'query_n':r['query_n'],'fit_groups':r['fit_groups'],'query_groups':r['query_groups']}
        for k, p in plan.items() for r in p])
    coverage.to_csv(run/'rolling_coverage.csv',index=False)
    fig,axes = plt.subplots(1,3,figsize=(13,4.6),layout='constrained')
    names = ['previous_control','robust_reference','group_selected_v3','selected']
    for ax,evaluation in zip(axes,['nested_oof','temporal','test']):
        b = summary.set_index('model')
        bars = ax.bar(range(4),[b.loc[n,evaluation] for n in names],color=['#94a3b8','#3b82f6','#f59e0b','#0f766e'])
        ax.bar_label(bars,fmt='%.2f',padding=3)
        ax.set_xticks(range(4),['Stable v1','Robust v2','Group v3','Time v4'],rotation=25,ha='right')
        ax.set_title(evaluation); ax.set_ylabel('MSE (lower is better)'); ax.margins(y=.2)
        ax.grid(axis='y',alpha=.2); ax.set_axisbelow(True)
    fig.suptitle('Completed-history policy | paired development evaluation')
    fig.savefig(run/'comparison.png',dpi=180); plt.close(fig)
    evaluations = ('nested_oof','temporal','test')
    if all(selected[e] < ref[e] for e in evaluations):
        disposition = '시간순·그룹·기존 Test의 MSE가 모두 기존 robust v2보다 낮았다. 같은 자료를 재사용한 관찰이므로 독립 성능 개선으로 확정하지 않는다.'
    elif all(selected[e] > ref[e] for e in evaluations):
        disposition = '그룹·시간순·기존 Test 모두 기존 robust v2보다 MSE가 높아졌다. 추가 오차 감소에 성공하지 못했으며 기존 모델을 유지한다.'
    else:
        disposition = '기존 robust v2보다 일관되게 우수하지 않았다. 이번 실험을 이유로 기존 모델을 일괄 교체하지 않는다.'
    text = f'''# P2 시간순 내부 선택 실험 v4

**{disposition}** API/Unity 모델은 교체하지 않았다. 계획한 21개 학습·선택과 저장 모델 검증을 완료했다.
논문 baseline의 성능과 이 제안 모델 연구는 [최종 비교 보고서](../phm_cmp_final_comparison/README.md)에서 구분한다.

완료된 과거 공정 이력 조건에서 robust v2 → 시간순 선택 v4의 MSE는 그룹 검증
**{ref.nested_oof:.4f} → {selected.nested_oof:.4f}**, 시간순 **{ref.temporal:.4f} → {selected.temporal:.4f}**,
기존 공식 Test **{ref.test:.4f} → {selected.test:.4f}**다. Test는 이미 확인한 424건을 재사용했으며 새 독립 검증이 아니다.

## 비교 결과

{table(effects,['evaluation','reference','reference_mse','selected_mse','mse_reduction_percent'])}

MSE 감소율은 오차 제곱 평균의 상대 변화이며 정확도나 MAPE가 아니다. 양수는 개선, 음수는 악화다.
그룹 재표집 구간은 고정 예측에 대한 기술적 불확실성 요약이며 확인적 검정이 아니다.

{table(summary,['model','nested_oof','temporal','validation','test'])}

`robust_reference`는 같은 부모 학습 분할의 기존 robust v2 절차, `group_selected_v3`는 이전 그룹 내부 검증 선택,
`selected`는 이번 시간순 내부 검증 선택이다. 후보별 바깥 결과를 보고 `selected`를 바꾸지 않았다.
`history_anchor`는 진단용 기준값이며 선택 후보가 아니다.

## 사전에 고정한 선택 절차

- 각 조건의 시작 시각 40/60/80% 지점을 이용해 이전 공정 → 이후 공정의 검증 창을 만들었다.
- 웨이퍼/파일 연결 그룹 전체를 보존하고, 경계를 걸치는 그룹을 해당 창에서 제외했다.
  학습 그룹 종료 시각은 검증 그룹 시작 시각보다 엄격히 이르다.
- 학습 60건·6그룹 이상, 검증 10건·2그룹 이상인 창만 사용했다. 조건별 유효 창이 2개 미만이면 실패하도록 고정했다.
- 각 창의 앞선 학습 자료만으로 기존 robust 절차와 CatBoost 후보를 다시 적합했다.
  기존 robust 절차 안의 그룹 검증은 유지하고, 최상위 모델 선택을 시간순으로 바꿨다.
- 네 후보 각각의 설정을 유효 검증 표본 전체의 MSE로 고른 뒤 기존 robust 후보와 비교했다.
  작은 창과 큰 창의 평균을 같은 비중으로 합치지 않았다.
- 21개 부모 학습의 유효 창 {verification['eligible_origins_checked']}개,
  표본 부족으로 제외한 창 {int((~coverage.eligible).sum())}개를 전부 기록했다.
  [분할별 크기](rolling_coverage.csv), [표본 ID와 경계](rolling_plan.json).

최종 전체 Train 적합에 적용한 선택:

{table(final,['condition','selected','inner_mse','selection_n'])}

시간순 내부 선택 표본은 부모 Train의 일부다. 전체 그룹 OOF의 난도나 시간 범위를 대표한다고 가정하지 않는다.
직접 예측과 잔차 예측, 125/401개 특징, 네 후보 × 4개 CatBoost 설정(총 16조합), 이력 교차 적합, 예측 범위 제한은 v3와 같다.
Train의 자기 파일/웨이퍼 그룹 정답을 제외한 이력 특징을 쓰며 조회에는 적합 집합의 완료된 이력만 쓴다.
과거 공정 종료 즉시 제거율을 알 수 있다는 가정은 남아 있다.

## 검증 증거

- 저장 예측으로 지표 {verification['metric_rows_recomputed']}행의 8개 값을 독립 재계산했다.
- 선택 21개·시간순 창 {verification['eligible_origins_checked']}개·학습 특징 교차 적합 {verification['feature_crossfit_blocks_checked']}개를 확인했다.
- 모델 재로딩·조회 순서 변경·조회 정답 변조 불변성을 {verification['model_query_blocks_checked']}개 블록에서 확인했다.
- 기존 파일 {verification['previous_files_preserved']}개 해시를 보존했다. 원래 robust 예측도 동일하게 재현했다.
- [선택 기록](selection.json), [모델 파일](training_complete.json), [전체 지표](metrics.csv),
  [독립 검증](independent_verification.json), [테스트](tests.json), [산출물 해시](artifact_manifest.json).
- [실행 방법과 고정 계획](../../docs/p2-temporal-v4.md). 원시 자료와 전체 중간 모델 캐시는 Git에 넣지 않는다.

{table(clips[clips.model.eq('selected')],['evaluation','model','n','clipped_n','clipped_fraction'])}

위 범위 제한은 학습 정답의 min/max를 사용하며 평가 정답으로 정하지 않았다. 기존 모델의 Bagging 대체는 별도 규칙이다.

![동일 분할 비교](comparison.png)
'''
    (run/'README.md').write_text(text,encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_temporal_v4')
    run = parser.parse_args().run_dir.resolve()
    p,trained,selection,seal,completed = [read_json(run/n) for n in
        ('protocol.json','training_complete.json','selection.json','evaluation_seal.json','completion.json')]
    assert p['frozen_at'] < selection['selected_at'] < seal['sealed_at'] < completed['completed_at']
    assert sha256(run/'selection.json') == trained['selection_sha256'] == seal['selection_sha256'] == completed['selection_sha256']
    for n,k in [('metrics.csv','metrics_sha256'),('training_complete.json','training_complete_sha256'),
        ('evaluation_seal.json','evaluation_seal_sha256'),('reference_scored_predictions.csv.gz','reference_scored_predictions_sha256')]:
        check_hash(run/n,completed[k])
    check_hash(run/'reference_predictions.csv.gz',seal['predictions_sha256'])
    check_hash(run/'development_predictions.csv.gz',trained['development_predictions_sha256'])
    check_hash(run/'development_clipping.csv',trained['development_clipping_sha256'])
    for n,h in trained['details_sha256'].items(): check_hash(run/n,h)
    for n,h in p['frozen_files'].items(): check_hash(run/n,h)
    for n,h in p['code_sha256'].items():
        check_hash(ROOT/'src/cmp_ml'/n,h); check_hash(run/'code_snapshot'/n,h)
    for n,h in p['preserved_files'].items(): check_hash(ROOT/n,h)
    for n,h in p['cache_sha256'].items(): check_hash(ROOT/p['cache']/n,h)
    for m in trained['models']: check_hash(run/m['file'],m['sha256'])
    manifest,parts = read_frame(run/'manifest.csv'),pd.read_csv(run/'partitions.csv')
    for partition,b in parts.groupby('partition'):
        audit_partition(manifest[manifest.sample_id.isin(b.loc[b.role.eq('train'),'sample_id'])],
            manifest[manifest.sample_id.isin(b.loc[b.role.eq('evaluation'),'sample_id'])],partition=='temporal')
    pred = pd.concat([read_frame(run/n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz','paired_previous_predictions.csv.gz')],ignore_index=True)
    assert not pred.duplicated(['partition','policy','model','sample_id']).any()
    pred['evaluation'] = pred.partition.where(~pred.partition.str.startswith('outer_'),'nested_oof')
    for (evaluation,model),b in pred.groupby(['evaluation','model']):
        assert b.sample_id.is_unique and len(b)=={'nested_oof':1977,'temporal':166,'validation':424,'test':424}[evaluation]
    metrics = read_frame(run/'metrics.csv')
    for r in metrics.itertuples():
        b=pred[pred.evaluation.eq(r.evaluation)&pred.model.eq(r.model)]
        if r.dimension!='all': b=b[b[r.dimension].eq(r.value)]
        s=score(b); assert r.n==len(b)
        np.testing.assert_allclose([r.mse,r.rmse,r.mae,r.r2],[s[k] for k in ('mse','rmse','mae','r2')],rtol=1e-10,atol=1e-10)
        error=b.prediction.to_numpy()-b.truth.to_numpy()
        relative=np.mean(np.abs(error)/np.abs(b.truth.to_numpy()))
        exponent=np.where(error<0,-error/13,error/10)
        assert exponent.max()<700 and not r.s_score_overflow
        np.testing.assert_allclose([r.relative_error,r.mape_percent,r.s_score_literal_mean,r.s_score_minus_one_mean],
            [relative,100*relative,np.exp(exponent).mean(),np.expm1(exponent).mean()],rtol=1e-10,atol=1e-10)
    inner,origins,crossfits=verify_inner(run,p)
    models=verify_models(run,p,pred); assert models==24
    effects=paired_effects(pred); effects.to_csv(run/'paired_effects.csv',index=False)
    pd.DataFrame([{'partition':a,'model':b,**score(f)} for (a,b),f in pred[pred.partition.str.startswith('outer_')].groupby(['partition','model'])]).to_csv(run/'fold_metrics.csv',index=False)
    flags=pd.concat([pd.read_csv(run/n) for n in ('development_clipping.csv','reference_clipping.csv')])
    flags['evaluation']=flags.partition.where(~flags.partition.str.startswith('outer_'),'nested_oof')
    clips=flags.groupby(['evaluation','model']).clipped.agg(['size','sum','mean']).reset_index()
    clips.columns=['evaluation','model','n','clipped_n','clipped_fraction']; clips.to_csv(run/'clipping_summary.csv',index=False)
    verification={'verified_at':utcnow(),'metric_rows_recomputed':len(metrics),'inner_partitions_checked':inner,
        'eligible_origins_checked':origins,'feature_crossfit_blocks_checked':crossfits,'model_query_blocks_checked':models,
        'previous_files_preserved':len(p['preserved_files']),'paired_partitions_unchanged':True,
        'bootstrap_note':'Descriptive fixed-prediction group resampling, not independent confirmation.'}
    write_json(run/'independent_verification.json',verification)
    report(run,metrics,effects,clips,verification)
    print(pd.read_csv(run/'summary.csv').to_string(index=False))


if __name__=='__main__': main()
