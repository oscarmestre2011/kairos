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
/** El apoyo y los datos de la app van en archivos distintos: si uno falla, el otro sigue en pie. */
const DATOS_APOYO = './publicar/apoyo.json'

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

/**
 * Deja constancia de la version de la app que se anuncia.
 */
function pintarVersion(datos) {
  const hueco = document.getElementById('version-pie')
  if (hueco && datos.version) {
    hueco.textContent = ` Versión ${datos.version} (${datos.fecha}).`
  }
  for (const enlace of document.querySelectorAll('a[href*="github.io/gymlog"]')) {
    enlace.setAttribute('href', datos.enlaceApp ?? ENLACE_APP)
  }
}

/**
 * Botones de donacion.
 *
 * Los mismos botones van en varios sitios (en la portada junto al boton de descarga, al final de
 * los pasos de instalacion, en el apartado de datos y en el cierre). Se generan desde un solo
 * objeto `datos`, asi que no puede pasar que en un sitio ponga una cosa y en otro otra.
 *
 * Si `apoyo.json` no carga, no queda ni un boton a medias: los huecos se quedan ocultos.
 */
function botonesDeApoyo(datos, { compacto = false } = {}) {
  const nodos = []
  for (const opcion of datos.cantidades) {
    const enlace = document.createElement('a')
    enlace.className = compacto ? 'btn btn-apoyo' : 'btn btn-grande'
    enlace.href = opcion.enlace
    enlace.target = '_blank'
    enlace.rel = 'noopener noreferrer'
    enlace.textContent = `${compacto ? '☕ ' : ''}${opcion.cantidad} €`
    nodos.push(enlace)
  }
  const otra = document.createElement('a')
  otra.className = compacto ? 'btn btn-apoyo' : 'btn btn-grande'
  otra.href = datos.enlace
  otra.target = '_blank'
  otra.rel = 'noopener noreferrer'
  otra.textContent = 'Otra cantidad'
  nodos.push(otra)
  return nodos
}

/** Rellena todos los huecos de apoyo que haya en la pagina. */
function pintarApoyo(datos) {
  // Los datos tienen que ser validos: mejor cero botones que botones rotos o sin importe.
  if (!datos || !datos.enlace || !Array.isArray(datos.cantidades) || datos.cantidades.length === 0) {
    return
  }
  if (!/^https:\/\/(www\.)?paypal\.me\/[A-Za-z0-9._-]+$/.test(datos.enlace)) {
    console.warn('El enlace de apoyo no tiene buena pinta, no se enseña:', datos.enlace)
    return
  }

  const huecos = document.querySelectorAll('.apoyo-linea')
  for (const hueco of huecos) {
    hueco.textContent = ''
    const texto = crear('p', null, '¿Te resulta útil? Puedes dejar una donación voluntaria. No desbloquea nada.')
    hueco.appendChild(texto)
    for (const boton of botonesDeApoyo(datos, { compacto: true })) hueco.appendChild(boton)
    hueco.hidden = false
  }

  const seccion = document.getElementById('apoyo')
  if (seccion) {
    const titulo = document.getElementById('apoyo-titulo')
    const texto = document.getElementById('apoyo-texto')
    const aclaracion = document.getElementById('apoyo-aclaracion')
    const botones = document.getElementById('apoyo-botones')
    if (titulo && datos.titulo) titulo.textContent = datos.titulo
    if (texto && datos.texto) texto.textContent = datos.texto
    if (aclaracion && datos.aclaracion) aclaracion.textContent = datos.aclaracion
    if (botones) {
      botones.textContent = ''
      for (const boton of botonesDeApoyo(datos)) botones.appendChild(boton)
    }
    seccion.hidden = false
  }
}

/** El aviso de instalacion nativo, cuando el navegador lo ofrece. */
let avisoDiferido = null

function prepararInstalacion(boton) {
  const nota = document.getElementById('nota-instalar')
  if (!boton) return

  // Ya instalada en ESTE movil: el boton principal pasa a decir "Abrir" en lugar de "Descargar".
  if (estaInstalada()) {
    boton.hidden = true
    if (nota) nota.hidden = true
    const abrir = document.getElementById('abrir-app')
    if (abrir) abrir.textContent = '📲 Abrir Kairós'
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

/** El apoyo va en su propio archivo: se pide aparte y, si falla, solo se pierde esa seccion. */
async function cargarApoyo() {
  try {
    const respuesta = await fetch(DATOS_APOYO, { cache: 'no-cache' })
    if (!respuesta.ok) throw new Error(`apoyo.json: ${respuesta.status}`)
    const datos = await respuesta.json()
    pintarApoyo(datos)
    return datos
  } catch (error) {
    console.warn('No se ha podido cargar el apoyo voluntario:', error)
    return null
  }
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

prepararInstalacion(document.getElementById('boton-instalar'))
cargarDatos()
cargarApoyo()
