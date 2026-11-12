const {test}=require('node:test'),assert=require('node:assert/strict');
const g=require('../dist/game-model.js'),view=require('../dist/game-guidance.js');
const act=(s,type,extra={})=>g.transition(s,{type,...extra});
const run=(s,duration=g.recommendation(s,g.settings()),extra={})=>act(s,'run',{duration,input:g.settings(),...extra});
const advance=s=>act(s,'advance');
const measure=s=>act(s,'measure');
function finish(s){while(s.rows.length<6){if(s.phase==='result')s=advance(s);s=run(s);}return act(advance(s),'inspect',{count:6});}

test('unmeasured maximum-time endpoint strategy no longer wins any order or tier',()=>{
 for(const endpoint of [1,2])for(let order=0;order<5;order++){
  let s=g.create(order,{endpoint});for(let i=0;i<6;i++){s=run(s,240);assert.equal(s.rows[i].endpointEnabled,false);assert.equal(s.rows[i].actualDuration,240);s=advance(s);}
  assert.equal(g.summary(s).good,0);assert.equal(g.actions(s).used,0);assert.deepEqual(g.restore(g.serialize(s)),s);
 }
});
test('paid measurement enables exactly two or three subsequent runs, with no reset on reload',()=>{
 for(const endpoint of [1,2]){
  let s=advance(measure(run(g.create(0,{endpoint}))));const limit=endpoint===1?2:3;
  assert.equal(g.endpointStatus(s).remaining,limit);
  for(let n=0;n<limit;n++){s=run(g.restore(g.serialize(s)),240);const r=s.rows.at(-1);assert.equal(r.endpointEnabled,true);assert.equal(r.endpointStopped,true);assert.ok(Math.abs(r.error)<4);s=advance(s);}
  assert.equal(g.endpointStatus(s).ready,false);assert.match(g.endpointStatus(s).reason,/만료/);
  s=run(s,140);assert.equal(s.rows.at(-1).endpointEnabled,false);s=advance(measure(s));assert.equal(g.endpointStatus(s).remaining,limit);assert.equal(g.actions(s).remaining,0);
 }
});
test('maintenance, changed inputs and a restart sample invalidate calibration without using extra actions',()=>{
 let s=advance(measure(run(g.create(1,{endpoint:2}))));
 for(const key of ['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct']){const input=g.settings({[key]:key==='pressure'?260:110});assert.equal(g.endpointStatus(s,input).ready,false);const r=run(s,130,{input}).rows.at(-1);assert.equal(r.endpointEnabled,false);}
 assert.equal(g.endpointStatus(s).ready,true);s=act(s,'service');assert.equal(g.endpointStatus(s).ready,false);assert.equal(g.actions(s).remaining,0);
 let restart=advance(measure(run(g.create(2,{endpoint:2}))));assert.match(g.endpointStatus(restart).reason,/재시작/);restart=advance(measure(run(restart)));assert.equal(g.endpointStatus(restart).ready,true);
});
test('calibrated endpoint respects manual off and short time; unmeasured outcomes remain hidden',()=>{
 const s=advance(measure(run(g.create(0,{endpoint:1}))));
 const manual=run(s,240,{endpointEnabled:false});assert.equal(manual.rows.at(-1).actualDuration,240);
 const short=run(s,30);assert.equal(short.rows.at(-1).endpointStopped,false);assert.equal(short.rows.at(-1).quality,'under');
 const automatic=run(s,240),visible=g.visibleRows(automatic).at(-1);assert.equal(visible.endpointStopped,true);assert.equal(visible.removed,null);assert.equal(visible.quality,null);assert.equal(g.actions(automatic).used,1);
});
test('new sensor keeps all orders passable with two visible measurement decisions',()=>{
 for(const endpoint of [1,2])for(let order=0;order<5;order++){
  let s=g.create(order,{endpoint});
  for(let i=0;i<6;i++){s=run(s,g.endpointStatus(s).ready?240:g.recommendation(s,g.settings()));if(i===(order===2?1:0)||i===3)s=measure(s);s=advance(s);}
  assert.ok(g.summary(s).good>=3,`${order}/${endpoint}`);assert.equal(g.actions(s).used,2);
 }
});
test('first-order guide follows real actions, resumes after reload and is optional',()=>{
 let s=g.create();assert.equal(view.tutorial(s).step,1);s=run(s);assert.equal(view.tutorial(s).step,2);assert.doesNotMatch(view.tutorial(s).copy,/138\.6/);
 assert.equal(view.tutorial(advance(s)),null);
 s=measure(s);assert.equal(view.tutorial(s).step,3);assert.match(view.tutorial(s).copy,/138\.6/);s=advance(g.restore(g.serialize(s)));assert.equal(view.tutorial(s).action,'use-recommendation');assert.equal(view.tutorial(s,{applied:true}).action,'process');
 assert.equal(view.tutorial(s,{dismissed:true}),null);assert.equal(view.tutorial(g.create(1)),null);assert.equal(view.tutorial(run(s)),null);
});
test('debrief never leaks hidden results and never credits measurement when skipped',()=>{
 let s=run(g.create());assert.equal(view.debrief(s),null);s=finish(s);const text=view.debrief(s).map(x=>x.text).join(' ');assert.match(text,/측정 0회/);assert.match(text,/생략/);assert.doesNotMatch(text,/잘 연결/);
 const legacy=g.restore({version:'factory-v4',equipment:{environment:0,care:0,pad:0,endpoint:2},order:0,events:[]});let auto=legacy;for(let n=0;n<6;n++)auto=advance(run(auto,240));auto=act(auto,'inspect',{count:6});assert.match(view.debrief(auto)[1].text,/측정으로 시간을 보정한 결과는 아니/);
});
test('feedback uses recorded times, measurements, maintenance and multi-input caveat',()=>{
 let s=advance(measure(run(g.create())));s=run(s,131,{input:g.settings({wafer_rotation_pct:110})});s=finish(s);let text=view.debrief(s).map(x=>x.text).join(' ');assert.match(text,/121 → 131/);assert.match(text,/시간만의 효과/);
 let service=act(g.create(1),'service');service=finish(service);text=view.debrief(service).map(x=>x.text).join(' ');assert.match(text,/정비 1회/);assert.match(text,/정비 뒤/);
});
test('version 1 through 4 histories preserve their serialized rules and replay without new metadata',()=>{
 for(const version of ['factory-v1','factory-v2','factory-v3','factory-v4']){
  const raw={version,order:0,events:[{type:'run',input:g.settings(),duration:130}],...(['factory-v3','factory-v4'].includes(version)?{equipment:{environment:0,care:0,pad:0,endpoint:version==='factory-v4'?1:0}}:{})};
  const s=g.restore(raw);assert.ok(s);assert.equal(s.version,version);assert.equal(s.rows[0].endpointReason,undefined);assert.deepEqual(g.restore(g.serialize(s)),s);
  if(version!=='factory-v4')assert.equal(s.rows[0].removed,74.1*(1-.16*.4)*(1-.08*.25)*(1+Math.sin(20)*.012)*130/60);
 }
});
