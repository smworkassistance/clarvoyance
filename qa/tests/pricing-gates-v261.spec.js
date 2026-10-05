// v261 — completes the plans/pricing gates v260 left unwired (Fortune AI reading, Pulse
// weekly reflection, Insights chart count), unifies the chat-limit check with the real
// plan, and adds the T-107 "before you go" account-delete feedback screen.
// Enforcement stays OFF by default (feature_flags.plans_enforced / clv_plans_enforced) —
// every gate must fail OPEN unless a test explicitly turns enforcement on for itself.
const { test, expect } = require('./harness');

// _applyChartsLock() always creates a .ft-chart-inner wrapper on every block (locked or
// not) as its very last step for that block — a reliable "the lock pass has actually run"
// signal regardless of how long the real Supabase fetch/sb-uid-readiness retry took (up
// to 8s on a cold session, per the _fetchRange retry documented in index.html).
async function chartLockStates(page) {
  await page.waitForFunction(() => document.querySelectorAll('#ft-charts-card .ft-chart-block .ft-chart-inner').length === 7, null, { timeout: 15000 });
  return page.evaluate(() => [...document.querySelectorAll('#ft-charts-card .ft-chart-block')].map(b => {
    const ov = b.querySelector('.ft-chart-lockov');
    return !!ov && getComputedStyle(ov).display !== 'none';
  }));
}

// Both Reading and Pulse sit inside closed-by-default accordions (v222: "everything
// scattered open at once" was the whole thing that pass removed) — #ft-reading-body /
// .pulse-body are `display:none` until their own `.open` class is added by tapping the
// header. A locked/unlocked child's OWN computed `display` is correct even while its
// accordion is shut (that's just an inline style this version sets directly), but
// Playwright's `toBeVisible()` correctly also checks the ancestor chain — so these helpers
// open both accordions first, the same way a real person taps them, before any check that
// cares about on-screen visibility rather than the element's own style.
async function openReadingAndPulse(page) {
  await page.evaluate(() => { window.ftReadingToggle(); window.pulseToggle(); });
  await page.waitForTimeout(300);
}

// Never let a real test hit the real Gemini proxy (real cost, real quota, non-deterministic
// latency) — one fixture satisfies both Fortune's and Pulse's response shapes.
async function mockGemini(page) {
  await page.route(/cold-frog-d555/, (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      energy_reading: 'steady', state_read: 'neutral', near_prediction: 'x', far_prediction: 'x', watch_for: 'x', concern: '',
      reflection: 'x', if_continue: 'x', if_stop: 'x', achievement: 'x', recommendation: 'x'
    }) }] } }] })
  }));
}

