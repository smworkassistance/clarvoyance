-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v147 — Vision Image Sync
-- Run these statements in the Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add vis_images column to user_goals
--    Stores [{src: "https://...", note: "..."}] for cross-device sync
ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS vis_images JSONB;

-- ───────────────────────────────────────────────────────────────────
-- 2. Create the vision-images Storage bucket
--    (public = true so images load in <img> tags without auth headers)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('vision-images', 'vision-images', true)
  ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- 3. RLS policies for vision-images bucket
-- ───────────────────────────────────────────────────────────────────

-- Public read (images load in any browser without auth)
CREATE POLICY "Vision images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vision-images');

-- Authenticated users (anon + Google) can upload to their own folder
CREATE POLICY "Vision images user upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vision-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Vision images user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vision-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
