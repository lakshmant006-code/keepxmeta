/* ---------- Friends: a page of the people you know, with their Instagram handles ---------- */
/* Instagram does not let apps read your friends or followers, so Keep cannot sync with it. Add friends here by hand, or import the followers and
   following files from Instagram's own "Download your information" export. Friends live in this browser and are included in Back up. */
ic.users=st('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17.2" cy="9" r="2.4"/><path d="M16.5 14.2c2.2.2 3.9 1.7 4.4 4.3"/>',1.6);
ic.ig=st('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor"/>',1.7);
const FRK='kept.friends';
let FR=[];try{FR=JSON.parse(localStorage.getItem(FRK)||'[]')||[]}catch(e){}
const frSave=()=>{try{localStorage.setItem(FRK,JSON.stringify(FR))}catch(e){toast('Could not save. Storage may be full.')}dispatchEvent(new Event('keep:friends'))};
/* "@maya_k", "maya_k" or a profile link all become maya_k */
const igUser=s=>{s=(s||'').trim();const m=/instagram\.com\/([A-Za-z0-9._]+)/i.exec(s);if(m)s=m[1];return s.replace(/^@/,'').replace(/[^A-Za-z0-9._]/g,'').slice(0,30)};
const igLink=u=>'https://www.instagram.com/'+encodeURIComponent(u)+'/';
const frCount=n=>all().filter(m=>m.type==='photo'&&namesOf(m).some(x=>pkey(x)===pkey(n))).length;
/* a small square picture of a friend, cut from the middle of the photo you choose */
const frPhoto=file=>new Promise((res,rej)=>{
  const u=URL.createObjectURL(file),i=new Image();
  i.onload=()=>{const s=Math.min(i.naturalWidth,i.naturalHeight),c=document.createElement('canvas');c.width=c.height=160;c.getContext('2d').drawImage(i,(i.naturalWidth-s)/2,(i.naturalHeight-s)/2,s,s,0,0,160,160);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.85))};
  i.onerror=()=>{URL.revokeObjectURL(u);rej()};i.src=u;
});
const frAv=f=>f.photo?`<span class="fav" style="background-image:url(${f.photo})"></span>`:`<span class="fav">${avatar(f.name)}</span>`;

