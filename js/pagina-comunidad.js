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
    suscriptores.forEach((fn) => {
      try { fn(posts); } catch (e) {}
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

  function textoError(e) {
    const c = e && e.code;
    if (c === 'bio/sin-nube' || c === 'bio/sin-sesion') return 'No se pudo conectar tu cuenta con la nube. Cierra sesión, entra otra vez y vuelve a intentar.';
    if (c === 'permission-denied') return 'Firebase no dejó guardar eso. Revisa que las reglas de Firestore estén publicadas.';
    if (c === 'unavailable' || c === 'failed-precondition') return 'No hay conexión con Firebase. Inténtalo de nuevo en un momento.';
    if (c === 'bio/foto-grande') return 'La foto pesa demasiado. Elige otra o una más pequeña.';
    if (c === 'bio/vacia') return 'Escribe algo o agrega una foto para publicar.';
    return 'No se pudo guardar. Inténtalo de nuevo.' + (c ? ' (' + c + ')' : '');
  }
  function avisarError(e) {
    if (window.BioModera) BioModera.aviso(textoError(e));
    else if (window.BioToast) BioToast(textoError(e));
  }

  if (window.BioNube) {
    BioNube.comunidad((e) => {
      posts = e.posts;
      porUid = e.porUid;
      porClave = e.porClave;
      cargada = e.cargada;
      errorNube = e.error;
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
  function fotoSegura(f) {
    return typeof f === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(f) ? f : '';
  }
  function resolver(clave, nombreOriginal, uid) {
    const k = clave || (window.BioComun ? BioComun.usuarioDesdeNombre(nombreOriginal) : '@usuario');
    const p = (uid && porUid[uid]) || porClave[k] || {};
    const nombre = p.nombreCom || p.nombre || nombreOriginal || 'Invitado';
    return { clave: k, nombre: nombre, handle: p.usuarioCom || p.clave || k, foto: fotoSegura(p.foto), inicial: (nombre.trim()[0] || 'I').toUpperCase() };
  }
  function pintarAvatar(el, r) {
    if (!el) return;
    el.className = el.className.replace(/\b(av-\d+|has-photo)\b/g, '').replace(/\s+/g, ' ').trim();
    el.classList.add(window.BioComun ? BioComun.colorAvatar(r.clave) : 'av-1');
    if (r.foto) {
      el.classList.add('has-photo');
      el.textContent = '';
      el.style.backgroundImage = 'url("' + r.foto + '")';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Foto de ' + r.nombre);
    } else {
      el.style.backgroundImage = '';
      el.textContent = r.inicial;
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
  }

  const KG = 'bionyssa_guardadas';
  function leerG() { try { const a = JSON.parse(localStorage.getItem(KG)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function escribirG(a) { try { localStorage.setItem(KG, JSON.stringify(a)); } catch (e) {} }

  function crearPost(post) {
    const el = document.createElement('article');
    el.className = 'post';

    const r = resolver(post.usuario, post.nombre, post.uid);
    const bloqueado = esInvitado();
    const sesionAct = window.BioSesion ? BioSesion.obtener() : null;
    const miId = miUid();
    const esMio = esMioFn(post);
    post.likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const meGusta = () => !!miId && post.likedBy.indexOf(miId) !== -1;

    el.innerHTML = `
      <div class="post-head">
        <span class="post-avatar"></span>
        <div class="post-quien">
          <div class="post-name-row">
            <span class="post-name">${escapeHtml(r.nombre)}</span>
            <span class="post-handle">${escapeHtml(r.handle)}</span>
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

    pintarAvatar(el.querySelector('.post-avatar'), r);
    pintarAvatar(el.querySelector('.comment-form .yo'), sesionAct ? resolver(sesionAct.usuario, sesionAct.nombre, miId) : resolver(null, 'Invitado'));

    function pintarStats() {
      const sl = el.querySelector('.stat-likes'), sc = el.querySelector('.stat-com'), n = post.comentarios.length;
      sl.hidden = !(post.likes > 0);
      sc.hidden = !n;
      sc.textContent = n + (n === 1 ? ' comentario' : ' comentarios');
    }
    pintarStats();
    const bm = document.createElement('button');
    bm.type = 'button';
    bm.className = 'action-btn btn-guardar' + (leerG().indexOf(post.id) > -1 ? ' on' : '');
    bm.setAttribute('aria-label', 'Guardar publicación');
    bm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><g stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7.1 4.6c3.2-.4 6.6-.4 9.8 0 .3 5 .3 10.2 0 15.1-2.5-2.2-5-2.2-7.4 0-.6-5.2-.6-10.1-.4-15.1z"/></g></svg>';
    bm.addEventListener('click', () => {
      const g = leerG(), i = g.indexOf(post.id);
      if (i > -1) g.splice(i, 1); else g.push(post.id);
      escribirG(g);
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
      mas.addEventListener('click', () => { const cerrado = txtPost.classList.toggle('recortado'); mas.textContent = cerrado ? 'Ver más' : 'Ver menos'; });
      txtPost.after(mas);
    }
    const fotoPost = el.querySelector('.post-photo');
    if (fotoPost) {
      fotoPost.addEventListener('dblclick', () => {
        const b = el.querySelector('.btn-like');
        if (!b.classList.contains('liked')) b.click();
        fotoPost.classList.remove('late'); void fotoPost.offsetWidth; fotoPost.classList.add('late');
      });
    }
    el.querySelector('.stat-com').addEventListener('click', () => el.querySelector('.btn-mostrar').click());
    el.querySelector('.btn-compartir').addEventListener('click', async (ev) => {
      const t = ev.currentTarget.querySelector('span');
      const datos = { title: 'BioNyssa', text: (post.texto || 'Mira esta publicación en BioNyssa').slice(0, 120), url: location.origin + location.pathname };
      try {
        if (navigator.share) await navigator.share(datos);
        else { await navigator.clipboard.writeText(datos.text + ' ' + datos.url); t.textContent = 'Enlace copiado'; setTimeout(() => { t.textContent = 'Compartir'; }, 1800); }
      } catch (e) {}
    });

    const comentariosBox = el.querySelector('.comments');
    const listaComentarios = el.querySelector('.lista-comentarios');

    function pintarComentarios() {
      listaComentarios.innerHTML = '';
      post.comentarios.forEach((c, idx) => {
        const texto = typeof c === 'string' ? c : c.t;
        const puedeBorrar = esMio || (typeof c !== 'string' && !!sesionAct && (c.uid ? c.uid === miId : c.u === sesionAct.usuario));
        const fila = document.createElement('div');
        fila.className = 'comment';
        const rc = typeof c === 'string' ? resolver(null, 'Invitado') : resolver(c.u, String(c.u || '').replace(/^@/, ''), c.uid);
        fila.innerHTML = `<span class="post-avatar mini"></span><div class="comment-bubble"><b>${escapeHtml(rc.nombre)}</b><span>${escapeHtml(texto)}</span></div>` + (puedeBorrar ? '<button aria-label="Borrar comentario">✕</button>' : '');
        pintarAvatar(fila.querySelector('.post-avatar'), rc);
        if (puedeBorrar) {
          fila.querySelector('button').addEventListener('click', () => {
            const quitado = post.comentarios.splice(idx, 1)[0];
            pintarComentarios();
            actualizarContador();
            if (quitado && quitado.id) {
              BioNube.borrarComentario(post.id, quitado.id).catch((err) => {
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

    el.querySelector('.btn-like').addEventListener('click', () => {
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
      BioNube.meGusta(post.id, dar).catch((err) => {
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
    el.querySelector('.btn-mostrar').addEventListener('click', () => {
      comentariosBox.classList.toggle('show');
      if (comentariosBox.classList.contains('show')) abiertos.add(post.id); else abiertos.delete(post.id);
    });

    const btnBorrar = el.querySelector('.btn-borrar');
    if (!esMio) btnBorrar.remove();
    btnBorrar.addEventListener('click', () => {
      if (el.classList.contains('sale')) return;
      if (!btnBorrar.classList.contains('seguro')) {
        btnBorrar.classList.add('seguro');
        setTimeout(() => btnBorrar.classList.remove('seguro'), 3200);
        return;
      }
      el.classList.add('sale');
      setTimeout(() => {
        BioNube.borrarPublicacion(post.id).catch((err) => {
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
      BioNube.comentar(post.id, valor).catch((err) => {
        inputComentario.value = valor;
        avisarError(err);
      });
    }

    botonComentario.addEventListener('click', enviarComentario);
    inputComentario.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') enviarComentario();
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
    const r = sesion
      ? BioHilo.resolver(sesion.usuario, sesion.nombre, BioHilo.miUid())
      : { clave: '@invitado', nombre: 'Invitado', handle: '@invitado', foto: '', inicial: 'I' };

    BioHilo.pintarAvatar(document.getElementById('composerAvatar'), r);
    BioHilo.pintarAvatar(document.getElementById('sideAvatar'), r);
    [['composerNombre', r.nombre], ['composerUsuario', r.handle], ['sideNombre', r.nombre], ['sideUsuario', r.handle]]
      .forEach(([id, txt]) => { const e = document.getElementById(id); if (e) e.textContent = txt; });
  }
  pintarComposer();
  document.addEventListener('bio-perfil', pintarComposer);
  BioHilo.suscribir(pintarComposer);

  const btnVerPerfil = document.getElementById('btnVerPerfil');
  if (btnVerPerfil) {
    btnVerPerfil.addEventListener('click', () => {
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
      botonBanner.addEventListener('click', () => { window.location.href = '/paginas/registro.html'; });
    }
  }

  btnFoto.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', async () => {
    const archivo = inputFoto.files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) { BioModera.aviso('Elige un archivo de imagen.'); inputFoto.value = ''; return; }
    let b64;
    try { b64 = await BioImg.comprimir(archivo, 1024, 0.8); }
    catch (e) { BioModera.aviso('No se pudo leer esa imagen.'); inputFoto.value = ''; return; }
    if (!(await BioModera.revisarImagen(b64))) { inputFoto.value = ''; return; }
    fotoSeleccionada = b64;
    previewImg.src = fotoSeleccionada;
    previewWrap.classList.add('show');
  });

  quitarFoto.addEventListener('click', () => {
    fotoSeleccionada = null;
    inputFoto.value = '';
    previewWrap.classList.remove('show');
  });

  btnPublicar.addEventListener('click', async () => {
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
    const a = document.activeElement;
    return !!a && a.tagName === 'INPUT' && feed.contains(a) && a.value.length > 0;
  }
  feed.addEventListener('focusout', () => {
    if (pendiente) setTimeout(() => { if (!escribiendo()) render(); }, 0);
  });

  function pintarRecientes(posts) {
    const ya = new Set(), items = [];
    posts.slice().sort((x, y) => y.creado - x.creado).forEach((p) => {
      const id = p.uid || p.usuario;
      if (!id || ya.has(id) || items.length >= 12) return;
      ya.add(id);
      items.push(p);
    });
    recientes.innerHTML = '';
    items.forEach((p) => {
      const id = p.uid || p.usuario;
      const r = BioHilo.resolver(p.usuario, p.nombre, p.uid);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'reciente' + (autor && autor.id === id ? ' on' : '');
      b.innerHTML = '<span class="post-avatar"></span><span class="n"></span>';
      b.querySelector('.n').textContent = r.nombre.split(' ')[0];
      BioHilo.pintarAvatar(b.querySelector('.post-avatar'), r);
      b.addEventListener('click', () => { autor = autor && autor.id === id ? null : { id: id, nombre: r.nombre }; render(); });
      recientes.appendChild(b);
    });
  }

  function pintarAviso() {
    avisoF.hidden = !autor;
    if (!autor) return;
    avisoF.textContent = 'Viendo solo lo de ' + autor.nombre + '. ';
    const q = document.createElement('button');
    q.type = 'button';
    q.textContent = 'Quitar filtro';
    q.addEventListener('click', () => { autor = null; render(); });
    avisoF.appendChild(q);
  }

  document.querySelectorAll('.filtro').forEach((b) => {
    b.addEventListener('click', () => {
      modo = b.dataset.orden;
      document.querySelectorAll('.filtro').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });
  document.addEventListener('bio:guardadas', () => { if (modo === 'guardadas') render(); });

  function render() {
    if (escribiendo()) { pendiente = true; return; }
    pendiente = false;
    const posts = BioHilo.cargar();
    const ses = window.BioSesion ? BioSesion.obtener() : null;
    const firma = [modo, autor && autor.id, ses && (ses.usuario || ses.uid), BioHilo.guardadas().length,
      posts.map((p) => p.id + ':' + p.likes + ':' + p.comentarios.length + ':' + (p.texto || '').length).join(',')].join('|');
    if (firma === firmaAnt && feed.children.length) return;
    firmaAnt = firma;
    feed.innerHTML = '';
    if (posts.length === 0) {
      barraFeed.hidden = true;
      if (!BioHilo.cargada) { vacio.style.display = 'none'; return; }
      vacio.style.display = 'block';
      if (BioHilo.errorNube) {
        const p = vacio.querySelector('p');
        if (p) p.textContent = 'No se pudieron cargar las publicaciones. Revisa tu conexión y que las reglas de Firestore estén publicadas.';
      }
      return;
    }
    barraFeed.hidden = false;
    pintarRecientes(posts);
    pintarAviso();
    let lista = posts.slice();
    if (autor) lista = lista.filter((p) => (p.uid || p.usuario) === autor.id);
    if (modo === 'guardadas') { const gs = BioHilo.guardadas(); lista = lista.filter((p) => gs.indexOf(p.id) > -1); }
    if (modo === 'populares') lista.sort((x, y) => (y.likes + y.comentarios.length) - (x.likes + x.comentarios.length) || y.creado - x.creado);
    const pv = vacio.querySelector('p');
    if (!lista.length) {
      pv.textContent = modo === 'guardadas' ? 'Todavía no guardas nada. Toca el marcador de una publicación y la verás aquí.' : 'Esa persona todavía no tiene publicaciones.';
      vacio.style.display = 'block';
      return;
    }
    pv.textContent = textoVacio;
    vacio.style.display = 'none';
    let orden = 0;
    lista.forEach((post) => {
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
  if (irCrear) irCrear.addEventListener('click', () => document.querySelector('.tab-btn[data-tab="crear"]').click());
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
    const b = tabBtns.find((x) => x.classList.contains('active'));
    if (!b) return;
    indicador.style.width = b.offsetWidth + 'px';
    indicador.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }

  window.addEventListener('resize', moverIndicador);
  window.addEventListener('load', moverIndicador);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);

  function activarTab(nombre) {
    const orden = tabBtns.map((b) => b.dataset.tab);
    const dir = orden.indexOf(nombre) >= orden.indexOf(tabActual) ? 'der' : 'izq';
    tabActual = nombre;
    panels.forEach((p) => { p.dataset.dir = dir; });
    tabBtns.forEach((b) => {
      const activo = b.dataset.tab === nombre;
      b.classList.toggle('active', activo);
      b.setAttribute('aria-selected', activo ? 'true' : 'false');
    });
    panels.forEach((p) => { p.hidden = p.dataset.panel !== nombre; });
    moverIndicador();
    if (nombre === 'buscar') renderBuscar();
    if (nombre === 'perfil') renderPerfil();
    if (nombre === 'crear' && window.BioModera) BioModera.precargar();
    if (nombre === 'crear') setTimeout(() => { const t = document.getElementById('txtPublicacion'); if (t) t.focus({ preventScroll: true }); }, 60);
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => activarTab(btn.dataset.tab));
  });

  function renderNumeros() {
    const numPub = document.getElementById('numPublicacionesTotal');
    const numPer = document.getElementById('numPersonasTotal');
    if (!numPub || !numPer) return;
    const posts = BioHilo.cargar();
    const personas = new Set(posts.map((p) => p.usuario));
    contar(numPub, posts.length);
    contar(numPer, personas.size);

    const ses = BioSesion.obtener();
    const mios = ses && ses.usuario ? posts.filter((p) => BioHilo.esMio(p)) : [];
    const mp = document.getElementById('miPubs'), ml = document.getElementById('miLikes');
    if (mp) mp.textContent = mios.length;
    if (ml) ml.textContent = mios.reduce((t, p) => t + (p.likes || 0), 0);

    const lista = document.getElementById('tagsTop');
    if (lista) {
      const cuenta = {};
      posts.forEach((p) => {
        (String(p.texto || '').match(/#[\p{L}\p{N}_]+/gu) || []).forEach((t) => {
          const k = t.toLowerCase();
          cuenta[k] = (cuenta[k] || 0) + 1;
        });
      });
      const top = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a]).slice(0, 4);
      lista.innerHTML = top.length
        ? top.map((t) => '<li><button type="button" data-tag="' + t.replace(/[<>&"]/g, '') + '"><span class="tag-nombre">' + t.replace(/</g, '&lt;') + '</span><span class="tag-num">' + cuenta[t] + (cuenta[t] === 1 ? ' publicación' : ' publicaciones') + '</span></button></li>').join('')
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
    function paso(t) {
      const k = Math.min((t - inicio) / dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(desde + (hasta - desde) * e);
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
    const q = inputBuscar.value.trim().toLowerCase();
    resultadosBuscar.innerHTML = '';
    personasBuscar.innerHTML = '';
    personasBuscar.style.display = 'none';

    if (!q) {
      buscarVacio.style.display = 'block';
      buscarVacio.querySelector('p').textContent = 'Escribe algo para buscar: un texto, un nombre o un usuario.';
      return;
    }

    const posts = BioHilo.cargar();

    const personasEncontradas = new Map();
    posts.forEach((p) => {
      const rp = BioHilo.resolver(p.usuario, p.nombre, p.uid);
      const handle = rp.handle.toLowerCase();
      const nombre = rp.nombre.toLowerCase();
      if ((handle.includes(q) || nombre.includes(q)) && !personasEncontradas.has(handle)) {
        personasEncontradas.set(handle, p);
      }
    });

    if (personasEncontradas.size) {
      personasBuscar.style.display = 'flex';
      personasEncontradas.forEach((p) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'people-chip';
        const rp = BioHilo.resolver(p.usuario, p.nombre, p.uid);
        chip.innerHTML = `<span class="post-avatar"></span><span>${BioHilo.escapeHtml(rp.nombre)}</span>`;
        BioHilo.pintarAvatar(chip.querySelector('.post-avatar'), rp);
        chip.addEventListener('click', () => {
          inputBuscar.value = BioHilo.resolver(p.usuario, p.nombre, p.uid).handle;
          renderBuscar();
        });
        personasBuscar.appendChild(chip);
      });
    }

    const coincidencias = posts.filter((p) => {
      const texto = (p.texto || '').toLowerCase();
      const rp = BioHilo.resolver(p.usuario, p.nombre, p.uid);
      const handle = rp.handle.toLowerCase();
      const nombre = rp.nombre.toLowerCase();
      return texto.includes(q) || handle.includes(q) || nombre.includes(q);
    });

    if (!coincidencias.length) {
      buscarVacio.style.display = 'block';
      buscarVacio.querySelector('p').textContent = 'No salió nada con "' + q + '". Prueba con otra palabra.';
      return;
    }

    buscarVacio.style.display = 'none';
    coincidencias.forEach((p) => resultadosBuscar.appendChild(BioHilo.crearPost(p)));
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
    const posts = BioHilo.cargar().filter((p) => BioHilo.esMio(p));
    const meGusta = posts.reduce((s, p) => s + (p.likes || 0), 0);
    const comentarios = posts.reduce((s, p) => s + (p.comentarios ? p.comentarios.length : 0), 0);

    const r = BioHilo.resolver(handle, sesion.nombre, BioHilo.miUid());
    BioHilo.pintarAvatar(document.getElementById('perfilAvatar'), r);
    document.getElementById('perfilNombre').textContent = r.nombre;
    document.getElementById('perfilUsuario').textContent = r.handle;
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
      posts.forEach((p) => listaPosts.appendChild(BioHilo.crearPost(p)));
    }
  }

  if (btnEditarBio) {
    btnEditarBio.addEventListener('click', () => {
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

    btnCancelarBio.addEventListener('click', () => {
      bioEdit.style.display = 'none';
      bioView.style.display = 'flex';
    });

    btnGuardarBio.addEventListener('click', async () => {
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
      } catch (e) {
        btnGuardarBio.disabled = false;
        if (e && e.code === 'bio/usuario-ocupado') editError.textContent = 'Ese usuario ya está en uso. Prueba con otro.';
        else if (e && e.code === 'invalid-argument') editError.textContent = 'La foto es demasiado pesada. Prueba con otra.';
        else editError.textContent = 'No se pudo guardar tu perfil. Revisa tu conexión e inténtalo otra vez.';
        return;
      }
      btnGuardarBio.disabled = false;
      bioEdit.style.display = 'none';
      bioView.style.display = 'flex';
      document.dispatchEvent(new Event('bio-perfil'));
      BioHilo.notificar();
    });

    btnCambiarFoto.addEventListener('click', () => inputFotoPerfil.click());
    btnQuitarFotoPerfil.addEventListener('click', () => { fotoPendiente = null; inputFotoPerfil.value = ''; previsualizar(); });
    [editNombre, editUsuario].forEach((i) => i.addEventListener('input', previsualizar));

    inputFotoPerfil.addEventListener('change', () => {
      const archivo = inputFotoPerfil.files[0];
      if (!archivo) return;
      if (!archivo.type.startsWith('image/')) { editError.textContent = 'Elige un archivo de imagen.'; return; }
      BioImg.cuadrada(archivo, 256, 0.85).then(async (b64) => {
        if (!(await BioModera.revisarImagen(b64))) { inputFotoPerfil.value = ''; return; }
        fotoPendiente = b64;
        editError.textContent = '';
        previsualizar();
      }).catch(() => { editError.textContent = 'No se pudo leer esa imagen.'; });
    });
  }

  BioHilo.suscribir(() => {
    renderNumeros();
    const panelBuscar = document.querySelector('[data-panel="buscar"]');
    const panelPerfil = document.querySelector('[data-panel="perfil"]');
    if (panelBuscar && !panelBuscar.hidden) renderBuscar();
    if (panelPerfil && !panelPerfil.hidden) renderPerfil();
  });

  const listaTags = document.getElementById('tagsTop');
  if (listaTags) listaTags.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tag]');
    if (b) window.dispatchEvent(new CustomEvent('bio-filtrar', { detail: b.dataset.tag }));
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.tag-inline');
    if (!a) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('bio-filtrar', { detail: a.dataset.tag.toLowerCase() }));
  });

  renderNumeros();
})();

(function () {
  const t = document.getElementById('txtPublicacion');
  const c = document.getElementById('contadorPub');
  if (!t || !c) return;
  function actualizar() {
    const n = t.value.length;
    c.textContent = n + ' / 1000';
    c.classList.toggle('casi', n >= 240);
  }
  t.addEventListener('input', actualizar);
  BioHilo.suscribir(actualizar);
  const publicar = document.getElementById('btnPublicar');
  if (publicar) publicar.addEventListener('click', () => setTimeout(actualizar, 0));
  actualizar();
})();

(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var ta = $('#txtPublicacion'), comp = $('.composer'), feed = $('#feed');
  if (!ta || !comp || !feed) return;

  var BASE = ['#brotó', '#antesydespués', '#duda', '#truco'];
  var KT = 'bionyssa_etiquetas', MAX_PROPIAS = 6;
  function leerPropias() { try { var a = JSON.parse(localStorage.getItem(KT)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function guardarPropias(a) { try { localStorage.setItem(KT, JSON.stringify(a)); } catch (e) {} }
  function limpiar(t) {
    t = String(t || '').trim().replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '').slice(0, 20);
    return t ? '#' + t.toLowerCase() : '';
  }
  function esc(t) { return t.replace(/[<>&"]/g, ''); }

  var cr = document.createElement('div'); cr.className = 'chips-rapidos';
  ta.parentNode.insertBefore(cr, ta.nextSibling);

  function pintaChips() {
    var propias = leerPropias();
    cr.innerHTML = BASE.map(function (t) { return '<button type="button" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') +
      propias.map(function (t) { return '<span class="chip-propio"><button type="button" data-t="' + esc(t) + '">' + esc(t) + '</button><button type="button" class="chip-x" data-quitar="' + esc(t) + '" aria-label="Quitar ' + esc(t) + '">×</button></span>'; }).join('') +
      (propias.length < MAX_PROPIAS ? '<button type="button" class="chip-mas" data-mas="1">+ Tu etiqueta</button>' : '');
  }
  pintaChips();

  function meter(t) {
    if (!t || ta.value.toLowerCase().indexOf(t) >= 0 || ta.value.length + t.length + 2 > 1000) return;
    ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + t + ' ';
    ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
  }
  function nueva() {
    var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'chip-input'; inp.maxLength = 21; inp.placeholder = '#etiqueta'; inp.setAttribute('aria-label', 'Escribe tu etiqueta');
    var mas = $('.chip-mas', cr); if (!mas) return; mas.replaceWith(inp); inp.focus();
    var listo = false;
    function fin(ok) {
      if (listo) return; listo = true;
      var t = ok ? limpiar(inp.value) : '';
      if (t) {
        var p = leerPropias();
        if (p.indexOf(t) < 0 && BASE.indexOf(t) < 0) { p.push(t); guardarPropias(p); }
      }
      pintaChips(); if (t) meter(t);
    }
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === ',') { e.preventDefault(); fin(true); }
      if (e.key === 'Escape') fin(false);
    });
    inp.addEventListener('blur', function () { fin(true); });
  }
  cr.addEventListener('click', function (e) {
    var q = e.target.closest('[data-quitar]');
    if (q) { guardarPropias(leerPropias().filter(function (x) { return x !== q.dataset.quitar; })); pintaChips(); return; }
    if (e.target.closest('[data-mas]')) { nueva(); return; }
    var b = e.target.closest('button[data-t]'); if (b) meter(b.dataset.t);
  });
  ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('#btnPublicar').click(); } });

  var fil = document.createElement('div'); fil.className = 'filtros'; fil.setAttribute('role', 'group'); fil.setAttribute('aria-label', 'Filtrar publicaciones');
  var nota = document.createElement('p'); nota.className = 'filtro-nota'; nota.style.display = 'none';
  feed.parentNode.insertBefore(fil, feed); feed.parentNode.insertBefore(nota, feed.nextSibling);
  var filtro = '';
  function tagsDe(el) { return (el.textContent.match(/#[\p{L}\p{N}_]+/gu) || []).map(function (t) { return t.toLowerCase(); }); }
  function aplicar() {
    var ps = feed.querySelectorAll('.post'), cuenta = {};
    ps.forEach(function (p) { tagsDe($('.post-text', p) || p).forEach(function (t) { cuenta[t] = (cuenta[t] || 0) + 1; }); });
    var claves = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 8);
    if (filtro && claves.indexOf(filtro) < 0) claves.push(filtro);
    var vis = 0;
    ps.forEach(function (p) {
      var ok = !filtro || tagsDe($('.post-text', p) || p).indexOf(filtro) >= 0;
      p.style.display = ok ? '' : 'none'; if (ok) vis++;
    });
    fil.innerHTML = claves.length ? '<button type="button" class="' + (filtro ? '' : 'on') + '" data-f="">Todo</button>' + claves.map(function (t) { return '<button type="button" class="' + (t === filtro ? 'on' : '') + '" data-f="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') : '';
    fil.style.display = claves.length ? '' : 'none';
    nota.textContent = 'Nadie ha usado ' + filtro + ' todavía.';
    nota.style.display = filtro && ps.length && !vis ? '' : 'none';
  }
  fil.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; filtro = b.dataset.f; aplicar(); });
  window.addEventListener('bio-filtrar', function (e) { filtro = (filtro === e.detail) ? '' : e.detail; aplicar(); feed.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  new MutationObserver(aplicar).observe(feed, { childList: true }); aplicar();
})();
