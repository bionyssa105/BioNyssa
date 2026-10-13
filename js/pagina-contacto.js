(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('formContacto'), nom = $('cNombre'), cor = $('cCorreo'), msg = $('cMensaje');
  const cuenta = $('cCuenta'), estado = $('cEstado'), boton = $('cEnviar');
  const CLAVE = '1541c48b-6908-4a8f-99ee-f124e7e59fa7';
  const ESPERA = 60000, TOPE = 12000;
  const conTope = (p) => Promise.race([p, new Promise((_, no) => setTimeout(no, TOPE))]).then(() => true, () => false);
  const aviso = (t, tipo) => { estado.textContent = t; estado.className = 'c-estado' + (tipo ? ' ' + tipo : ''); };
  const marcar = (el, mal) => el.classList.toggle('malo', !!mal);
  const ultimo = () => { try { return +localStorage.getItem('bio_contacto_t') || 0; } catch (e) { return 0; } };
  msg.addEventListener('input', () => {
    cuenta.textContent = msg.value.length + ' / 500';
    cuenta.classList.toggle('casi', msg.value.length >= 450);
    marcar(msg, false);
  });
  nom.addEventListener('input', () => marcar(nom, false));
  cor.addEventListener('input', () => marcar(cor, false));
  async function guardar(nombre, correo, mensaje) {
    const nu = await BioFirebase.nucleo();
    await nu.ff.addDoc(nu.ff.collection(nu.db, 'mensajes'), { nombre, correo, mensaje, creado: Date.now() });
  }
  async function correo(nombre, correo, mensaje) {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: CLAVE, subject: 'Mensaje nuevo desde BioNyssa', name: nombre, email: correo, message: mensaje })
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.message);
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ($('cWeb').value) return;
    const n = nom.value.trim(), c = cor.value.trim(), m = msg.value.trim();
    const okN = n.length >= 2;
    const okC = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
    const okM = m.length >= 10;
    marcar(nom, !okN);
    marcar(cor, !okC);
    marcar(msg, !okM);
    if (!okN || !okC || !okM) {
      return aviso(!okN ? 'Pon tu nombre.' : !okC ? 'Ese correo no se ve bien.' : 'Cuéntanos un poco más, mínimo 10 letras.', 'mal');
    }
    const resta = ESPERA - (Date.now() - ultimo());
    if (resta > 0) return aviso('Espera ' + Math.ceil(resta / 1000) + ' segundos para mandar otro.', 'mal');
    boton.disabled = true;
    aviso('Enviando...');
    const hayNube = !!(window.BioFirebase && BioFirebase.configurado());
    const [guardado, enviado] = await Promise.all([
      hayNube ? conTope(guardar(n, c, m)) : false,
      CLAVE ? conTope(correo(n, c, m)) : false
    ]);
    if (!guardado && !enviado) {
      aviso('No se pudo enviar. Revisa tu internet e inténtalo otra vez.', 'mal');
    } else {
      try { localStorage.setItem('bio_contacto_t', String(Date.now())); } catch (x) {}
      form.reset();
      cuenta.textContent = '0 / 500';
      aviso('Listo, recibimos tu mensaje. Te respondemos al correo que pusiste.', 'ok');
    }
    boton.disabled = false;
  });
})();
