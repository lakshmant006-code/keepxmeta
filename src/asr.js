/* ---------- Write down what you say, on this phone ---------- */
/* Phones only offer built-in speech recognition in some browsers (and not at all in an installed iPhone web app), so Keep can use a small speech model
   instead. It is downloaded once (about 40 MB, from the model library), kept on the phone, and after that it works offline. Your voice is never uploaded:
   only the model comes down. It runs in the browser, so on an older phone it can take a few seconds per sentence. */
const ASR_K='kept.asr',ASR_MODEL='onnx-community/whisper-tiny.en',ASR_LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/+esm';
const asrHas=()=>{try{return localStorage.getItem(ASR_K)==='1'}catch(e){return false}};
let asrPipe=null,asrLoading=null;
/* ask once, plainly, before downloading anything */
function asrConsent(){
  if(asrHas())return Promise.resolve(true);
  return new Promise(res=>{
    const m=document.createElement('div');m.className='asrm';
    m.innerHTML=`<div role="dialog" aria-label="Write down what you say"><h2>Write down what you say</h2><p>To turn speech into words, Keep needs a small listener, about 40 MB. It downloads once and stays on this phone. After that it works without internet.</p><p>Your voice stays here. Only the listener is downloaded.</p>
      <div class="asrb"><button class="pill g" id="asrNo">Not now</button><button class="pill d" id="asrYes">Get it</button></div></div>`;
    $('#app').appendChild(m);
    const fin=v=>{if(v){try{localStorage.setItem(ASR_K,'1')}catch(e){}}m.remove();res(v)};
    $('#asrYes').onclick=()=>fin(true);$('#asrNo').onclick=()=>fin(false);m.addEventListener('click',e=>{if(e.target===m)fin(false)});
  });
}
async function asrLoad(onp){
  if(asrPipe)return asrPipe;if(window.ASR_TEST_PIPE)return asrPipe=window.ASR_TEST_PIPE;
  if(asrLoading)return asrLoading;
  asrLoading=(async()=>{
    const T=await import(ASR_LIB);T.env.allowLocalModels=false;T.env.useBrowserCache=true;
    const files={};
    const p=await T.pipeline('automatic-speech-recognition',ASR_MODEL,{dtype:'q8',device:'wasm',progress_callback:e=>{
      if(e&&e.status==='progress'&&e.file){files[e.file]={l:e.loaded||0,t:e.total||0};let l=0,t=0;for(const k in files){l+=files[k].l;t+=files[k].t}if(t&&onp)onp(Math.min(99,Math.round(l/t*100)))}}});
    asrPipe=p;return p;
  })().catch(e=>{asrLoading=null;throw e});
  return asrLoading;
}
/* a recording becomes 16 kHz mono samples */
async function asrSamples(blob){
  const AC=window.AudioContext||window.webkitAudioContext,ctx=new AC({sampleRate:16000});
  try{const buf=await ctx.decodeAudioData(await blob.arrayBuffer());
    const ch=buf.getChannelData(0);if(buf.sampleRate===16000)return ch;
    const oc=new OfflineAudioContext(1,Math.ceil(buf.duration*16000),16000),src=oc.createBufferSource();src.buffer=buf;src.connect(oc.destination);src.start();return(await oc.startRendering()).getChannelData(0)}
  finally{try{ctx.close()}catch(e){}}
}
const asrRMS=a=>{let s=0;for(let i=0;i<a.length;i+=7)s+=a[i]*a[i];return Math.sqrt(s/(a.length/7))};
/* speech models invent words over silence: drop those */
const ASR_JUNK=/^\W*(thank you\.?|thanks for watching\.?|you|bye\.?|\[[^\]]*\]|\([^)]*\)|\*[^*]*\*|\.+)\W*$/i;
async function asrTranscribe(blob,onp){
  const a=await asrSamples(blob);if(a.length<8000||asrRMS(a)<.006)return '';
  const pipe=await asrLoad(onp),r=await pipe(a,{chunk_length_s:30,stride_length_s:5,return_timestamps:false});
  const t=String(r&&r.text||'').replace(/\s+/g,' ').trim();return ASR_JUNK.test(t)?'':t;
}
window.asrTranscribe=asrTranscribe;window.asrConsent=asrConsent;window.asrLoad=asrLoad;window.asrHas=asrHas;
const asrPref=()=>{const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);return ios&&(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches)};
window.asrPref=asrPref;
const asrMime=()=>['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';

/* ---- 1. voice notes: record, then write the words in the box under the timer ---- */
{
  const os=audStart,op=audStop;
  window.audStart=async function(){
    await os();
    const a=aud;if(a&&window.MediaRecorder&&asrHas()){try{a.chunks=[];a.mr=new MediaRecorder(a.st,asrMime()?{mimeType:asrMime()}:{});a.mr.ondataavailable=e=>{if(e.data&&e.data.size)a.chunks.push(e.data)};a.mr.start()}catch(e){a.mr=null}}
  };
  window.audStop=function(){
    const a=aud;
    if(a&&a.mr&&a.mr.state!=='inactive'){const mr=a.mr,ch=a.chunks;mr.onstop=()=>{if(ch.length)asrVoiceDone(new Blob(ch,{type:mr.mimeType||'audio/mp4'}))};try{mr.stop()}catch(e){}}
    return op.apply(this,arguments);
  };
  const say=t=>{const s=$('#vtrS');if(s)s.textContent=t};
  async function asrVoiceDone(blob){
    const box=$('#vtrBox');if(!box)return;box.hidden=false;say('Writing down what you said…');
    try{const t=await asrTranscribe(blob,p=>say('Getting the listener ready… '+p+'%'));
      const ta=$('#vtx');if(ta&&!ta.value.trim()){ta.value=t;}say(t?'Here is what I heard. You can fix it.':'I did not catch any words. You can type them instead.');validate()}
    catch(e){say('I could not write this down here. You can type it instead.')}
  }
  document.addEventListener('click',async e=>{
    const g=e.target.closest('#vtrGet');if(!g)return;e.stopPropagation();
    if(await asrConsent()){const s=$('#vtrS');if(s)s.textContent='Ready. Hold the circle and talk.';g.remove()}
  },true);
}

/* ---- 2. conversations: where the browser has no speech recognition, listen in short pieces and write each one down ---- */
window.trAsrStart=function(){
  if(!window.MediaRecorder||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return false;
  const T=TR;T.on=true;T.asr=true;
  let chain=Promise.resolve(),st=null;
  T.stopAsr=()=>{T.on=false;T.asr=false;try{st&&st.getTracks().forEach(t=>t.stop())}catch(e){}};
  const seg=(ms)=>new Promise(res=>{const mr=new MediaRecorder(st,asrMime()?{mimeType:asrMime()}:{}),ch=[];mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};mr.onstop=()=>res(new Blob(ch,{type:mr.mimeType||'audio/mp4'}));mr.start();setTimeout(()=>{try{mr.state!=='inactive'&&mr.stop()}catch(e){}},ms)});
  (async()=>{
    if(!(await asrConsent())){T.on=false;T.asr=false;T.typed=true;trChrome();toast('You can type the lines instead');return}
    T.interim='Getting the listener ready…';trDraw();
    await asrLoad(p=>{T.interim='Getting the listener ready… '+p+'%';trDraw()});
    st=await navigator.mediaDevices.getUserMedia({audio:true});T.interim='Listening…';trDraw();
    while(TR===T&&T.on&&T.asr){
      const sp=T.sp,blob=await seg(7000);
      if(!(TR===T&&T.on))break;
      chain=chain.then(async()=>{try{const t=await asrTranscribe(blob);if(TR===T&&t)trAdd(sp,t)}catch(e){}});
      if(!T.interim)T.interim='Listening…';
    }
    await chain;
  })().catch(e=>{if(TR===T){T.on=false;T.asr=false;T.typed=true;T.interim='';trChrome();trDraw();toast('Could not start listening here. You can type the lines')}});
  return true;
};
