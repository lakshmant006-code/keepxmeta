/* ---------- Insights: what you keep, and when ---------- */
/* Everything here is counted on this phone from the memories you kept. One range filter scopes every number and chart below it (streaks are all time). */
ic.chart=st('<path d="M5 20V11M12 20V4M19 20v-6"/>',1.8);
const INS_RANGES=[['30','30 days'],['90','90 days'],['365','12 months'],['all','All time']];
const INS_PLURAL={photo:'Photos',video:'Videos',text:'Notes',quote:'Quotes',voice:'Voice notes',person:'People',file:'Files',place:'Places'};
const INS_STOP=new Set('the and for that this with have from your you are was were but not they them then than there their what when where which would could should about into just like been being also its our out can had has did does done get got him her his she our all any one two too very more most some much many how why who whom will let off over under again here only own same such both each few other because while after before during again further once those these myself yourself itself ourselves theirs mine really still even ever back going gonna want made make came come take took said say says saw see look looked day today time thing things lot way well new old good first last never always another'.split(' '));
let insRange='90';try{insRange=localStorage.getItem('kept.insr')||'90'}catch(e){}
const insFmt=n=>n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,'')+'K':String(n);
const insNice=m=>{for(const v of [2,4,6,8,10,12,16,20,24,30,40,50,60,80,100,120,160,200,300,400,600,1000,2000,4000,10000])if(v>=m)return v;return Math.ceil(m/1e4)*1e4}; /* even steps, so the mid gridline is a whole number */
const insDayMs=864e5;
const insTip=()=>{let t=$('#instip');if(!t){t=document.createElement('div');t.id='instip';t.className='instip';$('#ins').appendChild(t)}return t};
function insShowTip(el){
  const t=insTip();t.textContent=el.dataset.tip; /* labels come from your own text: textContent only */
  t.classList.add('on');
  const r=el.getBoundingClientRect(),a=$('#ins').getBoundingClientRect(),w=t.offsetWidth;
  t.style.left=Math.max(8,Math.min(a.width-w-8,r.left-a.left+r.width/2-w/2))+'px';
  t.style.top=Math.max(8,r.top-a.top-t.offsetHeight-8)+'px';
  clearTimeout(insShowTip.t);insShowTip.t=setTimeout(insHideTip,3200);
}
function insHideTip(){const t=$('#instip');if(t)t.classList.remove('on')}

/* ---- the numbers ---- */
function insData(range){
  const A=all(),end=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate(),23,59,59,999).getTime();
  const first=A.length?Math.min(...A.map(m=>m.ts)):end;
  const start=range==='all'?new Date(new Date(first).getFullYear(),new Date(first).getMonth(),new Date(first).getDate()).getTime():new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()-(+range-1)).getTime();
  return{A,M:A.filter(m=>m.ts>=start&&m.ts<=end),start,end,days:Math.max(1,Math.round((end-start)/insDayMs))};
}
function insStreaks(A){
  const keys=new Set(A.map(m=>dk(new Date(m.ts)))),days=[...keys].sort();
  let longest=0,run=0,prev=null;
  days.forEach(k=>{const [y,mo,d]=k.split('-').map(Number),t=Date.UTC(y,mo-1,d);run=prev!==null&&t-prev===insDayMs?run+1:1;prev=t;if(run>longest)longest=run});
  let cur=0,d=new Date(TODAY);if(!keys.has(dk(d)))d.setDate(d.getDate()-1); /* today may still be empty */
  while(keys.has(dk(d))){cur++;d.setDate(d.getDate()-1)}
  return{cur,longest};
}
/* memories per day, week or month, depending on how wide the range is */
function insActivity(D,range){
  const B=[],idx=new Map(),push=(key,label,tip)=>{idx.set(key,B.length);B.push({label,tip,n:0})};
  const day0=new Date(D.start),endD=new Date(TODAY);
  if(range==='30'){
    for(let d=new Date(day0);d<=endD;d.setDate(d.getDate()+1))push(dk(d),(d.getDate()===1||B.length%7===0)?MS[d.getMonth()]+' '+d.getDate():'',longDay(d));
    D.M.forEach(m=>{const i=idx.get(dk(new Date(m.ts)));if(i!=null)B[i].n++});
    return{B,unit:'per day'};
  }
  if(range==='90'){
    const mon=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
    for(let d=mon(day0);d<=endD;d.setDate(d.getDate()+7))push(dk(d),B.length%3===0?MS[d.getMonth()]+' '+d.getDate():'','Week of '+longDay(d));
    D.M.forEach(m=>{const i=idx.get(dk(mon(new Date(m.ts))));if(i!=null)B[i].n++});
    return{B,unit:'per week'};
  }
  let from=new Date(day0.getFullYear(),day0.getMonth(),1);
  const last=new Date(TODAY.getFullYear(),TODAY.getMonth()-23,1);if(range==='all'&&from<last)from=last; /* the latest 24 months */
  for(let d=new Date(from);d<=endD;d.setMonth(d.getMonth()+1))push(d.getFullYear()+'-'+d.getMonth(),(d.getMonth()%2===0||range==='365')?MS[d.getMonth()][0]+(d.getMonth()===0||B.length===0?' '+String(d.getFullYear()).slice(2):''):'',MN[d.getMonth()]+' '+d.getFullYear());
  D.M.forEach(m=>{const d=new Date(m.ts),i=idx.get(d.getFullYear()+'-'+d.getMonth());if(i!=null)B[i].n++});
  return{B,unit:'per month'};
}

