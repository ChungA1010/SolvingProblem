// Route of the process lab (dist/process-lab/flow-model.js): the eight processes, where a run can start, and how one
// process's result reaches the next.
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../dist/process-lab/flow-model.js');

const finish = run => { while (!run.finished) F.complete(run); return run; };

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

test('a standard run ends with every die tested good and packaged', () => {
  const run = finish(F.createRun('wafer'));
  assert.equal(run.records.length, 8); assert.equal(run.at, 8);
  assert.ok(F.DIE_COUNT > 100 && F.DIE_COUNT < 200, `${F.DIE_COUNT} dies of 20 mm on a 300 mm wafer`);
  assert.deepEqual(run.wafer.tested, { total: F.DIE_COUNT, good: F.DIE_COUNT, reason: null });
  assert.equal(run.wafer.packaged.chips, F.DIE_COUNT);
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
  const IM = require('../dist/process-lab/implant-model.js');
  assert.deepEqual(F.SPEC.junction, { ...IM.constants.spec.junction, surface: IM.constants.spec.surface }, 'the run sheet and the implanter agree on the target');
  const good = F.createRun('deposition'), record = F.complete(good, { depth: 284, surface: 1.66e19, masked: true, how: 'P⁺ 60 keV' });
  assert.ok(record.ok && record.by === 'operator' && /284 nm/.test(record.text) && /1\.7×10¹⁹/.test(record.text) && /장벽막 30 nm/.test(record.text) && /60 keV/.test(record.text), record.text);
  assert.deepEqual(good.wafer.junction, { depth: 284, surface: 1.66e19, species: 'P' }); assert.equal(good.wafer.liner, 30);
  finish(good); assert.equal(good.wafer.tested.good, F.DIE_COUNT);

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

test('numbers are written as a power of ten', () => {
  assert.equal(F.sci(1.66e19), '1.7×10¹⁹'); assert.equal(F.sci(9.96e14), '1.0×10¹⁵'); assert.equal(F.sci(3.2e-15), '3.2×10⁻¹⁵'); assert.equal(F.sci(0), '0');
});

test('applying a process does not change the wafer it was given', () => {
  const before = F.arriving(3), copy = JSON.parse(JSON.stringify(before));
  F.apply('etch', before);
  assert.deepEqual(before, copy);
});
