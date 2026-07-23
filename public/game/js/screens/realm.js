/* ============================================================
   Realm world (S13) — canvas exploration + path + walking avatar
   + Storyling. Reaching a glowing node opens a learning activity.
   The main loop locks while an activity is open (activeNode guard —
   the fix for the prototype's re-open/reshuffle bug). After all
   skill nodes are cleared, an independent mastery check runs, then
   the boss. Fully responsive; tap or arrow keys to move.
   ============================================================ */
import { el, button, toast, showModal, closeModal } from "../ui/components.js";
import { showHUD, setHearts } from "../ui/hud.js";
import { speak, sfx, startAmbient, stopAmbient } from "../core/audio.js";
import { state, save } from "../core/state.js";
import { realmById, CRYSTALS_PER_REALM } from "../data/realms.js";
import { awardXP, recordResponse } from "../systems/progress.js";
import { openActivity } from "../activities/engine.js";
import { shade } from "../ui/art.js";
import { getImage, loadImage } from "../core/images.js";
import { REALM_BG, CHAR, storylingImg } from "../data/scenes.js";
import { go } from "../core/router.js";

let cv, ctx, W, H, horizon, raf, running;
let realm, th, player, storyling, nodes, pathPts, activeNode, cleared, keys, markers;

// perspective scale: things lower on screen (closer) are larger
function depth(y) { return Math.max(0.62, Math.min(1.3, 0.66 + 0.6 * ((y - horizon) / (H - horizon)))); }

export function render({ realmId }) {
  realm = realmById(realmId);
  th = themeFor(realm);
  showHUD({ realmName: realm.name });

  cv = el("canvas", { id: "realm-canvas" });
  const hint = el("div.toast", { id: "realm-hint", style: { position: "absolute", bottom: "18px" } , text: "Tap the path to walk. Reach a glowing crystal ✦" });
  const dpad = buildDpad();
  const backBtn = el("button.btn.ghost", { text: "🗺️ Map", style: { position: "absolute", top: "56px", right: "12px", zIndex: 5 } });
  backBtn.addEventListener("click", () => go("map"));
  const pauseBtn = el("button.btn.ghost", { text: "⏸", style: { position: "absolute", top: "56px", left: "12px", zIndex: 5 } });
  pauseBtn.addEventListener("click", pause);

  const scr = el("div.screen", { style: { padding: 0, overflow: "hidden" } }, [cv, dpad, backBtn, pauseBtn, hint]);
  return scr;
}

export function onMount(scr, { realmId }) {
  keys = {}; markers = []; activeNode = null; cleared = 0;
  loadImage(REALM_BG[realm.id]); loadImage(CHAR.guardian_idle); loadImage(storylingImg(state.profile.storyling.stage));
  resize();
  buildLevel();
  startAmbient();
  cv.addEventListener("pointerdown", onTap);
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKeyUp);
  running = true; loop();
  speak(`Welcome to ${realm.name}. Tap the path to walk to a glowing crystal.`);
}
export function onUnmount() {
  running = false; cancelAnimationFrame(raf); stopAmbient();
  window.removeEventListener("resize", resize);
  window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
}

/* ---------- setup ---------- */
function resize() {
  if (!cv) return;
  W = cv.width = cv.clientWidth || window.innerWidth;
  H = cv.height = cv.clientHeight || window.innerHeight;
  horizon = Math.round(H * 0.42);
  ctx = cv.getContext("2d");
  if (pathPts) layout();
}
function buildLevel() {
  const p = state.profile;
  const rp = (p.realmProgress[realm.id] = p.realmProgress[realm.id] || { nodes: {}, bossDone: false });
  layout();
  // choose a varied set of items for the skill nodes
  const items = pickItems(realm, CRYSTALS_PER_REALM);
  nodes = items.map((item, i) => ({ x: 0, y: 0, idx: i, item, done: !!rp.nodes[i] }));
  placeNodes();
  cleared = nodes.filter((n) => n.done).length;
  player = { x: pathPts[0].x, y: pathPts[0].y, tx: pathPts[0].x, ty: pathPts[0].y, moving: false, face: 1, walk: 0, spd: 3.6 };
  storyling = { x: player.x - 30, y: player.y };
}
function layout() {
  const start = { x: W * 0.5, y: H - 70 }, c0 = { x: W * 0.3, y: H * 0.72 }, c1 = { x: W * 0.72, y: H * 0.58 },
    c2 = { x: W * 0.36, y: horizon + (H - horizon) * 0.24 }, end = { x: W * 0.6, y: horizon + (H - horizon) * 0.08 };
  pathPts = catmull([start, c0, c1, c2, end], 22);
  window._end = end;
}
function placeNodes() {
  // spread nodes along the path (excluding the very ends)
  const n = nodes.length;
  nodes.forEach((nd, i) => {
    const t = Math.floor(pathPts.length * (0.2 + 0.6 * (i / Math.max(1, n - 1))));
    const p = pathPts[Math.min(pathPts.length - 2, t)];
    nd.x = p.x; nd.y = p.y;
  });
}

