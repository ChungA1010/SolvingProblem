// Copper electroplating model of the process lab (dist/process-lab/plating-model.js).
// Reference values: Faraday's law and Levich's equation worked by hand with the constants in the model file; the
// textbook solution for a resistive disc contacted at its edge (the modified Bessel function I0); the thickness
// differences measured in US patent 6,074,544. The cell's own numbers (its resistance, the seed) are representative,
// so the tests on them check directions and the run sheet, not exact values.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/plating-model.js');

const C = M.constants, N = C.nodes;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds, dt = 0.5) => { for (let t = 0; t < seconds - 1e-9; t += dt) sim.step(dt); };
const immersed = (rotation = 30) => { const sim = M.create({}); sim.setControl('rotation', rotation); sim.setControl('head', 1); run(sim, 4); return sim; };
/** Current off, head up, rinsed and dried, measured. */
const out = sim => { sim.setControl('current', 0); run(sim, 0.5); sim.setControl('head', 0); run(sim, 20); return sim.measure(); };
/** Plates at `amps` until the mean thickness reaches `nm`. */
const plate = (amps, nm, rotation = 60) => { const sim = immersed(rotation), s = sim.state; sim.setControl('current', amps); while (s.thickness < nm) sim.step(0.5); return sim; };
const bessel0 = x => { let sum = 1, term = 1; for (let k = 1; k < 60; k++) { term *= (x / 2) ** 2 / (k * k); sum += term; } return sum; };

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

test('a resistive film contacted at its edge: with a linear interface the current follows I0(r/L), L = sqrt(Rc s)', () => {
  const s = 100e-7 / C.film.resistivity;                                            // siemens: 100 nm of film at 2.4e-6 ohm cm
  for (const cell of [15, 60, 200]) {
    const i = M.distribution(new Array(N).fill(100), 0.01, { cell, tafel: 1e-9 }), L = Math.sqrt(cell * s);
    near(i[0] / i[N - 1], 1 / bessel0(C.radius / L), 0.001, `centre over edge, Rc ${cell} ohm cm2`);
    near(i[(N - 1) / 2] / i[N - 1], bessel0(C.radius / 2 / L) / bessel0(C.radius / L), 0.001, `half way over edge, Rc ${cell} ohm cm2`);
  }
  near(M.distribution(new Array(N).fill(100), 0.01).reduce((sum, x, j) => sum + x * M.weights[j], 0), 0.01, 1e-9, 'the wafer takes all of the current');
  const thick = M.distribution(new Array(N).fill(1e7), 0.01); near(thick[0], thick[N - 1], 1e-4, 'on a thick film the current is even');
  assert.deepEqual(Array.from(M.distribution(new Array(N).fill(100), 0)), new Array(N).fill(0), 'no current, none anywhere');
});

test('the terminal effect as measured: 500 nm on a 43 nm seed of a 200 mm wafer (US 6,074,544, FIG. 1)', () => {
  // The patent: the edge about 0.05 um thicker than the centre at 3.5 mA/cm2 and over 0.25 um at 15.8 mA/cm2. The fit takes
  // the cell's own resistance as nothing; with b = 77 mV the model gives 66 and 259 nm.
  const difference = mean => {
    const h = new Array(N).fill(0), steps = 400, dt = 500 / M.rate(mean) / steps; let guess;
    for (let k = 0; k < steps; k++) { const i = guess = M.distribution(h.map(x => x + 43), mean, { radius: 10, cell: 0, guess }); for (let j = 0; j < N; j++) h[j] += M.rate(i[j]) * dt; }
    return h[N - 1] - h[0];
  };
  const low = difference(0.0035), middle = difference(0.007), high = difference(0.0158);
  assert.ok(low > 40 && low < 80, `about 50 nm at 3.5 mA/cm2: ${low.toFixed(0)}`);
  assert.ok(high > 250 && high < 300, `over 250 nm at 15.8 mA/cm2: ${high.toFixed(0)}`);
  assert.ok(low < middle && middle < high, 'more current, more of it crowds to the edge');
});

