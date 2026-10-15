// google
if (['login', 'registro'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const botones = [...document.querySelectorAll('[data-google]')];
  const modo = botones[0] && botones[0].dataset.google === 'login' ? 'login' : 'registro';
  const ignorar = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
  const usarRedireccion = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'];
  const mensajes = {
    'auth/unauthorized-domain': 'Este dominio no está autorizado. En Firebase ve a Authentication > Settings > Authorized domains y agrega ' + location.hostname + '.',
    'auth/operation-not-allowed': 'Falta activar Google. En Firebase ve a Authentication > Sign-in method y habilita Google.',
    'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/invalid-api-key': 'La apiKey de js/conexion.js no es válida.',
    'auth/web-storage-unsupported': 'Tu navegador está bloqueando el almacenamiento. Actívalo o abre la página en Chrome o Safari.'
  };
  let fb = null;
  function bloquear(si) {
    botones.forEach(function (botone) {
      botone.disabled = si;
      const texto = botone.lastChild;
      if (!texto || texto.nodeType !== 3) return;
      if (si) { botone._texto = botone._texto || texto.nodeValue; texto.nodeValue = ' Entrando…'; }
      else if (botone._texto) { texto.nodeValue = botone._texto; botone._texto = null; }
    });
  }
  function fallo(ev) {
    bloquear(false);
    if (ev && ignorar.includes(ev.code)) return;
    BioComun.dialogo({
      titulo: 'No se pudo entrar con Google',
      mensaje: mensajes[ev && ev.code] || 'Inténtalo de nuevo en un momento.',
      tipo: 'error'
    });
  }
  async function descartar(usuario) {
    try { await usuario.delete(); }
    catch (err) { try { await fb.fa.signOut(fb.auth); } catch (err2) {} }
  }
  async function terminar(resultado) {
    const usuario = resultado.user;
    let info = null;
    try { info = fb.fa.getAdditionalUserInfo(resultado); } catch (err) {}
    const datos = { uid: usuario.uid, nombre: usuario.displayName, correo: usuario.email, foto: usuario.photoURL };
    if (modo === 'login' && info && info.isNewUser && !BioCuentas.existeGoogle(datos)) {
      await descartar(usuario);
      bloquear(false);
      const ir = await BioComun.dialogo({
        titulo: 'Primero crea tu cuenta',
        mensaje: 'Todavía no hay una cuenta' + (datos.correo ? ' con ' + datos.correo : '') + '. Regístrate primero con tu correo o con Google y después podrás iniciar sesión.',
        boton: 'Ir a registrarme',
        cancelar: 'Cerrar',
        tipo: 'info'
      });
      if (ir) location.href = '/paginas/registro.html';
      return;
    }
    await BioCuentas.conGoogle(datos);
    location.href = '/paginas/menu.html';
  }
  function porRedireccion(mensaje) {
    bloquear(true);
    return mensaje.fa.signInWithRedirect(mensaje.auth, new mensaje.fa.GoogleAuthProvider()).catch(fallo);
  }
  async function entrar() {
    if (!BioFirebase.configurado()) {
      BioComun.dialogo({
        titulo: 'Falta conectar Google',
        mensaje: 'Abre js/conexion.js y pega tu apiKey y tu appId de Firebase. Después activa Google en Authentication.',
        tipo: 'error'
      });
      return;
    }
    bloquear(true);
    try {
      fb = fb || await BioFirebase.auth();
      const proveedor = new fb.fa.GoogleAuthProvider();
      proveedor.setCustomParameters({ prompt: 'select_account' });
      await terminar(await fb.fa.signInWithPopup(fb.auth, proveedor));
    } catch (err) {
      if (fb && err && usarRedireccion.includes(err.code)) return porRedireccion(fb);
      fallo(err);
    }
  }
  botones.forEach(function (botone) { return botone.addEventListener('click', entrar); });
  if (!BioFirebase.configurado()) return;
  BioFirebase.auth()
    .then(function (resultado) { fb = resultado; return resultado.fa.getRedirectResult(resultado.auth); })
    .then(function (resultado) { if (resultado && resultado.user) { bloquear(true); return terminar(resultado); } })
    .catch(function (ev) { if (ev && ev.code) fallo(ev); });
  setTimeout(function () { return BioFirebase.nucleo().catch(function () {}); }, 1500);
})();
 } catch (err) { console.error(err); }
}

