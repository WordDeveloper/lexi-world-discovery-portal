import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { QUESTIONS, SECTIONS, QUESTIONNAIRE_VERSION } from "./questionnaire";
import { completion, readinessScore, riskSummary, isVisible, textVal } from "./summary";
import type { AnswerMap } from "./types";
import type { ExportMeta } from "./exporters";

const BRAND = rgb(0x2e / 255, 0x43 / 255, 0x74 / 255);
const ACCENT = rgb(0x6c / 255, 0x4a / 255, 0xb6 / 255);
const INK = rgb(0.12, 0.11, 0.15);
const MUTED = rgb(0.42, 0.41, 0.5);

// Generate a polished PDF summary of the submission. Returns bytes.
export async function buildSubmissionPdf(answers: AnswerMap, meta: ExportMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 54;
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;

  const wrap = (text: string, f: PDFFont, size: number, maxW: number): string[] => {
    const words = String(text).replace(/\s+/g, " ").trim().split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const ensure = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - margin;
    }
  };

  const write = (text: string, opts: { f?: PDFFont; size?: number; color?: any; gap?: number } = {}) => {
    const f = opts.f ?? font;
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const maxW = A4.w - margin * 2;
    for (const ln of wrap(text, f, size, maxW)) {
      ensure(size + 4);
      page.drawText(ln, { x: margin, y, size, font: f, color });
      y -= size + 4;
    }
    if (opts.gap) y -= opts.gap;
  };

  // Header
  write("LEXI WORLD", { f: bold, size: 20, color: BRAND });
  write("Discovery Submission Summary", { f: bold, size: 13, color: ACCENT, gap: 6 });
  write(`Client: ${meta.clientName ?? "—"}    Version: ${QUESTIONNAIRE_VERSION}`, { size: 10, color: MUTED });
  write(`Submitted: ${meta.submittedAt ?? new Date().toISOString()}`, { size: 10, color: MUTED, gap: 8 });

  // Scorecards
  write(`Completion: ${completion(answers)}%     Development readiness: ${readinessScore(answers)}%`, { f: bold, size: 12, color: BRAND, gap: 10 });

  // Risks
  const risks = riskSummary(answers);
  write(`Risk summary (${risks.length})`, { f: bold, size: 12, color: ACCENT, gap: 2 });
  if (!risks.length) {
    write("• No open blocking or high risks detected.", { size: 10, color: MUTED, gap: 6 });
  } else {
    for (const r of risks.slice(0, 40)) {
      write(`• [${r.level}] ${r.reason}`, { size: 10, gap: 0 });
    }
    y -= 6;
  }

  // Answers grouped by section
  for (const s of SECTIONS) {
    const qs = QUESTIONS.filter((q) => q.section === s.id && isVisible(q, answers));
    if (!qs.length) continue;
    ensure(30);
    write(s.title, { f: bold, size: 13, color: BRAND, gap: 2 });
    for (const q of qs) {
      const a = answers[q.id];
      write(`Q${q.number}. ${q.category}  [${q.priority}]`, { f: bold, size: 10.5, color: INK });
      write(q.question, { size: 9.5, color: MUTED });
      const choice = a?.confirm ? `Choice: ${a.confirm.toUpperCase()}. ` : "";
      const val = textVal(a) || (a?.confirm ? "" : "(no answer)");
      write(`${choice}${val}`, { size: 10, color: INK, gap: 6 });
    }
    y -= 4;
  }

  return await doc.save();
}
