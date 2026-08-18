-- ============================================================
-- Clarvoyance v182b — Fix missing service_role grant on user_profile
-- Run in Supabase SQL Editor
-- ============================================================
-- Confirmed live (not assumed): admin-relay-worker.js's new
-- user_profile.findByEmail action returned "permission denied for
-- table user_profile". Root cause: user_profile was created in
-- schema_v121.sql, before this project's service_role grant gap was
-- ever discovered (v178a) — it only ever granted anon/authenticated,
-- since only the main app touched this table until the Limits tab's
-- manual tier-assignment tool needed service_role access to look users
-- up by email. Same fix pattern as v178a/v182a.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON user_profile TO service_role;

-- ============================================================
-- Verify: re-run user_profile.findByEmail — should return the account
-- instead of a permission error.
-- ============================================================
