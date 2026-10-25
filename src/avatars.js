/* ---------- Avatars: style editor, and your own .glb avatar file ---------- */
/* Meta's avatars cannot be used outside Meta's apps, so Keep has its own: change a person's look here, or import any .glb avatar
   (VRoid, Avaturn, Blender, Ready Player Me exports without compression). Looks live in this browser and ride along in backups; imported files stay on this phone. */

/* ---- imported files: one small IndexedDB per browser, keyed by the person's name ---- */
const avDB=(()=>{
  let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('keep-avatars',1);r.onupgradeneeded=()=>r.result.createObjectStore('glb');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const tx=(mode,fn)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction('glb',mode),r=fn(t.objectStore('glb'));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}));
  return{get:k=>tx('readonly',s=>s.get(k)),put:(k,v)=>tx('readwrite',s=>s.put(v,k)),del:k=>tx('readwrite',s=>s.delete(k))};
})();
function loadGLTF(){
  if(window.KeepGLTFLoader)return Promise.resolve();
  return loadThree().then(()=>{(0,eval)(document.getElementById('gltf-src').textContent);if(!window.KeepGLTFLoader)throw new Error('gltf')});
}
const parseGLB=buf=>loadGLTF().then(()=>new Promise((res,rej)=>new KeepGLTFLoader().parse(buf,'',res,rej)));

/* an imported model, sized to a person and standing on the ground, with the same handle the built-in avatar has */
function glbAvatar(gltf){
  const T=THREE,G=new T.Group(),inner=new T.Group();inner.add(gltf.scene);G.add(inner);
  gltf.scene.updateMatrixWorld(true);
  armsDown(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
  const k=1.7/Math.max(.01,size.y);
  inner.scale.setScalar(k);inner.position.set(-c.x*k,-box.min.y*k,-c.z*k);
  let pop=0,cur='stand';
  return{group:G,get pose(){return cur},set(n){cur=n},pop(){pop=0;G.scale.setScalar(.01)},
    update(t,dt){if(pop<1){pop=Math.min(1,pop+dt*2.2);const e=1+2.7*Math.pow(pop-1,3)+1.7*Math.pow(pop-1,2);G.scale.setScalar(Math.max(.01,e))}inner.rotation.z=Math.sin(t*1.6)*.006},
    dispose(){G.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(m=>{for(const q in m)if(m[q]&&m[q].isTexture)m[q].dispose();m.dispose()})}})}};
}
/* models are usually exported in a T-pose. Swing each upper arm down toward the body, whatever the rig's bone names or axes are. */
function armsDown(root){
  const T=THREE,bones=[];root.traverse(o=>{if(o.isBone)bones.push(o)});
  const key=o=>o.name.toLowerCase().replace(/[^a-z]/g,'');
  const upper=bones.filter(b=>{const n=key(b);return /upperarm|armupper/.test(n)||/^(mixamorig)?(left|right)arm$/.test(n)||/^(l|r)arm$/.test(n)});
  upper.forEach(b=>{
    const kid=b.children.find(c=>c.isBone);if(!kid)return;
    const p0=b.getWorldPosition(new T.Vector3()),p1=kid.getWorldPosition(new T.Vector3()),dir=p1.sub(p0).normalize();
    if(Math.abs(dir.y)>.6)return; /* already hanging */
    const side=Math.sign(dir.x)||1,target=new T.Vector3(side*.22,-1,0).normalize();
    const q=new T.Quaternion().setFromUnitVectors(dir,target),wq=b.getWorldQuaternion(new T.Quaternion()),pq=new T.Quaternion();
    if(b.parent)b.parent.getWorldQuaternion(pq);
    b.quaternion.copy(pq.invert().multiply(q.multiply(wq)));b.updateMatrixWorld(true);
  });
  root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});
}
/* the one place that makes a person's avatar: their imported file if they have one, else the built-in figure in their chosen look */
async function avatarFor(name){
  const k=lookKey(name);
  if(LOOKS[k]&&LOOKS[k].glb){
    try{const buf=await avDB.get(k);if(buf)return glbAvatar(await parseGLB(buf))}catch(e){console.warn('avatar file could not be shown',e)}
  }
  return buildAvatar(avLook(name));
}

