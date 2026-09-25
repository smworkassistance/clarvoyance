// Read-only live check of clar.co.in v248 in the owner's signed-in Chrome (raw CDP, no npm deps). Never posts/toggles anything.
// usage: node qa/cdp-live.js <step>   steps are run in one go below.
const http = require('http');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '_live');
fs.mkdirSync(OUT, { recursive: true });

function getJson(url, method) {
  return new Promise((res, rej) => {
    const r = http.request(url, { method: method || 'GET' }, m => { let d = ''; m.on('data', c => d += c); m.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); });
    r.on('error', rej); r.end();
  });
}
let ws, id = 0; const pend = new Map();
function send(method, params) { return new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params: params || {} })); }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; }
async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')); }

(async () => {
  const t = await getJson('http://127.0.0.1:9222/json/new?about:blank', 'PUT');
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  const consoleErrs = [];
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') consoleErrs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description).slice(0, 200)); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrs.push('LOG ' + m.params.entry.text.slice(0, 120) + ' ' + (m.params.entry.url || '').slice(0, 80)); });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: 'https://clar.co.in/?nav=2&cb=' + Date.now() });
  await sleep(9000);
  const out = {};
  out.version = await ev("document.getElementById('prof-app-ver').textContent");
  out.navV2 = await ev("document.body.classList.contains('nav-v2')");
  out.googleUser = await ev('window._isGoogleUser');
  out.newButtons = await ev("[...document.querySelectorAll('.nv2-tab')].map(e=>e.getAttribute('data-nv2')).join(',')");
  out.swRegistered = await ev("navigator.serviceWorker.getRegistration().then(r=>!!r)");
  // dismiss any onboarding overlay the way a user would (only "maybe later"/skip, never sign-in/registration)
  await ev("(()=>{try{if(typeof lifeQuizSkipForever==='function')lifeQuizSkipForever();}catch(e){} const g=document.getElementById('gsignin-screen'); if(g&&getComputedStyle(g).display!=='none'){const b=[...g.querySelectorAll('button,a,div')].find(e=>/maybe later/i.test(e.textContent)&&e.children.length===0);if(b)b.click();} return 1})()");
  await sleep(1500);
  await shot('01-home-or-chat');
  const click = async k => { await ev(`document.querySelector('.nv2-tab[data-nv2="${k}"]').click()`); await sleep(2500); };
  await click('you'); await sleep(2500);
  out.youTitle = await ev("(document.querySelector('#soc-top .soc-title')||{}).textContent");
  out.youHasStats = await ev("!!document.querySelector('.soc-stats')");
  out.youHasFortune = await ev("!!document.querySelector('.v2-fortune')");
  out.youHasRank = await ev("!!document.querySelector('.v2-rank')");
  out.rankText = await ev("(document.getElementById('v2-rank')||{}).innerText");
  out.goalHeads = await ev("[...document.querySelectorAll('#soc-body .soc-h')].map(e=>e.innerText).join(' | ')");
  out.gateShown = await ev("!!document.querySelector('.v2-prev')");
  out.activeNav = await ev("(document.querySelector('.nv2-tab.active')||{getAttribute(){return null}}).getAttribute('data-nv2')");
  await shot('02-you');
  if (out.youHasRank) {
    await ev("document.getElementById('v2-rank').click()"); await sleep(3000);
    out.boardTitle = await ev("(document.querySelector('#soc-top .soc-title')||{}).textContent");
    out.boardRows = await ev("document.querySelectorAll('.soc-lb,.soc-pod').length");
    await shot('03-board');
    await ev("document.querySelector('#soc-top [data-act=\"v2-back\"]').click()"); await sleep(1500);
  }
  await click('feed'); await sleep(2500);
  out.feedTabs = await ev("[...document.querySelectorAll('#soc-tabs .soc-tab')].filter(t=>getComputedStyle(t).display!=='none').map(t=>t.innerText.trim()).join(',')");
  await shot('04-feed');
  await ev("document.querySelector('#soc-tabs .soc-tab[data-tab=\"find\"]').click()"); await sleep(3500);
  out.discoverCards = await ev("document.querySelectorAll('#soc-body .soc-card').length");
  await shot('05-discover');
  for (const k of ['vibe', 'goal', 'home', 'chat']) { await click(k); out['tab_' + k] = await ev("(document.querySelector('.nv2-tab.active')||{getAttribute(){return null}}).getAttribute('data-nv2')"); }
  await shot('06-chat');
  out.consoleErrors = consoleErrs;
  console.log(JSON.stringify(out, null, 1));
  await getJson('http://127.0.0.1:9222/json/close/' + t.id).catch(() => {});
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
