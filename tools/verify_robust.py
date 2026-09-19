"""Independent verification and reporting for the paired P2 input-quality study."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from cmp_ml.baselines import check_hash
from cmp_ml.common import TARGET, read_json, sha256, utcnow, write_json
from cmp_ml.improvement import ROOT, audit_partition, history_audit
from cmp_ml.reconstruction import read_frame
from cmp_ml.robust_features import feature_view, SIGNALS, select_episode
from cmp_ml.robust_models import quality_flag


def score(block):
    m = mean_squared_error(block.truth, block.prediction)
    return {"n": len(block), "mse": m, "rmse": np.sqrt(m), "mae": mean_absolute_error(block.truth, block.prediction),
            "r2": r2_score(block.truth, block.prediction)}


def table(frame, columns):
    text = ['| ' + ' | '.join(columns) + ' |', '|' + '|'.join(['---'] * len(columns)) + '|']
    for row in frame[columns].itertuples(index=False, name=None):
        text.append('| ' + ' | '.join(f'{v:.4f}' if isinstance(v, (float, np.floating)) else str(v) for v in row) + ' |')
    return '\n'.join(text)


def verify_inner(run, manifest):
    count = 0
    for path in sorted((run / 'selection_details').glob('*.json')):
        detail = read_json(path)
        rows = pd.read_csv(path.with_suffix('.csv.gz'), float_precision='round_trip')
        for name, d in detail['variants'].items():
            f = rows[rows.variant.eq(name)]
            assert len(f) == detail['train_n'] and f.sample_id.is_unique
            meta = manifest.set_index('sample_id').loc[f.sample_id].reset_index()
            meta['fold'] = f.fold.to_numpy()
            for fold in range(3):
                a, b = meta[meta.fold.ne(fold)], meta[meta.fold.eq(fold)]
                assert not set(a.group_id) & set(b.group_id) and not set(a.WAFER_ID) & set(b.WAFER_ID)
            Z, w = f[[f'component_{i}' for i in range(5)]].to_numpy(), np.array(d['weights'])
            assert (w >= 0).all() and np.isclose(w.sum(), 1)
            np.testing.assert_allclose(Z @ w, f.prediction, atol=1e-9)
            assert np.isclose(mean_squared_error(f.truth, f.prediction), d['inner_mse'], rtol=1e-10)
            if d['guarded']:
                assert w[2] <= .25 + 1e-8
                assert (f.prediction >= f.low - 1e-8).all() and (f.prediction <= f.high + 1e-8).all()
                np.testing.assert_allclose(Z[f.fallback], f.loc[f.fallback, f"raw__{d['keys'][4]}"].to_numpy()[:, None] * np.ones((1, 5)))
        best = min((n for n, d in detail['variants'].items() if d['guarded']),
                   key=lambda n: (detail['variants'][n]['inner_mse'], n))
        assert best == detail['selected']
        count += 1
    assert count == 42
    return count


def verify_bundles(run, protocol, predictions):
    cache = ROOT / protocol['cache']
    frames = {n: read_frame(cache / f'{n}.csv.gz') for n in ('training', 'validation', 'test')}
    training = frames['training']
    audits, params, component_events = {}, {}, []
    for (part, policy, condition), block in predictions[predictions.model.eq('selected')].groupby(['partition','policy','condition']):
        prefix = 'final' if part in ('validation','test') else part
        path = cache / f'{prefix}_{policy}_{condition}.joblib'
        check_hash(path, read_json(path.with_suffix('.json'))['sha256'])
        bundle = joblib.load(path)[0]
        frame = frames[part] if part in ('validation','test') else training
        query = frame.set_index('sample_id').loc[block.sample_id].copy().reset_index()
        observed = bundle.predict_all(query.drop(columns=[TARGET], errors='ignore'))
        expected = block.set_index('sample_id').loc[query.sample_id].prediction.to_numpy()
        np.testing.assert_allclose(observed['selected'], expected, atol=1e-9)
        if TARGET in query:
            changed = query.copy(); changed[TARGET] = -1e10
            np.testing.assert_allclose(bundle.predict_all(changed)['selected'], expected, atol=1e-9)
        key = f'{part}_{policy}_{condition}'
        audits[key] = {}
        for name, variant in bundle.variants.items():
            assert variant.history.library.cohort.eq('training').all()
            assert not variant.history.library.excluded_extreme.any()
            if part.startswith('outer_') or part == 'temporal':
                assert not set(query.group_id) & set(variant.history.library.group_id)
            view = feature_view(query, variant.view)
            audit = history_audit(variant.history, view)
            if part == 'temporal':
                assert audit['not_completed_at_query_start'] == 0
            audits[key][name] = audit
            if variant.guarded:
                assert (observed[name] >= variant.low - 1e-8).all() and (observed[name] <= variant.high + 1e-8).all()
                X = variant.history.transform(view)
                values = variant.guard.transform(X)
                quality = quality_flag(view)
                feature_flags = variant.guard.flag(X)
                for family, model in variant.models.items():
                    values_pred = model.predict(values)
                    replaced = ~np.isfinite(values_pred) | (values_pred < variant.low) | (values_pred > variant.high)
                    component_events.append({'partition':part,'policy':policy,'condition':condition,'variant':name,
                        'component':family,'n':len(query),'component_range_fallback_n':int(replaced.sum()),
                        'quality_flag_n':int(quality.sum()),'feature_flag_n':int(feature_flags.sum())})
    for r in read_json(run / 'training_complete.json')['models']:
        check_hash(run / r['file'], r['sha256'])
        bundle = joblib.load(run / r['file'])
        params[r['file']] = {name: {'selected': bundle.selected == name, 'weights': variant.weights.tolist(),
            'range': [variant.low, variant.high], 'models': {k: m.steps[-1][1].get_params(deep=False) for k, m in variant.models.items()}}
            for name, variant in bundle.variants.items()}
    write_json(run / 'model_parameters.json', params)
    write_json(run / 'all_history_audits.json', audits)
    pd.DataFrame(component_events).to_csv(run / 'component_fallbacks.csv', index=False)
    return len(audits)


def comparison(pred):
    rows = []
    rng = np.random.default_rng(20260919)
    for (evaluation, policy), block in pred.groupby(['evaluation','policy']):
        new = block[block.model.eq('selected')].set_index('sample_id')
        for name in ('raw_unprotected','raw_guarded','previous_control','previous_proposed','paper_v2'):
            old = block[block.model.eq(name)].set_index('sample_id')
            if old.empty:
                continue
            old = old.loc[new.index]
            np.testing.assert_allclose(old.truth, new.truth)
            e1, e2 = (old.prediction - old.truth) ** 2, (new.prediction - new.truth) ** 2
            lo = hi = np.nan
            if new.group_id.notna().all():
                g = pd.DataFrame({'group':new.group_id, 'old':e1, 'new':e2, 'n':1}).groupby('group').sum()
                sampled = rng.integers(0, len(g), (2000, len(g)))
                delta = (g.new.to_numpy()[sampled].sum(axis=1) - g.old.to_numpy()[sampled].sum(axis=1)) / g.n.to_numpy()[sampled].sum(axis=1)
                lo, hi = np.quantile(delta, [.025,.975])
            rows.append({'evaluation':evaluation,'policy':policy,'reference':name,'reference_mse':e1.mean(),'selected_mse':e2.mean(),
                'mse_reduction_percent':100*(1-e2.mean()/e1.mean()),'delta_low':lo,'delta_high':hi})
    return pd.DataFrame(rows)


def plot(run, metrics):
    fig, axes = plt.subplots(2,3,figsize=(15,8.5),layout='constrained')
    for i, policy in enumerate(('completed','retrospective')):
        for j, evaluation in enumerate(('nested_oof','temporal','test')):
            block = metrics[metrics.policy.eq(policy)&metrics.evaluation.eq(evaluation)&metrics.dimension.eq('all')].set_index('model')
            names = ['previous_control','previous_proposed','raw_guarded','phase_guarded','selected']
            if policy == 'retrospective':
                names = ['paper_v2'] + names
            ax=axes[i,j]
            bars=ax.bar(range(len(names)),[block.loc[n,'mse'] for n in names],color=['#f59e0b' if n=='paper_v2' else '#0f766e' if n=='selected' else '#94a3b8' if n.startswith('previous') else '#60a5fa' for n in names])
            ax.bar_label(bars,fmt='%.2f',padding=3,fontsize=9)
            ax.set_xticks(range(len(names)),names,rotation=30,ha='right',fontsize=8)
            ax.set_title(f'{policy} | {evaluation}',fontsize=11);ax.set_ylabel('MSE (lower is better)');ax.margins(y=.2)
            ax.grid(axis='y',alpha=.2);ax.set_axisbelow(True)
    fig.suptitle('P2 episode features and guarded prediction | paired development evaluation',fontsize=14)
    fig.savefig(run/'comparison.png',dpi=180);plt.close(fig)


def trace_audit(run, original_root):
    path = original_root / 'CMP-data/training/CMP-training-097.csv'
    if not path.exists():
        if (run/'failure_trace.png').exists() and (run/'raw_failure_audit.json').exists():
            return
        raise FileNotFoundError('Use --original-root to reproduce the raw-trace audit figure')
    expected = next(s['sha256'] for s in read_json(run/'sources.json') if s['cohort']=='training' and s['file']==path.name)
    check_hash(path, expected)
    raw = pd.read_csv(path)
    raw = raw[raw.WAFER_ID.eq(3015014228)&raw.STAGE.eq('B')]
    v = raw.groupby('TIMESTAMP',sort=True)[SIGNALS].mean()
    chosen,info = select_episode(v)
    t=v.index.to_numpy();x=t-t[0];a,b=x[chosen[0]],x[chosen[-1]]
    fig,axes=plt.subplots(2,1,figsize=(13,6),layout='constrained')
    for ax in axes:
        for piece in np.split(np.arange(len(t)),np.flatnonzero(np.diff(t)>60)+1):
            ax.plot(x[piece],v.CENTER_AIR_BAG_PRESSURE.to_numpy()[piece],color='#475569',linewidth=1)
        ax.axvspan(a,b,color='#0f766e',alpha=.25,label='Selected heuristic episode')
        ax.set_ylabel('Center pressure\n(source units)');ax.grid(alpha=.2);ax.legend(loc='upper right')
    axes[0].set_title('Failure trace: repeated process activity under one wafer ID')
    axes[1].set_xlim(max(0,a-25),b+25)
    axes[1].set_title(f'Representative active episode: {b-a:.0f} source time units (label alignment unconfirmed)')
    axes[1].set_xlabel('Timestamp offset (source units)')
    fig.savefig(run/'failure_trace.png',dpi=180);plt.close(fig)
    write_json(run/'raw_failure_audit.json',{'wafer_id':3015014228,'stage':'B','source_file':path.name,
        'source_sha256':expected,'raw_rows':len(raw),'chambers':sorted(raw.CHAMBER.unique().tolist()),
        'timestamp_span':float(x[-1]),'largest_timestamp_gap':float(np.diff(t).max()),
        'selected_duration':float(b-a),'selected_offset_start':float(a),'selected_offset_end':float(b),**info,
        'label_alignment':'unknown; selected episode is a deterministic heuristic, not confirmed ground truth'})


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--run-dir',type=Path,default=ROOT/'runs/phm_cmp_robust_v2')
    parser.add_argument('--original-root',type=Path,default=ROOT.parent/'.tmp_phm_review/PHM/Dataset/CMP1')
    args=parser.parse_args();run=args.run_dir.resolve()
    p,c,t,s= [read_json(run/n) for n in ('protocol.json','completion.json','training_complete.json','evaluation_seal.json')]
    chosen=read_json(run/'selection.json')
    assert p['frozen_at'] < chosen['selected_at'] < s['sealed_at'] < c['completed_at']
    assert sha256(run/'selection.json')==t['selection_sha256']==s['selection_sha256']==c['selection_sha256']
    check_hash(run/'metrics.csv',c['metrics_sha256']);check_hash(run/'reference_predictions.csv.gz',s['predictions_sha256'])
    check_hash(run/'development_predictions.csv.gz',t['development_predictions_sha256'])
    check_hash(run/'reference_scored_predictions.csv.gz',c['reference_scored_predictions_sha256'])
    for name,h in t['details_sha256'].items():check_hash(run/name,h)
    for name,h in p['code_sha256'].items():
        check_hash(run/'code_snapshot'/name,h);check_hash(ROOT/'src/cmp_ml'/name,h)
    for name,h in p['preserved_files'].items():check_hash(ROOT/name,h)
    manifest=read_frame(run/'manifest.csv');parts=pd.read_csv(run/'partitions.csv')
    for partition,b in parts.groupby('partition'):
        a=manifest[manifest.sample_id.isin(b.loc[b.role.eq('train'),'sample_id'])]
        q=manifest[manifest.sample_id.isin(b.loc[b.role.eq('evaluation'),'sample_id'])]
        audit_partition(a,q,partition=='temporal')
    predictions=pd.concat([read_frame(run/n) for n in ('development_predictions.csv.gz','reference_scored_predictions.csv.gz','paired_previous_predictions.csv.gz')],ignore_index=True)
    assert not predictions.duplicated(['partition','policy','model','sample_id']).any()
    predictions['evaluation']=predictions.partition.where(~predictions.partition.str.startswith('outer_'),'nested_oof')
    metrics=pd.read_csv(run/'metrics.csv',float_precision='round_trip')
    for row in metrics.itertuples():
        b=predictions[predictions.evaluation.eq(row.evaluation)&predictions.policy.eq(row.policy)&predictions.model.eq(row.model)]
        if row.dimension!='all':b=b[b[row.dimension].eq(row.value)]
        expected=score(b)
        np.testing.assert_allclose([row.mse,row.rmse,row.mae,row.r2],[expected[k] for k in ('mse','rmse','mae','r2')],rtol=1e-10,atol=1e-10)
    inner_n=verify_inner(run,manifest)
    bundle_n=verify_bundles(run,p,predictions)
    effects=comparison(predictions);effects.to_csv(run/'paired_effects.csv',index=False)
    fold_scores=[{'partition':part,'policy':policy,'model':model,**score(b)} for (part,policy,model),b in
                 predictions[predictions.partition.str.startswith('outer_')].groupby(['partition','policy','model'])]
    pd.DataFrame(fold_scores).to_csv(run/'fold_metrics.csv',index=False)
    summary=metrics[metrics.dimension.eq('all')].pivot(index=['policy','model'],columns='evaluation',values='mse').reset_index()
    summary.to_csv(run/'summary.csv',index=False)
    flags=pd.concat([pd.read_csv(run/n) for n in ('development_fallbacks.csv','reference_fallbacks.csv')],ignore_index=True)
    flags['evaluation']=flags.partition.where(~flags.partition.str.startswith('outer_'),'nested_oof')
    fallback=flags.groupby(['evaluation','policy','variant']).fallback.agg(['size','sum','mean']).reset_index()
    fallback.columns=['evaluation','policy','variant','n','fallback_n','fallback_fraction']
    fallback.to_csv(run/'fallback_summary.csv',index=False)
    case=predictions[predictions.sample_id.eq('78f0c2e5cda9415ecec3') & predictions.partition.eq('outer_3')].copy()
    case['absolute_error']=np.abs(case.prediction-case.truth)
    case.to_csv(run/'previous_failure_case.csv',index=False)
    verify={'verified_at':utcnow(),'metric_rows_recomputed':len(metrics),'inner_partitions_checked':inner_n,
            'history_and_query_invariance_blocks_checked':bundle_n,'previous_files_preserved':len(p['preserved_files']),
            'paired_outer_partitions_unchanged':True,'protected_predictions_within_training_support':True,
            'bootstrap_note':'Descriptive fixed-prediction group resampling, not independent confirmatory inference.'}
    write_json(run/'independent_verification.json',verify)
    plot(run,metrics)
    trace_audit(run,args.original_root)
    report(run,summary,effects,fallback,case,verify,chosen)
    print(summary.to_string(index=False))


def report(run,summary,effects,fallback,case,verify,chosen):
    selected=[]
    for key,detail in chosen['decisions'].items():
        if key.startswith('final_'):
            d=detail['variants'][detail['selected']]
            selected.append({'policy':detail['policy'],'condition':detail['condition'],'variant':detail['selected'],
                'weights':'; '.join(f'{k}={w:.4f}' for k,w in zip(d['keys'],d['weights']))})
    comparisons=effects[(effects.policy.eq('completed')&effects.reference.eq('previous_control')) |
                        (effects.policy.eq('retrospective')&effects.reference.eq('paper_v2'))]
    text=f'''# P2 구간 정제·입력 보호 실험 v2

이전 실패 분석에 따라 입력 구간과 예측 보호 규칙을 바꾼 후속 개발 실험이다.
원래 논문 baseline과 이전 모델·결과를 보존했다. API/Unity 모델은 교체하지 않았다.
이전 Test와 외부 fold 결과를 보고 가설을 세웠으므로 **새 독립 데이터 검증이 아니다**.

과거에 완료된 공정의 이력만 쓰는 `completed` 조건에서 기존 안정 대조군 대비 MSE가
그룹 검증 22.4289 → **21.7694 (2.94% 감소)**, 시간순 검증 12.4201 → **11.7714 (5.22% 감소)**,
기존 Test 9.3458 → **8.9491 (4.24% 감소)**로 낮아졌다. 이 감소율은 MSE의 상대 변화이며 정확도나 오차율 자체가 아니다.
그룹·시간순 검증의 대응 MSE 차이 재표집 구간은 각각 [-3.0949, 0.9520], [-1.4515, 0.3480]으로 0을 포함한다.
따라서 관측된 개선은 있으나 우월성이 확정됐다고 해석하지 않는다.

논문 비교용 `retrospective` 조건의 Test는 기존 P2 **7.0743**에서 새 절차 **7.2980**으로 악화됐다.
이 조건의 기존 최고 모델은 유지한다. 두 이력 정책의 수치를 섞어 순위를 매기지 않는다.
대표 활성 구간만 쓰는 `phase_guarded`는 전체 그룹 검증에서 오히려 나빠져, 구간을 짧게 고르는 것이 보편적인 해법은 아니었다.
결측·범위 초과 입력을 처리하고 여러 집계 후보를 내부 검증으로 선택한 절차의 결과로 해석한다.

## 동일 표본에서의 MSE

{table(summary,['policy','model','nested_oof','temporal','validation','test'])}

`completed`는 공정 종료 전후를 지켜 과거 Train 제거율만 이력으로 사용한다. 즉시 계측 가능 가정이며 실측 지연은 미확인이다.
`retrospective`는 미래 Train 이웃을 허용하는 이전 P2 비교 조건이다. 온라인 예측 성능으로 해석하지 않는다.
`nested_oof`는 동일한 1,977건의 5fold 바깥 예측을 합친 MSE이고, 시간순 진단은 1,551건 학습/166건 평가/260건 경계 제외다.
기존 Validation/Test 각 424건은 최종 설정을 고정한 뒤 참고용으로 평가했다.

`previous_control`/`previous_proposed`는 이전 improvement v1 예측 그대로,
`paper_v2`는 당시 동일 outer/time 학습 부분에 재적합한 P2 v2와 공식 분할의 저장 모델이다.
이번 `raw_unprotected`는 125개 전체 특징과 새로 고정한 9개 회귀 설정을 쓰므로 이전 모델과 동일하지 않다.
`raw_guarded`와 비교하면 입력/예측 보호 묶음의 효과를 볼 수 있고, 보호된 raw/gap/phase 사이에서는 집계 규칙을 비교한다.
`selected`는 각 학습 부분의 내부 OOF MSE로 보호된 후보 셋 중 선택한 절차다. Test로 다시 고르지 않았다.

## 이전 기준선 대비

{table(comparisons,['evaluation','policy','reference','reference_mse','selected_mse','mse_reduction_percent'])}

양의 감소율은 개선, 음수는 악화다. 표본 수·시간 조건이 다른 평가의 숫자를 직접 비교하지 않는다.
[전체 대응 비교](paired_effects.csv)의 delta_low/high는 고정 예측을 파일 연결 그룹으로 재표집한 기술적 구간이며
새 독립 통계 검정이 아니다. 외부 공식 분할은 파일 연결 그룹 ID가 없어 구간을 산출하지 않았다.

## 이전 실패 표본 유지

{table(case[['policy','model','truth','prediction','absolute_error']],['policy','model','truth','prediction','absolute_error'])}

이 표본에는 같은 wafer ID/chamber 4로 여러 활성 구간과 대기가 기록됐다. 원시 5,205행의 전체 시간 범위는 5,283,
최대 기록 간격은 63이었다. 한 번의 긴 결측 구간만이 원인은 아니다. 재작업인지 ID 기록 문제인지,
어느 연마 구간이 실측 제거율에 대응하는지는 확인되지 않았다. 최장 활성 구간은 공개한 가정이다.
이 표본은 학습/평가에서 제거하지 않았으며 새 규칙은 타깃을 보지 않고 모든 표본에 동일하게 적용했다.

[원시 기록 확인](raw_failure_audit.json)과 아래 그림은 반복된 압력 동작 및 대표 구간을 보여준다.

![원시 기록과 대표 활성 구간](failure_trace.png)

## 대체 예측 빈도와 최종 설정

{table(fallback[fallback.variant.eq('selected')],['evaluation','policy','n','fallback_n','fallback_fraction'])}

품질이 모호하거나 물리 특징의 결측/범위 초과가 감지되면 해당 학습 fold에서 선택한 Bagging 예측을 사용했다.
대체가 많으면 최종 결과는 상당 부분 트리 모델의 성능을 반영한다. 이는 입력이 정상임을 인증하는 기능이 아니다.
개별 선형/SVR 예측이 학습 y 범위를 벗어날 때의 성분 대체도 별도로 적용한다.
위 표는 전체 결합을 트리로 바꾼 횟수이고, 성분 대체 횟수와 혼동하지 않는다.
[성분별 범위 초과 대체 횟수](component_fallbacks.csv)도 별도로 기록했다.

{table(pd.DataFrame(selected),['policy','condition','variant','weights'])}

보호 입력 임퓨팅·분위수·범위 검사는 fold-local이다. Ridge 가중치 상한은 사전 고정한 0.25이다.
학습 y 지지 범위를 벗어나는 실제 새 공정까지 외삽할 수 있다고 주장하지 않는다.

![성능 비교](comparison.png)

## 재현과 검사

- [사전 계획](PROTOCOL.md), [소스·입력·분할 해시](protocol.json), [555개 로그 해시](sources.json).
- [구간 품질 진단](quality.csv), [전체 {verify['metric_rows_recomputed']}개 지표](metrics.csv), [선택 근거](selection_details), [최종 모델 6개](training_complete.json).
- 내부 선택 {verify['inner_partitions_checked']}개, 이력/타깃 불변성 블록 {verify['history_and_query_invariance_blocks_checked']}개를 검사했다.
  이전 파일 {verify['previous_files_preserved']}개의 해시가 동일했다. [독립 검증](independent_verification.json).
- [자동 테스트 결과](tests.json), [배포 파일 해시 목록](artifact_manifest.json).
- [실행 방법](../../docs/p2-robust-v2.md). 원시 데이터·전체 외부 fold 모델 캐시는 공개 저장소에 넣지 않는다.
- 새 모델은 `RobustBundle.variants[RobustBundle.selected].predict(frame)`으로 선택된 보호 예측과 대체 여부를 제공한다.
  `predict_all`에는 연구 비교용 비보호 후보도 포함된다. 입력은 원시 CSV가 아니라 준비된 P2/새 구간 특징과 품질 필드다.
'''
    (run/'README.md').write_text(text,encoding='utf-8')


if __name__=='__main__':main()
