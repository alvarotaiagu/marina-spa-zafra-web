/* ═══════════════════════════════════════════════════════════════════════════
   Marina Spa · «Bóveda»
   Entrar bajo sus bóvedas: el loto de su logo se dibuja y se enciende en la
   cortina, el paño se levanta con el borde de las hojas del loto (un ala de
   gaviota) y el loto encendido vuela al arco de la portada, donde se queda como
   la luz. Las fotos viven en arcos de medio punto cuyo filete se traza; en la
   luz de la vela flota el polvo dorado de su trama «stardust».

   Banderas separadas a propósito (memoria «reduced-motion»):
     gsapReady → GSAP + ScrollTrigger cargados
     motion    → además, el usuario NO pidió reducir el movimiento
   Con movimiento reducido siguen el contenido (cifras, horario, pestaña activa,
   estancia activa, grupo activo); se apaga el viaje.

   Los módulos (cinta, recorrido, opinión, Beauty Party) viven en su propio JS y
   este archivo no depende de ninguno. Les deja window.Marina.
   Todo trazo con pathLength="1" que anima GSAP lleva autoRound:false.
   ═══════════════════════════════════════════════════════════════════════════ */
import { magnetizar } from './efectos/magnetico.js';
import { clamp } from './efectos/util.js';

const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
const gsap = window.gsap, ST = window.ScrollTrigger;
const gsapReady = !!(gsap && ST);
const motion = gsapReady && !reduce;
if (gsapReady) {
  gsap.registerPlugin(ST);
  /* el resize de la barra del móvil no rehace nada: ScrollTrigger solo se refresca cuando lo pedimos */
  ST.config({ ignoreMobileResize: true, autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
}
if (motion) html.classList.add('has-motion');
if (gsapReady) html.classList.add('gsap-listo');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const densidad = () => html.classList.contains('densidad-sobria') ? 'sobria' : 'boveda';
const avisar = (n, d) => document.dispatchEvent(new CustomEvent(n, { detail: d }));
const alturaCab = () => ($('#cabecera') || { offsetHeight: 76 }).offsetHeight;

const M = window.Marina = { motion, gsapReady, reduce, densidad, formaciones: 0, refrescos: 0, aterrizaje: null };
function refrescar() { if (ST) ST.refresh(); }
M.refrescar = refrescar;
if (ST) ST.addEventListener('refresh', () => { M.refrescos++; });

/* una sola vez al entrar en pantalla (ScrollTrigger once:true no dispara si ya está a la vista) */
function alVisible(nodos, fn, margen = '0px 0px -12% 0px') {
  nodos = [].concat(nodos).filter(Boolean);
  if (!('IntersectionObserver' in window)) { nodos.forEach(fn); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), { threshold: 0, rootMargin: margen });
  nodos.forEach(n => io.observe(n));
}
M.alVisible = alVisible;

/* resize: solo cuenta si cambia el ancho o el alto de verdad (no la barra del móvil) */
let anchoVista = innerWidth, altoVista = innerHeight;
const alCambiarVista = [];
addEventListener('resize', () => {
  if (innerWidth === anchoVista && Math.abs(innerHeight - altoVista) < 160) return;
  anchoVista = innerWidth; altoVista = innerHeight;
  alCambiarVista.forEach(f => f());
  refrescar();
});
M.alCambiarVista = f => alCambiarVista.push(f);

/* ───────── Lenis (jsDelivr; en cdnjs da 404) ───────── */
let lenis = null;
if (motion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
  lenis.on('scroll', ST.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
}
M.lenis = lenis;
function irA(destino, extra = 0) {
  const el = typeof destino === 'string' ? $(destino) : destino;
  if (!el) return;
  const desfase = -alturaCab() - 12 - extra;
  if (lenis) lenis.scrollTo(el, { offset: desfase, duration: 1.3 });
  else scrollTo({ top: el.getBoundingClientRect().top + scrollY + desfase, behavior: reduce ? 'auto' : 'smooth' });
}
M.irA = irA;
/* anclas de la misma página (también «./#tratamientos» desde la portada) */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href*="#"]');
  if (!a || a.closest('#indice')) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
  const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!el) return;
  e.preventDefault();
  cerrarMenu();
  irA(el);
  history.replaceState(null, '', url.hash);
});

/* ───────── la cortina avisa cuando se abre ───────── */
let abierta = false;
function abrir() { if (abierta) return; abierta = true; avisar('cortina-abre'); }
const alAbrirse = fn => { if (abierta) fn(); else document.addEventListener('cortina-abre', fn, { once: true }); };
M.alAbrirse = alAbrirse;

