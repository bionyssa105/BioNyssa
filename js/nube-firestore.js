window.BioNube = (function () {
  var ls = window.localStorage;
  // estas claves son de todos, no de una cuenta
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
  // formato viejo, ya no se sube a la nube
  var VIEJAS = { bionyssa_planta: 1, bionyssa_planta_diario: 1 };
  function sincronizable(k) {
    return typeof k === 'string' && k.indexOf('bionyssa_') === 0 && !COMUN[k] && !VIEJAS[k] && k.indexOf('bionyssa_nube') !== 0;
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
  var UNICOS = {
    bionyssa_puntos: ['puntos', 'actual', null, ['p', 'dia']],
    bionyssa_retos: ['retos', 'actual', null, ['dias', 'pts']],
    bionyssa_guia: ['guia', 'pasos', 'hechos'],
    bionyssa_impacto_plazo: ['impacto', 'plazo', 'anios'],
    bionyssa_sembradas: ['impacto', 'sembradas', 'total'],
    bionyssa_guardadas: ['comunidad', 'guardadas', 'ids'],
    bionyssa_etiquetas: ['comunidad', 'etiquetas', 'lista'],
    bionyssa_sin_red_record: ['sin_conexion', 'record', 'mejor'],
    bionyssa_notis: ['ajustes', 'avisos', null, ['on', 'pregunto', 'ult']],
    bionyssa_tema_cuenta: ['ajustes', 'tema', 'valor']
  };
  var CAMPOS_PLANTA = ['id', 'nombre', 'siembra', 'riegos', 'freq', 'alturas', 'logros', 'cuidados', 'cuidadosPts', 'etapa', 'creado'];
  var CAMPOS_DIARIO = ['id', 'f', 't', 'img', 'creado'];
  var CAMPOS_JUEGO = ['partidas', 'victorias', 'mejor', 'racha'];
  function codec(k) {
    var m = /^bionyssa_diario_([a-z0-9_]{1,40})$/.exec(k), u = UNICOS[k];
    if (k === 'bionyssa_plantas') return { ruta: ['plantas'], grupo: 1, asc: 1 };
    if (m) return { ruta: ['plantas', m[1], 'diario'], grupo: 1 };
    if (k === 'bionyssa_progreso') return { ruta: ['progreso'], grupo: 1, porClave: 1 };
    if (u) return { ruta: [u[0]], doc: u[1], campo: u[2], campos: u[3] };
    if (/^bionyssa_tuto_/.test(k)) return { ruta: ['ajustes'], doc: 'tutorial_' + k.slice(14).replace(/[^a-z0-9_]/gi, '_'), campo: 'visto' };
    return { ruta: ['ajustes'], doc: 'otro_' + k.slice(9).replace(/[^a-z0-9_]/gi, '_'), campo: 'valor' };
  }
  function idValido(id) { return typeof id === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(id); }
  function permitir(o, lista) {
    var r = {};
    lista.forEach(function (c) { if (o[c] !== undefined) r[c] = o[c]; });
    return r;
  }
  function conT(f, t) { var c = Object.assign({}, f); c.actualizado = t; return c; }
  function limpio(f) { var c = Object.assign({}, f); delete c.actualizado; return c; }
  function huella(f) { return orden(limpio(f)); }
  function huellas(docs) {
    var o = {};
    Object.keys(docs).forEach(function (id) { o[id] = huella(docs[id]); });
    return o;
  }
  function ordenValido(k, o) {
    var cod = codec(k);
    if (!cod.grupo) return true;
    return cod.porClave ? !!(o && typeof o === 'object' && !Array.isArray(o)) : Array.isArray(o);
  }
  function partir(k, raw, t) {
    var cod = codec(k), o = parse(raw), docs = {}, f;
    if (cod.grupo) {
      if (cod.porClave) {
        if (ordenValido(k, o)) Object.keys(o).forEach(function (id) {
          f = o[id];
          if (!idValido(id) || !f || typeof f !== 'object') return;
          f = permitir(f, CAMPOS_JUEGO);
          if (valido(f)) docs[id] = conT(f, t);
        });
      } else if (ordenValido(k, o)) {
        o.forEach(function (e) {
          if (!e || typeof e !== 'object' || !idValido(e.id)) return;
          f = permitir(e, cod.asc ? CAMPOS_PLANTA : CAMPOS_DIARIO);
          if (valido(f)) docs[e.id] = conT(f, t);
        });
      }
      return docs;
    }
    f = {};
    if (o !== undefined && valido(o)) {
      if (cod.campo) { f[cod.campo] = o; f.j = 1; }
      else if (o && typeof o === 'object' && !Array.isArray(o)) f = permitir(o, cod.campos);
      else { f.valor = o; f.j = 1; }
    } else { f.valor = String(raw); f.j = 0; }
    docs[cod.doc] = conT(f, t);
    return docs;
  }
  function unir(k, docs) {
    var cod = codec(k), ids = Object.keys(docs), out;
    if (cod.grupo) {
      if (cod.porClave) {
        out = {};
        ids.forEach(function (id) { out[id] = limpio(docs[id]); });
      } else {
        out = ids.map(function (id) { var e = limpio(docs[id]); e.id = id; return e; });
        out.sort(function (a, b) {
          var d = (a.creado || 0) - (b.creado || 0);
          if (d === 0) d = a.id < b.id ? -1 : 1;
          return cod.asc ? d : -d;
        });
      }
      return JSON.stringify(out);
    }
    var d = docs[cod.doc];
    if (!d) return null;
    d = limpio(d);
    if (d.j === 0) return d.valor === undefined || d.valor === null ? null : String(d.valor);
    if (cod.campo) return JSON.stringify(d[cod.campo] === undefined ? null : d[cod.campo]);
    if (d.j === 1 && 'valor' in d) return JSON.stringify(d.valor);
    delete d.j;
    return JSON.stringify(d);
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
  function refColeccion(n, uid, ruta) { return n.ff.collection.apply(null, [n.db, 'usuarios', uid].concat(ruta)); }
  function refDoc(n, uid, ruta, id) { return n.ff.doc.apply(null, [n.db, 'usuarios', uid].concat(ruta, [id])); }
  async function bajarDocs(n, uid, k) {
    var cod = codec(k), o = {};
    if (cod.grupo) {
      (await n.ff.getDocs(refColeccion(n, uid, cod.ruta))).docs.forEach(function (d) { o[d.id] = d.data(); });
    } else {
      var d = await n.ff.getDoc(refDoc(n, uid, cod.ruta, cod.doc));
      if (d.exists()) o[cod.doc] = d.data();
    }
    return o;
  }
  async function traerRaw(n, uid, k, info) {
    if (info.virtual !== undefined) return info.virtual;
    if (info.borrado) { ultimaNube[k] = { docs: {}, raw: null, t: info.t || 0 }; return null; }
    var docs = await bajarDocs(n, uid, k), raw = unir(k, docs);
    ultimaNube[k] = { docs: huellas(docs), raw: raw, t: info.t || 0 };
    return raw;
  }
  async function leerLegado(n, uid) {
    var snap = await n.ff.getDoc(n.ff.doc(n.db, 'usuarios', uid));
    var nube = snap.exists() ? snap.data().datos : null;
    var out = { existe: snap.exists(), tieneDatos: !!nube, items: {} };
    if (!nube) return out;
    Object.keys(nube).forEach(function (c) {
      var e = nube[c];
      if (!e || e.b) return;
      var raw = e.j ? JSON.stringify(e.v) : (e.v === null || e.v === undefined ? null : String(e.v));
      if (raw !== null) out.items[c] = { raw: raw, t: e.t || 0 };
    });
    var vieja = out.items.bionyssa_planta, diario = out.items.bionyssa_planta_diario;
    if (vieja && window.BioPlantas) {
      var c = BioPlantas.convertir(parse(vieja.raw), diario ? parse(diario.raw) : []);
      if (c) {
        out.items.bionyssa_plantas = { raw: JSON.stringify([c.planta]), t: vieja.t };
        out.items['bionyssa_diario_' + c.planta.id] = { raw: JSON.stringify(c.diario), t: (diario || vieja).t };
      }
    }
    delete out.items.bionyssa_planta;
    delete out.items.bionyssa_planta_diario;
    return out;
  }
  // compara navegador vs nube y se queda con lo más nuevo
  async function decidir(n, uid, k, loc, info, tL, ahora) {
    var fus = fusionDe(k), tN = info ? (info.t || 0) : 0, nubeRaw = null, d;
    if (fus) {
      if (info) nubeRaw = await traerRaw(n, uid, k, info);
      if (loc === null && nubeRaw === null) return null;
      var res = fus(loc, nubeRaw), igual = canon(res) === canon(nubeRaw);
      d = { res: res, t: igual ? tN : ahora, subir: !igual };
    } else if (!info) {
      if (loc === null) return null;
      d = { res: loc, t: tL || ahora, subir: true };
    } else if (tL > tN) {
      d = { res: loc, t: tL, subir: true };
    } else if (tL === tN && tN > 0) {
      d = { res: loc, t: tL, subir: false };
    } else {
      d = { res: await traerRaw(n, uid, k, info), t: tN, subir: false };
    }
    if (info && info.virtual !== undefined) d.subir = true;
    return d;
  }
  async function reconciliar(n, user, s) {
    var ff = n.ff, uid = user.uid, ahora = Date.now(), cambio = false, fallos = 0, i;
    if (window.BioPlantas) BioPlantas.migrar();
    var meta = leerMeta(s.id), fin = '@' + s.id, claves = {}, metasN = {}, legado = null;
    (await ff.getDocs(ff.collection(n.db, 'usuarios', uid, 'sync'))).docs.forEach(function (d) {
      metasN['bionyssa_' + d.id] = d.data();
    });
    if (!Object.keys(metasN).length) {
      legado = await leerLegado(n, uid);
      Object.keys(legado.items).forEach(function (c) {
        if (sincronizable(c)) metasN[c] = { t: legado.items[c].t, virtual: legado.items[c].raw };
      });
    }
    for (i = 0; i < ls.length; i++) {
      var k0 = ls.key(i);
      if (k0 && k0.indexOf('bionyssa_') === 0 && k0.slice(-fin.length) === fin) {
        var c0 = k0.slice(0, -fin.length);
        if (sincronizable(c0)) claves[c0] = 1;
      }
    }
    Object.keys(metasN).forEach(function (c) { if (sincronizable(c)) claves[c] = 1; });
    var lista = Object.keys(claves), subir = [];
    for (i = 0; i < lista.length; i++) {
      var k = lista[i], loc = ls.getItem(k);
      var d = await decidir(n, uid, k, loc, metasN[k] || null, meta[k] || 0, ahora);
      if (!d) continue;
      if (canon(d.res) !== canon(loc)) { ponerLocal(s.id, k, d.res); cambio = true; }
      meta[k] = d.t;
      if (d.subir) subir.push(k);
    }
    guardarMeta(s.id, meta);
    if (legado && !legado.existe) {
      await ff.setDoc(ff.doc(n.db, 'usuarios', uid), {
        uid: uid, nombre: s.nombre || '', correo: String(s.correo || '').toLowerCase(), creado: ahora, actualizado: ahora
      });
    }
    for (i = 0; i < subir.length; i++) {
      if (metasN[subir[i]] && metasN[subir[i]].virtual !== undefined && ls.getItem(subir[i]) === null) { fallos++; continue; }
      try { await subirClave(n, s, uid, subir[i], meta[subir[i]] || ahora); }
      catch (e) { fallos++; if (transitorio(e)) sucios[subir[i]] = 1; }
    }
    if (fallos && Object.keys(sucios).length) programar();
    if (legado && legado.tieneDatos && !fallos) {
      try { await ff.updateDoc(ff.doc(n.db, 'usuarios', uid), { datos: ff.deleteField() }); } catch (e) {}
    }
    return cambio;
  }
  function transitorio(e) {
    var c = e && e.code ? String(e.code) : '';
    return c === 'unavailable' || c === 'deadline-exceeded' || c === 'resource-exhausted' || c === 'aborted' || c === 'internal' || c === 'cancelled' || c === 'unknown';
  }
  async function aplicar(n, ops) {
    var ff = n.ff;
    for (var i = 0; i < ops.length; i += 400) {
      var tanda = ff.writeBatch(n.db);
      ops.slice(i, i + 400).forEach(function (o) {
        if (o.del) tanda.delete(o.ref);
        else if (o.merge) tanda.set(o.ref, o.data, { merge: true });
        else tanda.set(o.ref, o.data);
      });
      await tanda.commit();
    }
  }
  // sube solo lo que cambió, para no gastar escrituras
  async function subirClave(n, s, uid, k, t) {
    var ff = n.ff, cod = codec(k), raw = ls.getItem(k), fus = fusionDe(k), prev = ultimaNube[k];
    if (fus && raw !== null && prev && prev.raw !== null && prev.raw !== undefined) {
      var f = fus(raw, prev.raw);
      if (canon(f) !== canon(raw)) { ponerLocal(s.id, k, f); raw = f; }
    }
    if (raw !== null && !ordenValido(k, parse(raw))) return;
    var quiere = raw === null ? {} : partir(k, raw, t), ops = [];
    if (cod.grupo && !prev) prev = { docs: huellas(await bajarDocs(n, uid, k)) };
    Object.keys(quiere).forEach(function (id) {
      if (cod.grupo && prev.docs[id] === huella(quiere[id])) return;
      ops.push({ ref: refDoc(n, uid, cod.ruta, id), data: quiere[id] });
    });
    if (cod.grupo) {
      Object.keys(prev.docs).forEach(function (id) { if (!quiere[id]) ops.push({ ref: refDoc(n, uid, cod.ruta, id), del: 1 }); });
    } else if (raw === null) {
      ops.push({ ref: refDoc(n, uid, cod.ruta, cod.doc), del: 1 });
    }
    ops.push({ ref: refDoc(n, uid, ['sync'], k.slice(9)), data: { t: t, borrado: raw === null } });
    ops.push({
      ref: ff.doc(n.db, 'usuarios', uid), merge: 1,
      data: { uid: uid, nombre: s.nombre || '', correo: String(s.correo || '').toLowerCase(), actualizado: Date.now() }
    });
    await aplicar(n, ops);
    ultimaNube[k] = { docs: huellas(quiere), raw: raw, t: t };
  }
  var intentos = 0;
  async function subirSucios() {
    var claves = Object.keys(sucios);
    if (!claves.length || !estado.activo) return;
    var s = ses();
    if (!s || s.id !== estado.idCuenta) return;
    sucios = {};
    var reintentar = false;
    try {
      var n = await nucleo(), meta = leerMeta(s.id), ahora = Date.now();
      for (var i = 0; i < claves.length; i++) {
        try { await subirClave(n, s, estado.uid, claves[i], meta[claves[i]] || ahora); }
        catch (e) {
          if (transitorio(e)) { sucios[claves[i]] = 1; reintentar = true; }
          else if (window.console) console.warn('BioNube: no se pudo guardar', claves[i], e && e.code);
        }
      }
      if (!reintentar) intentos = 0;
    } catch (e) {
      claves.forEach(function (c) { sucios[c] = 1; });
      reintentar = true;
    }
    if (reintentar && ++intentos <= 6) setTimeout(programar, 6000);
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
  var REVISION_MS = 5 * 60 * 1000;
  function activar(opciones) {
    opciones = opciones || {};
    if (!configurado()) return Promise.resolve(null);
    var s = ses();
    if (!s) { desactivar(); return Promise.resolve(null); }
    return (async function () {
      var a = await BioFirebase.auth();
      await a.auth.authStateReady();
      var user = a.auth.currentUser;
      if (!user || !coincide(user, s)) { desactivar(); if (!opciones.sinAviso) avisarSinNube(); return null; }
      if (estado.activo && estado.uid === user.uid && estado.idCuenta === s.id) return estado.uid;
      var llave = user.uid + '|' + s.id;
      if (activando && activando.llave === llave) return activando.p;
      var p = (async function () {
        var claveAntes = s.usuario, s2 = s, cambio = false, marca = 'bio_nube_ok@' + s.id, antes = 0;
        try {
          try { antes = +sessionStorage.getItem(marca) || 0; } catch (e) {}
          if (Date.now() - antes > REVISION_MS) {
            var n = await nucleo();
            await asegurarPerfil(n, user, s);
            s2 = ses() || s;
            cambio = await reconciliar(n, user, s2);
            await migrarLegacy(n, user, s2, claveAntes);
            registrarAcceso(n, user, s2);
            try { sessionStorage.setItem(marca, String(Date.now())); } catch (e) {}
          }
          estado.uid = user.uid; estado.idCuenta = s2.id; estado.activo = true;
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
    try { var sa = ses(); if (sa) sessionStorage.removeItem('bio_nube_ok@' + sa.id); } catch (e) {}
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
