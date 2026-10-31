/* ---------- Moments: a feed of what you kept, shown on the chat's first screen (Days, Weeks, Months) ---------- */
/* Each moment is a small collage: the best photo large, a map tile for the place, a few more photos and a "+N" tile, then a time, a title and a line. */
const MMK='kept.mm';
let mmMode='days';
const mmPhotos=L=>L.filter(x=>(x.type==='photo'||x.type==='video')&&src(x)).sort((a,b)=>(!!b.text+!!b.who)-(!!a.text+!!a.who)||a.ts-b.ts);
const mmTitle=L=>{
  const pl=L.find(x=>x.type==='place'&&x.name),cap=L.find(x=>x.text&&(x.type==='photo'||x.type==='video'||x.type==='text'||x.type==='voice'));
  const ppl=[...new Set(L.flatMap(x=>x.type==='person'?[x.name]:chNames(x)))].filter(Boolean);
  const first=s=>{s=String(s||'').trim();const i=s.search(/[.!?]\s/);const t=i>6&&i<56?s.slice(0,i):s.length>46?s.slice(0,44).replace(/\s+\S*$/,'')+'…':s;return t.replace(/[.!?]$/,'')};
  if(cap&&cap.text.length<=60)return first(cap.text);
  if(ppl.length)return 'With '+chList(ppl.slice(0,2).map(chPN));
  if(pl)return pl.name;
  if(cap)return first(cap.text);
  return 'A day you kept';
};
const mmDesc=L=>{
  const t=L.filter(x=>x.text&&['text','voice','photo','video','quote'].includes(x.type)).map(x=>x.text.trim()).join(' ').replace(/\s+/g,' ');
  return t?chSnip(t,110):'You kept '+chBreak(L)+'.';
};
function mmMosaic(L){
  const ph=mmPhotos(L),pl=L.find(x=>x.type==='place'&&x.name),tile=u=>`<i class="mmt" style="background-image:url(${u})"></i>`;
  if(!ph.length){const t=L.find(x=>x.text);return `<div class="mmos txt"><div class="mmbig mmtx">${esc(chSnip(t?t.text:L.map(x=>x.name||'').join(' '),120)||'Kept')}</div></div>`}
  const small=[];if(pl)small.push(`<i class="mmt map"><b>${ic.pin?ic.pin.replace('width="22" height="22"','width="16" height="16"'):''}</b><small>${esc(pl.name)}</small></i>`);
  const rest=ph.slice(1),room=4-small.length;
  rest.slice(0,room).forEach(p=>small.push(tile(src(p))));
  const extra=rest.length-(room-(small.filter(s=>!s.includes('map')).length-rest.slice(0,room).length));
  const more=ph.length-1-rest.slice(0,room).length;
  if(more>0){small.pop();small.push(`<i class="mmt more">${ic.img?ic.img.replace('width="22" height="22"','width="22" height="22"'):''}<small>${more+1}+</small></i>`)}
  const isv=ph[0].type==='video';
  const n=Math.min(4,small.length);
  return `<div class="mmos n${n>=3?3:n}"><i class="mmbig" style="background-image:url(${src(ph[0])})">${isv&&ph[0].dur?`<em>${esc(ph[0].dur)}</em>`:''}</i>${small.slice(0,4).join('')}</div>`;
}
const mmCard=(L,label,key)=>{const t=mmTitle(L);let d=mmDesc(L);const tn=t.replace(/…$/,'').toLowerCase();if(d.toLowerCase().startsWith(tn)){d=d.slice(t.replace(/…$/,'').length).replace(/^[\s.!?,;:]+/,'');if(d.length<12)d='You kept '+chBreak(L)+'.'}
  return `<button class="mm" data-d="${key}">${mmMosaic(L)}<div class="mmm">${esc(label)}</div><div class="mmti">${esc(t)}</div><div class="mmd">${esc(d)}</div></button>`};
function mmGroups(mode){
  const A=all().filter(m=>m.ts<=Date.now()+864e5),g=new Map();
  A.forEach(m=>{const d=new Date(m.ts);let k;
    if(mode==='days')k=dk(d);
    else if(mode==='weeks'){const o=(d.getDay()+6)%7,s=new Date(d.getFullYear(),d.getMonth(),d.getDate()-o);k=dk(s)}
    else k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';
    if(!g.has(k))g.set(k,[]);g.get(k).push(m)});
  return[...g.entries()].filter(([,L])=>mmPhotos(L).length||L.some(x=>x.text)).sort((a,b)=>b[0]<a[0]?-1:1).slice(0,mode==='days'?6:4);
}
const mmLabel=(mode,k,L)=>{const [y,m,d]=k.split('-').map(Number),dt=new Date(y,m-1,d);
  if(mode==='days'){const t=Math.min(...L.map(x=>x.ts));return chRel(dt)+' · '+tstr(t)}
  if(mode==='weeks'){const e=new Date(y,m-1,d+6),diff=Math.round((+TODAY-+dt)/864e5);return (diff<7?'This week':diff<14?'Last week':'Week of')+' · '+MS[dt.getMonth()]+' '+dt.getDate()+' to '+(e.getMonth()!==dt.getMonth()?MS[e.getMonth()]+' ':'')+e.getDate()+' · '+new Set(L.map(x=>dk(new Date(x.ts)))).size+' days'}
  return MN[dt.getMonth()]+' '+dt.getFullYear()+' · '+L.length+' moments'};
/* a collection banner: the person or place you have the most photos of */
function mmHero(){
  const c=new Map();all().filter(m=>m.type==='photo'&&src(m)).forEach(m=>chNames(m).forEach(n=>{const f=chFirstOf(n);if(f.length<3||CH_WORDS.has(f))return;const e=c.get(f)||{n,L:[]};e.L.push(m);c.set(f,e)}));
  const top=[...c.values()].sort((a,b)=>b.L.length-a.L.length)[0];if(!top||top.L.length<3)return '';
  const ph=top.L.sort((a,b)=>b.ts-a.ts)[0];
  return `<button class="mmh" data-s="Photos with ${esc(chPN(top.n))}" style="background-image:url(${src(ph)})"><span><b>Moments with ${esc(chPN(top.n))}</b><small>${top.L.length} moments</small></span></button>`;
}
function mmHTML(mode){
  const gs=mmGroups(mode);if(!gs.length)return '';
  return `<div class="mmwrap" id="mmwrap"><div class="mmtabs" role="tablist">${[['days','Days'],['weeks','Weeks'],['months','Months']].map(t=>`<button class="${t[0]===mode?'on':''}" data-mm="${t[0]}">${t[1]}</button>`).join('')}</div>${mode==='days'?mmHero():''}
   <div class="mmfeed">${gs.map(([k,L],i)=>`<div style="--i:${i}">${mmCard(L,mmLabel(mode,k,L),k)}</div>`).join('')}</div></div>`;
}
window.mmRender=()=>mmHTML(mmMode);
document.addEventListener('click',e=>{
  const t=e.target.closest('#cb [data-mm]');if(!t)return;e.stopPropagation();mmMode=t.dataset.mm;
  const w=$('#mmwrap');if(!w)return;const h=document.createElement('div');h.innerHTML=mmHTML(mmMode);w.replaceWith(h.firstElementChild);
  if(window.Motion)Motion.animate(document.querySelectorAll('#mmwrap .mmfeed>div'),{opacity:[0,1],y:[14,0]},{type:'spring',stiffness:340,damping:26,delay:Motion.stagger?Motion.stagger(.05):0});
},true);
