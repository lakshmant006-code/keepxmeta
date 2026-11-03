/* ---------- Journal: a gentle conversation with yourself ---------- */
/* Seven short prompts about what you feel, want, desire, need, haven't said, look forward to and want to remember. Three answers are enough.
   Everything stays on this phone. The line "something I haven't said out loud" is kept out of search and out of the chat, and is hidden until you tap it. */
const JR_EMO=['Happy','Hopeful','Loved','Excited','Peaceful','Grateful','Anxious','Lonely','Confused','Sad','Frustrated','Overwhelmed','Nostalgic','Restless','Curious','Proud'];
const JR_EMO2=['Content','Inspired','Disappointed','Vulnerable','Connected','Uncertain','Relieved','Tired','Hurt','Calm'];
const JR_WORDS={desire:['To be loved','To belong','To feel understood','To create','To be free','To explore','To grow','To be appreciated','To feel safe','To find purpose'],
  need:['Rest','Clarity','Encouragement','Connection','Forgiveness','Stability','Space','Support','Adventure','Acceptance','Reassurance'],
  look:['Seeing someone','Getting better at something','An upcoming trip','Starting a project','Making a memory','Reaching a milestone','A simple peaceful morning']};
const JR_Q=[
  ['want','02','Right now, I really want…','Something you wish you had, could do, or could experience.'],
  ['desire','03','Deep down, I desire…','Something bigger than a moment. Maybe love, belonging, freedom, success, adventure, or connection.'],
  ['need','04','What I need most right now is…','Rest? Reassurance? A hug? Space? Courage? Someone to listen?'],
  ['unsaid','05','Something I haven’t said out loud…','An unspoken worry, truth, thought, or feeling.'],
  ['look','06','I’m looking forward to…','Something tomorrow, next week, next year, or even a dream for the future.'],
  ['remember','07','One thing I want to remember about today…','A tiny moment, a conversation, or a feeling you don’t want to forget. (Optional)']];
ic.jrn=st('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3"/><path d="M12 7.2c-1-1.6-3.2-.9-3.2.8 0 1.6 3.2 3.4 3.2 3.4s3.2-1.8 3.2-3.4c0-1.7-2.2-2.4-3.2-.8z"/>',1.6);
/* nine illustrations. Each has a witty line, an optional follow-up and, for some moments, a line that belongs to that moment (x). Starter lines in the boxes follow the picture. */
const JR_BAN=[
 {id:'lake',f:['Peaceful','Nostalgic','Content','Calm','Grateful'],
  c:[{l:'The sun clocked out. You don’t have to.',f:'Anything on your mind?'},{l:'Before today becomes yesterday…',f:'What is worth keeping?',x:'evening'}],
  ph:{want:'A slow evening, a view like this…',desire:'To feel at peace with how things are…',need:'Stillness, or someone to sit beside…',look:'A calm morning tomorrow…'}},
 {id:'hill',f:['Hopeful','Curious','Proud','Inspired'],
  c:[{l:'Anything worth stealing from today?',f:'A line, a face, a snack.',x:'afternoon'}],
  ph:{want:'To keep moving toward something that matters…',desire:'To see how far I can go…',need:'Courage for the next step…',look:'The view from the next hill…'}},
 {id:'cozy',f:['Sad','Tired','Hurt','Loved','Vulnerable','Overwhelmed'],
  c:[{l:'Dear future you, here’s the tea.',f:'Leave yourself a little update.'},{l:'Some weather comes with memories attached.',f:'What does today remind you of?',x:'rain'}],
  ph:{want:'A day with nothing to prove…',desire:'To feel held and understood…',need:'Rest, warmth, someone to listen…',look:'Feeling like myself again…'}},
 {id:'city',f:['Lonely','Restless','Confused','Anxious','Uncertain'],
  c:[{l:'The thoughts are getting philosophical again, aren’t they?',f:'Type one out. We won’t tell.',x:'late'}],
  ph:{want:'To feel less alone tonight…',desire:'To be known by someone…',need:'Someone to talk to, or just a quiet hug…',look:'Morning, and a lighter head…'}},
 {id:'sun',f:['Happy','Excited','Grateful','Proud'],
  c:[{l:'Somewhere between nothing and everything.',f:'A little moment worth keeping.'}],
  ph:{want:'More days that feel like this one…',desire:'To keep feeling this alive…',need:'To share this with someone…',look:'More of what makes me happy…'}},
 {id:'sea',f:['Overwhelmed','Anxious','Frustrated'],
  c:[{l:'Some thoughts need somewhere to land.',f:'This can be that somewhere.'}],
  ph:{want:'Quiet, and room to breathe…',desire:'To feel calm underneath it all…',need:'Space, less noise, one thing at a time…',look:'Feeling steady again…'}},
 {id:'peak',f:['Frustrated','Restless','Proud','Excited','Inspired'],
  c:[{l:'Look how far you’ve wandered.',f:'And how much you’ve collected along the way.'},{l:'New week. Same wonderfully complicated human.',f:'What is on your mind for this one?',x:'monday'},{l:'A whole month happened. What stayed with you?',f:'Pick one thing.',x:'eom'}],
  ph:{want:'A goal I cannot stop thinking about…',desire:'To build something that lasts…',need:'Focus, and belief in myself…',look:'The moment I reach it…'}},
 {id:'camp',f:['Curious','Peaceful','Loved','Nostalgic','Connected'],
  c:[{l:'Your brain has 47 tabs open.',f:'Want to close a few here?'},{l:'This week deserves an end-credit scene.',f:'Which part was the best scene?',x:'friday'}],
  ph:{want:'A trip, a night away, a good conversation…',desire:'To feel connected to something bigger…',need:'Slowness, and people who feel like home…',look:'A starry night with people I love…'}},
 {id:'balloon',f:['Excited','Hopeful','Happy','Curious'],
  c:[{l:'Today’s still a blank page. No pressure.',f:'Write one thing you are curious about.',x:'morning'}],
  ph:{want:'A fresh start, an adventure…',desire:'Freedom to try things…',need:'A little push to begin…',look:'Something I am excited to begin…'}}];
