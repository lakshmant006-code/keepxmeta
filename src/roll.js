/* Photo roll (see roll.css). Reads days from byDay; the lightbox is the app's own. */
(()=>{
const RM=matchMedia('(prefers-reduced-motion:reduce)'),M=window.Motion;
const hdr=document.querySelector('.hdr .hl:last-child');if(!hdr||document.getElementById('rollBtn'))return;
const b=document.createElement('button');b.className='ib';b.id='rollBtn';b.setAttribute('aria-label','Photo roll');b.innerHTML=ic.img||'';
hdr.insertBefore(b,hdr.firstChild);
const el=document.createElement('div');el.className='roll';el.id='roll';document.querySelector('.app').appendChild(el);
const dayDate=k=>{const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const fmt=d=>d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
let rows=[];
function groups(){return Object.keys(byDay).map(k=>({k,ph:byDay[k].filter(m=>m.type==='photo'&&src(m))})).filter(g=>g.ph.length).sort((a,c)=>dayDate(c.k)-dayDate(a.k))}
function open(){st=new Map();loop=0;
  const gs=groups();
  el.innerHTML=`<div class="mh2"><button class="ib" id="rlX" aria-label="Close">${ic.x}</button><div class="t">Roll</div><span style="width:40px"></span></div>`+
   (gs.length?`<div class="rlsc" id="rlsc"><div style="height:36vh"></div>${gs.map((g,i)=>`<button class="rlr" data-i="${i}"><span class="rlf">${g.ph.slice(0,4).map((m,j,a)=>`<i style="background-image:url(${src(m)});--x:${(j-(a.length-1)/2)*13}px;--r:${(j-(a.length-1)/2)*7}deg;z-index:${j}"></i>`).join('')}</span><span class="rln"><b>${g.ph.length>1?"+"+g.ph.length:"1"}</b><small>${fmt(dayDate(g.k))}</small></span></button>`).join('')}<div style="height:36vh"></div></div>`:`<div class="rlempty">No photos yet. Keep a few and they will fan out here.</div>`)+`<div class="rlp" id="rlp"></div>`;
  el.classList.add('on');el.querySelector('#rlX').onclick=close;
  const sc=el.querySelector('#rlsc');if(!sc)return;
  rows=[...sc.querySelectorAll('.rlr')];
  sc.addEventListener('scroll',()=>{idle=performance.now();fx(sc);snapSoon(sc)},{passive:true});
  rows.forEach(r=>r.onclick=()=>openDay(gs[+r.dataset.i],r));
  fx(sc);
}
/* Magnify the row nearest the middle. Each row eases toward its target every frame (a critically damped follow),
   so scrolling, flicks and the snap all stay continuous; sizes change gently and the arc is shallow. */
let st=new Map(),loop=0,idle=0,sc0=null;
function target(sc,r){const H=sc.clientHeight,c=r.offsetTop+r.offsetHeight/2-sc.scrollTop-H/2,u=c/(H*.34),n=Math.exp(-u*u);
  return {s:.82+.3*n,x:Math.min(Math.abs(u),2)*14,y:c*-.04,z:-60*(1-n),ry:-8*n,o:.45+.55*n,n}}
function fx(sc){
  sc0=sc;if(loop)return;
  const step=()=>{let moving=false;
    for(const r of rows){const t=target(sc,r);let c=st.get(r);if(!c){c={...t};st.set(r,c)}
      for(const k of ['s','x','y','z','ry','o']){const d=t[k]-c[k];if(Math.abs(d)>.0005){c[k]+=d*.28;moving=true}else c[k]=t[k]}
      r.style.transform=`translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,${c.z.toFixed(1)}px) rotateY(${c.ry.toFixed(2)}deg) scale(${c.s.toFixed(4)})`;
      r.style.opacity=c.o.toFixed(3);r.style.zIndex=Math.round(t.n*10)}
    loop=moving||performance.now()-idle<140?requestAnimationFrame(step):0};
  idle=performance.now();loop=requestAnimationFrame(step);
}
/* after the finger and the flick are done, glide the nearest stack to the middle */
let snapT=0;
function snapSoon(sc){clearTimeout(snapT);snapT=setTimeout(()=>{const H=sc.clientHeight;let best=null,bd=1e9;for(const r of rows){const d=Math.abs(r.offsetTop+r.offsetHeight/2-sc.scrollTop-H/2);if(d<bd){bd=d;best=r}}
  if(best&&bd>2)sc.scrollTo({top:best.offsetTop+best.offsetHeight/2-H/2,behavior:RM.matches?'auto':'smooth'})},120)}
function openDay(g,row){
  const p=el.querySelector('#rlp');g.ph.forEach(m=>{lbReg[m.id]=m});
  p.innerHTML=`<div class="mh2"><button class="ib" id="rlB" aria-label="Back">${ic.x}</button><div class="t"></div><span style="width:40px"></span></div><div class="rlh"><b>${fmt(dayDate(g.k))}</b><small>${g.ph.length} photo${g.ph.length>1?'s':''}</small></div><div class="rlg">${g.ph.map(m=>`<button data-id="${m.id}" style="background-image:url(${src(m)})"></button>`).join('')}</div>`;
  const rb=row.getBoundingClientRect(),ox=rb.left+60,oy=rb.top+rb.height/2,R=Math.hypot(innerWidth,innerHeight);
  p.classList.add('on');
  if(!RM.matches){p.animate([{clipPath:`circle(30px at ${ox}px ${oy}px)`,filter:'blur(8px)'},{clipPath:`circle(${R}px at ${ox}px ${oy}px)`,filter:'blur(0)'}],{duration:620,easing:'cubic-bezier(.32,.72,0,1)'});
    if(M)M.animate(p.querySelectorAll('.rlg button'),{opacity:[0,1],y:[26,0],scale:[.92,1]},{delay:M.stagger(.045,{start:.15}),type:'spring',stiffness:340,damping:28})}
  p.querySelector('#rlB').onclick=()=>{
    if(RM.matches){p.classList.remove('on');return}
    p.animate([{clipPath:`circle(${R}px at ${ox}px ${oy}px)`},{clipPath:`circle(30px at ${ox}px ${oy}px)`}],{duration:420,easing:'cubic-bezier(.32,.72,0,1)'}).onfinish=()=>p.classList.remove('on')};
  p.querySelectorAll('.rlg button').forEach(x=>x.onclick=()=>openLb(g.ph.map(m=>m.id).slice(g.ph.findIndex(m=>m.id==x.dataset.id)).concat(g.ph.map(m=>m.id).slice(0,g.ph.findIndex(m=>m.id==x.dataset.id)))));
}
function close(){el.classList.remove('on');el.innerHTML=''}
b.onclick=open;
})();
