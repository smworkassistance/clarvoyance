// Measures, in the owner's real Chrome on their real network, how fast a video can appear after a "swipe" — the Instagram-Reels question.
// Runs on a blank clar.co.in/manifest.json tab (same origin as the app, NOT the app itself): no account data, no XP, nothing written.
// Variants: A) what v249 does now (fresh YouTube player per card)   B) YouTube player reused/preloaded   C) poster thumbnail   D) HTML5 <video> preloaded (first-party style)
const http = require('http');
function getJson(u, m) { return new Promise((res, rej) => { const r = http.request(u, { method: m || 'GET' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on('error', rej); r.end(); }); }
let ws, id = 0; const pend = new Map();
const send = (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
const IDS = process.argv.slice(2);

const TEST = `(async () => {
  const IDS = ${JSON.stringify(IDS)};
  const out = {};
  const now = () => performance.now();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  document.open(); document.write('<!doctype html><body style="margin:0;background:#000"><div id="stage" style="width:360px;height:640px;position:relative;overflow:hidden"></div>'); document.close();
  const stage = document.getElementById('stage');
  // ---- C) poster: how fast is a plain thumbnail image? (this is what can hide the black screen)
  for (const k of [0, 1]) {
    const t = now(); await new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = 'https://i.ytimg.com/vi/' + IDS[k] + '/hqdefault.jpg?x=' + Math.random(); });
    out['C_poster_ms_' + k] = Math.round(now() - t);
  }
  // ---- A) API cold load + first player -> PLAYING
  let t0 = now();
  await new Promise(r => { window.onYouTubeIframeAPIReady = r; const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); });
  out.A_apiReady_ms = Math.round(now() - t0);
  const mk = (vid, extra) => new Promise(res => {
    const holder = document.createElement('div'); const inner = document.createElement('div'); holder.appendChild(inner); holder.style.cssText = 'position:absolute;inset:0'; stage.appendChild(holder);
    const t = now(); const r = { t };
    const p = new YT.Player(inner, { videoId: vid, width: '100%', height: '100%', playerVars: Object.assign({ autoplay: 1, mute: 1, playsinline: 1, controls: 0, rel: 0, modestbranding: 1, fs: 0, disablekb: 1, iv_load_policy: 3 }, extra || {}),
      events: { onReady() { r.ready = Math.round(now() - t); }, onStateChange(e) { if (e.data === 1 && r.playing == null) { r.playing = Math.round(now() - t); res({ p, r, holder }); } } } });
    setTimeout(() => { if (r.playing == null) res({ p, r, holder, timeout: true }); }, 20000);
  });
  const first = await mk(IDS[0]);
  out.A_first_player_ready_ms = first.r.ready; out.A_first_player_playing_ms = first.r.playing;
  // ---- A) each following swipe = a brand-new player (API already loaded) — the v249 behaviour
  first.holder.remove(); try { first.p.destroy(); } catch (e) {}
  const second = await mk(IDS[1]);
  out.A_swipe_newplayer_ready_ms = second.r.ready; out.A_swipe_newplayer_playing_ms = second.r.playing;
  // ---- B) preloaded: create the NEXT player early, paused (mute autoplay off) and wait until it is cued; then measure only play()
  second.holder.remove(); try { second.p.destroy(); } catch (e) {}
  const pre = await new Promise(res => {
    const holder = document.createElement('div'); const inner = document.createElement('div'); holder.appendChild(inner); holder.style.cssText = 'position:absolute;inset:0;opacity:0.01'; stage.appendChild(holder);
    const t = now(); const p = new YT.Player(inner, { videoId: IDS[2], width: '100%', height: '100%', playerVars: { autoplay: 0, mute: 1, playsinline: 1, controls: 0 }, events: { onReady() { res({ p, holder, prepMs: Math.round(now() - t) }); } } });
  });
  out.B_preload_prep_ms_hidden_in_background = pre.prepMs;
  await sleep(1500); // the ~2 s a user spends on the current card
  const tPlay = now();
  const playing = new Promise(res => { pre.p.addEventListener('onStateChange', e => { if (e.data === 1) res(Math.round(now() - tPlay)); }); setTimeout(() => res(null), 15000); });
  pre.holder.style.opacity = 1; pre.p.playVideo();
  out.B_preloaded_swipe_to_playing_ms = await playing;
  // ---- D) first-party style: HTML5 <video> preloaded (preload=auto) -> play()
  const src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src; v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0'; stage.appendChild(v);
  await new Promise(r => { v.onloadeddata = r; setTimeout(r, 15000); });
  await sleep(300);
  const tv = now(); v.style.opacity = 1; await v.play().catch(() => {}); await new Promise(r => { if (!v.paused && v.readyState >= 2) r(); else v.onplaying = r; });
  out.D_html5_preloaded_play_ms = Math.round(now() - tv);
  out.D_html5_cold_note = 'not measured (needs a real first-party CDN video; Bunny HLS ~ first segment)';
  out.ua = navigator.userAgent.slice(0, 60);
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
