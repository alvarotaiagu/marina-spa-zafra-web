/* Escribe la web entera desde los datos. Las 13 páginas (12 URL de marinaspa.es + 404),
   el sitemap, robots.txt, manifest.json y el .htaccess de IONOS salen de aquí:

     data/paginas.json     URL, <title>, description y h1 de hoy (lo que posiciona)
     data/seo-cambios.json los pocos cambios sobre paginas.json (reglas 3 y 4 del encargo)
     data/carta.json       la carta literal de su web (53 líneas; erratas corregidas por
                           scripts/preparar-carta.mjs)
     data/horario.json     el horario (tabla, «abierto ahora» y JSON-LD)
     data/recorrido.json   las estancias del vídeo y su segundo
     data/beauty-party.json  el bloque de Estética general (módulo)
     data/fotos.json       cada <picture> por id (versiones de scripts/fotos.mjs)
     data/sitio.json       contacto, redes y qué módulos están puestos
     assets/marca/loto-piezas.json  el loto (pétalos y máscaras) que se mete en línea

   Las páginas NO se editan a mano: se cambia el dato y se vuelve a pasar esto.
   Idempotente: la segunda pasada dice «sin cambios».

   node scripts/construir.mjs              (escribe)
   node scripts/construir.mjs --comprobar  (no escribe; sale con 1 si algo no está al día)
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { huellas, versionarHtml } from './versionar.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8'));
const carta = leer('data/carta.json');
const paginas = leer('data/paginas.json');
const cambios = leer('data/seo-cambios.json').cambios;
const horario = leer('data/horario.json');
const sitio = leer('data/sitio.json');
const fotosJson = leer('data/fotos.json');
const fotos = Object.fromEntries(fotosJson.fotos.map(f => [f.id, f]));
const loto = leer('assets/marca/loto-piezas.json');
const MOD = sitio.modulos;
/* los datos de un módulo quitado pueden no estar: solo se leen si el módulo sigue */
const recorrido = MOD.recorrido && fs.existsSync(path.join(raiz, 'data/recorrido.json')) ? leer('data/recorrido.json') : null;
const beauty = MOD['beauty-party'] && fs.existsSync(path.join(raiz, 'data/beauty-party.json')) ? leer('data/beauty-party.json') : null;

/* ───────── utilidades ───────── */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/* «44€» → «44 €» con espacio fino (U+2009). El espacio va en Cormorant (Lato no lo trae)
   y la cifra con su € no se parte nunca. */
const euros = t => esc(t).replace(/(\d+(?:[.,]\d+)?)\s*€/g, '<span class="eu">$1<span class="ef">\u2009</span>€</span>');
const precio = t => `<span class="precio">${euros(t)}</span>`;
const minutos = d => d ? esc(d.replace(/(\d)min/g, '$1 min')) : '';
const numeros = t => (String(t).match(/\d+(?:[.,]\d+)?/g) || []).map(n => +n.replace(',', '.'));
const WA = (texto) => `https://wa.me/${sitio.whatsapp}?text=${texto}`;
const waCita = nombre => WA('Hola,%20me%20gustar%C3%ADa%20pedir%20cita%20para%20' + encodeURIComponent(nombre));
const dominio = sitio.dominio;
const anio = 2026;

/* ───────── áreas (las seis páginas de tratamientos) ───────── */
const AREAS = [
  { url: '/tratamientos-faciales-zafra', clave: 'faciales', corto: 'Faciales', nombre: 'Rituales faciales', foto: 'facial', texto: 'Rejuvenecimiento, higiene y luminosidad con alta cosmética.', eti: 'Cuidado facial' },
  { url: '/indiba-zafra', clave: 'indiba', corto: 'Indiba', nombre: 'Indiba', foto: 'indiba', texto: 'Radiofrecuencia regenerativa celular para rostro y cuerpo.', eti: 'Tecnología avanzada' },
  { url: '/tratamientos-corporales-zafra', clave: 'corporales', corto: 'Corporales', nombre: 'Corporales', foto: 'corporales', texto: 'Maderoterapia, criolipólisis y planes de adelgazamiento.', eti: 'Remodelación' },
  { url: '/spa-relax-masajes-zafra', clave: 'spa', corto: 'Spa', nombre: 'Spa y masajes', foto: 'bienestar', texto: 'Masajes relajantes, bañeras de hidromasaje y rituales sensoriales.', eti: 'Equilibrio & armonía' },
  { url: '/depilacion-fotodepilacion-zafra', clave: 'depilacion', corto: 'Depilación', nombre: 'Depilación', foto: 'depilacion', texto: 'Fotodepilación, cera y diseño de cejas con hilo. Resultados duraderos.', eti: 'Suavidad' },
  { url: '/estetica-general-zafra', clave: 'estetica', corto: 'Estética', nombre: 'Estética general', foto: 'estetica', texto: 'Manicura, pedicura y maquillaje para realzar tu belleza natural.', eti: 'Belleza' }
];
const cartaDe = url => carta.paginas.find(p => p.url === url);
const lineasDe = url => cartaDe(url).grupos.flatMap(g => g.tratamientos.map(t => ({ ...t, grupo: g.grupo })));
AREAS.forEach(a => {
  const nums = lineasDe(a.url).flatMap(t => numeros(t.precio));
  a.desde = Math.min(...nums);
});
const enlace = url => url === '/' ? './' : url.slice(1);           /* relativo y sin extensión */
const archivo = url => url === '/' ? 'index.html' : url.slice(1) + '.html';
const NOMBRES = new Set(carta.paginas.flatMap(p => p.grupos.flatMap(g => g.tratamientos.map(t => t.nombre))));
const RITUALES_FOTO = { 'Ritual Polinesia': 'aceite', 'Ritual Ártico': 'zen', 'Ritual Termal': 'masaje-facial', 'Ritual de la Alegría con Cítricos by Alquimia': 'corporales' };

/* ───────── SEO de cada página ───────── */
function seo(url) {
  const p = { ...paginas.find(x => x.url === url) };
  for (const c of cambios.filter(c => c.url === url)) p[c.campo] = c.valor;
  return p;
}

