/* Book of Becoming (S16) — child-facing record of growth. No scores. */
import { el, button, toast, autoSpeak } from "../ui/components.js";
import { showHUD } from "../ui/hud.js";
import { state, level, shardCount, LVL_XP } from "../core/state.js";
import { REALMS, realmById } from "../data/realms.js";
import { REALM_BADGES } from "../data/rewards.js";
import { go } from "../core/router.js";

export function render() {
  const p = state.profile;
  showHUD({ realmName: "Book of Becoming" });

  const xpInto = (p.xp % LVL_XP);
  const stats = el("div.dash-grid", {}, [
    stat("Level", level(p), "⭐"),
    stat("Heart Shards", `${shardCount(p)}/20`, "💎"),
    stat("Badges", Object.keys(p.badges).length, "🏅"),
    stat("Day streak", p.streak, "🔥"),
  ]);

  // Realm badges earned
  const badgeGrid = el("div.map-grid");
  REALMS.forEach((r) => {
    const earned = !!p.shards[r.id];
    const card = el("button.card.pad-sm", { style: { textAlign: "center", opacity: earned ? 1 : .5, cursor: earned ? "pointer" : "default" } }, [
      el("div", { style: { fontSize: "2rem" }, text: earned ? "💎" : "🔒" }),
      el("div.h3", { style: { fontSize: "1rem" }, text: REALM_BADGES[r.id] }),
      el("div.muted", { style: { fontSize: ".78rem" }, text: r.skillLabel }),
    ]);
    if (earned) card.addEventListener("click", () => showBadge(r));
    badgeGrid.appendChild(card);
  });

  return el("div.screen.no-center", {}, [
    el("div.wrap.stack", { style: { paddingTop: "60px" } }, [
      el("div.row", { style: { justifyContent: "space-between" } }, [
        el("h2.h2", { text: "📖 Book of Becoming" }),
        button("Sanctuary", () => go("sanctuary"), { variant: "ghost", icon: "🏠" }),
      ]),
      stats,
      el("div.card.pad-sm", {}, [el("div.muted", { style: { fontSize: ".85rem", marginBottom: "6px" }, text: `Progress to Level ${level(p) + 1}` }), progress(xpInto)]),
      el("h3.h3", { text: "Realms restored" }),
      badgeGrid,
    ]),
  ]);
}

function stat(k, v, icon) { return el("div.stat", {}, [el("div.k", { text: `${icon} ${k}` }), el("div.v", { text: String(v) })]); }
function progress(xpInto) { const b = el("div.bar.gold"); b.appendChild(el("i", { style: { width: (xpInto) + "%" } })); return b; }

function showBadge(r) {
  import("../ui/components.js").then(({ showModal, button }) => {
    const host = el("div.center", {}, [
      el("div", { style: { fontSize: "3rem" }, text: "💎" }),
      el("h2.h2", { text: REALM_BADGES[r.id] }),
      el("p.lead", { text: `You mastered ${r.skillLabel} and restored ${r.name}.` }),
      el("div.stack", { style: { marginTop: "12px" } }, [
        button("Replay this Realm", () => { m.close(); state.profile.currentRealm = r.id; go("realmIntro", { realmId: r.id }); }, { block: true, variant: "gold" }),
        button("Close", () => m.close(), { variant: "ghost", block: true }),
      ]),
    ]);
    const m = showModal(host);
  });
}
export function onMount() { autoSpeak("Your Book of Becoming. Here is everything you have grown."); }
