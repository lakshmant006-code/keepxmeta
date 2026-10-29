/* ---------- Invite friends: bring your people to Keep through Instagram ---------- */
/* Keep has no server, so it cannot see who else has installed it or who is on Instagram right now (Instagram does not share that either).
   What it can do: send an invite through the phone's share sheet or straight into an Instagram chat, and carry the inviter's handle in the link,
   so whoever opens it can add them as a friend in one tap. */
const INV='kept.invited',REFK='kept.ref';
const invMap=()=>{try{const o=JSON.parse(localStorage.getItem(INV)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return{}}};
const invMark=h=>{const o=invMap();o[h.toLowerCase()]=Date.now();try{localStorage.setItem(INV,JSON.stringify(o))}catch(e){}};
const invLink=()=>{const me=(typeof meGet==='function'?meGet().ig:'');return location.origin+location.pathname+(me?'?ref='+encodeURIComponent(me):'')};
const invMsg=()=>`I'm keeping my memories in Keep: one calendar for photos, voice notes and more, kept privately on my phone. Try it: ${invLink()}`;
const invTrack=m=>{try{window.gtag&&gtag('event','invite',{method:m})}catch(e){}};
const invAgo=ts=>{const d=Math.floor((Date.now()-ts)/864e5);return d<1?'today':d===1?'yesterday':d+' days ago'};
async function invCopy(text,msg){try{await navigator.clipboard.writeText(text);toast(msg||'Copied')}catch(e){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast(msg||'Copied')}catch(_){toast(text)}t.remove()}}
async function invShare(){
  invTrack('share');
  if(navigator.share){try{await navigator.share({title:'Keep',text:invMsg().replace(/\s*Try it:.*$/,' Try it:'),url:invLink()})}catch(e){}return}
  invCopy(invMsg(),'Invite copied. Paste it anywhere.');
}
/* an Instagram chat with them: the message is copied first, then their chat opens to paste it into */
function invDM(f){
  const h=igUser(f.ig);if(!h)return;
  invTrack('instagram_dm');
  try{navigator.clipboard&&navigator.clipboard.writeText(invMsg())}catch(e){}
  window.open('https://ig.me/m/'+encodeURIComponent(h),'_blank','noopener');
  invMark(h);toast('Message copied. Paste it in the chat.');setTimeout(()=>{if($('#invList'))invDraw()},400);
}
function invDraw(){
  const l=$('#invList');if(!l)return;
  const mine=FR.filter(f=>f.ig),inv=invMap();
  const rows=[...mine].sort((a,b)=>(+!!inv[a.ig.toLowerCase()]-+!!inv[b.ig.toLowerCase()])||a.name.localeCompare(b.name));
  l.innerHTML=rows.length?rows.map(f=>{const t=inv[f.ig.toLowerCase()];return`<div class="invr">${frAv(f)}<div class="invt"><b>${esc(f.name)}</b><small>@${esc(f.ig)}${t?' · Invited '+invAgo(t):''}</small></div><button class="invb ${t?'done':''}" data-i="${f.id}">${t?'Invite again':'Invite'}</button></div>`}).join('')
    :`<div class="invempty"><b>No Instagram friends yet</b><p>Add friends with their Instagram handles, or import the ones you follow.</p><div class="tagr"><button class="tagch on" id="invImp">Add from Instagram</button><button class="tagch" id="invAdd">Add a friend</button></div></div>`;
}
function openInvite(){
  const me=typeof meGet==='function'?meGet():{},linked=!!me.ig;
  openSheet(`<div class="dh"><h1>Invite friends</h1><p>Bring your people to Keep</p></div><div class="pb" style="padding-top:0">
   <div class="invhero"><b>Keep is better with the people in it.</b><p>Send an invite through Instagram or any app. When they open it, they can add you as a friend in one tap.</p>
    <div class="tagr"><button class="pill d" id="invShare" style="flex:1;justify-content:center">Share invite</button><button class="tagch" id="invCopy">Copy link</button></div></div>
   ${linked?'':`<div class="invnote"><div><b>Connect your Instagram</b><small>Your invite then carries @handle, so friends know it is from you.</small></div><button class="tagch on" id="invLink">Connect</button></div>`}
   <div class="stl invl">Your friends on Instagram</div><div id="invList"></div>
   <p class="note">Instagram does not show who is online, and Keep stores nothing on a server, so it cannot tell who has installed Keep. An invite opens a chat with your friend and copies the message for you to send.</p></div>`);
  invDraw();
  $('#invShare').onclick=invShare;$('#invCopy').onclick=()=>{invTrack('copy');invCopy(invLink(),'Invite link copied')};
  if($('#invLink'))$('#invLink').onclick=()=>{closeSheet();setTimeout(openProfile,320)};
  $('#invList').addEventListener('click',e=>{
    const b=e.target.closest('.invb');if(b){const f=FR.find(x=>String(x.id)===b.dataset.i);if(f)invDM(f);return}
    if(e.target.closest('#invImp')&&typeof frImportStart==='function'){frImportStart();return}
    if(e.target.closest('#invAdd')&&typeof frEdit==='function'){frEdit();return}
  });
  const on=()=>{if(!$('#invList')){removeEventListener('keep:friends',on);return}invDraw()};addEventListener('keep:friends',on);
}
/* someone opened an invite link: remember who sent it, and tidy the address */
function invRefInit(){
  try{
    const q=new URLSearchParams(location.search),r=igUser(q.get('ref')||'');
    if(r&&!localStorage.getItem(REFK))localStorage.setItem(REFK,r);
    if(q.has('ref')){q.delete('ref');const s=q.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash)}
  }catch(e){}
}
const invRef=()=>{try{return localStorage.getItem(REFK)||''}catch(e){return''}};
const invRefDone=()=>{try{localStorage.setItem(REFK+'.done','1')}catch(e){}};
const invRefOpen=()=>{const r=invRef();try{return r&&!localStorage.getItem(REFK+'.done')?r:''}catch(e){return''}};
/* a small card for whoever was invited: add the inviter as a friend in one tap */
function invRefCard(host){
  const r=invRefOpen();if(!r||!host)return;
  const c=document.createElement('div');c.className='invref';
  const have=FR.some(f=>(f.ig||'').toLowerCase()===r.toLowerCase());
  c.innerHTML=`<div><b>@${esc(r)} invited you</b><small>${have?'Already in your friends':'Add them as a friend to tag them in a tap'}</small></div>${have?'':'<button class="tagch on" id="invRefAdd">Add friend</button>'}`;
  host.appendChild(c);
  const b=c.querySelector('#invRefAdd');if(b)b.onclick=()=>{FR.push({id:Date.now(),name:r,ig:r,photo:''});frSave();invRefDone();c.querySelector('small').textContent='Added. Tap them in Friends to give a real name.';b.remove();toast('Added @'+r)};
}
invRefInit();
