const CANVAS_W = 800;
const CANVAS_H = 600;

const BLOCK_COLORS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ]; // fila 0..5
const COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 32;
const BLOCK_GAP = 4;            // rejilla = 10*64 + 9*4 = 676 px, centrada (margen 62 px)
const GRID_TOP = 80;
const BLOCK_POINTS = 10;

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );
ctx.imageSmoothingEnabled = false;

const state = {
  phase: 'ready',               // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  score: 0,
  lives: 3,
  paddle: { x: 340, y: 560, w: 120, h: 14, speed: 600 },
  ball:   { x: 0, y: 0, size: 16, vx: 0, vy: 0, speed: 380, stuck: true },
  blocks: [],                   // { x, y, w, h, color, alive }
  explosions: [],               // { x, y, color, elapsed }
};

function createBlocks() {
  const gridW = COLS * BLOCK_W + ( COLS - 1 ) * BLOCK_GAP;
  const left = ( CANVAS_W - gridW ) / 2;
  const blocks = [];
  BLOCK_COLORS.forEach( ( color, row ) => {
    for ( let col = 0; col < COLS; col++ ) {
      blocks.push( {
        x: left + col * ( BLOCK_W + BLOCK_GAP ),
        y: GRID_TOP + row * ( BLOCK_H + BLOCK_GAP ),
        w: BLOCK_W,
        h: BLOCK_H,
        color,
        alive: true,
      } );
    }
  } );
  return blocks;
}

function drawBackground() {
  ctx.fillStyle = '#11111f';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );
}

function drawBlocks() {
  for ( const b of state.blocks ) {
    if ( b.alive ) drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  }
}

function drawPaddle() {
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x, p.y, p.w, p.h );
}

function drawExplosions() {
  for ( const ex of state.explosions ) {
    const frames = EXPLOSION_FRAMES[ ex.color ];
    // los frames se reparten a partes iguales en EXPLOSION_DURATION
    const i = Math.min( frames.length - 1, Math.floor( ex.elapsed / EXPLOSION_DURATION * frames.length ) );
    drawFrame( ctx, frames[ i ], ex.x, ex.y, BLOCK_W, BLOCK_H );
  }
}

function drawBall() {
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x, b.y, b.size, b.size );
}

function render() {
  drawBackground();
  drawBlocks();
  drawExplosions();
  drawPaddle();
  drawBall();
}

const MAX_DT = 1 / 30;          // limita el delta time para evitar saltos tras pausas de pestaña

const keys = { left: false, right: false };

function setKey( e, pressed ) {
  switch ( e.code ) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = pressed;
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = pressed;
      e.preventDefault();
      break;
  }
}

window.addEventListener( 'keydown', e => setKey( e, true ) );
window.addEventListener( 'keyup', e => setKey( e, false ) );

canvas.addEventListener( 'mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = ( e.clientX - rect.left ) * ( CANVAS_W / rect.width );
  setPaddleX( mouseX - state.paddle.w / 2 );
} );

function setPaddleX( x ) {
  const p = state.paddle;
  p.x = Math.max( 0, Math.min( CANVAS_W - p.w, x ) );
}

function updatePaddle( dt ) {
  const dir = ( keys.right ? 1 : 0 ) - ( keys.left ? 1 : 0 );
  if ( dir !== 0 ) setPaddleX( state.paddle.x + dir * state.paddle.speed * dt );
}

const LAUNCH_SPREAD = 15 * Math.PI / 180;   // desviación máxima aleatoria respecto a la vertical

function stickBallToPaddle() {
  const p = state.paddle;
  const b = state.ball;
  b.stuck = true;
  b.vx = 0;
  b.vy = 0;
  b.x = p.x + p.w / 2 - b.size / 2;
  b.y = p.y - b.size;
}

