// Wire bonding model of the process lab (../bond-model.js).
// The statics of the pull test are exact and checked against values worked by hand; the response of the bond to the
// settings is a representative one, and the tests check its shape (a window between too little and too much).
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../bond-model.js');

const C = M.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 0.05) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const GOOD = { power: 80, force: 30, time: 15 };

test('the pull test is statics: a hook at mid-span of a 200 um loop over 1 mm reads 0.743 of the wire tension', () => {
  near(M.pullFactor(), 2 * 200 / Math.sqrt(200 * 200 + 500 * 500), 1e-12, 'pull force per unit of tension'); near(M.pullFactor(), 0.7428, 0.0005, 'worked by hand');
  near(M.pullFactor({ height: 500, span: 1000 }), Math.SQRT2, 1e-12, 'at 45 degrees the two legs carry the pull at 1/sqrt 2 each');
  assert.ok(M.pullFactor({ height: 100, span: 1000 }) < M.pullFactor(), 'a lower loop reads less for the same wire');
});

test('ultrasonic energy is power times time, and the force has a best value', () => {
  near(M.energy(80, 15), 1.2, 1e-12, 'mJ'); assert.equal(M.coupling(30, C.bond.force), 1);
  assert.ok(M.coupling(15, C.bond.force) < 0.6 && M.coupling(60, C.bond.force) < 0.1 && M.coupling(40, C.bond.stitchForce) === 1);
});

test('with enough energy at the right force the bonds are stronger than the wire, and the pull test breaks the wire', () => {
  const w = M.bonded(GOOD), verdict = M.judge(w);
  assert.ok(w.ball > w.neck && w.stitch > w.neck, JSON.stringify(w)); near(w.neck, 8, 1e-12, 'gf the neck holds'); near(w.diameter, 45 + 6 + 4.2, 1e-9, 'ball diameter in um');
  assert.deepEqual(verdict.pull, { force: 8 * M.pullFactor(), mode: 'neck' }); assert.ok(verdict.ok && verdict.pull.force > C.spec.pull);
});

test('with the dials as they stand the wire comes off, and too much power and force crack the pad and squash the ball', () => {
  const weak = M.judge(M.bonded({ power: 30, force: 20, time: 10 }));
  assert.ok(!weak.ok && weak.pull.force < C.spec.pull && ['lift', 'stitch'].includes(weak.reason), JSON.stringify(weak));
  const hard = M.bonded({ power: 170, force: 55, time: 30 }), verdict = M.judge(hard);
  assert.ok(hard.crater > C.crater.limit && hard.diameter > C.pad); assert.equal(verdict.reason, 'crater'); assert.equal(verdict.pull.mode, 'crater'); assert.ok(verdict.pull.force < C.spec.pull);
  const wide = M.judge(M.bonded({ power: 100, force: 45, time: 40 })); assert.equal(wide.reason, 'wide', 'a ball wider than the pad fails even when it holds');
  assert.ok(M.bonded({ power: 200, force: 35, time: 20 }).neck < M.bonded(GOOD).neck, 'too much ultrasonic power weakens the neck');
  let last = 0; for (let time = 5; time <= 50; time += 5) { const b = M.bonded({ power: 60, force: 30, time }).ball; assert.ok(b > last && b < C.bond.lift); last = b; }
});

