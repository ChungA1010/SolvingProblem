const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('../dist/game-model.js');
const story=require('../dist/customer-story.js');
function played(index,{duration=132,measure=[],service=false}={}){let state=game.create(index);if(service)state=game.transition(state,{type:'service'});for(let i=0;i<6;i++){state=game.transition(state,{type:'run',duration,input:game.settings()});if(measure.includes(i))state=game.transition(state,{type:'measure'});state=game.transition(state,{type:'advance'});}return state;}
function shipped(index,options){let state=played(index,options);state=game.transition(state,{type:'inspect',count:6});return game.transition(state,{type:'ship'});}

test('five customers include two optional guests and preserve the original five orders',()=>{
  assert.equal(story.customers.length,5);assert.equal(new Set(story.customers.map(c=>c.id)).size,5);assert.equal(story.campaignCount,5);
  assert.equal(story.contract(0).profile.id,story.contract(3).profile.id);assert.equal(story.contract(3).returning,true);
  assert.equal(story.contract(1).profile.id,story.contract(4).profile.id);assert.equal(story.contract(4).returning,true);
  assert.equal(story.contract(2).profile.id,'production');assert.throws(()=>story.contract(7));
});
test('questions use actual order specifications and reveal all scoring rules without spending actions',()=>{
  const state=game.create(),before=game.serialize(state);let asked=[];
  for(let i=0;i<5;i++){const o=game.orders[i];assert.ok(story.answer(i,'spec').includes(`${o.target} nm`));assert.ok(story.answer(i,'spec').includes(`±${o.tolerance}%`));assert.ok(story.answer(i,'priority').includes(story.goalLabel(i)));}
  for(const q of story.questionList)asked=story.ask(asked,q.id);
  asked=story.ask(asked,'spec');assert.equal(asked.length,3);assert.equal(game.serialize(state),before);assert.equal(game.actions(state).remaining,2);assert.equal(state.wallet,100);
  assert.throws(()=>story.ask(asked,'secret'));assert.throws(()=>story.answer(0,'unknown'));
});
test('dialogue survives round trip, accepts legacy absence, rejects invalid keys and mismatched order',()=>{
  const saved=story.serializeDialogue(['spec','spec','priority','<script>'],2);assert.deepEqual(saved.asked,['spec','priority']);
  assert.deepEqual(story.restoreDialogue(JSON.parse(JSON.stringify(saved)),2),['spec','priority']);
  assert.deepEqual(story.restoreDialogue(saved,1),[]);assert.deepEqual(story.restoreDialogue(null,2),[]);
  assert.deepEqual(story.restoreDialogue({...saved,version:'other'},2),[]);
});
test('customer feedback cannot reveal hidden results before all inspection and actual shipment',()=>{
  let s=played(0);assert.equal(story.evaluation(s),null);assert.equal(story.reaction(s),null);
  s=game.transition(s,{type:'inspect',count:2});assert.equal(story.evaluation(s),null);
  s=game.transition(s,{type:'inspect',count:4});assert.ok(story.evaluation(s));assert.equal(story.reaction(s),null);
  s=game.transition(s,{type:'ship'});assert.ok(story.reaction(s));
});
test('research goal uses mean absolute target error rather than cancelling signs',()=>{
  const s=shipped(0);const e=story.evaluation(s);assert.equal(e.value,s.rows.reduce((n,r)=>n+Math.abs(r.error),0)/6);
  const synthetic={...s,rows:s.rows.map((r,i)=>({...r,error:i%2?6:-6,quality:'good'}))};
  assert.equal(story.evaluation(synthetic).value,6);assert.equal(story.reaction(synthetic).mood,'accepted');
});
test('cheap or fast production cannot earn a customer badge when quality fails',()=>{
  for(const index of [1,2]){const s=shipped(index,{duration:30});const r=story.reaction(s);assert.equal(r.goalMet,true);assert.equal(r.qualityMet,false);assert.equal(r.achieved,false);assert.equal(r.mood,'retry');assert.match(r.message,/우선 3장/);}
});
test('startup cost goal counts maintenance and measurement and does not change payout',()=>{
  const s=shipped(1,{duration:116,service:true,measure:[0]});const before=game.serialize(s),balance=s.wallet,r=story.reaction(s);
  assert.equal(r.value,35);assert.equal(r.goalMet,false);assert.match(r.message,/35 P/);assert.equal(game.serialize(s),before);assert.equal(s.wallet,balance);
  const cheap=shipped(1,{duration:130,measure:[0,3]});assert.equal(story.evaluation(cheap).value,10);assert.equal(story.evaluation(cheap).goalMet,true);
});
test('delivery goal sums settings only and is inclusive at 900 seconds',()=>{
  const atLimit=shipped(2,{duration:150});assert.equal(story.evaluation(atLimit).value,900);assert.equal(story.evaluation(atLimit).goalMet,true);
  assert.equal(story.evaluation(shipped(2,{duration:151})).goalMet,false);
  const replay=game.restore(game.serialize(atLimit));assert.deepEqual(story.reaction(replay),story.reaction(atLimit));
});
test('follow-up unlocks preserve earned stars and never require the optional customer badge',()=>{
  const best=[0,0,0,0,0];assert.ok(story.unlocked(best,0));assert.equal(story.nextOrder(best,0),null);
  assert.equal(story.unlocked(best,-1),false);assert.equal(story.unlocked(best,7),false);
  best[0]=1;assert.equal(story.nextOrder(best,0),1);assert.ok(story.unlocked(best,1));assert.equal(story.unlocked(best,2),false);
  best[1]=1;best[2]=1;assert.ok(story.unlocked(best,3));assert.equal(story.contract(3).returning,true);assert.equal(story.nextOrder([3,3,3,3,3],4),null);
});
test('all five additional goals can be met with the existing inputs and two-action rule',()=>{
  for(let index=0;index<5;index++){let state=game.create(index);
    for(let i=0;i<6;i++){const input=game.settings(index===2?{wafer_rotation_pct:110,stage_rotation_pct:110}:{});const probe=game.transition(state,{type:'run',duration:120,input});const duration=Math.round(game.orders[index].target/probe.rows.at(-1).rate*60);state=game.transition(state,{type:'run',duration,input});state=game.transition(state,{type:'advance'});}
    state=game.transition(state,{type:'inspect',count:6});state=game.transition(state,{type:'ship'});assert.equal(story.reaction(state).achieved,true,`order ${index+1}`);assert.equal(game.actions(state).used,0);
  }
});

