(function () {
  (function precargar() {
    const conexion = navigator.connection;
    if (conexion && (conexion.saveData || /(^|-)2g$/.test(conexion.effectiveType || ''))) return;

    if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      const reglas = document.createElement('script');
      reglas.type = 'speculationrules';
      reglas.textContent = JSON.stringify({
        prefetch: [{ source: 'document', where: { href_matches: '/*' }, eagerness: 'eager' }]
      });
      document.head.appendChild(reglas);
      return;
    }

    const hechos = new Set();
    function precargarEnlace(e) {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank') return;
      let url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.hash && url.pathname === location.pathname) return;
      if (!/\.html?$|\/$/.test(url.pathname) || hechos.has(url.href)) return;
      hechos.add(url.href);
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = url.href;
      document.head.appendChild(l);
    }
    document.addEventListener('pointerover', precargarEnlace, { passive: true });
    document.addEventListener('touchstart', precargarEnlace, { passive: true });
  })();

  (function barra() {
    const b = document.querySelector('.topbar');
    if (!b) return;
    let pendiente = false;
    function revisar() {
      pendiente = false;
      b.classList.toggle('elevada', window.scrollY > 6);
    }
    window.addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    }, { passive: true });
    revisar();
  })();

  document.querySelectorAll('.field-error, .edit-error, #error, #editError').forEach((el) => {
    new MutationObserver(() => {
      if (!el.textContent.trim()) return;
      el.classList.remove('bio-error');
      void el.offsetWidth;
      el.classList.add('bio-error');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
;
(() => {
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
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(cargar, 300);
  else addEventListener('load', () => setTimeout(cargar, 300));
})();
;
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.menu-card, .game-card, .section-card, .card, .nivel-card, .planta-card, .reto-dia, .imp-card');
  const obs = new IntersectionObserver((lista) => {
    lista.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add('visto');
      obs.unobserve(x.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  items.forEach((el, i) => {
    el.classList.add('rv');
    el.style.setProperty('--d', (i % 6) * 70 + 'ms');
    obs.observe(el);
  });
})();
