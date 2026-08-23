-- ═══════════════════════════════════════════════════════════════════
-- v205 — pagination state for the YouTube topic cache, so a topic's
-- pool can keep growing (via workers/youtube-relay-worker.js's new
-- `more:true` action) instead of being capped at whatever the first
-- search page returned. Run this whole file in the Supabase SQL editor.
--
-- Worker-internal only — the main app never reads this table directly
-- (it only ever calls the Worker, which uses service_role). No anon/
-- authenticated grants needed, unlike youtube_topic_cache itself.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS youtube_topic_state (
  topic            text PRIMARY KEY,
  query            text,             -- original search string, so a later `more:true` call doesn't need the client to resend it
  next_page_token  text,             -- YouTube's own pagination cursor; NULL once exhausted
  exhausted        boolean NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled with no anon/authenticated policy — fully locked to
-- service_role by default (same posture as admin_insights etc. since
-- v178b: don't grant more than the app actually needs).
ALTER TABLE youtube_topic_state ENABLE ROW LEVEL SECURITY;

-- service_role needs its own explicit grant regardless of table age —
-- a standing property of this project (v178a/v181/v182/v184/v186), not
-- a one-off, so granted defensively here too even though RLS wouldn't
-- block it anyway (service_role bypasses RLS, but still needs the base
-- table-level GRANT).
GRANT SELECT, INSERT, UPDATE, DELETE ON youtube_topic_state TO service_role;

NOTIFY pgrst, 'reload schema';
