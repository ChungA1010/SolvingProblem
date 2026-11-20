// Ion implantation model of the process lab (dist/process-lab/implant-model.js).
// Reference points: a lecture example of a phosphorus implant (150 keV, 1e14 per cm2, range 0.2 um, straggle 0.06 um,
// boron background 3e15 per cm3: peak 6.6e18 per cm3, junction 0.435 um, 0.27 uA/cm2 for one minute; then 30 minutes at
// 950 C with D = 3e-15 cm2/s), a rough figure of about 0.12 um for the range at 100 keV, and values worked by hand.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/implant-model.js');

const C = M.constants;
const near = (actual, expected, relative, what) => assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relative, `${what}: ${actual} is not within ${relative * 100}% of ${expected}`);
const run = (sim, seconds) => { for (let i = 0; i < seconds; i++) sim.step(1); };

test('nuclear stopping dominates for slow phosphorus ions and electronic stopping for fast ones', () => {
  const slow = M.stopping('P', 'Si', 30), fast = M.stopping('P', 'Si', 200);
  assert.ok(slow.nuclear > 2 * slow.electronic); assert.ok(fast.electronic > fast.nuclear);
  near(M.stopping('P', 'Si', 100).electronic * 4.996e22 / 1e7, 277, 0.01, 'electronic stopping at 100 keV in eV/nm');   // worked by hand from the Lindhard-Scharff formula
  near(M.stopping('P', 'Si', 100).nuclear * 4.996e22 / 1e7, 326, 0.01, 'nuclear stopping at 100 keV in eV/nm');         // worked by hand from the ZBL formula
  near(M.stopping('P', 'Si', 400).electronic / M.stopping('P', 'Si', 100).electronic, 2, 1e-9, 'electronic stopping goes with the velocity');
});

test('the projected range of phosphorus in silicon is close to the values lecture examples quote', () => {
  near(M.range(100).projected, 120, 0.12, 'range at 100 keV in nm');
  near(M.range(150).projected, 200, 0.05, 'range at 150 keV in nm');
  near(M.range(150).straggle, 60, 0.15, 'straggle at 150 keV in nm');
  let last = 0;
  for (let keV = 20; keV <= 200; keV += 20) { const r = M.range(keV); assert.ok(r.projected > last && r.projected < r.path && r.straggle < r.projected); last = r.projected; }
});

test('the oxide stops the ions at about the same depth as silicon', () => {
  for (const keV of [50, 100, 200]) near(M.range(keV, 'oxide').projected, M.range(keV).projected, 0.15, `range in the oxide at ${keV} keV`);
});

test('the error function is accurate', () => {
  for (const [x, value] of [[0, 1], [0.5, 0.4795001], [1, 0.1572992], [2, 0.0046777], [-1, 1.8427008]]) assert.ok(Math.abs(M.erfc(x) - value) < 2e-7, `erfc(${x})`);
});

test('an oxide as thick as the range lets half the dose through; a thick one blocks it and a thin one does not', () => {
  const r = M.range(100, 'oxide');
  near(M.throughOxide(100, r.projected), 0.5, 1e-6, 'share through an oxide as thick as the range');
  assert.ok(M.throughOxide(100, 500) < 1e-10); assert.ok(M.throughOxide(100, 50) > 0.9);
  assert.ok(M.throughOxide(200, 300) > M.throughOxide(100, 300), 'faster ions get further');
  near(M.underOxide(100, 1e15, r.projected), 1e15 / (Math.sqrt(2 * Math.PI) * r.straggle * 1e-7), 1e-9, 'under an oxide as thick as the range the peak arrives');
  near(M.underOxide(100, 1e15, r.projected + 2 * r.straggle) / M.underOxide(100, 1e15, r.projected), Math.exp(-2), 1e-9, 'two straggles further it has fallen by exp(-2)');
});

test('phosphorus diffuses in silicon at the textbook rate', () => {
  near(M.diffusivity(950), 3e-15, 0.1, 'diffusivity at 950 C in cm2/s');
  near(Math.log(M.diffusivity(1100) / M.diffusivity(1000)), 3.66 / 8.617333262e-5 * (1 / 1273.15 - 1 / 1373.15), 1e-9, 'Arrhenius slope');
  near(M.substrateDoping(10), 1.33e15, 0.01, 'doping of a 10 ohm cm p-type wafer per cm3');
});

