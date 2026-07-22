/* ============================================================
   audio.js — read-aloud (SpeechSynthesis) + SFX/music (WebAudio).
   Read-aloud is available on every instruction/word and never
   auto-scores. Respects per-child settings (volume, calm).
   ============================================================ */

import { state } from "./state.js";

let ctx = null;
function actx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

/* ---------- read-aloud ---------- */
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return null;
  // Prefer a warm en-US/en-GB voice; fall back to first English.
  const prefs = [/samantha/i, /google us english/i, /jenny/i, /aria/i, /female/i, /en-us/i, /en-gb/i, /english/i];
  for (const rx of prefs) { const v = vs.find((x) => rx.test(x.name) || rx.test(x.lang)); if (v) return v; }
  return vs[0];
}
if ("speechSynthesis" in window) {
  pickVoice(); voice = pickVoice();
  speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
}

/** Speak text aloud. Returns a promise that resolves when finished. */
export function speak(text, opts = {}) {
  return new Promise((resolve) => {
    const s = state.profile?.settings;
    const enabled = s ? s.readAloud || opts.force : true;
    if (!("speechSynthesis" in window) || !enabled || !text) return resolve();
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      if (voice) u.voice = voice;
      u.rate = opts.rate ?? 0.92;         // slightly slower for young readers
      u.pitch = opts.pitch ?? 1.05;
      u.volume = s ? s.volume : 0.9;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    } catch (e) { resolve(); }
  });
}
export function stopSpeaking() { try { speechSynthesis.cancel(); } catch (e) {} }

/** Speak a single letter/phoneme cleanly. */
export function sayLetter(ch) { return speak(ch, { rate: 0.8 }); }

/* ---------- SFX ---------- */
function beep(freqs, dur = 0.12, type = "sine", gain = 0.14) {
  const a = actx(); if (!a) return;
  const s = state.profile?.settings; const vol = (s ? s.volume : 0.9) * gain;
  const now = a.currentTime;
  freqs.forEach((f, i) => {
    const o = a.createOscillator(); const g = a.createGain();
    o.type = type; o.frequency.value = f;
    o.connect(g); g.connect(a.destination);
    const t = now + i * dur;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  });
}
export const sfx = {
  tap: () => beep([440], 0.06, "triangle", 0.08),
  correct: () => beep([523.25, 659.25, 783.99], 0.12, "sine", 0.16),
  wrong: () => beep([196, 174.6], 0.16, "sine", 0.12),   // soft, never harsh
  place: () => beep([587.33], 0.08, "triangle", 0.1),
  reward: () => beep([523.25, 659.25, 783.99, 1046.5], 0.13, "sine", 0.17),
  shard: () => beep([659.25, 783.99, 987.77, 1318.5], 0.15, "sine", 0.18),
  open: () => beep([392, 523.25], 0.1, "triangle", 0.1),
};

/* ---------- ambient music (gentle pad, optional) ---------- */
let padNodes = null;
export function startAmbient() {
  const s = state.profile?.settings;
  if (s && s.calm) return;               // calm mode: no ambient loop
  const a = actx(); if (!a || padNodes) return;
  const master = a.createGain(); master.gain.value = (s ? s.volume : 0.9) * 0.03; master.connect(a.destination);
  const chord = [220, 277.18, 329.63];   // A major-ish pad
  const oscs = chord.map((f) => { const o = a.createOscillator(); o.type = "sine"; o.frequency.value = f; o.connect(master); o.start(); return o; });
  padNodes = { master, oscs };
}
export function stopAmbient() {
  if (!padNodes) return;
  try { padNodes.oscs.forEach((o) => o.stop()); } catch (e) {}
  padNodes = null;
}
