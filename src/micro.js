/* Micro-interactions that save a tap or tell you what just happened. Decoration only: if one fails, the app still works. */
(()=>{
const M=window.Motion;if(!M)return;
const {animate}=M,RM=matchMedia('(prefers-reduced-motion:reduce)'),$=q=>document.querySelector(q);
const buzz=ms=>{if(!RM.matches&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
const POP={type:'spring',stiffness:520,damping:24},SOFT={type:'spring',stiffness:340,damping:26};
const cal=$('#cal');

/* 2. hold a day to peek at it without opening it; let go to close, slide up to open */
let pk=null;
const killPeek=()=>{if(!pk)return;const e=pk.el;pk=null;animate(e,{opacity:0,scale:.92},{duration:.15}).finished.then(()=>e.remove(),()=>e.remove())};
if(cal){
  let t=0,sx=0,sy=0,cell=null,swallow=false;
  cal.addEventListener('pointerdown',e=>{
    const c=e.target.closest('.cell[data-d]');if(!c||c.classList.contains('e'))return;cell=c;sx=e.clientX;sy=e.clientY;swallow=false;
    clearTimeout(t);t=setTimeout(()=>{
      const L=(byDay[c.dataset.d]||[]),m=L.find(x=>(x.type==='photo'||x.type==='video')&&src(x));if(!L.length)return;
      const [y,mo,d]=c.dataset.d.split('-').map(Number),r=c.getBoundingClientRect(),txt=(L.find(x=>x.text)||{}).text||'';
      const el=document.createElement('div');el.className='mpk';
      el.innerHTML=`${m?`<i style="background-image:url(${src(m)})"></i>`:''}<div><b>${esc(longDay(new Date(y,mo-1,d)))}</b><small>${esc(txt||L.length+(L.length===1?' instant':' instants'))}</small></div>`;
      document.body.appendChild(el);
      const h=el.offsetHeight,left=Math.max(10,Math.min(innerWidth-220,r.left+r.width/2-105)),top=Math.max(10,r.top-h-12);
      el.style.left=left+'px';el.style.top=top+'px';buzz(12);swallow=true;pk={el,k:c.dataset.d};
      if(!RM.matches)animate(el,{opacity:[0,1],scale:[.7,1],y:[16,0]},POP);
    },420);
  },{passive:true});
  const end=e=>{clearTimeout(t);if(pk){const k=pk.k,up=sy-e.clientY>70;killPeek();if(up&&e.type==='pointerup')setTimeout(()=>openDay(k),60)}};
  addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);
  cal.addEventListener('pointermove',e=>{if(!pk&&Math.hypot(e.clientX-sx,e.clientY-sy)>10)clearTimeout(t)},{passive:true});
  cal.addEventListener('contextmenu',e=>{if(e.target.closest('.cell'))e.preventDefault()});
  cal.addEventListener('click',e=>{if(swallow){swallow=false;e.stopImmediatePropagation();e.preventDefault()}},true);
}

/* 3. hold + for a quick-add menu: slide to Photo, Video, Voice or Note and let go */
const ab=$('#addBtn');
if(ab){
  let t=0,menu=null,sw=false,pick=null;
  const items=()=>MODES.filter(m=>m[0]!=='more');
  const stop=()=>{clearTimeout(t);if(!menu)return;const m=menu;menu=null;animate(m,{opacity:0},{duration:.12}).finished.then(()=>m.remove(),()=>m.remove())};
  ab.addEventListener('pointerdown',e=>{
    sw=false;pick=null;clearTimeout(t);
    t=setTimeout(()=>{
      const r=ab.getBoundingClientRect();menu=document.createElement('div');menu.className='mqa';
      menu.innerHTML=items().reverse().map(m=>`<span data-m="${m[0]}">${ic[m[2]]||''}${m[1]}</span>`).join('');
      document.body.appendChild(menu);menu.style.left=(r.left+r.width/2-60)+'px';menu.style.bottom=(innerHeight-r.top+12)+'px';
      sw=true;buzz(14);try{ab.setPointerCapture(e.pointerId)}catch(_){}
      if(!RM.matches)animate(menu.children,{opacity:[0,1],y:[18,0],scale:[.8,1]},{...POP,delay:M.stagger?M.stagger(.04):0});
    },380);
  });
  ab.addEventListener('pointermove',e=>{
    if(!menu)return;const s=[...menu.children].find(c=>{const r=c.getBoundingClientRect();return e.clientX>=r.left-14&&e.clientX<=r.right+14&&e.clientY>=r.top-4&&e.clientY<=r.bottom+4});
    const m=s?s.dataset.m:null;if(m!==pick){pick=m;[...menu.children].forEach(c=>c.classList.toggle('on',c.dataset.m===m));if(m)buzz(6)}
  });
  const up=()=>{clearTimeout(t);if(!menu)return;const m=pick;stop();if(m){openAdd();setTimeout(()=>setMode(m),60)}};
  ab.addEventListener('pointerup',up);ab.addEventListener('pointercancel',()=>{clearTimeout(t);stop()});
  ab.addEventListener('click',e=>{if(sw){sw=false;e.stopImmediatePropagation();e.preventDefault()}},true);
  ab.addEventListener('contextmenu',e=>e.preventDefault());
}

/* 4. scrolled far from now? a chip floats up to take you back to today */
if(cal&&$('#home')){
  const chip=document.createElement('button');chip.className='mtd';chip.innerHTML='Today ↓';chip.setAttribute('aria-label','Back to today');$('#home').appendChild(chip);
  let on=false;
  const upd=()=>{const far=cal.scrollHeight-cal.scrollTop-cal.clientHeight>900&&!cal.classList.contains('off');if(far===on)return;on=far;chip.classList.toggle('on',far);
    if(RM.matches)chip.style.opacity=far?1:0;else animate(chip,{opacity:far?1:0,y:far?[14,0]:[0,14]},SOFT)};
  cal.addEventListener('scroll',upd,{passive:true});
  chip.onclick=()=>{buzz(8);cal.scrollTo({top:cal.scrollHeight,behavior:RM.matches?'auto':'smooth'})};
}

/* 5. swipe sideways on the camera screen to change between photo, video, voice and note */
const ov=$('#ov');
if(ov){
  let x0=0,y0=0,go=false;
  ov.addEventListener('pointerdown',e=>{go=!e.target.closest('input,textarea,.vfb,.shutter,.modes,.mseg,.poses,select');x0=e.clientX;y0=e.clientY},{passive:true});
  ov.addEventListener('pointerup',e=>{
    if(!go||!ov.classList.contains('on'))return;go=false;const dx=e.clientX-x0,dy=e.clientY-y0;
    if(Math.abs(dx)<70||Math.abs(dy)>45||rec)return;
    const order=MODES.map(m=>m[0]),i=order.indexOf(mode),n=order[i+(dx<0?1:-1)];if(n){buzz(8);setMode(n)}
  },{passive:true});
}

/* 6. a capture flashes and settles into place; Keep pulses when it is ready and shakes when it is not */
if(ov){
  new MutationObserver(()=>{
    const s=$('#shot');if(s&&!s._w){s._w=1;new MutationObserver(()=>{
      if(s.hidden||RM.matches)return;const vf=$('#vf');if(!vf)return;
      const f=document.createElement('i');f.className='mfl';vf.appendChild(f);
      animate(f,{opacity:[.85,0]},{duration:.32,ease:'easeOut'}).finished.then(()=>f.remove(),()=>f.remove());
      animate(s,{scale:[1.06,1],filter:['blur(6px)','blur(0px)']},{...SOFT,filter:{duration:.3}}).finished.then(()=>{s.style.transform='';s.style.filter=''},()=>{});
    }).observe(s,{attributes:true,attributeFilter:['hidden','src']})}
    const k=$('#keep');if(k&&!k._w){k._w=1;let was=k.disabled;new MutationObserver(()=>{if(was&&!k.disabled&&!RM.matches){buzz(8);animate(k,{scale:[1,1.14,1]},{duration:.4})}was=k.disabled}).observe(k,{attributes:true,attributeFilter:['disabled']})}
  }).observe(ov,{childList:true});
  ov.addEventListener('pointerdown',e=>{
    const k=$('#keep');if(!k||!k.disabled)return;const r=k.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
    const hint={photo:'Take a photo first',video:'Record something first',voice:'Hold the orb to record',text:'Write something first',more:'Fill it in first'}[mode]||'Not quite yet';
    buzz([8,30,8]);toast(hint);if(!RM.matches)animate(k,{x:[0,-7,7,-5,5,0]},{duration:.36}).finished.then(()=>{k.style.transform=''},()=>{});
  },true);
}

/* 7. the search bar suggests what to try */
const q=$('#q');
if(q){
  const S=['Ask your memories','Try a name or a place','Try a month, like June','Try a word from a caption'];let i=0;
  setInterval(()=>{
    if(document.activeElement===q||q.value||document.hidden||$('#chat').classList.contains('on'))return;
    q.classList.add('ph0');setTimeout(()=>{i=(i+1)%S.length;q.placeholder=S[i];q.classList.remove('ph0')},RM.matches?0:200);
  },4200);
}

/* 8. numbers on Insights count up */
const ins=$('#ins');
if(ins&&!RM.matches)new MutationObserver(()=>{
  const b=ins.querySelector('.inshero b');if(!b||b._c)return;b._c=1;
  const txt=b.textContent,n=parseInt(txt.replace(/\D/g,''),10);if(!isFinite(n)||n<2)return;
  animate(0,n,{duration:.9,ease:[.2,.85,.25,1],onUpdate:v=>{b.textContent=Math.round(v).toLocaleString()}}).finished.then(()=>{b.textContent=txt},()=>{b.textContent=txt});
}).observe(ins,{childList:true,subtree:true});
})();
