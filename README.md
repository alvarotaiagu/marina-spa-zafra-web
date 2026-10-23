# Marina Spa · «Bóveda»

Web nueva de **Marina Spa**, centro de estética en C. Reyes Huertas, 8 · 06300 Zafra (Badajoz).
Sustituye a la de hoy (marinaspa.es, Vite + React en IONOS) **conservando las 12 URL, sus
`<title>`, descriptions y h1**. Está en local, sin publicar, y con `noindex, nofollow` en
todas las páginas mientras sea vista previa.

Todo el contenido sale de su web (rastreo del 2026-10-10, en
`../marina-spa-zafra-bocetos/`). Lo que falta va como `[PENDIENTE]` (ver «Pendientes para
la clienta»).

```
node scripts/servir.mjs              → http://127.0.0.1:4261   (rutas sin extensión, como Pages)
http://127.0.0.1:4261/?revision      → con el mando de las dos versiones (solo para la reunión)
node scripts/verificar.mjs           → todas las comprobaciones (añade --capturas para screenshots/)
```

## El concepto: «Bóveda»

El centro está bajo **bóvedas de ladrillo de medio punto**, con un portón claveteado, velas y
penumbra cálida, y su marca es un **loto dorado de línea fina**. La web es entrar ahí:

- **oscura y cálida** donde se siente (portada, recorrido, rituales, contacto) y **clara**
  donde se lee (filosofía, tratamientos, carta), como su web de hoy, que alterna piedra oscura
  y blanco roto;
- las fotos van en **arcos de medio punto** con un filete dorado fino, que **se traza** al
  entrar mientras la foto pasa de desenfocada a nítida con un leve zoom;
- el **loto es la luz**: se dibuja una vez, en la cortina, se enciende y vuela al arco de la
  portada, donde se queda encendido con un halo y el polvo dorado de la vela.

Todo sale de lo que ya es suyo: el local, el logo, sus colores (stone de Tailwind + su dorado
`#D4AF37` y el `#F0C868` del logo), sus letras (Cormorant Garamond y Lato) y sus textos.

### Recursos de movimiento (PLIEGO §2) y de dónde sale cada uno

| Recurso | Dónde | De qué parte del concepto sale |
|---|---|---|
| **Cortina con el logo que se dibuja, se enciende y vuela** | portada, 1.ª página de la visita | el loto de su marca es la luz que se enciende al entrar bajo la bóveda |
| **Sin cortina, el loto florece** en el arco (capullo, pétalo central, laterales que se abren desde el centro por parejas, hojas y el de abajo; luego se enciende) | portada, la 1.ª vez en la visita sin cortina | el loto de su marca: si no lo formó la cortina, se abre en la portada |
| **Bóvedas de cañón al fondo**: arcos de medio punto concéntricos con el de la vela, trazados desde la clave hacia abajo | portada | sus bóvedas de ladrillo |
| **La llama late** sobre la foto de la vela y el halo del loto respira con ella | portada | la vela encendida de su cabina |
| **Hero con canvas propio: polvo dorado** (36 motas en el haz de la vela, sprite cacheado) | portada | la vela de su foto y la trama «stardust» que ya usa su web |
| **Filete dorado que se traza en cada arco** + foto que se revela | todas las fotos | los arcos de medio punto de sus bóvedas |
| **Char-reveal** del lema y titulares; **palabras que se encienden** con el scroll (filosofía, opinión) | portada, secciones | la luz que va llenando la estancia |
| **Marquee doble** con la velocidad ligada al scroll (motor de `biblioteca-movimiento`) | portada | los nombres reales de su carta, en Cormorant cursiva y oro, separados por el loto |
| **Pila sticky** de cuatro tarjetas | El centro | su historia contada en cuatro capítulos (misión, 10 años, certificación, equipo) |
| **Botones magnéticos** (`biblioteca-movimiento/efectos/magnetico.js`, tal cual) | llamadas a la acción | — (el gesto de acercarse a pedir cita) |
| **Cursor propio** contextual: punto dorado y aro; «Ver», «Recorrido», «Mapa» | escritorio | el punto de luz dorada |
| **Contadores** (+10 años, +300 clientas) | portada | sus cifras |
| **Lenis** como único motor de scroll | todo | — |

