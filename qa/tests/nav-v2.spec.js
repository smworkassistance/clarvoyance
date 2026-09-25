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
    await page.waitForTimeout(1200);
    expect(await activeNew(page)).toBe('you');
    expect(await sectionShown(page, MAP.profileSection)).toBe(true);
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

  test('You: profile with entries to Fortune and My Community profile', async ({ app }) => {
    await bootOn(app);
    const { page } = app;
    await clickNew(page, 'you');
    await page.waitForTimeout(1200);
    await expect(page.locator('#nv2-you-card')).toBeVisible();
    await expect(page.locator('#nv2-you-card .nv2-row')).toHaveCount(2);
    // the existing profile is still there underneath
    expect(await sectionShown(page, MAP.profileSection)).toBe(true);
    await page.locator('#nv2-you-card .nv2-row').first().click();
    await page.waitForTimeout(1500);
    expect(await sectionShown(page, tab('fortune').section)).toBe(true);
    expect(await activeNew(page)).toBe('you');
    // card is not shown on other tabs
    await clickNew(page, 'goal');
    await page.waitForTimeout(800);
    await expect(page.locator('#nv2-you-card')).toBeHidden();
    // My Community profile opens Community on the profile view
    await clickNew(page, 'you');
    await page.waitForTimeout(800);
    await page.locator('#nv2-you-card .nv2-row').nth(1).click();
    await expect(page.locator('#soc-screen')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => SOC._state.tab)).toBe('me');
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