/* ---------- input ---------- */
function onTap(e) {
  if (activeNode || !running) return;
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
  if (y < 60) return;
  player.tx = Math.max(16, Math.min(W - 16, x));
  player.ty = Math.max(horizon + 24, Math.min(H - 14, y));
  player.moving = true;
  markers.push({ x: player.tx, y: player.ty, t: performance.now() });
}
function onKey(e) { const k = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[e.key]; if (k) { keys[k] = true; e.preventDefault(); } }
function onKeyUp(e) { const k = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[e.key]; if (k) keys[k] = false; }
function buildDpad() {
  const wrap = el("div", { style: { position: "absolute", left: "14px", bottom: "20px", display: "grid", gridTemplateColumns: "repeat(3,44px)", gridTemplateRows: "repeat(3,44px)", gap: "4px", zIndex: 5, opacity: .9 } });
  const mk = (label, dir, col, row) => { const b = el("button.btn.ghost", { text: label, style: { minHeight: "44px", minWidth: "44px", padding: 0, gridColumn: col, gridRow: row } }); b.addEventListener("pointerdown", () => keys[dir] = true); b.addEventListener("pointerup", () => keys[dir] = false); b.addEventListener("pointerleave", () => keys[dir] = false); return b; };
  wrap.append(mk("▲", "up", 2, 1), mk("◀", "left", 1, 2), mk("▶", "right", 3, 2), mk("▼", "down", 2, 3));
  return wrap;
}

/* ---------- loop ---------- */
function loop() { if (!running) return; update(); draw(); raf = requestAnimationFrame(loop); }
function update() {
  if (activeNode) return; // locked while an activity is open (bug-fix guard)
  let moved = false;
  const uk = keys.up || keys.down || keys.left || keys.right;
  if (uk) {
    let dx = 0, dy = 0; if (keys.up) dy--; if (keys.down) dy++; if (keys.left) dx--; if (keys.right) dx++;
    if (dx || dy) { const m = Math.hypot(dx, dy); player.x += dx / m * player.spd; player.y += dy / m * player.spd; if (dx) player.face = dx > 0 ? 1 : -1; moved = true; }
    player.tx = player.x; player.ty = player.y;
  } else if (player.moving) {
    const dx = player.tx - player.x, dy = player.ty - player.y, d = Math.hypot(dx, dy);
    if (d < 3) player.moving = false; else { const sp = Math.min(player.spd, d); player.x += dx / d * sp; player.y += dy / d * sp; if (Math.abs(dx) > .5) player.face = dx > 0 ? 1 : -1; moved = true; }
  }
  player.x = Math.max(16, Math.min(W - 16, player.x)); player.y = Math.max(horizon + 24, Math.min(H - 14, player.y));
  player.walk += moved ? 0.28 : 0; player._moving = moved;
  // storyling follows
  const sdx = player.x - 26 * player.face - storyling.x, sdy = player.y + 6 - storyling.y, sd = Math.hypot(sdx, sdy);
  if (sd > 4) { storyling.x += sdx * 0.12; storyling.y += sdy * 0.12; }
  // node proximity
  for (const nd of nodes) { if (nd.done) continue; if (Math.hypot(player.x - nd.x, player.y - nd.y) < 36) { player.moving = false; openNode(nd); return; } }
  // boss gateway when all cleared
  if (cleared >= nodes.length) { const e = window._end; if (Math.hypot(player.x - e.x, player.y - e.y) < 44) { player.moving = false; startMasteryCheck(); return; } }
  markers = markers.filter((m) => performance.now() - m.t < 1400);
}

