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
  assert.equal(a.result.ok.thickness, Math.abs(Math.round(a.result.mean) - C.target) <= C.targetTol);            // on the numbers as the report prints them
  assert.equal(a.result.ok.uniformity, Number(a.result.wiwnu.toFixed(2)) <= C.wiwnuMax);
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

// ----- operating the cleaner: how far the brush is pressed in, and ending a step early -----
test('the scrub works in proportion to the brush compression, and the reference setting is the old cleaner (hand-worked)', () => {
  const sim = polished(), w = sim.state.wafer, soil = w.soil;
  assert.equal(sim.state.controls.brush, C.brushRef);
  assert.equal(sim.setControl('brush', 0.5), 0.5); assert.equal(sim.setControl('brush', 9), C.brushMax); sim.setControl('brush', 0.5);
  sim.moveWafer('cleaner'); sim.step(10);
  assert.ok(Math.abs(w.particles / soil - Math.exp(-10 * 0.5 / 4)) < 1e-9);     // half the compression: e^(-1.25) = 0.2865 left, against 0.0821 at the reference
  const lifted = polished(); lifted.setControl('brush', 0); lifted.moveWafer('cleaner'); lifted.step(20);
  assert.equal(lifted.state.wafer.particles, lifted.state.wafer.soil);          // a brush that does not touch takes nothing off
});

test('a brush pressed in beyond the safe compression scratches the wafer, and one within it never does', () => {
  let gentle = 0, hard = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const a = polished(seed); a.setControl('brush', C.brushSafe); a.moveWafer('cleaner'); a.step(46); a.moveWafer('stage'); gentle += a.measure().brushScratches;
    const b = polished(seed); b.setControl('brush', C.brushMax); b.moveWafer('cleaner'); b.step(46); b.moveWafer('stage');
    const m = b.measure(); hard += m.brushScratches;
    if (m.brushScratches) { assert.equal(m.ok.defects, false); assert.equal(m.pass, false); }
    assert.ok(m.particles <= 1);                                                // 2000 e^(-10) e^(-10/6): it does clean
  }
  assert.equal(gentle, 0);
  assert.ok(hard >= 6 && hard <= 36, `scratches ${hard}`);                      // 0.15 a second for 20 s: about 3 a wafer, 18 on six
});

test('a step of the cleaner can be ended early: less time, more particles, and a dry cut short leaves the wafer wet (hand-worked)', () => {
  const sim = polished(), w = sim.state.wafer, soil = w.soil, k = sim.state.cleaner;
  assert.equal(sim.nextCleanStep(), false);                                     // nothing runs yet
  sim.moveWafer('cleaner'); sim.step(12); assert.equal(sim.nextCleanStep(), true); assert.equal(k.phase, 'rinse');
  sim.step(10); assert.equal(k.phase, 'dry'); sim.step(15.1); assert.equal(k.phase, 'done'); assert.equal(w.wet, false);
  assert.ok(Math.abs(w.particles / soil - Math.exp(-12 / 4 - 10 / 6)) < 1e-9);  // 0.00940: about 19 of 2000
  assert.ok(Math.abs(w.cleanTime - 37) < 1e-6);
  sim.moveWafer('stage'); const m = sim.measure();
  assert.equal(m.ok.clean, true); assert.ok(Math.abs(m.cycle.clean - 37) < 1e-6);
  const cut = polished(); cut.moveWafer('cleaner'); cut.step(32); assert.equal(cut.nextCleanStep(), true);
  assert.equal(cut.state.cleaner.phase, 'done'); assert.equal(cut.state.wafer.wet, true); assert.equal(cut.nextCleanStep(), false);
  cut.moveWafer('stage'); assert.equal(cut.measure().ok.clean, false);
});

// ----- from wafer to wafer: the life of the pad, and lots -----
/** A tool with pad wear and lots, at the reference settings, pad usage given as a share of its life. */
function line(options = {}) {
  const sim = M.create({ seed: options.seed ?? 1, cleaning: true, wear: true, lot: true, padUsed: options.padUsed ?? 0 });
  for (const [name, value] of [['platen', C.platenRef], ['carrier', C.carrierRef], ['slurry', C.slurryRef], ['conditioner', options.conditioner ?? true]]) sim.setControl(name, value);
  return sim;
}
/** One wafer through the line: polish to the target, clean, measure (or leave it unmeasured). */
function runWafer(sim, { measure = true, clean = true } = {}) {
  sim.newWafer(); sim.step(2); sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax);
  let guard = 0; while (sim.meanThickness() > C.target + 6 && guard++ < 20000) sim.step(0.1);
  sim.setControl('head', 0); sim.step(4);
  if (clean) { sim.moveWafer('cleaner'); sim.step(46); }
  if (!measure) return null;
  sim.moveWafer('stage'); return sim.measure();
}

