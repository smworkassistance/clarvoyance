#!/usr/bin/env node
// ADK task engine. tasks.json is the source of truth; TASKS.md is only a rendered view (never hand-edited).
// Rules enforced HERE (in code, not just in prose):
//   * DONE needs evidence + a fresh, passing verify run for the current file hashes
//   * a frozen batch cannot gain tasks or have its acceptance text edited
//   * a QUEUED task older than staleAfterHours cannot start a run until re-confirmed by the owner
//   * a task can only start when all its depends_on are DONE; tasks behind a BLOCKED one are reported blocked-by, the rest keep running
const fs = require('fs');
const L = require('./lib');
const { CFG } = L;

const STATUSES = ['PROPOSED', 'DISCUSS', 'QUEUED', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'STALE', 'DROPPED'];
const RUNNABLE = ['QUEUED', 'IN_PROGRESS'];

function need(t) { if (!t) L.die('tasks.json not found — run: node ops/tasks.js migrate  (or init)'); return t; }
function getTask(t, id) { const x = t.tasks.find(k => k.id === id); if (!x) L.die('no such task: ' + id); return x; }
function hist(task, status, note) { (task.history = task.history || []).push({ at: L.nowIso(), status, note: note || '' }); }
function ageHours(iso) { return (Date.now() - Date.parse(iso)) / 3600e3; }
function scopeHash(t, batch) {
  const rows = t.tasks.filter(x => x.batch === batch).map(x => [x.id, x.title, x.done_when, (x.depends_on || []).join(',')]).sort((a, b) => a[0].localeCompare(b[0]));
  return L.sha(JSON.stringify(rows));
}
function depState(t, task) {
  // returns {ready:boolean, waitingOn:[ids], blockedBy:[ids]}
  const waiting = [], blocked = [];
  for (const d of (task.depends_on || [])) {
    const dep = t.tasks.find(k => k.id === d);
    if (!dep) { blocked.push(d + '(missing)'); continue; }
    if (dep.status === 'DONE') continue;
    if (['BLOCKED', 'DROPPED', 'STALE', 'DISCUSS', 'PROPOSED'].includes(dep.status)) blocked.push(dep.id);
    else waiting.push(dep.id);
  }
  // a dep that is itself blocked-by something is also blocking (transitive)
  for (const d of (task.depends_on || [])) {
    const dep = t.tasks.find(k => k.id === d);
    if (dep && dep.status !== 'DONE' && !blocked.includes(dep.id)) {
      const s = depState(t, dep); if (s.blockedBy.length) blocked.push(dep.id);
    }
  }
  return { ready: !waiting.length && !blocked.length, waitingOn: waiting, blockedBy: blocked };
}
function runnable(t, batch) {
  return t.tasks.filter(x => x.batch === batch && RUNNABLE.includes(x.status) && depState(t, x).ready);
}
function verifyOk(task) {
  if (task.verify === false) return { ok: true, why: 'task marked verify:false' };
  const v = L.readJson(L.p('ops', '.state', 'last-verify.json'), null);
  if (!v) return { ok: false, why: 'no verify run recorded — run: node ops/verify.js' };
  if (!v.ok) return { ok: false, why: 'last verify FAILED at ' + v.at };
  if (v.quick) return { ok: false, why: 'last verify was --quick (syntax only) — run the full node ops/verify.js' };
  const ageMin = (Date.now() - Date.parse(v.at)) / 60000;
  if (ageMin > CFG.verifyMaxAgeMinutes) return { ok: false, why: `last verify is ${Math.round(ageMin)} min old (max ${CFG.verifyMaxAgeMinutes}) — re-run node ops/verify.js` };
  for (const [f, h] of Object.entries(v.fileHashes || {})) {
    if (L.fileHash(f) !== h) return { ok: false, why: `${f} changed since the last verify — re-run node ops/verify.js` };
  }
  return { ok: true, why: `verify passed ${Math.round(ageMin)} min ago` };
}

