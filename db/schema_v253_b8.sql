-- v253 / batch B8 — one additive file (owner runs it in the Supabase SQL editor). Safe to run twice.
-- The app and Workers keep working (old behaviour) until it is run: every new query soft-fails.

-- T-062: true video shape (aspect = width/height) for cached YouTube videos, so Vibe/Discover show portrait Shorts edge to edge without black bars
alter table public.youtube_topic_cache add column if not exists aspect numeric;

-- T-063: Clar Reels — instant, self-hosted stock clips (Pexels, re-hosted on our Bunny library) shown in Vibe/Discover with a real quote on top.
-- Filled by the bunny Worker's cron (needs PEXELS_API_KEY). Public can read only clips that finished processing.
create table if not exists public.clar_reels (
  id bigserial primary key,
  pexels_id bigint unique,
  bunny_guid text unique not null,
  theme text,
  width int, height int, duration int,
  photographer text, photographer_url text, pexels_url text,
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  created_at timestamptz not null default now()
);
alter table public.clar_reels enable row level security;
drop policy if exists clar_reels_read on public.clar_reels;
create policy clar_reels_read on public.clar_reels for select to anon, authenticated using (status = 'ready');
grant select on public.clar_reels to anon, authenticated;
grant all on public.clar_reels to service_role;
grant usage, select on sequence public.clar_reels_id_seq to service_role;
