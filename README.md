# Juego de Arkanoid

El objetivo es que nosotros creemos un juego de Arkanoid en HTML, CSS y JavaScript, con cero dependencias, y las personas pueden jugar el juego. Ya está implementado y es jugable.

## Cómo jugar

Abre `index.html` en el navegador (doble clic, no necesita servidor).

### Controles

| Acción | Tecla / ratón |
| ------ | ------------- |
| Mover la paleta | Flechas izquierda/derecha, `A` / `D` o mover el ratón sobre el canvas |
| Lanzar la bola | `Espacio` o clic |
| Pausa / reanudar | `P` |
| Elegir nivel (en pausa) | Clic en el botón del nivel o teclas `1`, `2`, `3` |
| Reiniciar la partida | `Enter` (desde game over, victoria o durante la partida; no en pausa) |

### Reglas

- El juego tiene 3 niveles. Cada uno es un mapa distinto, generado al azar sobre una rejilla de 6 filas x 10 columnas, con huecos y simétrico. Destruye todos los bloques para pasar al siguiente; puntuación y vidas se conservan.
- Los bloques de colores se rompen de un golpe y suman 10 puntos.
- Los bloques grises (a partir del nivel 2) aguantan 2 golpes: tras el primero se ven más transparentes. Suman 30 puntos al romperse.
- La bola va más rápida en cada nivel.
- La bola empieza pegada a la paleta y también vuelve a estarlo tras perder una vida.
- El ángulo con el que rebota la bola depende de dónde golpee la paleta: en el centro sale casi vertical y en los bordes con un ángulo más abierto (hasta 60°).
- Tienes 3 vidas. Si la bola cae por debajo de la paleta pierdes una; con 0 vidas, game over.
- Si destruyes todos los bloques del nivel 3, ganas.
- En el menú de pausa puedes saltar a cualquier nivel; puntuación y vidas se conservan.

### Sonidos

- Suena un rebote al golpear paredes, techo y paleta, y al golpear un bloque gris sin romperlo.
- Suena un sonido distinto al destruir un bloque.
- No hay sonido en pausa ni con la bola pegada. Si el navegador bloquea el audio, el juego sigue funcionando sin sonido.


## Estructura

- `index.html`: página con el canvas del juego.
- `css/style.css`: estilos del canvas.
- `js/game.js`: lógica, render y entrada del juego.
- `assets/`: spritesheet (`spritesheet-breakout.png` + `spritesheet.js`) y sonidos.
- `specs/`: especificaciones del desarrollo (`01-mvp-jugable`, `02-niveles-y-sonidos`).
