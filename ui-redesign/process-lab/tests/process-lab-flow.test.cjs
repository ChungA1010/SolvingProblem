// Route of the process lab (../flow-model.js): the eight processes, where a run can start, and how one
// process's result reaches the next.
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../flow-model.js');

const finish = run => { while (!run.finished) F.complete(run); return run; };
const GOOD = F.defects(1).filter(hit => !hit).length;            // chips of lot 1 without a killer defect

test('the route is the eight processes in their usual order', () => {
  assert.deepEqual(F.STEPS.map(step => step.id), ['wafer', 'oxidation', 'photo', 'etch', 'deposition', 'metal', 'eds', 'package']);
  assert.deepEqual(F.STEPS.map(step => step.name), ['웨이퍼 제조', '산화', '포토', '식각', '증착·이온주입', '금속배선', 'EDS', '패키징']);
  for (const step of F.STEPS) assert.ok(step.does.length > 10, step.id);
});

test('a run can start at any process and receives a wafer finished up to there by the standard recipe', () => {
  for (const [index, step] of F.STEPS.entries()) {
    const run = F.createRun(step.id);
    assert.equal(run.at, index); assert.equal(run.records.length, index);
    assert.ok(run.records.every(record => record.before && record.by === 'standard'));
    assert.deepEqual(run.wafer, F.arriving(index));
  }
  const atEtch = F.createRun('etch').wafer;
  assert.equal(atEtch.oxide, 500); assert.equal(atEtch.resist.opening, 1000); assert.equal(atEtch.window, null);
  assert.throws(() => F.createRun('cmp'));
});

test('a standard run ends with every chip tested, the ones without a defect good, and those packaged', () => {
  const run = finish(F.createRun('wafer'));
  assert.equal(run.records.length, 8); assert.equal(run.at, 8);
  assert.ok(F.DIE_COUNT > 100 && F.DIE_COUNT < 200, `${F.DIE_COUNT} dies of 20 mm on a 300 mm wafer`);
  assert.equal(run.wafer.tested.total, F.DIE_COUNT); assert.equal(run.wafer.tested.good, GOOD); assert.equal(run.wafer.tested.reason, null);
  assert.equal(run.wafer.tested.dies.length, F.DIE_COUNT); assert.equal(run.wafer.tested.dies.filter(die => die.good).length, GOOD); assert.ok(run.wafer.tested.dies.every(die => die.good || die.bin === 'defect'));
  assert.match(run.records.at(-2).text, new RegExp(`양품 ${GOOD}개`)); assert.equal(run.records.at(-2).ok, true, 'defects are not a fault of the run');
  assert.equal(run.wafer.packaged.chips, GOOD);
  assert.equal(run.wafer.resist, null, 'the resist is stripped after the etch');
  assert.ok(run.wafer.window.open && run.wafer.junction && run.wafer.metal.planar);
  assert.equal(F.complete(run), null, 'nothing after the last process');
});

test('every die sits inside the usable area of the wafer', () => {
  const reach = F.STANDARD.substrate.diameter / 2 - F.STANDARD.edge, half = F.STANDARD.die / 2;
  for (const die of F.dies()) assert.ok(Math.hypot(Math.abs(die.x) + half, Math.abs(die.y) + half) <= reach);
});

test('the operator\'s oxide goes onto the wafer and is judged against the run sheet', () => {
  const run = F.createRun('oxidation');
  const record = F.complete(run, { mean: 512.4, how: '습식 1,000 °C 90분' });
  assert.equal(record.by, 'operator'); assert.equal(record.ok, true);
  assert.match(record.text, /512 nm/); assert.match(record.text, /습식/);
  assert.equal(run.wafer.oxide, 512.4);
  assert.equal(F.apply('oxidation', F.arriving(1), { mean: 560 }).record.ok, false);
});

test('an oxide thicker than the standard etch can clear leaves the windows closed, and the chips fail at EDS', () => {
  const run = F.createRun('oxidation');
  F.complete(run, { mean: 680 });
  finish(run);
  const byStep = Object.fromEntries(run.records.map(record => [record.step, record]));
  assert.equal(byStep.etch.ok, false); assert.equal(run.wafer.window.open, false); assert.equal(run.wafer.window.left, 80);
  assert.equal(run.wafer.junction, null);
  assert.equal(run.wafer.tested.good, 0); assert.match(byStep.eds.text, /모두 불량/);
  assert.equal(run.wafer.packaged.chips, 0); assert.equal(byStep.package.ok, false);
});

test('an oxide thinner than standard is cleared early and the over-etch bites into the silicon', () => {
  const run = F.createRun('oxidation');
  F.complete(run, { mean: 300 });
  F.complete(run); F.complete(run);
  assert.ok(run.wafer.window.open);
  assert.equal(run.wafer.window.siliconLoss, (F.STANDARD.etchReach - 300) / F.STANDARD.selectivity);
});

