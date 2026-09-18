"""Paper implementations with explicit assumptions, fold-local target histories."""
from __future__ import annotations

from dataclasses import dataclass
import warnings

import numpy as np
import pandas as pd
from scipy.special import expit
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GroupKFold, KFold, GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

from .common import TARGET, USAGE
from .paper_features import P1_COLUMNS, P3_ROUGH, P3_FINE

SEED = 20260917


def regression_metrics(y, pred):
    y, pred = np.asarray(y, float), np.asarray(pred, float)
    if y.shape != pred.shape or not np.isfinite(y).all() or not np.isfinite(pred).all():
        raise ValueError("Invalid metric inputs")
    d = pred - y
    mse = float(np.mean(d ** 2))
    exponent = np.where(d < 0, -d / 13, d / 10)
    # Refuse silent clipping of the paper's exponential metric.
    if np.max(exponent) > 700:
        raise ValueError("S-score overflow; report invalid evaluation instead of clipping")
    relative = np.mean(np.abs(d) / np.abs(y)) if np.all(y != 0) else None
    denominator = np.square(y - y.mean()).sum()
    return {"n": len(y), "mse": mse, "rmse": float(np.sqrt(mse)), "mae": float(np.mean(np.abs(d))),
            "r2": float(1 - np.square(d).sum() / denominator) if denominator > 0 else None,
            "relative_error": float(relative) if relative is not None else None,
            "mape_percent": float(100 * relative) if relative is not None else None,
            "s_score_literal_mean": float(np.exp(exponent).mean()),
            "s_score_minus_one_mean": float(np.expm1(exponent).mean())}


class ELM(RegressorMixin, BaseEstimator):
    def __init__(self, random_state=SEED, hidden=50):
        self.random_state, self.hidden = random_state, hidden

    def fit(self, X, y):
        self.scaler_ = StandardScaler().fit(X)
        X = self.scaler_.transform(X)
        rng = np.random.default_rng(self.random_state)
        self.w_ = rng.uniform(-1, 1, (X.shape[1], self.hidden))
        self.b_ = rng.uniform(-1, 1, self.hidden)
        self.beta_ = np.linalg.pinv(expit(X @ self.w_ + self.b_), rcond=1e-8) @ y
        return self

    def predict(self, X):
        return expit(self.scaler_.transform(X) @ self.w_ + self.b_) @ self.beta_


def base_trees(seed):
    return {
        "P1_RF": RandomForestRegressor(n_estimators=100, max_features=11, min_samples_split=5, n_jobs=4, random_state=seed),
        "P1_GBT": GradientBoostingRegressor(n_estimators=100, max_leaf_nodes=30, max_depth=None, learning_rate=.1, random_state=seed),
        "P1_ERT": ExtraTreesRegressor(n_estimators=100, max_features=3, min_samples_split=3, bootstrap=False, n_jobs=4, random_state=seed),
    }


@dataclass
class P1Bundle:
    base: dict
    meta: dict

    def predict_all(self, frame):
        X = frame[P1_COLUMNS].to_numpy(float)
        result = {name: model.predict(X) for name, model in self.base.items()}
        Z = np.column_stack(list(result.values()))
        result.update({name: model.predict(Z) for name, model in self.meta.items()})
        return result


def fit_p1(train, seed, grouped):
    X, y = train[P1_COLUMNS].to_numpy(float), train[TARGET].to_numpy(float)
    cv = GroupKFold(5) if grouped else KFold(5, shuffle=True, random_state=seed)
    folds = cv.split(X, y, groups=train.group_id) if grouped else cv.split(X, y)
    Z = np.full((len(X), 3), np.nan)
    for a, b in folds:
        for j, model in enumerate(base_trees(seed).values()):
            model.fit(X[a], y[a]); Z[b, j] = model.predict(X[b])
    assert np.isfinite(Z).all()
    meta = {"P1_CART_Stack": DecisionTreeRegressor(min_samples_leaf=5, random_state=seed).fit(Z, y),
            "P1_ELM_Stack": ELM(seed).fit(Z, y)}
    base = {name: model.fit(X, y) for name, model in base_trees(seed).items()}
    return P1Bundle(base, meta)