test('a test wire is bonded, pulled and logged; the fifth test wire goes on a fresh dummy chip', () => {
  const sim = M.create({ chips: 10, seed: 3 }), s = sim.state;
  sim.setControl('power', 31); sim.setControl('force', 20.4); sim.setControl('time', 9.6); assert.deepEqual(s.controls, { power: 30, force: 20, time: 10 });
  assert.equal(sim.setControl('pull', true), false, 'nothing to pull yet');
  assert.equal(sim.setControl('bond', true), true); assert.equal(s.phase, 'bonding'); assert.equal(sim.setControl('bond', true), false, 'busy');
  run(sim, 1.2); assert.ok(s.progress > 0.45 && s.progress < 0.55 && !s.wire); run(sim, 1.3); assert.equal(s.phase, 'setup'); assert.ok(s.wire && s.wire.pulled === null && s.onChip === 1);
  near(s.wire.ball, M.bonded(s.controls).ball, 0.3, 'the wire is the settings\' wire with a little scatter');
  assert.equal(sim.setControl('pull', true), true); run(sim, 1.7);
  assert.equal(s.tests.length, 1); assert.ok(!s.tests[0].ok && s.tests[0].force < C.spec.pull && s.wire.pulled.mode === s.tests[0].mode, JSON.stringify(s.tests[0]));
  assert.equal(sim.setControl('pull', true), false, 'a wire is pulled once');
  for (const [name, value] of Object.entries(GOOD)) sim.setControl(name, value);
  for (let i = 0; i < 4; i++) { sim.setControl('bond', true); run(sim, 2.5); }
  assert.equal(s.onChip, 1, 'four on the first dummy, the fifth on the next'); sim.setControl('pull', true); run(sim, 1.7);
  assert.ok(s.tests[1].ok && s.tests[1].mode === 'neck' && s.tests[1].force > 5, JSON.stringify(s.tests[1]));
});

test('the run wires every good chip at 0.25 s a wire; good settings lose none, poor settings lose them all', () => {
  const sim = M.create({ chips: 120, seed: 3 }), s = sim.state;
  for (const [name, value] of Object.entries(GOOD)) sim.setControl(name, value);
  assert.equal(sim.setControl('run', true), true); assert.equal(sim.setControl('bond', true), false, 'no test wires during the run');
  run(sim, 16); assert.equal(s.phase, 'running'); assert.equal(s.at, 10, '1.6 s a chip: four wires and a step');
  sim.setControl('power', 0);                                     // the dials turned during the run do not change it
  run(sim, 120 * 1.6); assert.equal(s.phase, 'done');
  assert.deepEqual({ chips: s.result.chips, bonded: s.result.bonded, lost: s.result.lost, power: s.result.power }, { chips: 120, bonded: 120, lost: 0, power: 80 });
  const poor = M.create({ chips: 120, seed: 3 }); poor.setControl('run', true); run(poor, 120 * 1.6 + 1);
  assert.equal(poor.state.result.chips, 0); assert.equal(Object.values(poor.state.result.faults).reduce((a, b) => a + b, 0), 120);
  const edge = M.create({ chips: 120, seed: 3 }); for (const [name, value] of Object.entries({ power: 90, force: 35, time: 20 })) edge.setControl(name, value);      // strong, but the ball is as wide as the pad
  edge.setControl('run', true); run(edge, 120 * 1.6 + 1);
  assert.ok(edge.state.result.chips > 0 && edge.state.result.lost > 0, `at the edge of the window some chips are lost: ${JSON.stringify(edge.state.result)}`);
  const none = M.create({ chips: 0, seed: 3 }); assert.equal(none.setControl('run', true), true); assert.equal(none.state.phase, 'done'); assert.equal(none.state.result.chips, 0);
});

test('a wire is judged on the pull force as it is printed: 3.0 gf meets a limit of 3 gf, 2.9 gf does not', () => {
  const wire = pull => ({ ball: pull / M.pullFactor(), neck: 20, stitch: 20, crater: 0, diameter: C.pad - 10 });
  const at = M.judge(wire(C.spec.pull - 0.04)), under = M.judge(wire(C.spec.pull - 0.06));
  assert.equal(at.pull.force.toFixed(1), C.spec.pull.toFixed(1)); assert.equal(at.ok, true, `${at.pull.force} gf reads ${at.pull.force.toFixed(1)}`);
  assert.equal(under.pull.force.toFixed(1), (C.spec.pull - 0.1).toFixed(1)); assert.equal(under.ok, false); assert.equal(under.reason, 'lift');
});
