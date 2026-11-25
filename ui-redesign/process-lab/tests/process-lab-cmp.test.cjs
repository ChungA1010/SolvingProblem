// Copper polish of the process lab (../cmp-model.js): the CMP lab's own process model with the
// bookkeeping of a patterned copper wafer on top. The removal model has its own tests (lab-3d-*.test.cjs); these are
// about what is added here, with values worked by hand from the ratios in the model file.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../cmp-model.js');
const P = require('../../lab-3d/process-model.js');

const C = M.constants, R = P.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 0.5) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const REFERENCE = [['platen', R.platenRef], ['carrier', R.carrierRef], ['slurry', R.slurryRef], ['conditioner', true]];
/** A wafer on the head, pad wet and turning, pressed at `psi`. */
function polishing(psi = R.pressureRef, wafer, controls = REFERENCE) {
  const sim = M.create({ wafer, seed: 4 });
  assert.equal(sim.moveWafer('head'), true);
  for (const [name, value] of controls) sim.setControl(name, value);
  run(sim, 12); sim.setControl('head', 1 + psi / R.pressureMax);
  return sim;
}
const lift = sim => { sim.setControl('head', 0); run(sim, 4); };

test('the stack under the polish: copper, then the barrier at a fifth of the rate, then the oxide at a hundredth; dishing a quarter', () => {
  assert.deepEqual(M.stackAt(300, 800, 505, 30), { copper: 500, liner: 30, erosion: 0, dishing: 0 });
  assert.deepEqual(M.stackAt(900, 800, 505, 30), { copper: 0, liner: 10, erosion: 0, dishing: 25 });           // 100 nm past clear: 20 nm of barrier gone, 25 nm of dishing
  const far = M.stackAt(1150, 800, 505, 30);                                                                    // 350 past clear: the barrier went in the first 150
  assert.equal(far.liner, 0); near(far.erosion, 2, 1e-9, 'nm of oxide lost'); near(far.dishing, 87.5, 1e-9, 'nm of dishing');
  assert.deepEqual(M.stackAt(0, 300, 505, 30), { copper: 300, liner: 30, erosion: 0, dishing: 205 }, 'a window the plating left 205 nm short');
  assert.equal(M.stackAt(1e5, 800, 505, 30).dishing, 505, 'no deeper than the window');
  near(M.weights.reduce((a, b) => a + b, 0), 1, 1e-12, 'the area weights add up');
});

test('copper comes off twice as fast as the oxide of the CMP lab under the same conditions', () => {
  const sim = polishing(), oxide = P.create({ seed: 4 });
  oxide.newWafer(); oxide.moveWafer('head'); for (const [name, value] of REFERENCE) oxide.setControl(name, value);
  for (let t = 0; t < 12; t += 0.5) oxide.step(0.5);
  oxide.setControl('head', 1 + R.pressureRef / R.pressureMax);
  run(sim, 30); for (let t = 0; t < 30; t += 0.5) oxide.step(0.5);
  near(sim.state.rate, 2 * oxide.state.rate, 1e-9, 'nm/min'); assert.ok(sim.state.rate > 250 && sim.state.rate < 650, `${sim.state.rate} nm/min on a pad that is still warming up`);
  assert.ok(sim.state.polishing && sim.stack.mean < 800 && sim.stack.covered === 1 && sim.stack.history.length > 20);
});

test('the copper clears from where the polish is fastest; polishing on dishes what cleared first', () => {
  const sim = polishing(), k = sim.stack;
  while (k.copper.every(v => v > C.cleared)) sim.step(0.5);                  // until a ring is clear all round: the thin side of a wafer that is not quite level clears a moment sooner
  const first = k.copper.findIndex(v => v <= C.cleared); assert.ok(first >= 0 && k.covered < 1 && k.mean > 5, `the first place clears while ${k.mean.toFixed(0)} nm are still left on average`);
  while (k.covered > 0) sim.step(0.5);
  assert.ok(k.dishing[first] > 2 && k.dishing[first] === Math.max(...k.dishing), 'the place that cleared first is dished most');
  near(k.dishing[first], C.dishing * (sim.state.wafer.start[first] - sim.state.wafer.film[first] - 800), 1e-9, 'a quarter of the polishing after it cleared');
  assert.ok(k.liner.every(v => v < 30) && k.mean === 0);
});

