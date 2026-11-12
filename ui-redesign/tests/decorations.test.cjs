const {test}=require('node:test'),assert=require('node:assert/strict');
const u=require('../dist/factory-upgrades.js'),game=require('../dist/game-model.js'),install=require('../dist/install-model.js');
const act=(s,type,id)=>u.transition(s,{type,id});
const funded=()=>u.transition(u.create(),{type:'income',id:'order-a',amount:600});
test('legacy equipment and purchased colors migrate without losing funds or ownership',()=>{
 const old={version:'workshop-v1',events:[{type:'income',id:'order-old',amount:600},{type:'buy',id:'environment',level:0},{type:'buy',id:'slate'},{type:'equip',id:'slate'}]};
 const s=u.restore(old);assert.equal(s.version,u.version);assert.equal(s.balance,300);assert.equal(s.theme,'slate');assert.deepEqual(s.owned,['sage','slate']);assert.equal(s.levels.environment,1);assert.deepEqual(s.decorOwned,[]);assert.deepEqual(s.placed,[]);
 assert.deepEqual(u.restore(u.serialize(s)),s);assert.equal(u.transition(s,{type:'income',id:'order-old',amount:600}).balance,300);
});
test('furniture is paid for once and storage/reinstallation never spends funds or changes equipment',()=>{
 let s=funded();for(const id of ['task_lamp','storage_cabinet','note_board'])s=act(s,'buy',id);
 assert.equal(s.balance,190);assert.equal(s.placed.length,3);assert.deepEqual(s.levels,{environment:0,care:0,pad:0,endpoint:0});
 const before=s;s=act(s,'store','task_lamp');assert.equal(before.placed.length,3);assert.equal(s.placed.length,2);assert.equal(s.balance,190);
 assert.deepEqual(act(s,'store','task_lamp'),s);s=act(s,'place','task_lamp');assert.deepEqual(act(s,'place','task_lamp'),s);assert.equal(s.balance,190);assert.throws(()=>act(s,'buy','task_lamp'),/보유/);
 assert.deepEqual(u.restore(u.serialize(s)),s);
});
test('ownership, funds, and event validation prevent invalid placements and purchases',()=>{
 const empty=u.create();assert.throws(()=>act(empty,'buy','task_lamp'),/부족/);assert.throws(()=>act(empty,'place','note_board'),/구매/);assert.throws(()=>act(empty,'store','sage'),/구매/);
 assert.throws(()=>act(funded(),'buy','toString'));assert.throws(()=>act(funded(),'buy','missing'));assert.equal(empty.balance,0);assert.equal(empty.events.length,0);
 assert.equal(u.restore({version:u.version,events:[{type:'place',id:'task_lamp'}]}),null);
});

test('surrounding decor has independent fixed slots, survives reload, and does not change process effects',()=>{
 let s=funded();const effects=u.effects(s.levels);
 for(const id of ['floor_plant','wall_clock','wall_shelf'])s=act(s,'buy',id);
 assert.equal(s.balance,230);assert.equal(s.decorOwned.length,3);
 const before=s;s=act(s,'store','floor_plant');assert.equal(before.placed.length,3);
 s=u.restore(u.serialize(s));assert.deepEqual(s.placed,['wall_clock','wall_shelf']);
 s=act(s,'place','floor_plant');assert.equal(s.balance,230);assert.deepEqual(u.effects(s.levels),effects);
 assert.equal(new Set(u.decorations.filter(d=>s.decorOwned.includes(d.id)).map(d=>d.slot)).size,3);
 for(const id of s.decorOwned)assert.equal(install.describe({type:'buy',id},u.appearance(s)).key,id);
});
test('only persisted placed furniture is rendered; props do not affect process results or installation accounting',()=>{
 let s=act(act(funded(),'buy','task_lamp'),'buy','note_board');s=act(s,'store','task_lamp');
 const restored=u.restore({...u.serialize(s),placed:['storage_cabinet'],decorOwned:['storage_cabinet']});assert.deepEqual(restored.placed,['note_board']);
 const appearance=u.appearance(restored);appearance.decor.push('storage_cabinet');assert.deepEqual(restored.placed,['note_board']);
 for(const item of u.decorations)assert.equal(install.describe({type:'buy',id:item.id},u.appearance(s)).key,item.id);
 const run=state=>game.transition(state,{type:'run',input:game.settings(),duration:130});assert.deepEqual(run(game.create(0,s.levels)),run(game.create()));
});
