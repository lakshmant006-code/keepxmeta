/* ---------- page and photo motion: builds on motion.js, all decoration (if it fails the app still works) ---------- */
(()=>{
const M=window.Motion;if(!M)return;
const {animate}=M,RM=matchMedia('(prefers-reduced-motion:reduce)'),$=q=>document.querySelector(q);
const EASE='cubic-bezier(.32,.72,0,1)',POP='cubic-bezier(.34,1.56,.64,1)';
const SOFT={type:'spring',stiffness:340,damping:26};

/* 1. pages leave the way they arrived: the layer slides or sinks away first, then really closes.
   Opening again while one is leaving cancels the close, so quick taps never fight each other. */
const PAGES=[['frClose','frOpen','#fr','x'],['insClose','insOpen','#ins','x'],['closeMap','openMap','#mp','x'],['closeChat','openChat','#chat','y'],['closeAdd','openAdd','#ov','y'],['closeAR','openAR','#ar','y']];
if(!RM.matches)PAGES.forEach(([c,o,sel,axis])=>{
  const oc=window[c],oo=window[o];if(typeof oc!=='function')return;
  window[c]=function(){
    const el=$(sel),args=arguments,self=this;
    if(!el||!el.classList.contains('on')||el._leaving)return oc.apply(self,args);
    el._leaving=true;el._cancel=false;
    const to=axis==='x'?{opacity:0,x:34,scale:.97}:{opacity:0,y:28,scale:.985};
    const done=()=>{el._leaving=false;el.style.opacity='';el.style.transform='';el.style.scale='';if(!el._cancel)oc.apply(self,args)};
    animate(el,to,{...SOFT,stiffness:420,damping:34}).finished.then(done,done);
  };
  if(typeof oo==='function')window[o]=function(){const el=$(sel);if(el&&el._leaving){el._cancel=true;el._leaving=false;el.style.opacity='';el.style.transform='';el.style.scale=''}return oo.apply(this,arguments)};
});

/* 2. photos on the calendar pop in, a few at a time, as they scroll into view */
const cal=$('#cal');
if(cal&&'IntersectionObserver' in window&&!RM.matches){
  const show=(os)=>os.forEach((o,k)=>{if(o.dataset.pop==='1')return;o.dataset.pop='1';
    const a=o.animate([{opacity:0,scale:.45},{opacity:1,scale:1}],{duration:620,easing:POP,delay:Math.min(k,14)*26,fill:'backwards'});
    o.style.opacity='';a.onfinish=()=>{o.style.opacity=''}});
  const io=new IntersectionObserver(es=>{const vis=es.filter(e=>e.isIntersecting).map(e=>e.target);vis.forEach(o=>io.unobserve(o));show(vis)},{root:cal,threshold:.15});
  const prep=()=>cal.querySelectorAll('.cell .orb:not([data-pop])').forEach(o=>{o.dataset.pop='0';o.style.opacity='0';io.observe(o)});
  new MutationObserver(prep).observe(cal,{childList:true,subtree:true});prep();
  setTimeout(()=>show([...cal.querySelectorAll('.orb[data-pop="0"]')]),1600);
}

/* 3. a stack of photos fans out from under the first one */
const pc=$('#pc');
if(pc&&!RM.matches)new MutationObserver(()=>pc.querySelectorAll('.stk:not([data-fan])').forEach(s=>{
  s.dataset.fan='1';[...s.querySelectorAll('.th')].forEach((t,i)=>{if(!i)return;
    t.animate([{translate:`${-34*i}px 0`,scale:.82,opacity:0},{translate:'0 0',scale:1,opacity:1}],{duration:720,easing:EASE,delay:280+i*85,fill:'backwards'})})
})).observe(pc,{childList:true,subtree:true});

/* 4. opening a photo: it grows out of the thumbnail you tapped */
let tapped=null;document.addEventListener('click',e=>{tapped=e.target.closest&&e.target.closest('[data-lb]')},true);
const oLb=window.openLb;
if(typeof oLb==='function'&&!RM.matches)window.openLb=function(){
  const th=tapped&&(tapped.querySelector('.th')||tapped),r0=th&&th.getBoundingClientRect(),res=oLb.apply(this,arguments);
  if(r0&&r0.width)requestAnimationFrame(()=>{
    const img=$('#lb .lbs img');if(!img)return;const r1=img.getBoundingClientRect();if(!r1.width||!r1.height)return;
    const dx=r0.left+r0.width/2-(r1.left+r1.width/2),dy=r0.top+r0.height/2-(r1.top+r1.height/2);
    img.animate([{transform:`translate(${dx}px,${dy}px) scale(${r0.width/r1.width},${r0.height/r1.height})`,borderRadius:'14px'},{transform:'none',borderRadius:'0'}],{duration:600,easing:EASE});
  });
  return res;
};

/* 5. Insights: bars grow up from the baseline, one after another */
const ins=$('#ins');
if(ins&&!RM.matches)new MutationObserver(()=>ins.querySelectorAll('.icl:not([data-g])').forEach((c,i)=>{c.dataset.g='1';const b=c.querySelector('i');if(b)b.animate([{scaleY:0,opacity:.2},{scaleY:1,opacity:1}],{duration:700,easing:POP,delay:140+Math.min(i,40)*14,fill:'backwards'})})).observe(ins,{childList:true,subtree:true});
})();
