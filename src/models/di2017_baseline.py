"""Reusable estimator interface for the frozen Di et al. (2017) baseline.

The caller is responsible for constructing the paper-style feature table and
for choosing the MRR-history semantics.  This module keeps model fitting and
prediction reusable for later chronological head-to-head evaluations.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import clone

from src.models import reproduce_di2017 as legacy


BASE_MODEL_NAMES = ["persistent", "knn", "linear_regression", "svr", "tree_bagging"]


@dataclass
class Di2017FitResult:
    """Fitted condition-specific Di baseline and its preprocessing state."""

    condition: str
    selected_features: list[str]
    models: dict[str, Any]
    train_base: pd.DataFrame
    y_train: pd.Series
    usage_columns: list[str]
    integration_weights: dict[str, float]

    def predict(self, frame: pd.DataFrame) -> pd.DataFrame:
        """Predict all five component models and their weighted integration."""
        _, eval_x = legacy.add_fold_neighbor_features(
            self.train_base,
            self.y_train,
            frame,
            self.usage_columns,
        )
        out = pd.DataFrame(index=frame.index)
        out["persistent"] = frame["mrr_lag_1"].fillna(float(self.y_train.mean())).to_numpy()
        neighbor_cols = [f"neighbor_mrr_{k}" for k in range(1, 11)]
        out["knn"] = eval_x[neighbor_cols].mean(axis=1).to_numpy()
        for name, model in self.models.items():
            out[name] = np.asarray(model.predict(eval_x[self.selected_features])).reshape(-1)
        out["integrated"] = sum(
            self.integration_weights[name] * out[name] for name in BASE_MODEL_NAMES
        )
        return out


def fit_di2017_condition(
    frame: pd.DataFrame,
    *,
    condition: str,
    selected_features: list[str],
    seed: int = 2017,
    integration_weights: dict[str, float] | None = None,
) -> Di2017FitResult:
    """Fit LR, SVR, and tree bagging; KNN and persistence are rule-based."""
    train_base = frame.copy()
    y_train = train_base[legacy.TARGET].copy()
    usage_cols = legacy._usage_neighbor_base_cols(train_base)
    train_x, _ = legacy.add_fold_neighbor_features(train_base, y_train, train_base, usage_cols)
    model_defs = legacy.make_models(seed)
    fitted: dict[str, Any] = {}
    for name in ["linear_regression", "svr", "tree_bagging"]:
        model = clone(model_defs[name])
        model.fit(train_x[selected_features], y_train)
        fitted[name] = model

    if integration_weights is None:
        integration_weights = {name: 1.0 / len(BASE_MODEL_NAMES) for name in BASE_MODEL_NAMES}
    total = float(sum(integration_weights.values()))
    normalized = {name: float(integration_weights[name]) / total for name in BASE_MODEL_NAMES}
    return Di2017FitResult(
        condition=condition,
        selected_features=list(selected_features),
        models=fitted,
        train_base=train_base,
        y_train=y_train,
        usage_columns=usage_cols,
        integration_weights=normalized,
    )
