import { z } from "zod";

// ── Answer + draft validation (Zod) ───────────────────────────

export const confirmChoiceSchema = z.enum(["confirm", "modify", "remove"]);

export const answerValueSchema = z.object({
  confirm: confirmChoiceSchema.optional(),
  value: z
    .union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()])
    .optional(),
  flaggedUncertain: z.boolean().optional(),
  markedForDiscussion: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

export const answerMapSchema = z.record(z.string(), answerValueSchema);

export const draftSchema = z.object({
  token: z.string().min(1).max(128),
  answers: answerMapSchema,
  currentSection: z.string().optional(),
  completion: z.number().min(0).max(100).optional(),
  version: z.string(),
});

export const submitSchema = z.object({
  token: z.string().min(1).max(128),
  clientName: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
  answers: answerMapSchema,
  version: z.string(),
});

export type DraftInput = z.infer<typeof draftSchema>;
export type SubmitInput = z.infer<typeof submitSchema>;

// Basic string sanitiser for values surfaced into emails/PDF.
// Removes ASCII control characters except tab (9), newline (10) and CR (13).
export function sanitize(input: unknown, max = 8000): string {
  if (input == null) return "";
  const s = Array.isArray(input) ? input.join(", ") : String(input);
  let out = "";
  for (let i = 0; i < s.length && out.length < max; i++) {
    const code = s.charCodeAt(i);
    const isControl = (code >= 0 && code <= 31 && code !== 9 && code !== 10 && code !== 13) || code === 127;
    if (!isControl) out += s[i];
  }
  return out;
}

// Escapes a value for safe inclusion in generated HTML (emails).
export function escapeHtml(input: unknown): string {
  return sanitize(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
