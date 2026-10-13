(() => {
  const $ = (id) => document.getElementById(id);
  const cerrarSesion = $('cerrarSesion');
  if (BioSesion.obtener()) {
    BioSesion.pintarSaludo('saludo');
    cerrarSesion.style.display = '';
  } else {
    $('saludo').textContent = '¡Bienvenido, invitado!';
    $('registrarseTopbar').style.display = '';
    $('bannerInvitado').style.display = 'flex';
  }
  cerrarSesion.addEventListener('click', async (e) => {
    e.preventDefault();
    if (window.BioNube) { try { await BioNube.salir(); } catch (x) {} }
    BioSesion.cerrar();
    location.href = '/index.html';
  });
  $('botonBannerInvitado').addEventListener('click', () => { location.href = '/paginas/registro.html'; });
})();
