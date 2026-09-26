/**
 * bunny-relay-worker.js — v246 (T-006): lets a signed-in Community member upload a
 * short video straight to Bunny Stream WITHOUT ever seeing the Bunny API key.
 *
 * HOW IT WORKS
 *   1. The app sends  POST { action:'create', size, duration }  with the member's
 *      Supabase access token in `Authorization: Bearer <token>`.
 *   2. This Worker checks the token is a real, NON-anonymous Supabase user, applies
 *      size / length / per-day limits, creates an empty video object at Bunny, records
 *      it in `social_video_uploads` (so the database can later prove who owns which
 *      video), and returns a short-lived signed TUS upload ticket.
 *   3. The app uploads the file directly to Bunny with that ticket (resumable, works on
 *      bad mobile networks) and then saves a post that references the video's guid.
 *   The Bunny API key (AccessKey) never leaves this Worker.
 *
 * DEPLOY (owner, in the Cloudflare dashboard — same routine as the other Workers)
 *   - New Worker -> paste this file.
 *   - Settings -> Variables and Secrets (add ALL of these; after saving, click Deploy
 *     again — Cloudflare sometimes keeps the old deployment without a new secret):
 *       BUNNY_LIBRARY_ID     (plain text)  Bunny -> Stream -> your library -> Library ID
 *       BUNNY_API_KEY        (SECRET)      Bunny -> Stream -> your library -> API -> "API Key"
 *       SUPABASE_URL         (plain text)  https://unvwjuceuyruqdnmvxlc.supabase.co
 *       SUPABASE_ANON_KEY    (plain text)  the public anon key the app already uses
 *       SUPABASE_SERVICE_KEY (SECRET)      service_role key (same one the other Workers use)
 *   - Then in the app file paste this Worker's URL and the library's CDN hostname into
 *     the `CFG` block at the top of the Community script (search: replace_with_your_bunny).
 *
 * BUNNY SETTINGS (one-time): in the library's settings leave "MP4 Fallback" ON (the app
 * falls back to it if HLS fails). Nothing else is needed.
 */

const ALLOWED_ORIGINS = [
  'https://clar.co.in',
  'https://smworkassistance.github.io',
  'http://localhost:8787',         // local testing
  'https://localhost',             // v253: the Android app (Capacitor WebView) — its origin was being refused by CORS
  'capacitor://localhost'          // v253: iOS Capacitor (future)
];
const MAX_BYTES    = 100 * 1024 * 1024; // 100 MB — Bunny re-encodes, so phone clips are fine; this stops abuse
const MAX_SECONDS  = 35;                // app enforces 30 s; small slack for rounding in browsers
const MAX_PER_DAY  = 10;                // uploads per member per rolling 24 h

function cors(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(request) } });
}
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function need(env, name) {
  if (!env[name]) throw new Error(name + ' is not set on this Worker');
  return env[name];
}