/* ---- the pieces ---- */
const insEsc=esc;
function insCols(B,unit,emph){
  const max=insNice(Math.max(1,...B.map(b=>b.n))),mid=max/2;
  const hi=Math.max(...B.map(b=>b.n)); /* the peak is picked out in solid blue, the rest stay light */
  return `<div class="inschart"><div class="insy"><span>${insFmt(max)}</span><span>${insFmt(mid)}</span><span>0</span></div>
   <div class="inspl"><i class="insgl" style="top:0"></i><i class="insgl" style="top:50%"></i><i class="insgl" style="top:100%"></i>
    <div class="inscols">${B.map((b,i)=>`<div class="icl" tabindex="0" role="img" data-tip="${insEsc(b.tip+': '+b.n+' '+(b.n===1?'memory':'memories'))}" aria-label="${insEsc(b.tip+': '+b.n)}"><i class="icb ${b.n===hi&&hi>0?'hi':''}" style="height:${b.n/max*100}%"></i></div>`).join('')}</div></div></div>
   <div class="insxl"><span class="insyp"></span><div class="insxr">${B.map(b=>`<span><em>${insEsc(b.label)}</em></span>`).join('')}</div></div>`;
}
function insBars(rows){
  const max=Math.max(1,...rows.map(r=>r.n));
  return `<div class="insh">${rows.map(r=>`<div class="irw" tabindex="0" role="img" data-tip="${insEsc(r.label+': '+r.n)}" aria-label="${insEsc(r.label+': '+r.n)}">${r.av||''}<span class="ilb">${insEsc(r.label)}</span><div class="itr"><i class="ihb ${r.n===max&&max>0?'hi':''}" style="width:calc(${r.n/max} * (100% - 40px));min-width:${r.n?2:0}px"></i><b>${insFmt(r.n)}</b></div></div>`).join('')}</div>`;
}
function insTable(rows){return `<table class="instb">${rows.map(r=>`<tr><td>${insEsc(r[0])}</td><td>${insEsc(String(r[1]))}</td></tr>`).join('')}</table>`}
function insCard(title,sub,chart,table){
  return `<section class="insc"><div class="insch"><div><b>${insEsc(title)}</b>${sub?`<small>${insEsc(sub)}</small>`:''}</div><button class="tagch instgl" aria-pressed="false">Table</button></div><div class="insv">${chart}</div><div class="insv2">${insTable(table)}</div></section>`;
}
const insTile=(label,val,sub)=>`<div class="inst2"><small>${insEsc(label)}</small><b>${insEsc(String(val))}</b><span>${insEsc(sub||'')}</span></div>`;

