// T-052..T-055 — Guides: posts appear in the Feed with sources + disclaimer, like/save/share/report, inline practice (+XP once),
// Guides page (follow/unfollow, languages), create wizard (blueprint -> private guide -> Worker kick -> subscribed).
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const GID = '11111111-1111-4111-8111-111111111111', GID2 = '22222222-2222-4222-8222-222222222222';
const GUIDES = [
  { id: GID, slug: 'business-startups', title: 'Business & Startups', description: 'Short ideas for builders', canonical_key: 'business_startups', kind: 'starter', visibility: 'public', owner_id: null, status: 'active', sensitive: false, subscribers: 12, posts_per_day: 2, languages: ['en'], blueprint: { topic: 'startups business', source_tags: ['startup'] }, last_error: null },
  { id: GID2, slug: 'mindful-peace', title: 'Calm & Focus', description: 'A steady mind', canonical_key: 'calm_focus', kind: 'starter', visibility: 'public', owner_id: null, status: 'active', sensitive: true, subscribers: 4, posts_per_day: 2, languages: ['en'], blueprint: { topic: 'calm', source_tags: ['mindfulness'] }, last_error: null }
];
const POST = { id: 501, guide_id: GID, lang: 'en', dedupe_key: 'k1', title: 'Start smaller than you think', body: 'Most founders wait for a perfect plan.\nA tiny first test teaches more.', why: 'You said you want to start a brand', sources: [{ publisher: 'Inc42', url: 'https://inc42.com/x', title: 'x' }, { publisher: 'bad', url: 'javascript:alert(1)' }], practice: { type: 'writing', prompt: 'Write one tiny test you can run this week.', seconds: 60 }, yt_video: null, created_at: new Date().toISOString() };

async function setup(page, extra = {}) {
  await mockCommunity(page, { guides: GUIDES, guidePosts: [POST], guideSubs: [{ guide_id: GID, languages: ['en'], per_day: 2 }], ...extra });
  const writes = [];
  for (const t of ['guide_signals', 'guide_reports', 'guide_subscriptions', 'guides', 'user_prefs_v250']) {
    await page.route(new RegExp('/rest/v1/' + t), route => {
      const m = route.request().method();
      if (m === 'GET' || m === 'OPTIONS') return route.fallback();
      let body = null; try { body = JSON.parse(route.request().postData() || 'null'); } catch (e) {}
      writes.push({ t, m, body });
      const single = /vnd.pgrst.object/.test(route.request().headers()['accept'] || '');
      return route.fulfill({ status: m === 'DELETE' ? 204 : 201, headers: JSON_H, body: m === 'DELETE' ? '' : (single ? JSON.stringify({ id: GID2 }) : '[]') });
    });
  }
  await page.addInitScript(() => { try { localStorage.setItem('clv_guides_seeded', '1'); } catch (e) {} });
  return writes;
}
async function openFeed(app) {
  await app.boot();
  await app.page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
  await expect(app.page.locator('.g-card')).toHaveCount(1, { timeout: 8000 });
}

