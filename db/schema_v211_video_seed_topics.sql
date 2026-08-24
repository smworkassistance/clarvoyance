-- ═══════════════════════════════════════════════════════════════════
-- v211 — admin-managed "seed" video topics, e.g. Abraham Hicks / Law of
-- Attraction content the owner wants periodically surfaced app-wide
-- regardless of what a given user has personally added. Shown to users
-- as a dedicated, pre-toggled-on "Admin Recommended" section in My
-- Interests (visible and opt-out-able, not silently injected).
-- Run this whole file in the Supabase SQL editor.
--
-- Read-only for the main app (every user's browser reads this directly
-- to render the chips) — same posture as youtube_topic_cache/
-- feature_gates. Writes only via workers/admin-relay-worker.js
-- (service_role), same lockdown pattern as every other admin table
-- since v178.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_seed_topics (
  id          bigserial PRIMARY KEY,
  label       text NOT NULL,        -- shown on the chip, e.g. "Law of Attraction"
  topic       text NOT NULL UNIQUE, -- the Worker topic key, e.g. "seed_law_of_attraction"
  query       text NOT NULL,        -- the real YouTube search string
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_seed_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read video seed topics" ON video_seed_topics;
CREATE POLICY "public read video seed topics" ON video_seed_topics FOR SELECT USING (true);
GRANT SELECT ON video_seed_topics TO anon, authenticated;

-- service_role needs its own explicit grant regardless of table age —
-- a standing property of this project (v178a/v181/v182/v184/v186/v205),
-- not a one-off, so granted defensively here too.
GRANT SELECT, INSERT, UPDATE, DELETE ON video_seed_topics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE video_seed_topics_id_seq TO service_role;

-- Documents this whole system in the existing "AI Features" registry
-- (admin.html → 🧠 AI Logic tab), per the owner's explicit ask to always
-- be able to look up what an algorithm actually does without re-reading
-- code. Guarded so re-running this file doesn't duplicate the entry.
INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Video Feed Algorithm (v211) — what feeds a user''s Vibe Feed video topics, additive, all sources combined: (1) toggled interest chips + free-text custom interests, (2) mentors/strengths/weaknesses/books (each a template-written query), (3) AI-authored mood/uplift queries — reads recent chat summaries from the LAST 2 DAYS ONLY (older is ignored, not stale-guessed) + profile, refreshed once/day, (4) Dream-Life Desire Extraction — the Major Goal box read as a dream-life story; AI extracts every distinct concrete desire (uncapped), each gets a "canonical_key" (core brand/model/category, e.g. "white Range Rover" and "black Range Rover" both -> "range_rover") so DIFFERENT USERS SHARE THE SAME CACHED SEARCH for a common desire — re-parses only when the goal text itself changes, never on a timer; each desire can later get a fresh AI-written query "angle" once its current pool is exhausted, so a standing desire keeps finding new content over time; brand-new (never-searched) desires are capped at 3 fresh YouTube searches/day per user to prevent one large story from burning a big slice of the shared daily YouTube quota in one sitting — already-cached desires are never capped. (5) Admin Recommended — topics managed in the 🎬 Video Topics tab, shown to every user as an on-by-default toggle chip in their own My Interests (opt-out, never silent). All actual YouTube search/pagination/never-repeats logic lives in workers/youtube-relay-worker.js.'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Video Feed Algorithm (v211)%');

NOTIFY pgrst, 'reload schema';