test('without the wear option the pad has no life to lose', () => {
  const sim = polished(); assert.equal(sim.state.padLeft, 1); assert.equal(sim.state.padCut, 0); assert.equal(sim.state.lot, null); assert.equal(sim.lotSummary(), null);
});

test('the conditioner cuts the pad while it sweeps; between wafers only the first 30 s count (hand-worked)', () => {
  const sim = line(); sim.step(50); sim.step(50);                                            // no wafer: one conditioning step
  const s = sim.state;
  assert.ok(s.padCut > 26 && s.padCut <= 30, `cut ${s.padCut}`);                // 30 s less the spin-up of the platen
  assert.ok(Math.abs(s.lot.exSitu - 30) < 0.06);
  const before = s.padCut, m = runWafer(sim);
  assert.ok(Math.abs((s.padCut - before) - (m.polishTime + 30)) < 6, `cut in one wafer ${s.padCut - before}, polish ${m.polishTime}`);   // every second of the polish, then one 30 s step while the wafer is cleaned
  assert.ok(Math.abs(s.padLeft - (1 - s.padCut / C.padLife)) < 1e-12);
  const idle = line({ conditioner: false }); idle.step(50); idle.step(50); assert.equal(idle.state.padCut, 0);
});

test('a worn-out pad can no longer be conditioned: it glazes, the alarm says so, and a new pad sets it right', () => {
  const sim = line({ padUsed: 1 }), s = sim.state;
  assert.equal(s.padLeft, 0);
  sim.newWafer(); sim.step(2); sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax); sim.step(60); sim.step(60);   // a step is 60 s at most
  assert.ok(s.alarms.worn); assert.ok(s.glaze < 0.75, `glaze ${s.glaze}`);      // e^(-120/300) = 0.67 without conditioning; 0.94 with it
  assert.ok(s.factors.pad < 0.85);
  sim.setControl('head', 0); sim.step(4); assert.equal(sim.replacePad(), false); // not with a wafer in the head
  sim.moveWafer('pedestal'); sim.setControl('platen', 0); sim.step(12);
  assert.equal(sim.replacePad(), true); assert.equal(s.padLeft, 1); assert.equal(s.lot.padChanges, 1);
  sim.step(1); assert.equal(s.alarms.worn, undefined);
});

test('a lot counts every polished wafer once, and its time is the wafers plus pad changes plus conditioning between them (hand-worked)', () => {
  const sim = line({ conditioner: false }), s = sim.state;
  sim.newWafer(); sim.newWafer();                                               // a wafer that was never polished is not in the lot
  assert.equal(sim.lotSummary().count, 0);
  const first = runWafer(sim); assert.equal(first.ok.clean, true);
  assert.equal(first.lot.count, 1); assert.equal(first.lot.passed, first.pass ? 1 : 0); assert.equal(first.lot.done, false);
  assert.ok(Math.abs(first.lot.time.total - (first.polishTime + 45 + 30)) < 1e-6);
  assert.ok(Math.abs(first.lot.goodPerHour - (first.pass ? 3600 / (first.polishTime + 75) : 0)) < 1e-9);
  sim.measure(); assert.equal(sim.lotSummary().count, 1);                       // measured twice, counted once
  runWafer(sim, { measure: false });                                            // polished, never measured
  const third = runWafer(sim, { clean: false });                                // measured wet
  assert.equal(third.pass, false);
  let lot = sim.lotSummary();
  assert.equal(lot.count, 3); assert.equal(lot.wafers[1].measured, false); assert.equal(lot.wafers[1].pass, false);
  assert.ok(Math.abs(lot.time.wafers - lot.wafers.reduce((a, e) => a + e.polish + e.clean + 30, 0)) < 1e-9);
  assert.equal(lot.wafers[2].clean, 0);
  sim.newWafer(); sim.setControl('platen', 0); sim.step(12); assert.equal(sim.replacePad(), true); sim.setControl('platen', C.platenRef);
  sim.step(8); sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax);
  let guard = 0; while (sim.meanThickness() > C.target + 6 && guard++ < 20000) sim.step(0.1);
  sim.setControl('head', 0); sim.step(4); sim.moveWafer('cleaner'); sim.step(46); sim.moveWafer('stage'); sim.measure();
  const last = runWafer(sim); lot = last.lot;
  assert.equal(lot.count, 5); assert.equal(lot.done, true); assert.equal(lot.padChanges, 1); assert.equal(lot.time.padChange, 300);
  assert.equal(lot.time.exSitu, 0);
  assert.ok(Math.abs(lot.time.total - (lot.time.wafers + 300)) < 1e-9);
  assert.equal(lot.passed, lot.wafers.filter(e => e.pass).length); assert.ok(lot.passed <= 3);
  assert.ok(Math.abs(lot.goodPerHour - lot.passed / lot.time.total * 3600) < 1e-9);
  assert.ok(Math.abs(lot.yield - lot.passed / 5) < 1e-12);
  assert.equal(s.lot.id, 1); sim.newWafer();                                    // the next wafer opens the next lot
  assert.equal(s.lot.id, 2); assert.equal(sim.lotSummary().count, 0); assert.equal(s.lots.length, 1); assert.equal(s.lots[0].count, 5);
});

