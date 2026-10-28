/* Small, consistent motion. Everything here is decoration: if it fails, the app still works. */
(()=>{
const RM=matchMedia('(prefers-reduced-motion:reduce)'),$=q=>document.querySelector(q);
const buzz=ms=>{if(!RM.matches&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
/* haptics only where a tap means something: choosing, capturing, keeping */
document.addEventListener('pointerdown',e=>{if(e.target.closest('.seg>button,.mseg>button,.insseg>button,.mb,.shutter'))buzz(6)},{passive:true});

/* sliding pill, stretching a little toward its new spot before it settles */
function pill(c){
  if(c.dataset.mp)return;c.dataset.mp='1';
  const p=document.createElement('i');p.className='mpill nt';c.insertBefore(p,c.firstChild);
  let last=null,tm=0;
  const set=(l,t,w,h)=>{p.style.left=l+'px';p.style.top=t+'px';p.style.width=w+'px';p.style.height=h+'px'};
  const place=anim=>{
    const b=c.querySelector(':scope>button.on');
    if(!b||!b.offsetWidth){p.style.opacity=0;return false}
    const r={l:b.offsetLeft,t:b.offsetTop,w:b.offsetWidth,h:b.offsetHeight};
    p.style.borderRadius=getComputedStyle(b).borderRadius;
    clearTimeout(tm);
    if(anim&&last&&!RM.matches&&(last.l!==r.l||last.t!==r.t)){
      p.classList.remove('nt');
      const l=Math.min(last.l,r.l),rt=Math.max(last.l+last.w,r.l+r.w);
      if(last.t===r.t){set(l,r.t,rt-l,r.h);tm=setTimeout(()=>set(r.l,r.t,r.w,r.h),100)}else set(r.l,r.t,r.w,r.h);
    }else{p.classList.add('nt');set(r.l,r.t,r.w,r.h);void p.offsetWidth;p.classList.remove('nt')}
    p.style.opacity=1;last=r;return true;
  };
  let tries=0;const first=()=>{if(!place(false)&&tries++<30)requestAnimationFrame(first)};first();
  let raf=0;new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>place(true))}).observe(c,{attributes:true,subtree:true,attributeFilter:['class']});
  addEventListener('resize',()=>place(false));
}
/* soft reveal for whatever a sheet or page has just drawn */
const REV='.pb>.ev,.dh,#ins .insc,#ins .inshero,#ins .inst2,#fr .frr,#mp .pcard,#fr .grp,.gsetup>*';
function reveal(root){
  const els=[...root.querySelectorAll(REV)].filter(e=>!e.classList.contains('mrv'));
  els.slice(0,10).forEach((e,i)=>{e.style.setProperty('--i',i);e.classList.add('mrv')});
}
let sq=0;
const scan=()=>{document.querySelectorAll('.seg,.insseg,.mseg,.modes').forEach(pill);['#pc','#ins','#fr','#mp'].forEach(q=>{const r=$(q);if(r)reveal(r)})};
new MutationObserver(()=>{cancelAnimationFrame(sq);sq=requestAnimationFrame(scan)}).observe(document.body,{childList:true,subtree:true});
scan();

/* depth: the home screen steps back while anything is open on top of it */
const tops=['#sh','#ov','#mp','#fr','#ins','#chat'].map($).filter(Boolean);
const depth=()=>document.body.classList.toggle('depth',tops.some(e=>e.classList.contains('on')));
tops.forEach(e=>new MutationObserver(depth).observe(e,{attributes:true,attributeFilter:['class']}));
/* new content in a sheet should reveal fresh every time it opens */
const sh=$('#sh');if(sh)new MutationObserver(()=>{if(!sh.classList.contains('on'))document.querySelectorAll('#pc .mrv').forEach(e=>e.classList.remove('mrv'))}).observe(sh,{attributes:true,attributeFilter:['class']});

/* shared element: the tapped day's circle grows into the thumbnail in its sheet */
let from=null;
const cal=$('#cal');
if(cal)cal.addEventListener('click',e=>{
  const c=e.target.closest('.cell[data-d]');from=null;if(!c||RM.matches)return;
  const o=c.querySelector('.orb');if(!o)return;const r=o.getBoundingClientRect();from={l:r.left,t:r.top,w:r.width,h:r.height};
  requestAnimationFrame(()=>requestAnimationFrame(()=>fly()));
},true);
function fly(){
  const f=from;from=null;if(!f)return;
  const th=$('#pc .stk .th');if(!th)return;
  const bg=getComputedStyle(th).backgroundImage;if(!bg||bg==='none')return;
  const el=document.createElement('div');el.className='mfly';el.style.backgroundImage=bg;document.body.appendChild(el);
  th.style.opacity='0';
  const t0=performance.now(),D=420,ease=t=>1-Math.pow(1-t,3);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const tick=now=>{
    const t=Math.min(1,(now-t0)/D),k=ease(t),g=th.getBoundingClientRect();
    if(!g.width){el.remove();th.style.opacity='';return}
    el.style.left=lerp(f.l,g.left,k)+'px';el.style.top=lerp(f.t,g.top,k)+'px';
    el.style.width=lerp(f.w,g.width,k)+'px';el.style.height=lerp(f.h,g.height,k)+'px';
    el.style.borderRadius=lerp(f.w/2,12,k)+'px';
    if(t<1)requestAnimationFrame(tick);else{th.style.opacity='';el.remove()}
  };
  requestAnimationFrame(tick);
}

/* shape-shifting save: squeeze to a circle, tick, then carry on */
window.keepMorph=(btn,done)=>{
  if(!btn||RM.matches){done();return}
  btn.style.width=btn.offsetWidth+'px';btn.disabled=true;void btn.offsetWidth;btn.classList.add('ok');buzz(12);
  setTimeout(done,560);
};
})();
