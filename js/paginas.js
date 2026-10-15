// guia
if (['contacto', 'guia'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const items = [...document.querySelectorAll('#acordeon .acc-item, #preguntas .acc-item')];
  const sinScroll = !!document.querySelector('#preguntas');
  function cerrar(item) {
    item.classList.remove('open');
    item.querySelector('.acc-panel').style.maxHeight = null;
    item.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
  }
  function onda(boton, elemento) {
    const caja = boton.getBoundingClientRect();
    boton.style.setProperty('--rx', (elemento.detail ? elemento.clientX - caja.left : caja.width / 2) + 'px');
    boton.style.setProperty('--ry', (elemento.detail ? elemento.clientY - caja.top : caja.height / 2) + 'px');
    boton.classList.remove('onda');
    void boton.offsetWidth;
    boton.classList.add('onda');
    setTimeout(function () { return boton.classList.remove('onda'); }, 650);
  }
  items.forEach(function (item, i) {
    const boton = item.querySelector('.acc-trigger');
    const panel = item.querySelector('.acc-panel');
    boton.setAttribute('aria-expanded', 'false');
    boton.addEventListener('click', function (ev) {
      const estabaAbierto = item.classList.contains('open');
      items.forEach(cerrar);
      onda(boton, ev);
      if (estabaAbierto) return;
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      boton.setAttribute('aria-expanded', 'true');
      if (!sinScroll) setTimeout(function () { return item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 380);
    });
    boton.addEventListener('keydown', function (ev) {
      const paso = { ArrowDown: 1, ArrowUp: -1 }[ev.key];
      if (!paso) return;
      ev.preventDefault();
      items[(i + paso + items.length) % items.length].querySelector('.acc-trigger').focus();
    });
  });
})();
 } catch (err) { console.error(err); }
}

// contacto
if (['contacto'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const form = elem('formContacto'), nom = elem('cNombre'), cor = elem('cCorreo'), msg = elem('cMensaje');
  const cuenta = elem('cCuenta'), estado = elem('cEstado'), boton = elem('cEnviar');
  const CLAVE = '1541c48b-6908-4a8f-99ee-f124e7e59fa7';
  const ESPERA = 60000, TOPE = 12000;
  const conTope = function (dato) { return Promise.race([dato, new Promise(function (_, no) { return setTimeout(no, TOPE); })]).then(function () { return true; }, function () { return false; }); };
  const aviso = function (texto, tipo) { estado.textContent = texto; estado.className = 'c-estado' + (tipo ? ' ' + tipo : ''); };
  const marcar = function (el, mal) { return el.classList.toggle('malo', !!mal); };
  const ultimo = function () { try { return +localStorage.getItem('bio_contacto_t') || 0; } catch (err) { return 0; } };
  msg.addEventListener('input', function () {
    cuenta.textContent = msg.value.length + ' / 500';
    cuenta.classList.toggle('casi', msg.value.length >= 450);
    marcar(msg, false);
  });
  nom.addEventListener('input', function () { return marcar(nom, false); });
  cor.addEventListener('input', function () { return marcar(cor, false); });
  async function guardar(nombre, correo, mensaje) {
    const nu = await BioFirebase.nucleo();
    await nu.ff.addDoc(nu.ff.collection(nu.db, 'mensajes'), { nombre, correo, mensaje, creado: Date.now() });
  }
  async function correo(nombre, correo, mensaje) {
    const respuesta = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: CLAVE, subject: 'Mensaje nuevo desde BioNyssa', name: nombre, email: correo, message: mensaje })
    });
    const valor = await respuesta.json();
    if (!valor.success) throw new Error(valor.message);
  }
  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (elem('cWeb').value) return;
    const texto = nom.value.trim(), texto2 = cor.value.trim(), texto3 = msg.value.trim();
    const okN = texto.length >= 2;
    const okC = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto2);
    const okM = texto3.length >= 10;
    marcar(nom, !okN);
    marcar(cor, !okC);
    marcar(msg, !okM);
    if (!okN || !okC || !okM) {
      return aviso(!okN ? 'Pon tu nombre.' : !okC ? 'Ese correo no se ve bien.' : 'Cuéntanos un poco más, mínimo 10 letras.', 'mal');
    }
    const resta = ESPERA - (Date.now() - ultimo());
    if (resta > 0) return aviso('Espera ' + Math.ceil(resta / 1000) + ' segundos para mandar otro.', 'mal');
    boton.disabled = true;
    aviso('Enviando...');
    const hayNube = !!(window.BioFirebase && BioFirebase.configurado());
    const [guardado, enviado] = await Promise.all([
      hayNube ? conTope(guardar(texto, texto2, texto3)) : false,
      CLAVE ? conTope(correo(texto, texto2, texto3)) : false
    ]);
    if (!guardado && !enviado) {
      aviso('No se pudo enviar. Revisa tu internet e inténtalo otra vez.', 'mal');
    } else {
      try { localStorage.setItem('bio_contacto_t', String(Date.now())); } catch (err) {}
      form.reset();
      cuenta.textContent = '0 / 500';
      aviso('Listo, recibimos tu mensaje. Te respondemos al correo que pusiste.', 'ok');
    }
    boton.disabled = false;
  });
})();
 } catch (err) { console.error(err); }
}

