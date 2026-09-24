// Renders tasks.json -> TASKS.md (a read-only view for the owner). Never hand-edit TASKS.md; it is overwritten.
const fs = require('fs');
const L = require('./lib');
const { CFG } = L;

function cell(s, n) { s = String(s == null ? '' : s).replace(/\r?\n/g, ' ').replace(/\|/g, '/'); return n && s.length > n ? s.slice(0, n - 1) + '…' : s; }

function render(t) {
  const { depState } = require('./tasks');
  const out = [];
  out.push('# TASKS — Clarvoyance task queue');
  out.push('');
  out.push('> **Generated file — do not edit by hand.** Source of truth: `tasks.json` (changed only through `node ops/tasks.js …`).');
  out.push('> Process, rules, Definition of Done, rollback: **`docs/PROCESS.md`**. Decisions: **`docs/DECISIONS.md`**. Run history: **`docs/RUNLOG.md`**.');
  out.push(`> Rendered ${L.ist()} IST.`);
  out.push('');
  const r = t.run || {};
  out.push('## Run status');
  out.push(r.active ? `**ACTIVE** — batch ${r.batch}, started ${L.ist(r.started_at)} IST, limit ${r.max_hours} h.` : 'No run active.');
  out.push('');
  const blocked = t.tasks.filter(x => x.status === 'BLOCKED');
  out.push('## What the OWNER must do (all BLOCKED items, exact action)');
  if (!blocked.length) out.push('_Nothing — no blocked tasks._');
  for (const x of blocked) out.push(`- **${x.id}** — ${x.blocked_reason || '(no reason recorded!)'}`);
  out.push('');
  out.push('## Batches');
  const bs = Object.keys(t.batches).sort();
  for (const b of bs) {
    const rows = t.tasks.filter(x => x.batch === b), done = rows.filter(x => x.status === 'DONE').length;
    const bt = t.batches[b];
    out.push(`- **${b}** — ${bt.frozen ? 'frozen ' + L.ist(bt.frozen_at) + ' IST' : 'not frozen'} — ${done}/${rows.length} done: ${rows.map(x => x.id + '(' + x.status + ')').join(', ')}`);
  }
  out.push('');
  out.push('## Task table');
  out.push('');
  out.push('| ID | Added (IST) | Task | Status | Batch | Depends on | Completed (IST) |');
  out.push('|----|-------------|------|--------|-------|------------|-----------------|');
  for (const x of t.tasks) {
    const ds = depState(t, x);
    const dep = (x.depends_on || []).join(', ') + (ds.blockedBy.length ? ' ⛔ blocked-by ' + ds.blockedBy.join(',') : '');
    out.push(`| ${x.id} | ${L.ist(x.added)} | ${cell(x.title, 110)} | ${x.status} | ${x.batch || '—'} | ${cell(dep, 60) || '—'} | ${x.completed ? L.ist(x.completed) : (x.completed_text || '—')} |`);
  }
  out.push('');
  out.push('## Task details (acceptance + result evidence)');
  for (const x of t.tasks) {
    out.push('');
    out.push(`### ${x.id} — ${x.title}`);
    out.push(`- Status: **${x.status}**  · Batch: ${x.batch || '—'}  · Depends on: ${(x.depends_on || []).join(', ') || '—'}`);
    if (x.done_when) out.push(`- Done-when: ${x.done_when}`);
    if (x.blocked_reason) out.push(`- **Blocked — owner action:** ${x.blocked_reason}`);
    if (x.result) out.push(`- Result / evidence: ${x.result.replace(/\n/g, '\n  ')}`);
  }
  out.push('');
  fs.writeFileSync(L.p(CFG.renderedTasksFile), out.join('\n'));
}
module.exports = { render };
