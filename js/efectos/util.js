// Utilidades compartidas por todos los efectos de la biblioteca. Sin dependencias.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** smoothstep: arranca y frena suave. */
export const suave = (t) => t * t * (3 - 2 * t);
export const f1 = (n) => n.toFixed(1);
export const reducido = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const conRaton = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
/** Reparte un progreso en un subtramo: 0 antes de a, 1 después de b. */
export const rango = (v, a, b) => clamp((v - a) / (b - a));

const NS = 'http://www.w3.org/2000/svg';
/** Crea un elemento SVG con sus atributos (los null se saltan). */
export function crearSvg(etiqueta, atributos = {}) {
  const el = document.createElementNS(NS, etiqueta);
  for (const [k, v] of Object.entries(atributos)) if (v != null) el.setAttribute(k, v);
  return el;
}

/** Caja de un elemento relativa a otro (incluye transformaciones): { x, y, w, h }. */
export function cajaRelativa(el, ref) {
  const r = el.getBoundingClientRect(), b = ref.getBoundingClientRect();
  return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
}

/**
 * Trazo que se dibuja poco a poco aunque sea discontinuo (puntadas, eslabones):
 * el trazo visible va bajo una máscara de trazo continuo, y lo que avanza es la máscara.
 * Crea dentro de `svg`: <mask> (userSpaceOnUse, con x=0 y=0), el trazo visible y un medidor invisible.
 * En medir(): poner(d, W, H) → largo. En pintar(): avance(s) y punto(s) (sin leer el DOM).
 *   const t = trazoRevelable(svg, { class: 'hilo', stroke: '#AD7F2E', 'stroke-dasharray': '9 7' });
 */
export function trazoRevelable(svg, atributos = {}, { anchoMascara = 12, paso = 3 } = {}) {
  const id = 'tr-' + Math.random().toString(36).slice(2, 8);
  const defs = crearSvg('defs');
  const mascara = crearSvg('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 100, height: 100 });
  const masc = crearSvg('path', { fill: 'none', stroke: '#fff', 'stroke-width': anchoMascara });
  mascara.append(masc); defs.append(mascara);
  const trazo = crearSvg('path', { fill: 'none', ...atributos, mask: `url(#${id})` });
  const medidor = crearSvg('path', { fill: 'none', stroke: 'none' });
  svg.append(defs, trazo, medidor);
  let largo = 0, xs = [], ys = [];

  /** Largo de un trazo cualquiera (para saber dónde empieza y acaba un tramo). Solo en medir(). */
  const medirD = (d) => { medidor.setAttribute('d', d); return medidor.getTotalLength(); };

  function poner(d, W, H) {
    mascara.setAttribute('width', W); mascara.setAttribute('height', H);
    trazo.setAttribute('d', d); masc.setAttribute('d', d);
    largo = medirD(d);
    // hueco algo mayor que el trazo: con s = 0 no asoma ni una mota al final
    masc.style.strokeDasharray = `${largo.toFixed(2)} ${(largo + 20).toFixed(2)}`;
    // tabla de puntos: punto(s) no vuelve a preguntar al DOM en cada fotograma
    const n = Math.max(2, Math.ceil(largo / paso) + 1);
    xs = new Float32Array(n); ys = new Float32Array(n);
    for (let i = 0; i < n; i++) { const q = medidor.getPointAtLength((largo * i) / (n - 1)); xs[i] = q.x; ys[i] = q.y; }
    return largo;
  }
  /** Deja dibujada la fracción s (0…1) del trazo. */
  const avance = (s) => { masc.style.strokeDashoffset = (largo * (1 - clamp(s))).toFixed(2); };
  /** Punto y ángulo (grados) en la fracción s del trazo: [x, y, ang]. */
  function punto(s) {
    const n = xs.length;
    if (n < 2) return [0, 0, 0];
    const f = clamp(s) * (n - 1), i = Math.min(n - 2, Math.floor(f)), t = f - i;
    const dx = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i];
    return [xs[i] + dx * t, ys[i] + dy * t, Math.atan2(dy, dx) * 57.2958];
  }
  return {
    trazo, poner, avance, punto, medirD,
    get largo() { return largo; },
    quitar() { defs.remove(); trazo.remove(); medidor.remove(); },
  };
}

/**
 * Parte un titular en letras. Cada palabra va en un inline-block sin cortes
 * (si no, el salto de línea parte palabras). Respeta <em> y demás etiquetas internas.
 * El texto completo queda en aria-label; las letras, aria-hidden.
 * CSS necesario: .pal{display:inline-block;white-space:nowrap} .car{display:inline-block}
 */
export function partirLetras(el) {
  if (el.dataset.partido) return [...el.querySelectorAll('.car')];
  el.dataset.partido = '1';
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const cars = [];
  const recorrer = (nodo) => {
    for (const n of [...nodo.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(' '); return; }
          const pal = document.createElement('span');
          pal.className = 'pal';
          pal.setAttribute('aria-hidden', 'true');
          for (const ch of w) {
            const c = document.createElement('span');
            c.className = 'car';
            c.textContent = ch;
            pal.append(c);
            cars.push(c);
          }
          frag.append(pal);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) recorrer(n);
    }
  };
  recorrer(el);
  return cars;
}

/**
 * Revela letras según un progreso q (0 → 1). Cada letra tarda «ventana» letras en llegar.
 * base: opacidad de partida (0 = invisibles; 0.12 = «se rellena» sobre un fantasma).
 */
export function revelarLetras(cars, q, { y = 0, base = 0.12, ventana = 8 } = {}) {
  const n = cars.length;
  cars.forEach((c, i) => {
    const v = clamp((q * (n + ventana) - i) / ventana);
    c.style.opacity = (base + (1 - base) * v).toFixed(3);
    if (y) c.style.transform = v >= 1 ? '' : `translateY(${f1((1 - v) * y)}px)`;
  });
}

/**
 * Para anfitriones sin ScrollTrigger: progreso de un tramo con escena sticky
 * (0 al empezar a fijarse, 1 al soltarse). `scroller` = contenedor con scroll o null (ventana).
 */
export function progresoTramo(tramo, scroller = null) {
  const r = tramo.getBoundingClientRect();
  const top = scroller ? r.top - scroller.getBoundingClientRect().top : r.top;
  const alto = scroller ? scroller.clientHeight : innerHeight;
  const recorrido = r.height - alto;
  // tramo no más alto que la pantalla (p. ej. height:auto en modo quieto): 0 antes, 1 después
  if (recorrido <= 0) return top <= 0 ? 1 : 0;
  return clamp(-top / recorrido);
}

/** 0 cuando el borde superior del elemento está en ini·alto de la pantalla; 1 cuando está en fin·alto. */
export function progresoEntrada(el, scroller = null, ini = 0.9, fin = 0.3) {
  const r = el.getBoundingClientRect();
  const top = scroller ? r.top - scroller.getBoundingClientRect().top : r.top;
  const alto = scroller ? scroller.clientHeight : innerHeight;
  return clamp((ini * alto - top) / ((ini - fin) * alto));
}
