(() => {
  const $ = (id) => document.getElementById(id);
  const VISTAS = ['vPedir', 'vEnviado', 'vNueva', 'vListo', 'vInvalido'];
  const ver = (id) => VISTAS.forEach((v) => { $(v).hidden = v !== id; });
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
  const motivo = (e) => ERRORES[e && e.code] || 'No se pudo completar. Inténtalo de nuevo en un momento.';
  let correoEnviado = '';
  function enfriar() {
    const b = $('reenviar');
    let n = 60;
    b.disabled = true;
    const t = setInterval(() => {
      n--;
      b.textContent = n > 0 ? 'Reenviar enlace (' + n + ')' : 'Reenviar enlace';
      if (n <= 0) { clearInterval(t); b.disabled = false; }
    }, 1000);
  }
  async function enviar(correo, errorEl, boton) {
    boton.disabled = true;
    try {
      await BioFirebase.enviarReset(correo);
      correoEnviado = correo;
      $('textoEnviado').textContent = 'Si ' + correo + ' tiene una cuenta, ya le mandamos el enlace para crear una contraseña nueva.';
      ver('vEnviado');
      enfriar();
    } catch (e) {
      errorEl.textContent = motivo(e);
      boton.disabled = false;
    }
  }
  const campo = $('correo');
  if (params.get('c')) campo.value = params.get('c');
  campo.removeAttribute('readonly');
  $('formPedir').addEventListener('submit', (e) => {
    e.preventDefault();
    const correo = campo.value.trim().toLowerCase();
    const error = $('errorPedir');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { error.textContent = 'Escribe un correo válido.'; return; }
    error.textContent = '';
    enviar(correo, error, e.target.querySelector('[type="submit"]'));
  });
  $('reenviar').addEventListener('click', (e) => {
    enviar(correoEnviado, $('textoEnviado'), e.currentTarget).then(() => { if (!$('vEnviado').hidden) enfriar(); });
  });
  const codigo = params.get('oobCode');
  if (codigo && params.get('mode') === 'resetPassword') {
    ver('vInvalido');
    BioFirebase.verificarCodigo(codigo).then((correo) => {
      $('paraCorreo').textContent = 'Para la cuenta ' + correo + '.';
      ver('vNueva');
    }).catch(() => {});
    $('formNueva').addEventListener('submit', async (e) => {
      e.preventDefault();
      const c1 = $('clave').value, c2 = $('clave2').value, error = $('errorNueva');
      const boton = e.target.querySelector('[type="submit"]');
      if (c1.length < 8) { error.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
      if (c1 !== c2) { error.textContent = 'Las contraseñas no coinciden.'; return; }
      boton.disabled = true;
      error.textContent = '';
      try {
        await BioFirebase.confirmarReset(codigo, c1);
        ver('vListo');
      } catch (x) {
        boton.disabled = false;
        if (/action-code/.test((x && x.code) || '')) ver('vInvalido');
        else error.textContent = motivo(x);
      }
    });
  }
})();
