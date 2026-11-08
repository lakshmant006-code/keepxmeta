/* floating pill tab bar: the header's four shortcuts and the add button move here, reusing the original handlers */
(function(){
  const dock=document.querySelector('.dock');if(!dock||document.getElementById('kpill'))return;
  const p=document.createElement('div');p.className='kpill';p.id='kpill';
  const items=[['mapBtn','pinm','Places'],['frBtn','users','People'],['addBtn','plus',''],['insBtn','chart','Insights'],['arBtn','cube','Re-live']];
  p.innerHTML=items.map(([id,i,l])=>id==='addBtn'?`<button class="pa" data-t="${id}" aria-label="Add an instant">${ic.plus}</button>`:`<button class="pt" data-t="${id}" aria-label="${l}">${ic[i]||''}<span>${l}</span></button>`).join('');
  p.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;const t=document.getElementById(b.dataset.t);if(t)t.click()};
  dock.appendChild(p);
})();