test.describe('guides (v250)', () => {
  test('a followed guide post shows in the Feed with sources, a safe link only, why-line and disclaimer', async ({ app }) => {
    const { page } = app; await setup(page); await openFeed(app);
    const card = page.locator('.g-card');
    await expect(card).toContainText('Start smaller than you think');
    await expect(card).toContainText('Why this for you');
    await expect(card.locator('.g-src')).toHaveCount(1); // the javascript: link is dropped
    await expect(card.locator('.g-src')).toHaveAttribute('href', 'https://inc42.com/x');
    await expect(card).toContainText('not advice');
    await expect(page.locator('.g-entry')).toBeVisible();
  });

  test('like / save / more-less / report record signals; report hides the card', async ({ app }) => {
    const { page } = app; const writes = await setup(page); await openFeed(app);
    await page.locator('.g-card [data-act="g-like"]').click();
    await page.locator('.g-card [data-act="g-save"]').click();
    await expect(page.locator('.g-card [data-act="g-save"]')).toContainText('Saved');
    await page.locator('.g-card [data-act="g-menu"]').click();
    await page.locator('.g-card [data-act="g-more"]').click();
    await page.locator('.g-card [data-act="g-menu"]').click();
    await page.locator('.g-card [data-act="g-report"]').click();
    await page.locator('[data-act="g-rep-send"][data-r="false_info"]').click();
    await expect(page.locator('.g-card')).toBeHidden();
    await page.waitForTimeout(300);
    const ev = writes.filter(w => w.t === 'guide_signals').map(w => w.body && w.body.event);
    expect(ev).toEqual(expect.arrayContaining(['like', 'save', 'more']));
    const rep = writes.find(w => w.t === 'guide_reports');
    expect(rep.body).toMatchObject({ post_id: 501, guide_id: GID, reason: 'false_info' });
  });

  test('inline practice: writing unlocks Done after a few words, pays XP once', async ({ app }) => {
    const { page } = app; const writes = await setup(page); await openFeed(app);
    const xp0 = await page.evaluate(() => +localStorage.getItem('clar_xp') || 0);
    await page.locator('.g-card [data-act="g-practice"]').click();
    const done = page.locator('.g-card [data-act="g-practice-done"]');
    await expect(done).toBeDisabled();
    await page.locator('.g-card .g-pr-ta').fill('Ask five people if they would pay for it');
    await expect(done).toBeEnabled();
    await done.click();
    await expect(page.locator('.g-card .g-pr-done')).toContainText('Practice done');
    const xp1 = await page.evaluate(() => +localStorage.getItem('clar_xp') || 0);
    expect(xp1).toBeGreaterThan(xp0);
    expect(writes.some(w => w.t === 'guide_signals' && w.body.event === 'practice_done')).toBe(true);
  });

  test('share opens the approved invitation with a WhatsApp option', async ({ app }) => {
    const { page } = app; await setup(page);
    await page.addInitScript(() => { window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; }; });
    await openFeed(app);
    await page.locator('.g-card [data-act="g-share"]').click();
    await page.locator('[data-act="gs-wa"]').click();
    const url = await page.evaluate(() => window.__opened[0]);
    expect(url).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(url)).toContain('Start smaller than you think');
    expect(decodeURIComponent(url)).toContain('Join me: https://clar.co.in/');
  });

  test('Guides page: suggested + all guides; follow and unfollow write the subscription; languages max 3', async ({ app }) => {
    const { page } = app; const writes = await setup(page); await openFeed(app);
    await page.locator('.g-entry').click();
    await expect(page.locator('.soc-title')).toHaveText('Guides');
    await expect(page.locator('.g-row', { hasText: 'Business & Startups' })).toContainText('Following');
    await page.locator('.g-row', { hasText: 'Calm & Focus' }).locator('[data-act="g-sub"]').click();
    await page.waitForTimeout(300);
    expect(writes.find(w => w.t === 'guide_subscriptions' && w.m === 'POST').body).toMatchObject({ guide_id: GID2 });
    // languages: pick hi, mr, ta -> the oldest is dropped (max 3)
    for (const l of ['hi', 'mr', 'ta']) await page.locator('[data-act="g-lang"][data-l="' + l + '"]').click();
    const langs = await page.evaluate(() => JSON.parse(localStorage.getItem('clv_langs')));
    expect(langs.length).toBeLessThanOrEqual(3);
    expect(langs).toContain('ta');
    await page.locator('[data-act="g-back"]').click();
    await expect(page.locator('.soc-title')).toHaveText('Feed');
  });

  test('create wizard: blueprint -> understood text -> private guide inserted, Worker kicked, followed', async ({ app }) => {
    const { page } = app; const writes = await setup(page);
    const bp = { title: 'My Cosmetics Brand', description: 'Building a small skincare brand', understood: 'You want to start a cosmetics brand in India and feel unsure where to begin.', topic: 'cosmetics brand', intention: 'start a brand', angles: ['pricing', 'first customers', 'sourcing', 'branding'], tone: 'warm', avoid: [], source_tags: ['startup', 'india', 'bogus'], wikiquote: [], youtube: ['start a skincare brand'], canonical_key: 'cosmetics_brand', public_title: 'Starting a Brand', public_intention: 'start a small brand' };
    await page.route(/cold-frog-d555\.smworkassistance\.workers\.dev/, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(bp) }] } }] }) });
    });
    const kicks = [];
    await page.route(/clarvoyance-admin-relay\.smworkassistance\.workers\.dev/, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      kicks.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ ok: true, data: { status: 'active', first_post: true } }) });
    });
    await page.addInitScript(() => { window.__tok = 1; });
    await openFeed(app);
    // the wizard needs an access token; the isolated network has none, so stub the auth session
    await page.evaluate(() => { window._sbShared.auth.getSession = async () => ({ data: { session: { access_token: 'tok' } } }); });
    await page.locator('.g-entry').click();
    await page.locator('[data-act="g-create"]').click();
    await page.locator('#gw-int').fill('I want to start a cosmetics brand in India');
    await page.locator('[data-act="gw-next"]').click();
    await expect(page.locator('.g-und')).toContainText('cosmetics brand in India');
    await page.locator('#gw-share').check();
    await page.locator('[data-act="gw-create"]').click();
    await expect(page.locator('.soc-title')).toHaveText('Feed', { timeout: 8000 });
    const g = writes.filter(w => w.t === 'guides' && w.m === 'POST');
    expect(g.length).toBe(2); // private + generic public twin
    const priv = g.find(w => w.body.visibility === 'private').body, pub = g.find(w => w.body.visibility === 'public').body;
    expect(priv.status).toBe('pending'); expect(priv.blueprint.source_tags).toEqual(['startup', 'india']); // 'bogus' tag dropped
    expect(pub.blueprint.context, 'the public twin must carry no personal context').toBeUndefined();
    expect(kicks[0]).toMatchObject({ action: 'guide.kick', guide_id: GID2 });
    expect(writes.some(w => w.t === 'guide_subscriptions' && w.body.guide_id === GID2)).toBe(true);
  });
});
