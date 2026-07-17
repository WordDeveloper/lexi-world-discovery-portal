import { QUESTIONS, SECTIONS } from "./questionnaire";
import type { AnswerMap, AnswerValue, Question } from "./types";

// ── Visibility (conditional logic) ────────────────────────────
export function isVisible(q: Question, answers: AnswerMap): boolean {
  if (!q.visibleWhen) return true;
  const dep = answers[q.visibleWhen.questionId];
  if (!dep) return false;
  const v = dep.value;
  const values = Array.isArray(v) ? v : v == null ? [] : [String(v)];
  return q.visibleWhen.anyOf.some((a) => values.includes(a));
}

export function visibleQuestions(answers: AnswerMap): Question[] {
  return QUESTIONS.filter((q) => isVisible(q, answers));
}

// ── Answered? ─────────────────────────────────────────────────
export function isAnswered(q: Question, a?: AnswerValue): boolean {
  if (!a) return false;
  // Confirmation cards count as answered once a choice is made
  // (and, if "modify", a note is provided).
  if (q.confirmationStatement) {
    if (!a.confirm) return false;
    if (a.confirm === "modify") return !!textVal(a).trim();
    return true;
  }
  const v = a.value;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return true;
  if (typeof v === "boolean") return true;
  return !!(v && String(v).trim());
}

export function textVal(a?: AnswerValue): string {
  if (!a) return "";
  const v = a.value;
  if (v == null) return "";
  return Array.isArray(v) ? v.join(", ") : String(v);
}

// ── Completion ────────────────────────────────────────────────
export function completion(answers: AnswerMap): number {
  const visible = visibleQuestions(answers);
  if (!visible.length) return 0;
  const done = visible.filter((q) => isAnswered(q, answers[q.id])).length;
  return Math.round((done / visible.length) * 100);
}

export function sectionCompletion(sectionId: string, answers: AnswerMap): number {
  const visible = visibleQuestions(answers).filter((q) => q.section === sectionId);
  if (!visible.length) return 0;
  const done = visible.filter((q) => isAnswered(q, answers[q.id])).length;
  return Math.round((done / visible.length) * 100);
}

// ── Missing / flags ───────────────────────────────────────────
export function missingRequired(answers: AnswerMap): Question[] {
  return visibleQuestions(answers).filter(
    (q) => q.required && !isAnswered(q, answers[q.id])
  );
}

export function missingAll(answers: AnswerMap): Question[] {
  return visibleQuestions(answers).filter((q) => !isAnswered(q, answers[q.id]));
}

export function flagged(answers: AnswerMap, key: "flaggedUncertain" | "markedForDiscussion" | "bookmarked"): Question[] {
  return QUESTIONS.filter((q) => answers[q.id]?.[key]);
}

// ── Development readiness score ────────────────────────────────
// Weighted by priority so answering Critical items moves the needle most.
export function readinessScore(answers: AnswerMap): number {
  const weights: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const visible = visibleQuestions(answers);
  let total = 0;
  let got = 0;
  for (const q of visible) {
    const w = weights[q.priority] ?? 1;
    total += w;
    if (isAnswered(q, answers[q.id])) got += w;
  }
  return total ? Math.round((got / total) * 100) : 0;
}

// ── Risk summary ──────────────────────────────────────────────
export interface RiskItem {
  level: "Blocking" | "High" | "Medium";
  category: string;
  reason: string;
}

export function riskSummary(answers: AnswerMap): RiskItem[] {
  const risks: RiskItem[] = [];
  for (const q of visibleQuestions(answers)) {
    if (isAnswered(q, answers[q.id])) continue;
    if (q.priority === "Critical") {
      risks.push({ level: "Blocking", category: q.category, reason: `Unanswered critical item: ${q.category}.` });
    } else if (q.priority === "High") {
      risks.push({ level: "High", category: q.category, reason: `High-priority item still open: ${q.category}.` });
    }
  }
  // Uncertain flags are a softer risk worth surfacing.
  for (const q of flagged(answers, "flaggedUncertain")) {
    risks.push({ level: "Medium", category: q.category, reason: `Client marked this answer as uncertain: ${q.category}.` });
  }
  return risks;
}

// ── Per-section narrative summary (for the review page/email) ──
export interface SectionSummary {
  id: string;
  title: string;
  completion: number;
  answered: number;
  total: number;
}

export function sectionSummaries(answers: AnswerMap): SectionSummary[] {
  return SECTIONS.map((s) => {
    const visible = visibleQuestions(answers).filter((q) => q.section === s.id);
    const answered = visible.filter((q) => isAnswered(q, answers[q.id])).length;
    return {
      id: s.id,
      title: s.title,
      completion: visible.length ? Math.round((answered / visible.length) * 100) : 0,
      answered,
      total: visible.length,
    };
  });
}
