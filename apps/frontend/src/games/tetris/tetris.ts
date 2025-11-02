import { GameLoop } from '@game-engine/index';
import type { RuntimeContext, GameRuntime, GameRegistryApi } from '@game-engine/index';

type Shape = number[][];

const SHAPES: Shape[] = [
  [[1, 1, 1, 1]],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1],
    [1, 1],
  ],
];

const COLORS = ['#f43f5e', '#22d3ee', '#a855f7', '#f97316', '#38bdf8'];

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;

interface Piece {
  matrix: Shape;
  x: number;
  y: number;
  color: string;
}

function createPiece(): Piece {
  const index = Math.floor(Math.random() * SHAPES.length);
  return {
    matrix: SHAPES[index].map((row) => [...row]),
    x: Math.floor(COLS / 2) - 1,
    y: 0,
    color: COLORS[index],
  };
}

function rotate(matrix: Shape) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function collide(board: number[][], piece: Piece) {
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      if (
        piece.matrix[y][x] &&
        (board[y + piece.y] === undefined || board[y + piece.y][x + piece.x] !== 0)
      ) {
        return true;
      }
    }
  }
  return false;
}

class TetrisRuntime implements GameRuntime {
  private board: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  private loop = new GameLoop((delta) => this.update(delta));
  private piece: Piece = createPiece();
  private dropCounter = 0;
  private dropInterval = 500;
  private context: CanvasRenderingContext2D;
  private score = 0;
  private running = false;

  constructor(private readonly runtimeContext: RuntimeContext) {
    const ctx = runtimeContext.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    this.context = ctx;
    runtimeContext.canvas.width = COLS * CELL_SIZE;
    runtimeContext.canvas.height = ROWS * CELL_SIZE;
    this.draw();
    this.bindInput();
  }

  start() {
    this.running = true;
    this.loop.start();
  }

  pause() {
    this.running = false;
    this.loop.pause();
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.loop.start();
  }

  reset() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.piece = createPiece();
    this.dropCounter = 0;
    this.score = 0;
    this.runtimeContext.onScoreUpdate(this.score);
    this.draw();
    this.loop.reset();
    this.loop.start();
  }

  dispose() {
    this.loop.dispose();
    window.removeEventListener('keydown', this.handleKey);
  }

  private bindInput() {
    window.addEventListener('keydown', this.handleKey);
  }

  private handleKey = (event: KeyboardEvent) => {
    if (!this.running) return;
    if (event.key === 'ArrowLeft') {
      this.move(-1);
    } else if (event.key === 'ArrowRight') {
      this.move(1);
    } else if (event.key === 'ArrowDown') {
      this.drop();
    } else if (event.key === 'ArrowUp') {
      const rotated = rotate(this.piece.matrix);
      const original = this.piece.matrix;
      this.piece.matrix = rotated;
      if (collide(this.board, this.piece)) {
        this.piece.matrix = original;
      }
    }
  };

  private move(offset: number) {
    this.piece.x += offset;
    if (collide(this.board, this.piece)) {
      this.piece.x -= offset;
    } else {
      this.draw();
    }
  }

  private drop() {
    this.piece.y += 1;
    if (collide(this.board, this.piece)) {
      this.piece.y -= 1;
      this.merge();
      this.clearLines();
      this.piece = createPiece();
      if (collide(this.board, this.piece)) {
        this.endGame();
      }
    }
    this.draw();
    this.dropCounter = 0;
  }

  private merge() {
    this.piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.board[y + this.piece.y][x + this.piece.x] = COLORS.indexOf(this.piece.color) + 1;
        }
      });
    });
  }

  private clearLines() {
    let cleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y -= 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (this.board[y][x] === 0) continue outer;
      }
      const row = this.board.splice(y, 1)[0].fill(0);
      this.board.unshift(row);
      cleared += 1;
      y += 1;
    }
    if (cleared > 0) {
      this.score += cleared * 100;
      this.runtimeContext.onScoreUpdate(this.score);
      this.dropInterval = Math.max(150, this.dropInterval - cleared * 10);
    }
  }

  private endGame() {
    this.pause();
    this.runtimeContext.onGameOver(this.score);
  }

  private update(delta: number) {
    this.dropCounter += delta;
    if (this.dropCounter > this.dropInterval) {
      this.drop();
    }
  }

  private draw() {
    this.context.fillStyle = '#0f172a';
    this.context.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.drawCell(x, y, COLORS[value - 1]);
        }
      });
    });

    this.piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.drawCell(x + this.piece.x, y + this.piece.y, this.piece.color);
        }
      });
    });
  }

  private drawCell(x: number, y: number, color: string) {
    this.context.fillStyle = color;
    this.context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  }
}

export function registerTetris(registry: GameRegistryApi) {
  registry.register({
    key: 'tetris',
    name: 'Tetris',
    description: 'Rotate and stack falling tetrominos to clear lines.',
    genre: 'Puzzle',
    createRuntime: (context: RuntimeContext) => new TetrisRuntime(context),
  });
}