function launchBall() {
  const b = state.ball;
  if ( !b.stuck ) return;
  const angle = ( Math.random() * 2 - 1 ) * LAUNCH_SPREAD;
  b.vx = Math.sin( angle ) * b.speed;
  b.vy = -Math.cos( angle ) * b.speed;
  b.stuck = false;
  state.phase = 'playing';
}

function updateBall( dt ) {
  const b = state.ball;
  if ( b.stuck ) {
    stickBallToPaddle();
    return;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // paredes laterales
  if ( b.x < 0 ) {
    b.x = 0;
    b.vx = Math.abs( b.vx );
  } else if ( b.x + b.size > CANVAS_W ) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs( b.vx );
  }

  // techo
  if ( b.y < 0 ) {
    b.y = 0;
    b.vy = Math.abs( b.vy );
  }

  collideBallWithPaddle();
  collideBallWithBlocks();
}

function collideBallWithBlocks() {
  const b = state.ball;

  for ( const blk of state.blocks ) {
    if ( !blk.alive ) continue;
    if ( b.x + b.size <= blk.x || b.x >= blk.x + blk.w ) continue;
    if ( b.y + b.size <= blk.y || b.y >= blk.y + blk.h ) continue;

    // penetración en cada eje: se rebota por el de menor penetración
    const overlapX = Math.min( b.x + b.size - blk.x, blk.x + blk.w - b.x );
    const overlapY = Math.min( b.y + b.size - blk.y, blk.y + blk.h - b.y );

    if ( overlapX < overlapY ) {
      const fromLeft = b.x + b.size / 2 < blk.x + blk.w / 2;
      b.x += fromLeft ? -overlapX : overlapX;
      b.vx = fromLeft ? -Math.abs( b.vx ) : Math.abs( b.vx );
    } else {
      const fromTop = b.y + b.size / 2 < blk.y + blk.h / 2;
      b.y += fromTop ? -overlapY : overlapY;
      b.vy = fromTop ? -Math.abs( b.vy ) : Math.abs( b.vy );
    }

    blk.alive = false;
    state.score += BLOCK_POINTS;
    state.explosions.push( { x: blk.x, y: blk.y, color: blk.color, elapsed: 0 } );
    return;   // solo se destruye un bloque por frame
  }
}

const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180;   // respecto a la vertical, en los bordes de la paleta

function collideBallWithPaddle() {
  const b = state.ball;
  const p = state.paddle;

  // solo si la bola baja y se solapa con la paleta
  if ( b.vy <= 0 ) return;
  if ( b.x + b.size < p.x || b.x > p.x + p.w ) return;
  if ( b.y + b.size < p.y || b.y > p.y + p.h ) return;

  const offset = Math.max( -1, Math.min( 1,
    ( b.x + b.size / 2 - ( p.x + p.w / 2 ) ) / ( p.w / 2 ) ) );
  const angle = offset * MAX_BOUNCE_ANGLE;

  b.vx = Math.sin( angle ) * b.speed;
  b.vy = -Math.cos( angle ) * b.speed;   // siempre hacia arriba
  b.y = p.y - b.size;                    // justo encima de la paleta
}

window.addEventListener( 'keydown', e => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( !e.repeat ) launchBall();
  }
} );

canvas.addEventListener( 'mousedown', launchBall );

function updateExplosions( dt ) {
  for ( const ex of state.explosions ) ex.elapsed += dt * 1000;
  state.explosions = state.explosions.filter( ex => ex.elapsed < EXPLOSION_DURATION );
}

function update( dt ) {
  updatePaddle( dt );
  updateBall( dt );
  updateExplosions( dt );
}

let lastTime = 0;

function frame( now ) {
  const dt = Math.min( ( now - lastTime ) / 1000, MAX_DT );
  lastTime = now;
  update( dt );
  render();
  requestAnimationFrame( frame );
}

state.blocks = createBlocks();

loadSpritesheet( () => {
  lastTime = performance.now();
  requestAnimationFrame( frame );
} );
