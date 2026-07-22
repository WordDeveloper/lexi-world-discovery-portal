/* Adult gate + account setup (S2/S3). Local account for the web build;
   school SSO / roster is a flagged later-phase item (blueprint F1). */
import { el, button, autoSpeak, toast } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { setAccount } from "../core/state.js";
import { go } from "../core/router.js";

export function render() {
  hideHUD();
  let path = "home";
  const name = el("input.input", { placeholder: "Your name (grown-up)", "aria-label": "Your name" });

  const pathBtns = el("div.row.center");
  const mkPath = (id, label) => {
    const bx = el("button.btn.ghost", { text: label });
    bx.addEventListener("click", () => { path = id; [...pathBtns.children].forEach((c) => c.classList.remove("brand")); bx.classList.remove("ghost"); bx.classList.add("brand"); });
    return bx;
  };
  const home = mkPath("home", "🏠 Home"); const school = mkPath("school", "🏫 School");
  home.classList.remove("ghost"); home.classList.add("brand");
  home.addEventListener("click", () => { school.classList.add("ghost"); school.classList.remove("brand"); });
  school.addEventListener("click", () => { home.classList.add("ghost"); home.classList.remove("brand"); });
  pathBtns.append(home, school);

  const card = el("div.card", { style: { maxWidth: "540px" } }, [
    el("div.eyebrow", { text: "For grown-ups" }),
    el("h2.h2", { text: "Set up Lexi World" }),
    el("p.muted", { text: "A parent or teacher sets up the game. Choose how you'll use it, then add your child." }),
    el("div", { style: { height: "10px" } }),
    el("div.field", {}, [el("label", { text: "How will you use Lexi World?" }), pathBtns]),
    el("div", { style: { height: "12px" } }),
    el("div.field", {}, [el("label", { text: "Your name" }), name]),
    el("div.notice", { style: { marginTop: "14px" }, html: "<b>Note:</b> this setup keeps profiles on this device. School single sign-on (Clever / ClassLink) and shared accounts are a confirmed later step." }),
    el("div", { style: { height: "16px" } }),
    button("Continue", () => {
      if (!name.value.trim()) { name.classList.add("err"); toast("Please add your name."); return; }
      setAccount(path, name.value.trim());
      go("consent");
    }, { size: "lg", block: true }),
  ]);
  return el("div.screen", {}, [card]);
}
export function onMount() { autoSpeak("A grown-up sets up the game."); }
