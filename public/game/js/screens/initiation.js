/* ============================================================
   The Initiation (S9) — adaptive placement, framed as a quest.
   Never shows pass/fail to the child. Uses the placement engine
   (basal/ceiling/discontinue, multiple opportunities). Produces
   the Literacy DNA profile + starting realm.
   ============================================================ */
import { el, button, hearButton, progressBar, autoSpeak, confetti } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { speak, sfx, stopSpeaking } from "../core/audio.js";
import { state, save } from "../core/state.js";
import { createInitiation, ARRIVAL_CHECKS } from "../systems/placement.js";
import { realmById } from "../data/realms.js";
import { storylingArt } from "../ui/art.js";
import { go } from "../core/router.js";

let runner, phase, arrivalIdx, itemsSinceBreak;

export function render() {
  hideHUD();
  runner = createInitiation();
  phase = "intro"; arrivalIdx = 0; itemsSinceBreak = 0;
  const host = el("div.card", { style: { maxWidth: "620px", width: "100%" } });
  const screen = el("div.screen", {}, [host]);
  screen._host = host;
  return screen;
}
export function onMount(scr) { paintIntro(scr._host); }
export function onUnmount() { stopSpeaking(); }

function head(host, title, subtitle) {
  host.innerHTML = "";
  host.appendChild(el("div.eyebrow", { text: "The Initiation" }));
  host.appendChild(el("h2.h2", { text: title }));
  if (subtitle) host.appendChild(el("p.muted", { text: subtitle }));
}

function paintIntro(host) {
  head(host, "Your first quest", "Lexi will ask you some things so we can find the perfect place to begin your adventure. It is not a test — just do your best!");
  host.appendChild(el("div", { style: { textAlign: "center", margin: "14px 0" } }, [storylingArt(state.profile.storyling.species, 0, 110)]));
  host.appendChild(button("Let's begin", () => { phase = "arrival"; paintArrival(host); }, { size: "lg", block: true }));
  autoSpeak("Let's find where your adventure begins. It is not a test.");
}

/* ---------- Arrival access checks (unscored) ---------- */
function paintArrival(host) {
  const check = ARRIVAL_CHECKS[arrivalIdx];
  head(host, "Getting ready", null);
  host.appendChild(el("p.prompt", { text: check.prompt }));
  host.appendChild(el("div.row.center", { style: { margin: "10px 0" } }, [hearButton(check.say)]));
  const done = () => { arrivalIdx++; if (arrivalIdx < ARRIVAL_CHECKS.length) paintArrival(host); else { phase = "probe"; paintProbe(host); } };

  if (check.kind === "pick") {
    const grid = el("div.choices");
    check.options.forEach((o) => {
      const b = el("button.choice", { text: o, style: { fontSize: "2rem" } });
      b.addEventListener("click", () => { sfx.tap(); done(); });
      grid.appendChild(b);
    });
    host.appendChild(grid);
  } else if (check.kind === "tap-star") {
    const b = el("button.choice", { text: "⭐", style: { fontSize: "2.2rem", maxWidth: "160px", margin: "0 auto" } });
    b.addEventListener("click", () => { sfx.tap(); done(); });
    host.appendChild(b);
  } else {
    host.appendChild(el("div.row.center", {}, [button("I'm ready!", () => { sfx.tap(); done(); }, { size: "lg" })]));
  }
  speak(check.say);
}

/* ---------- Adaptive probes ---------- */
function paintProbe(host) {
  if (runner.isFinished()) return finishInitiation(host);
  if (itemsSinceBreak >= 4) { itemsSinceBreak = 0; return paintBreak(host); }

  const item = runner.currentItem();
  if (!item) return finishInitiation(host);

  head(host, "Your quest", null);
  host.appendChild(progressBar(runner.progress()));
  host.appendChild(el("div", { style: { height: "10px" } }));
  host.appendChild(el("p.prompt.center", { text: item.p }));
  if (item.type === "listen") host.appendChild(el("div.center", { style: { fontSize: "2.4rem", margin: "6px" }, text: "👂" }));
  host.appendChild(el("div.row.center", {}, [hearButton(() => item.say || item.p)]));

  const grid = el("div.choices");
  item.opts.forEach((opt, idx) => {
    const b = el("button.choice", { text: opt });
    b.addEventListener("click", () => {
      const correct = idx === item.a;
      sfx[correct ? "correct" : "wrong"]();
      b.classList.add(correct ? "correct" : "wrong");
      [...grid.children].forEach((c) => (c.style.pointerEvents = "none"));
      itemsSinceBreak++;
      runner.submit(correct);
      setTimeout(() => paintProbe(host), 650);
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
  speak(item.say || item.p);
}

/* ---------- Encouraging break (no teaching/answers) ---------- */
function paintBreak(host) {
  head(host, "Nice work — quick break!", "Tap to give your Storyling a happy wiggle, then keep going.");
  const s = el("div.center", { style: { margin: "14px 0", cursor: "pointer" } }, [storylingArt(state.profile.storyling.species, 0, 120)]);
  s.addEventListener("click", () => { s.firstChild.animate([{ transform: "rotate(-8deg)" }, { transform: "rotate(8deg)" }, { transform: "none" }], { duration: 400 }); sfx.open(); });
  host.appendChild(s);
  host.appendChild(button("Keep going", () => paintProbe(host), { size: "lg", block: true }));
  speak("Great job. Take a quick break, then keep going.");
}

/* ---------- Finish & place ---------- */
function finishInitiation(host) {
  const res = runner.result();
  const p = state.profile;
  p.reading = { placedRealm: res.placedRealm, earliestUnmet: res.earliestUnmet, initiationDone: true, dnaProfile: res.dnaProfile };
  // credit mastered skills
  res.masteredSkills.forEach((sk) => { p.mastery[sk] = p.mastery[sk] || { attempts: 0, correct: 0, independentCorrect: 3, supportUsed: 0, formats: { screener: 1, choose: 1 }, mastered: true, errors: {}, failCycles: 0 }; });
  p.unlockedRealm = Math.max(p.unlockedRealm, res.placedRealm);
  p.currentRealm = res.placedRealm;
  save();

  const realm = realmById(res.placedRealm);
  head(host, "Your adventure begins!", null);
  host.appendChild(el("div.center", { style: { margin: "10px 0" } }, [storylingArt(p.storyling.species, 0, 120)]));
  host.appendChild(el("p.lead.center", { html: `Lexi has found your starting Realm:<br><b style="color:var(--accent)">${realm.name}</b>` }));
  host.appendChild(el("p.muted.center", { text: `Today you'll practise: ${realm.skillLabel}.` }));
  host.appendChild(el("div", { style: { height: "14px" } }));
  host.appendChild(button("Enter the Sanctuary", () => go("sanctuary", {}, { replace: true }), { size: "lg", block: true }));
  confetti(30); sfx.shard();
  speak(`Your adventure begins in ${realm.name}.`);
}
