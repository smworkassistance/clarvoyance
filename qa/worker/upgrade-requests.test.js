// T-??? v262 — manual upgrade requests (upgrade_requests.select/approve/reject) in
// workers/admin-relay-worker.js, run against its REAL code with fetch() mocked.
// Run: node qa/worker/upgrade-requests.test.js   (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const os = require('os');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const DB = {};
function reset() {
  DB.upgrade_requests = [];
  DB.subscriptions = [];
  DB.admin_upgrade_requests_overview = [];
}

globalThis.fetch = async (url, init) => {
  url = String(url); init = init || {};
  const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });
  if (!url.startsWith('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/')) throw new Error('unmocked fetch: ' + url);
  const rest = url.slice('https://unvwjuceuyruqdnmvxlc.supabase.co/rest/v1/'.length);
  const table = rest.split('?')[0], qs = new URLSearchParams(rest.split('?')[1] || '');
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(init.body) : null;
  if (method === 'GET') {
    let rows = (DB[table] || []).slice();
    for (const [k, v] of qs) {
      if (['select', 'order', 'limit'].includes(k)) continue;
      const eq = v.match(/^eq\.(.*)$/); if (eq) rows = rows.filter((r) => String(r[k]) === eq[1]);
      const inList = v.match(/^in\.\((.*)\)$/); if (inList) { const set = inList[1].split(','); rows = rows.filter((r) => set.includes(String(r[k]))); }
    }
    return json(rows);
  }
  if (method === 'POST') {
    const row = { id: table === 'subscriptions' ? 'sub-' + (DB.subscriptions.length + 1) : undefined, ...body };
    DB[table].push(row);
    return json([row]);
  }
  if (method === 'PATCH') {
    const id = (qs.get('id') || '').replace('eq.', '');
    const row = (DB[table] || []).find((r) => String(r.id) === id);
    if (row) Object.assign(row, body);
    return json(row ? [row] : []);
  }
  throw new Error('unmocked method ' + method + ' on ' + table);
};

(async () => {
  const tmp = path.join(os.tmpdir(), 'arw-upg-' + Date.now() + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'workers', 'admin-relay-worker.js'), tmp);
  const mod = await import('file:///' + tmp.replace(/\\/g, '/'));
  const W = mod.default;
  const env = { ADMIN_TOKEN: 'ADM', SUPABASE_SERVICE_KEY: 'svc' };
  const call = async (action, payload, token) => {
    const r = await W.fetch(new Request('https://w.test/', { method: 'POST', headers: { Authorization: 'Bearer ' + (token || 'ADM'), 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) }), env);
    return { status: r.status, body: await r.json() };
  };

  // ── auth ──
  reset();
  ok((await call('upgrade_requests.select', {}, 'nope')).status === 401, 'admin actions need the admin token');

  // ── select reads the staff overview ──
  reset();
  DB.admin_upgrade_requests_overview.push({ id: 'r1', user_id: 'u1', email: 'a@b.com', plan_id: 'plus', status: 'pending', utr: '123456789012' });
  let r = await call('upgrade_requests.select', {});
  ok(r.status === 200 && r.body.data.length === 1 && r.body.data[0].email === 'a@b.com', 'select returns the staff-view rows');

  // ── approve: no existing live subscription -> creates a new one ──
  reset();
  DB.upgrade_requests.push({ id: 'r1', user_id: 'u1', product_id: 'clar', plan_id: 'plus', status: 'pending' });
  r = await call('upgrade_requests.approve', { id: 'r1' });
  ok(r.status === 200 && r.body.data.ok === true && r.body.data.plan_id === 'plus', 'approve succeeds: ' + JSON.stringify(r.body));
  ok(DB.subscriptions.length === 1 && DB.subscriptions[0].status === 'active' && DB.subscriptions[0].source === 'admin_grant', 'a real subscriptions row was created, source=admin_grant');
  ok(DB.subscriptions[0].user_id === 'u1' && DB.subscriptions[0].plan_id === 'plus', 'the subscription matches the request (user + plan)');
  ok(DB.upgrade_requests[0].status === 'approved' && !!DB.upgrade_requests[0].reviewed_at, 'the request itself is marked approved with a timestamp');
  const periodEnd = new Date(DB.subscriptions[0].current_period_end).getTime();
  ok(periodEnd > Date.now() + 25 * 86400000 && periodEnd < Date.now() + 35 * 86400000, 'default grant is ~1 month (30 days)');

  // ── approve: an existing live subscription is UPDATED, not duplicated ──
  reset();
  DB.subscriptions.push({ id: 'sub-old', user_id: 'u1', product_id: 'clar', plan_id: 'free', status: 'active' });
  DB.upgrade_requests.push({ id: 'r2', user_id: 'u1', product_id: 'clar', plan_id: 'pro', status: 'pending' });
  r = await call('upgrade_requests.approve', { id: 'r2', months: 2 });
  ok(r.status === 200, 'approve with an existing subscription succeeds: ' + JSON.stringify(r.body));
  ok(DB.subscriptions.length === 1, 'still exactly one subscription row for this member (updated, not duplicated)');
  ok(DB.subscriptions[0].id === 'sub-old' && DB.subscriptions[0].plan_id === 'pro', 'the EXISTING row was updated to the new plan, same id');
  const periodEnd2 = new Date(DB.subscriptions[0].current_period_end).getTime();
  ok(periodEnd2 > Date.now() + 55 * 86400000 && periodEnd2 < Date.now() + 65 * 86400000, 'months=2 grants ~60 days');

  // ── approve: unknown id is a clear error, nothing mutated ──
  reset();
  r = await call('upgrade_requests.approve', { id: 'does-not-exist' });
  ok(r.status !== 200 && /not found/.test(JSON.stringify(r.body)), 'approving an unknown request id fails clearly: ' + JSON.stringify(r.body));
  ok(DB.subscriptions.length === 0, 'no subscription is created for a request that was never found');

  // ── reject: marks rejected with the reviewer note, touches nothing else ──
  reset();
  DB.upgrade_requests.push({ id: 'r3', user_id: 'u2', product_id: 'clar', plan_id: 'plus', status: 'pending' });
  r = await call('upgrade_requests.reject', { id: 'r3', note: 'UTR did not match any payment received' });
  ok(r.status === 200, 'reject succeeds: ' + JSON.stringify(r.body));
  ok(DB.upgrade_requests[0].status === 'rejected' && DB.upgrade_requests[0].reviewer_note === 'UTR did not match any payment received', 'rejected with the reviewer note recorded');
  ok(DB.subscriptions.length === 0, 'rejecting never touches subscriptions');

  console.log(`\nupgrade requests: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.stack || e.message); process.exit(1); });
