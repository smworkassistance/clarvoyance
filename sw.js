/* ═══ Clarvoyance Service Worker v66 ═══
   Auto-update: bump CACHE_VERSION on every release
   ═══════════════════════════════════════════════ */
const CACHE_VERSION = 'clv-v66';
const SHELL = [
  '/clarvoyance/',
  '/clarvoyance/index.html',
  '/clarvoyance/manifest.json',
];

/* ── Install: cache shell, take over immediately ── */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).catch(() => {})
  );
});

/* ── Activate: delete old caches, claim all clients ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        /* Tell every open tab: new version is live → reload */
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

/* ── Fetch: network-first for HTML, cache-first for rest ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');

  if (isHTML) {
    /* Always try network first so updates land immediately */
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* Everything else: cache-first (fonts, icons, etc.) */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
