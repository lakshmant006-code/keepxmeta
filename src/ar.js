/* ---------- Re-live: put a 3D avatar where someone was, journals beside it ---------- */
const POSES=[['sit','Sit'],['stand','Stand'],['wave','Wave'],['walk','Walk']];
ic.cube=st('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',1.6);
ic.chevd=st('<path d="M6 9l6 6 6-6"/>',2);
const firstName=n=>(n||'').split(/\s+/)[0].replace(/[^\w]/g,'');
const ago=ts=>{const d=Math.round((TODAY-ts)/864e5);if(d<1)return'today';if(d<14)return d+' days ago';if(d<60)return Math.round(d/7)+' weeks ago';if(d<700)return Math.round(d/30.4)+' months ago';return Math.round(d/365)+' years ago'};
const peoplePhotos=()=>all().filter(m=>m.type==='photo'&&m.who&&src(m));
/* everything kept about this photo: linked notes, the same day, and anything that names the person */
function journalsFor(p){
  const fn=firstName(p.who).toLowerCase(),k=dk(new Date(p.ts));
  return all().filter(m=>m.id!==p.id&&(m.link===p.id||dk(new Date(m.ts))===k||(fn&&[m.text,m.name,m.who].join(' ').toLowerCase().includes(fn)))).sort((a,b)=>a.ts-b.ts).slice(0,14);
}

/* ---- matching: a small fingerprint (16x16 gradient hash + coarse colour) ---- */
function arSig(el){
  const c=arSig.c||(arSig.c=document.createElement('canvas'));c.width=17;c.height=16;
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(el,0,0,17,16);
  const d=x.getImageData(0,0,17,16).data,g=[],col=new Float32Array(48);
  for(let i=0;i<272;i++){
    const r=d[i*4],gg=d[i*4+1],b=d[i*4+2];g.push(.3*r+.59*gg+.11*b);
    const px=i%17,py=(i/17)|0;if(px<16){const k=((py>>2)*4+(px>>2))*3;col[k]+=r/16;col[k+1]+=gg/16;col[k+2]+=b/16}
  }
  const bits=[];for(let y=0;y<16;y++)for(let xx=0;xx<16;xx++)bits.push(g[y*17+xx]>g[y*17+xx+1]?1:0);
  return{bits,col};
}
function arDist(a,b){
  let h=0;for(let i=0;i<256;i++)h+=a.bits[i]^b.bits[i];
  let c=0;for(let i=0;i<48;i++)c+=Math.abs(a.col[i]-b.col[i]);
  return .6*(h/256)+.4*Math.min(1,c/48/255*3);
}
const AR_THR=.385,AR_MARGIN=.04; /* same scene, lighting and angle drift: .16-.36; different scenes: .42+ */
const loadImg=u=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u});
function loadThree(){
  if(window.THREE)return Promise.resolve();
  return new Promise((res,rej)=>{try{(0,eval)(document.getElementById('three-src').textContent);window.THREE?res():rej(new Error('three'))}catch(e){rej(e)}});
}

