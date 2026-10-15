const cacheSinRed = 'bio-sin-red-v20';
const cacheEstaticos = 'bio-estaticos-v23';
const cacheFirebase = 'bio-firebase-v1'; // módulos de Firebase (su dirección lleva la versión, no cambian)
const BASE = self.registration.scope;
const LISTA = [
  'paginas/offline.html', 'js/nucleo.js', 'js/jugar.js', 'assets/img/favicon.ico', 'assets/img/mascota.webp', 'assets/img/Botella.webp',
  'assets/img/Lata.webp', 'assets/img/Carton.webp', 'assets/img/Bolsa.webp', 'assets/img/Pila.webp'
].map(function (item) { return new URL(item, BASE).href; });
const OFFLINE = LISTA[0];
const PAGINAS = ['index', 'paginas/menu', 'paginas/guia', 'paginas/mi-planta', 'paginas/impacto', 'paginas/informacion', 'paginas/minijuegos', 'paginas/juego-trivia', 'paginas/juego-clasificar', 'paginas/juego-memorama', 'paginas/contacto', 'paginas/comunidad', 'paginas/login', 'paginas/registro', 'paginas/recuperar']
  .map(function (item) { return new URL(item + '.html', BASE).href; }).concat(BASE);
async function guardarPaginas() {
  const cache = await caches.open(cacheEstaticos);
  const archivos = new Set();
  for (const url of PAGINAS) {
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) continue;
      cache.put(url, respuesta.clone());
      const html = await respuesta.text();
      for (const valor of html.matchAll(/(?:href|src)="((?:\.\.\/|)(?:css|js|assets)\/[^"]+)"/g)) archivos.add(new URL(valor[1], url).href);
    } catch (err) {}
  }
  await Promise.all([...archivos].map(function (item) { return cache.add(item).catch(function () {}); }));
}
self.addEventListener('install', function (ev) {
  ev.waitUntil(Promise.all([caches.open(cacheSinRed).then(function (resultado) { return resultado.addAll(LISTA); }), guardarPaginas()]).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    Promise.all([
      caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== cacheSinRed && k !== cacheEstaticos && k !== cacheFirebase; }).map(function (k) { return caches.delete(k); })); }),
      self.registration.navigationPreload ? self.registration.navigationPreload.enable() : null
    ]).then(function () { return self.clients.claim(); })
  );
});
function estatico(req) {
  const valor = new URL(req.url);
  return req.method === 'GET' && valor.origin === location.origin && /\.(css|js|webp|png|jpe?g|svg|ico|woff2?)$/.test(valor.pathname) && !/\/sw\.js$/.test(valor.pathname);
}
// Responde al instante con lo que ya está guardado y actualiza en segundo plano (la siguiente visita ya trae lo nuevo)
async function guardadoYActualiza(ev, req, cache, ignorarBusqueda) {
  const guardado = await cache.match(req, ignorarBusqueda ? { ignoreSearch: true } : undefined);
  const red = (async function () {
    try {
      const respuesta = (req.mode === 'navigate' && (await ev.preloadResponse)) || await fetch(req);
      if (respuesta && respuesta.ok && !respuesta.redirected) cache.put(req, respuesta.clone());
      return respuesta;
    } catch (err) { return null; }
  })();
  if (guardado) { ev.waitUntil(red); return guardado; }
  return red;
}
self.addEventListener('fetch', function (ev) {
  const req = ev.request;
  if (req.mode === 'navigate') {
    ev.respondWith((async function () {
      const cache = await caches.open(cacheEstaticos);
      return (await guardadoYActualiza(ev, req, cache, true)) || caches.match(OFFLINE);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const valor = new URL(req.url);
  if (valor.origin === 'https://www.gstatic.com' && valor.pathname.indexOf('/firebasejs/') === 0) {
    ev.respondWith((async function () {
      const cache = await caches.open(cacheFirebase);
      const guardado = await cache.match(req);
      if (guardado) return guardado;
      const respuesta = await fetch(req);
      if (respuesta && respuesta.ok) cache.put(req, respuesta.clone());
      return respuesta;
    })());
    return;
  }
  if (LISTA.indexOf(req.url.split('?')[0]) > -1) {
    ev.respondWith(caches.match(req.url.split('?')[0]).then(function (resultado) { return resultado || fetch(req); }));
    return;
  }
  if (estatico(req)) {
    ev.respondWith((async function () {
      const cache = await caches.open(cacheEstaticos);
      return (await guardadoYActualiza(ev, req, cache, false)) || Response.error();
    })());
  }
});
self.addEventListener('notificationclick', function (ev) {
  ev.notification.close();
  let url = new URL((ev.notification.data && ev.notification.data.url) || 'paginas/mi-planta.html', BASE);
  if (url.origin !== location.origin) url = new URL('paginas/mi-planta.html', BASE);
  url = url.href;
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    const valor = cs.find(function (item) { return item.url === url; }) || cs[0];
    return valor ? valor.focus().then(function () { return valor.navigate && valor.url !== url ? valor.navigate(url) : valor; }) : self.clients.openWindow(url);
  }));
});
