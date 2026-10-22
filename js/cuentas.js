window.BioCuentas = (function () {
  const LLAVE = 'bionyssa_cuentas';
  const limpio = (c) => String(c || '').trim().toLowerCase();
  const pausa = (ms, valor) => new Promise((ok) => setTimeout(() => ok(valor), ms));
  function todas() {
    try { return JSON.parse(localStorage.getItem(LLAVE)) || {}; } catch (e) { return {}; }
  }
  function guardar(cuentas) {
    localStorage.setItem(LLAVE, JSON.stringify(cuentas));
  }
  function porCorreo(correo) {
    const c = limpio(correo);
    return Object.values(todas()).find((x) => x.correo === c) || null;
  }
  function usuarioLibre(nombre, idPropio) {
    const usados = new Set(Object.values(todas()).filter((x) => x.id !== idPropio).map((x) => x.usuario));
    const base = BioComun.usuarioDesdeNombre(nombre);
    let u = base, n = 1;
    while (usados.has(u)) u = base + ++n;
    return u;
  }
  function crear(llave, id, nombre, correo, proveedor) {
    const cuentas = todas();
    const cuenta = { id, nombre, correo, usuario: usuarioLibre(nombre, id), proveedor, creado: Date.now() };
    cuentas[llave] = cuenta;
    guardar(cuentas);
    return cuenta;
  }
  function abrirSesion(cuenta, extra) {
    BioSesion.iniciar(cuenta.nombre, cuenta.correo, Object.assign({ id: cuenta.id, usuario: cuenta.usuario }, extra));
  }
  async function conectarNube() {
    if (!(window.BioNube && BioNube.configurado())) return;
    await Promise.race([BioNube.activar({ sinRecargar: true, sinAviso: true }), pausa(1200)]);
  }
  function pasarInvitado(id) {
    if (window.BioAlmacen && BioAlmacen.pasarInvitado) BioAlmacen.pasarInvitado(id);
  }
  async function registrar({ nombre, correo, clave }) {
    const c = limpio(correo);
    const yaExiste = { ok: false, existe: true, motivo: 'Ese correo ya tiene cuenta. Inicia sesión.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return { ok: false, motivo: 'Escribe un correo válido.' };
    if (porCorreo(c)) return yaExiste;
    const nube = await BioFirebase.sincronizar(c, clave, nombre);
    if (nube.codigo === 'existe') return yaExiste;
    if (!nube.ok) return { ok: false, motivo: 'No pudimos crear la cuenta. Revisa tu internet e inténtalo otra vez.' };
    const cuenta = crear(c, 'c_' + c, nombre, c, 'correo');
    abrirSesion(cuenta);
    pasarInvitado(cuenta.id);
    await conectarNube();
    return { ok: true, cuenta };
  }
  async function entrar(correo, clave) {
    const c = limpio(correo);
    let cuenta = porCorreo(c);
    if (cuenta && cuenta.proveedor === 'google') {
      return { ok: false, motivo: 'Esa cuenta entra con Google. Usa el botón de Google.' };
    }
    const nube = await BioFirebase.entrar(c, clave);
    if (!nube) {
      return cuenta
        ? { ok: false, motivo: 'La contraseña no es correcta.' }
        : { ok: false, motivo: 'No encontramos una cuenta con ese correo. Regístrate primero con tu correo o con Google.' };
    }
    cuenta = cuenta || crear(c, 'c_' + c, nube.nombre || c.split('@')[0], c, 'correo');
    abrirSesion(cuenta);
    await conectarNube();
    return { ok: true, cuenta };
  }
  function existeGoogle(d) {
    const correo = limpio(d.correo);
    return !!((correo && porCorreo(correo)) || todas()['g:' + d.uid]);
  }
  async function fotoABase64(url) {
    try {
      const r = await fetch(url, { mode: 'cors' });
      return await BioImg.cuadrada(await r.blob(), 256, 0.85);
    } catch (e) { return ''; }
  }
  async function conGoogle(d) {
    const correo = limpio(d.correo);
    let cuenta = (correo && porCorreo(correo)) || todas()['g:' + d.uid] || null;
    const nueva = !cuenta;
    if (nueva) {
      let nombre = (d.nombre || '').trim() || correo.split('@')[0] || 'Usuario';
      if (window.BioModera && !BioModera.revisarTexto(nombre, 'nombre').ok) nombre = 'Usuario';
      cuenta = crear('g:' + d.uid, 'g_' + d.uid, nombre, correo, 'google');
      const foto = d.foto ? await Promise.race([fotoABase64(d.foto), pausa(800, '')]) : '';
      if (foto) {
        let perfiles = {};
        try { perfiles = JSON.parse(localStorage.getItem('bionyssa_perfiles')) || {}; } catch (e) {}
        perfiles[cuenta.usuario] = Object.assign({}, perfiles[cuenta.usuario], { foto });
        localStorage.setItem('bionyssa_perfiles', JSON.stringify(perfiles));
      }
    }
    abrirSesion(cuenta, { proveedor: 'google' });
    if (nueva) pasarInvitado(cuenta.id);
    await conectarNube();
    return cuenta;
  }
  return { registrar, entrar, conGoogle, existeGoogle };
})();
