-- ============================================================
-- Clarvoyance v178c — Fix user_daily_log / user_practice_log not working
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================
-- Confirmed broken via a real anonymous-session test (not assumed):
--   user_daily_log  → PostgREST 404 "Could not find the table in the
--                      schema cache" — schema_v126.sql evidently never
--                      actually ran (or never completed) on this project.
--   user_practice_log → 403 "permission denied for table user_practice_log",
--                      with Postgres's own hint: "GRANT the required
--                      privileges ... GRANT INSERT ON public.user_practice_log
--                      TO authenticated" — table exists and RLS is correct,
--                      it's just missing the anon/authenticated GRANT that
--                      the other 6 user_* sync tables got in schema_v121.sql
--                      (same root cause class as v178a's service_role gap —
--                      this project's default privileges are non-standard).
-- Both only ever needed by the app's own INSERT/UPSERT paths (verified via
-- grep — index.html never SELECTs either table), but GRANT ALL to match
-- the exact pattern already used for every other user_* table, since RLS
-- (FOR ALL, auth.uid()=user_id) already supports every operation safely.
-- ============================================================

-- ── Re-create user_daily_log (idempotent) — in case schema_v126.sql
--    never actually ran ──
CREATE TABLE IF NOT EXISTS user_daily_log (
  id              bigserial PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            date        NOT NULL,
  xp_total        integer     NOT NULL DEFAULT 0,
  streak_day      integer     NOT NULL DEFAULT 0,
  clar_minutes    integer     NOT NULL DEFAULT 0,
  clar_exchanges  integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE user_daily_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can manage own log" ON user_daily_log;
CREATE POLICY "users can manage own log"
  ON user_daily_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_log_user_date
  ON user_daily_log(user_id, date DESC);

-- ── Grants missing on both tables ──
GRANT ALL ON user_daily_log     TO anon, authenticated;
GRANT ALL ON user_practice_log  TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_daily_log_id_seq     TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_practice_log_id_seq  TO anon, authenticated;

-- ── Force PostgREST to pick up the (possibly newly created) table and
--    the new grants immediately, instead of waiting for its own cache
--    refresh cycle ──
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Verify (real anonymous session, not the bare anon key — RLS requires
-- auth.uid() to be set): INSERT into both tables should now succeed.
-- ============================================================
