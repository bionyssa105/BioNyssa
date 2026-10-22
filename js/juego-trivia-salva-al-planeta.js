(function () {
  const preguntas = [
    { texto: '¿Usar bolsa reutilizable?', correcta: true,
      dato: 'Una sola bolsa de tela puede reemplazar cientos de bolsas de plástico de un solo uso.' },
    { texto: '¿Reciclar plástico?', correcta: true,
      dato: 'Reciclar plástico evita que termine en ríos y mares, y ahorra materia prima nueva.' },
    { texto: '¿Ahorrar agua?', correcta: true,
      dato: 'Cerrar la llave al enjabonarte o cepillarte los dientes ahorra varios litros cada vez.' },
    { texto: '¿Usar bicicleta?', correcta: true,
      dato: 'Moverte en bici no emite gases contaminantes y, de paso, es ejercicio.' },
    { texto: '¿Tirar basura en la calle?', correcta: false,
      dato: 'La basura tapa las coladeras, provoca encharcamientos y acaba arrastrada a ríos y mares.' },
    { texto: '¿Apagar las luces al salir?', correcta: true,
      dato: 'Apagar lo que no usas baja el consumo de electricidad y lo que pagas de luz.' },
    { texto: '¿Separar la basura?', correcta: true,
      dato: 'Separar orgánicos y reciclables hace mucho más fácil que los materiales se aprovechen.' },
    { texto: '¿Usar demasiado plástico?', correcta: false,
      dato: 'Muchos plásticos tardan cientos de años en degradarse y se rompen en microplásticos.' },
    { texto: '¿Plantar árboles?', correcta: true,
      dato: 'Los árboles absorben dióxido de carbono, dan sombra y son casa de aves e insectos.' },
    { texto: '¿Dejar abierta la llave del agua?', correcta: false,
      dato: 'Una llave abierta desperdicia litros de agua limpia en pocos minutos.' }
  ];
  const etapa = document.getElementById('etapaJuego');
  BioTutorial.iniciar({
    clave: 'bionyssa_tuto_trivia_v2',
    subtitulo: 'Salva al planeta: trivia ecológica',
    mision: 'La contaminación empieza en 50%. Responde si cada acción ayuda o daña al planeta para reducirla.',
    opciones: [
      { tipo: 'yes', titulo: 'Sí', desc: 'Es una acción que ayuda al planeta' },
      { tipo: 'no', titulo: 'No', desc: 'Es una acción que daña al planeta' }
    ],
    practica: { texto: '¿Cerrar la llave mientras te cepillas los dientes?', si: 'Sí', no: 'No', correcta: true,
      explica: 'Cerrar la llave ahorra hasta 12 litros de agua por lavado.' },
    alBloquear: () => { etapa.classList.add('juego-bloqueado'); etapa.inert = true; },
    alLiberar: () => { etapa.classList.remove('juego-bloqueado'); etapa.inert = false; }
  });
  BioJuego.quiz({
    id: 'trivia',
    items: preguntas,
    progreso: (n, total) => 'Pregunta ' + n + ' de ' + total,
    pintar: (item, el) => { el.pregunta.textContent = item.texto; },
    explica: { si: 'Sí, ayuda al planeta.', no: 'No, daña al planeta.' },
    mensajeCero: 'Contaminación reducida a 0. ¡Gran trabajo!',
    mensajeBien: 'La contaminación se mantuvo bajo control.'
  });
})();
