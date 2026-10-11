(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.menu-card, .game-card, .section-card, .card, .nivel-card, .planta-card, .reto-dia, .imp-card');
  const obs = new IntersectionObserver((lista) => {
    lista.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add('visto');
      obs.unobserve(x.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  items.forEach((el, i) => {
    el.classList.add('rv');
    el.style.setProperty('--d', (i % 6) * 70 + 'ms');
    obs.observe(el);
  });
})();