test('conditioning all through every polish uses a half-used pad up within a lot', () => {
  const always = line({ padUsed: 0.47 }); let worn = 0;
  for (let i = 0; i < C.lotSize; i++) { runWafer(always); if (always.state.padLeft === 0 && !worn) worn = i + 1; }
  assert.ok(worn >= 3 && worn <= 4, `worn out on wafer ${worn}`);               // 424 s left, about 140 s a wafer
  assert.ok(always.state.alarms.worn);
});

// ----- one statement of each number: what the page shows is what the report judges -----

test('at the reference condition the pressure, speed and slurry factors read x1, and 250 x the seven factors is the rate at any setting', () => {
  const ref = start(); ref.step(60);
  for (const key of ['pressure', 'speed', 'slurry']) assert.ok(Math.abs(ref.state.factors[key] - 1) < 2e-3, `${key} ${ref.state.factors[key]} at the reference condition`);
  for (const [platen, carrier, pressure, zone] of [[90, 87, 3, 0], [90, 0, 3, 0], [60, 150, 3, 0.1], [30, 150, 2, -0.1], [150, 30, 5, 0], [5, 150, 3, 0], [0, 87, 3, 0]]) {
    const sim = start({ platen, carrier, pressure, zone }); sim.step(15);
    const s = sim.state, f = s.factors, product = C.rateRef * f.pressure * f.speed * f.slurry * f.pad * f.temp * f.contact * f.level;
    assert.ok(s.rate > 50 && Math.abs(product / s.rate - 1) < 1e-9, `${platen}/${carrier} rpm: rate ${s.rate}, product ${product}`);
  }
  const still = start({ platen: 0, carrier: 87 }); still.step(15);
  assert.ok(Math.abs(still.state.factors.speed - 0.5) < 0.05, `a head that turns on a standing platen: the wafer moves at about half the reference speed on average, x${still.state.factors.speed}`);
});

test('the mean thickness is one number: the monitor, the record of the polish, the amount removed and the report', () => {
  const weights = M.rings.map(([r, count], k, all) => { const inner = k ? (all[k - 1][0] + r) / 2 : 0, outer = k < all.length - 1 ? (r + all[k + 1][0]) / 2 : C.waferRadius; return (outer * outer - inner * inner) / C.waferRadius ** 2 / count; });
  for (let seed = 1; seed <= 12; seed++) {
    const { sim, result } = polish({ seed, stop: 552 });
    const byArea = result.points.reduce((sum, p) => sum + p.weight * p.value, 0) / result.points.reduce((sum, p) => sum + p.weight, 0);
    assert.ok(Math.abs(result.mean - byArea) < 1e-9, 'the mean of the report is the mean over the area of its 49 points');
    assert.ok(Math.abs(result.mean - sim.state.monitor.mean) < 1, `seed ${seed}: the monitor read ${sim.state.monitor.mean} last, the metrology finds ${result.mean}`);
    assert.ok(Math.abs(sim.state.history.at(-1).mean - sim.state.monitor.mean) < 1e-9, 'the record ends on the last reading of the monitor');
    assert.ok(Math.abs(result.removed - (result.incoming - result.mean)) < 1e-9 && Math.abs(result.meanRate * result.polishTime / 60 - result.removed) < 1e-9, 'removed = incoming - mean = mean rate x time');
    assert.equal(result.ok.thickness, true, `seed ${seed}: lifted inside the band by the monitor, measured ${result.mean}`);
  }
  const point = result => result.points.find(p => p.r > 0.14).weight / result.points.find(p => p.r === 0).weight;
  const fresh = M.create({ seed: 3 }); fresh.newWafer(); fresh.moveWafer('stage');
  const unpolished = fresh.measure();
  assert.ok(Math.abs(point(unpolished) - weights[3] / weights[0]) < 1e-9 && point(unpolished) > 0.45 && point(unpolished) < 0.6, 'a point of the outer ring stands for about half the area of an inner one: its band ends at the wafer edge');
  assert.ok(Math.abs(unpolished.points.reduce((sum, p) => sum + p.weight, 0) - 1) < 1e-9, 'the 49 points stand for the whole wafer');
  for (let seed = 1; seed <= 12; seed++) {
    const sim = M.create({ seed }); sim.newWafer(); sim.moveWafer('stage');
    const m = sim.measure();
    assert.ok(m.removed >= 0 && m.removed < 1 && m.meanRate === 0, `seed ${seed}: an unpolished wafer has lost ${m.removed} nm`);
  }
});

