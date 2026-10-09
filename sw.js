/* ═══ Clarvoyance Service Worker v229 ═══ */
const CACHE_VERSION  = 'clv-v272';
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

  /* ── v253: our own vendor scripts (tus upload, hls.js): cache-first, stored the first time they are fetched — later loads are instant/offline ── */
  if(url.origin === self.location.origin && url.pathname.indexOf('/vendor/') > -1){
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if(res.ok) caches.open(CACHE_VERSION).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  /* ── Everything else: cache-first ── */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

/* ── v184: Web Push — display the notification the admin-relay-worker's
   Cron-triggered rule engine sent. Payload shape: {title, body, target_tab}. ──
   v271: tell every currently-open tab about the push via postMessage; a page
   that's actually focused shows its own in-app toast (#clv-push-toast)
   instead of (not in addition to) the OS notification — owner's own ask,
   "in app bhi to notify hona chahiye na user ko" — a backgrounded/closed tab
   still gets the normal OS notification as before. */
self.addEventListener('push', e => {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) {}
  var title = data.title || 'Clarvoyance';
  var body = data.body || '';
  var targetTab = data.target_tab || null;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      var focused = clientList.find(function (c) { return c.focused; });
      clientList.forEach(function (c) {
        c.postMessage({ type: 'clv_push', title: title, body: body, target_tab: targetTab });
      });
      if (focused) return; /* already shown in-app via the message above — no OS notification on top of it */
      return self.registration.showNotification(title, {
        body: body,
        icon: '/clarvoyance/clar-logo.jpg.jpg',
        badge: '/clarvoyance/clar-logo.jpg.jpg',
        data: { target_tab: targetTab },
      });
    })
  );
});

/* Tapping the notification focuses an already-open tab (deep-linked via
   ?notif_tab=, read by the boot script) or opens a fresh one. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  var targetTab = (e.notification.data && e.notification.data.target_tab) || null;
  var url = '/clarvoyance/' + (targetTab ? ('?notif_tab=' + encodeURIComponent(targetTab)) : '');
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          if ('navigate' in c) c.navigate(url).catch(function () {});
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
