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

function render() {
  drawBackground();
  drawBlocks();
  drawPaddle();
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

function update( dt ) {
  updatePaddle( dt );
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
