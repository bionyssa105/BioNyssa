(() => {
  const $ = (id) => document.getElementById(id);
  const main = document.querySelector('.planta-layout');
  if (main && !(typeof BioSesion !== 'undefined' && BioSesion.obtener())) {
    main.outerHTML = '<div class="planta-bloqueo" style="max-width:440px;margin:24px auto;text-align:center;padding:36px 24px;border:1px solid var(--line);border-radius:16px;background:var(--card)">' +
      '<h2 style="margin:0 0 8px;font-size:1.3rem">Necesitas una cuenta</h2>' +
      '<p style="margin:0 0 22px;color:var(--ink-soft)">Mi planta guarda tu siembra, tus riegos y tu avance. Crea tu cuenta o inicia sesión para usarla.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a href="/paginas/registro.html" class="btn btn-primary" style="width:auto">Crear cuenta</a><a href="/paginas/login.html" class="btn btn-outline" style="width:auto">Iniciar sesión</a></div></div>';
    return;
  }

  const LLAVE = 'bionyssa_planta';
  const LLAVE_DIARIO = 'bionyssa_planta_diario';
  const MAX_FOTOS = 8;
  const vista = $('plantaVista');
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
  const ico = (nombre, tam) => '<svg width="' + (tam || 24) + '" height="' + (tam || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + '</svg>';

  const INSIGNIAS = [
    ['r1', 'gota', 'Primer riego', (d) => d.riegos.length >= 1],
    ['r10', 'lluvia', '10 riegos', (d) => d.riegos.length >= 10],
    ['k3', 'fuego', '3 días seguidos', (d) => mejorRacha(d.riegos) >= 3],
    ['k7', 'rayo', '7 días seguidos', (d) => mejorRacha(d.riegos) >= 7],
    ['alt', 'regla', 'Primera medida', (d) => (d.alturas || []).length >= 1],
    ['foto', 'camara', 'Primera foto', (d, di) => di.some((x) => x.img)],
    ['brote', 'brote', 'Llegó al brote', (d) => diasDe(d) >= 21],
    ['planta', 'planta', 'Ya es planta', (d) => diasDe(d) >= 45],
    ['nom', 'etiqueta', 'Le pusiste nombre', (d) => !!d.nombre],
    ['diar3', 'libreta', '3 entradas', (d, di) => di.length >= 3],
    ['med5', 'grafica', '5 medidas', (d) => (d.alturas || []).length >= 5],
    ['r30', 'ola', '30 riegos', (d) => d.riegos.length >= 30],
    ['k14', 'trofeo', '14 días seguidos', (d) => mejorRacha(d.riegos) >= 14],
    ['cuid', 'pala', 'Cuidador', (d) => diasCompletos(d) >= 5]
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

  const leeJ = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? def : v; } catch (e) { return def; } };
  const lee = () => { const d = leeJ(LLAVE, null); return d && typeof d === 'object' ? d : null; };
  const guarda = (d) => { try { localStorage.setItem(LLAVE, JSON.stringify(d)); return true; } catch (e) { return false; } };
  const leeDiario = () => { const x = leeJ(LLAVE_DIARIO, []); return Array.isArray(x) ? x : []; };
  const guardaDiario = (a) => { try { localStorage.setItem(LLAVE_DIARIO, JSON.stringify(a)); return true; } catch (e) { return false; } };
  const fecha = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const hoy = () => fecha(new Date());
  const dias = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);
  const corta = (f) => f.split('-').reverse().slice(0, 2).join('/');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const aviso = (t) => { if (window.BioToast) BioToast(t); };
  const diasDe = (d) => Math.max(0, dias(d.siembra, hoy()));
  const etapaDe = (n) => { let i = 0; ETAPAS.forEach((e, k) => { if (n >= e[1]) i = k; }); return i; };

  function mejorRacha(riegos) {
    const o = riegos.slice().sort();
    let mejor = 0, n = 0, prev = null;
    o.forEach((f) => { n = prev && dias(prev, f) === 1 ? n + 1 : 1; prev = f; if (n > mejor) mejor = n; });
    return mejor;
  }
  function diasCompletos(d) {
    const c = d.cuidados || {};
    return Object.keys(c).filter((k) => Array.isArray(c[k]) && c[k].length >= CUIDADOS.length).length;
  }
  const sumaDias = (f, n) => { const x = new Date(f + 'T00:00'); x.setDate(x.getDate() + n); return fecha(x); };
  function racha(riegos) {
    let n = 0;
    const dia = new Date();
    if (!riegos.includes(fecha(dia))) dia.setDate(dia.getDate() - 1);
    while (riegos.includes(fecha(dia))) { n++; dia.setDate(dia.getDate() - 1); }
    return n;
  }

  const hojas = (y, s) => '<g transform="translate(60 ' + y + ') scale(' + s + ')"><path class="pl-hoja" d="M0 0c-14 0-22-8-22-18 12 0 22 6 22 18z"/><path class="pl-hoja" d="M0-4c14 0 22-8 22-18-12 0-22 6-22 18z"/></g>';
  function dibujo(i) {
    let s = '<svg viewBox="0 0 120 120" class="pl-dib" aria-hidden="true"><ellipse cx="60" cy="104" rx="46" ry="9" class="pl-suelo"/>';
    if (i === 0) s += '<ellipse cx="60" cy="99" rx="8" ry="5" class="pl-semilla"/>';
    else if (i === 1) s += '<ellipse cx="60" cy="99" rx="7" ry="4.5" class="pl-semilla"/><path class="pl-tallo" d="M60 95c0-6 3-9 6-11"/>';
    else if (i === 2) s += '<path class="pl-tallo" d="M60 100V64"/>' + hojas(70, 1);
    else s += '<path class="pl-tallo" d="M60 100V38"/>' + hojas(80, 1.1) + hojas(58, 0.9) + '<circle cx="60" cy="34" r="6" class="pl-flor"/>';
    return s + '</svg>';
  }

  const PESTANAS = [['resumen', 'Resumen', [0]], ['cuidados', 'Cuidados', [1, 2]], ['calendario', 'Calendario', [3, 4]], ['diario', 'Diario', [5, 6]], ['insignias', 'Insignias', [7]]];
  let pestanaActiva = 'resumen'; // se recuerda mientras no recargues la página

  function muestraPestana(id) {
    vista.querySelectorAll('.pl-pestanas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.p === id)));
    vista.querySelectorAll('.pl-panel').forEach((pn) => {
      const activo = pn.dataset.p === id;
      pn.classList.toggle('activo', activo);
      if (activo) pn.querySelectorAll('.rv').forEach((t) => t.classList.add('visto'));
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
    PESTANAS.forEach(([id, nombre, posiciones]) => {
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
      posiciones.forEach((i) => panel.appendChild(tarjetas[i]));
      vista.appendChild(panel);
    });
    barra.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-p]');
      if (!b) return;
      pestanaActiva = b.dataset.p;
      muestraPestana(pestanaActiva);
    });
    muestraPestana(pestanaActiva);
  }

  function formulario() {
    vista.innerHTML = '<div class="planta-card"><div class="pl-top">' + dibujo(0) + '<div><h2>Registra tu siembra</h2><p>Ponle nombre a tu planta y dinos cuándo enterraste la bolsa.</p></div></div>' +
      '<form class="planta-form" id="fPlanta"><input id="pNombre" maxlength="24" placeholder="Nombre (opcional)" aria-label="Nombre de la planta"><input id="pFecha" type="date" max="' + hoy() + '" value="' + hoy() + '" required aria-label="Fecha de siembra"><button class="btn btn-primary" type="submit">Empezar seguimiento</button></form></div>';
    $('fPlanta').addEventListener('submit', (e) => {
      e.preventDefault();
      guarda({ nombre: $('pNombre').value.trim(), siembra: $('pFecha').value || hoy(), riegos: [], freq: 3, alturas: [], logros: {}, cuidados: {} });
      pintar();
      aviso('Seguimiento iniciado');
    });
  }

  function calendario(riegos, siembra) {
    const base = new Date();
    base.setDate(base.getDate() - 27);
    const hueco = (base.getDay() + 6) % 7;
    let html = '<div class="cal-sem" aria-hidden="true">' + SEMANA.map((x) => '<span>' + x + '</span>').join('') + '</div><div class="cal">';
    for (let k = 0; k < hueco; k++) html += '<span></span>';
    for (let k = 27; k >= 0; k--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - k);
      const f = fecha(dia);
      const antes = f < siembra;
      html += '<button type="button" data-f="' + f + '" class="' + (riegos.includes(f) ? 'on ' : '') + (k === 0 ? 'hoy' : '') + '"' + (antes ? ' disabled' : '') +
        ' aria-label="' + f + (riegos.includes(f) ? ', regada' : '') + '" aria-pressed="' + riegos.includes(f) + '">' + dia.getDate() + '</button>';
    }
    return html + '</div>';
  }

  function grafica(alturas) {
    if (alturas.length < 2) return '<p class="pl-vacio">' + (alturas.length ? 'Anota otra medida para ver cómo crece.' : 'Aún no hay medidas. Mide tu planta y anótala aquí.') + '</p>';
    const W = 300, H = 120, L = 28, B = 22, T = 10, R = 10;
    const max = Math.max.apply(null, alturas.map((a) => a.cm)) || 1;
    const x = (i) => L + (alturas.length === 1 ? 0 : i * (W - L - R) / (alturas.length - 1));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const pts = alturas.map((a, i) => x(i).toFixed(1) + ',' + y(a.cm).toFixed(1));
    return '<svg class="pl-grafica" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Crecimiento en centímetros">' +
      '<line class="eje" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '"/>' +
      '<text x="2" y="' + (T + 8) + '">' + max + ' cm</text><text x="2" y="' + (H - B) + '">0</text>' +
      '<polyline class="lin" points="' + pts.join(' ') + '"/>' +
      alturas.map((a, i) => '<circle class="pto" cx="' + x(i).toFixed(1) + '" cy="' + y(a.cm).toFixed(1) + '" r="4.5"/>').join('') +
      '<text x="' + L + '" y="' + (H - 6) + '">' + corta(alturas[0].f) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + corta(alturas[alturas.length - 1].f) + '</text></svg>';
  }

  function tarjeta(d, nota) {
    d.riegos = Array.isArray(d.riegos) ? d.riegos.slice().sort() : [];
    d.alturas = Array.isArray(d.alturas) ? d.alturas : [];
    d.logros = d.logros && typeof d.logros === 'object' ? d.logros : {};
    d.freq = [1, 2, 3, 5, 7].includes(d.freq) ? d.freq : 3;
    d.cuidados = d.cuidados && typeof d.cuidados === 'object' ? d.cuidados : {};
    const diario = leeDiario();

    const n = diasDe(d);
    const idx = etapaDe(n);
    const sig = ETAPAS[idx + 1];
    const ult = d.riegos.length ? d.riegos[d.riegos.length - 1] : null;
    const hace = ult ? dias(ult, hoy()) : null;
    const regada = ult === hoy();
    const nivel = hace === null ? 0 : hace === 0 ? 3 : hace < d.freq ? 2 : hace === d.freq ? 1 : 0;
    const falta = hace === null ? null : d.freq - hace;
    const estado = hace === null ? 'Aún sin riego' : ESTADOS[nivel];
    const texto = hace === null ? 'Anota tu primer riego' : falta > 1 ? 'Le toca en ' + falta + ' días' : falta === 1 ? 'Le toca mañana' : falta === 0 ? 'Le toca hoy' : 'Se pasó ' + (-falta) + (falta === -1 ? ' día' : ' días') + ' del riego';

    if (d.etapa !== undefined && idx > d.etapa) aviso('¡Tu planta pasó a ' + ETAPAS[idx][0] + '!');
    if (d.etapa !== idx) { d.etapa = idx; guarda(d); }

    const ganadas = INSIGNIAS.filter((b) => b[3](d, diario));
    const nuevas = ganadas.filter((b) => !d.logros[b[0]]);
    if (nuevas.length) {
      nuevas.forEach((b) => { d.logros[b[0]] = hoy(); });
      guarda(d);
      aviso('Insignia nueva: ' + nuevas[0][2]);
    }

    const ini = ETAPAS[idx][1];
    const pct = sig ? Math.max(0, Math.min(100, Math.round((n - ini) / (sig[1] - ini) * 100))) : 100;
    const cHoy = d.cuidados[hoy()] || [];
    const fraseBio = hace === null ? BIO[0] : regada ? BIO[4] : BIO[Math.min(3, nivel + 1)];
    const dato = DATOS[(Math.floor(Date.now() / 864e5) + idx) % DATOS.length];
    const camino = ETAPAS.map((e, i) => '<li class="' + (i < idx ? 'hecha' : i === idx ? 'actual' : '') + '"><b aria-hidden="true"></b><div><strong>' + e[0] + '</strong><span>' + (i <= idx ? 'Desde el ' : 'Aprox. el ') + sumaDias(d.siembra, e[1]).split('-').reverse().slice(0, 2).join('/') + ' · día ' + (e[1] + 1) + '</span></div></li>').join('');
    const ultAlt = d.alturas.length ? d.alturas[d.alturas.length - 1] : null;
    const crecio = d.alturas.length > 1 ? (ultAlt.cm - d.alturas[0].cm).toFixed(1).replace(/\.0$/, '') : null;

    vista.innerHTML =
      '<div class="planta-card"><div class="pl-top">' + dibujo(idx) + '<div><span class="num">' + ETAPAS[idx][0] + '</span><div class="planta-dia">Día ' + (n + 1) + '</div><p>' + (d.nombre ? esc(d.nombre) + ' | ' : '') + 'sembrada el ' + d.siembra.split('-').reverse().join('/') + ' <button type="button" class="pl-editar" id="bNombre">' + (d.nombre ? 'Cambiar nombre' : 'Ponerle nombre') + '</button></p>' +
      '<form class="pl-nombre" id="fNombre" hidden><input id="pNom" maxlength="24" value="' + esc(d.nombre || '') + '" placeholder="Nombre de tu planta" aria-label="Nombre de tu planta"><button class="pl-mini" type="submit">Guardar</button></form></div></div>' +
      '<div class="pl-bio"><img src="/assets/img/bio-saluda.webp" alt="" width="40" height="84"><p><b>Bio</b>' + fraseBio + '</p></div>' +
      '<div class="pl-meta"><span>' + (sig ? 'Para ' + sig[0] : 'Ya es planta') + '</span><div class="pl-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div><b>' + pct + '%</b></div>' +
      '<div class="etapas" aria-hidden="true">' + ETAPAS.map((_, i) => '<i class="' + (i <= idx ? 'on' : '') + '"></i>').join('') + '</div><div class="etapas-nom" aria-hidden="true">' + ETAPAS.map((e) => '<span>' + e[0] + '</span>').join('') + '</div>' +
      '<div class="sed' + (nivel < 2 ? ' baja' : '') + '"><div class="gotas" aria-hidden="true">' + [1, 2, 3].map((g) => '<i class="' + (nivel >= g ? 'on' : '') + '"></i>').join('') + '</div><p><strong>' + estado + '</strong><br>' + texto + '</p></div>' +
      '<div class="planta-grid"><div><strong>' + d.riegos.length + '</strong><span>Riegos</span></div><div><strong>' + racha(d.riegos) + '</strong><span>Días seguidos</span></div><div><strong>' + (sig ? sig[1] - n + ' d' : 'Lista') + '</strong><span>' + (sig ? 'Para ' + sig[0] : 'Ya es planta') + '</span></div>' +
      '<div><strong>' + (ultAlt ? ultAlt.cm + ' cm' : '—') + '</strong><span>' + (crecio !== null ? 'Creció ' + crecio + ' cm' : 'Altura') + '</span></div>' +
      '<div><strong>' + mejorRacha(d.riegos) + '</strong><span>Mejor racha</span></div><div><strong>' + diasCompletos(d) + '</strong><span>Días de cuidados</span></div></div>' +
      '<h3>Ahora toca</h3><ul class="tips">' + TIPS[idx].map((t) => '<li>' + t + '</li>').join('') + '</ul>' +
      '<div class="pl-dato"><b>¿Sabías que?</b><p>' + dato + '</p></div>' +
      '<div class="planta-acciones" style="margin-top:20px"><button class="btn btn-primary" id="bRiego"' + (regada ? ' disabled' : '') + '>' + (regada ? 'Ya la regaste hoy' : 'La regué hoy') + '</button><button class="btn btn-outline" id="bShare">Compartir</button></div></div>' +

      '<div class="planta-card"><div class="pl-fila"><h3 style="margin:0">Cuidados de hoy</h3><span class="pl-cuenta">' + cHoy.length + '/' + CUIDADOS.length + '</span></div>' +
      '<p class="sub" style="margin-top:8px">Marca lo que ya hiciste hoy. Si completas los tres ganas puntos.</p><div class="pl-cuidados" id="plCuid">' +
      CUIDADOS.map((c) => '<button type="button" data-c="' + c[0] + '" class="' + (cHoy.includes(c[0]) ? 'on' : '') + '" aria-pressed="' + cHoy.includes(c[0]) + '"><span aria-hidden="true">' + ico(c[1], 26) + '</span>' + c[2] + '</button>').join('') + '</div></div>' +

      '<div class="planta-card"><h3>Su camino</h3><ol class="pl-camino">' + camino + '</ol></div>' +

      '<div class="planta-card"><div class="pl-fila"><h3 style="margin:0">Calendario de riegos</h3>' +
      '<label class="pl-fila" style="gap:8px;font-size:.88rem">Regar cada <select id="pFreq" aria-label="Cada cuántos días regar">' + [1, 2, 3, 5, 7].map((v) => '<option value="' + v + '"' + (v === d.freq ? ' selected' : '') + '>' + v + (v === 1 ? ' día' : ' días') + '</option>').join('') + '</select></label></div>' +
      '<p class="sub" style="margin-top:8px">Toca un día para marcarlo o quitarlo si se te pasó anotarlo.</p>' + calendario(d.riegos, d.siembra) + '</div>' +

      '<div class="planta-card"><h3>Crecimiento</h3><div class="pl-fila"><input class="pl-campo" id="pAlt" type="number" inputmode="decimal" min="0" max="500" step="0.1" placeholder="Altura en cm" aria-label="Altura en centímetros" style="flex:1;min-height:0;width:auto"><button class="pl-mini" id="bAlt" type="button">Anotar</button></div>' + grafica(d.alturas) + '</div>' +

      '<div class="planta-card"><h3>Diario de tu planta</h3><textarea class="pl-campo" id="dNota" maxlength="200" placeholder="¿Qué notaste hoy? (hojas nuevas, plagas, clima…)" aria-label="Nota del diario"></textarea>' +
      '<img class="pl-foto-prev" id="dPrev" alt="Vista previa de la foto">' +
      '<div class="pl-fila" style="margin-top:10px"><label class="pl-mini claro" style="cursor:pointer">' + ico('camara', 16) + ' Foto<input id="dFoto" type="file" accept="image/*" hidden></label><button class="pl-mini" id="bNota" type="button">Guardar entrada</button></div>' +
      '<ul class="diario-lista" id="dLista">' + diario.map((e, i) => '<li class="' + (e.img ? '' : 'sin-foto') + '">' + (e.img ? '<img src="' + e.img + '" alt="Foto del ' + esc(e.f) + '">' : '') + '<div><time>' + e.f.split('-').reverse().join('/') + '</time><p>' + (e.t ? esc(e.t) : '<i>Solo foto</i>') + '</p></div><button type="button" data-i="' + i + '" aria-label="Borrar entrada">✕</button></li>').join('') + '</ul>' +
      (diario.length ? '' : '<p class="pl-vacio">Todavía no hay entradas. Guarda notas y fotos para ver cómo cambia.</p>') + '</div>' +

      '<div class="planta-card"><h3>Recordatorios</h3><p class="sub" style="margin-top:-4px">' + (!window.BioNotis || !BioNotis.soporta() ? 'Tu navegador no admite avisos.' : BioNotis.activo() ? 'Activados: te avisamos cuando le toca riego y si tu racha está por romperse.' : 'Te avisamos cuando le toca riego y si tu racha está por romperse.') + '</p>' + (window.BioNotis && BioNotis.soporta() ? '<button class="pl-mini' + (BioNotis.activo() ? ' claro' : '') + '" id="bNoti" type="button">' + (BioNotis.activo() ? 'Apagar avisos' : 'Activar avisos') + '</button>' : '') + '</div>' +

      '<div class="planta-card"><h3>Insignias <span style="font-weight:500;color:var(--ink-faint)">' + ganadas.length + '/' + INSIGNIAS.length + '</span></h3><div class="insignias">' +
      INSIGNIAS.map((b) => '<div class="insignia' + (ganadas.includes(b) ? ' on' : '') + '"><b aria-hidden="true">' + ico(b[1], 28) + '</b><span>' + b[2] + '</span></div>').join('') + '</div>' +
      '<div class="planta-acciones" style="margin-top:18px"><button class="btn btn-outline" id="bReset">Reiniciar todo</button></div></div>';

    armaPestanas();
    enlazar(d, diario, idx, n);
    if (regando) {
      regando = false;
      const top = vista.querySelector('.pl-top');
      if (top && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        top.classList.add('riega');
        for (let g = 0; g < 7; g++) { const i = document.createElement('i'); i.className = 'pl-gota'; i.style.setProperty('--x', (14 + g * 12) + '%'); i.style.animationDelay = (g * 0.09) + 's'; top.appendChild(i); }
        setTimeout(() => { top.classList.remove('riega'); top.querySelectorAll('.pl-gota').forEach((i) => i.remove()); }, 1700);
      }
    }
  }

  function enlazar(d, diario, idx, n) {
    const bn = $('bNoti');
    if (bn) bn.addEventListener('click', async () => { if (BioNotis.activo()) BioNotis.desactivar(); else await BioNotis.pedir(); pintar(); });
    $('bRiego').addEventListener('click', () => {
      const h = hoy();
      if (!d.riegos.includes(h)) d.riegos.push(h);
      guarda(d);
      regando = true;
      if (window.BioPuntos) BioPuntos.dar(5, 'Riego anotado'); else aviso('Riego anotado');
      pintar();
      if (window.BioNotis && BioNotis.soporta() && !BioNotis.preguntado() && Notification.permission === 'default') setTimeout(() => BioNotis.pedir().then(pintar), 900);
    });

    vista.querySelector('.cal').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-f]');
      if (!b || b.disabled) return;
      const f = b.dataset.f;
      d.riegos = d.riegos.includes(f) ? d.riegos.filter((x) => x !== f) : d.riegos.concat(f).sort();
      guarda(d);
      if (navigator.vibrate) navigator.vibrate(10);
      pintar();
    });

    $('plCuid').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      const h = hoy();
      const act = (d.cuidados[h] || []).slice();
      const i = act.indexOf(b.dataset.c);
      if (i >= 0) act.splice(i, 1); else act.push(b.dataset.c);
      d.cuidados[h] = act;
      const claves = Object.keys(d.cuidados).sort().slice(-45);
      const limpio = {}; claves.forEach((k) => { limpio[k] = d.cuidados[k]; });
      d.cuidados = limpio;
      d.cuidadosPts = Array.isArray(d.cuidadosPts) ? d.cuidadosPts : [];
      const completo = act.length >= CUIDADOS.length;
      if (completo && !d.cuidadosPts.includes(h)) {
        d.cuidadosPts = d.cuidadosPts.concat(h).slice(-45);
        guarda(d);
        if (window.BioPuntos) BioPuntos.dar(3, 'Cuidados del día'); else aviso('¡Cuidados completos!');
      } else guarda(d);
      if (navigator.vibrate) navigator.vibrate(10);
      pintar();
    });

    $('bNombre').addEventListener('click', () => { const f = $('fNombre'); f.hidden = !f.hidden; if (!f.hidden) $('pNom').focus(); });
    $('fNombre').addEventListener('submit', (e) => {
      e.preventDefault();
      d.nombre = $('pNom').value.trim();
      guarda(d);
      aviso(d.nombre ? 'Ahora se llama ' + d.nombre : 'Nombre quitado');
      pintar();
    });

    $('pFreq').addEventListener('change', (e) => { d.freq = +e.target.value; guarda(d); pintar(); aviso('Te aviso cada ' + d.freq + (d.freq === 1 ? ' día' : ' días')); });

    $('bAlt').addEventListener('click', () => {
      const v = Math.round(parseFloat($('pAlt').value) * 10) / 10;
      if (!(v >= 0 && v <= 500)) { aviso('Pon una altura en centímetros'); return; }
      const h = hoy();
      d.alturas = d.alturas.filter((a) => a.f !== h).concat({ f: h, cm: v }).sort((a, b) => (a.f < b.f ? -1 : 1)).slice(-30);
      guarda(d);
      aviso('Medida anotada');
      pintar();
    });

    let foto = null;
    $('dFoto').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        foto = await BioImg.comprimir(f, 560, 0.6);
        const p = $('dPrev');
        p.src = foto; p.classList.add('ver');
      } catch (err) { foto = null; aviso('No pude leer esa foto'); }
    });
    $('bNota').addEventListener('click', () => {
      const t = $('dNota').value.trim();
      if (!t && !foto) { aviso('Escribe una nota o agrega una foto'); return; }
      const lista = diario.slice();
      lista.unshift({ f: hoy(), t: t, img: foto || null });
      let conFoto = 0;
      lista.forEach((x) => { if (x.img && ++conFoto > MAX_FOTOS) x.img = null; });
      if (!guardaDiario(lista.slice(0, 60))) { aviso('No hay espacio para guardar esa entrada'); return; }
      aviso('Entrada guardada');
      pintar();
    });
    $('dLista').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      const lista = diario.slice();
      lista.splice(+b.dataset.i, 1);
      guardaDiario(lista);
      pintar();
    });

    $('bShare').addEventListener('click', async () => {
      const txt = 'Mi planta' + (d.nombre ? ' «' + d.nombre + '»' : '') + ' va en el día ' + (n + 1) + ' (' + ETAPAS[idx][0] + ') con ' + d.riegos.length + ' riegos. Nació de una bolsa BioNyssa.';
      try {
        if (navigator.share) await navigator.share({ text: txt, url: location.origin + '/paginas/comunidad.html' });
        else { await navigator.clipboard.writeText(txt); aviso('Texto copiado, pégalo en la comunidad'); }
      } catch (err) {}
    });

    const reset = $('bReset');
    reset.addEventListener('click', () => {
      if (!reset.dataset.ok) {
        reset.dataset.ok = '1';
        reset.textContent = '¿Seguro? Toca otra vez';
        setTimeout(() => { reset.dataset.ok = ''; reset.textContent = 'Reiniciar todo'; }, 3000);
        return;
      }
      try { localStorage.removeItem(LLAVE); localStorage.removeItem(LLAVE_DIARIO); } catch (e) {}
      pintar();
    });
  }

  function pintar() {
    const d = lee();
    if (d) tarjeta(d); else formulario();
  }
  pintar();
})();