test('the operator\'s resist pattern decides the window the etch makes', () => {
  const printed = F.createRun('photo');
  const record = F.complete(printed, { thickness: 1000, opening: 1030, how: '4,000 rpm' });
  assert.equal(record.by, 'operator'); assert.equal(record.ok, true); assert.match(record.text, /1,030 nm/);
  F.complete(printed);
  assert.equal(printed.wafer.window.width, 1030); assert.ok(printed.wafer.window.open); assert.equal(printed.wafer.resist, null);
  assert.equal(F.apply('photo', F.arriving(2), { thickness: 1000, opening: 1100 }).record.ok, false, 'outside 1,000 ± 50 nm');
});

test('a resist that did not open leaves the oxide whole, and the chips fail at EDS', () => {
  const run = F.createRun('photo');
  assert.equal(F.complete(run, { thickness: 1200, opening: 0 }).ok, false);
  finish(run);
  assert.equal(run.wafer.window.open, false); assert.equal(run.wafer.oxide, 500); assert.equal(run.wafer.junction, null);
  assert.equal(run.wafer.tested.good, 0);
});

test('with no resist left the etch takes the oxide off, the implant goes in everywhere, and the chips fail', () => {
  const run = F.createRun('photo');
  F.complete(run, { thickness: 0, opening: 0 });
  assert.equal(run.wafer.resist, null);
  finish(run);
  assert.equal(run.wafer.oxide, 0); assert.ok(run.wafer.unmasked && run.wafer.junction.everywhere);
  assert.equal(run.wafer.tested.good, 0); assert.match(run.wafer.tested.reason, /전면/);
});

test('the operator\'s etch decides the window: open and shallow passes, closed or dug in does not', () => {
  const good = F.apply('etch', F.arriving(3), { oxide: 500, width: 1030, depth: 500, open: true, left: 0, siliconLoss: 6, how: 'CHF₃' });
  assert.equal(good.record.ok, true); assert.equal(good.record.by, 'operator'); assert.equal(good.wafer.resist, null);
  assert.deepEqual(good.wafer.window, { width: 1030, depth: 500, open: true, left: 0, siliconLoss: 6 });
  assert.equal(F.apply('etch', F.arriving(3), { oxide: 500, width: 1030, depth: 500, open: true, left: 0, siliconLoss: 60 }).record.ok, false, 'too much silicon lost');
  assert.equal(F.apply('etch', F.arriving(3), { oxide: 500, width: 1300, depth: 500, open: true, left: 0, siliconLoss: 5 }).record.ok, false, 'window too wide');
  const closed = F.createRun('etch'); F.complete(closed, { oxide: 500, width: 1010, depth: 300, open: false, left: 200, siliconLoss: 0 }); finish(closed);
  assert.equal(closed.wafer.junction, null); assert.equal(closed.wafer.tested.good, 0);
  const gone = F.createRun('etch'); F.complete(gone, { oxide: 0, stripped: true, width: 0, depth: 0, open: false, left: 0, siliconLoss: 0 }); finish(gone);
  assert.ok(gone.wafer.unmasked && gone.wafer.junction.everywhere); assert.equal(gone.wafer.tested.good, 0);
});

test('the operator\'s implant decides the junction: in the windows only, deep enough and doped enough at the surface', () => {
  const IM = require('../implant-model.js');
  assert.deepEqual(F.SPEC.junction, { ...IM.constants.spec.junction, surface: IM.constants.spec.surface }, 'the run sheet and the implanter agree on the target');
  const good = F.createRun('deposition'), record = F.complete(good, { depth: 284, surface: 1.66e19, masked: true, how: 'P⁺ 60 keV' });
  assert.ok(record.ok && record.by === 'operator' && /284 nm/.test(record.text) && /1\.7×10¹⁹/.test(record.text) && /장벽막 30 nm/.test(record.text) && /60 keV/.test(record.text), record.text);
  assert.deepEqual(good.wafer.junction, { depth: 284, surface: 1.66e19, species: 'P' }); assert.equal(good.wafer.liner, 30);
  finish(good); assert.equal(good.wafer.tested.good, GOOD);

  const deep = F.apply('deposition', F.arriving(4), { depth: 420, surface: 3e19, masked: true });
  assert.equal(deep.record.ok, false, 'a junction off the target depth is marked on the sheet');
  const weak = F.createRun('deposition'); assert.equal(F.complete(weak, { depth: 322, surface: 1.2e17, masked: true }).ok, false); finish(weak);
  assert.equal(weak.wafer.tested.good, 0); assert.match(weak.wafer.tested.reason, /접촉 저항/);
  const leaked = F.createRun('deposition'); assert.equal(F.complete(leaked, { depth: 700, surface: 5e19, masked: false }).ok, false); finish(leaked);
  assert.ok(leaked.wafer.junction.everywhere && leaked.wafer.junction.leaked); assert.equal(leaked.wafer.tested.good, 0); assert.match(leaked.wafer.tested.reason, /뚫고/);
  const none = F.createRun('deposition'); F.complete(none, { depth: 0, surface: 1e12, masked: true }); finish(none);
  assert.equal(none.wafer.junction, null); assert.equal(none.wafer.tested.good, 0); assert.match(none.wafer.tested.reason, /접합이 생기지/);

  const closed = F.apply('etch', F.arriving(3), { oxide: 500, width: 1000, depth: 460, open: false, left: 40, siliconLoss: 0 }).wafer;      // a thin oxide left in the window: the ions pass it, the metal does not
  const through = F.apply('deposition', closed, { depth: 250, surface: 2e19, masked: true });
  assert.ok(through.wafer.junction && !through.wafer.junction.everywhere); assert.equal(through.record.ok, false); assert.match(through.record.text, /산화막이 남음/);
  assert.match(F.apply('eds', F.apply('metal', through.wafer).wafer).record.text, /접촉 창이 열리지/);
  const bare = F.implanted({ ...F.arriving(4), oxide: 0, window: null, unmasked: true }, { depth: 300, surface: 2e19, masked: false }).wafer.junction;
  assert.ok(bare.everywhere && !bare.leaked, 'with no oxide at all it is the missing mask, not a leak');
});

