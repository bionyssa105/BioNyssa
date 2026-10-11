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
