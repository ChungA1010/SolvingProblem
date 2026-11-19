/* The route of the process lab: the eight processes in order, the wafer that travels through them, and what each
 * process leaves on it. No DOM: loaded by the page and by the unit tests (tests/process-lab-flow.test.cjs).
 *
 * The product is a small test chip made in one pass through the eight processes: windows opened in a thermal oxide on
 * a p-type wafer, an n+ junction implanted through them, the windows lined and filled with metal and polished flat.
 *
 * A process that has its own equipment in the lab is run by the operator, and its measured result goes onto the wafer
 * (so far: oxidation). Every other process is passed with the STANDARD recipe below. Those numbers are assumed, typical
 * values that keep the route going; they are not computed from a model, and the page says so wherever it shows them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabFlow = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STEPS = [
    { id: 'wafer', name: '웨이퍼 제조', does: '실리콘 결정을 길러 얇게 자르고 닦아 웨이퍼를 만듭니다.' },
    { id: 'oxidation', name: '산화', does: '웨이퍼 표면에 산화막(SiO₂)을 기릅니다. 뒤 공정에서 마스크와 절연막이 됩니다.', equipment: true },
    { id: 'photo', name: '포토', does: '감광막을 바르고 빛으로 무늬를 옮깁니다.' },
    { id: 'etch', name: '식각', does: '감광막이 열린 자리의 산화막을 깎아 창을 냅니다.' },
    { id: 'deposition', name: '증착·이온주입', does: '창으로 이온을 넣어 접합을 만들고, 창 안에 얇은 막을 입힙니다.' },
    { id: 'metal', name: '금속배선', does: '창을 금속으로 채우고 평탄하게 갈아 전기가 통하는 길을 만듭니다.' },
    { id: 'eds', name: 'EDS', does: '웨이퍼 위의 칩을 하나씩 전기로 검사해 양품을 가립니다.' },
    { id: 'package', name: '패키징', does: '양품 칩을 잘라 기판에 붙이고 선을 이은 뒤 감쌉니다.' },
  ];
  const SPEC = { oxide: { target: 500, tolerance: 25 } };            // nm: what the run sheet asks of the oxidation step
  const STANDARD = {                                                // assumed results of the standard recipes
    substrate: { type: 'p', orientation: '(100)', diameter: 300, resistivity: 10 },   // mm, ohm cm
    oxide: 500,                                                     // nm
    resist: 1000, opening: 1000, pitch: 3000,                       // nm
    etchReach: 600,                                                 // nm of oxide the fixed-time etch clears: 500 nm plus 20% over-etch
    selectivity: 20,                                                // oxide etched per silicon etched, once the window is open
    junction: 300, liner: 30,                                       // nm
    die: 20, edge: 3,                                               // mm: die size and the edge of the wafer that holds no chips
  };
  const nm = v => `${Math.round(v).toLocaleString('en-US')} nm`;

  /** Centres (mm) of the whole dies that fit on the wafer. */
  function dies() {
    const size = STANDARD.die, reach = STANDARD.substrate.diameter / 2 - STANDARD.edge, list = [];
    for (let row = -8; row < 8; row++) for (let col = -8; col < 8; col++) {
      const x = (col + 0.5) * size, y = (row + 0.5) * size;
      if (Math.hypot(Math.abs(x) + size / 2, Math.abs(y) + size / 2) <= reach) list.push({ x, y });
    }
    return list;
  }
  const DIE_COUNT = dies().length;

  const empty = () => ({ substrate: null, oxide: 0, resist: null, window: null, junction: null, liner: 0, metal: null, tested: null, packaged: null });

  /** What a process leaves on the wafer. `result` is the operator's measured result, or nothing for the standard recipe. */
  function apply(id, wafer, result) {
    const w = { ...wafer }, by = result ? 'operator' : 'standard';
    let text, ok = null;
    if (id === 'wafer') {
      w.substrate = { ...STANDARD.substrate };
      text = `p형 ${w.substrate.orientation} ${w.substrate.diameter} mm 웨이퍼, 비저항 ${w.substrate.resistivity} Ω·cm`;
    } else if (id === 'oxidation') {
      w.oxide = result ? result.mean : STANDARD.oxide;
      ok = Math.abs(w.oxide - SPEC.oxide.target) <= SPEC.oxide.tolerance;
      text = result ? `산화막 ${nm(w.oxide)} (목표 ${SPEC.oxide.target} ± ${SPEC.oxide.tolerance} nm)${result.how ? ` · ${result.how}` : ''}` : `산화막 ${nm(w.oxide)}`;
    } else if (id === 'photo') {
      w.resist = { thickness: STANDARD.resist, opening: STANDARD.opening };
      text = `감광막 ${nm(STANDARD.resist)}, 너비 ${nm(STANDARD.opening)}의 창 무늬`;
    } else if (id === 'etch') {
      const open = w.oxide <= STANDARD.etchReach, depth = Math.min(w.oxide, STANDARD.etchReach);
      w.window = { width: STANDARD.opening, depth, open, left: w.oxide - depth, siliconLoss: open ? (STANDARD.etchReach - w.oxide) / STANDARD.selectivity : 0 };
      w.resist = null; ok = open;
      text = open ? `산화막에 창을 냄 · 실리콘 ${nm(w.window.siliconLoss)} 깎임` : `창이 다 뚫리지 않음 · 바닥에 산화막 ${nm(w.window.left)} 남음`;
    } else if (id === 'deposition') {
      const open = Boolean(w.window && w.window.open);
      w.junction = open ? { depth: STANDARD.junction, species: 'P' } : null;
      w.liner = STANDARD.liner; ok = w.window ? open : null;
      text = open ? `n+ 접합 깊이 ${nm(STANDARD.junction)}, 창 안에 장벽막 ${nm(STANDARD.liner)}` : `남은 산화막이 이온을 막아 접합이 생기지 않음 · 장벽막 ${nm(STANDARD.liner)}`;
    } else if (id === 'metal') {
      w.metal = { planar: true };
      text = '창을 금속으로 채우고 산화막 높이까지 평탄화';
    } else if (id === 'eds') {
      const connected = Boolean(w.junction);
      w.tested = { total: DIE_COUNT, good: connected ? DIE_COUNT : 0, reason: connected ? null : '접촉 창이 열리지 않아 금속이 실리콘에 닿지 않음' };
      ok = connected;
      text = connected ? `칩 ${DIE_COUNT}개 모두 양품` : `칩 ${DIE_COUNT}개 모두 불량 · ${w.tested.reason}`;
    } else if (id === 'package') {
      const good = w.tested ? w.tested.good : 0;
      w.packaged = { chips: good }; ok = good > 0;
      text = good ? `양품 칩 ${good}개를 잘라 패키지에 넣음` : '패키징할 양품 칩이 없음';
    } else throw new Error(`unknown process: ${id}`);
    return { wafer: w, record: { step: id, by, text, ok } };
  }

  /** The wafer as it arrives at step `index` when everything before went by the standard recipe. */
  function arriving(index) {
    let wafer = empty();
    for (let i = 0; i < index; i++) wafer = apply(STEPS[i].id, wafer).wafer;
    return wafer;
  }

  /** A run that starts at the given process. The processes before it are filled in with the standard recipe. */
  function createRun(startId) {
    const start = STEPS.findIndex(step => step.id === startId);
    if (start < 0) throw new Error(`unknown process: ${startId}`);
    const run = { start, at: start, wafer: empty(), records: [], finished: false };
    for (let i = 0; i < start; i++) { const out = apply(STEPS[i].id, run.wafer); run.wafer = out.wafer; run.records.push({ ...out.record, before: true }); }
    return run;
  }
  /** Finishes the current process of the run, with the operator's result or by the standard recipe, and moves on. */
  function complete(run, result) {
    if (run.finished) return null;
    const out = apply(STEPS[run.at].id, run.wafer, result);
    run.wafer = out.wafer; run.records.push(out.record); run.at += 1; run.finished = run.at >= STEPS.length;
    return out.record;
  }

  return { STEPS, SPEC, STANDARD, DIE_COUNT, dies, empty, apply, arriving, createRun, complete };
});
