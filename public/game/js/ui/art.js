/* ============================================================
   art.js — inline SVG art (no external assets required).
   Provides the Story Tree, Storyling companion, and child avatar
   so the game is fully self-contained and offline-friendly.
   ============================================================ */

import { STORYLINGS } from "../data/story.js";

function svg(inner, size, vb = "0 0 100 100") {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", vb);
  s.setAttribute("width", size); s.setAttribute("height", size);
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = inner;
  return s;
}

/** The Story Tree rising from a book, with the First Crystal.
    healPct 0..1 controls how lush/glowing it looks. */
export function storyTreeArt(size = 140, healPct = 1) {
  const leaf = healPct > .66 ? "#4f9d69" : healPct > .33 ? "#7a9a5a" : "#9a9a7a";
  const glow = 0.3 + healPct * 0.7;
  return svg(`
    <defs>
      <radialGradient id="tg" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#fff3b0" stop-opacity="${glow}"/>
        <stop offset="100%" stop-color="#fff3b0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="40" r="40" fill="url(#tg)"/>
    <rect x="30" y="78" width="40" height="10" rx="3" fill="#8a5a2b"/>
    <rect x="28" y="74" width="44" height="7" rx="3" fill="#a06a34"/>
    <path d="M50 78 C48 60 47 52 50 40" stroke="#6b4423" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M50 56 C44 50 40 48 34 46 M50 52 C56 46 60 44 66 44 M50 46 C46 40 44 36 42 32 M50 44 C55 39 58 35 60 31" stroke="#6b4423" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="34" r="16" fill="${leaf}"/>
    <circle cx="36" cy="42" r="11" fill="${leaf}"/>
    <circle cx="64" cy="42" r="11" fill="${leaf}"/>
    <circle cx="43" cy="26" r="10" fill="${leaf}"/>
    <circle cx="58" cy="27" r="10" fill="${leaf}"/>
    <path d="M50 44 l4 8 l-4 8 l-4 -8 z" fill="#8fe3ff" stroke="#fff" stroke-width="1"/>
  `, size);
}

/** A Storyling companion. */
export function storylingArt(species = "spark", stage = 0, size = 90) {
  const sp = STORYLINGS.find((s) => s.id === species) || STORYLINGS[0];
  const c = sp.color;
  const wings = stage >= 2 ? `<path d="M28 50 q-16 -10 -20 4 q14 4 20 6 Z" fill="${c}" opacity=".7"/><path d="M72 50 q16 -10 20 4 q-14 4 -20 6 Z" fill="${c}" opacity=".7"/>` : "";
  const crown = stage >= 4 ? `<path d="M40 22 l4 -8 l6 6 l6 -6 l4 8 Z" fill="#f6c545"/>` : "";
  return svg(`
    <ellipse cx="50" cy="86" rx="20" ry="5" fill="rgba(0,0,0,.12)"/>
    ${wings}
    <ellipse cx="50" cy="56" rx="26" ry="24" fill="${c}"/>
    <ellipse cx="50" cy="52" rx="20" ry="17" fill="#ffffff" opacity=".18"/>
    <circle cx="41" cy="52" r="6" fill="#fff"/><circle cx="59" cy="52" r="6" fill="#fff"/>
    <circle cx="42" cy="53" r="3" fill="#2b2233"/><circle cx="58" cy="53" r="3" fill="#2b2233"/>
    <path d="M44 66 q6 6 12 0" stroke="#2b2233" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M34 34 q4 -10 10 -6 M66 34 q-4 -10 -10 -6" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${crown}
    <circle cx="70" cy="40" r="3" fill="#fff" opacity=".8"/>
  `, size);
}

/** The child Guardian avatar. */
export function avatarArt(avatar = {}, size = 90) {
  const col = avatar.color || "#6C4AB6";
  const skin = avatar.skin || "#f2c79a";
  const hair = avatar.hair || "#4a3b2f";
  const dark = shade(col, -30);
  const hat = avatar.hat ? `<text x="50" y="20" font-size="16" text-anchor="middle">${avatar.hat}</text>` : "";
  return svg(`
    <ellipse cx="50" cy="90" rx="18" ry="4" fill="rgba(0,0,0,.15)"/>
    <path d="M30 88 C28 66 30 58 34 54 L66 54 C70 58 72 66 70 88 Z" fill="${dark}"/>
    <rect x="38" y="52" width="24" height="30" rx="10" fill="${col}"/>
    <rect x="37" y="60" width="26" height="4" fill="${shade(col,25)}"/>
    <circle cx="50" cy="40" r="13" fill="${skin}"/>
    <path d="M37 40 a13 13 0 0 1 26 0 v-3 a13 13 0 0 0 -26 0 Z" fill="${hair}"/>
    <circle cx="45" cy="41" r="1.6" fill="#2b2233"/><circle cx="55" cy="41" r="1.6" fill="#2b2233"/>
    <path d="M46 47 q4 3 8 0" stroke="#b5715a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    ${hat}
  `, size);
}

/** A realm boss silhouette (colour by realm). */
export function bossArt(color = "#6C4AB6", size = 120) {
  return svg(`
    <ellipse cx="50" cy="90" rx="30" ry="6" fill="rgba(0,0,0,.18)"/>
    <path d="M24 84 C18 50 30 26 50 26 C70 26 82 50 76 84 Z" fill="${color}"/>
    <path d="M32 30 l-6 -14 l14 8 M68 30 l6 -14 l-14 8" fill="${shade(color,-20)}"/>
    <circle cx="40" cy="52" r="7" fill="#fff"/><circle cx="60" cy="52" r="7" fill="#fff"/>
    <circle cx="41" cy="53" r="3.4" fill="#2b1030"/><circle cx="59" cy="53" r="3.4" fill="#2b1030"/>
    <path d="M38 70 q12 8 24 0" stroke="#2b1030" stroke-width="3" fill="none" stroke-linecap="round"/>
  `, size);
}

export function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, r + p)); g = Math.max(0, Math.min(255, g + p)); b = Math.max(0, Math.min(255, b + p));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
