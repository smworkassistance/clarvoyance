-- ============================================================
-- Clarvoyance v178 — Lock down anon write access opened in v160/v161/v170
-- Run in Supabase SQL Editor AFTER the admin-relay-worker.js is deployed
-- and admin.html has been updated to use it (otherwise admin.html breaks).
-- ============================================================
-- Context: schema_v160.sql/schema_v161.sql/schema_v170_fix.sql opened
-- write (and for admin_commands/admin_insights, read) access to the
-- `anon` role so admin.html could write directly with the public anon
-- key already shipped in the main app. That anon key is trivially
-- extractable from the public site, so anyone had standing write access
-- to Clar's live prompts and read access to the debug log (which can
-- contain real user message snippets). This migration revokes exactly
-- those anon grants — admin.html now goes through
-- workers/admin-relay-worker.js instead, which holds the real
-- (service_role) credential server-side.
--
-- NOT touched, deliberately: `authenticated` role grants (never had
-- write access to these tables — verified by reading schema_v160.sql /
-- schema_v161.sql / schema_v170_fix.sql, which scoped every GRANT/POLICY
-- explicitly `TO anon`, not `TO authenticated`), and anon SELECT on
-- ai_context/tools/chargers + anon/authenticated INSERT on
-- admin_insights — the main app (index.html) needs all of those to keep
-- working for real users.
-- ============================================================

-- ── ai_context: anon may still SELECT (main app reads this for Clar's
--    system prompt) — revoke only the write access admin.html no longer
--    needs directly ──
REVOKE INSERT, UPDATE, DELETE ON ai_context FROM anon;
DROP POLICY IF EXISTS "anon_write_insert" ON ai_context;
DROP POLICY IF EXISTS "anon_write_update" ON ai_context;
DROP POLICY IF EXISTS "anon_write_delete" ON ai_context;

-- ── tools / chargers: revoke the narrow UPDATE grant added for the
--    ai_best_for field editor (schema_v170_fix.sql). SELECT is untouched
--    — the main app needs it. ──
REVOKE UPDATE ON tools FROM anon;
REVOKE UPDATE ON chargers FROM anon;
DROP POLICY IF EXISTS "anon_tools_update" ON tools;
DROP POLICY IF EXISTS "anon_chargers_update" ON chargers;

-- ── admin_commands: the main app never reads or writes this table at
--    all (verified — only admin.html's Consultant/System Commands
--    features touch it), so anon loses ALL access, not just write. ──
REVOKE SELECT, INSERT, UPDATE, DELETE ON admin_commands FROM anon;
DROP POLICY IF EXISTS "anon_commands_select" ON admin_commands;
DROP POLICY IF EXISTS "anon_commands_insert" ON admin_commands;
DROP POLICY IF EXISTS "anon_commands_update" ON admin_commands;
DROP POLICY IF EXISTS "anon_commands_delete" ON admin_commands;

-- ── admin_insights: main app needs anon INSERT to keep logging real
--    chat/fortuneteller turns (schema_v160.sql/schema_v160_fix.sql) —
--    that stays. Only anon SELECT (reading the debug log, which can
--    contain real user message snippets) is revoked; admin.html reads
--    it via the worker now. ──
REVOKE SELECT ON admin_insights FROM anon;
DROP POLICY IF EXISTS "anon_insight_select" ON admin_insights;
-- anon_insight_insert (INSERT) and the authenticated-role policies from
-- schema_v164_fix.sql are intentionally left in place.

-- ============================================================
-- Verify after running (all should now fail with a permission error when
-- tested with the anon key — e.g. via curl or admin.html's console —
-- except ai_context/tools/chargers SELECT and admin_insights INSERT,
-- which should still succeed):
--   curl -X PATCH '<SB_URL>/rest/v1/ai_context?key=eq.identity' \
--     -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>" \
--     -H "Content-Type: application/json" -d '{"content":"test"}'
--   → expect 401/403, not 200/204
-- ============================================================
