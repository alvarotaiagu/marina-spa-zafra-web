/* Copia la carta rastreada de marinaspa.es (marina-spa-zafra-bocetos/data/carta.json,
   la saca scripts/extraer-carta.mjs de los bocetos) a data/carta.json, corrigiendo SOLO
   las cuatro erratas acordadas. Cada corrección tiene que encontrarse exactamente una
   vez: si la carta de origen cambia, el script se niega en vez de copiar a ciegas.

   node scripts/preparar-carta.mjs

   Después de esto, data/carta.json es la fuente: un precio se cambia ahí y se
   regenera la web con node scripts/construir.mjs (ver README).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origen = path.resolve(raiz, '..', 'marina-spa-zafra-bocetos', 'data', 'carta.json');
const carta = JSON.parse(fs.readFileSync(origen, 'utf8'));

const ERRATAS = [
  ['descripcion', 'recibirlos siguientes pasos', 'recibir los siguientes pasos'],
  ['descripcion', 'Este tratamiento esta diseñado', 'Este tratamiento está diseñado'],
  ['descripcion', 'El Indiba Facial Express', 'El Indiba Facial Exprés']
];
const cuenta = Object.fromEntries(ERRATAS.map(e => [e[1], 0]));
for (const p of carta.paginas) for (const g of p.grupos) for (const t of g.tratamientos) {
  for (const [campo, mal, bien] of ERRATAS) {
    if (t[campo] && t[campo].includes(mal)) { t[campo] = t[campo].replace(mal, bien); cuenta[mal]++; }
  }
}
/* la entradilla de higiene facial termina sin punto */
const higiene = carta.paginas[0].grupos.find(g => g.grupo === 'Higiene Facial Oxigenante');
if (!higiene || /\.$/.test(higiene.entradilla)) throw new Error('La entradilla de higiene facial ya no es la rastreada');
higiene.entradilla += '.';

for (const [mal, n] of Object.entries(cuenta)) if (n !== 1) throw new Error(`«${mal}» aparece ${n} veces (se esperaba 1)`);
const lineas = carta.paginas.reduce((a, p) => a + p.grupos.reduce((b, g) => b + g.tratamientos.length, 0), 0);
if (lineas !== 53) throw new Error('La carta tiene ' + lineas + ' líneas, no 53');

carta.erratasCorregidas = [
  ...ERRATAS.map(([, mal, bien]) => `«${mal}» → «${bien}»`),
  'Entradilla de «Higiene Facial Oxigenante»: se añade el punto final'
];
fs.writeFileSync(path.join(raiz, 'data', 'carta.json'), JSON.stringify(carta, null, 1) + '\n');
console.log('data/carta.json · ' + lineas + ' líneas · 4 erratas corregidas');