// ver-clave
if (['login', 'recuperar', 'registro'].indexOf(paginaActual) > -1) {
 try {
const OJO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 12.2c2.6-4.4 5.6-6.6 9.6-6.6 4 0 7.2 2.3 9.7 6.5-2.5 4.1-5.8 6.3-9.7 6.3-4 0-7-2.1-9.6-6.2z"/><path d="M12.1 9.4c1.5 0 2.7 1.2 2.7 2.7 0 1.5-1.2 2.7-2.7 2.7-1.5 0-2.7-1.2-2.7-2.7 0-1.5 1.2-2.7 2.7-2.7z"/></g></svg>';
const OJO_TACHADO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 3.4l17.6 17.3"/><path d="M9.8 5.9c.7-.2 1.4-.3 2.2-.3 4 0 7.2 2.3 9.7 6.5-.8 1.3-1.7 2.4-2.7 3.4M6.5 8c-1.6 1.2-3 2.6-4.1 4.2 2.6 4.1 5.6 6.3 9.6 6.3 1.3 0 2.5-.3 3.6-.7"/></g></svg>';
document.querySelectorAll('.field-toggle').forEach(function (btn) {
  const input = document.getElementById(btn.dataset.target);
  btn.addEventListener('click', function () {
    const oculta = input.type === 'password';
    input.type = oculta ? 'text' : 'password';
    btn.innerHTML = oculta ? OJO_TACHADO : OJO;
    const texto = oculta ? 'Ocultar contraseña' : 'Mostrar contraseña';
    btn.title = texto;
    btn.setAttribute('aria-label', texto);
  });
});
 } catch (err) { console.error(err); }
}

// login
if (['login'].indexOf(paginaActual) > -1) {
 try {
document.getElementById('olvide').addEventListener('click', function (ev) {
  ev.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  location.href = '/paginas/recuperar.html' + (correo ? '?c=' + encodeURIComponent(correo) : '');
});
document.getElementById('formLogin').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  const clave = document.getElementById('clave').value;
  const error = document.getElementById('error');
  const boton = ev.target.querySelector('[type="submit"]');
  if (!correo || !clave) {
    error.textContent = 'Completa tu correo y tu contraseña.';
    return;
  }
  boton.disabled = true;
  const resultado = await BioCuentas.entrar(correo, clave);
  boton.disabled = false;
  if (!resultado.ok) {
    error.textContent = resultado.motivo;
    return;
  }
  location.href = '/paginas/menu.html';
});
 } catch (err) { console.error(err); }
}

// registro
if (['registro'].indexOf(paginaActual) > -1) {
 try {
document.getElementById('formRegistro').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const clave = document.getElementById('clave').value;
  const clave2 = document.getElementById('clave2').value;
  const error = document.getElementById('error');
  const boton = ev.target.querySelector('[type="submit"]');
  const fallo = function (texto) { error.textContent = texto; };
  if (!nombre || !correo || !clave || !clave2) return fallo('Completa todos los campos.');
  const revNombre = BioModera.revisarTexto(nombre, 'nombre');
  if (!revNombre.ok) return fallo(revNombre.motivo);
  if (!BioModera.revisarTexto(correo.split('@')[0], 'nombre').ok) return fallo('Ese correo contiene palabras no permitidas.');
  if (clave !== clave2) return fallo('Las contraseñas no coinciden.');
  if (clave.length < 8) return fallo('La contraseña debe tener al menos 8 caracteres.');
  boton.disabled = true;
  const resultado = await BioCuentas.registrar({ nombre, correo, clave });
  boton.disabled = false;
  if (!resultado.ok) return fallo(resultado.motivo);
  location.href = '/paginas/menu.html';
});
 } catch (err) { console.error(err); }
}

