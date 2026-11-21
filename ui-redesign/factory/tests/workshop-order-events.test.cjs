const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game-model.js');
const upgrades = require('../factory-upgrades.js');
const campaign = require('../campaign-model.js');

const act = (state, type, fields = {}) => game.transition(state, {type, ...fields});
const order = (sequence, items = [], wallet = 100) =>
  game.createFunded(0, {}, wallet, {sequence, items, seed:'main'});
const reload = state => game.restore(game.serialize(state));
const run = state => act(state, 'run', {duration:138});
function inspect(state) {
  if (state.phase === 'setup') state = act(state, 'finishLot');
  const count = game.lotRows(state).length;
  return count ? act(state, 'inspect', {count}) : state;
}

test('the draw is stable across customer changes and reload, and the first order is quiet', () => {
  assert.equal(game.orderEvent(order(1, ['note_board'])).id, 'quiet');
  const items = ['note_board'];
  const state = order(3, items);
  items.pop();
  const event = game.orderEvent(state);
  assert.equal(event.id, 'priority');
  assert.equal(event.induced, true);
  assert.deepEqual(game.orderEvent(reload(run(state))), event);
  const switched = game.createFunded(6, {pad:1}, 1000, state.eventSetup);
  assert.deepEqual(game.orderEvent(switched), event);
  assert.equal(game.orderEvent(order(3)).id, 'quiet');
  assert.equal(game.orderEvent(order(2)).id, 'priority');
  assert.equal(game.orderEvent(order(2, ['note_board'])).induced, false);
  assert.equal(game.orderEvent(order(5, ['note_board'])).id, 'quiet');
});

test('supply fees are quoted, charged and retained after discard, while the reserve prevents them', () => {
  const plain = order(11), protectedOrder = order(11, ['storage_cabinet','note_board']);
  const input = game.settings();
  assert.equal(game.orderEvent(plain).id, 'shortage');
  assert.equal(game.orderEvent(protectedOrder).blocked, true);
  const fee = game.processingQuote(plain, input, 138);
  const waived = game.processingQuote(protectedOrder, input, 138);
  assert.equal(fee.eventFee, 3);
  assert.equal(waived.eventFee, 0);
  assert.equal(fee.total - waived.total, 3);
  assert.equal(game.availableForActions(protectedOrder) - game.availableForActions(plain), 3 * 6);
  const dest = run(plain), protectedDest = run(protectedOrder);
  assert.equal(dest.wallet, 100 - fee.total);
  assert.equal(game.visibleRows(dest)[0].eventFee, 3);
  assert.equal(game.visibleRows(dest)[0].removed, null);
  for (const key of ['rate','removed','actualDuration','endpointStopped','quality']) {
    assert.equal(dest.rows[0][key], protectedDest.rows[0][key]);
  }
  const noneKept = act(inspect(act(dest, 'discard')), 'ship');
  assert.equal(game.summary(noneKept).eventNet, -3);
  assert.equal(game.summary(noneKept).revenue, 0);
  assert.deepEqual(reload(noneKept), noneKept);
  assert.equal(game.summary(protectedDest).eventFee, 0);
});

test('priority pays once for shipped in-spec wafers and survives settlement, cashbook and archive replay', () => {
  let state = order(3, ['note_board']);
  let workshop = campaign.initialize(upgrades.create());
  const id = 'priority-batch';
  for (let i = 0; i < 6; i++) {
    state = act(run(state), 'advance');
    workshop = campaign.sync(workshop, id, state);
  }
  assert.equal(game.summary(state).eventBonus, 0);
  state = inspect(state);
  assert.equal(game.summary(state).good, 6);
  assert.equal(game.summary(state).eventBonus, 20);
  const before = workshop.balance;
  workshop = campaign.sync(workshop, id, state);
  assert.equal(workshop.balance, before);
  state = act(state, 'ship');
  assert.equal(game.summary(state).revenue, 620);
  workshop = campaign.sync(workshop, id, state);
  assert.equal(workshop.balance, before + 620);
  assert.deepEqual(campaign.sync(workshop, id, reload(state)), workshop);
  assert.deepEqual(upgrades.restore(upgrades.serialize(workshop)), workshop);
  assert.equal(campaign.dailySummary(workshop, 1).revenue, 620);
  const [saved] = game.archiveSettlement([], id, '2026-11-01', state);
  assert.equal(game.summary(game.restore(saved.session)).eventNet, 20);
});

test('discarded pieces cannot unlock the premium and dissimilar economic conditions are excluded from comparisons', () => {
  let state = order(2);
  state = act(run(state), 'advance');
  state = act(run(state), 'advance');
  state = act(run(state), 'discard');
  state = act(inspect(state), 'ship');
  assert.equal(game.summary(state).good, 2);
  assert.equal(game.summary(state).eventBonus, 0);
  assert.equal(game.summary(state).revenue, 200);
  const prior = act(inspect(act(run(order(11)), 'advance')), 'ship');
  const records = game.archiveSettlement([], 'old', '2026-11-01', prior);
  assert.equal(game.previousAttempt(records, state, 'new'), null);
  assert.equal(game.comparison(state, prior), null);
});

test('old snapshots retain their original rules and invalid event context is rejected without losing valid records', () => {
  const old = run(game.createFunded(0, {}, 100));
  assert.equal(game.orderEvent(old), null);
  assert.equal(Object.hasOwn(JSON.parse(game.serialize(old)), 'eventSetup'), false);
  assert.deepEqual(reload(old), old);
  const record = JSON.parse(game.serialize(order(3)));
  for (const context of [null, {}, {...record.eventSetup,sequence:0}, {...record.eventSetup,items:['invalid']}]) {
    assert.equal(game.restore({...record,eventSetup:context}), null);
  }
});
