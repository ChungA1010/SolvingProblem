const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../dist/game-model.js');
const upgrades = require('../dist/factory-upgrades.js');
const campaign = require('../dist/campaign-model.js');
const story = require('../dist/customer-story.js');

const act = (state, type, fields = {}) => game.transition(state, {type, ...fields});
const run = (state, duration) => act(state, 'run', {input:game.settings(), duration});
const reload = growth => upgrades.restore(upgrades.serialize(growth));
function inspectAndShip(state) {
  if (state.phase === 'setup') state = act(state, 'finishLot');
  const remaining = game.lotRows(state).length - state.inspected;
  if (remaining) state = act(state, 'inspect', {count:remaining});
  return act(state, 'ship');
}

test('three complete orders share one wallet, close a day, buy equipment and fund the next order', () => {
  let growth = campaign.initialize(upgrades.create());
  assert.equal(growth.balance, 100);
  assert.deepEqual(campaign.initialize(reload(growth)), growth);
  let revenues = 0, costs = 0;
  const completed = [];
  for (let order=0; order<3; order++) {
    const id = `day-one-order-${order}`;
    let state = game.createFunded(order, growth.levels, growth.balance);
    const opening = growth.balance;
    const update = (type, fields = {}) => {
      state = act(state, type, fields);
      growth = campaign.sync(growth, id, state);
      assert.equal(growth.balance, state.wallet);
      const serialized = upgrades.serialize(growth);
      assert.deepEqual(upgrades.serialize(campaign.sync(growth, id, state)), serialized);
      growth = reload(growth);
      state = game.restore(game.serialize(state));
      assert.ok(growth && state);
    };
    for (let wafer=0; wafer<6; wafer++) {
      update('run', {input:game.settings(), duration:game.recommendation(state, game.settings())});
      assert.equal(game.visibleRows(state).at(-1).removed, null);
      if (wafer === (order === 2 ? 1 : 0) || wafer === 3) update('measure');
      update('advance', {keepOpen:true});
    }
    assert.equal(game.actions(state).used, 2);
    assert.equal(story.reaction(state), null);
    update('finishLot');
    update('inspect', {count:6});
    assert.equal(growth.balance, opening - game.summary(state).spent, 'inspection must not pay');
    update('ship');
    assert.ok(story.reaction(state));
    assert.ok(game.summary(state).good >= 3);
    assert.throws(() => act(state, 'ship'));
    assert.equal(growth.credited.length, order + 1);
    revenues += game.summary(state).revenue;
    costs += game.summary(state).spent;
    completed.push(state);
  }
  const day = campaign.dailySummary(growth, 1);
  assert.equal(day.orders, 3);
  assert.equal(day.revenue, revenues);
  assert.equal(day.costs, costs);
  assert.equal(day.profit, revenues - costs);
  assert.equal(growth.balance, 100 + revenues - costs);
  const beforePurchase = growth.balance;
  growth = upgrades.transition(growth, {type:'buy', id:'pad', level:0});
  const price = upgrades.catalog.pad.costs[0];
  assert.equal(growth.balance, beforePurchase - price);
  assert.equal(campaign.dailySummary(growth, 1).purchases, price);
  const next = game.createFunded(0, growth.levels, growth.balance);
  assert.equal(next.wallet, growth.balance);
  assert.equal(game.equipment(next).pad, 1);
  assert.equal(game.equipment(completed[2]).pad, 0);
  assert.deepEqual(reload(growth), growth);
});

test('failed orders retain real losses and recovery assistance is explicit and idempotent', () => {
  let growth = campaign.initialize(upgrades.create());
  let state = game.createFunded(0, {}, growth.balance);
  for (let i=0; i<6; i++) {
    state = act(run(state, 240), 'advance');
    growth = campaign.sync(growth, 'failed-order', state);
  }
  const spent = game.summary(state).spent;
  state = inspectAndShip(state);
  assert.equal(game.summary(state).revenue, 0);
  growth = campaign.sync(growth, 'failed-order', state);
  assert.equal(growth.balance, 100 - spent);
  assert.equal(campaign.dailySummary(growth, 1).profit, -spent);
  assert.equal(growth.credited.length, 1);
  assert.ok(campaign.canSupport(growth, 'recovery-one'));
  const oldBalance = growth.balance;
  growth = campaign.support(growth, 'recovery-one');
  assert.equal(growth.balance, 100);
  assert.equal(campaign.dailySummary(growth, 1).support, 100 - oldBalance);
  assert.equal(campaign.dailySummary(growth, 1).profit, -spent, 'assistance is not sales or earned profit');
  assert.deepEqual(campaign.support(reload(growth), 'recovery-one'), growth);
  assert.equal(campaign.canSupport(growth, 'recovery-two'), false);
  assert.deepEqual(campaign.initialize(growth), growth);
});

