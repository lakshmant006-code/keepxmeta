/* ---------- Profile: your details, an Instagram link, and a short list of settings ---------- */
/* Instagram does not let apps sign in to an account and read it, so "linking" saves your handle (with a link to your profile), and
   "Import" reads the personal_information.json (and a photo) from Instagram's own download, on this phone. Nothing is uploaded. */
const ME='kept.me';
const meGet=()=>{try{const o=JSON.parse(localStorage.getItem(ME)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return{}}};
/* usage counts go to the site's Google tag, never a handle or a name: only that someone linked, unlinked or used a feature */
const useTrack=(n,p)=>{try{window.gtag&&gtag('event',n,p||{})}catch(e){}};
const useIgFlag=l=>{try{window.gtag&&gtag('set','user_properties',{ig_linked:l?'yes':'no'})}catch(e){}};
const meSave=o=>{const was=!!meGet().ig;try{localStorage.setItem(ME,JSON.stringify(o))}catch(e){toast('Could not save. Storage may be full.');return}
  const now=!!(o&&o.ig);if(now!==was){useIgFlag(now);useTrack(now?'ig_link':'ig_unlink')}};
useIgFlag(!!meGet().ig);
const meInitial=()=>((meGet().name||'').trim()[0]||'K').toUpperCase();
/* Instagram exports write UTF-8 as escaped latin-1; this puts accents and emoji back */
const meFix=s=>{try{return decodeURIComponent(escape(s))}catch(e){return s}};
function meFind(o,keys,depth){
  if(!o||typeof o!=='object'||(depth||0)>8)return'';
  for(const k of Object.keys(o)){const v=o[k];if(keys.includes(k.toLowerCase())){if(typeof v==='string'&&v)return v;if(v&&typeof v.value==='string'&&v.value)return v.value}}
  for(const k of Object.keys(o)){const r=meFind(o[k],keys,(depth||0)+1);if(r)return r}
  return'';
}
async function meImport(files){
  let me=meGet(),got=[];
  for(const f of files){
    try{
      if(/^image\//.test(f.type)||/\.(jpe?g|png|webp|heic)$/i.test(f.name)){pfpSet(await pfpFrom(f));got.push('photo')}
      else if(/\.json$/i.test(f.name)){
        const j=JSON.parse(await f.text()),nm=meFind(j,['name','full name']),us=meFind(j,['username']),bio=meFind(j,['bio','biography']);
        if(nm){me.name=meFix(nm).slice(0,40);got.push('name')}
        if(us){me.ig=igUser(us);got.push('handle')}
        if(bio){me.bio=meFix(bio).slice(0,160);got.push('bio')}
      }
    }catch(_){}
  }
  if(!got.length){toast('Nothing found. Choose personal_information.json and a profile photo from the download.');return}
  meSave(me);renderProf();openProfile();toast('Imported your '+[...new Set(got)].join(', '));
}
/* ---- account: a Google sign-in the Keep server remembers (identity only; memories stay on the phone) ---- */
const SES='kept.session',acctOn=()=>!!CFG.igApi&&!CFG.demo,acctTok=()=>{try{return localStorage.getItem(SES)||''}catch(e){return''}};
const acctApi=(path,o)=>fetch(CFG.igApi.replace(/\/$/,'')+path,Object.assign({cache:'no-store'},o,{headers:Object.assign({authorization:'Bearer '+acctTok()},(o||{}).headers)}));
const acctClear=()=>{try{localStorage.removeItem(SES)}catch(e){}};
async function acctCheck(){
  const tok=acctTok();if(!acctOn()||!tok)return;
  try{const r=await acctApi('/me');if(r.status===401||r.status===404){if(acctTok()===tok){acctClear();if($('#sh')&&$('#sh').classList.contains('on')&&$('#pfpLab'))openProfile()}}else if(r.ok){const u=await r.json();acctSince=u.createdAt||0;try{localStorage.setItem(PRV,u.provider||'instagram')}catch(e){}}}catch(e){}
}
const meSquare=url=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const s=Math.min(i.naturalWidth,i.naturalHeight),c=document.createElement('canvas');c.width=c.height=256;
  c.getContext('2d').drawImage(i,(i.naturalWidth-s)/2,(i.naturalHeight-s)/2,s,s,0,0,256,256);res(c.toDataURL('image/jpeg',.88))};i.onerror=rej;i.src=url});
