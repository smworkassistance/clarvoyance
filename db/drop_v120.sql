-- ============================================================
-- Clarvoyance v120 — Drop all content tables
-- Run this FIRST in Supabase SQL Editor, then run schema_v120.sql
-- ============================================================

DROP TABLE IF EXISTS manifestation_steps CASCADE;
DROP TABLE IF EXISTS ai_context CASCADE;
DROP TABLE IF EXISTS learning_channels CASCADE;
DROP TABLE IF EXISTS revise_repeat CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS vibe_cards CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS charger_rules CASCADE;
DROP TABLE IF EXISTS chargers CASCADE;
DROP TABLE IF EXISTS charger_categories CASCADE;
DROP TABLE IF EXISTS modules CASCADE;

-- Done. Now run schema_v120.sql for a clean setup.
