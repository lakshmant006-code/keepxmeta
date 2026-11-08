/* Seamless morphs, after the "Details" menu reference: a glass lens slides between pill tabs (and follows a dragging finger),
   and each screen grows out of the tab that opened it, then its content staggers in. Decoration only: failure leaves the app working. */
(()=>{
const M=window.Motion,pl=document.getElementById('kpill');if(!M||!pl)return;
const {animate,stagger}=M,RM=matchMedia('(prefers-reduced-motion:reduce)');
const SPR={type:'spring',stiffness:520,damping:34,mass:.9};
const lens=document.createElement('i');lens.className='kpl';pl.insertBefore(lens,pl.firstChild);
let origin=null,hideT=0,ctl=null;
const tabs=()=>[...pl.querySelectorAll('.pt,.pa')];
const box=t=>{const a=pl.getBoundingClientRect(),r=t.getBoundingClientRect();return {x:r.left-a.left,y:r.top-a.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2}};
function to(t,first){
  if(RM.matches)return;clearTimeout(hideT);const b=box(t);
  if(first){lens.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;opacity:0;transform:scale(.7)`}
  if(ctl)ctl.stop();
  ctl=animate(lens,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px',opacity:1,scale:1},SPR);
  origin={x:b.cx,y:b.cy};
}
const off=(d=420)=>{clearTimeout(hideT);hideT=setTimeout(()=>animate(lens,{opacity:0,scale:.9},{duration:.35,ease:[.32,.72,0,1]}),d)};
const at=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest('#kpill [data-t]')};
let drag=null,ign=0;
pl.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-t]');if(!t)return;drag={x:e.clientX,y:e.clientY,t,moved:0};to(t,lens.style.opacity!=='1')},{passive:true});
addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>10)drag.moved=1;if(!drag.moved)return;const t=at(e.clientX,e.clientY);if(t&&t!==drag.t){drag.t=t;to(t);if(navigator.vibrate)try{navigator.vibrate(5)}catch(_){}}},{passive:true});
addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(d.moved){ign=Date.now();const t=at(e.clientX,e.clientY)||d.t;const el=document.getElementById(t.dataset.t);if(el)el.click()}off()},true);
addEventListener('pointercancel',()=>{drag=null;off(0)},true);
pl.addEventListener('click',e=>{if(Date.now()-ign<400){e.stopImmediatePropagation();e.preventDefault()}},true);

/* screens grow out of the tab that opened them */
function grow(el){
  if(RM.matches||!origin)return;const W=innerWidth,H=innerHeight,r=Math.hypot(Math.max(origin.x,W-origin.x),Math.max(origin.y,H-origin.y));
  el.animate([{clipPath:`circle(28px at ${origin.x}px ${origin.y}px)`,opacity:.4,filter:'blur(6px)'},{clipPath:`circle(${r+20}px at ${origin.x}px ${origin.y}px)`,opacity:1,filter:'blur(0)'}],{duration:620,easing:'cubic-bezier(.32,.72,0,1)'});
  const kids=el.querySelectorAll('.mh2,.fract>*,.frcl,.frr,.frbb,.frme,.row,.card,.pcard');
  if(kids.length)animate(kids,{opacity:[0,1],y:[18,0]},{delay:stagger(.03,{start:.18}),type:'spring',stiffness:380,damping:30});
  const bb=el.querySelectorAll('.frbb');if(bb.length)animate(bb,{scale:[.3,1]},{delay:stagger(.045,{start:.25}),type:'spring',stiffness:300,damping:14});
  off(520);
}
const ids=['fr','ins','mp','ar'];
const mo=new MutationObserver(l=>{for(const m of l){const el=m.target;if(el.classList.contains('on')&&!(m.oldValue||'').split(' ').includes('on'))requestAnimationFrame(()=>grow(el))}});
ids.forEach(i=>{const el=document.getElementById(i);if(el)mo.observe(el,{attributes:true,attributeFilter:['class'],attributeOldValue:true})});
})();
