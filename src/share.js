/* ---------- Share and save: a photo or video, as it is or as a memory-gradient card ---------- */
/* "Memory gradient" is the look of a memory in Keep: the photo with soft faded edges on the season gradient of the month it was kept (the same
   colours as the top of the calendar), with the date and caption under it. Photos are drawn on a canvas here on the phone; a video is drawn
   frame by frame and recorded as it plays, so it takes as long as the video. Share opens the phone's own share sheet (Instagram, WhatsApp,
   Messages, AirDrop and so on); Save downloads the file. Nothing is uploaded by Keep. */
const SH_SEASONS=[ /* [radius x%, radius y%, centre x%, centre y%, r, g, b, alpha, stop] from the .ss season layers */
  [[62,78,10,0,111,211,245,.55,.72],[58,72,90,6,143,166,245,.50,.72],[60,55,50,52,196,181,247,.34,.74]],
  [[60,72,14,22,155,227,176,.50,.72],[58,74,92,0,127,208,247,.50,.72],[56,50,60,56,245,195,220,.32,.74]],
  [[62,72,8,4,127,203,245,.52,.72],[56,66,92,28,255,208,174,.50,.72],[60,54,44,54,246,184,201,.34,.74]],
  [[60,72,16,8,185,166,242,.50,.72],[56,68,88,4,244,179,200,.50,.72],[60,54,54,56,246,215,168,.38,.74]]];
