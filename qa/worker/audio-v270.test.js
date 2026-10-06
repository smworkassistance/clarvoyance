// v270 — scope-audio actions inside workers/admin-relay-worker.js, run against the REAL worker code.
// fetch() is replaced by an in-memory fake for Supabase REST, Supabase Storage, Google TTS and the Gemini proxy.
// Run: node qa/worker/audio-v270.test.js   (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// Load the worker as an ES module (copy to .mjs so Node treats it as ESM).
const src = path.join(__dirname, '..', '..', 'workers', 'admin-relay-worker.js');
const tmp = path.join(os.tmpdir(), 'clv-worker-v270-' + process.pid + '.mjs');
fs.copyFileSync(src, tmp);

// ── in-memory backend ──
const DB = { languages: [], scopes: [], objects: {}, calls: { tts: [], gemini: 0 }, ttsFail: null };
function reset() {
  DB.languages = [
    { code: 'en', name: 'English', tts_lang: 'en-IN', tts_voice: 'en-IN-Wavenet-A', active: true, sort: 1 },
    { code: 'hi', name: 'हिन्दी', tts_lang: 'hi-IN', tts_voice: 'hi-IN-Wavenet-A', active: true, sort: 2 },
    { code: 'xx', name: 'Upload only', tts_lang: null, tts_voice: null, active: true, sort: 9 },
  ];
  DB.scopes = []; DB.objects = {}; DB.calls = { tts: [], gemini: 0 }; DB.ttsFail = null;
}

