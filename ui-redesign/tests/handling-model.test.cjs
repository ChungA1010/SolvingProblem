const test=require('node:test');
const assert=require('node:assert/strict');
const h=require('../dist/handling-model.js');
function rig(){let now=0,id=0;const callbacks=new Map(),frames=[],completed=[];const player=h.createPlayer({now:()=>now,requestFrame:cb=>{callbacks.set(++id,cb);return id;},cancelFrame:i=>callbacks.delete(i),onFrame:f=>frames.push(f),onComplete:k=>completed.push(k)});return{player,frames,completed,callbacks,step(ms){now=ms;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb());}};}
test('metrology keeps transport, scan, and return ordered without process results',()=>{
  assert.equal(h.frame('measure',0).phase,'to-meter');assert.equal(h.frame('measure',.25).phase,'scan');assert.equal(h.frame('measure',.75).phase,'return');
  for(const k of ['load','unload','measure'])for(const p of [-1,0,.25,.5,.75,1,2,NaN]){const f=h.frame(k,p);assert.ok(f.local>=0&&f.local<=1);assert.deepEqual(Object.keys(f),['kind','phase','progress','local']);}
});
test('finishing and repeated skip complete one action once, with no later callback',()=>{
  const r=rig();r.player.play('measure');const old=[...r.callbacks.values()][0];r.player.finish();r.player.finish();old();assert.deepEqual(r.completed,['measure']);assert.equal(r.frames.at(-1).progress,1);assert.equal(r.callbacks.size,0);
});
test('replacement and cancel invalidate stale transfers without completing an action',()=>{
  const r=rig();r.player.play('load');const old=[...r.callbacks.values()][0];r.player.play('measure');old();assert.equal(r.frames.at(-1).kind,'measure');r.player.cancel();r.step(99999);assert.deepEqual(r.completed,[]);
});
test('normal and reduced motion end at the same presentation state',()=>{
  for(const kind of ['load','unload','measure']){const a=rig(),b=rig();a.player.play(kind);a.step(h.durations[kind]);b.player.play(kind,{reducedMotion:true});assert.deepEqual(a.frames.at(-1),b.frames.at(-1));assert.deepEqual(a.completed,[kind]);assert.deepEqual(b.completed,[kind]);assert.equal(a.callbacks.size+b.callbacks.size,0);}
});