/* ───────── titulares partidos (char-reveal) ───────── */
function partir(el) {
  const letras = el.dataset.revelar === 'letras';
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const piezas = [];
  let ultima = null;
  const trocear = (cad, destino, tras) => {
    cad.split(/(\s+)/).forEach((t, k) => {
      if (!t) return;
      if (/^\s+$/.test(t)) { destino.appendChild(document.createTextNode(' ')); ultima = null; return; }
      /* puntuación pegada a un énfasis («renovarte</em>?»): va dentro de la última palabra */
      if (k === 0 && tras && ultima) { const p = document.createElement('span'); p.className = 'punto'; p.textContent = t; ultima.appendChild(p); return; }
      const caja = document.createElement('span'); caja.className = 'palabra';
      if (letras) [...t].forEach(c => { const s = document.createElement('span'); s.className = 'letra'; s.textContent = c; caja.appendChild(s); piezas.push(s); });
      else { const s = document.createElement('span'); s.className = 'palabra-int'; s.textContent = t; caja.appendChild(s); piezas.push(s); }
      destino.appendChild(caja); ultima = caja;
    });
  };
  const recorrer = (origen, destino) => {
    let previoEl = false;
    [...origen.childNodes].forEach(n => {
      if (n.nodeType === 3) { trocear(n.textContent, destino, previoEl); previoEl = false; return; }
      if (n.nodeType === 1) { const c = n.cloneNode(false); destino.appendChild(c); recorrer(n, c); previoEl = true; }
    });
  };
  const molde = el.cloneNode(true);
  el.textContent = '';
  recorrer(molde, el);
  $$('*', el).forEach(n => n.setAttribute('aria-hidden', 'true'));
  el.classList.add('es-partido');
  return piezas;
}
function revelar(el, piezas, retardo = 0) {
  gsap.to(piezas, { yPercent: 0, duration: 1.1, ease: 'expo.out', delay: retardo, stagger: el.dataset.revelar === 'letras' ? Math.min(0.028, 1 / piezas.length) : 0.06 });
}
if (motion) {
  $$('[data-revelar]').forEach(el => {
    const piezas = partir(el);
    /* GSAP lee el translate del CSS como «y» en px: el reposo se fija aquí, con y:0 (memoria) */
    gsap.set(piezas, { y: 0, yPercent: 112 });
    if (el.closest('.portada')) alAbrirse(() => revelar(el, piezas, 0.45));
    else alVisible(el, () => revelar(el, piezas));
  });
}

