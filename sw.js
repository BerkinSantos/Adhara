// Guarda la página en el teléfono para que abra aunque no haya señal.
// Los avisos a Telegram nunca pasan por la caché.
const VERSION = 'adhara-v1';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const fuentes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!propio && !fuentes) return;

  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const clave = req.mode === 'navigate' ? 'index.html' : req;
      const guardado = await cache.match(clave, { ignoreSearch: req.mode === 'navigate' });
      const red = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(clave, res.clone());
          return res;
        })
        .catch(() => guardado || Response.error());
      return guardado || red;
    })
  );
});