const jrHash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
/* what moment is it: the end of a month, a rainy mention, a Friday, a Monday morning, or the hour */
function jrCtx(){
  const d=new Date(),h=d.getHours(),dow=d.getDay(),dom=d.getDate(),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  if(dom>=last-1)return'eom';
  if(all().some(m=>+TODAY-m.ts<2*864e5&&/\b(rain|rainy|raining|storm|drizzle|thunder)\b/i.test(String(m.text||''))))return'rain';
  if(dow===5&&h>=12)return'friday';if(dow===1&&h<14)return'monday';
  if(h>=23||h<4)return'late';if(h<12)return'morning';if(h<17)return'afternoon';return'evening';
}
/* feelings win when there are any; otherwise the moment decides, and the same day always gives the same picture */
function jrBanPick(feel){
  if(feel&&feel.length){
    const sc=JR_BAN.map(b=>[feel.filter(f=>b.f.includes(f)).length,b]).sort((a,b)=>b[0]-a[0]);
    if(sc[0][0]>0)return{b:sc[0][1],c:sc[0][1].c[0]};
  }
  const x=jrCtx();
  for(const b of JR_BAN){const c=b.c.find(c=>c.x===x);if(c)return{b,c}}
  const b=JR_BAN[jrHash(dk(TODAY))%JR_BAN.length];return{b,c:b.c[0]};
}
/* the same pick for the banner on the home screen */
window.kBanner=()=>{const p=jrBanPick([]);return{id:p.b.id,line:p.c.l,follow:p.c.f,key:dk(TODAY)}};
/* a little reel: today's banner first, then three more, in an order that is the same all day */
window.kBanners=n=>{const f=window.kBanner(),rest=JR_BAN.filter(b=>b.id!==f.id).map(b=>({b,k:jrHash(dk(TODAY)+b.id)})).sort((x,y)=>x.k-y.k).slice(0,Math.max(0,n-1)).map(x=>({id:x.b.id,line:x.b.c[0].l,follow:x.b.c[0].f,key:f.key}));return [f].concat(rest)};
let JR=null,jrBan=null,jrCp=null;
const jrFresh=()=>({feel:[],str:5,want:'',desire:'',need:'',unsaid:'',look:'',remember:'',ban:''});
const jrLow=s=>String(s||'').trim().replace(/^To /,'to ');
const jrList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const jrAnswered=()=>JR?(JR.feel.length?1:0)+['want','desire','need','unsaid','look','remember'].filter(k=>JR[k].trim()).length:0;
window.jrAnswered=jrAnswered;
/* what search and the chat can see: never the private line */
const jrText=j=>{
  const p=[];if(j.feel&&j.feel.length)p.push(`Feeling ${jrList(j.feel.map(x=>x.toLowerCase()))} (${j.str}/10).`);
  if(j.want)p.push(`I really want ${j.want.trim()}.`);if(j.desire)p.push(`Deep down I desire ${j.desire.trim()}.`);if(j.need)p.push(`What I need most is ${j.need.trim()}.`);
  if(j.look)p.push(`Looking forward to ${j.look.trim()}.`);if(j.remember)p.push(`To remember: ${j.remember.trim()}`);
  return p.join(' ');
};
function jrCopyText(j,dt){
  const L=['The Everyday Human Journal · '+dt,'',`01 — Today, I feel…`,j.feel.length?`${j.feel.join(', ')} (${j.str}/10)`:'—'];
  JR_Q.forEach(q=>{L.push('',`${q[1]} — ${q[2]}`,(j[q[0]]||'').trim()||'—')});
  return L.join('\n');
}
function jrCopy(txt){
  const fb=()=>{const t=document.createElement('textarea');t.value=txt;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();try{document.execCommand('copy');toast('Copied')}catch(e){toast('Could not copy')}t.remove()};
  try{navigator.clipboard.writeText(txt).then(()=>toast('Copied your entry'),fb)}catch(e){fb()}
}
/* a letter from your past self */
function jrLetterPick(){
  const T=+TODAY,c=all().filter(m=>m.type==='journal'&&m.j&&!m.j.reflect&&T-m.ts>=30*864e5&&(m.j.want||m.j.desire||m.j.feel.length));
  return c.sort((a,b)=>Math.abs((T-a.ts)/864e5-180)-Math.abs((T-b.ts)/864e5-180))[0]||null;
}
function jrQuote(j){
  const feel=j.feel&&j.feel.length?jrList(j.feel.map(x=>x.toLowerCase())):'',want=(j.want||j.desire||'').trim().replace(/[.!]+$/,'');
  const a=want?`I really want ${jrLow(want)}.`:'',b=feel?` I’ve been feeling ${feel}${j.look?`, but I’m looking forward to ${jrLow(j.look.replace(/[.!]+$/,''))}`:''}.`:'';
  return(a+b).trim();
}
const jrAgo=ts=>{const d=Math.round((+TODAY-ts)/864e5);if(d<60)return d+' DAYS AGO';const m=Math.round(d/30);if(m<12)return(['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN'][m]||m)+' MONTHS AGO';const y=Math.round(d/365);return y===1?'A YEAR AGO':y+' YEARS AGO'};
const JR_ANS=['I found what I was looking for.','I’m still figuring it out.','What I wanted has changed.','I see things differently now.'];
function jrLetterHTML(m){
  return `<div class="jlet" id="jlet" data-id="${m.id}"><h3>You once wanted this.</h3><em>${jrAgo(m.ts)}</em><q>${esc(jrQuote(m.j))}</q><b>And today?</b>
   <div class="jans">${JR_ANS.map((t,i)=>`<button data-a="${i}">${esc(t)}</button>`).join('')}</div></div>`;
}
/* ---- the Journal: one question at a time, with a little friend who reacts ---- */
const JR_EMOJI={Happy:'😊',Hopeful:'🌈',Loved:'🥰',Excited:'🤩',Peaceful:'😌',Grateful:'🙏',Anxious:'😰',Lonely:'🥺',Confused:'😵‍💫',Sad:'😢',Frustrated:'😤',Overwhelmed:'🤯',Nostalgic:'🥹',Restless:'😬',Curious:'🧐',Proud:'😎',Content:'🙂',Inspired:'✨',Disappointed:'😞',Vulnerable:'🫣',Connected:'🤝',Uncertain:'🤔',Relieved:'😮‍💨',Tired:'😴',Hurt:'💔',Calm:'🍃'};
const JR_MOOD={Happy:'joy',Excited:'cheer',Proud:'cheer',Grateful:'joy',Loved:'joy',Hopeful:'joy',Curious:'joy',Content:'joy',Inspired:'cheer',Connected:'joy',Relieved:'calm',Peaceful:'calm',Calm:'calm',Anxious:'worried',Overwhelmed:'worried',Restless:'worried',Confused:'worried',Uncertain:'worried',Sad:'sad',Lonely:'sad',Hurt:'sad',Disappointed:'sad',Tired:'sad',Vulnerable:'sad',Frustrated:'grr',Nostalgic:'dreamy'};
const JR_STEPS=[['feel','Today, I feel…'],['want','Right now, I really want…'],['desire','Deep down, I desire…'],['need','What I need most is…'],['unsaid','Something I haven’t said out loud…'],['look','I’m looking forward to…'],['remember','One thing to remember today…']];
const JR_FACE={
  neutral:{m:'M66 100 Q80 108 94 100',f:'none'},
  joy:{m:'M62 94 Q80 124 98 94 Z',f:'#7a1f12'},
  cheer:{m:'M60 92 Q80 130 100 92 Z',f:'#7a1f12'},
  calm:{m:'M66 100 Q80 110 94 100',f:'none',closed:1},
  worried:{m:'M64 105 Q72 97 80 105 T96 105',f:'none'},
  sad:{m:'M64 110 Q80 94 96 110',f:'none',tear:1},
  grr:{m:'M66 106 L94 106',f:'none',brow:1},
  dreamy:{m:'M68 100 Q80 108 92 100',f:'none',look:[-4,-5]},
  shh:{m:'M70 104 L90 104',f:'none',hand:1}};
