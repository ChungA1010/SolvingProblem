const test=require('node:test'),assert=require('node:assert/strict');
const shop=require('../dist/counter-scene.js');
function harness(){let tasks=[],last;const scene=shop.create({schedule:fn=>{tasks.push(fn);return tasks.length;},cancel:()=>{},onChange:value=>last=value});return {scene,tasks,get last(){return last;}};}
test('arrival may be skipped and repeated renders never restart a conversation',()=>{const h=harness();h.scene.enter({id:'a',text:'안녕하세요. 여섯 장 부탁드려요!'});assert.equal(h.last.phase,'arriving');h.scene.next();assert.equal(h.last.phase,'talking');h.scene.next();assert.equal(h.last.index,1);h.scene.enter({id:'a',text:'안녕하세요. 여섯 장 부탁드려요!'});assert.equal(h.last.index,1);h.tasks[0]();assert.equal(h.last.index,1);});
test('stale entrance callbacks cannot change another customer or return from workbench',()=>{const h=harness();h.scene.enter({id:'a',text:'A'});h.scene.leave();h.scene.enter({id:'b',text:'B',delivery:true});h.tasks[0]();assert.equal(h.last.phase,'delivery');assert.equal(h.last.lines[0],'B');h.scene.leave();h.tasks[1]();assert.equal(h.last.visible,false);});
test('reduced motion and questions are immediate and repeated next is bounded',()=>{const h=harness();h.scene.enter({id:'a',text:'원래 주문.',reduced:true});assert.equal(h.tasks.length,0);h.scene.say('질문 답이에요. 두 번째 문장!');for(let i=0;i<5;i++)h.scene.next();assert.equal(h.last.index,1);assert.equal(h.last.last,true);h.scene.destroy();});
test('decimal specifications are not split into separate sentences',()=>{assert.deepEqual(shop.lines('목표는 2.5%예요. 138.0–162.0 nm예요.'),['목표는 2.5%예요.','138.0–162.0 nm예요.']);});
test('customer artwork reflects actual delivery feedback and safely falls back for unknown input',()=>{
  const game=require('../dist/game-model.js'),story=require('../dist/customer-story.js');
  let state=game.create();
  for(let i=0;i<6;i++){
    state=game.transition(state,{type:'run',duration:30,input:game.settings()});
    state=game.transition(state,{type:'advance'});
  }
  state=game.transition(state,{type:'inspect',count:6});
  assert.equal(story.reaction(state),null);
  assert.equal(shop.artwork('research').position,'0% 0');
  state=game.transition(state,{type:'ship'});
  assert.equal(shop.artwork('research',story.reaction(state).mood).position,'100% 0');
  for(const c of story.customers){
    assert.ok(require('node:fs').existsSync(require('node:path').resolve(__dirname,'../dist',shop.artwork(c.id).src)));
    assert.equal(shop.artwork(c.id,'accepted').position,'50% 0');
    assert.equal(shop.artwork(c.id,'delighted').position,'50% 0');
  }
  assert.deepEqual(shop.artwork('unknown','unknown'),shop.artwork('research','neutral'));
});
