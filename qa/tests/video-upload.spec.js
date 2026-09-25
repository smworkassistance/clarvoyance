// T-011 — video upload must never look stuck. Mock Worker + a throttled mock tus (Bunny) server; real mp4 fixture; real app UI.
const path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const SAMPLE = path.join(__dirname, '..', 'fixtures', 'sample.mp4');
const GUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': 'Location,Upload-Offset,Upload-Length,Tus-Resumable', 'tus-resumable': '1.0.0' };

// Mocks the relay Worker and Bunny's tus endpoint. opts.patchDelayMs slows every chunk; opts.workerFail = number of initial Worker 429s.
async function mockUploadBackend(page, opts = {}) {
  const st = { workerCalls: 0, patches: 0, offset: 0, total: 0, base: '' };
  await page.route('https://clar-bunny.smworkassistance.workers.dev/**', async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...CORS } });
    st.workerCalls++;
    if (st.workerCalls <= (opts.workerFail || 0)) return route.fulfill({ status: 429, headers: { ...JSON_H }, body: JSON.stringify({ error: 'Daily video limit reached — try again tomorrow' }) });
    return route.fulfill({ status: 200, headers: { ...JSON_H }, body: JSON.stringify({ guid: GUID, endpoint: st.base, headers: { AuthorizationSignature: 'sig', AuthorizationExpire: '9999999999', VideoId: GUID, LibraryId: '1' } }) });
  });
  // a REAL local tus server (Playwright's request interception can hang on streamed PATCH bodies) — same protocol subset Bunny speaks
  const http = require('http');
  const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Expose-Headers': 'Location,Upload-Offset,Upload-Length,Tus-Resumable', 'Tus-Resumable': '1.0.0' };
  const srv = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
    if (req.method === 'POST') { st.total = Number(req.headers['upload-length'] || 0); st.offset = 0; res.writeHead(201, { ...H, Location: st.base + '/up1' }); return res.end(); }
    if (req.method === 'HEAD') { res.writeHead(200, { ...H, 'Upload-Offset': String(st.offset), 'Upload-Length': String(st.total) }); return res.end(); }
    if (req.method === 'PATCH') {
      let n = 0; req.on('data', c => { n += c.length; });
      req.on('end', () => setTimeout(() => { st.patches++; st.offset += n; res.writeHead(204, { ...H, 'Upload-Offset': String(st.offset) }); res.end(); }, opts.patchDelayMs || 300));
      return;
    }
    res.writeHead(405, H); res.end();
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  st.base = 'http://127.0.0.1:' + srv.address().port + '/tusupload';
  srv.unref(); st.close = () => srv.close();
  return st;
}

// Playwright's Chromium ships without H.264, so it cannot read the mp4's metadata (real Chrome/Safari can).
// This makes ONLY the app's metadata probe of a picked file succeed with a 12 s duration; the file bytes uploaded are still the real mp4.
const FAKE_PROBE = () => {
  const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  Object.defineProperty(HTMLMediaElement.prototype, 'src', { configurable: true, get: d.get, set(v) {
    d.set.call(this, v);
    if (String(v).startsWith('blob:') && this.preload === 'metadata' && !this.isConnected) {
      this.onerror = null; this.__fakeDur = true;
      setTimeout(() => this.dispatchEvent(new Event('loadedmetadata')), 30);
    }
  } });
  const dd = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration');
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get() { return this.__fakeDur ? 12 : dd.get.call(this); } });
};

async function openComposeWithVideo(app, message) {
  const { page } = app;
  await page.addInitScript(FAKE_PROBE);
  await app.boot();
  // no real login inside the isolated test network: give the app a fake access token to send to the (mocked) Worker
  await page.evaluate(() => { window._sbShared.auth.getSession = async () => ({ data: { session: { access_token: 'qa-token' } } }); });
  await page.evaluate(() => { SOC._cfg.chunkSize = 131072; }); // 128 KB chunks → ~9 chunks for the 1.1 MB sample
  await page.evaluate(() => SOC.openCreatePost());
  await page.waitForSelector('#soc-vid-file', { state: 'attached', timeout: 20000 });
  await page.setInputFiles('#soc-vid-file', SAMPLE);
  await expect(page.locator('#soc-vid-preview .soc-vid-pv')).toBeVisible({ timeout: 15000 });
  await page.fill('#soc-ach-msg', message || 'qa video post');
}

