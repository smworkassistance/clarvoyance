#!/usr/bin/env node
// ADK rollback: restore the previous live version from a rollback tag (created by promote.js as pre-vN).
//   node ops/rollback.js pre-v247 [--dry-run] [--push]
// index.html and sw.js are restored from the tag, and the service-worker cache name is bumped to a BRAND-NEW name so that
// already-installed apps download the restored files (reusing the old name would leave phones on the broken version).
// Database changes are additive by policy and are NOT rolled back — the old app version simply ignores them.
const fs = require('fs');
const L = require('./lib');
const { CFG } = L;
const { pos, flags } = L.parseArgs(process.argv.slice(2));
const tag = pos[0]; if (!tag) L.die('usage: node ops/rollback.js <tag e.g. pre-v247> [--dry-run] [--push]');
const dry = !!flags['dry-run'];
try { L.git(['rev-parse', '--verify', tag + '^{commit}']); } catch (e) { L.die('unknown tag ' + tag); }
const dirty = L.git(['status', '--porcelain', '--', CFG.app.liveEntry, CFG.app.serviceWorker]);
if (dirty) L.die('uncommitted changes in ' + CFG.app.liveEntry + '/' + CFG.app.serviceWorker + ' — commit or discard first');

const cur = fs.readFileSync(L.p(CFG.app.serviceWorker), 'utf8');
const curCache = (cur.match(new RegExp(CFG.app.swCacheRegex)) || [])[1];
const curN = Number((curCache || '').replace(/\D/g, '')) || 0;
// the tag's own cache number, and a number guaranteed to be new (higher than anything used so far)
const oldSw = L.git(['show', tag + ':' + CFG.app.serviceWorker]);
const oldCache = (oldSw.match(new RegExp(CFG.app.swCacheRegex)) || [])[1];
const newN = Math.max(curN, Number((oldCache || '').replace(/\D/g, '')) || 0) + 1;
const newCache = CFG.app.swCacheTemplate.replace('{N}', newN);
console.log(`${dry ? '[dry-run] ' : ''}restore ${CFG.app.liveEntry} + ${CFG.app.serviceWorker} from ${tag}; service-worker cache ${curCache} -> ${newCache} (new name forces installed apps to update)`);
if (dry) process.exit(0);

// git checkout restores the exact bytes of both files from the tag
require('child_process').execFileSync('git', ['checkout', tag, '--', CFG.app.liveEntry, CFG.app.serviceWorker], { cwd: L.ROOT });
const s = fs.readFileSync(L.p(CFG.app.serviceWorker), 'utf8');
fs.writeFileSync(L.p(CFG.app.serviceWorker), s.replace(new RegExp(CFG.app.swCacheRegex), (all, old) => all.replace(old, newCache)));
L.git(['add', CFG.app.liveEntry, CFG.app.serviceWorker]);
L.git(['commit', '-m', `rollback: restore ${CFG.app.liveEntry}/${CFG.app.serviceWorker} from ${tag}, cache ${newCache}\n\nCo-Authored-By: ${CFG.promote.coAuthor}`]);
if (flags.push) console.log(L.git(['push', 'origin', 'main']));
L.appendRunLog(`ROLLBACK to ${tag}: cache ${newCache}${flags.push ? ', pushed' : ', not pushed'}`);
console.log('rolled back' + (flags.push ? ' and pushed' : ' (NOT pushed — add --push)'));
