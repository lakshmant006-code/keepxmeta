/* ---------- Notifications, reflections and two Insights tiles (ideas from the Chime prototype) ---------- */
/* Everything is worked out on the phone from what you kept; nothing is pushed from a server. The inbox only holds things that need you,
   and every kind can be switched off. */
const NTK='kept.nt',RFK='kept.reflect';
const ntGet=()=>{try{const o=JSON.parse(localStorage.getItem(NTK)||'{}');return{read:o.read||{},on:Object.assign({otd:1,streak:1,week:1,nudge:0},o.on||{})}}catch(e){return{read:{},on:{otd:1,streak:1,week:1,nudge:0}}}};
const ntPut=c=>{try{localStorage.setItem(NTK,JSON.stringify(c))}catch(e){}};
const rfGet=()=>{try{const o=JSON.parse(localStorage.getItem(RFK)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return{}}};
const rfPut=o=>{try{localStorage.setItem(RFK,JSON.stringify(o))}catch(e){}};
const RF=[['smile','Still makes me smile','Keep it close.'],['bit','Bittersweet','Worth keeping, in its own way.'],['quiet','I would rather not revisit','Keep it, but stop bringing it back.']];
const ntDay=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const ntWhen=ts=>{const d=new Date(ts),t=chRelSafe(d);return t+' · '+tstr(ts)};
const chRelSafe=d=>{const df=Math.round((+new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate())-+new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);return df===0?'Today':df===1?'Yesterday':longDay(d)};
/* what could be in the inbox right now */
function ntItems(){
  const cfg=ntGet(),A=all(),out=[],T=TODAY,morning=h=>new Date(T.getFullYear(),T.getMonth(),T.getDate(),h).getTime(),rf=rfGet();
  out.push({id:'welcome',ts:morning(8),ic:'cube',t:'Welcome to Keep',b:'Everything you keep stays on this phone. Take a quick tour any time.',a:[['Take the tour','tour']],always:1});
  if(cfg.on.otd)for(let n=1;n<=3;n++){
    const k=dk(new Date(T.getFullYear()-n,T.getMonth(),T.getDate())),day=byDay[k];if(!day||!day.length||(rf[k]&&rf[k].v==='quiet'))continue;
    const m=day.find(x=>x.text)||day[0],txt=(m.text||m.name||'').trim();
    out.push({id:'otd-'+k,ts:morning(9),ic:'cal',t:n===1?'A year ago today':n+' years ago today',b:(txt?'“'+(txt.length>70?txt.slice(0,68)+'…':txt)+'” ':'')+day.length+(day.length===1?' moment':' moments')+' kept.',a:[['View memory','day:'+k],[rf[k]?'You felt: '+RF.find(r=>r[0]===rf[k].v)[1]:'How does it feel?','reflect:'+k]]});
  }
  const S=insStreaks(A);
  if(cfg.on.streak&&S.cur>=3){const m=S.cur>=30?30:S.cur>=14?14:S.cur>=7?7:S.cur>=5?5:3;out.push({id:'streak-'+m+'-'+dk(T),ts:morning(10),ic:'chart',t:S.cur+'-day streak',b:'You kept something '+S.cur+' days in a row. Keep it going.',a:[['Add something','add']]})}
  if(cfg.on.week){const dow=(T.getDay()+6)%7,mon=new Date(T.getFullYear(),T.getMonth(),T.getDate()-dow),pm=new Date(+mon-7*864e5),n=A.filter(m=>m.ts>=+pm&&m.ts<+mon);
    if(n.length){const days=new Set(n.map(m=>dk(new Date(m.ts)))),c={};n.forEach(m=>{const d=new Date(m.ts).getDay();c[d]=(c[d]||0)+1});const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0],DN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      out.push({id:'week-'+dk(mon),ts:new Date(mon.getFullYear(),mon.getMonth(),mon.getDate(),8).getTime(),ic:'chart',t:'Last week in Keep',b:n.length+(n.length===1?' moment':' moments')+' over '+days.size+(days.size===1?' day':' days')+'. '+DN[+top[0]]+' was your busiest.',a:[['See Insights','ins']]})}}
  if(cfg.on.nudge&&A.length){const last=Math.max(...A.map(m=>m.ts));if(+new Date(T.getFullYear(),T.getMonth(),T.getDate())-last>3*864e5)out.push({id:'nudge-'+dk(T),ts:morning(18),ic:'plus',t:'A quiet few days',b:'Anything from this week worth keeping?',a:[['Keep something','add']]})}
  return out.filter(i=>i.ts<=Date.now()||i.always).sort((a,b)=>b.ts-a.ts);
}
const ntUnread=()=>{const r=ntGet().read;return ntItems().filter(i=>!r[i.id]).length};
function ntBadge(){
  const b=$('#profBtn');if(!b)return;let d=b.querySelector('.ntbd');const n=ntUnread();
  ntHome(n);
  if(!n){if(d)d.remove();return}
  if(!d){d=document.createElement('i');d.className='ntbd';b.appendChild(d)}d.textContent=n>9?'9+':String(n);
}
const ntMarkRead=()=>{const c=ntGet();ntItems().forEach(i=>{c.read[i.id]=Date.now()});ntPut(c);ntBadge()};
/* the page */
function ntOpen(){
  const p=$('#nt');if(!p)return;p.classList.add('on');
  const cfg=ntGet(),items=ntItems(),read=cfg.read,today=items.filter(i=>chRelSafe(new Date(i.ts))==='Today'),earlier=items.filter(i=>!today.includes(i));
  const card=i=>`<div class="ntc ${read[i.id]?'':'new'}"><div class="nti">${ic[i.ic]||ic.txt||''}</div><div class="ntb"><small>${esc(ntWhen(i.ts))}</small><b>${esc(i.t)}</b><p>${esc(i.b)}</p><div class="nta">${i.a.map(a=>`<button class="tagch" data-a="${esc(a[1])}">${esc(a[0])}</button>`).join('')}</div></div>${read[i.id]?'':'<i class="ntd"></i>'}</div>`;
  const sw=(k,t,s)=>`<div class="ntr"><div><b>${t}</b><small>${s}</small></div><button class="ntsw ${cfg.on[k]?'on':''}" role="switch" aria-checked="${!!cfg.on[k]}" aria-label="${t}" data-k="${k}"><i></i></button></div>`;
  p.innerHTML=`<div class="mh2"><button class="ib" id="ntX" aria-label="Close">${ic.x}</button><div class="t">Notifications</div><span style="width:40px"></span></div>
   <div class="frbody"><h2 class="nth">Only things that need you.</h2><p class="nts">Quiet by default. Nothing leaves this phone.</p>
   ${today.length?`<div class="ntg">Today</div>${today.map(card).join('')}`:''}${earlier.length?`<div class="ntg">Earlier</div>${earlier.map(card).join('')}`:''}
   ${items.length?'':'<div class="empty" style="margin:30px 8px">Nothing needs you right now.</div>'}
   <div class="ntg">What can notify you</div><div class="grp" style="margin-top:0;padding:0 16px">${sw('otd','On this day','A memory from a year or more ago')}${sw('streak','Streaks','When you keep something several days running')}${sw('week','Weekly recap','A short summary each Monday')}${sw('nudge','Gentle nudge','If a few days pass with nothing kept')}</div>
   <div class="ntg">On your home screen</div><div class="grp" style="margin-top:0;padding:0 16px"><div class="ntr"><div><b>Home screen alerts</b><small id="ntPS"></small></div><button class="ntsw" id="ntAl" role="switch" aria-label="Home screen alerts"><i></i></button></div></div>
   <p class="note">Alerts are made on this phone from what you kept. Keep has no server, so a full alert while the app is closed only works through a daily background check, and only on Android. On iPhone they show when you open Keep.</p></div>`;
  $('#ntX').onclick=ntClose;
  {const al=$('#ntAl'),ps=$('#ntPS'),pm=ntPerm(),on=pm==='granted';al.classList.toggle('on',on);al.setAttribute('aria-checked',on);
   ps.textContent=pm==='unsupported'?'Add Keep to your home screen to turn this on':pm==='denied'?'Blocked in your phone settings':on?'Icon badge and alerts when you open Keep, and a daily check on Android':'Show a badge on the Keep icon and phone alerts';
   al.onclick=async()=>{if(on){toast('Turn alerts off in your phone settings');return}if(await ntAllow())ntOpen()}}
  p.querySelectorAll('.ntsw').forEach(b=>b.onclick=()=>{const c=ntGet();c.on[b.dataset.k]=c.on[b.dataset.k]?0:1;ntPut(c);dispatchEvent(new Event('keep:nt'));ntOpen()});
  p.querySelector('.frbody').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,[k,v]=a.split(':');
    if(k==='tour'){ntClose();setTimeout(introOpen,320)}else if(k==='add'){ntClose();setTimeout(()=>openAdd(),320)}else if(k==='ins'){ntClose();setTimeout(insOpen,320)}
    else if(k==='day'){ntClose();setTimeout(()=>openDay(v),320)}else if(k==='reflect'){reflectOpen(v)}});
  setTimeout(ntMarkRead,1200);
}
function ntClose(){const p=$('#nt');if(!p)return;p.classList.remove('on');p.innerHTML='';ntBadge()}
/* "Did it get better?" for memories: a gentle question on an old day */
function reflectOpen(k){
  const d=ntDay(k),rf=rfGet();
  openSheet(`<div class="dh"><h1>How does it feel now?</h1><p>${esc(longDay(d)+', '+d.getFullYear())}</p></div><div class="pb" style="padding-top:6px" id="rfb">
   <svg class="rfw" viewBox="0 0 300 40" aria-hidden="true"><path d="M0 24 C 30 6, 50 40, 80 22 S 130 8, 160 24 S 220 38, 250 20 S 290 14, 300 22" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round"/></svg>
   ${RF.map(r=>`<button class="rfo ${rf[k]&&rf[k].v===r[0]?'on':''}" data-v="${r[0]}"><b>${r[1]}</b><small>${r[2]}</small></button>`).join('')}</div>`);
  $('#rfb').onclick=e=>{const b=e.target.closest('.rfo');if(!b)return;const o=rfGet();o[k]={v:b.dataset.v,ts:Date.now()};rfPut(o);
    const r=RF.find(x=>x[0]===b.dataset.v);$('#rfb').innerHTML=`<svg class="rfw" viewBox="0 0 300 40" aria-hidden="true"><path d="M0 24 C 60 24, 120 24, 300 24" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round"/></svg><div class="rfdone"><h2>${b.dataset.v==='smile'?'Glad it still does.':b.dataset.v==='bit'?'Held gently.':'Understood.'}</h2><p>Saved to your memory record.</p></div><button class="pill d" id="rfOk" style="width:100%;justify-content:center;margin-top:10px">Done</button>`;
    $('#rfOk').onclick=()=>{closeSheet();ntBadge();if($('#nt')&&$('#nt').classList.contains('on'))ntOpen()};buzzSafe&&buzzSafe()};
}
const buzzSafe=()=>{try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}};
function reflectChip(k){
  const o=rfGet()[k],h=$('#pc .dh p');if(!o||!h)return;const r=RF.find(x=>x[0]===o.v);
  h.insertAdjacentHTML('afterend',`<button class="rfc" id="rfChip">${esc(r[1])}</button>`);$('#rfChip').onclick=()=>reflectOpen(k);
}
/* Insights: the last 30 days as dots, and as a skyline */
function insExtras(){
  const A=all(),days=[],n={};A.forEach(m=>{const k=dk(new Date(m.ts));n[k]=(n[k]||0)+1});
  for(let i=29;i>=0;i--)days.push(dk(new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()-i)));
  const vals=days.map(k=>n[k]||0),kept=vals.filter(Boolean).length,max=Math.max(1,...vals);
  const dots=`<section class="insc"><div class="insch"><div><b>Kept days</b><small>Last 30 days</small></div></div><div class="insbig"><b>${kept}</b><span>of 30</span><em>${vals[29]?'Kept today':'Nothing yet today'}</em></div><div class="insdots">${vals.map((v,i)=>`<i class="${v?v>=3?'l3':v>=2?'l2':'l1':''}" style="--i:${i}" title="${esc(days[i])}"></i>`).join('')}</div></section>`;
  const bars=vals.map((v,i)=>{const h=v?8+Math.round(v/max*56):3,x=i*10,pk=v===max&&v>0;let w='';if(v&&h>20)for(let y=h-8;y>10;y-=10)w+=`<rect x="${x+2}" y="${72-y}" width="2" height="2.4" rx=".6" class="win"/><rect x="${x+5.2}" y="${72-y}" width="2" height="2.4" rx=".6" class="win"/>`;
    return `<g class="bld" style="--i:${i}"><rect x="${x}" y="${72-h}" width="8.4" height="${h}" rx="1.4" class="${pk?'pk':v?'on':'off'}"/>${w}</g>`}).join('');
  const sky=`<section class="insc"><div class="insch"><div><b>Your skyline</b><small>Taller days kept more</small></div></div><svg class="inssky" viewBox="0 0 300 76" role="img" aria-label="Your last 30 days as a city skyline">${bars}</svg></section>`;
  return dots+sky;
}
/* the little red number on the profile button */
{let _nb=0;const pb=document.getElementById('profBtn');if(pb)new MutationObserver(()=>{if(_nb)return;_nb=1;ntBadge();_nb=0}).observe(pb,{childList:true});}
setTimeout(ntBadge,600);

