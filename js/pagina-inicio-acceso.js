(function () {
  var enlace = document.getElementById('entrarInvitado');
  if (!enlace) return;
  enlace.addEventListener('click', function () {
    BioSesion.entrarInvitado();
  });
})();
