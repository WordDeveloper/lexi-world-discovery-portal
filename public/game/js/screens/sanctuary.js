/* Sanctuary hub (S10) — the Story Tree heals with progress.
   Child-facing only: no scores/labels. Central navigation. */
import { el, button, hearButton, autoSpeak, bgScreen } from "../ui/components.js";
import { imgEl } from "../core/images.js";
import { showHUD } from "../ui/hud.js";
import { state, markDay, shardCount } from "../core/state.js";
import { awardXP, checkAchievements } from "../systems/progress.js";
import { KEEPER_LINES } from "../data/story.js";
import { REGION_COUNT, realmById } from "../data/realms.js";
import { storyTreeArt, storylingArt } from "../ui/art.js";
import { SCENES, storylingImg } from "../data/scenes.js";
import { go } from "../core/router.js";

export function render() {
  const p = state.profile;
  markDay();
  // daily-return XP once per day
  const today = new Date().toDateString();
  if (p._lastXpDay !== today) { p._lastXpDay = today; awardXP("dailyReturn"); }
  checkAchievements();
  showHUD({ realmName: "Sanctuary" });

  const heal = shardCount(p) / REGION_COUNT;
  const last = p.lastSession;
  const recap = last
    ? KEEPER_LINES.welcomeBack(p.name, last.realmName)
    : `Welcome, ${p.name}. The Story Tree sleeps. Restore the Realms to wake it.`;

  const comp = el("div", { style: { position: "absolute", right: "6%", bottom: "6%", zIndex: 2 } }, [
    imgEl(storylingImg(p.storyling.stage), { style: { height: "120px" }, fallback: storylingArt(p.storyling.species, p.storyling.stage, 90) }),
  ]);

  const keeper = el("div.panel", { style: { maxWidth: "560px", margin: "0 auto" } }, [
    el("div.row", { style: { justifyContent: "space-between" } }, [
      el("div.h3", { text: "🌳 The Keeper" }),
      hearButton(recap, { label: "Hear" }),
    ]),
    el("p", { style: { marginTop: "6px" }, text: recap }),
  ]);

  const nav = el("div.row.center", { style: { marginTop: "18px", flexWrap: "wrap" } }, [
    button("Realm Map", () => go("map"), { size: "lg", icon: "🗺️" }),
    button("Book of Becoming", () => go("book"), { variant: "ghost", icon: "📖" }),
    button("My Hero", () => go("wardrobe"), { variant: "ghost", icon: "🦸" }),
    button("Settings", () => go("settings"), { variant: "ghost", icon: "⚙️" }),
  ]);

  const primary = el("div.center", { style: { marginTop: "10px" } }, [
    button(`Continue in ${realmById(p.currentRealm)?.name || "your Realm"}`, () => go("map"), { size: "lg", variant: "gold", icon: "✨" }),
  ]);

  const content = el("div.wrap.stack", { style: { paddingTop: "64px", textAlign: "center" } }, [
    el("h2.h2.onart-title", { text: "The Sanctuary" }),
    el("p", { style: { color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.6)", fontWeight: 700 }, text: `Heart Shards restored: ${shardCount(p)} / ${REGION_COUNT}` }),
    primary, keeper, nav,
  ]);
  const scr = bgScreen(SCENES.sanctuary, [content, comp], { scrim: 0.35, noCenter: true });
  return scr;
}
export function onMount() { autoSpeak("Welcome to the Sanctuary."); }
