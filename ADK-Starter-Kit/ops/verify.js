#!/usr/bin/env node
// ADK verify gate. One command = the whole regression check. "Done" is only allowed when this passes.
//   node ops/verify.js                      verify index.html (what users see)
//   QA_TARGET=clarvoyance_v247.html node ops/verify.js     verify a CANDIDATE before promoting it
//   node ops/verify.js --quick              syntax + consistency only (fast; NOT accepted as proof for DONE/promote)
//   node ops/verify.js --update-snapshots   accept the current look of the stable regions as the new baseline
const fs = require('fs'), path = require('path'), cp = require('child_process');
const L = require('./lib');
const { CFG } = L;
const { flags } = L.parseArgs(process.argv.slice(2));
const target = process.env.QA_TARGET || (CFG.app && CFG.app.liveEntry);
const problems = [];

// Kit-bootstrap guard: adk.config.json still has an unfilled <...> placeholder — say so plainly
// instead of an ENOENT stack trace two lines down. Remove this block once the config is real
// (it's harmless to leave, but it's a sign bootstrap finished if it never fires).
const cfgText = JSON.stringify(CFG);
if (cfgText.indexOf('<<FILL_IN:') !== -1) {
  console.error('ERROR: ops/adk.config.json still has unfilled <placeholder> values — finish the bootstrap questions in CLAUDE.md first, then fill this file, before running verify.');
  process.exit(1);
}
function say(s) { console.log(s); }
let html = '', consistency = 'n/a (candidate file)';

if (!CFG.app) {
  say('[1-2/3] skipped — no "app" block in adk.config.json (non-single-file-app project)');
} else {
  // 1) every inline <script> block of the target must parse
  html = fs.readFileSync(L.p(target), 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(html))) { n++; try { new Function(m[1]); } catch (e) { bad++; problems.push(`script block #${n} does not parse: ${e.message}`); } }
  say(`[1/3] inline scripts: ${n} blocks, ${bad} broken`);

  // 2) service-worker cache number must be >= the version label number when the live entry is verified
  //    (equal after a promote; higher after a rollback, which deliberately uses a brand-new cache name)
  if (target === CFG.app.liveEntry) {
    const lab = (html.match(new RegExp(CFG.app.versionLabelRegex)) || [])[1];
    const sw = fs.readFileSync(L.p(CFG.app.serviceWorker), 'utf8');
    const cache = (sw.match(new RegExp(CFG.app.swCacheRegex)) || [])[1];
    if (!lab) problems.push('version label not found in ' + target);
    else if (!cache) problems.push('service-worker CACHE_VERSION not found');
    else if (Number(cache.replace(/\D/g, '')) < Number(lab.replace(/\D/g, ''))) problems.push(`service-worker cache ${cache} is OLDER than the version label ${lab} (installed apps would not update!)`);
    consistency = `${lab} / ${cache}`;
  }
  say(`[2/3] version consistency: ${consistency}`);
}

// 3) browser regression suite (Chromium/Android + WebKit/iPhone)
let summary = { quick: !!flags.quick };
if (!flags.quick && !problems.length) {
  const qa = L.p(CFG.verify.qaDir);
  if (!fs.existsSync(path.join(qa, 'node_modules'))) problems.push('qa/node_modules missing — run: cd qa && npm install && PLAYWRIGHT_BROWSERS_PATH=./.browsers npx playwright install chromium webkit');
  else {
    fs.rmSync(path.join(qa, 'test-results', 'report.json'), { force: true });
    const env = { ...process.env, QA_TARGET: target, PLAYWRIGHT_BROWSERS_PATH: L.p(CFG.verify.playwrightBrowsersPath) };
    const args = 'npx playwright test' + (flags['update-snapshots'] ? ' --update-snapshots' : '');
    say(`[3/3] browser suite on ${target} …`);
    const r = cp.spawnSync(args, { cwd: qa, env, shell: true, stdio: 'inherit' });
    const rep = L.readJson(path.join(qa, 'test-results', 'report.json'), null);
    if (rep && rep.stats) summary = { ...summary, passed: rep.stats.expected, failed: rep.stats.unexpected, flaky: rep.stats.flaky, skipped: rep.stats.skipped };
    if (r.status !== 0) problems.push(`browser suite failed (exit ${r.status}) — see output above`);
  }
} else say('[3/3] browser suite skipped' + (flags.quick ? ' (--quick)' : ' (earlier problem)'));

const ok = problems.length === 0;
let head = ''; try { head = L.git(['rev-parse', '--short', 'HEAD']); } catch (e) {}
const fileHashes = CFG.app ? { [target]: L.fileHash(target), [CFG.app.serviceWorker]: L.fileHash(CFG.app.serviceWorker) } : {};
L.writeJson(L.p('ops', '.state', 'last-verify.json'), { ok, at: L.nowIso(), target, quick: !!flags.quick, head, fileHashes, summary, problems });
say('\n' + (ok ? `VERIFY PASSED${flags.quick ? ' (quick — not valid as proof for DONE/promote)' : ''} — ${JSON.stringify(summary)}` : 'VERIFY FAILED:\n - ' + problems.join('\n - ')));
process.exit(ok ? 0 : 1);
