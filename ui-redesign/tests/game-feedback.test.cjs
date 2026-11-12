const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const audioCode = fs.readFileSync(path.join(__dirname, '../dist/game-feedback.js'), 'utf8');
const transferCode = fs.readFileSync(path.join(__dirname, '../dist/workpiece-transfer.js'), 'utf8');

function events() {
  const listeners = new Map();
  return {
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(callback); },
    fire(name, event = {}) { for (const callback of listeners.get(name) || []) callback(event); }
  };
}

function audioRig({supported=true, stored='false', storageThrows=false, constructorThrows=false}={}) {
  const contexts = [], oscillators = [], writes = [];
  const param = () => ({value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){}});
  const document = {...events(), hidden:false};
  class AudioContext {
    constructor() {
      if (constructorThrows) throw new Error('audio unavailable');
      this.state = 'running'; this.currentTime = 1; this.destination = {}; contexts.push(this);
    }
    createGain() { return {gain:param(), connect(){}, disconnect(){}}; }
    createOscillator() {
      const voice = {frequency:param(), stops:0, connect(){}, disconnect(){}, start(){}, stop(){this.stops++;}};
      oscillators.push(voice); return voice;
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
  }
  const root = {
    ...events(), document,
    localStorage: {
      getItem(){if(storageThrows) throw new Error('storage blocked'); return stored;},
      setItem(key,value){if(storageThrows) throw new Error('storage blocked'); writes.push([key,value]);}
    },
    ...(supported ? {AudioContext} : {})
  };
  vm.runInNewContext(audioCode, root);
  return {root, audio:root.CMPFeedback, document, contexts, oscillators, writes};
}

test('audio requires a real input unlock and unsupported or blocked APIs remain harmless', () => {
  for (const options of [{supported:false}, {constructorThrows:true}]) {
    const r = audioRig(options);
    assert.equal(r.audio.unlock(), false);
    assert.equal(r.audio.play('seat'), false);
    assert.doesNotThrow(() => r.audio.setMuted(true));
  }
  const r = audioRig({storageThrows:true});
  assert.equal(r.audio.play('seat'), false);
  r.document.fire('pointerdown', {isTrusted:false});
  assert.equal(r.contexts.length, 0);
  r.document.fire('keydown', {isTrusted:true});
  assert.equal(r.contexts.length, 1);
  assert.equal(r.audio.play('seat'), true);
  assert.equal(r.audio.play('unknown'), false);
});

test('muting persists, stops active sounds and resumes without blocking the game', () => {
  const r = audioRig();
  r.audio.unlock();
  assert.equal(r.audio.play('deliver'), true);
  const stops = r.oscillators.map(voice=>voice.stops);
  assert.equal(r.audio.setMuted(true), true);
  assert.equal(r.audio.isMuted(), true);
  assert.ok(r.oscillators.every((voice,i)=>voice.stops > stops[i]));
  assert.equal(r.audio.play('lift'), false);
  assert.deepEqual(r.writes.at(-1), ['cmp-factory-muted-v1', 'true']);
  assert.equal(r.audio.setMuted(false), false);
  assert.equal(r.audio.play('scan'), true);
  const restored = audioRig({stored:'true'});
  restored.document.fire('pointerdown', {isTrusted:true});
  assert.equal(restored.contexts.length, 0);
  assert.equal(restored.audio.isMuted(), true);
});

