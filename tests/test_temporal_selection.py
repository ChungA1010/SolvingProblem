import inspect
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from cmp_ml.common import TARGET, USAGE, read_json, sha256
from cmp_ml.robust_models import RobustBundle
from cmp_ml.temporal_models import rolling_plan, fit_condition
from cmp_ml.temporal_experiment import train


def frame(n=180):
    f = pd.DataFrame({'sample_id': [f's{i}' for i in range(n)], 'WAFER_ID': np.arange(n),
        'condition': 'Cond1', 'machine': 1, 'start': np.arange(n) * 100., 'end': np.arange(n) * 100. + 10,
        'group_id': [f'g{i // 2}' for i in range(n)], TARGET: 70 + np.arange(n) * .02})
    for zone in ('primary', 'secondary'):
        f[f'p2_{zone}_duration'] = 10.
        for c in USAGE + ['PRESSURIZED_CHAMBER_PRESSURE', 'CENTER_AIR_BAG_PRESSURE', 'WAFER_ROTATION', 'STAGE_ROTATION']:
            f[f'p2_{zone}_{c}_mean'] = np.arange(n) + 1.
    return f


def test_rolling_origins_preserve_whole_groups_and_strict_time_order():
    f = frame()
    f.loc[0, 'end'] = 16000
    plan = rolling_plan(f)
    queries = []
    for p in plan:
        if not p['eligible']: continue
        fit, q = f[f.sample_id.isin(p['fit_ids'])], f[f.sample_id.isin(p['query_ids'])]
        assert fit.end.max() < q.start.min()
        assert not set(fit.group_id) & set(q.group_id)
        assert 's0' not in p['fit_ids'] and 's1' not in p['fit_ids']
        queries.extend(p['query_ids'])
    assert len(queries) == len(set(queries))


def test_rolling_cutoffs_and_eligibility_are_target_blind():
    f = frame(); before = rolling_plan(f)
    f[TARGET] = np.arange(len(f))[::-1] ** 3
    assert rolling_plan(f) == before


def test_too_few_origins_fails_instead_of_relaxing_guards():
    with pytest.raises(ValueError, match='Fewer than two'):
        rolling_plan(frame(40))


class ConstantReference:
    def __init__(self, value): self.value = value
    def predict(self, q): return np.full(len(q), self.value), np.zeros(len(q), bool)


def test_origin_refits_see_only_earlier_rows_and_scores_pool_samples(tmp_path, monkeypatch):
    import cmp_ml.temporal_models as module
    f = frame(); plan = rolling_plan(f); seen = []
    def reference(data, policy):
        seen.append(set(data.sample_id))
        return RobustBundle({'raw': ConstantReference(data[TARGET].mean())}, 'raw'), {}, pd.DataFrame()
    monkeypatch.setattr(module, 'fit_reference', reference)
    small = [{**module.grid()[0], 'iterations': 3}]
    monkeypatch.setattr(module, 'grid', lambda: small)
    bundle, detail, inner = fit_condition(f, RobustBundle({'raw': ConstantReference(72.)}, 'raw'), plan, tmp_path, 'smoke')
    assert seen == [set(p['fit_ids']) for p in plan if p['eligible']]
    for name, expected in detail['candidate_scores'].items():
        assert expected == pytest.approx(np.square(inner[name] - inner.truth).mean())
    assert detail['selected'] == min(detail['scores'], key=lambda k: (detail['scores'][k], k))
    assert inner.sample_id.is_unique
    q = f.iloc[[-1]].copy(); a = bundle.predict_all(q)[0]
    q[TARGET] = -99999
    for k, v in bundle.predict_all(q)[0].items(): np.testing.assert_equal(v, a[k])


def test_training_has_no_reference_label_reader():
    assert 'test_truth' not in inspect.getsource(train)


def test_published_temporal_preservation_and_plan():
    root = Path(__file__).resolve().parents[1]
    run = root / 'runs/phm_cmp_temporal_v4'
    if not (run / 'completion.json').exists(): pytest.skip('Experiment not yet completed')
    p, s, e, c = [read_json(run / n) for n in ('protocol.json','selection.json','evaluation_seal.json','completion.json')]
    assert p['frozen_at'] < s['selected_at'] < e['sealed_at'] < c['completed_at']
    assert sha256(run / 'selection.json') == e['selection_sha256'] == c['selection_sha256']
    assert sha256(run / 'metrics.csv') == c['metrics_sha256']
    for n, h in p['preserved_files'].items(): assert sha256(root / n) == h
    for n, h in p['code_sha256'].items(): assert sha256(root / 'src/cmp_ml' / n) == h
    for d in s['decisions'].values():
        assert d['selected'] == min(d['scores'], key=lambda k: (d['scores'][k], k))
