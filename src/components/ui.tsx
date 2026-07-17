"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Button ────────────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "subtle" | "danger";
  size?: "sm" | "md" | "lg";
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants: Record<string, string> = {
      primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-soft",
      ghost: "text-brand-700 hover:bg-brand-50",
      outline: "border border-slate-200 bg-white text-ink hover:border-brand-300 hover:bg-brand-50/40",
      subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
      danger: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes: Record<string, string> = {
      sm: "h-9 px-3 text-sm rounded-lg",
      md: "h-11 px-5 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all focus-ring disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", className)}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-100 bg-white shadow-soft", className)}>{children}</div>;
}

// ── Progress ──────────────────────────────────────────────────
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-brand-50", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ── Input / Textarea ─────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-ink placeholder:text-muted/60 transition focus-ring focus:border-brand-300",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-muted/60 transition focus-ring focus:border-brand-300",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ── Tooltip (lightweight) ─────────────────────────────────────
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-xs -translate-x-1/2 scale-95 rounded-lg bg-ink px-3 py-2 text-xs text-white opacity-0 shadow-lift transition-all group-hover:scale-100 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
