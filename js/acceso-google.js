(function () {
  const botones = [...document.querySelectorAll('[data-google]')];
  const modo = botones[0] && botones[0].dataset.google === 'login' ? 'login' : 'registro';
  const ignorar = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
  const usarRedireccion = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'];
  const mensajes = {
    'auth/unauthorized-domain': 'Este dominio no está autorizado. En Firebase ve a Authentication > Settings > Authorized domains y agrega ' + location.hostname + '.',
    'auth/operation-not-allowed': 'Falta activar Google. En Firebase ve a Authentication > Sign-in method y habilita Google.',
    'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    'auth/invalid-api-key': 'La apiKey de js/firebase-config.js no es válida.',
    'auth/web-storage-unsupported': 'Tu navegador está bloqueando el almacenamiento. Actívalo o abre la página en Chrome o Safari.'
  };
  let fb = null;

  function bloquear(si) {
    botones.forEach((b) => {
      b.disabled = si;
      const texto = b.lastChild;
      if (!texto || texto.nodeType !== 3) return;
      if (si) { b._texto = b._texto || texto.nodeValue; texto.nodeValue = ' Entrando…'; }
      else if (b._texto) { texto.nodeValue = b._texto; b._texto = null; }
    });
  }

  function fallo(e) {
    bloquear(false);
    if (e && ignorar.includes(e.code)) return;
    BioComun.dialogo({
      titulo: 'No se pudo entrar con Google',
      mensaje: mensajes[e && e.code] || 'Inténtalo de nuevo en un momento.',
      tipo: 'error'
    });
  }

  async function descartar(usuario) {
    try { await usuario.delete(); }
    catch (e) { try { await fb.fa.signOut(fb.auth); } catch (x) {} }
  }

  async function terminar(r) {
    const usuario = r.user;
    let info = null;
    try { info = fb.fa.getAdditionalUserInfo(r); } catch (e) {}
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
      if (ir) location.href = 'registro.html';
      return;
    }
    await BioCuentas.conGoogle(datos);
    location.href = 'menu.html';
  }

  function porRedireccion(m) {
    bloquear(true);
    return m.fa.signInWithRedirect(m.auth, new m.fa.GoogleAuthProvider()).catch(fallo);
  }

  async function entrar() {
    if (!BioFirebase.configurado()) {
      BioComun.dialogo({
        titulo: 'Falta conectar Google',
        mensaje: 'Abre js/firebase-config.js y pega tu apiKey y tu appId de Firebase. Después activa Google en Authentication.',
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
    } catch (e) {
      if (fb && e && usarRedireccion.includes(e.code)) return porRedireccion(fb);
      fallo(e);
    }
  }

  botones.forEach((b) => b.addEventListener('click', entrar));
  if (!BioFirebase.configurado()) return;

  BioFirebase.auth()
    .then((m) => { fb = m; return m.fa.getRedirectResult(m.auth); })
    .then((r) => { if (r && r.user) { bloquear(true); return terminar(r); } })
    .catch((e) => { if (e && e.code) fallo(e); });
  setTimeout(() => BioFirebase.nucleo().catch(() => {}), 1500);
})();
