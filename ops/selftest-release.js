#!/usr/bin/env node
// ADK release acceptance test: proves verify(quick)/promote/rollback behave — in a THROW-AWAY CLONE of the repo.
// Never touches the real index.html/sw.js/tags and never pushes (the clone's remote is disabled).
//   node ops/selftest-release.js
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os'), crypto = require('crypto');
const REAL = path.resolve(__dirname, '..');
const CL = fs.mkdtempSync(path.join(os.tmpdir(), 'adk-release-'));
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra ? ' — ' + String(extra).slice(0, 300) : '')); };
const sh = (cmd, args, opts) => cp.spawnSync(cmd, args, { cwd: CL, encoding: 'utf8', ...(opts || {}) });
const git = (...a) => sh('git', a);
const node = (...a) => sh('node', a);
const H = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(CL, f))).digest('hex');
const write = (f, s) => fs.writeFileSync(path.join(CL, f), s);
const read = f => fs.readFileSync(path.join(CL, f), 'utf8');

try {
  // clone only the two live files + tooling (a full clone would copy 1.4 MB x many old versions; not needed)
  cp.execFileSync('git', ['init', '-q', CL]);
  git('config', 'user.email', 'selftest@example.com'); git('config', 'user.name', 'selftest');
  fs.mkdirSync(path.join(CL, 'ops'), { recursive: true });
  for (const f of ['lib.js', 'tasks.js', 'render.js', 'migrate.js', 'verify.js', 'promote.js', 'rollback.js', 'adk.config.json']) fs.copyFileSync(path.join(REAL, 'ops', f), path.join(CL, 'ops', f));
  // a tiny stand-in app with the same conventions: version label + service worker cache name
  write('.gitignore', 'ops/.state/\nqa/\n');
  const page = v => `<html><body><span id="prof-app-ver">${v}</span><script>var x=1;</script></body></html>`;
  const sw = n => `const CACHE_VERSION  = 'clv-v${n}';\n`;
  write('index.html', page('v100')); write('sw.js', sw(100)); write('manifest.json', '{}');
  git('add', '-A'); git('commit', '-q', '-m', 'v100 baseline (live)');
  const baseHead = git('rev-parse', '--short', 'HEAD').stdout.trim();

  // candidate v101
  write('clarvoyance_v101.html', page('v101'));
  git('add', '-A'); git('commit', '-q', '-m', 'candidate v101');

  // ---- verify --quick consistency checks (fast path; no browsers) ----
  let r = node('ops/verify.js', '--quick');
  ok('verify --quick passes on a consistent live entry (label v100 == cache clv-v100)', r.status === 0, r.stdout + r.stderr);
  write('sw.js', sw(99)); r = node('ops/verify.js', '--quick');
  ok('verify FAILS when the service-worker cache is OLDER than the version label (phones would never update)', r.status !== 0 && /OLDER than the version label/.test(r.stdout), r.status + ' | ' + r.stdout + ' | ' + r.stderr);
  write('sw.js', sw(100));
  write('index.html', page('v100').replace('var x=1;', 'var x=;')); r = node('ops/verify.js', '--quick');
  ok('verify FAILS on a JavaScript syntax error in the live entry', r.status !== 0 && /does not parse/.test(r.stdout));
  write('index.html', page('v100'));

  // ---- promote refusals ----
  r = node('ops/promote.js', 'clarvoyance_v101.html');
  ok('promote refuses with no verify on record', r.status !== 0 && /no passing FULL verify/.test(r.stderr));
  const fakeVerify = (over) => { fs.mkdirSync(path.join(CL, 'ops', '.state'), { recursive: true }); fs.writeFileSync(path.join(CL, 'ops', '.state', 'last-verify.json'), JSON.stringify({ ok: true, at: new Date().toISOString(), target: 'clarvoyance_v101.html', quick: false, fileHashes: { 'clarvoyance_v101.html': H('clarvoyance_v101.html'), 'sw.js': H('sw.js') }, summary: { passed: 18 }, ...(over || {}) })); };
  fakeVerify({ quick: true });
  ok('promote refuses a --quick verify', node('ops/promote.js', 'clarvoyance_v101.html').status !== 0);
  fakeVerify({ ok: false });
  ok('promote refuses a FAILED verify', node('ops/promote.js', 'clarvoyance_v101.html').status !== 0);
  fakeVerify({ target: 'other.html' });
  ok('promote refuses a verify made for a different file', node('ops/promote.js', 'clarvoyance_v101.html').status !== 0);
  fakeVerify(); write('clarvoyance_v101.html', page('v101') + '<!-- edited after verify -->');
  ok('promote refuses when the candidate changed after verify (bytes bound)', node('ops/promote.js', 'clarvoyance_v101.html').status !== 0);
  git('add', '-A'); git('commit', '-q', '-m', 'edit'); fakeVerify();
  write('clarvoyance_v102.html', page('v999')); // label mismatch candidate
  ok('promote refuses a candidate whose inner version label != its file name', node('ops/promote.js', 'clarvoyance_v102.html').status !== 0);
  fs.rmSync(path.join(CL, 'clarvoyance_v102.html'));
  write('index.html', page('v100') + '<!-- dirty -->');
  ok('promote refuses a dirty protected file (uncommitted change to index.html)', node('ops/promote.js', 'clarvoyance_v101.html').status !== 0);
  git('checkout', '--', 'index.html');

  // ---- promote (dry-run changes nothing, real does) ----
  fakeVerify();
  const beforeIdx = read('index.html'), beforeSw = read('sw.js');
  r = node('ops/promote.js', 'clarvoyance_v101.html', '--dry-run');
  ok('promote --dry-run prints the plan and changes nothing', r.status === 0 && /dry-run/.test(r.stdout) && read('index.html') === beforeIdx && read('sw.js') === beforeSw && git('tag').stdout.trim() === '');
  r = node('ops/promote.js', 'clarvoyance_v101.html');
  ok('promote succeeds', r.status === 0, r.stdout + r.stderr);
  ok('live entry is now the candidate', read('index.html') === read('clarvoyance_v101.html'));
  ok('service-worker cache bumped to clv-v101', /clv-v101/.test(read('sw.js')));
  ok('rollback tag pre-v101 exists and points at the previously live commit', git('rev-parse', '--short', 'pre-v101').stdout.trim() === git('rev-parse', '--short', 'HEAD~1').stdout.trim());
  ok('promote made exactly one commit with the standard message', /v101: promote to index\.html \+ sw\.js clv-v101/.test(git('log', '-1', '--format=%s').stdout));
  ok('verify --quick is consistent after promote', node('ops/verify.js', '--quick').status === 0);

  // ---- rollback ----
  const promotedHead = git('rev-parse', '--short', 'HEAD').stdout.trim();
  r = node('ops/rollback.js', 'pre-v101', '--dry-run');
  ok('rollback --dry-run announces a NEW cache name and changes nothing', r.status === 0 && /clv-v102/.test(r.stdout) && read('index.html') === read('clarvoyance_v101.html'));
  r = node('ops/rollback.js', 'nope-tag');
  ok('rollback refuses an unknown tag', r.status !== 0);
  r = node('ops/rollback.js', 'pre-v101');
  ok('rollback succeeds', r.status === 0, r.stdout + r.stderr);
  ok('index.html is byte-identical to the pre-promote version', read('index.html') === beforeIdx && read('index.html').includes('v100'));
  ok('service-worker cache is a BRAND-NEW name (clv-v102), not the old clv-v100 or clv-v101', /clv-v102/.test(read('sw.js')) && !/clv-v100|clv-v101/.test(read('sw.js')));
  ok('rollback left history intact (promote commit still exists)', git('cat-file', '-t', promotedHead).stdout.trim() === 'commit');
  ok('verify --quick still passes after a rollback (cache clv-v102 >= label v100 is valid)', node('ops/verify.js', '--quick').status === 0);
  ok('run log recorded promote and rollback', fs.existsSync(path.join(CL, 'docs', 'RUNLOG.md')) && /PROMOTED/.test(read('docs/RUNLOG.md')) && /ROLLBACK/.test(read('docs/RUNLOG.md')));
} finally {
  fs.rmSync(CL, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
