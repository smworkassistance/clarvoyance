// T-046 — the one-time "Clar is not a substitute for a doctor or consultant" screen, the Help entry and the feed footer.
const { test, expect } = require('./harness');
const { mockCommunity } = require('./community-mock');

test.describe('disclaimers (v250)', () => {
  test('first launch shows the disclaimer before anything else; accepting continues onboarding; it never returns', async ({ app }) => {
    const { page } = app;
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#disc-screen')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#disc-screen')).toContainText('not a substitute for a doctor');
    await expect(page.locator('#disc-screen')).toContainText('positive mindset');
    // nothing else of the onboarding is showing on top of / behind it yet
    expect(await page.evaluate(() => ['reg-screen', 'lifequiz-screen', 'gsignin-screen'].filter(id => getComputedStyle(document.getElementById(id)).display !== 'none').length)).toBe(0);
    await page.locator('#disc-card .reg-submit').click();
    await expect(page.locator('#disc-screen')).toBeHidden();
    expect(await page.evaluate(() => !!localStorage.getItem('clv_disclaimer_ok'))).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    await expect(page.locator('#disc-screen')).toBeHidden();
  });

  test('Help has the note, and the Community feed carries the footer', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page);
    await app.boot();
    await page.evaluate(() => window.openHelpGlossary());
    await expect(page.locator('#help-screen')).toContainText('what Clar is', { timeout: 10000 });
    await page.evaluate(() => { const h = document.getElementById('help-screen'); if (h) h.style.display = 'none'; });
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect(page.locator('.soc-disc')).toContainText('not advice', { timeout: 15000 });
  });
});
