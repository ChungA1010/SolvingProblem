// Wafer test model of the process lab (../eds-model.js).
// Reference values are worked by hand from the textbook expressions with the constants in the model file.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../eds-model.js');
const F = require('../flow-model.js');

const C = M.constants, DIES = F.dies(), KILLED = F.defects(1), CLEAN = KILLED.filter(hit => !hit).length;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 0.1) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const prober = (wafer = F.arriving(6), seed = 5) => M.create({ wafer, dies: DIES, killed: KILLED, seed });
const align = sim => { sim.setControl('x', -sim.state.offset.x); sim.setControl('y', -sim.state.offset.y); };
const probeAll = sim => { assert.equal(sim.setControl('probe', true), true); run(sim, DIES.length * 0.9 + 2); assert.equal(sim.state.phase, 'done'); return sim.state.result; };

test('the contact resistivity falls steeply with the surface doping', () => {
  near(M.contactResistivity(1e20), 1e-6, 1e-9, 'at 1e20 per cm3'); near(M.contactResistivity(1e19), 1e-4, 1e-9, 'at 1e19 per cm3');
  near(M.contactResistivity(1.66e19), 2.21e-5, 0.02, 'at 1.66e19 per cm3');                 // 1e-6 x exp(2.130e10 x (2.454e-10 - 1e-10))
  assert.ok(M.contactResistivity(3e18) > 1e-2 && M.contactResistivity(1e17) > 1e3 && M.contactResistivity(0) === Infinity);
});

test('the diode on a 10 ohm cm wafer: 0.63 V at 1 mA and 19 pA of leakage at 5 V', () => {
  const Na = M.acceptors(10);
  near(Na, 1.328e15, 0.001, 'acceptors per cm3');
  near(M.saturationCurrent(Na), 2.295e-14, 0.005, 'saturation current in A');               // q A ni^2 Dn / (Ln Na), Dn = 36.19 cm2/s, Ln = 190 um
  near(M.forwardVoltage(1e-3, M.saturationCurrent(Na)), 0.6333, 0.002, 'forward voltage in V');
  near(M.forwardVoltage(1e-3, M.saturationCurrent(Na), 10) - M.forwardVoltage(1e-3, M.saturationCurrent(Na)), 0.010, 1e-9, '10 ohm in series add 10 mV at 1 mA');
  near(M.depletionWidth(Na, 5), 2.385e-4, 0.005, 'depletion width in cm'); near(M.leakage(Na), 1.91e-11, 0.01, 'leakage in A');
  assert.ok(M.saturationCurrent(M.acceptors(1)) < M.saturationCurrent(Na), 'a more heavily doped wafer has less saturation current');
});

test('the needles\' resistance falls with the overdrive', () => {
  assert.equal(M.probeResistance(0), Infinity); near(M.probeResistance(40), 0.3 + 200 * Math.exp(-5), 1e-12, 'ohm at 40 um');
  assert.ok(M.probeResistance(20) > C.limits.resistance && M.probeResistance(50) < 1 && M.probeResistance(100) < M.probeResistance(50));
});

test('on the standard wafer every chip without a killer defect is good, and the others leak', () => {
  const truth = M.truths({ wafer: F.arriving(6), dies: DIES, killed: KILLED, seed: 5 });
  assert.equal(truth.length, DIES.length); assert.equal(truth.filter(t => t.good).length, CLEAN);
  truth.forEach((t, i) => {
    assert.equal(t.good, !KILLED[i]); assert.ok(t.resistance > 1 && t.resistance < 4, `resistance ${t.resistance}`); assert.ok(t.voltage > 0.62 && t.voltage < 0.65, `voltage ${t.voltage}`);
    if (KILLED[i]) assert.ok(t.leak >= 1e-7 && t.leak <= 1.1e-4, `leak of a defect ${t.leak}`); else assert.ok(t.leak < 5e-11, `leak ${t.leak}`);
  });
  assert.deepEqual(M.truths({ wafer: F.arriving(6), dies: DIES, killed: KILLED, seed: 5 }), truth, 'the same seed gives the same wafer');
});

test('the tester stops at the first test that fails', () => {
  const good = { open: false, resistance: 2, leak: 2e-11, voltage: 0.635 }, probe = { touching: true, resistance: 0.5 };
  assert.deepEqual(M.evaluate(good, probe), { good: true, bin: 'good', resistance: 2.5, leak: 2e-11, voltage: 0.6355 });
  assert.deepEqual(M.evaluate(good, { touching: false, resistance: Infinity }), { good: false, bin: 'contact', resistance: Infinity, leak: null, voltage: null });
  assert.equal(M.evaluate(good, { touching: true, resistance: 9 }).bin, 'contact', 'the needles\' own resistance counts');
  assert.deepEqual(M.evaluate({ ...good, leak: 3e-6 }, probe), { good: false, bin: 'leak', resistance: 2.5, leak: 3e-6, voltage: null });
  assert.equal(M.evaluate({ ...good, voltage: 0.3 }, probe).bin, 'voltage'); assert.equal(M.evaluate({ open: true }, probe).bin, 'contact');
});