test('rack recall, free review and discard never refund costs or add another sale', () => {
  let growth = campaign.initialize(upgrades.create());
  let state = game.createFunded(0, {}, growth.balance);
  const step = (type, fields={}) => {
    state = act(state, type, fields);
    growth = campaign.sync(growth, 'rack-order', state);
  };
  for (let i=0; i<3; i++) {
    step('run', {duration:130});
    step('advance', {keepOpen:true});
  }
  step('measure', {wafer:2});
  assert.equal(state.recalled, 2);
  assert.ok(game.visibleRows(state)[1].removed > 0);
  step('rackReturn', {wafer:2});
  const paidBalance = growth.balance;
  const paidEvents = upgrades.serialize(growth);
  for (let i=0; i<3; i++) {
    step('rackReview', {wafer:2});
    step('rackReturn', {wafer:2});
  }
  assert.equal(growth.balance, paidBalance);
  assert.deepEqual(upgrades.serialize(growth), paidEvents);
  step('rackDiscard', {wafer:2});
  assert.equal(growth.balance, paidBalance);
  assert.equal(game.freeSlot(state), 1);
  assert.equal(game.actions(state).used, 1);
  step('finishLot');
  assert.throws(() => act(state, 'ship'));
  step('inspect', {count:2});
  assert.equal(growth.balance, paidBalance);
  step('ship');
  assert.equal(growth.balance, paidBalance + game.summary(state).revenue);
  assert.equal(game.summary(state).total, 2);
  assert.deepEqual(campaign.sync(reload(growth), 'rack-order', game.restore(game.serialize(state))), growth);
});

test('empty funded orders can close without payment and still count exactly one customer', () => {
  let growth = campaign.initialize(upgrades.create());
  assert.equal(inspectAndShip(game.createFunded(0, {}, 0)).wallet, 0);
  const state = inspectAndShip(game.createFunded(0, {}, growth.balance));
  assert.equal(game.summary(state).total, 0);
  assert.equal(game.summary(state).spent, 0);
  growth = campaign.sync(growth, 'empty-order', state);
  assert.equal(growth.balance, 100);
  assert.equal(growth.credited.length, 1);
  assert.equal(campaign.dailySummary(growth, 1).orders, 1);
  assert.deepEqual(campaign.sync(growth, 'empty-order', state), growth);
});

test('existing v6 settlements retain positive-profit migration without a second payout', () => {
  let old = game.create();
  for (let i=0; i<6; i++) old = act(run(old, 130), 'advance');
  old = inspectAndShip(old);
  const profit = Math.max(0, game.summary(old).revenue - game.summary(old).spent);
  let growth = upgrades.transition(upgrades.create(), {type:'income', id:'old-paid-order', amount:profit});
  growth = campaign.initialize(growth);
  const opening = growth.balance;
  assert.deepEqual(campaign.sync(growth, 'old-paid-order', old), growth);
  const migrated = campaign.sync(growth, 'old-uncredited-order', old);
  assert.equal(migrated.balance, opening + profit);
  assert.deepEqual(campaign.sync(reload(migrated), 'old-uncredited-order', old), migrated);
});

test('migration at a completed day keeps initialization and purchases before the next day opening', () => {
  let growth = upgrades.create();
  for (let i=0; i<3; i++) growth = upgrades.transition(growth, {type:'income', id:`legacy-day-one-${i}`, amount:100});
  growth = campaign.initialize(growth);
  assert.equal(growth.balance, 400);
  growth = upgrades.transition(growth, {type:'buy', id:'pad', level:0});
  assert.equal(growth.balance, 160);
  const firstDay = campaign.dailySummary(growth, 1);
  assert.equal(firstDay.orders, 3);
  assert.equal(firstDay.initial, 100);
  assert.equal(firstDay.purchases, 240);
  assert.equal(firstDay.balance, 160);
  const next = run(game.createFunded(0, growth.levels, growth.balance), 121);
  growth = campaign.sync(growth, 'first-order-next-day', next);
  assert.equal(game.summary(next).processingCost, 12);
  assert.equal(growth.balance, 148);
  const secondDay = campaign.dailySummary(growth, 2);
  assert.equal(secondDay.opening, 160);
  assert.equal(secondDay.costs, 12);
  assert.equal(secondDay.balance, 148);
  assert.deepEqual(campaign.dailySummary(growth, 1), firstDay);
  assert.deepEqual(reload(growth), growth);
});

test('an active funded order cannot rewrite its opening wallet but settled archives may follow purchases', () => {
  let growth = campaign.initialize(upgrades.create());
  let state = run(game.createFunded(0, {}, growth.balance), 121);
  growth = campaign.sync(growth, 'wallet-checked-order', state);
  const savedGrowth = upgrades.serialize(growth);
  const forged = JSON.parse(game.serialize(state));
  forged.initialWallet += 50;
  const recreated = game.restore(forged);
  assert.ok(recreated);
  assert.equal(recreated.wallet, state.wallet + 50);
  assert.throws(() => campaign.sync(growth, 'wallet-checked-order', recreated), /잔액|자금/);
  assert.deepEqual(upgrades.serialize(growth), savedGrowth);
  state = inspectAndShip(act(state, 'advance', {keepOpen:true}));
  growth = campaign.sync(growth, 'wallet-checked-order', state);
  growth = upgrades.transition(growth, {type:'buy', id:'note_board'});
  assert.deepEqual(campaign.sync(reload(growth), 'wallet-checked-order', game.restore(game.serialize(state))), growth);
});
