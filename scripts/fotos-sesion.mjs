/* Pasa a data/fotos.json las fotos de la sesión profesional (octubre de 2026).
   Originales en _originales/fotos (fuera de git). Elección y alt: selección por grupos.
   Después: python -I scripts/gradar.py → node scripts/fotos.mjs → node scripts/construir.mjs
     node scripts/fotos-sesion.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ruta = path.join(raiz, 'data', 'fotos.json');
const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
const sel = Object.fromEntries(['A', 'B', 'C'].flatMap(k => JSON.parse(fs.readFileSync(path.join(raiz, '_originales', `seleccion-${k}.json`), 'utf8')).grupos.flatMap(g => g.elegidas.map(e => [e.fichero, e]))));
// id → fichero. Los cinco primeros sustituyen a fotos de banco; el resto son nuevas.
const MAPA = {
  facial: 'DERMAPEN-17.jpg', indiba: 'INDIBA FACIAL-15.jpg', corporales: 'INDIBA CORPORAL-9.jpg',
  bienestar: 'PAREJA-25.jpg', aceite: 'PAREJA-1.jpg', equipo: 'PAREJA-30.jpg',
  'dermapen-rostro': 'DERMAPEN-22.jpg', 'dermapen-bandeja': 'DERMAPEN-1.jpg', 'ritual-oro': 'RITUAL ORO-17.jpg',
  'indiba-ona': 'INDIBA ONA-25.jpg', 'indiba-electrodo': 'INDIBA FACIAL-13.jpg', 'ona-cabezal': 'INDIBA ONA-21.jpg',
  'corporal-abdomen': 'INDIBA CORPORAL-11.jpg', 'corporal-crema': 'INDIBA CORPORAL-2.jpg', 'corporal-electrodo': 'INDIBA CORPORAL-8.jpg',
  'indiba-rostro': 'INDIBA FACIAL-23.jpg', 'pareja-espalda': 'PAREJA-2.jpg', 'masaje-espalda': 'PAREJA-18.jpg', 'ritual-oro-pan': 'RITUAL ORO-12.jpg'
};
for (const [id, fichero] of Object.entries(MAPA)) {
  const e = sel[fichero];
  if (!e) throw new Error('Sin selección: ' + fichero);
  const nueva = { id, origen: fichero, tipo: 'sesion', provisional: false, alt: e.alt.replace(/\.$/, ''), foco: e.foco };
  const i = datos.fotos.findIndex(f => f.id === id);
  if (i >= 0) datos.fotos[i] = nueva; else datos.fotos.push(nueva);
}
fs.writeFileSync(ruta, JSON.stringify(datos, null, 1) + '\n');
console.log(Object.keys(MAPA).length, 'fotos de sesión en fotos.json');
