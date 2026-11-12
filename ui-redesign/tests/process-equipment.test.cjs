const {test}=require('node:test'),assert=require('node:assert/strict');
const u=require('../dist/factory-upgrades.js'),g=require('../dist/game-model.js'),story=require('../dist/customer-story.js'),w=require('../dist/workshop-view.js'),install=require('../dist/install-model.js');
const act=(s,type,extra={})=>g.transition(s,{type,...extra});
const run=(s,duration=130,extra={})=>act(s,'run',{duration,input:g.settings(),...extra});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const legacy=(order=0,equipment={})=>g.restore({version:'factory-v4',order,equipment:u.levels(equipment),events:[]});
function funded(){let s=u.create();for(let i=0;i<5;i++)s=u.transition(s,{type:'income',id:'shipment-'+i,amount:600});return s;}
function finish(s,duration=240){for(let i=0;i<6;i++)s=act(run(s,duration),'advance');s=act(s,'inspect',{count:6});return act(s,'ship');}

test('pad tiers change the calibrated game rate and time preview without double applying after measurement',()=>{
 const base=run(g.create());for(const [pad,factor]of [[1,1.1],[2,1.2]]){
  let s=run(g.create(0,{pad}));near(s.rows[0].rate,base.rows[0].rate*factor);near(s.rows[0].removed,base.rows[0].removed*factor);
  assert.ok(g.recommendation(g.create(0,{pad}),g.settings())<g.recommendation(g.create(),g.settings()));
  s=act(s,'measure');near(g.estimate(s,g.settings()),s.rows[0].rate);near(w.preview(s,g.settings(),130).removal,s.rows[0].removed);
 }
});
test('buying all three modules during an order changes ownership but only the next accepted snapshot changes results',()=>{
 let fund=funded();const current=g.create(1,fund.levels),saved=g.serialize(current),control=run(current);
 for(const id of ['pad','care','endpoint'])fund=u.transition(fund,{type:'buy',id,level:0});
 assert.equal(fund.balance,2160);assert.equal(g.serialize(current),saved);assert.deepEqual(run(current),control);
 const next=g.create(1,fund.levels);assert.equal(next.version,g.economyVersion);assert.deepEqual(g.equipment(next),{environment:0,care:1,pad:1,endpoint:1});
 assert.notEqual(run(next).rows[0].rate,control.rows[0].rate);assert.deepEqual(u.restore(u.serialize(fund)),fund);
 assert.throws(()=>u.transition(fund,{type:'buy',id:'pad',level:0}),/변경/);
});
test('conditioner slows future rate drift but never resets existing pad or conditioner usage',()=>{
 let a=g.create(1),b=g.create(1,{care:2});assert.equal(a.wear,b.wear);
 a=run(a);b=run(b);near(a.rows[0].rate,b.rows[0].rate);assert.equal(a.pad,b.pad);
 for(let i=1;i<6;i++){a=run(act(a,'advance'));b=run(act(b,'advance'));}
 assert.ok(b.rows[5].rate>a.rows[5].rate);assert.equal(g.actions(b).remaining,2);
});
test('saved v4 endpoint retains automatic stops, original error and duration limits',()=>{
 for(const endpoint of [1,2])for(let order=0;order<5;order++){
  let s=legacy(order,{endpoint,pad:1});for(let i=0;i<6;i++){
   s=run(s,240);const r=s.rows.at(-1);assert.equal(r.endpointStopped,true);assert.ok(r.actualDuration<240&&r.actualDuration>0);
   assert.ok(Math.abs(r.error)<(endpoint===1?2.15:1));assert.ok(Math.abs(r.error)>0);
   near(r.removed,r.rate*r.actualDuration/60);s=act(s,'advance');
  }
 }
 const short=run(g.create(0,{endpoint:2}),30).rows[0];assert.equal(short.actualDuration,30);assert.equal(short.endpointStopped,false);assert.equal(short.quality,'under');
});
test('manual stop mode preserves selected duration and rejected sensor inputs do not change a run',()=>{
 const s=g.create(0,{endpoint:1}),off=run(s,240,{endpointEnabled:false}),on=run(s,240);
 near(off.rows[0].rate,on.rows[0].rate);assert.equal(off.rows[0].actualDuration,240);assert.equal(off.rows[0].endpointEnabled,false);assert.equal(off.rows[0].quality,'over');
 assert.throws(()=>run(s,240,{endpointEnabled:'yes'}));assert.equal(s.rows.length,0);
});
test('sensor stop metadata is visible while unmeasured thickness and final quality stay hidden',()=>{
 const s=run(legacy(0,{pad:2,care:2,endpoint:2}),240),row=g.visibleRows(s)[0];
 assert.ok(row.actualDuration<240);assert.equal(row.endpointStopped,true);
 for(const key of ['rate','removed','error','quality'])assert.equal(row[key],null);
 const restored=g.restore(g.serialize(s));assert.deepEqual(restored,s);assert.equal(g.actions(s).remaining,2);assert.equal(s.wallet,100);
 const measured=act(s,'measure');assert.equal(g.actions(measured).remaining,1);assert.equal(measured.wallet,95);near(g.visibleRows(measured)[0].removed,s.rows[0].removed);
});
test('old workshop and game records retain purchases, balances, times and exact calculated results',()=>{
 const old={version:'workshop-v2',events:[{type:'income',id:'old',amount:600},{type:'buy',id:'care',level:0},{type:'buy',id:'sand'},{type:'equip',id:'sand'}]};
 const s=u.restore(old);assert.equal(s.balance,260);assert.equal(s.levels.care,1);assert.equal(s.theme,'sand');assert.equal(s.levels.pad,0);
 const raw={version:'factory-v3',equipment:{environment:1,care:1},order:0,events:[{type:'run',duration:130,input:g.settings()}]};
 const restored=g.restore(raw),expected=74.1*(1-.16*.4)*(1-.08*.25)*(1+Math.sin(20)*.012*.7);
 near(restored.rows[0].rate,expected);assert.equal(g.elapsed(restored.rows[0]),130);assert.equal(restored.rows[0].actualDuration,undefined);
 assert.deepEqual(g.restore(g.serialize(restored)),restored);
 assert.equal(g.restore({...raw,equipment:{...raw.equipment,pad:1}}),null);
});
test('incomplete new equipment records and out-of-range tiers are rejected rather than silently upgraded',()=>{
 const raw=JSON.parse(g.serialize(run(g.create(0,{pad:1,endpoint:1}))));delete raw.equipment.endpoint;assert.equal(g.restore(raw),null);
 for(const key of ['pad','care','endpoint'])assert.throws(()=>g.create(0,{[key]:3}));
});
test('delivery time goal uses actual simulated polishing duration after an endpoint stop',()=>{
 const s=finish(legacy(2,{pad:2,endpoint:2})),evaluation=story.evaluation(s);
 assert.equal(s.rows.reduce((a,r)=>a+r.duration,0),1440);assert.ok(evaluation.value<900);assert.equal(evaluation.achieved,true);
 near(evaluation.value,s.rows.reduce((a,r)=>a+g.elapsed(r),0));
});
test('comparison and replay retain exact equipment snapshots and installation tiers',()=>{
 const a=finish(g.create(0,{pad:1,endpoint:1})),b=finish(g.create(0,{pad:2,endpoint:1})),c=g.restore(g.serialize(a));
 assert.equal(g.comparison(a,b),null);assert.ok(g.comparison(a,c));
 const keys=new Set();for(const id of ['pad','care','endpoint'])for(let level=1;level<=2;level++){const item=install.describe({id},{[id]:level});assert.notEqual(item.key,'decor');keys.add(item.key);}assert.equal(keys.size,6);
});
