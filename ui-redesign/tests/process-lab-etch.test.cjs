// Etch model of the process lab (dist/process-lab/etch-model.js): the representative rates, and the bookkeeping of the shape.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/etch-model.js');

const C = M.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative + 1e-9, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
/** A chamber with the wafer inside and the given recipe running. */
function running(recipe, wafer) {
  const sim = M.create({ wafer, seed: 2 });
  sim.setControl('load', true); sim.step(C.door + 1);
  for (const [name, value] of Object.entries(recipe)) sim.setControl(name, value);
  return sim;
}
const run = (sim, seconds) => { for (let i = 0; i < seconds; i++) sim.step(1); };
const STANDARD = { oxide: 500, resist: { thickness: 1000, opening: 1000 } };

test('the two gases have the measured rates and selectivities at the reference power, and a mixture lies between', () => {
  const chf3 = M.rates({ chf3: true, cf4: false, power: 150, pressure: 50 }), cf4 = M.rates({ chf3: false, cf4: true, power: 150, pressure: 50 }), both = M.rates({ chf3: true, cf4: true, power: 150, pressure: 50 });
  near(chf3.oxide, 32.4, 1e-9, 'CHF3 oxide rate'); near(chf3.oxide / chf3.silicon, 16, 1e-9, 'CHF3 selectivity to silicon');
  near(cf4.oxide, 52.8, 1e-9, 'CF4 oxide rate'); near(cf4.oxide / cf4.silicon, 1.2, 1e-9, 'CF4 selectivity to silicon');
  assert.ok(both.oxide > chf3.oxide && both.oxide < cf4.oxide && both.oxide / both.silicon < 16 && both.oxide / both.silicon > 1.2);
  near(M.rates({ chf3: true, cf4: false, power: 300, pressure: 50 }).oxide, 64.8, 1e-9, 'twice the power, twice the rate');
});

test('there is no plasma without gas, below the striking power, or with the wafer outside', () => {
  assert.equal(M.rates({ chf3: false, cf4: false, power: 300, pressure: 50 }), null);
  assert.equal(M.rates({ chf3: true, cf4: false, power: 40, pressure: 50 }), null);
  const outside = M.create({ wafer: STANDARD }); outside.setControl('chf3', true); outside.setControl('power', 300); run(outside, 60);
  assert.equal(outside.state.plasma, false); assert.equal(outside.state.floor, 500);
});

test('low pressure etches straight down and high pressure attacks the walls', () => {
  near(M.rates({ chf3: true, cf4: false, power: 150, pressure: 10 }).anisotropy, 0.97, 1e-9, 'at 10 mTorr');
  near(M.rates({ chf3: true, cf4: false, power: 150, pressure: 200 }).anisotropy, 0.70, 1e-9, 'at 200 mTorr');
});

test('the opening goes down at the oxide rate and is through after thickness / rate', () => {
  const sim = running({ chf3: true, power: 300, pressure: 10 }, STANDARD), rate = 64.8;
  run(sim, 180);
  near(sim.state.field - sim.state.floor, rate * 3, 0.001, 'depth after three minutes');
  assert.equal(sim.state.field, 500, 'the oxide under the resist is untouched');
  run(sim, Math.ceil(500 / rate * 60) - 180 + 1);
  assert.ok(sim.state.floor < 1e-9, 'through');
  assert.ok(sim.state.siliconLoss < rate / 16 * 2 / 60 + 1e-9, 'hardly any silicon yet');
});

test('after the oxide is through, the over-etch removes silicon at rate / selectivity', () => {
  const selective = running({ chf3: true, power: 300, pressure: 10 }, STANDARD), fast = running({ cf4: true, power: 300, pressure: 10 }, STANDARD);
  run(selective, Math.ceil(500 / 64.8 * 60)); const before = selective.state.siliconLoss; run(selective, 60);
  near(selective.state.siliconLoss - before, 64.8 / 16, 0.01, 'silicon lost in a minute of CHF3 over-etch');
  run(fast, Math.ceil(500 / 105.6 * 60)); const start = fast.state.siliconLoss; run(fast, 60);
  near(fast.state.siliconLoss - start, 105.6 / 1.2, 0.01, 'silicon lost in a minute of CF4 over-etch');
});

