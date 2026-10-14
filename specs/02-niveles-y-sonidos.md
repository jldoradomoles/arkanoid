# SPEC 02 — Niveles generados, bloques resistentes y sonidos

> **Status:** implementado
> **Depends on:** SPEC 01
> **Date:** 2026-10-14
> **Objective:** Añadir 3 niveles de dificultad creciente con mapas de bloques generados proceduralmente, bloques resistentes (`gray`, 2 golpes) y efectos de sonido para rebotes y rotura de bloques.

## Scope

**In:**

- 3 niveles consecutivos. Al limpiar uno se carga el siguiente conservando puntuación y vidas; al limpiar el 3º aparece la pantalla de victoria existente.
- Generación procedural del mapa de cada nivel sobre la rejilla de 6x10 de la SPEC 01, con aleatoriedad controlada por parámetros de dificultad del nivel y simetría horizontal.
- Huecos (celdas vacías) en el mapa según la dificultad del nivel.
- Bloques resistentes `gray`: requieren 2 golpes, valen 30 puntos y usan el sprite `block_gray` (mismo sprite en ambos estados; tras el primer golpe se dibuja con opacidad reducida).
- Velocidad de la bola creciente por nivel (380 / 420 / 460 px/s).
- HUD con el nivel actual (`Nivel N`) y rótulo "Nivel N" visible mientras la bola está pegada al inicio de cada nivel (incluido el 1).
- Sonidos con `assets/sounds/ball-bounce.mp3` (rebote en paredes, techo y paleta, y golpe a un bloque resistente que no se rompe) y `assets/sounds/break-sound.mp3` (bloque destruido).
- `Enter` reinicia la partida completa desde el nivel 1.

**Out of scope (para futuras specs):**

- Música de fondo, sonido de pérdida de vida, de victoria o de game over (no hay assets).
- Control de volumen, silencio (mute) o configuración de audio.
- Power-ups.
- Récord o persistencia (`localStorage`).
- Pantalla de título/menú, pantalla intermedia entre niveles con confirmación.
- Mapas diseñados a mano o editor de niveles.
- Más de 3 niveles o modo infinito.
- Bloques de más de 2 golpes o sprites distintos por estado de daño.

## Data model

Se amplía el estado de la SPEC 01 (solo en memoria). Constantes y estructuras nuevas en `js/game.js`:

```js
const LEVELS = [
  { speed: 380, gapChance: 0.10, toughChance: 0.00 },   // nivel 1
  { speed: 420, gapChance: 0.20, toughChance: 0.15 },   // nivel 2
  { speed: 460, gapChance: 0.25, toughChance: 0.30 },   // nivel 3
];
const TOUGH_HITS = 2;
const TOUGH_POINTS = 30;
const DAMAGED_ALPHA = 0.6;      // opacidad del bloque resistente tras el primer golpe
const MIN_BLOCKS = 20;          // mínimo de bloques vivos por mapa generado
```

Cambios en `state`:

```js
state.level = 1;                // 1..LEVELS.length
// bloque: { x, y, w, h, color, alive, hp, points }
//   normal:     color = BLOCK_COLORS[fila], hp = 1, points = 10
//   resistente: color = 'gray',            hp = 2, points = 30
```

Sonido (sin dependencias, `HTMLAudioElement`):

```js
const SOUNDS = {
  bounce: 'assets/sounds/ball-bounce.mp3',
  break:  'assets/sounds/break-sound.mp3',
};
function playSound(name) { /* cloneNode() del Audio precargado para permitir solapamiento; try/catch ante bloqueo del navegador */ }
```

Reglas de generación (`createBlocks(level)`):

- Se recorren las columnas `0..4` de cada fila; cada celda se vacía con probabilidad `gapChance`; si no, con probabilidad `toughChance` es resistente (`gray`) y si no es normal con el color de su fila. La columna `9 - col` espeja la celda de `col`.
- Si el mapa resultante tiene menos de `MIN_BLOCKS` bloques, se regenera.
- Condición de fin de nivel: no queda ningún bloque vivo (los huecos no cuentan).