function filterRows(rows, sp) {
  return rows.filter((r) => {
    for (const [k, v] of sp) {
      if (['select', 'order'].includes(k)) continue;
      const m = /^eq\.(.*)$/.exec(v);
      if (m && String(r[k]) !== decodeURIComponent(m[1])) return false;
    }
    return true;
  });
}

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  const method = (init.method || 'GET').toUpperCase();
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  // Supabase REST
  if (u.hostname.endsWith('supabase.co') && u.pathname.startsWith('/rest/v1/')) {
    const table = u.pathname.replace('/rest/v1/', '');
    const store = table === 'audio_languages' ? DB.languages : DB.scopes;
    if (method === 'GET') return json(filterRows(store, u.searchParams));
    const body = JSON.parse(init.body || 'null');
    if (method === 'POST') {
      const keys = table === 'audio_languages' ? ['code'] : ['scope_key', 'lang'];
      const rows = Array.isArray(body) ? body : [body];
      for (const r of rows) {
        const hit = store.find((x) => keys.every((k) => x[k] === r[k]));
        if (hit) Object.assign(hit, r); else store.push({ ...r });
      }
      return json(rows);
    }
    if (method === 'PATCH') {
      const hits = filterRows(store, u.searchParams);
      for (const h of hits) Object.assign(h, body);
      return new Response(null, { status: 204 });
    }
  }
  // Supabase Storage upload
  if (u.hostname.endsWith('supabase.co') && u.pathname.startsWith('/storage/v1/object/charger-audio/')) {
    const p = u.pathname.replace('/storage/v1/object/charger-audio/', '');
    DB.objects[p] = { type: init.headers['Content-Type'], bytes: init.body.length, upsert: init.headers['x-upsert'] };
    return json({ Key: p });
  }
  // Google TTS
  if (u.hostname === 'texttospeech.googleapis.com') {
    if (DB.ttsFail) return json({ error: { message: DB.ttsFail } }, 403);
    if (method === 'GET') return json({ voices: [{ name: 'hi-IN-Wavenet-A', ssmlGender: 'FEMALE' }, { name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' }] });
    const b = JSON.parse(init.body);
    DB.calls.tts.push({ key: init.headers['x-goog-api-key'], ...b });
    return json({ audioContent: Buffer.from('ID3fake-mp3-bytes').toString('base64') });
  }
  // Gemini proxy (draft)
  if (u.hostname.startsWith('cold-frog')) {
    DB.calls.gemini++;
    return json({ candidates: [{ content: { parts: [{ text: '{"text":"Ek chhoti si saans lo, aur dheere se chhodo."}' }] } }], usageMetadata: {} });
  }
  throw new Error('unexpected fetch in test: ' + url);
};

const ENV = { ADMIN_TOKEN: 'admin-test-token', SUPABASE_SERVICE_KEY: 'svc-test', TTS_API_KEY: 'tts-test-key' };

async function call(action, payload, env = ENV) {
  const mod = await import(pathToFileURL(tmp).href + '?t=' + Math.random());
  const req = new Request('https://worker.test/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.ADMIN_TOKEN },
    body: JSON.stringify({ action, payload }),
  });
  const res = await mod.default.fetch(req, env);
  const body = await res.json();
  return { status: res.status, data: body.data, error: body.error };
}

(async () => {
  const TEXT = 'Peak State mein jaane ke liye ek gehri saans lo.';

  reset();
  // 1. A new text is saved as NOT finalised, with its hash.
  let r = await call('audio.scopes.save', { scope_key: 'self.peak_state', lang: 'hi', kind: 'instruction', text: TEXT, prompt: 'chhota, shant tone' });
  ok(r.status === 200 && r.data.changed === true && r.data.finalised === false, 'new text saved un-finalised: ' + JSON.stringify(r));
  ok(DB.scopes[0].prompt === 'chhota, shant tone', 'owner prompt is stored with the text');

  // 2. Finalise is refused before audio exists.
  r = await call('audio.finalise', { scope_key: 'self.peak_state', lang: 'hi', finalised: true });
  ok(r.error && /generate the audio/.test(r.error), 'finalise refused without audio: ' + JSON.stringify(r));

  // 3. Generate calls TTS with the language's voice, stores the mp3 at scope/lang.mp3, marks audio current.
  r = await call('audio.generate', { scope_key: 'self.peak_state', lang: 'hi' });
  ok(r.status === 200 && r.data.skipped === false && r.data.audio_path === 'self.peak_state/hi.mp3', 'generate ok: ' + JSON.stringify(r));
  ok(DB.calls.tts.length === 1 && DB.calls.tts[0].voice.name === 'hi-IN-Wavenet-A' && DB.calls.tts[0].voice.languageCode === 'hi-IN', 'TTS called with hi-IN voice');
  ok(DB.calls.tts[0].input.text === TEXT && DB.calls.tts[0].key === 'tts-test-key', 'TTS gets the SAVED text and the key header');
  ok(DB.objects['self.peak_state/hi.mp3'] && DB.objects['self.peak_state/hi.mp3'].type === 'audio/mpeg' && DB.objects['self.peak_state/hi.mp3'].upsert === 'true', 'mp3 uploaded to charger-audio with upsert');
  ok(DB.scopes[0].audio_hash === DB.scopes[0].text_hash, 'audio_hash matches text_hash after generate');

  // 4. Generate again with unchanged text is skipped (cost control).
  r = await call('audio.generate', { scope_key: 'self.peak_state', lang: 'hi' });
  ok(r.data.skipped === true && DB.calls.tts.length === 1, 'no second TTS call when audio is current');

  // 5. Finalise works now; it flips the flag.
  r = await call('audio.finalise', { scope_key: 'self.peak_state', lang: 'hi', finalised: true });
  ok(r.status === 200 && DB.scopes[0].finalised === true && DB.scopes[0].finalised_at, 'finalise ok');

  // 6. Editing the text un-finalises and the old audio no longer matches.
  r = await call('audio.scopes.save', { scope_key: 'self.peak_state', lang: 'hi', kind: 'instruction', text: TEXT + ' Aur dheere chhodo.' });
  ok(r.data.changed === true && r.data.finalised === false && DB.scopes[0].finalised === false, 'text edit un-finalises');
  ok(DB.scopes[0].audio_hash !== DB.scopes[0].text_hash, 'stale audio is detected after an edit');
  r = await call('audio.finalise', { scope_key: 'self.peak_state', lang: 'hi', finalised: true });
  ok(r.error && /current text/.test(r.error), 'cannot finalise stale audio');

  // 7. Re-saving the same text keeps finalised state (no spurious un-finalise).
  await call('audio.generate', { scope_key: 'self.peak_state', lang: 'hi', force: true });
  await call('audio.finalise', { scope_key: 'self.peak_state', lang: 'hi', finalised: true });
  r = await call('audio.scopes.save', { scope_key: 'self.peak_state', lang: 'hi', kind: 'instruction', text: TEXT + ' Aur dheere chhodo.' });
  ok(r.data.changed === false && DB.scopes[0].finalised === true, 'same text re-saved keeps finalised');

  // 8. AI draft returns text for review and writes NOTHING to audio_scopes.
  const before = JSON.stringify(DB.scopes);
  r = await call('audio.draft', { lang: 'hi', prompt: 'Peak State ke liye 2 line, shant' });
  ok(r.status === 200 && typeof r.data.text === 'string' && r.data.text.length > 0, 'draft returns text: ' + JSON.stringify(r));
  ok(JSON.stringify(DB.scopes) === before, 'draft does not save anything');
  ok(DB.calls.gemini === 1, 'draft used the Gemini proxy once');

  // 9. Input safety: bad scope key, unknown language, over-long text.
  r = await call('audio.scopes.save', { scope_key: 'Bad Key!', lang: 'hi', text: 'x' });
  ok(r.error && /scope_key/.test(r.error), 'bad scope_key refused');
  r = await call('audio.scopes.save', { scope_key: 'goals.major', lang: 'zz', text: 'x' });
  ok(r.error && /unknown language/.test(r.error), 'unknown language refused');
  r = await call('audio.scopes.save', { scope_key: 'goals.major', lang: 'hi', text: 'a'.repeat(1600) });
  ok(r.error && /too long/.test(r.error), 'over-long text refused');

  // 10. Upload-only language has no voice: generate says so clearly, nothing is sent to TTS.
  await call('audio.scopes.save', { scope_key: 'goals.major', lang: 'xx', text: 'Upload only text' });
  const ttsBefore = DB.calls.tts.length;
  r = await call('audio.generate', { scope_key: 'goals.major', lang: 'xx' });
  ok(r.error && /no voice set/.test(r.error) && DB.calls.tts.length === ttsBefore, 'upload-only language: clear error, no TTS call');

  // 11. Missing TTS key: a clear, actionable error (no crash, no call).
  r = await call('audio.voices', { tts_lang: 'hi-IN' }, { ...ENV, TTS_API_KEY: '' });
  ok(r.error && /TTS_API_KEY secret is not set/.test(r.error), 'missing key gives an actionable error');

  // 12. Voices list returns WaveNet only.
  r = await call('audio.voices', { tts_lang: 'hi-IN' });
  ok(r.status === 200 && r.data.length === 1 && r.data[0].name === 'hi-IN-Wavenet-A', 'voices: WaveNet only');

  // 13. Google rejects the request: the error reaches the admin, scope stays un-generated.
  reset();
  await call('audio.scopes.save', { scope_key: 'self.peak_state', lang: 'hi', text: TEXT });
  DB.ttsFail = 'API key not valid. Please pass a valid API key.';
  r = await call('audio.generate', { scope_key: 'self.peak_state', lang: 'hi' });
  ok(r.error && /tts HTTP 403: API key not valid/.test(r.error) && !DB.scopes[0].audio_path, 'TTS failure surfaces, nothing half-saved');

  // 14. Languages upsert keeps the list usable.
  r = await call('audio.languages.upsert', { code: 'hi', name: 'हिन्दी', tts_lang: 'hi-IN', tts_voice: 'hi-IN-Wavenet-A', active: true, sort: 2 });
  ok(r.status === 200, 'language upsert ok');

  fs.unlinkSync(tmp);
  console.log(`\naudio-v270 worker tests: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); try { fs.unlinkSync(tmp); } catch (x) {} process.exit(1); });
