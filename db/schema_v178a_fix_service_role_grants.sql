-- ============================================================
-- Clarvoyance v178a — Fix missing service_role grants
-- Run in Supabase SQL Editor BEFORE schema_v178_lockdown_admin_write.sql
-- ============================================================
-- Discovered while wiring up workers/admin-relay-worker.js: the Worker's
-- SUPABASE_SERVICE_KEY was confirmed correct (decoded JWT role ==
-- 'service_role'), but every request still failed with
-- "permission denied for table ..." — meaning service_role itself never
-- had explicit grants on these tables. Normally Supabase provisions
-- service_role with blanket access automatically; on this project that
-- evidently didn't carry through to these specific tables, so grant it
-- explicitly rather than relying on the default.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_context, admin_commands, admin_insights, tools, chargers
  TO service_role;

-- ============================================================
-- Verify with (in SQL Editor, or reuse admin-relay-worker.js's own
-- action which will now succeed instead of erroring):
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema='public' AND grantee='service_role'
--     AND table_name IN ('ai_context','admin_commands','admin_insights','tools','chargers');
-- ============================================================
