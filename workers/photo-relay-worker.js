/* ═══════════════════════════════════════════════════════════════════
  Clarvoyance — Photo Library Relay (Cloudflare Worker)
  Deploy as a NEW Worker (e.g. "clar-photos") — dashboard → Workers &
  Pages → Create → paste this file → Deploy.

  Required Worker secrets:
    PIXABAY_API_KEY      — free key from pixabay.com/api/docs (signup,
                            no cost, no card required).
    SUPABASE_SERVICE_KEY — Supabase service_role key (Project Settings →
                            API → service_role). Bypasses RLS — server-
                            side only, same rule as every other worker.

  Deliberately NOT token-gated like admin-relay-worker.js — called from
  the main app by every regular user, not a private admin action.

  Pixabay's terms require: (1) no permanent hotlinking of their CDN URLs
  — images must be downloaded and re-hosted on our own storage; (2) no
  systematic mass-downloading. So this Worker downloads each photo ONCE
  into a public Supabase Storage bucket (`quote-photos`) and only ever
  stores OUR OWN url in photo_library — the client never talks to
  Pixabay directly, and nothing in this app ever re-fetches a photo
  that's already been stored.

  Unlike the YouTube video pool (per-user arbitrary search, needs the
  full pagination-state machinery), background themes here are a small
  FIXED list (~18 curated aesthetic moods) — so this is deliberately
  simpler: one shared, self-topping-up pool per theme. A `theme.get`
  call reads the cache; if a theme's cache is running low, it also
  kicks off a background top-up (next Pixabay page, real pagination via
  photo_theme_state) without making the caller wait for it.
  ═══════════════════════════════════════════════════════════════════ */

const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
const BUCKET = 'quote-photos';
/* Below this many cached photos for a theme, a top-up is triggered in
   the background (not blocking the response). */
const LOW_WATER = 10;
/* Photos requested per Pixabay page/top-up. */
const PER_PAGE = 20;
/* Upper bound on how many cached photos one read returns — generous
   headroom, not a real pool cap (mirrors the YouTube worker's same
   MAX_CACHE_READ pattern). */
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

async function sbStorageUpload(env, path, bytes, contentType) {
  const res = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) { const t = await res.text(); throw new Error('Storage upload failed: ' + t); }
  return SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
}

async function fetchThemeCache(env, theme) {
  const rows = await sbFetch(env, 'photo_library?theme=eq.' + encodeURIComponent(theme) + '&order=created_at.desc&limit=' + MAX_CACHE_READ);
  return Array.isArray(rows) ? rows : [];
}

async function getThemeState(env, theme) {
  const rows = await sbFetch(env, 'photo_theme_state?theme=eq.' + encodeURIComponent(theme) + '&limit=1');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
async function saveThemeState(env, theme, nextPage, exhausted) {
  await sbFetch(env, 'photo_theme_state?on_conflict=theme', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ theme, next_page: nextPage, exhausted: !!exhausted, updated_at: new Date().toISOString() }]),
  });
}

/* Downloads and re-hosts one Pixabay search page's worth of photos.
   Downloads run in parallel (not serially) so a page of 20 completes in
   roughly the time of the slowest single download, not the sum of all
   20 — keeps the very first (synchronous) request for a brand-new theme
   reasonably fast. A single bad photo is skipped, not fatal to the page. */
async function fetchAndStorePage(env, theme, page) {
  if (!env.PIXABAY_API_KEY) throw new Error('PIXABAY_API_KEY secret is not set on this Worker');

  const url = 'https://pixabay.com/api/?key=' + env.PIXABAY_API_KEY
    + '&q=' + encodeURIComponent(theme)
    + '&image_type=photo&orientation=vertical&safesearch=true'
    + '&per_page=' + PER_PAGE + '&page=' + page;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error((data && data.error) || 'Pixabay search failed');

  const hits = data.hits || [];
  const results = await Promise.all(hits.map(async (hit) => {
    try {
      const imgUrl = hit.webformatURL || hit.largeImageURL;
      if (!imgUrl) return null;
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) return null;
      const bytes = await imgRes.arrayBuffer();
      const path = theme.replace(/[^a-z0-9]+/gi, '_') + '/' + hit.id + '.jpg';
      const publicUrl = await sbStorageUpload(env, path, bytes, 'image/jpeg');
      return { theme, source_id: String(hit.id), url: publicUrl, photographer: (hit.user || '').slice(0, 80) };
    } catch (e) { return null; }
  }));
  const rows = results.filter(Boolean);

  if (rows.length) {
    await sbFetch(env, 'photo_library?on_conflict=theme,source_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
  }
  const exhausted = hits.length < PER_PAGE;
  await saveThemeState(env, theme, page + 1, exhausted);
  return rows.length;
}

/* Normal read path — cache-first. A theme with zero cached photos does
   one real Pixabay page synchronously (so the very first request for a
   new theme isn't empty); a theme running low tops up in the background
   via ctx.waitUntil, without making the caller wait. */
async function getPhotosForTheme(env, theme, ctx) {
  const cached = await fetchThemeCache(env, theme);
  if (!cached.length) {
    await fetchAndStorePage(env, theme, 1);
    const fresh = await fetchThemeCache(env, theme);
    return { source: 'live', photos: fresh };
  }
  if (cached.length < LOW_WATER) {
    const state = await getThemeState(env, theme);
    if (!state || !state.exhausted) {
      const nextPage = state ? state.next_page : 2;
      ctx.waitUntil(fetchAndStorePage(env, theme, nextPage).catch(() => {}));
    }
  }
  return { source: 'cache', photos: cached };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'invalid JSON' }, 400); }

    const theme = String(body.theme || '').trim().toLowerCase();
    if (!theme) return json({ error: 'theme is required' }, 400);

    try {
      const result = await getPhotosForTheme(env, theme, ctx);
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
