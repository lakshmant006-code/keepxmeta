/* ---------- Smart prompts for the chat: questions worth asking yourself, drawn from what you have kept ---------- */
/* They change with the time of day and with what is there: journal check-ins, notes and photos. Answers are worked out on the phone from your own entries. */
const SP_POS=['Happy','Hopeful','Loved','Excited','Peaceful','Grateful','Proud','Content','Inspired','Connected','Relieved','Calm','Curious'];
const SP_NEG=['Anxious','Lonely','Confused','Sad','Frustrated','Overwhelmed','Disappointed','Vulnerable','Uncertain','Tired','Hurt','Restless'];
const spJ=()=>all().filter(m=>m.type==='journal'&&m.j).sort((a,b)=>b.ts-a.ts);
const spRange=(q)=>{const P=chatParse(q);if(P.range)return{r:P.range,label:P.label};return{r:[+TODAY-6*864e5,+TODAY+864e5-1],label:'this week'}};
const spTop=(arr,n)=>{const c={};arr.forEach(x=>{if(x)c[x]=(c[x]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,n||3)};
const SP_STOP=new Set('to a an the of and or for with in on at i my me be is am are was it that this feel more less really want need very so some something someone have has had get got just can not no do find people days like make feeling lately while'.split(' '));
const spWords=t=>String(t||'').toLowerCase().replace(/[^a-z' ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!SP_STOP.has(w));
const spChips=(...a)=>a.filter(Boolean);
const spMood=m=>{const j=m.j||{};const pos=(j.feel||[]).filter(f=>SP_POS.includes(f)).length,neg=(j.feel||[]).filter(f=>SP_NEG.includes(f)).length;return pos-neg+(m.text?cpMood(m.text).score*.5:0)};
/* what to suggest, right now */
function spPrompts(){
  const hr=new Date().getHours(),J=spJ(),out=[],add=(i,t,q)=>out.push({i,t,q:q||t});
  const recent=J.filter(m=>+TODAY-m.ts<=7*864e5),low=recent.some(m=>spMood(m)<0);
  const todayDone=J.some(m=>dk(new Date(m.ts))===dk(TODAY));
  if(!todayDone)add('jrn',hr<11?'Help me check in this morning':hr>=18?'How was today, really?':'Check in with how I feel');
  if(hr<11)add('cal','What am I looking forward to?');
  if(low)add('jrn','Something to lift my mood','__good');
  if(J.length>=2)add('chart','How have I been feeling lately?');
  if(J.length>=3)add('cal','When was I happiest?');
  if(J.some(m=>m.j.want||m.j.desire))add('user','What do I keep wanting?');
  if(typeof jrLetterPick==='function'&&jrLetterPick())add('quote','What did past me want?');
  if(J.some(m=>(m.j.feel||[]).includes('Lonely')||(m.j.feel||[]).includes('Anxious')))add('chart','When do I feel most anxious or lonely?');
  add('user','Who makes me smile?');
  out.splice(Math.min(1,out.length),0,{i:'quote',t:'A thought for you',q:'__thought'});
  return out;
}
{const orig=chatSmart;window.chatSmart=function(){
  const base=orig.apply(this,arguments),sp=spPrompts().slice(0,4),seen=new Set(sp.map(x=>x.q));
  return sp.concat(base.filter(x=>!seen.has(x.q)).slice(0,4));
}}
/* the answers */
const SP_I={
  checkin:/\b(check.?in|how was today|help me check|how do i feel)\b/i,
  feeling:/\bhow (have|am|was) i (been )?(feeling|doing)|\bmy mood\b|\bhow('s| is| was) my (week|month)\b/i,
  happiest:/\b(happiest|best day|most happy|when was i happy)\b/i,
  wants:/\bwhat do i (keep )?(want|wanting|desire|crave)\b|\bmy desires?\b/i,
  needs:/\bwhat do i (keep )?need(ing)?\b/i,
  ahead:/\blooking forward|what am i (excited|looking)|what('s| is) ahead\b/i,
  past:/\bpast me\b|\bwhat did i want\b|\bletter from\b/i,
  when:/\bwhen do i (?:usually |most )?feel (?:most )?(\w+)(?: or (\w+))?/i,
  smile:/\bwho makes me (smile|happy)\b|\bwho do i (love|enjoy)\b/i
};
const spA=(text,more,cards,chips)=>({text,more:more||[],cards:cards||[],chips:chips||[]});
function spAnswer(q){
  const J=spJ();
  if(SP_I.checkin.test(q))return spA('Let us check in. It takes a minute, and even three answers count.',[],[],[{t:'Open my journal',act:'jr'},{t:'Just talk',s:'I want to talk'}]);
  if(SP_I.feeling.test(q)){
    const {r,label}=spRange(q),E=J.filter(m=>m.ts>=r[0]&&m.ts<=r[1]);
    if(!E.length)return spA(`You have not done a check-in ${label} yet, so I do not have much to go on.`,['A short one would help me see how you have been.'],[],[{t:'Open my journal',act:'jr'}]);
    const top=spTop(E.flatMap(m=>m.j.feel||[]),3),avg=E.reduce((a,m)=>a+(m.j.str||0),0)/E.length,sum=E.reduce((a,m)=>a+spMood(m),0);
    const more=[];
    if(sum<-1)more.push('It sounds like it has been heavy. You do not have to carry it alone. Would you like to talk about it?');
    else if(sum>1)more.push('That is a lot of good in there. What do you think has been helping?');
    else more.push('A mix, which is very human. Which of these do you want to hold on to?');
    return spA(`${label.charAt(0).toUpperCase()+label.slice(1)} you checked in ${E.length} ${E.length===1?'time':'times'}. The feelings that came up most were ${chList(top.map(t=>t[0].toLowerCase()))}, at about ${avg.toFixed(0)}/10.`,more,E.slice(0,2).map(m=>chatCard([m])),spChips(sum<-1&&{t:'I want to talk',s:'I want to talk about it'},sum<-1&&{t:'Breathe with me',act:'breathe'},{t:'Something to lift my mood',s:'__good'}));
  }
  if(SP_I.happiest.test(q)){
    const days={};all().filter(m=>m.text||m.j).forEach(m=>{const k=dk(new Date(m.ts)),s=m.j?spMood(m)*1.5:cpMood(m.text).score;days[k]=(days[k]||0)+s});
    const best=Object.entries(days).sort((a,b)=>b[1]-a[1])[0];
    if(!best||best[1]<=0)return spA('I cannot tell yet. Write a little about your days and I will find the brightest one for you.',[],[],[{t:'Open my journal',act:'jr'}]);
    const k=best[0],[y,mo,d]=k.split('-').map(Number),L=byDay[k]||[],t=L.find(x=>x.text);
    return spA(`The happiest-sounding day I can find is <b>${fullDay(new Date(y,mo-1,d))}</b>.`,[t?`You wrote: “${esc(chSnip(t.text,140))}”`:'',`${L.length} ${L.length===1?'instant':'instants'} kept that day.`].filter(Boolean),[chatCard(L)],[{t:'Open that day',d:k}]);
  }
  if(SP_I.wants.test(q)||SP_I.needs.test(q)){
    const need=!SP_I.wants.test(q)&&SP_I.needs.test(q),f=need?['need']:['want','desire'];
    const T=J.flatMap(m=>f.map(k=>m.j[k]).filter(Boolean)),words=spTop(T.flatMap(spWords),4).filter(w=>w[1]>=2||T.length<4);
    if(!T.length)return spA(`I do not have a check-in that says what you ${need?'need':'want'} yet.`,[],[],[{t:'Open my journal',act:'jr'}]);
    const norm=t=>t.toLowerCase().replace(/[^a-z ]/g,'').trim(),rep=spTop(T.map(norm),1)[0];
    const last=T.slice(0,3).map(t=>`“${esc(chSnip(t,80))}”`);
    if(rep&&rep[1]>=2){const orig=T.find(t=>norm(t)===rep[0]);return spA(`You have written “${esc(chSnip(orig,90))}” ${rep[1]} times now.`,[`Lately: ${chList(last)}.`,'When something keeps coming back, it usually matters. What would a first step toward it look like?'],[],[{t:'Open my journal',act:'jr'}]);}
    return spA(words.length?`You keep coming back to ${chList(words.slice(0,3).map(w=>w[0]))}.`:`Here is what you wrote most recently about what you ${need?'need':'want'}.`,[`Lately: ${chList(last)}.`,'Which of these is within reach this week?'],[],[{t:'Open my journal',act:'jr'}]);
  }
  if(SP_I.ahead.test(q)){
    const L=J.filter(m=>m.j.look).slice(0,3);
    if(!L.length)return spA('You have not written about what you are looking forward to yet. What is something, even small?',[],[],[{t:'Open my journal',act:'jr'}]);
    return spA(`You are looking forward to ${chList(L.map(m=>esc(chSnip(m.j.look,70))))}.`,['Holding on to things like that matters, especially on the heavy days.'],[],[{t:'Another one',s:'What did past me want?'}]);
  }
  if(SP_I.past.test(q)){
    const m=typeof jrLetterPick==='function'&&jrLetterPick();
    if(!m)return spA('I do not have a journal entry old enough for a letter yet. Give it a month.',[],[],[{t:'Open my journal',act:'jr'}]);
    return spA(`${jrAgo(m.ts).charAt(0)+jrAgo(m.ts).slice(1).toLowerCase()}, you wrote: “${esc(jrQuote(m.j))}”`,['And today? Has it changed?'],[],[{t:'Answer it',act:'jr'}]);
  }
  const mw=q.match(SP_I.when);
  if(mw||/when do i (usually |most )?feel (most )?(anxious|lonely)/i.test(q)){
    const wanted=(mw?[mw[1],mw[2]]:['anxious','lonely']).filter(Boolean).map(w=>w.toLowerCase()).filter(w=>!['most','usually','anxious,'].includes(w));
    const E=J.filter(m=>(m.j.feel||[]).some(f=>wanted.includes(f.toLowerCase())));
    if(E.length<3)return spA(`I only have ${E.length} check-in${E.length===1?'':'s'} with ${chList(wanted)} so far, which is not enough to see a pattern. Keep checking in and I will get better at it.`,[],[],[{t:'Open my journal',act:'jr'}]);
    const DN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],top=spTop(E.map(m=>DN[new Date(m.ts).getDay()]),2);
    return spA(`You feel ${chList(wanted)} most often on ${chList(top.map(t=>t[0]+'s'))}. That showed up in ${E.length} check-ins.`,['Noticing when it happens makes it easier to be ready for it. Is there something about those days?'],[],[{t:'I want to talk',s:'I want to talk about it'}]);
  }
  if(SP_I.smile.test(q)){
    const pos=all().filter(m=>(m.type==='photo'||m.type==='video')&&((m.text&&cpMood(m.text).score>0)||m.who)),c={};
    pos.forEach(m=>chNames(m).forEach(n=>{c[n]=(c[n]||0)+(m.text&&cpMood(m.text).score>0?2:1)}));
    const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,3);
    if(!top.length)return spA('I do not know yet. Tag people in your photos and write what you feel, and I will notice who lifts you.',[],[],[]);
    return spA(`Going by what you kept, the people around your brighter moments are ${chList(top.map(t=>esc(chPN(t[0]))))}.`,['I can only tell from your photos and words, so tell me if I have missed someone.'],[],top.slice(0,2).map(t=>({t:'Photos with '+chPN(t[0]),s:'Photos with '+chPN(t[0])})));
  }
  return null;
}
{const o=window.cpRespond;window.cpRespond=function(q){const t=String(q||'').trim();if(t==='__thought'){const p=window.thPrompt?thPrompt():{t:'What happened today that deserved a photo but did not get one?'};window.__thLast=p.t;return spA(p.t,[],[],[{t:'Another thought',s:'__thought'},{t:'Keep this thought',act:'kt'}].concat(p.d?[{t:'See that day',d:p.d}]:[]))}if(t&&t.length>3&&!/^__/.test(t)){try{const A=spAnswer(t);if(A)return A}catch(e){}}return o?o.apply(this,arguments):null}}
document.addEventListener('click',e=>{const b=e.target.closest('#cb [data-act="jr"]');if(!b)return;e.stopPropagation();closeChat();setTimeout(()=>{openAdd();setTimeout(()=>setMode('journal'),150)},250)},true);

document.addEventListener('click',e=>{const b=e.target.closest('#cb [data-act="kt"]');if(!b)return;e.stopPropagation();const t=window.__thLast;closeChat();setTimeout(()=>jrKeepThought(t),250)},true);
