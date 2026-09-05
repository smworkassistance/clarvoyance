-- Clarvoyance v225 — add user_id to admin_insights
--
-- admin_insights (schema_v129.sql) was built as an anonymous debug-log
-- stub — insight_key + a jsonb value blob (state_read, charts_live,
-- frameworks_used, pace, message snippets), no row ever identified WHICH
-- USER it came from. That was fine for its original purpose (owner reads
-- a feed of recent turns to sanity-check prompt behavior), but it means
-- there has never been a way to ask "for this specific person, does their
-- Clar usage actually correlate with how they're doing emotionally?" —
-- exactly what v225 needs to compute per-user correlation.
--
-- Existing rows are left as NULL (unattributed, unrecoverable — there was
-- never a user_id to backfill from) and simply won't be included in any
-- correlation computed after this migration runs. Only new rows going
-- forward carry it.

ALTER TABLE admin_insights ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_admin_insights_user_id ON admin_insights (user_id, created_at);

-- Tighten the existing wide-open INSERT policies (schema_v160_fix.sql /
-- schema_v164_fix.sql both used WITH CHECK (true)) so a client can only
-- ever attribute a row to their own real session, not an arbitrary uid.
-- SELECT stays exactly as-is (already service_role-only since v178b) —
-- not touched here.
DROP POLICY IF EXISTS "anon_insight_insert" ON admin_insights;
DROP POLICY IF EXISTS "authenticated_insight_insert" ON admin_insights;
CREATE POLICY "authenticated_insight_insert" ON admin_insights
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
-- Anonymous (pre-sign-in) sessions are still real Supabase users under this
-- app's auth model (signInAnonymously()), so they authenticate as
-- "authenticated" too — there is no genuinely unauthenticated write path
-- left once this runs; the old anon-role policy is dropped, not replaced,
-- since nothing should be inserting without a real session.
