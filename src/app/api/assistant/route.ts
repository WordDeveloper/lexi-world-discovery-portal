import { NextRequest, NextResponse } from "next/server";
import { assist, AssistMode } from "@/lib/assistant";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  questionId: z.string().min(1).max(64),
  mode: z.enum(["explain", "example", "references", "standards"]),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const result = assist(parsed.data.questionId, parsed.data.mode as AssistMode);
  return NextResponse.json(result);
}