test('lifted at the right moment and scanned, the wafer passes; stopped early it keeps copper', () => {
  const good = polishing(); while (good.stack.covered > 0) good.step(0.25);
  lift(good); assert.equal(good.moveWafer('stage'), true); assert.equal(good.stack.result, null, 'the scan takes a moment');
  run(good, 1.5); const r = good.stack.result;
  assert.ok(r && r.cleared && r.ok && r.residue === 0 && r.dishingMax > 0 && r.dishingMax <= C.spec.dishing && r.scratches.length === 0, JSON.stringify({ residue: r.residue, dishing: r.dishingMax }));
  assert.equal(r.radius.length, R.nodes); assert.equal(r.radius.at(-1), 150); near(r.dishingMean, good.stack.dishing.reduce((sum, v, i) => sum + v * M.weights[i], 0), 1e-9, 'area mean of the dishing');
  assert.equal(good.moveWafer('head'), true); assert.equal(good.stack.result, null, 'back on the head, the scan no longer holds');

  const early = polishing(); while (early.stack.mean > 150) early.step(0.25);
  lift(early); early.moveWafer('stage'); run(early, 1.5);
  assert.ok(!early.stack.result.cleared && !early.stack.result.ok && early.stack.result.residue > 100 && early.stack.covered === 1);
  const long = polishing(); while (long.stack.covered > 0) long.step(0.25); run(long, 200);
  lift(long); long.moveWafer('stage'); run(long, 1.5);
  assert.ok(long.stack.result.cleared && !long.stack.result.ok && long.stack.result.dishingMax > C.spec.dishing, `over-polished: ${long.stack.result.dishingMax.toFixed(0)} nm of dishing`);
});

test('the head has to be up to move the wafer, and the emergency stop lifts it', () => {
  const sim = polishing(); run(sim, 5);
  assert.equal(sim.moveWafer('stage'), false, 'pressed on the pad'); sim.stop();
  assert.deepEqual({ ...sim.state.controls }, { head: 0, platen: 0, carrier: 0, slurry: 0, zone: 0, conditioner: false });
  run(sim, 4); assert.equal(sim.moveWafer('stage'), true);
});

test('a wafer that does not turn is polished to a wedge, and the scan finds copper on its thick side', () => {
  const sim = polishing(R.pressureRef, undefined, [['platen', R.platenRef], ['carrier', 0], ['slurry', R.slurryRef], ['conditioner', true]]);
  run(sim, 80);
  const w = sim.state.wafer, thin = sim.at(0.14, w.tiltAngle), thick = sim.at(0.14, w.tiltAngle + Math.PI);
  assert.ok(w.tilt > 20 && thick.copper > thin.copper + 30, `tilt ${w.tilt.toFixed(0)} nm: ${thin.copper.toFixed(0)} against ${thick.copper.toFixed(0)} nm of copper`);
  near(sim.at(0, 1).copper, sim.stack.centre, 1e-9, 'no wedge at the centre');
});

test('a dry pad scratches the wafer, and a scratched wafer does not pass', () => {
  const sim = polishing(4, undefined, [['platen', R.platenRef], ['carrier', R.carrierRef], ['slurry', 0], ['conditioner', false]]);
  run(sim, 60); assert.ok(sim.state.alarms.dry, 'the dry-pad alarm is on'); assert.ok(sim.state.wafer.scratches.length > 0);
  sim.setControl('slurry', 200); while (sim.stack.covered > 0) sim.step(0.25);
  lift(sim); sim.moveWafer('stage'); run(sim, 1.5);
  assert.ok(sim.stack.result.scratches.length > 0 && !sim.stack.result.ok); assert.ok(sim.stack.result.scratches.every(s => s.r >= 0 && s.r <= 150));
});

test('the copper comes in as the plating left it: where it is thicker it clears later', () => {
  const N = R.nodes, ramp = Array.from({ length: N }, (_, j) => 700 + 200 * j / (N - 1));
  const even = polishing(R.pressureRef, { thickness: 800 }), heavy = polishing(R.pressureRef, { thickness: 800, profile: ramp });
  near(heavy.stack.mean, ramp.reduce((sum, x, j) => sum + x * M.weights[j], 0), 1e-9, 'the copper over the area');
  assert.ok(heavy.stack.centre < heavy.stack.edge && heavy.profile.length === N);
  const firstClear = sim => { while (sim.stack.copper.every(v => v > C.cleared)) run(sim, 0.5); return { centre: sim.stack.copper[0], edge: sim.stack.copper[N - 1] }; };   // until a ring is clear all round
  const a = firstClear(even), b = firstClear(heavy);
  assert.ok(a.edge <= C.cleared && a.centre > 10, `an even film clears at the edge first: ${JSON.stringify(a)}`);
  assert.ok(b.centre <= C.cleared && b.edge > 50, `heavy at the edge, it clears at the centre first: ${JSON.stringify(b)}`);
});
