// juegos
if (['juego-clasificar', 'juego-memorama', 'juego-trivia', 'minijuegos'].indexOf(paginaActual) > -1) {
 try {
window.BioTutorial = (function () {
  const REGLAS = [
    ['ok', 'Cada respuesta correcta reduce la contaminación un 10%.'],
    ['bad', 'Cada respuesta incorrecta la aumenta un 10%.'],
    ['ok', 'Si termina en 60% o menos (o llegas a 0%), ¡salvas el planeta!'],
    ['bad', 'Si llega a 100%, el planeta se destruye y pierdes.']
  ];
  const POSES = {
    saluda: ['/assets/img/bio-saluda.webp', 63, 132],
    lupa: ['/assets/img/bio-lupa.webp', 55, 132],
    brazos: ['/assets/img/bio-brazos.webp', 88, 132]
  };
  const FRASES = {
    bienvenida: '¡Hola! Soy Bio. Te explico en un momentito cómo se juega.',
    reglas: 'Mira las reglas con lupa para que no se te escape ninguna.',
    practica: '¡Ahora te toca a ti! Practica una vez conmigo, no cuenta para tu resultado.',
    ayuda: '¿Se te olvidó algo? Aquí te lo recuerdo.'
  };
  const PINTA_POSE = { bienvenida: 'saluda', reglas: 'lupa', practica: 'brazos', ayuda: 'saluda' };
  const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICONO_CURSOR = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2l15 9.2-6.6 1.6 3.9 6.8-2.8 1.6-3.9-6.8L5.2 19Z" fill="#fff" stroke="#222214" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const MINI_HOJA = '<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 29V15"/><path d="M16 16.5C15.6 11.8 12 9 6.4 9.2c.2 5 3.6 8 9.6 7.3Z"/><path d="M16.4 14.6C17 10 20.4 7.2 25.6 7.4c.1 4.8-3.1 7.6-9.2 7.2Z"/></svg>';
  const MINI_LATA = '<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="5" width="14" height="22" rx="4"/><path d="M9 11h14M9 21h14"/></svg>';
  const MINI_DORSO = '<svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="#fcfbf6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" opacity=".7"><path d="M16 29V15"/><path d="M16 16.5C15.6 11.8 12 9 6.4 9.2c.2 5 3.6 8 9.6 7.3Z"/><path d="M16.4 14.6C17 10 20.4 7.2 25.6 7.4c.1 4.8-3.1 7.6-9.2 7.2Z"/></svg>';
  const ICONO_SONIDO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M17 9a4 4 0 0 1 0 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  function iniciar(cfg) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'tutoTitulo');
    const tarjeta = document.createElement('div');
    tarjeta.className = 'modal-card tuto-card';
    overlay.appendChild(tarjeta);
    document.body.appendChild(overlay);
    let modo = 'guia';
    let paso = 0;
    let practicado = false;
    let temporizador = null;
    let corrida = 0;
    let punta = [0, 0];
    const frasesCfg = cfg.frases || {};
    const cabecera = function (titulo, sub, momento) {
      const pose = POSES[PINTA_POSE[momento]];
      const frase = frasesCfg[momento] || FRASES[momento];
      return '<div class="tuto-habla">' +
        '<img class="tuto-bio" src="' + pose[0] + '" width="' + pose[1] + '" height="' + pose[2] + '" alt="Bio, la mascota de BioNyssa">' +
        '<div class="tuto-globo" title="Toca para ver todo el mensaje">' +
          '<span class="tuto-globo-nombre">Bio</span>' +
          '<p class="tuto-dialogo"><span class="tuto-tipeo" aria-hidden="true" data-texto="' + frase.replace(/"/g, '&quot;') + '"></span>' +
          '<span class="tuto-solo-lector">' + frase + '</span></p>' +
        '</div></div>' +
        '<h3 id="tutoTitulo">' + titulo + '</h3><p class="tuto-sub">' + sub + '</p>';
    };
    function terminarDialogo() {
      clearTimeout(temporizador);
      const el = tarjeta.querySelector('.tuto-tipeo');
      const img = tarjeta.querySelector('.tuto-bio');
      if (el) el.textContent = el.dataset.texto;
      if (img) img.classList.remove('hablando');
    }
    function hablar() {
      clearTimeout(temporizador);
      const el = tarjeta.querySelector('.tuto-tipeo');
      const img = tarjeta.querySelector('.tuto-bio');
      if (!el) return;
      const texto = el.dataset.texto;
      if (reducido) { el.textContent = texto; return; }
      let i = 0;
      if (img) img.classList.add('hablando');
      (function letra() {
        i++;
        el.textContent = texto.slice(0, i);
        if (i < texto.length) {
          temporizador = setTimeout(letra, /[.,!?¡¿]/.test(texto.charAt(i - 1)) ? 150 : 28);
        } else if (img) {
          img.classList.remove('hablando');
        }
      })();
    }
    const pausa = function (ms) { return new Promise(function (resultado) { return setTimeout(resultado, ms); }); };
    const tiempoTexto = function (lista) { return lista.length * 28 + (lista.match(/[.,!?¡¿]/g) || []).length * 120 + 500; };
    function decir(texto, pose) {
      const el = tarjeta.querySelector('.tuto-tipeo');
      if (!el) return Promise.resolve();
      const lector = tarjeta.querySelector('.tuto-solo-lector');
      const img = tarjeta.querySelector('.tuto-bio');
      el.dataset.texto = texto;
      if (lector) lector.textContent = texto;
      if (pose && img && POSES[pose]) { img.src = POSES[pose][0]; img.width = POSES[pose][1]; img.height = POSES[pose][2]; }
      hablar();
      return pausa(tiempoTexto(texto));
    }
    function posicion(el, fx, fy) {
      const valor = tarjeta.getBoundingClientRect();
      const resultado = el.getBoundingClientRect();
      return [resultado.left - valor.left - tarjeta.clientLeft + tarjeta.scrollLeft + resultado.width * fx, resultado.top - valor.top - tarjeta.clientTop + tarjeta.scrollTop + resultado.height * fy];
    }
    async function ir(el, fx, fy) {
      const elem = tarjeta.querySelector('.tuto-cursor');
      if (!elem || !el) return;
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      await pausa(260);
      punta = posicion(el, fx === undefined ? 0.55 : fx, fy === undefined ? 0.6 : fy);
      elem.style.transform = 'translate(' + (punta[0] - 4) + 'px,' + (punta[1] - 2) + 'px)';
      elem.classList.add('ver');
      await pausa(950);
    }
    async function toca(el) {
      const elem = tarjeta.querySelector('.tuto-cursor');
      if (!elem || !el) return;
      elem.classList.add('clic');
      const onda = document.createElement('span');
      onda.className = 'tuto-onda';
      onda.style.left = punta[0] + 'px';
      onda.style.top = punta[1] + 'px';
      tarjeta.appendChild(onda);
      setTimeout(function () { return onda.remove(); }, 700);
      el.classList.add('tuto-toque');
      await pausa(240);
      elem.classList.remove('clic');
      setTimeout(function () { return el.classList.remove('tuto-toque'); }, 800);
      await pausa(300);
    }
    async function demo() {
      if (reducido) return;
      const mia = ++corrida;
      const vivo = function () { return mia === corrida && modo === 'ayuda' && overlay.classList.contains('show'); };
      const caja = document.createElement('div');
      caja.className = 'tuto-cursor';
      caja.setAttribute('aria-hidden', 'true');
      caja.innerHTML = ICONO_CURSOR;
      tarjeta.appendChild(caja);
      caja.style.transition = 'none';
      caja.style.transform = 'translate(' + (tarjeta.clientWidth - 46) + 'px,70px)';
      void caja.offsetWidth;
      caja.style.transition = '';
      const inicial = tarjeta.querySelector('.tuto-tipeo');
      await pausa(inicial ? tiempoTexto(inicial.dataset.texto) : 1500);
      if (!vivo()) return;
      const mision = tarjeta.querySelector('.tuto-mision');
      if (mision) mision.classList.add('tuto-resalta');
      await decir(cfg.mision, 'saluda');
      if (mision) mision.classList.remove('tuto-resalta');
      if (!vivo()) return;
      if (cfg.opciones) {
        const tiles = tarjeta.querySelectorAll('.tuto-option');
        for (let i = 0; i < tiles.length; i++) {
          const valor = cfg.opciones[i];
          await ir(tiles[i]);
          if (!vivo()) return;
          await toca(tiles[i]);
          const desc = valor.desc.charAt(0).toLowerCase() + valor.desc.slice(1);
          await decir('Con «' + valor.titulo + '» le dices que ' + desc + '.', 'brazos');
          if (!vivo()) return;
        }
      } else {
        const cartas = tarjeta.querySelectorAll('.mini-carta');
        if (cartas.length === 4) {
          await ir(cartas[0]); if (!vivo()) return;
          await toca(cartas[0]); cartas[0].classList.add('volteada');
          await decir('Toca una carta para voltearla.', 'brazos'); if (!vivo()) return;
          await ir(cartas[1]); if (!vivo()) return;
          await toca(cartas[1]); cartas[1].classList.add('volteada');
          await decir('Luego otra. Si no son iguales, se voltean de nuevo.', 'brazos'); if (!vivo()) return;
          cartas[0].classList.remove('volteada'); cartas[1].classList.remove('volteada');
          await pausa(600); if (!vivo()) return;
          await ir(cartas[0]); if (!vivo()) return;
          await toca(cartas[0]); cartas[0].classList.add('volteada');
          await ir(cartas[2]); if (!vivo()) return;
          await toca(cartas[2]); cartas[2].classList.add('volteada');
          await pausa(250);
          cartas[0].classList.add('par'); cartas[2].classList.add('par');
          await decir('¡Son iguales! Se quedan descubiertas y aprendes algo del residuo.', 'saluda');
          if (!vivo()) return;
        }
      }
      const lista = tarjeta.querySelectorAll('.tuto-rules li');
      const hablaReglas = decir(frasesCfg.reglas || FRASES.reglas, 'lupa');
      for (let i = 0; i < lista.length; i++) {
        await ir(lista[i], 0.25, 0.5);
        if (!vivo()) return;
        lista[i].classList.add('tuto-resalta');
        await pausa(1000);
        lista[i].classList.remove('tuto-resalta');
      }
      await hablaReglas;
      if (!vivo()) return;
      const boton = tarjeta.querySelector('.tuto-nav .btn-primary');
      const fin = decir('¡Eso es todo! Cuando quieras, toca «Entendido» y a jugar.', 'saluda');
      await ir(boton, 0.6, 0.55);
      if (!vivo()) return;
      if (boton) boton.classList.add('tuto-latido');
      await fin;
      if (!vivo()) return;
      await pausa(2200);
      if (vivo()) caja.classList.remove('ver');
    }
    const listaReglas = cfg.reglas || REGLAS;
    const total = cfg.practica ? 3 : 2;
    const opciones = function () { return !cfg.opciones ? '' :
      '<div class="tuto-options">' + cfg.opciones.map(function (opcione) { return '<div class="tuto-option ' + opcione.tipo + '">' + opcione.titulo + '<span>' + opcione.desc + '</span></div>'; }).join('') + '</div>'; };
    const reglas = function () { return '<ul class="tuto-rules">' + listaReglas.map(function (listaRegla) { return '<li><span class="dot ' + listaRegla[0] + '"></span>' + listaRegla[1] + '</li>'; }).join('') + '</ul>'; };
    const sonido = '<div class="tuto-sound-row">' + ICONO_SONIDO + (cfg.textoSonido || 'Cada acierto, error, victoria y derrota tienen su propio sonido.') + '</div>';
    function pintar() {
      const cerrar = modo === 'ayuda'
        ? '<button type="button" class="modal-close" aria-label="Cerrar" data-accion="cerrar">✕</button>' : '';
      let html = cerrar;
      if (modo === 'ayuda') {
        const miniCartas = (!cfg.opciones && !reducido)
          ? '<div class="tuto-demo" aria-hidden="true">' + [['a', MINI_HOJA], ['b', MINI_LATA], ['a', MINI_HOJA], ['b', MINI_LATA]].map(function (item) { return '<div class="mini-carta"><span class="mc-dorso">' + MINI_DORSO + '</span><span class="mc-frente">' + item[1] + '</span></div>'; }).join('') + '</div>' : '';
        html += cabecera('Cómo se juega', cfg.subtitulo, 'ayuda') +
          '<p class="tuto-mision">' + cfg.mision + '</p>' + opciones() + miniCartas + reglas() + sonido +
          '<div class="tuto-nav"><button type="button" class="btn btn-outline" data-accion="repetir">Ver otra vez</button>' +
          '<button type="button" class="btn btn-primary" data-accion="cerrar">Entendido</button></div>';
      } else {
        const puntos = Array.from({ length: total }, function (_, i) { return i; }).map(function (i) { return '<span class="tuto-punto' + (i === paso ? ' activo' : '') + (i < paso ? ' hecho' : '') + '"></span>'; }).join('');
        html += '<div class="tuto-pasos" aria-label="Paso ' + (paso + 1) + ' de ' + total + '">' + puntos + '</div>';
        if (paso === 0) {
          html += cabecera('Bienvenido', cfg.subtitulo, 'bienvenida') +
            '<p class="tuto-mision">' + cfg.mision + '</p>' + opciones();
        } else if (paso === 1) {
          html += cabecera('Las reglas', cfg.subReglas || 'Así funciona el medidor de contaminación', 'reglas') + reglas() + sonido;
        } else {
          const valor = cfg.practica;
          html += cabecera('Practica una vez', 'Es solo un ejemplo, no cuenta para tu resultado', 'practica') +
            '<div class="tuto-ejemplo">' + valor.texto + '</div>' +
            '<div class="quiz-actions"><button type="button" class="btn btn-yes" data-resp="1">' + valor.si +
            '</button><button type="button" class="btn btn-no" data-resp="0">' + valor.no + '</button></div>' +
            '<p class="tuto-feedback" id="tutoFeedback" aria-live="polite"></p>';
        }
        const atras = paso > 0
          ? '<button type="button" class="btn btn-outline" data-accion="atras">Atrás</button>' : '';
        const ultimo = paso === total - 1;
        const bloqueado = ultimo && !!cfg.practica && !practicado;
        html += '<div class="tuto-nav">' + atras +
          '<button type="button" class="btn btn-primary" data-accion="' + (ultimo ? 'empezar' : 'sig') + '"' +
          (bloqueado ? ' disabled' : '') + ' id="tutoSig">' + (ultimo ? '¡Empezar a jugar!' : 'Siguiente') + '</button></div>';
      }
      corrida++;
      tarjeta.classList.toggle('modo-ayuda', modo === 'ayuda');
      tarjeta.innerHTML = html;
      hablar();
      if (modo === 'ayuda') demo();
      const foco = tarjeta.querySelector('#tutoSig, .btn-primary');
      if (foco && !foco.disabled) foco.focus({ preventScroll: true });
    }
    function abrir(nuevoModo) {
      modo = nuevoModo; paso = 0; practicado = false;
      if (cfg.alBloquear) cfg.alBloquear();
      pintar();
      overlay.classList.add('show');
    }
    function cerrar() {
      corrida++;
      clearTimeout(temporizador);
      overlay.classList.remove('show');
      if (cfg.alLiberar) cfg.alLiberar();
    }
    function terminarGuia() {
      try { localStorage.setItem(cfg.clave, '1'); } catch (err) {}
      cerrar();
    }
    tarjeta.addEventListener('click', function (ev) {
      if (ev.target.closest('.tuto-globo, .tuto-bio')) terminarDialogo();
      const elem = ev.target.closest('button');
      if (!elem) return;
      const accion = elem.dataset.accion;
      if (accion === 'cerrar') cerrar();
      else if (accion === 'repetir') pintar();
      else if (accion === 'sig') { paso++; pintar(); }
      else if (accion === 'atras') { paso--; practicado = false; pintar(); }
      else if (accion === 'empezar') terminarGuia();
      else if (elem.dataset.resp !== undefined && !practicado) {
        const acerto = (elem.dataset.resp === '1') === cfg.practica.correcta;
        practicado = true;
        tarjeta.querySelectorAll('[data-resp]').forEach(function (item) { item.disabled = true; });
        const fb = tarjeta.querySelector('#tutoFeedback');
        fb.className = 'tuto-feedback ' + (acerto ? 'ok' : 'bad');
        fb.textContent = (acerto ? '¡Correcto! ' : 'Casi. ') + cfg.practica.explica;
        const sig = tarjeta.querySelector('#tutoSig');
        sig.disabled = false; sig.focus({ preventScroll: true });
      }
    });
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay && modo === 'ayuda') cerrar(); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && overlay.classList.contains('show') && modo === 'ayuda') cerrar();
    });
    const botonAyuda = document.getElementById('abrirTutorial');
    if (botonAyuda) botonAyuda.addEventListener('click', function () { return abrir('ayuda'); });
    let yaVisto = false;
    try { yaVisto = !!(cfg.clave && localStorage.getItem(cfg.clave)); } catch (err2) {}
    if (cfg.siempre || !yaVisto) abrir('guia');
    const subirVisto = function () { if (cfg.clave && window.BioNube && BioNube.activo()) BioNube.asegurar(cfg.clave); };
    if (yaVisto) subirVisto();
    document.addEventListener('bio-nube-listo', function () {
      let visto = false;
      try { visto = !!(cfg.clave && localStorage.getItem(cfg.clave)); } catch (err) {}
      if (!visto) return;
      if (!cfg.siempre && modo === 'guia' && overlay.classList.contains('show')) cerrar();
      subirVisto();
    });
  }
  return { iniciar: iniciar };
})();
window.BioJuego = (function () {
  const CLAVE = 'bionyssa_progreso';
  const REDUCIR = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function leerTodo() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (err) { return {}; }
  }
  function resumen(juego) {
    return leerTodo()[juego] || null;
  }
  function registrar(juego, datos) {
    const todo = leerTodo();
    const j = todo[juego] || { partidas: 0, victorias: 0, mejor: null, racha: 0 };
    j.partidas += 1;
    if (datos.gano) j.victorias += 1;
    let nuevoRecord = false;
    if (datos.gano && typeof datos.valor === 'number') {
      const habiaMarca = j.mejor !== null;
      const mejora = !habiaMarca || (datos.menor ? datos.valor < j.mejor : datos.valor > j.mejor);
      if (mejora) { j.mejor = datos.valor; nuevoRecord = habiaMarca; }
    }
    if (datos.racha && datos.racha > j.racha) j.racha = datos.racha;
    todo[juego] = j;
    try { localStorage.setItem(CLAVE, JSON.stringify(todo)); } catch (err) {}
    return { nuevoRecord: nuevoRecord, juego: j };
  }
  function barajar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      const valor = copia[i]; copia[i] = copia[k]; copia[k] = valor;
    }
    return copia;
  }
  function elegir(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }
  function reiniciarAnimacion(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }
  function flotante(caja, texto, tipo) {
    if (!caja) return;
    const etiqueta = document.createElement('span');
    etiqueta.className = 'flota ' + (tipo || '');
    etiqueta.textContent = texto;
    caja.appendChild(etiqueta);
    setTimeout(function () { return etiqueta.remove(); }, 1000);
  }
  function verDato(caja) {
    const resultado = caja.getBoundingClientRect();
    if (resultado.bottom > window.innerHeight - 8) {
      caja.scrollIntoView({ block: 'end', behavior: REDUCIR ? 'auto' : 'smooth' });
    }
  }
  function confeti() {
    if (REDUCIR) return;
    const colores = ['#93a84a', '#5b6439', '#b07a22', '#b87036', '#e0d6b8', '#7d9440'];
    const caja = document.createElement('div');
    caja.className = 'confeti';
    caja.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 48; i++) {
      const etiqueta = document.createElement('span');
      etiqueta.className = 'confeti-p';
      const ancho = 6 + Math.random() * 5;
      etiqueta.style.cssText =
        'left:' + (Math.random() * 100).toFixed(1) + '%;' +
        'width:' + ancho.toFixed(1) + 'px;height:' + (ancho * 1.6).toFixed(1) + 'px;' +
        'background:' + colores[i % colores.length] + ';' +
        '--dx:' + ((Math.random() * 2 - 1) * 150).toFixed(0) + 'px;' +
        '--giro:' + ((Math.random() * 2 - 1) * 720).toFixed(0) + 'deg;' +
        'animation-duration:' + (1.5 + Math.random() * 1.2).toFixed(2) + 's;' +
        'animation-delay:' + (Math.random() * 0.35).toFixed(2) + 's;';
      caja.appendChild(etiqueta);
    }
    document.body.appendChild(caja);
    setTimeout(function () { return caja.remove(); }, 3200);
  }
  function estrellas(numero, max) {
    max = max || 3;
    let html = '';
    for (let i = 0; i < max; i++) {
      html += '<svg class="estrella' + (i < numero ? ' llena' : '') + '" style="--i:' + i + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/></svg>';
    }
    return '<div class="estrellas" role="img" aria-label="' + numero + ' de ' + max + ' estrellas">' + html + '</div>';
  }
  function formatoTiempo(seg) {
    const numero = Math.floor(seg / 60);
    const valor = seg % 60;
    return numero + ':' + (valor < 10 ? '0' : '') + valor;
  }
  const RESIDUOS = [
    { img: '/assets/img/Botella.webp', nombre: 'Botella de plástico', reciclable: true,
      dato: 'El PET se recicla y puede volver como un envase nuevo o como fibra para ropa.' },
    { img: '/assets/img/Pila.webp', nombre: 'Pila', reciclable: false,
      dato: 'No es reciclable en el contenedor común. Sus metales contaminan suelo y agua: llévala a un punto de acopio.' },
    { img: '/assets/img/Carton.webp', nombre: 'Caja de cartón', reciclable: true,
      dato: 'Se recicla si está limpia y seca. Aplástala para que ocupe menos lugar.' },
    { img: '/assets/img/Lata.webp', nombre: 'Lata de aluminio', reciclable: true,
      dato: 'El aluminio se puede reciclar muchas veces sin perder calidad.' },
    { img: '/assets/img/Bolsa.webp', nombre: 'Bolsa de plástico', reciclable: false,
      dato: 'Casi nunca se acepta en el reciclaje común. Reutilízala o cámbiala por una bolsa de tela.' }
  ];
  const ESPERA = 2300;
  const ANIMO_BIEN = ['¡Eso es!', 'Muy bien, sigue así.', 'Un punto para el planeta.', '¡Buen ojo!', 'El aire se siente mejor.'];
  const ANIMO_MAL = ['Casi. Todavía puedes remontar.', 'Ahora ya lo sabes.', 'Ese se escapó. ¡Va el siguiente!', 'Tranquilo, aprende del dato.'];
  function quiz(cfg) {
    const elem = function (id) { return document.getElementById(id); };
    const el = {
      pregunta: elem('pregunta'), progreso: elem('progreso'), barraProg: elem('barraProg'),
      barra: elem('barraConta'), valor: elem('valorConta'), estado: elem('estadoConta'),
      btnSi: elem('btnSi'), btnNo: elem('btnNo'),
      juego: elem('etapaJuego'), resultado: elem('etapaResultado'), tarjeta: elem('tarjeta'),
      dato: elem('dato'), datoTitulo: elem('datoTitulo'), datoTexto: elem('datoTexto'), datoSig: elem('datoSig'),
      chipRacha: elem('chipRacha'), chipPuntos: elem('chipPuntos'), planeta: elem('planeta'),
      icono: elem('iconoResultado'), titulo: elem('tituloResultado'), texto: elem('textoResultado'),
      stats: elem('resStats'), aviso: elem('avisoRecord'), reintentar: elem('btnReintentar'),
      hero: document.querySelector('.game-hero'), tag: document.querySelector('.game-hero-tag'),
      medidorCaja: document.querySelector('.meter-wrap')
    };
    const total = cfg.items.length;
    const tagInicial = el.tag ? el.tag.textContent : '';
    let cola, indice, contaminacion, racha, mejorRacha, aciertos, puntos;
    let pausa, temporizador, pendiente;
    function nuevo() {
      clearTimeout(temporizador);
      cola = barajar(cfg.items);
      indice = 0; contaminacion = 50; racha = 0; mejorRacha = 0; aciertos = 0; puntos = 0;
      pausa = false; pendiente = null;
      if (el.tag) el.tag.textContent = tagInicial;
      el.resultado.style.display = 'none';
      el.juego.style.display = 'block';
      pintarMedidor();
      pintarChips(false);
      mostrar();
    }
    function pintarMedidor() {
      el.barra.style.width = contaminacion + '%';
      el.valor.textContent = contaminacion + '%';
      const nivel = contaminacion <= 40 ? 'bajo' : contaminacion <= 59 ? 'medio' : 'alto';
      el.barra.style.background = { bajo: '#7d9440', medio: '#c08a2a', alto: '#b87036' }[nivel];
      if (el.estado) el.estado.textContent = { bajo: 'Bajo control', medio: 'Nivel medio', alto: 'Peligro' }[nivel];
      el.barra.parentElement.classList.toggle('peligro', contaminacion >= 80);
      if (el.planeta) el.planeta.style.setProperty('--smog', (contaminacion / 100 * 0.65).toFixed(2));
    }
    function pintarChips(animar) {
      el.chipRacha.textContent = 'Racha ' + racha;
      el.chipRacha.classList.toggle('caliente', racha >= 3);
      el.chipPuntos.textContent = puntos + ' pts';
      if (animar) {
        reiniciarAnimacion(el.chipPuntos, 'sube');
        if (racha > 0) reiniciarAnimacion(el.chipRacha, 'sube');
      }
    }
    function mostrar() {
      const item = cola[indice];
      cfg.pintar(item, el);
      el.progreso.textContent = cfg.progreso(indice + 1, total);
      el.barraProg.style.width = (indice / total * 100) + '%';
      el.btnSi.disabled = false;
      el.btnNo.disabled = false;
      el.btnSi.classList.remove('es-correcta', 'fue-error');
      el.btnNo.classList.remove('es-correcta', 'fue-error');
      el.juego.classList.remove('flash-ok', 'flash-mal');
      el.dato.classList.remove('show', 'ok', 'mal');
      el.tarjeta.classList.remove('sacude');
      reiniciarAnimacion(el.tarjeta, 'entra');
      pausa = false;
    }
    function reaccionar(acerto) {
      if (el.hero) {
        el.hero.classList.remove('feliz', 'triste');
        void el.hero.offsetWidth;
        el.hero.classList.add(acerto ? 'feliz' : 'triste');
      }
      if (el.tag) el.tag.textContent = elegir(acerto ? ANIMO_BIEN : ANIMO_MAL);
    }
    function responder(respuesta) {
      if (pausa || el.juego.classList.contains('juego-bloqueado')) return;
      pausa = true;
      const item = cola[indice];
      const acerto = respuesta === item.correcta;
      if (window.BioComun) BioComun.reproducir(acerto ? 'correcto' : 'incorrecto');
      if (navigator.vibrate) navigator.vibrate(acerto ? 12 : [35, 40, 35]);
      contaminacion = Math.max(0, Math.min(100, contaminacion + (acerto ? -10 : 10)));
      if (acerto) {
        racha += 1;
        aciertos += 1;
        if (racha > mejorRacha) mejorRacha = racha;
        puntos += 100 + Math.min(racha - 1, 4) * 25;
      } else {
        racha = 0;
      }
      pintarMedidor();
      pintarChips(true);
      flotante(el.medidorCaja, acerto ? '−10%' : '+10%', acerto ? 'ok' : 'mal');
      reaccionar(acerto);
      const btnCorrecto = item.correcta ? el.btnSi : el.btnNo;
      const btnElegido = respuesta ? el.btnSi : el.btnNo;
      el.btnSi.disabled = true;
      el.btnNo.disabled = true;
      btnCorrecto.classList.add('es-correcta');
      if (!acerto) btnElegido.classList.add('fue-error');
      reiniciarAnimacion(el.juego, acerto ? 'flash-ok' : 'flash-mal');
      if (!acerto) reiniciarAnimacion(el.tarjeta, 'sacude');
      el.barraProg.style.width = ((indice + 1) / total * 100) + '%';
      if (contaminacion === 100) pendiente = 'limite';
      else if (contaminacion === 0) pendiente = 'cero';
      else if (indice + 1 >= total) pendiente = 'fin';
      else pendiente = null;
      mostrarDato(item, acerto);
    }
    function mostrarDato(item, acerto) {
      el.datoTitulo.textContent = (acerto ? '¡Correcto! ' : 'Incorrecto. ') + (item.correcta ? cfg.explica.si : cfg.explica.no);
      el.datoTexto.textContent = item.dato;
      el.datoSig.textContent = pendiente ? 'Ver resultado' : 'Siguiente';
      el.dato.classList.remove('show', 'ok', 'mal');
      void el.dato.offsetWidth;
      el.dato.style.setProperty('--espera', ESPERA + 'ms');
      el.dato.classList.add('show', acerto ? 'ok' : 'mal');
      verDato(el.dato);
      clearTimeout(temporizador);
      temporizador = setTimeout(avanzar, ESPERA);
    }
    function avanzar() {
      clearTimeout(temporizador);
      if (!el.dato.classList.contains('show')) return;
      el.dato.classList.remove('show');
      if (pendiente) { finalizar(); return; }
      indice += 1;
      mostrar();
    }
    function finalizar() {
      let gano, mensaje;
      if (pendiente === 'limite') {
        gano = false; mensaje = 'La contaminación llegó al límite. El planeta fue destruido.';
      } else if (contaminacion === 0) {
        gano = true; mensaje = cfg.mensajeCero;
      } else if (contaminacion <= 60) {
        gano = true; mensaje = cfg.mensajeBien;
      } else {
        gano = false; mensaje = 'La contaminación superó el límite seguro.';
      }
      const nEstrellas = !gano ? 0 : contaminacion <= 20 ? 3 : contaminacion <= 40 ? 2 : 1;
      const respondidas = indice + 1;
      el.juego.style.display = 'none';
      el.resultado.style.display = 'block';
      el.resultado.scrollIntoView({ block: 'center', behavior: REDUCIR ? 'auto' : 'smooth' });
      el.icono.innerHTML = estrellas(nEstrellas);
      el.titulo.textContent = gano ? '¡Salvaste el planeta!' : 'El planeta fue destruido';
      el.texto.textContent = mensaje;
      el.stats.innerHTML =
        '<div><strong>' + aciertos + '/' + respondidas + '</strong><span>Aciertos</span></div>' +
        '<div><strong>' + mejorRacha + '</strong><span>Mejor racha</span></div>' +
        '<div><strong>' + puntos + '</strong><span>Puntos</span></div>';
      const guardado = registrar(cfg.id, { gano: gano, valor: puntos, racha: mejorRacha });
      if (el.aviso) el.aviso.hidden = !(gano && guardado.nuevoRecord);
      if (window.BioComun) BioComun.reproducir(gano ? 'ganar' : 'perder');
      if (gano) confeti();
    }
    (function () {
      const valor = el.tarjeta, UMBRAL = 70;
      let x0 = null, dx = 0;
      valor.style.touchAction = 'pan-y';
      const volver = function () { valor.style.transition = 'transform .2s ease'; valor.style.transform = ''; el.btnSi.classList.remove('previa'); el.btnNo.classList.remove('previa'); };
      valor.addEventListener('pointerdown', function (ev) {
        if (pausa || ev.pointerType === 'mouse' || el.juego.classList.contains('juego-bloqueado')) return;
        x0 = ev.clientX; dx = 0;
        try { valor.setPointerCapture(ev.pointerId); } catch (err) {}
      });
      valor.addEventListener('pointermove', function (ev) {
        if (x0 === null) return;
        dx = ev.clientX - x0;
        if (Math.abs(dx) < 6) return;
        valor.style.transition = 'none';
        valor.style.transform = 'translateX(' + (dx * 0.7).toFixed(0) + 'px) rotate(' + (dx / 28).toFixed(1) + 'deg)';
        el.btnSi.classList.toggle('previa', dx < -UMBRAL);
        el.btnNo.classList.toggle('previa', dx > UMBRAL);
      });
      const soltar = function () {
        if (x0 === null) return;
        const valor2 = dx; x0 = null; dx = 0;
        volver();
        if (!pausa && Math.abs(valor2) > UMBRAL) responder(valor2 < 0);
      };
      valor.addEventListener('pointerup', soltar);
      valor.addEventListener('pointercancel', function () { x0 = null; dx = 0; volver(); });
    })();
    el.btnSi.addEventListener('click', function () { return responder(true); });
    el.btnNo.addEventListener('click', function () { return responder(false); });
    el.datoSig.addEventListener('click', avanzar);
    el.dato.addEventListener('click', avanzar);
    el.reintentar.addEventListener('click', nuevo);
    document.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (document.querySelector('.modal-overlay.show')) return;
      if (el.resultado.style.display === 'block') return;
      if (el.dato.classList.contains('show')) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowRight') { ev.preventDefault(); avanzar(); }
        return;
      }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); responder(true); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); responder(false); }
    });
    nuevo();
  }
  return {
    residuos: RESIDUOS,
    quiz: quiz,
    registrar: registrar,
    resumen: resumen,
    barajar: barajar,
    elegir: elegir,
    confeti: confeti,
    flotante: flotante,
    estrellas: estrellas,
    formatoTiempo: formatoTiempo,
    verDato: verDato,
    reiniciarAnimacion: reiniciarAnimacion
  };
})();
 } catch (err) { console.error(err); }
}

