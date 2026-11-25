// Crystal growth model of the process lab (../crystal-model.js).
// Reference values are worked by hand from the normal freezing law and the constants in the model file.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../crystal-model.js');

const C = M.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 1) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const until = (sim, done, limit = 200000) => { let t = 0; while (!done(sim.state) && t < limit) { sim.step(2); t += 2; } assert.ok(done(sim.state), 'the state was reached'); };
const dipped = dopant => { const sim = M.create(); sim.setControl('dopant', dopant); sim.setControl('seed', 1); run(sim, 21); return sim; };
/** A whole crystal: neck, shoulder, the controller on, `body` mm of body, out. */
function grown(dopant = 2.9, body = 120) {
  const sim = dipped(dopant), s = sim.state;
  sim.setControl('speed', 9); until(sim, x => x.necked);
  sim.setControl('speed', 1); until(sim, x => 2 * x.radius > 290);
  assert.equal(sim.setControl('auto', true), true); until(sim, x => x.body.length >= body);
  sim.setControl('seed', 0); run(sim, 25);
  return sim;
}

test('pull faster or heat the melt more and the crystal thins: the heat balance at the freezing front', () => {
  // radius = 150 x ((1 + 0.03 x 5) / (v + 0.03 dT))^2, worked by hand
  assert.equal(M.equilibrium(1), 150); near(M.equilibrium(2), 150 * (1.15 / 2.15) ** 2, 1e-12, 'mm at 2 mm/min'); near(M.equilibrium(9), 2.3694, 0.001, 'mm at 9 mm/min');
  assert.equal(M.equilibrium(0), C.radius.widest); assert.equal(M.equilibrium(0.5), C.radius.widest, 'no wider than the crucible allows');
  near(M.equilibrium(M.speedFor(152.5)), 152.5, 1e-12, 'the speed for a radius gives that radius'); near(M.equilibrium(M.speedFor(152.5, 20), 20), 152.5, 1e-12, 'and on a hotter melt');
  assert.ok(M.equilibrium(14) < C.radius.lost, 'at 14 mm/min the crystal cannot hold on');
  near(M.equilibrium(1, 25), 150 * (1.15 / 1.75) ** 2, 1e-12, '20 K hotter: 65 mm at 1 mm/min'); assert.equal(M.equilibrium(1, -3), C.radius.widest, 'below the melting point it spreads');
  assert.ok(M.speedFor(152.5, 20) < M.speedFor(152.5) - 0.4, 'a hotter melt has to be pulled slower for the same diameter');
});

test('the melt follows the heater over ten minutes; too hot, it melts a dipped seed away', () => {
  const sim = M.create(), s = sim.state;
  near(s.superheat, 5, 1e-12, 'K at the start'); assert.equal(M.steadySuperheat(125), 25);
  sim.setControl('heater', 125.2); assert.equal(s.controls.heater, 125); run(sim, 600, 10);
  near(s.superheat, 25 - 20 * Math.exp(-1), 1e-9, 'one time constant later');
  run(sim, 6000, 10); near(s.superheat, 25, 1e-3, 'settled');
  const hot = dipped(2.9); hot.setControl('heater', 140); run(hot, 3600, 10);
  assert.ok(!hot.state.attached && hot.state.lost && hot.state.meltedBack && hot.state.controls.seed === 0, 'the seed melted away');
  const right = dipped(2.9); right.setControl('heater', 120); run(right, 3600, 10);
  assert.ok(right.state.attached && !right.state.lost, '20 K is not too hot to dip into');
});

test('2.9 mg of boron in 250 kg of silicon makes a 10 ohm cm crystal, and the crystal grows richer along its length', () => {
  near(M.meltConcentration(2.6), 1.489e15, 0.002, 'boron per cm3 of melt for 2.6 mg');           // 2.6e-3 / 10.81 x 6.022e23 atoms in 250e3 / 2.57 cm3
  near(M.solidConcentration(1e15), 0.8e15, 1e-12, 'the first crystal takes 0.8 of the melt'); near(M.solidConcentration(1e15, 0.5), 0.8e15 * Math.pow(0.5, -0.2), 1e-12, 'half frozen');
  near(M.resistivity(1.328e15 - 1e12), 10, 0.001, 'ohm cm at 1.33e15 per cm3'); near(M.resistivity(0), 13280, 0.002, 'undoped');
  near(M.resistivity(M.solidConcentration(M.meltConcentration(2.9))), 9.99, 0.01, 'ohm cm at the seed end for 2.9 mg');
  assert.ok(M.resistivity(M.solidConcentration(M.meltConcentration(2.9), 0.6)) < 8.5, 'the tail end is more heavily doped');
});