/* ---------- on the phone's home screen: app-icon badge, system alerts, daily check ---------- */
const ntCan=()=>'Notification' in window&&'serviceWorker' in navigator;
const ntPerm=()=>ntCan()?Notification.permission:'unsupported';
function ntHome(n){
  try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge()}}catch(e){}
  if(ntPerm()!=='granted'||!n)return;
  const c=ntGet(),seen=c.pushed||{},fresh=ntItems().filter(i=>!c.read[i.id]&&!seen[i.id]);
  if(!fresh.length)return;
  fresh.forEach(i=>{seen[i.id]=Date.now()});c.pushed=seen;ntPut(c);
  navigator.serviceWorker.ready.then(r=>fresh.slice(0,3).forEach(i=>r.showNotification(i.t,{body:i.b,tag:i.id,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:'./'}}))).catch(()=>{});
}
async function ntSnap(){
  try{const c=ntGet(),k=await caches.open('keep-nt');
    await k.put('snap',new Response(JSON.stringify({on:c.on,at:Date.now()})));
    const r=await navigator.serviceWorker.ready;
    if(r.periodicSync&&ntPerm()==='granted')await r.periodicSync.register('keep-daily',{minInterval:864e5})}catch(e){}
}
async function ntAllow(){
  if(!ntCan()){toast('This browser cannot show alerts. Install Keep to your home screen first.');return false}
  const r=await Notification.requestPermission();
  if(r!=='granted'){toast('Alerts are off. You can allow them in Settings.');return false}
  ntSnap();ntBadge();return true;
}
addEventListener('keep:nt',ntSnap);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ntBadge()});
setTimeout(ntSnap,2500);

