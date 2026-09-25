// T-005 — nav_v2: the new 6-button bottom navigation (dark-launched behind a flag).
// OFF (default) must leave the existing app untouched; ON (dev override clv_nav_v2_dev, same as opening ?nav=2) shows the new bar.
const { test, expect, MAP } = require('./harness');
const { mockCommunity } = require('./community-mock');

const tab = k => MAP.tabs.find(t => t.tab === k);
const visible = sel => `[...document.querySelectorAll('${sel}')].filter(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>0&&r.height>0}).length`;

async function bootOn(app, opts) {
  await mockCommunity(app.page, opts);
  await app.page.addInitScript(() => { try { localStorage.setItem('clv_nav_v2_dev', '1'); } catch (e) {} });
  await app.boot();
}
const clickNew = (page, k) => page.locator(`.nv2-tab[data-nv2="${k}"]`).click();
const activeNew = page => page.evaluate(() => { const a = document.querySelector('.nv2-tab.active'); return a ? a.getAttribute('data-nv2') : null; });
const sectionShown = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }, sel);

test.describe('nav_v2 — flag OFF (default) changes nothing', () => {
  test('no new nav, old nav fully visible', async ({ app }) => {
    await app.boot();
    expect(await app.page.evaluate(() => document.body.classList.contains('nav-v2'))).toBe(false);
    expect(await app.page.evaluate(visible('.nv2-tab'))).toBe(0);
    expect(await app.page.evaluate(visible('#bnav .bnav-tab'))).toBeGreaterThanOrEqual(5);
  });
});

test.describe('nav_v2 — flag OFF: the existing Community overlay is untouched', () => {
  test('4 bottom tabs, ClarZone title, close X, classic You without Fortune/Board cards', async ({ app }) => {
    await mockCommunity(app.page);
    await app.boot();
    const { page } = app;
    await page.evaluate(() => SOC.open());
    await expect(page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('#soc-tabs .soc-tab')).toHaveCount(4);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('soc-tabs')).display)).toBe('flex');
    await expect(page.locator('#soc-top .soc-title')).toContainText('ClarZone');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#soc-top [data-act="close"]')).visibility)).toBe('visible');
    await page.locator('#soc-tabs .soc-tab[data-tab="me"]').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.soc-stats')).toBeVisible();
    await expect(page.locator('.v2-fortune')).toHaveCount(0);
    await expect(page.locator('.v2-rank')).toHaveCount(0);
    await expect(page.locator('#soc-body .soc-h', { hasText: 'Achievements' })).toHaveCount(1); // the classic badge heading
    await page.locator('#soc-tabs .soc-tab[data-tab="board"]').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.v2-lbintro')).toHaveCount(0);
    await page.locator('#soc-top [data-act="close"]').click();
    expect(await page.evaluate(() => document.getElementById('soc-screen').classList.contains('hidden'))).toBe(true);
  });
});

