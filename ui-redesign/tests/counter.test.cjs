const test = require('node:test');
const assert = require('node:assert/strict');
const {createAnimator} = require('../dist/counter.js');
const {formatNumber} = require('../dist/view-model.js');

function harness() {
  let time = 0, id = 0;
  const pending = new Map(), frames = [];
  const counter = createAnimator({write: (value, running) => frames.push({value,running}), now: () => time,
    requestFrame: cb => {pending.set(++id,cb);return id;}, cancelFrame: id => pending.delete(id)});
  function advance(ms) {time+=ms;const callbacks=[...pending.values()];pending.clear();callbacks.forEach(cb=>cb());}
  return {counter,pending,frames,advance};
}

test('count-up lands on the exact calculated result and stops scheduling frames', () => {
  const h=harness(), target=72.294728383;
  h.counter.set(target);h.advance(180);
  assert.ok(h.counter.value()>0 && h.counter.value()<target);
  h.advance(380);
  assert.equal(h.counter.value(),target);
  assert.equal(formatNumber(h.counter.value()),'72.29');
  assert.equal(h.frames.at(-1).running,false);
  assert.equal(h.pending.size,0);
});
test('decreasing counts and negative deltas reach their exact targets', () => {
  const h=harness();h.counter.set(5,{immediate:true});h.counter.set(4);h.advance(100);
  assert.ok(h.counter.value()>4 && h.counter.value()<5);
  h.advance(600);assert.equal(h.counter.value(),4);
  h.counter.set(-1.8);h.advance(600);assert.equal(h.counter.value(),-1.8);
});
test('rapid updates invalidate older callbacks instead of flashing stale results', () => {
  const h=harness();h.counter.set(100);const stale=[...h.pending.values()][0];h.advance(200);
  const current=h.counter.value();h.counter.set(72.3);
  assert.equal(h.counter.value(),current);
  const frameCount=h.frames.length;stale();assert.equal(h.frames.length,frameCount);
  h.advance(600);assert.equal(h.counter.value(),72.3);assert.equal(h.pending.size,0);
});
test('unavailable values cancel playback and never become NaN readouts', () => {
  const h=harness();h.counter.set(74.1);h.advance(100);
  for(const unavailable of [null,NaN,Infinity]) {
    h.counter.set(unavailable);assert.equal(h.counter.value(),null);assert.equal(h.pending.size,0);
    assert.equal(formatNumber(h.counter.value()),'—');
  }
});
test('reduced motion and backgrounded views can show final data immediately', () => {
  const h=harness();h.counter.set(269.765,{immediate:true});
  assert.equal(h.frames.length,1);assert.equal(h.counter.value(),269.765);assert.equal(h.pending.size,0);
  h.counter.set(260);h.advance(100);h.counter.finish();
  assert.equal(h.counter.value(),260);assert.equal(h.pending.size,0);
});
test('entering a previously hidden panel can animate its already available result', () => {
  const h=harness();h.counter.set(74.1,{immediate:true});h.counter.set(74.1,{from:0});
  assert.equal(h.counter.value(),0);h.advance(300);const current=h.counter.value();
  h.counter.set(74.1);assert.equal(h.counter.value(),current);
  h.advance(260);assert.equal(h.counter.value(),74.1);
});
test('scientific values and extreme signed changes keep finite, exact endpoints', () => {
  const h=harness();h.counter.set(1e-9,{immediate:true});
  assert.equal(formatNumber(h.counter.value()),'1.000e-9');
  h.counter.set(1e308,{immediate:true});h.counter.set(-1e308);h.advance(280);
  assert.ok(Number.isFinite(h.counter.value()));h.advance(280);assert.equal(h.counter.value(),-1e308);
  h.counter.set(0);h.counter.cancel();const old=h.counter.value();h.advance(1000);
  assert.equal(h.counter.value(),old);assert.equal(h.pending.size,0);
});
