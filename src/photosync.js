/* ---------- Photos on this phone (iPhone app): keep your library in step with Keep ---------- */
/* A web page cannot read the photo library, so this only turns on inside the Keep app for iPhone (a thin app around the same pages).
   There the system asks once for permission. Photos come in newest first, small copies only, filed on the day they were taken, with their place if they have one.
   Keep never changes or deletes anything in Photos, and nothing leaves the phone. Photos already in Keep are skipped by their identifier. */
const PSK='kept.ps';
const psGet=()=>{try{return Object.assign({on:0,range:90,at:0,n:0},JSON.parse(localStorage.getItem(PSK)||'{}'))}catch(e){return{on:0,range:90,at:0,n:0}}};
const psPut=o=>{try{localStorage.setItem(PSK,JSON.stringify(o))}catch(e){}};
const psNative=()=>{const C=window.Capacitor;if(!C)return false;try{return typeof C.isNativePlatform==='function'?C.isNativePlatform():(C.getPlatform&&C.getPlatform()!=='web')}catch(e){return false}};
const psMedia=()=>{if(!psNative())return null;const C=window.Capacitor;try{return(C.Plugins&&C.Plugins.Media)||(C.registerPlugin&&C.registerPlugin('Media'))}catch(e){return null}};
const PS_RANGES=[[30,'30 days'],[90,'3 months'],[365,'A year'],[0,'Everything']];
let psBusy=false,psLast=0;
async function psSync(o){
  o=o||{};const M=psMedia();if(!M||psBusy)return{got:0,err:M?'busy':'unavailable'};
  psBusy=true;let got=0;
  try{
    const st=psGet(),cut=st.range?Date.now()-st.range*864e5:0,have=new Set(user.map(x=>x.fid).filter(Boolean)),base=Date.now(),CAP=o.quick?80:5000,STEP=o.quick?80:240;
    let q=STEP,seen=0,stop=false,i=0;
    while(!stop){
      const r=await M.getMedias({quantity:q,types:'photos',thumbnailWidth:900,thumbnailHeight:900,thumbnailQuality:78,sort:[{key:'creationDate',ascending:false}]});
      const list=(r&&r.medias)||[];
      for(const a of list.slice(seen)){
        const ts=a.creationDate?+new Date(a.creationDate):0;
        if(cut&&ts&&ts<cut){stop=true;break}
        const fid='ps:'+a.identifier;
        if(have.has(fid)){if(o.quick){stop=true;break}continue}
        if(!a.data)continue;
        const m={id:base+(i++),ts:Math.min(ts||Date.now(),Date.now()),type:'photo',ar:(a.fullWidth||1)>=(a.fullHeight||1)?'4 / 3':'3 / 4',src:/^data:/.test(a.data)?a.data:'data:image/jpeg;base64,'+a.data,text:'',fid};
        const L=a.location;if(L&&isFinite(L.latitude)&&isFinite(L.longitude)&&(L.latitude||L.longitude))m.geo=[+(+L.latitude).toFixed(5),+(+L.longitude).toFixed(5)];
        user.push(m);have.add(fid);got++;
        if(got%25===0){persistUser();if(o.onp)o.onp(got)}
      }
      seen=list.length;
      if(list.length<q||q>=CAP)stop=true;else q=Math.min(CAP,q+STEP);
    }
    persistUser();
    if(got){refresh();if(typeof faceKick==='function')faceKick(8000)}
    st.at=Date.now();st.n=(st.n||0)+got;psPut(st);
    return{got};
  }catch(e){
    return{got,err:String((e&&e.message)||e).slice(0,120)};
  }finally{psBusy=false;psLast=Date.now()}
}
window.psSync=psSync;
/* the settings sheet */
function psOpen(){
  const st=psGet(),nat=psNative();
  if(!nat){
    openSheet(`<div class="dh"><h1>Photos on this phone</h1></div><div class="pb" style="padding-top:12px"><p class="tr" style="font-size:15px;color:var(--ink)">A web page can’t read your photo library. Connecting it works in the Keep app for iPhone, where you allow access once and new photos arrive on their own.</p><p class="tr" style="font-size:15px;color:var(--ink)">Here in the browser you can still choose photos, as many as you like.</p><button class="pill d" id="psImp" style="width:100%;justify-content:center;margin-top:14px">Import photos</button></div>`);
    $('#psImp').onclick=()=>{closeSheet();bulkOpen()};return;
  }
  const lab=st.at?`Last sync ${new Date(st.at).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}. ${st.n} photos brought in so far.`:'Not synced yet.';
  openSheet(`<div class="dh"><h1>Photos on this phone</h1></div><div class="pb" style="padding-top:8px">
    <div class="row" style="padding:12px 0"><span>Keep in sync<small id="psS" style="display:block;font-size:12.5px;color:var(--mute);font-weight:400">${lab}</small></span><button class="ntsw ${st.on?'on':''}" id="psOn" role="switch" aria-checked="${!!st.on}" aria-label="Keep in sync"><i></i></button></div>
    <div class="row" style="padding:12px 0"><span>How far back</span><div class="seg" id="psR">${PS_RANGES.map(r=>`<button data-v="${r[0]}" class="${st.range===r[0]?'on':''}">${r[1]}</button>`).join('')}</div></div>
    <button class="pill g" id="psNow" style="width:100%;justify-content:center;margin-top:10px">Sync now</button></div>`);
  const status=t=>{const e=$('#psS');if(e)e.textContent=t};
  const run=async(quick)=>{
    status('Reading your photos…');
    const r=await psSync({quick,onp:n=>status('Reading your photos… '+n)});
    if(r.err==='unavailable')status('The photo library is not available in this app.');
    else if(r.err&&r.err!=='busy')status(/denied|permission|access/i.test(r.err)?'Allow Photos for Keep in Settings, then try again.':'Could not read your photos. Try again.');
    else status(r.got?`Brought in ${r.got} ${r.got===1?'photo':'photos'}.`:'Everything is already in Keep.');
  };
  $('#psOn').onclick=async e=>{const s=psGet();s.on=s.on?0:1;psPut(s);e.currentTarget.classList.toggle('on',!!s.on);e.currentTarget.setAttribute('aria-checked',!!s.on);if(s.on)run(false)};
  $('#psR').onclick=e=>{const b=e.target.closest('button');if(!b)return;const s=psGet();s.range=+b.dataset.v;psPut(s);document.querySelectorAll('#psR button').forEach(x=>x.classList.toggle('on',x===b))};
  $('#psNow').onclick=()=>run(false);
}
window.psOpen=psOpen;
/* when Keep opens, and when you come back to it, pick up what is new */
if(psNative()){
  const tick=()=>{const s=psGet();if(s.on&&Date.now()-psLast>5*6e4)psSync({quick:true})};
  setTimeout(tick,2500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
}
