-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v160 — AI Logic Console (Charts + AI Context editor)
-- Run in the Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Extend ai_context with admin-console fields
--    display_name: friendly name shown in admin ("Board Chart") — key stays the machine id
--    image_urls:   0-2 reference image URLs, admin's own reference only — never sent to the AI
--    category:     'chart' | 'context' — splits the admin console into two sections
--    applies_to:   which AI surfaces read this row, e.g. {'chat'}, {'fortuneteller'}, {'chat','fortuneteller'}
ALTER TABLE ai_context
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS image_urls   text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS category     text   DEFAULT 'context',
  ADD COLUMN IF NOT EXISTS applies_to   text[] DEFAULT '{}'::text[];

-- 2. Backfill applies_to + display_name for existing rows so current behavior is unchanged
--    and they show up correctly tagged in the new admin console.
UPDATE ai_context SET
  applies_to   = ARRAY['chat'],
  display_name = COALESCE(display_name, initcap(replace(key,'_',' ')))
  WHERE key IN ('identity','philosophy','conversation_flow','disclaimer');

UPDATE ai_context SET
  applies_to   = ARRAY['fortuneteller'],
  display_name = COALESCE(display_name, initcap(replace(key,'_',' ')))
  WHERE key IN ('fortuneteller_philosophy','emotional_guidance_system','manifestation_signals','prediction_language');

-- ───────────────────────────────────────────────────────────────────
-- 3. chart-images Storage bucket — admin's own reference images only,
--    never read by the AI (only the transcribed text logic is fed to it)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('chart-images', 'chart-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chart images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chart-images');

CREATE POLICY "Chart images anon upload"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'chart-images');

CREATE POLICY "Chart images anon delete"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'chart-images');

-- ───────────────────────────────────────────────────────────────────
-- 4. TEMPORARY write access for the admin console.
--    admin.html has no real auth yet (password gate deliberately removed for
--    fast iteration — see CLAUDE.md AI Logic Console notes). ai_context has
--    RLS enabled (schema_v120.sql) with anon_read/auth_read SELECT-only
--    policies, so a GRANT alone is not enough — writes need matching RLS
--    policies too. Tighten (or replace with a token-gated Worker relay)
--    before wider launch.
-- ───────────────────────────────────────────────────────────────────
GRANT INSERT, UPDATE, DELETE ON ai_context TO anon;

CREATE POLICY "anon_write_insert" ON ai_context FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_write_update" ON ai_context FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_delete" ON ai_context FOR DELETE TO anon USING (true);

-- ───────────────────────────────────────────────────────────────────
-- 5. admin_insights — created as a stub in v129 with no grants at all.
--    Opening it up now so (a) the live app can log AI reasoning (state_read +
--    which chart/context rows were used) and (b) admin.html's Debug Log viewer
--    can read it back. Same temporary-openness caveat as #4 applies.
-- ───────────────────────────────────────────────────────────────────
GRANT INSERT, SELECT ON admin_insights TO anon;
GRANT USAGE, SELECT ON SEQUENCE admin_insights_id_seq TO anon;
