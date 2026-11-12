const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../dist/game-model.js');
const story=require('../dist/customer-story.js');
const act=(s,type,fields={})=>game.transition(s,{type,...fields});
const run=(s,duration)=>act(s,'run',{input:game.settings(),duration});

test('each valid wafer costs 10 once; inspection reveals outcomes and only delivery pays',()=>{
  let state=game.create();
  assert.throws(()=>run(state,0));
  assert.equal(state.wallet,100);
  for(const seconds of [30,130,240,130,240,30]){
    const wallet=state.wallet;
    state=run(state,seconds);
    assert.equal(state.wallet,wallet-10);
    assert.throws(()=>run(state,seconds));
    assert.deepEqual(game.restore(game.serialize(state)),state);
    state=act(state,'advance');
  }
  state=act(state,'inspect',{count:6});
  const bill=game.summary(state);
  assert.equal(state.wallet,40);
  assert.equal(bill.processingCost,60);
  assert.equal(bill.actionCost,0);
  assert.ok(bill.good>0&&bill.good<6);
  assert.equal(bill.revenue,bill.good*100);
  state=act(state,'ship');
  assert.equal(state.wallet,40+bill.good*100);
  assert.throws(()=>act(state,'ship'));
});

test('unsuccessful lots pay zero, while saved v5 lots retain partial pay and free runs',()=>{
  const old=game.restore({version:'factory-v5',order:0,equipment:game.equipment(game.create()),events:[]});
  for(const initial of [old,game.create()]){
    let s=initial;
    for(let i=0;i<6;i++)s=act(run(s,30),'advance');
    s=act(act(s,'inspect',{count:6}),'ship');
    const legacy=initial.version===old.version;
    assert.equal(game.summary(s).revenue,legacy?240:0);
    assert.equal(s.wallet,legacy?340:40);
    assert.deepEqual(game.restore(game.serialize(s)),s);
  }
});

test('optional costs cannot strand unfinished wafers; customer budget only counts measurements and service',()=>{
  let s=act(game.create(1),'service');
  s=act(run(s,130),'advance');
  assert.equal(game.availableForActions(s),10);
  const saved=game.serialize(s);
  assert.throws(()=>act(s,'service'),/가공비/);
  assert.equal(game.serialize(s),saved);
  s=act(act(run(s,130),'measure'),'advance');
  while(s.rows.length<6)s=act(run(s,130),'advance');
  s=act(s,'inspect',{count:6});
  assert.equal(s.wallet,5);
  assert.equal(game.summary(s).spent,95);
  assert.equal(story.evaluation(s).value,35);
});
