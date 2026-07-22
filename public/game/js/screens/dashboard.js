/* ============================================================
   Adult dashboard (S22) — role-scoped, adult-only data.
   Shows mastery, accuracy, error patterns, placement, a plain
   recommendation, and specialist alerts. Uses adult language
   (this data is never shown to the child). Parent sees their
   child; Teacher sees the class roster.
   ============================================================ */
import { el, button, autoSpeak } from "../ui/components.js";
import { hideHUD } from "../ui/hud.js";
import { state } from "../core/state.js";
import { REALMS, realmById, realmBySkill } from "../data/realms.js";
import { go } from "../core/router.js";

export function render() {
  hideHUD();
  const role = state.root.account?.path === "school" ? "Teacher" : "Parent";
  const profiles = state.root.profiles;
  let selected = state.profile || profiles[0];

  const host = el("div.wrap.stack", { style: { paddingTop: "30px" } });
  function paint() {
    host.innerHTML = "";
    host.appendChild(el("div.row", { style: { justifyContent: "space-between", flexWrap: "wrap" } }, [
      el("div", {}, [el("h2.h2", { text: "Grown-up dashboard" }), el("p.muted", { text: `${role} view · role-scoped, private data (never shown to the child).` })]),
      el("div.row", {}, [button("Back to game", () => go(state.profile ? "sanctuary" : "profiles"), { variant: "ghost", icon: "←" })]),
    ]));

    // roster (teacher) / child selector
    if (profiles.length > 1) {
      const sel = el("div.row", {});
      profiles.forEach((p) => {
        const b = el("button.btn" + (p.id === selected.id ? "" : ".ghost"), { text: p.name });
        b.addEventListener("click", () => { selected = p; paint(); });
        sel.appendChild(b);
      });
      host.appendChild(el("div.card.pad-sm", {}, [el("div.k", { style: { fontWeight: 700, marginBottom: "6px" }, text: role === "Teacher" ? "Class roster" : "Children" }), sel]));
    }

    if (!profiles.length) { host.appendChild(el("div.card", {}, [el("p.muted", { text: "No children yet." })])); return; }

    const p = selected;
    const done = p.reading?.initiationDone;
    const placementRealm = realmById(p.reading?.placedRealm || 1);
    const acc = overallAccuracy(p);
    const masteredCount = Object.values(p.mastery).filter((m) => m.mastered).length;

    // stat cards
    host.appendChild(el("div.dash-grid", {}, [
      statCard("Placement", done ? `Realm ${placementRealm.id}` : "Not assessed", done ? placementRealm.name : "Initiation not completed"),
      statCard("Skills mastered", masteredCount, "across the sequence"),
      statCard("Overall accuracy", acc == null ? "—" : acc + "%", "all graded responses"),
      statCard("Open alerts", p.alerts.length, p.alerts.length ? "needs attention" : "none"),
    ]));

    if (!done) { host.appendChild(el("div.notice", { text: `${p.name} has not completed The Initiation yet, so placement and skill data are limited.` })); return; }

    // recommendation
    host.appendChild(el("div.card", {}, [
      el("h3.h3", { text: "Recommended next step" }),
      el("p", { text: recommendation(p) }),
      el("p.muted", { style: { fontSize: ".8rem" }, text: "Development-stage screener — indicators only, not a diagnosis." }),
    ]));

    // skills table
    const rows = REALMS.map((r) => {
      const m = p.mastery[r.skill];
      const a = m && m.attempts ? Math.round((m.correct / m.attempts) * 100) : null;
      const topErr = m && Object.keys(m.errors).length ? Object.entries(m.errors).sort((x, y) => y[1] - x[1])[0][0] : "—";
      const status = !m ? "Not administered" : m.mastered ? "Mastered" : m.attempts ? "Developing" : "Not administered";
      const pill = status === "Mastered" ? "g" : status === "Developing" ? "a" : "";
      return el("tr", {}, [
        el("td", { text: `${r.id}. ${r.skillLabel}` }),
        el("td", {}, [el("span.pill" + (pill ? "." + pill : ""), { text: status })]),
        el("td", { text: a == null ? "—" : a + "%" }),
        el("td", { text: m ? String(m.independentCorrect || 0) : "0" }),
        el("td", { text: m ? String(m.supportUsed || 0) : "0" }),
        el("td", { text: topErr }),
      ]);
    });
    const table = el("table.data", {}, [
      el("thead", {}, [el("tr", {}, ["Skill", "Status", "Accuracy", "Independent correct", "Supports used", "Top error"].map((h) => el("th", { text: h })))]),
      el("tbody", {}, rows),
    ]);
    host.appendChild(el("div.card", { style: { overflowX: "auto" } }, [el("h3.h3", { text: "Skill mastery & error patterns" }), table]));

    // alerts
    if (p.alerts.length) {
      host.appendChild(el("div.card", {}, [
        el("h3.h3", { text: "⚠ Specialist alerts" }),
        el("div.stack", {}, p.alerts.map((a) => el("div.notice", { text: `${realmBySkill(a.skillId)?.skillLabel || a.skillId}: ${a.reason}` }))),
      ]));
    }
  }
  paint();
  return el("div.screen.no-center", {}, [host]);
}

function statCard(k, v, sub) { return el("div.stat", {}, [el("div.k", { text: k }), el("div.v", { text: String(v) }), el("div.muted", { style: { fontSize: ".78rem" }, text: sub })]); }
function overallAccuracy(p) {
  let c = 0, a = 0; Object.values(p.mastery).forEach((m) => { c += m.correct; a += m.attempts; }); return a ? Math.round((c / a) * 100) : null;
}
function recommendation(p) {
  if (p.alerts.length) return `${p.name} has shown repeated difficulty with ${realmBySkill(p.alerts[0].skillId)?.skillLabel || "a skill"}. Consider targeted small-group or specialist support and extra practice before advancing.`;
  const unmet = realmBySkill(p.reading.earliestUnmet);
  return `Continue instruction at ${unmet?.name || "the placed realm"} (${unmet?.skillLabel || "current skill"}). ${p.name} is credited with earlier skills and should keep practising the current pattern to independent mastery.`;
}
export function onMount() { /* adults; no auto read-aloud */ }
