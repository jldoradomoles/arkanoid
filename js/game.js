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
  level: 1,                     // 1..LEVELS.length
  paddle: { x: 340, y: 560, w: 120, h: 14, speed: 600 },
  ball:   { x: 0, y: 0, size: 16, vx: 0, vy: 0, speed: 380, stuck: true },
  blocks: [],                   // { x, y, w, h, color, alive, hp, points }
  explosions: [],               // { x, y, color, elapsed }
};

const LEVELS = [
  { speed: 380, gapChance: 0.10, toughChance: 0.00 },   // nivel 1
  { speed: 420, gapChance: 0.20, toughChance: 0.15 },   // nivel 2
  { speed: 460, gapChance: 0.25, toughChance: 0.30 },   // nivel 3
];
const TOUGH_HITS = 2;
const TOUGH_POINTS = 30;
const DAMAGED_ALPHA = 0.6;      // opacidad del bloque resistente tras el primer golpe
const MIN_BLOCKS = 20;          // mínimo de bloques vivos por mapa generado

const SOUNDS = {
  bounce: 'assets/sounds/ball-bounce.mp3',
  break:  'assets/sounds/break-sound.mp3',
};

const audioCache = {};
for ( const name in SOUNDS ) {
  const audio = new Audio( SOUNDS[ name ] );
  audio.preload = 'auto';
  audioCache[ name ] = audio;
}

// clona el Audio precargado para permitir que los sonidos se solapen
function playSound( name ) {
  try {
    const p = audioCache[ name ].cloneNode().play();
    if ( p ) p.catch( () => {} );   // el navegador puede bloquear el audio
  } catch ( e ) {}
}

// genera el mapa del nivel: huecos al azar en la mitad izquierda, espejados a la derecha
function createBlocks( level ) {
  const { gapChance, toughChance } = LEVELS[ level - 1 ];
  const gridW = COLS * BLOCK_W + ( COLS - 1 ) * BLOCK_GAP;
  const left = ( CANVAS_W - gridW ) / 2;
  let blocks;
  do {
    blocks = [];
    BLOCK_COLORS.forEach( ( color, row ) => {
      for ( let col = 0; col < COLS / 2; col++ ) {
        if ( Math.random() < gapChance ) continue;
        const tough = Math.random() < toughChance;   // la celda espejada comparte tipo
        for ( const c of [ col, COLS - 1 - col ] ) {
          blocks.push( {
            x: left + c * ( BLOCK_W + BLOCK_GAP ),
            y: GRID_TOP + row * ( BLOCK_H + BLOCK_GAP ),
            w: BLOCK_W,
            h: BLOCK_H,
            color: tough ? 'gray' : color,
            alive: true,
            hp: tough ? TOUGH_HITS : 1,
            points: tough ? TOUGH_POINTS : BLOCK_POINTS,
          } );
        }
      }
    } );
  } while ( blocks.length < MIN_BLOCKS );
  return blocks;
}

function drawBackground() {
  ctx.fillStyle = '#11111f';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );
}

function drawBlocks() {
  for ( const b of state.blocks ) {
    if ( !b.alive ) continue;
    // el bloque resistente dañado se dibuja con menos opacidad
    const damaged = b.color === 'gray' && b.hp < TOUGH_HITS;
    if ( damaged ) ctx.globalAlpha = DAMAGED_ALPHA;
    drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
    ctx.globalAlpha = 1;
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

function drawHUD() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText( 'Puntos: ' + state.score, 62, 40 );
  ctx.textAlign = 'center';
  ctx.fillText( 'Nivel ' + state.level, CANVAS_W / 2, 40 );
  ctx.textAlign = 'left';
  // vidas: una bola por vida, alineadas a la derecha
  const LIFE_SIZE = 20;
  const LIFE_GAP = 8;
  for ( let i = 0; i < state.lives; i++ ) {
    const x = CANVAS_W - 62 - LIFE_SIZE - i * ( LIFE_SIZE + LIFE_GAP );
    drawSprite( ctx, 'ball', x, 40 - LIFE_SIZE / 2, LIFE_SIZE, LIFE_SIZE );
  }
}

function drawOverlay( title, lines ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect( 0, 0, CANVAS_W, CANVAS_H );
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 56px monospace';
  ctx.fillText( title, CANVAS_W / 2, CANVAS_H / 2 - 40 );
  ctx.font = '22px monospace';
  lines.forEach( ( line, i ) => ctx.fillText( line, CANVAS_W / 2, CANVAS_H / 2 + 20 + i * 32 ) );
}

// rótulo "Nivel N" sin oscurecer el canvas, mientras la bola está pegada
function drawLevelBanner() {
  if ( state.phase !== 'ready' ) return;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px monospace';
  ctx.fillText( 'Nivel ' + state.level, CANVAS_W / 2, 440 );
}

// selector de nivel del menú de pausa: un botón por nivel (clic o teclas 1..N)
const LEVEL_BTN = { w: 56, h: 56, gap: 16, y: 400 };

function levelButtonRect( i ) {
  const total = LEVELS.length * LEVEL_BTN.w + ( LEVELS.length - 1 ) * LEVEL_BTN.gap;
  return {
    x: ( CANVAS_W - total ) / 2 + i * ( LEVEL_BTN.w + LEVEL_BTN.gap ),
    y: LEVEL_BTN.y,
    w: LEVEL_BTN.w,
    h: LEVEL_BTN.h,
  };
}

function drawLevelSelector() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText( 'Elegir nivel (clic o teclas 1-' + LEVELS.length + ')', CANVAS_W / 2, LEVEL_BTN.y - 24 );
  for ( let i = 0; i < LEVELS.length; i++ ) {
    const r = levelButtonRect( i );
    const current = i + 1 === state.level;
    ctx.fillStyle = current ? '#ffffff' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect( r.x, r.y, r.w, r.h );
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect( r.x, r.y, r.w, r.h );
    ctx.fillStyle = current ? '#11111f' : '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText( String( i + 1 ), r.x + r.w / 2, r.y + r.h / 2 );
  }
}

