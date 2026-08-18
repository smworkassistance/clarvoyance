-- ============================================================
-- Clarvoyance v182a — Fix missing service_role grants on the new v182 tables
-- Run in Supabase SQL Editor
-- ============================================================
-- Same root cause as db/schema_v178a_fix_service_role_grants.sql: this
-- project's service_role does not automatically inherit access to newly
-- created tables. feature_gates and user_usage_log are both new in
-- v182's migration, so the admin-relay-worker.js (which uses
-- service_role) got "permission denied for table feature_gates" on its
-- very first real call — confirmed live, not assumed.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON feature_gates, user_usage_log
  TO service_role;

-- ============================================================
-- Verify: re-run the worker's feature_gates.select action — should
-- return the two seeded rows instead of a permission error.
-- ============================================================
