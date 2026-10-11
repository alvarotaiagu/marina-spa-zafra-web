/* Módulo «recorrido» (data-modulo="recorrido"). El vídeo de su web en un arco alto y la
   lista de estancias de sus rótulos, que se ilumina con el tiempo del vídeo. Pulsar una
   estancia lleva el vídeo a ese segundo: es un índice, no un scrub (el vídeo atado al
   scroll es de Raia). Solo corre a la vista, muted y playsinline, con póster.
   La estancia activa es contenido: también cambia con movimiento reducido.
   Tiempos en data/recorrido.json. Se quita con scripts/quitar-recorrido.mjs. */
const M = window.Marina || {};
const sec = document.getElementById('recorrido');
if (sec) {
  const v = document.getElementById('tour');
  const btns = [...sec.querySelectorAll('#estancias button')];
  const datos = JSON.parse(document.getElementById('recorrido-datos').textContent);
  const R = M.recorrido = { activo: null, saltos: 0 };
  function marcar() {
    const t = v.currentTime;
    let act = null;
    btns.forEach(b => { if (t >= +b.dataset.t) act = b; });
    if (t >= datos.fin) act = null;                   /* «Ven a conocernos»: el cierre del vídeo */
    btns.forEach(b => { b.classList.toggle('es-activo', b === act); b.setAttribute('aria-current', b === act ? 'true' : 'false'); });
    R.activo = act ? act.textContent : null;
  }
  ['timeupdate', 'seeked', 'loadedmetadata'].forEach(ev => v.addEventListener(ev, marcar));
  btns.forEach(b => b.addEventListener('click', () => {
    if (v.preload === 'none') v.preload = 'auto';
    v.currentTime = +b.dataset.t + 0.05;
    R.saltos++;
    marcar();
    if (!M.reduce) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  }));
  if (!M.reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    }), { rootMargin: '-15% 0px' }).observe(v);
  }
  marcar();
}
