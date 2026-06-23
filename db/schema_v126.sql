-- ═══ Clarvoyance v126 — Schema Migration ═══
-- Run this on your Supabase SQL editor.
-- Creates user_daily_log table for Mirror feature history.

-- ── user_daily_log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_log (
  id              bigserial PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            date        NOT NULL,
  xp_total        integer     NOT NULL DEFAULT 0,
  streak_day      integer     NOT NULL DEFAULT 0,   -- momentum rounded
  clar_minutes    integer     NOT NULL DEFAULT 0,   -- minutes in Clar tab that day
  clar_exchanges  integer     NOT NULL DEFAULT 0,   -- # back-and-forth messages
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE user_daily_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own log"
  ON user_daily_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast history queries (Mirror reads last 7 rows)
CREATE INDEX IF NOT EXISTS idx_user_daily_log_user_date
  ON user_daily_log(user_id, date DESC);
