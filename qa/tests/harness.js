// Shared QA harness: network isolation + console-error collection + onboarding dismissal.
const fs = require('fs'), path = require('path');
const { test: base, expect } = require('@playwright/test');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app-map.json'), 'utf8'));

// Tests must NEVER pollute production: analytics are blocked, and every WRITE to Supabase REST/Storage is answered
// with a fake success (reads and anonymous auth stay real, exactly like a real visitor).
async function isolate(context) {
  for (const host of MAP.networkBlock) await context.route(new RegExp(host.replace(/\./g, '\\.')), r => r.abort());
  await context.route(/supabase\.co\/(rest|storage)\/v1\//, route => {
    const m = route.request().method();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return route.continue();
    return route.fulfill({ status: m === 'POST' ? 201 : 204, contentType: 'application/json', body: m === 'POST' ? '[]' : '' });
  });
}

const test = base.extend({
  app: async ({ page, context }, use) => {
    await isolate(context);
    const errors = [], pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const u = (msg.location() && msg.location().url) || '';
      const text = msg.text();
      if (MAP.ignoreConsoleErrorsFromUrls.some(k => u.includes(k) || text.includes(k))) return;
      errors.push(`${text}${u ? ' @ ' + u : ''}`);
    });
    const app = {
      page, errors, pageErrors,
      async boot() {
        await page.goto('/');
        await page.waitForFunction(() => typeof window.bnavSwitch === 'function' && document.querySelector('.bnav-tab'), null, { timeout: 30000 });
        await page.waitForTimeout(4500);
        // onboarding overlays (life quiz / google sign-in prompt) are dismissed the way a user would ("don't ask again"/"maybe later")
        for (let i = 0; i < 3; i++) {
          const shown = await page.evaluate(() => [...document.querySelectorAll('[id$="-screen"],#tour-welcome')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 && e.id !== 'soc-screen').map(e => e.id));
          if (!shown.length) break;
          await page.evaluate(() => {
            try { if (typeof lifeQuizSkipForever === 'function') lifeQuizSkipForever(); } catch (e) {}
            const g = document.getElementById('gsignin-screen');
            if (g && getComputedStyle(g).display !== 'none') { const b = [...g.querySelectorAll('button,a,div')].find(e => /maybe later/i.test(e.textContent) && e.children.length === 0); if (b) b.click(); }
          });
          await page.waitForTimeout(700);
        }
      },
      async gotoTab(t) { await page.evaluate(sel => document.querySelector(sel).click(), t.nav); await page.waitForTimeout(1300); }
    };
    await use(app);
  }
});
module.exports = { test, expect, MAP };
