"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client (anon key). All access is token-scoped by RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// True when Supabase env vars are present; lets the app degrade gracefully
// to localStorage-only drafts during local development without a project.
export function supabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
