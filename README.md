# BioNyssa

BioNyssa es una bolsa orgánica y biodegradable que, en vez de acabar en la basura, se planta y se vuelve planta. Esta página es la parte digital del proyecto: ahí se aprende a usar la bolsa, se lleva el seguimiento de la planta, se juega y se platica con otras personas que también la están usando.

Página publicada: https://bionyssa-bc317.web.app

## Qué hay en la página

- **Inicio, registro y acceso.** Se puede entrar con correo y contraseña o con Google. También hay recuperar contraseña. Si alguien entra sin cuenta puede usar la página como invitado y sus puntos se pasan a la cuenta cuando se registra.
- **Guía de uso.** Cinco pasos, desde dónde plantar la bolsa hasta cómo cuidar el retoño. Cada paso se abre y se puede ir marcando lo que ya se hizo.
- **Información.** Cómo se hizo la bolsa y de qué está hecha.
- **Mi planta.** Aquí se anota cuándo se riega, se ve en qué etapa va la planta y qué le toca hacer después.
- **Comunidad.** Publicaciones con foto, comentarios, me gusta, búsqueda y perfil. Tiene un filtro de groserías y de imágenes.
- **Minijuegos.** Tres juegos: Salva al planeta (trivia), Limpia el planeta (clasificar residuos) y Memorama verde. Cada uno explica cómo se juega la primera vez.
- **Nuestro impacto.** Una calculadora para ver cuánto plástico se evita y un contador con lo que hemos logrado entre todos.
- **Contacto.** Preguntas frecuentes y un formulario. Los mensajes llegan al correo del proyecto y también se guardan en Firestore.
- **Puntos y niveles.** Entrar cada día, jugar y regar la planta da puntos. Los niveles son Semilla, Brote, Planta y Árbol.
- **Sin internet.** Si se cae la conexión sale un juego pequeño para no quedarse sin hacer nada, y regresa solo cuando vuelve la red.
- Modo claro y oscuro, y la página se adapta a computadora, tablet y celular.

## Con qué está hecho

HTML, CSS y JavaScript normales, sin frameworks. Lo único externo es Firebase:

- Authentication para las cuentas
- Firestore para guardar todo (puntos, plantas, publicaciones, mensajes)
- Hosting para publicar la página

Las imágenes de las publicaciones se guardan en base64 dentro de Firestore. No se usa Firebase Storage.

El formulario de contacto usa Web3Forms para mandar el correo.

## Cómo está organizado

```
index.html, menu.html, guia.html ...   las páginas
css/                                   estilos (el número es el orden en que cargan)
js/                                    scripts (pagina-* son de una sola página)
assets/                                imágenes y sonidos
firebase.json                          configuración de hosting
firestore.rules                        reglas de seguridad de la base de datos
```

En `MAPA.md` está explicado qué CSS y qué JS usa cada página, y por qué. Conviene leerlo antes de mover algo.

## Cómo probarlo en tu compu

No necesita instalar nada. Abre la carpeta en VS Code y usa la extensión Live Server sobre `index.html`.

Ojo: el modo sin conexión (el service worker) solo funciona ya publicado en Firebase, no con Live Server.

## Cómo publicarlo

Se necesita tener instalado Node.js y las herramientas de Firebase:

```
npm install -g firebase-tools
firebase login
firebase deploy --only "hosting,firestore"
```

Si `firebase login` entra con otra cuenta de Google, hay que cambiarla con `firebase login:use correo@ejemplo.com`. El proyecto de Firebase es `bionyssa-bc317`.

Cuando se cambie `offline.html` o las imágenes del juego sin conexión, hay que subir el número de versión en `js/sw.js` (por ejemplo de `bio-sin-red-v12` a `v13`) para que el navegador no se quede con la copia vieja.

## Cosas que hay que cuidar

- El correo del administrador está en dos lugares y tiene que ser el mismo: `firestore.rules` (función `esAdmin`) y `ADMIN_CORREOS` en `js/pagina-admin.js`.
- La clave de Web3Forms está en `js/pagina-contacto.js`, en la constante `CLAVE`.
- La configuración de Firebase para la web está en `js/firebase-config.js`.
- Después de cambiar `firestore.rules` hay que volver a hacer el deploy, si no los cambios no se aplican.

## Contacto

bionyssa105@gmail.com
