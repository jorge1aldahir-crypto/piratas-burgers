/* Piratas Burgers: service worker.
   Siempre intenta la red primero (para que los cambios se vean al instante)
   y guarda una copia para abrir la app aunque no haya internet. */
var CACHE = 'piratas-v1';
var CORE = ['/', '/manifest.webmanifest','/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // WhatsApp, fuentes, CDNs y estadísticas van directo
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        var key = req.mode === 'navigate' ? url.pathname : req;
        caches.open(CACHE).then(function (c) { c.put(key, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req.mode === 'navigate' ? url.pathname : req).then(function (hit) {
        return hit || caches.match('/');
      });
    })
  );
});