test('in this cell the edge plates thicker than the centre, more so at higher current, and less once the film is thick', () => {
  const gentle = plate(5, 800), hard = plate(20, 800), spread = sim => sim.state.profile[N - 1] - sim.state.profile[0];
  assert.ok(spread(gentle) > 40 && spread(hard) > spread(gentle) + 10, `${spread(gentle).toFixed(0)} and ${spread(hard).toFixed(0)} nm`);
  for (const sim of [gentle, hard]) for (let j = 1; j < N; j++) assert.ok(sim.state.profile[j] >= sim.state.profile[j - 1] - 1e-9, 'thicker toward the edge');
  const early = immersed(60); early.setControl('current', 20); run(early, 1);
  const first = early.state.edge / early.state.density, late = hard.state.edge / hard.state.density;
  assert.ok(first > 1.1 && late < first - 0.05, `edge over mean: ${first.toFixed(2)} on the seed, ${late.toFixed(2)} at 800 nm`);
});

test('the run sheet asks for 800 +- 80 nm at every place, so a film can be right on average and still too thick at the edge', () => {
  const right = out(plate(10, 800));
  assert.ok(right.ok && right.thinnest >= 720 && right.thickest <= 880 && right.centre === right.profile[0] && right.edge === right.profile[N - 1], JSON.stringify({ thinnest: right.thinnest, thickest: right.thickest }));
  near(right.thickness, right.profile.reduce((sum, x, j) => sum + x * M.weights[j], 0), 1e-12, 'the mean is over the area');
  near(right.sheet, 1.68e-6 / (right.thickness * 1e-7) * 1000, 1e-9, 'milliohm per square of the mean');
  const heavy = out(plate(10, 850));
  assert.ok(!heavy.ok && Math.abs(heavy.error) <= C.spec.tolerance && heavy.thickest > 880, `mean ${heavy.thickness.toFixed(0)}, edge ${heavy.thickest.toFixed(0)}`);
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
  assert.ok(s.history.length > 50 && s.history.at(-1).nm <= s.thickness && s.history.at(-1).edge > s.history.at(-1).centre);
});

test('above the limit no place grows faster than the bath allows, the rest of the charge is lost, and the wafer burns', () => {
  const sim = immersed(), s = sim.state;
  sim.setControl('current', 30); run(sim, 20);                                     // 42 mA/cm2 on average against a limit of 37 at 30 rpm
  assert.ok(s.over && s.density > s.limit);
  const most = M.rate(M.limit(30)) * 20;
  assert.ok(Math.max(...s.profile) <= most * (1 + 1e-9) && s.thickness > most * 0.9, `${Math.max(...s.profile).toFixed(1)} of at most ${most.toFixed(1)} nm`);
  assert.ok(M.thicknessOf(s.charge) > s.thickness * 1.1);
  sim.setControl('rotation', 60); run(sim, 1); assert.ok(!s.over, 'more rotation raises the limit above the current, at the edge too');
  const r = out(sim); assert.ok(r.burnt && r.burntShare > 0.9 && !r.ok && r.byCharge > r.thickness, JSON.stringify({ share: r.burntShare }));
});

test('the edge passes the limit first: at 30 rpm 25 A stays under the limit on average but burns the edge', () => {
  const sim = immersed(), s = sim.state; sim.setControl('current', 25); run(sim, 1);
  assert.ok(s.density < s.limit && s.edge > s.limit && s.over, JSON.stringify({ mean: s.density, edge: s.edge, limit: s.limit }));
  while (s.thickness < 800) sim.step(0.5);
  const r = out(sim);
  assert.ok(r.burnt && !r.ok && r.burntShare > 0.1 && r.burntShare < 0.9 && r.scorched[N - 1] && !r.scorched[0], JSON.stringify({ share: r.burntShare }));
  assert.equal(sim.burntShare(), r.burntShare); assert.deepEqual(sim.scorchedPlaces(), r.scorched);
});

test('a short spell above the limit is forgiven', () => {
  const sim = immersed(), s = sim.state;
  sim.setControl('current', 30); run(sim, 2); sim.setControl('current', 20); run(sim, 76);
  const r = out(sim); assert.ok(s.burnt > 0 && s.burnt / s.thickness < C.burnt && !r.burnt, `${s.burnt.toFixed(0)} of ${s.thickness.toFixed(0)} nm`);
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
