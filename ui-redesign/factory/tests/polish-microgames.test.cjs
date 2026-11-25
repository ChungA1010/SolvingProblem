const test = require('node:test');
const assert = require('node:assert/strict');
const {createRound,setControl,advanceRound,periodFor} = require('../polish-microgames.js');

test('each operation requires input and an untimed attempt cannot finish by waiting', () => {
  for (const kind of ['slurry','condition','rotation']) {
    const normal = createRound(kind);
    advanceRound(normal,20);
    assert.equal(normal.phase,'timeout');
    const easy = createRound(kind,1,true);
    advanceRound(easy,20);
    assert.equal(easy.phase,'active');
  }
});

test('valve and gauge are independent until the flow settles at the recipe', () => {
  for (const slurry_c_pct of [50,100,150]) {
    const r = createRound('slurry',1,false,{slurry_c_pct});
    setControl(r,r.target);
    assert.notEqual(r.control,r.actual);
    advanceRound(r,0.35);
    assert.ok(r.actual>0.02 && r.actual<r.target);
    assert.equal(r.phase,'active');
    advanceRound(r,4.8);
    assert.equal(r.phase,'success');
  }
});

test('overshooting then drifting through a band does not complete a dose', () => {
  const r=createRound('slurry');
  setControl(r,1);
  advanceRound(r,2);
  assert.equal(r.stable,0);
  setControl(r,0);
  advanceRound(r,3);
  assert.equal(r.phase,'active');
  assert.equal(r.stable,0);
});

test('every conditioning layout has three distinct radial patches of equal total workload, including across sector zero', () => {
  const layouts = new Set();
  let crossesZero = false;
  for (let wafer = 1; wafer <= 40; wafer++) {
    const {zones} = createRound('condition', wafer);
    assert.deepEqual(zones, createRound('condition', wafer).zones);
    assert.deepEqual(zones, createRound('condition', wafer, true).zones);
    const rings = zones.map(z => z.ring);
    assert.deepEqual(rings, [...new Set(rings)].sort((a,b) => a-b));
    assert.ok(rings.every(ring => ring >= 0 && ring < 5));
    assert.deepEqual(zones.map(z => z.passes).sort(), [1,2,3]);
    assert.equal(zones.flatMap(z => z.remaining).reduce((total, n) => total+n, 0), 14);
    for (const {start, passes, remaining} of zones) {
      assert.ok(start >= 0 && start < 8);
      assert.ok([2,3].includes(remaining.length));
      assert.ok(remaining.every(n => n === passes));
      if (start + remaining.length > 8) crossesZero = true;
    }
    layouts.add(JSON.stringify(zones));
  }
  assert.equal(layouts.size, 40);
  assert.ok(crossesZero);
});

test('only worn material under a contacted shoe changes, once per physical pass despite tapping and changing rings', () => {
  const r = createRound('condition');
  const original = structuredClone(r.zones);
  const heavy = r.zones.find(z => z.passes === 3);
  const cleanRing = [0,1,2,3,4].find(i => !r.zones.some(z => z.ring === i));
  setControl(r, heavy.ring/4);
  advanceRound(r, 1.15); // shoe lifted for a full revolution
  r.contact = true;
  setControl(r, cleanRing/4);
  advanceRound(r, 1.15);
  setControl(r, heavy.ring/4);
  advanceRound(r, 0.05); // sector 7 is clean on this ring
  assert.deepEqual(r.zones, original);

  r.contact = false;
  const windowStart = 2*1.15 + (7 - heavy.start)*1.15/8;
  advanceRound(r, windowStart + 0.02 - r.elapsed);
  r.contact = true;
  advanceRound(r, 1/90);
  assert.deepEqual(heavy.remaining, [2,3]);
  r.contact = false;
  advanceRound(r, 1/90);
  r.contact = true;
  setControl(r, cleanRing/4);
  advanceRound(r, 1/90);
  setControl(r, heavy.ring/4);
  advanceRound(r, 1/90);
  assert.deepEqual(heavy.remaining, [2,3]);

  advanceRound(r, 1.15);
  assert.deepEqual(heavy.remaining, [1,2]);
  advanceRound(r, 1.15);
  assert.deepEqual(heavy.remaining, [0,1]);
  advanceRound(r, 2.4);
  assert.deepEqual(heavy.remaining, [0,0]);
  assert.equal(r.phase, 'active');
  assert.deepEqual(r.zones.filter(z => z !== heavy), original.filter(z => z.passes !== 3));
});

test('all 40 conditioning patterns require every worn patch and can be repaired within the regular 18 seconds', () => {
  for (let wafer = 1; wafer <= 40; wafer++) {
    const r = createRound('condition', wafer);
    r.contact = true;
    for (const zone of r.zones) {
      assert.equal(r.phase, 'active');
      setControl(r, zone.ring/4);
      advanceRound(r, zone.passes*1.15 + 0.04);
      assert.ok(zone.remaining.every(n => n === 0));
    }
    assert.equal(r.phase, 'success');
    assert.ok(r.elapsed < 18);
    const finished = structuredClone(r);
    advanceRound(r, 1);
    assert.deepEqual(r, finished);
  }
});

test('rotation uses recipe-dependent period, and speed must hold across two complete turns', () => {
  for (const stage_rotation_pct of [50,100,150]) {
    const r=createRound('rotation',1,false,{stage_rotation_pct});
    assert.equal(r.target,130/stage_rotation_pct);
    const desired=(periodFor(0)-r.target)/(periodFor(0)-periodFor(1));
    setControl(r,desired);
    advanceRound(r,r.target);
    assert.equal(r.phase,'active');
    advanceRound(r,2*r.target+2);
    assert.equal(r.phase,'success');
    assert.ok(r.stable>=2);
  }
  const r=createRound('rotation');
  setControl(r,(2.95-r.target)/2.25);
  advanceRound(r,1.8);
  assert.ok(r.stable>0);
  setControl(r,0);
  advanceRound(r,0.03);
  assert.equal(r.stable,0);
});

test('fixed steps produce equal flow and rotational progress at 30 and 120 Hz', () => {
  for (const kind of ['slurry','rotation']) {
    const play=hz=>{
      const r=createRound(kind);
      setControl(r,kind==='slurry'?r.target:(2.95-r.target)/2.25);
      for(let i=0;i<hz*3;i++) advanceRound(r,1/hz);
      return r;
    };
    const a=play(30),b=play(120);
    assert.equal(a.phase,b.phase);
    assert.equal(a.stable,b.stable);
    assert.equal(a.actual,b.actual);
  }
});
