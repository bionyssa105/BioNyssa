try {
  const valor = localStorage.getItem('bionyssa_tema');
  const oscuro = valor === 'dark' || (valor === null && matchMedia('(prefers-color-scheme: dark)').matches);
  if (oscuro) document.documentElement.setAttribute('data-theme', 'dark');
} catch (err) {}

// ir-al-menu (solo páginas con data-entrada)
if (document.documentElement.hasAttribute('data-entrada')) {
(function () {
  function revisar() {
    if (/[?&]inicio=1/.test(location.search) || location.search.includes('oobCode')) return;
    try {
      const datos = JSON.parse(localStorage.getItem('bionyssa_sesion'));
      if (datos && datos.id) location.replace('/paginas/menu.html');
    } catch (err) {}
  }
  revisar();
  addEventListener('pageshow', function (ev) { if (ev.persisted) revisar(); });
})();
}
