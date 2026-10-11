document.getElementById('olvide').addEventListener('click', (e) => {
  e.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  location.href = 'recuperar.html' + (correo ? '?c=' + encodeURIComponent(correo) : '');
});

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  const clave = document.getElementById('clave').value;
  const error = document.getElementById('error');
  const boton = e.target.querySelector('[type="submit"]');

  if (!correo || !clave) {
    error.textContent = 'Completa tu correo y tu contraseña.';
    return;
  }
  boton.disabled = true;
  const r = await BioCuentas.entrar(correo, clave);
  boton.disabled = false;
  if (!r.ok) {
    error.textContent = r.motivo;
    return;
  }
  location.href = 'menu.html';
});