Reglas de colisión actualizadas:

- Al golpear un bloque: `hp--`. Si `hp > 0` suena `bounce` y no se destruye (ni suma puntos ni explosión). Si `hp === 0` se destruye, suma `points`, suena `break` y se crea la explosión (`gray` reutiliza los frames de `red`, ya definido en `EXPLOSION_FRAMES`).
- El rebote físico de la bola contra el bloque (inversión de eje) no cambia respecto a la SPEC 01.

Reglas de sonido:

- `bounce` en cada rebote contra pared lateral, techo y paleta, y en golpe a bloque resistente que sobrevive. Solo un sonido por evento de colisión.
- `break` solo al destruir un bloque (no suena `bounce` a la vez).
- No suena nada en pausa, ni con la bola pegada.

## Implementation plan

Archivos que cambian: `js/game.js`, `README.md`. No se añaden archivos nuevos ni se modifican los assets.

1. Añadir `playSound` con precarga de `SOUNDS` y reproducir `bounce` en rebotes contra paredes, techo y paleta. Prueba manual: cada rebote suena y no hay errores en consola (la primera reproducción ocurre tras el clic/Espacio de lanzamiento).
2. Añadir `hp` y `points` a los bloques y reproducir `break` al destruir un bloque (mantener 10 puntos en los normales). Prueba manual: al romper un bloque suena `break` y no `bounce`.
3. Introducir `LEVELS`, `state.level` y el generador `createBlocks(level)` con huecos y simetría horizontal; `resetGame` carga el nivel 1 con `ball.speed = LEVELS[0].speed`. Prueba manual: el mapa del nivel 1 muestra huecos y es simétrico; recargar produce mapas distintos.
4. Añadir bloques resistentes: generación `gray`, 2 golpes, 30 puntos, opacidad reducida tras el primer golpe y `bounce` al golpearlos sin romperlos. Prueba manual: en el nivel 2/3 un bloque gris necesita dos golpes y da 30 puntos.
5. Añadir progresión: al destruir el último bloque, si `state.level < LEVELS.length` cargar el siguiente nivel (mapa nuevo, velocidad del nivel, bola pegada, fase `ready`, explosiones en curso se conservan); si es el último, fase `won`. Prueba manual: tras limpiar el nivel 1 aparece el 2 con la bola pegada y más rápida.
6. Mostrar `Nivel N` en el HUD y el rótulo "Nivel N" centrado (sin oscurecer el canvas) mientras `phase === 'ready'`. `resetGame` vuelve al nivel 1. Prueba manual: el rótulo aparece al inicio de cada nivel y desaparece al lanzar.
7. Actualizar la sección "Cómo jugar" del `README.md` (niveles, bloques grises y sonidos). Prueba manual: leer el README.

## Acceptance criteria

