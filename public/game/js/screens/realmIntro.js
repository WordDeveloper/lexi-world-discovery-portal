/* Realm intro (S12) — explicit teaching before play. Uses the realm's
   background art as the hero image (fallback: themed banner). */
import { el, button, hearButton } from "../ui/components.js";
import { imgEl, loadImage } from "../core/images.js";
import { showHUD } from "../ui/hud.js";
import { speak, stopSpeaking } from "../core/audio.js";
import { realmById } from "../data/realms.js";
import { realmArt } from "../data/scenes.js";
import { shade } from "../ui/art.js";
import { go } from "../core/router.js";

export function render({ realmId }) {
  const r = realmById(realmId);
  showHUD({ realmName: r.name });
  const art = realmArt(realmId);
  if (art.boss) loadImage(art.boss);           // warm the boss art for later
  const intro = `This is ${r.name}. Today we learn ${r.skillLabel}. Watch and listen, then help restore the Realm.`;

  const themedFallback = el("div", {
    style: { height: "clamp(160px,34vh,320px)", borderRadius: "18px", background: `linear-gradient(160deg, ${r.color}, ${shade(r.color, -30)})`, display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--font-head)", fontWeight: "800", fontSize: "1.4rem" },
    text: r.name,
  });
  const hero = imgEl(art.bg, {
    alt: `${r.name} — ${r.skillLabel}`,
    className: "sheet-img-wrap",
    style: { width: "100%", borderRadius: "18px", display: "block", boxShadow: "var(--shadow-lift)" },
    fallback: themedFallback,
  });

  const card = el("div.sheet-wrap.stack", { style: { textAlign: "center" } }, [
    el("div.eyebrow", { text: `Realm ${r.id} · ${r.theme}` }),
    el("h2.h2", { text: r.name }),
    hero,
    el("div.panel", { style: { maxWidth: "720px", margin: "0 auto" } }, [
      el("div.h3", { text: "🌳 The Keeper" }),
      el("p", { style: { marginTop: "4px" }, text: intro }),
    ]),
    el("div.row.center", { style: { marginTop: "8px" } }, [
      hearButton(intro, { label: "Hear it" }),
      button("Enter the Realm", () => go("realm", { realmId: r.id }), { size: "lg", variant: "gold" }),
      button("Back to map", () => go("map"), { variant: "ghost" }),
    ]),
  ]);

  return el("div.screen.no-center", {}, [el("div.wrap", { style: { paddingTop: "58px" } }, [card])]);
}
export function onMount(el0, { realmId }) { const r = realmById(realmId); speak(`This is ${r.name}. Today we learn ${r.skillLabel}.`); }
export function onUnmount() { stopSpeaking(); }
