/* ---------- Look: what people wore, read from the photos on this phone ---------- */
/* Keep already finds faces on the phone. Below each face it samples a patch for the top (shirt, jacket) and, when the photo shows that far, one
   for the bottom (pants, skirt), then names the main colour. Nothing is uploaded. This reads colour only: it does not know a dress from a kurta,
   and the answer can be wrong in strong light or busy patterns, so the chat says what it saw and shows the photo. */
const LOOK_COLORS=['black','white','gray','red','orange','yellow','green','teal','blue','navy','purple','pink','brown','beige'];
const LOOK_ALIAS={grey:'gray',violet:'purple',lavender:'purple',mauve:'purple',lilac:'purple',maroon:'red',burgundy:'red',crimson:'red',scarlet:'red',navy:'navy',khaki:'beige',cream:'beige',tan:'beige',ivory:'white',olive:'green',turquoise:'teal',aqua:'teal',cyan:'teal',magenta:'pink',fuchsia:'pink',rose:'pink',golden:'yellow',mustard:'yellow',charcoal:'gray',silver:'gray',indigo:'blue'};
const LOOK_TOP=/\b(t-?shirts?|shirts?|tops?|blouses?|jackets?|hoodies?|sweaters?|sweatshirts?|kurtas?|kurtis?|coats?|blazers?|cardigans?|tees?)\b/,LOOK_BOT=/\b(pants?|jeans|trousers?|shorts|skirts?|leggings?|bottoms?)\b/,LOOK_DRESS=/\b(dress(es)?|gowns?|sarees?|saris?|lehengas?|frocks?)\b/;
const lookDB=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('keep-looks',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction('photos',mode),r=fn(t.objectStore('photos'));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
  return{get:k=>tx('readonly',s=>s.get(k)),put:(k,v)=>tx('readwrite',s=>s.put(v,k)),clear:()=>tx('readwrite',s=>s.clear())}})();
