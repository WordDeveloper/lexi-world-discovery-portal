import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function priorityColor(p: string): string {
  switch (p) {
    case "Critical":
      return "bg-red-100 text-red-700 ring-red-200";
    case "High":
      return "bg-orange-100 text-orange-700 ring-orange-200";
    case "Medium":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    default:
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }
}

export function kindColor(k: string): string {
  if (k.includes("Confirmation")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (k.includes("New")) return "bg-brand-50 text-brand-700 ring-brand-200";
  return "bg-sky-50 text-sky-700 ring-sky-200";
}

export function formatTime(mins: number): string {
  if (mins <= 1) return "about a minute";
  if (mins < 60) return `about ${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

// Deterministic token generator (client-side draft fallback keys).
export function classNamesFromChoice(choice?: string): string {
  switch (choice) {
    case "confirm":
      return "ring-emerald-300 bg-emerald-50";
    case "modify":
      return "ring-amber-300 bg-amber-50";
    case "remove":
      return "ring-red-300 bg-red-50";
    default:
      return "ring-slate-200 bg-white";
  }
}