test('the operator\'s plating decides the metal: enough to fill and cover the windows, not more than the polish clears', () => {
  const PL = require('../plating-model.js');
  assert.deepEqual({ target: F.SPEC.metal.target, tolerance: F.SPEC.metal.tolerance }, PL.constants.spec, 'the run sheet and the plating cell agree on the target');
  assert.deepEqual(F.arriving(6).metal, { thickness: 800, over: 0, dishing: 20, planar: true }, 'the standard recipe plates 800 nm and the polish over-polishes by 80 nm');
  const good = F.createRun('metal'), record = F.complete(good, { thickness: 790, burnt: false, how: '30 rpm' });
  assert.ok(record.ok && record.by === 'operator' && /790 nm/.test(record.text) && /접시 파임 23 nm/.test(record.text) && /30 rpm/.test(record.text), record.text);
  assert.deepEqual(good.wafer.metal, { thickness: 790, over: 0, dishing: 22.5, planar: true }); finish(good); assert.equal(good.wafer.tested.good, GOOD);

  const thick = F.createRun('metal'); assert.equal(F.complete(thick, { thickness: 1000, burnt: false }).ok, false); finish(thick);
  assert.equal(thick.wafer.metal.over, 120); assert.equal(thick.wafer.tested.good, 0); assert.match(thick.wafer.tested.reason, /산화막 위에 남아/);
  const thin = F.createRun('metal'); assert.equal(F.complete(thin, { thickness: 600, burnt: false }).ok, false); finish(thin);
  assert.equal(thin.wafer.metal.dishing, 70); assert.equal(thin.wafer.metal.planar, false); assert.equal(thin.wafer.tested.good, GOOD, 'dished, but the chips still work');
  const short = F.createRun('metal'); F.complete(short, { thickness: 300, burnt: false }); finish(short);
  assert.equal(short.wafer.metal.dishing, 205 + 145, 'the window was 205 nm short of full, and the polish took 145 nm more'); assert.equal(short.wafer.tested.good, GOOD, 'a window a third full still conducts');
  const bare = F.createRun('metal'); F.complete(bare, { thickness: 60, burnt: false }); finish(bare);
  assert.equal(bare.wafer.metal.dishing, 505, 'nothing is left in the window'); assert.equal(bare.wafer.tested.good, 0); assert.match(bare.wafer.tested.reason, /거의 남지 않아/);
  const burnt = F.createRun('metal'); assert.equal(F.complete(burnt, { thickness: 800, burnt: true }).ok, false); finish(burnt);
  assert.equal(burnt.wafer.tested.good, 0); assert.match(burnt.wafer.tested.reason, /타서/);
  const none = F.createRun('metal'); assert.equal(F.complete(none, { thickness: 0, burnt: false }).ok, false); finish(none);
  assert.equal(none.wafer.metal, null); assert.equal(none.wafer.tested.good, 0); assert.match(none.wafer.tested.reason, /금속이 없어/);
});

