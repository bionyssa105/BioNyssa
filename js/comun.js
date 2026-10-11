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
