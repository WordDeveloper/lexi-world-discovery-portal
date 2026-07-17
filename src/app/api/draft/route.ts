import { NextRequest, NextResponse } from "next/server";
import { draftSchema } from "@/lib/validation";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { token, answers, currentSection, completion, version } = parsed.data;
  const supabase = getAdminClient();

  // No backend configured: the browser keeps the draft in localStorage.
  if (!supabase) {
    return NextResponse.json({ ok: true, stored: "local" });
  }

  const { error } = await supabase.from("drafts").upsert(
    {
      token,
      answers,
      current_section: currentSection ?? null,
      completion: completion ?? 0,
      version,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort: mark the invitation as opened.
  await supabase.from("invitations").update({ status: "opened" }).eq("token", token);

  return NextResponse.json({ ok: true, stored: "supabase" });
}
