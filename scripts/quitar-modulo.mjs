/* Quita un módulo de una carpeta de la web. Es la receta del README, hecha script:
   verificar.mjs la ejecuta en una copia temporal y comprueba que la web sigue sana.

   node scripts/quitar-modulo.mjs <modulo> <carpeta>     (sobre una copia)
   node scripts/quitar-modulo.mjs <modulo> --aqui        (en esta carpeta, sin vuelta atrás)
   Módulos: opinion · beauty-party · cinta · recorrido
   (atajos: quitar-opinion.mjs, quitar-beauty-party.mjs, quitar-cinta.mjs, quitar-recorrido.mjs)

   Pasos, siempre por marcas, sin comodines que se coman el archivo:
     1. En su página, borra la <section> entre «<!-- ═══ [MÓDULO X] ═══ -->» y
        «<!-- ═══ fin [MÓDULO X] ═══ -->», y las líneas con data-modulo="x"
        (su <link> y su <script>).
     2. Borra su css/x.css y js/x.js (y lo que solo usa él: la marquesina de la cinta,
        data/recorrido.json, data/beauty-party.json).
     3. Apaga el módulo en data/sitio.json, para que construir.mjs no lo vuelva a poner.
     4. Vuelve a versionar CSS y JS (?v=).
   main.js y estilos.css no dependen de ningún módulo.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MODULOS = {
  opinion: { marca: 'MÓDULO OPINIÓN', paginas: ['index.html'], borrar: ['css/opinion.css', 'js/opinion.js'] },
  'beauty-party': { marca: 'MÓDULO BEAUTY PARTY', paginas: ['estetica-general-zafra.html'], borrar: ['css/beauty-party.css', 'js/beauty-party.js', 'data/beauty-party.json'] },
  cinta: { marca: 'MÓDULO CINTA', paginas: ['index.html'], borrar: ['css/cinta.css', 'js/cinta.js', 'js/efectos/marquesina.js'] },
  recorrido: { marca: 'MÓDULO RECORRIDO', paginas: ['index.html'], borrar: ['css/recorrido.css', 'js/recorrido.js', 'data/recorrido.json'] }
};

export function quitar(modulo, raiz) {
  const m = MODULOS[modulo];
  if (!m) throw new Error('Módulo desconocido: ' + modulo + ' (' + Object.keys(MODULOS).join(', ') + ')');
  const esc = m.marca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bloque = new RegExp('[ \\t]*<!-- ═+ \\[' + esc + '\\] ═+ -->[\\s\\S]*?<!-- ═+ fin \\[' + esc + '\\] ═+ -->\\r?\\n?');
  for (const p of m.paginas) {
    const ruta = path.join(raiz, p);
    const antes = fs.readFileSync(ruta, 'utf8');
    if (!bloque.test(antes)) throw new Error(`No encuentro las marcas [${m.marca}] en ${p}: ¿ya se quitó?`);
    let t = antes.replace(bloque, '');
    const lineas = t.split(/\r?\n/);
    const quedan = lineas.filter(l => !l.includes(`data-modulo="${modulo}"`));
    t = quedan.join('\n');
    if (t.length < antes.length * 0.6) throw new Error('Me niego: ' + p + ' perdería demasiado');
    fs.writeFileSync(ruta, t);
    console.log(`${p}: sección quitada y ${lineas.length - quedan.length} líneas con data-modulo="${modulo}"`);
  }
  for (const f of m.borrar) { const r = path.join(raiz, f); if (fs.existsSync(r)) { fs.rmSync(r); console.log('borrado ' + f); } }
  const rs = path.join(raiz, 'data/sitio.json');
  if (fs.existsSync(rs)) {
    const s = JSON.parse(fs.readFileSync(rs, 'utf8'));
    s.modulos[modulo] = false;
    fs.writeFileSync(rs, JSON.stringify(s, null, 1) + '\n');
    console.log('data/sitio.json: modulos.' + modulo + ' = false');
  }
  execFileSync(process.execPath, [path.join(aqui, 'scripts/versionar.mjs'), raiz], { stdio: 'ignore' });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [modulo, arg] = process.argv.slice(2);
  if (!modulo || !arg) { console.error('Uso: node scripts/quitar-modulo.mjs <modulo> <carpeta> | --aqui'); process.exit(1); }
  quitar(modulo, arg === '--aqui' ? aqui : path.resolve(arg));
  console.log('Módulo «' + modulo + '» quitado.');
}