test('killer defects follow the Poisson yield model and are fixed by the lot', () => {
  assert.deepEqual(F.defects(7), F.defects(7)); assert.notDeepEqual(F.defects(7), F.defects(8));
  assert.ok(GOOD > F.DIE_COUNT * 0.75 && GOOD < F.DIE_COUNT * 0.95, `${GOOD} of ${F.DIE_COUNT}`);
  const dies = F.dies(), R = 150; let inner = 0, innerHit = 0, outer = 0, outerHit = 0;
  for (let lot = 1; lot <= 300; lot++) F.defects(lot).forEach((hit, i) => { const far = Math.hypot(dies[i].x, dies[i].y) / R > 0.7; if (far) { outer++; outerHit += hit; } else { inner++; innerHit += hit; } });
  const centre = 1 - Math.exp(-4 * 0.03);                       // a 4 cm2 chip at 0.03 defects per cm2
  assert.ok(innerHit / inner > centre * 0.95 && innerHit / inner < centre * 1.25, `inner chips hit: ${(innerHit / inner).toFixed(3)} against ${centre.toFixed(3)} at the centre`);
  assert.ok(outerHit / outer > innerHit / inner * 1.3, 'more defects toward the edge');
  assert.equal(F.createRun('eds', 7).wafer.lot, 7); assert.equal(finish(F.createRun('eds', 7)).wafer.tested.good, F.defects(7).filter(hit => !hit).length);
});

test('the operator\'s probing decides which chips count as good', () => {
  const dies = F.defects(1).map(hit => hit ? { good: false, bin: 'leak', text: '누설' } : { good: true, bin: 'good' });
  const run = F.createRun('eds'), record = F.complete(run, { dies, missed: 0, how: '오버드라이브 50 µm' });
  assert.ok(record.ok && record.by === 'operator' && new RegExp(`양품 ${GOOD}개`).test(record.text) && /불량: 누설/.test(record.text) && /50 µm/.test(record.text), record.text);
  assert.equal(run.wafer.tested.good, GOOD); assert.equal(run.wafer.tested.dies, dies); finish(run); assert.equal(run.wafer.packaged.chips, GOOD);
  const poor = F.createRun('eds'), lost = dies.map((die, i) => i < 10 && die.good ? { good: false, bin: 'contact' } : die), missed = lost.filter((die, i) => !die.good && dies[i].good).length;
  const flagged = F.complete(poor, { dies: lost, missed });
  assert.equal(flagged.ok, false); assert.match(flagged.text, /바늘이 제대로 닿지 않아/); assert.equal(poor.wafer.tested.good, GOOD - missed);
  const dead = F.createRun('deposition'); F.complete(dead, { depth: 700, surface: 5e19, masked: false }); F.complete(dead);
  const all = F.complete(dead, { dies: dies.map(() => ({ good: false, bin: 'leak' })), missed: 0 });
  assert.equal(all.ok, false); assert.match(all.text, /모두 불량 · 이온이 산화막을 뚫고/);
});

test('the operator\'s wire bonding decides how many of the good chips are finished', () => {
  const run = F.createRun('package'), record = F.complete(run, { chips: GOOD, bonded: GOOD, lost: 0, how: '금선 80 mW' });
  assert.ok(run.finished && record.ok && record.by === 'operator' && new RegExp(`${GOOD}개 완성`).test(record.text) && /80 mW/.test(record.text), record.text);
  assert.deepEqual(run.wafer.packaged, { chips: GOOD, lost: 0 });
  const poor = F.createRun('package'), flagged = F.complete(poor, { chips: GOOD - 7, bonded: GOOD, lost: 7 });
  assert.equal(flagged.ok, false); assert.match(flagged.text, /금선 불량 7개/); assert.deepEqual(poor.wafer.packaged, { chips: GOOD - 7, lost: 7 });
  const none = F.createRun('package'); assert.equal(F.complete(none, { chips: 0, bonded: GOOD, lost: GOOD }).ok, false); assert.equal(none.wafer.packaged.chips, 0);
});

test('the operator\'s crystal decides the wafer: its resistivity, and whether the crystal is free of dislocations', () => {
  const CR = require('../crystal-model.js'), ED = require('../eds-model.js');
  assert.deepEqual(F.SPEC.wafer, { resistivity: CR.constants.spec.resistivity, diameter: CR.constants.spec.diameter }, 'the run sheet and the puller agree on the target');
  const run = F.createRun('wafer'), record = F.complete(run, { resistivity: 9.79, dislocated: false, diameter: 304.3, body: 120, how: '붕소 2.9 mg' });
  assert.ok(record.ok && record.by === 'operator' && /9\.8 Ω·cm/.test(record.text) && /304 mm/.test(record.text) && /2\.9 mg/.test(record.text), record.text);
  assert.deepEqual(run.wafer.substrate, { ...F.STANDARD.substrate, resistivity: 9.79 }); finish(run); assert.equal(run.wafer.tested.good, GOOD);
  const plain = F.createRun('wafer'), far = F.complete(plain, { resistivity: 13280, dislocated: false, diameter: 305, body: 120 });
  assert.equal(far.ok, false); assert.match(far.text, /13,280 Ω·cm/);
  const rough = F.createRun('wafer'); assert.equal(F.complete(rough, { resistivity: 10, dislocated: true, diameter: 305, body: 120 }).ok, false); finish(rough);
  assert.ok(rough.wafer.substrate.dislocated); assert.equal(rough.wafer.tested.good, 0); assert.match(rough.wafer.tested.reason, /전위/);
  const truth = ED.truths({ wafer: F.arriving(6), dies: F.dies(), killed: F.defects(1), seed: 5 }), leaky = ED.truths({ wafer: { ...F.arriving(6), substrate: { ...F.STANDARD.substrate, dislocated: true } }, dies: F.dies(), killed: F.defects(1), seed: 5 });
  assert.ok(truth.some(die => die.good) && leaky.every(die => !die.good && die.leak > ED.constants.limits.leakage), 'the prober finds a dislocated wafer leaking on every chip');
  const undoped = ED.truths({ wafer: { ...F.arriving(6), substrate: { ...F.STANDARD.substrate, resistivity: 13280 } }, dies: F.dies(), killed: [], seed: 5 });
  assert.ok(undoped.every(die => !die.good && die.voltage < ED.constants.limits.voltage[0]), 'on an undoped wafer the diode\'s forward voltage is too low');
});

