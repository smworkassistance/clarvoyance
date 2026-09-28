#!/usr/bin/env node
// ADK acceptance test: proves the process rules are enforced BY CODE. Runs entirely in a throw-away sandbox
// (a copy of ops/ + the Stop hook + a fake tasks.json/app files) — it never touches the real tasks.json or app files.
//   node ops/selftest.js
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const REAL = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'adk-selftest-'));
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra && !cond ? ' — ' + extra : '')); };

// --- build sandbox ---
fs.mkdirSync(path.join(SB, 'ops'), { recursive: true });
fs.mkdirSync(path.join(SB, '.claude', 'hooks'), { recursive: true });
for (const f of ['lib.js', 'tasks.js', 'render.js', 'migrate.js', 'adk.config.json']) fs.copyFileSync(path.join(REAL, 'ops', f), path.join(SB, 'ops', f));
fs.copyFileSync(path.join(REAL, '.claude', 'hooks', 'stop-guard.js'), path.join(SB, '.claude', 'hooks', 'stop-guard.js'));
fs.mkdirSync(path.join(SB, 'docs'), { recursive: true });
fs.writeFileSync(path.join(SB, 'app.html'), '<html>v1</html>');
const cfg = JSON.parse(fs.readFileSync(path.join(SB, 'ops', 'adk.config.json'), 'utf8'));
cfg.staleAfterHours = 24; fs.writeFileSync(path.join(SB, 'ops', 'adk.config.json'), JSON.stringify(cfg));

const T = (...a) => cp.spawnSync('node', ['ops/tasks.js', ...a], { cwd: SB, encoding: 'utf8' });
const HOOK = (stdin) => cp.spawnSync('node', ['.claude/hooks/stop-guard.js'], { cwd: SB, input: stdin || '{}', encoding: 'utf8' });
const tj = () => JSON.parse(fs.readFileSync(path.join(SB, 'tasks.json'), 'utf8'));
const save = o => fs.writeFileSync(path.join(SB, 'tasks.json'), JSON.stringify(o, null, 2));
const writeVerify = (o) => { fs.mkdirSync(path.join(SB, 'ops', '.state'), { recursive: true }); fs.writeFileSync(path.join(SB, 'ops', '.state', 'last-verify.json'), JSON.stringify(o)); };
const h = f => require('crypto').createHash('sha256').update(fs.readFileSync(path.join(SB, f))).digest('hex');
const goodVerify = () => ({ ok: true, at: new Date().toISOString(), quick: false, fileHashes: { 'app.html': h('app.html') } });

