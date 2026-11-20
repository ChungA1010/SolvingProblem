/* The route of the process lab: the eight processes in order, the wafer that travels through them, and what each
 * process leaves on it. No DOM: loaded by the page and by the unit tests (tests/process-lab-flow.test.cjs).
 *
 * The product is a small test chip made in one pass through the eight processes: windows opened in a thermal oxide on
 * a p-type wafer, an n+ junction implanted through them, the windows lined and filled with metal and polished flat.
 *
 * A process that has its own equipment in the lab is run by the operator, and its measured result goes onto the wafer
 * (see `equipment` in STEPS). Every other process is passed with the STANDARD recipe below. Those numbers are assumed, typical
 * values that keep the route going; they are not computed from a model, and the page says so wherever it shows them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProcessLabFlow = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STEPS = [
    { id: 'wafer', name: '웨이퍼 제조', does: '실리콘 결정을 길러 얇게 자르고 닦아 웨이퍼를 만듭니다.', equipment: true },
    { id: 'oxidation', name: '산화', does: '웨이퍼 표면에 산화막(SiO₂)을 기릅니다. 뒤 공정에서 마스크와 절연막이 됩니다.', equipment: true },
    { id: 'photo', name: '포토', does: '감광막을 바르고 빛으로 무늬를 옮깁니다.', equipment: true },
    { id: 'etch', name: '식각', does: '감광막이 열린 자리의 산화막을 깎아 창을 냅니다.', equipment: true },
    { id: 'deposition', name: '증착·이온주입', does: '창으로 이온을 넣어 접합을 만들고, 창 안에 얇은 막을 입힙니다.', equipment: true },
    { id: 'metal', name: '금속배선', does: '창을 금속으로 채우고 평탄하게 갈아 전기가 통하는 길을 만듭니다.', equipment: true },
    { id: 'eds', name: 'EDS', does: '웨이퍼 위의 칩을 하나씩 전기로 검사해 양품을 가립니다.', equipment: true },
    { id: 'package', name: '패키징', does: '양품 칩을 잘라 기판에 붙이고 선을 이은 뒤 감쌉니다.', equipment: true },
  ];
  const SPEC = {                                                    // what the run sheet asks of each process (nm unless said; surface: phosphorus per cm3)
    wafer: { resistivity: { target: 10, tolerance: 1 }, diameter: [300, 310] },   // ohm cm; mm of the crystal's body before it is ground to 300 mm
    oxide: { target: 500, tolerance: 25 }, opening: { target: 1000, tolerance: 50 }, window: { target: 1000, tolerance: 100, siliconLoss: 20 },
    junction: { target: 300, tolerance: 50, surface: 1e19 },
    metal: { target: 800, tolerance: 80, dishing: 50 },             // copper plated on the field; dishing after the polish that still counts as flat
  };
  const STANDARD = {                                                // assumed results of the standard recipes
    substrate: { type: 'p', orientation: '(100)', diameter: 300, resistivity: 10 },   // mm, ohm cm
    oxide: 500,                                                     // nm
    resist: 1000, opening: 1000, pitch: 3000,                       // nm
    etchReach: 600,                                                 // nm of oxide the fixed-time etch clears: 500 nm plus 20% over-etch
    selectivity: 20,                                                // oxide etched per silicon etched, once the window is open
    junction: 300, surface: 2e19, liner: 30,                        // nm; phosphorus per cm3 at the surface
    plated: 800, polish: 880, dishRate: 0.25,                       // nm of copper plated on the field; nm of field copper the polish clears; nm of dishing per nm polished after the field is clear
    die: 20, edge: 3,                                               // mm: die size and the edge of the wafer that holds no chips
    defects: 0.03,                                                  // killer defects per cm2 at the centre of the wafer; (1 + 1.5 r^4) times that toward the edge
  };
  const nm = v => `${Math.round(v).toLocaleString('en-US')} nm`;
  const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  /** A number as 3.2×10¹⁵. */
  function sci(v) {
    if (!(v > 0)) return '0';
    let e = Math.floor(Math.log10(v)), m = v / 10 ** e;
    if (m >= 9.95) { m = 1; e += 1; }
    return `${m.toFixed(1)}×10${String(e).split('').map(d => SUPERSCRIPT[d]).join('')}`;
  }

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
  /**
   * Which chips of the wafer of this lot carry a killer defect: the Poisson yield model, a chip of area A is hit with
   * probability 1 - exp(-A D). The same lot number always gives the same wafer.
   */
  function defects(lot = 1) {
    let seed = (Math.imul(Math.floor(lot) || 1, 2654435761) >>> 0) || 1;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const area = (STANDARD.die / 10) ** 2, R = STANDARD.substrate.diameter / 2;
    for (let i = 0; i < 8; i++) random();
    return dies().map(die => random() < 1 - Math.exp(-area * STANDARD.defects * (1 + 1.5 * (Math.hypot(die.x, die.y) / R) ** 4)));
  }
  const BIN_NAMES = { contact: '접촉', leak: '누설', voltage: '전압', defect: '결함' };

  const empty = (lot = 1) => ({ lot, substrate: null, oxide: 0, resist: null, window: null, unmasked: false, junction: null, liner: 0, metal: null, tested: null, packaged: null });

  /**
   * The junction an implant and its anneal leave on the wafer (no film on it yet). `result` is what the operator's
   * implant did: { depth (nm of junction where the ions entered the silicon; 0 for none), surface (phosphorus per cm3 at
   * the surface), masked (the oxide kept the ions out) }, or nothing for the standard recipe.
   */
  function implanted(wafer, result) {
    const w = { ...wafer }, windows = Boolean(w.window && w.window.width > 0), open = windows && w.window.open, J = SPEC.junction;
    if (!result) {
      w.junction = w.unmasked ? { depth: STANDARD.junction, surface: STANDARD.surface, species: 'P', everywhere: true } : open ? { depth: STANDARD.junction, surface: STANDARD.surface, species: 'P' } : null;
      return { wafer: w, ok: w.unmasked ? false : w.window ? open : null,
        text: w.unmasked ? `산화막 마스크가 없어 웨이퍼 전면에 n+ 접합이 생김 (깊이 ${nm(STANDARD.junction)})` : open ? `n+ 접합 깊이 ${nm(STANDARD.junction)}` : '산화막이 이온을 막아 접합이 생기지 않음' };
    }
    const all = w.unmasked || !result.masked || !windows;           // where the ions got into the silicon, they got in everywhere
    w.junction = result.depth > 0 ? { depth: result.depth, surface: result.surface, species: 'P', ...(all ? { everywhere: true, leaked: !w.unmasked } : {}) } : null;
    const ok = Boolean(w.junction) && !all && open && Math.abs(result.depth - J.target) <= J.tolerance && result.surface >= J.surface;
    const text = !w.junction ? (windows && !open ? '창 바닥의 산화막이 이온을 막아 접합이 생기지 않음' : windows ? '주입량이 모자라 접합이 생기지 않음' : '산화막이 이온을 막아 접합이 생기지 않음')
      : w.unmasked ? `산화막 마스크가 없어 웨이퍼 전면에 n+ 접합이 생김 (깊이 ${nm(result.depth)})`
        : all ? `이온이 산화막을 뚫고 들어가 창 밖에도 n+ 접합이 생김 (깊이 ${nm(result.depth)})`
          : `n+ 접합 깊이 ${nm(result.depth)}, 표면 농도 ${sci(result.surface)} /cm³ (목표 ${J.target} ± ${J.tolerance} nm, ${sci(J.surface)} /cm³ 이상)${open ? '' : ' · 창 바닥에 산화막이 남음'}`;
    return { wafer: w, ok, text };
  }

  /**
   * The metal after plating and the polish that follows it by the standard recipe. `plated` is what the operator's
   * plating did: { thickness (nm of copper on the field), burnt }, or nothing for the standard recipe. The polish clears a
   * fixed amount of field copper: more than that stays on the oxide, less than that dishes the copper in the windows.
   */
  function metallised(wafer, plated) {
    const w = { ...wafer }, t = plated ? plated.thickness : STANDARD.plated, M = SPEC.metal;
    const depth = w.window && w.window.width > 0 ? w.window.depth + w.window.siliconLoss : 0;
    const over = Math.max(0, t - STANDARD.polish), short = Math.max(0, depth - t);                    // copper left on the oxide; how far the copper in the window was short of the top
    const dishing = over > 0 ? 0 : Math.min(depth, short + (STANDARD.polish - t) * STANDARD.dishRate);
    w.metal = t > 0 ? { thickness: t, over, dishing, planar: over === 0 && dishing <= M.dishing, ...(plated && plated.burnt ? { burnt: true } : {}) } : null;
    if (!plated) return { wafer: w, ok: null, text: '창을 금속으로 채우고 산화막 높이까지 평탄화' };
    return { wafer: w, ok: t > 0 && !plated.burnt && Math.abs(t - M.target) <= M.tolerance,
      text: t > 0 ? `구리 ${nm(t)} 도금 (목표 ${M.target} ± ${M.tolerance} nm)${plated.burnt ? ' · 한계 전류를 넘겨 도금이 탐' : ''} · 표준 연마 뒤 ${over > 0 ? `산화막 위에 구리 ${nm(over)} 남음` : `접시 파임 ${nm(dishing)}`}` : '구리가 도금되지 않음' };
  }

  /** What a process leaves on the wafer. `result` is the operator's measured result, or nothing for the standard recipe. */
  function apply(id, wafer, result) {
    const w = { ...wafer }, by = result ? 'operator' : 'standard';
    let text, ok = null;
    if (id === 'wafer') {
      const W = SPEC.wafer.resistivity;                             // the operator's crystal: { resistivity, dislocated, diameter, body }
      w.substrate = { ...STANDARD.substrate, ...(result ? { resistivity: result.resistivity, ...(result.dislocated ? { dislocated: true } : {}) } : {}) };
      const rho = w.substrate.resistivity, shown = rho >= 100 ? Math.round(rho).toLocaleString('en-US') : rho.toFixed(1);
      if (result) ok = !result.dislocated && Math.abs(rho - W.target) <= W.tolerance;
      text = !result ? `p형 ${w.substrate.orientation} ${w.substrate.diameter} mm 웨이퍼, 비저항 ${rho} Ω·cm`
        : `p형 ${w.substrate.orientation} ${w.substrate.diameter} mm 웨이퍼, 비저항 ${shown} Ω·cm (목표 ${W.target} ± ${W.tolerance})${result.dislocated ? ' · 넥이 모자라 결정에 전위가 남음' : ''} · 결정의 바디 지름 ${Math.round(result.diameter)} mm, 길이 ${Math.round(result.body)} mm${result.how ? ` · ${result.how}` : ''}`;
    } else if (id === 'oxidation') {
      w.oxide = result ? result.mean : STANDARD.oxide;
      ok = Math.abs(w.oxide - SPEC.oxide.target) <= SPEC.oxide.tolerance;
      text = result ? `산화막 ${nm(w.oxide)} (목표 ${SPEC.oxide.target} ± ${SPEC.oxide.tolerance} nm)${result.how ? ` · ${result.how}` : ''}` : `산화막 ${nm(w.oxide)}`;
    } else if (id === 'photo') {
      if (result) {
        w.resist = result.thickness > 0 ? { thickness: result.thickness, opening: result.opening } : null;
        ok = Boolean(w.resist) && result.opening > 0 && Math.abs(result.opening - SPEC.opening.target) <= SPEC.opening.tolerance;
        text = !w.resist ? '감광막이 남지 않음' : result.opening > 0 ? `감광막 ${nm(result.thickness)}, 창 너비 ${nm(result.opening)} (목표 ${SPEC.opening.target.toLocaleString('en-US')} ± ${SPEC.opening.tolerance} nm)` : `감광막 ${nm(result.thickness)}, 창이 열리지 않음`;
        if (result.how) text += ` · ${result.how}`;
      } else {
        w.resist = { thickness: STANDARD.resist, opening: STANDARD.opening };
        text = `감광막 ${nm(STANDARD.resist)}, 너비 ${nm(STANDARD.opening)}의 창 무늬`;
      }
    } else if (id === 'etch' && result) {
      w.oxide = result.oxide; w.resist = null;
      if (result.stripped) { w.window = null; w.unmasked = true; ok = false; text = '산화막이 모두 깎임'; }
      else if (!(result.width > 0)) { w.window = { width: 0, depth: 0, open: false, left: w.oxide, siliconLoss: 0 }; ok = false; text = '창이 생기지 않음'; }
      else {
        w.window = { width: result.width, depth: result.depth, open: result.open, left: result.left, siliconLoss: result.siliconLoss };
        ok = result.open && result.siliconLoss <= SPEC.window.siliconLoss && Math.abs(result.width - SPEC.window.target) <= SPEC.window.tolerance;
        text = result.open ? `창 너비 ${nm(result.width)}, 실리콘 ${nm(result.siliconLoss)} 깎임 (목표 ${SPEC.window.target.toLocaleString('en-US')} ± ${SPEC.window.tolerance} nm, 실리콘 ${SPEC.window.siliconLoss} nm 이하)` : `창이 다 뚫리지 않음 · 바닥에 산화막 ${nm(result.left)} 남음`;
      }
      if (result.how) text += ` · ${result.how}`;
    } else if (id === 'etch') {
      const mask = w.resist;
      if (!mask) {                                                  // nothing protects the oxide: the etch thins all of it
        const left = Math.max(0, w.oxide - STANDARD.etchReach);
        text = left ? `감광막이 없어 산화막 전체가 ${nm(w.oxide - left)} 깎임` : '감광막이 없어 산화막이 모두 깎임';
        w.oxide = left; w.window = null; w.unmasked = left === 0; ok = false;
      } else if (!(mask.opening > 0)) {
        w.window = { width: 0, depth: 0, open: false, left: w.oxide, siliconLoss: 0 }; ok = false;
        text = '감광막이 열리지 않아 산화막이 깎이지 않음';
      } else {
        const open = w.oxide <= STANDARD.etchReach, depth = Math.min(w.oxide, STANDARD.etchReach);
        w.window = { width: mask.opening, depth, open, left: w.oxide - depth, siliconLoss: open ? (STANDARD.etchReach - w.oxide) / STANDARD.selectivity : 0 };
        ok = open;
        text = open ? `산화막에 너비 ${nm(mask.opening)}의 창을 냄 · 실리콘 ${nm(w.window.siliconLoss)} 깎임` : `창이 다 뚫리지 않음 · 바닥에 산화막 ${nm(w.window.left)} 남음`;
      }
      w.resist = null;
    } else if (id === 'deposition') {
      const out = implanted(w, result), open = Boolean(w.window && w.window.open && w.window.width > 0);
      w.junction = out.wafer.junction; w.liner = STANDARD.liner; ok = out.ok;          // the barrier film goes on by the standard recipe
      text = result ? `${out.text} · 장벽막 ${nm(STANDARD.liner)}${result.how ? ` · ${result.how}` : ''}`
        : w.unmasked ? out.text : open ? `${out.text}, 창 안에 장벽막 ${nm(STANDARD.liner)}` : `${out.text} · 장벽막 ${nm(STANDARD.liner)}`;
    } else if (id === 'metal') {
      const out = metallised(w, result);
      w.metal = out.wafer.metal; ok = out.ok; text = result && result.how ? `${out.text} · ${result.how}` : out.text;
    } else if (id === 'eds') {
      const j = w.junction, open = Boolean(w.window && w.window.open && w.window.width > 0);
      const reason = w.substrate && w.substrate.dislocated ? '결정에 전위가 남아 접합이 샘'
        : j && j.everywhere ? (j.leaked ? '이온이 산화막을 뚫고 들어가 접합이 전면에 이어짐' : '산화막 마스크가 없어 접합이 전면에 이어짐')
        : !open ? '접촉 창이 열리지 않아 금속이 실리콘에 닿지 않음'
          : !j ? '접합이 생기지 않아 다이오드가 되지 않음'
            : j.surface < SPEC.junction.surface ? '표면 농도가 낮아 금속과의 접촉 저항이 큼'
              : !w.metal ? '금속이 없어 전기가 통할 길이 없음'
                : w.metal.over > 0 ? '구리가 산화막 위에 남아 창끼리 이어짐'
                  : w.metal.burnt ? '도금이 타서 금속의 저항이 큼'
                    : w.metal.dishing > (w.window.depth + w.window.siliconLoss) / 2 ? '금속이 깊이 파여 저항이 큼' : null;      // what fails every chip of the wafer
      const share = good => `칩 ${DIE_COUNT}개 중 양품 ${good}개 (수율 ${Math.round(good / DIE_COUNT * 100)}%)`;
      if (result) {                                                 // the operator's probing: one entry per chip
        const good = result.dies.filter(die => die.good).length, missed = result.missed || 0, bins = {};
        for (const die of result.dies) if (!die.good) bins[die.bin] = (bins[die.bin] || 0) + 1;
        const sorted = Object.entries(bins).map(([bin, n]) => `${BIN_NAMES[bin] || bin} ${n}`).join(', ');
        w.tested = { total: DIE_COUNT, good, reason: good ? null : reason, dies: result.dies, missed };
        ok = good > 0 && missed === 0;
        text = (good ? `${share(good)}${sorted ? ` · 불량: ${sorted}` : ''}` : `칩 ${DIE_COUNT}개 모두 불량${reason ? ` · ${reason}` : ''}`)
          + (missed ? ` · 탐침이 제대로 닿지 않아 양품 ${missed}개를 불량으로 가림` : '') + (result.how ? ` · ${result.how}` : '');
      } else {
        const killed = defects(w.lot), good = reason ? 0 : killed.filter(hit => !hit).length;
        w.tested = { total: DIE_COUNT, good, reason, dies: killed.map(hit => ({ good: !reason && !hit, bin: reason ? 'process' : hit ? 'defect' : 'good' })) };
        ok = !reason;
        text = reason ? `칩 ${DIE_COUNT}개 모두 불량 · ${reason}` : `${share(good)} · 불량 ${DIE_COUNT - good}개는 결함`;
      }
    } else if (id === 'package') {
      const good = w.tested ? w.tested.good : 0, made = result ? Math.min(good, result.chips) : good;      // the operator's wire bonding can lose chips
      w.packaged = { chips: made, ...(result ? { lost: good - made } : {}) }; ok = made > 0 && made === good;
      text = !good ? '패키징할 양품 칩이 없음' : !result ? `양품 칩 ${good}개를 잘라 패키지에 넣음`
        : `양품 칩 ${good}개를 잘라 붙이고 금선을 이어 ${made}개 완성${good > made ? ` · 금선 불량 ${good - made}개` : ''}${result.how ? ` · ${result.how}` : ''}`;
    } else throw new Error(`unknown process: ${id}`);
    return { wafer: w, record: { step: id, by, text, ok } };
  }

  /** The wafer as it arrives at step `index` when everything before went by the standard recipe. */
  function arriving(index, lot = 1) {
    let wafer = empty(lot);
    for (let i = 0; i < index; i++) wafer = apply(STEPS[i].id, wafer).wafer;
    return wafer;
  }

  /** A run that starts at the given process, on the wafer of the given lot. The processes before it are filled in with the standard recipe. */
  function createRun(startId, lot = 1) {
    const start = STEPS.findIndex(step => step.id === startId);
    if (start < 0) throw new Error(`unknown process: ${startId}`);
    const run = { start, at: start, wafer: empty(lot), records: [], finished: false };
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

  /** What a run needs to come back to the process it is at now. Wafers are never changed in place, so this is cheap. */
  const snapshot = run => ({ at: run.at, wafer: run.wafer, records: run.records.slice() });
  /** Takes a run back to a snapshot: the processes from there on are open again. */
  function restore(run, snap) { run.at = snap.at; run.wafer = snap.wafer; run.records = snap.records.slice(); run.finished = false; return run; }

  return { STEPS, SPEC, STANDARD, DIE_COUNT, dies, defects, empty, snapshot, restore, sci, implanted, metallised, apply, arriving, createRun, complete };
});
