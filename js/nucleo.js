var paginaActual = document.body.getAttribute('data-pagina');

// almacen
if (['admin'].indexOf(paginaActual) === -1) {
 try {
(function () {
  var COMUN = {
    bionyssa_tema: 1, bionyssa_sesion: 1, bionyssa_cuentas: 1,
    bionyssa_publicaciones: 1, bionyssa_perfiles: 1
  };
  var ls = window.localStorage;
  var proto = Storage.prototype;
  var leer = proto.getItem, escribir = proto.setItem, quitar = proto.removeItem;
  function sesion() {
    try {
      var datos = JSON.parse(leer.call(ls, 'bionyssa_sesion'));
      return datos && datos.id ? datos : null;
    } catch (err) { return null; }
  }
  function clave(k, almacen) {
    if (almacen !== ls || typeof k !== 'string' || k.indexOf('bionyssa_') !== 0 || COMUN[k]) return k;
    var valor = sesion();
    return k + '@' + (valor ? valor.id : 'invitado');
  }
  proto.getItem = function (k) { return leer.call(this, clave(k, this)); };
  proto.setItem = function (k, valor) { return escribir.call(this, clave(k, this), valor); };
  proto.removeItem = function (k) { return quitar.call(this, clave(k, this)); };
  try {
    var cruda = leer.call(ls, 'bionyssa_sesion');
    if (cruda && !sesion()) quitar.call(ls, 'bionyssa_sesion');
  } catch (err2) {}
  window.BioAlmacen = {
    pasarInvitado: function (id) {
      if (!id) return 0;
      var fin = '@invitado', suf = '@' + id, claves = [], pasadas = 0, i;
      for (i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('bionyssa_') === 0 && k.slice(-fin.length) === fin) claves.push(k);
      }
      claves.forEach(function (k) {
        var base = k.slice(0, -fin.length);
        if (COMUN[base]) return;
        try {
          if (leer.call(ls, base + suf) === null) {
            escribir.call(ls, base + suf, leer.call(ls, k));
            pasadas++;
          }
          quitar.call(ls, k);
        } catch (err) {}
      });
      return pasadas;
    },
    limpiar: function (id) {
      var fin = '@' + id, borrar = [];
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('bionyssa_') === 0 && k.slice(-fin.length) === fin) borrar.push(k);
      }
      borrar.forEach(function (k) { quitar.call(ls, k); });
    }
  };

  // Plantas de "Mi planta": varias por cuenta. Cada planta es un objeto con su id y su diario va aparte.
  //   bionyssa_plantas         : lista de plantas
  //   bionyssa_diario_<idPlanta>: entradas del diario de esa planta (la más nueva primero)
  // Antes había una sola planta (bionyssa_planta + bionyssa_planta_diario); se pasa sola a este formato.
  var ID_VIEJA = 'p_inicial';
  function jsonDe(k) {
    try { return JSON.parse(leer.call(ls, clave(k, ls))); } catch (err) { return null; }
  }
  function conIdsDiario(lista) {
    var cantidad = lista.length;
    return lista.map(function (item, i) {
      var copia = Object.assign({}, item);
      if (!copia.id) copia.id = 'e_l' + (cantidad - i);
      if (!copia.creado) copia.creado = Date.parse((copia.f || '') + 'T12:00') || 0;
      return copia;
    });
  }
  window.BioPlantas = {
    ID_VIEJA: ID_VIEJA,
    // Convierte la planta vieja (objeto suelto + su diario) al formato nuevo
    convertir: function (planta, diario) {
      if (!planta || typeof planta !== 'object') return null;
      var copia = Object.assign({}, planta);
      copia.id = ID_VIEJA;
      if (!copia.creado) copia.creado = Date.parse((copia.siembra || '') + 'T12:00') || Date.now();
      return { planta: copia, diario: conIdsDiario(Array.isArray(diario) ? diario : []) };
    },
    nuevoId: function () { return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    nuevaEntradaId: function () { return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); },
    migrar: function () {
      try {
        var vieja = jsonDe('bionyssa_planta');
        if (!vieja || typeof vieja !== 'object') return;
        var lista = jsonDe('bionyssa_plantas');
        if (!Array.isArray(lista)) lista = [];
        if (!lista.some(function (item) { return item && item.id === ID_VIEJA; })) {
          var valor = BioPlantas.convertir(vieja, jsonDe('bionyssa_planta_diario'));
          lista.push(valor.planta);
          ls.setItem('bionyssa_plantas', JSON.stringify(lista));
          ls.setItem('bionyssa_diario_' + ID_VIEJA, JSON.stringify(valor.diario));
        }
        quitar.call(ls, clave('bionyssa_planta', ls));
        quitar.call(ls, clave('bionyssa_planta_diario', ls));
      } catch (err) {}
    },
    todas: function () {
      BioPlantas.migrar();
      var valor = jsonDe('bionyssa_plantas');
      return Array.isArray(valor) ? valor.filter(function (item) { return item && typeof item === 'object' && item.id; }) : [];
    },
    guardar: function (lista) {
      try { ls.setItem('bionyssa_plantas', JSON.stringify(lista)); return true; } catch (err) { return false; }
    },
    diario: function (id) {
      var valor = jsonDe('bionyssa_diario_' + id);
      return Array.isArray(valor) ? valor : [];
    },
    guardarDiario: function (id, lista) {
      try { ls.setItem('bionyssa_diario_' + id, JSON.stringify(lista)); return true; } catch (err) { return false; }
    },
    quitarDiario: function (id) { try { ls.removeItem('bionyssa_diario_' + id); } catch (err) {} }
  };
  function leerArchivo(archivo) {
    return new Promise(function (ok, mal) {
      var lector = new FileReader();
      lector.onload = function () { ok(lector.result); };
      lector.onerror = function () { mal(new Error('lectura')); };
      lector.readAsDataURL(archivo);
    });
  }
  function cargarImg(src) {
    return new Promise(function (ok, mal) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { mal(new Error('imagen')); };
      img.src = src;
    });
  }
  async function preparar(origen) {
    if (typeof origen !== 'string') origen = await leerArchivo(origen);
    return cargarImg(origen);
  }
  function jpeg(valor, calidad) {
    var lienzo = document.createElement('canvas');
    lienzo.width = valor.width; lienzo.height = valor.height;
    var valor2 = lienzo.getContext('2d');
    valor2.fillStyle = '#fff'; valor2.fillRect(0, 0, lienzo.width, lienzo.height);
    valor2.drawImage(valor, 0, 0);
    return lienzo.toDataURL('image/jpeg', calidad);
  }
  window.BioImg = {
    comprimir: async function (origen, max, calidad) {
      var img = await preparar(origen);
      var esc = Math.min(1, (max || 1024) / Math.max(img.width, img.height));
      var lienzo = document.createElement('canvas');
      lienzo.width = Math.max(1, Math.round(img.width * esc));
      lienzo.height = Math.max(1, Math.round(img.height * esc));
      lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
      return jpeg(lienzo, calidad || 0.8);
    },
    cuadrada: async function (origen, lado, calidad) {
      var img = await preparar(origen);
      var numero = Math.min(img.width, img.height);
      var lienzo = document.createElement('canvas');
      lienzo.width = lienzo.height = lado || 256;
      lienzo.getContext('2d').drawImage(img, (img.width - numero) / 2, (img.height - numero) / 2, numero, numero, 0, 0, lienzo.width, lienzo.height);
      return jpeg(lienzo, calidad || 0.85);
    }
  };
})();
 } catch (err) { console.error(err); }
}

