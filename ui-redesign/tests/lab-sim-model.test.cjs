const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const LabStateModel = require('../dist/lab-sim/state-model.js');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'lab-sim-parity.json'), 'utf8'));
const shipped = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'lab-sim', 'state-model-v2.json'), 'utf8'));
const close = (a, b, label) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${label}: ${a} vs ${b}`);

test('browser model reproduces the Python reference on a synthetic replay', () => {
  const model = LabStateModel.create(fixture.params);
  const pending = [];
  fixture.steps.forEach((step, i) => {
    for (const [kind, pressure] of [['pre', step.planned], ['inproc', step.observed]]) {
      const got = model.predict(step.ctx, pressure), want = step[kind];
      if (want === null) { assert.equal(got, null, `${kind} ${i}`); continue; }
      for (const key of ['mrr', 'sd', 'low', 'high', 'level', 'level_sd', 'steps', 'pressure_factor', 'offset'])
        close(got[key], want[key], `${kind} ${i} ${key}`);
    }
    if (step.measure) pending.push([i + step.delay, i]);
    pending.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    while (pending.length && pending[0][0] <= i) {
      const [, j] = pending.shift();
      model.update(fixture.steps[j].ctx, fixture.steps[j].mrr, fixture.steps[j].observed);
    }
  });
});

test('shipped model file loads and keeps the documented policy', () => {
  const model = LabStateModel.create(shipped);
  assert.equal(model.version, 'state-kalman-v2');
  assert.equal(shipped.step_mode, 'position');
  assert.equal(shipped.interval_level, 0.9);
  for (const recipe of ['A456', 'B456']) {
    assert.ok(shipped.recipe_meta[recipe].target_removal > 0);
    assert.equal(shipped.recipe_meta[recipe].spec_pct, 5);
  }
  assert.match(shipped.fitted_on, /folds 1-4/);
});

test('pending wafers widen the interval and never update the state', () => {
  const model = LabStateModel.create(shipped);
  const ctx = n => ({ recipe: 'A456', position: n, clock: n, after_rest: false, after_pad_change: false });
  model.update(ctx(0), 74, 269.78);
  const near = model.predict(ctx(1)), far = model.predict(ctx(6));
  assert.ok(far.high - far.low > near.high - near.low);
  assert.equal(far.level, near.level);
  assert.equal(model.update(ctx(0), 90), false, 'stale measurements are ignored');
});

test('pressure correction follows the fitted exponent and invalid input is rejected', () => {
  const model = LabStateModel.create(shipped);
  const a = { recipe: 'A456', position: 1, clock: 1, after_rest: false, after_pad_change: false };
  model.update({ ...a, position: 0, clock: 0 }, 74, shipped.recipes.A456.p_ref);
  const nominal = model.predict(a), low = model.predict(a, shipped.recipes.A456.p_ref * 0.93);
  close(low.mrr / nominal.mrr, Math.pow(0.93, shipped.recipes.A456.alpha), 'pressure factor');
  assert.throws(() => model.update(a, -1), /0보다 큰/);
  assert.throws(() => LabStateModel.create({ ...shipped, step_mode: 'random' }), /상태 이동/);
  assert.throws(() => model.predict({ ...a, recipe: 'A123' }), /레시피/);
});
