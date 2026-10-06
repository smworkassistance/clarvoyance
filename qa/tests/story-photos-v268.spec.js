// v268 — New Story holds the story's photos (the old vision images, now in a triple grid), the goals' photos read-only,
// the story's own audio bar, and the Vision folder is gone from the Goal tab. Right swipe goes back.
const { test, expect } = require('./harness');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('v268 New Story', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(png => {
      if (!localStorage.getItem('clv_v268_seeded')) {
        localStorage.setItem('c9_vis', JSON.stringify([{ src: png, note: 'calm mornings' }, { src: png, note: '' }]));
        localStorage.setItem('c9_goal', JSON.stringify('I drive my white Range Rover through the mountains.'));
        localStorage.setItem('clv_v268_seeded', '1');
      }
    }, PNG);
    await page.route(/vision-images|goal-item-images/, r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PNG.split(',')[1], 'base64') }));
  });

  test('no Vision folder on the Goal tab; New Story shows its photos in a triple grid and the story text', async ({ app }) => {
    await app.boot();
    await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
    await app.page.waitForSelector('#v264-root .v266-tile[data-act="story"]', { state: 'visible', timeout: 15000 });
    expect(await app.page.locator('#v264-root .v266-tile[data-act="vision"]').count()).toBe(0);
    await app.page.locator('#v264-root .v266-tile[data-act="story"]').click();
    await app.page.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    expect(await app.page.locator('textarea[data-field="story"]').inputValue()).toMatch(/Range Rover/);
    expect(await app.page.locator('#v266-pgrid .v266-p:not(.v266-plus)').count()).toBe(2);
    expect(await app.page.locator('#v266-pgrid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
    expect(app.pageErrors).toEqual([]);
  });

  test('story audio bar appears inside New Story (record prompt when there is no audio) and hides on back', async ({ app }) => {
    await app.boot();
    await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
    await app.page.waitForSelector('#v264-root .v266-tile[data-act="story"]', { state: 'visible', timeout: 15000 });
    await app.page.locator('#v264-root .v266-tile[data-act="story"]').click();
    await app.page.waitForSelector('#v266-bar.open', { state: 'visible' });
    expect(await app.page.locator('#v266-bar-name').innerText()).toBe('New Story');
    expect(await app.page.locator('#v266-bar-rec').isVisible()).toBe(true);
    await app.page.locator('#v264-root [data-act="back"]').click();
    await app.page.waitForTimeout(300);
    expect(await app.page.locator('#v266-bar.open').count()).toBe(0);
    expect(app.pageErrors).toEqual([]);
  });

  test('right swipe on a goal page goes back to the list', async ({ app }) => {
    await app.boot();
    await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
    await app.page.waitForSelector('#v264-root .v266-tile[data-act="story"]', { state: 'visible', timeout: 15000 });
    await app.page.locator('#v264-root .v266-tile[data-act="story"]').click();
    await app.page.waitForSelector('#v266-pgrid', { state: 'visible' });
    // start on the top bar (not on a text field, where a swipe is ignored on purpose)
    const bar = await app.page.locator('#v264-root .v266-top').boundingBox();
    await app.page.mouse.move(bar.x + 60, bar.y + bar.height / 2);
    await app.page.mouse.down();
    await app.page.mouse.move(bar.x + 240, bar.y + bar.height / 2 + 4, { steps: 10 });
    await app.page.mouse.up();
    await app.page.waitForTimeout(400);
    expect(await app.page.locator('#v264-root .v266-tile[data-act="story"]').count()).toBe(1);
    expect(app.pageErrors).toEqual([]);
  });
});