test('the seed goes down in 20 s; with no pull nothing grows; a fast pull draws a neck', () => {
  const sim = M.create(), s = sim.state;
  sim.setControl('dopant', 2.94); sim.setControl('speed', 9.04); assert.deepEqual(s.controls, { seed: 0, speed: 9, dopant: 2.9, auto: false, heater: 105 });
  sim.setControl('speed', 0); run(sim, 30); assert.equal(s.attached, false); assert.equal(s.doped, null);
  sim.setControl('seed', 1); run(sim, 10); assert.ok(s.seed > 0.45 && s.seed < 0.55 && !s.attached); run(sim, 11);
  assert.ok(s.attached && s.doped === 2.9 && s.radius === C.radius.seed); assert.equal(sim.setControl('dopant', 5), false, 'the boron is in the melt');
  run(sim, 60); assert.equal(s.length, 0);
  sim.setControl('speed', 9); run(sim, 60); near(s.length, 9, 1e-9, 'mm pulled in a minute'); assert.ok(s.radius < C.radius.seed);
  until(sim, x => x.length >= 160);                              // at 9 mm/min the neck settles near 4.7 mm and is under 5 mm from about 100 mm on
  near(s.radius, M.equilibrium(9) + (C.radius.seed - M.equilibrium(9)) * Math.exp(-s.length / C.relax), 0.02, 'radius 160 mm on: closing on its equilibrium over 30 mm');
  assert.ok(s.necked && s.thin >= C.neck.length && !s.shouldered, `thin for ${s.thin.toFixed(0)} mm`);
});

test('the shoulder widens by at most 1.2 mm a mm, the controller holds 305 mm, and the body is measured', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 9); until(sim, x => x.necked); const neckEnd = s.length, r0 = s.radius;
  assert.equal(sim.setControl('auto', true), false, 'the controller does not take over far from the target');
  sim.setControl('speed', 1); until(sim, x => x.length >= neckEnd + 50);
  near(s.radius - r0, 1.2 * 50, 0.02, 'radius gained over 50 mm of shoulder'); assert.ok(s.shouldered);
  until(sim, x => 2 * x.radius > 290); assert.equal(sim.setControl('auto', true), true);
  until(sim, x => x.body.length >= 120);
  near(2 * s.radius, 305, 0.003, 'diameter under the controller'); near(s.controls.speed, M.speedFor(152.5), 0.005, 'the speed the controller settles at');
  assert.equal(sim.measure(), null, 'still in the puller');
  sim.setControl('seed', 0); run(sim, 5); assert.ok(s.ended && !sim.growing()); const length = s.length; run(sim, 20); assert.equal(s.length, length, 'out of the melt it grows no more');
  const r = sim.measure(), mid = s.profile.reduce((best, p) => Math.abs(p.z - (s.body.from + s.body.to) / 2) < Math.abs(best.z - (s.body.from + s.body.to) / 2) ? p : best);
  assert.ok(r.valid && r.necked && !r.dislocated && r.body >= 120 && r.diameter > 300 && r.diameter < 310, JSON.stringify(r));
  near(mid.m, s.profile.filter(p => p.z <= mid.z).reduce((sum, p, i, all) => sum + (i ? C.silicon.solid * Math.PI * (p.r / 10) ** 2 * ((p.z - all[i - 1].z) / 10) / 1000 : 0), 0), 0.03, 'kg frozen up to the middle of the body');
  near(r.resistivity, M.resistivity(M.solidConcentration(M.meltConcentration(2.9), mid.m / C.melt)), 1e-9, 'resistivity of the wafer from the middle of the body');
  assert.ok(r.ok && Math.abs(r.resistivity - 10) < 0.5 && r.fraction > 0.02 && r.fraction < 0.2, JSON.stringify({ resistivity: r.resistivity, fraction: r.fraction }));
});

test('a turn of the speed dial takes the crystal back from the controller', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 9); until(sim, x => x.necked); sim.setControl('speed', 1); until(sim, x => 2 * x.radius > 290); sim.setControl('auto', true);
  sim.setControl('speed', 2); assert.equal(s.controls.auto, false); until(sim, x => 2 * x.radius < 200); assert.ok(s.run === 0);
});

test('without a neck the crystal is dislocated; with no boron it is far from 10 ohm cm; lifted early it has no body', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 1); until(sim, x => 2 * x.radius > 290); sim.setControl('auto', true); until(sim, x => x.body.length >= 110);
  sim.setControl('seed', 0); run(sim, 25);
  const r = sim.measure(); assert.ok(r.valid && r.dislocated && !r.necked && !r.ok);
  const plain = grown(0).measure(); assert.ok(plain.valid && plain.necked && !plain.ok && plain.resistivity > 10000, `${plain.resistivity}`);
  const early = dipped(2.9); early.setControl('speed', 9); run(early, 300); early.setControl('seed', 0); run(early, 25);
  const none = early.measure(); assert.ok(!none.valid && none.body === 0 && !none.ok);
  early.setControl('speed', 0); early.setControl('seed', 1); run(early, 21); assert.ok(early.state.attached && early.state.length === 0 && early.state.result === null && early.state.doped === 2.9, 'dipping the seed again starts a new crystal on the same melt');
});

