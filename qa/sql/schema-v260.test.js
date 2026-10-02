// db/schema_v260_plans.sql on a REAL Postgres engine (pglite): idempotent, and the money/security rules hold.
// Run: node qa/sql/schema-v260.test.js  (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const U = { A: '00000000-0000-4000-8000-00000000000a', B: '00000000-0000-4000-8000-00000000000b' };

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v260_plans.sql'), 'utf8');
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
  const asAnon = async (fn) => { await db.exec(`select set_config('test.uid','',false); set role anon;`); try { return await fn(); } finally { await db.exec('reset role'); } };
  const asSvc = async (fn) => { await db.exec('set role service_role'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const throws = async (p) => { try { await p; return false; } catch (e) { return true; } };

  // plans = the rate chart
  const plans = (await asAnon(() => db.query("select id, price_monthly::int p, xp_discount_cap_pct::int c, limits from public.plans where product_id='clar' order by sort"))).rows;
  ok(plans.map((r) => r.id).join() === 'free,plus,pro', 'three plans seeded');
  ok(plans[1].p === 99 && plans[1].c === 50 && plans[2].p === 199 && plans[2].c === 25, 'prices and XP-discount caps as decided (99/50%, 199/25%)');
  ok(plans[0].limits.goal_images === 5 && plans[1].limits.goal_images === 8 && plans[2].limits.goal_images === 12, 'goal image limits 5/8/12');
  ok(plans[0].limits.universal_guides === 2 && plans[1].limits.universal_guides === 4 && plans[2].limits.universal_guides === 8, 'universal guides 2/4/8');
  ok(plans[0].limits.private_guides === 0 && plans[1].limits.private_guides === 3 && plans[2].limits.private_guides === 5, 'own guides 0/3/5');
  ok(plans[2].limits.clar_chat_per_day === 60 && plans[2].limits.ai_fortune_reading === true && plans[1].limits.ai_fortune_reading === false, 'Pro: 60 chat/day + AI Fortune; Plus has no AI Fortune');
  ok(await asAnon(() => throws(db.query("update public.plans set price_monthly = 1 where id='plus'"))) || (await db.query("select price_monthly::int p from public.plans where id='plus'")).rows[0].p === 99, 'anon cannot change prices');
  ok((await asAnon(() => db.query("select (xp_discount->>'daily_cap')::int d from public.plan_settings"))).rows[0].d === 250, 'xp rules readable (daily cap 250)');

  // waitlist: insert only
  ok(!(await asAnon(() => throws(db.query("insert into public.plan_waitlist (email, plan_id) values ('a@b.com','plus')")))), 'anon can join the waitlist');
  ok(await asAnon(() => throws(db.query("insert into public.plan_waitlist (email, plan_id) values ('not-an-email','plus')"))), 'bad email rejected');
  ok(await asAnon(() => throws(db.query("insert into public.plan_waitlist (email, plan_id) values ('A@B.com','plus')"))), 'same email + plan (any case) rejected as duplicate');
  ok(await asAnon(() => throws(db.query('select * from public.plan_waitlist'))), 'anon cannot read the waitlist');
  ok((await asSvc(() => db.query('select count(*)::int n from public.plan_waitlist'))).rows[0].n === 1, 'service_role can read the waitlist');

  // subscriptions: clients read only their own and can never write
  await asSvc(() => db.query(`insert into public.subscriptions (user_id, product_id, plan_id, provider, provider_subscription_id, current_period_end, list_price, xp_discount_pct, amount_charged)
                              values ('${U.A}','clar','plus','razorpay','sub_123', now() + interval '20 days', 99, 30, 69.3)`));
  ok((await as(U.A, () => db.query('select count(*)::int n from public.subscriptions'))).rows[0].n === 1, 'member sees own subscription');
  ok((await as(U.B, () => db.query('select count(*)::int n from public.subscriptions'))).rows[0].n === 0, "member cannot see someone else's subscription");
  ok(await as(U.B, () => throws(db.query(`insert into public.subscriptions (user_id, product_id, plan_id) values ('${U.B}','clar','pro')`))), 'member cannot grant themselves a plan');
  ok(await as(U.A, () => throws(db.query("update public.subscriptions set plan_id='pro'"))) || (await db.query("select plan_id from public.subscriptions where user_id='" + U.A + "'")).rows[0].plan_id === 'plus', 'member cannot upgrade their own row');
  ok(await asSvc(() => throws(db.query(`insert into public.subscriptions (user_id, product_id, plan_id) values ('${U.A}','clar','pro')`))), 'only one live subscription per user+product');
  ok(await asSvc(() => throws(db.query(`insert into public.subscriptions (user_id, product_id, plan_id) values ('${U.B}','clar','gold')`))), 'unknown plan rejected');

  // my_plan(): the entitlement the app and the proxy will use
  const mp = (uid) => as(uid, () => db.query("select * from public.my_plan('clar')")).then((r) => r.rows);
  ok((await mp(U.A))[0].plan_id === 'plus', 'my_plan returns the live plan');
  ok((await mp(U.B)).length === 0, 'my_plan empty for a free member (app treats as free)');
  await asSvc(() => db.query("update public.subscriptions set current_period_end = now() - interval '1 day'"));
  ok((await mp(U.A)).length === 0, 'expired period => back to free');

  // payments: idempotent, own rows only
  await asSvc(() => db.query(`insert into public.payments (user_id, provider, provider_payment_id, amount_minor, status) values ('${U.A}','razorpay','pay_1',6930,'captured')`));
  ok(await asSvc(() => throws(db.query(`insert into public.payments (user_id, provider, provider_payment_id, amount_minor, status) values ('${U.A}','razorpay','pay_1',6930,'captured')`))), 'a retried webhook cannot double-record a payment');
  ok((await as(U.A, () => db.query('select count(*)::int n from public.payments'))).rows[0].n === 1, 'member sees own payment');
  ok((await as(U.B, () => db.query('select count(*)::int n from public.payments'))).rows[0].n === 0, "member cannot see someone else's payment");
  ok(await as(U.A, () => throws(db.query(`insert into public.payments (user_id, provider, provider_payment_id, amount_minor, status) values ('${U.A}','x','p2',1,'captured')`))), 'member cannot write payments');

  // staff view
  ok(await as(U.A, () => throws(db.query('select * from public.admin_subscription_overview'))), 'members cannot read the staff overview');
  const ov = (await asSvc(() => db.query('select email, plan_id, status from public.admin_subscription_overview'))).rows;
  ok(ov.length === 1 && ov[0].email === 'asha@example.com' && ov[0].plan_id === 'plus', 'staff overview shows member email + plan + status');

  console.log(`schema v260: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.message); process.exit(1); });