/* ---- the page ---- */
function insOpen(){
  const p=$('#ins');p.classList.add('on');
  p.innerHTML=`<div class="mh2"><button class="ib" id="insX" aria-label="Close">${ic.x}</button><div class="t">Insights</div><span class="ib"></span></div>
   <div class="insbody" id="insBody"></div>`;
  $('#insX').onclick=insClose;insDraw();
}
function insClose(){const p=$('#ins');p.classList.remove('on');p.innerHTML=''}
function insDraw(){
  const b=$('#insBody');if(!b)return;
  const D=insData(insRange),M=D.M,S=insStreaks(D.A),rl=INS_RANGES.find(r=>r[0]===insRange)[1].toLowerCase();
  const dayKeys=new Set(M.map(m=>dk(new Date(m.ts)))),byD={};M.forEach(m=>{const k=dk(new Date(m.ts));byD[k]=(byD[k]||0)+1});
  const busiest=Object.entries(byD).sort((a,c)=>c[1]-a[1])[0];
  let h=`<div class="seg insseg" role="tablist" aria-label="Range">${INS_RANGES.map(r=>`<button data-v="${r[0]}" class="${insRange===r[0]?'on':''}">${r[1]}</button>`).join('')}</div>`;
  if(!M.length){
    h+=`<div class="empty" style="margin:36px 8px;line-height:1.5">Nothing kept in ${insRange==='all'?'your memories':'the last '+rl} yet.<br>Add an instant and it shows up here.</div>`;
  }else{
    const pct=Math.round(dayKeys.size/D.days*100);
    h+=`<div class="inshero"><small>Memories kept${insRange==='all'?'':' in the last '+rl}</small><b>${insFmt(M.length)}</b><span>On ${dayKeys.size} of ${D.days} days (${pct}%)</span></div>
     <div class="instiles">${insTile('Current streak',S.cur+(S.cur===1?' day':' days'),'all time')}${insTile('Longest streak',S.longest+(S.longest===1?' day':' days'),'all time')}${insTile('Busiest day',busiest[1],(()=>{const [y,mo,d]=busiest[0].split('-').map(Number);return MS[mo-1]+' '+d})())}</div>`;
    h+=insExtras();
    const act=insActivity(D,insRange);
    h+=insCard('Activity',act.unit[0].toUpperCase()+act.unit.slice(1),insCols(act.B,act.unit),act.B.map(x=>[x.tip,x.n]));
    const tc={};M.forEach(m=>{tc[m.type]=(tc[m.type]||0)+1});
    const types=Object.entries(tc).sort((a,c)=>c[1]-a[1]).map(([t,n])=>({label:INS_PLURAL[t]||t,n}));
    h+=insCard('What you keep','By type',insBars(types),types.map(r=>[r.label,r.n]));
    const wd=[0,0,0,0,0,0,0],WN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];M.forEach(m=>{wd[(new Date(m.ts).getDay()+6)%7]++});
    const wdB=wd.map((n,i)=>({label:WN[i],tip:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i],n}));
    const top=wdB.slice().sort((a,c)=>c.n-a.n)[0];
    h+=insCard('Busiest weekday',top.n?top.tip+'s lead':'',insCols(wdB,'',true),wdB.map(x=>[x.tip,x.n]));
    const tod=[['Morning','5am to noon',0],['Afternoon','Noon to 5pm',0],['Evening','5pm to 10pm',0],['Night','10pm to 5am',0]];
    M.forEach(m=>{const hr=new Date(m.ts).getHours();tod[hr>=5&&hr<12?0:hr>=12&&hr<17?1:hr>=17&&hr<22?2:3][2]++});
    h+=insCard('Time of day','When you keep things',insBars(tod.map(t=>({label:t[0],n:t[2]}))),tod.map(t=>[t[0]+' ('+t[1]+')',t[2]]));
    const pc={};M.filter(m=>m.type==='photo').forEach(m=>namesOf(m).forEach(n=>{const k=pkey(n);(pc[k]=pc[k]||{name:n,n:0}).n++}));
    const ppl=Object.values(pc).sort((a,c)=>c.n-a.n).slice(0,6);
    if(ppl.length)h+=insCard('People','In your photos',insBars(ppl.map(p=>({label:p.name,n:p.n,av:`<span class="insav">${avatar(p.name)}</span>`}))),ppl.map(p=>[p.name,p.n]));
    const geo=M.filter(m=>(m.type==='photo'||m.type==='video')&&geoOf(m)),spots=new Set(geo.map(m=>m.geo[0].toFixed(3)+','+m.geo[1].toFixed(3)));
    if(geo.length)h+=`<section class="insc"><div class="insch"><div><b>Places</b><small>Photos kept with a location</small></div><button class="tagch" id="insMap">Open map</button></div><div class="instiles" style="margin:6px 0 0">${insTile('With a location',geo.length,'of '+M.filter(m=>m.type==='photo'||m.type==='video').length+' photos and videos')}${insTile('Different places',spots.size,'about 100 m apart or more')}</div></section>`;
    const wc={};M.forEach(m=>{(m.text||'').toLowerCase().match(/[a-z']{3,}/g)?.forEach(w=>{w=w.replace(/^'+|'+$/g,'');if(w.length>2&&!INS_STOP.has(w))wc[w]=(wc[w]||0)+1})});
    const words=Object.entries(wc).filter(e=>e[1]>=2).sort((a,c)=>c[1]-a[1]||a[0].localeCompare(c[0])).slice(0,14);
    if(words.length)h+=`<section class="insc"><div class="insch"><div><b>Words you use</b><small>In your notes and captions</small></div></div><div class="inswords">${words.map(w=>`<span class="tagch" style="font-size:${13+Math.min(6,Math.round((w[1]/words[0][1])*6))}px">${insEsc(w[0])} <em>${w[1]}</em></span>`).join('')}</div></section>`;
  }
  /* a year ago: all time, not tied to the range */
  const ya=new Date(TODAY.getFullYear()-1,TODAY.getMonth(),TODAY.getDate()),yk=dk(ya),yn=(byDay[yk]||[]).length;
  if(yn)h+=`<section class="insc"><div class="insch"><div><b>A year ago today</b><small>${yn} ${yn===1?'memory':'memories'} on ${insEsc(fullDay(ya))}</small></div><button class="tagch" id="insYa">Open</button></div></section>`;
  h+=`<p class="note" style="padding:6px 4px 30px">Counted on this phone from what you kept. Streaks count every day with a memory, all time. Tap a bar for its number, or switch a card to its table.</p>`;
  b.innerHTML=h;
  b.querySelector('.insseg').onclick=e=>{const x=e.target.closest('[data-v]');if(!x)return;insRange=x.dataset.v;try{localStorage.setItem('kept.insr',insRange)}catch(_){}b.classList.add('busy');setTimeout(()=>{insDraw();b.classList.remove('busy')},60)};
  b.querySelectorAll('.instgl').forEach(t=>t.onclick=()=>{const c=t.closest('.insc'),on=c.classList.toggle('tbl');t.setAttribute('aria-pressed',on);t.textContent=on?'Chart':'Table'});
  b.querySelectorAll('[data-tip]').forEach(el=>{
    el.addEventListener('pointerdown',()=>insShowTip(el));
    el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')insShowTip(el)});
    el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')insHideTip()});
    el.addEventListener('focus',()=>insShowTip(el));el.addEventListener('blur',insHideTip);
  });
  if($('#insMap'))$('#insMap').onclick=()=>{insClose();openMap()};
  if($('#insYa'))$('#insYa').onclick=()=>{insClose();openDay(yk)};
}
document.addEventListener('pointerdown',e=>{if($('#ins')&&$('#ins').classList.contains('on')&&!e.target.closest('[data-tip]'))insHideTip()});
