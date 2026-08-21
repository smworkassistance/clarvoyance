-- ═══════════════════════════════════════════════════════════════════
-- v186 — Engagement / momentum engine: per-section daily time + XP
-- targets, NN completion, and hour-based accelerating momentum decay.
-- Foundation for Fortune's gap-awareness fix and future graphs/charts.
--
-- Run this whole file in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════

-- ── Extends the existing v126 user_daily_log table (one row per user
--    per day) rather than creating a parallel table — it's already
--    shaped exactly right for time-series charts (clean daily rows,
--    indexed by user_id+date). ──
ALTER TABLE user_daily_log ADD COLUMN IF NOT EXISTS section_minutes jsonb; -- {"vibe":8,"chat":12,"fortune":3,"goal":5,"home":9,"self":2}
ALTER TABLE user_daily_log ADD COLUMN IF NOT EXISTS section_xp      jsonb; -- {"vibe":40,"chat":25,"fortune":0,"goal":10,"home":5,"self":15}
ALTER TABLE user_daily_log ADD COLUMN IF NOT EXISTS nn_pct          numeric; -- 0-100, that day's Non-Negotiables completion %
ALTER TABLE user_daily_log ADD COLUMN IF NOT EXISTS daily_score     numeric; -- 0-1, the final computed score this day contributed to momentum

-- ── Per-section daily targets — admin-editable in admin.html's new
--    "📊 Engagement" tab. One row per section, both a minutes target and
--    an XP target (XP target preserves each practice's real effectiveness/
--    impact weighting instead of collapsing it to a flat present/absent
--    check — see CLAUDE.md v186 entry for the full reasoning trail). ──
CREATE TABLE IF NOT EXISTS section_engagement_targets (
  section         text PRIMARY KEY CHECK (section IN ('vibe','chat','fortune','goal','home','self')),
  target_minutes  numeric NOT NULL DEFAULT 10,
  target_xp       numeric NOT NULL DEFAULT 10,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO section_engagement_targets (section, target_minutes, target_xp) VALUES
  ('vibe',    10, 10),
  ('chat',    10, 10),
  ('fortune', 2.5, 5),
  ('goal',    10, 10),
  ('home',    10, 10),
  ('self',    5,  10)
ON CONFLICT (section) DO NOTHING;

-- ── Global engagement constants — single-row table (id is always
--    literally `true`, a standard Postgres trick to enforce exactly one
--    row), admin-editable, used by every formula below. ──
CREATE TABLE IF NOT EXISTS engagement_settings (
  id                        boolean PRIMARY KEY DEFAULT true CHECK (id),
  -- a day only counts as "genuinely engaged" (resets the decay clock,
  -- and is what the NN multiplier + section scores feed into) once
  -- daily_score crosses this bar
  engaged_day_threshold_pct numeric NOT NULL DEFAULT 60,
  -- decay formula: % momentum retained = exp(-decay_k * hours_since_engaged ^ decay_exponent)
  -- defaults tuned so 24h retains ~95%, 48h ~87%, 72h ~77%, 168h(7d) ~39%
  decay_k                   numeric NOT NULL DEFAULT 0.000436,
  decay_exponent            numeric NOT NULL DEFAULT 1.5,
  -- NN ("non-negotiable") completion multiplier on top of the 6-section
  -- average — deliberately NOT diluted as a 7th equal-weighted section,
  -- since skipping NN should hurt disproportionately, not just 1/7th.
  nn_full_multiplier        numeric NOT NULL DEFAULT 1.0,   -- NN% >= nn_full_threshold_pct
  nn_full_threshold_pct     numeric NOT NULL DEFAULT 80,
  nn_partial_multiplier     numeric NOT NULL DEFAULT 0.75,  -- NN% >= nn_partial_threshold_pct (and below full)
  nn_partial_threshold_pct  numeric NOT NULL DEFAULT 40,
  nn_none_multiplier        numeric NOT NULL DEFAULT 0.5,   -- NN% below nn_partial_threshold_pct
  updated_at                timestamptz NOT NULL DEFAULT now()
);
INSERT INTO engagement_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- ── RLS: both tables are read-only reference data for the main app
--    (like feature_gates/ai_context) — public SELECT, writes only via
--    admin-relay-worker.js's service_role, same lockdown pattern as
--    everything since v178. ──
ALTER TABLE section_engagement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_settings        ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read targets"  ON section_engagement_targets;
DROP POLICY IF EXISTS "public read settings" ON engagement_settings;
CREATE POLICY "public read targets"  ON section_engagement_targets FOR SELECT USING (true);
CREATE POLICY "public read settings" ON engagement_settings        FOR SELECT USING (true);
GRANT SELECT ON section_engagement_targets TO anon, authenticated;
GRANT SELECT ON engagement_settings        TO anon, authenticated;

-- service_role needs its own explicit grant regardless of table age —
-- confirmed 4x now this is a standing property of this project (v178a/
-- v181/v182/v184), not a one-off, so granted defensively here too.
GRANT SELECT, INSERT, UPDATE, DELETE ON section_engagement_targets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON engagement_settings        TO service_role;
GRANT SELECT, UPDATE ON user_daily_log TO service_role;
