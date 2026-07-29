-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v160 — FIX for schema_v160.sql (revised)
-- Run in the Supabase SQL Editor (once)
--
-- Re-verified via curl against the live project:
--   - ai_context columns + backfill: OK
--   - ai_context anon write (RLS policies): OK
--   - chart-images storage bucket: OK — it exists and works. The earlier
--     "missing" finding was a false negative from checking the wrong
--     endpoint (bucket-info admin endpoint isn't anon-readable the same
--     way object-list is); confirmed via a real object-list call. No fix
--     needed here — do NOT re-run the bucket/policy statements, they
--     already exist (that's the "already exists" error you just hit).
--   - admin_insights anon insert/select: STILL BLOCKED — this project has
--     "Enable automatic RLS" on, so admin_insights got RLS enabled even
--     though schema_v129.sql never said to, and the GRANT alone isn't
--     enough without an actual policy. This is the only real fix needed.
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "anon_insight_insert" ON admin_insights FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insight_select" ON admin_insights FOR SELECT TO anon USING (true);
