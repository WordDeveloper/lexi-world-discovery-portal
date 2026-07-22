/* ============================================================
   scenes.js — the single ASSET MANIFEST for the whole game.
   Every art asset the game can use is named here with its final
   filename in assets/images/. Drop a file with that exact name and
   the game picks it up automatically. If a file is missing, screens
   fall back to built-in SVG/gradients so nothing ever breaks.
   Artist delivers PNG (transparent) characters/bosses/icons/UI and
   16:9 backgrounds using these names.
   ============================================================ */

const B = "assets/images/";

// Named scene backgrounds
export const SCENES = {
  title:    B + "bg_title.jpg",
  ceremony: B + "bg_ceremony.jpg",
  sanctuary:B + "bg_sanctuary.jpg",
  tree:     B + "bg_title.jpg",
};

// Realm backgrounds (16:9), by Scope & Sequence realm id
export const REALM_BG = {
  1: B + "bg_realm_01_awakening.jpg", 2: B + "bg_realm_02_echocaverns.jpg",
  3: B + "bg_realm_03_village.jpg",   4: B + "bg_realm_04_whisperingwoods.jpg",
  5: B + "bg_realm_05_slimemarsh.jpg",6: B + "bg_realm_06_emberfall.jpg",
  7: B + "bg_realm_07_titansridge.jpg",8: B + "bg_realm_08_skyreach.jpg",
  9: B + "bg_realm_09_silentcastle.jpg",10: B + "bg_realm_10_verdantwilds.jpg",
  11:B + "bg_realm_11_crystallakes.jpg",12: B + "bg_realm_12_fallsoflumina.jpg",
  13:B + "bg_realm_13_frostveil.jpg", 14: B + "bg_realm_14_giantsgrove.jpg",
  15:B + "bg_realm_15_elementalwaters.jpg",16: B + "bg_realm_16_ancienthollow.jpg",
  17:B + "bg_realm_17_temple.jpg",    18: B + "bg_realm_18_forge.jpg",
  19:B + "bg_realm_19_summit.jpg",    20: B + "bg_realm_20_hall.jpg",
};

// Boss character art (transparent PNG), by realm id
export const BOSS_IMG = {
  1: B + "boss_01_forestguardian.png", 2: B + "boss_02_echowarden.png",
  3: B + "boss_03_villagekeeper.png",  4: B + "boss_04_forestkeeper.png",
  5: B + "boss_05_gloopking.png",      6: B + "boss_06_flamesentinel.png",
  7: B + "boss_07_mountaintitan.png",  8: B + "boss_08_aerion.png",
  9: B + "boss_09_silentking.png",     10:B + "boss_10_jungleguardian.png",
  11:B + "boss_11_lakeoracle.png",     12:B + "boss_12_echoserpent.png",
  13:B + "boss_13_frostwarden.png",    14:B + "boss_14_grovekeeper.png",
  15:B + "boss_15_tideleviathan.png",  16:B + "boss_16_hollowsage.png",
  17:B + "boss_17_templeguardian.png", 18:B + "boss_18_forgemaster.png",
  19:B + "boss_19_skysage.png",        20:B + "char_malvex.png",
};

// Guardian / mentors / NPCs (transparent PNG)
export const CHAR = {
  guardian_idle:    B + "char_guardian_idle.png",
  guardian_cast:    B + "char_guardian_cast.png",
  guardian_cheer:   B + "char_guardian_cheer.png",
  guardian_portrait:B + "char_guardian_portrait.png",
  keeper:           B + "char_keeper.png",
  keeper_portrait:  B + "char_keeper_portrait.png",
  malvex:           B + "char_malvex.png",
  elder_rootway:    B + "npc_elder_rootway.png",
  villager:         B + "npc_villager.png",
};

// Storyling by growth stage (0..4) + expressions
export const STORYLING_IMG = {
  0: B + "char_storyling_1_hatchling.png",
  1: B + "char_storyling_2_companion.png",
  2: B + "char_storyling_3_guardianspirit.png",
  3: B + "char_storyling_4_radiant.png",
  4: B + "char_storyling_5_legendary.png",
  attack: B + "char_storyling_attack.png",
  cheer:  B + "char_storyling_cheer.png",
};

// HUD icons (transparent PNG)
export const ICON = {
  heart: B + "icon_heart.png", shard: B + "icon_shard.png",
  xp:    B + "icon_xp.png",    coin:  B + "icon_coin.png",
  book:  B + "icon_book.png",
};

// UI frames (transparent PNG) — optional, screens work without them
export const UI = {
  panel: B + "ui_panel.png", bar: B + "ui_bar_frame.png",
  card:  B + "ui_ability_card.png", button: B + "ui_button.png",
  tile:  B + "ui_tile.png",
};

export function realmArt(id) {
  return { bg: REALM_BG[id] || null, boss: BOSS_IMG[id] || null, sheet: null };
}
export function storylingImg(stage) { return STORYLING_IMG[stage] || STORYLING_IMG[0]; }
