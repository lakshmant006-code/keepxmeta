/* ---------- Faces: recognise the people you have named, on this phone ---------- */
/* Name a face once (tap a photo, add a name) and Keep can find that person in your other photos. Everything runs here: the model files ship with
   the app (public/face/), faces are compared as numbers (128 per face) stored in this browser, and nothing is uploaded. You review every match
   before it is tagged, and Profile → People can forget it all. */
const FACE_DIR='face/',FACE_MAYBE=.5,FACE_SURE=.45,FACE_GAP=.04,FACE_KEEP=12;
let faceLib=null;
function faceLoad(){
  return faceLib||(faceLib=(async()=>{
    await new Promise((res,rej)=>{const s=document.createElement('script');s.src=FACE_DIR+'face-api.js';s.onload=res;s.onerror=()=>rej(new Error('face library'));document.head.appendChild(s)});
    const f=window.faceapi;
    try{await f.tf.setBackend('webgl');await f.tf.ready()}catch(e){await f.tf.setBackend('cpu');await f.tf.ready()}
    const M=FACE_DIR+'models';
    await Promise.all([f.nets.tinyFaceDetector.loadFromUri(M),f.nets.faceLandmark68Net.loadFromUri(M),f.nets.faceRecognitionNet.loadFromUri(M)]);
    return f;
  })().catch(e=>{faceLib=null;throw e}));
}
/* people (name -> a few of their face numbers) and photos (id -> the faces found in it) */
const faceDB=(()=>{
  let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('keep-faces',1);r.onupgradeneeded=()=>{r.result.createObjectStore('people');r.result.createObjectStore('photos')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(st,mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
  return{get:(st,k)=>tx(st,'readonly',s=>s.get(k)),put:(st,k,v)=>tx(st,'readwrite',s=>s.put(v,k)),all:st=>tx(st,'readonly',s=>s.getAll()),clear:st=>tx(st,'readwrite',s=>s.clear())};
})();
const namesOf=m=>[...new Set([m.who,...(m.people||[])].filter(Boolean))];
const fdist=(a,b)=>{let s=0;for(let i=0;i<128;i++){const d=a[i]-b[i];s+=d*d}return Math.sqrt(s)};
/* the faces in one photo, found once and remembered */
async function facesOf(m){
  const c=await faceDB.get('photos',m.id);if(c)return c;
  const f=await faceLoad(),img=await loadImg(src(m)),k=Math.min(1,800/Math.max(img.naturalWidth,img.naturalHeight)),cv=document.createElement('canvas');
  cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  const res=await f.detectAllFaces(cv,new f.TinyFaceDetectorOptions({inputSize:416,scoreThreshold:.5})).withFaceLandmarks().withFaceDescriptors();
  const out={ar:cv.height/cv.width,faces:res.filter(r=>r.detection.box.width>=40).sort((a,b)=>b.detection.box.width-a.detection.box.width).map(r=>{const b=r.detection.box;return{b:[b.x/cv.width,b.y/cv.height,b.width/cv.width,b.height/cv.height],d:Array.from(r.descriptor)}})};
  await faceDB.put('photos',m.id,out);return out;
}
const pkey=n=>(n||'').trim().toLowerCase();
async function peopleAll(){return(await faceDB.all('people'))||[]}
/* remember a face for a name (keeps a few different-looking ones, not copies) */
async function faceLearn(name,d){
  const k=pkey(name),p=(await faceDB.get('people',k))||{name,descs:[]};
  if(p.descs.every(x=>fdist(x,d)>.12)){p.descs.push(d);if(p.descs.length>FACE_KEEP)p.descs.shift();await faceDB.put('people',k,p)}
  return p;
}
/* which known person (if any) a face is: close enough, and clearly closer than the runner-up */
function faceWho(d,people){
  const sc=people.map(p=>({name:p.name,dist:Math.min(...p.descs.map(x=>fdist(x,d)))})).sort((a,b)=>a.dist-b.dist);
  if(!sc.length||sc[0].dist>=FACE_MAYBE)return null;
  if(sc[1]&&sc[1].dist-sc[0].dist<FACE_GAP&&sc[1].dist<FACE_MAYBE)return null; /* too close to call between two people */
  return sc[0];
}

/* ---- the panel ---- */
let fcCancel=false;
function fcShow(html,onClose){
  let p=$('#fcp');if(!p){p=document.createElement('div');p.className='tagp fcp';p.id='fcp';$('#app').appendChild(p);p.addEventListener('click',e=>{if(e.target===p)fcClose()})}
  p.innerHTML=`<div class="tagc fcc">${html}</div>`;p._close=onClose||null;return p;
}
function fcClose(){const p=$('#fcp');if(p){fcCancel=true;if(p._close)p._close();p.remove()}}
const fcBusy=t=>fcShow(`<div class="fcw"><i class="fcspin"></i><div>${t}</div></div>`);
const fcMsg=(t,btn)=>{fcShow(`<div class="tagh"><b>${t[0]}</b></div><p class="tagn" style="margin:2px 0 14px;font-size:14px">${t[1]}</p><button class="pill d" id="fcOk" style="width:100%;justify-content:center">${btn||'OK'}</button>`);$('#fcOk').onclick=fcClose};
/* a square close-up of one face, cut from the photo with CSS */
function fcCrop(m,ar,b){
  const w=Math.min(1,b[2]*1.7),cx=b[0]+b[2]/2,cy=b[1]+b[3]/2,sw=1/w,sh=ar/w; /* image size in units of the square */
  const px=sw>1?Math.max(0,Math.min(100,(.5-cx*sw)/(1-sw)*100)):50,py=sh>1?Math.max(0,Math.min(100,(.5-cy*sh)/(1-sh)*100)):50;
  return `background-image:url(${src(m)});background-size:${sw*100}% auto;background-position:${px}% ${py}%`;
}

/* ---- after you name a photo: learn the face, then offer to look for them elsewhere ---- */
async function faceAfterTag(m,name){
  if(!window.indexedDB||!name)return;
  fcCancel=false;
  try{
    fcBusy('Loading face recognition…<small>One time, about 8 MB. It stays on this phone.</small>');
    const {faces,ar}=await facesOf(m);if(fcCancel)return;
    if(!faces.length){fcMsg(['No face found','That photo is tagged '+esc(name)+', but no face could be found in it, so Keep cannot look for them in other photos from it. A clear, front-facing photo works best.']);return}
    let pick=0;
    if(faces.length>1){
      const known=await peopleAll();
      pick=await new Promise(res=>{
        const p=fcShow(`<div class="tagh"><b>Which one is ${esc(name)}?</b><button class="ib" id="fcX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
          <div class="fcimg"><img src="${src(m)}" alt="">${faces.map((f,i)=>{const w=faceWho(f.d,known);return `<button class="fcb ${w?'known':''}" data-i="${i}" style="left:${f.b[0]*100}%;top:${f.b[1]*100}%;width:${f.b[2]*100}%;height:${f.b[3]*100}%"><b>${w?esc(w.name):i+1}</b></button>`}).join('')}</div>
          <p class="tagn">Tap their face. Keep learns it so it can find them in your other photos.</p>`,()=>res(-1));
        $('#fcX').onclick=fcClose;p.querySelectorAll('.fcb').forEach(b=>b.onclick=()=>res(+b.dataset.i));
      });
      if(pick<0||fcCancel)return;
    }
    await faceLearn(name,faces[pick].d);
    const others=all().filter(x=>x.type==='photo'&&x.id!==m.id&&src(x)&&!namesOf(x).includes(name)).length;
    if(!others){fcMsg(['Learned '+esc(name),'Keep will recognise this face. Keep more photos and use Profile → People to find them.']);return}
    const p=fcShow(`<div class="tagh"><b>Learned ${esc(name)}'s face</b></div><div class="fcface" style="${fcCrop(m,ar,faces[pick].b)}"></div>
      <p class="tagn" style="font-size:14px;margin:10px 0 14px">Look through your other ${others} photo${others===1?'':'s'} for ${esc(name)}? You see every match and choose what to tag.</p>
      <div class="tagr"><button class="pill d" id="fcGo" style="flex:1;justify-content:center">Find ${esc(name)}</button><button class="pill g" id="fcNo">Not now</button></div>`);
    $('#fcNo').onclick=fcClose;$('#fcGo').onclick=()=>faceScan(name);
  }catch(e){console.warn('face matching failed',e);fcMsg(['Face matching is unavailable','This phone or browser could not run face recognition here. Tagging by name still works.'])}
}

/* ---- look through every other photo for one person, then let you review ---- */
async function faceScan(name){
  fcCancel=false;
  const todo=all().filter(x=>x.type==='photo'&&src(x)&&!namesOf(x).includes(name));
  const hits=[];let i=0;
  const draw=()=>{const p=fcShow(`<div class="tagh"><b>Looking for ${esc(name)}</b></div><div class="fcbar"><i style="width:${Math.round(i/Math.max(1,todo.length)*100)}%"></i></div><p class="tagn" style="font-size:14px;margin:8px 0 14px">Photo ${Math.min(i+1,todo.length)} of ${todo.length} · found ${hits.length}</p><button class="pill g" id="fcStop" style="width:100%;justify-content:center">Stop</button>`);$('#fcStop').onclick=()=>{fcCancel=true;stopped=true;review()}};
  let stopped=false;
  const review=()=>{
    if(hits.length===0){fcMsg(['No match found','Keep did not find '+esc(name)+' in your other photos'+(stopped?' so far':'')+'. More photos of them, clearer and from the front, help.']);return}
    hits.sort((a,b)=>a.dist-b.dist);
    const sel=new Set(hits.map((h,k)=>k).filter(k=>hits[k].dist<FACE_SURE));
    const label=()=>{const n=sel.size;$('#fcApply').textContent=n?'Tag '+n+' photo'+(n===1?'':'s')+' as '+name:'Choose photos to tag';$('#fcApply').disabled=!n};
    const p=fcShow(`<div class="tagh"><b>Found ${esc(name)} in ${hits.length} photo${hits.length===1?'':'s'}</b><button class="ib" id="fcX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
      <p class="tagn" style="font-size:13.5px;margin:0 0 10px">Tap to choose. ${hits.some(h=>h.dist>=FACE_SURE)?'The unselected ones are not sure matches.':''}</p>
      <div class="fcgrid">${hits.map((h,k)=>`<button class="fcit ${sel.has(k)?'on':''}" data-k="${k}"><i style="${fcCrop(h.m,h.ar,h.b)}"></i><span class="ck">✓</span>${h.dist>=FACE_SURE?'<em>Maybe</em>':''}</button>`).join('')}</div>
      <button class="pill d" id="fcApply" style="width:100%;justify-content:center;margin-top:14px"></button>`);
    label();$('#fcX').onclick=fcClose;
    p.querySelector('.fcgrid').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=+b.dataset.k;sel.has(k)?sel.delete(k):sel.add(k);b.classList.toggle('on',sel.has(k));label()};
    $('#fcApply').onclick=async()=>{
      let n=0;
      for(const k of sel){
        const h=hits[k],m=h.m;
        if(!m.who){m.who=name;m.pose=m.pose||'stand';m.at=m.at||[.5,.74]}else if(!namesOf(m).includes(name))m.people=(m.people||[]).concat(name);
        idb.put(m).catch(()=>{});await faceLearn(name,h.d);n++;
      }
      refresh();fcClose();toast('Tagged '+n+' photo'+(n===1?'':'s')+' as '+name);
    };
  };
  draw();
  try{
    const people=await peopleAll();
    for(;i<todo.length&&!fcCancel;i++){
      const m=todo[i];
      try{
        const {faces,ar}=await facesOf(m);
        faces.forEach(fc=>{const w=faceWho(fc.d,people);if(w&&pkey(w.name)===pkey(name)){const old=hits.find(h=>h.m===m);if(!old||w.dist<old.dist){if(old)hits.splice(hits.indexOf(old),1);hits.push({m,dist:w.dist,b:fc.b,ar,d:fc.d})}}});
      }catch(e){}
      if(!fcCancel){draw();await new Promise(r=>setTimeout(r,0))}
    }
    if(!fcCancel)review();
  }catch(e){console.warn('scan failed',e);fcMsg(['Face matching stopped','Something went wrong while looking through your photos. Try again.'])}
}

/* ---- Profile → People ---- */
async function faceOpenPeople(){
  fcCancel=false;
  let people=[];try{people=await peopleAll()}catch(e){}
  const row=p=>`<div class="fcrow"><div><b>${esc(p.name)}</b><small>${p.descs.length} face${p.descs.length===1?'':'s'} learned</small></div><button class="tagch" data-f="${esc(p.name)}">Find in photos</button></div>`;
  const pn=fcShow(`<div class="tagh"><b>People</b><button class="ib" id="fcX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
    ${people.length?`<div class="fclist">${people.map(row).join('')}</div>`:`<p class="tagn" style="font-size:14px;margin:4px 0 12px">No faces learned yet. Tap a photo in the viewer, add a name, and Keep learns that face so it can find the person in your other photos.</p>`}
    <p class="tagn">Face matching runs on this phone. Faces are stored here as numbers, never uploaded.</p>
    ${people.length?'<button class="pill g" id="fcForget" style="width:100%;justify-content:center;margin-top:12px">Forget all face data</button>':''}`);
  $('#fcX').onclick=fcClose;
  pn.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>faceScan(b.dataset.f));
  if($('#fcForget'))$('#fcForget').onclick=async()=>{await faceDB.clear('people');await faceDB.clear('photos');fcClose();toast('Face data forgotten. Names on photos stay.')};
}