// salta al nivel elegido desde la pausa; puntuación y vidas se conservan
function selectLevel( level ) {
  if ( state.phase !== 'paused' || level < 1 || level > LEVELS.length ) return;
  state.explosions = [];
  loadLevel( level );
}

function drawPhaseOverlay() {
  switch ( state.phase ) {
    case 'paused':
      drawOverlay( 'PAUSA', [ 'Pulsa P para continuar' ] );
      drawLevelSelector();
      break;
    case 'gameover':
      drawOverlay( 'Game over', [ 'Puntuación final: ' + state.score, 'Pulsa Enter para reiniciar' ] );
      break;
    case 'won':
      drawOverlay( '¡Victoria!', [ 'Puntuación final: ' + state.score, 'Pulsa Enter para reiniciar' ] );
      break;
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
  drawHUD();
  drawLevelBanner();
  drawPhaseOverlay();
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
  if ( state.phase === 'paused' ) return;
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
  if ( !b.stuck || state.phase !== 'ready' ) return;
  const angle = ( Math.random() * 2 - 1 ) * LAUNCH_SPREAD;
  b.vx = Math.sin( angle ) * b.speed;
  b.vy = -Math.cos( angle ) * b.speed;
  b.stuck = false;
  state.phase = 'playing';
}

function updateBall( dt ) {
  const b = state.ball;
  if ( state.phase === 'gameover' || state.phase === 'won' ) return;
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
    playSound( 'bounce' );
  } else if ( b.x + b.size > CANVAS_W ) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs( b.vx );
    playSound( 'bounce' );
  }

  // techo
  if ( b.y < 0 ) {
    b.y = 0;
    b.vy = Math.abs( b.vy );
    playSound( 'bounce' );
  }

  collideBallWithPaddle();
  collideBallWithBlocks();

  // la bola cae por debajo del canvas
  if ( b.y > CANVAS_H ) loseLife();
}

function loseLife() {
  const b = state.ball;
  state.lives--;
  if ( state.lives > 0 ) {
    state.phase = 'ready';
    stickBallToPaddle();
  } else {
    // sin vidas: la bola queda detenida
    state.phase = 'gameover';
    b.vx = 0;
    b.vy = 0;
  }
}

// carga el mapa y la velocidad del nivel; puntuación, vidas y explosiones en curso se conservan
function loadLevel( level ) {
  state.level = level;
  state.ball.speed = LEVELS[ level - 1 ].speed;
  state.blocks = createBlocks( level );
  state.phase = 'ready';
  stickBallToPaddle();
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

    blk.hp--;
    if ( blk.hp > 0 ) {
      playSound( 'bounce' );   // el bloque resistente sobrevive
      return;
    }

    blk.alive = false;
    state.score += blk.points;
    playSound( 'break' );
    state.explosions.push( { x: blk.x, y: blk.y, color: blk.color, elapsed: 0 } );

    if ( state.blocks.every( bl => !bl.alive ) ) {
      if ( state.level < LEVELS.length ) {
        loadLevel( state.level + 1 );
      } else {
        state.phase = 'won';
        b.vx = 0;
        b.vy = 0;
      }
    }
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
  playSound( 'bounce' );
}

window.addEventListener( 'keydown', e => {
  if ( e.code === 'Space' ) {
    e.preventDefault();
    if ( !e.repeat ) launchBall();
  }
} );

canvas.addEventListener( 'mousedown', e => {
  if ( state.phase === 'paused' ) {
    const rect = canvas.getBoundingClientRect();
    const mx = ( e.clientX - rect.left ) * ( CANVAS_W / rect.width );
    const my = ( e.clientY - rect.top ) * ( CANVAS_H / rect.height );
    for ( let i = 0; i < LEVELS.length; i++ ) {
      const r = levelButtonRect( i );
      if ( mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h ) selectLevel( i + 1 );
    }
    return;
  }
  launchBall();
} );

let phaseBeforePause = 'ready';

function togglePause() {
  if ( state.phase === 'paused' ) {
    state.phase = phaseBeforePause;
  } else if ( state.phase === 'ready' || state.phase === 'playing' ) {
    phaseBeforePause = state.phase;
    state.phase = 'paused';
  }
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.paddle.x = 340;
  state.explosions = [];
  loadLevel( 1 );
}

window.addEventListener( 'keydown', e => {
  if ( e.repeat ) return;
  if ( e.code === 'KeyP' ) {
    togglePause();
  } else if ( /^Digit[1-9]$/.test( e.code ) ) {
    selectLevel( Number( e.code.slice( 5 ) ) );
  } else if ( e.code === 'Enter' && state.phase !== 'paused' ) {
    resetGame();
  }
} );

function updateExplosions( dt ) {
  for ( const ex of state.explosions ) ex.elapsed += dt * 1000;
  state.explosions = state.explosions.filter( ex => ex.elapsed < EXPLOSION_DURATION );
}

function update( dt ) {
  if ( state.phase === 'paused' ) return;
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

state.ball.speed = LEVELS[ 0 ].speed;
state.blocks = createBlocks( state.level );

loadSpritesheet( () => {
  lastTime = performance.now();
  requestAnimationFrame( frame );
} );
