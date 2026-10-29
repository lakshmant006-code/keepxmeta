/* ---------- Profile: your details, an Instagram link, and a short list of settings ---------- */
/* Instagram does not let apps sign in to an account and read it, so "linking" saves your handle (with a link to your profile), and
   "Import" reads the personal_information.json (and a photo) from Instagram's own download, on this phone. Nothing is uploaded. */
const ME='kept.me';
const meGet=()=>{try{const o=JSON.parse(localStorage.getItem(ME)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return{}}};
const meSave=o=>{try{localStorage.setItem(ME,JSON.stringify(o))}catch(e){toast('Could not save. Storage may be full.')}};
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
function meCard(){
  const me=meGet(),u=pfp(),ig=me.ig;
  return`<div class="me"><label id="pfpLab" class="mep ${u?'':'nopic'}" style="${u?`background-image:url(${u})`:''}" aria-label="Choose a profile photo">${u?'':esc(meInitial())}<span class="cam">${ic.img.replace('width="22" height="22"','width="14" height="14"')}</span><input type="file" id="pfpIn" accept="image/*" hidden></label>
   <input class="mein" id="meName" placeholder="Your name" maxlength="40" value="${esc(me.name||'')}" autocomplete="off">
   ${me.bio?`<p class="meb">${esc(me.bio)}</p>`:''}
   <div class="meig">${ig?`<a class="chip fb flat" href="${igLink(ig)}" target="_blank" rel="noopener">${ic.ig} @${esc(ig)}</a><button class="mel" id="meIgEdit">Change</button><button class="mel" id="meIgOff">Unlink</button>`
     :`<button class="pill d" id="meIgOn">${ic.ig} Link Instagram</button>`}</div>
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
  if($('#meIgOn'))$('#meIgOn').onclick=askIg;if($('#meIgEdit'))$('#meIgEdit').onclick=askIg;
  if($('#meIgOff'))$('#meIgOff').onclick=()=>{const o=me();delete o.ig;meSave(o);openProfile()};
  if($('#meImp'))$('#meImp').onchange=e=>{const f=[...e.target.files];e.target.value='';if(f.length)meImport(f)};
}
