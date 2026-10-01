-- Clarvoyance v255 — T-077: Guides retry-storm fix (exponential backoff on real failure).
-- Run this once in the Supabase SQL editor. Purely additive (one new column, a safe
-- default) — no existing data is touched, no RLS/grant change needed (guides already
-- has `grant all on public.guides to service_role;` from schema_v250_guides_video.sql).
--
-- Real incident this fixes: found live 2026-09-30 — the Gemini API account's prepaid
-- credits ran out, and every one of the 5 starter guides then failed with
-- "ai error: gemini returned no JSON" and retried every fixed 3 hours, FOREVER, for
-- several days straight, producing zero posts and burning real API calls on a failure
-- that could not resolve itself between retries. workers/admin-relay-worker.js's
-- finishRun() now reads this column to back off (3h -> 6h -> 12h -> 24h cap) on
-- consecutive failures, resetting to the normal cadence the moment a run succeeds.

ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS consecutive_fails integer NOT NULL DEFAULT 0;
