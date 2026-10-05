// v264 — Goal tab redesign: New Story tile + goal folders (2 per row, centred white category text),
// achieved goals in their own grid, full-bleed goal detail, 3-column photo grid, full-screen viewer
// (swipe down closes, wheel/pinch zoom, sideways swipe changes photo), story text saved through the
// existing saveGoal path, achieve moves a goal to the Achieved grid. Supabase writes are isolated by the harness.
const { test, expect } = require('./harness');

// tiny 1x1 PNG used as a stand-in photo (real bytes, so the viewer's <img> actually loads)
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const SEED_GOALS = [
  { id: 'g_seed_1', remoteId: null, title: 'Get my first 10 coaching clients', images: [{ src: PNG }, { src: PNG }, { src: PNG }],
    date_set: '2026-09-01T00:00:00.000Z', achieved: false, date_achieved: null, visibility: 'private',
    details: { category: 'Business', target_date: '2027-03-31', why: 'Freedom to choose my work', feel: 'calm and proud', listens: 0 } },
  { id: 'g_seed_2', remoteId: null, title: 'Repair things with my family', images: [],
    date_set: '2026-09-02T00:00:00.000Z', achieved: false, date_achieved: null, visibility: 'private',
    details: { category: 'Relationships', listens: 0 } },
  { id: 'g_seed_3', remoteId: null, title: 'Run a 10k', images: [{ src: PNG }],
    date_set: '2026-08-01T00:00:00.000Z', achieved: true, date_achieved: '2026-09-20T00:00:00.000Z', visibility: 'private',
    details: { category: 'Health', listens: 0 } }
];

async function openGoalTab(app) {
  await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
  await app.page.waitForSelector('#v264-root .v264-tile', { state: 'visible', timeout: 15000 });
}

