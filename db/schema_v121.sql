-- ============================================================
-- Clarvoyance v121 — User Data Sync Tables
-- Run in Supabase SQL Editor
-- Requires: anonymous auth enabled in Supabase Auth settings
-- ============================================================

-- ── 1. user_profile ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profile (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick      TEXT,
  name      TEXT,
  email     TEXT,
  persona   TEXT,
  lang      TEXT,
  theme     TEXT,
  gender    TEXT,
  age       TEXT,
  city      TEXT,
  phone     TEXT,
  country   TEXT,
  purpose   TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profile_self" ON user_profile
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 2. user_progress ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp         INTEGER DEFAULT 0,
  streak     INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_progress_self" ON user_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. user_goals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_goals (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal       TEXT,
  goal_links JSONB,
  vis_notes  JSONB,  -- vision board notes only (no base64)
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_goals_self" ON user_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. user_nn ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_nn (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nn_list    JSONB,
  nn_hist    JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_nn ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_nn_self" ON user_nn
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 5. user_clar ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_clar (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session    JSONB,
  user_profile    JSONB,
  chat_summaries  JSONB,
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_clar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_clar_self" ON user_clar
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 6. user_revise ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_revise (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rr_docs    JSONB,
  rr_links   JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_revise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_revise_self" ON user_revise
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Grants ───────────────────────────────────────────────────
GRANT ALL ON user_profile  TO anon, authenticated;
GRANT ALL ON user_progress TO anon, authenticated;
GRANT ALL ON user_goals    TO anon, authenticated;
GRANT ALL ON user_nn       TO anon, authenticated;
GRANT ALL ON user_clar     TO anon, authenticated;
GRANT ALL ON user_revise   TO anon, authenticated;
