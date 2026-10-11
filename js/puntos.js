(() => {
  const $ = (s, raiz) => (raiz || document).querySelector(s);
  const LLAVE = 'bionyssa_puntos';
  const NIVELES = [['Semilla', 0], ['Brote', 30], ['Planta', 80], ['Árbol', 160]];
  const GANA = [
    ['+1', 'Entrar a BioNyssa cada día'],
    ['+5', 'Terminar una partida en Minijuegos'],
    ['+5', 'Anotar un riego en Mi planta'],
    ['+3', 'Regar y hacer florecer la planta de la portada']
  ];

  const leer = () => { try { return JSON.parse(localStorage.getItem(LLAVE)) || { p: 0, dia: '' }; } catch (e) { return { p: 0, dia: '' }; } };
  const guardar = (d) => { try { localStorage.setItem(LLAVE, JSON.stringify(d)); } catch (e) {} };
  const nivel = (p) => NIVELES.reduce((mejor, n, k) => (p >= n[1] ? k : mejor), 0);
  const listaGana = () => '<ul class="gana-lista">' + GANA.map((g) => '<li><b>' + g[0] + '</b><span>' + g[1] + '</span></li>').join('') + '</ul>';

  function avance(p) {
    const i = nivel(p);
    const sig = NIVELES[i + 1];
    return { i, sig, pct: sig ? (p - NIVELES[i][1]) / (sig[1] - NIVELES[i][1]) * 100 : 100 };
  }

  function pintar() {
    const { p } = leer();
    const { i, sig, pct } = avance(p);
    document.querySelectorAll('.puntos-chip').forEach((c) => {
      c.lastChild.innerHTML = '<em>' + NIVELES[i][0] + ' | </em>' + p + ' pts';
    });
    const barra = $('.nivel-barra b');
    if (!barra) return;
    barra.style.width = pct + '%';
    const txt = $('#nivelTxt');
    if (txt) txt.textContent = sig ? 'Te faltan ' + (sig[1] - p) + ' puntos para ser ' + sig[0] + '.' : 'Llegaste al máximo. Eres un árbol.';
    document.querySelectorAll('.nivel-lista span').forEach((s, k) => s.classList.toggle('ok', k <= i));
  }

  window.BioPuntos = {
    dar(n, motivo) {
      const d = leer();
      const antes = nivel(d.p);
      d.p += n;
      guardar(d);
      pintar();
      document.querySelectorAll('.puntos-chip').forEach((c) => {
        c.classList.remove('sube');
        void c.offsetWidth;
        c.classList.add('sube');
      });
      const ahora = nivel(d.p);
      if (window.BioToast) BioToast(ahora > antes ? '¡Subiste a ' + NIVELES[ahora][0] + '!' : '+' + n + ' pts' + (motivo ? ' | ' + motivo : ''));
    }
  };

  function chip() {
    const fila = $('.head-cta') || $('.topbar-row');
    if (!fila || $('.home-header')) return;
    const c = document.createElement('a');
    c.className = 'puntos-chip';
    c.href = 'menu.html';
    c.innerHTML = '<i></i><span></span>';
    const alInicio = fila.firstChild.classList && fila.classList.contains('head-cta');
    fila.insertBefore(c, alInicio ? fila.firstChild : $('.theme-toggle', fila));
  }

  function tarjetaMenu() {
    const rejilla = $('.menu-grid');
    if (!rejilla) return;
    const t = document.createElement('div');
    t.className = 'nivel-card';
    const sesion = window.BioSesion && BioSesion.obtener();
    t.innerHTML = '<h3>Tu nivel</h3><p id="nivelTxt"></p><div class="nivel-barra"><b></b></div><div class="nivel-lista">' +
      NIVELES.map((n) => '<span>' + n[0] + '</span>').join('') + '</div><h4 class="gana-tit">Cómo ganar puntos</h4>' + listaGana() +
      '<p class="gana-nota">' + (sesion ? 'Tus puntos se guardan en tu cuenta.' : 'Como invitado, los puntos se quedan en este dispositivo. Crea una cuenta para no perderlos.') + '</p>';
    rejilla.parentNode.insertBefore(t, rejilla.nextSibling);
  }

  function ventana() {
    const c = $('.puntos-chip');
    if (!c) return;
    const enMenu = !!$('.nivel-card');
    const pop = document.createElement('div');
    pop.className = 'puntos-pop';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Cómo funcionan los puntos');
    document.body.appendChild(pop);
    c.setAttribute('aria-haspopup', 'dialog');
    c.setAttribute('aria-expanded', 'false');
    c.title = 'Cómo funcionan los puntos';

    function llenar() {
      const { p } = leer();
      const { i, sig, pct } = avance(p);
      pop.innerHTML = '<strong class="pp-nivel">Tu nivel: ' + NIVELES[i][0] + '</strong>' +
        '<p class="pp-sub">' + p + ' pts | ' + (sig ? 'te faltan ' + (sig[1] - p) + ' para ser ' + sig[0] + '.' : 'llegaste al máximo.') + '</p>' +
        '<div class="pp-barra"><b style="width:' + pct + '%"></b></div>' +
        '<h4>Cómo ganar puntos</h4>' + listaGana() +
        '<p class="pp-niveles">' + NIVELES.map((n) => n[0] + ' ' + n[1]).join(' | ') + '</p>' +
        (enMenu ? '' : '<a class="pp-link" href="menu.html">Ver mi nivel en el menú</a>');
    }
    function colocar() {
      const r = c.getBoundingClientRect();
      const ancho = pop.offsetWidth;
      pop.style.top = (r.bottom + 10) + 'px';
      pop.style.left = Math.max(12, Math.min(r.right - ancho, innerWidth - ancho - 12)) + 'px';
    }
    function cerrar() {
      pop.hidden = true;
      c.setAttribute('aria-expanded', 'false');
    }

    c.addEventListener('click', (e) => {
      e.preventDefault();
      if (!pop.hidden) return cerrar();
      llenar();
      pop.hidden = false;
      colocar();
      c.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', (e) => {
      if (!pop.hidden && !e.target.closest('.puntos-pop') && !e.target.closest('.puntos-chip')) cerrar();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    addEventListener('resize', cerrar);
  }

  chip();
  const hoy = new Date().toDateString();
  const d0 = leer();
  if (d0.dia !== hoy) {
    d0.dia = hoy;
    guardar(d0);
    setTimeout(() => BioPuntos.dar(1, 'visita del día'), 900);
  }
  tarjetaMenu();
  pintar();
  ventana();

  const guardarOriginal = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    guardarOriginal.call(this, k, v);
    if (k === 'bionyssa_progreso') setTimeout(() => BioPuntos.dar(5, 'partida jugada'), 300);
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('#bRiego');
    if (!b || b.disabled) return;
    setTimeout(() => {
      BioPuntos.dar(5, 'riego');
      if (window.BioHojas) BioHojas(e.clientX, e.clientY, 8);
    }, 60);
  });
})();
