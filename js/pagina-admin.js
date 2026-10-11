(function () {
  var ADMIN_CORREOS = ['roelrico20@gmail.com'];
  var cuerpo = document.getElementById('admCuerpo'), sub = document.getElementById('admSub');

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function msg(html) { cuerpo.innerHTML = ''; var d = el('div', 'adm-msg'); d.innerHTML = html; cuerpo.appendChild(d); }
  function fecha(ms) {
    if (!ms) return '—';
    return new Date(ms).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function hace(ms) {
    if (!ms) return '';
    var m = Math.round((Date.now() - ms) / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h';
    var d = Math.round(h / 24); return 'hace ' + d + (d === 1 ? ' día' : ' días');
  }

  function pintar(lista) {
    var ahora = Date.now(), DIA = 86400000;
    var hoy = lista.filter(function (u) { return ahora - u.ultimoAcceso < DIA; }).length;
    var sem = lista.filter(function (u) { return ahora - u.ultimoAcceso < 7 * DIA; }).length;
    cuerpo.innerHTML = '';

    var nums = el('div', 'adm-nums');
    [[lista.length, 'personas registradas'], [hoy, 'entraron en 24 h'], [sem, 'entraron en 7 días']].forEach(function (p) {
      var c = el('div', 'adm-num'); c.appendChild(el('b', '', p[0])); c.appendChild(el('span', '', p[1])); nums.appendChild(c);
    });
    cuerpo.appendChild(nums);

    var q = el('input', 'adm-buscar'); q.type = 'search'; q.placeholder = 'Buscar por nombre o correo'; q.setAttribute('aria-label', 'Buscar');
    cuerpo.appendChild(q);
    var caja = el('div', 'adm-lista'); cuerpo.appendChild(caja);

    function filas() {
      var t = q.value.trim().toLowerCase(); caja.innerHTML = '';
      var vis = lista.filter(function (u) { return !t || (u.nombre + ' ' + u.correo).toLowerCase().indexOf(t) > -1; });
      if (!vis.length) { caja.appendChild(el('div', 'adm-msg', 'Nadie coincide con esa búsqueda.')); return; }
      vis.forEach(function (u) {
        var f = el('div', 'adm-fila');
        f.appendChild(el('div', 'adm-av', (u.nombre || '?').trim().charAt(0).toUpperCase()));
        var m = el('div'); m.appendChild(el('div', 'adm-n', u.nombre || 'Sin nombre')); m.appendChild(el('div', 'adm-c', u.correo || 'Sin correo')); f.appendChild(m);
        var d = el('div', 'adm-d'); d.appendChild(el('b', '', 'Último acceso: ' + hace(u.ultimoAcceso)));
        d.appendChild(document.createTextNode(fecha(u.ultimoAcceso) + ' · ' + (u.accesos || 1) + (u.accesos === 1 ? ' visita' : ' visitas')));
        if (u.creado) { var r = el('div', '', 'Se registró: ' + fecha(u.creado)); d.appendChild(r); }
        f.appendChild(d); caja.appendChild(f);
      });
    }
    q.addEventListener('input', filas); filas();
    sub.textContent = 'Solo visible para el administrador. Se actualiza cada vez que abres esta página.';
  }

  if (!BioFirebase.configurado()) { msg('Firebase no está configurado.'); return; }
  BioFirebase.nucleo().then(function (n) {
    return n.auth.authStateReady().then(function () {
      var u = n.auth.currentUser;
      if (!u) { msg('Inicia sesión con la cuenta de administrador para ver esto. <a href="login.html">Iniciar sesión</a>'); return; }
      var correo = String(u.email || '').toLowerCase();
      if (ADMIN_CORREOS.indexOf(correo) < 0 || !u.emailVerified) { msg('Esta cuenta (' + correo + ') no tiene permiso para ver esta página.'); return; }
      return n.ff.getDocs(n.ff.collection(n.db, 'accesos')).then(function (q) {
        var lista = [];
        q.forEach(function (d) { var x = d.data(); x.ultimoAcceso = Number(x.ultimoAcceso) || 0; lista.push(x); });
        lista.sort(function (a, b) { return b.ultimoAcceso - a.ultimoAcceso; });
        if (!lista.length) { msg('Todavía no hay accesos registrados. Aparecerán aquí cuando las personas vuelvan a entrar a la página.'); return; }
        pintar(lista);
      });
    });
  }).catch(function (e) {
    msg(e && e.code === 'permission-denied'
      ? 'Firebase no te dio permiso. Publica las reglas nuevas (<code>firebase deploy --only firestore:rules</code>) y entra con una cuenta de administrador con correo verificado.'
      : 'No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.');
  });
})();
