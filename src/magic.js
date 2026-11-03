/* ---------- Magic: touching a moment in time ---------- */
/* Eight small interactions that come from the thing being touched, not from the buttons. Each one is optional decoration: if it fails, the app still works.
   Springs are quick and low on bounce, blur and layers are used on one focused photo only, and everything honours Reduce Motion and can be interrupted. */
(()=>{
const M=window.Motion;if(!M)return;
const {animate}=M,RM=matchMedia('(prefers-reduced-motion:reduce)'),$=q=>document.querySelector(q);
const buzz=ms=>{if(!RM.matches&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
const SPR={type:'spring',stiffness:350,damping:27};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* a clone of something flies from one rectangle to another, measured every frame */
function fly(css,from,to,o){
  o=o||{};const el=document.createElement('div');el.className='mfly mgf';Object.assign(el.style,css);document.body.appendChild(el);
  const t=typeof to==='function'?to:()=>to;
  return animate(0,1,{type:'spring',stiffness:o.k||300,damping:o.d||28,restDelta:.002,onUpdate:k=>{
    const g=t();if(!g||!g.width)return;
    el.style.left=from.left+(g.left-from.left)*k+'px';el.style.top=from.top+(g.top-from.top)*k+'px';
    el.style.width=from.width+(g.width-from.width)*k+'px';el.style.height=from.height+(g.height-from.height)*k+'px';
    const r0=o.r0==null?12:o.r0,r1=o.r1==null?12:o.r1;el.style.borderRadius=(r0+(r1-r0)*k)+'px';if(o.fade)el.style.opacity=1-clamp((k-.7)/.3,0,1)*(o.fade);
  }}).finished.then(()=>{el.remove()},()=>el.remove());
}

/* 01 + 02. A photo in the viewer: older ones start soft and come into focus as you drag; swiping tilts the one you leave and pulls the next one in */
let fo=null,down=null;
const lbEl=()=>$('#lb');
const focusSet=(el,p)=>{el.style.filter=p>=1?'':`blur(${((1-p)*16).toFixed(2)}px) saturate(${(.72+.28*p).toFixed(2)})`};
function hint(on){const lb=lbEl();let h=lb.querySelector('.fohint');if(on&&!h){h=document.createElement('div');h.className='fohint';h.textContent='Drag to remember';lb.appendChild(h);animate(h,{opacity:[0,1],y:[8,0]},{duration:.4})}else if(!on&&h)animate(h,{opacity:0},{duration:.2}).finished.then(()=>h.remove(),()=>h.remove())}
function focusTo(t,ms){
  if(!fo)return;const f=fo;clearTimeout(f.t);if(f.a)f.a.stop();
  f.a=animate(f.p,t,{duration:ms/1000,ease:[.2,.8,.3,1],onUpdate:v=>{f.p=v;focusSet(f.el,v)}});
  f.a.finished.then(()=>{if(fo===f&&f.p>=.999){f.p=1;focusSet(f.el,1);hint(false);buzz(8)}},()=>{});
}
function arm(){
  const lb=lbEl();if(!lb||!lb.classList.contains('on')){if(fo){fo=null}return}
  const sl=lb.querySelectorAll('.lbs')[lbI],im=sl&&sl.querySelector('img');if(!im||(fo&&fo.el===im))return;
  if(fo){clearTimeout(fo.t);if(fo.a)fo.a.stop();fo.el.style.filter=''}
  const m=lbReg[sl.dataset.mid];fo=null;
  if(!m||RM.matches||!(m.ts<+TODAY-30*864e5)){im.style.filter='';hint(false);return}
  fo={el:im,p:0,base:0,travel:0,m};focusSet(im,0);hint(true);fo.t=setTimeout(()=>focusTo(1,1400),3800);
}
setInterval(arm,120);
document.addEventListener('pointerdown',e=>{const lb=lbEl();if(!lb||!lb.classList.contains('on')||!lb.contains(e.target))return;down={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,id:e.pointerId,axis:null};if(fo){fo.base=fo.p;fo.travel=0;clearTimeout(fo.t);if(fo.a)fo.a.stop()}},true);
document.addEventListener('pointermove',e=>{
  if(!down||e.pointerId!==down.id)return;
  const dx=e.clientX-down.x,dy=e.clientY-down.y;
  if(fo){fo.travel+=Math.hypot(e.clientX-down.lx,e.clientY-down.ly);fo.p=clamp(fo.base+fo.travel/240,0,1);focusSet(fo.el,fo.p);if(fo.p>=1&&!fo.done){fo.done=1;hint(false);buzz(8)}}
  down.lx=e.clientX;down.ly=e.clientY;
  if(RM.matches)return;
  if(!down.axis&&Math.hypot(dx,dy)>8)down.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
  if(down.axis==='x'){
    const sl=[...lbEl().querySelectorAll('.lbs')],cur=sl[lbI],im=cur&&cur.querySelector('img'),W=innerWidth;
    if(im){im.style.transformOrigin='50% 100%';im.style.rotate=clamp(dx/W*7,-3,3).toFixed(2)+'deg'}
    const nx=sl[lbI+(dx<0?1:-1)],ni=nx&&nx.querySelector('img');if(ni)ni.style.scale=(.94+.06*clamp(Math.abs(dx)/(W*.5),0,1)).toFixed(3);
  }
},true);
const release=e=>{
  if(!down||e.pointerId!==down.id)return;down=null;
  document.querySelectorAll('#lb .lbs img').forEach(im=>{if(im.style.rotate||im.style.scale)animate(im,{rotate:0,scale:1},SPR).finished.then(()=>{im.style.rotate='';im.style.scale='';im.style.transform=''},()=>{})});
  if(fo){if(fo.p>=.45)focusTo(1,220);else focusTo(0,260)}
};
document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);

/* 05. A day lifts out of the calendar into its memory, and goes back to the exact spot when closed */
{
  const cal=$('#cal'),sh=$('#sh');let last=null;
  if(cal)cal.addEventListener('click',e=>{const c=e.target.closest('.cell[data-d]');last=c?c.dataset.d:null},true);
  if(sh)new MutationObserver(()=>{
    if(sh.classList.contains('on')||!last||RM.matches||typeof curDay==='undefined'||curDay!==last)return;
    const k=last;last=null;
    const th=$('#pc .stk .th'),orb=cal&&cal.querySelector(`.cell[data-d="${k}"] .orb`);if(!th||!orb)return;
    const a=th.getBoundingClientRect(),b=orb.getBoundingClientRect(),cr=cal.getBoundingClientRect();
    if(!a.width||b.bottom<cr.top||b.top>cr.bottom)return;
    const bg=getComputedStyle(th).backgroundImage;if(!bg||bg==='none')return;
    th.style.opacity='0';
    fly({backgroundImage:bg,zIndex:60},a,()=>orb.getBoundingClientRect(),{k:330,d:30,r0:12,r1:b.width/2,fade:1}).then(()=>{th.style.opacity=''});
  }).observe(sh,{attributes:true,attributeFilter:['class']});
}

/* 03. A prompt unfolds into the writing area and stays at the top as the first line */
window.TXP='';
function unfold(prompt,rect){
  const go=()=>{
    setMode('text');const tx=$('#tx');if(!tx)return;window.TXP=prompt||'';
    let h=$('#txp');if(!h){h=document.createElement('div');h.id='txp';h.className='txp';tx.parentNode.insertBefore(h,tx)}
    h.textContent=prompt||'';tx.placeholder='Start here…';
    if(rect&&!RM.matches&&prompt){
      h.style.opacity='0';const to=h.getBoundingClientRect();
      fly({background:'linear-gradient(160deg,#EEF3FF,#F7ECFF)',zIndex:90,font:'600 19px/1.3 -apple-system,system-ui,sans-serif',color:'#1d2340',padding:'14px 16px',boxSizing:'border-box',overflow:'hidden'},rect,to,{k:300,d:28,r0:22,r1:16}).then(()=>{h.style.opacity='';tx.focus({preventScroll:true})});
      const c=document.querySelector('.mgf:last-of-type');if(c)c.textContent=prompt;
    }else{h.style.opacity='';tx.focus({preventScroll:true})}
    validate();
  };
  if(!$('#ov').classList.contains('on')){openAdd();setTimeout(go,200)}else go();
}
window.jrKeepThought=unfold;
new MutationObserver(()=>{window.TXP=window.TXP||''}).observe(document.body,{childList:true});

/* 04. Hold to record: a small halo breathes with your voice, then contracts to a dot */
{
  let halo=null,sm=0,raf=0;
  const loop=()=>{
    if(!halo||!(typeof rec!=='undefined'&&rec&&rec.kind==='voice')){stopHalo();return}
    let amp=0;try{if(aud&&aud.an){const b=new Uint8Array(aud.an.fftSize);aud.an.getByteTimeDomainData(b);let s=0;for(const v of b){const x=(v-128)/128;s+=x*x}amp=Math.sqrt(s/b.length)}}catch(e){}
    const t=clamp(amp*3.2,0,1);sm+=(t-sm)*.22;halo.style.transform=`scale(${(1+sm*.3).toFixed(3)})`;halo.style.opacity=(.35+sm*.4).toFixed(2);
    raf=requestAnimationFrame(loop);
  };
  function startHalo(){
    if(halo||RM.matches)return;const o=$('#bigrec');if(!o)return;const r=o.getBoundingClientRect();
    halo=document.createElement('i');halo.className='bhalo';Object.assign(halo.style,{left:r.left-14+'px',top:r.top-14+'px',width:r.width+28+'px',height:r.height+28+'px'});document.body.appendChild(halo);
    animate(halo,{scale:[.6,1],opacity:[0,.35]},{duration:.25});sm=0;raf=requestAnimationFrame(loop);
  }
  function stopHalo(){cancelAnimationFrame(raf);const h=halo;halo=null;if(!h)return;animate(h,{scale:.4,opacity:0},{duration:.3,ease:'easeIn'}).finished.then(()=>h.remove(),()=>h.remove())}
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#bigrec'))setTimeout(startHalo,80)},true);
}

/* 07. Saving: the entry shrinks into the Save button and lands as a tiny tile with a tick */
{
  const km=window.keepMorph;
  window.keepMorph=(btn,done)=>{
    if(!km||!btn||RM.matches)return km?km(btn,done):done();
    const shot=$('#shot'),pane=$('.pane.on'),br=btn.getBoundingClientRect();
    let from,css;
    if(shot&&!shot.hidden&&shot.getBoundingClientRect().width){from=shot.getBoundingClientRect();css={backgroundImage:`url(${shot.src})`,backgroundSize:'cover',backgroundPosition:'center'}}
    else if(pane){const r=(pane.querySelector('textarea,.jscr,.vc')||pane).getBoundingClientRect();from=new DOMRect(r.left+r.width*.1,r.top+r.height*.15,r.width*.8,Math.min(r.height*.5,220));css={background:'linear-gradient(160deg,#EEF3FF,#F7ECFF)'}}
    if(!from)return km(btn,done);
    km(btn,done);
    const to=()=>{const b=btn.getBoundingClientRect();return new DOMRect(b.left+b.width/2-13,b.top+b.height/2-13,26,26)};
    fly(Object.assign({zIndex:95,boxShadow:'0 4px 14px rgba(0,0,0,.25)'},css),from,to,{k:420,d:34,r0:18,r1:7,fade:1}).then(()=>{
      const t=document.createElement('i');t.className='mtile';const b=btn.getBoundingClientRect();Object.assign(t.style,{left:b.left+b.width/2-13+'px',top:b.top+b.height/2-13+'px'});t.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';document.body.appendChild(t);buzz(10);
      animate(t,{scale:[.6,1.1,1],opacity:[0,1]},{duration:.22}).finished.then(()=>animate(t,{opacity:0,y:-6},{duration:.25,delay:.18}).finished).then(()=>t.remove(),()=>t.remove());
    });
  };
}

/* 06. The illustrations lean with the phone: nearer layers move a few pixels more than the far ones */
{
  let tx=0,ty=0,gx=0,gy=0,run=false,asked=false;
  const root=document.documentElement,MAXP=6;
  const tick=()=>{tx+=(gx-tx)*.12;ty+=(gy-ty)*.12;root.style.setProperty('--tx',tx.toFixed(2)+'px');root.style.setProperty('--ty',ty.toFixed(2)+'px');if(Math.abs(gx-tx)>.02||Math.abs(gy-ty)>.02)requestAnimationFrame(tick);else run=false};
  const aim=(x,y)=>{gx=clamp(x,-1,1)*MAXP;gy=clamp(y,-1,1)*MAXP*.7;if(!run){run=true;requestAnimationFrame(tick)}};
  const on=e=>{if(RM.matches||e.gamma==null)return;aim(e.gamma/25,(e.beta-45)/25)};
  const listen=()=>addEventListener('deviceorientation',on);
  if(!RM.matches){
    if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
      /* iPhone asks first: only when you touch a banner, once */
      document.addEventListener('pointerdown',e=>{if(asked||!e.target.closest('.hban,.jban'))return;asked=true;DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')listen()}).catch(()=>{})},true);
    }else if(typeof DeviceOrientationEvent!=='undefined')listen();
    /* with a mouse, the pointer stands in for tilt */
    if(matchMedia('(pointer:fine)').matches)document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')aim((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2)},{passive:true});
  }
  window.__tilt=aim;
}

/* 08. Scrub through time: a handle on the calendar's edge; slower fingers move more precisely, and each month gives a tick */
{
  const cal=$('#cal'),home=$('#home');if(!cal||!home)return;
  const rail=document.createElement('div');rail.className='scrub';rail.innerHTML='<i class="scrh" aria-label="Scrub through time" role="slider"></i><div class="scrp"><span class="scri"></span><b></b></div>';home.appendChild(rail);
  const h=rail.querySelector('.scrh'),pv=rail.querySelector('.scrp'),pi=rail.querySelector('.scri'),pb=rail.querySelector('b');
  let hide=0,drag=null,lastMonth='';
  const track=()=>{const r=cal.getBoundingClientRect();return{top:r.top+8,h:r.height-190}};
  const place=()=>{const t=track(),max=cal.scrollHeight-cal.clientHeight,f=max>0?cal.scrollTop/max:0;h.style.top=(t.top+f*t.h-home.getBoundingClientRect().top)+'px';pv.style.top=(t.top+f*t.h-home.getBoundingClientRect().top-6)+'px'};
  const month=()=>{const secs=[...cal.querySelectorAll('section')];const y=cal.scrollTop+60;let s=secs[0];secs.forEach(x=>{if(x.offsetTop<=y)s=x});return s?s.id:''};
  const dayAt=()=>{const cr=cal.getBoundingClientRect(),yy=cr.top+cr.height*.36;let best=null,bd=1e9;cal.querySelectorAll('.cell[data-d]:not(.e)').forEach(c=>{const r=c.getBoundingClientRect(),d=Math.abs(r.top+r.height/2-yy);if(d<bd&&r.bottom>cr.top&&r.top<cr.bottom){bd=d;best=c}});return best};
  const preview=()=>{const c=dayAt();if(!c)return;const k=c.dataset.d,L=byDay[k]||[],m=L.find(x=>(x.type==='photo'||x.type==='video')&&src(x));const [y,mo,d]=k.split('-').map(Number);
    pi.style.backgroundImage=m?`url(${src(m)})`:'';pb.textContent=MS[mo-1]+' '+d+', '+y};
  const show=()=>{rail.classList.add('on');clearTimeout(hide);hide=setTimeout(()=>{if(!drag)rail.classList.remove('on','drag')},1300)};
  cal.addEventListener('scroll',()=>{if(RM.matches&&!drag)return;place();show()},{passive:true});
  addEventListener('resize',place);setTimeout(place,600);
  h.style.touchAction='none';
  h.addEventListener('pointerdown',e=>{e.preventDefault();try{h.setPointerCapture(e.pointerId)}catch(_){}drag={y:e.clientY,t:performance.now(),v:0,top:cal.scrollTop};lastMonth=month();rail.classList.add('on','drag');preview();buzz(5)});
  h.addEventListener('pointermove',e=>{
    if(!drag)return;const now=performance.now(),dy=e.clientY-drag.y,dt=Math.max(8,now-drag.t),inst=Math.abs(dy)/dt;
    drag.v+=(inst-drag.v)*.3;                       /* damped speed */
    const T=track(),max=cal.scrollHeight-cal.clientHeight,gain=clamp(.15+drag.v*2.2,.15,1.6); /* slow finger = fine control */
    cal.scrollTop=clamp(cal.scrollTop+dy*(max/T.h)*gain,0,max);
    drag.y=e.clientY;drag.t=now;place();preview();
    const mo=month();if(mo!==lastMonth){lastMonth=mo;buzz(7)}
  });
  const end=e=>{if(!drag)return;drag=null;rail.classList.remove('drag');show()};
  h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end);
}
})();
