(() => {
  const $ = (s, raiz) => (raiz || document).querySelector(s);
  const fecha = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const lee = (k, base) => { try { return JSON.parse(localStorage.getItem(k)) || base; } catch (e) { return base; } };
  const guarda = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const RETOS = [
    ['Lleva tu bolsa reutilizable', 'Sal con una bolsa de tela o la de BioNyssa y úsala en cada compra de hoy.'],
    ['Di "sin bolsa, gracias"', 'En una compra pequeña, carga las cosas en las manos o en tu mochila.'],
    ['Separa tus residuos', 'Pon orgánicos y reciclables en contenedores distintos durante todo el día.'],
    ['Apaga lo que no uses', 'Luces de cuartos vacíos, pantallas y cargadores conectados sin nada.'],
    ['Cierra la llave', 'Mientras te lavas los dientes o enjabonas los platos, cierra el agua.'],
    ['Toma de una botella rellenable', 'Hoy no compres bebidas en envase de un solo uso.'],
    ['Riega o planta algo', 'Una planta, una semilla o tu BioNyssa. Cinco minutos bastan.'],
    ['Reutiliza un frasco o una bolsa', 'Dale una segunda vida a algo que ibas a tirar.'],
    ['Camina un trayecto corto', 'Si vas a menos de diez minutos a pie, deja el vehículo.'],
    ['Come sin desechables', 'Plato, vaso y cubiertos de los que se lavan.'],
    ['Lleva tu propio recipiente', 'Para la comida de la calle o las sobras, usa uno tuyo.'],
    ['Junta botellas PET', 'Reúne las que tengas en casa para llevarlas a reciclar.'],
    ['Compra sin empaque', 'Elige fruta y verdura suelta en lugar de la envasada.'],
    ['Usa las dos caras de la hoja', 'Antes de tirar un papel, revisa si tiene lado en blanco.'],
    ['Cuéntale a alguien de BioNyssa', 'Explícale a una persona cómo una bolsa puede volverse planta.'],
    ['Báñate un poco más rápido', 'Reduce la regadera un par de minutos.'],
    ['Arregla antes de tirar', 'Una costura, un cierre, un tornillo. Intenta repararlo.'],
    ['Recoge cinco basuras', 'Levanta cinco residuos que encuentres en la calle o el parque.'],
    ['Guarda las cáscaras', 'Sepáralas para composta en lugar de mezclarlas con la basura.'],
    ['Sin popote hoy', 'Pide tus bebidas sin popote o usa uno reutilizable.'],
    ['Lleva tu termo', 'Que tu café o tu agua viaje en tu propio vaso.'],
    ['Revisa si hay fugas', 'Mira llaves y regaderas. Una gota constante desperdicia mucha agua.'],
    ['Regala lo que ya no uses', 'Ropa, libros o juguetes que a otra persona le sirvan.'],
    ['Planea tus comidas', 'Decide qué vas a comer hoy para no desperdiciar comida.'],
    ['Lee la etiqueta', 'Escoge el producto con menos plástico entre dos parecidos.'],
    ['Comparte un consejo', 'Publica en Comunidad algo que te funcione para cuidar el ambiente.'],
    ['Aprende un dato nuevo', 'Juega un minijuego y quédate con un dato que no sabías.'],
    ['Aprovecha el agua de lavar', 'La de lavar verduras sirve para regar plantas.'],
    ['Desenchufa y sal', 'Antes de salir de casa, desconecta lo que no hace falta.'],
    ['Elige lo que dure', 'Hoy, si compras algo, prefiere lo que se puede usar muchas veces.']
  ];

  function guia() {
    const caja = $('#acordeon');
    if (!caja) return;
    const LLAVE = 'bionyssa_guia';
    const pasos = [...caja.querySelectorAll('.acc-item')];
    const hechos = lee(LLAVE, []);
    const prog = document.createElement('div');
    prog.className = 'guia-prog';
    prog.innerHTML = '<p></p><div class="nivel-barra"><b></b></div>';
    caja.parentNode.insertBefore(prog, caja);
    const barra = $('b', prog);

    function pintar() {
      const n = hechos.filter(Boolean).length;
      $('p', prog).textContent = n + ' de ' + pasos.length + ' pasos hechos';
      barra.style.width = n / pasos.length * 100 + '%';
      pasos.forEach((paso, i) => {
        paso.classList.toggle('hecho', !!hechos[i]);
        const b = $('.hacer-paso', paso);
        if (b) b.textContent = hechos[i] ? 'Desmarcar paso' : 'Ya hice este paso';
      });
    }

    pasos.forEach((paso, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-outline btn-sm hacer-paso';
      $('.acc-panel-inner', paso).appendChild(b);
      b.addEventListener('click', (e) => {
        hechos[i] = !hechos[i];
        guarda(LLAVE, hechos);
        pintar();
        if (!hechos[i]) return;
        if (window.BioHojas) BioHojas(e.clientX, e.clientY, 10);
        if (window.BioPuntos) {
          const todos = hechos.filter(Boolean).length === pasos.length;
          BioPuntos.dar(todos ? 10 : 2, todos ? 'guía completa' : 'paso hecho');
        }
      });
    });
    setTimeout(() => { barra.style.width = '0'; pintar(); }, 50);
  }

  function retoDelDia() {
    const panel = $('.timeline-panel');
    if (!panel) return;
    const tarjeta = document.createElement('div');
    tarjeta.className = 'section-card calc-card';
    panel.parentNode.insertBefore(tarjeta, panel);
    const caja = document.createElement('div');
    caja.className = 'reto-dia';
    tarjeta.appendChild(caja);

    const LLAVE = 'bionyssa_retos';
    let datos = lee(LLAVE, null);
    if (!datos || !datos.dias) datos = { dias: [], pts: [] };
    const hoy = new Date();
    const hoyTxt = fecha(hoy);
    const desde2026 = Math.round((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
    const reto = RETOS[((desde2026 * 7) % RETOS.length + RETOS.length) % RETOS.length];

    function racha() {
      let n = 0;
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      if (!datos.dias.includes(fecha(d))) d.setDate(d.getDate() - 1);
      while (datos.dias.includes(fecha(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }

    function semana() {
      const LETRAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
      let html = '';
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
        html += '<span class="rd-dia' + (datos.dias.includes(fecha(d)) ? ' on' : '') + (i === 0 ? ' hoy' : '') + '"><i></i>' + LETRAS[d.getDay()] + '</span>';
      }
      return html;
    }

    function pintar() {
      const hecho = datos.dias.includes(hoyTxt);
      const nr = racha();
      caja.innerHTML = '<div class="reto-dia-top"><h3>Reto de hoy</h3><span class="rd-fecha">' + hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) + '</span></div>' +
        '<div class="rd-cuerpo' + (hecho ? ' hecho' : '') + '"><div class="rd-txt"><strong>' + reto[0] + '</strong><span>' + reto[1] + '</span></div>' +
        '<button type="button" class="btn ' + (hecho ? 'btn-outline' : 'btn-primary') + '" id="rdBtn">' + (hecho ? 'Hecho. Deshacer' : 'Lo hice') + '</button></div>' +
        '<div class="rd-pie"><div class="rd-semana" aria-label="Últimos 7 días">' + semana() + '</div><p class="rd-stats"><b>' + nr + '</b> ' + (nr === 1 ? 'día seguido' : 'días seguidos') + ' · <b>' + datos.dias.length + '</b> en total</p></div>' +
        '<small>Mañana habrá otro reto. Cada uno que completes por primera vez ese día suma 3 puntos.</small>';

      $('#rdBtn', caja).addEventListener('click', () => {
        const i = datos.dias.indexOf(hoyTxt);
        if (i > -1) datos.dias.splice(i, 1);
        else {
          datos.dias.push(hoyTxt);
          if (!datos.pts.includes(hoyTxt)) {
            datos.pts.push(hoyTxt);
            if (window.BioPuntos) BioPuntos.dar(3, 'reto del día');
          }
        }
        datos.dias = datos.dias.slice(-60);
        datos.pts = datos.pts.slice(-60);
        guarda(LLAVE, datos);
        pintar();
      });
    }
    pintar();
  }

  function juegoDelDia() {
    const lista = $('.game-list');
    if (!lista) return;
    const JUEGOS = [['juego-trivia.html', 'Trivia: Salva al planeta'], ['juego-clasificar.html', 'Limpia el planeta'], ['juego-memorama.html', 'Memorama verde']];
    const j = JUEGOS[Math.floor(new Date() / 864e5) % 3];
    const caja = document.createElement('div');
    caja.className = 'reto';
    caja.innerHTML = '<div><h3>Juego del día</h3><p>' + j[1] + '. Juégalo y suma puntos.</p></div><a class="btn btn-primary" href="' + j[0] + '">Jugar</a>';
    lista.parentNode.insertBefore(caja, lista);
  }

  guia();
  retoDelDia();
  juegoDelDia();
})();
