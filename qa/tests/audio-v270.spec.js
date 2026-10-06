// v270 — scope audio in the app: Peak State Listen bar, XP cap, finalised-only rule, language picker.
// Supabase reads are mocked here (the table is the source of truth on the server; RLS is covered in qa/sql).
// Run against the candidate: QA_TARGET=clarvoyance_v270.html npx playwright test qa/tests/audio-v270.spec.js
const { test, expect } = require('./harness');

const LANGS = [
  { code: 'en', name: 'English', tts_lang: 'en-IN', tts_voice: 'en-IN-Wavenet-A', active: true, sort: 1 },
  { code: 'hi', name: 'हिन्दी', tts_lang: 'hi-IN', tts_voice: 'hi-IN-Wavenet-A', active: true, sort: 2 },
];

// a tiny silent-ish payload for the mp3 request, so the <audio> element has something to load
const MP3 = Buffer.from('ID3\x03\x00\x00\x00\x00\x00\x00', 'binary');

async function mockAudio(context, { finalisedLangs = ['en'] } = {}) {
  await context.route(/supabase\.co\/rest\/v1\/audio_languages/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LANGS) }));
  await context.route(/supabase\.co\/rest\/v1\/audio_scopes/, r => {
    const url = r.request().url();
    const m = /lang=eq\.([a-z]+)/.exec(url);
    const lang = m ? m[1] : null;
    const rows = finalisedLangs.includes(lang)
      ? [{ audio_path: 'self.peak_state/' + lang + '.mp3', audio_hash: 'h1', lang }]
      : [];
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
  });
  await context.route(/supabase\.co\/storage\/v1\/object\/public\/charger-audio\//, r => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: MP3 }));
}

async function openPeakState(app, page) {
  // the way a user does it: Self tab, then the Peak State row
  await app.gotoTab({ nav: '.bnav-tab[data-tab="self"]' });
  await page.locator('[onclick="selfToggle(\x27pkstate\x27)"]').filter({ visible: true }).first().click();
}

test.describe('scope audio (v270)', () => {
  test('Peak State shows a Listen bar only once its audio is finalised, and counts listens with a cap', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: ['en'] });
    await app.boot();
    await page.evaluate(() => { localStorage.setItem('clar_lang', 'en'); localStorage.removeItem('clv_audio_listens'); });
    await openPeakState(app, page);

    const bar = page.locator('#self-body-pkstate .aud-bar');
    await expect(bar).toBeVisible({ timeout: 8000 });
    await expect(bar).toContainText('Peak State');
    // the bar sits above the practice text, not inside the timer
    const beforeTagline = await page.evaluate(() => {
      const b = document.getElementById('self-body-pkstate');
      return b.firstElementChild && b.firstElementChild.classList.contains('aud-slot');
    });
    expect(beforeTagline).toBe(true);

    // first Listen counts one listen and gives XP once
    await page.locator('#self-body-pkstate .aud-btn').click();
    await page.waitForTimeout(400);
    const count1 = await page.evaluate(() => JSON.parse(localStorage.getItem('clv_audio_listens') || '{}')['self.peak_state|en']);
    expect(count1).toBe(1);

    // replay and more taps: the cap is 5 listens per scope and language
    for (let i = 0; i < 8; i++) await page.evaluate(() => document.querySelector('#self-body-pkstate .aud-rep') && document.querySelector('#self-body-pkstate .aud-rep').click());
    await page.waitForTimeout(400);
    const capped = await page.evaluate(() => JSON.parse(localStorage.getItem('clv_audio_listens') || '{}')['self.peak_state|en']);
    expect(capped).toBe(5);

    expect(app.pageErrors).toEqual([]);
  });

  test('an unfinalised scope shows nothing (unfinished text never reaches a user)', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: [] });
    await app.boot();
    await page.evaluate(() => { localStorage.setItem('clar_lang', 'en'); });
    await openPeakState(app, page);
    await page.waitForTimeout(2000);
    await expect(page.locator('#self-body-pkstate .aud-bar')).toHaveCount(0);
    expect(app.pageErrors).toEqual([]);
  });

  test('language falls back to English when the chosen language has no finalised audio', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: ['en'] });
    await app.boot();
    await page.evaluate(() => { localStorage.setItem('clar_lang', 'hi'); });
    await openPeakState(app, page);
    // the Hindi lookup returns nothing, so the English row is used and the bar still appears
    await expect(page.locator('#self-body-pkstate .aud-bar')).toBeVisible({ timeout: 8000 });
  });

  test('Profile → Clar AI language picker lists the active languages and saves the choice', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: ['en', 'hi'] });
    await app.boot();
    await page.evaluate(() => { localStorage.setItem('clar_lang', 'en'); openProfileTab(); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.querySelector('.prof-tab-btn[data-pane="pane-clar"]'); if (b) b.click(); });
    const chips = page.locator('#aud-lang-chips .aud-lang-chip');
    await expect(chips).toHaveCount(2, { timeout: 8000 });
    await expect(chips.nth(0)).toHaveText('English');
    await expect(chips.nth(0)).toHaveClass(/on/);
    await chips.nth(1).click();
    const saved = await page.evaluate(() => localStorage.getItem('clar_lang'));
    expect(saved).toBe('hi');
    await expect(chips.nth(1)).toHaveClass(/on/);
    expect(app.pageErrors).toEqual([]);
  });
});
