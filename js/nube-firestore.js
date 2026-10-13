window.BioNube = (function () {
  var ls = window.localStorage;
  var COMUN = {
    bionyssa_tema: 1, bionyssa_sesion: 1, bionyssa_cuentas: 1,
    bionyssa_publicaciones: 1, bionyssa_perfiles: 1
  };
  var estado = { uid: null, idCuenta: null, activo: false };
  var sucios = {}, temporizador = null, activando = null, ultimaNube = {};
  function configurado() { return !!(window.BioFirebase && BioFirebase.configurado()); }
  function nucleo() { return BioFirebase.nucleo(); }
  function ses() { try { return window.BioSesion ? BioSesion.obtener() : null; } catch (e) { return null; } }
  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function sincronizable(k) {
    return typeof k === 'string' && k.indexOf('bionyssa_') === 0 && !COMUN[k] && k.indexOf('bionyssa_nube') !== 0;
  }
  function coincide(user, s) {
    if (!user || !s) return false;
    if (s.id === 'g_' + user.uid) return true;
    var a = String(user.email || '').toLowerCase();
    return !!a && a === String(s.correo || '').toLowerCase();
  }
  function limpiarHandle(h) {
    h = String(h || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '');
    return h.slice(0, 30) || 'usuario';
  }
  function parse(raw) { try { return JSON.parse(raw); } catch (e) { return undefined; } }
  function valido(o) {
    if (o === null) return true;
    var t = typeof o;
    if (t === 'string' || t === 'boolean') return true;
    if (t === 'number') return isFinite(o);
    if (Array.isArray(o)) return o.every(function (x) { return !Array.isArray(x) && valido(x); });
    if (t === 'object') return Object.keys(o).every(function (k) { return k && !/^__.*__$/.test(k) && k.indexOf('/') < 0 && valido(o[k]); });
    return false;
  }
  function entrada(raw, t) {
    if (raw === null || raw === undefined) return { v: null, j: 1, t: t, b: 1 };
    var o = parse(raw);
    if (o !== undefined && valido(o)) return { v: o, j: 1, t: t };
    return { v: String(raw), j: 0, t: t };
  }
  function decodificar(e) {
    if (!e || e.b) return null;
    if (e.j) return JSON.stringify(e.v);
    return e.v === null || e.v === undefined ? null : String(e.v);
  }
  function orden(o) {
    if (Array.isArray(o)) return '[' + o.map(orden).join(',') + ']';
    if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + orden(o[k]); }).join(',') + '}';
    return JSON.stringify(o);
  }
  function canon(raw) {
    if (raw === null || raw === undefined) return null;
    var o = parse(raw);
    return o === undefined ? 's:' + raw : 'j:' + orden(o);
  }
  function mejor(a, b, menor) {
    if (a === null || a === undefined) return b === undefined ? null : b;
    if (b === null || b === undefined) return a;
    return menor ? Math.min(a, b) : Math.max(a, b);
  }
  function fusionProgreso(l, c) {
    var A = parse(l) || {}, B = parse(c) || {}, R = {};
    Object.keys(A).concat(Object.keys(B)).forEach(function (j) {
      if (R[j]) return;
      var a = A[j], b = B[j];
      if (!a || !b) { R[j] = a || b; return; }
      R[j] = {
        partidas: Math.max(a.partidas || 0, b.partidas || 0),
        victorias: Math.max(a.victorias || 0, b.victorias || 0),
        mejor: mejor(a.mejor, b.mejor, j === 'memorama'),
        racha: Math.max(a.racha || 0, b.racha || 0)
      };
    });
    return JSON.stringify(R);
  }
  function fusionPuntos(l, c) {
    var A = parse(l) || { p: 0, dia: '' }, B = parse(c) || { p: 0, dia: '' };
    return JSON.stringify((B.p || 0) > (A.p || 0) ? B : A);
  }
  function fusionMax(l, c) { return String(Math.max(+l || 0, +c || 0)); }
  function fusionO(l, c) { return l !== null && l !== undefined ? l : c; }
  function fusionDe(k) {
    if (k === 'bionyssa_progreso') return fusionProgreso;
    if (k === 'bionyssa_puntos') return fusionPuntos;
    if (k === 'bionyssa_sin_red_record') return fusionMax;
    if (k.indexOf('bionyssa_tuto_') === 0) return fusionO;
    return null;
  }
  function leerMeta(id) { try { return JSON.parse(ls.getItem('bio_nt@' + id) || '{}') || {}; } catch (e) { return {}; } }
  function guardarMeta(id, m) { try { ls.setItem('bio_nt@' + id, JSON.stringify(m)); } catch (e) {} }
  function ponerLocal(id, clave, valor) {
    try {
      if (valor === null || valor === undefined) delete ls[clave + '@' + id];
      else ls[clave + '@' + id] = valor;
    } catch (e) {}
  }
  function fijarClaveLocal(id, clave) {
    try {
      var cs = JSON.parse(ls.getItem('bionyssa_cuentas') || '{}') || {};
      Object.keys(cs).forEach(function (k) { if (cs[k] && cs[k].id === id) cs[k].usuario = clave; });
      ls.setItem('bionyssa_cuentas', JSON.stringify(cs));
      var se = JSON.parse(ls.getItem('bionyssa_sesion') || 'null');
      if (se && se.id === id) { se.usuario = clave; ls.setItem('bionyssa_sesion', JSON.stringify(se)); }
    } catch (e) {}
  }
  async function reclamar(n, handle, uid) {
    var ref = n.ff.doc(n.db, 'usuarios_unicos', 'h_' + handle);
    return n.ff.runTransaction(n.db, async function (tx) {
      var d = await tx.get(ref);
      if (d.exists()) return d.data().uid === uid;
      tx.set(ref, { uid: uid });
      return true;
    });
  }
  async function reservarClave(n, base, uid) {
    var b = limpiarHandle(base);
    for (var i = 1; i < 80; i++) {
      var cand = i === 1 ? b : b + i;
      if (await reclamar(n, cand, uid)) return '@' + cand;
    }
    throw { code: 'bio/sin-usuario' };
  }
  async function asegurarPerfil(n, user, s) {
    var ff = n.ff, ref = ff.doc(n.db, 'perfiles', user.uid);
    var snap = await ff.getDoc(ref);
    if (snap.exists()) {
      var c = snap.data().clave;
      if (c && c !== s.usuario) fijarClaveLocal(s.id, c);
      return;
    }
    var pf = {}, viejo = {};
    try { pf = JSON.parse(ls.getItem('bionyssa_perfiles') || '{}') || {}; viejo = pf[s.usuario] || {}; } catch (e) {}
    var clave = await reservarClave(n, s.usuario, user.uid);
    var d = { uid: user.uid, clave: clave, nombre: s.nombre || 'Usuario', creado: Date.now(), actualizado: Date.now() };
    if (viejo.bio) d.bio = String(viejo.bio).slice(0, 160);
    if (viejo.nombreCom) d.nombreCom = String(viejo.nombreCom).slice(0, 40);
    if (viejo.foto && String(viejo.foto).length < 140000) d.foto = viejo.foto;
    if (viejo.usuarioCom) {
      var h = limpiarHandle(viejo.usuarioCom);
      try { if (await reclamar(n, h, user.uid)) d.usuarioCom = '@' + h; } catch (e) {}
    }
    await ff.setDoc(ref, d);
    if (clave !== s.usuario) fijarClaveLocal(s.id, clave);
    try { if (pf[s.usuario]) { delete pf[s.usuario]; ls.setItem('bionyssa_perfiles', JSON.stringify(pf)); } } catch (e) {}
  }
  async function reconciliar(n, user, s) {
    var ff = n.ff, ref = ff.doc(n.db, 'usuarios', user.uid);
    var snap = await ff.getDoc(ref);
    var nube = (snap.exists() && snap.data().datos) || {};
    var meta = leerMeta(s.id), fin = '@' + s.id, claves = {}, i, ahora = Date.now();
    for (i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (k && k.indexOf('bionyssa_') === 0 && k.slice(-fin.length) === fin) {
        var c0 = k.slice(0, -fin.length);
        if (sincronizable(c0)) claves[c0] = 1;
      }
    }
    Object.keys(nube).forEach(function (c) { if (sincronizable(c)) claves[c] = 1; });
    var subir = {}, cambio = false;
    Object.keys(claves).forEach(function (c) {
      var loc = ls.getItem(c);
      var ent = nube[c], hayNube = !!ent;
      var nubeRaw = hayNube ? decodificar(ent) : null;
      var tN = hayNube ? (ent.t || 0) : 0, tL = meta[c] || 0;
      var fus = fusionDe(c), res, t;
      if (fus) {
        if (loc === null && nubeRaw === null) return;
        res = fus(loc, nubeRaw);
        t = canon(res) === canon(nubeRaw) ? tN : ahora;
      } else if (!hayNube) {
        if (loc === null) return;
        res = loc; t = tL || ahora;
      } else if (tL > tN) {
        res = loc; t = tL;
      } else {
        res = nubeRaw; t = tN;
      }
      if (canon(res) !== canon(loc)) { ponerLocal(s.id, c, res); cambio = true; }
      meta[c] = t;
      var igualNube = hayNube && (res === null ? !!ent.b : (!ent.b && canon(res) === canon(nubeRaw)));
      if (!igualNube) subir[c] = { raw: res, t: t };
      ultimaNube[c] = { raw: res, t: t };
    });
    guardarMeta(s.id, meta);
    var data = { uid: user.uid, nombre: s.nombre || '', correo: String(s.correo || '').toLowerCase(), actualizado: ahora };
    var campos = ['uid', 'nombre', 'correo', 'actualizado'];
    if (!snap.exists()) { data.creado = ahora; campos.push('creado'); }
    var hay = Object.keys(subir);
    if (hay.length) {
      data.datos = {};
      hay.forEach(function (c) { data.datos[c] = entrada(subir[c].raw, subir[c].t); campos.push('datos.' + c); });
    }
    if (hay.length || !snap.exists()) await ff.setDoc(ref, data, { mergeFields: campos });
    return cambio;
  }
  function transitorio(e) {
    var c = e && e.code ? String(e.code) : '';
    return c === 'unavailable' || c === 'deadline-exceeded' || c === 'resource-exhausted' || c === 'aborted' || c === 'internal' || c === 'cancelled' || c === 'unknown';
  }
  async function enviarClaves(n, s, claves, meta, ahora) {
    var ff = n.ff;
    var data = { uid: estado.uid, nombre: s.nombre || '', correo: String(s.correo || '').toLowerCase(), actualizado: ahora, datos: {} };
    var campos = ['uid', 'nombre', 'correo', 'actualizado'];
    claves.forEach(function (c) {
      var raw = ls.getItem(c), t = meta[c] || ahora, fus = fusionDe(c);
      if (fus && raw !== null && ultimaNube[c] && ultimaNube[c].raw !== null) {
        var f = fus(raw, ultimaNube[c].raw);
        if (canon(f) !== canon(raw)) { ponerLocal(s.id, c, f); raw = f; }
      }
      data.datos[c] = entrada(raw, t);
      campos.push('datos.' + c);
      ultimaNube[c] = { raw: raw, t: t };
    });
    await ff.setDoc(ff.doc(n.db, 'usuarios', estado.uid), data, { mergeFields: campos });
  }
  async function subirSucios() {
    var claves = Object.keys(sucios);
    if (!claves.length || !estado.activo) return;
    var s = ses();
    if (!s || s.id !== estado.idCuenta) return;
    sucios = {};
    var n = await nucleo(), meta = leerMeta(s.id), ahora = Date.now(), reintentar = false;
    try {
      await enviarClaves(n, s, claves, meta, ahora);
    } catch (e) {
      if (claves.length > 1) {
        for (var i = 0; i < claves.length; i++) {
          try { await enviarClaves(n, s, [claves[i]], meta, ahora); }
          catch (e2) { if (transitorio(e2)) { sucios[claves[i]] = 1; reintentar = true; } }
        }
      } else if (transitorio(e)) {
        sucios[claves[0]] = 1; reintentar = true;
      }
    }
    if (reintentar) setTimeout(programar, 6000);
  }
  function asegurar(k) {
    if (!estado.activo || !sincronizable(k) || !ses()) return;
    if (ls.getItem(k) === null) return;
    var u = ultimaNube[k];
    if (u && u.raw !== null && u.raw !== undefined) return;
    sucios[k] = 1;
    programar();
  }
  function programar() {
    if (!estado.activo) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(subirSucios, 700);
  }
  (function () {
    var proto = Storage.prototype, setPrev = proto.setItem, remPrev = proto.removeItem;
    function marcar(almacen, k) {
      if (almacen !== ls || !sincronizable(k)) return;
      var s = ses();
      if (!s) return;
      var m = leerMeta(s.id);
      m[k] = Date.now();
      guardarMeta(s.id, m);
      sucios[k] = 1;
      programar();
    }
    proto.setItem = function (k, v) { var r = setPrev.call(this, k, v); marcar(this, k); return r; };
    proto.removeItem = function (k) { var r = remPrev.call(this, k); marcar(this, k); return r; };
    addEventListener('pagehide', function () { clearTimeout(temporizador); subirSucios(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { clearTimeout(temporizador); subirSucios(); } });
  })();
  function fotoValida(f, max) {
    return typeof f === 'string' && f.length <= max && /^data:image\/[a-z]+;base64,/.test(f);
  }
  async function migrarLegacy(n, user, s, claveAntes) {
    var arr;
    try { arr = JSON.parse(ls.getItem('bionyssa_publicaciones') || '[]'); } catch (e) { return; }
    if (!Array.isArray(arr)) return;
    var mios = arr.filter(function (p) { return p && typeof p.id === 'number' && (p.usuario === claveAntes || p.usuario === s.usuario); });
    if (!mios.length) return;
    var ff = n.ff, ahora = Date.now();
    var subidas = await Promise.all(mios.map(function (p) {
      var texto = String(p.texto || '').slice(0, 1000);
      var foto = fotoValida(p.foto, 740000) ? p.foto : null;
      if (!texto.length && !foto) return Promise.resolve(true);
      var creado = +p.creado || ahora;
      if (creado > ahora) creado = ahora;
      var ref = ff.doc(n.db, 'publicaciones', 'legacy_' + user.uid + '_' + p.id);
      return ff.getDoc(ref).then(function (sn) {
        if (sn.exists()) return true;
        return ff.setDoc(ref, {
          uid: user.uid, usuario: String(s.usuario || '').slice(0, 40), nombre: String(p.nombre || s.nombre || 'Usuario').slice(0, 80),
          texto: texto, foto: foto, creado: creado
        }).then(function () { return true; });
      }).catch(function () { return false; });
    }));
    var bien = mios.filter(function (p, k) { return subidas[k]; });
    if (!bien.length) return;
    try {
      var cur = JSON.parse(ls.getItem('bionyssa_publicaciones') || '[]');
      var quedan = (Array.isArray(cur) ? cur : arr).filter(function (p) { return bien.every(function (b) { return b.id !== (p && p.id); }); });
      ls.setItem('bionyssa_publicaciones', JSON.stringify(quedan));
    } catch (e) {}
  }
  function recargarUnaVez() {
    try {
      var t = +sessionStorage.getItem('bio_nube_rec') || 0;
      if (Date.now() - t < 15000) return;
      sessionStorage.setItem('bio_nube_rec', String(Date.now()));
    } catch (e) { return; }
    location.reload();
  }
  function avisarSinNube() {
    try {
      if (!navigator.onLine || sessionStorage.getItem('bio_nube_aviso')) return;
      sessionStorage.setItem('bio_nube_aviso', '1');
    } catch (e) { return; }
    setTimeout(function () {
      if (window.BioToast) BioToast('Cierra sesión y entra otra vez para guardar tu avance en la nube');
    }, 1500);
  }
  function registrarAcceso(n, user, s) {
    try {
      var marca = 'bio_acceso_' + user.uid;
      if (sessionStorage.getItem(marca)) return;
      sessionStorage.setItem(marca, '1');
      var ff = n.ff, d = {
        uid: user.uid,
        nombre: String(s.nombre || user.displayName || 'Usuario').slice(0, 80),
        correo: String(user.email || '').slice(0, 120),
        ultimoAcceso: Date.now(),
        accesos: ff.increment(1)
      };
      var cre = Date.parse(user.metadata && user.metadata.creationTime);
      if (cre) d.creado = cre;
      ff.setDoc(ff.doc(n.db, 'accesos', user.uid), d, { merge: true })
        .catch(function () { try { sessionStorage.removeItem(marca); } catch (e) {} });
    } catch (e) {}
  }
  function desactivar() { estado.activo = false; estado.uid = null; estado.idCuenta = null; }
  function activar(opciones) {
    opciones = opciones || {};
    if (!configurado()) return Promise.resolve(null);
    var s = ses();
    if (!s) { desactivar(); return Promise.resolve(null); }
    return (async function () {
      var n = await nucleo();
      await n.auth.authStateReady();
      var user = n.auth.currentUser;
      if (!user || !coincide(user, s)) { desactivar(); if (!opciones.sinAviso) avisarSinNube(); return null; }
      if (estado.activo && estado.uid === user.uid && estado.idCuenta === s.id) return estado.uid;
      var llave = user.uid + '|' + s.id;
      if (activando && activando.llave === llave) return activando.p;
      var p = (async function () {
        var claveAntes = s.usuario;
        try {
          await asegurarPerfil(n, user, s);
          var s2 = ses() || s;
          var cambio = await reconciliar(n, user, s2);
          await migrarLegacy(n, user, s2, claveAntes);
          estado.uid = user.uid; estado.idCuenta = s2.id; estado.activo = true;
          registrarAcceso(n, user, s2);
          document.dispatchEvent(new CustomEvent('bio-nube-listo', { detail: { uid: user.uid } }));
          if (Object.keys(sucios).length) programar();
          if (cambio && !opciones.sinRecargar) recargarUnaVez();
          return user.uid;
        } catch (e) {
          desactivar();
          return null;
        } finally {
          activando = null;
        }
      })();
      activando = { llave: llave, p: p };
      return p;
    })().catch(function () { return null; });
  }
  async function requerir() {
    if (!ses()) throw { code: 'bio/sin-sesion' };
    var uid = estado.activo ? estado.uid : await activar({ sinRecargar: true, sinAviso: true });
    if (!uid) throw { code: 'bio/sin-nube' };
    return nucleo();
  }
  async function salir() {
    try {
      clearTimeout(temporizador);
      await Promise.race([subirSucios(), esperar(2500)]);
    } catch (e) {}
    desactivar(); activando = null; ultimaNube = {};
    try {
      if (configurado()) { var n = await nucleo(); await n.fa.signOut(n.auth); }
    } catch (e) {}
  }
  var com = null;
  function iniciarComunidad() {
    com = { cbs: [], posts: [], likes: {}, coms: {}, porUid: {}, porClave: {}, cargada: false, error: null, tic: 0 };
    function avisar() {
      clearTimeout(com.tic);
      com.tic = setTimeout(function () {
        var e = ensamblar();
        com.cbs.forEach(function (cb) { try { cb(e); } catch (x) {} });
      }, 30);
    }
    com.avisar = avisar;
    nucleo().then(function (n) {
      var ff = n.ff, db = n.db;
      function falla(e) { com.error = e && e.code || 'error'; com.cargada = true; avisar(); }
      ff.onSnapshot(ff.query(ff.collection(db, 'publicaciones'), ff.orderBy('creado', 'desc'), ff.limit(200)), function (sn) {
        com.posts = sn.docs.map(function (d) { var o = d.data(); o.id = d.id; return o; });
        com.cargada = true; com.error = null; avisar();
      }, falla);
      ff.onSnapshot(ff.collectionGroup(db, 'likes'), function (sn) {
        var m = {};
        sn.docs.forEach(function (d) {
          var p = d.ref.parent.parent; if (!p) return;
          (m[p.id] = m[p.id] || []).push(d.id);
        });
        com.likes = m; avisar();
      }, function () {});
      ff.onSnapshot(ff.collectionGroup(db, 'comentarios'), function (sn) {
        var m = {};
        sn.docs.forEach(function (d) {
          var p = d.ref.parent.parent; if (!p) return;
          var o = d.data();
          (m[p.id] = m[p.id] || []).push({ id: d.id, t: o.texto, u: o.usuario, uid: o.uid, creado: o.creado || 0 });
        });
        Object.keys(m).forEach(function (k) { m[k].sort(function (a, b) { return a.creado - b.creado; }); });
        com.coms = m; avisar();
      }, function () {});
      ff.onSnapshot(ff.collection(db, 'perfiles'), function (sn) {
        var pu = {}, pc = {};
        sn.docs.forEach(function (d) {
          var o = d.data(); o.uid = d.id;
          pu[d.id] = o;
          if (o.clave) pc[o.clave] = o;
        });
        com.porUid = pu; com.porClave = pc; avisar();
      }, function () {});
    }).catch(function () { com.error = 'sin-firebase'; com.cargada = true; avisar(); });
    setTimeout(function () { if (!com.cargada) { com.cargada = true; avisar(); } }, 8000);
  }
  function ensamblar() {
    var posts = com.posts.map(function (p) {
      var l = com.likes[p.id] || [];
      return {
        id: p.id, uid: p.uid, usuario: p.usuario, nombre: p.nombre, texto: p.texto || '', foto: p.foto || '',
        creado: p.creado || 0, likes: l.length, likedBy: l, comentarios: com.coms[p.id] || []
      };
    });
    return { posts: posts, porUid: com.porUid, porClave: com.porClave, cargada: com.cargada, error: com.error };
  }
  function comunidad(cb) {
    if (!configurado()) { cb({ posts: [], porUid: {}, porClave: {}, cargada: true, error: 'sin-firebase' }); return; }
    if (!com) iniciarComunidad();
    com.cbs.push(cb);
    if (com.cargada) com.avisar();
  }
  async function publicar(d) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw { code: 'unavailable' };
    var n = await requerir(), ff = n.ff, s = ses();
    var texto = String(d.texto || '').slice(0, 1000);
    var foto = d.foto ? String(d.foto) : null;
    if (foto && !fotoValida(foto, 740000)) throw { code: 'bio/foto-grande' };
    if (!texto.length && !foto) throw { code: 'bio/vacia' };
    return ff.addDoc(ff.collection(n.db, 'publicaciones'), {
      uid: estado.uid, usuario: String(s.usuario || '').slice(0, 40), nombre: String(s.nombre || 'Usuario').slice(0, 80),
      texto: texto, foto: foto, creado: Date.now()
    });
  }
  async function meGusta(postId, si) {
    var n = await requerir(), ff = n.ff;
    var ref = ff.doc(n.db, 'publicaciones', postId, 'likes', estado.uid);
    return si ? ff.setDoc(ref, { uid: estado.uid, creado: Date.now() }) : ff.deleteDoc(ref);
  }
  async function comentar(postId, texto) {
    var n = await requerir(), ff = n.ff, s = ses();
    return ff.addDoc(ff.collection(n.db, 'publicaciones', postId, 'comentarios'), {
      uid: estado.uid, usuario: String(s.usuario || '').slice(0, 40), nombre: String(s.nombre || 'Usuario').slice(0, 80),
      texto: String(texto || '').slice(0, 300), creado: Date.now()
    });
  }
  async function borrarComentario(postId, cid) {
    var n = await requerir();
    return n.ff.deleteDoc(n.ff.doc(n.db, 'publicaciones', postId, 'comentarios', cid));
  }
  async function borrarPublicacion(postId) {
    var n = await requerir(), ff = n.ff;
    var res = await Promise.all([
      ff.getDocs(ff.collection(n.db, 'publicaciones', postId, 'likes')),
      ff.getDocs(ff.collection(n.db, 'publicaciones', postId, 'comentarios'))
    ]);
    var refs = [];
    res.forEach(function (sn) { sn.docs.forEach(function (d) { refs.push(d.ref); }); });
    for (var i = 0; i < refs.length; i += 12) {
      var tanda = ff.writeBatch(n.db);
      refs.slice(i, i + 12).forEach(function (r) { tanda.delete(r); });
      await tanda.commit();
    }
    return ff.deleteDoc(ff.doc(n.db, 'publicaciones', postId));
  }
  async function guardarPerfil(c) {
    var n = await requerir(), ff = n.ff, db = n.db, uid = estado.uid;
    var ref = ff.doc(db, 'perfiles', uid);
    var actual = (await ff.getDoc(ref)).data() || {};
    var nuevoH = c.usuarioCom ? limpiarHandle(c.usuarioCom) : null;
    var viejoH = actual.usuarioCom ? limpiarHandle(actual.usuarioCom) : null;
    if (nuevoH && nuevoH !== viejoH) {
      if (!(await reclamar(n, nuevoH, uid))) throw { code: 'bio/usuario-ocupado' };
    }
    var upd = { actualizado: Date.now() };
    upd.bio = c.bio ? c.bio : ff.deleteField();
    upd.nombreCom = c.nombreCom ? c.nombreCom : ff.deleteField();
    upd.usuarioCom = nuevoH ? '@' + nuevoH : ff.deleteField();
    if (c.foto === null) upd.foto = ff.deleteField();
    else if (typeof c.foto === 'string') upd.foto = c.foto;
    await ff.updateDoc(ref, upd);
    if (viejoH && viejoH !== nuevoH && viejoH !== limpiarHandle(actual.clave)) {
      try { await ff.deleteDoc(ff.doc(db, 'usuarios_unicos', 'h_' + viejoH)); } catch (e) {}
    }
  }
  if (configurado() && ses()) setTimeout(function () { activar(); }, 0);
  return {
    configurado: configurado,
    activar: activar,
    asegurar: asegurar,
    activo: function () { return estado.activo; },
    uid: function () { return estado.activo ? estado.uid : null; },
    salir: salir,
    comunidad: comunidad,
    publicar: publicar,
    meGusta: meGusta,
    comentar: comentar,
    borrarComentario: borrarComentario,
    borrarPublicacion: borrarPublicacion,
    guardarPerfil: guardarPerfil
  };
})();
