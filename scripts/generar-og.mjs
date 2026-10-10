/* og:image hecha a propósito (1200 × 630): la bóveda en penumbra con el loto dorado
   encendido y «MARINA SPA». La de su web de hoy da 404. Además, los iconos PNG:
   apple-touch-icon (180), icono-192 e icono-512 (los del manifest y el logo del JSON-LD).
   Se compone en HTML y se fotografía con Playwright.

   node scripts/generar-og.mjs   → assets/og-marina-spa.jpg y assets/marca/*.png
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* en base64: una página about:blank no puede leer file:// */
const b64 = (f, tipo) => `data:${tipo};base64,` + fs.readFileSync(path.join(raiz, f)).toString('base64');
const boveda = b64('assets/fotos/boveda-penumbra-1280.jpg', 'image/jpeg');
const lockup = fs.readFileSync(path.join(raiz, 'assets/marca/loto-marina-spa.svg'), 'utf8').replace(/#F0C868/g, '#F8DE9C');
const loto = fs.readFileSync(path.join(raiz, 'assets/marca/loto.svg'), 'utf8');
const lato = b64('assets/fuentes/lato-700.woff2', 'font/woff2');

const og = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:L;src:url(${lato}) format("woff2");font-weight:700}
body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;background:#1C1917}
.f{position:absolute;inset:0;background:url(${boveda}) center 35%/cover}
.v{position:absolute;inset:0;background:radial-gradient(38% 62% at 50% 46%,rgba(248,222,156,.22),rgba(240,200,104,.06) 55%,transparent 75%),linear-gradient(180deg,rgba(28,25,23,.35),rgba(28,25,23,.75))}
.l{position:absolute;left:50%;top:70px;width:520px;translate:-50% 0}
.l svg{width:100%;height:auto;display:block}
.e{position:absolute;left:0;right:0;bottom:44px;text-align:center;font:700 15px/1 L;letter-spacing:.34em;text-indent:.34em;color:#D4AF37;text-transform:uppercase}
.a{position:absolute;left:50%;top:40px;width:640px;height:700px;translate:-50% 0;border:1px solid rgba(212,175,55,.55);border-bottom:0;border-radius:320px 320px 0 0}
</style></head><body><div class="f"></div><div class="v"></div><div class="a"></div><div class="l">${lockup}</div><p class="e">Centro de estética · Zafra</p></body></html>`;

const icono = (t, borde) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:${t}px;height:${t}px;background:#1C1917;display:flex;align-items:center;justify-content:center}
svg{width:${Math.round(t * (borde ? 0.62 : 0.74))}px;height:auto;display:block}
svg{stroke-width:${t < 200 ? 22 : 18}}
</style></head><body>${loto.replace('stroke-width="13"', '')}</body></html>`;

const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1200, height: 630 } });
await pag.setContent(og, { waitUntil: 'networkidle' });
await pag.screenshot({ path: path.join(raiz, 'assets/og-marina-spa.jpg'), type: 'jpeg', quality: 88 });
for (const [t, nombre, borde] of [[180, 'apple-touch-icon.png', false], [192, 'icono-192.png', true], [512, 'icono-512.png', true]]) {
  await pag.setViewportSize({ width: t, height: t });
  await pag.setContent(icono(t, borde));
  await pag.screenshot({ path: path.join(raiz, 'assets/marca', nombre) });
}
await nav.close();
console.log('assets/og-marina-spa.jpg · assets/marca/apple-touch-icon.png, icono-192.png, icono-512.png');
