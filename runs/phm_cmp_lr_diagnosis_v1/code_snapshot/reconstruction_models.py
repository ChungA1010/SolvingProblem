"""Bounded reconstruction candidates. Existing v1 implementations are unchanged."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.model_selection import KFold, GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor

from .common import TARGET
from .paper_features import P1_COLUMNS, P3_ROUGH, P3_FINE
from .paper_models import (ELM, HistoryFeatures, P2Bundle, P3Bundle, base_trees,
                           direct_predictions, integration_weights, regressors, select_features)


class BoundedELM(ELM):
    def __init__(self, random_state=20260917, hidden=50, rcond=1e-8):
        super().__init__(random_state, hidden)
        self.rcond = rcond

    def fit(self, X, y):
        from scipy.special import expit
        self.scaler_ = StandardScaler().fit(X)
        X = self.scaler_.transform(X)
        rng = np.random.default_rng(self.random_state)
        self.w_ = rng.uniform(-1, 1, (X.shape[1], self.hidden))
        self.b_ = rng.uniform(-1, 1, self.hidden)
        self.beta_ = np.linalg.pinv(expit(X @ self.w_ + self.b_), rcond=self.rcond) @ y
        return self


@dataclass
class P1Bank:
    full: dict
    folds: list
    oof: np.ndarray
    in_sample: np.ndarray
    chosen: dict

    def base_predict(self, query, mode):
        X = query[P1_COLUMNS].to_numpy(float)
        names = list(self.full)
        if mode == "oof_fold_average":
            return {name: np.mean([fold[name].predict(X) for fold in self.folds], axis=0) for name in names}
        return {name: self.full[name].predict(X) for name in names}

    def predict_all(self, query):
        result = self.base_predict(query, "oof_refit")
        for name, (spec, model) in self.chosen.items():
            Z = np.column_stack(list(self.base_predict(query, spec["mode"]).values()))
            result[name] = model.predict(Z)
        return result


def fit_p1_bank(train, seed):
    X, y = train[P1_COLUMNS].to_numpy(float), train[TARGET].to_numpy(float)
    oof, folds = np.full((len(train), 3), np.nan), []
    for a, b in KFold(5, shuffle=True, random_state=seed).split(X):
        models = {n: m.fit(X[a], y[a]) for n, m in base_trees(seed).items()}
        oof[b] = np.column_stack([m.predict(X[b]) for m in models.values()])
        folds.append(models)
    full = {n: m.fit(X, y) for n, m in base_trees(seed).items()}
    inside = np.column_stack([m.predict(X) for m in full.values()])
    return P1Bank(full, folds, oof, inside, {})


def fit_meta(bank, target, spec, seed):
    if spec["family"] == "P1_CART_Stack":
        model = DecisionTreeRegressor(min_samples_leaf=spec["leaf"], max_depth=spec["depth"], random_state=seed)
    else:
        model = BoundedELM(seed, spec["hidden"], spec["rcond"])
    return model.fit(bank.in_sample if spec["mode"] == "table2_in_sample" else bank.oof, target)


class ReconstructionHistory(HistoryFeatures):
    def __init__(self, distance="standardized", lag="completed"):
        self.distance, self.lag = distance, lag

    def fit(self, train):
        super().fit(train)
        if self.distance == "raw":
            self.scaler = SimpleImputer(keep_empty_features=True).fit(train[self.usage])
            self.usage_values = self.scaler.transform(train[self.usage])
        return self

    def transform(self, query):
        if self.lag == "completed":
            return super().transform(query)
        ref, lib_y = self.library, self.library[TARGET].to_numpy(float)
        dynamic = np.full((len(query), 21), np.nan)
        ux = self.scaler.transform(query[self.usage])
        for i, row in enumerate(query.itertuples(index=False)):
            valid = (ref.WAFER_ID.to_numpy() != row.WAFER_ID) & (ref.condition.to_numpy() == row.condition)
            prior = np.flatnonzero(valid & (ref.machine.to_numpy() == row.machine) & (ref.start.to_numpy() < row.start))
            prior = prior[np.argsort(-ref.start.to_numpy()[prior], kind="stable")][:11]
            dynamic[i, :len(prior)] = lib_y[prior]
            neighbor = np.flatnonzero(valid)
            nearest = neighbor[np.argsort(np.square(self.usage_values[neighbor] - ux[i]).sum(axis=1), kind="stable")[:10]]
            dynamic[i, 11:11 + len(nearest)] = lib_y[nearest]
        return np.column_stack([dynamic, query[self.physical].to_numpy(float)])


class TruncatedOLS(RegressorMixin, BaseEstimator):
    """OLS with an explicitly truncated ill-conditioned design; not author code."""
    def __init__(self, rcond=1e-6):
        self.rcond = rcond

    def fit(self, X, y):
        A = np.column_stack([np.ones(len(X)), X])
        self.coef_, _, self.rank_, self.singular_ = np.linalg.lstsq(A, y, rcond=self.rcond)
        return self

    def predict(self, X):
        return np.column_stack([np.ones(len(X)), X]) @ self.coef_


def p2_regressors(seed, stable):
    models = regressors(seed)
    if stable:
        models["P2_LR"] = make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler(), TruncatedOLS())
    return models


def fit_p2_variant(train, seed, spec, progress=None):
    votes, errors, rows, importance_rows = [], [], [], []
    for fold, (a, b) in enumerate(GroupShuffleSplit(n_splits=20, test_size=.2, random_state=seed).split(train, groups=train.WAFER_ID)):
        fit, valid = train.iloc[a], train.iloc[b]
        history = ReconstructionHistory(spec["distance"], spec["lag"]).fit(fit)
        X, V, y = history.transform(fit), history.transform(valid), fit[TARGET].to_numpy(float)
        selected, t, importance = select_features(X, y, seed + fold)
        votes.append(selected)
        pred = direct_predictions(V, float(y.mean()))
        for name, model in p2_regressors(seed + fold, spec["stable_ols"]).items():
            pred[name] = model.fit(X[:, selected], y).predict(V[:, selected])
        losses = [float(np.mean((p - valid[TARGET].to_numpy(float)) ** 2)) for p in pred.values()]
        errors.append(losses)
        rows.extend({"fold": fold, "model": n, "mse": e, "train_n": len(fit), "validation_n": len(valid)} for n, e in zip(pred, losses))
        importance_rows.extend({"fold": fold, "feature": n, "t_abs": float(t[j]), "oob_importance": float(importance[j]), "selected": bool(selected[j])} for j, n in enumerate(history.names))
        if progress:
            progress(fold + 1)
    selected = np.sum(votes, axis=0) >= 10
    if not selected.any():
        selected = np.sum(votes, axis=0) > 0
    history = ReconstructionHistory(spec["distance"], spec["lag"]).fit(train)
    X, y = history.transform(train), train[TARGET].to_numpy(float)
    models = {n: m.fit(X[:, selected], y) for n, m in p2_regressors(seed, spec["stable_ols"]).items()}
    return P2Bundle(history, selected, models, integration_weights(np.asarray(errors)), float(y.mean())), rows, importance_rows


def fit_p3_variant(train, seed, spec):
    columns = P3_ROUGH if train.route.iloc[0] == "456" else P3_FINE
    random_subspace = spec["forest"] == "random_subspace"
    model = make_pipeline(SimpleImputer(keep_empty_features=True), RandomForestRegressor(
        n_estimators=500 if random_subspace else 100, max_features=max(1, len(columns) // 3) if random_subspace else 1.,
        min_samples_leaf=5 if random_subspace else 1, n_jobs=4, random_state=seed))
    model.fit(train[columns], train[TARGET])
    residual = pd.DataFrame({"cpp": train.p3_cpp, "error": model.predict(train[columns]) - train[TARGET]})
    return P3Bundle(model, columns, residual.groupby("cpp").error.mean().to_dict())
