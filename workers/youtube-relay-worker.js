/* ═══════════════════════════════════════════════════════════════════
   Clarvoyance — YouTube Topic Relay (Cloudflare Worker)
   Deploy: paste this whole file into a new Cloudflare Worker (dashboard
   → Workers & Pages → Create → paste into the editor → Deploy), same way
   the existing Sheets/Gemini/Admin workers were set up.

   Required Worker secrets (Settings → Variables and Secrets → encrypt):
     YOUTUBE_API_KEY      — a YouTube Data API v3 key from Google Cloud
                             Console (APIs & Services → Credentials →
                             Create Credentials → API key), with the
                             "YouTube Data API v3" enabled on that project.
                             Restrict the key to that API only.
     SUPABASE_SERVICE_KEY — Supabase service_role key (Project Settings →
                             API → service_role, the "secret" one, NOT
                             anon). Bypasses RLS — server-side only, same
                             rule as every other worker in this project.

   Deliberately NOT token-gated like admin-relay-worker.js — this is
   called from the main app by every regular user (goal → matched topic
   → relevant videos), not a private admin action, so there's no bearer
   token to check. Nothing it does is sensitive: it only ever reads
   YouTube's public search results and writes to a public-read cache
   table, both fully described in db/schema_v200_youtube.sql.

   Purpose: YouTube's search.list costs 100 quota units per call against
   a default 10,000/day project quota — cheap per call, not cheap per
   USER if every person's goal triggered a fresh search. This worker
   searches once per TOPIC (a small fixed vocabulary, not per user) and
   caches the results in Supabase for 24h; every user whose goal maps to
   that topic is served from the cache, so the whole app can run on a
   couple dozen real searches a day regardless of how many users it has.
   ═══════════════════════════════════════════════════════════════════ */

const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
const CACHE_HOURS = 24;
/* YouTube expanded Shorts eligibility to up to 3 minutes in late 2024 —
   200s gives a little buffer above that while still excluding ordinary
   long-form content. There is no official "isShort" API filter, so this
   duration cutoff (checked via videos.list, not search.list's looser
   videoDuration=short which only means "under 4 minutes") is the closest
   available proxy. */
const MAX_SHORT_SECONDS = 200;
const RESULTS_PER_TOPIC = 12;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function sbFetch(env, path, init = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) throw new Error((data && data.message) || ('Supabase error ' + res.status));
  return data;
}

/* "PT1M30S" / "PT45S" / "PT3M" → seconds. No library — same hand-rolled
   convention as this project's other worker files. */
function parseIso8601Duration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10), min = parseInt(m[2] || '0', 10), s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

async function fetchFreshFromCache(env, topic) {
  const since = new Date(Date.now() - CACHE_HOURS * 3600000).toISOString();
  const rows = await sbFetch(
    env,
    'youtube_topic_cache?topic=eq.' + encodeURIComponent(topic) +
      '&fetched_at=gte.' + encodeURIComponent(since) +
      '&order=fetched_at.desc&limit=' + RESULTS_PER_TOPIC
  );
  return Array.isArray(rows) ? rows : [];
}

async function searchYouTubeForTopic(env, topic, query) {
  if (!env.YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY secret is not set on this Worker');

  const searchUrl = 'https://www.googleapis.com/youtube/v3/search'
    + '?part=snippet&type=video&videoDuration=short&order=relevance'
    + '&maxResults=25&safeSearch=strict'
    + '&q=' + encodeURIComponent(query)
    + '&key=' + env.YOUTUBE_API_KEY;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  if (!searchRes.ok) throw new Error((searchData.error && searchData.error.message) || 'YouTube search failed');

  const ids = (searchData.items || []).map((it) => it.id && it.id.videoId).filter(Boolean);
  if (!ids.length) return [];

  /* videos.list costs only 1 unit — used here purely to get the exact
     duration for real Shorts-length filtering, since search.list's own
     videoDuration=short filter only means "under 4 minutes". */
  const detailsUrl = 'https://www.googleapis.com/youtube/v3/videos'
    + '?part=contentDetails,snippet&id=' + ids.join(',')
    + '&key=' + env.YOUTUBE_API_KEY;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();
  if (!detailsRes.ok) throw new Error((detailsData.error && detailsData.error.message) || 'YouTube video details failed');

  const rows = [];
  for (const v of detailsData.items || []) {
    const seconds = parseIso8601Duration(v.contentDetails && v.contentDetails.duration);
    if (seconds === null || seconds > MAX_SHORT_SECONDS) continue;
    const sn = v.snippet || {};
    const thumb = sn.thumbnails && (sn.thumbnails.high || sn.thumbnails.medium || sn.thumbnails.default);
    rows.push({
      topic,
      video_id: v.id,
      title: (sn.title || '').slice(0, 300),
      thumbnail_url: (thumb && thumb.url) || null,
      channel_title: (sn.channelTitle || '').slice(0, 150),
      duration_seconds: seconds,
      fetched_at: new Date().toISOString(),
    });
    if (rows.length >= RESULTS_PER_TOPIC) break;
  }
  return rows;
}

async function getVideosForTopic(env, topic, query) {
  const cached = await fetchFreshFromCache(env, topic);
  if (cached.length) return { source: 'cache', videos: cached };

  const fresh = await searchYouTubeForTopic(env, topic, query || topic);
  if (fresh.length) {
    await sbFetch(env, 'youtube_topic_cache?on_conflict=topic,video_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(fresh),
    });
  }
  return { source: 'live', videos: fresh };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'invalid JSON' }, 400); }

    const topic = String(body.topic || '').trim().toLowerCase();
    if (!topic) return json({ error: 'topic is required' }, 400);

    try {
      const result = await getVideosForTopic(env, topic, body.query);
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
