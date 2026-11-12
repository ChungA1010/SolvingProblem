(function(root){
  'use strict';
  root.CMPInstallationView={create({getAppearance,isAccepted,onClose}){
    const $=id=>document.getElementById(id),dialog=$('installation-dialog'),motion=matchMedia('(prefers-reduced-motion: reduce)');
    let renderer=null,snapshot=null,generation=0,phase='',previewOnly=false,failed=false;
    function update(frame){if(!failed)renderer?.setFrame(frame);$('install-progress').value=frame.progress*100;dialog.dataset.phase=frame.phase;if(phase!==frame.phase){phase=frame.phase;$('install-phase').textContent=({delivery:'물품 반입',fit:'자리 잡는 중',activate:'설치 확인',done:'설치 완료'})[phase];for(const el of dialog.querySelectorAll('[data-install-step]'))el.dataset.active=String(el.dataset.installStep===phase);}}
    const player=CMPInstall.createPlayer({requestFrame:cb=>requestAnimationFrame(cb),cancelFrame:id=>cancelAnimationFrame(id),now:()=>performance.now(),onFrame:update,onComplete:()=>{if(!failed)renderer?.showFinal();const focusMoved=[$('install-skip'),$('install-replay')].includes(document.activeElement);$('install-skip').hidden=true;$('install-replay').hidden=previewOnly||failed;$('install-caption').textContent=snapshot.item.detail;if(focusMoved)$('install-done').focus({preventScroll:true});}});
    function cleanup(){generation++;player.cancel();renderer?.dispose();renderer=null;}
    function unavailable(){if(!dialog.open)return;failed=true;$('install-canvas').hidden=true;$('install-fallback').hidden=false;$('install-loading').hidden=true;player.cancel();update(CMPInstall.frame(1));$('install-phase').textContent=previewOnly?'설치된 공방':'설치 완료';$('install-skip').hidden=true;$('install-replay').hidden=true;}
    function show({before,after,event,saved=true}={}){
      cleanup();const previousCanvas=$('install-canvas');previousCanvas.replaceWith(previousCanvas.cloneNode(false));const token=generation;failed=false;previewOnly=!event;const current=getAppearance();snapshot={before:before||current,after:after||current,item:event?CMPInstall.describe(event,after):{key:'overview',title:'지금의 내 공방',detail:'현재 배치'}};
      phase='';dialog.dataset.phase='loading';$('install-title').textContent=snapshot.item.title;$('install-caption').textContent=snapshot.item.detail;$('install-phase').textContent=previewOnly?'공방 둘러보기':'설치 준비';$('install-note').textContent=saved===false?'현재 화면에 적용했지만 저장하지 못했어요. 브라우저를 닫으면 구매가 사라질 수 있습니다.':previewOnly?'장비 효과는 주문 수락 시 적용돼요.':Boolean(CMPUpgrades.catalog[event?.id])?(isAccepted()?'장비 효과: 다음 주문부터':'장비 효과: 주문 수락 시 적용'):'무료 보관·재배치 · 성능 변화 없음';
      $('install-stepper').hidden=previewOnly;$('install-progress').hidden=previewOnly;$('install-skip').hidden=previewOnly;$('install-skip').disabled=true;$('install-replay').hidden=true;$('install-canvas').hidden=false;$('install-fallback').hidden=true;$('install-loading').hidden=false;$('install-progress').value=0;
      $('install-inventory').replaceChildren();for(const [id,items]of Object.entries(CMPInstall.items)){(id==='environment'?items.slice(0,snapshot.after[id]||0):items.slice(Math.max(0,(snapshot.after[id]||0)-1),snapshot.after[id]||0)).forEach(item=>{const chip=document.createElement('span');chip.textContent=item.title;$('install-inventory').append(chip);});}for(const id of snapshot.after.decor||[]){const item=CMPInstall.decorations[id];if(item){const chip=document.createElement('span');chip.textContent=item.title;$('install-inventory').append(chip);}}if(!$('install-inventory').children.length)$('install-inventory').textContent='기본 작업대 · 업그레이드를 구매하면 장비가 추가됩니다.';
      dialog.showModal();
      try{renderer=CMPScene.createInstallation({canvas:$('install-canvas'),before:snapshot.before,after:snapshot.after,item:snapshot.item.key,onReady:()=>{if(token!==generation)return;$('install-loading').hidden=true;if(previewOnly){renderer.showFinal();return;}$('install-skip').disabled=false;player.play({reducedMotion:motion.matches||document.hidden});},onUnavailable:()=>{if(token===generation)unavailable();}});}catch{unavailable();}
    }
    function close(){dialog.close();}
    dialog.addEventListener('close',()=>{cleanup();onClose();});$('install-close').addEventListener('click',close);$('install-done').addEventListener('click',close);
    $('install-skip').addEventListener('click',()=>player.finish());
    $('install-replay').addEventListener('click',()=>{phase='';$('install-skip').hidden=false;$('install-replay').hidden=true;player.play({reducedMotion:motion.matches||document.hidden});});
    const reduce=()=>{if(motion.matches)player.finish();};motion.addEventListener('change',reduce);document.addEventListener('visibilitychange',()=>{if(document.hidden)player.finish();});window.addEventListener('pagehide',cleanup);
    return {show};
  }};
})(globalThis);
