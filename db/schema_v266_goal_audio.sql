-- v266: Goal autosuggestion audio on the account (so it plays on every device).
-- A new public-read Storage bucket, same pattern as vision-images (v147): anyone can read a file by its
-- URL, and a signed-in user can only write, overwrite and delete inside their own uid folder.
-- Nothing else changes. Until this runs, audio stays on the device that recorded it.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('goal-audio', 'goal-audio', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read (the audio plays from its URL on any device)
CREATE POLICY "Goal audio public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'goal-audio');

-- Own folder only: upload (first recording)
CREATE POLICY "Goal audio user upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'goal-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Own folder only: overwrite (re-recording uses upsert, which needs UPDATE)
CREATE POLICY "Goal audio user update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'goal-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Own folder only: delete (deleting audio / a goal)
CREATE POLICY "Goal audio user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'goal-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
