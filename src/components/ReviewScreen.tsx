"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useQuestionnaire } from "@/store/useQuestionnaire";
import {
  completion,
  readinessScore,
  riskSummary,
  missingRequired,
  missingAll,
  sectionSummaries,
} from "@/lib/summary";
import { Button, Card, Progress } from "./ui";
import { QUESTIONNAIRE_VERSION } from "@/lib/questionnaire";

export function ReviewScreen({ onBack, onSubmitted }: { onBack: () => void; onSubmitted: () => void }) {
  const answers = useQuestionnaire((s) => s.answers);
  const token = useQuestionnaire((s) => s.token);
  const [clientName, setClientName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pct = completion(answers);
  const readiness = readinessScore(answers);
  const risks = riskSummary(answers);
  const missReq = missingRequired(answers);
  const miss = missingAll(answers);
  const sections = sectionSummaries(answers);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientName: clientName.trim(), email: email.trim(), answers, version: QUESTIONNAIRE_VERSION }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Submission failed.");
      }
      onSubmitted();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to questions
      </button>

      <h1 className="text-2xl font-bold text-ink">Review &amp; submit</h1>
      <p className="mt-1 text-muted">A quick summary before you send this to the team.</p>

      {/* Scorecards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Completion" value={`${pct}%`} tone="brand"><Progress value={pct} className="mt-3" /></ScoreCard>
        <ScoreCard label="Development readiness" value={`${readiness}%`} tone="emerald"><Progress value={readiness} className="mt-3" /></ScoreCard>
        <ScoreCard label="Open items" value={`${miss.length}`} tone="amber">
          <p className="mt-3 text-xs text-muted">{missReq.length} required still open</p>
        </ScoreCard>
      </div>

      {/* Section summaries */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold">Section progress</h2>
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="w-48 shrink-0 text-sm text-ink">{s.title}</span>
              <Progress value={s.completion} />
              <span className="w-16 shrink-0 text-right text-xs text-muted">{s.answered}/{s.total}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risks / warnings */}
      <Card className="mt-6 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="h-5 w-5 text-amber-500" /> Warnings &amp; risks
        </h2>
        {risks.length === 0 ? (
          <p className="inline-flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> No blocking or high risks detected. Great work!
          </p>
        ) : (
          <ul className="space-y-2">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${r.level === "Blocking" ? "text-red-500" : r.level === "High" ? "text-orange-500" : "text-amber-500"}`} />
                <span><span className="font-semibold">[{r.level}]</span> {r.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Submit */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-semibold">Send to the team</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Your name</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus-ring" placeholder="e.g. Crystal Burch" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Your email (optional)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus-ring" placeholder="you@studio.com" />
          </div>
        </div>

        {missReq.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {missReq.length} required question{missReq.length > 1 ? "s are" : " is"} still open. You can still submit, and the team will follow up, but answering them helps us move faster.
          </div>
        )}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={submit} size="lg" disabled={submitting}>
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>) : "Submit discovery"}
          </Button>
          <span className="text-xs text-muted">Your answers are saved automatically. You can come back any time before submitting.</span>
        </div>
      </Card>
    </motion.div>
  );
}

function ScoreCard({ label, value, tone, children }: { label: string; value: string; tone: "brand" | "emerald" | "amber"; children?: React.ReactNode }) {
  const tones: Record<string, string> = {
    brand: "text-brand-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <Card className="p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</div>
      {children}
    </Card>
  );
}
