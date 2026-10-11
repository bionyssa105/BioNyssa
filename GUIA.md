# Guía de archivos de BioNyssa

Las rutas de los HTML de `paginas/` usan `../css` y `../js`; index.html y 404.html usan `css/` y `js/`.

## JS que carga casi todo el sitio
- `tema-inicial.js`: pone modo claro u oscuro antes de pintar la página.
- `almacen-por-cuenta.js`: guarda datos en el navegador separados por cuenta.
- `nucleo.js`: lo que usan todas las páginas (comun, avisos, efectos, puntos, retos, sesion y el registro del service worker que avisa cuando no hay internet). Al final tiene el efecto de luz que sigue al cursor en las tarjetas del menú y de los juegos.
- `firebase-base.js`: configuración de Firebase y cuenta de usuario (antes firebase-config y firebase-cuenta).
- `nube-firestore.js`: guarda y lee los datos en Firestore.
- `cierre.js`: se carga al final. Junta las transiciones entre páginas, el análisis de visitas y la animación de tarjetas (antes transiciones-de-pagina, analiticas y animaciones).
- `sw.js`: service worker para que el sitio funcione sin red. Si cambias archivos, sube el número de versión de `V` y `E` en sus dos primeras líneas.

## JS de una sola página
- `pagina-comunidad.js` (comunidad.html), `pagina-mi-planta.js` (mi-planta.html), `pagina-minijuegos-lista.js` (minijuegos.html), `pagina-impacto-calculadora.js` (impacto.html), `pagina-contacto.js` (contacto.html), `pagina-guia-acordeon.js` (guia.html y contacto.html), `pagina-menu-saludo.js` (menu.html), `pagina-admin.js` (admin.html), `pagina-login.js`, `pagina-registro.js`, `pagina-recuperar.js`, `pagina-inicio.js` (index.html: mascota y acceso).
- Juegos: `juegos-base.js` (lo común), `juego-clasificar-residuos.js`, `juego-memorama-verde.js`, `juego-trivia-salva-al-planeta.js` y `juego-sin-conexion.js` (el juego de offline.html).
- Cuentas: `cuentas.js`, `acceso-google.js`, `ver-clave.js`, `ir-al-menu.js`, `moderacion-de-contenido.js` (revisa fotos y textos), `notificaciones.js`.

## CSS (se cargan en este orden)
- `01-base.css`: colores, tipografías y modo claro/oscuro. Para cambiar la paleta, edita las variables al inicio.
- `02-*.css`: estilos de una sola página (comunidad, contacto, guia-y-mi-planta, historia, impacto, inicio-y-menu, login-y-registro, minijuegos-y-juegos).
- `03-comun-parte-1.css` y `05-comun-parte-2.css`: botones, tarjetas, barra y formularios de todo el sitio. Al final de la 05 está el efecto de luz de las tarjetas.

Estos CSS no se pueden unir sin cambiar cómo se ven las páginas, porque comparten reglas y el orden de carga decide cuál gana.
- `04-comunidad-columnas-laterales.css` y `07-comunidad-red-social.css`: solo comunidad.
- `06-barra-y-adaptacion-a-pantallas.css`: ajustes para celular, tablet y computadora.
- `09-ajustes-juegos-y-planta.css`: minijuegos y Mi planta; se carga al final y gana sobre los demás.

## Cuando cambies algo
1. Para un color o una fuente, empieza por `01-base.css`.
2. Para algo de una sola página, abre el archivo `02-*.css` o `pagina-*.js` que lleva su nombre.
3. Sube la versión en `sw.js` y publica con `firebase deploy`.
