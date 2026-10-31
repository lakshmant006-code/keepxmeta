/* Memory of the day: one picture from an earlier day, with the line you wrote about it (or a gentle one) below. All on this phone. */
(()=>{
const KEY='keep.mom',HIDE='keep.momHide',$=q=>document.querySelector(q);
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
window.momOn=()=>ls(KEY)!=='0';
window.momSet=on=>{ls(KEY,on?'1':'0');if(on)ls(HIDE,'');momRender()};
const hash=s=>{let h=2166136261;const c=String(s);for(let i=0;i<c.length;i++){h^=c.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const GENTLE=['An instant you kept.','Glad you kept this one.','A good one to look back on.'];
let shift=0;
function pool(){
  const t0=+TODAY;
  return all().filter(m=>m.ts<t0&&(m.type==='photo'||m.type==='video')&&src(m)).map(m=>{
    const d=new Date(m.ts);let s=0;
    if(d.getMonth()===TODAY.getMonth()&&d.getDate()===TODAY.getDate()&&d.getFullYear()<TODAY.getFullYear())s+=100;
    if(m.text&&m.text.trim().length>3)s+=30;if(m.who)s+=4;
    return{m,s,h:hash(m.id+'|'+dk(TODAY))};
  }).sort((a,b)=>b.s-a.s||a.h-b.h);
}
function pick(){
  const p=pool();if(!p.length)return null;
  const top=p.filter(x=>x.s===p[0].s).sort((a,b)=>a.h-b.h);
  const list=top.length>=2?top:p.slice(0,8).sort((a,b)=>a.h-b.h);
  return list[shift%list.length].m;
}
function ago(m){
  const d=new Date(m.ts),dd=Math.round((+TODAY-+new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
  const yrs=TODAY.getFullYear()-d.getFullYear();
  if(yrs>=1&&d.getMonth()===TODAY.getMonth()&&d.getDate()===TODAY.getDate())return yrs===1?'A year ago today':yrs+' years ago today';
  if(dd<2)return 'Yesterday';if(dd<14)return dd+' days ago';if(dd<60)return Math.round(dd/7)+' weeks ago';
  if(dd<365)return Math.round(dd/30)+' months ago';return yrs>1?yrs+' years ago':'A year ago';
}
const line=m=>(m.text&&m.text.trim())||GENTLE[hash(m.id)%GENTLE.length];
window.momRender=()=>{
  const el=$('#mom');if(!el)return;
  const m=window.momOn()&&!emptyMode&&ls(HIDE)!==dk(TODAY)?pick():null;
  if(!m){el.hidden=true;return}
  el.hidden=false;el.innerHTML=`<button class="momc" id="momc"><i class="momp" style="background-image:url(${src(m)})"></i><span><small>${esc(ago(m))}</small><b>${esc(line(m))}</b></span></button><button class="momx" id="momx" aria-label="Hide for today">×</button>`;
  $('#momc').onclick=()=>window.wgOpen();$('#momx').onclick=()=>{ls(HIDE,dk(TODAY));el.hidden=true};
};
/* ---- cute widgets: three little cards, swipe between them ---- */
const NOTES=['Small good things count.','You showed up today. That is plenty.','Be gentle with yourself today.','Something nice is on its way.','Today is a fresh page.','Breathe. You are doing fine.','Collect the little joys.','Soft days are good days too.','You are allowed to enjoy this.','Look how much you notice.'];
const EMO=['☀️','🌼','💛','🍀','🧸','🌈','✨','🫶'];
const myNotes=()=>{try{return JSON.parse(ls('keep.notes')||'[]')}catch(e){return[]}};
const saveNotes=a=>ls('keep.notes',JSON.stringify(a.slice(-40)));
let nshift=0;
function note(){
  const mine=myNotes(),pool=mine.concat(NOTES,[`You have kept ${all().length} instants. Look how much you notice.`]);
  const h=hash(dk(TODAY)+'n');return{t:pool[(h+nshift)%pool.length],e:EMO[(h+nshift)%EMO.length]};
}
const WS=[
 {k:'pol',n:'Polaroid',bg:'#FFF6E8'},
 {k:'note',n:'Sticker note',bg:'#FFF3A8'},
 {k:'bub',n:'Bubble',bg:'#E7F0FF'}];
function wHTML(w,m,n){
  const ph=m?src(m):'',cap=m?line(m):n.t,when=m?ago(m):'Just for you';
  if(w.k==='pol')return `<div class="wd wpol"><i class="wtape"></i><div class="wph" style="background-image:url(${ph})"></div><p class="whand">${esc(cap)}</p><small>${esc(when)} ♡</small></div>`;
  if(w.k==='note')return `<div class="wd wnote"><i class="wfold"></i><div class="wemo">${n.e}</div><p class="whand">${esc(n.t)}</p><small>from Keep</small></div>`;
  return `<div class="wd wbub"><span class="wsp s1">✦</span><span class="wsp s2">✧</span><div class="wcirc" style="background-image:url(${ph})"></div><p class="wpill">${esc(cap)}</p><small>${esc(when)}</small></div>`;
}
function momOpen(){
  const m=pick(),n=note();
  openSheet(`<div class="dh"><h1>Today’s little widget</h1><p>Swipe to pick a style</p></div><div class="pb" style="padding-top:8px">
   <div class="wrow" id="wrow">${WS.map(w=>`<div class="wslot" data-k="${w.k}">${wHTML(w,w.k==='note'?null:m,n)}</div>`).join('')}</div>
   <div class="wdots" id="wdots">${WS.map((w,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>
   <div class="momr"><button class="pill g" id="momn">Another</button><button class="pill g" id="momS">Share</button>${m?'<button class="pill d" id="momo">Open day</button>':''}</div>
   <div class="wadd"><input id="wnote" maxlength="90" placeholder="Write yourself a happy note" autocomplete="off"><button class="pill d" id="wnadd">Add</button></div></div>`,{full:true});
  const row=$('#wrow'),cur=()=>Math.round(row.scrollLeft/row.clientWidth);
  row.onscroll=()=>{const c=cur();document.querySelectorAll('#wdots i').forEach((d,i)=>d.classList.toggle('on',i===c))};
  $('#momn').onclick=()=>{shift++;nshift++;momRender();momOpen()};
  if($('#momo'))$('#momo').onclick=()=>openDay(dk(new Date(m.ts)));
  $('#momS').onclick=()=>momShare(WS[cur()],m,n).catch(()=>toast('Could not share that'));
  $('#wnadd').onclick=()=>{const v=$('#wnote').value.trim();if(!v)return;const a=myNotes();a.push(v);saveNotes(a);nshift=0;toast('Added');momOpen();row.scrollTo?0:0};
  if(window.Motion)Motion.animate(document.querySelectorAll('.wslot .wd'),{rotate:[-2,2]},{duration:2.6,repeat:Infinity,repeatType:'mirror',ease:'easeInOut'});
}
/* the chosen widget as a picture, to share or set as a wallpaper */
async function momShare(w,m,n){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const FF='"Bradley Hand","Segoe Print","Comic Sans MS",system-ui,cursive';
  const wrap=(t,f,mw,lh,X,Y,al)=>{x.font=f;x.textAlign=al||'left';const ws=t.split(/\s+/);let l='',y=Y;for(const a of ws){const q=l?l+' '+a:a;if(x.measureText(q).width>mw&&l){x.fillText(l,X,y);y+=lh;l=a}else l=q}x.fillText(l,X,y);return y};
  const load=u=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=u});
  const cover=(i,a,b,ww,hh)=>{const k=Math.max(ww/i.width,hh/i.height);x.drawImage(i,a+(ww-i.width*k)/2,b+(hh-i.height*k)/2,i.width*k,i.height*k)};
  const cap=m&&w.k!=='note'?line(m):n.t,when=m&&w.k!=='note'?ago(m):'from Keep';
  x.fillStyle=w.bg;x.fillRect(0,0,W,H);
  if(w.k==='pol'){
    x.save();x.translate(W/2,H/2);x.rotate(-.035);x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.18)';x.shadowBlur=40;x.shadowOffsetY=16;x.fillRect(-440,-560,880,1120);x.shadowColor='transparent';
    const i=await load(src(m));x.save();x.beginPath();x.rect(-400,-520,800,800);x.clip();x.translate(-400,-520);cover(i,0,0,800,800);x.restore();
    x.fillStyle='rgba(255,214,120,.8)';x.fillRect(-110,-590,220,64);
    x.fillStyle='#333';wrap(cap,'500 54px '+FF,780,70,0,360,'center');x.fillStyle='#999';x.font='400 34px system-ui';x.textAlign='center';x.fillText(when+' ♡',0,500);x.restore();
  }else if(w.k==='note'){
    x.fillStyle='#fff7';x.fillRect(0,0,0,0);x.font='260px serif';x.textAlign='center';x.fillText(n.e,W/2,430);
    x.fillStyle='#4a3b00';wrap(n.t,'600 76px '+FF,840,100,W/2,640,'center');x.fillStyle='#8a7a2a';x.font='400 38px system-ui';x.fillText('from Keep',W/2,H-110);
  }else{
    const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#E7F0FF');g.addColorStop(1,'#FFE9F3');x.fillStyle=g;x.fillRect(0,0,W,H);
    const i=await load(src(m));x.save();x.beginPath();x.arc(W/2,470,330,0,7);x.clip();cover(i,W/2-330,140,660,660);x.restore();
    x.lineWidth=14;x.strokeStyle='#fff';x.beginPath();x.arc(W/2,470,330,0,7);x.stroke();
    x.fillStyle='#fff';x.beginPath();x.roundRect(90,880,W-180,250,60);x.fill();x.fillStyle='#222';wrap(cap,'600 56px system-ui,sans-serif',W-300,72,W/2,970,'center');
    x.fillStyle='#8a8fa3';x.font='400 36px system-ui';x.textAlign='center';x.fillText(when,W/2,H-90);
  }
  const blob=await new Promise(r=>c.toBlob(r,'image/png')),f=new File([blob],'keep-widget.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='keep-widget.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Saved as a picture');
}
/* ---- Widgets page: a gallery of small, medium and large widgets, and a preview of them on a home screen ---- */
const WSEL='keep.wg';
const CHK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const wgSel=()=>{try{const a=JSON.parse(ls(WSEL));return Array.isArray(a)?a:['mem','day']}catch(e){return['mem','day']}};
const wgSave=a=>ls(WSEL,JSON.stringify(a));
const DL='MTWTFSS';
function weekDays(){const d=new Date(TODAY),off=(d.getDay()+6)%7;return[...Array(7)].map((_,i)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()-off+i);return{d:x,k:dk(x),L:byDay[dk(x)]||[],fut:+x>+TODAY,today:+x===+TODAY}})}
function streak(){let n=0;for(let i=0;;i++){const x=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()-i);if(byDay[dk(x)])n++;else if(i>0)break;else continue;if(i>4000)break}return n}
const dayImg=L=>{const m=L.find(x=>(x.type==='photo'||x.type==='video')&&src(x));return m?src(m):''};
const gl=(m,fb)=>m?`background-image:url(${src(m)})`:fb||'';
const WG=[
 {id:'mem',z:'s',name:'Memory',desc:'A photo from an earlier day.',h:m=>`<div class="wgc s wg-mem tn" data-img="${m?src(m):''}" style="${gl(m)}"><div class="wgs"><small>${m?esc(ago(m)):'Keep'}</small><b>${m?esc(line(m)):'Add a photo to start'}</b></div></div>`},
 {id:'note',z:'s',name:'Happy note',desc:'A kind line, or one you wrote.',h:(m,n)=>`<div class="wgc s wg-note"><div class="wgemo">${n.e}</div><b>${esc(n.t)}</b></div>`},
 {id:'day',z:'m',name:'On this day',desc:'A past memory with its message.',h:m=>`<div class="wgc m wg-day tn" data-img="${m?src(m):''}"><div class="wgp" style="${gl(m)}"></div><div class="wgt"><small>${m?esc(ago(m)):'Keep'}</small><b>${m?esc(line(m)):'Add a photo to start'}</b><em>${m?fullDay(new Date(m.ts)):''}</em></div></div>`},
 {id:'streak',z:'m',name:'Your streak',desc:'Days kept in a row, and this week.',h:()=>{const w=weekDays(),mx=Math.max(1,...w.map(x=>x.L.length)),n=streak();
   return `<div class="wgc m wg-str"><div class="wgt"><small>Current streak</small><b class="big">${n}<i> ${n===1?'day':'days'}</i></b><em>${w.reduce((a,x)=>a+x.L.length,0)} kept this week</em></div><div class="wgbars">${w.map((x,i)=>`<span class="${x.today?'t':''}"><i style="height:${x.fut?4:Math.max(6,x.L.length/mx*100)}%"></i><u>${DL[i]}</u></span>`).join('')}</div></div>`}},
 {id:'week',z:'l',name:'This week',desc:'Seven days of circles, and today’s memory.',h:m=>{const w=weekDays();
   return `<div class="wgc l wg-week"><small>This week</small><div class="wgdays">${w.map((x,i)=>{const im=dayImg(x.L);return `<span class="${x.today?'t':''}"><i style="${im?`background-image:url(${im})`:''}" class="${x.L.length?'':'e'}"></i><u>${DL[i]}</u></span>`}).join('')}</div>
   <div class="wgfoot tn" data-img="${m?src(m):''}"><div class="wgp" style="${gl(m)}"></div><div class="wgt"><small>${m?esc(ago(m)):'Keep'}</small><b>${m?esc(line(m)):'Add a photo to start'}</b></div></div></div>`}}];
/* the "memories" look: each photo fades into a colour taken from the photo itself */
const TINT=new Map();
function tint(u){
  if(!u)return Promise.resolve('#2b2f3a');
  if(TINT.has(u))return TINT.get(u);
  const pr=new Promise(res=>{const i=new Image();i.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.drawImage(i,0,0,8,8);const d=x.getImageData(0,0,8,8).data;let r=0,g=0,b=0;for(let k=0;k<d.length;k+=4){r+=d[k];g+=d[k+1];b+=d[k+2]}const n=d.length/4;r/=n;g/=n;b/=n;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),a=mx-mn<40?0:.7;
    const f=v=>Math.round(Math.max(0,Math.min(255,(v-(mx+mn)/2)*(1+a)+(mx+mn)/2))*.62);res(`rgb(${f(r)},${f(g)},${f(b)})`)}catch(e){res('#2b2f3a')}};i.onerror=()=>res('#2b2f3a');i.src=u});
  TINT.set(u,pr);return pr;
}
const tintAll=root=>root.querySelectorAll('.tn[data-img]').forEach(e=>tint(e.dataset.img).then(c=>e.style.setProperty('--mc',c)));
let wgTab='gallery';
const wgUrl=id=>location.origin+location.pathname+'?w='+id;
function wgHome(){
  const ws=WG.filter(w=>wgSel().includes(w.id));if(!ws.length)return '';
  return `<h3 class="wgsec">On your home screen</h3><div class="wghome"><p>Open a widget as its own icon. In Safari or Chrome, open its link, then choose <b>Add to Home Screen</b>. The icon shows today’s picture and tapping it opens that widget. It is a shortcut that refreshes when you open it, not a live widget: phones only allow those from a native app.</p>
   ${ws.map(w=>`<div class="wghr"><span><b>${w.name}</b><small>${w.z==='s'?'Small':w.z==='m'?'Medium':'Large'}</small></span><button class="tagch" data-sh="${w.id}">Share link</button><button class="tagch" data-cp="${w.id}">Copy</button></div>`).join('')}
   <p class="wgnote">Android: long-press the Keep icon for shortcuts to Add an instant, Memory of the day, Talk to Keep and Widgets.</p></div>`;
}
function wgDraw(){
  const m=pick(),n=note(),sel=wgSel(),b=$('#wgBody');if(!b)return;
  const one=w=>WG.find(x=>x.id===w).h(m,n);
  const btn=w=>`<button class="wgb ${sel.includes(w.id)?'on':''}" data-w="${w.id}" aria-label="${sel.includes(w.id)?'Remove':'Add'} ${w.name}">${sel.includes(w.id)?CHK:ic.plus}</button>`;
  const cell=w=>`<div class="wgi ${w.z}"><div class="wgh">${w.h(m,n)}</div><div class="wgm"><span><b>${w.name}</b><small>${w.desc}</small></span>${btn(w)}</div></div>`;
  if(wgTab==='gallery'){
    const sec=(z,t)=>`<h3 class="wgsec">${t}</h3><div class="wgrow ${z}">${WG.filter(w=>w.z===z).map(cell).join('')}</div>`;
    b.innerHTML=sec('s','Small')+sec('m','Medium')+sec('l','Large')+`<div class="wgmk"><button class="pill g" id="wgPic">Make a picture to share</button></div>`+wgHome();
  }else{
    const ws=WG.filter(w=>sel.includes(w.id)),sm=ws.filter(w=>w.z==='s'),rest=ws.filter(w=>w.z!=='s');
    const ico=(c,t,g)=>`<span class="wgap"><i style="background:${c}">${g||''}</i><u>${t}</u></span>`;
    const apps=`<div class="wgapps">${ico('linear-gradient(#5aa0ff,#2f6bff)','Mail')}${ico('linear-gradient(#cfe8c8,#e8f5e3)','Maps')}${ico('linear-gradient(#cfcfd4,#9a9aa0)','Camera')}${ico('#111','Clock')}</div>`;
    let h='';for(let i=0;i<sm.length;i+=2)h+=`<div class="wgsm">${one(sm[i].id)}${sm[i+1]?one(sm[i+1].id):apps}</div>`;
    if(!sm.length&&!rest.length)h=`<p class="wgempty">No widgets yet. Add some from the Gallery.</p>`;
    h+=rest.map(w=>`<div class="wgfull">${one(w.id)}</div>`).join('');
    b.innerHTML=`<div class="wgscr">${h}<div class="wgapps four">${ico('linear-gradient(#fff,#e8f0ff)','Keep','<svg viewBox="0 0 96 96" width="26" height="26"><circle cx="48" cy="48" r="26" fill="none" stroke="#0866FF" stroke-width="9"/></svg>')}${ico('linear-gradient(#fff,#f1f1f4)','Calendar')}${ico('linear-gradient(#5db4ff,#2f6bff)','Weather')}${ico('linear-gradient(#9a9aa0,#6d6d73)','Settings')}</div>
     <div class="wgdock">${['#4bd964','#fff','#4bd964','#ff5a6a'].map(c=>`<i style="background:${c}"></i>`).join('')}</div></div>
     <p class="wgcount">${ws.length} widget${ws.length===1?'':'s'} on this preview. Keep can’t add them to your real Home Screen yet.</p>`;
  }
  b.querySelectorAll('.wgb').forEach(x=>x.onclick=()=>{const id=x.dataset.w,a=wgSel(),i=a.indexOf(id);i<0?a.push(id):a.splice(i,1);wgSave(a);wgDraw();if(window.Motion)Motion.animate(b.querySelector(`.wgb[data-w="${id}"]`),{scale:[.8,1]},{type:'spring',stiffness:500,damping:14})});
  if($('#wgPic'))$('#wgPic').onclick=momOpen;
  b.querySelectorAll('[data-sh]').forEach(x=>x.onclick=async()=>{const u=wgUrl(x.dataset.sh);try{if(navigator.share)await navigator.share({title:'Keep widget',url:u});else{await navigator.clipboard.writeText(u);toast('Link copied')}}catch(e){}});
  b.querySelectorAll('[data-cp]').forEach(x=>x.onclick=async()=>{try{await navigator.clipboard.writeText(wgUrl(x.dataset.cp));toast('Link copied')}catch(e){toast(wgUrl(x.dataset.cp))}});
  tintAll(b);
}
window.wgOpen=()=>{
  const p=$('#wg');p.classList.add('on');wgTab='gallery';
  p.innerHTML=`<div class="mh2"><button class="ib" id="wgX" aria-label="Back">${ic.x}</button><div class="t"></div><i style="width:44px"></i></div><div class="wgbody"><h1 class="wgh1">Widgets</h1><p class="wgsub">Your memories, one glance away.</p>
   <div class="seg wgseg" data-k="wgt">${[['gallery','Gallery'],['home','Home Screen']].map(x=>`<button data-v="${x[0]}" class="${x[0]==='gallery'?'on':''}">${x[1]}</button>`).join('')}</div><div id="wgBody"></div></div>`;
  $('#wgX').onclick=window.wgClose;
  document.querySelector('.wgseg').onclick=e=>{const b=e.target.closest('button');if(!b)return;wgTab=b.dataset.v;document.querySelectorAll('.wgseg button').forEach(x=>x.classList.toggle('on',x===b));wgDraw()};
  wgDraw();
};
window.wgClose=()=>{const p=$('#wg');p.classList.remove('on');p.innerHTML=''};

