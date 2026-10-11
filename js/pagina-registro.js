document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const clave = document.getElementById('clave').value;
  const clave2 = document.getElementById('clave2').value;
  const error = document.getElementById('error');
  const boton = e.target.querySelector('[type="submit"]');
  const fallo = (texto) => { error.textContent = texto; };

  if (!nombre || !correo || !clave || !clave2) return fallo('Completa todos los campos.');
  const revNombre = BioModera.revisarTexto(nombre, 'nombre');
  if (!revNombre.ok) return fallo(revNombre.motivo);
  if (!BioModera.revisarTexto(correo.split('@')[0], 'nombre').ok) return fallo('Ese correo contiene palabras no permitidas.');
  if (clave !== clave2) return fallo('Las contraseñas no coinciden.');
  if (clave.length < 6) return fallo('La contraseña debe tener al menos 6 caracteres.');

  boton.disabled = true;
  const r = await BioCuentas.registrar({ nombre, correo, clave });
  boton.disabled = false;
  if (!r.ok) return fallo(r.motivo);
  location.href = '/paginas/menu.html';
});
