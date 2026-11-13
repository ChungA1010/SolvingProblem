const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Virtual = require('../dist/lab-sim/virtual-tool.js');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'lab-sim-virtual-parity.json'), 'utf8'));
const shipped = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'lab-sim', 'state-model-v2.json'), 'utf8'));
const close = (a, b, label) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${label}: ${a} vs ${b}`);

test('browser virtual tool reproduces the Python generator for the same seed', () => {
  const tool = Virtual.create({ ...shipped, virtual: fixture.virtual }, fixture.init, fixture.seed);
  fixture.steps.forEach((s, i) => {
    const i_ = s.inputs, got = tool.wafer(i_.recipe, i_.pressure, i_.after_rest, i_.after_pad_change, i_.u_pad);
    for (const k of ['mrr', 'level', 'factor', 'offset', 'wear']) close(got[k], s.out[k], `step ${i} ${k}`);
  });
});

test('shipped model carries validated virtual-tool parameters', () => {
  assert.ok(shipped.virtual, 'virtual section');
  assert.match(shipped.virtual.validation, /24\/25/);
  for (const r of ['A456', 'B456']) {
    const [lo, hi] = shipped.virtual.pressure_range[r];
    assert.ok(lo < shipped.recipes[r].p_ref && hi >= shipped.recipes[r].p_ref * 0.999, `${r} range brackets p_ref`);
    assert.ok(shipped.virtual.reversion[r].phi > 0.8 && shipped.virtual.reversion[r].phi < 1);
  }
});

test('same seed gives the same hidden path; lower A456 pressure lowers MRR by the Preston factor', () => {
  const init = [['A456', 77, 2], ['B456', 83, 3]];
  const a = Virtual.create(shipped, init, 7), b = Virtual.create(shipped, init, 7);
  const pRef = shipped.recipes.A456.p_ref;
  for (let i = 0; i < 20; i++) {
    const x = a.wafer('A456', pRef, false, false, 150), y = b.wafer('A456', pRef * 0.95, false, false, 150);
    close(x.level, y.level, 'hidden level identical');
    close(x.mrr - y.mrr, x.level * (1 - Math.pow(0.95, shipped.recipes.A456.alpha)), 'pressure effect');
  }
  const c = Virtual.create(shipped, init, 8), d = Virtual.create(shipped, init, 8);
  const pB = shipped.recipes.B456.p_ref;
  close(c.wafer('B456', pB, false, false, 150).mrr, d.wafer('B456', pB * 1.04, false, false, 150).mrr, 'B456 has no supported pressure response');
});

test('the generator stays near its operating level over a long run (mean reversion)', () => {
  const tool = Virtual.create(shipped, [['A456', 77, 2], ['B456', 83, 3]], 11);
  const pRef = shipped.recipes.A456.p_ref, ys = [];
  for (let i = 0; i < 2000; i++) ys.push(tool.wafer('A456', pRef, false, false, 160).mrr);
  const mean = ys.reduce((s, v) => s + v, 0) / ys.length, sd = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / ys.length);
  assert.ok(Math.abs(mean - shipped.virtual.reversion.A456.mu) < 1.5, `mean ${mean}`);
  assert.ok(sd > 3 && sd < 6.5, `sd ${sd}`);
});
