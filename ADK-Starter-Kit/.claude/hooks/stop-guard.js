#!/usr/bin/env node
// ADK Stop hook. Purpose: while a declared run is ACTIVE and runnable tasks remain, the agent may not stop.
// It NEVER blocks in normal chat (no active run) and it always lets go when: no runnable task is left,
// the run's time limit is reached, the iteration cap is reached, or the owner ran `node ops/tasks.js run finish`.
// Contract with Claude Code: reads JSON on stdin; to block, prints {"decision":"block","reason":"..."} and exits 0.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const TASKS = path.join(ROOT, 'tasks.json');
const STATE = path.join(ROOT, 'ops', '.state', 'stop-guard.json');

function allow() { process.exit(0); }
function readJson(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }

let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const t = readJson(TASKS, null);
    if (!t || !t.run || !t.run.active) return allow();                       // no run => never interfere
    const r = t.run;
    const st = readJson(STATE, { count: 0, startedFor: null });
    if (st.startedFor !== r.started_at) { st.count = 0; st.startedFor = r.started_at; }
    const hoursUsed = (Date.now() - Date.parse(r.started_at)) / 3600e3;
    if (hoursUsed >= (r.max_hours || 3)) return allow();                       // time box reached
    if (st.count >= (r.max_iterations || 200)) return allow();                // safety cap
    const done = id => (t.tasks.find(x => x.id === id) || {}).status === 'DONE';
    const runnable = t.tasks.filter(x => x.batch === r.batch && ['QUEUED', 'IN_PROGRESS'].includes(x.status) && (x.depends_on || []).every(done));
    if (!runnable.length) return allow();                                      // everything DONE or BLOCKED (with reasons) => finish
    st.count++; fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(st));
    const next = runnable.find(x => x.status === 'IN_PROGRESS') || runnable[0];
    const left = runnable.map(x => x.id).join(', ');
    const reason = `RUN ACTIVE (batch ${r.batch}, ${hoursUsed.toFixed(1)}h of ${r.max_hours}h used). ${runnable.length} runnable task(s) remain: ${left}. `
      + `Do NOT stop and do NOT summarize yet. Next: run "node ops/tasks.js next", implement exactly that task, run "node ops/verify.js", then "node ops/tasks.js set <id> DONE --evidence ...". `
      + `If a task cannot proceed, mark it BLOCKED with the exact owner action ("node ops/tasks.js set <id> BLOCKED --note ...") and continue with the next independent task. `
      + `If the same problem has failed 3 times: record it (node ops/tasks.js attempt <id> "…") and follow the STUCK PROTOCOL (research online, change approach, then BLOCKED with exact help needed) — never keep retrying the same thing. `
      + `Only stop early if the owner explicitly told you to stop in chat.`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  } catch (e) { allow(); }                                                     // any hook error must never trap the session
});
