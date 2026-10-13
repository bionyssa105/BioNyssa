# BioNyssa – Documentación detallada del proyecto

Este archivo explica **qué hace cada archivo**, cada página y cada script. Está pensado para que puedas modificar el sitio sin perderte. Al final hay un resumen de lo que se recortó y de lo que se arregló en seguridad.

---

## 1. Cómo funciona todo en una frase

BioNyssa es un sitio **estático** (HTML + CSS + JavaScript, sin frameworks) que se publica en **Firebase Hosting**. Las cuentas usan **Firebase Authentication**, los datos de cada persona se guardan en **Firestore** y también en `localStorage` (para que funcione rápido y sin conexión). Un **service worker** (`js/sw.js`) hace que las páginas ya visitadas abran sin internet.

**Orden en que se cargan las cosas en una página típica:**
1. `tema-inicial.js` pone el tema claro/oscuro antes de pintar (evita el parpadeo).
2. `almacen-por-cuenta.js` separa el `localStorage` por cuenta.
3. `nucleo.js` crea menú, puntos, sesión, diálogos y tema.
4. `firebase-base.js` + `nube-firestore.js` conectan con Firebase.
5. El script propio de la página (`pagina-*.js` o `juego-*.js`).
6. `cierre.js` (precarga de páginas, barra, analítica y animación de aparición).

---

## 2. Carpetas y archivos de la raíz

| Archivo | Qué hace |
|---|---|
| `index.html` | Página de inicio: presenta la bolsa, mascota Bio y botones de iniciar sesión / crear cuenta / explorar como invitado. |
| `404.html` | Página de error cuando la dirección no existe. Firebase Hosting la usa automáticamente. |
| `firebase.json` | Configuración de Hosting: qué se publica, redirecciones de `/menu.html` → `/paginas/menu.html`, **y los encabezados de seguridad** (CSP, HSTS, etc.). |
| `firestore.rules` | **Reglas de seguridad de la base de datos.** Es lo que de verdad protege los datos (ver sección 6). |
| `firestore.indexes.json` | Índices de Firestore. Está vacío porque no se necesitan. |
| `.firebaserc` | Dice a qué proyecto de Firebase se publica (`bionyssa-bc317`). |
| `.gitignore` | Archivos que Git no sube (claves privadas, `node_modules`, `.env`, caché de Firebase). |
| `manifest.webmanifest` | Datos para instalar el sitio como app (nombre, iconos, colores, atajos a Mi planta y Minijuegos). |
| `robots.txt` | Le dice a los buscadores qué no indexar (`offline.html` y `admin.html`). |
| `sitemap.xml` | Lista de páginas públicas para buscadores. |
| `README.md` | Presentación del proyecto y cómo publicarlo. |
| `DOCUMENTACION.md` | Este archivo. |
| `assets/img/` | Imágenes: logo (`logo.png`, `logo-claro.png`, `logo-app.png`, `marca.svg`), iconos de la app (`icono-192`, `icono-512`, `icono-maskable-512`, `favicon.ico`), mascota Bio en varias poses (`mascota`, `bio-saluda`, `bio-lupa`, `bio-brazos`) y las imágenes de residuos de los juegos (`Bolsa`, `Botella`, `Lata`, `Carton`, `Pila`). |
| `assets/sonidos/` | Sonidos de los juegos: `correcto.mp3`, `incorrecto.mp3`, `ganar.mp3`, `perder.mp3`. |

---

## 3. Páginas HTML

Todas comparten la misma cabecera (fuentes, estilos, `lang="es"`) y el mismo orden de scripts descrito arriba.