test('the verdict is on the numbers as the report prints them: 575 nm passes a work order of 550 +- 25, 3.00% passes a limit of 3%', () => {
  const flat = (value, seed) => { const sim = M.create({ seed }); sim.newWafer(); sim.state.wafer.film.fill(value); sim.moveWafer('stage'); return sim.measure(); };
  const top = C.target + C.targetTol, bottom = C.target - C.targetTol, seen = { 'over the top, reads the top': 0, 'over the top': 0, 'under the bottom, reads the bottom': 0, 'under the bottom': 0 };
  for (let seed = 1; seed <= 8; seed++) for (const value of [top + 0.25, top + 0.75, bottom - 0.25, bottom - 0.75]) {
    const m = flat(value, seed), reads = Math.round(m.mean);
    assert.equal(m.ok.thickness, reads >= bottom && reads <= top, `${m.mean} nm reads ${reads} nm`);
    if (m.mean > top) seen[reads === top ? 'over the top, reads the top' : 'over the top']++;
    if (m.mean < bottom) seen[reads === bottom ? 'under the bottom, reads the bottom' : 'under the bottom']++;
  }
  for (const [kind, count] of Object.entries(seen)) assert.ok(count >= 4, `${count} measurements ${kind}`);
  // a dome of just the height at which the non-uniformity is a hair over the limit
  const dome = height => { const sim = M.create({ seed: 5 }), w = sim.newWafer(); w.film.forEach((_, i) => { w.film[i] = C.target + height * (1 - 2 * (sim.radius[i] / C.waferRadius) ** 2); }); sim.moveWafer('stage'); return sim.measure(); };
  let lo = 0, hi = 80;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (dome(mid).wiwnu < C.wiwnuMax + 0.002) lo = mid; else hi = mid; }
  const edge = dome(hi);
  assert.ok(edge.wiwnu > C.wiwnuMax && edge.wiwnu < C.wiwnuMax + 0.005, `non-uniformity ${edge.wiwnu}`);
  assert.equal(edge.ok.uniformity, true, 'it reads 3.00%');
  assert.equal(dome(hi * 1.02).ok.uniformity, false);
});

test('no alarm when nothing is wrong: a lift, a touch-down and a new wafer in the middle of a polish raise none', () => {
  const sim = start({ seed: 5 }), seen = new Set(), watch = seconds => { for (let t = 0; t < seconds; t += 0.05) { sim.step(0.05); for (const key of Object.keys(sim.state.alarms)) seen.add(key); } };
  watch(60); sim.setControl('head', 0); watch(20);
  assert.deepEqual([...seen], [], 'through a reference polish and its lift');
  sim.setControl('head', 1 + C.pressureRef / C.pressureMax); watch(8);
  sim.newWafer(); sim.setControl('head', 0); watch(10);
  assert.deepEqual([...seen], [], 'the head is let off: it is not pressed on an empty pad');
  sim.setControl('head', 1 + C.pressureRef / C.pressureMax); watch(6);
  assert.deepEqual([...seen], ['empty'], 'pressed with the wafer still on the load position');
});

test('a head pressed on a platen that stands raises an alarm, and the film monitor keeps its last reading', () => {
  const sim = start({ platen: 0, carrier: 87 });
  sim.step(6);
  const read = sim.state.monitor.t, shown = sim.state.monitor.mean, before = sim.meanThickness();
  sim.step(30);
  assert.ok(sim.state.alarms.stopped, JSON.stringify(Object.keys(sim.state.alarms)));
  assert.ok(sim.state.rate > 50 && before - sim.meanThickness() > 30, 'the head alone polishes the wafer');
  assert.equal(sim.state.monitor.t, read); assert.equal(sim.state.monitor.mean, shown);
  assert.ok(sim.state.t - sim.state.monitor.t > 30, 'the age of the reading is there to be shown');
  assert.equal(sim.state.history.at(-1).mean, shown, 'the record holds what the monitor read');
  sim.setControl('platen', C.platenRef); sim.step(6);
  assert.equal(sim.state.alarms.stopped, undefined); assert.ok(sim.state.monitor.t > read && Math.abs(sim.state.monitor.mean - sim.meanThickness()) < 4);
});

