/* CMP lab simulator view (issue #6): HMI console, machine animation, charts and decisions. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const E = window.LabSimEngine, M = window.LabStateModel;
  const SVG = 'http://www.w3.org/2000/svg';
  const fmt = (x, d = 2) => (x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toFixed(d));
  const pct = (x, d = 1) => (Number.isFinite(x) ? `${x.toFixed(d)}%` : '—');
  const PHASE = { load: '로딩', pressurize: '가압', polish: '본 연마', rinse: '린스 (저압)', unload: '탈착 · 언로딩' };
  const STATE_TEXT = { idle: '대기', ready: '투입 대기', run: '가공 중', decide: '계측 결정', alarm: '공정 경보', done: '운전 종료' };
  const GAUGES = [
    { key: 'p_main', label: '주 압력', d: 1, ref: true },
    { key: 'p_retainer', label: '리테이너 압력', d: 0 },
    { key: 'wafer_rot', label: '웨이퍼 회전', d: 1 },
    { key: 'stage_rot', label: '스테이지 회전', d: 1 },
    { key: 'head_rot', label: '헤드 회전', d: 1 },
    { key: 'slurry_c', label: '슬러리 C 유량', d: 0 },
  ];
  const STORE = 'cmp-lab-sim-runs-v1';
  // Chart colours follow the CMP Lab tokens (light ground, brand blue).
  const C = { grid: '#eef2f7', axis: '#8b98ab', brand: '#0d6efd', band: '#0d6efd', pred: '#5b8def', ok: '#10b981',
    warn: '#f59e0b', alarm: '#dc2626', hist: '#cbd5e1', hidden: '#94a3b8', next: '#f97316', event: '#f97316', cursor: '#94a3b8', track: '#edf1f7' };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let modelJson = null, replay = null, session = null, task = null, policy = null, runLabel = '';
  let speed = 8, paused = false, auto = false, spcRecipe = 'A456';
  let run = null;                  // { elapsed, total, sample, spark, trend, autoAdjusted, lastTrendAt }
  let wait = 0;                    // real seconds before an automatic next action
  let anim = { platen: 0, carrier: 0, stage3d: 0, head3d: 0, t: 0, drops: [] };
  let scene3D = null, lastSceneKey = '';
  let lastFrame = 0, lastPaint = 0, selectedTask = null;

  /* ---------- helpers ---------- */
  function el(tag, attrs = {}, text) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v !== undefined && v !== null) n.setAttribute(k, v); }
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svg(tag, attrs = {}) { const n = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; }
  function clock(hours, extraS = 0) {
    const total = Math.max(0, hours * 3600 + extraS), d = Math.floor(total / 86400), r = total - d * 86400;
    const hh = String(Math.floor(r / 3600)).padStart(2, '0'), mm = String(Math.floor(r % 3600 / 60)).padStart(2, '0'), ss = String(Math.floor(r % 60)).padStart(2, '0');
    return `D+${d} ${hh}:${mm}:${ss}`;
  }
  const storeGet = () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } };
  const storePut = v => { try { localStorage.setItem(STORE, JSON.stringify(v.slice(-40))); } catch { /* per-viewer convenience only */ } };
  const policyText = p => `${p.sample === 'manual' ? '직접 결정' : p.sample === 1 ? '매 장 계측' : `${p.sample}장마다 계측`} · ${p.delay ? `${p.delay}장 지연` : '즉시 반영'}`;

  /* ---------- static UI ---------- */
  function buildGauges() {
    const host = $('gauges'); host.replaceChildren();
    for (const g of GAUGES) {
      const box = el('div', { class: 'gauge', id: `g-${g.key}` });
      box.append(el('div', { class: 'lab' }, g.label), el('b', { id: `gv-${g.key}` }, '—'), el('div', { class: 'ref', id: `gr-${g.key}` }, g.ref ? '기준 —' : '원시값'));
      const s = svg('svg', { viewBox: '0 0 100 26', preserveAspectRatio: 'none', 'aria-hidden': 'true' }); s.append(svg('path', { id: `gs-${g.key}`, d: '' }));
      box.append(s); host.append(box);
    }
  }

  function buildTaskDialog() {
    const grid = $('task-grid'); grid.replaceChildren();
    const done = new Set(storeGet().filter(r => r.passed).map(r => r.task));
    for (const t of E.TASKS) {
      const b = el('button', { type: 'button', class: 'task-card', 'aria-pressed': 'false', 'data-task': t.id });
      b.append(el('span', { class: 'code' }, t.code), el('strong', {}, t.title), el('p', {}, t.goal));
      const ul = el('ul'); t.focus.forEach(f => ul.append(el('li', {}, f))); b.append(ul);
      b.append(el('span', { class: 'meta' }, `W${String(t.start).padStart(3, '0')}부터 ${t.count}장 · ${t.runs ? '자동 R2R 2회 비교' : policyText(t.policy)}`));
      if (done.has(t.id)) b.append(el('span', { class: 'done' }, '✓ 통과한 과제'));
      b.addEventListener('click', () => {
        grid.querySelectorAll('.task-card').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
        selectedTask = t; $('task-start').disabled = false; $('free-config').hidden = !t.configurable;
      });
      grid.append(b);
    }
  }

  /* ---------- session control ---------- */
  function startTask(t, runIndex = 0) {
    task = t;
    if (t.runs) { policy = { ...t.runs[runIndex].policy }; auto = true; runLabel = t.runs[runIndex].label; }
    else if (t.configurable) {
      const sv = $('cfg-sample').value; policy = { sample: sv === 'manual' ? 'manual' : Number(sv), delay: Number($('cfg-delay').value) };
      runLabel = policyText(policy);
    } else { policy = { ...t.policy }; auto = !!t.auto; runLabel = policyText(policy); }
    $('auto-mode').checked = auto;
    session = E.createSession({ modelJson, replay, LabStateModel: M, task: t, policy, auto });
    session.runIndex = runIndex;
    run = null; wait = auto ? 0.6 : 0; paused = false; $('pause').setAttribute('aria-pressed', 'false'); $('pause').textContent = '일시정지';
    setSpeed(auto ? 128 : 8);
    $('task-name').textContent = `${t.code} · ${t.title}${t.runs ? ` (${t.runs[runIndex].label.split('.')[0]})` : ''}`;
    syncPolicyControls(); renderTaskTab(); selectTab('run');
    resetProcessView();
    renderAll();
  }

  /* ---------- menu, guide, task tab, policy ---------- */
  function selectTab(name) {
    for (const t of ['run', 'metrology', 'task']) {
      $(`tab-${t}`).setAttribute('aria-selected', String(t === name));
      $(`panel-${t}`).hidden = t !== name;
    }
  }

  function renderTaskTab() {
    if (!task) return;
    $('task-title').textContent = `${task.code} · ${task.title}`;
    $('task-goal').textContent = task.goal;
    $('task-focus').replaceChildren(...task.focus.map(f => el('li', {}, f)));
  }

  function syncPolicyControls() {
    const editable = !!(task && task.configurable);
    $('policy-sample').value = String(policy.sample); $('policy-delay').value = String(policy.delay);
    $('policy-sample').disabled = !editable; $('policy-delay').disabled = !editable;
    $('policy-note').textContent = editable
      ? '자유 운전에서는 운전 중에도 바꿀 수 있습니다. 다음 계측 결정부터 적용됩니다.'
      : '이 과제는 비교를 위해 계측 정책이 고정되어 있습니다. 바꾸려면 자유 운전을 고르세요.';
    $('policy-label').textContent = policyText(policy);
  }

  function changePolicy() {
    if (!session || !task || !task.configurable) return;
    const sv = $('policy-sample').value;
    policy = { sample: sv === 'manual' ? 'manual' : Number(sv), delay: Number($('policy-delay').value) };
    session.state.policy = { ...policy }; runLabel = policyText(policy);
    syncPolicyControls(); renderDecide(); renderGuide();
  }

  function renderGuide() {
    const text = $('guide-text'), order = ['ready', 'run', 'decide', 'done'];
    let msg = '‘과제 선택’에서 과제를 고르면 운전이 시작됩니다.', tone = '', k = -1;
    if (session) {
      const st = session.state, rec = st.records[st.records.length - 1];
      k = order.indexOf(st.phase);
      if (st.phase === 'ready') msg = auto ? '자동 R2R 운전 중입니다. 모델 권장 시간으로 다음 웨이퍼를 자동 투입합니다.'
        : '오른쪽 [운전] 메뉴에서 예측 MRR을 보고 연마 시간을 정한 뒤 ‘연마 시작’을 누르세요.';
      else if (st.phase === 'run') {
        if (st.run && st.run.alarm) { tone = 'alarm'; msg = auto ? '압력 경보! 자동 R2R이 종료 시간을 조정합니다.' : '압력 경보! 오른쪽 [운전] 메뉴에서 종료 시간을 조정할지 판단하세요.'; }
        else msg = '장비가 연마 중입니다. 3D 장비와 아래 ‘결과’의 실시간 공정 데이터를 지켜보세요.';
      } else if (st.phase === 'decide') {
        const planned = session.shouldMeasure(rec);
        msg = auto ? '자동 R2R 운전 중입니다.' : planned === null
          ? '이 웨이퍼를 계측할지 오른쪽에서 정하세요. 계측해야 실제 결과를 알 수 있고 상태 추정이 갱신됩니다.'
          : `계측 정책에 따라 이 웨이퍼는 ${planned ? '계측합니다' : '계측하지 않습니다'}. 오른쪽 버튼으로 다음 웨이퍼로 넘어가세요.`;
      } else msg = '운전이 끝났습니다. ‘결과 보기’로 수율과 예측 정확도를 확인하세요.';
    }
    document.querySelectorAll('#guide-steps li').forEach((li, i) => { li.classList.toggle('active', i === k); li.classList.toggle('done', k >= 0 && i < k); });
    if (text.textContent !== msg) text.textContent = msg;
    text.dataset.tone = tone;
  }

  function renderHudAlarm(s) {
    const box = $('hud-alarm'), r = session && session.state.run;
    if (!s || !r || !s.alarm || session.state.phase !== 'run') { if (!box.hidden) { box.hidden = true; box.dataset.key = ''; } return; }
    const alpha = modelJson.recipes[r.wafer.recipe].alpha;
    const key = `${r.wafer.n}|${(s.pressureDev * 100).toFixed(1)}|${alpha > 0 ? s.inproc.mrr.toFixed(2) : ''}`;
    if (box.dataset.key === key && !box.hidden) return;
    box.dataset.key = key; box.hidden = false;
    box.replaceChildren(el('strong', {}, `공정 경보 · 주 압력 ${(s.pressureDev * 100).toFixed(1)}%`),
      el('span', {}, alpha > 0 ? `예측 MRR ${fmt(r.pre.mrr, 2)} → ${fmt(s.inproc.mrr, 2)} (연마 중 보정)` : `${r.wafer.recipe}는 압력 반응이 확인되지 않아 예측을 보정하지 않습니다.`));
  }

  function setSpeed(v) {
    speed = v;
    document.querySelectorAll('#speed button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === v)));
  }

  function beginWafer(t) {
    try {
      const r = session.begin(t);
      run = { elapsed: 0, total: r.tl.total(), sample: null, spark: {}, trend: [], autoAdjusted: false, lastTrendAt: -1 };
      GAUGES.forEach(g => { run.spark[g.key] = []; });
      renderAll();
    } catch (err) { flashError(err.message); }
  }

  function finishWafer() {
    const rec = session.finish();
    run.sample = session.sample(run.total) || run.sample;
    const planned = session.shouldMeasure(rec);
    wait = auto ? 0.5 : 0; // manual operation waits for the operator's click, so step 3 is never skipped
    void planned;
    renderAll();
    return rec;
  }

  function decideMetrology(measure) {
    const next = session.metrology(measure);
    run = null;
    if (!next) { renderAll(); setTimeout(showDebrief, 400); return; }
    wait = auto ? 0.35 : 0;
    resetProcessView();
    renderAll();
  }

  /* ---------- frame loop ---------- */
  function frame(ts) {
    const dt = Math.min(0.1, lastFrame ? (ts - lastFrame) / 1000 : 0); lastFrame = ts;
    if (session && !paused) step(dt);
    animateMachine(dt);
    if (ts - lastPaint > 60) { lastPaint = ts; if (run && run.sample) paintProcess(run.sample); }
    requestAnimationFrame(frame);
  }

  function step(dt) {
    const st = session.state;
    if (st.phase === 'run' && run) {
      run.elapsed = Math.min(run.total, run.elapsed + dt * speed);
      const s = session.sample(run.elapsed); run.sample = s; run.total = s.total;
      recordSeries(s);
      if (auto && s.suggestion && !run.autoAdjusted) {
        try { session.adjust(s.suggestion, run.elapsed); run.autoAdjusted = true; } catch { run.autoAdjusted = true; }
      }
      if (s.alarm && !run.alarmShown) { run.alarmShown = true; renderDecide(); renderLog(); renderTop(); }
      if (run.elapsed >= run.total) finishWafer();
    } else if (st.phase === 'decide' && wait > 0) {
      wait -= dt;
      const rec = st.records[st.records.length - 1], planned = session.shouldMeasure(rec);
      // A manual metrology policy waits for the operator; the automatic controller measures in that case.
      if (wait <= 0 && (planned !== null || auto)) decideMetrology(planned === null ? true : planned);
    } else if (st.phase === 'ready' && auto && wait >= 0) {
      wait -= dt;
      if (wait <= 0) { wait = -1; beginWafer(session.current().recommended); }
    }
  }

  function recordSeries(s) {
    for (const g of GAUGES) {
      const arr = run.spark[g.key]; const v = s.values[g.key];
      if (!arr.length || s.elapsed - arr[arr.length - 1][0] >= 1) { arr.push([s.elapsed, v]); if (arr.length > 60) arr.shift(); }
    }
    if (s.elapsed - run.lastTrendAt >= 0.5) { run.trend.push([s.elapsed, s.values.p_main, s.phase]); run.lastTrendAt = s.elapsed; }
  }

  /* ---------- 3D polishing unit (team scene) ---------- */
  function initScene() {
    const useSvg = () => { scene3D = null; $('machine').hidden = false; $('cmp-scene').dataset.renderer = 'unavailable'; };
    if (!window.CMPScene || !window.CMPSceneModel || !window.CMPSceneParts) { useSvg(); return; }
    try {
      scene3D = window.CMPScene.create({ host: $('cmp-scene'), canvas: $('cmp-canvas'), fallback: $('scene-fallback'),
        detail: $('scene-detail'), onUnavailable: useSvg });
    } catch { useSvg(); return; }
    if (!scene3D) { useSvg(); return; }
    document.querySelectorAll('[data-scene-view]').forEach(b => b.addEventListener('click', () => scene3D?.setView(b.dataset.sceneView)));
    $('scene-transparent').addEventListener('change', () => scene3D?.setTransparent($('scene-transparent').checked));
    $('scene-cutaway').addEventListener('change', () => { scene3D?.setCutaway($('scene-cutaway').checked); lastSceneKey = ''; });
    $('scene-zoom-in').addEventListener('click', () => scene3D?.zoom(0.85));
    $('scene-zoom-out').addEventListener('click', () => scene3D?.zoom(1.15));
  }

  /* Map one replayed sensor sample onto the team scene's display frame (display geometry only). */
  function sceneFrame(s) {
    const r = session && session.state.run;
    if (!s || !r) return null;
    const clamp01 = v => Math.max(0, Math.min(1, v));
    let phase, engagement;
    if (s.phase === 'load' || s.phase === 'pressurize') { phase = 'approach'; engagement = clamp01(s.elapsed / Math.max(1, r.tl.pre)); }
    else if (s.phase === 'polish' || s.phase === 'rinse') { phase = 'contact'; engagement = 1; }
    else { phase = 'release'; engagement = 1 - clamp01((s.elapsed - (s.total - 12)) / 12); }
    const pr = Math.max(0, Math.min(1.15, s.values.p_main / r.meta.p_ref));
    return { progress: anim.t / 40, rotation: anim.head3d, stageRotation: anim.stage3d,
      slurryRatio: Math.max(0, Math.min(1.6, s.values.slurry_c / 450)), phase, engagement,
      removedFraction: clamp01(s.mainElapsed / s.tSet) * 0.85, compression: (2 + 12 * pr / 1.15) * engagement,
      contactOpacity: phase === 'contact' ? 0.25 + 0.5 * clamp01((pr - 0.9) / 0.2) : 0 };
  }

  function driveScene(s) {
    if (!scene3D) return;
    const running = !!(s && session && session.state.phase === 'run');
    const host = $('cmp-scene');
    host.dataset.alarm = String(!!(running && s.alarm && s.phase === 'polish'));
    const frame = running || (s && session && session.state.phase === 'decide') ? sceneFrame(s) : null;
    // Re-render only when something visible changed (idle scenes stay still).
    const key = frame ? `${frame.phase}|${frame.engagement.toFixed(3)}|${frame.rotation.toFixed(1)}|${frame.stageRotation.toFixed(1)}|${frame.compression.toFixed(2)}` : 'idle';
    if (key === lastSceneKey) return;
    lastSceneKey = key;
    scene3D.setState(running ? 'running' : 'idle');
    scene3D.setFrame(frame);
  }

  /* ---------- machine animation ---------- */
  function animateMachine(dt) {
    const s = run && run.sample, polishing = s && (s.phase === 'polish' || s.phase === 'rinse');
    const vis = Math.min(speed, 3) * (reduceMotion ? 0 : 1);
    const platenRate = s ? (polishing ? Math.max(s.values.stage_rot, 40) : s.values.stage_rot * 0.3) : 6;
    const carrierRate = s ? (s.values.wafer_rot + 0.3 * s.values.head_rot) : 0;
    anim.platen = (anim.platen + platenRate * 1.6 * dt * vis) % 360;
    anim.carrier = (anim.carrier + carrierRate * 2.2 * dt * vis) % 360;
    // The team scene scales pad angle by 0.55 and head angle by 0.30; wrap at their full turns.
    if (session && session.state.phase === 'run') {
      anim.stage3d = (anim.stage3d + platenRate * 0.8 * dt * vis) % (360 / 0.55);
      anim.head3d = (anim.head3d + carrierRate * 3.5 * dt * vis) % (360 / 0.30);
    }
    anim.t += dt * vis;
    driveScene(s);
    if ($('machine').hidden) return; // 2D fallback only when the 3D unit is unavailable
    $('platen').setAttribute('transform', `rotate(${anim.platen.toFixed(2)} 230 185)`);
    $('carrier-spin').setAttribute('transform', `rotate(${anim.carrier.toFixed(2)})`);
    $('conditioner').setAttribute('transform', `rotate(${(polishing ? 9 * Math.sin(anim.t * 0.9) : 0).toFixed(2)} 470 300)`);
    // carrier travel during loading / unloading
    // Carrier travels from the load cup (upper right) onto the pad while loading, and back while unloading.
    let travel = 0; // 0 = on the pad, 1 = at the load cup
    if (s && session.state.run) {
      const pre = session.state.run.tl.pre;
      if (s.phase === 'load' || s.phase === 'pressurize') travel = 1 - Math.min(1, s.elapsed / Math.max(1, pre));
      else if (s.phase === 'unload') travel = Math.min(1, Math.max(0, (s.elapsed - (s.total - 12)) / 12));
    } else if (!s || !session || session.state.phase !== 'run') travel = 1;
    const x = 282 + (470 - 282) * travel, y = 160 - (160 - 82) * travel, scale = 1 - 0.08 * travel;
    $('carrier').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`);
    const glow = $('press-glow');
    glow.setAttribute('cx', x.toFixed(1)); glow.setAttribute('cy', y.toFixed(1));
    if (s && s.phase === 'polish') {
      const dev = Math.abs(s.pressureDev || 0);
      glow.setAttribute('fill', dev > E.PRESSURE_ALARM ? C.alarm : C.brand);
      glow.setAttribute('opacity', (0.18 + 0.22 * Math.min(1.2, s.values.p_main / (run && session.state.run ? session.state.run.meta.p_ref : 260))).toFixed(2));
    } else glow.setAttribute('opacity', '0');
    $('slurry-film').setAttribute('opacity', s && s.values.slurry_c > 20 ? '1' : '0');
    // slurry drops from the nozzle
    const drops = $('drops'), flow = s ? s.values.slurry_c : 0;
    if (flow > 20 && !reduceMotion && Math.random() < Math.min(0.9, flow / 600) * Math.min(1, dt * 30)) {
      const c = svg('circle', { r: '3', class: 'drop', cx: '299', cy: '106' }); drops.append(c); anim.drops.push({ c, y: 106, v: 30 + Math.random() * 30 });
    }
    anim.drops = anim.drops.filter(d => { d.y += d.v * dt * 3; d.c.setAttribute('cy', d.y.toFixed(1)); d.c.setAttribute('opacity', Math.max(0, 1 - (d.y - 106) / 60).toFixed(2)); if (d.y > 166) { d.c.remove(); return false; } return true; });
  }

  /* ---------- painting ---------- */
  function resetProcessView() {
    $('trend').replaceChildren();
    GAUGES.forEach(g => { $(`gv-${g.key}`).textContent = '—'; $(`gs-${g.key}`).setAttribute('d', ''); $(`g-${g.key}`).removeAttribute('data-alert'); });
    document.querySelectorAll('#steps li').forEach(li => li.classList.remove('active', 'done'));
    $('removal-pct').textContent = '—'; $('removal-fill').style.width = '0'; $('removal-proj').style.width = '0';
  }

  function paintProcess(s) {
    const r = session.state.run, meta = r ? r.meta : null;
    const order = ['load', 'pressurize', 'polish', 'rinse', 'unload'], k = order.indexOf(s.phase);
    document.querySelectorAll('#steps li').forEach((li, i) => { li.classList.toggle('active', i === k); li.classList.toggle('done', i < k); });
    renderHudAlarm(s);
    $('machine-phase').textContent = PHASE[s.phase] || '';
    $('machine-sub').textContent = `${r ? r.wafer.label : ''} · ${fmt(s.elapsed, 0)} / ${fmt(s.total, 0)}초${s.phase === 'polish' ? ` · 본 연마 ${fmt(s.mainElapsed, 0)}/${fmt(s.tSet, 1)}초` : ''}`;
    for (const g of GAUGES) {
      const v = s.values[g.key]; $(`gv-${g.key}`).textContent = fmt(v, g.d);
      if (g.ref && meta) {
        const dev = s.phase === 'polish' ? v / meta.p_ref - 1 : 0;
        $(`gr-${g.key}`).textContent = `기준 ${fmt(meta.p_ref, 1)} · ${s.phase === 'polish' ? `${dev >= 0 ? '+' : ''}${(dev * 100).toFixed(1)}%` : '—'}`;
        const box = $(`g-${g.key}`);
        if (s.phase === 'polish' && Math.abs(s.pressureDev) > E.PRESSURE_ALARM) box.setAttribute('data-alert', 'alarm'); else box.removeAttribute('data-alert');
      }
      const arr = run.spark[g.key];
      if (arr.length > 1) {
        const vals = arr.map(a => a[1]), lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
        $(`gs-${g.key}`).setAttribute('d', arr.map((a, i) => `${i ? 'L' : 'M'}${(i / 59 * 100).toFixed(1)} ${(24 - (a[1] - lo) / span * 22).toFixed(1)}`).join(''));
      }
    }
    paintTrend(s, meta);
    if (Number.isFinite(s.predictedRemovalPct)) {
      $('removal-pct').textContent = pct(s.predictedRemovalPct);
      $('removal-fill').style.width = `${Math.min(100, s.predictedRemovalPct / 1.15)}%`;
      $('removal-proj').style.width = `${Math.min(100, s.projectedFinalPct / 1.15)}%`;
      $('removal-note').textContent = s.correctionApplied
        ? `연마 중 압력 보정 적용: 최종 예상 ${pct(s.projectedFinalPct)} (점선). 실제 값은 계측 후 확인됩니다.`
        : `최종 예상 ${pct(s.projectedFinalPct)} (점선). 실제 제거량은 계측 전까지 알 수 없습니다.`;
    }
    if (session.state.phase === 'run') paintDecideRun(s);
  }

  function paintTrend(s, meta) {
    const host = $('trend'); host.replaceChildren();
    if (!meta) return;
    const W = 640, H = 120, top = meta.p_ref * 1.12, x = t => t / s.total * W, y = p => H - 6 - Math.max(0, p) / top * (H - 14);
    const r = session.state.run, pre = r.tl.pre;
    host.append(svg('rect', { x: x(pre), y: 0, width: Math.max(0, x(pre + s.tSet) - x(pre)), height: H, fill: C.brand, opacity: '0.05' }));
    const bandTop = y(meta.p_ref * (1 + E.PRESSURE_ALARM)), bandBottom = y(meta.p_ref * (1 - E.PRESSURE_ALARM));
    host.append(svg('rect', { x: 0, y: bandTop, width: W, height: Math.max(1, bandBottom - bandTop), fill: C.warn, opacity: '0.18' }));
    host.append(svg('line', { x1: 0, x2: W, y1: y(meta.p_ref), y2: y(meta.p_ref), stroke: C.ok, 'stroke-dasharray': '6 4', 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }));
    if (run.trend.length > 1) {
      host.append(svg('path', { d: run.trend.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(''), fill: 'none', stroke: Math.abs(s.pressureDev) > E.PRESSURE_ALARM ? C.alarm : C.brand, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
    }
    host.append(svg('line', { x1: x(s.elapsed), x2: x(s.elapsed), y1: 0, y2: H, stroke: C.cursor, opacity: '0.7', 'vector-effect': 'non-scaling-stroke' }));
  }

  function renderTop() {
    const st = session.state, c = st.phase === 'ready' ? session.current() : null;
    let state = st.phase === 'run' ? 'run' : st.phase === 'decide' ? 'decide' : st.phase === 'done' ? 'done' : 'ready';
    if (st.phase === 'run' && st.run && st.run.alarm) state = 'alarm';
    const chip = $('tool-state'); chip.dataset.state = state; chip.querySelector('span').textContent = STATE_TEXT[state];
    renderGuide();
    const w = st.run ? st.run.wafer : (c ? c.wafer : session.wafers[st.n - 1]);
    $('sim-clock').textContent = clock(w.t_start_h, run ? run.elapsed : 0);
    const done = st.records.length, total = st.end - st.task.start + 1;
    $('lot-progress').textContent = `${w.label} · ${done}/${total}`;
    $('lot-bar').style.width = `${100 * done / total}%`;
  }

  function renderEquipment() {
    const st = session.state, w = st.run ? st.run.wafer : session.wafers[st.n - 1];
    $('pad-usage').textContent = fmt(w.u_pad, 1); $('pad-meter').style.width = `${Math.min(100, w.u_pad / 3.6)}%`;
    $('dresser-usage').textContent = fmt(w.u_dresser, 1);
    let since = null; for (let n = w.n; n >= 1; n--) { if (session.wafers[n - 1].pad_change) { since = w.n - n; break; } }
    $('since-pad').textContent = since === null ? '기록 이전' : `${since}장`;
    $('idle-time').textContent = w.gap_s >= 3600 ? `${(w.gap_s / 3600).toFixed(1)}시간` : w.gap_s >= 60 ? `${Math.round(w.gap_s / 60)}분` : `${Math.round(w.gap_s)}초`;
    const host = $('state-est'); host.replaceChildren();
    for (const recipe of ['A456', 'B456']) {
      const snap = session.model.tracker(recipe).snapshot(), p = modelJson.recipes[recipe];
      const nextPos = (() => { for (let n = st.n; n <= session.wafers.length; n++) if (session.wafers[n - 1].recipe === recipe) return session.wafers[n - 1].position; return snap.at; })();
      const sd = Math.sqrt(snap.var + Math.max(1, nextPos - snap.at) * p.q);
      const box = el('div', { class: 'est' });
      const row = el('div', { class: 'row' }); row.append(el('span', { class: `name ${recipe}` }, recipe), el('b', {}, fmt(snap.level, 2)));
      box.append(row, el('div', { class: 'sub' }, `± ${fmt(sd, 2)} · 측정 후 ${Math.max(0, nextPos - snap.at - 1)}장 경과`));
      const u = el('div', { class: 'unc' }); const ui = el('i'); ui.style.width = `${Math.min(100, sd / 6 * 100)}%`; u.append(ui); box.append(u);
      host.append(box);
    }
  }

  function renderWaferAndPrediction() {
    const st = session.state;
    if (st.phase === 'done') { $('wafer-label').textContent = '종료'; $('wafer-flags').replaceChildren(); return; }
    const c = session.current(), live = st.run && run && run.sample && run.sample.inproc && run.sample.elapsed > st.run.tl.pre + 5;
    const w = st.run ? st.run.wafer : c.wafer;
    $('wafer-kind').textContent = st.phase === 'run' ? '가공 중 웨이퍼' : st.phase === 'decide' ? '연마 완료 웨이퍼' : '다음 웨이퍼';
    $('wafer-label').textContent = w.label;
    const rc = $('wafer-recipe'); rc.textContent = w.recipe; rc.className = `recipe ${w.recipe}`;
    const flags = $('wafer-flags'); flags.replaceChildren();
    if (w.after_rest) flags.append(el('li', { class: 'warn' }, '휴지 후 첫 장'));
    if (w.after_pad_change) flags.append(el('li', { class: 'warn' }, '패드 교체 후 첫 장'));
    if (st.queue.length) flags.append(el('li', {}, `계측 대기 ${st.queue.length}건`));
    if (st.run && st.run.alarm) flags.append(el('li', { class: 'alarm' }, '압력 경보'));
    if (!flags.children.length) flags.append(el('li', {}, '정상 운전'));
    const p = st.phase === 'decide' ? st.records[st.records.length - 1].inproc : (live ? run.sample.inproc : (st.run ? st.run.pre : c.pred));
    $('predict-stage').textContent = st.phase === 'decide' ? '연마 후 · 계측 전 추정' : live ? '연마 중 · 실시간 보정' : '투입 전';
    $('pred-mrr').textContent = fmt(p && p.mrr, 2);
    $('pred-low').textContent = fmt(p && p.low, 2); $('pred-high').textContent = fmt(p && p.high, 2);
    $('pred-level').textContent = p ? `${fmt(p.level, 2)} ± ${fmt(p.level_sd, 2)}` : '—';
    $('pred-steps').textContent = p ? `${fmt(p.steps, 0)}장` : '—';
    $('pred-factor').textContent = p ? `×${fmt(p.pressure_factor, 4)}` : '—';
    $('pred-offset').textContent = p ? `${p.offset >= 0 ? '+' : ''}${fmt(p.offset, 2)}` : '—';
    paintInterval(p, w.recipe);
  }

  function paintInterval(p, recipe) {
    const host = $('interval'); host.replaceChildren(); if (!p) return;
    const ref = modelJson.recipe_meta[recipe].mrr_ref, lo = ref - 18, hi = ref + 18, x = v => Math.max(2, Math.min(298, (v - lo) / (hi - lo) * 300));
    host.append(svg('line', { x1: 0, x2: 300, y1: 20, y2: 20, stroke: C.track, 'stroke-width': 6, 'stroke-linecap': 'round' }));
    host.append(svg('rect', { x: x(p.low), y: 12, width: Math.max(2, x(p.high) - x(p.low)), height: 16, rx: 6, fill: C.band, opacity: '0.16' }));
    host.append(svg('line', { x1: x(ref), x2: x(ref), y1: 4, y2: 36, stroke: C.axis, 'stroke-dasharray': '3 3' }));
    host.append(svg('circle', { cx: x(p.mrr), cy: 20, r: 6, fill: C.brand, stroke: '#fff', 'stroke-width': 2 }));
  }

  function renderDecide() {
    const st = session.state, body = $('decide-body'), title = $('decide-title'); body.replaceChildren();
    if (st.phase === 'ready') {
      const c = session.current(); title.textContent = '연마 시간 설정';
      const [lo, hi] = c.limits;
      const field = el('div', { class: 'field' });
      field.append(el('label', { for: 't-input' }, `본 연마 시간 (초) · 허용 ${lo.toFixed(0)}~${hi.toFixed(0)}`));
      const row = el('div', { class: 'row' });
      const range = el('input', { type: 'range', min: lo.toFixed(1), max: hi.toFixed(1), step: '0.1', value: c.recommended, 'aria-label': '본 연마 시간' });
      const num = el('input', { type: 'number', id: 't-input', min: lo.toFixed(1), max: hi.toFixed(1), step: '0.1', value: c.recommended });
      row.append(range, num); field.append(row);
      const out = el('div', { class: 'outcome' });
      const remB = el('b'), probB = el('b');
      const d1 = el('div'); d1.append(el('span', {}, '예상 제거량 (목표 대비)'), remB);
      const d2 = el('div'); d2.append(el('span', {}, '규격 ±5% 안에 들 확률'), probB);
      out.append(d1, d2);
      const update = v => {
        const t = Number(v); if (!Number.isFinite(t)) return;
        remB.textContent = pct(c.pred.mrr * t / c.meta.target_removal * 100);
        const pr = session.inSpecProbability(c.pred, t, c.meta);
        probB.textContent = pct(100 * pr, 0); probB.className = pr >= 0.7 ? 'prob-good' : pr >= 0.45 ? 'prob-mid' : 'prob-bad';
      };
      range.addEventListener('input', () => { num.value = range.value; update(range.value); });
      num.addEventListener('input', () => { range.value = num.value; update(num.value); });
      update(c.recommended);
      const note = el('p', { class: 'note' }, `R2R 권장 ${fmt(c.recommended, 1)}초 = 목표 제거량 ÷ 예측 MRR. 기준 레시피 시간은 ${fmt(c.meta.t_ref, 0)}초입니다.`);
      const actions = el('div', { class: 'actions two' });
      const recBtn = el('button', { type: 'button', class: 'btn' }, '권장값 적용');
      recBtn.addEventListener('click', () => { range.value = c.recommended; num.value = c.recommended; update(c.recommended); });
      const go = el('button', { type: 'button', class: 'btn primary' }, auto ? '자동 운전 중' : '연마 시작');
      go.disabled = auto;
      go.addEventListener('click', () => beginWafer(Math.round(Number(num.value) * 10) / 10));
      actions.append(recBtn, go);
      body.append(field, out, note, actions);
    } else if (st.phase === 'run') {
      title.textContent = '연마 진행';
      body.append(el('div', { id: 'run-info' }));
      if (run && run.sample) paintDecideRun(run.sample);
    } else if (st.phase === 'decide') {
      const rec = st.records[st.records.length - 1], planned = session.shouldMeasure(rec);
      title.textContent = '계측 결정';
      body.append(el('p', { class: 'note' }, `${rec.label} 연마 완료 · 본 연마 ${fmt(rec.tSet, 1)}초${rec.adjusted ? ' (연마 중 조정)' : ''}`));
      const out = el('div', { class: 'outcome' });
      const a = el('div'); a.append(el('span', {}, '계측 전 추정 MRR'), el('b', {}, fmt(rec.inproc.mrr, 2)));
      const b = el('div'); b.append(el('span', {}, '추정 제거량'), el('b', {}, pct(rec.inproc.mrr * rec.tSet / session.meta[rec.recipe].target_removal * 100)));
      out.append(a, b); body.append(out);
      if (planned === null) {
        body.append(el('p', { class: 'note' }, `계측하면 실제 결과를 알고 상태가 갱신됩니다${policy.delay ? ` (결과는 ${policy.delay}장 뒤 도착)` : ''}. 생략하면 결과를 모른 채 출하합니다.`));
        const actions = el('div', { class: 'actions two' });
        const m = el('button', { type: 'button', class: 'btn primary' }, '계측 의뢰'); m.addEventListener('click', () => decideMetrology(true));
        const k = el('button', { type: 'button', class: 'btn' }, '계측 생략'); k.addEventListener('click', () => decideMetrology(false));
        actions.append(m, k); body.append(actions);
      } else {
        body.append(el('p', { class: 'note' }, `계측 정책(${policyText(policy)})에 따라 이 웨이퍼는 ${planned ? '계측합니다' : '계측하지 않습니다'}.`));
        const go = el('button', { type: 'button', class: 'btn primary block' }, planned ? '계측 의뢰하고 다음 웨이퍼' : '다음 웨이퍼');
        go.addEventListener('click', () => decideMetrology(planned)); body.append(go);
      }
    } else if (st.phase === 'done') {
      title.textContent = '운전 종료';
      const b = el('button', { type: 'button', class: 'btn primary block' }, '결과 보기'); b.addEventListener('click', showDebrief); body.append(b);
    }
  }

  function paintDecideRun(s) {
    const host = $('run-info'); if (!host) return;
    const r = session.state.run;
    if (!host.firstChild) {
      host.append(el('p', { class: 'note', id: 'run-status' }));
      const bar = el('div', { class: 'progress' }); bar.append(el('i', { id: 'run-bar' })); host.append(bar);
      host.append(el('div', { id: 'run-detail' }));
    }
    $('run-status').textContent = `${PHASE[s.phase]} · ${fmt(s.elapsed, 0)}/${fmt(s.total, 0)}초 · 설정 ${fmt(s.tSet, 1)}초${r.adjusted ? ' (조정됨)' : ''}`;
    $('run-bar').style.width = `${100 * s.elapsed / s.total}%`;
    // Rebuild the detail block only when its meaning changes, so its button stays clickable.
    const key = [s.phase === 'polish' && s.mainElapsed >= 5, !!s.alarm, s.suggestion, r.adjusted, auto,
      s.alarm ? Math.round(s.projectedFinalPct * 10) : 0].join('|');
    const detail = $('run-detail');
    if (detail.dataset.key === key) return;
    detail.dataset.key = key; detail.replaceChildren();
    paintRunDetail(detail, s, r);
  }

  function paintRunDetail(host, s, r) {
    if (s.alarm) {
      const box = el('div', { class: 'alarm-box', role: 'alert' });
      box.append(el('strong', {}, `주 압력 ${(s.pressureDev * 100).toFixed(1)}% · 기준 이탈`));
      const alpha = modelJson.recipes[r.wafer.recipe].alpha;
      if (alpha > 0) {
        box.append(el('div', {}, `연마 중 보정 MRR ${fmt(s.inproc.mrr, 2)} (투입 전 ${fmt(r.pre.mrr, 2)}). 이대로 끝나면 최종 ${pct(s.projectedFinalPct)}.`));
      } else {
        box.append(el('div', {}, `${r.wafer.recipe}는 학습 자료에서 압력 변화에 대한 MRR 반응이 확인되지 않아 보정하지 않습니다 (α=0).`));
      }
      host.append(box);
      if (s.suggestion && !auto) {
        const b = el('button', { type: 'button', class: 'btn warn block' }, `종료 시간 조정: ${fmt(s.tSet, 1)} → ${fmt(s.suggestion, 1)}초`);
        b.addEventListener('click', () => { try { session.adjust(s.suggestion, run.elapsed); } catch (e) { flashError(e.message); } });
        host.append(b);
      } else if (auto && r.adjusted) host.append(el('p', { class: 'note' }, '자동 R2R이 종료 시간을 조정했습니다.'));
    } else if (s.phase === 'polish' && s.mainElapsed >= 5) {
      host.append(el('p', { class: 'note' }, `연마 중 압력 정상 (${(s.pressureDev * 100).toFixed(2)}%). 정상 운전에서는 센서가 예측을 거의 바꾸지 않습니다.`));
    }
  }

  function renderQueue() {
    const st = session.state, host = $('queue'); host.replaceChildren();
    if (!st.queue.length) { host.append(el('li', { class: 'empty' }, '대기 중인 계측 없음')); return; }
    for (const q of st.queue.slice().sort((a, b) => a.due - b.due)) {
      const li = el('li'); li.append(el('span', {}, `${q.rec.label} · ${q.rec.recipe}`), el('span', {}, `${Math.max(0, q.due - st.finished)}장 뒤`)); host.append(li);
    }
  }

  function renderLog() {
    const host = $('event-log'); host.replaceChildren();
    for (const e of session.state.log.slice(0, 80)) {
      const li = el('li', { 'data-kind': e.kind }); li.append(el('span', { class: 't' }, session.wafers[e.n - 1].label), el('span', {}, e.text)); host.append(li);
    }
  }

  function renderRunLog() {
    const host = $('runlog'); host.replaceChildren();
    for (const r of session.state.records.slice().reverse()) {
      const w = session.wafers[r.n - 1], tr = el('tr');
      const verdict = r.measured ? (r.inSpec ? ['in', '규격 안'] : ['out', '규격 밖']) : r.status === 'queued' ? ['q', '계측 대기'] : ['unk', '미확인'];
      const notes = [r.events.afterRest && '휴지 후 첫 장', r.events.afterPad && '패드 교체 후', r.alarm && '압력 경보', r.adjusted && '시간 조정'].filter(Boolean).join(' · ');
      const cells = [r.label, r.recipe, `${fmt(r.tSet, 1)}${r.adjusted ? '*' : ''}`, r.pre ? `${fmt(r.pre.mrr, 2)} [${fmt(r.pre.low, 1)}–${fmt(r.pre.high, 1)}]` : '—',
        fmt(r.inproc.mrr, 2), r.measured ? fmt(w.mrr, 2) : '—', r.measured ? pct(r.removalPct) : '?'];
      cells.forEach(c => tr.append(el('td', {}, c)));
      const v = el('td'); v.append(el('span', { class: `pill ${verdict[0]}` }, verdict[1])); tr.append(v);
      tr.append(el('td', {}, notes)); host.append(tr);
    }
  }

  function renderSpc() {
    const host = $('spc'); host.replaceChildren();
    const recipe = spcRecipe, pts = [];
    for (const h of session.history[recipe]) pts.push({ kind: 'hist', mrr: h.mrr, pred: h.pred, low: h.low, high: h.high });
    for (const r of session.state.records.filter(x => x.recipe === recipe)) {
      const w = session.wafers[r.n - 1];
      pts.push({ kind: r.measured ? 'meas' : 'hidden', mrr: r.measured ? w.mrr : null, est: r.inproc.mrr, pred: r.pre && r.pre.mrr, low: r.pre && r.pre.low, high: r.pre && r.pre.high, inSpec: r.inSpec, ev: r.events.afterRest || r.events.afterPad, label: r.label });
    }
    const st = session.state;
    if (st.phase === 'ready') { const c = session.current(); if (c.wafer.recipe === recipe && c.pred) pts.push({ kind: 'next', pred: c.pred.mrr, low: c.pred.low, high: c.pred.high, label: c.wafer.label }); }
    const view = pts.slice(-70); if (!view.length) return;
    const vals = view.flatMap(p => [p.mrr, p.low, p.high, p.est].filter(Number.isFinite));
    // Draw in real pixels so axis text is never stretched on narrow screens.
    const W = Math.max(280, Math.round(host.clientWidth || 900)), H = 230, L = 40, R = 10, T = 10, B = 22;
    host.setAttribute('viewBox', `0 0 ${W} ${H}`); host.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 2);
    const x = i => L + (i + 0.5) / view.length * (W - L - R), y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    for (let g = Math.ceil(lo / 5) * 5; g <= hi; g += 5) {
      host.append(svg('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), stroke: C.grid, 'vector-effect': 'non-scaling-stroke' }));
      const t = svg('text', { x: L - 6, y: y(g) + 4, 'text-anchor': 'end', fill: C.axis, 'font-size': 11 }); t.textContent = g; host.append(t);
    }
    const firstSession = view.findIndex(p => p.kind !== 'hist');
    if (firstSession > 0) {
      host.append(svg('line', { x1: x(firstSession) - 6, x2: x(firstSession) - 6, y1: T, y2: H - B, stroke: C.brand, 'stroke-dasharray': '4 4', opacity: '.5', 'vector-effect': 'non-scaling-stroke' }));
      const t = svg('text', { x: x(firstSession) - 2, y: T + 12, fill: C.brand, 'font-size': 11, 'font-weight': 700 }); t.textContent = '이번 운전 →'; host.append(t);
    }
    const band = view.map((p, i) => [i, p]).filter(([, p]) => Number.isFinite(p.low));
    if (band.length > 1) {
      const d = band.map(([i, p], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.high).toFixed(1)}`).join('') + band.slice().reverse().map(([i, p]) => `L${x(i).toFixed(1)} ${y(p.low).toFixed(1)}`).join('') + 'Z';
      host.append(svg('path', { d, fill: C.band, opacity: '0.10' }));
      host.append(svg('path', { d: band.map(([i, p], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.pred).toFixed(1)}`).join(''), fill: 'none', stroke: C.pred, 'stroke-dasharray': '4 3', 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' }));
    }
    view.forEach((p, i) => {
      if (p.ev) host.append(svg('line', { x1: x(i), x2: x(i), y1: H - B - 12, y2: H - B, stroke: C.event, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }));
      if (p.kind === 'hist') host.append(svg('circle', { cx: x(i), cy: y(p.mrr), r: 2.6, fill: C.hist }));
      else if (p.kind === 'meas') host.append(svg('circle', { cx: x(i), cy: y(p.mrr), r: 4, fill: p.inSpec ? C.brand : C.alarm, stroke: '#fff', 'stroke-width': 1.5 }));
      else if (p.kind === 'hidden') host.append(svg('circle', { cx: x(i), cy: y(p.est), r: 4, fill: '#fff', stroke: C.hidden, 'stroke-width': 1.5 }));
      else if (p.kind === 'next') host.append(svg('circle', { cx: x(i), cy: y(p.pred), r: 5.5, fill: C.next, stroke: '#fff', 'stroke-width': 1.5 }));
    });
  }

  function renderAll() {
    renderTop(); renderEquipment(); renderWaferAndPrediction(); renderDecide(); renderQueue(); renderLog(); renderRunLog(); renderSpc();
    // When the operator has to act, bring the [운전] menu forward.
    if (!auto && ['ready', 'decide', 'done'].includes(session.state.phase)) selectTab('run');
    if (!session.state.run) renderHudAlarm(null);
    if (!session.state.run) {
      $('process-wafer').textContent = session.state.phase === 'done' ? '운전 종료' : `${session.current().wafer.label} 투입 대기`;
      $('machine-phase').textContent = session.state.phase === 'decide' ? '언로딩 완료' : session.state.phase === 'done' ? '운전 종료' : '투입 대기';
      const c = session.state.phase === 'ready' ? session.current() : null;
      $('machine-sub').textContent = c ? `${c.wafer.label} · ${c.wafer.recipe} · 권장 ${fmt(c.recommended, 1)}초` : '';
    } else $('process-wafer').textContent = `${session.state.run.wafer.label} · ${session.state.run.wafer.recipe}`;
  }

  /* ---------- debrief ---------- */
  function showDebrief() {
    const sum = session.summary(), t = task;
    const entry = { at: new Date().toISOString(), task: t.id, label: runLabel, auto, policy: { ...policy }, ...sum };
    const all = storeGet(); if (!session.saved) { all.push(entry); storePut(all); session.saved = true; }
    $('debrief-title').textContent = `${t.code} · ${t.title} — 운전 결과`;
    $('debrief-sub').textContent = `${runLabel} · ${auto ? '자동 R2R' : '수동 운전'} · 웨이퍼 ${sum.count}장`;
    const stats = $('debrief-stats'); stats.replaceChildren();
    const tile = (label, value, cls = '') => { const d = el('div', { class: `stat ${cls}` }); d.append(el('span', {}, label), el('b', {}, value)); stats.append(d); };
    tile('규격(목표 ±5%) 수율', `${sum.inSpec}/${sum.count} · ${pct(sum.yieldPct, 0)}`, sum.passed === null ? '' : sum.passed ? 'pass' : 'fail');
    tile('계측 횟수', `${sum.measured}회`);
    tile('평균 제거량 오차', pct(sum.meanAbsErrPct, 2));
    tile('90% 구간 실제 포함률', pct(sum.coveragePct, 0));
    tile('평균 예측 구간 폭', fmt(sum.meanWidth, 2));
    tile('연마 중 시간 조정', `${sum.adjusted}회`);
    const lesson = $('debrief-lesson'); lesson.replaceChildren(el('h3', {}, sum.passed === false ? '목표 미달 — 다시 도전해 보세요' : '이번 운전에서 확인한 것'), el('p', {}, t.lesson));
    const cmp = $('debrief-compare'); cmp.replaceChildren();
    const mine = storeGet().filter(r => r.task === t.id).slice(-6);
    if (mine.length > 1) {
      cmp.append(el('h3', {}, '같은 과제의 이전 운전과 비교'));
      const wrap = el('div', { class: 'table-wrap' }), tb = el('table'), head = el('tr');
      ['운전', '모드', '수율', '계측', '평균 오차', '구간 폭', '구간 포함률'].forEach(h => head.append(el('th', {}, h)));
      const thead = el('thead'); thead.append(head); tb.append(thead); const body = el('tbody');
      for (const r of mine) { const tr = el('tr'); [r.label, r.auto ? '자동' : '수동', pct(r.yieldPct, 0), `${r.measured}회`, pct(r.meanAbsErrPct, 2), fmt(r.meanWidth, 2), pct(r.coveragePct, 0)].forEach(c => tr.append(el('td', {}, c))); body.append(tr); }
      tb.append(body); wrap.append(tb); cmp.append(wrap);
    }
    const hidden = $('hidden-rows'); hidden.replaceChildren();
    const unmeasured = session.state.records.filter(r => !r.measured);
    $('debrief-hidden').hidden = !unmeasured.length;
    for (const r of unmeasured) {
      const w = session.wafers[r.n - 1], tr = el('tr');
      [r.label, r.recipe, fmt(r.tSet, 1), fmt(r.pre && r.pre.mrr, 2), fmt(w.mrr, 2), pct(r.removalPct)].forEach(c => tr.append(el('td', {}, c)));
      const v = el('td'); v.append(el('span', { class: `pill ${r.inSpec ? 'in' : 'out'}` }, r.inSpec ? '규격 안' : '규격 밖')); tr.append(v); hidden.append(tr);
    }
    const actions = $('debrief-actions'); actions.replaceChildren();
    const close = el('button', { type: 'button', class: 'btn ghost' }, '닫기'); close.addEventListener('click', () => $('debrief').close());
    const again = el('button', { type: 'button', class: 'btn' }, '같은 과제 다시'); again.addEventListener('click', () => { $('debrief').close(); startTask(t, session.runIndex || 0); });
    const pick = el('button', { type: 'button', class: 'btn' }, '과제 선택'); pick.addEventListener('click', () => { $('debrief').close(); openTasks(); });
    actions.append(close, pick, again);
    if (t.runs && (session.runIndex || 0) + 1 < t.runs.length) {
      const nxt = el('button', { type: 'button', class: 'btn primary' }, `${t.runs[session.runIndex + 1].label}로 실행`);
      nxt.addEventListener('click', () => { $('debrief').close(); startTask(t, session.runIndex + 1); });
      actions.append(nxt);
    }
    if (!$('debrief').open) $('debrief').showModal();
  }

  /* ---------- wiring ---------- */
  function openTasks() {
    buildTaskDialog(); selectedTask = null; $('task-start').disabled = true; $('free-config').hidden = true;
    $('task-dialog').returnValue = ''; // a previous "start" must not leak into an Esc close
    $('task-dialog').showModal();
  }
  function flashError(msg) { const host = $('event-log'); const li = el('li', { 'data-kind': 'alarm' }); li.append(el('span', { class: 't' }, '오류'), el('span', {}, msg)); host.prepend(li); }

  function wire() {
    document.querySelectorAll('#speed button').forEach(b => b.addEventListener('click', () => setSpeed(Number(b.dataset.speed))));
    $('pause').addEventListener('click', () => { paused = !paused; $('pause').setAttribute('aria-pressed', String(paused)); $('pause').textContent = paused ? '재개' : '일시정지'; });
    $('skip').addEventListener('click', () => { if (session && session.state.phase === 'run' && run) { run.elapsed = run.total - 1e-6; } });
    $('auto-mode').addEventListener('change', e => { auto = e.target.checked; if (session) { session.state.auto = auto; wait = auto ? 0.3 : 0; renderDecide(); renderGuide(); } });
    $('open-tasks').addEventListener('click', openTasks);
    $('open-tasks-2').addEventListener('click', openTasks);
    for (const t of ['run', 'metrology', 'task']) $(`tab-${t}`).addEventListener('click', () => selectTab(t));
    $('policy-sample').addEventListener('change', changePolicy);
    $('policy-delay').addEventListener('change', changePolicy);
    let resizeTimer = 0; // the control chart is drawn in real pixels, so redraw it after a resize
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (session) renderSpc(); }, 150); });
    renderGuide();
    document.querySelectorAll('#spc-recipe button').forEach(b => b.addEventListener('click', () => {
      spcRecipe = b.dataset.recipe; document.querySelectorAll('#spc-recipe button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (session) renderSpc();
    }));
    $('task-dialog').addEventListener('close', () => { if ($('task-dialog').returnValue === 'start' && selectedTask) startTask(selectedTask); });
    setInterval(() => { if (session && session.state.phase === 'run') { renderTop(); renderWaferAndPrediction(); } }, 250);
    let lastCount = -1, lastQueue = -1, lastLog = -1;
    setInterval(() => {
      if (!session) return;
      const st = session.state;
      if (st.records.length !== lastCount || st.queue.length !== lastQueue || st.log.length !== lastLog) {
        lastCount = st.records.length; lastQueue = st.queue.length; lastLog = st.log.length;
        renderLog(); renderQueue(); renderRunLog(); renderSpc(); renderEquipment();
      }
    }, 300);
  }

  async function init() {
    try {
      const [m, r] = await Promise.all([
        fetch('./lab-sim/state-model-v2.json').then(x => { if (!x.ok) throw new Error('state-model-v2.json'); return x.json(); }),
        fetch('./lab-sim/data/replay.json').then(x => { if (!x.ok) throw new Error('data/replay.json'); return x.json(); }),
      ]);
      modelJson = m; replay = r;
      if (replay.model_version !== modelJson.model_version) throw new Error('재생 데이터와 모델 버전이 다릅니다.');
    } catch (err) {
      const box = $('loading'); box.classList.add('error');
      $('loading-text').textContent = `시뮬레이터 데이터를 불러오지 못했습니다 (${err.message}). 재생 데이터는 로컬에서 생성합니다: python -m tools.lab_sim.build_lab_data --wafer-table <wafer_table.csv> --traces <CMP-data/training>`;
      return;
    }
    buildGauges(); wire(); initScene();
    // Read-only hook for automated browser checks.
    window.LabSimDebug = Object.freeze({ session: () => session, auto: () => auto, wait: () => wait, paused: () => paused, run: () => run });
    $('loading').hidden = true;
    requestAnimationFrame(frame);
    openTasks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
