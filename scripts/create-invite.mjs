/**
 * Create a secure client invitation link.
 *
 * Usage:
 *   node scripts/create-invite.mjs "Crystal Burch" crystal@storylight.com
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env
 * (load a .env.local via: `node --env-file=.env.local scripts/create-invite.mjs ...`).
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [, , clientName = "Client", email = ""] = process.argv;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const token = randomBytes(18).toString("base64url"); // ~24 chars, URL-safe
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error } = await supabase.from("invitations").insert({
  token,
  email: email || null,
  client_name: clientName,
  version: "2.0.0",
  status: "sent",
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Invitation created.");
console.log("Client:", clientName);
console.log("Secure link:", `${appUrl}/q/${token}`);
