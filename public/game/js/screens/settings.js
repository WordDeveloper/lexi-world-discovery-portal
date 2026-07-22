/* Settings / Accessibility (S20) — applies live and globally. */
import { el, button, toast, showModal } from "../ui/components.js";
import { showHUD } from "../ui/hud.js";
import { state, save, resetActiveProgress } from "../core/state.js";
import { applyBodySettings, go } from "../core/router.js";
import { speak } from "../core/audio.js";

function toggle(label, key) {
  const s = state.profile.settings;
  let on = !!s[key];
  const sw = el("button.switch" + (on ? ".on" : ""), { role: "switch", "aria-checked": String(on) });
  const row = el("div.toggle", {}, [el("div", { text: label }), sw]);
  sw.addEventListener("click", () => { on = !on; s[key] = on; sw.classList.toggle("on", on); sw.setAttribute("aria-checked", String(on)); save(); applyBodySettings(); if (key === "readAloud" && on) speak("Read aloud is on."); });
  return row;
}

export function render() {
  const p = state.profile, s = p.settings;
  showHUD({ realmName: "Settings" });

  // volume slider
  const vol = el("input", { type: "range", min: "0", max: "1", step: "0.1", value: String(s.volume), style: { width: "160px" } });
  vol.addEventListener("input", () => { s.volume = parseFloat(vol.value); save(); });

  const card = el("div.card", { style: { maxWidth: "560px", width: "100%" } }, [
    el("div.row", { style: { justifyContent: "space-between" } }, [
      el("h2.h2", { text: "⚙️ Settings" }),
      button("Sanctuary", () => go("sanctuary"), { variant: "ghost", icon: "🏠" }),
    ]),
    el("h3.h3", { text: "Reading & sound" }),
    el("div.stack", {}, [
      toggle("🔊 Read everything aloud", "readAloud"),
      el("div.toggle", {}, [el("div", { text: "🔉 Volume" }), vol]),
    ]),
    el("h3.h3", { style: { marginTop: "12px" }, text: "Make it comfy" }),
    el("div.stack", {}, [
      toggle("🔤 Easy-to-read font (for dyslexia)", "dys"),
      toggle("🔡 Bigger text", "big"),
      toggle("🌿 Calm mode (less motion)", "calm"),
    ]),
    el("h3.h3", { style: { marginTop: "12px" }, text: "For grown-ups" }),
    el("div.stack", {}, [
      button("Grown-up dashboard", () => go("dashboard"), { variant: "ghost", block: true, icon: "👤" }),
      button("Switch child", () => go("profiles"), { variant: "ghost", block: true }),
      button("Reset this child's progress", () => confirmReset(), { variant: "ghost", block: true }),
    ]),
  ]);
  return el("div.screen", {}, [card]);
}

function confirmReset() {
  const host = el("div.center", {}, [
    el("h3.h3", { text: "Reset progress?" }),
    el("p.muted", { text: "This clears Realms, XP and badges for this child. This cannot be undone." }),
    el("div.notice", { style: { marginTop: "10px", textAlign: "left" }, html: "<b>Note (blueprint flag):</b> whether a reset exists in v1 and its safeguards is a client decision." }),
    el("div.row.center", { style: { marginTop: "12px" } }, [
      button("Cancel", () => m.close(), { variant: "ghost" }),
      button("Reset", () => { resetActiveProgress(); m.close(); toast("Progress reset."); go("sanctuary", {}, { replace: true }); }, { variant: "brand" }),
    ]),
  ]);
  const m = showModal(host);
}
