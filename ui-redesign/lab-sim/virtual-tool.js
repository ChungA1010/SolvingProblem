/* Virtual CMP tool (issue #6) — browser port of tools/lab_sim/virtual_tool.py.
   Runs the learned state-model parameters forward to create outcomes for practice runs.
   Results are model-generated, not measurements. Checked number-for-number against Python. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabVirtualTool = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return {
      random() {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      normal() {
        const u1 = Math.max(this.random(), 1e-12), u2 = this.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      },
    };
  }

  function check(modelJson) {
    const v = modelJson && modelJson.virtual;
    if (!v || !v.wear || !v.reversion || !v.pressure_range) throw new Error('가상 장비 파라미터가 없습니다.');
    for (const r of Object.keys(modelJson.recipes)) {
      if (!v.wear[r] || !v.reversion[r] || !v.pressure_range[r]) throw new Error(`${r} 가상 장비 파라미터가 없습니다.`);
      const { phi } = v.reversion[r];
      if (!(phi >= 0 && phi < 1)) throw new Error(`${r} 평균 회귀 계수가 올바르지 않습니다.`);
    }
    return v;
  }

  /* init: [[recipe, mean, variance], ...] in a fixed order so the random stream matches Python. */
  function create(modelJson, init, seed) {
    const v = check(modelJson), rng = mulberry32(seed), level = {};
    for (const [recipe, mean, variance] of init) level[recipe] = mean + Math.sqrt(variance) * rng.normal();
    return {
      seed,
      wafer(recipe, pressure, afterRest, afterPadChange, uPad) {
        const p = modelJson.recipes[recipe], w = v.wear[recipe], rv = v.reversion[recipe];
        if (!p) throw new Error(`지원하지 않는 레시피입니다: ${recipe}`);
        level[recipe] = rv.mu + rv.phi * (level[recipe] - rv.mu) + Math.sqrt(p.q) * rng.normal();
        const factor = Math.pow(pressure / p.p_ref, p.alpha);
        const offset = (afterRest ? p.rest_offset : 0) + (afterPadChange ? p.pad_offset : 0);
        const wear = w.slope * (uPad - w.ref_usage);
        const mrr = level[recipe] * factor + offset + wear + Math.sqrt(p.r) * rng.normal();
        return { mrr, level: level[recipe], factor, offset, wear };
      },
    };
  }

  return { create, mulberry32 };
});
