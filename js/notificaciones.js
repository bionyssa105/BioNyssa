window.BioNotis = (function () {
  const K = 'bionyssa_notis';
  const soporta = () => 'Notification' in window;
  const leer = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } };
  const guardar = (o) => { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} };
  const f2 = (n) => String(n).padStart(2, '0');
  const fecha = (d) => d.getFullYear() + '-' + f2(d.getMonth() + 1) + '-' + f2(d.getDate());
  const dias = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);
  const activo = () => soporta() && Notification.permission === 'granted' && !!leer().on;

  async function mostrar(titulo, cuerpo, tag) {
    const op = { body: cuerpo, icon: 'assets/img/logo-app.png', badge: 'assets/img/favicon.ico', tag: tag, data: { url: 'mi-planta.html' } };
    try {
      const r = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (r) { await r.showNotification(titulo, op); return; }
    } catch (e) {}
    try { new Notification(titulo, op); } catch (e) {}
  }

  async function activar() {
    if (!soporta()) return 'no';
    let p = Notification.permission;
    if (p === 'default') { try { p = await Notification.requestPermission(); } catch (e) { p = 'denied'; } }
    const o = leer(); o.on = p === 'granted'; o.pregunto = true; guardar(o);
    if (p === 'granted') mostrar('Avisos activados', 'Te recordaremos cuándo regar tu planta.', 'bio-hola');
    return p;
  }
  function desactivar() { const o = leer(); o.on = false; guardar(o); }

  function pedir() {
    return new Promise((ok) => {
      if (!soporta()) { if (window.BioToast) BioToast('Tu navegador no admite avisos'); return ok('no'); }
      if (Notification.permission === 'denied') { if (window.BioToast) BioToast('Los avisos están bloqueados en tu navegador'); return ok('denied'); }
      const o = leer(); o.pregunto = true; guardar(o);
      const ov = document.createElement('div');
      ov.className = 'modal-overlay show';
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<div class="modal-card" style="max-width:420px;text-align:left"><h3 style="margin:0 0 8px">¿Te avisamos?</h3>' +
        '<p style="margin:0 0 12px;color:var(--ink-soft)">Solo te mandaríamos avisos útiles para tu planta, nada de spam:</p>' +
        '<ul style="margin:0 0 18px;padding-left:18px;display:grid;gap:6px;color:var(--ink-soft)">' +
        '<li><b style="color:var(--ink)">Riego:</b> cuando ya le toca agua según la frecuencia que elegiste.</li>' +
        '<li><b style="color:var(--ink)">Racha:</b> si llevas días seguidos y hoy no la has regado.</li></ul>' +
        '<p style="margin:0 0 16px;font-size:.84rem;color:var(--ink-faint)">Llegan cuando abres BioNyssa o la tienes abierta en segundo plano. Puedes apagarlos cuando quieras.</p>' +
        '<div style="display:flex;gap:10px"><button type="button" class="btn btn-outline" data-n="0">Ahora no</button><button type="button" class="btn btn-primary" data-n="1">Activar avisos</button></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-n]');
        if (!b && e.target !== ov) return;
        ov.remove();
        ok(b && b.dataset.n === '1' ? await activar() : 'default');
      });
    });
  }

  function revisar() {
    if (!activo()) return;
    let d; try { d = JSON.parse(localStorage.getItem('bionyssa_planta')); } catch (e) {}
    if (!d || !d.siembra) return;
    const o = leer(); o.ult = o.ult || {};
    const hoy = fecha(new Date()), riegos = (d.riegos || []).slice().sort(), freq = d.freq || 3;
    const ult = riegos[riegos.length - 1], hace = ult ? dias(ult, hoy) : null;
    const nombre = d.nombre || 'Tu planta';
    if (o.ult.riego !== hoy && ult !== hoy && (hace === null ? dias(d.siembra, hoy) >= 1 : hace >= freq)) {
      o.ult.riego = hoy; guardar(o);
      mostrar(nombre + ' tiene sed', hace === null ? 'Aún no anotas ningún riego.' : 'Hace ' + hace + (hace === 1 ? ' día' : ' días') + ' que no la riegas.', 'bio-riego');
      return;
    }
    let n = 0; const dia = new Date(); dia.setDate(dia.getDate() - 1);
    while (riegos.includes(fecha(dia))) { n++; dia.setDate(dia.getDate() - 1); }
    if (o.ult.racha !== hoy && ult !== hoy && n >= 2 && new Date().getHours() >= 18) {
      o.ult.racha = hoy; guardar(o);
      mostrar('Tu racha de ' + n + ' días', 'Riega hoy a ' + nombre.toLowerCase() + ' para no perderla.', 'bio-racha');
    }
  }

  if (soporta()) { setTimeout(revisar, 3000); setInterval(revisar, 30 * 60 * 1000); }
  return { soporta: soporta, activo: activo, pedir: pedir, activar: activar, desactivar: desactivar, preguntado: () => !!leer().pregunto, revisar: revisar };
})();
