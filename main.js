/**
 * Web de presentacion de Kairos.
 *
 * Hace tres cosas, y las tres son mejoras sobre lo que ya funciona sin JavaScript:
 *  1. Rellena "que hace", las dudas frecuentes y la version con lo que dice la app
 *     (publicar/kairos.json, que se genera con `npm run web` en el repositorio gymlog).
 *  2. Ensenya el boton de instalar solo cuando el navegador permite instalarla de verdad.
 *  3. Si ya esta instalada, invita a abrirla en vez de a instalarla.
 *
 * Si este archivo no carga (o el JSON no esta), la pagina sigue siendo util: en el HTML hay
 * contenido de reserva y los pasos de instalacion escritos a mano.
 */

const ENLACE_APP = 'https://oscarmestre2011.github.io/gymlog/'
const DATOS = './publicar/kairos.json'

/** Esta abierta como app instalada (no en una pestana del navegador)? */
function estaInstalada() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** Crea un elemento con texto seguro (nada de innerHTML con datos que vengan de fuera). */
function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta)
  if (clase) el.className = clase
  if (texto) el.textContent = texto
  return el
}

/** Pinta "que hace" con lo que dice la app. */
function pintarCaracteristicas(lista) {
  const contenedor = document.getElementById('lista-caracteristicas')
  if (!contenedor || !Array.isArray(lista) || lista.length === 0) return
  contenedor.textContent = ''
  for (const item of lista) {
    const li = crear('li', 'tarjeta-caracteristica')
    li.appendChild(crear('span', 'icono', item.icono ?? '•')).setAttribute('aria-hidden', 'true')
    li.appendChild(crear('h3', null, item.titulo))
    li.appendChild(crear('p', null, item.texto))
    contenedor.appendChild(li)
  }
}

/** Pinta las dudas frecuentes con las mismas respuestas que da la app por dentro. */
function pintarPreguntas(lista) {
  const contenedor = document.getElementById('lista-preguntas')
  if (!contenedor || !Array.isArray(lista) || lista.length === 0) return
  contenedor.textContent = ''
  for (const item of lista) {
    const detalles = document.createElement('details')
    detalles.appendChild(crear('summary', null, item.pregunta))
    for (const parrafo of String(item.respuesta).split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)) {
      detalles.appendChild(crear('p', null, parrafo.trim()))
    }
    contenedor.appendChild(detalles)
  }
}

/** Deja constancia de la version de la app que se anuncia. */
function pintarVersion(datos) {
  const hueco = document.getElementById('version-pie')
  if (hueco && datos.version) {
    hueco.textContent = ` Versión ${datos.version} (${datos.fecha}).`
  }
  for (const enlace of document.querySelectorAll('a[href*="github.io/gymlog"]')) {
    enlace.setAttribute('href', datos.enlaceApp ?? ENLACE_APP)
  }
}

/** El aviso de instalacion nativo, cuando el navegador lo ofrece. */
let avisoDiferido = null

function prepararInstalacion() {
  const boton = document.getElementById('boton-instalar')
  const nota = document.getElementById('nota-instalar')
  if (!boton) return

  // Ya instalada: no tiene sentido ofrecer instalarla otra vez.
  if (estaInstalada()) {
    boton.hidden = true
    if (nota) nota.hidden = true
    const abrir = document.getElementById('abrir-app')
    if (abrir) abrir.textContent = 'Abrir Kairós'
    return
  }

  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    avisoDiferido = evento
    boton.classList.remove('oculto')
    boton.hidden = false
    if (nota) nota.hidden = false
  })

  // Si no hay aviso nativo (Safari, Firefox, o instalada hace tiempo), el boton no aparece y
  // quedan los pasos escritos: es el camino que funciona siempre.
  boton.addEventListener('click', async () => {
    if (!avisoDiferido) {
      window.location.hash = '#instalar'
      return
    }
    avisoDiferido.prompt()
    const eleccion = await avisoDiferido.userChoice
    avisoDiferido = null
    boton.hidden = true
    if (nota) nota.hidden = true
    if (eleccion?.outcome !== 'accepted') {
      // Lo ha rechazado o lo ha cerrado: los pasos siguen ahi abajo.
      const seccion = document.getElementById('instalar')
      if (seccion) seccion.scrollIntoView({ block: 'start' })
    }
  })

  window.addEventListener('appinstalled', () => {
    boton.hidden = true
    if (nota) nota.hidden = true
  })
}

/** Trae los datos de la app. Si falla, la pagina se queda con su contenido de reserva. */
async function cargarDatos() {
  try {
    const respuesta = await fetch(DATOS, { cache: 'no-cache' })
    if (!respuesta.ok) throw new Error(`kairos.json: ${respuesta.status}`)
    const datos = await respuesta.json()
    pintarCaracteristicas(datos.caracteristicas)
    pintarPreguntas(datos.preguntas)
    pintarVersion(datos)
    return datos
  } catch (error) {
    // No se rompe nada: se deja lo que hay escrito en el HTML y se avisa en la consola.
    console.warn('No se han podido cargar los datos de la app:', error)
    return null
  }
}

prepararInstalacion()
cargarDatos()
