/**
 * Copia la app publicada dentro de la web, en la carpeta `app/`.
 *
 * Por que existe: GitHub Pages solo admite un dominio propio por repositorio. La web vive en
 * kairosentrena.com (repositorio kairos) y la app se compila en su propio repositorio (gymlog).
 * Para que las dos esten bajo el mismo nombre:
 *
 *   https://kairosentrena.com/       -> la web
 *   https://kairosentrena.com/app/   -> la app
 *
 * Se copia la app YA PUBLICADA (que es publica) en lugar de pedir permisos entre repositorios.
 *
 * Uso:  node herramientas/copiar-app.mjs [destino]
 *
 * Lo usan dos sitios: el flujo de publicacion de la web (.github/workflows/publicar.yml) y, si
 * hace falta, esta misma carpeta a mano para comprobar que la copia queda bien.
 */

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** De donde se copia la app (su publicacion). */
const ORIGEN = 'https://oscarmestre2011.github.io/gymlog/'
/** Donde se deja dentro de la web. */
const destino = resolve(process.argv[2] ?? join(fileURLToPath(new URL('.', import.meta.url)), '..', 'app'))

/* Archivos que la app necesita y que no se descubren leyendo el HTML: los pide el service worker,
 * el manifiesto o el propio codigo en tiempo de ejecucion. Si falta uno, la app funciona a medias
 * (paso con los logos del emblema: daban 404 y no se veian). */
const IMPRESCINDIBLES = [
  'manifest.webmanifest',
  'sw.js',
  'raiz.txt',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  // Estos dos los carga la app desde el codigo (cabecera, bienvenida y Ajustes), no desde el HTML.
  'logo-mark.png',
  'logo-mark-grande.png',
]

const descargados = new Set()
let bytes = 0

async function traer(ruta) {
  const limpia = ruta.replace(/^\/+/, '')
  if (descargados.has(limpia)) return null
  descargados.add(limpia)

  const respuesta = await fetch(new URL(limpia, ORIGEN), { signal: AbortSignal.timeout(30000) })
  if (!respuesta.ok) {
    // Los que no existen no son un fallo: el HTML puede mencionar cosas opcionales.
    console.warn(`  aviso: ${limpia} responde ${respuesta.status}`)
    return null
  }
  const contenido = Buffer.from(await respuesta.arrayBuffer())
  const archivo = join(destino, limpia)
  await mkdir(dirname(archivo), { recursive: true })
  await writeFile(archivo, contenido)
  bytes += contenido.length
  return { limpia, contenido }
}

