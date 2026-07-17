# Lexi World — Discovery Portal

A premium, SaaS-quality client discovery web app that turns the approved
**Phase-2 questionnaire (42 cards)** into a guided, delightful experience —
built to feel closer to Linear / Notion / Typeform than to Google Forms.

> Product: **StoryLight Studios — Lexi World**
> Stack: **Next.js (App Router) · TypeScript · Tailwind · Framer Motion · Zustand · Zod · Supabase · Resend · pdf-lib · Lucide**

---

## What's inside

| Area | Highlights |
|---|---|
| Experience | Sticky sidebar, section flow, autosave, resume-later, search, bookmark / flag-uncertain / mark-for-discussion, undo, keyboard-friendly, beautiful empty / loading / success states, glass UI, Framer Motion. |
| Question engine | 15+ input types, **confirmation cards** (Confirm / Modify / Remove), conditional logic (e.g. social sub-questions appear only when relevant), per-question help / example / tooltip / hidden developer note / character counter / validation. |
| AI assistant | Floating panel that explains a question, shows an example, suggests industry standards, and lists reference games — **never auto-answers** for the client. Works offline via a built-in library; optionally enhanced by an LLM. |
| Review & submit | Completion %, development-readiness score, per-section progress, risk/warnings, missing-answers, then submit. |
| Backend | Supabase (drafts, responses, uploaded_files, invitations, users, questionnaire_versions) with **RLS + indexes**; Resend email with **PDF + JSON attachments + risk/summary**; per-response exports (PDF / JSON / Markdown / Developer summary); admin dashboard + export-all. |
| Security | Zod validation, input sanitisation, HTML escaping, security headers, origin/CSRF check + in-memory rate limiting (middleware), service-role kept server-side, env-var config. |

The questionnaire content is **frozen** in `src/lib/questionnaire.ts`
(`QUESTIONNAIRE_VERSION = "2.0.0"`). Do not edit questions without an explicit
change request.

---

## Project structure

```
discovery-portal/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx, globals.css, page.tsx        # root + landing
│  │  ├─ q/[token]/page.tsx                        # the client portal (SSR draft load)
│  │  ├─ admin/page.tsx                            # admin dashboard (?key=...)
│  │  ├─ api/
│  │  │  ├─ draft/route.ts                         # autosave (upsert)
│  │  │  ├─ submit/route.ts                        # store + PDF + email
│  │  │  ├─ assistant/route.ts                     # AI assistant responses
│  │  │  ├─ upload/route.ts                        # file uploads → Supabase storage
│  │  │  └─ export/[token]/route.ts, export/all    # exports (admin key)
│  │  └─ middleware.ts                             # headers, rate-limit, CSRF
│  ├─ components/                                  # ui, Field, QuestionCard, Sidebar, AIAssistant, ReviewScreen, Portal
│  ├─ lib/                                         # questionnaire (frozen), types, summary, exporters, pdf, email, assistant, validation, supabase/*
│  └─ store/useQuestionnaire.ts                    # Zustand store + autosave
├─ supabase/schema.sql                             # tables + RLS + indexes + storage
├─ scripts/create-invite.mjs                       # generate secure client links
├─ .env.example
└─ package.json, tsconfig.json, tailwind.config.ts, next.config.mjs
```

---

## Setup (local)

```bash
cd discovery-portal
npm install
cp .env.example .env.local     # fill in the values (see below)
npm run dev                     # http://localhost:3000  → try /q/demo
```

The app **degrades gracefully with no backend**: drafts persist to
`localStorage`, and `/q/demo` works immediately. Configure Supabase + Resend
for full persistence, email and admin.

### Environment variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged access |
| `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO` | Submission emails |
| `NEXT_PUBLIC_APP_URL` | Absolute app URL (links) |
| `ADMIN_ACCESS_TOKEN` | Protects `/admin` and exports |
| `OPENAI_API_KEY` | *(optional)* richer assistant answers |

---

## Database (Supabase)

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/schema.sql`, run it.
   - Creates `questionnaire_versions`, `users`, `invitations`, `drafts`,
     `responses`, `uploaded_files`.
   - Enables **Row Level Security**: the browser (anon key) can only act via a
     valid, non-expired invitation **token**; all privileged reads (admin,
     exports, email) use the **service role** on the server.
   - Adds indexes (incl. a GIN index on `responses.answers`) and a public
     `discovery-uploads` storage bucket.
3. Copy the URL + keys into your env.

### Create a secure client link

```bash
node --env-file=.env.local scripts/create-invite.mjs "Crystal Burch" crystal@storylight.com
# → prints  https://your-app/q/<secure-token>
```

---

## Email (Resend)

1. Create a Resend API key and verify your sending domain.
2. Set `RESEND_API_KEY`, `MAIL_FROM` (verified sender), `MAIL_TO` (your team;
   comma-separate for multiple).
3. On submit, the team receives an HTML summary email with **completion %,
   readiness, section progress, risk summary, uploaded-files manifest**, plus
   **PDF and JSON attachments**.

---

## Deploy to Vercel

1. Push `discovery-portal/` to a Git repo.
2. In Vercel: **New Project** → import the repo → framework **Next.js**
   (root directory = `discovery-portal` if it's a subfolder).
3. Add all environment variables (Production + Preview).
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL and redeploy.
5. Run `supabase/schema.sql` in your Supabase project (once).
6. Generate invite links and send them to clients.

`npm run build` locally to verify before deploying. `npm run typecheck` runs
`tsc --noEmit`.

---

## Phase map (as requested)

1. **Structure** — folders + config (`package.json`, `tsconfig`, tailwind, next).
2. **Architecture** — `src/lib` domain layer, `src/store` state, `src/components` UI, `src/app` routes.
3. **Database** — `supabase/schema.sql` (tables, RLS, indexes, storage).
4. **Components** — `ui.tsx`, `Field`, `QuestionCard`, `ConfirmationCard` (in QuestionCard), `Sidebar`, `AIAssistant`, `ReviewScreen`, `Portal`.
5. **Pages** — landing, `q/[token]`, `admin`.
6. **API routes** — draft, submit, assistant, upload, export.
7. **Validation** — `lib/validation.ts` (Zod) + sanitisation + `middleware.ts`.
8. **Email** — `lib/email.ts` (Resend + attachments).
9. **PDF/Exports** — `lib/pdf.ts`, `lib/exporters.ts` (PDF/JSON/Markdown/Developer summary).
10. **Deployment** — this guide.

---

## Notes & extension points

- **shadcn/ui**: primitives are hand-authored in `src/components/ui.tsx` in the
  shadcn style (no CLI/build step needed). You can swap in the shadcn CLI later
  and the component API stays compatible.
- **Question types**: the renderer in `Field.tsx` covers every type the frozen
  questionnaire uses plus common extras (rating, slider, currency, tags, toggle,
  date). Additional exotic types (signature, drawing canvas, JSON/code editor)
  can be added as new cases without touching the engine.
- **File uploads**: wired to Supabase Storage via `api/upload`; attach the
  uploader to any question by rendering it alongside the field (bucket + RLS are
  provisioned in the schema).
- **Conditional logic**: declarative via `visibleWhen` on a question; the social
  sub-questions demonstrate it (they appear only when the client indicates a
  social/multiplayer direction).
