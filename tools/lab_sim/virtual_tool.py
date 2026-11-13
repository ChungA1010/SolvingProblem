"""Virtual CMP tool driven by the learned state model (issue #6).

The practice mode of the simulator needs outcomes for settings that never happened in
the record. The state model already learned how this tool behaves, so the same
parameters are run forward as a generator:

    level_t = mu + phi * (level_{t-1} - mu) + N(0, q)     one step per wafer of the recipe; mean reversion
                                                          keeps the long-run spread at the observed within-
                                                          period level (the predictor still assumes a random
                                                          walk, as an operator's simple controller would)
    mrr_t   = level_t * (p_t / p_ref) ** alpha            pressure response (A456 Preston alpha=1,
              + rest_offset  [first wafer after rest]     B456 alpha=0: no supported response)
              + pad_offset   [first wafer after pad change]
              + wear * (u_pad - wear_ref)                 small within-pad-life drift (training folds)
              + N(0, r)                                   wafer-to-wafer scatter

The predictor never sees level_t; it only receives measured mrr, like an operator.
Inference-side code (StateModel) is unchanged. Standard library only, so the browser
port can be checked number-for-number with a seeded generator.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass

from .state_model import ModelParams


class Mulberry32:
    """Tiny seeded PRNG shared with the browser port (same sequence in JS)."""

    def __init__(self, seed: int):
        self.a = seed & 0xFFFFFFFF

    def random(self) -> float:
        self.a = (self.a + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def normal(self) -> float:
        u1 = max(self.random(), 1e-12)
        u2 = self.random()
        return math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)


@dataclass
class WearParams:
    slope: float      # MRR change per pad-usage unit inside one pad life
    ref_usage: float  # usage at which the wear term is zero (training mean within lives)


@dataclass
class ReversionParams:
    phi: float  # AR(1) persistence of the hidden level per wafer
    mu: float   # level the tool drifts back to (current operating regime)


@dataclass
class VirtualParams:
    model: ModelParams
    wear: dict[str, WearParams]
    reversion: dict[str, ReversionParams]
    pressure_range: dict[str, tuple[float, float]]  # allowed main-pressure setpoints (observed in development data)

    def to_json(self) -> dict:
        return {"wear": {k: asdict(v) for k, v in self.wear.items()},
                "reversion": {k: asdict(v) for k, v in self.reversion.items()},
                "pressure_range": {k: list(v) for k, v in self.pressure_range.items()}}


class VirtualTool:
    """One virtual polisher. Call wafer(...) in process order."""

    def __init__(self, vp: VirtualParams, init: dict[str, tuple[float, float]], seed: int):
        self.vp = vp
        self.rng = Mulberry32(seed)
        # True (hidden) level starts as a draw from the operator's current belief.
        self.level = {r: m + math.sqrt(v) * self.rng.normal() for r, (m, v) in init.items()}

    def wafer(self, recipe: str, pressure: float, after_rest: bool, after_pad_change: bool, u_pad: float) -> dict:
        p = self.vp.model.recipes[recipe]
        w = self.vp.wear[recipe]
        rv = self.vp.reversion[recipe]
        self.level[recipe] = rv.mu + rv.phi * (self.level[recipe] - rv.mu) + math.sqrt(p.q) * self.rng.normal()
        factor = (pressure / p.p_ref) ** p.alpha
        offset = (p.rest_offset if after_rest else 0.0) + (p.pad_offset if after_pad_change else 0.0)
        wear = w.slope * (u_pad - w.ref_usage)
        mrr = self.level[recipe] * factor + offset + wear + math.sqrt(p.r) * self.rng.normal()
        return {"mrr": mrr, "level": self.level[recipe], "factor": factor, "offset": offset, "wear": wear}
