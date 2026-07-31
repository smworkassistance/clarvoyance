-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v170 — add ai_best_for to tools + let admin.html write
-- ai_best_for directly to Supabase for both tools and chargers
-- Run in the Supabase SQL Editor (once)
--
-- Found via audit: chargers already has an ai_best_for column (just 100%
-- empty, no admin UI to fill it in), but tools never got the column at all.
-- _buildSystemPrompt()'s toolsList/chargersList already read t.ai_best_for
-- conditionally — no code change needed there, it just had nothing to read.
--
-- IMPORTANT: admin.html's Tools/Chargers tabs still save through the old
-- Google Sheets/Apps Script path (fix_grants_v120.sql only ever granted
-- these tables SELECT for the live app to read). Writing ai_best_for through
-- that old path would land in the Sheet, not Supabase — and the live app
-- reads Supabase, so it would never actually reach Clar. So this one field
-- gets a narrow, separate write path straight to Supabase (confirmed via
-- curl: UPDATE on tools was rejected with 401 before this grant existed),
-- kept deliberately independent from the rest of each form's existing
-- Sheets-based save so nothing already working is touched.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE tools ADD COLUMN IF NOT EXISTS ai_best_for text;

GRANT UPDATE ON tools TO anon;
GRANT UPDATE ON chargers TO anon;

CREATE POLICY "anon_tools_update" ON tools FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_chargers_update" ON chargers FOR UPDATE TO anon USING (true) WITH CHECK (true);
