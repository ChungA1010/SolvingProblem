"""State-tracking MRR model v2 for the educational CMP lab simulator (issue #6).

One latent "normal-pressure removal level" per recipe, tracked with a local-level
Kalman filter. The same model answers every simulator stage:

* pre-start:   predict(ctx)                  -> MRR at nominal pressure, 90% interval
* in-process:  predict(ctx, pressure=p_obs)  -> MRR corrected by (p_obs / p_ref) ** alpha
* pending:     wafers polished but not measured simply do not update the state, so the
               next prediction carries more drift steps and a wider interval
* measured:    update(ctx, mrr, pressure)    -> state update on the pressure-normalised value

Inference uses only the Python standard library so that the browser port can be
checked number-for-number. Fitting lives in fit.py.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field

RECIPES = ("A456", "B456")
Z90 = 1.6448536269514722


@dataclass(frozen=True)
class WaferContext:
    """Everything known about a wafer before it starts (plus its own pressure once polishing)."""

    recipe: str
    position: int          # index among recorded wafers of the same recipe
    clock: float           # pad-usage clock: recorded + estimated hidden table wafers
    after_rest: bool       # first wafer of this recipe since a confirmed rest on the table
    after_pad_change: bool # first wafer of this recipe since a pad replacement on the table


@dataclass
class RecipeParams:
    q: float
    r: float
    alpha: float
    p_ref: float
    rest_offset: float
    pad_offset: float


@dataclass
class ModelParams:
    step_mode: str                      # "position" or "clock"
    recipes: dict[str, RecipeParams]
    pad_step: float
    rest_gap_s: float = 500.0
    version: str = "state-kalman-v2"
    fitted_on: str = ""
    notes: list[str] = field(default_factory=list)

    def to_json(self) -> dict:
        return {"schema_version": 1, "model_version": self.version, "step_mode": self.step_mode,
                "pad_step": self.pad_step, "rest_gap_s": self.rest_gap_s, "fitted_on": self.fitted_on,
                "interval_level": 0.9, "z90": Z90,
                "recipes": {k: asdict(v) for k, v in self.recipes.items()}, "notes": self.notes}

    @classmethod
    def from_json(cls, data: dict) -> "ModelParams":
        return cls(step_mode=data["step_mode"], pad_step=data["pad_step"], rest_gap_s=data["rest_gap_s"],
                   version=data["model_version"], fitted_on=data.get("fitted_on", ""),
                   notes=list(data.get("notes", [])),
                   recipes={k: RecipeParams(**v) for k, v in data["recipes"].items()})


@dataclass
class Prediction:
    mrr: float
    sd: float
    low: float
    high: float
    level: float
    level_sd: float
    steps: float
    pressure_factor: float
    offset: float


class RecipeTracker:
    """Kalman local-level tracker for one recipe."""

    def __init__(self, params: RecipeParams, step_mode: str):
        self.p = params
        self.step_mode = step_mode
        self.level: float | None = None
        self.var: float | None = None
        self.at: float | None = None   # step coordinate of the last update
        self.updates = 0

    def _coord(self, ctx: WaferContext) -> float:
        return float(ctx.position) if self.step_mode == "position" else float(ctx.clock)

    def _factor(self, pressure: float | None) -> float:
        if pressure is None or not math.isfinite(pressure) or pressure <= 0:
            return 1.0
        return (pressure / self.p.p_ref) ** self.p.alpha

    def _offset(self, ctx: WaferContext) -> float:
        return (self.p.rest_offset if ctx.after_rest else 0.0) + (self.p.pad_offset if ctx.after_pad_change else 0.0)

    def predict(self, ctx: WaferContext, pressure: float | None = None) -> Prediction | None:
        if self.level is None:
            return None
        steps = max(self._coord(ctx) - self.at, 1.0)
        level_var = self.var + steps * self.p.q
        f = self._factor(pressure)
        off = self._offset(ctx)
        mean = self.level * f + off
        var = level_var * f * f + self.p.r
        sd = math.sqrt(var)
        return Prediction(mean, sd, mean - Z90 * sd, mean + Z90 * sd, self.level, math.sqrt(level_var),
                          steps, f, off)

    def update(self, ctx: WaferContext, mrr: float, pressure: float | None = None) -> bool:
        f = self._factor(pressure)
        z = (mrr - self._offset(ctx)) / f
        noise = self.p.r / (f * f)
        coord = self._coord(ctx)
        if self.level is None:
            self.level, self.var, self.at = z, noise, coord
        else:
            if coord <= self.at:
                return False  # stale or repeated measurement: never move the state backwards in time
            pp = self.var + max(coord - self.at, 1.0) * self.p.q
            k = pp / (pp + noise)
            self.level = self.level + k * (z - self.level)
            self.var = (1 - k) * pp
            self.at = coord
        self.updates += 1
        return True

    def snapshot(self) -> dict:
        return {"level": self.level, "var": self.var, "at": self.at, "updates": self.updates}

    def restore(self, snap: dict) -> None:
        self.level, self.var, self.at, self.updates = snap["level"], snap["var"], snap["at"], snap["updates"]


class StateModel:
    def __init__(self, params: ModelParams):
        self.params = params
        self.trackers = {r: RecipeTracker(params.recipes[r], params.step_mode) for r in params.recipes}

    def predict(self, ctx: WaferContext, pressure: float | None = None) -> Prediction | None:
        return self.trackers[ctx.recipe].predict(ctx, pressure)

    def update(self, ctx: WaferContext, mrr: float, pressure: float | None = None) -> bool:
        return self.trackers[ctx.recipe].update(ctx, mrr, pressure)
