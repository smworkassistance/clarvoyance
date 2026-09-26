// T-063 — the Clar Reels cron inside workers/bunny-relay-worker.js, run against its REAL code with fetch() mocked (Pexels + Bunny + Supabase in memory).
// Run: node qa/worker/reels-cron.test.js   (exit 0 = all pass)
const fs = require('fs'), path = require('path'), os = require('os');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const DB = { rows: [], bunny: {}, fetched: [], pexelsCalls: [] };
let nextId = 1, nextGuid = 1;
const pexelsVideo = (id, dur, files) => ({ id, duration: dur, url: 'https://www.pexels.com/video/x-' + id + '/', user: { name: 'Ann Photographer', url: 'https://www.pexels.com/@ann' }, video_files: files });
const PORTRAIT_HD = (n) => ({ id: n, quality: 'hd', file_type: 'video/mp4', width: 1080, height: 1920, link: 'https://videos.pexels.com/v' + n + '_hd.mp4' });
const LANDSCAPE = (n) => ({ id: n + 500, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://videos.pexels.com/v' + n + '_land.mp4' });
const TINY = (n) => ({ id: n + 900, quality: 'sd', file_type: 'video/mp4', width: 360, height: 640, link: 'https://videos.pexels.com/v' + n + '_sd.mp4' });

globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  const json = (o, status, headers) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json', ...(headers || {}) } });
  if (url.startsWith('https://api.pexels.com/v1/videos/search')) {
    DB.pexelsCalls.push({ url, auth: init.headers && init.headers.Authorization });
    return json({ videos: [pexelsVideo(101, 12, [PORTRAIT_HD(1), LANDSCAPE(1), TINY(1)]), pexelsVideo(102, 4, [PORTRAIT_HD(2)]), pexelsVideo(103, 45, [PORTRAIT_HD(3)]), pexelsVideo(104, 9, [LANDSCAPE(4)]), pexelsVideo(105, 20, [PORTRAIT_HD(5)])] });
  }
  if (url.includes('video.bunnycdn.com/library/LIB/videos/fetch')) {
    const b = JSON.parse(init.body); DB.fetched.push(b);
    const guid = 'guid-' + (nextGuid++); DB.bunny[guid] = { status: 2, width: 0, height: 0, length: 0 };
    return json({ success: true, id: guid });
  }
  let m = url.match(/video\.bunnycdn\.com\/library\/LIB\/videos\/([^/?]+)$/);
  if (m) return DB.bunny[m[1]] ? json({ guid: m[1], ...DB.bunny[m[1]] }) : json({}, 404);
  if (url.includes('/rest/v1/clar_reels')) {
    const u = new URL(url), meth = init.method || 'GET';
    if (meth === 'POST') { const b = JSON.parse(init.body); DB.rows.push({ id: nextId++, ...b }); return new Response('', { status: 201 }); }
    if (meth === 'PATCH') { const id = Number(u.searchParams.get('id').replace('eq.', '')); Object.assign(DB.rows.find(r => r.id === id), JSON.parse(init.body)); return new Response(null, { status: 204 }); }
    // GET
    let rows = DB.rows.slice();
    const st = u.searchParams.get('status'); if (st) rows = rows.filter(r => 'eq.' + r.status === st);
    const pin = u.searchParams.get('pexels_id'); if (pin && pin.startsWith('in.(')) { const ids = pin.slice(4, -1).split(',').map(Number); rows = rows.filter(r => ids.includes(Number(r.pexels_id))); }
    const range = (init.headers && init.headers.Range) ? { 'content-range': '0-0/' + DB.rows.length } : {};
    return json(rows, 200, range);
  }
  throw new Error('unexpected fetch: ' + url);
};

(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'workers', 'bunny-relay-worker.js'), 'utf8');
  const f = path.join(os.tmpdir(), 'bunny-worker-under-test.mjs'); fs.writeFileSync(f, src);
  const mod = await import('file:///' + f.replace(/\\/g, '/') + '?t=' + Date.now());
  const env = { BUNNY_LIBRARY_ID: 'LIB', BUNNY_API_KEY: 'KEY', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'svc', SUPABASE_ANON_KEY: 'anon', PEXELS_API_KEY: 'PEX' };

  // no Pexels key -> does nothing, never throws
  let r = await mod.reelsTick({ ...env, PEXELS_API_KEY: undefined });
  ok(r.skipped && /PEXELS/.test(r.skipped), 'without the key it is skipped, not an error');
  ok(DB.pexelsCalls.length === 0, 'no Pexels call without a key');

  // run 1: adds only good clips (6-30 s, portrait, tall enough), Bunny is asked to FETCH each, rows are 'processing'
  r = await mod.reelsTick(env);
  ok(DB.pexelsCalls.length === 2 && DB.pexelsCalls.every(c => c.auth === 'PEX' && /orientation=portrait/.test(c.url)), 'searches 2 themes, portrait, with the key');
  ok(r.added >= 2, 'added new clips: ' + r.added);
  const ids = DB.rows.map(x => x.pexels_id);
  ok(ids.includes(101) && ids.includes(105), 'good clips (12 s and 20 s portrait) are added');
  ok(!ids.includes(102), 'a 4 s clip is skipped (too short)');
  ok(!ids.includes(103), 'a 45 s clip is skipped (too long)');
  ok(!ids.includes(104), 'a clip with no portrait file is skipped');
  ok(DB.fetched.every(b => /_hd\.mp4$/.test(b.url) && /^reel-\d+$/.test(b.title)), 'Bunny fetches the tall HD portrait file, never the landscape/tiny one');
  ok(DB.rows.every(x => x.status === 'processing' && x.photographer === 'Ann Photographer' && /pexels\.com/.test(x.pexels_url)), 'rows start as processing with the photographer credit stored');
  ok(r.added <= 6, 'never more than 6 per run');

  // the same clips are never added twice
  const before = DB.rows.length;
  await mod.reelsTick(env);
  const dup = DB.rows.filter((x, i, a) => a.findIndex(y => y.pexels_id === x.pexels_id) !== i);
  ok(dup.length === 0, 'no clip is added twice');

  // Bunny finished transcoding -> promoted to ready with the real size; an errored one -> failed
  const g1 = DB.rows[0].bunny_guid, g2 = DB.rows[1].bunny_guid;
  DB.bunny[g1] = { status: 4, width: 1080, height: 1920, length: 12.4 };
  DB.bunny[g2] = { status: 5, width: 0, height: 0, length: 0 };
  r = await mod.reelsTick(env);
  ok(r.promoted === 1 && DB.rows[0].status === 'ready' && DB.rows[0].width === 1080 && DB.rows[0].height === 1920 && DB.rows[0].duration === 12, 'a finished clip becomes ready with its real size');
  ok(r.failed === 1 && DB.rows[1].status === 'failed', 'an errored clip becomes failed');

  // a full library adds nothing more
  DB.rows.length = 0; for (let i = 0; i < 400; i++) DB.rows.push({ id: 9000 + i, pexels_id: 70000 + i, bunny_guid: 'g' + i, status: 'ready' });
  const calls = DB.pexelsCalls.length;
  r = await mod.reelsTick(env);
  ok(r.skipped && /full/.test(r.skipped) && DB.pexelsCalls.length === calls, 'a full library (400) stops adding and spends no Pexels request');

  console.log(fail ? 'FAILED ' + fail + ' (passed ' + pass + ')' : 'ALL PASSED (' + pass + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(1); });
