/* ---------- Conversation transcript: talk, read it back, and see what was worth keeping ---------- */
/* Speech is turned into words by the phone's own speech recognition where it has one (or you can type the lines). Keep marks the lines with a fact worth
   remembering (money, dates and times, numbers, promises) and keeps them with the conversation. All of it is word rules on the phone. */
const TR_FACT=[
  [/\$\s?\d[\d,]*(\.\d+)?|\b\d[\d,]*(\.\d+)?\s?(dollars|bucks|usd)\b/i,'money'],
  [/\b(\d{1,2}(:\d{2})?\s?(am|pm)|noon|midnight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|next (week|month)|january|february|march|april|may \d|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})\b/i,'when'],
  [/\b\d[\d,.]*\s?(%|percent|per (month|week|day|year)|miles|km|minutes|hours|days|weeks|months|years|bedrooms?|floors?|people|spots?)\b/i,'number'],
  [/\b\d{3}[-.\s]\d{3,4}([-.\s]\d{4})?\b/,'phone'],
  [/\b(don.t forget|remember to|i (need|have|must) to|i.ll|i will|i promise|deadline|due|make sure|call (me|him|her)|let me know)\b/i,'todo']
];
const trSplit=t=>(String(t).match(/[^.!?]+[.!?]*\s*/g)||[t]).map(s=>s.trim()).filter(Boolean);
function trFact(s){
  for(const [re,k] of TR_FACT){const m=re.exec(s);if(m){
    const end=s.indexOf(',',m.index+m[0].length),cut=end>0?end:s.length,clause=s.slice(0,cut).trim().replace(/[.!?]+$/,'');
    return{k,hl:clause,fact:clause.charAt(0).toUpperCase()+clause.slice(1)+'.'};}}
  return null;
}
let TR=null;
const trOther=()=>TR&&TR.other||'Them';
const trLabel=sp=>sp==='me'?'You':trOther();
function trTurns(){return TR.turns}
function trHTML(){
  let facts=0;const rows=TR.turns.map((t,ti)=>{
    let n=0;const body=trSplit(t.text).map(s=>{const f=trFact(s);if(!f)return esc(s);n++;facts++;return `<span class="trhl" data-f="${esc(f.fact)}">${esc(f.hl)}</span>${esc(s.slice(f.hl.length))}`}).join(' ');
    return `<div class="trt"><small>${esc(trLabel(t.sp).toUpperCase())}</small><p>${body}${n?`<em class="trbd" data-ti="${ti}">✦ ${n}</em>`:''}</p></div>`}).join('');
  const live=TR.interim?`<div class="trt live"><small>${esc(trLabel(TR.sp).toUpperCase())}</small><p>${esc(TR.interim)}</p></div>`:'';
  TR.facts=facts;return rows+live;
}
function trDraw(scroll){
  const el=$('#trBody');if(!el)return;const prev=el.scrollTop,stick=el.scrollHeight-el.scrollTop-el.clientHeight<80;
  el.innerHTML=TR.turns.length||TR.interim?trHTML():`<div class="trempty"><b>${TR.view?'No transcript':'Start talking'}</b><span>${TR.view?'':'Everything said shows up here. Lines with a price, time, date or promise are saved to memory.'}</span></div>`;
  if(stick||scroll)el.scrollTop=el.scrollHeight;else el.scrollTop=prev;
  const f=$('#trFacts');if(f)f.textContent=TR.facts?'✦ '+TR.facts+' saved':'';
}
function trTip(txt){
  const old=$('#trTip');if(old)old.remove();
  const tip=document.createElement('div');tip.id='trTip';tip.className='trtip';tip.innerHTML=`<small>SAVED TO MEMORY</small>${esc(txt)}`;$('#tr').appendChild(tip);
  const M=window.Motion;if(M&&!matchMedia('(prefers-reduced-motion:reduce)').matches){M.animate(tip,{opacity:[0,1],y:[10,0],scale:[.92,1]},{type:'spring',stiffness:420,damping:26})}
  clearTimeout(trTip.t);trTip.t=setTimeout(()=>{if(M)M.animate(tip,{opacity:0,y:-6},{duration:.25}).finished.then(()=>tip.remove(),()=>tip.remove());else tip.remove()},3200);
  try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}
}
/* add a finished piece of speech to the right speaker */
window.trAdd=(sp,text)=>{
  text=String(text||'').trim();if(!TR||!text)return;
  const last=TR.turns[TR.turns.length-1];
  if(last&&last.sp===sp)last.text+=' '+text;else TR.turns.push({sp,text});
  TR.interim='';trDraw(true);
  const f=trSplit(text).map(trFact).find(Boolean);if(f)trTip(f.fact);
};
function trListen(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  /* an installed iPhone web app has no speech recognition: use the on-phone listener there, and wherever the browser has none */
  if((!SR||(window.asrPref&&asrPref()))&&window.trAsrStart&&trAsrStart()){TR.typed=true;return true}
  if(!SR){TR.typed=true;return false}
  const r=new SR();r.continuous=true;r.interimResults=true;r.lang=navigator.language||'en-US';TR.rec=r;TR.on=true;
  r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const res=e.results[i];if(res.isFinal)trAdd(TR.sp,res[0].transcript);else interim+=res[0].transcript}
    if(interim){TR.interim=interim;trDraw(true)}};
  r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){TR.on=false;TR.typed=true;toast('Allow the microphone, or type the lines');trChrome()}};
  r.onend=()=>{if(TR&&TR.on&&TR.rec===r){try{r.start()}catch(e){}}};
  try{r.start()}catch(e){return false}return true;
}
function trStopListen(){if(TR&&TR.rec){TR.on=false;try{TR.rec.stop()}catch(e){}}if(TR&&TR.stopAsr)TR.stopAsr()}
function trChrome(){
  const mic=$('#trMic'),sp=$('#trSp'),ty=$('#trType');if(!mic)return;
  mic.classList.toggle('on',!!TR.on);mic.setAttribute('aria-label',TR.on?'Pause':'Listen');
  mic.innerHTML=TR.on?'<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>':'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
  if(sp)sp.innerHTML=`<span>Speaking</span><b>${esc(trLabel(TR.sp))}</b><i>⇄</i>`;
  if(ty)ty.hidden=!TR.typed;
}
function trShell(title){
  const p=$('#tr');p.classList.add('on');
  p.innerHTML=`<div class="trh"><button class="ib" id="trX" aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button><div class="trti">${esc(title)}<small id="trFacts"></small></div><span style="width:44px"></span></div>
   <div class="trbody" id="trBody"></div>`;
  $('#trX').onclick=trClose;
  $('#trBody').addEventListener('click',e=>{const h=e.target.closest('.trhl,.trbd');if(!h)return;const t=h.dataset.f||(h.closest('.trt')&&(h.closest('.trt').querySelector('.trhl')||{dataset:{}}).dataset.f);if(t)trTip(t)});
}
window.trOpen=day=>{
  TR={turns:[],sp:'me',other:'',interim:'',on:false,t0:Date.now(),day:day||dk(TODAY),typed:false,view:false};
  trShell('Conversation');
  const p=$('#tr');
  p.insertAdjacentHTML('beforeend',`<div class="trbar"><div class="trwho"><input id="trWho" placeholder="Who are you talking with?" autocomplete="off" maxlength="30"></div>
   <div class="trty" id="trType" hidden><input id="trLine" placeholder="Type what was said" autocomplete="off"><button id="trSend" aria-label="Add">↑</button></div>
   <div class="trctl"><button class="trsp" id="trSp"></button><button class="trmic" id="trMic"></button><button class="trkeep" id="trKeep">Keep</button></div></div>`);
  $('#trWho').oninput=e=>{TR.other=e.target.value.trim();trChrome();trDraw()};
  $('#trSp').onclick=()=>{TR.sp=TR.sp==='me'?'them':'me';TR.interim='';trChrome();try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
  $('#trMic').onclick=()=>{if(TR.on){trStopListen()}else if(!trListen()){TR.typed=true}trChrome()};
  const send=()=>{const i=$('#trLine');if(i.value.trim()){trAdd(TR.sp,i.value);i.value=''}};
  $('#trSend').onclick=send;$('#trLine').onkeydown=e=>{if(e.key==='Enter')send()};
  $('#trKeep').onclick=trSave;
  trChrome();trDraw();
  if(!trListen()){TR.typed=true;trChrome()}else trChrome();
};
window.trView=m=>{
  TR={turns:m.turns||[],sp:'me',other:m.who||'',interim:'',on:false,view:true,typed:false};
  const d=new Date(m.ts);trShell(longDay(d)+' · '+tstr(m.ts));trDraw();
};
function trClose(){trStopListen();const p=$('#tr');p.classList.remove('on');p.innerHTML='';TR=null}
function trSave(){
  if(!TR||!TR.turns.length){toast('Say or type something first');return}
  trStopListen();
  const [y,mo,d]=TR.day.split('-').map(Number),now=new Date(),s=Math.max(1,Math.round((Date.now()-TR.t0)/1000)),
    facts=TR.turns.flatMap(t=>trSplit(t.text).map(trFact).filter(Boolean).map(f=>({k:f.k,t:f.fact}))),
    text=TR.turns.map(t=>t.text).join(' ');
  const o={id:Date.now(),ts:new Date(y,mo-1,d,now.getHours(),now.getMinutes()).getTime(),type:'voice',dur:Math.floor(s/60)+':'+String(s%60).padStart(2,'0'),text,turns:TR.turns,facts};
  if(TR.other)o.who=TR.other;
  user.push(o);persistUser();trClose();try{closeAdd()}catch(e){}refresh();
  toast(facts.length?'Kept, with '+facts.length+(facts.length===1?' fact':' facts')+' saved':'Kept');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tr]');if(b){e.stopPropagation();const m=all().find(x=>String(x.id)===b.dataset.tr);if(m){closeSheet();setTimeout(()=>trView(m),200)}return}
  if(e.target.closest('#trGo')){e.stopPropagation();trOpen(typeof newM!=='undefined'&&newM.day||undefined)}
},true);
