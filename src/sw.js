/* Keep service worker: the app shell works offline. Your memories live in IndexedDB, not here. */
const V='keep-__VERSION__',SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
/* A new version installs in the background and then waits; the page shows "Update available" and sends 'skip' when the person taps Update.
   The very first install has nothing to wait for and activates at once. */
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return; /* maps and fonts go straight to the network */
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
