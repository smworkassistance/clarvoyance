-- v146: Add clar_times + momentum_history to user_progress
--        Add monthly_summaries to user_clar
-- Run in Supabase SQL editor

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS clar_times       JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS momentum_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE user_clar
  ADD COLUMN IF NOT EXISTS monthly_summaries JSONB DEFAULT '[]'::jsonb;
