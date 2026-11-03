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
let JR=null;
const jrFresh=()=>({feel:[],str:5,want:'',desire:'',need:'',unsaid:'',look:'',remember:''});
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
function jrMount(){
  const p=$('#jpane');if(!p||p.dataset.m)return;p.dataset.m='1';JR=jrFresh();
  const letter=jrLetterPick();
  const words=(k,t)=>`<details class="jw"><summary>Need words?</summary><div class="jwc">${JR_WORDS[k].map(w=>`<button data-k="${k}">${esc(w)}</button>`).join('')}</div></details>`;
  p.innerHTML=`<div class="jscr jpane"><small class="jey">YOUR DAILY CHECK-IN</small><h2 class="jh">What’s going on inside your world?</h2><p class="jsub">You can be feeling more than one thing at once.</p>
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
    const c=$('#jcnt');if(c)c.textContent=jrAnswered();validate();
  };
  p.addEventListener('click',e=>{
    const eb=e.target.closest('button[data-e]');if(eb){eb.classList.toggle('on');sync();buzzSafe&&buzzSafe();return}
    const wb=e.target.closest('.jwc button');if(wb){const t=p.querySelector('#j_'+wb.dataset.k),v=t.value.trim(),w=jrLow(wb.textContent);if(!v)t.value=w;else if(!v.toLowerCase().includes(w.toLowerCase()))t.value=v+(/[,.]$/.test(v)?' ':', ')+w;wb.classList.add('on');sync();return}
    const an=e.target.closest('.jans button');if(an){jrAnswer(+an.dataset.a);return}
    if(e.target.closest('#jcopy')){sync();jrCopy(jrCopyText(JR,fullDay(new Date(...(newM.day||dk(TODAY)).split('-').map((v,i)=>i===1?v-1:+v)))));}
  });
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
window.jrGet=()=>{if(!JR)return jrFresh();const j=JSON.parse(JSON.stringify(JR));j.feel=j.feel||[];return j};
window.jrText=jrText;
/* when you switch to the Journal tab the pane builds itself */
{const os=setMode;window.setMode=function(m,first){os.apply(this,arguments);if(m==='journal'){jrMount();const k=$('#keep');if(k)validate()}}}
/* how a journal entry looks in a day */
const jrFeelChips=j=>(j.feel||[]).map(f=>`<span class="jfc">${esc(f)}</span>`).join('');
window.jrCard=m=>{
  const j=m.j||{feel:[]},rows=JR_Q.filter(q=>q[0]!=='unsaid'&&(j[q[0]]||'').trim()).map(q=>`<div class="jq"><small>${esc(q[2])}</small><p>${esc(j[q[0]].trim())}</p></div>`).join('');
  const priv=(j.unsaid||'').trim()?`<div class="jq"><small>Something I haven’t said out loud</small><button class="jlock" data-jun="${m.id}">Tap to show</button></div>`:'';
  const rf=j.reflect?`<div class="jrf">You later said: ${esc(JR_ANS[j.reflect.v])}</div>`:'';
  return `<div class="jcard fb"><div class="jfe">${jrFeelChips(j)}</div>${j.feel&&j.feel.length?`<div class="jbar"><i style="width:${(j.str||0)*10}%"></i><span>${j.str||0}/10</span></div>`:''}${rows}${priv}${rf}</div>`;
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-jun]');if(!b)return;e.stopPropagation();const m=all().find(x=>String(x.id)===b.dataset.jun);if(!m)return;
  const p=document.createElement('p');p.textContent=m.j.unsaid;b.replaceWith(p)},true);