| Página | Qué muestra y qué scripts/estilos usa |
|---|---|
| `index.html` | Portada con título "Un desecho que nace", mascota (`#mascota`) y botones. Estilos: `01-base`, `02-inicio-y-menu`, `03`, `05`. Scripts: `ir-al-menu` (si ya hay sesión te manda al menú), `pagina-inicio`. |
| `paginas/menu.html` | Centro del sitio. Saludo, tarjetas a todas las secciones, reto del día, juego del día, nivel y puntos. Banner para invitados (`#botonBannerInvitado`). Script: `pagina-menu-saludo`. |
| `paginas/guia.html` | Guía de uso en 5 pasos desplegables (acordeón). Script: `pagina-guia-acordeon`. |
| `paginas/informacion.html` | "Nuestra historia": origen, proceso en 4 pasos, materiales ecológicos, certificaciones y línea de tiempo. Solo contenido; estilo `02-historia`. |
| `paginas/mi-planta.html` | Contenedor vacío donde `pagina-mi-planta.js` dibuja el seguimiento de la planta (pestañas Resumen, Cuidados, Calendario, Diario, Insignias). Incluye "Cómo usar" y "Las 4 etapas". |
| `paginas/impacto.html` | Calculadora de impacto (`#impBolsas`, `#impSumar`, `#impCero`), contadores "Tu cuenta" y "Entre todos", camino de la bolsa y comparación con una bolsa común. Script: `pagina-impacto-calculadora`. |
| `paginas/minijuegos.html` | Lista de los 3 juegos con ilustración animada, récord y partidas. Script: `pagina-minijuegos-lista` (+ `juegos-base`). |
| `paginas/juego-trivia.html` | Juego "Salva al planeta" (sí/no, la contaminación sube o baja 10 %). Botones `#btnSi`, `#btnNo`, tutorial `#abrirTutorial`, dato siguiente `#datoSig`, reintentar `#btnReintentar`. |
| `paginas/juego-clasificar.html` | Juego "Limpia el planeta" (clasificar residuos). Mismos ids de botones. |
| `paginas/juego-memorama.html` | "Memorama verde" (encontrar parejas). |
| `paginas/comunidad.html` | Red social pequeña: crear publicación (`#txtPublicacion`, `#btnFoto`, `#btnPublicar`), buscador (`#inputBuscar`), perfil editable (`#editNombre`, `#editUsuario`, `#perfilBioInput`, fotos), pestañas Recientes / Populares / Guardadas, tendencias. |
| `paginas/contacto.html` | Preguntas frecuentes y formulario (`#formContacto`; campo trampa oculto `#cWeb` contra bots). |
| `paginas/login.html` | Iniciar sesión con correo (`#formLogin`) o Google. |
| `paginas/registro.html` | Crear cuenta (`#formRegistro`), contraseña mínimo 8 caracteres, o con Google. |
| `paginas/recuperar.html` | Recuperar contraseña en 5 vistas: pedir (`#vPedir`), enviado (`#vEnviado`), nueva contraseña (`#vNueva`), listo (`#vListo`), enlace inválido (`#vInvalido`). |
| `paginas/admin.html` | Panel solo para el administrador: personas registradas, último acceso y visitas. Tiene su propio `<style>` dentro. No se indexa. |
| `paginas/offline.html` | Se muestra sin internet. Trae el juego "Lluvia de reciclaje" (`#jugar`) y botón `#volver`. Tiene su propio `<style>`. |

---

## 4. Estilos (carpeta `css/`)

El número del nombre es el orden en que cargan (los que cargan después pueden sobrescribir a los anteriores). **No cambies el orden** de los `<link>` o el diseño puede cambiar.

