try {
  const t = localStorage.getItem('bionyssa_tema');
  const oscuro = t === 'dark' || (t === null && matchMedia('(prefers-color-scheme: dark)').matches);
  if (oscuro) document.documentElement.setAttribute('data-theme', 'dark');
} catch (e) {}
