# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Arkanoid en HTML, CSS y JavaScript **sin dependencias** (sin npm, bundlers ni frameworks). El juego está **implementado y jugable**: se ejecuta abriendo `index.html` en el navegador (doble clic, sin servidor). No hay build, lint ni tests. Specs implementadas: `01-mvp-jugable` y `02-niveles-y-sonidos`. Además hay un selector de nivel en el menú de pausa (rama `levels-select`, sin spec propia). El `README.md` documenta controles, reglas y sonidos.

## Arquitectura

- `index.html`: un `<canvas id="game">` de 800x600; carga `assets/spritesheet.js` y `js/game.js` con `<script>` clásicos (sin módulos ES).
- `css/style.css`: solo centra el canvas sobre fondo oscuro.
- `js/game.js` (único archivo de lógica, ~500 líneas, variables globales): objeto `state` (fase `ready|playing|paused|gameover|won`, puntos, vidas, nivel, paleta, bola, bloques, explosiones), bucle `requestAnimationFrame` con `update(dt)`/`render()` y dt limitado a `MAX_DT`. Constantes de rejilla (`COLS`, `BLOCK_W/H`, `GRID_TOP`) y `LEVELS` (velocidad, `gapChance`, `toughChance` por nivel).
- Niveles: `createBlocks(level)` genera el mapa al azar en la mitad izquierda de la rejilla 6x10 y lo espeja; bloques `gray` resistentes (2 golpes, 30 pts). `loadLevel(n)` conserva puntos y vidas; `resetGame()` reinicia todo.
- Pausa (`P`): muestra un selector de nivel (clic o teclas `1`-`N`) vía `selectLevel`.
- Audio: `playSound(name)` clona `Audio` precargados de `assets/sounds/` y tolera el bloqueo del navegador.
- Estilo de código: espacios dentro de paréntesis (`foo( x )`), comentarios en español.

## Flujo de trabajo basado en specs

Las skills de `.agents/skills/` (instaladas desde `Klerith/fernando-skills`, ver `skills-lock.json`) definen el flujo:

- `/spec <descripción>`: diseña una spec haciendo preguntas aclaratorias; escribe `specs/NN-slug.md` (estado `Draft`) y `specs/.spec-config.yml`. No escribe código.
- `/spec-impl <NN-slug>`: solo implementa specs en estado "Aprobado" (lo cambia el humano). Crea la rama `spec-NN-slug`, implementa paso a paso pausando para revisar el diff y **nunca hace commit automáticamente**. Requiere git (`git status`, ramas); el repo ya es git, con ramas `spec-01-...` y `spec-02-...`.
- Las specs se escriben en el mismo idioma que el prompt inicial (aquí, español).

## Assets

- `assets/spritesheet-breakout.png` + `assets/spritesheet.js`: el JS define coordenadas del spritesheet (`SPRITES` para paleta, bola y bloques por color: gray, red, yellow, cyan, magenta, hotpink, green; `EXPLOSION_FRAMES` con 4 frames por color y `EXPLOSION_DURATION = 150` ms) y funciones globales (sin módulos ES): `loadSpritesheet(cb)` carga la imagen en un canvas offscreen, `drawFrame(ctx, frame, x, y, w, h)` y `drawSprite(ctx, name, x, y, w, h)` (nombres de bloque con prefijo `block_`, p. ej. `block_red`). Notas: la ruta de la imagen es relativa (`assets/spritesheet-breakout.png`), así que el HTML debe estar en la raíz; las explosiones `gray` reutilizan los frames de `red`.
- `assets/sounds/`: `ball-bounce.mp3` (rebotes) y `break-sound.mp3` (rotura de bloque).