Además: el **recorrido** (su vídeo en un arco alto con doble filete y la lista de estancias
que se ilumina con el tiempo del vídeo) y el **carril de rituales** con arrastre.

### Por qué no se parece a las webs hermanas

- **Restaurante Gabi («Soportal», a pocas calles)**: su cortina se abre en un **arco** que crece
  desde el suelo; sus ventanas en arco **rebajado con dovela ámbar** se abren desde abajo y su
  carta va en capítulos en arco apilados. Aquí la cortina **sube** con el borde de las hojas del
  loto (un **ala de gaviota** con la punta en el centro), los arcos son de **medio punto** con un
  filete dorado que **se traza**, ninguna foto se destapa desde abajo (ni con `clip-path`: no hay
  ningún `clip-path` en las hojas) y la carta es **de líneas** (nombre, puntos, duración, precio).
  Ni Fraunces ni Inter.
- **Bar Nizabel**: su cortina se abre en **lente**. Aquí ninguna transición tiene forma de lente.
- **La otra bodeguita**: tiene un halo que se hace papel. De ella se reutilizan los scripts y la
  técnica del **logo que vuela** de la cortina al hero, no el halo.
- **Raia · «Película»** (plantilla del sector): su protagonista es el **vídeo movido por el
  scroll**. Aquí el vídeo **no** se ata al scroll: es un **índice** (pulsar una estancia lleva el
  vídeo a ese segundo). Ni Italiana ni Hanken Grotesk.
- **Complementos Inés / biblioteca de movimiento**: brillo de oro al pasar y «cursor cuenta de
  oro». Aquí el dorado no brilla al pasar y el cursor es un punto y un aro.
- **Xenlleiro y el foco de Casimiro**: nada de destapes circulares ni haces de luz.

## Mapa de páginas

| URL | Archivo | Qué lleva |
|---|---|---|
| `/` | `index.html` | cortina · portada (bóveda en penumbra, arco con la vela y el loto encendido, polvo dorado, «abierto ahora») · cifras · filosofía · seis arcos de tratamientos · **cinta** · **recorrido** · carta con pestañas · carril de rituales · **opinión** · contacto (horario, mapa al pulsar) |
| `/centro-estetica-zafra` | `centro-estetica-zafra.html` | cabecera · pila sticky de 4 tarjetas · vídeo tour con controles · por qué elegirnos · cita |
| `/tratamientos-faciales-zafra`, `/indiba-zafra`, `/tratamientos-corporales-zafra`, `/spa-relax-masajes-zafra`, `/depilacion-fotodepilacion-zafra`, `/estetica-general-zafra` | una plantilla | cabecera oscura con migas, h1, subtítulo y foto en arco · índice de grupos (si hay más de uno; sticky al lado o barra fija en móvil) · carta de líneas con descripción literal, «Bonos» y «Pedir cita» por WhatsApp · lo propio de cada una · cita · otros cinco arcos |
| `/contacto` | `contacto.html` | el contacto de la portada a página completa, teléfono grande y magnético |
| `/aviso-legal`, `/politica-privacidad`, `/politica-cookies` | | sus textos, con la fecha actualizada; titular y NIF `[PENDIENTE]`; cookies ajustada a la web nueva |
| `/blog` y `/blog-<slug>` (1 artículo por ahora; los otros 4 se quitaron del JSON el 2026-10-23, están en el historial de git) | `blog.html`, `blog-*.html` | índice de artículos con foto en arco · artículo con migas, meta, cuerpo, caja de cita y «Sigue leyendo» (solo si hay más artículos) · JSON-LD `BlogPosting` |
| (cualquier otra) | `404.html` | la bóveda en penumbra, el loto quieto y los seis arcos |

Lo propio de cada página de tratamientos: **Indiba**, el bloque «Ciencia & belleza · El sistema
Proionic®» con el enlace a indiba.com, los seis beneficios con iconos de línea dorada dibujados
a mano (se trazan al entrar) y la línea «Indiba Corporal» enlazada a corporales. **Depilación**,
cera, hilo, fotodepilación y bonos como tablas de zonas. **Estética general**, la Beauty Party.
**Spa**, los rituales en tarjetas de arco y el resto como carta.

