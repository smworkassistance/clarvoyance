/* ═══════════════════════════════════════════════════════════════════════
   gemini-proxy-worker.js  —  replacement for Cloudflare Worker `cold-frog-d555`
   (T-089, 2026-10-02). Keeps the old contract 100%:
     POST { _model?, ...Gemini generateContent body }  ->  raw Gemini JSON, HTTP 200
   and adds:
     1. EXPLICIT PROMPT CACHING: body._cache = {key, text, ttl} -> the shared prompt is stored
        once as a Gemini cachedContent and reused (cached input ~90% cheaper). Measured live:
        Rs0.279 -> Rs0.055 per chat message (80% cut), 12/12 hits, shared across users.
        If the cache cannot be created, or a cached call fails (e.g. cache expired), the same
        request is re-sent with the plain system_instruction, so chat can never break.
     2. EMAIL ALERTS (optional, needs secrets RESEND_API_KEY + ADMIN_ALERT_EMAIL — the same two
        already used by admin-relay): caching not working, caching "works" but nothing is
        actually cached, or Gemini itself failing (bad/revoked key, billing/quota). At most one
        mail per problem type per 6 hours. Without the secrets it only console.warn()s.
     3. The Gemini key comes from the secret GEMINI_API_KEY (the old source had it hard-coded).
     4. Light hardening: model name must look like gemini-*, body-size and output-token caps.
     5. MODEL ROUTING without touching the app: env MODEL_ALIAS (JSON) swaps a model name for
        every caller at once (use it when Google retires a model); optional `_tier` (A/B/C).
     6. X-Worker-Version + X-Cache-Status response headers
        (curl -s -I -X OPTIONS <url> | grep -i x-worker  -> proves which code is live).

   DEPLOY: dashboard -> cold-frog-d555 -> Edit code -> paste this WHOLE file -> Settings ->
   Variables and Secrets: SECRET GEMINI_API_KEY (new key), optional SECRET RESEND_API_KEY and
   ADMIN_ALERT_EMAIL -> Deploy. If the first call says "API key not valid", re-save the secret
   and redeploy once (known Cloudflare quirk, see CLAUDE.md v201).
   ═══════════════════════════════════════════════════════════════════════ */

const VERSION = 'gem-v263-r1';
const GEM = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_BODY = 1_500_000;          // bytes; the biggest real request (chat) is ~60 KB
const MAX_OUT_TOKENS = 8192;         // hard ceiling on what a caller may ask for
const ALERT_COOLDOWN_H = 6;
// tier -> model when a caller sends _tier instead of _model. Overridable with env MODEL_TIERS (JSON).
const DEFAULT_TIERS = { A: 'gemini-2.5-flash', B: 'gemini-2.5-flash-lite', C: 'gemini-2.5-flash-lite' };
function parseEnvJson(v) { try { return v ? JSON.parse(v) : {}; } catch (e) { return {}; } }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',   // v263: the page now sends the member's session token
  'Access-Control-Expose-Headers': 'X-Cache-Status, X-Worker-Version',
  'X-Worker-Version': VERSION,
};
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS, ...extra } });

/* ── alerts ─────────────────────────────────────────────────────────────
   One email per `key` per ALERT_COOLDOWN_H hours, remembered in Cloudflare's Cache API
   (per data-centre, so in the worst case you get one mail per region, never a flood). */
async function alertOnce(env, key, subject, detail) {
  console.warn('[gemini-proxy] ' + subject + ' — ' + detail);
  if (!env.RESEND_API_KEY || !env.ADMIN_ALERT_EMAIL) return;
  try {
    const mark = new Request('https://alert.internal/' + encodeURIComponent(key));
    if (await caches.default.match(mark)) return;
    await caches.default.put(mark, new Response('1', { headers: { 'Cache-Control': 'max-age=' + ALERT_COOLDOWN_H * 3600 } }));
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Clar Alerts <onboarding@resend.dev>', to: [env.ADMIN_ALERT_EMAIL],
        subject: '[Clar] ' + subject,
        text: subject + '\n\n' + detail + '\n\nWorker version ' + VERSION + '. (Max one mail per problem every ' + ALERT_COOLDOWN_H + ' h.)',
      }),
    });
  } catch (e) { /* alerting must never break a chat request */ }
}

/* ── caching ──────────────────────────────────────────────────────────── */
/* Returns {name, created} or {error}. The name is remembered in the Cache API for a little less
   than the Gemini TTL so we never point at an expired cache. */
async function getOrCreateCache(env, model, cache) {
  const ttl = Math.min(Math.max(parseInt(cache.ttl) || 600, 300), 3600);
  const mapKey = new Request('https://gcache.internal/' + model + '/' + cache.key);
  const hit = await caches.default.match(mapKey);
  if (hit) return { name: await hit.text(), created: false, mapKey };
  const r = await fetch(GEM + '/cachedContents?key=' + env.GEMINI_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/' + model,
      systemInstruction: { parts: [{ text: cache.text }] },
      ttl: ttl + 's',
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.name) return { error: 'HTTP ' + r.status + ' ' + ((j.error && j.error.message) || '').slice(0, 300) };
  await caches.default.put(mapKey, new Response(j.name, { headers: { 'Cache-Control': 'max-age=' + (ttl - 60) } }));
  return { name: j.name, created: true, mapKey };
}