test('each wall moves sideways by (1 - anisotropy) x the depth etched', () => {
  const sim = running({ chf3: true, power: 300, pressure: 200 }, STANDARD);
  run(sim, 240);
  near(sim.state.undercut, 0.30 * 64.8 * 4, 0.001, 'undercut after four minutes at 200 mTorr');
  const m = sim.measure(); near(m.width, 1000 + 2 * sim.state.undercut, 1e-9, 'window width');
});

test('the resist thins by rate / resist selectivity; when it is gone the oxide beside the openings goes too', () => {
  const thin = running({ cf4: true, power: 300, pressure: 10 }, { oxide: 500, resist: { thickness: 200, opening: 1000 } });
  run(thin, 60); near(thin.state.resist, 200 - 105.6, 0.001, 'resist after a minute of CF4 (1:1)');
  assert.equal(thin.state.field, 500);
  run(thin, 120);
  assert.equal(thin.state.resist, 0); assert.ok(thin.state.field < 500, `field oxide ${thin.state.field.toFixed(0)} nm`);
});

test('the endpoint light is high while the oxide is being removed and drops when the openings reach silicon', () => {
  const sim = running({ chf3: true, power: 300, pressure: 10 }, STANDARD);
  run(sim, 120); const during = sim.state.signal;
  run(sim, Math.ceil(500 / 64.8 * 60));  const after = sim.state.signal;
  assert.ok(during > C.glow * 2, `while etching: ${during.toFixed(3)}`);
  assert.ok(after < C.glow * 1.3 && after >= C.glow * 0.99, `after the oxide is through: ${after.toFixed(3)}`);
  assert.ok(sim.state.history.length > 100 && sim.state.history.every(p => 'signal' in p && 't' in p));
});

test('a resist that never opened gives no window and no endpoint', () => {
  const sim = running({ chf3: true, power: 300, pressure: 10 }, { oxide: 500, resist: { thickness: 1000, opening: 0 } });
  run(sim, 300);
  assert.equal(sim.state.floor, 500); near(sim.state.signal, C.glow, 1e-9, 'only the glow of the plasma');
  sim.setControl('power', 0); sim.step(1); sim.setControl('load', false); run(sim, C.door + 1);
  assert.equal(sim.state.result.open, false); assert.equal(sim.state.result.width, 0); assert.equal(sim.state.result.ok, false);
});

test('a wafer with no resist loses its oxide all over', () => {
  const sim = running({ cf4: true, power: 300, pressure: 10 }, { oxide: 500, resist: null });
  run(sim, 400);
  const m = sim.measure();
  assert.equal(m.oxide, 0); assert.equal(m.stripped, true); assert.equal(m.open, false);
});

test('the wafer is measured when it comes out: stopped at the endpoint it meets the run sheet', () => {
  const sim = running({ chf3: true, power: 300, pressure: 10 }, STANDARD);
  assert.equal(sim.setControl('load', false), false, 'the door stays shut while the plasma is on');
  run(sim, Math.ceil(500 / 64.8 * 60) + 30);                     // through, and half a minute more
  sim.setControl('power', 0); sim.step(1);
  assert.equal(sim.setControl('load', false), true); run(sim, C.door + 1);
  const m = sim.state.result;
  assert.ok(m.open && m.left === 0); assert.ok(m.siliconLoss > 0 && m.siliconLoss < C.spec.siliconLoss);
  assert.ok(Math.abs(m.width - 1000) < C.spec.width.tolerance); assert.equal(m.ok, true);
  assert.equal(m.oxide, 500);
  assert.equal(sim.setControl('load', true), false, 'a measured wafer does not go back in: its resist is gone');
});

test('stopping too early leaves oxide in the window; etching far too long digs into the silicon', () => {
  const early = running({ chf3: true, power: 300, pressure: 10 }, STANDARD); run(early, 200);
  assert.ok(!early.measure().open && early.measure().left > 200);
  const late = running({ cf4: true, power: 300, pressure: 10 }, STANDARD); run(late, 600);
  assert.ok(late.measure().open && late.measure().siliconLoss > C.spec.siliconLoss && !late.measure().ok);
});

test('dials stay inside their ranges', () => {
  const sim = M.create();
  sim.setControl('power', 9999); assert.equal(sim.state.controls.power, C.power.max);
  sim.setControl('pressure', 1); assert.equal(sim.state.controls.pressure, C.pressure.min);
  assert.equal(sim.setControl('lid', 1), false);
});