## El blog (SEO local)

Los textos viven en `data/blog.json` (un objeto por artículo: slug, title, description, h1,
fecha, foto, tratamiento al que enlaza, cuerpo en bloques `h` / `p` / `ul`). Para añadir uno:
copiar un objeto, cambiar el slug y `node scripts/construir.mjs`; el sitemap, el índice, el
«Para saber más» de la página de tratamientos y el JSON-LD salen solos. `verificar.mjs` (bloque 12)
comprueba SEO, enlaces, sitemap y que no haya palabras vetadas.

- **URL planas** (`/blog-que-es-indiba-zafra`, no `/blog/...`): todos los enlaces de la web son
  relativos y el `.htaccess` de IONOS no tiene que cambiar.
- **Reglas de redacción**: sin garantizar resultados ni prometer curar nada («puede», «suele»,
  «depende de cada persona»); sin precios (se quedan viejos, enlazan a la carta); sin «láser».
- El artículo es **borrador** para que Marina los revise (datos de cabina, contraindicaciones).
  La foto de «Fotodepilación» es provisional, como la de la página de depilación.
- Con `noindex` como el resto, hasta que la web se publique en marinaspa.es.
- El SEO local también se mueve con la ficha de Google Business y las reseñas, que no están aquí.

## Módulos que se pueden quitar

Cada uno vive en su `<section>` (entre marcas `[MÓDULO …]`), con su CSS y su JS aparte; el resto
de la web no depende de él. La receta es un script, y `verificar.mjs` la prueba en una copia
temporal (sin errores, sin 404 y sin que `construir.mjs` lo devuelva).

| Módulo | Dónde | Receta |
|---|---|---|
| Opinión (`data-modulo="opinion"`) | portada | `node scripts/quitar-opinion.mjs <carpeta>` |
| Beauty Party (`data-modulo="beauty-party"`) | estética general | `node scripts/quitar-beauty-party.mjs <carpeta>` |
| Cinta / marquee (`data-modulo="cinta"`) | portada | `node scripts/quitar-cinta.mjs <carpeta>` |
| El recorrido (`data-modulo="recorrido"`) | portada | `node scripts/quitar-recorrido.mjs <carpeta>` |

Con `--aqui` en vez de una carpeta, lo quita en esta misma (sin vuelta atrás). A mano sería:
borrar la sección entre sus marcas, las líneas con su `data-modulo` (su `<link>` y su
`<script>`), sus `css/x.css` y `js/x.js` (la cinta también `js/efectos/marquesina.js`; el
recorrido `data/recorrido.json`; la Beauty Party `data/beauty-party.json`), poner
`"x": false` en `data/sitio.json` → `modulos` y pasar `node scripts/versionar.mjs`.

## Las dos versiones (mando de maqueta)

Solo aparece con **`?revision`** en la URL (abajo a la izquierda; se aparta mientras está el aviso
de cookies). El enlace que se le manda a Marina sin `?revision` sale limpio.

- **«Bóveda»** (la cargada): filetes que se trazan en todos los arcos, polvo dorado en la
  portada, marquee doble, carril de rituales con arrastre, recorrido con vídeo y pila sticky.
- **«Sobria»**: los arcos con el filete ya puesto, sin polvo, una línea quieta de marcas
  (Indiba® · Mesoestetic® · Alquimia) en vez del marquee, los rituales en rejilla de 2×2 y la
  pila desapilada; fotos y carta iguales. **Añade** un buscador de tratamientos que filtra las 53
  líneas de la carta y lleva a su página.

El mando también lista los avisos pendientes (logo, fotos provisionales, NIF, precios, láser,
«Polinesia», los cambios de la regla 3, el vídeo con rótulos y la opinión).

### Quitar el mando de maqueta (antes de subir a marinaspa.es)

**Caso A · entregan la «Bóveda»** (comprobado por script contra los archivos):

```
node scripts/quitar-mando.mjs ../marina-spa-entrega
node scripts/comprobar-borrado.mjs ../marina-spa-entrega     → «Sin rastros del mando…»
```

