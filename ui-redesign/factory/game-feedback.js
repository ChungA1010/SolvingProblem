/* Short procedural foley. Audio never owns, delays, or changes a game action. */
(function (root) {
  'use strict';
  const preference = 'cmp-factory-muted-v1';
  let muted = false, context = null, master = null;
  const voices = new Set();
  try { muted = root.localStorage.getItem(preference) === 'true'; } catch {}

  function unlock() {
    if (muted) return false;
    try {
      const Audio = root.AudioContext || root.webkitAudioContext;
      if (!Audio) return false;
      if (!context || context.state === 'closed') {
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
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  function setMuted(value) {
    muted = value === true;
    if (muted) silence();
    try { root.localStorage.setItem(preference, String(muted)); } catch {}
    if (!muted) unlock();
    return muted;
  }
  root.CMPFeedback = Object.freeze({ unlock, play, setMuted, isMuted: () => muted });
  const trustedInput = event => { if (event.isTrusted) unlock(); };
  root.document?.addEventListener('pointerdown', trustedInput, { capture: true, passive: true });
  root.document?.addEventListener('keydown', trustedInput, { capture: true });
  root.document?.addEventListener('visibilitychange', () => { if (root.document.hidden) silence(); });
  root.addEventListener?.('pagehide', silence);
})(globalThis);
