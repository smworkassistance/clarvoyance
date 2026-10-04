// T-101 — the Gemini proxy's entitlement gate (workers/gemini-proxy-worker.js, v263), run against its REAL code.
// Supabase, Google's Gemini API and the auth endpoint are in-memory fakes; ai_usage_consume mirrors the SQL rules in
// db/schema_v263_ai_usage_gate.sql (qa/sql/ai-usage-gate.test.js proves that SQL on a real Postgres engine).
// Run: node qa/worker/gemini-proxy-gate.test.js   (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const os = require('os');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const SB = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
const SVC = 'svc-key-test';
const ADMIN = 'admin-token-test';
const U = { free: '00000000-0000-4000-8000-0000000000f1', plus: '00000000-0000-4000-8000-0000000000p1', pro: '00000000-0000-4000-8000-0000000000e1' };
const TOK = { 'tok-free': U.free, 'tok-plus': U.plus, 'tok-pro': U.pro };

const DB = {};
function reset(flagOn) {
  DB.flag = flagOn;
  DB.plans = [
    { id: 'free', product_id: 'clar', limits: { clar_chat_per_day: 8, ai_fortune_reading: false, ai_pulse_reflection: false } },
    { id: 'plus', product_id: 'clar', limits: { clar_chat_per_day: 20, ai_fortune_reading: false, ai_pulse_reflection: false } },
    { id: 'pro', product_id: 'clar', limits: { clar_chat_per_day: 60, ai_fortune_reading: true, ai_pulse_reflection: true } },
  ];
  DB.subs = [{ user_id: U.plus, product_id: 'clar', plan_id: 'plus', status: 'active', current_period_end: new Date(Date.now() + 864e5).toISOString() },
             { user_id: U.pro, product_id: 'clar', plan_id: 'pro', status: 'active', current_period_end: new Date(Date.now() + 864e5).toISOString() }];
  DB.counter = {};          // key user|feature -> count (one UTC day in this test)
  DB.gemini = 0; DB.lastGeminiBody = null; DB.rpcCalls = [];
}

globalThis.caches = { default: { match: async () => undefined, put: async () => {}, delete: async () => {} } };

globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });
  if (url.startsWith(SB + '/auth/v1/user')) {
    const tok = String((init.headers || {}).Authorization || '').replace(/^Bearer\s+/, '');
    return TOK[tok] ? json({ id: TOK[tok] }) : json({ message: 'invalid' }, 401);
  }
  if (url.startsWith(SB + '/rest/v1/feature_flags')) {
    if (DB.flag === 'unreachable') return json({ message: 'down' }, 503);   // the worker must catch this and fail open
    return json([{ enabled: DB.flag === true }]);
  }
  if (url.startsWith(SB + '/rest/v1/plans')) return json(DB.plans);
  if (url.startsWith(SB + '/rest/v1/subscriptions')) {
    const uid = new URL(url).searchParams.get('user_id').replace(/^eq\./, '');
    return json(DB.subs.filter((s) => s.user_id === uid));
  }
  if (url === SB + '/rest/v1/rpc/ai_usage_consume') {
    const b = JSON.parse(init.body); DB.rpcCalls.push(b);
    if (!b.p_limit || b.p_limit <= 0) return json(-1);
    const k = b.p_user + '|' + b.p_feature;
    const cur = DB.counter[k] || 0;
    if (cur >= b.p_limit) return json(-1);           // refused, nothing counted
    DB.counter[k] = cur + 1; return json(cur + 1);
  }
  if (url.startsWith('https://generativelanguage.googleapis.com/')) {
    DB.gemini++; DB.lastGeminiBody = JSON.parse(init.body);
    return json({ candidates: [{ content: { parts: [{ text: '{"message":"hi"}' }] } }], usageMetadata: {} });
  }
  throw new Error('unexpected fetch in test: ' + url);
};

