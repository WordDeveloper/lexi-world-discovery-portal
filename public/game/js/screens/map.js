/* Realm Map (S11) — 20 realms with locked / current / completed states. */
import { el, button, toast, autoSpeak } from "../ui/components.js";
import { showHUD } from "../ui/hud.js";
import { state } from "../core/state.js";
import { REALMS } from "../data/realms.js";
import { shade } from "../ui/art.js";
import { REALM_BG } from "../data/scenes.js";
import { preload } from "../ui/components.js";
import { go, back } from "../core/router.js";

export function render() {
  const p = state.profile;
  showHUD({ realmName: "Realm Map" });

  const grid = el("div.map-grid");
  REALMS.forEach((r) => {
    const unlocked = r.id <= p.unlockedRealm;
    const done = !!p.shards[r.id];
    const current = r.id === p.currentRealm && unlocked && !done;
    const state_ = done ? "💎" : unlocked ? r.id : "🔒";
    const tag = done ? "Restored ✓ · replay" : unlocked ? (current ? "Today's Realm — tap!" : "Tap to enter") : "Locked";

    // realm artwork as the card image, with a dark gradient over it for text readability
    const bgUrl = REALM_BG[r.id];
    const overlay = "linear-gradient(180deg, rgba(10,8,26,.15), rgba(10,8,26,.72))";
    const card = el("button.realm-card" + (unlocked ? "" : ".locked"), {
      style: {
        backgroundImage: bgUrl ? `${overlay}, url("${bgUrl}")` : `linear-gradient(160deg, ${r.color}, ${shade(r.color, -28)})`,
        backgroundSize: "cover", backgroundPosition: "center",
        boxShadow: current ? "0 0 0 3px var(--gold), var(--shadow-lift)" : "",
      },
      "aria-label": `${r.name}. ${r.skillLabel}. ${tag}`,
    }, [
      el("div.rstate", { text: String(state_) }),
      el("div", {}, [
        el("div.rname", { text: r.name }),
        el("div.rskill", { text: r.skillLabel }),
      ]),
      el("div.rtag", { text: tag }),
    ]);
    card.addEventListener("click", () => {
      if (!unlocked) { toast("Restore the Realm before this one to unlock it."); return; }
      p.currentRealm = r.id; go("realmIntro", { realmId: r.id });
    });
    grid.appendChild(card);
  });

  return el("div.screen.no-center", {}, [
    el("div.wrap.stack", { style: { paddingTop: "62px" } }, [
      el("div.row", { style: { justifyContent: "space-between", alignItems: "center" } }, [
        el("h2.h2", { text: "The World of Lexi" }),
        button("Sanctuary", () => go("sanctuary"), { variant: "ghost", icon: "🏠" }),
      ]),
      el("p.muted", { text: "Every child sees the same story, but you begin where you need to. You don't have to replay earlier Realms." }),
      grid,
    ]),
  ]);
}
export function onMount() { autoSpeak("Choose a Realm to restore."); preload(Object.values(REALM_BG)); }