function jrMascot(){
  return `<svg class="mas" id="mas" viewBox="0 0 160 150" aria-hidden="true"><defs><radialGradient id="mg" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#FFB071"/><stop offset=".55" stop-color="#FF8A3D"/><stop offset="1" stop-color="#F2631B"/></radialGradient></defs>
   <g id="mbody"><path d="M80 14c-6-8-2-12 6-12-2 6 0 8 4 12" fill="#7BC043" id="mleaf"/><path d="M80 14c38 0 62 26 62 62 0 38-26 62-62 62S18 114 18 76C18 40 42 14 80 14z" fill="url(#mg)"/><ellipse cx="56" cy="36" rx="14" ry="7" fill="#fff" opacity=".28" transform="rotate(-24 56 36)"/>
   <circle cx="42" cy="92" r="8" fill="#FF6F61" opacity=".45"/><circle cx="118" cy="92" r="8" fill="#FF6F61" opacity=".45"/>
   <g id="meyes"><ellipse cx="58" cy="68" rx="17" ry="19" fill="#fff"/><ellipse cx="102" cy="68" rx="17" ry="19" fill="#fff"/><circle id="mpl" cx="58" cy="70" r="9" fill="#1b1b22"/><circle id="mpr" cx="102" cy="70" r="9" fill="#1b1b22"/><circle id="mgl" cx="55" cy="66" r="3" fill="#fff"/><circle id="mgr" cx="99" cy="66" r="3" fill="#fff"/>
   <path id="mcl" d="M41 68 Q58 82 75 68" stroke="#7a2d0a" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/><path id="mcr" d="M85 68 Q102 82 119 68" stroke="#7a2d0a" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/>
   <rect id="mlid1" x="40" y="48" width="36" height="40" rx="18" fill="#FF8A3D" transform-origin="58 48" style="transform:scaleY(0)"/><rect id="mlid2" x="84" y="48" width="36" height="40" rx="18" fill="#FF8A3D" transform-origin="102 48" style="transform:scaleY(0)"/></g>
   <path id="mbr" d="M42 46 L72 54 M118 46 L88 54" stroke="#7a2d0a" stroke-width="5" stroke-linecap="round" opacity="0"/>
   <path id="mmo" d="M66 100 Q80 108 94 100" stroke="#7a2d0a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
   <path id="mtr" d="M44 84 q-4 8 0 12 q4-4 0-12z" fill="#7cc8ff" opacity="0"/>
   <g id="mhand" opacity="0"><rect x="74" y="90" width="12" height="30" rx="6" fill="#FFC9A0" stroke="#e8955a" stroke-width="2"/></g></g></svg>`;
}
let jrStep=0,jrMoodNow='neutral',jrMasA=null;
function jrMood(name,pop){
  const f=JR_FACE[name]||JR_FACE.neutral,g=id=>$('#'+id);if(!g('mas'))return;jrMoodNow=name;
  const mo=g('mmo');mo.setAttribute('d',f.m);mo.setAttribute('fill',f.f);
  g('mcl').style.opacity=g('mcr').style.opacity=f.closed?1:0;g('mpl').style.opacity=g('mpr').style.opacity=g('mgl').style.opacity=g('mgr').style.opacity=f.closed?0:1;
  g('mbr').style.opacity=f.brow?1:0;g('mtr').style.opacity=f.tear?1:0;g('mhand').style.opacity=f.hand?1:0;g('mmo').style.opacity=f.hand?0:1;
  if(f.look)jrLook(f.look[0],f.look[1]);
  if(pop&&window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    const sq=name==='cheer'?{y:[0,-22,0],scale:[1,1.1,1]}:name==='sad'?{y:[0,4,0],scaleY:[1,.94,1]}:name==='worried'?{x:[0,-4,4,-3,3,0]}:{scale:[1,1.1,.97,1]};
    Motion.animate('#mbody',sq,{duration:name==='cheer'?.6:.45,ease:'easeOut'});
  }
}
function jrLook(dx,dy){const m=Math.max(-5,Math.min(5,dx)),n=Math.max(-5,Math.min(5,dy));[['mpl',58],['mpr',102]].forEach(([id,cx])=>{const e=$('#'+id);if(e){e.setAttribute('cx',cx+m);e.setAttribute('cy',70+n)}});[['mgl',55],['mgr',99]].forEach(([id,cx])=>{const e=$('#'+id);if(e){e.setAttribute('cx',cx+m);e.setAttribute('cy',66+n)}})}
function jrBurst(x,y,txt){
  if(!window.Motion||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  for(let i=0;i<3;i++){const e=document.createElement('span');e.className='jpf';e.textContent=txt;Object.assign(e.style,{left:x-12+'px',top:y-12+'px'});document.body.appendChild(e);
    Motion.animate(e,{y:[0,-70-i*20],x:[0,(i-1)*34],opacity:[1,0],scale:[.6,1.3]},{duration:.8+i*.1,ease:'easeOut'}).finished.then(()=>e.remove(),()=>e.remove())}
}
function jrConfetti(){
  if(!window.Motion||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const cols=['#FF8A3D','#FFC857','#7BC043','#4FB3FF','#FF6F91','#B388FF'];
  for(let i=0;i<34;i++){const e=document.createElement('i');e.className='jcf';Object.assign(e.style,{left:Math.random()*100+'vw',top:'-12px',background:cols[i%cols.length],width:6+Math.random()*6+'px',height:8+Math.random()*8+'px'});document.body.appendChild(e);
    Motion.animate(e,{y:[0,innerHeight*(.6+Math.random()*.5)],x:[0,(Math.random()-.5)*120],rotate:[0,360*(Math.random()>.5?1:-1)],opacity:[1,1,0]},{duration:1.1+Math.random()*.8,ease:'easeIn',delay:Math.random()*.25}).finished.then(()=>e.remove(),()=>e.remove())}
  try{navigator.vibrate&&navigator.vibrate([10,30,10])}catch(e){}
}
function jrStepHTML(i){
  const [k,t]=JR_STEPS[i];
  if(k==='feel')return `<h2 class="jt">${t}</h2><div class="jch" id="jch">${JR_EMO.map(e=>`<button data-e="${e}" class="${JR.feel.includes(e)?'on':''}"><u>${JR_EMOJI[e]}</u>${e}</button>`).join('')}<button class="jmore" id="jmore" aria-label="More feelings">＋</button></div>
    <div class="jch jx" id="jx" hidden>${JR_EMO2.map(e=>`<button data-e="${e}" class="${JR.feel.includes(e)?'on':''}"><u>${JR_EMOJI[e]}</u>${e}</button>`).join('')}</div>
    <div class="jstr" id="jstr" ${JR.feel.length?'':'hidden'}><b id="jsv">${JR.str}</b><input type="range" id="jsl" min="1" max="10" value="${JR.str}" aria-label="How strongly"></div>`;
  const words=JR_WORDS[k]?`<div class="jwr">${JR_WORDS[k].map(w=>`<button data-k="${k}">${esc(w)}</button>`).join('')}</div>`:'';
  return `<h2 class="jt">${t}</h2><textarea id="j_${k}" rows="4" data-k="${k}" autocomplete="off" placeholder="${esc((jrBan&&jrBan.ph[k])||'')}">${esc(JR[k]||'')}</textarea>${words}`;
}
function jrDraw(dir){
  const body=$('#jbody');if(!body)return;
  const first=!body.dataset.d;body.dataset.d=1;
  const swap=()=>{body.innerHTML=(jrLetterEl&&jrStep===-1)?jrLetterHTML(jrLetterEl):jrStepHTML(jrStep);
    $('#jprog').innerHTML=JR_STEPS.map((_,i)=>`<i class="${i<jrStep?'d':i===jrStep?'a':''}" data-i="${i}"></i>`).join('');
    const last=jrStep===JR_STEPS.length-1,nx=$('#jnext');nx.classList.toggle('last',last);nx.innerHTML=last?'✓':'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    $('#jback').style.visibility=jrStep>0||jrLetterEl&&jrStep===0?'visible':'hidden';
    const k=jrStep>=0?JR_STEPS[jrStep][0]:'letter';jrMood(k==='letter'?'dreamy':k==='unsaid'?'shh':k==='feel'?(JR.feel.length?(JR_MOOD[JR.feel[JR.feel.length-1]]||'joy'):'neutral'):'neutral',false);
    if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&!first)Motion.animate(body,{opacity:[0,1],x:[dir*36,0]},{type:'spring',stiffness:420,damping:32});
    jrLook(0,0);
  };
  swap();
}
let jrLetterEl=null;
function jrMount(){
  const p=$('#jpane');if(!p||p.dataset.m)return;p.dataset.m='1';JR=jrFresh();jrStep=0;
  {const pk=jrBanPick([]);jrBan=pk.b;jrCp=pk.c}
  jrLetterEl=jrLetterPick();
  p.innerHTML=`<div class="jscr jpane jfun"><div class="jtop"><div class="jprog" id="jprog"></div><button class="jtb" id="jspark" aria-label="Ideas">💡</button><button class="jtb" id="jcopy" aria-label="Copy entry">⧉</button></div>
    <div class="jmas">${jrMascot()}</div><div class="jbody" id="jbody"></div>
    <div class="jnav"><button class="jbk" id="jback" aria-label="Back">‹</button><button class="jnext" id="jnext" aria-label="Next"></button></div></div>`;
  if(jrLetterEl){jrStep=-1}
  jrDraw(1);if(jrStep===-1){jrStep=-1}
  /* the eyes follow your finger; the friend nods as you type and blinks now and then */
  const mas=$('#mas');
  const follow=e=>{const r=mas.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.45,x=(e.clientX-cx)/Math.max(60,Math.hypot(e.clientX-cx,e.clientY-cy))*5,y=(e.clientY-cy)/Math.max(60,Math.hypot(e.clientX-cx,e.clientY-cy))*5;if(jrMoodNow!=='dreamy')jrLook(x,y)};
  p.addEventListener('pointermove',follow,{passive:true});p.addEventListener('pointerdown',follow,{passive:true});
  const blink=()=>{if(!document.contains(mas))return;if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&!JR_FACE[jrMoodNow].closed){Motion.animate([$('#mlid1'),$('#mlid2')],{scaleY:[0,1,0]},{duration:.22})}setTimeout(blink,2200+Math.random()*3200)};setTimeout(blink,1800);
  if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches)Motion.animate('#mas',{y:[0,-4]},{duration:1.8,repeat:Infinity,repeatType:'mirror',ease:'easeInOut'});
  const sync=()=>{JR_STEPS.forEach(([k])=>{if(k!=='feel'){const t=p.querySelector('#j_'+k);if(t)JR[k]=t.value}});{const pk=jrBanPick(JR.feel);jrBan=pk.b;jrCp=pk.c}validate()};
  const go=(d)=>{sync();const n=jrStep+d;if(jrLetterEl&&jrStep===-1&&d>0){jrStep=0;jrDraw(1);return}if(n<0){if(jrLetterEl){jrStep=-1;jrDraw(-1)}return}if(n>=JR_STEPS.length){jrFinish();return}jrStep=n;jrDraw(d);try{navigator.vibrate&&navigator.vibrate(6)}catch(e){}};
  const jrFinish=()=>{sync();jrMood('cheer',true);jrConfetti();setTimeout(()=>{const k=$('#keep');if(k&&!k.disabled)k.click();else toast('Say one thing first')},700)};
  p.addEventListener('click',e=>{
    const eb=e.target.closest('button[data-e]');
    if(eb){const f=eb.dataset.e,on=!JR.feel.includes(f);JR.feel=on?JR.feel.concat(f):JR.feel.filter(x=>x!==f);eb.classList.toggle('on',on);
      const r=eb.getBoundingClientRect();if(on){jrBurst(r.left+r.width/2,r.top,JR_EMOJI[f]);jrMood(JR_MOOD[f]||'joy',true)}else jrMood(JR.feel.length?JR_MOOD[JR.feel[JR.feel.length-1]]||'joy':'neutral',true);
      const st=$('#jstr');if(st){const was=st.hidden;st.hidden=!JR.feel.length;if(was&&!st.hidden)setTimeout(()=>st.scrollIntoView({behavior:'smooth',block:'nearest'}),60)}sync();return}
    if(e.target.closest('#jmore')){const x=$('#jx');x.hidden=!x.hidden;if(!x.hidden&&window.Motion)Motion.animate(x.children,{opacity:[0,1],y:[8,0]},{duration:.25,delay:Motion.stagger?Motion.stagger(.02):0});return}
    const wb=e.target.closest('.jwr button');if(wb){const t=p.querySelector('#j_'+wb.dataset.k),v=t.value.trim(),w=jrLow(wb.textContent);if(!v)t.value=w;else if(!v.toLowerCase().includes(w.toLowerCase()))t.value=v+(/[,.]$/.test(v)?' ':', ')+w;wb.classList.add('on');jrMood('joy',true);sync();return}
    const an=e.target.closest('.jans button');if(an){jrAnswer(+an.dataset.a);setTimeout(()=>{jrLetterEl=null;jrStep=0;jrDraw(1)},1300);return}
    if(e.target.closest('#jnext')){go(1);return}if(e.target.closest('#jback')){go(-1);return}
    const dot=e.target.closest('#jprog i');if(dot){sync();jrStep=+dot.dataset.i;jrDraw(1);return}
    if(e.target.closest('#jspark')){thOpen();return}
    if(e.target.closest('#jcopy')){sync();jrCopy(jrCopyText(JR,fullDay(new Date(...(newM.day||dk(TODAY)).split('-').map((v,i)=>i===1?v-1:+v)))));}
  });
  p.addEventListener('input',e=>{
    if(e.target.id==='jsl'){JR.str=+e.target.value;$('#jsv').textContent=e.target.value;const m=$('#mas');if(m)m.style.scale=(.82+JR.str*.045).toFixed(3);try{navigator.vibrate&&navigator.vibrate(3)}catch(x){}sync();return}
    if(e.target.matches('textarea')){jrLook(0,4);if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches)Motion.animate('#mbody',{y:[0,3,0]},{duration:.18});sync()}
  });
}
/* answering the letter keeps your reply with that old entry */
function jrAnswer(i){
  const l=$('#jlet');if(!l)return;const m=all().find(x=>String(x.id)===l.dataset.id);if(!m)return;
  m.j.reflect={v:i,ts:Date.now()};try{idb.put(m).catch(()=>{})}catch(e){}
  const line=['I am glad. Hold on to that.','That is okay. Not knowing yet is part of it.','Wanting different things is how we grow.','Seeing it differently means you have moved.'][i];
  l.innerHTML=`<h3>${esc(JR_ANS[i])}</h3><p>${esc(line)}</p>`;
  if(typeof ntBadge==='function')ntBadge();
}
window.jrGet=()=>{if(!JR)return jrFresh();const j=JSON.parse(JSON.stringify(JR));j.feel=j.feel||[];j.ban=jrBan?jrBan.id:'';j.bq=jrCp?jrCp.l:'';return j};
window.jrText=jrText;
/* when you switch to the Journal tab the pane builds itself */
{const os=setMode;window.setMode=function(m,first){os.apply(this,arguments);if(m==='journal'){jrMount();const k=$('#keep');if(k)validate()}}}
/* how a journal entry looks in a day */
const jrFeelChips=j=>(j.feel||[]).map(f=>`<span class="jfc">${JR_EMOJI[f]||''} ${esc(f)}</span>`).join('');
window.jrCard=m=>{
  const j=m.j||{feel:[]},rows=JR_Q.filter(q=>q[0]!=='unsaid'&&(j[q[0]]||'').trim()).map(q=>`<div class="jq"><small>${esc(q[2])}</small><p>${esc(j[q[0]].trim())}</p></div>`).join('');
  const priv=(j.unsaid||'').trim()?`<div class="jq"><small>Something I haven’t said out loud</small><button class="jlock" data-jun="${m.id}">Tap to show</button></div>`:'';
  const rf=j.reflect?`<div class="jrf">You later said: ${esc(JR_ANS[j.reflect.v])}</div>`:'';
  const bn=j.ban&&JR_BAN.find(b=>b.id===j.ban);
  return `<div class="jcard fb">${bn?`<div class="jcb" style="background-image:url(journal/${bn.id}.jpg)"><span>${esc(bn.t)}</span></div>`:''}<div class="jfe">${jrFeelChips(j)}</div>${j.feel&&j.feel.length?`<div class="jbar"><i style="width:${(j.str||0)*10}%"></i><span>${j.str||0}/10</span></div>`:''}${rows}${priv}${rf}</div>`;
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-jun]');if(!b)return;e.stopPropagation();const m=all().find(x=>String(x.id)===b.dataset.jun);if(!m)return;
  const p=document.createElement('p');p.textContent=m.j.unsaid;b.replaceWith(p)},true);

