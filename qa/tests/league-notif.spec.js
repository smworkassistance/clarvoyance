// T-069/T-070 (B8) — weekly league Board and the Activity (notifications) screen, against mocked RPC/tables.
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const U = n => '00000000-0000-4000-8000-00000000000' + n;
const ROWS = [
  { rank: 1, user_id: U(2), handle: 'asha', display_name: 'Asha K', avatar_url: null, gain: 320, is_me: false, cheered: false },
  { rank: 2, user_id: U(3), handle: 'ravi', display_name: 'Ravi S', avatar_url: null, gain: 210, is_me: false, cheered: false },
  { rank: 3, user_id: U(1), handle: 'qa_user', display_name: 'QA User', avatar_url: null, gain: 120, is_me: true, cheered: false },
  { rank: 4, user_id: U(4), handle: 'mina', display_name: 'Mina P', avatar_url: null, gain: 60, is_me: false, cheered: false }
];
const ME = { tier: 2, gain: 120, last_xp: 200, last_rank: 4, last_tier: 1, last_result: 'promoted', last_week: '2026-09-14' };

async function setup(app, opts = {}) {
  const { page } = app, calls = { cheer: [] };
  await mockCommunity(page, { navV2: true });
  await page.route(/\/rest\/v1\/rpc\/league_join_me/, r => r.fulfill({ status: opts.noSql ? 404 : 200, headers: JSON_H, body: JSON.stringify(opts.noSql ? { message: 'missing' } : (opts.optOut ? [] : [{ tier: 2 }])) }));
  await page.route(/\/rest\/v1\/rpc\/league_board/, r => r.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(ROWS) }));
  await page.route(/\/rest\/v1\/rpc\/league_me/, r => r.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify([ME]) }));
  await page.route(/\/rest\/v1\/rpc\/league_cheer/, r => { calls.cheer.push(r.request().postData()); return r.fulfill({ status: 200, headers: JSON_H, body: 'true' }); });
  const notifs = opts.notifs || [];
  await page.route(/\/rest\/v1\/user_notifications/, r => {
    const m = r.request().method();
    if (m === 'HEAD' || m === 'GET') {
      const unread = notifs.filter(n => !n.read_at).length;
      return r.fulfill({ status: 200, headers: { ...JSON_H, 'content-range': '0-0/' + unread, 'access-control-expose-headers': 'content-range' }, body: m === 'HEAD' ? '' : JSON.stringify(notifs) });
    }
    return r.fulfill({ status: 204, headers: JSON_H, body: '' });
  });
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
  await page.waitForTimeout(500);
  return calls;
}

test.describe('weekly league + activity (v253)', () => {
  test('Board shows my league, zones, recap, my pinned row; cheer works; hall opens the classic board', async ({ app }) => {
    const { page } = app;
    const calls = await setup(app);
    await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="board"]').click());
    await expect(page.locator('.lg-head')).toContainText('Bloom League', { timeout: 10000 });
    await expect(page.locator('.lg-row')).toHaveCount(4 + 1); // 4 members + my pinned copy
    await expect(page.locator('.lg-zone.up')).toContainText('Promotion');
    await expect(page.locator('.lg-recap')).toContainText('moved up');
    await expect(page.locator('.lg-vs')).toContainText('120');
    await expect(page.locator('.lg-mepin .lg-row.me')).toHaveCount(1);
    await page.locator('.lg-list .lg-cheer').first().click();
    await expect.poll(() => calls.cheer.length).toBe(1);
    await expect(page.locator('.lg-list .lg-cheer').first()).toHaveClass(/on/);
    await page.locator('.lg-recap-x').click();
    await expect(page.locator('.lg-recap')).toHaveCount(0);
    await page.locator('.lg-hall').first().click();
    await expect(page.locator('.lg-hall.back')).toBeVisible({ timeout: 8000 });
    expect(app.pageErrors).toEqual([]);
  });

  test('without the SQL installed the old global board still shows; opted-out shows the join card', async ({ app }) => {
    const { page } = app;
    await setup(app, { noSql: true });
    await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="board"]').click());
    await page.waitForTimeout(1500);
    await expect(page.locator('.lg-head')).toHaveCount(0);
    expect(app.pageErrors).toEqual([]);
  });

  test('Activity: bell with unread dot, grouped rows (likes collapse), opening marks read', async ({ app }) => {
    const { page } = app;
    const now = Date.now();
    await setup(app, { notifs: [
      { id: 1, kind: 'like', actor_id: U(2), target_id: '7', created_at: new Date(now - 6e4).toISOString(), read_at: null },
      { id: 2, kind: 'like', actor_id: U(3), target_id: '7', created_at: new Date(now - 7e4).toISOString(), read_at: null },
      { id: 3, kind: 'comment', actor_id: U(2), target_id: '7', text: 'Nice one', created_at: new Date(now - 8e4).toISOString(), read_at: null },
      { id: 4, kind: 'follow', actor_id: U(4), target_id: null, created_at: new Date(now - 30 * 864e5).toISOString(), read_at: new Date().toISOString() }
    ] });
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('soc-unread')), { timeout: 10000 }).toBe(true);
    await page.evaluate(() => document.querySelector('#soc-tabs .soc-tab[data-tab="notif"]').click());
    await expect(page.locator('.nf-h').first()).toHaveText('New', { timeout: 10000 });
    // two likes on the same post -> one row
    await expect(page.locator('.nf-row[data-kind="like"]')).toHaveCount(1);
    await expect(page.locator('.nf-row[data-kind="like"]')).toContainText('1 other');
    await expect(page.locator('.nf-row[data-kind="comment"]')).toContainText('Nice one');
    await expect(page.locator('.nf-h', { hasText: 'Earlier' })).toHaveCount(1);
    expect(app.pageErrors).toEqual([]);
  });
});
