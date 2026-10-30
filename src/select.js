/* ---------- Edit many photos at once ---------- */
/* Profile → Edit many photos: every photo you kept in one grid. Tap to choose (or Select all, or a whole month), then do one thing to all of
   them: tag a person, move them to another day, set a caption, remove a tag, or delete. The last change can be undone. */
const SEL={sel:new Set(),shown:0,undo:null,only:false,io:null};
const selPhotos=()=>user.filter(m=>m.type==='photo'&&src(m)).sort((a,b)=>b.ts-a.ts);
const selMonth=m=>{const d=new Date(m.ts);return d.getFullYear()+'-'+pad(d.getMonth()+1)};
const selMonthName=k=>{const [y,mo]=k.split('-').map(Number);return MN[mo-1]+' '+y};
function selOpen(){
  const p=$('#sel');if(!p)return;SEL.sel.clear();SEL.shown=0;SEL.undo=null;SEL.only=false;
  p.classList.add('on');$('#sh').style.zIndex='50';selDraw(); /* sheets (tag, day, caption) open above this page */
}
function selClose(){const p=$('#sel');if(!p)return;if(SEL.io)SEL.io.disconnect();p.classList.remove('on');p.innerHTML='';$('#sh').style.zIndex='';refreshKeep()}
function selList(){const a=selPhotos();return SEL.only?a.filter(m=>!namesOf(m).length):a}
function selDraw(){
  const p=$('#sel'),all0=selPhotos(),list=selList(),n=SEL.sel.size;
  p.innerHTML=`<div class="mh2"><button class="ib" id="seX" aria-label="Close">${ic.x}</button><div class="t">${n?n+' selected':'Edit many photos'}</div><button class="mel" id="seAll" style="width:auto;padding:0 12px">${n===list.length&&n?'Clear':'Select all'}</button></div>
   <div class="sebar"><button class="tagch ${SEL.only?'on':''}" id="seOnly">Not tagged yet</button><span class="sec">${list.length} of ${all0.length} photos</span>${SEL.undo?'<button class="tagch" id="seUndo">Undo last change</button>':''}</div>
   <div class="frbody sebody" id="seBody">${all0.length?'<div id="seGrid"></div><div id="seMore"></div>':'<div class="empty" style="margin:30px 8px">No photos yet. Import some from Profile.</div>'}</div>
   <div class="seact ${n?'on':''}" id="seAct"><button data-a="tag">Tag person</button><button data-a="day">Change day</button><button data-a="cap">Caption</button><button data-a="untag">Remove tags</button><button data-a="del" class="dn">Delete</button></div>`;
  $('#seX').onclick=selClose;
  $('#seAll').onclick=()=>{if(SEL.sel.size===list.length)SEL.sel.clear();else list.forEach(m=>SEL.sel.add(m.id));selDraw()};
  $('#seOnly').onclick=()=>{SEL.only=!SEL.only;SEL.sel.clear();SEL.shown=0;selDraw()};
  if($('#seUndo'))$('#seUndo').onclick=selUndo;
  $('#seAct').onclick=e=>{const b=e.target.closest('[data-a]');if(b&&SEL.sel.size)selDo(b.dataset.a)};
  if(!all0.length)return;
  SEL.shown=0;selMore();
  const more=$('#seMore');if(SEL.io)SEL.io.disconnect();
  SEL.io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))selMore()},{root:$('#seBody'),rootMargin:'600px'});SEL.io.observe(more);
  $('#seGrid').onclick=e=>{
    const mh=e.target.closest('[data-month]');
    if(mh){const k=mh.dataset.month,ids=list.filter(m=>selMonth(m)===k).map(m=>m.id),all1=ids.every(i=>SEL.sel.has(i));ids.forEach(i=>all1?SEL.sel.delete(i):SEL.sel.add(i));selSync();return}
    const t=e.target.closest('[data-id]');if(!t)return;const id=+t.dataset.id;
    SEL.sel.has(id)?SEL.sel.delete(id):SEL.sel.add(id);selSync();
  };
}
/* draw the next batch of the grid (months in order, 90 photos at a time) */
function selMore(){
  const list=selList(),g=$('#seGrid');if(!g||SEL.shown>=list.length)return;
  const part=list.slice(SEL.shown,SEL.shown+90);let html='',last=SEL.shown?selMonth(list[SEL.shown-1]):'';
  part.forEach(m=>{const k=selMonth(m);if(k!==last){html+=`<button class="semh" data-month="${k}">${selMonthName(k)}<span>Select month</span></button>`;last=k}
    html+=`<button class="seit ${SEL.sel.has(m.id)?'on':''}" data-id="${m.id}" aria-label="Photo from ${longDay(new Date(m.ts))}"><img src="${src(m)}" alt="" loading="lazy" decoding="async"><span class="ck">✓</span>${namesOf(m).length?'':'<i class="sen"></i>'}</button>`});
  g.insertAdjacentHTML('beforeend',html);SEL.shown+=part.length;
}
/* update the picked state and counts without redrawing the grid */
function selSync(){
  const n=SEL.sel.size,list=selList();
  document.querySelectorAll('#seGrid .seit').forEach(b=>b.classList.toggle('on',SEL.sel.has(+b.dataset.id)));
  $('#sel .t').textContent=n?n+' selected':'Edit many photos';$('#seAct').classList.toggle('on',!!n);$('#seAll').textContent=n===list.length&&n?'Clear':'Select all';
}
const selMems=()=>user.filter(m=>SEL.sel.has(m.id));
/* run one change over every selected photo, remembering how to undo it */
function selApply(label,fn){
  const ms=selMems(),before=ms.map(m=>[m.id,JSON.stringify({ts:m.ts,text:m.text,who:m.who,pose:m.pose,at:m.at,people:m.people,auto:m.auto,reject:m.reject})]);
  ms.forEach(m=>{fn(m);idb.put(m).catch(()=>{})});
  SEL.undo={label,before,n:ms.length};refreshKeep();toast(label+' · '+ms.length+(ms.length===1?' photo':' photos'));
  if(typeof faceKick==='function')faceKick(1500);
  SEL.sel.clear();SEL.shown=0;selDraw();
}
function selUndo(){
  const u=SEL.undo;if(!u)return;
  u.before.forEach(([id,js])=>{const m=user.find(x=>x.id===id);if(!m)return;const o=JSON.parse(js);['ts','text','who','pose','at','people','auto','reject'].forEach(k=>{if(o[k]===undefined)delete m[k];else m[k]=o[k]});idb.put(m).catch(()=>{})});
  SEL.undo=null;refreshKeep();toast('Undone');SEL.shown=0;selDraw();
}
function selDo(a){
  const n=SEL.sel.size,what=n+(n===1?' photo':' photos');
  const sheet=(title,body,go)=>{openSheet(`<div class="dh"><h1>${title}</h1><p>${what}</p></div><div class="pb" style="padding-top:8px">${body}<button class="pill d" id="seGo" style="width:100%;justify-content:center;margin-top:14px">Apply to ${what}</button></div>`);$('#seGo').onclick=()=>{if(go()!==false)closeSheet()}};
  if(a==='tag'){
    const names=[...new Set((typeof tagPool==='function'?tagPool().map(e=>e.name):[]))].slice(0,10);
    sheet('Tag a person',`${names.length?`<div class="tagr" style="flex-wrap:wrap;margin-bottom:10px">${names.map(x=>`<button class="tagch" data-n="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:''}<input class="mein" id="seName" placeholder="Their name" maxlength="40" autocomplete="off" style="width:100%">`,()=>{
      const v=$('#seName').value.trim();if(!v){toast('Type a name');return false}
      selApply('Tagged '+v,m=>{if((m.reject||[]).some(x=>x.toLowerCase()===v.toLowerCase())){m.reject=m.reject.filter(x=>x.toLowerCase()!==v.toLowerCase())}
        if(namesOf(m).some(x=>x.toLowerCase()===v.toLowerCase()))return;
        if(!m.who){m.who=v;m.pose=m.pose||'stand';m.at=m.at||[.5,.74]}else m.people=(m.people||[]).concat(v)});
    });
    document.querySelectorAll('#sh [data-n]').forEach(b=>b.onclick=()=>{$('#seName').value=b.dataset.n});
  }else if(a==='day'){
    const t=new Date(selMems()[0].ts),v=t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate());
    sheet('Change the day',`<input type="date" class="mein" id="seDay" value="${v}" max="${dk(TODAY)}" style="width:100%"><p class="tagn" style="font-size:12.5px;margin:8px 0 0">Every selected photo moves to this day and keeps its time of day.</p>`,()=>{
      const x=$('#seDay').value;if(!x){toast('Pick a day');return false}const [y,mo,d]=x.split('-').map(Number);
      selApply('Moved to '+longDay(new Date(y,mo-1,d)),m=>{const o=new Date(m.ts);m.ts=Math.min(Date.now(),new Date(y,mo-1,d,o.getHours(),o.getMinutes()).getTime())});
    });
  }else if(a==='cap'){
    sheet('Add a caption',`<input class="mein" id="seCap" placeholder="Caption for all of them" maxlength="140" autocomplete="off" style="width:100%"><p class="tagn" style="font-size:12.5px;margin:8px 0 0">Replaces any caption they have now.</p>`,()=>{
      const v=$('#seCap').value.trim();selApply(v?'Caption set':'Captions cleared',m=>{m.text=v});
    });
  }else if(a==='untag'){
    sheet('Remove tags',`<p class="tagn" style="font-size:14px;margin:0">Takes every person tag off these photos. They will not be tagged again automatically.</p>`,()=>{
      selApply('Tags removed',m=>{m.reject=[...new Set((m.reject||[]).concat(namesOf(m)))];delete m.auto;delete m.who;delete m.pose;delete m.at;delete m.people});
    });
  }else if(a==='del'){
    sheet('Delete photos',`<p class="tagn" style="font-size:14px;margin:0">This removes ${what} from Keep. It cannot be undone.</p>`,()=>{
      const ids=new Set(SEL.sel);ids.forEach(id=>{saved.delete(id);idb.del(id).catch(()=>{});if(typeof lbReg!=='undefined')delete lbReg[id]});
      user=user.filter(m=>!ids.has(m.id));SEL.undo=null;SEL.sel.clear();SEL.shown=0;refreshKeep();toast('Deleted '+ids.size);selDraw();
    });
    const g=$('#seGo');if(g)g.classList.add('danger');
  }
}
