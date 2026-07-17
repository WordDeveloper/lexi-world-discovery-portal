import Link from "next/link";
import { getAdminClient } from "@/lib/supabase/admin";
import { QUESTIONNAIRE_VERSION } from "@/lib/questionnaire";

export const dynamic = "force-dynamic";

// Simple gate: /admin?key=YOUR_ADMIN_ACCESS_TOKEN
function authorized(key?: string): boolean {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  return !!expected && key === expected;
}

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  if (!authorized(searchParams.key)) {
    return (
      <main className="container flex min-h-screen items-center justify-center">
        <div className="max-w-sm rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-soft">
          <h1 className="text-lg font-semibold text-ink">Admin access</h1>
          <p className="mt-2 text-sm text-muted">
            Append <code className="rounded bg-slate-100 px-1">?key=YOUR_ADMIN_ACCESS_TOKEN</code> to the URL to view submissions.
          </p>
        </div>
      </main>
    );
  }

  const supabase = getAdminClient();
  const key = searchParams.key!;

  let responses: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("responses")
      .select("id,token,client_name,email,completion,submitted_at,version")
      .order("submitted_at", { ascending: false })
      .limit(200);
    responses = data ?? [];
  }

  return (
    <main className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Discovery submissions</h1>
          <p className="text-sm text-muted">Active questionnaire version: {QUESTIONNAIRE_VERSION}</p>
        </div>
        <a
          href={`/api/export/all?key=${encodeURIComponent(key)}`}
          className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          Export all (JSON)
        </a>
      </div>

      {!supabase && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Supabase is not configured. Set the environment variables to view stored submissions.
        </div>
      )}

      {supabase && responses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-muted">
          No submissions yet.
        </div>
      )}

      {responses.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Exports</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{r.client_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{r.email ?? "—"}</td>
                  <td className="px-4 py-3">{r.completion ?? 0}%</td>
                  <td className="px-4 py-3 text-muted">{new Date(r.submitted_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a className="text-brand-700 hover:underline" href={`/api/export/${r.token}?format=pdf&key=${encodeURIComponent(key)}`}>PDF</a>
                      <a className="text-brand-700 hover:underline" href={`/api/export/${r.token}?format=json&key=${encodeURIComponent(key)}`}>JSON</a>
                      <a className="text-brand-700 hover:underline" href={`/api/export/${r.token}?format=md&key=${encodeURIComponent(key)}`}>MD</a>
                      <Link className="text-brand-700 hover:underline" href={`/q/${r.token}`}>Open</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