/* ═══════════════ cortina: el loto se enciende ═══════════════ */
const ORDEN = [['capullo'], ['centro'], ['lat2i', 'lat2d'], ['lat1i', 'lat1d'], ['lat0i', 'lat0d'], ['hoja-i', 'hoja-d'], ['abajo']];
(function cortina() {
  const c = $('#cortina');
  const tapa = c && getComputedStyle(c).display !== 'none';
  if (!tapa) { if (c) c.classList.add('oculta'); abrir(); return; }
  let hecho = false;
  function retirar() {
    if (hecho) return;
    hecho = true;
    abrir();
    c.classList.add('oculta');
    html.classList.add('cortina-fuera');
    if (gsapReady) gsap.ticker.lagSmoothing(0);      /* con Lenis, al retirarla; nunca antes */
    refrescar();
    avisar('cortina-retirada');
  }
  M.retirarCortina = retirar;
  if (!motion) { retirar(); return; }                  /* sin GSAP o con movimiento reducido: fuera ya */
  setTimeout(retirar, 9000);                           /* red de seguridad */
  gsap.ticker.lagSmoothing(100, 1000 / 30);            /* reloj que se traga los atascos: dt > 0,1 s cuenta 1/30 */

  const real = $('#portada-loto'), caja = $('#cortina-loto'), pano = $('#cortina-pano');
  const halo = $('#cortina-halo'), nombre = $('#cortina-nombre'), ala = $('#cortina-ala');
  /* el clon del loto de la portada, con los ids de las máscaras renombrados */
  const clon = real.cloneNode(true);
  clon.removeAttribute('id');
  const mapa = {};
  $$('[id]', clon).forEach(n => { mapa[n.id] = n.id + '-c'; n.id = mapa[n.id]; });
  $$('[mask]', clon).forEach(n => { const id = n.getAttribute('mask').slice(5, -1); if (mapa[id]) n.setAttribute('mask', 'url(#' + mapa[id] + ')'); });
  clon.classList.remove('loto--encendido');
  clon.style.stroke = '#F0C868';
  caja.appendChild(clon);
  const grupos = ORDEN.map(g => g.map(n => clon.querySelector('[data-petalo="' + n + '"]')));
  const largos = grupos.map(g => Math.max(...g.map(p => p.getTotalLength())));
  const suma = largos.reduce((a, b) => a + b, 0);
  gsap.set(clon.querySelectorAll('path[data-petalo]'), { strokeDashoffset: 1, opacity: 0 });

  const tl = gsap.timeline({ paused: true, onComplete: retirar });
  M.cortina = { get tl() { return tl; } };
  /* 1 · el loto se dibuja pétalo a pétalo: duración proporcional al largo, con solape */
  let t = 0.2;
  grupos.forEach((g, i) => {
    const d = Math.max(0.2, 1.9 * largos[i] / suma);
    tl.set(g, { opacity: 1 }, t).to(g, { strokeDashoffset: 0, duration: d, ease: 'power1.inOut', autoRound: false }, t);
    t += d * 0.74;
  });
  tl.addLabel('dibujado', t + 0.1);
  /* 2 · «MARINA SPA» aparece espaciándose */
  tl.fromTo(nombre, { opacity: 0, letterSpacing: '1em', textIndent: '1em' }, { opacity: 1, letterSpacing: '.62em', textIndent: '.62em', duration: 0.9, ease: 'power2.out', immediateRender: false }, 'dibujado-=0.25');
  /* 3 · el loto se enciende: halo cálido (degradado cacheado, sin filter) y trazo más claro */
  tl.addLabel('enciende', 'dibujado+=0.25')
    .fromTo(halo, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', immediateRender: false }, 'enciende')
    .to(clon, { stroke: '#F8DE9C', duration: 0.6, ease: 'power1.inOut' }, 'enciende+=0.05');
  /* 4 · el paño se levanta con el borde en ala de gaviota (las hojas del loto) */
  tl.addLabel('sube', 'enciende+=0.8');
  tl.call(abrir, null, 'sube');
  tl.to(pano, { y: () => -(innerHeight + ala.getBoundingClientRect().height + 8), duration: 1.1, ease: 'expo.inOut' }, 'sube')
    .fromTo(ala, { scaleY: 1 }, { scaleY: 0.45, transformOrigin: '50% 0%', duration: 1.1, ease: 'expo.inOut', immediateRender: false }, 'sube')
    .to([nombre, halo], { y: -70, duration: 1.1, ease: 'expo.inOut' }, 'sube');
  /* 5 · traspaso: el loto encendido vuela al arco de la portada (destino medido en cada fotograma) */
  const vuelo = { p: 0 };
  let origen = null;
  tl.call(() => { origen = caja.getBoundingClientRect(); }, null, 'sube')
    .to(vuelo, {
      p: 1, duration: 1.1, ease: 'expo.inOut',
      onUpdate() {
        if (!origen) return;
        const d = real.getBoundingClientRect(), k = vuelo.p;
        const esc = 1 + (d.width / origen.width - 1) * k;
        caja.style.transformOrigin = '0 0';
        caja.style.transform = `translate(${((d.left - origen.left) * k).toFixed(2)}px,${((d.top - origen.top) * k).toFixed(2)}px) scale(${esc.toFixed(4)})`;
      }
    }, 'sube');
  tl.call(() => {
    const a = clon.querySelector('[data-petalo="capullo"]').getBoundingClientRect();
    const b = real.querySelector('[data-petalo="capullo"]').getBoundingClientRect();
    const ca = clon.querySelector('[data-petalo="abajo"]').getBoundingClientRect();
    const cb = real.querySelector('[data-petalo="abajo"]').getBoundingClientRect();
    M.aterrizaje = { dx: +Math.abs(a.left - b.left).toFixed(2), dy: +Math.abs(a.top - b.top).toFixed(2), dw: +Math.abs(a.width - b.width).toFixed(2), dyAbajo: +Math.abs(ca.bottom - cb.bottom).toFixed(2) };
    html.classList.add('cortina-fuera');
  });
  M.formaciones++;
  try { sessionStorage.setItem('ms-loto', '1'); } catch (e) {}   /* el logo ya se formó en esta visita */
  window.__cortinaTl = tl;                             /* enganche para verificar.mjs, ya con sus etiquetas */
  /* la cortina no toca el scroll (memoria «Lenis»): al primer gesto se salta a la subida */
  const prisa = () => {
    ['wheel', 'touchstart', 'keydown'].forEach(ev => removeEventListener(ev, prisa));
    if (tl.time() < tl.labels.sube) tl.seek('sube', false);
    tl.timeScale(1.5);
  };
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, prisa, { passive: true }));
  requestAnimationFrame(() => tl.play());
})();

/* ═══════════════ sin cortina: el loto de la portada florece ═══════════════
   Solo la primera vez que se llega a la portada en una visita sin cortina (la clase
   «florece» la pone el script del <head>). No se traza: el capullo asoma, el pétalo
   central crece desde su base, los laterales se abren desde el centro por parejas, las
   hojas se extienden y el de abajo cae; al final se enciende, como en la cortina.
   Las máscaras de oclusión se quedan: los pétalos salen de detrás del central. */
