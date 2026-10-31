/* ---------- Companion: Keep talks with you, not just at you ---------- */
/* It reads what you kept (notes, voice transcripts, captions) and what you type here, notices how the day sounds, and answers like a kind friend would.
   This is all done by word rules on the phone, not by a language model, and nothing leaves the phone. It is not therapy, and it says so when it matters. */
const CP_NEG2='fired|laid off|depressed|hopeless|worthless|heartbroken|devastated|miserable|grief|funeral|passed away|died|broke up|breakup|panic|terrified|furious|ashamed|rejected|awful|terrible|worst|can.t cope|give up|crying|cried|humiliated|betrayed|abandoned';
const CP_NEG1='sad|hurt|upset|down|tired|exhausted|stressed|anxious|anxiety|worried|nervous|scared|lonely|alone|angry|mad|annoyed|frustrated|guilty|failed|hate|bad day|overwhelmed|burned out|drained|stuck|lost|empty|numb|sick|pain|ignored|left out|embarrassed|disappointed';
const CP_POS='happy|great|amazing|love|loved|proud|grateful|thankful|excited|fun|wonderful|best|laughed|laughing|smile|smiled|joy|relieved|celebrate|celebrated|won|promoted|hired|beautiful|good day|peaceful|calm|lucky|blessed|cozy|kind|sweet|cute|delicious|thrilled';
const CP_EMO={sad:'sad|depressed|heartbroken|crying|cried|grief|miserable|down|hopeless|empty|numb|devastated|disappointed',anxious:'anxious|anxiety|panic|scared|terrified|worried|stressed|overwhelmed|nervous',angry:'angry|furious|mad|hate|annoyed|frustrated|betrayed',lonely:'lonely|alone|isolated|ignored|left out|abandoned|no one',tired:'exhausted|tired|burned out|drained',shame:'ashamed|guilty|failed|embarrassed|humiliated|stupid|worthless',joy:'happy|excited|proud|grateful|thankful|thrilled|relieved|amazing|wonderful|love|loved|joy'};
const CP_TOPIC={work:'fired|laid off|job|boss|work|interview|career|quit|manager|coworker|promotion|promoted|hired',love:'breakup|broke up|girlfriend|boyfriend|partner|date|ex|divorce|crush|relationship',loss:'died|passed away|funeral|grief|miss(ed|ing)? (him|her|them|you)|lost (my|a)',school:'exam|test|grade|class|professor|school|homework|thesis',health:'sick|hospital|pain|diagnos|doctor|surgery|ill\\b',money:'rent|bills|debt|money|broke|afford'};
const CP_CRISIS=/\b(kill myself|suicid|end my life|want to die|wanna die|don.t want to (be here|live)|hurt myself|self.?harm|better off (dead|without me)|no reason to live)\b/i;
const CP_RE=(s,f)=>new RegExp('\\b('+s+')\\b',f||'g');
const cpNegate=(t,i)=>/\b(not|n.t|never|no|hardly)\s+(\w+\s+)?$/.test(t.slice(Math.max(0,i-18),i));
function cpMood(text){
  const t=' '+String(text||'').toLowerCase().replace(/[’']/g,"'")+' ';let score=0;const emos={},topics=[];
  const hit=(re,w)=>{let m;re.lastIndex=0;while((m=re.exec(t))){const neg=cpNegate(t,m.index);score+=neg?-w:w}};
  hit(CP_RE(CP_NEG2),-2);hit(CP_RE(CP_NEG1),-1);hit(CP_RE(CP_POS),1);
  for(const[k,v]of Object.entries(CP_EMO)){const re=CP_RE(v),m=t.match(re);if(m)emos[k]=m.length}
  for(const[k,v]of Object.entries(CP_TOPIC)){if(CP_RE(v,'i').test(t))topics.push(k)}
  const emo=Object.entries(emos).sort((a,b)=>b[1]-a[1])[0];
  return{score,emo:emo?emo[0]:(score<=-1?'sad':score>=2?'joy':''),topics,crisis:CP_CRISIS.test(t)};
}
/* what you have given Keep lately: notes, voice transcripts, captions, in order */
function cpRecent(days){
  const from=+TODAY-(days-1)*864e5;
  return all().filter(m=>m.ts>=from&&m.text&&String(m.text).trim().length>3&&['text','voice','photo','video','quote','person','place'].includes(m.type)).sort((a,b)=>a.ts-b.ts);
}
const cpNames=txt=>{const pe=chatPeople(),out=[];pe.forEach((full,f)=>{if(f.length>=3&&/^[A-Z]/.test(firstName(full))&&!CH_WORDS.has(f)&&new RegExp('\\b'+f+'\\b','i').test(txt))out.push(chPN(full))});return out};
const cpPick=(a,s)=>a[Math.abs(s|0)%a.length];
let cpTurn=0,cpEmo='',cpTopic='';
const CPK='kept.cp';
const cpGet=()=>{try{return JSON.parse(localStorage.getItem(CPK)||'{}')}catch(e){return{}}};
const cpPut=o=>{try{localStorage.setItem(CPK,JSON.stringify(o))}catch(e){}};
/* a happy thing from before: something you wrote that sounded good, or a photo with a kind caption */
function cpGood(){
  const t0=+TODAY,c=all().filter(m=>m.ts<t0-2*864e5&&m.text&&(m.type==='photo'||m.type==='text'||m.type==='voice'||m.type==='video')).map(m=>({m,s:cpMood(m.text).score})).filter(x=>x.s>=1).sort((a,b)=>b.s-a.s||b.m.ts-a.m.ts);
  const day=cpPick(c.length?c:[{m:null}],Math.floor(+TODAY/864e5)+cpTurn);return day.m;
}
function cpGoodReply(){
  const m=cpGood();
  if(!m)return{text:'I do not have a happy moment of yours to point to yet. Keep one small good thing today, even a coffee, and I will remember it for the harder days.',more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  const when=chRel(new Date(m.ts));
  return{text:`Here is one. ${esc(when)}${m.type==='photo'?' you kept a photo and wrote':' you wrote'}: “${esc(chSnip(m.text,140))}”`,more:['That was you. It can be you again.'],cards:[chatCard([m])],chips:[{t:'Another one',s:'__good'},{t:'Breathe with me',act:'breathe'},{t:'Keep this as a note',act:'savenote'}]};
}
/* the words, by feeling. {w} is a short thing you said, {n} a person you mentioned */
const CP_SAY={
  sad:{open:['That sounds really heavy.','I am sorry. That is a lot to carry.','That sounds painful, and it makes sense that you feel low.'],
    next:['You do not have to fix anything tonight. What is weighing on you the most right now?','I am here. Do you want to tell me more, or would a small good memory help?','Take your time. What part of it is hurting most?']},
  anxious:{open:['That sounds stressful. Your mind is working hard.','It makes sense that you feel on edge.','That is a lot to hold at once.'],
    next:['Let us slow it down. What is the one thing worrying you most right now?','Would it help to breathe for a minute first, or to say what is on your mind?','You do not have to solve it all today. What is the first small step?']},
  angry:{open:['That would make me angry too.','Of course you are upset. That does not sound fair.','I hear how frustrated you are.'],
    next:['What happened, from your side?','Do you want to vent it out here? I will not judge.','What do you wish had gone differently?']},
  lonely:{open:['I am glad you said that out loud.','Feeling alone is hard, and you are not wrong to feel it.','That sounds lonely. Thank you for telling me.'],
    next:['Who is someone you would like to hear from right now?','You are not alone while we are talking. What has the day been like?','Is it a tonight feeling, or has it been building for a while?']},
  tired:{open:['You sound worn out.','That sounds exhausting.','No wonder you are drained.'],
    next:['What took the most out of you today?','Is there anything you can put down until tomorrow?','Be kind to yourself tonight. Rest counts.']},
  shame:{open:['You are being hard on yourself, and I would like to be a bit kinder to you.','One hard thing does not define you.','That sounds like it stings.'],
    next:['What would you say to a friend who told you this?','What happened? You can tell me the whole thing.','You are still the same person who kept all of these good moments.']},
  joy:{open:['I love hearing that!','That is wonderful. You deserve it.','Yes! I am happy for you.'],
    next:['Tell me more. What made it so good?','Let us keep it so you can find it again. Want me to save this?','Who do you want to share it with?']},
  '':{open:['I hear you.','Thank you for telling me.','I am listening.'],next:['Tell me more.','How did that feel?','What is on your mind most right now?']}
};
const CP_TOPICLINE={work:'Work stuff can shake your whole sense of things, not just the day.',love:'Matters of the heart are some of the hardest.',loss:'Loss takes its own time, and there is no right way through it.',school:'The pressure around school can feel enormous.',health:'Health worries are scary. Please look after yourself and talk to someone you trust about it.',money:'Money stress is real, and it follows you around.'};
function cpReply(q,m){
  const S=CP_SAY[m.emo]||CP_SAY[''],names=cpNames(q);cpTurn++;
  const first=cpTurn<=1;
  const text=first?cpPick(S.open,q.length+cpTurn):cpPick(['Thank you for telling me more.','I am still here.','That makes sense.'],cpTurn);
  const more=[];
  if(first&&m.topics[0]&&CP_TOPICLINE[m.topics[0]])more.push(CP_TOPICLINE[m.topics[0]]);
  if(first&&names.length&&m.emo!=='joy')more.push(`You mentioned ${chList(names.slice(0,2))}. Sometimes being near someone helps, even a little.`);
  more.push(cpPick(S.next,q.length+cpTurn));
  const bad=m.emo&&m.emo!=='joy';
  const chips=bad?[{t:'Breathe with me',act:'breathe'},{t:'Show me something good',s:'__good'},{t:'Keep this as a note',act:'savenote'}]:[{t:'Keep this as a note',act:'savenote'},{t:'See a happy memory',s:'__good'}];
  return{text,more,cards:[],chips};
}
function cpCrisis(){
  return{text:'I am really glad you told me. What you are feeling matters, and you deserve real support right now.',
    more:['I am a notebook, not a person, and I cannot help in an emergency. If you might act on these thoughts or you are in danger, please call or text <b>988</b> (US and Canada), or your local emergency number, right now.','If you can, tell someone near you how you are feeling. You do not have to say it perfectly. Would you like to reach out to someone you trust?'],
    cards:[],chips:[{t:'Call 988',act:'tel'},{t:'Breathe with me',act:'breathe'},{t:'I am okay for now',s:'__ok'}]};
}
const CP_HI=/^(hi|hey|hello|yo|good (morning|evening|afternoon)|hiya)\b/i,CP_THX=/^(thanks|thank you|thx|ty)\b/i,CP_BYE=/^(bye|goodnight|good night|see you|night)\b/i;
function cpIsAsk(q){
  if(/\?\s*$/.test(q))return !/^(why am i|why do i|how do i feel|am i)\b/i.test(q);
  if(/^(who|what|where|when|how many|how much|show|find|list|open|photos?|my |did i|do i|any|which)\b/i.test(q))return true;
  const P=chatParse(q);return !!(P.range||P.types.length)&&q.split(/\s+/).length<=6&&cpMood(q).score===0;
}
/* called by the chat for everything you type: returns an answer, or null to let the usual search handle it */
window.cpRespond=q=>{
  q=q.trim();
  if(q==='__good')return cpGoodReply();
  if(q==='__ok')return{text:'I am glad. I am here whenever you want to talk.',more:[],cards:[],chips:[{t:'Show me something good',s:'__good'}]};
  const m=cpMood(q);
  if(m.crisis)return cpCrisis();
  if(CP_HI.test(q)&&q.split(/\s+/).length<4)return{text:cpPick(['Hi. How are you really doing today?','Hey you. How is your day going?','Hello. I am glad you are here. How are you feeling?'],cpTurn++),more:[],cards:[],chips:[{t:'Good',s:'I feel good today'},{t:'Not great',s:'I am not feeling great'},{t:'What happened today',s:'What happened today'}]};
  if(CP_THX.test(q)&&q.split(/\s+/).length<4)return{text:'Always. I am glad to be here with you.',more:[],cards:[],chips:[]};
  if(CP_BYE.test(q))return{text:'Take care of yourself. I will be here when you come back.',more:[],cards:[],chips:[]};
  if(cpIsAsk(q)&&!m.emo)return null;
  if(!m.emo&&m.score===0&&cpTurn===0&&q.split(/\s+/).length<4)return null;
  cpEmo=m.emo||cpEmo;
  return cpReply(q,m);
};
/* a caring first line, when what you kept today sounds hard (or very good) */
window.cpOpening=()=>{
  const st=cpGet(),today=dk(TODAY);if(st.opened===today)return null;
  const rec=cpRecent(2),txt=rec.map(m=>m.text).join(' . ');if(!txt)return null;
  const m=cpMood(txt);
  if(m.crisis){st.opened=today;cpPut(st);return cpCrisis()}
  if(m.score<=-2&&m.emo!=='joy'){
    st.opened=today;cpPut(st);
    const names=cpNames(txt),quote=rec.find(x=>cpMood(x.text).score<0)||rec[rec.length-1];
    const topic=m.topics[0]&&CP_TOPICLINE[m.topics[0]];
    return{text:`I read what you kept today. It sounds like a really hard day.`,
      more:[quote?`You wrote${chRel(new Date(quote.ts))==='Today'?'':' '+chRel(new Date(quote.ts)).toLowerCase()}: “${esc(chSnip(quote.text,110))}”`:'',topic||'',names.length?`I also see ${chList(names.slice(0,2))} in what you kept. Sometimes being around people helps, even when it is heavy.`:'','How are you holding up right now?'].filter(Boolean),
      cards:[],chips:[{t:'I want to talk',s:'I want to talk about it'},{t:'Breathe with me',act:'breathe'},{t:'Show me something good',s:'__good'}]};
  }
  if(m.score>=3){st.opened=today;cpPut(st);return{text:'Your day sounds good! I love reading what you kept.',more:['Want to remember what made it special?'],cards:[],chips:[{t:'Keep a note about it',act:'add'},{t:'See another happy day',s:'__good'}]}}
  return null;
};
/* breathing: a circle that grows and shrinks with you */
function cpBreathe(body){
  const el=document.createElement('div');el.className='cbreath';el.innerHTML='<div class="cbo"><i></i></div><b>Breathe in</b><small>Follow the circle. Three slow breaths.</small>';
  body.appendChild(el);const o=el.querySelector('i'),lab=el.querySelector('b'),M=window.Motion;let n=0;chatPin&&chatPin();
  const run=async()=>{
    for(n=0;n<3;n++){
      lab.textContent='Breathe in';if(M)await M.animate(o,{scale:[1,1.7]},{duration:4,ease:'easeInOut'}).finished;else await chWait(800);
      lab.textContent='Hold';await chWait(M?1500:200);
      lab.textContent='Breathe out';if(M)await M.animate(o,{scale:[1.7,1]},{duration:6,ease:'easeInOut'}).finished;else await chWait(800);
    }
    lab.textContent='Well done.';el.querySelector('small').textContent='How do you feel now?';
    const r=document.createElement('div');r.className='cchips';r.innerHTML=['A little better','About the same','Still heavy'].map(t=>`<button class="cchip" data-s="${t}">${t}</button>`).join('');el.appendChild(r);chatPin&&chatPin();
  };run();
}
/* the chat's own chips for these actions, plus a heart for any bubble you double tap */
document.addEventListener('click',e=>{
  const b=e.target.closest('#cb [data-act]');if(!b)return;const a=b.dataset.act,body=b.closest('.cbody');
  if(a==='breathe'){e.stopPropagation();if(body){b.closest('.cchips')&&b.closest('.cchips').remove();cpBreathe(body)}}
  else if(a==='tel'){e.stopPropagation();location.href='tel:988'}
  else if(a==='savenote'){e.stopPropagation();const last=[...document.querySelectorAll('#cb .cm.u .bub')].pop();if(last){const o={id:Date.now(),ts:Date.now(),type:'text',text:last.textContent};user.push(o);persistUser();refresh();toast('Kept as a note');b.disabled=true;b.textContent='Kept'}}
},true);
document.addEventListener('dblclick',e=>{
  const bub=e.target.closest('#cb .cm .bub');if(!bub||!window.Motion)return;const r=bub.getBoundingClientRect(),h=document.createElement('i');h.className='cheart';h.textContent='♥';
  Object.assign(h.style,{left:(e.clientX-12)+'px',top:(e.clientY-12)+'px'});document.body.appendChild(h);try{navigator.vibrate&&navigator.vibrate(10)}catch(_){}
  Motion.animate(h,{y:[0,-60],scale:[.4,1.4,1],opacity:[1,1,0]},{duration:.9,ease:'easeOut'}).finished.then(()=>h.remove(),()=>h.remove());
});
/* sending bounces the arrow */
{const sb=document.getElementById('sendB');if(sb&&window.Motion)sb.addEventListener('click',()=>Motion.animate(sb,{scale:[1,.82,1.08,1]},{duration:.35}))}
