// Process model of the CMP direct-operation experiment (../process-model.js).
// Synthetic only: textbook equations and stated simplifications, no PHM values.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../process-model.js');

const C = M.constants;
const RPM = 2 * Math.PI / 60;

/** Spins up, wets the pad, loads the wafer and presses it. */
function start(options = {}) {
  const sim = M.create({ seed: options.seed ?? 1 });
  sim.newWafer();
  sim.setControl('platen', options.platen ?? C.platenRef);
  sim.setControl('carrier', options.carrier ?? C.carrierRef);
  sim.setControl('slurry', options.slurry ?? C.slurryRef);
  sim.setControl('conditioner', options.conditioner ?? true);
  sim.setControl('zone', options.zone ?? 0);
  sim.step(options.warm ?? 12);
  assert.equal(sim.moveWafer('head'), true);
  sim.setControl('head', 1 + (options.pressure ?? C.pressureRef) / C.pressureMax);
  return sim;
}
/** Polishes until the mean thickness reaches `stop`, lifts the head and measures. */
function polish(options = {}) {
  const sim = start(options);
  let guard = 0;
  while (sim.meanThickness() > (options.stop ?? C.target + 6) && guard++ < (options.maxSteps ?? 20000)) sim.step(0.1);
  sim.setControl('head', 0); sim.step(4);
  assert.equal(sim.moveWafer('stage'), true);
  return { sim, result: sim.measure() };
}

test('the reference condition polishes at the reference rate and temperature', () => {
  const sim = start(); sim.step(60);
  const s = sim.state;
  assert.ok(Math.abs(s.rate / C.rateRef - 1) < 0.02, `rate ${s.rate}`);
  assert.ok(Math.abs(s.temp - C.tempRef) < 1, `temperature ${s.temp}`);
  assert.ok(Math.abs(s.coverage - M.reference.coverage) < 0.005);
  for (const key of ['pressure', 'speed', 'slurry', 'pad', 'temp', 'contact']) assert.ok(Math.abs(s.factors[key] - 1) < 0.02, `${key} ${s.factors[key]}`);
  assert.deepEqual(Object.keys(s.alarms), []);
});

test('relative speed is the same across the wafer only when platen and carrier turn together', () => {
  const centre = C.platenRef * RPM * C.centerDistance;
  for (const r of [0, 0.05, 0.10, 0.15]) assert.ok(Math.abs(M.meanSpeed(90, 90, r) - centre) < 1e-12);
  assert.ok(Math.abs(M.meanSpeed(90, 30, 0) - centre) < 1e-12);                 // the wafer centre does not see the carrier speed
  assert.ok(M.meanSpeed(90, 30, 0.15) > M.meanSpeed(90, 30, 0.10) && M.meanSpeed(90, 30, 0.10) > M.meanSpeed(90, 30, 0.05));
  assert.ok(M.meanSpeed(90, 30, 0.15) / centre > 1.05);
});

test('removal follows pressure, and more pressure heats the pad and loads the edge', () => {
  const low = polish({ pressure: 1.5 }), high = polish({ pressure: 5 });
  assert.ok(Math.abs(start({ pressure: 4.2 }).state.controls.head - (1 + 4.2 / C.pressureMax)) < 1e-12);
  assert.ok(high.result.meanRate > 2.5 * low.result.meanRate);
  assert.ok(high.result.maxTemp > low.result.maxTemp + 15);
  assert.ok(high.result.wiwnu > low.result.wiwnu);
});

test('a carrier that does not turn polishes a wedge', () => {
  const still = start({ carrier: 0 }); still.step(20);
  assert.ok(still.state.alarms.still, 'alarm while the head is not turning');
  assert.ok(still.state.wafer.tilt > 40);
  const turning = start(); turning.step(20);
  assert.ok(turning.state.wafer.tilt < 0.5);
  assert.ok(polish({ carrier: 0 }).result.wiwnu > 20);
});

test('a dry pad removes nothing and scratches the wafer', () => {
  const sim = start({ slurry: 0, warm: 3 }); sim.step(20);
  const s = sim.state;
  assert.ok(s.alarms.dry);
  assert.ok(s.wafer.incoming.mean - sim.meanThickness() < 1);
  assert.ok(s.wafer.scratches.length > 0);
  sim.setControl('head', 0); sim.step(4); sim.moveWafer('stage');
  const result = sim.measure();
  assert.equal(result.ok.defects, false); assert.equal(result.pass, false);
});

test('high speed with low pressure hydroplanes', () => {
  const sim = start({ pressure: 1, platen: 150, carrier: 147 }); sim.step(20);
  const preston = C.rateRef * (1 / C.pressureRef) * (150 / C.platenRef);
  assert.ok(sim.state.rate < 0.2 * preston, `rate ${sim.state.rate}`);
  assert.ok(sim.state.alarms.hydro);
  assert.ok(sim.state.factors.contact < 0.2);
});

test('conditioning keeps the pad from glazing', () => {
  const bare = start({ conditioner: false }), kept = start({ conditioner: true });
  for (let i = 0; i < 120; i++) { bare.step(1); kept.step(1); }                // one step() call advances at most 60 s
  assert.ok(bare.state.glaze < 0.75 && kept.state.glaze > 0.9);
  assert.ok(kept.state.rate > bare.state.rate * 1.1);
  assert.ok(kept.state.padWear > 0 && bare.state.padWear === 0);              // the price of conditioning is pad wear
});

