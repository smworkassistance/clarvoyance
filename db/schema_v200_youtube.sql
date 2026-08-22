-- ═══════════════════════════════════════════════════════════════════
-- v200 — YouTube topic cache, for the goal-matched Shorts feature.
-- Run this whole file in the Supabase SQL editor.
--
-- Purpose: workers/youtube-relay-worker.js searches YouTube once per
-- TOPIC (a small fixed vocabulary, not per user) and caches results
-- here for 24h, so the whole app's real YouTube API usage stays a
-- couple dozen searches a day regardless of how many users it has.
-- Read-only for the main app (public reference data, like
-- feature_gates/section_engagement_targets); only the worker's
-- service_role writes to it.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS youtube_topic_cache (
  id               bigserial PRIMARY KEY,
  topic            text NOT NULL,       -- e.g. 'business', 'manifestation'
  video_id         text NOT NULL,       -- YouTube video id
  title            text,
  thumbnail_url    text,
  channel_title    text,
  duration_seconds integer,
  fetched_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(topic, video_id)
);

CREATE INDEX IF NOT EXISTS idx_youtube_topic_cache_topic
  ON youtube_topic_cache(topic, fetched_at DESC);

-- RLS: public SELECT (every user's browser reads this directly), writes
-- only via the worker's service_role — same lockdown pattern as every
-- other reference table since v178.
ALTER TABLE youtube_topic_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read youtube cache" ON youtube_topic_cache;
CREATE POLICY "public read youtube cache" ON youtube_topic_cache FOR SELECT USING (true);
GRANT SELECT ON youtube_topic_cache TO anon, authenticated;

-- service_role needs its own explicit grant regardless of table age —
-- confirmed a standing property of this project (v178a/v181/v182/v184/
-- v186), not a one-off, so granted defensively here too.
GRANT SELECT, INSERT, UPDATE, DELETE ON youtube_topic_cache TO service_role;
GRANT USAGE, SELECT ON SEQUENCE youtube_topic_cache_id_seq TO service_role;

NOTIFY pgrst, 'reload schema';