| Archivo | Para qué sirve |
|---|---|
| `01-base.css` | Base: reinicio de estilos, tipografías, colores del tema claro (variables `--ink`, `--olive`, etc.), botones y contenedores. |
| `02-inicio-y-menu.css` | Portada (`index`), menú y 404. |
| `02-guia-y-mi-planta.css` | Acordeón de la guía y tarjetas de Mi planta (también lo usa Contacto para sus preguntas). |
| `02-impacto.css` | Calculadora, contadores, camino de la bolsa y comparación. |
| `02-historia.css` | Página "Nuestra historia". |
| `02-login-y-registro.css` | Login, registro y recuperar (formularios, panel izquierdo). |
| `02-contacto.css` | Formulario de contacto y contador de caracteres. |
| `02-minijuegos-y-juegos.css` | Tarjetas de minijuegos y pantallas de los 3 juegos. |
| `02-comunidad.css` | Comunidad: publicaciones, comentarios, perfil. |
| `03-comun-parte-1.css` | Estilos comunes: **tema oscuro** (variables), barra superior, tarjetas, modales, toasts, niveles. |
| `04-comunidad-columnas-laterales.css` | Columnas laterales de Comunidad (tendencias, perfil, sugerencias). |
| `05-comun-parte-2.css` | Más estilos comunes: animaciones, diálogos, accesibilidad, ajustes por tema. |
| `06-barra-y-adaptacion-a-pantallas.css` | Barra superior flotante y adaptación a pantallas (escritorio horizontal / celular vertical). |
| `07-comunidad-red-social.css` | Apariencia de red social de Comunidad. |
| `09-ajustes-juegos-y-planta.css` | Ajustes finales de juegos y Mi planta (pestañas, animaciones de portadas). |

---

## 5. Scripts (carpeta `js/`)

### 5.1 Base que usan casi todas las páginas

**`tema-inicial.js`** (5 líneas). Lee `bionyssa_tema` y pone `data-theme` en `<html>` antes de que se pinte la página.

**`almacen-por-cuenta.js`**. Cambia `localStorage.getItem/setItem/removeItem` para que toda clave que empiece con `bionyssa_` se guarde como `clave@<idDeCuenta>` (o `@invitado`). Así cada cuenta tiene sus propios datos en el mismo navegador. Las claves compartidas (`bionyssa_tema`, `_sesion`, `_cuentas`, `_publicaciones`, `_perfiles`) no se separan. Exporta:
- `BioAlmacen.pasarInvitado(id)`: pasa lo que hizo el invitado a la cuenta recién creada.
- `BioAlmacen.limpiar(id)`: borra los datos locales de una cuenta.
- `BioImg.comprimir(origen, max, calidad)` y `BioImg.cuadrada(origen, lado, calidad)`: reducen y recortan imágenes a JPEG (para fotos de publicaciones y perfil).

**`nucleo.js`** (el más grande). Exporta cinco objetos:
- `BioComun`: tema claro/oscuro (`alternarTema`, botones de tema), **menú superior** de escritorio y celular (`inyectarNavEscritorio`, `inyectarNavMovil`), sonidos (`reproducir`), generar `@usuario` desde un nombre (`usuarioDesdeNombre`), color de avatar, `esInvitado`, **ventana "Crear mi cuenta"** (`mostrarModalAuth`), **diálogos** (`dialogo({titulo, mensaje, boton, cancelar, tipo})` devuelve una promesa; usa `textContent`, no es vulnerable a HTML), detección de falta de red real (redirige a `offline.html`).
- `BioToast(texto)`: avisos pequeños.
- `BioHojas`: hojas decorativas animadas.
- `BioPuntos`: sistema de puntos y **niveles** (Semilla 0, Brote 30, Planta 80, Árbol 160). Pinta los chips de puntos y la ventana "Tu nivel".
- `BioSesion`: `obtener`, `iniciar`, `cerrar`, `entrarInvitado`, `iniciales`, `pintarSaludo`. La sesión local vive en `bionyssa_sesion`.
También contiene el **reto del día** y el **juego del día** del menú, la racha semanal y el botón de "subir".

**`firebase-base.js`**. Guarda la configuración pública de Firebase (`BIO_FIREBASE`) y carga el SDK desde `gstatic.com` solo cuando hace falta. Exporta `BioFirebase`: `configurado`, `nucleo()` (app + auth + Firestore con caché local), `auth()`, `enviarReset`, `verificarCodigo`, `confirmarReset`, `entrar` y `sincronizar` (inicia sesión o crea la cuenta en Firebase).