const ABRIR = { lat2i: 26, lat2d: -26, lat1i: 42, lat1d: -42, lat0i: 58, lat0d: -58 };
(function florecer() {
  if (!html.classList.contains('florece')) return;
  const loto = $('#portada-loto'), halo = $('#ventana-halo');
  if (!loto || !motion) { html.classList.remove('florece'); return; }
  const p = n => loto.querySelector('[data-petalo="' + n + '"]');
  const base = n => p(n).getAttribute('d').match(/M([\d.]+) ([\d.]+)/).slice(1).join(' ');
  gsap.set(loto, { stroke: '#F0C868' });
  gsap.set(halo, { opacity: 0 });
  gsap.set(p('capullo'), { scale: 0.3, opacity: 0, svgOrigin: '318 172' });
  gsap.set(p('centro'), { scaleY: 0.25, opacity: 0, svgOrigin: '318 386' });
  Object.entries(ABRIR).forEach(([n, a]) => gsap.set(p(n), { rotation: a, opacity: 0, svgOrigin: base(n) }));
  gsap.set([p('hoja-i'), p('hoja-d')], { scaleX: 0, opacity: 0, svgOrigin: '318 418' });
  gsap.set(p('abajo'), { scaleY: 0, opacity: 0, svgOrigin: '318 426' });
  html.classList.remove('florece');
  const abre = (ns, t) => tl.to(ns.map(p), { rotation: 0, opacity: 1, duration: 1.15, ease: 'expo.out' }, t);
  const tl = gsap.timeline({ paused: true, onComplete: () => { M.floracion.terminada = true; } });
  tl.to(p('capullo'), { scale: 1, opacity: 1, duration: 0.75, ease: 'back.out(1.7)' }, 0.45)
    .to(p('centro'), { scaleY: 1, opacity: 1, duration: 0.85, ease: 'expo.out' }, 0.7);
  abre(['lat2i', 'lat2d'], 0.95); abre(['lat1i', 'lat1d'], 1.1); abre(['lat0i', 'lat0d'], 1.25);
  tl.to([p('hoja-i'), p('hoja-d')], { scaleX: 1, opacity: 1, duration: 0.95, ease: 'expo.out' }, 1.45)
    .to(p('abajo'), { scaleY: 1, opacity: 1, duration: 0.75, ease: 'expo.out' }, 1.65)
    .addLabel('enciende', 2.1)
    .to(loto, { stroke: '#F8DE9C', duration: 0.7, ease: 'power1.inOut' }, 'enciende')
    .to(halo, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 'enciende-=0.1');
  M.floracion = { terminada: false, get tl() { return tl; } };
  M.formaciones++;
  try { sessionStorage.setItem('ms-loto', '1'); } catch (e) {}
  window.__floreceTl = tl;                             /* enganche para verificar.mjs */
  requestAnimationFrame(() => tl.play());
})();

/* las bóvedas de cañón del fondo se trazan desde la clave hacia abajo, anillo a anillo */
alAbrirse(() => {
  const anillos = $$('#bovedas .bovedas__anillo');
  if (!anillos.length) return;
  if (!motion) { $$('#bovedas path').forEach(x => { x.style.strokeDashoffset = '0'; }); return; }
  anillos.forEach((g, i) => gsap.to(g.querySelectorAll('path'), { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.15 + i * 0.16, autoRound: false }));
});

