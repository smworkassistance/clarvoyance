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
    const lm = /lang=eq\.([a-z]+)/.exec(url);
    const km = /scope_key=eq\.([^&]+)/.exec(url);
    const lang = lm ? lm[1] : null;
    const scopeKey = km ? decodeURIComponent(km[1]) : 'self.peak_state';
    const rows = finalisedLangs.includes(lang)
      ? [{ audio_path: scopeKey + '/' + lang + '.mp3', audio_hash: 'h1', lang }]
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

  test('Goal tab: the overall instruction bar appears at the top of the real (v264) Goal UI', async ({ app, page, context }) => {
    // #v264-root starts empty in the HTML and the app replaces its content with the real goal
    // tiles (New Story / goals) -- the bar must survive that, not just a one-time boot mount
    // (the old #goal-body-major this used to target is permanently hidden by a v264 CSS rule).
    await mockAudio(context, { finalisedLangs: ['en'] });
    await app.boot();
    await page.evaluate(() => localStorage.setItem('clar_lang', 'en'));
    await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
    const bar = page.locator('#v264-root .aud-bar');
    await expect(bar).toBeVisible({ timeout: 8000 });
    // sits first, above the New Story / goal tiles
    const first = await page.evaluate(() => document.getElementById('v264-root').firstElementChild.classList.contains('aud-slot'));
    expect(first).toBe(true);
    expect(app.pageErrors).toEqual([]);
  });

  test('Non-Negotiables (on Home) shows its instruction bar when opened', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: ['en'] });
    await app.boot();
    await page.evaluate(() => localStorage.setItem('clar_lang', 'en'));
    await app.gotoTab({ nav: '.bnav-tab[data-tab="home"]' });
    await page.locator('[onclick="selfToggle(\x27nn\x27)"]').filter({ visible: true }).first().click();
    await expect(page.locator('#self-body-nn .aud-bar')).toBeVisible({ timeout: 8000 });
    expect(app.pageErrors).toEqual([]);
  });

  test('a charger container gets its own gold affirmation bar, keyed by a slugged category id', async ({ app, page, context }) => {
    await mockAudio(context, { finalisedLangs: ['en'] });
    await app.boot();
    await page.evaluate(() => localStorage.setItem('clar_lang', 'en'));
    // seed real-shaped charger data, including the exact "trailing space" id quirk this app has hit before (CLAUDE.md "Monk mode")
    await page.evaluate(() => {
      window.SHEETS_READY = true;
      window.SHEETS_DATA = window.SHEETS_DATA || {};
      window.SHEETS_DATA.charger_categories = [{ id: 'Monk ', name: 'Monk Mode', icon: '🧘', order: 1, active: 'TRUE' }];
      window.SHEETS_DATA.chargers = [{ id: 'c1', category_id: 'Monk ', name: 'Death Awareness', content: 'text', xp: 5, active: 'TRUE' }];
      bnavSwitch(document.querySelector('.bnav-tab[data-tab="chargers"]'));
    });
    // the category body is created (so the bar is already in the DOM), but like every other
    // accordion in this app it starts collapsed -- open it before asserting visible
    await page.locator('.cha-cat-row').first().click();
    const bar = page.locator('#ch-main .cha-cat-body[id^="cha-catbody-"] .aud-bar.aud-aff');
    await expect(bar).toBeVisible({ timeout: 8000 });
    const key = await page.evaluate(() => document.querySelector('#ch-main .aud-slot').getAttribute('data-key'));
    expect(key).toBe('charger.monk'); // 'Monk ' slugged the same way admin.html's auSlug() does
    await expect(bar).toContainText('Monk Mode');
    expect(app.pageErrors).toEqual([]);
  });
});
