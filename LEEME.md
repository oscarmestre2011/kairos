# Kairós — web de presentación

Página que presenta la app **Kairós** y explica cómo instalarla en el móvil.
Dirección publicada: **https://oscarmestre2011.github.io/kairos/**

No es la app. La app está en **https://oscarmestre2011.github.io/gymlog/** y su código en
`../gymlog`.

## Qué hay aquí

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La página. Todo el texto está aquí. |
| `styles.css` | Los estilos. Paleta y aire de la app (fondo `#0f1115`, verde `#4ade80`). |
| `main.js` | Trae los datos de la app, pinta las tarjetas y las dudas, y hace funcionar el botón de instalar. |
| `publicar/kairos.json` | **Generado. No se toca a mano.** Versión, características y dudas. |
| `publicar/apoyo.json` | **Generado. No se toca a mano.** Enlace de donación, importes y textos. |
| `assets/` | Capturas de la app e iconos. Las capturas se recortan de `../gymlog/capturas/`. |
| `herramientas/recortar-capturas.ps1` | El script que recorta y reduce esas capturas. |
| `404.html` | Lo que se ve si alguien escribe mal una dirección. |
| `robots.txt`, `sitemap.xml` | Para que los buscadores encuentren la página. |
| `.nojekyll` | Le dice a GitHub Pages que publique los archivos tal cual, sin procesarlos. |

## Cómo se mantiene al día

La regla es que **la web no inventa nada**: lo que cuenta sale de la app.

- El número de versión y las dudas frecuentes vienen de `../gymlog/src/lib/ayuda.ts` y
  `../gymlog/src/lib/changelog.ts`, los mismos archivos que usa la app por dentro.
- Las características salen de `../gymlog/src/lib/kairos.ts`.
- El **apoyo voluntario** (enlace de PayPal e importes) también sale de `kairos.ts`, y los textos
  son los mismos que enseña la app en Ajustes. Las tres reglas que lo mantienen siendo una donación
  y no una venta están en ese archivo y vigiladas por pruebas: **no desbloquea nada, no desgrava y
  no promete nada a cambio**. No las cambies sin leer los comentarios de `kairos.ts`.
- Para regenerar los dos archivos después de tocar la app:

```
cd "../gymlog"
npm.cmd run web
```

Ese comando está en el repositorio de la app, en `scripts/generar-web.mjs`, y comprueba que salgan
al menos 5 características, 10 preguntas y un enlace de donación con buena pinta antes de escribir
nada.

## Cómo se prueba

Desde el repositorio de la app:

```
cd "../gymlog"
npm.cmd run test:web
```

Levanta un servidor local y abre la página en un navegador de verdad (escritorio, móvil Android,
iPhone y sin JavaScript). Comprueba que no hay errores ni archivos que falten, que las capturas
cargan, que el texto tiene contraste suficiente, que nada se desborda a lo ancho en un móvil y que
la web entera pesa menos de 600 KB. Deja capturas de revisión en `../gymlog/.tmp-web/`.

Si la carpeta de la web no está al lado de la de la app, se le puede pasar la ruta:

```
node scripts/pruebas-web.mjs "D:\ruta\a\kairos-web"
```

## Cómo se publica

Es un repositorio de GitHub Pages: **basta con subir los cambios a `main`**. No hay que compilar
nada. En un minuto o dos aparece en la dirección de arriba.

```
git add -A
git commit -m "lo que sea"
git push
```

## Lo que no se puede cambiar sin romper cosas

- **El nombre del repositorio** (`kairos`): cambiarlo cambia la dirección publicada, y esa dirección
  ya estará repartida.
- **`kairos.json`, `assets/` y demás rutas relativas**: todo se pide con `./`, así que la web
  funciona igual en `oscarmestre2011.github.io/kairos/` que en un dominio propio, sin tocar nada.
