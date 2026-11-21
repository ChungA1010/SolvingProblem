/* Catalog presentation only; economy and order snapshots remain in CMPUpgrades. */
(function(root){
  'use strict';
  root.CMPUpgradeView={create({getGrowth,getEquipment,commit,isStale,isAccepted,onPurchase,onPreview,onDone}){
    const u=root.CMPUpgrades,$=id=>document.getElementById(id),dialog=$('upgrade-dialog');
    const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
    const meta={pad:{short:'연마 패드',tag:'가공률',slot:'연마부 · 패드 교체',code:'PD',copy:'같은 조건에서 더 빠르게 연마해요.'},care:{short:'컨디셔너',tag:'안정성',slot:'연마부 · 디스크와 관리 도구',code:'CD',copy:'사용할수록 느려지는 가공률을 안정적으로 유지해요.'},endpoint:{short:'종점 감지기',tag:'정밀도',slot:'작업대 오른쪽 · 센서 모듈',code:'EP',copy:'측정으로 보정한 뒤 목표 도달을 감지하면 멈춰요.'},environment:{short:'환경 장비',tag:'환경',slot:'공방 · 주변 환경 관리',code:'EN',copy:'주변 환경으로 인한 결과의 흔들림을 줄여요.'}};
    const tabOrder=['events','equipment'];
    let selectedTab='events',selectedEquipment='pad',selectedGear=u.eventGear[0].id;
    const appearance=()=>u.appearance(getGrowth());
    const asset=(id,level=1)=>`./media/workshop-catalog/${['pad','care','endpoint'].includes(id)?`${id}-${level}`:id}.png`;
    function picture(id,level,title,cls){const img=make('img',cls);img.src=asset(id,level);img.alt=title;img.width=800;img.height=680;img.decoding='async';img.draggable=false;return img;}
    function perform(event){
      const feedback=$('upgrade-feedback');
      try{
        const before=appearance(),saved=commit(event);
        render();
        const functional=u.eventGear.some(item=>item.id===event.id);
        feedback.textContent=saved===false?'저장하지 못했어요. 창을 닫으면 변경 내용이 사라질 수 있어요.':
          event.type==='store'?(functional?'장비를 보관했어요. 다음 주문부터 효과가 해제돼요.':'물품을 보관했어요.'):
          event.type==='equip'?'작업대 색상을 바꿨어요.':'설치했어요.';
        if(event.type==='store'||event.type==='equip')feedback.focus({preventScroll:true});
        else{dialog.close();onPurchase({before,after:appearance(),event,saved});}
      }catch(error){feedback.textContent=error.message;feedback.focus({preventScroll:true});}
    }
    function listButton(id,title,note,level,active,select){const b=make('button','catalog-option');b.type='button';b.dataset.catalogItem=id;b.setAttribute('aria-pressed',String(active));b.append(picture(id,level,'','catalog-thumb'));const label=make('span','catalog-option-label');label.append(make('strong','',title),make('small','',note));b.append(label,make('span','catalog-option-arrow','›'));b.addEventListener('click',()=>{select(id);render();dialog.querySelector(`[data-catalog-item="${id}"]`).focus({preventScroll:true});});return b;}
    function productFigure(id,level,title,badge,slot){const figure=make('figure','catalog-stage');figure.dataset.product=id;figure.append(make('span','catalog-stage-tag',badge),picture(id,level,title+' 미리보기','catalog-render'),make('figcaption','catalog-location',slot));return figure;}
    function effectValues(id,levels){const now=u.effects(levels),next=u.effects({...levels,[id]:Math.min(u.catalog[id].costs.length,levels[id]+1)});const value=e=>id==='pad'?`×${e.rateScale.toFixed(2)}`:id==='care'?`+${e.wearStep.toFixed(1)}%p`:id==='endpoint'?(e.sensorError?`±${(e.sensorError*100).toFixed(1)}%`:'미장착'):`±${(1.2*e.noiseScale).toFixed(2)}%`;return {title:{pad:'가공률 배율',care:'장당 사용량 증가',endpoint:'보정 직후 감지 오차',environment:'외부 변동 범위'}[id],now:value(now),next:value(next)};}
    function renderEquipment(s,current){
      const list=$('upgrade-equipment-list');list.replaceChildren();
      for(const id of ['pad','care','endpoint','environment']){const item=u.catalog[id],level=s.levels[id],max=level===item.costs.length;const b=listButton(id,meta[id].short,max?'최고 단계':level?`${level}단계 보유`:'기본 장비',Math.min(2,level+1),selectedEquipment===id,id=>selectedEquipment=id);if(id==='environment')b.classList.add('catalog-option-environment');list.append(b);}
      const id=selectedEquipment,item=u.catalog[id],level=s.levels[id],max=level===item.costs.length,nextLevel=Math.min(level+1,item.costs.length),price=item.costs[level],m=meta[id];
      const host=$('equipment-product');host.replaceChildren();host.append(productFigure(id,Math.min(2,nextLevel),item.title,id==='environment'?'환경 장비 · 대표 이미지':max?'설치 완료':`${nextLevel}단계 · 설치할 모습`,m.slot));
      const info=make('div','catalog-info');info.append(make('span','catalog-category',m.tag+' / '+m.code+'–0'+nextLevel),make('h3','',item.title),make('p','catalog-description',m.copy));
      const stages=make('div','catalog-levels');stages.setAttribute('aria-label',`${item.costs.length}단계 중 ${level}단계 보유`);for(let i=1;i<=item.costs.length;i++){const step=make('span','',`${String(i).padStart(2,'0')} ${i<=level?'보유':i===nextLevel?'다음':'잠김'}`);step.dataset.state=i<=level?'owned':i===nextLevel?'next':'locked';stages.append(step);}info.append(stages);
      const values=effectValues(id,s.levels),stat=make('div','catalog-effect');stat.append(make('span','catalog-effect-label',values.title));const row=make('div','catalog-effect-values'),a=make('div','');a.append(make('small','','현재'),make('strong','',values.now));row.append(a);if(!max){row.append(make('span','catalog-effect-arrow','→'));const b=make('div','');b.append(make('small','','업그레이드'),make('strong','',values.next));row.append(b);}stat.append(row);info.append(stat);
      info.append(make('p','catalog-effect-note',id==='pad'?'빨라진 만큼 연마 시간을 다시 맞춰주세요.':id==='care'?'이미 쌓인 사용량은 정비로 초기화해요.':id==='endpoint'?'측정 후 I단계 2장 / II단계 3장. 조건 변경·정비·재시작 뒤 재측정. 보정 대기 중에는 시간만큼 연마해요. 오차 표시는 보정 직후 기준이며 마모 영향이 더해져요.':'마모와 재시작 영향은 별도로 남아요.'));
      const buy=make('button','catalog-buy');buy.type='button';buy.dataset.upgradeBuy=id;buy.disabled=max||s.balance<price||isStale();buy.append(make('span','',max?'최고 단계 설치 완료':`${nextLevel}단계 구매·설치`));if(!max)buy.append(make('strong','',`${price.toLocaleString('ko-KR')} P`));buy.addEventListener('click',()=>perform({type:'buy',id,level}));info.append(buy);
      const pending=isAccepted()&&level!==current[id];info.append(make('p','catalog-transaction-note',!max&&s.balance<price?`${price-s.balance} P를 더 모으면 설치할 수 있어요.`:pending?`이번 주문 ${current[id]}단계 · 다음 주문 ${level}단계`:max?'현재 장비를 모두 갖췄어요.':isAccepted()?'외형은 즉시 · 성능은 다음 주문부터':'주문을 받을 때 새 성능이 적용돼요.'));
      const details=make('details','catalog-reference');details.append(make('summary','','단계·참고 제품'));const steps=make('ol','');item.stages.forEach((label,i)=>steps.append(make('li','',`${i+1}단계 · ${label}`)));details.append(steps);if(item.reference){const a=make('a','',item.reference+' ↗');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';details.append(a,make('p','','역할을 참고한 게임 모델입니다. 실제 제품의 외형·성능과 다릅니다.'));}info.append(details);host.append(info);
    }
    function renderEventGear(s){
      const list=$('upgrade-events-list'),active=u.installedEventGear(s);
      list.replaceChildren();
      for(const gear of u.eventGear){
        const status=active.includes(gear.id)?'설치됨':s.decorOwned.includes(gear.id)?'보관 중':`${gear.price} P`;
        list.append(listButton(gear.id,gear.title,status,1,selectedGear===gear.id,id=>selectedGear=id));
      }
      const item=u.eventGear.find(gear=>gear.id===selectedGear);
      const owned=s.decorOwned.includes(item.id),installed=active.includes(item.id);
      const host=$('event-product'),info=make('div','catalog-info event-gear-info');
      host.replaceChildren(productFigure(item.id,1,item.title,installed?'설치됨':owned?'보관 중':'설치 미리보기',item.slot));
      info.append(make('h3','',item.title),make('p','catalog-description',item.description));
      const effect=make('dl','event-gear-effect');
      effect.append(make('dt','',item.effectLabel),make('dd','',item.effectValue));
      const type=owned?(installed?'store':'place'):'buy';
      const action=owned?(installed?'보관하기':'다시 설치'):'구매·설치';
      const button=make('button',`catalog-buy${owned?' catalog-buy-owned':''}`);
      button.type='button';
      button.dataset.eventGear=item.id;
      button.setAttribute('aria-label',`${item.title} ${action}${owned?'':` ${item.price} P`}`);
      button.disabled=isStale()||(!owned&&s.balance<item.price);
      button.append(make('span','',action),make('strong','',owned?'무료':`${item.price} P`));
      button.addEventListener('click',()=>perform({type,id:item.id}));
      info.append(effect,button);
      if(!owned&&s.balance<item.price)info.append(make('p','catalog-transaction-note',`구매하려면 ${item.price-s.balance} P가 더 필요해요.`));
      if(installed)info.append(make('p','catalog-transaction-note','보관하면 다음 주문부터 효과가 꺼져요.'));
      host.append(info);
    }
    function renderLegacyInventory(s){
      const controls=$('legacy-controls');
      controls.replaceChildren();
      function add(label,active,event){
        const button=make('button','game-secondary',label);
        button.type='button';
        button.setAttribute('aria-pressed',String(active));
        button.disabled=isStale()||(event.type==='equip'&&active);
        button.addEventListener('click',()=>perform(event));
        controls.append(button);
      }
      for(const item of u.decorations){
        if(!s.decorOwned.includes(item.id)||u.eventGear.some(gear=>gear.id===item.id))continue;
        const placed=s.placed.includes(item.id);
        add(item.title+(placed?' 보관':' 꺼내기'),placed,{type:placed?'store':'place',id:item.id});
      }
      if(s.owned.length>1){
        for(const theme of u.themes.filter(item=>s.owned.includes(item.id)))add(theme.title,s.theme===theme.id,{type:'equip',id:theme.id});
      }
      $('legacy-inventory').hidden=controls.childElementCount===0;
    }
    function render(){
      const s=getGrowth(),current=getEquipment();
      $('upgrade-balance').textContent=s.balance.toLocaleString('ko-KR');
      $('upgrade-application').textContent=!isAccepted()?'주문 수락 시 보유 장비 적용':u.same(s.levels,current)?'현재 주문에 보유 장비 적용 중':'새 장비 적용 대기 · 다음 주문부터';
      renderEquipment(s,current);
      renderEventGear(s);
      renderLegacyInventory(s);
      if(isStale())$('upgrade-feedback').textContent='다른 탭에서 진행이 바뀌었습니다. 새로고침 후 구매해주세요.';
    }
    function selectTab(id,focus=false){selectedTab=id;for(const key of tabOrder){const active=key===id,b=$('tab-'+key);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('upgrade-'+key+'-panel').hidden=!active;}if(focus)$('tab-'+id).focus();}
    for(const id of tabOrder){$('tab-'+id).addEventListener('click',()=>selectTab(id));$('tab-'+id).addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selectTab(e.key==='Home'?tabOrder[0]:e.key==='End'?tabOrder.at(-1):tabOrder.find(key=>key!==id),true);}});}
    $('view-workshop').addEventListener('click',()=>{dialog.close();onPreview();});
    function open(){render();selectTab(selectedTab);$('upgrade-feedback').textContent=isStale()?'다른 탭의 진행을 불러오려면 새로고침해주세요.':'';dialog.showModal();}
    function finish(){dialog.close();onDone?.();}
    $('close-upgrades').addEventListener('click',finish);
    $('upgrades-done').addEventListener('click',finish);
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
    return {open,render};
  }};
})(globalThis);
