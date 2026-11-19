// Photolithography model of the process lab (dist/process-lab/photo-model.js).
// The image checks use results that follow from diffraction theory itself (a clear mask, symmetry, the energy that
// gets through, the edge of a wide feature), so they test the calculation and not a number copied from somewhere.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/process-lab/photo-model.js');

const C = M.constants;
const at = (image, x) => { let best = 0; for (let i = 1; i < image.x.length; i++) if (Math.abs(image.x[i] - x) < Math.abs(image.x[best] - x)) best = i; return image.intensity[best]; };
const mean = image => { let sum = 0; for (let i = 0; i < image.intensity.length - 1; i++) sum += image.intensity[i]; return sum / (image.intensity.length - 1); };

test('resist thickness follows the spin curve: 1,000 nm at 4,000 rpm, thinner as the square root of the speed', () => {
  assert.equal(M.thickness(4000), 1000);
  assert.ok(Math.abs(M.thickness(1000) - 2000) < 1e-9);
  assert.ok(Math.abs(M.thickness(6000) / M.thickness(1500) - 0.5) < 1e-9);
});

test('a thicker resist needs more dose to clear, by its absorption', () => {
  assert.equal(M.doseToClear(1000), C.resist.clear);
  assert.ok(Math.abs(M.doseToClear(2000) / M.doseToClear(1000) - Math.exp(C.resist.absorption)) < 1e-12);
});

test('a mask with no chrome images as a uniform field of intensity 1, at any focus', () => {
  for (const focus of [0, 2.5]) for (const v of M.aerialImage(focus, { opening: 3000 }).intensity) assert.ok(Math.abs(v - 1) < 1e-9);
});

test('the image is symmetric about the opening and the same on both sides of focus', () => {
  const best = M.aerialImage(0), above = M.aerialImage(1.5), below = M.aerialImage(-1.5), n = best.x.length;
  for (let i = 0; i < n; i++) {
    assert.ok(Math.abs(best.intensity[i] - best.intensity[n - 1 - i]) < 1e-9);
    assert.ok(Math.abs(above.intensity[i] - below.intensity[i]) < 1e-9);
  }
});

test('the light that reaches the wafer is the light the opening lets through, less what the lens cannot collect', () => {
  const duty = C.mask.opening / C.mask.pitch, got = mean(M.aerialImage(0));
  assert.ok(got < duty && got > duty * 0.9, `mean intensity ${got.toFixed(3)} against an opening of ${duty.toFixed(3)}`);
  assert.ok(Math.abs(mean(M.aerialImage(3)) - got) < 1e-6, 'defocus moves light around but does not lose any');
});

test('at the edge of a wide opening the intensity lies between the coherent (1/4) and the incoherent (1/2) value', () => {
  const coherent = at(M.aerialImage(0, { sigma: 0, opening: 6000, pitch: 12000 }), 3000);
  assert.ok(Math.abs(coherent - 0.25) < 0.03, `coherent edge ${coherent.toFixed(3)}`);
  const partial = at(M.aerialImage(0), C.mask.opening / 2);
  assert.ok(partial > 0.2 && partial < 0.5, `edge at sigma 0.5: ${partial.toFixed(3)}`);
  assert.ok(at(M.aerialImage(0), 0) > 0.9 && at(M.aerialImage(0), 1500) < 0.05, 'bright in the opening, dark under the chrome');
});

test('defocus blurs the image: the opening gets dimmer and the chrome edge leaks more light', () => {
  const sharp = M.aerialImage(0), blurred = M.aerialImage(3.5);
  assert.ok(at(blurred, 0) < at(sharp, 0) * 0.9);
  assert.ok(at(blurred, 900) > at(sharp, 900) * 1.5);
});

test('more dose opens the resist wider; too little leaves it closed and far too much leaves no resist', () => {
  const opening = dose => M.develop({ thickness: 1000, dose, focus: 0 });
  assert.equal(opening(40).cleared, false); assert.equal(opening(40).opening, 0);
  let last = 0;
  for (let dose = 70; dose <= 300; dose += 10) { const d = opening(dose); assert.ok(d.opening >= last, `dose ${dose}`); last = d.opening; }
  const sized = Array.from({ length: 150 }, (_, i) => 70 + 2 * i).find(dose => Math.abs(opening(dose).opening - C.target) <= 20);
  assert.ok(sized > 100 && sized < 300, `a dose in the dial's range prints the target: ${sized} mJ/cm2`);
  assert.equal(M.develop({ thickness: 1000, dose: 100000, focus: 0 }).washed, true);
});

test('out of focus, the dose that printed the target no longer does', () => {
  const sized = Array.from({ length: 150 }, (_, i) => 70 + 2 * i).find(dose => Math.abs(M.develop({ thickness: 1000, dose, focus: 0 }).opening - C.target) <= 20);
  const off = M.develop({ thickness: 1000, dose: sized, focus: 3.5 });
  assert.ok(Math.abs(off.opening - C.target) > C.tolerance, `opening at 3.5 um defocus: ${off.opening.toFixed(0)} nm`);
});

test('the cell coats, exposes and develops in that order, and a wafer can be stripped and done again', () => {
  const sim = M.create({ seed: 3 }), s = sim.state, run = seconds => { for (let i = 0; i < seconds * 4; i++) sim.step(0.25); };
  assert.equal(sim.setControl('expose', true), false, 'nothing to expose yet');
  sim.setControl('spin', 2500); assert.equal(sim.setControl('coat', true), true);
  run(10); assert.equal(s.phase, 'coating'); assert.equal(s.rpm, 2500);
  run(90); assert.equal(s.phase, 'coated'); assert.ok(Math.abs(s.thickness - M.thickness(2500)) < 1e-9);
  assert.equal(sim.setControl('develop', true), false, 'not before the exposure');
  sim.setControl('dose', 179); sim.setControl('focus', 0.26);
  assert.equal(s.controls.dose, 180); assert.equal(s.controls.focus, 0.3);
  assert.equal(sim.setControl('expose', true), true); run(5); assert.ok(s.shutter && s.fields > 0 && s.fields < C.times.fields);
  sim.setControl('dose', 300);                                  // turning the dial during the exposure does not change this wafer
  run(60); assert.equal(s.phase, 'exposed'); assert.equal(s.fields, C.times.fields);
  assert.equal(sim.setControl('develop', true), true); run(70);
  assert.equal(s.phase, 'developed'); assert.equal(s.result.dose, 180);
  assert.ok(Math.abs(s.bestFocus) <= C.focusDrift, 'the wafer is in focus somewhere near the zero of the dial');
  const expected = M.develop({ thickness: M.thickness(2500), dose: 180, focus: 0.3 - s.bestFocus }).opening;
  assert.ok(Math.abs(s.result.opening - expected) <= expected * 0.004 + 1e-9, 'the measured opening is the computed one with a little scatter');
  assert.equal(s.result.ok, Math.abs(s.result.opening - C.target) <= C.tolerance);
  assert.equal(sim.setControl('strip', true), true); assert.equal(s.phase, 'bare'); assert.equal(s.result, null); assert.equal(s.reworks, 1);
});

test('dials stay inside their ranges', () => {
  const sim = M.create();
  sim.setControl('spin', 99999); assert.equal(sim.state.controls.spin, C.spin.max);
  sim.setControl('dose', -5); assert.equal(sim.state.controls.dose, C.dose.min);
  sim.setControl('focus', 9); assert.equal(sim.state.controls.focus, C.focus.max);
  assert.equal(sim.setControl('door', 1), false);
});
