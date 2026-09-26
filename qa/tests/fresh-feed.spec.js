// T-068 (B8) — the Feed is always fresh: unseen posts first, a "You're all caught up ✦" divider, then reshuffled suggestions (videos, guides, people);
// posts become "seen" after ~1 s at >=60% visible; pull-to-refresh reloads the list (Instagram-style).
const path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const USER = { user_id: '00000000-0000-4000-8000-000000000002', handle: 'friend', display_name: 'Friend Person', avatar_url: null };
const post = (n, agoMs) => ({ id: 'a' + n, ...USER, title: null, message: 'post number ' + n, images: [], video: null, created_at: new Date(Date.now() - agoMs).toISOString(), cheers: 0, comments: 0, i_cheered: false });
const GID = '11111111-1111-4111-8111-111111111111';
const GUIDES = [{ id: GID, slug: 'business-startups', title: 'Business & Startups', description: 'Short ideas for builders', canonical_key: 'bs', kind: 'starter', visibility: 'public', owner_id: null, status: 'active', sensitive: false, subscribers: 3, posts_per_day: 2, languages: ['en'], blueprint: { topic: 'startups', source_tags: ['startup'] }, last_error: null }];
const VIDS = Array.from({ length: 12 }, (_, i) => ({ video_id: 'V' + String(i).padStart(10, '0'), title: 'vid ' + i, thumbnail_url: null, channel_title: 'c', topic: 'business' }));
const PEOPLE = [2, 3, 4].map(n => ({ user_id: '00000000-0000-4000-8000-00000000000' + n, handle: 'person' + n, display_name: 'Person ' + n, avatar_url: null, xp_week: 10, streak: 1, interests: { topics: ['business'] }, i_follow: false, is_me: false, follows_me: false }));

async function setup(app, opts = {}) {
  const { page } = app;
  const state = { achCalls: 0 };
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.addInitScript(() => { try { localStorage.setItem('clv_user_profile', JSON.stringify({ vision_topics: ['business'] })); localStorage.setItem('clv_guides_seeded', '1'); } catch (e) {} });
  if (opts.seen) await page.addInitScript(s => { try { localStorage.setItem('clv_seen_posts', JSON.stringify(s)); } catch (e) {} }, opts.seen);
  await mockCommunity(page, { navV2: true, guides: GUIDES, guideSubs: [] });
  await page.route(/\/rest\/v1\/social_achievement_feed/, route => {
    if (route.request().method() !== 'GET') return route.fallback();
    state.achCalls++;
    const rows = opts.feedFor ? opts.feedFor(state.achCalls) : opts.feed;
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(rows) });
  });
  await page.route(/\/rest\/v1\/youtube_topic_cache/, route => route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(VIDS) }));
  await page.route(/\/rest\/v1\/social_public_profiles/, route => {
    if (route.request().method() === 'GET' && /order=updated_at/.test(route.request().url())) return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(PEOPLE) });
    return route.fallback();
  });
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
  await expect.poll(() => page.locator('#soc-body > .soc-stack > .soc-card').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  return state;
}
const order = async page => { await expect.poll(() => page.evaluate(() => !!document.getElementById('soc-suggest')), { timeout: 10000 }).toBe(true); return page.evaluate(() => [...document.querySelectorAll('#soc-body > .soc-stack > *')].map(e => e.classList.contains('soc-card') ? (e.querySelector('.soc-ach-msg') || {}).textContent : e.classList.contains('soc-caught') ? 'DIVIDER:' + e.textContent : e.id === 'soc-suggest' ? 'SUGGEST' : '?')); };

