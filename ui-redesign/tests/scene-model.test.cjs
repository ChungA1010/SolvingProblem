const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../dist/engine.js');
const polish=require('../dist/polish.js');
const scene=require('../dist/scene-model.js');
function sample(recipe,pressure,ms,options={}) {
  const input={...engine.defaults(recipe),pressure};
  return scene.geometry(polish.frameAt(polish.profile(input,engine.calculate(input),engine.recipes[recipe]),ms),options);
}
test('3D contact keeps the wafer film on the pad without interpenetration in both stages',()=>{
  for(const recipe of ['A456','B456'])for(const pressure of [engine.recipes[recipe].min,engine.recipes[recipe].max]) {
    for(const cutaway of [false,true])for(const ms of [900,1800,3000,5099]) {
      const g=sample(recipe,pressure,ms,{cutaway});
      assert.equal(g.filmBottom,g.padTop);assert.equal(g.gap,0);assert.ok(g.contacting);
      assert.ok(g.waferBottom>g.padTop);assert.ok(g.waferTop>g.waferBottom);assert.ok(g.padHeight>0);
    }
  }
});
test('3D approach and release create a visible gap and do not remove extra material',()=>{
  const p=engine.recipes.A456.max;
  for(const ms of [0,450,899]) {
    const g=sample('A456',p,ms);assert.ok(g.gap>0);assert.equal(g.filmHeight,.006);assert.equal(g.contacting,false);
  }
  const end=sample('A456',p,5100);
  for(const ms of [5400,6000]) {
    const g=sample('A456',p,ms);assert.ok(g.filmBottom>g.padTop);assert.equal(g.filmHeight,end.filmHeight);assert.equal(g.contacting,false);
  }
});
test('high pressure compresses the illustrated pad and removes more film without inventing faster rotation',()=>{
  for(const recipe of ['A456','B456']) {
    const low=sample(recipe,engine.recipes[recipe].min,3000),high=sample(recipe,engine.recipes[recipe].max,3000);
    assert.ok(high.filmHeight<low.filmHeight);assert.ok(high.padHeight<low.padHeight);
    assert.equal(high.padRotation,low.padRotation);assert.equal(high.headRotation,low.headRotation);
  }
});
test('reset restores the raised idle geometry without retaining removed material',()=>{
  const g=scene.geometry(null);
  assert.equal(g.phase,'idle');assert.equal(g.filmHeight,.006);assert.equal(g.gap,.38);
  assert.equal(g.padRotation,0);assert.equal(g.headRotation,0);assert.equal(g.contacting,false);
});
test('3D derivation does not mutate playback frames or calculation records',()=>{
  const input=engine.defaults(),result=engine.calculate(input);
  const frame=polish.frameAt(polish.profile(input,result,engine.recipes.A456),3000);
  const before=JSON.stringify({input,result,frame});scene.geometry(frame);
  assert.equal(JSON.stringify({input,result,frame}),before);
});
test('local pad deformation leaves the distant pad unchanged and matches the wafer contact plane',()=>{
  for(const recipe of ['A456','B456'])for(const pressure of [engine.recipes[recipe].min,engine.recipes[recipe].max]){
    const g=sample(recipe,pressure,3000);
    for(const [x,z] of [[.8,.18],[1.9,.18],[.8,1.3]]){
      const c=scene.padContact(x,z,g.padDepth);
      assert.ok(Math.abs(.48-c.drop-g.padTop)<1e-9);assert.equal(c.dx,0);assert.equal(c.dz,0);
    }
    assert.equal(scene.padContact(-2.8,0,g.padDepth).drop,0);
    assert.equal(scene.padContact(3,0,g.padDepth).drop,0);
    const slope=scene.padContact(2.3,.18,g.padDepth);
    assert.ok(slope.drop>0&&slope.drop<g.padDepth);assert.ok(Number.isFinite(slope.dx));
  }
});
test('pad falloff is continuous at both edges and fully recovers on release',()=>{
  for(const radius of [1.32,1.75]){
    const a=scene.padContact(.8+radius-1e-7,.18,.1),b=scene.padContact(.8+radius+1e-7,.18,.1);
    assert.ok(Math.abs(a.drop-b.drop)<1e-6);assert.ok(Math.abs(a.dx-b.dx)<1e-5);
  }
  const g=sample('A456',engine.recipes.A456.max,6000);
  assert.equal(scene.padContact(.8,.18,g.padDepth).drop,0);
});

test('only the section exaggerates compression and layer thickness, preserving removal fraction and timing',()=>{
  for(const recipe of ['A456','B456'])for(const pressure of [engine.recipes[recipe].min,engine.recipes[recipe].max]){
    for(const ms of [0,900,3000,5100,6000]){
      const overview=sample(recipe,pressure,ms),section=sample(recipe,pressure,ms,{cutaway:true});
      assert.ok(overview.padDepth<=.00150001);assert.ok(section.padDepth<=.10000001);
      assert.ok(Math.abs(overview.filmHeight/overview.filmBaseHeight-section.filmHeight/section.filmBaseHeight)<1e-10);
      assert.equal(overview.phase,section.phase);assert.equal(overview.gap,section.gap);
      assert.equal(overview.padRotation,section.padRotation);assert.equal(overview.headRotation,section.headRotation);
      if(overview.contacting)assert.ok(section.padDepth>overview.padDepth*60);
    }
  }
});

test('view toggles are reversible and never swap backside/frontside stack order',()=>{
  const input=engine.defaults(),result=engine.calculate(input);
  const frame=Object.freeze(polish.frameAt(polish.profile(input,result,engine.recipes.A456),3000));
  const overview=scene.geometry(frame);
  for(const cutaway of [true,false,true,false]){
    const g=scene.geometry(frame,{cutaway});
    assert.equal(g.waferBottom,g.filmBottom+g.filmHeight);
    assert.equal(g.waferTop,g.waferBottom+g.waferHeight);
    assert.ok(g.filmBottom>=g.padTop);
    if(!cutaway)assert.deepEqual(g,overview);
  }
});
