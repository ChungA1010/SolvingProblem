"""Fold-local input guards and bounded blends; frozen earlier experiments are untouched."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GroupKFold

from .common import TARGET
from .improvement_models import ResearchHistory, regressor, mse
from .paper_models import direct_predictions, integration_weights
from .robust_features import feature_view

SEED = 20260918  # paired partitions and inner splits with the previous experiment
VARIANTS = {"raw_unprotected": ("raw", False), "raw_guarded": ("raw", True),
            "gap_guarded": ("gap", True), "phase_guarded": ("phase", True)}


def grid():
    return ([{"id": f"ridge_{a}", "family": "ridge", "alpha": float(a)} for a in (10, 100, 1000)] +
            [{"id": f"svr_{c}", "family": "svr", "C": float(c), "gamma": "scale", "epsilon": .1} for c in (10, 100, 1000)] +
            [{"id": name, "family": "bag", "leaf": leaf, "fraction": frac, "depth": None}
             for name, leaf, frac in (("bag_2", 2, .7), ("bag_5", 5, 1.), ("bag_10", 10, 1.))])


class InputGuard:
    def fit(self, X):
        X = np.where(np.isfinite(X), X, np.nan)
        self.imputer = SimpleImputer(strategy="median", keep_empty_features=True).fit(X)
        values = self.imputer.transform(X)
        self.low, self.high = np.quantile(values, [.005, .995], axis=0)
        q1, q3 = np.quantile(values, [.25, .75], axis=0)
        spread = q3 - q1
        # Keep observed training extremes inside the detector. A new column value outside a constant feature is detectable.
        self.ood_low = np.minimum(values.min(axis=0), q1 - 5 * spread) - 1e-9
        self.ood_high = np.maximum(values.max(axis=0), q3 + 5 * spread) + 1e-9
        return self

    def transform(self, X):
        values = self.imputer.transform(np.where(np.isfinite(X), X, np.nan))
        return np.column_stack([np.clip(values, self.low, self.high), ~np.isfinite(X)])

    def flag(self, X, base_count=21):
        # Only physical signals trigger OOD fallback; missing history at startup is normal and is encoded as missingness.
        values = self.imputer.transform(np.where(np.isfinite(X), X, np.nan))
        ood = (values[:, base_count:] < self.ood_low[base_count:]) | (values[:, base_count:] > self.ood_high[base_count:])
        missing = ~np.isfinite(X[:, base_count:])
        return (ood.sum(axis=1) >= 3) | missing.any(axis=1)


def quality_flag(frame):
    return (frame.qc_primary_missing | frame.qc_secondary_missing | frame.qc_primary_ambiguous | frame.qc_primary_fallback).to_numpy(bool)


def safe_components(predictions, low, high, fallback):
    result = {}
    for name, values in predictions.items():
        bad = ~np.isfinite(values) | (values < low) | (values > high)
        result[name] = np.where(bad, fallback, values)
    return result


def blend_weights(Z, y, folds, guarded):
    errors = np.array([[mse(y[folds == f], Z[folds == f, j]) for j in range(5)] for f in range(3)])
    prior = integration_weights(errors)
    cap = .25 if guarded else 1.
    initial = prior.copy()
    if initial[2] > cap:
        excess = initial[2] - cap
        initial[2] = cap
        initial[[0, 1, 3, 4]] += excess * initial[[0, 1, 3, 4]] / initial[[0, 1, 3, 4]].sum()
    def fun(w):
        return float(np.mean((Z @ w - y) ** 2) + np.square(w - prior).sum())
    def jac(w):
        return 2 * Z.T @ (Z @ w - y) / len(y) + 2 * (w - prior)
    result = minimize(fun, initial, jac=jac, method="SLSQP", bounds=[(0., 1.), (0., 1.), (0., cap), (0., 1.), (0., 1.)],
        constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1., "jac": lambda w: np.ones(5)}],
        options={"maxiter": 1000, "ftol": 1e-10})
    if not result.success:
        raise ValueError(result.message)
    w = np.maximum(result.x, 0)
    w /= w.sum()
    if w[2] > cap + 1e-8:
        raise ValueError("Linear weight exceeds predeclared cap")
    return w


@dataclass
class VariantBundle:
    view: str
    guarded: bool
    history: ResearchHistory
    guard: InputGuard | None
    models: dict
    keys: list
    weights: np.ndarray
    fallback_mean: float
    low: float
    high: float

    def predict(self, frame):
        query = feature_view(frame, self.view)
        X = self.history.transform(query)
        direct = direct_predictions(X, self.fallback_mean)
        raw = {"persistent": direct["P2_Persistent"], "knn": direct["P2_KNN"]}
        V = self.guard.transform(X) if self.guarded else X
        raw.update({k: m.predict(V) for k, m in self.models.items()})
        flag = np.zeros(len(query), bool)
        if self.guarded:
            fallback = raw[self.keys[4]]
            raw = safe_components(raw, self.low, self.high, fallback)
            flag = self.guard.flag(X) | quality_flag(query)
        result = np.column_stack([raw[k] for k in self.keys]) @ self.weights
        if self.guarded:
            result = np.where(flag, raw[self.keys[4]], result)
            assert np.all(result >= self.low - 1e-8) and np.all(result <= self.high + 1e-8)
        return result, flag


@dataclass
class RobustBundle:
    variants: dict
    selected: str

    def predict_all(self, frame):
        result = {n: m.predict(frame)[0] for n, m in self.variants.items()}
        result["selected"] = result[self.selected]
        return result


def fit_condition(train, policy, progress=None):
    train = train.reset_index(drop=True)
    y = train[TARGET].to_numpy(float)
    if train.condition.nunique() != 1 or train.group_id.nunique() < 3:
        raise ValueError("One condition with at least three groups is required")
    outputs, flags, intervals = {}, {}, {}
    for name in VARIANTS:
        outputs[name] = {k: np.full(len(train), np.nan) for k in ["persistent", "knn"] + [s["id"] for s in grid()]}
        flags[name] = np.zeros(len(train), bool)
        intervals[name] = np.empty((len(train), 2))
    folds = np.full(len(train), -1, int)
    for fold, (a, b) in enumerate(GroupKFold(3, shuffle=True, random_state=SEED).split(train, groups=train.group_id)):
        assert not set(train.iloc[a].group_id) & set(train.iloc[b].group_id)
        assert not set(train.iloc[a].WAFER_ID) & set(train.iloc[b].WAFER_ID)
        folds[b] = fold
        for name, (view, guarded) in VARIANTS.items():
            fit, valid = feature_view(train.iloc[a], view), feature_view(train.iloc[b], view)
            history = ResearchHistory(policy).fit(fit)
            X, V = history.transform(fit.drop(columns=[TARGET])), history.transform(valid.drop(columns=[TARGET]))
            direct = direct_predictions(V, float(fit[TARGET].mean()))
            outputs[name]["persistent"][b], outputs[name]["knn"][b] = direct["P2_Persistent"], direct["P2_KNN"]
            intervals[name][b] = [fit[TARGET].min(), fit[TARGET].max()]
            if guarded:
                guard = InputGuard().fit(X)
                flags[name][b] = guard.flag(V) | quality_flag(valid)
                X, V = guard.transform(X), guard.transform(V)
            for spec in grid():
                m = regressor(spec, SEED + fold).fit(X, fit[TARGET])
                outputs[name][spec["id"]][b] = m.predict(V)
        if progress:
            progress(f"inner {fold + 1}/3")
    details, fitted, inner_frames = {}, {}, []
    for name, (view, guarded) in VARIANTS.items():
        raw = outputs[name]
        bag_key = min((s["id"] for s in grid() if s["family"] == "bag"), key=lambda k: (mse(y, raw[k]), k))
        processed = safe_components(raw, intervals[name][:, 0], intervals[name][:, 1], raw[bag_key]) if guarded else raw
        chosen = {fam: min((s["id"] for s in grid() if s["family"] == fam), key=lambda k: (mse(y, processed[k]), k)) for fam in ("ridge", "svr")}
        keys = ["persistent", "knn", chosen["ridge"], chosen["svr"], bag_key]
        Z = np.column_stack([processed[k] for k in keys])
        # Flagged rows use the selected tree regardless of weights; remove their constant contribution from optimization.
        if guarded:
            Z[flags[name]] = processed[bag_key][flags[name], None]
        w = blend_weights(Z, y, folds, guarded)
        pred = Z @ w
        details[name] = {"view": view, "guarded": guarded, "keys": keys, "weights": w.tolist(),
            "inner_mse": mse(y, pred), "inner_fallback_n": int(flags[name].sum()),
            "candidates": [{"id": k, "raw_mse": mse(y, raw[k]), "processed_mse": mse(y, processed[k])} for k in raw]}
        inner_frames.append(pd.DataFrame({"sample_id": train.sample_id, "fold": folds, "variant": name, "truth": y,
            "prediction": pred, "fallback": flags[name], "low": intervals[name][:, 0], "high": intervals[name][:, 1],
            **{f"raw__{k}": v for k, v in raw.items()}, **{f"component_{i}": Z[:, i] for i in range(5)}}))
        fit = feature_view(train, view)
        history = ResearchHistory(policy).fit(fit)
        X = history.transform(fit.drop(columns=[TARGET]))
        guard = InputGuard().fit(X) if guarded else None
        if guarded:
            X = guard.transform(X)
        models = {s["id"]: regressor(s, SEED).fit(X, y) for s in grid() if s["id"] in keys}
        fitted[name] = VariantBundle(view, guarded, history, guard, models, keys, w, float(y.mean()), float(y.min()), float(y.max()))
    selected = min((n for n in VARIANTS if VARIANTS[n][1]), key=lambda n: (details[n]["inner_mse"], n))
    detail = {"policy": policy, "condition": train.condition.iloc[0], "train_n": len(train), "selected": selected,
              "variants": details, "feature_count": len(next(iter(fitted.values())).history.names)}
    return RobustBundle(fitted, selected), detail, pd.concat(inner_frames, ignore_index=True)