test('guest invitations and stars stay independent of the five regular orders',()=>{
  const prior=[3,1,0,0,0];
  const best=story.restoreBest(prior);
  assert.deepEqual(best,[3,1,0,0,0,0,0]);
  assert.deepEqual(prior,[3,1,0,0,0]);
  for(const index of [5,6]){
    assert.equal(story.unlocked(story.restoreBest(),index),true);
    best[index]=3;
    assert.equal(story.nextOrder(best,index),null);
    for(const q of story.questionList)assert.ok(story.answer(index,q.id)?.length>10);
  }
  assert.deepEqual(story.restoreBest(best),best);
  assert.equal(story.unlocked(best,3),false);
  assert.equal(story.nextOrder(best,4),null);
});

test('Lee scores the lot range; Jensen scores elapsed time; both use standard payment and saved results',()=>{
  function order(index,durations,rotation){
    let s=game.create(index);
    for(const duration of durations){
      s=game.transition(s,{type:'run',duration,input:game.settings({wafer_rotation_pct:rotation,stage_rotation_pct:rotation})});
      s=game.transition(s,{type:'advance'});
    }
    assert.equal(story.evaluation(s),null);
    s=game.transition(s,{type:'inspect',count:6});
    assert.equal(story.reaction(s),null);
    return game.transition(s,{type:'ship'});
  }
  for(const [index,rotation,seconds,expected] of [[5,100,130,6],[6,120,118,5]]){
    const s=order(index,Array(6).fill(seconds),rotation);
    const r=story.reaction(s);
    const removed=s.rows.map(row=>row.removed);
    const value=index===5?Math.max(...removed)-Math.min(...removed):708;
    assert.equal(r.value,value);assert.equal(r.good,expected);assert.equal(r.mood,'delighted');
    assert.equal(s.wallet,40+100*expected);
    assert.deepEqual(story.reaction(game.restore(game.serialize(s))),r);
    assert.equal(story.reaction(order(index,Array(6).fill(30),rotation)).mood,'retry');
  }
  assert.equal(story.reaction(order(5,[30,130,130,130,130,130],100)).mood,'accepted');
  assert.equal(story.reaction(order(6,Array(6).fill(130),100)).mood,'accepted');
});

test('a walk-in uses the unlocked follow-up or another available customer at every campaign boundary',()=>{
  const firstDay=story.restoreBest();
  assert.equal(story.nextCustomer(firstDay,0),story.campaignCount);
  firstDay[0]=1;
  assert.equal(story.nextCustomer(firstDay,0),1);
  assert.equal(story.nextCustomer(firstDay,story.campaignCount),1);
  for(const best of [firstDay,Array(game.orders.length).fill(3)]){
    for(let i=0;i<game.orders.length;i++){
      const next=story.nextCustomer(best,i);
      assert.ok(story.unlocked(best,next));
      assert.notEqual(story.contract(next).profile.id,story.contract(i).profile.id);
    }
  }
});
