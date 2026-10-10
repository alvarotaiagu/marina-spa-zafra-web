"""Piezas del logo a partir del loto redibujado (provisional: el original solo existe a 64 px).

Origen: ../marina-spa-zafra-bocetos/ref/marca/loto-dorado.svg, que hace
        ../marina-spa-zafra-bocetos/ref/marca/_loto_dorado.py (11 pétalos simétricos,
        pathLength="1", máscaras de oclusión).

Escribe en assets/marca/:
  loto.svg              el loto solo (trazo #F0C868)
  loto-marina-spa.svg   el loto con «MARINA SPA» debajo, en Cormorant Garamond 500,
                        versalitas espaciadas y en trazos (no depende de la fuente)
  favicon.svg           el loto con trazo más grueso (para 16–32 px) sobre Noche
  loto-piezas.json      viewBox, los 11 pétalos (d, máscara y orden de dibujo) y las
                        máscaras, para que construir.mjs meta el loto en línea con ids únicos

Cuando llegue el vector original: sustituir loto-dorado.svg por el suyo (mismas 11
piezas o las que traiga) y pasar este script y construir.mjs.

  python -I scripts/marca.py
"""
import os, re, sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..'))
ORIGEN = os.path.normpath(os.path.join(RAIZ, '..', 'marina-spa-zafra-bocetos', 'ref', 'marca', 'loto-dorado.svg'))
DEST = os.path.join(RAIZ, 'assets', 'marca')
os.makedirs(DEST, exist_ok=True)

svg = open(ORIGEN, encoding='utf8').read()
vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
VX, VY, VW, VH = map(float, vb.split())
mascaras = re.findall(r'<mask id="([^"]+)"[^>]*>(.*?)</mask>', svg, re.S)
petalos = re.findall(r'<path d="([^"]+)"(?: mask="url\(#([^)]+)\)")? pathLength="1"/>', svg)
if len(petalos) != 11: raise SystemExit('Esperaba 11 pétalos y hay %d' % len(petalos))
NOMBRES = ['lat0i', 'lat0d', 'lat1i', 'lat1d', 'lat2i', 'lat2d', 'centro', 'capullo', 'hoja-i', 'hoja-d', 'abajo']
# orden de dibujo de la cortina: capullo, pétalo central, laterales (de dentro afuera, por parejas), hojas y abajo
ORDEN = [['capullo'], ['centro'], ['lat2i', 'lat2d'], ['lat1i', 'lat1d'], ['lat0i', 'lat0d'], ['hoja-i', 'hoja-d'], ['abajo']]

piezas = {
  'viewBox': vb,
  'mascaras': [{'id': i, 'contenido': c} for i, c in mascaras],
  'petalos': [{'nombre': n, 'd': d, 'mascara': m or None} for n, (d, m) in zip(NOMBRES, petalos)],
  'orden': ORDEN
}
json.dump(piezas, open(os.path.join(DEST, 'loto-piezas.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

def cuerpo(sufijo=''):
    defs = ''.join(f'<mask id="{i}{sufijo}"' + re.search(rf'<mask id="{re.escape(i)}"([^>]*)>', svg).group(1) + f'>{c}</mask>' for i, c in mascaras)
    ps = ''.join(f'<path d="{d}"' + (f' mask="url(#{m}{sufijo})"' if m else '') + ' pathLength="1"/>' for d, m in petalos)
    return f'<defs>{defs}</defs>{ps}'

# 1 · loto solo
open(os.path.join(DEST, 'loto.svg'), 'w', encoding='utf8').write(
  f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="none" stroke="#F0C868" stroke-width="13" stroke-linejoin="round" stroke-linecap="round">{cuerpo()}</svg>\n')

# 2 · favicon: trazo grueso sobre Noche, con margen
m = 34
open(os.path.join(DEST, 'favicon.svg'), 'w', encoding='utf8').write(
  f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VX - m} {VY - m + 8} {VW + 2 * m} {VH + 2 * m - 16}">'
  f'<rect x="{VX - m}" y="{VY - m + 8}" width="{VW + 2 * m}" height="{VH + 2 * m - 16}" rx="96" fill="#1C1917"/>'
  f'<g fill="none" stroke="#F0C868" stroke-width="34" stroke-linejoin="round" stroke-linecap="round">{cuerpo("-f")}</g></svg>\n')

# 3 · loto + «MARINA SPA» en trazos (Cormorant Garamond 500, la variable instanciada)
fuente = TTFont(os.path.join(RAIZ, 'assets', 'fuentes', 'cormorant-garamond-300-500.woff2'))
fuente = instancer.instantiateVariableFont(fuente, {'wght': 500})
gs = fuente.getGlyphSet(); cmap = fuente.getBestCmap(); upm = fuente['head'].unitsPerEm
TEXTO = 'MARINA SPA'
ALTO_CAP = 62.0                     # alto de las mayúsculas en unidades del viewBox
esc = ALTO_CAP / fuente['OS/2'].sCapHeight
ESPACIADO = 0.30 * ALTO_CAP / 0.68  # ~ letter-spacing .34em de la cabecera
x = 0.0; trozos = []
for ch in TEXTO:
    g = cmap[ord(ch)]
    if ch != ' ':
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (esc, 0, 0, -esc, x, 0)))
        trozos.append(pen.getCommands())
    x += gs[g].width * esc + ESPACIADO
ancho = x - ESPACIADO
y0 = VY + VH + 70 + ALTO_CAP          # línea base
dx = VX + VW / 2 - ancho / 2
alto_total = VH + 70 + ALTO_CAP + 30
texto = f'<g transform="translate({dx:.1f} {y0:.1f})" fill="#F0C868">' + ''.join(f'<path d="{t}"/>' for t in trozos) + '</g>'
ancho_vb = max(VW, ancho + 40)
open(os.path.join(DEST, 'loto-marina-spa.svg'), 'w', encoding='utf8').write(
  f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VX + VW / 2 - ancho_vb / 2:.1f} {VY} {ancho_vb:.1f} {alto_total:.1f}">'
  f'<g fill="none" stroke="#F0C868" stroke-width="13" stroke-linejoin="round" stroke-linecap="round">{cuerpo("-m")}</g>{texto}</svg>\n')
print('assets/marca: loto.svg, favicon.svg, loto-marina-spa.svg, loto-piezas.json ·', len(petalos), 'pétalos')
