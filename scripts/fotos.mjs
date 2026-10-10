/* Versiones responsive de las fotos graduadas: AVIF + WebP + JPG a DOS anchos
   (640 y 1280 px, sin pasar del original). Lee los másteres de
   scripts/fuentes/graduadas/ (los saca scripts/gradar.py) y escribe:

     assets/fotos/<id>-<ancho>.avif|webp|jpg
     data/fotos.json  ← le añade w, h y anchos a cada foto (conserva el resto)

   node scripts/fotos.mjs
   Usa sharp del node_modules de alvarotaiagu.github.io (no hay npm en este repo).
*/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/package.json');
const sharp = require('sharp');

const origen = path.join(raiz, 'scripts', 'fuentes', 'graduadas');
const destino = path.join(raiz, 'assets', 'fotos');
fs.mkdirSync(destino, { recursive: true });
const ANCHOS = [640, 1280];
const datos = JSON.parse(fs.readFileSync(path.join(raiz, 'data', 'fotos.json'), 'utf8'));

let bytes = 0;
for (const f of datos.fotos) {
  const src = path.join(origen, f.id + '.jpg');
  const meta = await sharp(src).metadata();
  f.w = meta.width; f.h = meta.height;
  f.anchos = [...new Set(ANCHOS.map(a => Math.min(a, meta.width)))];
  for (const a of f.anchos) {
    const base = sharp(src).resize({ width: a, withoutEnlargement: true });
    const salidas = [
      [base.clone().avif({ quality: 52, effort: 5 }), 'avif'],
      [base.clone().webp({ quality: 74 }), 'webp'],
      [base.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }), 'jpg']
    ];
    for (const [s, ext] of salidas) {
      const out = path.join(destino, `${f.id}-${a}.${ext}`);
      await s.toFile(out);
      bytes += fs.statSync(out).size;
    }
  }
}
fs.writeFileSync(path.join(raiz, 'data', 'fotos.json'), JSON.stringify(datos, null, 1) + '\n');
console.log(datos.fotos.length, 'fotos ·', (bytes / 1048576).toFixed(1), 'MB en assets/fotos');
