# BioNyssa — guía técnica detallada

Documento basado en inspección estática de los archivos. Describe responsabilidades y relaciones; no implica auditoría dinámica ni garantía de ausencia de vulnerabilidades.

## Flujo general
1. El navegador abre `index.html` o una página dentro de `paginas/`.
2. HTML carga CSS y JavaScript. El orden importa porque los scripts comparten objetos globales y CSS utiliza la cascada.
3. Firebase Authentication comprueba identidad y Firestore Rules decide qué operaciones de datos se permiten.
4. `localStorage` conserva preferencias y datos de interfaz/offline, pero el usuario puede modificarlo; no sirve como autorización.
5. `js/sw.js` gestiona recursos offline y `manifest.webmanifest` configura la instalación PWA.

## Cada página HTML
- **`index.html`** — Inicio, presentación de BioNyssa, mascota y opciones de acceso.
- **`404.html`** — Página para rutas no encontradas.
- **`paginas/admin.html`** — Panel de administración; la autorización real depende de Firestore Rules.
- **`paginas/comunidad.html`** — Red social: publicaciones, comentarios, likes, perfiles, búsqueda y guardados.
- **`paginas/contacto.html`** — Preguntas frecuentes y formulario enviado a Web3Forms.
- **`paginas/guia.html`** — Guía de uso y plantación.
- **`paginas/impacto.html`** — Calculadora estimada de impacto y contadores.
- **`paginas/informacion.html`** — Historia, materiales y proceso de BioNyssa.
- **`paginas/juego-clasificar.html`** — Juego de clasificación de residuos.
- **`paginas/juego-memorama.html`** — Juego de memoria de parejas.
- **`paginas/juego-trivia.html`** — Trivia ecológica.
- **`paginas/login.html`** — Inicio de sesión por correo o Google.
- **`paginas/menu.html`** — Menú principal y navegación.
- **`paginas/mi-planta.html`** — Seguimiento de siembra, riego y cuidados.
- **`paginas/minijuegos.html`** — Catálogo de juegos.
- **`paginas/offline.html`** — Pantalla y juego para falta de conexión.
- **`paginas/recuperar.html`** — Recuperación de contraseña con Firebase Authentication.
- **`paginas/registro.html`** — Registro de usuario.

## Cada archivo JavaScript
- **`js/acceso-google.js`** — Autenticación con Google y presentación de errores.
- **`js/almacen-por-cuenta.js`** — Separa almacenamiento local por cuenta y migra datos de invitado.
- **`js/cierre.js`** — Inicialización de comportamiento compartido al final de las páginas.
- **`js/cuentas.js`** — Coordina registro/login y perfiles locales; no debería guardar contraseñas.
- **`js/firebase-base.js`** — Configuración pública de Firebase y carga diferida de Auth/Firestore.
- **`js/ir-al-menu.js`** — Redirección al menú según estado local.
- **`js/juego-clasificar-residuos.js`** — Lógica del juego de clasificación.
- **`js/juego-memorama-verde.js`** — Lógica del memorama.
- **`js/juego-sin-conexion.js`** — Juego offline y récord local.
- **`js/juego-trivia-salva-al-planeta.js`** — Preguntas y lógica de trivia.
- **`js/juegos-base.js`** — Funciones compartidas de los minijuegos y puntuación.
- **`js/moderacion-de-contenido.js`** — Filtros y validación del texto del lado cliente; no sustituye moderación servidor.
- **`js/notificaciones.js`** — Avisos y mensajes de interfaz.
- **`js/nube-firestore.js`** — Sincronización y lectura/escritura de Firestore.
- **`js/nucleo.js`** — Funciones compartidas de tema, navegación, avisos, sesión visual, puntos y retos.
- **`js/pagina-admin.js`** — Carga y muestra accesos; Firestore Rules debe ser la barrera real.
- **`js/pagina-comunidad.js`** — Feed, perfiles, publicaciones, comentarios, likes, guardados y búsqueda.
- **`js/pagina-contacto.js`** — Valida y envía el formulario de contacto.
- **`js/pagina-guia-acordeon.js`** — Abre/cierra apartados desplegables.
- **`js/pagina-impacto-calculadora.js`** — Calcula estimaciones y actualiza metas/contadores.
- **`js/pagina-inicio.js`** — Interacciones de inicio y mascota.
- **`js/pagina-login.js`** — Formulario de inicio de sesión.
- **`js/pagina-menu-saludo.js`** — Saludo personalizado del menú.
- **`js/pagina-mi-planta.js`** — Estado, etapas y registro diario de cuidados de la planta.
- **`js/pagina-minijuegos-lista.js`** — Presentación del catálogo de juegos.
- **`js/pagina-recuperar.js`** — Flujo de recuperación de contraseña.
- **`js/pagina-registro.js`** — Validación de registro.
- **`js/sw.js`** — Caché, funcionamiento offline y actualización; versionar al publicar.
- **`js/tema-inicial.js`** — Aplica el tema antes de pintar la página.
- **`js/ver-clave.js`** — Alterna visibilidad de contraseña.

