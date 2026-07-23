/* My Hero (S17) — avatar + Storyling growth + customisation.
   Reward shop (coins) only appears if enabled (FLAG Q20). */
import { el, button, toast, autoSpeak } from "../ui/components.js";
import { imgEl } from "../core/images.js";
import { showHUD } from "../ui/hud.js";
import { state, save } from "../core/state.js";
import { AVATAR_COLORS, STORYLING_STAGES } from "../data/story.js";
import { avatarArt, storylingArt } from "../ui/art.js";
import { CHAR, storylingImg } from "../data/scenes.js";
import { go } from "../core/router.js";

// illustrated hero image with SVG fallback
const heroImg = (avatar, size) => imgEl(CHAR.guardian_idle, { style: { height: size + "px" }, fallback: avatarArt(avatar, size) });
const compImg = (species, stage, size) => imgEl(storylingImg(stage), { style: { height: size + "px" }, fallback: storylingArt(species, stage, size) });

const HATS = [{ id: "cap", e: "🧢", cost: 30 }, { id: "bow", e: "🎀", cost: 30 }, { id: "crown", e: "👑", cost: 80 }];

export function render() {
  const p = state.profile;
  showHUD({ realmName: "My Hero" });

  const preview = el("div.center", {}, [heroImg(p.avatar, 150)]);
  const colours = el("div.row.center");
  AVATAR_COLORS.forEach((c) => {
    const sw = el("button", { "aria-label": "colour", style: { width: "38px", height: "38px", borderRadius: "50%", background: c, border: c === p.avatar.color ? "3px solid var(--brand)" : "3px solid transparent", cursor: "pointer" } });
    sw.addEventListener("click", () => { p.avatar.color = c; save(); preview.innerHTML = ""; preview.appendChild(heroImg(p.avatar, 150)); [...colours.children].forEach((x) => x.style.border = "3px solid transparent"); sw.style.border = "3px solid var(--brand)"; });
    colours.appendChild(sw);
  });

  // hats — owned via play; buy with coins only if enabled
  const hats = el("div.row.center");
  HATS.forEach((h) => {
    const owned = p.ownedItems["hat_" + h.id];
    const equipped = p.avatar.hat === h.e;
    const b = el("button.btn.ghost", { text: `${h.e} ${owned ? (equipped ? "Worn" : "Wear") : (state.root.coinsEnabled ? "🪙" + h.cost : "Locked")}` });
    b.addEventListener("click", () => {
      if (!owned) {
        if (!state.root.coinsEnabled) { toast("Earn this by playing more Realms!"); return; }
        if (p.coins < h.cost) { toast("Not enough coins yet — keep learning!"); return; }
        p.coins -= h.cost; p.ownedItems["hat_" + h.id] = true; p.avatar.hat = h.e;
      } else { p.avatar.hat = equipped ? null : h.e; }
      save(); go("wardrobe", {}, { replace: true });
    });
    hats.appendChild(b);
  });

  const stg = STORYLING_STAGES[p.storyling.stage];
  const story = el("div.card.pad-sm", { style: { textAlign: "center" } }, [
    el("h3.h3", { text: "Your Storyling" }),
    el("div", { style: { margin: "8px auto" } }, [compImg(p.storyling.species, p.storyling.stage, 120)]),
    el("div.h3", { style: { color: "var(--accent)" }, text: `${p.storyling.name} — ${stg.name}` }),
    el("p.muted", { text: stg.note }),
    el("p.muted", { style: { fontSize: ".82rem" }, text: "Your Storyling grows as you restore Realms." }),
  ]);

  return el("div.screen.no-center", {}, [
    el("div.wrap.stack", { style: { paddingTop: "60px" } }, [
      el("div.row", { style: { justifyContent: "space-between" } }, [
        el("h2.h2", { text: "🦸 My Hero" }),
        button("Sanctuary", () => go("sanctuary"), { variant: "ghost", icon: "🏠" }),
      ]),
      el("div.card.pad-sm", { style: { textAlign: "center" } }, [preview, el("h3.h3", { text: "Colour" }), colours, el("h3.h3", { style: { marginTop: "10px" }, text: "Hats" }), hats]),
      story,
    ]),
  ]);
}
export function onMount() { autoSpeak("This is your hero and your Storyling."); }
