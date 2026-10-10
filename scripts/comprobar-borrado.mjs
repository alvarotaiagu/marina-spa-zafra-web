/* Comprueba contra los archivos que el mando de maqueta ya no está.
   La receta del README no se escribe de memoria: se comprueba.

   node scripts/comprobar-borrado.mjs ../marina-spa-entrega
*/
import fs from 'node:fs';
import path from 'node:path';

const raiz = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!raiz) { console.error('Uso: node scripts/comprobar-borrado.mjs <carpeta>'); process.exit(1); }
const html = fs.readdirSync(raiz).filter(f => f.endsWith('.html'));
const rastros = [
  ...html.flatMap(f => [
    [f, /\[MANDO DE MAQUETA\]/, 'marcas [MANDO DE MAQUETA]'],
    [f, /id="mando"/, 'el <aside class="mando">'],
    [f, /id="mando-datos"/, 'los datos de los avisos'],
    [f, /ms-densidad/, 'la lectura o la fila de la densidad'],
    [f, /revision/, 'cualquier mención al modo ?revision'],
    [f, /id="buscador"/, 'el buscador de la sobria']
  ]),
  ['css/estilos.css', /\[MANDO DE MAQUETA\]/, 'el bloque CSS del mando'],
  ['css/estilos.css', /densidad-sobria/, 'las reglas de la sobria'],
  ['css/estilos.css', /\.mando|\.buscador/, 'los estilos del mando y del buscador'],
  ['css/cinta.css', /densidad-sobria/, 'las reglas sobrias de la cinta'],
  ['js/main.js', /\[MANDO DE MAQUETA\]/, 'el bloque JS del mando'],
  ['js/main.js', /mandoMaqueta|ms-densidad|buscador/, 'mandoMaqueta(), la clave guardada y el buscador']
];
let quedan = 0;
console.log('Rastros del mando de maqueta en ' + raiz);
console.log('-'.repeat(76));
for (const [archivo, patron, que] of rastros) {
  const ruta = path.join(raiz, archivo);
  if (!fs.existsSync(ruta)) { console.log('no está ' + archivo.padEnd(34) + '(módulo quitado)'); continue; }
  const hay = patron.test(fs.readFileSync(ruta, 'utf8'));
  if (hay) { quedan++; console.log('QUEDA   ' + archivo.padEnd(34) + que); }
}
console.log('-'.repeat(76));
if (quedan) { console.log(quedan + ' rastro(s). No entregar todavía.'); process.exitCode = 1; }
else console.log('Sin rastros del mando en ' + rastros.length + ' comprobaciones. Se puede entregar.');
