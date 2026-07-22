/* ============================================================
   main.js — bootstrap. Decides the entry screen based on saved
   state (fresh install vs returning) and starts the router.
   ============================================================ */

import { state, activeProfile } from "./core/state.js";
import { go, reset, applyBodySettings } from "./core/router.js";
import { startAmbient } from "./core/audio.js";

// Unlock audio on first interaction (browser autoplay policy).
function unlockAudio() {
  startAmbient();
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
}
window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);

function boot() {
  const r = state.root;
  activeProfile();
  applyBodySettings();

  // Routing decision (blueprint §2 / §6):
  if (!r.account || !r.consent) {
    // Fresh install → splash → adult setup
    reset("splash");
  } else if (!r.profiles.length) {
    reset("profiles");
  } else if (state.profile && !state.profile.reading.initiationDone) {
    // Profile exists but never onboarded → continue onboarding
    reset("splash");
  } else {
    // Returning → splash then profile picker
    reset("splash");
  }
}

// Global error guard so a screen error never white-screens the app.
window.addEventListener("error", (e) => console.error("[lexi] error", e.message));

boot();
