// T-065 (B8) — Feed videos start fast: progressive MP4 FIRST (no HLS manifest, no hls.js library download), posts that are about to scroll into view are
// prefetched (buffering starts before they are visible), far-away posts are left alone, and HLS is used only when no MP4 rendition exists.
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const G = n => '0000000' + n + '-aaaa-4bbb-8ccc-dddddddddddd';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const FEED = [1, 2, 3, 4, 5, 6].map(n => ({ id: 'a' + n, user_id: '00000000-0000-4000-8000-00000000000' + n, handle: 'friend' + n, display_name: 'Friend ' + n, avatar_url: null, title: null, message: 'post ' + n, images: [], video: { guid: G(n), duration: 12 }, created_at: new Date(Date.now() - n * 3600e3).toISOString(), cheers: 0, comments: 0, i_cheered: false }));
const STUB = () => { document.addEventListener('error', e => { if (window.__blockMediaErrors && e.target instanceof HTMLMediaElement) e.stopImmediatePropagation(); }, true); /* the fake 64-byte mp4 is not a real video: swallow its decode error so only genuine 404s drive the fallback */ HTMLMediaElement.prototype.play = function () { window.__plays = (window.__plays || 0) + 1; setTimeout(() => this.dispatchEvent(new Event('playing')), 5); return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () {}; HTMLMediaElement.prototype.load = function () {}; };

async function setup(app, opts = {}) {
  const { page } = app;
  const reqs = [];
  page.on('request', r => { const u = r.url(); if (/b-cdn\.net|hls(\.min)?\.js/.test(u)) reqs.push(u); });
  await page.route(/b-cdn\.net/, r => {
    const u = r.request().url();
    if (/thumbnail\.jpg/.test(u)) return r.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    if (/play_\d+p\.mp4/.test(u)) return opts.noMp4 ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.alloc(64) });
    if (/playlist\.m3u8/.test(u)) return r.fulfill({ status: 200, contentType: 'application/vnd.apple.mpegurl', body: '#EXTM3U\n' });
    return r.fulfill({ status: 404, body: '' });
  });
  await page.route(/cdn\.jsdelivr\.net\/npm\/hls\.js|\/vendor\/hls\.min\.js/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.Hls=function(){};window.Hls.isSupported=function(){return false;};' }));
  await page.addInitScript(STUB);
  await page.addInitScript(b => { window.__blockMediaErrors = b; }, !opts.noMp4);
  await mockCommunity(page, { navV2: true, achFeed: FEED });
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
  await expect(page.locator('.soc-vin')).toHaveCount(6, { timeout: 15000 });
  await page.waitForTimeout(1200);
  return reqs;
}

test.describe('Feed videos start fast (v253)', () => {
  test('MP4 first: a video post plays from a progressive MP4 — no HLS manifest, no hls.js download', async ({ app }) => {
    const { page } = app;
    const reqs = await setup(app);
    await page.evaluate(() => document.querySelector('.soc-vin').scrollIntoView({ block: 'center' }));
    await expect.poll(() => page.evaluate(() => window.__plays || 0), { timeout: 10000 }).toBeGreaterThanOrEqual(1);
    expect(reqs.some(u => /play_\d+p\.mp4/.test(u)), 'an MP4 was requested').toBe(true);
    expect(reqs.some(u => /playlist\.m3u8/.test(u)), 'no HLS manifest').toBe(false);
    expect(reqs.some(u => /hls(\.min)?\.js/.test(u)), 'no hls.js download').toBe(false);
    // inline starts at 480p (light on mobile data)
    expect(reqs.find(u => /play_\d+p\.mp4/.test(u))).toContain('play_480p.mp4');
    expect(app.pageErrors).toEqual([]);
  });

  test('prefetch: posts within ~1.5 screens start buffering BEFORE they are visible; far posts are left alone', async ({ app }) => {
    const { page } = app;
    await setup(app);
    const st = await page.evaluate(() => {
      const box = [...document.querySelectorAll('.soc-vin')], body = document.getElementById('soc-body'), vh = body.clientHeight;
      return box.map((b, i) => { const top = b.getBoundingClientRect().top - body.getBoundingClientRect().top; const v = b.querySelector('video'); return { i, top: Math.round(top), vh, hasSrc: !!(v.getAttribute('src')), preload: v.preload, playing: !!b.classList.contains('playing') }; });
    });
    // at least one below-the-fold post (not on screen yet) is already buffering: src set + preload auto
    const belowFoldPrefetched = st.filter(x => x.top >= st[0].vh && x.hasSrc && x.preload === 'auto');
    expect(belowFoldPrefetched.length, JSON.stringify(st)).toBeGreaterThanOrEqual(1);
    // a post far below (more than ~3 screens away) has NOT been touched
    const far = st.filter(x => x.top > st[0].vh * 3);
    expect(far.length).toBeGreaterThan(0);
    expect(far.every(x => !x.hasSrc), 'far posts not prefetched: ' + JSON.stringify(far)).toBe(true);
  });

  test('HLS is only the fallback: when no MP4 rendition exists the playlist is requested', async ({ app }) => {
    const { page } = app;
    const reqs = await setup(app, { noMp4: true });
    await page.evaluate(() => document.querySelector('.soc-vin').scrollIntoView({ block: 'center' }));
    await expect.poll(() => reqs.some(u => /playlist\.m3u8/.test(u)) || reqs.some(u => /hls(\.min)?\.js/.test(u)), { timeout: 15000 }).toBe(true);
  });
});
