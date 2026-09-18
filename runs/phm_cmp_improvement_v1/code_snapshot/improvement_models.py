"""Proposed P2 improvements, kept separate from the frozen paper baselines."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

from .common import TARGET
from .paper_models import direct_predictions, integration_weights, select_features
from .reconstruction_models import ReconstructionHistory, TruncatedOLS

VIEWS = ("base", "physics", "history", "both")
POLICIES = ("retrospective", "completed")
PROCEDURES = ("control", "tuned", "features", "proposed")
SEED = 20260918


def grid():
    rows = [{"id": "ols", "family": "ols"}]
    for name, leaf, fraction, depth in (("bag_default", 5, 1., None), ("bag_leaf2", 2, .7, None),
                                       ("bag_leaf10", 10, 1., None), ("bag_depth10", 5, .7, 10)):
        rows.append({"id": name, "family": "bag", "leaf": leaf, "fraction": fraction, "depth": depth})
    for c in (10., 100., 1000.):
        for gamma in ("scale", .01):
            rows.append({"id": f"svr_{c:g}_{gamma}_0.1", "family": "svr", "C": c, "gamma": gamma, "epsilon": .1})
    for epsilon in (.5, 1.):
        rows.append({"id": f"svr_100_scale_{epsilon:g}", "family": "svr", "C": 100., "gamma": "scale", "epsilon": epsilon})
    rows += [{"id": f"ridge_{a:g}", "family": "ridge", "alpha": a} for a in (1., 10., 100.)]
    return rows


def regressor(spec, seed):
    impute = SimpleImputer(keep_empty_features=True)
    if spec["family"] == "bag":
        return make_pipeline(impute, RandomForestRegressor(n_estimators=100, min_samples_leaf=spec["leaf"],
            max_features=spec["fraction"], max_depth=spec["depth"], bootstrap=True, n_jobs=4, random_state=seed))
    if spec["family"] == "svr":
        model = SVR(C=spec["C"], gamma=spec["gamma"], epsilon=spec["epsilon"])
    elif spec["family"] == "ridge":
        model = Ridge(alpha=spec["alpha"])
    else:
        model = TruncatedOLS(rcond=1e-6)
    return make_pipeline(impute, StandardScaler(), model)


def physics_features(frame):
    """Products of aggregated signals: engineering proxies, not exact Preston physics."""
    result = {}
    for zone in ("primary", "secondary"):
        def value(signal):
            return frame[f"p2_{zone}_{signal}_mean"].to_numpy(float)
        p = value("PRESSURIZED_CHAMBER_PRESSURE")
        center = value("CENTER_AIR_BAG_PRESSURE")
        wafer, table = np.abs(value("WAFER_ROTATION")), np.abs(value("STAGE_ROTATION"))
        speed = wafer + table
        duration = frame[f"p2_{zone}_duration"].to_numpy(float)
        result.update({f"{zone}_pressure_speed": p * speed, f"{zone}_center_speed": center * speed,
            f"{zone}_pressure_speed_time": p * speed * duration,
            f"{zone}_center_speed_time": center * speed * duration,
            f"{zone}_rotation_difference": np.abs(wafer - table),
            f"{zone}_center_pressure_ratio": np.divide(center, p, out=np.full(len(p), np.nan), where=np.abs(p) > 1e-8)})
    return pd.DataFrame(result, index=frame.index)


def row_stats(values):
    valid = np.isfinite(values)
    count = valid.sum(axis=1)
    mean = np.divide(np.nansum(values, axis=1), count, out=np.full(len(values), np.nan), where=count > 0)
    variance = np.divide(np.nansum((values - mean[:, None]) ** 2, axis=1), count,
                         out=np.full(len(values), np.nan), where=count > 0)
    return mean, np.sqrt(variance), count


class ResearchHistory(ReconstructionHistory):
    def __init__(self, policy="completed"):
        if policy not in POLICIES:
            raise ValueError("Unknown history policy")
        super().__init__(distance="raw", lag="prior_start")
        self.policy = policy

    def referenced_indices(self, query):
        ref = self.library
        slots = np.full((len(query), 21), -1, dtype=int)
        ux = self.scaler.transform(query[self.usage])
        wafer, cond = ref.WAFER_ID.to_numpy(), ref.condition.to_numpy()
        start, end, machine = ref.start.to_numpy(), ref.end.to_numpy(), ref.machine.to_numpy()
        distances = np.full(len(query), np.nan)
        for i, row in enumerate(query.itertuples(index=False)):
            allowed = (wafer != row.WAFER_ID) & (cond == row.condition)
            if self.policy == "completed":
                allowed &= end < row.start
            prior = np.flatnonzero(allowed & (machine == row.machine) & (start < row.start))
            order = end if self.policy == "completed" else start
            prior = prior[np.argsort(-order[prior], kind="stable")[:11]]
            slots[i, :len(prior)] = prior
            neighbor = np.flatnonzero(allowed)
            d = np.square(self.usage_values[neighbor] - ux[i]).sum(axis=1)
            rank = np.argsort(d, kind="stable")[:10]
            nearest = neighbor[rank]
            slots[i, 11:11 + len(nearest)] = nearest
            if len(nearest):
                distances[i] = np.sqrt(d[rank[0]])
        return slots, distances

    def views(self, query):
        slots, distance = self.referenced_indices(query)
        dynamic = np.full(slots.shape, np.nan)
        valid = slots >= 0
        dynamic[valid] = self.library[TARGET].to_numpy(float)[slots[valid]]
        base = np.column_stack([dynamic, query[self.physical].to_numpy(float)])
        lm, ls, lc = row_stats(dynamic[:, :11])
        nm, ns, nc = row_stats(dynamic[:, 11:])
        recent, _, _ = row_stats(dynamic[:, :3])
        older, _, _ = row_stats(dynamic[:, 8:11])
        age = np.full(len(query), np.nan)
        found = slots[:, 0] >= 0
        age[found] = query.start.to_numpy()[found] - self.library.end.to_numpy()[slots[found, 0]]
        history = np.column_stack([lm, ls, lc, dynamic[:, 0] - lm, recent - older, nm, ns, nc,
                                   np.log1p(np.maximum(age, 0)), np.log1p(distance)])
        physics = physics_features(query).to_numpy(float)
        return {"base": base, "physics": np.column_stack([base, physics]),
                "history": np.column_stack([base, history]), "both": np.column_stack([base, physics, history])}

    def transform(self, query):
        return self.views(query)["base"]


def extend_mask(base, width):
    return np.r_[base, np.ones(width - len(base), dtype=bool)]


def mse(y, p):
    if not np.isfinite(p).all():
        raise ValueError("Nonfinite model prediction")
    return float(np.square(np.asarray(y) - p).mean())


def simplex_weights(Z, y, prior, penalty=1.):
    def objective(w):
        d = Z @ w - y
        return float(np.mean(d * d) + penalty * np.square(w - prior).sum())
    def gradient(w):
        return 2 * Z.T @ (Z @ w - y) / len(y) + 2 * penalty * (w - prior)
    result = minimize(objective, prior, jac=gradient, method="SLSQP", bounds=[(0., 1.)] * len(prior),
        constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1., "jac": lambda w: np.ones(len(w))}],
        options={"maxiter": 1000, "ftol": 1e-10})
    if not result.success:
        raise ValueError(f"Blend optimization failed: {result.message}")
    weights = np.maximum(result.x, 0)
    return weights / weights.sum()


@dataclass
class ImprovementBundle:
    history: ResearchHistory
    mask: np.ndarray
    models: dict
    recipes: dict
    fallback: float

    def predict_all(self, query):
        views = self.history.views(query)
        direct = direct_predictions(views["base"], self.fallback)
        predictions = {"persistent": direct["P2_Persistent"], "knn": direct["P2_KNN"]}
        for key, model in self.models.items():
            view, _ = key.split("/", 1)
            X = views[view]
            predictions[key] = model.predict(X[:, extend_mask(self.mask, X.shape[1])])
        return {name: np.column_stack([predictions[k] for k in spec["keys"]]) @ np.asarray(spec["weights"])
                for name, spec in self.recipes.items()}


def fit_condition(train, policy, seed=SEED, progress=None):
    """Select all settings inside a training partition; callers supply outer holdouts."""
    train = train.reset_index(drop=True)
    y = train[TARGET].to_numpy(float)
    if train.condition.nunique() != 1 or train.group_id.nunique() < 3:
        raise ValueError("One condition and at least three groups required")
    candidates = grid()
    outputs = {"persistent": np.full(len(train), np.nan), "knn": np.full(len(train), np.nan)}
    outputs.update({f"{v}/{s['id']}": np.full(len(train), np.nan) for v in VIEWS for s in candidates})
    votes, folds = [], np.full(len(train), -1, dtype=int)
    split_rows = []
    for fold, (a, b) in enumerate(GroupKFold(3, shuffle=True, random_state=seed).split(train, groups=train.group_id)):
        fit, valid = train.iloc[a], train.iloc[b]
        assert not set(fit.WAFER_ID) & set(valid.WAFER_ID)
        assert not set(fit.group_id) & set(valid.group_id)
        history = ResearchHistory(policy).fit(fit)
        X, V = history.views(fit.drop(columns=[TARGET])), history.views(valid.drop(columns=[TARGET]))
        selected, _, _ = select_features(X["base"], fit[TARGET].to_numpy(float), seed + fold)
        votes.append(selected)
        folds[b] = fold
        split_rows += [{"sample_id": sid, "inner_fold": fold} for sid in valid.sample_id]
        direct = direct_predictions(V["base"], float(fit[TARGET].mean()))
        outputs["persistent"][b], outputs["knn"][b] = direct["P2_Persistent"], direct["P2_KNN"]
        for view in VIEWS:
            mask = extend_mask(selected, X[view].shape[1])
            for spec in candidates:
                model = regressor(spec, seed + fold).fit(X[view][:, mask], fit[TARGET])
                outputs[f"{view}/{spec['id']}"][b] = model.predict(V[view][:, mask])
        if progress:
            progress(f"inner fold {fold + 1}/3 fitted")
    individual = [{"key": k, "mse": mse(y, p)} for k, p in outputs.items()]
    loss = {r["key"]: r["mse"] for r in individual}
    blends = []

    def recipe(name, view, keys, method="paper"):
        Z = np.column_stack([outputs[k] for k in keys])
        errors = np.asarray([[mse(y[folds == f], Z[folds == f, j]) for j in range(len(keys))] for f in range(3)])
        w = integration_weights(errors) if len(keys) > 1 else np.ones(1)
        if method == "simplex":
            w = simplex_weights(Z, y, w)
        record = {"id": name, "view": view, "method": method, "keys": keys, "weights": w.tolist(),
                  "inner_mse": mse(y, Z @ w)}
        blends.append(record)
        return record

    control = recipe("base_control", "base", ["persistent", "knn", "base/ols", "base/svr_10_scale_0.1", "base/bag_default"])
    tuned, options = {}, [control]
    for view in VIEWS:
        best = {family: min((f"{view}/{s['id']}" for s in candidates if s["family"] == family),
                             key=lambda key: (loss[key], key)) for family in ("ridge", "svr", "bag")}
        keys = ["persistent", "knn", best["ridge"], best["svr"], best["bag"]]
        tuned[view] = recipe(f"{view}_paper", view, keys)
        options += [tuned[view], recipe(f"{view}_simplex", view, keys, "simplex")]
        options += [recipe(f"{view}_{family}", view, [key], "single") for family, key in best.items()]
    best_recipe = lambda seq: min(seq, key=lambda x: (x["inner_mse"], x["id"]))
    recipes = {"control": control, "tuned": tuned["base"], "features": best_recipe(list(tuned.values())),
               "proposed": best_recipe(options)}
    selected = np.sum(votes, axis=0) >= 2
    if not selected.any():
        selected = np.sum(votes, axis=0) > 0
    history = ResearchHistory(policy).fit(train)
    views = history.views(train.drop(columns=[TARGET]))
    needed = sorted(set(k for r in recipes.values() for k in r["keys"] if "/" in k))
    lookup = {s["id"]: s for s in candidates}
    models = {}
    for key in needed:
        view, name = key.split("/", 1)
        X = views[view]
        models[key] = regressor(lookup[name], seed).fit(X[:, extend_mask(selected, X.shape[1])], y)
    bundle = ImprovementBundle(history, selected, models, recipes, float(y.mean()))
    detail = {"policy": policy, "condition": train.condition.iloc[0], "train_n": len(train),
        "groups": int(train.group_id.nunique()), "seed": seed, "recipes": recipes,
        "base_features": history.names, "selected_base_features": [n for n, keep in zip(history.names, selected) if keep],
        "base_feature_votes": np.sum(votes, axis=0).tolist(), "inner_candidates": individual,
        "inner_blends": blends, "inner_folds": split_rows}
    inner = pd.DataFrame({"sample_id": train.sample_id, "fold": folds, "truth": y, **outputs})
    return bundle, detail, inner
