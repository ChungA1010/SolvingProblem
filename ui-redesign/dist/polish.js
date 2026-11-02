/* Presentation-only polishing playback. Never changes the CMP calculation or records. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPPolish = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function profile(input, result, recipe) {
    if (!recipe || recipe.pressure === null) return null;
    if (![input.pressure, recipe.min, recipe.max, result.mrr, result.baseline].every(Number.isFinite) ||
        recipe.max <= recipe.min || input.pressure < recipe.min || input.pressure > recipe.max ||
        result.mrr <= 0 || result.baseline <= 0) return null;
    const normalized = (input.pressure - recipe.min) / (recipe.max - recipe.min);
    // Amplify the small observed pressure range for legible visual comparison.
    const strength = .2 + .8 * normalized;
    const educational = input.model === 'edu-multi-v1';
    return Object.freeze({ durationMs:6000, strength, normalized, pressure:input.pressure,
      ...(educational ? {waferRatio:input.wafer_rotation_pct/100,stageRatio:input.stage_rotation_pct/100,
        slurryRatio:input.slurry_c_pct/100,removalLevel:clamp((result.mrr/result.baseline-.4)/1.2,0,1)} : {}),
      recipe:input.recipe, ratio:result.mrr / result.baseline });
  }
  function frameAt(profile, elapsedMs) {
    const progress = clamp(elapsedMs / profile.durationMs, 0, 1);
    const engagement = clamp(progress / .15, 0, 1) * (1 - clamp((progress - .85) / .15, 0, 1));
    const removalProgress = clamp((progress - .15) / .7, 0, 1);
    const removedFraction = removalProgress * (.15 + .75 * (profile.removalLevel ?? profile.normalized));
    const compression = (2 + 12 * profile.normalized) * engagement;
    const contacting = progress >= .15 && progress < .85;
    const phase = progress >= 1 ? 'complete' : progress < .15 ? 'approach' : contacting ? 'contact' : 'release';
    return { progress, rotation:-1080 * progress * (profile.waferRatio ?? 1),
      stageRotation:-1080 * progress * (profile.stageRatio ?? 1),slurryRatio:profile.slurryRatio ?? 1,
      phase, engagement, removedFraction, compression,
      filmHeight:24 * (1 - removedFraction),
      padTop:190 + compression,
      carrierBottom:190 + compression - 44 * (1 - engagement),
      padTravel:-180 * removalProgress * (profile.stageRatio ?? 1),
      filmOpacity:.58 * (1 - removedFraction),
      sweepX:Math.sin(progress * Math.PI * 6) * 105,
      contactOpacity:contacting ? .25 + .5 * profile.normalized : 0,
      sweepWidth:35 + 100 * profile.strength };
  }
  function createPlayer({ requestFrame, cancelFrame, now, onFrame, onState }) {
    let handle = null, generation = 0, status = 'idle', current = null;
    function notify(value) { status = value; onState(value, current); }
    function cancel(next = 'stopped') {
      generation++;
      if (handle !== null) cancelFrame(handle);
      handle = null;
      notify(next);
    }
    function reset(next = 'idle') {
      cancel(next); current = null; onFrame(null);
    }
    function start(next, { reducedMotion = false } = {}) {
      cancel('idle');
      current = next;
      if (!current) { reset('unavailable'); return; }
      const token = generation, started = now();
      if (reducedMotion) {
        onFrame(frameAt(current, current.durationMs));
        notify('reduced');
        return;
      }
      notify('running'); onFrame(frameAt(current, 0));
      function tick(timestamp) {
        if (token !== generation) return;
        handle = null;
        const frame = frameAt(current, timestamp - started);
        onFrame(frame);
        if (frame.progress >= 1) notify('completed');
        else handle = requestFrame(tick);
      }
      handle = requestFrame(tick);
    }
    return { start, cancel, reset, getState:() => status };
  }
  return { profile, frameAt, createPlayer };
});

