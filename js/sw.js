const V = 'bio-sin-red-v16';
const E = 'bio-estaticos-v19';
const BASE = self.registration.scope;
const LISTA = [
  'paginas/offline.html', 'js/almacen-por-cuenta.js', 'js/juego-sin-conexion.js', 'assets/img/favicon.ico', 'assets/img/mascota.webp', 'assets/img/Botella.webp',
  'assets/img/Lata.webp', 'assets/img/Carton.webp', 'assets/img/Bolsa.webp', 'assets/img/Pila.webp'
].map((x) => new URL(x, BASE).href);
const OFFLINE = LISTA[0];
const PAGINAS = ['index', 'paginas/menu', 'paginas/guia', 'paginas/mi-planta', 'paginas/impacto', 'paginas/informacion', 'paginas/minijuegos', 'paginas/juego-trivia', 'paginas/juego-clasificar', 'paginas/juego-memorama', 'paginas/contacto', 'paginas/comunidad', 'paginas/login', 'paginas/registro', 'paginas/recuperar']
  .map((x) => new URL(x + '.html', BASE).href).concat(BASE);
async function guardarPaginas() {
  const cache = await caches.open(E);
  const archivos = new Set();
  for (const url of PAGINAS) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      cache.put(url, r.clone());
      const html = await r.text();
      for (const m of html.matchAll(/(?:href|src)="((?:\.\.\/|)(?:css|js|assets)\/[^"]+)"/g)) archivos.add(new URL(m[1], url).href);
    } catch (err) {}
  }
  await Promise.all([...archivos].map((a) => cache.add(a).catch(() => {})));
}
self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([caches.open(V).then((c) => c.addAll(LISTA)), guardarPaginas()]).then(() => self.skipWaiting()));
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
    e.respondWith((async () => {
      const cache = await caches.open(E);
      try {
        const r = (await e.preloadResponse) || await fetch(req);
        if (r && r.ok) cache.put(req, r.clone());
        return r;
      } catch (err) {
        return (await cache.match(req, { ignoreSearch: true })) || caches.match(OFFLINE);
      }
    })());
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
  let url = new URL((e.notification.data && e.notification.data.url) || 'paginas/mi-planta.html', BASE);
  if (url.origin !== location.origin) url = new URL('paginas/mi-planta.html', BASE);
  url = url.href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url === url) || cs[0];
    return c ? c.focus().then(() => c.navigate && c.url !== url ? c.navigate(url) : c) : self.clients.openWindow(url);
  }));
});
