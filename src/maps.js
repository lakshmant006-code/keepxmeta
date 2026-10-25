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
  const pl=groupPlaces(),dark=document.documentElement.getAttribute('data-theme')==='dark';
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
   <div class="acts"><button class="d" data-mday="${dk(new Date(p.L[0].ts))}">Open day</button>${who?`<button data-mar="${who.id}">${ic.cube} See ${esc(firstName(who.who))} there</button>`:''}<a href="${gmapsLink(p.at)}" target="_blank" rel="noopener">Directions</a></div>`;
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
function closeMap(){if(!mp)return;mp=null;const m=$('#mp');m.classList.remove('on');m.innerHTML='';blurAll()}
document.addEventListener('click',e=>{
  const d=e.target.closest('[data-mday]');if(d){const k=d.dataset.mday;closeMap();openDay(k);return}
  const a=e.target.closest('[data-mar]');if(a){const id=+a.dataset.mar;closeMap();openAR(id)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mp&&!ar)closeMap()});
