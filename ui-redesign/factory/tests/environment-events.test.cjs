const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game-model.js');

const setup = (sequence, items = []) => ({seed:'weather-test',sequence,items,environmentVersion:1});
const order = (sequence, items = []) => game.createFunded(0,{},100,setup(sequence,items));
const apply = (state, type, values = {}) => game.transition(state,{type,...values});
const run = state => apply(state,'run',{duration:138});
const store = state => apply(state,'advance',{keepOpen:true});
const restored = state => game.restore(game.serialize(state));

function deliver(stored) {
  let state = apply(stored,'finishLot');
  const count = game.lotRows(state).length;
  if (count) state = apply(state,'inspect',{count});
  return apply(state,'ship');
}

test('environment draws are replayable, independent of customer, gear and existing economic events', () => {
  const observed = new Set();
  assert.equal(game.environmentStatus(order(1)),null);
  assert.equal(game.environmentStatus(order(2)).id,'dust');
  assert.equal(game.environmentStatus(order(3)).id,'construction');
  for (let sequence=4; sequence<100; sequence++) {
    const state=order(sequence), env=game.environmentStatus(state);
    observed.add(env ? env.resolution??env.id : 'clear');
    const old=game.createFunded(0,{},100,{seed:'weather-test',sequence,items:[]});
    assert.deepEqual(game.orderEvent(state),game.orderEvent(old));
    assert.equal(game.environmentStatus(old),null);
    assert.deepEqual(game.environmentStatus(restored(state)),env);
    const switched=game.createFunded(4,{pad:1},700,setup(sequence,['note_board']));
    assert.deepEqual(game.environmentStatus(switched),env);
  }
  assert.deepEqual(observed,new Set(['clear','dust','normal','construction']));
});

test('dust gates polishing before payment; replacing a filter is free and never changes removal or payout', () => {
  for (const items of [[],['storage_cabinet']]) {
    const original=order(2,items), spare=items.includes('storage_cabinet');
    assert.deepEqual(game.environmentStatus(original),{id:'dust',active:true,hasSpare:spare,resolution:null});
    assert.throws(()=>run(original),/필터/);
    assert.throws(()=>apply(original,'waitForQuiet'));
    const ready=restored(apply(original,'replaceFilter'));
    assert.deepEqual(game.environmentStatus(ready),{id:'dust',active:false,hasSpare:spare,resolution:spare?'reserve':'service'});
    assert.deepEqual(game.actions(ready),game.actions(original));
    assert.equal(ready.wallet,original.wallet);
    assert.equal(ready.spent,0);
    assert.throws(()=>apply(ready,'replaceFilter'));
    const context=setup(2,items);delete context.environmentVersion;
    const control=game.createFunded(0,{},100,context);
    const actual=deliver(store(run(ready))),expected=deliver(store(run(control)));
    assert.deepEqual(actual.rows,expected.rows);
    assert.equal(actual.wallet,expected.wallet);
    assert.deepEqual(game.summary(actual),game.summary(expected));
    assert.deepEqual(restored(actual),actual);
    assert.equal(game.comparison(actual,expected),null);
    const archive=game.archiveSettlement([], 'weather-dust','2026-11-21',actual);
    assert.deepEqual(game.environmentStatus(game.restore(archive[0].session)),game.environmentStatus(actual));
  }
});

test('healthy filters permit normal work; a blocked or empty order can still finish', () => {
  const healthy=Array.from({length:100},(_,i)=>order(i+4)).find(state=>game.environmentStatus(state)?.resolution==='normal');
  assert.equal(game.environmentStatus(healthy).active,false);
  assert.throws(()=>apply(healthy,'replaceFilter'));
  assert.equal(run(healthy).rows.length,1);
  const empty=deliver(order(2));
  assert.deepEqual(restored(empty),empty);
  assert.equal(game.environmentStatus(empty).resolution,null);
  assert.equal(game.environmentStatus(empty).active,false);
  assert.throws(()=>apply(empty,'replaceFilter'));
});

test('construction blocks both metrology routes and allows waiting, storage and a second polish', () => {
  const first=run(order(3)), onRack=store(first);
  assert.equal(game.environmentStatus(first).active,true);
  assert.throws(()=>apply(first,'measure'),/진동/);
  assert.throws(()=>apply(onRack,'measure',{wafer:1}),/진동/);
  assert.equal(game.actions(onRack).used,0);
  assert.equal(game.visibleRows(onRack)[0].removed,null);
  const waited=apply(first,'waitForQuiet');
  assert.equal(game.environmentStatus(waited).resolution,'waited');
  assert.equal(waited.wallet,first.wallet);
  assert.throws(()=>apply(waited,'waitForQuiet'));
  const measured=apply(restored(waited),'measure');
  assert.equal(measured.wallet,first.wallet-5);
  assert.equal(game.actions(measured).used,1);
  const second=run(onRack);
  assert.equal(game.environmentStatus(second).resolution,'finished');
  assert.throws(()=>apply(second,'waitForQuiet'));
  const measuredFirst=apply(restored(second),'measure',{wafer:1});
  assert.equal(measuredFirst.recalled,1);
  const returned=apply(measuredFirst,'rackReturn',{wafer:1});
  const review=apply(returned,'rackReview',{wafer:1});
  assert.equal(game.actions(review).used,1);
  assert.deepEqual(restored(review),review);
  const early=deliver(onRack);
  assert.equal(game.environmentStatus(early).resolution,null);
  assert.equal(early.wallet,onRack.wallet+game.summary(early).revenue);
});

test('old sessions and invalid replays cannot acquire or bypass environmental rules', () => {
  const old=game.createFunded(0,{},100,{seed:'weather-test',sequence:2,items:[]});
  assert.equal(game.environmentStatus(restored(run(old))),null);
  assert.throws(()=>apply(old,'replaceFilter'));
  assert.throws(()=>apply(old,'waitForQuiet'));
  const record=JSON.parse(game.serialize(run(old)));
  record.eventSetup.environmentVersion=1;
  assert.equal(game.restore(record),null);
  record.eventSetup.environmentVersion=2;
  assert.equal(game.restore(record),null);
  assert.equal(game.restore({...record,eventSetup:setup(3),events:[{type:'finishLot'},{type:'waitForQuiet'}]}),null);
});