/* Who is calling? Ask Supabase itself — never trust anything the browser claims. */
async function getUser(env, token) {
  const r = await fetch(need(env, 'SUPABASE_URL') + '/auth/v1/user', {
    headers: { apikey: need(env, 'SUPABASE_ANON_KEY'), Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return null;
  return r.json();
}
function sb(env, path, init = {}) {
  const key = need(env, 'SUPABASE_SERVICE_KEY');
  return fetch(need(env, 'SUPABASE_URL') + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
}

/* ═══ v253 (T-063) — CLAR REELS: instant, self-hosted stock clips ═══════════════════════════════════════════════════════════════════════
   Every 30 minutes (Cron Trigger: every 30 minutes, cron expression star-slash-30 on this Worker) it (1) marks clips Bunny has finished transcoding as 'ready', then (2) for 2 themes
   per run asks Pexels (free API, 200 requests/hour) for portrait clips and asks BUNNY to fetch each one from its URL into our library (Bunny
   "Fetch Video" — the file never passes through this Worker), recording it in clar_reels as 'processing'. The app only ever shows 'ready' clips,
   from OUR CDN, so they start instantly (YouTube cannot be re-hosted; Pexels' licence allows free use). Needs the secret PEXELS_API_KEY;
   without it the job does nothing (the app simply has no Reels). Caps: 6 new clips per run, 400 in total (Bunny storage stays ~3 GB = cents). */
const REEL_THEMES = ['sunrise', 'ocean waves', 'forest', 'mountains', 'city night lights', 'rain on window', 'running', 'yoga', 'fireplace', 'clouds',
  'desert', 'waterfall', 'starry sky', 'flowers', 'road trip', 'coffee'];
const REEL_MAX_TOTAL = 400, REEL_PER_RUN = 6, REEL_MIN_S = 6, REEL_MAX_S = 30;

async function reelsTick(env) {
  const out = { promoted: 0, failed: 0, added: 0, skipped: null };
  if (!env.PEXELS_API_KEY) { out.skipped = 'PEXELS_API_KEY is not set'; return out; }
  const lib = need(env, 'BUNNY_LIBRARY_ID'), apiKey = need(env, 'BUNNY_API_KEY');
  const bunny = (path, init = {}) => fetch('https://video.bunnycdn.com/library/' + lib + path, { ...init, headers: { AccessKey: apiKey, 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) } });

  /* 1) clips Bunny has finished (status 4) become 'ready' with their real size; errors (5/6) become 'failed' */
  const proc = await sb(env, 'clar_reels?select=id,bunny_guid&status=eq.processing&order=id.asc&limit=20');
  if (proc.ok) {
    for (const r of await proc.json()) {
      const vr = await bunny('/videos/' + encodeURIComponent(r.bunny_guid));
      if (!vr.ok) continue;
      const v = await vr.json();
      if (v.status === 4) {
        await sb(env, 'clar_reels?id=eq.' + r.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'ready', width: v.width || null, height: v.height || null, duration: Math.round(v.length || 0) || null }) });
        out.promoted++;
      } else if (v.status === 5 || v.status === 6) {
        await sb(env, 'clar_reels?id=eq.' + r.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'failed' }) });
        out.failed++;
      }
    }
  }

  /* 2) add new clips (unless the library is already full) */
  const cr = await sb(env, 'clar_reels?select=id', { headers: { Prefer: 'count=exact', Range: '0-0' } });
  const total = Number((cr.headers.get('content-range') || '').split('/')[1]) || 0;
  if (total >= REEL_MAX_TOTAL) { out.skipped = 'library full (' + total + ')'; return out; }
  const slot = Math.floor(Date.now() / (30 * 60 * 1000));
  const themes = [REEL_THEMES[slot % REEL_THEMES.length], REEL_THEMES[(slot + 1) % REEL_THEMES.length]];
  const page = 1 + (Math.floor(slot / REEL_THEMES.length) % 4); // walk deeper into each theme's results over the days
  for (const theme of themes) {
    if (out.added >= REEL_PER_RUN) break;
    const pr = await fetch('https://api.pexels.com/v1/videos/search?query=' + encodeURIComponent(theme) + '&orientation=portrait&size=medium&per_page=10&page=' + page, { headers: { Authorization: env.PEXELS_API_KEY } });
    if (!pr.ok) continue;
    const list = ((await pr.json()).videos || []).filter((v) => v.duration >= REEL_MIN_S && v.duration <= REEL_MAX_S);
    if (!list.length) continue;
    const have = await sb(env, 'clar_reels?select=pexels_id&pexels_id=in.(' + list.map((v) => v.id).join(',') + ')');
    const haveIds = new Set(have.ok ? (await have.json()).map((x) => Number(x.pexels_id)) : []);
    for (const v of list) {
      if (out.added >= REEL_PER_RUN) break;
      if (haveIds.has(v.id)) continue;
      // the best portrait rendition: tall enough for a phone (>=1280) but not a 4K monster; prefer 'hd'
      const files = (v.video_files || []).filter((f) => f.file_type === 'video/mp4' && f.height > f.width && f.height >= 1280 && f.height <= 2200).sort((a, b) => (a.quality === 'hd' ? -1 : 1) - (b.quality === 'hd' ? -1 : 1) || a.height - b.height);
      const f = files[0];
      if (!f || !f.link) continue;
      const fr = await bunny('/videos/fetch', { method: 'POST', body: JSON.stringify({ url: f.link, title: 'reel-' + v.id }) });
      if (!fr.ok) continue;
      const fj = await fr.json().catch(() => ({}));
      const guid = fj.id || fj.guid;
      if (!guid) continue;
      const ins = await sb(env, 'clar_reels', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ pexels_id: v.id, bunny_guid: guid, theme, width: f.width, height: f.height, duration: Math.round(v.duration), photographer: (v.user && v.user.name) || null, photographer_url: (v.user && v.user.url) || null, pexels_url: v.url || null, status: 'processing' }) });
      if (ins.ok) out.added++;
    }
  }
  return out;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
    if (request.method !== 'POST') return json(request, { error: 'POST only' }, 405);

    try {
      const auth = request.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (!token) return json(request, { error: 'Sign in first' }, 401);
      const user = await getUser(env, token);
      if (!user || !user.id) return json(request, { error: 'Invalid session' }, 401);
      if (user.is_anonymous) return json(request, { error: 'Sign in with Google to upload' }, 403);

      let body = {};
      try { body = await request.json(); } catch (e) {}
      if (body.action !== 'create') return json(request, { error: 'Unknown action' }, 400);

      const size = Number(body.size) || 0, duration = Number(body.duration) || 0;
      if (size <= 0 || size > MAX_BYTES) return json(request, { error: 'Video is too large (max 100 MB)' }, 413);
      if (duration <= 0 || duration > MAX_SECONDS) return json(request, { error: 'Video must be 30 seconds or shorter' }, 400);

      /* per-member daily cap, counted from our own ledger */
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const cnt = await sb(env, 'social_video_uploads?select=guid&user_id=eq.' + encodeURIComponent(user.id) + '&created_at=gte.' + encodeURIComponent(since));
      if (!cnt.ok) return json(request, { error: 'Could not check limits' }, 502);
      if ((await cnt.json()).length >= MAX_PER_DAY) return json(request, { error: 'Daily video limit reached — try again tomorrow' }, 429);

      /* 1) create the (empty) video at Bunny */
      const lib = need(env, 'BUNNY_LIBRARY_ID'), apiKey = need(env, 'BUNNY_API_KEY');
      const cr = await fetch('https://video.bunnycdn.com/library/' + lib + '/videos', {
        method: 'POST',
        headers: { AccessKey: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ title: 'clar-' + user.id.slice(0, 8) + '-' + Date.now() })
      });
      if (!cr.ok) return json(request, { error: 'Video service unavailable' }, 502);
      const created = await cr.json();
      const guid = created.guid;
      if (!guid) return json(request, { error: 'Video service returned no id' }, 502);

      /* 2) remember who owns it (the database refuses a post that points at someone else's video) */
      const led = await sb(env, 'social_video_uploads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: user.id, guid }) });
      if (!led.ok) return json(request, { error: 'Could not record upload' }, 502);

      /* 3) signed, expiring TUS ticket. Signature = sha256(libraryId + apiKey + expire + videoId) */
      const expire = Math.floor(Date.now() / 1000) + 3600;
      const signature = await sha256Hex(lib + apiKey + expire + guid);
      return json(request, {
        guid,
        endpoint: 'https://video.bunnycdn.com/tusupload',
        headers: { AuthorizationSignature: signature, AuthorizationExpire: String(expire), VideoId: guid, LibraryId: lib }
      });
    } catch (e) {
      return json(request, { error: String(e && e.message || e) }, 500);
    }
  },

  /* v253: the Cron Trigger (every 30 minutes) */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(reelsTick(env).catch(() => {}));
  }
};
export { reelsTick };