test('the head lifts only after the pressure is released, and hand-over needs a raised head', () => {
  const sim = start(); sim.step(5);
  assert.equal(sim.moveWafer('stage'), false);
  sim.setControl('head', 0); sim.step(0.1);
  assert.equal(sim.state.gap, 0); assert.ok(sim.state.pressure > 0.05);
  sim.step(4);
  assert.equal(sim.state.pressure, 0); assert.ok(sim.state.gap > C.headTravel * 0.9);
  assert.equal(sim.moveWafer('stage'), true);
  sim.setControl('head', 1); sim.step(4);
  assert.equal(sim.moveWafer('head'), false);
});

test('the zone balance moves removal between centre and edge without changing the mean', () => {
  const removed = zone => { const sim = start({ zone }); sim.step(40); const w = sim.state.wafer; return { centre: w.start[0] - w.film[0], edge: w.start.at(-1) - w.film.at(-1), mean: w.incoming.mean - sim.meanThickness() }; };
  const centre = removed(0.1), even = removed(0), edge = removed(-0.1);
  assert.ok(centre.centre > even.centre * 1.08 && edge.centre < even.centre * 0.92);
  assert.ok(centre.edge < even.edge * 0.92 && edge.edge > even.edge * 1.08);
  assert.ok(Math.abs(centre.mean / even.mean - 1) < 0.01 && Math.abs(edge.mean / even.mean - 1) < 0.01);
  assert.equal(start().setControl('zone', 9), C.zoneMax);
});

test('a centre-thick wafer fails at the plain recipe and passes with the zone balance turned to the centre', () => {
  const plain = polish({ seed: 10 }), tuned = polish({ seed: 10, zone: 0.06 });
  assert.ok(plain.sim.state.wafer.incoming.edgeMinusCentre < -20);
  assert.equal(plain.result.ok.uniformity, false);
  assert.equal(tuned.result.pass, true);
  assert.ok(tuned.result.wiwnu < plain.result.wiwnu / 2);
});

test('the measurement has 49 points, follows the work order and repeats for the same seed', () => {
  const a = polish({ seed: 3 }), b = polish({ seed: 3 }), other = polish({ seed: 4 });
  assert.equal(a.result.points.length, 49);
  assert.deepEqual(M.rings.map(r => r[1]).reduce((x, y) => x + y, 0), 49);
  assert.equal(a.result.mean, b.result.mean); assert.equal(a.result.wiwnu, b.result.wiwnu);
  assert.notEqual(a.result.mean, other.result.mean);
  assert.equal(a.result.ok.thickness, Math.abs(a.result.mean - C.target) <= C.targetTol);
  assert.equal(a.result.ok.uniformity, a.result.wiwnu <= C.wiwnuMax);
  assert.equal(a.result.pass, a.result.ok.thickness && a.result.ok.uniformity && a.result.ok.defects);
  assert.ok(Math.abs(a.result.removed - (a.result.incoming - a.result.mean)) < 1e-9);
  const thick = polish({ seed: 3, stop: 700 });
  assert.equal(thick.result.ok.thickness, false); assert.ok(thick.result.error > 100);
});

test('the film monitor reads once per platen turn while the wafer is on the pad', () => {
  const sim = start({ platen: 60, carrier: 58 });
  const before = sim.state.monitor.t;
  sim.step(1); assert.equal(sim.state.monitor.t, before);                      // the head is still on its way down
  sim.step(3);                                                                 // in contact now
  let readings = 0, last = sim.state.monitor.t;
  for (let i = 0; i < 200; i++) { sim.step(0.05); if (sim.state.monitor.t !== last) { readings++; last = sim.state.monitor.t; } }
  assert.ok(readings >= 9 && readings <= 11, `${readings} readings in 10 s at 60 rpm`);
  sim.setControl('head', 0); sim.step(4);
  const lifted = sim.state.monitor.t; sim.step(5);
  assert.equal(sim.state.monitor.t, lifted);
});

test('film colours come from thin-film interference', () => {
  const { table, step, max } = M.filmColors();
  assert.equal(table.length, (max / step + 1) * 3);
  for (const d of [0, 100, 550, 1000]) for (const lambda of [450, 550, 650]) { const R = M.reflectance(d, lambda); assert.ok(R > 0 && R < 1); }
  const [r, g, b] = M.filmColor(C.target);
  assert.ok(g > r && g > b, 'the target thickness looks green');
  assert.notDeepEqual(M.filmColor(C.target), M.filmColor(C.filmStart));
  assert.deepEqual(M.filmColor(-5), M.filmColor(0)); assert.deepEqual(M.filmColor(5000), M.filmColor(max));
});

test('controls are clamped to the tool range and unknown controls are rejected', () => {
  const sim = M.create({ seed: 1 });
  assert.equal(sim.setControl('platen', 999), C.rpmMax); assert.equal(sim.setControl('slurry', -5), 0);
  assert.equal(sim.setControl('head', 7), 2); assert.equal(sim.setControl('conditioner', 1), true);
  assert.throws(() => sim.setControl('laser', 1), /unknown control/);
});