/* a widget on its own page, for a home screen shortcut: ?w=mem|note|day|streak|week */
function wgView(id){
  const w=WG.find(x=>x.id===id);if(!w)return;
  const m=pick(),n=note();let v=$('#wgview');if(v)v.remove();
  v=document.createElement('div');v.id='wgview';v.className='wgview';v.innerHTML=`<div class="wgvw ${w.z}">${w.h(m,n)}</div><small>Tap to open Keep</small>`;$('#app').appendChild(v);tintAll(v);
  v.onclick=()=>{v.remove();document.title='Keep'};
  document.title=w.name;
  /* the icon on the home screen is today's picture */
  const c=document.createElement('canvas');c.width=c.height=180;const x=c.getContext('2d');
  const done=()=>{let l=document.querySelector('link[rel="apple-touch-icon"]');if(!l){l=document.createElement('link');l.rel='apple-touch-icon';document.head.appendChild(l)}l.href=c.toDataURL('image/png')};
  if(m&&id!=='note'&&id!=='streak'){const i=new Image();i.onload=()=>{const k=Math.max(180/i.width,180/i.height);x.drawImage(i,(180-i.width*k)/2,(180-i.height*k)/2,i.width*k,i.height*k);done()};i.onerror=done;i.src=src(m)}
  else{x.fillStyle=id==='note'?'#FFF3A8':'#0866FF';x.fillRect(0,0,180,180);x.font='90px serif';x.textAlign='center';x.fillText(id==='note'?n.e:'✨',90,118);done()}
}
{const q=new URLSearchParams(location.search),w=q.get('w'),a=q.get('a');
 if(w||a){try{history.replaceState(null,'',location.pathname)}catch(e){}
  setTimeout(()=>{try{if(w)wgView(w);else if(a==='add')openAdd();else if(a==='chat')openChat();else if(a==='widgets')wgOpen()}catch(e){}},700)}}

momRender();
})();
