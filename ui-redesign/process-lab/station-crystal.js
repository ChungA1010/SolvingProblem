/* Wafer station of the process lab: what the page shows and says while the crystal puller is operated.
 * It is the equipment of the process 'wafer' (웨이퍼 제조); slicing the crystal and polishing the wafers go by the
 * standard recipe. Calculation: crystal-model.js. Equipment: src/puller.js. The shape of a station is in app.js. */
(function () {
  'use strict';
  const CR = window.ProcessLabCrystal, F = window.ProcessLabFlow, C = CR.constants, S = C.spec;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const ohmCm = rho => `${rho >= 100 ? fmt(rho) : rho.toFixed(1)} Ω·cm`;
  const rhoRead = r => F.read(r.resistivity, r.resistivity >= 100 ? 0 : 1);       // the resistivity as it is printed: that is what is judged
  const stage = s => s.lost ? '결정이 떨어짐' : s.ended ? '꺼냄' : !s.attached ? '시드 대기' : s.full ? '인상 끝' : s.length === 0 ? '시드를 담금' : !s.shouldered ? '넥' : s.run > 0 ? '바디' : '숄더';
  const handed = r => ({ resistivity: r.resistivity, dislocated: r.dislocated, diameter: r.diameter, body: r.body });
  const measured = new WeakMap(); let measurements = 0;
  /** A number for each measurement, so the page can tell a new report from the one it already shows. */
  const reportId = r => { if (!measured.has(r)) measured.set(r, ++measurements); return measured.get(r); };
  const melt = s => `${fmt(C.silicon.melting + s.superheat)} °C`, above = v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} K`;

  /** The crystal lying on its side, seed end at the left, with the body's diameter range marked. */
  function ingotView(s) {
    const hanging = (s.attached || s.ended) && s.profile.length > 1, span = Math.max(400, s.length), X = z => 12 + 216 * z / span, R = r => r * 0.14;
    const root = svg('svg', { viewBox: '0 0 240 56', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': hanging ? `결정의 옆모습: 길이 ${fmt(s.length)} mm, 지금 지름 ${fmt(2 * s.radius)} mm` : '결정의 옆모습: 아직 자란 것이 없습니다' });
    root.append(svg('rect', { x: 0, y: 0, width: 240, height: 56, fill: '#f3f5f9' }));
    for (const side of [-1, 1]) root.append(svg('rect', { x: 12, y: 28 + side * R(S.diameter[1] / 2) - (side > 0 ? R(S.diameter[1] / 2) - R(S.diameter[0] / 2) : 0), width: 216, height: R(S.diameter[1] / 2) - R(S.diameter[0] / 2), fill: '#10b98144' }));   // where the surface of an in-range body lies
    root.append(svg('path', { d: 'M2,28 h10', stroke: '#6b7483', 'stroke-width': 1.6 }));
    if (hanging) {
      const top = s.profile.map(p => `${X(p.z).toFixed(1)},${(28 - R(p.r)).toFixed(1)}`), bottom = s.profile.slice().reverse().map(p => `${X(p.z).toFixed(1)},${(28 + R(p.r)).toFixed(1)}`);
      root.append(svg('polygon', { points: [...top, ...bottom].join(' '), fill: '#9aa3b2', stroke: '#5b6472', 'stroke-width': 0.6 }));
    }
    return root;
  }

  (window.ProcessLabStations = window.ProcessLabStations || {}).wafer = {
    equipment: 'crystal',
    views: [['home', '전체'], ['melt', '용융액'], ['panel', '조작반']],
    speeds: [[60, '1분/초'], [300, '5분/초'], [900, '15분/초']], defaultSpeed: 300,
    create(wafer) { const sim = CR.create(); sim.wafer = wafer; return sim; },
    parts: {
      seed: { name: '시드와 결정', role: '작은 단결정(시드)을 용융 실리콘에 담갔다가 끌어올리면, 시드와 같은 방향으로 결정이 따라 자랍니다.', how: '아래로 끌면 담그고, 위로 끌면 결정을 용융액에서 떼어 꺼냅니다.',
        rows: s => [['단계', stage(s)], ['길이', `${fmt(s.length)} mm`], ['지금 지름', s.attached || s.ended ? `${fmt(2 * s.radius)} mm` : '—']], pill: s => s.controls.seed > 0.5 ? '담그기' : '꺼내기' },
      speed: { name: '인상 속도', role: '결정을 끌어올리는 속도입니다. 빨리 올리면 가늘게, 천천히 올리면 굵게 자랍니다.', how: '좌우로 끌거나 휠을 굴립니다. 자동 지름 제어가 켜져 있으면 장비가 돌리고, 손을 대면 꺼집니다.', basis: '계산: 응고면의 열 균형 (결정이 빼는 열 = 굳는 열 + 용융액에서 오는 열). 300 mm에서 1 mm/min은 대푯값',
        rows: s => [['설정', `${s.controls.speed.toFixed(2)} mm/min`], ['지금 용융액에서의 평형 지름', `${fmt(2 * CR.equilibrium(s.controls.speed, s.superheat))} mm`]], pill: s => `${s.controls.speed.toFixed(1)} mm/min` },
      power: { name: '히터 전력', role: '도가니를 둘러싼 흑연 히터의 전력입니다. 올리면 용융 실리콘이 뜨거워져, 같은 인상 속도에서 결정이 가늘어집니다. 용융액은 10분쯤에 걸쳐 따라옵니다. 너무 뜨거우면 담근 시드가 녹아 버리고, 녹는점 아래로 식으면 용융액이 얼기 시작합니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '용융액의 온도: 100 kW에서 녹는점, 1 kW에 1 K (대푯값)',
        rows: s => [['설정', `${s.controls.heater.toFixed(1)} kW`], ['용융액', `${melt(s)} (녹는점 ${above(s.superheat)})`], ['이 전력에서 자리 잡는 온도', `녹는점 ${above(CR.steadySuperheat(s.controls.heater))}`]], pill: s => `${s.controls.heater.toFixed(1)} kW` },
      dopant: { name: '붕소', role: '용융 실리콘에 섞는 붕소의 양입니다. 웨이퍼의 비저항을 정합니다. 시드를 담그면 녹아 들어가 바꿀 수 없습니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: `계산: 결정의 농도 = ${C.boron.k} × 용융액의 농도 (편석), 실리콘 ${C.melt} kg`,
        rows: s => { const mg = s.doped ?? s.controls.dopant, melt = CR.meltConcentration(mg); return [['넣는 양', `${mg.toFixed(1)} mg`], ['용융액의 농도', `${F.sci(melt)} /cm³`], ['처음 굳는 결정의 비저항', ohmCm(CR.resistivity(CR.solidConcentration(melt)))]]; },
        pill: s => `${s.controls.dopant.toFixed(1)} mg` },
      auto: { name: '자동 지름 제어', role: `카메라가 잰 지름이 ${C.auto.target} mm가 되도록 장비가 인상 속도를 조절합니다. 지름이 목표에서 ${C.auto.window} mm 안에 있을 때만 켜집니다.`, how: '누르면 켜지고 꺼집니다.', rows: s => [['상태', s.controls.auto ? '켜짐' : '꺼짐']] },
      crucible: { name: '도가니와 용융 실리콘', role: `석영 도가니에 실리콘 ${C.melt} kg을 녹여 놓았습니다. 실리콘은 ${fmt(C.silicon.melting)} °C에서 녹습니다.`, rows: s => [['굳은 양', `${s.mass.toFixed(1)} kg`], ['붕소', s.doped == null ? '아직 안 넣음' : `${s.doped.toFixed(1)} mg`]] },
      heater: { name: '히터', role: '도가니를 둘러싸고 실리콘을 녹인 채로 둡니다. 전력은 조작반의 히터 다이얼로 정합니다.', rows: s => [['전력', `${s.controls.heater.toFixed(1)} kW`], ['용융액', melt(s)]] },
      gauge: { name: '지름 측정 카메라', role: '결정이 용융액과 만나는 밝은 고리를 보고 지름을 잽니다.', rows: s => [['지름', s.attached && !s.ended ? `${fmt(2 * s.radius)} mm` : '—']] },
      hmi: { name: '장비 화면', role: '지름, 인상 속도, 자란 길이를 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 결정이 자라는 중, 노랑은 대기입니다. 받지 않는 조작을 하면 빨강이 깜박입니다.', rows: s => [['상태', s.attached && !s.ended ? '성장 중' : '대기']] },
    },
    control(sim, name, value) {
      const s = sim.state;
      if (name === 'seed') {
        const to = clamp(value, 0, 1);
        if (s.ended && !s.result && to > s.controls.seed) return '꺼낸 결정을 잰 뒤에 시드를 다시 담글 수 있습니다.';   // dipping again starts a new crystal: the one that hangs there is measured first
        sim.setControl('seed', to); return null;
      }
      if (name === 'power') { sim.setControl('heater', value); return null; }
      if (sim.setControl(name, value)) return null;
      return name === 'dopant' ? '붕소는 이미 용융액에 녹아 있어 양을 바꿀 수 없습니다.' : name === 'auto' ? (sim.growing() ? `자동 지름 제어는 지름이 ${C.auto.target} mm에서 ${C.auto.window} mm 안에 들어와야 켜집니다 (지금 ${fmt(2 * s.radius)} mm).` : '결정이 자라는 중이 아닙니다.') : null;
    },
    /** The seed goes all the way: down again if it was let go in the lower half (a crystal that is growing never left the melt), up otherwise. A crystal that has been taken off stays up. */
    dragEnd(sim, name) { const s = sim.state; if (name === 'seed') sim.setControl('seed', s.controls.seed > 0.5 && !(s.ended && !s.result) ? 1 : 0); },
    guide(sim, next) {
      const s = sim.state, c = s.controls, r = s.result, d = 2 * s.radius;
      if (r) {
        if (!r.valid) return [`지름 ${S.diameter[0]}~${S.diameter[1]} mm로 자란 바디가 ${fmt(r.body)} mm뿐입니다 (${S.body} mm는 있어야 합니다). 시드를 다시 담가 새로 기르세요.`, null, null, 'seed'];
        const off = Math.abs(rhoRead(r) - S.resistivity.target) > S.resistivity.tolerance;
        return [`바디 지름 ${fmt(r.diameter)} mm, 길이 ${fmt(r.body)} mm, 비저항 ${ohmCm(r.resistivity)}.${r.ok ? ' 목표 범위 안입니다.' : ''}${r.dislocated ? ' 넥이 모자라 결정에 전위가 남았습니다.' : ''}${off ? ' 비저항이 목표를 벗어났습니다.' : ''}`, `다음: ${next}`, 'finish', null];
      }
      if (s.ended) return s.seed > 0.02 ? ['결정을 꺼내는 중입니다.', null, null, null] : ['결정을 꺼냈습니다. 바디의 지름과 비저항을 재세요.', '결정 재기', x => x.measure(), null];
      if (s.lost && !s.attached && c.seed < 1) return [s.meltedBack ? '시드가 녹아 버렸습니다. 용융액이 너무 뜨겁습니다. 시드를 다시 담그세요.' : '결정이 용융액에서 떨어졌습니다. 너무 빨리 올렸습니다. 시드를 다시 담그세요.', null, null, s.meltedBack ? 'power' : 'seed'];
      if (sim.growing() && s.full) return [s.full === 'melt' ? '도가니의 실리콘을 거의 다 썼습니다. 시드를 위로 끌어 결정을 꺼내세요.' : '결정이 인상 챔버에 가득 찼습니다. 시드를 위로 끌어 결정을 꺼내세요.', null, null, 'seed'];
      if (s.superheat < 0 && !c.auto) return [sim.growing() ? '용융액이 녹는점 아래로 식어 얼기 시작합니다. 결정이 마구 넓어집니다.' : '용융액이 녹는점 아래로 식어 얼기 시작합니다.', null, null, 'power'];   // under the controller the diameter holds: its own lines say so
      if (sim.growing() && s.length < 20 && s.superheat > C.superheat.meltback) return ['용융액이 너무 뜨거워 담근 시드가 녹고 있습니다.', null, null, 'power'];
      if (!s.attached) return c.seed >= 1 ? ['시드가 내려가는 중입니다.', null, null, null] : ['붕소의 양을 정하고, 시드를 아래로 끌어 용융 실리콘에 담그세요. 담근 뒤에는 붕소의 양을 바꿀 수 없습니다.', null, null, s.doped == null && c.dopant === 0 ? 'dopant' : 'seed'];
      if (c.speed === 0) return ['인상 속도를 올리면 결정이 자랍니다. 빨리 올릴수록 가늘어집니다. 처음에는 가는 목(넥)을 길게 뽑아 시드의 결함이 따라오지 못하게 합니다.', null, null, 'speed'];
      if (!s.shouldered && !s.necked) return [`넥을 뽑는 중입니다. 지름 ${C.neck.diameter} mm 아래로 ${C.neck.length} mm는 이어져야 합니다 (지금 ${fmt(s.thin)} mm).`, null, null, null];
      if (c.auto) return s.body.length >= S.body ? ['바디가 충분히 자랐습니다. 시드를 위로 끌어 결정을 꺼내세요.', null, null, 'seed'] : [`장비가 지름을 붙잡고 바디를 기르는 중입니다 (규격 안 ${fmt(s.body.length)} mm).`, null, null, null];
      if (Math.abs(d - C.auto.target) <= C.auto.window) return ['지름이 목표 근처입니다. 자동 지름 제어 단추를 누르면 장비가 속도를 조절해 지름을 붙잡습니다.', null, null, 'auto'];
      return [d < C.auto.target ? `${s.necked ? '넥이 됐습니다. ' : ''}속도를 낮추면 결정이 굵어집니다 (지금 ${fmt(d)} mm).` : `결정이 너무 굵습니다. 속도를 올리면 가늘어집니다 (지금 ${fmt(d)} mm).`, null, null, 'speed'];
    },
    view(sim) { const s = sim.state; return { seed: s.seed, hanging: s.attached || s.ended, growing: sim.growing(), length: s.length, radius: s.radius, profile: s.profile, stamp: `${s.profile.length}|${s.attached}|${s.ended}`, superheat: s.superheat, controls: { ...s.controls, power: s.controls.heater } }; },
    live(sim, wafer) { const r = sim.state.result; return r && r.valid ? F.apply('wafer', wafer, handed(r)).wafer : wafer; },
    /** Until the crystal is measured, the later stops show the wafer of the standard recipe. */
    forecast(sim, wafer) { const r = sim.state.result; return F.apply('wafer', wafer, r && r.valid ? handed(r) : undefined).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result, hanging = s.attached || s.ended, span = Math.max(400, s.length);
      return {
        picture: { custom: ingotView(s) }, value: r ? r.diameter : hanging ? 2 * s.radius : 0, unit: 'mm',
        note: r ? `${r.body > 0 ? '바디의 평균 지름' : '가장 굵은 곳의 지름'} · 계측값` : `${stage(s)} · 카메라`,
        meter: { value: r ? r.diameter : hanging ? 2 * s.radius : 0, target: (S.diameter[0] + S.diameter[1]) / 2, tolerance: (S.diameter[1] - S.diameter[0]) / 2, scale: 400 },
        trend: { label: '끌어올린 길이에 따른 지름. 띠는 바디의 규격', points: s.profile, x: p => p.z, y: p => 2 * p.r, xMax: span, yMax: 360, band: S.diameter, xStart: '시드', xLabel: `${fmt(span)} mm`, tip: p => [`지름 ${fmt(2 * p.r)} mm`, ` · ${fmt(p.z)} mm 지점`] },
        now: r ? `비저항 <b>${ohmCm(r.resistivity)}</b> · 바디 <b>${fmt(r.body)} mm</b>` : `넥 <b>${s.necked ? '됨' : `${fmt(s.thin)} mm`}</b> · 바디 <b>${fmt(s.body.length)} mm</b> · <b>${melt(s)}</b>`,
        spec: [`바디 지름 ${S.diameter[0]}~${S.diameter[1]} mm`, `비저항 ${S.resistivity.target} ± ${S.resistivity.tolerance} Ω·cm`],
      };
    },
    screen(sim) {
      const s = sim.state, growing = sim.growing();
      return {
        name: 'CZ-01', title: 'CRYSTAL PULLER', running: growing, state: s.lost && !s.attached ? 'CRYSTAL LOST' : s.ended ? 'CRYSTAL OUT' : !s.attached ? 'SEED UP' : s.full ? 'END OF PULL' : s.controls.auto ? 'BODY · AUTO DIA' : !s.shouldered ? 'NECK' : 'SHOULDER',
        big: ['DIAMETER', s.attached || s.ended ? fmt(2 * s.radius) : '—', 'mm'],
        cells: [['PULL', `${s.controls.speed.toFixed(2)}`], ['LENGTH', `${fmt(s.length)} mm`], ['MELT', `${fmt(C.silicon.melting + s.superheat)}°C`]],
        chips: [['SEED IN', s.attached && !s.ended], ['AUTO DIA', s.controls.auto]], bar: ['BODY', clamp(s.body.length / S.body, 0, 1)],
      };
    },
    result(sim) { const r = sim.state.result; return r && r.valid ? { ...handed(r), how: `붕소 ${r.dopant.toFixed(1)} mg, 넥 ${r.necked ? '있음' : '없음'}` } : null; },

    // ----- process instruments and metrology report (the frame is in app.js) -----
    /** Keeps what the instruments draw over time: pull speed and melt temperature, a point every 20 s of the process. */
    tick(sim) {
      const s = sim.state, trace = sim.trace || (sim.trace = []);
      if (trace.length && s.time - trace.at(-1).t < 20) return;
      trace.push({ t: s.time, speed: s.controls.speed, melt: C.silicon.melting + s.superheat });
      if (trace.length > 1200) trace.splice(0, trace.length - 1200);
    },
    running(sim) { const s = sim.state; return s.attached && !s.result; },
    instruments(sim) {
      const s = sim.state, trace = sim.trace || [], hanging = s.attached || s.ended, span = Math.max(400, s.length), minutes = Math.max(30, s.time / 60);
      const near = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
      const diameter = s.profile.map(p => [p.z, 2 * p.r]), speed = trace.map(p => [p.t / 60, p.speed]), melt = trace.map(p => [p.t / 60, p.melt]);
      // Resistivity of the crystal where it froze: the melt left behind grows richer in boron, so it falls along the length.
      const doped = s.doped ?? s.controls.dopant, c0 = CR.meltConcentration(doped), rho = p => CR.resistivity(CR.solidConcentration(c0, p.m / C.melt));
      const along = hanging ? s.profile.filter(p => 2 * p.r >= C.neck.until).map(p => [p.z, rho(p)]) : [], first = CR.resistivity(CR.solidConcentration(c0)), R = S.resistivity;
      const rhoTop = Math.max(R.target + 3 * R.tolerance, ...along.map(p => Math.min(p[1], 40))), time = t => [[0, '0'], [minutes, `${fmt(minutes)}분`]];
      const top = Math.max(2, Math.ceil(Math.max(...speed.map(p => p[1]), 0) + 0.5)), hot = C.silicon.melting + C.superheat.meltback;
      return [
        { title: '지름', unit: 'mm', value: hanging ? fmt(2 * s.radius) : '—', label: '끌어올린 길이에 따른 지름. 띠는 바디의 규격',
          plot: { x: [0, span], y: [0, 360], yTicks: [0, 150, 300], xTicks: [[0, '시드'], [span, `${fmt(span)} mm`]], band: S.diameter, series: diameter },
          tip: x => { if (!diameter.length) return null; const p = near(diameter, x); return [`${fmt(p[0])} mm 지점`, [[`${fmt(p[1])} mm`, '지름']]]; } },
        { title: '인상 속도', unit: 'mm/min', value: s.controls.speed.toFixed(2), label: '시간에 따른 인상 속도',
          plot: { x: [0, minutes], y: [0, top], yTicks: [0, top / 2, top], yFormat: v => (Number.isInteger(v) ? String(v) : v.toFixed(1)), xTicks: time(), series: speed, quiet: true },
          tip: x => { if (!speed.length) return null; const p = near(speed, x); return [`${fmt(p[0])}분`, [[`${p[1].toFixed(2)} mm/min`, '인상 속도'], [`${fmt(2 * CR.equilibrium(p[1], near(melt, x)[1] - C.silicon.melting))} mm`, '이 속도에서 자리 잡는 지름']]]; } },
        { title: '용융액', unit: '°C', value: fmt(C.silicon.melting + s.superheat), tone: s.superheat > C.superheat.meltback || s.superheat < 0 ? 'critical' : '', label: '시간에 따른 용융 실리콘의 온도',
          plot: { x: [0, minutes], y: [C.silicon.melting - 6, hot + 6], yTicks: [C.silicon.melting, hot], xTicks: time(), limit: hot, limitLabel: '시드가 녹음', series: melt, quiet: true },
          tip: x => { if (!melt.length) return null; const p = near(melt, x); return [`${fmt(p[0])}분`, [[`${fmt(p[1])} °C`, '용융액'], [above(p[1] - C.silicon.melting), '녹는점 대비']]]; } },
        { title: '비저항', unit: 'Ω·cm', value: along.length ? along.at(-1)[1].toFixed(1) : doped > 0 ? first.toFixed(1) : '—', label: '결정의 길이에 따른 비저항. 띠는 규격',
          plot: { x: [0, span], y: [0, rhoTop], yTicks: [0, R.target], xTicks: [[0, '시드'], [span, `${fmt(span)} mm`]], band: [R.target - R.tolerance, R.target + R.tolerance], series: along },
          tip: x => { if (!along.length) return null; const p = near(along, x); return [`${fmt(p[0])} mm 지점`, [[ohmCm(p[1]), '비저항']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, r = s.result; if (!r) return null;
      const [lo, hi] = S.diameter, R = S.resistivity, off = rhoRead(r) - R.target, rhoOk = Math.abs(off) <= R.tolerance, notes = [];
      notes.push(r.valid ? `규격(${lo}~${hi} mm) 안에서 자란 바디가 ${fmt(r.body)} mm입니다.`
        : `규격(${lo}~${hi} mm) 안에서 자란 바디가 ${fmt(r.body)} mm뿐입니다 (${S.body} mm는 있어야 합니다). 지름이 목표 근처에 오면 자동 지름 제어를 켜서 장비가 인상 속도로 지름을 붙잡게 합니다.`);
      if (!r.necked) notes.push(`넥이 없어 시드의 전위가 결정으로 이어졌습니다. 담근 직후에 인상 속도를 올려 지름 ${C.neck.diameter} mm 아래로 ${C.neck.length} mm 이상 가늘게 뽑아야 합니다.`);
      if (!rhoOk && r.dopant > 0) notes.push(`비저항이 목표보다 ${off > 0 ? '높습니다. 붕소가 모자랍니다' : '낮습니다. 붕소가 많습니다'}. 비저항은 붕소의 양에 거의 반비례합니다.`);
      if (!rhoOk && r.dopant === 0) notes.push('붕소를 넣지 않아 비저항이 매우 높습니다. 시드를 담그기 전에 붕소의 양을 정합니다.');
      if (r.valid) notes.push(`결정이 자랄수록 용융액에 남는 붕소가 진해져(편석 계수 ${C.boron.k}), 결정의 뒤쪽일수록 비저항이 낮습니다. 잰 값은 바디 가운데에서 자른 웨이퍼의 값입니다.`);
      return {
        id: reportId(r), title: '결정', sub: `길이 ${fmt(r.length)} mm · 붕소 ${r.dopant.toFixed(1)} mg`, pass: r.ok,
        criteria: [
          { label: '규격 안 바디', value: `${fmt(r.body)} mm`, ok: r.valid, meter: { value: r.body, limit: S.body, top: 2 * S.body }, scale: ['0', `${S.body} mm 이상`, `${2 * S.body}`] },
          { label: '넥', value: r.necked ? '있음' : '없음', ok: r.necked, pass: '전위 없음', fail: '전위 남음' },
          { label: '비저항', value: ohmCm(r.resistivity), ok: rhoOk, fail: off > 0 ? '높음' : '낮음', track: { value: r.resistivity, lo: R.target - 4 * R.tolerance, hi: R.target + 4 * R.tolerance, band: [R.target - R.tolerance, R.target + R.tolerance] },
            scale: [`${R.target - 4 * R.tolerance}`, `목표 ${R.target} ± ${R.tolerance}`, `${R.target + 4 * R.tolerance}`] },
        ],
        figures: [{ caption: '결정의 옆모습 (왼쪽이 시드, 띠는 바디의 규격)', node: ingotView(s) }],
        notes,
        stats: [[r.body > 0 ? '바디 평균 지름' : '가장 굵은 곳의 지름', `${fmt(r.diameter)} mm`], ['굳은 양', `${s.mass.toFixed(1)} kg`], ['걸린 시간', `${fmt(s.time / 60)}분`], ['굳은 비율', `${(100 * s.mass / C.melt).toFixed(1)}%`]],
      };
    },
  };
})();
