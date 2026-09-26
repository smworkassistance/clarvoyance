// T-067 (B8) — every kind of post ends with a small date + time line (Instagram-style): relative for the last day, absolute date after.
const { test, expect } = require('./harness');
const { mockCommunity } = require('./community-mock');

const ago = ms => new Date(Date.now() - ms).toISOString();
const GID = '11111111-1111-4111-8111-111111111111';
const USER = { user_id: '00000000-0000-4000-8000-000000000002', handle: 'friend', display_name: 'Friend Person', avatar_url: null };
const ACH = { id: 'a1', ...USER, title: 'Ran my first 10K', message: 'so proud', images: [], video: null, created_at: ago(3 * 3600e3), cheers: 0, comments: 0, i_cheered: false };
const ACH_OLD = { id: 'a2', ...USER, title: null, message: 'an older thought', images: [], video: null, created_at: ago(12 * 86400e3), cheers: 0, comments: 0, i_cheered: false };
const ACH_LAST_YEAR = { id: 'a3', ...USER, title: null, message: 'from last year', images: [], video: null, created_at: '2025-03-05T09:14:00.000Z', cheers: 0, comments: 0, i_cheered: false };
const BADGE = { id: 'b1', ...USER, badge_id: 'streak7', created_at: ago(26 * 3600e3), cheers: 1, i_cheered: false };
const CLAR = { id: 'c1', title: 'Welcome', message: 'A note from Clar', image_url: null, cta_label: null, cta_tab: null, created_at: ago(5 * 60e3) };
const GUIDE = { id: 501, guide_id: GID, lang: 'en', dedupe_key: 'k1', title: 'A small idea', body: 'Body text that is long enough.', why: null, sources: [], practice: null, yt_video: null, created_at: ago(30 * 86400e3) };
const GUIDES = [{ id: GID, slug: 'business-startups', title: 'Business & Startups', description: 'x', canonical_key: 'bs', kind: 'starter', visibility: 'public', owner_id: null, status: 'active', sensitive: false, subscribers: 1, posts_per_day: 2, languages: ['en'], blueprint: { topic: 'startups' }, last_error: null }];

test.describe('post time (v253)', () => {
  test('the helper: just now / minutes / hours + clock time / date + clock time (+ year when not this year)', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await app.boot();
    const t = await page.evaluate(() => { const f = window._socPostTime, n = Date.now(), iso = ms => new Date(n - ms).toISOString(); return { now: f(iso(10e3)), m1: f(iso(65e3)), m5: f(iso(5 * 60e3)), h1: f(iso(3700e3)), h3: f(iso(3 * 3600e3)), old: f(iso(12 * 86400e3)), last: f('2025-03-05T09:14:00.000Z'), bad: f('nope') }; });
    expect(t.now).toBe('Just now');
    expect(t.m1).toBe('1 minute ago');
    expect(t.m5).toBe('5 minutes ago');
    expect(t.h1).toMatch(/^1 hour ago · \d{1,2}:\d{2} (AM|PM)$/);
    expect(t.h3).toMatch(/^3 hours ago · \d{1,2}:\d{2} (AM|PM)$/);
    expect(t.old).toMatch(/^\d{1,2} [A-Z][a-z]+ · \d{1,2}:\d{2} (AM|PM)$/);           // "24 September · 9:14 AM" (no year: this year)
    expect(t.last).toMatch(/^5 March 2025 · \d{1,2}:\d{2} (AM|PM)$/);                 // last year: the year is shown
    expect(t.bad).toBe('');
  });

  test('every kind of post (achievement, plain, badge, Clar, guide) ends with the time line; the header time is hidden', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true, achFeed: [ACH, ACH_OLD, ACH_LAST_YEAR], badgeFeed: [BADGE], clarPosts: [CLAR], guides: GUIDES, guidePosts: [GUIDE], guideSubs: [{ guide_id: GID, languages: ['en'], per_day: 2 }] });
    await page.addInitScript(() => { try { localStorage.setItem('clv_guides_seeded', '1'); } catch (e) {} });
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect.poll(() => page.locator('#soc-body .soc-card').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(6);
    const cards = await page.evaluate(() => [...document.querySelectorAll('#soc-body .soc-stack > .soc-card')].map(c => ({
      kind: c.classList.contains('g-card') ? 'guide' : c.classList.contains('soc-clar') ? 'clar' : c.querySelector('.soc-badge-tile') ? 'badge' : 'ach',
      time: (c.querySelector('.soc-ptime') || {}).textContent || null,
      isLast: !!c.lastElementChild && c.lastElementChild.classList.contains('soc-ptime'),
      headerTimeShown: !!c.querySelector('.soc-post-hd .soc-time') && getComputedStyle(c.querySelector('.soc-post-hd .soc-time')).display !== 'none'
    })));
    const kinds = new Set(cards.map(c => c.kind));
    for (const k of ['ach', 'badge', 'clar', 'guide']) expect(kinds.has(k), 'kind present: ' + k + ' in ' + JSON.stringify(cards)).toBe(true);
    for (const c of cards) {
      expect(c.time, c.kind + ' has a time line').toBeTruthy();
      expect(c.isLast, c.kind + ' time is the LAST element of the card').toBe(true);
      expect(c.headerTimeShown, c.kind + ' header time is hidden (no duplicate)').toBe(false);
    }
    expect(cards.find(c => c.kind === 'clar').time).toBe('5 minutes ago');
    expect(cards.find(c => c.kind === 'ach' && /hours? ago/.test(c.time))).toBeTruthy();
    expect(cards.some(c => /2025/.test(c.time))).toBe(true);
    await page.screenshot({ path: require('path').join(__dirname, '..', 'test-results', 'v253-post-time.png') });
    expect(app.pageErrors).toEqual([]);
  });
});