**`nube-firestore.js`** (`BioNube`). Sincroniza todo lo local con Firestore **por cuenta**:
- Colecciones que usa: `usuarios` (datos privados: puntos, progreso, planta…), `perfiles` (perfil público), `usuarios_unicos` (reserva de @usuarios únicos), `publicaciones` (+ subcolecciones `likes` y `comentarios`), `accesos` (visitas, solo admin).
- Fusión inteligente de datos locales y de la nube (`fusionProgreso`, `fusionPuntos`, `fusionMax`…) para no perder récords.
- Funciones de comunidad: `publicar`, `meGusta`, `comentar`, `borrarComentario`, `borrarPublicacion`, `guardarPerfil`, `comunidad` (escucha en vivo hasta 200 publicaciones y los perfiles).
- `migrarLegacy` sube publicaciones antiguas guardadas solo en el navegador.
- `registrarAcceso` suma una visita al entrar.
- Avisa si no hay conexión con la nube (`avisarSinNube`).

**`cuentas.js`** (`BioCuentas`). Registro e inicio de sesión: `registrar`, `entrar`, `conGoogle`, `existeGoogle`. Guarda un resumen de cuentas en `bionyssa_cuentas` (nombre, correo, @usuario; **nunca la contraseña**; la contraseña solo viaja a Firebase Authentication).

**`acceso-google.js`**. Botones "Continuar con Google" (`[data-google]`): abre ventana de Google, o redirección si el navegador bloquea ventanas. En *login* si la cuenta no existe la descarta y te manda a registrarte.

**`moderacion-de-contenido.js`** (`BioModera`). Filtro de groserías en español, inglés y otros alfabetos, que detecta espacios, letras repetidas, números por letras y texto pegado (`revisarTexto`, `esOfensivo`). También revisa **imágenes** con TensorFlow.js + NSFWJS cargados desde jsDelivr (versiones fijas) y bloquea contenido sexual. ⚠️ Es un filtro del lado del navegador: sirve para guiar a las personas, pero no impide que alguien con conocimientos escriba directo a Firestore (ver sección 6).

**`notificaciones.js`** (`BioNotis`). Recordatorios de riego de Mi planta (pide permiso, guarda preferencia en `bionyssa_notis`, avisa cuando ya tocó regar).

**`ver-clave.js`**. Botón del ojito para mostrar/ocultar contraseñas.

**`ir-al-menu.js`**. En inicio/login/registro/recuperar: si ya hay sesión te manda a `menu.html` (salvo `?inicio=1` o enlaces de recuperación `oobCode`).

**`cierre.js`**. Tres cosas: (1) **precarga** de páginas (speculation rules o `prefetch` al pasar el mouse); (2) sombra de la barra al hacer scroll y animación de errores; (3) **analítica** Google Analytics anónima (no corre en local, con "No rastrear" ni en el admin); (4) animación de aparición de tarjetas.

**`sw.js`** (service worker). Guarda páginas y archivos para modo sin conexión; muestra `offline.html` si falla la red; al tocar una notificación abre la página indicada (solo del mismo sitio). **Cuando cambies archivos, sube los números `V` y `E` del inicio** para que los celulares descarguen lo nuevo.

### 5.2 Un script por página

