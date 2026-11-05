(function(){
  'use strict';
  const game=window.CMPFactory,engine=window.CMPDemo,$=id=>document.getElementById(id);
  const saveKey='cmp-factory-campaign-v1',motion=matchMedia('(prefers-reduced-motion: reduce)');
  const format=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
  const counters=CMPCounter.attachDocument(document,format),count=(id,n,d=0)=>counters.set($(id),n,{digits:d});
  let best=[0,0,0,0,0],state=game.create(),view='brief',input=game.settings(),scene=null,sceneTried=false,busy=false,activeProfile=null,readyNotice='',stale=false;
  try{
    const saved=JSON.parse(localStorage.getItem(saveKey)||'null');
    if(saved?.version===game.version){
      if(Array.isArray(saved.best)&&saved.best.length===5&&saved.best.every(n=>Number.isInteger(n)&&n>=0&&n<=3))best=saved.best;
      const restored=game.restore(saved.session);
      if(restored){state=restored;view=state.phase;input=state.rows.at(-1)?.input||game.settings();}
      else readyNotice='저장된 진행을 불러오지 못했습니다.';
    }
  }catch{readyNotice='저장된 진행을 불러오지 못했습니다. 새 주문으로 시작합니다.';}
  if(readyNotice)notice('저장된 진행을 불러오지 못했습니다. 새 주문으로 시작합니다.');
  function notice(message){$('save-warning').hidden=false;$('save-warning').textContent=message;}
  function save(){try{localStorage.setItem(saveKey,JSON.stringify({version:game.version,best,session:JSON.parse(game.serialize(state))}));}catch{notice('브라우저 저장을 사용할 수 없습니다. 현재 탭에서는 진행되지만 닫으면 사라집니다.');}}
  function dispatch(event){if(stale)throw new Error('다른 탭의 최신 진행을 불러오려면 새로고침해주세요.');state=game.transition(state,event);save();}
  function setView(next,focus=true){view=next;render();if(focus){$('game-title').focus({preventScroll:true});scrollTo({top:0,behavior:'auto'});}}
  function readSettings(){input=game.settings(Object.fromEntries(['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'].map(key=>[key,$('g-'+key).value===''?NaN:Number($('g-'+key).value)])));return input;}
  function fillSettings(){for(const k of ['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'])$('g-'+k).value=input[k];}
  function validate(){
    try{readSettings();game.estimate(state,input);const n=Number($('duration').value);if(!$('duration').value||!Number.isInteger(n)||n<30||n>240)throw new Error('연마 시간은 30–240초의 정수로 입력하세요.');$('game-error').hidden=true;$('process').disabled=busy;return true;}
    catch(error){$('game-error').hidden=false;$('game-error').textContent='⚠ '+error.message;$('process').disabled=true;return false;}
  }
  function updateEstimate(){
    if(!validate())return;
    count('known-rate',game.estimate(state,input),2);
    $('time-hint').textContent=`현재 예상 ${game.recommendation(state,input)}초`;
  }
  function qualityText(q){return {good:'규격 안',under:'덜 깎음',over:'너무 깎음'}[q]||'미측정';}
  function renderLog(){
    const rows=game.visibleRows(state);$('wafer-log').replaceChildren();
    for(let i=0;i<6;i++){const row=rows[i],box=document.createElement('div');const label=document.createElement('span'),value=document.createElement('b'),note=document.createElement('small');label.textContent=`WAFER ${String(i+1).padStart(2,'0')}`;value.textContent=row?.removed!=null?format(row.removed,1)+' nm':row?'?':'대기';note.textContent=row?row.measured?qualityText(row.quality):'검사 때 공개':'미가공';box.append(label,value,note);$('wafer-log').append(box);}
  }
  function render(){
    const o=game.orders[state.order],resultView=view==='result',inspection=['inspection','settled'].includes(view);
    $('order-eyebrow').textContent=`ORDER ${String(state.order+1).padStart(2,'0')} / 05 · ${o.title}`;
    const titles={brief:'잘 깎는 것보다,\n딱 맞게 깎는 것.',setup:`${state.rows.length+1}번 웨이퍼, 시간을 정하세요.`,playing:'장비가 연마하고 있어요.',result:'측정할지 결정하세요.',inspection:'결과를 확인하고 납품하세요.',settled:'주문을 마쳤습니다.'};
    $('game-title').textContent=titles[view];$('game-title').style.whiteSpace='pre-line';
    $('game-subtitle').textContent=view==='brief'?'가상의 주문을 맡고, 측정과 시간을 판단해 납품하세요.':`${o.client} · 목표 ${o.target} nm · 허용 오차 ±${o.tolerance}%`;
    count('wafer-count',state.rows.length);count('wallet',state.wallet);
    $('brief-screen').hidden=view!=='brief';$('work-screen').hidden=!['setup','playing'].includes(view);$('result-screen').hidden=!resultView;$('inspection-screen').hidden=!inspection;
    document.querySelectorAll('[data-game-step]').forEach(el=>{if(el.dataset.gameStep===({playing:'setup',settled:'inspection'}[view]||view))el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    if(view==='brief'){
      $('client').textContent=o.client;$('order-name').textContent=o.title;count('target',o.target);$('tolerance').textContent=`허용 오차 ±${o.tolerance}% · ${(o.target*(1-o.tolerance/100)).toFixed(1)}–${(o.target*(1+o.tolerance/100)).toFixed(1)} nm`;$('order-lesson').textContent=o.lesson;
      $('order-picker').replaceChildren();game.orders.forEach((order,i)=>{const b=document.createElement('button');b.type='button';b.disabled=i>0&&best[i-1]<1;const small=document.createElement('small'),strong=document.createElement('strong'),stars=document.createElement('span');small.textContent=`ORDER ${String(i+1).padStart(2,'0')}`;strong.textContent=order.title;stars.textContent=b.disabled?'이전 주문 별 1개 필요':'★'.repeat(best[i])+'☆'.repeat(3-best[i]);b.append(small,strong,stars);if(i===state.order)b.setAttribute('aria-current','true');b.addEventListener('click',()=>newOrder(i));$('order-picker').append(b);});
    }
    if(['setup','playing'].includes(view)){
      $('game-form').hidden=busy;$('animation-status').hidden=!busy;$('machine-state').textContent=busy?'POLISHING · 설명용 재생':'READY';
      counters.set($('wear-value'),state.wear,{digits:0,suffix:'%'});$('wear-value').setAttribute('aria-label',`컨디셔너 사용량 ${format(state.wear,0)}%`);$('wear-meter').value=state.wear;
      counters.set($('pad-value'),state.pad,{digits:0,suffix:'%'});$('pad-meter').value=state.pad;
      $('work-target').textContent=`${o.target} nm ±${o.tolerance}%`;
      $('measurement-age').textContent=state.lastMeasured?`${state.lastMeasured}번 웨이퍼 측정 기준 · ${state.rows.length-state.lastMeasured}장 추가 가공`:'측정 전 · 초기 가정값';
      $('shift-note').textContent=state.servicedSinceMeasure?'교체 후 제거율이 달라졌을 수 있어요. 측정값 갱신을 고려하세요.':state.order===2&&state.rows.length===0?'재시작 직후입니다. 첫 웨이퍼는 제거율이 낮아지는 게임 규칙이 적용됩니다.':`현재 주문: ${o.lesson}`;
      $('service').disabled=busy||state.order===0||state.wallet<o.serviceCost||state.wear===0;$('service').textContent=state.order===0?'컨디셔너 교체 · 다음 주문에서 열림':'컨디셔너 교체 · 30 P';
      $('use-recommendation').disabled=busy;$('process').textContent=`${state.rows.length+1}번 웨이퍼 연마 →`;
      ensureScene();updateEstimate();
    }
    if(resultView){
      const row=game.visibleRows(state).at(-1),measured=row.measured;
      $('result-heading').textContent=`${row.number}번 웨이퍼, 연마 완료.`;$('result-subtitle').textContent=`설정 시간 ${row.duration}초 · 목표 ${o.target} nm`;
      $('hidden-measurement').hidden=measured;$('revealed-measurement').hidden=!measured;
      $('measure').disabled=measured||state.wallet<o.measureCost;$('measure').textContent=measured?'측정 완료 · 5 P 사용':state.wallet<o.measureCost?'측정 자금 부족':'측정하기 · −5 P';
      $('advance').textContent=state.rows.length===o.count?'최종 검사로 이동 →':measured?'측정값으로 다음 장 준비 →':'측정 없이 다음 장 →';
      $('measurement-feedback').textContent=measured?`${qualityText(row.quality)}입니다. 제거율 ${format(row.rate)} nm/min을 다음 예상값에 반영했습니다.`:state.wallet<o.measureCost?'운영 자금이 부족합니다. 측정 없이 진행한 뒤 납품 검사에서 결과를 확인하세요.':'측정 비용은 한 번만 차감됩니다. 측정하지 않아도 다음 장으로 진행할 수 있어요.';
      if(measured){count('measured-removal',row.removed,2);$('quality-badge').textContent=qualityText(row.quality);$('quality-badge').dataset.quality=row.quality;$('measured-error').textContent=`목표 대비 ${row.error>=0?'+':''}${format(row.error)}%`;
        const start=50-o.tolerance*2,end=50+o.tolerance*2;$('result-needle').style.left=`${Math.min(100,Math.max(0,50+row.error*2))}%`;$('result-needle').parentElement.style.background=`linear-gradient(to right,#efdbbc ${start}%,#9ccab0 ${start}%,#9ccab0 ${end}%,#efc7c2 ${end}%)`;}
      renderLog();
    }
    if(inspection){
      const s=game.summary(state),settled=state.phase==='settled';count('good-count',s.good);count('revenue',s.revenue);count('spent',s.spent);$('stars').textContent='★'.repeat(s.stars)+'☆'.repeat(3-s.stars);$('stars').setAttribute('aria-label',`별 ${s.stars}개 / 3개`);
      $('inspection-heading').textContent=settled?'납품을 마쳤습니다.':'여섯 장, 검사 완료.';
      $('inspection-rows').replaceChildren();game.visibleRows(state).forEach(row=>{const tr=document.createElement('tr');for(const val of [`W${String(row.number).padStart(2,'0')}`,`${row.duration} s`,`${format(row.removed)} nm`,`${row.error>=0?'+':''}${format(row.error)}%`,qualityText(row.quality),row.measured?'측정함 · 5 P':'생략']){const td=document.createElement('td');td.textContent=val;tr.append(td);}$('inspection-rows').append(tr);});
      const measured=state.rows.filter(r=>r.measured).length;
      $('debrief').textContent=`6장 중 ${s.good}장이 규격 안에 들어왔고 ${measured}장을 미리 측정했습니다. ${s.good>=5?'측정한 제거율과 시간을 잘 연결했어요.':state.rows.some(r=>r.quality==='under')?'덜 깎인 장은 연마 시간을 늘리거나, 최신 측정값으로 예상 시간을 다시 계산해보세요.':'너무 깎인 장은 연마 시간을 줄여보세요.'} ${o.lesson} 측정은 판단에 도움을 주지만 이후 마모 변화까지 보장하지는 않습니다.`;
      $('ship').hidden=settled;$('next-order').hidden=!settled||state.order===4||best[state.order]<1;$('retry-order').hidden=!settled;
      $('settlement-note').textContent=settled?`정산 완료 · 시작 자금 100 + 납품 ${s.revenue} − 비용 ${s.spent} = ${state.wallet} P. ${s.stars?'다음 주문은 새 자금 100 P로 시작합니다.':'같은 주문에서 3장 이상 규격을 맞추면 다음 주문이 열립니다.'}`:'측정하지 않은 웨이퍼도 최종 검사에서 공개했습니다. 납품 버튼을 누르면 대금이 한 번 지급됩니다.';
    }
    counters.refresh();
  }
  function unavailable(){const host=$('cmp-scene');host.dataset.renderer='unavailable';$('scene-fallback').hidden=false;$('scene-fallback').textContent='3D를 사용할 수 없어 정지 개념도로 표시합니다. 게임은 계속 진행할 수 있습니다.';$('cmp-canvas').hidden=true;$('game-surface').hidden=false;$('game-surface').open=true;host.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);}
  function ensureScene(){if(sceneTried){scene?.resize();return;}sceneTried=true;try{scene=CMPScene.create({host:$('cmp-scene'),canvas:$('cmp-canvas'),fallback:$('scene-fallback'),detail:$('game-surface'),onUnavailable:unavailable});if(!scene)unavailable();}catch{unavailable();}}
  const player=CMPPolish.createPlayer({requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),now:()=>performance.now(),onFrame:frame=>{scene?.setFrame(frame);$('game-progress').value=frame?frame.progress*100:0;},onState:status=>{scene?.setState(status);if(['completed','reduced','stopped'].includes(status)&&busy){busy=false;setView('result');}}});
  function playback(){const row=state.rows.at(-1);busy=true;setView('playing');const calc=engine.calculate(row.input);activeProfile=CMPPolish.profile(row.input,calc,engine.recipes.A456);player.start(activeProfile,{reducedMotion:motion.matches});}
  function newOrder(index){if(stale)return;player.reset();state=game.create(index);input=game.settings();fillSettings();$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;save();setView('brief');}
  $('accept-order').addEventListener('click',()=>setView('setup'));
  $('game-form').addEventListener('submit',event=>{event.preventDefault();if(busy||state.phase!=='setup'||!validate())return;try{dispatch({type:'run',duration:Number($('duration').value),input:readSettings()});playback();}catch(e){$('game-error').hidden=false;$('game-error').textContent=e.message;}});
  $('duration').addEventListener('input',()=>{if(Number.isFinite(Number($('duration').value)))$('duration-slider').value=$('duration').value;validate();});
  $('duration-slider').addEventListener('input',()=>{$('duration').value=$('duration-slider').value;validate();});
  ['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'].forEach(k=>$('g-'+k).addEventListener('input',updateEstimate));
  $('use-recommendation').addEventListener('click',()=>{try{readSettings();$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;updateEstimate();}catch{validate();}});
  $('service').addEventListener('click',()=>{if(busy)return;try{dispatch({type:'service'});render();}catch(e){notice(e.message);}});
  $('measure').addEventListener('click',()=>{try{dispatch({type:'measure'});render();$('advance').focus();}catch(e){notice(e.message);}});
  $('advance').addEventListener('click',()=>{dispatch({type:'advance'});if(state.phase==='setup'){$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;player.reset();}setView(state.phase);});
  $('skip-animation').addEventListener('click',()=>player.cancel());$('replay-game').addEventListener('click',playback);
  $('ship').addEventListener('click',()=>{if(state.phase!=='inspection')return;dispatch({type:'ship'});best[state.order]=Math.max(best[state.order],game.summary(state).stars);save();setView('settled');});
  $('next-order').addEventListener('click',()=>{if(state.phase==='settled'&&best[state.order]>=1&&state.order<4)newOrder(state.order+1);});
  $('retry-order').addEventListener('click',()=>{if(state.phase==='settled')newOrder(state.order);});
  $('export-order').addEventListener('click',()=>{if(!['inspection','settled'].includes(state.phase))return;const header=['model','order','wafer','duration_s','removed_nm_game','error_pct','quality','measured','pressure','wafer_pct','stage_pct','slurry_c_pct'];const rows=game.visibleRows(state).map(r=>[game.version,state.order+1,r.number,r.duration,r.removed,r.error,r.quality,r.measured,r.input.pressure,r.input.wafer_rotation_pct,r.input.stage_rotation_pct,r.input.slurry_c_pct]);const blob=new Blob(['\ufeff'+[header,...rows].map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CMP-game-order-${state.order+1}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('open-help').addEventListener('click',()=>$('game-help').showModal());['close-help','help-done'].forEach(id=>$(id).addEventListener('click',()=>$('game-help').close()));
  document.querySelectorAll('[data-scene-view]').forEach(b=>b.addEventListener('click',()=>scene?.setView(b.dataset.sceneView)));$('scene-cutaway').addEventListener('change',()=>scene?.setCutaway($('scene-cutaway').checked));$('scene-transparent').addEventListener('change',()=>scene?.setTransparent($('scene-transparent').checked));$('scene-zoom-in').addEventListener('click',()=>scene?.zoom(.85));$('scene-zoom-out').addEventListener('click',()=>scene?.zoom(1.15));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy)player.cancel();});motion.addEventListener('change',()=>{if(motion.matches&&busy)player.start(activeProfile,{reducedMotion:true});});window.addEventListener('pagehide',e=>{if(!e.persisted)scene?.dispose();});
  // A second tab must never silently overwrite a more recent campaign.
  window.addEventListener('storage',e=>{if(e.key===saveKey){stale=true;if(busy)player.cancel();notice('다른 탭에서 게임이 변경되었습니다. 이 탭을 새로고침해 최신 진행을 불러오세요.');document.querySelectorAll('#factory-main button,#factory-main input').forEach(el=>el.disabled=true);}});
  fillSettings();$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;render();
})();