/* ---- the avatar: a jointed figure, posed ---- */
function buildAvatar(look){
  const T=THREE,G=new T.Group();
  const mat=(c,o)=>new T.MeshPhysicalMaterial(Object.assign({color:c,roughness:.5,clearcoat:.55,clearcoatRoughness:.3},o||{}));
  const skin=mat(look.skin[0],{roughness:.6,clearcoat:.25}),hairM=mat(look.hair,{roughness:.55,clearcoat:.3}),topM=mat(look.top[0]),pantsM=mat(look.pants,{clearcoat:.15}),shoe=mat('#f6f2ea');
  const ink=new T.MeshBasicMaterial({color:'#1b1717'}),white=new T.MeshBasicMaterial({color:'#fff'}),blush=new T.MeshBasicMaterial({color:'#ff7a8a',transparent:true,opacity:.35});
  const M=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);return o};
  const grp=(p,x,y,z)=>{const g=new T.Group();g.position.set(x||0,y||0,z||0);p.add(g);return g};
  const hips=grp(G,0,.95,0),spine=grp(hips,0,.02,0);
  hips.add(M(new T.SphereGeometry(.18,24,16),pantsM,0,0,0)).scale.set(1,.72,.88);
  spine.add(M(new T.CapsuleGeometry(.17,.36,8,20),topM,0,.3,0)).scale.set(1,1,.82);
  spine.add(M(new T.CylinderGeometry(.06,.07,.1,12),skin,0,.64,0));
  const head=grp(spine,0,.68,0);
  head.add(M(new T.SphereGeometry(.225,32,24),skin,0,.2,0)).scale.set(1,1.04,1);
  [-1,1].forEach(s=>{
    head.add(M(new T.SphereGeometry(.03,14,12),ink,s*.078,.23,.195)).scale.set(1,1.25,.6);
    head.add(M(new T.SphereGeometry(.009,8,8),white,s*.071,.24,.222));
    head.add(M(new T.SphereGeometry(.04,12,10),blush,s*.125,.15,.18)).scale.set(1,.7,.4);
    head.add(M(new T.SphereGeometry(.045,14,12),skin,s*.222,.2,0)).scale.set(.6,1,.8);
  });
  head.add(M(new T.SphereGeometry(.024,12,10),skin,0,.185,.217));
  const mouth=M(new T.TorusGeometry(.05,.008,8,20,Math.PI),ink,0,.15,.206);mouth.rotation.z=Math.PI;mouth.scale.z=.5;head.add(mouth);
  const cap=M(new T.SphereGeometry(.24,32,20,0,Math.PI*2,0,Math.PI*.56),hairM,0,.215,-.015);cap.rotation.x=-.3;head.add(cap);
  if(look.style===1){head.add(M(new T.CapsuleGeometry(.2,.3,8,16),hairM,0,.04,-.1)).scale.set(1.05,1,.62)}
  if(look.style===2){head.add(M(new T.SphereGeometry(.105,18,14),hairM,0,.47,-.05))}
  const arm=s=>{
    const sh=grp(spine,s*.225,.56,0);
    sh.add(M(new T.CapsuleGeometry(.056,.2,6,12),topM,0,-.16,0));
    const el=grp(sh,0,-.31,0);
    el.add(M(new T.CapsuleGeometry(.05,.18,6,12),skin,0,-.14,0));
    el.add(M(new T.SphereGeometry(.062,14,12),skin,0,-.31,0));
    return{sh,el};
  };
  const leg=s=>{
    const th=grp(hips,s*.09,-.03,0);
    th.add(M(new T.CapsuleGeometry(.085,.26,6,14),pantsM,0,-.21,0));
    const kn=grp(th,0,-.43,0);
    kn.add(M(new T.CapsuleGeometry(.07,.26,6,14),pantsM,0,-.21,0));
    kn.add(M(new T.SphereGeometry(.095,16,12),shoe,0,-.47,.06)).scale.set(.95,.62,1.75);
    return{th,kn};
  };
  const aL=arm(-1),aR=arm(1),lL=leg(-1),lR=leg(1);
  /* ghost seat so a sitting pose reads as sitting on something */
  const seat=M(new T.CylinderGeometry(.3,.3,.04,32),new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:0}),0,.38,-.02);G.add(seat);
  const P={hy:.95,lean:0,tL:0,kL:0,tR:0,kR:0,sL:.14,xL:0,eL:.15,sR:.14,xR:0,eR:.15,hy2:0,hx:0};
  const TG={
    stand:{hy:.95,lean:0,tL:0,kL:0,tR:0,kR:0,sL:.14,xL:0,eL:.15,sR:.14,xR:0,eR:.15},
    sit:{hy:.545,lean:.04,tL:-1.48,kL:1.5,tR:-1.48,kR:1.5,sL:.1,xL:-.55,eL:1.0,sR:.1,xR:-.55,eR:1.0},
    wave:{hy:.95,lean:0,tL:0,kL:0,tR:0,kR:0,sL:.14,xL:0,eL:.15,sR:2.55,xR:0,eR:.0},
    walk:{hy:.95,lean:.03,tL:0,kL:0,tR:0,kR:0,sL:.14,xL:0,eL:.3,sR:.14,xR:0,eR:.3}
  };
  let cur='stand',pop=0;
  const api={group:G,seat,
    set(n){cur=TG[n]?n:'stand'},get pose(){return cur},
    pop(){pop=0;G.scale.setScalar(.01)},
    update(t,dt){
      const tg=Object.assign({},TG[cur]),k=1-Math.pow(.0009,dt);
      let hb=0,hxN=0;
      if(cur==='walk'){const w=t*4.2,s=Math.sin(w);tg.tL=s*.6;tg.tR=-s*.6;tg.kL=Math.max(0,-s)*1.0;tg.kR=Math.max(0,s)*1.0;tg.xL=-s*.5;tg.xR=s*.5;hb=Math.abs(Math.cos(w))*.025}
      if(cur==='wave'){tg.eR=.35+Math.sin(t*8)*.45;hxN=Math.sin(t*1.3)*.05}
      for(const key in tg)P[key]+=(tg[key]-P[key])*(key==='tL'||key==='tR'||key==='xL'||key==='xR'?(cur==='walk'?.5:k):k);
      hips.position.y=P.hy+hb+Math.sin(t*1.8)*.004;spine.rotation.x=P.lean+Math.sin(t*1.8)*.01;
      lL.th.rotation.x=P.tL;lL.kn.rotation.x=P.kL;lR.th.rotation.x=P.tR;lR.kn.rotation.x=P.kR;
      aL.sh.rotation.z=-P.sL;aL.sh.rotation.x=P.xL;aL.el.rotation.x=-P.eL*(cur==='sit'?1:.4);
      aR.sh.rotation.z=P.sR;aR.sh.rotation.x=P.xR;aR.el.rotation.x=cur==='wave'?0:-P.eR*(cur==='sit'?1:.4);aR.el.rotation.z=cur==='wave'?P.eR:0;
      head.rotation.y=Math.sin(t*.7)*.12;head.rotation.x=hxN+Math.sin(t*.9)*.03;
      seat.material.opacity+=((cur==='sit'?.22:0)-seat.material.opacity)*k;seat.position.y=P.hy-.15;
      if(pop<1){pop=Math.min(1,pop+dt*2.2);const e=1+2.7*Math.pow(pop-1,3)+1.7*Math.pow(pop-1,2);G.scale.setScalar(Math.max(.01,e))}
    },
    dispose(){G.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}};
  return api;
}

