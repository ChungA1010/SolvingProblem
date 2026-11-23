(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPHeadLanding = api;
})(globalThis, function () {
  'use strict';

  function createRound(waferNumber = 1, slow = false) {
    const index = Number.isSafeInteger(waferNumber) && waferNumber > 0 ? (waferNumber - 1) % 6 : 0;
    return {slow, wait:0.85 + [0.2,0.04,0.35,0,0.27,0.12][index],
      sweep:slow ? 5 : 2.5, center:[0.65,0.61,0.74,0.68,0.71,0.63][index],
      band:slow ? 0.14 : 0.085, precise:slow ? 0.045 : 0.026,
      elapsed:0, fraction:0, direction:1, phase:'waiting', result:''};
  }
  function advance(round, seconds) {
    if (!['waiting','sweeping'].includes(round.phase) || !Number.isFinite(seconds) || seconds<=0) return round;
    const elapsed = round.elapsed + seconds;
    const cycle = (Math.max(0, elapsed - round.wait) / round.sweep) % 2;
    const direction = cycle < 1 ? 1 : -1;
    const fraction = direction === 1 ? cycle : 2 - cycle;
    return {...round,elapsed,fraction,direction,phase:elapsed>=round.wait?'sweeping':'waiting'};
  }
  function zone(r) {
    if(r.fraction<r.center-r.band)return r.direction===1?'early':'late';
    if(r.fraction>r.center+r.band)return r.direction===1?'late':'early';
    return Math.abs(r.fraction-r.center)<=r.precise?'precise':'good';
  }
  function trigger(r) {
    if(!['waiting','sweeping'].includes(r.phase))return r;
    const result=r.phase==='waiting'?'before':zone(r);
    const success=result==='precise'||result==='good';
    return {...r,phase:success?'success':'failed',result};
  }

  function nearestBandEdge(r) {
    return r.fraction < r.center ? r.center - r.band : r.center + r.band;
  }

  // The stopped round already holds the timestamp and angle used by the judge.
  function pressReading(r) {
    if (!r.result) return null;
    const afterSignal=r.elapsed-r.wait;
    const seconds = value => Math.abs(value).toFixed(2)+'초';
    if (r.result==='before') return '신호 '+seconds(afterSignal)+' 전 · 출발 전 입력';
    const timing='신호 후 '+seconds(afterSignal);
    if (r.result==='early'||r.result==='late') {
      const gap=seconds((nearestBandEdge(r)-r.fraction)*r.sweep);
      return timing+(r.result==='early'?' · 목표 띠까지 '+gap:' · 목표 띠를 '+gap+' 지났어요');
    }
    return timing+(r.result==='precise'?' · 빗금 안에서 감속':' · 목표 띠 안에서 감속');
  }

  const angle = t => -116+232*t;
  // Head travel in SVG units. At the bottom of a sweep it still clears the pad.
  const headTop = -20, headStroke = 46, headSeated = 32;
  const pointerY = 110;
  const headOffset = fraction => headTop + headStroke*fraction;
  const cx=108, cy=113;
  function point(t,r) {
    const rad=angle(t)*Math.PI/180;
    return [(cx+Math.sin(rad)*r).toFixed(2),(cy-Math.cos(rad)*r).toFixed(2)].join(' ');
  }
  function arc(a,b,r) {
    return 'M '+point(a,r)+' A '+r+' '+r+' 0 '+(angle(b)-angle(a)>180?'1':'0')+' 1 '+point(b,r);
  }
  const ticks=Array.from({length:25},(_,i)=>
    '<path d="M '+point(i/24,i%3===0?54:60)+' L '+point(i/24,65)+'" stroke-width="'+(i%3===0?'2':'1')+'"/>').join('');
  const escapeLabel='작업대로 돌아가기';
  const markup=`
    <header><h2 id="hl-title">헤드 안착</h2><button type="button" class="cmp-fx-toggle">효과음</button><button type="button" id="hl-close" aria-label="작업대로 돌아가기">×</button></header>
    <p id="hl-rule">바늘과 헤드가 함께 왕복해요. 초록 띠에 들어오면 계기나 장비를 한 번 눌러요. 가운데 빗금은 정밀 안착 구간이에요.</p>
    <button type="button" id="hl-trigger" aria-label="연마 헤드 감속" aria-describedby="hl-rule" disabled>
      <svg viewBox="0 0 410 218" role="img" aria-label="왼쪽 감속 계기와 오른쪽 연마 헤드 단면">
        <defs>
          <linearGradient id="hl-enamel" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#d9ddc7"/><stop offset="1" stop-color="#aabca9"/></linearGradient>
          <pattern id="hl-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V4" stroke="#f8ecc3" stroke-width="2"/></pattern>
          <clipPath id="hl-spindle-guide"><rect x="276" y="62" width="106" height="109"/></clipPath>
        </defs>
        <rect x="2" y="2" width="406" height="214" rx="9" fill="url(#hl-enamel)" stroke="#5a6b5b" stroke-width="2"/>
        <g fill="#d9dbc5" stroke="#718372"><circle cx="12" cy="12" r="3"/><circle cx="398" cy="12" r="3"/><circle cx="12" cy="206" r="3"/><circle cx="398" cy="206" r="3"/></g>
        <circle cx="108" cy="113" r="87" fill="#64786d" stroke="#455a4d" stroke-width="2"/>
        <circle cx="108" cy="111" r="83" fill="#eee9d2" stroke="#aec2ac" stroke-width="3"/>
        <path d="${arc(0,1,71)}" stroke="#c8c6af" stroke-width="10" fill="none"/>
        <g fill="none" stroke-width="12"><path id="hl-band" stroke="#608c72"/><path id="hl-core" stroke="#3c6955"/><path id="hl-stripe" stroke="url(#hl-hatch)"/></g>
        <path id="hl-boundaries" fill="none" stroke="#344b3f" stroke-width="1.7"/>
        <path id="hl-gap" fill="none" stroke="#75442e" stroke-width="2" stroke-dasharray="2 3" hidden/>
        <g fill="none" stroke="#5b6b5c">${ticks}</g>
        <text x="108" y="82" text-anchor="middle" class="hl-small">감속 타이밍</text>
        <g id="hl-needle"><path d="M106 122 107 52 109 43 111 122Z" fill="#ab6236" stroke="#68472f" stroke-width="1.3"/></g>
        <g id="hl-press-mark" hidden>
          <path d="M102 26h12l-6 12Z" fill="#713c2c" stroke="#faf3db" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M108 38v7" stroke="#713c2c" stroke-width="2"/>
        </g>
        <circle cx="108" cy="113" r="6.6" fill="#576c5d" stroke="#354c3e" stroke-width="1.5"/>
        <path id="hl-direction" d="M95 147h26m-5-4 5 4-5 4" fill="none" stroke="#526959" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden/>
        <g id="hl-record-key" hidden aria-hidden="true"><path d="M78 169h8l-4 7Z" fill="#713c2c"/><text x="91" y="176" class="hl-small">내 입력</text></g>
        <path d="M214 35V181" stroke="#94a48c" stroke-width="1"/>
        <g stroke="#4e6454" stroke-width="1.5" stroke-linejoin="round">
          <path d="M244 153V54l18-11 9 7v105l-14 6z" fill="#899e8a"/>
          <path d="m238 44 20-10h76l13 8-16 10h-87z" fill="#ede9d1"/>
          <path d="M244 52h87l16-10v8l-16 10h-87z" fill="#91a58e"/>
          <path d="M244 169l15-9h105l16 9v12H244z" fill="#a6b7a2"/>
          <ellipse cx="315" cy="169" rx="55" ry="8" fill="#c9cdb5"/>
          <path d="M265 159h99v6c-7 9-89 10-99 0z" fill="#788c7c"/>
          <ellipse cx="314.5" cy="158" rx="50" ry="7" fill="#a3b8a3"/>
          <ellipse cx="314.5" cy="157" rx="37" ry="3.4" fill="none" stroke="#879f87" stroke-width="1"/>
          <path d="M369 ${pointerY+headTop}v${headStroke}" stroke="#829481" stroke-width="3"/>
          <path id="hl-height-band" stroke="#50795d" stroke-width="8"/>
          <g clip-path="url(#hl-spindle-guide)"><g id="hl-carrier">
            <path d="M306 24h17v68h-17z" fill="#a4b5a3"/>
            <path d="m307 68 15-3m-15 9 15-3m-15 9 15-3" fill="none" stroke="#728978"/>
            <path d="M304 88h21v8l12 7h-44l11-7z" fill="#98ad9a"/>
            <path d="M280 105h69v13c-4 8-62 10-69 0z" fill="#b4c1a7"/>
            <ellipse cx="314.5" cy="105" rx="34.5" ry="7" fill="#e0e1c5"/>
            <path d="M281 116q31 11 67 0" fill="none" stroke="#76938a" stroke-width="3"/>
            <path d="M285 121q29 7 59 0" fill="none" stroke="#466c7e" stroke-width="2"/>
            <path d="M349 ${pointerY}h10" stroke="#586b59"/>
            <path d="M359 ${pointerY-3.5}l7 3.5-7 3.5z" fill="#985a37" stroke="#68472f" stroke-width="1"/>
          </g></g>
          <path d="M300 46h29v18l-5 4h-19l-5-4z" fill="#cfdbc0"/>
        </g>
        <path id="hl-seat-line" d="M286 155.5q28 6 57 0" fill="none" stroke="#325f52" stroke-width="2.4" stroke-linecap="round"/>
        <g class="hl-small"><circle id="hl-lamp" cx="256" cy="194" r="4.5" fill="#98a78d" stroke="#657560"/><text x="268" y="198">헤드 접근 신호</text></g>
      </svg>
    </button>
    <div class="hl-read"><div class="hl-message" role="status" aria-live="polite" aria-atomic="true">
      <strong id="hl-cue" tabindex="-1" aria-describedby="hl-record-detail"></strong>
      <span id="hl-record-detail" hidden></span></div><button type="button" id="hl-slow">천천히 맞추기</button></div>
    <div class="hl-actions"><button type="button" id="hl-start">접근 시작</button>
      <button type="button" id="hl-act" hidden>감속 · 한 번 누르기</button>
      <button type="button" id="hl-continue" hidden>연마 시작</button></div>`;

  let dialog, p, round, opener, callback, number, practiceNumber=0, frame=0, last=null, paused=false;
  function nextPractice(){
    const skip=1+Math.floor(Math.random()*5);
    practiceNumber=practiceNumber?(practiceNumber-1+skip)%6+1:1+Math.floor(Math.random()*6);
    return practiceNumber;
  }
  function running(){return round?.phase==='waiting'||round?.phase==='sweeping';}
  function halt(){cancelAnimationFrame(frame);frame=0;last=null;}
  function paint(){
    dialog.dataset.phase=round.phase;dialog.dataset.zone=zone(round);dialog.dataset.result=round.result;
    p.needle.setAttribute('transform','rotate('+angle(round.fraction)+' '+cx+' '+cy+')');
    p.direction.toggleAttribute('hidden',round.elapsed<round.wait);
    p.direction.setAttribute('transform',round.direction===1?'':'translate(216 0) scale(-1 1)');
    const offset=round.phase==='success'?headSeated:headOffset(round.fraction);
    p.carrier.style.transform='translateY('+offset.toFixed(2)+'px)';
    p.lamp.setAttribute('fill',round.phase==='sweeping'||round.phase==='success'?'#bbdf79':'#98a78d');
  }
  function showPressRecord(){
    const reading=pressReading(round);
    p.mark.toggleAttribute('hidden',reading===null);
    p.key.toggleAttribute('hidden',reading===null);
    if(reading!==null)p.mark.setAttribute('transform',p.needle.getAttribute('transform'));
    const early=round.result==='early', late=round.result==='late';
    p.gap.toggleAttribute('hidden',!early&&!late);
    if(early||late){
      const edge=nearestBandEdge(round);
      p.gap.setAttribute('d',arc(Math.min(round.fraction,edge),Math.max(round.fraction,edge),81));
    }
    p.detail.hidden=!round.result;
    p.detail.textContent=reading || '';
  }
  function present(){
    const active=running(), phase=round.phase, reason=round.result;
    p.field.disabled=!active;p.act.hidden=!active;p.start.hidden=active||(phase==='success'&&Boolean(callback));
    p.slow.hidden=phase==='success'||round.slow;
    p.resume.hidden=phase!=='success'&&(active||Boolean(callback));
    p.start.textContent=phase==='ready'?'접근 시작':phase==='success'?'한 번 더':'다시 도전';
    p.cue.textContent=phase==='ready'?'헤드가 위에서 대기 중이에요.':phase==='waiting'?'대기 · 접근 신호를 기다려요.':
      phase==='sweeping'?'초록 띠에서 감속!':phase==='success'?(reason==='precise'?'정밀 안착':'안착'):
      reason==='before'?'접근 신호를 기다려요':reason==='early'?'조금 빨랐어요':'조금 늦었어요';
    paint();showPressRecord();
    if(!active){halt();if(phase!=='ready')p.cue.focus({preventScroll:true});}
  }
  function sync(now){
    if(last!==null&&now<last)return;
    const before=round.phase;
    const delta=last===null?0:(now-last)/1000;
    last=now;
    // If the display stalls, preserve a visible opportunity on its next frame.
    round=advance(round,delta>0.25?0.12:delta);
    if(before==='waiting'&&round.phase==='sweeping')globalThis.CMPFeedback?.play('landing-cue');
    if(before!==round.phase)present();else paint();
  }
  function schedule(){if(!frame&&!paused&&!document.hidden&&dialog.open&&running())frame=requestAnimationFrame(tick);}
  function tick(now){frame=0;if(paused||document.hidden||!dialog.open||!running())return;sync(now);schedule();}
  function start(slow){
    if(!callback && (round.phase==='failed'||round.phase==='success'))number=nextPractice();
    halt();round=createRound(number,slow);paused=document.hidden;last=performance.now();setBands();
    present(); p.field.focus({preventScroll:true});schedule();
  }
  function setBands(){
    p.band.setAttribute('d',arc(round.center-round.band,round.center+round.band,71));
    const center=arc(round.center-round.precise,round.center+round.precise,71);
    p.core.setAttribute('d',center);p.stripe.setAttribute('d',center);
    const limits=[round.center-round.band,round.center+round.band];
    p.boundaries.setAttribute('d',limits.map(t=>'M '+point(t,64)+' L '+point(t,78)).join(' '));
    p.heightBand.setAttribute('d','M369 '+(pointerY+headOffset(limits[0]))+' V'+(pointerY+headOffset(limits[1])));
  }
  function brake(){
    if(!dialog?.open||!running()||paused||document.hidden)return;
    sync(performance.now());if(!running())return;
    round=trigger(round);
    const sound=round.result==='precise'?'landing-precise':round.result==='good'?'landing-good':'landing-miss';
    globalThis.CMPFeedback?.play(sound);
    present();
  }
  function finish(submit){
    if(!dialog?.open||(submit&&callback&&round.phase!=='success'))return;
    const cb=callback,source=opener;callback=null;opener=null;halt();dialog.close();
    if(submit&&cb)cb();else if(source?.isConnected&&!source.disabled)source.focus({preventScroll:true});
  }
  function pause(){if(dialog?.open&&running()){paused=true;halt();}}
  function wake(){if(dialog?.open&&running()&&!document.hidden&&document.hasFocus()){paused=false;last=null;schedule();}}
  function mount(){
    dialog=document.createElement('dialog');dialog.id='head-landing-dialog';dialog.setAttribute('aria-labelledby','hl-title');
    dialog.innerHTML=markup;document.body.append(dialog);
    globalThis.CMPFeedback?.bindMuteButton?.(dialog.querySelector('.cmp-fx-toggle'));
    const q=id=>dialog.querySelector('#hl-'+id);
    p={title:q('title'),close:q('close'),field:q('trigger'),start:q('start'),act:q('act'),slow:q('slow'),resume:q('continue'),cue:q('cue'),
      needle:q('needle'),direction:q('direction'),carrier:q('carrier'),band:q('band'),core:q('core'),stripe:q('stripe'),lamp:q('lamp'),
      mark:q('press-mark'),key:q('record-key'),gap:q('gap'),boundaries:q('boundaries'),heightBand:q('height-band'),detail:q('record-detail')};
    for(const node of [p.field,p.act]){
      node.setAttribute('aria-keyshortcuts','Space Enter');
      node.addEventListener('pointerdown',event=>{if(event.button===0&&event.isPrimary){event.preventDefault();brake();}});
      node.addEventListener('keydown',event=>{
        if(event.key===' '||event.key==='Enter'){event.preventDefault();if(!event.repeat)brake();}
      });
      node.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')event.preventDefault();});
      node.addEventListener('click',event=>{if(event.detail===0)brake();});
    }
    p.start.addEventListener('click',()=>start(round.slow));p.slow.addEventListener('click',()=>start(true));
    p.resume.addEventListener('click',()=>finish(true));p.close.addEventListener('click',()=>finish(false));
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    window.addEventListener('blur',pause);window.addEventListener('focus',wake);
    document.addEventListener('visibilitychange',()=>document.hidden?pause():wake());
    window.addEventListener('pagehide',()=>finish(false));
  }
  function open(options={}){
    if(!dialog)mount();if(dialog.open)return;
    opener=options.opener||document.activeElement;callback=typeof options.onContinue==='function'?options.onContinue:null;
    number=callback?(Number.isSafeInteger(options.waferNumber)&&options.waferNumber>0?options.waferNumber:1):nextPractice();
    p.title.textContent=callback?number+'번 웨이퍼 · 헤드 안착':'헤드 안착';
    p.close.setAttribute('aria-label',options.practiceLabel||escapeLabel);
    p.resume.textContent=callback?(options.continueLabel||'연마 시작'):(options.practiceLabel||'연습 마치기');
    round={...createRound(number),phase:'ready'};setBands();dialog.showModal();present();p.start.focus({preventScroll:true});
  }
  return Object.freeze({open,close:()=>finish(false),createRound,advance,trigger,zone,pressReading});
});
