# Juego de Arkanoid

El objetivo es que nosotros creemos un juego de Arkanoid en HTML, CSS y JavaScript, con cero dependencias, y las personas van a poder jugar el juego. Esto todavía no lo tenemos implementado.

## Cómo jugar

Abre `index.html` en el navegador (doble clic, no necesita servidor).

### Controles

| Acción | Tecla / ratón |
| ------ | ------------- |
| Mover la paleta | Flechas izquierda/derecha, `A` / `D` o mover el ratón sobre el canvas |
| Lanzar la bola | `Espacio` o clic |
| Pausa / reanudar | `P` |
| Reiniciar la partida | `Enter` (desde game over, victoria o durante la partida; no en pausa) |

### Reglas

- Destruye los 60 bloques (6 filas x 10 columnas) con la bola. Cada bloque se rompe de un golpe y suma 10 puntos.
- La bola empieza pegada a la paleta y también vuelve a estarlo tras perder una vida.
- El ángulo con el que rebota la bola depende de dónde golpee la paleta: en el centro sale casi vertical y en los bordes con un ángulo más abierto (hasta 60°).
- Tienes 3 vidas. Si la bola cae por debajo de la paleta pierdes una; con 0 vidas, game over.
- Si destruyes todos los bloques, ganas.
