// cierre
if (['offline'].indexOf(paginaActual) === -1) {
 try {
(function () {
  (function precargar() {
    const conexion = navigator.connection;
    if (conexion && (conexion.saveData || /(^|-)2g$/.test(conexion.effectiveType || ''))) return;
    if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      const reglas = document.createElement('script');
      reglas.type = 'speculationrules';
      reglas.textContent = JSON.stringify({
        prefetch: [{ source: 'document', where: { href_matches: '/*' }, eagerness: 'moderate' }]
      });
      document.head.appendChild(reglas);
      return;
    }
    const hechos = new Set();
    function precargarEnlace(ev) {
      const elem = ev.target.closest && ev.target.closest('a[href]');
      if (!elem || elem.target === '_blank') return;
      let url;
      try { url = new URL(elem.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.hash && url.pathname === location.pathname) return;
      if (!/\.html?$|\/$/.test(url.pathname) || hechos.has(url.href)) return;
      hechos.add(url.href);
      const elem2 = document.createElement('link');
      elem2.rel = 'prefetch';
      elem2.href = url.href;
      document.head.appendChild(elem2);
    }
    document.addEventListener('pointerover', precargarEnlace, { passive: true });
    document.addEventListener('touchstart', precargarEnlace, { passive: true });
  })();
  (function barra() {
    const elem = document.querySelector('.topbar');
    if (!elem) return;
    let pendiente = false;
    function revisar() {
      pendiente = false;
      elem.classList.toggle('elevada', window.scrollY > 6);
    }
    window.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    }, { passive: true });
    revisar();
  })();
  document.querySelectorAll('.field-error, .edit-error, #error, #editError').forEach(function (el) {
    new MutationObserver(function () {
      if (!el.textContent.trim()) return;
      el.classList.remove('bio-error');
      void el.offsetWidth;
      el.classList.add('bio-error');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
(function () {
  const ID = 'G-ZQGQ8DJREX';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const noRastrear = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (local || noRastrear || /\/admin\.html$/.test(location.pathname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  function cargar() {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(script);
  }
  if (document.readyState === 'complete') setTimeout(cargar, 300);
  else addEventListener('load', function () { return setTimeout(cargar, 300); });
})();
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.menu-card, .game-card, .section-card, .card, .nivel-card, .planta-card, .reto-dia, .imp-card');
  const obs = new IntersectionObserver(function (lista) {
    lista.forEach(function (item) {
      if (!item.isIntersecting) return;
      item.target.classList.add('visto');
      obs.unobserve(item.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  items.forEach(function (el, i) {
    el.classList.add('rv');
    el.style.setProperty('--d', (i % 6) * 70 + 'ms');
    obs.observe(el);
  });
})();
 } catch (err) { console.error(err); }
}

// inicio
if (['inicio'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const mascota = document.getElementById('mascota');
  const globo = document.getElementById('mascotaGlobo');
  const imagen = document.getElementById('mascotaImg');
  if (!mascota || !globo || !imagen) return;
  const tipeo = globo.querySelector('.g-tipeo');
  const fantasma = globo.querySelector('.g-fantasma');
  const lector = globo.querySelector('.g-lector');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const POSES = [
    ['/assets/img/bio-saluda.webp', 63],
    ['/assets/img/bio-lupa.webp', 55],
    ['/assets/img/bio-brazos.webp', 88]
  ];
  const DATOS = [
    '¡Hola! Soy Bio. ¿Sabías que una bolsa sembrada puede dar una planta?',
    'Una lata tarda unos 200 años en desaparecer. Mejor recíclala.',
    'El cartón limpio se recicla hasta 7 veces.',
    'Antes de tirar una pila, busca un punto de acopio.',
    'Una botella de plástico puede volverse una playera.',
    'Si la bolsa va a la tierra, la tierra te lo agradece.',
    'Separar en casa toma menos de un minuto.'
  ];
  let actual = 0;
  let temporizador = null;
  function hablar(texto) {
    clearTimeout(temporizador);
    fantasma.textContent = texto;
    lector.textContent = texto;
    if (reducido) { tipeo.textContent = texto; return; }
    let numero = 0;
    mascota.classList.add('hablando');
    (function letra() {
      numero++;
      tipeo.textContent = texto.slice(0, numero);
      if (numero >= texto.length) { mascota.classList.remove('hablando'); return; }
      temporizador = setTimeout(letra, /[.,!?¡¿]/.test(texto[numero - 1]) ? 150 : 28);
    })();
  }
  function terminar() {
    clearTimeout(temporizador);
    tipeo.textContent = fantasma.textContent;
    mascota.classList.remove('hablando');
  }
  mascota.addEventListener('click', function () {
    if (mascota.classList.contains('hablando')) return terminar();
    actual = (actual + 1) % DATOS.length;
    const [src, ancho] = POSES[actual % POSES.length];
    imagen.src = src;
    imagen.width = ancho;
    imagen.height = 132;
    hablar(DATOS[actual]);
    mascota.classList.remove('salta');
    void mascota.offsetWidth;
    mascota.classList.add('salta');
  });
  setTimeout(function () { return hablar(DATOS[0]); }, 700);
})();
(function () {
  var enlace = document.getElementById('entrarInvitado');
  if (!enlace) return;
  enlace.addEventListener('click', function () {
    BioSesion.entrarInvitado();
  });
})();
 } catch (err) { console.error(err); }
}