let acctSince=0;
const googleOn=()=>!!(CFG.googleClientId&&acctOn()),PRV='kept.provider';
const acctProv=()=>{try{return localStorage.getItem(PRV)||'instagram'}catch(e){return'instagram'}};
/* take a sign-in answer from the server: remember the session, and fill in name and photo where there are none yet */
async function acctAdopt(d,provider){
  if(!d.session)return false;
  try{localStorage.setItem(SES,d.session);localStorage.setItem(PRV,provider)}catch(e){return false}
  const me=meGet();if(d.name&&!me.name){me.name=String(d.name).slice(0,40);meSave(me)}
  if(/^data:image\//.test(d.picture||'')&&!pfp()){try{pfpSet(await meSquare(d.picture))}catch(e){}}
  useTrack(provider+'_signin',{new_account:d.created?'yes':'no'});renderProf();return true;
}
const loadGIS=()=>window.google&&google.accounts&&google.accounts.id?Promise.resolve():new Promise((res,rej)=>{const t=document.createElement('script');t.src='https://accounts.google.com/gsi/client';t.async=true;t.onload=res;t.onerror=rej;document.head.appendChild(t)});
async function googleButton(host,onDone){
  try{await loadGIS()}catch(e){host.innerHTML='<p class="meb">Google sign-in could not load. Check your connection.</p>';return}
  google.accounts.id.initialize({client_id:CFG.googleClientId,ux_mode:'popup',callback:async r=>{
    try{const x=await fetch(CFG.igApi.replace(/\/$/,'')+'/google',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({credential:r.credential})});
      if(!x.ok)throw 0;if(await acctAdopt(await x.json(),'google'))onDone&&onDone();else toast('Google sign-in did not work. Try again.')}
    catch(e){toast('Google sign-in did not work. Try again.')}}});
  google.accounts.id.renderButton(host,{theme:'outline',size:'large',shape:'pill',text:'continue_with',logo_alignment:'left',width:Math.min(320,host.clientWidth||300)});
}
async function acctDelete(){
  if(!confirm('Delete your Keep account? This removes your sign-in from the Keep server. Your memories stay on this phone.'))return;
  try{const r=await acctApi('/me',{method:'DELETE'});if(!r.ok){if(r.status===401||r.status===404){acctClear();openProfile();return}throw 0}}catch(e){toast('Could not reach Keep. Try again.');return}
  acctClear();useTrack('account_delete');toast('Your account was deleted');openProfile();
}
function acctRow(){
  if(!acctOn())return'';
  if(acctTok())return`<p class="meb acct ok">Signed in with Google${acctSince?' since '+new Date(acctSince).toLocaleDateString(undefined,{month:'short',year:'numeric'}):''}. <button class="mel" id="acctOut">Delete my account</button></p>`;
  return (googleOn()?'<div class="gbtn" id="gBtn"></div>':'')+me_ig_hint();
}
const me_ig_hint=()=>'';
function meCard(){
  const me=meGet(),u=pfp(),ig=me.ig;
  return`<div class="me"><label id="pfpLab" class="mep ${u?'':'nopic'}" style="${u?`background-image:url(${u})`:''}" aria-label="Choose a profile photo">${u?'':esc(meInitial())}<span class="cam">${ic.img.replace('width="22" height="22"','width="14" height="14"')}</span><input type="file" id="pfpIn" accept="image/*" hidden></label>
   <input class="mein" id="meName" placeholder="Your name" maxlength="40" value="${esc(me.name||'')}" autocomplete="off">
   ${me.bio?`<p class="meb">${esc(me.bio)}</p>`:''}
   ${acctRow()}
   <div class="meig">${ig?`<a class="chip fb flat" href="${igLink(ig)}" target="_blank" rel="noopener">${ic.ig} @${esc(ig)}</a><button class="mel" id="meIgEdit">Change</button><button class="mel" id="meIgOff">Remove</button>`
     :`<button class="pill d" id="meIgOn">${ic.ig} Add your Instagram username</button>`}</div>
   ${ig?'':'<p class="meb" style="font-size:12px;color:var(--faint)">Optional. It stays on this phone and helps friends find you.</p>'}
   <div class="meup"><label class="mel">Import from your Instagram download<input type="file" id="meImp" accept=".json,image/*" multiple hidden></label>${u?'<button class="mel" id="pfpRm">Remove photo</button>':''}</div></div>`;
}
function meWire(){
  const me=()=>meGet();
  if($('#meName'))$('#meName').addEventListener('change',e=>{const o=me();o.name=e.target.value.trim().slice(0,40);meSave(o);renderProf()});
  const askIg=()=>{
    const el=$('.meig');el.innerHTML=`<div class="meat"><span>@</span><input id="meIgIn" placeholder="instagram username" autocapitalize="none" autocorrect="off" value="${esc(me().ig||'')}"></div><button class="pill d" id="meIgSave" style="height:40px;padding:0 16px">Save</button>`;
    $('#meIgIn').focus();const save=()=>{const v=igUser($('#meIgIn').value);if(!v){toast('Type your Instagram username');return}const o=me();o.ig=v;meSave(o);openProfile();toast('Instagram linked')};
    $('#meIgSave').onclick=save;$('#meIgIn').addEventListener('keydown',e=>{if(e.key==='Enter')save()});
  };
  if($('#acctOut'))$('#acctOut').onclick=acctDelete;
  if($('#gBtn'))googleButton($('#gBtn'),()=>{openProfile();toast('Signed in with Google')});
  if($('#meIgOn'))$('#meIgOn').onclick=askIg;if($('#meIgEdit'))$('#meIgEdit').onclick=askIg;
  if($('#meIgOff'))$('#meIgOff').onclick=()=>{const o=me();delete o.ig;meSave(o);openProfile()};
  if($('#meImp'))$('#meImp').onchange=e=>{const f=[...e.target.files];e.target.value='';if(f.length)meImport(f)};
}

