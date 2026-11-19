// Oxidation model of the process lab (dist/process-lab/oxidation-model.js).
// The reference numbers below are worked out by hand from the published constants (see the top of the model file),
// so a typing error in the model shows up here. They check that the code follows its sources, not the sources themselves.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/oxidation-model.js');

const KB = 8.617333262e-5;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);

/** A furnace with the boat already up, at temperature, in the given gas. */
function hot(celsius, gases, options) {
  const sim = M.create(options), s = sim.state;
  s.boat = s.controls.boat = 1; s.tube = s.wafer = s.controls.setpoint = celsius;
  for (const name of ['n2', 'o2', 'h2o']) sim.setControl(name, gases.includes(name));
  return sim;
}
const run = (sim, minutes) => { for (let i = 0; i < minutes * 2; i++) sim.step(30); };

test('wet rate constants on (100) silicon follow the published Arrhenius constants', () => {
  const r = M.wetRates(1100);                                        // kT = 0.118329 eV
  near(r.B * 60 / 1e6, 0.5294, 0.005, 'B at 1100 C in um^2/h');       // 386 exp(-0.78 / kT)
  near(r.BA * 60 / 1e3, 2.903, 0.005, 'B/A at 1100 C in um/h');       // 1.63e8 / 1.68 exp(-2.05 / kT)
  near(r.A, 182.4, 0.01, 'A at 1100 C in nm');
});

test('one hour of wet oxidation at 1100 C grows about 0.64 um', () => {
  near(M.wetThickness(0, 60, 1100), 642, 0.01, 'thickness in nm');
  assert.ok(M.wetThickness(0, 120, 1100) < 2 * M.wetThickness(0, 60, 1100), 'growth slows down as the oxide thickens (parabolic regime)');
});

test('wet rate constants are proportional to the steam partial pressure', () => {
  const full = M.wetRates(1000, 1), half = M.wetRates(1000, 0.5);
  near(half.B, full.B / 2, 1e-9, 'B'); near(half.BA, full.BA / 2, 1e-9, 'B/A');
});

test('dry oxidation follows Massoud\'s analytical relation with the published (100) parameters', () => {
  // The relation typed out again here, independently of the model file: x = sqrt((A/2)^2 + B t + M1 (1 - e^(-t/tau1)) + M2 (1 - e^(-t/tau2)) + M0) - A/2
  const reference = (celsius, minutes, start) => {
    const kT = KB * (celsius + 273.15), B = 1.70e11 * Math.exp(-2.22 / kT), A = B / (7.35e6 * Math.exp(-1.76 / kT));
    const K1 = 2.49e11 * Math.exp(-2.18 / kT), K2 = 3.72e11 * Math.exp(-2.28 / kT), t1 = 4.14e-6 * Math.exp(1.38 / kT), t2 = 2.71e-7 * Math.exp(1.88 / kT);
    return Math.sqrt(A * A / 4 + B * minutes + K1 * t1 * (1 - Math.exp(-minutes / t1)) + K2 * t2 * (1 - Math.exp(-minutes / t2)) + start * start + A * start) - A / 2;
  };
  for (const [celsius, minutes] of [[800, 120], [900, 10], [900, 60], [950, 30]]) near(M.dryThickness(1.5, minutes, celsius), reference(celsius, minutes, 1.5), 1e-6, `${celsius} C, ${minutes} min`);
  const hour900 = M.dryThickness(1.5, 60, 900);
  assert.ok(hour900 > 18 && hour900 < 23, `an hour at 900 C gives about 20 nm, got ${hour900.toFixed(1)}`);
});

test('thin dry oxides grow faster than the linear-parabolic terms alone predict', () => {
  const r = M.dryRates(900), tenMinutes = M.dryThickness(1.5, 10, 900);
  const withoutEnhancement = -r.A / 2 + Math.sqrt(r.A * r.A / 4 + 1.5 * 1.5 + r.A * 1.5 + r.B * 10);
  assert.ok(tenMinutes > withoutEnhancement * 1.5, `${tenMinutes.toFixed(2)} nm against ${withoutEnhancement.toFixed(2)} nm`);
  assert.ok(r.tau1 > 1 && r.tau1 < 10 && r.tau2 > 10 && r.tau2 < 100, `time constants of minutes at 900 C: ${r.tau1.toFixed(2)}, ${r.tau2.toFixed(2)}`);
});

// Deal-Grove for dry O2 on (100) with Plummer's constants and the customary 25 nm starting thickness, in nm.
function dealGroveDry(celsius, hours) {
  const kT = KB * (celsius + 273.15), B = 772 * Math.exp(-1.23 / kT), A = B / (6.23e6 / 1.68 * Math.exp(-2.0 / kT)), tau = (0.025 * 0.025 + A * 0.025) / B;   // um, hours
  return (-A / 2 + Math.sqrt(A * A / 4 + B * (hours + tau))) * 1000;
}

test('for thick dry oxides at 1000 C and above the result stays close to the classic Deal-Grove charts', () => {
  near(M.dryThickness(1.5, 120, 1000), dealGroveDry(1000, 2), 0.06, 'nm after two hours at 1000 C');      // where the two parameter sets meet
  near(M.dryThickness(1.5, 60, 1100), dealGroveDry(1100, 1), 0.05, 'nm after one hour at 1100 C');
  near(M.dryThickness(1.5, 60, 1200), dealGroveDry(1200, 1), 0.06, 'nm after one hour at 1200 C');
});

