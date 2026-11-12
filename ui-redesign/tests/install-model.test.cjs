const {test}=require('node:test'),assert=require('node:assert/strict');
const install=require('../dist/install-model.js'),upgrades=require('../dist/factory-upgrades.js');
function harness(){let time=0,sequence=0,done=0;const callbacks=new Map(),frames=[];const player=install.createPlayer({requestFrame:cb=>{callbacks.set(++sequence,cb);return sequence;},cancelFrame:id=>callbacks.delete(id),now:()=>time,onFrame:f=>frames.push(f),onComplete:()=>done++});return {player,frames,callbacks,get done(){return done;},tick(ms){time=ms;const list=[...callbacks.values()];callbacks.clear();list.forEach(fn=>fn());}};}
test('installation finishes at the exact final position once; skip and replay never touch purchase state',()=>{
 let fund=upgrades.transition(upgrades.create(),{type:'income',id:'qa',amount:600});fund=upgrades.transition(fund,{type:'buy',id:'environment'});const saved=JSON.stringify(fund),h=harness();
 h.player.play();h.tick(1000);assert.equal(h.frames.at(-1).phase,'fit');h.player.finish();h.player.finish();h.tick(5000);
 assert.equal(h.done,1);assert.equal(h.frames.at(-1).lift,0);assert.equal(h.frames.at(-1).slide,0);assert.equal(h.callbacks.size,0);
 h.player.play();h.tick(8600);assert.equal(h.done,2);assert.equal(JSON.stringify(fund),saved);
});
test('closing during installation cancels stale callbacks and a new installation owns its timeline',()=>{
 const h=harness();h.player.play();const stale=[...h.callbacks.values()][0];h.player.cancel();stale();assert.equal(h.done,0);assert.equal(h.callbacks.size,0);
 h.player.play();const old=[...h.callbacks.values()][0];h.player.play();old();h.tick(3600);assert.equal(h.done,1);assert.equal(h.frames.at(-1).progress,1);
});
test('reduced motion completes immediately with no animation loop and the same final geometry',()=>{
 const h=harness();h.player.play({reducedMotion:true});assert.equal(h.done,1);assert.equal(h.callbacks.size,0);assert.deepEqual(h.frames,[install.frame(1)]);
});
test('stages are bounded and every purchasable equipment tier has a distinct installation target',()=>{
 assert.equal(install.frame(-1).progress,0);assert.equal(install.frame(NaN).progress,0);assert.equal(install.frame(2).progress,1);
 const keys=[];for(const id of ['environment','care'])for(let n=1;n<=upgrades.catalog[id].costs.length;n++)keys.push(install.describe({id},{[id]:n}).key);
 assert.equal(new Set(keys).size,5);assert.equal(install.describe({id:'sand'},{theme:'sand'}).key,'decor');
 const before={environment:1,care:0},original=JSON.stringify(before);install.describe({id:'environment'},before);assert.equal(JSON.stringify(before),original);
});
