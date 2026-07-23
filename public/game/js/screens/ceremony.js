/* Storyling ceremony (S7) — the Story Tree chooses the companion. */
import { el, button, hearButton, confetti, bgScreen } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { speak, sfx, stopSpeaking } from "../core/audio.js";
import { state, save } from "../core/state.js";
import { CEREMONY, STORYLINGS } from "../data/story.js";
import { SCENES, storylingImg } from "../data/scenes.js";
import { storylingArt, storyTreeArt } from "../ui/art.js";
import { imgEl } from "../core/images.js";
import { go } from "../core/router.js";

let i = 0, chosen = null;

export function render() {
  hideHUD();
  i = 0;
  // The Story Tree chooses (not the player), per the Storylings spec.
  chosen = STORYLINGS[Math.floor(Math.random() * STORYLINGS.length)];

  const stage = el("div", { style: { minHeight: "160px", display: "grid", placeItems: "center" } });
  const title = el("div.h3", { style: { color: "var(--accent)" } });
  const line = el("p.lead", {});
  const bar = el("div.bar", { style: { maxWidth: "300px", margin: "14px auto 0" } }, [el("i")]);

  const card = el("div.card.glass.center", { style: { maxWidth: "600px" } }, [
    stage, title, line, bar,
    el("div.row.center", { style: { marginTop: "16px" } }, [
      hearButton(() => CEREMONY[i].text),
      button("Next", next, { size: "lg" }),
    ]),
  ]);

  function paint() {
    const beat = CEREMONY[i];
    title.textContent = `${beat.step}. ${beat.title}`;
    line.textContent = beat.text;
    bar.querySelector("i").style.width = ((i + 1) / CEREMONY.length) * 100 + "%";
    stage.innerHTML = "";
    if (i < 2) stage.appendChild(storyTreeArt(140, 0.6));
    else { stage.appendChild(imgEl(storylingImg(0), { style: { height: "150px" }, fallback: storylingArt(chosen.id, 0, 120) })); if (i >= 2) sfx.open(); }
    speak(beat.text);
  }
  function next() {
    if (i < CEREMONY.length - 1) { i++; paint(); }
    else {
      const p = state.profile;
      p.storyling = { species: chosen.id, stage: 0, name: chosen.name };
      save();
      confetti(30); sfx.reward();
      go("avatar");
    }
  }
  card._paint = paint;
  return bgScreen(SCENES.ceremony, [card], { scrim: 0.5 });
}
export function onMount(el0) { el0.querySelector(".card")._paint(); }
export function onUnmount() { stopSpeaking(); }