// memorama
if (['juego-memorama'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const tablero = elem('tablero');
  const elMov = elem('movs');
  const elTiempo = elem('tiempo');
  const elPares = elem('pares');
  const progreso = elem('progreso');
  const barra = elem('barraProg');
  const dato = elem('dato');
  const datoTitulo = elem('datoTitulo');
  const datoTexto = elem('datoTexto');
  const etapaJuego = elem('etapaJuego');
  const etapaRes = elem('etapaResultado');
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
  const vibrar = function (dato2) { if (navigator.vibrate) navigator.vibrate(dato2); };
  const ocultaDato = function () { clearTimeout(tDato); dato.classList.remove('show'); };
  dato.addEventListener('click', ocultaDato);
  RESIDUOS.forEach(function (item) { const i = new Image(); i.src = item.img; });
  function iniciarReloj() {
    if (reloj) return;
    reloj = setInterval(function () {
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
    alBloquear: function () { etapaJuego.classList.add('juego-bloqueado'); etapaJuego.inert = true; pararReloj(); },
    alLiberar: function () {
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
    BioJuego.barajar(RESIDUOS.concat(RESIDUOS)).forEach(function (item, i) {
      const carta = document.createElement('button');
      carta.type = 'button';
      carta.className = 'carta';
      carta.dataset.nombre = item.nombre;
      carta.style.setProperty('--i', i);
      carta.setAttribute('aria-label', 'Carta boca abajo');
      carta.innerHTML =
        '<span class="carta-int">' +
          '<span class="carta-cara carta-dorso"></span>' +
          '<span class="carta-cara carta-frente"><img src="' + item.img + '" alt="' + item.nombre + '" draggable="false"></span>' +
        '</span>';
      carta.addEventListener('click', function () { return voltear(carta); });
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
    const valor = abiertas[0];
    const valor2 = abiertas[1];
    if (valor.dataset.nombre === valor2.dataset.nombre) {
      valor.classList.add('hallada');
      valor2.classList.add('hallada');
      abiertas = [];
      hallados += 1;
      elPares.textContent = hallados + '/' + TOTAL;
      progreso.textContent = 'Pares encontrados: ' + hallados + ' de ' + TOTAL;
      barra.style.width = (hallados / TOTAL * 100) + '%';
      if (window.BioComun) BioComun.reproducir('correcto');
      const resultado = RESIDUOS.find(function (item) { return item.nombre === valor.dataset.nombre; });
      datoTitulo.textContent = resultado.nombre;
      datoTexto.textContent = resultado.dato;
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
    valor.classList.add('error');
    valor2.classList.add('error');
    setTimeout(function () {
      [valor, valor2].forEach(function (item) {
        item.classList.remove('volteada', 'error');
        item.setAttribute('aria-label', 'Carta boca abajo');
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
    elem('iconoResultado').innerHTML = BioJuego.estrellas(nEstrellas);
    elem('textoResultado').textContent = 'Encontraste los ' + TOTAL + ' pares en ' + movs + ' movimientos.';
    elem('resStats').innerHTML =
      '<div><strong>' + movs + '</strong><span>Movimientos</span></div>' +
      '<div><strong>' + BioJuego.formatoTiempo(seg) + '</strong><span>Tiempo</span></div>' +
      '<div><strong>' + guardado.juego.mejor + '</strong><span>Mejor marca</span></div>';
    elem('avisoRecord').hidden = !guardado.nuevoRecord;
    if (window.BioComun) BioComun.reproducir('ganar');
    BioJuego.confeti();
  }
  elem('btnReintentar').addEventListener('click', armar);
  armar();
})();
 } catch (err) { console.error(err); }
}

// clasificar
if (['juego-clasificar'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const objetos = BioJuego.residuos.map(function (residuo) { return {
    img: residuo.img, nombre: residuo.nombre, correcta: residuo.reciclable, dato: residuo.dato
  }; });
  objetos.forEach(function (objeto) { const i = new Image(); i.src = objeto.img; });
  const etapa = document.getElementById('etapaJuego');
  const imagen = document.getElementById('imgObjeto');
  const nombre = document.getElementById('nombreObjeto');
  BioTutorial.iniciar({
    clave: 'bionyssa_tuto_clasificar_v2',
    subtitulo: 'Limpia el planeta: clasificación de residuos',
    mision: 'La contaminación empieza en 50%. Observa cada objeto y decide si se recicla o si va a la basura.',
    opciones: [
      { tipo: 'yes', titulo: 'Reciclar', desc: 'Se puede reciclar y ayuda al planeta' },
      { tipo: 'no', titulo: 'Basura', desc: 'No se puede reciclar y contamina' }
    ],
    practica: { texto: 'Periódico usado', si: 'Reciclar', no: 'Basura', correcta: true,
      explica: 'El papel limpio y seco se puede reciclar varias veces.' },
    alBloquear: function () { etapa.classList.add('juego-bloqueado'); etapa.inert = true; },
    alLiberar: function () { etapa.classList.remove('juego-bloqueado'); etapa.inert = false; }
  });
  BioJuego.quiz({
    id: 'clasificar',
    items: objetos,
    progreso: function (numero, total) { return 'Objeto ' + numero + ' de ' + total; },
    pintar: function (item, el) {
      imagen.src = item.img;
      imagen.alt = item.nombre;
      nombre.textContent = item.nombre;
    },
    explica: { si: 'Se puede reciclar.', no: 'No es reciclable.' },
    mensajeCero: 'Contaminación reducida a 0. ¡Gran trabajo clasificando!',
    mensajeBien: 'Clasificaste bien la mayoría de los residuos.'
  });
})();
 } catch (err) { console.error(err); }
}

// trivia
if (['juego-trivia'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const preguntas = [
    { texto: '¿Usar bolsa reutilizable?', correcta: true,
      dato: 'Una sola bolsa de tela puede reemplazar cientos de bolsas de plástico de un solo uso.' },
    { texto: '¿Reciclar plástico?', correcta: true,
      dato: 'Reciclar plástico evita que termine en ríos y mares, y ahorra materia prima nueva.' },
    { texto: '¿Ahorrar agua?', correcta: true,
      dato: 'Cerrar la llave al enjabonarte o cepillarte los dientes ahorra varios litros cada vez.' },
    { texto: '¿Usar bicicleta?', correcta: true,
      dato: 'Moverte en bici no emite gases contaminantes y, de paso, es ejercicio.' },
    { texto: '¿Tirar basura en la calle?', correcta: false,
      dato: 'La basura tapa las coladeras, provoca encharcamientos y acaba arrastrada a ríos y mares.' },
    { texto: '¿Apagar las luces al salir?', correcta: true,
      dato: 'Apagar lo que no usas baja el consumo de electricidad y lo que pagas de luz.' },
    { texto: '¿Separar la basura?', correcta: true,
      dato: 'Separar orgánicos y reciclables hace mucho más fácil que los materiales se aprovechen.' },
    { texto: '¿Usar demasiado plástico?', correcta: false,
      dato: 'Muchos plásticos tardan cientos de años en degradarse y se rompen en microplásticos.' },
    { texto: '¿Plantar árboles?', correcta: true,
      dato: 'Los árboles absorben dióxido de carbono, dan sombra y son casa de aves e insectos.' },
    { texto: '¿Dejar abierta la llave del agua?', correcta: false,
      dato: 'Una llave abierta desperdicia litros de agua limpia en pocos minutos.' }
  ];
  const etapa = document.getElementById('etapaJuego');
  BioTutorial.iniciar({
    clave: 'bionyssa_tuto_trivia_v2',
    subtitulo: 'Salva al planeta: trivia ecológica',
    mision: 'La contaminación empieza en 50%. Responde si cada acción ayuda o daña al planeta para reducirla.',
    opciones: [
      { tipo: 'yes', titulo: 'Sí', desc: 'Es una acción que ayuda al planeta' },
      { tipo: 'no', titulo: 'No', desc: 'Es una acción que daña al planeta' }
    ],
    practica: { texto: '¿Cerrar la llave mientras te cepillas los dientes?', si: 'Sí', no: 'No', correcta: true,
      explica: 'Cerrar la llave ahorra hasta 12 litros de agua por lavado.' },
    alBloquear: function () { etapa.classList.add('juego-bloqueado'); etapa.inert = true; },
    alLiberar: function () { etapa.classList.remove('juego-bloqueado'); etapa.inert = false; }
  });
  BioJuego.quiz({
    id: 'trivia',
    items: preguntas,
    progreso: function (numero, total) { return 'Pregunta ' + numero + ' de ' + total; },
    pintar: function (item, el) { el.pregunta.textContent = item.texto; },
    explica: { si: 'Sí, ayuda al planeta.', no: 'No, daña al planeta.' },
    mensajeCero: 'Contaminación reducida a 0. ¡Gran trabajo!',
    mensajeBien: 'La contaminación se mantuvo bajo control.'
  });
})();
 } catch (err) { console.error(err); }
}

// minijuegos
if (['minijuegos'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
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
  const partidasTexto = function (numero) { return numero + (numero === 1 ? ' partida' : ' partidas'); };
  let partidas = 0, victorias = 0, racha = 0;
  ['trivia', 'clasificar', 'memorama'].forEach(function (id) {
    const resultado = BioJuego.resumen(id);
    if (!resultado) return;
    partidas += resultado.partidas;
    victorias += resultado.victorias;
    racha = Math.max(racha, resultado.racha || 0);
    const caja = document.querySelector('[data-mejor="' + id + '"]');
    if (!caja) return;
    caja.classList.add('hay');
    if (resultado.mejor === null) caja.textContent = 'Sin victorias · ' + partidasTexto(resultado.partidas);
    else caja.textContent = 'Mejor: ' + resultado.mejor + (id === 'memorama' ? ' mov.' : ' pts');
  });
  function contar(el, meta) {
    if (reducir || meta === 0) { el.textContent = meta; return; }
    const inicio = performance.now();
    (function paso(ahora) {
      const numero = Math.min(1, (ahora - inicio) / 700);
      el.textContent = Math.round(meta * (1 - (1 - numero) ** 3));
      if (numero < 1) requestAnimationFrame(paso);
    })(inicio);
  }
  contar(elem('stPartidas'), partidas);
  contar(elem('stVictorias'), victorias);
  contar(elem('stRacha'), racha);
  if (partidas > 0) {
    elem('arcadeMensaje').textContent = victorias > 0
      ? 'Has ganado ' + victorias + ' de ' + partidasTexto(partidas) + '. ¡Sigue cuidando al planeta!'
      : 'Llevas ' + partidasTexto(partidas) + '. Con el siguiente intento se puede.';
  }
  const dato = elem('datoDia');
  let actual = Math.floor(Math.random() * DATOS.length);
  dato.textContent = DATOS[actual];
  elem('otroDato').addEventListener('click', function () {
    let nuevo;
    do { nuevo = Math.floor(Math.random() * DATOS.length); } while (nuevo === actual);
    actual = nuevo;
    if (reducir) { dato.textContent = DATOS[actual]; return; }
    dato.classList.add('cambia');
    setTimeout(function () { dato.textContent = DATOS[actual]; dato.classList.remove('cambia'); }, 180);
  });
  document.querySelectorAll('.game-card[data-desde]').forEach(function (tarjeta) {
    const dias = (Date.now() - new Date(tarjeta.dataset.desde + 'T00:00:00').getTime()) / 864e5;
    const arte = tarjeta.querySelector('.game-art');
    if (!arte || !(dias >= 0 && dias < 7)) return;
    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta-nuevo';
    etiqueta.textContent = 'Nuevo';
    arte.appendChild(etiqueta);
  });
})();
 } catch (err) { console.error(err); }
}

// sin-conexion
if (['offline'].indexOf(paginaActual) > -1) {
 try {
(function () {
  var elem = function (i) { return document.getElementById(i); };
  var cv = elem('c'), valor = cv.getContext('2d'), numero = 360, numero2 = 520;
  var BUENOS = ['Botella', 'Lata', 'Carton', 'Bolsa'], IM = {};
  BUENOS.concat(['Pila', 'mascota']).forEach(function (item) { var i = new Image(); i.src = '/assets/img/' + item + '.webp'; IM[item] = i; });
  var texto = 'bionyssa_sin_red_record', est = 'inicio', px = numero / 2, pts = 0, vidas = 5, cosas = [], cuadro = 0, tecla = 0;
  var mejor = 0;
  try { mejor = +localStorage.getItem(texto) || 0; } catch (err) {}
  elem('rec').textContent = mejor;
  function hud() { elem('pts').textContent = pts; elem('vid').textContent = vidas > 0 ? new Array(vidas + 1).join('♥') : '-'; }
  function nueva() {
    var mala = Math.random() < 0.22;
    cosas.push({ n: mala ? 'Pila' : BUENOS[Math.random() * 4 | 0], x: 30 + Math.random() * (numero - 60), y: -40, a: 0, r: (Math.random() - 0.5) * 0.06, mala: mala });
  }
  function empezar() { pts = 0; vidas = 5; cosas = []; cuadro = 0; px = numero / 2; est = 'jugando'; elem('vel').hidden = true; hud(); }
  function fin() {
    est = 'fin';
    var rec = pts > mejor;
    if (rec) { mejor = pts; try { localStorage.setItem(texto, mejor); } catch (err2) {} elem('rec').textContent = mejor; }
    elem('velTit').textContent = rec ? '¡Nuevo récord!' : 'Fin del juego';
    elem('velTxt').textContent = 'Atrapaste ' + pts + (pts === 1 ? ' residuo.' : ' residuos.') + ' Reciclar sí cuenta.';
    elem('jugar').textContent = 'Jugar de nuevo';
    elem('vel').hidden = false;
  }
  function paso() {
    cuadro++;
    if (cuadro % Math.max(24, 62 - pts) === 0) nueva();
    var vel = Math.min(5.2, 1.8 + pts * 0.05);
    px = Math.max(36, Math.min(numero - 36, px + tecla * 6));
    for (var i = cosas.length - 1; i >= 0; i--) {
      var valor2 = cosas[i]; valor2.y += vel; valor2.a += valor2.r;
      if (valor2.y > numero2 - 100 && valor2.y < numero2 - 45 && Math.abs(valor2.x - px) < 46) {
        cosas.splice(i, 1);
        if (valor2.mala) vidas--; else pts++;
        hud();
      } else if (valor2.y > numero2 + 30) {
        cosas.splice(i, 1);
        if (!valor2.mala) { vidas--; hud(); }
      }
    }
    if (vidas <= 0) fin();
  }
  function dibujar() {
    var valor2 = valor.createLinearGradient(0, 0, 0, numero2);
    valor2.addColorStop(0, '#e9efcf'); valor2.addColorStop(1, '#b9c98a');
    valor.fillStyle = valor2; valor.fillRect(0, 0, numero, numero2);
    valor.fillStyle = '#6f8a3a'; valor.fillRect(0, numero2 - 22, numero, 22);
    cosas.forEach(function (cosa) {
      valor.save(); valor.translate(cosa.x, cosa.y); valor.rotate(cosa.a);
      if (IM[cosa.n].complete) valor.drawImage(IM[cosa.n], -22, -22, 44, 44);
      valor.restore();
    });
    if (IM.mascota.complete) valor.drawImage(IM.mascota, px - 38, numero2 - 104, 76, 76);
  }
  function bucle() { if (est === 'jugando') paso(); dibujar(); requestAnimationFrame(bucle); }
  function mover(numero3) { var resultado = cv.getBoundingClientRect(); px = Math.max(36, Math.min(numero - 36, (numero3.clientX - resultado.left) * numero / resultado.width)); }
  cv.addEventListener('pointermove', mover);
  cv.addEventListener('pointerdown', mover);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft' || ev.key === 'a') tecla = -1;
    if (ev.key === 'ArrowRight' || ev.key === 'd') tecla = 1;
    if (ev.key === 'Enter' && est !== 'jugando') empezar();
  });
  document.addEventListener('keyup', function (ev) {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].indexOf(ev.key) > -1) tecla = 0;
  });
  elem('jugar').addEventListener('click', empezar);
  var aviso = elem('aviso');
  function hayRed() {
    aviso.hidden = false;
    elem('volver').textContent = 'Volver';
    elem('avisoTxt').textContent = '¡Ya hay conexión! Tu partida no se pierde si sigues jugando.';
  }
  window.addEventListener('online', hayRed);
  function conRedReal() {
    var ctl = window.AbortController ? new AbortController() : null;
    var valor2 = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    return fetch('/manifest.webmanifest?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (respuesta) { clearTimeout(valor2); return respuesta.ok; }, function () { clearTimeout(valor2); return false; });
  }
  function salir() {
    var valor2 = null, ultimo = 0;
    try {
      valor2 = sessionStorage.getItem('bio_volver');
      ultimo = +sessionStorage.getItem('bio_reintento') || 0;
      sessionStorage.setItem('bio_reintento', String(Date.now()));
    } catch (err2) {}
    if (Date.now() - ultimo < 15000) return;
    if (!/offline\.html$/.test(location.pathname)) location.reload();
    else location.replace(valor2 && !/offline\.html/.test(valor2) ? valor2 : '/paginas/menu.html');
  }
  if (navigator.onLine) conRedReal().then(function (ok) { if (ok) salir(); });
  if (navigator.onLine) { elem('avisoTxt').textContent = 'Parece que hay conexión.'; aviso.hidden = false; elem('volver').textContent = 'Reintentar'; }
  elem('volver').addEventListener('click', function () {
    var valor2 = null;
    try { valor2 = sessionStorage.getItem('bio_volver'); } catch (err2) {}
    if (!/offline\.html$/.test(location.pathname)) location.reload();
    else location.href = valor2 || '/paginas/menu.html';
  });
  hud(); bucle();
})();
 } catch (err) { console.error(err); }
}
