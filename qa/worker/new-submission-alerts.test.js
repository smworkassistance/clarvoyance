// v262-follow-up — checkNewSubmissionsTick() in workers/admin-relay-worker.js, run against its
// REAL code with fetch() mocked (Supabase REST + Resend). Run: node qa/worker/new-submission-alerts.test.js
const fs = require('fs');
const path = require('path');
const os = require('os');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const DB = {};
let emailsSent = [];
function reset() {
  DB.admin_alert_log = [];
  DB.upgrade_requests = []; DB.landing_feedback = []; DB.landing_leads = []; DB.scholarship_applications = []; DB.account_delete_feedback = [];
  emailsSent = [];
}

globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });
  if (url === 'https://api.resend.com/emails') {
    emailsSent.push(JSON.parse(init.body));
    return json({ id: 'email-' + emailsSent.length });
  }
  if (url.startsWith('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/')) {
    const rest = url.slice('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/'.length);
    const table = rest.split('?')[0], qs = new URLSearchParams(rest.split('?')[1] || '');
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    if (method === 'GET') {
      let rows = (DB[table] || []).slice();
      for (const [k, v] of qs) {
        if (['select', 'order', 'limit'].includes(k)) continue;
        const eq = v.match(/^eq\.(.*)$/); if (eq) rows = rows.filter((r) => String(r[k]) === eq[1]);
        const gt = v.match(/^gt\.(.*)$/); if (gt) rows = rows.filter((r) => r[k] > decodeURIComponent(gt[1]));
      }
      const ord = qs.get('order');
      if (ord === 'created_at.asc') rows.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
      if (qs.get('limit')) rows = rows.slice(0, +qs.get('limit'));
      return json(rows);
    }
    if (method === 'POST') {
      // admin_alert_log upsert (on_conflict=key, merge-duplicates)
      const existing = DB[table].find((r) => r.key === body.key);
      if (existing) Object.assign(existing, body); else DB[table].push({ ...body });
      return json([body]);
    }
    throw new Error('unmocked method ' + method + ' on ' + table);
  }
  throw new Error('unmocked fetch: ' + url);
};

