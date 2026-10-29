/* ---------- Import your whole library: many photos, quickly ---------- */
/* A web app cannot read the photo library by itself: the phone only hands over what the person picks, so "access to all photos" means picking
   them all (or a whole folder where the browser allows it). This makes that fast and safe: no limit on how many, four photos at a time, smaller
   pictures decoded straight to size, a screen that stays awake, progress with time left, a Stop button that keeps what is done, and a check
   against the phone's storage so it never fills it silently. Photos already in Keep (same name, size and date) are skipped. */
const BULK_W=1100,BULK_POOL=4,BULK_AVG=110e3; /* long side about 1100px, JPEG about 110 KB each */
const bulkIsImg=f=>/^image\//.test(f.type)||/\.(jpe?g|png|heic|heif|webp)$/i.test(f.name);
async function bulkShrink(f){
  if(window.createImageBitmap){
    try{
      const bm=await createImageBitmap(f,{resizeWidth:BULK_W,resizeQuality:'medium',imageOrientation:'from-image'});
      const k=Math.min(1,BULK_W/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
      c.getContext('2d').drawImage(bm,0,0,c.width,c.height);bm.close&&bm.close();
      return{src:c.toDataURL('image/jpeg',.8),ar:c.width>=c.height?'4 / 3':'3 / 4'};
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
function bulkOpen(){
  if($('#onb'))return;
  const d=document.createElement('div');d.className='onb';d.id='onb';d.innerHTML='<div class="onbin" id="onbIn"></div>';$('#app').appendChild(d);bulkPick();
}
async function bulkPick(){
  const dirOk=!!window.showDirectoryPicker,room=await bulkRoom(0);
  $('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div>
   <h1>Import all my photos</h1>
   <p class="onbp">Pick as many photos as you like, as many times as you like. Keep files each one on the day it was taken, keeps its location, and skips photos it already has.</p>
   <ul class="onbl"><li>${dirOk?'Pick a whole folder, or':'Pick'} photos from your library. There is no limit.</li><li>A web app cannot browse your library by itself, so you choose what to hand over.</li><li>Everything stays on this phone${room?` (${bulkMB(room.quota-room.used)} free for Keep)`:''}.</li></ul>
   <label class="pill d onbgo">Choose photos<input type="file" id="bkIn" accept="image/*" multiple hidden></label>
   ${dirOk?'<button class="pill g onbgo" id="bkDir" style="margin-top:10px">Choose a folder</button>':''}
   <button class="onbsk" id="bkX">Cancel</button>
   <small class="onbn">Keep the app open and the screen on while it works. If you stop, what is done stays.</small>`;
  $('#bkX').onclick=bulkClose;
  $('#bkIn').onchange=e=>{const f=[...e.target.files].filter(bulkIsImg);e.target.value='';if(f.length)bulkRun(f)};
  if(dirOk)$('#bkDir').onclick=async()=>{try{const dir=await showDirectoryPicker({mode:'read'}),f=[];$('#bkDir').textContent='Reading the folder…';await bulkWalk(dir,f);if(f.length)bulkRun(f);else toast('No photos in that folder');bulkPick()}catch(e){}};
}
function bulkClose(){const d=$('#onb');if(d)d.remove();refresh()}
async function bulkRun(files){
  const have=new Set(user.map(o=>o.fid).filter(Boolean)),todo=files.filter(f=>!have.has(f.name+'|'+f.size+'|'+f.lastModified)),dup=files.length-todo.length;
  const room=await bulkRoom(todo.length);
  if(room&&room.need>room.free*0.9){
    $('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div><h1>That may not fit</h1><p class="onbp">${todo.length} photos need about ${bulkMB(room.need)}, and this phone has about ${bulkMB(room.free)} free for Keep. Import fewer at a time, or free some space first.</p><button class="pill d onbgo" id="bkGo">Import as many as fit</button><button class="onbsk" id="bkBack">Choose again</button>`;
    $('#bkBack').onclick=bulkPick;
    await new Promise(r=>{$('#bkGo').onclick=r});todo.length=Math.max(0,Math.min(todo.length,Math.floor(room.free*0.85/BULK_AVG)));
  }
  if(!todo.length){$('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div><h1>Nothing new to keep</h1><p class="onbp">${dup?'Those photos are already in Keep.':'No photos could be read.'}</p><button class="pill d onbgo" id="bkOk">Done</button>`;$('#bkOk').onclick=bulkClose;return}
  let lock=null;try{if(navigator.wakeLock)lock=await navigator.wakeLock.request('screen')}catch(e){}
  const base=Date.now(),got=[],t0=performance.now();let next=0,done=0,fail=0,stop=false;
  $('#onbIn').innerHTML=`<div class="onbic">${ic.img.replace('width="22" height="22"','width="34" height="34"')}</div><h1>Keeping your photos</h1><p class="onbp" id="bkT">0 of ${todo.length}</p><div class="onbbar"><i id="onbB"></i></div><p class="onbn" id="bkE" style="margin:10px 0 0"></p><button class="pill g onbgo" id="bkStop" style="margin-top:16px">Stop, keep what is done</button>`;
  $('#bkStop').onclick=()=>{stop=true;$('#bkStop').disabled=true};
  const draw=()=>{const t=$('#bkT'),b=$('#onbB'),e=$('#bkE');if(!t)return;t.textContent=done+' of '+todo.length;b.style.width=Math.round(done/todo.length*100)+'%';
    const el=(performance.now()-t0)/1000;if(done>8){const left=Math.round(el/done*(todo.length-done));e.textContent=left>90?'About '+Math.round(left/60)+' minutes left':'About '+left+' seconds left'}};
  async function worker(){
    while(!stop){
      const i=next++;if(i>=todo.length)return;const f=todo[i],fid=f.name+'|'+f.size+'|'+f.lastModified;
      try{
        const [ex,im]=await Promise.all([exifOf(f),bulkShrink(f)]);
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
  persistUser();draw();try{lock&&lock.release()}catch(e){}
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  refresh();if(typeof faceKick==='function')faceKick(8000);
  const secs=Math.round((performance.now()-t0)/1000),days=new Set(got.map(x=>dk(new Date(x.ts)))).size,geo=got.filter(x=>x.geo).length;
  $('#onbIn').innerHTML=`<div class="onbic ok"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
   <h1>${got.length} ${got.length===1?'photo':'photos'} kept</h1>
   <p class="onbp">${days} ${days===1?'day':'days'}${geo?`, ${geo} with a location`:''}, in ${secs<90?secs+' seconds':Math.round(secs/60)+' minutes'}.${dup?` ${dup} were already in Keep.`:''}${fail?` ${fail} could not be read.`:''}${stop&&done<todo.length?` Stopped with ${todo.length-done} left; run it again to continue, it skips what is done.`:''}</p>
   <button class="pill d onbgo" id="bkOk">Open my calendar</button><button class="onbsk" id="bkMore">Add more photos</button>`;
  $('#bkOk').onclick=bulkClose;$('#bkMore').onclick=bulkPick;
}
