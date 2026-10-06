// v270 — admin.html's new 🔊 Audio tab, run against admin_v270.html with the Worker mocked in memory.
// Covers the owner's own path: choose voice, write text for Peak State (Hindi), save, generate, listen, finalise.
// Run: cd qa && QA_TARGET=admin_v270.html npx playwright test tests/admin-audio-v270.spec.js
const { test, expect } = require('@playwright/test');
const RELAY = 'https://clarvoyance-admin-relay.smworkassistance.workers.dev/';

test('admin Audio tab: voice, text, generate audio, listen, finalise (Worker mocked)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));

  // in-memory Worker: same action names and response shapes as workers/admin-relay-worker.js (v270)
  const DB = {
    languages: [
      { code: 'en', name: 'English', tts_lang: 'en-IN', tts_voice: null, active: true, sort: 1 },
      { code: 'hi', name: 'हिन्दी', tts_lang: 'hi-IN', tts_voice: null, active: true, sort: 2 },
    ],
    scopes: [],
    calls: [],
  };
  const find = (k, l) => DB.scopes.find(r => r.scope_key === k && r.lang === l);
  const h = (s) => 'h' + s.length + '_' + s.slice(0, 6); // stand-in hash: the real one is the Worker's fnv()
  await page.route(RELAY, async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    const p = body.payload || {};
    DB.calls.push(body.action);
    const ok = data => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
    const fail = msg => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: msg }) });
    switch (body.action) {
      case 'audio.languages.select': return ok(DB.languages);
      case 'audio.scopes.select': return ok(DB.scopes);
      case 'audio.voices': return ok([{ name: 'hi-IN-Wavenet-A', gender: 'FEMALE' }, { name: 'hi-IN-Wavenet-B', gender: 'MALE' }]);
      case 'audio.languages.upsert': {
        const L = DB.languages.find(x => x.code === p.code); if (L) Object.assign(L, p); return ok({ ok: true });
      }
      case 'audio.scopes.save': {
        const cur = find(p.scope_key, p.lang);
        const hash = h(p.text || '');
        const changed = !cur || cur.text_hash !== hash;
        const row = cur || { scope_key: p.scope_key, lang: p.lang, kind: 'instruction', audio_path: null, audio_hash: null, finalised: false };
        Object.assign(row, { text: p.text, prompt: p.prompt, text_hash: hash, speaking_rate: p.speaking_rate || 0.95 });
        if (changed) { row.finalised = false; }
        if (!cur) DB.scopes.push(row);
        return ok({ changed, finalised: row.finalised });
      }
      case 'audio.draft': return ok({ text: 'Ek gehri saans lo, aur dheere chhodo.', model: 'gemini-proxy' });
      case 'audio.generate': {
        const row = find(p.scope_key, p.lang);
        if (!row || !row.text) return fail('save the text first');
        const L = DB.languages.find(x => x.code === p.lang);
        if (!L.tts_voice) return fail('no voice set for ' + p.lang + ' (upload-only language)');
        row.audio_path = p.scope_key + '/' + p.lang + '.mp3'; row.audio_hash = row.text_hash; row.voice = L.tts_voice;
        return ok({ skipped: false, audio_path: row.audio_path, bytes: 1234 });
      }
      case 'audio.finalise': {
        const row = find(p.scope_key, p.lang);
        if (p.finalised && (!row.audio_path || row.audio_hash !== row.text_hash)) return fail('generate the audio from the current text before finalising');
        row.finalised = !!p.finalised; return ok({ finalised: !!p.finalised });
      }
      default: return fail('unexpected action in test: ' + body.action);
    }
  });

  // skip the token prompt
  await page.addInitScript(() => localStorage.setItem('clv_admin_token', 'test-token'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // open the tab the way the owner does
  await page.click('[data-p="audio"]');
  await expect(page.locator('#pane-audio')).toBeVisible();
  const peak = page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' });
  await expect(peak).toBeVisible();

  // 1. voice: load voices for Hindi and pick the female WaveNet voice
  await page.locator('#au-langs select[id="au-voice-hi"]').waitFor();
  await page.locator('button', { hasText: 'Load voices' }).nth(1).click();
  await expect(page.locator('#au-voice-hi option', { hasText: 'hi-IN-Wavenet-A' })).toBeAttached();
  await page.selectOption('#au-voice-hi', 'hi-IN-Wavenet-A');
  await page.locator('button', { hasText: 'Save voice' }).nth(1).click();
  await expect.poll(() => DB.calls).toContain('audio.languages.upsert');

  // 2. open Peak State and write the Hindi text
  await peak.locator('summary').click();
  const hiText = page.locator('#au-' + 'self_peak_state_hi' + '-text');
  await hiText.fill('Peak State mein jaane ke liye ek gehri saans lo.');
  await page.locator('#au-self_peak_state_hi-prompt').fill('chhota, shant, 2 line');
  await page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' }).locator('button', { hasText: 'Save text' }).nth(1).click();
  await expect.poll(() => DB.calls).toContain('audio.scopes.save');
  expect(find('self.peak_state', 'hi').text).toBe('Peak State mein jaane ke liye ek gehri saans lo.');
  expect(find('self.peak_state', 'hi').prompt).toBe('chhota, shant, 2 line');

  // 3. generate the audio, then listen (the preview player appears)
  await page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' }).locator('button', { hasText: 'Generate audio' }).nth(1).click();
  await expect.poll(() => DB.calls).toContain('audio.generate');
  await expect(page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' }).locator('audio').first()).toHaveAttribute('src', /charger-audio\/self\.peak_state\/hi\.mp3/);

  // 4. finalise (the button flips to Un-finalise)
  await page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' }).locator('button', { hasText: 'Finalise' }).nth(1).click();
  await expect.poll(() => find('self.peak_state', 'hi').finalised).toBe(true);

  // 5. editing the text un-finalises it again (the owner's rule, enforced on the Worker side too)
  await hiText.fill('Peak State mein jaane ke liye ek gehri saans lo, aur dheere chhodo.');
  await page.locator('#pane-audio details').filter({ hasText: 'Self: Peak State' }).locator('button', { hasText: 'Save text' }).nth(1).click();
  await expect.poll(() => find('self.peak_state', 'hi').finalised).toBe(false);

  expect(errors).toEqual([]);
});
