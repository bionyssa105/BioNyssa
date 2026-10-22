document.getElementById('olvide').addEventListener('click', (e) => {
  e.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  location.href = '/paginas/recuperar.html' + (correo ? '?c=' + encodeURIComponent(correo) : '');
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
  let r;
  try {
    r = await BioCuentas.entrar(correo, clave);
  } catch (err) {
    r = { ok: false, motivo: 'Algo falló al iniciar sesión. Inténtalo otra vez.' };
  } finally {
    boton.disabled = false;
  }
  if (!r.ok) {
    error.textContent = r.motivo;
    return;
  }
  location.href = '/paginas/menu.html';
});
