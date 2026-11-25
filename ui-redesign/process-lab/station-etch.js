/* Etch station of the process lab: what the page shows and says while the etch chamber is operated.
 * Calculation: etch-model.js. Equipment: src/etcher.js. The shape of a station is described in app.js. */
(function () {
  'use strict';
  const ET = window.ProcessLabEtch, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, C = ET.constants;
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const clock = seconds => { const whole = Math.round(seconds); return whole < 60 ? `${whole}초` : `${Math.floor(whole / 60)}분 ${String(whole % 60).padStart(2, '0')}초`; };   // whole seconds first: 59.6 s is 1분 00초, not 59초 or 0분 60초; under a minute only the seconds
  const onOff = open => open ? '열림' : '닫힘';
  const share = v => `${fmt(v * 100)}%`;
  const gasText = c => [c.chf3 && 'CHF₃', c.cf4 && 'CF₄'].filter(Boolean).join(' + ') || '가스 없음';
  /** The widths of the windows from the centre to the edge as the metrology reads them: narrowest, widest, the one farthest from the target, and the words for them. */
  function widthsOf(r) {
    const read = Array.from(r.profile.width, w => Math.round(w)), narrow = Math.min(...read), wide = Math.max(...read), T = C.spec.width.target;
    return { narrow, wide, worst: Math.abs(wide - T) >= Math.abs(narrow - T) ? wide : narrow, ok: r.width > 0 && read.every(w => Math.abs(w - T) <= C.spec.width.tolerance), text: narrow === wide ? `${fmt(wide)} nm` : `${fmt(narrow)}~${fmt(wide)} nm` };
  }
  const rateRows = s => { const r = ET.rates(s.controls); return r ? [['산화막 식각 속도', `${r.oxide.toFixed(0)} nm/min`], ['산화막 : 실리콘', `${(r.oxide / r.silicon).toFixed(1)} : 1`]] : []; };
  const BASIS = '속도와 선택비: 측정 사례의 대푯값 (CHF₃ 16 : 1, CF₄ 1.2 : 1)';
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const measuredOnce = new WeakMap(); let measurements = 0;
  /** A number for each measurement, so the page can tell a new report from the one it already shows. */
  const reportId = r => { if (!measuredOnce.has(r)) measuredOnce.set(r, ++measurements); return measuredOnce.get(r); };
  /** One window at each place from the centre to the edge of the wafer: the oxide beside it, what is left on its floor, and the bite into the silicon. */
  function windowsAcross(r, oxide) {
    const left = Array.from(r.profile.left), loss = Array.from(r.profile.siliconLoss), width = Array.from(r.profile.width), n = left.length, cell = 240 / n, top = 14, base = 50, tall = base - top;
    const root = svg('svg', { viewBox: '0 0 240 78', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': `가운데에서 가장자리까지 창 ${n}곳: 남은 산화막 ${left.map(v => fmt(v)).join(', ')} nm, 깎인 실리콘 ${loss.map(v => fmt(v)).join(', ')} nm` });
    root.append(svg('rect', { x: 0, y: 0, width: 240, height: 78, fill: '#f3f5f9' }), svg('rect', { x: 0, y: base, width: 240, height: 78 - base, fill: '#9aa3b2' }));
    if (!r.stripped) root.append(svg('rect', { x: 0, y: top, width: 240, height: tall, fill: '#9cc3f5' }));
    for (let j = 0; j < n && !r.stripped && width[j] > 0; j++) {
      const w = Math.min(cell * 0.62, cell * 0.42 * width[j] / C.spec.width.target), x = j * cell + (cell - w) / 2, floor = oxide > 0 ? tall * Math.min(1, left[j] / oxide) : 0, bite = Math.min(78 - base - 4, loss[j] * 5 * tall / Math.max(1, oxide));
      root.append(svg('rect', { x, y: top - 1, width: w, height: tall - floor + 1 + bite, fill: '#f3f5f9' }));
      if (floor <= 0.01 && bite > 0.2) root.append(svg('path', { d: `M${x},${base + bite} h${w}`, stroke: '#dc2626', 'stroke-width': 1.2 }));
    }
    root.append(svg('text', { x: 4, y: 74, 'font-size': 9, fill: '#fff' }, '가운데'), svg('text', { x: 236, y: 74, 'font-size': 9, fill: '#fff', 'text-anchor': 'end' }, '가장자리'));
    return root;
  }

  (window.ProcessLabStations = window.ProcessLabStations || {}).etch = {
    equipment: 'etch',
    views: [['home', '전체'], ['chamber', '챔버'], ['panel', '조작반']],
    speeds: [[10, '10초/초'], [30, '30초/초'], [120, '2분/초']], defaultSpeed: 30,
    create(wafer, seed) { const sim = ET.create({ wafer: { oxide: wafer.oxide, resist: wafer.resist }, seed }); sim.recipe = null; sim.held = new Map(); sim.counted = 0; return sim; },
    parts: {
      power: { name: 'RF 전력', role: '플라스마를 만드는 전력입니다. 클수록 빨리 깎입니다. 50 W 아래에서는 플라스마가 켜지지 않습니다.', how: '좌우로 끌거나 휠을 굴립니다. 0으로 내리면 식각이 멈춥니다.', basis: '속도 ∝ 전력 (단순화)',
        rows: s => [['설정', `${fmt(s.controls.power)} W`], ...rateRows(s).slice(0, 1)], pill: s => `${fmt(s.controls.power)} W` },
      pressure: { name: '압력', role: '챔버 안의 압력입니다. 낮을수록 이온이 곧게 내려와 벽이 수직으로 깎이고, 높을수록 옆으로도 깎입니다.', how: '좌우로 끌거나 휠을 굴립니다.', basis: '이방성 0.97(10 mTorr)~0.70(200 mTorr) (방향은 교과서, 수치는 가정)',
        rows: s => [['설정', `${fmt(s.controls.pressure)} mTorr`], ['이방성 (1이면 수직으로만)', `${ET.rates({ ...s.controls, chf3: true, power: 150 }).anisotropy.toFixed(2)}`]], pill: s => `${fmt(s.controls.pressure)} mTorr` },
      chf3: { name: 'CHF₃ 밸브', role: '실리콘 위에 얇은 막을 남겨 실리콘을 덜 깎는 가스입니다. 느리지만 산화막만 골라 깎습니다.', how: '누르면 열리고 닫힙니다.', basis: BASIS, rows: s => [['밸브', onOff(s.controls.chf3)], ...rateRows(s)] },
      cf4: { name: 'CF₄ 밸브', role: '빨리 깎지만 실리콘도 거의 같은 속도로 깎는 가스입니다.', how: '누르면 열리고 닫힙니다.', basis: BASIS, rows: s => [['밸브', onOff(s.controls.cf4)], ...rateRows(s)] },
      load: { name: '웨이퍼 투입 · 배출', role: '웨이퍼를 챔버에 넣거나 꺼냅니다. 꺼내면 감광막을 벗기고 창을 잽니다.', how: '누릅니다. 플라스마가 켜져 있으면 문이 열리지 않습니다.', rows: s => [['웨이퍼', s.inside >= 1 ? '챔버 안' : s.inside <= 0 ? '밖' : '이동 중']] },
      chamber: { name: '식각 챔버', role: '위아래 전극 사이에 플라스마를 만들어, 감광막이 열린 곳의 산화막을 깎습니다. 웨이퍼 가장자리가 가운데보다 조금 빨리 깎입니다.', basis: '가운데 −5%, 가장자리 +5% (대푯값)',
        rows: s => [['플라스마', s.plasma ? '켜짐' : '꺼짐'], ['가스', gasText(s.controls)], ...rateRows(s).slice(0, 1), ...(s.plasma ? [['가운데 · 가장자리', `${fmt(s.rate * s.across[0])} · ${fmt(s.rate * s.across[s.across.length - 1])} nm/min`]] : [])] },
      pump: { name: '진공 펌프', role: '챔버를 낮은 압력으로 유지하고 깎여 나온 기체를 빼냅니다.', rows: s => [['압력', `${fmt(s.controls.pressure)} mTorr`]] },
      rf: { name: 'RF 정합기', role: '아래 전극에 고주파 전력을 넣습니다.', rows: s => [['전력', `${fmt(s.controls.power)} W`]] },
      oes: { name: '종점 검출기', role: '플라스마의 빛을 봅니다. 산화막이 깎일 때 나오는 빛이 줄어들면 창이 실리콘까지 뚫린 것입니다. 가장자리부터 뚫리므로 빛은 한동안에 걸쳐 줄어듭니다.', rows: s => [['신호', s.signal.toFixed(2)], ['뚫린 면적', share(s.opened)]] },
      wafer: { name: '웨이퍼', role: '감광막이 열린 곳만 깎입니다.', rows: s => [['남은 감광막 (가장 얇은 곳)', `${fmt(s.resist)} nm`], ['뚫린 면적', share(s.opened)]] },
      hmi: { name: '장비 화면', role: '전력, 압력, 가스, 식각 시간을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 식각 중, 노랑은 대기입니다. 받지 않는 조작을 하면 빨강이 깜박입니다.', rows: s => [['상태', s.plasma ? '식각 중' : '대기']] },
    },
    control(sim, name, value) {
      if (sim.setControl(name, value)) return null;
      return name !== 'load' ? null : sim.state.result ? '꺼낸 웨이퍼는 감광막을 벗기고 쟀습니다. 다시 넣을 수 없습니다.' : '플라스마가 켜져 있는 동안에는 문이 열리지 않습니다. RF 전력을 내리세요.';
    },
    /** The recipe on record is the one the wafer was etched with for the longest: turning the power down to stop does not go on record as the power used. */
    tick(sim) {
      const s = sim.state, spent = s.etched - sim.counted; sim.counted = s.etched;
      if (!(spent > 0) || !s.plasma) return;
      const now = { gas: gasText(s.controls), power: s.controls.power, pressure: s.controls.pressure }, key = `${now.gas}|${now.power}|${now.pressure}`, seconds = (sim.held.get(key)?.seconds ?? 0) + spent;
      sim.held.set(key, { ...now, seconds });
      if (!sim.recipe || seconds >= sim.held.get(`${sim.recipe.gas}|${sim.recipe.power}|${sim.recipe.pressure}`).seconds) sim.recipe = now;
    },
    guide(sim, next) {
      const s = sim.state, r = s.result, c = s.controls;
      if (r && s.inside <= 0) {
        const text = r.stripped ? (r.oxide >= 1 ? '산화막이 다 깎여 나간 곳이 생겼습니다.' : '산화막이 모두 깎여 나갔습니다.') : r.width <= 0 ? '감광막이 열리지 않아 창이 생기지 않았습니다.'
          : !r.open ? (r.opened > 0 ? `창이 웨이퍼 면적의 ${share(r.opened)}에서만 뚫렸습니다. 가운데 쪽 창 바닥에 산화막이 최대 ${fmt(r.left)} nm 남았습니다. 감광막을 벗겨서 다시 깎을 수는 없습니다.`
            : `창 바닥에 산화막 ${fmt(r.left)} nm가 남았습니다. 다시 넣어 더 깎을 수는 없습니다(감광막을 벗겼습니다).`)
            : `창이 웨이퍼 전체에서 뚫렸습니다. 실리콘은 가장 많이 깎인 곳이 ${fmt(r.siliconLoss)} nm, 창 너비는 ${widthsOf(r).text}. ${r.ok ? '목표 범위 안입니다.' : '목표를 벗어났습니다.'}`;
        return [text, `다음: ${next}`, 'finish', null];
      }
      if (s.inside < 1) return [c.load ? '웨이퍼가 챔버로 들어가는 중입니다.' : s.inside > 0 ? '웨이퍼가 나오는 중입니다.' : '투입 · 배출 단추를 눌러 웨이퍼를 챔버에 넣으세요.', null, null, c.load || s.inside > 0 ? null : 'load'];
      if (s.plasma) return [s.opened <= 0 ? '식각 중입니다. 창이 실리콘까지 뚫리면 종점 신호가 떨어집니다.' : s.opened < 1 ? '종점 신호가 떨어지고 있습니다. 가장자리부터 뚫리는 중이고, 가운데는 아직입니다.' : '종점 신호가 바닥까지 내려왔습니다. 웨이퍼 전체가 뚫렸습니다. RF 전력을 내려 멈추세요.', null, null, s.opened >= 1 ? 'power' : null];
      if (s.etched > 0) return ['투입 · 배출 단추를 눌러 웨이퍼를 꺼내세요. 꺼내면 감광막을 벗기고 창을 잽니다.', null, null, 'load'];
      return ['가스를 열고 압력과 RF 전력을 정하세요. 전력을 올리면 플라스마가 켜집니다.', null, null, c.chf3 || c.cf4 ? 'power' : 'chf3'];
    },
    view(sim) {
      const s = sim.state, start = sim.incoming.resist ? sim.incoming.resist.thickness : 0, out = Boolean(s.result) && s.inside <= 0;
      return { inside: s.inside, plasma: s.plasma, loadable: !s.plasma && !s.result, controls: s.controls, filmColor: FILM.filmColor(s.field), resist: out || !start ? 0 : s.resist / start, windows: s.opening > 0,
        open: Array.from(s.places.floor, v => sim.incoming.oxide > 0 ? 1 - v / sim.incoming.oxide : 1) };          // how far each place has etched through, centre to edge
    },
    /** The wafer at its centre, where the windows open last: the picture of the monitor and of this stop of the route. */
    live(sim, wafer) {
      const s = sim.state, P = s.places, out = Boolean(s.result) && s.inside <= 0, touched = s.etched > 0;
      return {
        ...wafer, oxide: P.field[0], resist: out || P.resist[0] <= 0 ? null : { thickness: P.resist[0], opening: s.opening }, unmasked: touched && s.field <= 0,
        window: touched && s.opening > 0 && P.field[0] > 0 ? { width: s.opening + 2 * P.undercut[0], depth: P.field[0] - P.floor[0], open: P.floor[0] <= 1e-9, left: P.floor[0], siliconLoss: P.siliconLoss[0] } : null,
      };
    },
    /** The later stops show what this wafer would make if it came out now, place by place; before the etch has begun, what the standard etch would make of it. */
    forecast(sim, wafer) { return sim.state.etched > 0 ? F.apply('etch', wafer, this.result(sim, true)).wafer : F.apply('etch', wafer).wafer; },
    monitor(sim) {
      const s = sim.state, r = s.result && s.inside <= 0 ? s.result : null, through = s.opening > 0 && s.floor <= 1e-9, tMax = Math.max(120, s.history.length ? s.history.at(-1).t : 0);
      return {
        picture: { section: this.live(sim, { substrate: {}, oxide: s.field, resist: null, window: null, junction: null, liner: 0, metal: null }) },
        value: through ? s.siliconLoss : s.floor, unit: 'nm',                         // the most at any place: oxide at the centre, silicon at the edge
        note: r ? (through ? '깎인 실리콘 (최대) · 계측값' : '가운데 창의 산화막 · 계측값') : through ? '깎인 실리콘 (최대) · 계산값' : '가운데 창의 산화막 · 계산값',
        meter: null,
        trend: { label: '종점 신호: 산화막이 깎일 때 나오는 빛', points: s.history, x: p => p.t, y: p => p.signal, xMax: tMax, yMax: Math.max(0.5, ...s.history.map(p => p.signal)) * 1.15, xLabel: clock(tMax), tip: p => [`신호 ${p.signal.toFixed(2)}`, ` · 뚫린 면적 ${share(p.opened || 0)} · ${clock(p.t)}`] },
        now: s.opened > 0 && s.opened < 1 ? `뚫린 면적 <b>${share(s.opened)}</b> · 식각 <b>${clock(s.etched)}</b>` : `RF <b>${fmt(s.controls.power)} W</b> · <b>${fmt(s.controls.pressure)}</b> mTorr · 식각 <b>${clock(s.etched)}</b>`,
        spec: [`실리콘 깎임 ≤ ${C.spec.siliconLoss} nm`, `창 너비 ${fmt(C.spec.width.target)} ± ${C.spec.width.tolerance} nm`],
      };
    },
    screen(sim) {
      const s = sim.state;
      return {
        name: 'ET-01', title: 'OXIDE ETCH', running: s.plasma, state: s.plasma ? 'PLASMA ON' : s.inside >= 1 ? 'READY' : s.inside > 0 ? 'TRANSFER' : 'WAFER OUT',
        big: ['RF POWER', fmt(s.controls.power), 'W'],
        cells: [['PRESSURE', `${fmt(s.controls.pressure)}`], ['TIME', `${Math.floor(s.etched / 60)}:${String(Math.floor(s.etched % 60)).padStart(2, '0')}`], ['ENDPOINT', s.signal.toFixed(2)]],
        chips: [['CHF₃', s.controls.chf3], ['CF₄', s.controls.cf4], ['WAFER', s.inside >= 1]],
      };
    },
    /** What goes on along the route; with `now`, the wafer as it would come out at this moment. */
    result(sim, now) {
      const s = sim.state, r = now ? sim.measure() : s.result; if (!r || (!now && s.inside > 0)) return null;
      const how = sim.recipe ? `${sim.recipe.gas}, ${fmt(sim.recipe.power)} W, ${fmt(sim.recipe.pressure)} mTorr, ${clock(r.seconds)}` : '식각하지 않음';
      return { oxide: r.oxide, stripped: r.stripped, width: r.width, depth: r.depth, open: r.open, opened: r.opened, left: r.left, siliconLoss: r.siliconLoss, profile: r.profile, how };
    },

    // ----- process instruments and metrology report (the frame is in app.js) -----
    running(sim) { const s = sim.state; return s.inside >= 1; },                  // while the wafer is in the chamber
    instruments(sim) {
      const s = sim.state, h = s.history, tMax = Math.max(120, h.length ? h.at(-1).t : 0), start = sim.incoming.oxide;
      const near = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
      const signal = h.map(p => [p.t, p.signal]), opened = h.map(p => [p.t, 100 * (p.opened || 0)]), floor = h.map(p => [p.t, p.floor]);
      const time = [[0, '0'], [tMax, clock(tMax)]], top = Math.max(0.5, ...signal.map(p => p[1])) * 1.15;
      return [
        { title: '종점 신호', unit: '', value: s.signal.toFixed(2), label: '시간에 따른 종점 신호: 산화막이 깎일 때 나오는 빛의 세기',
          plot: { x: [0, tMax], y: [0, top], yTicks: [0, +(top / 1.15).toFixed(2)], yFormat: v => v.toFixed(1), xTicks: time, series: signal },
          tip: x => { if (!signal.length) return null; const p = near(signal, x); return [clock(p[0]), [[p[1].toFixed(2), '종점 신호'], [`${fmt(near(opened, x)[1])}%`, '뚫린 면적']]]; } },
        { title: '뚫린 면적', unit: '%', value: fmt(100 * s.opened), label: '시간에 따른 뚫린 면적: 창이 실리콘까지 뚫린 곳이 웨이퍼에서 차지하는 비율',
          plot: { x: [0, tMax], y: [0, 100], yTicks: [0, 50, 100], xTicks: time, series: opened, quiet: true },
          tip: x => { if (!opened.length) return null; const p = near(opened, x); return [clock(p[0]), [[`${fmt(p[1])}%`, '뚫린 면적']]]; } },
        { title: '가운데 창의 산화막', unit: 'nm', value: fmt(s.floor), label: '시간에 따른 가운데 창 바닥의 산화막 두께. 가운데가 가장 늦게 뚫립니다',
          plot: { x: [0, tMax], y: [0, Math.max(100, start)], yTicks: [0, Math.max(100, start)], xTicks: time, series: floor, quiet: true },
          tip: x => { if (!floor.length) return null; const p = near(floor, x); return [clock(p[0]), [[`${fmt(p[1])} nm`, '가운데 창에 남은 산화막']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, r = s.result; if (!r || s.inside > 0) return null;
      const S = C.spec, W = S.width, widths = widthsOf(r), widthOk = widths.ok, lossOk = Math.round(r.siliconLoss) <= S.siliconLoss, notes = [];
      if (r.stripped) notes.push(r.oxide >= 1 ? `창 옆의 산화막이 다 깎여 나간 곳이 생겨(빨리 깎이는 가장자리부터), 마스크로 쓸 수 없습니다. 남은 곳의 평균은 ${fmt(r.oxide)} nm입니다. 감광막이 없거나 다 닳은 뒤에도 식각이 이어졌습니다.`
        : '산화막이 모두 깎여 나가 마스크로 쓸 막이 남지 않았습니다. 감광막이 없거나 다 닳은 뒤에도 식각이 이어졌습니다.');
      else if (r.width <= 0) notes.push('감광막에 열린 곳이 없어 창이 생기지 않았습니다. 포토에서 창이 열려야 합니다.');
      else {
        if (!r.open) notes.push(`창이 웨이퍼 면적의 ${share(r.opened)}에서만 뚫렸습니다. 이 장비는 가장자리를 가운데보다 조금 빨리 깎으므로 가운데가 가장 늦게 뚫립니다. 종점 신호가 바닥까지 내려와야 웨이퍼 전체가 뚫린 것입니다. 덜 뚫린 칩은 EDS에서 불량이 됩니다.`);
        else notes.push(`창이 웨이퍼 전체에서 뚫렸습니다. 가장자리가 먼저 뚫리므로, 가운데가 뚫릴 때까지 가장자리의 실리콘이 그만큼 더 깎입니다.`);
        if (!lossOk) notes.push(`실리콘이 가장 많이 깎인 곳은 ${fmt(r.siliconLoss)} nm 깎였습니다 (기준 ${S.siliconLoss} nm 이하). 창이 뚫린 뒤에도 식각이 이어졌거나, 실리콘도 잘 깎는 가스를 썼습니다. 산화막만 골라 깎는 가스일수록 뚫린 뒤에 실리콘이 덜 깎입니다.`);
        if (!widthOk) notes.push(`창 너비가 ${widths.text}입니다 (목표 ${fmt(W.target)} ± ${W.tolerance} nm, 웨이퍼 어디서나). 창은 포토에서 연 감광막의 너비에서 시작해, 옆으로 깎인 만큼 넓어집니다. 압력이 높을수록 옆으로도 많이 깎입니다.`);
      }
      return {
        id: reportId(r), title: '식각한 창', sub: sim.recipe ? `${sim.recipe.gas} · ${fmt(sim.recipe.power)} W · ${fmt(sim.recipe.pressure)} mTorr · ${clock(r.seconds)}` : '식각하지 않음', pass: r.ok,
        criteria: [
          { label: '뚫린 면적', value: share(r.opened), ok: r.open, pass: '모두 뚫림', fail: '덜 뚫림', meter: { value: 100 * r.opened, limit: 100, top: 100 }, scale: ['0', '', '100%'] },
          { label: '실리콘 깎임 (최대)', value: `${fmt(r.siliconLoss)} nm`, ok: lossOk, fail: '초과', meter: { value: r.siliconLoss, limit: S.siliconLoss, top: 2 * S.siliconLoss }, scale: ['0', `${S.siliconLoss} nm 이하`, `${2 * S.siliconLoss}`] },
          { label: widths.narrow === widths.wide ? '창 너비' : '창 너비 (가운데~가장자리)', value: r.width > 0 ? widths.text : '—', ok: widthOk, fail: r.width > 0 ? '범위 밖' : '없음', track: { value: widths.worst, lo: W.target - 4 * W.tolerance, hi: W.target + 4 * W.tolerance, band: [W.target - W.tolerance, W.target + W.tolerance] },
            scale: [fmt(W.target - 4 * W.tolerance), `목표 ${fmt(W.target)} ± ${W.tolerance}`, fmt(W.target + 4 * W.tolerance)] },
        ],
        figures: [{ caption: '가운데(왼쪽)에서 가장자리(오른쪽)까지의 창. 파란색은 산화막, 창 아래로 파인 곳은 깎인 실리콘입니다 (깊이를 5배로 그렸습니다)', node: windowsAcross(r, sim.incoming.oxide) }],
        notes,
        stats: [['식각 시간', clock(r.seconds)], ['남은 감광막 (가장 얇은 곳)', `${fmt(r.resistLeft)} nm`], ['가운데 창에 남은 산화막', `${fmt(r.left)} nm`], ['옆으로 깎인 길이 (최대)', `${fmt(r.undercut)} nm`]],
      };
    },
  };
})();
