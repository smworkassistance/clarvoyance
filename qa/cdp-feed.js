// read-only: what does the owner's Feed (Following) show on the live site?
const http=require('http');
function getJson(u,m){return new Promise((res,rej)=>{const r=http.request(u,{method:m||'GET'},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})});r.on('error',rej);r.end()})}
let ws,id=0;const pend=new Map();const send=(m,p)=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p||{}}))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,awaitPromise:true,returnByValue:true});return r.result.value};
(async()=>{
  const t=await getJson('http://127.0.0.1:9222/json/new?about:blank','PUT');
  ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}};
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Page.navigate',{url:'https://clar.co.in/?nav=2&cb='+Date.now()});await sleep(9000);
  await ev("(()=>{try{lifeQuizSkipForever()}catch(e){}return 1})()");
  await ev("document.querySelector('.nv2-tab[data-nv2=\"feed\"]').click()");await sleep(5000);
  console.log(JSON.stringify(await ev("({tab:SOC._state.tab,clar:document.querySelectorAll('.soc-clar').length,cards:document.querySelectorAll('#soc-body .soc-card').length,rows:(SOC._state.feedRows||[]).map(r=>r._kind+':'+(r.title||r.badge_id||'')).join(' | '),text:document.getElementById('soc-body').innerText.slice(0,500)})"),null,1));
  await getJson('http://127.0.0.1:9222/json/close/'+t.id).catch(()=>{});process.exit(0);
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
