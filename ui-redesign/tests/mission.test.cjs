const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../dist/engine.js');
const mission=require('../dist/mission-model.js');

test('mission uses versioned educational model with fixed recipe, baseline and measurement state',()=>{
  for(const pressure of [250.817,260,269.765,270.011]){
    const attempt=mission.evaluate(pressure);
    assert.deepEqual(attempt.input,{...engine.educationalDefaults(),pressure});
    assert.deepEqual(attempt.result,engine.calculate(attempt.input));
  }
});
test('target is attainable within allowed pressure bounds and feedback points toward it',()=>{
  const range=mission.bounds();
  assert.ok(range.min<mission.config.target-mission.config.tolerance);
  assert.ok(range.max>mission.config.target+mission.config.tolerance);
  assert.equal(mission.evaluate(250.817).direction,'low');
  assert.equal(mission.evaluate(269.765).direction,'high');
  assert.equal(mission.evaluate(260).achieved,true);
});
test('mission judging agrees with the displayed hundredths at both tolerance boundaries',()=>{
  const pressureFor=mrr=>269.765*Math.pow(mrr/74.1,1/.682);
  for(const [mrr,success] of [[72.094,false],[72.096,true],[72.10,true],[72.50,true],[72.504,true],[72.506,false]]){
    const result=mission.evaluate(pressureFor(mrr));
    assert.equal(result.achieved,success,`MRR ${mrr}`);
    assert.equal(result.displayed,Math.round(result.result.mrr*100)/100);
  }
});
test('invalid pressures cannot create an attempt or change the prior result and count',()=>{
  const original=mission.run(mission.create()),before=structuredClone(original);
  for(const pressure of [NaN,Infinity,0,250,347.893])assert.throws(()=>mission.run(mission.edit(original,pressure)));
  assert.deepEqual(original,before);
});
test('editing marks results stale without granting success or incrementing attempts',()=>{
  const original=mission.run(mission.create());
  assert.equal(original.attempts,1);assert.equal(mission.isCurrent(original),true);
  const changed=mission.edit(original,270);
  assert.equal(mission.isCurrent(changed),false);assert.equal(changed.attempts,1);
  assert.equal(original.pressure,269.765);
  const retry=mission.run(changed);
  assert.equal(retry.attempts,2);assert.equal(retry.last.achieved,false);
  assert.equal(original.last.achieved,false);
});
test('success closes the round and rejects extra attempts or input edits',()=>{
  const won=mission.run(mission.edit(mission.create(),260)),snapshot=structuredClone(won);
  assert.equal(mission.status(won),'won');
  assert.equal(mission.summary(won).remaining,4);
  assert.equal(mission.summary(won).error,0.04);
  assert.deepEqual(mission.edit(won,270),snapshot);
  assert.throws(()=>mission.run(won));
  assert.deepEqual(won,snapshot);
});
test('five misses exhaust the round; sixth attempt cannot add a trial',()=>{
  let state=mission.create();
  for(let i=0;i<5;i++)state=mission.run(state);
  const snapshot=structuredClone(state);
  assert.equal(state.attempts,5);assert.equal(state.trials.length,5);
  assert.equal(mission.status(state),'lost');assert.equal(mission.summary(state).remaining,0);
  assert.throws(()=>mission.run(state));assert.deepEqual(mission.edit(state,260),snapshot);
  assert.deepEqual(state,snapshot);
});
test('success on the final allowed attempt takes precedence over exhaustion',()=>{
  let state=mission.create();
  for(let i=0;i<4;i++)state=mission.run(state);
  state=mission.run(mission.edit(state,260));
  assert.equal(state.attempts,5);assert.equal(mission.summary(state).remaining,0);
  assert.equal(mission.status(state),'won');assert.equal(mission.summary(state).bestIndex,4);
});
test('attempt log retains the best error when later attempts worsen or tie',()=>{
  let state=mission.run(mission.create());
  const first=structuredClone(state);
  assert.equal(mission.summary(state).error,1.8);
  assert.equal(mission.summary(state).improvement,null);
  state=mission.run(mission.edit(state,265));
  const improved=mission.summary(state);
  assert.ok(improved.improvement>0);assert.equal(improved.bestIndex,1);
  state=mission.run(mission.edit(state,270));
  const worse=mission.summary(state);
  assert.ok(worse.improvement<0);assert.equal(worse.bestError,improved.bestError);
  assert.equal(worse.bestIndex,1);
  state=mission.run(state);assert.equal(mission.summary(state).improvement,0);
  assert.equal(state.trials.length,4);assert.equal(first.trials.length,1);
  const reset=mission.summary(mission.create());
  assert.equal(reset.bestIndex,null);assert.equal(reset.error,null);assert.equal(reset.remaining,5);
});
test('reset is independent of previous attempts and mission actions do not mutate lab data',()=>{
  const lab=engine.defaults('B456'),snapshot=structuredClone(lab);
  const completed=mission.run(mission.edit(mission.create(),260));
  const reset=mission.create();
  assert.equal(reset.attempts,0);assert.equal(reset.last,null);
  assert.equal(completed.attempts,1);assert.deepEqual(lab,snapshot);
  assert.notStrictEqual(mission.inputFor(260),mission.inputFor(260));
});