/* ───────── fotos ───────── */
function pic(id, { sizes = '100vw', eager = false, clase = '', alt = null } = {}) {
  const f = fotos[id];
  if (!f || !f.anchos) throw new Error('Foto sin versiones (node scripts/fotos.mjs): ' + id);
  const set = ext => f.anchos.map(a => `assets/fotos/${id}-${a}.${ext} ${a}w`).join(', ');
  const mayor = f.anchos[f.anchos.length - 1];
  const alto = Math.round(f.h * mayor / f.w);
  const carga = eager ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<picture data-foto="${id}"><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img${clase ? ` class="${clase}"` : ''} src="assets/fotos/${id}-${mayor}.jpg" srcset="${set('jpg')}" sizes="${sizes}" width="${mayor}" height="${alto}" alt="${esc(alt ?? f.alt)}" decoding="async"${carga} style="object-position:${f.foco || '50% 50%'}"></picture>`;
}

/* ───────── el loto ───────── */
let lotos = 0;
/* en línea, con las máscaras de oclusión y los ids renombrados (uno por instancia) */
function lotoSvg({ clase = 'loto', id = '', titulo = '' } = {}) {
  const suf = '-l' + (++lotos);
  const defs = loto.mascaras.map(m => `<mask id="${m.id}${suf}" maskUnits="userSpaceOnUse" x="60" y="46" width="520" height="564">${m.contenido}</mask>`).join('');
  const ps = loto.petalos.map(p => `<path data-petalo="${p.nombre}" d="${p.d}"${p.mascara ? ` mask="url(#${p.mascara}${suf})"` : ''} pathLength="1"/>`).join('');
  const acc = titulo ? ` role="img" aria-label="${esc(titulo)}"` : ' aria-hidden="true" focusable="false"';
  return `<svg class="${clase}"${id ? ` id="${id}"` : ''} viewBox="${loto.viewBox}" fill="none" stroke-linejoin="round" stroke-linecap="round"${acc}><defs>${defs}</defs>${ps}</svg>`;
}
/* pequeño, desde el sprite (memoria: <use> siempre con x/y/width/height) */
const [VBX, VBY, VBW, VBH] = loto.viewBox.split(' ').map(Number);
const lotoPeq = (clase = 'loto-peq') => `<svg class="${clase}" viewBox="${loto.viewBox}" aria-hidden="true" focusable="false"><use href="#loto-s" x="${VBX}" y="${VBY}" width="${VBW}" height="${VBH}"/></svg>`;
function sprite() {
  const defs = loto.mascaras.map(m => `<mask id="${m.id}-s" maskUnits="userSpaceOnUse" x="60" y="46" width="520" height="564">${m.contenido}</mask>`).join('');
  const ps = loto.petalos.map(p => `<path d="${p.d}"${p.mascara ? ` mask="url(#${p.mascara}-s)"` : ''}/>`).join('');
  return `<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>${defs}<symbol id="loto-s" viewBox="${loto.viewBox}"><g fill="none" stroke="currentColor" stroke-width="16" stroke-linejoin="round" stroke-linecap="round">${ps}</g></symbol></defs></svg>`;
}
const marca = (prefijo = '') => `<a class="marca" href="${prefijo || './'}" aria-label="Marina Spa, inicio">${lotoPeq('marca__loto')}<span class="marca__nombre">MARINA SPA</span></a>`;

/* ───────── arcos de medio punto con filete dorado ───────── */
/* el filete se traza (pathLength=1); la foto se revela de desenfocada a nítida. Nunca un clip-path desde abajo. */
function filete(w, h, clase = 'filete') {
  const H = +(300 * h / w).toFixed(1), s = 1.5, r = 150 - s;
  return `<svg class="${clase}" viewBox="0 0 300 ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M${s} ${H} V150 A${r} ${r} 0 0 1 ${300 - s} 150 V${H}" pathLength="1"/></svg>`;
}
/* el cursor solo lleva texto donde al pulsar pasa algo: «Abrir» (dentro de un enlace),
   «Reservar» (rituales) o «Ampliar» (abre el visor; ampliar:true añade el botón de verdad) */
function arco(id, { w = 3, h = 4.3, sizes = '(max-width: 760px) 46vw, 16vw', eager = false, clase = '', alt = null, cursor = '', extra = '', dentro = '', doble = false, ampliar = false } = {}) {
  const f = fotos[id];
  const boton = ampliar ? `<button class="arco__ampliar" type="button" data-ampliar="assets/fotos/${id}-${f.anchos[f.anchos.length - 1]}.jpg" data-titulo="${esc(typeof ampliar === 'string' ? ampliar : '')}" data-alt="${esc(alt ?? f.alt)}"><span class="visualmente-oculto">Ampliar foto: ${esc(alt ?? f.alt)}</span></button>` : '';
  const etiqueta = ampliar ? 'Ampliar' : cursor;
  return `<div class="arco ${clase}" style="--ar:${w}/${h}"${etiqueta ? ` data-cursor="${etiqueta}"` : ''}><div class="arco__foto">${pic(id, { sizes, eager, alt })}${dentro}</div>${filete(w, h)}${doble ? filete(w, h, 'filete filete--2') : ''}${extra}${boton}</div>`;
}

/* las bóvedas de cañón al fondo: arcos de medio punto concéntricos con el de la vela (mismo
   centro de curvatura), cada uno en dos mitades que se trazan desde la clave hacia abajo.
   Unidades: el arco de la ventana mide 100 de ancho (3 / 4,1 → 136,7 de alto, radio 50). */
function bovedas() {
  const cx = 125, cy = 133.33, base = 220, K = [1.28, 1.6, 1.98, 2.45];
  const anillos = K.map((k, i) => {
    const r = +(50 * k).toFixed(2), top = +(cy - r).toFixed(2);
    return `<g class="bovedas__anillo" data-anillo="${i}" style="--a:${[1, .72, .48, .3][i]}"><path d="M${cx} ${top}A${r} ${r} 0 0 0 ${+(cx - r).toFixed(2)} ${cy}V${base}" pathLength="1"/><path d="M${cx} ${top}A${r} ${r} 0 0 1 ${+(cx + r).toFixed(2)} ${cy}V${base}" pathLength="1"/></g>`;
  }).join('');
  return `<svg class="bovedas" id="bovedas" viewBox="0 0 250 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"><defs><linearGradient id="bovedas-luz" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="220"><stop offset="0" stop-color="#F0C868" stop-opacity=".62"/><stop offset=".55" stop-color="#D4AF37" stop-opacity=".3"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/></linearGradient></defs>${anillos}</svg>`;
}

/* ───────── horario ───────── */
const hm = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function tablaHorario() {
  const filas = horario.dias.map(d => {
    const horas = d.franjas.length ? d.franjas.map(([a, b]) => `<span>${a}–${b}</span>`).join('') : '<span>Cerrado</span>';
    return `<tr data-d="${d.d}"><th scope="row">${d.nombre}</th><td>${horas}</td></tr>`;
  }).join('');
  return `<table class="tabla-horario" id="horario"><caption class="visualmente-oculto">Horario de Marina Spa</caption><tbody>${filas}</tbody></table>`;
}
const datosHorario = () => JSON.stringify(Object.fromEntries(horario.dias.map(d => [d.d, d.franjas.map(([a, b]) => [hm(a), hm(b)])])));
function horasSchema() {
  const grupos = new Map();
  horario.dias.forEach(d => d.franjas.forEach(([a, b]) => {
    const k = a + '|' + b;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(d.schema);
  }));
  return [...grupos].map(([k, dias]) => { const [a, b] = k.split('|'); return { '@type': 'OpeningHoursSpecification', dayOfWeek: dias, opens: a, closes: b }; });
}

/* ───────── JSON-LD ───────── */
const ID = dominio + '/#beautysalon';
function oferta(t) {
  const n = numeros(t.precio);
  const o = { '@type': 'Offer', itemOffered: { '@type': 'Service', name: t.nombre }, priceCurrency: 'EUR' };
  if (t.descripcion) o.itemOffered.description = t.descripcion;
  if (/desde/i.test(t.precio) && n.length) o.priceSpecification = { '@type': 'PriceSpecification', minPrice: n[0], priceCurrency: 'EUR' };
  else if (n.length === 1) o.price = n[0];
  else if (n.length === 2) o.priceSpecification = { '@type': 'PriceSpecification', minPrice: Math.min(...n), maxPrice: Math.max(...n), priceCurrency: 'EUR' };
  else delete o.priceCurrency;
  return o;
}
const catalogo = (a) => ({ '@type': 'OfferCatalog', name: a.nombre, itemListElement: lineasDe(a.url).map(oferta) });
const migasLd = (url, nombre, medio) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: dominio + '/' },
    ...(medio ? [{ '@type': 'ListItem', position: 2, name: 'Tratamientos', item: dominio + '/#tratamientos' }] : []),
    { '@type': 'ListItem', position: medio ? 3 : 2, name: nombre, item: dominio + url }
  ]
});
function ldInicio() {
  return [{
    '@context': 'https://schema.org', '@type': 'DaySpa', '@id': ID, name: 'Marina Spa', url: dominio + '/',
    description: 'Centro de estética y belleza en Zafra especializado en rituales faciales, Indiba, tratamientos corporales, depilación y bienestar.',
    slogan: sitio.lema, telephone: sitio.tel, email: sitio.email, priceRange: '€€',
    logo: dominio + '/assets/marca/icono-512.png',
    image: [dominio + '/assets/og-marina-spa.jpg', ...['vela', 'cabina', 'porton'].map(id => `${dominio}/assets/fotos/${id}-${fotos[id].anchos[fotos[id].anchos.length - 1]}.jpg`)],
    address: { '@type': 'PostalAddress', streetAddress: sitio.direccion.calle, addressLocality: sitio.direccion.ciudad, addressRegion: sitio.direccion.provincia, postalCode: sitio.direccion.cp, addressCountry: 'ES' },
    geo: { '@type': 'GeoCoordinates', latitude: sitio.geo.lat, longitude: sitio.geo.lon },
    areaServed: { '@type': 'City', name: 'Zafra' },
    hasMap: sitio.opinionesGoogle,
    openingHoursSpecification: horasSchema(),
    sameAs: [sitio.instagram, sitio.facebook],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Tratamientos de estética en Zafra', itemListElement: AREAS.map(catalogo) }
  }];
}
function ldArea(a, s) {
  return [{
    '@context': 'https://schema.org', '@type': 'Service', '@id': dominio + a.url + '#service', name: s.h1, url: dominio + a.url,
    description: s.description, serviceType: a.nombre, provider: { '@type': 'DaySpa', '@id': ID, name: 'Marina Spa' },
    areaServed: { '@type': 'City', name: 'Zafra' }, hasOfferCatalog: catalogo(a)
  }, migasLd(a.url, a.nombre, true)];
}

/* ───────── cabecera, pie y piezas comunes ───────── */
function cabecera(actual) {
  const item = (url, txt) => `<li><a href="${enlace(url)}"${actual === url ? ' aria-current="page"' : ''}>${txt}</a></li>`;
  return `<header class="cabecera" id="cabecera">
  <div class="cabecera__barra">
    ${marca()}
    <nav class="navegacion" id="navegacion" aria-label="Principal">
      <ul class="navegacion__principal">
        ${item('/centro-estetica-zafra', 'El centro')}
        <li class="desplegable" id="desplegable"><a href="./#tratamientos"${AREAS.some(a => a.url === actual) ? ' class="es-seccion"' : ''}>Tratamientos</a><button class="desplegable__flecha" id="desplegable-flecha" type="button" aria-expanded="false" aria-controls="panel-trat"><span class="visualmente-oculto">Ver las páginas de tratamientos</span></button>
          <div class="panel-trat" id="panel-trat" hidden>
            <ul class="panel-trat__lista">
              ${AREAS.map(a => `<li><a class="panel-trat__item" href="${enlace(a.url)}"${actual === a.url ? ' aria-current="page"' : ''}><span class="panel-trat__arco">${pic(a.foto, { sizes: '96px', alt: '' })}</span><span class="panel-trat__nombre">${a.nombre}</span><span class="panel-trat__texto">${esc(a.texto)}</span></a></li>`).join('\n              ')}
            </ul>
          </div>
        </li>
        ${item('/indiba-zafra', 'Indiba')}
        ${item('/contacto', 'Contacto')}
      </ul>
      <ul class="navegacion__areas" aria-label="Tratamientos">
        ${AREAS.map(a => item(a.url, a.nombre)).join('\n        ')}
      </ul>
      <p class="navegacion__datos"><a href="tel:${sitio.tel}">${sitio.telefono}</a> · <a href="https://wa.me/${sitio.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></p>
    </nav>
    <a class="boton boton--oro boton--peq cabecera__cita" href="tel:${sitio.tel}">Pedir cita</a>
    <button class="hamburguesa" id="hamburguesa" type="button" aria-expanded="false" aria-controls="navegacion"><span class="hamburguesa__rayas" aria-hidden="true"></span><span class="visualmente-oculto">Abrir menú</span></button>
  </div>
</header>`;
}
function pie() {
  return `<footer class="pie">
  <div class="pie__cuerpo">
    <div class="pie__marca">${marca()}<p>Un santuario de belleza y bienestar en Zafra. Fusionamos técnica, tecnología y pasión para realzar tu mejor versión.</p></div>
    <nav class="pie__col" aria-label="Tratamientos"><h2>Tratamientos</h2><ul>${AREAS.map(a => `<li><a href="${enlace(a.url)}">${a.nombre}</a></li>`).join('')}</ul></nav>
    <div class="pie__col"><h2>Contacto</h2><address><a href="${sitio.opinionesGoogle}" target="_blank" rel="noopener">${sitio.direccion.calle}<br>${sitio.direccion.cp} ${sitio.direccion.ciudad}, ${sitio.direccion.provincia}</a><br><a href="tel:${sitio.tel}">${sitio.telefono}</a><br><a href="mailto:${sitio.email}">${sitio.email}</a></address></div>
    <div class="pie__col"><h2>Síguenos</h2><ul><li><a href="${sitio.instagram}" target="_blank" rel="noopener">Instagram ${sitio.instagramUsuario}</a></li><li><a href="${sitio.facebook}" target="_blank" rel="noopener">Facebook /marinaspazafra</a></li></ul></div>
  </div>
  <div class="pie__legal"><span>© ${anio} Marina Spa</span><a href="aviso-legal">Aviso legal</a><a href="politica-privacidad">Política de privacidad</a><a href="politica-cookies">Política de cookies</a><button type="button" class="pie__cookies" id="cookies-reabrir">Aviso de cookies</button></div>
</footer>`;
}
function aviso() {
  return `<div class="cookies" id="cookies" role="region" aria-label="Aviso de cookies" hidden>
  <p>Esta web no usa cookies de analítica ni de publicidad. Solo recuerda en tu navegador que has visto este aviso y, si pulsas «Ver mapa», Google Maps puede instalar las suyas. <a href="politica-cookies">Política de cookies</a></p>
  <button class="boton boton--oro boton--peq" type="button" id="cookies-aceptar">Entendido</button>
</div>`;
}

/* ───────── [MANDO DE MAQUETA] ───────── */
const AVISO_MANDO = `<!-- ═══ [MANDO DE MAQUETA] AVISO: esta maqueta lleva un mando de demostración
     (abajo a la izquierda, solo con ?revision en la URL) que cambia entre dos
     densidades («Bóveda» y «Sobria») y lista los avisos pendientes. NO DEBE VIAJAR
     A marinaspa.es: node scripts/quitar-mando.mjs <destino>
     fin del bloque [MANDO DE MAQUETA] ═══ -->`;
function datosMando() {
  const prov = fotosJson.fotos.filter(f => f.provisional);
  return {
    avisos: [
      ['Logo redibujado desde 64 px', 'El loto es un redibujado del logo de su web, que solo existe a 64 px. Pedir el vector original.'],
      [`Fotos provisionales: ${prov.length}`, 'De banco, las mismas que usa su web hoy: ' + prov.map(f => f.id).join(', ') + '. Las de la sesión de octubre de 2026 ya están en faciales, Indiba, corporales y spa; faltan depilación, estética y dos rituales (Ártico, Termal).'],
      ['Titular y NIF', 'Su aviso legal no los tiene y la LSSI (art. 10) los pide. Van como [PENDIENTE] en el aviso legal.'],
      ['Precios sin fecha', 'Son los de su web, que no dice de cuándo son. Confirmar que siguen.'],
      ['¿Láser o fotodepilación?', 'Su web dice «Láser» en el subtítulo y en la description, pero su tarifa se llama «Fotodepilación». Aquí sale «fotodepilación» en todo: preguntar si es láser o IPL.'],
      ['El peeling «Polinesia»', 'Su web lo llama solo «Polinesia». Se queda así hasta que diga el nombre completo.'],
      ['Tres cambios de texto (regla 3)', '<title> de El centro sin «El mejor…»; la description de corporales empieza por «Mejora tu silueta en nuestro centro de estética de Zafra…»; en la de Indiba, «oficial» pasa a «Centro certificado Indiba®», como dice su página de El centro. El superlativo solo queda en la cita de Ana M.'],
      ['El vídeo lleva rótulos de Instagram', 'El recorrido y el vídeo tour de El centro son el vídeo de su web, con rótulos e iconos de Instagram encima. Pedir uno limpio.'],
      ...(MOD.opinion ? [['La opinión de Ana M.', 'Con su nombre, como en su web. Confirmar que se puede seguir usando.']] : [])
    ]
  };
}
function mando() {
  return `<!-- ═══ [MANDO DE MAQUETA] — SOLO REVISIÓN. Se enseña con ?revision. Lo quita scripts/quitar-mando.mjs ═══ -->
<aside class="mando" id="mando" aria-label="Versión de la maqueta" hidden>
  <p class="mando__titulo">Versión <small>Dos versiones de la misma web</small></p>
  <div class="mando__botones" role="group" aria-label="Densidad">
    <button type="button" data-densidad="boveda" aria-pressed="true">Bóveda</button>
    <button type="button" data-densidad="sobria" aria-pressed="false">Sobria</button>
  </div>
  <details class="mando__avisos"><summary>Pendientes <span id="mando-cuenta"></span></summary><ul id="mando-lista"></ul></details>
  <script type="application/json" id="mando-datos">${JSON.stringify(datosMando())}</script>
</aside>
<!-- ═══ fin del bloque [MANDO DE MAQUETA] ═══ -->`;
}
function buscador() {
  const indice = carta.paginas.flatMap(p => p.grupos.flatMap(g => g.tratamientos.map(t => ({ n: t.nombre, u: enlace(p.url) + '#t-' + slug(t.nombre), a: AREAS.find(a => a.url === p.url).nombre, p: t.precio }))));
  return `<!-- ═══ [MANDO DE MAQUETA] buscador: solo existe en la versión sobria ═══ -->
      <div class="buscador" id="buscador">
        <label class="buscador__etiqueta" for="buscador-campo">Busca un tratamiento</label>
        <input class="buscador__campo" id="buscador-campo" type="search" autocomplete="off" placeholder="Indiba, maderoterapia, manicura…" aria-controls="buscador-resultados" aria-describedby="buscador-estado">
        <p class="buscador__estado" id="buscador-estado" aria-live="polite">${indice.length} tratamientos en la carta</p>
        <ul class="buscador__resultados" id="buscador-resultados"></ul>
        <script type="application/json" id="buscador-datos">${JSON.stringify(indice)}</script>
      </div>
      <!-- ═══ fin del bloque [MANDO DE MAQUETA] ═══ -->`;
}

/* ───────── documento ───────── */
const CDN = `<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>`;
function documento({ url, s, ld = [], cuerpo, clase = '', cortina = false, modulos = [], precarga = '', es404 = false }) {
  const canon = url === '/' ? dominio + '/' : dominio + url;
  const hojas = modulos.map(m => `<link rel="stylesheet" href="css/${m}.css" data-modulo="${m}">`).join('\n');
  const scripts = modulos.map(m => `<script type="module" src="js/${m}.js" data-modulo="${m}"></script>`).join('\n');
  let html = `<!DOCTYPE html>
<!--
  Marina Spa · C. Reyes Huertas, 8 · 06300 Zafra (Badajoz) · 644 79 90 00
  Concepto: «Bóveda». El centro está bajo bóvedas de ladrillo de medio punto, con
  un portón claveteado, velas y penumbra cálida; su marca es un loto dorado de
  línea fina. La web es entrar ahí: oscura donde se siente, clara donde se lee,
  las fotos en arcos de medio punto con filete dorado y el loto como la luz.

  Generado por scripts/construir.mjs desde data/*.json: no se edita a mano.
  Módulos que se pueden quitar: opinión, Beauty Party, cinta y recorrido (README).
-->
${AVISO_MANDO}
<html lang="es" class="sin-js densidad-boveda">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.title)}</title>
<meta name="description" content="${esc(s.description)}">
${es404 ? '' : `<link rel="canonical" href="${canon}">\n`}<meta name="theme-color" content="#1C1917">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MARINA SPA">
<meta property="og:title" content="${esc(s.ogTitle || s.title)}">
<meta property="og:description" content="${esc(s.description)}">
${es404 ? '' : `<meta property="og:url" content="${canon}">\n`}<meta property="og:image" content="${dominio}/assets/og-marina-spa.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/marca/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/marca/apple-touch-icon.png">
<link rel="manifest" href="manifest.json">
<link rel="preload" href="assets/fuentes/cormorant-garamond-300-500.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fuentes/lato-400.woff2" as="font" type="font/woff2" crossorigin>
${precarga}<link rel="stylesheet" href="css/estilos.css">
${hojas ? hojas + '\n' : ''}<script>
/* Bloqueante a propósito: la clase de JS, la cortina (una vez por visita) y la
   densidad de la maqueta se resuelven antes del primer pintado. */
(function () {
  var h = document.documentElement, vista = null;
  h.classList.remove('sin-js');
  h.classList.add('con-js');
  try { vista = sessionStorage.getItem('ms-visita'); sessionStorage.setItem('ms-visita', '1'); } catch (e) {}
  var conCortina = ${cortina ? '!vista' : 'false'};
  if (!conCortina) h.classList.add('sin-cortina');
  if (!conCortina && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    h.classList.add('entrada');
    /* sin cortina, el loto de la portada florece: solo si aún no se formó en esta visita */
    try { if (!sessionStorage.getItem('ms-loto')) h.classList.add('florece'); } catch (e) {}
  }
  /* red de seguridad: si main.js no llega, la cortina se va igual */
  setTimeout(function () { h.classList.add('cortina-fuera'); }, 6500);
  /* [MANDO DE MAQUETA] la densidad guardada solo cuenta en modo revisión (?revision) */
  if (!/[?&]revision\\b/.test(location.search)) return;
  try {
    var d = localStorage.getItem('ms-densidad');
    if (d === 'sobria' || d === 'boveda') { h.classList.remove('densidad-boveda', 'densidad-sobria'); h.classList.add('densidad-' + d); }
  } catch (e) {}
  /* fin del bloque [MANDO DE MAQUETA] */
})();
</script>
<noscript><style>.cortina{display:none!important}</style></noscript>
${ld.map(d => `<script type="application/ld+json">\n${JSON.stringify(d, null, 1)}\n</script>`).join('\n')}
</head>
<body class="${clase}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
${sprite()}
${cuerpo.cortina || ''}${cabecera(url)}
<main id="contenido">
${cuerpo.main}
</main>
${pie()}
${aviso()}
${mando()}
${CDN}
<script type="module" src="js/main.js"></script>
${scripts}
</body>
</html>
`;
  /* el 404 se sirve en cualquier ruta (/x/y/z): sus enlaces y recursos van desde la raíz del dominio */
  if (es404) html = html.replace(/(href|src|srcset|poster)="(?!https?:|\/|#|tel:|mailto:)([^"]*)"/g, (m, a, v) => `${a}="${v.split(', ').map(x => '/' + x.replace(/^\.\//, '')).join(', ')}"`);
  return html;
}

/* ───────── piezas de página ───────── */
function cierreCita() {
  return `<section class="cita-cierre" aria-labelledby="cierre-titulo">
  <p class="eti">No esperes más</p>
  <h2 class="titulo-sec" id="cierre-titulo" data-revelar>¿Lista para <em>renovarte</em>?</h2>
  <p>Reserva tu cita hoy y descubre el tratamiento perfecto para tu bienestar. Estaremos encantadas de atenderte.</p>
  <div class="acciones"><a class="boton boton--oro iman" href="tel:${sitio.tel}">Llamar · ${sitio.telefono}</a><a class="boton boton--linea iman" href="https://wa.me/${sitio.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
</section>`;
}
function otros(actual) {
  return `<section class="otros" aria-labelledby="otros-titulo">
  <h2 class="titulo-peq" id="otros-titulo">Otros tratamientos</h2>
  <ul class="otros__lista">${AREAS.filter(a => a.url !== actual).map(a => `<li><a class="ar ar--peq" href="${enlace(a.url)}">${arco(a.foto, { cursor: 'Abrir', w: 3, h: 4, sizes: '(max-width: 760px) 30vw, 12vw' })}<span class="ar__nombre">${a.nombre}</span><span class="ar__desde">desde ${precio(a.desde + '€')}</span></a></li>`).join('')}</ul>
</section>`;
}
function bloqueContacto({ pagina = false } = {}) {
  const T = pagina ? 'h2' : 'h2';
  return `<section class="contacto${pagina ? ' contacto--pagina' : ''}" id="contacto" aria-labelledby="contacto-titulo">
  <div class="contacto__texto">
    <p class="eti">${pagina ? 'Estaremos encantadas de atenderte' : 'No esperes más'}</p>
    <${T} class="titulo-sec" id="contacto-titulo" data-revelar>¿Lista para <em>renovarte</em>?</${T}>
    <p>Reserva tu cita hoy y descubre el tratamiento perfecto para tu bienestar. Estaremos encantadas de atenderte.</p>
    ${pagina ? `<a class="telefono-grande iman" href="tel:${sitio.tel}"><small>Llámanos para reservar tu cita</small>${sitio.telefono}</a>` : ''}
    <div class="acciones"><a class="boton boton--oro iman" href="tel:${sitio.tel}">Llamar · ${sitio.telefono}</a><a class="boton boton--linea iman" href="https://wa.me/${sitio.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
    <dl class="datos">
      <div><dt>Dirección</dt><dd><a href="${sitio.opinionesGoogle}" target="_blank" rel="noopener">${sitio.direccion.calle} · ${sitio.direccion.cp} ${sitio.direccion.ciudad} (${sitio.direccion.provincia})</a></dd></div>
      <div><dt>Correo</dt><dd><a href="mailto:${sitio.email}">${sitio.email}</a></dd></div>
      <div><dt>Redes</dt><dd><a href="${sitio.instagram}" target="_blank" rel="noopener">Instagram ${sitio.instagramUsuario}</a> · <a href="${sitio.facebook}" target="_blank" rel="noopener">Facebook</a></dd></div>
    </dl>
  </div>
  <div class="contacto__horario">
    <h3 class="titulo-peq">Horario</h3>
    ${tablaHorario()}
    <div class="mapa" data-cursor="Mapa">
      <div class="map-consent" id="mapa-consentimiento">
        <p>El mapa de Google se carga solo si lo pides. Hasta entonces, nada de cookies de terceros.</p>
        <button class="boton boton--linea boton--peq" type="button" id="mapa-boton">Ver mapa</button>
      </div>
    </div>
  </div>
</section>`;
}

/* línea de carta: nombre · puntos · duración · precio; debajo, la descripción literal */
const BONOS = /\s*\((Bonos?[^)]*)\)\s*$/;
function tablaZonas(desc) {
  const zonas = [...desc.matchAll(/([^,(]+?)\s*\((\d+)\s*€\)/g)].map(m => [m[1].replace(/^\s*(y\s+)?(Zonas?\s+)?/i, '').trim(), m[2] + '€']);
  if (zonas.length < 3) return null;
  return `<table class="zonas"><thead><tr><th scope="col">Zona</th><th scope="col">Precio</th></tr></thead><tbody>${zonas.map(([z, p]) => `<tr><th scope="row">${esc(z.charAt(0).toUpperCase() + z.slice(1))}</th><td>${precio(p)}</td></tr>`).join('')}</tbody></table>`;
}
function linea(t, { cita = true } = {}) {
  let desc = t.descripcion || '', bonos = '';
  const m = desc.match(BONOS);
  if (m) { bonos = m[1].replace(/\s*\|\s*/g, ' · '); desc = desc.replace(BONOS, ''); }
  const zonas = desc && /\(\d+\s*€\)/.test(desc) ? tablaZonas(desc) : null;
  return `<article class="linea" id="t-${slug(t.nombre)}" data-linea="${esc(t.nombre)}">
        <div class="linea__fila"><h3 class="linea__nombre">${esc(t.nombre)}</h3><span class="linea__puntos" aria-hidden="true"></span>${t.duracion ? `<span class="linea__min">${minutos(t.duracion)}</span>` : ''}${precio(t.precio)}</div>
        ${zonas ? zonas : desc ? `<p class="linea__desc">${euros(desc)}</p>` : ''}
        ${bonos ? `<p class="linea__bonos"><b>Bonos</b> ${euros(bonos)}</p>` : ''}
        ${cita ? `<a class="linea__cita" href="${waCita(t.nombre)}" target="_blank" rel="noopener">Pedir cita<span class="visualmente-oculto">: ${esc(t.nombre)}</span></a>` : ''}
      </article>`;
}
function tarjetaRitual(t, { h = 'h3' } = {}) {
  return `<article class="ritual linea" id="t-${slug(t.nombre)}" data-linea="${esc(t.nombre)}">
        <a class="ritual__foto" href="${waCita(t.nombre)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${arco(RITUALES_FOTO[t.nombre] || 'bienestar', { w: 4, h: 3, sizes: '(max-width: 760px) 80vw, 300px', cursor: 'Reservar' })}</a>
        <div class="ritual__cuerpo"><span class="ritual__min">${minutos(t.duracion)}</span><${h} class="ritual__nombre linea__nombre">${esc(t.nombre)}</${h}><p>${esc(t.descripcion)}</p>${precio(t.precio)}<a class="linea__cita" href="${waCita(t.nombre)}" target="_blank" rel="noopener">Pedir cita<span class="visualmente-oculto">: ${esc(t.nombre)}</span></a></div>
      </article>`;
}

/* iconos de línea de los seis beneficios de Indiba, dibujados a mano (48 × 48) */
const ICONOS = {
  'Reduce arrugas y líneas': ['M6 17C10 13 14 21 18 17S26 13 30 17 38 21 42 17', 'M6 31H42', 'M24 22V27'],
  'Hidratación profunda': ['M24 6C24 6 12 20 12 29A12 12 0 0 0 36 29C36 20 24 6 24 6Z', 'M18 30A6 6 0 0 0 23 36'],
  'Aumenta la elasticidad': ['M6 24H12L15 16 20 32 25 16 30 32 33 24H42', 'M6 24L10 20M6 24L10 28', 'M42 24L38 20M42 24L38 28'],
  'Redefine el óvalo facial': ['M24 6C33 6 37 13 37 21 37 31 31 40 24 42 17 40 11 31 11 21 11 13 15 6 24 6Z', 'M16 33Q24 39 32 33'],
  'Efecto lifting en ojos': ['M6 28Q22 16 38 28Q22 38 6 28Z', 'M22 24A4 4 0 1 0 22.01 24', 'M42 18V6M38 10 42 6 46 10'],
  'Reduce bolsas y ojeras': ['M8 20Q24 9 40 20Q24 30 8 20Z', 'M24 16.5A3.5 3.5 0 1 0 24.01 16.5', 'M12 32Q24 38 36 32']
};
function beneficios() {
  return `<section class="beneficios" aria-labelledby="beneficios-titulo">
  <h2 class="titulo-sec" id="beneficios-titulo" data-revelar>Beneficios <em>clínicos</em></h2>
  <ul class="beneficios__lista">${Object.entries(ICONOS).map(([n, ds]) => `<li><svg class="icono" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ds.map(d => `<path d="${d}" pathLength="1"/>`).join('')}</svg><span>${n}</span></li>`).join('')}</ul>
</section>`;
}

/* ═══════════════ INICIO ═══════════════ */
function paginaInicio() {
  const s = seo('/');
  const lema = `<p class="portada__lema" id="portada-lema" data-revelar="letras">Tu viaje hacia la <em>serenidad</em></p>`;
  const cortina = `<div class="cortina" id="cortina" aria-hidden="true">
  <div class="cortina__pano" id="cortina-pano">
    <div class="cortina__halo" id="cortina-halo"></div>
    <p class="cortina__nombre" id="cortina-nombre">MARINA SPA</p>
    <svg class="cortina__ala" id="cortina-ala" viewBox="0 0 100 20" preserveAspectRatio="none" focusable="false"><path d="M0 0H100V6C84 -1 64 2 50 19.5 36 2 16 -1 0 6Z"/></svg>
  </div>
  <div class="cortina__loto" id="cortina-loto"></div>
</div>
`;
  /* la carta de la portada: seis pestañas con sus líneas (las primeras de cada página; en spa, sin los rituales, que tienen su carril) */
  const pestanas = AREAS.map((a, i) => {
    const ls = lineasDe(a.url).filter(t => a.clave !== 'spa' || !/^Ritual/.test(t.nombre)).slice(0, 6);
    return { a, ls, i };
  });
  const rituales = cartaDe('/spa-relax-masajes-zafra').grupos.find(g => /Rituales/.test(g.grupo));
  const cinta = MOD.cinta ? `<!-- ═══ [MÓDULO CINTA] ═══ -->
<section class="cinta" id="cinta" data-modulo="cinta" aria-label="Algunos de nuestros tratamientos">
  ${[['Hidravacuum', 'Indiba ONA', 'Maderoterapia', 'Ritual Termal', 'Tratamiento Facial Dermapen', 'Envoltura de Algas', 'Ritual de Perlas', 'Presoterapia'],
     ['Ritual Polinesia', 'Masaje Antiestrés', 'Indiba Facial Pro', 'Rollation', 'Baño Sensación Océano', 'Lifting de Pestañas + Tinte', 'Ritual Ártico', 'Masaje ENERGILIFT']]
    .map((fila, i) => { fila.forEach(n => { if (!NOMBRES.has(n)) throw new Error('La cinta nombra algo que no está en la carta: ' + n); });
      return `<div class="cinta__fila" data-fila="${i ? -1 : 1}"${i ? ' aria-hidden="true"' : ''}><ul class="cinta__pista">${fila.map(n => `<li>${esc(n)}</li><li class="cinta__sep" aria-hidden="true">${lotoPeq()}</li>`).join('')}</ul></div>`; }).join('\n  ')}
  <p class="cinta__marcas">Indiba® · Mesoestetic® · Alquimia</p>
</section>
<!-- ═══ fin [MÓDULO CINTA] ═══ -->` : '';
  const reco = recorrido ? `<!-- ═══ [MÓDULO RECORRIDO] ═══ -->
<section class="recorrido" id="recorrido" data-modulo="recorrido" aria-labelledby="recorrido-titulo">
  <div class="recorrido__texto">
    <p class="eti">El centro</p>
    <h2 class="titulo-sec" id="recorrido-titulo" data-revelar>Ven a <em>conocernos</em></h2>
    <p>Marina Spa nació con una visión clara: convertirse en el centro de estética en Zafra de referencia, donde la tecnología puntera se encuentra con el trato humano más cálido.</p>
  </div>
  <div class="arco arco--video" style="--ar:9/16">
    <div class="arco__foto"><video id="tour" src="assets/video/tour.mp4" muted playsinline loop preload="none" poster="assets/fotos/porton-640.jpg" width="540" height="960" aria-label="Recorrido en vídeo por el centro"></video></div>
    ${filete(9, 16)}${filete(9, 16, 'filete filete--2')}
  </div>
  <div class="recorrido__estancias">
    <p class="visualmente-oculto" id="estancias-ayuda">Cada estancia lleva el vídeo a ese momento.</p>
    <ol class="estancias" id="estancias" aria-describedby="estancias-ayuda">
      ${recorrido.estancias.map(e => `<li><button type="button" data-t="${e.t}">${esc(e.nombre)}</button></li>`).join('\n      ')}
    </ol>
    <script type="application/json" id="recorrido-datos">${JSON.stringify(recorrido)}</script>
    <p class="recorrido__dir">Visítanos en ${sitio.direccion.calle}</p>
  </div>
</section>
<!-- ═══ fin [MÓDULO RECORRIDO] ═══ -->` : '';
  const opinion = MOD.opinion ? `<!-- ═══ [MÓDULO OPINIÓN] ═══ -->
<section class="opinion" id="opinion" data-modulo="opinion" aria-label="Opinión">
  ${lotoPeq('loto-peq opinion__loto')}
  <blockquote class="opinion__cita"><p id="opinion-texto">«El mejor centro de estética en Zafra. El trato es exquisito y los tratamientos faciales han cambiado mi piel por completo.»</p></blockquote>
  <p class="opinion__autora">Ana M.</p>
  <a class="enlace-oro" href="${sitio.opinionesGoogle}" target="_blank" rel="noopener">Ver opiniones en Google</a>
</section>
<!-- ═══ fin [MÓDULO OPINIÓN] ═══ -->` : '';

  const main = `<section class="portada" id="portada" aria-labelledby="portada-h1">
  <div class="portada__fondo">${pic('boveda-penumbra', { sizes: '100vw', eager: true, alt: '' })}</div>
  <div class="portada__velo"></div>
  <div class="portada__cuerpo">
    <div class="portada__texto">
      <h1 class="eti eti--h1" id="portada-h1">${esc(s.h1)}</h1>
      ${lema}
      <p class="portada__entrada">Rituales faciales, Indiba y bienestar con atención personalizada.</p>
      <div class="acciones"><a class="boton boton--oro iman" href="tel:${sitio.tel}">Pedir cita · ${sitio.telefono}</a><a class="boton boton--linea iman" href="#tratamientos">Tratamientos</a></div>
      <p class="abierto-ahora" id="abierto" data-abierto aria-live="polite"><i aria-hidden="true"></i><span>${sitio.direccion.calle} · Zafra</span></p>
    </div>
    <div class="ventana">
      ${bovedas()}
      <div class="ventana__halo" id="ventana-halo" aria-hidden="true"></div>
      ${arco('vela', { w: 3, h: 4.1, sizes: '(max-width: 760px) 80vw, 380px', eager: true, clase: 'arco--ventana arco--nitida', dentro: '<div class="ventana__llama" id="llama" aria-hidden="true"></div>' })}
      <canvas class="polvo" id="polvo" aria-hidden="true"></canvas>
      <div class="ventana__loto">${lotoSvg({ clase: 'loto loto--encendido', id: 'portada-loto' })}</div>
      <p class="ventana__pie">${sitio.direccion.calle} · Zafra</p>
    </div>
  </div>
  <script type="application/json" id="horario-datos">${datosHorario()}</script>
</section>

<section class="cifras" id="cifras" aria-label="Marina Spa en cifras">
  <p><b><span data-contar="10">+10</span></b><span>años cuidando de ti</span></p>
  <p><b>Indiba®</b><span>y Mesoestetic®, centro certificado</span></p>
  <p><b><span data-contar="300">+300</span></b><span>clientas satisfechas</span></p>
</section>

<section class="filosofia" id="filosofia" aria-labelledby="filosofia-eti">
  ${lotoPeq('loto-peq filosofia__loto')}
  <h2 class="eti" id="filosofia-eti">Filosofía Marina Spa</h2>
  <p class="filosofia__frase" id="filosofia-frase">El bienestar no es un lujo, sino una <em>necesidad</em>.</p>
  <p class="filosofia__texto">Cada tratamiento cuenta una historia, y nosotros estamos aquí para escucharla y mejorarla. Fusionamos la cosmética de alta gama con la tecnología más avanzada, como <a href="indiba-zafra">Indiba</a>, en un entorno diseñado para la calma absoluta.</p>
</section>

<section class="tratamientos" id="tratamientos" aria-labelledby="tratamientos-titulo">
  <div class="tratamientos__cab">
    <h2 class="titulo-sec" id="tratamientos-titulo" data-revelar>Tratamientos</h2>
    <p>Experiencias de belleza y bienestar diseñadas para cada necesidad.</p>
  </div>
  ${buscador()}
  <ul class="arcos">
    ${AREAS.map(a => `<li><a class="ar" href="${enlace(a.url)}">${arco(a.foto, { cursor: 'Abrir' })}<span class="ar__eti">${esc(a.eti)}</span><span class="ar__nombre">${a.nombre}</span><span class="ar__desde">desde ${precio(a.desde + '€')}</span></a></li>`).join('\n    ')}
  </ul>
</section>

${cinta}

${reco}

<section class="carta" id="carta" aria-labelledby="carta-titulo">
  <div class="carta__foto">
    <div class="arco arco--carta" style="--ar:3/4">
      <div class="arco__foto">${pestanas.map(({ a, i }) => `<div class="carta__img${i === 0 ? ' es-activa' : ''}" data-area="${a.clave}">${pic(a.foto, { sizes: '(max-width: 760px) 90vw, 360px' })}</div>`).join('')}</div>
      ${filete(3, 4)}
    </div>
  </div>
  <div class="carta__cuerpo">
    <h2 class="eti eti--oscura" id="carta-titulo">La carta</h2>
    <div class="pestanas" role="tablist" id="carta-pestanas" aria-labelledby="carta-titulo">
      ${pestanas.map(({ a, i }) => `<button type="button" role="tab" id="pest-${a.clave}" aria-controls="panel-${a.clave}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-area="${a.clave}">${a.corto}</button>`).join('')}
    </div>
    ${pestanas.map(({ a, ls, i }) => `<div class="panel" role="tabpanel" id="panel-${a.clave}" aria-labelledby="pest-${a.clave}" tabindex="0"${i === 0 ? '' : ' data-oculto'}>
      <h3 class="panel__titulo">${a.nombre}</h3>
      <p class="panel__entrada">${esc(cartaDe(a.url).subtitulo.replace(/ Láser, Cera y Hilo/, ' Fotodepilación, Cera y Hilo'))}</p>
      <ul class="panel__lineas">${ls.map(t => `<li class="linea linea--corta"><div class="linea__fila"><span class="linea__nombre">${esc(t.nombre)}</span><span class="linea__puntos" aria-hidden="true"></span>${t.duracion ? `<span class="linea__min">${minutos(t.duracion)}</span>` : ''}${precio(t.precio)}</div></li>`).join('')}</ul>
      <a class="ver-todo" href="${enlace(a.url)}">Ver toda la carta de ${a.corto.toLowerCase()}</a>
    </div>`).join('\n    ')}
  </div>
</section>

<section class="rituales" id="rituales" aria-labelledby="rituales-titulo">
  <div class="rituales__cab">
    <h2 class="titulo-sec" id="rituales-titulo" data-revelar>Rituales de <em>bienestar</em></h2>
    <p>${esc(rituales.entradilla)}</p>
  </div>
  <div class="carril" id="carril" role="group" aria-label="Rituales de bienestar, 100 minutos">
    ${rituales.tratamientos.map(t => tarjetaRitual(t)).join('\n    ').replace(/ id="t-[^"]+"/g, '')}
  </div>
  <a class="ver-todo ver-todo--claro" href="spa-relax-masajes-zafra">Ver spa y masajes</a>
</section>

${opinion}

${bloqueContacto()}`;
  return documento({
    url: '/', s, ld: ldInicio(), clase: 'pagina-inicio', cortina: true,
    modulos: ['cinta', 'recorrido', 'opinion'].filter(m => MOD[m]),
    precarga: `<link rel="preload" as="image" href="assets/fotos/boveda-penumbra-1280.jpg" imagesrcset="assets/fotos/boveda-penumbra-640.avif 640w, assets/fotos/boveda-penumbra-1280.avif 1280w" imagesizes="100vw" type="image/avif" fetchpriority="high">\n`,
    cuerpo: { cortina, main }
  });
}

/* ───────── en cabina: sesión de fotos y vídeo de octubre de 2026 ─────────
   Un cinemagraph en bucle (mudo, solo a la vista), tres fotos y el vídeo de cada tratamiento.
   Depilación y estética no tienen sesión todavía: sin bloque. */
const CABINA = {
  faciales: { bucle: 'bucle-faciales', fotos: ['dermapen-rostro', 'dermapen-bandeja', 'ritual-oro'], reels: [['reel-dermapen', 'Dermapen'], ['reel-ritual-oro', 'Ritual de oro']] },
  indiba: { bucle: 'bucle-indiba', fotos: ['indiba-rostro', 'indiba-ona', 'ona-cabezal'], reels: [['reel-indiba-facial', 'Indiba facial'], ['reel-indiba-ona', 'Indiba ONA']] },
  corporales: { bucle: 'bucle-corporales', fotos: ['corporal-abdomen', 'corporal-crema', 'corporal-electrodo'], reels: [['reel-indiba-corporal', 'Indiba corporal']] },
  spa: { bucle: 'bucle-spa', fotos: ['pareja-espalda', 'masaje-espalda', 'aceite'], reels: [['reel-pareja', 'Masaje en pareja'], ['reel-ritual-oro', 'Ritual de oro']] }
};
function enCabina(a) {
  const c = CABINA[a.clave];
  if (!c) return '';
  const video = (id, attrs) => `<div class="arco arco--video" style="--ar:9/16"${attrs.includes('controls') ? ' data-cursor="▶"' : ''}><div class="arco__foto"><video ${attrs} src="assets/video/${id}.mp4" poster="assets/video/${id}.jpg" playsinline preload="none" width="720" height="1280"></video></div>${filete(9, 16)}</div>`;
  return `<section class="cabina-sec" aria-labelledby="cabina-titulo">
  <div class="cabina-sec__cab">
    <p class="eti">En cabina</p>
    <h2 class="titulo-sec" id="cabina-titulo" data-revelar>Así se vive <em>en Marina Spa</em></h2>
  </div>
  <div class="cabina-sec__rejilla">
    <div class="cabina-sec__bucle">${video(c.bucle, 'class="bucle" muted loop aria-hidden="true" tabindex="-1"')}</div>
    ${c.fotos.map(id => arco(id, { w: 3, h: 4.6, sizes: '(max-width: 760px) 62vw, 22vw', ampliar: a.nombre })).join('\n    ')}
  </div>
  <div class="cabina-sec__reels">
    ${c.reels.map(([id, nombre]) => `<figure class="cabina-sec__reel">${video(id, `controls aria-label="Vídeo del tratamiento: ${nombre}"`)}<figcaption>${nombre}</figcaption></figure>`).join('\n    ')}
  </div>
</section>`;
}

/* ═══════════════ TRATAMIENTOS (una plantilla, seis páginas) ═══════════════ */
function paginaArea(a) {
  const s = seo(a.url);
  const c = cartaDe(a.url);
  const subtitulo = c.subtitulo.replace(/: Láser, Cera y Hilo$/, ': Fotodepilación, Cera y Hilo');
  const grupos = c.grupos.filter(g => !(a.clave === 'spa' && /Rituales/.test(g.grupo)));
  const rit = a.clave === 'spa' ? c.grupos.find(g => /Rituales/.test(g.grupo)) : null;
  const todos = a.clave === 'spa' ? [grupos[0], grupos[1], grupos[2], rit, grupos[3]] : grupos;
  const varios = todos.length > 1;
  const htmlGrupo = g => {
    const esRit = rit && g === rit;
    return `<section class="grupo${esRit ? ' grupo--rituales' : ''}" id="g-${slug(g.grupo)}" aria-labelledby="g-${slug(g.grupo)}-t">
      <h2 class="grupo__titulo" id="g-${slug(g.grupo)}-t">${esc(g.grupo)}</h2>
      ${g.entradilla ? `<p class="grupo__entrada">${euros(g.entradilla)}</p>` : ''}
      ${esRit ? `<div class="rituales-rejilla">${g.tratamientos.map(t => tarjetaRitual(t)).join('\n      ')}</div>` : g.tratamientos.map(t => linea(t)).join('\n      ')}
      ${a.clave === 'indiba' ? `<a class="linea linea--enlace" href="tratamientos-corporales-zafra#t-indiba-corporal"><span class="linea__fila"><span class="linea__nombre">Indiba Corporal</span><span class="linea__puntos" aria-hidden="true"></span>${precio('60€/sesión')}</span><span class="linea__desc">En tratamientos corporales →</span></a>` : ''}
    </section>`;
  };
  const indice = varios ? `<nav class="indice" id="indice" aria-label="Grupos de la carta">
      <p class="indice__titulo">En esta página</p>
      <ol>${todos.map(g => `<li><a href="#g-${slug(g.grupo)}">${esc(g.grupo)}</a></li>`).join('')}</ol>
    </nav>` : '';
  const proionic = a.clave === 'indiba' ? `<section class="proionic" aria-labelledby="proionic-titulo">
    <p class="eti eti--oscura">Ciencia &amp; belleza</p>
    <h2 class="titulo-sec" id="proionic-titulo" data-revelar>El sistema <em>Proionic®</em></h2>
    <p>Estimula el intercambio iónico intra y extracelular restableciendo la actividad eléctrica celular fisiológica. El resultado es una piel revitalizada con aumento visible de colágeno y elastina. Descubre más sobre la tecnología en la <a href="https://www.indiba.com/es/" target="_blank" rel="noopener">web oficial de Indiba®</a>.</p>
  </section>` : '';
  const party = a.clave === 'estetica' && beauty ? `<!-- ═══ [MÓDULO BEAUTY PARTY] ═══ -->
  <section class="beauty-party" id="beauty-party" data-modulo="beauty-party" aria-labelledby="party-titulo">
    <div class="beauty-party__texto">
      <p class="eti">${esc(beauty.titulo)}</p>
      <h2 class="titulo-sec" id="party-titulo" data-revelar>${esc(beauty.lema.replace(/diferente$/, ''))}<em>diferente</em></h2>
      <p class="beauty-party__precio">${precio(beauty.precio)} <span>${esc(beauty.porPersona)} · de ${beauty.minimo} a ${beauty.maximo} personas</span></p>
      <p>${esc(beauty.entradilla)}</p>
    </div>
    <div class="beauty-party__incluye">
      <h3 class="titulo-peq">Incluye</h3>
      <ul>${beauty.incluye.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <a class="boton boton--oro iman" href="${WA(encodeURIComponent(beauty.mensaje).replace(/%2C/g, ','))}" target="_blank" rel="noopener">${esc(beauty.boton)}</a>
    </div>
  </section>
  <!-- ═══ fin [MÓDULO BEAUTY PARTY] ═══ -->` : '';
  const main = `<section class="cab-pagina" aria-labelledby="cab-h1">
  <div class="cab-pagina__texto">
    <nav class="migas" aria-label="Migas"><ol><li><a href="./">Inicio</a></li><li><a href="./#tratamientos">Tratamientos</a></li><li aria-current="page">${a.nombre}</li></ol></nav>
    <h1 class="cab-pagina__h1" id="cab-h1" data-revelar>${esc(s.h1)}</h1>
    <p class="cab-pagina__sub">${esc(subtitulo)}</p>
    <div class="acciones"><a class="boton boton--oro iman" href="tel:${sitio.tel}">Pedir cita · ${sitio.telefono}</a><a class="boton boton--linea iman" href="https://wa.me/${sitio.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
  </div>
  <div class="cab-pagina__arco">${arco(a.foto, { w: 3, h: 4.2, sizes: '(max-width: 760px) 70vw, 320px', eager: true, clase: 'arco--nitida', extra: `<span class="cab-pagina__loto">${lotoPeq()}</span>` })}</div>
</section>
${proionic}
<section class="carta-pagina${varios ? ' carta-pagina--indice' : ''}" aria-label="Carta de ${esc(a.nombre.toLowerCase())}">
  ${indice}
  <div class="carta-pagina__grupos">
    ${todos.map(htmlGrupo).join('\n    ')}
  </div>
</section>
${enCabina(a)}
${a.clave === 'indiba' ? beneficios() : ''}
${party}
${cierreCita()}
${otros(a.url)}`;
  return documento({ url: a.url, s, ld: ldArea(a, s), clase: 'pagina-area pagina-' + a.clave, modulos: party ? ['beauty-party'] : [], cuerpo: { main } });
}

/* ═══════════════ EL CENTRO ═══════════════ */
function paginaCentro() {
  const url = '/centro-estetica-zafra', s = seo(url);
  const tarjetas = [
    ['porton', 'Nuestra esencia', 'Historia y misión', ['Marina Spa nació con una visión clara: convertirse en el centro de estética en Zafra de referencia, donde la tecnología puntera se encuentra con el trato humano más cálido.', 'Entendemos la belleza como una consecuencia de la salud y el bienestar. Por ello, cada protocolo, desde un tratamiento facial hasta nuestros <a href="indiba-zafra">tratamientos Indiba en Zafra</a>, está diseñado para ofrecer resultados visibles respetando la biología de tu piel.'], ''],
    ['vela', 'Experiencia', 'Más de 10 años', ['Más de 10 años cuidando de ti.'], '+10'],
    ['cabina', 'Tecnología', 'Centro certificado Indiba® y Mesoestetic®', ['Centro certificado Indiba® y Mesoestetic®.'], ''],
    ['equipo', 'Profesionales', 'Nuestro equipo certificado', ['Detrás de Marina Spa hay un equipo de esteticistas apasionadas y en constante formación. Especialistas en diagnóstico facial, remodelación corporal y técnicas de masaje, nuestro objetivo es personalizar cada visita para que te sientas única.'], '']
  ];
  const main = `<section class="cab-pagina cab-pagina--centro" aria-labelledby="cab-h1">
  <div class="cab-pagina__texto">
    <nav class="migas" aria-label="Migas"><ol><li><a href="./">Inicio</a></li><li aria-current="page">El centro</li></ol></nav>
    <h1 class="cab-pagina__h1" id="cab-h1" data-revelar>Donde la belleza se convierte en <em>bienestar</em></h1>
    <p class="cab-pagina__sub">Tu centro de estética en Zafra</p>
  </div>
  <div class="cab-pagina__arco">${arco('porton', { w: 3, h: 4.2, sizes: '(max-width: 760px) 70vw, 320px', eager: true, clase: 'arco--nitida', extra: `<span class="cab-pagina__loto">${lotoPeq()}</span>` })}</div>
</section>
<section class="pila-sec" aria-label="Quiénes somos">
  <ol class="pila" id="pila">
    ${tarjetas.map(([foto, eti, tit, ps, grande], i) => `<li class="pila__item" style="--i:${i + 1}"><article class="tarjeta">
      <div class="tarjeta__arco">${arco(foto, { w: 3, h: 4, sizes: '(max-width: 760px) 80vw, 320px', ampliar: tit })}</div>
      <div class="tarjeta__texto"><p class="tarjeta__num">0${i + 1} <span>/ 04</span></p><p class="eti eti--oscura">${eti}</p><h2 class="tarjeta__titulo">${tit}</h2>${grande ? `<p class="tarjeta__grande" aria-hidden="true">${grande}</p>` : ''}${ps.map(p => `<p>${p}</p>`).join('')}</div>
    </article></li>`).join('\n    ')}
  </ol>
</section>
<section class="tour" aria-labelledby="tour-titulo">
  <div class="tour__texto">
    <p class="eti">Vídeo tour</p>
    <h2 class="titulo-sec" id="tour-titulo" data-revelar>Visítanos en <em>C. Reyes Huertas, 8</em></h2>
  </div>
  <div class="arco arco--video" style="--ar:9/16" data-cursor="▶">
    <div class="arco__foto"><video src="assets/video/tour.mp4" controls playsinline preload="none" poster="assets/fotos/porton-640.jpg" width="540" height="960" aria-label="Recorrido en vídeo por el centro"></video></div>
    ${filete(9, 16)}${filete(9, 16, 'filete filete--2')}
  </div>
</section>
<section class="porque" aria-labelledby="porque-titulo">
  ${lotoPeq('loto-peq porque__loto')}
  <h2 class="eti eti--oscura" id="porque-titulo">Por qué elegirnos</h2>
  <p class="porque__texto">¿Por qué elegirnos como tu centro de belleza en Zafra? Porque combinamos la eficacia clínica de equipos como Indiba con la sensorialidad de la alta cosmética profesional.</p>
</section>
${cierreCita()}`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'AboutPage', '@id': dominio + url + '#about', url: dominio + url, name: s.title, description: s.description, mainEntity: { '@type': 'DaySpa', '@id': ID, name: 'Marina Spa' } }, migasLd(url, 'El centro')];
  return documento({ url, s, ld, clase: 'pagina-centro', cuerpo: { main } });
}

/* ═══════════════ CONTACTO ═══════════════ */
function paginaContacto() {
  const url = '/contacto', s = seo(url);
  const main = `<section class="cab-pagina cab-pagina--corta" aria-labelledby="cab-h1">
  <div class="cab-pagina__texto">
    <nav class="migas" aria-label="Migas"><ol><li><a href="./">Inicio</a></li><li aria-current="page">Contacto</li></ol></nav>
    <h1 class="cab-pagina__h1" id="cab-h1" data-revelar>${esc(s.h1)}</h1>
  </div>
</section>
${bloqueContacto({ pagina: true })}
<script type="application/json" id="horario-datos">${datosHorario()}</script>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'ContactPage', '@id': dominio + url + '#contact', url: dominio + url, name: 'Contacto y reservas Marina Spa', description: s.description, mainEntity: { '@type': 'DaySpa', '@id': ID, name: 'Marina Spa', telephone: sitio.tel, email: sitio.email } }, migasLd(url, 'Contacto')];
  return documento({ url, s, ld, clase: 'pagina-contacto', cuerpo: { main } });
}

