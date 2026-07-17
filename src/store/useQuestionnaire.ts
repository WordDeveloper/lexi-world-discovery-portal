"use client";

import { create } from "zustand";
import type { AnswerMap, AnswerValue, ConfirmChoice } from "@/lib/types";
import { QUESTIONNAIRE_VERSION } from "@/lib/questionnaire";
import { completion } from "@/lib/summary";

type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

interface HistoryEntry {
  answers: AnswerMap;
}

interface QState {
  token: string;
  answers: AnswerMap;
  currentSection: string;
  saveState: SaveState;
  lastSavedAt: string | null;
  history: HistoryEntry[];
  searchQuery: string;

  init: (token: string, answers: AnswerMap, section?: string) => void;
  setSection: (id: string) => void;
  setSearch: (q: string) => void;

  setValue: (id: string, value: AnswerValue["value"]) => void;
  setConfirm: (id: string, choice: ConfirmChoice) => void;
  toggleFlag: (id: string, key: "flaggedUncertain" | "markedForDiscussion" | "bookmarked") => void;

  undo: () => void;
  save: () => Promise<void>;
  scheduleSave: () => void;
  completionPct: () => number;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function localKey(token: string) {
  return `lexi-draft:${token}`;
}

export const useQuestionnaire = create<QState>((set, get) => ({
  token: "",
  answers: {},
  currentSection: "vision",
  saveState: "idle",
  lastSavedAt: null,
  history: [],
  searchQuery: "",

  init: (token, answers, section) => {
    // Merge any newer localStorage draft (offline resilience).
    let merged = answers;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(localKey(token));
        if (raw) {
          const local = JSON.parse(raw) as { answers: AnswerMap; updatedAt: string };
          if (local?.answers && Object.keys(local.answers).length >= Object.keys(answers).length) {
            merged = local.answers;
          }
        }
      } catch {
        /* ignore */
      }
    }
    set({ token, answers: merged, currentSection: section ?? "vision" });
  },

  setSection: (id) => set({ currentSection: id }),
  setSearch: (q) => set({ searchQuery: q }),

  setValue: (id, value) => {
    const prev = get().answers;
    const next: AnswerMap = {
      ...prev,
      [id]: { ...prev[id], value, updatedAt: new Date().toISOString() },
    };
    set({ answers: next, history: [...get().history.slice(-24), { answers: prev }] });
    get().scheduleSave();
  },

  setConfirm: (id, choice) => {
    const prev = get().answers;
    const next: AnswerMap = {
      ...prev,
      [id]: { ...prev[id], confirm: choice, updatedAt: new Date().toISOString() },
    };
    set({ answers: next, history: [...get().history.slice(-24), { answers: prev }] });
    get().scheduleSave();
  },

  toggleFlag: (id, key) => {
    const prev = get().answers;
    const cur = prev[id] ?? {};
    const next: AnswerMap = {
      ...prev,
      [id]: { ...cur, [key]: !cur[key], updatedAt: new Date().toISOString() },
    };
    set({ answers: next });
    get().scheduleSave();
  },

  undo: () => {
    const hist = get().history;
    if (!hist.length) return;
    const last = hist[hist.length - 1];
    set({ answers: last.answers, history: hist.slice(0, -1) });
    get().scheduleSave();
  },

  scheduleSave: () => {
    if (saveTimer) clearTimeout(saveTimer);
    set({ saveState: "saving" });
    // Always mirror to localStorage immediately.
    const { token, answers } = get();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(localKey(token), JSON.stringify({ answers, updatedAt: new Date().toISOString() }));
      } catch {
        /* quota */
      }
    }
    saveTimer = setTimeout(() => get().save(), 900);
  },

  save: async () => {
    const { token, answers, currentSection } = get();
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers,
          currentSection,
          completion: completion(answers),
          version: QUESTIONNAIRE_VERSION,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      set({ saveState: "saved", lastSavedAt: new Date().toISOString() });
    } catch {
      // Offline / no Supabase — localStorage already holds the draft.
      set({ saveState: "offline", lastSavedAt: new Date().toISOString() });
    }
  },

  completionPct: () => completion(get().answers),
}));
