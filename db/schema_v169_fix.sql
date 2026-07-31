-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v169 — allow type='feature' in admin_commands
-- Run in the Supabase SQL Editor (once)
--
-- admin_commands (schema_v161.sql) only allowed 'rule'/'suggestion'. Adding
-- 'feature' for the new "🧬 AI Features" registry in admin.html — a living
-- list of every AI-behavior capability that's been built (state_read,
-- frameworks_used, pace, Search grounding, etc.), visible directly in the
-- admin console rather than only in CLAUDE.md/commit messages.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE admin_commands DROP CONSTRAINT IF EXISTS admin_commands_type_check;
ALTER TABLE admin_commands ADD CONSTRAINT admin_commands_type_check CHECK (type IN ('rule','suggestion','feature'));
