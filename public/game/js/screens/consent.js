/* Consent & permissions (S4) — COPPA/FERPA. Parent consent required;
   voice-recording is a separate, explicit opt-in. */
import { el, button, backButton, toast } from "../ui/components.js";
import { setConsent } from "../core/state.js";
import { go, back } from "../core/router.js";

function toggleRow(labelHtml, checked) {
  let on = checked;
  const sw = el("button.switch" + (on ? ".on" : ""), { role: "switch", "aria-checked": String(on) });
  const row = el("div.toggle", {}, [el("div", { html: labelHtml }), sw]);
  sw.addEventListener("click", () => { on = !on; sw.classList.toggle("on", on); sw.setAttribute("aria-checked", String(on)); });
  return { row, get: () => on };
}

export function render() {
  const parent = toggleRow("<b>Parent / guardian consent</b><br><span class='muted' style='font-size:.85rem'>I allow my child to use Lexi World and to collect reading progress data.</span>", false);
  const voice = toggleRow("<b>Voice recording</b> (optional)<br><span class='muted' style='font-size:.85rem'>Allow the mic so my child can read aloud. You can change this later.</span>", false);

  const card = el("div.card", { style: { maxWidth: "560px" } }, [
    el("div.eyebrow", { text: "Privacy" }),
    el("h2.h2", { text: "Your permission" }),
    el("p.muted", { text: "Lexi World collects only what it needs to teach reading, and follows COPPA and FERPA. Data stays private to your project team; it is never sold or used for ads." }),
    el("div.stack", { style: { marginTop: "16px" } }, [parent.row, voice.row]),
    el("p.muted", { style: { fontSize: ".82rem", marginTop: "12px" }, text: "Reading-aloud helps the game check decoding. Without the mic, your child can still tap and choose answers." }),
    el("div", { style: { height: "16px" } }),
    el("div.row", {}, [
      backButton(back),
      button("I agree — continue", () => {
        if (!parent.get()) { toast("Parent consent is required to continue."); return; }
        setConsent(voice.get());
        go("profiles");
      }, { grow: true }),
    ]),
  ]);
  card.querySelector(".row").lastChild.classList.add("grow");
  return el("div.screen", {}, [card]);
}
