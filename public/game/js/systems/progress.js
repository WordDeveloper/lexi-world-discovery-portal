/* ============================================================
   progress.js — the reward, mastery and adaptive-learning systems.
   Implements the client rules:
     • XP is never removed.
     • Practice before penalty; mastery needs multiple opportunities
       + more than one item format + independent success.
     • game level (public) is separate from reading level (private).
     • adult event log + specialist alert after 3 unsuccessful
       mastery attempts with added practice.
   ============================================================ */

import { state, save } from "../core/state.js";
import { XP, COINS, REALM_BADGES, ACHIEVEMENTS } from "../data/rewards.js";
import { STORYLING_STAGES } from "../data/story.js";
import { toast } from "../ui/components.js";

/* ---------- XP & coins ---------- */
export function awardXP(kind, opts = {}) {
  const p = state.profile; if (!p) return 0;
  let amount = typeof kind === "number" ? kind : (XP[kind] || 0);
  // anti-grind: reduced XP for replaying already-mastered content
  if (opts.replay) amount = Math.round(amount * 0.4);
  p.xp += amount;
  if (state.root.coinsEnabled && opts.coins) p.coins += opts.coins;
  save();
  return amount;
}

/* ---------- mastery record ---------- */
function skillRec(skillId) {
  const p = state.profile;
  if (!p.mastery[skillId]) p.mastery[skillId] = { attempts: 0, correct: 0, independentCorrect: 0, supportUsed: 0, formats: {}, mastered: false, errors: {}, failCycles: 0 };
  return p.mastery[skillId];
}

/**
 * Record one graded response.
 * @param {object} o {realmId, skillId, format, correct, supportLevel(0-3), errorCode}
 * @returns {boolean} whether the skill just became mastered
 */
export function recordResponse(o) {
  const p = state.profile; if (!p) return false;
  const r = skillRec(o.skillId);
  r.attempts++;
  if (o.format) r.formats[o.format] = (r.formats[o.format] || 0) + 1;
  if (o.correct) {
    r.correct++;
    if (!o.supportLevel) r.independentCorrect++;
  } else if (o.errorCode) {
    r.errors[o.errorCode] = (r.errors[o.errorCode] || 0) + 1;
  }
  if (o.supportLevel) r.supportUsed++;

  // adult event log
  p.events.push({ ts: Date.now(), realmId: o.realmId, skillId: o.skillId, type: o.format, correct: !!o.correct, supportLevel: o.supportLevel || 0, errorCode: o.errorCode || null });
  if (p.events.length > 500) p.events = p.events.slice(-500);

  // mastery rule: >=3 independent-correct across >=2 formats
  const wasMastered = r.mastered;
  const formatsUsed = Object.keys(r.formats).length;
  if (!r.mastered && r.independentCorrect >= 3 && formatsUsed >= 2) r.mastered = true;

  // count-based per-child achievement counters (for badges)
  save();
  return r.mastered && !wasMastered;
}

/** After all 3 hearts used on a challenge (a failed learning cycle). */
export function recordFailedCycle(skillId, realmId, skillLabel) {
  const p = state.profile; if (!p) return;
  const r = skillRec(skillId);
  r.failCycles++;
  if (r.failCycles >= 3 && !p.alerts.find((a) => a.skillId === skillId)) {
    p.alerts.push({ ts: Date.now(), skillId, realmId, skillLabel, reason: "3 unsuccessful mastery attempts with added practice — consider specialist support." });
    toast("A grown-up has been notified so they can help you. 💛");
  }
  save();
}

/* ---------- badges & achievements ---------- */
export function grantRealmBadge(realmId) {
  const p = state.profile; if (!p) return null;
  const name = REALM_BADGES[realmId];
  if (name && !p.badges["realm_" + realmId]) { p.badges["realm_" + realmId] = { name, realmId, ts: Date.now() }; save(); return name; }
  return null;
}
export function checkAchievements() {
  const p = state.profile; if (!p) return;
  ACHIEVEMENTS.forEach((a) => {
    if (!p.badges[a.id] && a.test(p)) { p.badges[a.id] = { name: a.name, emoji: a.emoji, ts: Date.now() }; toast(`Badge earned: ${a.emoji} ${a.name}`); }
  });
  save();
}

/* ---------- storyling growth ---------- */
export function growStorylingToShards() {
  const p = state.profile; if (!p) return;
  const shards = Object.keys(p.shards).length;
  const stage = Math.min(4, Math.floor(shards / 5));   // 0..4 across 20 realms
  if (stage > p.storyling.stage) {
    p.storyling.stage = stage;
    const s = STORYLING_STAGES[stage];
    toast(`Your Storyling grew to ${s.name}! ✨`);
    save();
  }
}

/* ---------- realm completion ---------- */
export function completeRealm(realmId) {
  const p = state.profile; if (!p) return;
  const replay = !!p.shards[realmId];
  p.shards[realmId] = true;
  if (p.unlockedRealm < realmId + 1 && realmId < 20) p.unlockedRealm = realmId + 1;
  awardXP("realmCompleted", { replay, coins: COINS.shard });
  grantRealmBadge(realmId);
  growStorylingToShards();
  checkAchievements();
  save();
  return replay;
}
