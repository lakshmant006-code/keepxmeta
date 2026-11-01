/* ---------- Near a memory: "Come see Kalyan here" when you walk back past where you were together ---------- */
/* Worked out on the phone from the places you kept. A web app cannot watch your location once it is closed, so this runs while Keep is open
   (or just left in the background); it never sends your position anywhere. */
const NRK='kept.near',NRH='kept.home',NR_R=80,NR_MIN_DAYS=14,NR_COOL=14*864e5,NR_GAP=6*36e5; /* walking past only: 80 m, once per place a fortnight, one nudge every six hours */
const nrGet=()=>{try{const o=JSON.parse(localStorage.getItem(NRK)||'{}');return{seen:o.seen||{},hits:o.hits||[],lastAny:o.lastAny||0}}catch(e){return{seen:{},hits:[],lastAny:0}}};
const nrPut=o=>{try{localStorage.setItem(NRK,JSON.stringify({seen:o.seen,hits:o.hits.slice(-30),lastAny:o.lastAny||0}))}catch(e){}};
const nrDist=(a,b)=>{const R=6371e3,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
/* where you usually are (home, work, a regular cafe) never nudges: places you kept on several different days, plus a home you set yourself */
const nrHome=()=>{try{const h=JSON.parse(localStorage.getItem(NRH)||'null');return h&&h.length===2?h:null}catch(e){return null}};
let nrRegC=null;
function nrRegular(){
  const n=all().length;if(nrRegC&&nrRegC.n===n)return nrRegC.c;
  const cl=[];
  all().filter(m=>m.geo&&m.geo.length===2).forEach(m=>{
    let c=cl.find(x=>nrDist(x.p,m.geo)<150);if(!c){c={p:m.geo,days:new Set()};cl.push(c)}c.days.add(dk(new Date(m.ts)));
  });
  const c=cl.filter(x=>x.days.size>=5).map(x=>x.p);nrRegC={n,c};return c;
}
const nrUsual=p=>{const h=nrHome();return(h&&nrDist(h,p)<250)||nrRegular().some(c=>nrDist(c,p)<200)};
const nrQuiet=d=>{const h=(d||new Date()).getHours();return h>=21||h<8};
/* one place per person: the latest photo of them there */
function nrPlaces(){
  const out=[];
  all().filter(m=>m.type==='photo'&&m.who&&m.geo&&m.geo.length===2&&!nrUsual(m.geo)).sort((a,b)=>b.ts-a.ts).forEach(m=>{
    if(out.some(o=>pkey(o.m.who)===pkey(m.who)&&nrDist(o.m.geo,m.geo)<NR_R*1.5))return;out.push({m});
  });
  return out.map(o=>o.m);
}
function nrAgo(ts){const d=Math.round((+TODAY-ts)/864e5);if(d<30)return Math.max(2,Math.round(d/7))+' weeks';if(d<365)return Math.round(d/30)+' months';const y=Math.floor(d/365);return y===1?'a year':y+' years'}
function nrText(m){
  const f=firstName(m.who),ag=nrAgo(m.ts);
  return{t:`You’re near where you saw ${f}`,b:`Hey, it’s been ${ag} since you and ${f} were right here. Come see ${f} here.`,btn:`See ${f} there`};
}
const nrOn=()=>!!ntGet().on.near;
/* the inbox picks these up through ntItems() */
window.nearItems=()=>nrGet().hits.map(h=>({id:h.id,ts:h.ts,ic:'users',t:h.t,b:h.b,a:[[h.btn,'ar:'+h.mid]]}));
function nrFire(m){
  const st=nrGet(),key=m.id,last=st.seen[key]||0;
  if(Date.now()-last<NR_COOL||Date.now()-(st.lastAny||0)<NR_GAP)return;
  const x=nrText(m),id='near-'+key+'-'+Date.now();
  st.seen[key]=Date.now();st.lastAny=Date.now();st.hits.push({id,mid:m.id,ts:Date.now(),t:x.t,b:x.b,btn:x.btn});nrPut(st);
  if(typeof ntBadge==='function')ntBadge();
  if(typeof ntPerm==='function'&&ntPerm()==='granted'&&document.visibilityState!=='visible'){
    const c=ntGet();c.pushed=c.pushed||{};c.pushed[id]=Date.now();ntPut(c);
    navigator.serviceWorker.ready.then(r=>r.showNotification(x.t,{body:x.b,tag:id,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{ar:m.id}})).catch(()=>{});
  }
  if(document.visibilityState==='visible')nrBanner(m,x);
}
function nrBanner(m,x){
  let b=$('#nrb');if(b)b.remove();
  b=document.createElement('div');b.id='nrb';b.className='nrb';
  b.innerHTML=`<i class="nrp" style="background-image:url(${src(m)})"></i><span><b>${esc(x.t)}</b><small>${esc(x.b)}</small></span><button id="nrGo">${esc(x.btn)}</button><button class="nrx" id="nrX" aria-label="Dismiss">×</button>`;
  $('#app').appendChild(b);requestAnimationFrame(()=>b.classList.add('on'));
  const off=()=>{b.classList.remove('on');setTimeout(()=>b.remove(),400)};
  $('#nrX').onclick=off;$('#nrGo').onclick=()=>{off();closeSheet();openAR(m.id)};
  setTimeout(off,14000);
}
let nrW=null,nrPrev=null;
/* only when you are walking past: you need to be moving at walking pace and coming into the place from outside, not sitting in it */
function nrCheck(lat,lng,ts){
  ts=ts||Date.now();const me=[lat,lng],prev=nrPrev;nrPrev={p:me,t:ts};
  if(!prev)return;
  const dt=(ts-prev.t)/1000,d=nrDist(prev.p,me);if(dt<2||dt>300)return;
  const v=d/dt;if(v<.6||v>3.2)return;
  if(nrQuiet(new Date(ts))||nrUsual(me))return;
  const T=+TODAY;
  nrPlaces().forEach(m=>{if(T-m.ts<NR_MIN_DAYS*864e5)return;if(nrDist(me,m.geo)<=NR_R&&nrDist(prev.p,m.geo)>NR_R)nrFire(m)});
}
window.nrCheck=nrCheck;
/* set where home is, so Keep stays quiet there */
window.nearHomeUI=()=>{
  const b=$('#nrHome'),t=$('#nrHomeS');if(!b)return;
  const draw=()=>{const h=nrHome();t.textContent=h?'Set. Keep stays quiet within about 250 m.':'Not set. Keep also stays quiet where you often are.';b.textContent=h?'Update':'Set here'};
  draw();
  b.onclick=()=>{if(!navigator.geolocation){toast('Location is not available here');return}
    navigator.geolocation.getCurrentPosition(p=>{try{localStorage.setItem(NRH,JSON.stringify([+p.coords.latitude.toFixed(5),+p.coords.longitude.toFixed(5)]))}catch(e){}draw();toast('Home set. Keep stays quiet here')},()=>toast('Allow location to set home'),{timeout:9000})};
};
function nrStart(){
  if(nrW!==null||!navigator.geolocation||!nrOn())return;
  nrW=navigator.geolocation.watchPosition(p=>nrCheck(p.coords.latitude,p.coords.longitude,p.timestamp),()=>{},{enableHighAccuracy:false,maximumAge:30000,timeout:60000});
}
function nrStop(){if(nrW!==null){navigator.geolocation.clearWatch(nrW);nrW=null}}
/* switching it on asks for location once, right here, and says why */
window.nearSet=async on=>{
  const c=ntGet();
  if(on){
    const ok=await new Promise(r=>navigator.geolocation?navigator.geolocation.getCurrentPosition(()=>r(true),()=>r(false),{timeout:9000}):r(false));
    if(!ok){toast('Allow location for Keep to use this');return false}
    if(typeof ntAllow==='function'&&ntPerm()==='default')try{await ntAllow()}catch(e){}
  }
  c.on.near=on?1:0;ntPut(c);on?nrStart():nrStop();dispatchEvent(new Event('keep:nt'));return true;
};
nrStart();
/* a tap on a home-screen alert: open that person's place in AR */
const nrOpenAR=id=>{if(!id)return;setTimeout(()=>{try{closeSheet();openAR(+id)}catch(e){}},900)};
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.near)nrOpenAR(e.data.near)});
{const q=new URLSearchParams(location.search).get('near');if(q){history.replaceState(null,'',location.pathname);nrOpenAR(q)}}

document.addEventListener('click',async e=>{const b=e.target.closest('[data-near]');if(!b)return;e.stopPropagation();if(await nearSet(true)){document.querySelectorAll('.nrhint').forEach(h=>{h.innerHTML='I’ll let you know when you walk past here.'});toast('Nearby memories on')}},true);