test('the wafer test by the standard recipe says of a wafer\'s resistivity what the prober says: far from 10 ohm cm every chip fails on forward voltage', () => {
  const ED = require('../eds-model.js'), probe = { touching: true, resistance: ED.probeResistance(50) };
  // not looked at: 0.11 to 0.12 and 250 to 295 ohm cm, the two ends of the range, where the prober itself passes some chips and fails others
  for (const resistivity of [0.05, 0.09, 0.105, 0.13, 0.2, 1, 2.9, 9.8, 10, 30, 100, 200, 240, 300, 400, 1000, 13280]) {
    const wafer = { ...F.arriving(6), substrate: { ...F.STANDARD.substrate, resistivity } };
    const probed = ED.truths({ wafer, dies: F.dies(), killed: [], seed: 5 }).map(truth => ED.evaluate(truth, probe)), good = probed.filter(die => die.good).length;
    assert.ok(good === 0 || good === probed.length, `at ${resistivity} ohm cm the prober is of one mind (${good} good)`);
    const standard = F.apply('eds', wafer);
    assert.equal(standard.wafer.tested.good > 0, good > 0, `${resistivity} ohm cm: the standard test passes ${standard.wafer.tested.good}, the prober ${good}`);
    assert.equal(standard.record.ok, good > 0);
    if (!good) { assert.ok(probed.every(die => die.bin === 'voltage')); assert.match(standard.wafer.tested.reason, /비저항/); }
  }
  // the wafer of an operator who put no boron in: the run sheet at EDS, and what packaging then gets
  const run = F.createRun('wafer'); F.complete(run, { resistivity: 13280, dislocated: false, diameter: 305, body: 120 }); finish(run);
  assert.equal(run.wafer.tested.good, 0); assert.match(run.wafer.tested.reason, /비저항/); assert.equal(run.wafer.packaged.chips, 0);
});

test('with the prober\'s model at hand, the wafer test by the standard recipe finds what the prober finds, chip for chip, whatever the wafer', () => {
  const ED = require('../eds-model.js');
  /** A run brought to the wafer test: `start` done by hand with `result`, everything else by the standard recipe. */
  const upTo = (start, result, lot) => { const run = F.createRun(start, lot); F.complete(run, result); while (run.at < 6) F.complete(run); return run; };
  const cases = {
    'all by the standard recipe': upTo('wafer', undefined, 3),
    'no boron in the crystal': upTo('wafer', { resistivity: 13280, dislocated: false, diameter: 305, body: 120 }, 7),
    'a junction far too shallow': upTo('deposition', { depth: 60, surface: 3e19, peak: 3e19, masked: true }, 11),
    'silicon etched away deeper than the junction': upTo('etch', { oxide: 500, width: 1030, depth: 500, open: true, opened: 1, left: 0, siliconLoss: 320 }, 16491),
    'the surface just at the doping the run sheet asks for': upTo('deposition', { depth: 300, surface: F.SPEC.junction.surface, peak: 2e19, masked: true }, 5),
    'the surface a little under it': upTo('deposition', { depth: 300, surface: 0.93e19, peak: 2e19, masked: true }, 5),
    'a wafer far from its resistivity, where the prober passes some chips': upTo('wafer', { resistivity: 270, dislocated: false, diameter: 305, body: 120 }, 5),
    'windows shut at the centre': upTo('etch', { oxide: 500, width: 1030, depth: 500, open: false, opened: 0.5, left: 30, siliconLoss: 4, profile: { left: Array.from({ length: 31 }, (_, j) => Math.max(0, 30 - 2 * j)), siliconLoss: Array.from({ length: 31 }, () => 4), width: Array.from({ length: 31 }, () => 1030) } }, 9),
  };
  F.setTester(ED.standardTest);
  try {
    for (const [name, run] of Object.entries(cases)) {
      const wafer = run.wafer, probed = ED.truths({ wafer, dies: F.dies(), killed: F.defects(wafer.lot), seed: wafer.lot }), standard = F.apply('eds', wafer), found = standard.wafer.tested;
      assert.deepEqual(found.dies.map(die => die.good), probed.map(truth => truth.good), `${name}: the standard test and the prober, chip by chip`);
      assert.equal(found.good, probed.filter(truth => truth.good).length); assert.equal(standard.record.ok, found.good > 0);
      if (!found.good) { assert.ok(found.reason && found.reason.length > 4, `${name}: every chip failed, and the run sheet says of what`); assert.match(standard.record.text, /모두 불량/); }
      else assert.equal(found.reason, null);
    }
    assert.match(F.apply('eds', cases['no boron in the crystal'].wafer).wafer.tested.reason, /비저항/);
    assert.match(F.apply('eds', cases['a junction far too shallow'].wafer).wafer.tested.reason, /누설/);
    assert.equal(F.apply('eds', cases['the surface just at the doping the run sheet asks for'].wafer).wafer.tested.good, F.defects(5).filter(hit => !hit).length, 'at the run sheet\'s limit no chip is lost to it');
  } finally { F.setTester(null); }
  assert.equal(F.apply('eds', cases['a junction far too shallow'].wafer).wafer.tested.good > 0, true, 'without the prober\'s model the test goes by the faults it knows by name');
});

