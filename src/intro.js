/* ---------- first-run intro: what Keep is, in four slides, before the photo import ---------- */
const INTRO='kept.intro';
const introDone=()=>{try{return localStorage.getItem(INTRO)==='1'}catch(e){return false}};
const introSlides=[
 {h:'Keep anything',p:'Photos, videos, voice, notes, quotes, people, places and files. Drop them onto one calendar.',
  art:`<div class="a-cal"><b>October</b><div class="a-grid">${'<i></i>'.repeat(3)}<i class="p"></i><i></i><i class="q"></i><i></i>${'<i></i>'.repeat(2)}<i class="t"></i><i class="r"></i>${'<i></i>'.repeat(3)}<i class="q"></i><i></i><i class="p"></i><i></i><i></i><i class="r"></i><i></i><i class="t"></i></div></div>`},
 {h:'Ask for it later',p:'Ask in your own words. Keep shows the original memory, and says so when nothing matches.',
  art:`<div class="a-q"><span>that bike ride in June</span><div>Found one on June 14.<em></em></div></div>`},
 {h:'Re-live the moment',p:'Tag who was there, then point your camera at the same spot to see them standing in it again.',
  art:`<div class="a-me"><div class="ring"></div><div class="bg"></div><div class="hd"></div><div class="bd"></div></div>`},
 {h:'Private by design',p:'Everything stays on this phone. No account, no server, no upload.',
  art:`<div class="a-lock">${ic.lock||'<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'}</div>`}
];
function introMaybe(){
  if(CFG.demo&&!/[?&]intro\b/.test(location.search))return false;
  if(!/[?&]intro\b/.test(location.search)&&(introDone()||emptyMode||user.length))return false;
  introOpen();return true;
}
function introOpen(){
  if($('#intro'))return;
  const d=document.createElement('div');d.id='intro';
  d.innerHTML=`<button class="isk" id="iSk">Skip</button><div class="itrack" id="iTr">${introSlides.map(s=>`<div class="islide"><div class="iart">${s.art}</div><h1>${s.h}</h1><p>${s.p}</p></div>`).join('')}</div>
   <div class="idots">${introSlides.map(()=>'<i></i>').join('')}</div><button class="pill d igo" id="iGo">Next</button>`;
  $('#app').appendChild(d);
  let i=0;const tr=$('#iTr'),sl=[...tr.children],dots=[...d.querySelectorAll('.idots i')],n=sl.length;
  const show=k=>{i=Math.max(0,Math.min(n-1,k));tr.style.transform=`translateX(${-i*100}%)`;
    sl.forEach((s,j)=>s.classList.toggle('on',j===i));dots.forEach((x,j)=>x.classList.toggle('on',j===i));
    $('#iGo').textContent=i===n-1?'Get started':'Next';$('#iSk').style.visibility=i===n-1?'hidden':'visible'};
  const done=()=>{try{localStorage.setItem(INTRO,'1')}catch(e){}d.remove();onbMaybe()};
  $('#iGo').onclick=()=>i===n-1?done():show(i+1);$('#iSk').onclick=done;
  let x0=null;
  tr.addEventListener('pointerdown',e=>{x0=e.clientX});
  tr.addEventListener('pointerup',e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>50)show(i+(dx<0?1:-1))});
  tr.addEventListener('pointercancel',()=>{x0=null});
  show(0);
}
