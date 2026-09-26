// v251 — Instagram-style video. Vibe: a video card is a full-screen Reel (bottom bar hidden, top bar = back · Feed | Vibe · XP, player edge to
// edge, nothing of ours on top of the YouTube player). Feed: a video post plays inline, edge to edge. Swipe right on Vibe → Feed, left → Vibe.
const fs = require('fs'), path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const VIDS = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD', 'EEEEEEEEEEE', 'FFFFFFFFFFF'];
const FAKE_YT = () => {
  window.__yt = { players: [] };
  function Player(host, opts) {
    const me = this; me.vid = opts.videoId; me.state = -1; me.t = 0; me.muted = false;
    const f = document.createElement('div'); f.className = 'fake-yt'; f.style.cssText = 'width:100%;height:100%;background:#123';
    host.replaceWith(f);
    const emit = st => { me.state = st; opts.events && opts.events.onStateChange && opts.events.onStateChange({ data: st, target: me }); };
    me.playVideo = () => { if (me.state === 1) return; setTimeout(() => emit(1), 20); };
    me.pauseVideo = () => { if (me.state !== 2) emit(2); };
    me.seekTo = () => {}; me.mute = () => { me.muted = true; }; me.unMute = () => { me.muted = false; }; me.isMuted = () => me.muted; me.setVolume = () => {};
    me.getDuration = () => 20; me.getCurrentTime = () => me.t; me.getPlayerState = () => me.state; me.destroy = () => f.remove();
    window.__yt.players.push(me);
    setTimeout(() => opts.events && opts.events.onReady && opts.events.onReady({ target: me }), 20);
  }
  window.YT = { Player, PlayerState: { PLAYING: 1, PAUSED: 2 } };
};
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function toVideoCard(app) {
  const { page } = app;
  await page.route(/clar-youtube\.smworkassistance\.workers\.dev/, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ source: 'cache', videos: VIDS.map((v, i) => ({ video_id: v, title: 'Test video ' + i, topic: 'business' })) }) });
  });
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, route => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.addInitScript(FAKE_YT);
  await page.addInitScript(() => { try { localStorage.setItem('clv_user_profile', JSON.stringify({ vision_topics: ['business'] })); localStorage.removeItem('clv_video_seen_ids'); } catch (e) {} });
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(600);
    if (await page.evaluate(() => !!document.querySelector('.vfv-slot.active'))) break;
    await page.evaluate(() => { window._vfvDebug.forceNextVideo(); vfRender(); });
  }
  await expect.poll(() => page.evaluate(() => !!document.querySelector('.vfv-slot.active')), { timeout: 5000 }).toBe(true);
}
async function swipe(page, sel, dx, dy) {
  await page.evaluate(({ sel, dx, dy }) => {
    const el = document.querySelector(sel); const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 30);
    const t0 = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    const t1 = new Touch({ identifier: 1, target: el, clientX: x + dx, clientY: y + dy });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t0], changedTouches: [t0], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t1], bubbles: true }));
  }, { sel, dx, dy });
}

