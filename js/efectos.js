(() => {
  const suave = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, raiz) => (raiz || document).querySelector(s);

  function hojas(x, y, n) {
    if (suave) return;
    for (let i = 0; i < Math.min(n, 4); i++) {
      const h = document.createElement('i');
      const ang = Math.random() * 6.28;
      const dist = 30 + Math.random() * 40;
      h.className = 'hoja-vuela';
      h.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 30}px;--rot:${Math.random() * 400 - 200}deg`;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1050);
    }
  }
  window.BioHojas = hojas;

  const hora = new Date().getHours();
  document.documentElement.setAttribute('data-hora', hora >= 7 && hora < 18 ? 'dia' : 'noche');

  function portada() {
    const fig = $('.home-figure');
    if (!fig) return;
    const svg = $('svg', fig);
    let riegos = 0;

    addEventListener('mousemove', (e) => {
      const estilo = document.documentElement.style;
      estilo.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
      estilo.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
    }, { passive: true });

    function gotas() {
      const r = svg.getBoundingClientRect();
      const f = fig.getBoundingClientRect();
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const g = document.createElement('i');
          g.className = 'gota-real';
          g.style.cssText = `left:${r.left - f.left + r.width * (0.3 + Math.random() * 0.3)}px;top:${r.top - f.top + r.height * 0.1}px;--cae:${r.height * 0.58}px`;
          fig.appendChild(g);
          setTimeout(() => g.remove(), 950);
        }, i * 90);
      }
    }

    function flor() {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'flor-hero');
      let petalos = '';
      for (let k = 0; k < 6; k++) petalos += `<ellipse cx="232" cy="118" rx="7" ry="13" fill="#e9a23b" transform="rotate(${k * 60} 232 128)"/>`;
      g.innerHTML = petalos + '<circle cx="232" cy="128" r="7" fill="#b87036"/>';
      svg.appendChild(g);
      const b = svg.getBoundingClientRect();
      hojas(b.left + b.width / 2, b.top, 16);
      if (window.BioPuntos) BioPuntos.dar(3, 'floreció');
    }

    svg.addEventListener('click', () => {
      gotas();
      if (riegos < 5) {
        riegos++;
        [fig, svg, $('.il-planta', svg)].filter(Boolean).forEach((el) => el.style.setProperty('--crece', 1 + riegos * 0.07));
      }
      if (riegos === 5 && !$('.flor-hero', svg)) flor();
    });
  }

  function secreto() {
    if (suave) return;
    let letras = '';
    addEventListener('keydown', (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      letras = (letras + e.key.toLowerCase()).slice(-6);
      if (letras !== 'planta') return;
      for (let i = 0; i < 40; i++) {
        setTimeout(() => {
          const h = document.createElement('i');
          h.className = 'lluvia-hojas';
          h.style.cssText = `left:${Math.random() * 100}vw;--dx:${Math.random() * 120 - 60}px;animation-duration:${2.5 + Math.random() * 2.5}s`;
          document.body.appendChild(h);
          setTimeout(() => h.remove(), 5200);
        }, Math.random() * 1800);
      }
      if (window.BioToast) BioToast('Encontraste el secreto');
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-primary') && !e.target.closest('.regar')) hojas(e.clientX, e.clientY, 6);
  });
  portada();
  secreto();
})();