/* ---- the editor: a glass panel over Re-live; every tap re-dresses the avatar standing in the scene ---- */
async function arRestyle(){
  const g=ar&&ar.gl;if(!g||!g.av||!ar.cur)return;
  const old=g.av,pos=old.group.position.clone(),rot=old.group.rotation.y,pose=old.pose,tok=ar.rs=(ar.rs||0)+1;
  const a=await avatarFor(ar.cur.who);
  if(!ar||!ar.on||tok!==ar.rs){a.dispose();return}
  g.sc.remove(old.group);old.dispose();
  a.set(pose);g.sc.add(a.group);a.group.position.copy(pos);a.group.rotation.y=rot;g.av=a;
  a.update(9,.05);a.group.scale.setScalar(1);
}
const sw=(k,i,bg,on,label)=>`<button class="sw ${on?'on':''}" data-k="${k}" data-i="${i}" style="background:${bg}" aria-label="${label||k+' '+(i+1)}"></button>`;
function avEdit(){
  if(!ar||!ar.cur)return;
  const name=ar.cur.who,key=lookKey(name);
  const draw=()=>{
    const L=avLook(name),ix=L.ix,o=LOOKS[key]||{},hasFile=!!o.glb;
    $('#edp').innerHTML=`<div class="edh"><b>${esc(firstName(name))}'s look</b><button class="edx" id="edDone">Done</button></div>
     ${hasFile?`<div class="edn">Using your imported avatar file. Remove it to style the built-in figure.</div>`:''}
     <div class="edl">Skin</div><div class="edr">${SKINS.map((c,i)=>sw('skin',i,`linear-gradient(135deg,${c[0]},${c[1]})`,ix.skin===i)).join('')}</div>
     <div class="edl">Hair</div><div class="edr">${HSTYLES.map((n,i)=>`<button class="edc ${ix.style===i?'on':''}" data-k="style" data-i="${i}">${n}</button>`).join('')}</div>
     <div class="edr">${HAIRS.map((c,i)=>sw('hair',i,c,ix.hair===i)).join('')}</div>
     <div class="edl">Top</div><div class="edr"><button class="edc ${L.hoodie?'':'on'}" data-t="hoodie" data-v="0">Tee</button><button class="edc ${L.hoodie?'on':''}" data-t="hoodie" data-v="1">Hoodie</button></div>
     <div class="edr">${TOPS.map((c,i)=>sw('top',i,`linear-gradient(135deg,${c[0]},${c[1]})`,ix.top===i)).join('')}</div>
     <div class="edl">Pants</div><div class="edr">${PANTS.map((c,i)=>sw('pants',i,c,ix.pants===i)).join('')}</div>
     <div class="edl">Extras</div><div class="edr"><button class="edc ${L.glasses?'on':''}" data-t="glasses" data-v="${L.glasses?0:1}">Glasses</button></div>
     <div class="edl">Your own avatar</div>
     <div class="edr"><label class="edc" style="cursor:pointer">${hasFile?'Replace file':'Import .glb file'}<input type="file" id="edFile" accept=".glb,.vrm,model/gltf-binary" hidden></label>${hasFile?'<button class="edc" id="edRm">Remove file</button>':''}<button class="edc" id="edReset">Reset look</button></div>
     <div class="edn" id="edMsg">Meta avatars cannot be exported, but any .glb avatar file works. It stands in the scene in an arms-down pose; sit and wave need the built-in figure.</div>`;
    $('#edDone').onclick=close;
    $('#edReset').onclick=()=>{const g=LOOKS[key];if(g&&g.glb)LOOKS[key]={glb:true};else delete LOOKS[key];saveLooks();draw();arRestyle()};
    if($('#edRm'))$('#edRm').onclick=async()=>{try{await avDB.del(key)}catch(e){}const g=LOOKS[key]||{};delete g.glb;LOOKS[key]=g;saveLooks();draw();arRestyle();toast('Avatar file removed')};
    $('#edFile').onchange=async e=>{
      const f=e.target.files[0];e.target.value='';if(!f)return;
      const msg=$('#edMsg');
      if(f.size>40e6){msg.textContent='That file is over 40 MB. Export a lighter model (smaller textures) and try again.';return}
      msg.textContent='Reading the avatar…';
      try{
        const buf=await f.arrayBuffer();await parseGLB(buf); /* make sure it opens before keeping it */
        await avDB.put(key,buf);(LOOKS[key]=LOOKS[key]||{}).glb=true;saveLooks();draw();arRestyle();toast('Avatar imported');
      }catch(err){msg.textContent='Could not read that file. It needs to be a .glb (or .vrm) without Draco or Meshopt compression.'}
    };
    $('#edp').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const o=LOOKS[key]=LOOKS[key]||{};o[b.dataset.k]=+b.dataset.i;saveLooks();draw();arRestyle()});
    $('#edp').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const o=LOOKS[key]=LOOKS[key]||{};o[b.dataset.t]=b.dataset.v==='1';saveLooks();draw();arRestyle()});
  };
  const close=()=>{const p=$('#edp');if(p)p.remove();$('#ar').classList.remove('editing');arEditEnd();arBottom()};
  if($('#edp'))return;
  arEditStart();
  const p=document.createElement('div');p.className='edp';p.id='edp';$('#ar').appendChild(p);$('#ar').classList.add('editing');
  draw();
}

/* while the panel is up, stand the avatar in the clear space above it; Done puts it back where the photo had it */
function arEditView(){
  const g=ar&&ar.gl;if(!g||!ar.edit)return;
  const W=$('#ar').clientWidth,H=$('#ar').clientHeight;
  g.cam.setViewOffset(W,H,0,H*.29,W,H);g.cam.updateProjectionMatrix();
}
function arEditStart(){
  const g=ar&&ar.gl;if(!g||!g.av)return;
  ar.edit={pos:g.av.group.position.clone(),stage:g.stage.position.clone(),base:ar.baseYaw,yaw:ar.yaw};
  g.av.group.position.set(0,0,-4.6);g.stage.position.set(0,0,-4.6);ar.baseYaw=0;ar.yaw=0;
  arEditView();
}
function arEditEnd(){
  const g=ar&&ar.gl,e=ar&&ar.edit;if(!g||!e)return;
  ar.edit=null;g.cam.clearViewOffset();g.cam.updateProjectionMatrix();
  if(g.av)g.av.group.position.copy(e.pos);g.stage.position.copy(e.stage);ar.baseYaw=e.base;ar.yaw=e.yaw;
}
