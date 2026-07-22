/* ============================================================
   realms.js — the 20-realm Scope & Sequence (v1.1) with, for each
   realm: theme, colour, target skill, boss, gameplay, activity mix,
   and a decodable item bank the activity engine consumes.

   Item types (consumed by activities engine):
     choose : { type:'choose', p, say, opts:[..], a }      // A5 listen & choose
     listen : { type:'listen', p, say, opts:[..], a }      // A3 phonemic (audio)
     build  : { type:'build',  p, say, w }                 // A4 build the word
     trace  : { type:'trace',  p, w }                      // A6 trace
     decode : { type:'decode', p, say, w }                 // A7 decode (real/nonsense)
   Skill IDs align with the assessment/placement engine.
   ============================================================ */

// helper to build a "choose" item quickly
const ch = (p, say, opts, a) => ({ type: "choose", p, say, opts, a });
const bd = (w, say) => ({ type: "build", p: "Build the word", say: say || w, w });
const tr = (w) => ({ type: "trace", p: "Trace the letter", w });
const dc = (w, say) => ({ type: "decode", p: "Read the word out loud", say: say || w, w });
const ls = (p, say, opts, a) => ({ type: "listen", p, say, opts, a });

export const REALMS = [
  {
    id: 1, name: "The Awakening", theme: "Home Realm", skill: "alphabet",
    skillLabel: "Alphabet Discovery", boss: "Forest Guardian", gameplay: "Restore nature",
    color: "#4f9d69", light: "sun",
    items: [
      ch("Which letter is M?", "Find the letter M", ["M", "N", "W"], 0),
      ch("Which letter makes the /s/ sound?", "Which letter says /s/", ["S", "Z", "C"], 0),
      tr("A"), tr("M"), tr("S"),
      ch("Which is a lowercase a?", "Find lowercase a", ["a", "e", "o"], 0),
      ch("Which letter is B?", "Find the letter B", ["B", "D", "P"], 0),
      ch("Which letter makes the /t/ sound?", "Which letter says /t/", ["T", "F", "L"], 0),
    ],
  },
  {
    id: 2, name: "Echo Caverns", theme: "Crystal Caves", skill: "phonemic",
    skillLabel: "Phonemic Awareness", boss: "Echo Warden", gameplay: "Solve echo puzzles",
    color: "#3aa6e0", light: "twilight",
    items: [
      ls("Blend the sounds: /c/ /a/ /t/", "c a t", ["cat", "cap", "can"], 0),
      ls("Which word starts with /m/?", "Which starts with mmm", ["moon", "sun", "fish"], 0),
      ls("Blend the sounds: /s/ /i/ /t/", "s i t", ["sit", "sat", "set"], 0),
      ls("What is the last sound in 'dog'?", "dog", ["/g/", "/d/", "/o/"], 0),
      ls("Blend the sounds: /f/ /i/ /sh/", "f i sh", ["fish", "fin", "fit"], 0),
      ls("What is the middle sound in 'map'?", "map", ["/a/", "/m/", "/p/"], 0),
    ],
  },
  {
    id: 3, name: "Village of Closed Words", theme: "Village", skill: "shortVowels",
    skillLabel: "Short Vowels & Closed Syllables", boss: "Village Keeper", gameplay: "Rebuild the village",
    color: "#c98d4e", light: "sun",
    items: [
      bd("map"), bd("sit"), bd("red"), bd("hop"), bd("sun"),
      ch("Which word has the short /a/ sound?", "Short a", ["cat", "cot", "cut"], 0),
      dc("pet"), dc("bug"), dc("lin"), // nonsense
    ],
  },
  {
    id: 4, name: "Whispering Woods", theme: "Enchanted Forest", skill: "digraphs",
    skillLabel: "Digraphs (sh, ch, th, wh, ck)", boss: "Forest Keeper", gameplay: "Free the trapped spirits",
    color: "#5a8f4e", light: "sun",
    items: [
      ch("Which word has 'sh'?", "sh as in ship", ["ship", "sip", "tip"], 0),
      bd("chat"), bd("this"), bd("duck"),
      ch("Which word has 'ch'?", "ch as in chip", ["chip", "clip", "trip"], 0),
      dc("shop"), dc("whiz"), dc("thud"),
    ],
  },
  {
    id: 5, name: "Slime Marsh", theme: "Slime World", skill: "blends",
    skillLabel: "Consonant Blends", boss: "Gloop King", gameplay: "Complete bubble and slime puzzles",
    color: "#7bbf3f", light: "sun",
    items: [
      ls("Say the sounds in order: /s/ /l/ /i/ /p/", "s l i p", ["slip", "sip", "lip"], 0),
      bd("stop"), bd("frog"), bd("clap"),
      ch("Which word starts with a blend?", "Starts with a blend", ["trap", "tap", "rap"], 0),
      dc("blin"), dc("crup"), dc("stib"),
    ],
  },
  {
    id: 6, name: "Emberfall Basin", theme: "Volcanic Realm", skill: "trigraphs",
    skillLabel: "Trigraphs & Consonant Patterns (tch, dge)", boss: "Flame Sentinel", gameplay: "Cool the lava flows",
    color: "#d0603a", light: "sunset",
    items: [
      ch("Which word ends with 'tch'?", "tch as in catch", ["catch", "cat", "cash"], 0),
      bd("match"), bd("edge"), bd("fall"),
      ch("Which word ends with 'dge'?", "dge as in badge", ["badge", "bag", "bad"], 0),
      dc("fetch"), dc("dodge"), dc("bell"),
    ],
  },
  {
    id: 7, name: "Titan's Ridge", theme: "Mountain Realm", skill: "twoSyllable",
    skillLabel: "Two-Syllable Closed Words", boss: "Mountain Titan", gameplay: "Climb bridges and repair paths",
    color: "#8a7d6b", light: "sun",
    items: [
      dc("napkin"), dc("sunset"), dc("rabbit"),
      ch("How many syllables in 'basket'?", "bas ket", ["2", "1", "3"], 0),
      bd("mitten"), dc("goblin"), dc("picnic"),
    ],
  },
  {
    id: 8, name: "Skyreach Isles", theme: "Cloud Islands", skill: "openSyllables",
    skillLabel: "Open Syllables", boss: "Aerion", gameplay: "Build and cross cloud paths",
    color: "#6db6e8", light: "sun",
    items: [
      ch("Which has a long vowel (open syllable)?", "me", ["me", "met", "men"], 0),
      dc("go"), dc("hi"), dc("tiger"),
      dc("robot"), dc("music"), ch("Which is an open syllable word?", "no", ["no", "not", "nod"], 0),
    ],
  },
  {
    id: 9, name: "Silent Castle", theme: "Ancient Castle", skill: "silentE",
    skillLabel: "Silent E / VCe", boss: "Silent King", gameplay: "Unlock the castle gates",
    color: "#7a6ea6", light: "twilight",
    items: [
      ch("Which word has silent e?", "cake", ["cake", "cat", "can"], 0),
      bd("cake"), bd("bike"), bd("home"),
      ch("Which word says the long i?", "kite", ["kite", "kit", "kin"], 0),
      dc("cute"), dc("rope"), dc("lane"),
    ],
  },
  {
    id: 10, name: "Verdant Wilds", theme: "Jungle Ruins", skill: "schwa",
    skillLabel: "Schwa", boss: "Jungle Guardian", gameplay: "Restore the hidden ruins",
    color: "#3f8a54", light: "sun",
    items: [
      ch("Which word has the schwa sound?", "banana", ["banana", "bat", "bag"], 0),
      dc("about"), dc("zebra"), dc("pencil"),
      dc("sofa"), dc("lemon"), ch("The 'a' in 'again' sounds like…", "uh", ["/uh/", "/a/", "/ay/"], 0),
    ],
  },
  {
    id: 11, name: "Crystal Lakes", theme: "Crystal Lake Realm", skill: "vowelTeams",
    skillLabel: "Long Vowel Teams", boss: "Lake Oracle", gameplay: "Redirect crystal beams",
    color: "#3ab0c0", light: "sun",
    items: [
      bd("rain"), bd("boat"), bd("team"),
      ch("Which spells long a?", "rain", ["ai", "oa", "ee"], 0),
      dc("play"), dc("night"), dc("snow"),
    ],
  },
  {
    id: 12, name: "Falls of Lumina", theme: "Waterfall Realm", skill: "arVowels",
    skillLabel: "/ar/ R-Controlled Vowels", boss: "Echo Serpent", gameplay: "Restore the songs of the falls",
    color: "#4aa6d6", light: "sun",
    items: [
      bd("star"), bd("cart"), bd("hair"),
      ch("Which word has /ar/?", "car", ["car", "can", "cap"], 0),
      dc("shark"), dc("chair"), dc("spark"),
    ],
  },
  {
    id: 13, name: "Frostveil Expanse", theme: "Arctic Realm", skill: "orVowels",
    skillLabel: "/or/ R-Controlled Vowels", boss: "Frost Warden", gameplay: "Solve ice puzzles",
    color: "#8fd3f0", light: "twilight",
    items: [
      bd("corn"), bd("fork"), bd("more"),
      ch("Which word has /or/?", "storm", ["storm", "stem", "stir"], 0),
      dc("short"), dc("north"), dc("store"),
    ],
  },
  {
    id: 14, name: "Giant's Grove", theme: "Giant Forest", skill: "erVowels",
    skillLabel: "/er/ R-Controlled Vowels", boss: "Grove Keeper", gameplay: "Scale giant plants",
    color: "#5c9e57", light: "sun",
    items: [
      bd("bird"), bd("fern"), bd("turn"),
      ch("Which word has /er/?", "her", ["her", "hen", "hat"], 0),
      dc("first"), dc("nurse"), dc("germ"),
    ],
  },
  {
    id: 15, name: "Elemental Waters", theme: "Ocean Realm", skill: "otherVowels",
    skillLabel: "Other Vowel Sounds (oo, oi, ou, aw)", boss: "Tide Leviathan", gameplay: "Restore elemental currents",
    color: "#2f9ec0", light: "sun",
    items: [
      bd("moon"), bd("coin"), bd("cloud"),
      ch("Which word has /oy/?", "toy", ["toy", "top", "tap"], 0),
      dc("spoon"), dc("mouth"), dc("hawk"),
    ],
  },
  {
    id: 16, name: "Ancient Hollow", theme: "Ancient Woods", skill: "chunks",
    skillLabel: "Advanced Chunks & Consonant-le", boss: "Hollow Sage", gameplay: "Restore the tree hollows",
    color: "#6b6a4a", light: "twilight",
    items: [
      dc("king"), dc("bank"), dc("apple"),
      ch("Which ends in consonant-le?", "little", ["little", "letter", "lion"], 0),
      dc("sink"), dc("table"), dc("jungle"),
    ],
  },
  {
    id: 17, name: "Temple of the Ancients", theme: "Ancient Temple", skill: "latinChunks",
    skillLabel: "Latin Chunks (tion, sion, ture)", boss: "Temple Guardian", gameplay: "Decode runes",
    color: "#b08d4a", light: "sunset",
    items: [
      dc("action"), dc("nature"), dc("mission"),
      ch("Which word ends in 'tion'?", "station", ["station", "statue", "stand"], 0),
      dc("picture"), dc("motion"), dc("future"),
    ],
  },
  {
    id: 18, name: "Forge of Suffixes", theme: "Mystic Forge", skill: "suffixes",
    skillLabel: "Suffixes & Inflectional Endings", boss: "Forge Master", gameplay: "Forge and transform words",
    color: "#c06a3a", light: "sunset",
    items: [
      ch("Add -ing to 'jump'", "jumping", ["jumping", "jumped", "jumps"], 0),
      dc("running"), dc("helpful"), dc("kindness"),
      ch("Add -ed to 'want'", "wanted", ["wanted", "wanting", "wants"], 0),
      dc("faster"), dc("hopeless"),
    ],
  },
  {
    id: 19, name: "Summit of Prefixes", theme: "High Summit", skill: "prefixes",
    skillLabel: "Prefixes & Word Meaning", boss: "Sky Sage", gameplay: "Unlock ancient powers",
    color: "#7f6fbf", light: "twilight",
    items: [
      ch("'un' + 'happy' means…", "unhappy", ["not happy", "very happy", "happy again"], 0),
      dc("redo"), dc("preview"), dc("dislike"),
      ch("Which word means 'do again'?", "redo", ["redo", "undo", "predo"], 0),
      dc("unlock"), dc("mistake"),
    ],
  },
  {
    id: 20, name: "Hall of Master Readers", theme: "Reading Guild Hall", skill: "integration",
    skillLabel: "Advanced Reading & Integration", boss: "Malvex", gameplay: "Complete the final restoration",
    color: "#5a4aa0", light: "twilight",
    items: [
      dc("treasure"), dc("adventure"), dc("champion"),
      ch("Read: 'The brave Guardian restored the realm.' Who restored the realm?", "The brave Guardian restored the realm", ["The Guardian", "Malvex", "The Keeper"], 0),
      dc("knowledge"), dc("imagination"),
      ch("What is the main idea? 'Reading gives the Guardian power to heal the world.'", "Reading gives the Guardian power to heal the world", ["Reading brings power to heal", "The world is broken", "Guardians are small"], 0),
    ],
  },
];

// ordered skill list (used by the placement engine as the prerequisite chain)
export const SKILL_CHAIN = REALMS.map((r) => r.skill);
export const realmById = (id) => REALMS.find((r) => r.id === id);
export const realmBySkill = (skill) => REALMS.find((r) => r.skill === skill);
export const REGION_COUNT = REALMS.length;
export const CRYSTALS_PER_REALM = 3;   // skill nodes per realm before the boss
