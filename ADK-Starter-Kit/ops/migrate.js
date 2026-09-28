// One-time migration: hand-written TASKS.md (v1, "judgaad") -> tasks.json + docs/*. Nothing is lost:
// the original file is archived verbatim to docs/archive/, decisions and run-log sections are copied into docs/.
const fs = require('fs');
const L = require('./lib');

function section(md, heading) {
  const i = md.indexOf('## ' + heading); if (i < 0) return '';
  const rest = md.slice(i + 3 + heading.length);
  const j = rest.search(/\n## /);
  return (j < 0 ? rest : rest.slice(0, j)).trim();
}

function migrate() {
  const src = L.p('TASKS.md'); if (!fs.existsSync(src)) L.die('no TASKS.md to migrate');
  if (L.loadTasks()) L.die('tasks.json already exists — refusing to overwrite');
  const md = fs.readFileSync(src, 'utf8');
  // safety: never migrate from an already-rendered (generated) file — that would silently lose the real data
  if (md.includes('Generated file — do not edit by hand')) L.die('TASKS.md is already the generated view; restore the hand-written original first (git checkout <old-commit> -- TASKS.md)');
  if (fs.existsSync(L.p('docs', 'archive', 'TASKS_v1_hand-written_2026-09-25.md'))) L.die('archive already exists — refusing to overwrite the original');
  fs.mkdirSync(L.p('docs', 'archive'), { recursive: true });
  fs.writeFileSync(L.p('docs', 'archive', 'TASKS_v1_hand-written_2026-09-25.md'), md);

  const rows = md.split('\n').filter(l => /^\| T-\d+ \|/.test(l));
  const tasks = [];
  for (const line of rows) {
    let c = line.split('|').map(s => s.trim()); c = c.slice(1, c.length - 1);
    const [id, added, title, done_when, status, batch, vfile, completed] = c;
    const result = c.slice(8).join(' | ');
    const m = added.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    const addedIso = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 5, +m[5] - 30)).toISOString() : L.nowIso(); // IST -> UTC
    const t = { id, title, added: addedIso, done_when: done_when === '—' ? '' : done_when, status, batch: batch === '—' ? null : batch, depends_on: [], verify: true, files: vfile === '—' ? '' : vfile, result: result === '—' ? '' : result, completed: (function(){ const mm=(completed||'').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/); return mm ? new Date(Date.UTC(+mm[1], +mm[2]-1, +mm[3], +mm[4]-5, +mm[5]-30)).toISOString() : null; })(), completed_text: completed === '—' ? '' : completed, history: [{ at: L.nowIso(), status, note: 'migrated from TASKS.md v1' }] };
    if (status === 'BLOCKED') t.blocked_reason = 'see result (legacy note)';
    tasks.push(t);
  }
  const dep = { 'T-004': ['T-005'], 'T-008': ['T-005'] };
  const titleFix = { 'T-006': 'Video in Community posts (30 s cap) — built on Bunny Stream (originally planned on R2/Stream; owner chose Bunny 2026-09-25)' };
  for (const t of tasks) if (titleFix[t.id]) t.title = titleFix[t.id];
  for (const t of tasks) if (dep[t.id]) t.depends_on = dep[t.id];
  const batches = {};
  for (const t of tasks) if (t.batch) { batches[t.batch] = batches[t.batch] || { created: t.added, frozen: true, frozen_at: t.added, legacy: true }; }
  const store = { project: L.CFG.project, schema: 1, run: { active: false }, batches, tasks };
  L.saveTasks(store);
  // scope hashes for legacy batches (so `batch check` works on them too)
  const { scopeHash } = require('./tasks');
  for (const b of Object.keys(batches)) batches[b].frozen_hash = scopeHash(store, b);
  L.saveTasks(store);

  const dec = section(md, 'DECISIONS LOG (everything agreed with the owner, 2026-09-24 session — do not lose)') || section(md, 'DECISIONS LOG');
  const log = section(md, 'RUN LOG (Claude appends here as it works, so an interrupted run is resumable)') || section(md, 'RUN LOG');
  fs.writeFileSync(L.p('docs', 'DECISIONS.md'), '# DECISIONS LOG\n\nAppend-only. Every decision the owner and Claude agreed, with date. Newest sections at the bottom.\n\n## 2026-09-24/25 — decisions carried over from TASKS.md v1\n\n' + dec + '\n');
  const rl = L.p('docs', 'RUNLOG.md');
  fs.writeFileSync(rl, '# RUN LOG\n\nAppend-only. Newest at the bottom. Written by `node ops/tasks.js log` and by the agent.\n\n## Carried over from TASKS.md v1\n\n' + log + '\n\n');
  console.log(`migrated ${tasks.length} tasks, ${Object.keys(batches).length} batches; original archived`);
}
module.exports = { migrate };
