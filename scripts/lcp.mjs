/* LCP real en móvil (memoria «Lighthouse en localhost engaña»): Playwright + CDP con
   red 4G (1,6 Mbps, 150 ms) y CPU ×4, iPhone 13, caché vacía, mediana de 3 cargas.
   Mide la portada en la primera visita (con cortina), la portada en una visita ya
   empezada (sin cortina) y una página de tratamientos.

   node scripts/lcp.mjs
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import { crearServidor } from './servir.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = 4268, BASE = `http://127.0.0.1:${PUERTO}/`;
const srv = crearServidor(raiz).listen(PUERTO, '127.0.0.1');
const nav = await chromium.launch();

async function medir(ruta, visita) {
  const ctx = await nav.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(v => {
    try { localStorage.setItem('ms-cookies', 'ok'); if (v) sessionStorage.setItem('ms-visita', '1'); } catch (e) {}
    window.__lcp = [];
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__lcp.push({ t: Math.round(e.startTime), el: e.element ? e.element.tagName.toLowerCase() + (e.element.closest('picture') ? '[' + e.element.closest('picture').dataset.foto + ']' : '') + (e.element.className ? '.' + String(e.element.className).split(' ')[0] : '') : (e.url || '').split('/').pop() }))).observe({ type: 'largest-contentful-paint', buffered: true });
  }, visita);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(BASE + ruta, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(6500);
  const r = await page.evaluate(() => window.__lcp[window.__lcp.length - 1]);
  await ctx.close();
  return r;
}
const mediana = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const [ruta, visita, nombre] of [['', false, 'portada · 1.ª visita (cortina)'], ['', true, 'portada · visita empezada'], ['indiba-zafra', true, 'indiba-zafra']]) {
  const rs = [];
  for (let i = 0; i < 3; i++) rs.push(await medir(ruta, visita));
  console.log(nombre.padEnd(32), 'LCP mediana', mediana(rs.map(r => r.t)), 'ms ·', rs.map(r => r.t + ' ms ' + r.el).join(' | '));
}
await nav.close(); srv.close();
