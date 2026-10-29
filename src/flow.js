/* ---------- Status flow: a calm, step-by-step progress screen ---------- */
/* A pulsing orb that settles into a check, with a short timeline under it where each step goes waiting, working, done.
   Built to stay smooth on a phone: it only ever animates transform and opacity (the compositor does the work, nothing re-lays-out), uses a
   handful of elements, and turns the motion down when the phone asks for reduced motion. */
const flowCheck='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="fck" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function flowOpen(host,o){
  host.innerHTML=`<div class="fl"><div class="flh" aria-hidden="true"><i class="flr r1"></i><i class="flr r2"></i><i class="flr r3"></i><div class="flo">${o.icon||''}<span class="flc">${flowCheck}</span></div></div>
   <h1 class="flt" id="flT">${o.title}</h1><p class="fls" id="flS">${o.sub||''}</p>
   <ol class="fll" aria-live="polite">${o.steps.map((s,i)=>`<li class="fli" data-i="${i}"><span class="flb"><i class="fld"></i><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>${s[0]}</b><small>${s[1]||''}</small></div></li>`).join('')}</ol>
   <div class="fla" id="flA"></div></div>`;
  const q=i=>host.querySelector('.fli[data-i="'+i+'"]'),root=host.querySelector('.fl');
  return{
    step(i,state,sub){const e=q(i);if(!e)return;e.dataset.s=state;if(sub!=null)e.querySelector('small').textContent=sub},
    sub(t){const s=host.querySelector('#flS');if(s)s.textContent=t},
    done(t,sub){root.classList.add('ok');const T=host.querySelector('#flT'),S=host.querySelector('#flS');if(T)T.textContent=t;if(S)S.textContent=sub||''},
    actions(html){host.querySelector('#flA').innerHTML=html},
    el:root};
}
