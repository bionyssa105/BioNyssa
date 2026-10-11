const V = 'bio-sin-red-v12';
const E = 'bio-estaticos-v14';
const BASE = self.registration.scope;
const LISTA = [
  'offline.html', 'js/almacen-por-cuenta.js', 'js/juego-sin-conexion.js', 'assets/img/favicon.ico', 'assets/img/mascota.webp', 'assets/img/Botella.webp',
  'assets/img/Lata.webp', 'assets/img/Carton.webp', 'assets/img/Bolsa.webp', 'assets/img/Pila.webp'
].map((x) => new URL(x, BASE).href);
const OFFLINE = LISTA[0];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(LISTA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== E).map((k) => caches.delete(k)))),
      self.registration.navigationPreload ? self.registration.navigationPreload.enable() : null
    ]).then(() => self.clients.claim())
  );
});

function estatico(req) {
  const u = new URL(req.url);
  return req.method === 'GET' && u.origin === location.origin && /\.(css|js|webp|png|jpe?g|svg|ico|woff2?)$/.test(u.pathname) && !/\/sw\.js$/.test(u.pathname);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;

  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const pre = await e.preloadResponse;
          return pre || await fetch(req);
        } catch (err) {
          await new Promise((ok) => setTimeout(ok, 600));
          try { return await fetch(req); } catch (err2) {}
          return caches.match(OFFLINE);
        }
      })()
    );
    return;
  }

  if (LISTA.indexOf(req.url.split('?')[0]) > -1) {
    e.respondWith(fetch(req).catch(() => caches.match(req.url.split('?')[0])));
    return;
  }

  if (estatico(req)) {
    e.respondWith((async () => {
      const cache = await caches.open(E);
      try {
        const r = await fetch(req);
        if (r && r.ok) cache.put(req, r.clone());
        return r;
      } catch (err) {
        return (await cache.match(req)) || Response.error();
      }
    })());
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || 'mi-planta.html', BASE).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url === url) || cs[0];
    return c ? c.focus().then(() => c.navigate && c.url !== url ? c.navigate(url) : c) : self.clients.openWindow(url);
  }));
});
