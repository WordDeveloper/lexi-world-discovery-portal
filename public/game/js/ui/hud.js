/* ============================================================
   hud.js — the in-game heads-up display (top bar).
   Shows realm name, hearts (during an activity), XP, level, shards.
   Child-facing only: never shows reading level, scores, or labels.
   ============================================================ */

import { el } from "./components.js";
import { state, level, shardCount } from "../core/state.js";
import { REGION_COUNT } from "../data/realms.js";

const layer = () => document.getElementById("hud-layer");
let heartState = null; // {total, spent} or null

export function showHUD({ realmName = "", hearts = null } = {}) {
  heartState = hearts;
  render(realmName);
}
export function hideHUD() { layer().innerHTML = ""; heartState = null; }

export function setHearts(total, spent) { heartState = total == null ? null : { total, spent }; renderHearts(); }

function render(realmName) {
  const p = state.profile || {};
  layer().innerHTML = "";
  const top = el("div.hud-top");
  const left = el("div.row");
  if (realmName) left.appendChild(el("div.hud-chip", {}, [el("span", { text: "🗺️" }), el("span", { text: realmName })]));
  const heartsChip = el("div.hud-chip.hearts-chip", { id: "hud-hearts" });
  left.appendChild(heartsChip);

  const right = el("div.row");
  right.appendChild(el("div.hud-chip", { title: "Level" }, [el("span", { text: "⭐" }), el("span", { text: "Lvl " + level(p) })]));
  right.appendChild(el("div.hud-chip", { title: "Experience" }, [el("span", { text: "✨" }), el("span", { text: (p.xp || 0) + " XP" })]));
  if (state.root.coinsEnabled) right.appendChild(el("div.hud-chip", {}, [el("span", { text: "🪙" }), el("span", { text: String(p.coins || 0) })]));
  right.appendChild(el("div.hud-chip", { title: "Heart Shards restored" }, [el("span", { text: "💎" }), el("span", { text: shardCount(p) + "/" + REGION_COUNT })]));

  top.appendChild(left); top.appendChild(right);
  layer().appendChild(top);
  renderHearts();
}

function renderHearts() {
  const c = document.getElementById("hud-hearts");
  if (!c) return;
  c.innerHTML = "";
  if (!heartState) { c.style.display = "none"; return; }
  c.style.display = "inline-flex";
  const wrap = el("div.hearts", { "aria-label": `${heartState.total - heartState.spent} of ${heartState.total} hearts` });
  for (let i = 0; i < heartState.total; i++) {
    wrap.appendChild(el("span.heart" + (i < heartState.spent ? ".spent" : ""), { text: "❤️" }));
  }
  c.appendChild(wrap);
}