/* ---------- what's new: shown once to people who already had Keep when this version arrives ---------- */
const WNK='kept.whatsnew',WNV='2';
function wnShow(){
  if($('#wn'))return;
  const d=document.createElement('div');d.id='wn';d.className='wn';
  const li=(t,s)=>`<li><b>${t}</b><span>${s}</span></li>`;
  d.innerHTML=`<div class="wnc" role="dialog" aria-label="What's new"><small>What's new in Keep</small><h2>A few new things</h2><ul>${li('Notifications','On this day, streaks and a weekly recap, with a badge on your icon')}${li('Invite friends','Share Keep through Instagram or any chat')}${li('Smarter chat','Ask your memories like a conversation')}${li('Tag friends faster','Names suggested as you type, or add them from Instagram')}</ul><button class="pill d" id="wnX" style="width:100%;justify-content:center">Got it</button></div>`;
  $('#app').appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));
  const end=cb=>{d.classList.remove('on');setTimeout(()=>{d.remove();cb&&cb()},300)};
  $('#wnX').onclick=()=>end();
}
setTimeout(()=>{try{
  const seen=localStorage.getItem(WNK);if(seen===WNV)return;
  localStorage.setItem(WNK,WNV);
  /* a first-time person has just been through the tour; only people who already had Keep see this */
  if(seen===null&&!introDone())return;
  if(!document.getElementById('intro'))wnShow();
}catch(e){}},2200);
