// db/schema_v261_landing_pages.sql on a REAL Postgres engine (pglite): idempotent, anon insert-only,
// nobody but service_role can read these back, CHECK constraints hold.
// Run: node qa/sql/schema-v261.test.js  (exit 0 = all pass)
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v261_landing_pages.sql'), 'utf8');
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.admin_commands (id bigserial primary key, type text, text text);
  `);
  await db.exec(sql); await db.exec(sql); ok(true, 'runs twice without error (idempotent)');

  const asAnon = async (fn) => { await db.exec("set role anon;"); try { return await fn(); } finally { await db.exec('reset role'); } };
  const asSvc = async (fn) => { await db.exec('set role service_role'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const throws = async (p) => { try { await p; return false; } catch (e) { return true; } };

  // ── landing_leads ──
  await asAnon(() => db.query("insert into public.landing_leads (name, email, context) values ('Asha', 'asha@example.com', 'u: how can clar help')"));
  ok(true, 'anon can insert a lead');
  ok(await throws(asAnon(() => db.query("insert into public.landing_leads (email) values ('not-an-email')"))), 'bad email rejected by CHECK');
  ok(await throws(asAnon(() => db.query('select * from public.landing_leads'))), 'anon CANNOT read leads back (no SELECT policy)');
  ok((await asSvc(() => db.query('select count(*)::int c from public.landing_leads'))).rows[0].c === 1, 'service_role CAN read leads');

  // ── landing_feedback ──
  await asAnon(() => db.query("insert into public.landing_feedback (rating, reason, message) values (5, 'Love it', 'Great app')"));
  await asAnon(() => db.query("insert into public.landing_feedback (message) values ('just a note, no rating')"));
  ok(true, 'anon can insert feedback with or without a rating');
  ok(await throws(asAnon(() => db.query('insert into public.landing_feedback (rating) values (NULL)'))), 'a totally empty feedback row is rejected (needs at least one real field)');
  ok(await throws(asAnon(() => db.query('insert into public.landing_feedback (rating) values (9)'))), 'rating out of 1-5 range rejected');
  ok(await throws(asAnon(() => db.query('select * from public.landing_feedback'))), 'anon CANNOT read feedback back');
  ok((await asSvc(() => db.query('select count(*)::int c from public.landing_feedback'))).rows[0].c === 2, 'service_role CAN read feedback (2 rows)');

  // ── scholarship_applications ──
  await asAnon(() => db.query("insert into public.scholarship_applications (name, email, situation) values ('Dev', 'dev@example.com', 'student, no income yet')"));
  ok(true, 'anon can apply for the scholarship');
  ok(await throws(asAnon(() => db.query("insert into public.scholarship_applications (name, email, situation) values ('', 'x@x.com', 'y')"))), 'empty name rejected');
  ok(await throws(asAnon(() => db.query('select * from public.scholarship_applications'))), 'anon CANNOT read applications back');
  const app = (await asSvc(() => db.query('select status from public.scholarship_applications limit 1'))).rows[0];
  ok(app.status === 'pending', 'application defaults to pending status for the owner to review');

  console.log(`\nSCHEMA v261: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.message); process.exit(1); });
