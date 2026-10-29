/* ---------- first-run intro: five things to do with your hands, then the photo import ---------- */
const INTRO='kept.intro';
const introDone=()=>{try{return localStorage.getItem(INTRO)==='1'}catch(e){return false}};
const introReduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const introBuzz=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
/* a burst of confetti from a point, drawn inside #intro */
function introBoom(x,y){
  const host=$('#intro');if(!host||introReduced())return;
  const r=host.getBoundingClientRect(),cols=['#0866FF','#4F9BFF','#9CC4FF','#7FD6FF','#FFB020','#FF5C8A'];
  for(let i=0;i<22;i++){
    const s=document.createElement('i'),a=Math.random()*Math.PI*2,d=70+Math.random()*100;
    s.className='cf';s.style.cssText=`left:${x-r.left}px;top:${y-r.top}px;background:${cols[i%cols.length]}`;host.appendChild(s);
    s.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+50}px) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:800+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>s.remove();
  }
}
const introCenter=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
const introTiles=[['img','#4F9BFF',-112,-96,.6,0],['mic','#FF5C8A',104,-104,.9,-1.2],['quote','#8E7CFF',-120,44,1.1,-2.1],['pin','#1F9D61',116,36,.7,-.6],['cube','#FFB020',-30,-134,.5,-3],['users','#0AA5C2',24,122,1,-1.7],['txt','#6B7280',-70,118,.8,-2.6]];
const INTRO_AT='kept.introat';
const introSteps=[
 {h:'Start with Instagram',p:'Link it and Keep fills in your name, photo and bio for you. You can skip this.',hint:'',
  art(){return`<div class="ig-tile">${ic.ig.replace('width="22" height="22"','width="64" height="64"')}</div><div class="ig-act" id="igAct"></div>`},
  run(root,done){
    invRefCard($('#igAct').parentNode);
    const act=$('#igAct'),linked=()=>{const h=root.querySelector('.ihint');h.textContent='Linked @'+meGet().ig+'. Nice.';h.classList.add('ok');act.innerHTML='';introBoom(...Object.values(introCenter($('.ig-tile'))));introBuzz(18);done(true,'Continue')};
    if(meGet().ig){linked();return}
    done(true,'Skip for now');
    const typed=()=>{act.innerHTML=`<div class="meat"><span>@</span><input id="igIn" placeholder="instagram username" autocapitalize="none" autocorrect="off"></div><button class="pill d" id="igSave" style="height:40px;padding:0 16px">Save</button>`;
      const sv=()=>{const v=igUser($('#igIn').value);if(!v){toast('Type your Instagram username');return}const o=meGet();o.ig=v;meSave(o);renderProf();linked()};
      $('#igSave').onclick=sv;$('#igIn').addEventListener('keydown',e=>{if(e.key==='Enter')sv()})};
    if(igSyncOn()){act.innerHTML=`<button class="pill d" id="igGo" style="width:100%;justify-content:center">${ic.ig} Continue with Instagram</button><button class="mel" id="igType">Type my handle instead</button><p class="meb" style="font-size:12px;color:var(--faint)">Works with Business and Creator accounts. Keep keeps no copy of your login.</p>`;
      $('#igGo').onclick=()=>{try{sessionStorage.setItem(INTRO_AT,'1')}catch(e){}igSyncStart()};$('#igType').onclick=typed}
    else{act.innerHTML=`<button class="pill d" id="igType" style="width:100%;justify-content:center">${ic.ig} Link my Instagram</button>`;$('#igType').onclick=typed}
  }},
 {h:'Keep it all',p:'Photos, voice, notes, quotes, people, places. Everything worth keeping, in one calendar.',hint:'',
  art(){return`<div class="w-wrap">${introTiles.map(t=>`<div class="w-t" style="left:${150+t[2]-31}px;top:${150+t[3]-31}px;background:${t[1]};--d:${t[4]*14};--dl:${t[5]}s">${ic[t[0]]||''}</div>`).join('')}<div class="w-logo">K</div></div>`},
  run(root,done){
    const host=$('#intro'),mv=e=>{const r=host.getBoundingClientRect();host.style.setProperty('--px',((e.clientX-r.left)/r.width-.5)*2);host.style.setProperty('--py',((e.clientY-r.top)/r.height-.5)*2)};
    host.addEventListener('pointermove',mv);root._off=()=>{host.removeEventListener('pointermove',mv);host.style.setProperty('--px',0);host.style.setProperty('--py',0)};
    const logo=$('#intro .w-logo');logo.addEventListener('pointerdown',()=>{const c=introCenter(logo);introBoom(c.x,c.y);introBuzz(12)});
    done(true)}},
 {h:'Keep your first memory',p:'Drag this photo onto a day. Or just tap it.',hint:'Drag it onto the calendar',
  art(){const cells=Array.from({length:28},(_,i)=>`<i data-i="${i}" class="${({2:'p',5:'q',9:'r',11:'p',14:'q',20:'r',23:'p'})[i]||''}"></i>`).join('');
   return`<div class="k-cal"><b>October<span id="kN">7 kept</span></b><div class="k-grid">${cells}</div></div><div class="k-ph" id="kPh" aria-label="Photo to keep"></div>`},
  run(root,done){
    const card=$('#kPh'),cells=[...root.querySelectorAll('.k-grid i')],tgtDefault=cells[17];
    let sx=0,sy=0,dx=0,dy=0,drag=false,moved=false,over=null;
    const hot=t=>{if(over===t)return;if(over)over.classList.remove('hot');over=t;if(t)t.classList.add('hot')};
    const under=(x,y)=>{card.style.pointerEvents='none';const el=document.elementFromPoint(x,y);card.style.pointerEvents='';const c=el&&el.closest('.k-grid i');return c&&!c.classList.contains('got')?c:null};
    const land=t=>{
      const a=card.getBoundingClientRect(),b=t.getBoundingClientRect(),ddx=b.left+b.width/2-(a.left+a.width/2),ddy=b.top+b.height/2-(a.top+a.height/2),k=b.width/a.width;
      card.classList.add('fly');card.classList.remove('lift');
      const an=card.animate([{transform:`translate(${dx}px,${dy}px) scale(1.08)`,opacity:1},{transform:`translate(${dx+ddx}px,${dy+ddy}px) scale(${k})`,opacity:.9}],{duration:introReduced()?1:380,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});
      an.onfinish=()=>{card.style.visibility='hidden';hot(null);t.classList.add('got');const c=introCenter(t);introBoom(c.x,c.y);introBuzz(18);$('#kN').textContent='8 kept';
        const h=root.querySelector('.ihint');h.textContent='Kept. It will be on this day forever.';h.classList.add('ok');done(true)};
    };
    card.addEventListener('pointerdown',e=>{card.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;drag=true;moved=false;card.classList.add('lift');card.style.transform='scale(1.08)'});
    card.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-sx;dy=e.clientY-sy;if(Math.hypot(dx,dy)>6)moved=true;card.style.transform=`translate(${dx}px,${dy}px) scale(1.08) rotate(${dx/18}deg)`;hot(under(e.clientX,e.clientY))});
    card.addEventListener('pointerup',e=>{if(!drag)return;drag=false;const t=(moved&&under(e.clientX,e.clientY))||tgtDefault;land(t)});
    card.addEventListener('pointercancel',()=>{drag=false;card.classList.remove('lift');card.style.transform='';dx=dy=0;hot(null)});
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();land(tgtDefault)}});card.tabIndex=0}},
 {h:'Ask for it later',p:'Ask in your own words. Keep shows the original, or tells you it found nothing.',hint:'Tap a question',
  art(){return`<div class="a-chat"><div class="a-log" id="aLog"></div><div class="a-chips" id="aCh"><button>That sunset</button><button>Where was I in June?</button><button>My passport number</button></div></div>`},
  run(root,done){
    const log=$('#aLog'),ch=$('#aCh'),ans={'That sunset':['Found it. Sat, Oct 18, 6:12 PM.',1],'Where was I in June?':['Cartel Coffee on Mill, June 14. You wrote "Actually good."',0],'My passport number':['Nothing matches. I only show what you kept.',0]};
    ch.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
      const q=b.textContent;b.disabled=true;[...ch.children].forEach(x=>x.disabled=true);introBuzz(8);
      log.insertAdjacentHTML('beforeend',`<div class="a-me">${esc(q)}</div><div class="a-ai" id="aTy"><span class="dt"><i></i><i></i><i></i></span></div>`);
      setTimeout(()=>{const t=$('#aTy');if(!t)return;t.removeAttribute('id');t.innerHTML=esc(ans[q][0])+(ans[q][1]?'<em></em>':'');
        [...ch.children].forEach(x=>{if(x!==b)x.disabled=false});
        const h=root.querySelector('.ihint');h.textContent=ans[q][1]?'Always the original memory, never a guess.':'Honest when nothing matches.';h.classList.add('ok');done(true)},introReduced()?50:1000)})}},
 {h:'Bring people back',p:'Tag who was there and their avatar stands where you stood.',hint:'Try a pose',
  art(){return`<div class="v-stage"><div class="v-name">Maya</div>
   <svg class="v-fig" id="vFig" data-pose="stand" viewBox="0 0 150 200" aria-label="Avatar of Maya">
    <ellipse cx="75" cy="192" rx="42" ry="6" fill="rgba(0,0,0,.14)"/>
    <g class="lg"><rect x="52" y="120" width="20" height="66" rx="10" fill="#3B4A6B"/><rect x="78" y="120" width="20" height="66" rx="10" fill="#3B4A6B"/></g>
    <g class="bd"><rect x="44" y="64" width="62" height="70" rx="26" fill="#0866FF"/></g>
    <g class="arL"><rect x="28" y="68" width="16" height="58" rx="8" fill="#0866FF"/></g>
    <g class="arR"><rect x="106" y="68" width="16" height="58" rx="8" fill="#0866FF"/></g>
    <g class="hd"><circle cx="75" cy="42" r="26" fill="#F2C7A5"/><path d="M49 40c2-20 18-26 28-24 12 2 24 10 24 28-6-10-16-14-26-14s-20 2-26 10z" fill="#3A2A22"/><circle cx="67" cy="46" r="2.6" fill="#222"/><circle cx="83" cy="46" r="2.6" fill="#222"/><path d="M68 56q7 6 14 0" stroke="#222" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
   </svg>
   <div class="v-seg" id="vSeg"><button data-p="stand" class="on">Stand</button><button data-p="wave">Wave</button><button data-p="sit">Sit</button></div></div>`},
  run(root,done){
    const fig=$('#vFig'),seg=$('#vSeg');let used=new Set();
    seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
      [...seg.children].forEach(x=>x.classList.toggle('on',x===b));fig.dataset.pose=b.dataset.p;introBuzz(10);used.add(b.dataset.p);
      if(b.dataset.p==='wave'){const c=introCenter(fig);introBoom(c.x+40,c.y-60)}
      if(used.size>=1){const h=root.querySelector('.ihint');h.textContent=used.size>=2?'Same spot, same pose, from your photo.':'Nice. Try another.';h.classList.add('ok');done(true)}})}},
 {h:"You're all set",p:'Pick the little nudges you want. Change them any time in Profile.',hint:'',
  art(){const c=ntGet();const r=(k,t,d)=>`<div class="ntr"><div><b>${t}</b><small>${d}</small></div><button class="ntsw ${c.on[k]?'on':''}" role="switch" aria-checked="${!!c.on[k]}" aria-label="${t}" data-k="${k}"><i></i></button></div>`;
   return`<div class="ntset">${r('otd','On this day','Memories from past years')}${r('streak','Streaks','When you keep a few days in a row')}${r('week','Weekly recap','A quiet summary each Monday')}${r('nudge','Daily nudge','A gentle reminder to keep something')}</div>`},
  run(root,done){
    root.querySelectorAll('.ntsw').forEach(b=>b.onclick=()=>{const c=ntGet();c.on[b.dataset.k]=c.on[b.dataset.k]?0:1;ntPut(c);b.classList.toggle('on',!!c.on[b.dataset.k]);b.setAttribute('aria-checked',!!c.on[b.dataset.k]);introBuzz(8)});
    done(true)}},
 {h:'Yours alone',p:'No account. No server. Nothing uploaded. Everything stays on this phone.',hint:'Press and hold to lock it in',
  art(){return`<div class="l-wrap"><div class="l-btn" id="lBtn" role="button" tabindex="0" aria-label="Press and hold to lock">
   <svg class="lring" viewBox="0 0 168 168" width="168" height="168"><circle class="lt" cx="84" cy="84" r="80"/><circle class="lp" id="lRg" cx="84" cy="84" r="80"/></svg>
   <div class="core"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path class="sh" d="M8 11V8a4 4 0 018 0v3"/></svg></div></div>
   <div class="l-tags"><span>On this phone</span><span>No account</span><span>No upload</span></div></div>`},
  run(root,done){
    const btn=$('#lBtn'),rg=$('#lRg'),L=502.7,T=1100;let t0=0,raf=0,p=0,shut=false;
    const set=v=>{p=v;rg.style.strokeDashoffset=L*(1-v)};
    const tick=()=>{p=Math.min(1,(performance.now()-t0)/T);set(p);if(p>=1)lock();else raf=requestAnimationFrame(tick)};
    const lock=()=>{if(shut)return;shut=true;cancelAnimationFrame(raf);btn.classList.remove('hold');btn.classList.add('shut');set(1);const c=introCenter(btn);introBoom(c.x,c.y);introBuzz([20,40,30]);
      const h=root.querySelector('.ihint');h.textContent='Locked in. Only you can see your memories.';h.classList.add('ok');done(true)};
    const down=e=>{if(shut)return;try{btn.setPointerCapture(e.pointerId)}catch(_){}btn.classList.add('hold');t0=performance.now()-p*T;cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);introBuzz(6)};
    const up=()=>{if(shut)return;btn.classList.remove('hold');cancelAnimationFrame(raf);const s=p,u0=performance.now();const back=()=>{const k=Math.max(0,s-(performance.now()-u0)/300);set(k);if(k>0&&!btn.classList.contains('hold'))raf=requestAnimationFrame(back)};raf=requestAnimationFrame(back)};
    btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('contextmenu',e=>e.preventDefault());
    btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();lock()}})}}
];
function introMaybe(){
  const forced=/[?&]intro\b/.test(location.search);
  if(CFG.demo&&!forced)return false;
  if(!forced&&(introDone()||emptyMode||user.length))return false;
  introOpen();return true;
}
function introOpen(){
  if($('#intro'))return;
  const d=document.createElement('div');d.id='intro';const n=introSteps.length;
  d.innerHTML=`<div class="itop"><div class="ibar">${introSteps.map(()=>'<i></i>').join('')}</div><button class="isk" id="iSk">Skip</button></div><div class="istage" id="iSt"></div><button class="pill d igo" id="iGo"></button>`;
  $('#app').appendChild(d);if(!introReduced())d.animate([{opacity:0},{opacity:1}],{duration:420,easing:'ease-out'});
  let i=-1,cur=null;const st=$('#iSt'),go=$('#iGo'),bars=[...d.querySelectorAll('.ibar i')];
  const finish=()=>{try{localStorage.setItem(INTRO,'1')}catch(e){}if(cur&&cur._off)cur._off();d.animate([{opacity:1},{opacity:0}],{duration:introReduced()?1:260}).onfinish=()=>{d.remove();onbMaybe()}};
  const show=k=>{
    const s=introSteps[k],old=cur;i=k;
    const el=document.createElement('div');el.className='islide';
    el.innerHTML=`<div class="iart">${s.art()}</div><h1>${s.h}</h1><p>${s.p}</p><div class="ihint">${s.hint}</div>`;
    /* the old step leaves while the new one arrives, so there is never an empty screen between them */
    if(old){if(old._off)old._off();if(introReduced())old.remove();else old.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(-36px) scale(.98)'}],{duration:380,easing:'cubic-bezier(.32,.72,0,1)',fill:'forwards'}).onfinish=()=>old.remove()}
    [...el.children].forEach((c,j)=>c.style.setProperty('--k',j));
    st.appendChild(el);cur=el;
    bars.forEach((b,j)=>b.classList.toggle('on',j<=k));
    go.disabled=true;go.classList.remove('ready');go.textContent=k===n-1?'Open Keep':'Continue';
    $('#iSk').style.visibility=k===n-1?'hidden':'visible';
    s.run(el,(ok,label)=>{go.disabled=!ok;if(label)go.textContent=label;if(ok&&label!=='Skip for now')go.classList.add('ready')});
  };
  go.onclick=()=>{if(go.disabled)return;i===n-1?finish():show(i+1)};$('#iSk').onclick=finish;
  let at=0;try{if(sessionStorage.getItem(INTRO_AT)){sessionStorage.removeItem(INTRO_AT);at=1}}catch(e){}
  show(at);
}
