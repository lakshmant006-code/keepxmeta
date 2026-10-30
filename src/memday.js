/* Memory of the day: one picture from an earlier day, with the line you wrote about it (or a gentle one) below. All on this phone. */
(()=>{
const KEY='keep.mom',HIDE='keep.momHide',$=q=>document.querySelector(q);
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
window.momOn=()=>ls(KEY)!=='0';
window.momSet=on=>{ls(KEY,on?'1':'0');if(on)ls(HIDE,'');momRender()};
const hash=s=>{let h=2166136261;const c=String(s);for(let i=0;i<c.length;i++){h^=c.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const GENTLE=['A moment you kept.','Glad you kept this one.','A good one to look back on.'];
let shift=0;
function pool(){
  const t0=+TODAY;
  return all().filter(m=>m.ts<t0&&(m.type==='photo'||m.type==='video')&&src(m)).map(m=>{
    const d=new Date(m.ts);let s=0;
    if(d.getMonth()===TODAY.getMonth()&&d.getDate()===TODAY.getDate()&&d.getFullYear()<TODAY.getFullYear())s+=100;
    if(m.text&&m.text.trim().length>3)s+=30;if(m.who)s+=4;
    return{m,s,h:hash(m.id+'|'+dk(TODAY))};
  }).sort((a,b)=>b.s-a.s||a.h-b.h);
}
function pick(){
  const p=pool();if(!p.length)return null;
  const top=p.filter(x=>x.s===p[0].s).sort((a,b)=>a.h-b.h);
  const list=top.length>=2?top:p.slice(0,8).sort((a,b)=>a.h-b.h);
  return list[shift%list.length].m;
}
function ago(m){
  const d=new Date(m.ts),dd=Math.round((+TODAY-+new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
  const yrs=TODAY.getFullYear()-d.getFullYear();
  if(yrs>=1&&d.getMonth()===TODAY.getMonth()&&d.getDate()===TODAY.getDate())return yrs===1?'A year ago today':yrs+' years ago today';
  if(dd<2)return 'Yesterday';if(dd<14)return dd+' days ago';if(dd<60)return Math.round(dd/7)+' weeks ago';
  if(dd<365)return Math.round(dd/30)+' months ago';return yrs>1?yrs+' years ago':'A year ago';
}
const line=m=>(m.text&&m.text.trim())||GENTLE[hash(m.id)%GENTLE.length];
window.momRender=()=>{
  const el=$('#mom');if(!el)return;
  const m=window.momOn()&&!emptyMode&&ls(HIDE)!==dk(TODAY)?pick():null;
  if(!m){el.hidden=true;return}
  el.hidden=false;el.innerHTML=`<button class="momc" id="momc"><i class="momp" style="background-image:url(${src(m)})"></i><span><small>${esc(ago(m))}</small><b>${esc(line(m))}</b></span></button><button class="momx" id="momx" aria-label="Hide for today">×</button>`;
  $('#momc').onclick=momOpen;$('#momx').onclick=()=>{ls(HIDE,dk(TODAY));el.hidden=true};
};
/* ---- cute widgets: three little cards, swipe between them ---- */
const NOTES=['Small good things count.','You showed up today. That is plenty.','Be gentle with yourself today.','Something nice is on its way.','Today is a fresh page.','Breathe. You are doing fine.','Collect the little joys.','Soft days are good days too.','You are allowed to enjoy this.','Look how much you notice.'];
const EMO=['☀️','🌼','💛','🍀','🧸','🌈','✨','🫶'];
const myNotes=()=>{try{return JSON.parse(ls('keep.notes')||'[]')}catch(e){return[]}};
const saveNotes=a=>ls('keep.notes',JSON.stringify(a.slice(-40)));
let nshift=0;
function note(){
  const mine=myNotes(),pool=mine.concat(NOTES,[`You have kept ${all().length} moments. Look how much you notice.`]);
  const h=hash(dk(TODAY)+'n');return{t:pool[(h+nshift)%pool.length],e:EMO[(h+nshift)%EMO.length]};
}
const WS=[
 {k:'pol',n:'Polaroid',bg:'#FFF6E8'},
 {k:'note',n:'Sticker note',bg:'#FFF3A8'},
 {k:'bub',n:'Bubble',bg:'#E7F0FF'}];
function wHTML(w,m,n){
  const ph=m?src(m):'',cap=m?line(m):n.t,when=m?ago(m):'Just for you';
  if(w.k==='pol')return `<div class="wd wpol"><i class="wtape"></i><div class="wph" style="background-image:url(${ph})"></div><p class="whand">${esc(cap)}</p><small>${esc(when)} ♡</small></div>`;
  if(w.k==='note')return `<div class="wd wnote"><i class="wfold"></i><div class="wemo">${n.e}</div><p class="whand">${esc(n.t)}</p><small>from Keep</small></div>`;
  return `<div class="wd wbub"><span class="wsp s1">✦</span><span class="wsp s2">✧</span><div class="wcirc" style="background-image:url(${ph})"></div><p class="wpill">${esc(cap)}</p><small>${esc(when)}</small></div>`;
}
function momOpen(){
  const m=pick(),n=note();
  openSheet(`<div class="dh"><h1>Today’s little widget</h1><p>Swipe to pick a style</p></div><div class="pb" style="padding-top:8px">
   <div class="wrow" id="wrow">${WS.map(w=>`<div class="wslot" data-k="${w.k}">${wHTML(w,w.k==='note'?null:m,n)}</div>`).join('')}</div>
   <div class="wdots" id="wdots">${WS.map((w,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>
   <div class="momr"><button class="pill g" id="momn">Another</button><button class="pill g" id="momS">Share</button>${m?'<button class="pill d" id="momo">Open day</button>':''}</div>
   <div class="wadd"><input id="wnote" maxlength="90" placeholder="Write yourself a happy note" autocomplete="off"><button class="pill d" id="wnadd">Add</button></div></div>`,{full:true});
  const row=$('#wrow'),cur=()=>Math.round(row.scrollLeft/row.clientWidth);
  row.onscroll=()=>{const c=cur();document.querySelectorAll('#wdots i').forEach((d,i)=>d.classList.toggle('on',i===c))};
  $('#momn').onclick=()=>{shift++;nshift++;momRender();momOpen()};
  if($('#momo'))$('#momo').onclick=()=>openDay(dk(new Date(m.ts)));
  $('#momS').onclick=()=>momShare(WS[cur()],m,n).catch(()=>toast('Could not share that'));
  $('#wnadd').onclick=()=>{const v=$('#wnote').value.trim();if(!v)return;const a=myNotes();a.push(v);saveNotes(a);nshift=0;toast('Added');momOpen();row.scrollTo?0:0};
  if(window.Motion)Motion.animate(document.querySelectorAll('.wslot .wd'),{rotate:[-2,2]},{duration:2.6,repeat:Infinity,repeatType:'mirror',ease:'easeInOut'});
}
/* the chosen widget as a picture, to share or set as a wallpaper */
async function momShare(w,m,n){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const FF='"Bradley Hand","Segoe Print","Comic Sans MS",system-ui,cursive';
  const wrap=(t,f,mw,lh,X,Y,al)=>{x.font=f;x.textAlign=al||'left';const ws=t.split(/\s+/);let l='',y=Y;for(const a of ws){const q=l?l+' '+a:a;if(x.measureText(q).width>mw&&l){x.fillText(l,X,y);y+=lh;l=a}else l=q}x.fillText(l,X,y);return y};
  const load=u=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=u});
  const cover=(i,a,b,ww,hh)=>{const k=Math.max(ww/i.width,hh/i.height);x.drawImage(i,a+(ww-i.width*k)/2,b+(hh-i.height*k)/2,i.width*k,i.height*k)};
  const cap=m&&w.k!=='note'?line(m):n.t,when=m&&w.k!=='note'?ago(m):'from Keep';
  x.fillStyle=w.bg;x.fillRect(0,0,W,H);
  if(w.k==='pol'){
    x.save();x.translate(W/2,H/2);x.rotate(-.035);x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.18)';x.shadowBlur=40;x.shadowOffsetY=16;x.fillRect(-440,-560,880,1120);x.shadowColor='transparent';
    const i=await load(src(m));x.save();x.beginPath();x.rect(-400,-520,800,800);x.clip();x.translate(-400,-520);cover(i,0,0,800,800);x.restore();
    x.fillStyle='rgba(255,214,120,.8)';x.fillRect(-110,-590,220,64);
    x.fillStyle='#333';wrap(cap,'500 54px '+FF,780,70,0,360,'center');x.fillStyle='#999';x.font='400 34px system-ui';x.textAlign='center';x.fillText(when+' ♡',0,500);x.restore();
  }else if(w.k==='note'){
    x.fillStyle='#fff7';x.fillRect(0,0,0,0);x.font='260px serif';x.textAlign='center';x.fillText(n.e,W/2,430);
    x.fillStyle='#4a3b00';wrap(n.t,'600 76px '+FF,840,100,W/2,640,'center');x.fillStyle='#8a7a2a';x.font='400 38px system-ui';x.fillText('from Keep',W/2,H-110);
  }else{
    const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#E7F0FF');g.addColorStop(1,'#FFE9F3');x.fillStyle=g;x.fillRect(0,0,W,H);
    const i=await load(src(m));x.save();x.beginPath();x.arc(W/2,470,330,0,7);x.clip();cover(i,W/2-330,140,660,660);x.restore();
    x.lineWidth=14;x.strokeStyle='#fff';x.beginPath();x.arc(W/2,470,330,0,7);x.stroke();
    x.fillStyle='#fff';x.beginPath();x.roundRect(90,880,W-180,250,60);x.fill();x.fillStyle='#222';wrap(cap,'600 56px system-ui,sans-serif',W-300,72,W/2,970,'center');
    x.fillStyle='#8a8fa3';x.font='400 36px system-ui';x.textAlign='center';x.fillText(when,W/2,H-90);
  }
  const blob=await new Promise(r=>c.toBlob(r,'image/png')),f=new File([blob],'keep-widget.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='keep-widget.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Saved as a picture');
}
momRender();
})();
