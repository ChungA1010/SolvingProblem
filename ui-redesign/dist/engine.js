/* Deliberately non-AI: matches the v0.5 arithmetic demo, not a physical model. */
(function (root) {
  'use strict';
  const recipes = Object.freeze({
    A456: { stage: 'A', anchor: 74.1, time: 114.7, pressure: 269.765, min: 250.817, max: 270.011, normalMin: 268.810, normalMax: 270.011 },
    B456: { stage: 'B', anchor: 81.5, time: 119.3, pressure: 257.814, min: 248.400, max: 270.000, normalMin: 254.321, normalMax: 258.000 },
    A123: { stage: 'A', anchor: 151.1, time: 68.0, pressure: null }
  });
  const scenarios = Object.freeze({ continuous: { age: 1, label: '연속 운전' }, restart: { age: 1, label: '정지 후 재시작' }, measure5: { age: 5, label: '5장마다 측정' }, measure10: { age: 10, label: '10장마다 측정' } });
  // Versioned teaching assumptions, not fitted process coefficients or physical units.
  const educationalModel = 'edu-multi-v1';
  const educationalFields = Object.freeze([
    Object.freeze({key:'wafer_rotation_pct',label:'Wafer 회전',min:50,max:150,default:100}),
    Object.freeze({key:'stage_rotation_pct',label:'Stage 회전',min:50,max:150,default:100}),
    Object.freeze({key:'slurry_c_pct',label:'Slurry C 유량',min:50,max:150,default:100})
  ]);
  const isEducational = input => input.model === educationalModel;
  const modelId = input => input.model || 'pressure-v1';
  function validate(input) {
    const recipe = recipes[input.recipe];
    if (!Object.hasOwn(recipes, input.recipe) || !Object.hasOwn(scenarios, input.scenario)) throw new Error('지원하지 않는 레시피 또는 시나리오입니다.');
    if (typeof input.mrr !== 'number' || !Number.isFinite(input.mrr) || input.mrr <= 0) throw new Error('최근 실측 MRR에 0보다 큰 유한한 숫자를 입력하세요.');
    if (recipe.pressure !== null && (typeof input.pressure !== 'number' || !Number.isFinite(input.pressure) || input.pressure < recipe.min || input.pressure > recipe.max)) throw new Error(`압력은 관측 범위 ${recipe.min.toFixed(3)}–${recipe.max.toFixed(3)} 안에서 입력하세요.`);
    if (recipe.pressure === null && input.pressure !== null) throw new Error('A123에서는 압력을 조작할 수 없습니다.');
    if (input.model !== undefined && input.model !== educationalModel) throw new Error('지원하지 않는 계산 모델 버전입니다.');
    if (isEducational(input)) {
      if (recipe.pressure === null) throw new Error('A123에서는 교육용 다변수 모델을 사용할 수 없습니다.');
      for (const field of educationalFields) {
        const value = input[field.key];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max)
          throw new Error(`${field.label}은 교육용 기준의 ${field.min}–${field.max}% 안에서 입력하세요.`);
      }
    } else if (educationalFields.some(field => Object.hasOwn(input,field.key))) {
      throw new Error('다변수 입력에는 교육용 계산 모델 버전이 필요합니다.');
    }
    return recipe.pressure === null || (input.pressure >= recipe.normalMin && input.pressure <= recipe.normalMax) ? 'normal' : 'observed_shift';
  }
  function calculate(input) {
    const evidence = validate(input), recipe = recipes[input.recipe];
    const factors = {pressure:recipe.pressure === null ? 1 : Math.pow(input.pressure / recipe.pressure, .682)};
    if (isEducational(input)) {
      const q = input.slurry_c_pct / 100;
      factors.wafer_rotation_pct = Math.pow(input.wafer_rotation_pct / 100, .25);
      factors.stage_rotation_pct = Math.pow(input.stage_rotation_pct / 100, .40);
      factors.slurry_c_pct = 2 * q / (1 + q);
    }
    const mrr = Object.values(factors).reduce((value,factor) => value * factor,input.mrr);
    if (!Number.isFinite(mrr) || mrr <= 0) throw new Error('표현 가능한 MRR 범위를 벗어났습니다. 입력값을 줄여 주세요.');
    const duration = recipe.time * recipe.anchor / mrr;
    const age = scenarios[input.scenario].age;
    return { recipe: input.recipe, stage: recipe.stage, mrr, baseline: input.mrr, delta: mrr - input.mrr,
      percent: (mrr / input.mrr - 1) * 100, time: Number.isFinite(duration) && duration > 0 ? duration : null,
      grade: age > 5 ? 'C' : age > 1 || evidence === 'observed_shift' ? 'B' : 'A', evidence,
      age, ai_model_connected: false, illustrative_only: true,
      ...(isEducational(input) ? {model_id:educationalModel,assumption_based:true,factors} : {}) };
  }
  function defaults(recipe = 'A456') {
    const item = recipes[recipe];
    if (!item) throw new Error('Unknown recipe');
    return { recipe, scenario: 'continuous', mrr: item.anchor, pressure: item.pressure };
  }
  function restoreHistory(serialized) {
    try {
      const rows = JSON.parse(serialized || '[]');
      if (!Array.isArray(rows)) return [];
      return rows.filter(row => {
        try { return typeof row.id === 'string' && /^[\w-]{1,100}$/.test(row.id) && Number.isFinite(Date.parse(row.at)) && !!calculate(row.input); }
        catch { return false; }
      }).slice(0, 20).map(row => ({ id: row.id, at: row.at, input: row.input, result: calculate(row.input) }));
    } catch { return []; }
  }
  function educationalDefaults(recipe = 'A456') {
    const input = {...defaults(recipe),model:educationalModel,
      ...Object.fromEntries(educationalFields.map(field => [field.key,field.default]))};
    validate(input); return input;
  }
  const api = Object.freeze({ recipes, scenarios, validate, calculate, defaults, restoreHistory,
    educationalModel,educationalFields,isEducational,modelId,educationalDefaults });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CMPDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
