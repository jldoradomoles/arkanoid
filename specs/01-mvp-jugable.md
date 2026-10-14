# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Borrador
> **Depends on:** —
> **Date:** 2026-10-14
> **Objective:** Crear un Arkanoid jugable de un solo nivel en un canvas de 800x600, con paleta, bola, 6x10 bloques con explosión, 3 vidas, puntuación y pantallas de victoria y game over.

## Scope

**In:**

- `index.html` en la raíz con un `<canvas>` de 800x600 centrado en la página, sin dependencias.
- Carga del spritesheet con `loadSpritesheet` antes de arrancar el juego.
- Un único nivel: 6 filas x 10 columnas de bloques, una fila por color (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- Paleta controlada con teclado (flechas izquierda/derecha y A/D) y con ratón (sigue la posición X del cursor).
- Bola pegada a la paleta al inicio y tras perder una vida; se lanza con Espacio o clic.
- Rebote de la bola contra paredes, techo, paleta y bloques.
- El ángulo de rebote en la paleta depende del punto de impacto (centro = casi vertical, bordes = ángulo más abierto).
- Cada bloque se destruye de un golpe, suma 10 puntos y reproduce la animación de explosión de su color (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`).
- HUD con puntuación y vidas.
- 3 vidas: si la bola cae por debajo de la paleta se pierde una vida; con 0 vidas aparece la pantalla de game over.
- Pantalla de victoria al destruir los 60 bloques.
- Pausa con `P` y reinicio de partida con `Enter` (desde game over, victoria o durante la partida).

**Out of scope (para futuras specs):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`): los assets existen pero no se usan en este MVP.
- Power-ups, bloques resistentes de varios golpes y bloques `gray`.
- Más de un nivel, niveles generados o editor de niveles.
- Récord o cualquier persistencia (`localStorage`).
- Pantalla de título o menú inicial.
- Canvas responsive, soporte táctil/móvil.
- Aumento progresivo de velocidad de la bola.

## Data model

Estructuras en memoria (sin persistencia). Coordenadas con origen arriba a la izquierda; velocidades en píxeles por segundo; el bucle usa `requestAnimationFrame` con delta time.

```js
const CANVAS_W = 800;
const CANVAS_H = 600;

const BLOCK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']; // fila 0..5
const COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 32;
const BLOCK_GAP = 4;            // rejilla = 10*64 + 9*4 = 676 px, centrada (margen 62 px)
const GRID_TOP = 80;
const BLOCK_POINTS = 10;

const state = {
  phase: 'ready',               // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  score: 0,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14, speed: 600 },
  ball:   { x: 0, y: 0, size: 16, vx: 0, vy: 0, speed: 380, stuck: true },
  blocks: [/* { x, y, w, h, color, alive } */],
  explosions: [/* { x, y, color, elapsed } */],
};
```

Reglas de la bola:

- `speed` es constante; al lanzar, el vector sale hacia arriba con un ángulo ligeramente aleatorio respecto a la vertical.
- En la paleta: `offset = (centroBola - centroPaleta) / (paddle.w / 2)` en `[-1, 1]`; el ángulo respecto a la vertical es `offset * 60°` y la velocidad se recalcula manteniendo `speed`.
- Contra un bloque: se invierte `vx` o `vy` según el eje de menor penetración; solo se destruye un bloque por frame.

## Implementation plan

Archivos nuevos: `index.html`, `css/style.css`, `js/game.js`. Los assets existentes no se modifican.

1. Crear `index.html` (canvas 800x600, scripts `assets/spritesheet.js` y `js/game.js` sin módulos ES) y `css/style.css` (canvas centrado, fondo oscuro). Dentro de `game.js`, llamar a `loadSpritesheet` y pintar el fondo. Prueba manual: abrir `index.html`, ver canvas sin errores en consola.
2. Dibujar la cuadrícula de 6x10 bloques con `drawSprite` (`block_<color>`) y la paleta. Prueba manual: se ven 60 bloques y la paleta abajo.
3. Añadir el bucle `requestAnimationFrame` con delta time y mover la paleta con teclado y ratón, limitada a los bordes del canvas. Prueba manual: la paleta responde a flechas, A/D y ratón.
4. Añadir la bola pegada a la paleta, lanzamiento con Espacio/clic, y rebote contra paredes y techo. Prueba manual: la bola sale y rebota en tres lados.
5. Añadir colisión con la paleta con ángulo según punto de impacto. Prueba manual: impactar en el centro y en los bordes da ángulos distintos.
6. Añadir colisión con bloques: el bloque desaparece y suma 10 puntos. Prueba manual: la puntuación sube de 10 en 10.
7. Añadir animación de explosión en la posición del bloque destruido (4 frames repartidos en `EXPLOSION_DURATION`). Prueba manual: cada bloque muestra su explosión de color antes de desaparecer.
8. Añadir HUD (puntuación y vidas), pérdida de vida al caer la bola y vuelta a bola pegada. Prueba manual: al fallar bajan las vidas.
9. Añadir fases `gameover` y `won` con mensajes en el canvas, pausa con `P` y reinicio con `Enter`. Prueba manual: se puede ganar, perder, pausar y reiniciar sin recargar la página.
10. Escribir la sección "Cómo jugar" del `README.md` (controles y reglas).

## Acceptance criteria

- [ ] Abrir `index.html` directamente en el navegador (sin servidor) carga el juego sin errores en la consola.
- [ ] El canvas mide exactamente 800x600 y se ve la cuadrícula de 6 filas x 10 columnas (60 bloques), una fila por color.
- [ ] La paleta se mueve con flechas, con A/D y con el ratón, y no sale del canvas.
- [ ] Al empezar y tras perder una vida, la bola está pegada a la paleta y sigue su movimiento hasta pulsar Espacio o hacer clic.
- [ ] La bola rebota en paredes laterales, techo y paleta.
- [ ] Un impacto en el centro de la paleta lanza la bola casi vertical y uno en el borde la lanza con ángulo abierto (hasta 60° respecto a la vertical).
- [ ] Cada bloque se destruye con un solo golpe, suma exactamente 10 puntos y muestra su animación de explosión de 150 ms.
- [ ] El HUD muestra la puntuación y las vidas y se actualizan al instante.
- [ ] Si la bola cae por debajo de la paleta, las vidas bajan en 1 y la bola vuelve a estar pegada a la paleta.
- [ ] Con 0 vidas se muestra "Game over" con la puntuación final y la bola no se mueve.
- [ ] Al destruir los 60 bloques se muestra la pantalla de victoria con la puntuación final.
- [ ] `P` pausa y reanuda el juego: en pausa nada se mueve y se muestra un indicador de pausa.
- [ ] `Enter` reinicia la partida (60 bloques, 3 vidas, 0 puntos) desde cualquier fase salvo la pausa.
- [ ] El juego no usa dependencias externas ni reproduce sonidos.
- [ ] El `README.md` tiene la sección "Cómo jugar" con controles y reglas.

## Decisions

- **Sí:** JavaScript clásico con scripts globales y sin módulos ES. Es coherente con `assets/spritesheet.js` y permite abrir `index.html` con doble clic (los módulos ES fallan con `file://`).
- **Sí:** estructura `index.html` + `css/style.css` + `js/game.js`. Los nombres de carpeta son una propuesta de esta spec, no una decisión previa del proyecto.
- **Sí:** 6 filas de colores sin `gray`, porque se pidió una cuadrícula de 6x10 y quedan exactamente 6 colores normales; `gray` está reservado para bloques resistentes en otra spec.
- **Sí:** bloques de 64x32 (misma proporción 2:1 que el sprite de 32x16, escala x2) con separación de 4 px, rejilla centrada.
- **Sí:** teclado y ratón a la vez, para cubrir cualquier preferencia en escritorio.
- **Sí:** ángulo de rebote en la paleta según el punto de impacto; sin esto el juego es poco controlable.
- **Sí:** velocidad de la bola constante; subirla por nivel o tiempo entra con la progresión en otra spec.
- **Sí:** delta time en el bucle, para que la velocidad no dependa de los Hz del monitor.
- **No:** sonidos. Se decidió dejarlos fuera del MVP aunque los assets ya existen.
- **No:** récord en `localStorage`, pantalla de título, power-ups, múltiples niveles. Cada uno merece su spec.
- **No:** puntos distintos por color. Todos los bloques valen 10 para simplificar el MVP.

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Efecto túnel: la bola atraviesa bloques o la paleta a velocidades altas o frames largos | Limitar el delta time (p. ej. máximo 1/30 s) y mover la bola en subpasos si hace falta. |
| La bola se queda atrapada dentro de la paleta o rebotando sin parar | Reubicar la bola justo encima de la paleta tras el rebote y forzar `vy` negativo. |
| Bola con ángulo casi horizontal que tarda mucho en volver | Limitar el ángulo máximo a 60° respecto a la vertical. |
| Abrir con `file://` impide leer píxeles del canvas por origen distinto | El spritesheet solo se dibuja (no se leen píxeles), así que no afecta. |

## What is **not** in this spec

- Sonidos.
- Power-ups y bloques resistentes (`gray`).
- Más de un nivel.
- Récord y persistencia.
- Pantalla de título o menú.
- Versión móvil o táctil.

Cada uno de esos puntos, si se aborda, va en su propia spec.
