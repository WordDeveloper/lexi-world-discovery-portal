import { NextRequest, NextResponse } from "next/server";

// Lightweight in-memory rate limiter (per-instance). For multi-region scale,
// swap for Upstash/Redis; this covers single-instance and dev safely.
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_REQ;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  // ── Rate limiting (API only) ──
  if (isApi) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── CSRF/origin check on mutations ──
    if (isMutation) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin) {
        try {
          const o = new URL(origin).host;
          if (host && o !== host) {
            return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Bad origin" }, { status: 403 });
        }
      }
    }
  }

  // ── Security headers ──
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
