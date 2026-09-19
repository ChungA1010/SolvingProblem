"""Models/searches for completion v3; all estimators see training labels only."""
from __future__ import annotations

from dataclasses import dataclass
import time
import warnings

import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import BaggingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, KFold
from sklearn.neighbors import KNeighborsRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

from .common import TARGET
from .completion_features import (PUBLISHED_FINE, PUBLISHED_ROUGH, p1_columns, p3_columns)
from .paper_models import (P2Bundle, base_trees, direct_predictions, integration_weights, select_features)
from .reconstruction import metrics
from .reconstruction_models import ReconstructionHistory, fit_meta, p2_regressors

SEED = 20260917
KS = (5, 20, 35, 50, 65, 85)
P2_ARMS = [
    dict(id='clean_stable', clean=True, stable=True, distance='raw', lag='prior_start', past=False),
    dict(id='clean_ordinary', clean=True, stable=False, distance='raw', lag='prior_start', past=False),
    dict(id='full_ordinary', clean=False, stable=False, distance='raw', lag='prior_start', past=False),
    dict(id='completed_lag', clean=False, stable=False, distance='raw', lag='completed', past=False),
    dict(id='past_only', clean=False, stable=False, distance='raw', lag='completed', past=True),
    dict(id='standard_distance', clean=False, stable=False, distance='standardized', lag='prior_start', past=False),
]
FAMILIES = ('tree', 'knn', 'svr', 'ensemble_nn', 'rf')


