-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v152 — Revise & Repeat Image Sync
-- Run these statements in the Supabase SQL Editor (once)
-- Mirrors db/schema_v147.sql (Vision Image Sync) for the Revise & Repeat images
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add rr_images column to user_revise
--    Stores [{src: "https://...", note: "..."}] for cross-device sync
ALTER TABLE user_revise
  ADD COLUMN IF NOT EXISTS rr_images JSONB;

-- ───────────────────────────────────────────────────────────────────
-- 2. Create the revise-images Storage bucket
--    (public = true so images load in <img> tags without auth headers)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('revise-images', 'revise-images', true)
  ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- 3. RLS policies for revise-images bucket
-- ───────────────────────────────────────────────────────────────────

-- Public read (images load in any browser without auth)
CREATE POLICY "Revise images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'revise-images');

-- Authenticated users (anon + Google) can upload to their own folder
CREATE POLICY "Revise images user upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'revise-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Revise images user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'revise-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
