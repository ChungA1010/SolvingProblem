(function () {
  'use strict';

  window.CMPTransfers = function bindTransfers(onDrop, moveWafer, hoverSlot, onTap) {
    let grip = null;
    const status = document.getElementById('transfer-announcement');
    const feedback = name => window.CMPFeedback?.play(name);
    function pulse(element, name) {
      if (!element) return;
      element.classList.remove(name);
      // Repeated drops restart only their short local animation.
      void element.offsetWidth;
      element.classList.add(name);
      setTimeout(() => element.classList.remove(name), 220);
    }

    function reset() {
      if (!grip) return;
      const { source, id, ghost, target, physical } = grip;
      grip = null;
      if (physical) moveWafer(null);
      if (source.hasAttribute('data-slot')) hoverSlot(null);
      ghost?.remove();
      target?.classList.remove('drop-ready');
      source.classList.remove('in-transit');
      source.setAttribute('aria-pressed', 'false');
      delete document.body.dataset.carrying;
      if (id !== undefined && source.hasPointerCapture(id)) source.releasePointerCapture(id);
    }

    function begin() {
      grip.lifted = true;
      grip.source.classList.add('in-transit');
      grip.source.setAttribute('aria-pressed', 'true');
      document.body.dataset.carrying = grip.area.dataset.transferArea;
      feedback('lift');
      if (grip.source.dataset.slot!==undefined) hoverSlot(null);
      if (grip.physical || grip.keyboard) return;
      const art = grip.source.querySelector('.piece');
      const rect = art.getBoundingClientRect();
      grip.ghost = art.cloneNode(true);
      grip.ghost.classList.add('transfer-ghost');
      grip.ghost.setAttribute('aria-hidden', 'true');
      grip.ghost.style.width = rect.width + 'px';
      grip.ghost.style.height = rect.height + 'px';
      document.body.append(grip.ghost);
    }

    function highlight(target) {
      if (target === grip.target) return;
      grip.target?.classList.remove('drop-ready');
      grip.target = target;
      target?.classList.add('drop-ready');
      grip.ghost?.classList.toggle('over-landing', !!target);
    }

    function move(event) {
      if (!grip || event.pointerId !== grip.id) return;
      if (!grip.lifted) {
        if (Math.hypot(event.clientX-grip.x, event.clientY-grip.y) < 9) return;
        begin();
      }
      const {clientX:x, clientY:y} = event;
      const hit = document.elementFromPoint(x,y)?.closest('[data-drop]');
      const legal = hit && !(hit.dataset.drop==='measure' && grip.source.dataset.meterBlocked==='true') && !hit.disabled && hit.closest('[data-transfer-area]')?.dataset.transferArea === grip.area.dataset.transferArea;
      highlight(legal ? hit : null);
      if (grip.physical) moveWafer({x,y,offsetX:grip.offsetX,offsetY:grip.offsetY,slot:grip.slot,target:grip.target?.dataset.drop});
      else if (grip.ghost) {
        grip.ghost.style.left = x+'px';
        grip.ghost.style.top = y+'px';
      }
    }

    function release() {
      const destination = grip?.lifted && grip.target && !grip.target.disabled && grip.target.dataset.drop;
      const wafer=grip?.source.dataset.wafer;
      const tappedSource=grip && !grip.lifted && !grip.keyboard ? grip.source : null;
      const restingHover=!grip?.lifted && grip?.pointerType==='mouse' ? grip.slot : undefined;
      const source=grip?.source, target=grip?.target, physical=grip?.physical, lifted=grip?.lifted;
      reset();
      if(restingHover!==undefined)hoverSlot(restingHover);
      if (destination) {
        const accepted = onDrop(destination,wafer?Number(wafer):undefined);
        if (accepted === true) {
          feedback(destination === 'deliver' ? 'deliver' : 'seat');
          pulse(target, 'seated-piece');
          if (physical) moveWafer({settle:true,target:destination});
        } else if (accepted === false) pulse(source, 'returned-piece');
      }
      else if (tappedSource) onTap?.(tappedSource);
      else if (lifted) pulse(source, 'returned-piece');
    }

    for (const source of document.querySelectorAll('[data-pickup]')) {
      const area = source.closest('[data-transfer-area]');
      const physical = source.matches('[data-anchor]');
      const slot=source.hasAttribute('data-slot')?Number(source.dataset.slot):undefined;
      if(slot!==undefined){
        source.addEventListener('pointerenter',e=>{if(!grip && e.pointerType!=='touch')hoverSlot(slot);});
        source.addEventListener('pointerleave',()=>{if(!grip)hoverSlot(null);});
        source.addEventListener('focus',()=>{if(!grip)hoverSlot(slot);});
        source.addEventListener('blur',()=>{if(!grip)hoverSlot(null);});
      }
      source.setAttribute('aria-describedby','transfer-keys');
      source.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0 || source.disabled) return;
        reset();
        grip = {area,source,physical,slot,pointerType:event.pointerType,id:event.pointerId,x:event.clientX,y:event.clientY};
        if (physical && !event.target.closest('small')) {
          const r=source.getBoundingClientRect();
          grip.offsetX=r.left+r.width/2-event.clientX;
          grip.offsetY=r.top+r.height/2-event.clientY;
        }
        source.setPointerCapture(event.pointerId);
      });
      source.addEventListener('pointermove', move);
      source.addEventListener('pointerup', event => {
        if (!grip || event.pointerId !== grip.id) return;
        move(event);
        release();
      });
      source.addEventListener('lostpointercapture', () => {
        if (grip?.source === source && !grip.keyboard) reset();
      });
      source.addEventListener('keydown', event => {
        const liftKey = event.key === ' ' || event.key === 'Enter';
        if (liftKey) {
          event.preventDefault();
          if (event.repeat) return;
          if (grip?.keyboard && grip.source===source) { release(); return; }
          reset();
          grip = {area,source,physical,slot,keyboard:true};
          begin();
          status.textContent = '잡았어요. 방향키로 옮긴 뒤 스페이스로 놓으세요.';
          return;
        }
        if (!grip?.keyboard || grip.source !== source || !['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const targets = [...area.querySelectorAll('[data-drop]:not(:disabled)')].filter(el=>el.getClientRects().length && !(el.dataset.drop==='measure' && source.dataset.meterBlocked==='true'));
        if (!targets.length) return;
        const previous = targets.indexOf(grip.target);
        const step = ['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1;
        const target = targets[previous<0 ? 0 : (previous+step+targets.length)%targets.length];
        highlight(target);
        if (physical) moveWafer({target:target.dataset.drop,slot});
        status.textContent = (target.getAttribute('aria-label')||target.textContent.trim())+' · 스페이스로 놓기';
      });
      source.addEventListener('blur', () => { if (grip?.keyboard) reset(); });
    }
    // Recipients are landing zones. A click on one never performs a transfer.
    for (const target of document.querySelectorAll('[data-drop]')) target.tabIndex = -1;
    document.addEventListener('pointercancel', event => { if (grip?.id===event.pointerId) reset(); });
    document.addEventListener('keydown', event => { if (event.key==='Escape') reset(); });
    window.addEventListener('blur', reset);
    window.addEventListener('pagehide', reset);
    return {reset};
  };
})();
