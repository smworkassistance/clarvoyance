// Regression gate for the Clarvoyance app. "Nothing that works today may break" is enforced HERE, not by promises.
// Each test = one thing that must keep working. Add a test whenever a bug is fixed (the ratchet only goes up).
const { test, expect, MAP } = require('./harness');

test.describe('core app', () => {
  test('boots: version label present, no uncaught exceptions, no NEW console errors', async ({ app }) => {
    await app.boot();
    const label = await app.page.locator(MAP.versionLabelSelector).textContent();
    expect(label).toMatch(/^v\d+$/);
    expect(app.pageErrors, 'uncaught exceptions').toEqual([]);
    expect(app.errors, 'new console errors (known ones are allow-listed in qa/app-map.json)').toEqual([]);
  });

  test('every bottom-nav tab opens its section', async ({ app }) => {
    await app.boot();
    for (const t of MAP.tabs) {
      await app.gotoTab(t);
      await expect(app.page.locator(t.section).first(), `tab ${t.tab} -> ${t.section}`).toBeVisible();
    }
    expect(app.pageErrors).toEqual([]);
  });

  test('no horizontal overflow on any tab (layout not broken)', async ({ app }) => {
    await app.boot();
    for (const t of MAP.tabs) {
      await app.gotoTab(t);
      const o = await app.page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(o.sw, `tab ${t.tab} scrollWidth ${o.sw} vs viewport ${o.cw}`).toBeLessThanOrEqual(o.cw + 1);
    }
  });

  test('profile tab opens', async ({ app }) => {
    await app.boot();
    await app.page.evaluate(() => openProfileTab());
    await app.page.waitForTimeout(1200);
    await expect(app.page.locator(MAP.profileSection)).toBeVisible();
  });

  test('vibe feed renders a real card', async ({ app }) => {
    await app.boot();
    await app.gotoTab(MAP.tabs.find(t => t.tab === 'vibe'));
    await app.page.waitForTimeout(1500);
    const len = await app.page.evaluate(() => (document.getElementById('vf-card') || { innerHTML: '' }).innerHTML.length);
    expect(len).toBeGreaterThan(50);
  });
});

test.describe('community (signed-out visitor)', () => {
  test('community shows the Google sign-in gate; install card never covers it', async ({ app }) => {
    await app.boot();
    await app.page.evaluate(() => SOC.open());
    await app.page.waitForTimeout(2500);
    const txt = await app.page.locator('#soc-body').innerText();
    expect(txt).toContain('Continue with Google');
    // the PWA install card must be hidden while Community is open (v246 fix)
    const card = await app.page.evaluate(() => { const c = document.getElementById('pwa-card'); return c ? getComputedStyle(c).display : 'none'; });
    expect(card).toBe('none');
    await app.page.evaluate(() => SOC.close());
  });

  test('video feature is configured (Worker + CDN set, not placeholders)', async ({ app }) => {
    await app.boot();
    const cfg = await app.page.evaluate(() => window.SOC && SOC._cfg);
    expect(cfg, 'SOC._cfg exposed').toBeTruthy();
    expect(cfg.worker).not.toContain('replace_with');
    expect(cfg.cdn).not.toContain('replace_with');
  });
});

test.describe('visual guard (stable regions only — dynamic content is never compared)', () => {
  for (const r of MAP.stableRegions) {
    test(`region "${r.name}" looks the same as the approved baseline`, async ({ app }) => {
      await app.boot();
      await app.gotoTab(MAP.tabs.find(t => t.tab === 'home'));
      await app.page.waitForTimeout(800);
      await expect(app.page.locator(r.selector).first()).toHaveScreenshot(`${r.name}.png`);
    });
  }
});

test.describe('chat (real AI call — costs a fraction of a paisa)', () => {
  test('a message gets a reply', async ({ app }) => {
    test.skip(!!process.env.QA_SKIP_CHAT, 'QA_SKIP_CHAT set');
    await app.boot();
    await app.gotoTab(MAP.tabs.find(t => t.tab === 'chat'));
    const before = await app.page.locator(MAP.chatBubble).count();
    await app.page.evaluate((sel) => { const i = document.querySelector(sel); i.value = 'qa check: reply with one short sentence'; i.dispatchEvent(new Event('input', { bubbles: true })); chatSend(); }, MAP.chatInput);
    await expect.poll(async () => app.page.locator(MAP.chatBubble).count(), { timeout: 45000 }).toBeGreaterThanOrEqual(before + 2);
    const last = (await app.page.locator(MAP.chatBubble).last().innerText()).trim();
    expect(last.length).toBeGreaterThan(2);
  });
});