test('the lecture example is reproduced with its own range and straggle', () => {
  const given = { range: 200, straggle: 60, dose: 1e14, substrate: 3e15 }, implanted = M.profile(given);
  near(implanted.peak, 6.6e18, 0.01, 'peak concentration per cm3');
  near(implanted.junction, 435, 0.005, 'junction depth in nm');
  near(M.implantSeconds(1e14, 0.27e-6), 60, 0.02, 'seconds at 0.27 uA/cm2');
  const annealed = M.profile({ ...given, Dt: 3e-15 * 1800 });      // worked by hand: spread 68.4 nm, peak 5.83e18, junction 466 nm
  near(annealed.spread, 68.41, 0.001, 'spread after the anneal in nm'); near(annealed.peak, 5.832e18, 0.002, 'peak after the anneal'); near(annealed.junction, 466.2, 0.002, 'junction after the anneal in nm');
});

test('the profile holds the whole dose, and the junction is where it falls to the substrate doping', () => {
  const substrate = M.substrateDoping(10), p = M.profile({ keV: 100, dose: 1e15, Dt: M.diffusivity(950) * 1800, substrate });
  let sum = 0; for (let nm = -400; nm < 1500; nm += 1) sum += p.at(nm + 0.5) * 1e-7;
  near(sum, 1e15, 0.001, 'dose under the curve');
  near(p.at(p.junction), substrate, 1e-6, 'concentration at the junction');
  assert.ok(p.junction > p.range && p.surface < p.peak);
  assert.equal(M.profile({ keV: 100, dose: 1e9, substrate }).junction, 0, 'too little dose makes no junction');
});

test('the anneal spreads the profile: the peak falls, the surface fills up and the junction moves deeper', () => {
  const substrate = M.substrateDoping(10), before = M.profile({ keV: 80, dose: 1e15, substrate }), after = M.profile({ keV: 80, dose: 1e15, Dt: M.diffusivity(1000) * 1800, substrate });
  assert.equal(before.spread, before.straggle);
  assert.ok(after.peak < before.peak && after.surface > before.surface && after.junction > before.junction + 50, `${before.junction.toFixed(0)} -> ${after.junction.toFixed(0)} nm`);
  near(after.spread ** 2 - before.straggle ** 2, 2 * M.diffusivity(1000) * 1800 * 1e14, 1e-9, 'added variance 2 D t');
});

test('oxide left in a window moves the profile up by the silicon that stops as much', () => {
  const substrate = M.substrateDoping(10), open = M.profile({ keV: 100, dose: 1e15, substrate }), screened = M.profile({ keV: 100, dose: 1e15, substrate, screen: 60 });
  const shift = 60 * M.range(100).projected / M.range(100, 'oxide').projected;
  near(open.junction - screened.junction, shift, 1e-9, 'junction shift in nm'); assert.ok(shift > 60 && shift < 70);
  near(screened.surface, open.at(shift), 1e-9, 'surface concentration under the screen');
  const blocked = M.profile({ keV: 40, dose: 1e14, substrate, screen: 400 });
  assert.equal(blocked.junction, 0); assert.ok(blocked.top < substrate);
});

test('the implanter counts the dose, anneals, and the junction is measured', () => {
  const sim = M.create({ wafer: { oxide: 500, windows: true, left: 0, resistivity: 10 } }), s = sim.state;
  assert.equal(sim.setControl('anneal', true), false, 'nothing to anneal yet'); assert.equal(sim.now(), null);
  sim.setControl('energy', 62); sim.setControl('dose', 15.04); sim.setControl('temperature', 951); sim.setControl('minutes', 30.4);
  assert.deepEqual(s.controls, { field: M.fieldFor(30.974), energy: 60, dose: 15, temperature: 950, minutes: 30 }, 'the analyser starts on the P+ peak');
  near(M.implantSeconds(1e15), 113.3, 0.01, 'seconds for 1e15 per cm2 at 1 mA on a 300 mm wafer');
  const planned = sim.outlook();
  assert.equal(sim.setControl('implant', true), true); run(sim, 50);
  assert.ok(s.beam && s.phase === 'implanting'); near(s.counted, 1e15 * 50 / 113.27, 0.01, 'dose counted after 50 s'); near(sim.now().peak, sim.outcome({ keV: 60, dose: s.counted }).peak, 1e-9, 'the wafer holds what was counted');
  sim.setControl('energy', 150);                                 // the dial turned during the implant does not change this wafer
  run(sim, 70); assert.equal(s.phase, 'implanted'); assert.equal(s.counted, 1e15); assert.equal(sim.setControl('implant', true), false, 'one implant per wafer');
  near(sim.outlook().junction, planned.junction, 1e-9, 'the outlook still counts the anneal on the dials');
  assert.equal(sim.setControl('anneal', true), true); run(sim, 904); assert.equal(s.hot, 950);
  near(s.Dt, M.diffusivity(950) * 900, 1e-9, 'diffusion after 15 hot minutes'); near(sim.outlook().junction, planned.junction, 1e-9, 'half way, the outlook is the same');
  run(sim, 1000); assert.equal(s.phase, 'done'); assert.equal(s.hot, 25);
  const expected = M.profile({ keV: 60, dose: 1e15, Dt: M.diffusivity(950) * 1800, substrate: sim.substrate });
  near(s.result.junction, expected.junction, 1e-9, 'junction'); near(s.result.junction, planned.junction, 1e-9, 'as the outlook said'); assert.equal(s.result.keV, 60);
  assert.deepEqual(s.result.anneals, [{ celsius: 950, minutes: 30 }]);
  assert.ok(s.result.masked && s.result.reached && s.result.surface >= C.spec.surface && s.result.ok, JSON.stringify({ junction: s.result.junction, surface: s.result.surface }));
});

