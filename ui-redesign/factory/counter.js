(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CMPCounter = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  // Presentation only: calculations and saved records never read animated values.
  function createAnimator({write, now, requestFrame, cancelFrame, duration = 560}) {
    let value = null, target, frame = null, generation = 0;
    function cancel() {
      generation++;
      if (frame !== null) cancelFrame(frame);
      frame = null;
    }
    function paint(next, running) { value = next; write(next, running); }
    function finish() { cancel(); if (target !== undefined) paint(target, false); }
    function set(next, {immediate = false, from} = {}) {
      next = Number.isFinite(next) ? next : null;
      if (Object.is(next, target) && from === undefined) { if (immediate) finish(); return; }
      const start = Number.isFinite(from) ? from : Number.isFinite(value) ? value : 0;
      cancel(); target = next;
      if (immediate || next === null || start === next || duration <= 0) { paint(next, false); return; }
      const token = generation, started = now();
      paint(start, true);
      const tick = () => {
        if (token !== generation) return;
        const progress = Math.max(0, Math.min(1, (now() - started) / duration));
        if (progress === 1) { frame = null; paint(target, false); return; }
        const eased = 1 - Math.pow(1 - progress, 3);
        paint(start * (1 - eased) + next * eased, true);
        frame = requestFrame(tick);
      };
      frame = requestFrame(tick);
    }
    return {set, finish, cancel, value: () => value};
  }

  function attachDocument(doc, formatNumber) {
    const win = doc.defaultView, items = new Map();
    const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
    const visible = el => !doc.hidden && el.getClientRects().length > 0 && (() => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < win.innerHeight && rect.right > 0 && rect.left < win.innerWidth;
    })();
    const observer = new win.IntersectionObserver(entries => {
      entries.forEach(entry => { const item = items.get(entry.target); if (item) reveal(item); });
    });
    function reveal(item) {
      if (!visible(item.el)) { item.player.finish(); return; }
      if (item.pending !== undefined) {
        const from = item.pending; item.pending = undefined;
        item.player.set(item.target, {from, immediate: item.options.immediate || preference.matches || item.scientific});
      }
    }
    function set(el, value, options = {}) {
      if (!el || el.matches('input,textarea,select')) return;
      value = Number.isFinite(value) ? value : null;
      let item = items.get(el);
      if (!item) {
        const visual = doc.createElement('span'), accessible = doc.createElement('span');
        visual.className = 'counter-value'; visual.setAttribute('aria-hidden', 'true');
        accessible.className = 'counter-a11y';
        el.classList.add('number-counter'); el.replaceChildren(visual, accessible);
        item = {el, visual, accessible, target: undefined, options: {}, pending: undefined};
        item.player = createAnimator({now: () => win.performance.now(), requestFrame: cb => win.requestAnimationFrame(cb), cancelFrame: id => win.cancelAnimationFrame(id),
          write: (number, running) => {
            visual.textContent = item.format(number, running);
            el.dataset.counting = String(running);
          }});
        items.set(el, item); observer.observe(el);
      }
      const previous = item.player.value(), changed = !Object.is(item.target, value);
      item.options = {...item.options, ...options};
      const {digits = 2, prefix = '', suffix = '', empty = '—'} = item.options;
      item.format = (number, running = false) => number === null ? empty : `${prefix}${running ? number.toFixed(digits) : formatNumber(number, digits)}${suffix}`;
      const finalText = item.format(value);
      const formatChanged = el.dataset.counterFinal !== finalText;
      item.scientific = /e[+-]\d/.test(finalText);
      item.accessible.textContent = finalText; el.dataset.counterFinal = finalText;
      item.target = value;
      if (changed) {
        item.pending = visible(el) ? undefined : (item.pending ?? previous ?? 0);
        item.player.set(value, {immediate: item.options.immediate || !visible(el) || preference.matches || item.scientific});
      } else if (formatChanged) item.player.finish();
      reveal(item);
    }
    function refresh(scope = doc) {
      items.forEach((item, el) => {
        if (!el.isConnected) { item.player.cancel(); observer.unobserve(el); items.delete(el); }
      });
      scope.querySelectorAll('[data-counter]').forEach(el => {
        if (!items.has(el)) set(el, Number(el.dataset.counter), {digits: Number(el.dataset.counterDigits ?? 2)});
      });
      items.forEach(reveal);
    }
    preference.addEventListener('change', () => {
      if (preference.matches) items.forEach(item => item.player.finish());
    });
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) items.forEach(item => item.player.finish());
      else refresh();
    });
    win.addEventListener('pagehide', () => items.forEach(item => item.player.finish()));
    return {set, refresh};
  }
  return {createAnimator, attachDocument};
});
