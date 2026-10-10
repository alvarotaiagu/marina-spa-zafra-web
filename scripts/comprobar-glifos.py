"""Comprueba que cada woff2 autoalojado trae los glifos que usa la web (PLIEGO §6).
   python -I scripts/comprobar-glifos.py      → sale con 1 si falta alguno"""
import os, sys, glob
from fontTools.ttLib import TTFont
sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
NECESARIOS = '€ñÑáéíóúüÁÉÍÓÚ«»®·–—…¿¡ºª›' + ' '
# los precios van en span.precio, siempre en Cormorant: el espacio fino (U+2009) solo hace falta ahí
SOLO_CORMORANT = ' '
mal = 0
for f in sorted(glob.glob(os.path.join(AQUI, '..', 'assets', 'fuentes', '*.woff2'))):
    cmap = TTFont(f).getBestCmap()
    pide = NECESARIOS + (SOLO_CORMORANT if 'cormorant' in f else '')
    faltan = [c for c in pide if ord(c) not in cmap]
    mal += bool(faltan)
    print(('FALTAN ' + ' '.join(repr(c) for c in faltan) if faltan else 'completa').ljust(30), os.path.basename(f))
sys.exit(1 if mal else 0)