| Script | Qué hace |
|---|---|
| `pagina-inicio.js` | Mascota Bio de la portada: saluda y habla (`hablar`, `terminar`). |
| `pagina-login.js` | Envía `#formLogin` a `BioCuentas.entrar`; enlace "olvidé mi contraseña" hacia `recuperar.html?c=correo`. |
| `pagina-registro.js` | Valida nombre, correo, contraseñas iguales y **mínimo 8 caracteres**; revisa el nombre con `BioModera`; llama a `BioCuentas.registrar`. |
| `pagina-recuperar.js` | Flujo de recuperar contraseña con Firebase: enviar correo (con enfriamiento y reenviar), validar el código del enlace, guardar la nueva contraseña (mínimo 8). |
| `pagina-menu-saludo.js` | Saludo con tu nombre en el menú, botón de cerrar sesión y banner para invitados. |
| `pagina-guia-acordeon.js` | Abre/cierra los pasos de la guía (y las preguntas de contacto) con una pequeña onda. |
| `pagina-mi-planta.js` | Seguimiento de la planta: fecha de siembra, nombre, "La regué hoy", cuidados diarios (sol, plagas, hojas secas), etapas (semilla, germinando, brote, planta), rachas, alturas, calendario, diario, gráfica e insignias. Datos en `bionyssa_planta` y `bionyssa_planta_diario`. Todo texto del usuario pasa por `esc()` antes de pintarse. |
| `pagina-impacto-calculadora.js` | Calculadora de bolsas/plantas/gramos de plástico; contador propio (`bionyssa_sembradas`) y global (`global/impacto` en Firestore, solo suma con sesión). |
| `pagina-minijuegos-lista.js` | Récords, partidas y etiqueta "Nuevo" (desaparece a los 7 días) en las tarjetas de juegos. |
| `pagina-contacto.js` | Valida el formulario, limita a 1 envío por minuto, guarda el mensaje en Firestore (`mensajes`) **y** lo manda por correo con Web3Forms. Ignora el envío si el campo trampa `#cWeb` trae texto. |
| `pagina-comunidad.js` (`BioHilo`) | Toda la red social: crear publicación con texto/foto/#etiquetas, likes, comentarios, guardadas, pestañas, buscador de publicaciones y personas, tendencias, perfil editable. El texto se escapa con `escapeHtml()` y las fotos solo se aceptan si son `data:image/...;base64` (`fotoSegura`). |
| `pagina-admin.js` | Panel de administrador. Comprueba sesión, correo verificado y que exista `admins/<uid>`; luego lista `accesos`. Todo se pinta con `textContent`. |

### 5.3 Juegos

**`juegos-base.js`** (`BioTutorial`, `BioJuego`). Lo común a los tres juegos: tutorial con mascota, reglas, quiz genérico, barajar, confeti, estrellas, formato de tiempo, medidor de contaminación, guardado de récords y puntos (`bionyssa_progreso`), sonidos.

**`juego-trivia-salva-al-planeta.js`**. Preguntas de sí/no: cada acierto baja la contaminación 10 %, cada error la sube 10 %; ≤60 % o 0 % ganas, 100 % pierdes.

**`juego-clasificar-residuos.js`**. Clasificar residuos en el bote correcto (usa las imágenes de `assets/img`).

**`juego-memorama-verde.js`**. Memorama de parejas con reloj y conteo de movimientos; da de 1 a 3 estrellas.

**`juego-sin-conexion.js`**. "Lluvia de reciclaje" de `offline.html`; vuelve solo cuando regresa la red (`hayRed`, `conRedReal`, `salir`). Récord en `bionyssa_sin_red_record`.

---

## 6. Seguridad: cómo está protegido y qué debes saber

### Lo que protege de verdad
1. **`firestore.rules`**: cada persona solo lee/escribe lo suyo; el administrador es el documento `admins/<uid>` creado a mano en la consola (nadie lo puede escribir desde la web); se limitan tamaños y campos permitidos; las fotos deben ser `data:image`.
2. **Cabeceras en `firebase.json`**: CSP (solo se ejecutan scripts propios, de Google/Firebase y las dos librerías de moderación por ruta exacta), `X-Frame-Options: DENY`, HSTS, `nosniff`, política de referrer y permisos (sin cámara/micrófono/ubicación).
3. **Sin HTML inyectable**: el texto de las personas se escapa o se pinta con `textContent`.
4. **Contraseñas**: nunca se guardan en el sitio; solo las maneja Firebase Authentication.

