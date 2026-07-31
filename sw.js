/* ═══ Clarvoyance Service Worker v159 ═══ */
const CACHE_VERSION  = 'clv-v168';
const SHEETS_WORKER  = 'https://clarvoyance-sheets.smworkassistance.workers.dev/';
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
      var isGenuineUpdate = oldCaches.length > 0;
      return Promise.all(oldCaches.map(k => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => {
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

  /* ── HTML / navigation: network-first, cache fallback ── */
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

  /* ── Sheets API: network-first, cache on success, serve cache offline ── */
  if(e.request.url.startsWith(SHEETS_WORKER)){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if(res.ok) caches.open(CACHE_VERSION).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* ── Everything else: cache-first ── */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
