const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../dist/engine.js');
const mission=require('../dist/mission-model.js');
const learning=require('../dist/learning-model.js');
const polish=require('../dist/polish.js');
const scene=require('../dist/scene-model.js');
const row=(input,id='sample')=>({id,at:'2026-11-01T10:00:00Z',input,result:engine.calculate(input)});
const frame=input=>polish.frameAt(polish.profile(input,engine.calculate(input),engine.recipes[input.recipe]),3000);

test('100 percent teaching references preserve legacy MRR and time across both recipes',()=>{
  for(const recipe of ['A456','B456'])for(const pressure of [engine.recipes[recipe].min,engine.recipes[recipe].pressure,engine.recipes[recipe].max]){
    const legacy=engine.calculate({...engine.defaults(recipe),pressure});
    const education=engine.calculate({...engine.educationalDefaults(recipe),pressure});
    for(const key of ['mrr','time','grade','evidence'])assert.equal(education[key],legacy[key]);
    assert.equal(education.assumption_based,true);assert.equal(education.model_id,'edu-multi-v1');
  }
});
test('each new variable affects MRR and inverse time without changing pressure evidence',()=>{
  const input=engine.educationalDefaults(),reference=engine.calculate(input);
  for(const f of engine.educationalFields){
    const low=engine.calculate({...input,[f.key]:50}),high=engine.calculate({...input,[f.key]:150});
    assert.ok(low.mrr<reference.mrr&&high.mrr>reference.mrr);
    assert.ok(low.time>reference.time&&high.time<reference.time);
    assert.equal(low.grade,reference.grade);assert.equal(high.evidence,reference.evidence);
    assert.ok(Math.abs(low.time*low.mrr-reference.time*reference.mrr)<1e-8);
  }
});
test('Slurry C teaching function has diminishing increments and is not a sum of lines',()=>{
  const input=engine.educationalDefaults();
  const values=[50,100,150].map(slurry_c_pct=>engine.calculate({...input,slurry_c_pct}).mrr);
  assert.ok(values[1]-values[0]>values[2]-values[1]);
  assert.equal(values[2],74.1*1.2);
});
test('explicit compound example and fractional relative input agree with disclosed equation',()=>{
  const input={...engine.educationalDefaults(),pressure:260,wafer_rotation_pct:120,stage_rotation_pct:80,slurry_c_pct:110.5};
  const expected=74.1*(260/269.765)**.682*1.2**.25*.8**.4*(2*1.105/(1+1.105));
  assert.ok(Math.abs(engine.calculate(input).mrr-expected)<1e-10);
});
test('invalid or missing teaching inputs and unknown model versions cannot silently fall back',()=>{
  for(const f of engine.educationalFields)for(const value of [undefined,null,'100',NaN,Infinity,49.99,150.01]){
    assert.throws(()=>engine.calculate({...engine.educationalDefaults(),[f.key]:value}));
  }
  assert.throws(()=>engine.calculate({...engine.defaults(),model:'edu-multi-v2'}));
  assert.throws(()=>engine.calculate({...engine.defaults(),wafer_rotation_pct:100}));
  assert.throws(()=>engine.educationalDefaults('A123'));
});
test('mixed legacy and educational history round-trip their inputs, results and IDs',()=>{
  const old=row(engine.defaults(),'old');
  const modern=row({...engine.educationalDefaults(),wafer_rotation_pct:110,stage_rotation_pct:80,slurry_c_pct:90},'new');
  assert.deepEqual(engine.restoreHistory(JSON.stringify([old,modern])),[old,modern]);
  assert.deepEqual(engine.restoreHistory(JSON.stringify([{...modern,input:{...modern.input,model:'unknown'}},old])),[old]);
});
test('mission edits all four controls, rejects invalid trials and restores every default',()=>{
  const base=mission.run(mission.create());
  for(const f of engine.educationalFields){
    const changed=mission.edit(base,{[f.key]:120});
    assert.equal(mission.isCurrent(changed),false);assert.equal(changed.attempts,1);
    const run=mission.run(changed);assert.equal(run.attempts,2);assert.equal(run.last.input[f.key],120);
    assert.equal(base[f.key],100);assert.equal(base.trials.length,1);
    assert.throws(()=>mission.run(mission.edit(base,{[f.key]:NaN})));
    assert.equal(mission.create()[f.key],100);
  }
});
test('a non-default multivariable combination can win on the fifth attempt and locks all inputs',()=>{
  const values={wafer_rotation_pct:120,stage_rotation_pct:90};
  const withoutSlurry=engine.calculate(mission.inputFor(values)).mrr;
  const factor=mission.config.target/withoutSlurry;
  values.slurry_c_pct=100*factor/(2-factor);
  let state=mission.create();for(let i=0;i<4;i++)state=mission.run(state);
  state=mission.run(mission.edit(state,values));
  assert.equal(mission.status(state),'won');assert.equal(state.attempts,5);
  assert.deepEqual(mission.edit(state,{wafer_rotation_pct:50,stage_rotation_pct:50,slurry_c_pct:50}),state);
  assert.throws(()=>mission.run(state));assert.equal(state.trials.length,5);
});
test('comparison handles all new fields and blocks mixing calculation models',()=>{
  const a=row(engine.educationalDefaults(),'a');
  for(const f of engine.educationalFields){
    const b=row({...a.input,[f.key]:110},'b'),c=learning.compare(a,b);
    assert.equal(c.ok,true);assert.deepEqual(c.changed,[{key:f.key,label:f.label}]);
    assert.ok(c.mrr.value>0&&c.time.value<0);assert.match(c.explanation,/교육용/);
  }
  const multi=learning.compare(a,row({...a.input,wafer_rotation_pct:110,slurry_c_pct:90}));
  assert.match(multi.explanation,/한 변수만의 영향/);
  const legacy=row(engine.defaults(),'old');assert.equal(learning.compare(a,legacy).ok,false);
  assert.deepEqual(learning.select(['a'],'old',[a,legacy]).ids,['a']);
});
test('guided tasks remain fixed legacy experiments after an educational handoff',()=>{
  const input={...engine.educationalDefaults(),wafer_rotation_pct:150};
  for(const id of Object.keys(learning.tasks)){
    const fixed=learning.constrain(input,id,null);
    assert.equal(engine.isEducational(fixed),false);assert.equal(fixed.wafer_rotation_pct,undefined);
    assert.doesNotThrow(()=>engine.calculate(fixed));
  }
});
test('3D maps independent rotations and slurry while pressure alone controls compression',()=>{
  const input=engine.educationalDefaults(),base=frame(input),a=frame({...input,wafer_rotation_pct:150}),b=frame({...input,stage_rotation_pct:150}),c=frame({...input,slurry_c_pct:150});
  assert.equal(a.rotation,base.rotation*1.5);assert.equal(a.stageRotation,base.stageRotation);
  assert.equal(b.stageRotation,base.stageRotation*1.5);assert.equal(b.rotation,base.rotation);
  assert.equal(c.slurryRatio,1.5);assert.equal(c.rotation,base.rotation);
  assert.equal(scene.geometry(a).padRotation,scene.geometry(base).padRotation);
  assert.equal(scene.geometry(b).headRotation,scene.geometry(base).headRotation);
  for(const f of [a,b,c]){assert.equal(f.compression,base.compression);assert.ok(f.removedFraction>base.removedFraction);}
});