/* ---------- activity node ---------- */
function openNode(nd) {
  activeNode = nd;                       // locks the loop
  const host = el("div");
  const modal = showModal(host, { dismissible: false });
  setHearts(3, 0);
  openActivity(host, nd.item, {
    realm,
    onHearts: (t, s) => setHearts(t, s),
    onSolved: ({ supported }) => {
      nd.done = true; cleared++;
      const p = state.profile; p.realmProgress[realm.id].nodes[nd.idx] = true;
      awardXP(supported ? "correctionAfterSupport" : "independentCorrect", { coins: 3 });
      save();
      sfx.reward();
      closeModal(modal.scrim); setHearts(null);
      activeNode = null;
      if (cleared >= nodes.length) { showHint("All crystals restored! Walk to the glowing gate ✦"); speak("Wonderful! Now walk to the glowing gate."); }
      else showHint(`Crystal restored! (${cleared}/${nodes.length})`);
    },
  });
}

/* ---------- independent mastery check (no hints/hearts shown) ---------- */
function startMasteryCheck() {
  activeNode = { mastery: true };
  const item = pickItems(realm, 1, true)[0];
  const host = el("div");
  const modal = showModal(host, { dismissible: false });
  host.append(
    el("div.eyebrow", { text: "Mastery Challenge — on your own" }),
    el("p.prompt.center", { style: { marginTop: "8px" }, text: "Show what you can do without help!" }),
  );
  const area = el("div");
  host.appendChild(area);
  openActivity(area, item, {
    realm, hideHearts: true,
    onSolved: ({ supported }) => {
      recordResponse({ realmId: realm.id, skillId: realm.skill, format: "mastery", correct: true, supportLevel: supported ? 1 : 0 });
      awardXP("masteryChallenge");
      closeModal(modal.scrim); activeNode = null;
      running = false; cancelAnimationFrame(raf);
      go("boss", { realmId: realm.id });
    },
  });
}

