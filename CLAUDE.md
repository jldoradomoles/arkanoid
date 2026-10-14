# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Arkanoid en HTML, CSS y JavaScript **sin dependencias** (sin npm, bundlers ni frameworks). El juego aún **no está implementado**: solo existen los assets, el módulo del spritesheet y el flujo de specs. No hay build, lint ni tests; el juego se ejecutará abriendo el `index.html` (a crear) en el navegador. El `README.md` está casi vacío (la sección "Cómo jugar" está sin escribir). El repositorio no es un repo git todavía.

## Flujo de trabajo basado en specs

Las skills de `.agents/skills/` (instaladas desde `Klerith/fernando-skills`, ver `skills-lock.json`) definen el flujo:

- `/spec <descripción>`: diseña una spec haciendo preguntas aclaratorias; escribe `specs/NN-slug.md` (estado `Draft`) y `specs/.spec-config.yml`. No escribe código.
- `/spec-impl <NN-slug>`: solo implementa specs en estado "Aprobado" (lo cambia el humano). Crea la rama `spec-NN-slug`, implementa paso a paso pausando para revisar el diff y **nunca hace commit automáticamente**. Requiere git (`git status`, ramas).
- Las specs se escriben en el mismo idioma que el prompt inicial (aquí, español).

## Assets

- `assets/spritesheet-breakout.png` + `assets/spritesheet.js`: el JS define coordenadas del spritesheet (`SPRITES` para paleta, bola y bloques por color: gray, red, yellow, cyan, magenta, hotpink, green; `EXPLOSION_FRAMES` con 4 frames por color y `EXPLOSION_DURATION = 150` ms) y funciones globales (sin módulos ES): `loadSpritesheet(cb)` carga la imagen en un canvas offscreen, `drawFrame(ctx, frame, x, y, w, h)` y `drawSprite(ctx, name, x, y, w, h)` (nombres de bloque con prefijo `block_`, p. ej. `block_red`). Notas: la ruta de la imagen es relativa (`assets/spritesheet-breakout.png`), así que el HTML debe estar en la raíz; las explosiones `gray` reutilizan los frames de `red`.
- `assets/sounds/`: `ball-bounce.mp3` (rebotes) y `break-sound.mp3` (rotura de bloque).