/* ═══════════════ LEGALES ═══════════════ */
const P = t => `<p>${t}</p>`;
const L = xs => `<ul>${xs.map(x => `<li>${x}</li>`).join('')}</ul>`;
const LEGAL = {
  '/aviso-legal': [
    '<h2>1. Datos identificativos</h2>',
    P('En cumplimiento del deber de información establecido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa de los siguientes datos:'),
    P('El titular del presente sitio web es Marina Spa (en adelante, Marina Spa), con domicilio social en C. Reyes Huertas, 8, 06300 Zafra, Badajoz, y correo electrónico de contacto <a href="mailto:info@marinaspa.es">info@marinaspa.es</a>.'),
    L(['Titular (nombre o razón social): <span class="pendiente">[PENDIENTE]</span>', 'NIF: <span class="pendiente">[PENDIENTE]</span>', 'Domicilio: C. Reyes Huertas, 8, 06300 Zafra, Badajoz', 'Teléfono: 644 79 90 00', 'Correo: info@marinaspa.es']),
    '<h2>2. Usuarios</h2>',
    P('El acceso y/o uso de este sitio web atribuye la condición de USUARIO, quien acepta, desde dicho acceso y/o uso, las presentes condiciones de uso, así como aquellas otras que pudieran resultar de aplicación.'),
    '<h2>3. Uso del sitio web</h2>',
    P('El sitio web proporciona el acceso a información, servicios, contenidos y datos (en adelante, los contenidos) propiedad de Marina Spa.'),
    P('El USUARIO se compromete a hacer un uso adecuado de los contenidos y servicios que Marina Spa ofrece a través de su sitio web y, con carácter enunciativo pero no limitativo, a no emplearlos para:'),
    L(['Realizar actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.', 'Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico-ilegal, de apología del terrorismo o atentatorio contra los derechos humanos.', 'Provocar daños en los sistemas físicos y lógicos de Marina Spa, de sus proveedores o de terceras personas.']),
    P('Marina Spa se reserva el derecho de retirar todos aquellos comentarios y aportaciones que vulneren el respeto a la dignidad de la persona o que, a su juicio, no resulten adecuados para su publicación.'),
    '<h2>4. Propiedad intelectual e industrial</h2>',
    P('Marina Spa, por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial del sitio web, así como de los elementos contenidos en el mismo, a título enunciativo: imágenes, textos, sonido, audio, vídeo, software, marcas, logotipos, combinaciones de colores, estructura y diseño, y selección de materiales.'),
    P('Todos los derechos están reservados. En virtud de lo dispuesto en los artículos 8 y 32.1, párrafo segundo, de la Ley de Propiedad Intelectual, queda expresamente prohibida la reproducción, distribución y comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de este sitio web con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización previa y expresa de Marina Spa.'),
    '<h2>5. Responsabilidad</h2>',
    P('Marina Spa no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de errores u omisiones en los contenidos, falta de disponibilidad del sitio web o la transmisión de virus o programas maliciosos, pese a haber adoptado todas las medidas tecnológicas necesarias para evitarlo.'),
    '<h2>6. Legislación aplicable y jurisdicción</h2>',
    P('La relación entre Marina Spa y el USUARIO se regirá por la normativa española vigente. Cualquier controversia se someterá a los Juzgados y Tribunales que correspondan conforme a derecho.')
  ],
  '/politica-privacidad': [
    P('En Marina Spa nos tomamos muy en serio la protección de su privacidad y de sus datos personales. La presente Política de Privacidad describe cómo recogemos, utilizamos y protegemos la información personal que nos facilita a través de este sitio web.'),
    '<h2>1. Responsable del tratamiento</h2>',
    L(['Identidad: Marina Spa · titular <span class="pendiente">[PENDIENTE]</span> · NIF <span class="pendiente">[PENDIENTE]</span>', 'Dirección postal: C. Reyes Huertas, 8, 06300 Zafra, Badajoz', 'Correo electrónico: <a href="mailto:info@marinaspa.es">info@marinaspa.es</a>']),
    '<h2>2. Finalidad del tratamiento de los datos</h2>',
    P('En Marina Spa tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:'),
    L(['Atender las solicitudes de información realizadas a través del sitio web.', 'Gestionar citas, reservas y servicios solicitados.', 'Enviar comunicaciones relacionadas con nuestros servicios, promociones u ofertas, siempre que exista consentimiento previo.', 'Gestionar la relación comercial y administrativa con los clientes.']),
    P('Esta web no tiene formularios: las citas se piden por teléfono o por WhatsApp, y los datos que nos dé por esas vías se tratan con las finalidades anteriores.'),
    '<h2>3. Legitimación para el tratamiento</h2>',
    P('La base legal para el tratamiento de sus datos es:'),
    L(['El consentimiento del interesado.', 'La ejecución de un contrato o la aplicación de medidas precontractuales cuando solicita una cita o servicio.']),
    P('La retirada del consentimiento no afectará a la licitud de los tratamientos realizados con anterioridad.'),
    '<h2>4. Conservación de los datos</h2>',
    P('Los datos personales se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recabaron y, posteriormente, durante los plazos legalmente exigidos para el cumplimiento de obligaciones legales.'),
    '<h2>5. Destinatarios de los datos</h2>',
    P('Los datos personales no se cederán a terceros, salvo obligación legal o cuando sea necesario para la correcta prestación del servicio (por ejemplo, proveedores tecnológicos que actúan como encargados del tratamiento).'),
    '<h2>6. Derechos de los interesados</h2>',
    P('Cualquier persona tiene derecho a obtener confirmación sobre si en Marina Spa estamos tratando datos personales que le conciernan.'),
    P('Las personas interesadas tienen derecho a:'),
    L(['Acceder a sus datos personales.', 'Solicitar la rectificación de los datos inexactos.', 'Solicitar la supresión de sus datos cuando, entre otros motivos, ya no sean necesarios para los fines que fueron recogidos.', 'Solicitar la limitación del tratamiento de sus datos.', 'Oponerse al tratamiento de sus datos.', 'Solicitar la portabilidad de sus datos.']),
    P('Para ejercer estos derechos, el usuario puede enviar una solicitud por escrito a <a href="mailto:info@marinaspa.es">info@marinaspa.es</a>, indicando el derecho que desea ejercer y adjuntando copia de un documento identificativo.'),
    P('Asimismo, el interesado tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a>) si considera que el tratamiento de sus datos no se ajusta a la normativa vigente.'),
    '<h2>7. Seguridad de los datos</h2>',
    P('Marina Spa adopta las medidas técnicas y organizativas necesarias para garantizar la seguridad e integridad de los datos personales, evitando su alteración, pérdida, tratamiento o acceso no autorizado.'),
    '<h2>8. Decisiones automatizadas</h2>',
    P('Marina Spa no realiza decisiones automatizadas, incluida la elaboración de perfiles, basadas en los datos personales facilitados.'),
    '<h2>9. Cambios en la política de privacidad</h2>',
    P('Marina Spa se reserva el derecho a modificar la presente Política de Privacidad para adaptarla a novedades legislativas o jurisprudenciales. En dichos casos, se anunciarán los cambios en esta página.')
  ],
  '/politica-cookies': [
    P('Marina Spa informa a los usuarios de su sitio web sobre el uso de cookies.'),
    '<h2>¿Qué son las cookies?</h2>',
    P('Las cookies son pequeños archivos que se descargan en el dispositivo del usuario al acceder a determinadas páginas web. Permiten, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.'),
    '<h2>Cookies y almacenamiento que usa esta web</h2>',
    P('Esta web <strong>no usa cookies de analítica ni de publicidad</strong>. Para funcionar guarda en su navegador solo lo siguiente, que no sale de su dispositivo:'),
    `<table class="tabla-legal"><thead><tr><th scope="col">Nombre</th><th scope="col">Dónde</th><th scope="col">Para qué</th><th scope="col">Duración</th></tr></thead><tbody>
<tr><td>ms-cookies</td><td>localStorage</td><td>Recordar que ha visto este aviso, para no volver a enseñárselo.</td><td>Hasta que borre los datos del sitio</td></tr>
<tr><td>ms-visita</td><td>sessionStorage</td><td>Que la animación de entrada salga solo en la primera página de la visita.</td><td>Hasta cerrar la pestaña</td></tr>
<tr><td>ms-loto</td><td>sessionStorage</td><td>Que el logo de la portada se forme una sola vez por visita.</td><td>Hasta cerrar la pestaña</td></tr>
<!-- [MANDO DE MAQUETA] fila de la versión de la maqueta: la quita scripts/quitar-mando.mjs -->
<tr><td>ms-densidad</td><td>localStorage</td><td>Solo en la vista previa con ?revision: qué versión de la maqueta se está viendo.</td><td>Hasta que borre los datos del sitio</td></tr>
</tbody></table>`,
    '<h2>Cookies de terceros</h2>',
    P('El mapa de Google Maps de la página de contacto <strong>no se carga hasta que usted pulsa «Ver mapa»</strong>. A partir de ese momento, Google puede instalar sus propias cookies conforme a su <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener">política de privacidad</a>. Si no lo pulsa, no se conecta con Google.'),
    P('Los enlaces a Instagram, Facebook, WhatsApp e Indiba® llevan a esos sitios, que tienen sus propias políticas.'),
    '<h2>Gestión de cookies</h2>',
    P('El usuario puede permitir, bloquear o eliminar las cookies instaladas en su dispositivo mediante la configuración de las opciones del navegador que utilice. A continuación se indican los enlaces a la configuración de los principales navegadores:'),
    L(['<a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener">Google Chrome</a>', '<a href="https://www.firefox.com/es-ES/privacy/websites/cookie-settings/" target="_blank" rel="noopener">Mozilla Firefox</a>', '<a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a>', '<a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a>']),
    '<h2>Aceptación de la política de cookies</h2>',
    P('Al acceder a este sitio web, el usuario es informado mediante un aviso de que no se usan cookies de analítica y de cómo funciona el mapa. Puede volver a ver ese aviso desde el pie de cualquier página («Aviso de cookies»).'),
    '<h2>Cambios en la política de cookies</h2>',
    P('Marina Spa se reserva el derecho a modificar la presente Política de Cookies para adaptarla a cambios legislativos o técnicos. Cualquier modificación será debidamente publicada en esta página.')
  ]
};
function paginaLegal(url) {
  const s = seo(url);
  const nombre = s.h1;
  const main = `<section class="cab-pagina cab-pagina--corta" aria-labelledby="cab-h1">
  <div class="cab-pagina__texto">
    <nav class="migas" aria-label="Migas"><ol><li><a href="./">Inicio</a></li><li aria-current="page">${esc(nombre)}</li></ol></nav>
    <h1 class="cab-pagina__h1" id="cab-h1">${esc(nombre)}</h1>
    <p class="cab-pagina__sub">Última actualización: ${sitio.actualizadoLegal}</p>
  </div>
</section>
<article class="legal">
  ${LEGAL[url].join('\n  ')}
</article>`;
  return documento({ url, s, ld: [migasLd(url, nombre)], clase: 'pagina-legal', cuerpo: { main } });
}