test('a process passed by the standard recipe is judged by its run sheet like one done by hand', () => {
  const all = finish(F.createRun('wafer'));
  assert.deepEqual(all.records.map(record => record.ok), Array(8).fill(true), 'the standard wafer passes every row, and every row says so');
  // an oxide grown far too thin by hand: the standard etch, a fixed time, goes on into the silicon past its limit
  const thin = F.createRun('oxidation'); F.complete(thin, { mean: 100 }); F.complete(thin);
  const etched = F.complete(thin);
  assert.equal(etched.step, 'etch'); assert.equal(etched.by, 'standard'); assert.equal(thin.wafer.window.siliconLoss, 25); assert.equal(etched.ok, false); assert.match(etched.text, /25 nm/); assert.match(etched.text, /20 nm 이하/);
});

test('a run can be taken back to a process it has been through, keeping what came before it', () => {
  const run = F.createRun('oxidation');
  F.complete(run, { mean: 510 }); const atPhoto = F.snapshot(run);
  F.complete(run); F.complete(run); assert.equal(run.at, 4); assert.ok(run.wafer.window);
  F.restore(run, atPhoto);
  assert.equal(run.at, 2); assert.equal(run.records.length, 2); assert.equal(run.wafer.oxide, 510); assert.equal(run.wafer.resist, null); assert.equal(run.wafer.window, null);
  F.complete(run, { thickness: 1000, opening: 1010 }); assert.equal(atPhoto.records.length, 2, 'going on does not change the snapshot'); assert.equal(run.wafer.resist.opening, 1010);
  finish(run); assert.ok(run.finished); F.restore(run, atPhoto); assert.equal(run.finished, false); assert.equal(run.at, 2); assert.equal(run.records.length, 2);
});

test('a wafer the operator polished is judged chip by chip on what the polish left', () => {
  const ED = require('../eds-model.js'), dies = F.dies(), killed = F.defects(1);
  const scan = chips => ({ chips, centre: { over: chips[70].over, dishing: chips[70].dishing }, cleared: chips.every(c => c.over <= 1), residue: Math.max(...chips.map(c => c.over)), dishingMax: Math.max(...chips.map(c => c.dishing)), scratches: chips.filter(c => c.scratched).length, ok: chips.every(c => c.over <= 1 && c.dishing <= 50 && !c.scratched) });
  const clean = dies.map(() => ({ over: 0, dishing: 12, scratched: false }));
  const good = F.createRun('metal'), record = F.complete(good, { thickness: 800, burnt: false, polish: scan(clean), how: '연마 100초' });
  assert.ok(record.ok && /연마 뒤 접시 파임 최대 12 nm/.test(record.text) && /연마 100초/.test(record.text), record.text);
  assert.deepEqual(good.wafer.metal.chips, clean.map(chip => ({ ...chip, burnt: false }))); assert.ok(good.wafer.metal.planar && good.wafer.metal.over === 0); finish(good); assert.equal(good.wafer.tested.good, GOOD);

  const ring = dies.map(die => ({ over: Math.hypot(die.x, die.y) > 110 ? 40 : 0, dishing: 12, scratched: false })), outer = ring.filter(c => c.over > 0).length;   // copper left toward the edge
  ring[70] = { over: 0, dishing: 500, scratched: false }; ring[71] = { over: 0, dishing: 12, scratched: true };
  const flawed = F.createRun('metal'), marked = F.complete(flawed, { thickness: 800, burnt: false, polish: scan(ring) });
  assert.equal(marked.ok, false); assert.match(marked.text, /가장 두꺼운 곳에 40 nm 남음/); assert.match(marked.text, /스크래치 1개/); assert.equal(flawed.wafer.metal.planar, false);
  F.complete(flawed);
  const tested = flawed.wafer.tested, bins = bin => tested.dies.filter(die => die.bin === bin).length;
  assert.ok(outer > 20 && bins('residue') === outer && bins('dish') === 1 && bins('scratch') === 1 && tested.reason === null, JSON.stringify({ outer, residue: bins('residue') }));
  assert.equal(tested.good, tested.dies.filter((die, i) => !killed[i] && ring[i].over === 0 && i !== 70 && i !== 71).length); assert.match(flawed.records.at(-1).text, /구리 잔류/);
  const truth = ED.truths({ wafer: flawed.wafer, dies, killed, seed: 5 });
  truth.forEach((t, i) => { if (ring[i].over > 0) assert.ok(!t.good && t.leak >= ED.constants.short, 'copper left on a chip joins it to its neighbours'); });
  assert.ok(truth[71].open && truth[71].scratched && !truth[70].good && truth[70].resistance > 10, 'a scratch cuts the path, deep dishing raises its resistance');
  assert.equal(truth.filter(t => t.good).length, tested.good, 'the prober and the standard test agree on which chips are good');
});

