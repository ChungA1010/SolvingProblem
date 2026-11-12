const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../dist/game-model.js');
const act=(s,type,rest={})=>game.transition(s,{type,...rest});
const run=(s,duration=121,input=game.settings())=>act(s,'run',{duration,input});
function finish(s){while(s.rows.length<6){if(s.phase==='result')s=act(s,'advance');s=run(s);}if(s.phase==='result')s=act(s,'advance');return s;}
const settle=s=>act(act(finish(s),'inspect',{count:6}),'ship');

test('measurement and maintenance share two actions; rejected third action cannot spend money or change state',()=>{
  let s=act(game.create(1),'service');assert.deepEqual(game.actions(s),{used:1,limit:2,remaining:1});
  s=act(run(s),'measure');assert.equal(s.wallet,55);assert.equal(game.actions(s).remaining,0);
  const before=game.serialize(s);assert.throws(()=>act(s,'measure'));s=act(s,'advance');
  assert.throws(()=>act(s,'service'),/추가 행동/);s=run(s);assert.throws(()=>act(s,'measure'),/추가 행동/);
  assert.equal(s.wallet,45);assert.equal(s.rows.length,2);assert.equal(game.restore(before).wallet,55);
});
test('two measurements exhaust actions but all remaining wafers and mandatory inspection remain available',()=>{
  let s=act(run(game.create()),'measure');s=act(act(run(act(s,'advance')),'measure'),'advance');
  s=finish(s);assert.equal(s.phase,'inspection');assert.equal(s.wallet,30);assert.equal(game.actions(s).remaining,0);
  s=act(s,'inspect',{count:6});assert.equal(s.inspected,6);assert.equal(s.wallet,30);s=act(s,'ship');assert.equal(s.phase,'settled');
});
test('invalid inputs, early maintenance and duplicate measurements never consume actions',()=>{
  const s=game.create();assert.throws(()=>act(s,'service'));assert.throws(()=>act(s,'measure'));
  for(const d of [0,NaN,Infinity,241,60.5])assert.throws(()=>run(s,d));
  assert.throws(()=>run(s,120,game.settings({pressure:347.893})));assert.throws(()=>run(s,120,game.settings({mrr:9999})));assert.throws(()=>run(s,120,game.settings({wafer_rotation_pct:151})));
  assert.equal(game.actions(s).used,0);assert.equal(s.rows.length,0);
  const measured=act(run(s),'measure');assert.throws(()=>act(measured,'measure'));assert.equal(game.actions(measured).used,1);
});
test('inspection reveals unmeasured results in persisted order and shipping is locked until all six',()=>{
  let s=finish(game.create());assert.ok(game.visibleRows(s).every(r=>r.removed===null));assert.throws(()=>act(s,'ship'));
  assert.throws(()=>act(s,'inspect',{count:0}));assert.throws(()=>act(s,'inspect',{count:7}));
  s=act(s,'inspect',{count:2});assert.equal(game.visibleRows(s).filter(r=>r.removed!==null).length,2);
  s=game.restore(game.serialize(s));assert.equal(s.inspected,2);assert.throws(()=>act(s,'ship'));
  s=act(s,'inspect',{count:4});const wallet=s.wallet,revenue=game.summary(s).revenue;
  assert.throws(()=>act(s,'inspect',{count:1}));s=act(s,'ship');assert.equal(s.wallet,wallet+revenue);assert.throws(()=>act(s,'ship'));
});
test('skipping the reveal yields exactly the same measurements and payout as individual stamps',()=>{
  const base=finish(game.create());let sequential=base;for(let i=0;i<6;i++)sequential=act(sequential,'inspect',{count:1});
  const skipped=act(base,'inspect',{count:6});assert.deepEqual(game.visibleRows(skipped),game.visibleRows(sequential));
  assert.equal(act(skipped,'ship').wallet,act(sequential,'ship').wallet);assert.equal(game.actions(skipped).used,0);
});
test('save replay is deterministic and ignores supplied wallet or inspection fields',()=>{
  const s=act(run(game.create(2)),'measure'),saved=JSON.parse(game.serialize(s));saved.wallet=99999;saved.inspected=6;
  assert.deepEqual(game.restore(saved),s);assert.equal(game.restore('{broken'),null);
  assert.equal(game.restore({...saved,events:[...saved.events,{type:'measure'}]}),null);assert.deepEqual(run(game.create(2)),run(game.create(2)));
});
test('legacy in-progress and settled games preserve unlimited actions, results and balances',()=>{
  let old=game.restore({version:game.legacyVersion,order:1,events:[]});
  for(let i=0;i<6;i++)old=act(act(run(old),'measure'),'advance');
  assert.equal(old.inspected,6);old=act(old,'ship');const restored=game.restore(game.serialize(old));
  assert.deepEqual(restored,old);assert.equal(game.actions(restored).limit,null);assert.equal(restored.spent,30);
  assert.equal(game.actions(game.create(1)).remaining,2);
});
test('measurement updates the estimate and changed settings rescale it without changing the calculation engine',()=>{
  let s=run(game.create()),before=game.estimate(s,game.settings());s=act(s,'measure');
  assert.equal(game.estimate(s,game.settings()),s.rows[0].rate);assert.notEqual(before,s.rows[0].rate);
  assert.ok(game.estimate(s,game.settings({slurry_c_pct:150}))>s.rows[0].rate);
});
test('pre-process clues reflect restart recovery, persistent pad wear and maintenance without leaking an unmeasured result',()=>{
  const start=game.create(2);assert.ok(game.clues(start).some(c=>c.title==='정지 후 첫 가공'));
  const second=act(run(start),'advance');assert.ok(game.clues(second).some(c=>c.title==='재시작 영향 해제'));
  const serviced=act(second,'service');assert.equal(serviced.pad,second.pad);assert.ok(game.clues(serviced).some(c=>c.title==='컨디셔너 교체 후'));
  assert.equal(JSON.stringify(game.clues(second)).includes(String(second.rows[0].rate)),false);
  assert.ok(game.clues(game.create(1)).some(c=>c.title==='컨디셔너 사용량 높음'));
});
test('all five goals remain attainable with no more than two measurements',()=>{
  for(let order=0;order<5;order++){let s=game.create(order);
    for(let i=0;i<6;i++){s=run(s,game.recommendation(s,game.settings()));if(i===(order===2?1:0)||i===3)s=act(s,'measure');s=act(s,'advance');}
    s=act(s,'inspect',{count:6});assert.ok(game.summary(s).good>=3,`order ${order+1}`);s=act(s,'ship');assert.equal(game.actions(s).used,2);assert.deepEqual(game.restore(game.serialize(s)),s);
  }
});
test('completed attempts are archived once, survive restore, and select the previous matching order/rules',()=>{
  const a=settle(game.create()),b=settle(game.create()),c=settle(game.create(1));let archive=[];
  archive=game.archiveSettlement(archive,'run-a','2026-11-05T00:00:00Z',a);
  archive=game.archiveSettlement(archive,'run-a','2026-11-05T00:00:01Z',a);assert.equal(archive.length,1);
  archive=game.archiveSettlement(archive,'run-c','2026-11-05T00:00:02Z',c);
  archive=game.archiveSettlement(archive,'run-b','2026-11-05T00:00:03Z',b);
  const restored=game.restoreArchive(JSON.parse(JSON.stringify(archive)));assert.deepEqual(restored,archive);
  assert.deepEqual(game.previousAttempt(restored,b,'run-b'),a);assert.equal(game.previousAttempt(restored,c,'run-c'),null);
  assert.throws(()=>game.archiveSettlement(archive,'bad','2026-11-05',game.create()));
  assert.deepEqual(game.restoreArchive([{id:'<script>',at:'bad',session:{}},null]),[]);
});
test('comparison explains signed changes in quality, absolute target error and profit, and excludes legacy rules',()=>{
  const before=settle(game.create());let after=game.create();for(let i=0;i<6;i++){after=run(after,135);after=act(after,'advance');}after=act(after,'inspect',{count:6});
  const comparison=game.comparison(after,before);assert.ok(comparison);assert.equal(comparison.delta.good,comparison.after.good-comparison.before.good);
  assert.equal(comparison.after.profit,game.summary(after).revenue-game.summary(after).spent);
  assert.equal(comparison.after.mae,after.rows.reduce((sum,r)=>sum+Math.abs(r.error),0)/6);
  assert.equal(game.comparison(game.create(),before),null);assert.equal(game.comparison(after,{...before,version:game.legacyVersion}),null);
  assert.equal(game.comparison(after,settle(game.create(1))),null);
});
