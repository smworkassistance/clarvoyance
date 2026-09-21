// Run AFTER db/schema_v241_social.sql has been executed. Real multi-user RLS/masking test over the REST API
// using throw-away anonymous users (the same kind the app creates on every first open). Cleans up after itself.
const URL='https://unvwjuceuyruqdnmvxlc.supabase.co',KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudndqdWNldXlydXFkbm12eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTg2ODMsImV4cCI6MjA5NzY5NDY4M30.uro0J6geSZ6G3FcykHY1tbbUGr0PCMDapNUt_-8qbFk';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m);};
async function req(method,path,tok,body,extra){
  const r=await fetch(URL+'/rest/v1/'+path,{method,headers:Object.assign({apikey:KEY,Authorization:'Bearer '+(tok||KEY),'Content-Type':'application/json',Prefer:'return=representation'},extra||{}),body:body?JSON.stringify(body):undefined});
  let j=null;try{j=await r.json();}catch(e){}return{s:r.status,j};
}
async function anon(){const r=await fetch(URL+'/auth/v1/signup',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}'});const j=await r.json();return{tok:j.access_token,id:j.user.id};}
(async()=>{
  const tag=Math.random().toString(36).slice(2,7);
  const A=await anon(),B=await anon(),C=await anon();
  const prof=(u,h,vis,extra)=>Object.assign({user_id:u.id,handle:h,display_name:'T '+h,bio:'hi',age_confirmed:true,visibility:vis,xp:500,xp_week:50,streak:5,engaged_days:9,clar_min_day:12.5,clar_min_week:80,badges:['joined','xp100'],goal_text:'secret goal',interests:{topics:['Focus']}},extra||{});
  const hA='ta_'+tag,hB='tb_'+tag,hC='tc_'+tag;
  let r=await req('GET','feature_flags?key=eq.social_layer&select=enabled');
  ok(r.s===200&&r.j[0]&&r.j[0].enabled===false,'feature flag row exists and is OFF ('+JSON.stringify(r.j)+')');
  r=await req('POST','social_profiles',A.tok,prof(A,hA,{leaderboard:true,xp:true,streak:true,badges:true,goal:false,interests:false,clar_time:false}));ok(r.s===201,'A creates profile ('+r.s+')');
  r=await req('POST','social_profiles',B.tok,prof(B,hA,{}));ok(r.s===409,'duplicate handle rejected 409 ('+r.s+')');
  r=await req('POST','social_profiles',B.tok,prof(B,hB,{leaderboard:false,xp:false,streak:false,badges:false,goal:true,interests:true,clar_time:true}));ok(r.s===201,'B creates profile, mostly private ('+r.s+')');
  r=await req('POST','social_profiles',C.tok,prof(C,hC,{},{age_confirmed:false}));ok(r.s>=400,'under-18 (age_confirmed=false) rejected ('+r.s+')');
  r=await req('POST','social_profiles',C.tok,prof(C,'admin',{}));ok(r.s>=400,'reserved handle rejected ('+r.s+')');
  r=await req('POST','social_profiles',C.tok,prof(C,hC+'!!',{}));ok(r.s>=400,'bad handle chars rejected ('+r.s+')');
  r=await req('POST','social_profiles',C.tok,prof(C,hC,{},{avatar_url:'http://evil.example/x.png'}));ok(r.s>=400,'non-https avatar rejected ('+r.s+')');
  r=await req('POST','social_profiles',C.tok,prof(C,hC,{leaderboard:true,xp:true,streak:true,badges:true,goal:true,interests:true,clar_time:true}));ok(r.s===201,'C creates profile, all public ('+r.s+')');
  r=await req('POST','social_profiles',A.tok,prof(B,'sneaky'+tag,{}));ok(r.s>=400,'cannot create a profile for someone else ('+r.s+')');
  r=await req('GET','social_profiles?select=user_id',A.tok);ok(r.s===200&&r.j.length===1&&r.j[0].user_id===A.id,'A sees only own row in base table ('+(r.j&&r.j.length)+')');
  r=await req('GET','social_public_profiles?select=handle');ok(r.s>=400||(Array.isArray(r.j)&&r.j.length===0),'bare anon key cannot read profiles view ('+r.s+')');
  r=await req('GET','social_public_profiles?handle=eq.'+hB+'&select=*',A.tok);const b=r.j&&r.j[0];
  ok(b&&b.xp===null&&b.streak===null&&b.badges===null&&b.on_leaderboard===false,"A sees B's xp/streak/badges MASKED");
  ok(b&&b.goal_text==='secret goal'&&b.clar_min_day!==null&&b.interests,"A sees B's goal/time/interests (B made them public)");
  r=await req('GET','social_public_profiles?handle=eq.'+hA+'&select=*',B.tok);const a=r.j&&r.j[0];
  ok(a&&a.xp===500&&a.badges&&a.streak===5&&a.goal_text===null&&a.interests===null&&a.clar_min_day===null&&a.visibility===null,"B sees A's xp/streak/badges but NOT goal/interests/time, and not A's visibility JSON");
  r=await req('GET','social_public_profiles?handle=eq.'+hA+'&select=*',A.tok);ok(r.j[0]&&r.j[0].goal_text==='secret goal'&&r.j[0].is_me===true&&r.j[0].visibility,'A sees ALL of own profile incl. visibility');
  r=await req('GET','social_public_profiles?on_leaderboard=eq.true&handle=in.('+hA+','+hB+','+hC+')&select=handle,xp',B.tok);
  const hs=(r.j||[]).map(x=>x.handle).sort();ok(JSON.stringify(hs)===JSON.stringify([hA,hC].sort()),'leaderboard = A and C only ('+hs+')');
  r=await req('POST','social_follows',B.tok,{follower_id:B.id,following_id:A.id});ok(r.s===201,'B follows A');
  r=await req('POST','social_follows',B.tok,{follower_id:A.id,following_id:B.id});ok(r.s>=400,'cannot follow on behalf of someone else ('+r.s+')');
  r=await req('POST','social_follows',B.tok,{follower_id:B.id,following_id:B.id});ok(r.s>=400,'cannot follow yourself ('+r.s+')');
  r=await req('POST','social_activity',A.tok,{user_id:A.id,badge_id:'joined'});ok(r.s===201,'A posts joined event');
  r=await req('POST','social_activity',A.tok,{user_id:A.id,badge_id:'Bad Text!'});ok(r.s>=400,'free text rejected in activity ('+r.s+')');
  r=await req('POST','social_activity?on_conflict=user_id,badge_id',A.tok,{user_id:A.id,badge_id:'joined'},{Prefer:'resolution=ignore-duplicates,return=minimal'});
  const cnt=await req('GET','social_activity?user_id=eq.'+A.id+'&select=id',A.tok);ok(r.s<400&&cnt.j.length===1,'duplicate badge event ignored, still 1 row ('+r.s+','+(cnt.j&&cnt.j.length)+')');
  r=await req('GET','social_feed?select=*',B.tok);ok(r.s===200&&r.j.length===1&&r.j[0].handle===hA&&r.j[0].cheers===0,"B's feed shows A's event ("+(r.j&&r.j.length)+')');
  r=await req('GET','social_feed?select=*',C.tok);ok(r.s===200&&r.j.length===0,'C (follows nobody) has an empty feed');
  const actId=(await req('GET','social_feed?select=id',B.tok)).j[0].id;
  r=await req('POST','social_cheers',B.tok,{activity_id:actId,user_id:B.id});ok(r.s===201,'B cheers');
  r=await req('GET','social_feed?select=cheers,i_cheered',B.tok);ok(r.j[0].cheers===1&&r.j[0].i_cheered===true,'cheer counted, i_cheered true');
  r=await req('GET','social_public_profiles?handle=eq.'+hA+'&select=followers,following,i_follow',B.tok);ok(r.j[0].followers===1&&r.j[0].i_follow===true,'follower count = 1, i_follow = true');
  r=await req('PATCH','social_profiles?user_id=eq.'+A.id,A.tok,{visibility:{leaderboard:false,xp:true,streak:true,badges:false}});ok(r.s===200,'A hides badges');
  r=await req('GET','social_feed?select=*',B.tok);ok(r.j.length===0,"A's post vanishes from B's feed when badges are private");
  r=await req('POST','social_blocks',A.tok,{blocker_id:A.id,blocked_id:B.id,blocked_handle:hB,blocked_name:'T'});ok(r.s===201,'A blocks B');
  r=await req('GET','social_public_profiles?handle=eq.'+hA+'&select=handle',B.tok);ok(r.j.length===0,'B can no longer see A');
  r=await req('GET','social_public_profiles?handle=eq.'+hB+'&select=handle',A.tok);ok(r.j.length===0,'A can no longer see B');
  r=await req('GET','social_blocks?select=blocked_handle',B.tok);ok(r.j.length===0,'B cannot see that they were blocked');
  r=await req('POST','social_reports',C.tok,{reporter_id:C.id,reported_id:A.id,reason:'Spam'},{Prefer:'return=minimal'});ok(r.s===201,'C files a report');
  r=await req('GET','social_reports?select=*',C.tok);ok(r.s>=400||(Array.isArray(r.j)&&r.j.length===0),'reports are not readable by users ('+r.s+')');
  r=await req('POST','social_reports',C.tok,{reporter_id:C.id,reported_id:A.id,reason:'Lol'},{Prefer:'return=minimal'});ok(r.s>=400,'invalid report reason rejected');
  for(const u of [A,B,C]){
    await req('DELETE','social_activity?user_id=eq.'+u.id,u.tok);await req('DELETE','social_follows?follower_id=eq.'+u.id,u.tok);
    await req('DELETE','social_blocks?blocker_id=eq.'+u.id,u.tok);const d=await req('DELETE','social_profiles?user_id=eq.'+u.id,u.tok);ok(d.s===200,'cleanup profile');
  }
  console.log('\nRESULT: '+pass+' passed, '+fail+' failed');
})().catch(e=>{console.log('SCRIPT ERROR',e);});