class HistoryFeatures:
    def fit(self, train):
        self.library = train.copy().reset_index(drop=True)
        self.physical = sorted(c for c in train.columns if c.startswith("p2_"))
        self.usage = [f"p2_primary_{c}_mean" for c in USAGE]
        self.scaler = make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler()).fit(train[self.usage])
        self.usage_values = self.scaler.transform(train[self.usage])
        return self

    @property
    def names(self):
        return [f"lag_{i}" for i in range(1, 12)] + [f"neighbor_{i}" for i in range(1, 11)] + self.physical

    def transform(self, query):
        ref = self.library
        lib_y = ref[TARGET].to_numpy(float)
        dynamic = np.full((len(query), 21), np.nan)
        ux = self.scaler.transform(query[self.usage])
        for i, row in enumerate(query.itertuples(index=False)):
            valid = (ref.WAFER_ID.to_numpy() != row.WAFER_ID) & (ref.condition.to_numpy() == row.condition)
            prior = np.flatnonzero(valid & (ref.machine.to_numpy() == row.machine) & (ref.end.to_numpy() < row.start))
            prior = prior[np.argsort(-ref.end.to_numpy()[prior], kind="stable")][:11]
            dynamic[i, :len(prior)] = lib_y[prior]
            neighbors = np.flatnonzero(valid)
            nearest = neighbors[np.argsort(np.square(self.usage_values[neighbors] - ux[i]).sum(axis=1), kind="stable")[:10]]
            dynamic[i, 11:11 + len(nearest)] = lib_y[nearest]
        return np.column_stack([dynamic, query[self.physical].to_numpy(float)])


def select_features(X, y, seed):
    """Train-only OOB permutations; batched per tree to avoid repeated calls."""
    imputer = SimpleImputer(keep_empty_features=True).fit(X)
    values = StandardScaler().fit_transform(imputer.transform(X))
    varying = np.std(values, axis=0) > 1e-10
    A = np.column_stack([np.ones(len(values)), values[:, varying]])
    beta = np.linalg.lstsq(A, y, rcond=1e-8)[0]
    residual = y - A @ beta
    variance = np.dot(residual, residual) / max(1, len(y) - np.linalg.matrix_rank(A))
    se = np.sqrt(np.maximum(0, variance * np.diag(np.linalg.pinv(A.T @ A, rcond=1e-8))))[1:]
    t = np.zeros(X.shape[1])
    t[varying] = np.divide(np.abs(beta[1:]), se, out=np.zeros_like(se), where=se > 1e-12)
    forest = RandomForestRegressor(n_estimators=32, min_samples_leaf=5, max_features=1.0, bootstrap=True, n_jobs=4, random_state=seed).fit(values, y)
    rng = np.random.default_rng(seed)
    differences = np.zeros((len(forest.estimators_), X.shape[1]))
    values = values.astype(np.float32)
    for i, (tree, sampled) in enumerate(zip(forest.estimators_, forest.estimators_samples_)):
        oob = np.flatnonzero(np.bincount(sampled, minlength=len(y)) == 0)
        if not len(oob):
            continue
        xv, yv = values[oob], y[oob]
        base_error = np.mean(np.square(tree.predict(xv) - yv))
        used = np.unique(tree.tree_.feature[tree.tree_.feature >= 0])
        batch = np.tile(xv, (len(used), 1))
        for j, col in enumerate(used):
            batch[j * len(oob):(j + 1) * len(oob), col] = xv[rng.permutation(len(oob)), col]
        if len(used):
            errors = np.square(tree.predict(batch).reshape(len(used), -1) - yv).mean(axis=1)
            differences[i, used] = errors - base_error
    sd = differences.std(axis=0, ddof=1)
    importance = np.divide(differences.mean(axis=0), sd, out=np.zeros_like(sd), where=sd > 1e-12)
    selected = varying & ((t > 1.5) | (importance > .15))
    if not selected.any():
        # Predeclared fallback; never inspect the evaluation partition.
        selected = varying
    return selected, t, importance