test('with the dials untouched the needles miss the pads and every chip reads open', () => {
  const sim = prober(), s = sim.state;
  assert.ok(Math.abs(s.offset.x) >= 22 && Math.abs(s.offset.x) <= 40 && Math.abs(s.offset.y) >= 22 && Math.abs(s.offset.y) <= 40, JSON.stringify(s.offset));
  assert.equal(sim.setControl('contact', true), true); assert.deepEqual(s.contact, { touching: false, resistance: Infinity });
  const r = probeAll(sim);
  assert.equal(r.good, 0); assert.equal(r.bins.contact, DIES.length); assert.equal(r.missed, CLEAN, 'every good chip was thrown out');
});

test('aligned and pressed down enough, the prober finds the chips that are good; a retest takes the failed chips only', () => {
  const sim = prober(), s = sim.state;
  probeAll(sim);                                                    // first pass, misaligned
  align(sim); assert.deepEqual(sim.error(), { x: 0, y: 0 });
  sim.setControl('z', 52); assert.equal(s.controls.z, 50);
  sim.setControl('contact', true); assert.ok(s.contact.touching); near(s.contact.resistance, M.probeResistance(50), 1e-12, 'contact check in ohm');
  assert.equal(sim.setControl('probe', true), true); assert.equal(s.queue.length, DIES.length); assert.equal(s.passes, 2);
  run(sim, 10); assert.equal(s.phase, 'probing'); assert.equal(sim.setControl('probe', true), false, 'busy'); assert.equal(sim.setControl('contact', true), false, 'busy');
  assert.ok(s.tested === DIES.length && s.history.length > DIES.length + 8, 'the first chips of the second pass are done');
  run(sim, DIES.length * 0.9); assert.equal(s.phase, 'done');
  const r = s.result;
  assert.equal(r.good, CLEAN); assert.equal(r.missed, 0); assert.equal(r.bins.leak, DIES.length - CLEAN); assert.equal(r.bins.contact, 0); assert.equal(r.passes, 2);
  r.dies.forEach((die, i) => { assert.equal(die.good, !KILLED[i]); assert.equal(die.pass, 2); });
  assert.equal(sim.setControl('probe', true), true, 'the failed chips can be probed again'); assert.equal(s.queue.length, DIES.length - CLEAN);
  run(sim, 40); assert.equal(s.phase, 'done'); assert.equal(s.result.good, CLEAN, 'a real fail stays a fail'); assert.equal(s.result.dies.filter(die => die.pass === 3).length, DIES.length - CLEAN);
});

test('too little overdrive throws out good chips; the chuck steps row by row and takes 0.9 s a chip', () => {
  const sim = prober(), s = sim.state;
  align(sim); assert.equal(s.controls.z, 20);                       // the dial as it stands: 17 ohm of needle resistance on top of the chip's own
  assert.equal(sim.order.length, DIES.length); assert.equal(new Set(sim.order).size, DIES.length);
  assert.ok(DIES[sim.order[0]].y > DIES[sim.order.at(-1)].y && sim.order.slice(1).every((i, k) => Math.hypot(DIES[i].x - DIES[sim.order[k]].x, DIES[i].y - DIES[sim.order[k]].y) <= 20.01 || DIES[i].y !== DIES[sim.order[k]].y), 'neighbours in a row, then the next row');
  sim.setControl('probe', true); run(sim, 9.05); assert.equal(s.tested, 10);
  run(sim, DIES.length * 0.9); const low = s.result;
  assert.ok(low.missed === CLEAN && low.bins.contact === DIES.length && low.good === 0, JSON.stringify(low.bins));
  sim.setControl('z', 60); sim.setControl('probe', true); run(sim, DIES.length * 0.9);
  assert.equal(s.result.missed, 0); assert.equal(s.result.good, CLEAN);
});

test('what went wrong earlier shows as a bin on every chip', () => {
  const finish = (start, result) => { const flow = F.createRun(start); F.complete(flow, result); while (flow.at < 6) F.complete(flow); return flow.wafer; };
  const bins = wafer => { const sim = prober(wafer); align(sim); sim.setControl('z', 100); return probeAll(sim); };
  const closed = bins(finish('etch', { oxide: 500, width: 1010, depth: 300, open: false, left: 200, siliconLoss: 0 }));
  assert.equal(closed.bins.contact, DIES.length); assert.equal(closed.missed, 0, 'nothing good was thrown out: the windows are closed');
  assert.equal(bins(finish('deposition', { depth: 700, surface: 5e19, masked: false })).bins.leak, DIES.length, 'a junction all over joins the chips');
  assert.equal(bins(finish('deposition', { depth: 322, surface: 1.2e17, masked: true })).bins.contact, DIES.length, 'a weakly doped surface makes no contact');
  assert.equal(bins(finish('deposition', { depth: 60, surface: 3e19, masked: true })).bins.leak, DIES.length, 'a junction too shallow leaks');
  assert.equal(bins(finish('metal', { thickness: 1000, burnt: false })).bins.leak, DIES.length, 'copper left on the oxide joins the chips');
  assert.equal(bins(finish('metal', { thickness: 0, burnt: false })).bins.contact, DIES.length, 'no copper, no path');
  const marginal = bins(finish('deposition', { depth: 300, surface: 1.03e19, masked: true }));
  assert.ok(marginal.good > 0 && marginal.bins.contact > 0 && marginal.missed === 0, `at the limit of the surface doping some chips pass and some do not: ${JSON.stringify(marginal.bins)}`);
});