/* ═══════════════ 404 ═══════════════ */
function pagina404() {
  const s = { title: 'Esta página no existe | Marina Spa', description: 'La página que buscas no existe. Vuelve al inicio de Marina Spa, centro de estética en Zafra.', h1: 'Esta página no existe' };
  const main = `<section class="portada portada--404" aria-labelledby="h1-404">
  <div class="portada__fondo">${pic('boveda-penumbra', { sizes: '100vw', eager: true, alt: '' })}</div>
  <div class="portada__velo"></div>
  <div class="no-existe">
    ${lotoSvg({ clase: 'loto loto--encendido no-existe__loto' })}
    <h1 class="titulo-sec" id="h1-404">Esta página <em>no existe</em></h1>
    <p>Puede que el enlace sea antiguo. Las seis áreas de la carta siguen aquí:</p>
    <ul class="arcos arcos--404">
      ${AREAS.map(a => `<li><a class="ar ar--peq" href="${enlace(a.url)}">${arco(a.foto, { cursor: 'Abrir', w: 3, h: 4, sizes: '(max-width: 760px) 30vw, 12vw' })}<span class="ar__nombre">${a.nombre}</span></a></li>`).join('\n      ')}
    </ul>
    <p><a class="boton boton--oro" href="./">Volver al inicio</a></p>
  </div>
</section>`;
  return documento({ url: '/404', s, clase: 'pagina-404', cuerpo: { main }, es404: true });
}

