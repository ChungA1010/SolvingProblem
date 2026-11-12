const {test}=require('node:test');
const assert=require('node:assert/strict');
const u=require('../dist/factory-upgrades.js'),g=require('../dist/game-model.js');
const act=(s,type,rest={})=>g.transition(s,{type,...rest});
const run=s=>act(s,'run',{duration:130,input:g.settings()});
const income=(s,id='run-a',amount=595)=>u.transition(s,{type:'income',id,amount});
const buy=(s,id,level)=>u.transition(s,{type:'buy',id,level});
function settled(levels={}){let s=g.create(0,levels);for(let i=0;i<6;i++)s=act(run(s),'advance');return act(act(s,'inspect',{count:6}),'ship');}

test('workshop income is idempotent across reloads and never alters the order wallet',()=>{
 const order=settled(),summary=g.summary(order),amount=Math.max(0,summary.revenue-summary.spent);
 const initial=u.create(),funded=income(initial,'first',amount),restored=u.restore(u.serialize(funded));
 assert.equal(initial.balance,0);assert.equal(funded.balance,amount);assert.equal(order.wallet,amount+100);
 assert.deepEqual(income(restored,'first',amount),restored);assert.equal(funded.events.length,1);
 assert.throws(()=>income(initial,'bad',-1));assert.throws(()=>income(initial,'bad',601));
});
test('purchases enforce funds, sequential tiers and stale button protection without mutating input',()=>{
 const empty=u.create();assert.throws(()=>buy(empty,'environment'),/부족/);assert.equal(empty.balance,0);
 const funded=income(empty),first=buy(funded,'environment',0);assert.equal(first.balance,415);assert.equal(funded.balance,595);
 assert.throws(()=>buy(first,'environment',0),/변경/);
 const second=buy(first,'environment',1);assert.equal(second.balance,115);assert.throws(()=>buy(second,'environment',2),/부족/);
 const third=buy(income(second,'run-b'),'environment',2);assert.equal(third.levels.environment,3);assert.throws(()=>buy(third,'environment'),/최고/);
});
test('decor must be owned, can be switched without cost, and has no equipment effect',()=>{
 let s=income(u.create());assert.throws(()=>u.transition(s,{type:'equip',id:'slate'}));
 s=buy(s,'slate');assert.equal(s.balance,475);assert.throws(()=>buy(s,'slate'));
 s=u.transition(s,{type:'equip',id:'slate'});s=u.transition(s,{type:'equip',id:'sage'});
 assert.equal(s.balance,475);assert.deepEqual(u.effects(s.levels),u.effects());assert.deepEqual(u.restore(u.serialize(s)),s);
});
test('ledger replay ignores fabricated balances and rejects invalid purchases',()=>{
 const s=buy(income(u.create()),'care'),saved=u.serialize(s);
 assert.deepEqual(u.restore({...saved,balance:99999,levels:{environment:3,care:2}}),s);
 assert.equal(u.restore({version:u.version,events:[{type:'buy',id:'care'}]}),null);
 assert.equal(u.restore({version:'unknown',events:[]}),null);
});
test('environment improvements shrink both positive and negative perturbations, never erase them',()=>{
 for(const order of [0,1]){const initial=g.create(order),base=g.estimate(initial,g.settings())*(1-.16*initial.wear/100)*(1-.08*initial.pad/100);
  let previous=Infinity;for(let tier=0;tier<=3;tier++){const s=run(g.create(order,{environment:tier})),difference=Math.abs(s.rows[0].rate-base);assert.ok(difference>0&&difference<previous);previous=difference;assert.equal(s.wear,initial.wear+4);}
 }
});
test('care reduces future wear without resetting existing wear, pad or two-action limit',()=>{
 const baseline=run(g.create(1)),managed=run(g.create(1,{care:2}));
 assert.equal(managed.rows[0].rate,baseline.rows[0].rate);assert.equal(managed.wear,72.4);assert.equal(managed.pad,baseline.pad);
 assert.equal(g.actions(managed).remaining,2);let s=act(managed,'measure');s=act(act(s,'advance'),'service');
 assert.equal(s.wear,0);assert.equal(s.pad,36.5);assert.equal(g.actions(s).remaining,0);assert.equal(s.wallet,55);
});
test('order equipment is a snapshot: later purchases cannot rewrite calculations or restore',()=>{
 let growth=income(u.create()),old=g.create(0,growth.levels);growth=buy(growth,'environment');
 const upgraded=g.create(0,growth.levels);growth=buy(growth,'care');
 assert.equal(old.version,g.economyVersion);assert.deepEqual(g.equipment(upgraded),{environment:1,care:0,pad:0,endpoint:0});
 const played=run(upgraded);assert.deepEqual(g.restore(g.serialize(played)),played);
 assert.notEqual(played.rows[0].rate,run(old).rows[0].rate);
 assert.equal(g.restore({...JSON.parse(g.serialize(played)),equipment:{environment:4,care:0}}),null);
 assert.equal(g.restore({...JSON.parse(g.serialize(played)),equipment:undefined}),null);
});
test('old rules keep original rates and comparison only uses matching equipment',()=>{
 const s=run(g.create()),expected=74.1*(1-.16*.4)*(1-.08*.25)*(1+Math.sin(20)*.012);
 assert.equal(s.rows[0].rate,expected);assert.deepEqual(g.restore(g.serialize(s)),s);
 const a=settled({environment:1}),b=settled({environment:2}),c=settled({environment:1});
 assert.equal(g.comparison(b,a),null);assert.ok(g.comparison(c,a));
 let archive=g.archiveSettlement([],'a','2026-11-06T00:00:00Z',a);archive=g.archiveSettlement(archive,'b','2026-11-06T00:01:00Z',b);
 assert.deepEqual(g.previousAttempt(archive,c,'c'),a);
});
