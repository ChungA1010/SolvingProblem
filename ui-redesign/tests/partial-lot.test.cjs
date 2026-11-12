const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../dist/game-model.js');
const customers = require('../dist/customer-story.js');
const guidance = require('../dist/game-guidance.js');

const step = (state,type,extra={}) => game.transition(state,{type,...extra});
const run = state => step(state,'run',{duration:130});

test('inspection follows the cassette after an unmeasured wafer is discarded', () => {
  let state = step(run(game.create()),'discard');
  assert.throws(()=>step(state,'discard'));
  state = step(run(state),'advance');
  state = step(state,'finishLot');
  assert.throws(()=>step(state,'ship'));
  assert.throws(()=>step(state,'inspect',{count:2}));
  state = step(state,'inspect',{count:1});
  const [discard,kept] = game.visibleRows(state);
  assert.equal(discard.removed,null);
  assert.equal(discard.discarded,true);
  assert.equal(kept.number,2);
  assert.ok(kept.removed>0);
  state = step(state,'ship');
  const summary = game.summary(state);
  assert.equal(summary.total,1);
  assert.equal(summary.processingCost,20);
  assert.equal(state.wallet,80+summary.revenue);
  assert.equal(summary.revenue,kept.quality==='good'?100:0);
  assert.equal(game.visibleRows(state)[0].quality,null);
  assert.deepEqual(game.restore(game.serialize(state)),state);
  assert.match(customers.reaction(state).message,/보내주신 1장/);
  assert.throws(()=>step(state,'ship'));
});

test('throwing away a scanned wafer keeps costs, calibration and recorded measurement', () => {
  let state = step(step(run(game.create()),'measure'),'discard');
  assert.equal(state.lastMeasured,1);
  assert.equal(game.actions(state).used,1);
  assert.equal(state.wallet,85);
  state = step(step(state,'finishLot'),'ship');
  assert.equal(game.summary(state).revenue,0);
  assert.ok(game.visibleRows(state)[0].removed>0);
  assert.equal(customers.reaction(state).mood,'retry');
  assert.ok(guidance.debrief(state).length);
});

test('six rejects close the batch without a phantom shipment or a blocked inspection', () => {
  let state=game.create();
  for(let i=0;i<6;i++)state=step(run(state),'discard');
  assert.equal(state.phase,'inspection');
  assert.ok(game.inspectionDone(state));
  assert.equal(game.summary(step(state,'ship')).total,0);
  assert.equal(state.wallet,40);
  assert.equal(game.actions(state).used,0);
});
