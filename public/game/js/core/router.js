/* ============================================================
   router.js — single-page screen router.
   Each screen module exports:  render(params) -> HTMLElement
   and (optionally) onMount(el, params), onUnmount().
   Keeps a navigation stack for Back, and mounts one screen at a time.
   ============================================================ */

import { state } from "./state.js";
import { stopSpeaking } from "./audio.js";

const appEl = () => document.getElementById("app");

// Lazy screen loaders — keeps modules decoupled.
const screens = {
  splash:      () => import("../screens/splash.js"),
  adultGate:   () => import("../screens/adultGate.js"),
  consent:     () => import("../screens/consent.js"),
  profiles:    () => import("../screens/profiles.js"),
  cinematic:   () => import("../screens/cinematic.js"),
  ceremony:    () => import("../screens/ceremony.js"),
  avatar:      () => import("../screens/avatar.js"),
  initiation:  () => import("../screens/initiation.js"),
  sanctuary:   () => import("../screens/sanctuary.js"),
  map:         () => import("../screens/map.js"),
  realmIntro:  () => import("../screens/realmIntro.js"),
  realm:       () => import("../screens/realm.js"),
  boss:        () => import("../screens/boss.js"),
  book:        () => import("../screens/book.js"),
  wardrobe:    () => import("../screens/wardrobe.js"),
  settings:    () => import("../screens/settings.js"),
  dashboard:   () => import("../screens/dashboard.js"),
};

let current = null;      // { name, mod, el, params }
const stack = [];

export function applyBodySettings() {
  const s = state.profile?.settings || {};
  document.body.classList.toggle("dys", !!s.dys);
  document.body.classList.toggle("big", !!s.big);
  document.body.classList.toggle("calm", !!s.calm);
}

export async function go(name, params = {}, opts = {}) {
  const loader = screens[name];
  if (!loader) { console.error("[router] unknown screen", name); return; }
  stopSpeaking();

  // tear down current
  if (current) {
    if (current.mod.onUnmount) try { current.mod.onUnmount(); } catch (e) { console.warn(e); }
    if (!opts.replace) stack.push({ name: current.name, params: current.params });
  }
  if (opts.replace && stack.length) stack.pop();

  const mod = await loader();
  applyBodySettings();
  const el = mod.render(params) || document.createElement("div");
  const app = appEl();
  app.innerHTML = "";
  app.appendChild(el);
  current = { name, mod, el, params };
  if (mod.onMount) try { mod.onMount(el, params); } catch (e) { console.warn(e); }
  window.scrollTo(0, 0);
}

export function back() {
  const prev = stack.pop();
  if (prev) go(prev.name, prev.params, { replace: true, fromBack: true });
  else go("sanctuary", {}, { replace: true });
}

export function reset(name = "splash", params = {}) {
  stack.length = 0; current = null;
  go(name, params, { replace: true });
}

export function currentName() { return current?.name; }
