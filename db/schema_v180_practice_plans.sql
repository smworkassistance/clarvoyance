-- ═══ Clarvoyance v180 — Practice Plans ═══
-- Run this on your Supabase SQL editor.
-- "Practice Plan" (not "Prescription" — avoids any medical/clinical implication,
-- consistent with the app's own disclaimer that Clar is a companion, not a therapist).
-- A short, specific, time-boxed practice Clar suggests when a real pattern (a
-- recurring problem, or a stated goal) has genuinely earned it — never a task list.

CREATE TABLE IF NOT EXISTS user_practice_plans (
  id             bigserial   PRIMARY KEY,
  user_id        uuid        NOT NULL,
  source         text        NOT NULL CHECK (source IN ('chat_problem','goal')),
  source_context text        NOT NULL DEFAULT '',
  practice_type  text        NOT NULL, -- 'clar_chat' | 'nn_zero_skip' | 'tool' | 'charger' | 'vibe_card' | 'self_practice'
  practice_name  text        NOT NULL, -- human-readable name of the specific practice
  target_value   numeric     NOT NULL DEFAULT 1,
  target_unit    text        NOT NULL, -- 'daily_minutes' | 'zero_skip' | 'daily_count'
  duration_days  integer     NOT NULL,
  start_date     date        NOT NULL DEFAULT CURRENT_DATE,
  status         text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','lapsed')),
  display_text   text        NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_practice_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practice_plans_self" ON user_practice_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_practice_plans TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_practice_plans_id_seq TO anon, authenticated;

-- practice_type='clar_chat'/'app_time' adherence is checked against clv_clar_times/
-- clv_app_times, which only ever hold a 7-day rolling window — keep duration_days
-- <=7 for those. practice_type='nn_zero_skip' checks against c9_nnhist (unbounded
-- history), so longer durations (e.g. 30 days) are fine there. tool/charger/
-- vibe_card/self_practice check against user_practice_log (unbounded, timestamped).
