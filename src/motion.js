/* Small, consistent motion, driven by Motion (motion.dev). Everything here is decoration: if it fails, the app still works.
   One vocabulary: quick springs with very little overshoot. */
(()=>{
const M=window.Motion;if(!M)return;
const {animate,stagger}=M,RM=matchMedia('(prefers-reduced-motion:reduce)'),$=q=>document.querySelector(q);
const SNAP={type:'spring',stiffness:620,damping:32},SOFT={type:'spring',stiffness:340,damping:26},BACK={type:'spring',stiffness:420,damping:15};
const buzz=ms=>{if(!RM.matches&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};

/* soft press: compress to 97% under the finger, spring back past rest */
const PRESS='button:not(:disabled):not(.shutter):not(.mb):not(.vfb),.cell:not(.e),.frr,.fcit,.pcard,.stk';
const amt=el=>el.matches('.ib')?.9:el.matches('.cell')?.93:el.matches('.addp')?.96:.97;
let down=null;
addEventListener('pointerdown',e=>{
  if(e.target.closest('.seg>button,.mseg>button,.insseg>button,.mb,.shutter'))buzz(6);
  if(RM.matches)return;const el=e.target.closest(PRESS);if(!el)return;
  down={el,c:animate(el,{scale:amt(el)},SNAP)};
},{passive:true});
const release=()=>{if(!down)return;const {el,c}=down;down=null;c.stop();animate(el,{scale:1},BACK).finished.then(()=>{el.style.transform='';el.style.scale=''}).catch(()=>{})};
addEventListener('pointerup',release,true);addEventListener('pointercancel',release,true);addEventListener('scroll',release,true);

const PILL=new Map();
/* sliding pill: its leading edge moves first and the trailing edge follows, so it stretches and settles */
function pill(c){
  if(c.dataset.mp)return;c.dataset.mp='1';
  const p=document.createElement('i');p.className='mpill';c.insertBefore(p,c.firstChild);
  /* a page that redraws its whole control (Insights does) would reset the pill, so each control remembers where its pill last was */
  const key=c.className+'|'+(c.closest('[id]')||{}).id+'|'+[...document.querySelectorAll('.'+c.className.split(' ')[0])].indexOf(c);
  let cur=PILL.get(key)||null,cl=null,cr=null;
  if(cur)cur={...cur};
  const draw=()=>{p.style.left=cur.l+'px';p.style.width=Math.max(0,cur.r-cur.l)+'px';PILL.set(key,{l:cur.l,r:cur.r})};
  const place=anim=>{
    const b=c.querySelector(':scope>button.on');
    if(!b||!b.offsetWidth){p.style.opacity=0;return false}
    const t={l:b.offsetLeft,r:b.offsetLeft+b.offsetWidth,t:b.offsetTop,h:b.offsetHeight};
    p.style.borderRadius=getComputedStyle(b).borderRadius;p.style.top=t.t+'px';p.style.height=t.h+'px';p.style.opacity=1;
    if(cl)cl.stop();if(cr)cr.stop();
    if(!cur||!anim||RM.matches){cur={l:t.l,r:t.r};draw();return true}
    const right=t.l>=cur.l,lead=SNAP,lag={type:'spring',stiffness:300,damping:27};
    cl=animate(cur.l,t.l,{...(right?lag:lead),onUpdate:v=>{cur.l=v;draw()}});
    cr=animate(cur.r,t.r,{...(right?lead:lag),onUpdate:v=>{cur.r=v;draw()}});
    return true;
  };
  let tries=0;const first=()=>{if(!place(!!cur)&&tries++<30)requestAnimationFrame(first)};first();
  let raf=0;new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>place(true))}).observe(c,{attributes:true,subtree:true,attributeFilter:['class']});
  addEventListener('resize',()=>place(false));
}

/* soft reveal: whatever a sheet or page has just drawn rises a few pixels, one after another */
const REV='.pb>.ev,.dh,#ins .insc,#ins .inshero,#ins .inst2,#fr .frr,#nt .ntc,#mp .pcard,#fr .grp,.gsetup>*';
const seen=new WeakSet();
function reveal(root){
  const els=[...root.querySelectorAll(REV)].filter(e=>!seen.has(e)).slice(0,10);
  els.forEach(e=>seen.add(e));if(!els.length||RM.matches)return;
  els.forEach(e=>{e.style.opacity=0});
  animate(els,{opacity:[0,1],y:[10,0]},{...SOFT,delay:stagger(.035)}).finished.then(()=>els.forEach(e=>{e.style.opacity='';e.style.transform=''})).catch(()=>{});
}
const scan=()=>{document.querySelectorAll('.seg,.insseg,.mseg,.modes').forEach(pill);['#pc','#ins','#fr','#mp'].forEach(q=>{const r=$(q);if(r)reveal(r)})};
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
scan();

