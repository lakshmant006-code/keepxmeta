/* ---------- Scenes: what kind of place a photo shows, read on this phone ---------- */
/* A small image-and-text model (CLIP) turns each photo into numbers and compares them with short descriptions of places ("a hike through a forest
   trail", "a busy outdoor market"). Nothing is uploaded: only the model comes down, once, with the user's say-so, and is kept on the phone.
   Each photo is read once and the answer is remembered. It reads the whole picture, so it names the kind of scene, not the exact place. */
const SC_K='kept.scn',SC_MODEL='Xenova/clip-vit-base-patch32',SC_LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm',SC_V=1;
/* key, name shown, descriptions the model compares against, words people use when they ask */
const SC_LIST=[
 ['summit','Mountain top',['a photo from the summit of a mountain with a wide view','a person standing on a mountain peak above the clouds','a rocky mountain ridge at high altitude'],'summit peak mountaintop top mountain mountains alps himalaya ridge'],
 ['mountains','Mountains',['a photo of big mountains in the distance','a scenic mountain valley landscape','snow capped mountain range'],'mountain mountains valley hills hill alps scenery landscape'],
 ['hike','Hike in the woods',['a hiker on a trail through a forest','a hiking trail in the woods','people trekking on a forest path with backpacks'],'hike hiking trek trekking trail walk woods forest hikes'],
 ['forest','Forest',['a dense green forest with tall trees','sunlight through trees in a forest','a jungle with thick vegetation'],'forest woods jungle trees woodland'],
 ['waterfall','Waterfall',['a waterfall in nature','water cascading down rocks'],'waterfall falls cascade'],
 ['lake','Lake or river',['a calm lake with reflections','a river flowing through the countryside','a boat on a lake'],'lake river pond stream reservoir'],
 ['beach','Beach',['a sandy beach by the sea','people on a beach with waves','a tropical beach with palm trees'],'beach sea ocean shore sand coast seaside waves'],
 ['sunset','Sunset or sunrise',['a sunset sky','a sunrise over the horizon','a golden hour sky with orange clouds'],'sunset sunrise dusk dawn golden sky'],
 ['snow','Snow',['a snowy landscape','people playing in the snow','a ski slope'],'snow snowy ski skiing winter ice'],
 ['desert','Desert',['sand dunes in a desert','a dry desert landscape'],'desert dunes sand dune'],
 ['garden','Garden or flowers',['a garden full of flowers','close up of colourful flowers','a park with green lawns and trees'],'garden flowers flower park blossom lawn'],
 ['countryside','Countryside and farms',['green farmland and fields','a village in the countryside','cows or sheep in a field'],'farm farmland field fields village countryside rural paddy'],
 ['market','Market',['a busy outdoor market with stalls','a street market selling fruits and vegetables','a bazaar with crowded stalls and vendors'],'market bazaar stall stalls vendor vendors shopping fruits vegetables'],
 ['street','City street',['a busy city street with people and traffic','a narrow old town street','a street at night with neon signs'],'street streets city downtown traffic road alley'],
 ['skyline','City skyline',['a skyline of tall buildings','a view of a city from above','skyscrapers at dusk'],'skyline skyscraper skyscrapers towers cityscape buildings'],
 ['temple','Temple or monument',['a temple with carved stone','a historic monument or palace','a church or cathedral interior','a mosque with domes'],'temple temples monument palace fort church mosque shrine cathedral heritage'],
 ['museum','Museum or gallery',['inside a museum with artworks','an art gallery with paintings'],'museum gallery art exhibition exhibit'],
 ['restaurant','Restaurant',['a restaurant table with food','people having dinner at a restaurant','a plate of food on a table'],'restaurant dinner lunch dining meal food eating'],
 ['cafe','Cafe',['a cafe with coffee on the table','a latte on a cafe table','a cosy coffee shop'],'cafe coffee shop latte cappuccino tea'],
 ['streetfood','Street food',['street food being cooked at a stall','a food stall at night'],'streetfood stall snacks'],
 ['cooking','Cooking at home',['cooking in a home kitchen','a person preparing food on a kitchen counter'],'cooking kitchen baking cook'],
 ['party','Party',['a party with friends and balloons','people celebrating a birthday with a cake','a dance floor with colourful lights'],'party birthday celebration celebrate cake club dancing'],
 ['concert','Concert or show',['a crowd at a live music concert','a stage with performers and lights','fireworks in the night sky'],'concert gig festival stage fireworks band music'],
 ['wedding','Wedding',['a wedding ceremony','a bride and groom','people in traditional wedding clothes'],'wedding bride groom marriage ceremony engagement'],
 ['sports','Sports',['a cricket or football match in a stadium','people playing sports on a field','a gym workout'],'sports match stadium cricket football gym workout'],
 ['pool','Pool',['a swimming pool','people swimming in a pool'],'pool swimming swim'],
 ['road','Road trip',['a car driving on an open highway','the view from a car window on a long road','a scenic road through hills'],'roadtrip drive driving highway'],
 ['airport','Airport or plane',['inside an airport terminal','the wing of an airplane seen from the window','a plane on the runway'],'airport plane flight flying airplane window'],
 ['train','Train or station',['a train at a platform','inside a train carriage','a railway station'],'train station railway metro subway platform'],
 ['boat','Boat or ship',['a boat on the sea','a ferry or cruise ship deck'],'boat ship ferry cruise sailing yacht'],
 ['home','At home',['a living room at home','a cosy bedroom','a sofa with cushions'],'home house living room bedroom apartment indoors'],
 ['office','Office or work',['an office desk with a laptop','people in a meeting room','a whiteboard in a workspace'],'office work desk laptop meeting workplace'],
 ['school','School or campus',['a classroom with students','a university campus building','a graduation ceremony'],'school college campus class classroom graduation university'],
 ['shopping','Shopping',['inside a shopping mall','a supermarket aisle','a clothing store'],'mall store shop shopping supermarket'],
 ['animals','Animals',['a close up of a dog','a cat on a sofa','wild animals in a safari','birds on a tree'],'animal animals dog cat pet wildlife safari bird birds zoo'],
 ['selfie','Selfie',['a selfie of a person','a close up portrait of a smiling face'],'selfie selfies portrait'],
 ['group','Group photo',['a group photo of friends posing','family posing together for a picture'],'group family friends together'],
 ['night','Night',['a photo taken at night','city lights at night','a night sky with stars'],'night dark stars'],
 ['art','Art and signs',['a colourful mural on a wall','a poster or sign with text','a screenshot of a phone screen','a document or a receipt'],'mural poster sign screenshot document receipt text'],
];
const SC_BY=Object.fromEntries(SC_LIST.map(s=>[s[0],s]));
const scHas=()=>{try{return localStorage.getItem(SC_K)==='1'}catch(e){return false}};
const scDB=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('keep-scenes',1);r.onupgradeneeded=()=>{r.result.createObjectStore('photos');r.result.createObjectStore('text')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(st,mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
  return{get:(st,k)=>tx(st,'readonly',s=>s.get(k)),put:(st,k,v)=>tx(st,'readwrite',s=>s.put(v,k)),all:st=>tx(st,'readonly',s=>s.getAll()),keys:st=>tx(st,'readonly',s=>s.getAllKeys()),clear:st=>tx(st,'readwrite',s=>s.clear())}})();
