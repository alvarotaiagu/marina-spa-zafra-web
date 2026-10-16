"""Gradación común de las fotos de Marina Spa (memoria «food photo consistency»).

Las fotos salen de su web: tres del local (vela, portón y cabina, 1280 px) y nueve de
banco que ya usa marinaspa.es. Son de fuentes distintas y no casan entre sí; esta
receta las lleva al mismo tono, el de la bóveda en penumbra:

  1. Balance de blancos por «mundo gris» suave (como mucho un 35 %).
  2. Punto cálido común (+rojo, −azul).
  3. Negros a Noche (#1C1917): el negro puro pasa a ser el de la paleta.
  4. Saturación un poco abajo (0,9), igual en todas.
  5. Un punto de grano, el MISMO en todas (semilla fija, misma amplitud).

Casos aparte:
  · «estetica» (uñas lila sobre negro): el lila se queda, pero bajado de saturación
    (0,72) y calentado, y el negro del fondo pasa a Noche como en las demás.
  · «boveda-penumbra»: la cabina con la bóveda, a oscuras y en sepia (fondo de la
    portada y del 404). Es lo que el boceto hacía con un filter de CSS; aquí va horneado.

Nada de esto se hace en CSS: la web no lleva ningún `filter` de gradación.

Entrada: ../marina-spa-zafra-bocetos/ref/web-actual/activos/<origen> (no se tocan)
Salida:  scripts/fuentes/graduadas/<id>.jpg (máster, q 94)
Después: node scripts/fotos.mjs

  python -I scripts/gradar.py
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..'))
ACTIVOS = os.path.normpath(os.path.join(RAIZ, '..', 'marina-spa-zafra-bocetos', 'ref', 'web-actual', 'activos'))
DESTINO = os.path.join(AQUI, 'fuentes', 'graduadas')
os.makedirs(DESTINO, exist_ok=True)

NOCHE = np.array([0x1C, 0x19, 0x17]) / 255.0
datos = json.load(open(os.path.join(RAIZ, 'data', 'fotos.json'), encoding='utf8'))

def luma(x): return 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]

def saturar(x, k):
    L = luma(x)[..., None]
    return L + (x - L) * k

def gradar(im, lila=False, penumbra=False, calido=0.0):
    x = np.asarray(im.convert('RGB')).astype(np.float64) / 255.0
    # 1 · mundo gris suave
    medio = x.reshape(-1, 3).mean(0)
    gan = medio.mean() / np.maximum(medio, 1e-4)
    x = x * (1 + (np.clip(gan, 0.85, 1.18) - 1) * 0.35)
    # 2 · punto cálido común
    x = x * np.array([1.035, 1.0, 0.95])
    if calido:
        # luz de la cabina (azul en la foto): se templa sin perderla
        x = x * np.array([1 + 0.07 * calido, 1.0, 1 - 0.12 * calido])
    if lila:
        # el lila se queda, más quieto y más cálido
        x = saturar(np.clip(x, 0, 1), 0.72)
        x = x * np.array([1.03, 1.0, 0.96])
    if penumbra:
        # la bóveda en penumbra: desaturada, en sepia y muy baja de luz
        x = saturar(np.clip(x, 0, 1), 0.35)
        L = luma(x)[..., None]
        sepia = L * np.array([1.07, 0.98, 0.82])
        x = x * 0.5 + sepia * 0.5
        x = np.power(np.clip(x, 0, 1), 1.35) * 0.24 * np.array([1.12, 0.98, 0.78])
        # viñeta suave: los bordes se pierden en la noche
        h, w = x.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        r = np.hypot((xx - w * 0.55) / (w * 0.75), (yy - h * 0.45) / (h * 0.8))
        x = x * np.clip(1.15 - r * 0.55, 0.45, 1)[..., None]
    # 3 · negros a Noche
    x = NOCHE + np.clip(x, 0, 1) * (1 - NOCHE)
    # 4 · saturación común
    x = saturar(x, 0.9)
    # 5 · grano (semilla fija: el mismo en todas)
    rng = np.random.default_rng(1971)
    g = rng.normal(0, 0.016, x.shape[:2])
    x = x + g[..., None]
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))

SESION = os.path.join(RAIZ, '_originales', 'fotos')

for f in datos['fotos']:
    if f['tipo'] == 'sesion':
        # sesión profesional (2026-10): ya viene etalonada; solo se reescala, sin gradar
        im = Image.open(os.path.join(SESION, f['origen'])).convert('RGB')
        antes = im.size
        im.thumbnail((1080, 1920), Image.LANCZOS)
        im.save(os.path.join(DESTINO, f['id'] + '.jpg'), quality=94, subsampling=0)
        print(f"{f['id']:<16} {antes[0]}×{antes[1]} → {im.size[0]}×{im.size[1]} (sesión)")
        continue
    im = Image.open(os.path.join(ACTIVOS, f['origen'])).convert('RGB')
    antes = im.size
    if max(im.size) > 2000: im.thumbnail((2000, 2000), Image.LANCZOS)
    if f.get('penumbra'):
        im = im.filter(ImageFilter.GaussianBlur(1.2))
    out = gradar(im, lila=f.get('lila', False), penumbra=f.get('penumbra', False), calido=f.get('calido', 0.0))
    out.save(os.path.join(DESTINO, f['id'] + '.jpg'), quality=94, subsampling=0)
    print(f"{f['id']:<16} {antes[0]}×{antes[1]} → {out.size[0]}×{out.size[1]}")
