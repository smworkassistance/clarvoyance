-- ============================================================
-- Clarvoyance v181 — Grant service_role on charger_categories + charger_rules
-- Run in Supabase SQL Editor
-- ============================================================
-- admin-relay-worker.js gained chargers/charger_categories/charger_rules/
-- tools upsert+delete actions (admin.html's Chargers/Categories/Rules/Tools
-- tabs previously wrote to Google Sheets only, which the live app no longer
-- reads unless Supabase itself fails — see CLAUDE.md for the full story).
--
-- db/schema_v178a_fix_service_role_grants.sql already granted service_role
-- SELECT/INSERT/UPDATE/DELETE on `tools` and `chargers` (it needed those two
-- for the existing content.updateAiBestFor action). It did NOT cover
-- charger_categories or charger_rules — this migration closes that gap.
-- tools/chargers are re-granted too, defensively; GRANT is idempotent, so
-- re-running it on an already-granted table is a harmless no-op.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON charger_categories, charger_rules, tools, chargers
  TO service_role;

-- Verify with (in SQL Editor):
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema='public' AND grantee='service_role'
--     AND table_name IN ('charger_categories','charger_rules','tools','chargers');
