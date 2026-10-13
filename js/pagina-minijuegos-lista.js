(() => {
  const $ = (id) => document.getElementById(id);
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DATOS = [
    'Una bolsa de tela puede reemplazar cientos de bolsas de plástico de un solo uso.',
    'El aluminio se puede reciclar muchas veces sin perder calidad.',
    'Cerrar la llave al cepillarte los dientes ahorra varios litros de agua cada vez.',
    'Las pilas contienen metales que contaminan el suelo y el agua: llévalas a un punto de acopio.',
    'Los árboles absorben dióxido de carbono, dan sombra y son casa de aves e insectos.',
    'El cartón se puede reciclar si está limpio y seco.',
    'Muchos plásticos tardan cientos de años en degradarse.',
    'BioNyssa es una bolsa orgánica y biodegradable: en lugar de ir a la basura, se planta.'
  ];
  const partidasTexto = (n) => n + (n === 1 ? ' partida' : ' partidas');
  let partidas = 0, victorias = 0, racha = 0;
  ['trivia', 'clasificar', 'memorama'].forEach((id) => {
    const r = BioJuego.resumen(id);
    if (!r) return;
    partidas += r.partidas;
    victorias += r.victorias;
    racha = Math.max(racha, r.racha || 0);
    const caja = document.querySelector('[data-mejor="' + id + '"]');
    if (!caja) return;
    caja.classList.add('hay');
    if (r.mejor === null) caja.textContent = 'Sin victorias · ' + partidasTexto(r.partidas);
    else caja.textContent = 'Mejor: ' + r.mejor + (id === 'memorama' ? ' mov.' : ' pts');
  });
  function contar(el, meta) {
    if (reducir || meta === 0) { el.textContent = meta; return; }
    const inicio = performance.now();
    (function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / 700);
      el.textContent = Math.round(meta * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(paso);
    })(inicio);
  }
  contar($('stPartidas'), partidas);
  contar($('stVictorias'), victorias);
  contar($('stRacha'), racha);
  if (partidas > 0) {
    $('arcadeMensaje').textContent = victorias > 0
      ? 'Has ganado ' + victorias + ' de ' + partidasTexto(partidas) + '. ¡Sigue cuidando al planeta!'
      : 'Llevas ' + partidasTexto(partidas) + '. Con el siguiente intento se puede.';
  }
  const dato = $('datoDia');
  let actual = Math.floor(Math.random() * DATOS.length);
  dato.textContent = DATOS[actual];
  $('otroDato').addEventListener('click', () => {
    let nuevo;
    do { nuevo = Math.floor(Math.random() * DATOS.length); } while (nuevo === actual);
    actual = nuevo;
    if (reducir) { dato.textContent = DATOS[actual]; return; }
    dato.classList.add('cambia');
    setTimeout(() => { dato.textContent = DATOS[actual]; dato.classList.remove('cambia'); }, 180);
  });
  document.querySelectorAll('.game-card[data-desde]').forEach((tarjeta) => {
    const dias = (Date.now() - new Date(tarjeta.dataset.desde + 'T00:00:00').getTime()) / 864e5;
    const arte = tarjeta.querySelector('.game-art');
    if (!arte || !(dias >= 0 && dias < 7)) return;
    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta-nuevo';
    etiqueta.textContent = 'Nuevo';
    arte.appendChild(etiqueta);
  });
})();
