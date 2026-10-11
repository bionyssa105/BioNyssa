(() => {
  function revisar() {
    if (/[?&]inicio=1/.test(location.search) || location.search.includes('oobCode')) return;
    try {
      const s = JSON.parse(localStorage.getItem('bionyssa_sesion'));
      if (s && s.id) location.replace('menu.html');
    } catch (e) {}
  }
  revisar();
  addEventListener('pageshow', (e) => { if (e.persisted) revisar(); });
})();