/* la portada entra cuando la cortina empieza a subir */
alAbrirse(() => {
  $$('.portada .arco').forEach(a => a.classList.add('es-visible'));
  const piezas = $$('#portada .portada__entrada, #portada .acciones, #portada .abierto-ahora'), pie = $$('.ventana__pie');
  if (!motion || !piezas.length) return;
  gsap.from(piezas, { y: 18, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', delay: 0.75, clearProps: 'transform,opacity' });
  gsap.from(pie, { opacity: 0, duration: 1, delay: 1.1, clearProps: 'opacity' });
});

/* ───────── arcos: el filete se traza y la foto se revela al entrar ───────── */
alVisible($$('.arco').filter(a => !a.closest('.portada:not(.portada--404)')), a => a.classList.add('es-visible'));
alVisible($$('.beneficios__lista li'), li => li.classList.add('es-visible'));

/* ───────── cifras que cuentan al entrar ───────── */
alVisible($$('[data-contar]'), el => {
  if (!motion) return;                                 /* sin movimiento: ya está escrito el valor final */
  const fin = +el.dataset.contar, o = { v: 0 };
  gsap.to(o, { v: fin, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = '+' + Math.round(o.v); } });
});

/* ───────── filosofía: las palabras se encienden con el scroll ───────── */
(function filosofia() {
  const frase = $('#filosofia-frase');
  if (!frase || !motion) return;
  const pals = [];
  const rec = nodo => [...nodo.childNodes].forEach(n => {
    if (n.nodeType === 1) { rec(n); return; }
    const f = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach(t => {
      if (!t) return;
      if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
      const s = document.createElement('span'); s.className = 'fw'; s.textContent = t; f.appendChild(s); pals.push(s);
    });
    n.replaceWith(f);
  });
  rec(frase);
  ST.create({
    trigger: frase, start: 'top 82%', end: 'bottom 45%',
    onUpdate: self => { const n = Math.round(self.progress * pals.length); pals.forEach((p, i) => p.classList.toggle('es-on', i < n)); },
    onLeave: () => pals.forEach(p => p.classList.add('es-on'))
  });
})();

/* ═══════════════ polvo dorado en la luz de la vela ═══════════════ */
(function polvo() {
  const cv = $('#polvo');
  if (!cv || reduce) return;
  const ctx = cv.getContext('2d');
  /* sprite cacheado: el brillo se pinta UNA vez; por fotograma solo drawImage (memoria «canvas blur») */
  const spr = document.createElement('canvas'); spr.width = spr.height = 48;
  const sc = spr.getContext('2d'), g = sc.createRadialGradient(24, 24, 0, 24, 24, 24);
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.25, 'rgba(248,222,156,.75)'); g.addColorStop(0.6, 'rgba(240,200,104,.18)'); g.addColorStop(1, 'rgba(240,200,104,0)');
  sc.fillStyle = g; sc.fillRect(0, 0, 48, 48);
  let W = 0, H = 0, dpr = 1;
  const medir = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
  new ResizeObserver(medir).observe(cv);
  medir();
  /* el haz de la vela: elipse inclinada hacia arriba a la izquierda, desde la llama (derecha del arco) */
  const N = 36, motas = [];
  const nueva = (y0) => {
    const u = Math.random(), a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
    return { x: 0.62 + Math.cos(a) * r * 0.26 - u * 0.05, y: y0 ?? (0.42 + Math.sin(a) * r * 0.36), s: 2 + Math.random() * 5.5, v: 0.006 + Math.random() * 0.012, f: Math.random() * 6.28, w: 0.4 + Math.random() * 0.8, b: 0.25 + Math.random() * 0.6 };
  };
  for (let i = 0; i < N; i++) motas.push(nueva());
  let vivo = false, visible = false, raf = 0, ultimo = 0;
  M.polvo = { frames: 0, motas: N, get activo() { return vivo; } };
  /* la llama de la vela late (y el halo del loto respira con ella) en el mismo fotograma */
  const llama = $('#llama'), haloV = $('#ventana-halo');
  let reloj = 0;
  function paso(ahora) {
    raf = requestAnimationFrame(paso);
    const dt = Math.min(0.05, (ahora - (ultimo || ahora)) / 1000); ultimo = ahora;
    M.polvo.frames++;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motas) {
      m.f += dt * m.w;
      m.y -= m.v * dt;
      m.x += Math.sin(m.f) * 0.004 * dt - 0.002 * dt;
      if (m.y < 0.02) Object.assign(m, nueva(0.82));
      /* más luz cerca del centro del haz */
      const cerca = 1 - clamp(Math.hypot((m.x - 0.62) / 0.3, (m.y - 0.42) / 0.42));
      ctx.globalAlpha = clamp(m.b * (0.35 + 0.65 * cerca) * (0.75 + 0.25 * Math.sin(m.f * 2.3)));
      const s = m.s;
      ctx.drawImage(spr, m.x * W - s, m.y * H - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    reloj += dt;
    if (llama) {
      /* suma de senos desfasados: un parpadeo de llama que nunca se repite igual */
      const f = 1 + 0.3 * Math.sin(reloj * 7.3) + 0.16 * Math.sin(reloj * 13.7 + 1.3) + 0.12 * Math.sin(reloj * 2.3 + 0.4);
      llama.style.opacity = clamp(f, 0.45, 1).toFixed(3);
      if (haloV) haloV.style.scale = (1 + 0.022 * Math.sin(reloj * 1.6) + 0.008 * Math.sin(reloj * 5.1)).toFixed(4);
    }
  }
  function decidir() {
    const debe = visible && densidad() === 'boveda' && document.visibilityState === 'visible';
    if (debe && !vivo) { vivo = true; ultimo = 0; raf = requestAnimationFrame(paso); }
    else if (!debe && vivo) { vivo = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, cv.width, cv.height); if (llama) llama.style.opacity = ''; if (haloV) haloV.style.scale = ''; }
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; decidir(); }).observe(cv);
  document.addEventListener('visibilitychange', decidir);
  document.addEventListener('densidad-cambiada', decidir);
})();

/* ───────── la carta de la portada: pestañas accesibles ───────── */
(function pestanas() {
  const lista = $('#carta-pestanas');
  if (!lista) return;
  const tabs = $$('[role="tab"]', lista);
  M.carta = { activa: tabs[0].dataset.area };
  function activar(tab, foco) {
    tabs.forEach(t => {
      const si = t === tab;
      t.setAttribute('aria-selected', si);
      t.tabIndex = si ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (si) { panel.removeAttribute('data-oculto'); panel.classList.remove('es-entrando'); void panel.offsetWidth; panel.classList.add('es-entrando'); }
      else panel.setAttribute('data-oculto', '');
    });
    $$('.carta__img').forEach(i => i.classList.toggle('es-activa', i.dataset.area === tab.dataset.area));
    M.carta.activa = tab.dataset.area;
    if (foco) tab.focus();
    refrescar();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activar(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k == null) return;
      e.preventDefault();
      activar(tabs[(k + tabs.length) % tabs.length], true);
    });
  });
})();

