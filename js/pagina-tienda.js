(() => {
  const $ = (id) => document.getElementById(id);
  const CLAVE = '1541c48b-6908-4a8f-99ee-f124e7e59fa7';
  const ESPERA = 60000, TOPE = 12000, GUARDA = 'bio_carrito';

  // precios: cambiar null por el número, ej. precio: 25 (con null sale 'Precio por definir')
  const PRODUCTOS = [
    { id: 'uno', nombre: 'Bolsa individual', precio: null, bolsas: 1, max: 99, desc: 'Una bolsa con semillas, lista para sembrar.' },
    { id: 'p20', nombre: 'Paquete de 20 bolsas', precio: null, bolsas: 20, max: 20, desc: 'Para sembrar en casa, repartir o compartir.' },
    { id: 'p50', nombre: 'Paquete de 50 bolsas', precio: null, bolsas: 50, max: 20, desc: 'Para grupos, eventos o proyectos grandes.' }
  ];
  const MATERIALES = { papel: 'Papel', plastico: 'Bio-Plástico' };
  const SEMILLAS = {
    girasol: { n: 'Girasol', corto: 'Girasol', t: 'Flores grandes y amarillas que siguen al sol.', c: ['#d6b231'] },
    albahaca: { n: 'Albahaca', corto: 'Albahaca', t: 'Hoja aromática para cocinar y para tu maceta.', c: ['#8aa31f'] },
    menta: { n: 'Menta', corto: 'Menta', t: 'Hierba fresca para infusiones y bebidas.', c: ['#4fa38a'] },
    cilantro: { n: 'Cilantro', corto: 'Cilantro', t: 'Hierba de uso diario en la cocina.', c: ['#4d5c1c'] },
    surtido: { n: 'Surtido aleatorio', corto: 'Surtido', t: 'Cada bolsa del paquete trae una semilla distinta.', c: ['#d6b231', '#8aa31f', '#4fa38a', '#4d5c1c'] }
  };


  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const HAY_PRECIOS = PRODUCTOS.every((p) => typeof p.precio === 'number');
  const money = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  const conTope = (p) => Promise.race([p, new Promise((_, no) => setTimeout(no, TOPE))]).then(() => true, () => false);

  function cuerpo(mat) {
    if (mat === 'papel') {
      return '<path d="M52 62h96v136q0 6-6 6H58q-6 0-6-6z" fill="#cfae76" stroke="#8a6b3a" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M148 62l12 6v128l-12 8z" fill="#b8955c" stroke="#8a6b3a" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M52 62h96v12H52z" fill="#bf9a60" stroke="#8a6b3a" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M82 62C80 32 120 32 118 62" fill="none" stroke="#8a6b3a" stroke-width="3" stroke-linecap="round"/>';
    }
    return '<path d="M62 70C58 26 94 26 92 70M108 70C106 26 142 26 138 70" fill="none" stroke="#7a9022" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M54 70h92q4 70 2 128-48 8-96 0-2-58 2-128z" fill="#bfd96a" fill-opacity=".75" stroke="#7a9022" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M65 88q-3 48-1 94" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M135 92q3 36 1 64" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>';
  }
  function etiqueta(sem) {
    const s = SEMILLAS[sem], w = 40 / s.c.length;
    const barras = s.c.map((c, i) => '<rect x="' + (80 + i * w) + '" y="147" width="' + w + '" height="5" fill="' + c + '"/>').join('');
    return '<rect x="68" y="108" width="64" height="62" rx="6" fill="#fffff2" stroke="#4d5c1c" stroke-width="1.5"/>' +
      '<path d="M100 128v-9" stroke="#4d5c1c" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M100 120c0-5-4-7-8-7 0 5 3 7 8 7zM100 118c0-4 3-6 7-6 0 4-3 6-7 6z" fill="#7a9022"/>' +
      '<text x="100" y="142" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="700" font-size="10" fill="#12120c">BioNyssa</text>' +
      '<g>' + barras + '</g>' +
      '<text x="100" y="164" text-anchor="middle" font-family="\'Space Grotesk\',system-ui,sans-serif" font-weight="600" font-size="8" fill="#3a3a28">' + s.corto + '</text>';
  }
  // dibujo de la bolsa según el material
  function ilustracion(p, mat, sem) {
    const frente = '<g>' + cuerpo(mat) + etiqueta(sem) + '</g>';
    let dentro = '<ellipse cx="100" cy="210" rx="62" ry="6" fill="#000" opacity=".12"/>';
    if (p.bolsas > 1) {
      dentro += '<g transform="translate(-30 14) scale(.82)">' + cuerpo(mat) + '</g><g transform="translate(66 14) scale(.82)">' + cuerpo(mat) + '</g>' + frente +
        '<circle cx="164" cy="40" r="24" fill="#2e3910"/><text x="164" y="46" text-anchor="middle" font-family="\'Space Grotesk\',system-ui,sans-serif" font-weight="700" font-size="17" fill="#fffff2">×' + p.bolsas + '</text>';
    } else dentro += frente;
    const alt = p.nombre + ', ' + MATERIALES[mat].toLowerCase() + ', semillas ' + SEMILLAS[sem].n.toLowerCase();
    return '<svg viewBox="0 0 200 220" role="img" aria-label="' + alt + '">' + dentro + '</svg>';
  }

  let carrito = [];
  try { carrito = JSON.parse(localStorage.getItem(GUARDA)) || []; } catch (e) { carrito = []; }
  carrito = carrito.filter((l) => PRODUCTOS.some((p) => p.id === l.id) && MATERIALES[l.mat] && SEMILLAS[l.sem] && l.cant > 0);
  const guardarCarrito = () => { try { localStorage.setItem(GUARDA, JSON.stringify(carrito)); } catch (e) {} };
  const prod = (id) => PRODUCTOS.find((p) => p.id === id);
  const total = () => carrito.reduce((s, l) => s + (prod(l.id).precio || 0) * l.cant, 0);

  // ojo: el carrito vive en el navegador (bio_carrito)
  function pintarCarrito() {
    const caja = $('tLista');
    caja.innerHTML = '';
    const n = carrito.reduce((s, l) => s + l.cant, 0);
    $('tCuenta').textContent = n ? '(' + n + (n === 1 ? ' artículo)' : ' artículos)') : '';
    $('tEnviar').disabled = !n;
    if (!n) { caja.appendChild(el('p', 'pedido-vacio', 'Tu pedido está vacío. Elige una bolsa arriba y toca «Agregar al pedido».')); return; }
    carrito.forEach((l, i) => {
      const p = prod(l.id), fila = el('div', 'linea');
      const info = el('div'), nom = el('b', '', p.nombre);
      info.appendChild(nom);
      info.appendChild(el('span', 'linea-det', MATERIALES[l.mat] + ' · Semillas: ' + SEMILLAS[l.sem].n));
      fila.appendChild(info);
      fila.appendChild(el('div', 'linea-sub', typeof p.precio === 'number' ? money(p.precio * l.cant) : 'Por definir'));
      const acc = el('div', 'linea-acc'), cant = el('div', 'cant');
      const menos = el('button', '', '−'), mas = el('button', '', '+'), num = el('output', '', l.cant);
      menos.type = mas.type = 'button';
      menos.setAttribute('aria-label', 'Quitar uno de ' + p.nombre);
      mas.setAttribute('aria-label', 'Agregar uno de ' + p.nombre);
      menos.disabled = l.cant <= 1;
      mas.disabled = l.cant >= p.max;
      menos.onclick = () => { l.cant--; guardarCarrito(); pintarCarrito(); };
      mas.onclick = () => { l.cant++; guardarCarrito(); pintarCarrito(); };
      cant.append(menos, num, mas);
      const quitar = el('button', 'linea-quitar', 'Quitar');
      quitar.type = 'button';
      quitar.onclick = () => { carrito.splice(i, 1); guardarCarrito(); pintarCarrito(); };
      acc.append(cant, quitar);
      fila.appendChild(acc);
      caja.appendChild(fila);
    });
    if (HAY_PRECIOS) {
      const t = el('div', 'pedido-total');
      t.append(el('span', '', 'Total'), el('span', '', money(total()) + ' MXN'));
      caja.appendChild(t);
    } else caja.appendChild(el('p', 'pedido-nota', 'Los precios están por definir. Te los confirmamos por correo.'));
  }

  function agregar(p, e) {
    const l = carrito.find((x) => x.id === p.id && x.mat === e.mat && x.sem === e.sem);
    if (l) l.cant = Math.min(p.max, l.cant + e.cant); else carrito.push({ id: p.id, mat: e.mat, sem: e.sem, cant: e.cant });
    guardarCarrito();
    pintarCarrito();
    if (window.BioToast) BioToast('Agregado: ' + p.nombre + ' (' + MATERIALES[e.mat].toLowerCase() + ')');
  }

  function chips(nombre, opciones, valor, alCambiar) {
    const g = el('div', 'chips');
    g.setAttribute('role', 'radiogroup');
    Object.keys(opciones).forEach((k) => {
      const lab = el('label', 'chip'), r = el('input');
      r.type = 'radio'; r.name = nombre; r.value = k; r.checked = k === valor;
      r.onchange = () => alCambiar(k);
      lab.append(r, el('span', '', opciones[k].n || opciones[k]));
      g.appendChild(lab);
    });
    return g;
  }
  function tarjeta(p) {
    const e = { mat: 'papel', sem: 'girasol', cant: 1 };
    const card = el('article', 'prod'), fig = el('figure', 'prod-img'), cuerpoT = el('div', 'prod-body');
    const pintarImg = () => { fig.innerHTML = ilustracion(p, e.mat, e.sem); };
    pintarImg();
    const precio = el('p', 'prod-precio', typeof p.precio === 'number' ? money(p.precio) : 'Precio por definir');
    if (typeof p.precio === 'number') precio.appendChild(el('small', '', 'MXN')); else precio.classList.add('por-definir');
    const fm = el('fieldset', 'opc'), lm = el('legend', '', 'Material');
    fm.append(lm, chips(p.id + '-mat', MATERIALES, e.mat, (v) => { e.mat = v; pintarImg(); }));
    const opcSem = {};
    Object.keys(SEMILLAS).forEach((k) => { if (k !== 'surtido' || p.bolsas > 1) opcSem[k] = SEMILLAS[k]; });
    const fs = el('fieldset', 'opc'), ayuda = el('p', 'opc-ayuda', SEMILLAS[e.sem].t);
    ayuda.setAttribute('aria-live', 'polite');
    fs.append(el('legend', '', 'Semillas'), chips(p.id + '-sem', opcSem, e.sem, (v) => { e.sem = v; ayuda.textContent = SEMILLAS[v].t; pintarImg(); }), ayuda);
    const pie = el('div', 'prod-pie'), cant = el('div', 'cant');
    const menos = el('button', '', '−'), mas = el('button', '', '+'), num = el('output', '', 1);
    menos.type = mas.type = 'button';
    menos.setAttribute('aria-label', 'Menos cantidad'); mas.setAttribute('aria-label', 'Más cantidad');
    const refrescar = () => { num.textContent = e.cant; menos.disabled = e.cant <= 1; mas.disabled = e.cant >= p.max; };
    menos.onclick = () => { e.cant--; refrescar(); };
    mas.onclick = () => { e.cant++; refrescar(); };
    refrescar();
    cant.append(menos, num, mas);
    const btn = el('button', 'btn btn-primary tienda-btn', 'Agregar al pedido');
    btn.type = 'button';
    btn.onclick = () => agregar(p, e);
    pie.append(cant, btn);
    cuerpoT.append(el('h2', 'prod-nombre', p.nombre), precio, el('p', 'prod-desc', p.desc), fm, fs, pie);
    card.append(fig, cuerpoT);
    return card;
  }
  PRODUCTOS.forEach((p) => $('tProductos').appendChild(tarjeta(p)));

  const form = $('formPedido'), nom = $('tNombre'), cor = $('tCorreo'), tel = $('tTel'), notas = $('tNotas'), estado = $('tEstado'), boton = $('tEnviar');
  const aviso = (t, tipo) => { estado.textContent = t; estado.className = 'c-estado' + (tipo ? ' ' + tipo : ''); };
  const marcar = (x, mal) => x.classList.toggle('malo', !!mal);
  const ultimo = () => { try { return +localStorage.getItem('bio_pedido_t') || 0; } catch (e) { return 0; } };
  const sesion = window.BioSesion && BioSesion.obtener();
  if (sesion) { nom.value = sesion.nombre || ''; cor.value = sesion.correo || ''; }
  notas.addEventListener('input', () => { $('tNotasCuenta').textContent = notas.value.length + ' / 300'; $('tNotasCuenta').classList.toggle('casi', notas.value.length >= 270); });
  [nom, cor, tel].forEach((x) => x.addEventListener('input', () => marcar(x, false)));

  function resumen() {
    return carrito.map((l) => { const p = prod(l.id); return l.cant + ' × ' + p.nombre + ' · ' + MATERIALES[l.mat] + ' · Semillas ' + SEMILLAS[l.sem].n + (typeof p.precio === 'number' ? ' = ' + money(p.precio * l.cant) : ''); }).join('\n');
  }
  async function guardar(datos) {
    const nu = await BioFirebase.nucleo();
    const doc = {
      nombre: datos.nombre, correo: datos.correo, telefono: datos.telefono, notas: datos.notas,
      items: carrito.map((l) => { const it = { producto: prod(l.id).nombre, material: MATERIALES[l.mat], semillas: SEMILLAS[l.sem].n, cantidad: l.cant }; if (typeof prod(l.id).precio === 'number') it.precio = prod(l.id).precio; return it; }),
      creado: Date.now()
    };
    if (HAY_PRECIOS) doc.total = total();
    if (nu.auth.currentUser) doc.uid = nu.auth.currentUser.uid;
    await nu.ff.addDoc(nu.ff.collection(nu.db, 'pedidos'), doc);
  }
  async function correo(datos) {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: CLAVE, subject: 'Pedido nuevo desde BioNyssa', name: datos.nombre, email: datos.correo, message: resumen() + (HAY_PRECIOS ? '\n\nTotal: ' + money(total()) + ' MXN' : '\n\nPrecios por definir') + '\nTeléfono: ' + (datos.telefono || 'no puso') + '\nEntrega: ' + (datos.notas || 'no puso') })
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.message);
  }
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if ($('tWeb').value || !carrito.length) return;
    const datos = { nombre: nom.value.trim(), correo: cor.value.trim(), telefono: tel.value.trim(), notas: notas.value.trim() };
    const okN = datos.nombre.length >= 2, okC = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo), okT = !datos.telefono || /^[0-9 +()-]{7,20}$/.test(datos.telefono);
    marcar(nom, !okN); marcar(cor, !okC); marcar(tel, !okT);
    if (!okN || !okC || !okT) return aviso(!okN ? 'Pon tu nombre.' : !okC ? 'Ese correo no se ve bien.' : 'Ese teléfono no se ve bien.', 'mal');
    const resta = ESPERA - (Date.now() - ultimo());
    if (resta > 0) return aviso('Espera ' + Math.ceil(resta / 1000) + ' segundos para mandar otro pedido.', 'mal');
    boton.disabled = true;
    aviso('Enviando pedido...');
    const hayNube = !!(window.BioFirebase && BioFirebase.configurado());
    const [guardado, enviado] = await Promise.all([hayNube ? conTope(guardar(datos)) : false, CLAVE ? conTope(correo(datos)) : false]);
    if (!guardado && !enviado) {
      aviso('No se pudo enviar el pedido. Revisa tu internet e inténtalo otra vez.', 'mal');
      boton.disabled = false;
      return;
    }
    try { localStorage.setItem('bio_pedido_t', String(Date.now())); } catch (x) {}
    carrito = [];
    guardarCarrito();
    pintarCarrito();
    tel.value = notas.value = '';
    $('tNotasCuenta').textContent = '0 / 300';
    aviso('Listo, recibimos tu pedido. Te escribimos al correo que pusiste para confirmarlo.', 'ok');
  });
  pintarCarrito();
})();
