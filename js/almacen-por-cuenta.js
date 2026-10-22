(function () {
  var COMUN = {
    bionyssa_tema: 1, bionyssa_sesion: 1, bionyssa_cuentas: 1,
    bionyssa_publicaciones: 1, bionyssa_perfiles: 1
  };
  var ls = window.localStorage;
  var proto = Storage.prototype;
  var leer = proto.getItem, escribir = proto.setItem, quitar = proto.removeItem;
  function sesion() {
    try {
      var s = JSON.parse(leer.call(ls, 'bionyssa_sesion'));
      return s && s.id ? s : null;
    } catch (e) { return null; }
  }
  function clave(k, almacen) {
    if (almacen !== ls || typeof k !== 'string' || k.indexOf('bionyssa_') !== 0 || COMUN[k]) return k;
    var s = sesion();
    return k + '@' + (s ? s.id : 'invitado');
  }
  proto.getItem = function (k) { return leer.call(this, clave(k, this)); };
  proto.setItem = function (k, v) { return escribir.call(this, clave(k, this), v); };
  proto.removeItem = function (k) { return quitar.call(this, clave(k, this)); };
  try {
    var cruda = leer.call(ls, 'bionyssa_sesion');
    if (cruda && !sesion()) quitar.call(ls, 'bionyssa_sesion');
  } catch (e) {}
  window.BioAlmacen = {
    pasarInvitado: function (id) {
      if (!id) return 0;
      var fin = '@invitado', suf = '@' + id, claves = [], pasadas = 0, i;
      for (i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('bionyssa_') === 0 && k.slice(-fin.length) === fin) claves.push(k);
      }
      claves.forEach(function (k) {
        var base = k.slice(0, -fin.length);
        if (COMUN[base]) return;
        try {
          if (leer.call(ls, base + suf) === null) {
            escribir.call(ls, base + suf, leer.call(ls, k));
            pasadas++;
          }
          quitar.call(ls, k);
        } catch (e) {}
      });
      return pasadas;
    },
    limpiar: function (id) {
      var fin = '@' + id, borrar = [];
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('bionyssa_') === 0 && k.slice(-fin.length) === fin) borrar.push(k);
      }
      borrar.forEach(function (k) { quitar.call(ls, k); });
    }
  };

  var ID_VIEJA = 'p_inicial';
  function jsonDe(k) {
    try { return JSON.parse(leer.call(ls, clave(k, ls))); } catch (e) { return null; }
  }
  function conIdsDiario(lista) {
    var n = lista.length;
    return lista.map(function (e, i) {
      var o = Object.assign({}, e);
      if (!o.id) o.id = 'e_l' + (n - i);
      if (!o.creado) o.creado = Date.parse((o.f || '') + 'T12:00') || 0;
      return o;
    });
  }
  window.BioPlantas = {
    ID_VIEJA: ID_VIEJA,
    convertir: function (planta, diario) {
      if (!planta || typeof planta !== 'object') return null;
      var p = Object.assign({}, planta);
      p.id = ID_VIEJA;
      if (!p.creado) p.creado = Date.parse((p.siembra || '') + 'T12:00') || Date.now();
      return { planta: p, diario: conIdsDiario(Array.isArray(diario) ? diario : []) };
    },
    nuevoId: function () { return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    nuevaEntradaId: function () { return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); },
    // pasa la planta de antes (una sola) al formato nuevo de varias
    migrar: function () {
      try {
        var vieja = jsonDe('bionyssa_planta');
        if (!vieja || typeof vieja !== 'object') return;
        var lista = jsonDe('bionyssa_plantas');
        if (!Array.isArray(lista)) lista = [];
        if (!lista.some(function (p) { return p && p.id === ID_VIEJA; })) {
          var c = BioPlantas.convertir(vieja, jsonDe('bionyssa_planta_diario'));
          lista.push(c.planta);
          ls.setItem('bionyssa_plantas', JSON.stringify(lista));
          ls.setItem('bionyssa_diario_' + ID_VIEJA, JSON.stringify(c.diario));
        }
        quitar.call(ls, clave('bionyssa_planta', ls));
        quitar.call(ls, clave('bionyssa_planta_diario', ls));
      } catch (e) {}
    },
    todas: function () {
      BioPlantas.migrar();
      var l = jsonDe('bionyssa_plantas');
      return Array.isArray(l) ? l.filter(function (p) { return p && typeof p === 'object' && p.id; }) : [];
    },
    guardar: function (lista) {
      try { ls.setItem('bionyssa_plantas', JSON.stringify(lista)); return true; } catch (e) { return false; }
    },
    diario: function (id) {
      var l = jsonDe('bionyssa_diario_' + id);
      return Array.isArray(l) ? l : [];
    },
    guardarDiario: function (id, lista) {
      try { ls.setItem('bionyssa_diario_' + id, JSON.stringify(lista)); return true; } catch (e) { return false; }
    },
    quitarDiario: function (id) { try { ls.removeItem('bionyssa_diario_' + id); } catch (e) {} }
  };
  function leerArchivo(f) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = function () { mal(new Error('lectura')); };
      r.readAsDataURL(f);
    });
  }
  function cargarImg(src) {
    return new Promise(function (ok, mal) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = function () { mal(new Error('imagen')); };
      img.src = src;
    });
  }
  async function preparar(origen) {
    if (typeof origen !== 'string') origen = await leerArchivo(origen);
    return cargarImg(origen);
  }
  function jpeg(c, calidad) {
    var d = document.createElement('canvas');
    d.width = c.width; d.height = c.height;
    var y = d.getContext('2d');
    y.fillStyle = '#fff'; y.fillRect(0, 0, d.width, d.height);
    y.drawImage(c, 0, 0);
    return d.toDataURL('image/jpeg', calidad);
  }
  window.BioImg = {
    comprimir: async function (origen, max, calidad) {
      var img = await preparar(origen);
      var esc = Math.min(1, (max || 1024) / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * esc));
      c.height = Math.max(1, Math.round(img.height * esc));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return jpeg(c, calidad || 0.8);
    },
    cuadrada: async function (origen, lado, calidad) {
      var img = await preparar(origen);
      var l = Math.min(img.width, img.height);
      var c = document.createElement('canvas');
      c.width = c.height = lado || 256;
      c.getContext('2d').drawImage(img, (img.width - l) / 2, (img.height - l) / 2, l, l, 0, 0, c.width, c.height);
      return jpeg(c, calidad || 0.85);
    }
  };
})();
