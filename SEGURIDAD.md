# Revisión de seguridad BioNyssa

## Preparación realizada
- La entrega excluye `.git`, `node_modules` y caché `.firebase`.
- `.gitignore` refuerza exclusiones de archivos locales, secretos y credenciales.
- Se conservaron las reglas Firestore existentes para evitar cambios de permisos sin pruebas de regresión.

## Controles observados
- Las reglas exigen autenticación para varias operaciones de usuario/publicación.
- La lectura administrativa se basa en `admins/{uid}` y correo verificado.
- Se validan tipos y tamaños en varias colecciones.
- Hosting declara CSP y cabeceras contra MIME sniffing, framing y filtrado excesivo de referrer.

## Pendientes importantes
1. Revisar todos los usos de `innerHTML`; preferir `textContent`/DOM APIs para datos variables.
2. No usar `localStorage` como prueba de identidad ni autorización.
3. Verificar restricciones de API, dominios de Authentication, cuotas y alertas en Firebase Console.
4. Revisar/restringir el valor de Web3Forms que se envía desde el navegador.
5. Considerar Firebase Storage para fotos y establecer límites.
6. Planear CSP sin `style-src unsafe-inline` después de migrar estilos inline y probar Google/Firebase.
7. Añadir pruebas de reglas en Firebase Emulator y protección contra abuso.

## Alcance
Revisión estática solamente. No se ejecutaron pruebas de penetración, no se inspeccionó la consola Firebase y no se desplegó nada. La entrega no debe considerarse certificación de seguridad.
