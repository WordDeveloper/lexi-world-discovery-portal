/* ============================================================
   Boss encounter (S15). When the client provided boss art
   (Slime Marsh / Giant's Grove / Malvex) it is used as a full
   cinematic backdrop with an overlaid HUD that mirrors the
   client's boss screenshots: hero portrait + hearts + XP, boss
   name + health bar, Current Quest, Word Power meter, a phoneme/
   answer panel, and Storyling ability cards. Correct reading
   charges Word Power and weakens the boss. Wrong = "Try again"
   (never punishment). Realms without art use a themed layout.
   ============================================================ */
import { el, button, hearButton, progressBar, confetti, showModal } from "../ui/components.js";
import { imgEl, loadImage } from "../core/images.js";
import { showHUD, hideHUD, setHearts } from "../ui/hud.js";
import { speak, sfx } from "../core/audio.js";
import { state, save, level } from "../core/state.js";
import { realmById } from "../data/realms.js";
import { realmArt, CHAR } from "../data/scenes.js";
import { completeRealm, awardXP } from "../systems/progress.js";
import { REALM_BADGES } from "../data/rewards.js";
import { openActivity } from "../activities/engine.js";
import { bossArt, storylingArt, avatarArt, shade } from "../ui/art.js";
import { go } from "../core/router.js";

let realm, health, rounds, roundItems, wordPower, art;
const TOTAL = 3;

export function render({ realmId }) {
  realm = realmById(realmId);
  art = realmArt(realmId);
  health = 100; rounds = 0; wordPower = 0;
  roundItems = pickBossItems(realm, TOTAL);
  return art.bg || art.boss ? renderCinematic() : renderThemed();
}

/* ---------- cinematic (realm background + boss character art) ---------- */
function renderCinematic() {
  hideHUD(); // the boss screen carries its own overlay HUD
  const p = state.profile;
  if (art.bg) loadImage(art.bg);

  // realm background (fallback: themed gradient)
  const bg = el("div.boss-bg", { style: { backgroundImage: art.bg ? `url("${art.bg}")` : `linear-gradient(160deg, ${shade(realm.color, 15)}, ${shade(realm.color, -40)})` } });
  // boss character art centered-right (fallback: vector boss)
  const bossImg = imgEl(art.boss, {
    className: "boss-char",
    style: { position: "absolute", right: "6%", top: "16%", height: "min(56vh,460px)", filter: "drop-shadow(0 10px 30px rgba(0,0,0,.5))", zIndex: "1" },
    fallback: (() => { const d = el("div", { style: { position: "absolute", right: "8%", top: "20%", zIndex: "1" } }, [bossArt(realm.color, 200)]); return d; })(),
  });

  const hero = el("div.glasspanel", {}, [
    el("div.row", { style: { gap: "10px" } }, [
      el("div.portrait", {}, [imgEl(CHAR.guardian_portrait, { style: { width: "46px", height: "46px", objectFit: "cover" }, fallback: avatarArt(p.avatar, 46) })]),
      el("div", {}, [
        el("div", { style: { fontWeight: 800 }, text: p.name }),
        el("div.hearts", { id: "boss-hearts" }),
        el("div", { style: { fontSize: ".8rem", opacity: .9 }, text: `✨ ${p.xp} XP · Lvl ${level(p)}` }),
      ]),
    ]),
  ]);

  const centre = el("div", { style: { textAlign: "center", flex: "1" } }, [
    el("div.boss-name", { text: realm.boss }),
    el("div", { style: { color: "#e7dcff", fontSize: ".8rem", letterSpacing: ".05em" }, text: `Keeper of ${realm.name}` }),
    el("div.boss-health", { id: "boss-health" }, [el("i", { style: { width: "100%" } })]),
  ]);

  const quest = el("div.glasspanel", { style: { textAlign: "right", maxWidth: "230px" } }, [
    el("div", { style: { fontWeight: 800, color: "var(--gold)", fontSize: ".8rem", letterSpacing: ".08em" }, text: "CURRENT QUEST" }),
    el("div", { id: "boss-quest", style: { fontSize: ".9rem" }, text: `Read with your Storyling to free ${realm.boss}!` }),
    el("div", { id: "boss-count", style: { fontSize: ".8rem", opacity: .85, marginTop: "4px" }, text: `0 / ${TOTAL} rounds won` }),
  ]);

  const wp = el("div.wordpower", { title: "Word Power" }, [
    el("i", { id: "boss-wp", style: { height: "0%" } }),
    el("div.wp-ticks"),
    el("div.wp-gem", { text: "✦" }),
    el("span", { text: "WORD POWER" }),
  ]);

  const abilities = el("div.row", { style: { gap: "8px", justifyContent: "center", marginTop: "10px" } }, [
    ability("🐉", "Storyling Dash"), ability("🛡️", "Word Shield"), ability("💥", "Word Burst"),
  ]);

  const answer = el("div.boss-answer", { id: "boss-answer" });

  const ui = el("div.boss-ui", {}, [
    el("div.boss-corner", {}, [hero, centre, quest]),
    el("div", { style: { flex: 1 } }),
    el("div", {}, [answer, abilities]),
  ]);

  const scene = el("div.boss-scene", {}, [bg, bossImg, wp, ui]);
  const scr = el("div.screen", { style: { padding: 0, overflow: "hidden" } }, [scene]);
  scr._answer = answer;
  return scr;
}
function ability(ic, name) { return el("div.ability.glasspanel", { style: { padding: "8px" } }, [el("div.ic", { text: ic }), el("div", { text: name })]); }

