/* ---------- Chat: ask your memories like a conversation ---------- */
/* Everything runs on the phone. Questions are read with simple rules (dates like "last week", kinds like "voice notes", names and words),
   not by a language model, so answers always come from what was kept and show the original. */
const CH_WORDS=new Set('the a an of in on at to and or for with who what where when which is was were did do i me my met about from that this it happened show tell find any all only please can you had have get got give kept keep today yesterday week month year ago last next latest recent weekend during'.split(' '));
const CH_TYPES=[[/\b(voice( notes?)?|recordings?|audio)\b/,'voice','voice notes'],[/\b(photos?|pictures?|pics?|selfies?)\b/,'photo','photos'],[/\bvideos?\b/,'video','videos'],[/\bnotes?\b/,'text','notes'],[/\bquotes?\b/,'quote','quotes'],[/\b(people|persons?|contacts?)\b/,'person','people'],[/\b(places?|locations?)\b/,'place','places'],[/\b(files?|documents?|tickets?)\b/,'file','files']];
const chNames=m=>[...new Set([m.who].concat(Array.isArray(m.people)?m.people:[]).filter(x=>typeof x==='string'&&x.trim().length>1))];
const chPN=n=>/^[A-Z]/.test(n)?firstName(n):n;
const chDay=n=>new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()+n);
const chRel=d=>{const df=Math.round((+chDay(0)-+new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);return df===0?'Today':df===1?'Yesterday':longDay(d)+(d.getFullYear()!==TODAY.getFullYear()?', '+d.getFullYear():'')};
const chWait=ms=>new Promise(r=>setTimeout(r,introReduced()?Math.min(ms,30):ms));
/* what the question is about: a time range, kinds of memory, and the words left over */
function chatParse(q){
  let rest=' '+q.toLowerCase().replace(/[“”"?!.,]/g,' ')+' ',range=null,label='',special='';
  const R=(a,b,l)=>{range=[+a,+b+864e5-1];label=l};
  const dow=(TODAY.getDay()+6)%7,Y=TODAY.getFullYear(),M=TODAY.getMonth();
  const dates=parseDate(q);
  if(dates.length){const ds=dates.map(k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)});R(ds.sort((a,b)=>a-b)[0],ds[ds.length-1],'on '+fullDay(ds[ds.length-1]))}
  else if(/\byesterday\b/.test(rest))R(chDay(-1),chDay(-1),'yesterday');
  else if(/\btoday\b/.test(rest))R(chDay(0),chDay(0),'today');
  else if(/\b(a |one )?year ago\b|\blast year today\b/.test(rest))R(new Date(Y-1,M,TODAY.getDate()),new Date(Y-1,M,TODAY.getDate()),'a year ago today');
  else if(/\blast weekend\b/.test(rest)){const sat=chDay(-((TODAY.getDay()+1)%7)-(TODAY.getDay()===6?7:0));R(sat,new Date(sat.getFullYear(),sat.getMonth(),sat.getDate()+1),'last weekend')}
  else if(/\blast week\b/.test(rest))R(chDay(-dow-7),chDay(-dow-1),'last week');
  else if(/\b(this|current) week\b/.test(rest))R(chDay(-dow),chDay(0),'this week');
  else if(/\blast month\b/.test(rest))R(new Date(Y,M-1,1),new Date(Y,M,0),'last month');
  else if(/\b(this|current) month\b/.test(rest))R(new Date(Y,M,1),chDay(0),'this month');
  else if(/\blast year\b/.test(rest))R(new Date(Y-1,0,1),new Date(Y-1,11,31),'last year');
  else if(/\bthis year\b/.test(rest))R(new Date(Y,0,1),chDay(0),'this year');
  else{
    const mi=MN.findIndex((mn,i)=>new RegExp('\\b'+mn.toLowerCase()+'\\b').test(rest)&&(i!==4||/\b(in|during|of) may\b/.test(rest))||new RegExp('\\b(in|during|of) '+MS[i].toLowerCase()+'\\b').test(rest));
    if(mi>=0){const ys=[mi<=M?Y:Y-1,mi<=M?Y-1:Y-2],y=ys.find(y=>all().some(m=>{const d=new Date(m.ts);return d.getFullYear()===y&&d.getMonth()===mi}))||ys[0];R(new Date(y,mi,1),new Date(y,mi+1,0),'in '+MN[mi]+(y!==Y?' '+y:''))}
  }
  const types=[];CH_TYPES.forEach(([re,t,n])=>{if(re.test(rest)){types.push({t,n});rest=rest.replace(re,' ')}});
  if(/\b(busiest|most active|most memories|most moments)\b/.test(rest))special='busiest';
  else if(/\bhow many\b/.test(rest))special='count';
  else if(/\b(latest|most recent|newest|recently|last)\b/.test(rest)&&!range)special='latest';
  const toks=rest.replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(t=>t.length>1&&!CH_WORDS.has(t)&&!/^\d+$/.test(t)&&!MN.some((mn,i)=>mn.toLowerCase()===t||MS[i].toLowerCase()===t));
  return{range,label,types,toks,special};
}
function chatFind(q,P){
  const tset=P.types.length?new Set(P.types.map(x=>x.t)):null;
  let list=all().filter(m=>(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))&&(!tset||tset.has(m.type)));
  if(P.toks.length){
    const sc=[];list.forEach(m=>{const hay=[m.text,m.name,m.who,(m.people||[]).join(' '),m.dur].join(' ').toLowerCase();let s=0;
      P.toks.forEach(t=>{if(hay.includes(t))s+=(m.type==='person'&&(m.name||'').toLowerCase().includes(t))?3:1});if(s)sc.push([s,m])});
    sc.sort((a,b)=>b[0]-a[0]||b[1].ts-a[1].ts);return sc.map(x=>x[1]);
  }
  if(!P.range&&!tset&&P.special!=='busiest'&&P.special!=='latest')return[];
  return list.sort((a,b)=>b.ts-a.ts);
}
/* smart prompts, taken from what this person has actually kept */
function chatSmart(){
  const A=all(),out=[],seen=new Set(),add=(i,t,q)=>{q=q||t;if(!seen.has(q)&&out.length<6){seen.add(q);out.push({i,t,q})}};
  add('cal','What happened today');
  if(byDay[dk(new Date(TODAY.getFullYear()-1,TODAY.getMonth(),TODAY.getDate()))])add('cal','A year ago today');
  const cnt={};A.forEach(m=>{(m.type==='person'?[m.name]:chNames(m)).forEach(n=>{if(n)cnt[n]=(cnt[n]||0)+1})});
  Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,2).forEach(([n],k)=>add('user',k?'Photos with '+chPN(n):'Who is '+chPN(n)+'?'));
  if(A.some(m=>/coffee|cortado|latte|cafe/i.test([m.text,m.name].join(' '))))add('pin','Where did I have coffee?');
  const pl=A.filter(m=>m.type==='place');if(pl[0])add('pin','What was at '+pl[0].name+'?');
  if(A.some(m=>m.type==='voice'))add('mic','My voice notes');
  if(A.some(m=>m.type==='quote'))add('quote','My favorite quotes');
  add('cal','What did I do last week?');add('chart','My busiest day');add('img','My latest photos');
  return out;
}
const chIcon=k=>(ic[k]||ic.txt).replace('width="22" height="22"','width="18" height="18"');
/* a memory card: pictures first, then when, what, and a line about it (like a day in a journal) */
function chatCard(items){
  const m=items[0],k=dk(new Date(m.ts)),day=byDay[k]||[m],ph=day.filter(x=>(x.type==='photo'||x.type==='video')&&src(x));
  let title,desc='';const first=s=>{s=String(s||'').trim();const i=s.search(/[.!?]\s/);return i>8&&i<70?[s.slice(0,i+1),s.slice(i+2)]:[s.length>64?s.slice(0,62)+'…':s,s.length>64?s:'']};
  if(m.type==='person'){title=m.name;desc=m.text||''}else if(m.type==='place'){title=m.name;desc='A place you kept'}
  else if(m.type==='quote'){[title,desc]=first('“'+m.text+'”');if(m.who)desc='Said by '+m.who}
  else if(m.type==='voice'){title=m.text?first(m.text)[0]:'Voice note';desc=m.dur?'Voice note · '+m.dur:'Voice note'}
  else if(m.type==='file'){title=m.name;desc=m.text||'File'}
  else if(m.type==='photo'||m.type==='video'){[title,desc]=m.text?first(m.text):[m.type==='video'?'A video':'A photo',''];if(!desc)desc=chNames(m).length?'With '+chNames(m).join(' and '):(ph.length>1?ph.length+' photos that day':'')}
  else{[title,desc]=first(m.text||'Note')}
  const tiles=[];
  ph.slice(0,2).forEach(p=>tiles.push(`<span class="mt" style="background-image:url(${src(p)})"></span>`));
  const place=day.find(x=>x.type==='place');
  if(place&&tiles.length<3)tiles.push(`<span class="mt map"><i>${chIcon('pin')}</i><small>${esc(place.name)}</small></span>`);
  if(!tiles.length)tiles.push(`<span class="mt ic t-${m.type}">${m.type==='person'?avatar(m.name):chIcon(({voice:'mic',quote:'quote',file:'doc',place:'pin',video:'vid'})[m.type]||'txt')}</span>`);
  if(ph.length>2&&tiles.length<3)tiles.push(`<span class="mt more">+${ph.length-2}</span>`);
  return`<button class="mc" data-d="${k}"><div class="mts">${tiles.join('')}</div><div class="mtm">${chRel(new Date(m.ts))} · ${tstr(m.ts)}</div><div class="mti">${esc(title)}</div>${desc?`<div class="mtd">${esc(desc)}</div>`:''}</button>`;
}
const chBreak=list=>{const c={};list.forEach(m=>c[m.type]=(c[m.type]||0)+1);const nm={photo:['photo','photos'],video:['video','videos'],voice:['voice note','voice notes'],text:['note','notes'],quote:['quote','quotes'],person:['person','people'],place:['place','places'],file:['file','files']};
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([t,n])=>n+' '+nm[t][n===1?0:1]).join(', ')};
/* turn a question into an answer: text, cards and follow-ups */
function chatAnswer(q){
  const P=chatParse(q),res=chatFind(q,P),cards=[],chips=[],plural=(n,a,b)=>n===1?a:b;
  let text,days=[];res.forEach(m=>{const k=dk(new Date(m.ts));let g=days.find(d=>d.k===k);if(!g)days.push(g={k,items:[]});g.items.push(m)});
  const ofKind=P.types.length?P.types.map(x=>x.n).join(' and '):'';
  if(P.special==='busiest'){
    const ks=Object.keys(byDay).filter(k=>!P.range||(+new Date(...k.split('-').map((v,i)=>i===1?v-1:+v))>=P.range[0]&&+new Date(...k.split('-').map((v,i)=>i===1?v-1:+v))<=P.range[1])).sort((a,b)=>byDay[b].length-byDay[a].length);
    if(!ks.length)text='You have not kept anything to compare yet.';
    else{const k=ks[0],[y,mo,d]=k.split('-').map(Number);text=`Your busiest day was <b>${fullDay(new Date(y,mo-1,d))}</b> with ${byDay[k].length} moments: ${chBreak(byDay[k])}.`;cards.push(chatCard(byDay[k]));chips.push({t:'Open that day',d:k})}
  }else if(P.special==='count'){
    text=res.length?`You kept <b>${res.length}</b> ${ofKind||plural(res.length,'moment','moments')}${P.label?' '+P.label:''}${days.length>1?`, across ${days.length} days`:''}.`:`You have not kept any ${ofKind||'moments'}${P.label?' '+P.label:''} yet.`;
    if(res.length){days.slice(0,3).forEach(g=>cards.push(chatCard(g.items)))}
  }else if(!res.length){
    if(P.range||P.types.length){text=`You have not kept ${ofKind?'any '+ofKind:'anything'}${P.label?' '+P.label:''} yet.`;chips.push({t:'Keep something now',act:'add'})}
    else text='Nothing you kept matches that. I would rather say so than guess.';
  }else{
    const top=res[0];
    if(P.range||P.types.length){
      text=`${P.label?'Here is what you kept '+P.label+': ':''}<b>${res.length}</b> ${ofKind?ofKind.replace(/s$/,res.length===1?'':'s'):plural(res.length,'moment','moments')}${days.length>1?` over ${days.length} days`:''}${P.types.length?'':' ('+chBreak(res)+')'}.`;
    }else if(top.type==='person')text=`<b>${esc(top.name)}.</b> ${esc(top.text)}`;
    else if(top.type==='quote')text=`<b>“${esc(top.text)}”</b> ${top.who?esc(top.who)+', ':''}${longDay(new Date(top.ts))}.`;
    else text=`<b>${longDay(new Date(top.ts))}.</b> ${esc(top.text||top.name||'')} <span style="color:var(--mute)">(${days.length} ${plural(days.length,'day','days')})</span>`;
    days.slice(0,4).forEach(g=>cards.push(chatCard(g.items)));
    if(days.length>4)text+=` Showing the latest 4 days.`;
    const who=[...new Set(res.flatMap(m=>m.type==='person'?[]:chNames(m)))][0];
    if(who&&!P.toks.length)chips.push({s:'Photos with '+chPN(who)});
    if(!P.types.length&&res.some(m=>m.type==='photo'))chips.push({s:(P.label?'Photos '+P.label:'My latest photos')});
    if(days.length===1)chips.push({t:'Open that day',d:days[0].k});
  }
  chatSmart().filter(s=>s.q!==q&&!chAsked.has(s.q)&&chips.length<3).forEach(s=>chips.push({s:s.t}));
  return{text,cards,chips:chips.slice(0,3)};
}
/* ---- the conversation ---- */
let chStick=true,chRO=null,chQ=Promise.resolve();const chAsked=new Set();
const chIn=()=>$('#cbIn');
function chatPin(){const cb=$('#cb');if(chStick)cb.scrollTo({top:cb.scrollHeight,behavior:'auto'})}
function chatMount(){
  const cb=$('#cb');if(!cb.querySelector('#cbIn')){cb.innerHTML='<div id="cbIn"></div>';
    cb.addEventListener('scroll',()=>{chStick=cb.scrollHeight-cb.scrollTop-cb.clientHeight<90},{passive:true});
    if('ResizeObserver' in window){chRO=new ResizeObserver(chatPin);chRO.observe(chIn())}}
  chIn().innerHTML='';chStick=true;chAsked.clear();
}
/* words appear one after another */
function chatWords(el){
  if(introReduced())return;let n=0;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(t=>{const f=document.createDocumentFragment();t.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}const s=document.createElement('span');s.className='cw';s.style.setProperty('--d',Math.min(n++,38));s.textContent=p;f.appendChild(s)});t.replaceWith(f)});
}
function chatUser(q){chIn().insertAdjacentHTML('beforeend',`<div class="cm u"><div class="bub">${esc(q)}</div></div>`);chStick=true;chatPin()}
async function chatReply(q){
  const A=chatAnswer(q),logo=($('#chat .logo')||{outerHTML:''}).outerHTML.replace(/width="\d+" height="\d+"/,'width="16" height="16"');
  const row=document.createElement('div');row.className='cm a';row.innerHTML=`<div class="cav">${logo}</div><div class="cbody"><div class="bub a typing"><i></i><i></i><i></i></div></div>`;
  chIn().appendChild(row);const body=row.querySelector('.cbody');
  await chWait(650+Math.min(A.text.length,160)*4);
  body.innerHTML=`<div class="bub a">${A.text}</div>`;chatWords(body.firstChild);
  const words=(A.text.replace(/<[^>]+>/g,'').match(/\S+/g)||[]).length;await chWait(Math.min(words,38)*22+260);
  for(const c of A.cards){body.insertAdjacentHTML('beforeend',c);body.lastChild.style.animationDelay='0ms';await chWait(140)}
  if(A.chips.length){const d=document.createElement('div');d.className='cchips';d.innerHTML=A.chips.map((c,i)=>`<button class="cchip" style="animation-delay:${i*70}ms" ${c.s?`data-s="${esc(c.s)}"`:c.d?`data-d="${c.d}"`:`data-act="${c.act}"`}>${esc(c.t||c.s)}</button>`).join('');body.appendChild(d)}
}
function ask(q){
  q=q.trim();if(!q)return;openChat(true);if(!chIn()||!chIn().children.length||chIn().querySelector('.chello'))chatMount();
  chAsked.add(q);chatUser(q);chQ=chQ.then(()=>chatReply(q)).catch(()=>{});
}
function sugg(){
  chatMount();const S=chatSmart(),logo=($('#chat .logo')||{outerHTML:''}).outerHTML.replace(/width="\d+" height="\d+"/,'width="28" height="28"');
  chIn().innerHTML=`<div class="chello"><div class="chl">${logo}</div><h2>What do you want to remember?</h2><p>Ask in your own words. Answers come from what you kept, and show the original.</p>
   <div class="sgg">${S.map((s,i)=>`<button class="sgc" style="animation-delay:${180+i*70}ms" data-s="${esc(s.t)}"><span>${chIcon(s.i)}</span>${esc(s.t)}</button>`).join('')}</div></div>`;
  const q2=$('#q2');if(q2){const pick=S[Math.floor(Math.random()*S.length)];q2.placeholder=pick?'Try “'+pick.t+'”':'Ask your memories'}
}
function openChat(keep){const c=$('#chat');c.classList.add('on');if(!keep)sugg();$('#q2').focus({preventScroll:true})}
(function(){const cb=$('#cb');cb.addEventListener('click',e=>{const a=e.target.closest('[data-act="add"]');if(a){closeChat();openAdd()}});
  const q2=$('#q2'),sb=$('#sendB'),sync=()=>sb.classList.toggle('on',!!q2.value.trim());q2.addEventListener('input',sync);sb.addEventListener('click',()=>setTimeout(sync,0));q2.addEventListener('keydown',()=>setTimeout(sync,0));sync()})();
