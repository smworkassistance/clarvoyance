-- ═══ Clarvoyance v125 — Schema Migration ═══
-- Run this on your Supabase SQL editor.
-- Adds momentum (float), freeze tracking, and Clar daily usage minutes
-- to the existing user_progress table.

-- ── Extend user_progress ──────────────────────────────────────────
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS momentum       float8   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freeze_week    text     NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS freeze_used    boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clar_daily_min integer  NOT NULL DEFAULT 0;

-- momentum      = decaying float (not hard integer) — displayed as Math.round(momentum)
-- freeze_week   = ISO week string like "2026-W26" — resets freeze_used each new week
-- freeze_used   = whether the weekly freeze has been spent this week
-- clar_daily_min = minutes spent in Clar AI tab today (resets daily on pull)

-- No new tables needed — all new data fits in existing user_progress row.
-- RLS policy unchanged (user_id = auth.uid() covers new columns automatically).