/* a colour name for one pixel */
function lookName(r,g,b){
  r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn,s=d?d/(1-Math.abs(2*l-1)):0;
  let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360}
  if(l<.13)return'black';if(l>.9&&s<.5)return'white';
  if(s<.14)return l<.3?'black':l>.78?'white':'gray';
  if(h<15||h>=345)return l>.72?'pink':l<.3?'brown':'red';
  if(h<42)return l<.42?'brown':(s<.5&&l>.6)?'beige':'orange';
  if(h<68)return(s<.45&&l>.6)?'beige':l<.3?'brown':'yellow';
  if(h<165)return'green';if(h<198)return'teal';
  if(h<255)return l<.3?'navy':'blue';if(h<295)return'purple';
  return'pink';
}
/* the main colour of a rectangle of the canvas (fractions of its size); skin tones are set aside when there is enough else */
function lookPatch(cv,x0,y0,x1,y1){
  const W=cv.width,H=cv.height,cx0=Math.max(0,x0),cy0=Math.max(0,y0),cx1=Math.min(1,x1),cy1=Math.min(1,y1);
  if((cx1-cx0)*(cy1-cy0)<.55*(x1-x0)*(y1-y0))return null; /* mostly outside the photo */
  const w=Math.max(2,Math.round((cx1-cx0)*W)),h=Math.max(2,Math.round((cy1-cy0)*H));
  const t=document.createElement('canvas');t.width=12;t.height=12;const c=t.getContext('2d');c.drawImage(cv,cx0*W,cy0*H,w,h,0,0,12,12);
  const px=c.getImageData(0,0,12,12).data,all={},ns={},sum={};let na=0,nn=0;
  for(let i=0;i<px.length;i+=4){
    const n=lookName(px[i],px[i+1],px[i+2]),r=px[i],g=px[i+1],b=px[i+2],skin=r>90&&g>40&&b>20&&r>g&&g>b&&r-b>18&&r-g<75&&r-b<130&&(n==='orange'||n==='brown'||n==='beige'||n==='pink');
    all[n]=(all[n]||0)+1;na++;if(!skin){ns[n]=(ns[n]||0)+1;nn++}
    const q=sum[n]||(sum[n]=[0,0,0]);q[0]+=r;q[1]+=g;q[2]+=b;
  }
  const pick=nn>=na*.35?ns:all,top=Object.entries(pick).sort((a,b)=>b[1]-a[1])[0],den=nn>=na*.35?nn:na;
  if(!top||top[1]<den*.3)return null;
  const q=sum[top[0]],k=all[top[0]],sh=lookShade(top[0],q[0]/k,q[1]/k,q[2]/k);
  return{c:top[0],n:sh,p:+(top[1]/den).toFixed(2)};
}
/* "dark blue", "light gray", "bright red": the shade of a colour from its average pixel */
function lookShade(c,r,g,b){
  r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn,s=d?d/(1-Math.abs(2*l-1)):0;
  if(c==='black'||c==='white'||c==='navy'||c==='beige'||c==='brown')return c;
  if(c==='gray')return l<.35?'dark gray':l>.7?'light gray':'gray';
  if(l<.3)return'dark '+c;if(l>.72)return'light '+c;if(s>.7&&l>.38&&l<.62)return'bright '+c;return c;
}
/* the outfit for each face (same order): {top,bottom} */
function lookRead(cv,faces){
  return faces.map(f=>{
    const [x,y,w,h]=f.b,ar=cv.height/cv.width,fb=y+h,cx=x+w/2;
    const fw=w,fh=h,half=Math.max(fw*.95,fh/ar*.7);
    const top=lookPatch(cv,cx-half*.7,fb+fh*.55,cx+half*.7,fb+fh*1.5),bottom=lookPatch(cv,cx-half*.55,fb+fh*3.3,cx+half*.55,fb+fh*4.5);
    return{top:top&&top.c,bottom:bottom&&bottom.c,topN:top&&top.n,bottomN:bottom&&bottom.n,topP:top&&top.p,bottomP:bottom&&bottom.p};
  });
}
/* the looks for one photo, read once and kept */
async function lookOf(m){
  const c=await lookDB.get(m.id);if(c&&c.v===2)return c;
  const rec=await facesOf(m),img=await loadImg(src(m)),k=Math.min(1,500/Math.max(img.naturalWidth,img.naturalHeight)),cv=document.createElement('canvas');
  cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  const out={v:2,people:lookRead(cv,rec.faces)};await lookDB.put(m.id,out);return out;
}
/* ---- the chat side ---- */
function lookParse(q){
  const s=' '+q.toLowerCase().replace(/[^a-z0-9\- ]/g,' ')+' ',cols=[];
  Object.keys(LOOK_ALIAS).concat(LOOK_COLORS).forEach(w=>{if(new RegExp('\\b'+w+'\\b').test(s)){const c=LOOK_ALIAS[w]||w;if(!cols.includes(c))cols.push(c)}});
  const dress=LOOK_DRESS.test(s),top=LOOK_TOP.test(s),bot=LOOK_BOT.test(s);
  if(!cols.length&&!dress)return null;
  if(!top&&!bot&&!dress&&!/\b(wearing|wore|dressed|outfit|clothes|colou?r)\b/.test(s))return null; /* just "a blue sky" is not about clothes */
  return{cols,part:top&&!bot?'top':bot&&!top?'bottom':null,dress};
}
/* "what was Kalyan wearing", "what did Mina wear last Friday": ask about a person, not a colour */
function lookWearParse(q){
  const s=' '+q.toLowerCase().replace(/[^a-z0-9\- ]/g,' ')+' ';
  if(!/\b(wearing|wore|wear|dressed in|had on|outfit)\b/.test(s))return null;
  const pe=chatPeople(),toks=s.split(/\s+/).filter(t=>t.length>2);const hit=toks.map(t=>pe.get(t)).find(Boolean);
  return hit?{name:hit}:null;
}
window.lookIs=q=>!!(lookParse(q)||lookWearParse(q));
const lookOutfit=p=>{const t=p.topN||p.top,b=p.bottomN||p.bottom;if(t&&b)return t===b?`an all-${p.top} outfit`:`a ${t} top and ${b} bottoms`;return t?`a ${t} top`:b?`${b} bottoms`:'something I could not read'};
async function lookWear(q,W){
  const P=chatParse(q),people=await peopleAll().catch(()=>[]),first=chFirstOf(W.name);
  const photos=all().filter(m=>m.type==='photo'&&src(m)&&(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))).sort((a,b)=>b.ts-a.ts);
  if(!photos.length)return{text:`You have not kept any photos${P.label?' '+P.label:''} to look through yet.`,more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  let f=null;try{f=await faceLoad()}catch(e){}
  if(!f)return{text:'I need the on-phone photo reader to look at clothes, and it did not load. Check your connection once and ask again.',more:[],cards:[],chips:[]};
  const got=[];let seen=0;
  for(const m of photos.slice(0,P.range?120:200)){
    let r;try{r=await lookOf(m)}catch(e){continue}seen++;
    const rec=await faceDB.get('photos',m.id)||{faces:[]};
    r.people.forEach((p,i)=>{const fc=rec.faces[i],w=fc&&faceWho(fc.d,people);if(w&&w.name&&chFirstOf(w.name)===first&&(p.top||p.bottom))got.push({m,p})});
    if(got.length>=4)break;if(seen%6===0)await fsleep(20);
  }
  {const seenD=new Set();for(let i=got.length-1;i>=0;i--){const k=dk(new Date(got[i].m.ts));if(seenD.has(k)&&i>0&&got.findIndex(g=>dk(new Date(g.m.ts))===k)!==i){got.splice(i,1)}seenD.add(k)}}
  const nm=chPN(W.name);
  if(!got.length)return{text:`I could not spot ${esc(nm)} in a photo${P.label?' '+P.label:''}.`,more:['I only know faces you have named. If '+esc(nm)+' is in a photo but not tagged, tag them once and I will find them everywhere.'],cards:[],chips:[{t:'Try last week',s:'What was '+nm+' wearing last week?'}]};
  const one=g=>{const d=new Date(g.m.ts),rel=chRel(d);return{rel,out:lookOutfit(g.p),sure:Math.min(g.p.topP||1,g.p.bottomP||1)>=.5}};
  const a=one(got[0]);
  const lead=/^(Today|Yesterday)$/.test(a.rel)?`${a.rel}, ${esc(nm)} had on ${a.out}.`:`On ${a.rel}, ${esc(nm)} had on ${a.out}.`;
  const more=got.slice(1,3).map(g=>{const o=one(g);return `${esc(o.rel)}: ${o.out}.`});
  more.push(a.sure?'I read colours only, so check the photo.':'I am not fully sure of that colour: the light or a pattern may be fooling me. Check the photo.');
  const cards=got.slice(0,3).map(g=>{const k=dk(new Date(g.m.ts));return`<button class="mc" data-d="${k}"><div class="mts"><span class="mt" style="background-image:url(${src(g.m)})"></span></div><div class="mtm">${chRel(new Date(g.m.ts))} · ${tstr(g.m.ts)}</div><div class="mti">${esc(nm)} · ${esc(lookOutfit(g.p))}</div></button>`});
  useTrack('chat_look');
  return{text:lead,more,cards,chips:[{t:'What happened that day',s:'What happened '+(/^(Today|Yesterday)$/.test(a.rel)?a.rel.toLowerCase():'on '+a.rel)}]};
}
const lookMatch=(p,L)=>{const c=L.cols.length?L.cols:null;if(!c)return false;
  const hit=v=>!!v&&c.some(x=>x===v||(x==='blue'&&v==='navy'));
  return L.part==='top'?hit(p.top):L.part==='bottom'?hit(p.bottom):(hit(p.top)||hit(p.bottom))};
