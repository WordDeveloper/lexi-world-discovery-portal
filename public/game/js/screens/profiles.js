/* Child profile create / select (S5). */
import { el, button, toast } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { state, addProfile, selectProfile } from "../core/state.js";
import { avatarArt } from "../ui/art.js";
import { go } from "../core/router.js";

export function render() {
  hideHUD();
  const list = el("div.map-grid");
  renderList(list);

  const nameInput = el("input.input", { placeholder: "Child's first name", "aria-label": "Child name" });
  const add = el("div.card.pad-sm", { style: { maxWidth: "560px" } }, [
    el("h3.h3", { text: "Add a child" }),
    el("div.row", { style: { marginTop: "10px" } }, [nameInput, button("Add", () => {
      const nm = nameInput.value.trim();
      if (!nm) { nameInput.classList.add("err"); toast("Enter a name."); return; }
      addProfile(nm);
      go("cinematic");
    })]),
  ]);
  add.querySelector(".row").firstChild.classList.add("grow");

  return el("div.screen.no-center", {}, [
    el("div.wrap.stack", { style: { paddingTop: "40px" } }, [
      el("h2.h2", { text: "Who's playing?" }),
      state.root.profiles.length ? list : el("p.muted", { text: "No children yet. Add your first Guardian below." }),
      el("div", { style: { height: "10px" } }),
      add,
      button("For grown-ups", () => go("dashboard"), { variant: "ghost", icon: "👤" }),
    ]),
  ]);
}

function renderList(list) {
  list.innerHTML = "";
  state.root.profiles.forEach((p) => {
    const card = el("button.card.pad-sm", { style: { textAlign: "center", cursor: "pointer", border: "1px solid var(--line)" } }, [
      el("div", { style: { margin: "0 auto" } }, [avatarArt(p.avatar, 76)]),
      el("div.h3", { text: p.name }),
      el("div.muted", { style: { fontSize: ".82rem" }, text: p.reading.initiationDone ? `${Object.keys(p.shards).length}/20 realms` : "New Guardian" }),
    ]);
    card.addEventListener("click", () => {
      selectProfile(p.id);
      go(p.reading.initiationDone ? "sanctuary" : "cinematic");
    });
    list.appendChild(card);
  });
}
