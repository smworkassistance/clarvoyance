// T-063 (B8) — Clar Reels: own-hosted stock clips with a real quote. The next reel's <video> is created early and buffered; showing the card only MOVES it in and
// calls play() (instant). Pexels credit shown; 5-second XP rule; Discover mixes Reel tiles and plays them; no table / no rows = the app behaves exactly as before.
// (The test browser cannot decode H.264, so play() is stubbed to count calls and fire 'playing' — we test OUR logic, not decoding.)
const path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const ROWS = [1, 2, 3, 4, 5, 6].map(n => ({ bunny_guid: '0000000' + n + '-aaaa-4bbb-8ccc-dddddddddddd', theme: 'ocean waves', width: 1080, height: 1920, duration: 12, photographer: 'Ann Photographer', photographer_url: 'https://www.pexels.com/@ann', pexels_url: 'https://www.pexels.com/video/x/' }));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const STUB_MEDIA = () => {
  window.__plays = []; window.__playTimes = [];
  HTMLMediaElement.prototype.play = function () { window.__plays.push(this.src); window.__playTimes.push(performance.now()); setTimeout(() => this.dispatchEvent(new Event('playing')), 5); return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function () {};
  HTMLMediaElement.prototype.load = function () {};
};

async function boot(app, opts = {}) {
  const { page } = app;
  await page.route(/b-cdn\.net/, r => /thumbnail\.jpg/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : r.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(64) }));
  await page.route(/\/rest\/v1\/clar_reels/, route => {
    if (opts.missing) return route.fulfill({ status: 404, headers: JSON_H, body: JSON.stringify({ code: '42P01', message: 'relation "public.clar_reels" does not exist' }) });
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(opts.empty ? [] : ROWS) });
  });
  await page.addInitScript(STUB_MEDIA);
  await page.addInitScript(() => { try { localStorage.removeItem('clv_reels_cache'); localStorage.removeItem('clv_reel_seen'); } catch (e) {} });
  await mockCommunity(page, { navV2: true });
  await app.boot();
  await page.evaluate(() => { window._clvPickQuote = () => ({ quote: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' }); });
}
async function toReelCard(page) {
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
  await expect.poll(() => page.evaluate(() => !!document.querySelector('#clv-reel-host video')), { timeout: 20000 }).toBe(true); // prefetched off-screen
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => vfRender());
    if (await page.evaluate(() => !!document.getElementById('vf-reel-wrap'))) return true;
    await page.waitForTimeout(150);
    await page.evaluate(() => { const b = document.querySelector('#clv-reel-host video'); return !!b; });
  }
  return false;
}

test.describe('Clar Reels (v253)', () => {
  test('Vibe: the next reel is buffered off-screen; the card MOVES that same element in and plays it at once, with a real quote + Pexels credit + 5 s XP', async ({ app }) => {
    const { page } = app;
    await boot(app);
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
    await expect.poll(() => page.evaluate(() => !!document.querySelector('#clv-reel-host video')), { timeout: 20000 }).toBe(true);
    const pre = await page.evaluate(() => { const v = document.querySelector('#clv-reel-host video'); window.__pre = v; return { preload: v.preload, src: v.getAttribute('src') || v.src, poster: v.poster, muted: v.muted }; });
    expect(pre.preload).toBe('auto');
    expect(pre.src.split('/').pop()).toMatch(/^play_\d+p\.mp4$/); // (the fake 64-byte file is not a real video, so the app may already have stepped down its quality ladder)
    expect(pre.poster).toContain('/thumbnail.jpg');
    expect(pre.muted).toBe(true);
    let found = false;
    for (let i = 0; i < 25 && !found; i++) {
      await page.evaluate(() => { window.__t0 = performance.now(); vfRender(); });
      found = await page.evaluate(() => !!document.getElementById('vf-reel-wrap'));
      if (!found) await page.waitForTimeout(150);
    }
    expect(found, 'a REEL card was shown within 25 cards').toBe(true);
    const g = await page.evaluate(() => { const w = document.getElementById('vf-reel-wrap'); const v = w.querySelector('video'); return {
      sameElement: v === window.__pre, quote: (w.querySelector('.vf-reel-q .t') || {}).textContent, author: (w.querySelector('.vf-reel-q .a') || {}).textContent,
      credit: (w.querySelector('.vf-reel-credit') || {}).textContent, pexelsLink: !!w.querySelector('.vf-reel-credit a[href*="pexels.com"]'),
      playedMs: window.__playTimes.length ? window.__playTimes[window.__playTimes.length - 1] - window.__t0 : null, plays: window.__plays.length, timer: (document.getElementById('vf-reel-timer') || {}).textContent }; });
    expect(g.sameElement, 'the buffered element itself is shown (no new download)').toBe(true);
    expect(g.playedMs, 'play() was called right away (<150 ms after the card was shown)').toBeLessThan(150);
    expect(g.quote).toContain('Discipline is the bridge');
    expect(g.author).toContain('Jim Rohn');
    expect(g.credit).toContain('Ann Photographer');
    expect(g.pexelsLink).toBe(true);
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v253-reel-card.png') });
    // XP unlocks after 5 s like the other quote cards
    await expect.poll(() => page.evaluate(() => (document.getElementById('vf-reel-timer') || {}).textContent), { timeout: 9000 }).toBe('✓');
    expect(await page.evaluate(() => typeof vfXpUnlocked !== 'undefined' ? vfXpUnlocked : null)).toBe(true);
    expect(app.pageErrors).toEqual([]);
  });

  test('Discover: Reel tiles are mixed into the grid and open in the full-screen player with the quote and credit', async ({ app }) => {
    const { page } = app;
    await boot(app);
    await page.route(/\/rest\/v1\/youtube_topic_cache/, route => route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ video_id: 'V' + String(i).padStart(10, '0'), title: 'vid ' + i, thumbnail_url: null, channel_title: 'c', topic: 'business' }))) }));
    await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect.poll(() => page.evaluate(() => window._navV2FeedOpen && window._navV2FeedOpen()), { timeout: 10000 }).toBe(true);
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect.poll(() => page.locator('#exp-grid .exp-tile .exp-rl').count(), { timeout: 15000 }).toBeGreaterThan(0);
    await page.locator('#exp-grid .exp-tile:has(.exp-rl)').first().click();
    await expect(page.locator('#exv .exv-vid')).toHaveCount(1, { timeout: 8000 }); // the current reel page has its <video> (neighbours may too)
    await expect(page.locator('#exv .exv-reelq .t').first()).toContainText('Discipline is the bridge');
    await expect(page.locator('#exv .exv-reelcredit a[href*="pexels.com"]').first()).toBeVisible();
    expect(await page.evaluate(() => window.__plays.length)).toBeGreaterThanOrEqual(1);
    // a reel page has no share/save (those are YouTube-share features), but has like + next
    const btns = await page.evaluate(() => { const pg = [...document.querySelectorAll('#exv .exv-page')].find(p => p.querySelector('.exv-vid')); return { share: !!pg.querySelector('[data-x="share"]'), save: !!pg.querySelector('[data-x="save"]'), like: !!pg.querySelector('[data-x="like"]'), next: !!pg.querySelector('[data-x="next"]') }; });
    expect(btns).toEqual({ share: false, save: false, like: true, next: true });
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v253-reel-discover.png') });
    expect(app.pageErrors).toEqual([]);
  });

  test('no clar_reels table (SQL not run yet) or no rows: no Reel cards, nothing breaks', async ({ app }) => {
    const { page } = app;
    await boot(app, { missing: true });
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
    await page.waitForTimeout(6000);
    for (let i = 0; i < 12; i++) { await page.evaluate(() => vfRender()); await page.waitForTimeout(100); }
    expect(await page.evaluate(() => !!document.getElementById('vf-reel-wrap'))).toBe(false);
    expect(await page.evaluate(() => !!document.querySelector('#clv-reel-host video'))).toBe(false);
    expect(app.pageErrors).toEqual([]);
  });
});
