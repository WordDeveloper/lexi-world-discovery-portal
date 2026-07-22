/* Opening cinematic (S6) — The Great Fracture. Read-aloud + Next + Skip. */
import { el, button, hearButton, bgScreen } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { speak, stopSpeaking } from "../core/audio.js";
import { CANON } from "../data/story.js";
import { SCENES } from "../data/scenes.js";
import { go } from "../core/router.js";

let i = 0;

export function render() {
  hideHUD();
  i = 0;
  const who = el("div.h3", { style: { color: "var(--accent)" } });
  const line = el("p.lead", {});
  const bar = el("div.bar", { style: { maxWidth: "300px", margin: "16px auto 0" } }, [el("i")]);

  const card = el("div.card.glass.center", { style: { maxWidth: "600px" } }, [
    who, line, bar,
    el("div.row.center", { style: { marginTop: "18px" } }, [
      hearButton(() => CANON[i].text),
      button("Next", next, { size: "lg" }),
    ]),
    button("Skip intro", () => finish(), { variant: "ghost" }),
  ]);

  function paint() {
    const beat = CANON[i];
    who.textContent = beat.who;
    line.textContent = beat.text;
    bar.querySelector("i").style.width = ((i + 1) / CANON.length) * 100 + "%";
    speak(beat.text);
  }
  function next() { if (i < CANON.length - 1) { i++; paint(); } else finish(); }
  card._paint = paint;
  return bgScreen(SCENES.ceremony, [card], { scrim: 0.5 });
}

function finish() { stopSpeaking(); go("ceremony"); }
export function onMount(el0) { const c = el0.querySelector(".card"); c._paint && c._paint(); }
export function onUnmount() { stopSpeaking(); }
