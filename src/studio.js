/* ---------- Keep Studio: make a little 3D version of yourself ---------- */
/* A detailed, stylized character built on the phone with Three.js (no account, no upload). Face, hair, body, style and motion are separate tabs;
   the choices are saved as a small versioned recipe plus a picture, so the avatar can be re-dressed without being re-made. */
const STK='kept.studio';
const ST={
  skin:['#FFE0CC','#F7CDB0','#EDB88F','#D99A6C','#B87853','#8F5A3C','#6B4129','#4A2C1D','#F2C9A8','#C58B63','#A06A46','#7A4B32'],
  hairc:['#1B1412','#30221C','#5A3A26','#8A5A32','#B9803F','#D8B36A','#E9D9A8','#A8412B','#7A2E5C','#3E5CAD','#2D8F7B','#B9B9C2'],
  eyec:['#3B2A20','#6A4A2E','#4C7A9E','#4E8A5A','#6B6F76','#7A4C8C'],
  outc:['#FF8A3D','#2D2A32','#F4EFE6','#5DA9FF','#2FB8A6','#E5484D','#7C5CFF','#F3C84B','#6B8F5A','#C77C4E','#A9B4C2','#FF6FA3'],
  bg:['#F6E7D8','#E9EDF7','#E5F3EA','#F8E1E4','#FFE9B8','#2B2A33'],
  face:[['Oval',{w:1,h:1.02,jw:.82,jy:-.17}],['Round',{w:1.08,h:.98,jw:.92,jy:-.15}],['Square',{w:1.03,h:1,jw:1.02,jy:-.16}],['Heart',{w:1.02,h:1,jw:.62,jy:-.19}],['Long',{w:.94,h:1.12,jw:.78,jy:-.2}]],
  eyes:[['Round',{sx:1,sy:1.05,tilt:0}],['Almond',{sx:1.12,sy:.82,tilt:.14}],['Sleepy',{sx:1.05,sy:.7,tilt:-.1}],['Wide',{sx:1.1,sy:1.18,tilt:0}]],
  brows:[['Soft',{t:.9,a:.05}],['Thick',{t:1.5,a:0}],['Arched',{t:1,a:.22}],['Straight',{t:1.1,a:-.02}]],
  nose:[['Small',.85],['Medium',1],['Strong',1.25]],
  mouth:[['Small',.85],['Medium',1],['Wide',1.2]],
  hair:['Buzz','Short','Swept','Curly','Afro','Long','Bob','Bun','Ponytail','Bald'],
  beard:['None','Stubble','Moustache','Beard'],
  outfit:['Tee','Hoodie','Sweater','Shirt','Jacket'],
  body:['Slim','Medium','Broad'],
  glasses:['None','Round','Square','Shades'],
  head:['None','Beanie','Headband'],
  ears:['None','Studs','Hoops'],
  expr:[['Calm',{smile:.15}],['Smile',{smile:.8,cheek:.5}],['Laugh',{smile:1,open:.65,squint:.55,cheek:.9}],['Surprised',{open:.7,brow:1,wide:.25}],['Wink',{smile:.65,wink:1,cheek:.4}],['Thinking',{brow:.5,smile:-.1,look:1}]]
};
const stMax={skin:11,face:4,eyes:3,eyec:5,brows:3,nose:2,mouth:2,cheeks:1,freckles:1,beard:3,hair:9,hairc:11,outfit:4,outc:11,body:2,glasses:3,head:2,hatc:11,ears:2,bg:5,idle:1};
const stDefault=()=>({v:1,skin:3,face:0,eyes:0,eyec:1,brows:0,nose:1,mouth:1,cheeks:1,freckles:0,beard:0,hair:1,hairc:1,outfit:1,outc:0,body:1,glasses:0,head:0,hatc:3,ears:0,bg:0,idle:0});
/* every value is checked against the catalog, so an old or damaged recipe can never break the avatar */
function stClean(c){const d=stDefault(),o={v:1};for(const k in d){if(k==='v')continue;const n=+((c||{})[k]);o[k]=Number.isFinite(n)&&n>=0&&n<=stMax[k]?Math.floor(n):d[k]}return o}
const stLoad=()=>{try{const o=JSON.parse(localStorage.getItem(STK)||'null');return o&&o.cfg?{cfg:stClean(o.cfg),snap:/^data:image\//.test(o.snap||'')?o.snap:'',real:!!o.real}:null}catch(e){return null}};
const stPut=(cfg,snap,real)=>{try{localStorage.setItem(STK,JSON.stringify({v:1,cfg,snap,real:real?1:0}));return true}catch(e){toast('Could not save. Storage may be full.');return false}};
const stSnap=()=>{const o=stLoad();return o?o.snap:''};

/* ---- the character ---- */
function stBuild(cfg){
  const T=THREE,G=new T.Group(),skinC=ST.skin[cfg.skin],hairC=ST.hairc[cfg.hairc],F=ST.face[cfg.face][1],E=ST.eyes[cfg.eyes][1],B=ST.brows[cfg.brows][1],NS=ST.nose[cfg.nose][1],MW=ST.mouth[cfg.mouth][1];
  const bs=[.9,1,1.12][cfg.body],out=ST.outc[cfg.outc],mat=(c,o)=>new T.MeshPhysicalMaterial(Object.assign({color:c,roughness:.55,clearcoat:.3,clearcoatRoughness:.4},o||{}));
  const skin=mat(skinC,{roughness:.62,clearcoat:.18}),hairM=mat(hairC,{roughness:.5,clearcoat:.4}),outM=mat(out,{roughness:.8,clearcoat:.05}),
    ink=new T.MeshBasicMaterial({color:'#1b1414'}),white=new T.MeshBasicMaterial({color:'#fffdf8'}),lip=mat('#B5525A',{roughness:.5});
  const add=(p,g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);p.add(o);return o};
  const grp=(p,x,y,z)=>{const g=new T.Group();g.position.set(x||0,y||0,z||0);p.add(g);return g};
  const S=(r,ws,hs,a,b,c,d)=>new T.SphereGeometry(r,ws||32,hs||24,a,b,c,d),C=(r,l)=>new T.CapsuleGeometry(r,l,8,16);
  /* body */
  const body=grp(G,0,0,0),torso=grp(body,0,1.02,0);
  add(torso,C(.2,.34),outM,0,0,0).scale.set(1.12*bs,1,.7);
  add(body,new T.CylinderGeometry(.068,.078,.2,20),skin,0,1.37,0);
  [-1,1].forEach(s=>add(body,S(.092*bs+.01,24,16),outM,s*.215*bs,1.25,0));
  const leftArm=grp(body,-.24*bs,1.25,0);add(leftArm,C(.056,.3),outM,0,-.2,0);add(leftArm,S(.05,16,12),skin,0,-.4,0);leftArm.rotation.z=-.1;
  const rArm=grp(body,.24*bs,1.25,0),rFore=grp(rArm,0,-.34,0);add(rArm,C(.056,.26),outM,0,-.17,0);add(rFore,C(.048,.22),outM,0,-.13,0);add(rFore,S(.052,16,12),skin,0,-.28,0);rArm.rotation.z=.1;
  /* outfit details */
  const dark=mat(new T.Color(out).multiplyScalar(.7).getStyle());
  if(cfg.outfit===0)add(body,new T.TorusGeometry(.072,.014,10,28),dark,0,1.275,.012).rotation.x=Math.PI/2;
  if(cfg.outfit===1){add(body,new T.TorusGeometry(.12,.055,12,32),outM,0,1.27,-.05).rotation.x=Math.PI/2.4;[-1,1].forEach(s=>{add(body,C(.007,.1),white,s*.03,1.12,.14)})}
  if(cfg.outfit===2){add(body,new T.TorusGeometry(.085,.034,12,32),outM,0,1.28,.01).rotation.x=Math.PI/2;add(torso,new T.TorusGeometry(.215*bs,.025,10,32),dark,0,-.2,0).rotation.x=Math.PI/2}
  if(cfg.outfit===3){[-1,1].forEach(s=>{const c=add(body,new T.BoxGeometry(.09,.012,.07),white,s*.05,1.28,.085);c.rotation.z=-s*.5;c.rotation.x=-.5});for(let i=0;i<3;i++)add(torso,S(.011,8,8),dark,0,.1-i*.1,.14)}
  if(cfg.outfit===4){const inner=mat('#F4EFE6');add(body,new T.BoxGeometry(.1,.3,.02),inner,0,1.1,.135);[-1,1].forEach(s=>{const l=add(body,new T.BoxGeometry(.075,.2,.016),dark,s*.07,1.19,.14);l.rotation.z=s*.35})}
  /* head */
  const head=grp(G,0,1.6,0),face=grp(head,0,0,0);
  add(face,S(.24,48,36),skin,0,0,0).scale.set(F.w,F.h,.98);
  add(face,S(.2,40,28),skin,0,F.jy,-.035).scale.set(F.jw,.8,.88);
  [-1,1].forEach(s=>add(face,S(.045,16,12),skin,s*.238*F.w,0,-.01).scale.set(.55,1,.8));
  /* eyes */
  const eyes=[],X=.088;
  [-1,1].forEach(s=>{
    const g=grp(face,s*X,.03,.205),sc=add(g,S(.042,24,18),white,0,0,0);sc.scale.set(E.sx,E.sy,.5);
    const iris=add(g,S(.027,20,16),mat(ST.eyec[cfg.eyec],{roughness:.3,clearcoat:.8}),0,0,.014);iris.scale.set(E.sx*.9,E.sy*.9,.35);
    add(iris,S(.0135,12,10),ink,0,0,.012);add(iris,S(.006,8,8),new T.MeshBasicMaterial({color:'#fff'}),.009,.011,.02);
    const lid=add(g,S(.047,24,18),skin,0,.04*E.sy,.004);lid.scale.set(E.sx,.5*E.sy,.55);
    g.rotation.z=-s*E.tilt;eyes.push({g,iris,lid,s,sy:E.sy});
  });
  /* brows */
  const brows=[-1,1].map(s=>{const b=add(face,C(.0065*B.t,.06),mat(cfg.hairc>=0?hairC:'#222',{roughness:.7}),s*X,.098,.208);b.rotation.z=Math.PI/2-s*B.a;b.rotation.y=-s*.25;return{b,s,y:.098}});
  /* nose */
  add(face,S(.028*NS,20,16),skin,0,-.022,.238);add(face,C(.012*NS,.05),skin,0,.01,.228).scale.z=.6;
  /* mouth */
  const mouth=grp(face,0,-.098,.222),cav=add(mouth,S(.034*MW,16,12),mat('#5A1F25',{roughness:.7,clearcoat:0}),0,0,-.004);cav.scale.set(1,.01,.4);cav.visible=false;
  const arc=add(mouth,new T.TorusGeometry(.044*MW,.0075,10,28,Math.PI),lip,0,0,0);arc.rotation.z=Math.PI;arc.scale.set(1,.2,.5);
  /* cheeks, freckles */
  const blushM=new T.MeshBasicMaterial({color:'#FF7A8A',transparent:true,opacity:.3,depthWrite:false}),blush=[-1,1].map(s=>{const m=add(face,S(.04,16,12),blushM,s*.13*F.w,-.045,.188);m.scale.set(1,.7,.35);return m});
  if(cfg.freckles){const fm=new T.MeshBasicMaterial({color:new T.Color(skinC).multiplyScalar(.62).getStyle()});let r=7;const rnd=()=>(r=(r*9301+49297)%233280)/233280;for(let i=0;i<22;i++){const s=i%2?1:-1,x=s*(.03+rnd()*.1),y=-.035+rnd()*.075;add(face,S(.0042,6,6),fm,x*F.w,y,.228-Math.abs(x)*.28)}}
  /* facial hair */
  if(cfg.beard===1)add(face,S(.2478,40,28,0,Math.PI*2,Math.PI*.56,Math.PI*.44),new T.MeshBasicMaterial({color:hairC,transparent:true,opacity:.3,depthWrite:false}),0,0,0).scale.set(F.w,F.h,.98);
  if(cfg.beard===2){const mm=add(face,C(.014,.075),hairM,0,-.066,.228);mm.rotation.z=Math.PI/2;mm.scale.z=.8}
  if(cfg.beard===3){add(face,S(.2495,40,28,0,Math.PI*2,Math.PI*.52,Math.PI*.46),hairM,0,0,0).scale.set(F.w,F.h,.98);add(face,C(.016,.07),hairM,0,-.068,.226).rotation.z=Math.PI/2}
  /* hair */
  const hairG=grp(head,0,0,0);
  const cap=(fr,r,y,z)=>{const m=add(hairG,S(r||.255,48,32,0,Math.PI*2,0,Math.PI*fr),hairM,0,y==null?.02:y,z==null?-.012:z);m.rotation.x=-.5;m.scale.set(F.w,F.h,1);return m};
  const hs=ST.hair[cfg.hair];
  if(hs==='Buzz')cap(.47,.247);
  if(hs==='Short'){cap(.56);add(hairG,S(.12,20,14),hairM,.04,.205,.14).scale.set(1.6,.5,.6)}
  if(hs==='Swept'){cap(.58);const f=add(hairG,S(.15,24,16),hairM,-.07,.2,.14);f.scale.set(1.5,.55,.7);f.rotation.z=.3}
  if(hs==='Curly'){cap(.5,.245);for(let i=0;i<26;i++){const t=Math.acos(1-1.05*(i+.5)/26),p=i*2.399963,r=.245;if(Math.sin(t)*Math.sin(p)>.3&&Math.cos(t)<.62)continue;add(hairG,S(.066,12,10),hairM,Math.sin(t)*Math.cos(p)*r*F.w,Math.cos(t)*r*F.h+.03,Math.sin(t)*Math.sin(p)*r-.02)}}
  if(hs==='Afro'){add(hairG,S(.34,40,30),hairM,0,.09,-.13).scale.set(1,.96,.9);add(hairG,S(.2,24,16),skin,0,-.02,.1).visible=false}
  if(hs==='Long'){cap(.58);add(hairG,C(.2,.42),hairM,0,-.2,-.1).scale.set(1.18,1,.6);[-1,1].forEach(s=>add(hairG,C(.05,.3),hairM,s*.215*F.w,-.12,.02))}
  if(hs==='Bob'){cap(.6);add(hairG,C(.19,.1),hairM,0,-.08,-.07).scale.set(1.28,1,.8);[-1,1].forEach(s=>add(hairG,C(.07,.14),hairM,s*.215*F.w,-.06,0))}
  if(hs==='Bun'){cap(.55);add(hairG,S(.095,24,18),hairM,0,.275,-.055)}
  if(hs==='Ponytail'){cap(.56);const p=add(hairG,C(.05,.26),hairM,0,-.05,-.27);p.rotation.x=.4}
  /* headwear, glasses, earrings */
  const acc=mat(ST.outc[cfg.hatc],{roughness:.8,clearcoat:.05});
  if(cfg.head===1){add(head,S(.268,40,28,0,Math.PI*2,0,Math.PI*.5),acc,0,.045,-.01).scale.set(F.w,1.1,1);add(head,new T.TorusGeometry(.262,.03,10,40),acc,0,.04,-.01).rotation.x=Math.PI/2;add(head,S(.03,12,10),acc,0,.34,-.01)}
  if(cfg.head===2)add(head,new T.TorusGeometry(.245,.018,10,40),acc,0,.12,-.005).rotation.x=Math.PI/2-.1;
  if(cfg.glasses){
    const frame=mat(cfg.glasses===3?'#16161a':'#2a2024',{roughness:.35,clearcoat:.7}),lens=new T.MeshPhysicalMaterial({color:cfg.glasses===3?'#101014':'#cfe6ff',transparent:true,opacity:cfg.glasses===3?.82:.14,roughness:.1});
    [-1,1].forEach(s=>{
      const sq=cfg.glasses===2,fr=add(face,sq?new T.TorusGeometry(.066,.0065,6,4):new T.TorusGeometry(.058,.0065,12,32),frame,s*X,.03,.236);if(sq){fr.rotation.z=Math.PI/4;fr.scale.set(1.05,.82,1)}
      add(face,new T.CircleGeometry(sq?.05:.056,24),lens,s*X,.03,.236).scale.set(sq?1.2:1,sq?.8:1,1);
      const arm=add(face,C(.004,.2),frame,s*.2,.035,.14);arm.rotation.x=Math.PI/2
    });
    add(face,C(.005,.03),frame,0,.04,.238).rotation.z=Math.PI/2;
  }
  if(cfg.ears){const gold=mat('#E8C27A',{roughness:.25,clearcoat:.9});[-1,1].forEach(s=>{if(cfg.ears===1)add(face,S(.012,10,8),gold,s*.24*F.w,-.045,.02);else add(face,new T.TorusGeometry(.028,.0045,8,20),gold,s*.24*F.w,-.075,.02).rotation.y=Math.PI/2})}
  /* lights */
  const lights=[new T.HemisphereLight(0xffffff,0xd8c8b8,1.05),(()=>{const l=new T.DirectionalLight(0xffffff,1.1);l.position.set(1.2,2.4,2.6);return l})(),(()=>{const l=new T.DirectionalLight(0xffd3a8,.5);l.position.set(-2,1.6,-1.4);return l})()];
  lights.forEach(l=>G.add(l));
  const dispose=()=>G.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)[].concat(o.material).forEach(m=>m.dispose())});
  return{group:G,head,face,torso,rArm,rFore,leftArm,eyes,brows,mouth,arc,cav,blush,blushM,MW,dispose};
}

