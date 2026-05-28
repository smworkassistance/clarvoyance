/* ═══ Clarvoyance Service Worker v67 ═══ */
const CACHE_VERSION = 'clv-v67';
const SHELL = [
  '/clarvoyance/',
  '/clarvoyance/index.html',
  '/clarvoyance/manifest.json',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      var oldCaches = keys.filter(k => k !== CACHE_VERSION);
      var isGenuineUpdate = oldCaches.length > 0; /* Had previous caches = real update */
      return Promise.all(oldCaches.map(k => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => {
          /* Only notify on genuine update, not first install */
          if(isGenuineUpdate){
            return self.clients.matchAll({ type:'window' }).then(clients => {
              clients.forEach(c => c.postMessage({ type:'SW_UPDATED' }));
            });
          }
        });
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');
  if(isHTML){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE_VERSION).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
