const test=require('node:test'),assert=require('node:assert/strict');
const game=require('../dist/game-model.js'),view=require('../dist/workshop-view.js');
test('time preview uses the visible estimate, does not reveal hidden wear or unmeasured results',()=>{
  const s=game.create(),before=game.serialize(s),input=game.settings();
  Object.defineProperty(s,'rows',{get(){throw new Error('Hidden results accessed');}});
  Object.defineProperty(s,'wear',{get(){throw new Error('Hidden outcome calculation accessed');}});
  const p=view.preview(s,input,120);
  assert.equal(p.rate,74.1);assert.equal(p.removal,148.2);assert.equal(p.recommendation,121);
  assert.equal(game.serialize(s),before);
});
test('measurement updates the preview but maintenance does not secretly reveal a new removal rate',()=>{
  let s=game.create(1),input=game.settings();
  s=game.transition(s,{type:'run',duration:120,input});s=game.transition(s,{type:'measure'});s=game.transition(s,{type:'advance'});
  const measured=view.preview(s,input,120);
  s=game.transition(s,{type:'service'});
  assert.equal(view.preview(s,input,120).removal,measured.removal);
  const changed=view.preview(s,{...input,wafer_rotation_pct:120},120);
  assert.notEqual(changed.removal,measured.removal);
});
test('invalid time and process input cannot produce an apparently valid preview',()=>{
  for(const seconds of [0,29,241,120.5,NaN,Infinity,'120'])assert.throws(()=>view.preview(game.create(),game.settings(),seconds));
  assert.throws(()=>view.preview(game.create(),game.settings({pressure:347.893}),120));
  const slow=view.preview(game.create(),game.settings({wafer_rotation_pct:50,stage_rotation_pct:50,slurry_c_pct:50}),240);
  assert.ok(Number.isFinite(slow.removal));assert.equal(slow.recommendation,Math.max(30,Math.min(240,Math.round(slow.rawSeconds))));
});
test('playback captions describe approach, contact and release without exposing a result',()=>{
  assert.deepEqual(['approach','contact','release','complete'].map(k=>view.phase(k).step),[0,1,2,2]);
  assert.equal(view.phase('idle'),view.phase('approach'));
});
