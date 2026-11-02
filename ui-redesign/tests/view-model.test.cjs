const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../dist/engine.js');
const view = require('../dist/view-model.js');

test('compact numeric display never rounds a small nonzero result into zero', () => {
  assert.equal(view.formatNumber(74.1), '74.10');
  assert.equal(view.formatNumber(.001), '1.000e-3');
  assert.equal(view.formatNumber(-.001), '-1.000e-3');
  assert.equal(view.formatNumber(269.765, 3), '269.765');
  assert.equal(view.formatNumber(0), '0.00');
  assert.equal(view.formatNumber(null), '—');
});

test('log search matches actual recipes, IDs and compound Stage queries', () => {
  const rows = view.sampleRows(engine);
  assert.deepEqual(view.filterRows(rows, 'b456').map(row => row.id), ['sample-b456-a']);
  assert.equal(view.filterRows(rows, 'stage A 2026-10-29').length, 2);
  assert.equal(view.filterRows(rows, 'sample-a456-b').length, 1);
  assert.equal(view.filterRows(rows, 'recipe_v4.2_std').length, 0);
});
test('empty and unmatched log search preserve source records', () => {
  const rows = view.sampleRows(engine), before = JSON.stringify(rows);
  assert.equal(view.filterRows(rows, '   ').length, 3);
  assert.deepEqual(view.filterRows(rows, '[missing]'), []);
  assert.equal(JSON.stringify(rows), before);
});

test('precision control avoids floating point drift', () => {
  let value = 269.765;
  for (let i = 0; i < 100; i++) value = view.nudgePressure(value, -1, engine.recipes.A456);
  assert.equal(value, 269.665);
});
test('precision control clamps to recipe bounds and recovers invalid input', () => {
  const recipe = engine.recipes.A456;
  assert.equal(view.nudgePressure(recipe.min, -1, recipe), recipe.min);
  assert.equal(view.nudgePressure(recipe.max, 1, recipe), recipe.max);
  assert.equal(view.nudgePressure(347.893, -1, recipe), recipe.max);
  assert.equal(view.nudgePressure(NaN, 1, recipe), 269.766);
  assert.equal(view.nudgePressure(269, 1, engine.recipes.A123), null);
});
test('display identity uses the stored record without fabricating lot or recipe metadata', () => {
  const row = { id: 'abc12345-def6-4789-8000-123456789abc', at: '2026-10-29T05:32:18Z', input: engine.defaults('A456'), result: engine.calculate(engine.defaults()) };
  const original = JSON.stringify(row);
  assert.deepEqual(view.logIdentity(row), { run: '실험 #abc1…789abc', recipe: 'A456', stage: 'Stage A' });
  assert.equal(JSON.stringify(row), original);
});
test('synthetic log examples use real demo arithmetic with all evidence grades', () => {
  const rows = view.sampleRows(engine);
  assert.deepEqual(rows.map(row => row.result.grade), ['B', 'A', 'C']);
  for (const row of rows) {
    assert.equal(row.sample, true);
    assert.deepEqual(row.result, engine.calculate(row.input));
  }
  rows[0].input.pressure = 0;
  assert.equal(view.sampleRows(engine)[0].input.pressure, 260);
});
test('measurement status describes the grade inputs without claiming accuracy', () => {
  assert.equal(view.evidenceLabel(engine.calculate({...engine.defaults(), scenario:'measure10'})), '일반 운전 범위 · 10장 경과');
  assert.equal(view.evidenceLabel(engine.calculate({...engine.defaults(), pressure:260})), '주의 관측 구간 · 1장 경과');
  assert.equal(view.evidenceLabel(engine.calculate(engine.defaults('A123'))), '상태 참조 · 1장 경과');
});
test('date search follows the displayed local day across UTC midnight', t => {
  const oldTZ = process.env.TZ;
  t.after(() => { if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ; });
  process.env.TZ = 'Asia/Seoul';
  const row = {...view.sampleRows(engine)[0], at:'2026-10-29T23:30:00Z'};
  assert.equal(view.filterRows([row], '2026-10-30').length, 1);
  assert.equal(view.filterRows([row], '2026-10-29').length, 0);
});
test('legacy restart records round-trip without changing inputs, IDs or calculated values', () => {
  const input = {...engine.defaults(), scenario:'restart', pressure:260};
  const row = {id:'legacy-restart-1',at:'2026-10-29T03:00:00Z',input,result:engine.calculate(input)};
  assert.deepEqual(engine.restoreHistory(JSON.stringify([row])), [row]);
  assert.equal(view.filterRows([row], 'legacy-restart-1')[0].id, row.id);
});

