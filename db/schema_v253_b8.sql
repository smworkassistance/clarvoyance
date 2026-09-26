-- v253 / batch B8 — one additive file (owner runs it in the Supabase SQL editor). Safe to run twice.
-- The app and Workers keep working (old behaviour) until it is run: every new query soft-fails.

-- T-062: true video shape (aspect = width/height) for cached YouTube videos, so Vibe/Discover show portrait Shorts edge to edge without black bars
alter table public.youtube_topic_cache add column if not exists aspect numeric;
