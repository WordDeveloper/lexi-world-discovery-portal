"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, BookOpen, Lightbulb, Gamepad2, Compass } from "lucide-react";
import { getQuestion } from "@/lib/questionnaire";
import type { AssistMode, AssistResult } from "@/lib/assistant";
import { Button } from "./ui";

const MODES: { mode: AssistMode; label: string; icon: React.ReactNode }[] = [
  { mode: "explain", label: "Explain", icon: <Compass className="h-4 w-4" /> },
  { mode: "example", label: "Example", icon: <Lightbulb className="h-4 w-4" /> },
  { mode: "references", label: "Reference games", icon: <Gamepad2 className="h-4 w-4" /> },
  { mode: "standards", label: "Industry standard", icon: <BookOpen className="h-4 w-4" /> },
];

export function AIAssistant() {
  const [open, setOpen] = React.useState(false);
  const [questionId, setQuestionId] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AssistResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { questionId: string };
      setQuestionId(detail.questionId);
      setOpen(true);
      run(detail.questionId, "explain");
    };
    window.addEventListener("open-assistant", handler);
    return () => window.removeEventListener("open-assistant", handler);
  }, []);

  async function run(qid: string, mode: AssistMode) {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: qid, mode }),
      });
      const data = (await res.json()) as AssistResult;
      setResult(data);
    } catch {
      setResult({ mode, title: "Assistant", body: "The assistant is not available right now. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const q = questionId ? getQuestion(questionId) : null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brand-500 px-5 text-white shadow-lift transition hover:bg-brand-600 focus-ring"
        aria-label="Open assistant"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden font-medium sm:inline">Assistant</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lift"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-500 px-4 py-3 text-white">
              <Sparkles className="h-5 w-5" />
              <div className="font-semibold">Discovery Assistant</div>
              <button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1 hover:bg-white/20" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!q && (
                <p className="text-sm text-muted">
                  Hi! Tap <span className="font-medium text-brand-700">Ask the assistant</span> on any question, and I&apos;ll explain it,
                  show an example, or suggest reference games. I&apos;ll never answer for you.
                </p>
              )}
              {q && (
                <>
                  <div className="mb-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
                    Q{q.number} · {q.category}
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {MODES.map((m) => (
                      <button
                        key={m.mode}
                        onClick={() => run(q.id, m.mode)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      <div className="shimmer h-4 w-3/4 rounded" />
                      <div className="shimmer h-4 w-full rounded" />
                      <div className="shimmer h-4 w-2/3 rounded" />
                    </div>
                  ) : (
                    result && (
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-ink">{result.title}</h4>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{result.body}</p>
                        {result.references && result.references.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {result.references.map((r) => (
                              <span key={r} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            <div className="border-t border-slate-100 p-3">
              <p className="text-center text-[11px] text-muted/70">The assistant guides you. You decide. It never fills in answers.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