/* depth: the home screen steps back a few pixels while anything is open on top, and the new layer rises in */
const home=$('#home'),tops=['#sh','#ov','#mp','#fr','#ins','#nt','#chat'].map($).filter(Boolean);
let deep=false,dc=null;
const depth=()=>{
  const d=tops.some(e=>e.classList.contains('on'));if(d===deep||!home)return;deep=d;
  if(dc)dc.stop();const side=['#fr','#ins','#mp'].some(q=>$(q)&&$(q).classList.contains('on'));dc=animate(home,{scale:d?.965:1,opacity:d?.9:1,x:d&&side?-16:0},RM.matches?{duration:0}:SOFT);
  if(!d)dc.finished.then(()=>{if(!deep){home.style.transform='';home.style.opacity=''}}).catch(()=>{});
};
const seenOn=new Map();
tops.forEach(e=>new MutationObserver(()=>{
  const on=e.classList.contains('on'),was=seenOn.get(e)||false;seenOn.set(e,on);depth();
  if(on&&!was&&!RM.matches&&e.id!=='sh'){const side=['fr','ins','mp'].includes(e.id);
    animate(e,side?{opacity:[0,1],x:[38,0],scale:[.97,1]}:{opacity:[0,1],y:[22,0]},SOFT).finished.then(()=>{e.style.transform='';e.style.opacity='';e.style.scale=''}).catch(()=>{})}
  if(!on&&e.id==='sh')document.querySelectorAll('#pc *').forEach(x=>seen.delete(x));
}).observe(e,{attributes:true,attributeFilter:['class']}));
if(home)home.style.transformOrigin='50% 35%';

/* search bar: swells a touch when it is the thing you are typing in */
document.addEventListener('focusin',e=>{const b=e.target.closest&&e.target.closest('.bar');if(b&&!RM.matches)animate(b,{scale:1.015},SOFT)});
document.addEventListener('focusout',e=>{const b=e.target.closest&&e.target.closest('.bar');if(b&&!RM.matches)animate(b,{scale:1},SOFT).finished.then(()=>{b.style.transform=''}).catch(()=>{})});

/* shared element: the tapped day's circle grows into the thumbnail in its sheet */
let from=null;
const cal=$('#cal');
if(cal)cal.addEventListener('click',e=>{
  const c=e.target.closest('.cell[data-d]');from=null;if(!c||RM.matches)return;
  const o=c.querySelector('.orb');if(!o)return;const r=o.getBoundingClientRect();from={l:r.left,t:r.top,w:r.width,h:r.height};
  requestAnimationFrame(()=>requestAnimationFrame(fly));
},true);
function fly(){
  const f=from;from=null;if(!f)return;
  const th=$('#pc .stk .th');if(!th)return;
  const bg=getComputedStyle(th).backgroundImage;if(!bg||bg==='none')return;
  const el=document.createElement('div');el.className='mfly';el.style.backgroundImage=bg;document.body.appendChild(el);
  th.style.opacity='0';
  const end=()=>{th.style.opacity='';el.remove()};
  /* the target is re-measured every frame, because the sheet is still sliding up while the photo travels */
  animate(0,1,{type:'spring',stiffness:230,damping:27,restDelta:.002,onUpdate:k=>{
    const g=th.getBoundingClientRect();if(!g.width)return;
    el.style.left=f.l+(g.left-f.l)*k+'px';el.style.top=f.t+(g.top-f.t)*k+'px';
    el.style.width=f.w+(g.width-f.w)*k+'px';el.style.height=f.h+(g.height-f.h)*k+'px';
    el.style.borderRadius=Math.max(12,f.w/2+(12-f.w/2)*Math.min(1,k))+'px';
  }}).finished.then(end,end);
}

/* shape-shifting save: squeeze to a circle, a tick springs in, then carry on */
window.keepMorph=(btn,done)=>{
  if(!btn||RM.matches){done();return}
  const w=btn.offsetWidth;btn.style.width=w+'px';btn.disabled=true;buzz(12);
  btn.classList.add('ok');const k=document.createElement('i');k.className='mtk';btn.appendChild(k);
  animate(btn,{width:[w,btn.offsetHeight]},SOFT);
  animate(k,{scale:[0,1]},{...BACK,delay:.12});
  setTimeout(done,560);
};
})();
