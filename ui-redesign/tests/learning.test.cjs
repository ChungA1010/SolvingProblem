const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../dist/engine.js');
const learning=require('../dist/learning-model.js');
const row=(id,input)=>({id,at:'2026-10-31T09:00:00Z',input:{...input},result:engine.calculate(input)});
test('comparisons reject missing records and different recipes, including two Stage A recipes',()=>{
  const a=row('a',engine.defaults());
  assert.equal(learning.compare(a,null).ok,false);
  for(const recipe of ['A123','B456'])assert.equal(learning.compare(a,row('b',engine.defaults(recipe))).ok,false);
});
test('pressure-only comparison uses the unchanged demo math and inverse time relation',()=>{
  const a=row('a',engine.defaults()),b=row('b',{...a.input,pressure:260});
  const c=learning.compare(a,b);
  assert.deepEqual(c.changed.map(x=>x.key),['pressure']);
  assert.ok(c.mrr.value<0);assert.ok(c.time.value>0);
  assert.ok(Math.abs(a.result.mrr*a.result.time-b.result.mrr*b.result.time)<1e-8);
  assert.match(c.explanation,/0.682/);assert.match(c.explanation,/같은 목표 제거량/);
});
test('measurement freshness changes grade without fabricating an MRR or time effect',()=>{
  const a=row('a',engine.defaults()),b=row('b',{...a.input,scenario:'measure10'}),c=learning.compare(a,b);
  assert.equal(c.mrr.value,0);assert.equal(c.time.value,0);
  assert.equal(b.result.grade,'C');assert.match(c.explanation,/A → C/);
  const old=row('old',{...a.input,scenario:'restart'});
  assert.match(learning.compare(a,old).explanation,/정지 효과도 계산하지 않습니다/);
});
test('multiple changed inputs are identified and not attributed to pressure alone',()=>{
  const a=row('a',engine.defaults()),b=row('b',{...a.input,mrr:80,pressure:260,scenario:'measure5'});
  const c=learning.compare(a,b);assert.equal(c.changed.length,3);assert.match(c.explanation,/한 변수만의 영향으로 해석할 수 없습니다/);
  assert.match(learning.compare(a,row('c',{...a.input,mrr:80})).explanation,/장비 압력을 바꾼 실험과는 구분/);
});
test('equal inputs and state-only recipe comparisons stay meaningful',()=>{
  const a=row('a',engine.defaults('A123'));
  assert.equal(learning.compare(a,row('b',a.input)).changed.length,0);
  assert.match(learning.single(a.input,a.result),/그대로 참조/);
});
test('null time and overflowing percentages remain unavailable rather than Infinity',()=>{
  const a=row('a',{...engine.defaults(),mrr:1e-320}),b=row('b',engine.defaults());
  const c=learning.compare(a,b);
  assert.equal(c.time.value,null);assert.equal(c.mrr.percent,null);
  assert.doesNotMatch(JSON.stringify(c),/Infinity|NaN/);
});
test('all three tasks protect fixed inputs and allow only their experimental variable',()=>{
  for(const [id,t] of Object.entries(learning.tasks)){
    const start=learning.taskInput(id),a=row('a',start);
    const changed={recipe:'B456',pressure:260,mrr:90,scenario:'measure10'};
    assert.deepEqual(learning.constrain(changed,id,null),start);
    const next=learning.constrain(changed,id,a);
    for(const field of ['recipe','pressure','mrr','scenario'])assert.equal(next[field],field===t.variable?changed[field]:start[field]);
    const actual=row('b',{...start,[t.variable]:t.suggested});
    assert.equal(learning.assessment(id,a,actual).complete,true);
  }
});
test('prediction feedback follows actual direction; unchanged or confounded experiments do not complete tasks',()=>{
  const a=row('a',learning.taskInput('pressure')),b=row('b',{...a.input,pressure:260});
  assert.equal(learning.assessment('pressure',a,b,'decrease').direction,'decrease');
  assert.match(learning.assessment('pressure',a,b,'increase').message,/다릅니다/);
  assert.equal(learning.assessment('pressure',a,a).complete,false);
  assert.equal(learning.assessment('pressure',a,row('wrong-direction',{...a.input,pressure:270.011})).complete,false);
  assert.equal(learning.assessment('pressure',a,row('c',{...b.input,mrr:80})).complete,false);
  const e=row('e',learning.taskInput('evidence'));
  assert.equal(learning.assessment('evidence',e,row('f',{...e.input,scenario:'measure10'}),'decrease').direction,'decrease');
});
test('record selection preserves order, bounds selection to two and rejects mixed recipes',()=>{
  const a=row('a',engine.defaults()),b=row('b',{...a.input,pressure:260}),c=row('c',a.input),d=row('d',engine.defaults('B456'));
  const rows=[a,b,c,d];
  assert.deepEqual(learning.select(['b'],'a',rows).ids,['b','a']);
  assert.deepEqual(learning.select(['a'],'d',rows).ids,['a']);
  assert.ok(learning.select(['a','b'],'c',rows).message);
  assert.deepEqual(learning.select(['a','b'],'a',rows).ids,['b']);
});
test('comparison, tasks and selection never mutate historical records or input objects',()=>{
  const a=row('a',engine.defaults()),b=row('b',{...a.input,pressure:260}),ids=['a'];
  const before=JSON.stringify({a,b,ids});
  learning.compare(a,b);learning.assessment('pressure',a,b);learning.constrain(b.input,'pressure',a);learning.select(ids,'b',[a,b]);
  assert.equal(JSON.stringify({a,b,ids}),before);
});
