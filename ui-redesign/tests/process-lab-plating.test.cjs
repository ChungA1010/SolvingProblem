// Copper electroplating model of the process lab (dist/process-lab/plating-model.js).
// Reference values are worked by hand from Faraday's law and Levich's equation with the constants in the model file.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/plating-model.js');

const C = M.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 0.5) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const immersed = () => { const sim = M.create({}); sim.setControl('head', 1); run(sim, 4); return sim; };

test('Faraday\'s law: 10 mA/cm2 grows 220 nm of copper a minute, and one ampere-hour puts 1.87 um on a 300 mm wafer', () => {
  near(M.rate(0.010) * 60, 220.5, 0.001, 'nm per minute at 10 mA/cm2');           // 63.546 x 0.01 / (2 x 96485.33 x 8.96) cm/s
  near(M.rate(0.020), 2 * M.rate(0.010), 1e-12, 'growth goes with the current');
  near(M.thicknessOf(3600), 1871.4, 0.001, 'nm from 3600 C over 707 cm2');
  near(M.thicknessOf(3600, 707), M.rate(1 / 707) * 3600, 1e-12, 'the same law, by charge or by current density');
});

test('Levich\'s equation: the limiting current density goes with the square root of the rotation', () => {
  near(M.limit(30), 0.0366, 0.005, 'A per cm2 at 30 rpm');                         // 0.620 x 2 x 96485.33 x (6e-6)^(2/3) x sqrt(3.1416) x 0.012^(-1/6) x 0.25e-3
  near(M.limit(120) / M.limit(30), 2, 1e-12, 'four times the rotation, twice the limit');
  assert.ok(M.limit(10) * C.area < C.current.max && M.limit(120) * C.area > C.current.max, 'the current dial reaches past the limit at low rotation only');
});

test('the sheet resistance of 800 nm of copper is 21 milliohm per square', () => {
  near(M.sheet(800), 0.021, 1e-9, 'ohm per square'); near(M.sheet(400), 2 * M.sheet(800), 1e-12, 'half the film, twice the resistance');
});

test('no copper grows until the wafer is in the bath, then it grows by the charge passed', () => {
  const sim = M.create({}), s = sim.state;
  sim.setControl('current', 10.2); sim.setControl('rotation', 62); assert.deepEqual(s.controls, { head: 0, current: 10, rotation: 60 });
  run(sim, 5); assert.equal(s.thickness, 0); assert.equal(s.charge, 0); assert.equal(s.plating, false);
  sim.setControl('head', 1); run(sim, 2); assert.ok(s.head > 0.6 && s.head < 0.7 && !s.immersed, `head ${s.head}`);
  run(sim, 1); assert.ok(s.immersed && s.spin === 60);
  run(sim, 60);
  near(s.thickness, M.rate(10 / 707) * 60, 0.02, 'nm after a minute at 10 A'); near(s.thickness, 311.9, 0.02, 'nm, worked by hand');
  near(M.thicknessOf(s.charge), s.thickness, 1e-9, 'below the limit all of the charge is copper'); assert.equal(s.burnt, 0); assert.ok(!s.over);
  assert.ok(s.history.length > 50 && s.history.at(-1).nm <= s.thickness);
});

test('above the limit the film grows no faster, the rest of the charge is lost, and the wafer is burnt', () => {
  const sim = immersed(), s = sim.state;
  sim.setControl('current', 30); run(sim, 20);                                     // 42 mA/cm2 against a limit of 37 at 30 rpm
  assert.ok(s.over && s.density > s.limit);
  near(s.thickness, M.rate(M.limit(30)) * 20, 0.03, 'nm grown at the limit'); assert.ok(M.thicknessOf(s.charge) > s.thickness * 1.1);
  sim.setControl('rotation', 60); run(sim, 1); assert.ok(!s.over, 'more rotation raises the limit above the current');
  sim.setControl('current', 0); sim.setControl('head', 0); run(sim, 30);
  const r = sim.measure(); assert.ok(r.burnt && !r.ok && r.byCharge > r.thickness);
});

test('a short spell above the limit is forgiven', () => {
  const sim = immersed(), s = sim.state;
  sim.setControl('current', 30); run(sim, 2); sim.setControl('current', 20); run(sim, 76);
  sim.setControl('current', 0); sim.setControl('head', 0); run(sim, 30);
  const r = sim.measure(); assert.ok(s.burnt > 0 && s.burnt / s.thickness < C.burnt && !r.burnt, `${s.burnt.toFixed(0)} of ${s.thickness.toFixed(0)} nm`);
});

test('the head does not rise while current flows; out of the bath the wafer is rinsed, dried and measured', () => {
  const sim = immersed(), s = sim.state;
  sim.setControl('current', 20); run(sim, 77);
  assert.equal(sim.setControl('head', 0), false, 'locked while plating'); run(sim, 1); assert.ok(s.immersed);
  assert.equal(sim.measure(), null, 'not in the bath');
  sim.setControl('current', 0); run(sim, 0.5); const stopped = s.thickness;
  assert.equal(sim.setControl('head', 0), true); run(sim, 4); assert.ok(s.head === 0 && s.wet && s.spin === C.dry); assert.equal(sim.measure(), null, 'still wet');
  run(sim, 15); assert.ok(!s.wet && s.spin === 0 && sim.canMeasure());
  const r = sim.measure();
  assert.equal(r.thickness, stopped); near(r.thickness, M.rate(20 / 707) * 78, 0.02, 'nm after 78 s at 20 A'); near(r.sheet, 1.68e-6 / (r.thickness * 1e-7) * 1000, 1e-9, 'milliohm per square');
  assert.ok(r.ok && !r.burnt && Math.abs(r.error) <= C.spec.tolerance, JSON.stringify(r));
  sim.setControl('head', 1); run(sim, 4); sim.setControl('current', 20); run(sim, 20); assert.ok(s.thickness > stopped + 150, 'the wafer can go back in for more');
});

test('a wafer without a seed film does not plate', () => {
  const sim = M.create({ wafer: { seed: false } }), s = sim.state;
  sim.setControl('head', 1); run(sim, 4); sim.setControl('current', 20); run(sim, 30);
  assert.equal(s.thickness, 0); assert.equal(s.plating, false); assert.equal(sim.setControl('head', 0), true);
  run(sim, 30); const r = sim.measure(); assert.equal(r.thickness, 0); assert.equal(r.sheet, null); assert.equal(r.ok, false);
});
