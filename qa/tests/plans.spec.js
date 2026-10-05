// v260 — My Plan dashboard, plan rate chart, upgrade prompts. Enforcement is OFF by default: nothing existing may change.
const { test, expect } = require('./harness');

test.describe('plans (v260)', () => {
  test('enforcement off: every gate allows, plan is Free, API present', async ({ app }) => {
    await app.boot();
    // pin enforcement OFF explicitly: the live feature_flags.plans_enforced row can be ON, and this test is about the off state
    await app.page.evaluate(() => { localStorage.setItem('clv_plans_enforced', '0'); return window.clvRefreshPlan(); });
    const r = await app.page.evaluate(() => ({ api: typeof window.clvGate === 'function' && typeof window.clvUpsell === 'function', plan: window.clvPlan(), img: window.clvGate('goal_images', { adding: 9 }).allowed, priv: window.clvGate('private_guides').allowed }));
    expect(r.api).toBe(true); expect(r.plan).toBe('free'); expect(r.img).toBe(true); expect(r.priv).toBe(true);
  });

  test('My Plan card: plan badge + animated usage bars (XP counts live XP under the daily cap)', async ({ app }) => {
    await app.boot();
    await app.page.evaluate(() => {
      localStorage.setItem('clv_section_xp_today', JSON.stringify({ date: new Date().toISOString().slice(0, 10), xp: { vibe: 120, chat: 60, goal: 30 } }));
      localStorage.setItem('clv_usage_clar_chat', JSON.stringify({ date: new Date().toDateString(), count: 6 }));
      return window.clvRefreshPlan();
    });
    await app.page.evaluate(() => openProfileTab());
    await app.page.waitForTimeout(5000);
    const t = await app.page.evaluate(() => document.getElementById('plan-card').innerText.replace(/\s+/g, ' '));
    expect(t).toMatch(/free plan/i); expect(t).toMatch(/XP this month/); expect(t).toMatch(/210/); expect(t).toMatch(/6 \/ \d+/);
    const w = await app.page.evaluate(() => [...document.querySelectorAll('#plan-card .pl-bar i')].map((i) => parseFloat(i.style.width) || 0));
    expect(w.length).toBeGreaterThanOrEqual(3); expect(w.some((x) => x > 0)).toBe(true);
  });

  test('plans overlay lists the 3 plans; choosing one opens the manual UPI upgrade-request form', async ({ app }) => {
    await app.boot();
    // Real anonymous sign-in is rate-limited under this session's own heavy repeated test load
    // (Supabase returned a genuine 429 when checked directly) — inject a fake uid the same way
    // other tests here inject clv_plan_override, so this test verifies THIS feature's own logic
    // deterministically instead of being hostage to a shared project's live auth rate limit.
    await app.page.evaluate(() => { window._sbUid = '00000000-0000-4000-8000-00000000009a'; });
    await app.page.evaluate(() => openProfileTab()); await app.page.waitForTimeout(2500);
    await app.page.evaluate(() => document.getElementById('pl-see').click());
    await expect(app.page.locator('#pl-plans .pl-p')).toHaveCount(3);
    await app.page.evaluate(() => document.querySelector('[data-pl="plus"]').click());
    await expect(app.page.locator('#pl-wl')).toBeVisible();
    await expect(app.page.locator('#pl-utr')).toBeVisible(); // v262: UTR + note, not an email field — real paid plans are open now, no gateway yet
    await app.page.fill('#pl-utr', '123456789012'); await app.page.fill('#pl-note', 'paid via GPay');
    await app.page.click('#pl-wlg');
    // isolate()'s own blanket handler fakes a 201 for any Supabase write it doesn't specifically mock,
    // so a real upgrade_requests insert (if the owner has run schema_v262) succeeds here, and the
    // fallback-to-waitlist path (table missing) is covered by its own test below.
    await expect(app.page.locator('#pl-wlr')).toHaveText(/review your payment|reach out soon|not open yet/, { timeout: 8000 });
  });

  test('upgrade-request form falls back to the waitlist if upgrade_requests does not exist yet', async ({ app }) => {
    await app.page.route(/\/rest\/v1\/upgrade_requests/, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"relation \\"upgrade_requests\\" does not exist"}' }));
    await app.boot();
    await app.page.evaluate(() => {
      window._sbUid = '00000000-0000-4000-8000-00000000009b'; // same reasoning as the test above — real anon auth is rate-limited right now
      localStorage.setItem('clv_user_identity', JSON.stringify({ email: 'tester@example.com' }));
    });
    await app.page.evaluate(() => openProfileTab()); await app.page.waitForTimeout(2500);
    await app.page.evaluate(() => document.getElementById('pl-see').click());
    await app.page.evaluate(() => document.querySelector('[data-pl="plus"]').click());
    await app.page.click('#pl-wlg'); // submit with no UTR/note at all -- both are optional
    await expect(app.page.locator('#pl-wlr')).toHaveText(/reach out soon|not open yet/, { timeout: 8000 });
  });

  test('upgrade sheet speaks in the moment: names the limit and the next plan', async ({ app }) => {
    await app.boot();
    await app.page.evaluate(() => window.clvUpsell('chat', { limit: 8 }));
    await expect(app.page.locator('#pl-sh-t')).toContainText('8 messages');
    await expect(app.page.locator('#pl-sh-p')).toContainText('Plus gives you 20');
    await app.page.evaluate(() => document.getElementById('pl-sh-no').click());
    await expect(app.page.locator('#pl-sheet')).not.toHaveClass(/open/);
  });

  test('enforcement ON: Free is stopped at 5 vision images / own guides / AI Fortune; Pro is not; the upload path shows the sheet', async ({ app }) => {
    await app.boot();
    await app.page.evaluate(() => {
      const mk = (a) => { const c = document.createElement('canvas'); c.width = 20; c.height = 20; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 20, 20); return c.toDataURL('image/jpeg', .5); };
      localStorage.setItem('c9_vis', JSON.stringify(['#111', '#222', '#333', '#444', '#555'].map((c) => ({ src: mk(c), note: '' }))));
      localStorage.setItem('clv_plans_enforced', '1'); localStorage.setItem('clv_plan_override', 'free');
      return window.clvRefreshPlan();
    });
    await app.page.waitForTimeout(1500);
    const g = await app.page.evaluate(() => ({ img: window.clvGate('goal_images', { adding: 1 }), priv: window.clvGate('private_guides'), fort: window.clvGate('ai_fortune_reading') }));
    expect(g.img.allowed).toBe(false); expect(g.img.limit).toBe(5); expect(g.priv.allowed).toBe(false); expect(g.fort.allowed).toBe(false);
    const shown = await app.page.evaluate(() => { document.getElementById('file-inp').dataset.target = 'vision'; window.handleUpload({ target: { files: [new File([new Uint8Array(10)], 'a.png', { type: 'image/png' })], value: 'x' } }); return document.getElementById('pl-sheet').classList.contains('open'); });
    expect(shown).toBe(true);
    await app.page.evaluate(() => { localStorage.setItem('clv_plan_override', 'pro'); return window.clvRefreshPlan(); });
    await app.page.waitForTimeout(1000);
    const p = await app.page.evaluate(() => ({ img: window.clvGate('goal_images', { adding: 1 }).allowed, priv: window.clvGate('private_guides').allowed, fort: window.clvGate('ai_fortune_reading').allowed }));
    expect(p.img && p.priv && p.fort).toBe(true);
  });
});
