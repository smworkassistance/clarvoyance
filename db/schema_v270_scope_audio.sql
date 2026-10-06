-- ═══════════════════════════════════════════════════════════════════
-- v270 — Scope audio (charger / tools / self / goals instruction audio)
-- Finalise-first slice. Owner runs this once in the Supabase SQL editor.
-- Additive only: creates 2 tables + 1 public Storage bucket. Touches nothing else.
--
-- audio_languages : the language list (admin adds languages here).
-- audio_scopes    : one row per (scope, language). Holds the text, the prompt that
--                   produced the draft (kept for the record), the generated audio
--                   path, and a `finalised` flag. Only finalised rows reach users.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Language list ────────────────────────────────────────────────
create table if not exists public.audio_languages (
  code       text primary key,            -- 'en', 'hi' (Hinglish later reuses 'hi' voice)
  name       text not null,               -- shown in the app and admin
  tts_voice  text,                        -- Google voice name, e.g. 'hi-IN-Wavenet-X'; null = upload-only
  tts_lang   text,                        -- Google languageCode, e.g. 'hi-IN', 'en-IN'
  active     boolean not null default true,
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.audio_languages (code, name, tts_lang, active, sort) values
  ('en', 'English', 'en-IN', true, 1),
  ('hi', 'हिन्दी',    'hi-IN', true, 2)
on conflict (code) do nothing;

-- 2. Scope text + audio ───────────────────────────────────────────
create table if not exists public.audio_scopes (
  scope_key     text not null,            -- e.g. 'self.peak_state', 'charger.<slug>', 'goals.major'
  lang          text not null references public.audio_languages(code) on update cascade,
  kind          text not null default 'instruction' check (kind in ('instruction','affirmation')),
  text          text not null default '',
  prompt        text,                     -- the owner's prompt that produced the draft (kept)
  draft_model   text,                     -- which model wrote the draft, if any
  draft_at      timestamptz,
  finalised     boolean not null default false,
  finalised_at  timestamptz,
  text_hash     text,                     -- hash of the text as last saved (detects edits)
  audio_path    text,                     -- path inside the charger-audio bucket
  audio_hash    text,                     -- text_hash the current audio was generated from
  voice         text,                     -- voice used for the current audio
  speaking_rate numeric not null default 0.95 check (speaking_rate between 0.5 and 1.5),
  updated_at    timestamptz not null default now(),
  primary key (scope_key, lang)
);

create index if not exists audio_scopes_finalised_idx on public.audio_scopes (lang, finalised);

-- 3. Storage bucket (public read, writes only by the service key through the Worker) ─
insert into storage.buckets (id, name, public)
values ('charger-audio', 'charger-audio', true)
on conflict (id) do update set public = true;

-- 4. Row Level Security ──────────────────────────────────────────
alter table public.audio_languages enable row level security;
alter table public.audio_scopes    enable row level security;

-- The app (anon + signed-in members) may read languages and FINALISED scope rows only.
drop policy if exists "audio_languages public read" on public.audio_languages;
create policy "audio_languages public read" on public.audio_languages for select to anon, authenticated using (true);

drop policy if exists "audio_scopes public read finalised" on public.audio_scopes;
create policy "audio_scopes public read finalised" on public.audio_scopes for select to anon, authenticated using (finalised = true);

-- No client writes at all: admin edits go through admin-relay-worker (service key).

-- 5. Grants (explicit — this project has hit missing service_role grants before) ─
grant select on public.audio_languages to anon, authenticated;
grant select on public.audio_scopes    to anon, authenticated;
grant select, insert, update, delete on public.audio_languages to service_role;
grant select, insert, update, delete on public.audio_scopes    to service_role;

-- 6. Make PostgREST see the new tables now ────────────────────────
notify pgrst, 'reload schema';
