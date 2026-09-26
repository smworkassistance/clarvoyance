// Time-to-PLAYING of a POOLED YouTube player (created early with autoplay+mute, paused at 0:00 once buffered) vs a fresh player — the v253 pool design. Real Chrome, blank same-origin page.
// usage: node qa/cdp-pool-timing.js <id1> <id2> <id3>
const http = require('http');
function getJson(u, m) { return new Promise((res, rej) => { const r = http.request(u, { method: m || 'GET' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on('error', rej); r.end(); }); }
let ws, id = 0; const pend = new Map();
const send = (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };
const IDS = process.argv.slice(2);
const TEST = `(async () => {
  const IDS = ${JSON.stringify(IDS)}; const out = {}; const now = () => performance.now(); const sleep = ms => new Promise(r => setTimeout(r, ms));
  document.open(); document.write('<!doctype html><body style="margin:0;background:#000"><div id="stage" style="width:360px;height:640px;position:relative"></div>'); document.close();
  const stage = document.getElementById('stage');
  await new Promise(r => { window.onYouTubeIframeAPIReady = r; const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); });
  const mk = (vid, pool) => new Promise(res => {
    const holder = document.createElement('div'); const inner = document.createElement('div'); holder.appendChild(inner); holder.style.cssText = 'position:absolute;inset:0'; stage.appendChild(holder);
    const t = now(); const r = { };
    const p = new YT.Player(inner, { videoId: vid, width: '100%', height: '100%', playerVars: { autoplay: 1, mute: 1, playsinline: 1, controls: 1, rel: 0, loop: 1, playlist: vid }, events: {
      onReady() { r.ready = Math.round(now() - t); },
      onStateChange(e) { if (e.data === 1 && r.first == null) { r.first = Math.round(now() - t); if (pool) { p.pauseVideo(); p.seekTo(0, true); } res({ p, r, holder, t }); } } } });
    setTimeout(() => { if (r.first == null) res({ p, r, holder, timeout: true }); }, 20000);
  });
  // fresh player -> PLAYING (what v252 did on every swipe)
  const a = await mk(IDS[0], false); out.fresh_first_playing_ms = a.r.first;
  a.holder.remove(); try { a.p.destroy(); } catch (e) {}
  const b = await mk(IDS[1], false); out.fresh_second_playing_ms = b.r.first;
  // POOL: create early muted, pause at 0:00 when buffered, wait like a user watching the current video (3 s), then play() -> PLAYING
  b.holder.remove(); try { b.p.destroy(); } catch (e) {}
  const c = await mk(IDS[2], true); out.pool_prepare_in_background_ms = c.r.first;
  await sleep(3000);
  const tp = now();
  const pl = new Promise(res => { c.p.addEventListener('onStateChange', e => { if (e.data === 1) res(Math.round(now() - tp)); }); setTimeout(() => res(null), 10000); });
  c.p.playVideo();
  out.pool_swipe_to_playing_ms = await pl;
  return out;
})()`;
(async () => {
  const t = await getJson('http://127.0.0.1:9222/json/new?about:blank', 'PUT');
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'https://clar.co.in/manifest.json' }); await sleep(2500);
  console.log(JSON.stringify(await ev(TEST), null, 1));
  await getJson('http://127.0.0.1:9222/json/close/' + t.id).catch(() => {});
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
