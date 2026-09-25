// T-051 — the Guides pipeline inside workers/admin-relay-worker.js, run against its REAL code with fetch() mocked:
// REAL recorded RSS (Inc42, James Clear) and REAL Wikiquote wikitext (Sun Tzu) as fixtures; Supabase + Gemini + YouTube are in-memory fakes.
// Run: node qa/worker/guides-pipeline.test.js   (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const os = require('os');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const FX = f => fs.readFileSync(path.join(__dirname, '..', 'fixtures', f), 'utf8');

// ── in-memory Supabase ──
const DB = {};
function reset() {
  DB.guides = []; DB.guide_posts = []; DB.guide_subscriptions = []; DB.calls = { gemini: [], patches: [], yt: 0 };
  DB.guide_sources = [
    { name: 'Inc42', url: 'https://inc42.com/feed/', tags: ['startup', 'business', 'india'], active: true },
    { name: 'James Clear', url: 'https://jamesclear.com/feed', tags: ['habits', 'growth', 'wisdom'], active: true },
  ];
  DB.mode = { verifier: 'ok', gen: 'ok', scope: 'ok', ytFail: false, wqFail: false };
}
const GEN_SYS = 'You write ONE short post', VER_SYS = 'strict fact-and-safety checker', SCOPE_SYS = 'review a proposed "guide"', TR_SYS = 'Translate the JSON values';

function geminiReply(sys, user) {
  const u = JSON.parse(user);
  if (sys.includes(GEN_SYS)) {
    DB.calls.gemini.push('gen');
    if (DB.mode.gen === 'nocite') return { title: 'Idea', body: 'Some words that are long enough to pass the length check for sure.', used: [], practice: { type: 'writing', prompt: 'Write', seconds: 60 } };
    const n = u.SOURCES.length ? 1 : 0;
    return { title: 'A small idea: ' + u.SOURCES[0].title.slice(0, 40), body: 'In your own words, this is a short, warm idea drawn from the source, told simply so it can be used today without any pressure or promise.', why: 'Because it supports ' + (u.GUIDE.intention || 'your growth'), used: [1], practice: { type: 'affirmation', prompt: 'Say one kind sentence to yourself.', seconds: 45 } };
  }
  if (sys.includes(VER_SYS)) { DB.calls.gemini.push('verify'); return DB.mode.verifier === 'ok' ? { supported: true, safe: true, on_philosophy: true, issues: [] } : { supported: false, safe: true, issues: ['claim not in sources'] }; }
  if (sys.includes(SCOPE_SYS)) { DB.calls.gemini.push('scope'); return DB.mode.scope === 'ok' ? { ok: true, category: 'personal growth', reason: '', sensitive: false, has_personal_details: false, canonical_key: 'x_topic' } : { ok: false, category: 'politics', reason: 'Guides about politics are not a fit for Clar.', sensitive: false, has_personal_details: false, canonical_key: 'politics' }; }
  if (sys.includes(TR_SYS)) { DB.calls.gemini.push('translate'); return { title: 'HI ' + u.title, body: 'HI ' + u.body, why: 'HI ' + u.why, practice_prompt: 'HI ' + u.practice_prompt }; }
  throw new Error('unexpected gemini prompt');
}

globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });
  if (url.startsWith('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/')) {
    const rest = url.slice('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/'.length);
    const table = rest.split('?')[0], qs = new URLSearchParams(rest.split('?')[1] || '');
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    if (method === 'GET') {
      let rows = (DB[table] || []).slice();
      for (const [k, v] of qs) {
        if (k === 'select' || k === 'order' || k === 'limit') continue;
        const m = v.match(/^eq\.(.*)$/); if (m) rows = rows.filter(r => String(r[k]) === m[1]);
        const lte = v.match(/^lte\.(.*)$/); if (lte) rows = rows.filter(r => r[k] && r[k] <= decodeURIComponent(lte[1]));
      }
      if (qs.get('limit')) rows = rows.slice(0, +qs.get('limit'));
      return json(rows);
    }
    if (method === 'POST') {
      if (table === 'guide_posts') {
        if (DB.mode.insertFail) return json({ message: 'boom' }, 500);
        const dup = DB.guide_posts.some(p => p.guide_id === body.guide_id && p.lang === body.lang && p.dedupe_key === body.dedupe_key);
        if (!dup) DB.guide_posts.push({ id: DB.guide_posts.length + 1, created_at: new Date().toISOString(), ...body });
        return json([]);
      }
      return json([body]);
    }
    if (method === 'PATCH') {
      const id = (qs.get('id') || '').replace('eq.', '');
      const g = DB[table].find(r => String(r.id) === id);
      if (g) Object.assign(g, body);
      DB.calls.patches.push({ table, id, body });
      return json(g ? [g] : []);
    }
    if (method === 'DELETE') return json([]);
  }
  if (url.startsWith('https://cold-frog-d555.smworkassistance.workers.dev/')) {
    const b = JSON.parse(init.body);
    const out = geminiReply(b.systemInstruction.parts[0].text, b.contents[0].parts[0].text);
    return json({ candidates: [{ content: { parts: [{ text: JSON.stringify(out) }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 150 } });
  }
  if (url.startsWith('https://clar-youtube.smworkassistance.workers.dev/')) { DB.calls.yt++; return DB.mode.ytFail ? json({}, 500) : json({ videos: [{ video_id: 'dQw4w9WgXcQ', title: 'Building a company: startups lessons' }] }); }
  if (url === 'https://inc42.com/feed/') return new Response(FX('feed-inc42.xml'), { status: 200 });
  if (url === 'https://jamesclear.com/feed') return new Response(FX('feed-jamesclear.xml'), { status: 200 });
  if (url.startsWith('https://en.wikiquote.org/w/api.php')) return DB.mode.wqFail ? new Response('x', { status: 500 }) : new Response(FX('wikiquote-suntzu.json'), { status: 200 });
  if (url === 'https://unvwjuceuyruqdnmvxlc.supabase.co/auth/v1/user') {
    const t = (init.headers && (init.headers.Authorization || init.headers.authorization)) || '';
    if (t.includes('GOOD_OWNER')) return json({ id: 'user-owner' });
    if (t.includes('GOOD_OTHER')) return json({ id: 'user-other' });
    return json({ msg: 'bad' }, 401);
  }
  throw new Error('unmocked fetch: ' + url);
};

const STARTER = () => ({ id: '11111111-1111-4111-8111-111111111111', slug: 'business-startups', title: 'Business & Startups', canonical_key: 'business_startups', kind: 'starter', visibility: 'public', owner_id: null, status: 'active', subscribers: 1, posts_per_day: 2, languages: ['en'], sensitive: false, blueprint: { topic: 'business, startups and building a company', intention: 'help founders learn, decide and act', angles: ['lesson from a founder', 'funding basics'], tone: 'practical', avoid: ['financial advice'], source_tags: ['startup', 'business', 'funding', 'india'], wikiquote: [], youtube: ['startup founder lessons'] }, next_run_at: '2020-01-01T00:00:00Z' });

(async () => {
  const tmp = path.join(os.tmpdir(), 'arw-' + Date.now() + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'workers', 'admin-relay-worker.js'), tmp);
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  const W = mod.default;
  const env = { ADMIN_TOKEN: 'ADM', SUPABASE_SERVICE_KEY: 'svc' };
  const call = async (action, payload, token) => { const r = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: 'Bearer ' + (token || 'ADM'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) }), env); return { status: r.status, body: await r.json() }; };

  // ── auth ──
  reset();
  ok((await call('guides.tick', {}, 'nope')).status === 401, 'admin actions need the admin token');
  ok((await call('app_settings.upsert', { key: 'xp_like', num: -5 })).status === 500, 'a negative setting is refused');
  ok((await call('app_settings.upsert', { key: 'xp_like', num: 2 })).status === 200, 'a sane setting is accepted');

  // ── run a starter guide: real RSS -> generated -> verified -> published in en + hi ──
  reset(); const g = STARTER(); DB.guides.push(g);
  DB.guide_subscriptions.push({ guide_id: g.id, user_id: 'u1', languages: ['en', 'hi'] });
  let r = await call('guides.runNow', { id: g.id });
  ok(r.status === 200 && r.body.data.run.ok === true, 'happy path publishes: ' + JSON.stringify(r.body).slice(0, 200));
  ok(DB.guide_posts.length === 2 && DB.guide_posts.map(p => p.lang).sort().join() === 'en,hi', 'one post per needed language (en + hi)');
  const en = DB.guide_posts.find(p => p.lang === 'en');
  ok(en.sources.length >= 1 && en.sources.every(s => /^https:\/\//.test(s.url)), 'every post cites at least one https source');
  ok(en.yt_video && en.yt_video.id === 'dQw4w9WgXcQ', 'a YouTube pick is attached');
  ok(en.practice && ['writing', 'affirmation', 'breathing'].includes(en.practice.type) && en.practice.seconds >= 30, 'the post ends with a valid practice');
  ok(DB.calls.gemini.filter(x => x === 'verify').length >= 1, 'the verifier ran');
  ok(r.body.data.run.tokens > 0, 'token usage is reported (cost visibility)');
  ok(g.next_run_at > new Date().toISOString(), 'next run is scheduled ~12 h ahead (2 posts/day)');

  // ── the same sources are not reused: a second run must not duplicate ──
  const before = DB.guide_posts.length;
  const r2 = await call('guides.runNow', { id: g.id });
  ok(r2.body.data.run.ok === true && DB.guide_posts.length > before, 'a second run publishes a NEW post from different sources');
  const urls = DB.guide_posts.filter(p => p.lang === 'en').flatMap(p => p.sources.map(s => s.url));
  ok(new Set(urls).size === urls.length, 'no source URL is used twice');

  // ── failures never publish ──
  reset(); DB.guides.push(STARTER());
  DB.mode.verifier = 'bad';
  r = await call('guides.runNow', { id: DB.guides[0].id });
  ok(r.body.data.run.ok === false && /verifier/.test(r.body.data.run.reason) && DB.guide_posts.length === 0, 'verifier rejection => nothing published: ' + JSON.stringify(r.body.data.run));
  reset(); DB.guides.push(STARTER()); DB.mode.gen = 'nocite';
  r = await call('guides.runNow', { id: DB.guides[0].id });
  ok(r.body.data.run.ok === false && /cited source/.test(r.body.data.run.reason) && DB.guide_posts.length === 0, 'no cited source => nothing published');
  reset(); const gq = STARTER(); DB.guides.push(gq); DB.mode.ytFail = true;
  r = await call('guides.runNow', { id: gq.id });
  ok(r.body.data.run.ok === true && DB.guide_posts[0].yt_video === null, 'a YouTube failure does not block the post');
  reset(); DB.guides.push(STARTER()); DB.guide_sources = [];
  r = await call('guides.runNow', { id: DB.guides[0].id });
  ok(r.body.data.run.ok === false && /no relevant sources/.test(r.body.data.run.reason), 'no sources => honest no-op (no invented post)');

  // ── quotes: real Wikiquote wikitext ──
  reset(); const gw = STARTER(); gw.blueprint.wikiquote = ['Sun Tzu']; gw.blueprint.source_tags = []; DB.guides.push(gw);
  r = await call('guides.runNow', { id: gw.id, noVideo: true });
  ok(r.body.data.run.ok === true, 'a quote-only guide works from real Wikiquote text: ' + JSON.stringify(r.body).slice(0, 160));
  const qp = DB.guide_posts[0];
  ok(qp.sources[0].quote && qp.sources[0].quote.length >= 40 && qp.sources[0].quote.length <= 260 && /wikiquote/i.test(qp.sources[0].url), 'the quote source keeps its text, speaker page and Wikiquote link');
  ok(!/^\s*\*/.test(qp.sources[0].quote) && !/\[\[|\]\]|\{\{/.test(qp.sources[0].quote), 'wiki markup is stripped from quotes');

  // ── scope guard + scheduler ──
  reset(); DB.guides.push({ ...STARTER(), id: '22222222-2222-4222-8222-222222222222', slug: 'mine', kind: 'user', visibility: 'private', owner_id: 'user-owner', status: 'pending', subscribers: 0, canonical_key: 'mine_x' });
  DB.mode.scope = 'bad';
  let t = await call('guides.tick', {});
  ok(DB.guides[0].status === 'rejected' && /politics/.test(DB.guides[0].last_error), 'out-of-scope guide is rejected with a kind reason: ' + DB.guides[0].last_error);
  reset(); DB.guides.push({ ...STARTER(), id: '33333333-3333-4333-8333-333333333333', slug: 'mine2', kind: 'user', visibility: 'private', owner_id: 'user-owner', status: 'pending', subscribers: 1, canonical_key: 'mine2_x' });
  t = await call('guides.tick', {});
  ok(DB.guides[0].status === 'active' && t.body.data.ran.length === 1 && DB.guide_posts.length >= 1, 'tick activates a pending guide, then its first post is generated in the same tick');
  reset(); ['a', 'b', 'c'].forEach((x, i) => DB.guides.push({ ...STARTER(), id: '4444444' + i + '-4444-4444-8444-444444444444', slug: 's' + x, canonical_key: 's_' + x, subscribers: 1 }));
  DB.guides.push({ ...STARTER(), id: '55555555-5555-4555-8555-555555555555', slug: 'nobody', kind: 'user', visibility: 'public', owner_id: 'x', canonical_key: 'nobody_x', subscribers: 0 });
  t = await call('guides.tick', {});
  ok(t.body.data.ran.length === 2, 'at most 2 guides are run per tick (time/cost limit)');
  ok(!t.body.data.ran.some(x => x.slug === 'nobody'), 'a user guide nobody follows is not run (no cost for no one)');

  // ── sensitive topics carry the flag ──
  reset(); DB.guides.push({ ...STARTER(), id: '66666666-6666-4666-8666-666666666666', slug: 'sens', kind: 'user', visibility: 'private', owner_id: 'user-owner', status: 'pending', canonical_key: 'sens_x', title: 'Coping', blueprint: { topic: 'I feel hopeless and worthless lately', intention: 'feel better', angles: ['calm'], source_tags: ['peace'] } });
  await call('guides.tick', {});
  ok(DB.guides[0].sensitive === true, 'distress wording flags the guide sensitive (helpline note shown to readers)');

  // ── member kick (their own session, not the admin token) ──
  reset(); DB.guides.push({ ...STARTER(), id: '77777777-7777-4777-8777-777777777777', slug: 'own', kind: 'user', visibility: 'private', owner_id: 'user-owner', status: 'pending', subscribers: 1, canonical_key: 'own_x' });
  const gid = DB.guides[0].id;
  let k = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: 'Bearer BAD_TOKEN_BAD_TOKEN_BAD_TOKEN_BAD_TOKEN_1234', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guide.kick', guide_id: gid }) }), env);
  ok(k.status === 401, 'a bad session cannot kick');
  const tok = who => 'Bearer ' + who + '_TOKEN_TOKEN_TOKEN_TOKEN_TOKEN_TOKEN';
  k = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: tok('GOOD_OTHER'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guide.kick', guide_id: gid }) }), env);
  ok(k.status === 403, "someone else cannot activate my guide");
  await new Promise(r => setTimeout(r, 4100));
  k = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: tok('GOOD_OWNER'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guide.kick', guide_id: gid }) }), env);
  const kb = await k.json();
  ok(k.status === 200 && kb.data.status === 'active' && kb.data.first_post === true, "the owner's kick activates the guide AND produces its first post immediately: " + JSON.stringify(kb));
  k = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: tok('GOOD_OWNER'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guide.kick', guide_id: gid }) }), env);
  ok(k.status === 429, 'kicks are rate-limited');

  // ── language backfill for a subscriber choosing a new language ──
  reset(); const gl = STARTER(); DB.guides.push(gl);
  DB.guide_posts.push({ id: 1, guide_id: gl.id, lang: 'en', title: 'T', body: 'Body text here that is long enough.', why: 'w', sources: [{ url: 'https://x.test/1' }], yt_video: null, practice: { type: 'writing', prompt: 'P', seconds: 60 }, dedupe_key: 'k1', created_at: new Date().toISOString() });
  await new Promise(r => setTimeout(r, 4100));
  k = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: tok('GOOD_OWNER'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guide.kick', guide_id: gl.id, languages: ['hi', 'xx'] }) }), env);
  const lb = await k.json();
  ok(k.status === 200 && lb.data.translated === 1 && DB.guide_posts.some(p => p.lang === 'hi') && !DB.guide_posts.some(p => p.lang === 'xx'), 'a new language is backfilled from existing posts; unknown languages are ignored');

  fs.unlinkSync(tmp);
  console.log(`guides pipeline: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
