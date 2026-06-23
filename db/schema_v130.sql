-- ============================================================
-- Clarvoyance v130 — Schema Migration
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================

-- ── user_practice_log ────────────────────────────────────────
-- Tracks every tool, charger, and vibe card completion.
-- Used by Fortuneteller Phase 3 to see "you haven't used X in 12 days".
CREATE TABLE IF NOT EXISTS user_practice_log (
  id           bigserial    PRIMARY KEY,
  user_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text         NOT NULL,          -- 'tool' | 'charger' | 'vibe_card'
  name         text         NOT NULL,          -- human-readable label (max 120 chars)
  completed_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE user_practice_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_practice_log"
  ON user_practice_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast history queries (Fortuneteller reads last 30 days)
CREATE INDEX IF NOT EXISTS idx_practice_log_user_date
  ON user_practice_log(user_id, completed_at DESC);

-- Index for per-name lookup ("last used X")
CREATE INDEX IF NOT EXISTS idx_practice_log_user_name
  ON user_practice_log(user_id, name, completed_at DESC);
