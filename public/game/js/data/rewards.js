/* ============================================================
   rewards.js — XP table, badges, and coins config from the
   client's Reward System / Badges document. Values are the
   client's preliminary values (to be tuned in playtesting).
   ============================================================ */

// XP values (Reward System doc). XP is never removed.
export const XP = {
  dailyReturn: 5,
  warmup: 5,
  practice: 10,
  independentCorrect: 12,        // 10–15 range → mid value
  correctionAfterSupport: 9,     // 8–10 range
  masteryChallenge: 25,
  levelCompleted: 50,
  optionalQuest: 30,             // 20–40
  bossDefeated: 100,
  realmCompleted: 150,
};

// Coin rewards (only used if coins are enabled — off by default, FLAG Q20)
export const COINS = { correct: 3, shard: 15, boss: 20 };

// Per-realm badges (Reward System doc examples + generated for the rest, in child-friendly language)
export const REALM_BADGES = {
  1: "Alphabet Awakener", 2: "Sound Listener", 3: "Closed-Syllable Guardian", 4: "Digraph Spirit Keeper",
  5: "Blend Breaker", 6: "Trigraph Flame Tamer", 7: "Syllable Climber", 8: "Open-Syllable Skyfarer",
  9: "Silent-E Gatekeeper", 10: "Schwa Whisperer", 11: "Vowel-Team Oracle", 12: "Ar Songkeeper",
  13: "Or Frostwarden", 14: "Er Grovekeeper", 15: "Vowel Tidecaller", 16: "Chunk Sage",
  17: "Latin Runereader", 18: "Suffix Smith", 19: "Prefix Skysage", 20: "Master Reader",
};

// Achievement badges (earned across the game)
export const ACHIEVEMENTS = [
  { id: "first", emoji: "💎", name: "First Shard", test: (p) => Object.keys(p.shards).length >= 1 },
  { id: "speller", emoji: "🧩", name: "Word Builder", test: (p) => p._built >= 5 },
  { id: "reader", emoji: "📖", name: "Brave Reader", test: (p) => p._decoded >= 5 },
  { id: "listener", emoji: "👂", name: "Sharp Ears", test: (p) => p._listened >= 5 },
  { id: "streak", emoji: "🔥", name: "On a Streak", test: (p) => p.streak >= 3 },
  { id: "half", emoji: "🌟", name: "Halfway Hero", test: (p) => Object.keys(p.shards).length >= 10 },
  { id: "master", emoji: "👑", name: "World Restorer", test: (p) => Object.keys(p.shards).length >= 20 },
];

// Hidden artifacts (exploration reward — never required for the instructional path)
export const ARTIFACTS = [
  { id: "a_lantern", emoji: "🏮", name: "Keeper's Lantern", note: "Bonus XP and a glimpse of lost lore." },
  { id: "a_quill", emoji: "🪶", name: "Mended Quill", note: "A secret about Malvex before his fall." },
  { id: "a_seed", emoji: "🌱", name: "Story Seed", note: "A tiny branch of the Story Tree returns." },
];
