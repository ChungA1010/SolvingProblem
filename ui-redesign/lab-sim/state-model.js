/* State-tracking MRR model v2 (issue #6) — browser port of tools/lab_sim/state_model.py.
   Same arithmetic, checked number-for-number against the Python reference (tests/lab-sim-model.test.cjs). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabStateModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const Z90 = 1.6448536269514722;

  function checkParams(json) {
    if (!json || json.schema_version !== 1 || !json.recipes) throw new Error('지원하지 않는 상태 모델 파일입니다.');
    if (!['position', 'clock'].includes(json.step_mode)) throw new Error('알 수 없는 상태 이동 기준입니다.');
    for (const [name, p] of Object.entries(json.recipes)) {
      for (const key of ['q', 'r', 'alpha', 'p_ref', 'rest_offset', 'pad_offset']) {
        if (!Number.isFinite(p[key])) throw new Error(`${name} 파라미터 ${key}가 올바르지 않습니다.`);
      }
      if (p.q <= 0 || p.r <= 0 || p.p_ref <= 0) throw new Error(`${name} 분산·기준 압력은 양수여야 합니다.`);
    }
    return json;
  }

  class RecipeTracker {
    constructor(params, stepMode) {
      this.p = params; this.stepMode = stepMode;
      this.level = null; this.var = null; this.at = null; this.updates = 0;
    }
    coord(ctx) { return this.stepMode === 'position' ? ctx.position : ctx.clock; }
    factor(pressure) {
      if (pressure === null || pressure === undefined || !Number.isFinite(pressure) || pressure <= 0) return 1;
      return Math.pow(pressure / this.p.p_ref, this.p.alpha);
    }
    offset(ctx) {
      return (ctx.after_rest ? this.p.rest_offset : 0) + (ctx.after_pad_change ? this.p.pad_offset : 0);
    }
    predict(ctx, pressure = null) {
      if (this.level === null) return null;
      const steps = Math.max(this.coord(ctx) - this.at, 1);
      const levelVar = this.var + steps * this.p.q;
      const f = this.factor(pressure), off = this.offset(ctx);
      const mrr = this.level * f + off;
      const sd = Math.sqrt(levelVar * f * f + this.p.r);
      return { mrr, sd, low: mrr - Z90 * sd, high: mrr + Z90 * sd, level: this.level,
        level_sd: Math.sqrt(levelVar), steps, pressure_factor: f, offset: off };
    }
    update(ctx, mrr, pressure = null) {
      if (!Number.isFinite(mrr) || mrr <= 0) throw new Error('측정 MRR은 0보다 큰 유한한 숫자여야 합니다.');
      const f = this.factor(pressure);
      const z = (mrr - this.offset(ctx)) / f;
      const noise = this.p.r / (f * f);
      const coord = this.coord(ctx);
      if (this.level === null) {
        this.level = z; this.var = noise; this.at = coord;
      } else {
        if (coord <= this.at) return false; // stale or repeated measurement never moves the state back in time
        const pp = this.var + Math.max(coord - this.at, 1) * this.p.q;
        const k = pp / (pp + noise);
        this.level += k * (z - this.level);
        this.var = (1 - k) * pp;
        this.at = coord;
      }
      this.updates += 1;
      return true;
    }
    snapshot() { return { level: this.level, var: this.var, at: this.at, updates: this.updates }; }
    restore(s) { this.level = s.level; this.var = s.var; this.at = s.at; this.updates = s.updates; }
  }

  function create(json) {
    const params = checkParams(json);
    const trackers = Object.fromEntries(Object.entries(params.recipes)
      .map(([name, p]) => [name, new RecipeTracker(p, params.step_mode)]));
    const tracker = recipe => {
      const t = trackers[recipe];
      if (!t) throw new Error(`지원하지 않는 레시피입니다: ${recipe}`);
      return t;
    };
    return {
      version: params.model_version, params,
      predict: (ctx, pressure = null) => tracker(ctx.recipe).predict(ctx, pressure),
      update: (ctx, mrr, pressure = null) => tracker(ctx.recipe).update(ctx, mrr, pressure),
      snapshot: () => Object.fromEntries(Object.entries(trackers).map(([k, t]) => [k, t.snapshot()])),
      restore: snap => { for (const [k, s] of Object.entries(snap)) tracker(k).restore(s); },
      tracker,
    };
  }

  return { create, Z90 };
});
