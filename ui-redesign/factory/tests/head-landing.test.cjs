const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createRound, advance, trigger, zone, pressReading} = require('../head-landing.js');
// Each leg lasts one sweep. An odd leg reads the scale from right to left.
function at(round, fraction, leg = 0) {
  const progress = leg % 2 === 0 ? fraction : 1 - fraction;
  return advance(round, round.wait + round.sweep * (leg + progress));
}

test('one brake distinguishes the same engraved and outer bands on either pass', () => {
  for(let wafer=1;wafer<=6;wafer++){
    const initial=createRound(wafer);
    for(const leg of [0,1]){
      const middle=trigger(at(initial,initial.center,leg));
      assert.equal(middle.phase,'success');
      assert.equal(middle.result,'precise');
      assert.equal(trigger(middle),middle);
      for(const fraction of [initial.center-initial.band*.7,initial.center+initial.band*.7]){
        const outer=trigger(at(initial,fraction,leg));
        assert.equal(outer.phase,'success');assert.equal(outer.result,'good');
      }
    }
  }
});
test('a misplaced brake is early or late relative to the current travel direction', () => {
  const r=createRound();
  assert.equal(trigger(r).result,'before');
  assert.equal(trigger(at(r,r.center-r.band-.02)).result,'early');
  assert.equal(trigger(at(r,r.center+r.band+.02)).result,'late');
  assert.equal(trigger(at(r,r.center+r.band+.02,1)).result,'early');
  assert.equal(trigger(at(r,r.center-r.band-.02,1)).result,'late');
  assert.equal(advance(r,-1),r);
});
test('the unpressed needle bounces at each end and keeps moving at the same speed', () => {
  for(const slow of [false,true]){
    const r=createRound(1,slow);
    for(const lap of [0,1,4,26]){
      for(const [legTime,position] of [[0,0],[.25,.25],[.99,.99],[1,1],[1.01,.99],[1.75,.25],[2,0]]){
        const moving=advance(r,r.wait+(lap*2+legTime)*r.sweep);
        assert.equal(moving.phase,'sweeping');
        assert.ok(Math.abs(moving.fraction-position)<1e-9);
        assert.equal(pressReading(moving),null);
      }
    }
  }
});
test('the cue leads the sweep and timing is independent of render frequency', () => {
  const r=createRound(2);
  assert.equal(advance(r,r.wait-.01).phase,'waiting');
  assert.equal(advance(r,r.wait).phase,'sweeping');
  const elapsed=r.wait+(4-r.center)*r.sweep;
  const exact=advance(r,elapsed);
  let stepped=r;
  for(let i=0;i<90;i++)stepped=advance(stepped,elapsed/90);
  assert.ok(Math.abs(stepped.fraction-exact.fraction)<1e-9);
  assert.equal(zone(stepped),'precise');
});
test('training extends the aim window and requires a deliberate input too', () => {
  const regular=createRound(4), easy=createRound(4,true);
  assert.equal(regular.center,easy.center);
  assert.ok(easy.band*easy.sweep>regular.band*regular.sweep*2);
  assert.equal(advance(easy,99).phase,'sweeping');
  assert.equal(trigger(at(easy,easy.center,3)).phase,'success');
  assert.equal(new Set(Array.from({length:6},(_,i)=>createRound(i+1).center)).size,6);
});

test('the input marker uses the exact judged position and reports distance to the crossed edge', () => {
  const r=createRound();
  const early=trigger(at(r,r.center-r.band-.08));
  const late=trigger(at(r,r.center+r.band+.04));
  assert.equal(pressReading(early),'신호 후 1.21초 · 목표 띠까지 0.20초');
  assert.equal(pressReading(late),'신호 후 1.94초 · 목표 띠를 0.10초 지났어요');
  assert.equal(advance(late,1),late);
  assert.match(pressReading(trigger(at(r,r.center))),/빗금 안/);
  assert.match(pressReading(trigger(at(r,r.center+r.band*.7))),/목표 띠 안/);
});
test('on the returning pass the readout measures time to or past the nearest target edge', () => {
  const r=createRound();
  const early=trigger(at(r,r.center+r.band+.08,3));
  const late=trigger(at(r,r.center-r.band-.04,3));
  assert.match(pressReading(early),/목표 띠까지 0\.20초/);
  assert.match(pressReading(late),/목표 띠를 0\.10초 지났어요/);
  assert.equal(advance(early,10),early);
  assert.equal(trigger(late),late);
});
test('an early waiting press has a record but an unattended sweep and a fresh round do not', () => {
  const r=createRound();
  assert.equal(pressReading(r),null);
  assert.equal(pressReading(at(r,r.center)),null);
  assert.equal(pressReading(trigger(advance(r,r.wait-.3))),'신호 0.30초 전 · 출발 전 입력');
  assert.equal(pressReading(advance(r,10)),null);
});
