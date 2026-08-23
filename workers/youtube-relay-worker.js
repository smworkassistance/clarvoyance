/* ═══════════════════════════════════════════════════════════════════
   Clarvoyance — YouTube Topic Relay (Cloudflare Worker)
   Deploy: paste this whole file into the existing `clar-youtube` Cloudflare
   Worker (dashboard → Workers & Pages → clar-youtube → Edit Code → paste
   → Deploy). This REPLACES the v200/v201 version of this file — same
   Worker, same URL, same two secrets already configured, no new secrets
   needed for this update.

   Required Worker secrets (unchanged from v200/v201):
     YOUTUBE_API_KEY      — a YouTube Data API v3 key from Google Cloud
                             Console, restricted to that API.
     SUPABASE_SERVICE_KEY — Supabase service_role key (Project Settings →
                             API → service_role). Bypasses RLS — server-
                             side only, same rule as every other worker.

   Deliberately NOT token-gated like admin-relay-worker.js — called from
   the main app by every regular user, not a private admin action.

   v205 change — "never let the pool dry up": the original design (v200)
   fetched RESULTS_PER_TOPIC (12) videos once per topic and re-served the
   same 12 for 24h, then re-searched from scratch — meaning a topic's
   total available pool was permanently capped at 12 at any given time,
   and once a user had watched/skipped all 12, only the SAME 12 could
   ever come back (the "repeat" behavior v204 explicitly removed on the
   client side). This version adds real pagination on top of the existing
   cache: a topic's cache now accumulates indefinitely across multiple
   YouTube search pages instead of being capped/replaced, and a new
   `more:true` request grows it by fetching the NEXT page and appending
   (never overwriting) into youtube_topic_cache — so the client can ask
   for more whenever a topic's unseen count runs low, and the pool keeps
   genuinely growing instead of cycling the same 12 forever. Requires
   db/schema_v205_video_pagination.sql (new youtube_topic_state table,
   tracks each topic's pageToken + the original query so `more:true`
   calls don't need the client to resend it).
   ═══════════════════════════════════════════════════════════════════ */

const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
/* YouTube expanded Shorts eligibility to up to 3 minutes in late 2024 —
   200s gives a little buffer above that while still excluding ordinary
   long-form content. There is no official "isShort" API filter, so this
   duration cutoff (checked via videos.list, not search.list's looser
   videoDuration=short which only means "under 4 minutes") is the closest
   available proxy. */
const MAX_SHORT_SECONDS = 200;
/* Videos kept per single YouTube search page (not a total-pool cap
   anymore as of v205 — see MAX_CACHE_READ below for that). */
const RESULTS_PER_TOPIC = 12;
/* Upper bound on how many previously-cached videos one read can return —
   generous headroom so a topic that's been paginated many times still
   comes back in one response, without being literally unbounded. */
const MAX_CACHE_READ = 300;

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

/* v205: no freshness filter here anymore — a video fetched days ago that
   hasn't been watched yet is still perfectly good content; discarding it
   by age would undermine the whole point of accumulating a bigger pool
   over time. Freshness/re-fetch decisions now live in getVideosForTopic
   (only ever fetch page 1 when the topic has literally never been
   searched before) and growTopicPool (only ever fetch the next page on
   an explicit `more:true` request). */
async function fetchAllFromCache(env, topic) {
  const rows = await sbFetch(
    env,
    'youtube_topic_cache?topic=eq.' + encodeURIComponent(topic) +
      '&order=fetched_at.desc&limit=' + MAX_CACHE_READ
  );
  return Array.isArray(rows) ? rows : [];
}

async function getTopicState(env, topic) {
  const rows = await sbFetch(env, 'youtube_topic_state?topic=eq.' + encodeURIComponent(topic) + '&limit=1');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function saveTopicState(env, topic, query, nextPageToken, exhausted) {
  await sbFetch(env, 'youtube_topic_state?on_conflict=topic', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{
      topic,
      query,
      next_page_token: nextPageToken || null,
      exhausted: !!exhausted,
      updated_at: new Date().toISOString(),
    }]),
  });
}

/* Runs one YouTube search page (optionally continuing from pageToken)
   and returns both the qualifying (≤200s) videos and YouTube's own
   nextPageToken so the caller can decide whether more pages exist. */
async function searchYouTubePage(env, topic, query, pageToken) {
  if (!env.YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY secret is not set on this Worker');

  const searchUrl = 'https://www.googleapis.com/youtube/v3/search'
    + '?part=snippet&type=video&videoDuration=short&order=relevance'
    + '&maxResults=25&safeSearch=strict'
    + '&q=' + encodeURIComponent(query)
    + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')
    + '&key=' + env.YOUTUBE_API_KEY;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  if (!searchRes.ok) throw new Error((searchData.error && searchData.error.message) || 'YouTube search failed');

  const ids = (searchData.items || []).map((it) => it.id && it.id.videoId).filter(Boolean);
  const nextPageToken = searchData.nextPageToken || null;
  if (!ids.length) return { rows: [], nextPageToken };

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
  return { rows, nextPageToken };
}

/* Normal read path — cache-first, only ever does a real YouTube call the
   very first time a topic is seen (empty cache). Everything after that
   is grown exclusively via growTopicPool's explicit `more:true`. */
async function getVideosForTopic(env, topic, query) {
  const cached = await fetchAllFromCache(env, topic);
  if (cached.length) return { source: 'cache', videos: cached, count: cached.length };

  const q = query || topic;
  const page = await searchYouTubePage(env, topic, q, null);
  if (page.rows.length) {
    await sbFetch(env, 'youtube_topic_cache?on_conflict=topic,video_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(page.rows),
    });
  }
  await saveTopicState(env, topic, q, page.nextPageToken, !page.nextPageToken);
  return { source: 'live', videos: page.rows, count: page.rows.length };
}

/* v205: explicit "pull more" — fetches the NEXT page (continuing from
   wherever this topic's pagination last left off) and appends it to the
   cache rather than replacing anything, so the pool only ever grows.
   Deliberately a no-op (zero extra YouTube quota spent) once a topic is
   marked exhausted — a broad query running out of genuinely new results
   is rare but not impossible, and there's no point re-asking forever. */
async function growTopicPool(env, topic, query) {
  let state = await getTopicState(env, topic);

  if (state && state.exhausted) {
    const cached = await fetchAllFromCache(env, topic);
    return { source: 'exhausted', videos: cached, count: cached.length, grew: false };
  }

  /* Topic has cache but no state row yet (shouldn't normally happen once
     v205 is live, but covers a topic that was seeded before this update)
     — bootstrap state from page 1 instead of guessing a page token. */
  if (!state) {
    return getVideosForTopic(env, topic, query);
  }

  const q = state.query || query || topic;
  const page = await searchYouTubePage(env, topic, q, state.next_page_token || null);
  if (page.rows.length) {
    await sbFetch(env, 'youtube_topic_cache?on_conflict=topic,video_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(page.rows),
    });
  }
  await saveTopicState(env, topic, q, page.nextPageToken, !page.nextPageToken);

  const cached = await fetchAllFromCache(env, topic);
  return { source: 'grown', videos: cached, count: cached.length, grew: page.rows.length > 0, added: page.rows.length };
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
      const result = body.more
        ? await growTopicPool(env, topic, body.query)
        : await getVideosForTopic(env, topic, body.query);
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