const scNorm=v=>{let s=0;for(let i=0;i<v.length;i++)s+=v[i]*v[i];s=Math.sqrt(s)||1;const o=new Float32Array(v.length);for(let i=0;i<v.length;i++)o[i]=v[i]/s;return o};
let scModel=null,scLoading=null,scText=null;
function scConsent(){
  if(scHas())return Promise.resolve(true);
  return new Promise(res=>{
    const m=document.createElement('div');m.className='asrm';
    m.innerHTML=`<div role="dialog" aria-label="Read the scenes in your photos"><h2>Read the scenes in your photos</h2><p>To tell a market from a mountain top or a forest hike, Keep needs a small vision model, roughly 150 MB. It downloads once, stays on this phone, and reads your photos here: nothing is uploaded. Use Wi‑Fi if you can.</p>
      <div class="asrb"><button class="pill g" id="scNo">Not now</button><button class="pill d" id="scYes">Get it</button></div></div>`;
    $('#app').appendChild(m);
    const fin=v=>{if(v){try{localStorage.setItem(SC_K,'1')}catch(e){}}m.remove();res(v)};
    $('#scYes').onclick=()=>fin(true);$('#scNo').onclick=()=>fin(false);m.addEventListener('click',e=>{if(e.target===m)fin(false)});
  });
}
/* the model: {image(canvas)->unit vector, texts([...])->unit vectors} */
async function scLoad(onp){
  if(scModel)return scModel;if(window.SC_TEST)return scModel=window.SC_TEST;
  if(scLoading)return scLoading;
  scLoading=(async()=>{
    const T=await import(SC_LIB);T.env.allowLocalModels=false;T.env.useBrowserCache=true;
    const files={},cb=e=>{if(e&&e.status==='progress'&&e.file){files[e.file]={l:e.loaded||0,t:e.total||0};let l=0,t=0;for(const k in files){l+=files[k].l;t+=files[k].t}if(t&&onp)onp(Math.min(99,Math.round(l/t*100)))}};
    const opt={dtype:'q8',device:'wasm',progress_callback:cb};
    const proc=await T.AutoProcessor.from_pretrained(SC_MODEL,{progress_callback:cb}),vis=await T.CLIPVisionModelWithProjection.from_pretrained(SC_MODEL,opt);
    let tok=null,txt=null;
    const loadText=async()=>{if(!tok){tok=await T.AutoTokenizer.from_pretrained(SC_MODEL,{progress_callback:cb});txt=await T.CLIPTextModelWithProjection.from_pretrained(SC_MODEL,opt)}};
    scModel={
      async image(cv){const im=T.RawImage.fromCanvas(cv),x=await proc(im),o=await vis(x);return scNorm(o.image_embeds.data)},
      async texts(arr){await loadText();const out=[];for(let i=0;i<arr.length;i+=16){const b=arr.slice(i,i+16),t=tok(b,{padding:'max_length',truncation:true,max_length:77}),o=await txt(t),d=o.text_embeds.data,n=d.length/b.length;for(let k=0;k<b.length;k++)out.push(scNorm(d.slice(k*n,(k+1)*n)))}return out}
    };
    return scModel;
  })().catch(e=>{scLoading=null;throw e});
  return scLoading;
}
/* the description embeddings, made once and kept (so the text model is only needed the first time) */
async function scTexts(){
  if(scText)return scText;
  const prompts=[];SC_LIST.forEach(s=>s[2].forEach(p=>prompts.push([s[0],p])));
  const key='v'+SC_V+':'+prompts.length,c=await scDB.get('text',key).catch(()=>null);
  if(c&&c.length===prompts.length)return scText=prompts.map((p,i)=>({k:p[0],e:c[i]}));
  const M=await scLoad(),E=await M.texts(prompts.map(p=>p[1]));
  await scDB.put('text',key,E).catch(()=>{});return scText=prompts.map((p,i)=>({k:p[0],e:E[i]}));
}
/* probabilities per scene for one image vector */
function scClassify(v,T){
  const lg=T.map(t=>{let d=0;for(let i=0;i<v.length;i++)d+=v[i]*t.e[i];return 100*d}),mx=Math.max(...lg),ex=lg.map(x=>Math.exp(x-mx)),sum=ex.reduce((a,b)=>a+b,0),P={};
  T.forEach((t,i)=>{P[t.k]=(P[t.k]||0)+ex[i]/sum});
  return Object.entries(P).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,p])=>[k,+p.toFixed(3)]);
}
/* a photo's scenes, read once and kept */
async function scenesOf(m,mayRead){
  const c=await scDB.get('photos',m.id).catch(()=>null);if(c&&c.v===SC_V)return c;if(!mayRead)return null;
  const M=await scLoad(),T=await scTexts(),img=await loadImg(src(m)),k=Math.min(1,448/Math.max(img.naturalWidth,img.naturalHeight)),cv=document.createElement('canvas');
  cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  const out={v:SC_V,s:scClassify(await M.image(cv),T)};await scDB.put('photos',m.id,out);return out;
}
/* ---- quiet reading: only while the app is open and in front, in small steps, never on Data Saver ---- */
const scBg={run:false,again:false,t:null,done:0,total:0};
const scKick=ms=>{clearTimeout(scBg.t);scBg.t=setTimeout(scRun,ms==null?3000:ms)};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&scHas())scKick(4000)});
async function scRun(){
  if(!scHas()||!window.indexedDB)return;if(scBg.run){scBg.again=true;return}
  if(document.visibilityState!=='visible'||(navigator.connection&&navigator.connection.saveData))return;
  scBg.run=true;
  try{
    const have=new Set((await scDB.keys('photos').catch(()=>[])));
    const todo=all().filter(m=>m.type==='photo'&&src(m)&&!have.has(m.id)).sort((a,b)=>b.ts-a.ts);
    scBg.total=have.size+todo.length;scBg.done=have.size;
    for(const m of todo){
      if(document.visibilityState!=='visible')break;
      try{await scenesOf(m,true);scBg.done++}catch(e){if(/load|model|fetch|network/i.test(String(e&&e.message)))break}
      await new Promise(r=>setTimeout(r,250));
    }
  }catch(e){console.warn('scene reading stopped',e)}
  scBg.run=false;if(scBg.again){scBg.again=false;scKick(2000)}
}
async function scTurnOn(){
  if(!await scConsent())return false;
  const p=$('#app'),b=document.createElement('div');b.className='asrm';b.innerHTML=`<div><h2>Getting the scene reader</h2><p id="scPct">Starting…</p><div class="onbbar"><i id="scBar"></i></div></div>`;p.appendChild(b);
  try{await scLoad(n=>{const e=$('#scPct');if(e){e.textContent=n+'%'}const r=$('#scBar');if(r)r.style.width=n+'%'});await scTexts()}catch(e){b.remove();try{localStorage.removeItem(SC_K)}catch(_){}toast('Could not get the scene reader. Check your connection and try again.');return false}
  b.remove();toast('Reading your photos in the background');scKick(500);return true;
}
/* ---- the chat side ---- */
const SC_ASK=/\b(photos?|pictures?|pics?|shots?|images?|show me|show my|find my|find me|where did i (?:go|hike|trek|walk|eat))\b/;
function sceneParse(q){
  const s=' '+q.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ')+' ';if(!SC_ASK.test(s))return null;
  const hit=[];
  /* the more specific scene wins: "mountain top" before "mountains", "hike" before "forest" */
  for(const [k,,,w] of SC_LIST){const ws=w.split(' ');let n=0;for(const x of ws)if(new RegExp('\\b'+x+'\\b').test(s))n++;if(n)hit.push([k,n]);}
  if(!hit.length)return null;
  if(/\b(summit|peak|top of|mountain ?top)\b/.test(s)){const h=hit.find(x=>x[0]==='summit');if(h)h[1]+=3}
  if(/\b(hik\w*|trek\w*|trail)\b/.test(s)){const h=hit.find(x=>x[0]==='hike');if(h)h[1]+=3}
  hit.sort((a,b)=>b[1]-a[1]);const top=hit[0][1];return{keys:hit.filter(h=>h[1]>=Math.max(1,top-0)).map(h=>h[0]).slice(0,2)};
}
window.sceneIs=q=>!!sceneParse(q);
async function sceneAnswer(q){
  const S=sceneParse(q),P=chatParse(q),names=S.keys.map(k=>SC_BY[k][1]),what=names.join(' or ').toLowerCase();
  const photos=all().filter(m=>m.type==='photo'&&src(m)&&(!P.range||(m.ts>=P.range[0]&&m.ts<=P.range[1]))).sort((a,b)=>b.ts-a.ts);
  if(!photos.length)return{text:`You have not kept any photos${P.label?' '+P.label:''} to look through yet.`,more:[],cards:[],chips:[{t:'Keep something now',act:'add'}]};
  if(!scHas())return{text:`To find ${esc(what)} photos I need to read the scenes in your pictures. That takes a small vision model, downloaded once to this phone.`,more:['Nothing is uploaded: your photos are read here.'],cards:[],chips:[{t:'Turn on scene reading',act:'scenes'}]};
  let read=0;const found=[];
  for(const m of photos.slice(0,400)){
    const r=await scenesOf(m,false);if(!r)continue;read++;
    const sc=Math.max(...r.s.filter(x=>S.keys.includes(x[0])).map(x=>x[1]),0);
    if(sc>=.3)found.push({m,sc,k:r.s[0][0]});
  }
  found.sort((a,b)=>b.sc-a.sc||b.m.ts-a.m.ts);
  const left=Math.max(0,Math.min(photos.length,400)-read),note=left?`I have read ${read} of ${photos.length} photos so far. The rest are still being read in the background, so ask again in a bit.`:'';
  if(!found.length)return{text:`I could not find a photo that looks like ${esc(what)}${P.label?' '+P.label:''}.`,more:[note||'I read the whole picture, so a tiny detail in the corner can be missed.'].filter(Boolean),cards:[],chips:[]};
  const days=[...new Set(found.map(x=>dk(new Date(x.m.ts))))];
  const cards=found.slice(0,4).map(x=>{const k=dk(new Date(x.m.ts));return`<button class="mc" data-d="${k}"><div class="mts"><span class="mt" style="background-image:url(${src(x.m)})"></span></div><div class="mtm">${chRel(new Date(x.m.ts))} · ${tstr(x.m.ts)}</div><div class="mti">${esc(SC_BY[x.k][1])}</div></button>`});
  useTrack('chat_scene');
  const lead=found.length===1?`I found one photo that looks like ${esc(what)}, ${esc(chRel(new Date(found[0].m.ts)).toLowerCase())}.`:`I found <b>${found.length}</b> photos that look like ${esc(what)}, across ${days.length} day${days.length===1?'':'s'}.`;
  const more=[note,'I tell scenes from the whole picture, so check the photo.'].filter(Boolean);
  return{text:lead,more,cards,chips:days.length===1?[{t:'Open that day',d:days[0]}]:[]};
}
window.sceneAnswer=sceneAnswer;window.scTurnOn=scTurnOn;window.scenesOf=scenesOf;
if(scHas())scKick(6000);
