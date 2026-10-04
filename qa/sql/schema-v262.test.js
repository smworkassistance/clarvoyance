// db/schema_v262_upgrade_requests.sql on a REAL Postgres engine (pglite): idempotent, a member
// can request their own upgrade and see their own requests but never anyone else's, nobody but
// service_role sees the admin_upgrade_requests_overview join, CHECK constraints hold.
// Run: node qa/sql/schema-v262.test.js  (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const U = { A: '00000000-0000-4000-8000-00000000000a', B: '00000000-0000-4000-8000-00000000000b' };

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v262_upgrade_requests.sql'), 'utf8');
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create role anon; create role authenticated; create role service_role bypassrls;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.user_profile (user_id uuid primary key references auth.users(id), nick text, email text);
    create table public.admin_commands (id bigserial primary key, type text, text text);
    insert into auth.users values ('${U.A}'), ('${U.B}');
    insert into public.user_profile values ('${U.A}', 'Asha', 'asha@example.com');
  `);
  await db.exec(sql); await db.exec(sql); ok(true, 'runs twice without error (idempotent)');

  const as = async (uid, fn) => { await db.exec(`select set_config('test.uid','${uid || ''}',false); set role authenticated;`); try { return await fn(); } finally { await db.exec('reset role'); } };
  const asSvc = async (fn) => { await db.exec('set role service_role'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const throws = async (p) => { try { await p; return false; } catch (e) { return true; } };

  // ── a member can request their own upgrade ──
  await as(U.A, () => db.query(`insert into public.upgrade_requests (user_id, plan_id, utr, note) values ('${U.A}', 'plus', '123456789012', 'paid via GPay')`));
  ok(true, 'a signed-in member can insert their own upgrade request');
  ok(await throws(as(U.A, () => db.query(`insert into public.upgrade_requests (user_id, plan_id) values ('${U.B}', 'plus')`))), 'cannot insert a request for someone else (RLS WITH CHECK)');
  ok(await throws(as(U.A, () => db.query(`insert into public.upgrade_requests (user_id, plan_id) values ('${U.A}', '${'x'.repeat(41)}')`))), 'plan_id over 40 chars rejected');
  ok(await throws(as(U.A, () => db.query(`insert into public.upgrade_requests (user_id, plan_id, note) values ('${U.A}', 'pro', '${'x'.repeat(501)}')`))), 'note over 500 chars rejected');

  // ── a member sees only their own requests, never anyone else's ──
  await as(U.B, () => db.query(`insert into public.upgrade_requests (user_id, plan_id) values ('${U.B}', 'pro')`));
  const mine = (await as(U.A, () => db.query('select plan_id from public.upgrade_requests'))).rows;
  ok(mine.length === 1 && mine[0].plan_id === 'plus', "A's own SELECT returns only A's request, not B's");

  // ── default status is pending; a client can never set itself approved ──
  const row = (await as(U.A, () => db.query(`select status from public.upgrade_requests where user_id='${U.A}'`))).rows[0];
  ok(row.status === 'pending', 'a new request defaults to pending');
  ok(await throws(as(U.A, () => db.query(`update public.upgrade_requests set status='approved' where user_id='${U.A}'`))), 'a client cannot approve its own request (no UPDATE policy for authenticated)');

  // ── anon (no session at all) cannot insert or read anything ──
  await db.exec("select set_config('test.uid','',false); set role anon;");
  ok(await throws(db.query(`insert into public.upgrade_requests (user_id, plan_id) values ('${U.A}', 'plus')`)), 'anon cannot insert an upgrade request at all');
  ok(await throws(db.query('select * from public.upgrade_requests')), 'anon cannot read upgrade requests either (no SELECT policy for anon)');
  await db.exec('reset role');

  // ── staff view joins the member's email/name; nobody but service_role can read it ──
  const staffRows = (await asSvc(() => db.query('select email, plan_id, status from public.admin_upgrade_requests_overview order by created_at'))).rows;
  ok(staffRows.length === 2, 'service_role sees both requests');
  ok(staffRows[0].email === 'asha@example.com' && staffRows[0].plan_id === 'plus', "the view's LEFT JOIN resolves A's email correctly");
  ok(staffRows[1].email === null, "B has no user_profile row -- LEFT JOIN still returns the request with a null email, doesn't drop it");
  ok(await throws(as(U.A, () => db.query('select * from public.admin_upgrade_requests_overview'))), 'an ordinary signed-in member cannot read the staff view either');

  console.log(`\nSCHEMA v262: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.message); process.exit(1); });
