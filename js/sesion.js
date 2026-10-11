const BioSesion = window.BioSesion = (function () {
  const CLAVE = 'bionyssa_sesion';

  function obtener() {
    try {
      const datos = localStorage.getItem(CLAVE);
      return datos ? JSON.parse(datos) : null;
    } catch (e) {
      return null;
    }
  }

  function iniciar(nombre, correo, extra) {
    extra = extra || {};
    const usuario = extra.usuario || (window.BioComun ? BioComun.usuarioDesdeNombre(nombre) : '@usuario');
    const sesion = {
      id: extra.id || ('c_' + String(correo).toLowerCase()),
      nombre: nombre, correo: correo, usuario: usuario,
      proveedor: extra.proveedor || 'correo'
    };
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
    return sesion;
  }

  function cerrar() {
    localStorage.removeItem(CLAVE);
  }

  function entrarInvitado() {
    if (window.BioNube) BioNube.salir();
    localStorage.removeItem(CLAVE);
    if (window.BioAlmacen) BioAlmacen.limpiar('invitado');
  }

  function iniciales(nombre) {
    if (!nombre) return 'B';
    const partes = nombre.trim().split(/\s+/);
    const letras = partes.slice(0, 2).map((p) => p[0].toUpperCase());
    return letras.join('') || 'B';
  }

  function pintarSaludo(elementoId) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    const sesion = obtener();
    if (sesion && sesion.nombre) {
      const primerNombre = sesion.nombre.trim().split(/\s+/)[0];
      el.textContent = '¡Hola, ' + primerNombre + '!';
    }
  }

  return { obtener, iniciar, cerrar, entrarInvitado, iniciales, pintarSaludo };
})();
