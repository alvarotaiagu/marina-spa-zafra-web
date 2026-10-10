/* Servidor estático para revisar la web. Resuelve las rutas como GitHub Pages:
     /                    → index.html
     /indiba-zafra        → indiba-zafra.html  (las URL de marinaspa.es, sin extensión)
     /lo-que-no-existe    → 404.html con estado 404
   (En IONOS lo hace el .htaccess.)

   node scripts/servir.mjs          → http://127.0.0.1:4261
   node scripts/servir.mjs 5000     → otro puerto
   Puerto propio (memoria «puerto de otra sesión»): 4261; verificar.mjs usa 4262-4269.
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.json': 'application/json', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};
export function resolver(raiz, url) {
  const limpia = decodeURIComponent(url.split('?')[0].split('#')[0]);
  let destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) return null;
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    if (!path.extname(destino) && fs.existsSync(destino + '.html')) destino += '.html';
    else return null;
  }
  return destino;
}
export function crearServidor(raiz) {
  return http.createServer((req, res) => {
    const destino = resolver(raiz, req.url);
    if (!destino) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(raiz, '404.html')));
      return;
    }
    const datos = fs.readFileSync(destino);
    const tipo = tipos[path.extname(destino)] || 'application/octet-stream';
    /* los vídeos necesitan rangos para poder saltar a un segundo (el recorrido) */
    const rango = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (rango) {
      const ini = rango[1] ? +rango[1] : 0, fin = rango[2] ? +rango[2] : datos.length - 1;
      res.writeHead(206, { 'content-type': tipo, 'content-range': `bytes ${ini}-${fin}/${datos.length}`, 'accept-ranges': 'bytes', 'content-length': fin - ini + 1, 'cache-control': 'no-store' });
      res.end(datos.subarray(ini, fin + 1));
      return;
    }
    res.writeHead(200, { 'content-type': tipo, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    res.end(datos);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const puerto = Number(process.argv[2]) || 4261;
  crearServidor(raiz).listen(puerto, '127.0.0.1', () => {
    console.log('Marina Spa · Bóveda en http://127.0.0.1:' + puerto);
    console.log('Ctrl+C para parar.');
  });
}