test('pulled too fast, the crystal comes off the melt and the seed goes up', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 14); until(sim, x => x.lost);
  assert.ok(!s.attached && !sim.growing() && s.controls.seed === 0 && s.radius < C.radius.lost); run(sim, 25); assert.equal(s.seed, 0); assert.equal(sim.measure(), null, 'there is nothing to measure');
});

test('a whole crystal takes hours of pulling, which one step can cover without losing the shape', () => {
  const fine = grown(2.9, 120), coarse = dipped(2.9), s = coarse.state;
  coarse.setControl('speed', 9); while (!s.necked) coarse.step(300);
  coarse.setControl('speed', 1); while (2 * s.radius <= 290) coarse.step(300);
  coarse.setControl('auto', true); while (s.body.length < 120) coarse.step(300);
  coarse.setControl('seed', 0); coarse.step(300);
  near(coarse.measure().diameter, fine.measure().diameter, 0.005, 'body diameter with steps of five minutes');
  assert.ok(fine.state.time > 2 * 3600 && fine.state.time < 8 * 3600, `${(fine.state.time / 3600).toFixed(1)} h`);
});

test('a seed that is only moved a little leaves the crystal growing; lifted past half its way, the crystal comes off', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 9); until(sim, x => x.necked);
  sim.setControl('speed', 1); until(sim, x => 2 * x.radius > 290);
  sim.setControl('auto', true); until(sim, x => x.body.length >= 60);
  const before = s.length;
  sim.setControl('seed', 0.9); run(sim, 60);
  assert.ok(sim.growing() && s.controls.auto && s.length > before && s.seed === 1, 'a nudge changes nothing: the crystal grows on under its controller');
  sim.setControl('seed', 1); run(sim, 60);
  assert.ok(sim.growing() && s.result === null && s.body.length >= 60, 'and the seed let go again does not start a new crystal');
  sim.setControl('seed', 0.49); run(sim, 2);
  assert.ok(s.ended && !sim.growing() && !s.controls.auto, 'past half its way the crystal is off the melt');
});

test('the puller stops pulling when its chamber is full, and when the charge is used up: nothing freezes that is not there', () => {
  const long = dipped(2.9), s = long.state;
  long.setControl('speed', 9); until(long, x => x.necked);
  long.setControl('speed', 1); until(long, x => 2 * x.radius > 290);
  long.setControl('auto', true); until(long, x => Boolean(x.full), 2000000);
  assert.equal(s.full, 'stroke'); assert.ok(s.length >= C.stroke && s.length < C.stroke + 1 && !s.controls.auto && long.growing(), `${s.length} mm`);
  const length = s.length, mass = s.mass; run(long, 3600, 10);
  assert.ok(s.length === length && s.mass === mass && mass < C.usable * C.melt, 'it hangs there until it is lifted');
  long.setControl('seed', 0); run(long, 25);
  const r = long.measure();
  assert.ok(r && Number.isFinite(r.resistivity) && r.resistivity > 0 && r.fraction < 1, JSON.stringify(r));
  // a crystal kept as wide as it will go uses the charge up before the chamber is full
  const fat = dipped(2.9), f = fat.state;
  fat.setControl('speed', 0.3); until(fat, x => Boolean(x.full), 4000000);
  assert.equal(f.full, 'melt'); assert.ok(f.mass >= C.usable * C.melt && f.mass < C.usable * C.melt + 0.2 && f.length < C.stroke, `${f.mass} kg, ${f.length} mm`);
  for (const p of f.profile) assert.ok(Number.isFinite(M.resistivity(M.solidConcentration(M.meltConcentration(2.9), p.m / C.melt))));
  assert.ok(Number.isFinite(M.solidConcentration(1e15, 1.2)), 'past the last of the melt the freezing law is held at its end');
});

test('the diameter controller takes the speed over even from a pull that stands still, and finds it again after a melt too hot', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 9); until(sim, x => x.necked);
  sim.setControl('speed', 1); until(sim, x => 2 * x.radius > 292);
  sim.setControl('speed', 0); run(sim, 60); const stood = s.length;
  assert.equal(sim.setControl('auto', true), true); run(sim, 3600, 2);
  assert.ok(s.controls.auto && s.controls.speed > 0.5 && s.length > stood + 30, `speed ${s.controls.speed}, grown ${s.length - stood} mm`);
  sim.setControl('heater', 140); run(sim, 3600, 2);
  assert.equal(s.controls.speed, 0, 'a melt this hot leaves the controller no speed to pull at');
  sim.setControl('heater', 105); run(sim, 5400, 2);
  assert.ok(s.controls.auto && s.controls.speed > 0.5, `back at ${s.controls.speed} mm/min once the melt has cooled`);
});

test('a crystal with no body in range is measured where it is widest', () => {
  const sim = dipped(2.9), s = sim.state;
  sim.setControl('speed', 9); run(sim, 600);
  sim.setControl('seed', 0); run(sim, 25);
  const r = sim.measure();
  assert.ok(!r.valid && r.body === 0);
  near(r.diameter, 2 * Math.max(...s.profile.map(p => p.r)), 1e-12, 'the widest place');
});