const SH_IC='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>';
const SH_FMT={story:{w:1080,h:1920,n:'Story 9:16'},post:{w:1080,h:1350,n:'Post 4:5'}};
const SH={m:null,mode:'grad',fmt:'story',blob:null,ext:'',busy:0,tok:0};
/* the gradient for a month (0-11), blended between seasons exactly as the calendar does */
function shBackdrop(c,W,H,month){
  const x=c.getContext('2d');x.fillStyle='#F6F8FD';x.fillRect(0,0,W,H);
  SH_SEASONS.forEach((layers,k)=>{
    const d=Math.abs(month-k*3),w=Math.max(0,1-Math.min(d,12-d)/3);if(!w)return;
    layers.forEach(([rx,ry,cx,cy,r,g,b,a,stop])=>{
      x.save();x.globalAlpha=w;x.translate(W*cx/100,H*cy/100);x.scale(W*rx/100*1.25,H*ry/100*.62);
      const gr=x.createRadialGradient(0,0,0,0,0,1);gr.addColorStop(0,`rgba(${r},${g},${b},${Math.min(1,a*1.35)})`);gr.addColorStop(stop,`rgba(${r},${g},${b},0)`);gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
      x.fillStyle=gr;x.fillRect(-1,-1,2,2);x.restore();
    });
  });
}
const shFit=(iw,ih,bw,bh)=>{const k=Math.min(bw/iw,bh/ih);return[iw*k,ih*k]};
/* the soft faded edge of a memory (13% each side), cut from the picture */
function shFeather(src,iw,ih,w,h){
  const t=document.createElement('canvas');t.width=Math.round(w);t.height=Math.round(h);const x=t.getContext('2d');
  x.drawImage(src,0,0,iw,ih,0,0,t.width,t.height);x.globalCompositeOperation='destination-in';
  [[1,0],[0,1]].forEach(([a,b])=>{const g=x.createLinearGradient(0,0,t.width*a,t.height*b);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.13,'#000');g.addColorStop(.87,'#000');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,t.width,t.height)});
  return t;
}
/* the whole card, around any picture source (an image or a video frame) */
function shCard(c,m,src,iw,ih,photo){
  const {w:W,h:H}=SH_FMT[SH.fmt],x=c.getContext('2d'),story=SH.fmt==='story',d=new Date(m.ts);
  if(!photo||!photo.bg)shBackdrop(c,W,H,d.getMonth()+d.getDate()/31);
  const [pw,ph]=shFit(iw,ih,W*.9,H*(story?.62:.6)),py=story?H*.2:H*.12;
  if(photo&&photo.draw)photo.draw(x,W,H,pw,ph,py);else x.drawImage(shFeather(src,iw,ih,pw,ph),(W-pw)/2,py);
  x.textAlign='center';x.fillStyle='rgba(20,24,36,.9)';x.font=`700 ${story?54:50}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;
  x.fillText(fullDay(d),W/2,py+ph+(story?92:84));
  if(m.text){x.font=`400 ${story?42:38}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;x.fillStyle='rgba(20,24,36,.7)';
    const words=String(m.text).split(/\s+/),lines=[];let cur='';words.forEach(wd=>{const t=cur?cur+' '+wd:wd;if(x.measureText(t).width>W*.8&&cur){lines.push(cur);cur=wd}else cur=t});if(cur)lines.push(cur);
    lines.slice(0,3).forEach((l,i)=>x.fillText(i===2&&lines.length>3?l+'…':l,W/2,py+ph+(story?162:150)+i*54))}
  x.font='600 34px system-ui,-apple-system,Segoe UI,Roboto,sans-serif';x.fillStyle='rgba(20,24,36,.45)';x.fillText('Keep',W/2,H-(story?96:54));
}
const shBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
const shName=(m,ext)=>'keep-'+dk(new Date(m.ts))+'-'+String(m.id).slice(-4)+'.'+ext;
async function shPhotoBlob(m,mode,fmt){
  const img=await loadImg(src(m));
  if(mode==='orig'){const r=await fetch(src(m));const b=await r.blob();return{blob:b,ext:(b.type.split('/')[1]||'jpg').replace('jpeg','jpg')}}
  const {w,h}=SH_FMT[fmt],c=document.createElement('canvas');c.width=w;c.height=h;shCard(c,m,img,img.naturalWidth,img.naturalHeight);
  return{blob:await shBlob(c,'image/jpeg',.93),ext:'jpg'};
}
/* a video: play it through while drawing each frame onto the card and recording the canvas (and its sound) */
async function shVideoBlob(m,fmt,onP){
  const MR=window.MediaRecorder;if(!MR)throw new Error('This browser cannot make the gradient video. Share the original instead.');
  const type=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MR.isTypeSupported(t));if(!type)throw new Error('This browser cannot record video.');
  const v=document.createElement('video');v.src=vidURL(m);v.playsInline=true;v.preload='auto';v.muted=false;v.setAttribute('playsinline','');
  await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(new Error('video'))});
  if(!isFinite(v.duration)){v.currentTime=1e6;await new Promise(r=>v.onseeked=r);v.currentTime=0;await new Promise(r=>v.onseeked=r)}
  const {w:W,h:H}=SH_FMT[fmt],c=document.createElement('canvas');c.width=W;c.height=H;
  const bg=document.createElement('canvas');bg.width=W;bg.height=H;{const d=new Date(m.ts);shBackdrop(bg,W,H,d.getMonth()+d.getDate()/31)}
  const iw=v.videoWidth,ih=v.videoHeight;
  const frame=()=>{const x=c.getContext('2d');x.drawImage(bg,0,0);shCard(c,m,v,iw,ih,{bg:true,draw:(x2,W2,H2,pw,ph,py)=>{x2.drawImage(shFeather(v,iw,ih,pw,ph),(W2-pw)/2,py)}})};
  frame();const stream=c.captureStream(30);let ac=null;
  try{ac=new (window.AudioContext||window.webkitAudioContext)();const s=ac.createMediaElementSource(v),d=ac.createMediaStreamDestination();s.connect(d);d.stream.getAudioTracks().forEach(t=>stream.addTrack(t))}catch(e){ac=null;v.muted=true}
  const rec=new MR(stream,{mimeType:type,videoBitsPerSecond:6e6}),parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  const done=new Promise(r=>rec.onstop=r);rec.start(250);
  let alive=true;const loop=()=>{if(!alive)return;frame();onP(v.currentTime/v.duration);(v.requestVideoFrameCallback?v.requestVideoFrameCallback.bind(v):requestAnimationFrame)(loop)};
  v.currentTime=0;await v.play();loop();await new Promise(r=>{v.onended=r});alive=false;frame();rec.stop();await done;
  try{ac&&ac.close()}catch(e){}
  return{blob:new Blob(parts,{type:type.split(';')[0]}),ext:type.startsWith('video/mp4')?'mp4':'webm'};
}
/* ---- the panel ---- */
const shClose=()=>{SH.tok++;const p=$('#shp');if(p)p.remove()};
function shDraw(){
  const m=SH.m,isV=m.type==='video',ready=!!SH.blob&&!SH.busy;
  const p=$('#shp')||(()=>{const e=document.createElement('div');e.className='shp';e.id='shp';e.innerHTML='<div class="shc" role="dialog" aria-label="Share or save"></div>';$('#app').appendChild(e);e.onclick=ev=>{if(ev.target===e)shClose()};return e})();
  const fm=Object.entries(SH_FMT).map(([k,v])=>`<button class="shch ${SH.fmt===k?'on':''}" data-f="${k}">${v.n}</button>`).join('');
  p.firstChild.innerHTML=`<div class="shpv ${SH.mode==='orig'?'orig':''} ${SH.fmt}" id="shPv"></div>
   <div class="shseg" role="group"><button class="${SH.mode==='grad'?'on':''}" data-md="grad">Memory gradient</button><button class="${SH.mode==='orig'?'on':''}" data-md="orig">Original</button></div>
   ${SH.mode==='grad'?`<div class="shr">${fm}</div>`:''}
   <div class="shst" id="shSt" aria-live="polite">${SH.err?esc(SH.err):SH.busy?'Making it…':ready?(isV&&SH.mode==='grad'?'Ready.':''):''}</div>
   <div class="shb"><button class="shgo" id="shGo" ${ready?'':'disabled'}>${SH_IC} Share</button><button class="shsv" id="shSv" ${ready?'':'disabled'}>Save</button></div>
   ${isV&&SH.mode==='grad'&&!SH.blob&&!SH.busy?'<button class="shmk" id="shMk">Make the video</button>':''}
   <p class="shn">Share opens Instagram, WhatsApp, Messages and the other apps on your phone. Nothing is uploaded by Keep.</p>`;
  const pv=$('#shPv');pv.innerHTML=SH.prev?`<img src="${SH.prev}" alt="">`:'';
  p.firstChild.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>{SH.mode=b.dataset.md;shBuild()});
  p.firstChild.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{SH.fmt=b.dataset.f;shBuild()});
  const mk=$('#shMk');if(mk)mk.onclick=shMakeVideo;
  const go=$('#shGo'),sv=$('#shSv');
  if(go)go.onclick=shShare;if(sv)sv.onclick=shSave;
}
const shFile=()=>new File([SH.blob],shName(SH.m,SH.ext),{type:SH.blob.type||(SH.m.type==='video'?'video/mp4':'image/jpeg')});
async function shShare(){
  if(!SH.blob)return;const f=shFile();
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Keep',text:SH.m.text||''});useTrack('memory_share')}catch(e){if(e&&e.name!=='AbortError')shSave()}return}
  shSave();toast('Saved. Sharing from here is not supported on this device.');
}
function shSave(){
  if(!SH.blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(SH.blob);a.download=shName(SH.m,SH.ext);document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);useTrack('memory_save_file');toast('Saved to your downloads');
}
/* (re)make what is shown: photos right away; videos wait for the button when they need recording */
async function shBuild(){
  const m=SH.m,tok=++SH.tok;SH.blob=null;SH.err='';SH.busy=0;SH.prev='';
  try{
    if(m.type==='video'){
      if(SH.mode==='orig'){SH.blob=m.vid;SH.ext=(m.vid.type.split('/')[1]||'mp4').replace('quicktime','mov');SH.prev=src(m)}
      else{
        const img=await loadImg(src(m)),{w,h}=SH_FMT[SH.fmt],c=document.createElement('canvas');c.width=w;c.height=h;shCard(c,m,img,img.naturalWidth,img.naturalHeight);
        SH.prev=c.toDataURL('image/jpeg',.7);
      }
    }else{const r=await shPhotoBlob(m,SH.mode,SH.fmt);if(tok!==SH.tok)return;SH.blob=r.blob;SH.ext=r.ext;SH.prev=URL.createObjectURL(r.blob)}
  }catch(e){SH.err='Could not prepare that. '+(e&&e.message||'')}
  if(tok===SH.tok)shDraw();
}
async function shMakeVideo(){
  const tok=SH.tok,st=()=>$('#shSt');SH.busy=1;shDraw();
  try{const r=await shVideoBlob(SH.m,SH.fmt,p=>{if(tok===SH.tok&&st())st().textContent='Making your video… '+Math.round(Math.min(1,p||0)*100)+'%'});if(tok!==SH.tok)return;SH.blob=r.blob;SH.ext=r.ext;
    if(r.ext==='webm')SH.err='This browser made a WebM file. Instagram prefers MP4, so use Original if it does not accept it.'}
  catch(e){SH.err=(e&&e.message)||'Could not make the video.'}
  SH.busy=0;if(tok===SH.tok)shDraw();
}
function shOpen(m){
  if(!m||!(m.type==='photo'||m.type==='video')||!src(m)){toast('Only photos and videos can be shared');return}
  if(m.type==='video'&&!m.vid){toast('That video is a sample and cannot be shared');return}
  SH.m=m;SH.mode='grad';SH.fmt=SH.fmt||'story';SH.blob=null;shClose();shDraw();shBuild();
}
