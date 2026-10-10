/* Módulo «cinta» (data-modulo="cinta"). Dos filas de nombres reales de la carta que
   corren en sentidos opuestos y aceleran con la velocidad del scroll. El motor es
   biblioteca-movimiento/efectos/marquesina.js, tal cual. Solo se mueve a la vista y en la
   versión «Bóveda»; en la «Sobria» se cambia por la línea quieta de marcas (CSS).
   Se quita con scripts/quitar-cinta.mjs. */
import { crearMarquesina } from './efectos/marquesina.js';

const M = window.Marina || {};
const sec = document.getElementById('cinta');
if (sec) {
  const max = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const m = crearMarquesina(sec, { reducido: !!M.reduce, base: 34, maximo: 5, recorrido: max });
  M.cinta = m;
  let visible = false, raf = 0;
  const paso = () => { raf = requestAnimationFrame(paso); m.pintar(scrollY / max()); };
  function decidir() {
    const debe = m.vivo && visible && document.documentElement.classList.contains('densidad-boveda');
    if (debe && !raf) raf = requestAnimationFrame(paso);
    else if (!debe && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; decidir(); }).observe(sec);
  document.addEventListener('densidad-cambiada', () => { m.medir(); decidir(); });
  if (document.fonts) document.fonts.ready.then(() => m.medir());
  if (M.alCambiarVista) M.alCambiarVista(() => m.medir());
}
