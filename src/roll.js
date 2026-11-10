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
let v=0,loop=0,last=0,idle=0,gs=[],focus=-1,sc=null;
const ROW=78,SPACING=.3,R=ROW/SPACING,FOCAL=520;
function open(){
  v=0;loop=0;focus=-1;gs=groups();
  el.innerHTML=`<div class="mh2"><button class="ib" id="rlX" aria-label="Close">${ic.x}</button><div class="t">Roll</div><span style="width:40px"></span></div>`+
   (gs.length?`<div class="rlsc" id="rlsc"><div class="rlsp"></div>${gs.map((g,i)=>`<div class="rlr" data-i="${i}"><button class="rli" aria-label="${fmt(dayDate(g.k))}"><span class="rlf">${g.ph.slice(0,3).map((m,j,a)=>`<i style="background-image:url(${src(m)});--x:${(j-(a.length-1)/2)*11}px;--r:${(j-(a.length-1)/2)*7}deg;z-index:${j}"></i>`).join('')}</span></button></div>`).join('')}<div class="rlsp"></div></div><div class="rldial" id="rldial">${[-4,-3,-2,-1,0,1,2,3,4].map(k=>`<span class="rln" data-k="${k}"><b></b><small></small></span>`).join('')}</div>`:`<div class="rlempty">No photos yet. Keep a few and they will fan out here.</div>`)+`<div class="rlp" id="rlp"></div>`;
  el.classList.add('on');el.querySelector('#rlX').onclick=close;
  sc=el.querySelector('#rlsc');if(!sc)return;
  const H=sc.clientHeight;el.querySelectorAll('.rlsp').forEach(x=>x.style.height=(H/2-ROW/2)+'px');
  rows=[...sc.querySelectorAll('.rlr')];
  sc.addEventListener('scroll',()=>{idle=performance.now();fx(sc);snapSoon(sc)},{passive:true});
  rows.forEach((r,i)=>r.querySelector('.rli').onclick=()=>{if(i===focus)openDay(gs[i],r.querySelector('.rli'));else sc.scrollTo({top:r.offsetTop+ROW/2-H/2,behavior:RM.matches?'auto':'smooth'})});
  dialLayout(sc);v=sc.scrollTop;place(sc);fx(sc);snapSoon(sc);
}
/* Orbital gallery. Every day sits on one invisible curved rail whose axis is off to the right, at the level of the middle of
   the screen. A row's angle is theta = (its distance from the middle) / R, and the pose comes from a single pose function:
   x = X0 + k z, z = R (1 - cos theta), y = R sin theta, perspective scale s = f / (f + z), yaw -theta. The shared parameter is
   the "virtual scroll" v: native scrolling gives the finger and the flick, and v follows it on a critically damped spring,
   so all cards move together as one structure. */
function pose(c){
  const raw=c/R,th=Math.max(-1.25,Math.min(1.25,raw)),z=R*(1-Math.cos(th)),s=FOCAL/(FOCAL+z);
  return {th,z,s,x:z*1.15,y:R*Math.sin(th),sc:1.16*s,ry:-th*38,o:Math.abs(raw)>1.2?0:Math.max(0,Math.min(1,1.15-z/(R*.78)))*(.35+.65*s)}
}
/* The dates are a fixed dial: nine slots pinned to an arc on the right (it bulges left at the middle). The slots never move;
   only their text changes as days pass under the middle. The photographs are the only thing that travels. */
function dialLayout(sc){
  const d=el.querySelector('#rldial');if(!d)return;const H=sc.clientHeight,W=sc.clientWidth,Rn=H*.36;
  d.style.top=sc.offsetTop+'px';d.style.height=H+'px';
  d.querySelectorAll('.rln').forEach(n=>{const k=+n.dataset.k,th=k*.27,y=H/2+Rn*Math.sin(th),x=Math.min(W-56,W*.68+Rn*(1-Math.cos(th))),g=Math.exp(-(k*k)/3.2);
    n.style.left=x.toFixed(1)+'px';n.style.top=y.toFixed(1)+'px';n.style.setProperty('--ns',(.6+.5*g).toFixed(3));n.style.opacity=(.18+.82*g).toFixed(2)});
}
function dialText(){
  const d=el.querySelector('#rldial');if(!d)return;
  d.querySelectorAll('.rln').forEach(n=>{const g=gs[focus+(+n.dataset.k)];n.firstChild.textContent=g?(g.ph.length>1?'+'+g.ph.length:'1'):'';n.lastChild.textContent=g?fmt(dayDate(g.k)):'';
    if(!RM.matches&&g)n.animate([{filter:'blur(3px)'},{filter:'blur(0)'}],{duration:180,easing:'ease-out'})});
}
function place(sc){
  const H=sc.clientHeight,W=sc.clientWidth,lag=sc.scrollTop-v;let best=0,bd=1e9;
  rows.forEach((r,i)=>{const c=r.offsetTop+ROW/2-v-H/2;if(Math.abs(c)<bd){bd=Math.abs(c);best=i}
    const p=pose(c),it=r.firstChild;
    it.style.transform=`translate3d(${(W*.16+p.x*.4).toFixed(2)}px,${(lag+p.y-c).toFixed(2)}px,0) rotateY(${(p.ry*.5).toFixed(2)}deg) scale(${(p.sc*.98).toFixed(4)})`;
    it.style.opacity=p.o.toFixed(3);it.style.visibility=p.o<.01?'hidden':'';it.style.zIndex=1000-Math.round(p.z)});
  if(best!==focus){focus=best;dialText()}
}
function fx(sc){
  idle=performance.now();if(loop)return;last=performance.now();
  const step=t=>{const dt=Math.min((t-last)/1000,.05);last=t;const real=sc.scrollTop;
    v+=(real-v)*(1-Math.exp(-dt*16));if(Math.abs(real-v)<.02)v=real;
    place(sc);loop=(v!==real||t-idle<160)?requestAnimationFrame(step):0};
  loop=requestAnimationFrame(step);
}
/* once the finger and the flick are done, glide the nearest day to the middle */
let snapT=0;
function snapSoon(sc){clearTimeout(snapT);snapT=setTimeout(()=>{const H=sc.clientHeight;let best=null,bd=1e9;for(const r of rows){const d=Math.abs(r.offsetTop+ROW/2-sc.scrollTop-H/2);if(d<bd){bd=d;best=r}}
  if(best&&bd>1.5){const top=best.offsetTop+ROW/2-H/2;if(RM.matches)sc.scrollTop=top;else{const from=sc.scrollTop,t0=performance.now(),dur=320;const e=x=>1-Math.pow(1-x,3);const go=t=>{const k=Math.min((t-t0)/dur,1);sc.scrollTop=from+(top-from)*e(k);if(k<1)requestAnimationFrame(go)};requestAnimationFrame(go)}}},110)}
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
