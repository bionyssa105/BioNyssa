(function () {
  const objetos = BioJuego.residuos.map((r) => ({
    img: r.img, nombre: r.nombre, correcta: r.reciclable, dato: r.dato
  }));

  objetos.forEach((o) => { const i = new Image(); i.src = o.img; });

  const etapa = document.getElementById('etapaJuego');
  const imagen = document.getElementById('imgObjeto');
  const nombre = document.getElementById('nombreObjeto');

  BioTutorial.iniciar({
    clave: 'bionyssa_tuto_clasificar_v2',
    subtitulo: 'Limpia el planeta: clasificación de residuos',
    mision: 'La contaminación empieza en 50%. Observa cada objeto y decide si se recicla o si va a la basura.',
    opciones: [
      { tipo: 'yes', titulo: 'Reciclar', desc: 'Se puede reciclar y ayuda al planeta' },
      { tipo: 'no', titulo: 'Basura', desc: 'No se puede reciclar y contamina' }
    ],
    practica: { texto: 'Periódico usado', si: 'Reciclar', no: 'Basura', correcta: true,
      explica: 'El papel limpio y seco se puede reciclar varias veces.' },
    alBloquear: () => { etapa.classList.add('juego-bloqueado'); etapa.inert = true; },
    alLiberar: () => { etapa.classList.remove('juego-bloqueado'); etapa.inert = false; }
  });

  BioJuego.quiz({
    id: 'clasificar',
    items: objetos,
    progreso: (n, total) => 'Objeto ' + n + ' de ' + total,
    pintar: (item, el) => {
      imagen.src = item.img;
      imagen.alt = item.nombre;
      nombre.textContent = item.nombre;
    },
    explica: { si: 'Se puede reciclar.', no: 'No es reciclable.' },
    mensajeCero: 'Contaminación reducida a 0. ¡Gran trabajo clasificando!',
    mensajeBien: 'Clasificaste bien la mayoría de los residuos.'
  });
})();
