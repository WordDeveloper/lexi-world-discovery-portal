"use client";

import * as React from "react";
import type { Question } from "@/lib/types";
import { Input, Textarea } from "./ui";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FieldProps {
  question: Question;
  value: string | string[] | number | boolean | null | undefined;
  onChange: (value: string | string[] | number | boolean | null) => void;
}

export function Field({ question, value, onChange }: FieldProps) {
  const t = question.input;

  if (t === "paragraph") {
    const v = (value as string) ?? "";
    return (
      <div>
        <Textarea
          value={v}
          maxLength={4000}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.example ?? "Type your answer…"}
        />
        <div className="mt-1 text-right text-xs text-muted/70">{v.length}/4000</div>
      </div>
    );
  }

  if (t === "short_text" || t === "email" || t === "phone" || t === "url") {
    const v = (value as string) ?? "";
    return (
      <Input
        type={t === "email" ? "email" : t === "phone" ? "tel" : t === "url" ? "url" : "text"}
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.example ?? (t === "url" ? "https://…" : "Your answer")}
      />
    );
  }

  if (t === "number" || t === "currency") {
    const v = value as number | undefined;
    return (
      <div className="relative">
        {t === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>}
        <Input
          type="number"
          className={t === "currency" ? "pl-7" : ""}
          value={v ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
    );
  }

  if (t === "date") {
    return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  if (t === "toggle") {
    const on = !!value;
    return (
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-7 w-12 rounded-full transition focus-ring",
          on ? "bg-brand-500" : "bg-slate-300"
        )}
        aria-pressed={on}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", on ? "left-6" : "left-0.5")} />
      </button>
    );
  }

  if (t === "rating" || t === "slider") {
    const max = 5;
    const v = (value as number) ?? 0;
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn(
              "h-10 w-10 rounded-xl border text-sm font-semibold transition focus-ring",
              v >= i + 1 ? "border-brand-400 bg-brand-500 text-white" : "border-slate-200 bg-white text-muted hover:border-brand-300"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  }

  if (t === "single_select" || t === "dropdown") {
    const v = value as string | undefined;
    return (
      <div className="grid gap-2">
        {question.options?.map((o) => {
          const active = v === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition focus-ring",
                active ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 bg-white hover:border-brand-300"
              )}
            >
              <span>{o.label}</span>
              {active && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (t === "multi_select") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (val: string) => {
      onChange(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    };
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options?.map((o) => {
          const active = arr.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition focus-ring",
                active ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 bg-white hover:border-brand-300"
              )}
            >
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-md border", active ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300")}>
                {active && <Check className="h-3.5 w-3.5" />}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (t === "tags") {
    return <TagInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }

  return null;
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-sm text-brand-700">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="text-brand-400 hover:text-brand-700">
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="Type and press Enter…"
          className="min-w-[140px] flex-1 bg-transparent px-2 py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
