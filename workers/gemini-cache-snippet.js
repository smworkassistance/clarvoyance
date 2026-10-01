/* ═══════════════════════════════════════════════════════════════════════
   gemini-cache-snippet.js  (T-089, v259) — NOT a deployable Worker by itself.
   The Gemini proxy `cold-frog-d555` source is not in this repo; this is the
   piece to merge into it so explicit prompt caching works. v259's client
   (clarvoyance_v259.html) already sends the new payload when localStorage
   clv_gemini_cache==='1'; until this is merged that flag stays OFF and chat
   behaves exactly as v258.

   CLIENT CONTRACT (what v259 sends when the flag is on):
     { _model, _cache:{key, text, ttl}, contents:[...], generationConfig }
       key  = hash of the shared prompt (same for every user + persona)
       text = the shared prompt (~10k tokens: frameworks, rules, tools, JSON format)
       the small per-user block is already inside the LAST user turn of contents
   Without _cache the old payload (system_instruction) still passes through untouched.

   WHY: measured through the live proxy (2026-10-02): the chat prompt is ~10.5k
   tokens, 97% of it identical for every user (static 10.4k vs per-user ~150 tok).
   Gemini's automatic (implicit) caching only hit 2-4 of 8 calls (random), so we
   cache explicitly: cached input is billed ~90% cheaper.
   Gemini rule: a request that uses cachedContent must NOT also send
   system_instruction, so the per-user block lives in contents (done client-side).
   ═══════════════════════════════════════════════════════════════════════ */

const GEM = 'https://generativelanguage.googleapis.com/v1beta';

/* Returns a cachedContents name for this shared prompt, creating it if needed.
   Name is remembered in Cloudflare's Cache API (no KV needed) for slightly less
   than the Gemini TTL so we never point at an expired cache. */
async function getOrCreateCache(env, model, cache) {
  const ttl = Math.min(Math.max(parseInt(cache.ttl) || 600, 300), 3600); // 5-60 min
  const mapKey = new Request('https://gcache.internal/' + model + '/' + cache.key);
  const hit = await caches.default.match(mapKey);
  if (hit) return await hit.text();
  const r = await fetch(GEM + '/cachedContents?key=' + env.GEMINI_API_KEY, {   // <- use the proxy's existing key variable name
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/' + model,
      systemInstruction: { parts: [{ text: cache.text }] },
      contents: [{ role: 'user', parts: [{ text: 'ready' }] }],
      ttl: ttl + 's',
    }),
  });
  if (!r.ok) return null;                       // caller falls back to system_instruction
  const j = await r.json();
  if (!j.name) return null;
  await caches.default.put(mapKey, new Response(j.name, { headers: { 'Cache-Control': 'max-age=' + (ttl - 60) } }));
  return j.name;
}

/* Call this where the proxy builds the generateContent body, after it has read
   `_model`. `body` is the parsed client JSON. Returns the body to send to Gemini. */
async function applyCache(env, model, body) {
  const c = body._cache;
  delete body._cache;                            // Gemini rejects unknown fields
  if (!c || !c.text || !c.key) return body;      // old-style request: untouched
  const name = await getOrCreateCache(env, model, c).catch(() => null);
  if (name) { body.cachedContent = name; return body; }
  body.system_instruction = { parts: [{ text: c.text }] };   // safe fallback: same prompt, uncached
  return body;
}
/* Merge: const model = body._model || 'gemini-2.5-flash'; delete body._model;
          body = await applyCache(env, model, body);   // then POST generateContent as today.
   Verify after deploy: response.usageMetadata.cachedContentTokenCount should be ~10k
   on the 2nd+ message (v259 exposes it as window._lastGeminiUsage in the browser). */