// principal
if (['admin', 'offline'].indexOf(paginaActual) === -1) {
 try {
window.BioComun = (function () {
  const CLAVE_TEMA = 'bionyssa_tema';
  function temaActual() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function aplicarTema(tema) {
    if (tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem(CLAVE_TEMA, tema); } catch (err) {}
    try { if (window.BioSesion && BioSesion.obtener()) localStorage.setItem('bionyssa_tema_cuenta', tema); } catch (err2) {}
  }
  function temaDeCuenta() {
    try {
      if (!(window.BioSesion && BioSesion.obtener())) return;
      const valor = localStorage.getItem('bionyssa_tema_cuenta');
      if ((valor !== 'dark' && valor !== 'light') || valor === temaActual()) return;
      if (valor === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(CLAVE_TEMA, valor);
      pintarIconosTema();
    } catch (err) {}
  }
  function alternarTema(ev) {
    const raiz = document.documentElement;
    const siguiente = temaActual() === 'dark' ? 'light' : 'dark';
    const cambiar = function () { aplicarTema(siguiente); pintarIconosTema(); };
    const reducir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducir) { cambiar(); return; }
    if (!document.startViewTransition) {
      raiz.classList.add('tema-suave');
      cambiar();
      setTimeout(function () { return raiz.classList.remove('tema-suave'); }, 500);
      return;
    }
    const btn = ev && ev.currentTarget;
    const resultado = btn ? btn.getBoundingClientRect() : { left: innerWidth - 40, top: 40, width: 0, height: 0 };
    const x = resultado.left + resultado.width / 2;
    const y = resultado.top + resultado.height / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    raiz.classList.add('cambiando-tema');
    const valor = document.startViewTransition(cambiar);
    valor.ready.then(function () {
      raiz.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radio + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 720, easing: 'cubic-bezier(.55,.05,.25,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
    valor.finished.finally(function () { return raiz.classList.remove('cambiando-tema'); });
  }
  const ICONO_LUNA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19.6 14.3c-1.2 3.6-4.6 5.9-8.4 5.6-4.4-.4-7.6-4.2-7.3-8.5.3-3.4 2.6-6.2 5.8-7.2-1 3.4.3 7.3 3.6 9.2 2 1.1 4.2 1.2 6.3.9z"/></g></svg>';
  const ICONO_SOL = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12.1 8c2.2 0 4 1.8 3.9 4.1-.1 2.2-1.9 3.9-4.1 3.9-2.1-.1-3.9-1.9-3.8-4.1.1-2.1 1.9-3.9 4-3.9z"/><path d="M12 2.9v2.3M12.2 18.9v2.4M2.8 12.2h2.4M18.9 11.9h2.3M5.6 5.7l1.6 1.5M16.8 16.9l1.7 1.6M18.5 5.5l-1.6 1.7M7.2 16.8l-1.7 1.7"/></g></svg>';
  function pintarIconosTema() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      const oscuro = temaActual() === 'dark';
      btn.innerHTML = oscuro ? ICONO_SOL : ICONO_LUNA;
      btn.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      btn.setAttribute('title', oscuro ? 'Modo claro' : 'Modo oscuro');
    });
  }
  function enlazarBotonesTema() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', alternarTema);
    });
    pintarIconosTema();
  }
  function inyectarToggleEnTopbar() {
    document.querySelectorAll('.topbar-row').forEach(function (fila) {
      if (fila.querySelector('.theme-toggle')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle';
      const sesionLink = fila.querySelector('.topbar-session');
      if (sesionLink) fila.insertBefore(btn, sesionLink);
      else fila.appendChild(btn);
    });
  }
  function inyectarNavEscritorio() {
    const enlaces = [
      ['/paginas/menu.html', 'Menú'],
      ['/paginas/guia.html', 'Guía de uso'],
      ['/paginas/informacion.html', 'Información'],
      ['/paginas/comunidad.html', 'Comunidad'],
      ['/paginas/minijuegos.html', 'Minijuegos'],
      ['/paginas/mi-planta.html', 'Mi planta'],
      ['/paginas/impacto.html', 'Impacto'],
      ['/paginas/contacto.html', 'Contacto']
    ];
    const limpio = function (extra) { return String(extra || '').split(/[?#]/)[0].split('/').pop().replace(/\.html?$/i, '').toLowerCase() || 'index'; };
    const paginaActual = limpio(location.pathname);
    document.querySelectorAll('.topbar-row').forEach(function (fila) {
      if (fila.querySelector('.nav-escritorio')) return;
      const nav = document.createElement('nav');
      nav.className = 'nav-escritorio';
      enlaces.forEach(function ([href, texto]) {
        const enlace = document.createElement('a');
        enlace.href = href;
        enlace.textContent = texto;
        if (limpio(href) === paginaActual || (href === '/paginas/minijuegos.html' && paginaActual.indexOf('juego-') === 0)) {
          enlace.className = 'actual';
          enlace.setAttribute('aria-current', 'page');
        }
        nav.appendChild(enlace);
      });
      const toggle = fila.querySelector('.theme-toggle');
      if (toggle) fila.insertBefore(nav, toggle);
      else fila.appendChild(nav);
      const act = nav.querySelector('.actual');
      if (act && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = act.offsetLeft - (nav.clientWidth - act.offsetWidth) / 2;
    });
  }
  function inyectarNavMovil() {
    if (document.querySelector('.nav-movil') || !document.querySelector('.topbar')) return;
    const limpio = function (extra2) { return String(extra2 || '').split(/[?#]/)[0].split('/').pop().replace(/\.html?$/i, '').toLowerCase() || 'index'; };
    const actual = limpio(location.pathname);
    if (['index', 'login', 'registro', '404'].indexOf(actual) > -1) return;
    const trazo = function (dato, ancho) { return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="' + (ancho || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + dato + '</g></svg>'; };
    const ICONOS = {
      menu: trazo('<path d="M4.2 11.1 12 4.3l7.8 6.8"/><path d="M6.1 9.8v9.6c3.3.5 8.5.5 11.8 0V9.8"/><path d="M10 19.3v-5h4v5"/>'),
      guia: trazo('<path d="M3.9 5.6c2.6-.9 5.5-.8 8.1.6 2.6-1.4 5.5-1.5 8.1-.6.4 4.4.4 8.6 0 12.8-2.6-.7-5.4-.6-8.1.7-2.7-1.3-5.5-1.4-8.1-.7-.4-4.2-.4-8.4 0-12.8z"/><path d="M12 6.3c.1 4.1.1 8.2 0 12.7"/>'),
      comunidad: trazo('<path d="M9.2 5.5c1.6-.1 2.9 1.2 2.8 2.8-.1 1.6-1.3 2.9-3 2.8-1.4-.1-2.6-1.3-2.6-2.8 0-1.4 1.2-2.7 2.8-2.8z"/><path d="M3.3 19.4c.7-3.2 2.9-4.8 5.7-4.8 2.8.1 4.9 1.6 5.6 4.9"/><path d="M16.5 6.3c1.3 0 2.4 1 2.4 2.3 0 1.3-1 2.3-2.3 2.3"/><path d="M17.1 14.3c2 .3 3.3 1.8 3.7 4.2"/>'),
      juegos: trazo('<path d="M6.4 8.2c3.8-.4 7.5-.4 11.3 0 2.2.2 3.4 2.6 3 5.4-.4 2.7-2 3.9-3.6 3.3-1.2-.5-2-1.6-2.9-2.7-1.2-.1-2.4-.1-3.6 0-.9 1.1-1.7 2.2-2.9 2.7-1.6.6-3.2-.6-3.6-3.3-.4-2.8.8-5.2 3.3-5.4z"/><path d="M7.8 11.2v3M6.3 12.7h3M15.8 11.6h.1M17.8 13.4h.1"/>'),
      planta: trazo('<path d="M12 21v-9"/><path d="M12 13C12 8.5 9 6 4.5 6c0 4.5 3 7 7.5 7Z"/><path d="M12 11c0-4 2.6-6.4 7-6.4 0 4-2.6 6.4-7 6.4Z"/>'),
      mas: trazo('<path d="M6 12h.01M12 12h.01M18 12h.01"/>', 3),
      historia: trazo('<path d="M12.1 3.5c-2.7 4-5.9 7.3-6 11.2-.1 3.4 2.6 5.8 6 5.8 3.5 0 6-2.5 5.9-5.9-.1-3.8-3.3-7.2-5.9-11.1z"/>'),
      impacto: trazo('<path d="M4 20h16"/><path d="M7 20v-6M12 20V8M17 20v-9"/>'),
      contacto: trazo('<path d="M4.1 6.4c5.3-.5 10.4-.4 15.8 0 .3 3.7.3 7.4 0 11.2-5.3.4-10.5.4-15.8 0-.3-3.7-.3-7.5 0-11.2z"/><path d="M4.6 7.6c2.7 2.1 5.2 3.9 7.5 5.4 2.5-1.5 5-3.2 7.5-5.4"/>'),
      inicio: trazo('<path d="M12 21c-4.4-2.6-7.2-5.6-7.2-9.4C4.8 8.6 7 6.5 9.6 6.5c1.1 0 2 .4 2.4 1 .4-.6 1.3-1 2.4-1 2.6 0 4.8 2.1 4.8 5.1 0 3.8-2.8 6.8-7.2 9.4z"/>')
    };
    const principales = [
      ['/paginas/menu.html', 'Menú', 'menu'],
      ['/paginas/guia.html', 'Guía', 'guia'],
      ['/paginas/comunidad.html', 'Comunidad', 'comunidad'],
      ['/paginas/minijuegos.html', 'Juegos', 'juegos'],
      ['/paginas/mi-planta.html', 'Mi planta', 'planta']
    ];
    const extra = [
      ['/paginas/informacion.html', 'Historia', 'historia'],
      ['/paginas/impacto.html', 'Nuestro impacto', 'impacto'],
      ['/paginas/contacto.html', 'Contacto', 'contacto'],
      ['/index.html', 'Pantalla de inicio', 'inicio']
    ];
    const esActual = function (href) { return limpio(href) === actual || (href === '/paginas/minijuegos.html' && actual.indexOf('juego-') === 0); };
    const enMas = extra.some(function (item) { return esActual(item[0]); });
    const nav = document.createElement('nav');
    nav.className = 'nav-movil';
    nav.setAttribute('aria-label', 'Secciones');
    nav.innerHTML = principales.map(function (principale) { return '<a href="' + principale[0] + '"' + (esActual(principale[0]) ? ' class="actual" aria-current="page"' : '') + '>' + ICONOS[principale[2]] + '<span>' + principale[1] + '</span></a>'; }
    ).join('') +
      '<button type="button" class="nav-mas' + (enMas ? ' actual' : '') + '" aria-expanded="false" aria-controls="hojaMas">' + ICONOS.mas + '<span>Más</span></button>';
    const hoja = document.createElement('div');
    hoja.className = 'hoja-mas';
    hoja.id = 'hojaMas';
    hoja.hidden = true;
    hoja.innerHTML = extra.map(function (item) { return '<a href="' + item[0] + '"' + (esActual(item[0]) ? ' class="actual" aria-current="page"' : '') + '>' + ICONOS[item[2]] + '<span>' + item[1] + '</span></a>'; }
    ).join('');
    document.body.appendChild(hoja);
    document.body.appendChild(nav);
    document.body.classList.add('con-nav');
    const boton = nav.querySelector('.nav-mas');
    const cerrar = function () { hoja.hidden = true; boton.setAttribute('aria-expanded', 'false'); };
    boton.addEventListener('click', function (ev) {
      ev.stopPropagation();
      const abrir = hoja.hidden;
      hoja.hidden = !abrir;
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    document.addEventListener('click', function (ev) { if (!hoja.hidden && !hoja.contains(ev.target)) cerrar(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrar(); });
  }
  const NOMBRES_SONIDO = ['correcto', 'incorrecto', 'ganar', 'perder'];
  const sonidos = {};
  function precargarSonidos() {
    NOMBRES_SONIDO.forEach(function (nombre) {
      if (sonidos[nombre]) return;
      try {
        const valor = new Audio('/assets/sonidos/' + nombre + '.mp3');
        valor.preload = 'auto';
        valor.volume = 0.75;
        sonidos[nombre] = valor;
      } catch (err) {}
    });
  }
  function reproducir(nombre) {
    try {
      if (!sonidos[nombre]) precargarSonidos();
      const valor = sonidos[nombre];
      if (!valor) return;
      valor.currentTime = 0;
      const promesa = valor.play();
      if (promesa && promesa.catch) promesa.catch(function () {});
    } catch (err) {}
  }
  function usuarioDesdeNombre(nombre) {
    if (!nombre) return '@usuario';
    const base = nombre
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('.');
    return '@' + (base || 'usuario');
  }
  const PALETA_AVATAR = ['av-1', 'av-2', 'av-3', 'av-4', 'av-5', 'av-6'];
  function colorAvatar(texto) {
    const texto2 = (texto || '').toString();
    let hash = 0;
    for (let i = 0; i < texto2.length; i++) hash = (hash * 31 + texto2.charCodeAt(i)) >>> 0;
    return PALETA_AVATAR[hash % PALETA_AVATAR.length];
  }
  function esInvitado() {
    try {
      const datos = localStorage.getItem('bionyssa_sesion');
      return !datos;
    } catch (err) {
      return true;
    }
  }
  let modalListo = false;
  function inyectarModalAuth() {
    if (modalListo) return;
    modalListo = true;
    const overlay = document.createElement('div');
    overlay.id = 'modalAuth';
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-card">' +
        '<button type="button" class="modal-close" aria-label="Cerrar">✕</button>' +
        '<span class="modal-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12.2 19.9C7.5 16.3 4.2 13.4 4.1 9.8c-.1-2.4 1.6-4.3 4-4.3 1.6 0 3 .9 3.9 2.5.9-1.6 2.4-2.6 4.1-2.5 2.3.1 3.9 2 3.8 4.4-.2 3.5-3.5 6.4-7.7 10z"/></g></svg></span>' +
        '<h3>Crear mi cuenta</h3>' +
        '<p id="modalAuthMsg">Crea tu cuenta o inicia sesión para dar like, comentar y publicar en la comunidad.</p>' +
        '<div class="modal-actions">' +
          '<a href="/paginas/registro.html" class="btn btn-primary">Crear cuenta</a>' +
          '<a href="/paginas/login.html" class="btn btn-outline">Iniciar sesión</a>' +
        '</div>' +
        '<button type="button" class="modal-dismiss">Seguir explorando</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', ocultarModalAuth);
    overlay.querySelector('.modal-dismiss').addEventListener('click', ocultarModalAuth);
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) ocultarModalAuth();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') ocultarModalAuth();
    });
  }
  function mostrarModalAuth(mensaje) {
    inyectarModalAuth();
    if (mensaje) document.getElementById('modalAuthMsg').textContent = mensaje;
    document.getElementById('modalAuth').classList.add('show');
  }
  function ocultarModalAuth() {
    const overlay = document.getElementById('modalAuth');
    if (overlay) overlay.classList.remove('show');
  }
  let dialogoAbierto = null;
  function dialogo(opciones) {
    const copia = Object.assign({ titulo: 'Aviso', mensaje: '', boton: 'Entendido', tipo: 'info' }, opciones || {});
    return new Promise(function (resolver) {
      if (dialogoAbierto) dialogoAbierto(false);
      const previo = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay dialogo-overlay';
      const iconos = {
        info: '<path d="M12 8.2h.01M11.2 11.4h.8v4.6h.8"/><circle cx="12" cy="12" r="8.6"/>',
        ok: '<circle cx="12" cy="12" r="8.6"/><path d="M8.4 12.4l2.6 2.6 4.8-5.4"/>',
        error: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.8v5M12 16.2h.01"/>'
      };
      overlay.innerHTML =
        '<div class="modal-card dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogoTitulo" aria-describedby="dialogoMsg">' +
          '<span class="modal-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (iconos[copia.tipo] || iconos.info) + '</g></svg></span>' +
          '<h3 id="dialogoTitulo"></h3>' +
          '<p id="dialogoMsg"></p>' +
          '<div class="modal-actions"></div>' +
        '</div>';
      overlay.querySelector('h3').textContent = copia.titulo;
      overlay.querySelector('p').textContent = copia.mensaje;
      const acciones = overlay.querySelector('.modal-actions');
      function boton(texto, clase, valor) {
        const boton2 = document.createElement('button');
        boton2.type = 'button'; boton2.className = 'btn ' + clase; boton2.textContent = texto;
        boton2.addEventListener('click', function () { return cerrar(valor); });
        acciones.appendChild(boton2);
        return boton2;
      }
      const principal = boton(copia.boton, 'btn-primary', true);
      if (copia.cancelar) boton(copia.cancelar, 'btn-outline', false);
      function alTeclado(ev) {
        if (ev.key === 'Escape') cerrar(false);
      }
      function cerrar(valor) {
        document.removeEventListener('keydown', alTeclado);
        dialogoAbierto = null;
        overlay.classList.remove('show');
        setTimeout(function () { return overlay.remove(); }, 220);
        if (previo && previo.focus) previo.focus();
        resolver(valor);
      }
      dialogoAbierto = cerrar;
      overlay.addEventListener('click', function (ev) { if (ev.target === overlay) cerrar(false); });
      document.addEventListener('keydown', alTeclado);
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('show'); principal.focus(); });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('etapaJuego') || document.getElementById('tablero')) precargarSonidos();
    inyectarToggleEnTopbar();
    inyectarNavEscritorio();
    inyectarNavMovil();
    enlazarBotonesTema();
    temaDeCuenta();
    document.addEventListener('bio-nube-listo', temaDeCuenta);
  });
  return {
    aplicarTema,
    alternarTema,
    reproducir,
    usuarioDesdeNombre,
    colorAvatar,
    esInvitado,
    mostrarModalAuth,
    ocultarModalAuth,
    dialogo,
  };
})();
(function () {
  let temporizador;
  window.BioToast = function (texto) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.add('show');
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { return el.classList.remove('show'); }, 2400);
  };
  const cabecera = document.querySelector('.topbar, .home-header');
  const arriba = function () { return scrollTo({ top: 0, behavior: 'smooth' }); };
  let subir = null;
  if (!document.querySelector('.pantalla-juego')) {
    subir = document.createElement('button');
    subir.type = 'button';
    subir.className = 'subir-fab';
    subir.setAttribute('aria-label', 'Volver arriba');
    subir.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    subir.addEventListener('click', arriba);
    document.body.appendChild(subir);
  }
  let esperando = false;
  function alDesplazar() {
    if (esperando) return;
    esperando = true;
    requestAnimationFrame(function () {
      const valor = scrollY;
      if (cabecera) cabecera.classList.toggle('scrolled', valor > 8);
      if (subir) subir.classList.toggle('show', valor > Math.min(innerHeight * 0.8, 160));
      esperando = false;
    });
  }
  addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
  document.querySelectorAll('a[href="#"].pie-subir').forEach(function (item) {
    item.addEventListener('click', function (ev) { ev.preventDefault(); arriba(); });
  });
})();
(function () {
  const suave = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elem = function (estado, raiz) { return (raiz || document).querySelector(estado); };
  function hojas(extra, otro, numero) {
    if (suave) return;
    for (let i = 0; i < Math.min(numero, 4); i++) {
      const icono = document.createElement('i');
      const ang = Math.random() * 6.28;
      const dist = 30 + Math.random() * 40;
      icono.className = 'hoja-vuela';
      icono.style.cssText = `left:${extra}px;top:${otro}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 30}px;--rot:${Math.random() * 400 - 200}deg`;
      document.body.appendChild(icono);
      setTimeout(function () { return icono.remove(); }, 1050);
    }
  }
  window.BioHojas = hojas;
  const hora = new Date().getHours();
  document.documentElement.setAttribute('data-hora', hora >= 7 && hora < 18 ? 'dia' : 'noche');
  function portada() {
    const fig = elem('.home-figure');
    if (!fig) return;
    const svg = elem('svg', fig);
    let riegos = 0;
    addEventListener('mousemove', function (ev) {
      const estilo = document.documentElement.style;
      estilo.setProperty('--mx', (ev.clientX / innerWidth - 0.5).toFixed(3));
      estilo.setProperty('--my', (ev.clientY / innerHeight - 0.5).toFixed(3));
    }, { passive: true });
    function gotas() {
      const resultado = svg.getBoundingClientRect();
      const valor = fig.getBoundingClientRect();
      for (let i = 0; i < 7; i++) {
        setTimeout(function () {
          const icono = document.createElement('i');
          icono.className = 'gota-real';
          icono.style.cssText = `left:${resultado.left - valor.left + resultado.width * (0.3 + Math.random() * 0.3)}px;top:${resultado.top - valor.top + resultado.height * 0.1}px;--cae:${resultado.height * 0.58}px`;
          fig.appendChild(icono);
          setTimeout(function () { return icono.remove(); }, 950);
        }, i * 90);
      }
    }
    function flor() {
      const elem2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      elem2.setAttribute('class', 'flor-hero');
      let petalos = '';
      for (let k = 0; k < 6; k++) petalos += `<ellipse cx="232" cy="118" rx="7" ry="13" fill="#e9a23b" transform="rotate(${k * 60} 232 128)"/>`;
      elem2.innerHTML = petalos + '<circle cx="232" cy="128" r="7" fill="#b87036"/>';
      svg.appendChild(elem2);
      const valor = svg.getBoundingClientRect();
      hojas(valor.left + valor.width / 2, valor.top, 16);
      if (window.BioPuntos) BioPuntos.dar(3, 'floreció');
    }
    svg.addEventListener('click', function () {
      gotas();
      if (riegos < 5) {
        riegos++;
        [fig, svg, elem('.il-planta', svg)].filter(Boolean).forEach(function (el) { return el.style.setProperty('--crece', 1 + riegos * 0.07); });
      }
      if (riegos === 5 && !elem('.flor-hero', svg)) flor();
    });
  }
  function secreto() {
    if (suave) return;
    let letras = '';
    addEventListener('keydown', function (ev) {
      if (/input|textarea/i.test(ev.target.tagName)) return;
      letras = (letras + ev.key.toLowerCase()).slice(-6);
      if (letras !== 'planta') return;
      for (let i = 0; i < 40; i++) {
        setTimeout(function () {
          const icono = document.createElement('i');
          icono.className = 'lluvia-hojas';
          icono.style.cssText = `left:${Math.random() * 100}vw;--dx:${Math.random() * 120 - 60}px;animation-duration:${2.5 + Math.random() * 2.5}s`;
          document.body.appendChild(icono);
          setTimeout(function () { return icono.remove(); }, 5200);
        }, Math.random() * 1800);
      }
      if (window.BioToast) BioToast('Encontraste el secreto');
    });
  }
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('.btn-primary') && !ev.target.closest('.regar')) hojas(ev.clientX, ev.clientY, 6);
  });
  portada();
  secreto();
})();
(function () {
  const elem = function (estado, raiz) { return (raiz || document).querySelector(estado); };
  const LLAVE = 'bionyssa_puntos';
  const NIVELES = [['Semilla', 0], ['Brote', 30], ['Planta', 80], ['Árbol', 160]];
  const GANA = [
    ['+1', 'Entrar a BioNyssa cada día'],
    ['+5', 'Terminar una partida en Minijuegos'],
    ['+5', 'Anotar un riego en Mi planta'],
    ['+3', 'Regar y hacer florecer la planta de la portada']
  ];
  const leer = function () { try { return JSON.parse(localStorage.getItem(LLAVE)) || { p: 0, dia: '' }; } catch (err) { return { p: 0, dia: '' }; } };
  const guardar = function (datos) { try { localStorage.setItem(LLAVE, JSON.stringify(datos)); } catch (err) {} };
  const nivel = function (dato) { return NIVELES.reduce(function (mejor, elemento, k) { return dato >= elemento[1] ? k : mejor; }, 0); };
  const listaGana = function () { return '<ul class="gana-lista">' + GANA.map(function (item) { return '<li><b>' + item[0] + '</b><span>' + item[1] + '</span></li>'; }).join('') + '</ul>'; };
  function avance(dato) {
    const i = nivel(dato);
    const sig = NIVELES[i + 1];
    return { i, sig, pct: sig ? (dato - NIVELES[i][1]) / (sig[1] - NIVELES[i][1]) * 100 : 100 };
  }
  function pintar() {
    const { p } = leer();
    const { i, sig, pct } = avance(p);
    document.querySelectorAll('.puntos-chip').forEach(function (item) {
      item.lastChild.innerHTML = '<em>' + NIVELES[i][0] + ' | </em>' + p + ' pts';
    });
    const barra = elem('.nivel-barra b');
    if (!barra) return;
    barra.style.width = pct + '%';
    const txt = elem('#nivelTxt');
    if (txt) txt.textContent = sig ? 'Te faltan ' + (sig[1] - p) + ' puntos para ser ' + sig[0] + '.' : 'Llegaste al máximo. Eres un árbol.';
    document.querySelectorAll('.nivel-lista span').forEach(function (item, k) { return item.classList.toggle('ok', k <= i); });
  }
  window.BioPuntos = {
    dar(numero, motivo) {
      const valor = leer();
      const antes = nivel(valor.p);
      valor.p += numero;
      guardar(valor);
      pintar();
      document.querySelectorAll('.puntos-chip').forEach(function (item) {
        item.classList.remove('sube');
        void item.offsetWidth;
        item.classList.add('sube');
      });
      const ahora = nivel(valor.p);
      if (window.BioToast) BioToast(ahora > antes ? '¡Subiste a ' + NIVELES[ahora][0] + '!' : '+' + numero + ' pts' + (motivo ? ' | ' + motivo : ''));
    }
  };
  function chip() {
    const fila = elem('.head-cta') || elem('.topbar-row');
    if (!fila || elem('.home-header')) return;
    const enlace = document.createElement('a');
    enlace.className = 'puntos-chip';
    enlace.href = '/paginas/menu.html';
    enlace.innerHTML = '<i></i><span></span>';
    const alInicio = fila.firstChild.classList && fila.classList.contains('head-cta');
    fila.insertBefore(enlace, alInicio ? fila.firstChild : elem('.theme-toggle', fila));
  }
  function tarjetaMenu() {
    const rejilla = elem('.menu-grid');
    if (!rejilla) return;
    const caja = document.createElement('div');
    caja.className = 'nivel-card';
    const sesion = window.BioSesion && BioSesion.obtener();
    caja.innerHTML = '<h3>Tu nivel</h3><p id="nivelTxt"></p><div class="nivel-barra"><b></b></div><div class="nivel-lista">' +
      NIVELES.map(function (item) { return '<span>' + item[0] + '</span>'; }).join('') + '</div><h4 class="gana-tit">Cómo ganar puntos</h4>' + listaGana() +
      '<p class="gana-nota">' + (sesion ? 'Tus puntos se guardan en tu cuenta.' : 'Como invitado, los puntos se quedan en este dispositivo. Crea una cuenta para no perderlos.') + '</p>';
    rejilla.parentNode.insertBefore(caja, rejilla.nextSibling);
  }
  function ventana() {
    const valor = elem('.puntos-chip');
    if (!valor) return;
    const enMenu = !!elem('.nivel-card');
    const pop = document.createElement('div');
    pop.className = 'puntos-pop';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Cómo funcionan los puntos');
    document.body.appendChild(pop);
    valor.setAttribute('aria-haspopup', 'dialog');
    valor.setAttribute('aria-expanded', 'false');
    valor.title = 'Cómo funcionan los puntos';
    function llenar() {
      const { p } = leer();
      const { i, sig, pct } = avance(p);
      pop.innerHTML = '<strong class="pp-nivel">Tu nivel: ' + NIVELES[i][0] + '</strong>' +
        '<p class="pp-sub">' + p + ' pts | ' + (sig ? 'te faltan ' + (sig[1] - p) + ' para ser ' + sig[0] + '.' : 'llegaste al máximo.') + '</p>' +
        '<div class="pp-barra"><b style="width:' + pct + '%"></b></div>' +
        '<h4>Cómo ganar puntos</h4>' + listaGana() +
        '<p class="pp-niveles">' + NIVELES.map(function (item) { return item[0] + ' ' + item[1]; }).join(' | ') + '</p>' +
        (enMenu ? '' : '<a class="pp-link" href="/paginas/menu.html">Ver mi nivel en el menú</a>');
    }
    function colocar() {
      const resultado = valor.getBoundingClientRect();
      const ancho = pop.offsetWidth;
      pop.style.top = (resultado.bottom + 10) + 'px';
      pop.style.left = Math.max(12, Math.min(resultado.right - ancho, innerWidth - ancho - 12)) + 'px';
    }
    function cerrar() {
      pop.hidden = true;
      valor.setAttribute('aria-expanded', 'false');
    }
    valor.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!pop.hidden) return cerrar();
      llenar();
      pop.hidden = false;
      colocar();
      valor.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', function (ev) {
      if (!pop.hidden && !ev.target.closest('.puntos-pop') && !ev.target.closest('.puntos-chip')) cerrar();
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrar(); });
    addEventListener('resize', cerrar);
  }
  chip();
  const hoy = new Date().toDateString();
  const d0 = leer();
  if (d0.dia !== hoy) {
    d0.dia = hoy;
    guardar(d0);
    setTimeout(function () { return BioPuntos.dar(1, 'visita del día'); }, 900);
  }
  tarjetaMenu();
  pintar();
  ventana();
  const guardarOriginal = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, valor) {
    guardarOriginal.call(this, k, valor);
    if (k === 'bionyssa_progreso') setTimeout(function () { return BioPuntos.dar(5, 'partida jugada'); }, 300);
  };
  document.addEventListener('click', function (ev) {
    const elem2 = ev.target.closest('#bRiego');
    if (!elem2 || elem2.disabled) return;
    setTimeout(function () {
      BioPuntos.dar(5, 'riego');
      if (window.BioHojas) BioHojas(ev.clientX, ev.clientY, 8);
    }, 60);
  });
})();
(function () {
  const elem = function (estado, raiz) { return (raiz || document).querySelector(estado); };
  const fecha = function (dato) { return dato.getFullYear() + '-' + String(dato.getMonth() + 1).padStart(2, '0') + '-' + String(dato.getDate()).padStart(2, '0'); };
  const lee = function (k, base) { try { return JSON.parse(localStorage.getItem(k)) || base; } catch (err) { return base; } };
  const guarda = function (k, datos) { try { localStorage.setItem(k, JSON.stringify(datos)); } catch (err) {} };
  const RETOS = [
    ['Lleva tu bolsa reutilizable', 'Sal con una bolsa de tela o la de BioNyssa y úsala en cada compra de hoy.'],
    ['Di "sin bolsa, gracias"', 'En una compra pequeña, carga las cosas en las manos o en tu mochila.'],
    ['Separa tus residuos', 'Pon orgánicos y reciclables en contenedores distintos durante todo el día.'],
    ['Apaga lo que no uses', 'Luces de cuartos vacíos, pantallas y cargadores conectados sin nada.'],
    ['Cierra la llave', 'Mientras te lavas los dientes o enjabonas los platos, cierra el agua.'],
    ['Toma de una botella rellenable', 'Hoy no compres bebidas en envase de un solo uso.'],
    ['Riega o planta algo', 'Una planta, una semilla o tu BioNyssa. Cinco minutos bastan.'],
    ['Reutiliza un frasco o una bolsa', 'Dale una segunda vida a algo que ibas a tirar.'],
    ['Camina un trayecto corto', 'Si vas a menos de diez minutos a pie, deja el vehículo.'],
    ['Come sin desechables', 'Plato, vaso y cubiertos de los que se lavan.'],
    ['Lleva tu propio recipiente', 'Para la comida de la calle o las sobras, usa uno tuyo.'],
    ['Junta botellas PET', 'Reúne las que tengas en casa para llevarlas a reciclar.'],
    ['Compra sin empaque', 'Elige fruta y verdura suelta en lugar de la envasada.'],
    ['Usa las dos caras de la hoja', 'Antes de tirar un papel, revisa si tiene lado en blanco.'],
    ['Cuéntale a alguien de BioNyssa', 'Explícale a una persona cómo una bolsa puede volverse planta.'],
    ['Báñate un poco más rápido', 'Reduce la regadera un par de minutos.'],
    ['Arregla antes de tirar', 'Una costura, un cierre, un tornillo. Intenta repararlo.'],
    ['Recoge cinco basuras', 'Levanta cinco residuos que encuentres en la calle o el parque.'],
    ['Guarda las cáscaras', 'Sepáralas para composta en lugar de mezclarlas con la basura.'],
    ['Sin popote hoy', 'Pide tus bebidas sin popote o usa uno reutilizable.'],
    ['Lleva tu termo', 'Que tu café o tu agua viaje en tu propio vaso.'],
    ['Revisa si hay fugas', 'Mira llaves y regaderas. Una gota constante desperdicia mucha agua.'],
    ['Regala lo que ya no uses', 'Ropa, libros o juguetes que a otra persona le sirvan.'],
    ['Planea tus comidas', 'Decide qué vas a comer hoy para no desperdiciar comida.'],
    ['Lee la etiqueta', 'Escoge el producto con menos plástico entre dos parecidos.'],
    ['Comparte un consejo', 'Publica en Comunidad algo que te funcione para cuidar el ambiente.'],
    ['Aprende un dato nuevo', 'Juega un minijuego y quédate con un dato que no sabías.'],
    ['Aprovecha el agua de lavar', 'La de lavar verduras sirve para regar plantas.'],
    ['Desenchufa y sal', 'Antes de salir de casa, desconecta lo que no hace falta.'],
    ['Elige lo que dure', 'Hoy, si compras algo, prefiere lo que se puede usar muchas veces.']
  ];
  function guia() {
    const caja = elem('#acordeon');
    if (!caja) return;
    const LLAVE = 'bionyssa_guia';
    const pasos = [...caja.querySelectorAll('.acc-item')];
    const hechos = lee(LLAVE, []);
    const prog = document.createElement('div');
    prog.className = 'guia-prog';
    prog.innerHTML = '<p></p><div class="nivel-barra"><b></b></div>';
    caja.parentNode.insertBefore(prog, caja);
    const barra = elem('b', prog);
    function pintar() {
      const cantidad = hechos.filter(Boolean).length;
      elem('p', prog).textContent = cantidad + ' de ' + pasos.length + ' pasos hechos';
      barra.style.width = cantidad / pasos.length * 100 + '%';
      pasos.forEach(function (paso, i) {
        paso.classList.toggle('hecho', !!hechos[i]);
        const valor = elem('.hacer-paso', paso);
        if (valor) valor.textContent = hechos[i] ? 'Desmarcar paso' : 'Ya hice este paso';
      });
    }
    pasos.forEach(function (paso, i) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-outline btn-sm hacer-paso';
      elem('.acc-panel-inner', paso).appendChild(boton);
      boton.addEventListener('click', function (ev) {
        hechos[i] = !hechos[i];
        guarda(LLAVE, hechos);
        pintar();
        if (!hechos[i]) return;
        if (window.BioHojas) BioHojas(ev.clientX, ev.clientY, 10);
        if (window.BioPuntos) {
          const todos = hechos.filter(Boolean).length === pasos.length;
          BioPuntos.dar(todos ? 10 : 2, todos ? 'guía completa' : 'paso hecho');
        }
      });
    });
    setTimeout(function () { barra.style.width = '0'; pintar(); }, 50);
  }
  function retoDelDia() {
    const panel = elem('.timeline-panel');
    if (!panel) return;
    const tarjeta = document.createElement('div');
    tarjeta.className = 'section-card calc-card';
    panel.parentNode.insertBefore(tarjeta, panel);
    const caja = document.createElement('div');
    caja.className = 'reto-dia';
    tarjeta.appendChild(caja);
    const LLAVE = 'bionyssa_retos';
    let datos = lee(LLAVE, null);
    if (!datos || !datos.dias) datos = { dias: [], pts: [] };
    const hoy = new Date();
    const hoyTxt = fecha(hoy);
    const desde2026 = Math.round((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
    const reto = RETOS[((desde2026 * 7) % RETOS.length + RETOS.length) % RETOS.length];
    function racha() {
      let numero = 0;
      const fecha2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      if (!datos.dias.includes(fecha(fecha2))) fecha2.setDate(fecha2.getDate() - 1);
      while (datos.dias.includes(fecha(fecha2))) { numero++; fecha2.setDate(fecha2.getDate() - 1); }
      return numero;
    }
    function semana() {
      const LETRAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const fecha2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
        html += '<span class="rd-dia' + (datos.dias.includes(fecha(fecha2)) ? ' on' : '') + (i === 0 ? ' hoy' : '') + '"><i></i>' + LETRAS[fecha2.getDay()] + '</span>';
      }
      return html;
    }
    function pintar() {
      const hecho = datos.dias.includes(hoyTxt);
      const nr = racha();
      caja.innerHTML = '<div class="reto-dia-top"><h3>Reto de hoy</h3><span class="rd-fecha">' + hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) + '</span></div>' +
        '<div class="rd-cuerpo' + (hecho ? ' hecho' : '') + '"><div class="rd-txt"><strong>' + reto[0] + '</strong><span>' + reto[1] + '</span></div>' +
        '<button type="button" class="btn ' + (hecho ? 'btn-outline' : 'btn-primary') + '" id="rdBtn">' + (hecho ? 'Hecho. Deshacer' : 'Lo hice') + '</button></div>' +
        '<div class="rd-pie"><div class="rd-semana" aria-label="Últimos 7 días">' + semana() + '</div><p class="rd-stats"><b>' + nr + '</b> ' + (nr === 1 ? 'día seguido' : 'días seguidos') + ' · <b>' + datos.dias.length + '</b> en total</p></div>' +
        '<small>Mañana habrá otro reto. Cada uno que completes por primera vez ese día suma 3 puntos.</small>';
      elem('#rdBtn', caja).addEventListener('click', function () {
        const i = datos.dias.indexOf(hoyTxt);
        if (i > -1) datos.dias.splice(i, 1);
        else {
          datos.dias.push(hoyTxt);
          if (!datos.pts.includes(hoyTxt)) {
            datos.pts.push(hoyTxt);
            if (window.BioPuntos) BioPuntos.dar(3, 'reto del día');
          }
        }
        datos.dias = datos.dias.slice(-60);
        datos.pts = datos.pts.slice(-60);
        guarda(LLAVE, datos);
        pintar();
      });
    }
    pintar();
  }
  function juegoDelDia() {
    const lista = elem('.game-list');
    if (!lista) return;
    const JUEGOS = [['/paginas/juego-trivia.html', 'Trivia: Salva al planeta'], ['/paginas/juego-clasificar.html', 'Limpia el planeta'], ['/paginas/juego-memorama.html', 'Memorama verde']];
    const j = JUEGOS[Math.floor(new Date() / 864e5) % 3];
    const caja = document.createElement('div');
    caja.className = 'reto';
    caja.innerHTML = '<div><h3>Juego del día</h3><p>' + j[1] + '. Juégalo y suma puntos.</p></div><a class="btn btn-primary" href="' + j[0] + '">Jugar</a>';
    lista.parentNode.insertBefore(caja, lista);
  }
  guia();
  retoDelDia();
  juegoDelDia();
})();
var BioSesion = window.BioSesion = (function () {
  const CLAVE = 'bionyssa_sesion';
  function obtener() {
    try {
      const datos = localStorage.getItem(CLAVE);
      return datos ? JSON.parse(datos) : null;
    } catch (err) {
      return null;
    }
  }
  function iniciar(nombre, correo, extra) {
    extra = extra || {};
    const usuario = extra.usuario || (window.BioComun ? BioComun.usuarioDesdeNombre(nombre) : '@usuario');
    const sesion = {
      id: extra.id || ('c_' + String(correo).toLowerCase()),
      nombre: nombre, correo: correo, usuario: usuario,
      proveedor: extra.proveedor || 'correo'
    };
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
    return sesion;
  }
  function cerrar() {
    localStorage.removeItem(CLAVE);
  }
  function entrarInvitado() {
    if (window.BioNube) BioNube.salir();
    localStorage.removeItem(CLAVE);
    if (window.BioAlmacen) BioAlmacen.limpiar('invitado');
  }
  function iniciales(nombre) {
    if (!nombre) return 'B';
    const partes = nombre.trim().split(/\s+/);
    const letras = partes.slice(0, 2).map(function (item) { return item[0].toUpperCase(); });
    return letras.join('') || 'B';
  }
  function pintarSaludo(elementoId) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    const sesion = obtener();
    if (sesion && sesion.nombre) {
      const primerNombre = sesion.nombre.trim().split(/\s+/)[0];
      el.textContent = '¡Hola, ' + primerNombre + '!';
    }
  }
  return { obtener, iniciar, cerrar, entrarInvitado, iniciales, pintarSaludo };
})();
(function () {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', function () {
      navigator.serviceWorker.register('/js/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(function (registro) { return registro.update(); })
        .catch(function () {});
    });
  }
  if (/offline\.html$/.test(location.pathname)) return;
  let preguntando = false;
  async function sinRedReal() {
    try {
      await fetch('/manifest.webmanifest?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(4000) });
      return false;
    } catch (err) { return true; }
  }
  async function preguntar() {
    if (!window.BioComun || !BioComun.dialogo) { preguntando = false; return; }
    const jugar = await BioComun.dialogo({
      titulo: 'Sin conexión',
      mensaje: 'Se fue el internet. Mientras vuelve, hay un juego secreto que solo aparece cuando no hay red. ¿Lo probamos?',
      boton: '¡Jugar!',
      cancelar: 'Seguir aquí'
    });
    preguntando = false;
    if (!jugar) return;
    try { sessionStorage.setItem('bio_volver', location.href); } catch (err) {}
    location.href = '/paginas/offline.html';
  }
  addEventListener('offline', function () {
    setTimeout(async function () {
      if (preguntando || !(await sinRedReal()) || preguntando) return;
      preguntando = true;
      preguntar();
    }, 3000);
  });
})();
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.addEventListener('pointermove', function (evento) {
    const tarjeta = evento.target.closest && evento.target.closest('.menu-card, .game-card');
    if (!tarjeta) return;
    const caja = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty('--mx', (evento.clientX - caja.left) + 'px');
    tarjeta.style.setProperty('--my', (evento.clientY - caja.top) + 'px');
  }, { passive: true });
})();
 } catch (err) { console.error(err); }
}

