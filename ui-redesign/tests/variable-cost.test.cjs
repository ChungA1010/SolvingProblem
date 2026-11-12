const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../dist/game-model.js');

const act = (state, type, fields = {}) => game.transition(state, {type, ...fields});
const run = (state, duration = 121, input = game.settings()) => act(state, 'run', {input, duration});

test('each adjustable condition has a visible cost tradeoff and a quote totals its components', () => {
  const state = game.createFunded(0, {}, 500);
  const quote = (input, duration = 121) => game.processingQuote(state, game.settings(input), duration);
  const baseline = quote({});
  assert.equal(baseline.total, baseline.base + baseline.time + baseline.pressure + baseline.rotation + baseline.slurry);
  assert.ok(Number.isInteger(baseline.total) && baseline.total > 0);
  assert.ok(quote({}, 240).total > quote({}, 30).total);
  assert.ok(quote({pressure:270.011}).total > quote({pressure:250.817}).total);
  for (const key of ['wafer_rotation_pct', 'stage_rotation_pct', 'slurry_c_pct']) {
    assert.ok(quote({[key]:150}).total > quote({[key]:50}).total, `${key} must change the cost`);
  }
});

test('a quoted processing fee is charged once and is retained through discard and reload', () => {
  const input = game.settings({pressure:260, wafer_rotation_pct:125, stage_rotation_pct:80, slurry_c_pct:140});
  const initial = game.createFunded(0, {}, 100);
  const fee = game.processingQuote(initial, input, 164).total;
  const processed = run(initial, 164, input);
  assert.equal(processed.wallet, 100 - fee);
  assert.equal(game.summary(processed).processingCost, fee);
  assert.throws(() => run(processed, 164, input));
  assert.equal(initial.wallet, 100);
  const discarded = act(processed, 'discard');
  assert.equal(discarded.wallet, processed.wallet);
  assert.equal(game.summary(discarded).processingCost, fee);
  const restored = game.restore(game.serialize(discarded));
  assert.deepEqual(restored, discarded);
  const forged = {...JSON.parse(game.serialize(discarded)), wallet:999999, rows:[]};
  assert.deepEqual(game.restore(forged), discarded);
});

test('invalid quotes and unaffordable runs cannot mutate an order or consume an action', () => {
  const state = game.createFunded(0, {}, 5);
  const before = game.serialize(state);
  for (const duration of [0, 29, 241, 30.5, NaN, Infinity]) {
    assert.throws(() => game.processingQuote(state, game.settings(), duration));
    assert.throws(() => run(state, duration));
  }
  for (const input of [game.settings({pressure:347.893}), game.settings({slurry_c_pct:151})]) {
    assert.throws(() => game.processingQuote(state, input, 121));
    assert.throws(() => run(state, 121, input));
  }
  assert.throws(() => run(state, 121), /자금|비용|부족/);
  assert.equal(game.serialize(state), before);
  assert.equal(game.actions(state).used, 0);
  assert.equal(state.rows.length, 0);
});

test('minimum processing reserves protect remaining wafers from optional spending', () => {
  const minimumInput = game.settings({pressure:250.817, wafer_rotation_pct:50, stage_rotation_pct:50, slurry_c_pct:50});
  const starting = game.createFunded(1, {}, 100);
  const minimum = game.processingQuote(starting, minimumInput, 30).total;
  let state = game.createFunded(1, {}, minimum * 6 + 4);
  const before = game.serialize(state);
  assert.throws(() => act(state, 'service'));
  assert.equal(game.serialize(state), before);
  state = run(state, 30, minimumInput);
  assert.throws(() => act(state, 'measure'));
  state = act(state, 'advance');
  while (state.rows.length < 6) state = act(run(state, 30, minimumInput), 'advance');
  assert.equal(state.wallet, 4);
  assert.equal(game.actions(state).used, 0);
  assert.equal(state.phase, 'inspection');
});

test('funded sessions preserve v6 removal calculations, equipment and sensor behavior exactly', () => {
  for (const order of [0, 1, 2, 4]) {
    const equipment = {environment:1, care:1, pad:1, endpoint:1};
    let legacy = game.create(order, equipment);
    let funded = game.createFunded(order, equipment, 500);
    for (let i=0; i<3; i++) {
      const duration = i === 0 ? 121 : 240;
      legacy = run(legacy, duration);
      funded = run(funded, duration);
      const a = legacy.rows.at(-1), b = funded.rows.at(-1);
      for (const key of ['rate', 'removed', 'error', 'quality', 'duration', 'actualDuration', 'endpointEnabled', 'endpointStopped']) {
        assert.equal(b[key], a[key], `order ${order}, wafer ${i + 1}, ${key}`);
      }
      if (i === 0) {
        legacy = act(legacy, 'measure');
        funded = act(funded, 'measure');
      }
      legacy = act(legacy, 'advance');
      funded = act(funded, 'advance');
    }
    assert.deepEqual(game.restore(game.serialize(funded)), funded);
    assert.deepEqual(game.restore(game.serialize(legacy)), legacy);
    assert.equal(game.summary(legacy).processingCost, 30);
  }
});

test('endpoint early stopping does not reveal outcomes or silently change the quoted reservation', () => {
  let state = act(act(run(game.createFunded(0, {endpoint:1}, 500)), 'measure'), 'advance');
  const fee = game.processingQuote(state, game.settings(), 240).total;
  const wallet = state.wallet;
  state = run(state, 240);
  assert.equal(state.rows.at(-1).endpointStopped, true);
  assert.ok(game.elapsed(state.rows.at(-1)) < 240);
  assert.equal(wallet - state.wallet, fee);
  const visible = game.visibleRows(state).at(-1);
  assert.equal(visible.removed, null);
  assert.equal(visible.rate, null);
  assert.equal(visible.quality, null);
});
