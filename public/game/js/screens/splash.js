/* Splash / title screen (S1). Brand moment + smart entry routing. */
import { el, button, autoSpeak, bgScreen, preload } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { state, activeProfile } from "../core/state.js";
import { go } from "../core/router.js";
import { SCENES } from "../data/scenes.js";

export function render() {
  hideHUD();
  const r = state.root;
  const p = activeProfile();
  preload([SCENES.ceremony]);

  const card = el("div.card.glass.center", { style: { maxWidth: "540px" } }, [
    el("div.eyebrow", { text: "StoryLight Studios" }),
    el("h1.h1", { text: "LEXI WORLD", style: { marginTop: "8px" } }),
    el("p.lead", { text: "Every child is a Guardian. Restore the world — one word at a time." }),
    el("div.stack", { style: { marginTop: "18px", alignItems: "center" } }, buttons(r, p)),
    el("p.muted", { style: { marginTop: "14px", fontSize: ".85rem" }, text: "Tip: tap 🔊 anywhere to hear it read aloud." }),
  ]);

  return bgScreen(SCENES.title, [card], { scrim: 0.4 });
}

function buttons(r, p) {
  const out = [];
  if (!r.account || !r.consent) {
    out.push(button("Begin setup", () => go("adultGate"), { size: "lg", block: true }));
  } else if (!r.profiles.length) {
    out.push(button("Add your child", () => go("profiles"), { size: "lg", block: true }));
  } else if (p && !p.reading.initiationDone) {
    out.push(button("Continue setup", () => go("cinematic"), { size: "lg", block: true }));
    out.push(button("Switch child", () => go("profiles"), { variant: "ghost", block: true }));
  } else {
    out.push(button("Play", () => go("sanctuary"), { size: "lg", block: true }));
    out.push(button("Switch child", () => go("profiles"), { variant: "ghost", block: true }));
  }
  out.push(button("For grown-ups", () => go("dashboard"), { variant: "ghost", block: true, icon: "👤" }));
  return out;
}

export function onMount() { autoSpeak("Lexi World. Every child is a Guardian."); preload([SCENES.title, SCENES.ceremony]); }
