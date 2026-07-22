/* ============================================================
   placement.js — "The Initiation" adaptive placement engine.
   Faithful to the client's assessment spec:
     • configurable rules (no code change to retune)
     • basal (3 consecutive correct) / ceiling (3 consecutive
       incorrect) / prerequisite-discontinue
     • multiple opportunities per skill (never place on one miss)
     • places at the earliest unmet prerequisite, crediting
       mastered skills; never scores unadministered items as zero.
   The engine is content-driven from the realm item banks.
   ============================================================ */

import { REALMS, SKILL_CHAIN, realmBySkill } from "../data/realms.js";

// All rules configurable (client acceptance requirement).
export const INIT_CONFIG = {
  entrySkillIndex: 0,   // grade/season entry point (default: alphabet)
  chancesPerSkill: 2,   // multiple opportunities before deciding a skill
  basal: 3,
  ceiling: 3,
  maxItemsPerSkill: 2,
};

/** Access checks shown at "Arrival" — unscored (Domain 0). */
export const ARRIVAL_CHECKS = [
  { key: "audio", prompt: "Tap the sound button, then tap the star you hear about.", say: "Can you hear me? Tap the glowing star.", kind: "tap-star" },
  { key: "select", prompt: "Tap the apple.", say: "Tap the apple.", kind: "pick", options: ["🍎", "⭐", "🌙"], answer: 0 },
  { key: "ready", prompt: "Are you ready to begin your quest?", say: "Are you ready to begin your quest?", kind: "ready" },
];

/** Build the ordered probe list: 1–2 items per skill, ascending difficulty. */
function probeItemsForSkill(skillId) {
  const realm = realmBySkill(skillId);
  if (!realm) return [];
  // prefer 'choose'/'listen' items (selection = accessible, auto-scorable), else any
  const pref = realm.items.filter((i) => i.type === "choose" || i.type === "listen");
  const pool = pref.length ? pref : realm.items;
  return pool.slice(0, INIT_CONFIG.maxItemsPerSkill).map((i) => ({ ...i, skillId, realmId: realm.id }));
}

/** Create a fresh runner. */
export function createInitiation() {
  const skills = SKILL_CHAIN.slice(INIT_CONFIG.entrySkillIndex);
  const state = {
    idx: 0,                 // skill pointer
    skills,
    chance: 0,              // attempts on current skill
    skillCorrect: false,    // any correct on current skill
    basalStreak: 0,
    ceilingStreak: 0,
    established: [],         // skills passed (mastered/credited)
    earliestUnmet: null,    // skillId
    finished: false,
    log: [],
  };

  function currentSkill() { return state.skills[state.idx]; }
  function currentItem() {
    const items = probeItemsForSkill(currentSkill());
    return items[Math.min(state.chance, items.length - 1)] || null;
  }

  /** Submit a graded result for the current probe. */
  function submit(correct) {
    const skill = currentSkill();
    state.log.push({ skill, correct });
    if (correct) { state.basalStreak++; state.ceilingStreak = 0; state.skillCorrect = true; }
    else { state.ceilingStreak++; state.basalStreak = 0; }

    state.chance++;
    const outOfChances = state.chance >= INIT_CONFIG.chancesPerSkill;

    if (state.skillCorrect && (correct || outOfChances)) {
      // skill established → advance
      state.established.push(skill);
      advanceSkill();
    } else if (outOfChances && !state.skillCorrect) {
      // skill failed after multiple opportunities → earliest unmet prerequisite
      state.earliestUnmet = skill;
      finish();
    }
    // ceiling safeguard: too many consecutive misses overall
    if (!state.finished && state.ceilingStreak >= INIT_CONFIG.ceiling) {
      if (!state.earliestUnmet) state.earliestUnmet = skill;
      finish();
    }
  }

  function advanceSkill() {
    state.idx++;
    state.chance = 0;
    state.skillCorrect = false;
    if (state.idx >= state.skills.length) finish(); // credited through the top
  }

  function finish() {
    state.finished = true;
    // placement realm
    let placedSkill = state.earliestUnmet || state.skills[state.skills.length - 1];
    const realm = realmBySkill(placedSkill) || REALMS[0];
    state.result = {
      placedRealm: realm.id,
      earliestUnmet: placedSkill,
      masteredSkills: state.established.slice(),
      dnaProfile: {
        mastered: state.established.slice(),
        earliestUnmet: placedSkill,
        completedAt: Date.now(),
        log: state.log.slice(),
      },
    };
  }

  return {
    state,
    currentSkill,
    currentItem,
    submit,
    isFinished: () => state.finished,
    result: () => state.result,
    progress: () => Math.round((state.idx / state.skills.length) * 100),
  };
}