/* ---------- day timeline helpers ---------- */
const tlIcon={photo:'img',video:'vid',voice:'mic',text:'txt',quote:'quote',person:'user',place:'pin',file:'doc'};
const tlNode=t=>`<span class="nd">${(ic[tlIcon[t]]||ic.txt).replace('width="22" height="22"','width="14" height="14"')}</span>`;
/* moments reveal as they scroll into view, and the rail fills down to the latest one revealed */
function tlInit(tl){
  if(!tl)return;const evs=[...tl.querySelectorAll('.ev')],reduced=introReduced();
  const fill=()=>{const on=evs.filter(e=>e.classList.contains('in')),l=on[on.length-1];if(l)tl.style.setProperty('--fh',(l.offsetTop+14)+'px')};
  if(reduced||!('IntersectionObserver' in window)){evs.forEach(e=>e.classList.add('in'));fill();return}
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});fill()},{threshold:.15});
  requestAnimationFrame(()=>evs.forEach(e=>io.observe(e)));
}
function tlRipple(b){const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');s.className='rip';s.style.cssText=`width:${d}px;height:${d}px;left:${r.width/2-d/2}px;top:${r.height/2-d/2}px`;b.appendChild(s);setTimeout(()=>s.remove(),600)}

/* Safari still pinches the page on iOS even with a locked viewport; stop the gesture */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
let tlLastTap=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-tlLastTap<320&&!e.target.closest('input,textarea'))e.preventDefault();tlLastTap=n},{passive:false});

/* keep the Instagram helper awake while people use Keep: a quiet ping when the app opens or returns to the front, at most every 8 minutes */
(()=>{if(!CFG.igApi||CFG.demo)return;
  const K='kept.warm',ping=()=>{try{const n=Date.now();if(n-(+sessionStorage.getItem(K)||0)<48e4)return;sessionStorage.setItem(K,String(n));fetch(CFG.igApi.replace(/\/$/,'')+'/health',{mode:'no-cors',cache:'no-store',credentials:'omit'}).catch(()=>{})}catch(e){}};
  ping();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ping()});setInterval(()=>{if(document.visibilityState==='visible')ping()},6e5);
})();

/* ---- sign-in gate: people who already had Keep must sign in with Google once after this update ---- */
const gateNeeded=()=>googleOn()&&introDone()&&!acctTok();
function gateShow(){
  if($('#gate')||!gateNeeded())return;
  const g=document.createElement('div');g.id='gate';g.className='gate';
  g.innerHTML=`<div class="gcard"><div class="gk">K</div><h1>Sign in to keep going</h1><p>Keep now uses a Google account. Your memories stay on this phone; only your name and email are kept on the Keep server.</p><div class="gbtn" id="gBtnG"></div><small>Signing in is required to use Keep.</small></div>`;
  $('#app').appendChild(g);requestAnimationFrame(()=>g.classList.add('on'));
  googleButton($('#gBtnG'),()=>{g.classList.remove('on');setTimeout(()=>{g.remove();toast('Signed in. Welcome back.');if(typeof wnMaybe==='function')wnMaybe()},300)});
}
acctCheck().then(gateShow);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')acctCheck().then(gateShow)});