async function lookAnswer(q){
  const W=lookWearParse(q);if(W&&!lookParse(q))return lookWear(q,W);
  const L=lookParse(q),P=chatParse(q),Y=TODAY.getFullYear();
  /* "on the 26th" with no month: the latest such day that has photos */
  if(!P.range){const dm=q.toLowerCase().match(/\b(\d{1,2})(st|nd|rd|th)\b/);
    if(dm){for(let i=0;i<14&&!P.range;i++){const d=new Date(Y,TODAY.getMonth()-i,+dm[1]);if(d.getDate()===+dm[1]&&d<=TODAY&&byDay[dk(d)]){P.range=[+d,+d+864e5-1];P.label='on '+fullDay(d)}}}}
  const photos=all().filter(m=>m.type==='photo'&&src(m)&&(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))).sort((a,b)=>b.ts-a.ts);
  const cw=L.cols.join(' or '),what=L.dress?'a '+(cw?cw+' ':'')+'dress':L.part==='bottom'?(cw?cw+' ':'')+'pants or skirt':L.part==='top'?'a '+(cw?cw+' ':'')+'top':cw||'that';
  if(!photos.length)return{text:`You have not kept any photos${P.label?' '+P.label:''} to look through yet.`,more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  let f=null;try{f=await faceLoad()}catch(e){}
  if(!f)return{text:'I need the on-phone photo reader to look at clothes, and it did not load. Check your connection once and ask again.',more:[],cards:[],chips:[]};
  const found=[],tally={},cap=Math.min(photos.length,P.range?120:200);let seen=0,people=[];try{people=await peopleAll()}catch(e){}
  for(const m of photos.slice(0,cap)){
    let r;try{r=await lookOf(m)}catch(e){continue}
    seen++;
    const rec=await faceDB.get('photos',m.id)||{faces:[]};
    r.people.forEach(p=>{[p.top,p.bottom].forEach(c=>{if(c)tally[c]=(tally[c]||0)+1})});
    r.people.forEach((p,i)=>{if(L.dress){if(p.top&&p.bottom&&p.top===p.bottom&&(!L.cols.length||L.cols.includes(p.top)))found.push({m,p,i,rec,dress:true});return}
      if(lookMatch(p,L))found.push({m,p,i,rec})});
    if(seen%6===0)await fsleep(20);
  }
  const ms=[...new Map(found.map(x=>[x.m.id,x])).values()];
  const cards=ms.slice(0,4).map(x=>{
    const fc=rec=>rec&&rec.faces[x.i],w=fc(x.rec)?faceWho(fc(x.rec).d,people):null,nm=w&&w.name,k=dk(new Date(x.m.ts));
    const part=L.part==='bottom'?x.p.bottom:L.part==='top'?x.p.top:(x.p.top&&L.cols.includes(x.p.top)?x.p.top:x.p.bottom),pt=L.part==='bottom'||(!L.part&&x.p.bottom===part&&x.p.top!==part)?'bottom':'top';
    const shade=pt==='bottom'?(x.p.bottomN||part):(x.p.topN||part);
    const desc=x.dress?`Looks like a ${x.p.top} outfit in one piece`:`${nm?esc(chPN(nm))+' · ':''}${shade} ${pt==='bottom'?'on the bottom':'on top'}`;
    return`<button class="mc" data-d="${k}"><div class="mts"><span class="mt" style="background-image:url(${src(x.m)})"></span></div><div class="mtm">${chRel(new Date(x.m.ts))} · ${tstr(x.m.ts)}</div><div class="mti">${esc(desc)}</div></button>`});
  const scope=seen<photos.length?` I looked through the ${seen} newest of ${photos.length} photos${P.label?' '+P.label:''}.`:` I looked through ${seen===1?'the one photo':'all '+seen+' photos'}${P.label?' '+P.label:''}.`;
  const more=[];
  if(!ms.length){
    useTrack('chat_look');
    const near=Object.entries(tally).filter(([c])=>!L.cols.includes(c)).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const more=[near.length?`The colours I did see on people were ${chList(near.map(([c,n])=>c+' ('+n+')'))}.`:'I did not find any people I could read colours from.','I read colours from the people I can see in each photo, so someone turned away, cropped or in dim light can be missed.'];
    return{text:`I could not find anyone wearing ${esc(what)}.${scope}`,more,cards:[],chips:near.map(([c])=>({t:'Who wore '+c+'?',s:'Who was wearing '+c+(L.part==='bottom'?' pants':L.part==='top'?' top':'')+'?'}))};
  }
  const days=[...new Set(ms.map(x=>dk(new Date(x.m.ts))))];
  const names=[...new Set(ms.map(x=>{const fc=x.rec.faces[x.i],w=fc&&faceWho(fc.d,people);return w&&w.name}).filter(Boolean))];
  more.push('I only read colours, and busy patterns or strong light can fool me, so check the photo.');
  if(L.dress)more.unshift('I cannot tell a dress from a long top, so these are people whose top and bottom look like one colour.');
  const chips=[];if(days.length===1)chips.push({t:'Open that day',d:days[0]});if(names.length===1)chips.push({s:'What happened with '+chPN(names[0])+'?'});
  useTrack('chat_look');
  const lead=ms.length===1?`Yes, I found it${names.length?`: ${chList(names.slice(0,2).map(n=>esc(chPN(n))))} in ${esc(what)}`:`: someone in ${esc(what)}`} on ${esc(chRel(new Date(ms[0].m.ts)))}.`:`I found <b>${ms.length}</b> photos with someone in ${esc(what)}${days.length>1?`, across ${days.length} days`:''}${names.length?`. I think that includes ${chList(names.slice(0,3).map(n=>esc(chPN(n))))}`:''}.${scope}`;
  return{text:lead,more,cards,chips};
}
