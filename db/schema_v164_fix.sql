-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v164 — FIX: admin_insights 403 for real app users
-- Run in the Supabase SQL Editor (once)
--
-- Root cause (confirmed via curl, reproduced the exact 403): the main app
-- signs users in anonymously (sb.auth.signInAnonymously()) so it can sync
-- user data — this is intentional, existing behavior from v120/v121. But
-- ANY signed-in session (even an anonymous one) gets a JWT with role
-- "authenticated", not "anon". schema_v160.sql / schema_v160_fix.sql only
-- granted admin_insights access to the "anon" role (which is what a bare
-- curl request with just the public key uses, and what admin.html uses
-- since it never signs in) — so every real chat/fortuneteller session,
-- which is always "authenticated", was silently rejected the whole time.
-- ═══════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT ON admin_insights TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE admin_insights_id_seq TO authenticated;

CREATE POLICY "authenticated_insight_insert" ON admin_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_insight_select" ON admin_insights FOR SELECT TO authenticated USING (true);
