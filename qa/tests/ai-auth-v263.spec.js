// v263 — T-101: every Clar AI call carries the member's Supabase session token (the proxy checks it when enforcement is on).
// The wrapper is installed at the top of <body> and only touches requests to the Gemini proxy URL.
const { test, expect } = require('./harness');
const AI = 'https://cold-frog-d555.smworkassistance.workers.dev/';

test.describe('AI calls carry the member session (v263)', () => {
  test('a Gemini proxy call sends the session token; the header is not sent to any other URL', async ({ app }) => {
    const seenAi = [];
    const seenOther = [];
    await app.page.route(AI, (route) => {
      seenAi.push(route.request().headers()['authorization'] || null);
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"candidates":[]}' });
    });
    await app.page.route('https://example.test/**', (route) => {
      seenOther.push(route.request().headers()['authorization'] || null);
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
    });
    await app.boot();
    await app.page.evaluate(() => {
      window._sbShared = { auth: { getSession: async () => ({ data: { session: { access_token: 'tok-test-123' } } }) } };
    });
    await app.page.evaluate((u) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }), AI);
    await app.page.evaluate(() => fetch('https://example.test/x', { method: 'GET' }));
    await app.page.waitForTimeout(400);
    expect(seenAi[seenAi.length - 1]).toBe('Bearer tok-test-123');
    expect(seenOther[seenOther.length - 1]).toBeNull();
  });

  test('no session yet: the call still goes out (the proxy decides), without a header, and the caller gets its response', async ({ app }) => {
    const seenAi = [];
    await app.page.route(AI, (route) => {
      seenAi.push(route.request().headers()['authorization'] || null);
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"candidates":[{"content":{"parts":[{"text":"{}"}]}}]}' });
    });
    await app.boot();
    await app.page.evaluate(() => {
      window._sbShared = { auth: { getSession: async () => ({ data: { session: null } }) } };
    });
    const status = await app.page.evaluate((u) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => r.status), AI);
    await app.page.waitForTimeout(300);
    expect(status).toBe(200);
    expect(seenAi[seenAi.length - 1]).toBeNull();
  });
});
