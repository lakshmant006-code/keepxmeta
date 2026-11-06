/* ---------- Import your whole library: many photos, quickly ---------- */
/* A web app cannot read the photo library by itself: the phone only hands over what the person picks, so "access to all photos" means picking
   them all (or a whole folder where the browser allows it). This makes that fast and safe: no limit on how many, four photos at a time, smaller
   pictures decoded straight to size, a screen that stays awake, progress with time left, a Stop button that keeps what is done, and a check
   against the phone's storage so it never fills it silently. Photos already in Keep (same name, size and date) are skipped. */
const BULK_W=1100,BULK_POOL=Math.max(3,Math.min(6,(navigator.hardwareConcurrency||4)-1)),BULK_AVG=110e3; /* long side about 1100px, JPEG about 110 KB each */
const bulkIsImg=f=>/^image\//.test(f.type)||/\.(jpe?g|png|heic|heif|webp)$/i.test(f.name);
const bulkURL=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)});
async function bulkShrink(f){
  if(window.createImageBitmap){
    try{
      const bm=await createImageBitmap(f,{resizeWidth:BULK_W,resizeQuality:'medium',imageOrientation:'from-image'});
      const k=Math.min(1,BULK_W/Math.max(bm.width,bm.height)),w=Math.round(bm.width*k),h=Math.round(bm.height*k),ar=w>=h?'4 / 3':'3 / 4';
      if(window.OffscreenCanvas){ /* the JPEG is encoded off the main thread, so scrolling and animations stay smooth while photos come in */
        const oc=new OffscreenCanvas(w,h);oc.getContext('2d').drawImage(bm,0,0,w,h);bm.close&&bm.close();
        const blob=await oc.convertToBlob({type:'image/jpeg',quality:.8});return{src:await bulkURL(blob),ar};
      }
      const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(bm,0,0,w,h);bm.close&&bm.close();
      return{src:c.toDataURL('image/jpeg',.8),ar};
    }catch(e){}
  }
  const src=await shrinkImage(f,BULK_W);return{src,ar:lastAr};
}
async function bulkRoom(n){
  try{const e=await navigator.storage.estimate();if(!e||!e.quota)return null;const free=e.quota-e.usage;return{free,need:n*BULK_AVG,used:e.usage,quota:e.quota}}catch(x){return null}
}
const bulkMB=b=>b>=1e9?(b/1e9).toFixed(1)+' GB':Math.round(b/1e6)+' MB';
async function bulkWalk(dir,out){
  for await(const [n,h] of dir.entries()){
    if(h.kind==='file'){if(/\.(jpe?g|png|heic|heif|webp)$/i.test(n))out.push(await h.getFile())}
    else if(!n.startsWith('.'))await bulkWalk(h,out);
  }
}
function bulkOpen(first){
  if($('#onb'))return;
  const d=document.createElement('div');d.className='onb';d.id='onb';d.innerHTML='<div class="onbin" id="onbIn"></div>';$('#app').appendChild(d);bulkPick(!!first);
}
/* how far back, remembered; the first screen starts at 3 months */
const BK_RANGES=[[30,'30 days'],[90,'3 months'],[365,'A year'],[0,'Everything']];
const bkRange=()=>{try{const v=localStorage.getItem('kept.bkr');return v===null?90:+v}catch(e){return 90}};
const bkSetRange=v=>{try{localStorage.setItem('kept.bkr',String(v))}catch(e){}};
const bkCut=r=>r?Date.now()-r*864e5:0;
const bkDay=ts=>MS[new Date(ts).getMonth()]+' '+new Date(ts).getDate();
const bkSize=n=>{const b=n*BULK_AVG;return b>=1e9?(b/1e9).toFixed(1)+' GB':Math.max(1,Math.round(b/1e6))+' MB'};
const bkTime=n=>{const s=n*.25;return s<45?'under a minute':s<90?'about a minute':'about '+Math.round(s/60)+' minutes'};
/* the first screen (and "add photos" later): pick how far back, then choose photos. Nothing is imported before you have seen how many and how big. */
async function bulkPick(first){
  const dirOk=!!window.showDirectoryPicker,nat=typeof psNative==='function'&&psNative();let r=bkRange();
  const icon=ic.img.replace('width="22" height="22"','width="34" height="34"');
  const hint=()=>r?`From ${bkDay(bkCut(r))} to today`:'Your whole library';
  $('#onbIn').innerHTML=`<div class="onbic">${icon}</div><h1>${first?'Bring in your photos':'Add photos'}</h1>
   <p class="onbp">Start with the last 3 months. You can add more any time.</p>
   <div class="seg bkr" id="bkR">${BK_RANGES.map(x=>`<button data-v="${x[0]}" class="${x[0]===r?'on':''}">${x[1]}</button>`).join('')}</div>
   <small class="onbn" id="bkH">${hint()}</small>
   ${nat?'<button class="pill d onbgo" id="bkNat">Bring them in</button><button class="pill g onbgo" id="bkOwn" style="margin-top:10px">Choose photos myself</button>':'<label class="pill d onbgo">Choose photos<input type="file" id="bkIn" accept="image/*" multiple hidden></label>'}
   ${!nat&&dirOk?'<button class="pill g onbgo" id="bkDir" style="margin-top:10px">Choose a folder</button>':''}
   <button class="onbsk" id="bkX">${first?'Skip for now':'Cancel'}</button>
   <small class="onbn">Photos stay on this phone. Nothing is changed or deleted.</small>`;
  $('#bkR').onclick=e=>{const b=e.target.closest('button');if(!b)return;r=+b.dataset.v;bkSetRange(r);document.querySelectorAll('#bkR button').forEach(x=>x.classList.toggle('on',x===b));$('#bkH').textContent=hint()};
  $('#bkX').onclick=()=>first?onbClose():bulkClose();
  const pick=files=>{const f=files.filter(bulkIsImg);if(f.length)bulkConfirm(f,first)};
  const wire=()=>{const inp=$('#bkIn');if(inp)inp.onchange=e=>{const f=[...e.target.files];e.target.value='';pick(f)}};wire();
  if(dirOk&&!nat)$('#bkDir').onclick=async()=>{try{const dir=await showDirectoryPicker({mode:'read'}),f=[];$('#bkDir').textContent='Reading the folder…';await bulkWalk(dir,f);if(f.length)pick(f);else{toast('No photos in that folder');bulkPick(first)}}catch(e){}};
  if(nat){
    /* in the phone app the library is read directly, over the range chosen */
    $('#bkNat').onclick=async()=>{
      if(first)onbFlag();
      const s=psGet();s.on=1;s.range=r;psPut(s);
      $('#onbIn').innerHTML=`<div class="onbic">${icon}</div><h1>Reading your photos</h1><p class="onbp" id="bkP">Allow Photos if asked…</p><small class="onbn">${r?'From '+bkDay(bkCut(r))+' to today':'Your whole library'}. You can leave this open.</small>`;
      const res=await psSync({onp:n=>{const e=$('#bkP');if(e)e.textContent=n+' photos so far'}});
      const e=$('#bkP');
      if(res.err&&res.err!=='busy'){if(e)e.textContent=/denied|access/i.test(res.err)?'Allow Photos for Keep in Settings, then try again.':'Could not read your photos. Try again.';setTimeout(()=>bulkPick(first),2400);return}
      $('#onbIn').innerHTML=`<div class="onbic ok"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h1>${res.got?res.got+(res.got===1?' photo':' photos')+' kept':'Nothing new'}</h1><p class="onbp">${res.got?'Each one is on the day it was taken.':'Everything in that range is already in Keep.'}</p><button class="pill d onbgo" id="bkOk">Open my calendar</button><button class="onbsk" id="bkMore">Add more</button>`;
      $('#bkOk').onclick=bulkClose;$('#bkMore').onclick=()=>bulkPick(false);
    };
    $('#bkOwn').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=true;i.onchange=e=>pick([...e.target.files]);i.click()};
  }
}
/* before anything is imported: how many, how big, how long, and a way back */
function bulkConfirm(files,first){
  const r=bkRange(),cut=bkCut(r),have=new Set(user.map(o=>o.fid).filter(Boolean));
  const fresh=files.filter(f=>!have.has(f.name+'|'+f.size+'|'+f.lastModified)),dup=files.length-fresh.length;
  let inRange=cut?fresh.filter(f=>!f.lastModified||f.lastModified>=cut):fresh,older=fresh.length-inRange.length,all=false;
  const icon=ic.img.replace('width="22" height="22"','width="34" height="34"');
  const draw=()=>{
    const list=all?fresh:inRange,n=list.length;
    $('#onbIn').innerHTML=`<div class="onbic">${icon}</div>
     <h1>${n?n+(n===1?' photo':' photos'):'Nothing in that range'}</h1>
     <p class="onbp">${n?`About ${bkSize(n)} on this phone, ${bkTime(n)}.${n>800?' You can stop any time and keep what is done.':''}`:`${older} older ${older===1?'photo was':'photos were'} left out. ${dup?dup+' already in Keep.':''}`}</p>
     ${older&&!all?`<button class="bkold" id="bkOld">${older} older ${older===1?'photo':'photos'} left out. Include ${older===1?'it':'them'}</button>`:''}
     ${all&&older?`<button class="bkold" id="bkOld">Back to ${r?BK_RANGES.find(x=>x[0]===r)[1].toLowerCase():'everything'}</button>`:''}
     ${n?'<button class="pill d onbgo" id="bkGo">Bring them in</button>':''}
     <button class="onbsk" id="bkBack">Back</button>
     ${dup&&n?`<small class="onbn">${dup} already in Keep, skipped.</small>`:''}`;
    $('#bkBack').onclick=()=>bulkPick(first);
    const o=$('#bkOld');if(o)o.onclick=()=>{all=!all;draw()};
    const g=$('#bkGo');if(g)g.onclick=()=>{if(first)onbFlag();bulkRun(list,{cut:all?0:cut})};
  };
  draw();
}
function bulkClose(){const d=$('#onb');if(d)d.remove();refresh()}
async function bulkRun(files,opts){
  opts=opts||{};
  const have=new Set(user.map(o=>o.fid).filter(Boolean)),todo=files.filter(f=>!have.has(f.name+'|'+f.size+'|'+f.lastModified)),dup=files.length-todo.length;
  const room=await bulkRoom(todo.length);
  if(room&&room.need>room.free*0.9){
    $('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div><h1>That may not fit</h1><p class="onbp">${todo.length} photos need about ${bulkMB(room.need)}, and this phone has about ${bulkMB(room.free)} free for Keep. Import fewer at a time, or free some space first.</p><button class="pill d onbgo" id="bkGo">Import as many as fit</button><button class="onbsk" id="bkBack">Choose again</button>`;
    $('#bkBack').onclick=bulkPick;
    await new Promise(r=>{$('#bkGo').onclick=r});todo.length=Math.max(0,Math.min(todo.length,Math.floor(room.free*0.85/BULK_AVG)));
  }
  if(!todo.length){$('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div><h1>Nothing new to keep</h1><p class="onbp">${dup?'Those photos are already in Keep.':'No photos could be read.'}</p><button class="pill d onbgo" id="bkOk">Done</button>`;$('#bkOk').onclick=bulkClose;return}
  let lock=null;try{if(navigator.wakeLock)lock=await navigator.wakeLock.request('screen')}catch(e){}
  const base=Date.now(),got=[],t0=performance.now();let next=0,done=0,fail=0,skipOld=0,stop=false;
  const F=flowOpen($('#onbIn'),{icon:ic.img.replace('width="22" height="22"','width="34" height="34"'),title:'Keeping your photos',sub:'0 of '+todo.length,steps:[['Reading your photos','Shrinking each to fit'],['Saving on this phone','Nothing leaves it'],['Filing on the right days',''],['Looking for people','Quietly, in the background']]});
  F.step(0,'active');F.actions('<button class="pill g onbgo" id="bkStop">Stop, keep what is done</button>');
  $('#bkStop').onclick=()=>{stop=true;$('#bkStop').disabled=true};
  const draw=()=>{
    F.sub(done+' of '+todo.length);const el=(performance.now()-t0)/1000;
    if(done>8){const left=Math.round(el/done*(todo.length-done));F.step(0,'active',left>90?'About '+Math.round(left/60)+' minutes left':'About '+left+(left===1?' second left':' seconds left'))}
  };
  async function worker(){
    while(!stop){
      const i=next++;if(i>=todo.length)return;const f=todo[i],fid=f.name+'|'+f.size+'|'+f.lastModified;
      try{
        const ex=await exifOf(f);
        if(opts.cut&&(ex.ts||f.lastModified||base)<opts.cut){skipOld++;done++;if(done%3===0){draw();await new Promise(r=>setTimeout(r,0))}continue}
        const im=await bulkShrink(f);
        const o={id:base+i,ts:Math.min(ex.ts||f.lastModified||base,base),type:'photo',ar:im.ar,src:im.src,text:'',fid};if(ex.geo)o.geo=ex.geo;
        user.push(o);got.push(o);
      }catch(e){fail++}
      done++;
      if(got.length&&got.length%25===0){persistUser();draw();
        if(got.length%100===0){const r=await bulkRoom(0);if(r&&r.used/r.quota>.92){stop=true;toast('Storage is nearly full, so Keep stopped here')}}}
      if(done%3===0){draw();await new Promise(r=>setTimeout(r,0))}
    }
  }
  await Promise.all(Array.from({length:BULK_POOL},worker));
  const pause=ms=>new Promise(r=>setTimeout(r,introReduced()?0:ms));
  F.step(0,'done',done+' read'+(fail?', '+fail+' could not be read':''));F.sub('Almost there');
  F.step(1,'active');persistUser();try{lock&&lock.release()}catch(e){}
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  await pause(350);F.step(1,'done');
  const days=new Set(got.map(x=>dk(new Date(x.ts)))).size,geo=got.filter(x=>x.geo).length;
  F.step(2,'active');refresh();await pause(350);F.step(2,'done',days+(days===1?' day':' days')+(geo?', '+geo+' with a location':''));
  F.step(3,'active');if(typeof faceKick==='function')faceKick(8000);await pause(300);F.step(3,'done','Starts shortly, only while Keep is open');
  const secs=Math.round((performance.now()-t0)/1000);
  F.done(got.length+(got.length===1?' photo kept':' photos kept'),'In '+(secs<90?secs+' seconds':Math.round(secs/60)+' minutes')+'.'+(dup?' '+dup+' were already in Keep.':'')+(skipOld?' '+skipOld+' older left out.':'')+(stop&&done<todo.length?' Stopped with '+(todo.length-done)+' left; run it again to continue, it skips what is done.':''));
  F.actions('<button class="pill d onbgo" id="bkOk">Open my calendar</button><button class="onbsk" id="bkMore">Add more photos</button>');
  $('#bkOk').onclick=bulkClose;$('#bkMore').onclick=()=>bulkPick(false);
}