/* ---- signature lines: little pieces of Keep's voice ---- */
const K_SIG=['Keep the almost-forgotten.','Your life, in little pieces.','A pocketful of yesterdays.','For the things that don’t make the camera roll.','The ordinary is doing something extraordinary.','Oh, you’ll want to remember this.','Life happens in the in-between.','Somewhere, a memory is waiting for you.'];
window.kLine=seed=>K_SIG[jrHash(dk(TODAY)+(seed||''))%K_SIG.length];

/* ---- smart prompts: specific, easy to answer, and about something you can actually remember ---- */
const TH_CATS=[['little','Little things'],['people','People'],['places','Places'],['funny','Funny & unexpected'],['again','Memory rediscovery']];
const TH_BANK={
  little:['What happened today that deserved a photo but didn’t get one?','What is the smallest thing that made you smile this week?','What did you eat today that you would actually recommend?','Which song has been stuck in your head?','What was the best thing you touched, tasted or smelled today?'],
  people:['Who made you laugh recently, and what did they say?','Who did you think of today for no reason?','What is something a friend said that you keep quoting?','Who would you text right now if you were not overthinking it?'],
  places:['Where did you spend the most time today without really noticing?','What is a spot you keep going back to?','What did the air smell like where you were?','Which corner of your day looked best at just the right moment?'],
  funny:['What is the weirdest thing you saw today?','What did you overhear that you cannot stop thinking about?','What went wrong in a way that is weirdly funny now?','What is the most random thing you looked up lately?']};
