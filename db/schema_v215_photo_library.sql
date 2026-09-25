-- ═══════════════════════════════════════════════════════════════════
-- v215 — PHOTO LIBRARY: real photography backgrounds for the Vibe Feed's
-- new colorful Pinterest-style quote cards. Populated by
-- workers/photo-relay-worker.js from Pixabay (free API, no attribution
-- required, but their terms forbid hotlinking their CDN — so every photo
-- is downloaded once and re-hosted in our own `quote-photos` Storage
-- bucket; this table only ever stores OUR OWN url, never a Pixabay one).
--
-- Unlike the YouTube video pool, background themes are a small FIXED
-- list (~18 curated aesthetic moods, not per-user arbitrary search), so
-- this doesn't need the video feature's per-topic pagination-state
-- machinery to the same degree — photo_theme_state exists just to
-- remember which Pixabay page a theme last pulled, so a top-up fetches
-- the NEXT page instead of re-fetching page 1 forever. See CLAUDE.md v215.
--
-- Run this whole file in the Supabase SQL editor. Also run (once, in the
-- Storage section of the Supabase dashboard, or via the SQL below) to
-- create the public `quote-photos` bucket if it doesn't already exist.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS photo_library (
  id            bigserial PRIMARY KEY,
  theme         text NOT NULL,
  source_id     text NOT NULL,   -- Pixabay's own photo id, for de-duping re-fetches
  url           text NOT NULL,   -- OUR OWN Supabase Storage url (never Pixabay's)
  photographer  text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (theme, source_id)
);

CREATE TABLE IF NOT EXISTS photo_theme_state (
  theme       text PRIMARY KEY,
  next_page   int NOT NULL DEFAULT 2,
  exhausted   boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photo_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read photo library" ON photo_library;
CREATE POLICY "public read photo library" ON photo_library FOR SELECT USING (true);
GRANT SELECT ON photo_library TO anon, authenticated;

ALTER TABLE photo_theme_state ENABLE ROW LEVEL SECURITY;
-- no public policy at all — this is worker-internal bookkeeping, the
-- client never reads it directly.

-- service_role needs its own explicit grant regardless of table age —
-- a standing property of this project (v178a/v181/v182/v184/v186/v205).
GRANT SELECT, INSERT, UPDATE, DELETE ON photo_library TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON photo_theme_state TO service_role;
GRANT USAGE, SELECT ON SEQUENCE photo_library_id_seq TO service_role;

-- Public Storage bucket for the re-hosted photos. If this fails because
-- the bucket already exists, or because your Supabase plan restricts
-- creating buckets via SQL, create it manually instead: Storage → New
-- bucket → name "quote-photos" → Public bucket = ON.
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos', 'quote-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read quote-photos" ON storage.objects;
CREATE POLICY "public read quote-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'quote-photos');

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Photo Library (v215) -- real stock photography backgrounds for the Vibe Feed''s colorful quote cards. Populated from Pixabay (free API) by workers/photo-relay-worker.js across ~18 fixed aesthetic themes (sunset, ocean, forest, etc, NOT per-user search like video topics) -- every photo is downloaded once and re-hosted in the quote-photos Storage bucket (Pixabay forbids hotlinking their own CDN), so the client only ever loads from our own storage. Each theme self-tops-up (real Pixabay pagination via photo_theme_state) whenever its cached count runs low. A per-user rolling "seen" id list (localStorage) prevents personal repeats. If a photo fails to load client-side, the card is skipped (falls through to the next Vibe Feed item) rather than shown broken, capped at one auto-skip so a fully-offline moment cannot cascade.'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Photo Library (v215)%');

NOTIFY pgrst, 'reload schema';