/* ---------- drawing ---------- */
function draw() {
  const now = performance.now() / 1000;
  const bgImg = getImage(REALM_BG[realm.id]);
  if (bgImg) {
    // cover-fit the realm artwork as the scene background
    const s = Math.max(W / bgImg.width, H / bgImg.height);
    const dw = bgImg.width * s, dh = bgImg.height * s;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + 50); sky.addColorStop(0, th.sky1); sky.addColorStop(1, th.sky2);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 50);
    drawSun(now);
    const g = ctx.createLinearGradient(0, horizon, 0, H); g.addColorStop(0, th.g1); g.addColorStop(1, th.g2);
    ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);
    drawHills();
  }
  drawPath();
  markers.forEach(drawMarker);
  // gate at end when cleared
  if (cleared >= nodes.length) drawGate(now);
  // depth-sorted actors
  const sp = [];
  nodes.forEach((n) => sp.push({ y: n.y, d: () => n.done ? drawCleared(n) : drawCrystal(n, now) }));
  sp.push({ y: storyling.y, d: () => drawStoryling(now) });
  sp.push({ y: player.y, d: () => drawPlayer(now) });
  sp.sort((a, b) => a.y - b.y).forEach((s) => s.d());
}
function drawSun(now) {
  const x = W * 0.82, y = horizon * 0.42; const col = th.light === "sunset" ? "#ffb867" : th.light === "twilight" ? "#f4f1ff" : "#fff3b0";
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 40; ctx.fill(); ctx.restore();
  if (th.light === "twilight") { for (let i = 0; i < 40; i++) { const sx = (i * 97.3) % W, sy = (i * 53.7) % (horizon * 0.9); ctx.globalAlpha = .4 + .5 * Math.abs(Math.sin(now * 1.5 + i)); ctx.fillStyle = "#fff"; ctx.fillRect(sx, sy, 2, 2); } ctx.globalAlpha = 1; }
}
function drawHills() { [{ c: shade(th.g1, 30), o: horizon - 8 }, { c: shade(th.g1, 12), o: horizon + 10 }].forEach((L, li) => { ctx.fillStyle = L.c; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, L.o + Math.sin(x / 160 + li * 2) * 16); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); }); }
function drawPath() {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  const stroke = () => { ctx.beginPath(); pathPts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); };
  ctx.strokeStyle = "rgba(120,90,50,.3)"; ctx.lineWidth = 40; stroke();
  ctx.strokeStyle = "#e7cd94"; ctx.lineWidth = 28; stroke();
  ctx.setLineDash([10, 16]); ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3; stroke(); ctx.setLineDash([]);
  ctx.restore();
}
function drawMarker(m) { const age = (performance.now() - m.t) / 1400, r = 8 + age * 26; ctx.save(); ctx.globalAlpha = (1 - age) * .8; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(m.x, m.y, r, r * .5, 0, 0, 7); ctx.stroke(); ctx.restore(); }
function drawCrystal(n, now) {
  const bob = Math.sin(now * 2 + n.idx) * 4, x = n.x, y = n.y;
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 4, 18, 6, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.fill();
  ctx.translate(x, y - 26 - bob); ctx.shadowColor = "#8fe3ff"; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(11, -2); ctx.lineTo(7, 15); ctx.lineTo(-7, 15); ctx.lineTo(-11, -2); ctx.closePath();
  const g = ctx.createLinearGradient(0, -16, 0, 15); g.addColorStop(0, "#bff0ff"); g.addColorStop(1, "#3aa6e0"); ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.fillText(iconFor(n.item.type), 0, -24);
  ctx.restore();
}
function drawCleared(n) { ctx.save(); ctx.font = "26px serif"; ctx.textAlign = "center"; ctx.fillText("⭐", n.x, n.y - 18); ctx.restore(); }
function drawGate(now) { const e = window._end, x = e.x, y = e.y, bob = Math.sin(now * 2) * 5; ctx.save(); for (let i = 0; i < 8; i++) { const a = now * 1.5 + i * Math.PI / 4, rr = 22 + Math.sin(now * 3 + i) * 6; ctx.globalAlpha = .6; ctx.fillStyle = "#ffd6f2"; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y - 24 + Math.sin(a) * rr, 2.4, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.fillText("💎", x, y - 16 - bob); ctx.restore(); }
function drawStoryling(now) {
  const it = state.profile.storyling; const col = { spark: "#7bbf5a", lumi: "#f0a24a", nixie: "#6db6e8", pip: "#b48be0" }[it.species] || "#7bbf5a";
  const bob = Math.sin(now * 4) * 2, x = storyling.x, y = storyling.y;
  const simg = getImage(storylingImg(it.stage));
  if (simg) {
    const h = 62 * depth(y), iw = simg.width * (h / simg.height);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 6, iw * .35, 4, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fill();
    ctx.drawImage(simg, x - iw / 2, y - h - bob, iw, h); ctx.restore();
    return;
  }
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 8, 10, 3, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - bob, 13, 12, 0, 0, 7); ctx.fillStyle = col; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 4, y - bob - 1, 3, 0, 7); ctx.arc(x + 4, y - bob - 1, 3, 0, 7); ctx.fill();
  ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x - 4, y - bob - 1, 1.4, 0, 7); ctx.arc(x + 4, y - bob - 1, 1.4, 0, 7); ctx.fill(); ctx.restore();
}
function drawPlayer(now) {
  const x = player.x, y = player.y, mv = player._moving, w = player.walk, swing = mv ? Math.sin(w) * .5 : 0, bob = mv ? Math.abs(Math.sin(w)) * 2 : Math.sin(now * 2) * 1.2;
  const gimg = getImage(CHAR.guardian_idle);
  if (gimg) {
    const h = 120 * (depth(y) * .95), iw = gimg.width * (h / gimg.height);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y + 2, iw * .35, 6, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fill();
    ctx.translate(x, y - bob); ctx.scale(player.face, 1);
    ctx.drawImage(gimg, -iw / 2, -h, iw, h);
    ctx.restore();
    ctx.save(); ctx.fillStyle = "rgba(46,41,90,.92)"; ctx.font = "bold 13px Baloo 2, sans-serif"; ctx.textAlign = "center"; ctx.fillText(state.profile.name, x, y + 18); ctx.restore();
    return;
  }
  const col = state.profile.avatar.color, dark = shade(col, -40), skin = state.profile.avatar.skin || "#f2c79a", hair = state.profile.avatar.hair || "#4a3b2f";
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.ellipse(0, 2, 14, 5, 0, 0, 7); ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fill();
  ctx.scale(player.face, 1); ctx.translate(0, -bob);
  // legs
  ctx.strokeStyle = dark; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-3 + Math.sin(swing) * 5, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(3 - Math.sin(swing) * 5, -1); ctx.stroke();
  // body
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-8, -30); ctx.quadraticCurveTo(-10, -16, -6, -11); ctx.lineTo(6, -11); ctx.quadraticCurveTo(10, -16, 8, -30); ctx.closePath(); ctx.fill();
  // arms
  ctx.strokeStyle = col; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-7, -28); ctx.lineTo(-9 + Math.sin(-swing) * 4, -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, -28); ctx.lineTo(9 + Math.sin(swing) * 4, -18); ctx.stroke();
  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -38, 8, 0, 7); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -40, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(-8, -41, 16, 3);
  ctx.fillStyle = "#2b2233"; ctx.beginPath(); ctx.arc(3, -37, 1.4, 0, 7); ctx.fill();
  ctx.restore();
  // name
  ctx.save(); ctx.fillStyle = "rgba(46,41,90,.92)"; ctx.font = "bold 13px Baloo 2, sans-serif"; ctx.textAlign = "center"; ctx.fillText(state.profile.name, x, y + 18); ctx.restore();
}