Escribe una copia limpia (sin `scripts/` ni `screenshots/`) y quita, por marcas
`[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]`: el aviso de arriba de cada HTML, la
lectura de la densidad del script del `<head>`, el `<aside class="mando">`, el buscador, la fila
`ms-densidad` de la política de cookies, el bloque CSS del mando y de la sobria (también en
`cinta.css`) y `mandoMaqueta()` de `main.js`. Después vuelve a versionar.

**Caso B · eligen la «Sobria»**: antes del caso A, en `construir.mjs` cambiar
`class="sin-js densidad-boveda"` por `densidad-sobria` y sacar de su bloque `[MANDO DE MAQUETA]`
las reglas `html.densidad-sobria …` que se quieran conservar (y el buscador, si se queda).

## Cómo se cambia…

- **Un precio o un texto de la carta**: en `data/carta.json` (es la de su web, literal) y
  `node scripts/construir.mjs`. Las 13 páginas, el JSON-LD (`hasOfferCatalog`) y el buscador se
  regeneran. `node scripts/construir.mjs --comprobar` dice si algo no está al día.
- **El horario**: `data/horario.json` → `construir.mjs` (tabla, «abierto ahora» y JSON-LD).
- **Una foto**: cada foto es un id en `data/fotos.json`. Se cambia el archivo de `origen` (o esa
  línea), y `python -I scripts/gradar.py` → `node scripts/fotos.mjs` → `node scripts/construir.mjs`.
  Quitar `"provisional": true` cuando sea de la sesión. La gradación va horneada en el archivo
  (balance cálido, negros a Noche y el mismo grano en todas); no hay ningún `filter` en CSS.
- **El logo** (cuando llegue el vector): sustituir `../marina-spa-zafra-bocetos/ref/marca/loto-dorado.svg`
  y pasar `python -I scripts/marca.py` → `node scripts/generar-og.mjs` → `node scripts/construir.mjs`.
- **Un tiempo del recorrido**: `data/recorrido.json`.

## Cambios de texto respecto a su web (por si Álvaro quiere deshacer alguno)

**Regla 2 · erratas corregidas en la carta** (`scripts/preparar-carta.mjs`, comprobadas una a una):
- «recibirlos siguientes pasos» → «recibir los siguientes pasos» (limpieza en profundidad);
- «esta diseñado» → «está diseñado» (MESOECLAT);
- «El Indiba Facial Express» → «El Indiba Facial Exprés»;
- la entradilla de «Higiene Facial Oxigenante» termina ahora con punto.

No se cambia: el peeling que su web llama solo «Polinesia»; los precios, escritos como en su web
(«52 €/sesión», «Desde 450 €», «Consultar Bonos») con espacio fino antes del €; la Beauty Party se
añade desde su web como bloque aparte (no es un `<article>` de su carta).

**Regla 3 · sin superlativos que no se puedan probar** (en `data/seo-cambios.json`):
1. `<title>` de El centro: «Sobre Nosotros | El Mejor Centro de Estética en Zafra | Marina Spa» →
   «Sobre nosotros | Centro de estética en Zafra | Marina Spa».
2. Description de corporales: «Mejora tu silueta en el mejor centro de estética de Zafra…» →
   «Mejora tu silueta en nuestro centro de estética de Zafra…».
3. «Centro oficial Indiba» → «Centro certificado Indiba®» (description de Indiba), como dice su
   página de El centro.
4. (Mismo criterio) la llamada final «Reserva tu cita hoy en el mejor centro de estética de Zafra
   y descubre…» queda «Reserva tu cita hoy y descubre…», seguida de su «Estaremos encantadas de
   atenderte».

«El mejor centro de estética en Zafra» solo aparece dentro de la cita de Ana M., que son sus
palabras.

**Regla 4 · láser**: su web dice «Láser» en el subtítulo y en la description de depilación, pero
su tarifa se llama «Fotodepilación». En todo el texto visible sale «fotodepilación»: el subtítulo
queda «…: Fotodepilación, Cera y Hilo», la tarjeta de la portada «Fotodepilación, cera y diseño de
cejas con hilo…» y la description «Depilación en Zafra: fotodepilación, cera y diseño de cejas con
hilo…». El mando lo avisa.