test('with the dials untouched the wafer misses the run sheet, and a second anneal adds to the first', () => {
  const sim = M.create({}), s = sim.state;
  sim.setControl('implant', true); run(sim, 30); sim.setControl('anneal', true); run(sim, 700);
  assert.equal(s.phase, 'done'); assert.equal(s.result.ok, false); assert.ok(s.result.surface < C.spec.surface, 'the surface concentration is too low for the contact');
  const first = s.result.junction;
  sim.setControl('temperature', 1000); sim.setControl('minutes', 20); assert.equal(sim.setControl('anneal', true), true); assert.equal(s.result, null);
  run(sim, 1300); assert.equal(s.phase, 'done'); assert.equal(s.anneals.length, 2);
  near(s.Dt, M.diffusivity(900) * 600 + M.diffusivity(1000) * 1200, 1e-9, 'the diffusion of both anneals'); assert.ok(s.result.junction > first + 30);
});

test('a thin oxide lets a fast implant through, a bare wafer is doped all over, and oxide left in the window is in the way', () => {
  const thin = M.create({ wafer: { oxide: 150, windows: true, left: 0, resistivity: 10 } });
  assert.equal(thin.outcome({ keV: 150, dose: 1e15 }).masked, false); assert.equal(thin.outcome({ keV: 20, dose: 1e15 }).masked, true);
  const standard = M.create({});
  assert.equal(standard.outcome({ keV: 100, dose: 1e15 }).masked, true); assert.equal(standard.outcome({ keV: 200, dose: 1e16 }).masked, false, 'even 500 nm lets the tail of a 200 keV implant through');
  const bare = M.create({ wafer: { oxide: 0, windows: false, left: 0, resistivity: 10 } }).outcome({ keV: 60, dose: 1e15 });
  assert.ok(!bare.masked && bare.reached && bare.share === 1);
  const whole = M.create({ wafer: { oxide: 500, windows: false, left: 0, resistivity: 10 } }).outcome({ keV: 60, dose: 1e15 });
  assert.ok(whole.masked && !whole.reached, 'without windows nothing reaches the silicon');
  const screened = M.create({ wafer: { oxide: 500, windows: true, left: 300, resistivity: 10 } }).outcome({ keV: 60, dose: 1e15 });
  assert.ok(!screened.reached, '300 nm left in the window stops a 60 keV implant');
});

test('the analyser passes m/q = e B² rho² / 2V: P+ at 0.347 T with 30 kV of extraction and a 0.40 m bend', () => {
  const expected = Math.sqrt(2 * 30.974 * 1.66053906660e-27 * 30000 / 1.602176634e-19) / 0.4;           // T, from B rho = sqrt(2 m V / q)
  near(M.fieldFor(30.974), expected, 1e-12, 'field for P+'); near(expected, 0.34696, 1e-4, 'by hand');
  near(M.massAt(M.fieldFor(61.948)), 61.948, 1e-12, 'and back');
  near(M.fieldFor(30.974 / 2) / M.fieldFor(30.974), Math.SQRT1_2, 1e-12, 'a doubly charged ion needs 1/sqrt 2 of the field');
});

