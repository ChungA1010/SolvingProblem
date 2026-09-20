"""Group-cross-fitted target history for direct and residual CatBoost experiments."""
from __future__ import annotations

from dataclasses import dataclass

from catboost import CatBoostRegressor
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

from .common import TARGET
from .improvement_models import ResearchHistory, row_stats, mse
from .robust_models import RobustBundle

SEED = 20260918
VARIANTS = ('base_direct', 'joint_direct', 'base_residual', 'joint_residual')


def grid():
    return [{'id': f'{loss}_d{depth}', 'depth': depth, 'loss': 'RMSE' if loss == 'rmse' else 'Huber:delta=5',
             'iterations': 300, 'learning_rate': .05, 'l2_leaf_reg': 10.}
            for depth in (3, 5) for loss in ('rmse', 'huber')]


def make_model(spec, seed):
    return CatBoostRegressor(iterations=spec['iterations'], depth=spec['depth'], learning_rate=spec['learning_rate'],
        l2_leaf_reg=spec['l2_leaf_reg'], loss_function=spec['loss'], random_seed=seed,
        thread_count=4, allow_writing_files=False, verbose=False, nan_mode='Min',
        bootstrap_type='No', random_strength=0, border_count=64, task_type='CPU')


def history_anchor(base, mean):
    recent = row_stats(base[:, :5])[0]
    neighbors = row_stats(base[:, 11:21])[0]
    anchor = row_stats(np.column_stack([recent, neighbors]))[0]
    return np.where(np.isfinite(anchor), anchor, mean)


class FeatureBuilder:
    def fit(self, train, policy):
        self.history = ResearchHistory(policy).fit(train)
        self.mean = float(train[TARGET].mean())
        self.extra = sorted(c for c in train if c.startswith(('gap__p2_', 'phase__p2_', 'qc_', 'multi_')))
        self.names = {'base': self.history.names,
            'joint': self.history.names + [f'history_summary_{i}' for i in range(10)] + self.extra}
        return self

    def transform(self, query):
        views = self.history.views(query.drop(columns=[TARGET], errors='ignore'))
        X = {'base': views['base'], 'joint': np.column_stack([views['history'], query[self.extra].to_numpy(float)])}
        X = {k: np.where(np.isfinite(v), v, np.nan) for k, v in X.items()}
        return X, history_anchor(X['base'], self.mean)


def crossfit_features(train, policy):
    """Training rows reference labels from other file/wafer groups only."""
    train = train.reset_index(drop=True)
    builder = FeatureBuilder().fit(train, policy)
    values = {k: np.full((len(train), len(n)), np.nan) for k, n in builder.names.items()}
    anchors = np.full(len(train), np.nan)
    assignments, audits = np.full(len(train), -1), []
    for fold, (a, b) in enumerate(GroupKFold(3, shuffle=True, random_state=SEED).split(train, groups=train.group_id)):
        fit, query = train.iloc[a], train.iloc[b]
        if set(fit.group_id) & set(query.group_id) or set(fit.WAFER_ID) & set(query.WAFER_ID):
            raise ValueError('Training feature cross-fit leaks a group or wafer')
        f = FeatureBuilder().fit(fit, policy)
        X, baseline = f.transform(query)
        slots, _ = f.history.referenced_indices(query)
        for i, row in enumerate(query.itertuples()):
            ref = f.history.library.iloc[slots[i][slots[i] >= 0]]
            assert not ref.group_id.eq(row.group_id).any() and not ref.WAFER_ID.eq(row.WAFER_ID).any()
            if policy == 'completed':
                assert ref.end.lt(row.start).all()
        for name in values:
            values[name][b] = X[name]
        anchors[b] = baseline
        assignments[b] = fold
        audits.append({'fold': fold, 'reference_n': len(a), 'query_n': len(b),
            'reference_ids': fit.sample_id.tolist(), 'query_ids': query.sample_id.tolist(),
            'same_group_references': 0, 'same_wafer_references': 0,
            'future_references_allowed': policy != 'completed'})
    assert np.isfinite(anchors).all() and (assignments >= 0).all()
    return values, anchors, builder, audits


def bounded_prediction(model, X, anchor, residual, low, high):
    raw = model.predict(X) + (anchor if residual else 0.)
    if not np.isfinite(raw).all():
        raise ValueError('Nonfinite CatBoost prediction')
    return np.clip(raw, low, high), (raw < low) | (raw > high)