test.describe('fortune/pulse/charts gates (v261)', () => {
  test('enforcement off: Reading, Pulse reflection and all 7 Insights charts stay unlocked', async ({ app }) => {
    await mockGemini(app.page);
    await app.boot();
    await app.page.evaluate(() => { localStorage.setItem('clv_plans_enforced', '0'); return window.clvRefreshPlan(); });
    await app.gotoTab({ nav: '.bnav-tab[data-tab="fortune"]' });
    await app.page.waitForTimeout(1500);
    const r = await app.page.evaluate(() => ({
      ftLocked: getComputedStyle(document.getElementById('ft-locked')).display,
      pulseLocked: getComputedStyle(document.getElementById('pulse-locked')).display
    }));
    expect(r.ftLocked).toBe('none');
    expect(r.pulseLocked).toBe('none');
    await app.page.evaluate(() => window.ftChartsToggle());
    const locked = await chartLockStates(app.page);
    expect(locked.length).toBe(7);
    expect(locked.some(Boolean)).toBe(false);
  });

  test('enforcement on, Free plan: Reading + Pulse reflection show the Pro upsell, only the first 2 charts stay unlocked', async ({ app }) => {
    await mockGemini(app.page);
    await app.boot();
    await app.page.evaluate(() => {
      // Pulse only renders its card at all once _shouldShow() sees >=1 chat summary — seed one so the
      // gate logic under test (not this unrelated precondition) is what actually gets exercised.
      localStorage.setItem('clv_chat_summaries', JSON.stringify([{ date: new Date().toISOString().slice(0, 10), summary: 'test' }]));
      localStorage.setItem('clv_plans_enforced', '1'); localStorage.setItem('clv_plan_override', 'free'); return window.clvRefreshPlan();
    });
    await app.gotoTab({ nav: '.bnav-tab[data-tab="fortune"]' });
    await app.page.waitForTimeout(1500);
    await openReadingAndPulse(app.page);
    await expect(app.page.locator('#ft-locked')).toBeVisible();
    await expect(app.page.locator('#ft-content')).toBeHidden();
    await expect(app.page.locator('#pulse-locked')).toBeVisible();
    // the instant, non-AI mood chip + metric cards are the "numbers" every plan gets — must stay visible even when the reflection paragraph is locked
    await expect(app.page.locator('#pulse-mood')).toBeVisible();

    await app.page.evaluate(() => window.ftChartsToggle());
    const locked = await chartLockStates(app.page);
    expect(locked).toEqual([false, false, true, true, true, true, true]);

    // tapping a locked chart's overlay opens the real upsell sheet, naming the next plan
    await app.page.evaluate(() => document.querySelectorAll('#ft-charts-card .ft-chart-block')[3].querySelector('.ft-chart-lockov').click());
    await expect(app.page.locator('#pl-sheet')).toHaveClass(/open/);
    await expect(app.page.locator('#pl-sh-t')).toContainText('every chart');

    // tapping the locked Reading card's own CTA opens the same upsell mechanism for ai_fortune_reading
    await app.page.evaluate(() => { document.getElementById('pl-sheet').classList.remove('open'); document.getElementById('ft-locked').querySelector('button').click(); });
    await expect(app.page.locator('#pl-sheet')).toHaveClass(/open/);
  });

  test('enforcement on, Pro plan: Reading, Pulse reflection and every chart stay unlocked', async ({ app }) => {
    await mockGemini(app.page);
    await app.boot();
    await app.page.evaluate(() => {
      localStorage.setItem('clv_chat_summaries', JSON.stringify([{ date: new Date().toISOString().slice(0, 10), summary: 'test' }]));
      localStorage.setItem('clv_plans_enforced', '1'); localStorage.setItem('clv_plan_override', 'pro'); return window.clvRefreshPlan();
    });
    await app.gotoTab({ nav: '.bnav-tab[data-tab="fortune"]' });
    await app.page.waitForTimeout(1500);
    await openReadingAndPulse(app.page);
    await expect(app.page.locator('#ft-locked')).toBeHidden();
    // pulse-mood visible proves the Pulse card itself actually rendered (not just trivially hidden
    // for the unrelated _shouldShow() reason) — so #pulse-locked being hidden really is the gate at work.
    await expect(app.page.locator('#pulse-mood')).toBeVisible();
    await expect(app.page.locator('#pulse-locked')).toBeHidden();
    await app.page.evaluate(() => window.ftChartsToggle());
    const locked = await chartLockStates(app.page);
    expect(locked.some(Boolean)).toBe(false);
  });
});

test.describe('chat limit unification (v261)', () => {
  test('clvChatLimit: not enforced reproduces the admin feature_gates answer; enforced returns the real plan number regardless of the old tier field', async ({ app }) => {
    // Must be registered BEFORE boot: window.SHEETS_DATA.feature_gates is populated once during the
    // app's own initial content fetch inside app.boot() and then read from that cached copy, never
    // re-fetched live — a route mock added after boot is too late and silently lets the REAL
    // production row (whatever the owner has it set to right now) leak through instead, which is
    // exactly what broke this test the moment the owner changed free's real limit from 20 to 8.
    await app.page.route(/\/rest\/v1\/feature_gates/, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ feature_key: 'clar_chat', tier: 'free', limit_count: 20, enabled: true }]) }));
    await app.boot();
    await app.page.evaluate(() => { localStorage.setItem('clv_subscription_tier', 'free'); localStorage.setItem('clv_plans_enforced', '0'); return window.clvRefreshPlan(); });
    await app.page.waitForTimeout(600);
    const notEnforced = await app.page.evaluate(() => window.clvChatLimit());
    expect(notEnforced).toBe(20); // the value the test mocks for feature_gates (see route above)

    await app.page.evaluate(() => { localStorage.setItem('clv_plans_enforced', '1'); localStorage.setItem('clv_plan_override', 'pro'); return window.clvRefreshPlan(); });
    await app.page.waitForTimeout(600);
    const enforcedPro = await app.page.evaluate(() => window.clvChatLimit());
    expect(enforcedPro).toBe(60); // real plan number — the old tier field (still 'free') is correctly ignored once enforced
  });
});

