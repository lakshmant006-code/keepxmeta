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
/* nine banners, each with a mood, three gentle prompts and starter lines. The banner follows the time of day and the feelings you pick. */
const JR_BAN=[
 {id:'lake',t:'Golden hour',f:['Peaceful','Nostalgic','Content','Calm','Grateful'],h:[17,21],
  q:['What are you ready to let settle?','What did today give you that you want to keep?','If today had a colour, what would it be, and why?'],
  ph:{want:'A slow evening, a view like this…',desire:'To feel at peace with how things are…',need:'Stillness, or someone to sit beside…',look:'A calm morning tomorrow…'}},
 {id:'hill',t:'The view from here',f:['Hopeful','Curious','Proud','Inspired'],h:[11,17],
  q:['How far have you come, and what do you see ahead?','What are you proud of that nobody noticed?','What is one step you could take toward what you want?'],
  ph:{want:'To keep moving toward something that matters…',desire:'To see how far I can go…',need:'Courage for the next step…',look:'The view from the next hill…'}},
 {id:'cozy',t:'A soft place to land',f:['Sad','Tired','Hurt','Loved','Vulnerable','Overwhelmed'],h:[18,24],
  q:['What would feel like a warm blanket right now?','What do you need to hear today?','Where do you feel safest, and what makes it so?'],
  ph:{want:'A day with nothing to prove…',desire:'To feel held and understood…',need:'Rest, warmth, someone to listen…',look:'Feeling like myself again…'}},
 {id:'city',t:'Still here, still awake',f:['Lonely','Restless','Confused','Anxious','Uncertain'],h:[21,29],
  q:['Who or what is keeping you company tonight?','What thought keeps coming back when it gets quiet?','What would you tell a friend who felt exactly like this?'],
  ph:{want:'To feel less alone tonight…',desire:'To be known by someone…',need:'Someone to talk to, or just a quiet hug…',look:'Morning, and a lighter head…'}},
 {id:'sun',t:'Turn toward the light',f:['Happy','Excited','Grateful','Proud'],h:[10,16],
  q:['What made you smile today, even a little?','Who deserves a thank you from you?','What small thing went right?'],
  ph:{want:'More days that feel like this one…',desire:'To keep feeling this alive…',need:'To share this with someone…',look:'More of what makes me happy…'}},
 {id:'sea',t:'Come up for air',f:['Overwhelmed','Anxious','Frustrated'],h:[12,20],
  q:['What can you set down for a minute, and breathe?','What is the loudest thing in your head, and is it yours?','What would make the next hour a little easier?'],
  ph:{want:'Quiet, and room to breathe…',desire:'To feel calm underneath it all…',need:'Space, less noise, one thing at a time…',look:'Feeling steady again…'}},
 {id:'peak',t:'Something bigger',f:['Frustrated','Restless','Proud','Excited','Inspired'],h:[9,15],
  q:['What are you climbing toward?','What would you do if you knew you could not fail?','What does success feel like to you, not to anyone else?'],
  ph:{want:'A goal I cannot stop thinking about…',desire:'To build something that lasts…',need:'Focus, and belief in myself…',look:'The moment I reach it…'}},
 {id:'camp',t:'Under the stars',f:['Curious','Peaceful','Loved','Nostalgic','Connected'],h:[21,29],
  q:['What do you wonder about when it is quiet?','Who do you miss, and what would you say to them?','What do you want to remember about this season of life?'],
  ph:{want:'A trip, a night away, a good conversation…',desire:'To feel connected to something bigger…',need:'Slowness, and people who feel like home…',look:'A starry night with people I love…'}},
 {id:'balloon',t:'Rise a little',f:['Excited','Hopeful','Happy','Curious'],h:[5,11],
  q:['What are you looking forward to, even a little?','What would make tomorrow feel lighter?','What is a dream you have not said out loud yet?'],
  ph:{want:'A fresh start, an adventure…',desire:'Freedom to try things…',need:'A little push to begin…',look:'Something I am excited to begin…'}}];
