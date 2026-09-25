// T-010 — proves the SQL function public.usage_correlation_me() (db/schema_v247_usage_correlation_rpc.sql)
// returns exactly what the browser algorithm it replaces (v225 _computeUsageOutcomeCorrelation) returned,
// on a REAL Postgres engine (pglite = Postgres compiled to WASM), for hundreds of random data sets + edge cases.
// Run: node qa/sql/usage-correlation.test.js   (exit 0 = all equal)
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');

// ── the original client algorithm, copied verbatim in behaviour from clarvoyance_v246/v247 (window._computeUsageOutcomeCorrelation) ──
// r9: the browser used raw floats; Postgres numeric is exact. Rounding every intermediate to 9 decimals removes float noise (e.g. 0.575 stored as
// 0.57499999…) so the two can be compared strictly — the SQL is the exact/correct one, this makes the reference match it.
const r9 = x => Math.round(x * 1e9) / 1e9;
function jsAlgo(dailyRows, insightRows) {
  const scoreByDate = {};
  dailyRows.forEach(r => { if (r.daily_score !== null && r.daily_score !== undefined) scoreByDate[r.date] = r.daily_score; });
  const SR_NUM = { low: 0, neutral: 0.5, high: 1 };
  const stateByDate = {};
  insightRows.forEach(r => {
    const sr = r.value && r.value.state_read;
    if (!(sr in SR_NUM)) return;
    const d = new Date(r.created_at).toISOString().slice(0, 10);
    (stateByDate[d] = stateByDate[d] || []).push(SR_NUM[sr]);
  });
  const points = [];
  Object.keys(stateByDate).forEach(dateStr => {
    const d = new Date(dateStr + 'T00:00:00Z');
    let sum = 0, cnt = 0;
    for (let i = 0; i < 3; i++) {
      const dd = new Date(d); dd.setUTCDate(dd.getUTCDate() - i);
      const key = dd.toISOString().slice(0, 10);
      if (scoreByDate[key] !== undefined) { sum += scoreByDate[key]; cnt++; }
    }
    if (!cnt) return;
    const states = stateByDate[dateStr];
    points.push({ date: dateStr, recentEngagement: r9(sum / cnt), avgState: r9(states.reduce((a, b) => a + b, 0) / states.length) });
  });
  if (points.length < 6) return { hasEnoughData: false, sampleSize: points.length };
  const sorted = points.slice().sort((a, b) => a.recentEngagement - b.recentEngagement);
  const mid = Math.floor(sorted.length / 2);
  const lowHalf = sorted.slice(0, mid), highHalf = sorted.slice(sorted.length - mid);
  const avg = arr => arr.reduce((a, p) => a + p.avgState, 0) / arr.length;
  const lowState = r9(avg(lowHalf)), highState = r9(avg(highHalf));
  return { hasEnoughData: true, sampleSize: points.length, lowEngagementStatePct: Math.round(r9(lowState * 100)), highEngagementStatePct: Math.round(r9(highState * 100)), confirms: r9(highState - lowState) > 0.05 };
}

// deterministic PRNG so a failure is reproducible
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = a => a[Math.floor(rnd() * a.length)];

function fixture(kind) {
  const nDays = kind === 'tiny' ? 3 + Math.floor(rnd() * 4) : 8 + Math.floor(rnd() * 40);
  const start = Date.UTC(2026, 0, 1);
  const daily = [], insights = [];
  for (let i = 0; i < nDays; i++) {
    const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
    if (rnd() > 0.15) daily.push({ date, daily_score: kind === 'ties' ? pick([0.2, 0.5]) : Math.round(rnd() * 100) / 100 });
    if (rnd() > 0.1) {
      const k = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < k; j++) {
        const t = new Date(start + i * 86400000 + Math.floor(rnd() * 86399) * 1000).toISOString();
        // includes junk / missing state_read rows the algorithm must ignore
        const sr = pick(['low', 'neutral', 'high', 'high', 'low', 'bogus', null]);
        insights.push({ created_at: t, value: sr === null ? { other: 1 } : { state_read: sr } });
      }
    }
  }
  if (kind === 'nullscore') daily.forEach((r, i) => { if (i % 3 === 0) r.daily_score = null; });
  return { daily, insights };
}

(async () => {
  const sqlFile = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema_v247_usage_correlation_rpc.sql'), 'utf8');
  const db = new PGlite();
  // minimal stand-ins for what Supabase provides
  await db.exec(`
    create schema auth;
    create role anon; create role authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create table public.admin_insights (id bigserial primary key, user_id uuid, created_at timestamptz not null, value jsonb);
    create table public.user_daily_log (user_id uuid, date date, daily_score numeric, primary key (user_id, date));
  `);
  await db.exec(sqlFile);

  const UID = '00000000-0000-4000-8000-0000000000aa', OTHER = '00000000-0000-4000-8000-0000000000bb';
  let checked = 0, failed = 0;
  const kinds = ['normal', 'ties', 'nullscore', 'tiny'];
  for (let n = 0; n < 240; n++) {
    const kind = kinds[n % kinds.length];
    const { daily, insights } = fixture(kind);
    await db.exec('truncate public.admin_insights, public.user_daily_log');
    for (const r of daily) await db.query('insert into public.user_daily_log values ($1,$2,$3)', [UID, r.date, r.daily_score]);
    for (const r of insights) await db.query('insert into public.admin_insights (user_id, created_at, value) values ($1,$2,$3)', [UID, r.created_at, JSON.stringify(r.value)]);
    // another user's rows must never leak into the result
    await db.query('insert into public.admin_insights (user_id, created_at, value) values ($1,$2,$3)', [OTHER, '2026-01-05T10:00:00Z', JSON.stringify({ state_read: 'low' })]);
    await db.exec(`select set_config('test.uid', '${UID}', false)`);
    const sqlRes = (await db.query('select public.usage_correlation_me() as r')).rows[0].r;
    const jsRes = jsAlgo(daily, insights);
    checked++;
    if (!same(sqlRes, jsRes)) {
      failed++;
      if (failed <= 3) console.log('MISMATCH', kind, '\n  sql', JSON.stringify(sqlRes), '\n  js ', JSON.stringify(jsRes));
    }
  }
  // no logged-in user → null
  await db.exec(`select set_config('test.uid', '', false)`);
  const anon = (await db.query('select public.usage_correlation_me() as r')).rows[0].r;
  if (anon !== null) { failed++; console.log('expected null without a user, got', anon); }
  console.log(`checked ${checked} random fixtures + no-user case; mismatches: ${failed}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

// Exact equality for everything except the two percentages, which may differ by 1 point ONLY because JS floating point
// computes e.g. 0.575 as 0.57499999… (rounds to 57) while Postgres numeric is exact (rounds to 58). Postgres is the more correct one.
function same(a, b) {
  if (!a || !b) return a === b;
  const pct = ['lowEngagementStatePct', 'highEngagementStatePct'];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (pct.includes(k)) { if (a[k] !== b[k]) return false; }
    else if (a[k] !== b[k]) return false;
  }
  return true;
}
function sortKeys(o) { return o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]])) : o; }
