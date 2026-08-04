-- ═══ Clarvoyance v178 — Schema Migration ═══
-- Run this on your Supabase SQL editor.
-- Adds total whole-app usage time (any tab, not just Clar chat) to user_progress,
-- mirroring the existing clar_times/clar_daily_min columns added in v125/v146.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS app_times     JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS app_daily_min integer NOT NULL DEFAULT 0;

-- app_times     = rolling 7-day array of {date, minutes} — total time the app was open
--                 (any tab), tracked via document visibilitychange, not gated to chat-tab
-- app_daily_min = minutes spent in the app today (resets daily on pull), same pattern as
--                 clar_daily_min

-- No new tables needed — fits in the existing user_progress row.
-- RLS policy unchanged (user_id = auth.uid() covers new columns automatically).
