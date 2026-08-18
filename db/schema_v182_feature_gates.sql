-- ============================================================
-- Clarvoyance v182 — Feature gates: admin-adjustable usage limits
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================
-- Purpose: let the owner set (and change, anytime, from admin.html — no
-- code change or redeploy needed) how many times a free vs premium user
-- can use an AI feature per day. Message-count based, not token-based —
-- decided after measuring real Gemini usage: the ~5,000-token system
-- prompt dominates per-message cost regardless of what the user actually
-- types, so message count is already an accurate cost proxy here, and
-- it's far simpler to show a user ("5/8 messages today") than a token
-- budget would be.
-- ============================================================

-- ── feature_gates: the limit config itself ─────────────────────
-- One row per (feature, tier). limit_count = NULL means unlimited.
-- Read by the main app (needs to know the limits); written only by
-- admin.html via the relay worker (service_role) — anon/authenticated
-- never write this directly, same pattern as ai_context etc.
CREATE TABLE IF NOT EXISTS feature_gates (
  feature_key   text        NOT NULL,
  tier          text        NOT NULL,
  limit_count   integer,                          -- NULL = unlimited
  period        text        NOT NULL DEFAULT 'day', -- 'day' | 'month'
  enabled       boolean     NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (feature_key, tier)
);
ALTER TABLE feature_gates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_gates" ON feature_gates;
DROP POLICY IF EXISTS "auth_read_gates" ON feature_gates;
CREATE POLICY "anon_read_gates" ON feature_gates FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_gates" ON feature_gates FOR SELECT TO authenticated USING (true);
GRANT SELECT ON feature_gates TO anon, authenticated;
-- No anon/authenticated write policy on purpose — only the relay worker
-- (service_role) writes this table, same lockdown pattern as v178.

-- Recommended starting defaults — all editable in admin.html any time,
-- these just seed sensible starting numbers so the feature isn't blank
-- on day one. Free: 8 Clar chat messages/day (a real taste, not a
-- trickle). Premium: a high safety ceiling rather than truly infinite,
-- so a single runaway account can't silently blow up the AI bill even
-- on the paid tier — 500/day is far above any real usage pattern seen
-- while testing.
INSERT INTO feature_gates (feature_key, tier, limit_count, period, enabled) VALUES
  ('clar_chat', 'free',    8,   'day', true),
  ('clar_chat', 'premium', 500, 'day', true)
ON CONFLICT (feature_key, tier) DO NOTHING;

-- ── user_usage_log: the actual per-message record, used to enforce
--    the limit above and to give the owner real usage visibility ──
CREATE TABLE IF NOT EXISTS user_usage_log (
  id           bigserial   PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key  text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_usage_log" ON user_usage_log;
CREATE POLICY "users_own_usage_log"
  ON user_usage_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON user_usage_log TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_usage_log_id_seq TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_user_usage_log_lookup
  ON user_usage_log(user_id, feature_key, created_at DESC);

-- ── user_profile: which tier this account is actually on ───────
-- Defaults everyone to 'free'. No payment integration exists yet, so
-- for now the owner sets this manually per-account from admin.html
-- (a lookup-by-email tool) — wiring it to Razorpay webhooks is a
-- separate, later task.
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

-- ============================================================
-- Verify: SELECT * FROM feature_gates; should show the two seeded rows.
-- ============================================================