// impacto
if (['impacto'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const rango = elem('impBolsas');
  if (!rango) return;
  const numero = 6;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const num = function (numero2) { return numero2.toLocaleString('es-MX'); };
  const peso = function (valor) { return valor >= 1000 ? (valor / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 }) + ' kg' : valor + ' g'; };
  const lee = function (k) { try { return localStorage.getItem(k); } catch (err) { return null; } };
  const guarda = function (k, valor) { try { localStorage.setItem(k, valor); } catch (err) {} };
  function animar(el, fin, fmt, ms) {
    const ini = +el.dataset.v || 0;
    el.dataset.v = fin;
    if (quieto || ini === fin) { el.textContent = fmt(fin); return; }
    const t0 = performance.now();
    (function paso(numero2) {
      const k = Math.min(1, (numero2 - t0) / ms);
      el.textContent = fmt(Math.round(ini + (fin - ini) * (1 - (1 - k) ** 3)));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
  const PLAZO = 'bionyssa_impacto_plazo';
  let anios = [1, 5, 10].includes(+lee(PLAZO)) ? +lee(PLAZO) : 1;
  const botones = [...document.querySelectorAll('.imp-plazo button')];
  function frase(kg, numero2) {
    if (numero2 <= 24) return 'Poquito, pero cuenta: cada bolsa que sale de circulación es una menos tirada por ahí.';
    if (kg < 10) return 'Son ' + num(numero2) + ' bolsas que dejan de ir a la basura. Ya se nota.';
    if (kg < 50) return 'Ya hablamos de varios kilos de plástico. No está nada mal para un cambio tan sencillo.';
    return 'Son muchísimos kilos de plástico. Con un hábito así, tu casa sería de las que más ayudan.';
  }
  function pintar() {
    const mes = +rango.value;
    const total = mes * 12 * anios;
    elem('impMes').textContent = mes;
    rango.style.setProperty('--p', ((mes - 1) / 59 * 100).toFixed(1) + '%');
    rango.setAttribute('aria-valuetext', mes + (mes === 1 ? ' bolsa' : ' bolsas') + ' al mes');
    botones.forEach(function (botone) {
      const activo = +botone.dataset.a === anios;
      botone.classList.toggle('on', activo);
      botone.setAttribute('aria-pressed', activo);
    });
    elem('impTxtBolsas').textContent = (anios === 1 ? 'bolsas al año' : 'bolsas en ' + anios + ' años') + ' que no acaban en la basura';
    animar(elem('impAnio'), total, num, 380);
    animar(elem('impPlantas'), total, num, 380);
    animar(elem('impPeso'), total * numero, peso, 380);
    elem('impFrase').textContent = frase(total * numero / 1000, total);
  }
  rango.addEventListener('input', pintar);
  botones.forEach(function (botone) { return botone.addEventListener('click', function () {
    anios = +botone.dataset.a;
    guarda(PLAZO, anios);
    pintar();
  }); });
  pintar();
  const ciclo = document.querySelector('.imp-ciclo');
  if (ciclo) {
    [...ciclo.children].forEach(function (li, i) { return li.style.setProperty('--i', i); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, opciones) {
        if (es[0].isIntersecting) { ciclo.classList.add('ve'); opciones.disconnect(); }
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
  const sembradas = function () { return +lee(SEMB) || 0; };
  function mostrar(texto2) {
    elem('impSembradas').textContent = texto2;
    const valor = FRASES.filter(function (item) { return texto2 >= item[0]; }).pop();
    elem('impMsg').textContent = valor ? valor[1] : 'Se guarda en este dispositivo y, si tienes sesión iniciada, también en tu cuenta.';
    elem('impMetas').innerHTML = METAS.map(function (item) { return '<li class="' + (texto2 >= item ? 'listo' : '') + '"><b>' + item + '</b><span>' + (item === 1 ? 'bolsa' : 'bolsas') + '</span></li>'; }).join('');
    const sig = METAS.find(function (item) { return item > texto2; });
    const antes = METAS.filter(function (item) { return item <= texto2; }).pop() || 0;
    const barra = elem('impMetaRelleno');
    let avance = 100;
    let texto = 'Llegaste a todas las metas. Sigue sembrando.';
    if (sig) {
      avance = (texto2 - antes) / (sig - antes) * 100;
      const faltan = sig - texto2;
      texto = !texto2
        ? 'Aún no anotas ninguna. Cuando siembres tu primera bolsa, dale al botón.'
        : 'Te ' + (faltan === 1 ? 'falta 1 bolsa' : 'faltan ' + faltan + ' bolsas') + ' para llegar a ' + sig + '.';
    }
    barra.style.width = avance + '%';
    barra.parentNode.setAttribute('aria-valuenow', Math.round(avance));
    elem('impMetaTxt').textContent = texto;
  }
  mostrar(sembradas());
  const nube = function () { return (window.BioFirebase && BioFirebase.configurado()) ? BioFirebase.nucleo() : Promise.reject(); };
  function sumarGlobal() {
    nube().then(function (nu) {
      if (!nu.auth.currentUser) return;
      return nu.ff.setDoc(nu.ff.doc(nu.db, 'global', 'impacto'), { sembradas: nu.ff.increment(1) }, { merge: true });
    }).catch(function () {});
  }
  elem('impSumar').addEventListener('click', function () {
    const valor = sembradas() + 1;
    guarda(SEMB, valor);
    mostrar(valor);
    sumarGlobal();
  });
  elem('impCero').addEventListener('click', async function () {
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
  nube().then(function (nu) {
    const ref = nu.ff.doc(nu.db, 'global', 'impacto');
    nu.ff.onSnapshot(ref, function (estado) { return animar(elem('impGlobalNum'), estado.exists() ? +estado.data().sembradas || 0 : 0, function (numero2) { return numero2; }, 900); }, function () {});
  }).catch(function () {});
})();
 } catch (err) { console.error(err); }
}

// menu
if (['menu'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const cerrarSesion = elem('cerrarSesion');
  if (BioSesion.obtener()) {
    BioSesion.pintarSaludo('saludo');
    cerrarSesion.style.display = '';
  } else {
    elem('saludo').textContent = '¡Bienvenido, invitado!';
    elem('registrarseTopbar').style.display = '';
    elem('bannerInvitado').style.display = 'flex';
  }
  cerrarSesion.addEventListener('click', async function (ev) {
    ev.preventDefault();
    if (window.BioNube) { try { await BioNube.salir(); } catch (err) {} }
    BioSesion.cerrar();
    location.href = '/index.html';
  });
  elem('botonBannerInvitado').addEventListener('click', function () { location.href = '/paginas/registro.html'; });
})();
 } catch (err) { console.error(err); }
}

// mi-planta
if (['mi-planta'].indexOf(paginaActual) > -1) {
 try {
(function () {
  const elem = function (id) { return document.getElementById(id); };
  const main = document.querySelector('.planta-layout');
  if (main && !(typeof BioSesion !== 'undefined' && BioSesion.obtener())) {
    main.outerHTML = '<div class="planta-bloqueo" style="max-width:440px;margin:24px auto;text-align:center;padding:36px 24px;border:1px solid var(--linea);border-radius:16px;background:var(--tarjeta)">' +
      '<h2 style="margin:0 0 8px;font-size:1.3rem">Necesitas una cuenta</h2>' +
      '<p style="margin:0 0 22px;color:var(--texto-suave)">Mi planta guarda tu siembra, tus riegos y tu avance. Crea tu cuenta o inicia sesión para usarla.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a href="/paginas/registro.html" class="btn btn-primary" style="width:auto">Crear cuenta</a><a href="/paginas/login.html" class="btn btn-outline" style="width:auto">Iniciar sesión</a></div></div>';
    return;
  }
  const MAX_FOTOS = 8;
  const MAX_PLANTAS = 12;
  const vista = elem('plantaVista');
  const ETAPAS = [['Semilla', 0], ['Germinando', 7], ['Brote', 21], ['Planta', 45]];
  const TIPS = [
    ['Entierra la bolsa completa y cúbrela con tierra.', 'Riega bien la primera vez.', 'Marca el lugar para no perderlo.'],
    ['Mantén la tierra húmeda, sin encharcar.', 'Todavía no se ve nada: es normal.', 'Revisa el lugar cada día.'],
    ['Cuida el brote de plagas y animales.', 'Procura que le dé el sol.', 'Riega mejor por la mañana.'],
    ['Riega con regularidad.', 'Fertiliza de vez en cuando si hace falta.', 'Sube una foto a la comunidad.']
  ];
  const ESTADOS = ['Tiene sed', 'Ya le toca', 'Está bien', 'Bien regada'];
  const SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const ICONOS = {
    gota: '<path d="M12 3.5c3.2 4 5.5 6.8 5.5 9.7a5.5 5.5 0 0 1-11 0c0-2.9 2.3-5.7 5.5-9.7Z"/>',
    lluvia: '<path d="M7 14a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 7.5a3.3 3.3 0 0 1 0 6.5H7Z"/><path d="M8 17.5 7 20M12 17.5 11 20M16 17.5 15 20"/>',
    fuego: '<path d="M12 3c.5 3.2 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4 .2 1.3.8 2 1.5 2.2C11 8 10.5 5.5 12 3Z"/>',
    rayo: '<path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5L13 3Z"/>',
    regla: '<path d="M4 15.5 15.5 4 20 8.5 8.5 20 4 15.5Z"/><path d="m9 10.5 2 2M12 7.5l2 2M6.5 13l1.5 1.5"/>',
    camara: '<path d="M4 8.5h3L8.5 6h7L17 8.5h3V19H4V8.5Z"/><circle cx="12" cy="13.5" r="3.2"/>',
    brote: '<g transform="translate(2 2) scale(.66)"><path d="M16 29V15"/><path d="M16 16.5C15.6 11.8 12 9 6.4 9.2c.2 5 3.6 8 9.6 7.3Z"/><path d="M16.4 14.6C17 10 20.4 7.2 25.6 7.4c.1 4.8-3.1 7.6-9.2 7.2Z"/></g>',
    planta: '<path d="M7 15h10l-1.2 5H8.2L7 15Z"/><path d="M12 15V8"/><path d="M12 11c-3 0-5-1.5-5-4 3 0 5 1.5 5 4ZM12 9c0-2.5 2-4.5 5-4.5 0 2.8-2 4.5-5 4.5Z"/>',
    etiqueta: '<path d="M4 4h7.5L20 12.5 12.5 20 4 11.5V4Z"/><circle cx="8" cy="8" r="1.2"/>',
    libreta: '<path d="M6 4h11a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 17 20H6V4Z"/><path d="M9.5 8.5h6M9.5 12h6"/>',
    grafica: '<path d="M4 19V5M4 19h16"/><path d="m7.5 15 4-4.5 3 2.5L19 7"/>',
    ola: '<path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0"/>',
    trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1.5a3 3 0 0 0 3 3M16 6h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13v4M8.5 20h7M10 17h4"/>',
    pala: '<path d="M12 3v9M9.5 3h5"/><path d="M8.5 12h7l-1 6.5a1 1 0 0 1-1 .9h-3a1 1 0 0 1-1-.9L8.5 12Z"/>',
    sol: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    lupa: '<circle cx="11" cy="11" r="6"/><path d="m15.5 15.5 4.5 4.5"/>',
    hoja: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14Z"/><path d="m5 19 9-9"/>'
  };
  const ico = function (nombre, tam) { return '<svg width="' + (tam || 24) + '" height="' + (tam || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + '</svg>'; };
  const INSIGNIAS = [
    ['r1', 'gota', 'Primer riego', function (dato) { return dato.riegos.length >= 1; }],
    ['r10', 'lluvia', '10 riegos', function (dato) { return dato.riegos.length >= 10; }],
    ['k3', 'fuego', '3 días seguidos', function (dato) { return mejorRacha(dato.riegos) >= 3; }],
    ['k7', 'rayo', '7 días seguidos', function (dato) { return mejorRacha(dato.riegos) >= 7; }],
    ['alt', 'regla', 'Primera medida', function (dato) { return (dato.alturas || []).length >= 1; }],
    ['foto', 'camara', 'Primera foto', function (dato, di) { return di.some(function (item) { return item.img; }); }],
    ['brote', 'brote', 'Llegó al brote', function (dato) { return diasDe(dato) >= 21; }],
    ['planta', 'planta', 'Ya es planta', function (dato) { return diasDe(dato) >= 45; }],
    ['nom', 'etiqueta', 'Le pusiste nombre', function (obj) { return !!obj.nombre; }],
    ['diar3', 'libreta', '3 entradas', function (dato, di) { return di.length >= 3; }],
    ['med5', 'grafica', '5 medidas', function (dato) { return (dato.alturas || []).length >= 5; }],
    ['r30', 'ola', '30 riegos', function (dato) { return dato.riegos.length >= 30; }],
    ['k14', 'trofeo', '14 días seguidos', function (dato) { return mejorRacha(dato.riegos) >= 14; }],
    ['cuid', 'pala', 'Cuidador', function (dato) { return diasCompletos(dato) >= 5; }]
  ];
  const CUIDADOS = [['sol', 'sol', 'Le dio el sol'], ['plagas', 'lupa', 'Revisé plagas'], ['hojas', 'hoja', 'Quité hojas secas']];
  const DATOS = [
    'Las raíces crecen antes que las hojas: lo que no ves ya está trabajando.',
    'Una semilla puede esperar semanas a tener la humedad justa para germinar.',
    'Regar por la mañana evita que el agua se evapore rápido con el calor.',
    'Las hojas se mueven hacia la luz. Eso se llama fototropismo.',
    'El exceso de agua también daña: las raíces necesitan aire para respirar.',
    'La tierra con composta guarda más humedad y nutrientes.',
    'Los brotes nuevos suelen ser de un verde más claro que las hojas adultas.',
    'En días de mucho calor, una sombra parcial protege a las plantas jóvenes.',
    'Las plantas respiran por unos poros diminutos en sus hojas, los estomas.',
    'Hablarle a tu planta no la hace crecer, pero te ayuda a acordarte de cuidarla.'
  ];
  const BIO = ['Anota tu primer riego y empezamos.', '¡Tengo sed! Riégame cuando puedas.', 'Ya casi me toca el agua.', 'Todo bien por aquí.', '¡Gracias por el riego!'];
  let regando = false;
  // Varias plantas por cuenta: cada una tiene su id y su propio diario (se guardan por separado en la nube)
  let plantas = [];
  let actual = null;
  let agregando = false;
  const recuerda = function () { try { if (actual) sessionStorage.setItem('bio_planta_actual', actual); } catch (err) {} };
  const lee = function () { return plantas.find(function (planta) { return planta.id === actual; }) || null; };
  const guarda = function () { return BioPlantas.guardar(plantas); };
  const leeDiario = function () { return BioPlantas.diario(actual); };
  const guardaDiario = function (primero) { return BioPlantas.guardarDiario(actual, primero); };
  const fecha = function (dato) { return dato.getFullYear() + '-' + String(dato.getMonth() + 1).padStart(2, '0') + '-' + String(dato.getDate()).padStart(2, '0'); };
  const hoy = function () { return fecha(new Date()); };
  const dias = function (a, b) { return Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5); };
  const corta = function (texto) { return texto.split('-').reverse().slice(0, 2).join('/'); };
  const esc = function (estado) { return String(estado).replace(/[&<>"]/g, function (valor) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[valor]; }); };
  const aviso = function (texto) { if (window.BioToast) BioToast(texto); };
  const diasDe = function (numero) { return Math.max(0, dias(numero.siembra, hoy())); };
  const etapaDe = function (numero) { let i = 0; ETAPAS.forEach(function (item, k) { if (numero >= item[1]) i = k; }); return i; };
  function mejorRacha(riegos) {
    const copia = riegos.slice().sort();
    let mejor = 0, numero = 0, prev = null;
    copia.forEach(function (item) { numero = prev && dias(prev, item) === 1 ? numero + 1 : 1; prev = item; if (numero > mejor) mejor = numero; });
    return mejor;
  }
  function diasCompletos(dato) {
    const valor = dato.cuidados || {};
    return Object.keys(valor).filter(function (k) { return Array.isArray(valor[k]) && valor[k].length >= CUIDADOS.length; }).length;
  }
  const sumaDias = function (archivo, numero) { const fecha2 = new Date(archivo + 'T00:00'); fecha2.setDate(fecha2.getDate() + numero); return fecha(fecha2); };
  function racha(riegos) {
    let numero = 0;
    const dia = new Date();
    if (!riegos.includes(fecha(dia))) dia.setDate(dia.getDate() - 1);
    while (riegos.includes(fecha(dia))) { numero++; dia.setDate(dia.getDate() - 1); }
    return numero;
  }
  const hojas = function (otro, estado) { return '<g transform="translate(60 ' + otro + ') scale(' + estado + ')"><path class="pl-hoja" d="M0 0c-14 0-22-8-22-18 12 0 22 6 22 18z"/><path class="pl-hoja" d="M0-4c14 0 22-8 22-18-12 0-22 6-22 18z"/></g>'; };
  function dibujo(i) {
    let texto = '<svg viewBox="0 0 120 120" class="pl-dib" aria-hidden="true"><ellipse cx="60" cy="104" rx="46" ry="9" class="pl-suelo"/>';
    if (i === 0) texto += '<ellipse cx="60" cy="99" rx="8" ry="5" class="pl-semilla"/>';
    else if (i === 1) texto += '<ellipse cx="60" cy="99" rx="7" ry="4.5" class="pl-semilla"/><path class="pl-tallo" d="M60 95c0-6 3-9 6-11"/>';
    else if (i === 2) texto += '<path class="pl-tallo" d="M60 100V64"/>' + hojas(70, 1);
    else texto += '<path class="pl-tallo" d="M60 100V38"/>' + hojas(80, 1.1) + hojas(58, 0.9) + '<circle cx="60" cy="34" r="6" class="pl-flor"/>';
    return texto + '</svg>';
  }
  const PESTANAS = [['resumen', 'Resumen', [0]], ['cuidados', 'Cuidados', [1, 2]], ['calendario', 'Calendario', [3, 4]], ['diario', 'Diario', [5, 6]], ['insignias', 'Insignias', [7]]];
  let pestanaActiva = 'resumen'; // se recuerda mientras no recargues la página
  function muestraPestana(id) {
    vista.querySelectorAll('.pl-pestanas button').forEach(function (item) { return item.setAttribute('aria-selected', String(item.dataset.p === id)); });
    vista.querySelectorAll('.pl-panel').forEach(function (pn) {
      const activo = pn.dataset.p === id;
      pn.classList.toggle('activo', activo);
      if (activo) pn.querySelectorAll('.rv').forEach(function (item) { return item.classList.add('visto'); });
    });
  }
  function armaPestanas() {
    const tarjetas = Array.from(vista.children);
    if (tarjetas.length < 8) return; // aún no hay planta registrada: no hace falta
    vista.innerHTML = '';
    const barra = document.createElement('div');
    barra.className = 'pl-pestanas';
    barra.setAttribute('role', 'tablist');
    vista.appendChild(barra);
    PESTANAS.forEach(function ([id, nombre, posiciones]) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = nombre;
      boton.dataset.p = id;
      boton.setAttribute('role', 'tab');
      barra.appendChild(boton);
      const panel = document.createElement('div');
      panel.className = 'pl-panel';
      panel.dataset.p = id;
      panel.setAttribute('role', 'tabpanel');
      posiciones.forEach(function (i) { return panel.appendChild(tarjetas[i]); });
      vista.appendChild(panel);
    });
    barra.addEventListener('click', function (ev) {
      const elem2 = ev.target.closest('button[data-p]');
      if (!elem2) return;
      pestanaActiva = elem2.dataset.p;
      muestraPestana(pestanaActiva);
    });
    muestraPestana(pestanaActiva);
  }
  function selector() {
    const caja = elem('plantaSelector');
    if (!caja) return;
    if (!plantas.length) { caja.innerHTML = ''; return; }
    caja.innerHTML = '<div class="pl-plantas" role="tablist" aria-label="Tus plantas">' +
      plantas.map(function (planta, i) { return '<button type="button" role="tab" data-id="' + esc(planta.id) + '" aria-selected="' + String(!agregando && planta.id === actual) + '">' +
        '<span aria-hidden="true">' + ico('planta', 18) + '</span>' + esc(planta.nombre || 'Planta ' + (i + 1)) + '</button>'; }).join('') +
      (plantas.length < MAX_PLANTAS ? '<button type="button" class="pl-agregar" id="bAgregar" aria-selected="' + String(agregando) + '">+ Agregar planta</button>' : '') + '</div>';
    caja.querySelectorAll('button[data-id]').forEach(function (item) { return item.addEventListener('click', function () {
      actual = item.dataset.id; agregando = false; recuerda(); pintar();
    }); });
    const ba = elem('bAgregar');
    if (ba) ba.addEventListener('click', function () { agregando = true; pintar(); });
  }
  function formulario() {
    const primera = !plantas.length;
    vista.innerHTML = '<div class="planta-card"><div class="pl-top">' + dibujo(0) + '<div><h2>' + (primera ? 'Registra tu siembra' : 'Agrega otra planta') + '</h2><p>Ponle nombre a tu planta y dinos cuándo enterraste la bolsa.</p></div></div>' +
      '<form class="planta-form" id="fPlanta"><input id="pNombre" maxlength="24" placeholder="Nombre (opcional)" aria-label="Nombre de la planta"><input id="pFecha" type="date" max="' + hoy() + '" value="' + hoy() + '" required aria-label="Fecha de siembra"><button class="btn btn-primary" type="submit">' + (primera ? 'Empezar seguimiento' : 'Agregar planta') + '</button>' +
      (primera ? '' : '<button class="btn btn-outline" type="button" id="bCancelarPlanta">Cancelar</button>') + '</form></div>';
    elem('fPlanta').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (plantas.length >= MAX_PLANTAS) { aviso('Ya tienes ' + MAX_PLANTAS + ' plantas'); return; }
      const nueva = { id: BioPlantas.nuevoId(), nombre: elem('pNombre').value.trim(), siembra: elem('pFecha').value || hoy(), riegos: [], freq: 3, alturas: [], logros: {}, cuidados: {}, creado: Date.now() };
      plantas.push(nueva);
      guarda();
      actual = nueva.id; agregando = false; recuerda();
      pintar();
      aviso(primera ? 'Seguimiento iniciado' : 'Planta agregada');
    });
    const bc = elem('bCancelarPlanta');
    if (bc) bc.addEventListener('click', function () { agregando = false; pintar(); });
  }
  function calendario(riegos, siembra) {
    const base = new Date();
    base.setDate(base.getDate() - 27);
    const hueco = (base.getDay() + 6) % 7;
    let html = '<div class="cal-sem" aria-hidden="true">' + SEMANA.map(function (item) { return '<span>' + item + '</span>'; }).join('') + '</div><div class="cal">';
    for (let k = 0; k < hueco; k++) html += '<span></span>';
    for (let k = 27; k >= 0; k--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - k);
      const valor = fecha(dia);
      const antes = valor < siembra;
      html += '<button type="button" data-f="' + valor + '" class="' + (riegos.includes(valor) ? 'on ' : '') + (k === 0 ? 'hoy' : '') + '"' + (antes ? ' disabled' : '') +
        ' aria-label="' + valor + (riegos.includes(valor) ? ', regada' : '') + '" aria-pressed="' + riegos.includes(valor) + '">' + dia.getDate() + '</button>';
    }
    return html + '</div>';
  }
  function grafica(alturas) {
    if (alturas.length < 2) return '<p class="pl-vacio">' + (alturas.length ? 'Anota otra medida para ver cómo crece.' : 'Aún no hay medidas. Mide tu planta y anótala aquí.') + '</p>';
    const numero = 300, numero2 = 120, numero3 = 28, numero4 = 22, numero5 = 10, numero6 = 10;
    const max = Math.max.apply(null, alturas.map(function (altura) { return altura.cm; })) || 1;
    const x = function (i) { return numero3 + (alturas.length === 1 ? 0 : i * (numero - numero3 - numero6) / (alturas.length - 1)); };
    const y = function (valor) { return numero5 + (numero2 - numero5 - numero4) * (1 - valor / max); };
    const pts = alturas.map(function (altura, i) { return x(i).toFixed(1) + ',' + y(altura.cm).toFixed(1); });
    return '<svg class="pl-grafica" viewBox="0 0 ' + numero + ' ' + numero2 + '" role="img" aria-label="Crecimiento en centímetros">' +
      '<line class="eje" x1="' + numero3 + '" y1="' + (numero2 - numero4) + '" x2="' + (numero - numero6) + '" y2="' + (numero2 - numero4) + '"/>' +
      '<text x="2" y="' + (numero5 + 8) + '">' + max + ' cm</text><text x="2" y="' + (numero2 - numero4) + '">0</text>' +
      '<polyline class="lin" points="' + pts.join(' ') + '"/>' +
      alturas.map(function (altura, i) { return '<circle class="pto" cx="' + x(i).toFixed(1) + '" cy="' + y(altura.cm).toFixed(1) + '" r="4.5"/>'; }).join('') +
      '<text x="' + numero3 + '" y="' + (numero2 - 6) + '">' + corta(alturas[0].f) + '</text><text x="' + (numero - numero6) + '" y="' + (numero2 - 6) + '" text-anchor="end">' + corta(alturas[alturas.length - 1].f) + '</text></svg>';
  }
  function tarjeta(obj, nota) {
    obj.riegos = Array.isArray(obj.riegos) ? obj.riegos.slice().sort() : [];
    obj.alturas = Array.isArray(obj.alturas) ? obj.alturas : [];
    obj.logros = obj.logros && typeof obj.logros === 'object' ? obj.logros : {};
    obj.freq = [1, 2, 3, 5, 7].includes(obj.freq) ? obj.freq : 3;
    obj.cuidados = obj.cuidados && typeof obj.cuidados === 'object' ? obj.cuidados : {};
    const diario = leeDiario();
    const valor = diasDe(obj);
    const idx = etapaDe(valor);
    const sig = ETAPAS[idx + 1];
    const ult = obj.riegos.length ? obj.riegos[obj.riegos.length - 1] : null;
    const hace = ult ? dias(ult, hoy()) : null;
    const regada = ult === hoy();
    const nivel = hace === null ? 0 : hace === 0 ? 3 : hace < obj.freq ? 2 : hace === obj.freq ? 1 : 0;
    const falta = hace === null ? null : obj.freq - hace;
    const estado = hace === null ? 'Aún sin riego' : ESTADOS[nivel];
    const texto = hace === null ? 'Anota tu primer riego' : falta > 1 ? 'Le toca en ' + falta + ' días' : falta === 1 ? 'Le toca mañana' : falta === 0 ? 'Le toca hoy' : 'Se pasó ' + (-falta) + (falta === -1 ? ' día' : ' días') + ' del riego';
    if (obj.etapa !== undefined && idx > obj.etapa) aviso('¡Tu planta pasó a ' + ETAPAS[idx][0] + '!');
    if (obj.etapa !== idx) { obj.etapa = idx; guarda(obj); }
    const ganadas = INSIGNIAS.filter(function (item) { return item[3](obj, diario); });
    const nuevas = ganadas.filter(function (ganada) { return !obj.logros[ganada[0]]; });
    if (nuevas.length) {
      nuevas.forEach(function (nueva) { obj.logros[nueva[0]] = hoy(); });
      guarda(obj);
      aviso('Insignia nueva: ' + nuevas[0][2]);
    }
    const ini = ETAPAS[idx][1];
    const pct = sig ? Math.max(0, Math.min(100, Math.round((valor - ini) / (sig[1] - ini) * 100))) : 100;
    const cHoy = obj.cuidados[hoy()] || [];
    const fraseBio = hace === null ? BIO[0] : regada ? BIO[4] : BIO[Math.min(3, nivel + 1)];
    const dato = DATOS[(Math.floor(Date.now() / 864e5) + idx) % DATOS.length];
    const camino = ETAPAS.map(function (item, i) { return '<li class="' + (i < idx ? 'hecha' : i === idx ? 'actual' : '') + '"><b aria-hidden="true"></b><div><strong>' + item[0] + '</strong><span>' + (i <= idx ? 'Desde el ' : 'Aprox. el ') + sumaDias(obj.siembra, item[1]).split('-').reverse().slice(0, 2).join('/') + ' · día ' + (item[1] + 1) + '</span></div></li>'; }).join('');
    const ultAlt = obj.alturas.length ? obj.alturas[obj.alturas.length - 1] : null;
    const crecio = obj.alturas.length > 1 ? (ultAlt.cm - obj.alturas[0].cm).toFixed(1).replace(/\.0$/, '') : null;
    vista.innerHTML =
      '<div class="planta-card"><div class="pl-top">' + dibujo(idx) + '<div><span class="num">' + ETAPAS[idx][0] + '</span><div class="planta-dia">Día ' + (valor + 1) + '</div><p>' + (obj.nombre ? esc(obj.nombre) + ' | ' : '') + 'sembrada el ' + obj.siembra.split('-').reverse().join('/') + ' <button type="button" class="pl-editar" id="bNombre">' + (obj.nombre ? 'Cambiar nombre' : 'Ponerle nombre') + '</button></p>' +
      '<form class="pl-nombre" id="fNombre" hidden><input id="pNom" maxlength="24" value="' + esc(obj.nombre || '') + '" placeholder="Nombre de tu planta" aria-label="Nombre de tu planta"><button class="pl-mini" type="submit">Guardar</button></form></div></div>' +
      '<div class="pl-bio"><img src="/assets/img/bio-saluda.webp" alt="" width="40" height="84"><p><b>Bio</b>' + fraseBio + '</p></div>' +
      '<div class="pl-meta"><span>' + (sig ? 'Para ' + sig[0] : 'Ya es planta') + '</span><div class="pl-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div><b>' + pct + '%</b></div>' +
      '<div class="etapas" aria-hidden="true">' + ETAPAS.map(function (_, i) { return '<i class="' + (i <= idx ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="etapas-nom" aria-hidden="true">' + ETAPAS.map(function (item) { return '<span>' + item[0] + '</span>'; }).join('') + '</div>' +
      '<div class="sed' + (nivel < 2 ? ' baja' : '') + '"><div class="gotas" aria-hidden="true">' + [1, 2, 3].map(function (item) { return '<i class="' + (nivel >= item ? 'on' : '') + '"></i>'; }).join('') + '</div><p><strong>' + estado + '</strong><br>' + texto + '</p></div>' +
      '<div class="planta-grid"><div><strong>' + obj.riegos.length + '</strong><span>Riegos</span></div><div><strong>' + racha(obj.riegos) + '</strong><span>Días seguidos</span></div><div><strong>' + (sig ? sig[1] - valor + ' d' : 'Lista') + '</strong><span>' + (sig ? 'Para ' + sig[0] : 'Ya es planta') + '</span></div>' +
      '<div><strong>' + (ultAlt ? ultAlt.cm + ' cm' : '—') + '</strong><span>' + (crecio !== null ? 'Creció ' + crecio + ' cm' : 'Altura') + '</span></div>' +
      '<div><strong>' + mejorRacha(obj.riegos) + '</strong><span>Mejor racha</span></div><div><strong>' + diasCompletos(obj) + '</strong><span>Días de cuidados</span></div></div>' +
      '<h3>Ahora toca</h3><ul class="tips">' + TIPS[idx].map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
      '<div class="pl-dato"><b>¿Sabías que?</b><p>' + dato + '</p></div>' +
      '<div class="planta-acciones" style="margin-top:20px"><button class="btn btn-primary" id="bRiego"' + (regada ? ' disabled' : '') + '>' + (regada ? 'Ya la regaste hoy' : 'La regué hoy') + '</button><button class="btn btn-outline" id="bShare">Compartir</button></div></div>' +
      '<div class="planta-card"><div class="pl-fila"><h3 style="margin:0">Cuidados de hoy</h3><span class="pl-cuenta">' + cHoy.length + '/' + CUIDADOS.length + '</span></div>' +
      '<p class="sub" style="margin-top:8px">Marca lo que ya hiciste hoy. Si completas los tres ganas puntos.</p><div class="pl-cuidados" id="plCuid">' +
      CUIDADOS.map(function (item) { return '<button type="button" data-c="' + item[0] + '" class="' + (cHoy.includes(item[0]) ? 'on' : '') + '" aria-pressed="' + cHoy.includes(item[0]) + '"><span aria-hidden="true">' + ico(item[1], 26) + '</span>' + item[2] + '</button>'; }).join('') + '</div></div>' +
      '<div class="planta-card"><h3>Su camino</h3><ol class="pl-camino">' + camino + '</ol></div>' +
      '<div class="planta-card"><div class="pl-fila"><h3 style="margin:0">Calendario de riegos</h3>' +
      '<label class="pl-fila" style="gap:8px;font-size:.88rem">Regar cada <select id="pFreq" aria-label="Cada cuántos días regar">' + [1, 2, 3, 5, 7].map(function (item) { return '<option value="' + item + '"' + (item === obj.freq ? ' selected' : '') + '>' + item + (item === 1 ? ' día' : ' días') + '</option>'; }).join('') + '</select></label></div>' +
      '<p class="sub" style="margin-top:8px">Toca un día para marcarlo o quitarlo si se te pasó anotarlo.</p>' + calendario(obj.riegos, obj.siembra) + '</div>' +
      '<div class="planta-card"><h3>Crecimiento</h3><div class="pl-fila"><input class="pl-campo" id="pAlt" type="number" inputmode="decimal" min="0" max="500" step="0.1" placeholder="Altura en cm" aria-label="Altura en centímetros" style="flex:1;min-height:0;width:auto"><button class="pl-mini" id="bAlt" type="button">Anotar</button></div>' + grafica(obj.alturas) + '</div>' +
      '<div class="planta-card"><h3>Diario de tu planta</h3><textarea class="pl-campo" id="dNota" maxlength="200" placeholder="¿Qué notaste hoy? (hojas nuevas, plagas, clima…)" aria-label="Nota del diario"></textarea>' +
      '<img class="pl-foto-prev" id="dPrev" alt="Vista previa de la foto">' +
      '<div class="pl-fila" style="margin-top:10px"><label class="pl-mini claro" style="cursor:pointer">' + ico('camara', 16) + ' Foto<input id="dFoto" type="file" accept="image/*" hidden></label><button class="pl-mini" id="bNota" type="button">Guardar entrada</button></div>' +
      '<ul class="diario-lista" id="dLista">' + diario.map(function (item, i) { return '<li class="' + (item.img ? '' : 'sin-foto') + '">' + (item.img ? '<img src="' + item.img + '" alt="Foto del ' + esc(item.f) + '">' : '') + '<div><time>' + item.f.split('-').reverse().join('/') + '</time><p>' + (item.t ? esc(item.t) : '<i>Solo foto</i>') + '</p></div><button type="button" data-i="' + i + '" aria-label="Borrar entrada">✕</button></li>'; }).join('') + '</ul>' +
      (diario.length ? '' : '<p class="pl-vacio">Todavía no hay entradas. Guarda notas y fotos para ver cómo cambia.</p>') + '</div>' +
      '<div class="planta-card"><h3>Recordatorios</h3><p class="sub" style="margin-top:-4px">' + (!window.BioNotis || !BioNotis.soporta() ? 'Tu navegador no admite avisos.' : BioNotis.activo() ? 'Activados: te avisamos cuando le toca riego y si tu racha está por romperse.' : 'Te avisamos cuando le toca riego y si tu racha está por romperse.') + '</p>' + (window.BioNotis && BioNotis.soporta() ? '<button class="pl-mini' + (BioNotis.activo() ? ' claro' : '') + '" id="bNoti" type="button">' + (BioNotis.activo() ? 'Apagar avisos' : 'Activar avisos') + '</button>' : '') + '</div>' +
      '<div class="planta-card"><h3>Insignias <span style="font-weight:500;color:var(--texto-tenue)">' + ganadas.length + '/' + INSIGNIAS.length + '</span></h3><div class="insignias">' +
      INSIGNIAS.map(function (item) { return '<div class="insignia' + (ganadas.includes(item) ? ' on' : '') + '"><b aria-hidden="true">' + ico(item[1], 28) + '</b><span>' + item[2] + '</span></div>'; }).join('') + '</div>' +
      '<div class="planta-acciones" style="margin-top:18px"><button class="btn btn-outline" id="bReset">Eliminar esta planta</button></div></div>';
    armaPestanas();
    enlazar(obj, diario, idx, valor);
    if (regando) {
      regando = false;
      const top = vista.querySelector('.pl-top');
      if (top && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        top.classList.add('riega');
        for (let numero = 0; numero < 7; numero++) { const i = document.createElement('i'); i.className = 'pl-gota'; i.style.setProperty('--x', (14 + numero * 12) + '%'); i.style.animationDelay = (numero * 0.09) + 's'; top.appendChild(i); }
        setTimeout(function () { top.classList.remove('riega'); top.querySelectorAll('.pl-gota').forEach(function (i) { return i.remove(); }); }, 1700);
      }
    }
  }
  function enlazar(obj, diario, idx, numero) {
    const bn = elem('bNoti');
    if (bn) bn.addEventListener('click', async function () { if (BioNotis.activo()) BioNotis.desactivar(); else await BioNotis.pedir(); pintar(); });
    elem('bRiego').addEventListener('click', function () {
      const valor = hoy();
      if (!obj.riegos.includes(valor)) obj.riegos.push(valor);
      guarda(obj);
      regando = true;
      if (window.BioPuntos) BioPuntos.dar(5, 'Riego anotado'); else aviso('Riego anotado');
      pintar();
      if (window.BioNotis && BioNotis.soporta() && !BioNotis.preguntado() && Notification.permission === 'default') setTimeout(function () { return BioNotis.pedir().then(pintar); }, 900);
    });
    vista.querySelector('.cal').addEventListener('click', function (ev) {
      const elem2 = ev.target.closest('button[data-f]');
      if (!elem2 || elem2.disabled) return;
      const valor = elem2.dataset.f;
      obj.riegos = obj.riegos.includes(valor) ? obj.riegos.filter(function (riego) { return riego !== valor; }) : obj.riegos.concat(valor).sort();
      guarda(obj);
      if (navigator.vibrate) navigator.vibrate(10);
      pintar();
    });
    elem('plCuid').addEventListener('click', function (ev) {
      const elem2 = ev.target.closest('button[data-c]');
      if (!elem2) return;
      const valor = hoy();
      const act = (obj.cuidados[valor] || []).slice();
      const i = act.indexOf(elem2.dataset.c);
      if (i >= 0) act.splice(i, 1); else act.push(elem2.dataset.c);
      obj.cuidados[valor] = act;
      const claves = Object.keys(obj.cuidados).sort().slice(-45);
      const limpio = {}; claves.forEach(function (k) { limpio[k] = obj.cuidados[k]; });
      obj.cuidados = limpio;
      obj.cuidadosPts = Array.isArray(obj.cuidadosPts) ? obj.cuidadosPts : [];
      const completo = act.length >= CUIDADOS.length;
      if (completo && !obj.cuidadosPts.includes(valor)) {
        obj.cuidadosPts = obj.cuidadosPts.concat(valor).slice(-45);
        guarda(obj);
        if (window.BioPuntos) BioPuntos.dar(3, 'Cuidados del día'); else aviso('¡Cuidados completos!');
      } else guarda(obj);
      if (navigator.vibrate) navigator.vibrate(10);
      pintar();
    });
    elem('bNombre').addEventListener('click', function () { const valor = elem('fNombre'); valor.hidden = !valor.hidden; if (!valor.hidden) elem('pNom').focus(); });
    elem('fNombre').addEventListener('submit', function (ev) {
      ev.preventDefault();
      obj.nombre = elem('pNom').value.trim();
      guarda(obj);
      aviso(obj.nombre ? 'Ahora se llama ' + obj.nombre : 'Nombre quitado');
      pintar();
    });
    elem('pFreq').addEventListener('change', function (ev) { obj.freq = +ev.target.value; guarda(obj); pintar(); aviso('Te aviso cada ' + obj.freq + (obj.freq === 1 ? ' día' : ' días')); });
    elem('bAlt').addEventListener('click', function () {
      const numero2 = Math.round(parseFloat(elem('pAlt').value) * 10) / 10;
      if (!(numero2 >= 0 && numero2 <= 500)) { aviso('Pon una altura en centímetros'); return; }
      const valor = hoy();
      obj.alturas = obj.alturas.filter(function (altura) { return altura.f !== valor; }).concat({ f: valor, cm: numero2 }).sort(function (a, b) { return a.f < b.f ? -1 : 1; }).slice(-30);
      guarda(obj);
      aviso('Medida anotada');
      pintar();
    });
    let foto = null;
    elem('dFoto').addEventListener('change', async function (ev) {
      const valor = ev.target.files && ev.target.files[0];
      if (!valor) return;
      try {
        foto = await BioImg.comprimir(valor, 560, 0.6);
        const valor2 = elem('dPrev');
        valor2.src = foto; valor2.classList.add('ver');
      } catch (err) { foto = null; aviso('No pude leer esa foto'); }
    });
    elem('bNota').addEventListener('click', function () {
      const texto = elem('dNota').value.trim();
      if (!texto && !foto) { aviso('Escribe una nota o agrega una foto'); return; }
      const lista = diario.slice();
      lista.unshift({ id: BioPlantas.nuevaEntradaId(), f: hoy(), t: texto, img: foto || null, creado: Date.now() });
      let conFoto = 0;
      lista.forEach(function (item) { if (item.img && ++conFoto > MAX_FOTOS) item.img = null; });
      if (!guardaDiario(lista.slice(0, 60))) { aviso('No hay espacio para guardar esa entrada'); return; }
      aviso('Entrada guardada');
      pintar();
    });
    elem('dLista').addEventListener('click', function (ev) {
      const elem2 = ev.target.closest('button[data-i]');
      if (!elem2) return;
      const lista = diario.slice();
      lista.splice(+elem2.dataset.i, 1);
      guardaDiario(lista);
      pintar();
    });
    elem('bShare').addEventListener('click', async function () {
      const txt = 'Mi planta' + (obj.nombre ? ' «' + obj.nombre + '»' : '') + ' va en el día ' + (numero + 1) + ' (' + ETAPAS[idx][0] + ') con ' + obj.riegos.length + ' riegos. Nació de una bolsa BioNyssa.';
      try {
        if (navigator.share) await navigator.share({ text: txt, url: location.origin + '/paginas/comunidad.html' });
        else { await navigator.clipboard.writeText(txt); aviso('Texto copiado, pégalo en la comunidad'); }
      } catch (err) {}
    });
    const reset = elem('bReset');
    reset.addEventListener('click', function () {
      if (!reset.dataset.ok) {
        reset.dataset.ok = '1';
        reset.textContent = '¿Seguro? Toca otra vez';
        setTimeout(function () { reset.dataset.ok = ''; reset.textContent = 'Eliminar esta planta'; }, 3000);
        return;
      }
      plantas = plantas.filter(function (planta) { return planta.id !== obj.id; });
      guarda();
      BioPlantas.quitarDiario(obj.id);
      actual = plantas.length ? plantas[0].id : null;
      recuerda();
      aviso('Planta eliminada');
      pintar();
    });
  }
  function pintar() {
    plantas = BioPlantas.todas();
    if (!plantas.some(function (planta) { return planta.id === actual; })) {
      let guardada = null;
      try { guardada = sessionStorage.getItem('bio_planta_actual'); } catch (err) {}
      actual = plantas.some(function (planta) { return planta.id === guardada; }) ? guardada : (plantas[0] ? plantas[0].id : null);
    }
    if (!plantas.length) agregando = false;
    selector();
    const valor = lee();
    if (valor && !agregando) tarjeta(valor); else formulario();
  }
  pintar();
  // Si la nube trae plantas de otro dispositivo, se muestran sin recargar a mano
  document.addEventListener('bio-nube-listo', function () { if (BioPlantas.todas().length !== plantas.length) pintar(); });
})();
 } catch (err) { console.error(err); }
}

// admin
if (['admin'].indexOf(paginaActual) > -1) {
 try {
(function () {
  var cuerpo = document.getElementById('admCuerpo'), sub = document.getElementById('admSub');
  function el(etiqueta, clase, texto) { var elem = document.createElement(etiqueta); if (clase) elem.className = clase; if (texto != null) elem.textContent = texto; return elem; }
  function msg(html) { cuerpo.innerHTML = ''; var caja = el('div', 'adm-msg'); caja.innerHTML = html; cuerpo.appendChild(caja); }
  function fecha(ms) {
    if (!ms) return '—';
    return new Date(ms).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function hace(ms) {
    if (!ms) return '';
    var numero = Math.round((Date.now() - ms) / 60000);
    if (numero < 1) return 'ahora';
    if (numero < 60) return 'hace ' + numero + ' min';
    var numero2 = Math.round(numero / 60); if (numero2 < 24) return 'hace ' + numero2 + ' h';
    var numero3 = Math.round(numero2 / 24); return 'hace ' + numero3 + (numero3 === 1 ? ' día' : ' días');
  }
  function pintar(lista) {
    var ahora = Date.now(), DIA = 86400000;
    var hoy = lista.filter(function (item) { return ahora - item.ultimoAcceso < DIA; }).length;
    var sem = lista.filter(function (item) { return ahora - item.ultimoAcceso < 7 * DIA; }).length;
    cuerpo.innerHTML = '';
    var nums = el('div', 'adm-nums');
    [[lista.length, 'personas registradas'], [hoy, 'entraron en 24 h'], [sem, 'entraron en 7 días']].forEach(function (item) {
      var caja2 = el('div', 'adm-num'); caja2.appendChild(el('b', '', item[0])); caja2.appendChild(el('span', '', item[1])); nums.appendChild(caja2);
    });
    cuerpo.appendChild(nums);
    var campo = el('input', 'adm-buscar'); campo.type = 'search'; campo.placeholder = 'Buscar por nombre o correo'; campo.setAttribute('aria-label', 'Buscar');
    cuerpo.appendChild(campo);
    var caja = el('div', 'adm-lista'); cuerpo.appendChild(caja);
    function filas() {
      var texto = campo.value.trim().toLowerCase(); caja.innerHTML = '';
      var vis = lista.filter(function (item) { return !texto || (item.nombre + ' ' + item.correo).toLowerCase().indexOf(texto) > -1; });
      if (!vis.length) { caja.appendChild(el('div', 'adm-msg', 'Nadie coincide con esa búsqueda.')); return; }
      vis.forEach(function (item) {
        var caja2 = el('div', 'adm-fila');
        caja2.appendChild(el('div', 'adm-av', (item.nombre || '?').trim().charAt(0).toUpperCase()));
        var caja3 = el('div'); caja3.appendChild(el('div', 'adm-n', item.nombre || 'Sin nombre')); caja3.appendChild(el('div', 'adm-c', item.correo || 'Sin correo')); caja2.appendChild(caja3);
        var caja4 = el('div', 'adm-d'); caja4.appendChild(el('b', '', 'Último acceso: ' + hace(item.ultimoAcceso)));
        caja4.appendChild(document.createTextNode(fecha(item.ultimoAcceso) + ' · ' + (item.accesos || 1) + (item.accesos === 1 ? ' visita' : ' visitas')));
        if (item.creado) { var caja5 = el('div', '', 'Se registró: ' + fecha(item.creado)); caja4.appendChild(caja5); }
        caja2.appendChild(caja4); caja.appendChild(caja2);
      });
    }
    campo.addEventListener('input', filas); filas();
    sub.textContent = 'Solo visible para el administrador. Se actualiza cada vez que abres esta página.';
  }
  if (!BioFirebase.configurado()) { msg('Firebase no está configurado.'); return; }
  BioFirebase.nucleo().then(function (resultado) {
    return resultado.auth.authStateReady().then(function () {
      var valor = resultado.auth.currentUser;
      if (!valor) { msg('Inicia sesión con la cuenta de administrador para ver esto. <a href="/paginas/login.html">Iniciar sesión</a>'); return; }
      var sinPermiso = 'Esta cuenta no tiene permiso para ver esta página.';
      if (!valor.emailVerified) { msg(sinPermiso); return; }
      return resultado.ff.getDoc(resultado.ff.doc(resultado.db, 'admins', valor.uid)).then(function (adm) {
        if (!adm.exists()) { msg(sinPermiso); return; }
        return resultado.ff.getDocs(resultado.ff.collection(resultado.db, 'accesos')).then(function (resultado2) {
        var lista = [];
        resultado2.forEach(function (item) { var valor2 = item.data(); valor2.ultimoAcceso = Number(valor2.ultimoAcceso) || 0; lista.push(valor2); });
        lista.sort(function (a, b) { return b.ultimoAcceso - a.ultimoAcceso; });
        if (!lista.length) { msg('Todavía no hay accesos registrados. Aparecerán aquí cuando las personas vuelvan a entrar a la página.'); return; }
        pintar(lista);
        });
      });
    });
  }).catch(function (ev) {
    msg(ev && ev.code === 'permission-denied'
      ? 'Firebase no te dio permiso. Publica las reglas nuevas (<code>firebase deploy --only firestore:rules</code>) y entra con una cuenta de administrador con correo verificado.'
      : 'No se pudo cargar la lista. Revisa tu conexión e inténtalo de nuevo.');
  });
})();
 } catch (err) { console.error(err); }
}

// comunidad
if (['comunidad'].indexOf(paginaActual) > -1) {
 try {
window.BioHilo = (function () {
  const suscriptores = [];
  const abiertos = new Set();
  let posts = [];
  let porUid = {};
  let porClave = {};
  let cargada = false;
  let errorNube = null;
  function cargar() {
    return posts;
  }
  function notificar() {
    suscriptores.forEach(function (fn) {
      try { fn(posts); } catch (err) {}
    });
  }
  function suscribir(fn) {
    suscriptores.push(fn);
  }
  function miUid() {
    return window.BioNube ? BioNube.uid() : null;
  }
  function esMioFn(post) {
    const ses = window.BioSesion ? BioSesion.obtener() : null;
    if (!ses) return false;
    const uid = miUid();
    if (post.uid && uid) return post.uid === uid;
    return post.usuario === ses.usuario;
  }
  function miPerfil() {
    const ses = window.BioSesion ? BioSesion.obtener() : null;
    if (!ses) return {};
    const uid = miUid();
    return (uid && porUid[uid]) || porClave[ses.usuario] || {};
  }
  function textoError(ev) {
    const valor = ev && ev.code;
    if (valor === 'bio/sin-nube' || valor === 'bio/sin-sesion') return 'No se pudo conectar tu cuenta con la nube. Cierra sesión, entra otra vez y vuelve a intentar.';
    if (valor === 'permission-denied') return 'Firebase no dejó guardar eso. Revisa que las reglas de Firestore estén publicadas.';
    if (valor === 'unavailable' || valor === 'failed-precondition') return 'No hay conexión con Firebase. Inténtalo de nuevo en un momento.';
    if (valor === 'bio/foto-grande') return 'La foto pesa demasiado. Elige otra o una más pequeña.';
    if (valor === 'bio/vacia') return 'Escribe algo o agrega una foto para publicar.';
    return 'No se pudo guardar. Inténtalo de nuevo.' + (valor ? ' (' + valor + ')' : '');
  }
  function avisarError(elemento) {
    if (window.BioModera) BioModera.aviso(textoError(elemento));
    else if (window.BioToast) BioToast(textoError(elemento));
  }
  if (window.BioNube) {
    BioNube.comunidad(function (elemento) {
      posts = elemento.posts;
      porUid = elemento.porUid;
      porClave = elemento.porClave;
      cargada = elemento.cargada;
      errorNube = elemento.error;
      notificar();
    });
  } else {
    cargada = true;
  }
  document.addEventListener('bio-nube-listo', notificar);
  function esInvitado() {
    return window.BioComun ? BioComun.esInvitado() : !BioSesion.obtener();
  }
  function pedirCuenta(mensaje) {
    if (window.BioComun) {
      BioComun.mostrarModalAuth(mensaje);
    } else if (window.BioToast) {
      BioToast(mensaje);
    }
  }
  function formatoTiempo(ts) {
    const min = Math.round((Date.now() - ts) / 60000);
    if (min < 1) return 'ahora mismo';
    if (min < 60) return 'hace ' + min + ' min';
    const horas = Math.round(min / 60);
    if (horas < 24) return 'hace ' + horas + ' h';
    const dias = Math.round(horas / 24);
    return 'hace ' + dias + ' d';
  }
  function conEtiquetas(html) {
    return html.replace(/(^|[^\p{L}\p{N}_&])(#[\p{L}\p{N}_]+)/gu, '$1<a href="#" class="tag-inline" data-tag="$2">$2</a>');
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
  function cargarPerfiles() {
    return porClave;
  }
  function fotoSegura(archivo) {
    return typeof archivo === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(archivo) ? archivo : '';
  }
  function resolver(clave, nombreOriginal, uid) {
    const k = clave || (window.BioComun ? BioComun.usuarioDesdeNombre(nombreOriginal) : '@usuario');
    const valor = (uid && porUid[uid]) || porClave[k] || {};
    const nombre = valor.nombreCom || valor.nombre || nombreOriginal || 'Invitado';
    return { clave: k, nombre: nombre, handle: valor.usuarioCom || valor.clave || k, foto: fotoSegura(valor.foto), inicial: (nombre.trim()[0] || 'I').toUpperCase() };
  }
  function pintarAvatar(el, texto) {
    if (!el) return;
    el.className = el.className.replace(/\b(av-\d+|has-photo)\b/g, '').replace(/\s+/g, ' ').trim();
    el.classList.add(window.BioComun ? BioComun.colorAvatar(texto.clave) : 'av-1');
    if (texto.foto) {
      el.classList.add('has-photo');
      el.textContent = '';
      el.style.backgroundImage = 'url("' + texto.foto + '")';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Foto de ' + texto.nombre);
    } else {
      el.style.backgroundImage = '';
      el.textContent = texto.inicial;
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
  }
  const KG = 'bionyssa_guardadas';
  function leerG() { try { const datos = JSON.parse(localStorage.getItem(KG)); return Array.isArray(datos) ? datos : []; } catch (err) { return []; } }
  function escribirG(datos) { try { localStorage.setItem(KG, JSON.stringify(datos)); } catch (err) {} }
  function crearPost(post) {
    const el = document.createElement('article');
    el.className = 'post';
    const resultado = resolver(post.usuario, post.nombre, post.uid);
    const bloqueado = esInvitado();
    const sesionAct = window.BioSesion ? BioSesion.obtener() : null;
    const miId = miUid();
    const esMio = esMioFn(post);
    post.likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const meGusta = function () { return !!miId && post.likedBy.indexOf(miId) !== -1; };
    el.innerHTML = `
      <div class="post-head">
        <span class="post-avatar"></span>
        <div class="post-quien">
          <div class="post-name-row">
            <span class="post-name">${escapeHtml(resultado.nombre)}</span>
            <span class="post-handle">${escapeHtml(resultado.handle)}</span>
          </div>
          <div class="post-time">${formatoTiempo(post.creado)} · Pública</div>
        </div>
        <button type="button" class="action-btn danger btn-borrar" aria-label="Borrar publicación"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4.1 7.3c5 .3 10.8.2 15.7-.1"/><path d="M9.2 6.9c0-1.3.2-2.4.6-3h4.6c.4.6.5 1.7.5 3"/><path d="M6.3 7.7c.2 4.2.5 8.4 1 12.1 3.2.3 6.3.3 9.4 0 .5-3.7.8-7.9 1-12.1"/><path d="M10.2 10.9v5.5M13.8 10.8v5.6"/></g></svg></button>
      </div>
      ${post.texto ? `<p class="post-text">${conEtiquetas(escapeHtml(post.texto))}</p>` : ''}
      ${fotoSegura(post.foto) ? `<div class="post-photo"><img src="${fotoSegura(post.foto)}" alt="Foto de la publicación" loading="lazy"></div>` : ''}
      <div class="post-stats">
        <span class="stat-likes" hidden><span class="stat-ico">♥</span><span class="num-likes">${post.likes}</span></span>
        <button type="button" class="stat-com" hidden></button>
      </div>
      <div class="post-actions">
        <button type="button" class="action-btn btn-like ${meGusta() ? 'liked' : ''} ${bloqueado ? 'locked' : ''}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12.2 19.9C7.5 16.3 4.2 13.4 4.1 9.8c-.1-2.4 1.6-4.3 4-4.3 1.6 0 3 .9 3.9 2.5.9-1.6 2.4-2.6 4.1-2.5 2.3.1 3.9 2 3.8 4.4-.2 3.5-3.5 6.4-7.7 10z"/></g></svg><span>Me gusta</span></button>
        <button type="button" class="action-btn btn-mostrar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4.4 5.7c4.9-.6 10.3-.5 15.2 0 .6 5.2.5 7.6 0 10.6-2.6.2-4.4.1-6.3.3L9 20l.2-3.7c-1.6 0-3.2-.1-4.8-.3-.5-3.5-.5-6.7 0-10.3z"/></g></svg><span>Comentar</span></button>
        <button type="button" class="action-btn btn-compartir"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></g></svg><span>Compartir</span></button>
      </div>
      <div class="comments">
        <div class="lista-comentarios"></div>
        <div class="comment-form">
          <span class="post-avatar mini yo"></span>
          <input type="text" placeholder="Escribe un comentario..." maxlength="300">
          <button type="button" aria-label="Enviar comentario"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><g stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.7c5.3-2.3 11-4.6 16.1-6.7-1.9 5.2-4.3 11-6.6 16-1.2-2.4-2-4.3-3.1-6.4-2.2-.8-4.2-1.8-6.4-2.9z"/><path d="M10.5 13.6c1.4-1.4 2.7-2.7 4-4"/></g></svg></button>
        </div>
      </div>
    `;
    pintarAvatar(el.querySelector('.post-avatar'), resultado);
    pintarAvatar(el.querySelector('.comment-form .yo'), sesionAct ? resolver(sesionAct.usuario, sesionAct.nombre, miId) : resolver(null, 'Invitado'));
    function pintarStats() {
      const sl = el.querySelector('.stat-likes'), sc = el.querySelector('.stat-com'), cantidad = post.comentarios.length;
      sl.hidden = !(post.likes > 0);
      sc.hidden = !cantidad;
      sc.textContent = cantidad + (cantidad === 1 ? ' comentario' : ' comentarios');
    }
    pintarStats();
    const bm = document.createElement('button');
    bm.type = 'button';
    bm.className = 'action-btn btn-guardar' + (leerG().indexOf(post.id) > -1 ? ' on' : '');
    bm.setAttribute('aria-label', 'Guardar publicación');
    bm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7.1 4.6c3.2-.4 6.6-.4 9.8 0 .3 5 .3 10.2 0 15.1-2.5-2.2-5-2.2-7.4 0-.6-5.2-.6-10.1-.4-15.1z"/></g></svg>';
    bm.addEventListener('click', function () {
      const valor = leerG(), i = valor.indexOf(post.id);
      if (i > -1) valor.splice(i, 1); else valor.push(post.id);
      escribirG(valor);
      bm.classList.toggle('on', i === -1);
      document.dispatchEvent(new Event('bio:guardadas'));
    });
    el.querySelector('.post-actions').appendChild(bm);
    const txtPost = el.querySelector('.post-text');
    if (txtPost && (post.texto || '').length > 280) {
      txtPost.classList.add('recortado');
      const mas = document.createElement('button');
      mas.type = 'button';
      mas.className = 'ver-mas';
      mas.textContent = 'Ver más';
      mas.addEventListener('click', function () { const cerrado = txtPost.classList.toggle('recortado'); mas.textContent = cerrado ? 'Ver más' : 'Ver menos'; });
      txtPost.after(mas);
    }
    const fotoPost = el.querySelector('.post-photo');
    if (fotoPost) {
      fotoPost.addEventListener('dblclick', function () {
        const elem = el.querySelector('.btn-like');
        if (!elem.classList.contains('liked')) elem.click();
        fotoPost.classList.remove('late'); void fotoPost.offsetWidth; fotoPost.classList.add('late');
      });
    }
    el.querySelector('.stat-com').addEventListener('click', function () { return el.querySelector('.btn-mostrar').click(); });
    el.querySelector('.btn-compartir').addEventListener('click', async function (ev) {
      const etiqueta = ev.currentTarget.querySelector('span');
      const datos = { title: 'BioNyssa', text: (post.texto || 'Mira esta publicación en BioNyssa').slice(0, 120), url: location.origin + location.pathname };
      try {
        if (navigator.share) await navigator.share(datos);
        else { await navigator.clipboard.writeText(datos.text + ' ' + datos.url); etiqueta.textContent = 'Enlace copiado'; setTimeout(function () { etiqueta.textContent = 'Compartir'; }, 1800); }
      } catch (err) {}
    });
    const comentariosBox = el.querySelector('.comments');
    const listaComentarios = el.querySelector('.lista-comentarios');
    function pintarComentarios() {
      listaComentarios.innerHTML = '';
      post.comentarios.forEach(function (comentario, idx) {
        const texto = typeof comentario === 'string' ? comentario : comentario.t;
        const puedeBorrar = esMio || (typeof comentario !== 'string' && !!sesionAct && (comentario.uid ? comentario.uid === miId : comentario.u === sesionAct.usuario));
        const fila = document.createElement('div');
        fila.className = 'comment';
        const rc = typeof comentario === 'string' ? resolver(null, 'Invitado') : resolver(comentario.u, String(comentario.u || '').replace(/^@/, ''), comentario.uid);
        fila.innerHTML = `<span class="post-avatar mini"></span><div class="comment-bubble"><b>${escapeHtml(rc.nombre)}</b><span>${escapeHtml(texto)}</span></div>` + (puedeBorrar ? '<button aria-label="Borrar comentario">✕</button>' : '');
        pintarAvatar(fila.querySelector('.post-avatar'), rc);
        if (puedeBorrar) {
          fila.querySelector('button').addEventListener('click', function () {
            const quitado = post.comentarios.splice(idx, 1)[0];
            pintarComentarios();
            actualizarContador();
            if (quitado && quitado.id) {
              BioNube.borrarComentario(post.id, quitado.id).catch(function (err) {
                post.comentarios.splice(idx, 0, quitado);
                pintarComentarios();
                actualizarContador();
                avisarError(err);
              });
            }
          });
        }
        listaComentarios.appendChild(fila);
      });
    }
    function actualizarContador() {
      pintarStats();
    }
    el.querySelector('.btn-like').addEventListener('click', function () {
      if (esInvitado()) {
        pedirCuenta('Para dar like necesitas cuenta. Créala o inicia sesión.');
        return;
      }
      const pos = miId ? post.likedBy.indexOf(miId) : -1;
      const dar = pos === -1;
      if (miId) {
        if (dar) { post.likedBy.push(miId); post.likes = (post.likes || 0) + 1; }
        else { post.likedBy.splice(pos, 1); post.likes = Math.max(0, (post.likes || 0) - 1); }
      }
      el.querySelector('.btn-like').classList.toggle('liked', dar);
      const num = el.querySelector('.num-likes');
      if (miId) num.textContent = post.likes;
      pintarStats();
      num.classList.remove('sube');
      void num.offsetWidth;
      num.classList.add('sube');
      BioNube.meGusta(post.id, dar).catch(function (err) {
        el.querySelector('.btn-like').classList.toggle('liked', !dar);
        if (miId) {
          if (dar) { post.likedBy.splice(post.likedBy.indexOf(miId), 1); post.likes = Math.max(0, post.likes - 1); }
          else { post.likedBy.push(miId); post.likes += 1; }
          num.textContent = post.likes;
          pintarStats();
        }
        avisarError(err);
      });
    });
    if (abiertos.has(post.id)) comentariosBox.classList.add('show');
    el.querySelector('.btn-mostrar').addEventListener('click', function () {
      comentariosBox.classList.toggle('show');
      if (comentariosBox.classList.contains('show')) abiertos.add(post.id); else abiertos.delete(post.id);
    });
    const btnBorrar = el.querySelector('.btn-borrar');
    if (!esMio) btnBorrar.remove();
    btnBorrar.addEventListener('click', function () {
      if (el.classList.contains('sale')) return;
      if (!btnBorrar.classList.contains('seguro')) {
        btnBorrar.classList.add('seguro');
        setTimeout(function () { return btnBorrar.classList.remove('seguro'); }, 3200);
        return;
      }
      el.classList.add('sale');
      setTimeout(function () {
        BioNube.borrarPublicacion(post.id).catch(function (err) {
          el.classList.remove('sale');
          avisarError(err);
        });
      }, 280);
    });
    const inputComentario = el.querySelector('.comment-form input');
    const botonComentario = el.querySelector('.comment-form button');
    function enviarComentario() {
      if (esInvitado()) {
        pedirCuenta('Para comentar necesitas cuenta. Créala o inicia sesión.');
        return;
      }
      const valor = inputComentario.value.trim();
      if (!valor) return;
      const rev = BioModera.revisarTexto(valor, 'texto');
      if (!rev.ok) { BioModera.aviso(rev.motivo); return; }
      inputComentario.value = '';
      comentariosBox.classList.add('show');
      abiertos.add(post.id);
      BioNube.comentar(post.id, valor).catch(function (err) {
        inputComentario.value = valor;
        avisarError(err);
      });
    }
    botonComentario.addEventListener('click', enviarComentario);
    inputComentario.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') enviarComentario();
    });
    pintarComentarios();
    return el;
  }
  return {
    cargar,
    notificar,
    suscribir,
    miUid,
    esMio: esMioFn,
    miPerfil,
    avisarError,
    get cargada() { return cargada; },
    get errorNube() { return errorNube; },
    esInvitado,
    pedirCuenta,
    formatoTiempo,
    escapeHtml,
    crearPost,
    cargarPerfiles,
    resolver,
    pintarAvatar,
    guardadas: leerG,
  };
})();
(function () {
  const feed = document.getElementById('feed');
  if (!feed) return;
  const txt = document.getElementById('txtPublicacion');
  const btnFoto = document.getElementById('btnFoto');
  const inputFoto = document.getElementById('inputFoto');
  const previewWrap = document.getElementById('previewWrap');
  const previewImg = document.getElementById('previewImg');
  const quitarFoto = document.getElementById('quitarFoto');
  const btnPublicar = document.getElementById('btnPublicar');
  const vacio = document.getElementById('vacio');
  const barraFeed = document.getElementById('feedBarra');
  const recientes = document.getElementById('recientes');
  const avisoF = document.getElementById('filtroAviso');
  const textoVacio = vacio.querySelector('p').textContent;
  let modo = 'nuevas';
  let autor = null;
  let firmaAnt = '';
  let fotoSeleccionada = null;
  function pintarComposer() {
    const sesion = BioSesion.obtener();
    const resultado = sesion
      ? BioHilo.resolver(sesion.usuario, sesion.nombre, BioHilo.miUid())
      : { clave: '@invitado', nombre: 'Invitado', handle: '@invitado', foto: '', inicial: 'I' };
    BioHilo.pintarAvatar(document.getElementById('composerAvatar'), resultado);
    BioHilo.pintarAvatar(document.getElementById('sideAvatar'), resultado);
    [['composerNombre', resultado.nombre], ['composerUsuario', resultado.handle], ['sideNombre', resultado.nombre], ['sideUsuario', resultado.handle]]
      .forEach(function ([id, txt]) { const elem = document.getElementById(id); if (elem) elem.textContent = txt; });
  }
  pintarComposer();
  document.addEventListener('bio-perfil', pintarComposer);
  BioHilo.suscribir(pintarComposer);
  const btnVerPerfil = document.getElementById('btnVerPerfil');
  if (btnVerPerfil) {
    btnVerPerfil.addEventListener('click', function () {
      const pestana = document.querySelector('.tab-btn[data-tab="perfil"]');
      if (pestana) pestana.click();
      window.scrollTo(0, 0);
    });
  }
  const bannerInvitado = document.getElementById('bannerInvitadoComunidad');
  if (bannerInvitado && BioHilo.esInvitado()) {
    bannerInvitado.style.display = 'flex';
    const botonBanner = document.getElementById('botonBannerInvitadoComunidad');
    if (botonBanner) {
      botonBanner.addEventListener('click', function () { window.location.href = '/paginas/registro.html'; });
    }
  }
  btnFoto.addEventListener('click', function () { return inputFoto.click(); });
  inputFoto.addEventListener('change', async function () {
    const archivo = inputFoto.files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { BioModera.aviso('Elige un archivo de imagen.'); inputFoto.value = ''; return; }
    let b64;
    try { b64 = await BioImg.comprimir(archivo, 1024, 0.8); }
    catch (err) { BioModera.aviso('No se pudo leer esa imagen.'); inputFoto.value = ''; return; }
    if (!(await BioModera.revisarImagen(b64))) { inputFoto.value = ''; return; }
    fotoSeleccionada = b64;
    previewImg.src = fotoSeleccionada;
    previewWrap.classList.add('show');
  });
  quitarFoto.addEventListener('click', function () {
    fotoSeleccionada = null;
    inputFoto.value = '';
    previewWrap.classList.remove('show');
  });
  btnPublicar.addEventListener('click', async function () {
    if (BioHilo.esInvitado()) {
      BioHilo.pedirCuenta('Para publicar necesitas cuenta. Créala o inicia sesión.');
      return;
    }
    const texto = txt.value.trim();
    if (!texto && !fotoSeleccionada) return;
    const rev = BioModera.revisarTexto(texto, 'texto');
    if (!rev.ok) { BioModera.aviso(rev.motivo); return; }
    let foto = fotoSeleccionada;
    btnPublicar.disabled = true;
    try {
      const pasos = [[800, 0.6], [640, 0.5], [480, 0.45], [360, 0.4]];
      for (let k = 0; foto && foto.length > 600000 && k < pasos.length; k++) {
        foto = await BioImg.comprimir(foto, pasos[k][0], pasos[k][1]);
      }
      await BioNube.publicar({ texto: texto, foto: foto });
    } catch (err) {
      btnPublicar.disabled = false;
      BioHilo.avisarError(err);
      return;
    }
    btnPublicar.disabled = false;
    txt.value = '';
    txt.dispatchEvent(new Event('input', { bubbles: true }));
    fotoSeleccionada = null;
    inputFoto.value = '';
    previewWrap.classList.remove('show');
    const alMuro = document.querySelector('.tab-btn[data-tab="publicaciones"]');
    if (alMuro) alMuro.click();
  });
  let pendiente = false;
  function escribiendo() {
    const valor = document.activeElement;
    return !!valor && valor.tagName === 'INPUT' && feed.contains(valor) && valor.value.length > 0;
  }
  feed.addEventListener('focusout', function () {
    if (pendiente) setTimeout(function () { if (!escribiendo()) render(); }, 0);
  });
  function pintarRecientes(posts) {
    const ya = new Set(), items = [];
    posts.slice().sort(function (x, y) { return y.creado - x.creado; }).forEach(function (item) {
      const id = item.uid || item.usuario;
      if (!id || ya.has(id) || items.length >= 12) return;
      ya.add(id);
      items.push(item);
    });
    recientes.innerHTML = '';
    items.forEach(function (item) {
      const id = item.uid || item.usuario;
      const resultado = BioHilo.resolver(item.usuario, item.nombre, item.uid);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'reciente' + (autor && autor.id === id ? ' on' : '');
      boton.innerHTML = '<span class="post-avatar"></span><span class="n"></span>';
      boton.querySelector('.n').textContent = resultado.nombre.split(' ')[0];
      BioHilo.pintarAvatar(boton.querySelector('.post-avatar'), resultado);
      boton.addEventListener('click', function () { autor = autor && autor.id === id ? null : { id: id, nombre: resultado.nombre }; render(); });
      recientes.appendChild(boton);
    });
  }
  function pintarAviso() {
    avisoF.hidden = !autor;
    if (!autor) return;
    avisoF.textContent = 'Viendo solo lo de ' + autor.nombre + '. ';
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Quitar filtro';
    boton.addEventListener('click', function () { autor = null; render(); });
    avisoF.appendChild(boton);
  }
  document.querySelectorAll('.filtro').forEach(function (item) {
    item.addEventListener('click', function () {
      modo = item.dataset.orden;
      document.querySelectorAll('.filtro').forEach(function (item2) { item2.classList.toggle('on', item2 === item); item2.setAttribute('aria-pressed', item2 === item ? 'true' : 'false'); });
      render();
    });
  });
  document.addEventListener('bio:guardadas', function () { if (modo === 'guardadas') render(); });
  function render() {
    if (escribiendo()) { pendiente = true; return; }
    pendiente = false;
    const posts = BioHilo.cargar();
    const ses = window.BioSesion ? BioSesion.obtener() : null;
    const firma = [modo, autor && autor.id, ses && (ses.usuario || ses.uid), BioHilo.guardadas().length,
      posts.map(function (post) { return post.id + ':' + post.likes + ':' + post.comentarios.length + ':' + (post.texto || '').length; }).join(',')].join('|');
    if (firma === firmaAnt && feed.children.length) return;
    firmaAnt = firma;
    feed.innerHTML = '';
    if (posts.length === 0) {
      barraFeed.hidden = true;
      if (!BioHilo.cargada) { vacio.style.display = 'none'; return; }
      vacio.style.display = 'block';
      if (BioHilo.errorNube) {
        const parrafo = vacio.querySelector('p');
        if (parrafo) parrafo.textContent = 'No se pudieron cargar las publicaciones. Revisa tu conexión y que las reglas de Firestore estén publicadas.';
      }
      return;
    }
    barraFeed.hidden = false;
    pintarRecientes(posts);
    pintarAviso();
    let lista = posts.slice();
    if (autor) lista = lista.filter(function (item) { return (item.uid || item.usuario) === autor.id; });
    if (modo === 'guardadas') { const gs = BioHilo.guardadas(); lista = lista.filter(function (item) { return gs.indexOf(item.id) > -1; }); }
    if (modo === 'populares') lista.sort(function (x, y) { return (y.likes + y.comentarios.length) - (x.likes + x.comentarios.length) || y.creado - x.creado; });
    const pv = vacio.querySelector('p');
    if (!lista.length) {
      pv.textContent = modo === 'guardadas' ? 'Todavía no guardas nada. Toca el marcador de una publicación y la verás aquí.' : 'Esa persona todavía no tiene publicaciones.';
      vacio.style.display = 'block';
      return;
    }
    pv.textContent = textoVacio;
    vacio.style.display = 'none';
    let orden = 0;
    lista.forEach(function (post) {
      const nodo = BioHilo.crearPost(post);
      if (!vistos.has(post.id)) {
        vistos.add(post.id);
        nodo.style.setProperty('--i', Math.min(orden++, 7));
        nodo.classList.add('entra');
      }
      feed.appendChild(nodo);
    });
  }
  const vistos = new Set();
  BioHilo.suscribir(render);
  const irCrear = document.getElementById('irCrear');
  if (irCrear) irCrear.addEventListener('click', function () { return document.querySelector('.tab-btn[data-tab="crear"]').click(); });
  render();
})();
(function () {
  const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));
  if (!tabBtns.length) return;
  const barra = document.querySelector('.tabbar');
  const indicador = document.createElement('span');
  indicador.className = 'tab-ind';
  barra.appendChild(indicador);
  let tabActual = 'publicaciones';
  function moverIndicador() {
    const valor = tabBtns.find(function (tabBtn) { return tabBtn.classList.contains('active'); });
    if (!valor) return;
    indicador.style.width = valor.offsetWidth + 'px';
    indicador.style.transform = 'translateX(' + valor.offsetLeft + 'px)';
  }
  window.addEventListener('resize', moverIndicador);
  window.addEventListener('load', moverIndicador);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);
  function activarTab(nombre) {
    const orden = tabBtns.map(function (tabBtn) { return tabBtn.dataset.tab; });
    const dir = orden.indexOf(nombre) >= orden.indexOf(tabActual) ? 'der' : 'izq';
    tabActual = nombre;
    panels.forEach(function (panel) { panel.dataset.dir = dir; });
    tabBtns.forEach(function (tabBtn) {
      const activo = tabBtn.dataset.tab === nombre;
      tabBtn.classList.toggle('active', activo);
      tabBtn.setAttribute('aria-selected', activo ? 'true' : 'false');
    });
    panels.forEach(function (panel) { panel.hidden = panel.dataset.panel !== nombre; });
    moverIndicador();
    if (nombre === 'buscar') renderBuscar();
    if (nombre === 'perfil') renderPerfil();
    if (nombre === 'crear' && window.BioModera) BioModera.precargar();
    if (nombre === 'crear') setTimeout(function () { const elem = document.getElementById('txtPublicacion'); if (elem) elem.focus({ preventScroll: true }); }, 60);
  }
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { return activarTab(btn.dataset.tab); });
  });
  function renderNumeros() {
    const numPub = document.getElementById('numPublicacionesTotal');
    const numPer = document.getElementById('numPersonasTotal');
    if (!numPub || !numPer) return;
    const posts = BioHilo.cargar();
    const personas = new Set(posts.map(function (post) { return post.usuario; }));
    contar(numPub, posts.length);
    contar(numPer, personas.size);
    const ses = BioSesion.obtener();
    const mios = ses && ses.usuario ? posts.filter(function (post) { return BioHilo.esMio(post); }) : [];
    const mp = document.getElementById('miPubs'), ml = document.getElementById('miLikes');
    if (mp) mp.textContent = mios.length;
    if (ml) ml.textContent = mios.reduce(function (acumulado, elemento) { return acumulado + (elemento.likes || 0); }, 0);
    const lista = document.getElementById('tagsTop');
    if (lista) {
      const cuenta = {};
      posts.forEach(function (post) {
        (String(post.texto || '').match(/#[\p{L}\p{N}_]+/gu) || []).forEach(function (item) {
          const k = item.toLowerCase();
          cuenta[k] = (cuenta[k] || 0) + 1;
        });
      });
      const top = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 4);
      lista.innerHTML = top.length
        ? top.map(function (item) { return '<li><button type="button" data-tag="' + item.replace(/[<>&"]/g, '') + '"><span class="tag-nombre">' + item.replace(/</g, '&lt;') + '</span><span class="tag-num">' + cuenta[item] + (cuenta[item] === 1 ? ' publicación' : ' publicaciones') + '</span></button></li>'; }).join('')
        : '<li class="lista-vacia">Aún no hay etiquetas. Escribe la tuya con # en tu próxima publicación.</li>';
    }
  }
  function contar(el, hasta) {
    const desde = parseInt(el.textContent, 10) || 0;
    if (desde === hasta || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      el.textContent = hasta;
      return;
    }
    const inicio = performance.now();
    const dur = 700;
    function paso(numero) {
      const k = Math.min((numero - inicio) / dur, 1);
      const numero2 = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(desde + (hasta - desde) * numero2);
      if (k < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  const inputBuscar = document.getElementById('inputBuscar');
  const resultadosBuscar = document.getElementById('resultadosBuscar');
  const personasBuscar = document.getElementById('personasBuscar');
  const buscarVacio = document.getElementById('buscarVacio');
  function renderBuscar() {
    if (!inputBuscar) return;
    const texto2 = inputBuscar.value.trim().toLowerCase();
    resultadosBuscar.innerHTML = '';
    personasBuscar.innerHTML = '';
    personasBuscar.style.display = 'none';
    if (!texto2) {
      buscarVacio.style.display = 'block';
      buscarVacio.querySelector('p').textContent = 'Escribe algo para buscar: un texto, un nombre o un usuario.';
      return;
    }
    const posts = BioHilo.cargar();
    const personasEncontradas = new Map();
    posts.forEach(function (post) {
      const rp = BioHilo.resolver(post.usuario, post.nombre, post.uid);
      const handle = rp.handle.toLowerCase();
      const nombre = rp.nombre.toLowerCase();
      if ((handle.includes(texto2) || nombre.includes(texto2)) && !personasEncontradas.has(handle)) {
        personasEncontradas.set(handle, post);
      }
    });
    if (personasEncontradas.size) {
      personasBuscar.style.display = 'flex';
      personasEncontradas.forEach(function (personasEncontrada) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'people-chip';
        const rp = BioHilo.resolver(personasEncontrada.usuario, personasEncontrada.nombre, personasEncontrada.uid);
        chip.innerHTML = `<span class="post-avatar"></span><span>${BioHilo.escapeHtml(rp.nombre)}</span>`;
        BioHilo.pintarAvatar(chip.querySelector('.post-avatar'), rp);
        chip.addEventListener('click', function () {
          inputBuscar.value = BioHilo.resolver(personasEncontrada.usuario, personasEncontrada.nombre, personasEncontrada.uid).handle;
          renderBuscar();
        });
        personasBuscar.appendChild(chip);
      });
    }
    const coincidencias = posts.filter(function (post) {
      const texto = (post.texto || '').toLowerCase();
      const rp = BioHilo.resolver(post.usuario, post.nombre, post.uid);
      const handle = rp.handle.toLowerCase();
      const nombre = rp.nombre.toLowerCase();
      return texto.includes(texto2) || handle.includes(texto2) || nombre.includes(texto2);
    });
    if (!coincidencias.length) {
      buscarVacio.style.display = 'block';
      buscarVacio.querySelector('p').textContent = 'No salió nada con "' + texto2 + '". Prueba con otra palabra.';
      return;
    }
    buscarVacio.style.display = 'none';
    coincidencias.forEach(function (coincidencia) { return resultadosBuscar.appendChild(BioHilo.crearPost(coincidencia)); });
  }
  if (inputBuscar) {
    inputBuscar.addEventListener('input', renderBuscar);
  }
  const perfilBloqueado = document.getElementById('perfilBloqueado');
  const perfilContenido = document.getElementById('perfilContenido');
  const bioView = document.getElementById('perfilBioView');
  const bioEdit = document.getElementById('perfilBioEdit');
  const bioTexto = document.getElementById('perfilBioTexto');
  const bioInput = document.getElementById('perfilBioInput');
  const btnEditarBio = document.getElementById('btnEditarBio');
  const btnGuardarBio = document.getElementById('btnGuardarBio');
  const btnCancelarBio = document.getElementById('btnCancelarBio');
  const editNombre = document.getElementById('editNombre');
  const editUsuario = document.getElementById('editUsuario');
  const editError = document.getElementById('editError');
  const inputFotoPerfil = document.getElementById('inputFotoPerfil');
  const btnCambiarFoto = document.getElementById('btnCambiarFoto');
  const btnQuitarFotoPerfil = document.getElementById('btnQuitarFotoPerfil');
  let fotoPendiente;
  function previsualizar() {
    const sesion = BioSesion.obtener();
    if (!sesion) return;
    const guardada = BioHilo.resolver(sesion.usuario, sesion.nombre, BioHilo.miUid());
    const foto = fotoPendiente === undefined ? guardada.foto : (fotoPendiente || '');
    const nombre = editNombre.value.trim() || sesion.nombre;
    BioHilo.pintarAvatar(document.getElementById('editAvatar'),
      { clave: sesion.usuario, nombre: nombre, foto: foto, inicial: (nombre[0] || 'I').toUpperCase() });
    btnQuitarFotoPerfil.style.display = foto ? '' : 'none';
  }
  function renderPerfil() {
    if (!perfilContenido) return;
    const sesion = BioSesion.obtener();
    if (!sesion) {
      perfilBloqueado.style.display = 'block';
      perfilContenido.style.display = 'none';
      return;
    }
    perfilBloqueado.style.display = 'none';
    perfilContenido.style.display = 'block';
    const handle = sesion.usuario;
    const posts = BioHilo.cargar().filter(function (item) { return BioHilo.esMio(item); });
    const meGusta = posts.reduce(function (acumulado, elemento) { return acumulado + (elemento.likes || 0); }, 0);
    const comentarios = posts.reduce(function (acumulado, elemento) { return acumulado + (elemento.comentarios ? elemento.comentarios.length : 0); }, 0);
    const resultado = BioHilo.resolver(handle, sesion.nombre, BioHilo.miUid());
    BioHilo.pintarAvatar(document.getElementById('perfilAvatar'), resultado);
    document.getElementById('perfilNombre').textContent = resultado.nombre;
    document.getElementById('perfilUsuario').textContent = resultado.handle;
    document.getElementById('statPublicaciones').textContent = posts.length;
    document.getElementById('statMeGusta').textContent = meGusta;
    document.getElementById('statComentarios').textContent = comentarios;
    const bio = BioHilo.miPerfil().bio || '';
    bioTexto.textContent = bio || 'Añade una breve descripción sobre ti y tu forma de reciclar.';
    bioTexto.classList.toggle('is-placeholder', !bio);
    const listaPosts = document.getElementById('perfilPosts');
    const perfilPostsVacio = document.getElementById('perfilPostsVacio');
    listaPosts.innerHTML = '';
    if (!posts.length) {
      perfilPostsVacio.style.display = 'block';
    } else {
      perfilPostsVacio.style.display = 'none';
      posts.forEach(function (post) { return listaPosts.appendChild(BioHilo.crearPost(post)); });
    }
  }
  if (btnEditarBio) {
    btnEditarBio.addEventListener('click', function () {
      const sesion = BioSesion.obtener();
      if (!sesion) return;
      const pf = BioHilo.miPerfil();
      bioInput.value = pf.bio || '';
      editNombre.value = pf.nombreCom || sesion.nombre;
      editUsuario.value = (pf.usuarioCom || sesion.usuario).replace(/^@/, '');
      fotoPendiente = undefined;
      editError.textContent = '';
      previsualizar();
      bioView.style.display = 'none';
      bioEdit.style.display = 'flex';
      bioInput.focus();
    });
    btnCancelarBio.addEventListener('click', function () {
      bioEdit.style.display = 'none';
      bioView.style.display = 'flex';
    });
    btnGuardarBio.addEventListener('click', async function () {
      const sesion = BioSesion.obtener();
      if (!sesion) return;
      const clave = sesion.usuario;
      const nombre = editNombre.value.trim().replace(/\s+/g, ' ');
      const usuario = editUsuario.value.trim().replace(/^@/, '').toLowerCase();
      if (nombre.length < 2) { editError.textContent = 'El nombre debe tener al menos 2 caracteres.'; return; }
      if (!/^[a-z0-9._]{3,20}$/.test(usuario)) {
        editError.textContent = 'El usuario debe tener de 3 a 20 caracteres: letras, números, punto o guion bajo.';
        return;
      }
      const revNombre = BioModera.revisarTexto(nombre, 'nombre');
      if (!revNombre.ok) { editError.textContent = revNombre.motivo; return; }
      if (!BioModera.revisarTexto(usuario, 'nombre').ok) { editError.textContent = 'Ese usuario contiene palabras no permitidas. Elige uno respetuoso.'; return; }
      const revBio = BioModera.revisarTexto(bioInput.value, 'texto');
      if (!revBio.ok) { editError.textContent = 'Tu descripción contiene lenguaje inapropiado.'; return; }
      const handle = '@' + usuario;
      const actual = BioHilo.miPerfil();
      const claveNube = actual.clave || clave;
      const cambios = {
        bio: bioInput.value.trim().slice(0, 160),
        nombreCom: nombre !== sesion.nombre ? nombre : '',
        usuarioCom: handle !== claveNube ? handle : ''
      };
      if (fotoPendiente !== undefined) cambios.foto = fotoPendiente;
      btnGuardarBio.disabled = true;
      editError.textContent = '';
      try {
        await BioNube.guardarPerfil(cambios);
      } catch (err) {
        btnGuardarBio.disabled = false;
        if (err && err.code === 'bio/usuario-ocupado') editError.textContent = 'Ese usuario ya está en uso. Prueba con otro.';
        else if (err && err.code === 'invalid-argument') editError.textContent = 'La foto es demasiado pesada. Prueba con otra.';
        else editError.textContent = 'No se pudo guardar tu perfil. Revisa tu conexión e inténtalo otra vez.';
        return;
      }
      btnGuardarBio.disabled = false;
      bioEdit.style.display = 'none';
      bioView.style.display = 'flex';
      document.dispatchEvent(new Event('bio-perfil'));
      BioHilo.notificar();
    });
    btnCambiarFoto.addEventListener('click', function () { return inputFotoPerfil.click(); });
    btnQuitarFotoPerfil.addEventListener('click', function () { fotoPendiente = null; inputFotoPerfil.value = ''; previsualizar(); });
    [editNombre, editUsuario].forEach(function (i) { return i.addEventListener('input', previsualizar); });
    inputFotoPerfil.addEventListener('change', function () {
      const archivo = inputFotoPerfil.files[0];
      if (!archivo) return;
      if (!archivo.type.startsWith('image/')) { editError.textContent = 'Elige un archivo de imagen.'; return; }
      BioImg.cuadrada(archivo, 256, 0.85).then(async function (b64) {
        if (!(await BioModera.revisarImagen(b64))) { inputFotoPerfil.value = ''; return; }
        fotoPendiente = b64;
        editError.textContent = '';
        previsualizar();
      }).catch(function () { editError.textContent = 'No se pudo leer esa imagen.'; });
    });
  }
  BioHilo.suscribir(function () {
    renderNumeros();
    const panelBuscar = document.querySelector('[data-panel="buscar"]');
    const panelPerfil = document.querySelector('[data-panel="perfil"]');
    if (panelBuscar && !panelBuscar.hidden) renderBuscar();
    if (panelPerfil && !panelPerfil.hidden) renderPerfil();
  });
  const listaTags = document.getElementById('tagsTop');
  if (listaTags) listaTags.addEventListener('click', function (ev) {
    const elem = ev.target.closest('button[data-tag]');
    if (elem) window.dispatchEvent(new CustomEvent('bio-filtrar', { detail: elem.dataset.tag }));
  });
  document.addEventListener('click', function (ev) {
    const elem = ev.target.closest('.tag-inline');
    if (!elem) return;
    ev.preventDefault();
    window.dispatchEvent(new CustomEvent('bio-filtrar', { detail: elem.dataset.tag.toLowerCase() }));
  });
  renderNumeros();
})();
(function () {
  const elem = document.getElementById('txtPublicacion');
  const elem2 = document.getElementById('contadorPub');
  if (!elem || !elem2) return;
  function actualizar() {
    const cantidad = elem.value.length;
    elem2.textContent = cantidad + ' / 1000';
    elem2.classList.toggle('casi', cantidad >= 240);
  }
  elem.addEventListener('input', actualizar);
  BioHilo.suscribir(actualizar);
  const publicar = document.getElementById('btnPublicar');
  if (publicar) publicar.addEventListener('click', function () { return setTimeout(actualizar, 0); });
  actualizar();
})();
(function () {
  var elem = function (estado, resultado) { return (resultado || document).querySelector(estado); };
  var ta = elem('#txtPublicacion'), comp = elem('.composer'), feed = elem('#feed');
  if (!ta || !comp || !feed) return;
  var BASE = ['#brotó', '#antesydespués', '#duda', '#truco'];
  var KT = 'bionyssa_etiquetas', MAX_PROPIAS = 6;
  function leerPropias() { try { var datos = JSON.parse(localStorage.getItem(KT)); return Array.isArray(datos) ? datos : []; } catch (err) { return []; } }
  function guardarPropias(datos) { try { localStorage.setItem(KT, JSON.stringify(datos)); } catch (err) {} }
  function limpiar(texto) {
    texto = String(texto || '').trim().replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '').slice(0, 20);
    return texto ? '#' + texto.toLowerCase() : '';
  }
  function esc(texto) { return texto.replace(/[<>&"]/g, ''); }
  var cr = document.createElement('div'); cr.className = 'chips-rapidos';
  ta.parentNode.insertBefore(cr, ta.nextSibling);
  function pintaChips() {
    var propias = leerPropias();
    cr.innerHTML = BASE.map(function (item) { return '<button type="button" data-t="' + esc(item) + '">' + esc(item) + '</button>'; }).join('') +
      propias.map(function (propia) { return '<span class="chip-propio"><button type="button" data-t="' + esc(propia) + '">' + esc(propia) + '</button><button type="button" class="chip-x" data-quitar="' + esc(propia) + '" aria-label="Quitar ' + esc(propia) + '">×</button></span>'; }).join('') +
      (propias.length < MAX_PROPIAS ? '<button type="button" class="chip-mas" data-mas="1">+ Tu etiqueta</button>' : '');
  }
  pintaChips();
  function meter(lista) {
    if (!lista || ta.value.toLowerCase().indexOf(lista) >= 0 || ta.value.length + lista.length + 2 > 1000) return;
    ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + lista + ' ';
    ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
  }
  function nueva() {
    var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'chip-input'; inp.maxLength = 21; inp.placeholder = '#etiqueta'; inp.setAttribute('aria-label', 'Escribe tu etiqueta');
    var mas = elem('.chip-mas', cr); if (!mas) return; mas.replaceWith(inp); inp.focus();
    var listo = false;
    function fin(ok) {
      if (listo) return; listo = true;
      var texto = ok ? limpiar(inp.value) : '';
      if (texto) {
        var valor = leerPropias();
        if (valor.indexOf(texto) < 0 && BASE.indexOf(texto) < 0) { valor.push(texto); guardarPropias(valor); }
      }
      pintaChips(); if (texto) meter(texto);
    }
    inp.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === ',') { ev.preventDefault(); fin(true); }
      if (ev.key === 'Escape') fin(false);
    });
    inp.addEventListener('blur', function () { fin(true); });
  }
  cr.addEventListener('click', function (ev) {
    var elem2 = ev.target.closest('[data-quitar]');
    if (elem2) { guardarPropias(leerPropias().filter(function (item) { return item !== elem2.dataset.quitar; })); pintaChips(); return; }
    if (ev.target.closest('[data-mas]')) { nueva(); return; }
    var elem3 = ev.target.closest('button[data-t]'); if (elem3) meter(elem3.dataset.t);
  });
  ta.addEventListener('keydown', function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); elem('#btnPublicar').click(); } });
  var fil = document.createElement('div'); fil.className = 'filtros'; fil.setAttribute('role', 'group'); fil.setAttribute('aria-label', 'Filtrar publicaciones');
  var nota = document.createElement('p'); nota.className = 'filtro-nota'; nota.style.display = 'none';
  feed.parentNode.insertBefore(fil, feed); feed.parentNode.insertBefore(nota, feed.nextSibling);
  var filtro = '';
  function tagsDe(el) { return (el.textContent.match(/#[\p{L}\p{N}_]+/gu) || []).map(function (item) { return item.toLowerCase(); }); }
  function aplicar() {
    var ps = feed.querySelectorAll('.post'), cuenta = {};
    ps.forEach(function (item) { tagsDe(elem('.post-text', item) || item).forEach(function (item2) { cuenta[item2] = (cuenta[item2] || 0) + 1; }); });
    var claves = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 8);
    if (filtro && claves.indexOf(filtro) < 0) claves.push(filtro);
    var vis = 0;
    ps.forEach(function (item) {
      var ok = !filtro || tagsDe(elem('.post-text', item) || item).indexOf(filtro) >= 0;
      item.style.display = ok ? '' : 'none'; if (ok) vis++;
    });
    fil.innerHTML = claves.length ? '<button type="button" class="' + (filtro ? '' : 'on') + '" data-f="">Todo</button>' + claves.map(function (clave) { return '<button type="button" class="' + (clave === filtro ? 'on' : '') + '" data-f="' + esc(clave) + '">' + esc(clave) + '</button>'; }).join('') : '';
    fil.style.display = claves.length ? '' : 'none';
    nota.textContent = 'Nadie ha usado ' + filtro + ' todavía.';
    nota.style.display = filtro && ps.length && !vis ? '' : 'none';
  }
  fil.addEventListener('click', function (ev) { var elem2 = ev.target.closest('button'); if (!elem2) return; filtro = elem2.dataset.f; aplicar(); });
  window.addEventListener('bio-filtrar', function (ev) { filtro = (filtro === ev.detail) ? '' : ev.detail; aplicar(); feed.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  new MutationObserver(aplicar).observe(feed, { childList: true }); aplicar();
})();
 } catch (err) { console.error(err); }
}