## Cada hoja de estilos CSS
- **`css/01-base.css`** — Variables de color, tipografía, temas y estilos base.
- **`css/02-comunidad.css`** — Estilos de comunidad.
- **`css/02-contacto.css`** — Estilos de contacto.
- **`css/02-guia-y-mi-planta.css`** — Estilos de guía y planta.
- **`css/02-historia.css`** — Estilos de historia.
- **`css/02-impacto.css`** — Estilos de impacto.
- **`css/02-inicio-y-menu.css`** — Estilos de inicio y menú.
- **`css/02-login-y-registro.css`** — Estilos de autenticación.
- **`css/02-minijuegos-y-juegos.css`** — Estilos de minijuegos.
- **`css/03-comun-parte-1.css`** — Componentes compartidos.
- **`css/04-comunidad-columnas-laterales.css`** — Columnas laterales de comunidad.
- **`css/05-comun-parte-2.css`** — Segunda parte de componentes compartidos; el orden de carga importa.
- **`css/06-barra-y-adaptacion-a-pantallas.css`** — Barra de navegación y diseño adaptable.
- **`css/07-comunidad-red-social.css`** — Componentes de la red social.
- **`css/09-ajustes-juegos-y-planta.css`** — Ajustes finales de juegos y planta.

## Configuración y recursos
- **`firebase.json`**: configura Hosting, cabeceras de seguridad, CSP, redirecciones y despliegue de reglas/índices.
- **`firestore.rules`**: define permisos por colección. `admins/{uid}` requiere identidad autenticada, correo verificado y documento de administrador; la escritura de admins está bloqueada desde el cliente.
- **`firestore.indexes.json`**: índices de consultas Firestore.
- **`.firebaserc`**: proyecto Firebase seleccionado; comprobar antes de publicar.
- **`manifest.webmanifest`**: nombre, iconos y propiedades PWA.
- **`robots.txt`**: instrucciones para rastreadores, no control de acceso.
- **`sitemap.xml`**: URLs ofrecidas a buscadores.
- **`_headers`**: configuración adicional de cabeceras; verificar las cabeceras realmente servidas en Hosting.
- **`assets/`**: imágenes, iconos, audio y otros recursos. Mantener nombres/rutas al moverlos.
- **`package.json` / `package-lock.json`**: dependencias JavaScript; actualmente no hay scripts de pruebas o lint.
- **`.gitignore`**: evita versionar dependencias, secretos y artefactos locales.
- **`README.md`**: descripción funcional e instrucciones de uso/despliegue.
- **`GUIA.md`**: guía previa abreviada.
- **`GUIA_DETALLADA.md`**: este inventario ampliado.
- **`SEGURIDAD.md`**: resumen de controles y pendientes de seguridad.

## Seguridad: lectura crítica
- La clave `apiKey` de Firebase en `js/firebase-base.js` es pública por diseño. La seguridad depende de Firebase Authentication, reglas de Firestore, cuotas y configuración de dominios/API en la consola.
- `BioSesion` de `nucleo.js` guarda información visual en `localStorage`. Se puede falsificar y no demuestra identidad. No conceder privilegios basándose solo en ese objeto.
- Hay usos de `innerHTML` en `nucleo.js`, `pagina-comunidad.js`, `pagina-mi-planta.js`, `juegos-base.js` y otros scripts. Cuando se incorporen datos variables, usar `textContent`, nodos DOM o escape estricto; nunca insertar HTML de usuario sin sanitizar.
- La CSP en `firebase.json` incluye `style-src unsafe-inline` por compatibilidad. Retirarlo requiere migrar estilos inline y probar Firebase/Google Auth.
- Fotos Base64 pueden producir documentos grandes; considerar Firebase Storage con reglas específicas y límites.
- Las reglas de Firestore validan estructura y permisos, pero no ofrecen por sí solas un límite de frecuencia sólido. Añadir controles antiabuso donde sea necesario.
- El valor de Web3Forms en el JavaScript cliente será visible en el navegador. Restringirlo en el proveedor si es posible y rotarlo ante abuso.
- No crear `admins/{uid}` desde código público. Crear el documento manualmente en consola y comprobar correo verificado.
- Se conservaron las reglas actuales para no romper permisos sin pruebas. No se ejecutó auditoría dinámica ni se inspeccionó la consola Firebase; estos puntos son tareas de revisión, no correcciones certificadas.

## Pruebas antes de publicar
1. Probar todas las páginas en móvil/escritorio, temas, navegación, PWA y offline.
2. Probar registro, login, Google, recuperación y sesión invitada.
3. Probar publicaciones, comentarios, likes, guardados, fotos y borrado con dos cuentas.
4. Verificar que una cuenta normal no puede leer `accesos` ni abrir datos administrativos; solo la cuenta admin autorizada debe poder hacerlo.
5. Probar reglas con Firebase Emulator: UID ajeno, campos inesperados, tamaños excesivos y borrado de terceros.
6. Revisar consola de navegador y solicitudes de red.
7. Publicar reglas y Hosting por separado después de pruebas.