/* ---------- helpers ---------- */
function showHint(t) { const h = document.getElementById("realm-hint"); if (!h) return; h.textContent = t; h.style.display = "block"; clearTimeout(showHint._t); showHint._t = setTimeout(() => (h.style.display = "none"), 3600); }
function pause() {
  running = false;
  const host = el("div.center", {}, [
    el("h2.h2", { text: "Paused" }),
    el("p.muted", { text: "Take your time — nothing is lost." }),
    el("div.stack", { style: { marginTop: "14px" } }, [
      button("Resume", () => { m.close(); running = true; loop(); }, { size: "lg", block: true }),
      button("Settings", () => go("settings"), { variant: "ghost", block: true }),
      button("Realm Map", () => go("map"), { variant: "ghost", block: true }),
      button("Sanctuary", () => go("sanctuary"), { variant: "ghost", block: true }),
    ]),
  ]);
  const m = showModal(host);
}
function catmull(P, seg) { const pts = [P[0]]; const cp = [P[0], ...P, P[P.length - 1]]; for (let i = 1; i < cp.length - 2; i++) { const p0 = cp[i - 1], p1 = cp[i], p2 = cp[i + 1], p3 = cp[i + 2]; for (let s = 1; s <= seg; s++) { const t = s / seg, t2 = t * t, t3 = t2 * t; pts.push({ x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3), y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) }); } } return pts; }
function iconFor(t) { return { choose: "❓", listen: "👂", build: "🧩", trace: "✏️", decode: "📖" }[t] || "✦"; }
function pickItems(realm, count, avoidUsed) {
  // Prefer a variety of activity types so mastery spans >1 format.
  const byType = {}; realm.items.forEach((i) => { (byType[i.type] = byType[i.type] || []).push(i); });
  const types = Object.keys(byType);
  const out = [];
  let ti = 0;
  while (out.length < count) {
    const t = types[ti % types.length]; const pool = byType[t];
    const it = pool[Math.floor(Math.random() * pool.length)];
    out.push(it); ti++;
    if (ti > count * 4) break;
  }
  return out.slice(0, count);
}
function themeFor(realm) {
  const light = realm.light || "sun";
  const g1 = shade(realm.color, 8), g2 = shade(realm.color, -30);
  const sky1 = light === "twilight" ? "#2a2350" : light === "sunset" ? "#ffd9a8" : "#bfe3ff";
  const sky2 = light === "twilight" ? "#6a5aa0" : light === "sunset" ? "#ffe9c8" : "#eaf6ff";
  return { light, g1, g2, sky1, sky2 };
}
