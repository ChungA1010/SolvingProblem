"""Independently recompute metrics, trace selection and verify saved research models."""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from cmp_ml.baselines import check_hash
from cmp_ml.common import TARGET, read_json, sha256, utcnow, write_json
from cmp_ml.improvement import ROOT, audit_partition, history_audit
from cmp_ml.reconstruction import read_frame
from cmp_ml.boosted_models import VARIANTS, grid
from verify_robust import score, table


def verify_inner(run, manifest):
    count = 0
    crossfits = 0
    for path in sorted((run / 'selection_details').glob('*.json')):
        d = read_json(path)
        f = read_frame(path.with_suffix('.csv.gz'))
        assert len(f) == d['train_n'] and f.sample_id.is_unique
        meta = manifest.set_index('sample_id').loc[f.sample_id].reset_index()
        meta['fold'] = f.fold.to_numpy()
        for fold in range(3):
            a, b = meta[meta.fold.ne(fold)], meta[meta.fold.eq(fold)]
            assert not set(a.group_id) & set(b.group_id)
            assert not set(a.WAFER_ID) & set(b.WAFER_ID)
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
            parent = meta if block == 'final_fit' else meta[meta.fold.ne(int(block.split('_')[1]))]
            seen = []
            for a in audits:
                refs, queries = set(a['reference_ids']), set(a['query_ids'])
                assert not refs & queries and refs | queries == set(parent.sample_id)
                t = parent[parent.sample_id.isin(refs)]
                q = parent[parent.sample_id.isin(queries)]
                assert not set(t.group_id) & set(q.group_id) and not set(t.WAFER_ID) & set(q.WAFER_ID)
                assert len(t) == a['reference_n'] and len(q) == a['query_n']
                seen.extend(a['query_ids']); crossfits += 1
            assert sorted(seen) == sorted(parent.sample_id.tolist())
        count += 1
    assert count == 42 and crossfits == 504
    return count, crossfits


def verify_models(run, protocol, predictions):
    cache = ROOT / protocol['cache']
    train = read_frame(cache / 'training.csv.gz')
    frames = {n: read_frame(cache / f'{n}.csv.gz') for n in ('validation', 'test')}
    parts = pd.read_csv(run / 'partitions.csv')
    audits = {}
    importance = []
    for key, d in read_json(run / 'selection.json')['decisions'].items():
        partition = key.rsplit('_', 2)[0]
        p = cache / f'{key}.joblib'
        check_hash(p, read_json(p.with_suffix('.json'))['sha256'])
        bundle = joblib.load(p)[0]
        if partition == 'final':
            fit = train[train.condition.eq(d['condition'])]
            model_path = run / 'models' / f"{d['policy']}_{d['condition']}.joblib"
            bundle = joblib.load(model_path)
            queries = frames
            for name, model in bundle.models.items():
                view = name.split('_')[0]
                importance.extend({'policy': d['policy'], 'condition': d['condition'], 'variant': name, 'feature': f, 'importance': float(v)}
                    for f, v in zip(bundle.builder.names[view], model.get_feature_importance()))
        else:
            block = parts[parts.partition.eq(partition)]
            fit = train[train.sample_id.isin(block.loc[block.role.eq('train'), 'sample_id']) & train.condition.eq(d['condition'])]
            q = train[train.sample_id.isin(block.loc[block.role.eq('evaluation'), 'sample_id'])]
            queries = {partition: q}
        assert set(bundle.builder.history.library.sample_id) == set(fit.sample_id)
        assert bundle.selected == d['selected']
        assert len(bundle.builder.names['base']) == 125 and len(bundle.builder.names['joint']) == 401
        assert not set(bundle.builder.names['joint']) & {TARGET, 'sample_id', 'WAFER_ID', 'start', 'end', 'group_id'}
        assert bundle.low == fit[TARGET].min() and bundle.high == fit[TARGET].max()
        for partition_name, frame in queries.items():
            q = frame[frame.condition.eq(d['condition'])].copy()
            audits[f'{key}:{partition_name}'] = history_audit(bundle.builder.history, q)
            expected = predictions[predictions.partition.eq(partition_name) & predictions.policy.eq(d['policy']) & predictions.condition.eq(d['condition'])]
            values, flags = bundle.predict_all(q)
            changed = q.iloc[::-1].copy(); changed[TARGET] = -1e12
            modified, _ = bundle.predict_all(changed)
            for name, v in values.items():
                ref = expected[expected.model.eq(name)].set_index('sample_id').loc[q.sample_id]
                np.testing.assert_allclose(v, ref.prediction, rtol=0, atol=1e-8)
                np.testing.assert_allclose(v, modified[name][::-1], rtol=0, atol=1e-8)
                assert ((v >= bundle.low - 1e-8) & (v <= bundle.high + 1e-8)).all()
            np.testing.assert_equal(values['selected'], values[bundle.selected])
    write_json(run / 'all_history_audits.json', audits)
    pd.DataFrame(importance).to_csv(run / 'feature_importance.csv', index=False)
    return len(audits)