test.describe('account-delete feedback (T-107)', () => {
  async function openDanger(app) {
    await app.page.evaluate(() => openProfileTab());
    await app.page.waitForTimeout(1500);
    await app.page.evaluate(() => window.delAccOpen());
  }

  test('a short, skippable feedback screen shows before the real delete-confirm screen', async ({ app }) => {
    await app.boot();
    await openDanger(app);
    await expect(app.page.locator('#delfb-screen')).toBeVisible();
    await expect(app.page.locator('#delacc-screen')).toBeHidden();
    const chips = app.page.locator('#delfb-chips .delfb-chip');
    await expect(chips).toHaveCount(6);
    await chips.nth(2).click();
    await expect(chips.nth(2)).toHaveAttribute('data-on', '1');
    await chips.nth(2).click(); // tapping the same chip again deselects it
    await expect(chips.nth(2)).not.toHaveAttribute('data-on', '1');
  });

  test('Skip proceeds straight to the real delete-confirm screen without saving anything', async ({ app }) => {
    await app.boot();
    let hit = false;
    await app.page.route(/\/rest\/v1\/account_delete_feedback/, route => { hit = true; return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' }); });
    await openDanger(app);
    await app.page.evaluate(() => window.delFbSkip());
    await expect(app.page.locator('#delfb-screen')).toBeHidden();
    await expect(app.page.locator('#delacc-screen')).toBeVisible();
    expect(hit).toBe(false);
    // the real delete-confirm screen and its own DELETE-to-type guard are completely untouched
    await expect(app.page.locator('#delacc-go')).toBeDisabled();
    await app.page.fill('#delacc-input', 'DELETE');
    await expect(app.page.locator('#delacc-go')).toBeEnabled();
    await app.page.evaluate(() => window.delAccClose());
    await expect(app.page.locator('#delacc-screen')).toBeHidden();
  });

  test('Continue saves the chosen reason + message, then proceeds to the confirm screen', async ({ app }) => {
    await app.boot();
    let body = null;
    await app.page.route(/\/rest\/v1\/account_delete_feedback/, route => { body = route.request().postDataJSON(); return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' }); });
    await openDanger(app);
    await app.page.evaluate(() => { document.querySelectorAll('#delfb-chips .delfb-chip')[1].click(); document.getElementById('delfb-text').value = 'testing feedback'; });
    await app.page.evaluate(() => window.delFbContinue());
    await app.page.waitForTimeout(400);
    await expect(app.page.locator('#delacc-screen')).toBeVisible();
    expect(body).not.toBeNull();
    expect(body.message).toBe('testing feedback');
    expect(typeof body.reason).toBe('string');
  });

  test('a save failure (table not created yet) never blocks reaching the confirm screen', async ({ app }) => {
    await app.boot();
    await app.page.route(/\/rest\/v1\/account_delete_feedback/, route => route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"relation does not exist"}' }));
    await openDanger(app);
    await app.page.evaluate(() => { document.getElementById('delfb-text').value = 'x'; });
    await app.page.evaluate(() => window.delFbContinue());
    await app.page.waitForTimeout(400);
    await expect(app.page.locator('#delacc-screen')).toBeVisible();
    expect(app.pageErrors.length).toBe(0);
  });

  test('Cancel on the feedback screen closes the whole flow', async ({ app }) => {
    await app.boot();
    await openDanger(app);
    await app.page.evaluate(() => window.delFbClose());
    await expect(app.page.locator('#delfb-screen')).toBeHidden();
    await expect(app.page.locator('#delacc-screen')).toBeHidden();
  });
});
