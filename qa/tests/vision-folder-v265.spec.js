// v265 — the Vision folder on the Goal tab: the existing vision images (c9_vis / S.visImgs) appear again as a folder,
// open as a 3-column grid, and open full screen. Nothing from the old Goal strip is lost in the redesign.
const { test, expect } = require('./harness');

// tiny real PNG so the viewer's <img> actually decodes
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test.describe('v265 Vision folder', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(png => {
      if (!localStorage.getItem('clv_v265_seeded')) {
        // c9_vis is JSON-encoded (the app's own get()/put() helpers)
        localStorage.setItem('c9_vis', JSON.stringify([{ src: png, note: 'calm mornings' }, { src: png, note: '' }]));
        localStorage.setItem('clv_v265_seeded', '1');
      }
    }, PNG);
  });

  test('Vision folder appears with the existing photos; opens a grid; a photo opens full screen', async ({ app }) => {
    // the startup migration uploads base64 vision images to Storage; the harness fakes that write, so serve a real PNG for the public URL
    await app.page.route(/vision-images/, r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PNG.split(',')[1], 'base64') }));
    await app.boot();
    const p = app.page;
    await app.gotoTab({ nav: '.bnav-tab[data-tab="goal"]' });
    await p.waitForSelector('#v264-root .v266-tile[data-act="vision"]', { state: 'visible', timeout: 15000 });
    expect(await p.locator('#v264-root .v266-tile[data-act="vision"] .v266-tile-sub').innerText()).toBe('2 photos');
    await p.locator('#v264-root .v266-tile[data-act="vision"]').click();
    await p.waitForSelector('#v266-pgrid .v266-p', { state: 'visible' });
    // 2 photos + the dashed "Add photos" tile; photos are two per row
    expect(await p.locator('#v266-pgrid .v266-p:not(.v266-plus)').count()).toBe(2);
    expect(await p.locator('#v266-pgrid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
    // photos really decode
    await p.locator('#v266-pgrid').scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await p.waitForFunction(() => [...document.querySelectorAll('#v266-pgrid img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 8000 });
    await p.locator('#v266-pgrid .v266-p').nth(0).click();
    await p.waitForSelector('#v266-vw', { state: 'visible' });
    expect(await p.locator('#v266-vw-cnt').innerText()).toBe('1 / 2');
    // vision images are view-only here: no caption input and no cover button
    expect(await p.locator('#v266-vw-note').isVisible()).toBe(false);
    expect(await p.locator('#v266-vw-cover').isVisible()).toBe(true); // v266: cover and move work for vision photos too
    // swipe down closes back to the Vision grid
    const box = await p.locator('#v266-vw-track').boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + 120);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width / 2, box.y + 420, { steps: 10 });
    await p.mouse.up();
    await p.waitForTimeout(500);
    expect(await p.locator('#v266-vw').isVisible()).toBe(false);
    expect(await p.locator('#v266-pgrid .v266-p:not(.v266-plus)').count()).toBe(2);
    expect(app.pageErrors).toEqual([]);
  });
});