(async () => {
  // the worker remembers the flag (60 s) and plans (5 min) in module memory, so every call loads a FRESH copy of the module
  const tmp = path.join(os.tmpdir(), 'gpw-' + Date.now() + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'workers', 'gemini-proxy-worker.js'), tmp);
  const loadW = async () => (await import('file:///' + tmp.replace(/\\/g, '/') + '?i=' + Math.random())).default;
  const env = { GEMINI_API_KEY: 'gk', SUPABASE_SERVICE_KEY: SVC, ADMIN_TOKEN: ADMIN };

  const call = async (body, token) => {
    const W = await loadW();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const r = await W.fetch(new Request('https://proxy.test/', { method: 'POST', headers, body: JSON.stringify(body) }), env);
    return { status: r.status, body: await r.json().catch(() => ({})), headers: r.headers };
  };
  const chat = { _model: 'gemini-2.5-flash', _feature: 'clar_chat', contents: [{ role: 'user', parts: [{ text: 'hi' }] }] };
  const fortune = { _model: 'gemini-2.5-flash', _feature: 'ai_fortune_reading', contents: [{ role: 'user', parts: [{ text: 'x' }] }] };

  // ── flag OFF (today's state): nothing is checked, behaviour is identical to v259 ──
  reset(false);
  let r = await call(chat);                                              // no token at all
  ok(r.status === 200 && DB.gemini === 1, 'flag OFF: an anonymous call still reaches Gemini (no change for users yet)');
  ok(DB.lastGeminiBody._feature === undefined && DB.lastGeminiBody._model === undefined, '_feature and _model are never forwarded to Gemini');
  ok(DB.rpcCalls.length === 0, 'flag OFF: nothing is counted');
  ok(r.headers.get('X-Worker-Version') === 'gem-v263-r1', 'worker version header is v263');

  // ── flag ON: the gate ──
  reset(true);
  r = await call(chat);
  ok(r.status === 401 && r.body.error.code === 'auth' && DB.gemini === 0, 'flag ON: no token -> 401, Gemini never called');
  r = await call(chat, 'garbage-token');
  ok(r.status === 401 && DB.gemini === 0, 'flag ON: a token Supabase does not recognise -> 401');

  // free member: 8 chat messages allowed, the 9th refused with a clear code
  reset(true);
  let codes = [];
  for (let i = 0; i < 9; i++) { r = await call(chat, 'tok-free'); codes.push(r.status); }
  ok(codes.slice(0, 8).every((c) => c === 200), 'free member: first 8 Clar messages go through');
  ok(codes[8] === 429 && r.body.error.code === 'limit_reached', 'free member: 9th message -> 429 limit_reached');
  ok(DB.gemini === 8, 'Gemini is called exactly 8 times (a refused message costs nothing)');
  ok(DB.rpcCalls.every((b) => b.p_feature === 'clar_chat' && b.p_user === U.free), 'counted per member under feature clar_chat');
  ok(DB.rpcCalls[0].p_limit === 8, 'free limit comes from the plans table (8)');

  // plus: 20 a day
  reset(true);
  r = await call(chat, 'tok-plus');
  ok(DB.rpcCalls[0].p_limit === 20 && r.status === 200, 'plus member: limit read from the plan (20)');

  // plan-only features
  reset(true);
  r = await call(fortune, 'tok-free');
  ok(r.status === 402 && r.body.error.code === 'plan_locked' && DB.gemini === 0, 'free member: Fortune AI reading refused (402), Gemini never called');
  r = await call(fortune, 'tok-plus');
  ok(r.status === 402, 'plus member: Fortune AI reading still refused (Pro only)');
  r = await call(fortune, 'tok-pro');
  ok(r.status === 200 && DB.gemini === 1, 'pro member: Fortune AI reading allowed');
  ok(DB.rpcCalls.length === 0, 'plan-only features are not counted as chat messages');

  // untagged calls (video topics, desires, summaries…) need a real session but are not counted
  reset(true);
  r = await call({ _model: 'gemini-2.5-flash', contents: [] }, 'tok-free');
  ok(r.status === 200 && DB.rpcCalls.length === 0, 'an untagged call with a valid session goes through uncounted');
  r = await call({ _model: 'gemini-2.5-flash', contents: [] });
  ok(r.status === 401, 'an untagged call with no session is still refused when enforcement is ON');

  // a cancelled plan falls back to free on the next call (no live subscription row)
  reset(true);
  DB.subs = DB.subs.map((s) => ({ ...s, current_period_end: new Date(Date.now() - 864e5).toISOString() }));
  r = await call(fortune, 'tok-pro');
  ok(r.status === 402, 'an expired Pro period falls back to free: Fortune refused');

  // trusted server callers (admin relay guides pipeline, admin console) skip the per-member checks
  reset(true);
  for (let i = 0; i < 10; i++) await call(chat, SVC);
  ok(DB.gemini === 10 && DB.rpcCalls.length === 0, 'service key: passes, never counted (guides pipeline is not charged to a member)');
  reset(true);
  r = await call(fortune, ADMIN);
  ok(r.status === 200 && DB.gemini === 1, 'admin token: admin console Consultant/Sandbox pass');

  // a Supabase outage while reading the flag must not take chat down (fail open, documented)
  reset('unreachable');
  r = await call(chat);
  ok(r.status === 200 && DB.gemini === 1, 'flag unreadable: enforcement stays off for that request (chat keeps working)');

  // CORS: the browser is allowed to send the session header
  const W = await loadW();
  const opt = await W.fetch(new Request('https://proxy.test/', { method: 'OPTIONS' }), env);
  ok(/Authorization/.test(opt.headers.get('Access-Control-Allow-Headers') || ''), 'CORS preflight allows the Authorization header');

  console.log(`gemini-proxy-gate.test: ${pass} passed, ${fail} failed`);
  try { fs.unlinkSync(tmp); } catch (e) { /* temp copy only */ }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