const thOn=()=>{try{return localStorage.getItem('kept.thm')==='1'}catch(e){return false}};
const thDay=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
/* prompts that mention what you actually kept (only when you allow it) */
function thMemory(cat){
  const out=[],A=all(),T=TODAY;
  const ya=dk(new Date(T.getFullYear()-1,T.getMonth(),T.getDate()));
  if(byDay[ya]&&cat==='again')out.push({t:`A year ago, this was just another ${longDay(thDay(ya)).split(',')[0]}. Want to see what happened?`,d:ya});
  if(cat==='again'){
    const cnt={};A.filter(m=>m.type==='photo'&&+T-m.ts<90*864e5).forEach(m=>{const k=dk(new Date(m.ts));cnt[k]=(cnt[k]||0)+1});
    const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
    if(best&&best[1]>=5)out.push({t:`You kept ${best[1]} photos on ${longDay(thDay(best[0]))}. What made that day worth it?`,d:best[0]});
    const old=A.filter(m=>m.text&&m.text.length>12&&m.text.length<90&&+T-m.ts>60*864e5&&['text','photo','voice'].includes(m.type)).sort((a,b)=>jrHash(String(a.id)+dk(T))-jrHash(String(b.id)+dk(T)))[0];
    if(old)out.push({t:`On ${longDay(new Date(old.ts))} you wrote: “${old.text.trim()}” Still true?`,d:dk(new Date(old.ts))});
  }
  if(cat==='people'){
    const c={};A.forEach(m=>{if(m.type==='person')return;chNames(m).forEach(n=>{c[n]=(c[n]||0)+1})});
    const top=Object.entries(c).filter(([n,k])=>k>=4&&chFirstOf(n).length>2&&!CH_WORDS.has(chFirstOf(n))).sort((a,b)=>b[1]-a[1])[0];
    if(top)out.push({t:`You and ${chPN(top[0])} have quite a collection of little adventures. Which one do you tell most?`});
  }
  if(cat==='places'){
    const pl=A.filter(m=>m.type==='place'&&m.name).sort((a,b)=>b.ts-a.ts)[0];
    if(pl)out.push({t:`You marked ${pl.name}. What do you remember about it?`,d:dk(new Date(pl.ts))});
  }
  return out;
}
let thCat='little',thI=0;
function thList(){
  const base=TH_BANK[thCat]||[],mem=thOn()?thMemory(thCat):[];
  if(thCat==='again'){return mem.length?mem.slice(0,4):[{t:thOn()?'Pick any old day and tell me one thing you remember about it.':'Turn on “Use my memories” to get prompts like “A year ago, this was just another Tuesday.”'}]}
  const day=jrHash(dk(TODAY)+thCat),rot=base.map((t,i)=>({t,k:(i*7+day)%base.length})).sort((a,b)=>a.k-b.k).map(x=>({t:x.t}));
  return mem.concat(rot).slice(0,4);
}
function thClose(){const m=$('#thm');if(m)m.remove()}
function thDraw(){
  const m=$('#thm');if(!m)return;const L=thList();if(thI>=L.length)thI=0;const p=L[thI];
  m.querySelector('.thc').innerHTML=`<small>A THOUGHT FOR YOU</small><em>${thI+1} / ${L.length}</em><p>${esc(p.t)}</p>${p.d?`<button class="tagch" id="thSee">See that day</button>`:''}`;
  m.querySelectorAll('.thp button').forEach(b=>b.classList.toggle('on',b.dataset.c===thCat));
  const sw=m.querySelector('#thMem');if(sw){sw.classList.toggle('on',thOn());sw.setAttribute('aria-checked',thOn())}
  if(window.Motion)Motion.animate(m.querySelector('.thc p'),{opacity:[0,1],y:[8,0]},{duration:.3});
}
function thOpen(cat){
  thClose();if(cat)thCat=cat;thI=0;
  const m=document.createElement('div');m.id='thm';m.className='asrm thm';
  m.innerHTML=`<div role="dialog" aria-label="Smart prompts"><div class="thh"><h2>Smart prompts</h2><button class="ib" id="thX" aria-label="Close">${ic.x}</button></div>
    <div class="thp">${TH_CATS.map(c=>`<button data-c="${c[0]}">${c[1]}</button>`).join('')}</div>
    <div class="thc"></div>
    <div class="thb"><button class="pill g" id="thNext">Another thought</button><button class="pill g" id="thCopy">Copy</button></div>
    <button class="pill d thk" id="thKeep">Keep this thought</button>
    <div class="thm2"><span>Use my memories<small>Prompts can mention your own instants. Everything stays on this phone.</small></span><button class="ntsw" id="thMem" role="switch" aria-label="Use my memories"><i></i></button></div></div>`;
  $('#app').appendChild(m);thDraw();
  m.addEventListener('click',e=>{
    if(e.target===m||e.target.closest('#thX')){thClose();return}
    const c=e.target.closest('.thp button');if(c){thCat=c.dataset.c;thI=0;thDraw();return}
    if(e.target.closest('#thNext')){thI++;thDraw();return}
    if(e.target.closest('#thCopy')){const t=thList()[thI].t;jrCopy(t);return}
    if(e.target.closest('#thKeep')){const t=thList()[thI].t,r=m.querySelector('.thc').getBoundingClientRect();thClose();jrKeepThought(t,r);return}
    if(e.target.closest('#thMem')){try{localStorage.setItem('kept.thm',thOn()?'0':'1')}catch(x){}thI=0;thDraw();return}
    const see=e.target.closest('#thSee');if(see){const d=thList()[thI].d;thClose();try{closeAdd()}catch(x){}setTimeout(()=>openDay(d),250)}
  });
}
window.thOpen=thOpen;window.thPrompt=()=>{const L=thList();return L[Math.floor(Math.random()*L.length)]};
/* "Keep this thought": the prompt becomes the note's starting question */
function jrKeepThought(prompt){
  const go=()=>{setMode('text');const t=$('#tx');if(t){t.placeholder=prompt||'What is on your mind?';t.focus({preventScroll:true})}};
  if(!$('#ov').classList.contains('on')){openAdd();setTimeout(go,200)}else go();
}
window.jrKeepThought=jrKeepThought;