test.describe('nav_v2 — flag ON', () => {
  test('shows 6 new buttons, hides the old ones, Clar AI is the raised centre button', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    expect(await page.evaluate(() => document.body.classList.contains('nav-v2'))).toBe(true);
    expect(await page.evaluate(visible('.nv2-tab'))).toBe(6);
    expect(await page.evaluate(visible('#bnav .bnav-tab'))).toBe(0);
    const labels = await page.locator('.nv2-tab').evaluateAll(els => els.map(e => e.getAttribute('data-nv2')));
    expect(labels).toEqual(['feed', 'vibe', 'chat', 'goal', 'home', 'you']);
    const geo = await page.evaluate(() => {
      const nav = document.getElementById('bnav').getBoundingClientRect();
      const orb = document.querySelector('.nv2-centre .nv2-orb').getBoundingClientRect();
      return { navTop: nav.top, navMid: nav.left + nav.width / 2, orbTop: orb.top, orbMid: orb.left + orb.width / 2, vw: innerWidth };
    });
    expect(geo.orbTop, 'orb rises above the bar').toBeLessThan(geo.navTop);
    expect(Math.abs(geo.orbMid - geo.navMid), 'orb is centred').toBeLessThan(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow').toBe(true);
  });

  test('each button opens its section and the highlight follows', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    for (const [k, t] of [['vibe', 'vibe'], ['goal', 'goal'], ['home', 'home'], ['chat', 'chat']]) {
      await clickNew(page, k);
      await page.waitForTimeout(1300);
      expect(await sectionShown(page, tab(t).section), `${k} section shows`).toBe(true);
      expect(await activeNew(page), `${k} highlighted`).toBe(k);
    }
  });

  test('Fortune / Profile highlight You, Self highlights Home; ?nav=0 clears the override', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    await page.evaluate(sel => document.querySelector(sel).click(), tab('fortune').nav);
    await page.waitForTimeout(800);
    expect(await activeNew(page)).toBe('you');
    await clickNew(page, 'home');
    await page.waitForTimeout(600);
    await page.evaluate(sel => document.querySelector(sel).click(), tab('self').nav);
    await page.waitForTimeout(800);
    expect(await activeNew(page)).toBe('home');
    await clickNew(page, 'you');
    await expect(page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    expect(await activeNew(page)).toBe('you');
    // ?nav=0 removes the dev override
    await page.goto('/?nav=0', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => localStorage.getItem('clv_nav_v2_dev'))).toBeNull();
    expect(await page.evaluate(() => document.body.classList.contains('nav-v2'))).toBe(false);
  });

  test('Feed hosts Community as a tab: stops above the bar, no close X, sub-tabs Following/Discover/Board, leaves cleanly', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    await clickNew(page, 'feed');
    await expect(page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    expect(await activeNew(page)).toBe('feed');
    const g = await page.evaluate(() => {
      const o = document.getElementById('soc-screen').getBoundingClientRect(), n = document.getElementById('bnav').getBoundingClientRect();
      const x = n.left + n.width * 0.1, y = n.top + n.height / 2, hit = document.elementFromPoint(x, y);
      return { overlayBottom: o.bottom, navTop: n.top, hitInNav: !!(hit && hit.closest('#bnav')),
        closeVis: getComputedStyle(document.querySelector('#soc-top [data-act="close"]')).visibility,
        tabs: [...document.querySelectorAll('#soc-tabs .soc-tab')].filter(t => getComputedStyle(t).display !== 'none').sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(t => t.textContent.trim()) };
    });
    expect(Math.abs(g.overlayBottom - g.navTop), 'overlay ends where the bar begins').toBeLessThan(2);
    expect(g.hitInNav, 'bar is tappable while Feed is open').toBe(true);
    expect(g.closeVis).toBe('hidden');
    expect(g.tabs).toEqual(['Following', 'Discover', 'Board']);
    // inner sub-tab switch works
    await page.locator('#soc-tabs .soc-tab[data-tab="board"]').click();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => SOC._state.tab)).toBe('board');
    // leaving through the main bar closes the overlay and shows the chosen tab
    await clickNew(page, 'vibe');
    await page.waitForTimeout(1300);
    expect(await page.evaluate(() => document.getElementById('soc-screen').classList.contains('hidden'))).toBe(true);
    expect(await page.evaluate(() => document.body.classList.contains('nv2-feed'))).toBe(false);
    expect(await sectionShown(page, tab('vibe').section)).toBe(true);
    expect(await activeNew(page)).toBe('vibe');
  });

  const GOALS = [
    { id: 'g1', title: 'Run my first 10K', images: [], date_set: '2026-01-01', achieved: true, date_achieved: '2026-08-01T00:00:00Z', visibility: 'public' },
    { id: 'g2', title: 'Private win', images: [], date_set: '2026-02-01', achieved: true, date_achieved: '2026-08-02T00:00:00Z', visibility: 'private' },
    { id: 'g3', title: 'Launch my business', images: [], date_set: '2026-03-01', achieved: false, date_achieved: null, visibility: 'private' }
  ];
  async function bootYou(app) {
    await mockCommunity(app.page);
    await app.page.addInitScript(g => { try { localStorage.setItem('clv_nav_v2_dev', '1'); localStorage.setItem('clv_goal_items', JSON.stringify(g)); } catch (e) {} }, GOALS);
    await app.boot();
    await clickNew(app.page, 'you');
    await expect(app.page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
    await app.page.waitForTimeout(1200);
  }

  test('You = the community dashboard: stats, private Fortune card, gear opens the untouched Profile', async ({ app }) => {
    await bootYou(app);
    const { page } = app;
    expect(await activeNew(page)).toBe('you');
    await expect(page.locator('#soc-top .soc-title')).toHaveText('You');
    await expect(page.locator('.soc-stats')).toBeVisible();
    await expect(page.locator('.soc-metrics')).toBeVisible();
    await expect(page.locator('.v2-fortune')).toBeVisible();
    await expect(page.locator('.v2-fortune')).toContainText('only you');
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('soc-tabs')).display), 'no inner tabs in You').toBe('none');
    expect(await page.evaluate(() => !!document.getElementById('nv2-you-card')), 'App Profile has no injected card').toBe(false);
    // Fortune card leaves the overlay and opens the Fortune tab; You stays highlighted
    await page.locator('.v2-fortune').click();
    await page.waitForTimeout(1500);
    expect(await sectionShown(page, tab('fortune').section)).toBe(true);
    expect(await activeNew(page)).toBe('you');
    // back to You; the gear opens the ordinary App Profile
    await clickNew(page, 'you');
    await expect(page.locator('#soc-screen')).toBeVisible();
    await page.locator('#soc-top [data-act="v2-settings"]').click();
    await page.waitForTimeout(1500);
    expect(await sectionShown(page, MAP.profileSection)).toBe(true);
    expect(await page.evaluate(() => document.getElementById('soc-screen').classList.contains('hidden'))).toBe(true);
    expect(await activeNew(page)).toBe('you');
  });

  test('goal plates: Achievements vs Actively working on, per-goal share choice persists', async ({ app }) => {
    await bootYou(app);
    const { page } = app;
    const heads = await page.locator('#soc-body .soc-h').allInnerTexts();
    expect(heads.some(h => /Achievements/i.test(h))).toBe(true);
    expect(heads.some(h => /Actively working on/i.test(h))).toBe(true);
    await expect(page.locator('.soc-gpill')).toHaveCount(3);
    const texts = await page.locator('.soc-gpill').allInnerTexts();
    expect(texts.filter(t => /Shared/.test(t)).length).toBe(1);
    expect(texts.filter(t => /Only you/.test(t)).length).toBe(2);
    await page.locator('.soc-gpill[data-id="g3"]').click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g3').visibility)).toBe('public');
    await expect(page.locator('.soc-gpill[data-id="g3"]')).toContainText('Shared');
    await page.locator('.soc-gpill[data-id="g1"]').click();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g1').visibility)).toBe('private');
    // what others could ever see = only the public ones
    const pub = await page.evaluate(() => window.GI.items().filter(x => x.visibility === 'public').map(x => x.id));
    expect(pub).toEqual(['g3']);
  });

  test('Board card in You opens the full board page (self-explaining) and back returns', async ({ app }) => {
    await bootYou(app);
    const { page } = app;
    await expect(page.locator('#v2-rank')).toBeVisible();
    await expect(page.locator('#v2-rank')).toContainText('Leaderboard');
    await page.locator('#v2-rank').click();
    await page.waitForTimeout(1200);
    await expect(page.locator('#soc-top .soc-title')).toHaveText('Leaderboard');
    await expect(page.locator('.v2-lbintro')).toContainText('How the board works');
    await expect(page.locator('.soc-seg')).toBeVisible();
    await page.locator('#soc-top [data-act="v2-back"]').click();
    await page.waitForTimeout(900);
    await expect(page.locator('#soc-top .soc-title')).toHaveText('You');
    await expect(page.locator('.v2-fortune')).toBeVisible();
  });

  test('signed-out visitors see an example preview (not a bare wall) on Feed and You', async ({ app }) => {
    await app.page.addInitScript(() => { try { localStorage.setItem('clv_nav_v2_dev', '1'); localStorage.setItem('clv_social_dev', '1'); } catch (e) {} });
    await app.boot();
    const { page } = app;
    for (const k of ['feed', 'you']) {
      await clickNew(page, k);
      await expect(page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.v2-prev')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.v2-prev-tag')).toHaveText(/Example preview/i);
      await expect(page.locator('#soc-body [data-act="signin"]')).toBeVisible();
      await clickNew(page, 'vibe');
      await page.waitForTimeout(900);
    }
  });

  test('Self plate sits under Non-Negotiables on Home only, and opens Self', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    await clickNew(page, 'home');
    await page.waitForTimeout(1200);
    const plate = page.locator('#nv2-self-plate');
    await expect(plate).toBeVisible();
    const g = await page.evaluate(() => ({ nnBottom: document.getElementById('nn-tab-section').getBoundingClientRect().bottom, plateTop: document.getElementById('nv2-self-plate').getBoundingClientRect().top }));
    expect(g.plateTop, 'plate is below Non-Negotiables').toBeGreaterThanOrEqual(g.nnBottom - 1);
    await plate.locator('.sacc-row').click();
    await page.waitForTimeout(1200);
    expect(await sectionShown(page, tab('self').section)).toBe(true);
    expect(await activeNew(page)).toBe('home');
    await expect(plate).toBeHidden();
    await clickNew(page, 'vibe');
    await page.waitForTimeout(800);
    await expect(plate).toBeHidden();
  });

  test('server flag feature_flags.nav_v2 turns it on without any override', async ({ app }) => {
    await mockCommunity(app.page, { navV2: true });
    await app.boot();
    await expect.poll(() => app.page.evaluate(() => document.body.classList.contains('nav-v2')), { timeout: 15000 }).toBe(true);
  });

  test('nav_v2 bar looks like its approved baseline', async ({ app }) => {
    await bootOn(app);
    await clickNew(app.page, 'home');
    await app.page.waitForTimeout(1200);
    await expect(app.page.locator('.bnav').first()).toHaveScreenshot('nav-v2-bar.png');
  });
});
