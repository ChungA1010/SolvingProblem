(function(){
  'use strict';
  const api=window.CMPWorkbench,$=id=>document.getElementById(id),lab=$('page-lab');
  let mode='experiment',selected=null,playing=false,timer=null,tourStep=0;
  const toolbar=document.createElement('section');toolbar.className='workbench-toolbar';
  toolbar.innerHTML='<div class="workbench-tabs" role="tablist" aria-label="운영 실험실 작업"><button id="wb-experiment" type="button" role="tab" aria-selected="true" aria-controls="wb-experiment-panel">조건 실험</button><button id="wb-replay" type="button" role="tab" aria-selected="false" aria-controls="wb-replay-panel" tabindex="-1">기록 리플레이</button></div><div class="workbench-tools"><button id="wb-tasks" type="button">학습 과제</button><button id="wb-basis" type="button">계산 근거</button><button id="wb-guide" type="button">시작 안내</button></div>';
  lab.prepend(toolbar);
  const experiment=document.createElement('div');experiment.id='wb-experiment-panel';experiment.setAttribute('role','tabpanel');experiment.setAttribute('aria-labelledby','wb-experiment');
  lab.querySelector('.panel-grid').before(experiment);experiment.append($('learning-panel'),lab.querySelector('.panel-grid'),$('comparison-panel'));
  $('learning-panel').hidden=true;
  const replay=document.createElement('section');replay.id='wb-replay-panel';replay.className='card replay-workspace';replay.hidden=true;replay.setAttribute('role','tabpanel');replay.setAttribute('aria-labelledby','wb-replay');
  replay.innerHTML='<div class="replay-heading"><div><p class="workbench-eyebrow">OPERATION REPLAY</p><h2>기록에서 변화의 이유 찾기</h2><p>이 브라우저에 저장된 최근 20건 · 같은 레시피와 계산 모델만 이어봅니다.</p></div><a href="#history" class="text-button">비교·전체 기록 ↗</a></div><div class="replay-controls"><label>레시피 / 계산 모델<select id="wb-filter" class="field"></select></label><button id="wb-play" class="primary-button" type="button">순서대로 재생</button><button id="wb-stop" class="quiet-button" type="button" hidden>중지</button></div><p id="wb-empty" class="info-note" hidden>저장된 실험이 없습니다. 조건 실험에서 계산을 실행하면 여기에 나타납니다.</p><div id="wb-series"><svg id="wb-chart" viewBox="0 0 800 200" role="img" aria-label="저장된 실험의 계산 MRR 추이"></svg><p class="replay-chart-note">세로: 계산 MRR · 가로: 저장 순서 · 실측 추이 또는 장비의 연속 운전 데이터가 아닙니다.</p><div id="wb-snapshot" class="replay-snapshot" role="status"></div><div id="wb-rows" class="replay-rows" aria-label="재생할 실험 선택"></div></div><p class="replay-caution">리플레이는 저장된 조건과 3D 시연을 다시 보여줍니다. 측정 업데이트·EWMA·마모 보정은 구현된 모델로 검증되지 않아 적용하지 않습니다.</p>';
  experiment.after(replay);
  const basis=document.createElement('dialog');basis.id='wb-basis-dialog';basis.className='workbench-dialog';basis.innerHTML='<button class="wb-close" aria-label="계산 근거 닫기">×</button><p class="workbench-eyebrow">MODEL NOTES</p><h2>무엇을 계산하고 있나요?</h2><h3>현재 연결된 계산</h3><p>기준 MRR에 압력 비율의 0.682승을 곱하는 기존 수식입니다. 교육용 다변수를 켜면 Wafer 회전의 0.25승, Stage 회전의 0.40승과 Slurry C 포화 계수를 추가합니다.</p><code>MRR = 기준 MRR × (P/P₀)^0.682<br>다변수 추가: (W/100)^0.25 × (S/100)^0.40 × 2q/(1+q)<br>q = Slurry C / 100</code><h3>입력 근거 등급과 정확도는 다릅니다.</h3><p>A·B·C는 압력 범위와 최근 측정 후 경과 수를 구분합니다. 예측 오차·확률·신뢰구간이 아닙니다. 회전·유량의 상대값은 교육용 가정입니다.</p><h3>아직 연결되지 않은 모델</h3><p>시안의 kp_model.py와 MachineState(EWMA) 원본 및 검증 결과가 제공되지 않았습니다. 따라서 MAE·90% 신뢰구간·마모 보정 성능을 표시하지 않습니다. 게임의 마모와 측정 규칙은 전문가용 계산에 들어가지 않습니다.</p><a href="#guide" id="wb-full-guide" class="primary-button">전체 계산 안내 보기 →</a>';
  const tutorial=document.createElement('dialog');tutorial.id='wb-tutorial';tutorial.className='workbench-dialog';tutorial.innerHTML='<button class="wb-close" aria-label="시작 안내 닫기">×</button><p id="wb-tour-index" class="workbench-eyebrow"></p><h2 id="wb-tour-title"></h2><p id="wb-tour-copy"></p><div class="wb-tour-map"><span>조건 설정</span><i>→</i><span>실행·관찰</span><i>→</i><span>기록·해석</span></div><div class="wb-tour-actions"><button id="wb-tour-show" type="button" class="primary-button">해당 화면 살펴보기</button><button id="wb-tour-next" type="button" class="quiet-button">다음 안내 →</button></div><p class="replay-caution">언제든 닫고 자유롭게 실험하세요. 상단의 ‘시작 안내’로 다시 열 수 있습니다.</p>';
  document.body.append(basis,tutorial);
  const svgNS='http://www.w3.org/2000/svg';
  const filters=()=>[...new Set(api.records().map(r=>`${r.input.recipe}|${CMPDemo.modelId(r.input)}`))];
  const rows=()=>api.records().filter(r=>`${r.input.recipe}|${CMPDemo.modelId(r.input)}`===$('wb-filter').value).reverse();
  function stop(cancel=true){clearTimeout(timer);timer=null;playing=false;$('wb-stop').hidden=true;$('wb-play').disabled=!rows().length;if(cancel)api.stop();}
  function changeMode(next,focus=false){stop();mode=next;experiment.hidden=mode!=='experiment';replay.hidden=mode!=='replay';['experiment','replay'].forEach(m=>{$('wb-'+m).setAttribute('aria-selected',String(m===mode));$('wb-'+m).tabIndex=m===mode?0:-1;});if(mode==='replay')refresh();if(focus)$('wb-'+mode).focus();}
  function drawChart(list){
    const chart=$('wb-chart');chart.replaceChildren();if(!list.length)return;
    const low=Math.min(...list.map(r=>r.result.mrr)),high=Math.max(...list.map(r=>r.result.mrr)),pad=Math.max((high-low)*.15,1),min=Math.max(0,low-pad),max=high+pad;
    if(!Number.isFinite(max)||max<=min){const t=document.createElementNS(svgNS,'text');t.setAttribute('x','20');t.setAttribute('y','90');t.textContent='값이 너무 크거나 차이가 작아 그래프를 표시할 수 없습니다. 아래 기록의 값을 확인하세요.';chart.append(t);return;}
    const point=(r,i)=>({x:62+(list.length===1?.5:i/(list.length-1))*710,y:165-(r.result.mrr-min)/(max-min)*140});
    const add=(tag,attrs,text)=>{const n=document.createElementNS(svgNS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;chart.append(n);return n;};
    for(let i=0;i<3;i++){const y=25+i*70;add('path',{d:`M62 ${y}H778`,stroke:'#dce4f0','stroke-dasharray':'3 5'});add('text',{x:8,y:y+4,fill:'#64748b','font-size':11},(max-i*(max-min)/2).toFixed(2));}
    add('path',{d:list.map((r,i)=>{const p=point(r,i);return `${i?'L':'M'}${p.x} ${p.y}`;}).join(' '),fill:'none',stroke:'#0d6efd','stroke-width':2.5});
    list.forEach((r,i)=>{const p=point(r,i);add('circle',{cx:p.x,cy:p.y,r:r.id===selected?6:4,fill:r.id===selected?'#f97316':'#0d6efd',stroke:'white','stroke-width':2});add('text',{x:p.x,y:190,'text-anchor':'middle',fill:'#64748b','font-size':10},String(i+1));});
  }
  function selectRecord(id,play=false){
    const list=rows(),row=list.find(r=>r.id===id);if(!row)return;selected=id;api.replay(id,play);
    $('wb-snapshot').textContent=`${row.input.recipe} · ${new Date(row.at).toLocaleString('ko-KR')} · Main outer ${row.input.pressure===null?'미사용':row.input.pressure.toFixed(3)} · MRR ${row.result.mrr.toFixed(2)} · 환산 ${row.result.time===null?'—':row.result.time.toFixed(2)} s`;
    document.querySelectorAll('[data-replay-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.replayId===id)));drawChart(list);
  }
  function refresh(){
    const previous=$('wb-filter').value,options=filters();$('wb-filter').replaceChildren();for(const key of options){const o=document.createElement('option');o.value=key;o.textContent=key.replace('|',' / ').replace('pressure-v1','압력 수식').replace('edu-multi-v1','교육용 다변수');$('wb-filter').append(o);}if(options.includes(previous))$('wb-filter').value=previous;
    const list=rows();$('wb-empty').hidden=!!list.length;$('wb-series').hidden=!list.length;$('wb-filter').disabled=!list.length;$('wb-play').disabled=playing||!list.length;
    $('wb-rows').replaceChildren();list.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.dataset.replayId=r.id;b.textContent=`${String(i+1).padStart(2,'0')} · ${r.result.mrr.toFixed(2)}`;b.setAttribute('aria-label',`${i+1}번 실험, MRR ${r.result.mrr.toFixed(2)} 재생`);b.addEventListener('click',()=>{stop();selectRecord(r.id,true);});$('wb-rows').append(b);});
    if(list.length){selected=list.some(r=>r.id===selected)?selected:list[0].id;drawChart(list);const row=list.find(r=>r.id===selected);$('wb-snapshot').textContent=`${list.length}건 준비됨 · 번호를 누르면 해당 실험을 재생합니다. 선택 MRR ${row.result.mrr.toFixed(2)}`;}else selected=null;
  }
  function sequence(index){if(!playing)return;const list=rows();if(index>=list.length){stop(false);return;}selectRecord(list[index].id,true);timer=setTimeout(()=>sequence(index+1),6500);}
  $('wb-play').addEventListener('click',()=>{stop();playing=true;$('wb-play').disabled=true;$('wb-stop').hidden=false;sequence(0);});$('wb-stop').addEventListener('click',stop);
  $('wb-filter').addEventListener('change',()=>{stop();selected=null;refresh();});
  ['experiment','replay'].forEach(m=>$('wb-'+m).addEventListener('click',()=>changeMode(m)));
  toolbar.querySelector('[role=tablist]').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();changeMode(e.key==='Home'?'experiment':e.key==='End'?'replay':mode==='experiment'?'replay':'experiment',true);}});
  $('wb-tasks').addEventListener('click',()=>{changeMode('experiment');api.openTasks();});$('wb-basis').addEventListener('click',()=>basis.showModal());$('wb-full-guide').addEventListener('click',()=>basis.close());
  [basis,tutorial].forEach(d=>d.querySelector('.wb-close').addEventListener('click',()=>d.close()));
  const tour=[['조건을 한 가지씩 바꿔보세요.','레시피와 기준 MRR을 고르고, Main outer 압력을 조절하세요. 회전·Slurry까지 보고 싶다면 교육용 다변수를 켤 수 있습니다.'],['실행한 뒤 결과와 접촉면을 보세요.','계산 실행은 기록을 한 건 저장합니다. MRR·환산 시간과 결과 해설을 확인하고, 3D 부품에 마우스를 올려 역할을 살펴보세요.'],['같은 조건끼리 다시 보고 비교하세요.','기록 리플레이에서 같은 레시피·모델의 실험을 재생합니다. 전체 기록에서는 두 건을 선택해 비교하고, 계산 근거에서 가정과 한계를 확인하세요.']];
  function showTour(){const [title,copy]=tour[tourStep];$('wb-tour-index').textContent=`QUICK START · ${tourStep+1} / 3`;$('wb-tour-title').textContent=title;$('wb-tour-copy').textContent=copy;$('wb-tour-next').textContent=tourStep===2?'안내 마치기':'다음 안내 →';if(!tutorial.open)tutorial.showModal();try{localStorage.setItem('cmp-workbench-tour-v1','seen');}catch{}}
  $('wb-guide').addEventListener('click',()=>{tourStep=0;showTour();});$('wb-tour-next').addEventListener('click',()=>{if(tourStep===2)tutorial.close();else{tourStep++;showTour();}});
  $('wb-tour-show').addEventListener('click',()=>{tutorial.close();changeMode(tourStep===2?'replay':'experiment');const target=tourStep===0?$('recent-mrr'):tourStep===1?$('run-button'):$('wb-filter');target.focus();target.scrollIntoView({block:'center'});});
  function navigation(page){if(page!=='lab'){stop();return;}changeMode('experiment');try{if(!localStorage.getItem('cmp-workbench-tour-v1'))showTour();}catch{}}
  document.addEventListener('cmp:navigate',e=>navigation(e.detail.page));document.addEventListener('cmp:history',()=>{if(mode==='replay')refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});window.addEventListener('pagehide',stop);
  if(location.hash==='#lab')navigation('lab');
})();
