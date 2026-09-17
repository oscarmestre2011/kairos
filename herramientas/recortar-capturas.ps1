# Recorta y reduce las capturas de la app para la web.
#
# Las capturas originales son pantallas completas del movil (1082 px de ancho y hasta 7500 px de
# alto). En la web no caben ni hacen falta: se ve la parte de arriba, que es la que se entiende.
#
# Resultado: assets/*.jpg a 460x852 (proporcion de movil), calidad 74.
# El peso importa: la web entera tiene que quedar por debajo de 600 KB, porque se abre muchas veces
# con datos moviles. Con calidad 82 y 540 px de ancho pesaba 1,2 MB; asi son 371 KB.
#
# Uso (desde esta carpeta):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas/recortar-capturas.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Ojo con las rutas: este script vive en kairos-web\herramientas\ y la app esta en
# "99 App Gimnasio\gymlog", hermana de kairos-web. Por eso se suben DOS niveles.
$app = Join-Path $PSScriptRoot '..\..\gymlog'
$assets = Join-Path $PSScriptRoot '..\assets'
$capturas = Join-Path $app 'capturas'

$plan = @(
  @{ src = '46-inicio-del-dia.png';    out = 'inicio.jpg' },     # Inicio con el entreno del dia
  @{ src = '05-sesion-con-series.png'; out = 'sesion.jpg' },     # Sesion con series apuntadas
  @{ src = '43-mejora-serie.png';      out = 'descanso.jpg' },   # Descanso y comparacion con la ultima vez
  @{ src = '06-progresion.png';        out = 'progreso.jpg' },   # Volumen y cardio acumulado
  @{ src = '44-progreso-grupos.png';   out = 'grupos.jpg' },     # Series por grupo muscular
  @{ src = '45-plan-semana.png';       out = 'plan.jpg' },       # Plan de la semana
  @{ src = '34-medidas.png';           out = 'medidas.jpg' },    # Medidas corporales
  @{ src = '48-cardio-series.png';     out = 'cardio.jpg' },     # Editor de cardio por series
  @{ src = '32-superserie-editor.png'; out = 'superserie.jpg' }, # Superseries en el editor
  @{ src = '40-perfil.png';            out = 'perfil.jpg' }      # Perfil del deportista
)

$ancho = 460
$alto = 852
# Cuanto recorte vertical de la captura original, en su escala: las series y el descanso estan arriba.
$recorteOriginal = [int](2005 * $ancho / 540)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, 74L)

$total = 0
foreach ($p in $plan) {
  $origen = Join-Path $capturas $p.src
  if (-not (Test-Path $origen)) {
    Write-Warning "Falta la captura $($p.src): se salta. Las capturas de la app se regeneran con las pruebas."
    continue
  }
  $img = [System.Drawing.Image]::FromFile($origen)
  $lienzo = New-Object System.Drawing.Bitmap $ancho, $alto
  $g = [System.Drawing.Graphics]::FromImage($lienzo)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $recorte = [Math]::Min($recorteOriginal, $img.Height)
  $g.DrawImage(
    $img,
    (New-Object System.Drawing.Rectangle 0, 0, $ancho, $alto),
    (New-Object System.Drawing.Rectangle 0, 0, $img.Width, $recorte),
    [System.Drawing.GraphicsUnit]::Pixel)
  $destino = Join-Path $assets $p.out
  $lienzo.Save($destino, $codec, $params)
  $g.Dispose(); $lienzo.Dispose(); $img.Dispose()
  $kb = (Get-Item $destino).Length / 1KB
  $total += $kb
  Write-Host ("OK  {0,-16} {1,5:N0} KB" -f $p.out, $kb)
}
Write-Host ("{0}`nTOTAL: {1:N0} KB" -f ('-' * 32), $total)
