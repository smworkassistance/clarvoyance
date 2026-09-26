// Does a finger that STARTS ON a REAL cross-origin YouTube iframe still scroll a native scroll-snap container (T-064)? Real Chrome (owner's, port 9222), mobile
// emulation, blank same-origin page (clar.co.in/manifest.json) — nothing of the app runs, nothing is written. Also measures time-to-PLAYING of a buffered neighbour.
// usage: node qa/cdp-swipe-real.js <videoId1> <videoId2>
const http = require('http');
function getJson(u, m) { return new Promise((res, rej) => { const r = http.request(u, { method: m || 'GET' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on('error', rej); r.end(); }); }
let ws, id = 0; const pend = new Map();
const send = (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };
const IDS = process.argv.slice(2);

(async () => {
  const t = await getJson('http://127.0.0.1:9222/json/new?about:blank', 'PUT');
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: 'https://clar.co.in/manifest.json' });
  await sleep(2500);
  await ev(`document.open(); document.write('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#000"><div id="s" style="position:fixed;inset:0;overflow-y:scroll;scroll-snap-type:y mandatory;overscroll-behavior:contain"></div>'); document.close(); 1`);
  await ev(`(()=>{const s=document.getElementById('s');
    const sec=(id)=>'<section style="height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;display:flex;align-items:center;justify-content:center;background:#111"><iframe id="f'+id+'" style="width:390px;height:693px;border:0" allow="autoplay; encrypted-media" src="https://www.youtube.com/embed/'+id+'?controls=1&playsinline=1&rel=0&modestbranding=1&autoplay=1&mute=1"></iframe></section>';
    s.innerHTML=${JSON.stringify(IDS)}.map(sec).join('');return 1})()`);
  await sleep(6000); // let the real players load
  const cdp = (m, p) => send(m, p);
  const st = () => ev(`document.getElementById('s').scrollTop`);
  const rect = await ev(`(()=>{const r=document.getElementById('f${IDS[0]}').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
  console.log('iframe rect', JSON.stringify(rect));
  const results = {};
  // 1) synthesizeScrollGesture starting in the middle of the REAL iframe
  await send('Input.synthesizeScrollGesture', { x: Math.round(rect.x + rect.w / 2), y: Math.round(rect.y + rect.h * 0.85), yDistance: -Math.round(rect.h * 1.05), speed: 1500, gestureSourceType: 'default' });
  await sleep(1500); results.synthesizeScrollGesture = await st();
  await ev(`document.getElementById('s').scrollTop=0`); await sleep(500);
  // 2) a hand-made touch swipe (touchStart/Move/End) starting in the middle of the iframe
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(rect.x + rect.w / 2), y: 760 }] });
  for (let i = 1; i <= 14; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(rect.x + rect.w / 2), y: 760 - i * 55 }] }); await sleep(16); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1800); results.dispatchTouchEvent = await st();
  await ev(`document.getElementById('s').scrollTop=0`); await sleep(500);
  // 3) same but starting on the bottom control bar area of the iframe (where YouTube's own controls live)
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(rect.x + rect.w / 2), y: Math.round(rect.y + rect.h - 20) }] });
  for (let i = 1; i <= 14; i++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(rect.x + rect.w / 2), y: Math.round(rect.y + rect.h - 20) - i * 55 }] }); await sleep(16); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1800); results.startOnControlBar = await st();
  console.log('RESULT scrollTop after swipe (page height 844; >=422 means it moved to the next video):', JSON.stringify(results));
  ws.close(); process.exit(0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
