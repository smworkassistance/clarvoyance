// v252 — Feed: no title bar (the Following · Discover · Board · Guides tray is the top); Guides is a tab; Discover = Instagram-style Explore:
// search bar, endless grid of videos from the viewer's own topics (read from the shared cache), search suggestions + account (@id) suggestions,
// a word search grid, and a full-screen player (next / back). YouTube and Supabase are mocked — no quota is spent by the test.
const path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const id = (p, i) => (p + String(i).padStart(10, '0')).slice(-11).replace(/^./, p);
const FAKE_YT = () => {
  window.__yt = { players: [], loads: [] };
  function Player(host, opts) {
    const me = this; me.vid = opts.videoId; me.state = -1; me.muted = false;
    const f = document.createElement('div'); f.className = 'fake-yt'; f.style.cssText = 'width:100%;height:100%;background:#234'; host.replaceWith(f);
    const emit = st => { me.state = st; opts.events && opts.events.onStateChange && opts.events.onStateChange({ data: st, target: me }); };
    me.playVideo = () => { me.playCalls++; setTimeout(() => { if (!me.destroyed) emit(1); }, 20); }; me.pauseVideo = () => emit(2); me.seekTo = () => {};
    me.loadVideoById = v => { me.vid = v; window.__yt.loads.push(v); setTimeout(() => emit(1), 20); };
    me.mute = () => { me.muted = true; }; me.unMute = () => { me.muted = false; }; me.isMuted = () => me.muted; me.setVolume = () => {};
    me.getPlayerState = () => me.state; me.getDuration = () => 20; me.getCurrentTime = () => 0; me.destroyed = false; me.playCalls = 0; me.destroy = () => { me.destroyed = true; f.remove(); };
    window.__yt.players.push(me);
    setTimeout(() => opts.events && opts.events.onReady && opts.events.onReady({ target: me }), 20);
  }
  window.YT = { Player, PlayerState: { PLAYING: 1 } };
};

async function setup(app) {
  const { page } = app;
  const cacheCalls = [], workerCalls = [];
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.addInitScript(FAKE_YT);
  await page.addInitScript(() => { try { localStorage.setItem('clv_user_profile', JSON.stringify({ vision_topics: ['business', 'discipline'] })); localStorage.removeItem('clv_exp_recent'); } catch (e) {} });
  await mockCommunity(page, { navV2: true });
  // shared YouTube cache (public read): 45 cached videos per requested topic
  await page.route(/\/rest\/v1\/youtube_topic_cache/, route => {
    if (route.request().method() !== 'GET') return route.fallback();
    const u = decodeURIComponent(route.request().url()); cacheCalls.push(u);
    const topics = ((u.match(/topic=in\.\(([^)]*)\)/) || [])[1] || '').split(',').map(s => s.replace(/"/g, ''));
    const rows = [];
    topics.forEach((t, ti) => { if (t.startsWith('q_')) return; for (let i = 0; i < 45; i++) rows.push({ video_id: id(String.fromCharCode(65 + ti), i), title: t + ' video ' + i, thumbnail_url: null, channel_title: 'Chan ' + ti, topic: t }); });
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(rows) });
  });
  await page.route(/clar-youtube\.smworkassistance\.workers\.dev/, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const b = JSON.parse(route.request().postData() || '{}'); workerCalls.push(b);
    const vids = Array.from({ length: 12 }, (_, i) => ({ video_id: id(b.more ? 'M' : 'Q', i + (b.more ? workerCalls.length * 20 : 0)), title: (b.query || '') + ' ' + i, topic: b.topic }));
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ source: 'live', videos: vids }) });
  });
  // account suggestions for a typed @id
  await page.route(/\/rest\/v1\/social_public_profiles/, route => {
    const u = decodeURIComponent(route.request().url());
    if (route.request().method() === 'GET' && /ilike/.test(u)) return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify([{ user_id: 'u9', handle: 'disciplined_dev', display_name: 'Dev Disciplined', avatar_url: null, is_me: false, i_follow: false, interests: {} }]) });
    return route.fallback();
  });
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
  await expect.poll(() => page.evaluate(() => window._navV2FeedOpen && window._navV2FeedOpen()), { timeout: 10000 }).toBe(true);
  return { cacheCalls, workerCalls };
}

