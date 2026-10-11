// ─────────────────────────────────────────────────────────────────────────────
// MARQUESINA · boceto C «Dos mitades» (Complementos Inés, 2026-10-06)
//
// Filas de texto (categorías) que corren solas, en sentidos contrarios, y que
// ACELERAN y CAMBIAN DE SENTIDO con la velocidad del scroll: al subir, giran.
//
// Velocidad: el efecto la saca de cómo cambia `p` entre fotogramas. Para pasarla a
// píxeles necesita saber cuántos px de scroll hay entre p = 0 y p = 1: la opción
// `recorrido` (número o función que se evalúa en medir()). Lo más sencillo es pasar
// el progreso de toda la página:
//   p = scrollY / (scrollHeight − innerHeight),  recorrido: () => scrollHeight − innerHeight
// Si `p` llega recortado a 0…1 (un ScrollTrigger del bloque), fuera del tramo la
// velocidad es 0 y la marquesina vuelve a su paso normal.
// Lleva su propio reloj: hay que llamar a pintar(p) EN CADA FOTOGRAMA mientras se vea
// (`vivo` es true salvo en modo quieto).
//
// DOM dentro de `escena`:
//   [data-fila]   fila (display:flex;width:max-content;white-space:nowrap;will-change:transform)
//                 con UN hijo: el texto. El efecto lo clona (aria-hidden) para dar la vuelta
//                 sin saltos. data-fila="-1" la invierte; si no, las filas alternan de sentido.
//   La escena (o la sección) con overflow:hidden.
//
// Opciones: base (px/s en reposo, 45), maximo (multiplicador máximo de rapidez, 6),
// sensibilidad (px/s de scroll que suman 1× de rapidez, 240), umbral (px/s de scroll hacia
// arriba a partir de los que gira, 30), suavizado (0…1 por fotograma a 60 Hz, 0.18),
// copias (3), recorrido.
// Modo quieto: no clona ni se mueve; el texto queda en su sitio.
// ─────────────────────────────────────────────────────────────────────────────
import { f1, reducido } from './util.js';

const POR_DEFECTO = {
  base: 45, maximo: 6, sensibilidad: 240, umbral: 30, suavizado: 0.18, copias: 3,
  recorrido: 1000,
};

export function crearMarquesina(escena, opciones = {}) {
  const o = { ...POR_DEFECTO, ...opciones };
  const quieto = opciones.reducido ?? reducido();
  const filas = [...escena.querySelectorAll('[data-fila]')].map((el, i) => ({
    el, sentido: el.dataset.fila === '-1' ? -1 : el.dataset.fila === '1' ? 1 : i % 2 ? -1 : 1, ancho: 0, x: 0,
  }));
  const clones = [];
  if (!quieto) filas.forEach(({ el }) => {
    const s = el.firstElementChild;
    for (let k = 0; k < o.copias; k++) {
      const c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true'); c.inert = true;
      el.append(c); clones.push(c);
    }
  });
  let recorrido = 0, p = null, vel = 0, ultimo = performance.now();

  function medir() {
    recorrido = typeof o.recorrido === 'function' ? o.recorrido() : o.recorrido;
    filas.forEach((f) => { f.ancho = f.el.firstElementChild.getBoundingClientRect().width; });
  }

  function pintar(progreso) {
    const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (quieto) return;
    // velocidad del scroll en px/s, suavizada (independiente de los fotogramas por segundo)
    const inst = p == null || !dt ? 0 : ((progreso - p) * recorrido) / dt;
    p = progreso;
    vel += (inst - vel) * (1 - Math.pow(1 - o.suavizado, dt * 60));
    const giro = vel < -o.umbral ? -1 : 1;
    const rapidez = o.base * (1 + Math.min(o.maximo, Math.abs(vel) / o.sensibilidad));
    filas.forEach((f) => {
      if (!f.ancho) return;
      f.x = (f.x + f.sentido * giro * rapidez * dt) % f.ancho;
      let x = -f.x;
      if (x > 0) x -= f.ancho;
      f.el.style.transform = `translateX(${f1(x)}px)`;
    });
  }

  medir();
  return {
    medir, pintar,
    get vivo() { return !quieto; },
    /** velocidad del scroll que está usando (px/s; negativa = hacia arriba) */
    get velocidad() { return vel; },
    destruir() { clones.forEach((c) => c.remove()); filas.forEach((f) => { f.el.style.transform = ''; }); },
  };
}