// recuperar
if (['recuperar'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const VISTAS = ['vPedir', 'vEnviado', 'vNueva', 'vListo', 'vInvalido'];
  const ver = function (id) { return VISTAS.forEach(function (item) { elem(item).hidden = item !== id; }); };
  const params = new URLSearchParams(location.search);
  const ERRORES = {
    'auth/invalid-email': 'Escribe un correo válido.',
    'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo otra vez.',
    'auth/weak-password': 'Esa contraseña es muy débil. Usa al menos 8 caracteres.',
    'auth/operation-not-allowed': 'Falta activar «Correo/contraseña» en Firebase (Authentication > Sign-in method).',
    'auth/unauthorized-continue-uri': 'Este dominio no está autorizado en Firebase (Authentication > Settings > Authorized domains).',
    'bio/no-config': 'Falta conectar Firebase en js/firebase-config.js.'
  };
  const motivo = function (ev) { return ERRORES[ev && ev.code] || 'No se pudo completar. Inténtalo de nuevo en un momento.'; };
  let correoEnviado = '';
  function enfriar() {
    const valor = elem('reenviar');
    let numero = 60;
    valor.disabled = true;
    const valor2 = setInterval(function () {
      numero--;
      valor.textContent = numero > 0 ? 'Reenviar enlace (' + numero + ')' : 'Reenviar enlace';
      if (numero <= 0) { clearInterval(valor2); valor.disabled = false; }
    }, 1000);
  }
  async function enviar(correo, errorEl, boton) {
    boton.disabled = true;
    try {
      await BioFirebase.enviarReset(correo);
      correoEnviado = correo;
      elem('textoEnviado').textContent = 'Si ' + correo + ' tiene una cuenta, ya le mandamos el enlace para crear una contraseña nueva.';
      ver('vEnviado');
      enfriar();
    } catch (err) {
      errorEl.textContent = motivo(err);
      boton.disabled = false;
    }
  }
  const campo = elem('correo');
  if (params.get('c')) campo.value = params.get('c');
  campo.removeAttribute('readonly');
  elem('formPedir').addEventListener('submit', function (ev) {
    ev.preventDefault();
    const correo = campo.value.trim().toLowerCase();
    const error = elem('errorPedir');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { error.textContent = 'Escribe un correo válido.'; return; }
    error.textContent = '';
    enviar(correo, error, ev.target.querySelector('[type="submit"]'));
  });
  elem('reenviar').addEventListener('click', function (ev) {
    enviar(correoEnviado, elem('textoEnviado'), ev.currentTarget).then(function () { if (!elem('vEnviado').hidden) enfriar(); });
  });
  const codigo = params.get('oobCode');
  if (codigo && params.get('mode') === 'resetPassword') {
    ver('vInvalido');
    BioFirebase.verificarCodigo(codigo).then(function (correo) {
      elem('paraCorreo').textContent = 'Para la cuenta ' + correo + '.';
      ver('vNueva');
    }).catch(function () {});
    elem('formNueva').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const c1 = elem('clave').value, c2 = elem('clave2').value, error = elem('errorNueva');
      const boton = ev.target.querySelector('[type="submit"]');
      if (c1.length < 8) { error.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
      if (c1 !== c2) { error.textContent = 'Las contraseñas no coinciden.'; return; }
      boton.disabled = true;
      error.textContent = '';
      try {
        await BioFirebase.confirmarReset(codigo, c1);
        ver('vListo');
      } catch (err) {
        boton.disabled = false;
        if (/action-code/.test((err && err.code) || '')) ver('vInvalido');
        else error.textContent = motivo(err);
      }
    });
  }
})();
 } catch (err) { console.error(err); }
}