test('on the P+ peak the beam is phosphorus ions alone; half way to PH+ little passes; a scan shows P+ as the tallest peak near 31', () => {
  const beam = M.beamAt(M.fieldFor(30.974)), total = beam.reduce((sum, ion) => sum + ion.current, 0);
  near(total, 1e-3, 1e-4, 'A on the P+ peak'); assert.ok(beam.find(ion => ion.name === 'P⁺').current / total > 0.9999);
  assert.ok(M.beamCurrent(M.fieldFor((30.974 + 31.982) / 2)) < 0.15 * total, 'between the peaks');
  assert.deepEqual(M.ionsAt(M.fieldFor(31.982)).map(ion => ion.name), ['PH⁺']);
  const top = M.spectrum().filter(p => p.mass > 25 && p.mass < 40).reduce((a, b) => (b.current > a.current ? b : a));
  assert.ok(Math.abs(top.mass - 30.974) < 0.05, `the tallest peak near 31 is P+: ${top.mass}`);
});

test('what each ion carries: PH+ one atom at 31/32 of the energy, P2+ two atoms at half, doubly charged P one atom at twice', () => {
  const at = mq => M.delivered(M.fieldFor(mq), 60, 1e15)[0];
  const ph = at(31.982), p2 = at(61.948), pp = at(30.974 / 2);
  near(ph.keV, 60 * 30.974 / 31.982, 1e-9, 'PH+, keV per atom'); near(ph.dose, 1e15, 1e-6, 'PH+, atoms per cm2');
  near(p2.keV, 30, 1e-9, 'P2+, keV per atom'); near(p2.dose, 2e15, 1e-6, 'P2+: two atoms per counted charge');
  near(pp.keV, 120, 1e-9, 'P to the 2+, keV'); near(pp.dose, 5e14, 1e-6, 'one atom per two counted charges');
  assert.deepEqual(M.delivered(M.fieldFor(1.008), 60, 1e15), [], 'hydrogen carries no phosphorus');
});

test('a mass scan sweeps the magnet in 8 s and records the beam; then the magnet is back on its dial and must be put on a peak', () => {
  const sim = M.create({ field: 0.2 }), s = sim.state;
  assert.ok(s.current < C.beam.least); assert.equal(sim.setControl('implant', true), false, 'no beam to implant with');
  assert.equal(sim.setControl('scan', true), true); run(sim, 4);
  assert.ok(s.scan && s.spectrum.length > 100 && s.field > 0.25 && s.field < 0.40, `${s.field}`);
  assert.equal(sim.setControl('field', 0.3), false, 'not during a scan'); assert.equal(sim.setControl('implant', true), false);
  run(sim, 5);
  assert.ok(!s.scan && s.spectrum.length === M.spectrum().length && s.field === 0.2);
  assert.equal(sim.setControl('field', M.fieldFor(30.974)), true); run(sim, 1); near(s.current, 1e-3, 0.01, 'A on the peak');
  assert.equal(sim.setControl('implant', true), true); assert.equal(sim.setControl('field', 0.3), false, 'not during the implant');
});

test('tuned to the wrong peak the wafer gets the wrong implant: P2+ goes in at half the energy with twice the phosphorus, hydrogen leaves no junction', () => {
  const implant = mq => {
    const sim = M.create({ wafer: { oxide: 500, windows: true, left: 0, resistivity: 10 }, field: M.fieldFor(mq) }), s = sim.state;
    for (const [name, value] of [['energy', 60], ['dose', 15], ['temperature', 950], ['minutes', 30]]) sim.setControl(name, value);
    assert.equal(sim.setControl('implant', true), true);
    while (s.phase === 'implanting') sim.step(5);
    sim.setControl('anneal', true); while (s.phase === 'annealing') sim.step(5);
    return s.result;
  };
  const right = implant(30.974), molecule = implant(61.948), hydrogen = implant(1.008), Dt = M.diffusivity(950) * 1800;
  near(right.junction, M.profile({ keV: 60, dose: 1e15, Dt, substrate: M.substrateDoping(10) }).junction, 1e-6, 'P+: the junction as before');
  near(molecule.junction, M.profile({ keV: 30, dose: 2e15, Dt, substrate: M.substrateDoping(10) }).junction, 1e-6, 'P2+: 2e15 atoms at 30 keV');
  assert.ok(molecule.surface > right.surface, 'more phosphorus nearer the surface');
  assert.ok(!hydrogen.reached && !hydrogen.ok && hydrogen.ions[0].name === 'H⁺');
});
