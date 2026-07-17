"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { AnswerMap } from "@/lib/types";
import { SECTIONS, QUESTIONS, questionsBySection } from "@/lib/questionnaire";
import { isVisible, completion as computeCompletion } from "@/lib/summary";
import { useQuestionnaire } from "@/store/useQuestionnaire";
import { Sidebar } from "./Sidebar";
import { QuestionCard } from "./QuestionCard";
import { AIAssistant } from "./AIAssistant";
import { ReviewScreen } from "./ReviewScreen";
import { Button, Progress } from "./ui";

const MICROCOPY: Record<string, string> = {
  vision: "You are building something exciting. Let's capture the idea behind it.",
  identity: "This is where your game finds its heart. Take your time.",
  experience: "Now the fun part: how it feels to actually use Lexi World.",
  characters: "Characters and leveling up are what keep children coming back.",
  systems: "The everyday parts that quietly power the game.",
  learning: "The heart of Lexi World. How children really learn to read.",
  social: "A few questions about whether children play with others.",
  platform: "The practical basics. Easy stuff, we promise.",
  compliance: "Almost there. Clear answers today save weeks of work later.",
};

export function Portal({
  token,
  initialAnswers,
  initialSection,
  clientName,
}: {
  token: string;
  initialAnswers: AnswerMap;
  initialSection?: string;
  clientName?: string;
}) {
  const init = useQuestionnaire((s) => s.init);
  const answers = useQuestionnaire((s) => s.answers);
  const currentSection = useQuestionnaire((s) => s.currentSection);
  const setSection = useQuestionnaire((s) => s.setSection);
  const search = useQuestionnaire((s) => s.searchQuery);
  const [mode, setMode] = React.useState<"form" | "review" | "done">("form");

  React.useEffect(() => {
    init(token, initialAnswers, initialSection);
  }, [token, initialAnswers, initialSection, init]);

  const sectionIndex = SECTIONS.findIndex((s) => s.id === currentSection);
  const section = SECTIONS[sectionIndex] ?? SECTIONS[0];

  const searchLower = search.trim().toLowerCase();
  const allVisible = React.useMemo(() => {
    if (searchLower) {
      return QUESTIONS.filter(
        (q) =>
          isVisible(q, answers) &&
          (q.category.toLowerCase().includes(searchLower) ||
            q.question.toLowerCase().includes(searchLower) ||
            q.section.toLowerCase().includes(searchLower))
      );
    }
    return questionsBySection(section.id).filter((q) => isVisible(q, answers));
  }, [searchLower, section.id, answers]);

  const goNext = () => {
    if (sectionIndex < SECTIONS.length - 1) {
      setSection(SECTIONS[sectionIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setMode("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goPrev = () => {
    if (sectionIndex > 0) {
      setSection(SECTIONS[sectionIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (mode === "done") return <SuccessScreen />;

  return (
    <div className="min-h-screen">
      <TopBar clientName={clientName} />

      <div className="container grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block">
          <Sidebar onOpenReview={() => setMode("review")} />
        </div>

        <main>
          {mode === "review" ? (
            <ReviewScreen onBack={() => setMode("form")} onSubmitted={() => setMode("done")} />
          ) : (
            <>
              {/* Mobile progress */}
              <div className="mb-4 lg:hidden">
                <MobileProgress onReview={() => setMode("review")} />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={searchLower ? "search" : section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {!searchLower && (
                    <header className="mb-6">
                      <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        Section {sectionIndex + 1} of {SECTIONS.length}
                      </div>
                      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{section.title}</h1>
                      <p className="mt-1 max-w-2xl text-muted">{MICROCOPY[section.id] ?? section.blurb}</p>
                    </header>
                  )}
                  {searchLower && (
                    <header className="mb-6">
                      <h1 className="text-xl font-bold text-ink">
                        {allVisible.length} result{allVisible.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
                      </h1>
                    </header>
                  )}

                  <div className="space-y-5">
                    {allVisible.length === 0 ? (
                      <EmptyState />
                    ) : (
                      allVisible.map((q, i) => <QuestionCard key={q.id} question={q} index={i} />)
                    )}
                  </div>

                  {!searchLower && (
                    <div className="mt-8 flex items-center justify-between">
                      <Button variant="outline" onClick={goPrev} disabled={sectionIndex === 0}>
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </Button>
                      <Button onClick={goNext}>
                        {sectionIndex === SECTIONS.length - 1 ? "Review & submit" : "Next section"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      <AIAssistant />
    </div>
  );
}

function TopBar({ clientName }: { clientName?: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/60 glass">
      <div className="container flex h-16 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-bold">L</div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Lexi World Discovery</div>
          <div className="text-xs text-muted">StoryLight Studios</div>
        </div>
        {clientName && <div className="ml-auto hidden text-sm text-muted sm:block">Welcome, {clientName}</div>}
      </div>
    </div>
  );
}

function MobileProgress({ onReview }: { onReview: () => void }) {
  const answers = useQuestionnaire((s) => s.answers);
  const pct = computeCompletion(answers);
  return (
    <div className="glass rounded-2xl border border-white/60 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink">Progress</span>
        <span className="font-bold text-brand-600">{pct}%</span>
      </div>
      <Progress value={pct} className="mt-2" />
      <button onClick={onReview} className="mt-2 text-xs font-medium text-brand-700">Review &amp; submit →</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="font-medium text-ink">Nothing here yet</p>
      <p className="mt-1 text-sm text-muted">Try another section or clear your search.</p>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-lift"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <motion.path
              d="M4 12l5 5L20 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <h1 className="text-2xl font-bold text-ink">Thank you!</h1>
        <p className="mt-2 text-muted">
          Your answers are on their way to the team. We&apos;ll turn them into clear designs and a plan, and reach out with next steps.
        </p>
        <p className="mt-6 text-xs text-muted/70">You can safely close this window.</p>
      </motion.div>
    </div>
  );
}
