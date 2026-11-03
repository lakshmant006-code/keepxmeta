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
  return `<div class="jlet" id="jlet" data-id="${m.id}"><small>A LETTER FROM YOUR PAST</small><h3>You once wanted this.</h3><em>${jrAgo(m.ts)}</em><q>${esc(jrQuote(m.j))}</q><b>And today?</b>
   <div class="jans">${JR_ANS.map((t,i)=>`<button data-a="${i}">${esc(t)}</button>`).join('')}</div></div>`;
}
function jrBanSet(pk){
  if(!pk)return;const img=$('#jbi'),t=$('#jbt'),q=$('#jbq');if(!img)return;
  if(jrBan&&pk.b.id===jrBan.id)return;
  jrBan=pk.b;jrCp=pk.c;
  const apply=()=>{img.src='journal/'+pk.b.id+'.jpg';img.style.display='';t.textContent=pk.c.l;q.textContent=pk.c.f};
  if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches){Motion.animate('#jban .jbi,#jban .jbs',{opacity:[1,0]},{duration:.18}).finished.then(()=>{apply();Motion.animate('#jban .jbi,#jban .jbs',{opacity:[0,1]},{duration:.35})},apply)}else apply();
  jrPh();
}
/* starter lines in the empty boxes follow the banner */
function jrPh(){if(!jrBan)return;['want','desire','need','look'].forEach(k=>{const t=$('#j_'+k);if(t)t.placeholder=jrBan.ph[k]||''})}
function jrMount(){
  const p=$('#jpane');if(!p||p.dataset.m)return;p.dataset.m='1';JR=jrFresh();
  const letter=jrLetterPick();
  const words=(k,t)=>`<details class="jw"><summary>Need words?</summary><div class="jwc">${JR_WORDS[k].map(w=>`<button data-k="${k}">${esc(w)}</button>`).join('')}</div></details>`;
  {const pk=jrBanPick([]);jrBan=pk.b;jrCp=pk.c}
  p.innerHTML=`<div class="jscr jpane"><div class="jban" id="jban"><img class="jbi" id="jbi" alt="" src="journal/${jrBan.id}.jpg" onerror="this.style.display='none'"><div class="jbs"><b id="jbt">${esc(jrCp.l)}</b><span id="jbq">${esc(jrCp.f)}</span><div class="jbb"><button id="jbk">Keep this thought</button><button id="jbn" class="jbl">More thoughts</button></div></div></div><small class="jey">YOUR DAILY CHECK-IN</small><h2 class="jh">What’s going on inside your world?</h2><p class="jsub">You can be feeling more than one thing at once.</p>
    ${letter?jrLetterHTML(letter):''}
    <div class="jsec"><label>01 — Today, I feel…</label><div class="jch" id="jch">${JR_EMO.map(e=>`<button data-e="${e}">${e}</button>`).join('')}</div>
      <details class="jw"><summary>More feelings</summary><div class="jch">${JR_EMO2.map(e=>`<button data-e="${e}">${e}</button>`).join('')}</div></details>
      <div class="jstr"><span>How strongly am I feeling it?</span><b id="jsv">5/10</b></div><input type="range" id="jsl" min="0" max="10" value="5" aria-label="How strongly"></div>
    ${JR_Q.map(q=>`<div class="jsec"><label for="j_${q[0]}">${q[1]} — ${q[2]}${q[0]==='unsaid'?' <i class="jlk">Private</i>':''}</label><p class="jhint">${q[3]}</p><textarea id="j_${q[0]}" rows="2" data-k="${q[0]}" autocomplete="off"></textarea>${JR_WORDS[q[0]]?words(q[0]):''}</div>`).join('')}
    <p class="jfoot"><b id="jcnt">0</b> answered. Even three can become something meaningful to look back on.</p><p class="jsig">${kLine('j')}</p>
    <button class="pill g jcopy" id="jcopy">Copy journal entry</button><p class="jnote">Use this as a template, then copy your entry to your personal journal.</p></div>`;
  const sync=()=>{
    JR.feel=[...p.querySelectorAll('#jch button.on,.jpane .jch button.on')].map(b=>b.dataset.e).filter((v,i,a)=>a.indexOf(v)===i);
    JR_Q.forEach(q=>{const t=p.querySelector('#j_'+q[0]);JR[q[0]]=t?t.value:''});
    const c=$('#jcnt');if(c)c.textContent=jrAnswered();jrBanSet(jrBanPick(JR.feel));validate();
  };
  p.addEventListener('click',e=>{
    const eb=e.target.closest('button[data-e]');if(eb){eb.classList.toggle('on');sync();buzzSafe&&buzzSafe();return}
    const wb=e.target.closest('.jwc button');if(wb){const t=p.querySelector('#j_'+wb.dataset.k),v=t.value.trim(),w=jrLow(wb.textContent);if(!v)t.value=w;else if(!v.toLowerCase().includes(w.toLowerCase()))t.value=v+(/[,.]$/.test(v)?' ':', ')+w;wb.classList.add('on');sync();return}
    const an=e.target.closest('.jans button');if(an){jrAnswer(+an.dataset.a);return}
    if(e.target.closest('#jcopy')){sync();jrCopy(jrCopyText(JR,fullDay(new Date(...(newM.day||dk(TODAY)).split('-').map((v,i)=>i===1?v-1:+v)))));}
  });
  jrPh();
  p.addEventListener('click',e=>{if(e.target.closest('#jbn')){thOpen();return}if(e.target.closest('#jbk')){jrKeepThought(jrCp&&jrCp.f||'')}});
  p.addEventListener('input',e=>{
    if(e.target.id==='jsl'){JR.str=+e.target.value;$('#jsv').textContent=e.target.value+'/10';sync();return}
    if(e.target.matches('textarea'))sync();
  });
}
/* answering the letter keeps your reply with that old entry */
function jrAnswer(i){
  const l=$('#jlet');if(!l)return;const m=all().find(x=>String(x.id)===l.dataset.id);if(!m)return;
  m.j.reflect={v:i,ts:Date.now()};try{idb.put(m).catch(()=>{})}catch(e){}
  const line=['I am glad. Hold on to that.','That is okay. Not knowing yet is part of it.','Wanting different things is how we grow.','Seeing it differently means you have moved.'][i];
  l.innerHTML=`<small>A LETTER FROM YOUR PAST</small><h3>${esc(JR_ANS[i])}</h3><p>${esc(line)}</p><p class="jend">Emotions tell us where we are, desires tell us what matters, and looking forward gives us something to hope for.</p>`;
  if(typeof ntBadge==='function')ntBadge();
}
window.jrGet=()=>{if(!JR)return jrFresh();const j=JSON.parse(JSON.stringify(JR));j.feel=j.feel||[];j.ban=jrBan?jrBan.id:'';j.bq=jrCp?jrCp.l:'';return j};
window.jrText=jrText;
/* when you switch to the Journal tab the pane builds itself */
{const os=setMode;window.setMode=function(m,first){os.apply(this,arguments);if(m==='journal'){jrMount();const k=$('#keep');if(k)validate()}}}
/* how a journal entry looks in a day */
const jrFeelChips=j=>(j.feel||[]).map(f=>`<span class="jfc">${esc(f)}</span>`).join('');
window.jrCard=m=>{
  const j=m.j||{feel:[]},rows=JR_Q.filter(q=>q[0]!=='unsaid'&&(j[q[0]]||'').trim()).map(q=>`<div class="jq"><small>${esc(q[2])}</small><p>${esc(j[q[0]].trim())}</p></div>`).join('');
  const priv=(j.unsaid||'').trim()?`<div class="jq"><small>Something I haven’t said out loud</small><button class="jlock" data-jun="${m.id}">Tap to show</button></div>`:'';
  const rf=j.reflect?`<div class="jrf">You later said: ${esc(JR_ANS[j.reflect.v])}</div>`:'';
  const bn=j.ban&&JR_BAN.find(b=>b.id===j.ban);
  return `<div class="jcard fb">${bn?`<div class="jcb" style="background-image:url(journal/${bn.id}.jpg)"><span>${esc(bn.t)}</span></div>`:''}${j.bq?`<div class="jqq">${esc(j.bq)}</div>`:''}<div class="jfe">${jrFeelChips(j)}</div>${j.feel&&j.feel.length?`<div class="jbar"><i style="width:${(j.str||0)*10}%"></i><span>${j.str||0}/10</span></div>`:''}${rows}${priv}${rf}</div>`;
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
    if(e.target.closest('#thKeep')){const t=thList()[thI].t;thClose();jrKeepThought(t);return}
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
  const KEY='kept.hban',got=()=>{try{return localStorage.getItem(KEY)}catch(e){return ''}};
  const strip=document.createElement('div');strip.className='hban';strip.id='hban';strip.hidden=true;
  home.insertBefore(strip,mom||$('#dowbar'));
  function draw(){
    const b=window.kBanner();if(got()===b.key){strip.hidden=true;return}
    strip.hidden=false;
    strip.innerHTML=`<button class="hbg" id="hbnGo"><i style="background-image:url(journal/${b.id}.jpg)"></i><span><b>${esc(b.line)}</b><small>${esc(b.follow)}</small></span></button><button class="momx" id="hbnX" aria-label="Hide for today">×</button>`;
    $('#hbnGo').onclick=()=>{openAdd();setTimeout(()=>setMode('journal'),200)};
    $('#hbnX').onclick=()=>{try{localStorage.setItem(KEY,b.key)}catch(e){}strip.hidden=true};
  }
  draw();document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});
})();