test.describe('Feed top + Explore (v252)', () => {
  test('no "Feed" title bar; the tray (Following · Discover · Board · Guides) is at the top; Guides opens as a tab', async ({ app }) => {
    const { page } = app;
    await setup(app);
    await page.waitForTimeout(800);
    const g = await page.evaluate(() => ({
      topShown: getComputedStyle(document.getElementById('soc-top')).display !== 'none',
      tabs: [...document.querySelectorAll('#soc-tabs .soc-tab')].filter(b => getComputedStyle(b).display !== 'none').sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(b => b.textContent.trim()),
      trayTop: document.getElementById('soc-tabs').getBoundingClientRect().top,
      trayRight: Math.max(...[...document.querySelectorAll('#soc-tabs .soc-tab')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.getBoundingClientRect().right)), vw: innerWidth
    }));
    expect(g.topShown).toBe(false);
    expect(g.tabs).toEqual(['Following', 'Discover', 'Board', 'Guides']);
    expect(g.trayTop).toBeLessThan(20);
    expect(g.trayRight).toBeLessThanOrEqual(g.vw);                 // all four fit on a phone
    await page.click('#soc-tabs .soc-tab[data-tab="guides"]');
    await expect(page.locator('#soc-body .g-page')).toHaveCount(1, { timeout: 8000 });
    expect(await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="guides"]').classList.contains('on'))).toBe(true);
    expect(app.pageErrors).toEqual([]);
  });

  test('Discover: search bar + endless grid from my own topics, read from the shared cache (no quota spent)', async ({ app }) => {
    const { page } = app;
    const { cacheCalls, workerCalls } = await setup(app);
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect(page.locator('#exp-in')).toHaveCount(1, { timeout: 8000 });
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 10000 }).toBeGreaterThanOrEqual(30);
    expect(cacheCalls.some(u => /business/.test(u) && /discipline/.test(u))).toBe(true);
    expect(workerCalls.length, 'cached topics must not trigger a YouTube search').toBe(0);
    const g = await page.evaluate(() => { const t = [...document.querySelectorAll('#exp-grid .exp-tile')]; const r = t[0].getBoundingClientRect(); return { cols: new Set(t.slice(0, 9).map(x => Math.round(x.getBoundingClientRect().left))).size, w: r.width, h: r.height, tall: document.querySelectorAll('#exp-grid .exp-tile.tall').length }; });
    expect(g.cols).toBe(3);
    expect(g.tall).toBeGreaterThan(0);
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v252-explore.png') });
    // endless: scrolling to the end renders more (all 90 cached), then grows a topic once the cache is used up
    for (let i = 0; i < 8; i++) { await page.evaluate(() => { const b = document.getElementById('soc-body'); b.scrollTop = b.scrollHeight; }); await page.waitForTimeout(500); }
    await expect.poll(() => page.locator('#exp-grid .exp-tile').count(), { timeout: 10000 }).toBeGreaterThan(90);
    expect(workerCalls.filter(b => b.more).length).toBeGreaterThanOrEqual(1);
    expect(workerCalls.filter(b => b.more).length).toBeLessThanOrEqual(3); // daily grow cap
    expect(app.pageErrors).toEqual([]);
  });

  test('Discover search: tap → recent + suggested; typing → word + @id suggestions; a word opens its grid; Cancel returns', async ({ app }) => {
    const { page } = app;
    const { workerCalls } = await setup(app);
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 10000 }).toBeGreaterThan(0);
    await page.click('#exp-in');
    await expect(page.locator('#exp-wrap.searching')).toHaveCount(1);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('exp-grid')).display)).toBe('none');
    await page.fill('#exp-in', 'disc');
    await expect(page.locator('#exp-sug .exp-rowb[data-act="exp-term"]').first()).toBeVisible();
    const words = await page.$$eval('#exp-sug .exp-rowb[data-act="exp-term"]', a => a.map(b => b.getAttribute('data-t')));
    expect(words).toContain('disc'); expect(words).toContain('discipline');
    await expect(page.locator('#exp-sug .exp-rowb[data-act="exp-acc"][data-handle="disciplined_dev"]')).toHaveCount(1, { timeout: 5000 });
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v252-search.png') });
    await page.click('#exp-sug .exp-rowb[data-t="discipline"]');
    await expect(page.locator('#exp-termbar')).toContainText('discipline');
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 10000 }).toBeGreaterThan(0);
    expect(workerCalls.some(b => b.topic === 'q_discipline')).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('clv_exp_recent'))[0].t)).toBe('discipline');
    await page.click('#exp-termbar button');
    await expect(page.locator('#exp-termbar')).toBeHidden();
    // recent searches show on the next tap
    await page.click('#exp-in');
    await expect(page.locator('#exp-sug .exp-rowb[data-t="discipline"]')).toHaveCount(1);
    await page.click('.exp-cancel');
    await expect(page.locator('#exp-wrap.searching')).toHaveCount(0);
    expect(app.pageErrors).toEqual([]);
  });

  test('a tile opens the full-screen player with a 3-player pool; Next reveals an already-buffered player (no new load); back closes', async ({ app }) => {
    const { page } = app;
    await setup(app);
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 10000 }).toBeGreaterThan(3);
    await page.click('#exp-grid .exp-tile[data-i="1"]');
    await expect(page.locator('#exv')).toHaveCount(1);
    await expect(page.locator('#exv .exv-page[data-i="1"] .exv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    // pool: previous (0) + current (1) + next (2) exist, the neighbours already buffered (paused at 0:00), nothing else
    await expect.poll(() => page.evaluate(() => window.__yt.players.filter(p => !p.destroyed).length), { timeout: 5000 }).toBe(3);
    const g = await page.evaluate(() => { const s = document.querySelector('#exv .exv-page[data-i="1"] .exv-stage').getBoundingClientRect(), u = document.querySelector('#exv .exv-page[data-i="1"] .exv-ui').getBoundingClientRect(); return { w: s.width, h: s.height, vw: innerWidth, uiBelow: u.top >= s.bottom - 1, nav: getComputedStyle(document.getElementById('bnav')).display, muted: window.__yt.players[0].muted }; });
    expect(g.w).toBeGreaterThanOrEqual(g.vw * 0.9);
    expect(g.h / g.w, 'the video\'s own 9:16 shape, no letterbox').toBeCloseTo(16 / 9, 1);
    expect(g.uiBelow).toBe(true);
    expect(g.nav).toBe('none');
    expect(g.muted, 'starts with sound by default').toBe(false);
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v253-player.png') });
    const playsBefore = await page.evaluate(() => window.__yt.players.length);
    await page.click('#exv [data-x="next"]');
    await expect(page.locator('#exv .exv-page[data-i="2"] .exv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    expect(await page.evaluate(() => window.__yt.loads.length), 'no loadVideoById — the next player was already there').toBe(0);
    // the page that just became current was created BEFORE the swipe (buffered), and the pool moved on: page 3 created, page 0 destroyed
    await expect.poll(() => page.evaluate(() => window.__yt.players.filter(p => !p.destroyed).length), { timeout: 5000 }).toBe(3);
    expect(await page.evaluate(() => window.__yt.players.length)).toBeGreaterThan(playsBefore);
    await page.click('#exv .exv-page[data-i="2"] [data-x="like"]');
    expect(await page.evaluate(() => document.querySelector('#exv .exv-page[data-i="2"] .vfv-like').classList.contains('on'))).toBe(true);
    await page.click('#exv [data-x="close"]');
    await expect(page.locator('#exv')).toHaveCount(0);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('bnav')).display)).not.toBe('none');
    expect(app.pageErrors).toEqual([]);
  });

  test('a real touch swipe that STARTS ON THE VIDEO moves to the next / previous video (native scroll-snap)', async ({ app }) => {
    const { page } = app;
    await setup(app);
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 10000 }).toBeGreaterThan(3);
    await page.click('#exp-grid .exp-tile[data-i="1"]');
    await expect(page.locator('#exv .exv-page[data-i="1"] .exv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    const cdp = await page.context().newCDPSession(page);
    const swipe = async (dir) => {
      const b = await page.locator('#exv .exv-page[data-i="' + (await page.evaluate(() => [...document.querySelectorAll('#exv .exv-stage.playing')].map(e => e.closest('.exv-page').getAttribute('data-i'))[0])) + '"] .exv-stage').boundingBox();
      await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height * (dir < 0 ? 0.9 : 0.1)), yDistance: dir * Math.round(b.height * 1.05), speed: 1500, gestureSourceType: 'default' });
    };
    await swipe(-1); // finger moves up = next
    await expect(page.locator('#exv .exv-page[data-i="2"] .exv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    await swipe(+1); // finger moves down = previous
    await expect(page.locator('#exv .exv-page[data-i="1"] .exv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    expect(app.pageErrors).toEqual([]);
  });
});