Además: contacto y las legales tenían el título de inicio; ahora cada una tiene el suyo con el
mismo patrón («Contacto y reservas | Centro de estética en Zafra | Marina Spa»…).

## Migración (lo que posiciona no se toca)

- Las **12 URL** de hoy, sin `.html` y sin barra final. Los enlaces internos son relativos y sin
  extensión (`href="indiba-zafra"`). GitHub Pages ya sirve `/indiba-zafra` → `indiba-zafra.html`;
  `servir.mjs` hace lo mismo; para IONOS, el `.htaccess` (reescritura sin extensión, 301 de
  `x.html` → `/x` y de `/x/` → `/x`, 301 de las rutas viejas del JSON-LD — `/quienes-somos`,
  `/indiba`, `/depilacion`, `/rituales-faciales`, `/corporales`, `/spa`, `/estetica-general` — y
  `ErrorDocument 404 /404.html`).
- **Canonical** absoluto a `https://marinaspa.es/<ruta>`, `sitemap.xml` con las 12 y `robots.txt`
  como el suyo.
- **JSON-LD** corregido: `DaySpa` con el mismo `@id` `https://marinaspa.es/#beautysalon`, `url`
  e `@id` a rutas que existen, el viernes partido, `logo` e `image` a archivos reales,
  `hasOfferCatalog` desde `carta.json` (precios numéricos donde lo son). `Service` en cada página
  de tratamientos, `AboutPage` en El centro, `ContactPage` en contacto y `BreadcrumbList` en las
  interiores. **Sin `aggregateRating` ni `review`.**
- `og:image` de 1200×630 hecha a propósito (`assets/og-marina-spa.jpg`; la de hoy da 404).
- El `404.html` usa rutas desde la raíz (`/css/…`) porque se sirve en cualquier ruta: funciona en
  marinaspa.es y en `servir.mjs`, no en una *project page* de GitHub Pages con prefijo.

### El día del cambio a IONOS

1. `node scripts/quitar-mando.mjs ../marina-spa-entrega` y `node scripts/comprobar-borrado.mjs ../marina-spa-entrega`.
2. **Quitar el `noindex`** de las 13 páginas de la copia (`<meta name="robots" content="noindex, nofollow">`,
   justo tras el `charset`).
3. Subir la copia a IONOS **con el `.htaccess`** (y `.nojekyll` no hace falta allí).
4. Comprobar las 12 URL con `curl -I https://marinaspa.es/<ruta>` (200), una `x.html` y una
   `x/` (301 a `/x`), las 7 rutas viejas (301) y una inexistente (404 con la página propia).
5. Enviar `https://marinaspa.es/sitemap.xml` en Search Console.
6. **Vigilar la cobertura dos semanas** (Páginas, Rendimiento por URL) y comparar con las
   posiciones de hoy.

## Obligatorio (PLIEGO §5) y cómo está

- El logo se forma **una vez por visita** (`sessionStorage` `ms-loto`): en la cortina si sale; si no, florece en la portada la primera vez que se llega a ella. Volver a la portada no lo repite.
- Cortina **una vez por visita** (`sessionStorage`): el loto se dibuja pétalo a pétalo
  (`autoRound:false`, duración proporcional al largo), aparece «MARINA SPA», se enciende (halo
  con degradado cacheado, nunca `filter` por fotograma) y el paño sube en ~1,1 s con `expo.inOut`
  y el borde en ala de gaviota mientras el loto vuela al arco (destino medido en cada
  fotograma). Al navegar, una entrada corta (el contenido sube 12 px). Reloj que traga atascos,
  retirada garantizada sin GSAP, sin JS (`<noscript>`), con un `setTimeout` inline y con
  movimiento reducido sin pintar ni un fotograma. No toca el scroll: al primer gesto salta a la
  subida.
- Aviso de cookies (`.cookies:not([hidden]){display:flex}`), sin analítica; mapa solo al pulsar.
- Cursor propio (nada en táctil), menú móvil con `100dvh` y `aria-expanded`, `?v=<huella>` en
  CSS/JS, `.nojekyll`, `manifest.json`, favicon SVG con trazo grueso.
