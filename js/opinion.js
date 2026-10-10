/* Módulo «opinión» (data-modulo="opinion"). La cita de Ana M. se enciende palabra a
   palabra al entrar (color, nunca opacity). Sin movimiento, se queda tal cual.
   Se quita con scripts/quitar-opinion.mjs. */
const M = window.Marina || {};
const p = document.getElementById('opinion-texto');
if (p && M.motion) {
  const pals = [];
  const f = document.createDocumentFragment();
  p.textContent.split(/(\s+)/).forEach(t => {
    if (!t) return;
    if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
    const s = document.createElement('span'); s.className = 'op-p'; s.textContent = t; f.appendChild(s); pals.push(s);
  });
  p.textContent = '';
  p.appendChild(f);
  M.alVisible(p, () => pals.forEach((s, i) => setTimeout(() => s.classList.add('es-on'), 60 + i * 55)), '0px 0px -20% 0px');
}
