/* Plating station of the process lab: what the page shows and says while the copper plating cell is operated.
 * It is the first piece of equipment of the process 'metal' (금속배선); the polisher of the CMP lab follows (station-cmp.js).
 * Calculation: plating-model.js. Equipment: src/process-lab/plater.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const PL = window.ProcessLabPlating, F = window.ProcessLabFlow, C = PL.constants, T = C.spec, N = C.nodes, LOW = T.target - T.tolerance, HIGH = T.target + T.tolerance;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, '0')}초`;
  const mA = density => `${(density * 1000).toFixed(1)} mA/cm²`;
  const pct = v => `${Math.round(v * 100)}%`;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  /** The copper across the wafer from edge to edge, for the monitor: drawn tall, between the run sheet's two lines, so that the thicker edge shows. */
  function profileView(profile, scorched) {
    const lo = Math.max(0, Math.min(LOW, ...profile) - 120), hi = Math.max(HIGH, ...profile) + 60, Y = v => (52 - 104 * (v - lo) / (hi - lo)).toFixed(1), X = j => 110 * j / (N - 1);
    const points = [...Array.from({ length: N }, (_, k) => [-X(N - 1 - k), profile[N - 1 - k]]), ...Array.from({ length: N - 1 }, (_, k) => [X(k + 1), profile[k + 1]])];
    const top = points.map(([x, v], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${Y(v)}`).join('');
    const root = svg('svg', { viewBox: '-120 -70 240 140', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': `웨이퍼를 가로지른 구리 두께: 가운데 ${fmt(profile[0])} nm, 가장자리 ${fmt(profile[N - 1])} nm` },
      svg('rect', { x: -120, y: -70, width: 240, height: 140, fill: '#f3f5f9' }),
      svg('rect', { x: -112, y: Y(HIGH), width: 224, height: Math.max(1, Y(LOW) - Y(HIGH)), fill: '#10b98124' }),
      svg('path', { d: `${top}L110,60L-110,60Z`, fill: '#d6a23f' }));
    if (scorched) for (let j = 0; j < N; j++) if (scorched[j]) for (const side of [-1, 1]) {        // where it burnt: from the edge in
      const a = X(Math.max(0, j - 0.5)), b = X(Math.min(N - 1, j + 0.5));
      root.append(svg('rect', { x: side < 0 ? -b : a, y: Y(profile[j]), width: b - a, height: 60 - Y(profile[j]), fill: '#4a3226' }));
    }
    for (const level of [LOW, HIGH]) root.append(svg('path', { d: `M-112,${Y(level)}H112`, stroke: '#10b981', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }));
    root.append(svg('rect', { x: -112, y: 60, width: 224, height: 8, fill: '#9aa6b8' }));
    return root;
  }
  /** What goes on to the polisher and along the route: the mean, the thickness from the centre to the edge, and where it burnt. */
  const handed = (sim, r) => r ? { thickness: r.thickness, burnt: r.burnt, profile: r.profile, scorched: r.scorched }
    : { thickness: sim.state.thickness, burnt: sim.burntShare() > 0, profile: Array.from(sim.state.profile), scorched: sim.scorchedPlaces() };

  (window.ProcessLabStations = window.ProcessLabStations || {}).metal = {
    equipment: 'plating', title: '구리 도금',
    views: [['home', '전체'], ['cell', '도금조'], ['panel', '조작반']],
    speeds: [[1, '1×'], [4, '4×'], [16, '16×']], defaultSpeed: 4,
    create(wafer) { const sim = PL.create({ wafer: { seed: wafer.liner > 0 } }); sim.wafer = wafer; sim.rotation = null; return sim; },
    parts: {
      head: { name: '도금 헤드', role: '웨이퍼를 뒤집어 도금액에 담그고 돌립니다. 가장자리를 누르는 접점으로 전류를 넣어, 웨이퍼가 음극이 되어 구리가 붙습니다.', how: '아래로 끌면 담그고 위로 끌면 꺼냅니다. 전류가 흐르는 동안에는 올라가지 않습니다.',
        rows: s => [['위치', s.immersed ? '도금액 안' : s.head < 0.02 ? '위' : '이동 중'], ['회전', `${fmt(s.spin)} rpm`]], pill: s => s.controls.head > 0.5 ? '담그기' : '꺼내기' },
      current: { name: '도금 전류', role: '웨이퍼로 흘리는 전류입니다. 클수록 구리가 빨리 붙습니다. 도금액이 실어 나를 수 있는 한계를 넘으면 그 자리의 도금이 탑니다.', how: '좌우로 끌거나 휠을 굴립니다. 0으로 내리면 도금이 멈춥니다.', basis: '계산: 패러데이 법칙 (두께 = M·Q / nFρA)',
        rows: s => [['설정', `${s.controls.current.toFixed(1)} A`], ['전류 밀도 (평균)', mA(s.controls.current / C.area)], ...(s.plating ? [['가장자리', mA(s.edge)]] : []), ['평균으로 붙는 속도', `${fmt(PL.rate(Math.min(s.controls.current / C.area, s.limit)) * 60)} nm/분`]], pill: s => `${s.controls.current.toFixed(1)} A` },
      rotation: { name: '웨이퍼 회전', role: '웨이퍼를 돌리면 새 도금액이 표면으로 밀려와, 흘릴 수 있는 전류의 한계가 올라갑니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '계산: Levich 식 (한계 ∝ √회전수). 확산 계수는 대표값',
        rows: s => [['설정', `${fmt(s.controls.rotation)} rpm`], ['한계 전류 밀도', mA(PL.limit(s.controls.rotation))]], pill: s => `${fmt(s.controls.rotation)} rpm` },
      cell: { name: '도금조', role: '황산구리 도금액이 담겨 있습니다. 구리 이온(Cu²⁺)이 웨이퍼에서 전자 둘을 받아 구리가 됩니다. 전류가 한계를 넘으면 표면의 구리 이온이 바닥나 수소가 나옵니다.', basis: '표면 농도 = 도금액 농도 × (1 − 전류 ÷ 한계)',
        rows: s => [['구리 농도', `${C.bath.copper} mol/L`], ['가장자리 표면의 농도', s.plating ? `${fmt(clamp(1 - s.edge / s.limit, 0, 1) * 100)}%` : '100%']] },
      anode: { name: '구리 양극', role: '녹으면서 도금액에 구리 이온을 채워 줍니다.', rows: () => [] },
      rectifier: { name: '정류기', role: '직류를 흘립니다. 흘린 전하(전류 × 시간)가 붙는 구리의 양을 정합니다.', rows: s => [['전류', s.plating ? `${s.controls.current.toFixed(1)} A` : '0 A'], ['흘린 전하', `${(s.charge / 3600).toFixed(3)} Ah`], ['전하로 환산한 두께', `${fmt(PL.thicknessOf(s.charge))} nm`]] },
      wafer: { name: '웨이퍼', role: '전류는 가장자리의 접점으로 들어와 얇은 구리막을 지나 가운데로 퍼집니다. 막이 얇을 때는 막의 저항 때문에 가장자리로 전류가 몰려, 가장자리가 더 두꺼워집니다.', basis: '계산: 막의 저항과 표면 반응으로 푼 반지름 방향 전류 분포. 반응 상수는 특허 US 6,074,544의 측정에 맞춘 값, 셀 저항은 대표값',
        rows: s => [['구리 (평균)', `${fmt(s.thickness)} nm`], ['가운데 · 가장자리', `${fmt(s.profile[0])} · ${fmt(s.profile[N - 1])} nm`]] },
      hmi: { name: '장비 화면', role: '전류, 회전, 흘린 전하를 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 도금 중, 노랑은 대기, 빨강은 한계 전류 초과입니다.', rows: s => [['상태', s.over ? '가장자리가 한계 초과' : s.plating ? '도금 중' : '대기']] },
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
        const thin = r.thickness > 0 && r.thinnest < LOW, thick = r.thickest > HIGH;
        const text = !(r.thickness > 0) ? '구리가 붙지 않았습니다.'
          : `구리 평균 ${fmt(r.thickness)} nm, 가운데 ${fmt(r.centre)} · 가장자리 ${fmt(r.edge)} nm. ${r.ok ? '웨이퍼 어디서나 목표 범위 안입니다.' : [
            thin ? `가장 얇은 곳이 목표보다 ${fmt(LOW - r.thinnest)} nm 모자랍니다. 다시 담가 더 올릴 수 있습니다.` : '',
            thick ? `가장 두꺼운 곳이 목표보다 ${fmt(r.thickest - HIGH)} nm 두껍습니다.` : '',
            r.burnt ? `한계 전류를 넘겨 가장자리가 탔습니다 (면적의 ${pct(r.burntShare)}).` : ''].filter(Boolean).join(' ')}`;
        return [text, `다음: ${next}`, 'finish', thin || !(r.thickness > 0) ? 'head' : null];
      }
      if (s.head < 0.02 && c.head < 0.02) {
        if (s.wet) return ['헹구고 돌려 말리는 중입니다.', null, null, null];
        if (s.thickness > 0) return ['면저항을 재서 구리 두께를 확인하세요.', '면저항 재기', x => x.measure(), null];
        return ['헤드를 아래로 끌어 웨이퍼를 도금액에 담그세요.', null, null, 'head'];
      }
      if (!s.immersed) return [c.head > s.head ? '헤드가 웨이퍼를 뒤집어 내려가는 중입니다.' : c.head < s.head ? '헤드가 올라오는 중입니다.' : '헤드가 중간에 멈춰 있습니다. 끝까지 내리거나 올리세요.', null, null, c.head === s.head ? 'head' : null];
      if (s.over) return ['가장자리의 전류가 도금액의 한계를 넘었습니다. 전류를 낮추거나 회전을 올리세요.', null, null, 'current'];
      if (s.plating) return ['도금 중입니다. 두께가 차면 전류를 0으로 내려 멈추세요.', null, null, null];
      if (s.thickness > 0) return ['헤드를 위로 끌어 웨이퍼를 꺼내세요. 꺼내면 헹구고 말립니다.', null, null, 'head'];
      return ['회전수를 정하고 전류를 올리면 구리가 붙기 시작합니다.', null, null, 'current'];
    },
    view(sim) {
      const s = sim.state;
      return { head: s.head, spin: s.spin, plating: s.plating, over: s.over, thickness: s.thickness, burnt: s.thickness > 0 ? Math.round(sim.burntShare() * 50) / 50 : 0,      // share of the wafer burnt, from the edge in
        windows: Boolean(sim.wafer.window && sim.wafer.window.width > 0), controls: s.controls };
    },
    live(sim, wafer) { const s = sim.state; return s.thickness > 0 ? { ...wafer, metal: { conformal: s.thickness } } : wafer; },
    /** The later stops show what this wafer would make: with copper on, as it is now, chip by chip; before that, by the standard recipe. */
    forecast(sim, wafer) { return sim.state.thickness > 0 ? F.apply('metal', wafer, handed(sim, sim.state.result)).wafer : F.apply('metal', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result, t = r ? r.thickness : s.thickness, tMax = Math.max(120, s.seconds);
      const low = r ? r.thinnest : Math.min(...s.profile), high = r ? r.thickest : Math.max(...s.profile), centre = r ? r.centre : s.profile[0], edge = r ? r.edge : s.profile[N - 1];
      const verdict = r && (!(r.thickness > 0) ? '구리 없음' : r.ok ? '목표 범위 안' : r.burnt ? '도금이 탐' : r.thinnest < LOW ? `얇은 곳 <b>${fmt(LOW - r.thinnest)} nm</b> 모자람` : `두꺼운 곳 <b>${fmt(r.thickest - HIGH)} nm</b> 넘음`);
      return {
        picture: t > 0 ? { custom: profileView(r ? r.profile : s.profile, r ? r.scorched : sim.scorchedPlaces()) } : { section: this.live(sim, sim.wafer), top: 36, height: 194 },
        value: t, unit: 'nm',
        note: r ? `${verdict} · 계측값` : s.over ? '가장자리 한계 초과 · 계산값' : '평균 두께 · 계산값',
        meter: { from: low, value: high, target: T.target, tolerance: T.tolerance, scale: T.target * 2 },        // the bar spans the thinnest to the thickest place
        trend: { label: '도금 시간에 따른 평균 구리 두께. 띠는 목표 범위', points: s.history, x: p => p.t, y: p => p.nm, xMax: tMax, yMax: Math.max(1000, high * 1.15), band: [LOW, HIGH], xLabel: clock(tMax), tip: p => [`평균 ${fmt(p.nm)} nm`, ` · 가운데 ${fmt(p.centre)} · 가장자리 ${fmt(p.edge)} · ${clock(p.t)}`] },
        now: s.plating ? `가장자리 <b>${(s.edge * 1000).toFixed(1)}</b> mA/cm² · 한계 <b>${(s.limit * 1000).toFixed(1)}</b>`
          : `가운데 <b>${fmt(centre)}</b> · 가장자리 <b>${fmt(edge)}</b> nm`,
        spec: [`구리 두께 ${fmt(T.target)} ± ${T.tolerance} nm (어디서나)`],
      };
    },
    screen(sim) {
      const s = sim.state;
      return {
        name: 'EP-01', title: 'COPPER PLATING', running: s.plating, alarm: s.over,
        state: s.over ? 'EDGE OVER LIMIT' : s.plating ? 'PLATING' : s.immersed ? 'IN BATH' : s.head > 0.02 ? 'HEAD MOVING' : s.wet ? 'RINSE · DRY' : 'HEAD UP',
        big: ['CHARGE', (s.charge / 3600).toFixed(3), 'Ah'],
        cells: [['CURRENT', `${(s.plating ? s.controls.current : 0).toFixed(1)} A`], ['SPIN', `${fmt(s.spin)} rpm`], ['TIME', `${Math.floor(s.seconds / 60)}:${String(Math.floor(s.seconds % 60)).padStart(2, '0')}`]],
        chips: [['IN BATH', s.immersed], ['DC ON', s.plating]],
      };
    },
    /** The wafer as it goes on to the polisher: copper on every face. */
    interim(wafer, result) { return result.thickness > 0 ? { ...wafer, metal: { conformal: result.thickness } } : wafer; },
    result(sim) {
      const r = sim.state.result; if (!r) return null;
      return { ...handed(sim, r), how: r.thickness > 0 ? `${fmt(sim.rotation ?? sim.state.controls.rotation)} rpm, 최대 ${r.peak.toFixed(1)} A, ${clock(r.seconds)}` : '도금하지 않음' };
    },
  };
})();