def regressors(seed):
    return {
        "P2_LR": make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler(), LinearRegression()),
        "P2_SVR": make_pipeline(SimpleImputer(keep_empty_features=True), StandardScaler(), SVR(C=10, epsilon=.1, kernel="rbf", gamma="scale")),
        "P2_Bagging": make_pipeline(SimpleImputer(keep_empty_features=True), RandomForestRegressor(
            n_estimators=100, max_features=1.0, min_samples_leaf=5, bootstrap=True, n_jobs=4, random_state=seed)),
    }


def direct_predictions(X, fallback):
    count = np.isfinite(X[:, 11:21]).sum(axis=1)
    knn = np.divide(np.nansum(X[:, 11:21], axis=1), count, out=np.full(len(X), fallback), where=count > 0)
    return {"P2_Persistent": np.where(np.isfinite(X[:, 0]), X[:, 0], fallback), "P2_KNN": knn}


def integration_weights(cv_errors):
    upper = np.mean(cv_errors, axis=0) + 3 * np.std(cv_errors, axis=0, ddof=1)
    inverse = np.maximum(upper, 1e-12) ** -3
    return inverse / inverse.sum()


@dataclass
class P2Bundle:
    history: HistoryFeatures
    selected: np.ndarray
    models: dict
    weights: np.ndarray
    fallback: float

    def predict_all(self, query):
        X = self.history.transform(query)
        result = direct_predictions(X, self.fallback)
        result.update({name: model.predict(X[:, self.selected]) for name, model in self.models.items()})
        result["P2_Integrated"] = np.column_stack(list(result.values())) @ self.weights
        return result


def fit_p2(train, seed, grouped, progress=None):
    errors, votes, rows, importance_rows = [], [], [], []
    groups = train.group_id if grouped else train.WAFER_ID
    splitter = GroupShuffleSplit(n_splits=20, test_size=.2, random_state=seed)
    for fold, (a, b) in enumerate(splitter.split(train, groups=groups)):
        fit, valid = train.iloc[a], train.iloc[b]
        history = HistoryFeatures().fit(fit)
        X, V = history.transform(fit), history.transform(valid)
        y = fit[TARGET].to_numpy(float)
        selected, t, importance = select_features(X, y, seed + fold)
        votes.append(selected)
        predictions = direct_predictions(V, float(y.mean()))
        models = regressors(seed + fold)
        for name, model in models.items():
            model.fit(X[:, selected], y)
            predictions[name] = model.predict(V[:, selected])
        fold_errors = [float(np.mean((p - valid[TARGET].to_numpy(float)) ** 2)) for p in predictions.values()]
        errors.append(fold_errors)
        for name, mse in zip(predictions, fold_errors):
            rows.append({"fold": fold, "model": name, "mse": mse, "train_n": len(fit), "validation_n": len(valid)})
        importance_rows += [{"fold": fold, "feature": name, "t_abs": float(t[j]), "oob_importance": float(importance[j]), "selected": bool(selected[j])} for j, name in enumerate(history.names)]
        if progress:
            progress(fold + 1)
    selected = np.sum(votes, axis=0) >= 10
    if not selected.any():
        selected = np.sum(votes, axis=0) > 0
    history = HistoryFeatures().fit(train)
    X, y = history.transform(train), train[TARGET].to_numpy(float)
    models = {name: model.fit(X[:, selected], y) for name, model in regressors(seed).items()}
    weights = integration_weights(np.asarray(errors))
    return P2Bundle(history, selected, models, weights, float(y.mean())), rows, importance_rows


@dataclass
class P3Bundle:
    model: object
    columns: list
    cpp_residuals: dict

    def predict_all(self, query):
        p = self.model.predict(query[self.columns])
        correction = query.p3_cpp.map(self.cpp_residuals).fillna(0).to_numpy(float)
        return {"P3_RF": p, "P3_RF_CPP": p - correction}


def fit_p3(train, seed):
    columns = P3_ROUGH if train.route.iloc[0] == "456" else P3_FINE
    model = make_pipeline(SimpleImputer(keep_empty_features=True), RandomForestRegressor(
        n_estimators=100, max_features=1.0, min_samples_leaf=1, n_jobs=4, random_state=seed))
    model.fit(train[columns], train[TARGET])
    residual = pd.DataFrame({"cpp": train.p3_cpp, "error": model.predict(train[columns]) - train[TARGET]})
    return P3Bundle(model, columns, residual.groupby("cpp").error.mean().to_dict())