/* ---------- themed (no client art) ---------- */
function renderThemed() {
  showHUD({ realmName: realm.name });
  const bossWrap = el("div.center", {}, [bossArt(realm.color, 130)]);
  const healthBar = el("div", { id: "boss-health" }, [progressBar(100)]);
  const quest = el("div.panel", { style: { textAlign: "center" } }, [
    el("div.h3", { text: `${realm.boss} — Keeper of ${realm.name}` }),
    el("p.muted", { id: "boss-quest", text: `Use your reading power to free ${realm.boss}!` }),
    el("div", { id: "boss-count", style: { fontSize: ".85rem", marginTop: "6px" }, text: `0 / ${TOTAL} rounds won` }),
    el("div", { id: "boss-wpwrap", style: { marginTop: "8px" } }, [el("div.muted", { style: { fontSize: ".8rem" }, text: "Word Power" }), progressBar(0, "gold")]),
  ]);
  const storyRow = el("div.center", {}, [storylingArt(state.profile.storyling.species, state.profile.storyling.stage, 74)]);
  const answer = el("div.card", { id: "boss-answer", style: { marginTop: "12px" } });
  const card = el("div.card", { style: { maxWidth: "640px", width: "100%", background: `linear-gradient(160deg, ${shade(realm.color, 20)}, ${shade(realm.color, -34)})`, border: "none" } }, [
    el("div.eyebrow", { style: { background: "rgba(255,255,255,.2)", color: "#fff" }, text: "Boss Challenge" }),
    bossWrap, healthBar, quest, storyRow,
  ]);
  const scr = el("div.screen.no-center", {}, [el("div.wrap.stack", { style: { paddingTop: "58px" } }, [card, answer])]);
  scr._answer = answer;
  scr._themed = true;
  return scr;
}

export function onMount(scr) { nextRound(scr._answer, scr._themed); speak(`Free ${realm.boss} by reading with your Storyling!`); }
export function onUnmount() { setHearts(null); }

function paintHearts(spent) {
  const c = document.getElementById("boss-hearts"); if (!c) { setHearts(3, spent); return; }
  c.innerHTML = ""; for (let i = 0; i < 3; i++) c.appendChild(el("span.heart" + (i < spent ? ".spent" : ""), { text: "❤️" }));
}

function nextRound(area, themed) {
  if (rounds >= roundItems.length) return;
  const item = roundItems[rounds];
  area.innerHTML = "";
  paintHearts(0);
  openActivity(area, item, {
    realm,
    onHearts: (t, s) => paintHearts(s),
    onSolved: () => {
      rounds++;
      health = Math.max(0, Math.round(100 - (rounds / roundItems.length) * 100));
      wordPower = Math.min(100, wordPower + Math.round(100 / TOTAL));
      const hb = document.querySelector("#boss-health i"); if (hb) hb.style.width = health + "%";
      const wpEl = document.getElementById("boss-wp"); if (wpEl) wpEl.style.height = wordPower + "%";
      const wpBar = document.querySelector("#boss-wpwrap .bar i"); if (wpBar) wpBar.style.width = wordPower + "%";
      const cnt = document.getElementById("boss-count"); if (cnt) cnt.textContent = `${rounds} / ${TOTAL} rounds won`;
      sfx.reward();
      if (health <= 0) return victory();
      const q = document.getElementById("boss-quest"); if (q) q.textContent = "Great reading! The Realm is healing — keep going!";
      setTimeout(() => nextRound(area, themed), 700);
    },
  });
}

function victory() {
  setHearts(null);
  awardXP("bossDefeated", { coins: 20 });
  const replay = completeRealm(realm.id);
  state.profile.lastSession = { realmId: realm.id, realmName: realm.name, ts: Date.now() };
  save();
  confetti(60); sfx.shard();
  const isFinal = realm.id === 20;
  const badge = REALM_BADGES[realm.id];
  const host = el("div.center", {}, [
    el("h2.h2", { text: isFinal ? "The Story Tree awakens! 🌳" : `${realm.name} is restored! 💎` }),
    el("div", { style: { margin: "8px auto" } }, [storylingArt(state.profile.storyling.species, state.profile.storyling.stage, 96)]),
    el("p.lead", { text: isFinal ? "You restored every Heart Shard and freed Lexi World from the Forgetting. You are a true Master Reader!" : `You freed ${realm.boss} and earned the "${badge}" badge.` }),
    el("p.muted", { text: replay ? "Replay bonus added." : "+150 XP · Heart Shard restored · Storyling grew stronger." }),
    el("div.stack", { style: { marginTop: "14px" } }, [
      button("See my Book of Becoming", () => { m.close(); go("book"); }, { block: true }),
      button(isFinal ? "Return to the Sanctuary" : "Continue", () => { m.close(); go(isFinal ? "sanctuary" : "map"); }, { size: "lg", block: true, variant: "gold" }),
    ]),
  ]);
  const m = showModal(host, { dismissible: false });
  speak(isFinal ? "The Story Tree awakens. You are a Master Reader." : `${realm.name} is restored.`);
}

function pickBossItems(realm, n) {
  const pref = realm.items.filter((i) => i.type === "decode" || i.type === "build" || i.type === "listen");
  const pool = pref.length ? pref : realm.items;
  const out = []; for (let i = 0; i < n; i++) out.push(pool[i % pool.length]); return out;
}