def paired_effects(pred):
    rng = np.random.default_rng(20260919)
    rows = []
    for (evaluation, policy), block in pred.groupby(['evaluation', 'policy']):
        new = block[block.model.eq('selected')].set_index('sample_id')
        for name in ['robust_reference', 'previous_control', 'paper_v2', *VARIANTS]:
            old = block[block.model.eq(name)].set_index('sample_id')
            if old.empty:
                continue
            old = old.loc[new.index]
            np.testing.assert_allclose(old.truth, new.truth)
            before, after = (old.prediction - old.truth)**2, (new.prediction - new.truth)**2
            low = high = np.nan
            if new.group_id.notna().all():
                g = pd.DataFrame({'group': new.group_id, 'before': before, 'after': after, 'n': 1}).groupby('group').sum()
                ids = rng.integers(0, len(g), (2000, len(g)))
                delta = (g.after.to_numpy()[ids].sum(axis=1) - g.before.to_numpy()[ids].sum(axis=1)) / g.n.to_numpy()[ids].sum(axis=1)
                low, high = np.quantile(delta, [.025, .975])
            rows.append({'evaluation': evaluation, 'policy': policy, 'reference': name,
                'reference_mse': before.mean(), 'selected_mse': after.mean(),
                'mse_reduction_percent': 100 * (1 - after.mean()/before.mean()), 'delta_low': low, 'delta_high': high})
    return pd.DataFrame(rows)


def plot(run, metrics):
    fig, axes = plt.subplots(2, 3, figsize=(15, 8.5), layout='constrained')
    for i, policy in enumerate(('completed', 'retrospective')):
        for j, evaluation in enumerate(('nested_oof', 'temporal', 'test')):
            b = metrics[metrics.policy.eq(policy) & metrics.evaluation.eq(evaluation) & metrics.dimension.eq('all')].set_index('model')
            names = ['robust_reference', *VARIANTS, 'selected']
            if policy == 'retrospective':
                names = ['paper_v2'] + names
            ax = axes[i, j]
            bars = ax.bar(range(len(names)), [b.loc[n, 'mse'] for n in names], color=[
                '#0f766e' if n == 'selected' else '#f59e0b' if n == 'paper_v2' else '#94a3b8' if n == 'robust_reference' else '#60a5fa' for n in names])
            ax.bar_label(bars, fmt='%.2f', fontsize=8, padding=3)
            ax.set_xticks(range(len(names)), names, rotation=35, ha='right', fontsize=8)
            ax.set_title(f'{policy} | {evaluation}'); ax.set_ylabel('MSE (lower is better)')
            ax.margins(y=.2); ax.grid(axis='y', alpha=.2); ax.set_axisbelow(True)
    fig.suptitle('Direct vs residual CatBoost | paired development evaluation')
    fig.savefig(run / 'comparison.png', dpi=180); plt.close(fig)


