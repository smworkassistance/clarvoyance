// REAL-Bunny upload proof (T-060, B8). Runs INSIDE the owner's signed-in Chrome (raw CDP, port 9222) on a clar.co.in tab, using the page's own Supabase
// session + the deployed Worker, so it exercises exactly what a phone does: ticket -> tus resumable upload from the browser -> Bunny.
// Uploads a ~4 MB copy of qa/fixtures/sample.mp4 (padded with a valid MP4 `free` box) with each chunkSize variant and logs progress + HTTP.
// Each variant uses ONE ticket of the owner's daily allowance (10/day). It creates NO post; leftover Bunny videos are listed at the end.
// usage: node qa/cdp-upload-real.js [variant ...]   variants: 1mb 5mb default 2mb   (default: 5mb 1mb default)
const http = require('http'), fs = require('fs'), path = require('path');
function getJson(u, m) { return new Promise((res, rej) => { const r = http.request(u, { method: m || 'GET' }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on('error', rej); r.end(); }); }
let ws, id = 0; const pend = new Map();
const send = (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };

// a ~4 MB playable mp4: the real 1.1 MB clip + a 3 MB `free` box (ignored by every player/transcoder)
function makeBigMp4() {
  const src = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.mp4'));
  const pad = 3 * 1024 * 1024, box = Buffer.alloc(pad); box.writeUInt32BE(pad, 0); box.write('free', 4, 'latin1');
  return Buffer.concat([src, box]);
}

(async () => {
  const variants = process.argv.slice(2).length ? process.argv.slice(2) : ['5mb', '1mb', 'default'];
  const t = await getJson('http://127.0.0.1:9222/json/new?about:blank', 'PUT');
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'https://clar.co.in/?cb=' + Date.now() }); // the real app: it refreshes the Supabase session (a stored token may be hours old)
  await sleep(10000);
  const big = makeBigMp4();
  console.log('test file bytes', big.length);
  await ev(`window.__b64=${JSON.stringify(big.toString('base64'))};1`);
  // the page has no Supabase client on a blank JSON page -> read the session token from the app's localStorage entry
  const tokenInfo = await ev(`(async()=>{try{const r=await window._sbShared.auth.getSession();const s=r.data.session;if(!s)return null;return {exp:s.expires_at,now:Math.round(Date.now()/1000),anon:!!(s.user&&s.user.is_anonymous),email:s.user&&s.user.email,tok:!!s.access_token};}catch(e){return String(e)}})()`);
  console.log('session:', JSON.stringify(tokenInfo));
  if (!tokenInfo || !tokenInfo.tok || tokenInfo.anon) { console.log('NO signed-in (Google) session in this Chrome profile — cannot mint a ticket'); process.exit(2); }
  await ev(`new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tus-js-client@4/dist/tus.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)})`);
  const results = [];
  for (const v of variants) {
    const chunk = v === '1mb' ? 1048576 : v === '2mb' ? 2097152 : v === '5mb' ? 5242880 : null;
    const r = await ev(`(async()=>{
      const token=(await window._sbShared.auth.getSession()).data.session.access_token;
      const bin=atob(window.__b64);const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      const file=new File([u8],'t.mp4',{type:'video/mp4'});
      const t0=performance.now();
      const tr=await fetch('https://clar-bunny.smworkassistance.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'create',size:file.size,duration:10})});
      const j=await tr.json().catch(()=>({}));
      const out={variant:${JSON.stringify(v)},ticketStatus:tr.status,ticketMs:Math.round(performance.now()-t0),guid:j.guid||null,err:j.error||null,progress:[],result:null};
      if(!j.guid)return out;
      const opts={endpoint:j.endpoint,retryDelays:[0,1500,4000],headers:j.headers,metadata:{filetype:'video/mp4',title:'clar-cdp-test'}};
      ${chunk ? 'opts.chunkSize=' + chunk + ';' : ''}
      const t1=performance.now();
      out.result=await new Promise(res=>{
        const up=new tus.Upload(file,Object.assign(opts,{
          onError:e=>res({ok:false,msg:String(e&&e.message||e).slice(0,300),ms:Math.round(performance.now()-t1)}),
          onProgress:(a,b)=>{out.progress.push([Math.round(performance.now()-t1),a]);},
          onSuccess:()=>res({ok:true,ms:Math.round(performance.now()-t1)}),
          onShouldRetry:(e,n)=>{out.progress.push(['retry',n,String(e&&e.message).slice(0,120)]);return n<2;}
        }));
        up.start();
        setTimeout(()=>{res({ok:false,msg:'TIMEOUT 90s (no completion)',ms:90000});try{up.abort()}catch(e){}},90000);
      });
      return out;
    })()`);
    r.progressEvents = r.progress.length; r.lastBytes = r.progress.filter(x => typeof x[0] === 'number').slice(-1)[0];
    console.log('\n=== variant', v, JSON.stringify({ ticketStatus: r.ticketStatus, ticketMs: r.ticketMs, guid: r.guid, err: r.err, result: r.result, progressEvents: r.progressEvents, last: r.lastBytes }));
    console.log('first progress events:', JSON.stringify(r.progress.slice(0, 8)));
    results.push(r);
    await sleep(1500);
  }
  fs.writeFileSync(path.join(__dirname, '_live', 'upload-real-results.json'), JSON.stringify(results, null, 1));
  console.log('\nGUIDS created at Bunny (test videos, no posts):', results.map(r => r.guid).filter(Boolean).join(', '));
  ws.close(); process.exit(0);
})().catch(e => { console.error('FAILED', e); process.exit(1); });
