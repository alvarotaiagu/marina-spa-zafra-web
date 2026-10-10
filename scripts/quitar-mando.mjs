/* Genera la copia que viaja a marinaspa.es, SIN el mando de maqueta.
   No toca esta carpeta: escribe una copia limpia en otra, para que la maqueta con sus
   dos versiones siga sirviendo para la reunión.

   node scripts/quitar-mando.mjs ../marina-spa-entrega
   node scripts/comprobar-borrado.mjs ../marina-spa-entrega

   Entrega la versión «Bóveda» (la cargada). Si Marina elige la «Sobria», ver README →
   «Quitar el mando de maqueta», caso B.

   Qué quita, siempre por marcas «[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]»:
     *.html              el aviso de arriba, la lectura de la densidad en el script del
                         <head>, el <aside class="mando"> con sus datos y, en la portada,
                         el buscador (solo existe en la sobria)
     politica-cookies    la fila de la clave ms-densidad
     css/estilos.css     el bloque del mando y las reglas de la sobria
     css/cinta.css       las reglas sobrias del módulo (si sigue)
     js/main.js          mandoMaqueta() y el buscador
   Fuera también scripts/ y screenshots/ (no se publican). Después vuelve a versionar.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!destino) { console.error('Uso: node scripts/quitar-mando.mjs <carpeta-destino>'); process.exit(1); }
if (destino === raiz || destino.startsWith(raiz + path.sep)) { console.error('El destino tiene que estar fuera de la maqueta.'); process.exit(1); }

const origen = process.argv[3] ? path.resolve(process.argv[3]) : raiz;   /* verificar.mjs lo pasa sobre una copia */
const fuera = new Set(['scripts', 'screenshots', 'node_modules', '.git']);
function copiar(de, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    if (fuera.has(e.name)) continue;
    const o = path.join(de, e.name), d = path.join(a, e.name);
    if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d);
  }
}
fs.rmSync(destino, { recursive: true, force: true });
copiar(origen, destino);

const bloqueHtml = /[ \t]*<!-- ═+ \[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\] ═+ -->\r?\n?/g;
const bloqueCodigo = /[ \t]*\/\*[^*]*?\[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\][^*]*\*\/\r?\n?/g;
const filaCookies = /[ \t]*<!-- \[MANDO DE MAQUETA\][^>]*-->\s*<tr>[\s\S]*?<\/tr>\r?\n?/g;

const cambios = { 'css/estilos.css': t => t.replace(bloqueCodigo, ''), 'css/cinta.css': t => t.replace(bloqueCodigo, ''), 'js/main.js': t => t.replace(bloqueCodigo, '') };
for (const f of fs.readdirSync(destino).filter(f => f.endsWith('.html'))) cambios[f] = t => t.replace(filaCookies, '').replace(bloqueHtml, '').replace(bloqueCodigo, '');
for (const [archivo, f] of Object.entries(cambios)) {
  const ruta = path.join(destino, archivo);
  if (!fs.existsSync(ruta)) { console.log('no está     ' + archivo + '  (módulo quitado antes)'); continue; }
  const antes = fs.readFileSync(ruta, 'utf8');
  const despues = f(antes);
  /* nada de comodines que se coman el archivo: si pierde más de un tercio, algo va mal */
  if (despues.length < antes.length * 0.66) { console.error('Me niego: ' + archivo + ' perdería demasiado.'); process.exit(1); }
  fs.writeFileSync(ruta, despues);
  console.log((antes === despues ? 'sin cambios ' : 'limpiado    ') + archivo + '  (−' + (antes.length - despues.length) + ' caracteres)');
}
execFileSync(process.execPath, [path.join(raiz, 'scripts/versionar.mjs'), destino], { stdio: 'ignore' });
console.log('Copia sin mando en ' + destino);