test.describe('Instagram-style video (v251)', () => {
  test('Vibe video is full screen: bar hidden, player edge to edge, top bar + actions outside the player', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await toVideoCard(app);
    const g = await page.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const s = document.querySelector('.vfv-slot.active');
      return {
        vw: innerWidth, vh: innerHeight, navShown: getComputedStyle(document.getElementById('bnav')).display !== 'none',
        stage: r(s.querySelector('.vfv-stage')), top: r(s.querySelector('.vfv-top')), ui: r(s.querySelector('.vfv-ui')),
        xp: r(s.querySelector('.vfv-xp')), tabs: [...s.querySelectorAll('.vfv-tab')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')),
        layer: r(document.getElementById('vfv-layer'))
      };
    });
    expect(g.navShown).toBe(false);
    expect(g.layer.h).toBeGreaterThanOrEqual(g.vh - 1);          // whole screen, not the old small window
    expect(g.stage.w).toBeGreaterThanOrEqual(g.vw * 0.9);        // (almost) edge to edge — the full width when the phone is tall enough, a few px less on a short one
    expect(g.stage.h / g.stage.w).toBeCloseTo(16 / 9, 1);        // v253: exactly the video's own 9:16 shape -> no letterbox bars inside the player
    expect(g.xp.b).toBeLessThanOrEqual(g.stage.t + 1);           // XP pill above the player (nothing over YouTube's player)
    expect(g.ui.t).toBeGreaterThanOrEqual(g.stage.b - 1);        // actions below the player
    expect(g.ui.b).toBeLessThanOrEqual(g.vh + 1);                // …and still on screen
    expect(g.tabs).toEqual(['Feed', 'Vibe*']);
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v251-vibe-video.png') });
    expect(app.pageErrors).toEqual([]);
  });

  test('swipe right on Vibe opens Feed (video paused, bar back); swipe left on Feed returns to the same video', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await toVideoCard(app);
    const vid = await page.evaluate(() => document.querySelector('.vfv-slot.active').getAttribute('data-vid'));
    await swipe(page, '.vfv-slot.active .vfv-ui', 160, 5);
    await expect.poll(() => page.evaluate(() => window._navV2FeedOpen && window._navV2FeedOpen()), { timeout: 8000 }).toBe(true);
    const st = await page.evaluate(() => ({ full: document.body.classList.contains('vf-vid-on'), nav: getComputedStyle(document.getElementById('bnav')).display !== 'none', paused: window.__yt.players.filter(p => p.state === 1).length }));
    expect(st.full).toBe(false); expect(st.nav).toBe(true); expect(st.paused).toBe(0);
    await page.waitForTimeout(1200);
    await swipe(page, '#soc-body', -160, 5);
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('vf-vid-on')), { timeout: 8000 }).toBe(true);
    const back = await page.evaluate(() => ({ vid: document.querySelector('.vfv-slot.active') && document.querySelector('.vfv-slot.active').getAttribute('data-vid'), feed: window._navV2FeedOpen() }));
    expect(back.feed).toBe(false);
    expect(back.vid).toBe(vid);           // the same video, not a reshuffled feed
    // tapping "Feed" in the video's top bar also opens Feed
    await page.click('.vfv-slot.active .vfv-tab[data-vfv="feed"]');
    await expect.poll(() => page.evaluate(() => window._navV2FeedOpen()), { timeout: 8000 }).toBe(true);
    expect(app.pageErrors).toEqual([]);
  });

  test('a small vertical swipe is not a tab switch; a non-video card keeps the bottom bar', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
    await page.waitForTimeout(1500);
    const isVid = await page.evaluate(() => vfCurCard && vfCurCard.type === 'VIDEO');
    if (!isVid) expect(await page.evaluate(() => getComputedStyle(document.getElementById('bnav')).display !== 'none')).toBe(true);
    await swipe(page, '#vf-card-area', 40, 200);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window._navV2FeedOpen())).toBe(false);
  });

  test('Feed: a video post plays inline, edge to edge, with a sound button; tap opens Reels', async ({ app }) => {
    const { page } = app;
    const GUID = '11111111-2222-4333-8444-555555555555';
    const mp4 = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.mp4'));
    await page.route(/b-cdn\.net/, route => {
      const u = route.request().url();
      if (/thumbnail\.jpg/.test(u)) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      if (/play_\d+p\.mp4/.test(u)) return route.fulfill({ status: 200, contentType: 'video/mp4', body: mp4, headers: { 'access-control-allow-origin': '*' } });
      return route.fulfill({ status: 404, body: '' });
    });
    await mockCommunity(page, { navV2: true, achFeed: [{ id: 'a1', user_id: '00000000-0000-4000-8000-000000000002', handle: 'friend', display_name: 'Friend Person', avatar_url: null, title: null, message: 'Morning run', images: [], video: { guid: GUID, duration: 12 }, created_at: new Date().toISOString(), cheers: 3, comments: 0, i_cheered: false }] });
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect(page.locator('.soc-vin')).toHaveCount(1, { timeout: 15000 });
    const g = await page.evaluate(() => {
      const b = document.querySelector('.soc-vin').getBoundingClientRect();
      return { l: b.left, w: b.width, h: b.height, vw: innerWidth, snd: !!document.querySelector('.soc-vin .soc-vin-snd') };
    });
    expect(g.l).toBeLessThanOrEqual(1);
    expect(g.w).toBeGreaterThanOrEqual(g.vw - 1);   // edge to edge
    expect(g.h / g.w).toBeCloseTo(1.25, 1);         // Instagram 4:5
    expect(g.snd).toBe(true);
    await page.evaluate(() => document.querySelector('.soc-vin').scrollIntoView({ block: 'center' }));
    await expect.poll(() => page.evaluate(() => { const v = document.querySelector('.soc-vin video'); return !!(v && !v.paused); }), { timeout: 15000 }).toBe(true);
    // v251b: it tries sound FIRST (default); muted only if the browser refused sound
    const m0 = await page.evaluate(() => document.querySelector('.soc-vin video').muted);
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v251-feed-video.png') });
    await page.click('.soc-vin .soc-vin-snd');
    const after = await page.evaluate(() => ({ m: document.querySelector('.soc-vin video').muted, ls: localStorage.getItem('clv_vf_sound') }));
    expect(after.m).toBe(!m0);                 // the speaker button flips sound
    expect(after.ls).toBe(m0 ? '1' : '0');     // and remembers the viewer's choice
    await page.click('.soc-vin .soc-vin-tap');
    await expect(page.locator('#soc-reels.on')).toHaveCount(1, { timeout: 5000 });
    expect(await page.evaluate(() => document.querySelector('.soc-vin video').paused)).toBe(true); // inline paused behind the Reels viewer
    expect(app.pageErrors).toEqual([]);
  });
});
