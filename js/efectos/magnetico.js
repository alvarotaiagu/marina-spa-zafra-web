// ─────────────────────────────────────────────────────────────────────────────
// BOTONES MAGNÉTICOS · común a los bocetos B y C (Complementos Inés, 2026-10-06)
// El botón se desplaza hacia el ratón mientras está encima y vuelve al salir.
// Solo con ratón y sin movimiento reducido.
//   const quitar = magnetizar(document.querySelectorAll('.mag'));
// ─────────────────────────────────────────────────────────────────────────────
import { f1, reducido, conRaton } from './util.js';

export function magnetizar(elementos, { x = 0.25, y = 0.35 } = {}) {
  if (!conRaton() || reducido()) return () => {};
  const quitar = [];
  for (const b of elementos) {
    b.style.transition = 'transform .35s cubic-bezier(.2,.7,.2,1)';
    const mover = (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${f1((e.clientX - r.left - r.width / 2) * x)}px,${f1((e.clientY - r.top - r.height / 2) * y)}px)`;
    };
    const soltar = () => { b.style.transform = ''; };
    b.addEventListener('pointermove', mover);
    b.addEventListener('pointerleave', soltar);
    quitar.push(() => { b.removeEventListener('pointermove', mover); b.removeEventListener('pointerleave', soltar); soltar(); });
  }
  return () => quitar.forEach((f) => f());
}
