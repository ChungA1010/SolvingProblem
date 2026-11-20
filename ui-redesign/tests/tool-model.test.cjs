// The learning lab's tool model (lab-3d/tool-model.js) carries numbers copied from the lab simulator's state model
// (lab-sim/state-model-v2.json), because a part of the site loads files from its own folder only. This test fails
// when the two differ: after the state model is fitted again, copy the new numbers into lab-3d/tool-model.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const tool = require('../lab-3d/tool-model.js').model;
const state = JSON.parse(fs.readFileSync(path.join(root, 'lab-sim', 'state-model-v2.json'), 'utf8'));

test('the tool model of the learning lab holds the numbers of the state model it was copied from', () => {
  const recipe = state.recipes[tool.recipe], virtual = state.virtual;
  assert.ok(recipe, `the state model has no recipe ${tool.recipe}`);
  assert.equal(tool.version, state.model_version);
  assert.deepEqual(
    { mu: tool.mu, phi: tool.phi, q: tool.q, r: tool.r, restOffset: tool.restOffset, padOffset: tool.padOffset,
      wearSlope: tool.wearSlope, wearRef: tool.wearRef, padStep: tool.padStep, restGap: tool.restGap },
    { mu: virtual.reversion[tool.recipe].mu, phi: virtual.reversion[tool.recipe].phi, q: recipe.q, r: recipe.r,
      restOffset: recipe.rest_offset, padOffset: recipe.pad_offset,
      wearSlope: virtual.wear[tool.recipe].slope, wearRef: virtual.wear[tool.recipe].ref_usage, padStep: state.pad_step, restGap: state.rest_gap_s });
});

test('the copy says where it came from, and that record is the training part only', () => {
  assert.equal(tool.fittedOn, 'PHM 2016 CMP training partition, chronological folds 1-4');
  assert.ok(state.fitted_on.startsWith(tool.fittedOn), state.fitted_on);
});
