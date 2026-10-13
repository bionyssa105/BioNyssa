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
    try { localStorage.setItem(CLAVE_TEMA, tema); } catch (e) {}
    try { if (window.BioSesion && BioSesion.obtener()) localStorage.setItem('bionyssa_tema_cuenta', tema); } catch (e) {}
  }
  function temaDeCuenta() {
    try {
      if (!(window.BioSesion && BioSesion.obtener())) return;
      const t = localStorage.getItem('bionyssa_tema_cuenta');
      if ((t !== 'dark' && t !== 'light') || t === temaActual()) return;
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(CLAVE_TEMA, t);
      pintarIconosTema();
    } catch (e) {}
  }
  function alternarTema(e) {
    const raiz = document.documentElement;
    const siguiente = temaActual() === 'dark' ? 'light' : 'dark';
    const cambiar = () => { aplicarTema(siguiente); pintarIconosTema(); };
    const reducir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducir) { cambiar(); return; }
    if (!document.startViewTransition) {
      raiz.classList.add('tema-suave');
      cambiar();
      setTimeout(() => raiz.classList.remove('tema-suave'), 500);
      return;
    }
    const btn = e && e.currentTarget;
    const r = btn ? btn.getBoundingClientRect() : { left: innerWidth - 40, top: 40, width: 0, height: 0 };
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    raiz.classList.add('cambiando-tema');
    const t = document.startViewTransition(cambiar);
    t.ready.then(() => {
      raiz.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radio + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 720, easing: 'cubic-bezier(.55,.05,.25,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    t.finished.finally(() => raiz.classList.remove('cambiando-tema'));
  }
  const ICONO_LUNA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19.6 14.3c-1.2 3.6-4.6 5.9-8.4 5.6-4.4-.4-7.6-4.2-7.3-8.5.3-3.4 2.6-6.2 5.8-7.2-1 3.4.3 7.3 3.6 9.2 2 1.1 4.2 1.2 6.3.9z"/></g></svg>';
  const ICONO_SOL = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12.1 8c2.2 0 4 1.8 3.9 4.1-.1 2.2-1.9 3.9-4.1 3.9-2.1-.1-3.9-1.9-3.8-4.1.1-2.1 1.9-3.9 4-3.9z"/><path d="M12 2.9v2.3M12.2 18.9v2.4M2.8 12.2h2.4M18.9 11.9h2.3M5.6 5.7l1.6 1.5M16.8 16.9l1.7 1.6M18.5 5.5l-1.6 1.7M7.2 16.8l-1.7 1.7"/></g></svg>';
  function pintarIconosTema() {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const oscuro = temaActual() === 'dark';
      btn.innerHTML = oscuro ? ICONO_SOL : ICONO_LUNA;
      btn.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      btn.setAttribute('title', oscuro ? 'Modo claro' : 'Modo oscuro');
    });
  }
  function enlazarBotonesTema() {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', alternarTema);
    });
    pintarIconosTema();
  }
  function inyectarToggleEnTopbar() {
    document.querySelectorAll('.topbar-row').forEach((fila) => {
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
    const limpio = (x) => String(x || '').split(/[?#]/)[0].split('/').pop().replace(/\.html?$/i, '').toLowerCase() || 'index';
    const paginaActual = limpio(location.pathname);
    document.querySelectorAll('.topbar-row').forEach((fila) => {
      if (fila.querySelector('.nav-escritorio')) return;
      const nav = document.createElement('nav');
      nav.className = 'nav-escritorio';
      enlaces.forEach(([href, texto]) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = texto;
        if (limpio(href) === paginaActual || (href === '/paginas/minijuegos.html' && paginaActual.indexOf('juego-') === 0)) {
          a.className = 'actual';
          a.setAttribute('aria-current', 'page');
        }
        nav.appendChild(a);
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
    const limpio = (x) => String(x || '').split(/[?#]/)[0].split('/').pop().replace(/\.html?$/i, '').toLowerCase() || 'index';
    const actual = limpio(location.pathname);
    if (['index', 'login', 'registro', '404'].indexOf(actual) > -1) return;
    const trazo = (d, ancho) => '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="' + (ancho || 1.7) + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</g></svg>';
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
    const esActual = (href) => limpio(href) === actual || (href === '/paginas/minijuegos.html' && actual.indexOf('juego-') === 0);
    const enMas = extra.some((e) => esActual(e[0]));
    const nav = document.createElement('nav');
    nav.className = 'nav-movil';
    nav.setAttribute('aria-label', 'Secciones');
    nav.innerHTML = principales.map((l) =>
      '<a href="' + l[0] + '"' + (esActual(l[0]) ? ' class="actual" aria-current="page"' : '') + '>' + ICONOS[l[2]] + '<span>' + l[1] + '</span></a>'
    ).join('') +
      '<button type="button" class="nav-mas' + (enMas ? ' actual' : '') + '" aria-expanded="false" aria-controls="hojaMas">' + ICONOS.mas + '<span>Más</span></button>';
    const hoja = document.createElement('div');
    hoja.className = 'hoja-mas';
    hoja.id = 'hojaMas';
    hoja.hidden = true;
    hoja.innerHTML = extra.map((l) =>
      '<a href="' + l[0] + '"' + (esActual(l[0]) ? ' class="actual" aria-current="page"' : '') + '>' + ICONOS[l[2]] + '<span>' + l[1] + '</span></a>'
    ).join('');
    document.body.appendChild(hoja);
    document.body.appendChild(nav);
    document.body.classList.add('con-nav');
    const boton = nav.querySelector('.nav-mas');
    const cerrar = () => { hoja.hidden = true; boton.setAttribute('aria-expanded', 'false'); };
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = hoja.hidden;
      hoja.hidden = !abrir;
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => { if (!hoja.hidden && !hoja.contains(e.target)) cerrar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  }
  const NOMBRES_SONIDO = ['correcto', 'incorrecto', 'ganar', 'perder'];
  const sonidos = {};
  function precargarSonidos() {
    NOMBRES_SONIDO.forEach((nombre) => {
      if (sonidos[nombre]) return;
      try {
        const a = new Audio('/assets/sonidos/' + nombre + '.mp3');
        a.preload = 'auto';
        a.volume = 0.75;
        sonidos[nombre] = a;
      } catch (e) {}
    });
  }
  function reproducir(nombre) {
    try {
      if (!sonidos[nombre]) precargarSonidos();
      const a = sonidos[nombre];
      if (!a) return;
      a.currentTime = 0;
      const promesa = a.play();
      if (promesa && promesa.catch) promesa.catch(() => {});
    } catch (e) {}
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
    const s = (texto || '').toString();
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return PALETA_AVATAR[hash % PALETA_AVATAR.length];
  }
  function esInvitado() {
    try {
      const datos = localStorage.getItem('bionyssa_sesion');
      return !datos;
    } catch (e) {
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
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) ocultarModalAuth();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') ocultarModalAuth();
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
    const o = Object.assign({ titulo: 'Aviso', mensaje: '', boton: 'Entendido', tipo: 'info' }, opciones || {});
    return new Promise((resolver) => {
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
          '<span class="modal-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (iconos[o.tipo] || iconos.info) + '</g></svg></span>' +
          '<h3 id="dialogoTitulo"></h3>' +
          '<p id="dialogoMsg"></p>' +
          '<div class="modal-actions"></div>' +
        '</div>';
      overlay.querySelector('h3').textContent = o.titulo;
      overlay.querySelector('p').textContent = o.mensaje;
      const acciones = overlay.querySelector('.modal-actions');
      function boton(texto, clase, valor) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn ' + clase; b.textContent = texto;
        b.addEventListener('click', () => cerrar(valor));
        acciones.appendChild(b);
        return b;
      }
      const principal = boton(o.boton, 'btn-primary', true);
      if (o.cancelar) boton(o.cancelar, 'btn-outline', false);
      function alTeclado(e) {
        if (e.key === 'Escape') cerrar(false);
      }
      function cerrar(valor) {
        document.removeEventListener('keydown', alTeclado);
        dialogoAbierto = null;
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 220);
        if (previo && previo.focus) previo.focus();
        resolver(valor);
      }
      dialogoAbierto = cerrar;
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(false); });
      document.addEventListener('keydown', alTeclado);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => { overlay.classList.add('show'); principal.focus(); });
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
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
(() => {
  let temporizador;
  window.BioToast = (texto) => {
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
    temporizador = setTimeout(() => el.classList.remove('show'), 2400);
  };
  const cabecera = document.querySelector('.topbar, .home-header');
  const arriba = () => scrollTo({ top: 0, behavior: 'smooth' });
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
    requestAnimationFrame(() => {
      const y = scrollY;
      if (cabecera) cabecera.classList.toggle('scrolled', y > 8);
      if (subir) subir.classList.toggle('show', y > Math.min(innerHeight * 0.8, 160));
      esperando = false;
    });
  }
  addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
  document.querySelectorAll('a[href="#"].pie-subir').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); arriba(); });
  });
})();
(() => {
  const suave = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, raiz) => (raiz || document).querySelector(s);
  function hojas(x, y, n) {
    if (suave) return;
    for (let i = 0; i < Math.min(n, 4); i++) {
      const h = document.createElement('i');
      const ang = Math.random() * 6.28;
      const dist = 30 + Math.random() * 40;
      h.className = 'hoja-vuela';
      h.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 30}px;--rot:${Math.random() * 400 - 200}deg`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1050);
    }
  }
  window.BioHojas = hojas;
  const hora = new Date().getHours();
  document.documentElement.setAttribute('data-hora', hora >= 7 && hora < 18 ? 'dia' : 'noche');
  function portada() {
    const fig = $('.home-figure');
    if (!fig) return;
    const svg = $('svg', fig);
    let riegos = 0;
    addEventListener('mousemove', (e) => {
      const estilo = document.documentElement.style;
      estilo.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
      estilo.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
    }, { passive: true });
    function gotas() {
      const r = svg.getBoundingClientRect();
      const f = fig.getBoundingClientRect();
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const g = document.createElement('i');
          g.className = 'gota-real';
          g.style.cssText = `left:${r.left - f.left + r.width * (0.3 + Math.random() * 0.3)}px;top:${r.top - f.top + r.height * 0.1}px;--cae:${r.height * 0.58}px`;
          fig.appendChild(g);
          setTimeout(() => g.remove(), 950);
        }, i * 90);
      }
    }
    function flor() {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'flor-hero');
      let petalos = '';
      for (let k = 0; k < 6; k++) petalos += `<ellipse cx="232" cy="118" rx="7" ry="13" fill="#e9a23b" transform="rotate(${k * 60} 232 128)"/>`;
      g.innerHTML = petalos + '<circle cx="232" cy="128" r="7" fill="#b87036"/>';
      svg.appendChild(g);
      const b = svg.getBoundingClientRect();
      hojas(b.left + b.width / 2, b.top, 16);
      if (window.BioPuntos) BioPuntos.dar(3, 'floreció');
    }
    svg.addEventListener('click', () => {
      gotas();
      if (riegos < 5) {
        riegos++;
        [fig, svg, $('.il-planta', svg)].filter(Boolean).forEach((el) => el.style.setProperty('--crece', 1 + riegos * 0.07));
      }
      if (riegos === 5 && !$('.flor-hero', svg)) flor();
    });
  }
  function secreto() {
    if (suave) return;
    let letras = '';
    addEventListener('keydown', (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      letras = (letras + e.key.toLowerCase()).slice(-6);
      if (letras !== 'planta') return;
      for (let i = 0; i < 40; i++) {
        setTimeout(() => {
          const h = document.createElement('i');
          h.className = 'lluvia-hojas';
          h.style.cssText = `left:${Math.random() * 100}vw;--dx:${Math.random() * 120 - 60}px;animation-duration:${2.5 + Math.random() * 2.5}s`;
          document.body.appendChild(h);
          setTimeout(() => h.remove(), 5200);
        }, Math.random() * 1800);
      }
      if (window.BioToast) BioToast('Encontraste el secreto');
    });
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-primary') && !e.target.closest('.regar')) hojas(e.clientX, e.clientY, 6);
  });
  portada();
  secreto();
})();
(() => {
  const $ = (s, raiz) => (raiz || document).querySelector(s);
  const LLAVE = 'bionyssa_puntos';
  const NIVELES = [['Semilla', 0], ['Brote', 30], ['Planta', 80], ['Árbol', 160]];
  const GANA = [
    ['+1', 'Entrar a BioNyssa cada día'],
    ['+5', 'Terminar una partida en Minijuegos'],
    ['+5', 'Anotar un riego en Mi planta'],
    ['+3', 'Regar y hacer florecer la planta de la portada']
  ];
  const leer = () => { try { return JSON.parse(localStorage.getItem(LLAVE)) || { p: 0, dia: '' }; } catch (e) { return { p: 0, dia: '' }; } };
  const guardar = (d) => { try { localStorage.setItem(LLAVE, JSON.stringify(d)); } catch (e) {} };
  const nivel = (p) => NIVELES.reduce((mejor, n, k) => (p >= n[1] ? k : mejor), 0);
  const listaGana = () => '<ul class="gana-lista">' + GANA.map((g) => '<li><b>' + g[0] + '</b><span>' + g[1] + '</span></li>').join('') + '</ul>';
  function avance(p) {
    const i = nivel(p);
    const sig = NIVELES[i + 1];
    return { i, sig, pct: sig ? (p - NIVELES[i][1]) / (sig[1] - NIVELES[i][1]) * 100 : 100 };
  }
  function pintar() {
    const { p } = leer();
    const { i, sig, pct } = avance(p);
    document.querySelectorAll('.puntos-chip').forEach((c) => {
      c.lastChild.innerHTML = '<em>' + NIVELES[i][0] + ' | </em>' + p + ' pts';
    });
    const barra = $('.nivel-barra b');
    if (!barra) return;
    barra.style.width = pct + '%';
    const txt = $('#nivelTxt');
    if (txt) txt.textContent = sig ? 'Te faltan ' + (sig[1] - p) + ' puntos para ser ' + sig[0] + '.' : 'Llegaste al máximo. Eres un árbol.';
    document.querySelectorAll('.nivel-lista span').forEach((s, k) => s.classList.toggle('ok', k <= i));
  }
  window.BioPuntos = {
    dar(n, motivo) {
      const d = leer();
      const antes = nivel(d.p);
      d.p += n;
      guardar(d);
      pintar();
      document.querySelectorAll('.puntos-chip').forEach((c) => {
        c.classList.remove('sube');
        void c.offsetWidth;
        c.classList.add('sube');
      });
      const ahora = nivel(d.p);
      if (window.BioToast) BioToast(ahora > antes ? '¡Subiste a ' + NIVELES[ahora][0] + '!' : '+' + n + ' pts' + (motivo ? ' | ' + motivo : ''));
    }
  };
  function chip() {
    const fila = $('.head-cta') || $('.topbar-row');
    if (!fila || $('.home-header')) return;
    const c = document.createElement('a');
    c.className = 'puntos-chip';
    c.href = '/paginas/menu.html';
    c.innerHTML = '<i></i><span></span>';
    const alInicio = fila.firstChild.classList && fila.classList.contains('head-cta');
    fila.insertBefore(c, alInicio ? fila.firstChild : $('.theme-toggle', fila));
  }
  function tarjetaMenu() {
    const rejilla = $('.menu-grid');
    if (!rejilla) return;
    const t = document.createElement('div');
    t.className = 'nivel-card';
    const sesion = window.BioSesion && BioSesion.obtener();
    t.innerHTML = '<h3>Tu nivel</h3><p id="nivelTxt"></p><div class="nivel-barra"><b></b></div><div class="nivel-lista">' +
      NIVELES.map((n) => '<span>' + n[0] + '</span>').join('') + '</div><h4 class="gana-tit">Cómo ganar puntos</h4>' + listaGana() +
      '<p class="gana-nota">' + (sesion ? 'Tus puntos se guardan en tu cuenta.' : 'Como invitado, los puntos se quedan en este dispositivo. Crea una cuenta para no perderlos.') + '</p>';
    rejilla.parentNode.insertBefore(t, rejilla.nextSibling);
  }
  function ventana() {
    const c = $('.puntos-chip');
    if (!c) return;
    const enMenu = !!$('.nivel-card');
    const pop = document.createElement('div');
    pop.className = 'puntos-pop';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Cómo funcionan los puntos');
    document.body.appendChild(pop);
    c.setAttribute('aria-haspopup', 'dialog');
    c.setAttribute('aria-expanded', 'false');
    c.title = 'Cómo funcionan los puntos';
    function llenar() {
      const { p } = leer();
      const { i, sig, pct } = avance(p);
      pop.innerHTML = '<strong class="pp-nivel">Tu nivel: ' + NIVELES[i][0] + '</strong>' +
        '<p class="pp-sub">' + p + ' pts | ' + (sig ? 'te faltan ' + (sig[1] - p) + ' para ser ' + sig[0] + '.' : 'llegaste al máximo.') + '</p>' +
        '<div class="pp-barra"><b style="width:' + pct + '%"></b></div>' +
        '<h4>Cómo ganar puntos</h4>' + listaGana() +
        '<p class="pp-niveles">' + NIVELES.map((n) => n[0] + ' ' + n[1]).join(' | ') + '</p>' +
        (enMenu ? '' : '<a class="pp-link" href="/paginas/menu.html">Ver mi nivel en el menú</a>');
    }
    function colocar() {
      const r = c.getBoundingClientRect();
      const ancho = pop.offsetWidth;
      pop.style.top = (r.bottom + 10) + 'px';
      pop.style.left = Math.max(12, Math.min(r.right - ancho, innerWidth - ancho - 12)) + 'px';
    }
    function cerrar() {
      pop.hidden = true;
      c.setAttribute('aria-expanded', 'false');
    }
    c.addEventListener('click', (e) => {
      e.preventDefault();
      if (!pop.hidden) return cerrar();
      llenar();
      pop.hidden = false;
      colocar();
      c.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', (e) => {
      if (!pop.hidden && !e.target.closest('.puntos-pop') && !e.target.closest('.puntos-chip')) cerrar();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    addEventListener('resize', cerrar);
  }
  chip();
  const hoy = new Date().toDateString();
  const d0 = leer();
  if (d0.dia !== hoy) {
    d0.dia = hoy;
    guardar(d0);
    setTimeout(() => BioPuntos.dar(1, 'visita del día'), 900);
  }
  tarjetaMenu();
  pintar();
  ventana();
  const guardarOriginal = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    guardarOriginal.call(this, k, v);
    if (k === 'bionyssa_progreso') setTimeout(() => BioPuntos.dar(5, 'partida jugada'), 300);
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#bRiego');
    if (!b || b.disabled) return;
    setTimeout(() => {
      BioPuntos.dar(5, 'riego');
      if (window.BioHojas) BioHojas(e.clientX, e.clientY, 8);
    }, 60);
  });
})();
(() => {
  const $ = (s, raiz) => (raiz || document).querySelector(s);
  const fecha = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const lee = (k, base) => { try { return JSON.parse(localStorage.getItem(k)) || base; } catch (e) { return base; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
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
    const caja = $('#acordeon');
    if (!caja) return;
    const LLAVE = 'bionyssa_guia';
    const pasos = [...caja.querySelectorAll('.acc-item')];
    const hechos = lee(LLAVE, []);
    const prog = document.createElement('div');
    prog.className = 'guia-prog';
    prog.innerHTML = '<p></p><div class="nivel-barra"><b></b></div>';
    caja.parentNode.insertBefore(prog, caja);
    const barra = $('b', prog);
    function pintar() {
      const n = hechos.filter(Boolean).length;
      $('p', prog).textContent = n + ' de ' + pasos.length + ' pasos hechos';
      barra.style.width = n / pasos.length * 100 + '%';
      pasos.forEach((paso, i) => {
        paso.classList.toggle('hecho', !!hechos[i]);
        const b = $('.hacer-paso', paso);
        if (b) b.textContent = hechos[i] ? 'Desmarcar paso' : 'Ya hice este paso';
      });
    }
    pasos.forEach((paso, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-outline btn-sm hacer-paso';
      $('.acc-panel-inner', paso).appendChild(b);
      b.addEventListener('click', (e) => {
        hechos[i] = !hechos[i];
        guarda(LLAVE, hechos);
        pintar();
        if (!hechos[i]) return;
        if (window.BioHojas) BioHojas(e.clientX, e.clientY, 10);
        if (window.BioPuntos) {
          const todos = hechos.filter(Boolean).length === pasos.length;
          BioPuntos.dar(todos ? 10 : 2, todos ? 'guía completa' : 'paso hecho');
        }
      });
    });
    setTimeout(() => { barra.style.width = '0'; pintar(); }, 50);
  }
  function retoDelDia() {
    const panel = $('.timeline-panel');
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
      let n = 0;
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      if (!datos.dias.includes(fecha(d))) d.setDate(d.getDate() - 1);
      while (datos.dias.includes(fecha(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }
    function semana() {
      const LETRAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
        html += '<span class="rd-dia' + (datos.dias.includes(fecha(d)) ? ' on' : '') + (i === 0 ? ' hoy' : '') + '"><i></i>' + LETRAS[d.getDay()] + '</span>';
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
      $('#rdBtn', caja).addEventListener('click', () => {
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
    const lista = $('.game-list');
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
const BioSesion = window.BioSesion = (function () {
  const CLAVE = 'bionyssa_sesion';
  function obtener() {
    try {
      const datos = localStorage.getItem(CLAVE);
      return datos ? JSON.parse(datos) : null;
    } catch (e) {
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
    const letras = partes.slice(0, 2).map((p) => p[0].toUpperCase());
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
(() => {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => {
      navigator.serviceWorker.register('/js/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registro) => registro.update())
        .catch(() => {});
    });
  }
  if (/offline\.html$/.test(location.pathname)) return;
  let preguntando = false;
  async function sinRedReal() {
    try {
      await fetch('/manifest.webmanifest?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(4000) });
      return false;
    } catch (e) { return true; }
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
    try { sessionStorage.setItem('bio_volver', location.href); } catch (e) {}
    location.href = '/paginas/offline.html';
  }
  addEventListener('offline', () => {
    setTimeout(async () => {
      if (preguntando || !(await sinRedReal()) || preguntando) return;
      preguntando = true;
      preguntar();
    }, 3000);
  });
})();
(() => {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.addEventListener('pointermove', (evento) => {
    const tarjeta = evento.target.closest && evento.target.closest('.menu-card, .game-card');
    if (!tarjeta) return;
    const caja = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty('--mx', (evento.clientX - caja.left) + 'px');
    tarjeta.style.setProperty('--my', (evento.clientY - caja.top) + 'px');
  }, { passive: true });
})();