test.describe('v264 Goal tab', () => {
  test.beforeEach(async ({ page }) => {
    // seed once, before the app boots, so reloads keep the same data
    await page.addInitScript(seed => {
      if (!localStorage.getItem('clv_v264_seeded')) {
        localStorage.setItem('clv_goal_items', JSON.stringify(seed));
        localStorage.setItem('c9_goal', JSON.stringify('I drive my white Range Rover through the mountains.'));
        localStorage.setItem('clv_v264_seeded', '1');
      }
    }, SEED_GOALS);
  });

  test('list: New Story tile + goal folders (2 per row, centred category text), achieved grid below, no legacy headings', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    // story tile + 2 active goals + add tile in the active grid
    expect(await p.locator('#v264-root .v264-grid').first().locator('.v264-tile').count()).toBe(4);
    // active grid is 2 columns
    const cols = await p.locator('#v264-root .v264-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(2);
    // centred white category text on the goal folder
    const big = await p.locator('#v264-root .v264-tile .v264-tile-big').nth(1).evaluate(el => ({ text: el.textContent, color: getComputedStyle(el).color }));
    expect(big.text).toBe('Business');
    expect(big.color).toBe('rgb(255, 255, 255)');
    // achieved goal lives in its own grid under the Achieved heading
    expect(await p.locator('#v264-root .v264-sec').innerText()).toMatch(/Achieved/);
    expect(await p.locator('#v264-root .v264-grid').nth(1).locator('.v264-tile.ach').count()).toBe(1);
    // the old Major Definite Goal heading and the old Goal Items card list are not visible any more
    expect(await p.locator('text=Major Definite Goal').count() === 0 || await p.locator('text=Major Definite Goal').first().isHidden()).toBeTruthy();
    expect(await p.locator('#goal-items-body').isVisible()).toBe(false);
    expect(await p.locator('#vis-grid').isVisible()).toBe(false);
    expect(await p.locator('#goal-yt-strip').isVisible()).toBe(false);
    await p.screenshot({ path: 'test-results/v264-list.png', fullPage: true });
    expect(app.pageErrors).toEqual([]);
  });

  test('detail: full-bleed hero, editable fields persist, achieve moves the goal to the Achieved grid', async ({ app }) => {
    await app.page.route(/goal-item-images/, r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PNG.split(',')[1], 'base64') }));
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v264-tile', { hasText: 'Get my first 10' }).click();
    await p.waitForSelector('#v264-hero', { state: 'visible' });
    // 3-column photo grid of 3 photos, cover badge on the first
    expect(await p.locator('#v264-pgrid .v264-p').count()).toBe(3);
    expect(await p.locator('#v264-pgrid .v264-cov').count()).toBe(1);
    expect(await p.locator('#v264-pgrid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
    // why/feel fields show saved values
    expect(await p.locator('textarea[data-field="why"]').inputValue()).toBe('Freedom to choose my work');
    // editing the why saves to the goal's details
    await p.locator('textarea[data-field="why"]').fill('Freedom to choose my work and my time');
    await p.locator('textarea[data-field="why"]').blur();
    await p.waitForTimeout(300);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g_seed_1').details.why);
    expect(saved).toBe('Freedom to choose my work and my time');
    // achieve
    await p.locator('[data-act="achieve"]').click();
    await p.waitForTimeout(300);
    const achieved = await p.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g_seed_1').achieved);
    expect(achieved).toBe(true);
    expect(await p.locator('[data-act="share"]').count()).toBe(1);
    // photo thumbnails must really decode (not broken icons)
    await p.locator('#v264-pgrid').scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await p.waitForFunction(() => [...document.querySelectorAll('#v264-pgrid img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 8000 });
    await p.screenshot({ path: 'test-results/v264-detail.png', fullPage: true });
    expect(app.pageErrors).toEqual([]);
  });

  test('viewer: tap opens full screen, wheel zooms, swipe down closes (no close button), sideways swipe changes photo', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v264-tile', { hasText: 'Get my first 10' }).click();
    await p.waitForSelector('#v264-pgrid .v264-p');
    await p.locator('#v264-pgrid .v264-p').nth(0).click();
    await p.waitForSelector('#v264-vw', { state: 'visible' });
    expect(await p.locator('#v264-vw-cnt').innerText()).toBe('1 / 3');
    // no close button exists
    expect(await p.locator('#v264-vw button', { hasText: /close|×|✕/i }).count()).toBe(0);
    // wheel zoom (desktop path of the same zoom model used by pinch)
    const box = await p.locator('#v264-vw-track').boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.wheel(0, -300);
    await p.waitForTimeout(200);
    const tf = await p.locator('#v264-vw-img').evaluate(el => el.style.transform);
    expect(tf).toMatch(/scale\((?!1\))/);
    // reset zoom with a double tap, then sideways swipe to the next photo
    await p.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(350);
    await p.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2, { steps: 8 });
    await p.mouse.up();
    await p.waitForTimeout(600);
    expect(await p.locator('#v264-vw-cnt').innerText()).toBe('2 / 3');
    // swipe down closes the viewer
    const b2 = await p.locator('#v264-vw-track').boundingBox();
    await p.mouse.move(b2.x + b2.width / 2, b2.y + 120);
    await p.mouse.down();
    await p.mouse.move(b2.x + b2.width / 2, b2.y + 420, { steps: 10 });
    await p.mouse.up();
    await p.waitForTimeout(500);
    expect(await p.locator('#v264-vw').isVisible()).toBe(false);
    expect(await p.locator('#v264-pgrid .v264-p').count()).toBe(3);
    expect(app.pageErrors).toEqual([]);
  });

  test('story: tile opens the story; text saves through the existing goal field', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v264-tile[data-act="story"]').click();
    await p.waitForSelector('textarea[data-field="story"]', { state: 'visible' });
    expect(await p.locator('textarea[data-field="story"]').inputValue()).toBe('I drive my white Range Rover through the mountains.');
    await p.locator('textarea[data-field="story"]').fill('I drive my white Range Rover and live by the sea.');
    await p.locator('textarea[data-field="story"]').blur();
    await p.waitForTimeout(300);
    expect(await p.evaluate(() => JSON.parse(localStorage.getItem('c9_goal')))).toBe('I drive my white Range Rover and live by the sea.');
    // back returns to the grid
    await p.locator('#v264-root [data-act="back"]').click();
    await p.waitForSelector('#v264-root .v264-tile', { state: 'visible' });
    expect(app.pageErrors).toEqual([]);
  });

  test('new goal: category chips + title create a goal that appears as a folder', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v264-tile.v264-add').click();
    await p.locator('input[data-new="title"]').fill('Learn Spanish');
    await p.locator('[data-act="new-cat"][data-cat="Learning"]').click();
    await p.locator('[data-act="create"]').click();
    await p.waitForSelector('textarea[data-field="why"]', { state: 'visible' });
    expect(await p.locator('input[data-field="title"]').inputValue()).toBe('Learn Spanish');
    expect(await p.locator('#v264-hero-cat').innerText()).toBe('Learning');
    await p.locator('#v264-root [data-act="back"]').click();
    await p.waitForSelector('#v264-root .v264-tile', { state: 'visible' });
    expect(await p.locator('#v264-root .v264-tile', { hasText: 'Learn Spanish' }).count()).toBe(1);
    expect(app.pageErrors).toEqual([]);
  });
});
