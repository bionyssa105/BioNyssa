const OJO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.4 12.2c2.6-4.4 5.6-6.6 9.6-6.6 4 0 7.2 2.3 9.7 6.5-2.5 4.1-5.8 6.3-9.7 6.3-4 0-7-2.1-9.6-6.2z"/><path d="M12.1 9.4c1.5 0 2.7 1.2 2.7 2.7 0 1.5-1.2 2.7-2.7 2.7-1.5 0-2.7-1.2-2.7-2.7 0-1.5 1.2-2.7 2.7-2.7z"/></g></svg>';
const OJO_TACHADO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 3.4l17.6 17.3"/><path d="M9.8 5.9c.7-.2 1.4-.3 2.2-.3 4 0 7.2 2.3 9.7 6.5-.8 1.3-1.7 2.4-2.7 3.4M6.5 8c-1.6 1.2-3 2.6-4.1 4.2 2.6 4.1 5.6 6.3 9.6 6.3 1.3 0 2.5-.3 3.6-.7"/></g></svg>';
document.querySelectorAll('.field-toggle').forEach((btn) => {
  const input = document.getElementById(btn.dataset.target);
  btn.addEventListener('click', () => {
    const oculta = input.type === 'password';
    input.type = oculta ? 'text' : 'password';
    btn.innerHTML = oculta ? OJO_TACHADO : OJO;
    const texto = oculta ? 'Ocultar contraseña' : 'Mostrar contraseña';
    btn.title = texto;
    btn.setAttribute('aria-label', texto);
  });
});