(async () => {
  const tmp = path.join(os.tmpdir(), 'arw-newsub-' + Date.now() + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'workers', 'admin-relay-worker.js'), tmp);
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  const W = mod.default;
  const envWithSecrets = { ADMIN_TOKEN: 'ADM', SUPABASE_SERVICE_KEY: 'svc', RESEND_API_KEY: 'resend_key', ADMIN_ALERT_EMAIL: 'owner@example.com' };
  const envNoSecrets = { ADMIN_TOKEN: 'ADM', SUPABASE_SERVICE_KEY: 'svc' };

  // Call scheduled() directly -- same entry point the real Cron Trigger hits. scheduled()
  // itself does NOT await ctx.waitUntil's promise (that's the whole point of waitUntil in a
  // real Worker), so the test's own waitUntil must capture the promise and await it here,
  // or every assertion below would run before the tick's actual work has finished.
  const tick = async (env) => {
    let captured;
    await W.scheduled({}, env, { waitUntil: (p) => { captured = p; } });
    await captured;
  };

  // ── secrets configured: a new upgrade_request produces exactly one email, cursor advances ──
  reset();
  DB.upgrade_requests.push({ user_id: 'u1', product_id: 'clar', plan_id: 'plus', utr: '123456789012', note: 'paid via GPay', created_at: new Date().toISOString() });
  await tick(envWithSecrets);
  ok(emailsSent.length === 1, 'exactly one email sent for one new upgrade request: ' + emailsSent.length);
  ok(emailsSent[0].subject.includes('upgrade request') && emailsSent[0].text.includes('123456789012'), 'email mentions the UTR: ' + JSON.stringify(emailsSent[0]));
  const cursor1 = DB.admin_alert_log.find((r) => r.key === 'newcheck:upgrade_requests');
  ok(!!cursor1 && cursor1.last_sent_at, 'cursor advanced after a successful send');

  // ── a second tick with no new rows sends nothing more ──
  emailsSent = [];
  await tick(envWithSecrets);
  ok(emailsSent.length === 0, 'no new rows -> no email on the next tick');

  // ── a genuinely new row (after the cursor) gets its own, separate email ──
  DB.upgrade_requests.push({ user_id: 'u2', product_id: 'clar', plan_id: 'pro', utr: '987654321098', note: null, created_at: new Date(Date.now() + 1000).toISOString() });
  await tick(envWithSecrets);
  ok(emailsSent.length === 1 && emailsSent[0].text.includes('987654321098'), 'a later new row is picked up on the next tick: ' + JSON.stringify(emailsSent));

  // ── all 5 tables checked independently in one tick, one email each ──
  reset();
  DB.upgrade_requests.push({ user_id: 'u1', product_id: 'clar', plan_id: 'plus', utr: 'x', note: null, created_at: new Date().toISOString() });
  DB.landing_feedback.push({ rating: 5, reason: 'Love it', message: null, email: 'a@b.com', created_at: new Date().toISOString() });
  DB.landing_leads.push({ name: 'Asha', email: 'asha@example.com', context: 'how does clar help', created_at: new Date().toISOString() });
  DB.scholarship_applications.push({ name: 'Dev', email: 'dev@example.com', situation: 'student', created_at: new Date().toISOString() });
  DB.account_delete_feedback.push({ reason: 'Not using it enough', message: null, created_at: new Date().toISOString() });
  await tick(envWithSecrets);
  ok(emailsSent.length === 5, 'all 5 submission tables each produce their own email in one tick: ' + emailsSent.length);
  ok(emailsSent.some((e) => e.subject.includes('landing feedback')) && emailsSent.some((e) => e.subject.includes('Ask Clar lead'))
    && emailsSent.some((e) => e.subject.includes('scholarship application')) && emailsSent.some((e) => e.subject.includes('account-delete feedback')),
    'subjects correctly distinguish the 5 kinds: ' + emailsSent.map((e) => e.subject).join(' | '));

  // ── multiple new rows in the same table in one tick are combined into ONE email, not five ──
  reset();
  for (let i = 0; i < 3; i++) DB.landing_leads.push({ name: 'Lead' + i, email: 'lead' + i + '@example.com', context: 'x', created_at: new Date(Date.now() + i * 1000).toISOString() });
  await tick(envWithSecrets);
  ok(emailsSent.length === 1 && emailsSent[0].subject.includes('3 new'), 'three new rows in one tick = one combined email, not three: ' + JSON.stringify(emailsSent.map((e) => e.subject)));
  ok(emailsSent[0].text.includes('lead0@example.com') && emailsSent[0].text.includes('lead2@example.com'), 'the combined email lists every one of the new rows');

  // ── secrets NOT configured: fails closed, cursor does NOT advance (so the backlog survives) ──
  reset();
  DB.upgrade_requests.push({ user_id: 'u1', product_id: 'clar', plan_id: 'plus', utr: 'x', note: null, created_at: new Date().toISOString() });
  await tick(envNoSecrets);
  ok(emailsSent.length === 0, 'no RESEND_API_KEY/ADMIN_ALERT_EMAIL -> no email sent (fails closed, same as T-076)');
  ok(!DB.admin_alert_log.find((r) => r.key === 'newcheck:upgrade_requests'), 'cursor NOT advanced on a failed send -- the same row will be retried once secrets exist');
  // once secrets are added, the very next tick picks up the SAME backlog row rather than having silently lost it
  await tick(envWithSecrets);
  ok(emailsSent.length === 1, 'the backlog row is picked up and emailed the moment secrets become available: ' + emailsSent.length);

  // ── a table that does not exist yet on this Supabase project must not block the other 4 ──
  reset();
  delete DB.account_delete_feedback; // simulate "relation does not exist" by removing it from the mock DB entirely -- GET on an absent key returns [] via (DB[table]||[]), so simulate a real throw instead:
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/rest/v1/account_delete_feedback')) throw new Error('relation "account_delete_feedback" does not exist');
    return realFetch(url, init);
  };
  DB.upgrade_requests.push({ user_id: 'u1', product_id: 'clar', plan_id: 'plus', utr: 'x', note: null, created_at: new Date().toISOString() });
  await tick(envWithSecrets);
  ok(emailsSent.length === 1, 'the other 4 tables still get checked even though one table errors: ' + emailsSent.length);
  globalThis.fetch = realFetch;

  console.log(`\nnew submission alerts: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.stack || e.message); process.exit(1); });
