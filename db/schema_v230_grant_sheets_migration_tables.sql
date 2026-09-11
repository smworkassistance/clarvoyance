-- ============================================================
-- Clarvoyance v230 — Grant service_role on the last 5 tables that were
-- still going through Google Sheets/Apps Script from admin.html
-- Run in Supabase SQL Editor
-- ============================================================
-- admin-relay-worker.js gained vibe_cards/quotes/revise_repeat/
-- learning_channels/modules upsert+delete actions (admin.html's matching
-- tabs previously wrote to Google Sheets only, which the live app no
-- longer reads unless Supabase itself is down — see CLAUDE.md v230 entry
-- for the full story). These 5 tables have only ever had anon/authenticated
-- SELECT grants (schema_v120.sql) — service_role was never granted write
-- access because nothing needed to write to them through Supabase until now.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON vibe_cards, quotes, revise_repeat, learning_channels, modules
  TO service_role;

-- Verify with (in SQL Editor):
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema='public' AND grantee='service_role'
--     AND table_name IN ('vibe_cards','quotes','revise_repeat','learning_channels','modules');
