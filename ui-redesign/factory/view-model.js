(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPView = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  // Display the actual recipe and an abbreviated stored record ID; no invented lot.
  function logIdentity(row) {
    const id = String(row.id);
    const shortId = id.length > 12 ? id.slice(0, 4) + '…' + id.slice(-6) : id;
    return { run: row.sample ? '예시 · ' + row.result.grade + '등급' : '실험 #' + shortId,
      recipe: row.input.recipe, stage: 'Stage ' + row.result.stage };
  }
  function evidenceLabel(result) {
    const range = result.evidence === 'normal' ? '일반 운전 범위' : '주의 관측 구간';
    return result.recipe === 'A123' ? '상태 참조 · ' + result.age + '장 경과' : range + ' · ' + result.age + '장 경과';
  }
  function formatNumber(value, digits = 2) {
    if (value === null) return '—';
    const tiny = Math.max(1e-4, .5 * Math.pow(10, -digits));
    return Math.abs(value) >= 1e7 || (value !== 0 && Math.abs(value) < tiny)
      ? value.toExponential(3) : value.toFixed(digits);
  }
  function nudgePressure(value, direction, recipe) {
    if (recipe.pressure === null) return null;
    const current = Number.isFinite(value) ? value : recipe.pressure;
    return Math.max(recipe.min, Math.min(recipe.max, Math.round((current + direction * .001) * 1000) / 1000));
  }
  function sampleRows(engine) {
    const rows = [
      { id: 'sample-a456-b', at: '2026-10-29T05:32:18Z', input: { ...engine.defaults('A456'), pressure: 260 } },
      { id: 'sample-b456-a', at: '2026-10-29T05:28:42Z', input: engine.defaults('B456') },
      { id: 'sample-a456-c', at: '2026-10-29T05:21:09Z', input: { ...engine.defaults('A456'), scenario: 'measure10' } },
    ];
    return rows.map(row => ({ ...row, result: engine.calculate(row.input), sample: true }));
  }
  function filterRows(rows, query) {
    const words = String(query || '').trim().toLocaleLowerCase().replace(/\bstage\s+([ab])\b/g, 'stage:$1').split(/\s+/).filter(Boolean);
    return rows.filter(row => {
      const identity = logIdentity(row);
      const text = [identity.run, row.id, row.input.recipe, 'stage:' + row.result.stage, new Date(row.at).toLocaleDateString('sv-SE'), row.result.grade].join(' ').toLocaleLowerCase();
      return words.every(word => text.includes(word));
    });
  }
  return { logIdentity, evidenceLabel, formatNumber, nudgePressure, sampleRows, filterRows };
});
