"""Rolling-origin selection with file-group purging; existing estimators stay frozen."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .common import TARGET
from .improvement import checkpoint, audit_partition
from .improvement_models import mse
from .boosted_models import (VARIANTS, SEED, grid, make_model, crossfit_features, bounded_prediction, BoostedBundle)
from .robust_models import fit_condition as fit_reference, RobustBundle


def rolling_plan(train):
    groups = train.groupby('group_id').agg(start=('start', 'min'), end=('end', 'max'))
    cut = train.start.quantile([.4, .6, .8]).to_numpy(float)
    result = []
    for fold, (lower, upper) in enumerate(zip(cut, [cut[1], cut[2], np.inf])):
        fit = train[train.group_id.isin(groups.index[groups.end < lower])]
        query = train[train.group_id.isin(groups.index[(groups.start >= lower) & (groups.end < upper)])]
        eligible = len(fit) >= 60 and fit.group_id.nunique() >= 6 and len(query) >= 10 and query.group_id.nunique() >= 2
        item = {'fold': fold, 'lower': float(lower), 'upper': float(upper) if np.isfinite(upper) else None,
            'eligible': bool(eligible), 'fit_ids': fit.sample_id.tolist(), 'query_ids': query.sample_id.tolist(),
            'fit_n': len(fit), 'query_n': len(query), 'fit_groups': int(fit.group_id.nunique()), 'query_groups': int(query.group_id.nunique())}
        if eligible:
            item['audit'] = audit_partition(fit, query, True)
        result.append(item)
    if sum(r['eligible'] for r in result) < 2:
        raise ValueError('Fewer than two eligible rolling origins; do not loosen cutoffs using outcomes')
    ids = [sid for r in result if r['eligible'] for sid in r['query_ids']]
    assert len(ids) == len(set(ids))
    return result


def fit_condition(train, old_bundle, plan, cache, key, progress=None):
    train = train.reset_index(drop=True)
    assert train.condition.nunique() == 1 and rolling_plan(train) == plan
    parts, crossfit_audits = [], {}
    for r in plan:
        if not r['eligible']:
            continue
        fold = r['fold']
        fit = train[train.sample_id.isin(r['fit_ids'])].reset_index(drop=True)
        query = train[train.sample_id.isin(r['query_ids'])].reset_index(drop=True)
        audit_partition(fit, query, True)
        # Rebuild the complete incumbent procedure on the earlier window only.
        reference, _, _ = checkpoint(cache, f'{key}_reference_{fold}', lambda: fit_reference(fit, 'completed'))
        reference_pred = reference.variants[reference.selected].predict(query.drop(columns=[TARGET]))[0]
        X, anchor, builder, audits = crossfit_features(fit, 'completed')
        V, qanchor = builder.transform(query)
        low, high = float(fit[TARGET].min()), float(fit[TARGET].max())
        records = {'sample_id': query.sample_id, 'fold': fold, 'truth': query[TARGET], 'low': low, 'high': high,
            'robust_reference': reference_pred, 'history_anchor': np.clip(qanchor, low, high)}
        for variant in VARIANTS:
            view, method = variant.split('_')
            target = fit[TARGET].to_numpy(float) - (anchor if method == 'residual' else 0.)
            for spec in grid():
                model = make_model(spec, SEED + fold).fit(X[view], target)
                name = f'{variant}/{spec["id"]}'
                records[name], records[f'clipped/{name}'] = bounded_prediction(model, V[view], qanchor, method == 'residual', low, high)
        parts.append(pd.DataFrame(records))
        crossfit_audits[f'origin_{fold}'] = audits
        if progress:
            progress(f'origin {fold}: train={len(fit)}, validation={len(query)}')
    inner = pd.concat(parts, ignore_index=True)
    y = inner.truth.to_numpy(float)
    candidates = {f'{v}/{s["id"]}': mse(y, inner[f'{v}/{s["id"]}'].to_numpy()) for v in VARIANTS for s in grid()}
    chosen = {v: min(grid(), key=lambda s: (candidates[f'{v}/{s["id"]}'], s['id'])) for v in VARIANTS}
    scores = {v: candidates[f'{v}/{s["id"]}'] for v, s in chosen.items()}
    scores['robust_reference'] = mse(y, inner.robust_reference.to_numpy())
    selected = min(scores, key=lambda k: (scores[k], k))
    X, anchor, builder, audits = crossfit_features(train, 'completed')
    crossfit_audits['final_fit'] = audits
    y = train[TARGET].to_numpy(float)
    models = {}
    for variant, spec in chosen.items():
        view, method = variant.split('_')
        models[variant] = make_model(spec, SEED).fit(X[view], y - (anchor if method == 'residual' else 0.))
    reference = RobustBundle({old_bundle.selected: old_bundle.variants[old_bundle.selected]}, old_bundle.selected)
    bundle = BoostedBundle(builder, models, selected, float(y.min()), float(y.max()), reference)
    detail = {'policy': 'completed', 'condition': train.condition.iloc[0], 'train_n': len(train),
        'selection_n': len(inner), 'selected': selected, 'scores': scores, 'candidate_scores': candidates,
        'chosen_specs': chosen, 'feature_names': builder.names, 'rolling_plan': plan, 'feature_crossfits': crossfit_audits}
    return bundle, detail, inner