test('background, suspended and failed audio contexts never queue gameplay sounds', async () => {
  const r = audioRig();
  r.audio.unlock(); r.audio.play('start');
  r.document.hidden = true;
  r.document.fire('visibilitychange');
  assert.equal(r.audio.play('seat'), false);
  r.document.hidden = false;
  const context = r.contexts[0];
  context.state = 'suspended';
  context.resume = () => Promise.reject(new Error('autoplay blocked'));
  assert.equal(r.audio.unlock(), true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(r.audio.play('seat'), false);
  context.state = 'running';
  context.createOscillator = () => {throw new Error('device removed');};
  assert.equal(r.audio.play('seat'), false);
  context.state = 'closed';
  assert.equal(r.audio.unlock(), true);
  assert.equal(r.contexts.length, 2);
  assert.equal(r.audio.play('lift'), true);
});

function transferRig(accepted=true, destination='store') {
  const cues = [], drops = [], moved = [], taps = [], timers = [];
  const classList = () => {
    const values = new Set();
    return {add:value=>values.add(value),remove:value=>values.delete(value),toggle:(value,on)=>on?values.add(value):values.delete(value),contains:value=>values.has(value)};
  };
  const area = {dataset:{transferArea:'bench'},querySelectorAll:()=>[target]};
  const makeElement = dataset => ({
    ...events(), dataset, disabled:false, classList:classList(), attributes:{}, offsetWidth:40,
    setAttribute(key,value){this.attributes[key]=value;},getAttribute(key){return this.attributes[key] || null;},
    hasAttribute(key){return key==='data-slot' && this.dataset.slot!==undefined;},
    closest(selector){return selector==='[data-transfer-area]'?area:selector==='[data-drop]'&&this.dataset.drop?this:null;},
    matches:()=>true,getBoundingClientRect:()=>({left:0,top:0,width:40,height:40}),getClientRects:()=>[{}],
    setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured===true;},releasePointerCapture(){this.captured=false;}
  });
  const source = makeElement({wafer:'2'}), target = makeElement({drop:destination});
  target.attributes['aria-label'] = destination;
  let hit = target;
  const document = {
    ...events(), body:{dataset:{}}, getElementById:()=>({textContent:''}),
    querySelectorAll:selector=>selector==='[data-pickup]'?[source]:[target],elementFromPoint:()=>hit
  };
  const window = {...events(),CMPFeedback:{play:name=>cues.push(name)}};
  vm.runInNewContext(transferCode, {window,document,setTimeout:fn=>timers.push(fn)});
  window.CMPTransfers((...args)=>{drops.push(args);return accepted;},value=>moved.push(value),()=>{},value=>taps.push(value));
  const pointer = (type,x=0,y=0) => source.fire(type,{isPrimary:true,button:0,pointerType:'mouse',pointerId:1,clientX:x,clientY:y,target:source});
  const key = name => source.fire('keydown',{key:name,repeat:false,preventDefault(){}});
  return {cues,drops,moved,taps,source,target,document,window,pointer,key,setHit:value=>{hit=value;}};
}

test('a tap stays a tooltip gesture and a successful drag seats only once', () => {
  const tap = transferRig();
  tap.pointer('pointerdown'); tap.pointer('pointerup',3);
  assert.equal(tap.taps.length,1); assert.equal(tap.drops.length,0); assert.deepEqual(tap.cues,[]);
  const drag = transferRig();
  drag.pointer('pointerdown'); drag.pointer('pointermove',20); drag.pointer('pointerup',20);
  drag.pointer('pointerup',20);
  assert.deepEqual(drag.cues,['lift','seat']);
  assert.deepEqual(drag.drops,[['store',2]]);
  assert.ok(drag.target.classList.contains('seated-piece'));
  assert.equal(drag.source.attributes['aria-pressed'],'false');
  assert.equal(drag.document.body.dataset.carrying,undefined);
});

test('rejected, illegal and cancelled drops never play a success cue or mutate the destination', () => {
  const rejected = transferRig(false);
  rejected.pointer('pointerdown'); rejected.pointer('pointermove',20); rejected.pointer('pointerup',20);
  assert.deepEqual(rejected.cues,['lift']);
  assert.ok(rejected.source.classList.contains('returned-piece'));
  for (const cancel of ['Escape','pointercancel','blur','invalid']) {
    const r = transferRig();
    r.pointer('pointerdown'); r.pointer('pointermove',20);
    if(cancel==='Escape') r.document.fire('keydown',{key:'Escape'});
    else if(cancel==='pointercancel') r.document.fire('pointercancel',{pointerId:1});
    else if(cancel==='blur') r.window.fire('blur');
    else r.setHit(null);
    r.pointer('pointerup',20);
    assert.equal(r.drops.length,0,cancel);
    assert.deepEqual(r.cues,['lift'],cancel);
    assert.equal(r.source.attributes['aria-pressed'],'false');
  }
});

test('keyboard delivery uses the same successful action and delivery cue as pointer dragging', () => {
  const r = transferRig(true,'deliver');
  r.key(' '); r.key('ArrowRight'); r.key(' ');
  assert.deepEqual(r.drops,[['deliver',2]]);
  assert.deepEqual(r.cues,['lift','deliver']);
  assert.ok(r.target.classList.contains('seated-piece'));
});