/* ---- the overlay ---- */
let ar=null;
/* with a location fix, only memories kept within 200 m are candidates */
const arC=()=>ar.near&&ar.near.length?ar.near:ar.cands;
const arPose=m=>m.pose||'stand';
function setQ(q,a,b,g,o){
  const T=THREE,E=new T.Euler(),q1=new T.Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5)),d=T.MathUtils.degToRad;
  E.set(d(b),d(a),-d(g),'YXZ');q.setFromEuler(E);q.multiply(q1);q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-d(o)));
}
function arStatus(t,ok){const s=$('#arStat');if(s){s.className='arstat'+(ok?' ok':'');s.innerHTML='<i></i>'+t}}
async function openAR(pid){
  if(ar)return;
  const a=$('#ar');
  ar={on:true,cands:peoplePhotos(),sigs:new Map(),cur:null,yaw:0,t0:performance.now(),last:performance.now(),stream:null,hit:0,hitId:0,card:true};
  a.innerHTML=`<video id="arCam" playsinline muted autoplay></video><div class="arbg" id="arBg"></div><canvas id="arGL"></canvas><div class="arsticker" id="arSt"></div><div class="arscan" id="arScan"><i></i><i></i><i></i><i></i></div>
   <div class="artop"><button class="arib" id="arX" aria-label="Close">${ic.x}</button><div class="arstat" id="arStat"></div><span style="width:40px"></span></div>
   <aside class="arcard" id="arCard" aria-label="Journals"></aside><div class="arbot" id="arBot"></div>`;
  a.classList.add('on');
  $('#arX').onclick=closeAR;
  /* motion permission must be asked inside the tap that opened this */
  try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{})}catch(e){}
  ar.onDev=e=>{if(e.alpha!=null&&e.beta!=null)ar.dev={a:e.alpha,b:e.beta,g:e.gamma,o:(screen.orientation&&screen.orientation.angle)||0}};
  addEventListener('deviceorientation',ar.onDev);
  const gl=$('#arGL');
  ar.down=e=>{ar.drag={x:e.clientX,y:e.clientY};try{gl.setPointerCapture(e.pointerId)}catch(_){}};
  ar.move=e=>{if(!ar.drag)return;ar.yaw+=(e.clientX-ar.drag.x)*.012;ar.drag.x=e.clientX};
  ar.up=()=>{ar.drag=null};
  gl.addEventListener('pointerdown',ar.down);gl.addEventListener('pointermove',ar.move);gl.addEventListener('pointerup',ar.up);gl.addEventListener('pointercancel',ar.up);
  arStatus('Starting…');
  try{await loadThree();arInitGL()}catch(e){ar.gl=null}
  if(!ar||!ar.on)return;
  arBottom();
  if(pid){const p=ar.cands.find(x=>x.id===pid);if(p){await arLock(p,'photo');arTick();return}}
  arTick();arScanStart();
  gps(pos=>{if(!ar||!ar.on)return;const n=ar.cands.filter(p=>geoOf(p)&&meters(pos,geoOf(p))<200);if(n.length){ar.near=n;if(!ar.cur)arBottom()}});
}
function arInitGL(){
  const T=THREE,cv=$('#arGL'),r=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true});
  r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setClearColor(0,0);
  const sc=new T.Scene(),rig=new T.Group(),cam=new T.PerspectiveCamera(50,1,.1,60);
  rig.position.set(0,1.45,0);rig.rotation.x=-.1;rig.add(cam);sc.add(rig);
  sc.add(new T.HemisphereLight(0xffffff,0x8a8fa8,2.4));
  const dl=new T.DirectionalLight(0xffffff,2.8);dl.position.set(2.5,4,3);sc.add(dl);
  const rim=new T.DirectionalLight(0xbfd4ff,1.2);rim.position.set(-3,2,-2);sc.add(rim);
  /* contact shadow + the ring that marks the spot */
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  const shadow=new T.Mesh(new T.PlaneGeometry(1.3,1.3),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;
  const ringM=new T.MeshBasicMaterial({color:0x4599ff,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});
  const ring=new T.Mesh(new T.RingGeometry(.52,.56,48),ringM);ring.rotation.x=-Math.PI/2;ring.position.y=.01;
  const stage=new T.Group();stage.add(shadow,ring);stage.visible=false;sc.add(stage);
  ar.gl={r,sc,rig,cam,stage,ring,ringM,av:null,q0:null};
  arResize();ar.rs=()=>arResize();addEventListener('resize',ar.rs);
}
function arResize(){
  if(!ar||!ar.gl)return;const a=$('#ar'),w=a.clientWidth,h=a.clientHeight;
  ar.gl.r.setSize(w,h,false);ar.gl.cam.aspect=w/h;ar.gl.cam.updateProjectionMatrix();
}
function arTick(){
  if(!ar||!ar.on)return;ar.raf=requestAnimationFrame(arTick);
  const g=ar.gl;if(!g)return;
  const now=performance.now(),t=(now-ar.t0)/1000,dt=Math.min(.05,(now-ar.last)/1000);ar.last=now;
  if(g.stage.visible&&ar.gyro&&ar.dev&&ar.useGyro){
    const q=new THREE.Quaternion();setQ(q,ar.dev.a,ar.dev.b,ar.dev.g,ar.dev.o);
    if(!g.q0)g.q0=q.clone();g.cam.quaternion.copy(q.multiply(g.q0.clone().invert()));
  }
  if(g.av){g.av.update(t,dt);g.av.group.rotation.y=ar.baseYaw+ar.yaw}
  g.ring.scale.setScalar(1+.06*Math.sin(t*3));g.ringM.opacity=.55+.3*Math.sin(t*3);
  g.r.render(g.sc,g.cam);
}
/* where was the person standing in the photo, as a point on the ground in front of the viewer */
function arPlace(p){
  const g=ar.gl,at=p.at||[.5,.74];
  const W=$('#ar').clientWidth,H=$('#ar').clientHeight,iw=ar.img?ar.img.naturalWidth:W,ih=ar.img?ar.img.naturalHeight:H,s=Math.max(W/iw,H/ih);
  const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  /* the photo is cropped to fill the screen, so keep the spot inside what is visible */
  const sx=cl((W-iw*s)/2+at[0]*iw*s,W*.2,W*.84),sy=cl((H-ih*s)/2+at[1]*ih*s,H*.62,H*.9);
  g.rig.updateMatrixWorld(true);g.cam.updateMatrixWorld(true);
  const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2(sx/W*2-1,-(sy/H*2-1)),g.cam);
  const pt=new THREE.Vector3();
  if(!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),pt)||pt.length()>14)pt.set(0,0,-4.5);
  return pt;
}
async function arLock(p,how){
  ar.cur=p;ar.hit=0;ar.how=how;ar.baseYaw=0;ar.yaw=0;
  try{ar.img=await loadImg(src(p))}catch(e){ar.img=null}
  if(!ar||!ar.on)return;
  const live=how==='camera';
  $('#arCam').style.display=live?'block':'none';
  const bg=$('#arBg');bg.style.display=live?'none':'block';bg.style.backgroundImage=`url(${src(p)})`;
  $('#arScan').classList.remove('on');
  const look=avLook(p.who),g=ar.gl;
  if(g){
    g.stage.visible=true;g.q0=null;g.cam.quaternion.identity();
    if(g.av){g.sc.remove(g.av.group);g.av.dispose()}
    g.av=buildAvatar(look);g.av.set(arPose(p));g.av.pop();g.sc.add(g.av.group);
    const pt=arPlace(p);g.av.group.position.copy(pt);g.stage.position.set(pt.x,0,pt.z);
    ar.baseYaw=Math.atan2(-pt.x,-pt.z)*.5;
    ar.useGyro=true;ar.gyro=!!ar.dev;
  }else{
    const st=$('#arSt');st.style.display='block';st.innerHTML=avatar(p.who);
    const W=$('#ar').clientWidth,H=$('#ar').clientHeight,at=p.at||[.5,.74];st.style.left=at[0]*W+'px';st.style.top=at[1]*H+'px';
  }
  arStatus(`Matched · ${longDay(new Date(p.ts))} · ${ago(p.ts)}`,true);
  arCard(p);arBottom();
}
function arScanStart(){
  ar.cur=null;
  const g=ar.gl;if(g){g.stage.visible=false;if(g.av){g.sc.remove(g.av.group);g.av.dispose();g.av=null}}
  const st=$('#arSt');if(st)st.style.display='none';
  $('#arBg').style.display='none';$('#arCard').classList.remove('on');
  arBottom();
  if(!ar.cands.length){arStatus('Keep a photo with someone in it first');return}
  arStatus('Starting camera…');
  if(ar.stream){arStatus('Looking for a place you kept…');arScanLoop();return}
  (async()=>{
    try{
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw 0;
      ar.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      if(!ar||!ar.on){ar.stream.getTracks().forEach(t=>t.stop());return}
      const v=$('#arCam');v.srcObject=ar.stream;v.style.display='block';
      $('#arScan').classList.add('on');arStatus('Looking for a place you kept…');arBottom();
      for(const p of ar.cands){try{ar.sigs.set(p.id,arSig(await loadImg(src(p))))}catch(e){}}
      arScanLoop();
    }catch(e){if(ar&&ar.on){ar.stream=null;arStatus('No camera here · pick a memory');$('#arBg').style.display='none'}}
  })();
}
function arScanLoop(){
  clearInterval(ar.iv);
  ar.iv=setInterval(()=>{
    const v=$('#arCam');if(!ar||ar.cur||!v||v.readyState<2||!ar.stream)return;
    $('#arScan').classList.add('on');
    const s=arSig(v);let best=null,bd=9,b2=9;
    arC().forEach(p=>{const q=ar.sigs.get(p.id);if(!q)return;const d=arDist(s,q);if(d<bd){b2=bd;bd=d;best=p}else if(d<b2)b2=d});
    ar.lastD=bd;
    if(best&&bd<AR_THR&&b2-bd>AR_MARGIN){if(ar.hitId===best.id)ar.hit++;else{ar.hitId=best.id;ar.hit=1}if(ar.hit>=2){clearInterval(ar.iv);arLock(best,'camera')}}
    else{ar.hit=0;ar.hitId=0}
  },450);
}
function arBottom(){
  const b=$('#arBot');if(!b)return;
  const chips=arC().map(p=>`<button class="archip ${ar.cur&&ar.cur.id===p.id?'on':''}" data-pid="${p.id}"><img src="${src(p)}" alt="">${esc(firstName(p.who))} · ${MS[new Date(p.ts).getMonth()]} ${new Date(p.ts).getDate()}</button>`).join('');
  if(!ar.cur){
    b.innerHTML=`<div class="arhint">${ar.near&&ar.near.length?ar.near.length+' kept within 200 m of you':ar.stream?'Point at a place you kept, or try one of these':'Pick a memory to stand in its place'}</div><div class="arrow">${chips}</div>`;
  }else{
    b.innerHTML=`<div class="arrow">${POSES.map(x=>`<button class="archip t ${ar.gl&&ar.gl.av&&ar.gl.av.pose===x[0]?'on':''}" data-pose="${x[0]}">${x[1]}</button>`).join('')}</div>
     <div class="arctl"><button class="archip t" id="arAgain">Scan again</button><button class="arshut" id="arShot" aria-label="Capture"><i></i></button><button class="archip t" id="arSw">${ar.how==='camera'?'Scene photo':'Live camera'}</button></div>`;
    $('#arAgain').onclick=()=>arScanStart();
    $('#arShot').onclick=arCapture;
    $('#arSw').onclick=async()=>{
      if(ar.how==='camera'){arLockHow('photo')}
      else{
        try{if(!ar.stream){ar.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});$('#arCam').srcObject=ar.stream}arLockHow('camera')}catch(e){toast('No camera available')}
      }
    };
  }
  b.onclick=e=>{
    const c=e.target.closest('[data-pid]');if(c){const p=ar.cands.find(x=>x.id===+c.dataset.pid);if(p){clearInterval(ar.iv);arLock(p,'photo')}return}
    const q=e.target.closest('[data-pose]');if(q&&ar.gl&&ar.gl.av){ar.gl.av.set(q.dataset.pose);b.querySelectorAll('[data-pose]').forEach(x=>x.classList.toggle('on',x===q))}
  };
}
function arLockHow(how){
  ar.how=how;const live=how==='camera';
  $('#arCam').style.display=live?'block':'none';$('#arBg').style.display=live?'none':'block';
  arBottom();
}
function arCard(p){
  const c=$('#arCard'),J=journalsFor(p),k=dk(new Date(p.ts));
  const row=m=>{
    const same=dk(new Date(m.ts))===k,when=(same?'':MS[new Date(m.ts).getMonth()]+' '+new Date(m.ts).getDate()+' · ')+tstr(m.ts);
    let body='';
    if(m.type==='quote')body=`<div class="jb q">“${esc(m.text)}”${m.who?' · '+esc(m.who):''}</div>`;
    else if(m.type==='voice')body=`<div class="jm"><span class="pl2">${ic.play}</span><span style="font-size:12px;opacity:.85">${esc(m.dur||'')}</span></div><div class="jb">${esc(m.text||'')}</div>`;
    else if(m.type==='photo'||m.type==='video')body=`<div class="jm">${src(m)?`<img src="${src(m)}" alt="">`:''}<div class="jb" style="margin:0">${esc(m.text||'')}</div></div>`;
    else if(m.type==='person')body=`<div class="jb"><b>${esc(m.name)}.</b> ${esc(m.text||'')}</div>`;
    else if(m.type==='file')body=`<div class="jb"><b>${esc(m.name)}</b> ${esc(m.text||'')}</div>`;
    else if(m.type==='place')body=`<div class="jb">${esc(m.name)}</div>`;
    else body=`<div class="jb">${esc(m.text||'')}</div>`;
    return `<div class="jr"><div class="jt"><span>${TL[m.type]}</span><em style="font-style:normal">${when}</em></div>${body}</div>`;
  };
  c.className='arcard';
  c.innerHTML=`<button class="arch" id="arCh"><div class="pa">${avatar(p.who)}</div><div><b>${esc(p.who)}</b><small>${fullDay(new Date(p.ts))} · ${ago(p.ts)}</small></div><span class="cv2">${ic.chevd}</span></button>
   <div class="arbody"><div class="arorig"><img src="${src(p)}" alt=""><div><p>${esc(p.text||'The photo you kept')}</p><em>The original · ${esc(arPose(p))}</em></div></div>
   <div class="arlab">${J.length} journal${J.length===1?'':'s'}</div><div id="arJ">${J.map(row).join('')||'<div class="jb" style="opacity:.8;padding:6px 2px">Nothing written yet. Add the first line below.</div>'}</div></div>
   <div class="arad"><input id="arNote" placeholder="Add to this memory" autocomplete="off" aria-label="Add to this memory"><button id="arAdd" aria-label="Add">${ic.up.replace('width="22" height="22"','width="18" height="18"')}</button></div>`;
  $('#arCh').onclick=()=>c.classList.toggle('min');
  const add=()=>{
    const v=$('#arNote').value.trim();if(!v)return;
    const now=new Date(),o={id:Date.now(),ts:new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate(),now.getHours(),now.getMinutes()).getTime(),type:'text',text:v,link:p.id};
    user.push(o);persistUser();refresh();$('#arNote').value='';arCard(p);toast('Added to this memory');
  };
  $('#arAdd').onclick=add;$('#arNote').addEventListener('keydown',e=>{if(e.key==='Enter')add()});
  requestAnimationFrame(()=>c.classList.add('on'));
}
/* capture what you are looking at, avatar included, as a new photo linked to the memory */
function arCapture(){
  const p=ar.cur;if(!p)return;
  const g=ar.gl,a=$('#ar'),W=a.clientWidth,H=a.clientHeight,k=Math.min(1,720/Math.max(W,H)),c=document.createElement('canvas');c.width=Math.round(W*k);c.height=Math.round(H*k);
  const x=c.getContext('2d'),cover=(el,iw,ih)=>{const s=Math.max(c.width/iw,c.height/ih);x.drawImage(el,(c.width-iw*s)/2,(c.height-ih*s)/2,iw*s,ih*s)};
  const v=$('#arCam');
  if(ar.how==='camera'&&v.videoWidth)cover(v,v.videoWidth,v.videoHeight);else if(ar.img)cover(ar.img,ar.img.naturalWidth,ar.img.naturalHeight);
  if(g){g.r.render(g.sc,g.cam);x.drawImage(g.r.domElement,0,0,c.width,c.height)}
  const now=new Date(),o={id:Date.now(),ts:new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate(),now.getHours(),now.getMinutes()).getTime(),type:'photo',src:c.toDataURL('image/jpeg',.72),ar:W>=H?'4 / 3':'3 / 4',text:'Back where '+firstName(p.who)+' was · '+ago(p.ts).replace('ago','earlier'),link:p.id};
  user.push(o);persistUser();refresh();arCard(p);toast('Kept');
}
function closeAR(){
  if(!ar)return;
  ar.on=false;cancelAnimationFrame(ar.raf);clearInterval(ar.iv);
  removeEventListener('deviceorientation',ar.onDev);if(ar.rs)removeEventListener('resize',ar.rs);
  if(ar.stream)ar.stream.getTracks().forEach(t=>t.stop());
  if(ar.gl){if(ar.gl.av)ar.gl.av.dispose();ar.gl.r.dispose();try{ar.gl.r.forceContextLoss()}catch(e){}}
  const a=$('#ar');a.classList.remove('on');a.innerHTML='';ar=null;blurAll();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ar]');if(b){e.stopPropagation();closeSheet();openAR(+b.dataset.ar)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ar)closeAR()});
