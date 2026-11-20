// The state of the tool from wafer to wafer (../tool-model.js) and its place in the process model.
// The expected numbers are worked by hand from the model's parameters; the comments show the arithmetic.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../tool-model.js');
const M = require('../process-model.js');

const m = T.model, C = M.constants;
const near = (actual, expected, tolerance, what) => assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} is not within ${tolerance} of ${expected}`);

test('a tool at its mean, on a pad at the reference usage, leaves the removal rate as it is', () => {
  const tool = T.create({ noise: false });
  const first = tool.next();
  assert.equal(first.ratio, 1);
  assert.equal(first.wafer, 1);
  assert.equal(first.predicted, null, 'nothing has been measured yet');
});

test('pad wear follows the slope of the record: ten wafers later the rate is 0.15 % lower', () => {
  const tool = T.create({ noise: false });
  let last;
  for (let i = 0; i < 11; i++) last = tool.next();
  // usage +10 x 5.925926 = 59.259; wear = -0.00198332 x 59.259 = -0.11753; ratio = 1 - 0.11753 / 77.4407
  near(last.ratio, 0.998482, 1e-6, 'ratio of the eleventh wafer');
  near(tool.status.padUsage, 166.7497 + 11 * 5.925926, 1e-3, 'pad usage');
});

test('the first wafer on a new pad is 1.8 % faster, and the pad starts its wear again', () => {
  const tool = T.create({ noise: false });
  tool.next(); tool.replacePad();
  assert.equal(tool.status.padIsNew, true);
  const first = tool.next(), second = tool.next();
  // first: (1.053307 + -0.00198332 x (0 - 166.7497)) / 77.4407 = (1.053307 + 0.330718) / 77.4407
  near(first.ratio, 1.017872, 1e-6, 'first wafer on the new pad');
  assert.equal(first.afterPadChange, true);
  // second: -0.00198332 x (5.925926 - 166.7497) / 77.4407 = 0.318965 / 77.4407
  near(second.ratio, 1.004119, 1e-6, 'second wafer on the new pad');
  assert.equal(second.afterPadChange, false);
  assert.equal(tool.status.padChanges, 1);
});

test('the first wafer after the tool stood still is 0.46 % faster', () => {
  const tool = T.create({ noise: false });
  near(tool.next({ rested: true }).ratio, 1 + 0.357823 / 77.4407, 1e-6, 'ratio after a rest');
});

test('a tool away from its mean comes back by the learned share each wafer', () => {
  const tool = T.create({ noise: false, level: 85 });
  // 77.4407 + 0.900447 x (85 - 77.4407) = 84.24746; / 77.4407 = 1.087896
  near(tool.next().ratio, 1.087896, 1e-5, 'first wafer');
  // 77.4407 + 0.900447 x (84.24746 - 77.4407) = 83.56985; wear -0.00198332 x 5.925926 = -0.011753
  near(tool.next().ratio, (83.56985 - 0.011753) / 77.4407, 1e-5, 'second wafer');
});

test('measurements move the estimate by the Kalman gain, worked by hand', () => {
  const tool = T.create({ noise: false });
  assert.equal(tool.predict(), null);
  assert.equal(tool.observe(1, 1.05), true);
  // level 1.05 x 77.4407 = 81.3128, variance r = 3.8582. One wafer ahead: 3.8582 + 3.0647 = 6.9228; sd = sqrt(6.9228 + 3.8582) = 3.2834
  const ahead = tool.predict(2);
  near(ahead.ratio, 1.05, 1e-9, 'predicted ratio');
  near(ahead.sd, 3.2834 / 77.4407, 1e-5, 'predicted spread');
  near(ahead.low, (81.3128 - 1.644854 * 3.2834) / 77.4407, 1e-5, 'lower end of the 90 % range');
  near(ahead.high, (81.3128 + 1.644854 * 3.2834) / 77.4407, 1e-5, 'upper end of the 90 % range');
  // second measurement 0.95: z = 73.5687; gain = 6.9228 / (6.9228 + 3.8582) = 0.642134; level = 81.3128 + 0.642134 x (73.5687 - 81.3128) = 76.3400
  assert.equal(tool.observe(2, 0.95), true);
  const after = tool.predict(3);
  near(after.ratio, 76.3400 / 77.4407, 1e-5, 'ratio after the second measurement');
  // variance (1 - 0.642134) x 6.9228 = 2.47744; ahead 2.47744 + 3.06466 = 5.54210; sd = sqrt(5.54210 + 3.85818) = 3.06599
  near(after.sd, 3.06599 / 77.4407, 1e-5, 'spread after the second measurement');
  assert.equal(after.updates, 2);
});

test('the further ahead, the wider the range; an old measurement changes nothing', () => {
  const tool = T.create({ noise: false });
  tool.observe(3, 1.02);
  assert.ok(tool.predict(8).sd > tool.predict(4).sd);
  const before = tool.predict(4);
  assert.equal(tool.observe(3, 0.8), false);
  assert.equal(tool.observe(2, 0.8), false);
  assert.deepEqual(tool.predict(4), before);
  assert.throws(() => tool.observe(5, 0), /positive/);
});

test('the pad offset is taken out of a measurement and put back into a prediction', () => {
  const tool = T.create({ noise: false });
  tool.observe(1, 1 + m.padOffset / m.mu, { afterPadChange: true });          // a tool at its mean, seen on a new pad
  near(tool.predict(2).ratio, 1, 1e-12, 'the wafer after it');
  near(tool.predict(2, { afterPadChange: true }).ratio, 1 + m.padOffset / m.mu, 1e-12, 'another first wafer on a new pad');
  tool.next(); tool.replacePad();
  near(tool.predict().ratio, 1 + m.padOffset / m.mu, 1e-12, 'the next wafer, a pad change pending');
});

test('over many wafers the random tool has the mean, the spread and the memory of the model', () => {
  const tool = T.create({ seed: 7 }), levels = [], ratios = [];
  for (let i = 0; i < 6000; i++) { if (i % 50 === 49) tool.replacePad(); const w = tool.next(); levels.push(w.level); ratios.push(w.ratio); }
  const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
  const mu = mean(levels), sd = Math.sqrt(mean(levels.map(v => (v - mu) ** 2)));
  let lag = 0; for (let i = 1; i < levels.length; i++) lag += (levels[i] - mu) * (levels[i - 1] - mu);
  near(mu, m.mu, 0.6, 'mean level');
  near(sd, Math.sqrt(m.q / (1 - m.phi ** 2)), 0.35, 'spread of the level');           // sqrt(3.0647 / 0.18919) = 4.0248
  near(lag / (levels.length - 1) / (sd * sd), m.phi, 0.03, 'what is left of a deviation one wafer later');
  near(mean(ratios), 1, 0.012, 'mean ratio');
  assert.ok(Math.min(...ratios) > 0.75 && Math.max(...ratios) < 1.25, 'no wafer is wildly off');
});

test('the same seed gives the same tool, another seed another one', () => {
  const run = seed => { const tool = T.create({ seed }); return Array.from({ length: 5 }, () => tool.next().ratio); };
  assert.deepEqual(run(3), run(3));
  assert.notDeepEqual(run(3), run(4));
});

// ----- inside the process model -----
function ready(sim) {
  sim.newWafer();
  for (const [name, value] of [['platen', C.platenRef], ['carrier', C.carrierRef], ['slurry', C.slurryRef], ['conditioner', true]]) sim.setControl(name, value);
  sim.step(12);
}
function press(sim) { assert.equal(sim.moveWafer('head'), true); sim.setControl('head', 1 + C.pressureRef / C.pressureMax); }
function lift(sim) { sim.setControl('head', 0); sim.step(4); }

test('a wafer meets the tool when it is first pressed, not when it is put on the load position', () => {
  const tool = T.create({ noise: false, level: 85 }), sim = M.create({ seed: 1, tool });
  ready(sim); sim.newWafer(); sim.newWafer();
  assert.equal(tool.status.wafers, 0);
  assert.equal(sim.state.level, 1);
  press(sim); sim.step(6);
  assert.equal(tool.status.wafers, 1);
  near(sim.state.level, 1.087896, 1e-5, 'level while polishing');
  assert.equal(sim.state.factors.level, sim.state.level);
  sim.step(6);
  assert.equal(tool.status.wafers, 1, 'one wafer, one draw');
});

test('the removal rate carries the tool state and nothing else changes', () => {
  const rate = tool => { const sim = M.create({ seed: 1, tool }); ready(sim); press(sim); sim.step(20); return sim.state.rate; };
  const plain = rate(null), fast = rate(T.create({ noise: false, level: 85 }));
  near(fast / plain, 1.087896, 2e-3, 'rate with the tool against the rate without');
  near(rate(T.create({ noise: false })) / plain, 1, 1e-9, 'a tool at its mean');
});

test('a measured wafer shows the state it met, and the model takes it in', () => {
  const tool = T.create({ noise: false, level: 85 }), sim = M.create({ seed: 1, tool });
  ready(sim); press(sim); sim.step(60); lift(sim);
  assert.equal(sim.moveWafer('stage'), true);
  const result = sim.measure();
  near(result.tool.observed, 1.087896, 1e-4, 'observed ratio');
  assert.equal(result.tool.predicted, null, 'nothing was known before this wafer');
  near(result.tool.next.ratio, 1.087896, 1e-4, 'what the model now expects of the next wafer');
  assert.equal(tool.status.measured, 1);
  const again = sim.measure();
  assert.equal(tool.status.measured, 1, 'measuring the same wafer twice counts once');
  near(again.tool.observed, result.tool.observed, 1e-12, 'the same wafer, the same answer');
});

test('a wafer that was barely polished says nothing about the tool', () => {
  const tool = T.create({ noise: false }), sim = M.create({ seed: 1, tool });
  ready(sim); press(sim); sim.step(1.5); lift(sim);
  sim.moveWafer('stage');
  assert.equal(sim.measure().tool, undefined);
  assert.equal(tool.status.measured, 0);
});

test('without a tool the model is what it was: no tool entry, level as given', () => {
  const sim = M.create({ seed: 1, level: 0.6 });
  ready(sim); press(sim); sim.step(30); lift(sim); sim.moveWafer('stage');
  assert.equal(sim.state.level, 0.6);
  assert.equal(sim.measure().tool, undefined);
  assert.equal(sim.tool, null);
});

test('the pad is changed only on a tool that stands still with the head up', () => {
  const tool = T.create({ noise: false }), sim = M.create({ seed: 1, tool });
  ready(sim);
  assert.equal(sim.replacePad(), false, 'the platen is turning');
  press(sim); sim.step(30);
  assert.equal(sim.replacePad(), false, 'a wafer is being polished');
  lift(sim); sim.moveWafer('stage');
  for (const name of ['platen', 'carrier', 'slurry']) sim.setControl(name, 0);
  sim.setControl('conditioner', false); sim.step(15);
  assert.equal(sim.replacePad(), true);
  assert.equal(tool.status.padUsage, 0);
  assert.equal(sim.state.coverage, 0, 'a new pad is dry');
  near(sim.state.glaze, M.reference.glaze, 1e-12, 'and broken in');
  ready(sim); press(sim); sim.step(5);
  assert.equal(sim.state.wafer.tool.afterPadChange, true);
  near(sim.state.level, 1.017872, 1e-6, 'first wafer on the new pad');
});

test('a wafer polished after the tool stood still for more than 500 s is marked as the first after a rest', () => {
  const tool = T.create({ noise: false }), sim = M.create({ seed: 1, tool });
  ready(sim); press(sim); sim.step(20); lift(sim);
  sim.newWafer(); press(sim); sim.step(5);
  assert.equal(sim.state.wafer.tool.rested, false, 'the second wafer followed at once');
  lift(sim);
  for (let i = 0; i < 11; i++) sim.step(50);                                   // 550 s
  sim.newWafer(); press(sim); sim.step(5);
  assert.equal(sim.state.wafer.tool.rested, true);
  near(sim.state.level, 1 + (0.357823 - 0.00198332 * 2 * 5.925926) / 77.4407, 1e-6, 'rest offset and the wear of two wafers');
});
