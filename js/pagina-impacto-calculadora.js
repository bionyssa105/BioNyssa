(() => {
  const $ = (id) => document.getElementById(id);
  const rango = $('impBolsas');
  if (!rango) return;

  const G = 6;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const num = (n) => n.toLocaleString('es-MX');
  const peso = (g) => g >= 1000 ? (g / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg' : g + ' g';
  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  function animar(el, fin, fmt, ms) {
    const ini = +el.dataset.v || 0;
    el.dataset.v = fin;
    if (quieto || ini === fin) { el.textContent = fmt(fin); return; }
    const t0 = performance.now();
    (function paso(t) {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = fmt(Math.round(ini + (fin - ini) * (1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }

  const PLAZO = 'bionyssa_impacto_plazo';
  let anios = [1, 5, 10].includes(+lee(PLAZO)) ? +lee(PLAZO) : 1;
  const botones = [...document.querySelectorAll('.imp-plazo button')];

  function frase(kg, n) {
    if (n <= 24) return 'Poquito, pero cuenta: cada bolsa que sale de circulación es una menos tirada por ahí.';
    if (kg < 10) return 'Son ' + num(n) + ' bolsas que dejan de ir a la basura. Ya se nota.';
    if (kg < 50) return 'Ya hablamos de varios kilos de plástico. No está nada mal para un cambio tan sencillo.';
    return 'Son muchísimos kilos de plástico. Con un hábito así, tu casa sería de las que más ayudan.';
  }

  function pintar() {
    const mes = +rango.value;
    const total = mes * 12 * anios;
    $('impMes').textContent = mes;
    rango.style.setProperty('--p', ((mes - 1) / 59 * 100).toFixed(1) + '%');
    rango.setAttribute('aria-valuetext', mes + (mes === 1 ? ' bolsa' : ' bolsas') + ' al mes');
    botones.forEach((b) => {
      const activo = +b.dataset.a === anios;
      b.classList.toggle('on', activo);
      b.setAttribute('aria-pressed', activo);
    });
    $('impTxtBolsas').textContent = (anios === 1 ? 'bolsas al año' : 'bolsas en ' + anios + ' años') + ' que no acaban en la basura';
    animar($('impAnio'), total, num, 380);
    animar($('impPlantas'), total, num, 380);
    animar($('impPeso'), total * G, peso, 380);
    $('impFrase').textContent = frase(total * G / 1000, total);
  }
  rango.addEventListener('input', pintar);
  botones.forEach((b) => b.addEventListener('click', () => {
    anios = +b.dataset.a;
    guarda(PLAZO, anios);
    pintar();
  }));
  pintar();

  const ciclo = document.querySelector('.imp-ciclo');
  if (ciclo) {
    [...ciclo.children].forEach((li, i) => li.style.setProperty('--i', i));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es, o) => {
        if (es[0].isIntersecting) { ciclo.classList.add('ve'); o.disconnect(); }
      }, { threshold: 0.35 }).observe(ciclo);
    } else ciclo.classList.add('ve');
  }

  const SEMB = 'bionyssa_sembradas';
  const METAS = [1, 5, 20, 50];
  const FRASES = [
    [1, 'Ya empezó tu primera planta.'],
    [5, 'Cinco bolsas que no terminaron en la basura.'],
    [20, 'Ya podrías armar un jardín.'],
    [50, 'Eso ya es un huerto completo.']
  ];
  const sembradas = () => +lee(SEMB) || 0;

  function mostrar(n) {
    $('impSembradas').textContent = n;
    const f = FRASES.filter((x) => n >= x[0]).pop();
    $('impMsg').textContent = f ? f[1] : 'Se guarda en este dispositivo y, si tienes sesión iniciada, también en tu cuenta.';
    $('impMetas').innerHTML = METAS.map((m) => '<li class="' + (n >= m ? 'listo' : '') + '"><b>' + m + '</b><span>' + (m === 1 ? 'bolsa' : 'bolsas') + '</span></li>').join('');

    const sig = METAS.find((m) => m > n);
    const antes = METAS.filter((m) => m <= n).pop() || 0;
    const barra = $('impMetaRelleno');
    let avance = 100;
    let texto = 'Llegaste a todas las metas. Sigue sembrando.';
    if (sig) {
      avance = (n - antes) / (sig - antes) * 100;
      const faltan = sig - n;
      texto = !n
        ? 'Aún no anotas ninguna. Cuando siembres tu primera bolsa, dale al botón.'
        : 'Te ' + (faltan === 1 ? 'falta 1 bolsa' : 'faltan ' + faltan + ' bolsas') + ' para llegar a ' + sig + '.';
    }
    barra.style.width = avance + '%';
    barra.parentNode.setAttribute('aria-valuenow', Math.round(avance));
    $('impMetaTxt').textContent = texto;
  }
  mostrar(sembradas());

  const nube = () => (window.BioFirebase && BioFirebase.configurado()) ? BioFirebase.nucleo() : Promise.reject();

  function sumarGlobal() {
    nube().then((nu) => {
      if (!nu.auth.currentUser) return;
      return nu.ff.setDoc(nu.ff.doc(nu.db, 'global', 'impacto'), { sembradas: nu.ff.increment(1) }, { merge: true });
    }).catch(() => {});
  }

  $('impSumar').addEventListener('click', () => {
    const n = sembradas() + 1;
    guarda(SEMB, n);
    mostrar(n);
    sumarGlobal();
  });

  $('impCero').addEventListener('click', async () => {
    if (!sembradas()) return;
    let seguir = true;
    if (window.BioComun && BioComun.dialogo) {
      seguir = await BioComun.dialogo({
        titulo: '¿Empezar de cero?',
        mensaje: 'Se borra el conteo de bolsas que has sembrado.',
        boton: 'Sí, borrar',
        cancelar: 'Cancelar',
        tipo: 'info'
      });
    }
    if (seguir) { guarda(SEMB, 0); mostrar(0); }
  });

  nube().then((nu) => {
    const ref = nu.ff.doc(nu.db, 'global', 'impacto');
    nu.ff.onSnapshot(ref, (s) => animar($('impGlobalNum'), s.exists() ? +s.data().sembradas || 0 : 0, (n) => n, 900), () => {});
  }).catch(() => {});
})();
