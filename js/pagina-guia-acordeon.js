(() => {
  const items = [...document.querySelectorAll('#acordeon .acc-item, #preguntas .acc-item')];
  const sinScroll = !!document.querySelector('#preguntas');

  function cerrar(item) {
    item.classList.remove('open');
    item.querySelector('.acc-panel').style.maxHeight = null;
    item.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
  }

  function onda(boton, e) {
    const caja = boton.getBoundingClientRect();
    boton.style.setProperty('--rx', (e.detail ? e.clientX - caja.left : caja.width / 2) + 'px');
    boton.style.setProperty('--ry', (e.detail ? e.clientY - caja.top : caja.height / 2) + 'px');
    boton.classList.remove('onda');
    void boton.offsetWidth;
    boton.classList.add('onda');
    setTimeout(() => boton.classList.remove('onda'), 650);
  }

  items.forEach((item, i) => {
    const boton = item.querySelector('.acc-trigger');
    const panel = item.querySelector('.acc-panel');
    boton.setAttribute('aria-expanded', 'false');

    boton.addEventListener('click', (e) => {
      const estabaAbierto = item.classList.contains('open');
      items.forEach(cerrar);
      onda(boton, e);
      if (estabaAbierto) return;
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      boton.setAttribute('aria-expanded', 'true');
      if (!sinScroll) setTimeout(() => item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 380);
    });

    boton.addEventListener('keydown', (e) => {
      const paso = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (!paso) return;
      e.preventDefault();
      items[(i + paso + items.length) % items.length].querySelector('.acc-trigger').focus();
    });
  });
})();