/* ---- the studio ---- */
let stS=null;
const stTabs=[['face','Face'],['hair','Hair'],['body','Body'],['style','Style'],['motion','Motion']];
const stCam={real:[1.55,1.75,1.5],face:[1.6,1.55,1.58],hair:[1.68,1.95,1.62],body:[1.3,3.4,1.3],style:[1.6,1.6,1.58],motion:[1.42,2.9,1.38]};
const stClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
async function studioOpen(opts){
  const el=$('#studio');if(!el||el.classList.contains('on'))return;
  try{await loadThree()}catch(e){toast('3D is not available on this device');return}
  const saved=stLoad(),S=stS={cfg:saved?saved.cfg:stDefault(),undo:[],redo:[],tab:'face',opts:opts||{},yaw:0,tyaw:0,zoom:1,tzoom:1,ex:{smile:.2},tex:{smile:.2},cur:{smile:.2,open:0,brow:0,squint:0,wink:0,cheek:0,wide:0,look:0},
    blink:0,nextBlink:2,g:null,av:null,look:{x:0,y:0},tl:{x:0,y:0},cam:{y:1.58,z:.95,ly:1.56},raf:0,on:true,last:performance.now(),squish:0};
  el.innerHTML=`<div class="stt"><button class="stb" id="stX" aria-label="Close">${ic.x}</button><div class="stn"><small>Keep Studio</small><b>Make it yours.</b></div><span class="stsp"></span></div>
   <div class="stv" id="stV"><canvas id="stC" aria-label="Your avatar. Drag to rotate."></canvas><div class="sth" id="stH">Drag to rotate · Pinch to zoom</div>
    <div class="stz"><button id="stL" aria-label="Rotate left">‹</button><button id="stMn" aria-label="Zoom out">−</button><button id="stPl" aria-label="Zoom in">+</button><button id="stR" aria-label="Rotate right">›</button></div></div>
   <div class="stp"><div class="sttools"><button class="stc" id="stUn" aria-label="Undo">Undo</button><button class="stc" id="stRe" aria-label="Redo">Redo</button><button class="stc" id="stRn">Surprise me</button><button class="stc" id="stRl">Realistic</button></div>
    <div class="stts" role="tablist">${stTabs.map(t=>`<button role="tab" data-t="${t[0]}" class="${t[0]==='face'?'on':''}">${t[1]}</button>`).join('')}</div>
    <div class="stbd" id="stBd"></div><button class="pill d stsv" id="stSv">Save my avatar</button></div>`;
  el.classList.add('on');
  const cv=$('#stC'),R=S.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});
  R.setPixelRatio(Math.min(devicePixelRatio||1,2));
  const sc=S.sc=new THREE.Scene(),cam=S.cm=new THREE.PerspectiveCamera(30,1,.1,30);
  const fit=()=>{const v=$('#stV');if(!v)return;const w=v.clientWidth,h=v.clientHeight;if(!w||!h)return;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
  S.ro=new ResizeObserver(fit);S.ro.observe($('#stV'));fit();
  const rebuild=()=>{if(S.real){$('#stV').style.background=bgOf();return}if(S.av){sc.remove(S.av.group);S.av.dispose()}S.av=stBuild(S.cfg);sc.add(S.av.group);$('#stV').style.background=bgOf()};
  const bgOf=()=>{const c=ST.bg[S.cfg.bg];return `radial-gradient(120% 90% at 50% 20%,${c},color-mix(in srgb,${c} 70%,#000 10%))`};
  S.rebuild=rebuild;rebuild();
  /* tabs and options */
  const sw=(k,list,i)=>`<div class="stsw">${list.map((c,n)=>`<button class="sws ${S.cfg[k]===n?'on':''}" data-k="${k}" data-v="${n}" style="background:${c}" aria-label="${k} ${n+1}" aria-pressed="${S.cfg[k]===n}"></button>`).join('')}</div>`;
  const ch=(k,list,label)=>`<div class="stch">${list.map((x,n)=>`<button class="stc ${S.cfg[k]===n?'on':''}" data-k="${k}" data-v="${n}" aria-pressed="${S.cfg[k]===n}">${Array.isArray(x)?x[0]:x}</button>`).join('')}</div>`;
  const tg=(k,label)=>`<div class="stch"><button class="stc ${S.cfg[k]?'on':''}" data-k="${k}" data-v="${S.cfg[k]?0:1}" aria-pressed="${!!S.cfg[k]}">${label}</button></div>`;
  const L=t=>`<div class="stl">${t}</div>`;
  const panel={
    real:()=>S.real?`<div class="stl">Your realistic avatar</div><p class="stnote">Hair, clothes and face come from the avatar you imported. Save to use it everywhere in Keep.</p><div class="stch"><button class="stc" data-rl="avaturn">Make a new one</button><button class="stc" data-rl="file">Import a .glb</button><button class="stc" data-rl="cartoon">Back to the cartoon</button></div>`
      :`<div class="stl">Realistic avatar</div><p class="stnote">Build a lifelike 3D version of you from a selfie with Avaturn, or bring any rigged .glb avatar. It stays on this phone.</p><div class="stch"><button class="stc on" data-rl="avaturn">Create with Avaturn</button><button class="stc" data-rl="file">Import a .glb</button></div>`,
    face:()=>L('Face shape')+ch('face',ST.face)+L('Skin tone')+sw('skin',ST.skin)+L('Eyes')+ch('eyes',ST.eyes)+sw('eyec',ST.eyec)+L('Eyebrows')+ch('brows',ST.brows)+L('Nose')+ch('nose',ST.nose)+L('Mouth')+ch('mouth',ST.mouth)+L('Details')+`<div class="stch"><button class="stc ${S.cfg.cheeks?'on':''}" data-k="cheeks" data-v="${S.cfg.cheeks?0:1}">Rosy cheeks</button><button class="stc ${S.cfg.freckles?'on':''}" data-k="freckles" data-v="${S.cfg.freckles?0:1}">Freckles</button></div>`+L('Facial hair')+ch('beard',ST.beard),
    hair:()=>L('Style')+ch('hair',ST.hair)+L('Colour')+sw('hairc',ST.hairc),
    body:()=>L('Outfit')+ch('outfit',ST.outfit)+L('Colour')+sw('outc',ST.outc)+L('Build')+ch('body',ST.body),
    style:()=>L('Glasses')+ch('glasses',ST.glasses)+L('Headwear')+ch('head',ST.head)+(S.cfg.head?sw('hatc',ST.outc):'')+L('Earrings')+ch('ears',ST.ears)+L('Background')+sw('bg',ST.bg),
    motion:()=>L('Expression')+`<div class="stch">${ST.expr.map((x,n)=>`<button class="stc ${S.exI===n?'on':''}" data-x="${n}">${x[0]}</button>`).join('')}</div>`+L('Gestures')+`<div class="stch"><button class="stc" data-g="wave">Wave</button><button class="stc" data-g="nod">Nod</button><button class="stc" data-g="look">Look around</button></div>`+L('Idle')+ch('idle',['Relaxed','Lively'])
  };
  const draw=()=>{const b=$('#stBd');b.innerHTML=panel[S.tab]();
    el.classList.toggle('real',!!S.real);
    $('#stUn').disabled=!S.undo.length;$('#stRe').disabled=!S.redo.length;
    el.querySelectorAll('.stts button').forEach(x=>x.classList.toggle('on',x.dataset.t===S.tab));
    const c=stCam[S.tab];S.cam.ty=c[0];S.cam.tz=c[1];S.cam.tly=c[2]};
  const change=(k,v)=>{if(S.cfg[k]===v)return;S.undo.push(JSON.stringify(S.cfg));if(S.undo.length>40)S.undo.shift();S.redo=[];S.cfg[k]=v;rebuild();S.squish=1;draw()};
  S.draw=draw;
  $('#stBd').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.k)change(b.dataset.k,+b.dataset.v);
    else if(b.dataset.x){S.exI=+b.dataset.x;S.tex=Object.assign({smile:0},ST.expr[S.exI][1]);draw()}
    else if(b.dataset.g)S.gest={t:b.dataset.g,t0:S.t||0,start:true}
    else if(b.dataset.rl==='avaturn')stAvaturn(S);
    else if(b.dataset.rl==='file')stPickFile(S);
    else if(b.dataset.rl==='cartoon')stLeaveReal(S)});
  $('#stRl').onclick=()=>{S.tab='real';draw()};
  el.querySelector('.stts').addEventListener('click',e=>{const b=e.target.closest('button');if(b){S.tab=b.dataset.t;draw()}});
  $('#stUn').onclick=()=>{if(!S.undo.length)return;S.redo.push(JSON.stringify(S.cfg));S.cfg=stClean(JSON.parse(S.undo.pop()));rebuild();draw()};
  $('#stRe').onclick=()=>{if(!S.redo.length)return;S.undo.push(JSON.stringify(S.cfg));S.cfg=stClean(JSON.parse(S.redo.pop()));rebuild();draw()};
  $('#stRn').onclick=()=>{S.undo.push(JSON.stringify(S.cfg));const r=()=>Math.floor(Math.random()*1e6),c=stDefault();for(const k in c){if(k==='v'||k==='idle')continue;c[k]=r()%(stMax[k]+1)}S.cfg=stClean(c);S.redo=[];rebuild();S.squish=1;draw()};
  /* camera: drag to turn, pinch to zoom, double-tap to reset, buttons for everyone */
  const ptr=new Map();let lastTap=0,pd=0;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){const [a,b]=[...ptr.values()];pd=Math.hypot(a.x-b.x,a.y-b.y)}
    const n=Date.now();if(n-lastTap<300&&ptr.size===1){S.tyaw=0;S.tzoom=1}lastTap=n;$('#stH').classList.add('gone')});
  cv.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);const r=cv.getBoundingClientRect();S.tl.x=stClamp((e.clientX-r.left)/r.width*2-1,-1,1);S.tl.y=stClamp(-((e.clientY-r.top)/r.height*2-1),-1,1);
    if(!p)return;if(ptr.size===2){ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);S.tzoom=stClamp(S.tzoom*(pd/d),.6,1.5);pd=d;return}
    S.tyaw+=(e.clientX-p.x)*.012;p.x=e.clientX;p.y=e.clientY});
  const up=e=>ptr.delete(e.pointerId);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  $('#stL').onclick=()=>S.tyaw-=.5;$('#stR').onclick=()=>S.tyaw+=.5;$('#stMn').onclick=()=>S.tzoom=stClamp(S.tzoom*1.15,.6,1.5);$('#stPl').onclick=()=>S.tzoom=stClamp(S.tzoom/1.15,.6,1.5);
  $('#stX').onclick=()=>studioClose();
  $('#stSv').onclick=()=>studioSave();
  S.cam.ty=stCam.face[0];S.cam.tz=stCam.face[1];S.cam.tly=stCam.face[2];S.cam.y=S.cam.ty+.08;S.cam.z=S.cam.tz+1.2;S.cam.ly=S.cam.tly;
  draw();S.t=0;S.blinkT=0;
  const tick=now=>{
    if(!S.on)return;S.raf=requestAnimationFrame(tick);
    const dt=Math.min(.05,(now-S.last)/1e3);S.last=now;S.t+=dt;const t=S.t,d=(v,tg,k)=>v+(tg-v)*(1-Math.exp(-dt*k)),A=S.av,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    S.yaw=d(S.yaw,S.tyaw,9);S.zoom=d(S.zoom,S.tzoom,9);
    S.cam.y=d(S.cam.y,S.cam.ty,4.5);S.cam.z=d(S.cam.z,S.cam.tz,4.5);S.cam.ly=d(S.cam.ly,S.cam.tly,4.5);
    cam.position.set(0,S.cam.y,S.cam.z*S.zoom);cam.lookAt(0,S.cam.ly,0);
    if(!A)return;
    if(S.real){A.group.rotation.y=S.yaw+Math.sin(t*.5)*.03;A.update(t,dt);R.render(sc,cam);return}
    const idle=S.cfg.idle?1.7:1,calm=reduce?.25:1;
    A.group.rotation.y=S.yaw+Math.sin(t*.5)*.04*idle*calm;
    S.squish=d(S.squish,0,6);A.group.scale.setScalar(1+S.squish*.035);
    A.torso.scale.y=1+Math.sin(t*1.8)*.012*calm;
    A.head.rotation.z=Math.sin(t*.7)*.022*idle*calm;A.head.rotation.x=Math.sin(t*.9)*.012*calm;
    /* gestures */
    let wv=0,nod=0,lk=0;const g=S.gest;
    if(g){if(g.start){g.t0=t;g.start=false}const u=t-g.t0;
      if(g.t==='wave'){const up=stClamp(u/.45,0,1),dn=stClamp((2.6-u)/.45,0,1);wv=Math.min(up,dn);A.rFore.rotation.z=Math.sin(u*10)*.5*wv;if(u>2.7)S.gest=null}
      else if(g.t==='nod'){nod=Math.sin(u*9)*.16*stClamp((1.4-u)*3,0,1);if(u>1.5)S.gest=null}
      else if(g.t==='look'){lk=Math.sin(u*3.2)*.5*stClamp((2.4-u)*2,0,1);if(u>2.5)S.gest=null}}
    A.rArm.rotation.z=d(A.rArm.rotation.z,.1+wv*2.5,10);if(!wv)A.rFore.rotation.z=d(A.rFore.rotation.z,0,8);
    A.head.rotation.x+=nod;A.head.rotation.y=lk+S.look.x*.18;
    /* eyes follow the finger; blink now and then */
    S.look.x=d(S.look.x,S.tl.x,6);S.look.y=d(S.look.y,S.tl.y,6);
    S.nextBlink-=dt;if(S.nextBlink<0){S.blinkT=.18;S.nextBlink=2+Math.random()*3.2}
    S.blinkT=Math.max(0,S.blinkT-dt);const bl=S.blinkT>0?Math.sin(Math.PI*(1-S.blinkT/.18)):0;
    for(const k in S.cur)S.cur[k]=d(S.cur[k],S.tex[k]||0,10);
    const x=S.cur;
    A.eyes.forEach(e=>{const close=stClamp(Math.max(bl,x.squint*.55,e.s>0?x.wink:0),0,1);e.lid.position.y=(.04*(1-close))*e.sy;e.lid.scale.y=(.5+.52*close)*e.sy;e.iris.position.x=S.look.x*.012+x.look*.008;e.iris.position.y=S.look.y*.008});
    A.brows.forEach(b=>{b.b.position.y=b.y+x.brow*.018+(x.wide*.01);b.b.rotation.z=Math.PI/2-b.s*(ST.brows[S.cfg.brows][1].a+x.brow*.12)});
    const sm=stClamp(x.smile,-1,1);A.arc.rotation.z=sm>=0?Math.PI:0;A.arc.scale.y=Math.max(.12,Math.abs(sm)*.95);A.mouth.position.y=-.098+(sm>0?sm*.004:0);
    A.cav.visible=x.open>.05;A.cav.scale.y=Math.max(.01,x.open);A.cav.position.y=-.02*x.open;A.arc.position.y=x.open>.05?.012:0;
    A.blushM.opacity=(S.cfg.cheeks?.28:.04)+x.cheek*.35;
    R.render(sc,cam);
  };
  S.raf=requestAnimationFrame(tick);
  S.draw=draw;if(saved&&saved.real)avDB.get('me').then(b=>b&&stS===S&&stUseGLB(S,b,false)).catch(()=>{});
}
/* a still of the avatar for profile, journal and chat: head and shoulders on the chosen colour */
function stSnapshot(S){
  const R=S.r,cam=S.cm,A=S.av,old={w:R.domElement.width,h:R.domElement.height,pr:R.getPixelRatio()};
  const n=320,sv={y:cam.position.y,z:cam.position.z,rot:A.group.rotation.y,asp:cam.aspect};
  R.setPixelRatio(1);R.setSize(n,n,false);cam.aspect=1;cam.updateProjectionMatrix();cam.position.set(0,1.56,1.95);cam.lookAt(0,1.5,0);A.group.rotation.y=0;
  const keep={smile:S.cur.smile};S.cur.smile=Math.max(S.cur.smile,.6);R.render(S.sc,cam);
  const out=document.createElement('canvas');out.width=out.height=n;const c=out.getContext('2d'),col=ST.bg[S.cfg.bg],g=c.createLinearGradient(0,0,0,n);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=col;c.fillRect(0,0,n,n);c.drawImage(R.domElement,0,0,n,n);
  S.cur.smile=keep.smile;A.group.rotation.y=sv.rot;R.setPixelRatio(old.pr);R.setSize(old.w/old.pr,old.h/old.pr,false);cam.aspect=sv.asp;cam.updateProjectionMatrix();
  return out.toDataURL('image/jpeg',.9);
}
async function studioSave(){
  const S=stS;if(!S)return;
  if(S.real){try{await avDB.put('me',S.real.buf)}catch(e){toast('Could not store the avatar file');return}}
  let snap='';try{snap=stSnapshot(S)}catch(e){console.warn('avatar picture failed',e)}
  if(!stPut(S.cfg,snap,!!S.real))return;
  const done=S.opts.onSave;studioClose(true);renderProf&&renderProf();toast('Your avatar is saved');if(done)done(snap);
  if($('#pfpLab')&&$('#sh').classList.contains('on'))openProfile();
}
function studioClose(){
  const S=stS,el=$('#studio');if(!S)return;S.on=false;cancelAnimationFrame(S.raf);
  try{S.ro.disconnect();if(S.av){S.sc.remove(S.av.group);S.av.dispose()}S.r.dispose();S.r.forceContextLoss&&S.r.forceContextLoss()}catch(e){}
  stS=null;el.classList.remove('on');el.innerHTML='';
}