@dataclass
class BoostedBundle:
    builder: FeatureBuilder
    models: dict
    selected: str
    low: float
    high: float
    robust_reference: object

    def predict_all(self, query):
        X, anchor = self.builder.transform(query)
        result = {'history_anchor': np.clip(anchor, self.low, self.high)}
        flags = {'history_anchor': (anchor < self.low) | (anchor > self.high)}
        for name, model in self.models.items():
            view, method = name.split('_')
            result[name], flags[name] = bounded_prediction(model, X[view], anchor, method == 'residual', self.low, self.high)
        result['robust_reference'] = self.robust_reference.variants[self.robust_reference.selected].predict(query)[0]
        flags['robust_reference'] = np.zeros(len(query), dtype=bool)
        result['selected'] = result[self.selected]
        flags['selected'] = flags[self.selected]
        return result, flags


def fit_condition(train, policy, robust_bundle, robust_detail, robust_inner, progress=None):
    train = train.reset_index(drop=True)
    if train.condition.nunique() != 1 or train.group_id.nunique() < 5:
        raise ValueError('One condition with sufficient groups is required')
    y = train[TARGET].to_numpy(float)
    n = len(train)
    ids = train.sample_id.tolist()
    old = robust_inner[robust_inner.variant.eq(robust_detail['selected'])].set_index('sample_id').loc[ids]
    assert set(old.index) == set(ids) and len(old) == n
    predictions = {f'{variant}/{spec["id"]}': np.full(n, np.nan) for variant in VARIANTS for spec in grid()}
    clipped = {k: np.zeros(n, bool) for k in predictions}
    low, high, anchor_oof = np.empty(n), np.empty(n), np.empty(n)
    fold_ids, feature_audits = np.full(n, -1), {}
    for fold, (a, b) in enumerate(GroupKFold(3, shuffle=True, random_state=SEED).split(train, groups=train.group_id)):
        fit, query = train.iloc[a], train.iloc[b]
        assert not set(fit.group_id) & set(query.group_id) and not set(fit.WAFER_ID) & set(query.WAFER_ID)
        assert (old.iloc[b].fold == fold).all()
        X, anchor, builder, audits = crossfit_features(fit, policy)
        V, query_anchor = builder.transform(query)
        low[b], high[b] = fit[TARGET].min(), fit[TARGET].max()
        anchor_oof[b] = np.clip(query_anchor, low[b], high[b])
        fold_ids[b] = fold
        feature_audits[f'inner_{fold}'] = audits
        for variant in VARIANTS:
            view, method = variant.split('_')
            target = fit[TARGET].to_numpy(float) - (anchor if method == 'residual' else 0.)
            for spec in grid():
                model = make_model(spec, SEED + fold).fit(X[view], target)
                name = f'{variant}/{spec["id"]}'
                predictions[name][b], clipped[name][b] = bounded_prediction(model, V[view], query_anchor,
                    method == 'residual', low[b], high[b])
        if progress:
            progress(f'inner {fold + 1}/3')
    chosen = {variant: min((s for s in grid()), key=lambda s: (mse(y, predictions[f'{variant}/{s["id"]}']), s['id'])) for variant in VARIANTS}
    scores = {v: mse(y, predictions[f'{v}/{s["id"]}']) for v, s in chosen.items()}
    scores['robust_reference'] = mse(y, old.prediction.to_numpy())
    selected = min(scores, key=lambda k: (scores[k], k))
    X, anchor, builder, audits = crossfit_features(train, policy)
    feature_audits['final_fit'] = audits
    models = {}
    for variant, spec in chosen.items():
        view, method = variant.split('_')
        models[variant] = make_model(spec, SEED).fit(X[view], y - (anchor if method == 'residual' else 0.))
    reference = RobustBundle({robust_bundle.selected: robust_bundle.variants[robust_bundle.selected]}, robust_bundle.selected)
    bundle = BoostedBundle(builder, models, selected, float(y.min()), float(y.max()), reference)
    inner = pd.DataFrame({'sample_id': ids, 'fold': fold_ids, 'truth': y, 'low': low, 'high': high,
        'history_anchor': anchor_oof, 'robust_reference': old.prediction.to_numpy(), **predictions,
        **{f'clipped/{k}': v for k, v in clipped.items()}})
    detail = {'policy': policy, 'condition': train.condition.iloc[0], 'train_n': n,
        'selected': selected, 'chosen_specs': chosen, 'scores': scores,
        'candidate_scores': {k: mse(y, v) for k, v in predictions.items()},
        'feature_names': builder.names, 'feature_crossfits': feature_audits,
        'reference_variant': robust_detail['selected']}
    return bundle, detail, inner
