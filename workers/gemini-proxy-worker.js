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

const VERSION = 'gem-v259-r3';
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
  'Access-Control-Allow-Headers': 'Content-Type',
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
