/* ============================================================
   engine.js — the learning-activity engine (A1–A10).
   Renders one activity item and runs the 3-heart support ladder
   exactly as the client's "Hearts and Incorrect Answers" doc:
     Heart 1: gentle feedback + retry (hear it, highlight target)
     Heart 2: stronger support (worked example / model / dim a wrong option)
     Heart 3: explicit modelling + simplified/prerequisite practice
     All 3 used: no shame → guided practice → rebuild → retry.
   Records mastery + adult events; never a hard "game over".
   Colours syllables/sounds for readability.

   openActivity(host, item, ctx) where ctx = {realm, onSolved}.
   Returns a controller; on success calls ctx.onSolved({supported}).
   ============================================================ */

import { el, hearButton, announce } from "../ui/components.js";
import { speak, sayLetter, sfx } from "../core/audio.js";
import { state } from "../core/state.js";
import { recordResponse, recordFailedCycle } from "../systems/progress.js";

const SYL = ["#6C4AB6", "#2f9ec0", "#2f9e63", "#d0803a", "#c0508a"]; // per-sound colours

function coloured(word) {
  return word.split("").map((c, i) => `<span style="color:${SYL[i % SYL.length]}">${c}</span>`).join("");
}

export function openActivity(host, item, ctx) {
  host.innerHTML = "";
  const state_ = { hearts: 3, spent: 0, solved: false, supportLevel: 0, hintUsed: 0, practiced: false };
  const realm = ctx.realm;

  // header: skill label + hearts
  const heartsRow = el("div.hearts", { "aria-label": "hearts" });
  function paintHearts() {
    heartsRow.innerHTML = "";
    for (let i = 0; i < state_.hearts; i++) heartsRow.appendChild(el("span.heart" + (i < state_.spent ? ".spent" : ""), { text: "❤️" }));
    if (ctx.onHearts) ctx.onHearts(state_.hearts, state_.spent);
  }
  const header = el("div.row", { style: { justifyContent: "space-between", alignItems: "center" } }, [
    el("div.eyebrow", { text: `${realm.skillLabel} · ${labelFor(item.type)}` }),
    heartsRow,
  ]);
  const body = el("div.center", { style: { marginTop: "10px" } });
  const feedback = el("div.feedback", { role: "status" });
  const hintBtn = el("button.btn.ghost", { text: "💡 Hint" });
  const controls = el("div.row.center", { style: { marginTop: "12px" } }, [hearButton(() => item.say || item.p), hintBtn]);

  host.append(header, body, feedback, controls);
  paintHearts();

  const fb = (msg, good) => { feedback.textContent = msg; feedback.className = "feedback " + (good ? "good" : "bad"); if (msg) announce(msg); };

  /* ----- support ladder on a wrong response ----- */
  function onWrong(errorCode, targetHintFn) {
    if (state_.solved) return;
    state_.spent = Math.min(3, state_.spent + 1);
    state_.supportLevel = state_.spent;
    sfx.wrong();
    paintHearts();
    recordResponse({ realmId: realm.id, skillId: realm.skill, format: item.type, correct: false, supportLevel: state_.spent, errorCode });
    if (state_.spent === 1) { fb("Not quite — listen and try again.", false); speak(item.say || "Try again"); }
    else if (state_.spent === 2) { fb("Here's a little help.", false); if (targetHintFn) targetHintFn(2); }
    else { fb("Let's do it together.", false); if (targetHintFn) targetHintFn(3); enterPractice(); }
  }
  function onCorrect() {
    if (state_.solved) return;
    state_.solved = true;
    sfx.correct();
    const supported = state_.supportLevel > 0;
    const justMastered = recordResponse({ realmId: realm.id, skillId: realm.skill, format: item.type, correct: true, supportLevel: state_.supportLevel });
    bumpCounters(item.type);
    fb(supported ? "You got it! ⭐" : "Correct! ⭐", true);
    speak("Correct!");
    setTimeout(() => ctx.onSolved({ supported, justMastered }), 700);
  }

  /* ----- practice / rebuild after 3 hearts (never a game over) ----- */
  function enterPractice() {
    if (state_.practiced) return;
    state_.practiced = true;
    recordFailedCycle(realm.skill, realm.id, realm.skillLabel);
    // Guided practice: fully model the answer, then a guaranteed-success step to rebuild hearts.
    hintBtn.disabled = true;
  }

  hintBtn.addEventListener("click", () => { state_.hintUsed++; renderHint(); });
  let renderHint = () => {};

  /* ---------- render by type ---------- */
  if (item.type === "choose" || item.type === "listen") renderChoose();
  else if (item.type === "build") renderBuild();
  else if (item.type === "trace") renderTrace();
  else renderDecode(); // decode / speak

  speak(item.say || item.p);

  /* ===== CHOOSE / LISTEN (A5 / A3) ===== */
  function renderChoose() {
    body.appendChild(el("p.prompt", { text: item.p }));
    if (item.type === "listen") body.appendChild(el("div", { style: { fontSize: "2.4rem" }, text: "👂" }));
    const grid = el("div.choices");
    item.opts.forEach((opt, idx) => {
      const b = el("button.choice", { text: opt });
      b.addEventListener("click", () => {
        if (state_.solved) return;
        if (idx === item.a) { b.classList.add("correct"); onCorrect(); }
        else { b.classList.add("wrong", "dim"); onWrong("wrong-choice", (lvl) => { if (lvl >= 3) { const right = grid.children[item.a]; right.style.boxShadow = "0 0 0 3px var(--good)"; speak("This is the answer. " + item.opts[item.a]); } }); }
      });
      grid.appendChild(b);
    });
    body.appendChild(grid);
    renderHint = () => {
      if (state_.hintUsed === 1) { fb("Listen carefully to the sound.", true); speak(item.say || item.p); }
      else { const wrong = [...grid.children].find((c, i) => i !== item.a && !c.classList.contains("dim")); if (wrong) { wrong.classList.add("dim"); fb("One wrong choice removed.", true); } else fb("Pick the glowing one!", true); }
    };
  }

  /* ===== BUILD THE WORD (A4) ===== */
  function renderBuild() {
    const word = item.w;
    body.appendChild(el("p.prompt", { text: "Build the word you hear" }));
    const slots = el("div.slots");
    for (let i = 0; i < word.length; i++) slots.appendChild(el("div.slot", { data: { i } }));
    const tiles = el("div.tiles");
    shuffle(word.split("")).forEach((ch) => {
      const t = el("button.tile", { text: ch });
      t.addEventListener("click", () => placeTile(t, ch));
      tiles.appendChild(t);
    });
    body.append(slots, tiles);

    function placeTile(t, ch) {
      if (state_.solved) return;
      const empty = [...slots.children].find((s) => !s.textContent);
      if (!empty) return;
      const idx = +empty.dataset.i;
      if (word[idx] === ch) {
        empty.textContent = ch; empty.classList.add("full"); empty.style.color = SYL[idx % SYL.length];
        t.classList.add("used"); sayLetter(ch); sfx.place();
        if ([...slots.children].every((s) => s.textContent)) onCorrect();
      } else {
        onWrong("wrong-order", (lvl) => { if (lvl >= 3) { // model: auto-fill next correct tile
          const need = word[idx]; const src = [...tiles.children].find((x) => !x.classList.contains("used") && x.textContent === need);
          if (src) { empty.textContent = need; empty.classList.add("full"); empty.style.color = SYL[idx % SYL.length]; src.classList.add("used"); sayLetter(need); }
        } });
        t.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 200 });
      }
    }
    renderHint = () => {
      const empty = [...slots.children].find((s) => !s.textContent);
      if (empty) { const need = word[+empty.dataset.i]; const src = [...tiles.children].find((x) => !x.classList.contains("used") && x.textContent === need); if (src) src.animate([{ transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 400 }); fb("Next sound: " + need, true); sayLetter(need); }
    };
  }

  /* ===== TRACE (A6) ===== */
  function renderTrace() {
    const L = (item.w[0] || "A").toUpperCase();
    body.appendChild(el("p.prompt", { text: "Trace the letter " + L }));
    const cv = el("canvas", { width: 220, height: 220, style: { touchAction: "none", background: "#faf9ff", borderRadius: "16px", border: "2px solid var(--line)" } });
    body.appendChild(cv);
    const done = el("button.btn", { text: "Done ✓", style: { marginTop: "10px" } });
    body.appendChild(done);
    const c = cv.getContext("2d");
    c.fillStyle = "#eee7fb"; c.font = "bold 180px Baloo 2, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(L, 110, 120);
    c.strokeStyle = "#6C4AB6"; c.lineWidth = 14; c.lineCap = "round"; c.lineJoin = "round";
    let drawing = false, last = null, len = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (220 / r.width), y: (t.clientY - r.top) * (220 / r.height) }; };
    cv.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); e.preventDefault(); });
    cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(p.x, p.y); c.stroke(); len += Math.hypot(p.x - last.x, p.y - last.y); last = p; e.preventDefault(); });
    window.addEventListener("pointerup", () => (drawing = false));
    done.addEventListener("click", () => { if (len > 240) onCorrect(); else onWrong("incomplete-trace", () => { c.strokeStyle = "rgba(108,74,182,.35)"; }); });
    speak("Trace the letter " + L);
    renderHint = () => fb("Trace slowly over the whole letter.", true);
  }

  /* ===== DECODE / SPEAK (A7 / A2) ===== */
  function renderDecode() {
    const word = item.w;
    body.appendChild(el("p.prompt", { text: "Read this word out loud" }));
    body.appendChild(el("div.bigword", { html: coloured(word) }));
    const voiceOk = state.root.consent?.voiceConsent && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    const mic = el("button.btn", { text: voiceOk ? "🎤 Tap and say it" : "I read it ✓", size: "lg" });
    body.appendChild(mic);
    body.appendChild(el("p.muted", { style: { fontSize: ".85rem", marginTop: "8px" }, text: voiceOk ? "Tap the mic, say the word, then it will check." : "Say the word out loud, then tap to continue." }));
    mic.addEventListener("click", () => {
      if (state_.solved) return;
      if (voiceOk) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        try {
          const r = new SR(); r.lang = "en-US"; mic.textContent = "🔴 Listening…"; fb("Listening…", true);
          r.onresult = (e) => { const said = (e.results[0][0].transcript || "").toLowerCase(); if (said.includes(word.toLowerCase())) onCorrect(); else { mic.textContent = "🎤 Try again"; onWrong("mispronounce", (lvl) => { if (lvl >= 3) speak("The word is " + word); }); } };
          r.onerror = () => { selfConfirm(); };
          r.onend = () => { if (!state_.solved && mic.textContent.includes("Listening")) mic.textContent = "🎤 Tap and say it"; };
          r.start();
        } catch (e) { selfConfirm(); }
      } else { selfConfirm(); }
    });
    function selfConfirm() { bumpCounters("decode"); onCorrect(); }
    renderHint = () => { fb("Listen, then say it.", true); speak(word); };
    speak("Read this word out loud. " + word);
  }
}

/* ---------- helpers ---------- */
function bumpCounters(type) {
  const p = state.profile; if (!p) return;
  if (type === "build") p._built = (p._built || 0) + 1;
  else if (type === "decode") p._decoded = (p._decoded || 0) + 1;
  else if (type === "listen" || type === "choose") p._listened = (p._listened || 0) + 1;
}
function labelFor(t) { return { choose: "Look & Choose", listen: "Listen & Choose", build: "Build the Word", trace: "Trace It", decode: "Read Aloud" }[t] || "Activity"; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