/* ═══════════════ estáticos ═══════════════ */
const URLS = paginas.map(p => p.url);
function sitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(u => `  <url><loc>${dominio}${u}</loc></url>`).join('\n')}
</urlset>
`;
}
const robots = `User-agent: *
Allow: /

Sitemap: ${dominio}/sitemap.xml
`;
const manifest = JSON.stringify({
  name: 'Marina Spa · Centro de estética en Zafra', short_name: 'Marina Spa', lang: 'es', start_url: './', display: 'standalone',
  background_color: '#1C1917', theme_color: '#1C1917',
  icons: [
    { src: 'assets/marca/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    { src: 'assets/marca/icono-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/marca/icono-512.png', sizes: '512x512', type: 'image/png' }
  ]
}, null, 1) + '\n';
const VIEJAS = { 'quienes-somos': 'centro-estetica-zafra', indiba: 'indiba-zafra', depilacion: 'depilacion-fotodepilacion-zafra', 'rituales-faciales': 'tratamientos-faciales-zafra', corporales: 'tratamientos-corporales-zafra', spa: 'spa-relax-masajes-zafra', 'estetica-general': 'estetica-general-zafra' };
const htaccess = `# Marina Spa · IONOS (Apache). Lo escribe scripts/construir.mjs.
# Mismas URL que hoy: sin .html y sin barra final.
Options -MultiViews
RewriteEngine On
DirectorySlash Off

