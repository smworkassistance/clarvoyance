// db/schema_v263_ai_usage_gate.sql on a REAL Postgres engine (pglite): the daily counter is exact, idempotent,
// and never reachable from the browser. Run: node qa/sql/ai-usage-gate.test.js  (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const U = { A: '00000000-0000-4000-8000-00000000000a', B: '00000000-0000-4000-8000-00000000000b' };

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v263_ai_usage_gate.sql'), 'utf8');
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create role anon; create role authenticated; create role service_role bypassrls;
    create table auth.users (id uuid primary key);
    grant usage on schema auth to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.feature_flags (key text primary key, enabled boolean not null default false);
    grant select on public.feature_flags to anon, authenticated;
    grant all on public.feature_flags to service_role;
    insert into auth.users values ('${U.A}'), ('${U.B}');
  `);
  await db.exec(sql); await db.exec(sql); ok(true, 'runs twice without error (idempotent)');

  const asSvc = async (fn) => { await db.exec('set role service_role'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const asAnon = async (fn) => { await db.exec('set role anon'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const asAuth = async (fn) => { await db.exec('set role authenticated'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const throws = async (p) => { try { await p; return false; } catch (e) { return true; } };
  const consume = (uid, feature, limit) => asSvc(() => db.query('select public.ai_usage_consume($1::uuid, $2, $3::int) as n', [uid, feature, limit])).then((r) => r.rows[0].n);

  // the switch exists, starts OFF, and a re-run does not flip it back on
  await db.exec("insert into public.feature_flags values ('plans_enforced', true) on conflict (key) do update set enabled = true");
  await db.exec(sql);
  ok((await db.query("select enabled from public.feature_flags where key='plans_enforced'")).rows[0].enabled === true, 'a re-run never overwrites an existing switch');
  await db.exec("update public.feature_flags set enabled=false where key='plans_enforced'");

  // exact counting up to the limit
  const seq = [];
  for (let i = 0; i < 10; i++) seq.push(await consume(U.A, 'clar_chat', 8));
  ok(seq.slice(0, 8).join() === '1,2,3,4,5,6,7,8', 'counts 1..8 when the limit is 8');
  ok(seq[8] === -1 && seq[9] === -1, 'the 9th and 10th messages are refused (-1)');
  ok((await asSvc(() => db.query("select count from public.ai_usage_daily where user_id=$1 and feature='clar_chat'", [U.A]))).rows[0].count === 8, 'a refused message is NOT counted (stays at 8)');

  // independent per member and per feature
  ok((await consume(U.B, 'clar_chat', 8)) === 1, 'another member starts at 1');
  ok((await consume(U.A, 'other_feature', 8)) === 1, 'another feature has its own counter');

  // a zero, negative or missing limit is ALWAYS refused — a missing plan row can never mean unlimited
  ok((await consume(U.B, 'clar_chat', 0)) === -1, 'limit 0 refused');
  ok((await consume(U.B, 'clar_chat', -5)) === -1, 'negative limit refused');
  ok((await asSvc(() => db.query("select ai_usage_consume($1::uuid,'clar_chat',null::int) as n", [U.B]))).rows[0].n === -1, 'null limit refused');

  // the next UTC day starts from zero (simulated by moving the existing row to yesterday)
  await asSvc(() => db.query("update public.ai_usage_daily set day = day - 1 where user_id=$1", [U.A]));
  ok((await consume(U.A, 'clar_chat', 8)) === 1, 'a new day starts again at 1');

  // the browser can read nothing and call nothing
  ok(await asAnon(() => throws(db.query('select * from public.ai_usage_daily'))), 'anon cannot read the counter');
  ok(await asAuth(() => throws(db.query('select * from public.ai_usage_daily'))), 'a signed-in member cannot read the counter');
  ok(await asAuth(() => throws(db.query('insert into public.ai_usage_daily (user_id, day, feature, count) values ($1, current_date, $2, 0)', [U.A, 'x']))), 'a member cannot write the counter');
  ok(await asAuth(() => throws(db.query("select public.ai_usage_consume($1::uuid,'clar_chat',999)", [U.A]))), 'a member cannot call the counting function');
  ok(await asAnon(() => throws(db.query("select public.ai_usage_consume($1::uuid,'clar_chat',999)", [U.A]))), 'anon cannot call the counting function');

  console.log(`ai-usage-gate.test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
