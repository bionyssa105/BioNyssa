(() => {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => {
      navigator.serviceWorker.register('/js/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registro) => registro.update())
        .catch(() => {});
    });
  }
  if (/offline\.html$/.test(location.pathname)) return;

  let preguntando = false;

  async function sinRedReal() {
    try {
      await fetch('/manifest.webmanifest?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(4000) });
      return false;
    } catch (e) { return true; }
  }

  async function preguntar() {
    if (!window.BioComun || !BioComun.dialogo) { preguntando = false; return; }
    const jugar = await BioComun.dialogo({
      titulo: 'Sin conexión',
      mensaje: 'Se fue el internet. Mientras vuelve, hay un juego secreto que solo aparece cuando no hay red. ¿Lo probamos?',
      boton: '¡Jugar!',
      cancelar: 'Seguir aquí'
    });
    preguntando = false;
    if (!jugar) return;
    try { sessionStorage.setItem('bio_volver', location.href); } catch (e) {}
    location.href = '/paginas/offline.html';
  }

  addEventListener('offline', () => {
    setTimeout(async () => {
      if (preguntando || !(await sinRedReal()) || preguntando) return;
      preguntando = true;
      preguntar();
    }, 3000);
  });
})();
