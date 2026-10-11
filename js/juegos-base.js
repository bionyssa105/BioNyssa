window.BioTutorial = (function () {
  const REGLAS = [
    ['ok', 'Cada respuesta correcta reduce la contaminación un 10%.'],
    ['bad', 'Cada respuesta incorrecta la aumenta un 10%.'],
    ['ok', 'Si termina en 60% o menos (o llegas a 0%), ¡salvas el planeta!'],
    ['bad', 'Si llega a 100%, el planeta se destruye y pierdes.']
  ];
  const POSES = {
    saluda: ['assets/img/bio-saluda.webp', 63, 132],
    lupa: ['assets/img/bio-lupa.webp', 55, 132],
    brazos: ['assets/img/bio-brazos.webp', 88, 132]
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

    const cabecera = (titulo, sub, momento) => {
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

    const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
    const tiempoTexto = (t) => t.length * 28 + (t.match(/[.,!?¡¿]/g) || []).length * 120 + 500;

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
      const t = tarjeta.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return [r.left - t.left - tarjeta.clientLeft + tarjeta.scrollLeft + r.width * fx, r.top - t.top - tarjeta.clientTop + tarjeta.scrollTop + r.height * fy];
    }

    async function ir(el, fx, fy) {
      const c = tarjeta.querySelector('.tuto-cursor');
      if (!c || !el) return;
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      await pausa(260);
      punta = posicion(el, fx === undefined ? 0.55 : fx, fy === undefined ? 0.6 : fy);
      c.style.transform = 'translate(' + (punta[0] - 4) + 'px,' + (punta[1] - 2) + 'px)';
      c.classList.add('ver');
      await pausa(950);
    }

    async function toca(el) {
      const c = tarjeta.querySelector('.tuto-cursor');
      if (!c || !el) return;
      c.classList.add('clic');
      const onda = document.createElement('span');
      onda.className = 'tuto-onda';
      onda.style.left = punta[0] + 'px';
      onda.style.top = punta[1] + 'px';
      tarjeta.appendChild(onda);
      setTimeout(() => onda.remove(), 700);
      el.classList.add('tuto-toque');
      await pausa(240);
      c.classList.remove('clic');
      setTimeout(() => el.classList.remove('tuto-toque'), 800);
      await pausa(300);
    }

    async function demo() {
      if (reducido) return;
      const mia = ++corrida;
      const vivo = () => mia === corrida && modo === 'ayuda' && overlay.classList.contains('show');
      const c = document.createElement('div');
      c.className = 'tuto-cursor';
      c.setAttribute('aria-hidden', 'true');
      c.innerHTML = ICONO_CURSOR;
      tarjeta.appendChild(c);
      c.style.transition = 'none';
      c.style.transform = 'translate(' + (tarjeta.clientWidth - 46) + 'px,70px)';
      void c.offsetWidth;
      c.style.transition = '';

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
          const o = cfg.opciones[i];
          await ir(tiles[i]);
          if (!vivo()) return;
          await toca(tiles[i]);
          const desc = o.desc.charAt(0).toLowerCase() + o.desc.slice(1);
          await decir('Con «' + o.titulo + '» le dices que ' + desc + '.', 'brazos');
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
      if (vivo()) c.classList.remove('ver');
    }

    const listaReglas = cfg.reglas || REGLAS;
    const total = cfg.practica ? 3 : 2;

    const opciones = () => !cfg.opciones ? '' :
      '<div class="tuto-options">' + cfg.opciones.map((o) =>
        '<div class="tuto-option ' + o.tipo + '">' + o.titulo + '<span>' + o.desc + '</span></div>').join('') + '</div>';

    const reglas = () =>
      '<ul class="tuto-rules">' + listaReglas.map((r) =>
        '<li><span class="dot ' + r[0] + '"></span>' + r[1] + '</li>').join('') + '</ul>';

    const sonido = '<div class="tuto-sound-row">' + ICONO_SONIDO + (cfg.textoSonido || 'Cada acierto, error, victoria y derrota tienen su propio sonido.') + '</div>';

    function pintar() {
      const cerrar = modo === 'ayuda'
        ? '<button type="button" class="modal-close" aria-label="Cerrar" data-accion="cerrar">✕</button>' : '';
      let html = cerrar;

      if (modo === 'ayuda') {
        const miniCartas = (!cfg.opciones && !reducido)
          ? '<div class="tuto-demo" aria-hidden="true">' + [['a', MINI_HOJA], ['b', MINI_LATA], ['a', MINI_HOJA], ['b', MINI_LATA]].map((c) =>
            '<div class="mini-carta"><span class="mc-dorso">' + MINI_DORSO + '</span><span class="mc-frente">' + c[1] + '</span></div>').join('') + '</div>' : '';
        html += cabecera('Cómo se juega', cfg.subtitulo, 'ayuda') +
          '<p class="tuto-mision">' + cfg.mision + '</p>' + opciones() + miniCartas + reglas() + sonido +
          '<div class="tuto-nav"><button type="button" class="btn btn-outline" data-accion="repetir">Ver otra vez</button>' +
          '<button type="button" class="btn btn-primary" data-accion="cerrar">Entendido</button></div>';
      } else {
        const puntos = Array.from({ length: total }, (_, i) => i).map((i) =>
          '<span class="tuto-punto' + (i === paso ? ' activo' : '') + (i < paso ? ' hecho' : '') + '"></span>').join('');
        html += '<div class="tuto-pasos" aria-label="Paso ' + (paso + 1) + ' de ' + total + '">' + puntos + '</div>';

        if (paso === 0) {
          html += cabecera('Bienvenido', cfg.subtitulo, 'bienvenida') +
            '<p class="tuto-mision">' + cfg.mision + '</p>' + opciones();
        } else if (paso === 1) {
          html += cabecera('Las reglas', cfg.subReglas || 'Así funciona el medidor de contaminación', 'reglas') + reglas() + sonido;
        } else {
          const p = cfg.practica;
          html += cabecera('Practica una vez', 'Es solo un ejemplo, no cuenta para tu resultado', 'practica') +
            '<div class="tuto-ejemplo">' + p.texto + '</div>' +
            '<div class="quiz-actions"><button type="button" class="btn btn-yes" data-resp="1">' + p.si +
            '</button><button type="button" class="btn btn-no" data-resp="0">' + p.no + '</button></div>' +
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
      try { localStorage.setItem(cfg.clave, '1'); } catch (e) {}
      cerrar();
    }

    tarjeta.addEventListener('click', (e) => {
      if (e.target.closest('.tuto-globo, .tuto-bio')) terminarDialogo();
      const b = e.target.closest('button');
      if (!b) return;
      const accion = b.dataset.accion;
      if (accion === 'cerrar') cerrar();
      else if (accion === 'repetir') pintar();
      else if (accion === 'sig') { paso++; pintar(); }
      else if (accion === 'atras') { paso--; practicado = false; pintar(); }
      else if (accion === 'empezar') terminarGuia();
      else if (b.dataset.resp !== undefined && !practicado) {
        const acerto = (b.dataset.resp === '1') === cfg.practica.correcta;
        practicado = true;
        tarjeta.querySelectorAll('[data-resp]').forEach((x) => { x.disabled = true; });
        const fb = tarjeta.querySelector('#tutoFeedback');
        fb.className = 'tuto-feedback ' + (acerto ? 'ok' : 'bad');
        fb.textContent = (acerto ? '¡Correcto! ' : 'Casi. ') + cfg.practica.explica;
        const sig = tarjeta.querySelector('#tutoSig');
        sig.disabled = false; sig.focus({ preventScroll: true });
      }
    });

    overlay.addEventListener('click', (e) => { if (e.target === overlay && modo === 'ayuda') cerrar(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('show') && modo === 'ayuda') cerrar();
    });

    const botonAyuda = document.getElementById('abrirTutorial');
    if (botonAyuda) botonAyuda.addEventListener('click', () => abrir('ayuda'));

    let yaVisto = false;
    try { yaVisto = !!(cfg.clave && localStorage.getItem(cfg.clave)); } catch (e) {}
    if (cfg.siempre || !yaVisto) abrir('guia');

    const subirVisto = () => { if (cfg.clave && window.BioNube && BioNube.activo()) BioNube.asegurar(cfg.clave); };
    if (yaVisto) subirVisto();
    document.addEventListener('bio-nube-listo', () => {
      let visto = false;
      try { visto = !!(cfg.clave && localStorage.getItem(cfg.clave)); } catch (e) {}
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
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
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
    try { localStorage.setItem(CLAVE, JSON.stringify(todo)); } catch (e) {}
    return { nuevoRecord: nuevoRecord, juego: j };
  }

  function barajar(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[k]; a[k] = t;
    }
    return a;
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
    const s = document.createElement('span');
    s.className = 'flota ' + (tipo || '');
    s.textContent = texto;
    caja.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }

  function verDato(caja) {
    const r = caja.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 8) {
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
      const p = document.createElement('span');
      p.className = 'confeti-p';
      const ancho = 6 + Math.random() * 5;
      p.style.cssText =
        'left:' + (Math.random() * 100).toFixed(1) + '%;' +
        'width:' + ancho.toFixed(1) + 'px;height:' + (ancho * 1.6).toFixed(1) + 'px;' +
        'background:' + colores[i % colores.length] + ';' +
        '--dx:' + ((Math.random() * 2 - 1) * 150).toFixed(0) + 'px;' +
        '--giro:' + ((Math.random() * 2 - 1) * 720).toFixed(0) + 'deg;' +
        'animation-duration:' + (1.5 + Math.random() * 1.2).toFixed(2) + 's;' +
        'animation-delay:' + (Math.random() * 0.35).toFixed(2) + 's;';
      caja.appendChild(p);
    }
    document.body.appendChild(caja);
    setTimeout(() => caja.remove(), 3200);
  }

  function estrellas(n, max) {
    max = max || 3;
    let html = '';
    for (let i = 0; i < max; i++) {
      html += '<svg class="estrella' + (i < n ? ' llena' : '') + '" style="--i:' + i + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/></svg>';
    }
    return '<div class="estrellas" role="img" aria-label="' + n + ' de ' + max + ' estrellas">' + html + '</div>';
  }

  function formatoTiempo(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  const RESIDUOS = [
    { img: 'assets/img/Botella.webp', nombre: 'Botella de plástico', reciclable: true,
      dato: 'El PET se recicla y puede volver como un envase nuevo o como fibra para ropa.' },
    { img: 'assets/img/Pila.webp', nombre: 'Pila', reciclable: false,
      dato: 'No es reciclable en el contenedor común. Sus metales contaminan suelo y agua: llévala a un punto de acopio.' },
    { img: 'assets/img/Carton.webp', nombre: 'Caja de cartón', reciclable: true,
      dato: 'Se recicla si está limpia y seca. Aplástala para que ocupe menos lugar.' },
    { img: 'assets/img/Lata.webp', nombre: 'Lata de aluminio', reciclable: true,
      dato: 'El aluminio se puede reciclar muchas veces sin perder calidad.' },
    { img: 'assets/img/Bolsa.webp', nombre: 'Bolsa de plástico', reciclable: false,
      dato: 'Casi nunca se acepta en el reciclaje común. Reutilízala o cámbiala por una bolsa de tela.' }
  ];

  const ESPERA = 2300;
  const ANIMO_BIEN = ['¡Eso es!', 'Muy bien, sigue así.', 'Un punto para el planeta.', '¡Buen ojo!', 'El aire se siente mejor.'];
  const ANIMO_MAL = ['Casi. Todavía puedes remontar.', 'Ahora ya lo sabes.', 'Ese se escapó. ¡Va el siguiente!', 'Tranquilo, aprende del dato.'];

  function quiz(cfg) {
    const $ = (id) => document.getElementById(id);
    const el = {
      pregunta: $('pregunta'), progreso: $('progreso'), barraProg: $('barraProg'),
      barra: $('barraConta'), valor: $('valorConta'), estado: $('estadoConta'),
      btnSi: $('btnSi'), btnNo: $('btnNo'),
      juego: $('etapaJuego'), resultado: $('etapaResultado'), tarjeta: $('tarjeta'),
      dato: $('dato'), datoTitulo: $('datoTitulo'), datoTexto: $('datoTexto'), datoSig: $('datoSig'),
      chipRacha: $('chipRacha'), chipPuntos: $('chipPuntos'), planeta: $('planeta'),
      icono: $('iconoResultado'), titulo: $('tituloResultado'), texto: $('textoResultado'),
      stats: $('resStats'), aviso: $('avisoRecord'), reintentar: $('btnReintentar'),
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
      const t = el.tarjeta, UMBRAL = 70;
      let x0 = null, dx = 0;
      t.style.touchAction = 'pan-y';
      const volver = () => { t.style.transition = 'transform .2s ease'; t.style.transform = ''; el.btnSi.classList.remove('previa'); el.btnNo.classList.remove('previa'); };
      t.addEventListener('pointerdown', (e) => {
        if (pausa || e.pointerType === 'mouse' || el.juego.classList.contains('juego-bloqueado')) return;
        x0 = e.clientX; dx = 0;
        try { t.setPointerCapture(e.pointerId); } catch (err) {}
      });
      t.addEventListener('pointermove', (e) => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        if (Math.abs(dx) < 6) return;
        t.style.transition = 'none';
        t.style.transform = 'translateX(' + (dx * 0.7).toFixed(0) + 'px) rotate(' + (dx / 28).toFixed(1) + 'deg)';
        el.btnSi.classList.toggle('previa', dx < -UMBRAL);
        el.btnNo.classList.toggle('previa', dx > UMBRAL);
      });
      const soltar = () => {
        if (x0 === null) return;
        const d = dx; x0 = null; dx = 0;
        volver();
        if (!pausa && Math.abs(d) > UMBRAL) responder(d < 0);
      };
      t.addEventListener('pointerup', soltar);
      t.addEventListener('pointercancel', () => { x0 = null; dx = 0; volver(); });
    })();

    el.btnSi.addEventListener('click', () => responder(true));
    el.btnNo.addEventListener('click', () => responder(false));
    el.datoSig.addEventListener('click', avanzar);
    el.dato.addEventListener('click', avanzar);
    el.reintentar.addEventListener('click', nuevo);

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.modal-overlay.show')) return;
      if (el.resultado.style.display === 'block') return;
      if (el.dato.classList.contains('show')) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); avanzar(); }
        return;
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); responder(true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); responder(false); }
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
