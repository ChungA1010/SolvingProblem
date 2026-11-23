/* Short, hands-on steps for the education workshop. The order owns billing and removal. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPPolishMicrogames = api;
})(globalThis, function () {
  'use strict';

  const controls = {
    slurry: {
      name: '슬러리 C 밸브', instruction: '밸브를 밀어 실제 유량을 빗금 구간에 머물게 하세요. 밸브를 움직여도 유량은 한 박자 늦게 따라와요.',
      gesture: '밸브를 좌우로 드래그 · ← → 미세 조절', duration: 12
    },
    condition: {
      name: '컨디셔너 스윕', instruction: '색이 남은 고리를 누르고 있으면 회전하는 자국이 헤드 밑을 지나요. 짙은 자국은 두세 번 지나가야 결이 살아나요.',
      gesture: '패드를 누른 채 드래그 · Space로 접촉 전환, ← → 이동', duration: 18
    },
    rotation: {
      name: '회전 템포 다이얼', instruction: '다이얼을 돌려 두 램프가 깜박이는 간격을 맞추세요. 같은 빠르기로 두 바퀴를 돌면 돼요.',
      gesture: '다이얼을 돌려서 조절 · ← 느리게 / → 빠르게', duration: 15
    }
  };
  const ringCount = 5, sectorCount = 8, tick = 1 / 90;
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const periodFor = amount => 2.95 - 2.25 * amount;
  const flowPercent = amount => 20 + 160 * amount;
  const ringRadius = position => 21 + 55 * position;
  const padX = 141, padY = 100;
  const knobX = 285, knobY = 114;
  const tau = 2 * Math.PI;

  function conditioningZones(seed) {
    // Rotate the same workload through five radii and eight angular positions.
    return [0, 2, 5].map((start, i) => {
      const passes = i + 1;
      return {
        ring: (seed + 2 * i) % ringCount,
        start: (3 * seed + start) % sectorCount,
        passes, remaining: Array(i === 1 ? 3 : 2).fill(passes)
      };
    }).sort((a, b) => a.ring - b.ring);
  }

  function createRound(kind, waferNumber = 1, assisted = false, input = {}) {
    if (!Object.hasOwn(controls, kind)) throw new RangeError('Unknown workshop activity');
    const waferIndex = Number.isSafeInteger(waferNumber) && waferNumber > 0 ? waferNumber - 1 : 0;
    const sample = waferIndex % 5;
    const requested = kind === 'rotation' ? input?.stage_rotation_pct : input?.slurry_c_pct;
    const recipePct = Number.isFinite(requested) ? clamp(requested, 50, 150) : 88 + sample * 6;
    const target = kind === 'rotation' ? 1.30 * 100 / recipePct : (recipePct - 20) / 160;
    const initial = kind === 'condition' ? 0.5 : kind === 'slurry' ? 0.02 : target > 2 ? 0.78 : 0.12;
    const round = {
      kind, assisted, elapsed: 0, remainder: 0, phase: 'active', interacted: false, contact: false,
      control: initial, actual: initial, recipePct, target,
      stable: 0, revolutions: 0, referenceTurns: 0,
      timeLimit: assisted ? Infinity : controls[kind].duration
    };
    if (kind === 'condition') {
      round.zones = conditioningZones(waferIndex % (ringCount * sectorCount));
      round.lastContactWindow = Array(ringCount).fill(-1);
    }
    return round;
  }
  function setControl(r, value) {
    if (r.phase !== 'active' || !Number.isFinite(value)) return;
    r.control = clamp(value);
    r.interacted = true;
  }
  function tolerance(r) {
    return r.kind === 'rotation' ? (r.assisted ? 0.15 : 0.085) : (r.assisted ? 0.065 : 0.035);
  }
  function sweep(r, dt) {
    r.revolutions += dt / 1.15;
    if (!r.contact || !r.interacted) return;
    const ring = Math.round(r.control * (ringCount - 1));
    const windowIndex = Math.floor(r.revolutions * sectorCount);
    if (r.lastContactWindow[ring] === windowIndex) return;
    r.lastContactWindow[ring] = windowIndex;
    const zone = r.zones.find(z => z.ring === ring);
    if (!zone) return;
    // The rotating pad carries decreasing material angles past the stationary shoe.
    const sector = sectorCount - 1 - windowIndex % sectorCount;
    const offset = (sector - zone.start + sectorCount) % sectorCount;
    if (offset >= zone.remaining.length || zone.remaining[offset] === 0) return;
    zone.remaining[offset]--;
    if (r.zones.every(z => z.remaining.every(depth => depth === 0))) r.phase = 'success';
  }
  function advanceRound(r, seconds) {
    if (r.phase !== 'active' || !Number.isFinite(seconds) || seconds <= 0) return r;
    r.remainder += Math.min(20, seconds);
    while (r.remainder + 1e-9 >= tick && r.phase === 'active') {
      r.remainder -= tick;
      r.elapsed += tick;
      if (r.kind === 'condition') sweep(r, tick);
      else {
        const response = r.kind === 'slurry' ? 1.35 : 2.8;
        r.actual += (r.control - r.actual) * (1 - Math.exp(-response * tick));
        const value = r.kind === 'slurry' ? r.actual : periodFor(r.actual);
        const command = r.kind === 'slurry' ? r.control : periodFor(r.control);
        const aligned = r.interacted && Math.abs(value - r.target) <= tolerance(r) &&
          Math.abs(command - r.target) <= tolerance(r);
        if (r.kind === 'rotation') {
          r.revolutions += tick / value;
          r.referenceTurns += tick / r.target;
        }
        const unit = r.kind === 'slurry' ? tick : tick / value;
        r.stable = aligned ? r.stable + unit : 0;
        if (r.stable >= (r.kind === 'slurry' ? 1.15 : 2)) r.phase = 'success';
      }
      if (r.phase === 'active' && r.elapsed + 1e-8 >= r.timeLimit) r.phase = 'timeout';
    }
    return r;
  }

  // Instruments share the workshop's cream enamel, dark ink and brushed metal palette.
  const edge = '#45594d', metal = '#9cae99', ivory = '#f6f0d9', dark = '#526c60', accent = '#e8ac65';
  function circle(x, y, radius, fill, stroke = edge, width = 2, extra = '') {
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  }
  function rect(x, y, w, h, radius, fill, stroke = edge, extra = '') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
  }
  function path(d, color, width, extra = '') {
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  }
  function label(x, y, text, anchor = 'middle') {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="pm-engraved">${text}</text>`;
  }
  function panel() {
    return rect(1, 1, 398, 198, 9, '#d4dcc8', 'none') +
      [[11,11],[389,11],[11,189],[389,189]].map(([x,y]) =>
        circle(x,y,3.1,'#b6c2ac','#849480',0.9) + path(`M${x-1.6} ${y+1.2}l3.2 -2.4`,'#7f8e7c',1)).join('');
  }
  function slurryScene() {
    return panel() + rect(24,25,122,140,12,'#b7c6b0') +
      path('M48 131V77Q48 65 62 65H100Q116 65 116 82V96',edge,15) +
      path('M48 131V77Q48 65 62 65H100Q116 65 116 82V96','#dee4ce',9) +
      rect(104,89,24,11,3,metal) + rect(107,99,18,7,2,dark) +
      path('M116 110V139','#588e88',3,'id="pm-stream"') +
      path('M88 141l6 13h42l6-13z',edge,3) + path('M94 142h42','#699b91',4) +
      label(84,48,'LINE C') + rect(161,25,214,99,9,ivory) +
      label(183,49,'실제 유량','start') + rect(183,64,170,33,4,'#61796b') +
      '<rect id="pm-band" y="66" height="29" fill="url(#pm-stripes)" stroke="#e0e9b7"/>' +
      path('M0 61v38',accent,4,'id="pm-flow"') +
      path('M0 60l-4 -5h8z',edge,1,'id="pm-flow-tip"') +
      label(183,113,'20%','start') + label(353,113,'180%','end') +
      label(160,151,'밸브 개도','start') + path('M164 168H354',edge,9) +
      path('M164 167H354','#839481',3) +
      '<g id="pm-valve">'+rect(-10,155,20,24,5,accent)+path('M-3 161v10m6-10v10','#936b42',1.7)+'</g>';
  }
  function sectorArc(radius, s) {
    const a = (s + 0.06) * tau / sectorCount, b = (s + 0.94) * tau / sectorCount;
    const x = angle => (padX + radius * Math.cos(angle)).toFixed(2);
    const y = angle => (padY + radius * Math.sin(angle)).toFixed(2);
    return `M${x(a)} ${y(a)}A${radius} ${radius} 0 0 1 ${x(b)} ${y(b)}`;
  }
  function conditionScene() {
    let rings = '';
    for (let i = 0; i < ringCount; i++) {
      const radius = ringRadius(i / (ringCount-1));
      rings += circle(padX,padY,radius,'none','#859a82',10) +
        circle(padX,padY,radius-2,'none','#aabd9c',1) + circle(padX,padY,radius+2,'none','#718971',1);
      for (let j = 0; j < sectorCount; j++) rings += path(sectorArc(radius,j),'none',9,`data-sector="${i}-${j}"`);
    }
    return panel() + circle(padX,padY,90,metal) + circle(padX,padY,84,'#95a68f') +
      '<g id="pm-platen">'+rings+circle(padX,padY,7,'#d9deca')+
      path('M218 100h7',ivory,3)+'</g>' +
      rect(290,43,67,67,13,'#b1bfaa') + circle(325,75,20,dark) +
      path('M325 75L190 98',edge,18,'id="pm-arm-edge"') +
      path('M325 75L190 98','#dbdfcd',13,'id="pm-arm"') + circle(325,75,7,metal) +
      '<g id="pm-shoe">'+circle(0,0,12,accent)+circle(0,0,7,'#c58f56')+
      path('M-3 -2L3 2','#745e41',2)+circle(0,0,16,'none','#ffedc1',2,'id="pm-contact-ring" visibility="hidden"')+'</g>' + label(322,137,'패드 컨디셔너') +
      label(322,157,'중심  ↔  외곽');
  }
  function rotationScene() {
    const rimTicks = [];
    for (let i=0;i<=10;i++) {
      const angle=(-135+27*i)*Math.PI/180, x=Math.sin(angle), y=-Math.cos(angle);
      rimTicks.push(path(`M${knobX+55*x} ${knobY+55*y}l${(i%5===0?8:4)*x} ${(i%5===0?8:4)*y}`,dark,2));
    }
    return panel()+rect(24,32,146,136,12,ivory)+
      label(48,65,'기준','start')+label(48,112,'내 회전','start')+
      circle(127,62,15,edge)+circle(127,62,11,'#8fa48b',edge,1,'id="pm-reference-lamp"')+
      circle(127,109,15,edge)+circle(127,109,11,'#a78b69',edge,1,'id="pm-actual-lamp"')+
      path('M44 85h103','#bac2aa',1)+label(97,151,'한 바퀴에 한 번')+
      label(knobX,33,'회전 속도') +rimTicks.join('')+
      circle(knobX,knobY,50,metal)+circle(knobX,knobY,43,'#627d6c')+
      circle(knobX,knobY,32,'#708b77','#869c87',1)+
      '<g id="pm-knob">' + path('M285 77v14',ivory,5) + '</g>' +
      label(224,175,'−')+label(350,175,'+');
  }
  const scenes = {slurry:slurryScene, condition:conditionScene, rotation:rotationScene};
  const defs = '<defs><pattern id="pm-stripes" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(30)"><rect width="7" height="7" fill="#b3c898"/><path d="M0 0V7" stroke="#819d75" stroke-width="3"/></pattern></defs>';
  const wearDefs = `<defs>
    <pattern id="pm-wear-two" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(32)">
      <rect width="7" height="7" fill="#d89255"/><path d="M1 0v7" stroke="#795238" stroke-width="1.5"/>
    </pattern>
    <pattern id="pm-wear-three" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(32)">
      <rect width="6" height="6" fill="#a8583d"/><path d="M0 1h6M1 0v6" stroke="#f3ca95" stroke-width="1.1"/>
    </pattern>
  </defs>`;
  const wearPaint = ['#476f59', '#f2c47b', 'url(#pm-wear-two)', 'url(#pm-wear-three)'];
  const ringNames = ['중심부','안쪽','중간','바깥쪽','가장자리'];
  const markup = `<div class="pm-head"><p id="pm-wafer"></p><button id="pm-close" type="button" aria-label="작업대로 돌아가기">×</button>
    <h2 id="pm-title"></h2></div><p id="pm-instructions"></p>
    <svg id="pm-stage" viewBox="0 0 400 200" tabindex="0" role="group" aria-describedby="pm-gesture pm-instructions"></svg>
    <p id="pm-gesture"></p><ul id="pm-condition-zones" aria-label="구간별 컨디셔닝 횟수" hidden></ul>
    <div class="pm-readings"><b id="pm-readout"></b><span id="pm-time"></span></div>
    <div class="pm-progress"><i></i></div>
    <div class="pm-feedback"><p id="pm-state" role="status"></p><button id="pm-assist" type="button">천천히 해보기</button></div>
    <div class="pm-buttons"><button id="pm-start" type="button">조작 시작</button><button id="pm-continue" type="button">연마 시작</button></div>`;

  let dialog, stage, elements, parts, round, phase, options, pointer = null, frame = 0, last = null, paused = false;
  function hint(text) {
    if (elements.state.textContent !== text) elements.state.textContent = text;
  }
  function translate(node,x,y=0) { node.setAttribute('transform',`translate(${x} ${y})`); }
  function rotate(node,angle,x,y) { node.setAttribute('transform',`rotate(${angle} ${x} ${y})`); }
  function renderCondition(r) {
    const x=padX+ringRadius(r.control), y=padY-(r.contact?0:6);
    const armPath=`M325 75L${x} ${y}`;
    parts.arm.setAttribute('d',armPath);
    parts['arm-edge'].setAttribute('d',armPath);
    translate(parts.shoe,x,y);
    parts['contact-ring'].setAttribute('visibility',r.contact?'visible':'hidden');
    rotate(parts.platen,(r.revolutions%1)*360,padX,padY);
    const selected=Math.round(r.control*(ringCount-1));
    let repaired=0, workDone=0, workTotal=0;
    for (const [i,zone] of r.zones.entries()) {
      for (const [j,left] of zone.remaining.entries()) {
        const segment=parts.rings[zone.ring][(zone.start+j)%sectorCount];
        if(segment.dataset.remaining!==String(left)){
          segment.dataset.remaining=String(left);
          segment.setAttribute('stroke',wearPaint[left]);
        }
        workDone+=zone.passes-left;
        workTotal+=zone.passes;
      }
      const completed=zone.passes-Math.max(...zone.remaining);
      if(completed===zone.passes)repaired++;
      const row=parts.zoneRows[i];
      row.toggleAttribute('data-selected',selected===zone.ring);
      if(row.dataset.completed!==String(completed)){
        row.dataset.completed=String(completed);
        row.toggleAttribute('data-restored',completed===zone.passes);
        row.lastElementChild.textContent=`${completed}/${zone.passes}회`;
      }
    }
    const readout=`복구 ${repaired}/${r.zones.length}곳 · 헤드 위치 ${ringNames[selected]}`;
    if(elements.readout.textContent!==readout)elements.readout.textContent=readout;
    return workDone/workTotal;
  }
  function render() {
    const r = round;
    let progress;
    if (r.kind === 'slurry') {
      const x = 183 + 170*r.actual, low = r.target-tolerance(r), high = r.target+tolerance(r);
      parts.band.setAttribute('x', 183+170*low);
      parts.band.setAttribute('width',170*(high-low));
      translate(parts.flow,x); translate(parts['flow-tip'],x);
      translate(parts.valve,164+190*r.control);
      parts.stream.setAttribute('stroke-width',1.1 + 4*r.actual);
      elements.readout.textContent = `유량 ${Math.round(flowPercent(r.actual))}% · 설정 ${r.recipePct}%`;
      progress = clamp(r.stable / 1.15);
    } else if (r.kind === 'condition') {
      progress=renderCondition(r);
    } else {
      const actualPeriod=periodFor(r.actual);
      rotate(parts.knob,-135+270*r.control,knobX,knobY);
      parts['reference-lamp'].setAttribute('fill',r.referenceTurns%1<0.22?'#c5eb9b':'#81977c');
      parts['actual-lamp'].setAttribute('fill',r.revolutions%1<0.22?'#ffcf7a':'#a38767');
      elements.readout.textContent=`기준 ${r.target.toFixed(2)}초/회 · 내 회전 ${actualPeriod.toFixed(2)}초/회`;
      progress=clamp(r.stable/2);
    }
    elements.progress.style.width=(phase==='success' ? 100 : progress*100)+'%';
    elements.time.textContent=r.assisted?'시간 제한 없음':`남은 시간 ${Math.ceil(Math.max(0,r.timeLimit-r.elapsed-1e-8))}초`;
  }
  function release() {
    const id=pointer;
    pointer=null;
    if(round)round.contact=false;
    if(id!==null && stage.hasPointerCapture(id))stage.releasePointerCapture(id);
  }
  function stop() {
    cancelAnimationFrame(frame); frame=0; last=null;
  }
  function updatePhase(value) {
    phase=value;dialog.dataset.phase=value;
    dialog.dataset.assisted=String(round.assisted);
    const active=value==='active', won=value==='success';
    if(!active){ stop();release(); }
    elements.start.hidden=active;
    elements.start.textContent=value==='ready'?'조작 시작':'다시 도전';
    elements.assist.hidden=won || round.assisted;
    elements.continue.disabled=typeof options.onContinue==='function' && !won;
    stage.setAttribute('aria-disabled',String(!active));
    stage.tabIndex=active?0:-1;
    if(won){
      hint({slurry:'유량이 안정됐어요.',condition:'세 구간 모두 패드 결이 살아났어요.',rotation:'두 바퀴의 회전 간격이 맞았어요.'}[round.kind]);
    }else if(value==='timeout')hint('시간이 다 됐어요. 다시 도전할 수 있어요.');
    else if(active)hint({slurry:'밸브를 움직이고 실제 유량이 따라올 때까지 기다리세요.',condition:'한 구간이 초록색으로 돌아오면 다음 고리로 옮겨요.',rotation:'오른쪽으로 돌리면 한 바퀴 걸리는 시간이 짧아져요.'}[round.kind]);
    else hint('준비되면 시작하세요.');
    render();
    // Keep the surface focused on success. Releasing a held key must not activate a paid button.
    if(value==='timeout')elements.start.focus({preventScroll:true});
  }
  function schedule() {
    if(!frame && phase==='active' && !paused && !document.hidden && dialog.open)frame=requestAnimationFrame(animate);
  }
  function animate(now) {
    frame=0;
    if(!dialog.open || paused || document.hidden || phase!=='active')return;
    const turns=Math.floor(round.revolutions), ref=Math.floor(round.referenceTurns);
    if(last!==null)advanceRound(round,(now-last)/1000);
    last=now;
    if(round.kind==='rotation'){
      if(Math.floor(round.referenceTurns)!==ref)window.CMPFeedback?.play('tempo-reference');
      if(Math.floor(round.revolutions)!==turns)window.CMPFeedback?.play('tempo-sensor');
    }
    if(round.phase!=='active')updatePhase(round.phase);
    else{ render();schedule(); }
  }
  function start(easy) {
    release();stop();
    window.CMPFeedback?.unlock();
    round=createRound(options.kind, options.waferNumber,easy, options.input);
    paused=document.hidden;
    updatePhase('active');stage.focus({preventScroll:true});schedule();
  }
  function finish(continueOrder) {
    if(!dialog?.open || (continueOrder && options.onContinue && phase!=='success'))return;
    const current=options;
    options=null;phase='closed';release();stop();dialog.close();
    if(continueOrder && current.onContinue)current.onContinue();
    else if(current.opener?.isConnected && !current.opener.disabled)current.opener.focus({preventScroll:true});
  }
  function position(event) {
    const matrix=stage.getScreenCTM();
    if(!matrix)return null;
    return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  }
  function aim(point) {
    if(round.kind==='condition'){
      const radius=Math.hypot(point.x-padX,point.y-padY);
      const halfRing=(ringRadius(1)-ringRadius(0))/(2*(ringCount-1));
      round.contact=radius>=ringRadius(0)-halfRing && radius<=ringRadius(1)+halfRing;
      setControl(round,(radius-ringRadius(0))/(ringRadius(1)-ringRadius(0)));
    }else if(round.kind==='slurry'){
      setControl(round,(point.x-164)/190);
    }else{
      const dx=point.x-knobX, dy=point.y-knobY;
      if(Math.hypot(dx,dy)<10)return;
      let angle=Math.atan2(dx,-dy)*180/Math.PI;
      // Keep pointer drags through the dial's bottom stop on their original side.
      if(Math.abs(angle)>135)angle=round.control>0.5?135:-135;
      setControl(round,(angle+135)/270);
    }
    render();
  }
  function bindControls() {
    stage.addEventListener('pointerdown',event=>{
      if(phase!=='active' || paused || pointer!==null || !event.isPrimary || event.button!==0)return;
      const pt=position(event);
      if(!pt)return;
      if(round.kind==='rotation' && Math.hypot(pt.x-knobX,pt.y-knobY)>73)return;
      if(round.kind==='slurry' && (pt.y<138 || pt.x<141 || pt.x>378))return;
      if(round.kind==='condition' && Math.hypot(pt.x-padX,pt.y-padY)>95)return;
      event.preventDefault();stage.focus({preventScroll:true});
      pointer=event.pointerId;stage.setPointerCapture(pointer);
      round.contact=round.kind==='condition';aim(pt);
    });
    stage.addEventListener('pointermove',event=>{
      if(pointer!==event.pointerId || phase!=='active')return;
      const pt=position(event);if(pt)aim(pt);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture']){
      stage.addEventListener(type,event=>{if(pointer===event.pointerId)release();});
    }
    stage.addEventListener('keydown',event=>{
      if(phase!=='active' || paused)return;
      if(round.kind==='condition' && [' ','Enter'].includes(event.key)){
        event.preventDefault();
        if(!event.repeat){
          round.contact=!round.contact;round.interacted=true;
          hint(round.contact?'헤드 접촉 중 · 방향키로 안팎을 쓸어 주세요.':'헤드를 들었어요. Space로 다시 접촉하세요.');
        }
      }else if(['ArrowLeft','ArrowDown','ArrowUp','ArrowRight','Home','End'].includes(event.key)){
        event.preventDefault();
        const step=round.kind==='condition'?0.25:0.025;
        const delta=event.key==='ArrowLeft'||event.key==='ArrowDown'?-step:step;
        setControl(round,event.key==='Home'?0:event.key==='End'?1:round.control+delta);
      }
      render();
    });
    stage.addEventListener('blur',release);
  }
  function suspend() {
    if(!dialog?.open || phase!=='active')return;
    paused=true;release();stop();
  }
  function wake() {
    if(!dialog?.open || !paused || document.hidden || !document.hasFocus())return;
    paused=false;schedule();
  }
  function mount() {
    dialog=document.createElement('dialog');dialog.id='polish-micro-dialog';
    dialog.setAttribute('aria-labelledby','pm-title');dialog.innerHTML=markup;document.body.append(dialog);
    elements={};
    for(const id of ['title','wafer','instructions','readout','state','time','gesture','assist','start','continue','close','condition-zones']){
      elements[id]=dialog.querySelector('#pm-'+id);
    }
    elements.progress=dialog.querySelector('.pm-progress i'); stage=dialog.querySelector('#pm-stage');
    bindControls();
    elements.close.addEventListener('click',()=>finish(false));
    elements.continue.addEventListener('click',()=>finish(true));
    elements.start.addEventListener('click',()=>start(false));
    elements.assist.addEventListener('click',()=>start(true));
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
    window.addEventListener('blur',suspend);window.addEventListener('focus',wake);
    document.addEventListener('visibilitychange',()=>document.hidden?suspend():wake());
    window.addEventListener('pagehide',()=>finish(false));
  }
  let practicePad=0;
  function open(config={}) {
    if(!Object.hasOwn(controls,config.kind))return;
    if(!dialog)mount(); if(dialog.open)return;
    options={...config,opener:config.opener || document.activeElement};
    if(options.kind==='condition' && !options.onContinue && !Number.isSafeInteger(options.waferNumber)){
      options.waferNumber=++practicePad;
    }
    const {kind,waferNumber,onContinue}=options;
    round=createRound(kind,waferNumber,false,options.input);
    dialog.dataset.kind=kind;
    elements.wafer.textContent=onContinue && Number.isSafeInteger(waferNumber) ? waferNumber+'번 웨이퍼' : '작업대 연습';
    elements.title.textContent=controls[kind].name;
    stage.setAttribute('aria-label',controls[kind].name+' 조작판');
    elements.instructions.textContent=controls[kind].instruction;elements.gesture.textContent=controls[kind].gesture;
    elements.continue.textContent=onContinue?(config.continueLabel || '연마 시작'):(config.practiceLabel || '작업대로');
    stage.innerHTML=defs+(kind==='condition'?wearDefs:'')+scenes[kind]();
    const zonesList=elements['condition-zones'];
    zonesList.hidden=kind!=='condition';
    parts={};
    stage.querySelectorAll('[id^="pm-"]').forEach(node=>{ parts[node.id.slice(3)]=node; });
    if(kind==='condition'){
      parts.rings=Array.from({length:ringCount},(_,index)=>Array.from(stage.querySelectorAll(`[data-sector^="${index}-"]`)));
      zonesList.innerHTML=round.zones.map(zone=>
        `<li data-condition-zone data-ring="${zone.ring}" data-passes="${zone.passes}"><span>${ringNames[zone.ring]}</span><b></b></li>`).join('');
      parts.zoneRows=Array.from(zonesList.children);
    }
    dialog.showModal();updatePhase('ready');elements.start.focus({preventScroll:true});
  }
  return Object.freeze({open,close:()=>finish(false),createRound,setControl,advanceRound,periodFor});
});