def report(run, metrics, effects, clips, tail, verification):
    summary = metrics[metrics.dimension.eq('all')].pivot(index=['policy', 'model'], columns='evaluation', values='mse').reset_index()
    summary.to_csv(run / 'summary.csv', index=False)
    compare = effects[(effects.policy.eq('completed') & effects.reference.eq('robust_reference')) |
                      (effects.policy.eq('retrospective') & effects.reference.eq('paper_v2'))]
    decisions = read_json(run / 'selection.json')['decisions']
    rows = [{'policy': d['policy'], 'condition': d['condition'], 'selected': d['selected'],
        'inner_mse': d['scores'][d['selected']]} for k, d in decisions.items() if k.startswith('final_')]
    audit = pd.read_csv(run / 'tail_audit.csv')
    note = '원본 제거율과 준비 타깃의 평균이 99건 모두 일치했다. 단순 매칭 오류는 발견되지 않았다.'
    text = f'''# P2 다중 구간·CatBoost 직접/잔차 실험 v3

이전 robust v2의 남은 오차를 바탕으로 학습 특징과 모델을 바꾼 후속 개발 실험이다.
모든 논문 baseline과 기존 결과를 보존했고 API/Unity 모델은 교체하지 않았다.
이전 공식 Test/Validation과 바깥 fold를 이미 보았으므로 **새 독립 검증이 아니다**.

**이번 후보는 기존 모델을 대체하지 않는다.** 완료된 과거 이력 조건의 선택 절차는 그룹 검증 MSE를
21.7694 → **18.6431 (14.36% 감소)**로 낮췄지만, 시간순은 11.7714 → **14.3296**,
기존 Test는 8.9491 → **11.3107**로 악화됐다. 논문 비교 조건의 기존 Test 최고값 **7.0743**도
새 선택 절차 **12.4615**보다 좋다. 좋지 않은 결과까지 그대로 보존했다.

Cond2의 그룹 검증 MSE는 26.6775 → **19.0245**로 줄었으나 시간순 12.8110 → **19.1492**,
Test 8.7258 → **14.1092**로 나빠졌다. completed 최종 선택에서 Cond1/3은 기존 모델,
Cond2는 새 base_direct였으므로 공식 Test 악화는 이 Cond2 교체에서 발생했다.

예상했던 잔차 보정은 이번 설정에서 직접 예측보다 전반적으로 불리했다.
401개 특징의 결합도 일관된 우위를 보이지 않았다. 그룹 검증에서 유리한 선택이 이후 시간과 공식 Test에
그대로 이어지지 않았다는 관찰이며, 분포 변화·이력 밀도·모델 편향 중 원인이 무엇인지는 확정하지 않는다.
다음 개발에서는 **여러 시점의 시간순 내부 검증으로 모델을 선택하는 절차**를 우선 점검할 필요가 있다.
이 문장은 다음 실험 제안이며 이번 결과를 보고 후보를 재선정한 것은 아니다.

## 같은 조건에서의 비교

{table(compare, ['evaluation','policy','reference','reference_mse','selected_mse','mse_reduction_percent'])}

MSE 감소율은 상대 변화이며 정확도나 오차율 그 자체가 아니다. 양수는 개선, 음수는 악화다.
`completed`는 완료된 Train 공정의 이력만 쓰되 즉시 계측을 가정한다. `retrospective`는 미래 Train 이웃을 허용하는
이전 논문 비교 조건이다. 두 정책이나 표본 구성이 다른 평가의 숫자를 섞어 순위를 매기지 않는다.
[대응 차이의 재표집 구간](paired_effects.csv)은 고정 예측의 파일 연결 그룹 재표집이며, 독립 확인 검정이 아니다.

## 전체 MSE와 후보 선택

{table(summary, ['policy','model','nested_oof','temporal','validation','test'])}

`base`는 125개 특징, `joint`는 raw/gap/대표 phase/전체 활성 구간·품질·이력 요약을 결합한 401개 특징이다.
`direct`는 제거율을 직접 예측하고, `residual`은 최근 5개 lag 평균과 이웃 10개 평균의 결합 예측에 잔차를 더한다.
신규 모델의 학습 이력은 별도 내부 그룹 교차 적합으로 만들어 자기 웨이퍼/파일 그룹의 타깃을 참조하지 않는다.
검증 조회는 해당 학습 부분 전체의 이력을 사용하므로 훈련과 조회의 이력 밀도 차이는 남는다.

`robust_reference`는 동일 학습 분할에서 적합했던 robust v2 선택 모델이다. 저장 예측과 동일함을 확인했다.
각 CatBoost 후보의 설정을 내부 3fold MSE로 정한 뒤 네 후보와 기존 모델 중 내부 MSE 최소를 `selected`로 선택했다.
바깥 5fold는 이 절차 전체를 평가한다. 이전 모델의 내부 결합 점수는 가중치까지 같은 OOF로 맞춰 낙관적일 수 있다.
기존 모델과의 차이는 학습기·특징·학습 이력 교차 적합이 함께 바뀐 결과다. 한 변경의 인과 효과로 해석하지 않는다.

{table(pd.DataFrame(rows), ['policy','condition','selected','inner_mse'])}

[42개 선택 상세](selection_details), [6개 최종 모델](training_complete.json), [특징 중요도](feature_importance.csv).
특징 중요도는 CatBoost PredictionValuesChange이며 인과 영향이나 검증 데이터 중요도가 아니다.

## 상위 오차 99건 점검

{note}
그중 primary 구간 모호성 표시가 {int(audit.qc_primary_ambiguous.sum())}건, 보조 구간 누락 {int(audit.qc_secondary_missing.sum())}건,
복수 원시 파일에 걸친 표본 {int(audit.source_files.str.contains(';').sum())}건이었다.
활성 구간과 계측 라벨의 물리적 대응까지 확인된 것은 아니며, 표본·정답을 수정하거나 제거하지 않았다.
[원시 파일·타깃·구간 진단](tail_audit.csv).

{table(tail, ['subset','n','reference_mse','selected_mse'])}

상위 99건은 이전 모델의 오차로 골랐으므로 이 부분집합 개선은 진단값이며 공정한 독립 성능 지표가 아니다.
전체 1,977건과 시간순 166건의 결과를 함께 평가해야 한다.

## 예측 범위 제한

{table(clips[clips.model.eq('selected')], ['evaluation','policy','n','clipped_n','clipped_fraction'])}

신규 직접/잔차/이력 기준 예측은 해당 학습 y의 min/max로 제한한다. 이 범위는 평가 정답으로 정하지 않는다.
기존 `robust_reference`는 이전 Bagging 대체 규칙을 그대로 쓴다. 위 clipping 수에는 기존 모델의 Bagging 대체는 포함되지 않는다.
훈련 제거율 지지 범위 밖의 새 공정으로 외삽 가능한 모델로 해석하지 않는다.

![성능 비교](comparison.png)

## 검증과 재현

- 원시 로그 555개 및 학습 제거율 파일 해시 확인. [입력 기록](inputs.json), [사전 계획](PROTOCOL.md).
- 지표 {verification['metric_rows_recomputed']}개 독립 재계산, 내부 선택 {verification['inner_partitions_checked']}개,
  학습용 이력 교차 적합 분할 {verification['feature_crossfit_blocks_checked']}개, 모델 이력/타깃 불변성 블록 {verification['model_query_blocks_checked']}개 확인.
- 이전 파일 {verification['previous_files_preserved']}개 해시 보존. [검증 결과](independent_verification.json), [테스트](tests.json), [파일 해시](artifact_manifest.json).
- [실행 방법](../../docs/p2-boosted-v3.md). 원시 데이터와 전체 바깥 모델 캐시는 공개 저장소에 넣지 않는다.
- 새 모델 입력은 준비된 특징·품질·이력 메타데이터 frame이다. `bundle.predict_all(frame)`은
  (후보별 예측 dict, 범위 제한 여부 dict)를 반환하며 실제 선택 예측은 첫 dict의 `selected`이다.
'''
    (run / 'README.md').write_text(text, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-dir', type=Path, default=ROOT / 'runs/phm_cmp_boosted_v3')
    run = parser.parse_args().run_dir.resolve()
    p, trained, selected, seal, completed = [read_json(run / n) for n in
        ('protocol.json','training_complete.json','selection.json','evaluation_seal.json','completion.json')]
    assert p['frozen_at'] < selected['selected_at'] < seal['sealed_at'] < completed['completed_at']
    assert sha256(run / 'selection.json') == trained['selection_sha256'] == seal['selection_sha256'] == completed['selection_sha256']
    for name, key in [('metrics.csv','metrics_sha256'), ('training_complete.json','training_complete_sha256'),
                      ('evaluation_seal.json','evaluation_seal_sha256'), ('reference_scored_predictions.csv.gz','reference_scored_predictions_sha256')]:
        check_hash(run / name, completed[key])
    check_hash(run / 'reference_predictions.csv.gz', seal['predictions_sha256'])
    check_hash(run / 'development_predictions.csv.gz', trained['development_predictions_sha256'])
    for name, h in trained['details_sha256'].items(): check_hash(run / name, h)
    for name, h in p['frozen_files'].items(): check_hash(run / name, h)
    for name, h in p['code_sha256'].items():
        check_hash(ROOT / 'src/cmp_ml' / name, h); check_hash(run / 'code_snapshot' / name, h)
    for name, h in p['preserved_files'].items(): check_hash(ROOT / name, h)
    for name, h in p['cache_sha256'].items(): check_hash(ROOT / p['cache'] / name, h)
    for record in trained['models']: check_hash(run / record['file'], record['sha256'])
    manifest = read_frame(run / 'manifest.csv')
    parts = pd.read_csv(run / 'partitions.csv')
    for partition, b in parts.groupby('partition'):
        a = manifest[manifest.sample_id.isin(b.loc[b.role.eq('train'),'sample_id'])]
        q = manifest[manifest.sample_id.isin(b.loc[b.role.eq('evaluation'),'sample_id'])]
        audit_partition(a, q, partition == 'temporal')
    pred = pd.concat([read_frame(run / n) for n in
        ('development_predictions.csv.gz','reference_scored_predictions.csv.gz','paired_previous_predictions.csv.gz')], ignore_index=True)
    assert not pred.duplicated(['partition','policy','model','sample_id']).any()
    pred['evaluation'] = pred.partition.where(~pred.partition.str.startswith('outer_'), 'nested_oof')
    for (evaluation, policy, model), block in pred.groupby(['evaluation','policy','model']):
        assert block.sample_id.is_unique
        assert len(block) == {'nested_oof':1977, 'temporal':166, 'validation':424, 'test':424}[evaluation]
    metrics = read_frame(run / 'metrics.csv')
    for row in metrics.itertuples():
        b = pred[pred.evaluation.eq(row.evaluation) & pred.policy.eq(row.policy) & pred.model.eq(row.model)]
        if row.dimension != 'all': b = b[b[row.dimension].eq(row.value)]
        s = score(b)
        assert row.n == len(b)
        np.testing.assert_allclose([row.mse,row.rmse,row.mae,row.r2], [s[k] for k in ('mse','rmse','mae','r2')], atol=1e-10, rtol=1e-10)
        error = b.prediction.to_numpy() - b.truth.to_numpy()
        relative = np.mean(np.abs(error) / np.abs(b.truth.to_numpy()))
        exponent = np.where(error < 0, -error / 13, error / 10)
        assert exponent.max() < 700 and not row.s_score_overflow
        np.testing.assert_allclose([row.relative_error,row.mape_percent,row.s_score_literal_mean,row.s_score_minus_one_mean],
            [relative,100 * relative,np.exp(exponent).mean(),np.expm1(exponent).mean()], atol=1e-10, rtol=1e-10)
    inner, crossfits = verify_inner(run, manifest)
    models = verify_models(run, p, pred)
    effects = paired_effects(pred); effects.to_csv(run / 'paired_effects.csv', index=False)
    folds = [{'partition': a,'policy': b,'model': c,**score(f)} for (a,b,c),f in
        pred[pred.partition.str.startswith('outer_')].groupby(['partition','policy','model'])]
    pd.DataFrame(folds).to_csv(run / 'fold_metrics.csv', index=False)
    flags = pd.concat([pd.read_csv(run / n) for n in ('development_clipping.csv','reference_clipping.csv')])
    flags['evaluation'] = flags.partition.where(~flags.partition.str.startswith('outer_'), 'nested_oof')
    clips = flags.groupby(['evaluation','policy','model']).clipped.agg(['size','sum','mean']).reset_index()
    clips.columns = ['evaluation','policy','model','n','clipped_n','clipped_fraction']
    clips.to_csv(run / 'clipping_summary.csv', index=False)
    tail_ids = set(pd.read_csv(run / 'tail_audit.csv').sample_id)
    tail = []
    b = pred[pred.evaluation.eq('nested_oof') & pred.policy.eq('completed')]
    for name, ids in [('previous_top_99',tail_ids), ('all_training',set(b.sample_id))]:
        old = b[b.sample_id.isin(ids) & b.model.eq('robust_reference')]
        new = b[b.sample_id.isin(ids) & b.model.eq('selected')]
        tail.append({'subset':name,'n':len(new),'reference_mse':score(old)['mse'],'selected_mse':score(new)['mse']})
    tail = pd.DataFrame(tail); tail.to_csv(run / 'tail_comparison.csv', index=False)
    verification = {'verified_at':utcnow(),'metric_rows_recomputed':len(metrics),'inner_partitions_checked':inner,
        'feature_crossfit_blocks_checked':crossfits,'model_query_blocks_checked':models,
        'previous_files_preserved':len(p['preserved_files']),'paired_partitions_unchanged':True,
        'bootstrap_note':'Descriptive fixed-prediction group resampling, not confirmatory inference.'}
    write_json(run / 'independent_verification.json', verification)
    plot(run, metrics); report(run, metrics, effects, clips, tail, verification)
    print(pd.read_csv(run / 'summary.csv').to_string(index=False))


if __name__ == '__main__': main()
