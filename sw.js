const CACHE='habitos-rpg-v10';
const ASSETS=['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(async cache=>{
      await Promise.allSettled(
        ASSETS.map(url=>cache.add(url).catch(err=>console.warn('Cache miss:',url,err)))
      );
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  // Only handle GET requests
  if(e.request.method!=='GET') return;

  // Skip cross-origin requests (Firebase, CDN, etc.) — let them go through normally
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res=>{
        // Cache successful same-origin responses
        if(res&&res.status===200){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      })
      .catch(()=>{
        // Offline fallback — check cache first
        return caches.match(e.request).then(cached=>{
          if(cached) return cached;
          // Only serve index.html as fallback for navigation requests
          // Never for images, JSON, JS, CSS etc.
          if(e.request.mode==='navigate'){
            return caches.match('./index.html');
          }
          // For everything else return a proper error response
          return new Response('Offline',{status:503,statusText:'Service Unavailable'});
        });
      })
  );
});