const withPlainPrompt = (body, text) => {           // the same request, uncached
  const b = { ...body }; delete b.cachedContent;
  b.system_instruction = { parts: [{ text }] };
  return b;
};
const callGemini = async (env, model, body) => {
  const r = await fetch(GEM + '/models/' + model + ':generateContent?key=' + env.GEMINI_API_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json().catch(() => ({ error: { message: 'Gemini returned non-JSON, HTTP ' + r.status } }));
};

/* ── v263 (T-101): who may spend Gemini money ─────────────────────────────
   Until now anyone holding this URL could call Gemini with no limit, and the daily
   limits lived only in the browser (localStorage). When the `plans_enforced` feature
   flag is ON (feature_flags table, OFF by default):
     1. the caller must send a real Supabase session token (Authorization: Bearer …),
        verified by Supabase itself — the page is never trusted for identity;
     2. the member's plan comes from `subscriptions` (no live row = free) and the
        limits from the `plans` table (pricing/plans.json seeds it);
     3. plan-only features (Fortune AI reading, Pulse reflection) are refused for other plans;
     4. Clar chat messages are counted per member per UTC day inside the database
        (ai_usage_consume, db/schema_v263_ai_usage_gate.sql), so the browser cannot reset them.
   When the flag is OFF nothing is checked and nothing changes — the state the app is in
   until the owner flips it. Trusted server-to-server callers (the admin relay's guides
   pipeline, the admin console) send the service key / admin token as the bearer and skip
   the checks. If the flag cannot be read (Supabase unreachable), enforcement stays OFF for
   that request — a deliberate trade-off so a Supabase blip never takes chat down.
   Secrets needed on this Worker before the flag is switched on: SUPABASE_SERVICE_KEY
   (and optionally ADMIN_TOKEN, the same value as the admin relay's, so admin.html's
   Consultant/Sandbox keep working). */
const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
const PAID_ONLY = ['ai_fortune_reading', 'ai_pulse_reflection'];
let _flag = { on: false, at: 0 };        // remembered for 60 s so every chat message does not re-read the flag
let _plans = { at: 0, byId: null };      // plan id -> limits, remembered for 5 min

async function sbCall(env, path, init) {
  const key = env.SUPABASE_SERVICE_KEY;
  const r = await fetch(SB_URL + '/' + path, {
    ...(init || {}),
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error('supabase HTTP ' + r.status);
  return r.json();
}
async function enforcementOn(env) {
  if (Date.now() - _flag.at < 60000) return _flag.on;
  try {
    const rows = await sbCall(env, 'rest/v1/feature_flags?select=enabled&key=eq.plans_enforced');
    _flag = { on: !!(rows[0] && rows[0].enabled), at: Date.now() };
  } catch (e) {
    console.warn('[gemini-proxy] could not read plans_enforced — enforcement off for this request: ' + e.message);
    _flag = { on: false, at: Date.now() };
  }
  return _flag.on;
}
async function plansById(env) {
  if (_plans.byId && Date.now() - _plans.at < 300000) return _plans.byId;
  const rows = await sbCall(env, 'rest/v1/plans?select=id,limits&product_id=eq.clar');
  _plans = { at: Date.now(), byId: Object.fromEntries(rows.map((r) => [r.id, r.limits || {}])) };
  return _plans.byId;
}
async function planFor(env, uid) {
  const rows = await sbCall(env, 'rest/v1/subscriptions?select=plan_id,status,current_period_end&user_id=eq.' + uid + '&product_id=eq.clar');
  const now = Date.now();
  const live = rows.find((s) => ['active', 'trialing', 'past_due'].includes(s.status) && s.current_period_end && Date.parse(s.current_period_end) > now);
  return live ? live.plan_id : 'free';
}
async function userFromToken(env, token) {
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + token } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && u.id ? u : null;
}
/* atomic per-day counter in Postgres; returns the new count, or -1 when the limit is already reached (nothing is counted then) */
async function consumeDaily(env, uid, feature, limit) {
  const n = await sbCall(env, 'rest/v1/rpc/ai_usage_consume', {
    method: 'POST', body: JSON.stringify({ p_user: uid, p_feature: feature, p_limit: limit }),
  });
  return typeof n === 'number' ? n : -1;
}
/* null = allowed; otherwise {status, code, message} to send back instead of calling Gemini */
async function entitlementRefusal(env, request, feature) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { status: 401, code: 'auth', message: 'Please sign in again to use Clar.' };
  if (token === env.SUPABASE_SERVICE_KEY || (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN)) return null; // trusted server caller
  const user = await userFromToken(env, token);
  if (!user) return { status: 401, code: 'auth', message: 'Please sign in again to use Clar.' };
  const plan = await planFor(env, user.id);
  const limits = (await plansById(env))[plan] || {};
  if (PAID_ONLY.includes(feature) && !limits[feature]) return { status: 402, code: 'plan_locked', message: 'This is part of the Pro plan.' };
  if (feature === 'clar_chat') {
    const cap = limits.clar_chat_per_day;
    if (cap === null) return null;                       // explicit null = unlimited
    const n = await consumeDaily(env, user.id, 'clar_chat', typeof cap === 'number' ? cap : 0); // missing row = 0 = refused, never unlimited
    if (n < 0) return { status: 429, code: 'limit_reached', message: "You've used today's Clar messages. They reset tomorrow." };
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const later = (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p);   // alerts never delay the reply
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: { message: 'POST only' } }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'GEMINI_API_KEY secret is not set on this Worker' } }, 500);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: { message: 'request too large' } }, 413);
    let body;
    try { body = JSON.parse(raw); } catch (e) { return json({ error: { message: 'invalid JSON' } }, 400); }

    // v263: which feature this call is for (set by the page, never forwarded to Gemini), then the entitlement check when enforcement is on
    const feature = typeof body._feature === 'string' ? body._feature : null;
    delete body._feature;
    if (await enforcementOn(env)) {
      const refusal = await entitlementRefusal(env, request, feature);
      if (refusal) return json({ error: { code: refusal.code, message: refusal.message } }, refusal.status);
    }

    const tiers = { ...DEFAULT_TIERS, ...parseEnvJson(env.MODEL_TIERS) };
    const alias = parseEnvJson(env.MODEL_ALIAS);
    let model = body._model || (body._tier && tiers[body._tier]) || 'gemini-2.5-flash-lite';
    delete body._model; delete body._tier;
    model = alias[model] || model;                 // central swap, e.g. when a model is retired
    if (!/^gemini-[a-z0-9.\-]+$/i.test(model)) return json({ error: { message: 'model not allowed' } }, 400);
    if (body.generationConfig && body.generationConfig.maxOutputTokens > MAX_OUT_TOKENS) body.generationConfig.maxOutputTokens = MAX_OUT_TOKENS;

    // ── caching ──
    const c = body._cache; delete body._cache;
    let status = 'none', plainText = null, mapKey = null;
    if (c && typeof c.text === 'string' && c.text && c.key) {
      plainText = c.text;
      let got; try { got = await getOrCreateCache(env, model, c); } catch (e) { got = { error: String(e).slice(0, 200) }; }
      if (got && got.name) {
        delete body.system_instruction; delete body.systemInstruction;      // not allowed together with cachedContent
        body.cachedContent = got.name; status = got.created ? 'created' : 'hit'; mapKey = got.mapKey;
      } else {
        body = withPlainPrompt(body, plainText); status = 'fallback';
        later(alertOnce(env, 'cache-create', 'Prompt caching is NOT working (falling back to uncached, ~5x cost)',
          'Creating the Gemini cache failed: ' + ((got && got.error) || 'unknown') + '\nChat still works, it just costs more. Model: ' + model + '.'));
      }
    }

    let data = await callGemini(env, model, body);

    // a cached call failed (cache expired / deleted / model changed): forget it and retry uncached
    if (data.error && status !== 'none' && status !== 'fallback' && plainText) {
      if (mapKey) await caches.default.delete(mapKey).catch(() => {});
      later(alertOnce(env, 'cache-call', 'A cached Gemini call failed — retried without cache',
        'Error: ' + String(data.error.message || '').slice(0, 300) + '\nModel: ' + model + '.'));
      data = await callGemini(env, model, withPlainPrompt(body, plainText));
      status = 'fallback';
    }

    // cache "used" but Gemini reports nothing cached -> we are paying full price without knowing
    const used = data.usageMetadata && data.usageMetadata.cachedContentTokenCount;
    if ((status === 'hit' || status === 'created') && !data.error && !used) {
      later(alertOnce(env, 'cache-zero', 'Prompt caching ran but nothing was actually cached',
        'The cache was applied but usageMetadata.cachedContentTokenCount is empty. Model: ' + model + '.'));
    }

    // Gemini itself failing: revoked/invalid key, billing off, quota — the cases that silently break the whole app
    if (data.error) {
      const code = data.error.code, msg = String(data.error.message || '');
      if (code === 400 && /API key/i.test(msg)) later(alertOnce(env, 'key', 'Gemini API key is INVALID or revoked', msg.slice(0, 300)));
      else if (code === 403) later(alertOnce(env, 'forbidden', 'Gemini returned 403 (key blocked, API disabled or billing issue)', msg.slice(0, 300)));
      else if (code === 429 && /billing|credit|prepay|depleted|exhaust|PerDay/i.test(msg)) later(alertOnce(env, 'quota', 'Gemini quota / credits exhausted', msg.slice(0, 300)));
    }

    // always HTTP 200, exactly like the old Worker: the page reads data.error itself
    // (rate-limit "retry in Ns" / "overloaded" handling lives in the page, not here)
    return json(data, 200, { 'X-Cache-Status': status });
  },
};
