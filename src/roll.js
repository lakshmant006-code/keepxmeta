/* Photo roll (see roll.css). Reads days from byDay; the lightbox is the app's own.
   Two shared values drive everything, each on a damped spring: pos (which day is under the middle, fractional while moving)
   and u (0 = grid, 1 = wheel). Every day's pose is a pure function of (its index - pos, u), so the whole wheel moves as one
   structure; nothing is animated on its own. */
(()=>{
const RM=matchMedia('(prefers-reduced-motion:reduce)');
const hdr=document.querySelector('.hdr .hl:last-child');if(!hdr||document.getElementById('rollBtn'))return;
const b=document.createElement('button');b.className='ib';b.id='rollBtn';b.setAttribute('aria-label','Photo roll');b.innerHTML=ic.img||'';
hdr.insertBefore(b,hdr.firstChild);
const el=document.createElement('div');el.className='roll';el.id='roll';document.querySelector('.app').appendChild(el);
const dayDate=k=>{const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
const fmt=d=>d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
const groups=()=>Object.keys(byDay).map(k=>({k,ph:byDay[k].filter(m=>m.type==='photo'&&src(m))})).filter(g=>g.ph.length).sort((a,c)=>dayDate(c.k)-dayDate(a.k));
const SENS=64,VIS=6;                       /* px of finger travel per day; days drawn either side of the middle */
let gs=[],items=[],st=null,grid=null,W=0,H=0,raf=0,last=0,shown=-1;
const S={pos:0,vp:0,tp:0,u:0,vu:0,tu:0,drag:false};
const spring=(x,v,t,k,c,dt)=>{const a=-k*(x-t)-c*v;v+=a*dt;return [x+v*dt,v]};

function open(){
  gs=groups();Object.assign(S,{pos:0,vp:0,tp:0,u:0,vu:0,tu:0,drag:false});shown=-1;
  el.innerHTML=`<div class="mh2"><button class="ib" id="rlX" aria-label="Close">${ic.x}</button><div class="t">Roll</div><span style="width:40px"></span></div>`+
    (gs.length?`<div class="rwst" id="rwst"><div class="rwg" id="rwg"></div><div class="rww" id="rww"></div><div class="rwsc" id="rwsc" aria-label="Slide to move through days"></div><div class="rwhint" id="rwhint">Slide here ›</div></div>`:`<div class="rlempty">No photos yet. Keep a few and they will fan out here.</div>`);
  el.classList.add('on');el.querySelector('#rlX').onclick=close;
  st=el.querySelector('#rwst');if(!st)return;grid=st.querySelector('#rwg');W=st.clientWidth;H=st.clientHeight;
  const ww=st.querySelector('#rww');
  items=gs.map(g=>{const d=document.createElement('div');d.className='rwi';const ph=g.ph.slice(0,5),m=(ph.length-1)/2;
    d.innerHTML=`<span class="rwf" style="width:${58+26*(ph.length-1)}px;--m:${m}">${ph.map((p,j)=>`<i style="--j:${j};z-index:${j};background-image:url(${src(p)})"></i>`).join('')}</span><span class="rwn"><b>${g.ph.length>1?'+'+g.ph.length:'1'}</b><small>${fmt(dayDate(g.k))}</small></span>`;
    d.style.display='none';ww.appendChild(d);return {d,f:d.firstChild,n:d.lastChild,on:false}});
  showGrid(0);draw();scrub(st.querySelector('#rwsc'));
}
function showGrid(i){
  if(i===shown||!gs[i])return;shown=i;const g=gs[i];g.ph.forEach(m=>{lbReg[m.id]=m});
  grid.scrollTop=0;
  grid.innerHTML=`<div class="rwh"><b>${fmt(dayDate(g.k))}</b><small>${g.ph.length} photo${g.ph.length>1?'s':''}</small></div><div class="rwgg">${g.ph.map(m=>`<button data-id="${m.id}" style="background-image:url(${src(m)})"></button>`).join('')}</div>`;
  const ids=g.ph.map(m=>m.id);
  grid.querySelectorAll('.rwgg button').forEach((x,j)=>x.onclick=()=>openLb(ids.slice(j).concat(ids.slice(0,j))));
}
/* pose of the day that is d places from the middle, blended between the resting index (u=0) and the wheel (u=1) */
function pose(d,u){
  const a=Math.abs(d),sg=d<0?-1:1,e=Math.exp(-a*1.05);
  const ws=.2+.8*e,                                   /* wheel: size falls away fast, like the reference */
        wy=sg*H*.27*(1-Math.exp(-a*.72)),             /* rows bunch together toward the ends of the arc */
        wr=W-18-26*Math.exp(-a*.9),                   /* right edge of the number: the middle one sits furthest left */
        wo=a>VIS-1?Math.max(0,VIS-a):1;
  const is=.46,iy=d*24,ir=W-12,io=Math.max(0,1-a/4.5)*.75;  /* resting index: small numbers down the right edge */
  const L=(p,q)=>p+(q-p)*u;
  return {s:L(is,ws),y:L(iy,wy),r:L(ir,wr),o:L(io,wo),rot:u*sg*-5*(1-Math.exp(-a)),stack:u,date:u*Math.exp(-a*a*3)}
}
function draw(){
  const {pos,u}=S,cy=H*.5,lo=Math.max(0,Math.floor(pos-VIS)),hi=Math.min(gs.length-1,Math.ceil(pos+VIS));
  for(let i=0;i<items.length;i++){const it=items[i];
    if(i<lo||i>hi){if(it.on){it.on=false;it.d.style.display='none'}continue}
    if(!it.on){it.on=true;it.d.style.display=''}
    const p=pose(i-pos,u);
    it.d.style.transform=`translate3d(${(p.r-W).toFixed(2)}px,${(cy+p.y).toFixed(2)}px,0) translateY(-50%) rotate(${p.rot.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
    it.d.style.opacity=p.o.toFixed(3);it.d.style.zIndex=100-Math.round(Math.abs(i-pos)*10);
    it.f.style.opacity=p.stack.toFixed(3);it.n.lastChild.style.opacity=p.date.toFixed(3)}
  /* the grid folds toward the stack as the wheel comes in */
  const g=1-u;grid.style.opacity=Math.max(0,g*1.25-.25).toFixed(3);
  grid.style.transform=u>.001?`scale(${(.3+.7*g).toFixed(4)},${(.72+.28*g).toFixed(4)})`:'';
  grid.style.filter=u>.02&&u<.98?`blur(${(u*9).toFixed(1)}px)`:'';
  grid.style.pointerEvents=u>.05?'none':'';
}
function tick(t){
  const dt=Math.min((t-last)/1000,.05);last=t;const n=Math.max(1,Math.round(dt*240)),h=dt/n;
  const kp=S.drag?520:190,cp=S.drag?44:25;          /* tight while under the finger, softer with a hint of overshoot on release */
  for(let i=0;i<n;i++){[S.pos,S.vp]=spring(S.pos,S.vp,S.tp,kp,cp,h);[S.u,S.vu]=spring(S.u,S.vu,S.tu,230,29,h)}
  S.u=Math.max(0,Math.min(1.02,S.u));
  /* once released and nearly home, open the day under the middle */
  if(!S.drag&&S.tu===1&&Math.abs(S.pos-S.tp)<.12&&Math.abs(S.vp)<1.2){showGrid(Math.round(S.tp));S.tu=0}
  const still=!S.drag&&Math.abs(S.pos-S.tp)<.001&&Math.abs(S.vp)<.01&&Math.abs(S.u-S.tu)<.001&&Math.abs(S.vu)<.01;
  if(still){S.pos=S.tp;S.u=S.tu;S.vp=S.vu=0}
  draw();raf=still?0:requestAnimationFrame(tick);
}
const run=()=>{if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}};
const band=x=>{const mx=gs.length-1;return x<0?x*.3:x>mx?mx+(x-mx)*.3:x};  /* rubber band past either end */
function scrub(z){
  let y0=0,p0=0,hist=[],lastI=0;
  z.addEventListener('pointerdown',e=>{z.setPointerCapture(e.pointerId);S.drag=true;y0=e.clientY;p0=S.tp=Math.round(S.pos);hist=[[e.timeStamp,e.clientY]];lastI=p0;S.tu=1;
    const hnt=el.querySelector('#rwhint');if(hnt)hnt.style.opacity='0';
    if(RM.matches){S.u=1}run()});
  z.addEventListener('pointermove',e=>{if(!S.drag)return;S.tp=band(p0-(e.clientY-y0)/SENS);hist.push([e.timeStamp,e.clientY]);if(hist.length>6)hist.shift();
    const i=Math.round(Math.max(0,Math.min(gs.length-1,S.tp)));if(i!==lastI){lastI=i;if(navigator.vibrate)try{navigator.vibrate(4)}catch(_){}}
    if(RM.matches){S.pos=S.tp}run()});
  const up=e=>{if(!S.drag)return;S.drag=false;
    /* carry the flick: project where the release speed would take it, then settle on a whole day */
    const a=hist[0],c=hist[hist.length-1],vy=c[0]>a[0]?(c[1]-a[1])/((c[0]-a[0])/1000):0;
    S.tp=Math.max(0,Math.min(gs.length-1,Math.round(S.tp-vy/SENS*.16)));
    if(RM.matches){S.pos=S.tp;S.u=0;S.tu=0;showGrid(S.tp)}run()};
  z.addEventListener('pointerup',up);z.addEventListener('pointercancel',up);
}
function close(){if(raf)cancelAnimationFrame(raf);raf=0;items=[];el.classList.remove('on');el.innerHTML=''}
b.onclick=open;
})();
