import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function authorized(key?: string | null): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  return !!expected && key === expected;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (!authorized(searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Backend not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("responses")
    .select("token,client_name,email,version,completion,summary,answers,submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(JSON.stringify(data ?? [], null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lexi-discovery-all-${Date.now()}.json"`,
    },
  });
}
