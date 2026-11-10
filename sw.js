// Service worker: l'app si apre anche senza rete; le mappe già viste restano in cache
const V='tcm-0.13';
const SHELL=['./','index.html','maplibre-gl.js','maplibre-gl.css','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V && k!=='tcm-tiles').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET') return;
  if(u.origin===location.origin){ // app: prima la rete (per avere sempre l'ultima versione), poi la cache
    e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return; }
  if(/tiles\.openfreemap\.org|server\.arcgisonline\.com/.test(u.host)){ // tessere mappa: cache, massimo ~2000
    e.respondWith(caches.open('tcm-tiles').then(async c=>{ const hit=await c.match(e.request); if(hit) return hit;
      const r=await fetch(e.request); if(r.ok){ c.put(e.request,r.clone()); c.keys().then(k=>{ if(k.length>2000) c.delete(k[0]); }); } return r; }));
  }
});
