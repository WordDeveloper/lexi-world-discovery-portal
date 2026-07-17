import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { buildSubmissionPdf } from "@/lib/pdf";
import { toJSON, toMarkdown, toDeveloperSummary } from "@/lib/exporters";
import type { AnswerMap } from "@/lib/types";

export const runtime = "nodejs";

function authorized(key?: string | null): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  return !!expected && key === expected;
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const format = (searchParams.get("format") ?? "json").toLowerCase();

  if (!authorized(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Backend not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("responses")
    .select("token,client_name,email,answers,submitted_at")
    .eq("token", params.token)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const answers = data.answers as AnswerMap;
  const meta = {
    token: data.token,
    clientName: data.client_name ?? undefined,
    email: data.email ?? undefined,
    submittedAt: data.submitted_at,
  };

  if (format === "pdf") {
    const pdf = await buildSubmissionPdf(answers, meta);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lexi-discovery-${params.token}.pdf"`,
      },
    });
  }

  if (format === "md" || format === "markdown") {
    return new NextResponse(toMarkdown(answers, meta), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="lexi-discovery-${params.token}.md"` },
    });
  }

  if (format === "dev" || format === "developer") {
    return new NextResponse(toDeveloperSummary(answers, meta), {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="lexi-discovery-${params.token}-developer.md"` },
    });
  }

  // default: json
  return NextResponse.json(toJSON(answers, meta));
}