// filtro
if (['comunidad', 'login', 'recuperar', 'registro'].indexOf(paginaActual) > -1) {
 try {
window.BioModera = (function () {
  const texto2 = function (texto) { return texto.trim().split(/\s+/); };
  const PALABRAS = texto2(`
    puta putas puto putos putita putito putazo putear puteada puteria putisima putamadre
    pendejo pendeja pendejos pendejas pendejada pendejadas pendejete
    cabron cabrona cabrones cabronazo
    chinga chingar chingada chingado chingados chingadera chingaderas chingon chingona chingones chingo chingas chingue chingatumadre
    culero culera culeros culeras culo culos culiao culiado
    verga vergas vergon vergota vergazo
    mierda mierdas mierdero
    hijueputa hijoeputa hijodeputa hijadeputa hijoputa malparido malparida gonorrea
    maricon maricones marica maricas marika joto jotos marimacha machorra sudaca
    zorra zorras follar follame folla joder jodete jodido jodida jodidos
    conyo conyos carajo carajos pinche pinches punyeta punyetas
    mamada mamadas mamon mamona mamones huevon huevona huevones
    gilipollas gilipolla capullo cojones tetas pene penes vagina porno porn pornografia
    idiota idiotas imbecil imbeciles estupido estupida estupidos retrasado retrasada subnormal mongolico
    cagar cagada cagadas cagon cagones pelotudo pelotuda boludo boluda
    hdp ptm ctm chtm lpm hdlgp
    fuck fucks fucker fuckers fucking fucked fuckin fck fuk fuq fuc fucc motherfucker motherfuckers motherfucking
    shit shits shitty shitting bullshit horseshit dipshit shithead shitface shitshow
    bitch bitches bitchy bitchass asshole assholes ass arse arsehole
    dick dicks dickhead cock cocks cocksucker pussy pussies cunt cunts whore whores slut sluts skank
    bastard bastards twat wanker bollocks prick douche douchebag jackass dumbass
    nigger niggers nigga niggas faggot faggots fag dyke tranny retard retarded chink spic kike gook wetback paki
    nude nudes hentai boobs tits titties penis dildo blowjob handjob cumshot jizz
    wtf stfu kys rapist pedophile paedophile pedofilo pedofilia
    caralho caralhos foda fodase foder fodido buceta bucetas cuzao viado merda babaca otario arrombado arrombada
    vagabunda punheta cacete filhodaputa fdp vsf pqp
    merde putain pute putes connard connards connasse salope salopes encule enculer enculee nique niquer niktamere ntm
    couille couilles batard batards foutre bordel branleur
    scheisse scheiss scheisskerl arschloch arsch wichser fotze fotzen hurensohn schlampe ficken fickdich kacke nutte hure schwuchtel spast
    cazzo cazzi stronzo stronza stronzi vaffanculo fanculo puttana puttane minchia coglione coglioni pompino bastardo frocio
    blyat blyad blya pidor pidar pidoras pizda pizdec yebat ebat mudak gandon zalupa
    orospu siktir sikerim yarrak amk amina gotveren
    kurwa kurwy pierdol pierdolic jebac jebany chuj skurwysyn
    madarchod behenchod bhenchod chutiya chutiye gandu randi bhosdi bhosdike harami
    klootzak godverdomme mongool
    putangina tangina
    sharmouta sharmuta kosomak
  `);
  const AMBIGUAS = new Set(texto2('dick dicks cock cocks ass fag tits arse'));
  const INOCENTES_PALABRA = new Set(texto2('putto penne mammon mammoth'));
  const SEPARABLES = new Set(texto2(`
    pendejo pendeja pendejos pendejas chingada chingado chingar chingadera cabron cabrona culero culera
    hijueputa hijodeputa hijadeputa hijoeputa gilipollas motherfucker motherfucking asshole bullshit
    cocksucker faggot nigger bastard
  `));
  const FUERTES = texto2(`
    pendej chingad chingar chingon chingatumadre mierd cabron hijueput hijoeput hijodeput hijadeput hijoput putamadre
    maricon gilipoll malparid culiao
    fuck motherfuck bitch asshole arsehole cocksuck dickhead nigger faggot bullshit horseshit dipshit shithead jackass dumbass
    wanker bollock caralho vaffanculo filhodaputa putain kurwa pierdol klootzak arschloch hurensohn wichser scheiss
    madarchod behenchod chutiya orospu siktir skurwysyn
  `);
  const INICIO = texto2('puta puto culo verga porn slut cunt whore pussy tetas');
  const FIN = texto2('puta puto verga porn slut cunt whore pussy');
  const INOCENTES_DENTRO = texto2(`
    shiitake shitake snigger vergara scunthorpe computa computo disputa disputo reputa reputo imputa imputo
  `);
  const FRASES = [
    ' matate ', ' suicidate ', ' muerete ', ' kill yourself ', ' kill your self ', ' go kill yourself ',
    ' te voy a matar ', ' i will kill you ', ' vete a la verga ', ' hijo de tu puta madre '
  ];
  const OTROS_ALFABETOS = [
    'сука', 'суки', 'сучка', 'блядь', 'бляд', 'блять', 'хуй', 'хуе', 'хуя', 'хуё', 'пизд', 'ебат', 'ебан', 'ебал', 'ебуч',
    'пидор', 'пидар', 'педик', 'мудак', 'мудил', 'залуп', 'гондон', 'гандон', 'шлюх', 'дерьмо', 'говно', 'ублюд', 'выеб', 'нахуй', 'курва',
    'μαλακ', 'γαμωτ', 'γαμησ', 'πουτσ', 'πουτανα', 'πουστ', 'αρχιδ', 'σκατα',
    'شرموط', 'عاهر', 'قحب', 'منيوك', 'منيك', 'عرص', 'كسمك', 'كسامك', 'ابنالكلب', 'ابنالشرموطة', 'طيز',
    'मादरचोद', 'बहनचोद', 'भेनचोद', 'चूतिया', 'चुतिया', 'गांडू', 'रंडी', 'हरामी', 'भोसड',
    '操你', '肏', '他妈的', '他媽的', '妈的', '媽的', '傻逼', '傻屄', '煞笔', '草泥马', '草泥馬', '婊子', '狗日', '王八蛋', '鸡巴', '雞巴', '贱人', '賤人', '你妈逼', '妈逼', '卧槽', '臥槽',
    'クソ', '死ね', 'ちんこ', 'ちんぽ', 'まんこ', 'うんこ', 'キチガイ', 'きちがい', 'くたばれ', 'ファック', 'ビッチ',
    '씨발', '씨바', 'ㅅㅂ', '개새끼', '병신', '좆같', '좆까', '지랄', '미친놈', '미친년', '창녀', '느금마',
    'เหี้ย', 'ไอ้เหี้ย', 'ควย', 'địt', 'đéo',
    '🖕'
  ];
  const INVISIBLES = /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0]/g;
  const MARCAS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;
  const PARECIDAS = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's',
    'к': 'k', 'т': 't', 'н': 'h', 'м': 'm', 'в': 'b', 'ӏ': 'l', 'ɑ': 'a', 'α': 'a', 'ο': 'o', 'ρ': 'p',
    'ν': 'v', 'ι': 'i', 'κ': 'k', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ε': 'e', 'β': 'b', 'η': 'n', 'ɡ': 'g',
    'ı': 'i', 'ł': 'l', 'ø': 'o', 'đ': 'd', 'ħ': 'h', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe'
  };
  const NUMEROS = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g' };
  function base(texto) {
    return String(texto || '')
      .replace(INVISIBLES, '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/ñ/g, 'ny')
      .normalize('NFD').replace(MARCAS, '')
      .replace(/[^\x00-\x7f]/g, function (valor) { return PARECIDAS[valor] || valor; });
  }
  function vistas(texto) {
    const valor = base(texto);
    const simbolos = valor.replace(/@/g, 'a').replace(/\$/g, 's').replace(/€/g, 'e');
    const numeros = simbolos.replace(/[013456789]/g, function (dato) { return NUMEROS[dato]; });
    const numerosL = simbolos.replace(/1/g, 'l').replace(/[03456789]/g, function (dato) { return NUMEROS[dato]; })
      .replace(/[!|¡]/g, 'i').replace(/\+/g, 't');
    const raros = numeros.replace(/v/g, 'u').replace(/k/g, 'c');
    return [valor, simbolos, numeros, numerosL, raros];
  }
  function corridas(lista) {
    const letras = [], largos = [];
    for (let i = 0; i < lista.length;) {
      let j = i;
      while (j < lista.length && lista[j] === lista[i]) j++;
      letras.push(lista[i]); largos.push(j - i); i = j;
    }
    return { letras: letras.join(''), largos };
  }
  const colapsar = function (estado) { return corridas(estado).letras; };
  const INDICE = new Map();
  PALABRAS.forEach(function (item) {
    const valor = corridas(item);
    if (!INDICE.has(valor.letras)) INDICE.set(valor.letras, []);
    INDICE.get(valor.letras).push(valor.largos);
  });
  const SEPARABLES_COL = new Set(Array.from(SEPARABLES).map(colapsar));
  function malo(texto, estricto) {
    if (INOCENTES_PALABRA.has(texto)) return false;
    const valor = corridas(texto);
    const candidatas = INDICE.get(valor.letras);
    if (!candidatas) return false;
    if (estricto && AMBIGUAS.has(texto)) return false;
    return candidatas.some(function (largos) { return valor.largos.every(function (largo, i) { return largo >= largos[i]; }); });
  }
  const PLANAS = PALABRAS.filter(function (item) { return item.length >= 4; });
  function mascara(lista) {
    const largo = lista.length;
    return PLANAS.some(function (item) {
      if (item.length !== largo) return false;
      let fijas = 0;
      for (let i = 0; i < largo; i++) {
        if (lista[i] === '*' || lista[i] === '#') continue;
        if (lista[i] !== item[i]) return false;
        fijas++;
      }
      return fijas >= 2 && fijas < largo;
    });
  }
  function ventanas(tokens, estricto) {
    for (let i = 0; i < tokens.length; i++) {
      let junto = '', todasCortas = true, alguna = false;
      for (let j = i; j < tokens.length && j < i + 16; j++) {
        const valor = tokens[j];
        if (valor.length > 6 || /[*#]/.test(valor)) break;
        junto += valor;
        if (valor.length <= 2) alguna = true; else todasCortas = false;
        if (junto.length > 16) break;
        if (j === i || junto.length < 4) continue;
        if (SEPARABLES_COL.has(colapsar(junto))) return true;
        if (todasCortas && malo(junto, estricto)) return true;
        if (alguna && junto.length >= 5 && malo(junto, estricto)) return true;
      }
    }
    return false;
  }
  function pegado(tokens) {
    let plano = tokens.join('').replace(/[*#]/g, '');
    INOCENTES_DENTRO.forEach(function (item) { plano = plano.split(item).join('|'); });
    const col = colapsar(plano);
    if (FUERTES.some(function (item) { return col.includes(colapsar(item)); })) return true;
    if (INICIO.some(function (item) { return col.startsWith(colapsar(item)); })) return true;
    if (FIN.some(function (item) { return col.endsWith(colapsar(item)); })) return true;
    return false;
  }
  function revisarVista(valor, estricto) {
    const tokens = valor.match(/[a-z]+(?:[*#]+[a-z]+)*/g) || [];
    for (const valor2 of tokens) {
      if (/[*#]/.test(valor2)) { if (mascara(valor2)) return true; continue; }
      if (valor2.length >= 3 && malo(valor2, estricto)) return true;
    }
    if (ventanas(tokens, estricto)) return true;
    const frase = ' ' + tokens.join(' ') + ' ';
    if (FRASES.some(function (item) { return frase.includes(item); })) return true;
    if (estricto && pegado(tokens)) return true;
    return false;
  }
  function otrosAlfabetos(texto) {
    const crudo = String(texto || '').replace(INVISIBLES, '').normalize('NFKC').toLowerCase();
    if (crudo.includes('🖕')) return true;
    const limpio = crudo.replace(/[\u064b-\u065f\u0640]/g, '').replace(/[\s\p{P}\p{S}_\d]+/gu, '');
    return OTROS_ALFABETOS.some(function (item) { return limpio.includes(item); });
  }
  function esOfensivo(texto, estricto) {
    if (!texto) return false;
    if (otrosAlfabetos(texto)) return true;
    return vistas(texto).some(function (item) { return revisarVista(item, !!estricto); });
  }
  function revisarTexto(texto, campo) {
    const ofensivo = esOfensivo(texto, campo === 'nombre');
    if (!ofensivo) return { ok: true };
    return {
      ok: false,
      motivo: campo === 'nombre'
        ? 'Ese nombre contiene palabras no permitidas. Elige uno respetuoso.'
        : 'Tu mensaje contiene lenguaje inapropiado. Cámbialo para poder enviarlo.'
    };
  }
  const TF_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  const NSFW_URL = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/browser/nsfwjs.min.js';
  const PERMITIR_SI_FALLA = true;
  let modeloPromesa = null;
  function cargarScript(src) {
    return new Promise(function (res, rej) {
      const script = document.createElement('script');
      script.src = src; script.crossOrigin = 'anonymous'; script.onload = res; script.onerror = function () { script.remove(); rej(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(script);
    });
  }
  function conTiempo(dato, ms, texto) {
    return Promise.race([dato, new Promise(function (_, no) { return setTimeout(function () { return no(new Error(texto)); }, ms); })]);
  }
  async function cargarConReintento(src) {
    try { await cargarScript(src); } catch (err) { await new Promise(function (ok) { return setTimeout(ok, 800); }); await cargarScript(src); }
  }
  function cargarModelo() {
    if (!modeloPromesa) {
      modeloPromesa = conTiempo((async function () {
        if (!window.tf) await cargarConReintento(TF_URL);
        if (!window.nsfwjs) await cargarConReintento(NSFW_URL);
        return window.nsfwjs.load();
      })(), 30000, 'El modelo tardó demasiado en cargar');
      modeloPromesa.catch(function (elemento) { console.error('[moderación] modelo', elemento); modeloPromesa = null; });
    }
    return modeloPromesa;
  }
  async function analizarImagen(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    try { await img.decode(); } catch (err) { console.error('[moderación] imagen', err); throw err; }
    const modelo = await cargarModelo();
    let pred;
    try { pred = await modelo.classify(img); } catch (err2) { console.error('[moderación] clasificar', err2); throw err2; }
    const valor = function (numero) { return (pred.find(function (item) { return item.className === numero; }) || { probability: 0 }).probability; };
    if (valor('Porn') + valor('Hentai') >= 0.45 || valor('Sexy') >= 0.75) {
      return { ok: false, motivo: 'Esa imagen parece contener contenido inapropiado y no se puede subir.' };
    }
    return { ok: true };
  }
  async function revisarImagen(dataUrl) {
    aviso('Revisando la imagen…', 0);
    let resultado;
    try {
      resultado = await analizarImagen(dataUrl);
    } catch (err) {
      if (PERMITIR_SI_FALLA) { ocultarAviso(); return true; }
      aviso('No pudimos verificar la imagen. Revisa tu conexión e inténtalo de nuevo.');
      return false;
    }
    if (!resultado.ok) { aviso(resultado.motivo); return false; }
    ocultarAviso();
    return true;
  }
  let toast = null;
  let temporizador = null;
  function aviso(mensaje, ms) {
    if (!toast) {
      const st = document.createElement('style');
      st.textContent =
        '.bio-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);max-width:min(92vw,420px);' +
        'background:#3d4726;color:#fcfbf6;padding:12px 18px;border-radius:12px;font:600 .9rem/1.4 Karla,system-ui,sans-serif;' +
        'box-shadow:0 12px 30px -10px rgba(0,0,0,.5);opacity:0;visibility:hidden;transition:all .2s ease;z-index:1200;text-align:center}' +
        '.bio-toast.show{opacity:1;visibility:visible;transform:translate(-50%,0)}' +
        '.bio-toast.error{background:#b87036}';
      document.head.appendChild(st);
      toast = document.createElement('div');
      toast.className = 'bio-toast';
      toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);
    }
    clearTimeout(temporizador);
    toast.textContent = mensaje;
    toast.classList.toggle('error', ms !== 0);
    toast.classList.add('show');
    if (ms !== 0) temporizador = setTimeout(ocultarAviso, ms || 4500);
  }
  function ocultarAviso() {
    if (toast) toast.classList.remove('show');
  }
  function precargar() { cargarModelo().catch(function () {}); }
  return { revisarTexto, esOfensivo, revisarImagen, aviso, ocultarAviso, precargar };
})();
 } catch (err) { console.error(err); }
}

// cuentas
if (['login', 'registro'].indexOf(paginaActual) > -1) {
 try {
window.BioCuentas = (function () {
  const LLAVE = 'bionyssa_cuentas';
  const limpio = function (valor) { return String(valor || '').trim().toLowerCase(); };
  const pausa = function (ms, valor) { return new Promise(function (ok) { return setTimeout(function () { return ok(valor); }, ms); }); };
  function todas() {
    try { return JSON.parse(localStorage.getItem(LLAVE)) || {}; } catch (err) { return {}; }
  }
  function guardar(cuentas) {
    localStorage.setItem(LLAVE, JSON.stringify(cuentas));
  }
  function porCorreo(correo) {
    const valor = limpio(correo);
    return Object.values(todas()).find(function (item) { return item.correo === valor; }) || null;
  }
  function usuarioLibre(nombre, idPropio) {
    const usados = new Set(Object.values(todas()).filter(function (item) { return item.id !== idPropio; }).map(function (item) { return item.usuario; }));
    const base = BioComun.usuarioDesdeNombre(nombre);
    let valor = base, numero = 1;
    while (usados.has(valor)) valor = base + ++numero;
    return valor;
  }
  function crear(llave, id, nombre, correo, proveedor) {
    const cuentas = todas();
    const cuenta = { id, nombre, correo, usuario: usuarioLibre(nombre, id), proveedor, creado: Date.now() };
    cuentas[llave] = cuenta;
    guardar(cuentas);
    return cuenta;
  }
  function abrirSesion(cuenta, extra) {
    BioSesion.iniciar(cuenta.nombre, cuenta.correo, Object.assign({ id: cuenta.id, usuario: cuenta.usuario }, extra));
  }
  async function conectarNube() {
    if (!(window.BioNube && BioNube.configurado())) return;
    await Promise.race([BioNube.activar({ sinRecargar: true, sinAviso: true }), pausa(1200)]);
  }
  function pasarInvitado(id) {
    if (window.BioAlmacen && BioAlmacen.pasarInvitado) BioAlmacen.pasarInvitado(id);
  }
  async function registrar({ nombre, correo, clave }) {
    const valor = limpio(correo);
    const yaExiste = { ok: false, existe: true, motivo: 'Ese correo ya tiene cuenta. Inicia sesión.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return { ok: false, motivo: 'Escribe un correo válido.' };
    if (porCorreo(valor)) return yaExiste;
    const nube = await BioFirebase.sincronizar(valor, clave, nombre);
    if (nube.codigo === 'existe') return yaExiste;
    if (!nube.ok) return { ok: false, motivo: 'No pudimos crear la cuenta. Revisa tu internet e inténtalo otra vez.' };
    const cuenta = crear(valor, 'c_' + valor, nombre, valor, 'correo');
    abrirSesion(cuenta);
    pasarInvitado(cuenta.id);
    await conectarNube();
    return { ok: true, cuenta };
  }
  async function entrar(correo, clave) {
    const valor = limpio(correo);
    let cuenta = porCorreo(valor);
    if (cuenta && cuenta.proveedor === 'google') {
      return { ok: false, motivo: 'Esa cuenta entra con Google. Usa el botón de Google.' };
    }
    const nube = await BioFirebase.entrar(valor, clave);
    if (!nube) {
      return cuenta
        ? { ok: false, motivo: 'La contraseña no es correcta.' }
        : { ok: false, motivo: 'No encontramos una cuenta con ese correo. Regístrate primero con tu correo o con Google.' };
    }
    cuenta = cuenta || crear(valor, 'c_' + valor, nube.nombre || valor.split('@')[0], valor, 'correo');
    abrirSesion(cuenta);
    await conectarNube();
    return { ok: true, cuenta };
  }
  function existeGoogle(obj) {
    const correo = limpio(obj.correo);
    return !!((correo && porCorreo(correo)) || todas()['g:' + obj.uid]);
  }
  async function fotoABase64(url) {
    try {
      const respuesta = await fetch(url, { mode: 'cors' });
      return await BioImg.cuadrada(await respuesta.blob(), 256, 0.85);
    } catch (err) { return ''; }
  }
  async function conGoogle(obj) {
    const correo = limpio(obj.correo);
    let cuenta = (correo && porCorreo(correo)) || todas()['g:' + obj.uid] || null;
    const nueva = !cuenta;
    if (nueva) {
      let nombre = (obj.nombre || '').trim() || correo.split('@')[0] || 'Usuario';
      if (window.BioModera && !BioModera.revisarTexto(nombre, 'nombre').ok) nombre = 'Usuario';
      cuenta = crear('g:' + obj.uid, 'g_' + obj.uid, nombre, correo, 'google');
      const foto = obj.foto ? await Promise.race([fotoABase64(obj.foto), pausa(800, '')]) : '';
      if (foto) {
        let perfiles = {};
        try { perfiles = JSON.parse(localStorage.getItem('bionyssa_perfiles')) || {}; } catch (err) {}
        perfiles[cuenta.usuario] = Object.assign({}, perfiles[cuenta.usuario], { foto });
        localStorage.setItem('bionyssa_perfiles', JSON.stringify(perfiles));
      }
    }
    abrirSesion(cuenta, { proveedor: 'google' });
    if (nueva) pasarInvitado(cuenta.id);
    await conectarNube();
    return cuenta;
  }
  return { registrar, entrar, conGoogle, existeGoogle };
})();
 } catch (err) { console.error(err); }
}

// conexion
if (['offline'].indexOf(paginaActual) === -1) {
 try {
window.BIO_FIREBASE = {
  apiKey: 'AIzaSyB3CYbVDm8h3WzSrsuBCkDvyXkBHOgIlWc',
  authDomain: 'bionyssa-bc317.firebaseapp.com',
  projectId: 'bionyssa-bc317',
  storageBucket: 'bionyssa-bc317.firebasestorage.app',
  messagingSenderId: '1091663971591',
  appId: '1:1091663971591:web:3221e97fd883051bc031a2'
};
window.BioFirebase = (function () {
  var base = 'https://www.gstatic.com/firebasejs/12.19.0/', listo = null, listoAuth = null;
  function configurado() {
    var valor = window.BIO_FIREBASE || {};
    return !!(valor.apiKey && valor.appId) && !/^PEGA/.test(valor.apiKey) && !/^PEGA/.test(valor.appId);
  }
  function soloAuth() {
    if (!listoAuth) {
      listoAuth = Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js')
      ]).then(function (resultado) {
        var app = resultado[0].initializeApp(window.BIO_FIREBASE);
        return { app: app, auth: resultado[1].getAuth(app), fa: resultado[1] };
      });
      listoAuth.catch(function () { listoAuth = null; });
    }
    return listoAuth;
  }
  function nucleo() {
    if (!listo) {
      listo = Promise.all([soloAuth(), import(base + 'firebase-firestore.js')]).then(function (resultado) {
        var valor = resultado[0], ff = resultado[1], db;
        try {
          db = ff.initializeFirestore(valor.app, {
            localCache: ff.persistentLocalCache({ tabManager: ff.persistentMultipleTabManager() })
          });
        } catch (err) { db = ff.getFirestore(valor.app); }
        return { app: valor.app, auth: valor.auth, fa: valor.fa, db: db, ff: ff };
      });
      listo.catch(function () { listo = null; });
    }
    return listo;
  }
  async function usar(fn) {
    if (!configurado()) throw { code: 'bio/no-config' };
    var valor = await soloAuth();
    return fn(valor.auth, valor.fa);
  }
  return {
    configurado: configurado,
    nucleo: nucleo,
    auth: soloAuth,
    enviarReset: function (correo) {
      return usar(function (primero, archivo) {
        return archivo.sendPasswordResetEmail(primero, correo, { url: new URL('/paginas/login.html', location.href).href });
      });
    },
    verificarCodigo: function (codigo) { return usar(function (primero, archivo) { return archivo.verifyPasswordResetCode(primero, codigo); }); },
    confirmarReset: function (codigo, clave) { return usar(function (primero, archivo) { return archivo.confirmPasswordReset(primero, codigo, clave); }); },
    entrar: async function (correo, clave) {
      try {
        return await usar(async function (primero, archivo) {
          var resultado = await archivo.signInWithEmailAndPassword(primero, correo, clave);
          return { nombre: resultado.user.displayName || '' };
        });
      } catch (err) { return null; }
    },
    sincronizar: async function (correo, clave, nombre) {
      if (!configurado()) return { ok: false, codigo: 'bio/no-config' };
      try {
        return await usar(async function (primero, archivo) {
          try {
            await archivo.signInWithEmailAndPassword(primero, correo, clave);
            return { ok: true, nuevo: false };
          } catch (err) {
            if (err.code !== 'auth/user-not-found' && err.code !== 'auth/invalid-credential' && err.code !== 'auth/invalid-login-credentials') throw err;
            try {
              var resultado = await archivo.createUserWithEmailAndPassword(primero, correo, clave);
              if (nombre) { try { await archivo.updateProfile(resultado.user, { displayName: nombre }); } catch (err2) {} }
              return { ok: true, nuevo: true };
            } catch (e2) {
              if (e2.code === 'auth/email-already-in-use') return { ok: false, codigo: 'existe' };
              throw e2;
            }
          }
        });
      } catch (err3) { return { ok: false, codigo: (err3 && err3.code) || 'error' }; }
    }
  };
})();
 } catch (err) { console.error(err); }
}

// nube
if (['admin', 'contacto', 'offline'].indexOf(paginaActual) === -1) {
 try {
window.BioNube = (function () {
  var ls = window.localStorage;
  var COMUN = {
    bionyssa_tema: 1, bionyssa_sesion: 1, bionyssa_cuentas: 1,
    bionyssa_publicaciones: 1, bionyssa_perfiles: 1
  };
  var estado = { uid: null, idCuenta: null, activo: false };
  var sucios = {}, temporizador = null, activando = null, ultimaNube = {};
  function configurado() { return !!(window.BioFirebase && BioFirebase.configurado()); }
  function nucleo() { return BioFirebase.nucleo(); }
  function ses() { try { return window.BioSesion ? BioSesion.obtener() : null; } catch (err) { return null; } }
  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  // Claves de la versión con una sola planta: ya no se sincronizan, se convierten a bionyssa_plantas
  var VIEJAS = { bionyssa_planta: 1, bionyssa_planta_diario: 1 };
  function sincronizable(k) {
    return typeof k === 'string' && k.indexOf('bionyssa_') === 0 && !COMUN[k] && !VIEJAS[k] && k.indexOf('bionyssa_nube') !== 0;
  }
  function coincide(user, obj) {
    if (!user || !obj) return false;
    if (obj.id === 'g_' + user.uid) return true;
    var texto = String(user.email || '').toLowerCase();
    return !!texto && texto === String(obj.correo || '').toLowerCase();
  }
  function limpiarHandle(texto) {
    texto = String(texto || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '');
    return texto.slice(0, 30) || 'usuario';
  }
  function parse(raw) { try { return JSON.parse(raw); } catch (err) { return undefined; } }
  function valido(opciones) {
    if (opciones === null) return true;
    var valor = typeof opciones;
    if (valor === 'string' || valor === 'boolean') return true;
    if (valor === 'number') return isFinite(opciones);
    if (Array.isArray(opciones)) return opciones.every(function (opcione) { return !Array.isArray(opcione) && valido(opcione); });
    if (valor === 'object') return Object.keys(opciones).every(function (k) { return k && !/^__.*__$/.test(k) && k.indexOf('/') < 0 && valido(opciones[k]); });
    return false;
  }
  // DÓNDE SE GUARDA CADA DATO EN FIRESTORE
  // Todo cuelga de usuarios/{uid}/<carpeta>/<documento>, cada cosa en su propio documento:
  //   plantas/{idPlanta}                  una planta (siembra, riegos, alturas, cuidados, insignias)
  //   plantas/{idPlanta}/diario/{id}      una entrada del diario de esa planta
  //   progreso/{juego}                    partidas, victorias, mejor marca y racha de cada minijuego
  //   sin_conexion/record                 récord del juego sin conexión
  //   puntos/actual                       puntos y nivel
  //   retos/actual                        reto del día
  //   guia/pasos                          pasos de la guía marcados como hechos
  //   impacto/plazo, impacto/sembradas    calculadora de impacto
  //   comunidad/guardadas, comunidad/etiquetas   publicaciones guardadas y etiquetas propias
  //   ajustes/avisos, ajustes/tema, ajustes/tutorial_*   avisos, tema y tutoriales vistos
  //   sync/{nombre}                       hora del último cambio de cada dato (decide cuál es más nuevo)
  // clave local: [carpeta, documento, campo donde va el valor (null = el objeto es el documento), campos permitidos]
  var UNICOS = {
    bionyssa_puntos: ['puntos', 'actual', null, ['p', 'dia']],
    bionyssa_retos: ['retos', 'actual', null, ['dias', 'pts']],
    bionyssa_guia: ['guia', 'pasos', 'hechos'],
    bionyssa_impacto_plazo: ['impacto', 'plazo', 'anios'],
    bionyssa_sembradas: ['impacto', 'sembradas', 'total'],
    bionyssa_guardadas: ['comunidad', 'guardadas', 'ids'],
    bionyssa_etiquetas: ['comunidad', 'etiquetas', 'lista'],
    bionyssa_sin_red_record: ['sin_conexion', 'record', 'mejor'],
    bionyssa_notis: ['ajustes', 'avisos', null, ['on', 'pregunto', 'ult']],
    bionyssa_tema_cuenta: ['ajustes', 'tema', 'valor']
  };
  var CAMPOS_PLANTA = ['id', 'nombre', 'siembra', 'riegos', 'freq', 'alturas', 'logros', 'cuidados', 'cuidadosPts', 'etapa', 'creado'];
  var CAMPOS_DIARIO = ['id', 'f', 't', 'img', 'creado'];
  var CAMPOS_JUEGO = ['partidas', 'victorias', 'mejor', 'racha'];
  function codec(k) {
    var valor = /^bionyssa_diario_([a-z0-9_]{1,40})$/.exec(k), valor2 = UNICOS[k];
    if (k === 'bionyssa_plantas') return { ruta: ['plantas'], grupo: 1, asc: 1 };
    if (valor) return { ruta: ['plantas', valor[1], 'diario'], grupo: 1 };
    if (k === 'bionyssa_progreso') return { ruta: ['progreso'], grupo: 1, porClave: 1 };
    if (valor2) return { ruta: [valor2[0]], doc: valor2[1], campo: valor2[2], campos: valor2[3] };
    if (/^bionyssa_tuto_/.test(k)) return { ruta: ['ajustes'], doc: 'tutorial_' + k.slice(14).replace(/[^a-z0-9_]/gi, '_'), campo: 'visto' };
    return { ruta: ['ajustes'], doc: 'otro_' + k.slice(9).replace(/[^a-z0-9_]/gi, '_'), campo: 'valor' };
  }
  function idValido(id) { return typeof id === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(id); }
  function permitir(opciones, lista) {
    var obj = {};
    lista.forEach(function (item) { if (opciones[item] !== undefined) obj[item] = opciones[item]; });
    return obj;
  }
  function conT(archivo, texto) { var copia = Object.assign({}, archivo); copia.actualizado = texto; return copia; }
  function limpio(archivo) { var copia = Object.assign({}, archivo); delete copia.actualizado; return copia; }
  function huella(archivo) { return orden(limpio(archivo)); }
  function huellas(docs) {
    var obj = {};
    Object.keys(docs).forEach(function (id) { obj[id] = huella(docs[id]); });
    return obj;
  }
  function ordenValido(k, opciones) {
    var cod = codec(k);
    if (!cod.grupo) return true;
    return cod.porClave ? !!(opciones && typeof opciones === 'object' && !Array.isArray(opciones)) : Array.isArray(opciones);
  }
  // valor guardado en el navegador (texto): documentos de Firestore { idDocumento: campos }
  function partir(k, raw, texto) {
    var cod = codec(k), valor = parse(raw), docs = {}, valor2;
    if (cod.grupo) {
      if (cod.porClave) {
        if (ordenValido(k, valor)) Object.keys(valor).forEach(function (id) {
          valor2 = valor[id];
          if (!idValido(id) || !valor2 || typeof valor2 !== 'object') return;
          valor2 = permitir(valor2, CAMPOS_JUEGO);
          if (valido(valor2)) docs[id] = conT(valor2, texto);
        });
      } else if (ordenValido(k, valor)) {
        valor.forEach(function (item) {
          if (!item || typeof item !== 'object' || !idValido(item.id)) return;
          valor2 = permitir(item, cod.asc ? CAMPOS_PLANTA : CAMPOS_DIARIO);
          if (valido(valor2)) docs[item.id] = conT(valor2, texto);
        });
      }
      return docs;
    }
    valor2 = {};
    if (valor !== undefined && valido(valor)) {
      if (cod.campo) { valor2[cod.campo] = valor; valor2.j = 1; }
      else if (valor && typeof valor === 'object' && !Array.isArray(valor)) valor2 = permitir(valor, cod.campos);
      else { valor2.valor = valor; valor2.j = 1; }
    } else { valor2.valor = String(raw); valor2.j = 0; }
    docs[cod.doc] = conT(valor2, texto);
    return docs;
  }
  // documentos de Firestore: valor para el navegador (texto)
  function unir(k, docs) {
    var cod = codec(k), ids = Object.keys(docs), out;
    if (cod.grupo) {
      if (cod.porClave) {
        out = {};
        ids.forEach(function (id) { out[id] = limpio(docs[id]); });
      } else {
        out = ids.map(function (id) { var elemento = limpio(docs[id]); elemento.id = id; return elemento; });
        out.sort(function (a, b) {
          var valor = (a.creado || 0) - (b.creado || 0);
          if (valor === 0) valor = a.id < b.id ? -1 : 1;
          return cod.asc ? valor : -valor;
        });
      }
      return JSON.stringify(out);
    }
    var valor2 = docs[cod.doc];
    if (!valor2) return null;
    valor2 = limpio(valor2);
    if (valor2.j === 0) return valor2.valor === undefined || valor2.valor === null ? null : String(valor2.valor);
    if (cod.campo) return JSON.stringify(valor2[cod.campo] === undefined ? null : valor2[cod.campo]);
    if (valor2.j === 1 && 'valor' in valor2) return JSON.stringify(valor2.valor);
    delete valor2.j;
    return JSON.stringify(valor2);
  }
  function orden(datos) {
    if (Array.isArray(datos)) return '[' + datos.map(orden).join(',') + ']';
    if (datos && typeof datos === 'object') return '{' + Object.keys(datos).sort().map(function (k) { return JSON.stringify(k) + ':' + orden(datos[k]); }).join(',') + '}';
    return JSON.stringify(datos);
  }
  function canon(raw) {
    if (raw === null || raw === undefined) return null;
    var valor = parse(raw);
    return valor === undefined ? 's:' + raw : 'j:' + orden(valor);
  }
  function mejor(numero, numero2, menor) {
    if (numero === null || numero === undefined) return numero2 === undefined ? null : numero2;
    if (numero2 === null || numero2 === undefined) return numero;
    return menor ? Math.min(numero, numero2) : Math.max(numero, numero2);
  }
  function fusionProgreso(lista, valor) {
    var valor2 = parse(lista) || {}, valor3 = parse(valor) || {}, obj = {};
    Object.keys(valor2).concat(Object.keys(valor3)).forEach(function (j) {
      if (obj[j]) return;
      var valor4 = valor2[j], valor5 = valor3[j];
      if (!valor4 || !valor5) { obj[j] = valor4 || valor5; return; }
      obj[j] = {
        partidas: Math.max(valor4.partidas || 0, valor5.partidas || 0),
        victorias: Math.max(valor4.victorias || 0, valor5.victorias || 0),
        mejor: mejor(valor4.mejor, valor5.mejor, j === 'memorama'),
        racha: Math.max(valor4.racha || 0, valor5.racha || 0)
      };
    });
    return JSON.stringify(obj);
  }
  function fusionPuntos(lista, valor) {
    var valor2 = parse(lista) || { p: 0, dia: '' }, valor3 = parse(valor) || { p: 0, dia: '' };
    return JSON.stringify((valor3.p || 0) > (valor2.p || 0) ? valor3 : valor2);
  }
  function fusionMax(numero, numero2) { return String(Math.max(+numero || 0, +numero2 || 0)); }
  function fusionO(lista, valor) { return lista !== null && lista !== undefined ? lista : valor; }
  function fusionDe(k) {
    if (k === 'bionyssa_progreso') return fusionProgreso;
    if (k === 'bionyssa_puntos') return fusionPuntos;
    if (k === 'bionyssa_sin_red_record') return fusionMax;
    if (k.indexOf('bionyssa_tuto_') === 0) return fusionO;
    return null;
  }
  function leerMeta(id) { try { return JSON.parse(ls.getItem('bio_nt@' + id) || '{}') || {}; } catch (err) { return {}; } }
  function guardarMeta(id, datos) { try { ls.setItem('bio_nt@' + id, JSON.stringify(datos)); } catch (err) {} }
  function ponerLocal(id, clave, valor) {
    try {
      if (valor === null || valor === undefined) delete ls[clave + '@' + id];
      else ls[clave + '@' + id] = valor;
    } catch (err) {}
  }
  function fijarClaveLocal(id, clave) {
    try {
      var cs = JSON.parse(ls.getItem('bionyssa_cuentas') || '{}') || {};
      Object.keys(cs).forEach(function (k) { if (cs[k] && cs[k].id === id) cs[k].usuario = clave; });
      ls.setItem('bionyssa_cuentas', JSON.stringify(cs));
      var se = JSON.parse(ls.getItem('bionyssa_sesion') || 'null');
      if (se && se.id === id) { se.usuario = clave; ls.setItem('bionyssa_sesion', JSON.stringify(se)); }
    } catch (err) {}
  }
  async function reclamar(numero, handle, uid) {
    var ref = numero.ff.doc(numero.db, 'usuarios_unicos', 'h_' + handle);
    return numero.ff.runTransaction(numero.db, async function (tx) {
      var valor = await tx.get(ref);
      if (valor.exists()) return valor.data().uid === uid;
      tx.set(ref, { uid: uid });
      return true;
    });
  }
  async function reservarClave(numero, base, uid) {
    var valor = limpiarHandle(base);
    for (var i = 1; i < 80; i++) {
      var cand = i === 1 ? valor : valor + i;
      if (await reclamar(numero, cand, uid)) return '@' + cand;
    }
    throw { code: 'bio/sin-usuario' };
  }
  async function asegurarPerfil(numero, user, obj) {
    var ff = numero.ff, ref = ff.doc(numero.db, 'perfiles', user.uid);
    var snap = await ff.getDoc(ref);
    if (snap.exists()) {
      var valor = snap.data().clave;
      if (valor && valor !== obj.usuario) fijarClaveLocal(obj.id, valor);
      return;
    }
    var pf = {}, viejo = {};
    try { pf = JSON.parse(ls.getItem('bionyssa_perfiles') || '{}') || {}; viejo = pf[obj.usuario] || {}; } catch (err) {}
    var clave = await reservarClave(numero, obj.usuario, user.uid);
    var fecha = { uid: user.uid, clave: clave, nombre: obj.nombre || 'Usuario', creado: Date.now(), actualizado: Date.now() };
    if (viejo.bio) fecha.bio = String(viejo.bio).slice(0, 160);
    if (viejo.nombreCom) fecha.nombreCom = String(viejo.nombreCom).slice(0, 40);
    if (viejo.foto && String(viejo.foto).length < 140000) fecha.foto = viejo.foto;
    if (viejo.usuarioCom) {
      var valor2 = limpiarHandle(viejo.usuarioCom);
      try { if (await reclamar(numero, valor2, user.uid)) fecha.usuarioCom = '@' + valor2; } catch (err2) {}
    }
    await ff.setDoc(ref, fecha);
    if (clave !== obj.usuario) fijarClaveLocal(obj.id, clave);
    try { if (pf[obj.usuario]) { delete pf[obj.usuario]; ls.setItem('bionyssa_perfiles', JSON.stringify(pf)); } } catch (err3) {}
  }
  function refColeccion(numero, uid, ruta) { return numero.ff.collection.apply(null, [numero.db, 'usuarios', uid].concat(ruta)); }
  function refDoc(numero, uid, ruta, id) { return numero.ff.doc.apply(null, [numero.db, 'usuarios', uid].concat(ruta, [id])); }
  async function bajarDocs(numero, uid, k) {
    var cod = codec(k), obj = {};
    if (cod.grupo) {
      (await numero.ff.getDocs(refColeccion(numero, uid, cod.ruta))).docs.forEach(function (doc) { obj[doc.id] = doc.data(); });
    } else {
      var valor = await numero.ff.getDoc(refDoc(numero, uid, cod.ruta, cod.doc));
      if (valor.exists()) obj[cod.doc] = valor.data();
    }
    return obj;
  }
  async function traerRaw(numero, uid, k, info) {
    if (info.virtual !== undefined) return info.virtual;
    if (info.borrado) { ultimaNube[k] = { docs: {}, raw: null, t: info.t || 0 }; return null; }
    var docs = await bajarDocs(numero, uid, k), raw = unir(k, docs);
    ultimaNube[k] = { docs: huellas(docs), raw: raw, t: info.t || 0 };
    return raw;
  }
  // Datos de la versión anterior: todo estaba junto en un solo documento usuarios/{uid}.datos
  async function leerLegado(numero, uid) {
    var snap = await numero.ff.getDoc(numero.ff.doc(numero.db, 'usuarios', uid));
    var nube = snap.exists() ? snap.data().datos : null;
    var out = { existe: snap.exists(), tieneDatos: !!nube, items: {} };
    if (!nube) return out;
    Object.keys(nube).forEach(function (item) {
      var elemento = nube[item];
      if (!elemento || elemento.b) return;
      var raw = elemento.j ? JSON.stringify(elemento.v) : (elemento.v === null || elemento.v === undefined ? null : String(elemento.v));
      if (raw !== null) out.items[item] = { raw: raw, t: elemento.t || 0 };
    });
    var vieja = out.items.bionyssa_planta, diario = out.items.bionyssa_planta_diario;
    if (vieja && window.BioPlantas) {
      var valor = BioPlantas.convertir(parse(vieja.raw), diario ? parse(diario.raw) : []);
      if (valor) {
        out.items.bionyssa_plantas = { raw: JSON.stringify([valor.planta]), t: vieja.t };
        out.items['bionyssa_diario_' + valor.planta.id] = { raw: JSON.stringify(valor.diario), t: (diario || vieja).t };
      }
    }
    delete out.items.bionyssa_planta;
    delete out.items.bionyssa_planta_diario;
    return out;
  }
  // Decide qué versión de un dato se queda (la del navegador o la de la nube) y si hay que subirlo
  async function decidir(numero, uid, k, loc, info, tL, ahora) {
    var fus = fusionDe(k), tN = info ? (info.t || 0) : 0, nubeRaw = null, valor;
    if (fus) {
      if (info) nubeRaw = await traerRaw(numero, uid, k, info);
      if (loc === null && nubeRaw === null) return null;
      var res = fus(loc, nubeRaw), igual = canon(res) === canon(nubeRaw);
      valor = { res: res, t: igual ? tN : ahora, subir: !igual };
    } else if (!info) {
      if (loc === null) return null;
      valor = { res: loc, t: tL || ahora, subir: true };
    } else if (tL > tN) {
      valor = { res: loc, t: tL, subir: true };
    } else if (tL === tN && tN > 0) {
      valor = { res: loc, t: tL, subir: false };
    } else {
      valor = { res: await traerRaw(numero, uid, k, info), t: tN, subir: false };
    }
    if (info && info.virtual !== undefined) valor.subir = true;
    return valor;
  }
  async function reconciliar(numero, user, obj) {
    var ff = numero.ff, uid = user.uid, ahora = Date.now(), cambio = false, fallos = 0, i;
    if (window.BioPlantas) BioPlantas.migrar();
    var meta = leerMeta(obj.id), fin = '@' + obj.id, claves = {}, metasN = {}, legado = null;
    (await ff.getDocs(ff.collection(numero.db, 'usuarios', uid, 'sync'))).docs.forEach(function (doc) {
      metasN['bionyssa_' + doc.id] = doc.data();
    });
    if (!Object.keys(metasN).length) {
      legado = await leerLegado(numero, uid);
      Object.keys(legado.items).forEach(function (item) {
        if (sincronizable(item)) metasN[item] = { t: legado.items[item].t, virtual: legado.items[item].raw };
      });
    }
    for (i = 0; i < ls.length; i++) {
      var k0 = ls.key(i);
      if (k0 && k0.indexOf('bionyssa_') === 0 && k0.slice(-fin.length) === fin) {
        var c0 = k0.slice(0, -fin.length);
        if (sincronizable(c0)) claves[c0] = 1;
      }
    }
    Object.keys(metasN).forEach(function (item) { if (sincronizable(item)) claves[item] = 1; });
    var lista = Object.keys(claves), subir = [];
    for (i = 0; i < lista.length; i++) {
      var k = lista[i], loc = ls.getItem(k);
      var valor = await decidir(numero, uid, k, loc, metasN[k] || null, meta[k] || 0, ahora);
      if (!valor) continue;
      if (canon(valor.res) !== canon(loc)) { ponerLocal(obj.id, k, valor.res); cambio = true; }
      meta[k] = valor.t;
      if (valor.subir) subir.push(k);
    }
    guardarMeta(obj.id, meta);
    if (legado && !legado.existe) {
      await ff.setDoc(ff.doc(numero.db, 'usuarios', uid), {
        uid: uid, nombre: obj.nombre || '', correo: String(obj.correo || '').toLowerCase(), creado: ahora, actualizado: ahora
      });
    }
    for (i = 0; i < subir.length; i++) {
      // Dato que venía de la nube vieja y no está en el navegador: no se sube (evita marcarlo como borrado) y no se borra el original
      if (metasN[subir[i]] && metasN[subir[i]].virtual !== undefined && ls.getItem(subir[i]) === null) { fallos++; continue; }
      try { await subirClave(numero, obj, uid, subir[i], meta[subir[i]] || ahora); }
      catch (err) { fallos++; if (transitorio(err)) sucios[subir[i]] = 1; }
    }
    if (fallos && Object.keys(sucios).length) programar();
    if (legado && legado.tieneDatos && !fallos) {
      try { await ff.updateDoc(ff.doc(numero.db, 'usuarios', uid), { datos: ff.deleteField() }); } catch (err2) {}
    }
    return cambio;
  }
  function transitorio(ev) {
    var texto = ev && ev.code ? String(ev.code) : '';
    return texto === 'unavailable' || texto === 'deadline-exceeded' || texto === 'resource-exhausted' || texto === 'aborted' || texto === 'internal' || texto === 'cancelled' || texto === 'unknown';
  }
  async function aplicar(numero, ops) {
    var ff = numero.ff;
    for (var i = 0; i < ops.length; i += 400) {
      var tanda = ff.writeBatch(numero.db);
      ops.slice(i, i + 400).forEach(function (item) {
        if (item.del) tanda.delete(item.ref);
        else if (item.merge) tanda.set(item.ref, item.data, { merge: true });
        else tanda.set(item.ref, item.data);
      });
      await tanda.commit();
    }
  }
  // Sube un dato a sus documentos. Solo escribe los documentos que cambiaron.
  async function subirClave(numero, obj, uid, k, texto) {
    var ff = numero.ff, cod = codec(k), raw = ls.getItem(k), fus = fusionDe(k), prev = ultimaNube[k];
    if (fus && raw !== null && prev && prev.raw !== null && prev.raw !== undefined) {
      var valor = fus(raw, prev.raw);
      if (canon(valor) !== canon(raw)) { ponerLocal(obj.id, k, valor); raw = valor; }
    }
    if (raw !== null && !ordenValido(k, parse(raw))) return;
    var quiere = raw === null ? {} : partir(k, raw, texto), ops = [];
    if (cod.grupo && !prev) prev = { docs: huellas(await bajarDocs(numero, uid, k)) };
    Object.keys(quiere).forEach(function (id) {
      if (cod.grupo && prev.docs[id] === huella(quiere[id])) return;
      ops.push({ ref: refDoc(numero, uid, cod.ruta, id), data: quiere[id] });
    });
    if (cod.grupo) {
      Object.keys(prev.docs).forEach(function (id) { if (!quiere[id]) ops.push({ ref: refDoc(numero, uid, cod.ruta, id), del: 1 }); });
    } else if (raw === null) {
      ops.push({ ref: refDoc(numero, uid, cod.ruta, cod.doc), del: 1 });
    }
    ops.push({ ref: refDoc(numero, uid, ['sync'], k.slice(9)), data: { t: texto, borrado: raw === null } });
    ops.push({
      ref: ff.doc(numero.db, 'usuarios', uid), merge: 1,
      data: { uid: uid, nombre: obj.nombre || '', correo: String(obj.correo || '').toLowerCase(), actualizado: Date.now() }
    });
    await aplicar(numero, ops);
    ultimaNube[k] = { docs: huellas(quiere), raw: raw, t: texto };
  }
  var intentos = 0;
  async function subirSucios() {
    var claves = Object.keys(sucios);
    if (!claves.length || !estado.activo) return;
    var valor = ses();
    if (!valor || valor.id !== estado.idCuenta) return;
    sucios = {};
    var reintentar = false;
    try {
      var valor2 = await nucleo(), meta = leerMeta(valor.id), ahora = Date.now();
      for (var i = 0; i < claves.length; i++) {
        try { await subirClave(valor2, valor, estado.uid, claves[i], meta[claves[i]] || ahora); }
        catch (err) {
          if (transitorio(err)) { sucios[claves[i]] = 1; reintentar = true; }
          else if (window.console) console.warn('BioNube: no se pudo guardar', claves[i], err && err.code);
        }
      }
      if (!reintentar) intentos = 0;
    } catch (err2) {
      claves.forEach(function (clave) { sucios[clave] = 1; });
      reintentar = true;
    }
    if (reintentar && ++intentos <= 6) setTimeout(programar, 6000);
  }
  function asegurar(k) {
    if (!estado.activo || !sincronizable(k) || !ses()) return;
    if (ls.getItem(k) === null) return;
    var valor = ultimaNube[k];
    if (valor && valor.raw !== null && valor.raw !== undefined) return;
    sucios[k] = 1;
    programar();
  }
  function programar() {
    if (!estado.activo) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(subirSucios, 700);
  }
  (function () {
    var proto = Storage.prototype, setPrev = proto.setItem, remPrev = proto.removeItem;
    function marcar(almacen, k) {
      if (almacen !== ls || !sincronizable(k)) return;
      var valor = ses();
      if (!valor) return;
      var valor2 = leerMeta(valor.id);
      valor2[k] = Date.now();
      guardarMeta(valor.id, valor2);
      sucios[k] = 1;
      programar();
    }
    proto.setItem = function (k, valor) { var resultado = setPrev.call(this, k, valor); marcar(this, k); return resultado; };
    proto.removeItem = function (k) { var resultado = remPrev.call(this, k); marcar(this, k); return resultado; };
    addEventListener('pagehide', function () { clearTimeout(temporizador); subirSucios(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { clearTimeout(temporizador); subirSucios(); } });
  })();
  function fotoValida(lista, max) {
    return typeof lista === 'string' && lista.length <= max && /^data:image\/[a-z]+;base64,/.test(lista);
  }
  async function migrarLegacy(numero, user, obj, claveAntes) {
    var arr;
    try { arr = JSON.parse(ls.getItem('bionyssa_publicaciones') || '[]'); } catch (err) { return; }
    if (!Array.isArray(arr)) return;
    var mios = arr.filter(function (item) { return item && typeof item.id === 'number' && (item.usuario === claveAntes || item.usuario === obj.usuario); });
    if (!mios.length) return;
    var ff = numero.ff, ahora = Date.now();
    var subidas = await Promise.all(mios.map(function (mio) {
      var texto = String(mio.texto || '').slice(0, 1000);
      var foto = fotoValida(mio.foto, 740000) ? mio.foto : null;
      if (!texto.length && !foto) return Promise.resolve(true);
      var creado = +mio.creado || ahora;
      if (creado > ahora) creado = ahora;
      var ref = ff.doc(numero.db, 'publicaciones', 'legacy_' + user.uid + '_' + mio.id);
      return ff.getDoc(ref).then(function (sn) {
        if (sn.exists()) return true;
        return ff.setDoc(ref, {
          uid: user.uid, usuario: String(obj.usuario || '').slice(0, 40), nombre: String(mio.nombre || obj.nombre || 'Usuario').slice(0, 80),
          texto: texto, foto: foto, creado: creado
        }).then(function () { return true; });
      }).catch(function () { return false; });
    }));
    var bien = mios.filter(function (mio, k) { return subidas[k]; });
    if (!bien.length) return;
    try {
      var cur = JSON.parse(ls.getItem('bionyssa_publicaciones') || '[]');
      var quedan = (Array.isArray(cur) ? cur : arr).filter(function (item) { return bien.every(function (item2) { return item2.id !== (item && item.id); }); });
      ls.setItem('bionyssa_publicaciones', JSON.stringify(quedan));
    } catch (err2) {}
  }
  function recargarUnaVez() {
    try {
      var valor = +sessionStorage.getItem('bio_nube_rec') || 0;
      if (Date.now() - valor < 15000) return;
      sessionStorage.setItem('bio_nube_rec', String(Date.now()));
    } catch (err) { return; }
    location.reload();
  }
  function avisarSinNube() {
    try {
      if (!navigator.onLine || sessionStorage.getItem('bio_nube_aviso')) return;
      sessionStorage.setItem('bio_nube_aviso', '1');
    } catch (err) { return; }
    setTimeout(function () {
      if (window.BioToast) BioToast('Cierra sesión y entra otra vez para guardar tu avance en la nube');
    }, 1500);
  }
  function registrarAcceso(numero, user, obj) {
    try {
      var marca = 'bio_acceso_' + user.uid;
      if (sessionStorage.getItem(marca)) return;
      sessionStorage.setItem(marca, '1');
      var ff = numero.ff, fecha = {
        uid: user.uid,
        nombre: String(obj.nombre || user.displayName || 'Usuario').slice(0, 80),
        correo: String(user.email || '').slice(0, 120),
        ultimoAcceso: Date.now(),
        accesos: ff.increment(1)
      };
      var cre = Date.parse(user.metadata && user.metadata.creationTime);
      if (cre) fecha.creado = cre;
      ff.setDoc(ff.doc(numero.db, 'accesos', user.uid), fecha, { merge: true })
        .catch(function () { try { sessionStorage.removeItem(marca); } catch (err) {} });
    } catch (err2) {}
  }
  function desactivar() { estado.activo = false; estado.uid = null; estado.idCuenta = null; }
  // Cada cuánto se vuelve a comparar con la nube (en la misma pestaña). Así cambiar de página no hace lecturas de más.
  var REVISION_MS = 5 * 60 * 1000;
  function activar(opciones) {
    opciones = opciones || {};
    if (!configurado()) return Promise.resolve(null);
    var valor = ses();
    if (!valor) { desactivar(); return Promise.resolve(null); }
    return (async function () {
      var valor2 = await BioFirebase.auth();
      await valor2.auth.authStateReady();
      var user = valor2.auth.currentUser;
      if (!user || !coincide(user, valor)) { desactivar(); if (!opciones.sinAviso) avisarSinNube(); return null; }
      if (estado.activo && estado.uid === user.uid && estado.idCuenta === valor.id) return estado.uid;
      var llave = user.uid + '|' + valor.id;
      if (activando && activando.llave === llave) return activando.p;
      var cantidad = (async function () {
        var claveAntes = valor.usuario, s2 = valor, cambio = false, marca = 'bio_nube_ok@' + valor.id, antes = 0;
        try {
          try { antes = +sessionStorage.getItem(marca) || 0; } catch (err) {}
          if (Date.now() - antes > REVISION_MS) {
            var valor3 = await nucleo();
            await asegurarPerfil(valor3, user, valor);
            s2 = ses() || valor;
            cambio = await reconciliar(valor3, user, s2);
            await migrarLegacy(valor3, user, s2, claveAntes);
            registrarAcceso(valor3, user, s2);
            try { sessionStorage.setItem(marca, String(Date.now())); } catch (err2) {}
          }
          estado.uid = user.uid; estado.idCuenta = s2.id; estado.activo = true;
          document.dispatchEvent(new CustomEvent('bio-nube-listo', { detail: { uid: user.uid } }));
          if (Object.keys(sucios).length) programar();
          if (cambio && !opciones.sinRecargar) recargarUnaVez();
          return user.uid;
        } catch (err3) {
          desactivar();
          return null;
        } finally {
          activando = null;
        }
      })();
      activando = { llave: llave, p: cantidad };
      return cantidad;
    })().catch(function () { return null; });
  }
  async function requerir() {
    if (!ses()) throw { code: 'bio/sin-sesion' };
    var uid = estado.activo ? estado.uid : await activar({ sinRecargar: true, sinAviso: true });
    if (!uid) throw { code: 'bio/sin-nube' };
    return nucleo();
  }
  async function salir() {
    try { var sa = ses(); if (sa) sessionStorage.removeItem('bio_nube_ok@' + sa.id); } catch (err) {}
    try {
      clearTimeout(temporizador);
      await Promise.race([subirSucios(), esperar(2500)]);
    } catch (err2) {}
    desactivar(); activando = null; ultimaNube = {};
    try {
      if (configurado()) { var valor = await nucleo(); await valor.fa.signOut(valor.auth); }
    } catch (err3) {}
  }
  var com = null;
  function iniciarComunidad() {
    com = { cbs: [], posts: [], likes: {}, coms: {}, porUid: {}, porClave: {}, cargada: false, error: null, tic: 0 };
    function avisar() {
      clearTimeout(com.tic);
      com.tic = setTimeout(function () {
        var elemento = ensamblar();
        com.cbs.forEach(function (cb) { try { cb(elemento); } catch (err) {} });
      }, 30);
    }
    com.avisar = avisar;
    nucleo().then(function (resultado) {
      var ff = resultado.ff, db = resultado.db;
      function falla(ev) { com.error = ev && ev.code || 'error'; com.cargada = true; avisar(); }
      ff.onSnapshot(ff.query(ff.collection(db, 'publicaciones'), ff.orderBy('creado', 'desc'), ff.limit(200)), function (sn) {
        com.posts = sn.docs.map(function (doc) { var valor = doc.data(); valor.id = doc.id; return valor; });
        com.cargada = true; com.error = null; avisar();
      }, falla);
      ff.onSnapshot(ff.collectionGroup(db, 'likes'), function (sn) {
        var obj = {};
        sn.docs.forEach(function (doc) {
          var valor = doc.ref.parent.parent; if (!valor) return;
          (obj[valor.id] = obj[valor.id] || []).push(doc.id);
        });
        com.likes = obj; avisar();
      }, function () {});
      ff.onSnapshot(ff.collectionGroup(db, 'comentarios'), function (sn) {
        var obj = {};
        sn.docs.forEach(function (doc) {
          var valor = doc.ref.parent.parent; if (!valor) return;
          var valor2 = doc.data();
          (obj[valor.id] = obj[valor.id] || []).push({ id: doc.id, t: valor2.texto, u: valor2.usuario, uid: valor2.uid, creado: valor2.creado || 0 });
        });
        Object.keys(obj).forEach(function (k) { obj[k].sort(function (a, b) { return a.creado - b.creado; }); });
        com.coms = obj; avisar();
      }, function () {});
      ff.onSnapshot(ff.collection(db, 'perfiles'), function (sn) {
        var pu = {}, pc = {};
        sn.docs.forEach(function (doc) {
          var valor = doc.data(); valor.uid = doc.id;
          pu[doc.id] = valor;
          if (valor.clave) pc[valor.clave] = valor;
        });
        com.porUid = pu; com.porClave = pc; avisar();
      }, function () {});
    }).catch(function () { com.error = 'sin-firebase'; com.cargada = true; avisar(); });
    setTimeout(function () { if (!com.cargada) { com.cargada = true; avisar(); } }, 8000);
  }
  function ensamblar() {
    var posts = com.posts.map(function (post) {
      var valor = com.likes[post.id] || [];
      return {
        id: post.id, uid: post.uid, usuario: post.usuario, nombre: post.nombre, texto: post.texto || '', foto: post.foto || '',
        creado: post.creado || 0, likes: valor.length, likedBy: valor, comentarios: com.coms[post.id] || []
      };
    });
    return { posts: posts, porUid: com.porUid, porClave: com.porClave, cargada: com.cargada, error: com.error };
  }
  function comunidad(cb) {
    if (!configurado()) { cb({ posts: [], porUid: {}, porClave: {}, cargada: true, error: 'sin-firebase' }); return; }
    if (!com) iniciarComunidad();
    com.cbs.push(cb);
    if (com.cargada) com.avisar();
  }
  async function publicar(dato) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw { code: 'unavailable' };
    var valor = await requerir(), ff = valor.ff, valor2 = ses();
    var texto = String(dato.texto || '').slice(0, 1000);
    var foto = dato.foto ? String(dato.foto) : null;
    if (foto && !fotoValida(foto, 740000)) throw { code: 'bio/foto-grande' };
    if (!texto.length && !foto) throw { code: 'bio/vacia' };
    return ff.addDoc(ff.collection(valor.db, 'publicaciones'), {
      uid: estado.uid, usuario: String(valor2.usuario || '').slice(0, 40), nombre: String(valor2.nombre || 'Usuario').slice(0, 80),
      texto: texto, foto: foto, creado: Date.now()
    });
  }
  async function meGusta(postId, si) {
    var valor = await requerir(), ff = valor.ff;
    var ref = ff.doc(valor.db, 'publicaciones', postId, 'likes', estado.uid);
    return si ? ff.setDoc(ref, { uid: estado.uid, creado: Date.now() }) : ff.deleteDoc(ref);
  }
  async function comentar(postId, texto) {
    var valor = await requerir(), ff = valor.ff, valor2 = ses();
    return ff.addDoc(ff.collection(valor.db, 'publicaciones', postId, 'comentarios'), {
      uid: estado.uid, usuario: String(valor2.usuario || '').slice(0, 40), nombre: String(valor2.nombre || 'Usuario').slice(0, 80),
      texto: String(texto || '').slice(0, 300), creado: Date.now()
    });
  }
  async function borrarComentario(postId, cid) {
    var valor = await requerir();
    return valor.ff.deleteDoc(valor.ff.doc(valor.db, 'publicaciones', postId, 'comentarios', cid));
  }
  async function borrarPublicacion(postId) {
    var valor = await requerir(), ff = valor.ff;
    var res = await Promise.all([
      ff.getDocs(ff.collection(valor.db, 'publicaciones', postId, 'likes')),
      ff.getDocs(ff.collection(valor.db, 'publicaciones', postId, 'comentarios'))
    ]);
    var refs = [];
    res.forEach(function (sn) { sn.docs.forEach(function (doc) { refs.push(doc.ref); }); });
    for (var i = 0; i < refs.length; i += 12) {
      var tanda = ff.writeBatch(valor.db);
      refs.slice(i, i + 12).forEach(function (item) { tanda.delete(item); });
      await tanda.commit();
    }
    return ff.deleteDoc(ff.doc(valor.db, 'publicaciones', postId));
  }
  async function guardarPerfil(obj) {
    var valor = await requerir(), ff = valor.ff, db = valor.db, uid = estado.uid;
    var ref = ff.doc(db, 'perfiles', uid);
    var actual = (await ff.getDoc(ref)).data() || {};
    var nuevoH = obj.usuarioCom ? limpiarHandle(obj.usuarioCom) : null;
    var viejoH = actual.usuarioCom ? limpiarHandle(actual.usuarioCom) : null;
    if (nuevoH && nuevoH !== viejoH) {
      if (!(await reclamar(valor, nuevoH, uid))) throw { code: 'bio/usuario-ocupado' };
    }
    var upd = { actualizado: Date.now() };
    upd.bio = obj.bio ? obj.bio : ff.deleteField();
    upd.nombreCom = obj.nombreCom ? obj.nombreCom : ff.deleteField();
    upd.usuarioCom = nuevoH ? '@' + nuevoH : ff.deleteField();
    if (obj.foto === null) upd.foto = ff.deleteField();
    else if (typeof obj.foto === 'string') upd.foto = obj.foto;
    await ff.updateDoc(ref, upd);
    if (viejoH && viejoH !== nuevoH && viejoH !== limpiarHandle(actual.clave)) {
      try { await ff.deleteDoc(ff.doc(db, 'usuarios_unicos', 'h_' + viejoH)); } catch (err) {}
    }
  }
  if (configurado() && ses()) setTimeout(function () { activar(); }, 0);
  return {
    configurado: configurado,
    activar: activar,
    asegurar: asegurar,
    activo: function () { return estado.activo; },
    uid: function () { return estado.activo ? estado.uid : null; },
    salir: salir,
    comunidad: comunidad,
    publicar: publicar,
    meGusta: meGusta,
    comentar: comentar,
    borrarComentario: borrarComentario,
    borrarPublicacion: borrarPublicacion,
    guardarPerfil: guardarPerfil
  };
})();
 } catch (err) { console.error(err); }
}

// avisos
if (['comunidad', 'guia', 'menu', 'mi-planta', 'minijuegos'].indexOf(paginaActual) > -1) {
 try {
window.BioNotis = (function () {
  const texto = 'bionyssa_notis';
  const soporta = function () { return 'Notification' in window; };
  const leer = function () { try { return JSON.parse(localStorage.getItem(texto)) || {}; } catch (err) { return {}; } };
  const guardar = function (datos) { try { localStorage.setItem(texto, JSON.stringify(datos)); } catch (err) {} };
  const f2 = function (numero) { return String(numero).padStart(2, '0'); };
  const fecha = function (dato) { return dato.getFullYear() + '-' + f2(dato.getMonth() + 1) + '-' + f2(dato.getDate()); };
  const dias = function (a, b) { return Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5); };
  const activo = function () { return soporta() && Notification.permission === 'granted' && !!leer().on; };
  async function mostrar(titulo, cuerpo, tag) {
    const op = { body: cuerpo, icon: '/assets/img/logo-app.png', badge: '/assets/img/favicon.ico', tag: tag, data: { url: '/paginas/mi-planta.html' } };
    try {
      const registro = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (registro) { await registro.showNotification(titulo, op); return; }
    } catch (err) {}
    try { new Notification(titulo, op); } catch (err2) {}
  }
  async function activar() {
    if (!soporta()) return 'no';
    let valor = Notification.permission;
    if (valor === 'default') { try { valor = await Notification.requestPermission(); } catch (err) { valor = 'denied'; } }
    const valor2 = leer(); valor2.on = valor === 'granted'; valor2.pregunto = true; guardar(valor2);
    if (valor === 'granted') mostrar('Avisos activados', 'Te recordaremos cuándo regar tu planta.', 'bio-hola');
    return valor;
  }
  function desactivar() { const valor = leer(); valor.on = false; guardar(valor); }
  function pedir() {
    return new Promise(function (ok) {
      if (!soporta()) { if (window.BioToast) BioToast('Tu navegador no admite avisos'); return ok('no'); }
      if (Notification.permission === 'denied') { if (window.BioToast) BioToast('Los avisos están bloqueados en tu navegador'); return ok('denied'); }
      const valor = leer(); valor.pregunto = true; guardar(valor);
      const ov = document.createElement('div');
      ov.className = 'modal-overlay show';
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<div class="modal-card" style="max-width:420px;text-align:left"><h3 style="margin:0 0 8px">¿Te avisamos?</h3>' +
        '<p style="margin:0 0 12px;color:var(--texto-suave)">Solo te mandaríamos avisos útiles para tu planta, nada de spam:</p>' +
        '<ul style="margin:0 0 18px;padding-left:18px;display:grid;gap:6px;color:var(--texto-suave)">' +
        '<li><b style="color:var(--texto)">Riego:</b> cuando ya le toca agua según la frecuencia que elegiste.</li>' +
        '<li><b style="color:var(--texto)">Racha:</b> si llevas días seguidos y hoy no la has regado.</li></ul>' +
        '<p style="margin:0 0 16px;font-size:.84rem;color:var(--texto-tenue)">Llegan cuando abres BioNyssa o la tienes abierta en segundo plano. Puedes apagarlos cuando quieras.</p>' +
        '<div style="display:flex;gap:10px"><button type="button" class="btn btn-outline" data-n="0">Ahora no</button><button type="button" class="btn btn-primary" data-n="1">Activar avisos</button></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', async function (ev) {
        const elem = ev.target.closest('button[data-n]');
        if (!elem && ev.target !== ov) return;
        ov.remove();
        ok(elem && elem.dataset.n === '1' ? await activar() : 'default');
      });
    });
  }
  function revisar() {
    if (!activo() || !window.BioPlantas) return;
    const plantas = BioPlantas.todas().filter(function (item) { return item.siembra; });
    if (!plantas.length) return;
    const valor = leer(); valor.ult = valor.ult || {};
    const hoy = fecha(new Date());
    const estado = plantas.map(function (planta) {
      const riegos = (planta.riegos || []).slice().sort(), freq = planta.freq || 3;
      const ult = riegos[riegos.length - 1], hace = ult ? dias(ult, hoy) : null;
      const sed = ult !== hoy && (hace === null ? dias(planta.siembra, hoy) >= 1 : hace >= freq);
      let numero = 0; const dia = new Date(); dia.setDate(dia.getDate() - 1);
      while (riegos.includes(fecha(dia))) { numero++; dia.setDate(dia.getDate() - 1); }
      return { nombre: planta.nombre || 'Tu planta', hace: hace, sed: sed, racha: ult !== hoy ? numero : 0 };
    });
    const conSed = estado.filter(function (item) { return item.sed; });
    if (valor.ult.riego !== hoy && conSed.length) {
      valor.ult.riego = hoy; guardar(valor);
      if (conSed.length === 1) {
        const elemento = conSed[0];
        mostrar(elemento.nombre + ' tiene sed', elemento.hace === null ? 'Aún no anotas ningún riego.' : 'Hace ' + elemento.hace + (elemento.hace === 1 ? ' día' : ' días') + ' que no la riegas.', 'bio-riego');
      } else {
        mostrar(conSed.length + ' plantas tienen sed', conSed.map(function (item) { return item.nombre; }).join(', ') + '.', 'bio-riego');
      }
      return;
    }
    const enRacha = estado.filter(function (item) { return item.racha >= 2; });
    if (valor.ult.racha !== hoy && enRacha.length && new Date().getHours() >= 18) {
      valor.ult.racha = hoy; guardar(valor);
      const elemento2 = enRacha[0];
      mostrar('Tu racha de ' + elemento2.racha + ' días', 'Riega hoy a ' + elemento2.nombre.toLowerCase() + ' para no perderla.', 'bio-racha');
    }
  }
  if (soporta()) { setTimeout(revisar, 3000); setInterval(revisar, 30 * 60 * 1000); }
  return { soporta: soporta, activo: activo, pedir: pedir, activar: activar, desactivar: desactivar, preguntado: function () { return !!leer().pregunto; }, revisar: revisar };
})();
 } catch (err) { console.error(err); }
}
