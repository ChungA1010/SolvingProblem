/* Workshop foley follows the controls; process state and scoring live in the game. */
(function (root) {
  'use strict';
  const preference = 'cmp-factory-muted-v1';
  let muted = false, context = null, master = null;
  const voices = new Set();
  const padBuffers = new Map();
  let rubbing = null;
  try { muted = root.localStorage.getItem(preference) === 'true'; } catch {}

  function unlock() {
    if (muted) return false;
    try {
      const Audio = root.AudioContext || root.webkitAudioContext;
      if (!Audio) return false;
      if (!context || context.state === 'closed') {
        stopSurfaceContact();
        padBuffers.clear();
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0.32;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') Promise.resolve(context.resume()).catch(() => {});
      return true;
    } catch { return false; }
  }

  function tone(start, frequency, endFrequency, duration, amplitude, type = 'sine') {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(amplitude, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + 0.01);
  }

  // Filtered friction noise. The coarse pad catches in short ridges, the finishing pad whispers evenly.
  // A local noise generator keeps audio completely independent of the game's random deck.
  function padBuffer(audio, pad) {
    if (padBuffers.has(pad)) return padBuffers.get(pad);
    const coarse = pad === 'coarse';
    const rate = audio.sampleRate;
    const buffer = audio.createBuffer(1, Math.round(rate * (coarse ? 1.24 : 1.7)), rate);
    const data = buffer.getChannelData(0);
    const tau = 2 * Math.PI;
    const upper = 1 - Math.exp(-tau * (coarse ? 3600 : 1550) / rate);
    const lower = 1 - Math.exp(-tau * (coarse ? 130 : 400) / rate);
    let seed = coarse ? 137 : 521, high = 0, low = 0;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      high += upper * (noise - high);
      low += lower * (noise - low);
      const cycle = tau * i / data.length;
      const texture = coarse
        ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(21 * cycle + Math.sin(5 * cycle))) ** 2
        : 0.88 + 0.12 * Math.cos(4 * cycle);
      const seam = Math.min(1, i / (rate * 0.004), (data.length - 1 - i) / (rate * 0.004));
      data[i] = (high - low) * texture * seam;
    }
    padBuffers.set(pad, buffer);
    return buffer;
  }

  function stopSurfaceContact() {
    const contact = rubbing;
    rubbing = null; // Also invalidates a start awaiting browser audio permission.
    if (!contact?.source) return;
    const {source, level, audio} = contact;
    try {
      const now = audio.currentTime;
      level.gain.cancelScheduledValues(now);
      level.gain.setValueAtTime(Math.max(0.0001, level.gain.value), now);
      level.gain.linearRampToValueAtTime(0, now + 0.015);
      source.stop(now + 0.018);
    } catch { try { source.stop(); } catch {} }
  }
  function soundContact(contact) {
    if (rubbing !== contact) return false;
    const {audio, pad} = contact;
    if (muted || root.document?.hidden || audio.state !== 'running') { rubbing = null; return false; }
    try {
      const buffer = padBuffer(audio, pad);
      const source = audio.createBufferSource(), level = audio.createGain();
      contact.source = source;
      contact.level = level;
      source.buffer = buffer;
      source.loop = true;
      const now = audio.currentTime;
      level.gain.setValueAtTime(0, now);
      level.gain.linearRampToValueAtTime(pad === 'coarse' ? 0.79 : 0.64, now + 0.022);
      source.connect(level); level.connect(master);
      source.onended = () => { source.disconnect(); level.disconnect(); };
      source.start(now);
      return true;
    } catch { stopSurfaceContact(); return false; }
  }
  function startSurfaceContact(pad) {
    if ((pad !== 'coarse' && pad !== 'finish') || muted || root.document?.hidden || !context) return false;
    if (rubbing?.pad === pad) return true;
    stopSurfaceContact();
    const contact = {audio:context, pad};
    rubbing = contact;
    if (context.state !== 'suspended') return soundContact(contact);
    try {
      Promise.resolve(context.resume()).then(() => soundContact(contact)).catch(() => {
        if (rubbing === contact) rubbing = null;
      });
      return true;
    } catch { rubbing = null; return false; }
  }

  function play(name) {
    if (muted || !context || context.state !== 'running' || root.document?.hidden || voices.size > 10) return false;
    try {
      const t = context.currentTime;
      switch (name) {
        case 'lift': tone(t, 330, 510, 0.065, 0.11, 'triangle'); break;
        case 'seat':
          tone(t, 170, 75, 0.105, 0.36, 'triangle');
          tone(t, 1150, 680, 0.045, 0.045); break;
        case 'start':
          tone(t, 145, 230, 0.22, 0.12, 'triangle');
          tone(t + 0.055, 350, 440, 0.13, 0.05); break;
        case 'tempo-reference': tone(t, 620, 600, 0.055, 0.16, 'triangle'); break;
        case 'tempo-sensor': tone(t, 310, 260, 0.06, 0.20, 'sine'); break;
        case 'landing-cue':
          tone(t, 430, 440, 0.07, 0.16, 'triangle');
          tone(t + 0.09, 650, 620, 0.10, 0.15); break;
        case 'landing-good':
        case 'landing-precise':
          tone(t, 185, 72, 0.115, 0.32, 'triangle');
          tone(t + 0.014, 680, 350, 0.035, 0.075);
          if (name === 'landing-precise') tone(t + 0.085, 940, 1210, 0.13, 0.11);
          break;
        case 'landing-miss': tone(t, 225, 145, 0.09, 0.14, 'triangle'); break;
        case 'pad-latch':
          tone(t, 540, 240, 0.033, 0.18, 'triangle');
          tone(t + 0.04, 260, 110, 0.055, 0.18, 'triangle'); break;
        case 'surface-ridge': tone(t, 680, 830, 0.085, 0.11); break;
        case 'roadwork':
          for (const offset of [0, 0.12, 0.29]) tone(t + offset, 104, 57, 0.09, 0.17, 'triangle');
          break;
        case 'scan':
          tone(t, 740, 740, 0.12, 0.12);
          tone(t + 0.105, 988, 988, 0.18, 0.10); break;
        case 'deliver':
          tone(t, 220, 95, 0.12, 0.24, 'triangle');
          tone(t + 0.08, 660, 660, 0.15, 0.10);
          tone(t + 0.18, 880, 880, 0.2, 0.09); break;
        default: return false;
      }
      return true;
    } catch { return false; }
  }

  function silence() {
    stopSurfaceContact();
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function updateMuted(value) {
    muted = value === true;
    if (muted) silence();
    root.dispatchEvent?.(new Event('cmp-sound-change'));
  }
  function setMuted(value) {
    updateMuted(value);
    try { root.localStorage.setItem(preference, String(muted)); } catch {}
    if (!muted) unlock();
    return muted;
  }
  function bindMuteButton(button) {
    const render = () => {
      button.textContent = muted ? '효과음 꺼짐' : '효과음 켜짐';
      button.setAttribute('aria-pressed', String(!muted));
    };
    button.setAttribute('aria-label', '효과음');
    button.addEventListener('click', () => setMuted(!muted));
    root.addEventListener('cmp-sound-change', render);
    render();
  }
  root.CMPFeedback = Object.freeze({ unlock, play, startSurfaceContact, stopSurfaceContact, bindMuteButton, setMuted, isMuted: () => muted });
  const trustedInput = event => { if (event.isTrusted) unlock(); };
  root.document?.addEventListener('pointerdown', trustedInput, { capture: true, passive: true });
  root.document?.addEventListener('keydown', trustedInput, { capture: true });
  root.document?.addEventListener('visibilitychange', () => { if (root.document.hidden) silence(); });
  root.addEventListener?.('blur', stopSurfaceContact);
  root.addEventListener?.('storage', event => {
    if (event.key === preference || event.key === null) updateMuted(event.newValue === 'true');
  });
  root.addEventListener?.('pagehide', silence);
})(globalThis);
