-- ============================================================
-- Clarvoyance v178b — Fix admin_insights read access for `authenticated`
-- Run in Supabase SQL Editor
-- ============================================================
-- Found while auditing for other tables needing the same treatment as
-- v178's anon lockdown: schema_v164_fix.sql granted `authenticated`
-- SELECT on admin_insights with USING (true) — no row restriction at
-- all. Per that same file's own comment, EVERY real app user is always
-- `authenticated` (the app signs everyone in anonymously on first open),
-- so any real user could query admin_insights directly and read every
-- other user's logged chat/Fortuneteller message snippets. v178 only
-- revoked the `anon` role's SELECT and missed this — `authenticated` is
-- the role real traffic actually uses, so this was the bigger leak.
--
-- Nothing legitimate needs this: the main app only ever INSERTs into
-- admin_insights (never reads it), and admin.html now reads it via
-- workers/admin-relay-worker.js's service_role key, which bypasses this
-- entirely. INSERT for `authenticated` is left untouched — real users
-- need it to keep logging.
-- ============================================================

REVOKE SELECT ON admin_insights FROM authenticated;
DROP POLICY IF EXISTS "authenticated_insight_select" ON admin_insights;
-- authenticated_insight_insert (INSERT) is intentionally left in place.

-- ============================================================
-- Verify: with a real app session (anonymous sign-in, role=authenticated,
-- not the bare anon key), SELECT on admin_insights should now fail;
-- INSERT should still succeed; the admin-relay-worker.js path (service_role)
-- should be unaffected.
-- ============================================================
