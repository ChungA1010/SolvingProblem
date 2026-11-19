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

test('applying a process does not change the wafer it was given', () => {
  const before = F.arriving(3), copy = JSON.parse(JSON.stringify(before));
  F.apply('etch', before);
  assert.deepEqual(before, copy);
});