function frOpen(){
  const p=$('#fr');p.classList.add('on');
  p.innerHTML=`<div class="mh2"><button class="ib" id="frX" aria-label="Close">${ic.x}</button><div class="t">Friends</div><button class="ib" id="frAdd" aria-label="Add a friend">${ic.plus}</button></div><div class="frbody" id="frBody"></div>`;
  $('#frX').onclick=frClose;$('#frAdd').onclick=()=>frEdit();
  frDraw();
}
function frClose(){const p=$('#fr');p.classList.remove('on');p.innerHTML='';const e=$('#frp');if(e)e.remove()}
function frDraw(){
  const b=$('#frBody');if(!b)return;
  const rows=[...FR].sort((a,c)=>a.name.localeCompare(c.name));
  b.innerHTML=`<div class="fract"><button class="pill d" id="frNew" style="flex:1;justify-content:center">${ic.plus.replace('width="22" height="22"','width="18" height="18"')} Add a friend</button><button class="pill g" id="frImp" style="flex:1;justify-content:center">${ic.ig.replace('width="22" height="22"','width="18" height="18"')} From Instagram</button></div>
   ${rows.length?`<div class="frl">${rows.map(f=>`<div class="frr" data-i="${f.id}">${frAv(f)}<div class="frt"><b>${esc(f.name)}</b><small>${f.ig?'@'+esc(f.ig)+' · ':''}${frCount(f.name)} photo${frCount(f.name)===1?'':'s'}</small></div>${f.ig?`<a class="frig" href="${igLink(f.ig)}" target="_blank" rel="noopener" aria-label="Open ${esc(f.name)} on Instagram">${ic.ig}</a>`:''}</div>`).join('')}</div>`
   :`<div class="empty" style="margin:30px 8px 0;line-height:1.5">No friends yet.<br>Add a friend with their name and Instagram handle, or bring in your followers and following from Instagram's data export.</div>`}
   <p class="note" style="padding:14px 4px 30px">Instagram does not allow apps to read your friends, so Keep cannot sync with it. Friends here stay on this phone. Their names also show up as suggestions when you tag a photo.</p>`;
  $('#frNew').onclick=()=>frEdit();$('#frImp').onclick=frImportStart;
  b.querySelectorAll('.frr').forEach(r=>r.onclick=e=>{if(e.target.closest('.frig'))return;frEdit(FR.find(f=>f.id===+r.dataset.i))});
}

/* ---- add or edit one friend ---- */
function frEdit(f){
  const isNew=!f;f=f||{id:Date.now(),name:'',ig:'',photo:''};
  const copy={...f};
  const p=document.createElement('div');p.className='tagp';p.id='frp';p.style.zIndex=97;
  p.innerHTML=`<div class="tagc"><div class="tagh"><b>${isNew?'Add a friend':'Edit friend'}</b><button class="ib" id="frpX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
   <div class="pfp" style="padding:0 0 10px"><label id="frpLab" class="${copy.photo?'':'nopic'}" style="${copy.photo?`background-image:url(${copy.photo})`:''}" aria-label="Choose a photo">${copy.photo?'':'+'}<span class="cam">${ic.img.replace('width="22" height="22"','width="15" height="15"')}</span><input type="file" id="frpIn" accept="image/*" hidden></label><small>${copy.photo?'Tap to change':'Add a photo (optional)'}</small></div>
   <input id="frpName" class="frin" placeholder="Name" autocomplete="off" autocapitalize="words" maxlength="40" value="${esc(copy.name)}">
   <input id="frpIg" class="frin" placeholder="Instagram username or link (optional)" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(copy.ig?'@'+copy.ig:'')}" style="margin-top:10px">
   <div class="tagr" style="margin-top:16px"><button class="pill d" id="frpSave" style="flex:1;justify-content:center">Save</button>${isNew?'':'<button class="pill g" id="frpDel" style="color:#FF3B30">Delete</button>'}</div></div>`;
  p.style.pointerEvents='none';setTimeout(()=>{p.style.pointerEvents=''},350);
  $('#app').appendChild(p);
  const close=()=>p.remove();
  p.addEventListener('click',e=>{if(e.target===p)close()});$('#frpX').onclick=close;
  $('#frpIn').onchange=async e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;try{copy.photo=await frPhoto(fl);const l=$('#frpLab');l.style.backgroundImage=`url(${copy.photo})`;l.classList.remove('nopic');l.firstChild.textContent=''}catch(_){toast('Could not read that photo')}};
  $('#frpSave').onclick=()=>{
    const name=$('#frpName').value.trim();if(!name){$('#frpName').focus();toast('Type a name first');return}
    copy.name=name;copy.ig=igUser($('#frpIg').value);
    if(FR.some(x=>x.id!==copy.id&&pkey(x.name)===pkey(name))){toast('You already have a friend called '+name);return}
    if(isNew)FR.push(copy);else FR[FR.findIndex(x=>x.id===copy.id)]=copy;
    frSave();close();frDraw();toast(isNew?'Added '+name:'Saved');
  };
  if($('#frpDel'))$('#frpDel').onclick=()=>{
    const b=$('#frpDel');if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Tap again to delete';setTimeout(()=>{if(b.isConnected){b.textContent='Delete';delete b.dataset.arm}},2500);return}
    FR=FR.filter(x=>x.id!==copy.id);frSave();close();frDraw();toast('Removed '+copy.name);
  };
}

/* ---- import from Instagram's "Download your information" files ---- */
/* followers_1.json is a list of {string_list_data:[{value:"user",href}]}; following.json is {relationships_following:[{title:"user",string_list_data:[...]}]}; the HTML export links each user */
function igParse(text){
  const out=new Set(),add=u=>{u=igUser(u);if(u&&!/^(accounts|explore|p|reel|reels|stories|direct)$/i.test(u))out.add(u)};
  try{
    const walk=o=>{
      if(Array.isArray(o)){o.forEach(walk);return}
      if(!o||typeof o!=='object')return;
      if(Array.isArray(o.string_list_data)){
        const s=o.string_list_data[0]||{};
        if(s.value)add(s.value);else if(o.title)add(o.title);else if(s.href)add(s.href);
      }else Object.values(o).forEach(walk);
    };
    walk(JSON.parse(text));
  }catch(e){
    for(const m of text.matchAll(/instagram\.com\/([A-Za-z0-9._]{1,30})/g))add(m[1]);
  }
  return out;
}
function frImportStart(){
  const p=document.createElement('div');p.className='tagp';p.id='frp';p.style.zIndex=97;
  p.innerHTML=`<div class="tagc fcc"><div class="tagh"><b>Import from Instagram</b><button class="ib" id="frpX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
   <ol class="frsteps"><li>In Instagram: <b>Settings → Accounts Center → Your information and permissions → Download your information</b>.</li><li>Choose <b>Followers and following</b>, format <b>JSON</b>, and download.</li><li>Open the download and choose <b>followers_1.json</b> and <b>following.json</b> here.</li></ol>
   <label class="pill d" style="width:100%;justify-content:center;cursor:pointer">Choose the files<input type="file" id="frpFiles" accept=".json,.html,.htm,application/json,text/html" multiple hidden></label>
   <p class="tagn">The files are read on this phone and not uploaded. Instagram only gives usernames, not names or photos, so you can rename people afterwards.</p></div>`;
  p.style.pointerEvents='none';setTimeout(()=>{p.style.pointerEvents=''},350);
  $('#app').appendChild(p);const close=()=>p.remove();p.addEventListener('click',e=>{if(e.target===p)close()});$('#frpX').onclick=close;
  $('#frpFiles').onchange=async e=>{
    const files=[...e.target.files];e.target.value='';if(!files.length)return;
    const sets={followers:new Set(),following:new Set(),other:new Set()};
    for(const fl of files){try{const u=igParse(await fl.text()),k=/following/i.test(fl.name)?'following':/followers?/i.test(fl.name)?'followers':'other';u.forEach(x=>sets[k].add(x))}catch(_){}}
    const all_=new Set([...sets.followers,...sets.following,...sets.other]);
    if(!all_.size){toast('No Instagram usernames found in those files');return}
    close();frPick(all_,sets);
  };
}
function frPick(all_,sets){
  const have=new Set(FR.map(f=>f.ig.toLowerCase()).filter(Boolean));
  const mutual=u=>sets.followers.has(u)&&sets.following.has(u);
  const list=[...all_].filter(u=>!have.has(u.toLowerCase())).sort((a,b)=>(mutual(b)-mutual(a))||a.localeCompare(b));
  if(!list.length){toast('Everyone in those files is already a friend');return}
  const sel=new Set(),hasM=list.some(mutual);let q='';
  const p=document.createElement('div');p.className='tagp';p.id='frp';p.style.zIndex=97;
  p.innerHTML=`<div class="tagc fcc"><div class="tagh"><b>Choose friends</b><button class="ib" id="frpX" aria-label="Close" style="width:34px;height:34px">${ic.x}</button></div>
   <input id="frpQ" class="frin" placeholder="Search ${list.length} accounts" autocomplete="off" autocapitalize="off" spellcheck="false">
   <div class="tagr" style="margin:10px 0 4px">${hasM?'<button class="tagch" id="frpMut">Select mutuals</button>':''}<button class="tagch" id="frpShown">Select shown</button><button class="tagch" id="frpNone">Clear</button></div>
   <div class="frpick" id="frpList"></div>
   <button class="pill d" id="frpAdd" style="width:100%;justify-content:center;margin-top:12px"></button></div>`;
  $('#app').appendChild(p);const close=()=>p.remove();p.addEventListener('click',e=>{if(e.target===p)close()});$('#frpX').onclick=close;
  const shown=()=>list.filter(u=>!q||u.toLowerCase().includes(q)).slice(0,150);
  const draw=()=>{
    const s=shown();
    $('#frpList').innerHTML=s.map(u=>`<button class="frpi ${sel.has(u)?'on':''}" data-u="${esc(u)}"><span class="ck">✓</span><b>@${esc(u)}</b>${mutual(u)?'<em>mutual</em>':''}</button>`).join('')||'<p class="tagn" style="padding:10px 2px">No accounts match.</p>';
    $('#frpAdd').textContent=sel.size?'Add '+sel.size+' friend'+(sel.size===1?'':'s'):'Choose who to add';$('#frpAdd').disabled=!sel.size;
  };
  $('#frpQ').oninput=e=>{q=e.target.value.trim().toLowerCase().replace(/^@/,'');draw()};
  $('#frpList').onclick=e=>{const b=e.target.closest('[data-u]');if(!b)return;const u=b.dataset.u;sel.has(u)?sel.delete(u):sel.add(u);draw()};
  if($('#frpMut'))$('#frpMut').onclick=()=>{list.filter(mutual).forEach(u=>sel.add(u));draw()};
  $('#frpShown').onclick=()=>{shown().forEach(u=>sel.add(u));draw()};$('#frpNone').onclick=()=>{sel.clear();draw()};
  $('#frpAdd').onclick=()=>{
    let n=0;sel.forEach(u=>{let name=u;if(FR.some(x=>pkey(x.name)===pkey(name)))name=u+' (IG)';FR.push({id:Date.now()+n,name,ig:u,photo:''});n++});
    frSave();close();if($('#frBody'))frDraw();toast('Added '+n+' friend'+(n===1?'':'s')+'. Tap one to give them a real name.');
  };
  draw();
}
