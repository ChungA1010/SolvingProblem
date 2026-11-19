/* Plating station of the process lab: what the page shows and says while the copper plating cell is operated.
 * It is the equipment of the process 'metal' (금속배선); the polish that follows goes by the standard recipe.
 * Calculation: plating-model.js. Equipment: src/process-lab/plater.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const PL = window.ProcessLabPlating, F = window.ProcessLabFlow, C = PL.constants, T = C.spec;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const mA = density => `${(density * 1000).toFixed(1)} mA/cm²`;
  const handed = (thickness, burnt) => ({ thickness, burnt });

  (window.ProcessLabStations = window.ProcessLabStations || {}).metal = {
    equipment: 'plating',
    views: [['home', '전체'], ['cell', '도금조'], ['panel', '조작반']],
    speeds: [[1, '1×'], [4, '4×'], [16, '16×']], defaultSpeed: 4,
    create(wafer) { const sim = PL.create({ wafer: { seed: wafer.liner > 0 } }); sim.wafer = wafer; sim.rotation = null; return sim; },
    parts: {
      head: { name: '도금 헤드', role: '웨이퍼를 뒤집어 도금액에 담그고 돌립니다. 웨이퍼가 음극이 되어 구리가 붙습니다.', how: '아래로 끌면 담그고 위로 끌면 꺼냅니다. 전류가 흐르는 동안에는 올라가지 않습니다.',
        rows: s => [['위치', s.immersed ? '도금액 안' : s.head < 0.02 ? '위' : '이동 중'], ['회전', `${fmt(s.spin)} rpm`]], pill: s => s.controls.head > 0.5 ? '담그기' : '꺼내기' },
      current: { name: '도금 전류', role: '웨이퍼로 흘리는 전류입니다. 클수록 구리가 빨리 붙습니다. 도금액이 실어 나를 수 있는 한계를 넘으면 도금이 탑니다.', how: '좌우로 끌거나 휠을 굴립니다. 0으로 내리면 도금이 멈춥니다.', basis: '계산: 패러데이 법칙 (두께 = M·Q / nFρA)',
        rows: s => [['설정', `${s.controls.current.toFixed(1)} A`], ['전류 밀도', mA(s.controls.current / C.area)], ['이 전류로 붙는 속도', `${fmt(PL.rate(Math.min(s.controls.current / C.area, s.limit)) * 60)} nm/분`]], pill: s => `${s.controls.current.toFixed(1)} A` },
      rotation: { name: '웨이퍼 회전', role: '웨이퍼를 돌리면 새 도금액이 표면으로 밀려와, 흘릴 수 있는 전류의 한계가 올라갑니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '계산: Levich 식 (한계 ∝ √회전수). 확산 계수는 대표값',
        rows: s => [['설정', `${fmt(s.controls.rotation)} rpm`], ['한계 전류', `${(PL.limit(s.controls.rotation) * C.area).toFixed(1)} A (${mA(PL.limit(s.controls.rotation))})`]], pill: s => `${fmt(s.controls.rotation)} rpm` },
      cell: { name: '도금조', role: '황산구리 도금액이 담겨 있습니다. 구리 이온(Cu²⁺)이 웨이퍼에서 전자 둘을 받아 구리가 됩니다. 전류가 한계를 넘으면 표면의 구리 이온이 바닥나 수소가 나옵니다.', basis: '표면 농도 = 도금액 농도 × (1 − 전류 ÷ 한계)',
        rows: s => [['구리 농도', `${C.bath.copper} mol/L`], ['웨이퍼 표면의 농도', s.plating ? `${fmt(clamp(1 - s.density / s.limit, 0, 1) * 100)}%` : '100%']] },
      anode: { name: '구리 양극', role: '녹으면서 도금액에 구리 이온을 채워 줍니다.', rows: () => [] },
      rectifier: { name: '정류기', role: '직류를 흘립니다. 흘린 전하(전류 × 시간)가 붙는 구리의 양을 정합니다.', rows: s => [['전류', s.plating ? `${s.controls.current.toFixed(1)} A` : '0 A'], ['흘린 전하', `${(s.charge / 3600).toFixed(3)} Ah`], ['전하로 환산한 두께', `${fmt(PL.thicknessOf(s.charge))} nm`]] },
      wafer: { name: '웨이퍼', role: '창 안팎에 구리가 같은 두께로 붙습니다. 창을 채우고 위까지 덮은 뒤, 다음 연마에서 윗부분을 걷어냅니다.', rows: s => [['구리', `${fmt(s.thickness)} nm`]] },
      hmi: { name: '장비 화면', role: '전류, 회전, 흘린 전하를 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 도금 중, 노랑은 대기, 빨강은 한계 전류 초과입니다.', rows: s => [['상태', s.over ? '한계 초과' : s.plating ? '도금 중' : '대기']] },
    },
    control(sim, name, value) {
      if (name !== 'head') { sim.setControl(name, value); return null; }
      return sim.setControl('head', clamp(value, 0, 1)) ? null : '전류가 흐르는 동안에는 헤드가 올라가지 않습니다. 전류를 0으로 내리세요.';
    },
    dragEnd(sim, name) { if (name === 'head') sim.setControl('head', sim.state.controls.head > 0.5 ? 1 : 0); },       // the head goes all the way
    tick(sim) { const s = sim.state; if (s.result && s.head > 0.05) s.result = null; if (s.plating) sim.rotation = s.controls.rotation; },   // back in the bath: the old measurement no longer holds
    guide(sim, next) {
      const s = sim.state, c = s.controls, r = s.result;
      if (r) {
        const thin = r.error < -T.tolerance, text = !(r.thickness > 0) ? '구리가 붙지 않았습니다.'
          : `구리 ${fmt(r.thickness)} nm (면저항 ${r.sheet.toFixed(1)} mΩ/□). ${r.ok ? '목표 범위 안입니다.' : [thin ? `목표보다 ${fmt(-r.error)} nm 얇습니다. 다시 담가 더 올릴 수 있습니다.` : r.error > T.tolerance ? `목표보다 ${fmt(r.error)} nm 두껍습니다. 다음 연마로 다 걷어내지 못합니다.` : '', r.burnt ? '한계 전류를 오래 넘겨 도금이 탔습니다.' : ''].filter(Boolean).join(' ')}`;
        return [text, `다음: ${next}`, 'finish', thin || !(r.thickness > 0) ? 'head' : null];
      }
      if (s.head < 0.02 && c.head < 0.02) {
        if (s.wet) return ['헹구고 돌려 말리는 중입니다.', null, null, null];
        if (s.thickness > 0) return ['면저항을 재서 구리 두께를 확인하세요.', '면저항 재기', x => x.measure(), null];
        return ['헤드를 아래로 끌어 웨이퍼를 도금액에 담그세요.', null, null, 'head'];
      }
      if (!s.immersed) return [c.head > s.head ? '헤드가 웨이퍼를 뒤집어 내려가는 중입니다.' : c.head < s.head ? '헤드가 올라오는 중입니다.' : '헤드가 중간에 멈춰 있습니다. 끝까지 내리거나 올리세요.', null, null, c.head === s.head ? 'head' : null];
      if (s.over) return ['전류가 도금액의 한계를 넘었습니다. 전류를 낮추거나 회전을 올리세요.', null, null, 'current'];
      if (s.plating) return ['도금 중입니다. 두께가 차면 전류를 0으로 내려 멈추세요.', null, null, null];
      if (s.thickness > 0) return ['헤드를 위로 끌어 웨이퍼를 꺼내세요. 꺼내면 헹구고 말립니다.', null, null, 'head'];
      return ['회전수를 정하고 전류를 올리면 구리가 붙기 시작합니다.', null, null, 'current'];
    },
    view(sim) { const s = sim.state; return { head: s.head, spin: s.spin, plating: s.plating, over: s.over, thickness: s.thickness, burnt: s.thickness > 0 && s.burnt / s.thickness >= C.burnt, windows: Boolean(sim.wafer.window && sim.wafer.window.width > 0), controls: s.controls }; },
    live(sim, wafer) { const s = sim.state; return s.thickness > 0 ? { ...wafer, metal: { conformal: s.thickness } } : wafer; },
    /** Before any copper is on, the later stops show what the standard plating would make of this wafer. */
    forecast(sim, wafer) { const s = sim.state; return s.thickness > 0 ? F.apply('metal', wafer, handed(s.thickness, s.burnt / s.thickness >= C.burnt)).wafer : F.apply('metal', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result, t = r ? r.thickness : s.thickness, tMax = Math.max(120, s.seconds);
      return {
        picture: { section: this.live(sim, sim.wafer), top: 36, height: 194 },
        value: t, unit: 'nm',
        note: r ? (r.ok ? '목표 범위 안 · 계측값' : r.burnt ? '도금이 탐 · 계측값' : `목표와 <b>${fmt(Math.abs(r.error))} nm</b> 차이 · 계측값`) : s.over ? '한계 초과 · 계산값' : '구리 두께 · 계산값',
        meter: { value: t, target: T.target, tolerance: T.tolerance, scale: T.target * 2 },
        trend: { label: '도금 시간에 따른 구리 두께. 띠는 목표 범위', points: s.history, x: p => p.t, y: p => p.nm, xMax: tMax, yMax: Math.max(1000, t * 1.15), band: [T.target - T.tolerance, T.target + T.tolerance], xLabel: clock(tMax), tip: p => [`${fmt(p.nm)} nm`, ` · ${clock(p.t)}`] },
        now: `<b>${(s.density * 1000).toFixed(1)}</b> mA/cm² · 한계 <b>${(s.limit * 1000).toFixed(1)}</b>`,
        spec: [`구리 두께 ${fmt(T.target)} ± ${T.tolerance} nm`],
      };
    },
    screen(sim) {
      const s = sim.state;
      return {
        name: 'EP-01', title: 'COPPER PLATING', running: s.plating, alarm: s.over,
        state: s.over ? 'OVER LIMIT' : s.plating ? 'PLATING' : s.immersed ? 'IN BATH' : s.head > 0.02 ? 'HEAD MOVING' : s.wet ? 'RINSE · DRY' : 'HEAD UP',
        big: ['CHARGE', (s.charge / 3600).toFixed(3), 'Ah'],
        cells: [['CURRENT', `${(s.plating ? s.controls.current : 0).toFixed(1)} A`], ['SPIN', `${fmt(s.spin)} rpm`], ['TIME', `${Math.floor(s.seconds / 60)}:${String(Math.floor(s.seconds % 60)).padStart(2, '0')}`]],
        chips: [['IN BATH', s.immersed], ['DC ON', s.plating]],
      };
    },
    result(sim) {
      const r = sim.state.result; if (!r) return null;
      return { ...handed(r.thickness, r.burnt), how: r.thickness > 0 ? `${fmt(sim.rotation ?? sim.state.controls.rotation)} rpm, 최대 ${r.peak.toFixed(1)} A, ${clock(r.seconds)}` : '도금하지 않음' };
    },
  };
})();
