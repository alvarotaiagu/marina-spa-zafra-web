/* Cada referencia a los CSS/JS propios lleva ?v=<huella del contenido> (memoria «caché
   de Pages»): sin eso, tras subir, el navegador puede mezclar la hoja vieja con el HTML
   nuevo durante 10 minutos (Pages) o lo que diga IONOS.

   Anclado al atributo (href="…" / src="…"), nunca a una mención suelta en un comentario.
   Idempotente: ejecutado dos veces seguidas, la segunda dice «sin cambios». Si se ha
   quitado un módulo, sus archivos ya no están y se saltan sin error.

   node scripts/versionar.mjs [carpeta]
   construir.mjs usa versionarHtml() al escribir, así que normalmente no hace falta.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARCHIVOS = [
  'css/estilos.css', 'css/opinion.css', 'css/cinta.css', 'css/recorrido.css', 'css/beauty-party.css',
  'js/main.js', 'js/opinion.js', 'js/cinta.js', 'js/recorrido.js', 'js/beauty-party.js',
  'js/efectos/util.js', 'js/efectos/magnetico.js', 'js/efectos/marquesina.js'
];
const escapar = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export function huellas(raiz) {
  return Object.fromEntries(ARCHIVOS.filter(f => fs.existsSync(path.join(raiz, f)))
    .map(f => [f, crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8)]));
}
export function versionarHtml(html, versiones) {
  for (const [archivo, v] of Object.entries(versiones)) {
    html = html.replace(new RegExp('((?:href|src)="/?' + escapar(archivo) + ')(\\?v=[0-9a-f]*)?"', 'g'), '$1?v=' + v + '"');
  }
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = process.argv[2] ? path.resolve(process.argv[2]) : aqui;
  const versiones = huellas(raiz);
  for (const pagina of fs.readdirSync(raiz).filter(f => f.endsWith('.html'))) {
    const ruta = path.join(raiz, pagina);
    const antes = fs.readFileSync(ruta, 'utf8');
    const html = versionarHtml(antes, versiones);
    if (html !== antes) fs.writeFileSync(ruta, html);
    console.log((html !== antes ? 'actualizado ' : 'sin cambios ') + pagina);
  }
  console.log(versiones);
}