const jrHash=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
/* the banner that fits the feelings first, then the hour of the day; the same day always gives the same one */
function jrBanPick(feel,cur){
  const hr=new Date().getHours(),day=jrHash(dk(TODAY));
  const sc=JR_BAN.map((b,i)=>{let s=0;(feel||[]).forEach(f=>{if(b.f.includes(f))s+=3});const h=hr<5?hr+24:hr;if(h>=b.h[0]&&h<b.h[1])s+=1.5;s+=((day+i*7)%10)/100;if(cur&&b.id===cur&&feel&&feel.length)s+=.2;return[s,b]});
  return sc.sort((a,b)=>b[0]-a[0])[0][1];
}
let JR=null,jrBan=null,jrQi=0;
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
function jrBanSet(b,keepQ){
  if(!b)return;const img=$('#jbi'),t=$('#jbt'),q=$('#jbq');if(!img)return;
  const changed=!jrBan||b.id!==jrBan.id;
  if(changed){jrBan=b;jrQi=0;
    const apply=()=>{img.src='journal/'+b.id+'.jpg';img.style.display='';t.textContent=b.t;q.textContent=b.q[0]};
    if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches){Motion.animate('#jban .jbi,#jban .jbs',{opacity:[1,0]},{duration:.18}).finished.then(()=>{apply();Motion.animate('#jban .jbi,#jban .jbs',{opacity:[0,1]},{duration:.35})},apply)}else apply();
    jrPh();
  }
}
/* starter lines in the empty boxes follow the banner */
function jrPh(){if(!jrBan)return;['want','desire','need','look'].forEach(k=>{const t=$('#j_'+k);if(t)t.placeholder=jrBan.ph[k]||''})}
function jrMount(){
  const p=$('#jpane');if(!p||p.dataset.m)return;p.dataset.m='1';JR=jrFresh();
  const letter=jrLetterPick();
  const words=(k,t)=>`<details class="jw"><summary>Need words?</summary><div class="jwc">${JR_WORDS[k].map(w=>`<button data-k="${k}">${esc(w)}</button>`).join('')}</div></details>`;
  jrBan=jrBanPick([]);jrQi=0;
  p.innerHTML=`<div class="jscr jpane"><div class="jban" id="jban"><img class="jbi" id="jbi" alt="" src="journal/${jrBan.id}.jpg" onerror="this.style.display='none'"><div class="jbs"><small id="jbt">${esc(jrBan.t)}</small><b id="jbq">${esc(jrBan.q[0])}</b><button id="jbn" aria-label="Another prompt">Another prompt ↻</button></div></div><small class="jey">YOUR DAILY CHECK-IN</small><h2 class="jh">What’s going on inside your world?</h2><p class="jsub">You can be feeling more than one thing at once.</p>
    ${letter?jrLetterHTML(letter):''}
    <div class="jsec"><label>01 — Today, I feel…</label><div class="jch" id="jch">${JR_EMO.map(e=>`<button data-e="${e}">${e}</button>`).join('')}</div>
      <details class="jw"><summary>More feelings</summary><div class="jch">${JR_EMO2.map(e=>`<button data-e="${e}">${e}</button>`).join('')}</div></details>
      <div class="jstr"><span>How strongly am I feeling it?</span><b id="jsv">5/10</b></div><input type="range" id="jsl" min="0" max="10" value="5" aria-label="How strongly"></div>
    ${JR_Q.map(q=>`<div class="jsec"><label for="j_${q[0]}">${q[1]} — ${q[2]}${q[0]==='unsaid'?' <i class="jlk">Private</i>':''}</label><p class="jhint">${q[3]}</p><textarea id="j_${q[0]}" rows="2" data-k="${q[0]}" autocomplete="off"></textarea>${JR_WORDS[q[0]]?words(q[0]):''}</div>`).join('')}
    <p class="jfoot"><b id="jcnt">0</b> answered. Even three can become something meaningful to look back on.</p>
    <button class="pill g jcopy" id="jcopy">Copy journal entry</button><p class="jnote">Use this as a template, then copy your entry to your personal journal.</p></div>`;
  const sync=()=>{
    JR.feel=[...p.querySelectorAll('#jch button.on,.jpane .jch button.on')].map(b=>b.dataset.e).filter((v,i,a)=>a.indexOf(v)===i);
    JR_Q.forEach(q=>{const t=p.querySelector('#j_'+q[0]);JR[q[0]]=t?t.value:''});
    const c=$('#jcnt');if(c)c.textContent=jrAnswered();jrBanSet(jrBanPick(JR.feel,jrBan&&jrBan.id));validate();
  };
  p.addEventListener('click',e=>{
    const eb=e.target.closest('button[data-e]');if(eb){eb.classList.toggle('on');sync();buzzSafe&&buzzSafe();return}
    const wb=e.target.closest('.jwc button');if(wb){const t=p.querySelector('#j_'+wb.dataset.k),v=t.value.trim(),w=jrLow(wb.textContent);if(!v)t.value=w;else if(!v.toLowerCase().includes(w.toLowerCase()))t.value=v+(/[,.]$/.test(v)?' ':', ')+w;wb.classList.add('on');sync();return}
    const an=e.target.closest('.jans button');if(an){jrAnswer(+an.dataset.a);return}
    if(e.target.closest('#jcopy')){sync();jrCopy(jrCopyText(JR,fullDay(new Date(...(newM.day||dk(TODAY)).split('-').map((v,i)=>i===1?v-1:+v)))));}
  });
  jrPh();
  p.addEventListener('click',e=>{const n=e.target.closest('#jbn');if(!n)return;jrQi=(jrQi+1)%jrBan.q.length;const q=$('#jbq');if(window.Motion)Motion.animate(q,{opacity:[0,1],y:[6,0]},{duration:.3});q.textContent=jrBan.q[jrQi];buzzSafe&&buzzSafe()});
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
window.jrGet=()=>{if(!JR)return jrFresh();const j=JSON.parse(JSON.stringify(JR));j.feel=j.feel||[];j.ban=jrBan?jrBan.id:'';j.bq=jrBan?jrBan.q[jrQi]:'';return j};
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