function main() {
const { pos, flags } = L.parseArgs(process.argv.slice(2));
const cmd = pos[0];

if (cmd === 'migrate') {
  require('./migrate').migrate();
} else if (cmd === 'init') {
  if (L.loadTasks()) L.die('tasks.json already exists');
  L.saveTasks({ project: CFG.project, schema: 1, run: { active: false }, batches: {}, tasks: [] });
  console.log('created tasks.json');
} else if (cmd === 'add') {
  const t = need(L.loadTasks());
  const id = flags.id, status = flags.status || 'DISCUSS';
  if (!id || !flags.title) L.die('usage: add --id T-011 --title "..." [--done-when "..."] [--batch B5] [--deps T-1,T-2] [--status QUEUED|PROPOSED|DISCUSS] [--no-verify]');
  if (t.tasks.some(x => x.id === id)) L.die('task id already exists (ids are never reused): ' + id);
  if (!STATUSES.includes(status)) L.die('bad status');
  if (status === 'QUEUED' && !flags['done-when']) L.die('a QUEUED task needs --done-when (no acceptance criteria => it stays DISCUSS)');
  const b = flags.batch;
  if (b && t.batches[b] && t.batches[b].frozen) L.die(`batch ${b} is FROZEN — new ideas go in as PROPOSED with no batch, not into a frozen batch`);
  t.tasks.push({ id, title: flags.title, added: L.nowIso(), done_when: flags['done-when'] || '', status, batch: b || null, depends_on: flags.deps ? String(flags.deps).split(',').map(s => s.trim()) : [], verify: flags['no-verify'] ? false : true, result: '', completed: null, history: [{ at: L.nowIso(), status, note: 'created' }] });
  if (b && !t.batches[b]) t.batches[b] = { created: L.nowIso(), frozen: false };
  L.saveTasks(t); console.log('added', id);
} else if (cmd === 'set') {
  const t = need(L.loadTasks()); const id = pos[1], st = pos[2];
  if (!id || !STATUSES.includes(st)) L.die('usage: set <id> <' + STATUSES.join('|') + '> [--note ".."] [--evidence ".."] [--reconfirm]');
  const x = getTask(t, id);
  if (st === 'DONE') {
    if (!flags.evidence) L.die('DONE needs --evidence "what was actually checked, with numbers" (evidence before claims)');
    const v = verifyOk(x); if (!v.ok) L.die('cannot mark DONE: ' + v.why);
    x.completed = L.nowIso(); x.result = (x.result ? x.result + '\n' : '') + flags.evidence;
  }
  if (st === 'IN_PROGRESS' || st === 'QUEUED') {
    const ds = depState(t, x);
    if (st === 'IN_PROGRESS' && !ds.ready) L.die('dependencies not done: waiting ' + ds.waitingOn.join(',') + ' blocked ' + ds.blockedBy.join(','));
  }
  if (st === 'QUEUED' && flags.reconfirm) { x.reconfirmed = L.nowIso(); x.added = x.added; }
  if (st === 'BLOCKED') { if (!flags.note) L.die('BLOCKED needs --note with the EXACT unblock action (who does what)'); x.blocked_reason = flags.note; }
  if (['QUEUED'].includes(st) && !x.done_when) L.die('cannot QUEUE without done_when');
  x.status = st; hist(x, st, flags.note || flags.evidence || '');
  if (flags.note && st !== 'BLOCKED') x.result = (x.result ? x.result + '\n' : '') + flags.note;
  L.saveTasks(t); console.log(`${id} -> ${st}`);
} else if (cmd === 'batch') {
  const t = need(L.loadTasks()); const sub = pos[1], b = pos[2];
  if (sub === 'freeze') {
    if (!t.tasks.some(x => x.batch === b)) L.die('no tasks in batch ' + b);
    const bad = t.tasks.filter(x => x.batch === b && x.status === 'QUEUED' && !x.done_when);
    if (bad.length) L.die('QUEUED tasks without done_when: ' + bad.map(x => x.id).join(','));
    t.batches[b] = { ...(t.batches[b] || {}), frozen: true, frozen_at: L.nowIso(), frozen_hash: scopeHash(t, b) };
    L.saveTasks(t); L.appendRunLog(`batch ${b} FROZEN (scope hash ${t.batches[b].frozen_hash.slice(0, 12)})`); console.log('frozen', b, t.batches[b].frozen_hash.slice(0, 12));
  } else if (sub === 'check') {
    const cur = scopeHash(t, b), fr = (t.batches[b] || {}).frozen_hash;
    console.log(fr ? (cur === fr ? 'OK: scope unchanged since freeze' : 'SCOPE CHANGED since freeze!') : 'batch not frozen');
    process.exit(fr && cur !== fr ? 3 : 0);
  } else if (sub === 'report') {
    const rows = t.tasks.filter(x => x.batch === b);
    const by = s => rows.filter(x => x.status === s);
    console.log(`BATCH ${b}: ${rows.length} tasks — DONE ${by('DONE').length}, BLOCKED ${by('BLOCKED').length}, QUEUED ${by('QUEUED').length}, IN_PROGRESS ${by('IN_PROGRESS').length}`);
    for (const x of rows) {
      const ds = depState(t, x);
      console.log(` ${x.id} [${x.status}]${ds.blockedBy.length ? ' blocked-by ' + ds.blockedBy.join(',') : ''}${x.blocked_reason ? ' — UNBLOCK: ' + x.blocked_reason : ''}  ${x.title.slice(0, 70)}`);
    }
  } else L.die('usage: batch freeze|check|report <B>');
} else if (cmd === 'run') {
  const t = need(L.loadTasks()); const sub = pos[1];
  if (sub === 'start') {
    const b = pos[2]; if (!b) L.die('usage: run start <batch> [--hours 3]');
    const bt = t.batches[b]; if (!bt || !bt.frozen) L.die(`batch ${b} must be FROZEN first: node ops/tasks.js batch freeze ${b}`);
    if (scopeHash(t, b) !== bt.frozen_hash) L.die('scope changed since freeze — refuse to run (a run executes exactly the frozen contract)');
    const stale = t.tasks.filter(x => x.batch === b && x.status === 'QUEUED' && ageHours(x.reconfirmed || bt.frozen_at || x.added) > CFG.staleAfterHours);
    if (stale.length) L.die(`stale (> ${CFG.staleAfterHours}h since freeze/reconfirm) — ask the owner "still valid?" then: set <id> QUEUED --reconfirm: ` + stale.map(x => x.id).join(','));
    t.run = { active: true, batch: b, started_at: L.nowIso(), max_hours: Number(flags.hours) || CFG.defaultRunMaxHours, max_iterations: CFG.defaultRunMaxIterations };
    L.saveTasks(t); fs.rmSync(L.p('ops', '.state', 'stop-guard.json'), { force: true });
    L.appendRunLog(`RUN START batch ${b} (max ${t.run.max_hours} h)`); console.log('run started:', b);
  } else if (sub === 'finish') {
    t.run = { active: false, last_batch: t.run && t.run.batch, finished_at: L.nowIso() }; L.saveTasks(t); L.appendRunLog('RUN FINISH'); console.log('run finished');
  } else if (sub === 'status') {
    const r = t.run || {}; console.log(JSON.stringify(r)); if (r.active) console.log('runnable now:', runnable(t, r.batch).map(x => x.id).join(', ') || '(none)');
  } else L.die('usage: run start|finish|status');
} else if (cmd === 'next') {
  const t = need(L.loadTasks()); const b = flags.batch || (t.run && t.run.batch); if (!b) L.die('no active batch');
  const r = runnable(t, b); if (!r.length) { console.log('NONE'); process.exit(0); }
  const x = r.find(y => y.status === 'IN_PROGRESS') || r[0];
  console.log(`${x.id}: ${x.title}\nDONE-WHEN: ${x.done_when}`);
} else if (cmd === 'edit') {
  // Controlled edit of a task that is NOT DONE and whose batch is NOT frozen (used to promote a DISCUSS task into a batch).
  const t = need(L.loadTasks()); const x = getTask(t, pos[1]);
  if (x.status === 'DONE') L.die('a DONE task is frozen history — add a new task instead');
  if (x.batch && t.batches[x.batch] && t.batches[x.batch].frozen) L.die(`batch ${x.batch} is FROZEN — its tasks cannot be edited`);
  if (flags.batch && t.batches[flags.batch] && t.batches[flags.batch].frozen) L.die(`batch ${flags.batch} is FROZEN — cannot add tasks to it`);
  if (flags.title) x.title = flags.title;
  if (flags['done-when']) x.done_when = flags['done-when'];
  if (flags.deps !== undefined) x.depends_on = flags.deps === true || flags.deps === '' ? [] : String(flags.deps).split(',').map(s => s.trim());
  if (flags.batch) { x.batch = flags.batch; if (!t.batches[flags.batch]) t.batches[flags.batch] = { created: L.nowIso(), frozen: false }; }
  hist(x, x.status, 'edited: ' + Object.keys(flags).join(','));
  L.saveTasks(t); console.log('edited', x.id);
} else if (cmd === 'attempt') {
  // Anti-stuck tracker: record every failed approach on a task. At 3 the protocol is mandatory (docs/PROCESS.md §6).
  const t = need(L.loadTasks()); const x = getTask(t, pos[1]);
  if (!pos[2]) L.die('usage: attempt <id> "what was tried and how it failed"');
  x.attempts = x.attempts || []; x.attempts.push({ at: L.nowIso(), note: pos.slice(2).join(' ') });
  hist(x, x.status, 'attempt ' + x.attempts.length + ': ' + pos.slice(2).join(' ').slice(0, 200)); L.saveTasks(t);
  L.appendRunLog(`attempt ${x.attempts.length} on ${x.id}: ${pos.slice(2).join(' ').slice(0, 160)}`);
  console.log(`attempt ${x.attempts.length} recorded for ${x.id}`);
  if (x.attempts.length >= 3) {
    console.log(`\nSTUCK PROTOCOL (mandatory now — ${x.attempts.length} attempts on ${x.id}):
 1. STOP repeating the same approach. Do not spend more tokens on it.
 2. RESEARCH online (WebSearch/WebFetch): how do others solve this exact problem? Look for a different technique, a library, a known bug/issue.
 3. Write down 2 genuinely DIFFERENT alternatives (different mechanism, not a tweak) and try the cheapest one. Record it with: node ops/tasks.js attempt ${x.id} "<approach>".
 4. Consider a smaller/safer slice of the task, or mocking the blocked dependency, so the rest can ship.
 5. If it still cannot be solved without a human: node ops/tasks.js set ${x.id} BLOCKED --note "<exact help needed from the owner: what, where, why>" and MOVE ON to the next task.`);
    process.exit(3);
  }
} else if (cmd === 'log') {
  L.appendRunLog(pos.slice(1).join(' ')); console.log('logged');
} else if (cmd === 'list') {
  const t = need(L.loadTasks());
  for (const x of t.tasks) if (!flags.batch || x.batch === flags.batch) console.log(`${x.id}\t${x.status}\t${x.batch || '-'}\t${x.title.slice(0, 80)}`);
} else if (cmd === 'show') {
  const t = need(L.loadTasks()); console.log(JSON.stringify(getTask(t, pos[1]), null, 2));
} else if (cmd === 'render') {
  const t = need(L.loadTasks()); require('./render').render(t); console.log('rendered ' + CFG.renderedTasksFile);
} else if (cmd === 'verify-ok') {
  const t = need(L.loadTasks()); const v = verifyOk(pos[1] ? getTask(t, pos[1]) : {}); console.log(v.ok ? 'OK: ' + v.why : 'NOT OK: ' + v.why); process.exit(v.ok ? 0 : 1);
} else {
  console.log(`ADK tasks — commands:
  init | migrate | list [--batch B] | show <id> | render | next | log "text"
  add --id T-011 --title ".." [--done-when ".."] [--batch B5] [--deps T-1,T-2] [--status QUEUED] [--no-verify]
  set <id> <STATUS> [--note ".."] [--evidence ".."] [--reconfirm]
  batch freeze|check|report <B>
  run start <B> [--hours 3] | run status | run finish
  verify-ok [<id>]`);
}
}
module.exports = { depState, runnable, scopeHash, verifyOk, STATUSES };
if (require.main === module) main();
