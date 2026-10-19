#!/usr/bin/env node
// Local test server for candidate clarvoyance_vNNN.html files — keeps real browser testing
// (incl. a full Google sign-in round trip, needed for Community/any login-gated feature) off
// clar.co.in entirely. Never touches index.html/sw.js (the live files) or any production state.
//
//   node ops/dev-serve.js            serves the repo root; / -> highest-numbered clarvoyance_vNNN.html
//   node ops/dev-serve.js v276       serves /clarvoyance_v276.html at the / route instead
//   node ops/dev-serve.js --port=9000
//
// Why this works for Google sign-in: every clarvoyance_vNNN.html built since v276 sets its own
// REDIRECT_URL to http://<hostname>:<port>/ whenever location.hostname is localhost/127.0.0.1
// (see the "v276" comment next to `var REDIRECT_URL` in the file) — so the OAuth round trip
// completes back to THIS server, in THIS tab, instead of redirecting to clar.co.in. That is an
// automatic per-file behavior, not something this script configures — nothing here needs to
// change when a newer candidate file is tested.
//
// One-time, additive owner step: http://localhost:8787/ must be on Supabase's Redirect URLs
// allow-list (Authentication -> URL Configuration, project unvwjuceuyruqdnmvxlc). It only adds
// a second allowed redirect target; it never removes or touches the production
// https://clar.co.in/ entry. If sign-in still bounces to clar.co.in or errors
// "requested path is invalid", that allow-list entry is the first thing to check.
//
// GET /__versions — JSON list of every whole-file clarvoyance_vNNN.html candidate in the repo
// root, newest first, e.g. [{"file":"clarvoyance_v276.html","version":276}, ...]. Lettered
// area-split variants (v271a.html etc.) are excluded — same filter as the auto-landing pick
// below. CORS-open (Access-Control-Allow-Origin: *) so admin.html's "Local Test" picker can
// fetch it cross-origin from https://clar.co.in/admin.html; this process only ever binds to
// 127.0.0.1, so nothing on the network can reach it besides this machine either way.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const CANDIDATE_RE = /^clarvoyance_v(\d+)([a-z]?)\.html$/i;

function allCandidates() {
  const out = [];
  for (const f of fs.readdirSync(ROOT)) {
    const m = f.match(CANDIDATE_RE);
    if (!m || m[2]) continue; // skip lettered area-split variants (v271a etc.) — whole-file candidates only
    out.push({ file: f, version: parseInt(m[1], 10) });
  }
  out.sort((a, b) => b.version - a.version);
  return out;
}

const args = process.argv.slice(2);
let port = 8787;
let landing = null;
for (const a of args) {
  if (a.startsWith('--port=')) port = parseInt(a.slice(7), 10);
  else if (/^v?\d+$/i.test(a)) landing = 'clarvoyance_v' + a.replace(/^v/i, '') + '.html';
}
const candidates = allCandidates();
if (!landing) landing = candidates.length ? candidates[0].file : null;
if (!landing || !fs.existsSync(path.join(ROOT, landing))) {
  console.error('No candidate file found (expected clarvoyance_vNNN.html in ' + ROOT + ')');
  process.exit(1);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // local-only (bound to 127.0.0.1), read-only — safe to leave open for admin.html's cross-origin picker fetch
  let p = new URL(req.url, 'http://x').pathname; // strip query string — needed so the OAuth ?code=/?error= landing hit still resolves to a real file
  if (p === '/__versions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allCandidates()));
    return;
  }
  if (p === '/' || p === '') p = '/' + landing;
  const fp = path.join(ROOT, decodeURIComponent(p));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('403'); return; } // no path traversal out of the repo
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('404 — try /' + landing); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log('Dev server: http://localhost:' + port + '/  ->  ' + landing);
  console.log(candidates.length + ' candidate file(s) found; list at http://localhost:' + port + '/__versions');
  console.log('Bound to 127.0.0.1 only. Does not touch index.html/sw.js or clar.co.in. Ctrl+C to stop.');
});
