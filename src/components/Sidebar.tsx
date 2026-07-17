"use client";

import * as React from "react";
import { Check, Cloud, CloudOff, Loader2, Search, Undo2, Clock } from "lucide-react";
import { SECTIONS, QUESTIONS, AVG_SECONDS_PER_QUESTION } from "@/lib/questionnaire";
import { sectionCompletion, visibleQuestions, isAnswered } from "@/lib/summary";
import { useQuestionnaire } from "@/store/useQuestionnaire";
import { Progress, Input, Button } from "./ui";
import { cn, formatTime } from "@/lib/utils";

export function Sidebar({ onOpenReview }: { onOpenReview: () => void }) {
  const answers = useQuestionnaire((s) => s.answers);
  const current = useQuestionnaire((s) => s.currentSection);
  const setSection = useQuestionnaire((s) => s.setSection);
  const saveState = useQuestionnaire((s) => s.saveState);
  const lastSavedAt = useQuestionnaire((s) => s.lastSavedAt);
  const undo = useQuestionnaire((s) => s.undo);
  const search = useQuestionnaire((s) => s.searchQuery);
  const setSearch = useQuestionnaire((s) => s.setSearch);

  const visible = visibleQuestions(answers);
  const answered = visible.filter((q) => isAnswered(q, answers[q.id])).length;
  const pct = visible.length ? Math.round((answered / visible.length) * 100) : 0;
  const remaining = Math.max(0, visible.length - answered);
  const minutesLeft = (remaining * AVG_SECONDS_PER_QUESTION) / 60;

  return (
    <aside className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col gap-4">
      {/* Progress card */}
      <div className="glass rounded-2xl border border-white/60 p-5 shadow-glass">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">Your progress</span>
          <span className="text-2xl font-bold text-brand-600">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-2" />
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{answered}/{visible.length} answered</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(minutesLeft)} left</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <SaveIndicator state={saveState} at={lastSavedAt} />
          <button onClick={undo} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-muted hover:bg-white/70">
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="pl-9" />
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto pr-1">
        <ul className="space-y-1">
          {SECTIONS.map((s) => {
            const sc = sectionCompletion(s.id, answers);
            const count = QUESTIONS.filter((q) => q.section === s.id).length;
            const active = current === s.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active ? "bg-brand-500 text-white shadow-soft" : "text-ink hover:bg-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      sc === 100 ? "bg-emerald-500 text-white" : active ? "bg-white/25 text-white" : "bg-brand-50 text-brand-600"
                    )}
                  >
                    {sc === 100 ? <Check className="h-3.5 w-3.5" /> : `${sc}`}
                  </span>
                  <span className="flex-1 truncate font-medium">{s.title}</span>
                  <span className={cn("text-xs", active ? "text-white/70" : "text-muted/70")}>{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Button onClick={onOpenReview} variant="outline" className="w-full">
        Review &amp; submit
      </Button>
    </aside>
  );
}

function SaveIndicator({ state, at }: { state: string; at: string | null }) {
  if (state === "saving")
    return <span className="inline-flex items-center gap-1 text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>;
  if (state === "offline")
    return <span className="inline-flex items-center gap-1 text-amber-600"><CloudOff className="h-3.5 w-3.5" /> Saved on device</span>;
  if (state === "error")
    return <span className="inline-flex items-center gap-1 text-red-600"><CloudOff className="h-3.5 w-3.5" /> Save error</span>;
  if (at)
    return <span className="inline-flex items-center gap-1 text-emerald-600"><Cloud className="h-3.5 w-3.5" /> Saved</span>;
  return <span className="inline-flex items-center gap-1 text-muted"><Check className="h-3.5 w-3.5" /> Autosave on</span>;
}