- [ ] Abrir `index.html` sin servidor carga el juego sin errores en la consola, también tras el primer sonido.
- [ ] Hay exactamente 3 niveles; el HUD muestra `Nivel 1`, `Nivel 2` o `Nivel 3` y se actualiza al cambiar.
- [ ] El mapa de cada nivel es simétrico respecto al eje vertical central, tiene huecos y al menos 20 bloques, y cambia entre partidas.
- [ ] El nivel 1 no contiene bloques grises; los niveles 2 y 3 contienen bloques grises (probabilidad 15 % y 30 % por celda no vacía).
- [ ] Un bloque gris no se destruye con el primer golpe, se dibuja con opacidad reducida después y se destruye con el segundo, sumando exactamente 30 puntos.
- [ ] Los bloques de color se destruyen de un golpe y suman 10 puntos.
- [ ] Al destruir el último bloque de los niveles 1 y 2 se carga el siguiente nivel con la bola pegada a la paleta, y puntuación y vidas se conservan.
- [ ] La velocidad de la bola es 380, 420 y 460 px/s en los niveles 1, 2 y 3.
- [ ] Mientras la bola está pegada se muestra el rótulo "Nivel N" y desaparece al lanzar.
- [ ] Al destruir el último bloque del nivel 3 se muestra la pantalla de victoria con la puntuación final.
- [ ] `Enter` reinicia la partida desde el nivel 1 con 3 vidas y 0 puntos.
- [ ] Suena `ball-bounce.mp3` al rebotar en pared lateral, techo y paleta, y al golpear un bloque gris sin romperlo.
- [ ] Suena `break-sound.mp3` al destruir cualquier bloque, sin que suene a la vez `ball-bounce.mp3`.
- [ ] Varios sonidos seguidos pueden solaparse (un rebote no corta el anterior).
- [ ] No suena nada en pausa ni con la bola pegada.
- [ ] El juego sigue funcionando si el navegador bloquea el audio (sin excepciones sin capturar).
- [ ] El `README.md` describe niveles, bloques grises y sonidos en "Cómo jugar".

## Decisions

- **Sí:** "niveles de bloques" = varios niveles de juego **y** bloques resistentes. Confirmado por el usuario.
- **Sí:** mapas procedurales con aleatoriedad controlada por parámetros por nivel y simetría horizontal, para que sean jugables y distintos en cada partida.
- **Sí:** 3 niveles con victoria al terminar el último; puntuación y vidas se conservan entre niveles.
- **Sí:** `gray` = 2 golpes, mismo sprite con opacidad reducida tras el primer golpe, porque solo existe un sprite `gray`.
- **Sí:** 30 puntos por bloque resistente y 10 por los normales; velocidad de bola 380/420/460, que sustituye la velocidad constante de la SPEC 01.
- **Sí:** `ball-bounce.mp3` para rebotes (pared, techo, paleta y golpe a resistente) y `break-sound.mp3` solo para rotura; son sonidos distintos y no se superponen en el mismo evento.
- **Sí:** el rótulo "Nivel N" se dibuja sin oscurecer el canvas, para ver el mapa antes de lanzar.
- **Sí:** reproducir clonando el `Audio` precargado para permitir solapamiento; envolver `play()` en `try/catch`/`catch` de promesa por el bloqueo de autoplay.
- **Sí:** esta spec modifica la SPEC 01: deja de ser cierto que "el juego no reproduce sonidos" y que la velocidad es constante.
- **No:** sonidos de pérdida de vida, victoria o game over: no hay assets, y silenciar/volumen es otra spec.
- **No:** mapas escritos a mano ni archivo `levels.js`: la generación procedural los hace innecesarios.
- **No:** nuevos archivos: todo cabe en `js/game.js`.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| El navegador bloquea el audio hasta que hay interacción | El primer sonido llega tras lanzar la bola (clic/Espacio); capturar el rechazo de `play()`. |
| Mapa generado con muy pocos bloques o inaccesible | `MIN_BLOCKS` y regeneración; con la rejilla completa todos los bloques son alcanzables. |
| Latencia o cortes al reproducir el mismo `Audio` repetidamente | Clonar el `Audio` por reproducción y precargar con `preload = 'auto'`. |
| Rebote doble y sonido doble en esquinas (pared + bloque en el mismo frame) | Aceptable: un sonido por evento de colisión; no se deduplica entre eventos distintos. |
| Dificultad desequilibrada en el nivel 3 | Valores en `LEVELS` fáciles de ajustar; el equilibrio fino queda para una spec posterior. |

## What is **not** in this spec

- Sonido de pérdida de vida, victoria, game over ni música.
- Volumen, mute o ajustes de audio.
- Power-ups.
- Récord y persistencia.
- Pantalla de título o intermedia entre niveles.
- Editor de niveles o mapas manuales.
- Más de 3 niveles, modo infinito o bloques de más de 2 golpes.

Cada uno de esos puntos, si se aborda, va en su propia spec.
