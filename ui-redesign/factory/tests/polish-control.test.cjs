const test = require('node:test');
const assert = require('node:assert/strict');
const {createRound, advanceRound} = require('../polish-control.js');

test('leaving the pressure control alone times out without any extra ticks after the result', () => {
  const initial = createRound();
  const result = advanceRound(initial, 16, false);
  assert.equal(initial.pressure, 0.3);
  assert.equal(result.phase, 'timeout');
  assert.equal(result.elapsed, 12);
  assert.ok(result.stable < 4);
  assert.equal(advanceRound(result, 1, true), result);
});

test('tracking the moving band can finish all patterns before the deadline', () => {
  for (let wafer = 0; wafer < 6; wafer++) {
    const angle = wafer * 1.43;
    let state = createRound(angle);
    for (let frame = 0; frame < 360 && state.phase === 'active'; frame++) {
      const anticipate = state.pressure + state.speed * 0.12;
      state = advanceRound(state, 1 / 30, anticipate < state.target);
    }
    assert.equal(state.phase, 'success');
    assert.equal(state.stable, 4);
    assert.ok(state.elapsed < 12);
  }
});

test('held and released intervals yield identical pressure, movement and score at 30 and 120 Hz', () => {
  function simulate(hz) {
    let state = createRound(1);
    for (let i = 0; i < hz * 3; i++) {
      const holding = Math.floor(i / (hz / 2)) % 2 === 0;
      state = advanceRound(state, 1 / hz, holding);
    }
    return state;
  }
  const slower = simulate(30), faster = simulate(120);
  for (const key of ['elapsed','stable','pressure','target','speed']) {
    assert.equal(slower[key], faster[key], key);
  }
  assert.ok(slower.pressure >= 0 && slower.pressure <= 1);
});

test('slow calibration offers a fixed wider target without succeeding passively or imposing a deadline', () => {
  for (const untouched of [true,false]) {
    let state = createRound(1.43,true);
    for (let second = 0; second < 20; second++) state = advanceRound(state,1,untouched);
    assert.equal(state.target,0.52);
    assert.equal(state.phase,'active');
    assert.ok(state.elapsed > 19 && state.stable < 1.5);
    assert.ok(state.tolerance > createRound().tolerance);
    for (let frame = 0; frame < 150 && state.phase === 'active'; frame++) {
      state = advanceRound(state,1/30,state.pressure + state.speed * 0.1 < state.target);
    }
    assert.equal(state.phase,'success');
    assert.equal(state.stable,1.5);
  }
});
