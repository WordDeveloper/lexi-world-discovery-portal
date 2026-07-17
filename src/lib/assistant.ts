import { getQuestion } from "./questionnaire";

export type AssistMode = "explain" | "example" | "references" | "standards";

// Built-in reference library so the assistant is useful with no LLM key.
const REFERENCES: Record<string, string[]> = {
  Gameplay: ["Duolingo", "Genshin Impact", "Zelda: Breath of the Wild", "Hay Day"],
  AI: ["Duolingo (adaptive review)", "Khan Academy (mastery)"],
  Backend: ["Duolingo XP/Leagues", "Clash Royale progression"],
  Business: ["Duolingo (freemium + Super)", "Prodigy (school licensing)"],
  Technical: ["Unity multi-platform builds", "Genshin (stylized art at scale)"],
  UX: ["Duolingo onboarding", "Figma onboarding"],
  UI: ["Clash Royale hub", "Linear/Notion clarity"],
  Security: ["COPPA / FERPA guidance", "Clever/ClassLink rostering"],
  QA: ["Playtesting with target-age children"],
  Infrastructure: ["Vercel + Supabase reference stack"],
};

const STANDARDS: Record<string, string> = {
  Gameplay: "Industry standard: a tight 30–90 second core loop with immediate feedback, clear next action, and a visible reward cadence.",
  AI: "For children's education, prefer transparent rules-based adaptivity; keep any generative AI human-in-the-loop.",
  Backend: "Typical XP: fixed base per activity + small bonus for accuracy/streak; daily soft-cap to prevent grinding; XP never lost.",
  Business: "Ed-games commonly use freemium (first region free) + family subscription, with separate school/district licensing.",
  Technical: "For school devices, target a lightweight stylized art style; validate Chromebook/WebGL performance early.",
  UX: "Aim for a first meaningful action within 60 seconds; read-aloud everything for young/struggling readers.",
  Security: "Design COPPA/FERPA in from day one: parental consent, data minimization, retention limits, encryption.",
  QA: "Define 'mastery' quantitatively (e.g., ≥80% accuracy across N spaced attempts) and validate with real pilots.",
};

export interface AssistResult {
  mode: AssistMode;
  title: string;
  body: string;
  references?: string[];
}

// Deterministic, offline assistant response for a given question + mode.
export function assist(questionId: string, mode: AssistMode): AssistResult {
  const q = getQuestion(questionId);
  if (!q) return { mode, title: "Assistant", body: "Select a question to get help." };

  if (mode === "explain") {
    return {
      mode,
      title: "What this question means",
      body: `${q.currentUnderstanding}\n\nWhy it matters: ${q.whyWeNeedThis}\n\nIf left unanswered: ${q.impact}`,
    };
  }
  if (mode === "references") {
    const refs = REFERENCES[q.requirementType] ?? [];
    return {
      mode,
      title: "Games & products for inspiration",
      body: q.reference
        ? `From this card: ${q.reference}`
        : "Here are relevant products teams often reference for this area.",
      references: refs,
    };
  }
  if (mode === "standards") {
    return {
      mode,
      title: "Common industry approach",
      body: STANDARDS[q.requirementType] ?? "We'll recommend a sensible default based on similar products.",
      references: REFERENCES[q.requirementType],
    };
  }
  // example
  return {
    mode,
    title: "An example answer (for inspiration only)",
    body:
      q.example ??
      `A helpful answer says clearly what you want. For "${q.category}", mention: what you want, roughly how it should work, and any game or app you would compare it to. We never fill this in for you. Your words matter most.`,
  };
}
