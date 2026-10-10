/* Autoaloja las dos letras de su web en woff2, solo el subconjunto latino:
     Cormorant Garamond 300, 300 cursiva, 400 y 500 (titulares y logo)
     Lato 300, 400 y 700 (texto)
   Su web de hoy precarga dos woff2 que dan 404: aquí cada archivo existe y se
   comprueba (glifos € ñ á é í ó ú ü Á É Í Ó Ú Ñ « » ® · – y el espacio fino) con
   fontTools en scripts/comprobar-glifos.py.

   Escribe assets/fuentes/*.woff2 y el bloque @font-face entre las marcas
   /* gen:fuentes *\/ … /* /gen:fuentes *\/ de css/estilos.css.

   node scripts/fuentes.mjs
   El User-Agent es uno genérico de Chrome (sin datos de nadie): Google sirve woff2 con él.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const URL_CSS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Lato:wght@300;400;700&display=swap';

const css = await (await fetch(URL_CSS, { headers: { 'user-agent': UA } })).text();
const bloques = css.split('/*').slice(1).map(b => '/*' + b).filter(b => /^\/\* latin \*\//.test(b));
const dir = path.join(raiz, 'assets', 'fuentes');
fs.mkdirSync(dir, { recursive: true });
const caras = new Map();   /* familia+estilo+huella → caras con el mismo archivo (Cormorant es variable) */
for (const b of bloques) {
  const familia = b.match(/font-family: '([^']+)'/)[1];
  const estilo = b.match(/font-style: (\w+)/)[1];
  const peso = b.match(/font-weight: (\d+)/)[1];
  const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const rango = b.match(/unicode-range: ([^;]+);/)[1];
  const datos = Buffer.from(await (await fetch(url, { headers: { 'user-agent': UA } })).arrayBuffer());
  const clave = familia + '|' + estilo + '|' + crypto.createHash('sha1').update(datos).digest('hex');
  if (!caras.has(clave)) caras.set(clave, { familia, estilo, pesos: [], datos, rango });
  caras.get(clave).pesos.push(+peso);
}
if (bloques.length !== 7) throw new Error('Esperaba 7 caras latinas y hay ' + bloques.length);
for (const f of fs.readdirSync(dir)) if (f.endsWith('.woff2')) fs.rmSync(path.join(dir, f));
const salida = [];
for (const c of caras.values()) {
  const min = Math.min(...c.pesos), max = Math.max(...c.pesos);
  const nombre = `${c.familia.toLowerCase().replace(/\s+/g, '-')}-${min === max ? min : min + '-' + max}${c.estilo === 'italic' ? 'i' : ''}.woff2`;
  fs.writeFileSync(path.join(dir, nombre), c.datos);
  salida.push(`@font-face{font-family:"${c.familia}";font-style:${c.estilo};font-weight:${min === max ? min : min + ' ' + max};font-display:swap;src:url("../assets/fuentes/${nombre}") format("woff2");unicode-range:${c.rango}}`);
  console.log(nombre.padEnd(36), (c.datos.length / 1024).toFixed(1) + ' KB  pesos ' + c.pesos.join(', '));
}

const ruta = path.join(raiz, 'css', 'estilos.css');
if (fs.existsSync(ruta)) {
  const t = fs.readFileSync(ruta, 'utf8');
  const re = /(\/\* gen:fuentes \*\/)[\s\S]*?(\/\* \/gen:fuentes \*\/)/;
  if (!re.test(t)) throw new Error('Faltan las marcas gen:fuentes en css/estilos.css');
  fs.writeFileSync(ruta, t.replace(re, (m, a, b) => a + '\n' + salida.join('\n') + '\n' + b));
  console.log('css/estilos.css: @font-face actualizado');
} else console.log(salida.join('\n'));