test.describe('fresh feed + pull-to-refresh (v253)', () => {
  test('unseen posts come first; seen ones sink below a "You\'re all caught up" divider that is followed by suggestions', async ({ app }) => {
    const { page } = app;
    await setup(app, { feed: [post(1, 3600e3), post(2, 2 * 3600e3), post(3, 3 * 3600e3), post(4, 4 * 3600e3)], seen: ['ach:a1', 'ach:a3'] });
    const o = await order(page);
    expect(o[0]).toContain('post number 2');
    expect(o[1]).toContain('post number 4');
    expect(o[2]).toContain('DIVIDER:You’re all caught up');
    expect(o[3]).toBe('SUGGEST');
    expect(o[4]).toContain('post number 1');
    expect(o[5]).toContain('post number 3');
    // the suggestions fill in: fresh videos, a guide to follow, people
    await expect(page.locator('#soc-suggest .soc-sg-vids .exp-tile')).toHaveCount(3, { timeout: 10000 });
    await expect(page.locator('#soc-suggest [data-act="sg-follow"]')).toHaveCount(1, { timeout: 10000 });
    await expect(page.locator('#soc-suggest .soc-card[data-act="open-profile"]')).toHaveCount(2, { timeout: 10000 });
    await page.screenshot({ path: path.join(__dirname, '..', 'test-results', 'v253-fresh-feed.png') });
    expect(app.pageErrors).toEqual([]);
  });

  test('suggested videos rotate: the next visit shows different videos, and a tile opens the full-screen player', async ({ app }) => {
    const { page } = app;
    await setup(app, { feed: [post(1, 3600e3)], seen: ['ach:a1'] });
    await expect(page.locator('#soc-suggest .soc-sg-vids .exp-tile')).toHaveCount(3, { timeout: 10000 });
    const ids1 = await page.evaluate(() => [...document.querySelectorAll('#soc-suggest .soc-sg-vids img')].map(i => i.getAttribute('src')));
    // visit again (leave + come back through the tab bar)
    await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="board"]').click());
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="feed"]').click());
    await expect(page.locator('#soc-suggest .soc-sg-vids .exp-tile')).toHaveCount(3, { timeout: 10000 });
    const ids2 = await page.evaluate(() => [...document.querySelectorAll('#soc-suggest .soc-sg-vids img')].map(i => i.getAttribute('src')));
    expect(ids2.some(u => !ids1.includes(u)), 'a different set of videos on the next visit').toBe(true);
    await page.locator('#soc-suggest .soc-sg-vids .exp-tile').first().click();
    await expect(page.locator('#exv')).toHaveCount(1, { timeout: 8000 });
  });

  test('a post is remembered as seen after ~1 s at >=60% visible', async ({ app }) => {
    const { page } = app;
    await setup(app, { feed: [post(1, 3600e3), post(2, 2 * 3600e3)] });
    await page.waitForTimeout(1800);
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('clv_seen_posts') || '[]'));
    expect(seen).toContain('ach:a1');
  });

  test('a brand-new visitor (nothing seen): no "caught up" divider, but suggestions still follow the posts', async ({ app }) => {
    const { page } = app;
    await setup(app, { feed: [post(1, 3600e3), post(2, 2 * 3600e3)] });
    const o = await order(page);
    expect(o.some(x => /caught up/.test(x))).toBe(false);
    expect(o[o.length - 1]).toBe('SUGGEST');
    expect(await page.locator('.soc-caught').textContent()).toContain('Suggested for you');
  });

  test('pull down at the top reloads the Feed (new post appears at the top, spinner shows while loading)', async ({ app }) => {
    const { page } = app;
    const st = await setup(app, { feedFor: n => n <= 1 ? [post(1, 3600e3)] : [post(9, 60e3), post(1, 3600e3)] });
    expect(await page.locator('#soc-body > .soc-stack > .soc-card').count()).toBe(1);
    const callsBefore = st.achCalls;
    const cdp = await page.context().newCDPSession(page);
    const b = await page.locator('#soc-body').boundingBox();
    const x = Math.round(b.x + b.width / 2), y0 = Math.round(b.y + 60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 16; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + i * 14 }] }); await page.waitForTimeout(16); }
    expect(await page.evaluate(() => document.getElementById('soc-ptr').classList.contains('ready')), 'past the mark: indicator is ready').toBe(true);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.locator('#soc-body > .soc-stack > .soc-card').count(), { timeout: 10000 }).toBe(2);
    expect(st.achCalls).toBeGreaterThan(callsBefore);
    expect((await order(page))[0]).toContain('post number 9');
    await expect.poll(() => page.evaluate(() => document.getElementById('soc-ptr').classList.contains('spin')), { timeout: 4000 }).toBe(false);
    expect(app.pageErrors).toEqual([]);
  });

  test('a short pull (not past the mark) does nothing', async ({ app }) => {
    const { page } = app;
    const st = await setup(app, { feed: [post(1, 3600e3)] });
    await page.waitForTimeout(3500); // let the boot-time background refreshes settle first
    const callsBefore = st.achCalls;
    const cdp = await page.context().newCDPSession(page);
    const b = await page.locator('#soc-body').boundingBox();
    const x = Math.round(b.x + b.width / 2), y0 = Math.round(b.y + 60);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 4; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + i * 12 }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(1200);
    expect(st.achCalls).toBe(callsBefore);
  });

  test('pull-to-refresh works on Discover, Guides and Board too (each reloads its own data)', async ({ app }) => {
    const { page } = app;
    await setup(app, { feed: [post(1, 3600e3)] });
    const counts = { cache: 0, guides: 0, board: 0 };
    await page.route(/\/rest\/v1\/youtube_topic_cache/, route => { counts.cache++; return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(VIDS) }); });
    await page.route(/\/rest\/v1\/guides(\?|$)/, route => { if (route.request().method() === 'GET') counts.guides++; return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(GUIDES) }); });
    await page.route(/\/rest\/v1\/social_public_profiles.*on_leaderboard/, route => { counts.board++; return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(PEOPLE.map(p => ({ ...p, xp: 5, xp_week: 5, badges: [] }))) }); });
    const cdp = await page.context().newCDPSession(page);
    async function pull() {
      const b = await page.locator('#soc-body').boundingBox();
      const x = Math.round(b.x + b.width / 2), y0 = Math.round(b.y + 40);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
      for (let i = 1; i <= 16; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + i * 14 }] }); await page.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(1500);
    }
    // Discover
    await page.click('#soc-tabs .soc-tab[data-tab="find"]');
    await expect.poll(() => page.locator('#exp-grid .exp-tile:not(.sk)').count(), { timeout: 12000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    let c0 = counts.cache; await pull();
    expect(counts.cache, 'Discover reloaded its videos').toBeGreaterThan(c0);
    // Guides
    await page.click('#soc-tabs .soc-tab[data-tab="guides"]');
    await expect(page.locator('#soc-body .g-page')).toHaveCount(1, { timeout: 10000 });
    await page.waitForTimeout(1500);
    c0 = counts.guides; await pull();
    expect(counts.guides, 'Guides reloaded').toBeGreaterThan(c0);
    // Board
    await page.click('#soc-tabs .soc-tab[data-tab="board"]');
    await expect.poll(() => counts.board, { timeout: 10000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    c0 = counts.board; await pull();
    expect(counts.board, 'Board reloaded').toBeGreaterThan(c0);
    expect(app.pageErrors).toEqual([]);
  });
});
