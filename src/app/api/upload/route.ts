import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Accepted upload types (mirrors the questionnaire spec).
const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "video/mp4",
  "video/quicktime",
  "application/zip",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });

  const token = String(form.get("token") ?? "");
  const questionId = form.get("questionId") ? String(form.get("questionId")) : null;
  const file = form.get("file");

  if (!token || token.length < 6) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `${token}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("discovery-uploads")
    .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("discovery-uploads").getPublicUrl(path);

  const { data: row, error: rowErr } = await supabase
    .from("uploaded_files")
    .insert({
      token,
      question_id: questionId,
      name: file.name,
      size: file.size,
      mime_type: file.type,
      storage_path: path,
      public_url: pub.publicUrl,
    })
    .select("id")
    .single();
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    id: row.id,
    name: file.name,
    size: file.size,
    type: file.type,
    url: pub.publicUrl,
  });
}