/* ---- the banner on the home screen: one sentence, one follow-up, one gentle action ---- */
(function(){
  const home=$('#home'),mom=$('#mom');if(!home)return;
  const KEY='kept.hban',got=()=>{try{return localStorage.getItem(KEY)}catch(e){return ''}},RM=matchMedia('(prefers-reduced-motion:reduce)');
  const strip=document.createElement('div');strip.className='hban';strip.id='hban';strip.hidden=true;
  home.insertBefore(strip,mom||$('#dowbar'));
  let L=[],cur=0;
  /* one slide at a time, each drifting slowly, the next one dissolving in on a small beat */
  function show(i){
    cur=(i+L.length)%L.length;
    strip.querySelectorAll('.hbs').forEach((s,k)=>s.classList.toggle('on',k===cur));
    strip.querySelectorAll('.hbp u').forEach((u,k)=>{u.classList.toggle('done',k<cur);const b=u.firstChild;b.style.animation='none';if(k===cur){void b.offsetWidth;b.style.animation=''}u.classList.toggle('act',k===cur)});
    if(!RM.matches){strip.classList.remove('beat');void strip.offsetWidth;strip.classList.add('beat')}
  }
  function draw(){
    L=window.kBanners(4);cur=0;if(got()===L[0].key){strip.hidden=true;return}
    strip.hidden=false;
    strip.innerHTML=`<button class="hbg" id="hbnGo">${L.map((b,i)=>`<div class="hbs ${i?'':'on'}"><i style="background-image:url(journal/${b.id}.jpg)"></i><em class="hbf" style="background-image:url(journal/${b.id}.jpg)"></em><span><b>${esc(b.line)}</b><small>${esc(b.follow)}</small></span></div>`).join('')}${RM.matches?'':`<div class="hbp">${L.map((_,i)=>`<u class="${i?'':'act'}"><i></i></u>`).join('')}</div>`}</button><button class="momx" id="hbnX" aria-label="Hide for today">×</button>`;
    $('#hbnGo').onclick=()=>{openAdd();setTimeout(()=>setMode('journal'),200)};
    $('#hbnX').onclick=()=>{try{localStorage.setItem(KEY,L[0].key)}catch(e){}strip.hidden=true};
    const g=$('#hbnGo');
    /* hold to pause, like a story */
    g.addEventListener('pointerdown',()=>strip.classList.add('hold'));['pointerup','pointercancel','pointerleave'].forEach(k=>g.addEventListener(k,()=>strip.classList.remove('hold')));
    /* each progress bar fills, then the next slide begins */
    strip.querySelectorAll('.hbp u i').forEach(b=>b.addEventListener('animationend',()=>{if(document.hidden)return;show(cur+1)}));
  }
  draw();document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});
})();
