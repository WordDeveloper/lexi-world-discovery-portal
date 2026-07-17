import { QUESTIONS, SECTIONS, QUESTIONNAIRE_VERSION } from "./questionnaire";
import {
  completion,
  isAnswered,
  isVisible,
  readinessScore,
  riskSummary,
  sectionSummaries,
  textVal,
  missingAll,
} from "./summary";
import type { AnswerMap } from "./types";

export interface ExportMeta {
  clientName?: string;
  email?: string;
  token: string;
  submittedAt?: string;
}

function answerLine(id: string, answers: AnswerMap): string {
  const a = answers[id];
  if (!a) return "_(no answer)_";
  const parts: string[] = [];
  if (a.confirm) parts.push(`Choice: ${a.confirm.toUpperCase()}`);
  const t = textVal(a);
  if (t) parts.push(t);
  if (a.flaggedUncertain) parts.push("⚑ flagged uncertain");
  if (a.markedForDiscussion) parts.push("💬 for discussion");
  return parts.length ? parts.join(" — ") : "_(no answer)_";
}

// ── JSON export ───────────────────────────────────────────────
export function toJSON(answers: AnswerMap, meta: ExportMeta) {
  return {
    project: "Lexi World Discovery",
    version: QUESTIONNAIRE_VERSION,
    client: { name: meta.clientName ?? null, email: meta.email ?? null, token: meta.token },
    submittedAt: meta.submittedAt ?? new Date().toISOString(),
    completion: completion(answers),
    readiness: readinessScore(answers),
    risks: riskSummary(answers),
    sections: sectionSummaries(answers),
    answers: QUESTIONS.filter((q) => isVisible(q, answers)).map((q) => ({
      id: q.id,
      number: q.number,
      section: q.section,
      category: q.category,
      requirementType: q.requirementType,
      priority: q.priority,
      kind: q.kind,
      question: q.question,
      answered: isAnswered(q, answers[q.id]),
      confirm: answers[q.id]?.confirm ?? null,
      value: answers[q.id]?.value ?? null,
      flaggedUncertain: !!answers[q.id]?.flaggedUncertain,
      markedForDiscussion: !!answers[q.id]?.markedForDiscussion,
    })),
  };
}

// ── Markdown export (client copy) ─────────────────────────────
export function toMarkdown(answers: AnswerMap, meta: ExportMeta): string {
  const lines: string[] = [];
  lines.push(`# Lexi World — Discovery Responses`);
  lines.push("");
  lines.push(`**Client:** ${meta.clientName ?? "—"}  `);
  lines.push(`**Version:** ${QUESTIONNAIRE_VERSION}  `);
  lines.push(`**Completion:** ${completion(answers)}%  •  **Development readiness:** ${readinessScore(answers)}%`);
  lines.push("");
  for (const s of SECTIONS) {
    const qs = QUESTIONS.filter((q) => q.section === s.id && isVisible(q, answers));
    if (!qs.length) continue;
    lines.push(`## ${s.title}`);
    lines.push("");
    for (const q of qs) {
      lines.push(`### Q${q.number}. ${q.category}`);
      lines.push(`*${q.question}*`);
      lines.push("");
      lines.push(answerLine(q.id, answers));
      lines.push("");
    }
  }
  return lines.join("\n");
}

// ── Internal developer summary (Markdown) ─────────────────────
export function toDeveloperSummary(answers: AnswerMap, meta: ExportMeta): string {
  const lines: string[] = [];
  lines.push(`# Lexi World — Internal Developer Summary`);
  lines.push(`Client: ${meta.clientName ?? "—"} | Version ${QUESTIONNAIRE_VERSION} | Completion ${completion(answers)}% | Readiness ${readinessScore(answers)}%`);
  lines.push("");
  const risks = riskSummary(answers);
  lines.push(`## Risk summary (${risks.length})`);
  for (const r of risks) lines.push(`- [${r.level}] ${r.reason}`);
  if (!risks.length) lines.push("- No open blocking/high risks detected.");
  lines.push("");
  const missing = missingAll(answers);
  lines.push(`## Missing answers (${missing.length})`);
  for (const q of missing) lines.push(`- ${q.category} (${q.priority})`);
  if (!missing.length) lines.push("- Everything answered.");
  lines.push("");
  lines.push(`## Answers by developer relevance`);
  for (const q of QUESTIONS.filter((q) => isVisible(q, answers))) {
    lines.push(`- **${q.category}** [${q.requirementType} • ${q.priority}] — teams: ${q.developerNote}`);
    lines.push(`  - ${answerLine(q.id, answers)}`);
  }
  return lines.join("\n");
}
