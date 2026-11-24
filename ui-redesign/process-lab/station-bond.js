/* Packaging station of the process lab: what the page shows and says while the wire bonder is operated.
 * It is the equipment of the process 'package' (패키징); cutting the wafer, attaching the chips and moulding go by the
 * standard recipe. Calculation: bond-model.js. Equipment: src/bonder.js. The shape of a station is in app.js. */
(function () {
  'use strict';
  const BD = window.ProcessLabBond, C = BD.constants;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const MODE = { lift: '볼이 패드에서 떨어짐', neck: '선이 볼 바로 위에서 끊어짐', stitch: '리드 쪽이 떨어짐', crater: '패드가 뜯겨 나감', wide: '볼이 패드보다 넓음' };
  const WHY = { lift: '접합이 덜 됐습니다.', stitch: '접합이 덜 됐습니다.', neck: '선이 약해졌습니다.', crater: '너무 세게 붙여 패드가 깨졌습니다.', wide: '볼이 패드 밖으로 퍼졌습니다.' };
  const REFUSED = {
    bond: s => s.phase === 'running' ? '가동 중입니다.' : s.phase === 'done' ? '금선 잇기가 끝났습니다.' : '진행 중입니다.',
    pull: s => s.phase !== 'setup' ? REFUSED.bond(s) : s.wire ? '이 선은 이미 당겨 봤습니다. 새로 이으세요.' : '먼저 본드 단추로 시험 선을 이으세요.',
    run: s => REFUSED.bond(s),
  };
  const measuredOnce = new WeakMap(); let measurements = 0;
  /** A number for each finished run, so the page can tell a new report from the one it already shows. */
  const reportId = r => { if (!measuredOnce.has(r)) measuredOnce.set(r, ++measurements); return measuredOnce.get(r); };
  const settings = c => `${fmt(c.power)} mW, ${fmt(c.force)} gf, ${fmt(c.time)} ms`;

  /** Side view of one wire: ball on the chip's pad, loop, stitch on the lead; after a pull test, where it gave. */
  function wireView(wire) {
    const root = svg('svg', { viewBox: '0 0 240 56', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': wire ? `금선의 옆모습: 볼 지름 ${fmt(wire.diameter)} µm${wire.pulled ? `, 풀 테스트에서 ${MODE[wire.pulled.mode]}` : ''}` : '금선의 옆모습: 아직 이은 선이 없습니다' });
    const pad = C.pad * 0.4, cx = 70, mode = wire && wire.pulled ? wire.pulled.mode : null;
    root.append(svg('rect', { x: 0, y: 0, width: 240, height: 56, fill: '#f3f5f9' }), svg('rect', { x: 24, y: 36, width: 92, height: 16, fill: '#6b7483' }), svg('rect', { x: 164, y: 44, width: 64, height: 5, fill: '#b9c0cb' }));
    root.append(svg('rect', { x: cx - pad / 2, y: 33.5, width: pad, height: 2.5, fill: '#d6a23f' }));
    if (!wire) return root;
    const rx = wire.diameter * 0.4 / 2, lifted = mode === 'lift' || mode === 'crater' ? 9 : 0, by = 30 - lifted;
    if (mode === 'crater') root.append(svg('path', { d: `M${cx - 6},33.5 l3,5 h6 l3,-5 z`, fill: '#f3f5f9' }), svg('path', { d: `M${cx - 6},${by + 3.5} l3,5 h6 l3,-5 z`, fill: '#6b7483' }));
    root.append(svg('ellipse', { cx, cy: by, rx, ry: 3.6, fill: '#e2b23a', stroke: '#8a6a12', 'stroke-width': 0.6 }));
    const end = mode === 'stitch' ? [186, 30] : [186, 43.5], top = mode ? 2 : 8;
    if (mode === 'neck') root.append(svg('path', { d: `M${cx},${by - 3.6} v-4`, stroke: '#e2b23a', 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }), svg('path', { d: `M${cx + 4},10 C${cx + 20},-2 150,0 ${end[0]},${end[1]}`, stroke: '#e2b23a', 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }));
    else root.append(svg('path', { d: `M${cx},${by - 3.6} C${cx + 2},${top - 8} 150,${top - 6} ${end[0]},${end[1]}`, stroke: '#e2b23a', 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }));
    if (mode) root.append(svg('path', { d: 'M128,-2 v9 q0,4 -4,4', stroke: '#1e293b', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }));          // the hook
    if (wire.diameter > C.pad) root.append(svg('path', { d: `M${cx - pad / 2},31 v6 M${cx + pad / 2},31 v6`, stroke: '#dc2626', 'stroke-width': 0.9 }));   // the pad's edges, which the ball has passed
    return root;
  }

  (window.ProcessLabStations = window.ProcessLabStations || {}).package = {
    equipment: 'bonder',
    views: [['home', '전체'], ['work', '칩'], ['panel', '조작반']],
    speeds: [[1, '1×'], [4, '4×'], [16, '16×']], defaultSpeed: 1,
    create(wafer, seed) { const sim = BD.create({ chips: wafer.tested ? wafer.tested.good : 0, seed }); sim.wafer = wafer; sim.pulled = []; sim.seen = 0; return sim; },
    parts: {
      power: { name: '초음파 출력', role: '캐필러리를 떨어 금선을 패드에 비벼 붙이는 힘입니다. 모자라면 붙지 않고, 지나치면 패드가 깨지고 선이 약해집니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '접합의 반응은 대표 곡선 (방향은 본딩 자료, 수치는 가정)',
        rows: s => [['설정', `${fmt(s.controls.power)} mW`], ['초음파 에너지', `${BD.energy(s.controls.power, s.controls.time).toFixed(2)} mJ`]], pill: s => `${fmt(s.controls.power)} mW` },
      force: { name: '누르는 힘', role: '캐필러리가 볼을 누르는 힘입니다. 약하면 미끄러져 진동이 전해지지 않고, 세면 진동이 눌려 죽고 볼이 넓게 퍼집니다.', how: '좌우로 끌거나 휠을 굴립니다.', rows: s => [['설정', `${fmt(s.controls.force)} gf`]], pill: s => `${fmt(s.controls.force)} gf` },
      time: { name: '본딩 시간', role: '초음파를 거는 시간입니다. 길수록 에너지가 많이 들어갑니다.', how: '좌우로 끌거나 휠을 굴립니다.', rows: s => [['설정', `${fmt(s.controls.time)} ms`], ['초음파 에너지', `${BD.energy(s.controls.power, s.controls.time).toFixed(2)} mJ`]], pill: s => `${fmt(s.controls.time)} ms` },
      bond: { name: '시험 본딩', role: '불량 칩 위에 금선 하나를 천천히 이어 봅니다. 볼을 패드에 붙이고, 고리를 만들어 리드에 붙인 뒤 끊습니다.', how: '누릅니다.', rows: s => [['이 칩에 이은 선', `${s.onChip} / ${C.wires}`]] },
      pull: { name: '풀 테스트', role: '방금 이은 선을 고리로 당겨, 끊어지거나 떨어질 때의 힘과 그 자리를 봅니다. 선은 못 쓰게 됩니다.', how: '누릅니다.', basis: `기준: 25 µm 금선 ${C.spec.pull.toFixed(1)} gf 이상 (MIL-STD-883 2011)`, rows: s => [['해 본 횟수', `${s.tests.length}회`]] },
      run: { name: '가동', role: '지금 조건으로 양품 칩 전부에 금선을 잇습니다. 시작하면 조건을 바꿔도 이 웨이퍼에는 적용되지 않습니다.', how: '누릅니다.', rows: (s) => [['칩마다 금선', `${C.wires}개`]] },
      head: { name: '본드 헤드', role: '초음파 혼 끝의 캐필러리로 금선을 누르고 떨어 붙입니다. 금선 끝을 녹여 만든 볼을 패드에, 반대쪽을 리드에 붙입니다.', rows: s => [['상태', s.phase === 'bonding' || s.phase === 'running' ? '본딩 중' : '대기']] },
      spool: { name: '금선', role: `지름 ${C.wire.diameter} µm의 금선입니다. 머리카락 굵기의 3분의 1쯤 됩니다.`, rows: () => [['끊어지는 힘', `약 ${C.wire.breaking} gf`]] },
      stage: { name: '히터 블록', role: '리드프레임을 붙잡고 데웁니다. 데워야 낮은 초음파 출력으로도 금이 붙습니다.', rows: () => [['온도', `${C.temperature} °C`]] },
      chip: { name: '리드프레임과 칩', role: '웨이퍼에서 잘라 낸 칩을 리드프레임에 붙여 놓았습니다. 칩의 패드와 리드를 금선으로 이으면 칩이 바깥과 통합니다. 그림은 보이도록 크게 그렸습니다.', rows: s => [['금선을 이은 칩', `${s.passed + Object.values(s.faults).reduce((a, b) => a + b, 0)}개`]] },
      puller: { name: '풀 테스터', role: '고리를 금선 가운데에 걸고 들어 올려, 견디는 힘을 잽니다.', basis: `계산: 선의 장력 = 당기는 힘 ÷ ${BD.pullFactor().toFixed(2)} (고리 높이 ${C.loop.height} µm, 길이 ${C.loop.span / 1000} mm의 정역학)`,
        rows: s => { const last = s.tests.at(-1); return last ? [['마지막 측정', `${last.force.toFixed(1)} gf`], ['끊어진 자리', MODE[last.mode]]] : [['마지막 측정', '없음']]; } },
      hmi: { name: '장비 화면', role: '조건과 이은 칩 수를 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 본딩 중, 노랑은 대기입니다.', rows: s => [['상태', s.phase === 'running' || s.phase === 'bonding' ? '본딩 중' : '대기']] },
    },
    control(sim, name, value) { return sim.setControl(name, value) ? null : REFUSED[name] ? REFUSED[name](sim.state) : null; },
    tick(sim) {                                                     // which test wires on the chip under the tool have been pulled off
      const s = sim.state;
      if (s.phase === 'bonding' && s.onChip === 0) sim.pulled = [];
      if (s.tests.length > sim.seen) { sim.seen = s.tests.length; sim.pulled.push(s.onChip - 1); }
      if (s.phase === 'running' || s.phase === 'done') sim.pulled = [];
      // what the instruments draw of the run: chips finished and chips lost, a point for every chip the tool has left
      const lost = Object.values(s.faults).reduce((a, b) => a + b, 0), n = s.passed + lost, trace = sim.trace || (sim.trace = []);
      if (s.phase !== 'setup' && s.phase !== 'bonding' && s.phase !== 'pulling' && (!trace.length || trace.at(-1).n !== n)) trace.push({ n, passed: s.passed, lost });
    },
    guide(sim, next) {
      const s = sim.state, last = s.tests.at(-1), r = s.result;
      if (s.phase === 'done') return [r.bonded ? `칩 ${fmt(r.bonded)}개 가운데 ${fmt(r.chips)}개를 완성했습니다.${r.lost ? ` ${fmt(r.lost)}개는 금선 불량입니다.` : ''}` : '금선을 이을 양품 칩이 없습니다.', `다음: ${next}`, 'finish', null];
      if (s.phase === 'running') return [`칩 ${fmt(Math.min(s.at + 1, sim.total))} / ${fmt(sim.total)}에 금선을 잇는 중입니다.`, null, null, null];
      if (s.phase === 'bonding') return ['시험 선을 잇는 중입니다.', null, null, null];
      if (s.phase === 'pulling') return ['선을 당기는 중입니다.', null, null, null];
      if (s.wire && !s.wire.pulled) return ['풀 단추를 눌러 방금 이은 선을 당겨 보세요.', null, null, 'pull'];
      if (!last) return ['초음파 출력, 누르는 힘, 시간을 정하고 본드 단추로 시험 선을 하나 이으세요. 당겨 보면 얼마나 잘 붙었는지 알 수 있습니다.', null, null, 'bond'];
      const wide = last.reason === 'wide', text = `풀 강도 ${last.force.toFixed(1)} gf, ${MODE[last.mode]}.`;
      if (last.ok) return [`${text} 기준을 넘었습니다. 가동 단추를 누르면 양품 칩 ${fmt(sim.total)}개에 금선을 잇습니다.`, null, null, 'run'];
      return [`${text} ${wide ? WHY.wide : WHY[last.mode]} 조건을 바꿔 다시 이어 보세요.`, null, null, 'bond'];
    },
    view(sim) {
      const s = sim.state, running = s.phase === 'running', stepping = running && s.wireAt >= C.wires;
      return {
        phase: s.phase, wire: s.phase === 'bonding' ? s.onChip % C.wires : running && !stepping ? s.wireAt : -1, progress: s.progress,
        done: running ? Math.min(s.wireAt, C.wires) : s.phase === 'done' ? 0 : s.phase === 'bonding' && s.onChip >= C.wires ? 0 : s.onChip, pulled: sim.pulled,
        pulling: s.phase === 'pulling' ? s.progress : 0, hookAt: s.onChip - 1, shift: stepping ? s.progress : 0, canPull: Boolean(s.wire && !s.wire.pulled), controls: s.controls,
      };
    },
    live(sim, wafer) { const s = sim.state; return s.phase === 'running' || s.phase === 'done' ? { ...wafer, packaged: { chips: s.passed } } : wafer; },
    monitor(sim) {
      const s = sim.state, last = s.tests.at(-1), spec = [`풀 강도 ≥ ${C.spec.pull.toFixed(0)} gf`, `볼 ≤ 패드 ${C.pad} µm`];
      if (s.phase === 'running' || s.phase === 'done') {
        const lost = Object.values(s.faults).reduce((a, b) => a + b, 0), faults = Object.entries(s.faults).map(([reason, n]) => `${MODE[reason]} <b>${n}</b>`).join(' · ');
        return { picture: { custom: wireView({ ...BD.bonded(s.used), pulled: null }) }, value: s.passed, unit: '개', note: `완성 ${fmt(s.passed)} / ${fmt(s.passed + lost)} · 전체 ${fmt(sim.total)}`, meter: null, trend: null, now: faults || `조건 <b>${settings(s.used)}</b>`, spec };
      }
      return {
        picture: { custom: wireView(s.wire) }, value: last ? last.force.toFixed(1) : '0', unit: 'gf',
        note: last ? `${last.reason === 'wide' ? MODE.wide : MODE[last.mode]} · 계측값` : '당겨 본 선이 없음',
        meter: last ? { value: last.force, target: (C.spec.pull + 7) / 2, tolerance: (7 - C.spec.pull) / 2, scale: 8 } : null,
        trend: s.tests.length ? { label: '풀 테스트 기록. 점선은 최소 기준', points: s.tests, x: p => p.n, y: p => p.force, xMax: Math.max(5, s.tests.length), yMax: 8, level: C.spec.pull, xStart: '1회', xLabel: `${Math.max(5, s.tests.length)}회`, tip: p => [`${p.force.toFixed(1)} gf`, ` · ${p.reason === 'wide' ? MODE.wide : MODE[p.mode]}`] } : null,
        now: s.wire ? `볼 지름 <b>${fmt(s.wire.diameter)} µm</b> · 패드 ${C.pad} µm` : `히터 <b>${C.temperature} °C</b>`, spec,
      };
    },
    screen(sim) {
      const s = sim.state, c = s.used || s.controls, lost = Object.values(s.faults).reduce((a, b) => a + b, 0);
      return {
        name: 'WB-01', title: 'WIRE BONDER', running: s.phase === 'running' || s.phase === 'bonding',
        state: { setup: 'READY', bonding: 'TEST BOND', pulling: 'PULL TEST', running: 'RUN', done: 'DONE' }[s.phase],
        big: ['CHIPS', `${s.passed + lost}`, `/ ${sim.total}`],
        cells: [['US', `${fmt(c.power)} mW`], ['FORCE', `${fmt(c.force)} gf`], ['TIME', `${fmt(c.time)} ms`]],
        chips: [['HEAT', true], ['RUN', s.phase === 'running']], bar: ['LOT', sim.total ? (s.passed + lost) / sim.total : 0],
      };
    },
    result(sim) { const r = sim.state.result; return r ? { chips: r.chips, bonded: r.bonded, lost: r.lost, how: `금선 ${settings(r)}` } : null; },

    // ----- process instruments and metrology report (the frame is in app.js) -----
    running(sim) { const s = sim.state; return s.phase !== 'done' && (s.phase !== 'setup' || s.tests.length > 0); },      // from the first test wire to the end of the run
    instruments(sim) {
      const s = sim.state, tests = s.tests.map(p => [p.n, p.force]), run = sim.trace || [], total = Math.max(1, sim.total), lost = Object.values(s.faults).reduce((a, b) => a + b, 0);
      const near = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
      const made = run.map(p => [p.n, p.passed]), bad = run.map(p => [p.n, p.lost]), pulls = Math.max(5, tests.length), badTop = Math.max(5, lost), chips = [[0, '0'], [total, `${fmt(total)}개째`]];
      return [
        { title: '풀 강도', unit: 'gf', value: tests.length ? tests.at(-1)[1].toFixed(1) : '—', tone: s.tests.length && !s.tests.at(-1).ok ? 'critical' : '', label: `시험 선을 당겨 본 기록. 선은 최소 기준 ${C.spec.pull.toFixed(0)} gf`,
          plot: { x: [1, pulls], y: [0, 8], yTicks: [0, 4, 8], xTicks: [[1, '1회'], [pulls, `${pulls}회`]], limit: C.spec.pull, limitLabel: '기준', series: tests },
          tip: x => { if (!tests.length) return null; const p = near(tests, x), t = s.tests[p[0] - 1]; return [`${p[0]}회째`, [[`${p[1].toFixed(1)} gf`, '풀 강도'], [t.reason === 'wide' ? MODE.wide : MODE[t.mode], '']]]; } },
        { title: '완성한 칩', unit: '개', value: fmt(s.passed), label: '가동하는 동안 금선을 다 이은 칩의 수',
          plot: { x: [0, total], y: [0, total], yTicks: [0, total], xTicks: chips, series: made },
          tip: x => { if (!made.length) return null; const p = near(made, x); return [`${fmt(p[0])}개째 칩`, [[`${fmt(p[1])}개`, '완성']]]; } },
        { title: '금선 불량', unit: '개', value: fmt(lost), tone: lost ? 'critical' : '', label: '가동하는 동안 금선이 기준에 못 미친 칩의 수',
          plot: { x: [0, total], y: [0, badTop], yTicks: [0, badTop], xTicks: chips, series: bad, quiet: true },
          tip: x => { if (!bad.length) return null; const p = near(bad, x); return [`${fmt(p[0])}개째 칩`, [[`${fmt(p[1])}개`, '금선 불량']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, r = s.result; if (s.phase !== 'done' || !r) return null;
      const last = s.tests.at(-1), ok = r.chips > 0 && r.lost === 0, notes = [];
      if (!r.bonded) notes.push('금선을 이을 양품 칩이 없습니다. EDS에서 양품이 나와야 합니다.');
      else if (!r.lost) notes.push(`양품 칩 ${fmt(r.bonded)}개 모두에 금선을 ${C.wires}개씩 이었습니다. 몰딩을 지나면(표준 조건) 칩이 완성됩니다.`);
      else notes.push(`칩 ${fmt(r.lost)}개가 금선 불량입니다. ${Object.entries(r.faults).map(([reason, n]) => `${MODE[reason]} ${fmt(n)}개: ${WHY[reason]}`).join(' ')}`);
      if (r.bonded && !s.tests.length) notes.push('시험 선을 당겨 보지 않고 가동했습니다. 시험 선으로 조건을 확인한 뒤에 가동하면 금선 불량을 미리 볼 수 있습니다.');
      if (r.bonded) notes.push('풀 테스트는 선을 끊어 보는 검사라 시험 선에만 합니다.');
      return {
        id: reportId(r), title: '금선 잇기', sub: settings(r), pass: ok,
        criteria: [
          { label: '완성한 칩', value: `${fmt(r.chips)} / ${fmt(r.bonded)}`, ok, fail: r.bonded ? '금선 불량' : '없음', meter: { value: r.chips, limit: Math.max(1, r.bonded), top: Math.max(1, r.bonded) }, scale: ['0', '', `${fmt(r.bonded)}개`] },
          ...(last ? [{ label: '시험 선의 풀 강도', value: `${last.force.toFixed(1)} gf`, ok: last.ok, fail: last.reason === 'wide' ? '볼이 넓음' : '미달', meter: { value: last.force, limit: C.spec.pull, top: 8 }, scale: ['0', `${C.spec.pull.toFixed(0)} gf 이상`, '8'] }] : []),
        ],
        figures: r.bonded ? [{ caption: '금선의 옆모습: 칩의 패드 위에 볼, 리드 쪽에 스티치', node: wireView({ ...BD.bonded(r), pulled: null }) }] : [],
        notes,
        stats: [['초음파 출력', `${fmt(r.power)} mW`], ['누르는 힘', `${fmt(r.force)} gf`], ['시간', `${fmt(r.time)} ms`], ['당겨 본 시험 선', `${s.tests.length}개`]],
      };
    },
  };
})();
