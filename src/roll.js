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
function open(){v=0;loop=0;
  const gs=groups();
  el.innerHTML=`<div class="mh2"><button class="ib" id="rlX" aria-label="Close">${ic.x}</button><div class="t">Roll</div><span style="width:40px"></span></div>`+
   (gs.length?`<div class="rlsc" id="rlsc"><div style="height:36vh"></div>${gs.map((g,i)=>`<button class="rlr" data-i="${i}"><span class="rlf">${g.ph.slice(0,4).map((m,j,a)=>`<i style="background-image:url(${src(m)});--x:${(j-(a.length-1)/2)*13}px;--r:${(j-(a.length-1)/2)*7}deg;z-index:${j}"></i>`).join('')}</span><span class="rln"><b>${g.ph.length>1?"+"+g.ph.length:"1"}</b><small>${fmt(dayDate(g.k))}</small></span></button>`).join('')}<div style="height:36vh"></div></div>`:`<div class="rlempty">No photos yet. Keep a few and they will fan out here.</div>`)+`<div class="rlp" id="rlp"></div>`;
  el.classList.add('on');el.querySelector('#rlX').onclick=close;
  const sc=el.querySelector('#rlsc');if(!sc)return;
  rows=[...sc.querySelectorAll('.rlr')];
  sc.addEventListener('scroll',()=>{idle=performance.now();fx(sc);snapSoon(sc)},{passive:true});
  rows.forEach(r=>r.onclick=()=>openDay(gs[+r.dataset.i],r));
  v=sc.scrollTop;place(sc);fx(sc);snapSoon(sc);
}
/* Magnify the row nearest the middle. Native scrolling gives the finger and the flick; the picture follows it through one
   critically damped "virtual scroll" (frame-rate independent), and every stack is placed from that single value, so all of
   them glide together. Rows sit at their real position, so a transform of (real - virtual) makes up the lag. */
let v=0,loop=0,last=0,idle=0;
function place(sc){
  const H=sc.clientHeight,real=sc.scrollTop,lag=real-v;
  const R=H*.5;
  for(const r of rows){const base=r.offsetTop+r.offsetHeight/2,c=base-v-H/2,u=c/(H*.34),n=Math.exp(-u*u);
    /* the rows ride a wheel whose centre is off to the left: angle from how far the row is from the middle */
    const th=Math.max(-1.45,Math.min(1.45,c/R)),arc=R*(1-Math.cos(th)),wy=R*Math.sin(th)-c;
    const ax=80*(1-Math.exp(-arc/80)),s=.56+.54*n,x=ax*.35,y=lag+wy,z=-50*(1-n),ry=-6*n;
    r.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    const ns=.62+.4*n,wx=ax*.75-8;
    /* numbers sit ON the drawn arc: a circle of radius .36 H, bulging left at the middle (x ~ 73% of the width) */
    const W=r.offsetWidth,Rn=H*.36,yy=Math.max(-Rn*.98,Math.min(Rn*.98,c+wy)),P=Math.min(W-22,W*.73+Rn-Math.sqrt(Rn*Rn-yy*yy));
    r.style.setProperty('--nx',(W/2+(P-W/2-x)/s).toFixed(2)+'px');r.style.setProperty('--ns',(ns/s).toFixed(4));
    r.style.opacity=((.4+.6*n)*Math.max(0,Math.min(1,1-(Math.abs(c/R)-.85)/.4))).toFixed(3);r.style.zIndex=Math.round(n*10)}
}
function fx(sc){
  idle=performance.now();if(loop)return;last=performance.now();
  const step=t=>{const dt=Math.min((t-last)/1000,.05);last=t;const real=sc.scrollTop;
    v+=(real-v)*(1-Math.exp(-dt*16));if(Math.abs(real-v)<.02)v=real;
    place(sc);loop=(v!==real||t-idle<160)?requestAnimationFrame(step):0};
  loop=requestAnimationFrame(step);
}
/* once the finger and the flick are done, glide the nearest stack to the middle (the picture follows through the same easing) */
let snapT=0;
function snapSoon(sc){clearTimeout(snapT);snapT=setTimeout(()=>{const H=sc.clientHeight;let best=null,bd=1e9;for(const r of rows){const d=Math.abs(r.offsetTop+r.offsetHeight/2-sc.scrollTop-H/2);if(d<bd){bd=d;best=r}}
  if(best&&bd>1.5){const top=best.offsetTop+best.offsetHeight/2-H/2;if(RM.matches)sc.scrollTop=top;else{const from=sc.scrollTop,t0=performance.now(),dur=320;const e=x=>1-Math.pow(1-x,3);const go=t=>{const k=Math.min((t-t0)/dur,1);sc.scrollTop=from+(top-from)*e(k);if(k<1)requestAnimationFrame(go)};requestAnimationFrame(go)}}},110)}
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
