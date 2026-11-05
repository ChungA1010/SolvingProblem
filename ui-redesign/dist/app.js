(function () {
  'use strict';
  const engine = window.CMPDemo;
  const view = window.CMPView;
  const learning = window.CMPLearning;
  const mission = window.CMPMission;
  const $ = id => document.getElementById(id);
  const key = 'cmp-lab-ui-concept-v1';
  let input = engine.defaults(), lastInput = structuredClone(input), result = engine.calculate(input), history = [], toastTimer;
  let resultStatus = '기본 조건 미리보기 · 실행 전';
  let storageAvailable = true;
  try { history = engine.restoreHistory(localStorage.getItem(key)); } catch { storageAvailable = false; }
  let lastRun = null, comparisonBase = null, comparisonNext = null;
  let activeTask = null, taskBase = null, selectedIds = [];
  let missionState = mission.create(), missionRun = null, missionSaved = true, missionBusy = false;
  let missionStep = 'setup', missionPrepared = false;
  let tourStep = 0;
  let currentPage = 'home', sceneOwner = 'lab';
  const format = view.formatNumber;
  const counters = window.CMPCounter.attachDocument(document, format);
  const count = (id, value, digits = 2, options = {}) => counters.set($(id), value, {digits, ...options});
  const signed = (value, digits = 2) => (value > 0 ? '+' : '') + format(value, digits);
  const safe = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const extraFields = engine.educationalFields;
  const missionFields = [{key:'pressure',id:'mission-pressure',slider:'mission-slider',min:250.817,max:270.011},
    ...extraFields.map(f=>({...f,id:`mission-${f.key}`,slider:`mission-${f.key}-slider`}))];
  const modelLabel = values => engine.isEducational(values) ? '교육용 다변수 v1' : '압력 모델 v1';
  const conditionSummary = values => `Main outer ${format(values.pressure,3)}` + (engine.isEducational(values)
    ? ` · Wafer ${format(values.wafer_rotation_pct,1)}% · Stage ${format(values.stage_rotation_pct,1)}% · Slurry C ${format(values.slurry_c_pct,1)}%` : '');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tourVideo = $('tour-equipment-video'), tourMediaToggle = $('tour-media-toggle');
  let tourMediaActive = false;
  function renderTourMediaState() {
    const playing = !tourVideo.paused && !tourVideo.ended;
    tourMediaToggle.textContent = playing ? '일시정지' : tourVideo.ended ? '다시 보기' : '동작 보기';
    tourMediaToggle.setAttribute('aria-label', playing ? '개념도 동작 일시정지' : '개념도 동작 재생');
    const phase = tourVideo.currentTime < 1.25 ? 0 : tourVideo.currentTime < 2.92 ? 1 : 2;
    document.querySelectorAll('[data-motion-phase]').forEach(el => {
      if (Number(el.dataset.motionPhase) === phase) el.setAttribute('aria-current','step');
      else el.removeAttribute('aria-current');
    });
  }
  function playTourMedia() {
    if (!tourMediaActive) return;
    if (tourVideo.ended) tourVideo.currentTime = 0;
    tourVideo.play().catch(renderTourMediaState);
  }
  function syncTourMedia() {
    const active = currentPage === 'intro-tour' && tourStep === 1 && !document.hidden;
    if (active === tourMediaActive) return;
    tourMediaActive = active;
    if (active) {
      tourVideo.currentTime = 0;
      if (!motionPreference.matches) playTourMedia();
    } else tourVideo.pause();
    renderTourMediaState();
  }
  tourMediaToggle.addEventListener('click', () => {
    if (tourVideo.paused || tourVideo.ended) playTourMedia(); else tourVideo.pause();
  });
  ['play','pause','ended','timeupdate'].forEach(event => tourVideo.addEventListener(event,renderTourMediaState));
  tourVideo.addEventListener('error', () => {
    tourMediaToggle.hidden = true;
    $('tour-equipment-caption').querySelector('p').textContent = '정지 개념도입니다. 실제 연마 시연은 다음 시뮬레이터 화면에서 확인하세요.';
  });
  let lastPolishInput = null, lastPolishProfile = null, hasPresentedPolish = false;
  let scene3D = null, sceneAttempted = false, sceneFrame = null;
  function sceneUnavailable() {
    $('cmp-scene').dataset.renderer = 'unavailable';
    $('scene-fallback').hidden = false;
    $('scene-fallback').textContent = '3D 화면을 사용할 수 없어 아래 표면·단면 시연으로 표시합니다.';
    $('cmp-canvas').hidden = true; $('surface-detail').open = true;
    $('cmp-scene').querySelectorAll('button,input').forEach(item => { item.disabled = true; });
  }
  function ensureScene() {
    if (sceneAttempted) { scene3D?.resize(); return; }
    sceneAttempted = true;
    try {
      scene3D = window.CMPScene?.create({host:$('cmp-scene'),canvas:$('cmp-canvas'),
        fallback:$('scene-fallback'),detail:$('surface-detail'),onUnavailable:sceneUnavailable});
      if (!scene3D) sceneUnavailable();
      else { scene3D.setFrame(sceneFrame); scene3D.setState($('wafer-explanation').dataset.polishing || 'idle'); }
    } catch { sceneUnavailable(); }
  }
  document.querySelectorAll('[data-scene-view]').forEach(button => button.addEventListener('click', () => scene3D?.setView(button.dataset.sceneView)));
  $('scene-transparent').addEventListener('change', () => scene3D?.setTransparent($('scene-transparent').checked));
  $('scene-cutaway').addEventListener('change', () => scene3D?.setCutaway($('scene-cutaway').checked));
  $('scene-zoom-in').addEventListener('click', () => scene3D?.zoom(.85));
  $('scene-zoom-out').addEventListener('click', () => scene3D?.zoom(1.15));
  window.addEventListener('pagehide', event => { if (!event.persisted) scene3D?.dispose(); });
  const polishPlayer = window.CMPPolish.createPlayer({
    requestFrame:callback => requestAnimationFrame(callback),
    cancelFrame:handle => cancelAnimationFrame(handle),
    now:() => performance.now(),
    onFrame:frame => {
      sceneFrame = frame;
      scene3D?.setFrame(frame);
      const progress = frame ? Math.round(frame.progress * 100) : 0;
      $('wafer-rotor').setAttribute('transform', frame ? `rotate(${frame.rotation} 220 202)` : 'rotate(0 220 202)');
      $('polish-film').setAttribute('opacity', frame ? frame.filmOpacity : 0);
      $('polish-contact').setAttribute('opacity', frame ? frame.contactOpacity : 0);
      $('polish-flow').setAttribute('transform', frame ? `rotate(${-frame.rotation * .6} 220 202)` : '');
      $('pad-stage').hidden = !frame;
      if (frame) {
        $('polish-sweep').setAttribute('x', 220 - frame.sweepWidth / 2);
        $('polish-sweep').setAttribute('width', frame.sweepWidth);
        $('polish-sweep').setAttribute('transform', `translate(${frame.sweepX} 0) rotate(-24 220 202)`);
        $('pad-material').setAttribute('y', frame.padTop);
        $('pad-material').setAttribute('height', 222 - frame.padTop);
        $('pad-clip-rect').setAttribute('y', frame.padTop);
        $('pad-clip-rect').setAttribute('height', 222 - frame.padTop);
        $('pad-grooves').setAttribute('patternTransform', `translate(${frame.padTravel} 0)`);
        $('pad-surface-line').setAttribute('d', `M32 ${frame.padTop}H388`);
        $('pad-carrier').setAttribute('transform', `translate(0 ${frame.carrierBottom})`);
        $('pad-film-section').setAttribute('y', -frame.filmHeight);
        $('pad-film-section').setAttribute('height', frame.filmHeight);
        $('pad-wafer-stack').setAttribute('transform', `translate(0 ${-frame.filmHeight})`);
        $('pad-force').setAttribute('opacity', .25 + .75 * lastPolishProfile.normalized * frame.engagement);
        $('pad-contact-light').setAttribute('opacity', frame.contactOpacity);
        $('pad-contact-line').setAttribute('d', `M57 ${frame.padTop}H363`);
        $('pad-slurry-flow').setAttribute('d', `M46 ${frame.padTop}q-12 3-17 10m345-10q12 3 17 10`);
        $('pad-layer-remaining').style.width = `${100 * (1 - frame.removedFraction)}%`;
        $('pad-stage').dataset.phase = frame.phase;
        document.querySelectorAll('[data-pad-phase]').forEach(item => {
          const active = item.dataset.padPhase === (frame.phase === 'complete' ? 'release' : frame.phase);
          item.dataset.active = String(active);
          if (active) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
        });
      }
      $('polish-progress').value = progress;
      $('polish-panel').dataset.progress = progress;
    },
    onState:state => {
      scene3D?.setState(state);
      $('wafer-explanation').dataset.polishing = state;
      $('polish-status').textContent = ({
        idle:'계산 후 연마 시연을 볼 수 있습니다.',
        running:'연마 시연 중', completed:'연마 시연 완료',
        reduced:'모션 축소 설정 · 결과를 정지 화면으로 표시합니다.',
        stopped:'시연 중지 · 계산 결과는 유지됩니다.',
        changed:'조건 변경 · 다시 계산해 주세요.',
        unavailable:'이 레시피는 상태 참조만 지원하여 연마 시연이 없습니다.'
      })[state];
      $('polish-stop').hidden = state !== 'running';
      $('polish-replay').textContent = state === 'running' ? '처음부터' : '다시 보기';
      $('polish-replay').disabled = !lastPolishProfile || ['idle','changed','unavailable','reduced'].includes(state);
      if(sceneOwner==='intro'){missionBusy=state==='running';renderMissionControls();}
    }
  });
  function startPolish(runInput = lastInput, runResult = result, play = true) {
    lastPolishProfile = window.CMPPolish.profile(runInput, runResult, engine.recipes[runInput.recipe]);
    lastPolishInput = JSON.stringify(runInput);
    $('polish-panel').hidden = false; $('wafer-explanation').open = true;
    if(sceneOwner!=='intro'||missionStep==='simulator')ensureScene();
    $('polish-conditions').textContent = lastPolishProfile
      ? `${runInput.recipe} · ${conditionSummary(runInput)}${sceneOwner==='intro'?'':` · 계산 MRR ${format(runResult.mrr)} · 기준 대비 ${lastPolishProfile.ratio.toFixed(3)}×`}`
      : `${runInput.recipe} · 압력 조절 없음`;
    if (lastPolishProfile) $('pad-pressure-level').textContent = lastPolishProfile.normalized < 1/3
      ? '범위 내 낮은 압력' : lastPolishProfile.normalized < 2/3 ? '범위 내 중간 압력' : '범위 내 높은 압력';
    if (play) polishPlayer.start(lastPolishProfile, { reducedMotion:motionPreference.matches });
    else polishPlayer.reset(lastPolishProfile ? 'stopped' : 'unavailable');
    if (play && sceneOwner === 'lab' && lastPolishProfile && !hasPresentedPolish && !activeTask) {
      hasPresentedPolish = true;
      $('wafer-explanation').querySelector('summary').focus({ preventScroll:true });
      $('wafer-explanation').scrollIntoView({ block:'start', behavior:'auto' });
    }
  }
  function resetPolish() {
    lastPolishInput = null; lastPolishProfile = null;
    polishPlayer.reset(); $('polish-panel').hidden = true;
  }
  $('polish-stop').addEventListener('click', () => polishPlayer.cancel());
  $('wafer-zones').addEventListener('change', () => {
    $('wafer-zone-details').hidden = !$('wafer-zones').checked;
  });
  $('polish-replay').addEventListener('click', () => {
    const activeInput = sceneOwner === 'intro' ? mission.inputFor(missionState) : input;
    if (lastPolishProfile && lastPolishInput === JSON.stringify(activeInput))
      polishPlayer.start(lastPolishProfile, { reducedMotion:motionPreference.matches });
  });
  $('wafer-explanation').addEventListener('toggle', () => {
    if ($('wafer-explanation').open && (sceneOwner!=='intro'||missionStep==='simulator')) ensureScene();
    if (!$('wafer-explanation').open && polishPlayer.getState() === 'running') polishPlayer.cancel();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && polishPlayer.getState() === 'running') polishPlayer.cancel();
    syncTourMedia();
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) { tourVideo.pause(); tourVideo.currentTime = 0; renderTourMediaState(); }
    if (motionPreference.matches && polishPlayer.getState() === 'running')
      polishPlayer.start(lastPolishProfile, { reducedMotion:true });
  });

  function clearToast() { clearTimeout(toastTimer); $('toast').hidden = true; }
  function toast(message) {
    clearToast(); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3800);
  }
  function navigate(page) {
    const pages = ['home', 'intro-tour', 'intro', 'lab', 'history', 'guide'];
    if (!pages.includes(page)) page = 'home';
    if (page === 'intro-tour' && currentPage !== page) tourStep = 0;
    if (page !== currentPage && polishPlayer.getState() === 'running') polishPlayer.cancel();
    currentPage = page;
    $('main').dataset.page=page;
    const copy = { home: ['모드 선택','어떻게 시작할까요?','처음 만나는 CMP부터, 조건을 비교하는 실험까지. 나에게 맞는 방식으로 시작하세요.'], 'intro-tour':['입문 체험 · 시작 안내','첫 실험, 세 단계면 충분해요.','조건을 선택하고, 연마를 관찰하고, 결과를 비교해보세요.'], intro: ['입문 체험','조건을 조합하는 첫 CMP','웨이퍼를 다듬는 과정을 보고, 목표 제거율에 도전하세요.'], lab: ['학습 실험실', 'CMP 학습 실험실', '기준 조건을 설정하고, 변수 변화에 따른 계산 결과를 비교하세요.'], history: ['실험 기록', '실험 기록', '두 모드에서 실행한 조건과 결과를 확인하고, 학습 실험실에서 비교하세요.'], guide: ['학습 가이드', '실험 및 해석 가이드', '조작 가능한 변수와 계산 결과의 해석 범위를 확인하세요.'] }[page];
    pages.forEach(name => { $('page-' + name).hidden = name !== page; });
    document.querySelectorAll('.nav-item').forEach(button => { button.removeAttribute('aria-current'); if (button.dataset.page === (page==='intro-tour'?'intro':page)) button.setAttribute('aria-current', 'page'); });
    $('breadcrumb').textContent = copy[0]; $('page-title').textContent = copy[1]; $('page-subtitle').textContent = copy[2];
    document.title = `CMP Lab — ${copy[0]}`;
    if (page === 'lab' || page === 'intro') mountScene(page);
    if (page === 'intro') renderMissionStep();
    if (page === 'intro-tour') renderTour();
    syncTourMedia();
    window.scrollTo({ top: 0, behavior: 'auto' });
    $('main').scrollTo({ top: 0, behavior: 'auto' });
    counters.refresh();
    document.dispatchEvent(new CustomEvent('cmp:navigate',{detail:{page}}));
  }
  document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.page; navigate(button.dataset.page); }));
  window.addEventListener('hashchange', () => { if(location.hash!=='#main')navigate(location.hash.slice(1)); });

  // The walkthrough never edits mission inputs, consumes an attempt or creates a record.
  function renderTour(focus = false) {
    const labels = ['조건 선택','시뮬레이터','결과 확인'];
    const card = $('page-intro-tour').querySelector('.tour-card');
    card.dataset.tourStep = tourStep;
    card.style.setProperty('--tour-progress', `${tourStep * 50}%`);
    document.querySelectorAll('button[data-tour-step]').forEach(button => {
      const index = Number(button.dataset.tourStep);
      button.dataset.complete = String(index < tourStep);
      if (index === tourStep) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    });
    labels.forEach((label,index) => { $(`tour-panel-${index}`).hidden = index !== tourStep; });
    $('tour-prev').disabled = tourStep === 0;
    $('tour-position').textContent = `${tourStep+1} / 3 · ${labels[tourStep]}`;
    const resume = missionState.attempts > 0 || missionPrepared;
    $('tour-next').querySelector('span').textContent = tourStep < 2 ? `다음 · ${labels[tourStep+1]}` : resume ? '실험 이어하기' : '조건 선택 시작';
    if (focus) $(`tour-title-${tourStep}`).focus({preventScroll:true});
    syncTourMedia();
    counters.refresh();
  }
  function finishTour() {
    location.hash = 'intro'; navigate('intro');
    $('page-title').setAttribute('tabindex','-1'); $('page-title').focus({preventScroll:true});
  }
  document.querySelectorAll('button[data-tour-step]').forEach(button => button.addEventListener('click', () => {
    tourStep = Number(button.dataset.tourStep); renderTour(true);
  }));
  $('tour-prev').addEventListener('click', () => { tourStep = Math.max(0,tourStep-1); renderTour(true); });
  $('tour-next').addEventListener('click', () => {
    if (tourStep === 2) finishTour(); else { tourStep++; renderTour(true); }
  });
  $('tour-skip').addEventListener('click', finishTour);

  // A single renderer and playback timeline are shared; each mode keeps its own inputs.
  function mountScene(page) {
    if (sceneOwner !== page) {
      resetPolish(); sceneOwner = page;
      if (page === 'intro') $('intro-scene-slot').append($('wafer-explanation'));
      else $('lab-scene-slot').after($('wafer-explanation'));
      const run = page === 'intro' ? (!missionPrepared && missionStep==='simulator' ? missionRun : null) : lastRun;
      const current = page === 'intro' ? mission.inputFor(missionState) : input;
      if (run && JSON.stringify(run.input) === JSON.stringify(current)) startPolish(run.input, run.result, false);
    }
    syncWafer(page === 'intro' ? mission.inputFor(missionState) : input);
    if(page==='intro')$('cmp-scene').after($('wafer-disclaimer'));
    else $('cmp-scene').before($('wafer-disclaimer'));
    if (page === 'intro') $('wafer-explanation').open = true;
    if ($('wafer-explanation').open && (page!=='intro'||missionStep==='simulator')) ensureScene();
  }
  function syncWafer(values) {
    const r = engine.recipes[values.recipe], enabled = r.pressure !== null;
    const fraction = enabled && Number.isFinite(values.pressure) ? Math.max(0,Math.min(1,(values.pressure-r.min)/(r.max-r.min))) : 0;
    $('wafer-main').style.fill = enabled ? `hsl(216 80% ${86-fraction*17}%)` : '#e1e7f0';
    count('zone-value', enabled ? values.pressure : null, 3, {empty:enabled ? '—' : '조절 불가'});
  }
  function recordExperiment(values, calculated) {
    const row = {id:window.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(36).slice(2)}`,at:new Date().toISOString(),input:structuredClone(values),result:structuredClone(calculated)};
    history = [row,...history].slice(0,20);
    try { localStorage.setItem(key,JSON.stringify(history));storageAvailable=true; } catch { storageAvailable=false; }
    return row;
  }

  function renderMissionStep() {
    $('page-intro').dataset.step=missionStep;
    document.querySelectorAll('[data-mission-panel]').forEach(panel=>{panel.hidden=panel.dataset.missionPanel!==missionStep;});
    document.querySelectorAll('[data-mission-step]').forEach(item=>{
      if(item.dataset.missionStep===missionStep)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
    });
    if(currentPage==='intro'){
      const copy={setup:['이번에는 어떤 조건으로 할까요?','조건을 고른 뒤, 다음 화면에서 연마를 시작하세요.'],simulator:['장비에서 연마 과정을 확인하세요.','기계가 연마하는 동안 접촉·회전·슬러리 공급을 관찰하세요.'],result:['목표에 얼마나 가까워졌나요?','오차와 시도 기록을 보고 다음 조건을 결정하세요.']}[missionStep];
      $('page-title').textContent=copy[0];$('page-subtitle').textContent=copy[1];
    }
    const values=missionPrepared?mission.inputFor(missionState):missionRun?.input;
    $('mission-selected-conditions').innerHTML=values?[
      ['Main outer 압력',values.pressure,3,''],...extraFields.map(f=>[f.label,values[f.key],1,'%'])
    ].map(([label,value,digits,unit])=>`<div class="bento-tile"><span>${safe(label)}</span><strong><span data-counter="${Number.isFinite(value)?value:0}" data-counter-digits="${digits}">${format(value,digits)}</span>${unit}</strong></div>`).join(''):'';
    counters.refresh();
  }
  function showMissionStep(step) {
    if(step==='result'&&(!missionRun||missionPrepared||missionBusy))return;
    if(step==='simulator'&&!missionPrepared&&!missionRun)return;
    if(step==='setup'&&mission.status(missionState)!=='playing')return;
    missionStep=step;renderMissionStep();renderMissionControls();
    if(step==='simulator'){ $('wafer-explanation').open=true;ensureScene(); }
    window.scrollTo({top:0,behavior:'auto'});$('main').scrollTo({top:0,behavior:'auto'});
    $('page-title').setAttribute('tabindex','-1');$('page-title').focus({preventScroll:true});
  }
  function renderMissionControls() {
    const closed=mission.status(missionState)!=='playing';
    let valid=true;
    missionFields.forEach(f=>$(f.id).removeAttribute('aria-invalid'));
    try {engine.validate(mission.inputFor(missionState));$('mission-error').hidden=true;}
    catch(error){valid=false;$('mission-error').textContent=error.message;$('mission-error').hidden=false;
      missionFields.filter(f=>!Number.isFinite(missionState[f.key])||missionState[f.key]<f.min||missionState[f.key]>f.max).forEach(f=>$(f.id).setAttribute('aria-invalid','true'));}
    $('mission-run').disabled=closed||missionBusy||!valid;
    $('mission-run').textContent=closed?'도전 종료':'다음 · 시뮬레이터 →';
    missionFields.forEach(f=>{$(f.id).disabled=closed||missionBusy;$(f.slider).disabled=closed||missionBusy;});
    $('mission-start').hidden=!missionPrepared;
    $('mission-start').disabled=!missionPrepared||missionBusy||closed||!valid||missionStep!=='simulator';
    $('mission-show-result').hidden=missionPrepared;
    $('mission-show-result').disabled=!missionRun||missionPrepared||missionBusy;
    $('mission-edit').hidden=!missionPrepared;
    $('mission-edit').disabled=missionBusy;
    $('mission-continue').hidden=closed;
    $('mission-continue').textContent=`조건 조절 · 다음 시도 (${mission.config.maxAttempts-missionState.attempts}회 남음) →`;
    const playback=polishPlayer.getState();
    $('mission-simulation-status').textContent=missionPrepared?'선택한 조건을 장비에 적용할 준비가 됐습니다.':missionBusy?'자동 연마 중입니다.':playback==='stopped'?'시연을 중지했습니다.':playback==='reduced'?'모션 축소 설정으로 최종 장면을 표시합니다.':'연마 시연이 끝났습니다.';
    $('mission-simulation-note').textContent=missionPrepared?'연마 시작을 누르면 기회를 1회 사용합니다.':missionBusy?'6초 시연 · 실제 공정 시간과 다릅니다.':'결과 확인을 눌러 MRR과 오차를 확인하세요. 다시 보기는 기회를 사용하지 않습니다.';
  }
  function renderMission() {
    const recipe=engine.recipes[mission.config.recipe], last=missionState.last, current=mission.isCurrent(missionState);
    const summary=mission.summary(missionState), closed=summary.status!=='playing';
    missionFields.forEach(f=>{const value=missionState[f.key],clamped=Number.isFinite(value)?Math.max(f.min,Math.min(f.max,value)):f.min;
      $(f.slider).value=clamped;$(f.slider).style.setProperty('--progress',`${(clamped-f.min)/(f.max-f.min)*100}%`);});
    renderMissionControls();
    count('mission-remaining', summary.remaining, 0);
    $('mission-chances').setAttribute('aria-label',`${mission.config.maxAttempts}회 중 ${missionState.attempts}회 사용, ${summary.remaining}회 남음`);
    $('mission-chances').innerHTML=Array.from({length:mission.config.maxAttempts},(_,index)=>`<span data-used="${index<missionState.attempts}" data-won="${summary.status==='won'&&index===missionState.attempts-1}">${index+1}</span>`).join('');
    count('mission-value', last ? last.displayed : null);
    $('mission-outcome').textContent=summary.status==='won'?`${missionState.attempts}회 만에 성공`:summary.status==='lost'?'기회 소진':!last?'도전 준비':!current?'다음 조건 설정 중':'도전 중';
    $('mission-outcome').className='badge '+(current&&last?.achieved?'badge-green':'badge-neutral');
    $('mission-result-card').dataset.outcome=summary.status==='won'?'success':summary.status==='lost'?'lost':'idle';
    $('mission-feedback').textContent=summary.status==='lost'?`${mission.config.maxAttempts}회의 기회를 모두 사용했습니다. 가장 작은 오차는 ${format(summary.bestError)}입니다. 시도 기록을 살펴보고 다시 도전해 보세요.`:summary.status==='won'?`${missionState.attempts}회 만에 목표 오차 ${format(mission.config.tolerance)} 이내에 도달했습니다!`:!last?`${mission.config.maxAttempts}회 안에 목표를 맞춰보세요. 유효한 조건으로 실행할 때 기회가 1회 줄어듭니다.`:!current?'입력 조건이 바뀌었습니다. 이전 오차를 참고해 다음 실험을 실행하세요.':last.hint;
    $('mission-result-status').textContent=last?`${conditionSummary(last.input)} · 목표 차이 ${signed(last.delta)} · ${missionSaved?'기록 저장됨':'현재 탭의 임시 기록'}`:'';
    $('mission-factors').textContent=last?`이번 계산 배율: 압력 ${format(last.result.factors.pressure,3)} × Wafer ${format(last.result.factors.wafer_rotation_pct,3)} × Stage ${format(last.result.factors.stage_rotation_pct,3)} × Slurry C ${format(last.result.factors.slurry_c_pct,3)}. 기준 MRR 74.10에 곱한 결과입니다.`:'회전·유량은 교육용 기준 100%에서 시작합니다. 실행 후 변수별 계산 배율을 확인할 수 있습니다.';
    $('mission-next').hidden=!(current&&last?.achieved);
    count('mission-error-value', summary.error);count('mission-best-error', summary.bestError);
    $('mission-improvement').textContent=summary.improvement===null?'첫 결과를 다음 실험의 기준으로 삼아보세요.':summary.improvement===0?'이전 시도와 절대오차가 같습니다.':`이전 시도보다 오차 ${format(Math.abs(summary.improvement))} ${summary.improvement>0?'감소 ↓':'증가 ↑'}`;
    $('mission-improvement').dataset.trend=summary.improvement>0?'better':summary.improvement<0?'worse':'same';
    $('mission-trials').innerHTML=missionState.trials.length?`<table><caption class="sr-only">이번 도전의 네 입력 조건과 목표 MRR 대비 절대오차</caption><thead><tr><th scope="col">시도</th><th scope="col">압력</th><th scope="col">Wafer %</th><th scope="col">Stage %</th><th scope="col">C %</th><th scope="col">MRR</th><th scope="col">절대오차</th></tr></thead><tbody>${missionState.trials.map((trial,index)=>`<tr data-best="${index===summary.bestIndex}"><th scope="row">${index+1}</th><td>${format(trial.input.pressure,3)}</td>${extraFields.map(f=>`<td>${format(trial.input[f.key],1)}</td>`).join('')}<td>${format(trial.displayed)}</td><td>${format(Math.abs(trial.delta))}${index===summary.bestIndex?'<small>최소</small>':''}</td></tr>`).join('')}</tbody></table>`:'<p class="learning-copy">아직 시도한 기록이 없습니다.</p>';
    $('mission-retry').hidden=!closed;
    $('mission-previous').hidden=!last;
    $('mission-previous').textContent=last?`이전 시도 MRR ${format(last.displayed)} · 절대오차 ${format(Math.abs(last.delta))}. 입력값은 그대로 가져왔습니다. 한 변수씩 바꾸며 차이를 확인해 보세요.`:'';
    // A fixed, labeled zoom keeps the narrow target visible; exact results remain above.
    const range={min:mission.config.target-5,max:mission.config.target+5}, position=v=>100*(v-range.min)/(range.max-range.min);
    $('mission-target-band').style.left=`${position(mission.config.target-mission.config.tolerance)}%`;
    $('mission-target-band').style.width=`${position(mission.config.target+mission.config.tolerance)-position(mission.config.target-mission.config.tolerance)}%`;
    $('mission-marker').hidden=!last;
    if(last)$('mission-marker').style.left=`${Math.max(0,Math.min(100,position(last.result.mrr)))}%`;
    if(sceneOwner==='intro') {
      syncWafer(mission.inputFor(missionState));
      if(lastPolishInput!==null&&lastPolishInput!==JSON.stringify(mission.inputFor(missionState))){lastPolishInput=null;lastPolishProfile=null;polishPlayer.reset('changed');}
    }
  }
  function editMission() {
    if(missionBusy||mission.status(missionState)!=='playing')return;
    const values=Object.fromEntries(missionFields.map(f=>[f.key,$(f.id).value.trim()===''?NaN:Number($(f.id).value)]));
    missionState=mission.edit(missionState,values);renderMission();
  }
  missionFields.forEach(f=>{$(f.id).addEventListener('input',editMission);
    $(f.slider).addEventListener('input',()=>{$(f.id).value=$(f.slider).value;editMission();});});
  $('mission-form').addEventListener('submit',event=>{
    event.preventDefault();if(missionStep!=='setup'||missionBusy||mission.status(missionState)!=='playing')return;editMission();
    try {
      engine.validate(mission.inputFor(missionState));
      resetPolish();missionPrepared=true;showMissionStep('simulator');
    } catch {renderMission();}
  });
  $('mission-start').addEventListener('click',()=>{
    if(missionStep!=='simulator'||!missionPrepared||missionBusy||mission.status(missionState)!=='playing')return;
    try {
      missionState=mission.run(missionState);
      missionRun=recordExperiment(missionState.last.input,missionState.last.result);missionSaved=storageAvailable;
      missionPrepared=false;renderMission();renderHistory();renderMissionStep();clearToast();startPolish(missionRun.input,missionRun.result);
      $('mission-simulation-status').setAttribute('tabindex','-1');$('mission-simulation-status').focus({preventScroll:true});
      if(!storageAvailable)toast('저장 권한이 없어 이 탭에서만 기록을 유지합니다.');
    } catch {renderMission();}
  });
  $('mission-show-result').addEventListener('click',()=>showMissionStep('result'));
  function nextMissionInputs() {
    if(missionBusy||mission.status(missionState)!=='playing')return;
    missionPrepared=false;resetPolish();showMissionStep('setup');
  }
  $('mission-edit').addEventListener('click',nextMissionInputs);
  $('mission-continue').addEventListener('click',nextMissionInputs);
  $('mission-watch-again').addEventListener('click',()=>{
    if(!missionRun)return;
    missionPrepared=false;showMissionStep('simulator');startPolish(missionRun.input,missionRun.result);
  });
  function resetMission() {
    missionState=mission.create();missionRun=null;missionPrepared=false;missionFields.forEach(f=>{$(f.id).value=missionState[f.key];});
    if(sceneOwner==='intro')resetPolish();renderMission();showMissionStep('setup');toast(`새 도전을 시작합니다. 기회 ${mission.config.maxAttempts}회 · 저장된 기록은 유지됩니다.`);
  }
  $('mission-reset').addEventListener('click',resetMission);
  $('mission-retry').addEventListener('click',resetMission);
  $('mission-to-lab').addEventListener('click',()=>{
    if(!missionRun||!mission.isCurrent(missionState))return;
    exitTask();lastRun=structuredClone(missionRun);comparisonBase=structuredClone(missionRun);comparisonNext=null;
    setInputs(missionRun.input);lastInput=structuredClone(input);result=engine.calculate(input);
    renderResult('입문 체험에서 실행한 결과');drawInput();location.hash='lab';navigate('lab');
    toast('네 입력과 교육용 모델을 그대로 가져왔습니다. 조건을 바꿔 비교해 보세요.');
  });

  function readInputs() {
    input = { recipe: input.recipe, scenario: $('scenario').value, mrr: Number($('recent-mrr').value), pressure: engine.recipes[input.recipe].pressure === null ? null : Number($('pressure').value),
      ...($('educational-mode').checked ? {model:engine.educationalModel,...Object.fromEntries(extraFields.map(f=>[f.key,$(`lab-${f.key}`).value.trim()===''?NaN:Number($(`lab-${f.key}`).value)]))} : {}) };
    input = learning.constrain(input, activeTask, taskBase);
  }
  function drawInput() {
    if (sceneOwner === 'lab' && lastPolishInput !== null && lastPolishInput !== JSON.stringify(input)) {
      lastPolishInput = null; lastPolishProfile = null;
      polishPlayer.reset('changed');
      $('polish-conditions').textContent = '현재 조건으로 계산하면 새 시연을 시작합니다.';
    }
    const recipe = engine.recipes[input.recipe], control = recipe.pressure !== null;
    $('educational-mode').checked=engine.isEducational(input);
    $('educational-controls').hidden=!engine.isEducational(input);
    $('educational-note').textContent=activeTask?'과제는 기존 압력 모델을 사용합니다. 자유 실험에서 다변수 모델을 선택할 수 있습니다.':!control?'A123은 상태 참조만 지원합니다.':'회전·유량은 가상 기준 대비 50–150%입니다. 실제 단위·장비 운전 범위가 아닙니다.';
    $('pressure-control').hidden = !control; $('state-only-note').hidden = control;
    $('pressure').disabled = !control; $('pressure-slider').disabled = !control;
    document.querySelectorAll('[data-nudge]').forEach(button => { button.disabled = !control; });
    $('control-status').textContent = control ? '압력 조절 지원' : '상태 참조 전용';
    $('stage-label').textContent = recipe.stage === 'A' ? 'Stage A · 1차 공정' : 'Stage B · 2차 공정';
    const scenario = engine.scenarios[input.scenario];
    $('measurement-summary').textContent = `${scenario.age}장 경과`;
    $('legacy-scenario-note').hidden = input.scenario !== 'restart';
    document.querySelectorAll('[data-recipe]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.recipe === input.recipe)));
    if (control) {
      $('pressure-slider').min = recipe.min; $('pressure-slider').max = recipe.max;
      $('pressure-slider').value = Math.max(recipe.min, Math.min(recipe.max, input.pressure || recipe.min));
      const fraction = Math.max(0, Math.min(1, (input.pressure - recipe.min) / (recipe.max - recipe.min)));
      $('pressure-slider').style.setProperty('--progress', `${fraction * 100}%`);
      $('pressure-min').textContent = format(recipe.min, 3); $('pressure-max').textContent = format(recipe.max, 3);
      $('pressure-range-label').textContent = `일반 운전 범위 ${format(recipe.normalMin, 3)}–${format(recipe.normalMax, 3)}`;
    }
    if(sceneOwner==='lab')syncWafer(input);
    $('pressure').removeAttribute('aria-invalid'); $('recent-mrr').removeAttribute('aria-invalid');
    extraFields.forEach(f=>$(`lab-${f.key}`).removeAttribute('aria-invalid'));
    try {
      const evidence = engine.validate(input);
      $('input-error').hidden = true; $('run-button').disabled = false;
      $('control-panel').dataset.interlocked = 'false'; $('interlock-state').textContent = control ? '준비됨' : '상태 참조';
      $('run-icon').setAttribute('href', '#i-flask'); $('run-label').textContent = '계산 실행'; $('run-arrow').removeAttribute('hidden');
      $('run-button').removeAttribute('title');
      $('input-evidence').className = 'badge ' + (evidence === 'normal' ? 'badge-green' : 'badge-amber');
      $('input-evidence').textContent = evidence === 'normal' ? '● 일반 운전 범위' : '▲ 주의 관측 구간';
    } catch (error) {
      $('input-error-message').textContent = error.message; $('input-error').hidden = false; $('run-button').disabled = true;
      $('control-panel').dataset.interlocked = 'true'; $('interlock-state').textContent = '실행 잠금';
      $('run-icon').setAttribute('href', '#i-lock'); $('run-label').textContent = '입력 범위 확인 필요'; $('run-arrow').setAttribute('hidden', '');
      $('run-button').title = '입력값을 허용 범위로 수정하면 실행할 수 있습니다.';
      $('input-evidence').className = 'badge badge-amber'; $('input-evidence').textContent = '입력 범위 이탈';
      if (!Number.isFinite(input.mrr) || input.mrr <= 0) $('recent-mrr').setAttribute('aria-invalid', 'true');
      else if (control&&(!Number.isFinite(input.pressure)||input.pressure<recipe.min||input.pressure>recipe.max)) $('pressure').setAttribute('aria-invalid', 'true');
      extraFields.filter(f=>engine.isEducational(input)&&(!Number.isFinite(input[f.key])||input[f.key]<f.min||input[f.key]>f.max)).forEach(f=>$(`lab-${f.key}`).setAttribute('aria-invalid','true'));
    }
    if (JSON.stringify(input) !== JSON.stringify(lastInput)) {
      $('result-status').textContent = '이전 조건의 결과 · 다시 실행하세요';
      $('result-status').style.color = 'var(--dp-color-warning)';
    } else {
      $('result-status').textContent = resultStatus;
      $('result-status').style.color = 'var(--dp-color-ink-muted)';
    }
    applyTaskLocks(); renderLearning();
  }
  function setInputs(next) {
    input = learning.constrain(structuredClone(next), activeTask, taskBase);
    $('scenario').value = input.scenario; $('recent-mrr').value = input.mrr;
    $('measurement-settings').open = input.scenario !== 'continuous';
    $('pressure').value = input.pressure === null ? '' : format(input.pressure, 3);
    $('educational-mode').checked=engine.isEducational(input);
    extraFields.forEach(f=>$(`lab-${f.key}`).value=input[f.key]??f.default);
    drawInput();
  }
  function drawCurve() {
    const recipe = engine.recipes[result.recipe], control = recipe.pressure !== null;
    const values = Array.from({ length: 31 }, (_, index) => control ? engine.calculate({...lastInput,pressure:recipe.min + (recipe.max - recipe.min) * index / 30}).mrr : result.mrr);
    const low = Math.min(...values), high = Math.max(...values);
    const y = value => high === low ? 52 : 78 - (value - low) / (high - low) * 53;
    const points = values.map((value, index) => `${8 + index / 30 * 344},${y(value)}`);
    $('curve-line').setAttribute('d', 'M' + points.join(' L'));
    $('curve-area').setAttribute('d', 'M8,87 L' + points.join(' L') + ' L352,87 Z');
    const x = control ? 8 + (lastInput.pressure - recipe.min) / (recipe.max - recipe.min) * 344 : 180;
    $('curve-marker').setAttribute('cx', x); $('curve-marker').setAttribute('cy', y(result.mrr));
    $('curve-marker-line').setAttribute('d', `M${x},${y(result.mrr)} V87`);
    $('curve-min').textContent = control ? format(recipe.min, 3) : '상태 참조';
    $('curve-max').textContent = control ? format(recipe.max, 3) : '압력 조절 없음';
  }
  function renderResult(status) {
    resultStatus = status;
    $('result-recipe').textContent = `${result.recipe} · Stage ${result.stage} · ${modelLabel(lastInput)}`;
    count('result-mrr', result.mrr); count('baseline-value', result.baseline);
    $('result-mrr').dataset.compact = String(format(result.mrr).length > 8);
    count('result-delta', result.delta, 2, {prefix: result.delta > 0 ? '+' : ''});
    count('result-percent', result.percent, 2, {prefix: result.percent > 0 ? '+' : ''});
    count('result-time', result.time); $('result-grade').textContent = result.grade;
    $('result-time').dataset.compact = String(format(result.time, 2).length > 7);
    $('result-grade').dataset.grade = result.grade;
    $('result-evidence').textContent = view.evidenceLabel(result);
    $('detail-mrr').textContent = String(result.mrr);
    $('detail-baseline').textContent = String(result.baseline);
    $('detail-time').textContent = result.time === null ? '환산 불가' : String(result.time);
    $('result-evidence').className = 'badge text-[13px] ' + (result.evidence === 'normal' ? 'badge-green' : 'badge-amber');
    $('result-status').textContent = status; $('result-status').style.color = 'var(--dp-color-ink-muted)';
    const notes = [];
    if(engine.isEducational(lastInput))notes.push('가정 기반 계산입니다. 입력 근거 등급은 압력·측정 최신성에만 해당하며 회전·유량이나 예측 정확도를 검증하지 않습니다.');
    if (result.evidence === 'observed_shift') notes.unshift('일반 운전 범위를 벗어난 관측 구간입니다.');
    if (result.age > 5) notes.unshift('최근 실측 후 6장 이상 경과해 근거 등급을 C로 표시합니다.');
    if (result.recipe === 'A123') notes.unshift('A123은 최근 실측 MRR 참조만 제공합니다.');
    if (result.time === null) notes.unshift('현재 값은 유효한 연마시간으로 환산할 수 없습니다.');
    $('result-warning').querySelector('p').textContent = notes.join(' ');
    $('result-warning').hidden = notes.length === 0;
    $('result-explanation').textContent = learning.single(lastInput, result);
    drawCurve();
  }
  function applyTaskLocks() {
    const task = learning.tasks[activeTask], control = engine.recipes[input.recipe].pressure !== null;
    $('educational-mode').disabled=Boolean(task)||!control;
    extraFields.forEach(f=>$(`lab-${f.key}`).disabled=Boolean(task)||!engine.isEducational(input));
    document.querySelectorAll('[data-recipe]').forEach(button => { button.disabled = Boolean(task); });
    $('recent-mrr').disabled = Boolean(task);
    $('scenario').disabled = Boolean(task && (!taskBase || task.variable !== 'scenario'));
    const pressureLocked = !control || Boolean(task && (!taskBase || task.variable !== 'pressure'));
    ['pressure','pressure-slider'].forEach(id => { $(id).disabled = pressureLocked; });
    document.querySelectorAll('[data-nudge]').forEach(button => { button.disabled = pressureLocked; });
    if (task?.variable === 'scenario') $('measurement-settings').open = true;
  }
  function rowLabel(row) {
    return `${view.logIdentity(row).run} · ${row.input.recipe} · ${new Date(row.at).toLocaleString('ko-KR')}`;
  }
  function renderComparison() {
    $('comparison-clear').hidden = !comparisonBase || Boolean(activeTask);
    const comparison = learning.compare(comparisonBase, comparisonNext);
    $('comparison-content').hidden = !comparison.ok;
    if (!comparisonBase) $('comparison-status').textContent = activeTask ? '먼저 기준 조건으로 계산해 주세요. 과제에서 비교 기준을 자동 지정합니다.' : '계산 결과를 비교 기준으로 지정한 뒤 조건을 바꿔 실행하거나, 실험 기록에서 두 개를 선택하세요.';
    else if (!comparisonNext) $('comparison-status').textContent = `${rowLabel(comparisonBase)}을 비교 기준으로 지정했습니다. 조건을 바꿔 다시 계산하세요.`;
    else if (!comparison.ok) $('comparison-status').textContent = comparison.reason;
    else {
      $('comparison-status').textContent = comparison.changed.length ? `변경한 조건: ${comparison.changed.map(c=>c.label).join(', ')}. 입력을 편집해도 이 표는 선택한 계산 결과를 유지합니다.` : '두 실험의 입력 조건이 같습니다. 다른 조건으로 계산하면 차이를 비교할 수 있습니다.';
      const a = comparisonBase, b = comparisonNext;
      const rows = [
        ['pressure','Main outer 압력',format(a.input.pressure,3),format(b.input.pressure,3),a.input.pressure===null?'—':signed(b.input.pressure-a.input.pressure,3)],
        ...(engine.isEducational(a.input)?extraFields.map(f=>[f.key,`${f.label} (%)`,format(a.input[f.key],1),format(b.input[f.key],1),`${signed(b.input[f.key]-a.input[f.key],1)}%p`]):[]),
        ['mrr','기준 MRR',format(a.input.mrr),format(b.input.mrr),signed(b.input.mrr-a.input.mrr)],
        ['scenario','측정 정보',`${a.result.age}장 경과${a.input.scenario==='restart'?' · 이전 재시작':''}`,`${b.result.age}장 경과${b.input.scenario==='restart'?' · 이전 재시작':''}`,a.input.scenario===b.input.scenario?'같음':'변경'],
        ['output','계산 MRR',format(a.result.mrr),format(b.result.mrr),`${signed(comparison.mrr.value)}${comparison.mrr.percent===null?'':` (${signed(comparison.mrr.percent)}%)`}`],
        ['time','환산시간 (s)',format(a.result.time),format(b.result.time),comparison.time.value===null?'환산 불가':`${signed(comparison.time.value)}${comparison.time.percent===null?'':` (${signed(comparison.time.percent)}%)`}`],
        ['grade','입력 근거 등급',a.result.grade,b.result.grade,a.result.grade===b.result.grade?'같음':`${a.result.grade} → ${b.result.grade}`]
      ];
      $('comparison-table').innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">항목</th><th scope="col">기준 실험<small>${safe(rowLabel(a))}</small></th><th scope="col">변경 실험<small>${safe(rowLabel(b))}</small></th><th scope="col">변화</th></tr></thead><tbody>${rows.map(([field,label,left,right,change])=>`<tr data-changed="${comparison.changed.some(c=>c.key===field)}"><th scope="row">${safe(label)}</th><td>${field==='grade'?`<span class="grade" data-grade="${safe(left)}">${safe(left)}</span>`:safe(left)}</td><td>${field==='grade'?`<span class="grade" data-grade="${safe(right)}">${safe(right)}</span>`:safe(right)}</td><td>${safe(change)}</td></tr>`).join('')}</tbody></table>`;
      $('comparison-explanation').textContent = comparison.explanation;
    }
  }
  function renderLearning() {
    const task = learning.tasks[activeTask], isCurrent = lastRun && JSON.stringify(input) === JSON.stringify(lastRun.input);
    $('pin-baseline').disabled = !isCurrent || Boolean(task);
    $('pin-note').textContent = task ? '과제의 첫 계산을 비교 기준으로 자동 지정합니다.' : !lastRun ? '계산 실행 후 비교 기준을 지정할 수 있습니다.' : !isCurrent ? '입력이 바뀌었습니다. 다시 계산한 뒤 기준을 지정하세요.' : '현재 계산 결과를 고정하고 다음 실험과 비교할 수 있습니다.';
    $('task-workspace').hidden = !task; $('task-exit').hidden = !task;
    document.querySelectorAll('#task-picker [data-task-start]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.taskStart===activeTask)));
    if (task) {
      $('task-goal').textContent = task.goal; $('task-question').textContent = task.question;
      $('task-apply').disabled = !taskBase; $('task-apply').textContent = task.suggestion;
      $('task-step').textContent = taskBase ? '2. 조건을 바꿔 계산하고 아래 두 실험을 비교하세요.' : '1. 기준 조건으로 계산 실행을 눌러주세요.';
      $('task-lock-note').textContent = !taskBase ? '비교 기준을 만들기 위해 첫 계산의 조건을 고정했습니다.' : task.variable==='pressure' ? '압력만 조절할 수 있습니다. 레시피·기준 MRR·측정 정보는 기준 실험과 같습니다.' : '측정 후 경과 웨이퍼 수만 조절할 수 있습니다. 레시피·기준 MRR·압력은 고정합니다.';
      const feedback = taskBase && comparisonNext && JSON.stringify(input)===JSON.stringify(comparisonNext.input) ? learning.assessment(activeTask,taskBase,comparisonNext,$('task-prediction').value) : null;
      $('task-feedback').hidden = !feedback; $('task-feedback').textContent = feedback?.message || '';
      $('task-reflection').hidden = !feedback?.complete;
      if (feedback?.complete) $('task-step').textContent = '3. 비교 완료 · 결과 해설과 확인 질문을 살펴보세요.';
      $('task-reflection-question').textContent = task.reflection; $('task-reflection-answer').textContent = task.answer;
    }
    renderComparison();
  }
  function exitTask() {
    activeTask = null; taskBase = null; $('task-prediction').value = ''; $('task-reflection').open = false;
  }
  function startTask(id) {
    if (!learning.tasks[id]) return;
    $('learning-panel').hidden=false;
    resetPolish(); activeTask = id; taskBase = null; comparisonBase = null; comparisonNext = null; lastRun = null;
    $('task-prediction').value = ''; $('task-reflection').open = false;
    setInputs(learning.taskInput(id)); lastInput = structuredClone(input); result = engine.calculate(input);
    renderResult('과제 기준 조건 · 실행 전'); drawInput(); location.hash = 'lab'; navigate('lab');
    $('learning-heading').scrollIntoView({block:'start'});
  }
  function renderSelection() {
    count('selection-count', selectedIds.length, 0, {suffix:' / 2'});
    $('compare-selected').disabled = selectedIds.length !== 2; $('selection-clear').disabled = !selectedIds.length;
    $('selection-chips').innerHTML = selectedIds.map((id,index)=>{
      const row = history.find(r=>r.id===id);
      return `<button type="button" data-remove-selection="${safe(id)}" aria-label="${index===0?'기준':'변경'} ${safe(view.logIdentity(row).run)} 선택 해제">${index===0?'기준':'변경'} · ${safe(view.logIdentity(row).run)} · ${safe(row.input.recipe)} ×</button>`;
    }).join('');
  }
  $('task-picker').innerHTML = Object.entries(learning.tasks).map(([id,task])=>`<button type="button" data-task-start="${id}" aria-pressed="false">${safe(task.title)}</button>`).join('');
  $('guide-task-cards').innerHTML = Object.entries(learning.tasks).map(([id,task])=>`<article class="card guide-task-card"><h3 class="card-label">${safe(task.title)}</h3><p class="learning-copy">${safe(task.goal)}</p><p class="learning-copy">예상 질문: ${safe(task.question)}</p><p class="learning-copy">기준 조건을 계산하고, ${task.variable==='pressure'?'압력':'측정 정보'}만 바꿔 다시 계산합니다. 두 결과를 비교한 뒤 확인 질문을 풀어보세요.</p><button type="button" class="text-button" data-task-start="${id}">${safe(task.title)} 과제 시작 →</button></article>`).join('');
  $('task-exit').addEventListener('click',()=>{exitTask();drawInput();toast('자유 실험으로 전환했습니다. 계산 결과와 기록은 유지됩니다.');});
  $('task-prediction').addEventListener('change',renderLearning);
  $('task-apply').addEventListener('click',()=>{
    const task=learning.tasks[activeTask];if(!task||!taskBase)return;
    setInputs({...input,[task.variable]:task.suggested});$('run-button').focus();
  });
  $('pin-baseline').addEventListener('click',()=>{
    if(!lastRun||activeTask||JSON.stringify(input)!==JSON.stringify(lastRun.input))return;
    comparisonBase=structuredClone(lastRun);comparisonNext=null;renderLearning();
    toast('현재 결과를 비교 기준으로 지정했습니다. 조건을 바꿔 계산하세요.');
  });
  $('comparison-clear').addEventListener('click',()=>{comparisonBase=null;comparisonNext=null;renderLearning();});
  $('selection-clear').addEventListener('click',()=>{selectedIds=[];$('selection-message').textContent='';renderHistory();});
  $('compare-selected').addEventListener('click',()=>{
    if(selectedIds.length!==2)return;
    const rows=selectedIds.map(id=>history.find(r=>r.id===id));
    const check=learning.compare(...rows);if(!check.ok){$('selection-message').textContent=check.reason;return;}
    exitTask();comparisonBase=structuredClone(rows[0]);comparisonNext=structuredClone(rows[1]);drawInput();
    const focusComparison=()=>{$('comparison-panel').focus();$('comparison-panel').scrollIntoView({block:'center'});};
    if(location.hash!=='#lab'){window.addEventListener('hashchange',focusComparison,{once:true});location.hash='lab';}
    else{navigate('lab');focusComparison();}
  });
  function table(rows, filtered = false, selectable = false) {
    if (!rows.length && filtered) return '<div class="px-6 py-10 text-center"><p class="text-sm font-semibold">검색과 일치하는 기록이 없습니다.</p><p class="mt-2 text-[12px] text-muted">레시피, Stage 또는 날짜를 바꿔 검색해 보세요.</p></div>';
    if (!rows.length) return '<div class="px-6 py-8 text-center"><p class="text-sm font-medium">아직 실험 기록이 없습니다.</p><p class="mt-2 text-[13px] text-muted">조건을 설정하고 계산하면 이곳에 저장됩니다.</p><button class="text-button mt-3" data-show-tasks>과제로 시작하기</button></div>';
    return `<table class="history-table"><caption class="sr-only">이 브라우저에 저장된 실험 기록. 시각은 브라우저 현지 시간입니다. MRR과 Main outer 압력은 데이터 기준값입니다.</caption><thead><tr>${selectable?'<th scope="col">비교</th>':''}<th scope="col">실행 시각</th><th scope="col">실험 / 레시피</th><th scope="col" class="log-number">Main outer 압력</th><th scope="col" class="log-number">MRR</th><th scope="col">근거 등급</th><th scope="col"><span class="sr-only">조건 불러오기</span></th></tr></thead><tbody>${rows.map(row => {
      const identity = view.logIdentity(row), at = new Date(row.at);
      return `<tr data-selected="${selectable&&selectedIds.includes(row.id)}">${selectable?`<td><input type="checkbox" class="compare-check" data-compare-id="${safe(row.id)}" ${selectedIds.includes(row.id)?'checked':''} aria-label="${safe(identity.run)} ${safe(identity.recipe)} 비교 선택"></td>`:''}<td><p class="log-id">${safe(at.toLocaleTimeString('en-GB', { hour12: false }))}</p><p class="log-detail">${safe(at.toLocaleDateString('sv-SE'))}</p></td><td><p class="log-id" title="${safe(row.id)}">${safe(identity.run)}</p><p class="log-detail">${safe(identity.recipe)} · ${safe(identity.stage)}</p><p class="log-detail">${modelLabel(row.input)}</p></td><td class="log-number">${format(row.input.pressure, 3)}${engine.isEducational(row.input)?`<p class="log-detail">Wafer ${format(row.input.wafer_rotation_pct,1)}%<br>Stage ${format(row.input.stage_rotation_pct,1)}%<br>Slurry C ${format(row.input.slurry_c_pct,1)}%</p>`:""}</td><td class="log-number">${format(row.result.mrr)}</td><td><span class="grade" data-grade="${safe(row.result.grade)}" title="${safe(view.evidenceLabel(row.result))}" aria-label="입력 근거 ${safe(row.result.grade)} 등급">${safe(row.result.grade)}</span></td><td><button data-restore="${safe(row.id)}" class="log-action" aria-label="${safe(identity.run)} ${safe(identity.recipe)} 조건 불러오기">조건 불러오기<svg class="icon size-3" aria-hidden="true"><use href="#i-arrow"/></svg></button></td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function renderHistory() {
    document.dispatchEvent(new CustomEvent('cmp:history'));
    const remaining = selectedIds.filter(id=>history.some(row=>row.id===id));
    if(remaining.length!==selectedIds.length) $('selection-message').textContent='최근 20건 범위를 벗어난 기록은 비교 선택에서 해제했습니다.';
    selectedIds = remaining;
    count('nav-count', history.length, 0);
    count('recent-count', Math.min(3, history.length), 0, {suffix:'건'});
    const query = $('log-search').value.trim(), filtered = view.filterRows(history, query);
    count('history-count', filtered.length, 0, {suffix:query ? ` / ${history.length}건` : '건'});
    $('recent-table').innerHTML = table(history.slice(0, 3));
    $('history-table').innerHTML = table(filtered, Boolean(query), true);
    renderSelection();
    $('history-filter-note').hidden = !query;
    $('history-filter-note').textContent = `“${query}” · ${history.length}건 중 ${filtered.length}건`;
  }
  document.addEventListener('click', event => {
    const task = event.target.closest('[data-task-start]');
    if(task){startTask(task.dataset.taskStart);return;}
    const remove = event.target.closest('[data-remove-selection]');
    if(remove){selectedIds=selectedIds.filter(id=>id!==remove.dataset.removeSelection);$('selection-message').textContent='';renderHistory();return;}
    if (event.target.closest('[data-show-tasks]')) { location.hash = 'guide'; navigate('guide'); $('guide-tasks').focus(); $('guide-tasks').scrollIntoView({ block: 'start' }); return; }
    const button = event.target.closest('[data-restore]');
    if (!button) return;
    const row = history.find(item => item.id === button.dataset.restore);
    if (row) { exitTask(); setInputs(row.input); location.hash = 'lab'; navigate('lab'); toast('저장된 조건을 자유 실험으로 불러왔습니다. 실행하면 새 기록을 만듭니다.'); }
  });
  document.addEventListener('change',event=>{
    const checkbox=event.target.closest('[data-compare-id]');if(!checkbox)return;
    const selected=learning.select(selectedIds,checkbox.dataset.compareId,history);selectedIds=selected.ids;
    $('selection-message').textContent=selected.message;
    checkbox.checked=selectedIds.includes(checkbox.dataset.compareId);
    checkbox.closest('tr').dataset.selected=String(checkbox.checked);renderSelection();
  });
  $('log-search').addEventListener('input', renderHistory);
  $('log-search-form').addEventListener('submit', event => { event.preventDefault(); location.hash = 'history'; navigate('history'); renderHistory(); });
  document.querySelectorAll('[data-nudge]').forEach(button => button.addEventListener('click', () => {
    const value = $('pressure').value === '' ? NaN : Number($('pressure').value);
    $('pressure').value = view.nudgePressure(value, Number(button.dataset.nudge), engine.recipes[input.recipe]).toFixed(3);
    readInputs(); drawInput();
  }));
  document.querySelectorAll('[data-recipe]').forEach(button => button.addEventListener('click', () => setInputs(engine.defaults(button.dataset.recipe))));
  ['scenario', 'recent-mrr', 'pressure'].forEach(id => $(id).addEventListener('input', () => { readInputs(); drawInput(); }));
  extraFields.forEach(f=>$(`lab-${f.key}`).addEventListener('input',()=>{readInputs();drawInput();}));
  $('educational-mode').addEventListener('change',()=>{readInputs();drawInput();});
  $('pressure-slider').addEventListener('input', () => { $('pressure').value = $('pressure-slider').value; readInputs(); drawInput(); });
  $('reset-button').addEventListener('click', () => { exitTask();lastRun=null;comparisonBase=null;comparisonNext=null;resetPolish(); setInputs(engine.defaults()); lastInput = structuredClone(input); result = engine.calculate(input); renderResult('기본 조건 미리보기 · 실행 전');drawInput(); toast('기본 조건으로 초기화했습니다. 저장 기록은 유지됩니다.'); });
  $('experiment-form').addEventListener('submit', event => {
    event.preventDefault(); readInputs();
    try {
      result = engine.calculate(input); lastInput = structuredClone(input);
      const row = recordExperiment(input,result);
      lastRun=structuredClone(row);
      if(activeTask&&!taskBase){taskBase=structuredClone(row);comparisonBase=structuredClone(row);comparisonNext=null;}
      else if(comparisonBase)comparisonNext=structuredClone(row);
      renderResult(storageAvailable ? '계산 완료 · 브라우저에 저장됨' : '계산 완료 · 임시 기록만 유지');
      drawInput(); renderHistory();
      clearToast(); startPolish();
      if (!storageAvailable) toast('저장 권한이 없어 이 탭에서만 기록을 유지합니다.');
    } catch (error) { drawInput(); $('input-error').hidden = false; $('input-error-message').textContent = error.message; }
  });
  // Read-only history snapshots and explicit replay: neither path appends a record.
  window.CMPWorkbench = Object.freeze({
    records:()=>structuredClone(history),
    replay(id,play=true){
      const row=history.find(item=>item.id===id);if(!row)return false;
      exitTask();setInputs(row.input);lastInput=structuredClone(row.input);result=engine.calculate(row.input);
      lastRun=structuredClone(row);hasPresentedPolish=true;
      renderResult('저장된 실험 재생 · 새 기록을 만들지 않습니다.');drawInput();
      startPolish(lastInput,result,play);return true;
    },
    stop:()=>polishPlayer.cancel(),
    openTasks:()=>{ $('learning-panel').hidden=false; $('learning-panel').scrollIntoView({block:'start'}); }
  });
  setInputs(input); renderResult('기본 조건 미리보기 · 실행 전'); renderMission(); renderHistory(); navigate(location.hash.slice(1));
})();
