const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../dist/engine.js');
const polish = require('../dist/polish.js');
function profileAt(pressure, recipe='A456') {
  const input={...engine.defaults(recipe), pressure};
  return polish.profile(input,engine.calculate(input),engine.recipes[recipe]);
}
function harness() {
  let time=0, nextId=0;
  const callbacks=new Map(), frames=[], states=[];
  const player=polish.createPlayer({now:()=>time,
    requestFrame:cb=>{callbacks.set(++nextId,cb);return nextId;},
    cancelFrame:id=>callbacks.delete(id),
    onFrame:f=>frames.push(f),onState:s=>states.push(s)});
  const advance=ms=>{time+=ms;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(time));};
  return {player,callbacks,frames,states,advance};
}
test('higher pressure visibly removes more illustrative film at equal time without changing spin speed',()=>{
  const low=profileAt(engine.recipes.A456.min), high=profileAt(engine.recipes.A456.max);
  for (const ms of [1000,3000,6000]) {
    const a=polish.frameAt(low,ms), b=polish.frameAt(high,ms);
    assert.ok(b.filmOpacity<a.filmOpacity);
    assert.equal(a.rotation,b.rotation);
    assert.equal(a.progress,b.progress);
  }
  assert.equal(low.durationMs,high.durationMs);
  assert.ok(low.ratio<high.ratio);
});
test('baseline MRR and measurement age do not invent extra pressure effects',()=>{
  const a=engine.defaults(), b={...a,mrr:200,scenario:'measure10'};
  assert.deepEqual(polish.profile(a,engine.calculate(a),engine.recipes.A456),
    polish.profile(b,engine.calculate(b),engine.recipes.A456));
});
test('state-only recipe and invalid pressure cannot create a polishing profile',()=>{
  const a=engine.defaults('A123');
  assert.equal(polish.profile(a,engine.calculate(a),engine.recipes.A123),null);
  assert.equal(polish.profile({...engine.defaults(),pressure:347.893},engine.calculate(engine.defaults()),engine.recipes.A456),null);
});
test('playback completes at six seconds and schedules no more frames',()=>{
  const h=harness();h.player.start(profileAt(260));h.advance(3000);
  assert.equal(h.player.getState(),'running');assert.equal(h.frames.at(-1).progress,.5);
  h.advance(3000);assert.equal(h.player.getState(),'completed');
  assert.equal(h.frames.at(-1).progress,1);assert.equal(h.callbacks.size,0);
});
test('replay invalidates callbacks from the previous run',()=>{
  const h=harness();h.player.start(profileAt(260));
  const stale=[...h.callbacks.values()][0];
  h.player.start(profileAt(270));const count=h.frames.length;stale(6000);
  assert.equal(h.frames.length,count);assert.equal(h.player.getState(),'running');
  h.advance(6000);assert.equal(h.player.getState(),'completed');
});
test('stopping and resetting prevent later frames and clear the illustration',()=>{
  const h=harness();h.player.start(profileAt(260));h.advance(2000);
  h.player.cancel();const count=h.frames.length;h.advance(6000);
  assert.equal(h.frames.length,count);assert.equal(h.player.getState(),'stopped');
  h.player.reset('changed');assert.equal(h.frames.at(-1),null);
  assert.equal(h.player.getState(),'changed');assert.equal(h.callbacks.size,0);
});
test('reduced motion shows the final frame immediately without animation',()=>{
  const h=harness();h.player.start(profileAt(260),{reducedMotion:true});
  assert.equal(h.player.getState(),'reduced');assert.equal(h.frames.at(-1).progress,1);
  assert.equal(h.callbacks.size,0);
});
test('profile creation and playback leave calculated data unchanged',()=>{
  const input={...engine.defaults(),pressure:260},result=engine.calculate(input);
  const before=JSON.stringify({input,result}),h=harness();
  h.player.start(polish.profile(input,result,engine.recipes.A456));h.advance(6000);
  assert.equal(JSON.stringify({input,result}),before);
});

test('film removal begins only after the pad contacts the wafer',()=>{
  const p=profileAt(270.011);
  for(const ms of [0,450,899]) {
    const f=polish.frameAt(p,ms);
    assert.equal(f.phase,'approach'); assert.equal(f.removedFraction,0);
    assert.equal(f.filmHeight,24); assert.equal(f.contactOpacity,0);
    assert.ok(f.carrierBottom<f.padTop);
  }
  const f=polish.frameAt(p,900);
  assert.equal(f.phase,'contact'); assert.equal(f.carrierBottom,f.padTop);
  assert.equal(f.removedFraction,0);
});

test('pad and film maintain contact without intersection while the film thins',()=>{
  for(const name of ['A456','B456']) for(const pressure of [engine.recipes[name].min,engine.recipes[name].max]) {
    const p=profileAt(pressure,name); let previous=24;
    for(const ms of [900,1800,3000,4500,5099]) {
      const f=polish.frameAt(p,ms);
      assert.equal(f.phase,'contact'); assert.equal(f.carrierBottom,f.padTop);
      assert.ok(f.filmHeight<=previous && f.filmHeight>0);
      assert.ok(f.padTop<222); assert.ok(f.contactOpacity>0); previous=f.filmHeight;
    }
  }
});

test('higher pressure gives stronger pad compression and a visibly thinner remaining layer for both stages',()=>{
  for(const name of ['A456','B456']) {
    const low=profileAt(engine.recipes[name].min,name),high=profileAt(engine.recipes[name].max,name);
    const a=polish.frameAt(low,3000),b=polish.frameAt(high,3000);
    assert.equal(a.compression,2); assert.equal(b.compression,14);
    assert.ok(b.contactOpacity>a.contactOpacity); assert.ok(b.filmHeight<a.filmHeight);
    assert.equal(a.padTravel,b.padTravel);
    assert.ok(Math.abs(polish.frameAt(low,6000).filmHeight-20.4)<1e-8);
    assert.ok(Math.abs(polish.frameAt(high,6000).filmHeight-2.4)<1e-8);
  }
});

test('release lifts the wafer off the pad and stops removing the illustrative film',()=>{
  const p=profileAt(270.011),contactEnd=polish.frameAt(p,5100);
  for(const ms of [5400,6000,8000]) {
    const f=polish.frameAt(p,ms);
    assert.equal(f.contactOpacity,0); assert.equal(f.filmHeight,contactEnd.filmHeight);
    assert.ok(f.carrierBottom<f.padTop);
    assert.equal(f.phase,ms<6000?'release':'complete');
  }
  assert.equal(polish.frameAt(p,6000).compression,0);
});

