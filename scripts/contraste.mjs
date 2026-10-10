/* Contraste AA medido en el navegador, no a ojo (PLIEGO §5, memoria «acento y contraste»).
   Recorre las 13 páginas, coge cada elemento con texto propio visible, compone su color
   (con alfa) sobre el fondo opaco más cercano y exige:
     4,5:1 en texto normal · 3:1 en texto grande (≥ 24 px, o ≥ 18,66 px en negrita)
   Lee los colores en rgb(), rgba() y color(srgb …) (color-mix los devuelve así).
   El texto sobre la foto de la portada se mide contra Noche (la foto va en penumbra).

   node scripts/contraste.mjs            → sale con 1 si algo no llega
   Exporta medirContraste(page) para verificar.mjs.
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function medirContraste(page) {
  return page.evaluate(() => {
    const parse = s => {
      let m = s.match(/^rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
      m = s.match(/^color\(srgb ([^)]+)\)/);
      if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; }
      return null;
    };
    const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const sobre = (a, b) => [a[0] * a[3] + b[0] * (1 - a[3]), a[1] * a[3] + b[1] * (1 - a[3]), a[2] * a[3] + b[2] * (1 - a[3]), 1];
    function fondo(el) {
      const capas = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c[3] > 0) { capas.push(c); if (c[3] >= 0.99) break; }
        if (n.classList && (n.classList.contains('portada') || n.classList.contains('arco__foto'))) { capas.push([28, 25, 23, 1]); break; }
      }
      let f = [28, 25, 23, 1];
      if (capas.length && capas[capas.length - 1][3] >= 0.99) f = capas.pop();
      for (let i = capas.length - 1; i >= 0; i--) f = sobre(capas[i], f);
      return f;
    }
    const fallos = [];
    let medidos = 0, peor = 99;
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.sprite, .cortina, script, style, .visualmente-oculto, [hidden], .cursor, .cursor-punto, svg, .cinta__fila[aria-hidden="true"] li ~ li[aria-hidden]')) continue;
      const propio = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (!propio) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      let op = 1; for (let n = el; n; n = n.parentElement) op *= +getComputedStyle(n).opacity;
      if (op < 0.98) continue;                         /* a medio animar: se mide en reposo */
      const c = parse(cs.color); if (!c) continue;
      const f = fondo(el), t = sobre(c, f);
      const L1 = lum(t), L2 = lum(f), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const tam = parseFloat(cs.fontSize), negrita = +cs.fontWeight >= 700;
      const minimo = tam >= 24 || (negrita && tam >= 18.66) ? 3 : 4.5;
      medidos++; peor = Math.min(peor, ratio);
      if (ratio < minimo) fallos.push(`${ratio.toFixed(2)} < ${minimo} · ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} «${el.textContent.trim().slice(0, 40)}»`);
    }
    return { medidos, peor: +peor.toFixed(2), fallos };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import('file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs');
  const { crearServidor } = await import('./servir.mjs');
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const srv = crearServidor(raiz).listen(4262, '127.0.0.1');
  const nav = await chromium.launch();
  const PAGINAS = ['', 'centro-estetica-zafra', 'tratamientos-faciales-zafra', 'indiba-zafra', 'tratamientos-corporales-zafra', 'spa-relax-masajes-zafra', 'depilacion-fotodepilacion-zafra', 'estetica-general-zafra', 'contacto', 'aviso-legal', 'politica-privacidad', 'politica-cookies', 'no-existe'];
  let mal = 0;
  for (const densidad of ['boveda', 'sobria']) {
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(d => { try { localStorage.setItem('ms-cookies', 'ok'); localStorage.setItem('ms-densidad', d); } catch (e) {} }, densidad);
    const page = await ctx.newPage();
    for (const p of PAGINAS) {
      await page.goto('http://127.0.0.1:4262/' + p + '?revision', { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const r = await medirContraste(page);
      mal += r.fallos.length;
      console.log(`${densidad.padEnd(7)} ${(p || 'inicio').padEnd(32)} ${String(r.medidos).padStart(4)} textos · peor ${r.peor}:1${r.fallos.length ? '\n   ' + r.fallos.join('\n   ') : ''}`);
    }
    await ctx.close();
  }
  await nav.close(); srv.close();
  console.log(mal ? mal + ' textos por debajo de AA' : 'Todo el texto llega a AA');
  process.exitCode = mal ? 1 : 0;
}
