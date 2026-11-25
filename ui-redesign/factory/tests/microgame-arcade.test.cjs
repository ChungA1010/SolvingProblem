const test = require('node:test');
const assert = require('node:assert/strict');
const arcade = require('../microgame-arcade.js');

const all = ['condition', 'landing', 'pressure', 'rotation', 'slurry', 'surface'];
test('the first two production wafers teach pressure then surface, and all six appear exactly once per bag', () => {
  for (const sample of [0, 0.31, 0.7, 0.9999]) {
    const random = () => sample;
    let deck = arcade.newDeck(true, null, random);
    assert.deepEqual(deck.slice(0, 2), ['pressure', 'surface']);
    let last;
    for (let bag = 0; bag < 5; bag++) {
      const seen = [];
      for (let wafer = 0; wafer < all.length; wafer++) {
        assert.notEqual(deck[0], last);
        last = deck[0];
        seen.push(last);
        deck = arcade.advance(deck, random);
      }
      assert.deepEqual(seen.sort(), all);
    }
  }
});

test('five-game saves resume their current card and add the new task to the end once', () => {
  for (const old of [['surface'], ['slurry','rotation'], ['pressure','surface','condition','slurry','rotation']]) {
    const migrated=arcade.restore(old,false,3,true);
    assert.deepEqual(migrated,[...old,'landing']);
    assert.deepEqual(arcade.restore(migrated,false,3,true),migrated);
  }
  const afterLanding=['rotation','slurry'];
  assert.deepEqual(arcade.restore(afterLanding,false,4,false),afterLanding);
  assert.equal(arcade.restore(undefined,true,0,true).length,6);
});

test('head landing is routable and dispatches the existing order options to its own game', () => {
  assert.ok(arcade.isRoute('#microgames/landing'));
  const options={continueLabel:'연마 시작',waferNumber:4};
  let opened;
  const old=globalThis.CMPHeadLanding;
  try{
    globalThis.CMPHeadLanding={open(value){opened=value;}};
    arcade.play('landing',options);
    assert.equal(opened,options);
  } finally {
    if(old===undefined)delete globalThis.CMPHeadLanding;
    else globalThis.CMPHeadLanding=old;
  }
});

test('the surface card and the paid wafer use the same rotating two-pad game', () => {
  const previous=globalThis.CMPSurfacePractice;
  const practice={practiceLabel:'종목 선택으로'};
  const order={waferNumber:2,continueLabel:'연마 시작 · −12 P',onContinue(){}};
  const opened=[];
  try {
    globalThis.CMPSurfacePractice={openRound(options){opened.push(options);}};
    assert.ok(arcade.isRoute('#microgames/surface'));
    arcade.play('surface',practice);
    arcade.play('surface',order);
    assert.deepEqual(opened,[practice,order]);
  } finally {
    if(previous===undefined) delete globalThis.CMPSurfacePractice;
    else globalThis.CMPSurfacePractice=previous;
  }
});

test('reopening, changing orders, or retrying keeps the pending wafer until processing commits', () => {
  const deck = ['slurry', 'surface', 'condition'];
  const restored = arcade.restore(JSON.parse(JSON.stringify(deck)), false, 4);
  assert.deepEqual(restored, deck);
  assert.deepEqual(arcade.advance(restored), ['surface', 'condition']);
  assert.deepEqual(deck, ['slurry', 'surface', 'condition']);
});

test('old or invalid progress restores a playable deck for the next wafer', () => {
  for (const saved of [undefined, [], ['pressure', 'pressure'], ['inspect']]) {
    assert.equal(arcade.restore(saved, true, 1)[0], 'surface');
  }
  for (const id of all) assert.ok(arcade.isRoute('#microgames/' + id));
  assert.ok(arcade.isRoute('#microgames'));
  assert.equal(arcade.isRoute('#surface-practice'), false);
});

test('the order button identifies every assigned task and the shared instruments preserve a paid run callback', () => {
  const titles = all.map(id => arcade.taskName(id));
  assert.ok(titles.every(title => typeof title === 'string' && title.trim().length));
  assert.equal(new Set(titles).size, all.length);

  const previous = globalThis.CMPPolishMicrogames;
  const opened = [];
  try {
    globalThis.CMPPolishMicrogames = {open: options => opened.push(options)};
    const order = {waferNumber: 4, input: {slurry_c_pct: 97}, onContinue() {}};
    for (const kind of ['slurry','condition','rotation']) {
      arcade.play(kind, order);
      assert.deepEqual(opened.pop(), {...order, kind});
    }
  } finally {
    if (previous === undefined) delete globalThis.CMPPolishMicrogames;
    else globalThis.CMPPolishMicrogames = previous;
  }
});
