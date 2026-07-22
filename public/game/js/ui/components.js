/* ============================================================
   components.js — tiny DOM helpers + reusable UI building blocks
   (buttons, read-aloud pill, modal, toast, confetti, progress).
   No framework; everything returns real DOM nodes.
   ============================================================ */

import { speak, sfx, stopSpeaking } from "../core/audio.js";
import { state } from "../core/state.js";

/** el('div.card', {onclick}, [children | 'text']) */
export function el(sel, attrs = {}, kids = []) {
  const [tag, ...cls] = String(sel).split(".");
  const node = document.createElement(tag || "div");
  if (cls.length) node.className = cls.join(" ");
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === "class") node.className += " " + v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "data" && typeof v === "object") for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false) node.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

/** A primary/secondary button that plays a tap sound. */
export function button(label, onClick, opts = {}) {
  const b = el("button.btn" + (opts.variant ? "." + opts.variant : "") + (opts.size ? "." + opts.size : ""),
    { type: "button", "aria-label": opts.aria || label },
    opts.icon ? [el("span", { text: opts.icon }), el("span", { text: label })] : [label]);
  if (opts.block) b.classList.add("block");
  b.addEventListener("click", (e) => { sfx.tap(); onClick && onClick(e); });
  return b;
}

/** Read-aloud pill — speaks the given text (or a function returning text). */
export function hearButton(getText, opts = {}) {
  const b = el("button.btn.hear" + (opts.size ? "." + opts.size : ""), { type: "button", "aria-label": "Read aloud" },
    [el("span", { text: "🔊" }), el("span", { text: opts.label || "Hear it" })]);
  b.addEventListener("click", async () => {
    sfx.tap();
    const t = typeof getText === "function" ? getText() : getText;
    b.classList.add("playing");
    await speak(t, { force: true });
    b.classList.remove("playing");
  });
  return b;
}

/** Speak automatically when a screen shows (respects read-aloud setting). */
export function autoSpeak(text, delay = 250) {
  setTimeout(() => speak(text), delay);
}

/* ---------- Overlay / modal ---------- */
const overlay = () => document.getElementById("overlay-layer");
export function showModal(contentNode, opts = {}) {
  const scrim = el("div.scrim");
  const modal = el("div.modal", { role: "dialog", "aria-modal": "true" }, [contentNode]);
  scrim.appendChild(modal);
  if (opts.dismissible !== false) scrim.addEventListener("click", (e) => { if (e.target === scrim) closeModal(scrim); });
  overlay().appendChild(scrim);
  return { close: () => closeModal(scrim), scrim };
}
export function closeModal(scrim) { stopSpeaking(); scrim.remove(); }
export function clearOverlays() { overlay().innerHTML = ""; }

/* ---------- Toast ---------- */
let toastTimer;
export function toast(msg, ms = 2200) {
  const t = el("div.toast", { text: msg, role: "status" });
  overlay().appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), ms);
  announce(msg);
}

/* ---------- Screen-reader announce ---------- */
export function announce(msg) {
  const live = document.getElementById("sr-live");
  if (live) { live.textContent = ""; setTimeout(() => (live.textContent = msg), 30); }
}

/* ---------- Confetti (reduced in calm mode) ---------- */
export function confetti(count = 26) {
  const calm = state.profile?.settings?.calm;
  if (calm) count = Math.min(count, 8);
  const colors = ["#f6c545", "#7d5ac8", "#3f8fd6", "#2f9e63", "#d05c8a"];
  for (let i = 0; i < count; i++) {
    const c = el("div.conf");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    overlay().appendChild(c);
    const dur = 1200 + Math.random() * 900, x = (Math.random() * 2 - 1) * 160;
    c.animate(
      [{ transform: "translate(0,-10px) rotate(0)", opacity: 1 }, { transform: `translate(${x}px, ${window.innerHeight + 40}px) rotate(720deg)`, opacity: .9 }],
      { duration: dur, easing: "cubic-bezier(.2,.6,.4,1)" }
    );
    setTimeout(() => c.remove(), dur);
  }
}

/* ---------- Progress bar ---------- */
export function progressBar(pct, variant = "") {
  const bar = el("div.bar" + (variant ? "." + variant : ""));
  bar.appendChild(el("i", { style: { width: Math.max(0, Math.min(100, pct)) + "%" } }));
  return bar;
}

/* ---------- Back button ---------- */
export function backButton(onBack, label = "Back") {
  return button(label, onBack, { variant: "ghost", icon: "←" });
}

/* ---------- Client-art background screen ---------- */
export function bgScreen(url, kids = [], opts = {}) {
  const scr = el("div.screen" + (opts.noCenter ? ".no-center" : ""), {
    style: { backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center" },
  }, Array.isArray(kids) ? kids : [kids]);
  scr.classList.add("hasbg");
  scr.style.setProperty("--scrim", String(opts.scrim ?? 0.42));
  if (opts.blur) scr.classList.add("bg-blur");
  return scr;
}
export function preload(urls) { if (typeof Image === "undefined") return; urls.forEach((u) => { const i = new Image(); i.src = u; }); }