try {
  // ---------- task engine ----------
  ok('init creates tasks.json', T('init').status === 0 && fs.existsSync(path.join(SB, 'tasks.json')));
  ok('QUEUED without done-when is refused', T('add', '--id', 'A', '--title', 'a', '--status', 'QUEUED').status !== 0);
  ok('add QUEUED with done-when works', T('add', '--id', 'A', '--title', 'task A', '--done-when', 'x', '--batch', 'B1', '--status', 'QUEUED').status === 0);
  ok('duplicate id is refused (ids never reused)', T('add', '--id', 'A', '--title', 'dup', '--status', 'DISCUSS').status !== 0);
  ok('B depends on A', T('add', '--id', 'B', '--title', 'task B', '--done-when', 'y', '--batch', 'B1', '--deps', 'A', '--status', 'QUEUED').status === 0);
  ok('C independent', T('add', '--id', 'C', '--title', 'task C', '--done-when', 'z', '--batch', 'B1', '--status', 'QUEUED').status === 0);
  ok('run start refuses an unfrozen batch', T('run', 'start', 'B1').status !== 0);
  ok('batch freeze works', T('batch', 'freeze', 'B1').status === 0);
  ok('adding a task to a FROZEN batch is refused', T('add', '--id', 'D', '--title', 'late idea', '--done-when', 'q', '--batch', 'B1', '--status', 'QUEUED').status !== 0);
  ok('a new idea can be captured as PROPOSED (no batch)', T('add', '--id', 'P1', '--title', 'idea', '--status', 'PROPOSED').status === 0);
  // scope tamper: edit acceptance text directly in the file -> run start must refuse
  let t = tj(); t.tasks.find(x => x.id === 'C').done_when = 'CHANGED'; save(t);
  ok('run start refuses when scope changed after freeze', T('run', 'start', 'B1').status !== 0);
  t = tj(); t.tasks.find(x => x.id === 'C').done_when = 'z'; save(t);
  // staleness
  t = tj(); t.batches.B1.frozen_at = new Date(Date.now() - 30 * 3600e3).toISOString(); save(t);
  ok('run start refuses stale (>24h) queued tasks', T('run', 'start', 'B1').status !== 0);
  ok('re-confirm clears staleness', T('set', 'A', 'QUEUED', '--reconfirm').status === 0 && T('set', 'B', 'QUEUED', '--reconfirm').status === 0 && T('set', 'C', 'QUEUED', '--reconfirm').status === 0);
  ok('run start works once fresh + unchanged', T('run', 'start', 'B1').status === 0);

  // ---------- dependencies ----------
  ok('B cannot start before A is DONE', T('set', 'B', 'IN_PROGRESS').status !== 0);
  ok('next picks a dependency-ready task (A or C, never B)', /^(A|C):/.test(T('next').stdout));

  // ---------- DONE gating ----------
  ok('DONE without --evidence is refused', T('set', 'A', 'DONE').status !== 0);
  ok('DONE with no verify record is refused', T('set', 'A', 'DONE', '--evidence', 'e').status !== 0);
  writeVerify({ ...goodVerify(), ok: false });
  ok('DONE after a FAILED verify is refused', T('set', 'A', 'DONE', '--evidence', 'e').status !== 0);
  writeVerify({ ...goodVerify(), quick: true });
  ok('DONE after only a --quick verify is refused', T('set', 'A', 'DONE', '--evidence', 'e').status !== 0);
  writeVerify({ ...goodVerify(), at: new Date(Date.now() - 3 * 3600e3).toISOString() });
  ok('DONE with an OLD verify is refused', T('set', 'A', 'DONE', '--evidence', 'e').status !== 0);
  writeVerify(goodVerify());
  fs.writeFileSync(path.join(SB, 'app.html'), '<html>v1 EDITED AFTER VERIFY</html>');
  ok('DONE is refused if the files changed after verify (bytes bound)', T('set', 'A', 'DONE', '--evidence', 'e').status !== 0);
  writeVerify(goodVerify());
  ok('DONE with fresh full passing verify + evidence is accepted', T('set', 'A', 'DONE', '--evidence', 'checked X=3').status === 0 && tj().tasks.find(x => x.id === 'A').status === 'DONE');
  ok('evidence is recorded on the task', /checked X=3/.test(tj().tasks.find(x => x.id === 'A').result));

  // ---------- blocked handling ----------
  ok('BLOCKED without an exact owner action is refused', T('set', 'C', 'BLOCKED').status !== 0);
  ok('BLOCKED with a reason works', T('set', 'C', 'BLOCKED', '--note', 'owner runs db/x.sql in Supabase').status === 0);
  ok('report shows the unblock action', /UNBLOCK: owner runs db\/x\.sql/.test(T('batch', 'report', 'B1').stdout));

  // ---------- Stop hook ----------
  // B (deps A=DONE) is still QUEUED and runnable -> hook must block
  const blocked = HOOK();
  let bj = null; try { bj = JSON.parse(blocked.stdout); } catch (e) {}
  ok('hook BLOCKS stopping while a runnable task remains', blocked.status === 0 && bj && bj.decision === 'block' && /B/.test(bj.reason), blocked.stdout);
  ok('hook reason tells the agent what to do next', bj && /node ops\/tasks\.js next/.test(bj.reason) && /BLOCKED/.test(bj.reason));
  // finish B -> only BLOCKED left -> hook must allow stop
  T('set', 'B', 'IN_PROGRESS'); writeVerify(goodVerify()); T('set', 'B', 'DONE', '--evidence', 'ok');
  ok('hook ALLOWS stopping when only BLOCKED tasks remain', HOOK().stdout.trim() === '' && HOOK().status === 0);
  // dependency behind a BLOCKED task must not be treated as runnable
  T('add', '--id', 'E', '--title', 'needs C', '--done-when', 'e', '--batch', 'B2', '--deps', 'C', '--status', 'QUEUED'); T('batch', 'freeze', 'B2');
  t = tj(); t.run = { active: true, batch: 'B2', started_at: new Date().toISOString(), max_hours: 3, max_iterations: 200 }; save(t);
  ok('hook allows stop when the only remaining task is blocked-by a BLOCKED dependency', HOOK().stdout.trim() === '');
  ok('report marks the dependent as blocked-by', /E \[QUEUED\] blocked-by C/.test(T('batch', 'report', 'B2').stdout));
  // no active run => never interferes
  t = tj(); t.run = { active: false }; save(t);
  t.tasks.push({ id: 'Z', title: 'z', status: 'QUEUED', batch: 'B1', depends_on: [], done_when: 'z' }); save(t);
  ok('hook never interferes when no run is active', HOOK().stdout.trim() === '');
  // time box + iteration cap + corrupt file
  t = tj(); t.run = { active: true, batch: 'B1', started_at: new Date(Date.now() - 4 * 3600e3).toISOString(), max_hours: 3, max_iterations: 200 }; save(t);
  ok('hook lets go after the time box', HOOK().stdout.trim() === '');
  t.run.started_at = new Date().toISOString(); save(t);
  fs.rmSync(path.join(SB, 'ops', '.state', 'stop-guard.json'), { force: true });
  ok('hook blocks again inside the time box', /"decision":"block"/.test(HOOK().stdout));
  fs.writeFileSync(path.join(SB, 'ops', '.state', 'stop-guard.json'), JSON.stringify({ count: 999, startedFor: t.run.started_at }));
  ok('hook lets go at the iteration cap (cannot loop forever)', HOOK().stdout.trim() === '');
  fs.writeFileSync(path.join(SB, 'tasks.json'), '{ not json');
  ok('hook never traps the session on a corrupt tasks.json', HOOK().status === 0 && HOOK().stdout.trim() === '');
  ok('hook survives garbage stdin', HOOK('%%%').status === 0);

  // ---------- migrate safety ----------
  fs.rmSync(path.join(SB, 'tasks.json'), { force: true });
  fs.writeFileSync(path.join(SB, 'TASKS.md'), '# TASKS\n\n> **Generated file — do not edit by hand.** blah\n');
  ok('migrate refuses to read an already-generated TASKS.md (would lose data)', T('migrate').status !== 0);
} finally {
  fs.rmSync(SB, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
