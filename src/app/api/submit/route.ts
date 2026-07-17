import { NextRequest, NextResponse } from "next/server";
import { submitSchema } from "@/lib/validation";
import { getAdminClient } from "@/lib/supabase/admin";
import { buildSubmissionPdf } from "@/lib/pdf";
import { sendSubmissionEmail } from "@/lib/email";
import { completion, readinessScore, riskSummary, sectionSummaries } from "@/lib/summary";
import type { UploadedFileMeta } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// The client only ever receives a generic success or failure result.
// Where the submission is delivered (which mailbox, etc.) is never exposed.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please review your answers and try again." }, { status: 422 });
  }

  const { token, clientName, email, answers, version } = parsed.data;
  const submittedAt = new Date().toISOString();
  const meta = { token, clientName, email: email || undefined, submittedAt };

  const supabase = getAdminClient();

  let files: UploadedFileMeta[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("uploaded_files")
      .select("id,question_id,name,size,mime_type,public_url,created_at")
      .eq("token", token);
    files = (data ?? []).map((f: any) => ({
      id: f.id,
      questionId: f.question_id ?? undefined,
      name: f.name,
      size: f.size,
      type: f.mime_type ?? "",
      url: f.public_url ?? "",
      createdAt: f.created_at,
    }));
  }

  const summary = {
    completion: completion(answers),
    readiness: readinessScore(answers),
    risks: riskSummary(answers),
    sections: sectionSummaries(answers),
  };

  let stored = false;
  let emailed = false;

  if (supabase) {
    const { error } = await supabase.from("responses").insert({
      token,
      client_name: clientName ?? null,
      email: email || null,
      version,
      answers,
      completion: summary.completion,
      summary,
      submitted_at: submittedAt,
    });
    if (error) {
      console.error("[submit] store failed:", error.message);
    } else {
      stored = true;
      await supabase.from("invitations").update({ status: "submitted" }).eq("token", token);
    }
  }

  try {
    const pdf = await buildSubmissionPdf(answers, meta);
    const result = await sendSubmissionEmail({ answers, meta, pdf, files });
    emailed = result.ok;
    if (!result.ok) console.error("[submit] email failed:", result.error);
  } catch (e: any) {
    console.error("[submit] email/pdf error:", e?.message);
  }

  if (stored || emailed) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, error: "We couldn't submit your responses just now. Please try again in a moment." },
    { status: 502 }
  );
}