/** Saca las rutas de los recursos que menciona un archivo (HTML, manifiesto o CSS). */
function rutasDe(contenido, desde) {
  const texto = contenido
    .toString('utf8')
    // .matchAll sobre un texto binario daria basura: solo se buscan patrones de ruta.
    .replace(/\0/g, '')
  const encontradas = new Set()

  // src="...", href="..." y url(...) del CSS.
  for (const m of texto.matchAll(/(?:src|href)\s*=\s*["']([^"'#?]+)["']/gi)) encontradas.add(m[1])
  for (const m of texto.matchAll(/url\(\s*["']?([^"')#?]+)["']?\s*\)/gi)) encontradas.add(m[1])
  // Rutas relativas dentro de un manifiesto ("icon-192.png") y las que empiezan por "./".
  for (const m of texto.matchAll(/"(\.\/[^"]+\.(?:png|jpg|svg|json|txt|webmanifest|js|css))"/gi)) {
    encontradas.add(m[1])
  }

  return [...encontradas]
    .map((r) => r.trim())
    .filter((r) => r && !/^(https?:)?\/\//i.test(r) && !r.startsWith('data:') && !r.startsWith('#'))
    .map((r) => {
      /*
       * Dos clases de ruta, y confundirlas fue el primer fallo de este script:
       *  - Las que empiezan por "/" ya vienen referidas a la RAIZ de la app ("/app/assets/x.js").
       *    Se les quita el prefijo de la app y se piden tal cual.
       *  - Las demas son relativas al archivo que las menciona ("./icon-192.png").
       * Unirlas otra vez daba "app/app/assets/..." y la app se copiaba sin su programa.
       */
      if (r.startsWith('/')) return r.replace(/^\/gymlog\//, '/').replace(/^\/app\//, '/')
      return '/' + join(dirname(desde), r).split('\\').join('/')
    })
    .map((r) => r.replace(/^\/+/, ''))
    .filter((r) => r && !r.startsWith('..'))
}

console.log(`Copiando la app de ${ORIGEN}\n  a ${destino}\n`)

/**
 * Reescribe las rutas del HTML para que la app funcione servida desde cualquier carpeta.
 *
 * El HTML de la app pide sus archivos con la ruta de su publicacion ("/gymlog/assets/index-x.js"),
 * que en la web NO existe: aqui la app vive en /app/. Con rutas relativas ("assets/index-x.js")
 * funciona igual en las dos direcciones, y ademas asi el service worker cubre toda la carpeta de la
 * app y se puede usar sin conexion (con rutas absolutas el navegador no las consideraria parte de
 * la misma app).
 *
 * Se cambia solo lo que apunta a la propia app. Los enlaces a la web o a PayPal se quedan como
 * estan, porque esos si tienen que ser absolutos.
 */
function reescribirHtml(html) {
  return html
    .replace(/(src|href)="\/gymlog\/([^"]*)"/g, '$1="./$2"')
    .replace(/(src|href)="\/app\/([^"]*)"/g, '$1="./$2"')
    // Los enlaces que apuntan al dominio propio tambien se quedan dentro de la app.
    .replace(/(src|href)="https:\/\/kairosentrena\.com\/app\/([^"]*)"/g, '$1="./$2"')
}

// Se empieza de cero: si no, un archivo viejo que ya no existe en la app se quedaria para siempre.
await rm(destino, { recursive: true, force: true })

const cola = ['index.html', ...IMPRESCINDIBLES]
const vistos = new Set()

while (cola.length) {
  const ruta = cola.shift()
  if (vistos.has(ruta)) continue
  vistos.add(ruta)

  const traido = await traer(ruta)
  if (!traido) continue
  console.log(`  ${ruta.padEnd(46)} ${(traido.contenido.length / 1024).toFixed(0)} KB`)

  // El HTML se reescribe despues de guardarlo, para que las rutas apunten a su propia carpeta.
  if (/\.html$/i.test(ruta)) {
    const arreglado = reescribirHtml(traido.contenido.toString('utf8'))
    await writeFile(join(destino, ruta), arreglado, 'utf8')
  }

  // De los archivos de texto se sacan mas recursos (el JS no: ahi las rutas van compiladas y
  // ademas se descubren solas por el HTML).
  if (/\.(html|webmanifest|css|json)$/i.test(ruta)) {
    for (const siguiente of rutasDe(traido.contenido, ruta)) {
      if (!vistos.has(siguiente)) cola.push(siguiente)
    }
  }
}

// Comprobacion final: los archivos sin los que la app no sirve.
const faltan = []
for (const imprescindible of IMPRESCINDIBLES) {
  try {
    await readFile(join(destino, imprescindible))
  } catch {
    faltan.push(imprescindible)
  }
}
const compilado = [...descargados].find((r) => /^assets\/index-.*\.js$/.test(r))
if (!compilado) faltan.push('assets/index-*.js')

console.log(`\n${descargados.size} archivos, ${(bytes / 1024).toFixed(0)} KB en total`)
if (faltan.length) {
  console.error(`\nFALTAN archivos imprescindibles: ${faltan.join(', ')}`)
  process.exit(1)
}
console.log('La app copiada esta completa (manifiesto, service worker y compilacion).')