### Lo que se arregló en esta versión
- **Se podía firmar publicaciones/comentarios con el @usuario de otra persona.** Ahora las reglas exigen que el `usuario` coincida con el de tu perfil (`esSuUsuario`).
- **Los "me gusta" se podían crear en publicaciones que no existen.** Ahora la publicación debe existir.
- **Las fuentes de Google no cargaban bien**: usaban `onload` en línea, que la CSP bloquea. Ahora es un `<link>` normal (y se quitó el `<noscript>` repetido).
- **El filtro de imágenes estaba bloqueado por la CSP** (jsDelivr no estaba permitido) y, como el código permite publicar si el filtro falla, **las fotos pasaban sin revisar**. Se permitió solo la ruta exacta de las dos librerías y se fijaron versiones (`tfjs@4.22.0`, `nsfwjs@4.2.1`). *No pude probarlo sin internet*: al publicar, sube una foto y revisa en la consola (F12) que no haya errores de CSP.
- **Contraseña mínima de 6 → 8** en registro y recuperar (HTML y JS).
- **CSP**: se agregó `upgrade-insecure-requests` y `*.googleusercontent.com` (fotos de perfil de Google).
- **Notificaciones**: el service worker ya solo abre direcciones del mismo sitio.
- Se corrigieron mensajes que apuntaban a un archivo que ya no existe (`firebase-config.js`).
- Se agregó `lang="es"` a las páginas.

### Pendientes que dependen de ti (no se pueden arreglar solo con código)
1. **Restringe la apiKey de Firebase** (Google Cloud Console → APIs y servicios → Credenciales): "Referentes HTTP" con `bionyssa-bc317.web.app/*`, `bionyssa-bc317.firebaseapp.com/*` y `127.0.0.1:5500/*` (pruebas). La clave es pública por diseño, pero así nadie más puede usarla.
2. **Activa App Check** (Firebase → App Check, reCAPTCHA v3) y luego "Aplicar" en Firestore: frena bots que escriben directo a la base.
3. **Web3Forms**: en su panel limita la clave a tu dominio.
4. **Moderación real**: el filtro de groserías es del lado del navegador. Para bloquearlo también en el servidor haría falta una Cloud Function (plan Blaze). Las reglas ya limitan tamaño, pero no pueden detectar groserías.
5. **`mensajes` es de escritura pública** (cualquiera puede mandar el formulario). Está limitado en tamaño y formato; con App Check mejora mucho.
6. **Falta `<!DOCTYPE html>`** en las páginas (empiezan con `<html>`), así que el navegador las muestra en "modo quirks". Se dejó igual a propósito porque agregarlo puede mover el diseño que ya ajustaste; si lo quieres, agrégalo en la línea 1 de cada HTML y revisa visualmente.
7. El administrador sigue siendo `admins/<uid>` creado a mano y exige correo verificado; si entras con correo/contraseña, verifica el correo o usa Google.

---

## 7. Qué se recortó

| Qué | Antes | Después |
|---|---|---|
| CSS (15 archivos) | 213 769 bytes | 184 962 bytes (−13.5 %) |
| Reglas CSS muertas (clases que ninguna página usa, p. ej. `.calc-*`, `.arcade-*`, `.side-*`) | 98 reglas | 0 |
| Declaraciones CSS repetidas/sobrescritas | 580 | 0 |
| `@keyframes` sin usar (`bio-brillo`, `bio-cinta`) | 2 | 0 |
| Archivos de la carpeta | incluía `node_modules`, `package*.json`, `.firebase/`, `_headers` (no se usan: el SDK se carga desde `gstatic.com` y los encabezados están en `firebase.json`), `GUIA.md` (reemplazado por este documento) | eliminados |
| Saltos de línea de Windows, líneas vacías y `;` sueltos en JS/HTML | muchos | limpiados |
| `firestore.indexes.json` | 50 líneas de comentarios de ejemplo | 4 líneas |

Se comprobó automáticamente que, para cada página, el resultado final de los estilos es idéntico al original (solo cambia lo eliminado). El JavaScript no tenía funciones sin uso, por eso solo se limpió.

---

## 8. Publicar cambios

```bash
firebase deploy --only hosting          # páginas, estilos y scripts
firebase deploy --only firestore:rules  # IMPORTANTE esta vez: las reglas cambiaron
```
Antes de publicar, sube los números `V` y `E` de `js/sw.js` si cambias más archivos (ya vienen subidos a `v16` y `v19` en esta versión).
