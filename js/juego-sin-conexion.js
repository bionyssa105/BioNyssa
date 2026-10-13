(function () {
  var $ = function (i) { return document.getElementById(i); };
  var cv = $('c'), g = cv.getContext('2d'), W = 360, H = 520;
  var BUENOS = ['Botella', 'Lata', 'Carton', 'Bolsa'], IM = {};
  BUENOS.concat(['Pila', 'mascota']).forEach(function (n) { var i = new Image(); i.src = '/assets/img/' + n + '.webp'; IM[n] = i; });
  var K = 'bionyssa_sin_red_record', est = 'inicio', px = W / 2, pts = 0, vidas = 5, cosas = [], cuadro = 0, tecla = 0;
  var mejor = 0;
  try { mejor = +localStorage.getItem(K) || 0; } catch (e) {}
  $('rec').textContent = mejor;
  function hud() { $('pts').textContent = pts; $('vid').textContent = vidas > 0 ? new Array(vidas + 1).join('♥') : '-'; }
  function nueva() {
    var mala = Math.random() < 0.22;
    cosas.push({ n: mala ? 'Pila' : BUENOS[Math.random() * 4 | 0], x: 30 + Math.random() * (W - 60), y: -40, a: 0, r: (Math.random() - 0.5) * 0.06, mala: mala });
  }
  function empezar() { pts = 0; vidas = 5; cosas = []; cuadro = 0; px = W / 2; est = 'jugando'; $('vel').hidden = true; hud(); }
  function fin() {
    est = 'fin';
    var rec = pts > mejor;
    if (rec) { mejor = pts; try { localStorage.setItem(K, mejor); } catch (e) {} $('rec').textContent = mejor; }
    $('velTit').textContent = rec ? '¡Nuevo récord!' : 'Fin del juego';
    $('velTxt').textContent = 'Atrapaste ' + pts + (pts === 1 ? ' residuo.' : ' residuos.') + ' Reciclar sí cuenta.';
    $('jugar').textContent = 'Jugar de nuevo';
    $('vel').hidden = false;
  }
  function paso() {
    cuadro++;
    if (cuadro % Math.max(24, 62 - pts) === 0) nueva();
    var vel = Math.min(5.2, 1.8 + pts * 0.05);
    px = Math.max(36, Math.min(W - 36, px + tecla * 6));
    for (var i = cosas.length - 1; i >= 0; i--) {
      var c = cosas[i]; c.y += vel; c.a += c.r;
      if (c.y > H - 100 && c.y < H - 45 && Math.abs(c.x - px) < 46) {
        cosas.splice(i, 1);
        if (c.mala) vidas--; else pts++;
        hud();
      } else if (c.y > H + 30) {
        cosas.splice(i, 1);
        if (!c.mala) { vidas--; hud(); }
      }
    }
    if (vidas <= 0) fin();
  }
  function dibujar() {
    var f = g.createLinearGradient(0, 0, 0, H);
    f.addColorStop(0, '#e9efcf'); f.addColorStop(1, '#b9c98a');
    g.fillStyle = f; g.fillRect(0, 0, W, H);
    g.fillStyle = '#6f8a3a'; g.fillRect(0, H - 22, W, 22);
    cosas.forEach(function (c) {
      g.save(); g.translate(c.x, c.y); g.rotate(c.a);
      if (IM[c.n].complete) g.drawImage(IM[c.n], -22, -22, 44, 44);
      g.restore();
    });
    if (IM.mascota.complete) g.drawImage(IM.mascota, px - 38, H - 104, 76, 76);
  }
  function bucle() { if (est === 'jugando') paso(); dibujar(); requestAnimationFrame(bucle); }
  function mover(e) { var r = cv.getBoundingClientRect(); px = Math.max(36, Math.min(W - 36, (e.clientX - r.left) * W / r.width)); }
  cv.addEventListener('pointermove', mover);
  cv.addEventListener('pointerdown', mover);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') tecla = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') tecla = 1;
    if (e.key === 'Enter' && est !== 'jugando') empezar();
  });
  document.addEventListener('keyup', function (e) {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].indexOf(e.key) > -1) tecla = 0;
  });
  $('jugar').addEventListener('click', empezar);
  var aviso = $('aviso');
  function hayRed() {
    aviso.hidden = false;
    $('volver').textContent = 'Volver';
    $('avisoTxt').textContent = '¡Ya hay conexión! Tu partida no se pierde si sigues jugando.';
  }
  window.addEventListener('online', hayRed);
  function conRedReal() {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    return fetch('/manifest.webmanifest?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(t); return r.ok; }, function () { clearTimeout(t); return false; });
  }
  function salir() {
    var v = null, ultimo = 0;
    try {
      v = sessionStorage.getItem('bio_volver');
      ultimo = +sessionStorage.getItem('bio_reintento') || 0;
      sessionStorage.setItem('bio_reintento', String(Date.now()));
    } catch (e) {}
    if (Date.now() - ultimo < 15000) return;
    if (!/offline\.html$/.test(location.pathname)) location.reload();
    else location.replace(v && !/offline\.html/.test(v) ? v : '/paginas/menu.html');
  }
  if (navigator.onLine) conRedReal().then(function (ok) { if (ok) salir(); });
  if (navigator.onLine) { $('avisoTxt').textContent = 'Parece que hay conexión.'; aviso.hidden = false; $('volver').textContent = 'Reintentar'; }
  $('volver').addEventListener('click', function () {
    var v = null;
    try { v = sessionStorage.getItem('bio_volver'); } catch (e) {}
    if (!/offline\.html$/.test(location.pathname)) location.reload();
    else location.href = v || '/paginas/menu.html';
  });
  hud(); bucle();
})();
