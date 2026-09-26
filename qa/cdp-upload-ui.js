// End-to-end video upload through the REAL compose UI on the deployed site, in the owner's signed-in Chrome (raw CDP), on a throttled mobile network.
// SAFETY: the final "create post" write (social_achievements POST) is blocked with Fetch.failRequest, so NOTHING is posted to the owner's account.
// The upload itself (ticket + tus to Bunny) is real; a leftover Bunny test video + 1 ledger row remain (harmless, listed in the output).
// usage: node qa/cdp-upload-ui.js [--net fast3g|slow4g|none] [--secs 150] [--url https://clar.co.in/] [--file path.mp4]
const http = require('http'), fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const NET = arg('net', 'fast3g'), SECS = +arg('secs', 150), URL_ = arg('url', 'https://clar.co.in/'), FILE = arg('file', path.join(__dirname, '_live', 'test4mb.mp4'));
function getJson(u, m) { return new Promise((res, rej) => { const r = http.request(u, { method: m || 'GET' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on('error', rej); r.end(); }); }
let ws, id = 0; const pend = new Map(); const events = [];
const send = (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };
const NETS = { fast3g: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }, slow4g: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }, none: null };

(async () => {
  fs.mkdirSync(path.join(__dirname, '_live'), { recursive: true });
  if (!fs.existsSync(FILE)) { // ~4 MB playable mp4 = the real sample clip + a 3 MB `free` box
    const src = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.mp4')), pad = 3 * 1024 * 1024, box = Buffer.alloc(pad); box.writeUInt32BE(pad, 0); box.write('free', 4, 'latin1');
    fs.writeFileSync(FILE, Buffer.concat([src, box]));
  }
  const t = await getJson('http://127.0.0.1:9222/json/new?about:blank', 'PUT');
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = async e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Fetch.requestPaused') { // block ONLY the post insert
      const u = m.params.request.url, meth = m.params.request.method;
      if (/\/rest\/v1\/social_achievements/.test(u) && meth === 'POST') { events.push('BLOCKED post insert (as intended)'); send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' }).catch(() => {}); }
      else send('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {});
    }
    if (m.method === 'Network.responseReceived' && /bunnycdn|clar-bunny/.test(m.params.response.url)) events.push(`${m.params.response.status} ${m.params.response.url.replace(/\?.*/, '').slice(0, 90)}`);
    if (m.method === 'Network.loadingFailed') events.push('NETFAIL ' + (m.params.errorText || '') + ' ' + (m.params.blockedReason || ''));
    if (m.method === 'Runtime.exceptionThrown') events.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description).slice(0, 200));
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/rest/v1/social_achievements*', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: URL_ + (URL_.includes('?') ? '&' : '?') + 'cb=' + Date.now() });
  await sleep(10000);
  await ev("(()=>{try{if(typeof lifeQuizSkipForever==='function')lifeQuizSkipForever();}catch(e){} const g=document.getElementById('gsignin-screen'); if(g&&getComputedStyle(g).display!=='none'){const b=[...g.querySelectorAll('button,a,div')].find(e=>/maybe later/i.test(e.textContent)&&e.children.length===0);if(b)b.click();} const d=document.getElementById('disc-screen'); if(d&&!d.classList.contains('hidden')&&typeof discAccept==='function')discAccept(); return 1})()");
  console.log('version', await ev("document.getElementById('prof-app-ver').textContent"), '| google user', await ev('window._isGoogleUser'));
  if (NETS[NET]) await send('Network.emulateNetworkConditions', { offline: false, ...NETS[NET] });
  await ev('SOC.openCreatePost()'); await sleep(3000);
  const doc = await send('DOM.getDocument', { depth: 1 });
  const inp = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#soc-vid-file' });
  if (!inp.nodeId) { console.log('NO #soc-vid-file (video disabled or not a Community member?)'); process.exit(3); }
  await send('DOM.setFileInputFiles', { nodeId: inp.nodeId, files: [FILE] });
  await sleep(2500);
  console.log('hint:', await ev("(document.getElementById('soc-ach-hint')||{}).textContent"));
  const t0 = Date.now();
  await ev("document.querySelector('[data-act=\"post-achievement\"]').click()");
  let last = '';
  const log = [];
  while (Date.now() - t0 < SECS * 1000) {
    await sleep(2000);
    const s = await ev("(()=>{const t=document.getElementById('uc-t'),b=document.getElementById('uc-bar-i');return t?(t.textContent+' | bar '+(b&&b.style.width)):'(no chip)'})()");
    if (s !== last) { log.push(`${Math.round((Date.now() - t0) / 1000)}s  ${s}`); last = s; console.log(log[log.length - 1]); }
    if (/^\(no chip\)/.test(s) && Date.now() - t0 > 6000) break;
  }
  console.log('\nnetwork events:'); events.slice(-25).forEach(e => console.log(' ', e));
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }).catch(() => {});
  ws.close(); process.exit(0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
