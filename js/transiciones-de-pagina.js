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