test('numbers are written as a power of ten', () => {
  assert.equal(F.sci(1.66e19), '1.7×10¹⁹'); assert.equal(F.sci(9.96e14), '1.0×10¹⁵'); assert.equal(F.sci(3.2e-15), '3.2×10⁻¹⁵'); assert.equal(F.sci(0), '0');
});

test('applying a process does not change the wafer it was given', () => {
  const before = F.arriving(3), copy = JSON.parse(JSON.stringify(before));
  F.apply('etch', before);
  assert.deepEqual(before, copy);
});

test('the operator\'s plating goes on with its profile: a heavy edge keeps copper under the standard polish, a burnt edge fails its chips', () => {
  const ED = require('../eds-model.js'), N = 31, none = new Array(N).fill(false);
  const profile = (centre, edge) => Array.from({ length: N }, (_, j) => centre + (edge - centre) * (j / (N - 1)) ** 2);   // mean: centre + (edge - centre) / 2
  const even = F.createRun('metal'), record = F.complete(even, { thickness: 802.5, profile: profile(760, 845), scorched: none, burnt: false });
  assert.ok(record.ok && /가운데 760 nm · 가장자리 845 nm/.test(record.text) && /접시 파임 최대 30 nm/.test(record.text), record.text);
  assert.ok(even.wafer.metal.chips.length === F.DIE_COUNT && even.wafer.metal.planar && even.wafer.metal.dishing === 30, 'the centre is dished most: it had the least copper to take off');
  finish(even); assert.equal(even.wafer.tested.good, GOOD, 'every chip clears and works');

  const heavy = F.createRun('metal'), marked = F.complete(heavy, { thickness: 875, profile: profile(800, 950), scorched: none, burnt: false });
  assert.equal(marked.ok, false, 'on average inside the run sheet, at the edge 70 nm over it'); assert.match(marked.text, /칩 \d+개 위에 구리가 남음/);
  F.complete(heavy);
  const dies = F.dies(), tested = heavy.wafer.tested, residue = tested.dies.map(die => die.bin === 'residue');
  assert.ok(residue.filter(Boolean).length > 10 && tested.reason === null, `${residue.filter(Boolean).length} chips`);
  dies.forEach((die, i) => { const r = Math.hypot(die.x, die.y); if (residue[i]) assert.ok(r > 80, `residue on a chip ${r.toFixed(0)} mm out`); if (r < 60) assert.ok(!residue[i]); });

  const scorched = Array.from({ length: N }, (_, j) => j >= N - 4), burnt = F.createRun('metal');              // the outer 15 mm grew above the limit
  const told = F.complete(burnt, { thickness: 802.5, profile: profile(760, 845), scorched, burnt: true });
  assert.equal(told.ok, false); assert.match(told.text, /가장자리가 탐/); assert.ok(!burnt.wafer.metal.burnt, 'not the whole wafer');
  F.complete(burnt);
  const bins = burnt.wafer.tested.dies.filter(die => die.bin === 'burnt').length;
  assert.ok(burnt.wafer.tested.reason === null && bins > 10 && burnt.wafer.tested.good > 100, JSON.stringify({ bins, good: burnt.wafer.tested.good }));
  const truth = ED.truths({ wafer: burnt.wafer, dies, killed: F.defects(1), seed: 5 });
  truth.forEach((t, i) => { if (burnt.wafer.metal.chips[i].burnt) assert.ok(!t.good && t.resistance > ED.constants.limits.resistance, 'burnt copper fails the prober on its resistance'); });
  assert.equal(truth.filter(t => t.good).length, burnt.wafer.tested.good, 'the prober and the standard test agree on which chips are good');

  const all = F.createRun('metal'); F.complete(all, { thickness: 802.5, profile: profile(760, 845), scorched: new Array(N).fill(true), burnt: true }); finish(all);
  assert.equal(all.wafer.tested.good, 0); assert.match(all.wafer.tested.reason, /타서/);
});