# 1 · rutas viejas de su JSON-LD → las buenas (301)
${Object.entries(VIEJAS).map(([v, b]) => `RewriteRule ^${v.replace(/-/g, '\\-')}/?$ /${b} [R=301,L]`).join('\n')}

# 2 · /x.html → /x (301), sin tocar las peticiones internas
RewriteCond %{THE_REQUEST} \\s/+([^?\\s]*?)\\.html[\\s?] [NC]
RewriteRule ^ /%1 [R=301,L,NE]
RewriteRule ^index$ / [R=301,L]

# 3 · /x/ → /x (301)
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.+)/$ /$1 [R=301,L]

# 4 · /x → x.html (interno)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^([^.]+)$ /$1.html [L]

ErrorDocument 404 /404.html

<IfModule mod_headers.c>
  <FilesMatch "\\.(css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(woff2|avif|webp|jpg|png|svg|mp4)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>
`;

/* ═══════════════ escribir ═══════════════ */
const salidas = new Map();
salidas.set('index.html', paginaInicio());
AREAS.forEach(a => salidas.set(archivo(a.url), paginaArea(a)));
salidas.set('centro-estetica-zafra.html', paginaCentro());
salidas.set('contacto.html', paginaContacto());
['/aviso-legal', '/politica-privacidad', '/politica-cookies'].forEach(u => salidas.set(archivo(u), paginaLegal(u)));
salidas.set('404.html', pagina404());
salidas.set('sitemap.xml', sitemap());
salidas.set('robots.txt', robots);
salidas.set('manifest.json', manifest);
salidas.set('.htaccess', htaccess);

/* módulos quitados: tampoco se cargan sus hojas ni scripts */
const versiones = huellas(raiz);
const comprobar = process.argv.includes('--comprobar');
let distintos = 0;
for (const [nombre, contenido0] of salidas) {
  const contenido = nombre.endsWith('.html') ? versionarHtml(contenido0, versiones) : contenido0;
  const ruta = path.join(raiz, nombre);
  const antes = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null;
  if (antes === contenido) continue;
  distintos++;
  if (comprobar) { console.log('no está al día: ' + nombre); continue; }
  fs.writeFileSync(ruta, contenido);
  console.log('escrito ' + nombre);
}
const total = carta.paginas.reduce((a, p) => a + p.grupos.reduce((b, g) => b + g.tratamientos.length, 0), 0);
if (comprobar) { console.log(distintos ? 'El HTML NO está al día: node scripts/construir.mjs' : 'Todo al día con los datos'); process.exitCode = distintos ? 1 : 0; }
else console.log((distintos ? distintos + ' archivos escritos' : 'sin cambios') + ' · ' + salidas.size + ' archivos · ' + total + ' líneas de carta · módulos: ' + Object.entries(MOD).filter(([, v]) => v).map(([k]) => k).join(', '));
