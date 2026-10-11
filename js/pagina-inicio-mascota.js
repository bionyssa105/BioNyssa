(() => {
  const mascota = document.getElementById('mascota');
  const globo = document.getElementById('mascotaGlobo');
  const imagen = document.getElementById('mascotaImg');
  if (!mascota || !globo || !imagen) return;

  const tipeo = globo.querySelector('.g-tipeo');
  const fantasma = globo.querySelector('.g-fantasma');
  const lector = globo.querySelector('.g-lector');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const POSES = [
    ['assets/img/bio-saluda.webp', 63],
    ['assets/img/bio-lupa.webp', 55],
    ['assets/img/bio-brazos.webp', 88]
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

    let n = 0;
    mascota.classList.add('hablando');
    (function letra() {
      n++;
      tipeo.textContent = texto.slice(0, n);
      if (n >= texto.length) { mascota.classList.remove('hablando'); return; }
      temporizador = setTimeout(letra, /[.,!?¡¿]/.test(texto[n - 1]) ? 150 : 28);
    })();
  }

  function terminar() {
    clearTimeout(temporizador);
    tipeo.textContent = fantasma.textContent;
    mascota.classList.remove('hablando');
  }

  mascota.addEventListener('click', () => {
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

  setTimeout(() => hablar(DATOS[0]), 700);
})();
