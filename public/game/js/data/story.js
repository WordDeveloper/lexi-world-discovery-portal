/* ============================================================
   story.js — narrative content from the client's Official Canon,
   Storylings spec, and character specs. Used by the opening
   cinematic, the Storyling ceremony, and in-realm framing.
   ============================================================ */

// Opening cinematic beats (The Great Fracture — Official Canon, condensed & read aloud)
export const CANON = [
  { who: "The Keeper", text: "Long ago, one Story Tree connected every Realm, holding the First Crystal — the living heart of language." },
  { who: "The Keeper", text: "The Crystal carried Imagination, Courage, Wisdom, Kindness, and Hope. While it stayed whole, every Realm flourished." },
  { who: "The Keeper", text: "But a scribe named Malvex found the Broken Ink. He believed mistakes were weakness, and spread 'The Forgetting'." },
  { who: "The Keeper", text: "Words lost their sounds. Stories faded. So the Story Tree shattered its own heart into twenty Heart Shards to save them." },
  { who: "The Keeper", text: "Each Shard became a Great Realm. Now the Tree sleeps, waiting for Guardians brave enough to restore them." },
  { who: "The Keeper", text: "A new Guardian is called. Follow the path, master the sounds, and bring the Realms back to life." },
];

// Storyling ceremony (from the "Awakening / Story Tree" screenshot: 5 beats)
export const CEREMONY = [
  { step: 1, title: "The Knot Opens", text: "A glowing knot in the Story Tree opens, releasing a stream of pure light." },
  { step: 2, title: "Storylings Emerge", text: "Tiny Storylings burst forth like stardust — light, laughter, and wonder." },
  { step: 3, title: "The Chosen One", text: "One Storyling pauses and looks deep into your eyes. It knows you are its Guardian." },
  { step: 4, title: "A Bond Is Formed", text: "It floats gently to you, trusting you. A bond of friendship is born." },
  { step: 5, title: "The Journey Begins", text: "With your Storyling beside you and the Keeper's blessing, your story begins." },
];

// Storyling species options (child does not choose — the Story Tree chooses; we show the chosen one)
export const STORYLINGS = [
  { id: "spark", emoji: "🐉", color: "#7bbf5a", name: "Spark" },
  { id: "lumi",  emoji: "🦊", color: "#f0a24a", name: "Lumi" },
  { id: "nixie", emoji: "🐱", color: "#6db6e8", name: "Nixie" },
  { id: "pip",   emoji: "🦉", color: "#b48be0", name: "Pip" },
];

// Storyling growth stages (Storylings spec)
export const STORYLING_STAGES = [
  { stage: 0, name: "Hatchling", note: "Just hatched — your new companion." },
  { stage: 1, name: "Companion", note: "Gaining new abilities as you learn." },
  { stage: 2, name: "Guardian Spirit", note: "Helping restore Heart Shards." },
  { stage: 3, name: "Radiant", note: "Growing brighter with every Realm." },
  { stage: 4, name: "Legendary", note: "Fully matured — stands with you against Malvex." },
];

// Avatar colour palette
export const AVATAR_COLORS = ["#6C4AB6", "#3aa6e0", "#4f9d69", "#e08a4a", "#d0596a", "#7a6ea6", "#2f9ec0", "#c98d4e"];

// Keeper feedback lines (growth-mindset framing; never shaming)
export const KEEPER_LINES = {
  welcomeBack: (name, realm) => `Welcome back, ${name}. Last time you helped restore ${realm}. The Realms still need you.`,
  realmIntro: (realm, skill) => `This is ${realm}. Today we learn ${skill}. Watch closely, then try it yourself.`,
  encourage: ["Mistakes help us grow. Try again.", "You are learning — keep going.", "Almost! Listen to the sounds once more.", "Every Guardian learns at their own pace."],
  praise: ["Wonderful reading!", "You did it!", "The Realm is healing because of you!", "Your Storyling grows stronger!"],
};