test('an etch stopped before the centre opened: the chips there fail as closed windows, and the prober agrees', () => {
  const ET = require('../etch-model.js'), ED = require('../eds-model.js'), f = ET.across(), E = ET.constants.nodes - 1;
  const sim = ET.create({ wafer: { oxide: 500, resist: { thickness: 1000, opening: 1000 } }, seed: 3 });
  sim.setControl('load', true); sim.step(5); sim.setControl('chf3', true); sim.setControl('pressure', 10); sim.setControl('power', 300);
  const stop = Math.round((500 / (64.8 * f[E]) + 500 / (64.8 * f[0])) / 2 * 60);                    // half way between the edge and the centre opening
  for (let t = 0; t < stop; t++) sim.step(1);
  const run = F.createRun('etch'), record = F.complete(run, { ...sim.measure(), how: 'CHF3' });
  assert.ok(!record.ok && /에서만 뚫림/.test(record.text) && run.wafer.window.open && run.wafer.window.profile, record.text);
  finish(run);
  const tested = run.wafer.tested, closed = tested.dies.filter(die => die.bin === 'closed').length;
  assert.ok(tested.reason === null && closed > 20 && tested.good > 20, JSON.stringify({ closed, good: tested.good }));
  F.dies().forEach((die, i) => { if (tested.dies[i].bin === 'closed') assert.ok(Math.hypot(die.x, die.y) < 120, 'closed toward the centre'); });
  const truth = ED.truths({ wafer: run.wafer, dies: F.dies(), killed: F.defects(1), seed: 5 });
  truth.forEach((t, i) => { if (tested.dies[i].bin === 'closed') assert.ok(t.closed && !t.good); });
  assert.equal(truth.filter(t => t.good).length, tested.good, 'the prober and the standard test agree on which chips are good');
});

// ----- a verdict is on the number as it is printed -----

test('a value that reads as the limit is at the limit: the run sheet judges the numbers it prints', () => {
  const S = F.SPEC;
  // resistivity, printed with one decimal: 11.0 is inside 10 +- 1, 11.1 is not
  const crystal = rho => F.apply('wafer', F.arriving(0), { resistivity: rho, diameter: 305, body: 150 }).record;
  assert.equal(crystal(11.04).ok, true); assert.match(crystal(11.04).text, /비저항 11\.0 Ω·cm/);
  assert.equal(crystal(11.06).ok, false); assert.match(crystal(11.06).text, /비저항 11\.1 Ω·cm/);
  assert.equal(crystal(8.96).ok, true); assert.equal(crystal(8.94).ok, false);
  // oxide, printed in whole nm
  const oxide = mean => F.apply('oxidation', F.arriving(1), { mean }).record, top = S.oxide.target + S.oxide.tolerance, bottom = S.oxide.target - S.oxide.tolerance;
  assert.equal(oxide(top + 0.4).ok, true); assert.match(oxide(top + 0.4).text, new RegExp(`산화막 ${top} nm`));
  assert.equal(oxide(top + 0.6).ok, false); assert.equal(oxide(bottom - 0.4).ok, true); assert.equal(oxide(bottom - 0.6).ok, false);
  // the window in the resist
  const photo = opening => F.apply('photo', F.arriving(2), { thickness: 1000, opening }).record.ok, wide = S.opening.target + S.opening.tolerance, narrow = S.opening.target - S.opening.tolerance;
  assert.equal(photo(wide + 0.4), true); assert.equal(photo(wide + 0.6), false); assert.equal(photo(narrow - 0.4), true); assert.equal(photo(narrow - 0.6), false);
  // the junction: its depth in whole nm, the surface concentration with two digits
  const J = S.junction, implant = (depth, surface) => F.implanted(F.arriving(4), { depth, surface, peak: surface, masked: true }).ok;
  assert.equal(implant(J.target + J.tolerance + 0.4, 5e19), true); assert.equal(implant(J.target + J.tolerance + 0.6, 5e19), false);
  assert.equal(implant(J.target, 9.96e18), true, 'it prints as 1.0e19'); assert.equal(implant(J.target, 9.94e18), false, 'it prints as 9.9e18');
  assert.equal(F.sci(9.96e18), F.sci(1e19)); assert.equal(F.readSci(9.96e18), 1e19); assert.equal(F.readSci(9.94e18), 9.9e18);
  assert.equal(F.read(524.5), 525); assert.equal(F.read(10.96, 1), 11); assert.equal(F.read(0.15, 1), Number((0.15).toFixed(1)), 'rounded by the function that prints it');
});
