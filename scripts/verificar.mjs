/* Verificación de Marina Spa · «Bóveda» (PLIEGO §7 y el encargo PROMPT-boveda.md).
   Levanta servir.mjs (rutas sin extensión, como Pages), abre la web con Playwright
   (Chromium) y baja con mouse.wheel (con Lenis, window.scrollTo no dispara ScrollTrigger).

     0  · los datos mandan, glifos, estáticos, versionado, CDN
     1  · migración: 12 URL sin extensión, <title>/description/canonical/h1, JSON-LD, .htaccess
     2  · cortina: muestreo dentro de la página, aterrizaje < 2 px, formación única;
          sin cortina, el loto florece (una vez por visita), bóvedas y llama;
          fotogramas a medio dibujar / halo / paño a media subida (ala de gaviota),
          atasco de 700 ms, móvil emulado, segunda página sin cortina
     3  · retirada sin CDN, sin JS y con movimiento reducido (display:none)
     4  · checklist 1 cursor · 2 pila · 3 menú · 4 cookies · 6 hero en móviles bajos ·
          7 has-motion · 8 autoRound · 9 clases de estado · 10 barra del móvil
     5  · la carta (53 líneas, precio literal, erratas, «el mejor», «láser», bonos, zonas)
     6  · recorrido, pestañas, índice de grupos, arcos sin clip-path, carril, polvo
     7  · horario con reloj falso, enlaces tel:/wa.me, mapa al pulsar, teclado
     8  · borrado de los cuatro módulos y del mando, en copias temporales
     9  · las dos densidades, el buscador de la sobria y sin ?revision no hay mando
     10 · textos prohibidos, noindex, consola limpia en las 13 páginas
   Con --capturas guarda screenshots/ (cada página a 6 tamaños y los fotogramas pedidos).

   node scripts/verificar.mjs [--capturas] [--solo=<parte del nombre de un bloque>]
*/
import { chromium, devices } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { crearServidor } from './servir.mjs';
import { huellas } from './versionar.mjs';
import { medirContraste } from './contraste.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/package.json')('sharp');
const conCapturas = process.argv.includes('--capturas');
const DIR_CAP = path.join(raiz, 'screenshots');
if (conCapturas) { fs.mkdirSync(DIR_CAP, { recursive: true }); for (const f of fs.readdirSync(DIR_CAP)) fs.rmSync(path.join(DIR_CAP, f), { force: true }); }
const foto = n => path.join(DIR_CAP, n);
const leer = f => JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8'));
const paginas = leer('data/paginas.json'), cambios = leer('data/seo-cambios.json').cambios, carta = leer('data/carta.json');
const DOM = 'https://marinaspa.es';

const fallos = [], notas = [];
function comprobar(ok, msg) { (ok ? notas : fallos).push((ok ? 'OK    ' : 'FALLA ') + '· ' + msg); if (!ok) console.log('FALLA · ' + msg); }
const SOLO = (process.argv.find(a => a.startsWith('--solo=')) || '').slice(7);
async function bloque(nombre, fn, limite = 240000) {
  if (SOLO && !nombre.includes(SOLO)) return;
  const t0 = Date.now();
  try { await Promise.race([fn(), new Promise((_, r) => setTimeout(() => r(new Error('tiempo agotado (' + limite / 1000 + ' s)')), limite))]); }
  catch (e) { comprobar(false, nombre + ': se rompió la prueba · ' + (e.message || e).split('\n')[0]); }
  console.log(`· ${nombre} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
const PUERTO = 4263, BASE = `http://127.0.0.1:${PUERTO}/`;
const CDN = /cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/;
const RUTAS = paginas.map(p => p.url === '/' ? '' : p.url.slice(1));
const AREAS = ['tratamientos-faciales-zafra', 'indiba-zafra', 'tratamientos-corporales-zafra', 'spa-relax-masajes-zafra', 'depilacion-fotodepilacion-zafra', 'estetica-general-zafra'];
const norma = s => String(s).replace(/[\s\u2009\u202f\u00a0]+/g, '').toLowerCase();

const servidores = [crearServidor(raiz).listen(PUERTO, '127.0.0.1')];
const navegador = await chromium.launch();
async function nuevaPagina(opciones = {}, { cookiesVistas = true, bloquearCDN = false, visita = false } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  await ctx.addInitScript(([c, v]) => {
    try { if (c) localStorage.setItem('ms-cookies', 'ok'); if (v) sessionStorage.setItem('ms-visita', '1'); } catch (e) {}
  }, [cookiesVistas, visita]);
  if (bloquearCDN) await ctx.route(CDN, r => r.abort());
  const page = await ctx.newPage();
  page.errores = []; page.respuestas = [];
  page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /GSAP|Lenis/.test(m.text()))) page.errores.push(m.text()); });
  page.on('pageerror', e => page.errores.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400 && !(r.status() === 404 && /no-existe/.test(r.url()))) page.respuestas.push(r.status() + ' ' + r.url()); });
  return { ctx, page };
}
async function hastaAbajo(page, paso = 700) {
  await page.mouse.move(700, 450);
  let ant = -1;
  for (let i = 0; i < 200; i++) {
    await page.mouse.wheel(0, paso); await page.waitForTimeout(110);
    const y = await page.evaluate(() => Math.round(scrollY));
    if (y === ant) break; ant = y;
  }
  await page.waitForTimeout(2200);
}
/* ir a un elemento con la rueda, llevando la cuenta de lo despachado (Lenis va por detrás de scrollY) */
async function irA(page, selector, margen = 0.15, espera = 1500) {
  const destino = await page.evaluate(([s, m]) => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().top + scrollY - innerHeight * m) : null; }, [selector, margen]);
  if (destino == null) return false;
  await page.mouse.move(Math.min(700, (page.viewportSize().width / 2) | 0), 300);
  let restante = destino - await page.evaluate(() => scrollY);
  while (Math.abs(restante) > 12) { const d = Math.sign(restante) * Math.min(Math.abs(restante), 420); await page.mouse.wheel(0, d); restante -= d; await page.waitForTimeout(55); }
  await page.waitForTimeout(espera);
  return true;
}
/* en táctil la rueda no sirve: scroll directo (sin Lenis en móvil táctil para la rueda) */
async function bajarTactil(page) { for (let i = 0; i < 80; i++) { const fin = await page.evaluate(() => { scrollBy(0, 600); return innerHeight + scrollY >= document.body.scrollHeight - 2; }); await page.waitForTimeout(60); if (fin) break; } await page.waitForTimeout(800); }
const tmpCopia = (sufijo, conScripts = true) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marina-' + sufijo + '-'));
  const fuera = new Set(['screenshots', '.git', conScripts ? path.join('scripts', 'fuentes') : 'scripts']);
  const copiar = (de, a) => { fs.mkdirSync(a, { recursive: true }); for (const e of fs.readdirSync(de, { withFileTypes: true })) { if (fuera.has(path.relative(raiz, path.join(de, e.name)))) continue; const o = path.join(de, e.name), d = path.join(a, e.name); if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d); } };
  copiar(raiz, tmp);
  return tmp;
};
let puertoCopia = 4264;
const servirCopia = dir => { const p = puertoCopia++; servidores.push(crearServidor(dir).listen(p, '127.0.0.1')); return `http://127.0.0.1:${p}/`; };

