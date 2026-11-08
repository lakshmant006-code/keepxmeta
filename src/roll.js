/* Photo roll (see roll.css). Reads days from byDay; the lightbox is the app's own. */
(()=>{
const RM=matchMedia('(prefers-reduced-motion:reduce)'),M=window.Motion;
const hdr=document.querySelector('.hdr .hl:last-child');if(!hdr||document.getElementById('rollBtn'))return;
const b=document.createElement('button');b.className='ib';b.id='rollBtn';b.setAttribute('aria-label','Photo roll');b.innerHTML=ic.img||'';
hdr.insertBefore(b,hdr.firstChild);
const el=document.createElement('div');el.className='roll';el.id='roll';document.querySelector('.app').appendChild(el);
const dayDate=k=>{const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const fmt=d=>d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
let rows=[],raf=0;
function groups(){return Object.keys(byDay).map(k=>({k,ph:byDay[k].filter(m=>m.type==='photo'&&src(m))})).filter(g=>g.ph.length).sort((a,c)=>dayDate(c.k)-dayDate(a.k))}
function open(){
  const gs=groups();
  el.innerHTML=`<div class="mh2"><button class="ib" id="rlX" aria-label="Close">${ic.x}</button><div class="t">Roll</div><span style="width:40px"></span></div>`+
   (gs.length?`<div class="rlsc" id="rlsc"><div style="height:36vh"></div>${gs.map((g,i)=>`<button class="rlr" data-i="${i}"><span class="rlf">${g.ph.slice(0,4).map((m,j,a)=>`<i style="background-image:url(${src(m)});--x:${(j-(a.length-1)/2)*13}px;--r:${(j-(a.length-1)/2)*7}deg;z-index:${j}"></i>`).join('')}</span><span class="rln"><b>${g.ph.length>1?"+"+g.ph.length:"1"}</b><small>${fmt(dayDate(g.k))}</small></span></button>`).join('')}<div style="height:36vh"></div></div>`:`<div class="rlempty">No photos yet. Keep a few and they will fan out here.</div>`)+`<div class="rlp" id="rlp"></div>`;
  el.classList.add('on');el.querySelector('#rlX').onclick=close;
  const sc=el.querySelector('#rlsc');if(!sc)return;
  rows=[...sc.querySelectorAll('.rlr')];
  sc.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;fx(sc)})},{passive:true});
  rows.forEach(r=>r.onclick=()=>openDay(gs[+r.dataset.i],r));
  fx(sc);if(!RM.matches&&M)M.animate(rows.slice(0,8),{opacity:[0,1]},{delay:M.stagger(.04),duration:.4});
}
/* magnify the row nearest the middle, tilt and push the rest to the right along an arc */
function fx(sc){
  const r0=sc.getBoundingClientRect(),cy=r0.top+r0.height/2;
  for(const r of rows){const b=r.getBoundingClientRect(),d=(b.top+b.height/2-cy),a=Math.min(Math.abs(d)/(r0.height*.5),1.4),near=1-Math.min(a,1);
    const s=.55+.95*near*near*(3-2*near)*1+.0,tx=a*70,ry=Math.sign(d)*0+(-26*near)+a*14;
    r.style.transform=`translate3d(${tx}px,${d*-.12}px,${-120*a}px) rotateY(${ry}deg) scale(${s.toFixed(3)})`;
    r.style.opacity=(1-Math.min(a,1.2)*.55).toFixed(2);r.style.zIndex=Math.round(near*10)}
}
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
