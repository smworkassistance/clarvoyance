// ADK shared helpers (generic — no project specifics; those live in ops/adk.config.json)
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'adk.config.json'), 'utf8'));
const STATE_DIR = path.join(__dirname, '.state');
const p = (...a) => path.join(ROOT, ...a);

function readJson(f, dflt) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return dflt; } }
function writeJson(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); }
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function fileHash(rel) { try { return sha(fs.readFileSync(p(rel))); } catch (e) { return null; } }
function nowIso() { return new Date().toISOString(); }
// IST wall-clock string for humans (project owner works in IST)
function ist(d) { return new Date(d || Date.now()).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', ''); }
function git(args, opts) { return cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', ...(opts || {}) }).trim(); }
function tasksPath() { return p(CFG.tasksFile); }
function loadTasks() { return readJson(tasksPath(), null); }
function saveTasks(t) { writeJson(tasksPath(), t); }
function appendRunLog(line) {
  const f = p(CFG.runLogFile); fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, '# RUN LOG\n\nAppend-only. Newest at the bottom. Written by ops/tasks.js log and by the agent.\n\n');
  fs.appendFileSync(f, `- ${ist()} IST — ${line}\n`);
}
function die(msg, code) { console.error('ERROR: ' + msg); process.exit(code || 1); }
function parseArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) flags[k] = true; else { flags[k] = n; i++; } }
    else pos.push(a);
  }
  return { pos, flags };
}
module.exports = { ROOT, CFG, STATE_DIR, p, readJson, writeJson, sha, fileHash, nowIso, ist, git, tasksPath, loadTasks, saveTasks, appendRunLog, die, parseArgs };
