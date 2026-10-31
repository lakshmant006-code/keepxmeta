/* ---------- Meta AI style chat: a collapsed question card, visible working steps with sources, and a calmer composer ---------- */
const MC_STAR='<svg class="mcs" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><defs><linearGradient id="mcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0866FF"/><stop offset="1" stop-color="#B14DFF"/></linearGradient></defs><path d="M12 2.5l1.9 5.4 5.4 1.9-5.4 1.9L12 17.1l-1.9-5.4-5.4-1.9 5.4-1.9z" fill="url(#mcg)"/><path d="M18.5 15l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="url(#mcg)" opacity=".8"/></svg>';
let mcMode='auto';
const MCN={auto:'Auto',search:'Search',talk:'Talk'};
/* what Keep says it is doing while it works, and which days it looked at */
window.chWork=(q,pre)=>{
  let steps;
  if(pre||(window.cpMood&&cpMood(q).emo&&!(window.cpIsAsk&&cpIsAsk(q)))){
    steps=[['Reading what you kept','Your notes and captions from the last few days'],['Thinking about what you said','Taking it slowly']];
  }else{
    let P=null,days=[];try{P=chatParse(q);const res=chatFind(q,P);const seen=new Set();res.forEach(m=>{const k=dk(new Date(m.ts));if(!seen.has(k)){seen.add(k);days.push(k)}})}catch(e){}
    const what=P&&P.toks&&P.toks.length?'“'+P.toks.slice(0,3).join(' ')+'”':P&&P.label?P.label:'your memories';
    steps=[['Searching your memories','Looking for '+what,days.slice(0,3)],['Reading what you wrote',days.length?`${days.length} ${days.length===1?'day':'days'} matched`:'Nothing matched yet'],['Putting it together','Only from what you kept']];
  }
  const chip=k=>{const L=byDay[k]||[],m=L.find(x=>(x.type==='photo'||x.type==='video')&&src(x)),[y,mo,d]=k.split('-').map(Number);return `<span class="cwc">${m?`<i style="background-image:url(${src(m)})"></i>`:''}${MS[mo-1]} ${d}</span>`};
  const html=`<div class="cwork"><div class="cwr">${MC_STAR}<b></b></div><div class="cwd"></div><div class="cwch"></div></div>`;
  return{html,async run(el,total){
    const t=el.querySelector('.cwr b'),d=el.querySelector('.cwd'),ch=el.querySelector('.cwch'),per=Math.max(380,total/steps.length);
    for(const [a,b,days] of steps){
      t.textContent=a;d.textContent=b;ch.innerHTML=days&&days.length?days.map(chip).join(''):'';
      if(window.Motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches)Motion.animate([t,d,...ch.children],{opacity:[0,1],y:[6,0]},{type:'spring',stiffness:420,damping:30,delay:Motion.stagger?Motion.stagger(.05):0});
      await chWait(per);
    }
  }};
};
/* chrome: new chat button, tidier composer, a stop button while it replies */
(function(){
  const hdr=$('#chat .hdr'),bar=$('#bar2'),q2=$('#q2'),sb=$('#sendB');if(!hdr||!bar||!q2||!sb)return;
  const nb=document.createElement('button');nb.className='ib';nb.id='chatNew';nb.setAttribute('aria-label','New chat');
  nb.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5"/><path d="M17.5 3.5a1.8 1.8 0 0 1 2.6 2.6L12 14.2 8.5 15l.8-3.5z"/></svg>';
  hdr.appendChild(nb);nb.onclick=()=>{chPend='';cpTurn=0;sugg();q2.value=''};
  bar.classList.add('mcomp');q2.placeholder='Reply…';
  const tools=document.createElement('div');tools.className='mct';
  tools.innerHTML=`<button class="mcp" id="mcPlus" aria-label="Add an instant"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button><span class="mcsp"></span><button class="mcm" id="mcMode" aria-label="Chat mode">${MCN[mcMode]}</button>`;
  bar.appendChild(tools);tools.appendChild(sb);
  $('#mcPlus').onclick=()=>{closeChat();openAdd()};
  $('#mcMode').onclick=e=>{const k=Object.keys(MCN);mcMode=k[(k.indexOf(mcMode)+1)%k.length];e.target.textContent=MCN[mcMode];toast(mcMode==='auto'?'Auto: answers questions and listens':mcMode==='search'?'Search: only looks through your memories':'Talk: just listens and replies kindly');try{navigator.vibrate&&navigator.vibrate(6)}catch(_){}};
  /* modes steer the replies */
  const orig=window.cpRespond;
  window.cpRespond=q=>{
    if(mcMode==='search'){return window.cpMood&&cpMood(q).crisis?orig(q):null}
    const r=orig?orig(q):null;
    if(r||mcMode!=='talk')return r;
    return cpReply(q,{emo:cpEmo||'',topics:[],score:0});
  };
  /* stop: skip the animations and show the answer now */
  let busy=0;const upd=()=>sb.classList.toggle('busy',busy>0);
  const cr=window.chatReply;window.chatReply=async function(){busy++;upd();try{return await cr.apply(this,arguments)}finally{busy--;if(!busy)window.chSkip=false;upd()}};
  sb.addEventListener('click',e=>{if(busy>0){e.stopImmediatePropagation();e.preventDefault();window.chSkip=true}},true);
  /* a question you have asked collapses to a card; tap it to read it all */
  new MutationObserver(()=>document.querySelectorAll('#cb .cm.u .bub:not([data-x])').forEach(b=>{
    b.dataset.x='1';q2.placeholder='Reply…';if(b.textContent.length<60)return;b.classList.add('cl');
    const c=document.createElement('button');c.className='mcc';c.setAttribute('aria-label','Show all');c.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    b.appendChild(c);b.onclick=()=>b.classList.toggle('cl');
  })).observe($('#cb'),{childList:true,subtree:true});
  /* once per visit, say plainly where the answers come from */
  let told=false;new MutationObserver(()=>{if(told||!$('#chat').classList.contains('on'))return;told=true;
    setTimeout(()=>{const t=document.createElement('div');t.className='mctoast';t.innerHTML='<span><b>Replies are made on this phone</b>From what you kept. Not a cloud AI, and not professional advice.</span><button id="mcLearn">Learn more</button>';$('#chat').appendChild(t);
      $('#mcLearn').onclick=()=>{t.remove();openSheet(`<div class="dh"><h1>How Keep answers</h1><p>On this phone, from what you kept</p></div><div class="pb" style="padding-top:12px"><p class="tr" style="font-size:15px;color:var(--ink)">Keep reads your notes, captions and voice transcripts and answers with simple rules. It does not send them to a server or to an AI model, so it can miss things or get tone wrong. It is not a therapist or a doctor.</p><p class="tr" style="font-size:15px;color:var(--ink)">If you are in danger or thinking of hurting yourself, call or text 988 (US and Canada) or your local emergency number.</p></div>`)};
      setTimeout(()=>t.remove(),7000)},900)}).observe($('#chat'),{attributes:true,attributeFilter:['class']});
})();