/* ---- realistic avatar: a rigged .glb from Avaturn or a file, shown in the same studio ---- */
const stLights=()=>{const T=THREE,g=new T.Group();g.add(new T.HemisphereLight(0xffffff,0xd8c8b8,1.1));const a=new T.DirectionalLight(0xffffff,1.2);a.position.set(1.2,2.4,2.6);g.add(a);const b=new T.DirectionalLight(0xffd3a8,.5);b.position.set(-2,1.6,-1.4);g.add(b);return g};
async function stUseGLB(S,buf,announce){
  try{
    const av=glbAvatar(await parseGLB(buf));if(stS!==S){av.dispose();return}
    if(S.av){S.sc.remove(S.av.group);S.av.dispose()}
    if(!S.rl){S.rl=stLights();S.sc.add(S.rl)}
    S.real={buf,av};S.av=av;S.sc.add(av.group);av.pop();S.squish=0;S.tab='real';S.draw();
    if(announce)toast('Your avatar is ready. Save to keep it.');
  }catch(e){console.warn('avatar file',e);toast('That file could not be shown. Use a rigged .glb avatar.')}
}
function stLeaveReal(S){
  if(S.real){S.sc.remove(S.av.group);S.av.dispose();S.real=null;S.av=null}
  if(S.rl){S.sc.remove(S.rl);S.rl=null}
  S.tab='face';S.rebuild();S.draw();
}
function stPickFile(S){
  const i=document.createElement('input');i.type='file';i.accept='.glb,model/gltf-binary';
  i.onchange=async()=>{const f=i.files[0];if(!f)return;if(f.size>48e6){toast('That file is over 48 MB');return}stUseGLB(S,await f.arrayBuffer(),true)};
  i.click();
}
async function stAvaturn(S){
  const el=$('#studio'),sub=(window.KEEP&&window.KEEP.avaturn)||'demo';
  let box=$('#stAv');if(box)box.remove();
  box=document.createElement('div');box.id='stAv';box.className='stav';
  box.innerHTML=`<div class="stt"><button class="stb" id="stAvX" aria-label="Close">${ic.x}</button><div class="stn"><small>Avaturn</small><b>Scan your face</b></div><span class="stsp"></span></div><div id="stAvC" class="stavc"><p class="stnote" style="padding:24px">Loading Avaturn…</p></div>`;
  el.appendChild(box);$('#stAvX').onclick=()=>box.remove();
  try{
    const {AvaturnSDK}=await import('https://cdn.jsdelivr.net/npm/@avaturn/sdk@1.1.4/dist/index.js');
    const c=$('#stAvC');c.innerHTML='';const sdk=new AvaturnSDK();
    await sdk.init(c,{url:`https://${sub}.avaturn.dev`});
    sdk.on('export',async d=>{
      try{const r=await fetch(d.url||d.data||d.avatarUrl);if(!r.ok)throw 0;const buf=await r.arrayBuffer();box.remove();stUseGLB(S,buf,true)}
      catch(e){toast('Could not download your avatar. Try again.')}
    });
  }catch(e){console.warn('avaturn',e);box.remove();toast('Avaturn could not load. Check your connection, or import a .glb file.')}
}
