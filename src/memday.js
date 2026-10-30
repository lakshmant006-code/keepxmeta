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
function momOpen(){
  const m=pick();if(!m)return;
  const d=new Date(m.ts);
  openSheet(`<div class="momw"><div class="momimg" style="background-image:url(${src(m)})"></div><small>${esc(ago(m))}</small><p>${esc(line(m))}</p><em>${fullDay(d)}</em>
   <div class="momr"><button class="pill g" id="momn">Another</button><button class="pill g" id="momS">Share</button><button class="pill d" id="momo">Open day</button></div></div>`,{});
  $('#momn').onclick=()=>{shift++;momRender();momOpen()};
  $('#momo').onclick=()=>openDay(dk(d));
  $('#momS').onclick=()=>momShare(m).catch(()=>toast('Could not share that'));
}
/* the card as a picture, to share or set as a wallpaper */
async function momShare(m){
  const W=1080,H=1440,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src(m)});
  const PH=1000,rr=(a,b,w,h,r)=>{x.beginPath();x.roundRect(a,b,w,h,r)};
  x.save();rr(40,40,W-80,PH,48);x.clip();const k=Math.max((W-80)/img.width,PH/img.height),w=img.width*k,h=img.height*k;x.drawImage(img,40+(W-80-w)/2,40+(PH-h)/2,w,h);x.restore();
  x.fillStyle='#0866FF';x.font='600 30px system-ui,sans-serif';x.fillText(ago(m).toUpperCase(),60,PH+120);
  x.fillStyle='#111';x.font='600 52px system-ui,sans-serif';
  const words=line(m).split(/\s+/);let ln='',y=PH+190;
  for(const wd of words){const t=ln?ln+' '+wd:wd;if(x.measureText(t).width>W-120&&ln){x.fillText(ln,60,y);y+=68;ln=wd}else ln=t}
  x.fillText(ln,60,y);x.fillStyle='#777';x.font='400 30px system-ui,sans-serif';x.fillText('Keep · '+fullDay(new Date(m.ts)),60,H-56);
  const blob=await new Promise(r=>c.toBlob(r,'image/png')),f=new File([blob],'keep-memory.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='keep-memory.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Saved as a picture');
}
momRender();
})();
