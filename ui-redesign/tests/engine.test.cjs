const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../dist/engine.js');

for (const [recipe, mrr, time] of [['A456', 74.1, 114.7], ['B456', 81.5, 119.3], ['A123', 151.1, 68]]) {
  test(`${recipe} anchor matches the disclosed demo`, () => {
    const result = engine.calculate(engine.defaults(recipe));
    assert.equal(result.mrr, mrr); assert.ok(Math.abs(result.time - time) < 1e-8);
    assert.equal(result.ai_model_connected, false); assert.equal(result.illustrative_only, true);
  });
}
test('A456 pressure 260 is observed_shift with expected result', () => {
  const value = engine.calculate({ ...engine.defaults(), pressure: 260 });
  assert.ok(Math.abs(value.mrr - 72.2599822214) < 1e-8); assert.equal(value.grade, 'B');
  assert.equal(value.time.toFixed(2), '117.62');
});
for (const pressure of [347.893, 0, NaN, Infinity, 250, 271]) {
  test(`reject invalid pressure ${pressure}`, () => assert.throws(() => engine.calculate({ ...engine.defaults(), pressure })));
}
for (const mrr of [0, -1, NaN, Infinity]) {
  test(`reject invalid MRR ${mrr}`, () => assert.throws(() => engine.calculate({ ...engine.defaults(), mrr })));
}
test('stale measurement affects evidence, not invented MRR effects', () => {
  const value = engine.calculate({ ...engine.defaults(), scenario: 'measure10' });
  assert.equal(value.grade, 'C'); assert.equal(value.mrr, 74.1);
});
test('A123 rejects pressure manipulation', () => assert.throws(() => engine.calculate({ ...engine.defaults('A123'), pressure: 250 })));
test('small MRR produces unavailable time without invalid JSON', () => {
  const value = engine.calculate({ ...engine.defaults(), mrr: Number.MIN_VALUE });
  assert.equal(value.time, null); assert.ok(JSON.stringify(value));
});
test('history ignores corrupt and unsafe records', () => {
  assert.deepEqual(engine.restoreHistory('{broken'), []);
  assert.deepEqual(engine.restoreHistory('[{"id":"<script>"}]'), []);
  const row = { id: 'example', at: '2026-10-27T00:00:00Z', input: engine.defaults(), result: { mrr: -999 } };
  const rows = engine.restoreHistory(JSON.stringify(Array(25).fill(row)));
  assert.equal(rows.length, 20); assert.equal(rows[0].result.mrr, 74.1);
});
