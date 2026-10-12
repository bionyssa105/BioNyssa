# BioNyssa

Un desecho que nace.

BioNyssa es una página web sobre una bolsa orgánica y biodegradable que no se tira: se siembra y se vuelve planta. La hicimos para que la gente conozca el producto, aprenda a cuidar el medio ambiente y se divierta un rato.

Sitio: https://bionyssa-bc317.web.app/

## Qué busca la página

- Enseñar a usar la bolsa: dónde plantarla, cómo regarla y qué esperar.
- Que la gente le dé seguimiento a su planta en lugar de olvidarla.
- Mostrar con números qué cambia cuando una bolsa se siembra en vez de tirarse.
- Enseñar a cuidar el medio ambiente jugando.
- Crear una comunidad donde cada quien cuente cómo le va.
- Contar de dónde viene BioNyssa y cómo se hace la bolsa.

## Todo lo que tiene la página

**Inicio.** Presenta la bolsa, con botones para iniciar sesión, crear cuenta o explorar como invitado. Ahí saluda Bio, la mascota.

**Menú.** Es el centro del sitio: desde ahí se llega a todas las secciones. Si estás de invitado te invita a crear cuenta, y si te registras conservas los puntos que llevas.

**Guía de uso.** Cinco pasos, de la tierra a la planta: dónde plantarla o desecharla, cómo plantarla, cómo lograr una buena germinación, cómo mantener el retoño y recomendaciones. Cada paso se abre para ver sus consejos.

**Información (Nuestra historia).** Cuenta cómo nació BioNyssa, el proceso de creación en cuatro pasos (materiales, tejido, confección y control de calidad), los materiales ecológicos que usa y una línea de tiempo.

**Mi planta.** Para llevar el seguimiento de tu planta. Registras la fecha de siembra y le puedes poner nombre. Cada vez que la riegas tocas "La regué hoy", y marcas los cuidados del día (sol, plagas, hojas secas) para ganar puntos. Te muestra en qué etapa va (semilla, germinando, brote y planta), cuánto falta para la siguiente y qué le toca hacer. Bio te avisa cómo se siente. Se guarda en tu cuenta.

**Nuestro impacto.** Una calculadora: eliges cuántas bolsas usas al mes y a cuántos años, y te dice cuántas bolsas dejan de acabar en la basura, cuántas plantas serían posibles y cuántos gramos de plástico no se quedan en el ambiente. Es una estimación, no una medición exacta. También tiene un contador de las bolsas que sembraste tú y otro con las de todos (este suma solo si tienes sesión iniciada), el camino de una bolsa y una comparación entre una bolsa común y BioNyssa.

**Minijuegos.** Tres juegos con puntos y rachas:
- Salva al planeta: trivia de sí o no.
- Limpia el planeta: clasificar residuos.
- Memorama verde: encontrar las parejas.

**Comunidad.** Una red social pequeña para contar cómo va tu bolsa. Se puede publicar texto y una foto (hasta 1000 caracteres), comentar, dar like y guardar publicaciones. Hay pestañas de Recientes, Populares y Guardadas, buscador, tendencias y perfil editable (foto, nombre, usuario y descripción). Los textos y las fotos pasan por un filtro de groserías. Sin cuenta solo se puede mirar.

**Contacto.** Preguntas frecuentes y un formulario (hasta 500 caracteres) cuyo mensaje nos llega por correo.

**Cuentas.** Registro e inicio de sesión con correo o con Google, y recuperar la contraseña por correo. También se puede entrar como invitado sin registrarse; si después creas la cuenta, no pierdes lo que hiciste.

**Administrador.** Una página que solo ve el administrador, con las personas registradas, cuándo entraron por última vez y cuántas visitas llevan.

**Sin conexión.** Las páginas ya visitadas se abren sin internet. Si la red se cae, aparece un aviso y un juego escondido. Para iniciar sesión, publicar o enviar el formulario sí se necesita conexión.

**Extras.** Tema claro y oscuro, se ve horizontal en computadora y vertical en celular, y se puede instalar como app.

## Con qué está hecha

HTML, CSS y JavaScript, sin frameworks. Para las cuentas y los datos usa Firebase (Authentication y Firestore), se publica en Firebase Hosting y el formulario de contacto llega por correo con Web3Forms. El modo sin conexión y la instalación como app los hace un service worker (`js/sw.js`) junto con `manifest.webmanifest`.

## Carpetas

```
index.html        inicio
404.html          página de error
paginas/          el resto de las páginas
css/              estilos (el número del nombre es el orden en que cargan)
js/               scripts: uno por página y los que usan todas
assets/           imágenes, iconos y sonidos
firestore.rules   reglas de la base de datos
firebase.json     configuración de Hosting
GUIA.md           qué hace cada CSS y JS
```

## Probarla en tu computadora

```bash
git clone https://github.com/bionyssa105/BioNyssa.git
```

Abre la carpeta en VS Code y corre `index.html` con la extensión Live Server. Casi todo funciona así; lo único que no es el modo sin conexión, porque necesita los encabezados de Firebase Hosting.

## Publicar cambios

```bash
git add .
git commit -m "lo que cambiaste"
git pull --rebase
git push

firebase login                          # solo la primera vez
firebase deploy --only hosting          # páginas, estilos y scripts
firebase deploy --only firestore:rules  # solo si cambiaste las reglas
```

## Cosas que conviene saber

- Si cambias archivos y en el celular se siguen viendo los viejos, sube el número de versión (`V` y `E`) al inicio de `js/sw.js` antes de publicar.
- El administrador no está escrito en el código. Es un documento `admins/<uid>` que se crea a mano en Firestore desde la consola de Firebase.
- Las claves de Firebase y de Web3Forms que se ven en el código son públicas por diseño; los datos se protegen con `firestore.rules`.
- No subas archivos `.env`, llaves privadas ni cuentas de servicio de Firebase.
- Las colecciones nuevas necesitan su regla en `firestore.rules`; si no, la página no podrá leerlas ni escribirlas.

## Contacto

Para dudas o sugerencias, usa el formulario de la sección Contacto del sitio.

## Documentación técnica y seguridad

- `GUIA_DETALLADA.md`: inventario por página, JavaScript, CSS y configuración.
- `SEGURIDAD.md`: controles observados, riesgos y pruebas recomendadas.

La revisión es estática y no sustituye las pruebas de reglas con Firebase Emulator.
