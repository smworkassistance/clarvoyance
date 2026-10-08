// v266 — Goal tab: New Story (with the story text on the tile), Vision folder, goal folders, goal top bar with the goal
// name, a photo grid with no thumbnail hero, settings sheet, create-goal with category last, endless viewer swipe,
// move left/right inside the list, and no sideways page pan on mobile. Supabase writes are isolated by the harness.
const { test, expect } = require('./harness');

// tiny real PNG so <img> elements actually decode
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const SEED_GOALS = [
  { id: 'g_seed_1', remoteId: null, title: 'Get my first 10 coaching clients',
    images: [{ src: PNG, note: 'one' }, { src: PNG, note: 'two' }, { src: PNG, note: 'three' }],
    date_set: '2026-09-01T00:00:00.000Z', achieved: false, date_achieved: null, visibility: 'private',
    details: { category: 'Business', target_date: '2027-03-31', why: 'Freedom to choose my work', feel: 'calm and proud', listens: 0 } },
  { id: 'g_seed_2', remoteId: null, title: 'Repair things with my family', images: [],
    date_set: '2026-09-02T00:00:00.000Z', achieved: false, date_achieved: null, visibility: 'private',
    details: { category: 'Relationships', listens: 0 } }
];
const STORY = 'I drive my white Range Rover through the mountains, and I live by the sea with the people I love.';

async function openGoalTab(app) {
  await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
  await app.page.waitForSelector('#v264-root .v266-tile, #v264-root .v266-tile', { state: 'visible', timeout: 15000 });
}