- Movimiento reducido: se apaga el movimiento, no el contenido (cifras, horario, pestaña,
  estancia y grupo activos siguen). `html.has-motion` solo con GSAP + ScrollTrigger y sin
  movimiento reducido: con el CDN caído la web se lee entera.
- Contraste AA medido con `node scripts/contraste.mjs` (el oro no llega como texto sobre cal:
  `--oro-texto` es `color-mix` del oro con Noche; botones dorados con texto `#1C1917`).
- El `resize` de la barra del móvil no rehace nada (ScrollTrigger sin `resize` en
  `autoRefreshEvents`; los handlers salen si solo cambia el alto < 160 px).

## Medidas (2026-10-10)

- `node scripts/verificar.mjs`: **171 comprobaciones, 0 fallos** (checklist completo, cortina,
  migración, carta, recorrido, pestañas, índice, arcos, horario con reloj falso, enlaces, borrados
  en copias, densidades, textos prohibidos, consola de las 13 páginas en escritorio y móvil).
- Contraste: todo el texto ≥ 5,04:1 en las dos versiones (`node scripts/contraste.mjs`).
- **LCP real en móvil** (`node scripts/lcp.mjs`: iPhone 13, 4G 1,6 Mbps/150 ms, CPU ×4, caché
  vacía, mediana de 3): portada en la 1.ª visita **1,65 s** (el lema; la foto de fondo no cuenta
  mientras la tapa la cortina), portada en una visita ya empezada **2,16 s** (la foto de la bóveda),
  Indiba **2,23 s** (el h1). Sin Lighthouse: en local engaña.
- Capturas en `screenshots/`: las 13 páginas a 360×640, 375×667, 390×844, 768×1024, 1366×768 y
  1440×900, los fotogramas de la cortina (a medio dibujar, halo, paño a media subida, también en
  móvil), el recorrido con «Mesa de cortesía», la carta de Indiba, la pila a mitad, las dos
  densidades, sin CDN y con movimiento reducido.

## Scripts

| Script | Qué hace |
|---|---|
| `preparar-carta.mjs` | copia la carta rastreada a `data/carta.json` con las 4 erratas |
| `gradar.py` → `fotos.mjs` | gradación común horneada → AVIF/WebP/JPG a 640 y 1280 px |
| `fuentes.mjs`, `comprobar-glifos.py` | autoaloja Cormorant y Lato (woff2 latino) y comprueba € ñ tildes « » ® |
| `marca.py`, `generar-og.mjs` | piezas del logo (loto, loto + «MARINA SPA» en trazos, favicon), og:image e iconos |
| `construir.mjs` | escribe las 13 páginas, sitemap, robots, manifest y .htaccess desde `data/` |
| `versionar.mjs` | `?v=<huella>` en CSS/JS (solo en `href`/`src`, idempotente) |
| `servir.mjs` | servidor local con rutas sin extensión (puerto 4261) |
| `verificar.mjs` | todas las pruebas (Playwright); `--capturas` guarda `screenshots/` |
| `contraste.mjs`, `lcp.mjs` | contraste AA medido; LCP real en móvil con CDP |
| `quitar-*.mjs`, `quitar-mando.mjs`, `comprobar-borrado.mjs` | recetas de borrado |

Usan `sharp` y `playwright` del `node_modules` de `alvarotaiagu.github.io` (aquí no hay npm).

## Pendientes para la clienta

1. **El logo original** (vector o grande). El de la web es un redibujado desde su miniatura de
   64 px (`../marina-spa-zafra-bocetos/ref/marca/_loto_dorado.py`).
2. **La sesión de fotos**: bóvedas, portón, cabinas, bañera y mesa de cortesía. Hoy hay 3 fotos
   reales de 1280 px; las otras 9 son las de banco que ya usa su web (`"provisional": true`).
3. **Un recorrido en vídeo sin rótulos encima** (el de su web lleva rótulos e iconos de Instagram).
4. **Titular y NIF** para el aviso legal y la privacidad (LSSI art. 10).
5. Si **siguen los precios y el horario** (su web no tiene fecha).
6. Si depila con **láser o con IPL**.
7. El nombre del peeling **«Polinesia»**.
8. Si quiere **reserva online** o sigue con teléfono y WhatsApp.
9. **Permiso para mantener la cita de Ana M.** con su nombre.
