/* Módulo «Beauty Party» (data-modulo="beauty-party"), en Estética general. Lo que
   incluye entra en cascada al llegar. El estado oculto solo existe si este archivo
   carga (clase js-listo), así que sin él se ve todo. Se quita con scripts/quitar-beauty-party.mjs. */
const M = window.Marina || {};
const sec = document.getElementById('beauty-party');
if (sec && M.motion) {
  sec.classList.add('js-listo');
  M.alVisible(sec.querySelector('.beauty-party__incluye'), () => sec.classList.add('es-visible'));
}