/* ───────── carril de rituales: arrastre con ratón; focusable solo si desborda ───────── */
(function carril() {
  const c = $('#carril');
  if (!c) return;
  const revisar = () => {
    const desborda = c.scrollWidth > c.clientWidth + 2;
    if (desborda) c.setAttribute('tabindex', '0'); else c.removeAttribute('tabindex');
    M.carril = { desborda };
  };
  revisar();
  M.alCambiarVista(revisar);
  document.addEventListener('densidad-cambiada', () => setTimeout(revisar, 60));
  if (document.fonts) document.fonts.ready.then(revisar);
  let x0 = 0, s0 = 0, arrastra = false, movido = false;
  c.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || densidad() === 'sobria') return;
    arrastra = true; movido = false; x0 = e.clientX; s0 = c.scrollLeft;
  });
  addEventListener('pointermove', e => {
    if (!arrastra) return;
    const dx = e.clientX - x0;
    if (!movido && Math.abs(dx) > 5) { movido = true; c.classList.add('es-arrastrando'); }
    if (movido) c.scrollLeft = s0 - dx;
  });
  addEventListener('pointerup', () => {
    if (!arrastra) return;
    arrastra = false;
    if (movido) {
      /* suelta y deja que el scroll-snap encaje la tarjeta más cercana */
      setTimeout(() => c.classList.remove('es-arrastrando'), 20);
    }
  });
  c.addEventListener('click', e => { if (movido) { e.preventDefault(); movido = false; } }, true);
  /* sin esto el navegador empieza a arrastrar la foto o el enlace y corta los pointermove */
  c.addEventListener('dragstart', e => e.preventDefault());
})();

