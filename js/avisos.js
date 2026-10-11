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
