(function(root){
  'use strict';
  function create({onResolve}){
    const $=id=>document.getElementById(id);
    const rail=$('weather-bench'),counter=$('weather-counter'),scenery=$('weather-scenery');
    const note=$('weather-order-copy'),vent=$('weather-vent'),wait=$('weather-wait');
    const filter=$('weather-filter'),slot=$('weather-slot'),title=$('weather-title'),instruction=$('weather-instruction');
    // The same receiver supports a single tap and the game's pointer / keyboard transfer.
    slot.addEventListener('click',()=>{if(!slot.disabled&&!vent.hidden&&!rail.hidden)onResolve('replaceFilter');});
    wait.addEventListener('click',()=>{if(!wait.disabled&&!wait.hidden&&!rail.hidden)onResolve('waitForQuiet');});
    function render(status,{station,accepted,busy,stale}){
      const kind=status?.id,atCounter=['brief','handover','settled'].includes(station);
      const atBench=['feed','setup','result'].includes(station);
      scenery.dataset.kind=kind||'';
      scenery.toggleAttribute('hidden',!kind||!atCounter);
      counter.hidden=!kind||!atCounter;
      rail.hidden=!kind||!accepted||!atBench||busy;
      note.hidden=!kind;
      if(!kind)return;

      const dust=kind==='dust',active=status.active;
      counter.textContent=dust?'황사':'인근 공사';
      counter.dataset.kind=rail.dataset.kind=kind;
      rail.dataset.active=String(active);
      rail.dataset.resolution=status.resolution||'';
      const wasOnControl=rail.contains(document.activeElement);
      vent.hidden=!dust||!active;
      wait.hidden=dust||!active;
      filter.disabled=slot.disabled=!!(stale||rail.hidden||vent.hidden);
      wait.disabled=!!(stale||rail.hidden||wait.hidden);
      // CMPTransfers removes passive destinations from the tab order. This one
      // is also a native, directly actionable button.
      slot.tabIndex=slot.disabled?-1:0;
      if(dust){
        const replacement=status.hasSpare?'예비 자재함 필터':'기본 필터';
        $('weather-cartridge-label').textContent=replacement;
        filter.setAttribute('aria-label',replacement+' 집기');
        title.textContent=active?'황사 · 필터 차압 높음':
          status.resolution==='normal'?'황사 · 필터 차압 정상':'외기 필터 교체 완료';
        instruction.textContent=active?'연마 전에 필터를 슬롯에 끼워 주세요.':'';
        note.textContent=active?'황사 예보 · 외기 필터의 교체 표시가 켜졌어요. 작업대에서 필터를 끼운 뒤 연마하세요.':
          status.resolution==='normal'?'황사가 있지만 외기 필터 차압은 정상이에요.':
          status.resolution==='reserve'?'황사 · 예비 자재함의 필터로 교체했어요.':
          status.resolution==='service'?'황사 · 기본 필터로 교체했어요.':'황사 · 이번 주문에는 외기 필터를 교체하지 않았어요.';
      }else{
        title.textContent=active?'인근 공사 · 측정대 진동':'측정대 진동 정상';
        instruction.textContent=active?'지금 기다리거나, 첫 장을 보관하고 두 번째 장을 연마하세요.':'';
        note.textContent=active?'인근 공사로 측정대가 흔들려요. 잠시 기다리거나 두 번째 장을 연마하면 측정할 수 있어요.':
          status.resolution?'인근 공사 · 측정대 진동이 잦아들었어요.':'인근 공사 · 측정 전 대기를 마치지 않고 주문을 끝냈어요.';
      }
      if(!active&&wasOnControl&&!rail.hidden)title.focus({preventScroll:true});
    }
    title.tabIndex=-1;
    return {render};
  }
  root.CMPEnvironmentView={create};
})(globalThis);
