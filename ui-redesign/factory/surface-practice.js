(()=>{
  'use strict';
  const board = `<section id="wi-game" aria-label="웨이퍼 연마와 표면 검사">
  <section id="wi-inspection" aria-labelledby="wi-heading">
    <header><h2 id="wi-heading">빛으로 표면 검사</h2><span id="wi-origin">예제 웨이퍼 01</span></header>
    <button type="button" id="wi-field" aria-describedby="wi-hint" aria-label="검사 작업대. 드래그하거나 방향키로 빛을 옮기세요. 밝혀진 곳을 클릭하거나 스페이스로 표시하세요."><canvas id="wi-canvas" width="640" height="320" aria-hidden="true"></canvas></button>
    <div class="wi-console">
      <p id="wi-hint">빛을 끌어 옮기고, 구릿빛 빗금이 드러나면 그 자리를 한 번 찍으세요.</p>
      <div class="wi-controls">
        <button type="button" id="wi-check" disabled>표시한 곳 확인</button><button type="button" id="wi-none">과연마 없음</button>
        <button type="button" id="wi-next" hidden>다음 예제</button>
        <button type="button" id="wi-own" class="wi-link">직접 연마하기 ↗</button>
      </div>
      <p id="wi-process-result" hidden></p>
    </div>
    <span id="wi-live" class="sr-only" aria-live="polite"></span>
  </section>
  <section id="wp-rotary" aria-label="회전식 웨이퍼 연마 체험" hidden>
  <header><h2>회전식 웨이퍼 연마</h2><button id="wp-mute" class="cmp-fx-toggle" type="button">효과음</button><span id="wp-phase">돌출부 제거 · 마감 80% 이상 · 과연마 5% 이하</span></header>
  <div class="wp-tools" role="group" aria-label="연마 도구">
    <button id="wp-coarse" type="button" aria-pressed="true"><i aria-hidden="true"></i><span>굵은 패드<small>돌출부 깎기</small></span></button>
    <button id="wp-finish" type="button" aria-pressed="false"><i aria-hidden="true"></i><span>마감 패드<small>넓게 광택 내기</small></span></button>
  </div>
  <div id="wp-meters" aria-hidden="true">
    <div class="wp-meter"><span>남은 돌출부</span><b id="wp-ridge-count">3곳</b><div id="wp-ridges"><i></i><i></i><i></i></div></div>
    <div class="wp-meter"><span>마감</span><b id="wp-gloss">0%</b><div class="wp-track wp-gloss-track"><i></i></div></div>
    <div class="wp-meter"><span>과연마</span><b id="wp-damage">0%</b><div class="wp-track wp-damage-track"><i></i></div></div>
  </div>
  <button id="wp-field" type="button" aria-label="회전하는 웨이퍼. 누르고 있는 동안 연마하고, 손을 떼면 패드가 들립니다. 누른 채 중심과 가장자리 사이로 이동하세요. 키보드는 방향키로 반경을 맞추고 스페이스를 길게 누르세요."><canvas id="wp-canvas" width="640" height="352" aria-hidden="true"></canvas></button>
  <div class="wp-info"><span id="wp-hint">돌출부가 패드 아래에 오면 누르고, 지나가면 떼세요.</span><strong id="wp-value" class="sr-only">남은 돌출부 3곳 · 마감 0% · 과연마 0%</strong></div>
  <div class="wp-foot"><span id="wp-read" aria-label="패드 아래 표면 상태">패드 아래 · 높은 돌출부</span><button id="wp-action" type="button" disabled>가공 끝내고 검사</button></div>
  <button id="wi-back" class="wi-link" type="button">예제로 돌아가기</button>
  <span id="wp-live" class="sr-only" aria-live="polite"></span>
</section>
</section>`;
  function mountPractice(shell, isRound=false){
  const workshopLocation = window.__cmpAsset && window.location.protocol === 'about:'
    ? window.parent.location : window.location;
  const scope = new URLSearchParams(workshopLocation.search).get('workshop');
  const scoped = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(scope || '');
  const storageKey = 'cmp-factory-surface-practice-v1' + (scoped ? ':' + scope : '');
  const storageWarning = shell.querySelector('.surface-practice-storage');
  function readPractice(){
    try { return window.localStorage.getItem(storageKey); }
    catch { storageWarning.hidden = false; return null; }
  }
function createInspectionLens(field, canvas, onChange) {
  const ctx = canvas.getContext('2d');
  const textureSize = 380;
  const material = document.createElement('canvas');
  const defects = document.createElement('canvas');
  const lit = document.createElement('canvas');
  material.width = material.height = defects.width = defects.height = textureSize;
  const waferPath = new Path2D();
  const notch = .045;
  waferPath.arc(0, 0, 1, Math.PI / 2 + notch, Math.PI * 2.5 - notch);
  waferPath.lineTo(0, .954);
  waferPath.closePath();
  let scene = null, state = null, grip = null, pending = 0;
  let width = 0, height = 0, radius = 0, cx = 0, cy = 0, dpr = 1;
  const nx = .96, ny = -.28;
  function screen(p) {
    const c = Math.cos(scene.angle), s = Math.sin(scene.angle);
    return {x:c*p.x-s*p.y, y:s*p.x+c*p.y};
  }
  function sample(p) {
    const c = Math.cos(scene.angle), s = Math.sin(scene.angle);
    return {x:c*p.x+s*p.y, y:-s*p.x+c*p.y};
  }
  function within(p) {
    return p.x*p.x+p.y*p.y <= 1 && !(p.y>.954 && Math.abs(p.x)<(p.y-.954));
  }
  function bake() {
    const g = material.getContext('2d'), h = defects.getContext('2d');
    const base = g.createImageData(textureSize, textureSize);
    const flaw = h.createImageData(textureSize, textureSize);
    const {N,stock,removed,damage,sheen} = scene;
    for (let j=0;j<textureSize;j++) for (let i=0;i<textureSize;i++) {
      const x=(i+.5)*2/textureSize-1,y=(j+.5)*2/textureSize-1;
      if (!within({x,y})) continue;
      const u=(x+1)*(N-1)*.5,v=(y+1)*(N-1)*.5,k=Math.floor(v)*N+Math.floor(u);
      const a=u%1,b=v%1;
      const interpolate=table=>(table[k]*(1-a)+table[k+1]*a)*(1-b)+(table[k+N]*(1-a)+table[k+N+1]*a)*b;
      const grain=((i*149+j*83+i*j*13)%103)/103-.5;
      const shine=Math.exp(-(((x+.56*y+.44)/.27)**2));
      const lattice=Math.min(Math.abs(i%19-9),Math.abs(j%19-9))<.6 ? 4 : 0;
      const f=Math.min(1,Math.max(0,interpolate(sheen)))*4;
      const offset=lattice+grain*3+f;
      const ix=(j*textureSize+i)*4;
      base.data[ix]=81+46*shine+16*(1-y)+offset;
      base.data[ix+1]=100+43*shine+15*(1-y)+offset;
      base.data[ix+2]=109+45*shine+17*(1-y)+7*Math.sin(4*x-2*y)+offset;
      base.data[ix+3]=255;
      const residual=interpolate(stock)-interpolate(removed);
      const nearest=Math.round(v)*N+Math.round(u);
      if (residual<damage||stock[nearest]-removed[nearest]<damage) {
        const stripe=(i+j)%9<2, edge=residual>damage-.14;
        flaw.data[ix]=edge?239:stripe?105:186;
        flaw.data[ix+1]=edge?188:stripe?78:123;
        flaw.data[ix+2]=edge?129:stripe?71:87;
        flaw.data[ix+3]=edge?238:230;
      }
    }
    g.putImageData(base,0,0);
    h.putImageData(flaw,0,0);
  }
  function diskTransform(c) {
    c.translate(cx,cy);c.scale(radius,radius);c.rotate(scene.angle);
  }
  function requestDraw() {
    if (!pending) pending=requestAnimationFrame(()=>{pending=0;draw();});
  }
  function draw() {
    if (!scene||!state) return;
    const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
    if (!width||!height) return;
    dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.round(width*dpr),h=Math.round(height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=lit.width=w;canvas.height=lit.height=h;}
    if(lit.width!==w||lit.height!==h){lit.width=w;lit.height=h;}
    cx=width/2;cy=height*.515;radius=Math.min(width*.445,height*.445);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const enamel=ctx.createLinearGradient(0,0,width,height);
    enamel.addColorStop(0,'#c5c9ad');enamel.addColorStop(1,'#859781');
    ctx.fillStyle=enamel;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#788772';ctx.lineWidth=1;ctx.strokeRect(6,6,width-12,height-12);
    for(const x of [15,width-15])for(const y of [15,height-15]){
      ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fillStyle='#c9cbb2';ctx.fill();
      ctx.strokeStyle='#6a796a';ctx.stroke();ctx.beginPath();ctx.moveTo(x-2,y+1);ctx.lineTo(x+2,y-1);ctx.stroke();
    }
    ctx.save();ctx.shadowColor='#40564580';ctx.shadowBlur=8;ctx.shadowOffsetY=4;
    ctx.beginPath();ctx.arc(cx,cy,radius+5,0,Math.PI*2);ctx.fillStyle='#e4debf';ctx.fill();ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius+1,0,Math.PI*2);ctx.fillStyle='#465449';ctx.fill();
    diskTransform(ctx);ctx.drawImage(material,-1,-1,2,2);ctx.restore();
    const beam=screen(state.beam), beta=nx*beam.x+ny*beam.y;
    function band(c,extent) {
      return c.createLinearGradient(cx+radius*(beta-extent)*nx,cy+radius*(beta-extent)*ny,
        cx+radius*(beta+extent)*nx,cy+radius*(beta+extent)*ny);
    }
    if(!state.revealed){
      // The inspection light's carriage follows the beam across the top rail.
      const railY=Math.max(11,cy-radius-10),railHalf=Math.min(radius*.89,width*.39);
      const lampX=cx+Math.max(-1,Math.min(1,beta))*railHalf;
      ctx.save();ctx.lineCap='round';
      ctx.strokeStyle='#56675a';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(cx-railHalf,railY);ctx.lineTo(cx+railHalf,railY);ctx.stroke();
      ctx.fillStyle='#687b69';ctx.fillRect(lampX-12,railY-4,24,7);
      ctx.strokeStyle='#d9dec0';ctx.lineWidth=1;ctx.strokeRect(lampX-12,railY-4,24,7);
      ctx.fillStyle='#f7ecc4';ctx.fillRect(lampX-9,railY+2,18,2);ctx.restore();
      ctx.save();diskTransform(ctx);ctx.clip(waferPath);ctx.setTransform(dpr,0,0,dpr,0,0);
      const shine=band(ctx,.31);
      shine.addColorStop(0,'rgba(244,246,223,0)');shine.addColorStop(.18,'rgba(229,240,222,.12)');
      shine.addColorStop(.48,'rgba(248,249,230,.60)');shine.addColorStop(.52,'rgba(245,250,233,.56)');
      shine.addColorStop(.82,'rgba(222,238,225,.16)');shine.addColorStop(1,'rgba(245,249,228,0)');
      ctx.fillStyle=shine;ctx.fillRect(0,0,width,height);ctx.restore();
      const l=lit.getContext('2d');l.setTransform(dpr,0,0,dpr,0,0);l.clearRect(0,0,width,height);
      l.save();diskTransform(l);l.drawImage(defects,-1,-1,2,2);l.restore();
      const mask=band(l,.29);mask.addColorStop(0,'transparent');mask.addColorStop(.24,'#000');
      mask.addColorStop(.76,'#000');mask.addColorStop(1,'transparent');
      l.globalCompositeOperation='destination-in';l.fillStyle=mask;l.fillRect(0,0,width,height);l.globalCompositeOperation='source-over';
      ctx.drawImage(lit,0,0,width,height);
      const px=cx+beam.x*radius,py=cy+beam.y*radius;
      ctx.strokeStyle='#f3f2dfc0';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(px-6,py);ctx.lineTo(px-2,py);ctx.moveTo(px+2,py);ctx.lineTo(px+6,py);
      ctx.moveTo(px,py-6);ctx.lineTo(px,py-2);ctx.moveTo(px,py+2);ctx.lineTo(px,py+6);ctx.stroke();
    }else{
      ctx.save();diskTransform(ctx);ctx.drawImage(defects,-1,-1,2,2);ctx.restore();
    }
    if(state.mark){
      const m=screen(state.mark),x=cx+m.x*radius,y=cy+m.y*radius,r=Math.max(8,radius*.065);
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='#273b34';ctx.lineWidth=4;ctx.stroke();
      ctx.strokeStyle='#fff7d5';ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-r*.36,y);ctx.lineTo(x+r*.36,y);ctx.moveTo(x,y-r*.36);ctx.lineTo(x,y+r*.36);ctx.stroke();
    }
  }
  function active() { return scene&&state&&!field.disabled&&!state.revealed; }
  function position(e) {
    const box=canvas.getBoundingClientRect();
    return sample({x:(e.clientX-box.left-cx)/radius,y:(e.clientY-box.top-cy)/radius});
  }
  function update(change,kind) {
    state={...state,...change};
    onChange({beam:{...state.beam},mark:state.mark?{...state.mark}:null},kind);requestDraw();
  }
  function moveBeam(p,kind) {
    const length=Math.hypot(p.x,p.y);
    if(length>.985)p={x:p.x*.985/length,y:p.y*.985/length};
    update({beam:p},kind);
  }
  function mark(p) {
    const spot=screen(p),beam=screen(state.beam);
    if(!within(p))return;
    if(Math.abs((spot.x-beam.x)*nx+(spot.y-beam.y)*ny)<=.245)update({mark:p},'mark');
    else update({},'unlit');
  }
  field.addEventListener('pointerdown',e=>{
    if(!active()||grip||!e.isPrimary||e.button!==0)return;
    grip={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    field.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove',e=>{
    if(grip?.id!==e.pointerId||!active())return;
    if(!grip.moved&&Math.hypot(e.clientX-grip.x,e.clientY-grip.y)<4)return;
    grip.moved=true;moveBeam(position(e),'scan');
  },true);
  function release() {
    if(!grip)return;const id=grip.id;grip=null;
    if(field.hasPointerCapture(id))field.releasePointerCapture(id);
  }
  document.addEventListener('pointerup',e=>{
    if(grip?.id!==e.pointerId)return;
    const moved=grip.moved;release();if(!active())return;
    if(moved)moveBeam(position(e),'commit');else mark(position(e));
  },true);
  function cancel(e) {
    if(grip?.id!==e.pointerId)return;
    const moved=grip.moved;release();if(moved&&active())update({},'commit');
  }
  document.addEventListener('pointercancel',cancel,true);
  window.addEventListener('blur',()=>{if(grip)cancel({pointerId:grip.id});});
  field.addEventListener('keydown',e=>{
    if(!active())return;
    if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)mark(state.beam);return;}
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    const dir=directions[e.key];if(!dir)return;e.preventDefault();
    const p=screen(state.beam),step=e.shiftKey ? .13 : .06;
    moveBeam(sample({x:p.x+dir[0]*step,y:p.y+dir[1]*step}),'commit');
  });
  field.addEventListener('click',e=>{if(e.detail===0&&active())mark(state.beam);});
  new ResizeObserver(requestDraw).observe(canvas);
  return {
    setScene(value,initial){release();scene=value;state={...initial};bake();draw();},
    setState(value){state={...value};requestDraw();},
    draw,
    stop(){release();if(pending)cancelAnimationFrame(pending);pending=0;}
  };
}
  const root=shell.querySelector('#wp-rotary'), get=id=>root.querySelector('#wp-'+id);
  const game=shell.querySelector('#wi-game'),wi=id=>game.querySelector('#wi-'+id);
  const field=get('field'),cv=get('canvas'),ctx=cv.getContext('2d'),action=get('action');
  const meters=get('meters'),ridgeMarks=[...get('ridges').children],ridgeCount=get('ridge-count');
  const glossValue=get('gloss'),damageValue=get('damage'),scoreText=get('value');
  const heardRidges=new Set();
  window.CMPFeedback?.bindMuteButton?.(get('mute'));
  const N=67, resolution=340, removed=new Float32Array(N*N),stock=new Float32Array(N*N),sheen=new Float32Array(N*N);
  const mounds=[[],[],[]];
  const pads={coarse:{radius:.205,perSecond:1.95},finish:{radius:.31,perSecond:.86}};
  const turn=Math.PI*2, motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed=()=>turn/(motion.matches?16:10);
  const high=.38, damage=-.92, polished=.56;
  let pad='coarse',pattern=0;
  const skin=document.createElement('canvas');skin.width=skin.height=resolution;
  const gfx=skin.getContext('2d'),rgba=gfx.createImageData(resolution,resolution);
  const pixels=[], cells=[];
  const mean=(a,b,t)=>a+(b-a)*t, clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
  const inDisk=(x,y)=>x*x+y*y<=1 && !(y>.953 && Math.abs(x)<(y-.953)*.8);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(inDisk(i/(N-1)*2-1,j/(N-1)*2-1))cells.push(j*N+i);
  function formWafer(){
    const angle=pattern*Math.PI*2/3,co=Math.cos(angle),si=Math.sin(angle);
    heardRidges.clear();
    for(const group of mounds)group.length=0;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){
      const x=i/(N-1)*2-1,y=j/(N-1)*2-1,u=x*co+y*si,v=-x*si+y*co;
      const dome=(cx,cy,rx,ry,tilt)=>Math.max(0,1-((u-cx+tilt*(v-cy))/rx)**2-((v-cy)/ry)**2);
      const heights=[3.0*dome(-.36,-.27,.34,.31,.30),2.05*dome(.42,.05,.23,.45,-.43),1.30*dome(-.18,.52,.26,.18,.15)];
      const k=j*N+i,peak=Math.max(...heights);
      stock[k]=peak;
      if(peak>high && inDisk(x,y))mounds[heights.indexOf(peak)].push(k);
    }
  }
  formWafer();
  for(let j=0;j<resolution;j++)for(let i=0;i<resolution;i++){
    const x=(i+.5)/resolution*2-1,y=(j+.5)/resolution*2-1;
    if(!inDisk(x,y))continue;
    const u=(x+1)*(N-1)/2,v=(y+1)*(N-1)/2;
    const grain=((i*97+j*83+i*j*17)%61)/61-.5;
    const light=Math.exp(-(((x+.28*y+.28)/.48)**2)),wave=Math.sin(5*x-3*y+.7);
    const ix=Math.floor(u),iy=Math.floor(v),grid=Math.min(Math.abs(i%18-9),Math.abs(j%18-9))<.7;
    pixels.push({p:(j*resolution+i)*4,k:iy*N+ix,ax:u-ix,ay:v-iy,
      m:148+21*light+15*grain+6*wave, shine:light, wave,grid,grain,
      stripe:(i+j)%12<3});
  }
  let active=null,locked=false,changed=false,tool={x:.56,y:0},held=false,space=false;
  let axis=0,angle=0,clock=null,lastPaint=-Infinity,inView=true,savedValues=null;
  let W=1,H=1,R=1,X=0,Y=0,dpr=1,dirty=true,frame=0,good=0,over=0;
  let paused=false, windowAway=false, roundPattern=0;
  function contact(value){
    if(held===value)return;
    held=value;root.dataset.contact=held?pad:'lifted';
    if(held)window.CMPFeedback?.startSurfaceContact?.(pad);
    else window.CMPFeedback?.stopSurfaceContact?.();
  }
  let ridgesLeft=3;
  let screen='inspect',origin='sample',caseNo=0,activeScene=null,targets=[];
  const freshLens=()=>({beam:{x:-.57,y:.16},mark:null,revealed:false});
  let sight=freshLens(),answer=null;
  const lens=isRound?null:createInspectionLens(wi('field'),wi('canvas'),(update,kind)=>{
    if(screen!=='inspect'||answer)return;
    sight={...sight,...update};inspectionControls();
    if(kind==='unlit')wi('hint').textContent='그곳은 아직 어두워요. 빛을 그쪽으로 끌어온 뒤 찍으세요.';
    if(kind==='mark')wi('live').textContent='의심 위치를 표시했어요. 표시한 곳 확인을 누르세요.';
    if(kind==='mark'||kind==='commit')save();
  });
  function sampleWafer(index){
    const cut=new Float32Array(N*N),base=new Float32Array(N*N),gloss=new Float32Array(N*N);
    const theta=index*2.39996,cx=.36*Math.cos(theta)+.27*Math.sin(theta),cy=.36*Math.sin(theta)-.27*Math.cos(theta);
    const co=Math.cos(theta+.32),si=Math.sin(theta+.32);
    const clean=index%4===1,stretch=index%3===2?.29:.24;
    for(const k of cells){
      const x=(k%N)*2/(N-1)-1,y=Math.floor(k/N)*2/(N-1)-1;
      const u=(x-cx)*co+(y-cy)*si,v=-(x-cx)*si+(y-cy)*co;
      const track=Math.max(0,1-(u/stretch)**2-((v-.035*Math.sin(10*u))/.13)**2);
      cut[k]=.27+.08*Math.sin(x*4+y*3)+(clean?.27:1.32)*track;
      gloss[k]=.76+.14*Math.cos(x*4-y*5);
    }
    return {N,stock:base,removed:cut,sheen:gloss,angle:0,damage};
  }
  function matchMark(){
    const p=sight.mark;if(!p)return false;
    return targets.some(k=>{
      const x=(k%N)*2/(N-1)-1,y=Math.floor(k/N)*2/(N-1)-1;
      return (x-p.x)**2+(y-p.y)**2<=.065**2;
    });
  }
  function passed(){
    return answer==='none'?targets.length===0:answer==='spot'&&matchMark();
  }
  function inspectionControls(){
    const done=answer!==null;
    wi('check').hidden=wi('none').hidden=done;wi('next').hidden=!done;
    wi('check').disabled=!sight.mark;wi('field').disabled=done;
    wi('origin').textContent=origin==='personal'?'직접 연마한 웨이퍼':'예제 웨이퍼 '+String(caseNo+1).padStart(2,'0');
    const text=!done?(sight.mark?'표시한 곳을 확인하거나 빛을 옮겨 다시 찍으세요.':'빛을 끌어 옮기고, 구릿빛 빗금이 드러나면 그 자리를 한 번 찍으세요.'):
      targets.length===0?(answer==='none'?'정확해요. 이 웨이퍼에는 과연마 흔적이 없어요.':'찍은 곳은 정상 표면이에요. 이 웨이퍼에는 과연마 흔적이 없어요.'):
      passed()?'찾았어요! 찍은 위치와 구릿빛 과연마 자국이 겹쳐요.':
      (answer==='none'?'놓친 흔적이 있어요.':'찍은 위치와 흔적이 달라요.')+' 구릿빛 빗금이 가공 기록에 남은 자국이에요.';
    if(wi('hint').textContent!==text)wi('hint').textContent=text;
    wi('own').textContent=changed&&!locked?'연마 이어하기 ↗':locked?'새 웨이퍼 연마 ↗':'직접 연마하기 ↗';
    wi('process-result').hidden=!(done&&origin==='personal');
    if(!wi('process-result').hidden)wi('process-result').textContent='내 가공 기록 · 남은 돌출부 '+ridgesLeft+'곳 · 마감 '+good+'% · 과연마 '+over+'%';
  }
  function openInspection(source,preserve=false,focus=false){
    screen='inspect';origin=source;clock=null;
    root.hidden=true;wi('inspection').hidden=false;
    if(!preserve){sight=freshLens();answer=null;}
    activeScene=origin==='personal'?{N,stock,removed,sheen,angle,damage}:sampleWafer(caseNo);
    targets=cells.filter(k=>activeScene.stock[k]-activeScene.removed[k]<damage);
    lens.setScene(activeScene,sight);inspectionControls();
    if(focus)(answer?wi('next'):wi('field')).focus({preventScroll:true});
  }
  function openPolisher(reset,focus=false){
    if(reset){
      removed.fill(0);sheen.fill(0);changed=locked=false;dirty=true;pattern=isRound?roundPattern:(pattern+1)%3;
      formWafer();axis=angle=0;pad='coarse';setRadius(.56);sight=freshLens();answer=null;
    }
    screen='polish';clock=null;wi('inspection').hidden=true;root.hidden=false;
    showPhase();resize();
    if(focus)(locked?wi('back'):field).focus({preventScroll:true});
  }
  function submit(choice){
    if(screen!=='inspect'||answer||(choice==='spot'&&!sight.mark))return;
    answer=choice;
    sight={...sight,mark:choice==='none'?null:sight.mark,revealed:true};
    lens.setState(sight);inspectionControls();wi('live').textContent=wi('hint').textContent;
    wi('next').focus({preventScroll:true});save();
  }
  wi('check').addEventListener('click',()=>submit('spot'));
  wi('none').addEventListener('click',()=>submit('none'));
  wi('next').addEventListener('click',()=>{if(!answer)return;caseNo++;openInspection('sample',false,true);save();});
  wi('own').addEventListener('click',()=>{openPolisher(locked,true);save();});
  wi('back').addEventListener('click',()=>{
    lift();
    if(isRound){openPolisher(true,true);return;}
    if(locked)openPolisher(true,true);
    else openInspection('sample',false,true);
    save();
  });
  function surface(strokeFeedback=false){
    let okay=0,excess=0;
    for(const k of cells){
      const h=stock[k]-removed[k];
      if(h<damage)excess++;
      else if(h<=high && sheen[k]>=polished)okay++;
    }
    good=Math.round(100*okay/cells.length);over=Math.round(100*excess/cells.length);
    let newlyCleared=false;
    ridgesLeft=0;
    mounds.forEach((group,index)=>{
      const raisedCells=group.reduce((n,k)=>n+Number(stock[k]-removed[k]>high),0);
      const raised=raisedCells>group.length*.05;
      if(raised)ridgesLeft++;
      const mark=ridgeMarks[index];
      if(!raised && strokeFeedback && mark.dataset.raised==='true' && !heardRidges.has(index)){
        newlyCleared=true;heardRidges.add(index);
      }
      if(mark.dataset.raised!==String(raised))mark.dataset.raised=String(raised);
    });
    if(newlyCleared && !document.hidden && document.hasFocus())window.CMPFeedback?.play('surface-ridge');
    const interpolate=(a,k,ax,ay)=>mean(mean(a[k],a[k+1],ax),mean(a[k+N],a[k+N+1],ax),ay);
    for(const s of pixels){
      const {p,k,ax,ay}=s;
      const h=interpolate(stock,k,ax,ay)-interpolate(removed,k,ax,ay),z=interpolate(sheen,k,ax,ay);
      const t=clamp(z/polished,0,1),hot=clamp((damage-h)*6+.42,0,1),mark=s.grid?18:0;
      const r=mean(s.m,65+121*s.shine+27*s.wave-mark,t);
      const g=mean(s.m+3,113+94*s.shine+20*s.wave-mark,t);
      const b=mean(s.m-6,136+75*s.shine-20*s.wave-mark,t);
      const ridge=clamp((h-high+.04)*6,0,1);
      const contour=clamp(1-Math.abs((h-high+.15)/.34-Math.round((h-high+.15)/.34))*6,0,1);
      const raisedTone=170+13*s.shine+14*s.grain-43*contour;
      rgba.data[p]=mean(mean(r,raisedTone+33,ridge),185+(s.stripe?24:0)+14*s.shine,hot);
      rgba.data[p+1]=mean(mean(g,raisedTone+5,ridge),107+(s.stripe?25:0),hot);
      rgba.data[p+2]=mean(mean(b,raisedTone-39,ridge),70+(s.stripe?17:0),hot);rgba.data[p+3]=255;
    }
    gfx.putImageData(rgba,0,0);dirty=false;
    const summary='남은 돌출부 '+ridgesLeft+'곳 · 마감 '+good+'% · 과연마 '+over+'%';
    if(scoreText.textContent!==summary){
      scoreText.textContent=summary;
      ridgeCount.textContent=ridgesLeft+'곳';glossValue.textContent=good+'%';damageValue.textContent=over+'%';
      meters.style.setProperty('--wp-gloss',good+'%');meters.style.setProperty('--wp-damage',over+'%');
      meters.dataset.overLimit=String(over>5);
    }
    action.disabled=!changed&&!locked;
  }
  let benchLayer;
  function drawBench(){
    if(!benchLayer||benchLayer.width!==cv.width||benchLayer.height!==cv.height){
      benchLayer=document.createElement('canvas');benchLayer.width=cv.width;benchLayer.height=cv.height;
      const g=benchLayer.getContext('2d');g.scale(cv.width/W,cv.height/H);
      const enamel=g.createLinearGradient(0,0,W*.72,H);
      enamel.addColorStop(0,'#c3c7a5');enamel.addColorStop(.48,'#a3ab8d');enamel.addColorStop(1,'#83907a');
      g.fillStyle=enamel;g.fillRect(0,0,W,H);
      g.lineWidth=1;g.strokeStyle='rgba(57,66,49,.37)';g.strokeRect(5.5,5.5,W-11,H-11);
      g.strokeStyle='rgba(247,236,201,.64)';g.strokeRect(7.5,7.5,W-15,H-15);
      // A quiet paper tooth stays on the enamel rather than on the moving wafer.
      let seed=83;const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let n=0;n<W*H/45;n++){
        const x=noise()*W,y=noise()*H;
        g.fillStyle=n%3?'rgba(60,61,44,.09)':'rgba(255,247,214,.25)';
        g.fillRect(x,y,.6+noise()*1.8,.65);
      }
      const screw=(x,y,a)=>{
        g.save();g.translate(x,y);g.rotate(a);
        g.fillStyle='#657160';g.beginPath();g.arc(0,1.4,5.6,0,Math.PI*2);g.fill();
        g.fillStyle='#d9d8b9';g.strokeStyle='#50594c';g.lineWidth=1;
        g.beginPath();g.arc(0,0,4.8,0,Math.PI*2);g.fill();g.stroke();
        g.strokeStyle='#626555';g.lineCap='round';g.lineWidth=1.3;
        g.beginPath();g.moveTo(-2.8,0);g.lineTo(2.8,0);g.moveTo(0,-2);g.lineTo(0,2);g.stroke();g.restore();
      };
      screw(18,18,-.48);screw(W-18,18,.42);screw(18,H-18,.33);screw(W-18,H-18,-.58);
      g.save();g.shadowColor='rgba(40,48,38,.37)';g.shadowOffsetY=4;g.shadowBlur=4;
      g.beginPath();g.arc(X,Y,R+8,0,Math.PI*2);g.fillStyle='#555f51';g.fill();g.restore();
      const rim=g.createLinearGradient(X-R,Y-R,X+R,Y+R);
      rim.addColorStop(0,'#fbefd5');rim.addColorStop(.42,'#ebe2c4');rim.addColorStop(.82,'#b3b099');rim.addColorStop(1,'#e9ddba');
      g.beginPath();g.arc(X,Y,R+7,0,Math.PI*2);g.fillStyle=rim;g.fill();g.strokeStyle='#596150';g.lineWidth=1.4;g.stroke();
      g.beginPath();g.arc(X,Y,R+4.5,Math.PI*.88,Math.PI*1.83);g.strokeStyle='#fff0cc';g.lineWidth=1.6;g.stroke();
      g.beginPath();g.arc(X,Y,R+.9,0,Math.PI*2);g.fillStyle='#525c52';g.fill();g.strokeStyle='#696e5e';g.lineWidth=2;g.stroke();
    }
    ctx.drawImage(benchLayer,0,0,W,H);
  }
  function drawSlurry(angle,flowing,reduced){
    ctx.save();ctx.translate(X,Y);ctx.scale(R,R);ctx.lineCap='round';ctx.lineJoin='round';
    const stroke=(color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    // The fixed feed tube reaches in only over the outer rim.
    if(flowing){
      const t=reduced ? .47 : (angle*4/Math.PI)%1;
      ctx.beginPath();ctx.moveTo(-.915,-.40);ctx.quadraticCurveTo(-.89,-.418,-.864,-.425);
      stroke('rgba(72,99,94,.48)',.025);stroke('#e6ebda',.016);
      ctx.beginPath();ctx.ellipse(-.85,-.435,.043,.016,-.52,0,Math.PI*2);
      ctx.fillStyle='rgba(227,237,217,.85)';ctx.fill();
      for(let i=0;i<2;i++){
        const r=.952-i*.024,a=-2.685+i*.04;
        ctx.beginPath();ctx.arc(0,0,r,a,a+.21-i*.047);stroke('rgba(227,236,222,.62)',i?.007:.012);
        const wave=a+.21+t*.17+i*.03;
        ctx.beginPath();ctx.arc(0,0,r-.005,wave,wave+.037);stroke('rgba(234,242,231,.66)',.009);
      }
    }
    const pipe=()=>{ctx.beginPath();ctx.moveTo(-1.72,-.69);ctx.lineTo(-1.18,-.69);ctx.quadraticCurveTo(-1.13,-.69,-1.10,-.64);ctx.lineTo(-.99,-.485);};
    pipe();stroke('#4e594a',.083);stroke('#b4b9a4',.061);
    ctx.save();ctx.translate(0,-.018);pipe();stroke('#eee6cd',.011);ctx.restore();
    ctx.translate(-.99,-.485);ctx.rotate(.82);
    ctx.fillStyle='#7d8a75';ctx.strokeStyle='#475449';ctx.lineWidth=.011;
    ctx.beginPath();ctx.moveTo(-.053,-.041);ctx.lineTo(.04,-.041);ctx.lineTo(.067,-.028);ctx.lineTo(.111,-.020);ctx.lineTo(.111,.020);ctx.lineTo(.067,.028);ctx.lineTo(.04,.041);ctx.lineTo(-.053,.041);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-.025,-.03);ctx.lineTo(-.025,.03);ctx.moveTo(-.007,-.03);ctx.lineTo(-.007,.03);stroke('#cad1ba',.007);
    ctx.beginPath();ctx.moveTo(.107,-.016);ctx.lineTo(.107,.016);stroke('#35473f',.009);
    ctx.restore();
  }
  function ring(x,y,r,color,width){
    ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function disc(x,y,r,fill){
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
  }
  function waferPoint(){
    const c=Math.cos(angle),s=Math.sin(angle);
    return {x:c*tool.x+s*tool.y,y:-s*tool.x+c*tool.y};
  }
  function advance(now){
    if(clock!==null && now<clock)return;
    const elapsed=clock===null?0:clamp((now-clock)/1000,0,.20);
    clock=now;
    if(!elapsed||locked||screen!=='polish'||!inView||paused||windowAway||document.hidden)return;
    const steps=Math.ceil(elapsed*70),dt=elapsed/steps,spin=speed()*dt;
    for(let i=0;i<steps;i++){
      angle=(angle+spin*.5)%turn;
      if(held)stamp(waferPoint(),pads[pad].perSecond*dt*(speed()/(turn/10)));
      angle=(angle+spin*.5)%turn;
    }
  }
  function render(now){
    frame=0;if(screen!=='polish'||paused||windowAway||document.hidden)return;advance(now);
    if(dirty && (!held||now-lastPaint>44)){surface(held);lastPaint=now;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    drawBench();
    ctx.save();ctx.translate(X,Y);ctx.rotate(angle);ctx.drawImage(skin,-R,-R,2*R,2*R);ctx.restore();
    drawSlurry(angle,!locked,motion.matches);
    if(locked)return;
    const p=waferPoint();
    const col=Math.round((p.x+1)*(N-1)*.5),row=Math.round((p.y+1)*(N-1)*.5),k=row*N+col;
    const remaining=stock[k]-removed[k];
    let reading='평평함 · 마감할 곳';
    if(remaining<damage)reading='과연마 · 다른 곳으로';
    else if(remaining<-.65)reading='얇아짐 · 다른 곳으로';
    else if(remaining>1.65)reading='높은 돌출부';
    else if(remaining>high)reading='낮은 돌출부 · 조금 더';
    else if(sheen[k]>=polished)reading='마감 완료';
    const read=(held?'접촉 중 · ':'패드 들림 · ')+reading;
    if(get('read').textContent!==read)get('read').textContent=read;
    const coarse=pad==='coarse',r=pads[pad].radius*R;
    const x=X+tool.x*R,y=Y+tool.y*R;
    // Only the shoe moves; the contact footprint and the measured wafer stay in place.
    const chatter=held&&coarse&&!motion.matches?Math.sin(now*.056)*.70:0;
    ctx.save();ctx.translate(chatter,held?0:-2);
    const material=ctx.createRadialGradient(x-r*.35,y-r*.46,1,x,y,r);
    material.addColorStop(0,coarse?'#e7bc83':'#d4e4d8');material.addColorStop(.69,coarse?'#cb9762':'#a4c9bc');material.addColorStop(1,coarse?'#8e6445':'#769c91');
    ctx.save();ctx.shadowColor='rgba(20,27,23,.45)';ctx.shadowBlur=held?2:7;ctx.shadowOffsetY=held?1:4;disc(x,y,r,material);ctx.restore();
    ring(x,y,r,coarse?'#584b3d':'#506d60',1.6);
    ring(x,y,r*.84,coarse?'#aa8059':'#729a8e',1);
    if(coarse){
      ctx.save();ctx.beginPath();ctx.arc(x,y,r*.74,0,turn);ctx.clip();
      const step=r*.23;
      for(let i=-6;i<=6;i++){
        ctx.beginPath();ctx.moveTo(x+i*step-r*.5,y+r*.83);ctx.lineTo(x+i*step+r*.5,y-r*.83);
        ctx.strokeStyle='#876345';ctx.lineWidth=1.5;ctx.stroke();
        ctx.beginPath();ctx.moveTo(x+i*step-r*.5+2,y+r*.83);ctx.lineTo(x+i*step+r*.5+2,y-r*.83);
        ctx.strokeStyle='#e0bd88';ctx.lineWidth=.9;ctx.stroke();
      }
      ctx.restore();
    }else{
      ring(x,y,r*.66,'#7aa193',1);ring(x,y,r*.44,'#8ab1a3',1);ring(x,y,r*.21,'#88ab9d',1);
    }
    if(held){
      const start=coarse?Math.PI*.16:motion.matches?-.7:angle*.7;
      ctx.beginPath();ctx.arc(x,y,r-1.9,start,start+(coarse?2.1:1.3));
      ctx.strokeStyle=coarse?'#63452f':'#f0f3dd';ctx.lineWidth=coarse?2.4:2;ctx.lineCap='round';ctx.stroke();
    }
    ctx.restore();
    if(inView&&!document.hidden)refresh();
  }
  function refresh(){if(!frame&&!paused&&!windowAway&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){
    const rect=cv.getBoundingClientRect();W=Math.max(1,rect.width);H=Math.max(1,rect.height);
    dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    X=W/2;Y=H/2;R=Math.min(W*.45,H*.46);refresh();
  }
  function stamp(p,force){
    const radius=pads[pad].radius;
    const k=(N-1)/2,ux=(p.x+1)*k,uy=(p.y+1)*k,b=radius*k;
    for(let j=Math.max(0,Math.floor(uy-b));j<=Math.min(N-1,Math.ceil(uy+b));j++){
      for(let i=Math.max(0,Math.floor(ux-b));i<=Math.min(N-1,Math.ceil(ux+b));i++){
        const d=((i-ux)**2+(j-uy)**2)/(b*b);
        if(d>=1)continue;
        const ind=j*N+i,abrasion=force*(1-d),before=stock[ind]-removed[ind];
        const coarse=pad==='coarse';
        const step=abrasion*(coarse?1:.47);
        const raised=Math.min(Math.max(0,before),step);
        removed[ind]=Math.min(stock[ind]+1.60,removed[ind]+raised+(step-raised)*(coarse ? .32 : .29));
        if(coarse)sheen[ind]=Math.max(0,sheen[ind]-abrasion*1.8);
        else if(stock[ind]-removed[ind]<=high)sheen[ind]=Math.min(1,sheen[ind]+abrasion*1.8);
      }
    }changed=true;dirty=true;
  }
  function setRadius(distance){
    const radius=clamp(distance,0,.985);
    tool={x:radius*Math.cos(axis),y:radius*Math.sin(axis)};
  }
  function park(p){
    if(Math.hypot(p.x,p.y)>.01)axis=Math.atan2(p.y,p.x);
    setRadius(Math.hypot(p.x,p.y));
  }
  function location(e){const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left-X)/R,y:(e.clientY-b.top-Y)/R};}
  function endStroke(){
    // Score the same surface that will be restored when the player returns.
    for(const i of cells){removed[i]=Math.round(removed[i]*50)/50;sheen[i]=Math.round(sheen[i]*250)/250;}
    dirty=true;surface(true);refresh();save();
  }
  function save(){
    if(isRound)return;
    const existing = readPractice();
    if (existing !== savedValues) {
      syncPractice(existing);
      return;
    }
    const bytes=new Uint8Array(N*N*2);
    for(let i=0;i<removed.length;i++){bytes[i]=Math.round(removed[i]*50);bytes[removed.length+i]=Math.round(sheen[i]*250);}
    const state={v:4,values:btoa(String.fromCharCode(...bytes)),pad,pattern,angle,locked,changed,
      screen,origin,caseNo,beam:sight.beam,mark:sight.mark,answer};
    const serialized = JSON.stringify(state);
    if (serialized === savedValues) return;
    try { window.localStorage.setItem(storageKey, serialized); savedValues = serialized; }
    catch { storageWarning.hidden = false; }
  }
  function cancelTools(){
    const id = active;
    active = null;
    space = false;contact(false);
    if (id !== null && field.hasPointerCapture(id)) field.releasePointerCapture(id);
    lens?.stop();
    clock = null;
  }
  function syncPractice(serialized){
    if (serialized === savedValues) return;
    savedValues = serialized;
    cancelTools();
    if (serialized && restore(serialized)) return;
    removed.fill(0); sheen.fill(0);
    locked = changed = false; dirty = true;
    pattern = caseNo = axis = angle = 0; pad = 'coarse'; setRadius(.56);
    formWafer(); surface(); showPhase(); openInspection('sample');
  }
  function restore(serialized){
    let data, raw;
    try {
      data = JSON.parse(serialized);
      if (data?.v !== 4 || !['polish','inspect'].includes(data.screen) ||
          !['sample','personal'].includes(data.origin) || typeof data.values !== 'string' ||
          data.values.length !== 4 * Math.ceil(N*N*2/3)) return false;
      raw = atob(data.values);
      if (raw.length !== N*N*2) return false;
    } catch { return false; }
    for (let i=0; i<N*N; i++) {
      removed[i]=raw.charCodeAt(i)/50; sheen[i]=Math.min(1,raw.charCodeAt(i+N*N)/250);
    }
    pattern=[0,1,2].includes(data.pattern)?data.pattern:0;formWafer();pad=data.pad==='finish'?'finish':'coarse';
    active=null;space=false;contact(false);angle=Number.isFinite(data.angle)?data.angle%turn:0;clock=null;
    locked=data.locked===true;changed=data.changed===true;dirty=true;surface();
    caseNo=Number.isSafeInteger(data.caseNo)&&data.caseNo>=0?data.caseNo:0;
    const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x,p.y)<=1.001;
    const mark=point(data.mark)?data.mark:null;
    answer=data.answer==='none'||(data.answer==='spot'&&mark)?data.answer:null;
    sight={beam:point(data.beam)?data.beam:freshLens().beam,mark,revealed:answer!==null};
    if(data.screen==='polish'&&!locked)openPolisher(false);
    else openInspection(data.origin==='personal'&&locked?'personal':'sample',true);
    return true;
  }
  function showPhase(){
    field.disabled=locked;action.disabled=!changed;
    root.dataset.tool=pad;root.dataset.contact=held?pad:'lifted';
    action.textContent=locked?'연마한 표면 보기':'가공 끝내고 검사';
    wi('back').textContent=locked?'새 웨이퍼 연마':'예제로 돌아가기';
    for(const id of Object.keys(pads)){get(id).disabled=locked;get(id).setAttribute('aria-pressed',String(id===pad));}
    const goal='돌출부 제거 · 마감 80% 이상 · 과연마 5% 이하';
    get('phase').textContent=locked?'측정 완료':goal;
    get('hint').textContent=locked?(over>5?'과연마 면적이 기준을 넘었어요.':ridgesLeft?'줄무늬 돌출부가 남아 있어요.':good>=80?'표면 가공 목표를 달성했어요.':'마감 면적이 부족해요.'):(pad==='coarse'?'돌출부가 오면 꾹 누르고, 평평한 면이 오면 떼세요.':'누른 채 중심에서 가장자리로 천천히 옮겨 보세요.');
    if(locked)get('read').textContent=goal;
    if(isRound){
      const won=locked && ridgesLeft===0 && good>=80 && over<=5;
      shell.dataset.phase=locked?(won?'success':'failed'):'active';
      shell.querySelector('#surface-round-continue').hidden=!won;
      action.textContent='표면 판정하기';action.hidden=locked;
      wi('back').textContent='새 웨이퍼로 다시 하기';
      if(locked){
        get('phase').textContent=won?'가공 기준 충족':'가공 기준 미달';
        get('live').textContent=get('hint').textContent+' '+get('value').textContent;
      }else get('live').textContent='';
    }
  }
  for(const id of Object.keys(pads))get(id).addEventListener('click',()=>{
    if(locked||active!==null||space||pad===id)return;
    pad=id;window.CMPFeedback?.play('pad-latch');showPhase();refresh();save();
  });
  field.addEventListener('pointerdown',e=>{
    if(locked||active!==null||space||!e.isPrimary||e.button!==0)return;
    const p=location(e);if(Math.hypot(p.x,p.y)>1)return;
    advance(performance.now());park(p);active=e.pointerId;field.setPointerCapture(active);contact(true);refresh();
  });
  field.addEventListener('pointermove',e=>{
    if(locked||space)return;
    const p=location(e),inside=Math.hypot(p.x,p.y)<=1;
    if(active===e.pointerId){
      advance(performance.now());contact(inside);
      if(inside)setRadius(p.x*Math.cos(axis)+p.y*Math.sin(axis));
    }else if(active===null&&e.pointerType==='mouse'&&inside)park(p);
  });
  function lift(){
    if(active===null&&!space)return;
    advance(performance.now());
    const id=active;active=null;space=false;contact(false);
    if(id!==null&&field.hasPointerCapture(id))field.releasePointerCapture(id);
    if(changed)endStroke();else refresh();
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])field.addEventListener(type,e=>{if(e.pointerId===active)lift();});
  field.addEventListener('keydown',e=>{
    if(locked||active!==null)return;
    if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!space){advance(performance.now());space=true;contact(true);refresh();}return;}
    const direction={ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[e.key];
    if(!direction)return;e.preventDefault();advance(performance.now());
    setRadius(Math.hypot(tool.x,tool.y)+direction*.06);refresh();
  });
  field.addEventListener('keyup',e=>{if(space&&(e.key===' '||e.key==='Enter')){e.preventDefault();lift();}});
  field.addEventListener('blur',lift);
  window.addEventListener('blur',()=>{
    lift();
    if(isRound){windowAway=true;clock=null;}
  });
  if(isRound)window.addEventListener('focus',()=>{windowAway=false;clock=null;refresh();});
  window.addEventListener('pagehide',lift);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)lift();clock=null;refresh();});
  new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;if(!inView)lift();clock=null;refresh();
  }).observe(field);
  action.addEventListener('click',()=>{
    if(!changed||screen!=='polish')return;
    const keepInspection=locked&&origin==='personal';
    lift();locked=true;clock=null;surface();showPhase();
    if(isRound){
      // A held Enter from judging must never carry over to the paid run or retry.
      get('phase').focus({preventScroll:true});
      refresh();
      return;
    }
    openInspection('personal',keepInspection,true);save();
  });
  new ResizeObserver(resize).observe(cv);
  if(!isRound){
    showPhase();openInspection('sample');
    syncPractice(readPractice());
    window.addEventListener('storage', event => {
      if (event.key === storageKey || event.key === null) syncPractice(readPractice());
    });
  }
  return {
    resume() { paused=false;syncPractice(readPractice()); if (screen === 'polish') resize(); else lens.draw(); },
    startRound(waferNumber) {
      paused=false;windowAway=false;cancelTools();
      roundPattern=(waferNumber-1)%3;
      openPolisher(true,true);
    },
    enter(mode) {
      if(mode==='polish')openPolisher(false,true);
      else {
        const source=locked?'personal':'sample';
        openInspection(source,origin===source,true);
      }
    },
    pause() { lift(); paused=true;cancelTools();if(frame)cancelAnimationFrame(frame);frame=0; }
  };
  }
  const page = document.getElementById('surface-practice-page');
  const trigger = document.getElementById('surface-practice-link');
  if (!page && !trigger) return;
  let shell, practice, returnTo=null;
  let roundShell, roundPractice, roundOptions=null, roundNav, roundContinue;
  let fromWorkbench=false;
  function buildSurface(container, embedded, onExit=leavePractice) {
    const nav = document.createElement('nav');
    nav.className = 'surface-practice-nav';
    nav.setAttribute('aria-label', '연습 내비게이션');
    const title = document.createElement('strong');
    title.id = container.id==='surface-round'?'surface-round-title':'surface-practice-title';
    title.textContent = '웨이퍼 연마·표면 검사 연습';
    const back = document.createElement(embedded ? 'button' : 'a');
    back.textContent = '공방으로 돌아가기';
    if (embedded) {
      back.type = 'button';
      back.addEventListener('click', onExit);
    } else {
      back.setAttribute('href', './game.html' + window.location.search + window.location.hash);
    }
    nav.append(title, back);
    const warning = document.createElement('p');
    warning.className = 'surface-practice-storage';
    warning.hidden = true;
    warning.setAttribute('role', 'status');
    warning.textContent = '브라우저 저장소를 사용할 수 없어 이번 연습은 이 화면에서만 이어집니다.';
    container.append(nav, warning);
    container.insertAdjacentHTML('beforeend', board);
    container.setAttribute('aria-labelledby', title.id);
    return {title,back};
  }
  if (page) {
    const url = new URL(window.location.href);
    if (url.searchParams.get('workshop') === 'new') {
      url.searchParams.set('workshop', crypto.randomUUID());
      window.location.replace(url.href);
      return;
    }
    buildSurface(page, false);
    mountPractice(page);
    return;
  }
  const route = '#surface-practice';
  let addedHistory = false, nav;
  function showPractice(mode=null, opener=trigger) {
    if(roundShell?.open)return false;
    roundShell?.remove();
    if (!shell) {
      shell = document.createElement('dialog');
      shell.className = 'surface-practice-shell';
      shell.id = 'surface-practice';
      nav=buildSurface(shell, true);
      shell.addEventListener('cancel', event => { event.preventDefault(); leavePractice(); });
    }
    if (shell.open) return false;
    if (!shell.isConnected) document.body.append(shell);
    returnTo=opener;
    fromWorkbench=mode!==null;
    nav.title.textContent=fromWorkbench?'미니게임 · 연습용 웨이퍼':'웨이퍼 연마·표면 검사 연습';
    nav.back.textContent=fromWorkbench?'작업대로 돌아가기':'공방으로 돌아가기';
    shell.showModal();
    if (!practice) practice = mountPractice(shell);
    else practice.resume();
    if(fromWorkbench)practice.enter(mode);
    return true;
  }
  function closeRound(continueOrder=false){
    if(!roundShell?.open||!roundOptions)return;
    if(continueOrder && roundShell.dataset.phase!=='success')return;
    const options=roundOptions;
    roundOptions=null;
    roundPractice.pause();
    roundShell.close();
    if(continueOrder && typeof options.onContinue==='function')options.onContinue();
    else if(options.opener?.isConnected && !options.opener.disabled)options.opener.focus({preventScroll:true});
  }
  function openRound(options={}){
    if(shell?.open||roundShell?.open)return false;
    // Both contexts render the original board. Only the active one belongs to the document.
    shell?.remove();
    if(!roundShell){
      roundShell=document.createElement('dialog');
      roundShell.id='surface-round';
      roundShell.className='surface-practice-shell';
      roundNav=buildSurface(roundShell,true,()=>closeRound());
      roundNav.back.dataset.roundClose='';
      roundShell.querySelector('#wp-phase').tabIndex=-1;
      roundContinue=document.createElement('button');
      roundContinue.type='button';roundContinue.id='surface-round-continue';roundContinue.hidden=true;
      roundContinue.addEventListener('click',()=>closeRound(true));
      roundShell.querySelector('.wp-foot').append(roundContinue);
      roundShell.addEventListener('cancel',event=>{event.preventDefault();closeRound();});
    }
    if(!roundShell.isConnected)document.body.append(roundShell);
    roundOptions={...options,opener:options.opener||document.activeElement};
    const paid=typeof options.onContinue==='function';
    const waferNumber=Number.isSafeInteger(options.waferNumber)&&options.waferNumber>0?options.waferNumber:1;
    roundNav.title.textContent=paid?waferNumber+'번 웨이퍼 · 표면 가공':'표면 가공 연습';
    roundNav.back.textContent=paid?'작업대로':options.practiceLabel||'종목 선택으로';
    roundContinue.textContent=paid?options.continueLabel||'연마 시작':roundNav.back.textContent;
    roundShell.showModal();
    if(!roundPractice)roundPractice=mountPractice(roundShell,true);
    roundPractice.startRound(waferNumber);
    return true;
  }
  function dismissPractice() {
    if (!shell?.open) return;
    practice.pause();
    shell.close();
    const fallback=document.getElementById(fromWorkbench?'bench-title':'open-settings');
    const target=returnTo?.isConnected&&!returnTo.disabled&&returnTo.getClientRects().length?returnTo:fallback;
    returnTo=null;fromWorkbench=false;
    target?.focus({preventScroll:true});
  }
  function leavePractice() {
    const hasRoute=!fromWorkbench;
    dismissPractice();
    if (!hasRoute||window.location.hash !== route) return;
    if (addedHistory) {
      addedHistory = false;
      window.history.back();
    } else {
      try { window.history.replaceState(window.history.state, '', window.location.href.split('#')[0]); }
      catch { window.location.hash = ''; }
    }
  }
  trigger.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.location.hash !== route) {
      addedHistory = true;
      window.location.hash = route;
    }
    showPractice();
  });
  function routePractice() {
    if (window.location.hash === route) showPractice();
    else dismissPractice();
  }
  window.addEventListener('hashchange', routePractice);
  window.addEventListener('pagehide',()=>closeRound());
  window.CMPSurfacePractice=Object.freeze({
    openRound,
    closeRound:()=>closeRound(),
    open(mode,opener) {
      if(mode!=='polish'&&mode!=='inspect')return false;
      return showPractice(mode,opener);
    },
    close() {
      if(fromWorkbench)dismissPractice();
    }
  });
  routePractice();
})();