try {
  /* ═══════════════ 0 · datos, glifos, estáticos ═══════════════ */
  await bloque('0 · datos y estáticos', async () => {
    const r = spawnSync(process.execPath, [path.join(raiz, 'scripts/construir.mjs'), '--comprobar'], { encoding: 'utf8' });
    comprobar(r.status === 0, 'construir.mjs: las 13 páginas están al día con data/*.json');
    const g = spawnSync('python', ['-I', path.join(raiz, 'scripts/comprobar-glifos.py')], { encoding: 'utf8' });
    comprobar(g.status === 0, 'fuentes autoalojadas (woff2 latino): € ñ tildes « » ® y espacio fino presentes en todos los pesos');
    const fuentes = fs.readdirSync(path.join(raiz, 'assets/fuentes'));
    comprobar(fuentes.length === 5 && fuentes.every(f => f.endsWith('.woff2')), 'cinco woff2 propios (Cormorant 300–500 variable + 300 cursiva, Lato 300/400/700): ' + fuentes.join(', '));
    for (const f of ['.nojekyll', 'manifest.json', 'assets/marca/favicon.svg', 'assets/marca/apple-touch-icon.png', 'assets/marca/icono-192.png', 'assets/marca/icono-512.png', 'robots.txt', 'sitemap.xml', '.htaccess', '404.html'])
      comprobar(fs.existsSync(path.join(raiz, f)), 'existe ' + f);
    const og = await sharp(path.join(raiz, 'assets/og-marina-spa.jpg')).metadata();
    comprobar(og.width === 1200 && og.height === 630, 'og:image de 1200×630 hecha a propósito (' + og.width + '×' + og.height + ')');
    const man = leer('manifest.json');
    comprobar(man.icons.every(i => fs.existsSync(path.join(raiz, i.src))), 'manifest.json: todos sus iconos existen');
    const sm = fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8');
    const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    comprobar(locs.length === 12 && paginas.every(p => locs.includes(DOM + p.url)), 'sitemap.xml con las 12 URL de hoy (' + locs.length + ')');
    comprobar(fs.readFileSync(path.join(raiz, 'robots.txt'), 'utf8') === 'User-agent: *\nAllow: /\n\nSitemap: https://marinaspa.es/sitemap.xml\n', 'robots.txt como el suyo');
    const hojas = ['css/estilos.css', 'css/opinion.css', 'css/cinta.css', 'css/recorrido.css', 'css/beauty-party.css'].map(f => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n');
    comprobar(!/(sepia|saturate|brightness|grayscale|contrast|hue-rotate)\(/.test(hojas), 'la gradación va horneada: ningún filter de color en CSS (sepia/saturate/brightness…)');
    comprobar(!/clip-path/.test(hojas), 'arcos: ninguna regla de clip-path en las hojas (ninguna foto se destapa desde abajo)');
    comprobar(!/opacity:\s*\.[0-9]+\s*[;}]/.test(hojas.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{[^}]*\{[^}]*\}[^}]*\}/g, '').replace(/stroke-opacity/g, '')), 'ningún texto apagado con opacity fija (solo estados de animación)');
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8');
    comprobar(!/shadowBlur|ctx\.filter/.test(js), 'polvo dorado: sin shadowBlur ni ctx.filter por fotograma (sprite cacheado)');
    comprobar(/autoRound:\s*false/.test(js), 'checklist 8 · los trazos de la cortina llevan autoRound:false');
    /* versionado: ?v= = huella real, solo en href/src; idempotente */
    const v = huellas(raiz), todas = fs.readdirSync(raiz).filter(f => f.endsWith('.html'));
    let malos = [];
    for (const f of todas) {
      const h = fs.readFileSync(path.join(raiz, f), 'utf8');
      for (const m of h.matchAll(/(?:href|src)="\/?((?:css|js)\/[^"?]+)(\?v=([0-9a-f]+))?"/g)) if (!m[3] || m[3] !== v[m[1]]) malos.push(f + ' → ' + m[1]);
      if (!/<meta charset="utf-8">\s*<meta name="robots" content="noindex, nofollow">/.test(h)) malos.push(f + ' sin noindex tras el charset');
      if (/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(h)) malos.push(f + ' Lenis desde cdnjs');
      if (!/cdn\.jsdelivr\.net\/npm\/lenis@/.test(h)) malos.push(f + ' sin Lenis de jsDelivr');
    }
    comprobar(malos.length === 0, '13 páginas: noindex justo tras el charset, Lenis desde jsDelivr y CSS/JS con ?v=<huella> al día' + (malos.length ? ' · ' + malos.slice(0, 4).join(' | ') : ''));
    const tmp = tmpCopia('versionar');
    execFileSync(process.execPath, [path.join(tmp, 'scripts/versionar.mjs'), tmp]);
    const seg = execFileSync(process.execPath, [path.join(tmp, 'scripts/versionar.mjs'), tmp], { encoding: 'utf8' });
    comprobar(!/actualizado/.test(seg), 'versionar.mjs es idempotente (la segunda pasada: «sin cambios»)');
    /* el .htaccess */
    const ht = fs.readFileSync(path.join(raiz, '.htaccess'), 'utf8');
    const viejas = ['quienes-somos', 'indiba', 'depilacion', 'rituales-faciales', 'corporales', 'spa', 'estetica-general'];
    comprobar(viejas.every(x => new RegExp('RewriteRule \\^' + x.replace(/-/g, '\\\\-') + '/\\?\\$ /[a-z-]+ \\[R=301,L\\]').test(ht)) && /\\\.html\[\\s\?\] \[NC\]/.test(ht) && /RewriteRule \^\(\.\+\)\/\$ \/\$1 \[R=301,L\]/.test(ht) && /RewriteRule \^\(\[\^\.\]\+\)\$ \/\$1\.html \[L\]/.test(ht) && /ErrorDocument 404 \/404\.html/.test(ht),
      '.htaccess: sin extensión, 301 de x.html → /x y de /x/ → /x, 301 de las 7 rutas viejas del JSON-LD y ErrorDocument 404');
    /* carta.json = la de los bocetos con SOLO las 4 erratas */
    const orig = JSON.parse(fs.readFileSync(path.join(raiz, '..', 'marina-spa-zafra-bocetos', 'data', 'carta.json'), 'utf8'));
    let difs = 0;
    orig.paginas.forEach((p, i) => p.grupos.forEach((g, j) => { if (g.entradilla !== carta.paginas[i].grupos[j].entradilla) difs++; g.tratamientos.forEach((t, k) => { const n = carta.paginas[i].grupos[j].tratamientos[k]; for (const c of ['nombre', 'precio', 'duracion', 'descripcion']) if (t[c] !== n[c]) difs++; }); }));
    comprobar(difs === 4, 'data/carta.json es la de su web con exactamente 4 cambios (las erratas acordadas): ' + difs);
  });

  /* ═══════════════ 1 · migración ═══════════════ */
  await bloque('1 · migración', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    const malas = [];
    for (const p of paginas) {
      const ruta = p.url === '/' ? '' : p.url.slice(1);
      const r = await page.request.get(BASE + ruta);
      if (r.status() !== 200) { malas.push(p.url + ' → ' + r.status()); continue; }
      const html = await r.text();
      const esperado = { ...p };
      cambios.filter(c => c.url === p.url).forEach(c => { esperado[c.campo] = c.valor; });
      const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
      const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
      const c = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
      const dec = s => s && s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (dec(t) !== esperado.title) malas.push(p.url + ' title «' + t + '»');
      if (dec(d) !== esperado.description) malas.push(p.url + ' description');
      if (c !== DOM + p.url) malas.push(p.url + ' canonical ' + c);
      await page.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
      const h1 = await page.evaluate(() => document.querySelector('h1').getAttribute('aria-label') || document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim());
      if (h1 !== p.h1) malas.push(p.url + ' h1 «' + h1 + '»');
    }
    comprobar(malas.length === 0, 'las 12 URL sin extensión dan 200 y su <title>, description, canonical y h1 son los de paginas.json salvo los cambios de las reglas 3 y 4' + (malas.length ? ': ' + malas.join(' | ') : ''));
    comprobar(cambios.length === 8, 'seo-cambios.json: 3 de la regla 3, 1 de la regla 4 y 4 títulos propios (contacto y legales)');
    const r404 = await page.request.get(BASE + 'esto-no-existe');
    comprobar(r404.status() === 404 && /Esta página no existe/.test(await r404.text()), 'una ruta inexistente da 404 con la página propia');
    const conHtml = await page.request.get(BASE + 'indiba-zafra.html');
    comprobar(conHtml.status() === 200, 'indiba-zafra.html también se sirve (el .htaccess lo redirige a /indiba-zafra en IONOS)');
    /* JSON-LD */
    const ld = {};
    for (const p of paginas) {
      await page.goto(BASE + (p.url === '/' ? '' : p.url.slice(1)), { waitUntil: 'domcontentloaded' });
      ld[p.url] = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch (e) { return { error: e.message }; } }));
    }
    const todos = Object.values(ld).flat();
    comprobar(todos.every(d => !d.error), 'JSON-LD: los ' + todos.length + ' bloques parsean');
    comprobar(!JSON.stringify(todos).match(/aggregateRating|"review"/), 'JSON-LD: sin aggregateRating ni review');
    const ini = ld['/'][0];
    const vie = ini.openingHoursSpecification.filter(o => [].concat(o.dayOfWeek).includes('Friday')).map(o => o.opens + '-' + o.closes).sort();
    comprobar(ini['@type'] === 'DaySpa' && ini['@id'] === DOM + '/#beautysalon' && ini.url === DOM + '/', 'inicio: DaySpa con @id https://marinaspa.es/#beautysalon y url buena');
    comprobar(vie.join(',') === '10:00-14:00,16:30-20:30', 'JSON-LD: el viernes partido (' + vie.join(', ') + ')');
    const imgs = [ini.logo, ...ini.image].map(u => u.replace(DOM + '/', ''));
    comprobar(imgs.every(f => fs.existsSync(path.join(raiz, f))), 'JSON-LD: logo e image apuntan a archivos que existen (' + imgs.length + ')');
    const ofertas = ini.hasOfferCatalog.itemListElement.flatMap(c => c.itemListElement);
    comprobar(ofertas.length === 53 && ofertas.filter(o => typeof o.price === 'number').length >= 40, 'hasOfferCatalog desde carta.json: 53 ofertas, ' + ofertas.filter(o => typeof o.price === 'number').length + ' con precio numérico');
    const urlsLd = JSON.stringify(todos).match(/https:\/\/marinaspa\.es\/[^"#]*/g).map(u => u.replace(DOM + '/', '')).filter(u => u && !/\.(png|jpg)$/.test(u));
    comprobar(urlsLd.every(u => RUTAS.includes(u)), 'JSON-LD: todas las url e @id apuntan a rutas que existen (' + [...new Set(urlsLd)].join(', ') + ')');
    const srv = AREAS.every(a => ld['/' + a][0]['@type'] === 'Service' && ld['/' + a][0]['@id'] === DOM + '/' + a + '#service' && ld['/' + a][0].provider['@id'] === DOM + '/#beautysalon');
    comprobar(srv, 'tratamientos: Service con @id propio y provider = #beautysalon');
    comprobar(ld['/centro-estetica-zafra'][0]['@type'] === 'AboutPage' && ld['/contacto'][0]['@type'] === 'ContactPage', 'El centro: AboutPage · Contacto: ContactPage');
    comprobar(paginas.filter(p => p.url !== '/').every(p => ld[p.url].some(d => d['@type'] === 'BreadcrumbList')), 'BreadcrumbList en las 11 interiores');
    await ctx.close();
  });

  /* ═══════════════ 2 · cortina: muestreo dentro de la página ═══════════════ */
  const ENGANCHE = ({ bloqueo = 0, pausaEn = null } = {}) => {
    window.__m = { cubre: null, dash: [], halo: [], pano: [], muestras: 0 };
    document.addEventListener('DOMContentLoaded', () => { const c = document.getElementById('cortina'); window.__m.cubre = c ? getComputedStyle(c).display : 'sin cortina'; });
    let tl = null;
    Object.defineProperty(window, '__cortinaTl', {
      configurable: true, get() { return tl; },
      set(v) {
        tl = v;
        if (pausaEn != null) v.call(() => { v.pause(); window.__pausada = true; }, null, typeof pausaEn === 'number' ? pausaEn : v.labels[pausaEn[0]] + pausaEn[1]);
        if (bloqueo) setTimeout(() => { const t = performance.now(); while (performance.now() - t < bloqueo) {} }, 60);
        (function paso() {
          const c = document.getElementById('cortina');
          if (!c || getComputedStyle(c).display === 'none') return;
          const p = document.querySelector('#cortina-loto [data-petalo="centro"]');
          if (p) window.__m.dash.push(+parseFloat(getComputedStyle(p).strokeDashoffset).toFixed(4));
          window.__m.halo.push(+(+getComputedStyle(document.getElementById('cortina-halo')).opacity).toFixed(3));
          window.__m.pano.push(Math.round(new DOMMatrix(getComputedStyle(document.getElementById('cortina-pano')).transform).m42));
          window.__m.muestras++;
          requestAnimationFrame(paso);
        })();
      }
    });
  };
  await bloque('2 · cortina', async () => {
    const { ctx, page } = await nuevaPagina();
    await ctx.addInitScript(ENGANCHE, {});
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('cortina-fuera') && getComputedStyle(document.getElementById('cortina')).display === 'none', null, { timeout: 12000 });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => Object.assign(window.__m, { at: window.Marina.aterrizaje, form: window.Marina.formaciones, dur: window.Marina.cortina.tl.duration() }));
    comprobar(m.cubre === 'block', 'checklist 5 · la cortina tapa la página al cargar (display ' + m.cubre + ')');
    const inter = new Set(m.dash.filter(v => v > 0.02 && v < 0.98).map(v => v.toFixed(3)));
    comprobar(inter.size >= 8, 'checklist 8 · el loto se dibuja de verdad: stroke-dashoffset del pétalo central pasa por ' + inter.size + ' valores intermedios (autoRound:false)');
    const halos = new Set(m.halo.filter(v => v > 0.05 && v < 0.95).map(v => v.toFixed(2)));
    comprobar(halos.size >= 4, 'cortina: el halo se enciende poco a poco (' + halos.size + ' opacidades intermedias)');
    const panos = m.pano.filter(v => v < -20 && v > -800);
    comprobar(panos.length >= 4, 'cortina: el paño se levanta (' + panos.length + ' fotogramas a media subida)');
    comprobar(m.at && m.at.dx < 2 && m.at.dy < 2 && m.at.dw < 2 && m.at.dyAbajo < 2, 'cortina: el loto aterriza en el arco de la portada a menos de 2 px ' + JSON.stringify(m.at));
    comprobar(m.form === 1, 'cortina: el logo se forma UNA sola vez (' + m.form + ')');
    comprobar(m.dur > 3 && m.dur < 5.2, 'cortina: dura ' + m.dur.toFixed(2) + ' s (salida en ~1,1 s con expo.inOut)');
    const e = await page.evaluate(() => ({
      vis: getComputedStyle(document.querySelector('#portada-loto')).visibility,
      anim: document.querySelector('#portada-loto').getAnimations({ subtree: true }).length,
      dash: [...document.querySelectorAll('#portada-loto path')].map(p => parseFloat(getComputedStyle(p).strokeDashoffset)).every(v => v === 0),
      mov: document.documentElement.classList.contains('has-motion'), lenis: document.documentElement.classList.contains('lenis'),
      lema: (() => { const l = document.querySelector('#portada-lema'); const i = l.querySelector('.letra'); return i ? Math.round(i.getBoundingClientRect().top - i.parentElement.getBoundingClientRect().top - parseFloat(getComputedStyle(i.parentElement).paddingTop)) : null; })()
    }));
    comprobar(e.vis === 'visible' && e.anim === 0 && e.dash, 'el loto de la portada está entero y ya no se dibuja (se formó una vez, en la cortina)');
    comprobar(e.mov && e.lenis, 'checklist 7 · con GSAP y sin movimiento reducido hay html.has-motion; Lenis gobierna el scroll');
    comprobar(e.lema !== null && Math.abs(e.lema) <= 2, 'char-reveal: las letras del lema acaban en su sitio (desfase ' + e.lema + ' px dentro de su palabra)');
    comprobar(page.errores.length === 0 && page.respuestas.length === 0, 'portada: consola limpia y sin 4xx' + (page.errores.concat(page.respuestas).length ? ': ' + page.errores.concat(page.respuestas).slice(0, 3).join(' | ') : ''));
    /* segunda página de la visita: sin cortina, con la entrada corta */
    await page.goto(BASE + 'indiba-zafra', { waitUntil: 'domcontentloaded' });
    const ent = await page.evaluate(() => ({ e: document.documentElement.classList.contains('entrada'), c: !!document.getElementById('cortina') }));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const seg = await page.evaluate(() => ({ cubre: window.__m.cubre, form: window.Marina.formaciones, sin: document.documentElement.classList.contains('sin-cortina'), entrada: document.documentElement.classList.contains('entrada'), loto: getComputedStyle(document.querySelector('#portada-loto')).visibility }));
    comprobar(ent.e && !ent.c && seg.cubre === 'none' && seg.form === 0 && seg.sin && seg.entrada && seg.loto === 'visible', 'la cortina solo sale en la primera página de la visita: después, entrada corta sin logo ' + JSON.stringify(seg));
    await ctx.close();
  });
  await bloque('2 · cortina con un atasco de 700 ms', async () => {
    const { ctx, page } = await nuevaPagina();
    await ctx.addInitScript(ENGANCHE, { bloqueo: 700 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('cortina')).display === 'none', null, { timeout: 14000 });
    const m = await page.evaluate(() => window.__m);
    const inter = new Set(m.dash.filter(v => v > 0.02 && v < 0.98).map(v => v.toFixed(3)));
    comprobar(inter.size >= 6, 'reloj que traga atascos: con un bloqueo de 700 ms el loto sigue dibujándose (' + inter.size + ' valores intermedios)');
    await ctx.close();
  });
  /* fotogramas a medias: la propia línea de tiempo se para (memoria «probar cortinas»), página nueva por fotograma */
  for (const [pausa, nombre, w, h] of [[0.75, 'medio-dibujo', 1440, 900], [['enciende', 0.45], 'halo', 1440, 900], [['sube', 0.5], 'media-subida', 1440, 900], [0.75, 'medio-dibujo', 390, 844], [['sube', 0.5], 'media-subida', 390, 844]]) {
    await bloque('2 · fotograma «' + nombre + '» ' + w, async () => {
      const movil = w < 800;
      const { ctx, page } = await nuevaPagina(movil ? { ...devices['iPhone 13'] } : { viewport: { width: w, height: h } });
      await ctx.addInitScript(ENGANCHE, { pausaEn: pausa });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__pausada, null, { timeout: 12000 });
      await page.waitForTimeout(120);
      const png = await page.screenshot(conCapturas ? { path: foto(`cortina-${nombre}-${w}.png`) } : {});
      const r = await page.evaluate(() => ({
        dash: [...document.querySelectorAll('#cortina-loto path')].map(p => +parseFloat(getComputedStyle(p).strokeDashoffset).toFixed(3)),
        halo: +getComputedStyle(document.getElementById('cortina-halo')).opacity,
        pano: new DOMMatrix(getComputedStyle(document.getElementById('cortina-pano')).transform).m42,
        disp: getComputedStyle(document.getElementById('cortina')).display, H: innerHeight, W: innerWidth,
        ala: (() => { const a = document.getElementById('cortina-ala'), r = a.getBoundingClientRect(), p = a.querySelector('path'); const en = (x, y) => p.isPointInFill(new DOMPoint(x, y)); return { top: r.top, bottom: r.bottom, h: r.height, punta: en(50, 17), lado: en(4, 17), arriba: en(4, 2) }; })()
      }));
      if (nombre === 'medio-dibujo') comprobar(r.disp === 'block' && r.dash.some(v => v > 0.05 && v < 0.95) && r.dash.some(v => v === 1) && r.halo < 0.05, `fotograma ${w}: el loto a medio dibujar (offsets ${r.dash.join(' ')})`);
      if (nombre === 'halo') comprobar(r.dash.every(v => v === 0) && r.halo > 0.2 && r.halo < 1 && r.pano === 0, `fotograma ${w}: el loto entero y el halo encendiéndose (opacidad ${r.halo.toFixed(2)})`);
      if (nombre === 'media-subida') {
        /* el ala de gaviota: en el centro el paño baja más que a los lados (la punta), y a los lados la curva sube */
        /* el píxel justo encima de la punta es del paño (Tierra) y a la misma altura, en el lado, ya se ve la portada */
        /* el loto en vuelo es otra capa y puede tapar la punta: se mide el borde en una segunda captura sin él */
        await page.evaluate(() => { document.getElementById('cortina-loto').style.visibility = 'hidden'; 0; });
        const sinLoto = await page.screenshot();
        const { data, info } = await sharp(sinLoto).raw().toBuffer({ resolveWithObject: true });
        const k = info.width / r.W, yy = r.ala.top + r.ala.h * 0.8;
        const px = x => { const i = (Math.round(yy * k) * info.width + Math.round(x * k)) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
        const tierra = c => Math.abs(c[0] - 0x2D) < 4 && Math.abs(c[1] - 0x2A) < 4 && Math.abs(c[2] - 0x26) < 4;
        /* trece puntos a lo ancho de la punta: en móvil el loto en vuelo puede tapar varios */
        const puntas = Array.from({ length: 13 }, (_, i) => px(r.W * (0.47 + i * 0.005))), centro = puntas.find(tierra) || puntas[1], lado = px(r.W * 0.04);
        comprobar(r.pano < -40 && r.pano > -r.H && r.ala.top > 0 && r.ala.bottom < r.H && r.ala.punta && !r.ala.lado && r.ala.arriba && tierra(centro) && !tierra(lado),
          `fotograma ${w}: el paño a media subida con el borde en ala de gaviota a la vista (borde entre ${Math.round(r.ala.top)} y ${Math.round(r.ala.bottom)} px; en la punta ${centro}, en el lado ${lado})`);
      }
      await ctx.close();
    }, 60000);
  }
  await bloque('2 · cortina en móviles emulados', async () => {
    for (const d of ['iPhone 13', 'Pixel 5']) {
      const { ctx, page } = await nuevaPagina({ ...devices[d] });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.documentElement.classList.contains('cortina-fuera') && window.Marina && window.Marina.aterrizaje, null, { timeout: 12000 });
      const at = await page.evaluate(() => window.Marina.aterrizaje);
      comprobar(at.dx < 2 && at.dy < 2 && at.dw < 2 && at.dyAbajo < 2, d + ': el loto aterriza a menos de 2 px (medido en el capullo y el pétalo de abajo) ' + JSON.stringify(at));
      await ctx.close();
    }
  });

  await bloque('2 · portada sin cortina: el loto florece', async () => {
    const GANCHO = pausa => {
      window.__fl = { dcl: null, rot: [], bov: [] };
      /* en cuanto el loto entra en el documento (los módulos corren antes de DOMContentLoaded) */
      const mo = new MutationObserver(() => { const l = document.querySelector('.ventana__loto'); if (l && !window.__fl.dcl) { window.__fl.dcl = { cls: document.documentElement.classList.contains('florece'), vis: getComputedStyle(l).visibility }; mo.disconnect(); } });
      mo.observe(document, { childList: true, subtree: true });
      let tl = null;
      Object.defineProperty(window, '__floreceTl', { configurable: true, get() { return tl; }, set(v) {
        tl = v;
        if (pausa != null) v.call(() => { v.pause(); window.__pausada = true; }, null, pausa);
        (function paso() {
          const p = document.querySelector('#portada-loto [data-petalo="lat0i"]'), m = p.transform.baseVal.consolidate();
          window.__fl.rot.push(m ? +(Math.atan2(m.matrix.b, m.matrix.a) * 57.2958).toFixed(2) : 0);
          window.__fl.bov.push(+parseFloat(getComputedStyle(document.querySelector('#bovedas path')).strokeDashoffset).toFixed(3));
          if (window.__fl.rot.length < 320) requestAnimationFrame(paso);
        })();
      } });
    };
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await ctx.addInitScript(GANCHO, null);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.Marina && window.Marina.floracion && window.Marina.floracion.terminada, null, { timeout: 10000 });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({
      fl: window.__fl, form: window.Marina.formaciones, ses: sessionStorage.getItem('ms-loto'), cortina: getComputedStyle(document.getElementById('cortina')).display,
      fin: [...document.querySelectorAll('#portada-loto path')].map(p => { const m = p.transform.baseVal.consolidate(); return m ? [m.matrix.a, m.matrix.b, m.matrix.c, m.matrix.d].map(x => Math.abs(+x.toFixed(3))).join(',') : '1,0,0,1'; }),
      op: [...document.querySelectorAll('#portada-loto path')].every(p => +getComputedStyle(p).opacity === 1),
      stroke: getComputedStyle(document.getElementById('portada-loto')).stroke, halo: +getComputedStyle(document.getElementById('ventana-halo')).opacity,
      vis: getComputedStyle(document.querySelector('.ventana__loto')).visibility
    }));
    comprobar(r.cortina === 'none' && r.fl.dcl && r.fl.dcl.cls && r.fl.dcl.vis === 'hidden', 'sin cortina: el loto de la portada no se pinta entero antes de florecer (oculto desde el primer pintado)');
    const giros = new Set(r.fl.rot.filter(v => v > 2 && v < 56).map(v => v.toFixed(1)));
    comprobar(giros.size >= 6 && r.fl.rot[r.fl.rot.length - 1] === 0, `el loto florece: los pétalos laterales se abren desde el centro (${giros.size} ángulos intermedios del exterior, de 58° a 0°)`);
    comprobar(r.fin.every(m => m === '1,0,0,1') && r.op && r.vis === 'visible', 'al acabar, los 11 pétalos quedan exactamente en su sitio y opacos');
    comprobar(/248, 222, 156/.test(r.stroke) && r.halo > 0.9, 'al acabar, el loto se enciende: trazo de oro claro y halo (' + r.stroke + ', halo ' + r.halo + ')');
    const bov = new Set(r.fl.bov.filter(v => v > 0.02 && v < 0.98).map(v => v.toFixed(3)));
    comprobar(r.fl.bov[0] === 1 && bov.size >= 6 && r.fl.bov[r.fl.bov.length - 1] === 0, `las bóvedas del fondo se trazan desde la clave (${bov.size} valores intermedios; autoRound:false)`);
    comprobar(r.form === 1 && r.ses === '1', 'el logo se forma una vez: florecer cuenta como la formación de la visita');
    /* la llama late y el halo respira, en el mismo bucle que el polvo */
    await page.evaluate(() => { window.__ll = []; const l = document.getElementById('llama'), h = document.getElementById('ventana-halo'); (function p() { window.__ll.push([l.style.opacity, h.style.scale]); if (window.__ll.length < 70) requestAnimationFrame(p); })(); 0; });
    await page.waitForTimeout(1500);
    const ll = await page.evaluate(() => window.__ll);
    comprobar(new Set(ll.map(x => x[0])).size >= 20 && new Set(ll.map(x => x[1])).size >= 20, 'la llama de la vela late y el halo del loto respira con ella (' + new Set(ll.map(x => x[0])).size + ' opacidades distintas en 70 fotogramas)');
    /* volver a la portada en la misma visita: no florece otra vez */
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(700);
    const r2 = await page.evaluate(() => ({ dcl: window.__fl.dcl, form: window.Marina.formaciones, vis: getComputedStyle(document.querySelector('.ventana__loto')).visibility, rot: window.__fl.rot.length }));
    comprobar(r2.dcl && !r2.dcl.cls && r2.form === 0 && r2.vis === 'visible' && r2.rot === 0, 'al volver a la portada en la misma visita el loto ya está: no florece dos veces');
    comprobar(page.errores.length === 0, 'florecer: consola limpia' + (page.errores.length ? ': ' + page.errores[0] : ''));
    await ctx.close();
    for (const [opc, cfg, nombre] of [[{ reducedMotion: 'reduce' }, { visita: true }, 'movimiento reducido'], [{}, { visita: true, bloquearCDN: true }, 'sin CDN']]) {
      const x = await nuevaPagina(opc, cfg);
      await x.page.goto(BASE, { waitUntil: 'domcontentloaded' }); await x.page.waitForTimeout(900);
      const e = await x.page.evaluate(() => ({ cls: document.documentElement.classList.contains('florece'), vis: getComputedStyle(document.querySelector('.ventana__loto')).visibility, bov: [...document.querySelectorAll('#bovedas path')].every(p => parseFloat(getComputedStyle(p).strokeDashoffset) === 0), halo: +getComputedStyle(document.getElementById('ventana-halo')).opacity }));
      comprobar(!e.cls && e.vis === 'visible' && e.bov && e.halo > 0.9, `${nombre}: el loto, su halo y las bóvedas se ven enteros, sin florecer`);
      await x.ctx.close();
    }
    if (conCapturas) for (const [w, opc] of [[1440, { viewport: { width: 1440, height: 900 } }], [390, { ...devices['iPhone 13'] }]]) {
      const y = await nuevaPagina(opc, { visita: true });
      await y.ctx.addInitScript(GANCHO, 1.3);
      await y.page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await y.page.waitForFunction(() => window.__pausada, null, { timeout: 8000 }); await y.page.waitForTimeout(100);
      await y.page.screenshot({ path: foto(`portada-florece-a-medias-${w}.png`) });
      await y.ctx.close();
    }
  });

  /* ═══════════════ 3 · retirada sin CDN, sin JS y con movimiento reducido ═══════════════ */
  await bloque('3 · retiradas', async () => {
    {
      const { ctx, page } = await nuevaPagina({}, { bloquearCDN: true });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => ({ c: getComputedStyle(document.getElementById('cortina')).display, mov: document.documentElement.classList.contains('has-motion'), loto: getComputedStyle(document.getElementById('portada-loto')).visibility, lema: document.getElementById('portada-lema').getBoundingClientRect().height }));
      comprobar(r.c === 'none' && !r.mov && r.loto === 'visible' && r.lema > 40, 'sin CDN: la cortina se retira (display none), no hay has-motion y portada y loto se ven');
      await hastaAbajo(page);
      const vis = await page.evaluate(() => ({ filetes: [...document.querySelectorAll('.filete path')].every(p => parseFloat(getComputedStyle(p).strokeDashoffset) === 0), fotos: [...document.querySelectorAll('.arco__foto img')].every(i => getComputedStyle(i).filter === 'none'), paneles: document.querySelectorAll('.panel:not([data-oculto])').length, cifra: document.querySelector('[data-contar="300"]').textContent }));
      comprobar(vis.filetes && vis.fotos && vis.paneles === 1 && vis.cifra === '+300', 'sin CDN: la web se lee entera (filetes puestos, fotos nítidas, cifras con su valor, pestañas funcionando)');
      if (conCapturas) { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: foto('sin-cdn-1440.png'), fullPage: true, type: 'jpeg', quality: 70 }); }
      const errSinCdn = page.errores.filter(e => !/net::ERR_FAILED/.test(e));   /* las propias peticiones al CDN abortadas */
      comprobar(errSinCdn.length === 0, 'sin CDN: consola sin más errores que los del CDN bloqueado' + (errSinCdn.length ? ': ' + errSinCdn[0] : ''));
      await ctx.close();
    }
    {
      const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'load' });
      comprobar(!(await page.locator('#cortina').isVisible()) && await page.locator('#portada-lema').isVisible() && await page.locator('#panel-indiba').isVisible(), 'sin JS: la cortina no tapa nada (<noscript>) y se ve todo, también las seis pestañas de la carta');
      await ctx.close();
    }
    {
      const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
      await ctx.addInitScript(() => { window.__vista = []; document.addEventListener('DOMContentLoaded', () => { const c = document.getElementById('cortina'); if (!c) return; window.__vista.push(getComputedStyle(c).display); requestAnimationFrame(() => window.__vista.push(getComputedStyle(c).display)); }); });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => ({ v: window.__vista, mov: document.documentElement.classList.contains('has-motion'), cifra: document.querySelector('[data-contar="10"]').textContent, hoy: document.querySelectorAll('#horario tr.es-hoy').length, abierto: document.querySelector('#abierto span').textContent, polvo: !!window.Marina.polvo }));
      comprobar(r.v.length === 2 && r.v.every(d => d === 'none'), 'movimiento reducido: la cortina no pinta ni un fotograma (' + r.v.join(',') + ')');
      comprobar(!r.mov && r.cifra === '+10' && r.hoy === 1 && /Abierto ahora|Ahora cerrado/.test(r.abierto) && !r.polvo, 'movimiento reducido: sin has-motion ni polvo, pero cifras, horario y «abierto ahora» siguen');
      /* el contenido sigue cambiando: pestaña, estancia y grupo activos */
      await page.click('#pest-depilacion');
      const tab = await page.evaluate(() => window.Marina.carta.activa);
      await page.evaluate(() => document.getElementById('recorrido').scrollIntoView());
      await page.click('#estancias button[data-t="18"]');
      await page.waitForTimeout(300);
      const est = await page.evaluate(() => window.Marina.recorrido.activo);
      await page.goto(BASE + 'tratamientos-faciales-zafra', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.getElementById('g-tratamientos-faciales-avanzados').scrollIntoView());
      await page.waitForTimeout(300);
      const gr = await page.evaluate(() => window.Marina.indice.activo);
      comprobar(tab === 'depilacion' && est === 'Corporales' && gr === 'g-tratamientos-faciales-avanzados', 'movimiento reducido: la pestaña, la estancia del recorrido y el grupo activo siguen cambiando (' + [tab, est, gr].join(', ') + ')');
      if (conCapturas) { await page.goto(BASE, { waitUntil: 'load' }); await page.screenshot({ path: foto('reducido-1440.png'), fullPage: true, type: 'jpeg', quality: 70 }); }
      comprobar(page.errores.length === 0, 'movimiento reducido: consola limpia' + (page.errores.length ? ': ' + page.errores[0] : ''));
      await ctx.close();
    }
  });

  /* ═══════════════ 4 · checklist ═══════════════ */
  await bloque('4 · checklist 1 · cursor', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.mouse.move(300, 300); await page.mouse.move(320, 310); await page.waitForTimeout(300);
    const r1 = await page.evaluate(() => ({ cur: getComputedStyle(document.body).cursor, aro: +getComputedStyle(document.querySelector('.cursor')).opacity, pt: +getComputedStyle(document.querySelector('.cursor-punto')).opacity }));
    comprobar(r1.cur === 'none' && r1.aro > 0.9 && r1.pt > 0.9, 'checklist 1 · cursor propio: el del sistema se oculta y se ven el punto dorado y el aro');
    const sobre = async (sel, espera) => { const b = await page.locator(sel).first().boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await page.waitForTimeout(450); return page.evaluate(() => { const a = document.querySelector('.cursor'); const c = getComputedStyle(a).backgroundColor.match(/[\d.]+/g); return { activo: a.classList.contains('es-activo'), texto: a.classList.contains('es-texto') ? a.dataset.texto : '', alfa: c && c[3] ? +c[3] : 1 }; }); };
    const bt = await sobre('#portada .boton--oro');
    comprobar(bt.activo && bt.alfa >= 0.35, 'checklist 1 · sobre un botón el aro crece con relleno visible (alfa ' + bt.alfa + ')');
    await irA(page, '#tratamientos .arcos', 0.2);
    const ft = await sobre('#tratamientos .arco');
    await irA(page, '#recorrido', 0.1);
    const vd = await sobre('#recorrido .arco--video');
    await irA(page, '.mapa', 0.3);
    const mp = await sobre('.mapa');
    comprobar(ft.texto === 'Abrir' && vd.texto === '' && mp.texto === 'Mapa', 'cursor contextual: «Abrir» sobre las tarjetas que enlazan, nada sobre el vídeo del recorrido (no se pulsa) y «Mapa» sobre el mapa (' + [ft.texto, vd.texto || '—', mp.texto].join(' / ') + ')');
    await page.mouse.move(-5, 400); await page.mouse.move(-10, 400);
    await ctx.close();
    const t = await nuevaPagina({ ...devices['iPhone 13'] }, { visita: true });
    await t.page.goto(BASE, { waitUntil: 'load' }); await t.page.waitForTimeout(800);
    comprobar(await t.page.evaluate(() => !document.querySelector('.cursor') && !document.documentElement.classList.contains('con-cursor')), 'cursor propio: nada en táctil');
    await t.ctx.close();
  });
  await bloque('4 · checklist 2 · pila sticky de El centro', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE + 'centro-estetica-zafra', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const base = await page.evaluate(() => {
      const li = [...document.querySelectorAll('.pila__item')], cs = li.map(l => getComputedStyle(l));
      return { pos: cs.map(c => c.position), mb: cs.map(c => c.marginBottom), altos: li.map(l => l.querySelector('.tarjeta').offsetHeight), tope: parseFloat(cs[0].top), after: getComputedStyle(document.querySelector('.pila'), '::after').height };
    });
    comprobar(base.pos.every(p => p === 'sticky') && new Set(base.mb).size === 1 && Math.max(...base.altos) - Math.min(...base.altos) <= 1 && parseFloat(base.after) > 0,
      'checklist 2 · el <li> es el sticky; las cuatro con el mismo margin-bottom (' + base.mb[0] + ', la última incluida), el mismo alto (' + base.altos.join('/') + ') y ::after de reposo');
    /* página limpia, bajando desde arriba en pasos de 30 px (geometría pura: Lenis se mueve sin suavizado) */
    const r = await page.evaluate(async tope => {
      const L = window.Marina.lenis, li = [...document.querySelectorAll('.pila__item')], n = li.length;
      const ir = y => new Promise(res => { if (L) L.scrollTo(y, { immediate: true }); else scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(res)); });
      const ini = li[0].getBoundingClientRect().top + scrollY - 400, fin = ini + li[n - 1].getBoundingClientRect().top - li[0].getBoundingClientRect().top + innerHeight * 1.6 + 400;
      let sueltaAntes = 0, asoma = 0, separadas = 0, posada = false, vistas = 0;
      for (let y = ini; y < fin; y += 30) {
        await ir(y);
        const tops = li.map(l => l.getBoundingClientRect().top), bottoms = li.map(l => l.querySelector('.tarjeta').getBoundingClientRect().bottom);
        const ultima = Math.abs(tops[n - 1] - tope) < 1.5;
        if (ultima) { posada = true; vistas++; if (tops.some(t => Math.abs(t - tope) > 1.5)) sueltaAntes++; if (bottoms.slice(0, -1).some(b => b > bottoms[n - 1] + 1)) asoma++; }
        /* antes de posarse la última, ninguna de las ya pegadas se suelta */
        if (!posada) { const pegadas = tops.slice(0, -1).filter((t, i) => li[i + 1].getBoundingClientRect().top < innerHeight); if (pegadas.some(t => t < tope - 1.5)) sueltaAntes++; }
        /* al acabar, salen todas juntas */
        if (posada && tops[n - 1] < tope - 2 && tops.some(t => Math.abs(t - tops[n - 1]) > 1.5)) separadas++;
      }
      return { sueltaAntes, asoma, separadas, vistas };
    }, base.tope);
    comprobar(r.vistas > 3 && r.sueltaAntes === 0 && r.asoma === 0 && r.separadas === 0, 'checklist 2 · pila: nadie se suelta antes de posarse la última, nada asoma por debajo y salen todas juntas ' + JSON.stringify(r));
    if (conCapturas) {
      await page.evaluate(() => { const L = window.Marina.lenis, li = document.querySelectorAll('.pila__item'); const y = li[2].getBoundingClientRect().top + scrollY - innerHeight * 0.55; L ? L.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
      await page.waitForTimeout(800); await page.screenshot({ path: foto('pila-a-mitad-1440.png') });
    }
    await ctx.close();
    const m = await nuevaPagina({ ...devices['iPhone 13'] }, { visita: true });
    await m.page.goto(BASE + 'centro-estetica-zafra', { waitUntil: 'load' });
    comprobar(await m.page.evaluate(() => getComputedStyle(document.querySelector('.pila__item')).position) === 'static', 'checklist 2 · en móvil la pila se desapila');
    await m.ctx.close();
  });
  await bloque('4 · checklist 3 · menú móvil con la cabecera fija', async () => {
    const { ctx, page } = await nuevaPagina({ ...devices['iPhone 13'] }, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 1600)); await page.waitForTimeout(500);
    const cerr = await page.evaluate(() => { const r = document.getElementById('navegacion').getBoundingClientRect(); return { b: r.bottom, vis: getComputedStyle(document.getElementById('navegacion')).visibility, fija: document.getElementById('cabecera').classList.contains('es-fija') }; });
    await page.click('#hamburguesa'); await page.waitForTimeout(700);
    const ab = await page.evaluate(() => { const r = document.getElementById('navegacion').getBoundingClientRect(); return { t: r.top, h: r.height, exp: document.getElementById('hamburguesa').getAttribute('aria-expanded'), ih: innerHeight }; });
    await page.click('#hamburguesa', { timeout: 3000 }); await page.waitForTimeout(700);
    const otra = await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded'));
    comprobar(cerr.fija && (cerr.b <= 0 || cerr.vis === 'hidden') && Math.abs(ab.t) < 1 && ab.h >= ab.ih - 1 && ab.exp === 'true' && otra === 'false', 'checklist 3 · menú móvil (cabecera ya fija con blur): cerrado no asoma, abierto mide la pantalla (' + Math.round(ab.h) + ' px, 100dvh) y el botón lo vuelve a cerrar');
    await ctx.close();
  });
  await bloque('4 · checklist 4 · cookies', async () => {
    const { ctx, page } = await nuevaPagina({}, { cookiesVistas: false, visita: true });
    await page.goto(BASE + '?revision', { waitUntil: 'load' }); await page.waitForTimeout(800);
    const d1 = await page.evaluate(() => ({ c: getComputedStyle(document.getElementById('cookies')).display, m: getComputedStyle(document.getElementById('mando')).display }));
    await page.click('#cookies-aceptar');
    const d2 = await page.evaluate(() => ({ c: getComputedStyle(document.getElementById('cookies')).display, k: localStorage.getItem('ms-cookies'), m: getComputedStyle(document.getElementById('mando')).display }));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(500);
    const d3 = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    comprobar(d1.c === 'flex' && d2.c === 'none' && d2.k === 'ok' && d3 === 'none', 'checklist 4 · cookies: sale, «Entendido» lo cierra de verdad y no vuelve (' + [d1.c, d2.c, d3].join(' → ') + ')');
    comprobar(d1.m === 'none' && d2.m === 'block', 'el mando se aparta mientras está el aviso de cookies y aparece al cerrarlo');
    await page.click('#cookies-reabrir');
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'flex', 'el aviso se puede volver a ver desde el pie');
    await ctx.close();
  });
  await bloque('4 · checklist 6 · portada en móviles bajos', async () => {
    for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024], [1366, 768], [1440, 900]]) {
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 }, { visita: true });
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const caja = s => { const e = document.querySelector(s).getBoundingClientRect(); return { l: e.left, t: e.top, r: e.right, b: e.bottom, w: e.width }; };
        const p = { cab: caja('.cabecera__barra'), h1: caja('#portada-h1'), lema: caja('#portada-lema'), entrada: caja('.portada__entrada'), acciones: caja('#portada .acciones'), abierto: caja('#abierto'), arco: caja('.arco--ventana') };
        const choca = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
        const k = Object.keys(p), ch = [];
        for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) if (choca(p[k[i]], p[k[j]])) ch.push(k[i] + '×' + k[j]);
        return { ch, p, sw: document.documentElement.scrollWidth, vw: innerWidth };
      });
      comprobar(r.ch.length === 0, `checklist 6 · portada ${w}×${h}: cabecera, titular, botones, «abierto» y arco no se pisan` + (r.ch.length ? ' (' + r.ch.join(', ') + ')' : ''));
      comprobar(r.sw <= r.vw, `sin desbordamiento horizontal a ${w} px (${r.sw})`);
      if (w < 600) { const a = r.p.arco, k = a.w / w; comprobar(a.t >= r.p.abierto.b && k > 0.72 && k < 0.88, `portada ${w}: el texto primero y el arco debajo, al ${Math.round(k * 100)} % del ancho`); }
      await ctx.close();
    }
  });
  await bloque('4 · checklist 9 · clases de estado', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    const malos = [];
    for (const r of ['', 'contacto', 'tratamientos-faciales-zafra']) {
      await page.goto(BASE + r, { waitUntil: 'load' }); await page.waitForTimeout(400);
      malos.push(...await page.evaluate(() => [...document.querySelectorAll('[class]')].flatMap(e => [...e.classList]).filter(c => /^(hoy|activo|activa|encendido|visible|abierto|horario|oculto)$/.test(c))));
      if (r !== 'tratamientos-faciales-zafra') {
        const filas = await page.evaluate(() => ({ vis: [...document.querySelectorAll('#horario tr')].filter(t => t.offsetHeight > 0).length, hoy: document.querySelectorAll('#horario tr.es-hoy').length, dia: document.querySelector('#horario tr.es-hoy') && +document.querySelector('#horario tr.es-hoy').dataset.d, real: new Date().getDay(), vie: document.querySelectorAll('#horario tr[data-d="5"] td span').length }));
        comprobar(filas.vis === 7 && filas.hoy === 1 && filas.dia === filas.real && filas.vie === 2, `checklist 9 · horario ${r || 'inicio'}: 7 filas visibles, una es-hoy (el día de hoy) y el viernes partido en dos líneas`);
      }
    }
    comprobar(malos.length === 0, 'checklist 9 · ninguna clase de estado sin prefijo que pueda chocar con un bloque (es-activo, es-hoy, es-visible…)' + (malos.length ? ': ' + [...new Set(malos)].join(', ') : ''));
    await ctx.close();
  });
  await bloque('4 · checklist 10 · la barra del móvil no rehace nada', async () => {
    const { ctx, page } = await nuevaPagina({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { visita: true });
    await page.goto(BASE + 'centro-estetica-zafra', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    /* Playwright sí cambia los svh: se fijan antes (memoria) */
    await page.addStyleTag({ content: '.portada{min-height:844px!important} .portada--404{min-height:844px!important}' });
    await page.evaluate(() => scrollTo(0, 1400)); await page.waitForTimeout(500);
    const r0 = await page.evaluate(() => ({ n: window.Marina.refrescos, top: Math.round(document.querySelector('.tour').getBoundingClientRect().top) }));
    const tops = [];
    for (let i = 0; i < 6; i++) { await page.setViewportSize({ width: 390, height: i % 2 ? 844 : 788 }); await page.waitForTimeout(250); tops.push(await page.evaluate(() => Math.round(document.querySelector('.tour').getBoundingClientRect().top))); }
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
    const r1 = await page.evaluate(() => ({ n: window.Marina.refrescos, top: Math.round(document.querySelector('.tour').getBoundingClientRect().top) }));
    await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(600);
    const r2 = await page.evaluate(() => window.Marina.refrescos);
    comprobar(r1.n === r0.n && r1.top === r0.top && tops.every(t => t === r0.top), `checklist 10 · seis cambios de la barra: 0 refrescos de ScrollTrigger y 0 px de salto (tops ${[...new Set(tops)].join(',')}); al girar sí refresca (${r2 - r1.n})`);
    comprobar(r2 > r1.n, 'checklist 10 · al girar el móvil (cambia el ancho) sí se rehace');
    await ctx.close();
  });
  await bloque('checklist 11 · visor por nombre', async () => {
    const mal = [];
    for (const [ruta, movil] of [['indiba-zafra', false], ['centro-estetica-zafra', false], ['spa-relax-masajes-zafra', true]]) {
      const { ctx, page } = await nuevaPagina(movil ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {});
      await page.goto(BASE + ruta, { waitUntil: 'load' }); await page.waitForTimeout(600);
      const n = await page.locator('.arco__ampliar').count();
      for (let k = 0; k < n; k++) {
        const b = page.locator('.arco__ampliar').nth(k);
        await b.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
        const quiere = await b.getAttribute('data-ampliar');
        if (movil) await b.tap(); else await b.click();
        await page.waitForFunction(q => document.querySelector('dialog.visor img').src.endsWith(q), quiere, { timeout: 8000 }).catch(() => mal.push(ruta + ' #' + k));
        await page.keyboard.press('Escape'); await page.waitForTimeout(250);
      }
      await ctx.close();
    }
    comprobar(!mal.length, 'checklist 11 · visor por nombre: cada foto ampliable abre la suya (también con tap en móvil)' + (mal.length ? ' · ' + mal.join(', ') : ''));
  });

  /* ═══════════════ 5 · la carta ═══════════════ */
  await bloque('5 · la carta', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    let total = 0; const malas = [], textos = {};
    for (const p of carta.paginas) {
      await page.goto(BASE + p.url.slice(1), { waitUntil: 'load' });
      const lineas = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-linea]')].map(a => [a.dataset.linea, { precio: (a.querySelector('.precio') || {}).textContent, id: a.id, desc: (a.querySelector('.linea__desc, .ritual__cuerpo p') || {}).textContent || '' }])));
      textos[p.url] = await page.evaluate(() => document.querySelector('main').textContent);
      for (const g of p.grupos) for (const t of g.tratamientos) {
        const l = lineas[t.nombre];
        if (!l) { malas.push('falta ' + t.nombre); continue; }
        if (norma(l.precio) !== norma(t.precio)) malas.push(t.nombre + ': «' + l.precio + '» ≠ «' + t.precio + '»');
        total++;
      }
    }
    comprobar(total === 53 && malas.length === 0, 'carta: las 53 líneas de carta.json salen en su página con el precio literal' + (malas.length ? ' · ' + malas.slice(0, 4).join(' | ') : ` (${total})`));
    const todo = Object.values(textos).join(' ');
    comprobar(!/recibirlos siguientes|esta diseñado|Indiba Facial Express/.test(todo) && /recibir los siguientes pasos/.test(todo) && /está diseñado/.test(todo) && /El Indiba Facial Exprés/.test(todo), 'carta: las erratas corregidas no aparecen y sí sus correcciones');
    comprobar(/cutis radiante y saludable\./.test(textos['/tratamientos-faciales-zafra']), 'carta: la entradilla de higiene facial termina con punto');
    const corp = textos['/tratamientos-corporales-zafra'];
    comprobar(!/\(Bono/.test(corp) && (corp.match(/Bonos\s*Bono/g) || []).length >= 4, 'carta: los bonos entre paréntesis salen a una nota «Bonos» bajo su línea');
    await page.goto(BASE + 'depilacion-fotodepilacion-zafra', { waitUntil: 'load' });
    const z = await page.evaluate(() => [...document.querySelectorAll('table.zonas')].map(t => t.tBodies[0].rows.length));
    comprobar(z.join(',') === '5,4,10,9', 'depilación: cera, hilo, fotodepilación y bonos como tablas de zonas legibles (filas ' + z.join(', ') + ')');
    await page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' });
    const ind = await page.evaluate(() => ({ pro: !!document.querySelector('.proionic a[href="https://www.indiba.com/es/"]'), ben: document.querySelectorAll('.beneficios__lista li svg.icono').length, corp: !!document.querySelector('a.linea--enlace[href^="tratamientos-corporales-zafra"]'), indice: !!document.getElementById('indice') }));
    comprobar(ind.pro && ind.ben === 6 && ind.corp && !ind.indice, 'Indiba: bloque Proionic® con enlace a indiba.com, seis beneficios con icono de línea, «Indiba Corporal» enlazada a corporales y sin índice (un solo grupo)');
    await page.goto(BASE + 'spa-relax-masajes-zafra', { waitUntil: 'load' });
    const spa = await page.evaluate(() => ({ rit: document.querySelectorAll('.grupo--rituales .ritual .arco').length, lineas: document.querySelectorAll('.grupo:not(.grupo--rituales) .linea').length, idx: document.querySelectorAll('#indice a').length }));
    comprobar(spa.rit === 4 && spa.lineas === 9 && spa.idx === 5, 'spa: los rituales en tarjetas de arco y el resto como carta, con índice de 5 grupos');
    await page.goto(BASE + 'estetica-general-zafra', { waitUntil: 'load' });
    const bp = await page.evaluate(() => { const s = document.getElementById('beauty-party'); return s && { t: s.textContent.replace(/\s+/g, ' '), items: s.querySelectorAll('.beauty-party__incluye li').length, wa: s.querySelector('a[href^="https://wa.me/"]').href }; });
    comprobar(bp && /Una celebración diferente/.test(bp.t) && /62\s*€/.test(bp.t.replace(/\u2009/g, ' ')) && /de 4 a 10 personas/.test(bp.t) && bp.items === 4 && /text=Hola,%20me%20gustar%C3%ADa%20reservar%20una%20Beauty%20Party/.test(bp.wa), 'Estética general: Beauty Party (62 € por persona, de 4 a 10, lo que incluye en lista y «Reservar fiesta» por WhatsApp con el mensaje)');
    const conIndice = [];
    for (const a of AREAS) { await page.goto(BASE + a, { waitUntil: 'domcontentloaded' }); if (await page.evaluate(() => !!document.getElementById('indice'))) conIndice.push(a.split('-')[0]); }
    comprobar(conIndice.join(',') === 'tratamientos,spa,estetica', 'índice de grupos solo donde hay más de un grupo (faciales, spa, estética): ' + conIndice.join(', '));
    await ctx.close();
  });

  /* ═══════════════ 6 · recorrido, pestañas, índice, arcos, carril, polvo ═══════════════ */
  await bloque('6 · recorrido', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(800);
    await irA(page, '#recorrido', 0.05, 2500);
    const corre = await page.evaluate(() => { const v = document.getElementById('tour'); return { paused: v.paused, muted: v.muted, inline: v.playsInline, poster: !!v.poster }; });
    comprobar(!corre.paused && corre.muted && corre.inline && corre.poster, 'recorrido: el vídeo corre a la vista, muted y playsinline, con póster');
    await page.click('#estancias button[data-t="12"]');
    await page.waitForTimeout(600);
    const a = await page.evaluate(() => ({ t: document.getElementById('tour').currentTime, act: window.Marina.recorrido.activo, cls: document.querySelector('#estancias .es-activo') && document.querySelector('#estancias .es-activo').textContent }));
    comprobar(a.t >= 12 && a.t < 13.2 && a.act === 'Mesa de cortesía' && a.cls === 'Mesa de cortesía', `recorrido: pulsar «Mesa de cortesía» salta el vídeo al segundo 12 (${a.t.toFixed(2)} s) y la marca activa`);
    if (conCapturas) { await page.evaluate(() => document.getElementById('tour').pause()); await page.screenshot({ path: foto('recorrido-mesa-de-cortesia-1440.png') }); }
    await page.evaluate(() => { const v = document.getElementById('tour'); v.pause(); v.currentTime = 19; });
    await page.waitForTimeout(500);
    const b = await page.evaluate(() => window.Marina.recorrido.activo);
    await page.evaluate(() => { document.getElementById('tour').currentTime = 3.2; });
    await page.waitForTimeout(500);
    const c = await page.evaluate(() => window.Marina.recorrido.activo);
    comprobar(b === 'Corporales' && c === 'A tu centro', 'recorrido: la estancia activa sigue el tiempo del vídeo (19 s → Corporales, 3,2 s → A tu centro)');
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
    comprobar(await page.evaluate(() => document.getElementById('tour').paused), 'recorrido: fuera de pantalla el vídeo se para');
    await page.focus('#estancias button[data-t="20"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => window.Marina.recorrido.activo) === 'Bienestar', 'recorrido: las estancias se manejan con el teclado');
    await ctx.close();
  });
  await bloque('6 · pestañas de la carta', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(600);
    await irA(page, '#carta', 0.05);
    await page.click('#pest-indiba'); await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({ sel: [...document.querySelectorAll('#carta-pestanas [role=tab]')].filter(t => t.getAttribute('aria-selected') === 'true').map(t => t.id), vis: [...document.querySelectorAll('.panel')].filter(p => p.offsetHeight > 0).map(p => p.id), img: document.querySelector('.carta__img.es-activa').dataset.area, rol: document.getElementById('carta-pestanas').getAttribute('role'), tabidx: [...document.querySelectorAll('#carta-pestanas [role=tab]')].map(t => t.tabIndex).join('') }));
    comprobar(r.sel.join() === 'pest-indiba' && r.vis.join() === 'panel-indiba' && r.img === 'indiba' && r.rol === 'tablist' && r.tabidx === '-10-1-1-1-1', 'pestañas: role="tablist", aria-selected y tabindex itinerante; cambia el panel y la foto del arco');
    if (conCapturas) await page.screenshot({ path: foto('carta-indiba-pestana-1440.png') });
    await page.focus('#pest-indiba'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
    const k = await page.evaluate(() => ({ foco: document.activeElement.id, sel: document.querySelector('[role=tab][aria-selected=true]').id }));
    await page.keyboard.press('End'); const fin = await page.evaluate(() => document.activeElement.id);
    comprobar(k.foco === 'pest-corporales' && k.sel === 'pest-corporales' && fin === 'pest-estetica', 'pestañas: las flechas, Inicio y Fin mueven el foco y la selección');
    const ar = await page.evaluate(() => [...document.querySelectorAll('#tratamientos .ar')].map(a => a.getAttribute('href')));
    comprobar(ar.length === 6 && ar.every(h => /^[a-z-]+-zafra$/.test(h)), 'los seis arcos de «Tratamientos» enlazan a su página (no cambian la pestaña)');
    await ctx.close();
  });
  await bloque('6 · índice de grupos', async () => {
    for (const [ruta, w, h] of [['tratamientos-faciales-zafra', 1440, 900], ['spa-relax-masajes-zafra', 1440, 900], ['tratamientos-faciales-zafra', 390, 844]]) {
      const movil = w < 800;
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } }, { visita: true });
      await page.goto(BASE + ruta, { waitUntil: 'load' }); await page.waitForTimeout(700);
      const ids = await page.evaluate(() => [...document.querySelectorAll('#indice a')].map(a => a.hash.slice(1)));
      const vistos = [];
      for (const id of ids) { await irA(page, '#' + id, 0.12, 900); vistos.push(await page.evaluate(() => document.querySelector('#indice a.es-activo') && document.querySelector('#indice a.es-activo').hash.slice(1))); }
      comprobar(vistos.join() === ids.join(), `índice ${ruta} ${w}: es-activo marca cada grupo al cruzarlo (${vistos.length}/${ids.length})`);
      await irA(page, '#' + ids[0], 0.12, 600);
      await page.click(`#indice a[href="#${ids[ids.length - 1]}"]`); await page.waitForTimeout(2200);
      const salto = await page.evaluate(id => { const t = document.getElementById(id).getBoundingClientRect().top, c = document.getElementById('cabecera').offsetHeight; return { t: Math.round(t), c, pos: getComputedStyle(document.getElementById('indice')).position, act: document.querySelector('#indice a.es-activo').hash.slice(1) }; }, ids[ids.length - 1]);
      comprobar(salto.t >= salto.c - 2 && salto.t < salto.c + 200 && salto.act === ids[ids.length - 1], `índice ${ruta} ${w}: el clic salta al grupo (queda a ${salto.t} px, bajo la cabecera de ${salto.c})`);
      comprobar(salto.pos === 'sticky', `índice ${w}: ${movil ? 'barra fija bajo la cabecera, con desplazamiento horizontal' : 'sticky al lado'}`);
      if (conCapturas && movil) await page.screenshot({ path: foto('indice-movil-390.png') });
      await ctx.close();
    }
  });
  await bloque('6 · arcos: el filete se traza y la foto se revela', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(600);
    await page.evaluate(() => { window.__f = []; const p = document.querySelector('#tratamientos .arco .filete path'), i = document.querySelector('#tratamientos .arco img'); (function paso() { window.__f.push([+parseFloat(getComputedStyle(p).strokeDashoffset).toFixed(3), getComputedStyle(i).filter]); if (window.__f.length < 900) requestAnimationFrame(paso); })(); 0; });
    await irA(page, '#tratamientos .arcos', 0.4, 2600);
    const f = await page.evaluate(() => window.__f);
    const inter = new Set(f.map(x => x[0]).filter(v => v > 0.02 && v < 0.98));
    comprobar(f[0][0] === 1 && inter.size >= 6 && f[f.length - 1][0] === 0, `arcos: el filete dorado se traza al entrar (${inter.size} valores intermedios de dashoffset; de ${f[0][0]} a ${f[f.length - 1][0]} en ${f.length} fotogramas)`);
    comprobar(/blur/.test(f[0][1]) && f[f.length - 1][1] === 'none', 'arcos: la foto pasa de desenfocada a nítida');
    const clip = await page.evaluate(() => [...document.querySelectorAll('.arco, .arco *')].filter(e => getComputedStyle(e).clipPath !== 'none').length);
    const forma = await page.evaluate(() => { const a = document.querySelector('#tratamientos .arco__foto'); const cs = getComputedStyle(a); return cs.borderTopLeftRadius + ' ' + cs.overflow; });
    comprobar(clip === 0 && /999px.*(hidden|clip)/.test(forma), 'arcos de medio punto (border-radius) y ninguna foto con clip-path: nada se destapa desde abajo');
    await page.hover('#tratamientos .ar'); await page.waitForTimeout(1400);
    const zoom = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#tratamientos .arco img')).transform).a);
    comprobar(zoom > 1.03, 'arcos: al pasar el ratón la foto se acerca dentro del arco (escala ' + zoom.toFixed(3) + ')');
    await ctx.close();
  });
  await bloque('6 · carril de rituales', async () => {
    for (const [w, debe] of [[1440, false], [1024, true], [390, true]]) {
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: 900 } }, { visita: true });
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(700);
      const r = await page.evaluate(() => { const c = document.getElementById('carril'); return { tab: c.getAttribute('tabindex'), rol: c.getAttribute('role'), lab: !!c.getAttribute('aria-label'), snap: getComputedStyle(c).scrollSnapType, pad: getComputedStyle(c).scrollPaddingLeft }; });
      comprobar((r.tab === '0') === debe && r.rol === 'group' && r.lab && /x/.test(r.snap) && parseFloat(r.pad) > 0, `carril ${w}: ${debe ? 'desborda y es focusable' : 'no desborda y no mete parada de tabulación'} (scroll-snap ${r.snap}, scroll-padding ${r.pad})`);
      if (w === 1024) {
        await irA(page, '#carril', 0.2, 900);
        const b = await page.locator('#carril').boundingBox();
        const s0 = await page.evaluate(() => document.getElementById('carril').scrollLeft);
        await page.mouse.move(b.x + b.width * 0.7, b.y + 120); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.2, b.y + 120, { steps: 8 }); await page.mouse.up();
        await page.waitForTimeout(700);
        const s1 = await page.evaluate(() => document.getElementById('carril').scrollLeft);
        comprobar(s1 > s0 + 100, `carril: se arrastra con el ratón (scrollLeft ${s0} → ${Math.round(s1)})`);
      }
      if (w === 390) { const fuera = await page.evaluate(() => [...document.querySelectorAll('#carril .ritual')].map(r => r.getBoundingClientRect().right <= document.getElementById('carril').scrollWidth + 1)); comprobar(fuera.every(Boolean), 'carril 390: las cuatro tarjetas se alcanzan con el scroll del carril'); }
      await ctx.close();
    }
  });
  await bloque('6 · polvo dorado', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(1200);
    await page.evaluate(() => { window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask' }); 0; });
    const f0 = await page.evaluate(() => window.Marina.polvo.frames); await page.waitForTimeout(1500);
    const f1 = await page.evaluate(() => ({ f: window.Marina.polvo.frames, n: window.Marina.polvo.motas, lt: window.__lt }));
    comprobar(f1.f - f0 > 40 && f1.n >= 30 && f1.n <= 40, `polvo dorado: ${f1.n} motas que flotan en la luz de la vela (${f1.f - f0} fotogramas en 1,5 s)`);
    comprobar(f1.lt.length === 0, 'polvo dorado: sin tareas largas mientras flota (longtask: ' + (f1.lt.join(', ') || 'ninguna') + ')');
    await irA(page, '#carta', 0.1, 900);
    const g0 = await page.evaluate(() => window.Marina.polvo.frames); await page.waitForTimeout(800);
    const g1 = await page.evaluate(() => ({ f: window.Marina.polvo.frames, a: window.Marina.polvo.activo }));
    comprobar(g1.f === g0 && !g1.a, 'polvo dorado: se para fuera de pantalla');
    await ctx.close();
  });
  await bloque('6 · cifras', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.evaluate(() => { window.__c = []; const e = document.querySelector('[data-contar="300"]'); (function p() { window.__c.push(e.textContent); if (window.__c.length < 260) requestAnimationFrame(p); })(); 0; });
    await irA(page, '#cifras', 0.5, 2600);
    const c = await page.evaluate(() => window.__c);
    const inter = new Set(c.filter(x => x !== '+300' && x !== '+0'));
    comprobar(inter.size >= 5 && c[c.length - 1] === '+300', 'cifras: cuentan al entrar (' + inter.size + ' valores intermedios) y acaban en +300');
    await ctx.close();
  });

  /* ═══════════════ 7 · horario con reloj falso, enlaces, mapa, teclado ═══════════════ */
  await bloque('7 · «abierto ahora» con reloj falso', async () => {
    for (const [hora, esperado] of [['2026-10-16T13:59:00', /^Abierto ahora · hasta las 14:00$/], ['2026-10-16T14:01:00', /^Ahora cerrado · abre hoy a las 16:30$/], ['2026-10-17T15:00:00', /^Ahora cerrado · abre el martes a las 10:00$/], ['2026-10-19T09:00:00', /^Ahora cerrado · abre mañana a las 10:00$/]]) {
      const { ctx, page } = await nuevaPagina({}, { visita: true });
      await page.clock.setFixedTime(new Date(hora));
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({ t: document.querySelector('#abierto span').textContent, si: document.getElementById('abierto').classList.contains('es-abierto'), hoy: document.querySelector('#horario tr.es-hoy').dataset.d }));
      comprobar(esperado.test(r.t) && r.si === /Abierto/.test(r.t), `abierto ahora · ${hora.slice(0, 16).replace('T', ' ')} → «${r.t}» (fila de hoy ${r.hoy})`);
      await ctx.close();
    }
  });
  await bloque('7 · enlaces, mapa y teclado', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    const malos = []; let citas = 0;
    for (const r of RUTAS.concat(['404'])) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      const ls = await page.evaluate(() => [...document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"]')].map(a => ({ h: a.getAttribute('href'), n: a.closest('[data-linea]') && a.closest('[data-linea]').dataset.linea })));
      for (const l of ls) {
        if (l.h.startsWith('tel:') && l.h !== 'tel:+34644799000') malos.push(r + ' ' + l.h);
        if (/wa\.me/.test(l.h)) {
          if (!/^https:\/\/wa\.me\/34644799000(\?text=[^ ]+)?$/.test(l.h)) malos.push(r + ' ' + l.h);
          if (l.n) { citas++; const t = decodeURIComponent(l.h.split('text=')[1]); if (t !== 'Hola, me gustaría pedir cita para ' + l.n) malos.push(r + ' mensaje «' + t + '»'); }
        }
      }
    }
    comprobar(malos.length === 0 && citas >= 53, `enlaces: tel:+34644799000 y wa.me/34644799000 bien formados en todas; ${citas} «Pedir cita» con el nombre del tratamiento en el mensaje` + (malos.length ? ' · ' + malos.slice(0, 3).join(' | ') : ''));
    await page.goto(BASE + 'contacto', { waitUntil: 'load' }); await page.waitForTimeout(400);
    const antes = await page.evaluate(() => document.querySelectorAll('iframe').length);
    await page.focus('#mapa-boton'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const despues = await page.evaluate(() => { const f = document.querySelector('.mapa iframe'); return f && f.src; });
    comprobar(antes === 0 && despues === 'https://www.google.com/maps?q=Marina+Spa,+C.+Reyes+Huertas+8,+Zafra&output=embed', 'mapa: el <iframe> de Google no existe hasta pulsar (con el teclado también) y lleva la URL pedida');
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    const salto = await page.evaluate(() => document.activeElement.className);
    const marcas = await page.evaluate(() => ({ header: !!document.querySelector('header.cabecera'), nav: !!document.querySelector('nav[aria-label]'), main: !!document.querySelector('main#contenido'), footer: !!document.querySelector('footer') }));
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return cs.outlineStyle + ' ' + cs.outlineWidth; });
    comprobar(salto === 'saltar' && Object.values(marcas).every(Boolean) && /solid 2px/.test(foco), 'teclado: primero «Saltar al contenido», landmarks (header, nav, main, footer) y foco visible (' + foco + ')');
    await ctx.close();
  });
  await bloque('7 · contraste AA medido', async () => {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' }, { visita: true });
    let mal = [], peor = 99, n = 0;
    for (const r of RUTAS.concat(['no-existe'])) {
      await page.goto(BASE + r + '?revision', { waitUntil: 'load' });
      const c = await medirContraste(page);
      mal.push(...c.fallos.map(f => (r || 'inicio') + ' ' + f)); peor = Math.min(peor, c.peor); n += c.medidos;
    }
    comprobar(mal.length === 0, `contraste AA medido con script: ${n} textos en 13 páginas, el peor a ${peor}:1` + (mal.length ? ' · ' + mal.slice(0, 3).join(' | ') : ''));
    /* titulares con tilde: interlineado mínimo de 1,02 (memoria «condensada + tildes») */
    const apretados = [];
    for (const r of ['', 'centro-estetica-zafra', 'tratamientos-faciales-zafra', 'spa-relax-masajes-zafra', 'contacto']) {
      await page.goto(BASE + r, { waitUntil: 'load' });
      apretados.push(...await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, .portada__lema, .titulo-sec, .filosofia__frase, .cinta__pista li')].filter(e => /[áéíóúÁÉÍÓÚñ¿]/.test(e.textContent)).map(e => { const cs = getComputedStyle(e); return [e.textContent.trim().slice(0, 30), parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)]; }).filter(([, k]) => !(k >= 1.02)).map(([t, k]) => t + ' ' + k.toFixed(2))));
    }
    comprobar(apretados.length === 0, 'titulares con tilde: interlineado de al menos 1,02' + (apretados.length ? ' · ' + apretados.slice(0, 3).join(' | ') : ''));
    await ctx.close();
  });

  /* ═══════════════ 8 · borrado de módulos y del mando, en copias ═══════════════ */
  await bloque('8 · borrado de los módulos', async () => {
    for (const [mod, ruta, sel] of [['opinion', '', '#opinion'], ['cinta', '', '#cinta'], ['recorrido', '', '#recorrido'], ['beauty-party', 'estetica-general-zafra', '#beauty-party']]) {
      const tmp = tmpCopia('mod-' + mod);
      const salida = execFileSync(process.execPath, [path.join(tmp, 'scripts/quitar-' + mod + '.mjs'), tmp], { encoding: 'utf8' });
      const base = servirCopia(tmp);
      const { ctx, page } = await nuevaPagina({}, { visita: true });
      await page.goto(base + ruta, { waitUntil: 'load' });
      await hastaAbajo(page);
      const r = await page.evaluate(s => ({ esta: !!document.querySelector(s), secciones: [...document.querySelectorAll('main > section')].map(x => x.id || x.className.split(' ')[0]), mod: document.querySelectorAll('[data-modulo]').length }), sel);
      const restos = fs.readdirSync(path.join(tmp, 'css')).concat(fs.readdirSync(path.join(tmp, 'js'))).filter(f => f.startsWith(mod));
      /* construir.mjs no lo vuelve a poner */
      execFileSync(process.execPath, [path.join(tmp, 'scripts/construir.mjs')], { stdio: 'ignore' });
      const tras = fs.readFileSync(path.join(tmp, ruta ? ruta + '.html' : 'index.html'), 'utf8');
      comprobar(!r.esta && restos.length === 0 && page.errores.length === 0 && page.respuestas.length === 0 && !tras.includes(`data-modulo="${mod}"`) && r.secciones.length >= (ruta ? 4 : 8),
        `borrado del módulo «${mod}» en una copia: la receta lo quita, la web sigue sin errores ni 404 (${r.secciones.join(' › ')}) y construir.mjs no lo devuelve` + (page.errores.length ? ' · ' + page.errores[0] : '') + (page.respuestas.length ? ' · ' + page.respuestas[0] : ''));
      await ctx.close();
    }
  });
  await bloque('8 · borrado del mando', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marina-entrega-'));
    execFileSync(process.execPath, [path.join(raiz, 'scripts/quitar-mando.mjs'), tmp], { encoding: 'utf8' });
    const c = spawnSync(process.execPath, [path.join(raiz, 'scripts/comprobar-borrado.mjs'), tmp], { encoding: 'utf8' });
    const base = servirCopia(tmp);
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('ms-densidad', 'sobria'); } catch (e) {} });
    await page.goto(base + '?revision', { waitUntil: 'load' }); await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ mando: !!document.getElementById('mando'), buscador: !!document.getElementById('buscador'), cls: document.documentElement.className }));
    comprobar(c.status === 0 && !r.mando && !r.buscador && /densidad-boveda/.test(r.cls) && page.errores.length === 0 && page.respuestas.length === 0, 'quitar-mando.mjs + comprobar-borrado.mjs: la copia de entrega no tiene mando, ni buscador, ni lee la densidad, y funciona sin errores');
    await ctx.close();
  });

  /* ═══════════════ 9 · densidades ═══════════════ */
  await bloque('9 · las dos densidades', async () => {
    {
      const { ctx, page } = await nuevaPagina({}, { visita: true });
      await ctx.addInitScript(() => { try { localStorage.setItem('ms-densidad', 'sobria'); } catch (e) {} });
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(500);
      const r = await page.evaluate(() => ({ hid: document.getElementById('mando').hidden, d: getComputedStyle(document.getElementById('mando')).display, cls: document.documentElement.classList.contains('densidad-boveda') }));
      comprobar(r.hid && r.d === 'none' && r.cls, 'sin ?revision no hay mando, y una densidad guardada no se aplica');
      await ctx.close();
    }
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await ctx.addInitScript(() => { window.__clsDCL = null; document.addEventListener('DOMContentLoaded', () => { window.__clsDCL = document.documentElement.className; }); });
    await page.goto(BASE + '?revision', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    const boveda = await page.evaluate(() => ({ polvo: window.Marina.polvo.activo, filas: getComputedStyle(document.querySelector('.cinta__fila')).display, marcas: getComputedStyle(document.querySelector('.cinta__marcas')).display, bus: getComputedStyle(document.getElementById('buscador')).display, avisos: window.Marina.mando.avisos }));
    comprobar(boveda.polvo && boveda.filas === 'flex' && boveda.marcas === 'none' && boveda.bus === 'none', '«Bóveda»: polvo dorado, marquee doble y sin buscador');
    comprobar(['Logo redibujado desde 64 px', 'Fotos provisionales: 4', 'Titular y NIF', 'Precios sin fecha', '¿Láser o fotodepilación?', 'El peeling «Polinesia»', 'Tres cambios de texto (regla 3)', 'El vídeo lleva rótulos de Instagram'].every(a => boveda.avisos.includes(a)), 'el mando lista los avisos pendientes (' + boveda.avisos.length + '): logo, 4 fotos provisionales, NIF, precios, láser, «Polinesia», regla 3, vídeo');
    if (conCapturas) await page.screenshot({ path: foto('densidad-boveda-1440.png'), fullPage: true, type: 'jpeg', quality: 70 });
    await page.click('[data-densidad="sobria"]'); await page.waitForTimeout(900);
    const s = await page.evaluate(() => ({
      cls: document.documentElement.classList.contains('densidad-sobria'), pres: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed'), ls: localStorage.getItem('ms-densidad'),
      filete: [...document.querySelectorAll('.filete path')].every(p => getComputedStyle(p).strokeDasharray === 'none'), polvo: window.Marina.polvo.activo || getComputedStyle(document.getElementById('polvo')).display !== 'none',
      filas: getComputedStyle(document.querySelector('.cinta__fila')).display, marcas: getComputedStyle(document.querySelector('.cinta__marcas')).display, carril: getComputedStyle(document.getElementById('carril')).display, tab: document.getElementById('carril').getAttribute('tabindex'),
      bus: getComputedStyle(document.getElementById('buscador')).display, sw: document.documentElement.scrollWidth, vw: innerWidth
    }));
    comprobar(s.cls && s.pres === 'true' && s.ls === 'sobria', '«Sobria»: el mando cambia la clase del <html>, aria-pressed y lo recuerda');
    comprobar(await page.evaluate(() => [...document.querySelectorAll('#bovedas path')].every(p => parseFloat(getComputedStyle(p).strokeDashoffset) === 0)), '«Sobria»: las bóvedas del fondo ya están puestas, sin trazarse');
    comprobar(s.filete && !s.polvo && s.filas === 'none' && s.marcas === 'block' && s.carril === 'grid' && s.tab === null && s.bus === 'block' && s.sw <= s.vw, '«Sobria»: filetes ya puestos, sin polvo, la cinta cambiada por la línea quieta de marcas, rituales en rejilla 2×2 y buscador; sin desbordamiento');
    await page.fill('#buscador-campo', 'indiba'); await page.waitForTimeout(200);
    const b = await page.evaluate(() => ({ n: document.querySelectorAll('#buscador-resultados a').length, h: document.querySelector('#buscador-resultados a') && document.querySelector('#buscador-resultados a').getAttribute('href'), e: document.getElementById('buscador-estado').textContent }));
    await page.fill('#buscador-campo', 'maderoterapia'); await page.keyboard.press('Enter'); await page.waitForLoadState('load'); await page.waitForTimeout(600);
    const dest = await page.evaluate(() => location.pathname + location.hash);
    comprobar(b.n === 5 && /^indiba-zafra#t-/.test(b.h) && dest === '/tratamientos-corporales-zafra#t-maderoterapia', `buscador de la sobria: filtra las 53 líneas por nombre («indiba» → ${b.e}) y lleva a su página (${dest})`);
    await page.goto(BASE + 'centro-estetica-zafra?revision', { waitUntil: 'load' }); await page.waitForTimeout(600);
    const pila = await page.evaluate(() => ({ p: getComputedStyle(document.querySelector('.pila__item')).position, dcl: window.__clsDCL }));
    comprobar(pila.p === 'static' && /densidad-sobria/.test(pila.dcl), '«Sobria»: la pila de El centro desapilada; al recargar la densidad ya está en el <html> antes del primer pintado');
    if (conCapturas) { await page.goto(BASE + '?revision', { waitUntil: 'load' }); await hastaAbajo(page); await page.evaluate(() => window.Marina.lenis ? window.Marina.lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0)); await page.waitForTimeout(600); await page.screenshot({ path: foto('densidad-sobria-1440.png'), fullPage: true, type: 'jpeg', quality: 70 }); }
    await page.goto(BASE + '?revision', { waitUntil: 'load' }); await page.waitForTimeout(600);
    await page.click('[data-densidad="boveda"]'); await page.waitForTimeout(500);
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('densidad-boveda') && window.Marina.polvo.activo), 'se puede volver a «Bóveda» (vuelve el polvo)');
    await ctx.close();
    for (const d of ['boveda', 'sobria']) {
      const m = await nuevaPagina({ ...devices['iPhone 13'] }, { visita: true });
      await m.ctx.addInitScript(x => { try { localStorage.setItem('ms-densidad', x); } catch (e) {} }, d);
      await m.page.goto(BASE + '?revision', { waitUntil: 'load' }); await m.page.waitForTimeout(600);
      await bajarTactil(m.page);
      const sw = await m.page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      comprobar(sw[0] <= sw[1], `densidad ${d} en móvil: sin desbordamiento horizontal (${sw[0]})`);
      if (conCapturas) { await m.page.evaluate(() => scrollTo(0, 0)); await m.page.waitForTimeout(300); await m.page.screenshot({ path: foto(`densidad-${d}-390.png`), fullPage: true, type: 'jpeg', quality: 70 }); }
      await m.ctx.close();
    }
  });

  /* ═══════════════ 10 · textos prohibidos, consola de las 13 páginas ═══════════════ */
  await bloque('10 · textos y consola', async () => {
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    const prohibidos = [], mejor = [], laser = [], pend = [];
    for (const r of RUTAS.concat(['no-existe'])) {
      await page.goto(BASE + r, { waitUntil: 'load' }); await page.waitForTimeout(300);
      const t = await page.evaluate(() => {
        const visible = n => { const c = n.cloneNode(true); c.querySelectorAll('script, style, .sprite, #mando, template').forEach(x => x.remove()); return c.textContent; };
        const fueraCita = (() => { const c = document.body.cloneNode(true); c.querySelectorAll('script, style, #mando, .opinion__cita').forEach(x => x.remove()); return c.textContent; })();
        return { todo: document.documentElement.outerHTML, vis: visible(document.body), fueraCita };
      });
      if (/inolvidable|oasis|paraíso|Centro oficial|sin dolor garantizado/i.test(t.todo)) prohibidos.push(r + ': ' + t.todo.match(/inolvidable|oasis|paraíso|Centro oficial|sin dolor garantizado/i)[0]);
      if (/\b(\d+|una|un|dos|tres|cuatro|cinco)( sola| única)? (reseñas?|opini[oó]n(es)?|valoraci[oó]n(es)?)\b/i.test(t.vis) || /la (primera|segunda|única) (reseña|opinión)/i.test(t.vis) || /ratingCount|reviewCount/.test(t.todo)) prohibidos.push(r + ': recuento de reseñas');
      if (/el mejor/i.test(t.fueraCita)) mejor.push(r || 'inicio');
      if (/l[aá]ser/i.test(t.vis)) laser.push(r || 'inicio');
      if (/\[PENDIENTE\]/.test(t.vis) && !/aviso-legal|politica-privacidad/.test(r)) pend.push(r || 'inicio');
      if (/lorem ipsum|\bTODO\b/.test(t.vis)) pend.push(r + ' (relleno)');
    }
    comprobar(prohibidos.length === 0, 'textos prohibidos: ni «inolvidable», «oasis», «paraíso», «Centro oficial», «sin dolor garantizado» ni recuento de reseñas' + (prohibidos.length ? ' · ' + prohibidos.join(' | ') : ''));
    comprobar(mejor.length === 0, '«el mejor» solo aparece dentro de la cita de Ana M.' + (mejor.length ? ' · fuera en: ' + mejor.join(', ') : ''));
    comprobar(laser.length === 0, '«láser» no sale en ningún texto visible' + (laser.length ? ' · ' + laser.join(', ') : ''));
    comprobar(pend.length === 0, '[PENDIENTE] solo donde toca (titular y NIF en aviso legal y privacidad); sin relleno' + (pend.length ? ' · ' + pend.join(', ') : ''));
    await page.goto(BASE + 'aviso-legal', { waitUntil: 'load' });
    comprobar(await page.evaluate(() => document.querySelectorAll('.pendiente').length === 2 && /Última actualización: 10 de octubre de 2026/.test(document.body.textContent)), 'aviso legal: titular y NIF como [PENDIENTE] y la fecha actualizada');
    await page.goto(BASE + 'politica-cookies', { waitUntil: 'load' });
    comprobar(await page.evaluate(() => /no usa cookies de analítica/.test(document.body.textContent) && /no se carga hasta que usted pulsa/.test(document.body.textContent) && /ms-cookies/.test(document.body.textContent) && /localStorage/.test(document.body.textContent)), 'política de cookies ajustada a la web nueva: sin analítica, el mapa solo al pulsar y la preferencia en localStorage');
    await ctx.close();
    /* consola y 4xx en las 13 páginas, escritorio y móvil, bajando entera */
    for (const [opc, nom] of [[{}, 'escritorio'], [{ ...devices['iPhone 13'] }, 'móvil']]) {
      const errores = [];
      for (const r of RUTAS.concat(['no-existe'])) {
        const { ctx: c2, page: p2 } = await nuevaPagina(opc, { visita: r !== '' });
        await p2.goto(BASE + r, { waitUntil: 'load' }); await p2.waitForTimeout(600);
        if (nom === 'móvil') await bajarTactil(p2); else await hastaAbajo(p2, 900);
        const sw = await p2.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (sw > 0) errores.push(r + ' desborda ' + sw + ' px');
        /* en la 404 el único «Failed to load resource 404» es la propia navegación (memoria «falsos positivos»): se descarta solo si no hubo otro 4xx */
        const errs = r === 'no-existe' && p2.respuestas.length === 0 ? p2.errores.filter(e => !/status of 404/.test(e)) : p2.errores;
        errores.push(...errs.map(e => (r || 'inicio') + ': ' + e), ...p2.respuestas.map(e => (r || 'inicio') + ': ' + e));
        await c2.close();
      }
      comprobar(errores.length === 0, `consola limpia, sin 4xx y sin desbordamiento en las 13 páginas (${nom})` + (errores.length ? ' · ' + errores.slice(0, 4).join(' | ') : ''));
    }
  }, 420000);

  /* ═══════════════ capturas de cada página a seis tamaños ═══════════════ */
  await bloque('11 · desplegable y en cabina', async () => {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' }); await page.waitForTimeout(800);
    const cerrado = await page.evaluate(() => document.getElementById('panel-trat').hidden && !performance.getEntriesByType('resource').some(r => /depilacion-/.test(r.name)));
    await page.hover('#desplegable > a'); await page.waitForTimeout(600);
    const d = await page.evaluate(() => ({ abierto: !document.getElementById('panel-trat').hidden, enlaces: document.querySelectorAll('#panel-trat a').length, actual: document.querySelector('#panel-trat [aria-current="page"]')?.getAttribute('href'), aria: document.getElementById('desplegable-flecha').getAttribute('aria-expanded') }));
    await page.mouse.move(720, 330); await page.waitForTimeout(400);
    const puente = await page.evaluate(() => !document.getElementById('panel-trat').hidden);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    const esc = await page.evaluate(() => document.getElementById('panel-trat').hidden && document.activeElement.id === 'desplegable-flecha');
    comprobar(cerrado && d.abierto && d.enlaces === 6 && d.actual === 'indiba-zafra' && d.aria === 'true' && puente && esc, 'desplegable: cerrado y sin cargar fotos al entrar; con el ratón abre las 6 páginas (la actual marcada), sigue abierto al bajar y Esc lo cierra devolviendo el foco');
    await irA(page, '.cabina-sec', 0.1, 1500);
    const c = await page.evaluate(() => { const v = document.querySelector('video.bucle'); return { corre: !v.paused, mudo: v.muted, reels: document.querySelectorAll('.cabina-sec video[controls]').length }; });
    comprobar(c.corre && c.mudo && c.reels === 2, 'en cabina: el cinemagraph corre mudo a la vista y hay 2 vídeos con controles en Indiba');
    await ctx.close();
    const m = await nuevaPagina({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await m.page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' }); await m.page.waitForTimeout(500);
    comprobar(await m.page.evaluate(() => getComputedStyle(document.getElementById('desplegable-flecha')).display === 'none' && document.querySelectorAll('.navegacion__areas a').length === 6), 'desplegable: en móvil no hay flecha; las 6 páginas siguen en el menú');
    await m.ctx.close();
    /* el cursor no promete nada que no pase: cada etiqueta está en un enlace o tiene botón/vídeo con controles */
    const mentiras = [];
    for (const ruta of RUTAS) {
      const { ctx: c2, page: p2 } = await nuevaPagina();
      await p2.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
      mentiras.push(...(await p2.evaluate(() => [...document.querySelectorAll('[data-cursor]')].filter(el => !el.closest('a') && !el.querySelector('a, button, video[controls]')).map(el => el.dataset.cursor))).map(t => (ruta || 'inicio') + ':' + t));
      await c2.close();
    }
    comprobar(!mentiras.length, 'cursor: solo pone texto donde al pulsar pasa algo' + (mentiras.length ? ' · ' + mentiras.slice(0, 6).join(', ') : ''));
    const v = await nuevaPagina();
    await v.page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' }); await irA(v.page, '.cabina-sec', 0.1, 1000);
    await v.page.click('.cabina-sec .arco__ampliar >> nth=1'); await v.page.waitForTimeout(1100);
    const a1 = await v.page.evaluate(() => { const d = document.querySelector('dialog.visor'); const im = d.querySelector('img'); return { open: d.open, num: d.querySelector('.visor__num').textContent, carga: im.complete && im.naturalWidth >= 1000, alt: !!im.alt }; });
    await v.page.keyboard.press('ArrowRight'); await v.page.waitForTimeout(600);
    const n2 = await v.page.evaluate(() => document.querySelector('.visor__num').textContent);
    await v.page.keyboard.press('Escape'); await v.page.waitForTimeout(300);
    const fin = await v.page.evaluate(() => ({ open: document.querySelector('dialog.visor').open, foco: document.activeElement.classList.contains('arco__ampliar') }));
    comprobar(a1.open && a1.num === '2 / 3' && a1.carga && a1.alt && n2 === '3 / 3' && !fin.open && fin.foco, 'visor: abre la foto pulsada a 1080 px con su alt, → pasa a la siguiente, Esc cierra y devuelve el foco');
    await v.ctx.close();
    const r = await nuevaPagina({ reducedMotion: 'reduce' });
    await r.page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' }); await irA(r.page, '.cabina-sec', 0.1, 1200);
    comprobar(await r.page.evaluate(() => document.querySelector('video.bucle').paused), 'en cabina: con reduced-motion el cinemagraph no se mueve (póster)');
    await r.ctx.close();
  });
  if (conCapturas) await bloque('capturas', async () => {
    for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024], [1366, 768], [1440, 900]]) {
      const movil = w < 800;
      for (const r of RUTAS.concat(['no-existe'])) {
        const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h }, isMobile: movil, hasTouch: movil, deviceScaleFactor: 1 }, { visita: true });
        await page.goto(BASE + r, { waitUntil: 'load' }); await page.waitForTimeout(500);
        if (movil) await bajarTactil(page); else await hastaAbajo(page, 900);
        await page.evaluate(() => { const L = window.Marina && window.Marina.lenis; L ? L.scrollTo(0, { immediate: true }) : scrollTo(0, 0); 0; });
        await page.waitForTimeout(700);
        await page.screenshot({ path: foto(`${w}x${h}-${r || 'inicio'}.jpg`), fullPage: true, type: 'jpeg', quality: 62 });
        await ctx.close();
      }
    }
    const { ctx, page } = await nuevaPagina({}, { visita: true });
    await page.goto(BASE + 'indiba-zafra', { waitUntil: 'load' }); await page.waitForTimeout(500);
    await irA(page, '.carta-pagina', 0.05, 1600);
    await page.screenshot({ path: foto('carta-indiba-pagina-1440.png') });
    await ctx.close();
  }, 900000);
} finally {
  await navegador.close();
  servidores.forEach(s => s.close());
}

console.log('\n' + notas.concat(fallos).join('\n'));
console.log(`\n${notas.length} OK · ${fallos.length} fallos`);
process.exitCode = fallos.length ? 1 : 0;