test.describe('v266 Goal tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ seed, story }) => {
      if (!localStorage.getItem('clv_v266_seeded')) {
        localStorage.setItem('clv_goal_items', JSON.stringify(seed));
        localStorage.setItem('c9_goal', JSON.stringify(story));
        localStorage.setItem('clv_v266_seeded', '1');
      }
    }, { seed: SEED_GOALS, story: STORY });
    // the startup migration uploads base64 photos to Storage; the harness fakes that write, so serve a real PNG
    await page.route(/goal-item-images|vision-images/, r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PNG.split(',')[1], 'base64') }));
  });

  test('list: no "Goals" heading; New Story shows its story text; goal folders in 2 columns with a theme-colored hairline gap', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    expect(await p.locator('#v264-root', { hasText: /^Goals$/m }).count()).toBe(0);
    const sub = await p.locator('#v264-root .v266-tile[data-act="story"] .v266-tile-sub').innerText();
    expect(sub).toMatch(/I drive my white Range Rover/);
    const grid = p.locator('#v264-root .v266-grid').first();
    expect(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
    /* v271: owner's explicit ask — "Discover jaisi fine line separator Goal
       section ki images/categories mein bhi" — the folder/photo grids now
       use the same 2px theme-colored hairline the Discover grid already
       has, instead of a literal zero gap. */
    expect(await grid.evaluate(el => getComputedStyle(el).rowGap + ' ' + getComputedStyle(el).columnGap)).toBe('2px 2px');
    await p.screenshot({ path: 'test-results/v266-list.png', fullPage: true });
    expect(app.pageErrors).toEqual([]);
  });

  test('goal: top bar shows the goal name, the photo grid is shown straight away (no hero), no sideways pan on mobile', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v266-tile[data-act="goal"]').first().click();
    await p.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    expect(await p.locator('#v264-root .v266-top-t').inputValue()).toBe('Get my first 10 coaching clients');
    expect(await p.locator('#v264-hero').count()).toBe(0);
    expect(await p.locator('#v266-pgrid .v266-p:not(.v266-plus)').count()).toBe(3);
    expect(await p.locator('#v266-pgrid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
    // the whole page must not pan sideways (the "website slide" on mobile)
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await p.screenshot({ path: 'test-results/v266-goal.png', fullPage: true });
    expect(app.pageErrors).toEqual([]);
  });

  test('details: on the page below the photos (no inline fields in a sheet); edit saves; ⋯ sheet has delete', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v266-tile[data-act="goal"]').first().click();
    await p.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    // the details live under the photo grid, on the page
    const why = p.locator('#v264-root textarea[data-sf="why"]');
    expect(await why.count()).toBe(1);
    expect(await why.inputValue()).toBe('Freedom to choose my work');
    await why.fill('Freedom to choose my work and my time');
    await why.blur();
    await p.waitForTimeout(300);
    const d = await p.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g_seed_1').details);
    expect(d.why).toBe('Freedom to choose my work and my time');
    expect(d.category).toBe('Business');
    // the ⋯ menu holds the delete action
    await p.locator('#v264-root [data-act="settings"]').click();
    await p.waitForSelector('#v266-sheet.open [data-act="delete-goal"]', { state: 'visible' });
    await p.locator('#v266-sheet [data-act="sheet-done"]').click();
    await p.waitForTimeout(200);
    expect(await p.locator('#v266-sheet.open').count()).toBe(0);
    expect(app.pageErrors).toEqual([]);
  });

  test('create: title + date + why + feel first, category last; the goal opens with its name on top', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v266-tile[data-act="new"]').click();
    await p.waitForSelector('input[data-new="title"]', { state: 'visible' });
    // category is the last block of the form
    const order = await p.locator('#v264-root .v266-pad').evaluate(el => [...el.children].map(c => c.tagName + ':' + (c.getAttribute('data-new') || c.getAttribute('data-act') || c.className)));
    expect(order.slice(-2)[0]).toMatch(/chips/);
    await p.locator('input[data-new="title"]').fill('Learn Spanish');
    await p.locator('textarea[data-new="why"]').fill('To travel with ease');
    await p.locator('[data-act="new-cat"][data-cat="Learning"]').click();
    await p.locator('[data-act="create"]').click();
    await p.waitForSelector('#v264-root .v266-top-t', { state: 'visible' });
    expect(await p.locator('#v264-root .v266-top-t').inputValue()).toBe('Learn Spanish');
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.title === 'Learn Spanish').details);
    expect(saved.category).toBe('Learning');
    expect(saved.why).toBe('To travel with ease');
    expect(app.pageErrors).toEqual([]);
  });

  test('viewer: swipe past the last photo wraps to the first (endless); Move right changes the photo order', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v266-tile[data-act="goal"]').first().click();
    await p.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    await p.locator('#v266-pgrid .v266-p').nth(2).click();
    await p.waitForSelector('#v266-vw', { state: 'visible' });
    expect(await p.locator('#v266-vw-cnt').innerText()).toBe('3 / 3');
    // swipe left on the last photo -> wraps to the first
    const box = await p.locator('#v266-vw-track').boundingBox();
    await p.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 8 });
    await p.mouse.up();
    await p.waitForTimeout(600);
    expect(await p.locator('#v266-vw-cnt').innerText()).toBe('1 / 3');
    // move the first photo to the right: the order of the goal's photos changes, and it is saved
    await p.locator('#v266-vw-right').click();
    await p.waitForTimeout(300);
    expect(await p.locator('#v266-vw-cnt').innerText()).toBe('2 / 3');
    const notes = await p.evaluate(() => JSON.parse(localStorage.getItem('clv_goal_items')).find(g => g.id === 'g_seed_1').images.map(i => i.note));
    expect(notes).toEqual(['two', 'one', 'three']);
    expect(app.pageErrors).toEqual([]);
  });

  test('audio bar: inside a goal it shows the record prompt (no audio yet), no autoplay, no audio element on the page', async ({ app }) => {
    await app.boot();
    await openGoalTab(app);
    const p = app.page;
    await p.locator('#v264-root .v266-tile[data-act="goal"]').first().click();
    await p.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    await p.waitForSelector('#v266-bar.open', { state: 'visible' });
    expect(await p.locator('#v266-bar-rec').isVisible()).toBe(true);
    expect(await p.locator('#v266-bar-play').isVisible()).toBe(false);
    expect(await p.evaluate(() => document.querySelectorAll('audio').length)).toBe(0);
    // back to the list hides the bar again
    await p.locator('#v264-root [data-act="back"]').click();
    await p.waitForSelector('#v264-root .v266-tile', { state: 'visible' });
    expect(await p.locator('#v266-bar.open').count()).toBe(0);
    expect(app.pageErrors).toEqual([]);
  });
});
