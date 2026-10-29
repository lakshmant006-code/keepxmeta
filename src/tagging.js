/* ---------- Tagging: suggestions from your people, and adding friends on the spot ---------- */
const tgNorm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const tgNames=m=>[...new Set([m.who].concat(Array.isArray(m.people)?m.people:[]).filter(x=>typeof x==='string'&&x.trim().length>1))];
/* everyone you could tag: your friends, plus names you have tagged or kept before, with how often and how recently */
function tagPool(){
  const pool=new Map(),get=n=>{const k=pkey(n);let e=pool.get(k);if(!e){e={name:n,friend:null,n:0,last:0};pool.set(k,e)}return e};
  all().forEach(m=>{if(m.type==='photo')tgNames(m).forEach(x=>{const e=get(x);e.n++;if(m.ts>e.last)e.last=m.ts});else if(m.type==='person'&&m.name){const e=get(m.name);e.n++;if(m.ts>e.last)e.last=m.ts}});
  FR.forEach(f=>{if(!f.name)return;const e=get(f.name);e.friend=f;e.name=f.name});
  return[...pool.values()];
}
/* rank by how well the typed text fits: whole-name start, a word start, a handle, anywhere; friends and frequent names first */
function tagRank(q){
  const nq=tgNorm(q),list=tagPool();
  if(!nq)return list.sort((a,b)=>(!!b.friend-!!a.friend)||b.last-a.last||b.n-a.n).slice(0,6);
  const sc=e=>{const n=tgNorm(e.name),ig=tgNorm(e.friend&&e.friend.ig);
    if(n.startsWith(nq))return 0;if(n.split(/\s+/).some(w=>w.startsWith(nq)))return 1;if(ig&&ig.startsWith(nq))return 1.5;if(n.includes(nq)||ig.includes(nq))return 2;return -1};
  return list.map(e=>[sc(e),e]).filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]||(!!b[1].friend-!!a[1].friend)||b[1].n-a[1].n).map(x=>x[1]).slice(0,6);
}
const tgBold=(name,q)=>{const i=tgNorm(name).indexOf(tgNorm(q));return q&&i>=0?esc(name.slice(0,i))+'<u>'+esc(name.slice(i,i+q.trim().length))+'</u>'+esc(name.slice(i+q.trim().length)):esc(name)};
function tagAddFriend(name){
  if(!name||FR.some(f=>pkey(f.name)===pkey(name)))return false;
  FR.push({id:Date.now(),name,ig:'',photo:''});frSave();return true;
}
/* wires the suggestion list under the name field of the tag card */
function tagSuggestInit(inp){
  const host=$('#tagSug');if(!host)return{adding:()=>false};
  let q=inp.value,active=-1,addFr=true,rows=[],known=new Set(FR.map(f=>pkey(f.name)));
  const exact=()=>!!q.trim()&&tagPool().some(e=>pkey(e.name)===pkey(q));
  const draw=()=>{
    rows=tagRank(q);const nq=q.trim(),canAdd=!!nq&&!exact();
    const sub=e=>e.friend?('Friend'+(e.friend.ig?' · @'+esc(e.friend.ig):'')):(e.n?'Tagged in '+e.n+(e.n===1?' photo':' photos'):'Saved');
    const av=e=>e.friend?frAv(e.friend):`<span class="fav">${avatar(e.name)}</span>`;
    let h='';
    if(!rows.length&&!nq&&!FR.length)h=`<div class="tgempty"><b>Add the people you tag</b><p>Add friends once, then tag them in a tap.</p><div class="tagr"><button class="tagch on" id="tgAdd">Add a friend</button><button class="tagch" id="tgIg">From Instagram</button></div></div>`;
    else h=`<div class="tgl2" role="listbox" aria-label="People">${rows.map((e,i)=>`<button class="tgr ${i===active?'on':''}" role="option" id="tg${i}" aria-selected="${i===active}" data-n="${esc(e.name)}" style="animation-delay:${i*40}ms"><span class="tga">${av(e)}</span><span class="tgt"><b>${tgBold(e.name,nq)}</b><small>${sub(e)}</small></span></button>`).join('')}${canAdd?`<button class="tgr add" data-add="${esc(nq)}" style="animation-delay:${rows.length*40}ms"><span class="tga"><span class="fav tgp">+</span></span><span class="tgt"><b>Add “${esc(nq)}”</b><small>${addFr?'New friend, tagged now':'Tag only, not added to friends'}</small></span></button>`:''}</div>`;
    if(nq&&canAdd)h+=`<div class="tagr" style="margin-top:8px"><button class="tagch ${addFr?'on':''}" id="tgFr" aria-pressed="${addFr}">Add to my friends</button></div>`;
    if(FR.length||rows.length)h+=`<div class="tgm"><button class="tgk" id="tgIg">Add friends from Instagram</button><button class="tgk" id="tgAdd">Add a friend</button></div>`;
    host.innerHTML=h;
    inp.setAttribute('aria-activedescendant',active>=0?'tg'+active:'');
  };
  const pick=n=>{inp.value=n;q=n;active=-1;draw();inp.focus()};
  host.addEventListener('click',e=>{
    const r=e.target.closest('[data-n]');if(r){pick(r.dataset.n);return}
    const a=e.target.closest('[data-add]');if(a){q=a.dataset.add;inp.value=q;active=-1;draw();inp.focus();return}
    if(e.target.closest('#tgFr')){addFr=!addFr;draw();return}
    if(e.target.closest('#tgIg')&&typeof frImportStart==='function'){frImportStart();return}
    if(e.target.closest('#tgAdd')&&typeof frEdit==='function'){frEdit();return}
  });
  inp.addEventListener('input',()=>{q=inp.value;active=-1;draw()});
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!rows.length)return;e.preventDefault();const n=rows.length+1;active=(((active+1+(e.key==='ArrowDown'?1:-1))%n)+n)%n-1;draw();return}
    if(e.key==='Enter'&&active>=0&&rows[active]){e.preventDefault();e.stopImmediatePropagation();pick(rows[active].name)}
  },true);
  /* a friend added from the tag card (one at a time) fills the name field */
  const onFr=()=>{if(!$('#tagp')){removeEventListener('keep:friends',onFr);return}
    const fresh=FR.filter(f=>!known.has(pkey(f.name)));known=new Set(FR.map(f=>pkey(f.name)));
    if(fresh.length===1&&(!inp.value.trim()||tgNorm(fresh[0].name).includes(tgNorm(inp.value)))){inp.value=fresh[0].name;q=fresh[0].name}
    draw()};
  addEventListener('keep:friends',onFr);
  draw();
  return{adding:()=>!!q.trim()&&!exact()&&addFr};
}
