(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPPolishControl = api;
})(globalThis, function () {
  'use strict';

  const required = 4;
  const duration = 12;
  const tolerance = 0.13;
  const tick = 1 / 120;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  function targetAt(elapsed, pattern) {
    return 0.5 + 0.19 * Math.sin(elapsed * 0.79 + pattern) +
      0.075 * Math.sin(elapsed * 1.28 + pattern * 0.6);
  }

  function createRound(pattern = 0, assisted = false) {
    return { pattern, assisted, required: assisted ? 1.5 : required, tolerance: assisted ? 0.18 : tolerance,
      elapsed: 0, stable: 0, pressure: 0.3, speed: 0,
      target: assisted ? 0.52 : targetAt(0, pattern), remainder: 0, phase: 'active' };
  }

  // Advance in fixed simulation ticks so a 30 Hz screen gets the same controls as a 120 Hz screen.
  function advanceRound(previous, seconds, held) {
    if (previous.phase !== 'active' || !Number.isFinite(seconds) || seconds <= 0) return previous;
    const r = { ...previous };
    const budget = r.remainder + Math.min(seconds, duration);
    const ticks = Math.floor((budget + 1e-10) / tick);
    r.remainder = Math.max(0, budget - ticks * tick);
    for (let i = 0; i < ticks; i++) {
      r.speed += ((held ? 0.59 : -0.54) - r.speed) * (1 - Math.exp(-6.8 * tick));
      r.pressure = clamp(r.pressure + r.speed * tick, 0, 1);
      if (r.pressure === 0 || r.pressure === 1) r.speed = 0;
      r.elapsed += tick;
      if (!r.assisted) r.target = targetAt(r.elapsed, r.pattern);
      if (Math.abs(r.pressure - r.target) <= r.tolerance) r.stable += tick;
      if (r.stable + 1e-8 >= r.required) {
        r.stable = r.required;
        r.phase = 'success';
      } else if (!r.assisted && r.elapsed + 1e-8 >= duration) {
        r.elapsed = duration;
        r.phase = 'timeout';
      }
      if (r.phase !== 'active') break;
    }
    return r;
  }

  const markup = `
    <header class="pc-heading"><h2 id="pc-title">접촉압 맞추기</h2>
      <button type="button" id="polish-control-close" aria-label="작업대로 돌아가기" title="닫기">×</button>
      <p id="pc-instructions">연마 헤드를 누르면 압력이 올라가고, 떼면 내려가요. 초록색 목표 띠 안에서 합계 4초를 채우세요.</p>
    </header>
    <div class="pc-console">
      <button type="button" class="pc-machine" id="polish-control-machine" aria-label="연마 헤드 눌러 압력 올리기" aria-describedby="pc-instructions" aria-keyshortcuts="Space Enter" disabled>
        <canvas id="pc-mechanism" width="720" height="440" aria-hidden="true"></canvas>
        <span class="pc-machine-tag">연마 헤드 · 단면 모식도</span>
      </button>
      <div class="pc-instrument" role="img" aria-label="접촉압 연습 눈금. 가로 바늘이 현재 압력, 빗금 띠가 목표 범위입니다.">
        <div class="pc-scale">
          <i class="pc-target" aria-hidden="true"></i>
          <i class="pc-pressure" aria-hidden="true"></i>
        </div>
        <div class="pc-legend"><span>목표 띠</span><span>현재 압력</span></div>
      </div>
    </div>
    <div class="pc-readout">
      <label for="polish-control-progress">안정 접촉 <b id="pc-stable">0.0 / 4초</b></label>
      <span id="pc-time">남은 시간 12초</span>
      <progress id="polish-control-progress" max="4" value="0"></progress>
    </div>
    <div class="pc-status-row">
      <p id="pc-status" role="status"></p>
      <button id="polish-control-assist" type="button">천천히 맞추기</button>
    </div>
    <div class="pc-keys">
      <button type="button" id="polish-control-action" aria-describedby="pc-instructions">조절 시작</button>
      <button type="button" id="polish-control-continue">연마 시작</button>
    </div>
    <p class="pc-note">게임용 압력 눈금입니다. 제거량과 가공비는 주문에 설정한 조건으로 계산해요.</p>`;

  // Original sectional illustration of the carrier, wafer film and grooved polishing pad.
  function drawMachine(canvas, pressure, angle, inBand) {
    const g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(2, 0, 0, 2, 0, 0);
    const ink = '#49534a';
    g.clearRect(0, 0, 360, 220);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    function shape(fill, points, stroke = ink) {
      g.beginPath();
      points.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
      g.closePath(); g.fillStyle = fill; g.fill();
      if (stroke) { g.strokeStyle=stroke; g.lineWidth=1.8; g.stroke(); }
    }
    function pathLine(color, width, points) {
      g.strokeStyle=color; g.lineWidth=width; g.beginPath();
      points.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); g.stroke();
    }
    function ellipse(x,y,rx,ry,fill,stroke) {
      g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      if(fill){g.fillStyle=fill;g.fill();}
      if(stroke){g.strokeStyle=stroke;g.lineWidth=1.5;g.stroke();}
    }
    const shadow=g.createLinearGradient(0,120,0,220);
    shadow.addColorStop(0,'#d8ddca'); shadow.addColorStop(1,'#b5c1ac');
    g.fillStyle=shadow; g.fillRect(0,0,360,220);
    for(let x=6;x<360;x+=15)for(let y=8;y<220;y+=15){g.fillStyle='#879b871f';g.fillRect(x,y,1.3,1.3);}
    ellipse(182,176,132,12,'#65766336');
    shape('#91a494',[[39,150],[72,133],[284,133],[318,151],[318,172],[42,172]]);
    shape('#ecedd9',[[39,149],[70,134],[287,134],[318,149],[288,160],[69,160]]);
    shape('#536a64',[[90,135],[274,135],[274,148],[244,154],[117,153],[90,149]]);
    ellipse(182,139,103,13,'#758d82',ink);
    g.fillStyle='#465d56';g.fillRect(79,135,206,5);
    ellipse(182,135,103,12,'#9ba794',ink);
    [32,54,76,95].forEach(rx=>ellipse(182,135,rx,rx*.103,null,'#788d80'));
    for(let i=0;i<3;i++){
      const a=angle+i*2*Math.PI/3;
      pathLine('#d3d4b6',2,[[182+Math.cos(a)*76,135+Math.sin(a)*7.8],[182+Math.cos(a)*96,135+Math.sin(a)*10]]);
    }
    shape('#879988',[[62,121],[62,47],[83,36],[96,43],[96,128],[81,134]]);
    shape('#c0c9ae',[[63,47],[81,52],[81,133],[62,126]]);
    shape('#ece9d2',[[55,35],[85,22],[201,22],[216,32],[185,45],[64,45]]);
    shape('#a1ad96',[[64,45],[185,45],[185,53],[64,53]]);
    shape('#708b80',[[185,45],[216,32],[216,40],[185,53]]);
    const shift = pressure * 3;
    g.fillStyle='#779184';g.strokeStyle=ink;g.lineWidth=2;
    g.fillRect(168,47,27,41);g.strokeRect(168,47,27,41);
    for(let i=0;i<4;i++)pathLine('#c4ceba',2,[[169,55+i*6],[193,52+i*6]]);
    g.save();g.translate(0,shift);
    shape('#879c8e',[[159,68],[203,68],[203,79],[213,86],[151,86],[159,77]]);
    shape('#798b7d',[[125,91],[238,91],[247,101],[247,115],[240,123],[122,123],[115,115],[115,101]]);
    ellipse(181,94,65,13,'#e4e2ca',ink);
    ellipse(181,91,29,6,'#c3ccaf','#738774');
    shape('#e6e3cd',[[116,104],[127,110],[165,115],[201,115],[236,110],[246,104],[246,115],[234,121],[202,125],[163,125],[128,121],[116,115]]);
    pathLine('#688d8b',3,[[117,115],[129,121],[162,125],[202,125],[234,121],[245,116]]);
    pathLine('#acc5d0',3,[[123,122],[147,127],[178,129],[211,128],[239,122]]);
    g.restore();
    const clr=inBand?'#386b5c':'#866442';
    const end=82+pressure*12;
    pathLine(clr,2.6,[[272,65],[272,end],[267,end-5]]);
    pathLine(clr,2.6,[[272,end],[277,end-5]]);
  }

  let dialog, action, machine, resumeButton, assistButton, instructions, status, bar, targetBand, meter, stable, timeLeft, canvas;
  let opener = null, onContinue = null, round, phase, frame = 0, last = null, attempt = 0;
  let held = null, swallowClick = false, paused = false;
  let motion;

  function paint() {
    const inBand = Math.abs(round.pressure - round.target) <= round.tolerance;
    dialog.dataset.inside = String(inBand);
    bar.style.bottom = round.pressure * 100 + '%';
    targetBand.style.bottom = (round.target - round.tolerance) * 100 + '%';
    targetBand.style.height = round.tolerance * 200 + '%';
    meter.value = round.stable;
    const level = Math.floor(round.stable * 10 + 1e-6) / 10;
    stable.textContent = level.toFixed(1) + ' / ' + round.required + '초';
    timeLeft.textContent = round.assisted ? '시간 제한 없음' : '남은 시간 ' + Math.ceil(Math.max(0,duration - round.elapsed - 1e-8)) + '초';
    drawMachine(canvas,round.pressure,motion.matches?0:round.elapsed*2.6,inBand);
  }
  function schedule() {
    if (!frame && !paused && !document.hidden && dialog.open && phase === 'active')
      frame = requestAnimationFrame(animate);
  }
  function animate(now) {
    frame = 0;
    if (!dialog.open || paused || document.hidden || phase !== 'active') return;
    if (last !== null) round = advanceRound(round, (now-last)/1000, held !== null);
    last = now;
    paint();
    if (round.phase === 'active') schedule();
    else setPhase(round.phase);
  }
  function stopFrames() {
    cancelAnimationFrame(frame); frame=0; last=null;
  }
  function releaseAll() {
    if (!held) return;
    const {control, pointerId} = held;
    held = null;
    if (pointerId !== undefined && control.hasPointerCapture(pointerId)) control.releasePointerCapture(pointerId);
    action.classList.remove('pc-pressed');
    machine.classList.remove('pc-pressed');
  }
  function bindPressureInput(control) {
    function begin(input) {
      control.focus({preventScroll:true});
      held = {control, ...input};
      action.classList.add('pc-pressed');
      machine.classList.add('pc-pressed');
    }
    control.addEventListener('pointerdown',event=>{
      if (event.button !== 0) return;
      if (control === action) swallowClick = phase === 'active';
      if (phase !== 'active') return;
      event.preventDefault();
      if (!event.isPrimary || held) return;
      begin({pointerId:event.pointerId});
      control.setPointerCapture(event.pointerId);
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) {
      control.addEventListener(type,event=>{
        if (held?.control === control && held.pointerId === event.pointerId) releaseAll();
      });
    }
    control.addEventListener('keydown',event=>{
      if (![' ','Enter'].includes(event.key)) return;
      if (event.repeat) {event.preventDefault();return;}
      if (control === action) swallowClick = phase === 'active';
      if (phase !== 'active') return;
      event.preventDefault();
      if (!held) begin({key:event.key});
    });
    control.addEventListener('keyup',event=>{
      if (held?.control === control && held.key === event.key) {
        event.preventDefault(); releaseAll();
      } else if (control === action && swallowClick && [' ','Enter'].includes(event.key)) event.preventDefault();
    });
    control.addEventListener('blur',()=>{if (held?.control === control) releaseAll();});
  }
  function setPhase(value) {
    phase=value; dialog.dataset.phase=value;
    const active=phase==='active';
    const assisted=round.assisted;
    dialog.dataset.assisted=String(assisted);
    assistButton.hidden=assisted || phase==='success';
    resumeButton.disabled=Boolean(onContinue) && phase!=='success';
    meter.max=round.required;
    const story=onContinue && phase==='ready'?'이번 장은 중고 연마 헤드의 접촉압을 직접 잡아 주세요. ':'';
    instructions.textContent=story+(assisted?'헤드를 눌렀다 떼면서 고정된 초록 띠 안에 합계 1.5초를 채우세요.':
      '연마 헤드를 누르면 압력이 올라가고, 떼면 내려가요. 초록 띠 안에서 합계 4초를 채우세요.');
    if(!active) {stopFrames();releaseAll();}
    const focusedMachine = document.activeElement === machine;
    machine.disabled = !active;
    if (!active && focusedMachine) action.focus({preventScroll:true});
    action.textContent=active?'꾹 눌러 압력 올리기':phase==='ready'?'조절 시작':'다시 조절';
    if(active)action.setAttribute('aria-keyshortcuts','Space Enter');
    else action.removeAttribute('aria-keyshortcuts');
    status.textContent=phase==='success'?'접촉압이 잡혔어요!':phase==='timeout'?'시간이 다 됐어요. 바늘이 목표 띠에 가까워지면 짧게 눌렀다 떼 보세요.':
      active?'마우스·터치 또는 스페이스 키로 조절하세요.':'시작을 누르면 목표 띠가 움직여요.';
    if(active)schedule();
  }
  function start(assisted=false) {
    stopFrames(); releaseAll();
    round=createRound((attempt++ % 6) * 1.43,assisted);
    last=null; paused=document.hidden || !document.hasFocus();
    paint(); setPhase('active');
  }
  function suspend() {
    if(!dialog?.open || phase!=='active')return;
    paused=true;stopFrames();releaseAll();
  }
  function wake() {
    if(!dialog?.open || !paused || document.hidden || !document.hasFocus())return;
    paused=false;last=null;schedule();
  }

  function finish(continueOrder) {
    if (!dialog?.open) return;
    if (continueOrder && onContinue && phase!=='success') return;
    stopFrames(); releaseAll();
    const callback=onContinue, source=opener;
    onContinue=null;opener=null;
    dialog.close();
    if (continueOrder && callback) callback();
    else if (source?.isConnected && !source.disabled) source.focus({preventScroll:true});
  }
  function mount() {
    dialog=document.createElement('dialog');
    dialog.id='polish-control-dialog';
    dialog.setAttribute('aria-labelledby','pc-title');
    dialog.innerHTML=markup;
    document.body.append(dialog);
    const find=selector=>dialog.querySelector(selector);
    motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    action=find('#polish-control-action');machine=find('#polish-control-machine');resumeButton=find('#polish-control-continue');
    assistButton=find('#polish-control-assist');instructions=find('#pc-instructions');
    status=find('#pc-status');bar=find('.pc-pressure');targetBand=find('.pc-target');
    meter=find('#polish-control-progress');stable=find('#pc-stable');timeLeft=find('#pc-time');canvas=find('canvas');
    bindPressureInput(action);
    bindPressureInput(machine);
    action.addEventListener('click',()=>{
      if(swallowClick){swallowClick=false;return;}
      if(phase!=='active')start();
    });
    assistButton.addEventListener('click',()=>{
      if (assistButton.hidden) return;
      start(true); action.focus({preventScroll:true});
    });
    resumeButton.addEventListener('click',()=>finish(true));
    find('#polish-control-close').addEventListener('click',()=>finish(false));
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
    window.addEventListener('blur',suspend);
    window.addEventListener('focus',wake);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else wake();});
  }

  function open(options={}) {
    if(!dialog)mount();
    if(dialog.open)return;
    opener=options.opener || document.activeElement;
    onContinue=typeof options.onContinue==='function'?options.onContinue:null;
    dialog.dataset.live=String(Boolean(onContinue));
    resumeButton.textContent=onContinue?(options.continueLabel || '연마 시작'):(options.practiceLabel || '작업대로');
    dialog.querySelector('#polish-control-close').setAttribute('aria-label', options.practiceLabel || '작업대로 돌아가기');
    const wafer=Number.isSafeInteger(options.waferNumber) && options.waferNumber>0 ? options.waferNumber : 0;
    dialog.querySelector('#pc-title').textContent=onContinue && wafer ? wafer+'번 웨이퍼 · 접촉압 맞추기' : '접촉압 맞추기';
    attempt=wafer ? (wafer-1)%6 : 0;
    round=createRound(attempt*1.43);swallowClick=false;paused=false;
    dialog.showModal();setPhase('ready');paint();action.focus({preventScroll:true});
  }

  return Object.freeze({open,close:()=>finish(false),createRound,advanceRound});
});
