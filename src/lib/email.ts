import { Resend } from "resend";
import { completion, readinessScore, riskSummary, missingAll, sectionSummaries } from "./summary";
import { escapeHtml } from "./validation";
import { toJSON } from "./exporters";
import type { AnswerMap, UploadedFileMeta } from "./types";
import type { ExportMeta } from "./exporters";

interface SendArgs {
  answers: AnswerMap;
  meta: ExportMeta;
  pdf: Uint8Array;
  files: UploadedFileMeta[];
}

export async function sendSubmissionEmail({ answers, meta, pdf, files }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;
  if (!apiKey || !from || !to) {
    return { ok: false, error: "Email not configured (RESEND_API_KEY / MAIL_FROM / MAIL_TO)." };
  }

  const resend = new Resend(apiKey);
  const pct = completion(answers);
  const readiness = readinessScore(answers);
  const risks = riskSummary(answers);
  const missing = missingAll(answers);
  const sections = sectionSummaries(answers);

  const riskRows = risks.length
    ? risks.map((r) => `<li><strong>[${r.level}]</strong> ${escapeHtml(r.reason)}</li>`).join("")
    : "<li>No open blocking/high risks detected.</li>";

  const sectionRows = sections
    .map((s) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(s.title)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${s.answered}/${s.total} (${s.completion}%)</td></tr>`)
    .join("");

  const fileRows = files.length
    ? files.map((f) => `<li>${escapeHtml(f.name)} — ${(f.size / 1024).toFixed(0)} KB ${f.url ? `(<a href="${escapeHtml(f.url)}">link</a>)` : ""}</li>`).join("")
    : "<li>No files uploaded.</li>";

  const html = `
  <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1A1726;max-width:640px;margin:auto">
    <div style="background:#2E4374;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0">
      <div style="font-size:13px;letter-spacing:1px;color:#C9BEE8">STORYLIGHT STUDIOS · LEXI WORLD</div>
      <div style="font-size:22px;font-weight:700;margin-top:4px">New Discovery Submission</div>
    </div>
    <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 14px 14px">
      <p style="margin:0 0 4px"><strong>Client:</strong> ${escapeHtml(meta.clientName || "—")}</p>
      <p style="margin:0 0 4px"><strong>Email:</strong> ${escapeHtml(meta.email || "—")}</p>
      <p style="margin:0 0 16px"><strong>Submitted:</strong> ${escapeHtml(meta.submittedAt || new Date().toISOString())}</p>

      <div style="display:flex;gap:12px;margin:16px 0">
        <div style="flex:1;background:#F3EEFB;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:700;color:#6C4AB6">${pct}%</div>
          <div style="font-size:12px;color:#6B6880">Completion</div>
        </div>
        <div style="flex:1;background:#EAF3EC;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:700;color:#2F6B44">${readiness}%</div>
          <div style="font-size:12px;color:#6B6880">Dev readiness</div>
        </div>
        <div style="flex:1;background:#FDECEC;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:700;color:#B03A2E">${missing.length}</div>
          <div style="font-size:12px;color:#6B6880">Unanswered</div>
        </div>
      </div>

      <h3 style="color:#2E4374;margin:20px 0 8px">Section progress</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${sectionRows}</table>

      <h3 style="color:#2E4374;margin:20px 0 8px">Risk summary</h3>
      <ul style="font-size:14px;padding-left:18px">${riskRows}</ul>

      <h3 style="color:#2E4374;margin:20px 0 8px">Uploaded files</h3>
      <ul style="font-size:14px;padding-left:18px">${fileRows}</ul>

      <p style="font-size:13px;color:#6B6880;margin-top:20px">Attached: PDF summary and full JSON export.</p>
    </div>
  </div>`;

  const jsonBuffer = Buffer.from(JSON.stringify(toJSON(answers, meta), null, 2), "utf-8");

  try {
    await resend.emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
      subject: `Lexi World Discovery — ${meta.clientName || "New submission"} (${pct}% complete)`,
      html,
      attachments: [
        { filename: `lexi-world-discovery-${meta.token}.pdf`, content: Buffer.from(pdf) },
        { filename: `lexi-world-discovery-${meta.token}.json`, content: jsonBuffer },
      ],
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Email send failed." };
  }
}