test('the record of a polish keeps the polish: waiting in the raised head adds nothing, and a long polish is thinned, not cut', () => {
  const sim = start({ seed: 2 }); sim.step(0.05);
  const first = sim.state.history[0];
  assert.ok(first && Math.abs(first.mean - sim.state.wafer.incoming.mean) < 1e-9, 'it starts as the wafer comes onto the head');
  sim.step(60); sim.setControl('head', 0); sim.step(6);
  const length = sim.state.history.length, last = sim.state.history.at(-1);
  assert.equal(last.rate, 0, 'its last sample is taken as the wafer leaves the pad');
  for (let i = 0; i < 21; i++) sim.step(60);                                  // more than twenty minutes in the raised head
  assert.equal(sim.state.history.length, length); assert.equal(sim.state.history[0], first); assert.equal(sim.state.history.at(-1), last);
  const slow = start({ seed: 2, platen: 30, carrier: 28, pressure: 1 });
  for (let i = 0; i < 30; i++) slow.step(60);                                  // half an hour on the pad
  const h = slow.state.history;
  assert.ok(h.length > 600 && h.length <= 1201, `${h.length} samples`);
  assert.ok(Math.abs(h[0].mean - slow.state.wafer.incoming.mean) < 1e-9 && h.at(-1).t - h[0].t > 1790, 'from the first second to the last');
  for (let i = 1; i < h.length; i++) assert.ok(h[i].t > h[i - 1].t);
});

test('a new wafer stops the cleaner, and the report knows how long the wafer was cleaned since its last polish', () => {
  const sim = M.create({ seed: 4, cleaning: true }); sim.newWafer();
  for (const [name, value] of [['platen', C.platenRef], ['carrier', C.carrierRef], ['slurry', C.slurryRef]]) sim.setControl(name, value);
  sim.step(12); sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax); sim.step(60); sim.setControl('head', 0); sim.step(6);
  sim.moveWafer('cleaner'); for (let i = 0; i < 2; i++) sim.step(30);
  assert.equal(sim.state.cleaner.phase, 'done');
  sim.moveWafer('stage');
  const cleaned = sim.measure();
  assert.ok(Math.abs(cleaned.cleanSince - cleaned.cleanCycle) < 1e-6 && cleaned.cleanCycle === C.cleanScrub + C.cleanRinse + C.cleanDry && cleaned.ok.clean);
  sim.moveWafer('head'); sim.setControl('head', 1 + C.pressureRef / C.pressureMax); sim.step(20); sim.setControl('head', 0); sim.step(6);
  sim.moveWafer('stage');
  const again = sim.measure();
  assert.equal(again.cleanSince, 0, 'polished again: not cleaned since'); assert.ok(again.cleanTime > 40 && again.ok.clean === false);
  sim.moveWafer('cleaner'); sim.step(3);
  assert.equal(sim.state.cleaner.phase, 'scrub');
  sim.newWafer();
  assert.equal(sim.state.cleaner.phase, 'idle'); assert.equal(sim.state.cleaner.left, 0);
  sim.step(30); assert.equal(sim.state.cleaner.phase, 'idle');
});

test('a pad change names what is in its way: the wafer on the head, the turning platen, the head that is not up', () => {
  const sim = M.create({ seed: 1 }); sim.newWafer();
  assert.deepEqual(sim.padBlocks(), []); assert.equal(sim.replacePad(), true);
  sim.setControl('head', 0.6); sim.step(8);                                   // lowered, not on the pad
  assert.deepEqual(sim.padBlocks(), ['head']); assert.equal(sim.replacePad(), false);
  sim.setControl('head', 0); sim.step(8); sim.setControl('platen', 60); sim.step(4);
  assert.deepEqual(sim.padBlocks(), ['platen']); assert.equal(sim.replacePad(), false);
  sim.moveWafer('head');
  assert.deepEqual(sim.padBlocks(), ['wafer', 'platen']);
  sim.setControl('platen', 0); sim.step(20); sim.moveWafer('pedestal');
  assert.deepEqual(sim.padBlocks(), []); assert.equal(sim.replacePad(), true);
});
