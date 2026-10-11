# Mapa de archivos

## CSS (carpeta css)

Los CSS llevan número al inicio, que es el orden en que se cargan. Si dos reglas chocan, gana la del número más alto.

En todas las páginas:
- 01-base.css: colores, tipografía y reglas básicas
- 03-comun-parte-1.css: tema oscuro, medidas de escritorio, transiciones, componentes y paleta de botones y tarjetas (los colores de las tarjetas del menú están en la parte de paleta verde)
- 05-comun-parte-2.css: animaciones de aparición y efectos al pasar el mouse
- 06-barra-y-adaptacion-a-pantallas.css: barra superior, menú inferior del celular y ajustes por tamaño de pantalla (todas menos index.html)

De una sola página (empiezan con 02 y cargan justo después del 01):
- 02-inicio-y-menu.css: index.html, menu.html y 404.html
- 02-guia-y-mi-planta.css: guia.html y mi-planta.html
- 02-impacto.css: impacto.html
- 02-historia.css: informacion.html
- 02-minijuegos-y-juegos.css: minijuegos.html y los 3 juegos
- 09-ajustes-juegos-y-planta.css: además trae las portadas animadas de Minijuegos, el cursor de Bio en "Cómo se juega" y los extras de Mi planta (Bio, progreso, cuidados, camino e insignias)
- 07-comunidad-red-social.css: comunidad.html (publicaciones, comentarios y caja de publicar con estilo de red social; carga al final)
- 02-comunidad.css: comunidad.html
- 04-comunidad-columnas-laterales.css: comunidad.html (columnas de los lados)
- 02-login-y-registro.css: login.html, registro.html y contacto.html (campos del formulario)
- 02-contacto.css: contacto.html

## JS (carpeta js)

En todas las páginas:
- almacen-por-cuenta.js: separa los datos de cada cuenta y del invitado, y comprime las imágenes. Va antes que todo
- firebase-config.js, firebase-cuenta.js y nube-firestore.js: conectan la cuenta con Firebase y guardan todo en Firestore
- sitio-todas-las-paginas.js: tema claro/oscuro, ventana de acceso, menús, sonidos, avisos, puntos, retos, juego del día y sesión
- transiciones-de-pagina.js: precarga de páginas, animación al cambiar y aparición al hacer scroll

En varias páginas:
- sin-conexion.js: registra sw.js y avisa cuando se cae el internet (todas menos offline.html)
- sw.js: el Service Worker. Muestra offline.html cuando no hay internet
- moderacion-de-contenido.js: filtro de groserías e imágenes (comunidad, login y registro)
- juegos-base.js: tutorial, puntos y progreso (minijuegos y los 3 juegos)
- cuentas.js: registro y entrada con correo (login y registro)
- acceso-google.js: botón de Google (login y registro)

De una sola página:
- pagina-inicio-mascota.js y pagina-inicio-acceso.js: index.html
- pagina-menu-saludo.js: menu.html
- pagina-impacto-calculadora.js: impacto.html
- pagina-guia-acordeon.js: guia.html
- pagina-mi-planta.js: mi-planta.html
- pagina-minijuegos-lista.js: minijuegos.html
- pagina-comunidad.js: comunidad.html
- pagina-login.js, pagina-registro.js y pagina-recuperar.js: login, registro y recuperar
- pagina-contacto.js: contacto.html (formulario; la guía de preguntas reutiliza pagina-guia-acordeon.js)
- juego-clasificar-residuos.js, juego-memorama-verde.js y juego-trivia-salva-al-planeta.js: uno por juego

## Raíz

- recuperar.html: "¿Olvidaste tu contraseña?". También es a donde llega el enlace del correo
- offline.html: el juego que solo sale sin internet. No está en Minijuegos a propósito
- firebase.json: la configuración de hosting. Ahí está el encabezado que deja a js/sw.js controlar todo el sitio

## Service Worker

sw.js está dentro de js, pero necesita controlar todo el sitio. Por eso se registra con scope "./" y firebase.json manda el encabezado Service-Worker-Allowed. Si lo pruebas con Live Server, el encabezado no existe y el modo sin conexión no se activa. En Firebase Hosting sí funciona.

Si cambias offline.html o las imágenes del juego, sube el número de versión en sw.js (bio-sin-red-v5 a v6).

Al abrir offline.html (o al refrescar una página que mostró el aviso), si ya hay red de verdad, regresa solo a la página donde estabas. Si no hay red, se queda a jugar.

## Caché (sin poner ?v=2 ni Ctrl+Shift+R)

firebase.json (Firebase) y _headers (Netlify) mandan Cache-Control: no-cache. El navegador pregunta si el archivo cambió y, si no cambió, usa el que ya tiene (respuesta 304, casi instantánea). Así los cambios se ven al recargar normal y no hay que versionar nada. sw.js hace lo mismo con CSS, JS e imágenes y solo usa su copia guardada cuando no hay internet. El modo sin conexión (offline.html) solo sale si la página no carga y un reintento también falla. El aviso de "Se fue el internet" además comprueba con una petición real (HEAD a manifest.webmanifest) que de verdad no hay red.

## Firestore (firestore.rules)

El correo del administrador en firestore.rules (función esAdmin) tiene que ser el mismo que ADMIN_CORREOS en js/pagina-admin.js.

Se publica con `firebase deploy --only firestore:rules` o pegando el archivo en Firebase > Firestore > Reglas.

- Al registrarse (correo o Google nuevo), lo que hizo el invitado (puntos, planta, etc.) pasa a la cuenta nueva y se sube a Firebase (BioAlmacen.pasarInvitado).
- usuarios/{uid}: lo privado de cada cuenta. En datos van puntos, récords, planta, guía, retos, calculadora, bolsas sembradas, etiquetas, tema, tutoriales vistos y el récord del juego sin conexión
- perfiles/{uid}: perfil público (nombre, @usuario, descripción y foto)
- usuarios_unicos/{h_usuario}: @usuarios apartados para que no se repitan
- mensajes/{id}: mensajes del formulario de contacto. Cualquiera puede escribir, solo el administrador los lee (Firebase > Firestore)
- global/impacto: contador de bolsas sembradas entre todos. Sube de uno en uno y solo con sesión iniciada
- publicaciones/{id}: publicaciones de la comunidad, con likes/{uid} y comentarios/{id} adentro

## Etiqueta "Nuevo" en Minijuegos

Cuando agregues un juego, ponle a su tarjeta en minijuegos.html el atributo data-desde con la fecha en que lo subes, por ejemplo data-desde="2026-11-03". La etiqueta Nuevo sale los 7 días siguientes a esa fecha y después desaparece sola. Los juegos sin ese atributo nunca la llevan.

## Correos del formulario de contacto

Los mensajes siempre se guardan en Firestore (colección mensajes). Para que además lleguen a bionyssa105@gmail.com se usa EmailJS: llena el objeto EMAILJS al inicio de js/pagina-contacto.js con el Service ID, el Template ID y la Public Key de tu cuenta de EmailJS. La plantilla de EmailJS usa las variables name, email, message, title y time. Mientras estén vacíos no se manda correo.
