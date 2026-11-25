/* Oxidation station of the process lab: what the page shows and says while the furnace is operated.
 * Calculation: oxidation-model.js. Equipment: src/furnace.js. app.js calls the functions of this object;
 * the shape of a station is described at the top of app.js. */
(function () {
  'use strict';
  const OX = window.ProcessLabOxidation, F = window.ProcessLabFlow, FILM = window.Lab3DProcess, F0 = OX.constants.furnace;
  const locked = s => s.tube > F0.boatLock + 0.5;                    // the elevator does not move while the tube is this hot (oxidation-model.js)
  const fmt = v => Math.round(v).toLocaleString('en-US'), clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const AMBIENT = { wet: '습식 (H₂O)', dry: '건식 (O₂)', inert: '질소', none: '가스 없음' };
  const rateText = s => s.growing ? `${s.rate >= 10 ? s.rate.toFixed(0) : s.rate.toFixed(1)} nm/min` : '0';
  const onOff = open => open ? '열림' : '닫힘';
  function recipeText(m) {
    const parts = [];
    if (m.wetMinutes >= 1) parts.push(`습식 ${fmt(m.wetMinutes)}분`);
    if (m.dryMinutes >= 1) parts.push(`건식 ${fmt(m.dryMinutes)}분`);
    return `${parts.join(' + ') || '산화 없음'}, 최고 ${fmt(m.peak)} °C`;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...children) {
    const node = document.createElementNS(SVGNS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, value);
    for (const child of children) if (child != null) node.append(child);
    return node;
  }
  const measuredOnce = new WeakMap(); let measurements = 0;
  /** A number for each measurement, so the page can tell a new report from the one it already shows. */
  const reportId = m => { if (!measuredOnce.has(m)) measuredOnce.set(m, ++measurements); return measuredOnce.get(m); };
  const roundUp = v => { const p = 10 ** Math.floor(Math.log10(v)); return [1, 2, 5, 10].map(k => k * p).find(top => top >= v); };   // the next of 1, 2, 5 times a power of ten
  /** The wafer from above in the colour of its film, with the five places where the thickness was measured. */
  function fivePoint(m) {
    const rgb = FILM.filmColor(m.mean), root = svg('svg', { viewBox: '0 0 240 160', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': `웨이퍼 다섯 곳의 산화막 두께: ${m.points.map(p => fmt(p.value)).join(', ')} nm` });
    root.append(svg('rect', { x: 0, y: 0, width: 240, height: 160, fill: '#f3f5f9' }), svg('circle', { cx: 120, cy: 80, r: 68, fill: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, stroke: '#1e293b33', 'stroke-width': 1.5 }),
      svg('path', { d: 'M114,148 L120,140 L126,148 Z', fill: '#f3f5f9' }));
    for (const p of m.points) {
      const x = 120 + p.x * 68, y = 80 - p.y * 68;
      root.append(svg('circle', { cx: x, cy: y, r: 3, fill: '#1e293b', stroke: '#fff', 'stroke-width': 1.2 }),
        svg('text', { x, y: y - 8, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 700, fill: '#1e293b', stroke: '#ffffffd9', 'stroke-width': 3, 'paint-order': 'stroke' }, fmt(p.value)));
    }
    return root;
  }

  (window.ProcessLabStations = window.ProcessLabStations || {}).oxidation = {
    equipment: 'oxidation',
    views: [['home', '전체'], ['boat', '보트'], ['tube', '튜브'], ['panel', '조작반']],
    speeds: [[60, '1분/초'], [300, '5분/초'], [1200, '20분/초']],
    create: (wafer, seed) => OX.create({ target: F.SPEC.oxide.target, tolerance: F.SPEC.oxide.tolerance, seed, oxide: Math.max(OX.constants.nativeOxide, wafer.oxide) }),
    parts: {
      boat: { name: '보트', role: '웨이퍼 25장을 싣고 튜브 안으로 올라갑니다.', how: `위로 끌면 튜브에 넣고 아래로 끌면 꺼냅니다. 튜브가 ${F0.boatLock} °C보다 뜨거우면 움직이지 않습니다.`,
        rows: s => [['위치', s.sealed ? '튜브 안' : s.boat < 0.02 ? '아래' : locked(s) ? '중간에 멈춤 (잠김)' : '이동 중'], ['웨이퍼 온도', `${fmt(s.wafer)} °C`]], pill: s => s.controls.boat > 0.5 ? '튜브에 넣기' : '꺼내기' },
      setpoint: { name: '온도 조절기', role: `히터의 목표 온도입니다. 히터는 1분에 ${F0.rampUp} °C씩 오르고 ${F0.rampDown} °C씩 내립니다.`, how: '좌우로 끌거나 휠을 굴립니다.',
        rows: s => [['설정', `${fmt(s.controls.setpoint)} °C`], ['튜브', `${fmt(s.tube)} °C`]], pill: s => `${fmt(s.controls.setpoint)} °C` },
      n2: { name: '질소 밸브', role: '반응하지 않는 가스입니다. 웨이퍼를 넣고 꺼낼 때와 식힐 때 흘립니다. 산화 가스와 함께 열면 산화 가스가 묽어집니다.', how: '누르면 열리고 닫힙니다.', rows: s => [['밸브', onOff(s.controls.n2)]] },
      o2: { name: '산소 밸브', role: '건식 산화입니다. 느리지만 얇은 막을 고르게 기릅니다.', how: '누르면 열리고 닫힙니다.', basis: '계산: Massoud 식 (1,000 °C 위는 Deal–Grove 상수)',
        rows: s => [['밸브', onOff(s.controls.o2)], ...(s.ambient === 'dry' ? [['성장 속도', rateText(s)]] : [])] },
      h2o: { name: '수증기 밸브', role: '습식 산화입니다. 수소와 산소를 태워 만든 수증기로, 건식보다 훨씬 빨리 자랍니다.', how: '누르면 열리고 닫힙니다.', basis: '계산: Deal–Grove 식',
        rows: s => [['밸브', onOff(s.controls.h2o)], ...(s.ambient === 'wet' ? [['성장 속도', rateText(s)]] : [])] },
      tube: { name: '공정 튜브', role: '석영으로 만든 반응실입니다. 보트가 올라와 아래를 막으면 가스가 웨이퍼 사이로 흐릅니다.',
        rows: s => [['분위기', s.sealed ? AMBIENT[s.ambient] : '열려 있음'], ...(s.pressure > 0 && s.pressure < 1 ? [['산화 가스 분압', `${s.pressure.toFixed(2)} 기압`]] : []), ['성장 속도', rateText(s)]] },
      heater: { name: '히터', role: '튜브를 둘러싼 가열선입니다. 뜨거워지면 붉게 달아오릅니다.', rows: s => [['튜브 온도', `${fmt(s.tube)} °C`], ['설정', `${fmt(s.controls.setpoint)} °C`]] },
      hmi: { name: '장비 화면', role: '온도, 가스, 지난 시간을 보여 줍니다.', how: '누르면 가까이에서 봅니다.', rows: () => [] },
      tower: { name: '신호등', role: '초록은 산화막이 자라는 중, 노랑은 대기입니다. 받지 않는 조작을 하면 빨강이 깜박입니다.', rows: s => [['상태', s.growing ? '산화 중' : '대기']] },
      exhaust: { name: '배기', role: '쓰고 난 가스를 빼냅니다.', rows: () => [] },
    },
    control(sim, name, value) {
      if (name !== 'boat') { sim.setControl(name, value); return null; }
      return sim.setControl('boat', clamp(value, 0, 1)) ? null : `튜브가 ${F0.boatLock} °C보다 뜨거워 보트가 잠겨 있습니다. 온도를 내리세요.`;
    },
    dragEnd(sim, name) { if (name === 'boat') sim.setControl('boat', sim.state.controls.boat > 0.5 ? 1 : 0); },      // the boat goes all the way
    tick(sim) { const s = sim.state; if (s.measured && s.boat > 0.05) s.measured = null; },                           // back in the furnace: the old measurement no longer holds
    /** What the operator can do next. No temperature, time or gas is suggested. Returns [text, action label, action, part to point at]. */
    guide(sim, next) {
      const s = sim.state, grown = s.minutes.wet + s.minutes.dry > 0.5, oxidant = s.controls.o2 || s.controls.h2o;
      const cool = [`튜브가 뜨거워 보트가 잠겨 있습니다. 온도를 내리세요 (지금 ${fmt(s.tube)} °C).`, null, null, s.controls.setpoint > F0.boatLock ? 'setpoint' : null];   // the boat does not move while the tube is this hot
      if (s.measured) {
        const m = s.measured, verdict = m.ok ? '목표 범위 안입니다' : m.error < 0 ? `목표보다 ${fmt(-m.error)} nm 얇습니다` : `목표보다 ${fmt(m.error)} nm 두껍습니다`;
        return [`산화막 ${fmt(m.mean)} nm. ${verdict}.${m.error < -m.tolerance ? ' 보트를 다시 올려 더 기를 수 있습니다.' : ''}`, `다음: ${next}`, 'finish', null];
      }
      if (s.boat < 0.02 && s.controls.boat < 0.02) {
        if (!grown) return locked(s) ? cool : ['보트를 위로 끌어 웨이퍼를 튜브에 넣으세요.', null, null, 'boat'];
        return sim.canMeasure() ? ['웨이퍼가 식었습니다. 산화막 두께를 잽니다.', '두께 재기', () => sim.measure(), null] : [`웨이퍼가 식는 중입니다 (${fmt(s.wafer)} °C).`, null, null, null];
      }
      if (!s.sealed) return s.controls.boat > s.boat ? ['보트가 올라가는 중입니다.', null, null, null] : s.controls.boat < s.boat ? ['보트가 내려오는 중입니다.', null, null, null]
        : locked(s) ? [`튜브가 뜨거워 보트가 중간에 멈췄습니다. 온도를 내리면 다시 움직입니다 (지금 ${fmt(s.tube)} °C).`, null, null, s.controls.setpoint > F0.boatLock ? 'setpoint' : null] : ['보트가 중간에 멈춰 있습니다. 끝까지 올리거나 내리세요.', null, null, 'boat'];
      if (oxidant) return [s.growing ? '산화막이 자라고 있습니다. 원하는 두께가 되면 산화 가스를 잠그세요.' : '산화 가스가 흐릅니다. 온도가 낮으면 거의 자라지 않습니다.', null, null, null];
      if (!grown) return ['온도 조절기로 온도를 정하고 산화 가스를 여세요. O₂는 건식, H₂O는 습식 산화입니다.', null, null, s.controls.setpoint <= F0.standby ? 'setpoint' : 'h2o'];
      if (locked(s)) return [`보트는 튜브가 식어야 내려옵니다. 온도를 내리세요 (지금 ${fmt(s.tube)} °C).`, null, null, s.controls.setpoint > F0.boatLock ? 'setpoint' : null];
      return ['보트를 아래로 끌어 웨이퍼를 꺼내세요.', null, null, 'boat'];
    },
    view: sim => { const s = sim.state; return { boat: s.boat, tube: s.tube, wafer: s.wafer, controls: s.controls, growing: s.growing, filmColor: FILM.filmColor(s.oxide), filmStrength: clamp((s.oxide - 3) / 40, 0, 1) }; },
    live: (sim, wafer) => ({ ...wafer, oxide: sim.state.oxide }),
    monitor(sim) {
      const s = sim.state, m = s.measured, value = m ? m.mean : s.oxide, target = sim.target, tolerance = sim.tolerance, gap = target - value, minutes = s.minutes.wet + s.minutes.dry;
      const tMax = Math.max(60, s.history.length ? s.history.at(-1).t : 0);
      return {
        picture: { film: s.oxide, hot: s.wafer }, value, unit: 'nm',
        note: m ? (m.ok ? '목표 범위 안 · 계측값' : `목표와 <b>${fmt(Math.abs(m.error))} nm</b> 차이 · 계측값`) : gap >= 0 ? `목표까지 <b>${fmt(gap)} nm</b> · 계산값` : `목표보다 <b>${fmt(-gap)} nm</b> 두꺼움 · 계산값`,
        meter: { value, target, tolerance, scale: target * 1.6 },
        trend: { label: '산화막 두께 추이', points: s.history, x: p => p.t, y: p => p.oxide, xMax: tMax, yMax: Math.max(target * 1.3, s.oxide * 1.12), band: [target - tolerance, target + tolerance], xLabel: `${fmt(tMax)}분`,
          tip: p => [`${fmt(p.oxide)} nm`, ` · ${fmt(p.t)}분 · 웨이퍼 ${fmt(p.wafer)} °C`] },
        now: `웨이퍼 <b>${fmt(s.wafer)} °C</b> · ${s.sealed ? AMBIENT[s.ambient] : '튜브 밖'}${minutes >= 1 ? ` · 산화 <b>${fmt(minutes)}분</b>` : ''}`,
        spec: [`목표 ${fmt(target)} ± ${fmt(tolerance)} nm`],
      };
    },
    screen(sim) {
      const s = sim.state, total = Math.floor(s.time / 60);
      return {
        name: 'VF-01', title: 'OXIDATION', running: s.growing,
        state: s.growing ? `OXIDATION · ${s.ambient === 'wet' ? 'WET' : 'DRY'}` : !s.sealed ? (s.boat > 0.02 ? 'BOAT MOVING' : 'BOAT DOWN') : Math.abs(s.controls.setpoint - s.tube) > 2 ? (s.controls.setpoint > s.tube ? 'RAMP UP' : 'COOL DOWN') : 'HOLD',
        big: ['TUBE', fmt(s.tube), '°C'],
        cells: [['SET', fmt(s.controls.setpoint)], ['WAFER', fmt(s.wafer)], ['TIME', `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`]],
        chips: [['N₂', s.controls.n2], ['O₂', s.controls.o2], ['H₂O', s.controls.h2o]], bar: ['BOAT', s.boat],
      };
    },
    result(sim) { const m = sim.state.measured; return m ? { mean: m.mean, how: recipeText(m) } : null; },

    // ----- process instruments and metrology report (the frame is in app.js) -----
    running(sim) { const s = sim.state; return (s.boat > 0.02 || s.controls.boat > 0.02) && !s.measured; },
    instruments(sim) {
      const s = sim.state, h = s.history, target = sim.target, tolerance = sim.tolerance, minutes = Math.max(60, h.length ? h.at(-1).t : 0);
      const near = (points, x) => points.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, points[0]);
      const oxide = h.map(p => [p.t, p.oxide]), tube = h.map(p => [p.t, p.tube]), wafer = h.map(p => [p.t, p.wafer]);
      const rate = h.slice(1).map((p, i) => [p.t, Math.max(0, (p.oxide - h[i].oxide) / (p.t - h[i].t || 1))]);     // nm per minute between two samples
      const time = [[0, '0'], [minutes, `${fmt(minutes)}분`]], top = Math.max(target * 1.3, s.oxide * 1.12), rateTop = roundUp(Math.max(1, ...rate.map(p => p[1])));
      const perMinute = v => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
      return [
        { title: '산화막', unit: 'nm', value: fmt(s.oxide), label: '시간에 따른 산화막 두께. 띠는 목표 범위',
          plot: { x: [0, minutes], y: [0, top], yTicks: [0, target], xTicks: time, band: [target - tolerance, target + tolerance], series: oxide },
          tip: x => { if (!oxide.length) return null; const p = near(oxide, x); return [`${fmt(p[0])}분`, [[`${fmt(p[1])} nm`, '산화막'], [`${fmt(target - p[1])} nm`, '목표까지']]]; } },
        { title: '성장 속도', unit: 'nm/min', value: s.growing ? perMinute(s.rate) : '0', label: '시간에 따른 산화막의 성장 속도',
          plot: { x: [0, minutes], y: [0, rateTop], yTicks: [0, rateTop / 2, rateTop], yFormat: v => (Number.isInteger(v) ? String(v) : v.toFixed(1)), xTicks: time, series: rate, quiet: true },
          tip: x => { if (!rate.length) return null; const p = near(rate, x); return [`${fmt(p[0])}분`, [[`${perMinute(p[1])} nm/min`, '성장 속도'], [`${fmt(near(oxide, x)[1])} nm`, '그때의 두께']]]; } },
        { title: '튜브', unit: '°C', value: fmt(s.tube), label: `시간에 따른 튜브 온도. 선 위에서는 보트가 잠깁니다 (${F0.boatLock} °C)`,
          plot: { x: [0, minutes], y: [0, F0.maxSet + 100], yTicks: [0, 600, 1200], xTicks: time, limit: F0.boatLock, limitLabel: '보트 잠김', series: tube, quiet: true },
          tip: x => { if (!tube.length) return null; const p = near(tube, x); return [`${fmt(p[0])}분`, [[`${fmt(p[1])} °C`, '튜브'], [`${fmt(near(wafer, x)[1])} °C`, '웨이퍼']]]; } },
      ];
    },
    report(sim) {
      const s = sim.state, m = s.measured; if (!m) return null;
      const lo = m.target - 4 * m.tolerance, hi = m.target + 4 * m.tolerance, values = m.points.map(p => p.value), notes = [];
      if (m.ok) notes.push(`평균 ${fmt(m.mean)} nm로 목표 범위(${fmt(m.target - m.tolerance)}~${fmt(m.target + m.tolerance)} nm) 안입니다. 이 막이 포토와 식각에서 무늬를 새길 마스크가 됩니다.`);
      else if (m.error < 0) notes.push(`목표보다 ${fmt(-m.error)} nm 얇습니다. 보트를 다시 올려 더 기를 수 있습니다. 막이 두꺼워질수록 산화 가스가 막을 지나 실리콘까지 가는 데 오래 걸려, 같은 시간에 자라는 두께는 줄어듭니다.`);
      else notes.push(`목표보다 ${fmt(m.error)} nm 두껍습니다. 기른 산화막은 이 장비에서 줄일 수 없어, 목표에 맞추려면 이 공정을 다시 해야 합니다. 이대로 넘기면 식각에서 창을 뚫는 데 더 오래 걸립니다.`);
      if (m.wetMinutes >= 1 || m.dryMinutes >= 1) notes.push('습식 산화는 건식보다 훨씬 빨라 두꺼운 막에 쓰고, 건식 산화는 느리지만 막이 치밀해 얇은 막에 씁니다.');
      return {
        id: reportId(m), title: '산화막', sub: recipeText(m), pass: m.ok,
        criteria: [
          { label: '평균 두께', value: `${fmt(m.mean)} nm`, ok: m.ok, fail: m.error < 0 ? '얇음' : '두꺼움', track: { value: m.mean, lo, hi, band: [m.target - m.tolerance, m.target + m.tolerance] },
            scale: [fmt(lo), `목표 ${fmt(m.target)} ± ${fmt(m.tolerance)}`, fmt(hi)] },
        ],
        figures: [{ caption: '다섯 곳에서 잰 두께 (nm). 웨이퍼의 색은 이 두께의 산화막이 띠는 색입니다', node: fivePoint(m) }],
        notes,
        stats: [['습식 산화', `${fmt(m.wetMinutes)}분`], ['건식 산화', `${fmt(m.dryMinutes)}분`], ['웨이퍼 최고 온도', `${fmt(m.peak)} °C`], ['걸린 시간', `${fmt(m.totalMinutes)}분`], ['다섯 곳의 범위', `${fmt(Math.min(...values))}~${fmt(Math.max(...values))} nm`]],
      };
    },
  };
})();
