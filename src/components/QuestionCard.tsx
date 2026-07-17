"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Pencil,
  X,
  HelpCircle,
  Flag,
  MessageSquare,
  Bookmark,
  Info,
  Lightbulb,
} from "lucide-react";
import type { Question } from "@/lib/types";
import { Badge, Textarea, Tooltip } from "./ui";
import { Field } from "./Field";
import { cn, priorityColor, kindColor } from "@/lib/utils";
import { useQuestionnaire } from "@/store/useQuestionnaire";

export function QuestionCard({ question, index }: { question: Question; index: number }) {
  const answer = useQuestionnaire((s) => s.answers[question.id]);
  const setValue = useQuestionnaire((s) => s.setValue);
  const setConfirm = useQuestionnaire((s) => s.setConfirm);
  const toggleFlag = useQuestionnaire((s) => s.toggleFlag);
  const openAssistant = useAssistantOpener();

  const isConfirmation = !!question.confirmationStatement;
  const choice = answer?.confirm;

  return (
    <motion.div
      id={`q-${question.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
      className="scroll-mt-28 rounded-2xl border border-slate-100 bg-white p-6 shadow-soft sm:p-7"
    >
      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">Q{question.number}</span>
        <Badge className={priorityColor(question.priority)}>{question.priority}</Badge>
        <Badge className={kindColor(question.kind)}>{question.kind}</Badge>
        <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{question.requirementType}</Badge>
        <div className="ml-auto flex items-center gap-1">
          <FlagButton active={!!answer?.bookmarked} onClick={() => toggleFlag(question.id, "bookmarked")} icon={<Bookmark className="h-4 w-4" />} label="Bookmark" />
          <FlagButton active={!!answer?.markedForDiscussion} onClick={() => toggleFlag(question.id, "markedForDiscussion")} icon={<MessageSquare className="h-4 w-4" />} label="Mark for discussion" />
          <FlagButton active={!!answer?.flaggedUncertain} onClick={() => toggleFlag(question.id, "flaggedUncertain")} icon={<Flag className="h-4 w-4" />} label="Flag as uncertain" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-1 flex items-start gap-2">
        <h3 className="text-lg font-semibold leading-snug text-ink">{question.category}</h3>
        <Tooltip label={`Teams that depend on this: ${question.developerNote}`}>
          <Info className="mt-1 h-4 w-4 shrink-0 text-muted/60" />
        </Tooltip>
      </div>

      {/* Current understanding */}
      <p className="mb-4 text-sm leading-relaxed text-muted">{question.currentUnderstanding}</p>

      {/* Confirmation card */}
      {isConfirmation && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="mb-3 text-sm text-emerald-900">
            <span className="font-semibold">We understood the following from your documents: </span>
            {question.confirmationStatement}
          </p>
          <div className="flex flex-wrap gap-2">
            <ConfirmBtn active={choice === "confirm"} tone="confirm" onClick={() => setConfirm(question.id, "confirm")} icon={<BadgeCheck className="h-4 w-4" />} label="Confirm" />
            <ConfirmBtn active={choice === "modify"} tone="modify" onClick={() => setConfirm(question.id, "modify")} icon={<Pencil className="h-4 w-4" />} label="Modify" />
            <ConfirmBtn active={choice === "remove"} tone="remove" onClick={() => setConfirm(question.id, "remove")} icon={<X className="h-4 w-4" />} label="Remove" />
          </div>
          {choice === "modify" && (
            <div className="mt-3">
              <Textarea
                value={(answer?.value as string) ?? ""}
                maxLength={2000}
                onChange={(e) => setValue(question.id, e.target.value)}
                placeholder="What should change? Tell us in your own words…"
              />
            </div>
          )}
        </div>
      )}

      {/* The open question */}
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[15px] font-medium text-ink">{question.question}</p>
        {question.required && <span className="text-xs font-semibold text-red-500">required</span>}
      </div>
      {question.helpText && <p className="mb-3 text-sm text-muted">{question.helpText}</p>}

      {/* Field (skip primary field for pure confirmation cards that only need a note) */}
      {!isConfirmation && (
        <Field
          question={question}
          value={answer?.value}
          onChange={(v) => setValue(question.id, v)}
        />
      )}
      {isConfirmation && question.input === "paragraph" && choice !== "modify" && (
        <Field question={question} value={answer?.value} onChange={(v) => setValue(question.id, v)} />
      )}

      {/* Example */}
      {question.example && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
          <span>{question.example}</span>
        </p>
      )}

      {/* Footer actions */}
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs">
        {question.reference && <span className="text-muted">Reference: {question.reference}</span>}
        <button
          onClick={() => openAssistant(question.id)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-brand-700 hover:bg-brand-50"
        >
          <HelpCircle className="h-4 w-4" /> Ask the assistant
        </button>
      </div>
    </motion.div>
  );
}

function FlagButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Tooltip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className={cn("rounded-lg p-1.5 transition focus-ring", active ? "bg-brand-100 text-brand-700" : "text-muted/60 hover:bg-slate-100")}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function ConfirmBtn({ active, tone, onClick, icon, label }: { active: boolean; tone: "confirm" | "modify" | "remove"; onClick: () => void; icon: React.ReactNode; label: string }) {
  const tones: Record<string, string> = {
    confirm: active ? "bg-emerald-500 text-white border-emerald-500" : "border-emerald-300 text-emerald-700 hover:bg-emerald-100",
    modify: active ? "bg-amber-500 text-white border-amber-500" : "border-amber-300 text-amber-700 hover:bg-amber-100",
    remove: active ? "bg-red-500 text-white border-red-500" : "border-red-300 text-red-700 hover:bg-red-100",
  };
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-ring", tones[tone])}>
      {icon}
      {label}
    </button>
  );
}

// Bridge to the assistant panel via a window event (kept simple, no context).
function useAssistantOpener() {
  return React.useCallback((questionId: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-assistant", { detail: { questionId } }));
    }
  }, []);
}
