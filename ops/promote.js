#!/usr/bin/env node
// ADK promote: makes a verified candidate version the live entry, with a rollback point.
//   node ops/promote.js clarvoyance_v247.html [--dry-run] [--push]
// Refuses unless: the candidate passed a FULL verify for exactly its current bytes, the tree is clean for protected files,
// and the version label inside the candidate matches the file name. Tags the current HEAD as pre-vN BEFORE changing anything.
const fs = require('fs');
const L = require('./lib');
const { CFG } = L;
const { pos, flags } = L.parseArgs(process.argv.slice(2));
const cand = pos[0]; if (!cand) L.die('usage: node ops/promote.js <candidate-file> [--dry-run] [--push]');
const pat = new RegExp('^' + CFG.app.versionFilePattern.replace('{N}', '(\\d+)').replace(/\./g, '\\.') + '$');
const mm = cand.match(pat); if (!mm) L.die(`candidate name must match ${CFG.app.versionFilePattern}`);
const N = mm[1], ver = 'v' + N, cache = CFG.app.swCacheTemplate.replace('{N}', N);
const dry = !!flags['dry-run'];
const steps = [];
function step(msg, fn) { steps.push(msg); console.log((dry ? '[dry-run] ' : '') + msg); if (!dry && fn) fn(); }

// --- preconditions (all must hold) ---
const html = fs.readFileSync(L.p(cand), 'utf8');
const label = (html.match(new RegExp(CFG.app.versionLabelRegex)) || [])[1];
if (label !== ver) L.die(`version label inside ${cand} is "${label}" but file name says ${ver} — fix the label first`);
const v = L.readJson(L.p('ops', '.state', 'last-verify.json'), null);
if (!v || !v.ok || v.quick) L.die('no passing FULL verify on record — run: QA_TARGET=' + cand + ' node ops/verify.js');
if (v.target !== cand) L.die(`last verify was for ${v.target}, not ${cand}`);
if (v.fileHashes[cand] !== L.fileHash(cand)) L.die(cand + ' changed after it was verified — re-run verify');
if ((Date.now() - Date.parse(v.at)) / 60000 > CFG.verifyMaxAgeMinutes) L.die('verify is older than ' + CFG.verifyMaxAgeMinutes + ' min — re-run');
const dirty = L.git(['status', '--porcelain', '--', ...CFG.protectedPaths, cand]);
if (dirty) L.die('uncommitted changes in protected files/candidate:\n' + dirty + '\ncommit the candidate first (one task = one commit)');
console.log(`preconditions OK: ${cand} verified (${JSON.stringify(v.summary)}), label ${label}, tree clean`);

// --- actions ---
const curCache = ((fs.readFileSync(L.p(CFG.app.serviceWorker), 'utf8').match(new RegExp(CFG.app.swCacheRegex)) || [])[1]) || '';
if (curCache === cache) L.die('service-worker cache is already ' + cache + ' — installed apps would not update; use a higher version number');
const tag = CFG.promote.tagPrefix + ver;
step(`tag rollback point ${tag} at HEAD ${L.git(['rev-parse', '--short', 'HEAD'])} (the currently live version)`, () => L.git(['tag', '-f', tag]));
step(`copy ${cand} -> ${CFG.app.liveEntry}`, () => fs.copyFileSync(L.p(cand), L.p(CFG.app.liveEntry)));
step(`service worker cache -> ${cache}`, () => {
  const f = L.p(CFG.app.serviceWorker); const s = fs.readFileSync(f, 'utf8');
  if (!new RegExp(CFG.app.swCacheRegex).test(s)) L.die('cannot find CACHE_VERSION in sw');
  fs.writeFileSync(f, s.replace(new RegExp(CFG.app.swCacheRegex), (all, old) => all.replace(old, cache)));
});
const msg = CFG.promote.commitMessageTemplate.replace('{ver}', ver).replace('{liveEntry}', CFG.app.liveEntry).replace('{serviceWorker}', CFG.app.serviceWorker).replace('{swCache}', cache);
step(`commit "${msg}"`, () => { L.git(['add', CFG.app.liveEntry, CFG.app.serviceWorker]); L.git(['commit', '-m', msg + '\n\nCo-Authored-By: ' + CFG.promote.coAuthor]); });
if (flags.push) step('git push origin main --tags', () => { console.log(L.git(['push', 'origin', 'main'])); L.git(['push', '-f', 'origin', tag]); });
else console.log(dry ? '' : 'NOT pushed (add --push). To roll back: node ops/rollback.js ' + tag);
if (!dry) L.appendRunLog(`PROMOTED ${cand} -> ${CFG.app.liveEntry}, sw ${cache}, rollback tag ${tag}${flags.push ? ', pushed' : ', not pushed'}`);
