// Real-network dry run of the Guides pipeline: REAL Gemini (via the existing proxy), REAL RSS feeds, REAL Wikiquote, REAL YouTube worker.
// Only Supabase is an in-memory fake (nothing is written anywhere). Costs a few paise of Gemini. Prints what would be published, for human review.
// usage: node qa/worker/live-guide-dryrun.js [starter-slug]
const fs = require('fs'), path = require('path'), os = require('os');
const realFetch = globalThis.fetch;
const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v250_guides_video.sql'), 'utf8');

// read the starter blueprints and the source allowlist straight from the SQL file, so this tests what will really be installed
function starterFromSql(slug) {
  const re = new RegExp("\\('" + slug + "', '([^']*)', '([^']*)', '([a-z_]+)', 'starter', 'public',\\s*'(\\{.*?\\})'::jsonb", 's');
  const m = sql.match(re); if (!m) throw new Error('starter not found: ' + slug);
  return { id: '99999999-9999-4999-8999-999999999999', slug, title: m[1], description: m[2], canonical_key: m[3], kind: 'starter', visibility: 'public', status: 'active', subscribers: 1, posts_per_day: 2, languages: ['en', 'hi'], blueprint: JSON.parse(m[4]) };
}
function sourcesFromSql() {
  const out = []; const re = /\('([^']+)',\s*'(https:\/\/[^']+)',\s*'\{([^}]*)\}'\)/g; let m;
  const part = sql.slice(sql.indexOf('insert into public.guide_sources'), sql.indexOf('create table if not exists public.guides'));
  while ((m = re.exec(part))) out.push({ name: m[1], url: m[2], tags: m[3].split(','), active: true });
  return out;
}
const posts = [];
globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  if (url.startsWith('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/')) {
    const table = url.split('/rest/v1/')[1].split('?')[0];
    const json = o => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } });
    if ((init.method || 'GET') === 'GET') return json(table === 'guide_sources' ? sourcesFromSql() : table === 'guide_subscriptions' ? [{ languages: ['en', 'hi'] }] : []);
    if (init.method === 'POST' && table === 'guide_posts') { posts.push(JSON.parse(init.body)); return json([]); }
    return json([]);
  }
  return realFetch(url, init);
};
(async () => {
  const slug = process.argv[2] || 'business-startups';
  const tmp = path.join(os.tmpdir(), 'arw-live-' + Date.now() + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'workers', 'admin-relay-worker.js'), tmp);
  const W = (await import('file:///' + tmp.replace(/\\/g, '/'))).default;
  const g = starterFromSql(slug);
  const t0 = Date.now();
  const r = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: 'Bearer ADM', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'guides.runNow', payload: { id: g.id, dry: true } }) }),
    { ADMIN_TOKEN: 'ADM', SUPABASE_SERVICE_KEY: 'svc' });
  // guides.runNow reads the guide from Supabase: serve it from memory too
  console.log('status', r.status, 'ms', Date.now() - t0);
  console.log(JSON.stringify(await r.json(), null, 1).slice(0, 600));
  posts.forEach(p => console.log('\n--- [' + p.lang + '] ' + p.title + '\n' + p.body + '\nwhy: ' + p.why + '\npractice: ' + JSON.stringify(p.practice) + '\nsources: ' + JSON.stringify(p.sources.map(s => s.publisher + ' ' + s.url)) + '\nvideo: ' + JSON.stringify(p.yt_video)));
  fs.unlinkSync(tmp);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
