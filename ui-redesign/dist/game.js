(function(){
  'use strict';
  const campaign=window.CMPCampaign;
  const game=window.CMPFactory,story=window.CMPCustomers,engine=window.CMPDemo,$=id=>document.getElementById(id);
  const saveKey='cmp-factory-campaign-v1',motion=matchMedia('(prefers-reduced-motion: reduce)');
  const format=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'—';
  const counters=CMPCounter.attachDocument(document,format),count=(id,n,d=0)=>counters.set($(id),n,{digits:d,immediate:['revenue','spent'].includes(id)});
  let best=story.restoreBest(),state=game.create(),view='brief',input=game.settings(),scene=null,sceneTried=false,busy=false,activeProfile=null,readyNotice='',stale=false;
  let growth=CMPUpgrades.create(),upgradeUI=null;
  const customersPerDay=3;
  let closedRunId=null,readingTimer=null,exitTimer=null,lastLine='';
  let completed=[],runId=crypto.randomUUID(),inspectionTimer=null,asked=[],accepted=false;
  let speechText='',speechLast=false,lastPresentation=null,observedPhase=null;
  let handlingLearned=false,rackResume='feed';
  const displayedRow=()=>state.rows[(state.recalled||state.rows.length)-1];
  let tutorial={dismissed:false,completed:false,applied:false};
  let replaying=false,focusMode=true,measuring=false,transferMode='idle',transferFrame=null;
  const shop=CMPShop.create({onChange:frame=>{
    $('customer-stage').dataset.phase=frame.phase;
    if(!frame.visible)return;
    speechLast=frame.last;
    $('shop-dialogue').textContent=frame.lines[frame.index];
    $('dialogue-position').textContent=`${frame.index+1} / ${frame.lines.length}`;
    const closingLine=view==='settled' && frame.last;
    $('dialogue-next').textContent=frame.phase!=='talking'?'대화 바로 보기 →':closingLine?'인사 마치기 →':frame.last?'다시 듣기 ↺':'계속 듣기 →';
    lastLine=frame.lines[frame.index];
    if(closingLine)scheduleDeparture();
  }});
  try{
    const saved=JSON.parse(localStorage.getItem(saveKey)||'null');
    if([game.version,game.legacyVersion].includes(saved?.version)){
      best=story.restoreBest(saved.best);
      const restored=game.restore(saved.session);
      if(restored){state=restored;accepted=saved.orderAccepted!==false||state.events.length>0;view=accepted?state.phase:'brief';
        if(accepted && state.phase==='setup' && saved.loadedWafer!==state.rows.length+1)view='feed';
        if(saved.station==='handover' && state.phase==='inspection' && game.inspectionDone(state))view='handover';if(state.recalled){
          rackResume=state.phase==='result'?'result':saved.rackResume==='setup'?'setup':'feed';
          view='result';
        }
        input=state.rows.at(-1)?.input||game.settings();asked=story.restoreDialogue(saved.dialogue,state.order);}
      else{stale=true;readyNotice='저장된 진행을 확인하지 못해 멈췄어요. 저장 원본은 유지됩니다.';}
      if(typeof saved.runId==='string'&&/^[\w-]{1,100}$/.test(saved.runId))runId=saved.runId;
      completed=game.restoreArchive(saved.completed);
      if(state.phase==='settled' && saved.closedRunId===runId)closedRunId=runId;
      if(saved.tutorial&&typeof saved.tutorial==='object')tutorial={dismissed:saved.tutorial.dismissed===true,completed:saved.tutorial.completed===true,applied:saved.tutorial.applied===true};
      if(completed.some(e=>e.session.order===0)||(state.order>0&&state.order<story.campaignCount)||(state.order===0&&state.rows.length>1))tutorial.completed=true;
      handlingLearned=saved.handlingLearned===true||completed.length>0||state.events.some(e=>e.type==='advance'||e.type==='discard');
      if(saved.workshop){const restoredGrowth=CMPUpgrades.restore(saved.workshop);if(restoredGrowth)growth=restoredGrowth;else{stale=true;readyNotice='공방 자금 기록을 확인하지 못해 진행을 멈췄어요. 저장 원본은 유지됩니다.';}}
    }
  }catch{stale=true;readyNotice='저장된 진행을 확인하지 못해 멈췄어요. 저장 원본은 유지됩니다.';}
  growth=campaign.initialize(growth);
  if(!accepted)state=game.createFunded(state.order,growth.levels,growth.balance);
  if(readyNotice)notice(readyNotice);
  function notice(message){$('save-warning').hidden=false;$('save-warning').textContent=message;}
  function save(){if(stale)return false;try{localStorage.setItem(saveKey,JSON.stringify({version:game.version,best,runId,closedRunId,completed,tutorial,handlingLearned,workshop:CMPUpgrades.serialize(growth),orderAccepted:accepted,rackResume,station:view,loadedWafer:view==='setup'?state.rows.length+1:null,dialogue:story.serializeDialogue(asked,state.order),session:JSON.parse(game.serialize(state))}));return true;}catch{notice('브라우저 저장을 사용할 수 없습니다. 현재 탭에서는 진행되지만 닫으면 사라집니다.');return false;}}
  function dispatch(event){if(stale)throw new Error('다른 탭의 최신 진행을 불러오려면 새로고침해주세요.');const next=game.transition(state,event);const nextGrowth=campaign.sync(growth,runId,next);state=next;growth=nextGrowth;if(['advance','discard'].includes(event.type))handlingLearned=true;if(event.type==='run'&&state.order===0&&state.rows.length>=2)tutorial.completed=true;if(event.type==='ship'){best[state.order]=Math.max(best[state.order],game.summary(state).stars);completed=game.archiveSettlement(completed,runId,new Date().toISOString(),state);creditSettlement(runId,state);}save();}
  function creditSettlement(id,session){growth=campaign.sync(growth,id,session);}
  function applyGrowthLook(){document.body.dataset.decor=growth.theme;scene?.setAppearance(CMPUpgrades.appearance(growth));}
  function renderGrowth(){const current=game.equipment(state),effect=CMPUpgrades.effects(current);$('bench-equipment-info').textContent=`이번 주문: 패드 ${current.pad} · 컨디셔너 ${current.care} · 종점 ${current.endpoint} · 환경 ${current.environment}단계 / 교육용 수치${CMPUpgrades.same(current,growth.levels)?'':' · 새 장비는 다음 주문부터'}`;$('equipment-applied').textContent=`패드 ${current.pad} · 컨디셔너 ${current.care} · 종점 ${current.endpoint}${CMPUpgrades.same(current,growth.levels)?'':' · 새 장비 적용 대기'}`;applyGrowthLook();if($('upgrade-dialog').open)upgradeUI?.render();}
  function commitUpgrade(event){if(stale)throw new Error('다른 탭의 진행을 불러오려면 새로고침해주세요.');let next=CMPUpgrades.transition(growth,event);if(event.type==='buy'&&CMPUpgrades.themes.some(t=>t.id===event.id))next=CMPUpgrades.transition(next,{type:'equip',id:event.id});growth=next;const saved=save();renderGrowth();renderAccount();return saved;}
  function setView(next,focus=true){transfers.reset();view=next;render();if(focus){(document.body.dataset.place==='counter'?$('shop-dialogue'):document.body.dataset.benchFocus==='true'?$('bench-title'):$('game-title')).focus({preventScroll:true});$('work-screen').scrollTo({top:0,behavior:'auto'});scrollTo({top:0,behavior:'auto'});}}
  function readSettings(){input=game.settings(Object.fromEntries(['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'].map(key=>[key,$('g-'+key).value===''?NaN:Number($('g-'+key).value)])));return input;}
  function fillSettings(){for(const k of ['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct']){$('g-'+k).value=input[k];$('g-'+k+'-slider').value=input[k];}}
  function cashBalance(){return accepted&&state.version!==game.fundedVersion&&state.phase!=='settled'?state.wallet:growth.balance;}
  function ledger(host,rows){host.replaceChildren();for(const [label,value] of rows){const term=document.createElement('dt'),amount=document.createElement('dd');term.textContent=label;amount.textContent=value;host.append(term,amount);}}
  function renderAccount(){
    const shift=businessDay(),day=campaign.dailySummary(growth,shift.day);
    $('daily-shift').textContent=`영업 ${shift.day}일 · ${shift.slot}/3`;
    $('daily-balance').textContent=`${cashBalance()} P`;
    $('request-support').hidden=accepted||view!=='brief'||!campaign.canSupport(growth,runId);
    $('request-support').disabled=stale;
    $('request-support').textContent=`재료 지원 받기 · +${100-growth.balance} P`;
    $('cost-info').hidden=view!=='setup';
    ledger($('daily-ledger'),[['시작 잔액',day.opening+' P'],['납품 수입','+'+day.revenue+' P'],['가공·측정·정비','−'+day.costs+' P'],['장비·꾸미기','−'+day.purchases+' P'],['운영금·지원','+'+(day.initial+day.support)+' P'],...(day.legacyIncome?[['이전 주문 정산','+'+day.legacyIncome+' P']]:[]),['현재 잔액',growth.balance+' P']]);
  }
  function renderQuote(){
    const quote=game.processingQuote(state,input,Number($('duration').value));
    $('process-cost').textContent=quote.total?`−${quote.total} P`:'';
    $('process').setAttribute('aria-label',`${state.rows.length+1}번 웨이퍼 연마 시작 · −${quote.total} P`);
    ledger($('cost-ledger'),[['기본',quote.base+' P'],['설정 시간',quote.time+' P'],['압력',quote.pressure+' P'],['회전',quote.rotation+' P'],['Slurry C',quote.slurry+' P'],['합계',quote.total+' P']]);
    return quote;
  }
  function validate(){
    try{readSettings();CMPWorkshop.preview(state,input,$('duration').value===''?NaN:Number($('duration').value));const q=renderQuote();$('return-blank').hidden=q.total<=state.wallet;if(q.total>state.wallet)throw new Error(`가공비 ${q.total} P · ${q.total-state.wallet} P 부족해요. 조건을 낮추거나 원판을 돌려놓으세요.`);$('game-error').hidden=true;$('process').disabled=busy||stale;return true;}
    catch(error){$('game-error').hidden=false;$('game-error').textContent='⚠ '+error.message;$('process').disabled=true;count('known-rate',null);count('expected-removal',null);$('estimate-difference').textContent='입력 범위를 확인하면 예상값이 표시됩니다.';$('time-formula').textContent='유효한 조건을 입력해주세요.';$('time-hint').textContent='입력 확인 필요';return false;}
  }
  function updateEstimate(){
    if(busy)return;renderEndpoint();renderDock();$('return-blank').hidden=true;if(!validate())return;
    const p=CMPWorkshop.preview(state,input,Number($('duration').value));
    const autoStop=game.endpointStatus(state,input).ready&&$('endpoint-enabled').checked;
    $('expected-removal-label').textContent=autoStop?'시간 기준 제거량':'예상 제거량';
    document.querySelector('.estimate-disclaimer').textContent=autoStop?'자동 정지 전 예상 · 측정으로 확인':'예상값 · 측정으로 확인';
    count('known-rate',p.rate,2);counters.set($('expected-removal'),p.removal,{digits:2,immediate:true});
    $('estimate-difference').textContent=`목표 대비 ${p.delta>=0?'+':''}${format(p.delta)} nm (${p.deltaPct>=0?'+':''}${format(p.deltaPct,1)}%)`;
    $('time-hint').textContent=p.limited?`입력 한도 적용 · ${p.recommendation}초`:`예상 ${p.recommendation}초`;
    $('time-formula').textContent=`${p.target} ÷ ${format(p.rate,2)} × 60 ≈ ${format(p.rawSeconds,1)}초${p.limited?' · 입력 범위로 제한됩니다.':' · 정수 초로 적용합니다.'}`;
  }
  function renderEndpoint(){
    const equipment=game.equipment(state),status=game.endpointStatus(state,readSettings()),on=$('endpoint-enabled').checked;
    $('endpoint-control').hidden=!equipment.endpoint;$('endpoint-enabled').disabled=busy||!equipment.endpoint;
    $('endpoint-control').dataset.ready=String(status.ready&&on);
    $('endpoint-status').textContent=on?status.reason:'수동 시간 모드';
    const correction=game.actions(state).remaining===0?'추가 행동 소진 · 시간을 직접 맞춰주세요.':'측정 5 P + 행동 1회로 보정.';
    $('endpoint-hint').textContent=game.usesCalibration(state)?(status.ready&&on?`설정 시간 내 자동 정지 · 보정 후 ${status.limit}장까지 · 오차·마모 영향 남음`:`${on?'자동 정지 대기 · ':''}설정 시간만큼 연마해요. ${correction}`):'이전 도전 규칙 유지 · 설정 시간 내 자동 정지';
  }
  function renderDock(){
    const status=game.endpointStatus(state,input),o=game.orders[state.order];
    $('dock-target').textContent=`W${state.rows.length+1} / 6 · 목표 ${o.target} nm ±${o.tolerance}%`;
    $('dock-time').textContent=`설정 ${$('duration').value||'—'}초`;
    $('dock-mode').textContent=game.equipment(state).endpoint&&$('endpoint-enabled').checked?(status.ready?`자동 정지 · ${status.remaining===null?'이전 규칙':status.remaining+'장 남음'}`:`시간 연마 · ${status.reason}`):'시간만큼 연마';
  }
  function renderTutorial(){
    const t=CMPGuidance.tutorial(state,tutorial),visible=accepted&&['setup','result'].includes(view)&&!measuring&&!!t&&!state.recalled;
    $('bench-guide').hidden=!visible;
    if(!visible && $('first-order-guide').matches(':popover-open'))$('first-order-guide').hidePopover();
    $('first-order-guide').hidden=!visible;document.querySelectorAll('[data-guide-target]').forEach(el=>delete el.dataset.guideTarget);
    $('restart-guide').hidden=state.order!==0||state.rows.length>1;
    if(!visible)return;
    $('guide-step').textContent=`첫 주문 실습 · ${t.step} / 3`;$('guide-title').textContent=t.title;$('guide-copy').textContent=t.copy;
    document.querySelectorAll('[data-guide-step]').forEach(el=>el.dataset.current=String(Number(el.dataset.guideStep)===t.step));
    $(t.action).dataset.guideTarget='true';$('guide-focus').textContent={duration:'시간 확인 ↓',measure:'측정기로 ↓',advance:'보관 슬롯으로 ↓',process:'연마 시작으로 ↓','use-recommendation':'예상 시간 적용으로 ↓'}[t.action];
  }
  function qualityText(q){return {good:'규격 안',under:'덜 깎음',over:'너무 깎음'}[q]||'미측정';}
  function customerIdentity(prefix,profile){$(prefix+'-portrait').src=['lee','jensen'].includes(profile.id)?CMPShop.artwork(profile.id).src:`./media/customer-${profile.id}.svg`;$(prefix+'-name').textContent=profile.name;$(prefix+'-role').textContent=profile.role;}
  function renderDialogue(){
    const c=story.contract(state.order);customerIdentity('customer',c.profile);
    $('customer-visit').textContent=c.returning?'다시 찾아온 고객':'새로운 고객';$('customer-focus').textContent=c.profile.focus;
    $('customer-opening').textContent=c.opening;$('customer-goal').textContent=story.goalLabel(state.order);
    $('customer-goal-note').textContent='규격 충족 + 목표 달성 시 배지';
    $('order-thread').textContent=`${c.profile.name} · ${c.purpose}`;
    const host=$('customer-questions');host.replaceChildren();
    for(const q of story.questionList){const b=document.createElement('button');b.type='button';b.className='customer-question';b.textContent=q.label;b.dataset.question=q.id;b.setAttribute('aria-controls','shop-dialogue');b.setAttribute('aria-pressed',String(asked.at(-1)===q.id));b.dataset.read=String(asked.includes(q.id));b.addEventListener('click',()=>{if(stale)return;asked=story.ask(asked.filter(id=>id!==q.id),q.id);save();renderDialogue();speechText=story.answer(state.order,q.id);shop.say(speechText);$('customer-questions').querySelector(`[data-question="${q.id}"]`).focus({preventScroll:true});});host.append(b);}
    const key=asked.at(-1);$('customer-answer').hidden=!key;$('customer-question-echo').textContent=story.questionList.find(q=>q.id===key)?.label||'';$('customer-answer-text').textContent=key?story.answer(state.order,key):'';
    $('customer-talk-note').textContent='';
  }
  function renderShop(){
    const handingOver=view==='handover', delivered=view==='settled', visible=['brief','handover','settled'].includes(view), c=story.contract(state.order),o=c.order;
    $('customer-stage').dataset.handover=String(handingOver);
    $('shipping-carrier').hidden=!handingOver;
    const shipmentCount=game.lotRows(state).length;
    $('deliver-to-guest').hidden=!handingOver;
    $('deliver-to-guest').setAttribute('aria-label',c.profile.name+'에게 건네기');
    $('received-shipper').hidden=!(delivered&&shipmentCount>0);
    if(handingOver){
      $('shipping-carrier').querySelector('[data-pickup]').setAttribute('aria-label',`납품 상자 · ${c.profile.name} 님 · ${shipmentCount}장`);
    }
    const closingVisit=delivered && businessDay().slot===customersPerDay;
    $('invite-guest').hidden=!visible||handingOver||closingVisit;
    const last=completed.at(-1);
    $('counter-history').hidden=!last||!visible||handingOver||closingVisit;
    if(last && visible){
      const previous=game.restore(last.session),summary=game.summary(previous);
      $('previous-receipt').textContent=`${story.contract(previous.order).profile.name} · 규격 안 ${summary.good}/${summary.total}장 · ${previous.version===game.fundedVersion?'순이익 '+(summary.revenue>=summary.spent?'+':'')+(summary.revenue-summary.spent):'이전 기금 +'+Math.max(0,summary.revenue-summary.spent)} P`;
    }
    const settingsButton=$('open-settings');
    const benchMenu=document.querySelector('.bench-menu');
    const atBench=document.body.dataset.atWorkbench==='true';
    if(atBench && settingsButton.parentElement!==benchMenu)benchMenu.append(settingsButton);
    if(!atBench && settingsButton.parentElement!==document.body)$('factory-main').before(settingsButton);
    const report=$('inspection-screen');
    if(delivered && report.parentElement!==$('settled-records'))$('settled-records').append(report);
    if(!delivered && report.parentElement===$('settled-records'))$('inspection-anchor').after(report);
    const shift=businessDay();
    $('settings-shift').textContent=`영업 ${shift.day}일차 · 손님 ${shift.slot}/${customersPerDay} · 운영 자금 ${cashBalance()} P`;
    document.body.dataset.place=visible?'counter':'workbench';
    $('customer-stage').hidden=!visible;$('shop-brief-dialogue').hidden=view!=='brief';
    if(lastPresentation!==view){
      $('customer-stage').dataset.receiving=String(delivered&&lastPresentation==='handover');$('inspection-records').open=!delivered;$('inspection-debrief').open=view==='inspection';lastPresentation=view;}
    if(!visible){shop.leave();return;}
    const feedback=delivered?story.reaction(state):null;
    $('customer-stage').dataset.delivered=String(delivered);$('customer-stage').dataset.mood=feedback?.mood||'neutral';
    const art=CMPShop.artwork(c.profile.id,feedback?.mood);
    $('shop-figure').style.backgroundImage=`url("${art.src}")`;
    $('shop-figure').style.backgroundPosition=art.position;
    $('shop-figure').setAttribute('aria-label',`${c.profile.name} · ${art.label} 표정`);
    $('shop-speaker-name').textContent=c.profile.name;$('shop-speaker-role').textContent=c.profile.role;
    $('shop-visit-label').textContent=handingOver?'납품 대기':delivered?'납품 확인':o.guest?'초대 손님':c.returning?'다시 온 손님':'첫 방문';
    $('shop-arrival').textContent=handingOver?'손님이 상자를 기다려요.':delivered?`납품 대금 +${game.summary(state).revenue} P`:`딩동! ${c.profile.name}님이 찾아왔어요.`;
    $('accept-order').closest('.counter-accept').hidden=delivered;
    $('slip-spec').replaceChildren(document.createTextNode(`${o.target} nm `));const unit=document.createElement('small');unit.textContent=`±${o.tolerance}% · ${delivered?game.lotRows(state).length+'장 납품':'원판 6장'}`;$('slip-spec').append(unit);
    $('slip-client').textContent=`${c.profile.name}의 ${o.guest?'특별':c.returning?'후속':'첫'} 의뢰 · ${delivered?'납품 완료':'주문 확인'}`;
    if(handingOver){
      speechText='그 상자, 이쪽으로 건네주시겠어요?';
    }else if(delivered && shipmentCount){
      const good=game.summary(state).good;
      const quantity=['','한 장','두 장','세 장','네 장','다섯 장','여섯 장'];
      const receipt=good===shipmentCount?(good===1?'상자 잘 받았어요, 이 한 장은 규격에 딱 맞네요.':`상자 잘 받았어요, ${quantity[good]} 모두 규격에 맞네요.`):
        good?`상자 잘 받았어요, ${quantity[shipmentCount]} 중 ${quantity[good]}을 실험에 쓸 수 있겠네요.`:
        `상자 잘 받았어요, 이번 ${quantity[shipmentCount]}은 규격을 벗어났네요.`;
      speechText=[receipt,...CMPShop.lines(feedback.message).slice(1)].join(' ');
    }else{
      speechText=delivered?feedback.message:asked.length?story.answer(state.order,asked.at(-1)):c.opening;
    }
    shop.enter({id:`${runId}:${view}`,text:speechText,delivery:delivered,mood:feedback?.mood,reduced:motion.matches||document.hidden||handingOver||delivered});
  }
  function renderCustomerContext(){
    const c=story.contract(state.order),o=c.order;$('active-customer').hidden=view==='brief';
    $('active-customer-summary').textContent=`${c.profile.name} · ${c.profile.focus} · 주문서 다시 보기`;
    $('active-customer-spec').textContent=`용도: ${c.purpose} · ${o.target} nm ±${o.tolerance}% · ${o.guest?'가상 특별 의뢰 · 여섯 장 납품':'6장 중 3장 이상 규격 충족 후 납품하면 다음 의뢰 해제'}`;
    $('active-customer-goal').textContent=`고객 추가 목표: ${story.goalLabel(state.order)}. ${c.metric==='time'?'장비가 연마한 게임 시간을 합산합니다. 종점 정지 시 단축된 시간을 사용하고 플레이·3D 재생 시간은 제외합니다.':'추가 목표 달성 여부는 대금·별점·해제 조건에 영향을 주지 않습니다.'}`;
  }
  function renderLog(){
    const rows=game.visibleRows(state).map((row,i)=>measuring&&row.number===displayedRow()?.number?{...row,removed:null,quality:null,measured:false}:row);$('wafer-log').replaceChildren();
    for(let i=0;i<6;i++){const row=rows[i],box=document.createElement('div');const label=document.createElement('span'),value=document.createElement('b'),note=document.createElement('small');label.textContent=`WAFER ${String(i+1).padStart(2,'0')}`;value.textContent=row?.discarded&&row.removed==null?'—':row?.removed!=null?format(row.removed,1)+' nm':row?'?':'대기';note.textContent=row?.discarded?'폐기':row?row.measured?qualityText(row.quality):'검사 때 공개':'미가공';box.append(label,value,note);$('wafer-log').append(box);}
  }
  function renderClues(){
    $('equipment-brief').hidden=busy;$('brief-wafer').textContent=`다음 가공 · W${String(state.rows.length+1).padStart(2,'0')}`;
    const priority=game.clues(state).find(c=>c.kind==='changed'||c.kind==='warning');$('brief-summary').textContent=priority?priority.title:'상태 확인';
    $('equipment-clues').replaceChildren();for(const clue of game.clues(state)){const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');card.dataset.kind=clue.kind;h.textContent=clue.title;p.textContent=clue.detail;card.append(h,p);$('equipment-clues').append(card);}
  }
  function renderComparison(){
    const prior=game.previousAttempt(completed,state,runId),comparison=game.comparison(state,prior);
    $('attempt-comparison-table').replaceChildren();$('attempt-comparison-feedback').hidden=!comparison;
    $('attempt-comparison-note').textContent=comparison?'같은 초기 조건에서의 비교입니다.':completed.some(e=>e.id!==runId&&e.session.order===state.order)?'규칙·장비가 다른 기록은 비교하지 않습니다.':'같은 주문에 다시 도전하면 비교할 수 있어요.';
    if(!comparison)return;
    const {before,after,delta}=comparison,table=document.createElement('table'),thead=document.createElement('thead'),tbody=document.createElement('tbody');
    const header=document.createElement('tr');for(const label of ['지표','직전 도전','이번 도전','변화']){const th=document.createElement('th');th.scope='col';th.textContent=label;header.append(th);}thead.append(header);
    const fields=[['good','규격 안','장',0],['mae','평균 절대 목표 오차','%',2],['profit','납품 대금 − 비용',' P',0],['measures','측정 사용','회',0],['services','정비 사용','회',0]];
    for(const [key,label,unit,digits]of fields){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;tr.append(th);for(const val of [before[key],after[key],delta[key]]){const td=document.createElement('td');const isDelta=tr.children.length===3;td.textContent=(isDelta&&val>0?'+':'')+format(val,digits)+(key==='mae'&&isDelta?'%p':unit);tr.append(td);}tbody.append(tr);}table.append(thead,tbody);$('attempt-comparison-table').append(table);
    const change=delta.mae<-.005?`평균 절대 목표 오차를 ${format(-delta.mae)}%p 줄였습니다.`:delta.mae>.005?`평균 절대 목표 오차가 ${format(delta.mae)}%p 커졌습니다.`:'평균 절대 목표 오차가 직전과 같습니다.';
    $('attempt-comparison-feedback').textContent=`${change} 규격 안 장수와 비용도 함께 비교해보세요. 두 도전에서 바꾼 변수·측정·정비의 영향을 한 가지 원인으로 단정하지 않습니다.`;
  }
  function finishInspection(){clearTimeout(inspectionTimer);inspectionTimer=null;if(stale||state.phase!=='inspection'||game.inspectionDone(state))return;dispatch({type:'inspect',count:game.lotRows(state).length-state.inspected});render();}
  function scheduleInspection(){
    if(stale||view!=='inspection'||game.inspectionDone(state)||inspectionTimer!==null)return;
    inspectionTimer=setTimeout(()=>{inspectionTimer=null;if(stale||view!=='inspection')return;try{dispatch({type:'inspect',count:motion.matches||document.hidden?game.lotRows(state).length-state.inspected:1});render();}catch(error){notice(error.message);}},motion.matches?0:650);
  }
  function showWaferGuides(){
    return state.order===0 && !handlingLearned && !tutorial.dismissed && !tutorial.completed;
  }
  function render(){
    hideWaferInfo();
    const guided=showWaferGuides();
    document.body.dataset.waferGuides=guided?'on':'off';
    const feeding=view==='feed', atBench=feeding||['setup','playing','result'].includes(view);
    const hasBlank=state.rows.length<game.orders[state.order].count;
    $('physical-feed').hidden=!feeding||!hasBlank;
    $('wafer-feed').querySelector('.feed-fallback').hidden=!hasBlank;
    $('wafer-feed').hidden=!feeding;
    const kept=game.lotRows(state).length;
    const betweenWafers=feeding && state.rows.length>0;
    $('bench-lot').hidden=!(feeding&&(state.rows.length>0||state.version===game.fundedVersion));
    $('wafer-feed').querySelector('.transfer-help').hidden=!guided;
    $('feed-wafer-number').textContent=betweenWafers?'작업대':'웨이퍼 '+String(state.rows.length+1).padStart(2,'0');
    if(feeding){
      $('lot-stock').textContent=`원판 ${game.orders[state.order].count-state.rows.length}장 · 보관 ${kept}장 · 폐기 ${state.rows.length-kept}장`;
      $('finish-lot').textContent=kept?`보관한 ${kept}장으로 납품 준비`:'납품 없이 주문 마감';
    }
    $('physical-sorting').hidden=view!=='result'||measuring;
    const rackAvailable=['feed','setup','result'].includes(view)&&!state.recalled&&!busy&&!measuring&&!stale;
    const storedRows=game.storedRows(state);
    const showRack=rackAvailable&&storedRows.length>0;
    $('physical-rack').hidden=$('rack-inventory').hidden=!showRack;
    if(!showRack)$('rack-inventory').open=false;
    const meterOccupied=state.phase==='result'&&!!state.rows.at(-1)?.measured;
    const paidScan=game.actions(state).remaining!==0 && game.availableForActions(state)>=game.orders[state.order].measureCost;
    for(const button of rackPickups){
      const row=storedRows.find(row=>row.slot===Number(button.dataset.slot));
      button.hidden=!row;
      if(!row)continue;
      button.dataset.wafer=String(row.number);
      button.dataset.meterBlocked=String(meterOccupied||(!row.measured&&!paidScan));
      const name=`${row.slot+1}층 · W${String(row.number).padStart(2,'0')}`;
      button.setAttribute('aria-label',name);
      const label=button.querySelector('.shelf-caption');
      if(label)label.textContent=name+(row.measured?' · 측정됨':'');
    }
    for(const el of document.querySelectorAll('[data-transfer-area="rack"] [data-drop="measure"]')){
      el.disabled=meterOccupied||(!paidScan&&!storedRows.some(row=>row.measured));
    }
    document.body.dataset.atWorkbench=String(atBench);document.body.dataset.benchFocus=String(atBench&&focusMode);
    $('work-screen').dataset.mode=view;
    $('toggle-focus').textContent=focusMode?'상세 보기':'장비 화면';
    $('bench-order').hidden=!atBench;
    for(const el of document.querySelectorAll('body > .factory-header, .factory-main > *:not(#work-screen):not(dialog):not(#save-warning), body > .skip-link'))el.inert=atBench&&focusMode;
    const o=game.orders[state.order],resultView=view==='result',inspection=['inspection','settled'].includes(view);
    // An unaccepted saved brief will use the new rules when the player accepts it.
    const billingState = !accepted && view === 'brief' ? game.createFunded(state.order,growth.levels,growth.balance) : state;
    const price = game.prices(billingState);
    $('order-wallet-note').textContent=billingState.version===game.fundedVersion?'공방 잔액은 다음 주문으로 이어져요':'이전 규칙 · 이 주문의 시작 자금 100 P';
    const spendable = game.availableForActions(state);
    $('under-payout').textContent = price.under ? '+' + price.under + ' P' : '0 P';
    $('order-fee').textContent = billingState.version===game.fundedVersion?'가공비는 설정 조건에 따라 달라져요 · ':price.run ? '가공 1장 ' + price.run + ' P · ' : '';
    $('help-payout').textContent = billingState.version===game.fundedVersion?'가공 시작 전 표시한 비용을 사용하고, 규격 안 1장당 100 P를 납품할 때 받아요. 비용은 교육용 수치예요.':price.run
      ? '가공 시작 시 ' + price.run + ' P 사용. 납품 시 규격 안 1장당 ' + price.good + ' P, 규격 밖은 0 P입니다.'
      : '이전 주문 규칙 · 규격 안 100 P · 부족 40 P · 과다 0 P.';
    $('order-progression').textContent=o.guest?'특별 의뢰 · 규격 3장 이상과 추가 목표 달성 시 배지':'규격 3장 이상이면 다음 의뢰 해제';
    $('order-eyebrow').textContent=o.guest?`특별 의뢰 · ${o.title}`:`ORDER ${String(state.order+1).padStart(2,'0')} / 05 · ${o.title}`;
    const titles={feed:betweenWafers?'작업대 · 다음 작업 선택':guided?'웨이퍼를 연마 패드로 옮기세요.':'작업대 · 가공 대기',handover:'손님에게 상자를 건네세요.',brief:'어서오세요, 반도체 공방입니다.',setup:`${state.rows.length+1}번 웨이퍼, 시간을 정하세요.`,playing:'장비가 연마하고 있어요.',result:'웨이퍼를 어디로 보낼까요?',inspection:'검사 후, 손님에게 가져가요.',settled:'손님, 주문하신 웨이퍼 나왔어요.'};
    $('game-title').textContent=titles[view];$('game-title').style.whiteSpace='pre-line';
    if(['brief','handover','settled'].includes(view)){
      const {day,slot}=businessDay();
      $('order-eyebrow').textContent=`영업 ${day}일차 · 손님 ${slot}/${customersPerDay}`;
    }
    $('game-subtitle').textContent=view==='brief'?'손님의 이야기를 듣고, 딱 맞는 한 장을 만들어봐요.':`${story.contract(state.order).profile.role} · 목표 ${o.target} nm · 허용 오차 ±${o.tolerance}%`;
    count('wafer-count',state.rows.length);counters.set($('wallet'),cashBalance(),{digits:0,immediate:true});
    const budget=game.actions(state);count('action-count',budget.remaining);$('action-limit').textContent=budget.limit===null?' 이전 규칙':' / 2회';
    $('action-budget-note').textContent=budget.limit===null?'저장된 도전은 이전 규칙으로 유지합니다. 새 주문·재도전부터 측정·정비 공통 2회 제한을 적용합니다.':budget.remaining===0?'추가 행동 소진 · 연마와 최종 검사는 가능해요.':'';
    $('action-budget-note').dataset.exhausted=String(budget.remaining===0);$('action-budget-note').hidden=!$('action-budget-note').textContent;
    $('bench-title').textContent=feeding?(betweenWafers?'작업대 · 다음 작업 선택':guided?'첫 웨이퍼 · 패드에 올리기':'작업대 · 가공 대기'):measuring?'웨이퍼 측정 중':view==='result'?`${displayedRow().number}번 웨이퍼 · ${displayedRow().measured?'측정 완료':'연마 완료'}`:busy?`${state.rows.length}번 웨이퍼 · 자동 가공`:`${state.rows.length+1}번 웨이퍼 · 가공 준비`;
    $('bench-target').textContent=`목표 ${o.target} nm ±${o.tolerance}%`;count('bench-actions',budget.remaining);counters.set($('bench-wallet'),cashBalance(),{digits:0,immediate:true});
    renderCustomerContext();
    $('brief-screen').hidden=view!=='brief';$('work-screen').hidden=!atBench;$('result-screen').hidden=!resultView;$('inspection-screen').hidden=!inspection;
    document.querySelectorAll('[data-game-step]').forEach(el=>{if(el.dataset.gameStep===({feed:'setup',playing:'setup',handover:'inspection',settled:'inspection'}[view]||view))el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('client').textContent=story.contract(state.order).profile.role;$('order-name').textContent=o.title;count('target',o.target);$('tolerance').textContent=`허용 오차 ±${o.tolerance}% · ${(o.target*(1-o.tolerance/100)).toFixed(1)}–${(o.target*(1+o.tolerance/100)).toFixed(1)} nm`;$('order-lesson').textContent=o.lesson;
    $('customer-goal').textContent=story.goalLabel(state.order);$('customer-goal-note').textContent='규격 충족 + 목표 달성 시 배지';$('order-thread').textContent=`${story.contract(state.order).profile.name} · ${story.contract(state.order).purpose}`;
    if(view==='brief'){
      renderDialogue();$('order-picker').replaceChildren();game.orders.slice(0,story.campaignCount).forEach((order,i)=>{const c=story.contract(i),b=document.createElement('button');b.type='button';b.disabled=!story.unlocked(best,i);const small=document.createElement('small'),strong=document.createElement('strong'),stars=document.createElement('span'),who=document.createElement('small');small.textContent=`ORDER ${String(i+1).padStart(2,'0')}`;strong.textContent=order.title;who.textContent=`${c.profile.name} · ${c.returning?'후속 의뢰':c.profile.focus}`;stars.textContent=b.disabled?'이전 주문 별 1개 필요':best[i]?'★'.repeat(best[i])+'☆'.repeat(3-best[i]):'의뢰 가능';b.append(small,strong,who,stars);if(i===state.order)b.setAttribute('aria-current','true');b.addEventListener('click',()=>newOrder(i));$('order-picker').append(b);});
    }
    if(atBench){
      renderClues();$('equipment-brief').hidden=feeding||busy||resultView;
      syncHandling();
      $('game-form').hidden=feeding||busy||resultView;$('animation-status').hidden=!busy;$('machine-state').textContent=busy?'연마 중 · 설명용 재생':'준비 완료';
      $('work-screen').dataset.playing=String(busy);$('work-wafer').textContent=`W${String(state.rows.length+(busy?0:1)).padStart(2,'0')} / 06`;
      if(busy){const row=state.rows.at(-1);$('running-conditions').replaceChildren();for(const [label,value] of [...(price.run?[[replaying?'재생 비용':'가공비',replaying?'0 P':`−${row.processingFee??price.run} P`]]:[]),['설정 연마 시간',`${row.duration}초`],['Main outer 압력',`${format(row.input.pressure,3)} · 데이터 기준값`],['Wafer 회전',`${row.input.wafer_rotation_pct}%`],['Stage 회전',`${row.input.stage_rotation_pct}%`],['Slurry C 유량',`${row.input.slurry_c_pct}%`]]){const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=value;$('running-conditions').append(term,description);}}
      counters.set($('wear-value'),state.wear,{digits:0,suffix:'%'});$('wear-value').setAttribute('aria-label',`컨디셔너 사용량 ${format(state.wear,0)}%`);$('wear-meter').value=state.wear;
      const padLevel=game.equipment(state).pad;
      const onPad=view==='result' && !measuring && !state.recalled && !displayedRow()?.measured;
      const padLabel=padLevel?`고효율 패드 ${padLevel}단계`:'기본 패드';
      $('bench-pad-info').textContent=`${padLabel} · 사용량 ${format(state.pad,0)}%`+
        (onPad?` · W${String(displayedRow().number).padStart(2,'0')} 연마 완료`:'');
      counters.set($('pad-value'),state.pad,{digits:0,suffix:'%'});$('pad-meter').value=state.pad;
      $('work-target').textContent=`${o.target} nm ±${o.tolerance}%`;
      $('measurement-age').textContent=state.lastMeasured?`W${state.lastMeasured} 측정 기준 · 이후 ${state.rows.length-state.lastMeasured}장 가공`:'측정 전 · 초기 가정값';
      $('shift-note').textContent=state.servicedSinceMeasure?'교체 후 제거율 변화 · 재측정 권장':state.order===2&&state.rows.length===0?'재시작 직후 · 첫 장 제거율 감소':'';
      renderEndpoint();
      $('service').disabled=feeding||busy||resultView||state.order===0||spendable<o.serviceCost||state.wear===0||budget.remaining===0;$('service').textContent=state.order===0?'정비 · 다음 주문부터':budget.remaining===0?'정비 불가 · 추가 행동 소진':spendable<o.serviceCost?'정비 불가 · 남은 가공비 확보':'컨디셔너 교체 · 30 P + 행동 1회';
      $('use-recommendation').disabled=busy||stale;
      $('process-cost').textContent=price.run?`−${price.run} P`:'';
      $('process').setAttribute('aria-label',`${state.rows.length+1}번 웨이퍼 연마 시작${price.run?' · −'+price.run+' P':''}`);
      ensureScene();syncHandling();if(view==='setup')updateEstimate();
    }
    if(resultView){
      const row=game.visibleRows(state)[displayedRow().number-1],measured=row.measured&&!measuring;
      $('result-action-note').textContent=measured?`W${row.number} · ${format(row.removed,1)} nm / 목표 ${o.target} nm`:`W${row.number} 연마 완료 · 측정 여부를 선택하세요`;
      $('metrology-status').hidden=!measuring;
      $('advance').disabled=measuring||stale;$('replay-game').hidden=!!state.recalled;$('replay-game').disabled=measuring||stale||!!state.recalled;
      $('result-heading').textContent=measured?`${row.number}번 웨이퍼, 측정 완료.`:`${row.number}번 웨이퍼, 연마 완료.`;$('result-subtitle').textContent=`${row.actualDuration!==undefined?`설정 ${row.duration}초 · 연마 ${format(game.elapsed(row),1)}초${row.endpointStopped?' · 종점 정지':''}`:`설정 시간 ${row.duration}초`} · 목표 ${o.target} nm`;
      $('wafer-sorting').hidden=measuring;
      $('revealed-measurement').hidden=!measured;
      $('measure').disabled=measuring||measured||stale||spendable<o.measureCost||budget.remaining===0;$('measure-cost').textContent=measured?'측정 완료':budget.remaining===0?'행동 소진':spendable<o.measureCost?'자금 부족':o.measureCost+' P · 행동 1회';
      $('physical-meter').disabled=$('measure').disabled;
      $('physical-meter').hidden=measured;
      $('physical-finished').setAttribute('aria-label',measured?'측정기의 웨이퍼 집기':'연마 패드의 웨이퍼 집기');
      $('finished-wafer-label').textContent=(measured?'측정기':'연마 패드')+' · W'+String(row.number).padStart(2,'0');
      $('physical-meter').querySelector('b').textContent=measured?'완료':budget.remaining===0?'행동 소진':spendable<o.measureCost?'자금 부족':o.measureCost+' P';
      $('store-next').textContent=state.recalled?`${displayedRow().slot+1}층에 복귀`:'납품 후보';
      $('measurement-feedback').textContent=measuring?'':measured?'측정한 장을 보관하거나 폐기할 수 있어요.':budget.remaining===0?'추가 행동 소진 · 최종 검사에서 확인하세요.':spendable<o.measureCost?'자금 부족 · 최종 검사에서 확인하세요.':state.rows.length===6?'마지막 장 · 무료 최종 검사로 이동할 수 있어요.':'측정하면 다음 장의 예상 시간을 보정해요.';
      if(measured){count('measured-removal',row.removed,2);$('quality-badge').textContent=qualityText(row.quality);$('quality-badge').dataset.quality=row.quality;$('measured-error').textContent=`목표 대비 ${row.error>=0?'+':''}${format(row.error)}%`;
        const start=50-o.tolerance*2,end=50+o.tolerance*2;$('result-needle').style.left=`${Math.min(100,Math.max(0,50+row.error*2))}%`;$('result-needle').parentElement.style.background=`linear-gradient(to right,#efdbbc ${start}%,#9ccab0 ${start}%,#9ccab0 ${end}%,#efc7c2 ${end}%)`;}
      renderLog();
    }
    if(inspection){
      const s=game.summary(state),settled=state.phase==='settled',done=game.inspectionDone(state);count('good-count',done?s.good:null);count('revenue',done?s.revenue:null);count('spent',s.spent);$('cost-breakdown').textContent=`가공 ${s.processingCost} · 측정·정비 ${s.actionCost} P`;$('stars').textContent=done?'★'.repeat(s.stars)+'☆'.repeat(3-s.stars):'검사 중';$('stars').setAttribute('aria-label',done?`별 ${s.stars}개 / 3개`:'검사 중');
      $('inspection-heading').textContent=!s.total?'납품할 웨이퍼가 없습니다.':settled?'납품을 마쳤습니다.':done?`보관한 ${s.total}장, 검사 완료.`:'한 장씩, 납품 규격 확인 중';
      $('lot-denominator').textContent=` / ${s.total}장`;
      $('inspection-progress').textContent=`${state.inspected} / ${s.total}장 검사${done?' 완료':' 중'} · 폐기 ${state.rows.length-s.total}장`;$('reveal-all').hidden=done;
      ['inspection-totals','inspection-detail-table','inspection-debrief','attempt-comparison'].forEach(id=>$(id).hidden=!done);
      $('inspection-cards').replaceChildren();game.visibleRows(state).filter(row=>!row.discarded).forEach((row,index)=>{const card=document.createElement('article'),name=document.createElement('span'),stamp=document.createElement('strong'),error=document.createElement('small');const revealed=index<state.inspected;card.className='inspection-tile';card.dataset.revealed=String(revealed);card.dataset.quality=revealed?row.quality:'pending';name.textContent=`WAFER ${String(row.number).padStart(2,'0')}`;stamp.textContent=revealed?qualityText(row.quality):'검사 대기';error.textContent=revealed?`${row.error>=0?'+':''}${format(row.error)}% · ${format(row.removed,1)} nm`:'—';if(revealed&&index===state.inspected-1&&!done)card.classList.add('stamp-arrive');card.append(name,stamp,error);$('inspection-cards').append(card);});
      $('inspection-rows').replaceChildren();if(done)game.visibleRows(state).forEach(row=>{const tr=document.createElement('tr');for(const val of [`W${String(row.number).padStart(2,'0')}`,`${format(game.elapsed(row),1)} s${row.endpointStopped?` (설정 ${row.duration})`:""}`,row.removed==null?'—':`${format(row.removed)} nm`,row.error==null?'—':`${row.error>=0?'+':''}${format(row.error)}%`,row.discarded?'폐기':qualityText(row.quality),row.measured?'측정함 · 5 P':'생략']){const td=document.createElement('td');td.textContent=val;tr.append(td);}$('inspection-rows').append(tr);});
      $('debrief').replaceChildren();for(const fact of CMPGuidance.debrief(state)||[]){const section=document.createElement('section'),title=document.createElement('h3'),text=document.createElement('p');title.textContent=fact.title;text.textContent=fact.text;section.append(title,text);$('debrief').append(section);}
      $('ship').textContent=s.total?'상자 들고 카운터로 →':'납품 없이 마감하기';$('ship').hidden=settled;$('ship').disabled=!done||stale;$('export-order').disabled=!done;
      $('settlement-note').textContent=settled?`정산 완료 · 시작 ${state.initialWallet??100} + 납품 ${s.revenue} − 비용 ${s.spent} = ${state.wallet} P. ${state.version===game.fundedVersion?'이 잔액으로 다음 주문을 진행해요.':'이전 주문 규칙으로 정산했어요. 다음 주문부터 공방 지갑을 사용해요.'}`:'';
      if(!done)$('settlement-note').textContent='검사가 끝나면 납품할 수 있어요.';
      const badge=story.evaluation(state);
      $('inspection-goal').hidden=!badge;
      if(badge)$('inspection-goal').textContent=badge.achieved?`배지 획득 · ${badge.badge}`:`추가 목표 미달성 · ${story.goalLabel(state.order)}`;
      if(done)renderComparison();else scheduleInspection();
    }
    renderShop();renderGrowth();renderTutorial();renderDock();renderAccount();counters.refresh();
  }
  function unavailable(){const host=$('cmp-scene');host.dataset.renderer='unavailable';$('scene-fallback').hidden=false;$('scene-fallback').textContent='3D를 사용할 수 없어 정지 개념도로 표시합니다. 게임은 계속 진행할 수 있습니다.';$('cmp-canvas').hidden=true;$('game-surface').hidden=false;$('game-surface').open=true;host.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);}
  function ensureScene(){if(sceneTried){scene?.resize();return;}sceneTried=true;try{scene=CMPScene.create({host:$('cmp-scene'),canvas:$('cmp-canvas'),fallback:$('scene-fallback'),detail:$('game-surface'),onUnavailable:unavailable});if(!scene)unavailable();else applyGrowthLook();}catch{unavailable();}}
  function syncHandling(){
    const active=state.rows.length;
    const slots=game.storedRows(state).map(row=>row.slot);
    const reviewed=state.recalled?displayedRow():null;
    const parkedAt=reviewed&&rackResume!=='feed'?'platen':null;
    scene?.setHandling({slots,returnSlot:reviewed?.slot,freeSlot:game.freeSlot(state),parkedAt,guided:showWaferGuides(),docked:true,station:view,completed:active,measured:!!displayedRow()?.measured,interactive:!measuring&&!stale,canMeasure:game.actions(state).remaining!==0&&game.availableForActions(state)>=game.orders[state.order].measureCost,mode:transferMode,frame:transferFrame});
    count('supply-count',Math.max(0,game.orders[state.order].count-active-(view==='setup'?1:0)));
    count('output-count',slots.length);
    const route={feed:showWaferGuides()?'투입 슬롯 → 연마 패드':'작업 대기',setup:'연마 패드에 장착됨',playing:'자동 연마 중'};
    $('transport-label').textContent=measuring?'측정기 · 스캔 중':view==='result'?(state.rows.at(-1)?.measured?'측정 완료':'연마 완료'):route[view]||'연마기 준비';
    $('machine-state').textContent=measuring?'계측 중':busy?'자동 가공 중 · 설명용':'준비 완료';
  }
  function finishVisual(){
    const wasBusy=busy,wasMeasuring=measuring;
    busy=false;measuring=false;transferMode='idle';transferFrame=null;
    handlingPlayer.cancel();player.reset();
    if(wasBusy)setView('result');
    else if(wasMeasuring){
      if(!document.hidden)CMPFeedback.play('scan');
      render();
      if(!stale && !document.hidden){
        const source=transferSource(), bounds=source.getBoundingClientRect();
        if(bounds.top<72 || bounds.bottom>innerHeight)source.scrollIntoView({block:'center',behavior:'instant'});
        source.focus({preventScroll:true});
      }
    }else syncHandling();
  }
  const handlingPlayer=CMPHandling.createPlayer({requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),now:()=>performance.now(),onFrame:frame=>{
    transferFrame=frame;syncHandling();
    $('metrology-progress').value=frame.progress*100;
    $('metrology-copy').textContent='측정기에서 표면을 스캔하고 있어요.';
  },onComplete:()=>{if(!stale)finishVisual();}});
  const player=CMPPolish.createPlayer({requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),now:()=>performance.now(),onFrame:frame=>{
    scene?.setFrame(frame);$('game-progress').value=frame?frame.progress*100:0;
    const key=frame?.phase||'approach';const row=state.rows.at(-1);if(busy&&row?.endpointEnabled){$('endpoint-live').textContent=key==='contact'?'목표 도달 감시 중 · 감지 오차 있음':key==='release'||key==='complete'?(row.endpointStopped?'목표 신호 감지 · 자동 정지':'설정 시간 도달 · 연마 종료'):'종점 감지 준비';}if(key!==observedPhase){observedPhase=key;const p=CMPWorkshop.phase(key);$('animation-copy').textContent=p.title;$('animation-phase-copy').textContent=p.copy;document.querySelectorAll('[data-polish-step]').forEach(el=>{if(Number(el.dataset.polishStep)===p.step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
  },onState:status=>{scene?.setState(status);if(['completed','reduced'].includes(status)&&busy&&!stale)finishVisual();}});
  function playback(replay=false){
    if(stale||busy||measuring||state.recalled)return;
    const row=state.rows.at(-1);if(!row)return;
    focusMode=true;
    replaying=replay;
    if(!replay)CMPFeedback.play('start');
    const calc=engine.calculate(row.input);calc.mrr*=CMPUpgrades.effects(game.equipment(state)).rateScale;activeProfile=CMPPolish.profile(row.input,calc,engine.recipes.A456);
    $('endpoint-live').hidden=!row.endpointEnabled;$('endpoint-live').textContent=row.endpointEnabled?'종점 감지 준비 · 교육용 센서':'';busy=true;transferMode='polish';observedPhase=null;setView('playing');
    player.start(activeProfile,{reducedMotion:motion.matches||document.hidden});
  }
  function businessDay(){
    // Each settlement credits the fund once, including zero-income orders.
    const previous=growth.credited.length-(state.phase==='settled'&&growth.credited.includes(runId)?1:0);
    return {day:Math.floor(previous/customersPerDay)+1,slot:previous%customersPerDay+1};
  }
  function clearDeparture(){
    clearTimeout(readingTimer);clearTimeout(exitTimer);readingTimer=exitTimer=null;
    delete $('customer-stage').dataset.leaving;
  }
  function canDepart(){
    return view==='settled'&&state.phase==='settled'&&speechLast&&!stale&&closedRunId!==runId&&!document.hidden&&
      !document.querySelector('dialog[open]')&&!$('counter-history').open&&!$('inspection-records').open;
  }
  function scheduleDeparture(){
    if(exitTimer!==null)return;
    clearTimeout(readingTimer);
    if(!canDepart())return;
    const readingTime=Math.min(11000,Math.max(3500,lastLine.length*135));
    readingTimer=setTimeout(startDeparture,readingTime);
  }
  function startDeparture(){
    if(!canDepart()||exitTimer!==null)return;
    clearTimeout(readingTimer);
    const visit=runId;
    $('customer-stage').dataset.leaving='true';
    exitTimer=setTimeout(()=>{
      clearDeparture();
      if(runId!==visit||!canDepart())return;
      if(businessDay().slot===customersPerDay){
        closedRunId=runId;save();render();openClosingShop();
      }else newOrder(story.nextCustomer(best,state.order),true);
    },motion.matches?0:320);
  }
  function openClosingShop(){
    if(stale||closedRunId!==runId||state.phase!=='settled'||$('upgrade-dialog').open)return;
    const day=campaign.dailySummary(growth,businessDay().day);
    $('upgrade-title').textContent=`${businessDay().day}일차 영업 마감`;
    $('closing-income').textContent=`납품 +${day.revenue} · 가공·측정·정비 −${day.costs} · 순이익 ${day.profit>=0?'+':''}${day.profit} P${day.support?' · 지원 +'+day.support+' P':''}`;
    upgradeUI.open();
  }
  function startNextDay(){
    if(stale||closedRunId!==runId)return;
    const next=story.nextCustomer(best,state.order);
    closedRunId=null;
    newOrder(next,true);
  }
  function newOrder(index,fromConversation=false){
    if(stale||closedRunId===runId||!story.unlocked(best,index))return;
    clearDeparture();
    if($('game-settings').open)$('game-settings').close();
    clearTimeout(inspectionTimer);inspectionTimer=null;
    handlingPlayer.cancel();busy=measuring=false;transferMode='idle';transferFrame=null;player.reset();
    state=game.createFunded(index,growth.levels,growth.balance);runId=crypto.randomUUID();asked=[];accepted=false;
    $('conversation-options').open=$('commission-board').open=$('counter-history').open=false;
    input=game.settings();fillSettings();$('duration').value=game.recommendation(state,input);
    $('duration-slider').value=$('duration').value;
    setView('brief',!fromConversation);save();
    if(fromConversation){
      $('shop-dialogue').focus({preventScroll:true});
      $('customer-stage').scrollIntoView({block:'nearest',behavior:'instant'});
    }
  }
  $('dialogue-next').addEventListener('click',()=>{
    if(stale)return;
    if(view==='settled' && speechLast){startDeparture();return;}
    if(speechLast && $('customer-stage').dataset.phase==='talking')shop.say(speechText);
    else shop.next();
  });
  function syncReading(){
    if(view!=='settled')return;
    if(canDepart())scheduleDeparture();else clearDeparture();
  }
  for(const id of ['counter-history','inspection-records'])$(id).addEventListener('toggle',syncReading);
  for(const dialog of document.querySelectorAll('dialog')){
    dialog.addEventListener('toggle',syncReading);
    dialog.addEventListener('close',syncReading);
  }
  document.addEventListener('visibilitychange',syncReading);
  window.addEventListener('pagehide',clearDeparture);
  function chooseGuestOrder(index) {
    if(stale || !['brief','settled'].includes(view))return;
    $('guests-dialog').close();
    newOrder(index);
  }
  $('invite-guest').addEventListener('click',()=>{
    if(stale || !['brief','settled'].includes(view))return;
    const list=$('guest-list');
    list.replaceChildren();
    game.orders.forEach((order,index)=>{
      if(!order.guest)return;
      const {profile}=story.contract(index);
      const button=document.createElement('button');
      button.type='button';
      button.className='guest-card';
      button.setAttribute('aria-label',profile.name+' 초대');
      const portrait=document.createElement('span');
      portrait.className='guest-portrait';
      portrait.style.backgroundImage=`url("${CMPShop.artwork(profile.id).src}")`;
      portrait.setAttribute('aria-hidden','true');
      const copy=document.createElement('span');
      const name=document.createElement('strong'),title=document.createElement('span'),goal=document.createElement('small');
      name.textContent=profile.name;title.textContent=order.title;goal.textContent=story.goalLabel(index);
      copy.append(name,title,goal);button.append(portrait,copy);list.append(button);
      button.addEventListener('click',()=>chooseGuestOrder(index));
    });
    $('return-campaign').hidden=!game.orders[state.order].guest;
    $('guests-dialog').showModal();
  });
  $('close-guests').addEventListener('click',()=>$('guests-dialog').close());
  $('return-campaign').addEventListener('click',()=>{
    const next=best.slice(0,story.campaignCount).findIndex((stars,index)=>!stars&&story.unlocked(best,index));
    chooseGuestOrder(next<0?story.campaignCount-1:next);
  });
  $('open-order-slip').addEventListener('click',()=>$('order-dialog').showModal());
  ['close-order-slip','order-dialog-done'].forEach(id=>$(id).addEventListener('click',()=>$('order-dialog').close()));
  $('accept-order').addEventListener('click',()=>{if(stale||accepted)return;state=game.createFunded(state.order,growth.levels,growth.balance);accepted=true;$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;$('endpoint-enabled').checked=true;setView('feed');save();});
  $('game-form').addEventListener('submit',event=>{event.preventDefault();if(view!=='setup'||busy||state.phase!=='setup'||!validate())return;try{dispatch({type:'run',duration:Number($('duration').value),input:readSettings(),endpointEnabled:$('endpoint-enabled').checked});playback();}catch(e){$('game-error').hidden=false;$('game-error').textContent=e.message;}});
  $('duration').addEventListener('input',()=>{if($('duration').value!==''&&Number.isFinite(Number($('duration').value)))$('duration-slider').value=$('duration').value;updateEstimate();});
  $('duration-slider').addEventListener('input',()=>{$('duration').value=$('duration-slider').value;updateEstimate();});
  $('endpoint-enabled').addEventListener('change',updateEstimate);
  document.querySelectorAll('[data-duration-step]').forEach(b=>b.addEventListener('click',()=>{if(busy||stale)return;const current=$('duration').value===''?30:Number($('duration').value);$('duration').value=Math.min(240,Math.max(30,Math.round(current)+Number(b.dataset.durationStep)));$('duration-slider').value=$('duration').value;updateEstimate();}));
  ['pressure','wafer_rotation_pct','stage_rotation_pct','slurry_c_pct'].forEach(k=>{$('g-'+k).addEventListener('input',()=>{if($('g-'+k).value!==''&&Number.isFinite(Number($('g-'+k).value)))$('g-'+k+'-slider').value=$('g-'+k).value;updateEstimate();});$('g-'+k+'-slider').addEventListener('input',()=>{$('g-'+k).value=$('g-'+k+'-slider').value;updateEstimate();});});
  $('use-recommendation').addEventListener('click',()=>{try{readSettings();if(state.order===0&&state.lastMeasured){tutorial.applied=true;save();renderTutorial();}$('duration').value=game.recommendation(state,input);$('duration-slider').value=$('duration').value;updateEstimate();}catch{validate();}});
  $('service').addEventListener('click',()=>{if(view!=='setup'||busy)return;try{dispatch({type:'service'});render();}catch(e){notice(e.message);}});
  function transferSource(){
    const physical=document.querySelector('#physical-sorting [data-pickup]');
    return $('cmp-scene').dataset.transferReady==='true' && physical.getClientRects().length ? physical : $('finished-wafer');
  }
  function startScan(){
    measuring=true;
    transferMode='measure';
    render();
    $('metrology-copy').focus({preventScroll:true});
    handlingPlayer.play('scan',{reducedMotion:motion.matches||document.hidden});
  }
  function routeWorkpiece(destination,wafer) {
    if (stale || busy || measuring) return;
    if(wafer!==undefined){
      const row=game.storedRows(state).find(row=>row.number===wafer);
      if(!row||!['feed','result','setup'].includes(view)||state.recalled)return;
      if(destination==='discard'){
        dispatch({type:'rackDiscard',wafer});
        render();
      }else if(destination==='measure'){
        rackResume=view;
        dispatch({type:row.measured?'rackReview':'measure',wafer});
        setView('result');
        save();
        if(!row.measured)startScan();
      }
      return;
    }
    if(state.recalled){
      if(view==='result'&&['store','discard'].includes(destination)){
        dispatch({type:destination==='store'?'rackReturn':'rackDiscard',wafer:state.recalled});
        setView(rackResume);
        save();
      }
      return;
    }
    if (destination==='place' && view==='feed' && accepted && state.phase==='setup' && state.rows.length<game.orders[state.order].count) {
      setView('setup');
      save();
      return;
    }
    if (destination==='deliver' && view==='handover' && state.phase==='inspection' && game.inspectionDone(state)) {
      dispatch({type:'ship'});
      setView('settled',false);
      $('shop-dialogue').focus({preventScroll:true});
      $('shop-dialogue').scrollIntoView({block:'nearest',behavior:'instant'});
      return;
    }
    if (view!=='result' || state.phase!=='result') return;
    if (destination==='measure' && !state.rows.at(-1)?.measured && !$('measure').disabled) {
      dispatch({type:'measure'});
      startScan();
    } else if (destination==='store'||destination==='discard') {
      dispatch({type:destination==='discard'?'discard':'advance',keepOpen:true});
      if(state.phase==='setup'){
        $('duration').value=CMPGuidance.tutorial(state,tutorial)&&state.lastMeasured?state.rows[0].duration:game.recommendation(state,input);
        $('duration-slider').value=$('duration').value;
        player.reset();
      }
      setView(state.phase==='setup'?'feed':state.phase);
    }
  }
  const rackPickups=[];
  for(let i=0;i<6;i++){
    for(const physical of [true,false]){
      const button=document.createElement('button');
      button.type='button';
      button.className=physical?'pickup anchor wafer-handle rack-wafer':'pickup';
      button.dataset.pickup='';
      button.dataset.slot=String(i);
      button.setAttribute('aria-pressed','false');
      button.hidden=true;
      if(physical){
        button.dataset.anchor='slot'+i;
        button.innerHTML='<i class="wafer-hit" aria-hidden="true"></i>';
        $('physical-rack').append(button);
      }else{
        button.innerHTML='<span class="piece piece-wafer" aria-hidden="true"></span><span class="shelf-caption"></span>';
        $('rack-shelves').append(button);
      }
      rackPickups.push(button);
    }
  }
  const waferInspector=$('wafer-inspector');
  const inspectableWafers=new Set([$('physical-finished'),$('finished-wafer'),...rackPickups]);
  let inspectedSource=null;
  function hideWaferInfo(){
    if(!inspectedSource)return;
    inspectedSource.setAttribute('aria-describedby','transfer-keys');
    waferInspector.hidden=true;
    inspectedSource=null;
  }
  function showWaferInfo(source){
    if(!inspectableWafers.has(source) || !source.getClientRects().length ||
       busy || measuring || stale || document.body.dataset.carrying)return;
    const number=source.hasAttribute('data-slot')?Number(source.dataset.wafer):displayedRow()?.number;
    const row=game.visibleRows(state).find(item=>item.number===number);
    if(!row || row.discarded)return;
    hideWaferInfo();
    inspectedSource=source;
    $('wafer-info-name').textContent=`웨이퍼 W${String(number).padStart(2,'0')}`;
    $('wafer-info-time').textContent=`${Number(game.elapsed(row).toFixed(1))}초`;
    $('wafer-info-removal').textContent=row.measured?`${format(row.removed)} nm · ${qualityText(row.quality)}`:'미측정';
    waferInspector.hidden=false;
    source.setAttribute('aria-describedby','transfer-keys wafer-inspector');
    const anchor=source.getBoundingClientRect(), box=waferInspector.getBoundingClientRect();
    const gap=8, above=anchor.top-box.height-gap;
    waferInspector.style.left=`${Math.max(gap,Math.min(innerWidth-box.width-gap,anchor.left+(anchor.width-box.width)/2))}px`;
    waferInspector.style.top=`${above>=gap?above:Math.max(gap,Math.min(innerHeight-box.height-gap,anchor.bottom+gap))}px`;
  }
  for(const source of inspectableWafers){
    source.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='touch' && !event.buttons)showWaferInfo(source);
    });
    source.addEventListener('pointerleave',event=>{
      if(event.pointerType!=='touch' && inspectedSource===source)hideWaferInfo();
    });
    source.addEventListener('focus',()=>{if(source.matches(':focus-visible'))showWaferInfo(source);});
    source.addEventListener('blur',()=>{if(inspectedSource===source)hideWaferInfo();});
  }
  document.addEventListener('pointerdown',hideWaferInfo,true);
  document.addEventListener('keydown',event=>{
    if(['Escape',' ','Enter','Tab'].includes(event.key))hideWaferInfo();
  },true);
  document.addEventListener('scroll',hideWaferInfo,true);
  window.addEventListener('resize',hideWaferInfo);
  window.addEventListener('blur',hideWaferInfo);
  const transfers=CMPTransfers((destination,wafer)=>{
    try {const before=state,station=view;routeWorkpiece(destination,wafer);return state!==before||view!==station;} catch(error) {notice(error.message);return false;}
  },position=>scene?.moveWorkpiece(position),slot=>scene?.hoverSlot(slot),showWaferInfo);
  $('finish-lot').addEventListener('click',()=>{
    if(stale||view!=='feed'||state.phase!=='setup'||(!state.rows.length&&state.version!==game.fundedVersion))return;
    dispatch({type:'finishLot'});
    setView('inspection');
  });
  $('skip-measurement').addEventListener('click',finishVisual);
  $('skip-animation').addEventListener('click',finishVisual);$('replay-game').addEventListener('click',()=>playback(true));
  $('ship').addEventListener('click',()=>{if(stale||view!=='inspection'||state.phase!=='inspection'||!game.inspectionDone(state))return;if(!game.lotRows(state).length){dispatch({type:'ship'});setView('settled');return;}setView('handover');save();$('customer-stage').scrollIntoView({block:'start',behavior:'instant'});$('shipping-carrier').querySelector('[data-pickup]').focus({preventScroll:true});});
  $('reveal-all').addEventListener('click',finishInspection);
  $('retry-order').addEventListener('click',()=>{
    if(stale||!['brief','settled'].includes(view)||closedRunId===runId)return;
    const last=completed.at(-1);
    if(last)newOrder(last.session.order,true);
  });
  $('export-order').addEventListener('click',()=>{if(!['inspection','settled'].includes(state.phase)||!game.inspectionDone(state))return;const equipment=game.equipment(state);const header=['model','environment_level','care_level','pad_level','endpoint_level','actual_duration_s','endpoint_enabled','endpoint_stopped','order','wafer','duration_s','removed_nm_game','error_pct','quality','measured','pressure','wafer_pct','stage_pct','slurry_c_pct','endpoint_requested','calibration_status','calibration_remaining','disposition','processing_fee_p','opening_balance_p'];const rows=game.visibleRows(state).map(r=>[state.version,equipment.environment,equipment.care,equipment.pad,equipment.endpoint,game.elapsed(r),r.endpointEnabled??false,r.endpointStopped??false,state.order+1,r.number,r.duration,r.removed,r.error,r.quality,r.measured,r.input.pressure,r.input.wafer_rotation_pct,r.input.stage_rotation_pct,r.input.slurry_c_pct,r.endpointRequested??r.endpointEnabled??false,r.endpointReason??'legacy',r.calibrationRemaining??'',r.discarded?'discarded':'shipped',r.processingFee??game.prices(state).run,state.initialWallet??100]);const blob=new Blob(['\ufeff'+[header,...rows].map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CMP-game-order-${state.order+1}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('guide-dismiss').addEventListener('click',()=>{tutorial.dismissed=true;save();render();});
  $('guide-focus').addEventListener('click',()=>{const t=CMPGuidance.tutorial(state,tutorial);if(!t)return;$('first-order-guide').hidePopover();
    if(t.action==='use-recommendation' && focusMode){focusMode=false;render();}
    const control=['measure','advance'].includes(t.action)?transferSource():$(t.action);control.scrollIntoView({block:'center',behavior:motion.matches?'auto':'smooth'});control.focus({preventScroll:true});});
  $('restart-guide').addEventListener('click',()=>{if(state.order!==0||state.rows.length>1)return;tutorial={dismissed:false,completed:false,applied:false};save();$('game-help').close();renderTutorial();});
  $('open-help').addEventListener('click',()=>$('game-help').showModal());['close-help','help-done'].forEach(id=>$(id).addEventListener('click',()=>$('game-help').close()));
  document.querySelectorAll('[data-scene-view]').forEach(b=>b.addEventListener('click',()=>scene?.setView(b.dataset.sceneView)));$('scene-cutaway').addEventListener('change',()=>scene?.setCutaway($('scene-cutaway').checked));$('scene-transparent').addEventListener('change',()=>scene?.setTransparent($('scene-transparent').checked));$('scene-zoom-in').addEventListener('click',()=>scene?.zoom(.85));$('scene-zoom-out').addEventListener('click',()=>scene?.zoom(1.15));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)shop.ready();if(document.hidden&&(busy||measuring))finishVisual();if(document.hidden&&view==='inspection')finishInspection();});motion.addEventListener('change',()=>{if(motion.matches)shop.ready();if(motion.matches&&(busy||measuring))finishVisual();if(motion.matches&&view==='inspection')finishInspection();});window.addEventListener('pagehide',e=>{if(busy||measuring)finishVisual();shop.destroy();clearTimeout(inspectionTimer);inspectionTimer=null;if(!e.persisted)scene?.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted){shop.ready();if(view==='inspection')scheduleInspection();}});
  // A second tab must never silently overwrite a more recent campaign.
  window.addEventListener('storage',e=>{if(e.key===saveKey){transfers.reset();stale=true;clearTimeout(inspectionTimer);inspectionTimer=null;if(busy||measuring)finishVisual();notice('다른 탭에서 게임이 변경되었습니다. 이 탭을 새로고침해 최신 진행을 불러오세요.');document.querySelectorAll('#factory-main button,#factory-main input').forEach(el=>el.disabled=true);upgradeUI?.render();}});
  $('toggle-focus').addEventListener('click',()=>{focusMode=!focusMode;render();$('toggle-focus').focus({preventScroll:true});});
  $('return-blank').addEventListener('click',()=>{if(view==='setup'&&!busy&&!stale){setView('feed');save();}});
  $('request-support').addEventListener('click',()=>{if(stale||accepted||view!=='brief')return;try{growth=campaign.support(growth,runId);state=game.createFunded(state.order,growth.levels,growth.balance);save();render();}catch(error){notice(error.message);}});
  function soundButton(){const muted=CMPFeedback.isMuted();$('toggle-sound').setAttribute('aria-pressed',String(muted));$('toggle-sound').textContent=muted?'효과음 꺼짐':'효과음 켜짐';}
  $('toggle-sound').addEventListener('click',()=>{CMPFeedback.setMuted(!CMPFeedback.isMuted());soundButton();if(!CMPFeedback.isMuted()){CMPFeedback.unlock();CMPFeedback.play('seat');}});
  soundButton();
  $('bench-order').addEventListener('click',()=>$('order-dialog').showModal());
  const settingsDialog=$('game-settings');
  const fullscreenButton=$('toggle-fullscreen');
  function syncFullscreen(){
    fullscreenButton.hidden=!document.fullscreenEnabled;
    fullscreenButton.textContent=document.fullscreenElement?'전체 화면 끄기':'전체 화면 켜기';
  }
  $('open-settings').addEventListener('click',()=>{
    syncFullscreen();
    $('fullscreen-notice').hidden=true;
    settingsDialog.showModal();
  });
  $('close-settings').addEventListener('click',()=>settingsDialog.close());
  settingsDialog.addEventListener('close',()=>{
    $('counter-history').open=false;
    if(view==='settled')$('inspection-records').open=false;
    syncReading();
  });
  document.addEventListener('fullscreenchange',syncFullscreen);
  fullscreenButton.addEventListener('click',async()=>{
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $('fullscreen-notice').textContent='이 창에서는 브라우저 전체 화면을 사용할 수 없어요.';
      $('fullscreen-notice').hidden=false;
    }
  });
  if(state.phase==='settled'&&!completed.some(e=>e.id===runId)){completed=game.archiveSettlement(completed,runId,new Date().toISOString(),state);}
  try{
    for(const entry of completed)creditSettlement(entry.id,game.restore(entry.session));
    if(accepted)growth=campaign.sync(growth,runId,state);
  }catch(error){stale=true;notice('자금 기록을 확인하지 못해 진행을 멈췄어요. 저장 원본은 유지됩니다. '+error.message);}
  if(!accepted)state=game.createFunded(state.order,growth.levels,growth.balance);
  save();
  const installation=CMPInstallationView.create({getAppearance:()=>CMPUpgrades.appearance(growth),isAccepted:()=>accepted,onClose:openClosingShop});
  upgradeUI=CMPUpgradeView.create({onPurchase:installation.show,onPreview:()=>installation.show(),onDone:startNextDay,getGrowth:()=>growth,getEquipment:()=>game.equipment(state),commit:commitUpgrade,isStale:()=>stale,isAccepted:()=>accepted});
  fillSettings();$('duration').value=CMPGuidance.tutorial(state,tutorial)&&state.lastMeasured&&!tutorial.applied?state.rows[0].duration:game.recommendation(state,input);$('duration-slider').value=$('duration').value;render();
  if(stale)document.querySelectorAll('#factory-main button,#factory-main input').forEach(el=>el.disabled=true);
  if(closedRunId===runId)openClosingShop();
})();