def p1_models(seed, k):
    models = base_trees(seed)
    models['P1_RF'].set_params(max_features=max(1, k // 3), n_jobs=1)
    models['P1_ERT'].set_params(n_jobs=1)
    return models


def rank85(X, y, seed):
    """Normalized OOB permutation importance; unspecified author convention."""
    X = np.asarray(X, np.float32)
    if X.shape[1] != 85 or not np.isfinite(X).all():
        raise ValueError('Ranking requires 85 finite features')
    forest = RandomForestRegressor(n_estimators=100, max_features=28, min_samples_split=5,
                                   random_state=seed, n_jobs=1).fit(X, y)
    delta = np.zeros((100, 85))
    rng = np.random.default_rng(seed)
    for i, (tree, sampled) in enumerate(zip(forest.estimators_, forest.estimators_samples_)):
        oob = np.flatnonzero(np.bincount(sampled, minlength=len(y)) == 0)
        if not len(oob):
            continue
        v, truth = X[oob], y[oob]
        base = np.square(tree.predict(v) - truth).mean()
        used = np.unique(tree.tree_.feature[tree.tree_.feature >= 0])
        batch = np.tile(v, (len(used), 1))
        for j, col in enumerate(used):
            batch[j * len(v):(j + 1) * len(v), col] = v[rng.permutation(len(v)), col]
        if len(used):
            delta[i, used] = np.square(tree.predict(batch).reshape(len(used), -1) - truth).mean(axis=1) - base
    sd = delta.std(axis=0, ddof=1)
    score = np.divide(delta.mean(axis=0), sd, out=np.zeros(85), where=sd > 1e-12)
    return np.argsort(-score, kind='stable'), score


def p1_grid_task(train, valid, view, repeat):
    cols, seed = p1_columns(view), SEED + repeat
    X, y, V = train[cols].to_numpy(float), train[TARGET].to_numpy(float), valid[cols].to_numpy(float)
    begin = time.perf_counter()
    order, importance = rank85(X, y, seed)
    ranking_seconds = time.perf_counter() - begin
    rows, predictions = [], []
    for k in KS:
        chosen = order[:k]
        for name, model in p1_models(seed, k).items():
            begin = time.perf_counter()
            model.fit(X[:, chosen], y)
            elapsed = time.perf_counter() - begin
            p = model.predict(V[:, chosen])
            rows.append(dict(view=view, repeat=repeat, k=k, model=name, ranking_seconds=ranking_seconds,
                             fitting_seconds=elapsed, **metrics(valid[TARGET], p)))
            predictions.append(dict(view=view, repeat=repeat, k=k, model=name, prediction=p))
    return rows, predictions, [dict(feature=cols[i], importance=float(importance[i]), rank=j + 1)
                                for j, i in enumerate(order)]


@dataclass
class SelectedP1:
    columns: list
    full: dict
    fold_models: list
    fold_columns: list
    oof: np.ndarray
    in_sample: np.ndarray
    chosen: dict
    fold_selection: list

    def base_predict(self, query, mode):
        if mode == 'oof_fold_average':
            return {n: np.mean([m[n].predict(query[c].to_numpy(float)) for m, c in zip(self.fold_models, self.fold_columns)], axis=0)
                    for n in self.full}
        return {n: m.predict(query[self.columns].to_numpy(float)) for n, m in self.full.items()}

    def predict_all(self, query):
        out = self.base_predict(query, 'oof_refit')
        for name, (spec, model) in self.chosen.items():
            z = np.column_stack(list(self.base_predict(query, spec['mode']).values()))
            out[name] = model.predict(z)
        return out


def fit_p1_selected(train, view, k, meta_specs):
    cols = p1_columns(view)
    X, y = train[cols].to_numpy(float), train[TARGET].to_numpy(float)
    order, _ = rank85(X, y, SEED)
    chosen = [cols[i] for i in order[:k]]
    full = {n: m.fit(train[chosen].to_numpy(float), y) for n, m in p1_models(SEED, k).items()}
    inside = np.column_stack([m.predict(train[chosen].to_numpy(float)) for m in full.values()])
    oof = np.full((len(train), 3), np.nan)
    fold_models, fold_columns, audit = [], [], []
    for a, b in KFold(5, shuffle=True, random_state=SEED).split(train):
        order, _ = rank85(X[a], y[a], SEED)
        c = [cols[i] for i in order[:k]]
        models = {n: m.fit(train.iloc[a][c].to_numpy(float), y[a]) for n, m in p1_models(SEED, k).items()}
        oof[b] = np.column_stack([m.predict(train.iloc[b][c].to_numpy(float)) for m in models.values()])
        fold_models.append(models); fold_columns.append(c)
        audit.append(dict(train_ids=train.iloc[a].sample_id.tolist(), validation_ids=train.iloc[b].sample_id.tolist(), selected=c))
    bundle = SelectedP1(chosen, full, fold_models, fold_columns, oof, inside, {}, audit)
    for name, item in meta_specs.items():
        spec = item['spec']
        bundle.chosen[name] = (spec, fit_meta(bundle, y, spec, SEED))
    return bundle


class CompletionHistory(ReconstructionHistory):
    def __init__(self, distance='raw', lag='prior_start', past=False):
        super().__init__(distance, lag)
        self.past = past

    def transform(self, query):
        if not self.past:
            return super().transform(query)
        result = super().transform(query)
        result[:, 11:21] = np.nan
        ref, ux = self.library, self.scaler.transform(query[self.usage])
        for i, row in enumerate(query.itertuples(index=False)):
            eligible = ((ref.WAFER_ID.to_numpy() != row.WAFER_ID) &
                        (ref.condition.to_numpy() == row.condition) & (ref.end.to_numpy() < row.start))
            ids = np.flatnonzero(eligible)
            nearest = ids[np.argsort(np.square(self.usage_values[ids] - ux[i]).sum(axis=1), kind='stable')[:10]]
            result[i, 11:11 + len(nearest)] = ref[TARGET].to_numpy()[nearest]
        return result


def tuning_models(seed):
    out = {}
    for c in (1, 10, 100):
        for gamma in ('scale', .01):
            out[f'svr_C{c}_g{gamma}'] = ('P2_SVR', make_pipeline(SimpleImputer(keep_empty_features=True),
                StandardScaler(), SVR(C=c, gamma=gamma, epsilon=.1)))
    for trees in (100, 300):
        for leaf in (1, 5):
            out[f'bag_T{trees}_L{leaf}'] = ('P2_Bagging', make_pipeline(SimpleImputer(keep_empty_features=True),
                RandomForestRegressor(n_estimators=trees, min_samples_leaf=leaf, max_features=1.,
                                      n_jobs=1, random_state=seed)))
    return out


def fit_p2_completion(train, spec):
    tune = spec['id'] == 'full_ordinary'
    votes, cv, importance_rows, membership, predictions, trials = [], [], [], [], [], []
    for fold, (a, b) in enumerate(GroupShuffleSplit(20, test_size=.2, random_state=SEED).split(train, groups=train.WAFER_ID)):
        fit, valid = train.iloc[a], train.iloc[b]
        hist = CompletionHistory(spec['distance'], spec['lag'], spec['past']).fit(fit)
        X, V, y = hist.transform(fit), hist.transform(valid), fit[TARGET].to_numpy(float)
        selected, t, imp = select_features(X, y, SEED + fold)
        votes.append(selected)
        pred = direct_predictions(V, float(y.mean()))
        for name, m in p2_regressors(SEED + fold, spec['stable']).items():
            pred[name] = m.fit(X[:, selected], y).predict(V[:, selected])
        for name, p in pred.items():
            cv.append(dict(fold=fold, model=name, mse=float(np.square(p - valid[TARGET]).mean())))
            predictions.append(pd.DataFrame(dict(fold=fold, sample_id=valid.sample_id, model=name,
                                                 truth=valid[TARGET], prediction=p)))
        membership.append(dict(fold=fold, train_ids=fit.sample_id.tolist(), validation_ids=valid.sample_id.tolist()))
        importance_rows.extend(dict(fold=fold, feature=n, selected=bool(selected[j]), t_abs=float(t[j]),
                                    oob_importance=float(imp[j])) for j, n in enumerate(hist.names))
        if tune:
            for candidate, (name, m) in tuning_models(SEED + fold).items():
                if candidate in ('svr_C10_gscale', 'bag_T100_L5'):
                    p = pred[name]
                else:
                    p = m.fit(X[:, selected], y).predict(V[:, selected])
                trials.append(dict(fold=fold, candidate=candidate, model=name, mse=float(np.square(p - valid[TARGET]).mean())))
                predictions.append(pd.DataFrame(dict(fold=fold, sample_id=valid.sample_id, model=candidate,
                                                     truth=valid[TARGET], prediction=p)))
    selected = np.sum(votes, axis=0) >= 10
    if not selected.any():
        selected = np.sum(votes, axis=0) > 0
    hist = CompletionHistory(spec['distance'], spec['lag'], spec['past']).fit(train)
    X, y = hist.transform(train), train[TARGET].to_numpy(float)
    models = {n: m.fit(X[:, selected], y) for n, m in p2_regressors(SEED, spec['stable']).items()}
    names = ['P2_Persistent', 'P2_KNN', 'P2_LR', 'P2_SVR', 'P2_Bagging']
    losses = pd.DataFrame(cv).pivot(index='fold', columns='model', values='mse')[names].to_numpy()
    bundle = P2Bundle(hist, selected, models, integration_weights(losses), float(y.mean()))
    result = dict(bundle=bundle, cv=cv, importance=importance_rows, membership=membership,
                  predictions=pd.concat(predictions, ignore_index=True), tuning_trials=trials)
    if tune:
        table = pd.DataFrame(trials).groupby(['candidate', 'model']).mse.agg(['mean', 'std']).reset_index()
        table['upper'] = table['mean'] + 3 * table['std']
        choices, fitted = {}, models.copy()
        for name in ('P2_SVR', 'P2_Bagging'):
            best = table[table.model.eq(name)].sort_values(['upper', 'candidate']).iloc[0].candidate
            choices[name] = best
            fitted[name] = tuning_models(SEED)[best][1].fit(X[:, selected], y)
            losses[:, names.index(name)] = pd.DataFrame(trials).query('candidate == @best').sort_values('fold').mse
        result.update(tuned_bundle=P2Bundle(hist, selected, fitted, integration_weights(losses), float(y.mean())),
                      tuning_choices=choices, tuning_summary=table.to_dict('records'))
    return result


def ga_estimator(family, seed):
    if family == 'tree':
        model = DecisionTreeRegressor(min_samples_leaf=5, random_state=seed)
    elif family == 'knn':
        model = KNeighborsRegressor(n_neighbors=5, weights='distance')
    elif family == 'svr':
        model = SVR(C=10, epsilon=.1, gamma='scale')
    elif family == 'rf':
        model = RandomForestRegressor(n_estimators=100, max_features=1., min_samples_leaf=1, random_state=seed, n_jobs=1)
    elif family == 'ensemble_nn':
        nn = MLPRegressor(hidden_layer_sizes=(16,), activation='tanh', max_iter=500, early_stopping=False,
                          learning_rate_init=.001, random_state=seed)
        model = TransformedTargetRegressor(regressor=BaggingRegressor(nn, n_estimators=5, n_jobs=1,
                                                                     random_state=seed), transformer=StandardScaler())
    else:
        raise ValueError(family)
    return make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler(), model)


@dataclass
class GAResultModel:
    model: object
    columns: list
    cpp_residuals: dict

    def predict_all(self, query):
        p = self.model.predict(query[self.columns])
        correction = query.p3_cpp.map(self.cpp_residuals).fillna(0.).to_numpy(float)
        return {'P3_GA': p, 'P3_GA_CPP': p - correction}


def fit_ga_final(train, columns, family):
    m = ga_estimator(family, SEED).fit(train[columns], train[TARGET])
    error = pd.DataFrame(dict(cpp=train.p3_cpp, error=m.predict(train[columns]) - train[TARGET]))
    return GAResultModel(m, columns, error.groupby('cpp').error.mean().to_dict())


def genetic_search(train, route, phase, population=12, generations=8, seed=SEED):
    columns = p3_columns(route, phase)
    X, y = train[columns].to_numpy(float), train[TARGET].to_numpy(float)
    splits = list(GroupKFold(3).split(X, y, train.WAFER_ID))
    membership = [dict(fold=i, train_ids=train.iloc[a].sample_id.tolist(), validation_ids=train.iloc[b].sample_id.tolist())
                  for i, (a, b) in enumerate(splits)]
    rng, p = np.random.default_rng(seed), len(columns)
    cache, logs, history = {}, [], []
    # Key consists only of an explicit model family and selected indices.
    def key(mask, family):
        mask = np.asarray(mask, bool).copy()
        if not mask.any():
            mask[int(rng.integers(p))] = True
        return (family, tuple(np.flatnonzero(mask).tolist()))

    def evaluate(chromosome, generation):
        if chromosome in cache:
            return cache[chromosome]
        family, selected = chromosome
        pred, warning_count, failure = np.full(len(y), np.nan), 0, None
        warning_messages = set()
        begin = time.perf_counter()
        try:
            for a, b in splits:
                with warnings.catch_warnings(record=True) as captured:
                    warnings.simplefilter('always')
                    m = ga_estimator(family, seed).fit(X[a][:, selected], y[a])
                    pred[b] = m.predict(X[b][:, selected])
                warning_count += len(captured)
                warning_messages.update(f'{w.category.__name__}: {w.message}' for w in captured)
            if not np.isfinite(pred).all():
                raise ValueError('Nonfinite GA prediction')
            score = float(np.square(pred - y).mean())
        except (ValueError, FloatingPointError) as exc:
            failure, score = str(exc), float('inf')
        cache[chromosome] = score
        logs.append(dict(evaluation=len(logs), generation_first_seen=generation, family=family,
                         selected=[columns[j] for j in selected], feature_count=len(selected),
                         mse=score if np.isfinite(score) else None, warnings=warning_count,
                         warning_messages=sorted(warning_messages), failure=failure,
                         seconds=time.perf_counter() - begin))
        return score

    pop = [key(np.ones(p, bool), f) for f in FAMILIES]
    published = PUBLISHED_ROUGH if route == '456' else PUBLISHED_FINE
    pop.append(key([c.removeprefix(f'c3_{phase}_') in published for c in columns], 'rf'))
    while len(pop) < population:
        pop.append(key(rng.random(p) < .5, str(rng.choice(FAMILIES))))
    for generation in range(generations):
        for chromosome in pop:
            evaluate(chromosome, generation)
        pop.sort(key=lambda k: (cache[k], len(k[1]), k))
        finite = [cache[k] for k in pop if np.isfinite(cache[k])]
        if not finite:
            raise ValueError('All GA population members failed')
        history.append(dict(generation=generation, best_mse=cache[pop[0]], mean_finite_mse=float(np.mean(finite)),
                            failed_members=len(pop) - len(finite),
                            unique_evaluations=len(cache), population=[dict(family=k[0], indices=list(k[1])) for k in pop]))
        if generation + 1 == generations:
            break
        new = pop[:2]
        def tournament():
            ids = rng.choice(len(pop), 3, replace=False)
            return min((pop[j] for j in ids), key=lambda k: (cache[k], len(k[1]), k))
        while len(new) < population:
            a, b = tournament(), tournament()
            mask = np.isin(np.arange(p), a[1])
            family = a[0]
            if rng.random() < .8:
                donor = rng.random(p) < .5
                mask[donor] = np.isin(np.arange(p), b[1])[donor]
                if rng.random() < .5:
                    family = b[0]
            mask ^= rng.random(p) < 1 / p
            if rng.random() < .1:
                family = str(rng.choice(FAMILIES))
            new.append(key(mask, family))
        pop = new
    best = min(cache, key=lambda k: (cache[k], len(k[1]), k))
    if not np.isfinite(cache[best]):
        raise ValueError('All GA candidates failed')
    selected = [columns[j] for j in best[1]]
    return dict(bundle=fit_ga_final(train, selected, best[0]), logs=logs, history=history, membership=membership,
                selection=dict(route=route, phase=phase, family=best[0], columns=selected, cv_mse=cache[best]))
