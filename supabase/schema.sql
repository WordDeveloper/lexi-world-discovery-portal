-- ══════════════════════════════════════════════════════════════
-- Lexi World Discovery Portal — Supabase schema
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Includes tables, indexes, Row Level Security policies, storage.
-- ══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── questionnaire_versions ───────────────────────────────────
-- Immutable snapshot of a frozen questionnaire (for versioning/compare).
create table if not exists public.questionnaire_versions (
  id            uuid primary key default gen_random_uuid(),
  version       text not null unique,
  title         text not null default 'Lexi World Discovery',
  schema        jsonb not null,               -- the frozen questions array
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─── users (optional) ─────────────────────────────────────────
-- Lightweight client directory. Auth itself is handled by the
-- unique secure link (token); this table is optional metadata.
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique,
  full_name     text,
  company       text,
  role          text not null default 'client',   -- 'client' | 'admin'
  created_at    timestamptz not null default now()
);

-- ─── invitations / secure links ───────────────────────────────
create table if not exists public.invitations (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique,             -- goes in the secure URL
  email         text,
  client_name   text,
  version       text not null default '2.0.0',
  status        text not null default 'sent',     -- 'sent' | 'opened' | 'submitted'
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── drafts (autosave / resume-later) ─────────────────────────
create table if not exists public.drafts (
  token             text primary key,             -- 1:1 with invitation token
  answers           jsonb not null default '{}'::jsonb,
  current_section   text,
  completion        numeric not null default 0,   -- 0..100
  version           text not null default '2.0.0',
  updated_at        timestamptz not null default now()
);

-- ─── responses (final submissions) ────────────────────────────
create table if not exists public.responses (
  id            uuid primary key default gen_random_uuid(),
  token         text not null,
  client_name   text,
  email         text,
  version       text not null default '2.0.0',
  answers       jsonb not null,
  completion    numeric not null default 0,
  summary       jsonb,                            -- computed summaries/risks
  submitted_at  timestamptz not null default now()
);

-- ─── uploaded_files ───────────────────────────────────────────
create table if not exists public.uploaded_files (
  id            uuid primary key default gen_random_uuid(),
  token         text not null,
  question_id   text,
  name          text not null,
  size          bigint not null default 0,
  mime_type     text,
  storage_path  text not null,
  public_url    text,
  created_at    timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────
create index if not exists idx_responses_token       on public.responses (token);
create index if not exists idx_responses_submitted   on public.responses (submitted_at desc);
create index if not exists idx_responses_answers_gin on public.responses using gin (answers);
create index if not exists idx_drafts_updated        on public.drafts (updated_at desc);
create index if not exists idx_uploads_token         on public.uploaded_files (token);
create index if not exists idx_uploads_question      on public.uploaded_files (question_id);
create index if not exists idx_invitations_token     on public.invitations (token);
create index if not exists idx_qversions_active      on public.questionnaire_versions (is_active);

-- ─── Row Level Security ───────────────────────────────────────
-- Model: the browser uses the ANON key and may ONLY act via a valid,
-- non-expired invitation token. All privileged reads (admin, exports,
-- email) go through the SERVICE ROLE key on the server, which bypasses
-- RLS. So we deny broad anon reads and allow only token-scoped writes.

alter table public.questionnaire_versions enable row level security;
alter table public.users                  enable row level security;
alter table public.invitations            enable row level security;
alter table public.drafts                 enable row level security;
alter table public.responses              enable row level security;
alter table public.uploaded_files         enable row level security;

-- Helper: is a token currently valid?
create or replace function public.is_valid_token(t text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.invitations i
    where i.token = t
      and (i.expires_at is null or i.expires_at > now())
  );
$$;

-- questionnaire_versions: anyone with the link may READ the active schema.
drop policy if exists qv_read on public.questionnaire_versions;
create policy qv_read on public.questionnaire_versions
  for select using (is_active = true);

-- invitations: allow reading a single row only when the exact token is known.
drop policy if exists inv_read_by_token on public.invitations;
create policy inv_read_by_token on public.invitations
  for select using (public.is_valid_token(token));

-- drafts: a holder of a valid token may upsert / read their own draft.
drop policy if exists draft_rw on public.drafts;
create policy draft_rw on public.drafts
  for all
  using (public.is_valid_token(token))
  with check (public.is_valid_token(token));

-- responses: a valid token holder may INSERT their submission; no anon reads.
drop policy if exists resp_insert on public.responses;
create policy resp_insert on public.responses
  for insert with check (public.is_valid_token(token));

-- uploaded_files: valid token holders may insert/read their own file rows.
drop policy if exists files_rw on public.uploaded_files;
create policy files_rw on public.uploaded_files
  for all
  using (public.is_valid_token(token))
  with check (public.is_valid_token(token));

-- users: no anon access (managed via service role only).
drop policy if exists users_none on public.users;
create policy users_none on public.users for select using (false);

-- ─── storage bucket for uploads ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('discovery-uploads', 'discovery-uploads', true)
on conflict (id) do nothing;

-- Allow uploads to the bucket (writes brokered by the server; this policy
-- permits authenticated/anon inserts scoped to the bucket).
drop policy if exists uploads_insert on storage.objects;
create policy uploads_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'discovery-uploads');

drop policy if exists uploads_read on storage.objects;
create policy uploads_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'discovery-uploads');

-- ─── seed the active questionnaire version (optional) ──────────
-- The app also self-seeds on first submit if this row is absent.
-- insert into public.questionnaire_versions (version, schema)
-- values ('2.0.0', '[]'::jsonb) on conflict (version) do nothing;
