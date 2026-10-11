(function () {
  const $ = (id) => document.getElementById(id);
  const tablero = $('tablero');
  const elMov = $('movs');
  const elTiempo = $('tiempo');
  const elPares = $('pares');
  const progreso = $('progreso');
  const barra = $('barraProg');
  const dato = $('dato');
  const datoTitulo = $('datoTitulo');
  const datoTexto = $('datoTexto');
  const etapaJuego = $('etapaJuego');
  const etapaRes = $('etapaResultado');

  const RESIDUOS = BioJuego.residuos;
  const TOTAL = RESIDUOS.length;

  let abiertas = [];
  let bloqueo = false;
  let movs = 0;
  let hallados = 0;
  let seg = 0;
  let reloj = null;
  let empezo = false;
  let tDato = null;
  const vibrar = (p) => { if (navigator.vibrate) navigator.vibrate(p); };
  const ocultaDato = () => { clearTimeout(tDato); dato.classList.remove('show'); };
  dato.addEventListener('click', ocultaDato);

  RESIDUOS.forEach((r) => { const i = new Image(); i.src = r.img; });

  function iniciarReloj() {
    if (reloj) return;
    reloj = setInterval(() => {
      seg += 1;
      elTiempo.textContent = BioJuego.formatoTiempo(seg);
    }, 1000);
  }

  function pararReloj() {
    clearInterval(reloj);
    reloj = null;
  }

  BioTutorial.iniciar({
    clave: 'bionyssa_tuto_memorama_v1',
    subtitulo: 'Memorama verde: encuentra los pares',
    mision: 'Hay cinco residuos y cada uno aparece dos veces. Voltea las cartas de dos en dos hasta encontrar todas las parejas.',
    subReglas: 'Así se juega',
    reglas: [
      ['ok', 'Toca una carta para voltearla y luego otra para buscar su pareja.'],
      ['ok', 'Si son iguales se quedan descubiertas y aprendes algo del residuo.'],
      ['bad', 'Si no coinciden, se voltean de nuevo: intenta recordar dónde estaban.'],
      ['ok', 'Con 7 movimientos o menos ganas tres estrellas.']
    ],
    textoSonido: 'Cada pareja que encuentras suena, y al terminar suena la victoria.',
    alBloquear: () => { etapaJuego.classList.add('juego-bloqueado'); etapaJuego.inert = true; pararReloj(); },
    alLiberar: () => {
      etapaJuego.classList.remove('juego-bloqueado');
      etapaJuego.inert = false;
      if (empezo && hallados < TOTAL) iniciarReloj();
    }
  });

  function armar() {
    pararReloj();
    seg = 0; movs = 0; hallados = 0; abiertas = []; bloqueo = false; empezo = false;
    elMov.textContent = '0';
    elTiempo.textContent = '0:00';
    elPares.textContent = '0/' + TOTAL;
    progreso.textContent = 'Toca una carta para empezar';
    barra.style.width = '0%';
    ocultaDato();
    dato.classList.remove('ok');

    tablero.innerHTML = '';
    BioJuego.barajar(RESIDUOS.concat(RESIDUOS)).forEach((r, i) => {
      const carta = document.createElement('button');
      carta.type = 'button';
      carta.className = 'carta';
      carta.dataset.nombre = r.nombre;
      carta.style.setProperty('--i', i);
      carta.setAttribute('aria-label', 'Carta boca abajo');
      carta.innerHTML =
        '<span class="carta-int">' +
          '<span class="carta-cara carta-dorso"></span>' +
          '<span class="carta-cara carta-frente"><img src="' + r.img + '" alt="' + r.nombre + '" draggable="false"></span>' +
        '</span>';
      carta.addEventListener('click', () => voltear(carta));
      tablero.appendChild(carta);
    });

    etapaRes.style.display = 'none';
    etapaJuego.style.display = 'block';
  }

  function voltear(carta) {
    if (bloqueo || carta.classList.contains('volteada') || carta.classList.contains('hallada')) return;
    if (!empezo) { empezo = true; iniciarReloj(); progreso.textContent = 'Pares encontrados: 0 de ' + TOTAL; }

    carta.classList.add('volteada');
    carta.setAttribute('aria-label', carta.dataset.nombre);
    abiertas.push(carta);

    if (abiertas.length === 2) {
      movs += 1;
      elMov.textContent = movs;
      comparar();
    }
  }

  function comparar() {
    const a = abiertas[0];
    const b = abiertas[1];

    if (a.dataset.nombre === b.dataset.nombre) {
      a.classList.add('hallada');
      b.classList.add('hallada');
      abiertas = [];
      hallados += 1;
      elPares.textContent = hallados + '/' + TOTAL;
      progreso.textContent = 'Pares encontrados: ' + hallados + ' de ' + TOTAL;
      barra.style.width = (hallados / TOTAL * 100) + '%';
      if (window.BioComun) BioComun.reproducir('correcto');

      const r = RESIDUOS.find((x) => x.nombre === a.dataset.nombre);
      datoTitulo.textContent = r.nombre;
      datoTexto.textContent = r.dato;
      BioJuego.reiniciarAnimacion(dato, 'show');
      dato.classList.add('ok');
      clearTimeout(tDato);
      tDato = setTimeout(ocultaDato, 2800);
      vibrar(14);

      if (hallados === TOTAL) setTimeout(terminar, 1000);
      return;
    }

    bloqueo = true;
    vibrar([30, 30, 30]);
    a.classList.add('error');
    b.classList.add('error');
    setTimeout(() => {
      [a, b].forEach((c) => {
        c.classList.remove('volteada', 'error');
        c.setAttribute('aria-label', 'Carta boca abajo');
      });
      abiertas = [];
      bloqueo = false;
    }, 850);
  }

  function terminar() {
    pararReloj();
    const nEstrellas = movs <= 7 ? 3 : movs <= 10 ? 2 : 1;
    const guardado = BioJuego.registrar('memorama', { gano: true, valor: movs, menor: true });

    etapaJuego.style.display = 'none';
    etapaRes.style.display = 'block';
    etapaRes.scrollIntoView({ block: 'center', behavior: 'smooth' });
    $('iconoResultado').innerHTML = BioJuego.estrellas(nEstrellas);
    $('textoResultado').textContent = 'Encontraste los ' + TOTAL + ' pares en ' + movs + ' movimientos.';
    $('resStats').innerHTML =
      '<div><strong>' + movs + '</strong><span>Movimientos</span></div>' +
      '<div><strong>' + BioJuego.formatoTiempo(seg) + '</strong><span>Tiempo</span></div>' +
      '<div><strong>' + guardado.juego.mejor + '</strong><span>Mejor marca</span></div>';
    $('avisoRecord').hidden = !guardado.nuevoRecord;

    if (window.BioComun) BioComun.reproducir('ganar');
    BioJuego.confeti();
  }

  $('btnReintentar').addEventListener('click', armar);
  armar();
})();
