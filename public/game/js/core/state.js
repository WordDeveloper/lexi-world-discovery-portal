/* ============================================================
   state.js — global game state + per-profile persistence.
   Two progression systems are kept strictly separate:
     - reading level  (private, adult-facing)  -> mastery / placement
     - game level / XP (public, child-facing)   -> xp, coins, level
   XP is never removed. Progress auto-saves after every change.
   ============================================================ */

const APP_KEY = "lexiworld.v1";

/** Default per-child game state. */
export function freshProfile(name = "Guardian") {
  return {
    id: "p_" + Math.random().toString(36).slice(2, 9),
    name,
    createdAt: Date.now(),
    // avatar + companion
    avatar: { color: "#6C4AB6", skin: "#f2c79a", hair: "#4a3b2f", hat: null, outfit: null },
    storyling: { species: "spark", stage: 0, name: "Storyling" }, // stage 0..4
    // public progression
    xp: 0,
    coins: 0,
    // private progression
    reading: { placedRealm: 1, earliestUnmet: "alphabet", initiationDone: false, dnaProfile: null },
    // world progress
    unlockedRealm: 1,          // highest realm the child may enter
    currentRealm: 1,           // active realm
    realmProgress: {},         // realmId -> { nodes:{idx:bool}, mastery, bossDone }
    shards: {},                // realmId -> true when restored
    badges: {},                // badgeId -> true
    mastery: {},               // skillId -> { attempts, correct, independentCorrect, supportUsed, mastered, errors:{} }
    artifacts: {},             // artifactId -> true
    ownedItems: {},            // customization owned
    // engagement
    streak: 0,
    lastPlayDay: null,
    lastSession: null,         // { realmId, realmName, summary, ts }
    sessionCount: 0,
    // per-child settings (accessibility)
    settings: { readAloud: true, dys: false, big: false, calm: false, volume: 0.9, sessionLimitMin: 0 },
    // adult-facing log of skill events (for dashboard)
    events: [],                // {ts, realmId, skillId, type, correct, supportLevel, errorCode}
    alerts: [],                // specialist alerts
  };
}

function defaultRoot() {
  return {
    version: 1,
    consent: null,          // { parentConsent:true, voiceConsent:bool, ts }
    account: null,          // { path:'home'|'school', name }
    profiles: [],
    activeProfileId: null,
    coinsEnabled: false,    // FLAG Q20 — off by default until client confirms
  };
}

let root = load();
export const state = { root, profile: null };

export function load() {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (!raw) return defaultRoot();
    const data = JSON.parse(raw);
    return { ...defaultRoot(), ...data };
  } catch (e) {
    console.warn("[state] load failed, starting fresh", e);
    return defaultRoot();
  }
}

export function save() {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(state.root));
  } catch (e) {
    console.warn("[state] save failed", e);
  }
}

/* ---------- profile management ---------- */
export function addProfile(name) {
  const p = freshProfile(name);
  state.root.profiles.push(p);
  state.root.activeProfileId = p.id;
  state.profile = p;
  save();
  return p;
}
export function selectProfile(id) {
  const p = state.root.profiles.find((x) => x.id === id);
  if (p) { state.root.activeProfileId = id; state.profile = p; save(); }
  return p;
}
export function activeProfile() {
  if (!state.profile && state.root.activeProfileId) {
    state.profile = state.root.profiles.find((x) => x.id === state.root.activeProfileId) || null;
  }
  return state.profile;
}
export function setConsent(voiceConsent) {
  state.root.consent = { parentConsent: true, voiceConsent: !!voiceConsent, ts: Date.now() };
  save();
}
export function setAccount(path, name) {
  state.root.account = { path, name: name || "" };
  save();
}

/* ---------- daily streak ---------- */
export function markDay() {
  const p = state.profile; if (!p) return;
  const today = new Date().toDateString();
  if (p.lastPlayDay !== today) {
    const y = new Date(Date.now() - 864e5).toDateString();
    p.streak = p.lastPlayDay === y ? p.streak + 1 : 1;
    p.lastPlayDay = today;
    p.sessionCount++;
    save();
  }
}

/* ---------- computed helpers ---------- */
export const LVL_XP = 100;
export function level(p = state.profile) { return Math.floor((p?.xp || 0) / LVL_XP) + 1; }
export function shardCount(p = state.profile) { return Object.keys(p?.shards || {}).length; }

export function resetActiveProgress() {
  const p = state.profile; if (!p) return;
  const fresh = freshProfile(p.name);
  fresh.id = p.id; fresh.avatar = p.avatar; fresh.storyling = p.storyling; fresh.settings = p.settings;
  const i = state.root.profiles.findIndex((x) => x.id === p.id);
  state.root.profiles[i] = fresh; state.profile = fresh; save();
}
