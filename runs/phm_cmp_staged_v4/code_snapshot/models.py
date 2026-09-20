from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import least_squares

from .common import PRESSURE, ROTATION, SLURRY, USAGE


class FeaturePreprocessor:
    """Fit schema, medians, missing indicators and variance filters on Train only."""
    def fit(self, frame: pd.DataFrame):
        cols = sorted(c for c in frame if c.startswith("f__"))
        self.columns = [c for c in cols if frame[c].notna().any()]
        a = frame[self.columns].to_numpy(float)
        self.medians = np.nanmedian(a, axis=0)
        full = self._impute(a)
        self.keep = np.std(full, axis=0) > 1e-12
        self.mean = full[:, self.keep].mean(axis=0)
        self.scale = full[:, self.keep].std(axis=0)
        names = self.columns + [c + "__missing" for c in self.columns]
        self.feature_names = [n for n, keep in zip(names, self.keep) if keep]
        if not self.keep.any():
            raise ValueError("No nonconstant training features")
        return self

    def _impute(self, a):
        if np.isinf(a).any():
            raise ValueError("Infinite feature value")
        missing = np.isnan(a)
        return np.concatenate([np.where(missing, self.medians, a), missing.astype(float)], axis=1)

    def transform(self, frame: pd.DataFrame, scaled=False):
        missing_columns = set(self.columns) - set(frame.columns)
        if missing_columns:
            raise ValueError(f"Missing feature columns: {sorted(missing_columns)[:5]}")
        full = self._impute(frame[self.columns].to_numpy(float))[:, self.keep]
        return (full - self.mean) / self.scale if scaled else full


class PrestonInspired:
    """Dataset-scale power-law proxy, not a calibrated physical Preston model.

    exp(b0) * (1+P)^alpha * (1+V)^beta * product((1+Qj)^gamma_j)
    * exp(sum(delta_j * usage_j)), fitted robustly on TRAIN in log-target space.
    Each sensor uses its own Train positive median scale. All coefficients are
    empirical; no causal, monotonic or physical-unit claim is made.
    """
    def __init__(self, regularization=1.0):
        self.regularization = regularization

    def _sensors(self, frame):
        return frame[[f"f__all__{c}__mean" for c in PRESSURE + ROTATION + SLURRY + USAGE]].to_numpy(float)

    def _design(self, frame):
        raw = self._sensors(frame)
        raw = np.where(np.isnan(raw), self.medians, raw)
        z = np.maximum(raw / self.scales, 0)
        p = z[:, :5].mean(axis=1)
        v = z[:, 5:8].mean(axis=1)
        q = z[:, 8:11]
        u = z[:, 11:]
        return np.column_stack([np.log1p(p), np.log1p(v), np.log1p(q), np.log1p(u)])

    def fit(self, frame, target):
        a = self._sensors(frame)
        self.medians = np.nanmedian(a, axis=0)
        self.scales = np.array([np.median(c[c > 0]) if np.any(c > 0) else 1.0 for c in a.T])
        design = self._design(frame)
        self.design_mean = design.mean(axis=0)
        self.design_scale = design.std(axis=0)
        self.design_scale[self.design_scale < 1e-12] = 1.0
        x = (design - self.design_mean) / self.design_scale
        y = np.log(np.maximum(np.asarray(target, float), 1e-9))
        def residual(beta):
            return np.r_[beta[0] + x @ beta[1:] - y, np.sqrt(self.regularization) * beta[1:]]
        initial = np.r_[np.median(y), np.zeros(x.shape[1])]
        result = least_squares(residual, initial, loss="soft_l1", f_scale=0.10, max_nfev=2000)
        if not result.success:
            raise ValueError(f"Physics fit did not converge: {result.message}")
        self.coef = result.x
        return self

    def predict(self, frame):
        x = (self._design(frame) - self.design_mean) / self.design_scale
        # Numerical overflow protection only; bounds are fixed before training.
        return np.exp(np.clip(self.coef[0] + x @ self.coef[1:], -20, 20))


@dataclass
class ModelBundle:
    name: str
    stage: str
    kind: str
    estimator: object = None
    preprocessor: FeaturePreprocessor | None = None
    scaled: bool = False
    physics: PrestonInspired | None = None
    constant: float | None = None
    interval_radius: float | None = None
    calibration_n: int = 0
    train_chambers: tuple[str, ...] = ()

    def predict(self, frame):
        if "STAGE" in frame and not frame.STAGE.eq(self.stage).all():
            raise ValueError(f"Bundle expects Stage {self.stage}")
        if "chamber_route" in frame and self.train_chambers:
            seen = {c for route in frame.chamber_route for c in route.split("-")}
            if seen - set(self.train_chambers):
                raise ValueError("Unseen chamber: schema mismatch")
        if self.kind == "constant":
            out = np.full(len(frame), self.constant)
        elif self.kind == "physics":
            out = self.physics.predict(frame)
        else:
            x = self.preprocessor.transform(frame, scaled=self.scaled)
            out = np.asarray(self.estimator.predict(x)).reshape(-1)
            if self.kind == "hybrid":
                out = out + self.physics.predict(frame)
        if not np.isfinite(out).all():
            raise ValueError(f"Non-finite predictions: {self.name}")
        return out

    def predict_interval(self, frame):
        pred = self.predict(frame)
        if self.interval_radius is None:
            return pred, None, None
        # Lower endpoints are clipped at zero for the nonnegative target.
        return pred, np.maximum(0, pred - self.interval_radius), np.maximum(0, pred + self.interval_radius)
