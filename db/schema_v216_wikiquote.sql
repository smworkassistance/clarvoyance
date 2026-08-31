-- ═══════════════════════════════════════════════════════════════════
-- v216 — WIKIQUOTE CACHE: replaces the abandoned v215 approach (a
-- one-time bulk import of 20,814 quotes as literal SQL INSERT rows,
-- which produced a 4MB migration file — too large to ever be safely
-- read/edited/verified in a normal Claude Code session again, and the
-- direct cause of that version being scrapped). Instead of importing
-- ANY quote data into this repo, quotes are fetched LIVE from
-- Wikiquote's public API (real, free, keyless, CC BY-SA licensed) by
-- workers/wikiquote-relay-worker.js and cached here per author/topic —
-- so this file only ever defines a schema, never quote content itself.
--
-- Cache key is the ORIGINAL search term (lowercased/trimmed), not the
-- matched Wikiquote page title — so repeat lookups of the same mentor
-- name or topic word hit cache instantly regardless of whether a match
-- was found. not_found rows are cached too, specifically so the worker
-- never re-runs a failed Wikiquote search for the same term over and
-- over (mirrors the youtube_topic_state "exhausted" idea).
--
-- Run this whole file in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wikiquote_cache (
  id            bigserial PRIMARY KEY,
  query_key     text NOT NULL UNIQUE,        -- normalized search term, e.g. "david goggins" or "discipline"
  query_type    text NOT NULL DEFAULT 'topic', -- 'author' | 'topic' — informational, not used for lookup
  matched_title text,                         -- real Wikiquote page title found (null when not_found)
  quotes        jsonb NOT NULL DEFAULT '[]',  -- [{quote, source}] — cleaned, profanity-filtered, length-bounded
  not_found     boolean NOT NULL DEFAULT false,
  fetched_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wikiquote_cache_fetched ON wikiquote_cache (fetched_at);

ALTER TABLE wikiquote_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read wikiquote cache" ON wikiquote_cache;
CREATE POLICY "public read wikiquote cache" ON wikiquote_cache FOR SELECT USING (true);
GRANT SELECT ON wikiquote_cache TO anon, authenticated;

-- service_role needs its own explicit grant regardless of table age --
-- a standing property of this project (v178a/v181/v182/v184/v186/v205).
GRANT SELECT, INSERT, UPDATE, DELETE ON wikiquote_cache TO service_role;
GRANT USAGE, SELECT ON SEQUENCE wikiquote_cache_id_seq TO service_role;

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Wikiquote Cache (v216) -- real, live-fetched, attributed quotes for the Vibe Feed''s colorful QPHOTO quote cards. Replaces the abandoned v215 bulk-import approach (20,814 quotes inserted as literal SQL, a 4MB file that made the migration itself unworkable to review/edit). workers/wikiquote-relay-worker.js fetches directly from Wikiquote''s free public API on demand -- author name (from My Interests mentors) or topic word (from goal/strengths/weaknesses/AI-picked mood context) -- parses the real wikitext quote list, strips wiki markup, filters by length and a profanity blocklist, and caches the result here keyed by the original search term (not the matched title), including a not_found flag so a name with no real Wikiquote page is never re-searched. Verified live against real pages (Isaac Newton, David Goggins -- confirming even modern figures often have real pages) before shipping.'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Wikiquote Cache (v216)%');

NOTIFY pgrst, 'reload schema';
