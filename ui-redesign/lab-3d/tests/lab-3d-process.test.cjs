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

// ----- after the polish: cleaning, and the time one wafer takes -----
/** Polishes to the target with a cleaner on the tool and lifts the head; the wafer is still in the head. */
function polished(seed = 1) {
  const sim = M.create({ seed, cleaning: true });
  sim.newWafer();
  for (const [name, value] of [['platen', C.platenRef], ['carrier', C.carrierRef], ['slurry', C.slurryRef], ['conditioner', true]]) sim.setControl(name, value);
  sim.step(12); sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax);
  let guard = 0; while (sim.meanThickness() > C.target + 6 && guard++ < 20000) sim.step(0.1);
  sim.setControl('head', 0); sim.step(4);
  return sim;
}

test('a tool without a cleaner has no cleaner to go to, and its verdict has no cleaning criterion', () => {
  const { sim, result } = polish();
  assert.equal(sim.moveWafer('cleaner'), false);
  assert.equal('clean' in result.ok, false); assert.equal(result.particles, undefined);
});

test('a polished wafer leaves the pad wet with slurry particles on it, and fails if it is measured like that', () => {
  const sim = polished(), w = sim.state.wafer;
  assert.equal(w.wet, true);
  assert.ok(w.particles >= 2000 * 0.85 && w.particles <= 2000 * 1.15, `particles ${w.particles}`);
  assert.equal(w.particles, w.soil);
  sim.moveWafer('stage'); const m = sim.measure();
  assert.equal(m.ok.clean, false); assert.equal(m.pass, false); assert.equal(m.wet, true); assert.equal(m.particles, Math.round(w.soil));
  assert.equal(m.ok.thickness, true);                                         // the polish itself was right
});

test('scrub and rinse remove particles first-order in time, and the spin dry leaves the wafer dry (hand-worked)', () => {
  const sim = polished(), w = sim.state.wafer, soil = w.soil, k = sim.state.cleaner;
  assert.equal(sim.moveWafer('cleaner'), true); assert.equal(k.phase, 'scrub');
  sim.step(10); assert.ok(Math.abs(w.particles / soil - Math.exp(-10 / 4)) < 1e-9);            // 0.082085 of them left
  sim.step(10); assert.equal(k.phase, 'rinse'); assert.ok(Math.abs(w.particles / soil - Math.exp(-5)) < 1e-9);   // 0.006738
  sim.step(10); assert.equal(k.phase, 'dry'); assert.ok(Math.abs(w.particles / soil - Math.exp(-5 - 10 / 6)) < 1e-9);   // 0.001273
  assert.equal(w.wet, true);
  sim.step(14.9); assert.equal(w.wet, true); assert.equal(k.phase, 'dry');
  sim.step(0.2); assert.equal(w.wet, false); assert.equal(k.phase, 'done');
  assert.ok(Math.abs(w.cleanTime - 45) < 1e-6, `clean time ${w.cleanTime}`);
  sim.step(30); assert.ok(Math.abs(w.cleanTime - 45) < 1e-6);                 // a finished cleaner does nothing more
  sim.moveWafer('stage'); const m = sim.measure();
  assert.ok(m.particles >= 2 && m.particles <= 3, `particles ${m.particles}`);   // 2000 ± 15 % times 0.001273
  assert.equal(m.ok.clean, true); assert.equal(m.pass, true);
});

test('a wafer taken out before the spin dry is still wet and fails, however few particles it carries', () => {
  const sim = polished(); sim.moveWafer('cleaner'); sim.step(32);              // scrub and rinse done, 2 s into the dry
  sim.moveWafer('stage'); const m = sim.measure();
  assert.ok(m.particles <= C.particlesMax); assert.equal(m.wet, true); assert.equal(m.ok.clean, false); assert.equal(m.pass, false);
  assert.equal(sim.state.cleaner.phase, 'idle');
});

test('polishing a cleaned wafer again soils it again', () => {
  const sim = polished(); sim.moveWafer('cleaner'); sim.step(46);
  const w = sim.state.wafer; assert.equal(w.wet, false);
  sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax); sim.step(6); sim.setControl('head', 0); sim.step(4);
  assert.equal(w.wet, true); assert.equal(w.particles, w.soil);
});

test('the polish repeats for the same seed with or without a cleaner on the tool', () => {
  const a = polish({ seed: 9 }).result, sim = polished(9); sim.moveWafer('stage'); const b = sim.measure();
  assert.equal(a.mean, b.mean); assert.equal(a.wiwnu, b.wiwnu);
});

test('the time of one wafer is polish plus clean plus transfer, and the hourly rate follows from it (hand-worked)', () => {
  const sim = polished(); sim.moveWafer('cleaner'); sim.step(46); sim.moveWafer('stage');
  const m = sim.measure(), c = m.cycle;
  assert.equal(c.polish, m.polishTime); assert.ok(Math.abs(c.clean - 45) < 1e-6); assert.equal(c.handling, 30);
  assert.ok(Math.abs(c.total - (m.polishTime + 75)) < 1e-6);
  assert.ok(Math.abs(c.perHour - 3600 / (m.polishTime + 75)) < 1e-9);
  assert.ok(m.polishTime > 95 && m.polishTime < 125, `polish ${m.polishTime} s`);   // about 450 nm at 250 nm/min is 108 s: 3600 / 183 = 19.7 wafers an hour
  assert.ok(c.perHour > 18 && c.perHour < 21.2, `per hour ${c.perHour}`);
  assert.equal(C.parallelModules, 4);
  const idle = M.create({ seed: 1, cleaning: true }); idle.newWafer(); idle.moveWafer('stage');
  assert.equal(idle.measure().cycle.perHour, 0);                              // nothing polished, nothing produced
});