test('dry oxidation does not jump where the two parameter sets meet', () => {
  let last = M.dryThickness(1.5, 60, 960);
  for (let celsius = 965; celsius <= 1040; celsius += 5) {
    const now = M.dryThickness(1.5, 60, celsius);
    assert.ok(now > last && now < last * 1.08, `${celsius} C: ${now.toFixed(1)} nm after ${last.toFixed(1)} nm`);
    last = now;
  }
  near(M.dryRates(900, 0.5).BA, M.dryRates(900).BA * Math.pow(0.5, 0.75), 1e-9, 'B/A at half pressure');
});

test('the furnace reproduces the closed-form thickness at a constant temperature', () => {
  const wet = hot(1000, ['h2o']); run(wet, 90);
  near(wet.state.oxide, M.wetThickness(1.5, 90, 1000), 0.002, 'wet, 1000 C, 90 min');
  const dry = hot(900, ['o2']); run(dry, 60);
  near(dry.state.oxide, M.dryThickness(1.5, 60, 900), 0.002, 'dry, 900 C, 60 min');
  assert.equal(wet.state.ambient, 'wet'); assert.equal(dry.state.ambient, 'dry');
  near(wet.state.minutes.wet, 90, 0.001, 'wet minutes on record');
});

test('nothing grows in nitrogen, with the gases off, or while the tube is open', () => {
  const inert = hot(1100, ['n2']); run(inert, 60);
  assert.equal(inert.state.oxide, 1.5); assert.equal(inert.state.ambient, 'inert');
  const off = hot(1100, []); run(off, 60);
  assert.equal(off.state.oxide, 1.5); assert.equal(off.state.ambient, 'none');
  const open = M.create(); open.setControl('o2', true); open.state.tube = open.state.controls.setpoint = 800; run(open, 60);   // boat still down
  assert.equal(open.state.oxide, 1.5);
});

test('nitrogen flowing with the oxidant dilutes it', () => {
  const pure = hot(1000, ['h2o']), diluted = hot(1000, ['h2o', 'n2']);
  run(pure, 60); run(diluted, 60);
  near(diluted.state.pressure, 0.5, 1e-9, 'partial pressure');
  near(diluted.state.oxide, M.wetThickness(1.5, 60, 1000, 0.5), 0.002, 'thickness at half pressure');
  assert.ok(diluted.state.oxide < pure.state.oxide);
});

test('a dry step after a wet one adds only what the slow regime adds', () => {
  const sim = hot(1000, ['h2o']); run(sim, 60);
  const thick = sim.state.oxide;
  sim.setControl('h2o', false); sim.setControl('o2', true); run(sim, 30);
  near(sim.state.oxide, M.dryThickness(thick, 30, 1000), 0.002, 'thickness after the dry step');
  const r = M.dryRates(1000), slowOnly = -r.A / 2 + Math.sqrt(r.A * r.A / 4 + thick * thick + r.A * thick + r.B * 30) - thick;
  near(sim.state.oxide - thick, slowOnly, 0.01, 'added thickness against the linear-parabolic terms alone');
});

test('the tube heats and cools at its ramp rates and the wafers follow', () => {
  const sim = M.create(), F = M.constants.furnace;
  sim.setControl('boat', 1); run(sim, F.boatTravel + 1);
  assert.equal(sim.state.boat, 1); assert.ok(sim.state.sealed);
  sim.setControl('setpoint', 1000); run(sim, 10);
  near(sim.state.tube, F.standby + 10 * F.rampUp, 0.001, 'tube after ten minutes of heating');
  assert.ok(sim.state.wafer < sim.state.tube && sim.state.wafer > F.standby - 80, `wafers lag behind: ${sim.state.wafer.toFixed(0)} C`);
  run(sim, 60); near(sim.state.tube, 1000, 1e-9, 'tube at its setpoint');
  sim.setControl('setpoint', 700); run(sim, 10);
  near(sim.state.tube, 1000 - 10 * F.rampDown, 0.001, 'tube after ten minutes of cooling');
});

test('the boat elevator is locked while the tube is hotter than 800 C', () => {
  const sim = hot(1000, ['n2']);
  assert.equal(sim.setControl('boat', 0), false, 'refused');
  run(sim, 5); assert.equal(sim.state.boat, 1);
  sim.setControl('setpoint', 700); run(sim, 80);
  assert.equal(sim.setControl('boat', 0), true); run(sim, M.constants.furnace.boatTravel + 1);
  assert.equal(sim.state.boat, 0);
});

test('the wafers are measured after they come out and cool, at five points', () => {
  const sim = hot(1000, ['h2o'], { target: 500, tolerance: 25, seed: 4 }); run(sim, 60);
  assert.equal(sim.measure(), null, 'not while the boat is up');
  sim.setControl('h2o', false); sim.setControl('n2', true); sim.setControl('setpoint', 700); run(sim, 80);
  sim.setControl('boat', 0); run(sim, 8);
  assert.equal(sim.measure(), null, 'not while the wafers are hot');
  run(sim, 15);
  const m = sim.measure();
  assert.equal(m.points.length, 5);
  near(m.mean, sim.state.oxide, 0.01, 'measured mean against the film');
  assert.equal(m.ok, Math.abs(m.mean - 500) <= 25);
  near(m.wetMinutes, 60, 0.35, 'wet minutes include the cooling in nitrogen only while steam was on');
  assert.ok(m.peak > 990);
});

test('setpoints stay inside the furnace range and move in steps of 5 C', () => {
  const sim = M.create(), F = M.constants.furnace;
  sim.setControl('setpoint', 5000); assert.equal(sim.state.controls.setpoint, F.maxSet);
  sim.setControl('setpoint', 0); assert.equal(sim.state.controls.setpoint, F.minSet);
  sim.setControl('setpoint', 1003); assert.equal(sim.state.controls.setpoint, 1005);
  assert.equal(sim.setControl('door', 1), false);
});
