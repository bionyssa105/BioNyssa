# BioNyssa

**Un desecho que nace.**

BioNyssa es una página web sobre una bolsa orgánica y biodegradable que en lugar de tirarse a la basura se siembra y se convierte en planta. La hicimos para que la gente conozca el producto, aprenda a cuidar el medio ambiente y se divierta en el proceso.

Sitio: *(https://bionyssa-bc317.web.app/)*

## Qué tiene la página

- **Guía de uso:** explica paso a paso cómo sembrar la bolsa.
- **Mi planta:** sirve para llevar el seguimiento de tu planta (fecha de siembra, riegos, etapas, diario e insignias).
- **Nuestro impacto:** una calculadora que muestra qué cambia cuando una bolsa se siembra en vez de tirarse.
- **Minijuegos:** tres juegos con puntos y rachas.
  - Salva al planeta (trivia de sí o no)
  - Limpia el planeta (clasificar residuos)
  - Memorama verde
- **Comunidad:** se pueden hacer publicaciones y comentar, con filtro de groserías.
- **Cuentas:** registro e inicio de sesión con correo o con Google, y recuperación de contraseña.
- **Contacto:** formulario para mandarnos dudas y una sección de preguntas frecuentes.
- **Sin internet:** las páginas se guardan en el celular y se pueden abrir sin conexión. Para entrar a la cuenta, publicar o mandar el formulario sí se necesita internet. Además hay un juego secreto que solo sale cuando se cae la red.
- Tema claro y oscuro.

## Con qué está hecha

- HTML, CSS y JavaScript, sin frameworks
- Firebase (Authentication, Firestore y Hosting)
- Web3Forms para que el formulario de contacto llegue por correo
- Service Worker y manifest para que se pueda instalar como app y abrir las páginas sin internet

## Cómo está organizada

```
BioNyssa_WEB/
├── index.html                   la página de inicio
├── 404.html                     página de error
├── paginas/                     todas las demás páginas (menú, guía, minijuegos, ...)
├── css/                         los estilos (el número del nombre es el orden en que cargan)
├── js/                          los scripts, uno por página más los que comparten todas
├── assets/                      imágenes, iconos y sonidos
├── manifest.webmanifest         datos para instalarla como app
├── firebase.json                configuración de Hosting
└── firestore.rules              reglas de la base de datos
```

En `MAPA.md` está explicado archivo por archivo qué hace cada CSS y JS.

## Cómo probarla en tu computadora

1. Descarga o clona el repositorio:
   ```bash
   git clone https://github.com/bionyssa105/BioNyssa.git
   ```
2. Abre la carpeta en VS Code.
3. Abre `index.html` con la extensión **Live Server**.

Con Live Server todo funciona menos el modo sin conexión, porque ese necesita los encabezados de Firebase Hosting.

Para instalarla como app, abre la página en Chrome (ya subida a internet) y toca "Instalar" o "Agregar a la pantalla de inicio".

## Cómo subirla

```bash
firebase login
firebase deploy
```
