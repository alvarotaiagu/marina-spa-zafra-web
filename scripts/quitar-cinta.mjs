/* Quita el módulo «cinta» (atajo de quitar-modulo.mjs; receta en el README).
   node scripts/quitar-cinta.mjs <carpeta> | --aqui */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { quitar } from './quitar-modulo.mjs';
const arg = process.argv[2];
if (!arg) { console.error('Uso: node scripts/quitar-cinta.mjs <carpeta> | --aqui'); process.exit(1); }
quitar('cinta', arg === '--aqui' ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') : path.resolve(arg));
console.log('Módulo «cinta» quitado.');
