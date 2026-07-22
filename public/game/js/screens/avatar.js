/* Avatar creation (S8). */
import { el, button, autoSpeak } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { state, save } from "../core/state.js";
import { AVATAR_COLORS } from "../data/story.js";
import { avatarArt } from "../ui/art.js";
import { go } from "../core/router.js";

export function render() {
  hideHUD();
  const p = state.profile;
  const preview = el("div", { style: { margin: "0 auto" } }, [avatarArt(p.avatar, 120)]);

  const swatches = el("div.row.center", { style: { marginTop: "10px" } });
  AVATAR_COLORS.forEach((c) => {
    const sw = el("button", { "aria-label": "colour", style: { width: "40px", height: "40px", borderRadius: "50%", background: c, border: c === p.avatar.color ? "3px solid var(--brand)" : "3px solid transparent", cursor: "pointer" } });
    sw.addEventListener("click", () => {
      p.avatar.color = c; save();
      preview.innerHTML = ""; preview.appendChild(avatarArt(p.avatar, 120));
      [...swatches.children].forEach((x) => (x.style.border = "3px solid transparent"));
      sw.style.border = "3px solid var(--brand)";
    });
    swatches.appendChild(sw);
  });

  const card = el("div.card.center", { style: { maxWidth: "560px" } }, [
    el("div.eyebrow", { text: "Your Guardian" }),
    el("h2.h2", { text: `Create ${p.name}'s hero` }),
    preview, swatches,
    el("p.muted", { style: { marginTop: "10px" }, text: "You'll earn more outfits, colours and gear as you play." }),
    el("div", { style: { height: "14px" } }),
    button("Start my quest", () => go("initiation"), { size: "lg", block: true }),
  ]);
  return el("div.screen", {}, [card]);
}
export function onMount() { autoSpeak("Create your Guardian. Pick a colour."); }