/* ───────── índice de grupos (páginas de tratamientos) ───────── */
(function indice() {
  const nav = $('#indice');
  if (!nav) return;
  const enlaces = $$('a', nav);
  const grupos = enlaces.map(a => document.getElementById(a.hash.slice(1)));
  const ol = $('ol', nav);
  M.indice = { activo: null };
  /* en móvil el índice es una barra fija bajo la cabecera: el salto y la línea de lectura la descuentan */
  const barra = () => innerWidth < 1000 ? nav.offsetHeight : 0;
  function marcar() {
    const linea = alturaCab() + barra() + Math.min(160, innerHeight * 0.3);
    let i = 0;
    grupos.forEach((g, k) => { if (g.getBoundingClientRect().top <= linea) i = k; });
    if (M.indice.activo === grupos[i].id) return;
    M.indice.activo = grupos[i].id;
    enlaces.forEach((a, k) => { a.classList.toggle('es-activo', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    /* en móvil la barra se desplaza sola hasta el activo (sin mover la página) */
    if (ol.scrollWidth > ol.clientWidth) { const a = enlaces[i]; ol.scrollTo({ left: a.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' }); }
  }
  addEventListener('scroll', marcar, { passive: true });
  marcar();
  enlaces.forEach((a, k) => a.addEventListener('click', e => {
    e.preventDefault();
    irA(grupos[k], barra());
    history.replaceState(null, '', a.hash);
  }));
})();

/* ───────── la pila sticky de El centro (checklist §2) ───────── */
(function pila() {
  const ol = $('#pila');
  if (!ol) return;
  const items = $$('.pila__item', ol), cartas = items.map(li => $('.tarjeta', li));
  let escalas = [];
  /* todas igual de altas: la de la más alta, medida con min-height suelto */
  function medir() {
    cartas.forEach(c => { c.style.minHeight = '0px'; });
    const alto = Math.max(...cartas.map(c => c.offsetHeight));
    cartas.forEach(c => { c.style.minHeight = ''; });
    ol.style.setProperty('--alto-tarjeta', alto + 'px');
    M.pila = { alto, apilada: getComputedStyle(items[0]).position === 'sticky' };
  }
  function escalar() {
    escalas.forEach(s => { s.scrollTrigger && s.scrollTrigger.kill(); s.kill(); });
    escalas = [];
    gsap.set(cartas, { clearProps: 'transform' });
    if (!motion || getComputedStyle(items[0]).position !== 'sticky') return;
    const tope = parseFloat(getComputedStyle(items[0]).top);
    /* la de debajo encoge mientras sube la siguiente: trigger = la siguiente, end exacto en su top */
    for (let i = 0; i < items.length - 1; i++) {
      escalas.push(gsap.fromTo(cartas[i], { scale: 1 }, { scale: 0.94, ease: 'none', immediateRender: false, scrollTrigger: { trigger: items[i + 1], start: 'top bottom', end: 'top ' + tope + 'px', scrub: true } }));
    }
  }
  const rehacer = () => { medir(); if (gsapReady) escalar(); };
  rehacer();
  if (document.fonts) document.fonts.ready.then(() => { rehacer(); refrescar(); });
  M.alCambiarVista(rehacer);
  document.addEventListener('densidad-cambiada', () => setTimeout(() => { rehacer(); refrescar(); }, 50));
})();

/* ───────── horario: «abierto ahora» y la fila de hoy (contenido: también sin movimiento) ───────── */
(function horario() {
  const datos = $('#horario-datos');
  if (!datos) return;
  const H = JSON.parse(datos.textContent);
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const hora = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  function estado(ahora = new Date()) {
    const d = ahora.getDay(), m = ahora.getHours() * 60 + ahora.getMinutes();
    const franja = (H[d] || []).find(([a, b]) => m >= a && m < b);
    if (franja) return { abierto: true, texto: 'Abierto ahora · hasta las ' + hora(franja[1]) };
    for (let k = 0; k < 8; k++) {
      const dd = (d + k) % 7;
      const sig = (H[dd] || []).find(([a]) => k > 0 || a > m);
      if (sig) return { abierto: false, texto: 'Ahora cerrado · abre ' + (k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + DIAS[dd]) + ' a las ' + hora(sig[0]) };
    }
    return { abierto: false, texto: 'Ahora cerrado' };
  }
  M.horario = { estado };
  function pintar() {
    const ahora = new Date(), e = estado(ahora);
    $$('[data-abierto]').forEach(el => { el.classList.toggle('es-abierto', e.abierto); $('span', el).textContent = e.texto; });
    $$('#horario tr').forEach(tr => tr.classList.toggle('es-hoy', +tr.dataset.d === ahora.getDay()));
  }
  pintar();
  setInterval(pintar, 30000);
})();

/* ───────── imán en los botones (biblioteca-movimiento/magnetico.js, tal cual) ───────── */
magnetizar($$('.iman'));

/* ───────── cursor propio: punto dorado y aro ───────── */
(function cursor() {
  if (!motion || tactil) return;
  const aro = document.createElement('div'), pt = document.createElement('div');
  aro.className = 'cursor'; pt.className = 'cursor-punto';
  [aro, pt].forEach(n => { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
  const aX = gsap.quickTo(aro, 'x', { duration: 0.3, ease: 'power3.out' }), aY = gsap.quickTo(aro, 'y', { duration: 0.3, ease: 'power3.out' });
  let ultimo = null;
  const mostrar = si => { aro.classList.toggle('es-vivo', si); pt.classList.toggle('es-vivo', si); };
  addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (!aro.classList.contains('es-vivo')) { gsap.set(aro, { x: e.clientX, y: e.clientY }); mostrar(true); }
    /* el del sistema se oculta solo cuando el propio ya se ve: nunca dos cursores */
    html.classList.add('con-cursor');
    gsap.set(pt, { x: e.clientX, y: e.clientY });
    aX(e.clientX); aY(e.clientY);
    /* el estado se decide aquí, por el objetivo (pointerover no siempre llega) */
    if (e.target === ultimo) return;
    ultimo = e.target;
    const t = e.target.closest ? e.target : null;
    const etiqueta = t && t.closest('[data-cursor]');
    const sobre = !!(t && t.closest('a, button, label, input, select, textarea, summary, [role="tab"], iframe'));
    const texto = etiqueta ? etiqueta.dataset.cursor : '';
    aro.classList.toggle('es-texto', !!texto);
    aro.dataset.texto = texto;
    aro.classList.toggle('es-activo', sobre && !texto);
    pt.classList.toggle('es-oculto', !!texto || sobre);
  });
  html.addEventListener('mouseleave', () => mostrar(false));
  html.addEventListener('mouseenter', () => { if (html.classList.contains('con-cursor')) mostrar(true); });
})();

/* ───────── cabecera fija y menú móvil ───────── */
const cab = $('#cabecera'), hamb = $('#hamburguesa');
function cerrarMenu() {
  if (!cab || !cab.classList.contains('es-menu-abierto')) return;
  cab.classList.remove('es-menu-abierto');
  hamb.setAttribute('aria-expanded', 'false');
  $('.visualmente-oculto', hamb).textContent = 'Abrir menú';
  if (lenis) lenis.start();
}
if (cab) {
  const fija = () => cab.classList.toggle('es-fija', scrollY > 30);
  addEventListener('scroll', fija, { passive: true });
  fija();
  hamb.addEventListener('click', () => {
    const abierto = cab.classList.toggle('es-menu-abierto');
    hamb.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    $('.visualmente-oculto', hamb).textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
    if (lenis) abierto ? lenis.stop() : lenis.start();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cab.classList.contains('es-menu-abierto')) { cerrarMenu(); hamb.focus(); } });
  $$('#navegacion a').forEach(a => a.addEventListener('click', cerrarMenu));
}

/* ───────── mapa: Google solo bajo clic ───────── */
(function mapa() {
  const b = $('#mapa-boton'), caja = $('#mapa-consentimiento');
  if (!b || !caja) return;
  b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=Marina+Spa,+C.+Reyes+Huertas+8,+Zafra&output=embed';
    f.title = 'Mapa: Marina Spa, C. Reyes Huertas 8, Zafra';
    f.loading = 'lazy'; f.allowFullscreen = true; f.referrerPolicy = 'no-referrer-when-downgrade';
    caja.replaceWith(f);
    f.focus();
  });
})();

/* ───────── aviso de cookies ───────── */
(function cookies() {
  const caja = $('#cookies'), ok = $('#cookies-aceptar'), otra = $('#cookies-reabrir');
  if (!caja || !ok) return;
  const ver = si => { caja.hidden = !si; document.body.classList.toggle('cookies-visibles', si); };
  let visto = null;
  try { visto = localStorage.getItem('ms-cookies'); } catch (e) {}
  if (visto !== 'ok') ver(true);
  ok.addEventListener('click', () => { ver(false); try { localStorage.setItem('ms-cookies', 'ok'); } catch (e) {} });
  if (otra) otra.addEventListener('click', () => { ver(true); ok.focus(); });
})();

if (gsapReady) {
  if (document.fonts) document.fonts.ready.then(refrescar);
  addEventListener('load', refrescar);
  /* contenido que cambia de alto (mapa, pestañas, fotos): el final de ScrollTrigger se queda viejo */
  if ('ResizeObserver' in window) {
    let previo = 0, t = 0;
    new ResizeObserver(() => {
      const a = document.body.offsetHeight;
      if (Math.abs(a - previo) < 40) return;
      previo = a; clearTimeout(t); t = setTimeout(refrescar, 150);
    }).observe(document.body);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
   Se enseña solo con ?revision. Cambia entre «Bóveda» y «Sobria», lista los
   avisos pendientes y lleva el buscador de la sobria. Lo quita
   node scripts/quitar-mando.mjs (receta en el README).
   ═══════════════════════════════════════════════════════════════════════ */
(function mandoMaqueta() {
  const mando = $('#mando');
  if (!mando || !/[?&]revision\b/.test(location.search)) return;
  mando.hidden = false;                                /* sin JS no haría nada: lo enseña el JS */
  const botones = $$('[data-densidad]', mando);
  function aplicar(d) {
    html.classList.remove('densidad-boveda', 'densidad-sobria');
    html.classList.add('densidad-' + d);
    botones.forEach(b => b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'));
    try { localStorage.setItem('ms-densidad', d); } catch (e) {}
    avisar('densidad-cambiada', d);
    setTimeout(refrescar, 90);
  }
  botones.forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.densidad === densidad() ? 'true' : 'false');
    b.addEventListener('click', () => aplicar(b.dataset.densidad));
  });
  if (densidad() !== 'boveda') avisar('densidad-cambiada', densidad());
  let datos = { avisos: [] };
  try { datos = JSON.parse($('#mando-datos').textContent); } catch (e) {}
  const lista = $('#mando-lista');
  datos.avisos.forEach(([t, d]) => { const li = document.createElement('li'); li.textContent = t; const s = document.createElement('small'); s.textContent = d; li.appendChild(s); lista.appendChild(li); });
  $('#mando-cuenta').textContent = '(' + datos.avisos.length + ')';
  M.mando = { aplicar, avisos: datos.avisos.map(a => a[0]) };

  /* buscador de la sobria: filtra las 53 líneas de la carta y lleva a su página */
  const campo = $('#buscador-campo');
  if (!campo) return;
  const indice = JSON.parse($('#buscador-datos').textContent);
  const norma = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const res = $('#buscador-resultados'), estado = $('#buscador-estado');
  campo.addEventListener('input', () => {
    const q = norma(campo.value.trim());
    res.textContent = '';
    if (!q) { estado.textContent = indice.length + ' tratamientos en la carta'; return; }
    const hay = indice.filter(x => norma(x.n).includes(q) || norma(x.a).includes(q));
    estado.textContent = hay.length ? hay.length + (hay.length === 1 ? ' tratamiento' : ' tratamientos') : 'Ningún tratamiento con ese nombre';
    hay.slice(0, 8).forEach(x => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = x.u;
      const n = document.createElement('span'); n.textContent = x.n;
      const s = document.createElement('small'); s.textContent = x.a;
      const p = document.createElement('span'); p.className = 'precio'; p.textContent = x.p.replace(/(\d)\s*€/g, '$1 €');
      a.append(n, s, p); li.appendChild(a); res.appendChild(li);
    });
  });
  campo.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('a', res); if (a) location.href = a.href; } });
})();
/* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
