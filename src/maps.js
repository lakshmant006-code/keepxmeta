/* ---------- Places: where you kept things, on Google Maps ---------- */
ic.pinm=st('<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',1.7);
ic.locate=st('<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',1.7);
const GMKEY='kept.gmkey';
/* the key comes from the build environment (GM_KEY); a key saved in Profile or via #gmkey= overrides it */
const gmKey=()=>{try{return localStorage.getItem(GMKEY)||CFG.gmKey||''}catch(e){return CFG.gmKey||''}};
const gmSet=v=>{try{v?localStorage.setItem(GMKEY,v):localStorage.removeItem(GMKEY)}catch(e){}};
const gps=(ok,no,o)=>{if(!navigator.geolocation)return no&&no();navigator.geolocation.getCurrentPosition(p=>ok({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),()=>no&&no(),Object.assign({enableHighAccuracy:true,timeout:7000,maximumAge:30000},o))};
/* open https://<site>/#gmkey=YOUR_KEY once on a phone: the key is stored in that browser and stripped from the address bar */
try{const mk=/[#&]gmkey=([^&]+)/.exec(location.hash);if(mk){gmSet(decodeURIComponent(mk[1]));history.replaceState(null,'',location.pathname+location.search)}}catch(e){}
const geoOf=m=>m.geo&&m.geo.length===2?{lat:m.geo[0],lng:m.geo[1]}:null;
function meters(a,b){const R=6371e3,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dn=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const geoPhotos=()=>all().filter(m=>(m.type==='photo'||m.type==='video')&&geoOf(m)&&src(m));
/* memories that share a spot (about 110 m) become one marker */
function groupPlaces(){
  const g={};geoPhotos().forEach(m=>{const k=m.geo[0].toFixed(3)+','+m.geo[1].toFixed(3);(g[k]=g[k]||[]).push(m)});
  return Object.values(g).map(L=>{L.sort((a,b)=>b.ts-a.ts);return{L,at:geoOf(L[0])}});
}
const gmapsLink=p=>`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

/* Firebase App Check (optional). Build with FIREBASE_CONFIG (the web app config as JSON) and RECAPTCHA_KEY (reCAPTCHA Enterprise site key).
   Maps requests then carry an App Check token. Google enforces it for Places API (New); start in monitor mode and check the metrics before enforcing.
   Debug: open the site with ?appcheck-debug=<token registered in the Firebase console>, or ?appcheck-debug to have the SDK print one in the console. */
let acP=null;
function setupAppCheck(){
  if(acP)return acP;
  if(!CFG.firebase||!CFG.recaptcha)return(acP=Promise.resolve(false));
  acP=(async()=>{
    try{
      const dbg=/[?&]appcheck-debug(?:=([\w-]+))?/.exec(location.search);
      if(dbg)self.FIREBASE_APPCHECK_DEBUG_TOKEN=dbg[1]||true;
      const B='https://www.gstatic.com/firebasejs/10.14.1/';
      const [{initializeApp},{initializeAppCheck,ReCaptchaEnterpriseProvider,getToken}]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-app-check.js')]);
      const ac=initializeAppCheck(initializeApp(CFG.firebase),{provider:new ReCaptchaEnterpriseProvider(CFG.recaptcha),isTokenAutoRefreshEnabled:true});
      const {Settings}=await google.maps.importLibrary('core');
      Settings.getInstance().fetchAppCheckToken=()=>getToken(ac,false);
      return true;
    }catch(e){console.warn('App Check unavailable, continuing without it',e);return false}
  })();
  return acP;
}
let gmP=null;
function loadMaps(){
  if(window.google&&google.maps&&google.maps.importLibrary)return Promise.resolve();
  if(gmP)return gmP;
  gmP=new Promise((res,rej)=>{
    window.__gmInit=()=>res();
    window.gm_authFailure=()=>{gmBad=true;if(mp)drawMapSetup('Google rejected this key. Check that the Maps JavaScript API is enabled and the key allows this site.')};
    const s=document.createElement('script');
    s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(gmKey())+'&loading=async&v=weekly&callback=__gmInit';
    s.async=true;s.onerror=()=>{gmP=null;rej(new Error('load'))};document.head.appendChild(s);
  });
  return gmP;
}
let mp=null,gmBad=false;
async function openMap(){
  if(mp)return;
  mp={map:null,mk:[],me:null};
  $('#mp').innerHTML=`<div class="mh2"><button class="ib" id="mpX" aria-label="Close">${ic.x}</button><div class="t">Places</div><span class="ib"></span></div><div id="mpBody" style="flex:1;min-height:0;display:flex;flex-direction:column;position:relative"></div>`;
  $('#mp').classList.add('on');$('#mpX').onclick=closeMap;
  if(!gmKey()){drawMapSetup();return}
  drawMapLoading();
  try{
    await loadMaps();if(!mp)return;
    await setupAppCheck();if(!mp)return;
    await drawMap();
  }catch(e){if(mp)drawMapSetup('Could not reach Google Maps. Check your connection and key.')}
}
function drawMapLoading(){$('#mpBody').innerHTML='<div class="empty" style="margin:40px 24px">Loading the map…</div>'}
function placeRow(p){const m=p.L[0];return `<div class="plc"><img src="${src(m)}" alt=""><div><b>${esc(m.text||(m.who?m.who:'Photo'))}</b><small>${p.L.length>1?p.L.length+' kept here · ':''}${fullDay(new Date(m.ts))}</small></div><a href="${gmapsLink(p.at)}" target="_blank" rel="noopener">Open in Maps</a></div>`}
function drawMapSetup(msg){
  if(!mp)return;
  const pl=groupPlaces();
  $('#mpBody').innerHTML=`<div class="gsetup"><div class="grp"><b style="font-size:16px">${gmKey()?'Map unavailable':'Turn on the map'}</b>
   <p class="note" style="margin-top:6px;padding:0">${esc(msg||'Paste a Google Maps API key (Maps JavaScript API enabled) to see your memories on a map. It is stored only in this browser.')}</p>
   <input id="gmKeyIn" placeholder="Google Maps API key" value="${esc(gmKey())}" autocomplete="off" spellcheck="false"><button class="pill d" id="gmKeySave">Save and show map</button></div>
   <div class="lbl" style="margin-top:18px">${pl.length} place${pl.length===1?'':'s'} kept</div><div class="grp" style="padding:0 14px">${pl.map(placeRow).join('')||'<div class="empty" style="padding:18px 0">Photos taken with location on show up here.</div>'}</div></div>`;
  $('#gmKeySave').onclick=()=>{const v=$('#gmKeyIn').value.trim();gmSet(v);gmBad=false;gmP=null;try{delete window.google}catch(e){}closeMap();if(v)setTimeout(openMap,50)};
}
async function drawMap(){
  const body=$('#mpBody');body.innerHTML=`<div class="gmap" id="gmap"></div><button class="mloc" id="mLoc" aria-label="Near me">${ic.locate}</button><div class="mcard" id="mCard"></div>`;
  const {Map}=await google.maps.importLibrary('maps'),{AdvancedMarkerElement}=await google.maps.importLibrary('marker');
  if(!mp)return;
  const pl=mp.pl=groupPlaces(),dark=document.documentElement.getAttribute('data-theme')==='dark';
  const map=new Map($('#gmap'),{center:pl[0]?pl[0].at:{lat:20,lng:0},zoom:pl[0]?13:2,mapId:'DEMO_MAP_ID',disableDefaultUI:true,zoomControl:false,gestureHandling:'greedy',colorScheme:dark?'DARK':'LIGHT'});
  mp.map=map;mp.AM=AdvancedMarkerElement;
  const b=new google.maps.LatLngBounds();
  pl.forEach(p=>{
    const el=document.createElement('div');el.className='gmk';el.style.backgroundImage=`url(${src(p.L[0])})`;if(p.L.length>1)el.innerHTML=`<b>${p.L.length}</b>`;
    const mk=new AdvancedMarkerElement({map,position:p.at,content:el,title:p.L[0].text||'Memory'});
    mk.addListener('click',()=>showPlace(p));mp.mk.push(mk);b.extend(p.at);
  });
  if(pl.length>1)map.fitBounds(b,60);
  map.addListener('click',()=>$('#mCard').classList.remove('on'));
  $('#mLoc').onclick=nearMe;
}
function showPlace(p,note){
  const c=$('#mCard');if(!c)return;
  const who=p.L.find(m=>m.who);
  c.innerHTML=`${note?`<div style="font-size:13px;opacity:.75;margin:0 2px 4px">${esc(note)}</div>`:''}${p.L.slice(0,4).map(m=>`<div class="plc" style="padding:8px 0"><img src="${src(m)}" alt=""><div><b>${esc(m.text||m.who||'Photo')}</b><small>${fullDay(new Date(m.ts))}${m.who?' · '+esc(m.who):''}</small></div></div>`).join('')}
   <div class="acts"><button class="d" data-mday="${dk(new Date(p.L[0].ts))}">Open day</button>${who?`<button data-mar="${who.id}">${ic.cube} See ${esc(firstName(who.who))} there</button>`:''}${who&&mp.pl?`<button data-msv="${mp.pl.indexOf(p)}">${ic.pinm} Street view</button>`:''}<a href="${gmapsLink(p.at)}" target="_blank" rel="noopener">Directions</a></div>`;
  c.classList.add('on');
}
function nearMe(){
  toast('Finding you…');
  gps(pos=>{
    if(!mp||!mp.map)return;
    if(mp.me)mp.me.map=null;
    const el=document.createElement('div');el.className='gme';mp.me=new mp.AM({map:mp.map,position:pos,content:el,title:'You'});
    const near=groupPlaces().map(p=>({p,d:meters(pos,p.at)})).sort((a,b)=>a.d-b.d);
    mp.map.panTo(pos);mp.map.setZoom(16);
    const hit=near.filter(x=>x.d<200);
    if(hit.length){const x=hit[0];showPlace(x.p,`${Math.round(x.d)} m from here`)}
    else toast(near.length?`Nearest memory is ${near[0].d>1000?(near[0].d/1000).toFixed(1)+' km':Math.round(near[0].d)+' m'} away`:'Nothing kept with a location yet');
  },()=>toast('Location is off for this site'));
}
function closeMap(){if(!mp)return;closeStreet();mp=null;const m=$('#mp');m.classList.remove('on');m.innerHTML='';blurAll()}
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-mday]');if(d){const k=d.dataset.mday;closeMap();openDay(k);return}
  const v=e.target.closest('[data-msv]');if(v){const p=mp&&mp.pl&&mp.pl[+v.dataset.msv];if(p)openStreet(p);return}
  const a=e.target.closest('[data-mar]');if(a){const id=+a.dataset.mar;closeMap();openAR(id)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mp&&!ar){if(sv)closeStreet();else closeMap()}});

/* ---------- Street view: the people from a kept photo, standing in the real street ---------- */
/* A Street View panorama at the photo's coordinates, with a transparent three.js layer on top whose camera follows the panorama's heading,
   pitch and zoom. Each avatar is anchored to a lat/lng, so it stays put on the ground as you look around or step along the street. */
let sv=null;
const SV_EYE=2.5,SV_AHEAD=4.5; /* Street View camera height (m) and how far in front the group first stands */
const rad=d=>d*Math.PI/180;
/* metres east/north of a (the pano) to b */
const enOf=(a,b)=>({e:rad(b.lng-a.lng)*6371e3*Math.cos(rad(a.lat)),n:rad(b.lat-a.lat)*6371e3});
const ofEN=(a,e,n)=>({lat:a.lat+n/6371e3*180/Math.PI,lng:a.lng+e/(6371e3*Math.cos(rad(a.lat)))*180/Math.PI});
async function openStreet(p){
  if(sv||!mp)return;
  const who=[],seen={};p.L.forEach(m=>{const k=(m.who||'').toLowerCase();if(k&&!seen[k]){seen[k]=1;who.push(m)}});
  if(!who.length)return;
  sv={who,p,av:[],anch:[]};
  const root=document.createElement('div');root.className='svw';root.id='svw';
  root.innerHTML=`<div class="svp" id="svPano"></div><canvas id="svGL"></canvas>
   <div class="artop"><button class="arib" id="svX" aria-label="Close">${ic.x}</button><div class="arstat" id="svStat"><i></i>Finding the street…</div><span style="width:40px"></span></div>
   <div class="svcard" id="svCard"></div>`;
  $('#mp').appendChild(root);$('#svX').onclick=closeStreet;
  try{
    const [{StreetViewPanorama,StreetViewService},_]=await Promise.all([google.maps.importLibrary('streetView'),loadThree()]);
    if(!sv)return;
    const at=p.at,res=await new StreetViewService().getPanorama({location:at,radius:80,preference:'nearest',source:'outdoor'}).catch(()=>null);
    if(!sv)return;
    if(!res||!res.data||!res.data.location){toast('No Street View at this place');closeStreet();return}
    const here=res.data.location.latLng,pos={lat:here.lat(),lng:here.lng()};
    const pano=new StreetViewPanorama($('#svPano'),{pano:res.data.location.pano,position:pos,pov:{heading:0,pitch:0},zoom:1,disableDefaultUI:true,motionTracking:false,motionTrackingControl:false,showRoadLabels:false,clickToGo:true,linksControl:false,fullscreenControl:false,addressControl:false});
    sv.pano=pano;sv.pos=pos;
    await svInitGL();if(!sv)return;svPlace();svCard();
    pano.addListener('pov_changed',svCam);pano.addListener('zoom_changed',svCam);pano.addListener('position_changed',()=>{const q=pano.getPosition();if(q){sv.pos={lat:q.lat(),lng:q.lng()};svMove()}});
    svCam();svStat('Standing where it was kept',true);
    sv.raf=requestAnimationFrame(svTick);
  }catch(e){if(sv){toast('Street View could not load');closeStreet()}}
}
function svStat(t,ok){const s=$('#svStat');if(s){s.className='arstat'+(ok?' ok':'');s.innerHTML='<i></i>'+t}}
async function svInitGL(){
  const T=THREE,cv=$('#svGL'),r=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setClearColor(0,0);
  const sc=new T.Scene(),cam=new T.PerspectiveCamera(60,1,.1,200);cam.rotation.order='YXZ';
  sc.add(new T.HemisphereLight(0xffffff,0x8a8fa8,2.2));
  const dl=new T.DirectionalLight(0xffffff,2.6);dl.position.set(3,6,4);sc.add(dl);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  const shT=new T.CanvasTexture(c);
  sv.gl={r,sc,cam,shT};
  for(const m of sv.who){
    const a=await avatarFor(m.who);if(!sv)return;a.set(arPose(m));a.pop();
    const sh=new T.Mesh(new T.PlaneGeometry(1.3,1.3),new T.MeshBasicMaterial({map:shT,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.01;a.group.add(sh);
    sc.add(a.group);sv.av.push(a);
  }
  svResize();sv.ro=new ResizeObserver(svResize);sv.ro.observe($('#svw'));
}
function svResize(){
  if(!sv||!sv.gl)return;const w=$('#svw').clientWidth,h=$('#svw').clientHeight;if(!w||!h)return;
  sv.gl.r.setSize(w,h,false);sv.gl.cam.aspect=w/h;sv.cam&&svCam();
}
/* Street View's field of view: 180° at zoom 0, halving with each zoom step */
function svCam(){
  if(!sv||!sv.gl||!sv.pano)return;
  const c=sv.gl.cam,pov=sv.pano.getPov(),z=sv.pano.getZoom()||0,hf=rad(180/Math.pow(2,z));
  c.fov=(c.aspect<1?hf:2*Math.atan(Math.tan(hf/2)/c.aspect))*180/Math.PI; /* applied to the longer side; calibrate against a real panorama */c.updateProjectionMatrix();
  c.rotation.set(rad(pov.pitch),-rad(pov.heading),0);sv.cam=1;
}
/* put the group in front of the viewer, spread across the view */
function svPlace(){
  if(!sv)return;
  const h=sv.pano.getPov().heading,n=sv.who.length;
  sv.anch=sv.who.map((m,i)=>{
    const off=n>1?(i-(n-1)/2)*18:((m.at?m.at[0]:.5)-.5)*30,hd=rad(h+off);
    return ofEN(sv.pos,Math.sin(hd)*SV_AHEAD,Math.cos(hd)*SV_AHEAD);
  });
  svMove();
}
/* an avatar's place relative to wherever the panorama is now; north is -z, east is +x */
function svMove(){
  if(!sv||!sv.gl)return;
  sv.av.forEach((a,i)=>{
    const d=enOf(sv.pos,sv.anch[i]),g=a.group;
    g.position.set(d.e,-SV_EYE,-d.n);g.visible=Math.hypot(d.e,d.n)<60;
    g.rotation.y=Math.atan2(-d.e,d.n); /* face the viewer */
  });
}
function svTick(){
  if(!sv)return;sv.raf=requestAnimationFrame(svTick);
  const now=performance.now(),t=now/1000,dt=Math.min(.05,(now-(sv.last||now))/1000);sv.last=now;
  sv.av.forEach(a=>a.update(t,dt));
  sv.gl.r.render(sv.gl.sc,sv.gl.cam);
}
function svCard(){
  const c=$('#svCard');if(!c)return;const m0=sv.who[0];
  c.innerHTML=`<div class="plc" style="padding:4px 0 8px"><img src="${src(m0)}" alt=""><div><b>${esc(sv.who.map(m=>firstName(m.who)).join(' & '))}</b><small>${fullDay(new Date(m0.ts))} · ${ago(m0.ts)}</small>${m0.text?`<small style="display:block;margin-top:2px">${esc(m0.text)}</small>`:''}</div></div>
   <div class="acts">${POSES.map(x=>`<button data-svpose="${x[0]}">${x[1]}</button>`).join('')}<button class="d" id="svHere">Stand here</button><button data-mday="${dk(new Date(m0.ts))}">Open day</button></div>`;
  c.onclick=e=>{const b=e.target.closest('[data-svpose]');if(b&&sv)sv.av.forEach(a=>a.set(b.dataset.svpose))};
  $('#svHere').onclick=svPlace;
}
function closeStreet(){
  if(!sv)return;const s=sv;sv=null;
  cancelAnimationFrame(s.raf);if(s.ro)s.ro.disconnect();
  s.av.forEach(a=>a.dispose());if(s.gl){s.gl.shT.dispose();s.gl.r.dispose()}
  if(s.pano){google.maps.event.clearInstanceListeners(s.pano);s.pano.setVisible(false)}
  const r=$('#svw');if(r)r.remove();
}