test.describe('video upload (T-011)', () => {
  test('progress moves on every chunk, sheet closes at once, exactly one post is created', async ({ app }) => {
    const { page } = app;
    const { inserts } = await mockCommunity(page);
    const st = await mockUploadBackend(page, { patchDelayMs: 350 });
    await openComposeWithVideo(app);
    await page.click('[data-act="post-achievement"]');
    // (a) sheet gone and chip visible almost immediately
    await expect(page.locator('#soc-upchip')).toBeVisible({ timeout: 1500 });
    expect(await page.evaluate(() => document.getElementById('soc-sheet-host').innerHTML.trim())).toBe('');
    // (b) sample the chip: >= 5 distinct, non-decreasing percentages
    const seen = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      const txt = await page.evaluate(() => { const e = document.getElementById('uc-t'); return e ? e.textContent : null; });
      if (txt === null) break; // chip removed = finished
      const m = txt.match(/(\d+)%/); if (m) seen.push(Number(m[1]));
      await page.waitForTimeout(120);
    }
    const distinct = [...new Set(seen)];
    expect(distinct.length, 'distinct % values seen: ' + distinct.join(',')).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < seen.length; i++) expect(seen[i], 'progress never goes backwards').toBeGreaterThanOrEqual(seen[i - 1]);
    // (c) chip removed and exactly one insert with the video guid
    await expect(page.locator('#soc-upchip')).toHaveCount(0);
    expect(inserts.length).toBe(1);
    expect(inserts[0].video && inserts[0].video.guid).toBe(GUID);
    expect(st.patches).toBeGreaterThanOrEqual(5);
  });

  test('cancel mid-upload removes the chip and creates no post', async ({ app }) => {
    const { page } = app;
    const { inserts } = await mockCommunity(page);
    await mockUploadBackend(page, { patchDelayMs: 1200 });
    await openComposeWithVideo(app);
    await page.click('[data-act="post-achievement"]');
    await expect(page.locator('#uc-t')).toContainText('%', { timeout: 15000 });
    await page.click('#soc-upchip [data-uc="cancel"]');
    await expect(page.locator('#soc-upchip')).toHaveCount(0);
    await page.waitForTimeout(4000);
    expect(inserts.length).toBe(0);
    expect(await page.evaluate(() => window._socUpload.get())).toBeNull();
  });

  test('Worker refusal shows its message with Try again / Dismiss, and Try again succeeds', async ({ app }) => {
    const { page } = app;
    const { inserts } = await mockCommunity(page);
    await mockUploadBackend(page, { workerFail: 1, patchDelayMs: 150 });
    await openComposeWithVideo(app);
    await page.click('[data-act="post-achievement"]');
    await expect(page.locator('#uc-t')).toContainText('Daily video limit reached', { timeout: 10000 });
    await expect(page.locator('#soc-upchip [data-uc="retry"]')).toBeVisible();
    await expect(page.locator('#soc-upchip [data-uc="dismiss"]')).toBeVisible();
    await page.click('#soc-upchip [data-uc="retry"]');
    await expect(page.locator('#soc-upchip')).toHaveCount(0, { timeout: 30000 });
    expect(inserts.length).toBe(1);
  });

  test('a long gap without progress shows the slow-connection notice', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page);
    await mockUploadBackend(page, { patchDelayMs: 25000 });
    await openComposeWithVideo(app);
    await page.click('[data-act="post-achievement"]');
    await expect(page.locator('#uc-t')).toContainText(/[1-9]\d*%/, { timeout: 20000 });
    await page.evaluate(() => { const u = window._socUpload.get(); u.lastProg = Date.now() - 30000; }); // simulate 30 s of silence
    await expect(page.locator('#uc-t')).toContainText('slow connection', { timeout: 5000 });
    await page.evaluate(() => window._socUpload.cancel());
  });

  test('picking a video shows its size and length', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page);
    await openComposeWithVideo(app);
    await expect(page.locator('#soc-ach-hint')).toContainText(/MB · \d+ s/);
  });
});
