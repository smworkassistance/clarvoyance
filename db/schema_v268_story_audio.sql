-- v268: New Story's autosuggestion audio on the account (so it plays on every device).
-- One additive jsonb column on the existing user_goals row (one row per user, own-row RLS already in place):
--   { has_audio, listens, script, audio_path }. The audio file itself lives in the goal-audio bucket (v266).
-- Until this runs the app keeps the story audio on the device that recorded it.
ALTER TABLE public.user_goals
  ADD COLUMN IF NOT EXISTS story_audio jsonb NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
